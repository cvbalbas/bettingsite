import React from 'react'
import { Modal } from 'react-bootstrap';

export default function Disclaimer({ showModal, closeModal}) {
  return (
    <Modal show={showModal} centered>
    <Modal.Header className="bg-lightgreen text-white modal-head">
      <Modal.Title className="fw-bold">Disclaimer</Modal.Title>
    </Modal.Header>
    <Modal.Body className="bg-lightgreen text-white">
    This website is a <strong className='text-orange'>fantasy betting platform</strong> designed for entertainment and educational purposes only. <br/> <br/>
    <strong className='text-orange'>No real money is involved, and no actual financial transactions are taking place.</strong> <br/> <br/>
    The "bets" you make here use virtual currency, and any gains or losses are purely fictional. <br/> <br/>
    This platform <strong className='text-orange'>does not offer any form of real-world gambling</strong>.
    </Modal.Body>
    <Modal.Footer className="bg-lightgreen border-top-0 justify-content-center">
        <button className="mt-3 w-100 btn btn-prim text-white fw-bold" onClick={closeModal}>I Acknowledge</button>
    </Modal.Footer>
  </Modal>
  )
}
