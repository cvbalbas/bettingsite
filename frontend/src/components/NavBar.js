import React, {useState, useEffect} from 'react'
import '../App.css';
import logo from '../images/Logo.png'
import { logOut } from "../firebase/authMethods";
import currency from "../images/moneybag.png"


export default function NavBar({ openLoginModal, openSignupModal, user, setUser, selectedOdds, setBetsOpen, betsOpen, handleClearAllBets, walletBalance, loading, setLoading, setRole, setPhoneSetUp}) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications/${user.uid}`);
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const markNotificationsRead = async () => {
    await fetch('/api/mark-notifications-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid }),
    });
    // setNotifications([]); // Clear UI after marking read
  };
  
  useEffect(() => {
    if (showNotifications) {
      markNotificationsRead();
    }
  }, [showNotifications]);
  

  const handleLogOut = async () => {
    logOut()
    .then(() => {
      setPhoneSetUp(false)
      setUser(null);
      setBetsOpen(false);
      handleClearAllBets();
      setLoading(false);
      setRole(null)
      
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    })
    .catch((error) => {
      // console.error('Logout failed:', error);
      setLoading(false);
    });
  }

    // Get the user when the component mounts
    useEffect(() => {
      // console.log(user)
    }, [user, loading]);

  
  return (
    <div className='logo-bar m-auto col-lg-10 col-sm-12 col-12 d-flex justify-content-between align-items-center'>
        <div className='d-flex align-items-center
        '>
            <a className="mouse-pointer" href = "/"><img src = {logo} alt = 'Logo' className='logo'/></a>
        </div>
        {loading ? (<></>) : (<>
        {user === null ? ( <div>
            <button onClick ={openLoginModal} className='btn btn-prim text-white fw-bold p-2 m-2'>Log in</button>
            <button onClick={openSignupModal} className='btn border sfw-bold text-white p-2'>Create Account</button>
        </div> ) : 
        (<div className='d-flex align-items-center m-2'> 
          <a className='d-flex align-items-center pt-1 balance mouse-pointer text-decoration-none' href = "/account">
          <div className='font-18 fw-bold'>{walletBalance}</div>
          <div className='currency p-0'><img src = {currency} className='currencyImg me-5' alt='coins'/></div>          
          </a>
          <div>
          <div className="btn-group">
            <button type="button" className="btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
            <svg width="20" height="20" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M34.1819 38.0107C23.6432 38.0107 15.2122 29.5797 15.2122 19.041C15.2122 8.63399 23.6432 0.0712891 34.1819 0.0712891C44.5889 0.0712891 53.1516 8.63399 53.1516 19.041C53.1516 29.5797 44.5889 38.0107 34.1819 38.0107ZM51.0438 42.2261C60.2652 42.2261 67.9058 49.8667 67.9058 59.0881V61.1958C67.9058 64.7526 65.0076 67.519 61.5825 67.519H6.78123C3.22442 67.519 0.458008 64.7526 0.458008 61.1958V59.0881C0.458008 49.8667 7.96684 42.2261 17.3199 42.2261H24.5653C27.4635 43.6752 30.7568 44.3339 34.1819 44.3339C37.607 44.3339 40.7686 43.6752 43.6667 42.2261H51.0438Z" fill="#BBBDBF"/>
            </svg>
            </button>
            <ul className="dropdown-menu dropdown-menu-end text-end">
              <li><a className="dropdown-item mouse-pointer" href = "/account">Account</a></li>
              <li><span className="dropdown-item mouse-pointer" onClick={() => {handleLogOut()}} >Logout</span></li>
            </ul>
          </div>
          </div>
          <div className="btn-group ps-1">
          <div onClick={() => setShowNotifications(!showNotifications)} className="notification-icon  dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#BBBDBF" className="bi bi-bell-fill" viewBox="0 0 16 16">
              <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2m.995-14.901a1 1 0 1 0-1.99 0A5 5 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901"/>
            </svg>
            {notifications.length > 0 && <span className="badge rounded-pill bg-orange notif unselectable">{notifications.length}</span>}
          </div>
          
            <div className={`dropdown-menu dropdown-menu-end dropdown-notification ${showNotifications ? 'show' : ''}`}>
              {notifications.length > 0 ? (
                notifications.map((notif, index) => (
                  <div key={index} className="notification-item"
                  dangerouslySetInnerHTML={{ __html: notif.message }}>
                    
                  </div>
                ))
              ) : (
                <div className="notification-item">No new notifications</div>
              )}
            </div>
          
          </div>
          <div className='mouse-pointer ps-3' onClick={() => setBetsOpen(!betsOpen)}>
            <svg  height="20" viewBox="0 0 52 68" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M47.9272 0.597197C49.3734 -0.454619 51.3456 0.46572 51.3456 2.17492V65.2839C51.3456 67.1246 49.2419 68.0449 47.9272 66.9931L42.931 61.0767L35.6998 66.9931C35.3054 67.2561 34.9109 67.519 34.385 67.519C33.9906 67.519 33.5962 67.2561 33.2017 66.9931L26.102 61.0767L18.8707 66.9931C18.4763 67.2561 18.0819 67.519 17.5559 67.519C17.1615 67.519 16.7671 67.2561 16.3727 66.9931L9.27289 61.0767L4.14528 66.9931C2.83051 68.0449 0.858356 67.1246 0.858356 65.2839V2.17492C0.858356 0.46572 2.83051 -0.454619 4.14528 0.597197L9.27289 6.38219L16.3727 0.597197C16.7671 0.334243 17.1615 0.0712891 17.6874 0.0712891C18.0819 0.0712891 18.4763 0.334243 18.8707 0.597197L26.102 6.38219L33.2017 0.597197C33.5962 0.334243 33.9906 0.0712891 34.5165 0.0712891C34.9109 0.0712891 35.3054 0.334243 35.6998 0.597197L42.931 6.38219L47.9272 0.597197ZM42.931 47.403V45.2994C42.931 44.7735 42.4051 44.2476 41.8792 44.2476H10.3247C9.66732 44.2476 9.27289 44.7735 9.27289 45.2994V47.403C9.27289 48.0604 9.66732 48.4549 10.3247 48.4549H41.8792C42.4051 48.4549 42.931 48.0604 42.931 47.403ZM42.931 34.7812V32.6776C42.931 32.1517 42.4051 31.6258 41.8792 31.6258H10.3247C9.66732 31.6258 9.27289 32.1517 9.27289 32.6776V34.7812C9.27289 35.4386 9.66732 35.8331 10.3247 35.8331H41.8792C42.4051 35.8331 42.931 35.4386 42.931 34.7812ZM42.931 22.1594V20.0558C42.931 19.5299 42.4051 19.004 41.8792 19.004H10.3247C9.66732 19.004 9.27289 19.5299 9.27289 20.0558V22.1594C9.27289 22.8168 9.66732 23.2113 10.3247 23.2113H41.8792C42.4051 23.2113 42.931 22.8168 42.931 22.1594Z" fill="#BBBDBF"/>
            </svg>
            {selectedOdds.length !== 0 ? (
              <sup className='neg-margin'><span className="badge rounded-pill bg-orange">{selectedOdds.length}</span></sup>) :
              ( <sup></sup>
            )}
          </div>

            {/* <button onClick={handleLogOut} className='btn border fw-bold text-white p-2 m-2'>Logout</button> */}

        </div>
        )}
        </>)}

    </div>
  )
}
