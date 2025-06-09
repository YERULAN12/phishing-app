// models/checkModel.js
const fs   = require("fs");
const path = require("path");

const file = path.join(__dirname, "../data/checks.json");

// Функция загрузки всех записей истории
function load() {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

// Функция сохранения массива записей
function save(arr) {
  fs.writeFileSync(file, JSON.stringify(arr, null, 2));
}

module.exports = {
  // Добавить новую запись истории
  add: record => {
    const arr = load();
    arr.push(record);
    save(arr);
  },
  // Получить все записи по userId
  findByUser: userId =>
    load().filter(r => r.userId === userId)
};  