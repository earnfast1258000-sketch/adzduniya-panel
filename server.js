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

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error ❌", err));

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
app.get("/admin", (req, res) => {
  if (!req.session.admin) return res.redirect("/admin-login");
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* ===== ADD OFFER ===== */
app.get("/add-offer", (req, res) => {
  if (!req.session.admin) return res.redirect("/admin-login");
  res.sendFile(path.join(__dirname, "public", "add-offer.html"));
});

app.post("/add-offer", (req, res) => {
  const { name, url } = req.body;
  res.send(`Offer Added ✅<br>Name: ${name}<br>URL: ${url}<br><a href="/admin">Back</a>`);
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