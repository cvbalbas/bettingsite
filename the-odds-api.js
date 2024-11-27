const axios = require('axios')

//list of api keys. just used loads of free keys rather than paying for 1 key with loads of requests allowed. 
const api_key = ["b72f612edbaec634c55af7922d3f38c2", 
    "8733a0ea62a239ffde07a0ad45eb885c",
    "a34ede8d61f72e8cb3bb2bf1d1dd6779", 
    "c1ce269b587cbf3e6d5d6487e64729a7", 
    "788cc81d664fddc06f2a90bb76517123",
    "5e27ed59b6b0b1f81dee292843d34657", 
    "5ae671c4f125dc8ae9a152139845f68b",
    "8c7daffc4058ac4b601a6f3b0f8ddcbe",
    "433b11521588cf21dcc54b54c26fd045",
    "f7b4beaadfd846e1c2ff5e45147f7c80",
    "86b00eaa006a2efb25a75b7f90ac6a07",
    "8738c006b6dbdaca8478d9b3590cbae5",
    "a53cdb061ece524018fd09d07fa667a5",
    "8d1c124e1c583433c282cc1b4004b28d",
    "b422a2565719546e4176db9b86954da7",
    "2828192c6e1e36616421bcdf2cf2392e",
    "d29712fe4adfaadededb0d6e1596c937",
    "59e0be87631ccf8fffb06d3d0eafaba2",
    "773869ee1d1dd0b0e727155b619a572c",
    "bd9a87bde59a4477c69ae5764bc1ed29",
    "1ac175ac923bcd221580dce7850365ec",
    "36b3166c52c24b1af9f540d402e586ad",
    "cb89e6b21cb688877855a0c138bcb06e",
    "9c3ccf5a23c0c53045b508194c03df68",
    "1df8ab1afd97906effdf24ceecad06d2",
    "26cc45d40d5554d979fa35356b1202ef",
    "2b884f382d7cc8e854d147d4e762252b",
    "e2f42af8608348e7b179c89ea1adfbf8"]

axios.get('https://api.the-odds-api.com/v3/odds', {
    params: {
        api_key: api_key[Math.floor(Math.random()*api_key.length)],
        sport: "soccer_epl",
        region: 'uk', // uk | us | eu | au
        mkt: 'h2h' // h2h | spreads | totals
    }
}).then(response => {
    matches = response.data.data
    //print the odds for each game
    console.log(matches)
    for (var i=0; i<matches.length; i++){
        // if (matches[i]["commence_time"] - new Date().getTime()/1000 <660){continue} //only care about matches which are more than 11 mins away from being played to stop people betting after the games have started

        //every match has around 20 different bookmakers, so we narrow down the one with the best odds and only print that one
        lowestIndex = 0; lowestTotal = 200 //win draw loss should add up to 100% odds chance but all bookies have a margin. we are trying to get the one with the lowest margin
        for (var j=0; j<matches[i]["sites"].length; j++){
            total = Math.round(1/response.data.data[i]["sites"][j]["odds"]["h2h"][0]*10000)/100 + Math.round(1/response.data.data[i]["sites"][j]["odds"]["h2h"][1]*10000)/100 + Math.round(1/response.data.data[i]["sites"][j]["odds"]["h2h"][2]*10000)/100
            if (total < lowestTotal){lowestTotal = total;lowestIndex = j}
        }
        // console.log()
        // console.log(JSON.stringify(matches[i]))
        // let date = new Date(matches[i]["commence_time"]*1000);

        // Print the date in a readable format
        // console.log(date.toLocaleString());
        // console.log(matches[i]["home_team"])//print the home team
        var awayTeam = matches[i]["teams"].filter(team => team !== matches[i]["home_team"])
        //matches[i]["teams"].pop(matches[i]["home_team"]) //get rid of the home team in list of teams
        // console.log(awayTeam[0]) //print the other team (the away team)
        // console.log(matches[i]["sites"][lowestIndex]["odds"]["h2h"]) //print the odds

    console.log('Remaining requests',response.headers['x-requests-remaining'])
    console.log('Used requests',response.headers['x-requests-used'])
    }
})

// fetch('https://www.oddschecker.com/api/events/sports/soccer')
//   .then(response => response.text()) // Use .text() to see the raw response
//   .then(data => {
//     console.log('Raw response:', data); // Check if it's HTML
//     try {
//       const jsonData = JSON.parse(data); // Try parsing if it's JSON
//       console.log('Parsed JSON:', jsonData);
//     } catch (e) {
//       console.error('Error parsing JSON:', e);
//     }
//   })
//   .catch(error => console.error('Error fetching events:', error));
