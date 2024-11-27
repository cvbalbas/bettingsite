// SignupModal.js
import React, { useState } from "react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle, getCurrentUser } from "../firebase/authMethods"; // Import Firebase auth functions
import { Modal, Button, Form } from 'react-bootstrap';


const SignupModal = ({ showModal, closeModal, user, setUser, setLoginModalOpen, setDisclaimerOpen }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("")

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await signUpWithEmail(email, password);
      const currentUser = await signInWithEmail(email, password);
      setUser(currentUser)
      console.log(currentUser)
      await saveUser(currentUser);
      closeModal(); 
      setDisclaimerOpen(true)
    } catch(error) {
      console.log(error)
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
  };

  const handleGoogleSignup = async () => {
    const currentUser = await signInWithGoogle();
    setUser(currentUser);
    console.log(currentUser);
    await saveUser(currentUser);
    setDisclaimerOpen(true)
  };

  const saveUser = async (currentUser) => {
    console.log(currentUser)
    try {
      const response = await fetch('/api/save-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({currentUser}),
      });
      const data = await response.json();
      console.log('User saved successfully:', data);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  return (
    <Modal className='modal' show={showModal} onHide={() => {closeModal(); setError('');}} centered>
    <Modal.Header closeButton className="bg-lightgreen text-white modal-head">
      <Modal.Title className="fw-bold">Signup</Modal.Title>
    </Modal.Header>
    <Modal.Body className="bg-lightgreen text-lightgrey">
      <Form onSubmit={handleSignup}>
        <Form.Group controlId="formEmail">
          <Form.Label className="text-uppercase">Email address</Form.Label>
          <Form.Control type="email" placeholder="Enter email" onChange={(e) => setEmail(e.target.value)} required />
        </Form.Group>

        <Form.Group controlId="formPassword" className="mt-3">
          <Form.Label className="text-uppercase">Password</Form.Label>
          <Form.Control type="password" placeholder="Enter password" onChange={(e) => setPassword(e.target.value)} required />
        </Form.Group>
        {error && <div className="text-end fst-italic pt-2 font-12">{error}</div>}
        <Button type="submit" className="mt-3 w-100 btn btn-prim text-white fw-bold">
        Sign Up with Email
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
    </Modal.Body>
    <Modal.Footer className="bg-lightgreen border-top-0 justify-content-center">
      <div className="text-center text-white">Already have an account? <span onClick={() => {closeModal(); setLoginModalOpen(true);}} className="text-orange fw-bold mouse-pointer">Login</span></div>

    </Modal.Footer>
  </Modal>
    
  );
};

export default SignupModal;