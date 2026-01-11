const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

/* ===== MIDDLEWARE ===== */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "adzduniya_secret_key",
  resave: false,
  saveUninitialized: false
}));

/* ===== MONGODB CONNECT ===== */
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error ❌", err));

/* ===== OFFER MODEL (IMPORTANT) ===== */
const OfferSchema = new mongoose.Schema({
  name: String,
  url: String,
  createdAt: { type: Date, default: Date.now }
});

const Offer = mongoose.model("Offer", OfferSchema);

const LeadSchema = new mongoose.Schema({
  offerName: String,
  upi: String,
  createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model("Lead", LeadSchema);

/* ===== ADMIN CREDENTIALS ===== */
const ADMIN_EMAIL = "earnfast1258000@gmail.com";
const ADMIN_PASSWORD_HASH = bcrypt.hashSync("earnfast1258000@", 10);

/* ===== LOGIN PAGE ===== */
app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* ===== LOGIN HANDLE ===== */
app.post("/admin-login", (req, res) => {
  const { email, password } = req.body;

  if (email !== ADMIN_EMAIL) return res.send("Invalid email");

  const ok = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
  if (!ok) return res.send("Wrong password");

  req.session.admin = true;
  res.redirect("/admin");
});

/* ===== DASHBOARD ===== */
app.get("/admin", async (req, res) => {
  if (!req.session.admin) return res.redirect("/admin-login");

  const offers = await Offer.find().sort({ createdAt: -1 });

  let html = `
    <h1>adzduniya Admin Panel</h1>
    <a href="/add-offer">➕ Add Offer</a> |
    <a href="/logout">Logout</a>
    <hr>
  `;

  if (offers.length === 0) {
    html += "<p>No offers yet</p>";
  } else {
    html += "<ul>";
    offers.forEach(o => {
      html += `<li><b>${o.name}</b> - ${o.url}</li>`;
    });
    html += "</ul>";
  }

  res.send(html);
});

/* ===== ADD OFFER ===== */
app.get("/add-offer", (req, res) => {
  if (!req.session.admin) return res.redirect("/admin-login");
  res.sendFile(path.join(__dirname, "public", "add-offer.html"));
});

app.post("/add-offer", async (req, res) => {
  const { name, url } = req.body;

  await Offer.create({ name, url });

  res.send(`Offer Added & Saved in Database ✅<br><a href="/admin">Back to dashboard</a>`);
});

// ===== PUBLIC OFFER PAGE =====
app.get("/:offerName", async (req, res) => {
  const offerName = req.params.offerName;

  const offer = await Offer.findOne({ name: offerName });

  if (!offer) return res.send("Offer not found");

  res.send(`
    <h2>Offer: ${offer.name}</h2>
    <form method="POST">
      <input name="upi" placeholder="Enter your UPI ID" required />
      <button>Continue</button>
    </form>
  `);
});

// ===== HANDLE UPI + REDIRECT =====
app.post("/:offerName", async (req, res) => {
  const offerName = req.params.offerName;
  const { upi } = req.body;

  const offer = await Offer.findOne({ name: offerName });
  if (!offer) return res.send("Offer not found");

  await Lead.create({
    offerName,
    upi
  });

  const redirectUrl = offer.url.replace("{upi}", encodeURIComponent(upi));

  res.redirect(redirectUrl);
});

/* ===== LOGOUT ===== */
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin-login"));
});

/* ===== HOME ===== */
app.get("/", (req, res) => {
  res.send("adzduniya server running");
});

/* ===== START ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started on " + PORT));