// AI 实干派 — static frontend. Reads data/index.json, data/issues/<date>.json
// and data/categories/<id>.json. Routes (hash-based so any static host works):
//   #/            all days, newest first
//   #/d/<date>    one day's issue
//   #/c/          category overview
//   #/c/<id>      every item in one category

const app = document.getElementById("app");
const catBar = document.getElementById("cat-bar");
const tabs = document.getElementById("tabs");

const cache = new Map();
async function getJson(path) {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(path, { cache: "no-cache" }).then((r) => {
        if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
        return r.json();
      }),
    );
  }
  return cache.get(path);
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Minimal Markdown: paragraphs, **bold**, [text](http-url). Input is escaped first.
function md(text) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((para) => {
      let h = esc(para.trim());
      h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`);
      h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      return h ? `<p>${h.replace(/\n/g, "<br>")}</p>` : "";
    })
    .join("");
}

function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = "日一二三四五六"[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y} 年 ${m} 月 ${d} 日 · 周${wd}`;
}

const pad3 = (n) => String(n).padStart(3, "0");

let index;
let catById = {};

function tag(catId) {
  const c = catById[catId];
  return `<span class="tag" data-cat="${esc(catId)}">${esc(c ? c.name : catId)}</span>`;
}

function renderCatBar(activeId) {
  catBar.innerHTML = index.categories
    .map(
      (c) => `<a class="cat-chip${c.id === activeId ? " active" : ""}" data-cat="${c.id}" href="#/c/${c.id}">
        <span class="dot"></span>${esc(c.name)}<span class="count">${c.count}</span></a>`,
    )
    .join("");
}

function setTab(view) {
  for (const a of tabs.querySelectorAll("a")) a.classList.toggle("active", a.dataset.view === view);
}

// AI 认知 items are opinions, so the same five fields carry different meanings.
const FACT_LABELS = {
  default: ["谁·场景", "怎么用", "结果", "你可以试", "注意"],
  perspective: ["谁说的", "核心观点", "依据", "对你的意义", "争议·条件"],
};

function itemFacts(it) {
  const labels = FACT_LABELS[it.category] || FACT_LABELS.default;
  const rows = [it.who, it.how, it.result, it.tryThis, it.caveat]
    .map((v, i) => [labels[i], v])
    .filter(([, v]) => v);
  return `<dl class="facts">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
}

function sourcesLine(it) {
  if (!it.sources?.length) return "";
  return `<div class="sources">原文：${it.sources
    .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">${esc(s.label)}</a>`)
    .join("")}</div>`;
}

function itemMeta(it) {
  const parts = [tag(it.category), esc(it.kind), it.eventDate ? esc(it.eventDate) : "", it.region ? esc(it.region) : ""];
  return `<div class="item-meta">${parts.filter(Boolean).join("<span>·</span>")}</div>`;
}

// ---- Views ---------------------------------------------------------------

function viewDays() {
  setTab("days");
  renderCatBar(null);
  if (!index.days.length) {
    app.innerHTML = `<p class="empty">还没有内容。第一期会在下一次定时任务运行后出现。</p>`;
    return;
  }
  app.innerHTML = `
    <div class="page-head">
      <h1>每日精选</h1>
      <p>用 AI 提效、做成商业闭环、拿到收入的人，每天几条一手材料。</p>
    </div>
    <div class="day-list">
      ${index.days
        .map(
          (d) => `<a class="day-card" href="#/d/${d.date}">
            <div class="eyebrow">${pad3(d.number)} · ${fmtDate(d.date)} · 约 ${d.readingMinutes} 分钟${d.sample ? '<span class="badge-sample">样刊</span>' : ""}</div>
            <h2>${esc(d.title)}</h2>
            <ul>${d.headlines.map((h) => `<li>${tag(h.category)}<span>${esc(h.headline)}</span></li>`).join("")}</ul>
          </a>`,
        )
        .join("")}
    </div>`;
}

async function viewDay(date) {
  setTab("days");
  renderCatBar(null);
  const pos = index.days.findIndex((d) => d.date === date);
  if (pos === -1) {
    app.innerHTML = `<p class="empty">没有 ${esc(date)} 这一期。<a href="#/">回到列表</a></p>`;
    return;
  }
  const issue = await getJson(`data/issues/${date}.json`);
  const day = index.days[pos];
  const newer = index.days[pos - 1];
  const older = index.days[pos + 1];

  app.innerHTML = `
    <article>
      <header class="issue-head">
        <div class="eyebrow">AI 实干派 ${pad3(day.number)} · ${fmtDate(issue.date)} · 约 ${day.readingMinutes} 分钟读完${issue.sample ? '<span class="badge-sample">样刊</span>' : ""}</div>
        <h1>${esc(issue.title)}</h1>
      </header>
      <section class="tldr">
        <h2>30 秒速读</h2>
        <ul>${issue.items
          .map((it, i) => {
            // tldr is written in item order; trust it only when it lines up.
            const t = issue.tldr?.length === issue.items.length ? issue.tldr[i] : null;
            const line = it.oneLiner || (t && t.category === it.category ? t.text : it.headline);
            return `<li>${tag(it.category)}<a href="#/d/${date}/${it.id}">${esc(line)}</a></li>`;
          })
          .join("")}</ul>
      </section>
      ${issue.items
        .map(
          (it, i) => `<section class="item" id="${esc(it.id)}">
            ${itemMeta(it)}
            <h3>${String(i + 1).padStart(2, "0")}｜${esc(it.headline)}</h3>
            <details class="facts-wrap" open><summary>要点</summary>${itemFacts(it)}</details>
            <div class="body">${md(it.body)}</div>
            ${sourcesLine(it)}
          </section>`,
        )
        .join("")}
      ${issue.action ? `<section class="action"><h2>今天可以做的一件事</h2><p>${esc(issue.action)}</p></section>` : ""}
      <nav class="pager">
        <span>${older ? `<a href="#/d/${older.date}">← ${fmtDate(older.date)}</a>` : ""}</span>
        <span>${newer ? `<a href="#/d/${newer.date}">${fmtDate(newer.date)} →</a>` : ""}</span>
      </nav>
    </article>`;
}

function viewCategories() {
  setTab("cats");
  renderCatBar(null);
  app.innerHTML = `
    <div class="page-head">
      <h1>按栏目</h1>
      <p>同一类做法放在一起看，更容易比较条件和结果。</p>
    </div>
    <div class="cat-grid">
      ${index.categories
        .map(
          (c) => `<a class="cat-card" data-cat="${c.id}" href="#/c/${c.id}">
            <h2>${esc(c.name)}</h2><div class="en">${esc(c.en)}</div>
            <p>${esc(c.desc)}</p><div class="n">${c.count} 条</div>
          </a>`,
        )
        .join("")}
    </div>`;
}

async function viewCategory(id) {
  setTab("cats");
  renderCatBar(id);
  const c = catById[id];
  if (!c) {
    app.innerHTML = `<p class="empty">没有这个栏目。<a href="#/c/">查看全部栏目</a></p>`;
    return;
  }
  const data = await getJson(`data/categories/${id}.json`);
  app.innerHTML = `
    <div class="page-head cat-head" data-cat="${id}">
      <div class="eyebrow">${esc(c.en)}</div>
      <h1>${esc(c.name)}</h1>
      <p>${esc(c.desc)}</p>
    </div>
    ${
      data.items.length
        ? `<div class="cat-items">${data.items
            .map(
              (it) => `<article class="cat-item">
                <div class="item-meta"><a href="#/d/${it.issueDate}/${it.id}">${pad3(it.issueNumber)} · ${esc(it.issueDate)}</a><span>·</span>${esc(it.kind)}</div>
                <h3>${esc(it.headline)}</h3>
                <p class="summary">${esc(it.result || it.who)}</p>
                <details><summary>展开全文</summary>${itemFacts(it)}<div class="body">${md(it.body)}</div>${sourcesLine(it)}</details>
              </article>`,
            )
            .join("")}</div>`
        : `<p class="empty">这个栏目还没有内容。</p>`
    }`;
}

// ---- Router --------------------------------------------------------------

async function route() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  try {
    if (parts[0] === "d" && parts[1]) {
      await viewDay(parts[1]);
      const target = parts[2] && document.getElementById(parts[2]);
      if (target) target.scrollIntoView();
      else window.scrollTo(0, 0);
      return;
    }
    if (parts[0] === "c") await (parts[1] ? viewCategory(parts[1]) : viewCategories());
    else viewDays();
    window.scrollTo(0, 0);
  } catch (err) {
    app.innerHTML = `<p class="empty">加载失败：${esc(err.message)}</p>`;
  }
}

async function init() {
  try {
    index = await getJson("data/index.json");
  } catch (err) {
    app.innerHTML = `<p class="empty">加载失败：${esc(err.message)}</p>`;
    return;
  }
  catById = Object.fromEntries(index.categories.map((c) => [c.id, c]));
  window.addEventListener("hashchange", route);
  route();
}

init();
