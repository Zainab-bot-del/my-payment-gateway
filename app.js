// app.js — final working version for Node 24+ and Express

const express = require("express");
const { Pool } = require("pg");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "frontend")));

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "payment_gateway",
  password: "PgAdmin!Key$42",
  port: 5432
});

// Middleware for API key
function checkApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.API_KEY) {
    return res.status(403).send("Forbidden: Invalid API Key");
  }
  next();
}

// Middleware for input validation
function validateCreateUser(req, res, next) {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).send("Name and password required");
  next();
}

function validateAddMoney(req, res, next) {
  const { userId, amount } = req.body;
  if (!userId || !amount || amount <= 0) return res.status(400).send("Invalid data");
  next();
}

function validateTransfer(req, res, next) {
  const { from, to, amount } = req.body;
  if (!from || !to || !amount || amount <= 0) return res.status(400).send("Invalid transfer data");
  next();
}

// Test route
app.get("/api", (req, res) => {
  res.send("Server and API running");
});

// Create user
app.post("/api/user", checkApiKey, validateCreateUser, async (req, res) => {
  const { name, password } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO users (name, password) VALUES ($1,$2) RETURNING *",
      [name, password]
    );

    const userId = result.rows[0].id;

    await pool.query(
      "INSERT INTO wallets (user_id, balance) VALUES ($1,$2)",
      [userId, 0]
    );

    res.json({
      message: "User created",
      user: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating user" });
  }
});

// Get wallet balance
app.get("/api/wallet/:id", checkApiKey, async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query(
      "SELECT balance FROM wallets WHERE user_id=$1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.json({
      userId,
      balance: result.rows[0].balance
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching wallet" });
  }
});

// Add money
app.post("/api/wallet/add", checkApiKey, validateAddMoney, async (req, res) => {
  const { userId, amount } = req.body;

  try {
    const updateResult = await pool.query(
      "UPDATE wallets SET balance = balance + $1 WHERE user_id=$2 RETURNING balance",
      [amount, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.json({
      message: "Money added",
      balance: updateResult.rows[0].balance
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error adding money" });
  }
});

// Transfer money
app.post("/api/wallet/transfer", checkApiKey, validateTransfer, async (req, res) => {
  const { from, to, amount } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const sender = await client.query(
      "SELECT balance FROM wallets WHERE user_id=$1",
      [from]
    );
    if (sender.rows.length === 0) throw new Error("Sender not found");
    if (sender.rows[0].balance < amount) throw new Error("Insufficient balance");

    const receiver = await client.query(
      "SELECT balance FROM wallets WHERE user_id=$1",
      [to]
    );
    if (receiver.rows.length === 0) throw new Error("Receiver not found");

    await client.query(
      "UPDATE wallets SET balance = balance - $1 WHERE user_id=$2",
      [amount, from]
    );
    await client.query(
      "UPDATE wallets SET balance = balance + $1 WHERE user_id=$2",
      [amount, to]
    );

    await client.query(
      "INSERT INTO transactions (sender_id, receiver_id, amount, created_at) VALUES ($1,$2,$3,NOW())",
      [from, to, amount]
    );

    await client.query("COMMIT");

    res.json({ message: "Transfer successful" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Catch-all route for frontend — fixed for Node 24+
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});