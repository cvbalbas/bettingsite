import React, { useEffect, useState } from 'react';


import { Button, Collapse } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import ToggleSwitch from "./ToggleSwitch";
import { getAuth, onAuthStateChanged } from 'firebase/auth';  


function App({user, setUser, walletBalance, setWalletBalance, isPremium, setIsPremium, selectedOdds, setSelectedOdds, betsOpen, setBetsOpen, betAmounts, setBetAmounts, estimatedPayouts, setEstimatedPayouts, handleClearAllBets, openPremiumModal, closePremiumModal, showAlert, setShowAlert, alertText, setAlertText, animationClass, setAnimationClass, setPhoneSetUp, setRole, openSignupModal, setLoading, selectedLeague, setSelectedLeague, percentOdds, setPercentOdds}) {

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
  const [filteredGroupedMatches, setFilteredGroupedMatches] = useState({});



  useEffect(() => {
    if (notif.length > 0) {
      if(notif[0]?.split('$')[3] === "danger"){
        setAlertText(`<strong>Failed to add bet! </strong> <br/>${notif[0]?.split('$')[0]} - ${notif[0]?.split('$')[1]} - ${notif[0]?.split('$')[2]}`);
      } else if (notif[0]?.split('$')[3] === "success"){
        setAlertText(`<strong>Successfully added bet! </strong> <br/>${notif[0]?.split('$')[0]} - ${notif[0]?.split('$')[1]} - ${notif[0]?.split('$')[2]}`);
      }
      setAnimationClass('alert-fade-in');
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
    // console.log(matches)
    // console.log(filteredGroupedMatches)
    // console.log(markets)
  }, [isPremium, user, markets, matches, loadedMatches, open, searchMarket, filteredGroupedMatches])

  
  useEffect(() => {
    const fetchOdds = async (league) => {
      
      try {
        const response = await fetch(`/api/odds?league=${league.key}`); 
        const data = await response.json();
        // console.log("update")
        // console.log(data.data)
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
    // console.log(formattedName)
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
    // console.log(match) 
    // console.log(match.teams)
      let fixture = ""
      fixture += convert_name(match.home_team)
      fixture += "-v-"
      fixture += convert_name(match.teams.filter(team => team !== match.home_team)[0])
      
      // console.log(fixture)
      let marketIDsForMatch = Array.from(
        new Map(
          marketIDs
            .filter((market) => market.fixture === fixture)
            .map((market) => [market.marketId, { marketId: market.marketId, market: market.market }])
        ).values()
      );

      
      const hasPenaltyInMatch = marketIDsForMatch.some(
        m => m.market.toLowerCase() === "penalty in match"
      );
      // console.log(hasPenaltyInMatch)

      if (!hasPenaltyInMatch) { // remove penalty markets if penalty in match is missing
        marketIDsForMatch = marketIDsForMatch.filter(
          m =>
            !["to score a penalty", "to miss a penalty"].includes(
              m.market.toLowerCase()
            )
        );
        // console.log(marketIDsForMatch)
      } else { // check penalty in match bets
        // console.log("penalty in match included")
        let searchMarketID = 0
        for(let i = 0; i < marketIDsForMatch.length; i++){
          if(marketIDsForMatch[i].market.toLowerCase() === "penalty in match"){
            searchMarketID = marketIDsForMatch[i].marketId
          }
        }

        // console.log(searchMarketID)

        // fetch("https://www.oddschecker.com/api/markets/v2/all-odds?market-ids=" + searchMarketID  + "&repub=OC")
        // .then((response) => response.json())
        // .then((data) => {
        //   data = simplifyData(data)
        //   console.log(data)
        //   data.push({
        //     "marketId": 3577872887,
        //     "marketName": "Union Berlin v Borussia Mgladbach#Penalty In Match",
        //     "subeventId": 100675466,
        //     "subeventName": "Union Berlin v Borussia Mgladbach",
        //     "subeventType": "MATCH",
        //     "subeventStartTime": "2025-10-17T18:30:00Z",
        //     "subeventEndTime": "2025-10-17T21:30:00Z",
        //     "eventId": 9941,
        //     "eventName": "German Bundesliga Matches",
        //     "categoryId": 27,
        //     "categoryName": "European Football",
        //     "betTypeId": 2589,
        //     "marketTypeName": "Penalty In Match",
        //     "marketGroup": "Stats Betting",
        //     "priority": 21,
        //     "bets": [
        //       {
        //         "marketId": 3577872887,
        //         "betId": 27158526382,
        //         "betName": "Yes",
        //         "bestOddsDecimal": 3
        //       }, {
        //         "marketId": 3577872887,
        //         "betId": 27158526381,
        //         "betName": "No",
        //         "bestOddsDecimal": 2
        //       }
        //     ]
        //   })
        //   console.log(data)


        //   if (data[0].bets.length < 2) {
        //     marketIDsForMatch = marketIDsForMatch.filter(
        //       m =>
        //         !["to score a penalty", "to miss a penalty", "penalty in match"].includes(
        //           m.market.toLowerCase()
        //         )
        //     );
        //   }
        //   console.log(marketIDsForMatch)

        // })
        // .catch((error) => {
        //   console.error("Error fetching odds:", error);
        // });


      }
      


      
      // console.log(fixture)

      let subeventName = fixture
      .split('-') 
      .map((team) => team.charAt(0).toUpperCase() + team.slice(1)) 
      .join(' ')
      .replace(' V ', ' v ')
      
      let index_home = match.teams.indexOf(match.home_team)
      let index_away = match.teams.indexOf(match.teams.filter(team => team !== match.home_team)[0])


      const homeOdds = match.sites[lowestIndex].odds.h2h[index_home];
      const drawOdds = match.sites[lowestIndex].odds.h2h[2];
      const awayOdds = match.sites[lowestIndex].odds.h2h[index_away];

      // Step 1: implied probabilities
      const probHome = 1 / homeOdds;
      const probDraw = 1 / drawOdds;
      const probAway = 1 / awayOdds;

      // Step 2: normalize
      const totalProb = probHome + probDraw + probAway;

      const normProbHome = probHome / totalProb;
      const normProbDraw = probDraw / totalProb;
      const normProbAway = probAway / totalProb;

      // Step 3: convert back to odds
      const normHomeOdds = (1 / normProbHome).toFixed(2);
      const normDrawOdds = (1 / normProbDraw).toFixed(2);
      const normAwayOdds = (1 / normProbAway).toFixed(2);

      // console.log("Normalized Odds:", {
      //   home: normHomeOdds,
      //   draw: normDrawOdds,
      //   away: normAwayOdds
      // });
     
      // console.log(index_home, index_away)
      const matchDateTime = new Date(match.commence_time * 1000); // convert to Date object
      if (matchDateTime > new Date()) {
        groupedMatches[matchDate].push({
          fixture: subeventName,
          id: match.id,
          homeTeam: match.home_team,
          awayTeam: match.teams.filter(team => team !== match.home_team)[0],
          time: formatTime(match.commence_time),
          date: formatDate(match.commence_time),
          timestamp: match.commence_time,
          homeOdds: normHomeOdds, 
          drawOdds: normDrawOdds,
          awayOdds: normAwayOdds,
          marketIDs: marketIDsForMatch,
          sport_key: match.sport_key
        });
        // groupedMatches[matchDate].push({
        //   fixture: subeventName,
        //   id: match.id,
        //   homeTeam: match.home_team,
        //   awayTeam: match.teams.filter(team => team !== match.home_team)[0],
        //   time: "05:30",
        //   date: "29 September 2025",
        //   timestamp: 1759120200,
        //   homeOdds: match.sites[lowestIndex].odds.h2h[index_home].toFixed(2), 
        //   drawOdds: match.sites[lowestIndex].odds.h2h[2].toFixed(2),
        //   awayOdds: match.sites[lowestIndex].odds.h2h[index_away].toFixed(2),
        //   marketIDs: marketIDsForMatch,
        //   sport_key: match.sport_key
        // });
      }
    });

    return groupedMatches;
  };

  


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
    console.log("filtered grouped matches: ", newFiltered)
    setFilteredGroupedMatches(newFiltered);
  }, [matches, searchTerm]);
  
 
  const handleOddsClick = (matchId, type, odds, market, match) => {
    // console.log(match)
    const nowUnix = Math.floor(Date.now() / 1000); // current time in seconds
    // Compare
    if (match.timestamp < nowUnix) {
      setNotif(() => [match.fixture + '$' + market + '$' +  type + '$' + 'danger'])
    } else {
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
        setNotif(() => [match.fixture + '$' + market + '$' +  type+ '$' + 'success'])

      } else {
        setSelectedOdds((prevSelectedOdds) =>
          prevSelectedOdds.filter((_, i) => i !== matchIndex)
        );
      }
    }
    
    
  };

  useEffect(() => {
    
    const fetchMarketsRepeat = async () => {
      const openMarketsMatchIds = Object.keys(open)
      .filter(key => open[key])
      .map(Number);


      
      // console.log(open)
      // console.log(openMarketsMatchIds)
      let searchMarketID = openMarketsMatchIds[0]
      if (openMarketsMatchIds.length !== 0){
        let matchToFind = findParentAndMarket(filteredGroupedMatches, searchMarketID)
        // console.log(matchToFind)
        let marketName = matchToFind.market.market
        let match = matchToFind.parent
        // console.log(marketName)
        // console.log(match)
        if (marketName.toLowerCase() === "to score a penalty" || 
            marketName.toLowerCase() === "to miss a penalty"){
          searchMarketID = match.marketIDs.filter((market) => market.market.toLowerCase() === "to score a penalty" ||
          market.market.toLowerCase() === "to miss a penalty" || market.market.toLowerCase() === "penalty in match").map((market) => market.marketId).join(",")
          // console.log(searchMarketID)
        } else if (marketName.toLowerCase() === "to score in both halves") {
          searchMarketID = match.marketIDs.filter((market) => market.market.toLowerCase() === "to score in both halves" ||
          market.market.toLowerCase() === "both teams to score in both halves").map((market) => market.marketId).join(",")
          // console.log(searchMarketID)
        } else if (marketName.toLowerCase() === "to win either half" ) {
          searchMarketID = match.marketIDs.filter((market) => market.market.toLowerCase() === "to win either half" || market.market.toLowerCase() === "half time" || market.market.toLowerCase() === "second half result" ).map((market) => market.marketId).join(",")
          // console.log(searchMarketID)
        } else if (marketName.toLowerCase() === "to win both halves") {
          searchMarketID = match.marketIDs.filter((market) => market.market.toLowerCase() === "half time" || market.market.toLowerCase() === "second half result" || market.market.toLowerCase() === "to win both halves" ).map((market) => market.marketId).join(",")
          // console.log(searchMarketID)
        } else if (marketName.toLowerCase() === "to win from behind") {
          searchMarketID = match.marketIDs.filter((market) => market.market.toLowerCase() === "to win from behind" || market.market.toLowerCase() === "team to score first" || market.market.toLowerCase() === "win market" ).map((market) => market.marketId).join(",")
          // console.log(searchMarketID)
        } else if (marketName.toLowerCase() === "to win to nil") {
          searchMarketID = match.marketIDs.filter((market) => market.market.toLowerCase() === "to win to nil" || market.market.toLowerCase() === "clean sheet" || market.market.toLowerCase() === "win market" ).map((market) => market.marketId).join(",")
          // console.log(searchMarketID)
        } 

      
        fetch("https://www.oddschecker.com/api/markets/v2/all-odds?market-ids=" + searchMarketID  + "&repub=OC")
        .then((response) => response.json())
        .then((data) => {
          data = simplifyData(data)
          // console.log(data)

          const normalizedData = normalizeData(data,marketName);
          console.log("normalized data: ", normalizedData);


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
          updateMarkets(normalizedData);
        })
        .catch((error) => {
          console.error("Error fetching odds:", error);
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

  
  const [pendingOpen, setPendingOpen] = useState(null);

  // Function to look for the win market odds
  function findParentAndMarket(data, targetMarketId) {
    for (const date in data) {
      for (const obj of data[date]) {
        if (Array.isArray(obj.marketIDs)) {
          const found = obj.marketIDs.find(m => m.marketId === targetMarketId);
          const index = obj.marketIDs.findIndex(m => m.marketId === targetMarketId);
          // console.log(index)
          if (found) return { parent: obj, market: found, index: index};
        }
      }
    }
    return null;
  }
  function removeMarketById(data, targetMarketId) {
    for (const date in data) {
      for (const obj of data[date]) {
        if (Array.isArray(obj.marketIDs)) {
          const index = obj.marketIDs.findIndex(m => m.marketId === targetMarketId);
          if (index !== -1) {
            obj.marketIDs.splice(index, 1); // remove the market
            return data; // return the updated data object
          }
        }
      }
    }
    return data; // return unchanged data if not found
  }

  
  //Normalisation Functions
  function normalizeData(data, type) {
    let origMarketTypeName = type
    type = type.toLowerCase()

    const matchToFind = data[0].marketId
    const match = findParentAndMarket(filteredGroupedMatches, matchToFind)
    // console.log(match)

    if (!Array.isArray(data)) {
      console.error("normalizeData: expected array of markets");
      return [];
    }

    const cloned = JSON.parse(JSON.stringify(data)); // deep copy
    console.log("Raw cloned markets:", cloned);

    // Build a flat array of all selections across all markets
    const allSelections = [];

    cloned.forEach(market => {
      const bets = Array.isArray(market.bets) ? market.bets : [];

      bets.forEach(b => {
        if (b.bestOddsDecimal !== undefined && b.bestOddsDecimal !== null) {
          allSelections.push({
            marketTypeName: market.marketTypeName,
            name: b.line ? `${b.betName} ${b.line}` : b.betName,
            odds: b.bestOddsDecimal
          });
        }
      });
    });

    console.log("Combined market selections:", allSelections);
    let normalized;

    // Normalize markets that depend on others

    if (type.includes("to miss a penalty") 
      || type.includes("to score a penalty")) {

      console.log("penalty")
      let penaltyInMatchSelections = allSelections.filter((match) => match.marketTypeName.toLowerCase() === "penalty in match")
      // console.log(penaltyInMatchSelections)
      let normalizedPenaltyInMatch = standardNormalization(penaltyInMatchSelections)
      normalizedPenaltyInMatch.forEach((match) => match.marketTypeName = "Penalty In Match")
      // console.log(normalizedPenaltyInMatch)
      
      let allPenalty = [...allSelections.filter((match) => match.marketTypeName.toLowerCase() !== "penalty in match"), ...normalizedPenaltyInMatch]
      // console.log(allPenalty)
      normalized = penaltyNormalization(allPenalty);
      console.log("Normalized: ", normalized)


    } else if (type.includes("match result and over/under")) {

      // console.log(allSelections)
      normalized = normalizeOverUnderMix(allSelections)
      console.log("pair mix")
      console.log("Normalized: ", normalized)

    } else if (type.includes("total goals over/under") 
      || type.includes("total away goals") 
      || type.includes("total home goals") 
      || type.includes("total goals - 1st half")
      || type.includes("total goals - 2nd half")){

      // console.log(allSelections)
      normalized = normalizeOverUnder(allSelections)
      console.log("pair")
      console.log("Normalized: ", normalized)

    } else if (type.includes("first goalscorer") || type.includes("last goalscorer")) {
      normalized = goalscorerNormalization(allSelections);
      normalized.forEach(bet => bet.marketTypeName = origMarketTypeName)

    } else if (
      type.includes("anytime goalscorer") ||
      type.includes("hat-trick") ||
      type.includes("score 2 or more") ||
      type.includes("player assists")) {
      // do nothing for now
      normalized = allSelections.map(p => ({  
        name: p.name,
        fairOdds: p.odds,
        marketTypeName: origMarketTypeName
      }));
      console.log("do nothing")

    } else if (type.includes("double chance")) {
      console.log("double chance")
      normalized = normalizeDoubleChance(allSelections);
      normalized.forEach(bet => bet.marketTypeName = origMarketTypeName)
      console.log("Normalized: ", normalized)

    } else if (type === "to score in both halves"){

      console.log("to score in both halves")
      // normalize both teams to score in both halves
      let bothTeamsToScoreInBothHalvesSelections = allSelections.filter((match) => match.marketTypeName.toLowerCase() === "both teams to score in both halves")
      // console.log(bothTeamsToScoreInBothHalvesSelections)
      let normalizedBothTeamsToScoreInBothHalves = standardNormalization(bothTeamsToScoreInBothHalvesSelections)
      normalizedBothTeamsToScoreInBothHalves.forEach((match) => match.marketTypeName = "Both Teams To Score In Both Halves")
      // console.log(normalizedBothTeamsToScoreInBothHalves)

      // merge
      let bothHalves = [...allSelections.filter((match) => match.marketTypeName.toLowerCase() !== "both teams to score in both halves"), ...normalizedBothTeamsToScoreInBothHalves]
      // console.log(bothHalves)

      // normalize to score in both halves
      normalized = bothHalvesNormalizaion(bothHalves);
      normalized = [...normalizedBothTeamsToScoreInBothHalves, ...normalized]
      console.log("Normalized: ", normalized)

    } else if (type === "to win both halves"){

      console.log("both halves")

      // normalize half time
      let halfTimeSelections = allSelections.filter((match) => match.marketTypeName.toLowerCase() === "half time")
      // console.log(halfTimeSelections)
      let normalizedHalfTime = standardNormalization(halfTimeSelections)
      normalizedHalfTime.forEach((match) => match.marketTypeName = "Half Time")
      // console.log(normalizedHalfTime)

      // normalize second half
      let secondHalfSelections = allSelections.filter((match) => match.marketTypeName.toLowerCase() === "second half result")
      // console.log(secondHalfSelections)
      let normalizedSecondHalf = standardNormalization(secondHalfSelections)
      normalizedSecondHalf.forEach((match) => match.marketTypeName = "Second Half Result")
      // console.log(normalizedSecondHalf)


      // merge
      let bothHalves = [...allSelections.filter((match) => match.marketTypeName.toLowerCase() === "to win both halves"), ...normalizedHalfTime, ...normalizedSecondHalf]
      // console.log(bothHalves)

      // normalize
      normalized = toWinBothHalvesNormalizaion(bothHalves);
      normalized = [...normalizedSecondHalf, ...normalizedHalfTime, ...normalized]
      console.log("Normalized: ", normalized)

    } else if (type === "to win either half"){

      console.log("either half")

      // normalize half time
      let halfTimeSelections = allSelections.filter((match) => match.marketTypeName.toLowerCase() === "half time")
      // console.log(halfTimeSelections)
      let normalizedHalfTime = standardNormalization(halfTimeSelections)
      normalizedHalfTime.forEach((match) => match.marketTypeName = "Half Time")
      // console.log(normalizedHalfTime)

      // normalize second half
      let secondHalfSelections = allSelections.filter((match) => match.marketTypeName.toLowerCase() === "second half result")
      // console.log(secondHalfSelections)
      let normalizedSecondHalf = standardNormalization(secondHalfSelections)
      normalizedSecondHalf.forEach((match) => match.marketTypeName = "Second Half Result")
      // console.log(normalizedSecondHalf)


      // merge
      let bothHalves = [...allSelections.filter((match) => match.marketTypeName.toLowerCase() === "to win either half"), ...normalizedHalfTime, ...normalizedSecondHalf]
      // console.log(bothHalves)

      // normalize
      normalized = toWinEitherHalfNormalizaion(bothHalves);
      normalized = [...normalizedSecondHalf, ...normalizedHalfTime, ...normalized]
      console.log("Normalized: ", normalized)

    } else if (type === "to win from behind"){

      console.log("behind")

      // normalize team to score first
      let scoreFirstSelections = allSelections.filter((match) => match.marketTypeName.toLowerCase() === "team to score first")
      // console.log(scoreFirstSelections)
      let normalizedScoreFirst = standardNormalization(scoreFirstSelections)
      normalizedScoreFirst.forEach((match) => match.marketTypeName = "Team To Score First")
      // console.log(normalizedScoreFirst)

      // normalize win market
      // let winMarketSelections = allSelections.filter((match) => match.marketTypeName.toLowerCase() === "win market")
      let winMarketSelections = [
        {
          marketTypeName: 'Win Market', 
          name: match.parent.fixture.split(" v ")[0], 
          odds: match.parent.homeOdds
        },{
          marketTypeName: 'Win Market', 
          name: match.parent.fixture.split(" v ")[1], 
          odds: match.parent.awayOdds
        },{
          marketTypeName: 'Win Market', 
          name: "Draw", 
          odds: match.parent.drawOdds
        }
      ]
      console.log("Win Market: ", winMarketSelections)
      let normalizedWinMarket = standardNormalization(winMarketSelections)
      normalizedWinMarket.forEach((match) => match.marketTypeName = "Win Market")
      // console.log(normalizedWinMarket)





      // merge
      let behind = [...allSelections.filter((match) => match.marketTypeName.toLowerCase() === "to win from behind"), ...normalizedWinMarket, ...normalizedScoreFirst]
      // console.log(behind)

      // normalize
      normalized = toWinFromBehindNormalization(behind);
      normalized = [...normalizedWinMarket, ...normalizedScoreFirst, ...normalized]
      console.log("Normalized: ", normalized)

    } else if (type === "to win to nil"){

      console.log("nil")

      // normalize clean sheet
      let cleanSheetSelections = allSelections.filter((match) => match.marketTypeName.toLowerCase() === "clean sheet")
      // console.log(cleanSheetSelections)
      let normalizedCleanSheet = cleanSheetNormalization(cleanSheetSelections)
      normalizedCleanSheet.forEach((match) => match.marketTypeName = "Clean Sheet")
      // console.log(normalizedCleanSheet)

      // normalize win market
      // let winMarketSelections = allSelections.filter((match) => match.marketTypeName.toLowerCase() === "win market")

      let winMarketSelections = [
        {
          marketTypeName: 'Win Market', 
          name: match.parent.fixture.split(" v ")[0], 
          odds: match.parent.homeOdds
        },{
          marketTypeName: 'Win Market', 
          name: match.parent.fixture.split(" v ")[1], 
          odds: match.parent.awayOdds
        },{
          marketTypeName: 'Win Market', 
          name: "Draw", 
          odds: match.parent.drawOdds
        }
      ]
      console.log("Win Market: ", winMarketSelections)
      let normalizedWinMarket = standardNormalization(winMarketSelections)
      normalizedWinMarket.forEach((match) => match.marketTypeName = "Win Market")
      // console.log(normalizedWinMarket)


      // merge
      let nil = [...allSelections.filter((match) => match.marketTypeName.toLowerCase() === "to win to nil"), ...normalizedWinMarket, ...normalizedCleanSheet]
      // console.log(nil)

      // normalize
      normalized = toWinToNilNormalization(nil);
      normalized = [...normalizedWinMarket, ...normalizedCleanSheet, ...normalized]
      console.log("Normalized: ", normalized)

    } else if (type === "clean sheet"){

      console.log("clean sheet")

      // normalize
      normalized = cleanSheetNormalization(allSelections);
      console.log("Normalized: ", normalized)

    } else {
      normalized = standardNormalization(allSelections);
      normalized.forEach(bet => bet.marketTypeName = origMarketTypeName)
      console.log("Normalized: ", normalized)
    }
   
    cloned.forEach(market => {
      market.bets = market.bets
        // Keep only bets that exist in normalized (matched by name + marketTypeName)
        .filter(b => {
          const name = b.line ? `${b.betName} ${b.line}` : b.betName;
          return normalized.some(
            n =>
              n.name === name &&
              n.marketTypeName?.toLowerCase() === market.marketTypeName.toLowerCase()
          );
        })
        // Update bestOddsDecimal with normalized fairOdds
        .map(b => {
          const name = b.line ? `${b.betName} ${b.line}` : b.betName;
          const norm = normalized.find(
            n =>
              n.name === name &&
              n.marketTypeName?.toLowerCase() === market.marketTypeName.toLowerCase()
          );

          return {
            ...b,
            bestOddsDecimal: norm ? norm.fairOdds : b.bestOddsDecimal
          };
        });
    });

    // cloned.forEach(market => {
    //   const type = market.marketTypeName.toLowerCase();
    //   const selections = allSelections.filter(
    //     s => s.marketTypeName.toLowerCase() === type
    //   );

      

    //   if (type.includes("first goalscorer") || type.includes("last goalscorer")) {
    //     normalized = goalscorerNormalization(selections);

    //   } else if (
    //     type.includes("anytime goalscorer") ||
    //     type.includes("hat-trick") ||
    //     type.includes("score 2 or more")
    //   ) {
    //     normalized = anytimeGoalscorerNormalization(selections);

    //   } else if (type.includes("double chance")) {
    //     normalized = normalizeDoubleChance(selections);

    //   } else if (type.includes("correct score")) {
    //     normalized = selections.map(p => ({
    //       name: p.name,
    //       fairOdds: p.odds
    //     }));

    //   } else if (type.includes("to miss a penalty") || type.includes("to score a penalty")) {

       

    //   } else {
    //     normalized = standardNormalization(selections);
    //   }

    //   // Update market bets
    //   market.bets = market.bets.map(b => {
    //     const name = b.line ? `${b.betName} ${b.line}` : b.betName;
    //     const norm = normalized.find(n => n.name === name);
    //     return {
    //       ...b,
    //       bestOddsDecimal: norm ? norm.fairOdds : b.bestOddsDecimal
    //     };
    //   });
    // });
    console.log("New Markets: ", cloned)

    return cloned;
  }
  

  // function to normalize clean sheet
  function cleanSheetNormalization(allSelections){
    const cleanSheet = allSelections.filter(
      s => s.marketTypeName.toLowerCase() === "clean sheet"
    );

    // Group by team name (without " - No")
    const grouped = {};

    for (const sel of cleanSheet) {
      const baseName = sel.name.replace(" - No", "").trim();
      if (!grouped[baseName]) grouped[baseName] = {};
      if (sel.name.toLowerCase().includes("no"))
        grouped[baseName].no = sel;
      else
        grouped[baseName].yes = sel;
    }

    const normalized = [];

    for (const [team, pair] of Object.entries(grouped)) {
      const yes = pair.yes;
      const no = pair.no;
      if (!yes || !no) continue; // skip incomplete pairs

      // implied probabilities
      const pYes = 1 / yes.odds;
      const pNo = 1 / no.odds;
      const total = pYes + pNo;

      // normalize so they sum to 1
      const fairYes = 1 / (pYes / total);
      const fairNo = 1 / (pNo / total);

      normalized.push({
        ...yes,
        fairOdds: parseFloat(fairYes.toFixed(3))
      });
      normalized.push({
        ...no,
        fairOdds: parseFloat(fairNo.toFixed(3))
      });
    }

    return normalized;
  }

  // function to normalize to win to nil 
  function toWinToNilNormalization(allSelections){
    const winToNil = allSelections.filter(
      s => s.marketTypeName.toLowerCase() === "to win to nil"
    );
    const winMarket = allSelections.filter(
      s => s.marketTypeName.toLowerCase() === "win market"
    );
    const cleanSheet = allSelections.filter(
      s =>
        s.marketTypeName.toLowerCase() === "clean sheet" &&
        !s.name.toLowerCase().includes("no")
    );

    const normalized = [];

    for (const sel of winToNil) {
      const teamName = sel.name;

      const win = winMarket.find(
        w => w.name.toLowerCase() === teamName.toLowerCase()
      );
      const sheet = cleanSheet.find(
        c => c.name.toLowerCase() === teamName.toLowerCase()
      );

      if (!win || !sheet) continue;

      // Multiply the fair odds
      const fairOdds = parseFloat((win.fairOdds * sheet.fairOdds).toFixed(3));

      normalized.push({
        ...sel,
        fairOdds
      });
    }

    return normalized;
  }

  // function to normalize to win from behind
  function toWinFromBehindNormalization(allSelections){
    // Extract the relevant markets
    const toWinFromBehind = allSelections.filter(
      s => s.marketTypeName.toLowerCase() === "to win from behind"
    );
    const winMarket = allSelections.filter(
      s => s.marketTypeName.toLowerCase() === "win market"
    );
    const teamToScoreFirst = allSelections.filter(
      s => s.marketTypeName.toLowerCase() === "team to score first"
    );
    // console.log(toWinFromBehind, winMarket, teamToScoreFirst)

    if (!toWinFromBehind.length || !winMarket.length || !teamToScoreFirst.length) {
      console.warn("Missing required markets.");
      return allSelections;
    }

    // Helper to find the opponent's name
    const getOpponentName = (teamName) => {
      const others = winMarket.map(w => w.name).filter(n => n !== teamName && n.toLowerCase() !== "draw");
      return others.length ? others[0] : null;
    };


    const normalized = toWinFromBehind.map(sel => {
      const teamName = sel.name;
      const opponentName = getOpponentName(teamName);
      // console.log(opponentName)
      if (!opponentName) return sel;

      const win = winMarket.find(w => w.name.toLowerCase() === teamName.toLowerCase() );
      const first = teamToScoreFirst.find(t => t.name.toLowerCase()  === opponentName.toLowerCase() );
      // console.log(win, first)
      if (!win || !first) return sel;

      // Formula: fairOdds = opponent (to score first) × team (to win market)
      const fairOdds = first.fairOdds * win.fairOdds;
      // console.log(fairOdds)
      return { ...sel, fairOdds: parseFloat(fairOdds.toFixed(3)) };
    });
    // console.log(normalized)

    return normalized;

  }

  // function to normalize to win both halves
  function toWinBothHalvesNormalizaion(allSelections) {
    // Extract relevant markets
    const toWinBothHalves = allSelections.filter(
      s => s.marketTypeName.toLowerCase() === "to win both halves"
    );
    const halfTime = allSelections.filter(
      s => s.marketTypeName.toLowerCase() === "half time"
    );
    const secondHalf = allSelections.filter(
      s => s.marketTypeName.toLowerCase() === "second half result"
    );

    if (toWinBothHalves.length === 0 || halfTime.length === 0 || secondHalf.length === 0) {
      console.warn("Missing required markets.");
      return allSelections;
    }

    const normalizeTeam = (teamName) => {
      const ht = halfTime.find(t => t.name === teamName);
      const sh = secondHalf.find(t => t.name === teamName);
      if (!ht || !sh) return null;

      // Formula: fairOdds = (Half Time fairOdds) × (Second Half fairOdds)
      const fairOdds = ht.fairOdds * sh.fairOdds;
      return { name: teamName, fairOdds: parseFloat(fairOdds.toFixed(3)) };
    };

    // Compute for all teams listed under “To Win Both Halves”
    const normalized = toWinBothHalves.map(sel => {
      const norm = normalizeTeam(sel.name);
      return norm ? { ...sel, fairOdds: norm.fairOdds } : sel;
    });

    return normalized;
  }

  // function to normalise to win either half
  function toWinEitherHalfNormalizaion(allSelections){
    // Extract relevant markets
    const toWinEitherHalf = allSelections.filter(
      s => s.marketTypeName.toLowerCase() === "to win either half"
    );
    const halfTime = allSelections.filter(
      s => s.marketTypeName.toLowerCase() === "half time"
    );
    const secondHalf = allSelections.filter(
      s => s.marketTypeName.toLowerCase() === "second half result"
    );

    if (toWinEitherHalf.length === 0 || halfTime.length === 0 || secondHalf.length === 0) {
      console.warn("Missing required markets.");
      return allSelections;
    }

    const normalizeTeam = (teamName) => {
      const ht = halfTime.find(t => t.name === teamName);
      const sh = secondHalf.find(t => t.name === teamName);
      if (!ht || !sh) return null;

      // Convert fair odds → probability
      const pHT = 1 / ht.fairOdds;
      const pSH = 1 / sh.fairOdds;

      // Formula: 1 - ((1 - pHT) * (1 - pSH))
      const combinedProb = 1 - ((1 - pHT) * (1 - pSH));

      // Back to fair odds
      const fairOdds = 1 / combinedProb;
      return { name: teamName, fairOdds: parseFloat(fairOdds.toFixed(3)) };
    };

    // Compute for both teams
    const teams = toWinEitherHalf.map(t => normalizeTeam(t.name)).filter(Boolean);
    // console.log(teams)

    // Merge back into results
    const normalized = toWinEitherHalf.map(sel => {
      const norm = teams.find(t => t.name === sel.name);
      return norm ? { ...sel, fairOdds: norm.fairOdds } : sel;
    });

    return normalized;
  }

  // Function to normalise To Score In Both Halves
  function bothHalvesNormalizaion(allSelections){
    // extract relevant markets
    const teams = allSelections.filter(
      s => s.marketTypeName.toLowerCase() === "to score in both halves"
    );

    const bttsBothHalves = allSelections.find(
      s => s.marketTypeName.toLowerCase() === "both teams to score in both halves" && s.name.toLowerCase() === "yes"
    );

    if (!bttsBothHalves || teams.length !== 2) {
      console.warn("Missing data or invalid market format");
      return allSelections;
    }

    const targetYesOdds = bttsBothHalves.fairOdds;
    const teamA = teams[0];
    const teamB = teams[1];


    // now find scaling factor so their product matches target
    const currentProduct = teamA.odds * teamB.odds;
    const scale = Math.pow(targetYesOdds / currentProduct, 1 / 2); // sqrt to evenly scale both

    const fairA = teamA.odds * scale;
    const fairB = teamB.odds * scale;

    const normalized = [
      { ...teamA, fairOdds: parseFloat(fairA.toFixed(3)) },
      { ...teamB, fairOdds: parseFloat(fairB.toFixed(3)) }
    ];

    return normalized;
  }

  // Over Under Pair and Match Result Normalisation Function
  function normalizeOverUnderMix(allSelections) {
    // Group by team/draw and line (e.g. "Union Berlin", 4.5)
    const grouped = {};

    for (const sel of allSelections) {
      // Example: "Union Berlin/Under 4.5"
      const [teamPart, ouPart, line] = sel.name.split(/\/| /).filter(Boolean); 
      // Split by "/" and " " to handle both parts cleanly
      // e.g. ["Union", "Berlin", "Under", "4.5"] → teamName = "Union Berlin", side = "Under", line = "4.5"

      // reconstruct team name and extract side/line properly
      const nameParts = sel.name.split("/");
      const teamName = nameParts[0]; // e.g. "Union Berlin"
      const ouParts = nameParts[1].trim().split(" "); // e.g. ["Under", "4.5"]
      const side = ouParts[0].toLowerCase(); // "under" or "over"
      const lineValue = ouParts[1]; // "4.5"

      if (!teamName || !side || !lineValue) continue;

      const key = `${teamName.trim()}_${lineValue}`;
      if (!grouped[key]) grouped[key] = {};
      grouped[key][side] = sel;
    }

    const normalized = [];

    for (const [key, pair] of Object.entries(grouped)) {
      const over = pair.over;
      const under = pair.under;
      if (!over || !under) continue; // skip unpaired (shouldn't happen ideally)

      // implied probabilities
      const pOver = 1 / over.odds;
      const pUnder = 1 / under.odds;
      const total = pOver + pUnder;

      // normalize
      const fairOver = 1 / (pOver / total);
      const fairUnder = 1 / (pUnder / total);

      normalized.push({
        ...over,
        fairOdds: parseFloat(fairOver.toFixed(3)),
      });
      normalized.push({
        ...under,
        fairOdds: parseFloat(fairUnder.toFixed(3)),
      });
    }

    return normalized;
  }

  // Over Under Pair Normalisation Function
  function normalizeOverUnder(allSelections) {
    // filter only over/under markets (in case there are others)
    const overUnder = allSelections
    // .filter(
    //   s => s.marketTypeName.toLowerCase() === "total goals over/under"
    // );

    // group by line number (e.g. "1.5", "2.5", etc)
    const grouped = {};

    for (const sel of overUnder) {
      const [side, line] = sel.name.split(" ");
      if (!line) continue; // skip invalid names
      if (!grouped[line]) grouped[line] = {};
      grouped[line][side.toLowerCase()] = sel;
    }

    const normalized = [];

    for (const [line, pair] of Object.entries(grouped)) {
      const over = pair.over;
      const under = pair.under;
      if (!over || !under) continue; // skip unpaired lines

      // implied probabilities
      const pOver = 1 / over.odds;
      const pUnder = 1 / under.odds;
      const total = pOver + pUnder;

      // normalize
      const fairOver = 1 / (pOver / total);
      const fairUnder = 1 / (pUnder / total);

      normalized.push({
        ...over,
        fairOdds: parseFloat(fairOver.toFixed(3)),
      });
      normalized.push({
        ...under,
        fairOdds: parseFloat(fairUnder.toFixed(3)),
      });
    }

    return normalized;

  }



  // Penalty Normalisation function
  function penaltyNormalization(allSelections) {
    // console.log("penalty normalisation")
    // Clone to avoid side effects
    const cloned = JSON.parse(JSON.stringify(allSelections));

    // Extract the key odds
    const yesMarket = cloned.find(m => m.marketTypeName.toLowerCase() === 'penalty in match' && m.name.toLowerCase() === 'yes');
    if (!yesMarket) return cloned; // if not found, nothing to do
    // console.log(yesMarket)
    const yesProb = 1 / yesMarket.fairOdds;
    // console.log("yesProb", yesProb)
    // Group penalty odds by team
    const toScore = cloned.filter(m => m.marketTypeName.toLowerCase() === 'to score a penalty');
    const toMiss = cloned.filter(m => m.marketTypeName.toLowerCase() === 'to miss a penalty');
    // console.log("toScore", toScore)
    // console.log("toMiss", toMiss)
    // Combine both sets by team name
    const teams = [...new Set([...toScore.map(m => m.name), ...toMiss.map(m => m.name)])];
    // console.log(teams)
    // Get current total probability across all teams
    let totalProb = 0;
    const teamData = teams.map(team => {
      const score = toScore.find(m => m.name === team);
      const miss = toMiss.find(m => m.name === team);

      const scoreProb = score ? 1 / score.odds : 0;
      const missProb = miss ? 1 / miss.odds : 0;
      const teamProb = scoreProb + missProb;
      totalProb += teamProb;

      return { team, score, miss, teamProb };
    });
    // console.log(teamData)

    // Scale factor so totalProb matches yesProb
    const scale = yesProb / totalProb;

    // Apply scaling to adjust fair odds
    teamData.forEach(({ score, miss }) => {
      if (score) score.fairOdds = (1 / ((1 / score.odds) * scale)).toFixed(2);
      if (miss) miss.fairOdds = (1 / ((1 / miss.odds) * scale)).toFixed(2);
    });

    return cloned.map(sel => {
      const updated = teamData.find(t => t.score?.name === sel.name || t.miss?.name === sel.name);
      if (!updated) return sel;
      if (updated.score && sel.marketTypeName.toLowerCase() === 'to score a penalty')
        return { ...sel, fairOdds: updated.score.fairOdds };
      if (updated.miss && sel.marketTypeName.toLowerCase() === 'to miss a penalty')
        return { ...sel, fairOdds: updated.miss.fairOdds };
      return sel;
    });
  }

  // Standard Normalisation function
  function standardNormalization(selections) {
    console.log("standard")
    const implied = selections.map(s => ({ ...s, prob: 1 / s.odds }));
    const sumProb = implied.reduce((a, b) => a + b.prob, 0);
    return implied.map(s => ({
      odds: s.odds,
      name: s.name,
      fairOdds: +(1 / (s.prob / sumProb)).toFixed(2)
    }));
  }
  // First/Last Goalscorer Normalisation function  
  function goalscorerNormalization(players, gamma = 0.1) {
    // console.log("fsg/lsg")
    const noGoal = players.find(p => p.name.toLowerCase() === "no goalscorer");
    const qNG = noGoal ? 1 / noGoal.odds : 0;
    const targetMass = 1 - qNG;

    let valid = players.filter(
      p => p.name.toLowerCase() !== "no goalscorer" && p.odds !== 1.01
    ).map(p => ({ ...p, q: 1 / p.odds }));

    valid.sort((a, b) => b.q - a.q);

    const qMax = Math.max(...valid.map(p => p.q));
    valid = valid.map(p => ({ ...p, w: Math.pow(p.q / qMax, gamma) }));

    const sumWQ = valid.reduce((sum, p) => sum + p.w * p.q, 0);
    const C = targetMass / sumWQ;

    return valid.map(p => {
      const fairProb = C * p.w * p.q;
      return {
        name: p.name,
        fairOdds: +((1 / fairProb) / players.length * 20).toFixed(2)
      };
    });
  }

  // Anytime Goalscorer Normalization
  function anytimeGoalscorerNormalization(players, topN = 20) {
    // console.log("anytime")
    let implied = players.map(p => ({ ...p, prob: 1 / p.odds }));
    implied = implied.slice(0, topN);
    const sumProb = implied.reduce((a, b) => a + b.prob, 0);

    return implied.map(p => ({
      name: p.name,
      fairOdds: +(1 / (p.prob / sumProb)).toFixed(2)
    }));
  }
  function normalizeDoubleChance(selections) {
    // console.log("double")
    // Convert odds → implied probability
    const implied = selections.map(s => ({
      ...s,
      prob: 1 / s.odds
    }));

    // Sum of implied probabilities
    const sumProb = implied.reduce((a, b) => a + b.prob, 0);

    // Scale so they add up to 2 (200%)
    return implied.map(s => ({
      name: s.name,
      fairOdds: +(1 / (s.prob / sumProb * 2)).toFixed(2)
    }));
  }
  function simplifyData(data) {
    const allowedKeys = [
      "bets",
      "betTypeId",
      "eventId",
      "eventName",
      "marketId",
      "marketName",
      "marketTypeName",
      "subeventEndTime",
      "subeventName",
      "subeventStartTime",
      "subeventId"
    ];

    const timestamp = Date.now(); // current timestamp in ms

    return data.map(item => {
      const filtered = {};

      for (const key of allowedKeys) {
        if (item[key] !== undefined) {
          filtered[key] = item[key];
        }
      }

      filtered.timestamp = timestamp;
      return filtered;
    });
  }

  
  const [lockedMarkets, setLockedMarkets] = useState({});

  const oddschecker = async (marketID, marketName, match) => {
    if (lockedMarkets[marketID]) return;
    // console.log(marketName)
    // console.log(match)
    // console.log(marketID)
    const now = Date.now();

    setLockedMarkets(prev => ({ ...prev, [marketID]: true }));
    

    let searchMarketID = marketID
    if (marketName.toLowerCase() === "to score a penalty" || 
        marketName.toLowerCase() === "to miss a penalty"){
      searchMarketID = match.marketIDs.filter((market) => market.market.toLowerCase() === "to score a penalty" ||
      market.market.toLowerCase() === "to miss a penalty" || market.market.toLowerCase() === "penalty in match").map((market) => market.marketId).join(",")
      // console.log(searchMarketID)
    } else if (marketName.toLowerCase() === "to score in both halves") {
      searchMarketID = match.marketIDs.filter((market) => market.market.toLowerCase() === "to score in both halves" ||
      market.market.toLowerCase() === "both teams to score in both halves").map((market) => market.marketId).join(",")
      // console.log(searchMarketID)
    } else if (marketName.toLowerCase() === "to win either half" ) {
      searchMarketID = match.marketIDs.filter((market) => market.market.toLowerCase() === "to win either half" || market.market.toLowerCase() === "half time" || market.market.toLowerCase() === "second half result" ).map((market) => market.marketId).join(",")
      // console.log(searchMarketID)
    } else if (marketName.toLowerCase() === "to win both halves") {
      searchMarketID = match.marketIDs.filter((market) => market.market.toLowerCase() === "half time" || market.market.toLowerCase() === "second half result" || market.market.toLowerCase() === "to win both halves" ).map((market) => market.marketId).join(",")
      console.log(searchMarketID)
    } else if (marketName.toLowerCase() === "to win from behind") {
      searchMarketID = match.marketIDs.filter((market) => market.market.toLowerCase() === "to win from behind" || market.market.toLowerCase() === "team to score first" || market.market.toLowerCase() === "win market" ).map((market) => market.marketId).join(",")
      // console.log(searchMarketID)
    } else if (marketName.toLowerCase() === "to win to nil") {
      searchMarketID = match.marketIDs.filter((market) => market.market.toLowerCase() === "to win to nil" || market.market.toLowerCase() === "clean sheet" || market.market.toLowerCase() === "win market" ).map((market) => market.marketId).join(",")
      // console.log(searchMarketID)
    } 
    

    setLoadingMatch((prev) => ({ ...prev, [marketID]: true }));

    const marketIndex = markets.findIndex(
      (marketToLoad) => marketToLoad.marketId === marketID
    );
    if (marketIndex === -1) {
      console.log("new market opened")
      setLoadedMatches((prevLoadedMatch) => [...prevLoadedMatch,marketID]);
      // console.log(marketID)
      fetch("https://www.oddschecker.com/api/markets/v2/all-odds?market-ids=" + searchMarketID + "&repub=OC")
      .then((response) => response.json())
      .then((data) => {
        data = simplifyData(data)
        console.log("oddschecker data: ", data)
        
        // data.push({
        //   "marketId": 123,
        //   "marketName": "Union Berlin v Borussia Mgladbach#Penalty In Match",
        //   "subeventId": 100675466,
        //   "subeventName": "Union Berlin v Borussia Mgladbach",
        //   "subeventType": "MATCH",
        //   "subeventStartTime": "2025-10-17T18:30:00Z",
        //   "subeventEndTime": "2025-10-17T21:30:00Z",
        //   "eventId": 9941,
        //   "eventName": "German Bundesliga Matches",
        //   "categoryId": 27,
        //   "categoryName": "European Football",
        //   "betTypeId": 2589,
        //   "marketTypeName": "Penalty In Match",
        //   "marketGroup": "Stats Betting",
        //   "priority": 21,
        //   "bets": [
        //     {
        //       "marketId": 3577872887,
        //       "betId": 27158526382,
        //       "betName": "Yes",
        //       "bestOddsDecimal": 3
        //     }
        //   ]
        // })

        

        if (data.length === 0){
          setFetchError(true)
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
        } else if (marketName.toLowerCase() === "to score a penalty" || 
        marketName.toLowerCase() === "to miss a penalty" && data.length !== 3){
          setFetchError(true)
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

        } else {
          let flag = true;

          for (let i = 0; i < data.length; i++){
            if (data[i].marketTypeName.toLowerCase() === "penalty in match") {
              if (data[i].bets.length !== 2){
                setFetchError(true)
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
                flag = false
                // console.log(flag)
                // console.log(removeMarketById(filteredGroupedMatches, data[i].marketId))
                // setFilteredGroupedMatches(removeMarketById(filteredGroupedMatches, data[i].marketId))
                break
              }
            }
          }

          if (flag) {
            // Normalisation 
            const normalizedData = normalizeData(data,marketName);
            console.log("normalized data: ", normalizedData);
            setMarkets((prevMarkets) => [...prevMarkets, ...normalizedData]);
            setPendingOpen(marketID)
          } 
          



          
          // setOpen((prevState) => ({
          //   ...prevState,
          //   [marketID]: !prevState[marketID],
          // }));
            
          
        }
        
        
        
      })
      .catch((error) => {
        setFetchError(true)
        console.error("Error fetching odds:", error);
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
        
    } else if(marketIndex !== -1 && now - markets[marketIndex].timestamp > 10 * 60 * 1000) {
      console.log("new update for oddschecker data")
      setLoadedMatches((prevLoadedMatch) => [...prevLoadedMatch,marketID]);
      // console.log(marketID)
      fetch("https://www.oddschecker.com/api/markets/v2/all-odds?market-ids=" + searchMarketID + "&repub=OC")
      .then((response) => response.json())
      .then((data) => {
        data = simplifyData(data)
        console.log("oddschecker data: ",data)
        
        // data.push({
        //   "marketId": 3577872887,
        //   "marketName": "Union Berlin v Borussia Mgladbach#Penalty In Match",
        //   "subeventId": 100675466,
        //   "subeventName": "Union Berlin v Borussia Mgladbach",
        //   "subeventType": "MATCH",
        //   "subeventStartTime": "2025-10-17T18:30:00Z",
        //   "subeventEndTime": "2025-10-17T21:30:00Z",
        //   "eventId": 9941,
        //   "eventName": "German Bundesliga Matches",
        //   "categoryId": 27,
        //   "categoryName": "European Football",
        //   "betTypeId": 2589,
        //   "marketTypeName": "Penalty In Match",
        //   "marketGroup": "Stats Betting",
        //   "priority": 21,
        //   "bets": [
        //     {
        //       "marketId": 3577872887,
        //       "betId": 27158526382,
        //       "betName": "Yes",
        //       "bestOddsDecimal": 3
        //     },
        //     {
        //       "marketId": 3577872887,
        //       "betId": 27158526381,
        //       "betName": "No",
        //       "bestOddsDecimal": 2
        //     }
        //   ]
        // })


        if (data.length === 0){
          setFetchError(true)
        } else {
          // Normalisation 
          const normalizedData = normalizeData(data,marketName);
          console.log("normalized data: ", normalizedData);


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
          updateMarkets(normalizedData);
          // setOpen((prevState) => ({
          //   ...prevState,
          //   [marketID]: !prevState[marketID],
          // }));
          setPendingOpen(marketID)  
          
        }
        
        
        
      })
      .catch((error) => {
        setFetchError(true)
        console.error("Error fetching odds:", error);
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
      console.log("not updated")
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
    setTimeout(() => {
      setLockedMarkets(prev => ({ ...prev, [marketID]: false }));
    }, 400);
    
  }
  useEffect(() => {
    if (!pendingOpen) return;
    console.log("markets:", markets)
    console.log("filtered grouped matches: ", filteredGroupedMatches)
    setOpen((prev) => {
      const newState = {};
      Object.keys(prev).forEach((key) => {
        newState[key] = false;
      });
      newState[pendingOpen] = true;
      return newState;
    });
    
    setTimeout(() => {
      const container = document.querySelector(".match-list");
      const element = document.getElementById(`collapse-${pendingOpen}`);

      if (container && element) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;

        const elementTop = element.offsetTop;
        const elementBottom = elementTop + element.clientHeight;

        const isVisible =
          elementTop >= containerTop + 100 && elementBottom <= containerBottom + 100;

        if (!isVisible) {
          container.scrollTo({
            top: elementTop - container.offsetTop - 100,
            behavior: "smooth",
          });
        }
      }
      setPendingOpen(null); // reset
      setLoadingMatch((prev) => ({ ...prev, [pendingOpen]: false }));
    }, 300); // keep a short delay for DOM to paint
  }, [markets]); // run when markets change


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
            <div
              className={`alert ${
                notif[0]?.split('$')[3] === "danger" || alertText.includes("Error:")
                  ? "alert-danger"
                  : "alert-success"
              } fade show ${animationClass}`}
              role="alert"
              dangerouslySetInnerHTML={{ __html: alertText }}
            ></div>
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
                                      onClick={() => {oddschecker(market.marketId, market.market, match);}}
                                      aria-controls={`collapse-${market.marketId}`}
                                      aria-expanded={open[market.marketId] || false}
                                      className='drop d-flex justify-content-between align-items-center'
                                      disabled={lockedMarkets[market.marketId] === true}
                                    >
                                      <div>{market.market}</div>
                                      <div>
                                        {loadingMatch[market.marketId] ? (
                                          <Spinner animation="border" size="sm" />
                                          ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
                                            <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                                          </svg>
                                        )}
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
                                                m.subeventName.toLowerCase() === match.fixture.toLowerCase() &&
                                                m.marketTypeName.toLowerCase() === market.market.toLowerCase()
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
                                                          ? Number(bets.bestOddsDecimal)
                                                          : Number(bets.bestOddsDecimal).toFixed(2)}
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
                                                          ? Number(bets.bestOddsDecimal)
                                                          : Number(bets.bestOddsDecimal).toFixed(2)}
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
                                  onClick={() => oddschecker(market.marketId, market.market, match)}
                                  aria-controls={`collapse-${market.marketId}`}
                                  aria-expanded={open[market.marketId] || false}
                                  className='drop d-flex justify-content-between align-items-center'
                                >
                                  <div>{market.market}</div>
                                  <div>
                                    {loadingMatch[market.marketId] ? (
                                      <Spinner animation="border" size="sm" />
                                      ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                                      </svg>
                                    )}
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
                                        m.subeventName.toLowerCase() === match.fixture.toLowerCase() &&
                                        m.marketTypeName.toLowerCase() === market.market.toLowerCase()
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
                                                <div className='betsOdds'>{Number.isInteger(bets.bestOddsDecimal) ? bets.bestOddsDecimal : Number(bets.bestOddsDecimal).toFixed(2) }</div>
                                              </div>
                                            )
                                          : (
                                              <div className={`d-flex justify-content-between align-items-center flex-fill marketBetContent ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === `${bets.betName}-${bets.line}` && odd.selectedMarket === market.marketTypeName) ? 'marketClicked' : 'market'}`}
                                              onClick={() => handleOddsClick(match.id, `${bets.betName}-${bets.line}`, bets.bestOddsDecimal, market.marketTypeName, match)}>
                                                <div className='betsName'>{bets.betName.replace('/', ' / ')} {bets.line}</div>
                                                <div className='betsOdds'>{Number.isInteger(bets.bestOddsDecimal) ? bets.bestOddsDecimal : Number(bets.bestOddsDecimal).toFixed(2) }</div>
                                              </div>
                                            )
                                        }
                                      </div>
                                      )
                                    )))}
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
