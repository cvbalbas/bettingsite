import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';  
import empty from "../images/Empty.png"

export default function PendingBetsAdmin( {user, setUser, setRole} ) {
  const [pendingBets, setPendingBets] = useState({});
  const [selectedWinners, setSelectedWinners] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [savedMarkets, setSavedMarkets] = useState({});
  const navigate = useNavigate();


  useEffect(() => {
     const fetchUserData = async (currentUser) => {
       if (!currentUser) return; 
   
       try {
        const token = await currentUser.getIdToken(); 

        const response = await fetch('/api/user-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ currentUser }),
        });

        const data = await response.json();
        setRole(data.results[0]?.admin ?? false); 
        if (!(data.results[0]?.admin ?? false)){
          navigate("/");
        }
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
       } else {
         setUser(null);
         setRole(false); 
       }
     });
   
     return () => unsubscribe();
   }, []);

  useEffect(() => {
      const fetchPendingBets = async () => {
          try {
            const token = await user.getIdToken(); 
            const response = await fetch('/api/pending-bets', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ user }),
            });
            const data = await response.json();
            console.log(data)
            if (data.success) {
              console.log(data.data)
              setPendingBets(data.data);
            } else {
              alert(data.error)
            }
          } catch (error) {
              console.error("Error fetching pending bets:", error);
          }
      };
      fetchPendingBets();
  }, []);

  function isEmpty(obj) {
    for (const prop in obj) {
      if (Object.hasOwn(obj, prop)) {
        return false;
      }
    }
    return true;
  }

  const handleCheckboxChange = (match_day, fixture, bet_market, bet_type) => {
      setSelectedWinners((prev) => ({
          ...prev,
          [match_day]: {
              ...prev[match_day],
              [fixture]: {
                  ...prev[match_day]?.[fixture],
                  [bet_market]: {
                      ...prev[match_day]?.[fixture]?.[bet_market],
                      [bet_type]: !prev[match_day]?.[fixture]?.[bet_market]?.[bet_type]
                  }
              }
          }
      }));
  };
  const submitMarketResults = async (match_day, time, fixture, bet_market) => {
    try {
      await saveMarketResults(match_day, time, fixture, bet_market); 
      setSavedMarkets((prev) => ({
        ...prev,
        [match_day]: {
          ...(prev[match_day] || {}),
          [fixture]: {
            ...(prev[match_day]?.[fixture] || {}),
            [bet_market]: true, 
          }
        }
      }));
    } catch (error) {
      console.error("Error saving market results:", error);
    }
  };

  const saveMarketResults = async (match_day, time, fixture, bet_market) => {
      const winningBets = Object.entries(selectedWinners[match_day]?.[fixture]?.[bet_market] || {})
          .filter(([_, isChecked]) => isChecked)
          .map(([bet_type]) => bet_type);

      try {
          const token = await user.getIdToken(); 
          const response = await fetch('/api/update-bet-results', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ match_day, time, fixture, bet_market, winningBets })
          });

          const result = await response.json();
          if (result.success) {
              alert('Results updated successfully!');
          } else {
              alert('Unauthorized access');
              navigate("/");
            }
      } catch (error) {
          console.error("Error updating results:", error);
      }
  };

  const getImagePath = (teamName) => {
    const formattedName = teamName.replace('ø','o').replace('ğ','g').replace('é', 'e').replace('ö','o').replace('-','_').replace('/','_').replace('. ', '_').replace(/ /g, '_'); 
    console.log(formattedName)
    return `/images/${formattedName}.png`; 
  };
    return (
      <div>
        <div className='col-lg-10 col-sm-12 m-auto'>
          <div className='text-start text-white mt-4 mb-3 d-flex justify-content-between align-items-center'>
            <div className='col-12'><h1>Users' Bets</h1></div>
          </div>
          <div className='bg-green shadow-down rounded pb-3 mb-5'>
            <div className='col-12'>
              <div className='col-12 row d-flex align-items-center justify-content-between'>
                <div className="col-8 searchgroup text-end d-flex align-items-center">
                  <span className="searchgroup-text" id="basic-addon1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
                        fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                      </svg>
                    </span>
                  <input type="text" className='search' placeholder="Search team..." onChange={(e) => setSearchTerm(e.target.value.toLowerCase())} value={searchTerm} />
                </div>
                <div className='col-4 toggle d-flex justify-content-end align-items-center m-0 text-lightgrey pe-0 font-12 fw-bold' data-bs-toggle="tooltip" data-bs-placement="top" title="Change to odds to %">
          
                </div>
              </div>
              <div className='match-list'>
              { !isEmpty(pendingBets) ? (
                Object.entries(pendingBets).map(([match_day, fixtures]) => (
                  <div key={match_day} className="date-group">
                    <div className='text-uppercase text-lightgrey col-12 bg-lightgreen text-start date matchMargin py-2'>
                    {match_day}
                    </div>
                    {Object.entries(fixtures)
                          .filter(([fixture]) => fixture.toLowerCase().includes(searchTerm)) // Filter fixtures based on search
                          .map(([fixture, details]) => (
                      <div key={fixture} className='match'>
                        <div className='matchMargin text-start'>
                        <div className='text-lightgrey py-2 font-12 d-flex justify-content-between align-items-center'>
                          <div className='d-flex justify-content-start py-1 text-white fw-bold font-15'>
                          <div>
                            <img 
                              src = {getImagePath(fixture.split(" v ")[0])}
                              alt={fixture.split(" v ")[0]} 
                              className="team-logo me-1"/>
                            {fixture.split(" v ")[0]}
                          </div>
                          <div className='mx-3'> - </div>
                          <div>
                            {fixture.split(" v ")[1]}
                            <img 
                              src = {getImagePath(fixture.split(" v ")[1])}
                              alt={fixture.split(" v ")[1]} 
                              className="team-logo ms-1"/>
                          </div>
                          </div> 
                          <div>{details.time}</div>
                        </div> 
                        <div className="row">

                        {Object.entries(details.markets).map(([bet_market, bet_types]) => {
                        const isSaved = savedMarkets[match_day]?.[fixture]?.[bet_market] || false;
                        
                        return (
                          <div key={bet_market} className="col-12 col-sm-6 col-md-6 col-lg-3 mb-3">
                            <div className="bet-card p-3 shadow-sm">
                              <div className='d-flex justify-content-between align-items-center'>
                                <div className='text-white font-15'>{bet_market}</div>
                                <div>
                                  <div 
                                    onClick={() => submitMarketResults(match_day, details.time, fixture, bet_market)}
                                    className={`rounded px-2 py-1 text-center oddsClicked odds-content fw-bold ${isSaved ? 'text-muted' : 'text-blue'}`}
                                    style={{ cursor: isSaved ? 'not-allowed' : 'pointer', opacity: isSaved ? 0.5 : 1 }}
                                  >
                                    {isSaved ? "SAVED" : "SAVE"}
                                  </div>
                                </div>
                              </div>

                              {bet_types.map((bet_type) => (
                                <label key={bet_type} className='d-flex align-items-center font-12 text-grey fw-normal my-2'>
                                  <input
                                    type="checkbox"
                                    checked={selectedWinners[match_day]?.[fixture]?.[bet_market]?.[bet_type] || false}
                                    onChange={() => handleCheckboxChange(match_day, fixture, bet_market, bet_type)}
                                    className='me-2'
                                    disabled={isSaved} 
                                  />
                                  {bet_type}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                        </div>
                      </div>
                      </div>
                    ))}
                  </div>
                ))) :
                (<div className='m-auto text-center mt-5'> 
                <p className='text-white'><em>No pending bets...</em></p>
                <img src = {empty} height="150px" alt='Empty...' />
                </div>)
              }  
              </div>
            </div>
          </div>      
        </div>
      </div>
    );
}
