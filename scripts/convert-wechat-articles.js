#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WECHAT_DIR = process.argv[2] || path.join(process.env.HOME, 'Downloads', 'wechat articles');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'blog-posts');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'wechat');
const SOURCE = '小唐思考人生的公众号';

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});

turndown.addRule('preserveLineBreaks', {
  filter: ['br'],
  replacement: () => '\n',
});

function parseChineseDate(dateStr) {
  // "2017年03月30日 22:55" -> "2017-03-30"
  const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) return new Date().toISOString().split('T')[0];
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function estimateReadTime(text) {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const minutes = Math.max(1, Math.ceil(chineseChars / 400 + englishWords / 200));
  return `${minutes} min read`;
}

function escapeYamlString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ');
}
  return folderName
    .replace(/___+/g, '-')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff\-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractExcerpt(content) {
  const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#') && !l.startsWith('!['));
  const first = lines[0] || '';
  return first.length > 120 ? first.slice(0, 120) + '...' : first;
}

function convertArticle(articleDir) {
  const htmlPath = path.join(articleDir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.warn(`Skipping ${articleDir}: no index.html`);
    return null;
  }

  const folderName = path.basename(articleDir);
  const slug = slugify(folderName);
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(html);

  const title = $('#activity-name .js_title_inner').text().trim()
    || $('.rich_media_title').text().trim()
    || $('title').text().trim();

  const publishTime = $('#publish_time').text().trim();
  const date = parseChineseDate(publishTime);

  const contentEl = $('#js_content');
  if (!contentEl.length) {
    console.warn(`Skipping ${folderName}: no content found`);
    return null;
  }

  // Copy images and rewrite paths
  const articleImagesDir = path.join(IMAGES_DIR, slug);
  fs.mkdirSync(articleImagesDir, { recursive: true });

  contentEl.find('img').each((_, img) => {
    const src = $(img).attr('src') || '';
    if (src.startsWith('./assets/')) {
      const filename = path.basename(src);
      const srcPath = path.join(articleDir, 'assets', filename);
      const destPath = path.join(articleImagesDir, filename);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        $(img).attr('src', `/images/wechat/${slug}/${filename}`);
      }
    } else if (src.startsWith('http')) {
      // Keep remote URLs as-is
      $(img).attr('src', src);
    }
    // Remove WeChat-specific data attributes
    $(img).removeAttr('data-src data-s data-type data-ratio data-w');
  });

  // Clean up empty paragraphs and WeChat-specific elements
  contentEl.find('section, span[style]').each((_, el) => {
    const tag = el.tagName?.toLowerCase();
    if (tag === 'section') {
      $(el).replaceWith($(el).html() || '');
    }
  });

  const htmlContent = contentEl.html() || '';
  let markdown = turndown.turndown(htmlContent);

  // Clean up markdown
  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .replace(/!\[\]\(\)/g, '');

  const readTime = estimateReadTime(markdown);
  const excerpt = extractExcerpt(markdown);

  const frontmatter = [
    '---',
    `title: "${escapeYamlString(title)}"`,
    `date: "${date}"`,
    `readTime: "${readTime}"`,
    `category: "公众号"`,
    `source: "${SOURCE}"`,
    `excerpt: "${escapeYamlString(excerpt)}"`,
    `published: true`,
    '---',
    '',
  ].join('\n');

  const outputPath = path.join(OUTPUT_DIR, `${slug}.md`);
  fs.writeFileSync(outputPath, frontmatter + markdown + '\n', 'utf-8');

  return { slug, title, date, outputPath };
}

function main() {
  if (!fs.existsSync(WECHAT_DIR)) {
    console.error(`WeChat articles directory not found: ${WECHAT_DIR}`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const folders = fs.readdirSync(WECHAT_DIR)
    .filter((name) => {
      const fullPath = path.join(WECHAT_DIR, name);
      return fs.statSync(fullPath).isDirectory()
        && fs.existsSync(path.join(fullPath, 'index.html'));
    })
    .sort();

  console.log(`Found ${folders.length} articles in ${WECHAT_DIR}\n`);

  const results = [];
  const errors = [];

  for (const folder of folders) {
    try {
      const result = convertArticle(path.join(WECHAT_DIR, folder));
      if (result) {
        results.push(result);
        console.log(`✓ ${result.title} (${result.date}) -> ${result.slug}.md`);
      }
    } catch (err) {
      errors.push({ folder, error: err.message });
      console.error(`✗ ${folder}: ${err.message}`);
    }
  }

  console.log(`\nConverted ${results.length} articles`);
  if (errors.length) {
    console.log(`Failed: ${errors.length}`);
  }

  // Output slug list for blogPosts.ts update
  const slugListPath = path.join(__dirname, '..', 'scripts', 'wechat-slugs.json');
  fs.writeFileSync(slugListPath, JSON.stringify(results.map((r) => r.slug), null, 2));
  console.log(`\nSlug list saved to ${slugListPath}`);
}

main();
