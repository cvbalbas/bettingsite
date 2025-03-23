import React, { useEffect } from 'react';
import currency from "../images/moneybag.png"
import empty from "../images/Empty.png"
import { getAuth, onAuthStateChanged } from 'firebase/auth';  // Make sure to import Firebase auth



export default function BetsSidebar ({ selectedOdds, setSelectedOdds, closeSidebar, betAmounts, setBetAmounts, estimatedPayouts, setEstimatedPayouts, openSignupModal, handleClearAllBets, user, setWalletBalance, setShowAlert, setAlertText, setAnimationClass, setUser}) {

  // useEffect(() => {
    
  //   // console.log(selectedOdds)
  //   // console.log(betAmounts)
  // }, [selectedOdds, betAmounts]);


  const handleBetAmountChange = (bet, value) => {
   
    const key = `${bet.id}$${bet.selectedMarket}$${bet.selectedType}`;
    setBetAmounts(prevBetAmounts => ({
      ...prevBetAmounts,
      [key]: value  // Update only the specific bet's amount
    }));
    // Calculate the estimated payout and update the estimatedPayouts state
    const payout = value * bet.selectedOdds;
    setEstimatedPayouts((prevPayouts) => ({
        ...prevPayouts,
        [key]: payout.toFixed(2),
    }));
    // console.log(betAmounts)
    // console.log(estimatedPayouts)
  };
  const removeBet = (bet) => {
    const betKey = `${bet.id}$${bet.selectedMarket}$${bet.selectedType}`;

    // Update selectedOdds by filtering out the bet
    setSelectedOdds((prevOdds) =>
      prevOdds.filter((selectedBet) => selectedBet.id !== bet.id || selectedBet.selectedType !== bet.selectedType || selectedBet.selectedMarket !== bet.selectedMarket)
    );
    // Remove associated betAmount and estimatedPayout
    setBetAmounts((prevAmounts) => {
      const { [betKey]: _, ...newAmounts } = prevAmounts;
      return newAmounts;
    });

    setEstimatedPayouts((prevPayouts) => {
      const { [betKey]: _, ...newPayouts } = prevPayouts;
      return newPayouts;
    });
  };
  const checkUser = () => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // setUser to nothing and open Signup Modal
        setUser(null)
        openSignupModal()
      } else {
        setUser(currentUser);
        saveBets()
        console.log(currentUser)
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }
  const saveBets = async () => {
    console.log(user)
    try {
      const token = await user.getIdToken(); // Get Firebase Auth Token

      const response = await fetch('/api/save-odds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send the token in headers
        },
        body: JSON.stringify({
            selectedOdds,
            betAmounts,
            user,
          })
      });
      const data = await response.json();
      console.log('Odds saved successfully:', data);
      setWalletBalance(data.results[0]["wallet_balance"])
      closeSidebar();
      handleClearAllBets();
      setAlertText('<strong>Successfully placed bets! </strong>');
      setAnimationClass('alert-fade-in');
      setShowAlert(true);

      // Start fade-out after 1 second
      const fadeOutTimeout = setTimeout(() => {
        setAnimationClass('alert-fade-out');
      }, 1000);

      // Remove the alert after the fade-out animation is complete
      const clearAlertTimeout = setTimeout(() => {
        setShowAlert(false);
        setAnimationClass('');
      }, 1500);

      // Cleanup timeouts
      return () => {
        clearTimeout(fadeOutTimeout);
        clearTimeout(clearAlertTimeout);
      };
    } catch (error) {
      console.error('Error saving odds:', error);
    }
  };

   // Calculate the total of all estimated payouts
   const totalEstimatedPayout = Object.values(estimatedPayouts)
   .reduce((sum, payout) => sum + parseFloat(payout), 0); // Convert payout to float and sum them
    
   // Calculate the total of all estimated payouts
    const totalBetAmounts = Object.values(betAmounts)
    .reduce((sum, bet) => sum + parseFloat(bet), 0); // Convert payout to float and sum them

  return (
    <div className = 'd-flex justify-content-end bets-float shadow-left'>
        <div className='bg-green bets-container'>
            <div className='bg-darkgreen top-nav-bets'></div>
            <div className='bg-darkgreen shadow-box bot-nav-bets d-flex align-items-center justify-content-between'>
                <div>
                <svg width="52" height="68" viewBox="0 0 52 68" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M47.9272 0.597197C49.3734 -0.454619 51.3456 0.46572 51.3456 2.17492V65.2839C51.3456 67.1246 49.2419 68.0449 47.9272 66.9931L42.931 61.0767L35.6998 66.9931C35.3054 67.2561 34.9109 67.519 34.385 67.519C33.9906 67.519 33.5962 67.2561 33.2017 66.9931L26.102 61.0767L18.8707 66.9931C18.4763 67.2561 18.0819 67.519 17.5559 67.519C17.1615 67.519 16.7671 67.2561 16.3727 66.9931L9.27289 61.0767L4.14528 66.9931C2.83051 68.0449 0.858356 67.1246 0.858356 65.2839V2.17492C0.858356 0.46572 2.83051 -0.454619 4.14528 0.597197L9.27289 6.38219L16.3727 0.597197C16.7671 0.334243 17.1615 0.0712891 17.6874 0.0712891C18.0819 0.0712891 18.4763 0.334243 18.8707 0.597197L26.102 6.38219L33.2017 0.597197C33.5962 0.334243 33.9906 0.0712891 34.5165 0.0712891C34.9109 0.0712891 35.3054 0.334243 35.6998 0.597197L42.931 6.38219L47.9272 0.597197ZM42.931 47.403V45.2994C42.931 44.7735 42.4051 44.2476 41.8792 44.2476H10.3247C9.66732 44.2476 9.27289 44.7735 9.27289 45.2994V47.403C9.27289 48.0604 9.66732 48.4549 10.3247 48.4549H41.8792C42.4051 48.4549 42.931 48.0604 42.931 47.403ZM42.931 34.7812V32.6776C42.931 32.1517 42.4051 31.6258 41.8792 31.6258H10.3247C9.66732 31.6258 9.27289 32.1517 9.27289 32.6776V34.7812C9.27289 35.4386 9.66732 35.8331 10.3247 35.8331H41.8792C42.4051 35.8331 42.931 35.4386 42.931 34.7812ZM42.931 22.1594V20.0558C42.931 19.5299 42.4051 19.004 41.8792 19.004H10.3247C9.66732 19.004 9.27289 19.5299 9.27289 20.0558V22.1594C9.27289 22.8168 9.66732 23.2113 10.3247 23.2113H41.8792C42.4051 23.2113 42.931 22.8168 42.931 22.1594Z" fill="#BBBDBF"/>
                </svg>
                    My Bets <span className="badge rounded-pill bg-orange">{selectedOdds.length}</span></div>
                <div onClick ={closeSidebar} className='mouse-pointer'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x" viewBox="0 0 16 16">
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                    </svg>
                </div>
            </div>
            <div className='bets-list'>
                <div className='text-end text-grey pt-3 pb-2 px-4 font-12 mouse-pointer' onClick={handleClearAllBets}>Clear all</div>
                {selectedOdds.length > 0 ? (
                selectedOdds.map((bet, index) => (
                <div key={index} className='selected-bet p-3' >
                    <div className='float-end mouse-pointer' onClick={() => removeBet(bet)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash3-fill" viewBox="0 0 16 16">
                            <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                        </svg>
                    </div>
                    <div className='matchName text-start'>{bet.homeTeam} vs {bet.awayTeam}</div>
                    <div className='font-12 text-lightgrey text-start'>{bet.date} - {bet.time}</div>
                    <div className='font-12 text-lightgrey text-start mt-2'>{bet.selectedMarket}</div>
                    <div className='font-15 text-start fw-bold d-flex justify-content-between'>
                        <div className='text-white'>{bet.selectedType}</div>
                        <div className='text-orange'>{bet.selectedOdds}</div>
                    </div>
                    <div className='d-flex justify-content-between align-items-center mt-2 '>
                        <div className='text-start col-6 d-flex bg-darkblue align-items-center justify-content-between p-1 rounded'>
                            <div><input pattern="^\d*(\.\d{0,2})?$" className='input bg-darkblue inputBet' placeholder='0.00' onChange={(e) => handleBetAmountChange(bet, e.target.value)} value={betAmounts[`${bet.id}$${bet.selectedMarket}$${bet.selectedType}`] || ''}/></div>
                            <div className='currency'><img src = {currency} className='currencyImg' alt='coins'/></div>
                        </div>
                        <div className='text-end col-6'>
                            <div className='font-12 text-lightgrey'>Est. Payout</div>
                            <div className='font-15 text-white fw-bold d-flex justify-content-end align-items-center'><div className='pt-1'>{estimatedPayouts[`${bet.id}$${bet.selectedMarket}$${bet.selectedType}`] || '0.00'} </div><div><img src = {currency} className='currencyImg' alt='coins'/></div></div>
                        </div>
                    </div>

                </div>
                ))
            ) : (
            <div className='text-center mt-5'>
                <img src = {empty} className='empty' alt='Empty...' />
                <p className='text-white'><em>Empty...</em> <br/>
                    <strong>Start Betting!</strong>
                </p>
            </div>
            )}
            </div>
            <div className='totalBets'>
                <div className='d-flex justify-content-between align-items-center px-4 pt-4 pb-2' >
                    <div className='font-15 text-white fw-bold d-flex justify-content-end align-items-center'><div className='pt-1'>{totalBetAmounts.toFixed(2)} </div><div><img src = {currency} className='currencyImg' alt='coins' /></div></div>
                    <div className='font-15 text-lightgrey text-end'>Total Bets</div>
                </div>
                <div className='d-flex justify-content-between align-items-center px-4' >
                    <div className='font-15 text-orange fw-bold d-flex justify-content-end align-items-center'><div className='pt-1'>{totalEstimatedPayout.toFixed(2)}</div><div><img src = {currency} className='currencyImg' alt='coins'/></div></div>
                    <div className='font-15 text-orange text-end'>Est. Payout</div>
                </div>
                <div className='text-center px-4 py-2' >
                    <div className='placebet mouse-pointer' onClick={checkUser}>Place Bet</div>
                </div>
            </div>
        </div>
       

    </div>
  )
}