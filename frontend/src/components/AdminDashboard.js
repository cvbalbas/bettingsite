import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';  
import empty from "../images/Empty.png"

export default function PendingBetsAdmin( {user, setUser, setRole, showAlert, setShowAlert, alertText, setAlertText, animationClass, setAnimationClass} ) {
  const [pendingBets, setPendingBets] = useState({});
  const [selectedWinners, setSelectedWinners] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [savedMarkets, setSavedMarkets] = useState({});
  const navigate = useNavigate();

  const [confirmAction, setConfirmAction] = useState(null); 
  // { type: 'save' | 'void', payload: { match_day, time, fixture, bet_market } }

  


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
        console.log({data})
        setRole(data.user.admin ?? false); 
        if (!(data.user.admin ?? false)){
          navigate("/");
        }
       } catch (error) {
          console.error("Error getting user info:", error);
          navigate("/");
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
    console.log(selectedWinners)
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
    // Check if already saved or currently saving
    const isAlreadySaving =
      savedMarkets?.[match_day]?.[fixture]?.[bet_market];

    if (isAlreadySaving) {
      console.log("Already saving this market, ignoring duplicate click.");
      return; // Ignore further clicks
    }

    // Immediately disable the button to prevent multiple clicks
    setSavedMarkets((prev) => ({
      ...prev,
      [match_day]: {
        ...(prev[match_day] || {}),
        [fixture]: {
          ...(prev[match_day]?.[fixture] || {}),
          [bet_market]: true, // temporarily mark as saving
        },
      },
    }));

    try {
      await saveMarketResults(match_day, time, fixture, bet_market);
      // Keep it marked as saved (success)
    } catch (error) {
      console.error("Error saving market results:", error);
      // Revert the saved flag if the request fails
      setSavedMarkets((prev) => ({
        ...prev,
        [match_day]: {
          ...(prev[match_day] || {}),
          [fixture]: {
            ...(prev[match_day]?.[fixture] || {}),
            [bet_market]: false,
          },
        },
      }));
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
              setAlertText(`<strong>Saved results successfully! </strong>`);
              setShowAlert(true);

              const fadeOutTimeout = setTimeout(() => {
                setAnimationClass('alert-fade-out');
              }, 2000);

              const clearAlertTimeout = setTimeout(() => {
                setShowAlert(false);
                setAnimationClass('');
              }, 2500);

              return () => {
                clearTimeout(fadeOutTimeout);
                clearTimeout(clearAlertTimeout);
              };
          } else {
              alert('Unauthorized access');
              navigate("/");
            }
      } catch (error) {
          console.error("Error updating results:", error);
      }
  };

  const voidMarket = async (match_day, time, fixture, bet_market) => {
    // Immediately disable the button to prevent multiple clicks
    setSavedMarkets((prev) => ({
      ...prev,
      [match_day]: {
        ...(prev[match_day] || {}),
        [fixture]: {
          ...(prev[match_day]?.[fixture] || {}),
          [bet_market]: true, // temporarily mark as saving
        },
      },
    }));
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/void-bet-market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ match_day, time, fixture, bet_market }),
      });

      const result = await response.json();
      if (result.success) {
        setAlertText(`<strong>Saved results successfully! </strong>`);
        setShowAlert(true);

        const fadeOutTimeout = setTimeout(() => {
          setAnimationClass('alert-fade-out');
        }, 2000);

        const clearAlertTimeout = setTimeout(() => {
          setShowAlert(false);
          setAnimationClass('');
        }, 2500);
        
         // Mark as 'saved' to disable further actions
        setSavedMarkets(prev => ({
          ...prev,
          [match_day]: {
            ...(prev[match_day] || {}),
            [fixture]: {
              ...(prev[match_day]?.[fixture] || {}),
              [bet_market]: true,
            }
          }
        }));

        return () => {
          clearTimeout(fadeOutTimeout);
          clearTimeout(clearAlertTimeout);
        };

       
      }
    } catch (error) {
      console.error("Error voiding market:", error);
    }
  };


  // Full mapping from full name → short name
  const teamMap = {
    // Premier League
    "Tottenham Hotspur": "tottenham",
    "West Ham United": "west-ham",
    "Fulham": "fulham",
    "Aston Villa": "aston-villa",
    "Manchester United": "man-utd",
    "Brentford": "brentford",
    "Newcastle United": "newcastle",
    "Brighton and Hove Albion": "brighton",
    "Ipswich Town": "ipswich",
    "Everton": "everton",
    "Southampton": "southampton",
    "Leicester City": "leicester",
    "Bournemouth": "bournemouth",
    "Arsenal": "arsenal",
    "Wolverhampton Wanderers": "wolverhampton",
    "Manchester City": "man-city",
    "Liverpool": "liverpool",
    "Chelsea": "chelsea",
    "Nottingham Forest": "nottingham-forest",
    "Crystal Palace": "crystal-palace",
    "Burnley": "burnley",
    "Leeds United": "leeds",
    "Sunderland": "sunderland",

    // Ligue 1
    "AS Monaco": "monaco",
    "Lorient": "lorient",
    "Toulouse": "toulouse",
    "Nantes": "nantes",
    "Paris Saint Germain": "psg",
    "Auxerre": "auxerre",
    "Nice": "nice",
    "Paris FC": "paris-fc",
    "Angers": "angers",
    "Brest": "brest",
    "Metz": "metz",
    "Le Havre": "le-havre",
    "Lille": "lille",
    "Lyon": "lyon",
    "Rennes": "rennes",
    "RC Lens": "lens",
    "Marseille": "marseille",
    "Strasbourg": "strasbourg",

    // Bundesliga
    "Bayern Munich": "bayern-munich",
    "Werder Bremen": "werder-bremen",
    "1 FC Heidenheim": "heidenheim",
    "Augsburg": "augsburg",
    "FSV Mainz 05": "mainz",
    "Borussia Dortmund": "borussia-dortmund",
    "FC St Pauli": "st-pauli",
    "Bayer Leverkusen": "bayer-leverkusen",
    "VfL Wolfsburg": "wolfsburg",
    "RB Leipzig": "rb-leipzig",
    "Borussia Monchengladbach": "borussia-mgladbach",
    "Eintracht Frankfurt": "eintracht-frankfurt",
    "SC Freiburg": "sc-freiburg",
    "TSG Hoffenheim": "tsg-hoffenheim",
    "1 FC Koln": "cologne",
    "VfB Stuttgart": "vfb-stuttgart",
    "Union Berlin": "union-berlin",
    "Hamburger SV": "hamburg",

    // Serie A
    "AS Roma": "roma",
    "Hellas Verona": "verona",
    "AC Milan": "ac-milan",
    "Napoli": "napoli",
    "Como": "como",
    "Cremonese": "cremonese",
    "Genoa": "genoa",
    "Lazio": "lazio",
    "Lecce": "lecce",
    "Bologna": "bologna",
    "Parma": "parma",
    "Torino": "torino",
    "Pisa": "pisa",
    "Fiorentina": "fiorentina",
    "Sassuolo": "sassuolo",
    "Udinese": "udinese",
    "Cagliari": "cagliari",
    "Inter Milan": "inter-milan",
    "Atalanta BC": "atalanta",
    "Juventus": "juventus",

    // La Liga
    "Girona": "girona",
    "Espanyol": "espanyol",
    "Getafe": "getafe",
    "Levante": "levante",
    "Mallorca": "real-mallorca",
    "Alaves": "alaves",
    "Rayo Vallecano": "rayo-vallecano",
    "Sevilla": "sevilla",
    "Barcelona": "barcelona",
    "Real Sociedad": "real-sociedad",
    "Valencia": "valencia",
    "Oviedo": "oviedo",
    "Atletico Madrid": "atletico-madrid",
    "Real Madrid": "real-madrid",
    "Villarreal": "villarreal",
    "Athletic Bilbao": "athletic-bilbao",
    "Elche CF": "elche",
    "Celta Vigo": "celta-vigo",
    "Real Betis": "real-betis",
    "CA Osasuna": "osasuna",

    // Champions League (additional teams)
    "Club Brugge": "club-brugge",
    "FC Kairat": "kairat-almaty",
    "Pafos FC": "aep-paphos",
    "Bodo Glimt": "bodo-glimt",
    "Benfica": "benfica",
    "Galatasaray": "galatasaray",
    "Slavia Praha": "slavia-prague",
    "Ajax": "ajax",
    "Qarabag FK": "fk-qarabag",
    "FC Copenhagen": "fc-copenhagen",
    "Union Saint Gilloise": "union-st-gilloise",
    "Olympiakos Piraeus": "olympiakos",
    "PSV Eindhoven": "psv",
    "Sporting Lisbon": "sporting-lisbon"
  };

  // Reverse mapping: shortName => full name
  const reverseTeamMap = Object.fromEntries(
    Object.entries(teamMap).map(([full, short]) => [short, full])
  );
  const getFullTeamName = (shortName) => reverseTeamMap[shortName] || "";

  const getImagePath = (teamName) => {
    const shortName = teamName.replace(/ /g, '-').toLowerCase()
    const fullName = getFullTeamName(shortName)
    const formattedName = fullName.replace(/ /g, '_'); 
    return `/images/${formattedName}.png`; 
  };

  const winningList = confirmAction?.payload?.selectedTypes?.length > 0
    ? confirmAction.payload.selectedTypes.join(", ")
    : "None";

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
                                  {/* SAVE Button */}
                                  <div
                                    onClick={() => {
                                      const selectedTypesArray = Object.entries(selectedWinners[match_day]?.[fixture]?.[bet_market] || {})
                                        .filter(([_, isSelected]) => isSelected)
                                        .map(([type]) => type);

                                        return !isSaved && setConfirmAction({
                                        type: 'save',
                                        payload: { match_day, 'time': details.time, fixture, bet_market, selectedTypes: selectedTypesArray }
                                      });
                                    }}
                                    className={`mb-1 rounded px-2 py-1 text-center oddsClicked odds-content fw-bold ${isSaved ? 'text-muted' : 'text-blue'}`}
                                    style={{ cursor: isSaved ? 'not-allowed' : 'pointer', opacity: isSaved ? 0.5 : 1 }}
                                  >
                                    {isSaved ? "SAVED" : "SAVE"}
                                  </div>

                                  {/* VOID Button */}
                                  <div
                                    onClick={() => {
                                      const selectedTypesArray = Object.entries(selectedWinners[match_day]?.[fixture]?.[bet_market] || {})
                                        .filter(([_, isSelected]) => isSelected)
                                        .map(([type]) => type);

                                      return !isSaved && setConfirmAction({
                                        type: 'void',
                                        payload: { match_day, 'time': details.time, fixture, bet_market, selectedTypes: selectedTypesArray }
                                      });
                                    }}
                                    className={`mt-1 rounded px-2 py-1 text-center fw-bold ${isSaved ? 'text-muted' : 'bg-danger text-white'}`}
                                    style={{ cursor: isSaved ? 'not-allowed' : 'pointer', opacity: isSaved ? 0.5 : 1 }}
                                  >
                                    VOID
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
      {confirmAction && (
        
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              
              <div className="modal-header bg-green text-white modal-head">
                <h5 className="modal-title fw-bold">
                  {confirmAction.type === 'save' ? (<>Confirm <span className='text-orange'>Save</span> Market</>) : (<>Confirm <span className='text-red'>Void</span> Market</>)}
                </h5>
                <button className="btn-close" onClick={() => setConfirmAction(null)}></button>
              </div>

              <div className="modal-body bg-green text-white">
                {confirmAction.type === 'save' ? (
                  <>
                    <div className='fw-bold'>{confirmAction.payload.fixture} - {confirmAction.payload.bet_market}</div>
                    <div>{confirmAction.payload.match_day} {confirmAction.payload.time}</div>

                    <div className="mt-3">
                      <strong>Selected Winning Bet Type:</strong>
                      <div className="text-orange">{winningList}</div>
                    </div>

                    <div className="mt-3">
                      Are you sure you want to <span className='fw-bold text-orange'>save</span> this market? <br />
                      This will apply the winners permanently.
                    </div>
                  </>
                ) : (
                  <>
                    <div className='fw-bold'>{confirmAction.payload.fixture} - {confirmAction.payload.bet_market}</div>
                    <div>{confirmAction.payload.match_day} {confirmAction.payload.time}</div>
                    <div className="mt-3">
                      Are you sure you want to <span className='fw-bold text-red'>void</span> this market? <br />
                      All bets will be refunded.
                    </div>
                  </>
                ) }
              </div>

              <div className="modal-footer bg-green border-top-0 justify-content-end pt-0 pb-3">
                <button className="mt-1 btn border fw-bold text-white p-2" onClick={() => setConfirmAction(null)}>Cancel</button>

                <button
                  className={`mt-1 btn text-white fw-bold p-2 ${confirmAction.type === 'save' ? 'btn-prim' : 'btn-danger'}`}
                  onClick={() => {
                    const { match_day, time, fixture, bet_market } = confirmAction.payload;
                    setConfirmAction(null);

                    if (confirmAction.type === 'save') {
                      submitMarketResults(match_day, time, fixture, bet_market);
                    } else {
                      voidMarket(match_day, time, fixture, bet_market);
                    }
                  }}
                >
                  Confirm
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      <div className='alertsBox'>
        {showAlert && (
          <div
            className={`alert ${
              alertText.includes("Error")
                ? "alert-danger"
                : "alert-success"
            } fade show ${animationClass}`}
            role="alert"
            dangerouslySetInnerHTML={{ __html: alertText }}
          ></div>
        )}
      </div>

    </div>
  );
}
