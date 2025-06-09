// models/userModel.js
const fs     = require("fs");
const path   = require("path");
const bcrypt = require("bcrypt");

const file = path.join(__dirname, "../data/users.json");

// Функция загрузки всех пользователей
function load() {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

// Функция сохранения массива пользователей
function save(arr) {
  fs.writeFileSync(file, JSON.stringify(arr, null, 2));
}

module.exports = {
  // Найти по email
  findByEmail: email =>
    load().find(u => u.email === email),

  // Найти по id
  findById: id =>
    load().find(u => u.id === id),

  // Создать нового пользователя
  create: async (email, password) => {
    const users = load();
    const hash  = await bcrypt.hash(password, 10);
    const user  = { id: Date.now(), email, password: hash };
    users.push(user);
    save(users);
    return user;
  }
};
