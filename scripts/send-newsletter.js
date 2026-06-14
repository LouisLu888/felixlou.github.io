#!/usr/bin/env node

/**
 * Send blog post notifications via Buttondown.
 *
 * Usage:
 *   BUTTONDOWN_API_KEY=xxx node scripts/send-newsletter.js              # send all unsent published posts
 *   node scripts/send-newsletter.js --post whole-engineer               # send one post by slug
 *   node scripts/send-newsletter.js --changed-only                      # only posts changed in last commit (CI)
 *   node scripts/send-newsletter.js --dry-run                           # preview without sending
 *   node scripts/send-newsletter.js --list                              # show unsent posts
 *   node scripts/send-newsletter.js --force --post whole-engineer       # resend even if already sent
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import { BLOG_POST_FILES } from '../src/config/blogPosts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = process.env.SITE_URL || 'https://www.jiabinlu.com';
const BUTTONDOWN_API = 'https://api.buttondown.com/v1/emails';
const BLOG_POSTS_DIR = path.join(__dirname, '..', 'public', 'blog-posts');
const SENT_STATE_FILE = path.join(__dirname, '.newsletter-sent.json');

function parseArgs(argv) {
  const args = {
    post: null,
    dryRun: false,
    force: false,
    changedOnly: false,
    list: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--changed-only') args.changedOnly = true;
    else if (arg === '--all') args.all = true;
    else if (arg === '--list') args.list = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--post' && argv[i + 1]) {
      args.post = argv[++i].replace(/\.md$/, '');
    } else if (!arg.startsWith('-')) {
      args.post = arg.replace(/\.md$/, '');
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Send blog post notifications via Buttondown.

Options:
  --post <slug>     Send notification for a specific post
  --changed-only    Only posts changed in the last git commit (for CI)
  --all             Send all unsent posts (default: newest only)
  --dry-run         Preview email without sending
  --force           Send even if already marked as sent
  --list            List unsent published posts
  --help            Show this help

Environment:
  BUTTONDOWN_API_KEY   Required unless --dry-run or --list
  SITE_URL             Default: ${SITE_URL}
`);
}

function loadSentState() {
  if (!fs.existsSync(SENT_STATE_FILE)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(SENT_STATE_FILE, 'utf-8'));
  } catch {
    console.warn('Warning: could not parse newsletter sent state, starting fresh.');
    return {};
  }
}

function saveSentState(state) {
  fs.writeFileSync(SENT_STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
}

function getChangedPostFiles() {
  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD -- public/blog-posts/', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (!output) return [];
    return output
      .split('\n')
      .map((line) => path.basename(line.trim()))
      .filter((name) => name.endsWith('.md'));
  } catch {
    return [];
  }
}

function loadPost(fileName) {
  const filePath = path.join(BLOG_POSTS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Post file not found: ${fileName}`);
  }

  const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));
  const slug = fileName.replace(/\.md$/, '');

  return {
    slug,
    fileName,
    title: data.title || slug,
    date: data.date || null,
    category: data.category || 'General',
    excerpt: data.excerpt || extractExcerpt(content),
    published: data.published !== false,
    url: `${SITE_URL}/blog/${slug}`,
  };
}

function extractExcerpt(content) {
  const paragraph = content
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#') && !line.startsWith('![') && !line.startsWith('---'));

  if (!paragraph) return '';
  return paragraph.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').slice(0, 280);
}

function buildEmailBody(post) {
  const lines = [
    post.title,
    '',
    post.excerpt ? `${post.excerpt}` : '',
    post.excerpt ? '' : null,
    `[Read on jiabinlu.com →](${post.url})`,
    '',
    '---',
    '',
    `You received this because you subscribed at [${SITE_URL}](${SITE_URL}).`,
  ].filter((line) => line !== null);

  return lines.join('\n');
}

async function sendViaButtondown({ subject, body, dryRun }) {
  if (dryRun) {
    console.log('\n--- DRY RUN ---');
    console.log(`Subject: ${subject}`);
    console.log('Body:\n');
    console.log(body);
    console.log('--- END ---\n');
    return { id: 'dry-run', status: 'dry_run' };
  }

  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    throw new Error('BUTTONDOWN_API_KEY is required');
  }

  const response = await fetch(BUTTONDOWN_API, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
      'X-API-Version': '2026-04-01',
      'X-Buttondown-Live-Dangerously': 'true',
    },
    body: JSON.stringify({
      subject,
      body,
      status: 'about_to_send',
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = payload.detail || payload.message || JSON.stringify(payload);
    throw new Error(`Buttondown API error (${response.status}): ${detail}`);
  }

  return payload;
}

function selectPosts({ args, sentState }) {
  const registered = new Set(BLOG_POST_FILES);

  let candidates = BLOG_POST_FILES.filter((fileName) => registered.has(fileName));

  if (args.changedOnly) {
    const changed = getChangedPostFiles();
    if (changed.length === 0) {
      console.log('No blog post files changed in the last commit.');
      return [];
    }
    candidates = candidates.filter((fileName) => changed.includes(fileName));
    console.log(`Changed in last commit: ${changed.join(', ')}`);
  }

  const posts = candidates
    .map((fileName) => loadPost(fileName))
    .filter((post) => post.published);

  if (args.post) {
    const match = posts.find((post) => post.slug === args.post);
    if (!match) {
      throw new Error(`Published post not found: ${args.post}`);
    }
    return [match];
  }

  return posts
    .filter((post) => args.force || !sentState[post.slug])
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, args.all || args.changedOnly || args.post ? undefined : 1);
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    return;
  }

  const sentState = loadSentState();
  const posts = selectPosts({ args, sentState });

  if (args.list) {
    if (posts.length === 0) {
      console.log('No unsent published posts.');
      return;
    }

    for (const post of posts) {
      console.log(`- ${post.slug} (${post.date || 'no date'}) — ${post.title}`);
    }
    return;
  }

  if (posts.length === 0) {
    console.log('Nothing to send.');
    return;
  }

  if (!args.dryRun && !process.env.BUTTONDOWN_API_KEY) {
    throw new Error('BUTTONDOWN_API_KEY is required (or use --dry-run)');
  }

  let sentCount = 0;

  for (const post of posts) {
    const subject = post.title;
    const body = buildEmailBody(post);

    console.log(`Sending: ${post.slug} — ${post.title}`);

    const result = await sendViaButtondown({ subject, body, dryRun: args.dryRun });

    if (!args.dryRun) {
      sentState[post.slug] = {
        sentAt: new Date().toISOString(),
        emailId: result.id || null,
        subject,
        url: post.url,
      };
      saveSentState(sentState);
      sentCount += 1;
      console.log(`✅ Sent (${result.id || 'ok'})`);
    }
  }

  if (args.dryRun) {
    console.log(`Dry run complete for ${posts.length} post(s).`);
  } else {
    console.log(`Done. Sent ${sentCount} newsletter notification(s).`);
  }
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
