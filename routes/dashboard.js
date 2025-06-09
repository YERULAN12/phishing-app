// routes/dashboard.js
const express = require("express");
const Check   = require("../models/checkModel");
const router  = express.Router();

// Middleware для защиты маршрутов
function ensureAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

// Кабинет пользователя — история проверок
router.get("/dashboard", ensureAuth, (req, res) => {
  const history = Check.findByUser(req.session.user.id);
  res.render("dashboard", { history });
});

module.exports = router;
