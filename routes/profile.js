const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const router = express.Router();

const USERS_FILE = path.join(__dirname, "../data/users.json");
const UPLOAD_DIR = path.join(__dirname, "../public/uploads");

// 📁 Суреттер үшін multer баптауы
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.round(Math.random() * 1000)}${ext}`);
  }
});
const upload = multer({ storage });

// 🔐 Авторизация тексеру
function ensureAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// 📄 Профиль беті
router.get("/", ensureAuth, (req, res) => {
  res.render("profile");
});

// 📝 Профильді жаңарту (аты-жөні, email, сурет)
router.post("/update", ensureAuth, upload.single("avatar"), (req, res) => {
  const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  const currentUser = users.find(u => u.email === req.session.user.email);

  if (currentUser) {
    currentUser.name = req.body.name;
    currentUser.email = req.body.email;

    // Аватар жаңартылса
    if (req.file) {
      // Алдыңғы суретті өшіру (егер бар болса)
      if (currentUser.avatar) {
        const oldPath = path.join(UPLOAD_DIR, currentUser.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      currentUser.avatar = req.file.filename;
      req.session.user.avatar = req.file.filename;
    }

    // Сессия мәліметін жаңарту
    req.session.user.name = req.body.name;
    req.session.user.email = req.body.email;

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  }

  res.redirect("/profile");
});

module.exports = router;
