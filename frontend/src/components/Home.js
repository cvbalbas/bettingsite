import React, { useEffect, useState } from 'react';


import { Button, Collapse } from 'react-bootstrap';
// import { getAuth, onAuthStateChanged } from 'firebase/auth';  // Make sure to import Firebase auth
import Spinner from 'react-bootstrap/Spinner';
import ToggleSwitch from "./ToggleSwitch";
import PremiumModal from './PremiumModal';


function App({user, setUser, walletBalance, setWalletBalance, isPremium, setIsPremium, selectedOdds, setSelectedOdds, betsOpen, setBetsOpen, betAmounts, setBetAmounts, estimatedPayouts, setEstimatedPayouts, handleClearAllBets}) {
  const [matches, setMatches] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [marketIDs, setMarketIDs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedMatches, setLoadedMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [open, setOpen] = useState({}); // Object to track the open state of each div
  const [openMarkets, setOpenMarkets] = useState({}); // Object to track the open state of each div
  const [loadingMatch, setLoadingMatch] = useState({})
  const [searchMarket, setSearchMarket] = useState({});
  const [showAll, setShowAll] = useState({});
  const [notif, setNotif] = useState([])
  const [showAlert, setShowAlert] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [animationClass, setAnimationClass] = useState('');
  const [premiumModal, setPremiumModal] = useState(false)

  useEffect(() => {
    if (notif.length > 0) {
      // Set the alert text and trigger fade-in animation
      setAlertText(`${notif[0]?.split('$')[0]} - ${notif[0]?.split('$')[1]} - ${notif[0]?.split('$')[2]}`);
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
    

  }, [isPremium, user])
  useEffect(() => {
    const fetchOdds = async () => {
      try {
        const response = await fetch('/api/odds'); // Proxy will send this to backend
        const data = await response.json();

        setMatches(data.data); // Assuming data is in data.data
        console.log(data.data)
        
        
      } catch (error) {
        // console.error('Error fetching odds:', error);
        
      }
    };

    const fetchMarkets = async () => {
      try {
        const response = await fetch('/api/markets'); 
        const data = await response.json();
        data.forEach((market) => {
          market.time = formatDate(market.time) + " at " + formatTime(market.time)
        })
        setMarketIDs(data); 
        // console.log(data)
        
      } catch (error) {
        console.error('Error fetching markets:', error);
      }
    }

    // Fetch odds, markets, and balance when the component mounts
    fetchOdds();
    fetchMarkets();
    setLoading(false)

    // Refresh the odds every 10 minutes
    // const intervalId = setInterval(fetchOdds, 600000); // 600,000ms = 10 minutes

    // // Cleanup interval on unmount
    // return () => clearInterval(intervalId);

    // const auth = getAuth(); // Initialize the Firebase auth
    // const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    //   if (currentUser) {
    //     setUser(currentUser); // Set the logged-in user
    //     // console.log(currentUser)
        
    //   } else {
    //     setUser(null); // Clear user state if logged out
    //   }
    //   setLoading(false)
    // });
    
    // // Cleanup the listener on component unmount
    // return () => unsubscribe();

    
  }, []);

  //function to toggle Collapsible market divs
  const toggleCollapse = (id) => {
    setOpen((prevState) => ({
      ...prevState,
      [id]: !prevState[id], // Toggle open/close for the specific div
    }));
  };
  // Generate image path based on team name
  const getImagePath = (teamName) => {
    const formattedName = teamName.replace(/ /g, '_'); // Convert to lowercase and replace spaces
    return `/images/${formattedName}.png`; // Construct the image path
  };

  // Utility function to format date from commence_time
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000); // Convert from seconds to milliseconds
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',    // Day without leading zero (e.g., 19)
      month: 'long',     // Full month name (e.g., October)
      year: 'numeric'    // Full year (e.g., 2024)
    });
  };

// Utility function to format time from commence_time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000); // Convert from seconds to milliseconds
    return date.toLocaleTimeString('en-GB', {
      hour: 'numeric',   // Hour
      minute: 'numeric', // Minute
      hour12: false      // Use 24-hour time format
    });
  };

  const groupMatchesByDate = (matches) => {
    const groupedMatches = {};

    //-----Testing------
    groupedMatches["25 October 2024"] = []
    // console.log(JSON.stringify(markets))
    const marketIDsForMatch = markets.filter((market) => market.fixture === "brighton-v-wolverhampton").map((market) => market.marketId)

    groupedMatches["25 October 2024"].push({
      fixture: "Brighton v Wolverhampton",
      id: 65478,
      homeTeam: "Brighton and Hove Albion",
      awayTeam: "Wolverhampton Wanderers",
      time: "13:00",
      date: "25 October 2024",
      homeOdds: 1.52, // Replace with your odds logic
      drawOdds: 6.40,
      awayOdds: 5.10,
      marketIDs: marketIDsForMatch
    })
    
    const marketIDsForMatch2 = markets.filter((market) => market.fixture === "leicester-v-nottingham-forest").map((market) => market.marketId)
    groupedMatches["25 October 2024"].push({
      fixture: "Leicester v Nottingham Forest",
      id: 12345,
      homeTeam: "Leicester City",
      awayTeam: "Nottingham Forest",
      time: "18:00",
      date: "25 October 2024",
      homeOdds: 1.52, // Replace with your odds logic
      drawOdds: 6.40,
      awayOdds: 5.10,
      marketIDs: marketIDsForMatch2
    })
    //-----End Testing------

    // console.log(marketIDsForMatch)
    matches.forEach(match => {
      // console.log(match.teams)
      const matchDate = formatDate(match.commence_time); // Get readable date
      if (!groupedMatches[matchDate]) {
        groupedMatches[matchDate] = []; // Create new array if it doesn't exist
      }
      //every match has around 20 different bookmakers, so we narrow down the one with the best odds and only print that one
      let total = 0;
      let lowestIndex = 0; 
      let lowestTotal = 200 //win draw loss should add up to 100% odds chance but all bookies have a margin. we are trying to get the one with the lowest margin
      for (let j = 0; j < match["sites"].length; j++) {
        // console.log(`Site index: ${j}`);
        
        // Check if 'h2h' odds exist and contain all three elements (for win, draw, loss)
        if (match["sites"][j]["odds"]["h2h"] && match["sites"][j]["odds"]["h2h"].length === 3) {
            total = Math.round(1 / match["sites"][j]["odds"]["h2h"][0] * 10000) / 100 +
                    Math.round(1 / match["sites"][j]["odds"]["h2h"][1] * 10000) / 100 +
                    Math.round(1 / match["sites"][j]["odds"]["h2h"][2] * 10000) / 100;
    
            // Check if the current total has the lowest margin
            if (total < lowestTotal) {
                lowestTotal = total;
                lowestIndex = j;
            }
        } else {
            // console.log(`Skipping site ${j} due to missing or incomplete h2h odds`);
            continue;
        }
    }

      let fixture = ""
      switch(match.home_team){
        case "Tottenham Hotspur":
          fixture += "tottenham"
          break;
        case "West Ham United":
          fixture += "west-ham"
          break
        case "Fulham":
          fixture += "fulham"
          break
        case "Aston Villa":
          fixture += "aston-villa"
          break
        case "Manchester United":
          fixture += "man-utd"
          break
        case "Brentford":
          fixture += "brentford"
          break
        case "Newcastle United":
          fixture += "newcastle"
          break
        case "Brighton and Hove Albion":
          fixture += "brighton"
          break
        case "Ipswich Town":
          fixture += "ipswich"
          break
        case "Everton":
          fixture += "everton"
          break
        case "Southampton":
          fixture += "southampton"
          break
        case "Leicester City":
          fixture += "leicester"
          break
        case "Bournemouth":
          fixture += "bournemouth"
          break
        case "Arsenal":
          fixture += "arsenal"
          break
        case "Wolverhampton Wanderers":
          fixture += "wolverhampton"
          break
        case "Manchester City":
          fixture += "man-city"
          break
        case "Liverpool":
          fixture += "liverpool"
          break
        case "Chelsea":
          fixture += "chelsea"
          break
        case "Nottingham Forest":
          fixture += "nottingham-forest"
          break
        case "Crystal Palace":
          fixture += "crystal-palace"
          break
        default:
          break
      }
      fixture += "-v-"
      switch(match.teams.filter(team => team !== match.home_team)[0]){
        case "Tottenham Hotspur":
          fixture += "tottenham"
          break;
        case "West Ham United":
          fixture += "west-ham"
          break
        case "Fulham":
          fixture += "fulham"
          break
        case "Aston Villa":
          fixture += "aston-villa"
          break
        case "Manchester United":
          fixture += "man-utd"
          break
        case "Brentford":
          fixture += "brentford"
          break
        case "Newcastle United":
          fixture += "newcastle"
          break
        case "Brighton and Hove Albion":
          fixture += "brighton"
          break
        case "Ipswich Town":
          fixture += "ipswich"
          break
        case "Everton":
          fixture += "everton"
          break
        case "Southampton":
          fixture += "southampton"
          break
        case "Leicester City":
          fixture += "leicester"
          break
        case "Bournemouth":
          fixture += "bournemouth"
          break
        case "Arsenal":
          fixture += "arsenal"
          break
        case "Wolverhampton Wanderers":
          fixture += "wolverhampton"
          break
        case "Manchester City":
          fixture += "man-city"
          break
        case "Liverpool":
          fixture += "liverpool"
          break
        case "Chelsea":
          fixture += "chelsea"
          break
        case "Nottingham Forest":
          fixture += "nottingham-forest"
          break
        case "Crystal Palace":
          fixture += "crystal-palace"
          break
        default:
          break
      }
      // console.log(fixture)

      const marketIDsForMatch = marketIDs.filter((market) => market.fixture === fixture).map((market) => market.marketId)
      // console.log(marketIDsForMatch)

      let subeventName = fixture
      .split('-') // Split by '-'
      .map((team) => team.charAt(0).toUpperCase() + team.slice(1)) // Capitalize each team
      .join(' ')
      .replace(' V ', ' v ')
      // console.log(subeventName)
      
      // Push an object with home team, away team, and formatted time
      groupedMatches[matchDate].push({
        fixture: subeventName,
        id: match.id,
        homeTeam: match.home_team,
        awayTeam: match.teams.filter(team => team !== match.home_team)[0],
        time: formatTime(match.commence_time),
        date: formatDate(match.commence_time),
        homeOdds: match.sites[lowestIndex].odds.h2h[0].toFixed(2), // Replace with your odds logic
        drawOdds: match.sites[lowestIndex].odds.h2h[1].toFixed(2),
        awayOdds: match.sites[lowestIndex].odds.h2h[2].toFixed(2),
        marketIDs: marketIDsForMatch 
      });
    });

    return groupedMatches;
  };

  

  // Get matches grouped by date
  const groupedMatches = groupMatchesByDate(matches);
  
  // console.log(JSON.stringify(groupedMatches))
  // Filter function to match the home or away team name with the search term
  const filteredGroupedMatches = Object.keys(groupedMatches).reduce((acc, date) => {
    const filteredMatches = groupedMatches[date].filter((match) =>
      match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Only include the date group if there are matches after filtering
    if (filteredMatches.length > 0) {
      acc[date] = filteredMatches;
    }
    
    return acc;
  }, {});
  


  // Function to handle clicking on the odds
  const handleOddsClick = (matchId, type, odds, market, match) => {
    //Open sidebar
    if(selectedOdds.length === 0) {
      setBetsOpen(true);
    } 
    if (!user) {
      setBetsOpen(true);
    }
    // Create an object with the match info and the type of odds (home, draw, away)
    const selectedMatchInfo = {
      ...match,
      selectedMarket: market,
      selectedType: type, // Add the betName
      selectedOdds: odds, // Store the actual selected odds value
    };  
  // Check if the match with this id and type is already in selectedOdds
    const matchIndex = selectedOdds.findIndex(
      (odd) => odd.id === matchId && odd.selectedMarket === market && odd.selectedType === type
    );

    if (matchIndex === -1) {
      // If the match is not in selectedOdds, add it
      setSelectedOdds((prevSelectedOdds) => [...prevSelectedOdds, selectedMatchInfo]);
      setNotif(() => [match.fixture + '$' + market + '$' +  type])

    } else {
      // If the match is already in selectedOdds, remove it (unselect)
      setSelectedOdds((prevSelectedOdds) =>
        prevSelectedOdds.filter((_, i) => i !== matchIndex)
      );
    }
    console.log(notif)
  };

  

  const handleGetMarkets = async (match) => {
    setLoadingMatch((prev) => ({ ...prev, [match.id]: true }));

    const matchIndex = loadedMatches.findIndex(
      (matchToLoad) => matchToLoad === match.id
    );

    if (matchIndex === -1) {
      // If the match is not in loadedMatches, add it
      setLoadedMatches((prevLoadedMatches) => [match.id]);
      if (markets.some((market) => market.subeventName === match.fixture)){
        setOpenMarkets((prevState) => ({
          ...prevState,
          [match.id]: !prevState[match.id], // Toggle open/close for the match div
        }));
        setLoadingMatch((prev) => ({ ...prev, [match.id]: false }));

      } else {
        // console.log(loadedMatches)
        // console.log(match.marketIDs.join(','))
        fetch(`https://www.oddschecker.com/api/markets/v2/all-odds?market-ids=${match.marketIDs.join(',')}&repub=OC`)
        .then(response => response.json())
        .then(data => {
          // console.log(data);
          // setMarkets(data)
          setMarkets((prevMarkets) => [...prevMarkets, ...data]);
          // console.log(markets)
          setOpenMarkets((prevState) => ({
            ...prevState,
            [match.id]: !prevState[match.id], // Toggle open/close for the match div
          }));
          setLoadingMatch((prev) => ({ ...prev, [match.id]: false }));

          // Process and display odds as needed
          // You can now display or use the odds in your UI
        })
        .catch(error => console.error(`Error fetching odds for market`));

        //----- Testing ----
        const fetchjson = async () => {
          try {
            const response = await fetch('/api/savedmarkets'); 
            const data = await response.json();
            console.log(data)
            setMarkets(data)
            setOpenMarkets((prevState) => ({
              ...prevState,
              [match.id]: !prevState[match.id], // Toggle open/close for the match div
            }));
          } catch (error) {
            console.error('Error fetching markets:', error);
          }
        }
        fetchjson()
        setLoadingMatch((prev) => ({ ...prev, [match.id]: false }));
        //----- End Testing ----
      }   
    } else {
      // If the match is already in prevLoadedMatches, remove it (unselect)
      setLoadedMatches((prevLoadedMatches) =>
        prevLoadedMatches.filter((id) => id !== match.id)
      );
      setOpenMarkets((prevState) => ({
        ...prevState,
        [match.id]: !prevState[match.id], // Toggle open/close for the match div
      }));
      setLoadingMatch((prev) => ({ ...prev, [match.id]: false }));
    }  
  }
  // const handleClearAllBets = () => {
  //   setSelectedOdds([]); // Clear all selected bets
  //   setBetAmounts({});   // Reset all bet amounts
  //   setEstimatedPayouts({}); // Reset all estimated payouts
  // };
  let [percentOdds, setPercentOdds] = useState(false);

  const onPercentOddsChange = (checked) => {
    // setPercentOdds(checked);
    if(isPremium.isPremium) {
      setPercentOdds(checked);
      localStorage.setItem('togglePercent', checked);
    } else {
      const hasTrialExpired = new Date(isPremium.trialExpiresAt) < new Date();
      console.log(isPremium.trialExpiresAt)
      if(isPremium.isPremiumTrial){
        if(hasTrialExpired) {
          console.log("Trial has expired. Would you like to Subscribe?")
          openPremiumModal()
        } else {
          setPercentOdds(checked);
          localStorage.setItem('togglePercent', checked);
        }
      } else {
        openPremiumModal()
      }
    }
  };

  useEffect(() => {
    console.log(percentOdds)
  }, [percentOdds])



  const openPremiumModal = () => setPremiumModal(true);
  const closePremiumModal = () => setPremiumModal(false);


  return (
    // <div>
    //   <LoginModal showModal={loginModalOpen} closeModal={closeLoginModal} user = {user} setUser = {setUser} setSignupModalOpen={setSignupModalOpen} />
    //   <SignupModal showModal={signupModalOpen} closeModal={closeSignupModal} user = {user} setUser = {setUser} setLoginModalOpen={setLoginModalOpen} setDisclaimerOpen = {setDisclaimerOpen} />
    //   <Disclaimer showModal={disclaimerOpen} closeModal={closeDisclaimerModal} user = {user} setUser = {setUser}/>


    // <div className="App d-flex">
    //   <div className={`m-auto ${betsOpen ? 'home':'homesmall'}`}>
    //   <NavBar className={`m-auto ${betsOpen ? 'navbar':'navbarsmall'}`} openLoginModal = {openLoginModal} openSignupModal = {openSignupModal} user = {user} setUser = {setUser} selectedOdds={selectedOdds} setBetsOpen={setBetsOpen} betsOpen={betsOpen} handleClearAllBets={handleClearAllBets} walletBalance={walletBalance} />
      <div>
        <PremiumModal showModal={premiumModal} closeModal={closePremiumModal} user = {user} isPremium={isPremium} setIsPremium={setIsPremium} />
      <div className='col-lg-10 col-sm-12 m-auto'>
        <div className='alertsBox'>
          {showAlert && (
            <div className={`alert alert-success fade show ${animationClass}`} role="alert">
              <strong>Successfully added bet! </strong> <br />
              {alertText}
            </div>
          )}
        </div>

        <div className='text-start text-white mt-4 mb-3 d-flex justify-content-between align-items-center'>
          <div className='col-12'><h1>Premier League Matches</h1></div>
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
              {!loading ? (<>
            {Object.keys(filteredGroupedMatches).map((date) => (
            <div key={date} className="date-group">
              <div className='text-uppercase text-lightgrey col-12 bg-lightgreen text-start date matchMargin py-2'>
                {date}
              </div> {/* Display the date as a heading */}
              {filteredGroupedMatches[date].map((match, index) => (
                <div key={match.id} className="match">
                  <div className='matchMargin text-start'>
                    <div className='text-lightgrey py-2 font-12 d-flex justify-content-between align-items-center'>
                      <div>{match.time}</div>
                      <div>1 x 2</div>
                    </div> {/* Display the time */}
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
                      {/* Display all Markets */}
                      {/* {loadedMatches.includes(match.id) && ( */}
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
                          {markets
                          .filter(
                            (market) =>
                              market.subeventName === match.fixture &&
                              market.marketTypeName.toLowerCase().includes(searchMarket?.[match.id]?.toLowerCase() || '')
                          )
                          .sort((a, b) => a.marketTypeName.localeCompare(b.marketTypeName))
                          .slice(0, searchMarket?.[match.id] ? markets.length : 5)
                          .map((market) => (
                            <div key={`${market.marketId}`}>
                              <Button 
                                onClick={() => toggleCollapse(market.marketId)}
                                aria-controls={`collapse-${market.marketId}`}
                                aria-expanded={open[market.marketId] || false}
                                className='drop d-flex justify-content-between align-items-center'
                              >
                                <div>{market.marketTypeName}</div>
                                <div>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                                  </svg>
                                </div>
                              </Button>
                              <Collapse in={open[market.marketId]}>
                              <div>
                                <div id={`collapse-${market.marketId}`}  className="py-2 px-2 mx-0 mb-2 row collapseContent">
                                  {market.bets
                                  .sort((a, b) => b.bestOddsDecimal - a.bestOddsDecimal)
                                  .map((bets) => (
                                    bets.bestOddsDecimal !== undefined && (
                                      <div key={`${market.marketId}-${bets.betName}-${bets.line}`} className="col-12 col-md-6 col-lg-4 col-xl-3 d-flex marketBets mouse-pointer" >
                                      {bets.line === undefined 
                                        ? (
                                            <div className={`d-flex justify-content-between align-items-center flex-fill marketBetContent ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === bets.betName && odd.selectedMarket === market.marketTypeName) ? 'marketClicked' : 'market'}`}
                                              onClick={() => handleOddsClick(match.id, bets.betName, bets.bestOddsDecimal, market.marketTypeName, match)}>
                                              <div className='betsName'>{bets.betName.replace('/', ' / ')}</div>
                                              <div className='betsOdds'>                            
                                                {percentOdds ?  `${((1 / bets.bestOddsDecimal) * 100).toFixed(2)}%` : Number.isInteger(bets.bestOddsDecimal) ? bets.bestOddsDecimal : bets.bestOddsDecimal.toFixed(2) }                          
                                              </div>
                                            </div>
                                          )
                                        : (
                                            <div className={`d-flex justify-content-between align-items-center flex-fill marketBetContent ${selectedOdds.some(odd => odd.id === match.id && odd.selectedType === `${bets.betName}-${bets.line}` && odd.selectedMarket === market.marketTypeName) ? 'marketClicked' : 'market'}`}
                                            onClick={() => handleOddsClick(match.id, `${bets.betName}-${bets.line}`, bets.bestOddsDecimal, market.marketTypeName, match)}>
                                              <div className='betsName'>{bets.betName.replace('/', ' / ')} {bets.line}</div>
                                              <div className='betsOdds'>                            
                                                {percentOdds ?  `${((1 / bets.bestOddsDecimal) * 100).toFixed(2)}%` : Number.isInteger(bets.bestOddsDecimal) ? bets.bestOddsDecimal : bets.bestOddsDecimal.toFixed(2) }                          
                                              </div>
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
                        <Collapse in={openMarkets[match.id] !== undefined && showAll[match.id] && !searchMarket[match.id] ? openMarkets[match.id] : false} className='mt-0'>
                        <div>
                        <div id={`collapse-${match.id}`} className="mt-0 mb-5">
                          {markets
                          .filter(
                            (market) =>
                              market.subeventName === match.fixture &&
                              market.marketTypeName.toLowerCase().includes(searchMarket?.[match.id]?.toLowerCase() || '')
                          )
                          .sort((a, b) => a.marketTypeName.localeCompare(b.marketTypeName))
                          .slice(5)
                          .map((market) => (
                            <div key={`${market.marketId}`}>
                              <Button 
                                onClick={() => toggleCollapse(market.marketId)}
                                aria-controls={`collapse-${market.marketId}`}
                                aria-expanded={open[market.marketId] || false}
                                className='drop d-flex justify-content-between align-items-center'
                              >
                                <div>{market.marketTypeName}</div>
                                <div>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                                  </svg>
                                </div>
                              </Button>
                              <Collapse in={open[market.marketId]}>
                              <div>
                                <div id={`collapse-${market.marketId}`}  className="py-2 px-2 mx-0 mb-2 row collapseContent">
                                  {market.bets
                                  .sort((a, b) => a.betName.localeCompare(b.betName))
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
                        {/* )}  */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
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
