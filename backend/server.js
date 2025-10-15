const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
const bcrypt = require("bcrypt");
const cors = require("cors");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");



app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

var mysql = require("mysql2");

var pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // host: "localhost",
  // port: 3306,
  // user: "root",
  // password: "",
  // database: "bets",
  waitForConnections: true,
  connectionLimit: 20,  // adjust based on expected users
  queueLimit: 0
});


// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(bodyParser.json());

// Middleware to verify Firebase user authentication
const verifyAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Attach user data to request
    next(); // Continue to next middleware or route
  } catch (error) {
    console.error("Firebase Auth Error:", error);
    return res.status(403).json({ error: "Forbidden: Invalid token" });
  }
};

// Helper function to handle queries with async/await
function executeQuery(query, values = []) {
  return new Promise((resolve, reject) => {
    pool.query(query, values, (error, results) => {
      if (error) {
        console.error("MySQL error:", error);
        return reject(error);
      }
      resolve(results);
    });
  });
}

pool.on('error', (err) => {
  console.error('MySQL Pool Error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Reconnecting to MySQL...');
  } else {
    throw err;
  }
});


// Fetch odds route
app.get('/api/odds', async (req, res) => {
  const apiKeys = process.env.ODDS_API_KEYS.split(',');
  const randomApiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
  // Get sport key from query string
  const sportKey = req.query.league || 'soccer_epl'; // default EPL if not provided
  // console.log(sportKey)
  try {
    const response = await axios.get('https://api.the-odds-api.com/v3/odds', {
      params: {
        api_key: randomApiKey,
        sport: sportKey,
        region: 'uk',
        mkt: 'h2h'
      }
    });
    res.json(response.data);
    // console.log(response.data)


    
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
  }
});

app.get('/api/markets', async (req, res) => {
  try {
    const sql = `
      SELECT * 
      FROM odds 
      WHERE LOWER(market) NOT IN ('total goals 3-way', 'handicap - 1st half')
    `;

    const [rows] = await pool.promise().query(sql);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching markets:", err);
    res.status(500).json({ error: "Failed to fetch markets" });
  }
});


app.get("/api/oddschecker", async (req, res) => {
  const marketIds = req.query.marketIds || "";
  const url = `https://www.oddschecker.com/api/markets/v2/all-odds?market-ids=${marketIds}&repub=OC`;
  console.log(url)
  try {
   const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.oddschecker.com/',
        'Origin': 'https://www.oddschecker.com',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const text = await resp.text();
    const ct = resp.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      console.error('Oddschecker returned non-JSON. First 300 chars:\n', text.slice(0,5000));
      throw new Error('Oddschecker returned HTML (likely Cloudflare challenge)');
    }

    const data = JSON.parse(text);
    console.log(data);
  } catch (err) {
    console.error("Error fetching odds:", err);
    res.status(500).json({ error: "Failed to fetch odds" });
  }
});


//Save bets into bets_list and bets_wallet_transactions and update wallet_balance
app.post('/api/save-odds', async (req, res) => {
  const { selectedOdds, betAmounts } = req.body;

  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // Verify Firebase user token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userUID = decodedToken.uid;

    // Get a pooled MySQL connection
    const connection = await pool.promise().getConnection();

    try {
      await connection.beginTransaction();

      // Fetch user wallet
      const [userRows] = await connection.query(
        'SELECT uid, wallet_balance FROM betsusers WHERE uid = ?',
        [userUID]
      );

      if (userRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: "User UID does not exist" });
      }

      const sqlInsertBet = `
        INSERT INTO bets_list (
          uid, bet_amount, potential_payout, event_id, fixture, match_date,
          bet_market, bet_type, bet_odds, status, placed_at, settled_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NULL)
      `;

      const sqlInsertTransaction = `
        INSERT INTO bets_wallet_transactions (
          uid, bet_id, transaction_type, amount, transaction_date
        ) VALUES (?, ?, 'bet', ?, NOW())
      `;

      const sqlUpdateWallet = `
        UPDATE betsusers SET wallet_balance = wallet_balance - ? WHERE uid = ?
      `;

      for (const bet of selectedOdds) {
        const betKey = `${bet.id}$${bet.selectedMarket}$${bet.selectedType}`;
        const betAmount = betAmounts[betKey];

        if (betAmount !== undefined) {
          const potentialPayout = betAmount * bet.selectedOdds;

          // Insert into bets_list
          const [betResult] = await connection.query(sqlInsertBet, [
            userUID,
            betAmount,
            potentialPayout,
            bet.id,
            bet.fixture,
            `${bet.date} ${bet.time}`,
            bet.selectedMarket,
            bet.selectedType,
            bet.selectedOdds,
          ]);

          const betId = betResult.insertId;

          // Insert wallet transaction
          await connection.query(sqlInsertTransaction, [
            userUID,
            betId,
            betAmount,
          ]);

          // Deduct from wallet
          await connection.query(sqlUpdateWallet, [betAmount, userUID]);
        }
      }

      // Get updated wallet balance
      const [walletRows] = await connection.query(
        'SELECT wallet_balance FROM betsusers WHERE uid = ?',
        [userUID]
      );

      await connection.commit();
      res.status(200).json({
        message: "Bets saved successfully",
        wallet_balance: walletRows[0].wallet_balance,
      });
    } catch (error) {
      await connection.rollback();
      console.error("Transaction error:", error);
      res.status(500).json({
        error: "Error saving bets or updating wallet",
        details: error.message,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Auth or DB error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});


//Get current user's wallet_balance, role
app.post('/api/user-info', async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1]; // Extract Bearer token
    if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Fetch user info directly (no need for transaction)
    const userResults = await executeQuery('SELECT * FROM betsusers WHERE uid = ?', [uid]);

    if (userResults.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user info
    res.status(200).json({
      message: 'User info retrieved successfully',
      user: userResults[0]
    });

  } catch (error) {
    console.error("Error in /api/user-info:", error);
    if (error.code === 'auth/argument-error') {
      res.status(401).json({ error: "Invalid or expired token" });
    } else {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  }
});


//Save new User to DB
app.post('/api/save-user', async (req, res) => {
  const { currentUser, phoneNumber } = req.body;

  if (!currentUser?.uid || !currentUser?.email || !phoneNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPhone = await bcrypt.hash(phoneNumber, 10);

    // Start transaction
    await executeQuery('START TRANSACTION');

    // Fetch all hashed phones
    const existingPhones = await executeQuery('SELECT hashed_phone FROM betsusers');

    // Check if phone already exists
    let phoneExists = false;
    for (const row of existingPhones) {
      if (await bcrypt.compare(phoneNumber, row.hashed_phone)) {
        phoneExists = true;
        break;
      }
    }

    if (phoneExists) {
      await executeQuery('ROLLBACK');
      return res.status(409).json({ error: 'Phone number is already registered' });
    }

    // Check if user already exists
    const userResults = await executeQuery('SELECT * FROM betsusers WHERE uid = ?', [currentUser.uid]);

    if (userResults.length > 0) {
      // Update existing user’s phone
      await executeQuery('UPDATE betsusers SET hashed_phone = ? WHERE uid = ?', [
        hashedPhone,
        currentUser.uid,
      ]);
      await executeQuery('COMMIT');
      return res.status(200).json({ message: 'Phone number updated successfully' });
    } else {
      // Insert new user
      await executeQuery(
        `INSERT INTO betsusers (uid, email, hashed_phone, wallet_balance, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [currentUser.uid, currentUser.email, hashedPhone, 100]
      );
      await executeQuery('COMMIT');
      return res.status(201).json({ message: 'User added successfully with initial balance' });
    }

  } catch (error) {
    console.error('Error in /api/save-user:', error);
    await executeQuery('ROLLBACK');
    res.status(500).json({ error: 'Error saving user', details: error.message });
  }
});


//Save new User to DB
app.post('/api/check-phone', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    await executeQuery('START TRANSACTION');

    const existingPhones = await executeQuery('SELECT hashed_phone FROM betsusers');
    let phoneExists = false;

    for (const row of existingPhones) {
      const match = await bcrypt.compare(phoneNumber, row.hashed_phone);
      if (match) {
        phoneExists = true;
        break;
      }
    }

    await executeQuery('COMMIT');
    res.status(200).json({ exists: phoneExists });

  } catch (error) {
    console.error('Error in /api/check-phone:', error);
    await executeQuery('ROLLBACK');
    res.status(500).json({ error: 'Error checking phone number', details: error.message });
  }
});


//For Testing Only
// app.get('/api/savedmarkets', async (req, res) => {
//   const filePath = path.join(__dirname, 'ipswichcrystal-leicesterwestam.json');

//   // Read the JSON file
//   fs.readFile(filePath, 'utf8', (err, data) => {
//     if (err) {
//       console.error('Error reading the JSON file:', err);
//       return res.status(500).json({ message: 'Failed to load data' });
//     }
//     // console.log(JSON.parse(data))
//     // Parse and send the JSON data
//     res.json(JSON.parse(data));
//   });
// });

//For Testing Only
// app.get('/api/savedmatches', async (req, res) => {
//   const filePath = path.join(__dirname, 'the-odds-api.json');

//   // Read the JSON file
//   fs.readFile(filePath, 'utf8', (err, data) => {
//     if (err) {
//       console.error('Error reading the JSON file:', err);
//       return res.status(500).json({ message: 'Failed to load data' });
//     }
//     // console.log(JSON.parse(data))
//     // Parse and send the JSON data
//     res.json(JSON.parse(data));
//   });
// });

//Get all transaction of current user
app.post('/api/transactions', async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log("Verified UID:", uid);

    // Fetch the user's last 20 transactions with related bet info
    const sql = `
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
    `;

    const userResults = await executeQuery(sql, [uid]);
    res.status(200).json({ message: 'Transactions retrieved', results: userResults });

  } catch (error) {
    console.error("Error retrieving transactions:", error);
    if (error.code === 'auth/argument-error') {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(500).json({ error: "Error retrieving transactions", details: error.message });
    }
  }
});


//Get bets history of current user
app.post('/api/bets-history', async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log("Verified UID:", uid);

    const sql = `
      SELECT 
          bl.*, 
          bwt.transaction_id, 
          bwt.transaction_type, 
          bwt.amount
      FROM bets_list AS bl
      LEFT JOIN bets_wallet_transactions AS bwt
        ON bwt.transaction_id = (
          SELECT MAX(transaction_id)
          FROM bets_wallet_transactions
          WHERE bets_wallet_transactions.bet_id = bl.bet_id
            AND (
              (bl.status = 'pending' AND transaction_type = 'bet')
              OR
              (bl.status IN ('won', 'lost') AND transaction_type IN ('win', 'loss'))
            )
        )
      WHERE bl.uid = ?
      ORDER BY bwt.transaction_id DESC
      LIMIT 20
    `;

    const userResults = await executeQuery(sql, [uid]);
    res.status(200).json({ message: 'Bets history retrieved', results: userResults });

  } catch (error) {
    console.error("Error retrieving bets history:", error);

    if (error.code === 'auth/argument-error') {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(500).json({ error: "Error retrieving bets history", details: error.message });
    }
  }
});


function toMySQLDateTime(jsDate) {
  // console.log(jsDate.toISOString().slice(0, 19).replace('T', ' '))
  return jsDate.toISOString().slice(0, 19).replace('T', ' ');
}

//Update betsusers table, set premiumTrial status and expiry date
app.post('/api/upgradePremiumTrial', async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log("Verified UID:", uid);

    const { expiresAt } = req.body;
    if (!expiresAt) {
      return res.status(400).json({ error: "Missing expiresAt field" });
    }

    const expiresAtDate = new Date(expiresAt);
    const expiresAtTimestamp = toMySQLDateTime(expiresAtDate);

    // Check if the user already has a premium trial
    const [user] = await executeQuery(
      'SELECT isPremiumTrial FROM betsusers WHERE uid = ?',
      [uid]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isPremiumTrial) {
      return res.status(400).json({ error: "Premium trial already activated" });
    }

    // Update user to premium trial
    const updateQuery = `
      UPDATE betsusers
      SET isPremiumTrial = TRUE, trialExpiresAt = ?
      WHERE uid = ?
    `;
    await executeQuery(updateQuery, [expiresAtTimestamp, uid]);

    res.status(200).json({ message: "User upgraded to premium trial successfully" });

  } catch (error) {
    console.error("Error upgrading to premium trial:", error);

    if (error.code === 'auth/argument-error') {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(500).json({ error: "Error upgrading to premium trial", details: error.message });
    }
  }
});


//Update betsusers table, set premium status, not being used
app.post('/api/upgradePremium', async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log("Verified UID:", uid);

    // Check if user exists
    const [user] = await executeQuery(
      'SELECT isPremium FROM betsusers WHERE uid = ?',
      [uid]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isPremium) {
      return res.status(400).json({ error: "User is already premium" });
    }

    // Upgrade user to premium
    await executeQuery(
      `UPDATE betsusers SET isPremium = TRUE WHERE uid = ?`,
      [uid]
    );

    res.status(200).json({ message: "User upgraded to premium successfully" });

  } catch (error) {
    console.error("Error upgrading user:", error);

    if (error.code === 'auth/argument-error') {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(500).json({ error: "Error upgrading user", details: error.message });
    }
  }
});


// This is your test secret API key.
const stripe = require('stripe')(process.env.STRIPE_KEY);

const YOUR_DOMAIN = process.env.YOUR_DOMAIN; // Update to your frontend domain

//Payment for Premium
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: process.env.PREMIUM_ID,
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

// app.listen(4242, () => console.log('Running on port 4242'));

//Verify Payments so they won't repeat
app.post('/api/verify-payment', async (req, res) => {
  const { sessionId } = req.body;

  try {
    // Verify Firebase token
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log("Verified UID:", uid);

    // Retrieve session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.json({ isValid: false, message: 'Payment not completed or invalid' });
    }

    const purchaseType = session.metadata.purchaseType;
    const coinsQuantity = parseInt(session.metadata.coinsQuantity || 0, 10);

    // Check if session already processed
    const existingSession = await executeQuery(
      'SELECT id FROM bets_wallet_transactions WHERE session_id = ?',
      [sessionId]
    );
    if (existingSession.length > 0) {
      return res.json({ isValid: false, message: 'Session already processed' });
    }

    // Begin transaction
    await executeQuery('START TRANSACTION');

    if (purchaseType === 'premium') {
      const [user] = await executeQuery('SELECT isPremium FROM betsusers WHERE uid = ?', [uid]);
      if (!user) throw new Error('User not found');
      if (user.isPremium) throw new Error('User is already premium');

      // Upgrade user to premium
      await executeQuery('UPDATE betsusers SET isPremium = TRUE WHERE uid = ?', [uid]);

      // Add bonus coins
      await executeQuery('UPDATE betsusers SET wallet_balance = wallet_balance + 500 WHERE uid = ?', [uid]);

      // Log transaction
      await executeQuery(
        `INSERT INTO bets_wallet_transactions (uid, bet_id, transaction_type, amount, transaction_date, session_id)
         VALUES (?, ?, ?, ?, NOW(), ?)`,
        [uid, null, 'deposit', 500, sessionId]
      );

      await executeQuery('COMMIT');
      return res.json({
        isValid: true,
        message: 'Premium upgraded and 500 coins added successfully',
        premiumChange: true,
        coinsAdded: 500
      });

    } else if (purchaseType === 'coins') {
      const amount = coinsQuantity * 1000;
      if (!amount || amount <= 0) throw new Error('Invalid coin quantity');

      // Update wallet
      await executeQuery('UPDATE betsusers SET wallet_balance = wallet_balance + ? WHERE uid = ?', [amount, uid]);

      // Log transaction
      await executeQuery(
        `INSERT INTO bets_wallet_transactions (uid, bet_id, transaction_type, amount, transaction_date, session_id)
         VALUES (?, ?, ?, ?, NOW(), ?)`,
        [uid, null, 'deposit', amount, sessionId]
      );

      await executeQuery('COMMIT');
      return res.json({
        isValid: true,
        message: 'Coins added successfully',
        premiumChange: false,
        coinsAdded: amount
      });
    }

    throw new Error('Invalid purchase type');

  } catch (error) {
    console.error('Error verifying payment:', error);
    await executeQuery('ROLLBACK').catch(() => {});
    res.status(500).json({
      isValid: false,
      message: error.message || 'Internal server error'
    });
  }
});


//Payment for Coins
app.post('/create-checkout-session-coins', async (req, res) => {
  const { quantity } = req.body; // Get quantity from frontend
  console.log(quantity)
  if (!quantity || quantity <= 0) {
    return res.status(400).send({ error: 'Invalid quantity' });
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: process.env.COINS_ID,
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

//For Testing Only
// app.post('/api/save-data', async (req, res) => {
//   const groupedMatches = req.body;

//   try {
//       // Start a transaction
//       await executeQuery('START TRANSACTION');

//       for (const [date, matches] of Object.entries(groupedMatches)) {
//           for (const match of matches) {
//               const { id, fixture, homeTeam, awayTeam, time, homeOdds, drawOdds, awayOdds, marketIDs } = match;

//               // Check if the match already exists
//               const checkMatchQuery = `SELECT COUNT(*) AS count FROM matches WHERE id = ?`;
//               const matchExists = await executeQuery(checkMatchQuery, [id]);

//               if (matchExists[0].count > 0) {
//                 // console.log(`Match with id ${id} already exists. Skipping insertion.`);
                
//                 continue;
//               }

//               // Insert match into the `matches` table
//               const matchQuery = `
//                   INSERT INTO matches (id, fixture, home_team, away_team, date, time, home_odds, draw_odds, away_odds)
//                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
//               const date2 = new Date(date);
//               const sqlDate = date2.toISOString().split('T')[0];
//               const matchValues = [id, fixture, homeTeam, awayTeam, sqlDate, time, homeOdds, drawOdds, awayOdds];
//               await executeQuery(matchQuery, matchValues);

//               console.log(`Inserted match with id ${id}`);

              
//           }
//       }

//       // Commit the transaction if all operations succeed
//       await executeQuery('COMMIT');
//       res.status(200).json({ message: 'Matches and markets saved successfully' });

//   } catch (error) {
//       // Roll back the transaction if any operation fails
//       await executeQuery('ROLLBACK');
//       console.error('Error saving groupedMatches:', error);
//       res.status(500).json({ error: 'Error saving matches and markets', details: error.message });
//   }
// });

//For Testing Only
// app.post('/api/save-markets', async (req, res) => {
//   const filePath = path.join(__dirname, 'ipswichcrystal-leicesterwestam.json');

//   // Read the JSON file
//   fs.readFile(filePath, 'utf8', async (err, data) => {
//     if (err) {
//       console.error('Error reading the JSON file:', err);
//       return res.status(500).json({ message: 'Failed to load data' });
//     }
//     // console.log(JSON.parse(data))
//     // Parse and send the JSON data
//     const markets = JSON.parse(data);
//     try {
//       // Start a transaction
//       await executeQuery('START TRANSACTION');
  
//       for (const market of markets) {
//         const { marketId, marketName, subeventName, subeventStartTime, bets } = market;
  
//         for (const bet of bets) {
//           const { betName, line, bestOddsDecimal } = bet;
  
//           // Check if a bet with the same marketId and betName already exists
//           const checkQuery = `
//             SELECT COUNT(*) AS count
//             FROM markets
//             WHERE marketId = ? AND betName = ?
//           `;
//           const checkResult = await executeQuery(checkQuery, [marketId,  line ? `${betName} ${line}` : betName]);
  
//           if (checkResult[0].count === 0) {
//             // Insert the bet if it doesn't exist
//             const insertQuery = `
//               INSERT INTO markets (marketId, marketName, subeventName, subeventStartTime, betName, bestOddsDecimal)
//               VALUES (?, ?, ?, ?, ?, ?)
//             `;
//             await executeQuery(insertQuery, [
//               marketId,
//               marketName,
//               subeventName,
//               new Date(subeventStartTime),
//               line ? `${betName} ${line}` : betName,
//               bestOddsDecimal,
//             ]);
//           }
//         }
//       }
  
//       // Commit the transaction
//       await executeQuery('COMMIT');
//       res.status(200).json({ message: 'Markets and bets saved successfully' });
  
//     } catch (error) {
//       // Roll back the transaction if any operation fails
//       await executeQuery('ROLLBACK');
//       console.error('Error saving markets and bets:', error);
//       res.status(500).json({ error: 'Error saving markets and bets', details: error.message });
//     }
//   });
 
// });

//For Testing Only
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

//Fetch Pending Bets for Admin
app.post('/api/pending-bets', async (req, res) => {
  try {
    // Verify Firebase token
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Check if user is admin
    const [user] = await executeQuery('SELECT admin FROM betsusers WHERE uid = ?', [uid]);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    if (user.admin !== 1) return res.status(403).json({ success: false, error: "Unauthorized access" });

    // Fetch distinct pending bets
    const query = `
      SELECT DISTINCT 
        STR_TO_DATE(match_date, '%d %M %Y %H:%i') AS full_date,
        DATE_FORMAT(STR_TO_DATE(match_date, '%d %M %Y %H:%i'), '%d %M %Y') AS match_day,
        DATE_FORMAT(STR_TO_DATE(match_date, '%d %M %Y %H:%i'), '%H:%i') AS match_time,
        fixture, 
        bet_market, 
        bet_type
      FROM bets_list
      WHERE status = 'pending'
      ORDER BY full_date ASC, fixture ASC, bet_market ASC;
    `;

    const pendingBets = await executeQuery(query);

    if (pendingBets.length === 0) {
      return res.json({ success: true, data: {}, message: "No pending bets found." });
    }

    // Group by match_day → fixture → bet_market
    const groupedBets = pendingBets.reduce((acc, bet) => {
      const { match_day, fixture, bet_market, match_time, bet_type } = bet;

      if (!acc[match_day]) acc[match_day] = {};
      if (!acc[match_day][fixture]) acc[match_day][fixture] = { time: match_time, markets: {} };
      if (!acc[match_day][fixture].markets[bet_market]) acc[match_day][fixture].markets[bet_market] = [];

      acc[match_day][fixture].markets[bet_market].push(bet_type);
      return acc;
    }, {});

    res.json({ success: true, data: groupedBets });

  } catch (error) {
    console.error("Error in /api/pending-bets:", error);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});



//Save Match Results from Admin
app.post('/api/update-bet-results', async (req, res) => {
  const { match_day, time, fixture, bet_market, winningBets } = req.body;

  try {
    // --- Verify token ---
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decodedToken = await admin.auth().verifyIdToken(token);
    const tokenUID = decodedToken.uid;
    console.log("Verified UID:", tokenUID);

    // --- Validate admin ---
    const [user] = await executeQuery('SELECT admin FROM betsusers WHERE uid = ?', [tokenUID]);
    if (!user || user.admin !== 1)
      return res.status(403).json({ success: false, error: "Unauthorized access" });

    // --- Start transaction ---
    await executeQuery("START TRANSACTION");

    // Format match date
    let match_date = match_day + " " + time;
    if (match_date.startsWith("0")) match_date = match_date.slice(1);

    console.log("Match:", match_date, fixture, bet_market, winningBets);

    // --- Handle winning and losing bets ---
    if (Array.isArray(winningBets) && winningBets.length > 0) {
      // Mark winning bets
      await executeQuery(
        `UPDATE bets_list 
         SET status = 'won', settled_at = NOW() 
         WHERE match_date = ? AND fixture = ? AND bet_market = ? AND bet_type IN (?)`,
        [match_date, fixture, bet_market, winningBets]
      );

      // Mark losing bets
      await executeQuery(
        `UPDATE bets_list 
         SET status = 'lost', settled_at = NOW() 
         WHERE match_date = ? AND fixture = ? AND bet_market = ? AND bet_type NOT IN (?)`,
        [match_date, fixture, bet_market, winningBets]
      );

      // Fetch winners
      const winningBetsData = await executeQuery(
        `SELECT uid, potential_payout, bet_id
         FROM bets_list 
         WHERE match_date = ? AND fixture = ? AND bet_market = ? AND bet_type IN (?)`,
        [match_date, fixture, bet_market, winningBets]
      );

      // Process winnings
      for (const { uid, potential_payout, bet_id } of winningBetsData) {
        await executeQuery(
          `INSERT INTO bets_wallet_transactions (uid, bet_id, transaction_type, amount, transaction_date)
           VALUES (?, ?, 'win', ?, NOW())`,
          [uid, bet_id, potential_payout]
        );

        await executeQuery(
          `UPDATE betsusers SET wallet_balance = wallet_balance + ? WHERE uid = ?`,
          [potential_payout, uid]
        );

        await executeQuery(
          `INSERT INTO bets_notifications (uid, message)
           VALUES (?, ?)`,
          [uid, `You <span class="result-won">won</span> the bet from <strong>${fixture} (${bet_market})</strong>!`]
        );
      }

      // Fetch and record losing bets
      const losingBetsData = await executeQuery(
        `SELECT uid, bet_id
         FROM bets_list 
         WHERE match_date = ? AND fixture = ? AND bet_market = ? AND bet_type NOT IN (?)`,
        [match_date, fixture, bet_market, winningBets]
      );

      for (const { uid, bet_id } of losingBetsData) {
        await executeQuery(
          `INSERT INTO bets_wallet_transactions (uid, bet_id, transaction_type, amount, transaction_date)
           VALUES (?, ?, 'loss', 0, NOW())`,
          [uid, bet_id]
        );

        await executeQuery(
          `INSERT INTO bets_notifications (uid, message)
           VALUES (?, ?)`,
          [uid, `You <span class="result-lost">lost</span> the bet from <strong>${fixture} (${bet_market})</strong>.`]
        );
      }

    } else {
      // --- If no winning bets, mark all as lost ---
      await executeQuery(
        `UPDATE bets_list 
         SET status = 'lost', settled_at = NOW() 
         WHERE match_date = ? AND fixture = ? AND bet_market = ?`,
        [match_date, fixture, bet_market]
      );

      const losingBetsData = await executeQuery(
        `SELECT uid, bet_id
         FROM bets_list 
         WHERE match_date = ? AND fixture = ? AND bet_market = ?`,
        [match_date, fixture, bet_market]
      );

      for (const { uid, bet_id } of losingBetsData) {
        await executeQuery(
          `INSERT INTO bets_wallet_transactions (uid, bet_id, transaction_type, amount, transaction_date)
           VALUES (?, ?, 'loss', 0, NOW())`,
          [uid, bet_id]
        );

        await executeQuery(
          `INSERT INTO bets_notifications (uid, message)
           VALUES (?, ?)`,
          [uid, `You <span class="result-lost">lost</span> the bet from <strong>${fixture} (${bet_market})</strong>.`]
        );
      }
    }

    // --- Commit transaction ---
    await executeQuery("COMMIT");
    res.json({ success: true, message: "Bet results updated successfully!" });

  } catch (error) {
    console.error("Error updating bet results:", error);
    await executeQuery("ROLLBACK").catch(() => {}); // Always rollback if error
    res.status(500).json({ success: false, error: "Error updating bet results." });
  }
});


// Fetch Unread Notifications (with Firebase verification)
app.get('/api/notifications', async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const notifications = await executeQuery(
      `SELECT * FROM bets_notifications WHERE uid = ? AND status = 'unread' ORDER BY created_at DESC`,
      [uid]
    );

    res.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, error: 'Error fetching notifications' });
  }
});


// Mark Notifications as Read (with Firebase verification)
app.post('/api/mark-notifications-read', async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    await executeQuery(
      `UPDATE bets_notifications SET status = 'read' WHERE uid = ?`,
      [uid]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ success: false, error: 'Error updating notifications' });
  }
});



// Serve React frontend
app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});
