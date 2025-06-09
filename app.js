// app.js
require("dotenv").config();
const express       = require("express");
const path          = require("path");
const cookieParser  = require("cookie-parser");
const session       = require("express-session");

const authRoutes    = require("./routes/auth");
const analyzeRoutes = require("./routes/analyze");
const dashRoutes    = require("./routes/dashboard");
const profileRoutes = require("./routes/profile");

const app = express();
const PORT = process.env.PORT || 3000;

// 📦 EJS шаблон жүйесін орнату
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 🧾 Публичті файлдар (CSS, JS, иконка, сурет)
app.use(express.static(path.join(__dirname, "public")));

// 📩 Формалар, cookies, session
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || "phishing_secret",
  resave: false,
  saveUninitialized: false
}));

// 🌐 Барлық шаблондарға тіл және қолданушыны беру
app.use((req, res, next) => {
  res.locals.lang = req.query.lang === "ru" ? "ru" : "kk";
  res.locals.user = req.session.user;
  next();
});

// 📍 Маршрут жолын шаблондарға беру
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// 🔗 Бағдарлама маршруттары
app.use("/analyze", analyzeRoutes);
app.use(authRoutes);
app.use(dashRoutes);
app.use("/profile", profileRoutes); // ✅ Осы жерде тұруы тиіс!

// 🏠 Басты бет
app.get("/", (req, res) => {
  res.render("index", { result: null });
});

// 🚀 Серверді іске қосу
app.listen(PORT, () => {
  console.log(`Сервер жұмыс істеп тұр: http://localhost:${PORT}`);
});
