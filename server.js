const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("<h1>adzduniya Admin Panel</h1><p>Server Working ✅</p>");
});

app.listen(process.env.PORT || 3000);
