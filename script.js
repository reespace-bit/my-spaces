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

// ===== 2. PARSE FRONTMATTER MARKDOWN =====
function parseFrontmatter(markdown) {
  const lines = markdown.split("\n");
  const data = {};
  let inFrontmatter = false;
  let contentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "---") {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        contentStart = i + 1;
        break;
      }
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

  return {
    ...data,
    isi: lines.slice(contentStart).join("\n").trim(),
  };
}

// ===== 3. LOAD SEMUA ARTIKEL =====
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
          kategori: parsed.kategori || "Journal",
          tanggal: parsed.tanggal || "2026-01-01",
          isi: parsed.isi || "",
        });
      } catch (err) {
        console.warn("Gagal baca file:", filename, err);
      }
    }

    return articles.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  } catch (err) {
    console.warn("Gagal load artikel/index.json:", err);
    return [];
  }
}

// ===== 4. TAMPILKAN ARTIKEL DI HOME =====
async function renderHomeArticles() {
  const container = document.getElementById("home-articles");
  if (!container) return;
  const articles = await loadArticles();
  const latest = articles.slice(0, 3);

  if (latest.length === 0) {
    container.innerHTML =
      '<p style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--muted)">Belum ada artikel.</p>';
    return;
  }

  container.innerHTML = latest.map(cardHTML).join("");
}

// ===== 5. TAMPILKAN SEMUA ARTIKEL + FILTER =====
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

  const list =
    kategori === "Semua"
      ? allArticles
      : allArticles.filter((a) => a.kategori === kategori);

  if (list.length === 0) {
    container.innerHTML =
      '<p style="text-align:center;padding:60px 0;color:var(--muted)">Belum ada tulisan di kategori ini.</p>';
    return;
  }
  container.innerHTML = list.map(cardHTML).join("");
}

function renderFilterButtons() {
  const box = document.getElementById("filter-box");
  if (!box) return;

  const kategori = ["Semua", ...new Set(allArticles.map((a) => a.kategori))];

  box.innerHTML = kategori
    .map(
      (k, i) =>
        `<button class="${i === 0 ? "active" : ""}" data-kat="${k}">${k}</button>`
    )
    .join("");

  box.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      box.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderFiltered(btn.dataset.kat);
    });
  });
}

// ===== 6. HTML KARTU ARTIKEL =====
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

// ===== 7. HALAMAN BACA ARTIKEL =====
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
    day: "numeric",
    month: "long",
    year: "numeric",
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

// ===== 8. FORM KONTAK =====
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("success-msg");
    if (msg) msg.style.display = "block";
    form.reset();
    setTimeout(() => {
      if (msg) msg.style.display = "none";
    }, 5000);
  });
}

// ===== JALANKAN SEMUA =====
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  document.querySelector(".theme-btn")?.addEventListener("click", toggleTheme);
  renderHomeArticles();
  renderAllArticles();
  renderArticleDetail();
  initContactForm();
});
