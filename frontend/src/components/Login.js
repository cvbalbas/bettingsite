// LoginModal.js
import React, { useState } from "react";
import { Modal, Button, Form } from 'react-bootstrap';
import { signInWithEmail, signInWithGoogle, resetPassword } from "../firebase/authMethods"; // Import Firebase auth functions

const LoginModal = ({ showModal, closeModal, user, setUser, setSignupModalOpen }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("")


  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const currentuser = await signInWithEmail(email, password);
      setUser(currentuser)
      closeModal(); 
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    } catch (error){
      console.log(error.code)
      switch (error.code) {
        case 'auth/invalid-credential':
          setError("Invalid email or password.")
          break;
        default:
          setError("Something went wrong. Try again later.")
      }
    }
    
  };

  const handleGoogleLogin = async () => {
       const currentUser = await signInWithGoogle();
       if (currentUser ===  "closed"){
          setError("Google Signup process closed. Try Again.");
       } else if (currentUser === "error"){
          setError("Google Signup failed. Try Again.");
       } else {
          setUser(currentUser);
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
       }
  };

  const handleResetPassword = () => {
    if (email){
      resetPassword(email);
      setError('Password reset email sent!')
    }
  };

  return (
    <Modal className='modal' show={showModal} onHide={() => {
      closeModal(); 
      setError(''); 
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      }} centered>
    <Modal.Header closeButton className="bg-lightgreen text-white modal-head">
      <Modal.Title className="fw-bold">Login</Modal.Title>
    </Modal.Header>
    <Modal.Body className="bg-lightgreen text-lightgrey">
      <Form onSubmit={handleLogin}>
        <Form.Group controlId="formEmail">
          <Form.Label className="text-uppercase">Email address</Form.Label>
          <Form.Control type="email" placeholder="Enter email" onChange={(e) => setEmail(e.target.value)} required />
        </Form.Group>

        <Form.Group controlId="formPassword" className="mt-3">
          <Form.Label className="text-uppercase">Password</Form.Label>
          <Form.Control type="password" placeholder="Enter password" onChange={(e) => setPassword(e.target.value)} required />
          <div className={error ? 'd-flex justify-content-between align-items-center' : ''}>
            {error && <div className={`text-end fst-italic pt-2 font-12 ${error ? 'text-orange fw-bold' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#FF8135" className="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/> 
              </svg> {error}
            </div>}

            <div onClick={handleResetPassword} className="text-decoration-underline text-end pt-2 font-12 mouse-pointer">
              Forgot Password
            </div>
            
          </div>
        </Form.Group>
        <Button type="submit" className="mt-3 w-100 btn btn-prim text-white fw-bold">
          Login with Email
        </Button>
      </Form>
      
      <div className="text-center mt-3">
        <span>or</span>
      </div>

      <button className="mt-3 w-100 align-items-center d-flex justify-content-center btn border fw-bold text-white p-2" onClick={async () => {await handleGoogleLogin(); closeModal();}}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-google" viewBox="0 0 16 16">
          <path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z"/>
        </svg> 
        <span className="ps-2"> Login with Google </span>
      </button>
    </Modal.Body>
    <Modal.Footer className="bg-lightgreen border-top-0 justify-content-center">
      <div className="text-center text-white">Looking to <span onClick={() => {closeModal(); setSignupModalOpen(true);}} className="text-orange fw-bold mouse-pointer">create an account</span> ?</div>
    </Modal.Footer>
  </Modal>
  );
};

export default LoginModal;
