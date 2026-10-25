#!/usr/bin/env node

// GitHub Pages serves unknown paths through 404.html, so link crawlers (WeChat, Slack, X)
// see a "Page Not Found" title for SPA routes. For pages that get shared, write a copy of
// the built index.html at <route>/index.html with that page's own title and share meta.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const SITE_URL = 'https://www.jiabinlu.com';

const PAGES = [
  {
    route: 'services',
    title: 'AI 落地与商业咨询 · 沐风 Jiabin Lu',
    description:
      '面向小老板和小团队的 AI 落地与商业咨询：判断 AI 该不该做、从哪个环节切进去、怎么做才不白花钱。前 Amazon、Apple 工程师，现做 Amplitude GTM 的 AI 转型。',
    image: `${SITE_URL}/profile.jpg`,
  },
];

const escapeAttr = (text) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function setMeta(html, attr, key, value) {
  const pattern = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  if (!pattern.test(html)) throw new Error(`meta ${attr}="${key}" not found in index.html`);
  return html.replace(pattern, `$1${escapeAttr(value)}$2`);
}

const base = fs.readFileSync(path.join(DOCS_DIR, 'index.html'), 'utf8');

for (const page of PAGES) {
  const url = `${SITE_URL}/${page.route}`;
  let html = base.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(page.title)}</title>`);
  html = setMeta(html, 'name', 'title', page.title);
  html = setMeta(html, 'name', 'description', page.description);
  for (const prefix of ['og', 'twitter']) {
    html = setMeta(html, 'property', `${prefix}:url`, url);
    html = setMeta(html, 'property', `${prefix}:title`, page.title);
    html = setMeta(html, 'property', `${prefix}:description`, page.description);
    html = setMeta(html, 'property', `${prefix}:image`, page.image);
  }

  const outDir = path.join(DOCS_DIR, page.route);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log(`✅ Page shell: /${page.route}/index.html`);
}
