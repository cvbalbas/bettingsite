import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import moneyDiv from "../images/moneyDiv.png"
import { getAuth, onAuthStateChanged } from 'firebase/auth';  // Make sure to import Firebase auth

export default function AddCoinsModal({ showModal, closeModal, setUser, user, setCoinsToAdd}) {
  const [quantity, setQuantity] = useState(1); // Default to 1

  const handleCheckout = async () => {
    const checkout = async () => {
      try {
        const response = await fetch('/create-checkout-session-coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        });
        console.log(quantity)
        const data = await response.json();
        if (data.url) {
          setCoinsToAdd(quantity)
          window.location.href = data.url; // Redirect to Stripe checkout
        }
      } catch (error) {
        console.error('Error during checkout:', error);
      }
    }
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // Redirect if no user is logged in
        closeModal()
        setUser(null)
      } else {
        setUser(currentUser);
        checkout()
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
    
  };

  return (
    <Modal className='modal' show={showModal} onHide={closeModal} size="sm" centered>
      <Modal.Header closeButton className="bg-lightgreen text-white modal-head ">
        <Modal.Title className='fw-bold font-20'>Shop Coins</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-lightgreen text-lightgrey">
        <div className='d-flex justify-content-center align-items-center'>
          <div className='col-5'>
            <img src = {moneyDiv} className='addCoinsImg' alt='coins'/>
          </div>
          <div className='col-7 ps-2'>
            <span className='font-20 text-white fw-bold'>1000 coins</span><br/>
            <span className='font-15 text-orange fw-bold'>&pound;10.00</span><br/><br/>
            <input className='input inputBet fw-bold bg-darkblue rounded' id="walletBalance"
            type="number"
            value={quantity}
            min="1"
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}/>
          </div>
        </div>
      <div>

      </div>
        
      </Modal.Body>
      <Modal.Footer className="bg-lightgreen text-lightgrey">
        <Button type="submit" className="btn btn-prim text-white fw-bold" 
          onClick={handleCheckout}>
          Checkout
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
