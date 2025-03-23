import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import currency from "../images/moneybag.png"
import { getAuth, onAuthStateChanged } from 'firebase/auth';  // Make sure to import Firebase auth
import axios from 'axios';

export default function PremiumModal({ showModal, closeModal, user, isPremium, setIsPremium, openSignupModal}) {
  const [loading] = useState('false')

  const handlePremiumTrial = () => {
    const auth = getAuth(); // Initialize the Firebase auth
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          try {
            const oneMonthFromNow = new Date();
            oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
            
            const token = await user.getIdToken(); // Get Firebase Auth Token
            const response = await fetch('/api/upgradePremiumTrial', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Send the token in headers
              },
              body: JSON.stringify({"expiresAt": oneMonthFromNow.toISOString()}),
            });
            const data = await response.json();
            setIsPremium({
              isPremium: false,
              isPremiumTrial: true,
              trialExpiresAt: oneMonthFromNow.toISOString(),
            })
            // console.log('User Info:', data);
            closeModal();
            //window.location.href = "/account"
          } catch (error) {
            console.error('Error getting wallet balance:', error);
          }
        } else {
          openSignupModal()
        }
      });
    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }

  const handlePremiumUpgrade = async () => {
    try {
      const response = await axios.post('/create-checkout-session');
      if (response.data.url) {
        // Redirect the user to the Stripe checkout page
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Something went wrong. Please try again.');
    }
  }

  useEffect(() => {
      // console.log(isPremium)
  }, [isPremium])
  
  return (
    <Modal className='modal' show={showModal} onHide={closeModal} size="lg" centered>
      <Modal.Header closeButton className="bg-lightgreen text-white modal-head ">
        <Modal.Title className='fw-bold font-20'>Choose Your Plan</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-lightgreen text-lightgrey">
        {loading === 'false' ? (
          <div className="text-start d-flex justify-content-around">
          {/* Basic Plan */}
          <div className=" rounded basic py-4 px-3 mx-1 w-100">
            <h4 className="mb-3 font-15 text-white mx-2">Basic</h4>
            <div className="font-20 fw-bold text-white text-center"><h2 className=' fw-bold '>FREE</h2></div>
            <div className='font-12 fst-italic text-center'>&nbsp;</div>
            <table className='pricing m-auto'>
                <tbody>
                <tr>
                    <td>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-check-lg" viewBox="0 0 16 16">
                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
                        </svg>
                    </td>
                    <td>
                        <div className='d-flex align-items-center'>FREE 1000 <div className='currency p-0 m-0'><img src = {currency} className='currencyImg me-2 ms-1' alt='coins'/></div></div>         
                    </td>
                </tr>
                <tr>
                    <td>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-check-lg" viewBox="0 0 16 16">
                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
                        </svg>
                    </td>
                    <td>
                        Decimal Odds      
                    </td>
                </tr>
                <tr>
                    <td className='text-orange'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" fill="currentColor" className="bi bi-x" viewBox="0 0 16 16">
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                        </svg>
                    </td>
                    <td>
                        Switch to Percentage Odds         
                    </td>
                </tr>
                </tbody>
            </table>
           
          </div>

          {/* Premium Plan */}
          <div className=" bg-darkblue rounded py-4 px-3 mx-1 w-100">
            <h4 className="mb-3 font-15 text-white mx-2">Premium</h4>
            <div className="font-20 text-orange fw-bold text-center"><h2 className=' fw-bold '>&pound;
            50</h2></div>
            <div className='font-12 fst-italic text-center'>One-time Payment</div>
            <table className='pricing m-auto mt-3'>
                <tbody>
                  {isPremium.isPremiumTrial ? (<></>) : (
                    <tr>
                    <td>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-check-lg" viewBox="0 0 16 16">
                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
                        </svg>
                    </td>
                    <td>
                        <div className='d-flex align-items-center'>One Month Free Trial</div>         
                    </td>
                </tr>
                  )}
                
                <tr>
                    <td>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-check-lg" viewBox="0 0 16 16">
                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
                        </svg>
                    </td>
                    <td>
                        <div className='d-flex align-items-center'>Plus 500 <div className='currency p-0 m-0'><img src = {currency} className='currencyImg me-2 ms-1' alt='coins'/></div></div>         
                    </td>
                </tr>
                <tr>
                    <td>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-check-lg" viewBox="0 0 16 16">
                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
                        </svg>
                    </td>
                    <td>
                        Decimal Odds      
                    </td>
                </tr>
                <tr>
                    <td>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-check-lg" viewBox="0 0 16 16">
                        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
                        </svg>
                    </td>
                    <td>
                        Switch to Percentage Odds         
                    </td>
                </tr>
                </tbody>
            </table>
          </div>
        </div>
        ) : loading === 'processing' ? (
          <div>Payment is Processing...</div>
        ) : (
          <div>Payment Successful. Wait to be redirected...</div>
        )}

        
      </Modal.Body>
      <Modal.Footer className="bg-lightgreen text-lightgrey">
        <button className=" btn border fw-bold text-white p-2" onClick={closeModal}>
            Stay with Basic
        </button>
        <Button type="submit" className="btn btn-prim text-white fw-bold" 
          onClick={isPremium.isPremiumTrial ? 
          handlePremiumUpgrade
          : handlePremiumTrial }>
          {isPremium.isPremiumTrial ? 
          'Upgrade to Premium' 
          : 'Try Premium for FREE'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
