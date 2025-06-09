const express = require("express");
const fs = require("fs");
const dns = require("dns").promises;
const axios = require("axios");
const tesseract = require("tesseract.js");
const { simpleParser } = require("mailparser");
const multer = require("multer");
const Check = require("../models/checkModel");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// 🔐 Авторизацияны тексеру
function ensureAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

// 🔍 SPF жазбасын тексеру
async function checkSPF(domain) {
  try {
    const records = await dns.resolveTxt(domain);
    return records.flat().some(r => r.startsWith("v=spf1")) ? "Иә (бар)" : "Жоқ";
  } catch {
    return "Қате";
  }
}

// 🔐 DKIM жазбасын тексеру
async function checkDKIM(domain, selector = "default") {
  try {
    const records = await dns.resolveTxt(`${selector}._domainkey.${domain}`);
    return records.flat().some(r => r.includes("v=DKIM1")) ? "Иә (бар)" : "Жоқ";
  } catch {
    return "Қате";
  }
}

// 📬 DMARC жазбасын тексеру
async function checkDMARC(domain) {
  try {
    const records = await dns.resolveTxt(`_dmarc.${domain}`);
    return records.flat().some(r => r.startsWith("v=DMARC1")) ? "Иә (бар)" : "Жоқ";
  } catch {
    return "Қате";
  }
}

// 🛡 VirusTotal арқылы URL қауіпсіздігін тексеру
async function checkVirusTotal(url) {
  const key = process.env.VT_API_KEY;
  const id = Buffer.from(url).toString("base64url");

  try {
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/urls/${id}`,
      { headers: { "x-apikey": key } }
    );
    return response.data.data.attributes.last_analysis_stats;
  } catch (e) {
    return { error: e.message };
  }
}

// ⚠️ Қауіп деңгейін бағалау
function calculateRisk(spf, dkim, urls) {
  if (spf === "Жоқ" && dkim === "Жоқ" && urls.length > 0) return "High";
  if (dkim === "Жоқ" && urls.length > 0) return "Medium";
  return "Safe";
}

// 📥 GET /analyze — форма беті
router.get("/", ensureAuth, (req, res) => {
  res.render("index", { result: null });
});

// 📤 POST /analyze — файл талдау
router.post("/", ensureAuth, upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const ext = filePath.split(".").pop().toLowerCase();
  let result = {};

  try {
    // 🖼 Егер сурет болса — OCR арқылы тану
    if (["jpg", "jpeg", "png"].includes(ext)) {
      const { data: { text } } = await tesseract.recognize(filePath, "eng");
      result = { type: "image", text, urls: [], riskLevel: "Safe" };
    } 
    // 📧 Егер email файлы болса — .eml өңдеу
    else {
      const raw = fs.readFileSync(filePath);
      const parsed = await simpleParser(raw);

      const from    = parsed.from?.text || "";
      const subject = parsed.subject    || "";
      const text    = parsed.text       || "";
      const html    = parsed.html       || "";

      // Барлық URL мекенжайларын алу
      const urls = Array.from(new Set([
        ...[...text.matchAll(/https?:\/\/[^\s"'<>()]+/gi)].map(m => m[0]),
        ...[...html.matchAll(/https?:\/\/[^\s"'<>()]+/gi)].map(m => m[0])
      ]));

      // Домен бөлігін шығару
      const domain = from.match(/@([\w.-]+)/)?.[1] || "";

      // DNS жазбаларын тексеру
      const spf   = await checkSPF(domain);
      const dkim  = await checkDKIM(domain);
      const dmarc = await checkDMARC(domain);

      // VirusTotal арқылы әр URL-ды тексеру
      const vtResults = [];
      for (const url of urls) {
        const stats = await checkVirusTotal(url);
        vtResults.push({ url, stats });
      }

      const riskLevel = calculateRisk(spf, dkim, urls);

      result = {
        type: "eml", from, subject, urls, domain,
        spf, dkim, dmarc, vtResults, riskLevel
      };
    }
  } catch (e) {
    result = { error: e.message };
  }

  // 🧹 Файлды жою
  fs.unlinkSync(filePath);

  // 🔄 Тарихты сақтау
  Check.add({
    userId: req.session.user.id,
    timestamp: new Date().toISOString(),
    ...result
  });

  // 🌐 Нәтижені көрсету
  res.render("index", { result });
});

module.exports = router;

