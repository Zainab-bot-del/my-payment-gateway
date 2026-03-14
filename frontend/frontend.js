// frontend.js — final working version

const API_URL = "http://localhost:3000"; // backend server
const API_KEY = "supersecret123";       // must match your .env API_KEY

// Create User
async function createUser() {
  const name = document.getElementById("name").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_URL}/api/user`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      },
      body: JSON.stringify({ name, password })
    });
    const data = await res.json();
    document.getElementById("createUserResult").innerText = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("createUserResult").innerText = err.message;
  }
}

// Check Wallet
async function checkWallet() {
  const id = document.getElementById("walletId").value;

  try {
    const res = await fetch(`${API_URL}/api/wallet/${id}`, {
      headers: { "x-api-key": API_KEY }
    });
    const data = await res.json();
    document.getElementById("walletResult").innerText = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("walletResult").innerText = err.message;
  }
}

// Add Money
async function addMoney() {
  const userId = document.getElementById("addUserId").value;
  const amount = document.getElementById("addAmount").value;

  try {
    const res = await fetch(`${API_URL}/api/wallet/add`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      },
      body: JSON.stringify({ userId, amount })
    });
    const data = await res.json();
    document.getElementById("addMoneyResult").innerText = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("addMoneyResult").innerText = err.message;
  }
}

// Transfer Money
async function transferMoney() {
  const from = document.getElementById("fromId").value;
  const to = document.getElementById("toId").value;
  const amount = document.getElementById("transferAmount").value;

  try {
    const res = await fetch(`${API_URL}/api/wallet/transfer`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      },
      body: JSON.stringify({ from, to, amount })
    });
    const data = await res.json();
    document.getElementById("transferResult").innerText = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("transferResult").innerText = err.message;
  }
}