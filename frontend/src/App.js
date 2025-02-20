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
import PremiumModal from './components/PremiumModal';
// import CheckoutPremium from './components/CheckoutPremium';
import AddCoinsModal from './components/AddCoinsModal';
import AdminDashboard from './components/AdminDashboard'
import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';  // Make sure to import Firebase auth
import { Navigate } from 'react-router-dom';

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

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
  const [phoneSetUp, setPhoneSetUp] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState({
    isPremium: false,
    isPremiumTrial: false,
    trialExpiresAt: null,
  });

  const [coinsToAdd, setCoinsToAdd] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [animationClass, setAnimationClass] = useState('');


  useEffect(() => {
    // Check if the disclaimer has been shown before
    const isDisclaimerShown = localStorage.getItem('isDisclaimerShown');

    if (isDisclaimerShown !== "true") {
      setDisclaimerOpen(true); // Show modal for first-time visitors
    }
  }, []);
  useEffect(() => {
    const fetchUserData = async (currentUser) => {
      if (!currentUser) return; // Ensure currentUser is available before fetching
  
      try {
        const response = await fetch('/api/user-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentUser }),
        });
  
        const data = await response.json();
        setWalletBalance(data.results[0]?.wallet_balance || 0);
        localStorage.setItem('walletBalance', (data.results[0]?.wallet_balance || 0));
        setRole(data.results[0]?.admin ?? false); // Ensure role is always set
        setIsPremium({
          isPremium: Boolean(data.results[0]?.isPremium),
          isPremiumTrial: Boolean(data.results[0]?.isPremiumTrial),
          trialExpiresAt: data.results[0]?.trialExpiresAt || null,
        });
  
        // console.log("User Info:", data);
      } catch (error) {
        console.error("Error getting wallet balance:", error);
      }
    };
  
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        console.log(currentUser);
        await fetchUserData(currentUser);
        if (!currentUser.phoneNumber){
          setSignupModalOpen(true)
          setPhoneSetUp(true)
        }
      } else {
        setUser(null);
        setRole(false); // Ensure role is set to false when logged out
      }
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);

  // Update localStorage whenever selectedOdds changes
  
  useEffect(() => {
    // console.log(selectedOdds)
    localStorage.setItem('selectedOdds', JSON.stringify(selectedOdds));
  }, [selectedOdds]);

  // Update localStorage whenever betsAmount changes
  useEffect(() => {
    // console.log(betAmounts)
    localStorage.setItem('betsAmounts', JSON.stringify(betAmounts));
  }, [betAmounts]);

  // Update localStorage whenever estimatedPayout changes
  useEffect(() => {
    // console.log(estimatedPayouts)
    localStorage.setItem('estimatedPayouts', JSON.stringify(estimatedPayouts));
  }, [estimatedPayouts]);

  useEffect(() => {
    // console.log(betsOpen)
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

  const closeDisclaimerModal = () => {
    setDisclaimerOpen(false);
    localStorage.setItem('isDisclaimerShown', 'true'); // Set the flag in localStorage
  }
  
  // Function to close the sidebar
  const closeSidebar = () => {
    setBetsOpen(false);
  };
  const [premiumModal, setPremiumModal] = useState(false)

  const openPremiumModal = () => setPremiumModal(true);
  const closePremiumModal = () => setPremiumModal(false);

  const [addCoinsModal, setAddCoinsModal] = useState(false)
  const openAddCoinsModal = () => setAddCoinsModal(true);
  const closeAddCoinsModal = () => setAddCoinsModal(false);

  
  return (
    <div>
      <div className='top-nav bg-black'></div>
      <div className='bot-nav bg-black shadow-box'></div>
      <LoginModal showModal={loginModalOpen} closeModal={closeLoginModal} user = {user} setUser = {setUser} setSignupModalOpen={setSignupModalOpen} />
      <SignupModal showModal={signupModalOpen} closeModal={closeSignupModal} user = {user} setUser = {setUser} setLoginModalOpen={setLoginModalOpen} setDisclaimerOpen = {setDisclaimerOpen} setWalletBalance={setWalletBalance} phoneSetUp={phoneSetUp}/>
      <Disclaimer showModal={disclaimerOpen} closeModal={closeDisclaimerModal} user = {user} setUser = {setUser}/>
      <PremiumModal showModal={premiumModal} closeModal={closePremiumModal} user = {user} isPremium={isPremium} setIsPremium={setIsPremium} />
      <AddCoinsModal showModal={addCoinsModal} closeModal={closeAddCoinsModal} user = {user} setCoinsToAdd={setCoinsToAdd}/>


      <div className="App d-flex">
        <div className={`m-auto ${betsOpen ? 'home':'homesmall'}`}>
        <NavBar className={`m-auto ${betsOpen ? 'navbar':'navbarsmall'}`} openLoginModal = {openLoginModal} openSignupModal = {openSignupModal} user = {user} setUser = {setUser} selectedOdds={selectedOdds} setBetsOpen={setBetsOpen} betsOpen={betsOpen} handleClearAllBets={handleClearAllBets} walletBalance={walletBalance} loading={loading} setLoading={setLoading} setRole={setRole} setPhoneSetUp={setPhoneSetUp} />
        <BrowserRouter>
          <Routes>
            <Route path = '/' element={
              <Home user={user} setUser={setUser} walletBalance={walletBalance} setWalletBalance={setWalletBalance} isPremium={isPremium} setIsPremium={setIsPremium} selectedOdds={selectedOdds} setSelectedOdds={setSelectedOdds} betsOpen={betsOpen} setBetsOpen={setBetsOpen} betAmounts={betAmounts} setBetAmounts={setBetAmounts} estimatedPayouts={estimatedPayouts} setEstimatedPayouts={setEstimatedPayouts} handleClearAllBets={handleClearAllBets} openPremiumModal={openPremiumModal} closePremiumModal={closePremiumModal} showAlert={showAlert} setShowAlert={setShowAlert} alertText={alertText} setAlertText={setAlertText} animationClass={animationClass} setAnimationClass={setAnimationClass}/>
              }>
            </Route>
            <Route path = '/admin' element={
              role === null ? null : role ? (
              <AdminDashboard user={user} setUser = {setUser}/>
            ) : (
              <Navigate to="/" replace />
            )
              }>
            </Route>
            <Route path = '/account' element={
              <AccountSettings user={user} walletBalance={walletBalance} setWalletBalance={setWalletBalance} isPremium={isPremium} setIsPremium={setIsPremium} openPremiumModal={openPremiumModal} closePremiumModal={closePremiumModal} openAddCoinsModal={openAddCoinsModal} closeAddCoinsModal={closeAddCoinsModal} coinsToAdd={coinsToAdd}/>}>
            </Route>

            <Route path = '/admin' element={
              <AdminDashboard user={user} setUser={setUser} walletBalance={walletBalance} setWalletBalance={setWalletBalance} isPremium={isPremium} setIsPremium={setIsPremium} selectedOdds={selectedOdds} setSelectedOdds={setSelectedOdds} betsOpen={betsOpen} setBetsOpen={setBetsOpen} betAmounts={betAmounts} setBetAmounts={setBetAmounts} estimatedPayouts={estimatedPayouts} setEstimatedPayouts={setEstimatedPayouts} handleClearAllBets={handleClearAllBets} openPremiumModal={openPremiumModal} closePremiumModal={closePremiumModal} showAlert={showAlert} setShowAlert={setShowAlert} alertText={alertText} setAlertText={setAlertText} animationClass={animationClass} setAnimationClass={setAnimationClass}/>}>
            </Route>

            <Route path = '/login' element={<LoginModal showModal={true} closeModal={closeLoginModal} user = {user} setUser = {setUser} setSignupModalOpen={setSignupModalOpen} />}></Route>

          </Routes>
        </BrowserRouter>
        </div>
        <div className={`animate ${betsOpen ? 'betsOpen':'close'}`}>
          <BetsSidebar selectedOdds={selectedOdds} setSelectedOdds={setSelectedOdds} 
          closeSidebar={closeSidebar}  betAmounts = {betAmounts} setBetAmounts = {setBetAmounts} 
          estimatedPayouts={estimatedPayouts} setEstimatedPayouts={setEstimatedPayouts} 
          openSignupModal={openSignupModal} handleClearAllBets={handleClearAllBets} user={user} setWalletBalance={setWalletBalance} setShowAlert={setShowAlert} setAlertText={setAlertText} setAnimationClass={setAnimationClass} />
        </div>
      </div>
      <div id="recaptcha-container"></div> {/* reCAPTCHA container */}

    </div>
  );
}

export default App;
