// public/js/app.js
document.addEventListener("DOMContentLoaded", () => {
  // Theme toggle
  const btn = document.getElementById("theme-toggle");
  const current = localStorage.getItem("phish-theme") || "light";
  document.body.setAttribute("data-theme", current);

  btn.addEventListener("click", () => {
    const next = document.body.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.body.setAttribute("data-theme", next);
    localStorage.setItem("phish-theme", next);
  });

  // Language switch
  document.querySelectorAll(".lang-btn").forEach(b => {
    b.addEventListener("click", () => {
      const lang = b.getAttribute("data-lang");
      const params = new URLSearchParams(window.location.search);
      params.set("lang", lang);
      window.location.search = params.toString();
    });
  });
});
