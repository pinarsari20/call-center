const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../halk")));

// LOGIN SAYFASI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../halk/login.html"));
});

// LOGIN POST
app.post("/login", (req, res) => {
  const { kullanici_adi, sifre } = req.body;

  if (kullanici_adi === "yonetici" && sifre === "1234") {
    res.redirect("/dashboard.html");
  } else {
    res.redirect("/login.html?error=1");
  }
});

// API
const DATA_FILE = path.join(__dirname, "siparisler.json");
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

app.get("/api/siparisler", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  res.json(data);
});

app.post("/api/siparisler", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  data.push(req.body);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.json({ basarili: true });
});

app.listen(PORT, () => {
  console.log("Sunucu çalışıyor:", PORT);
});
