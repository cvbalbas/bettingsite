const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

// Fetch odds route
app.get('/api/odds', async (req, res) => {
  const apiKeys = process.env.ODDS_API_KEYS.split(',');
  const randomApiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
  try {
    const response = await axios.get('https://api.the-odds-api.com/v3/odds', {
      params: {
        api_key: randomApiKey,
        sport: 'soccer_epl',
        region: 'uk',
        mkt: 'h2h'
      }
    });
    res.json(response.data);
    // console.log(response.data)


    
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

var mysql = require("mysql2");

var con = mysql.createConnection({
  // connectionLimit: 100,
  // host: process.env.HOST,
  // port: 3306,
  // user: process.env.USER,
  // password: process.env.PASSWORD,
  // database: process.env.DATABASE,
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "bets",
});

con.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database!");
});

app.get('/api/markets', async (req, res) => {
  var sql = "SELECT * FROM odds";
  con.query(sql, function (err, result) { 
      if (err) throw err;
      // console.log(result);
      res.json(result);
  });
});

// Helper function to handle queries with async/await
function executeQuery(query, values) {
  return new Promise((resolve, reject) => {
    con.query(query, values, (error, results) => {
      if (error) {
        console.log(error)
        return reject(error);
      }
      resolve(results);
    });
  });
}

app.post('/api/save-odds', async (req, res) => {
  const { selectedOdds, betAmounts, user } = req.body;

  try {
    // Start a transaction
    await executeQuery('START TRANSACTION');

    const userUID = user.uid;
    // console.log(user.uid)

    // Fetch the user's current wallet balance
    const userResults = await executeQuery('SELECT uid, wallet_balance FROM betsusers WHERE uid = ?', [userUID]);
    if (userResults.length === 0) {
      return res.status(400).json({ error: 'User UID does not exist' });
    }

    const sqlInsertBet = `INSERT INTO bets_list (
        uid, bet_amount, potential_payout, event_id, fixture, match_date,
        bet_market, bet_type, bet_odds, status, placed_at, settled_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL)`;

    const sqlInsertTransaction = `INSERT INTO bets_wallet_transactions (
        uid, bet_id, transaction_type, amount, transaction_date
      ) VALUES (?, ?, 'bet', ?, NOW())`;

    const sqlUpdateWallet = `UPDATE betsusers SET wallet_balance = wallet_balance - ? WHERE uid = ?`;

    // Loop over selectedOdds to process each bet, transaction, and wallet update sequentially
    for (const bet of selectedOdds) {
      const betKey = `${bet.id}$${bet.selectedMarket}$${bet.selectedType}`;
      const betAmount = betAmounts[betKey];

      if (betAmount !== undefined) {
        // Prepare values for the bet insertion
        const valuesBet = [
          user.uid,
          betAmount,
          betAmount * bet.selectedOdds,
          bet.id,
          bet.fixture,
          `${bet.date} ${bet.time}`,
          bet.selectedMarket,
          bet.selectedType,
          bet.selectedOdds,
          'pending'
        ];

        // Insert the bet into the bets list and retrieve the inserted bet's ID
        const betResult = await executeQuery(sqlInsertBet, valuesBet);
        const betId = betResult.insertId;

        // Insert the transaction record for this bet
        const valuesTransaction = [
          user.uid,
          betId,
          betAmount,
        ];
        await executeQuery(sqlInsertTransaction, valuesTransaction);

        // Update the wallet balance by subtracting the bet amount
        await executeQuery(sqlUpdateWallet, [betAmount, user.uid]);
      }
    }
    const wallet_balance = await executeQuery('SELECT wallet_balance FROM betsusers WHERE uid = ?', [user.uid]);
    
    // Commit the transaction if all operations succeed
    await executeQuery('COMMIT');
    res.status(200).json({ message: 'Saved odds and transactions, wallet balance retrieved', results: wallet_balance });


  } catch (error) {
    // Roll back the transaction if any operation fails
    await executeQuery('ROLLBACK');
    res.status(500).json({ error: 'Error saving odds, transactions, or updating wallet balance', details: error.message });
  }
});

app.post('/api/user-info', async (req, res) => {

  const { currentUser } = req.body;
  // console.log(currentUser)

  try {
    // Start a transaction
    await executeQuery('START TRANSACTION');

    const userResults = await executeQuery('SELECT * FROM betsusers WHERE uid = ?', [currentUser.uid]);
    
    // Commit the transaction if all operations succeed
    await executeQuery('COMMIT');
    res.status(200).json({ message: 'wallet balance retrieved', results: userResults });

  } catch (error) {
    // Roll back the transaction if any operation fails
    await executeQuery('ROLLBACK');
    res.status(500).json({ error: 'Error retrieving wallet balance', details: error.message });
  }
});

app.post('/api/save-user', async (req, res) => {
  const { currentUser } = req.body;
  // console.log(currentUser)

  try {
    // Start a transaction
    await executeQuery('START TRANSACTION');

    const sqlInsertUser = `INSERT INTO betsusers 
    (uid, email, wallet_balance, created_at) 
    VALUES (?, ?, ?, NOW())`;
    const valuesUser = [
      currentUser.uid,
      currentUser.email,
      100
    ]
    await executeQuery(sqlInsertUser, valuesUser);

    // Commit the transaction if all operations succeed
    await executeQuery('COMMIT');
    res.status(200).json({ message: 'added user successfully' });

  } catch (error) {
    // Roll back the transaction if any operation fails
    await executeQuery('ROLLBACK');
    res.status(500).json({ error: 'Error adding user', details: error.message });
  }
});

app.get('/api/savedmarkets', async (req, res) => {
  const filePath = path.join(__dirname, 'ipswichcrystal-leicesterwestam.json');

  // Read the JSON file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the JSON file:', err);
      return res.status(500).json({ message: 'Failed to load data' });
    }
    // console.log(JSON.parse(data))
    // Parse and send the JSON data
    res.json(JSON.parse(data));
  });
});

app.get('/api/savedmatches', async (req, res) => {
  const filePath = path.join(__dirname, 'the-odds-api.json');

  // Read the JSON file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the JSON file:', err);
      return res.status(500).json({ message: 'Failed to load data' });
    }
    // console.log(JSON.parse(data))
    // Parse and send the JSON data
    res.json(JSON.parse(data));
  });
});


app.post('/api/transactions', async(req, res) => {

  const { user } = req.body;
  // console.log(req.body)

  try {
    // Start a transaction
    await executeQuery('START TRANSACTION');

    const userResults = await executeQuery(`
       SELECT 
        bwt.*, 
        bl.fixture, 
        bl.bet_market, 
        bl.bet_type, 
        bl.bet_odds,
        bl.status
      FROM bets_wallet_transactions AS bwt
      LEFT JOIN bets_list AS bl 
        ON bwt.bet_id = bl.bet_id 
      WHERE bwt.uid = ? 
      ORDER BY bwt.transaction_id DESC 
      LIMIT 20
  `, [user.uid]);
      // console.log(userResults)
    // Commit the transaction if all operations succeed
    await executeQuery('COMMIT');
    res.status(200).json({ message: 'wallet balance retrieved', results: userResults });

  } catch (error) {
    // Roll back the transaction if any operation fails
    await executeQuery('ROLLBACK');
    res.status(500).json({ error: 'Error retrieving wallet balance', details: error.message });
  }
});

app.post('/api/bets-history', async(req, res) => {

  const { user } = req.body;
  // console.log(req.body)

  try {
    // Start a transaction
    await executeQuery('START TRANSACTION');

    const userResults = await executeQuery(`
      SELECT 
          bl.*, 
          bwt.transaction_id, 
          bwt.transaction_type, 
          bwt.amount
      FROM bets_list AS bl
      LEFT JOIN bets_wallet_transactions AS bwt
        ON bl.bet_id = bwt.bet_id
        AND (
          (bl.status = 'pending' AND bwt.transaction_type = 'bet') OR
          (bl.status IN ('won', 'lost') AND bwt.transaction_type IN ('win', 'loss'))
        )
      WHERE bl.uid = ?
      GROUP BY bl.bet_id
      ORDER BY bwt.transaction_id DESC
      LIMIT 20;
  `, [user.uid]);
  console.log(userResults)

    // Commit the transaction if all operations succeed
    await executeQuery('COMMIT');
    res.status(200).json({ message: 'wallet balance retrieved', results: userResults });

  } catch (error) {
    // Roll back the transaction if any operation fails
    await executeQuery('ROLLBACK');
    res.status(500).json({ error: 'Error retrieving wallet balance', details: error.message });
  }
});

app.post('/api/upgradePremiumTrial', async (req, res) => {
  const currentUser = req.body.currentUser;
  const expiresAt = req.body.expiresAt;
  // console.log(currentUser)

  try {
    // Start a transaction
    await executeQuery('START TRANSACTION');

    const query = `
      UPDATE betsusers
      SET isPremiumTrial = TRUE, trialExpiresAt = ?
      WHERE uid = ?;
    `;
    const values = [
      expiresAt, 
      currentUser.uid
    ]
    await executeQuery(query, values);

    // Commit the transaction if all operations succeed
    await executeQuery('COMMIT');
    res.status(200).json({ message: 'upgraded successfully' });

  } catch (error) {
    // Roll back the transaction if any operation fails
    await executeQuery('ROLLBACK');
    res.status(500).json({ error: 'Error upgrading user', details: error.message });
  }
});

app.post('/api/upgradePremium', async (req, res) => {
  const currentUser = req.body.currentUser;
  // console.log(currentUser)

  try {
    // Start a transaction
    await executeQuery('START TRANSACTION');

    const query = `
      UPDATE betsusers
      SET isPremium = TRUE
      WHERE uid = ?;
    `;
    const values = [
      currentUser.uid
    ]
    await executeQuery(query, values);

    // Commit the transaction if all operations succeed
    await executeQuery('COMMIT');
    res.status(200).json({ message: 'upgraded successfully' });

  } catch (error) {
    // Roll back the transaction if any operation fails
    await executeQuery('ROLLBACK');
    res.status(500).json({ error: 'Error upgrading user', details: error.message });
  }
});

// This is your test secret API key.
const stripe = require('stripe')('sk_test_51QLxcmGU6rDR9xUo8WuFxecAkNgeUhHeJ1Hk4LGKTVFoyNA9dNvPPuCoAvAcxvPlKgullcLxHHQgkcqpnwkNtpiq00l05tzzm8');

const YOUR_DOMAIN = 'http://localhost:3000'; // Update to your frontend domain

app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: 'price_1QLxndGU6rDR9xUo0bZSdLyv',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/account?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/account?cancelled=true`,
      metadata: {
        purchaseType: 'premium',
      },
    });
    res.json({ url: session.url }); // Return the session URL
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(4242, () => console.log('Running on port 4242'));

app.post('/api/verify-payment', async (req, res) => {
  const { sessionId, uid } = req.body; // Include `uid` from the client-side request

  try {
    // Retrieve session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log(session.payment_status)

    if (session.payment_status === 'paid') {
      const purchaseType = session.metadata.purchaseType;
      console.log(purchaseType)
      if (purchaseType === 'premium') {
        // Update the `isPremium` column in the `betsusers` table
        con.query(
          'SELECT isPremium FROM betsusers WHERE uid = ?', [uid],
          (err, results) => {
            if (err) {
              console.error('Failed to get user info.', err);
              return res.status(500).json({ isValid: false, message: 'Failed to activate premium.' });
            }
            console.log(results)
            if(results[0].isPremium==1){
              console.error('Session already processed');
              return res.json({ isValid: false, message: 'Session already processed' });
            }
            con.query(
              'UPDATE betsusers SET isPremium = ? WHERE uid = ?',
              [true, uid],
              (err, results) => {
                if (err) {
                  console.error('Failed to activate premium.', err);
                  return res.status(500).json({ isValid: false, message: 'Failed to activate premium.' });
                }
                console.log(results)
                console.log('Premium activated successfully!', uid);
                con.query(
                  'UPDATE betsusers SET wallet_balance = wallet_balance + ? WHERE uid = ?',
                  [500, uid],
                  (updateErr) => {
                    if (updateErr) {
                      console.error('Error updating coins:', updateErr);
                      return res.status(500).json({ isValid: false, message: 'Database error' });
                    }
      
                    // Record the session_id to prevent duplicate processing
                    con.query(
                      'INSERT INTO bets_wallet_transactions (uid, bet_id, transaction_type, amount, transaction_date, session_id) VALUES (?, ?, ?, ?, NOW(), ?)',
                      [uid, null, 'deposit', 500, sessionId],
                      (insertErr) => {
                        if (insertErr) {
                          console.error('Error recording transaction:', insertErr);
                          return res.status(500).json({ isValid: false, message: 'Database error' });
                        }
                        console.log('Coins added successfully')
                        res.json({ isValid: true, message: 'Changed to Premium and Coins added successfully' , premiumChange: 'true', coinsAdded:'500'});
                      }
                    );
                  }
                );
              }
            );
          }
        )
        
      }
      else if (purchaseType === 'coins') {
        const coinsQuantity = parseInt(session.metadata.coinsQuantity, 10);
          // Check if the session_id has already been processed
        con.query(
          'SELECT * FROM bets_wallet_transactions WHERE session_id = ?',
          [sessionId],
          (err, results) => {
            if (err) {
              console.error('Error checking session_id:', err);
              return res.status(500).json({ isValid: false, message: 'Database error' });
            }
            console.log(results)
            if (results.length > 0) {
              // Session already processed
              console.error('Session already processed');
              return res.json({ isValid: false, message: 'Session already processed' });
            }
  
            // Session not processed, proceed to update coins and record transaction
            con.query(
              'UPDATE betsusers SET wallet_balance = wallet_balance + ? WHERE uid = ?',
              [coinsQuantity*1000, uid],
              (updateErr) => {
                if (updateErr) {
                  console.error('Error updating coins:', updateErr);
                  return res.status(500).json({ isValid: false, message: 'Database error' });
                }
  
                // Record the session_id to prevent duplicate processing
                con.query(
                  'INSERT INTO bets_wallet_transactions (uid, bet_id, transaction_type, amount, transaction_date, session_id) VALUES (?, ?, ?, ?, NOW(), ?)',
                  [uid, null, 'deposit', coinsQuantity*1000, sessionId],
                  (insertErr) => {
                    if (insertErr) {
                      console.error('Error recording transaction:', insertErr);
                      return res.status(500).json({ isValid: false, message: 'Database error' });
                    }
                    console.log('Coins added successfully')
                    res.json({ isValid: true, message: 'oins added successfully' , premiumChange: 'true', coinsAdded: coinsQuantity*1000});
                  }
                );
              }
            );
          }
        );
      }
    }  
    else {
      // Payment is invalid
      res.json({ isValid: false, message: 'Payment not completed or invalid' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ isValid: false, message: 'Internal server error' });
  }
});


app.post('/create-checkout-session-coins', async (req, res) => {
  const { quantity } = req.body; // Get quantity from frontend
  console.log(quantity)
  if (!quantity || quantity <= 0) {
    return res.status(400).send({ error: 'Invalid quantity' });
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: 'price_1QR3nxGU6rDR9xUo9J58Qodl',
        quantity: quantity, // Use dynamic quantity
      },
    ],
    mode: 'payment',
    success_url: `${YOUR_DOMAIN}/account?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${YOUR_DOMAIN}/account?canceled=true`,
    metadata: {
      purchaseType: 'coins', // or 'premium'
      coinsQuantity: quantity.toString(), // For coin purchases
    },
  });

  res.json({ url: session.url });
});


app.post('/api/save-data', async (req, res) => {
  const groupedMatches = req.body;

  try {
      // Start a transaction
      await executeQuery('START TRANSACTION');

      for (const [date, matches] of Object.entries(groupedMatches)) {
          for (const match of matches) {
              const { id, fixture, homeTeam, awayTeam, time, homeOdds, drawOdds, awayOdds, marketIDs } = match;

              // Check if the match already exists
              const checkMatchQuery = `SELECT COUNT(*) AS count FROM matches WHERE id = ?`;
              const matchExists = await executeQuery(checkMatchQuery, [id]);

              if (matchExists[0].count > 0) {
                // console.log(`Match with id ${id} already exists. Skipping insertion.`);
                
                continue;
              }

              // Insert match into the `matches` table
              const matchQuery = `
                  INSERT INTO matches (id, fixture, home_team, away_team, date, time, home_odds, draw_odds, away_odds)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
              const date2 = new Date(date);
              const sqlDate = date2.toISOString().split('T')[0];
              const matchValues = [id, fixture, homeTeam, awayTeam, sqlDate, time, homeOdds, drawOdds, awayOdds];
              await executeQuery(matchQuery, matchValues);

              console.log(`Inserted match with id ${id}`);

              
          }
      }

      // Commit the transaction if all operations succeed
      await executeQuery('COMMIT');
      res.status(200).json({ message: 'Matches and markets saved successfully' });

  } catch (error) {
      // Roll back the transaction if any operation fails
      await executeQuery('ROLLBACK');
      console.error('Error saving groupedMatches:', error);
      res.status(500).json({ error: 'Error saving matches and markets', details: error.message });
  }
});

app.post('/api/save-markets', async (req, res) => {
  const filePath = path.join(__dirname, 'ipswichcrystal-leicesterwestam.json');

  // Read the JSON file
  fs.readFile(filePath, 'utf8', async (err, data) => {
    if (err) {
      console.error('Error reading the JSON file:', err);
      return res.status(500).json({ message: 'Failed to load data' });
    }
    // console.log(JSON.parse(data))
    // Parse and send the JSON data
    const markets = JSON.parse(data);
    try {
      // Start a transaction
      await executeQuery('START TRANSACTION');
  
      for (const market of markets) {
        const { marketId, marketName, subeventName, subeventStartTime, bets } = market;
  
        for (const bet of bets) {
          const { betName, line, bestOddsDecimal } = bet;
  
          // Check if a bet with the same marketId and betName already exists
          const checkQuery = `
            SELECT COUNT(*) AS count
            FROM markets
            WHERE marketId = ? AND betName = ?
          `;
          const checkResult = await executeQuery(checkQuery, [marketId,  line ? `${betName} ${line}` : betName]);
  
          if (checkResult[0].count === 0) {
            // Insert the bet if it doesn't exist
            const insertQuery = `
              INSERT INTO markets (marketId, marketName, subeventName, subeventStartTime, betName, bestOddsDecimal)
              VALUES (?, ?, ?, ?, ?, ?)
            `;
            await executeQuery(insertQuery, [
              marketId,
              marketName,
              subeventName,
              new Date(subeventStartTime),
              line ? `${betName} ${line}` : betName,
              bestOddsDecimal,
            ]);
          }
        }
      }
  
      // Commit the transaction
      await executeQuery('COMMIT');
      res.status(200).json({ message: 'Markets and bets saved successfully' });
  
    } catch (error) {
      // Roll back the transaction if any operation fails
      await executeQuery('ROLLBACK');
      console.error('Error saving markets and bets:', error);
      res.status(500).json({ error: 'Error saving markets and bets', details: error.message });
    }
  });
 
});

// app.get('/api/matches-with-markets', async (req, res) => {
//   try {
//     const query = `
//       SELECT 
//         m.id AS match_id, 
//         m.fixture, 
//         m.date, 
//         m.time, 
//         m.home_team, 
//         m.away_team, 
//         m.home_odds, 
//         m.draw_odds, 
//         m.away_odds, 
//         mk.marketId, 
//         mk.marketName, 
//         mk.subeventName, 
//         mk.subeventStartTime, 
//         mk.betName, 
//         mk.bestOddsDecimal
//       FROM matches AS m
//       LEFT JOIN markets AS mk ON m.fixture = mk.subeventName
//       ORDER BY m.date, m.time, mk.marketName;
//     `;

//     const results = await executeQuery(query);

//     const groupedMatches = results.reduce((acc, row) => {
//       const matchDate = row.date;

//       if (!acc[matchDate]) {
//         acc[matchDate] = [];
//       }

//       const existingMatch = acc[matchDate].find((match) => match.id === row.match_id);

//       if (existingMatch) {
//         // Check if the market already exists
//         let existingMarket = existingMatch.markets.find(
//           (market) => market.marketName === row.marketName
//         );

//         if (existingMarket) {
//           // Add the bet to the existing market
//           existingMarket.bets.push({
//             betName: row.line ? `${row.betName} ${row.line}` : row.betName,
//             bestOddsDecimal: row.bestOddsDecimal,
//           });
//         } else {
//           // Create a new market and add the bet
//           existingMatch.markets.push({
//             marketName: row.marketName,
//             bets: [
//               {
//                 betName: row.line ? `${row.betName} ${row.line}` : row.betName,
//                 bestOddsDecimal: row.bestOddsDecimal,
//               },
//             ],
//           });
//         }
//       } else {
//         // Create a new match with its first market and bet
//         acc[matchDate].push({
//           id: row.match_id,
//           fixture: row.fixture,
//           homeTeam: row.home_team,
//           awayTeam: row.away_team,
//           time: row.time,
//           date: row.date,
//           homeOdds: row.home_odds,
//           drawOdds: row.draw_odds,
//           awayOdds: row.away_odds,
//           markets: row.marketName
//             ? [
//                 {
//                   marketName: row.marketName,
//                   bets: [
//                     {
//                       betName: row.betName,
//                       bestOddsDecimal: row.bestOddsDecimal,
//                     },
//                   ],
//                 },
//               ]
//             : [],
//         });
//       }

//       return acc;
//     }, {});

//     res.status(200).json(groupedMatches);
//   } catch (error) {
//     console.error('Error fetching matches and markets:', error);
//     res.status(500).json({ error: 'Error fetching matches and markets' });
//   }
// });


// app.post('/api/save-winners', async (req, res) => {
//   const { winningBets } = req.body; // Expect an array of winning bet IDs
//   const timestamp = new Date();

//   try {
//     // Start a transaction
//     await executeQuery('START TRANSACTION');

//     // Update the winning bets and mark them as "won"
//     for (const betId of winningBets) {
//       const updateBetQuery = `
//         UPDATE bets_list 
//         SET status = 'won', settled_at = ? 
//         WHERE bet_id = ?;
//       `;
//       await executeQuery(updateBetQuery, [timestamp, betId]);
//     }

//     // Process winnings for users
//     const payoutQuery = `
//       UPDATE bets_wallet_transactions AS bwt
//       JOIN bets_list AS bl ON bwt.bet_id = bl.bet_id
//       SET bwt.transaction_type = 'win', bwt.transaction_date = ?
//       WHERE bl.status = 'won' AND bwt.transaction_type = 'bet' AND bl.bet_id IN (?);
//     `;
//     await executeQuery(payoutQuery, [timestamp, winningBets]);

//     // Commit the transaction
//     await executeQuery('COMMIT');
//     res.status(200).json({ message: 'Winning bets saved successfully' });
//   } catch (error) {
//     // Roll back the transaction if any operation fails
//     await executeQuery('ROLLBACK');
//     console.error('Error saving winners:', error);
//     res.status(500).json({ error: 'Error saving winners', details: error.message });
//   }
// });



app.get('/api/pending-bets', async (req, res) => {
  try {
      const query = `
          SELECT DISTINCT 
              STR_TO_DATE(match_date, '%d %M %Y %H:%i') AS full_date,
              DATE_FORMAT(STR_TO_DATE(match_date, '%d %M %Y %H:%i'), '%d %M %Y') AS match_day,
              DATE_FORMAT(STR_TO_DATE(match_date, '%d %M %Y %H:%i'), '%H:%i') AS match_time,
              fixture, bet_market, bet_type
          FROM bets_list 
          WHERE status = 'pending' 
          ORDER BY match_day, match_time, fixture, bet_market;
      `;

      const pendingBets = await executeQuery(query);
      
      // Group by match_day, then fixture, then bet_market, but include match_time
      const groupedBets = pendingBets.reduce((acc, bet) => {
          if (!acc[bet.match_day]) {
              acc[bet.match_day] = {};
          }
          if (!acc[bet.match_day][bet.fixture]) {
              acc[bet.match_day][bet.fixture] = { time: bet.match_time, markets: {} };
          }
          if (!acc[bet.match_day][bet.fixture].markets[bet.bet_market]) {
              acc[bet.match_day][bet.fixture].markets[bet.bet_market] = [];
          }
          acc[bet.match_day][bet.fixture].markets[bet.bet_market].push(bet.bet_type);
          return acc;
      }, {});

      res.json({ success: true, data: groupedBets });
  } catch (error) {
      console.error("Error fetching pending bets:", error);
      res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/update-bet-results', async (req, res) => {
  const { match_day, time, fixture, bet_market, winningBets } = req.body;

  let match_date = match_day + " " + time;
  // if (match_date[0] === "0") {
  //   match_date = match_date.substring(1);
  // }
  console.log(match_date);
  console.log(fixture)
  console.log(bet_market)
  console.log(winningBets)
  try {
    // Start transaction
    await executeQuery("START TRANSACTION");

    // **If winning bets are selected, mark them as won**
    if (winningBets.length > 0) {
      await executeQuery(
        `UPDATE bets_list 
         SET status = 'won', settled_at = NOW() 
         WHERE match_date = ? 
         AND fixture = ? 
         AND bet_market = ? 
         AND bet_type IN (?)`,
        [match_date, fixture, bet_market, winningBets]
      );

      // **Mark the remaining bets as lost**
      await executeQuery(
        `UPDATE bets_list 
         SET status = 'lost', settled_at = NOW() 
         WHERE match_date = ? 
         AND fixture = ? 
         AND bet_market = ? 
         AND bet_type NOT IN (?)`,
        [match_date, fixture, bet_market, winningBets]
      );

      // **Fetch all winning bets and their users**
      const winningBetsData = await executeQuery(
        `SELECT uid, potential_payout, bet_id
         FROM bets_list 
         WHERE match_date = ? 
         AND fixture = ? 
         AND bet_market = ? 
         AND bet_type IN (?)`,
        [match_date, fixture, bet_market, winningBets]
      );
      // **Insert winnings into bets_wallet_transactions and update wallet_balance**
      for (const bet of winningBetsData) {
        const { uid, potential_payout, bet_id } = bet;

        // **Insert win transaction**
        await executeQuery(
          `INSERT INTO bets_wallet_transactions (uid, bet_id, transaction_type, amount, transaction_date) 
           VALUES (?, ?, 'win', ?, NOW())`,
          [uid, bet_id, potential_payout]
        );

        // **Update user's wallet balance**
        await executeQuery(
          `UPDATE betsusers 
           SET wallet_balance = wallet_balance + ? 
           WHERE uid = ?`,
          [potential_payout, uid]
        );

        await executeQuery(
          `INSERT INTO bets_notifications (uid, message) 
           VALUES (?, ?)`,
          [uid, `You <span class = "result-won">won</span> the bet from <strong> ${fixture} (${bet_market}) </strong>!`]
        );
      }

      // **Fetch all losing bets and their users**
      const losingBetsData = await executeQuery(
        `SELECT uid, bet_id
         FROM bets_list 
         WHERE match_date = ? 
         AND fixture = ? 
         AND bet_market = ? 
         AND bet_type NOT IN (?)`,
        [match_date, fixture, bet_market, winningBets]
      );
      // **Insert losses into bets_wallet_transactions**
      for (const bet of losingBetsData) {
        const { uid, bet_id } = bet;

        // **Insert win transaction**
        await executeQuery(
          `INSERT INTO bets_wallet_transactions (uid, bet_id, transaction_type, amount, transaction_date) 
          VALUES (?, ?, 'loss', 0, NOW())`,
          [uid, bet_id]
        );
        await executeQuery(
          `INSERT INTO bets_notifications (uid, message) 
           VALUES (?, ?)`,
          [uid, `You <span class = "result-lost">lost</span> the bet from <strong> ${fixture} (${bet_market}) </strong>.`]
        );
      }
      
    } else {
      // **If no winning bets, mark all bets as lost**
      await executeQuery(
        `UPDATE bets_list 
         SET status = 'lost', settled_at = NOW() 
         WHERE match_date = ? 
         AND fixture = ? 
         AND bet_market = ?`,
        [match_date, fixture, bet_market]
      );
      const losingBetsData = await executeQuery(
        `SELECT uid, bet_id
         FROM bets_list 
         WHERE match_date = ? 
         AND fixture = ? 
         AND bet_market = ?`,
        [match_date, fixture, bet_market]
      );
      for (const bet of losingBetsData) {
        const { uid, bet_id } = bet;

        // **Insert win transaction**
        await executeQuery(
          `INSERT INTO bets_wallet_transactions (uid, bet_id, transaction_type, amount, transaction_date) 
          VALUES (?, ?, 'loss', 0, NOW())`,
          [uid, bet_id]
        );
        await executeQuery(
          `INSERT INTO bets_notifications (uid, message) 
           VALUES (?, ?)`,
          [uid, `You <span class = "result-lost">lost</span> the bet from <strong> ${fixture} (${bet_market}) </strong>.`]
        );
      }
    }

    // Commit transaction
    await executeQuery("COMMIT");
    res.json({ success: true, message: "Bet results updated successfully!" });
  } catch (error) {
    // Rollback transaction in case of error
    await executeQuery("ROLLBACK");
    console.error("Error updating bet results:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.get('/api/notifications/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const notifications = await executeQuery(
      `SELECT * FROM bets_notifications WHERE uid = ? AND status = 'unread' ORDER BY created_at DESC`,
      [uid]
    );
    res.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});


app.post('/api/mark-notifications-read', async (req, res) => {
  const { uid } = req.body;
  try {
    await executeQuery(
      `UPDATE bets_notifications SET status = 'read' WHERE uid = ?`,
      [uid]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ error: 'Error updating notifications' });
  }
});
