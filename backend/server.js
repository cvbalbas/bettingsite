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
  const filePath = path.join(__dirname, 'leicestervnottingham.json');

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
  console.log(req.body)

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
  console.log(req.body)

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