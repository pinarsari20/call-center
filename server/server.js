const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

/* ================= LOGIN ================= */

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "1234") {
    res.redirect("/dashboard.html");
  } else {
    res.redirect("/login.html?error=1");
  }
});

/* ================= ORDERS API ================= */

const ORDERS_FILE = path.join(__dirname, "orders.json");

if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, "[]");
}

app.get("/api/orders", (req, res) => {
  const data = fs.readFileSync(ORDERS_FILE, "utf-8");
  res.json(JSON.parse(data));
});

app.post("/api/orders", (req, res) => {
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
  orders.push(req.body);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  res.json({ success: true });
});

/* ================= ANA PANEL ================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server çalışıyor → http://localhost:${PORT}`);
});
/* ================= LOGIN PAGE (GET) ================= */

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});
