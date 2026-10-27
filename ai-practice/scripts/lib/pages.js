// ============================================================================
// Static HTML pages, sitemap and RSS for AI 实干派.
// Rendered at build time so every issue and item has a permalink that search
// engines can index and chat apps can preview. They reuse the site's
// styles.css; the single-page app at /ai-practice/ is unchanged.
// ============================================================================

import {
  SITE_URL, BASE_PATH, BRAND, TAGLINE, DESCRIPTION, DEFAULT_OG_IMAGE,
  issuePath, itemPath, categoryPath, subscribePath, absolute,
  esc, pad3, mdToHtml, factsRows, oneLiners, fmtDateZh,
} from "./render.js";

const BUTTONDOWN_EMBED = "https://buttondown.com/api/emails/embed-subscribe/325louis";
const PODCAST_APPLE_URL = "https://podcasts.apple.com/us/podcast/ai-%E5%AE%9E%E5%B9%B2%E6%B4%BE/id6826900340";
const PODCAST_FEED_PATH = `${BASE_PATH}podcast/feed.xml`;

// Daily audio edition (podcast-feed.js publishes the feed). Shown on the home
// and subscribe pages; the footer form carries a one-line version.
export function podcastCard(location) {
  return `<div class="podcast-card">
  <img src="${BASE_PATH}podcast/cover.jpg" alt="${BRAND} 播客封面" width="72" height="72" loading="lazy">
  <div class="podcast-body">
    <div class="podcast-title">🎧 ${BRAND} 播客版</div>
    <p>每期也有语音版，通勤、做饭时听完。在播客 App 里订阅，每天自动更新。</p>
    <div class="podcast-links">
      <a class="podcast-apple" href="${PODCAST_APPLE_URL}" target="_blank" rel="noopener" data-track-event="CTA Clicked" data-track-cta_id="podcast_apple" data-track-location="${location}">在 Apple 播客订阅</a>
      <a class="podcast-rss" href="${PODCAST_FEED_PATH}" data-track-event="CTA Clicked" data-track-cta_id="podcast_rss" data-track-location="${location}">其他播客 App（RSS）</a>
    </div>
  </div>
</div>`;
}

// Both inputs are named "tag": Buttondown applies every submitted tag, so a
// subscriber gets ai-practice plus their chosen frequency.
export function subscribeForm() {
  return `<form class="subscribe" action="${BUTTONDOWN_EMBED}" method="post" target="_blank">
  <div class="subscribe-title">订阅 ${BRAND}</div>
  <input type="hidden" name="embed" value="1">
  <input type="hidden" name="tag" value="ai-practice">
  <div class="subscribe-row">
    <input type="email" name="email" placeholder="你的邮箱" required aria-label="邮箱">
    <button type="submit">订阅</button>
  </div>
  <div class="subscribe-freq">
    <label><input type="radio" name="tag" value="ai-practice-daily" checked> 每天一期</label>
    <label><input type="radio" name="tag" value="ai-practice-weekly"> 每周精选</label>
  </div>
  <p class="subscribe-note">邮件由 Buttondown 发送，可随时退订。订阅后也会收到卢佳斌博客的新文章通知。</p>
  <p class="subscribe-note">也可以听：<a href="${PODCAST_APPLE_URL}" target="_blank" rel="noopener" data-track-event="CTA Clicked" data-track-cta_id="podcast_apple" data-track-location="subscribe_form">Apple 播客</a> · <a href="${PODCAST_FEED_PATH}" data-track-event="CTA Clicked" data-track-cta_id="podcast_rss" data-track-location="subscribe_form">播客 RSS</a></p>
</form>`;
}

// Link previews cut off around 100-150 characters; end on a sentence when possible.
function metaDescription(text, max = 120) {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const stop = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("；"));
  return stop > 40 ? cut.slice(0, stop + 1) : `${cut}…`;
}

function shell({ title, description: fullDescription, path, image = DEFAULT_OG_IMAGE, type = "article", body, categories, activeCat = null, footerForm = true, activeTab = null, headExtra = "" }) {
  const url = absolute(path);
  const description = metaDescription(fullDescription);
  const catBar = categories
    .map(
      (c) => `<a class="cat-chip${c.id === activeCat ? " active" : ""}" data-cat="${c.id}" href="${categoryPath(c.id)}"><span class="dot"></span>${esc(c.name)}<span class="count">${c.count}</span></a>`,
    )
    .join("");
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:site_name" content="${BRAND}">
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${absolute(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="zh_CN">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${absolute(image)}">
  <link rel="icon" href="${BASE_PATH}logo.svg" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" title="${BRAND}" href="${BASE_PATH}feed.xml">
  <link rel="stylesheet" href="${BASE_PATH}styles.css">
  <script src="/vendor/amplitude-min.js" defer></script>
  <script src="/analytics.js" defer></script>
${headExtra}</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <a class="site-brand" href="/">Jiabin Lu</a>
      <nav class="site-nav" aria-label="站点">
        <a href="/blog">博客</a>
        <a href="${BASE_PATH}" class="active">AI 实干派</a>
        <a href="/decks/">演讲</a>
        <a href="/services">咨询</a>
        <a href="/products">产品</a>
      </nav>
    </div>
  </header>
  <div class="section-bar">
    <div class="wrap header-inner">
      <a class="brand" href="${BASE_PATH}">
        <img class="brand-mark" src="${BASE_PATH}logo.svg" alt="" width="34" height="34">
        <span>
          <span class="brand-name">${BRAND}</span>
          <span class="brand-tag">${TAGLINE}</span>
        </span>
      </a>
      <nav class="tabs" aria-label="视图">
        <a href="${BASE_PATH}"${activeTab === "days" ? ' class="active"' : ""}>按日期</a>
        <a href="${BASE_PATH}c/"${activeTab === "cats" ? ' class="active"' : ""}>按栏目</a>
      </nav>
    </div>
    <div class="wrap"><nav class="cat-bar" aria-label="栏目">${catBar}</nav></div>
  </div>
  <main class="wrap">
${body}
  </main>
  <footer class="wrap site-footer">
    ${footerForm ? subscribeForm() : ""}
    <p>每天从全球一手来源中挑选，由 Claude 按编辑规则成稿。收入和效果按本人披露的口径呈现，不等于审计；每条都附原文链接。<a href="/">卢佳斌</a> 编辑 · <a href="${BASE_PATH}feed.xml" data-track-event="CTA Clicked" data-track-cta_id="rss" data-track-location="footer">RSS</a></p>
  </footer>
</body>
</html>
`;
}

function tag(catById, id) {
  return `<span class="tag" data-cat="${esc(id)}">${esc(catById[id]?.name || id)}</span>`;
}

function itemMeta(catById, it) {
  const parts = [tag(catById, it.category), esc(it.kind), it.eventDate ? esc(it.eventDate) : "", it.region ? esc(it.region) : ""];
  return `<div class="item-meta">${parts.filter(Boolean).join("<span>·</span>")}</div>`;
}

function facts(it) {
  return `<dl class="facts">${factsRows(it).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
}

function sources(it) {
  if (!it.sources?.length) return "";
  return `<div class="sources">原文：${it.sources
    .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">${esc(s.label)}</a>`)
    .join("")}</div>`;
}

export function editorNoteBlock(issue) {
  if (!issue.editorNote) return "";
  return `<section class="editor-note"><h2>编辑按</h2>${mdToHtml(issue.editorNote)}</section>`;
}

export function renderIssuePage({ issue, day, newer, older, catById, categories, image }) {
  const lines = oneLiners(issue);
  const body = `    <article>
      <header class="issue-head">
        <div class="eyebrow">${BRAND} ${pad3(day.number)} · ${fmtDateZh(issue.date)} · 约 ${day.readingMinutes} 分钟读完${issue.sample ? '<span class="badge-sample">样刊</span>' : ""}</div>
        <h1>${esc(issue.title)}</h1>
      </header>
      ${editorNoteBlock(issue)}
      <section class="tldr">
        <h2>30 秒速读</h2>
        <ul>${issue.items.map((it, i) => `<li>${tag(catById, it.category)}<a href="#${esc(it.id)}">${esc(lines[i])}</a></li>`).join("")}</ul>
      </section>
      ${issue.items
        .map(
          (it, i) => `<section class="item" id="${esc(it.id)}">
        ${itemMeta(catById, it)}
        <h3><a class="permalink" href="${itemPath(it.id)}">${String(i + 1).padStart(2, "0")}｜${esc(it.headline)}</a></h3>
        ${facts(it)}
        <div class="body">${mdToHtml(it.body)}</div>
        ${sources(it)}
      </section>`,
        )
        .join("\n      ")}
      ${issue.action ? `<section class="action"><h2>今天可以做的一件事</h2><p>${esc(issue.action)}</p></section>` : ""}
      <nav class="pager">
        <span>${older ? `<a href="${issuePath(older.date)}">← ${fmtDateZh(older.date)}</a>` : ""}</span>
        <span>${newer ? `<a href="${issuePath(newer.date)}">${fmtDateZh(newer.date)} →</a>` : ""}</span>
      </nav>
    </article>`;
  return shell({
    title: `${BRAND} ${pad3(day.number)}｜${issue.title}`,
    description: lines.join(" "),
    path: issuePath(issue.date),
    image,
    body,
    categories,
    activeTab: "days",
  });
}

export function renderItemPage({ issue, day, item, catById, categories, image }) {
  const line = oneLiners(issue)[issue.items.indexOf(item)];
  const body = `    <article>
      <div class="eyebrow"><a href="${issuePath(issue.date)}">${BRAND} ${pad3(day.number)} · ${fmtDateZh(issue.date)}</a></div>
      <section class="item item-single">
        ${itemMeta(catById, item)}
        <h1>${esc(item.headline)}</h1>
        <p class="summary">${esc(line)}</p>
        ${facts(item)}
        <div class="body">${mdToHtml(item.body)}</div>
        ${sources(item)}
      </section>
      <nav class="pager">
        <span><a href="${issuePath(issue.date)}">← 当期全部 ${issue.items.length} 条</a></span>
        <span><a href="${categoryPath(item.category)}">更多「${esc(catById[item.category]?.name || "")}」→</a></span>
      </nav>
    </article>`;
  return shell({
    title: `${item.headline}｜${BRAND}`,
    description: line,
    path: itemPath(item.id),
    image,
    body,
    categories,
    activeCat: item.category,
  });
}

export function renderCategoryPage({ category, items, catById, categories }) {
  const body = `    <div class="page-head cat-head" data-cat="${category.id}">
      <div class="eyebrow">${esc(category.en)}</div>
      <h1>${esc(category.name)}</h1>
      <p>${esc(category.desc)}</p>
    </div>
    ${
      items.length
        ? `<div class="cat-items">${items
            .map(
              (it) => `<article class="cat-item">
        <div class="item-meta"><a href="${issuePath(it.issueDate)}">${pad3(it.issueNumber)} · ${esc(it.issueDate)}</a><span>·</span>${esc(it.kind)}</div>
        <h3><a class="permalink" href="${itemPath(it.id)}">${esc(it.headline)}</a></h3>
        <p class="summary">${esc(it.oneLiner || it.result || it.who)}</p>
      </article>`,
            )
            .join("")}</div>`
        : `<p class="empty">这个栏目还没有内容。</p>`
    }`;
  return shell({
    title: `${category.name}｜${BRAND}`,
    description: `${category.name}：${category.desc}`,
    path: categoryPath(category.id),
    type: "website",
    body,
    categories,
    activeCat: category.id,
    activeTab: "cats",
  });
}

// Links from before 2026-10-12 used hash routes (#/d/<date>/<item>, #/c/<id>).
// Send them to the static permalinks before anything renders.
const LEGACY_HASH_REDIRECT = `<script>
(function () {
  var h = location.hash, m;
  if ((m = h.match(/^#\\/d\\/(\\d{4}-\\d{2}-\\d{2})(?:\\/([\\w-]+))?/))) location.replace("${BASE_PATH}d/" + m[1] + "/" + (m[2] ? "#" + m[2] : ""));
  else if ((m = h.match(/^#\\/c\\/([\\w-]+)/))) location.replace("${BASE_PATH}c/" + m[1] + "/");
  else if (h.indexOf("#/c") === 0) location.replace("${BASE_PATH}c/");
})();
</script>
`;

export function renderHomePage({ days, categories, catById }) {
  const cards = days
    .map(
      (d) => `<a class="day-card" href="${issuePath(d.date)}">
        <div class="eyebrow">${pad3(d.number)} · ${fmtDateZh(d.date)} · 约 ${d.readingMinutes} 分钟${d.sample ? '<span class="badge-sample">样刊</span>' : ""}</div>
        <h2>${esc(d.title)}</h2>
        <ul>${d.headlines.map((h) => `<li>${tag(catById, h.category)}<span>${esc(h.headline)}</span></li>`).join("")}</ul>
      </a>`,
    )
    .join("\n      ");
  const body = `    <div class="page-head">
      <h1>每日精选</h1>
      <p>用 AI 提效、做成商业闭环、拿到收入的人，每天几条一手材料。</p>
    </div>
    ${podcastCard("home")}
    ${days.length ? `<div class="day-list">\n      ${cards}\n    </div>` : `<p class="empty">还没有内容。第一期会在下一次定时任务运行后出现。</p>`}`;
  return shell({
    title: `${BRAND} · ${TAGLINE}`,
    description: DESCRIPTION,
    path: BASE_PATH,
    type: "website",
    body,
    categories,
    activeTab: "days",
    headExtra: LEGACY_HASH_REDIRECT,
  });
}

export function renderCategoriesIndex({ categories }) {
  const body = `    <div class="page-head">
      <h1>按栏目</h1>
      <p>同一类做法放在一起看，更容易比较条件和结果。</p>
    </div>
    <div class="cat-grid">
      ${categories
        .map(
          (c) => `<a class="cat-card" data-cat="${c.id}" href="${categoryPath(c.id)}">
        <h2>${esc(c.name)}</h2><div class="en">${esc(c.en)}</div>
        <p>${esc(c.desc)}</p><div class="n">${c.count} 条</div>
      </a>`,
        )
        .join("\n      ")}
    </div>`;
  return shell({ title: `按栏目｜${BRAND}`, description: categories.map((c) => c.name).join("、"), path: `${BASE_PATH}c/`, type: "website", body, categories, activeTab: "cats" });
}

export function renderSubscribePage({ categories }) {
  const body = `    <div class="page-head">
      <h1>订阅 ${BRAND}</h1>
      <p>${DESCRIPTION}</p>
    </div>
    ${subscribeForm()}
    ${podcastCard("subscribe_page")}
    <p>选「每天一期」，每天北京时间早上 6 点收到当期要点，几分钟看完，全文在网站上；选「每周精选」，每周日收到一周的要点和链接。</p>`;
  return shell({ title: `订阅｜${BRAND}`, description: DESCRIPTION, path: subscribePath(), type: "website", body, categories, footerForm: false });
}

export function renderSitemap(entries) {
  const urls = entries
    .map((e) => `  <url><loc>${absolute(e.path)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderRss({ issues, days, catById }) {
  const items = issues
    .map((issue) => {
      const day = days.find((d) => d.date === issue.date);
      const lines = oneLiners(issue);
      const content =
        editorNoteBlock(issue) +
        issue.items
          .map(
            (it, i) =>
              `<h3><a href="${absolute(itemPath(it.id))}">${esc(it.headline)}</a></h3><p><em>${esc(catById[it.category]?.name || "")} · ${esc(it.kind)}</em></p><p>${esc(lines[i])}</p>${mdToHtml(it.body)}`,
          )
          .join("") +
        (issue.action ? `<h3>今天可以做的一件事</h3><p>${esc(issue.action)}</p>` : "");
      const pub = issue.meta?.generatedAt ? new Date(issue.meta.generatedAt) : new Date(`${issue.date}T14:30:00Z`);
      return `    <item>
      <title>${esc(`${BRAND} ${pad3(day?.number || 0)}｜${issue.title}`)}</title>
      <link>${absolute(issuePath(issue.date))}</link>
      <guid isPermaLink="true">${absolute(issuePath(issue.date))}</guid>
      <pubDate>${pub.toUTCString()}</pubDate>
      <description>${esc(lines.join(" "))}</description>
      <content:encoded><![CDATA[${content.replace(/]]>/g, "]]&gt;")}]]></content:encoded>
    </item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${BRAND}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}feed.xml" rel="self" type="application/rss+xml"/>
    <description>${esc(DESCRIPTION)}</description>
    <language>zh-cn</language>
${items}
  </channel>
</rss>
`;
}
