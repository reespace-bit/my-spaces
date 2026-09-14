// ===== 1. TEMA =====
const THEMES = [
  { id: "default",  label: "🌸 Pink Classic",  color: "#9e4968" },
  { id: "anime",    label: "🎀 Anime Pink",    color: "#ff69b4" },
  { id: "sakura",   label: "🌸 Sakura",        color: "#d881b5" },
  { id: "ocean",    label: "🌊 Ocean",         color: "#00b4d8" },
  { id: "dragon",   label: "🐉 Dragon",        color: "#e63946" },
  { id: "night",    label: "🌙 Night",         color: "#b47dff" },
  { id: "lavender", label: "💜 Lavender",      color: "#7e57c2" },
  { id: "sage",     label: "🌿 Sage",          color: "#4a7c59" },
];

function initTheme() {
  const saved = localStorage.getItem("colorTheme") || "default";
  applyTheme(saved);
  const savedDark = localStorage.getItem("darkMode");
  if (savedDark === "true") document.body.classList.add("dark");
  updateThemeIcon();
}

function applyTheme(themeId) {
  document.body.classList.forEach((cls) => {
    if (cls.startsWith("theme-")) document.body.classList.remove(cls);
  });
  if (themeId !== "default") document.body.classList.add("theme-" + themeId);
  localStorage.setItem("colorTheme", themeId);
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", isDark);
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.querySelector(".theme-btn");
  if (!btn) return;
  btn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
}

// ===== 2. PARSE FRONTMATTER =====
function parseFrontmatter(markdown) {
  const lines = markdown.split("\n");
  const data = {};
  let inFrontmatter = false;
  let contentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "---") {
      if (!inFrontmatter) inFrontmatter = true;
      else { contentStart = i + 1; break; }
    } else if (inFrontmatter) {
      const idx = line.indexOf(":");
      if (idx > -1) {
        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();
        value = value.replace(/^["']|["']$/g, "");
        data[key] = value;
      }
    }
  }

  return { ...data, isi: lines.slice(contentStart).join("\n").trim() };
}

// ===== 3. LOAD ARTIKEL =====
async function loadArticles() {
  try {
    const listRes = await fetch("artikel/index.json");
    const fileList = await listRes.json();

    const articles = [];
    for (const filename of fileList) {
      try {
        const res = await fetch(`artikel/${filename}`);
        const rawMd = await res.text();
        const parsed = parseFrontmatter(rawMd);

        articles.push({
          slug: filename.replace(".md", ""),
          judul: parsed.judul || "Tanpa Judul",
          ringkasan: parsed.ringkasan || "",
          cover: parsed.cover || "",
          kategori: parsed.kategori || "Journal",
          tanggal: parsed.tanggal || "2026-01-01",
          isi: parsed.isi || "",
        });
      } catch (err) { console.warn("Gagal baca:", filename, err); }
    }

    return articles.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  } catch (err) {
    console.warn("Gagal load index.json:", err);
    return [];
  }
}

// ===== 4. HOME ARTIKEL =====
async function renderHomeArticles() {
  const container = document.getElementById("home-articles");
  if (!container) return;
  const articles = await loadArticles();
  const latest = articles.slice(0, 3);

  if (latest.length === 0) {
    container.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--muted)">Belum ada artikel.</p>';
    return;
  }
  container.innerHTML = latest.map(cardHTML).join("");
}

// ===== 5. SEMUA ARTIKEL =====
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
  if (!container) return;

  const list = kategori === "Semua"
    ? allArticles
    : allArticles.filter((a) => a.kategori === kategori);

  if (list.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:60px 0;color:var(--muted)">Belum ada tulisan di kategori ini.</p>';
    return;
  }
  container.innerHTML = list.map(cardHTML).join("");
}

function renderFilterButtons() {
  const box = document.getElementById("filter-box");
  if (!box) return;

  const kategori = ["Semua", ...new Set(allArticles.map((a) => a.kategori))];
  box.innerHTML = kategori.map((k, i) =>
    `<button class="${i === 0 ? "active" : ""}" data-kat="${k}">${k}</button>`
  ).join("");

  box.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      box.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderFiltered(btn.dataset.kat);
    });
  });
}

// ===== 6. KARTU =====
function cardHTML(a) {
  const coverHTML = a.cover
    ? `<div class="card-cover" style="background-image:url('${a.cover}');background-size:cover;background-position:center;"></div>`
    : `<div class="card-top">${a.kategori.toUpperCase()}</div>`;

  return `
    <a class="card" href="baca.html?slug=${a.slug}">
      ${coverHTML}
      <div class="card-body">
        <h3>${a.judul}</h3>
        <p>${a.ringkasan}</p>
        <span class="read">Read more →</span>
      </div>
    </a>
  `;
}

// ===== 7. TOMBOL SHARE =====
function shareHTML(article) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(article.judul);

  return `
    <div class="share-section">
      <div class="share-title">Bagikan artikel ini</div>
      <div class="share-buttons">
        <a class="share-btn whatsapp" 
           href="https://wa.me/?text=${title}%20${url}" 
           target="_blank" rel="noopener" aria-label="Share ke WhatsApp">
          📱 WhatsApp
        </a>
        <a class="share-btn twitter" 
           href="https://twitter.com/intent/tweet?text=${title}&url=${url}" 
           target="_blank" rel="noopener" aria-label="Share ke Twitter">
          🐦 Twitter
        </a>
        <a class="share-btn facebook" 
           href="https://www.facebook.com/sharer/sharer.php?u=${url}" 
           target="_blank" rel="noopener" aria-label="Share ke Facebook">
          📘 Facebook
        </a>
        <a class="share-btn linkedin" 
           href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" 
           target="_blank" rel="noopener" aria-label="Share ke LinkedIn">
          💼 LinkedIn
        </a>
        <button class="share-btn copy" onclick="copyLink(this)" aria-label="Copy link">
          📋 Copy Link
        </button>
      </div>
    </div>
  `;
}

function copyLink(btn) {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const original = btn.textContent;
    btn.textContent = "✅ Tersalin!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove("copied");
    }, 2000);
  }).catch(() => {
    alert("Gagal copy link. Coba manual ya.");
  });
}

// ===== 8. HALAMAN BACA =====
async function renderArticleDetail() {
  const container = document.getElementById("article-detail");
  if (!container) return;

  const slug = new URLSearchParams(window.location.search).get("slug");
  const articles = await loadArticles();
  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    container.innerHTML = "<p>Artikel tidak ditemukan.</p>";
    return;
  }

  const tanggal = new Date(article.tanggal).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });

  document.title = article.judul + " — My Spaces";

  const isiHTML = typeof marked !== "undefined"
    ? marked.parse(article.isi)
    : article.isi;

  const coverHTML = article.cover
    ? `<img src="${article.cover}" alt="${article.judul}" style="width:100%;border-radius:20px;margin-bottom:30px" />`
    : "";

  container.innerHTML = `
    <a class="back" href="artikel.html">← Kembali ke semua artikel</a>
    <div style="margin-top:24px">
      <div class="kicker">${article.kategori}</div>
      <h1>${article.judul}</h1>
      <div class="meta">${tanggal}</div>
    </div>
    ${coverHTML}
    <div class="article-content">${isiHTML}</div>
    ${shareHTML(article)}
  `;
}

// ===== 9. FORM KONTAK =====
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("success-msg");
    if (msg) msg.style.display = "block";
    form.reset();
    setTimeout(() => { if (msg) msg.style.display = "none"; }, 5000);
  });
}

// ===== 10. TOMBOL TEMA =====
function initThemePicker() {
  const btn = document.getElementById("theme-picker-btn");
  const menu = document.getElementById("theme-menu");
  if (!btn || !menu) return;

  menu.innerHTML = `
    <div class="theme-menu-title">Pilih Tema</div>
    ${THEMES.map(t => `
      <button class="theme-option" data-theme="${t.id}">
        <span class="theme-swatch" style="background:${t.color}"></span>
        ${t.label}
      </button>
    `).join("")}
  `;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("show");
  });

  document.addEventListener("click", () => menu.classList.remove("show"));

  menu.querySelectorAll(".theme-option").forEach((opt) => {
    opt.addEventListener("click", () => {
      applyTheme(opt.dataset.theme);
      menu.classList.remove("show");
    });
  });
}

// ===== JALANKAN =====
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initThemePicker();
  document.querySelector(".theme-btn")?.addEventListener("click", toggleDarkMode);
  renderHomeArticles();
  renderAllArticles();
  renderArticleDetail();
  initContactForm();
});
