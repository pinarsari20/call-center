const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = "CHANGE_THIS_SECRET_KEY";

/* ==============================
   MIDDLEWARE
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
const NUMBERS_FILE = path.join(__dirname, "numbers.json");

app.get("/api/numbers", (req, res) => {
  try {
    const data = fs.existsSync(NUMBERS_FILE)
      ? JSON.parse(fs.readFileSync(NUMBERS_FILE, "utf-8"))
      : [];
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "numbers okunamadı" });
  }
});

app.get("/api/profiles", async (req, res) => {
  const { hashtag } = req.query;

  // burada SENİN ÇALIŞAN hashtag -> post kodun var
  const posts = await getPostsByHashtag(hashtag); // zaten sende var

  const unique = new Set();
  const profiles = [];

  posts.forEach(post => {
    const username = post.owner?.username;
    if (username && !unique.has(username)) {
      unique.add(username);
      profiles.push({
        username,
        profileUrl: `https://instagram.com/${username}`,
        hashtag
      });
    }
  });

  res.json(profiles);
});

/* ==============================
   OPTIONAL AUTH (MEVCUT AKIŞI BOZMAZ)
================================ */
function optionalAuth(req, res, next) {
  const token =
    req.headers.authorization?.split(" ")[1] ||
    req.cookies?.token;

  if (!token) return next();

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {}
  next();
}

app.use(optionalAuth);

/* ==============================
   PAGES
================================ */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

/* ==============================
   LOGIN (MEVCUT KORUNDU)
================================ */
app.post("/login", (req, res) => {
  const { kullanici_adi, sifre } = req.body;

  if (kullanici_adi === "yonetici" && sifre === "1234") {
    const token = jwt.sign({ user: "yonetici" }, JWT_SECRET, {
      expiresIn: "12h",
    });

    res.redirect("/dashboard.html");
  } else {
    res.redirect("/login.html?error=1");
  }
});

/* ==============================
   DATA FILES
================================ */
const DATA_PATH = __dirname;

const files = {
  orders: path.join(DATA_PATH, "orders.json"),
  users: path.join(DATA_PATH, "users.json"),
  trials: path.join(DATA_PATH, "trials.json"),
  appointments: path.join(DATA_PATH, "appointments.json"),
  numbers: path.join(DATA_PATH, "numbers.json"),
};

Object.values(files).forEach((file) => {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]", "utf-8");
});

/* ==============================
   HELPERS
================================ */
function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

/* ==============================
   API – ORDERS
================================ */
app.get("/api/orders", (req, res) => {
  res.json(readJSON(files.orders));
});

app.post("/api/orders", (req, res) => {
  const orders = readJSON(files.orders);

  orders.push({
    id: Date.now(),
    status: "pending",
    ...req.body,
    createdAt: new Date().toISOString(),
  });

  writeJSON(files.orders, orders);
  res.json({ success: true });
});

app.patch("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ["pending", "processing", "completed", "cancelled"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const orders = readJSON(files.orders);
  const order = orders.find((o) => String(o.id) === String(id));

  if (!order) return res.status(404).json({ error: "Order not found" });

  order.status = status;
  writeJSON(files.orders, orders);

  res.json({ success: true });
});

/* ==============================
   API – TRIAL SERVICES
================================ */
app.get("/api/trials", (req, res) => {
  res.json(readJSON(files.trials));
});

app.post("/api/trials", (req, res) => {
  const trials = readJSON(files.trials);

  trials.push({
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
  });

  writeJSON(files.trials, trials);
  res.json({ success: true });
});

/* ==============================
   API – APPOINTMENTS
================================ */
app.get("/api/appointments", (req, res) => {
  res.json(readJSON(files.appointments));
});

app.post("/api/appointments", (req, res) => {
  const appointments = readJSON(files.appointments);

  appointments.push({
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
  });

  writeJSON(files.appointments, appointments);
  res.json({ success: true });
});

/* ==============================
   API – NUMBERS (READ ONLY)
================================ */
app.get("/api/numbers", (req, res) => {
  res.json(readJSON(files.numbers));
});

/* ==============================
   API – STAFF STATS
================================ */
app.get("/api/staff-stats", (req, res) => {
  const { staff, month } = req.query;

  if (!staff || !month) {
    return res.status(400).json({ error: "staff and month are required" });
  }

  const orders = readJSON(files.orders);

  const monthly = orders.filter(
    (o) => o.staff === staff && o.createdAt?.startsWith(month)
  );

  const turnover = monthly.reduce((s, o) => s + Number(o.price || 0), 0);
  const commission = turnover * 0.1;

  res.json({
    staff,
    month,
    orderCount: monthly.length,
    turnover,
    commission,
  });
});

/* ==============================
   HEALTH CHECK
================================ */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

/* ==============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log("Server running on port:", PORT);
});
