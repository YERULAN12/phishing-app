// routes/auth.js
const express = require("express");
const bcrypt  = require("bcrypt");
const User    = require("../models/userModel");
const router  = express.Router();

// Страница регистрации
router.get("/register", (_, res) =>
  res.render("register", { error: null })
);

// Обработка регистрации
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  // Проверка на существующий email
  if (User.findByEmail(email)) {
    return res.render("register", { error: "E-mail уже занят" });
  }
  // Создание пользователя
  const user = await User.create(email, password);
  // Сохранение в сессии
  req.session.user = { id: user.id, email: user.email };
  res.redirect("/dashboard");
});

// Страница входа
router.get("/login", (_, res) =>
  res.render("login", { error: null })
);

// Обработка входа
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = User.findByEmail(email);
  // Валидация
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render("login", { error: "Неверные учётные данные" });
  }
  req.session.user = { id: user.id, email: user.email };
  res.redirect("/dashboard");
});

// Выход
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

module.exports = router;
