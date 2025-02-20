import React, { useState, useEffect } from "react";
import { Modal } from 'react-bootstrap';


const ProductDisplay = () => (
  <section>
    <div className="product">
      <img
        src="https://i.imgur.com/EHyR2nP.png"
        alt="The cover of Stubborn Attachments"
      />
      <div className="description">
      <h3>Stubborn Attachments</h3>
      <h5>$20.00</h5>
      </div>
    </div>
    <form action="/create-checkout-session" method="POST">
      <button type="submit">
        Checkout
      </button>
    </form>
  </section>
);

const Message = ({ message }) => (
  <section>
    <p>{message}</p>
  </section>
);

export default function CheckoutPremium({ showModal, closeModal, user, isPremium, setIsPremium }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search);

    if (query.get("success")) {
      setMessage("Order placed! You will receive an email confirmation.");
    }

    if (query.get("canceled")) {
      setMessage(
        "Order canceled -- continue to shop around and checkout when you're ready."
      );
    }
  }, []);

  return (
    <Modal className='modal' show={showModal} onHide={closeModal} size="lg" centered>
      <Modal.Header closeButton className="bg-lightgreen text-white modal-head ">
        <Modal.Title className='fw-bold font-20'></Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-lightgreen text-lightgrey">
        {message ? (
            <Message message={message} />
        ) : (
            <ProductDisplay />
        )}
      </Modal.Body>
    </Modal>
  )
}