import React, { useEffect, useState } from 'react';


import { Button, Collapse } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import ToggleSwitch from "./ToggleSwitch";
import { getAuth, onAuthStateChanged } from 'firebase/auth';  


function App({user, setUser, walletBalance, setWalletBalance, isPremium, setIsPremium, selectedOdds, setSelectedOdds, betsOpen, setBetsOpen, betAmounts, setBetAmounts, estimatedPayouts, setEstimatedPayouts, handleClearAllBets, openPremiumModal, closePremiumModal, showAlert, setShowAlert, alertText, setAlertText, animationClass, setAnimationClass, setPhoneSetUp, setRole, openSignupModal, setLoading, selectedLeague, setSelectedLeague}) {

  const [matches, setMatches] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [marketIDs, setMarketIDs] = useState([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const [loadedMatches, setLoadedMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchError, setFetchError] = useState(false); 

  const [open, setOpen] = useState({}); 
  const [openMarkets, setOpenMarkets] = useState({}); 
  const [loadingMatch, setLoadingMatch] = useState({})
  const [searchMarket, setSearchMarket] = useState({});
  const [showAll, setShowAll] = useState({});
  const [notif, setNotif] = useState([])


  useEffect(() => {
    if (notif.length > 0) {
      setAlertText(`<strong>Successfully added bet! </strong> <br/>${notif[0]?.split('$')[0]} - ${notif[0]?.split('$')[1]} - ${notif[0]?.split('$')[2]}`);
      setAnimationClass('alert-fade-in');
      setShowAlert(true);

      const fadeOutTimeout = setTimeout(() => {
        setAnimationClass('alert-fade-out');
      }, 1000);

      const clearAlertTimeout = setTimeout(() => {
        setShowAlert(false);
        setAnimationClass('');
      }, 1500);

      return () => {
        clearTimeout(fadeOutTimeout);
        clearTimeout(clearAlertTimeout);
      };
    }
  }, [notif]);


  useEffect(() => {
    if (user !== null){
      const hasTrialExpired = new Date(isPremium.trialExpiresAt) < new Date();
      if (isPremium.isPremium || (isPremium.isPremiumTrial && !hasTrialExpired)) {
        const togglePercent = localStorage.getItem('togglePercent')
        setPercentOdds(() => togglePercent === 'true')
      } else {
        setPercentOdds(false)
      }
    } else {
      setPercentOdds(false)
    }
    // console.log(loadedMatches)
    // console.log(open)
    console.log(markets)
  }, [isPremium, user, markets, matches, loadedMatches, open, searchMarket])

  
  useEffect(() => {
    const fetchOdds = async (league) => {
      
      try {
        const response = await fetch(`/api/odds?league=${league.key}`); 
        const data = await response.json();
        console.log(data.data)
        // data.data[0]["home_team"] = "Sunderland"
        // data.data[0]["teams"][0] = "Aston Villa"
        // data.data[0]["teams"][1] = "Sunderland"
        // Filter out duplicates (by id)
        setMatches((prevMatches) => {
          const updatedMatches = [...prevMatches];

          data.data.forEach((newMatch) => {
            const index = updatedMatches.findIndex((m) => m.id === newMatch.id);
            if (index !== -1) {
              // Replace existing match
              updatedMatches[index] = newMatch;
            } else {
              // Add new match
              updatedMatches.push(newMatch);
            }
          });

          return updatedMatches;
        });
      } catch (error) {
        console.error('Error fetching odds:', error);
        
      }
    };
    
    const fetchMarkets = async () => {
      try {
        const response = await fetch('/api/markets'); 
        const data = await response.json();
        data.forEach((market) => {
          market.time = formatDate(market.time) + " at " + formatTime(market.time)
        })
        // data.push({
        //   fixture: "brentford-v-man-utd",
        //   id:11051,
        //   market:"Total Goals 3-Way",
        //   marketId:3568610045,
        //   time:"21 October 2024 at 20:00",
        //   sport_key: "soccer_epl"
        // })
        // console.log(data)
        setMarketIDs(data); 
        
      } catch (error) {
        console.error('Error fetching markets:', error);
      }
    }
    

    // Run only if a league is selected
    if (selectedLeague) {
      const alreadyLoaded = matches.some(m => m.sport_key === selectedLeague.key);
      if (!alreadyLoaded) {
        fetchOdds(selectedLeague);
      }
    }
    setLoadingHome(true)
    fetchMarkets();

    setTimeout(function() {
      setLoadingHome(false)
    }, 500);
    
    


    // refresh all odds every 10 minutes
    const intervalId = setInterval(() => {
      if (selectedLeague) {
        // setLoadingHome(true)
        fetchOdds(selectedLeague);

        // setTimeout(function() {
        //   setLoadingHome(false)
        // }, 500);      
      }
    }, 600000);

    return () => clearInterval(intervalId);
    
  }, [selectedLeague]);



  const getImagePath = (teamName) => {
    const formattedName = teamName.replace('ø','o').replace('ğ','g').replace('é', 'e').replace('ö','o').replace('-','_').replace('/','_').replace('. ', '_').replace(/ /g, '_'); 
    console.log(formattedName)
    return `/images/${formattedName}.png`; 
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000); 
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',    
      month: 'long',     
      year: 'numeric'    
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000); 
    return date.toLocaleTimeString('en-GB', {
      hour: 'numeric',  
      minute: 'numeric', 
      hour12: false 
    });
  };

  const convert_name = (team) => {
    switch(team){
      //premiere league
      case "Tottenham Hotspur":
        return "tottenham"

      case "West Ham United":
        return "west-ham"
        
      case "Fulham":
        return "fulham"
        
      case "Aston Villa":
        return "aston-villa"
        
      case "Manchester United":
        return "man-utd"
        
      case "Brentford":
        return "brentford"
        
      case "Newcastle United":
        return "newcastle"
        
      case "Brighton and Hove Albion":
        return "brighton"
        
      case "Ipswich Town":
        return "ipswich"
        
      case "Everton":
        return "everton"
        
      case "Southampton":
        return "southampton"
        
      case "Leicester City":
        return "leicester"
        
      case "Bournemouth":
        return "bournemouth"
        
      case "Arsenal":
        return "arsenal"
        
      case "Wolverhampton Wanderers":
        return "wolverhampton"
        
      case "Manchester City":
        return "man-city"
        
      case "Liverpool":
        return "liverpool"
        
      case "Chelsea":
        return "chelsea"
        
      case "Nottingham Forest":
        return "nottingham-forest"
        
      case "Crystal Palace":
        return "crystal-palace"
        
      case "Burnley":
        return "burnley"
        
      case "Leeds United":
        return "leeds"
        
      case "Sunderland":
        return "sunderland"
        

      //Ligue 1
      case "AS Monaco":
        return "monaco"
        
      case "Lorient":
        return "lorient"
        
      case "Toulouse":
        return "toulouse"
        
      case "Nantes":
        return "nantes"
        
      case "Paris Saint Germain":
        return "psg"
        
      case "Auxerre":
        return "auxerre"
        
      case "Nice":
        return "nice"
        
      case "Paris FC":
        return "paris-fc"
        
      case "Angers":
        return "angers"
        
      case "Brest":
        return "brest"
        
      case "Metz":
        return "metz"
        
      case "Le Havre":
        return "le-havre"
        
      case "Lille":
        return "lille"
        
      case "Lyon":
        return "lyon"
        
      case "Rennes":
        return "rennes"
        
      case "RC Lens":
        return "lens"
        
      case "Marseille":
        return "marseille"
        
      case "Strasbourg":
        return "strasbourg"
        
      //Bundesliga
      case "Bayern Munich":
        return "bayern-munich"
      
      case "Werder Bremen":
        return "werder-bremen"
      
      case "1. FC Heidenheim":
        return "heidenheim"

      case "Augsburg":
        return "augsburg"

      case "FSV Mainz 05":
        return "mainz"
      
      case "Borussia Dortmund":
        return "borussia-dortmund"
      
      case "FC St. Pauli":
        return "st-pauli"

      case "Bayer Leverkusen":
        return "bayer-leverkusen"

      case "VfL Wolfsburg":
        return "wolfsburg"

      case "RB Leipzig":
        return "rb-leipzig"

      case "Borussia Monchengladbach":
        return "borussia-mgladbach"

      case "Eintracht Frankfurt":
        return "eintracht-frankfurt"

      case "SC Freiburg":
        return "sc-freiburg"

      case "TSG Hoffenheim":
        return "tsg-hoffenheim"
      
      case "1. FC Köln":
        return "cologne"

      case "VfB Stuttgart":
        return "vfb-stuttgart"

      case "Union Berlin":
        return "union-berlin"

      case "Hamburger SV":
        return "hamburg"
      

      //Serie A
      case "AS Roma":
        return "roma"
      
      case "Hellas Verona":
        return "verona"

      case "AC Milan":
        return "ac-milan"

      case "Napoli":
        return "napoli"
      
      case "Como":
        return "como"
      
      case "Cremonese":
        return "cremonese"

      case "Genoa":
        return "genoa"
      
      case "Lazio":
        return "lazio"

      case "Lecce":
        return "lecce"
      
      case "Bologna":
        return "bologna"

      case "Parma":
        return "parma"
      
      case "Torino":
        return "torino"
      
      case "Pisa":
        return "pisa"

      case "Fiorentina":
        return "fiorentina"

      case "Sassuolo":
        return "sassuolo"

      case "Udinese":
        return "udinese"

      case "Cagliari":
        return "cagliari"

      case "Inter Milan":
        return "inter-milan"

      case "Atalanta BC":
        return "atalanta"
      
      case "Juventus":
        return "juventus"

      

      //La Liga Primera

      case "Girona":
        return "girona"

      case "Espanyol":
        return "espanyol"

      case "Getafe":
        return "getafe"

      case "Levante":
        return "levante"
      
      case "Mallorca":
        return "real-mallorca"

      case "Alavés":
        return "alaves"

      case "Rayo Vallecano":
        return "rayo-vallecano"

      case "Sevilla":
        return "sevilla"

      case "Barcelona":
        return "barcelona"

      case "Real Sociedad":
        return "real-sociedad"

      case "Valencia":
        return "valencia"

      case "Oviedo":
        return "oviedo"

      case "Atlético Madrid":
        return "atletico-madrid"

      case "Real Madrid":
        return "real-madrid"
      
      case "Villarreal":
        return "villarreal"

      case "Athletic Bilbao":
        return "athletic-bilbao"

      case "Elche CF":
        return "elche"
  
      case "Celta Vigo":
        return "celta-vigo"

      case "Real Betis":
        return "real-betis"

      case "CA Osasuna":
        return "osasuna"


      //Champions League
      // case "Atalanta BC":
      //   return "atalanta"

      case "Club Brugge":
        return "club-brugge"
      
      case "FC Kairat":
        return "kairat-almaty"
      
      // case "Real Madrid":
      //   return "real-madrid"

      case "Pafos FC":
        return "aep-paphos"

      // case "Bayern Munich":
      //   return "bayern-munich"

      // case "Atlético Madrid":
      //   return "atletico-madrid"

      // case "Eintracht Frankfurt":
      //   return "eintracht-frankfurt"

      case "Bodø/Glimt":
        return "bodo-glimt"

      // case "Tottenham Hotspur":
      //   return "tottenham"
      
      // case "Chelsea":
      //   return "chelsea"

      case "Benfica":
        return "benfica"

      case "Galatasaray":
        return "galatasaray"
      
      // case "Liverpool":
      //   return "liverpool"

      // case "Inter Milan":
      //   return "inter-milan"
      
      case "Slavia Praha":
        return "slavia-prague"

      // case "Marseille":
      //   return "marseille"
      
      case "Ajax":
        return "ajax"

      case "Qarabağ FK":
        return "fk-qarabag"

      case "FC Copenhagen":
        return "fc-copenhagen"

      case "Union Saint-Gilloise":
        return "union-st-gilloise"

      // case "Newcastle United":
      //   return "newcastle"

      // case "Arsenal":
      //   return "arsenal"

      case "Olympiakos Piraeus":
        return "olympiakos"

      // case "Barcelona":
      //   return "barcelona"

      // case "Paris Saint Germain":
      //   return "psg"

      case "PSV Eindhoven":
        return "psv"

      // case "Bayer Leverkusen":
      //   return "bayer-leverkusen"

      // case "Borussia Dortmund":
      //   return "borussia-dortmund"

      // case "Athletic Bilbao":
      //   return "athletic-bilbao"

      // case "AS Monaco":
      //   return "monaco"

      // case "Manchester City":
      //   return "man-city" 

      // case "Napoli":
      //   return "napoli"

      case "Sporting Lisbon":
        return "sporting-lisbon"

      // case "Villarreal":
      //   return "villarreal"

      // case "Juventus":
      //   return "juventus"

      default:
        return ""
    }
  }

  const groupMatchesByDate = (matches) => {
    const groupedMatches = {};


    matches.forEach(match => {
      const matchDate = formatDate(match.commence_time); 
      if (!groupedMatches[matchDate]) {
        groupedMatches[matchDate] = []; 
      }
      
      let total = 0;
      let lowestIndex = 0; 
      let lowestTotal = 200 
      for (let j = 0; j < match["sites"].length; j++) {
        
        if (match["sites"][j]["odds"]["h2h"] && match["sites"][j]["odds"]["h2h"].length === 3) {
            total = Math.round(1 / match["sites"][j]["odds"]["h2h"][0] * 10000) / 100 +
                    Math.round(1 / match["sites"][j]["odds"]["h2h"][1] * 10000) / 100 +
                    Math.round(1 / match["sites"][j]["odds"]["h2h"][2] * 10000) / 100;
    
            
            if (total < lowestTotal) {
                lowestTotal = total;
                lowestIndex = j;
            }
        } else {
            continue;
        }
    }
    // console.log(match.home_team) 
    // console.log(match.teams)
      let fixture = ""
      fixture += convert_name(match.home_team)
      fixture += "-v-"
      fixture += convert_name(match.teams.filter(team => team !== match.home_team)[0])
      
      // console.log(fixture)
      const marketIDsForMatch = Array.from(
        new Map(
          marketIDs
            .filter((market) => market.fixture === fixture)
            .map((market) => [market.marketId, { marketId: market.marketId, market: market.market }])
        ).values()
      );
      // console.log(marketIDsForMatch)
      // console.log(fixture)

      let subeventName = fixture
      .split('-') 
      .map((team) => team.charAt(0).toUpperCase() + team.slice(1)) 
      .join(' ')
      .replace(' V ', ' v ')
      
      let index_home = match.teams.indexOf(match.home_team)
      let index_away = match.teams.indexOf(match.teams.filter(team => team !== match.home_team)[0])
     
      // console.log(index_home, index_away)

      groupedMatches[matchDate].push({
        fixture: subeventName,
        id: match.id,
        homeTeam: match.home_team,
        awayTeam: match.teams.filter(team => team !== match.home_team)[0],
        time: formatTime(match.commence_time),
        date: formatDate(match.commence_time),
        homeOdds: match.sites[lowestIndex].odds.h2h[index_home].toFixed(2), 
        drawOdds: match.sites[lowestIndex].odds.h2h[2].toFixed(2),
        awayOdds: match.sites[lowestIndex].odds.h2h[index_away].toFixed(2),
        marketIDs: marketIDsForMatch,
        sport_key: match.sport_key
      });
    });

    return groupedMatches;
  };

  

  const [filteredGroupedMatches, setFilteredGroupedMatches] = useState({});

  useEffect(() => {
    const groupedMatches = groupMatchesByDate(matches);

    const newFiltered = Object.keys(groupedMatches).reduce((acc, date) => {
      const filteredMatches = groupedMatches[date].filter(
        (match) =>
          match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (filteredMatches.length > 0) {
        acc[date] = filteredMatches;
      }
      return acc;
    }, {});
    // console.log(newFiltered)
    setFilteredGroupedMatches(newFiltered);
  }, [matches, searchTerm]);
  
 
  const handleOddsClick = (matchId, type, odds, market, match) => {
    
    if(selectedOdds.length === 0) {
      setBetsOpen(true);
    } 
    if (!user) {
      setBetsOpen(true);
    }
    
    const selectedMatchInfo = {
      ...match,
      selectedMarket: market,
      selectedType: type, 
      selectedOdds: odds, 
    };  
  
    const matchIndex = selectedOdds.findIndex(
      (odd) => odd.id === matchId && odd.selectedMarket === market && odd.selectedType === type
    );

    if (matchIndex === -1) {
      
      setSelectedOdds((prevSelectedOdds) => [...prevSelectedOdds, selectedMatchInfo]);
      setNotif(() => [match.fixture + '$' + market + '$' +  type])

    } else {
      setSelectedOdds((prevSelectedOdds) =>
        prevSelectedOdds.filter((_, i) => i !== matchIndex)
      );
    }
    
  };

  useEffect(() => {
    
    const fetchMarketsRepeat = async () => {
      const openMarketsMatchIds = Object.keys(open)
      .filter(key => open[key])
      .map(Number);
      
      console.log(open)
      console.log(openMarketsMatchIds)

      if (openMarketsMatchIds.length !== 0){
        fetch("https://www.oddschecker.com/api/markets/v2/all-odds?market-ids=" + openMarketsMatchIds  + "&repub=OC")
        .then((response) => response.json())
        .then((data) => {
          console.log(data)
          // data[0]["bets"][0]["bestOddsDecimal"] = 10 //For testing only
          const updateMarkets = (data) => {
            
            setMarkets((prevMarkets) =>
              prevMarkets.map((market) => {
                if (data.length !== 0) {
                  const updatedMarket = data.find((d) => d.marketId === market.marketId);
                  
                  if (updatedMarket) {
                    return {
                      ...market,
                      bets: market.bets.map((bet) => {
                        const updatedBet = updatedMarket.bets.find((b) => b.betId === bet.betId);
                        
                        if (updatedBet && updatedBet.bestOddsDecimal !== bet.bestOddsDecimal) {
                          return { ...bet, bestOddsDecimal: updatedBet.bestOddsDecimal };
                        }
                        return bet;
                      }),
                    };
                  }
                }
                return market;
              })
            );
          };
          updateMarkets(data);
        })
        .catch((error) => {
          console.error("❌ Error fetching odds:", error);
        });

      }
      
    }
    
    

    //fetchMarketsRepeat();
    

    const intervalId = setInterval(fetchMarketsRepeat, 600000); // 600,000ms = 10 minutes

    return () => clearInterval(intervalId);
    
  }, [open]);


  const handleGetMarkets = async (match) => {
    setOpenMarkets((prevState) => ({
      ...prevState,
      [match.id]: !prevState[match.id], 
    }));
   
  }

  


  const oddschecker = async (marketID) => {
     
    setLoadingMatch((prev) => ({ ...prev, [marketID]: true }));

    const marketIndex = markets.findIndex(
      (marketToLoad) => marketToLoad.marketId === marketID
    );
    console.log(marketIndex)
    if (marketIndex === -1) {
       setLoadedMatches((prevLoadedMatch) => [...prevLoadedMatch,marketID]);
      console.log(marketID)
      fetch("https://www.oddschecker.com/api/markets/v2/all-odds?market-ids="+marketID + "&repub=OC")
      .then((response) => response.json())
      .then((data) => {
        console.log(data)
        if (data.length === 0){
          setFetchError(true)
        }
        setMarkets((prevMarkets) => [...prevMarkets, ...data]);
        // setOpen((prevState) => ({
        //   ...prevState,
        //   [marketID]: !prevState[marketID],
        // }));
        setOpen((prev) => {
          const newState = {};

          // If the clicked market is already true, close everything
          if (prev[marketID]) {
            Object.keys(prev).forEach((key) => {
              newState[key] = false;
            });
          } else {
            // Otherwise, close all others and open the clicked one
            Object.keys(prev).forEach((key) => {
              newState[key] = false;
            });
            newState[marketID] = true;
          }
          setTimeout(() => {
            const container = document.querySelector(".match-list");
            const element = document.getElementById(`collapse-${marketID}`);

            if (container && element) {
              const containerTop = container.scrollTop;
              const containerBottom = containerTop + container.clientHeight;

              const elementTop = element.offsetTop;
              const elementBottom = elementTop + element.clientHeight;

              // Check if element is fully visible in container
              const isVisible =
                elementTop >= containerTop + 100 && elementBottom <= containerBottom + 100;

              if (!isVisible) {
                container.scrollTo({
                  top: elementTop - container.offsetTop - 100,
                  behavior: "smooth",
                });
              }
            }
          }, 300);
          return newState;
        })
        
        
        setLoadingMatch((prev) => ({ ...prev, [marketID]: false }));
      })
      .catch((error) => {
        setFetchError(true)
        console.error("❌ Error fetching odds:", error);
        setOpen((prev) => {
          const newState = {};

          // If the clicked market is already true, close everything
          if (prev[marketID]) {
            Object.keys(prev).forEach((key) => {
              newState[key] = false;
            });
          } else {
            // Otherwise, close all others and open the clicked one
            Object.keys(prev).forEach((key) => {
              newState[key] = false;
            });
            newState[marketID] = true;
          }
          setTimeout(() => {
            const container = document.querySelector(".match-list");
            const element = document.getElementById(`collapse-${marketID}`);

            if (container && element) {
              const containerTop = container.scrollTop;
              const containerBottom = containerTop + container.clientHeight;

              const elementTop = element.offsetTop;
              const elementBottom = elementTop + element.clientHeight;

              // Check if element is fully visible in container
              const isVisible =
                elementTop >= containerTop + 100 && elementBottom <= containerBottom + 100;

              if (!isVisible) {
                container.scrollTo({
                  top: elementTop - container.offsetTop - 100,
                  behavior: "smooth",
                });
              }
            }
          }, 300);
          return newState;
        })
        
        
        setLoadingMatch((prev) => ({ ...prev, [marketID]: false }));
      });
        
    } else {
      console.log(true)
      setLoadedMatches((prevLoadedMatches) =>
        prevLoadedMatches.filter((id) => id !== marketID)
      );
      setOpen((prev) => {
        const newState = {};

        // If the clicked market is already true, close everything
        if (prev[marketID]) {
          Object.keys(prev).forEach((key) => {
            newState[key] = false;
          });
        } else {
          // Otherwise, close all others and open the clicked one
          Object.keys(prev).forEach((key) => {
            newState[key] = false;
          });
          newState[marketID] = true;
        }
        setTimeout(() => {
          const container = document.querySelector(".match-list");
          const element = document.getElementById(`collapse-${marketID}`);

          if (container && element) {
            const containerTop = container.scrollTop;
            const containerBottom = containerTop + container.clientHeight;

            const elementTop = element.offsetTop;
            const elementBottom = elementTop + element.clientHeight;

            // Check if element is fully visible in container
            const isVisible =
              elementTop >= containerTop + 100 && elementBottom <= containerBottom + 100;

            if (!isVisible) {
              container.scrollTo({
                top: elementTop - container.offsetTop - 100,
                behavior: "smooth",
              });
            }
          }
        }, 300);
        return newState;
      });
      setLoadingMatch((prev) => ({ ...prev, [marketID]: false }));
    } 
    
  }

  let [percentOdds, setPercentOdds] = useState(false);

  const onPercentOddsChange = (checked) => {
    const changePercentDecimal = () => {
      if(isPremium.isPremium) {
        setPercentOdds(checked);
        localStorage.setItem('togglePercent', checked);
      } else {
        const hasTrialExpired = new Date(isPremium.trialExpiresAt) < new Date();
        if(isPremium.isPremiumTrial){
          if(hasTrialExpired) {
            openPremiumModal()
          } else {
            setPercentOdds(checked);
            localStorage.setItem('togglePercent', checked);
          }
        } else {
          openPremiumModal()
        }
      }
    }



    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setPhoneSetUp(false)
        setUser(null);
        setIsPremium({
          isPremium: false,
          isPremiumTrial: false,
          trialExpiresAt: null,
        })
        setLoading(false)
        setRole(null)
        openSignupModal()
      } else {
        setUser(currentUser);
        changePercentDecimal()
      }
    });

    return () => unsubscribe(); 
    
    
  };


  return (
    <div>
      <div className='col-lg-10 col-sm-12 m-auto'>
        <div className='alertsBox'>
          {showAlert && (
            <div className={`alert alert-success fade show ${animationClass}`} role="alert"
            dangerouslySetInnerHTML={{ __html: alertText }}>
              
            </div>
          )}
        </div>

        {/* <div className='text-start text-white mt-4 mb-3 d-flex justify-content-between align-items-center'>
          <div className='col-12'><h1>Premier League Matches</h1></div>
        </div> */}
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
                <input type="text" className='search' placeholder="Search team..." onChange={(e) => setSearchTerm(e.target.value)} value={searchTerm} />
              </div>
              <div className='col-4 toggle d-flex justify-content-end align-items-center m-0 text-lightgrey pe-0 font-12 fw-bold' data-bs-toggle="tooltip" data-bs-placement="top" title="Change to odds to %">
                <div className='pe-2'>%</div>  
                <ToggleSwitch
                  id="percentOdds"
                  checked={percentOdds}
                  onChange={onPercentOddsChange}
                />
              </div>
            </div>
            <div className='match-list'>
              {!loadingHome ? (<>
              {Object.keys(filteredGroupedMatches).map((date) => {
                // Filter matches for this date
                const matchesForDate = filteredGroupedMatches[date].filter(
                  (match) => match.sport_key === selectedLeague.key
                );

                // Skip this date if no matches
                if (matchesForDate.length === 0) return null;

                return (
                  <div key={date} className="date-group">
                    <div className='text-uppercase text-lightgrey col-12 bg-lightgreen text-start date matchMargin py-2'>
                      {date}
                    </div> 
                    {matchesForDate.map((match) => (
                      <div key={match.id} className="match">
                        <div className='matchMargin text-start'>
                          <div className='text-lightgrey py-2 font-12 d-flex justify-content-between align-items-center'>
                            <div>{match.time}</div>
                            <div>1 x 2</div>
                          </div>
                          <div>
                          <div className='matchdiv mb-3'>
                            <div className='d-flex align-items-center mouse-pointer chevronbox col-lg-4 col-sm-12' onClick = {() => handleGetMarkets(match)}> 
                              <div className='me-4 chevron' 
                                  aria-controls={`collapse-${match.id}`}
                                  aria-expanded={openMarkets[match.id] || false}>
                                  {loadingMatch[match.id] ? (
                                    <Spinner animation="border" size="sm" />
                                  ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                                  </svg>
                                  )}
                              </div>
                              <div>
                                <div className='py-1 text-white fw-bold font-15'>
                                  <img 
                                    src = {getImagePath(match.homeTeam)}
                                    alt={match.homeTeam} 
                                    className="team-logo"/>
                                  {match.homeTeam}
                                </div>
                                <div className='py-1 text-white fw-bold font-15'>
                                  <img 
                                    src = {getImagePath(match.awayTeam)}
                                    alt={match.awayTeam} 
                                    className="team-logo"/>
                                  {match.awayTeam}
                                </div>
                              </div>
                            </div>
                            <div
                              className='odds-container d-flex justify-content-between'>  {/* Display the odds */}
                              <div onClick={() => handleOddsClick(match.id, match.homeTeam, match.homeOdds, '1x2', match)} 
                                key={`home-${match.id}`} 
                                className={`rounded px-4 py-2 text-center ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === match.homeTeam && odd.selectedMarket === "1x2") ? 'oddsClicked' : 'odds'}`}>
                                <div className={`odds-content ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === match.homeTeam && odd.selectedMarket === "1x2") ? 'teamNameClicked' : 'teamName'}`}>
                                  {match.homeTeam}
                                </div>
                                <div className={`odds-content ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === match.homeTeam && odd.selectedMarket === "1x2") ? 'teamOddsClicked' : 'teamOdds'}`}>
                                  {percentOdds ?  `${((1 / match.homeOdds) * 100).toFixed(2)}%` : Number.isInteger(match.homeOdds*1) ? match.homeOdds*1 : (match.homeOdds*1).toFixed(2) }
                                </div>
                              </div>
                              <div onClick={() => handleOddsClick(match.id, 'Draw', match.drawOdds, '1x2', match)} 
                                key={`draw-${match.id}`} 
                                className={`rounded px-4 py-2 text-center ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === 'Draw' && odd.selectedMarket === "1x2") ? 'oddsClicked' : 'odds'}`}>
                                <div className={`odds-content ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === 'Draw' && odd.selectedMarket === "1x2") ? 'teamNameClicked' : 'teamName'}`}>
                                  Draw
                                </div>
                                <div className={`odds-content ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === 'Draw' && odd.selectedMarket === "1x2") ? 'teamOddsClicked' : 'teamOdds'}`}>
                                  {percentOdds ?  `${((1 / match.drawOdds) * 100).toFixed(2)}%` : Number.isInteger(match.drawOdds*1) ? match.drawOdds*1 : (match.drawOdds*1).toFixed(2) }                          
                                </div>
                              </div>
                              <div onClick={() => handleOddsClick(match.id, match.awayTeam, match.awayOdds, '1x2', match)} 
                                  key={`away-${match.id}`} 
                                  className={`rounded px-4 py-2 text-center ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === match.awayTeam && odd.selectedMarket === "1x2") ? 'oddsClicked' : 'odds'}`}>
                                <div className={`odds-content ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === match.awayTeam && odd.selectedMarket === "1x2") ? 'teamNameClicked' : 'teamName'}`}>
                                  {match.awayTeam}
                                </div>
                                <div className={`odds-content ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === match.awayTeam && odd.selectedMarket === "1x2") ? 'teamOddsClicked' : 'teamOdds'}`}>
                                  {percentOdds ?  `${((1 / match.awayOdds) * 100).toFixed(2)}%` : Number.isInteger(match.awayOdds*1) ? match.awayOdds*1 : (match.awayOdds*1).toFixed(2) }                          
                                </div>
                              </div>
                            </div>
                          </div>
                          <Collapse in={openMarkets[match.id] !== undefined ? openMarkets[match.id] : false}>
                            <div>
                            <div className='col-12'>
                            <div className="searchMarket w-100 text-end d-flex align-items-center justify-content-center">
                              <span className="searchMarket-text" id="basic-addon1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
                                    fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                                  </svg>
                                </span>
                              <input type="text" className="search2" placeholder="Search Markets..." onChange={(e) => setSearchMarket((prev) => ({...prev, [match.id]: e.target.value}))} value={searchMarket?.[match.id] || ''} />
                              <Button onClick={() => setShowAll((prev) => ({
                                ...prev,
                                [match.id]: prev?.[match.id] || false ? false : true,
                              }))} className={`showHide ${showAll[match.id] ? 'bg-lightgreen': ''}`}>{showAll[match.id] ? 'Hide' :  'Show All'}</Button>
                            </div>
                            </div>
                            <div id={`collapse-${match.id}`} className='mt-0 mb-0'>
                              {match.marketIDs
                              .filter(
                                (market) =>
                                  market.market.toLowerCase().includes(searchMarket?.[match.id]?.toLowerCase() || '')
                              ).length === 0 ? (
                                <div className="col-12 text-center py-1 text-lightgrey font-10">
                                  Oops... An error occured. Please try again later.
                                </div>
                              ) : (
                                match.marketIDs
                                .filter(
                                  (market) =>
                                    market.market.toLowerCase().includes(searchMarket?.[match.id]?.toLowerCase() || '')
                                ).sort((a, b) => a.market.localeCompare(b.market))
                                .slice(0, searchMarket?.[match.id] ? match.marketIDs.length : 5)
                                .map((market) => (
                                  <div key={`${market.marketId}`}>
                                    <Button 
                                      onClick={() => {oddschecker(market.marketId);}}
                                      aria-controls={`collapse-${market.marketId}`}
                                      aria-expanded={open[market.marketId] || false}
                                      className='drop d-flex justify-content-between align-items-center'
                                    >
                                      <div>{market.market}</div>
                                      <div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
                                          <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                                        </svg>
                                      </div>
                                    </Button>
                                    <Collapse in={open[market.marketId]}>
                                    <div>
                                      <div id={`collapse-${market.marketId}`}  className="py-2 px-2 mx-0 mb-2 row collapseContent">
                                        {fetchError && markets.length === 0 ? (
                                          <div className="col-12 text-center py-1 text-lightgrey font-10">
                                            Oops... An error occured. Please try again later.
                                          </div>
                                        ) : (
                                          markets
                                            .filter(
                                              (m) =>
                                                m.subeventName === match.fixture &&
                                                m.marketTypeName === market.market
                                            )
                                            .flatMap((m) => m.bets)
                                            .map((bets) =>
                                              bets.bestOddsDecimal !== undefined && (
                                                <div
                                                  key={`${market.marketId}-${bets.betName}-${bets.line}`}
                                                  className="col-12 col-md-6 col-lg-4 col-xl-3 d-flex marketBets mouse-pointer"
                                                >
                                                  {bets.line === undefined ? (
                                                    <div
                                                      className={`d-flex justify-content-between align-items-center flex-fill marketBetContent ${
                                                        selectedOdds.some(
                                                          (odd) =>
                                                            odd.id === match.id &&
                                                            odd.selectedType === bets.betName &&
                                                            odd.selectedMarket === market.market
                                                        )
                                                          ? "marketClicked"
                                                          : "market"
                                                      }`}
                                                      onClick={() =>
                                                        handleOddsClick(
                                                          match.id,
                                                          bets.betName,
                                                          bets.bestOddsDecimal,
                                                          market.market,
                                                          match
                                                        )
                                                      }
                                                    >
                                                      <div className="betsName">{bets.betName.replace("/", " / ")}</div>
                                                      <div className="betsOdds">
                                                        {percentOdds
                                                          ? `${((1 / bets.bestOddsDecimal) * 100).toFixed(2)}%`
                                                          : Number.isInteger(bets.bestOddsDecimal)
                                                          ? bets.bestOddsDecimal
                                                          : bets.bestOddsDecimal.toFixed(2)}
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div
                                                      className={`d-flex justify-content-between align-items-center flex-fill marketBetContent ${
                                                        selectedOdds.some(
                                                          (odd) =>
                                                            odd.id === match.id &&
                                                            odd.selectedType === `${bets.betName}-${bets.line}` &&
                                                            odd.selectedMarket === market.market
                                                        )
                                                          ? "marketClicked"
                                                          : "market"
                                                      }`}
                                                      onClick={() =>
                                                        handleOddsClick(
                                                          match.id,
                                                          `${bets.betName}-${bets.line}`,
                                                          bets.bestOddsDecimal,
                                                          market.market,
                                                          match
                                                        )
                                                      }
                                                    >
                                                      <div className="betsName">
                                                        {bets.betName.replace("/", " / ")} {bets.line}
                                                      </div>
                                                      <div className="betsOdds">
                                                        {percentOdds
                                                          ? `${((1 / bets.bestOddsDecimal) * 100).toFixed(2)}%`
                                                          : Number.isInteger(bets.bestOddsDecimal)
                                                          ? bets.bestOddsDecimal
                                                          : bets.bestOddsDecimal.toFixed(2)}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              )
                                            )
                                        )}
                                      </div>
                                      </div>
                                    </Collapse>
                                  </div>
                                ))
                              )}
                              </div>
                              </div>
                          </Collapse>
                          <Collapse in={openMarkets[match.id] !== undefined && showAll[match.id] && !searchMarket[match.id] ? openMarkets[match.id] : false} className='mt-0'>
                          <div>
                          <div id={`collapse-${match.id}`} className="mt-0 mb-5">
                            {match.marketIDs
                            .filter(
                              (market) =>
                                market.market.toLowerCase().includes(searchMarket?.[match.id]?.toLowerCase() || '')
                            )
                            .sort((a, b) => a.market.localeCompare(b.market))
                            .slice(5)
                            .map((market) => (
                              <div key={`${market.marketId}`}>
                                <Button 
                                  onClick={() => oddschecker(market.marketId)}
                                  aria-controls={`collapse-${market.marketId}`}
                                  aria-expanded={open[market.marketId] || false}
                                  className='drop d-flex justify-content-between align-items-center'
                                >
                                  <div>{market.market}</div>
                                  <div>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
                                      <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                                    </svg>
                                  </div>
                                </Button>
                                <Collapse in={open[market.marketId]}>
                                <div>
                                  <div id={`collapse-${market.marketId}`}  className="py-2 px-2 mx-0 mb-2 row collapseContent">
                                    {markets
                                    .filter(
                                      (m) =>
                                        m.subeventName === match.fixture &&
                                        m.marketTypeName === market.market
                                    )
                                    .flatMap((m) => m.bets)
                                    .map((bets) => (
                                      bets.bestOddsDecimal !== undefined && (
                                        <div key={`${market.marketId}-${bets.betName}-${bets.line}`} className="col-12 col-md-6 col-lg-4 col-xl-3 d-flex marketBets mouse-pointer" >
                                        {bets.line === undefined 
                                          ? (
                                              <div className={`d-flex justify-content-between align-items-center flex-fill marketBetContent ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === bets.betName && odd.selectedMarket === market.marketTypeName) ? 'marketClicked' : 'market'}`}
                                                onClick={() => handleOddsClick(match.id, bets.betName, bets.bestOddsDecimal, market.marketTypeName, match)}>
                                                <div className='betsName'>{bets.betName.replace('/', ' / ')}</div>
                                                <div className='betsOdds'>{Number.isInteger(bets.bestOddsDecimal) ? bets.bestOddsDecimal : bets.bestOddsDecimal.toFixed(2) }</div>
                                              </div>
                                            )
                                          : (
                                              <div className={`d-flex justify-content-between align-items-center flex-fill marketBetContent ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === `${bets.betName}-${bets.line}` && odd.selectedMarket === market.marketTypeName) ? 'marketClicked' : 'market'}`}
                                              onClick={() => handleOddsClick(match.id, `${bets.betName}-${bets.line}`, bets.bestOddsDecimal, market.marketTypeName, match)}>
                                                <div className='betsName'>{bets.betName.replace('/', ' / ')} {bets.line}</div>
                                                <div className='betsOdds'>{Number.isInteger(bets.bestOddsDecimal) ? bets.bestOddsDecimal : bets.bestOddsDecimal.toFixed(2) }</div>
                                              </div>
                                            )
                                        }
                                      </div>
                                      )
                                    ))}
                                  </div>
                                  </div>
                                </Collapse>
                              </div>
                            ))}
                            </div>
                            </div>
                          </Collapse>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
                </>) : (<>
                  <div className='col-12 m-auto mt-5 text-white text-center loadingSpinner'><Spinner animation="border" size="xl" /></div>
              </>)}
            </div>
          </div>
          
          
        </div>      
      </div>
    </div>
  );
}

export default App;
