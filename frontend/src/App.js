import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import AccountSettings from './components/AccountSettings';
import NavBar from './components/NavBar';
import BetsSidebar from './components/BetsSidebar';
import LoginModal from './components/Login';
import SignupModal from './components/Register';
import Disclaimer from './components/Disclaimer';
import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';  // Make sure to import Firebase auth

function App() {
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance]= useState('')
  const [selectedOdds, setSelectedOdds] = useState(() => {
    // Load selectedOdds from localStorage or initialize as an empty array if none exists
    const savedOdds = localStorage.getItem('selectedOdds');
    return savedOdds ? JSON.parse(savedOdds) : [];
  });
  const [betsOpen, setBetsOpen] = useState(() => {
    // Load betsAmount from localStorage or initialize to 0
    const savedBetsOpen = localStorage.getItem('betsOpen');
    return savedBetsOpen === "true";
  });
  const [betAmounts, setBetAmounts] = useState(() => {
    // Load betsAmount from localStorage or initialize to 0
    const savedAmount = localStorage.getItem('betsAmounts');
    return savedAmount ? JSON.parse(savedAmount) : {};
  });
  const [estimatedPayouts, setEstimatedPayouts] = useState(() => {
    // Load estimatedPayout from localStorage or initialize to 0
    const savedPayout = localStorage.getItem('estimatedPayouts');
    return savedPayout ? JSON.parse(savedPayout) : {};
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState({
    isPremium: false,
    isPremiumTrial: false,
    trialExpiresAt: null,
  });



  useEffect(() => {
    
    const fetchBalance = async (currentUser) => {
      // console.log(currentUser)
      try {
        const response = await fetch('/api/user-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({currentUser}),
        });
        const data = await response.json();
        setWalletBalance(data.results[0]["wallet_balance"])
        setIsPremium({
          isPremium: Boolean(data.results[0]["isPremium"]),
          isPremiumTrial: Boolean(data.results[0]["isPremiumTrial"]),
          trialExpiresAt: data.results[0]["trialExpiresAt"],
        })
        console.log('User Info:', data);
      } catch (error) {
        console.error('Error getting wallet balance:', error);
      }
    };

    const auth = getAuth(); // Initialize the Firebase auth
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Set the logged-in user
        console.log(currentUser)
        fetchBalance(currentUser)
        
      } else {
        setUser(null); // Clear user state if logged out
      }
      setLoading(false)
    });
    console.log(user)
    console.log(walletBalance)

    // Cleanup the listener on component unmount
    return () => unsubscribe();

  

  }, [user, walletBalance]);
  // Update localStorage whenever selectedOdds changes
  useEffect(() => {
    console.log(selectedOdds)
    localStorage.setItem('selectedOdds', JSON.stringify(selectedOdds));
  }, [selectedOdds]);

  // Update localStorage whenever betsAmount changes
  useEffect(() => {
    console.log(betAmounts)
    localStorage.setItem('betsAmounts', JSON.stringify(betAmounts));
  }, [betAmounts]);

  // Update localStorage whenever estimatedPayout changes
  useEffect(() => {
    console.log(estimatedPayouts)
    localStorage.setItem('estimatedPayouts', JSON.stringify(estimatedPayouts));
  }, [estimatedPayouts]);

  useEffect(() => {
    console.log(betsOpen)
    localStorage.setItem('betsOpen', betsOpen);
  }, [betsOpen]);

  const handleClearAllBets = () => {
    setSelectedOdds([]); // Clear all selected bets
    setBetAmounts({});   // Reset all bet amounts
    setEstimatedPayouts({}); // Reset all estimated payouts
  };

  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  const openSignupModal = () => setSignupModalOpen(true);
  const closeSignupModal = () => setSignupModalOpen(false);

  const openDisclaimerModal = () => setDisclaimerOpen(true);
  const closeDisclaimerModal = () => setDisclaimerOpen(false);
  
  // Function to close the sidebar
  const closeSidebar = () => {
    setBetsOpen(false);
  };


  

  return (
    <div>
      <div className='top-nav bg-black'></div>
      <div className='bot-nav bg-black shadow-box'></div>
      <LoginModal showModal={loginModalOpen} closeModal={closeLoginModal} user = {user} setUser = {setUser} setSignupModalOpen={setSignupModalOpen} />
      <SignupModal showModal={signupModalOpen} closeModal={closeSignupModal} user = {user} setUser = {setUser} setLoginModalOpen={setLoginModalOpen} setDisclaimerOpen = {setDisclaimerOpen} />
      <Disclaimer showModal={disclaimerOpen} closeModal={closeDisclaimerModal} user = {user} setUser = {setUser}/>


      <div className="App d-flex">
        <div className={`m-auto ${betsOpen ? 'home':'homesmall'}`}>
        <NavBar className={`m-auto ${betsOpen ? 'navbar':'navbarsmall'}`} openLoginModal = {openLoginModal} openSignupModal = {openSignupModal} user = {user} setUser = {setUser} selectedOdds={selectedOdds} setBetsOpen={setBetsOpen} betsOpen={betsOpen} handleClearAllBets={handleClearAllBets} walletBalance={walletBalance} loading={loading} setLoading={setLoading}/>
        <BrowserRouter>
          <Routes>
            <Route path = '/' element={<Home user={user} setUser={setUser} walletBalance={walletBalance} setWalletBalance={setWalletBalance} isPremium={isPremium} setIsPremium={setIsPremium} selectedOdds={selectedOdds} setSelectedOdds={setSelectedOdds} betsOpen={betsOpen} setBetsOpen={setBetsOpen} betAmounts={betAmounts} setBetAmounts={setBetAmounts} estimatedPayouts={estimatedPayouts} setEstimatedPayouts={setEstimatedPayouts} handleClearAllBets={handleClearAllBets} />}></Route>
            <Route path = '/account' element={<AccountSettings user={user} walletBalance={walletBalance} isPremium={isPremium} setIsPremium={setIsPremium} />}></Route>
            <Route path = '/login' element={<LoginModal showModal={true} closeModal={closeLoginModal} user = {user} setUser = {setUser} setSignupModalOpen={setSignupModalOpen} />}></Route>

          </Routes>
        </BrowserRouter>
        </div>
        <div className={`animate ${betsOpen ? 'open':'close'}`}>
          <BetsSidebar selectedOdds={selectedOdds} setSelectedOdds={setSelectedOdds} 
          closeSidebar={closeSidebar}  betAmounts = {betAmounts} setBetAmounts = {setBetAmounts} 
          estimatedPayouts={estimatedPayouts} setEstimatedPayouts={setEstimatedPayouts} 
          openSignupModal={openSignupModal} handleClearAllBets={handleClearAllBets} user={user} setWalletBalance={setWalletBalance} />
        </div>
      </div>
    </div>
  );
}

export default App;
