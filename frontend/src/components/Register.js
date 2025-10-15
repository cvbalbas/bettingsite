import React, { useEffect, useState } from "react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle, sendOTP, verifyOTP, logOut  } from "../firebase/authMethods"; 
import { auth } from "../firebase/firebaseConfig"; 
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Modal, Button, Form } from 'react-bootstrap';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

const SignupModal = ({ showModal, closeModal, user, setUser, setLoginModalOpen, setDisclaimerOpen, setWalletBalance, phoneSetUp, setPhoneSetUp, registeredPhone, setRegisteredPhone, setLoading, setIsPremium, setRole}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState(`${phoneSetUp ? 'phoneEntry': 'default'}`); 
 


  useEffect(() => {
    // console.log(user)
    try {
      if (registeredPhone === false && step !== "signup" && user !== null){
        setStep("phoneEntry")
      } else if (registeredPhone === false && step === "signup" && user !== null) {
        setStep("verifyOTP")
      } else {
        setStep(`${phoneSetUp ? 'phoneEntry': 'default'}`)
      }
      
  } catch {

  }
  }, [user, phoneSetUp])
  


  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      const user = await verifyOTP(confirmationResult, otp, auth.currentUser);
      setDisclaimerOpen(true);
      try {
        await saveUser(auth.currentUser, phoneNumber);
      } catch (error){
        console.log(error)
      }
      
      setStep("default"); 
      closeModal();
      setDisclaimerOpen(true)
    } catch (error) {
      if (error.code === "auth/account-exists-with-different-credential") {
        setError("The number is already connected to another account.");
        setStep("phoneEntry")
      } else if (error.code === "auth/invalid-verification-code") {
        setError("Invalid Verification Code.");
        setStep("phoneEntry")
      } else {
        setError("There has been an error. Try again.");
        setStep("phoneEntry")
      }
      
    }
  };

  
  const sendPhoneOTP = async () => {
    try {
      const confirmation = await sendOTP(phoneNumber);
      setConfirmationResult(confirmation);
      setError('');
      setStep("verifyOTP"); 
    } catch (error) {
      setError("Failed to send OTP.");
      setStep("phoneEntry");
    }
  };


  const handleSignup = async (e) => {
    e.preventDefault();
    if (phoneNumber.length > 2) {
      try {
        const phoneExists = await checkPhone(phoneNumber);
  
        if(!phoneExists){
          try {
            setError("")
            await signUpWithEmail(email, password);
            const currentUser = await signInWithEmail(email, password);
            setUser(currentUser)
            setStep("signup")
            await sendPhoneOTP();

            
          } catch(error) {
            switch(error.code) {
              case 'auth/email-already-in-use':
                setError("Email already in use.")
                break;
              case 'auth/weak-password':
                setError("Password should be at least 6 characters.")
                break;
              default:
                setError("Something went wrong. Try again later.")
            }
          }
        } else {
          setStep("default")
          setError("Number already exists.")
        }
  
  
      } catch(error){
        setError("Something went wrong. Try again.")
      }
    } else {
      setError("Enter a valid phone number.")
    }
    
    
    
  };

  const handleGoogleSignup = async () => {
    const currentUser = await signInWithGoogle();
    if (currentUser ===  "closed"){
      setError("Google Signup process closed. Try Again.");
    } else if (currentUser === "error"){
      setError("Google Signup failed. Try Again.");
    } else {
      setUser(currentUser);
    }
  };

  const saveUser = async (currentUser, phoneNumber) => {
    try {
      const response = await fetch('/api/save-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({currentUser, phoneNumber}),
      });
      const data = await response.json();
      setRegisteredPhone(true)
      setWalletBalance("100.00")
      if (data.error){
        console.log(data.error)
      }
      if (!response.ok) {
        console.error(data.error)
        throw new Error(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const checkPhone = async (phoneNumber) => {
    try {
      const response = await fetch('/api/check-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({phoneNumber}),
      });
      const data = await response.json();
      if (data.exists === true) {
        return true
      } else {
        return false
      }

    } catch (error) {
      console.error('Error checking number:', error);
    }
  };


  useEffect(() => {
    // console.log(phoneNumber)
  }, [phoneNumber])

  const handleChange = (value) => {
    setPhoneNumber(`+${value}`);
  };

  const handleLogOut = async () => {
    logOut()
    .then(() => {
      setPhoneSetUp(false)
      setUser(null);
      setLoading(false);
      setIsPremium({
        isPremium: false,
        isPremiumTrial: false,
        trialExpiresAt: null,
      })
      setRole(null)

      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    })
    .catch((error) => {
      setLoading(false);
    });
  }

  return (
    <Modal className='modal' show={showModal} onHide={() => { 
      if(step === 'default'){
        closeModal();
      } else {
        handleLogOut();
      }
      setError('');
      }} centered>
    <Modal.Header closeButton className="bg-lightgreen text-white modal-head">
      <Modal.Title className="fw-bold">{step === "default" ? 'Signup' : step === "phoneEntry" ? 'Register Number' : 'Enter OTP'}</Modal.Title>
    </Modal.Header>
    <Modal.Body className="bg-lightgreen text-lightgrey">
    {step === "default" ? (
      <>
      <Form onSubmit={handleSignup}>
        <Form.Group controlId="formEmail">
          <Form.Label className="text-uppercase">Email address</Form.Label>
          <Form.Control type="email" placeholder="Enter email" onChange={(e) => setEmail(e.target.value)} required />
        </Form.Group>

        <Form.Group controlId="formPassword" className="mt-3">
          <Form.Label className="text-uppercase">Password</Form.Label>
          <Form.Control type="password" placeholder="Enter password" onChange={(e) => setPassword(e.target.value)} required />
        </Form.Group>
        <Form.Group controlId="formPhone" className="mt-3">
        <div>
            <Form.Label>PHONE NUMBER</Form.Label>
            <Tooltip 
            title="We securely store phone numbers just like passwords, ensuring they remain inaccessible to developers or anyone else. This means we cannot use them to contact you or send messages. Their sole purpose is to prevent duplicate accounts and maintain fair play." 
            placement="right-end" arrow>
              <IconButton sx={{ fontSize: 15 }}>
                <InfoIcon sx={{ fontSize: 15 }}/>
              </IconButton>
            </Tooltip>
          </div>
          <PhoneInput
            country={"gb"} 
            preferredCountries={["us", "gb", "ph", "in"]}
            enableSearch={false}
            value={phoneNumber}
            onChange={handleChange}
            inputClass="form-control"
            containerClass="intl-tel-input"
            className="phone"
          />
        </Form.Group>
        {error && <div className="text-end fst-italic pt-2 font-12">{error}</div>}
        <Button type="submit" className="mt-3 w-100 btn btn-prim text-white fw-bold">
        Sign Up & Verify Phone
        </Button>
      </Form>
      <div className="text-center mt-3">
        <span>or</span>
      </div>

      <button className="mt-3 w-100 align-items-center d-flex justify-content-center btn border fw-bold text-white p-2" onClick={async () => {await handleGoogleSignup(); closeModal();}}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-google" viewBox="0 0 16 16">
          <path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z"/>
        </svg> 
        <span className="ps-2"> Signup with Google </span>
      </button>
      </>
    ): step === "phoneEntry" ? (
      <Form onSubmit={(e) => { e.preventDefault(); sendPhoneOTP(); }}>
        <Form.Group controlId="formPhone">
          <div>
            <Form.Label>PHONE NUMBER</Form.Label>
            <Tooltip 
            title="We securely store phone numbers just like passwords, ensuring they remain inaccessible to developers or anyone else. This means we cannot use them to contact you or send messages. Their sole purpose is to prevent duplicate accounts and maintain fair play." 
            placement="right-end" arrow>
              <IconButton size="small">
                <InfoIcon fontSize="small"/>
              </IconButton>
            </Tooltip>
          </div>
          <PhoneInput
            country={"gb"} 
            preferredCountries={["gb", "us", "ph", "in"]}
            enableSearch={false}
            value={phoneNumber}
            onChange={handleChange}
            inputClass="form-control"
            containerClass="intl-tel-input"
            className="phone"
          />
        </Form.Group>
        {error && <div className="text-end fst-italic pt-2 font-12">{error}</div>}        <Button type="submit" className="mt-3 w-100 btn btn-prim text-white fw-bold">
          Send OTP
        </Button>
      </Form>
    ) : (
      <Form onSubmit={handleVerifyOTP}>
        <Form.Group controlId="formOtp">
          <Form.Control type="text" 
          name="otp_code"
          placeholder="" 
          autoComplete="off"
          inputMode="numeric"
          pattern="[0-9]*"
          defaultValue=""
          onChange={(e) => setOtp(e.target.value)} required />
        </Form.Group>
        {error && <div className="text-end fst-italic pt-2 font-12">{error}</div>}        <Button type="submit" className="mt-3 w-100 btn btn-prim text-white fw-bold">
          Verify OTP
        </Button>
      </Form>
    )}
    </Modal.Body>
    <Modal.Footer className="bg-lightgreen border-top-0 justify-content-center">
    {step === "default" ? (
      <div className="text-center text-white">Already have an account? <span onClick={() => {closeModal(); setLoginModalOpen(true);}} className="text-orange fw-bold mouse-pointer">Login</span></div>
    ) : step === "phoneEntry" ? '' : ''}
    </Modal.Footer>
  </Modal>
    
  );
};

export default SignupModal;
