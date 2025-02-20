import React, { useEffect, useState } from 'react';

import { getCurrentUser } from "../firebase/authMethods"; // Import Firebase auth functions
import { resetPassword } from "../firebase/authMethods"; // Import Firebase auth functions
import currency from "../images/moneybag.png"

export default function AccountSettings({user, walletBalance, setWalletBalance, isPremium, setIsPremium, openPremiumModal, closePremiumModal, openAddCoinsModal, closeAddCoinsModal, coinsToAdd}) {
  const [transactions, setTransactions] = useState([]);
  const [reset, setReset] = useState(false)
  const [switcher, setSwitcher] = useState('account');
  const [betHistory, setBetHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterType, setFilterType] = useState('all');
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState("");
  const [sortedBets, setSortedBets] = useState([]);

  
  useEffect(() => {
    
    // Fetch user data and last 10 transactions from the backend
    const fetchUserData = async () => {
      try {
        // const currentUser = await getCurrentUser();
        // setUser(currentUser)
        // console.log(user)
        const response =  await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({user}),
        });
        const data = await response.json();
        // console.log(data.results)
        setTransactions(data.results);
      } catch (error) {
        console.error('Error fetching user data', error);
      }
    };

   
    
    if(user) {
      fetchUserData();
    }
    
    
    // console.log(user)
  }, [user, walletBalance]);

  useEffect(() => {
    const verifyPayment = async () => {
      const query = new URLSearchParams(window.location.search);
      const sessionId = query.get("session_id");
      
      if (query.get("success") && sessionId) {
        // console.log(user.uid)
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, uid: user.uid }), // Include `uid`
        });
  
        const data = await response.json();
        if (data.isValid) {
          setMessage("Order placed! You will receive an email confirmation.");
          setOrder("success")
          if(data.premiumChange){
            setIsPremium({ isPremium: true, isPremiumTrial: false, trialExpiresAt: null });
          } 
          if(data.coinsAdded){
            var curWalletBalance = localStorage.getItem("walletBalance")
            setWalletBalance((curWalletBalance*1 + data.coinsAdded*1).toFixed(2))
          }
        } else {
          setOrder("failed")
          setMessage("Payment verification failed. Please contact support.");
        }
      } else if (query.get("cancelled")) {
        setOrder("cancelled")
        setMessage("Order cancelled -- continue to shop around and checkout when you're ready.");
      }
      // Remove the query parameters from the URL
      window.history.replaceState({}, document.title, "/account");
    };

  
   
    
    if(user) {
      verifyPayment();
    }
    
    
    // console.log(user)
  }, [user, setIsPremium]);

  const handleResetPassword = async () => {
    const currentUser = await getCurrentUser();
    let email = currentUser.email
    if (email){
      resetPassword(email);
      setReset(true)
      setTimeout(() => {
        setReset(false);
      }, 60000);
    }
  };
  const getBetsHistory = async () => {
    try {
      // const currentUser = await getCurrentUser();
      // setUser(currentUser)
      // console.log(user)
      const response =  await fetch('/api/bets-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({user}),
      });
      const data = await response.json();
      // console.log(data.results)
      setBetHistory(data.results);
      filterBets(data.results);
    } catch (error) {
      console.error('Error fetching user data', error);
    }
  };

useEffect(() => {
  filterBets(betHistory)
}, [betHistory, filterType, searchTerm])


// Remove duplicates by using a Set
function filterBets(betHistory){
  const uniqueBets = Array.from(new Map(betHistory.map(bet => [bet.bet_id, bet])).values());

  // Filter bets based on search and dropdown selection
  const filteredBets = uniqueBets.filter((bet) => {
    const matchesSearch = bet["bet_type"].toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bet["fixture"].toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bet["bet_market"].toLowerCase().includes(searchTerm.toLowerCase());
  
    const matchesFilter = filterType === 'settled' ? (bet.status === 'won' || bet.status === 'lost')
                       : filterType === 'pending' ? (bet.status === 'pending')
                       : true; // Default: show all
  
    return matchesSearch && matchesFilter;
  });
  
  // Sort by bet date
  const sortedBets = filteredBets.sort((a, b) => {
    const dateA = new Date(a.placed_at);
    const dateB = new Date(b.placed_at);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });
  // console.log(sortedBets)
  setSortedBets(sortedBets)
}


  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };
  function obfuscateEmail(email) {
    const [local, domain] = email.split('@');
  
    if (local.length <= 2) {
      // If the local part is too short, just return the email without changes
      return email;
    }
  
    const obfuscatedLocal = `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`;
    return `${obfuscatedLocal}@${domain}`;
  }

  const obfuscatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 4) return phoneNumber; 
  
    const visibleDigits = 4; // Number of digits to keep visible at the start
    const lastDigits = 2; // Number of digits to keep visible at the end
    const maskedPart = "*".repeat(phoneNumber.length - (visibleDigits + lastDigits));
  
    return phoneNumber.slice(0, visibleDigits) + maskedPart + phoneNumber.slice(-lastDigits);
  };
  return (
    <div className='col-lg-10 col-sm-12 m-auto'>
      <div className='switch col-4 d-flex justify-content-between align-items-center text-center mt-4 p-1 mb-3'>
        <div className={`mouse-pointer p-2 account ${switcher === 'account' ? 'bg-lightgreen': ''}`} onClick={() => setSwitcher('account')}>Account</div>
        <div className={`mouse-pointer p-2 wallet ${switcher === 'bets' ? 'bg-lightgreen': ''}`} onClick={() => { getBetsHistory(); setSwitcher('bets')}}>Bets</div>
      </div>

      <div className='row bg-green shadow-down rounded py-4 mb-5 match-list m-auto'>
        {switcher === 'account' ? ( 
          <>
          <div className='col-12 col-xxl-5 matchMarginAccount my-1'>
          <div className="row g-3 align-items-center mb-3 d-flex">
            <div className="col-4">
              <label htmlFor="emailContainer" className="col-form-label text-grey text-uppercase">Email</label>
            </div>
            <div className="col-8">
              <div className='col-10 col-sm-11'>
                <input 
                  type="text" 
                  id="emailContainer" 
                  className="form-control accountInput" 
                  value={user !== null ?  obfuscateEmail(user.email) : ''} 
                  disabled
                />       
              </div>   
            </div>
          </div>
          <div className="row g-3 align-items-center mt-3">
            <div className="col-4">
              <label htmlFor="pwContainer" className="col-form-label text-grey text-uppercase">Password</label>
            </div>
            <div className="col-8">
              <div className='d-flex align-items-center justify-content-start'>
                <div className='col-10 col-sm-11 bg-darkblue rounded'>
                  <input 
                    type="text" 
                    id="pwContainer" 
                    className="form-control accountInput" 
                    value="******" 
                    disabled
                  />   
                </div>
                <div className='editPass col-2 col-sm-1  p-3 mouse-pointer'  onClick={handleResetPassword}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-fill" viewBox="0 0 16 16">
                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                  </svg>
                </div>
              </div>    
            </div>
          </div>
          <div className="row g-3 align-items-center mt-3">
            <div className="col-4">
              <label htmlFor="pwContainer" className="col-form-label text-grey text-uppercase">Phone Number</label>
            </div>
            <div className="col-8">
              <div className='d-flex align-items-center justify-content-start'>
                <div className='col-10 col-sm-11 bg-darkblue rounded'>
                  <input 
                    type="text" 
                    id="pwContainer" 
                    className="form-control accountInput" 
                    value={user !== null ?  obfuscatePhoneNumber(user.phoneNumber) : ''}
                    disabled
                  />   
                </div>
                <div className='editPass col-2 col-sm-1  p-3 mouse-pointer'>
                  
                </div>
              </div>    
            </div>
          </div>
          <div className="row g-3 align-items-center mb-3">
            <div className='col-4'></div>
            <div className='col-8'>
              {!reset ? (<><span className='text-orange fst-italic'>&nbsp; </span></> ) :
              (<span className='text-orange fst-italic'> Check your email for the password reset link. </span>)} 
            </div>
          </div>
          <div className="row g-3 align-items-center my-1">
            <div className="col-4">
              <label htmlFor="balance" className="col-form-label text-grey text-uppercase">Wallet Balance</label>
            </div>
            <div className='col-8 d-flex align-items-center justify-content-start'>
              <div className="col-10 col-sm-11 d-flex align-items-stretch justify-content-between balanceInput">
                  <div className='inputDiv'><input pattern="^\d*(\.\d{0,2})?$" className='input inputBet fw-bold' id="walletBalance" value={walletBalance} disabled/></div>
                  <div className='currency'><img src = {currency} className='currencyImg' alt='coins'/></div>
              </div>
              <div className='col-2 col-sm-1 p-3 mouse-pointer addCoins'
              onClick={openAddCoinsModal}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
              </svg>
              </div>
            </div>

          </div>
          <div className="row g-3 align-items-center mt-3">
            <div className="col-4">
              <label htmlFor="balance" className="col-form-label text-grey text-uppercase">Account Type</label>
            </div>
            <div className='col-8'>
              <div className='d-flex align-items-center justify-content-start'>
                <div className="col-10 col-sm-11  d-flex align-items-stretch justify-content-between rounded bg-darkblue">
                    <div className='inputDiv'><input pattern="^\d*(\.\d{0,2})?$" className='input inputBet fw-bold' id="walletBalance" 
                    value= {isPremium.isPremium ? 'PREMIUM' : 
                      isPremium.isPremiumTrial && (new Date(isPremium.trialExpiresAt) > new Date())  ? 
                      'PREMIUM Trial' 
                      : 'BASIC'} 
                    disabled/></div>
                </div>
                {isPremium.isPremium ? (<></>) : (
                  <div className='col-2 col-sm-1  p-3 mouse-pointer addCoins'
                    onClick={openPremiumModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-fill" viewBox="0 0 16 16">
                      <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                    </svg>
                  </div>
                  )}
              </div>
            </div>
          </div>
          <div className='row g-3 alignt-items-center justify-content-start mb-3'>
            <div className='col-4'></div>
            <div className='col-8'>
              {order ? (
                <span className='text-orange fst-italic'>{message}</span>
              ) : (
              <span className='text-orange fst-italic'>
                {isPremium.isPremium ? '' : 
                isPremium.isPremiumTrial && (new Date(isPremium.trialExpiresAt) > new Date())  ? 
                `Trial ends at ${new Intl.DateTimeFormat('en-GB', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(isPremium.trialExpiresAt))}.` 
                : ''} </span>
              )}
            </div>
          </div>

          </div>
          <div className='col-12 col-xxl-7 matchMarginAccount'>
            <div className='d-flex justify-content-between align-items-center'>
              <div className='col-md-4 col-6'><label className="col-form-label text-grey text-uppercase">Transaction History</label></div>
              <div className='col-md-8 col-6 key text-white text-end'> <span className='badge bg-dark'>&nbsp;</span> Settled  <span className='badge bg-secondary'>&nbsp;</span> Pending <span className='badge bg-success'>&nbsp;</span> Won <span className='badge bg-danger'>&nbsp;</span> Lost</div>
            </div>
          <div className='tableWrap'>
          <table size="sm" className='transactions'>
                <thead>
                  <tr>
                    <th>DATE</th>
                    {/* <th>Transaction</th> */}
                    <th>AMOUNT</th>
                    <th>TRANSACTION TYPE</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => {
                  return transaction.transaction_type === "bet" ? (
                    <tr key={transaction.transaction_id}>
                      <td>{new Date(transaction.transaction_date).toLocaleString().split(",")[0]} </td>
                      {/* <td>{transaction.transaction_type}</td> */}
                      <td>- {transaction.amount}</td>
                      {/* <td><span className='fw-bold text-orange'>BET</span><br/> <span className='fst-italic'> {transaction.fixture}</span> <br/> <span className='fst-italic '>{transaction["bet_market"]}</span> <br/> <span className='fw-bold '> {transaction["bet_type"]} </span> <br/> {transaction["bet_odds"]}</td> */}
                      <td><span className=''>Bet</span></td>
                      <td> <span className={`badge ${
                        transaction.status === 'pending'
                          ? 'bg-secondary'
                          : 'bg-dark'
                      }`}>
                        {/* {transaction.status === 'pending'
                        ? 'PENDING'
                        : 'SETTLED'} */} 
                        &nbsp;
                    </span>
                      </td>
                    </tr>
                  ) : transaction.transaction_type === "win" || transaction.transaction_type === "loss" ? 
                  (
                    <tr key={transaction.transaction_id}>
                      <td>{new Date(transaction.transaction_date).toLocaleString().split(",")[0]} </td>
                      {/* <td>{transaction.transaction_type}</td> */}
                      <td className={`${transaction.status === 'won' ? 'text-green' : 'text-red'}`} >{transaction.status === 'won' ? ' + ' : ' - '}{transaction.amount}</td>
                      <td><span className=''>Result</span></td>
                      <td> <span className={`badge ${
                        transaction.status === 'pending'
                          ? 'bg-secondary'
                          : transaction.status === 'won'
                          ? 'bg-success'
                          : transaction.status === 'lost'
                          ? 'bg-danger'
                          : ''
                      }`}>
                          {/* {transaction.status.toUpperCase()} */}
                          &nbsp;
                        </span>
                      </td>
                    </tr>
                  ) : (
                    <tr key={transaction.transaction_id}>
                      <td>{new Date(transaction.transaction_date).toLocaleString().split(",")[0]} </td>
                      {/* <td>{transaction.transaction_type}</td> */}
                      <td>{transaction.transaction_type === 'deposit' ? ' + ' : ' - '}{transaction.amount}</td>
                      <td><span className='text-capitalize'>{transaction.transaction_type}</span></td>
                      <td></td>
                    </tr>
                  ) 
                  } 
                  )}
                </tbody>
              </table>
              </div>
          </div>
          </>
        ) : (
          <>
          <div className='col-12 matchMarginAccount'>
            <div className='d-flex justify-content-between align-items-center'>
              <div className='col-md-4 col-6'><label className="col-form-label text-grey text-uppercase">Transaction History</label></div>
              <div className='selectDiv'>
              {/* Dropdown Filter */}
                <div className="btn-group">
                  <button type="button" className="select dropdown-toggle text-capitalize d-flex justify-content-between" data-bs-toggle="dropdown" aria-expanded="false">
                    <div> {filterType} </div> 
                    <div><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                    </svg></div>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><button className="dropdown-item" type="button" onClick={() => setFilterType('all')}>All</button></li>
                    <li><button className="dropdown-item" type="button" onClick={() => setFilterType('settled')}>Settled</button></li>
                    <li><button className="dropdown-item" type="button" onClick={() => setFilterType('pending')}>Pending</button></li>
                  </ul>
                </div>
              </div>
           </div>
            <div className='d-flex justify-content-between align-items-center'>
              <div className='col-5 col-md-4 searchBet'>
              {/* Search Input */}
                <div className="mb-3 searchgroup w-100 text-end d-flex align-items-center">
                  <span className="searchgroup-text" id="basic-addon1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
                        fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                      </svg>
                    </span>
                  <input type="text" className="search" placeholder="Search..."  onChange={(e) => setSearchTerm(e.target.value)} value={searchTerm} />
                </div>
              </div>
              <div className='col-md-8 col-7 key text-white text-end'><span className='badge bg-secondary'>&nbsp;</span> Pending <span className='badge bg-success'>&nbsp;</span> Won <span className='badge bg-danger'>&nbsp;</span> Lost</div>
            </div>
          <div className='tableWrap'>
          <table size="sm" className='transactions'>
                <thead>
                  <tr>
                    <th onClick={toggleSortOrder} className="mouse-pointer">
                      <div className='d-flex align-items-center justify-content-start'>
                        <div className='me-2'> {sortOrder === 'asc' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-up" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>
                          </svg>
                          ) : ( 
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                          </svg>
                          )}
                        </div>
                        <div>Date</div>
                      </div>
                    </th>                    
                    {/* <th>Transaction</th> */}
                    <th>Bet<br/>Amount</th>
                    <th>Payout</th>
                    <th>Bet Type</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBets.map((bet) =>
                    bet.transaction_type === "bet" ? (
                    <tr key={bet.bet_id}>
                      <td>{new Date(bet.placed_at).toLocaleString().split(",")[0]} <br/> -</td>
                      {/* <td>{bet.transaction_type}</td> */}
                      <td>{bet.bet_amount}</td>
                      <td>{bet.potential_payout}</td>
                      <td><span className='fst-italic'> {bet.fixture}</span> <br/> <span className='fst-italic '>{bet["bet_market"]}</span> <br/> <span className='fw-bold text-orange'> {bet["bet_type"]} </span></td>
                      {/* <td><span className='fw-bold'>BET</span></td> */}
                      <td className='badges'> <span className={`badge ${
                        bet.status === 'pending'
                          ? 'bg-secondary'
                          : 'bg-dark'
                      }`}>
                        {/* {bet.status === 'pending'
                        ? 'PENDING'
                        : 'SETTLED'} */} 
                        &nbsp;
                    </span>
                      </td>
                    </tr>
                  ) : (
                    <tr key={bet.transaction_id}>
                      <td>{new Date(bet.placed_at).toLocaleDateString()} <br />{new Date(bet.settled_at).toLocaleDateString()}</td>
                      <td className={`${bet.status === 'lost' ? 'text-red fw-bold' : ''}`}>{bet.bet_amount}</td>
                      <td className={`${bet.status === 'won' ? 'text-green fw-bold' : ''}`}>{bet.potential_payout}</td>
                      <td>
                        <span className='fst-italic'> {bet.fixture}</span> <br />
                        <span className='fst-italic '>{bet["bet_market"]}</span> <br />
                        <span className='fw-bold text-orange'> {bet["bet_type"]} </span>
                      </td>
                      <td className='badges'>
                        <span className={`badge ${bet.status === 'pending' ? 'bg-secondary' : bet.status === 'won' ? 'bg-success' : 'bg-danger'}`}>&nbsp;</span>
                      </td>
                    </tr>
                  )
                )}
                </tbody>
              </table>
              </div>
          </div>
          </>
        )}
        
      </div>
        
      </div>
  );
}
