ScriptProcessorNode.json
// ===== 1. DARK MODE =====
function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") document.body.classList.add("dark");
  updateThemeIcon();
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.querySelector(".theme-btn");
  if (!btn) return;
  btn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
}

// ===== 2. LOAD ARTIKEL DARI JSON =====
async function loadArticles() {
  const res = await fetch("artikel.json");
  return await res.json();
}

// ===== 3. TAMPILKAN ARTIKEL DI HOME (3 terbaru) =====
async function renderHomeArticles() {
  const container = document.getElementById("home-articles");
  if (!container) return;
  const articles = await loadArticles();
  const latest = articles.slice(0, 3);
  container.innerHTML = latest.map(cardHTML).join("");
}

// ===== 4. TAMPILKAN SEMUA ARTIKEL + FILTER =====
let allArticles = [];

async function renderAllArticles() {
  const container = document.getElementById("all-articles");
  if (!container) return;
  allArticles = await loadArticles();
  renderFiltered("Semua");
  renderFilterButtons();
}

function renderFiltered(kategori) {
  const container = document.getElementById("all-articles");
  const list = kategori === "Semua"
    ? allArticles
    : allArticles.filter(a => a.kategori === kategori);

  if (list.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:60px 0;color:var(--muted)">Belum ada tulisan di kategori ini.</p>';
    return;
  }
  container.innerHTML = list.map(cardHTML).join("");
}

function renderFilterButtons() {
  const box = document.getElementById("filter-box");
  if (!box) return;
  const kategori = ["Semua", ...new Set(allArticles.map(a => a.kategori))];
  box.innerHTML = kategori.map((k, i) =>
    `<button class="${i === 0 ? "active" : ""}" data-kat="${k}">${k}</button>`
  ).join("");

  box.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      box.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderFiltered(btn.dataset.kat);
    });
  });
}

// ===== 5. HTML UNTUK SATU KARTU ARTIKEL =====
function cardHTML(a) {
  return `
    <a class="card" href="baca.html?slug=${a.slug}">
      <div class="card-top">${a.kategori.toUpperCase()}</div>
      <div class="card-body">
        <h3>${a.judul}</h3>
        <p>${a.ringkasan}</p>
        <span class="read">Read more →</span>
      </div>
    </a>
  `;
}

// ===== 6. HALAMAN BACA ARTIKEL =====
async function renderArticleDetail() {
  const container = document.getElementById("article-detail");
  if (!container) return;

  const slug = new URLSearchParams(window.location.search).get("slug");
  const articles = await loadArticles();
  const article = articles.find(a => a.slug === slug);

  if (!article) {
    container.innerHTML = "<p>Artikel tidak ditemukan.</p>";
    return;
  }

  const tanggal = new Date(article.tanggal).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  });

  document.title = article.judul + " — My Spaces";

  container.innerHTML = `
    <a class="back" href="artikel.html">← Kembali ke semua artikel</a>
    <div style="margin-top:24px">
      <div class="kicker">${article.kategori}</div>
      <h1>${article.judul}</h1>
      <div class="meta">${tanggal}</div>
    </div>
    <div class="article-content">${article.isi}</div>
  `;
}

// ===== 7. FORM KONTAK =====
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById("success-msg").style.display = "block";
    form.reset();
    setTimeout(() => {
      document.getElementById("success-msg").style.display = "none";
    }, 5000);
  });
}

// ===== JALANKAN SEMUA SAAT HALAMAN DIBUKA =====
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  document.querySelector(".theme-btn")?.addEventListener("click", toggleTheme);
  renderHomeArticles();
  renderAllArticles();
  renderArticleDetail();
  initContactForm();
});