#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';
import { BLOG_POST_FILES } from '../src/config/blogPosts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_POSTS_DIR = path.join(__dirname, '..', 'public', 'blog-posts');
const OUTPUT_PATH = path.join(BLOG_POSTS_DIR, 'index.json');

function toPostMeta(fileName, data) {
  return {
    id: fileName.replace(/\.md$/, ''),
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString().split('T')[0],
    readTime: data.readTime || '5 min read',
    category: data.category || 'General',
    excerpt: data.excerpt || '',
    published: data.published ?? false,
    source: data.source,
    series: data.series,
    seriesPart: data.seriesPart ? Number(data.seriesPart) : undefined,
    seriesTitle: data.seriesTitle,
  };
}

function main() {
  const posts = [];

  for (const fileName of BLOG_POST_FILES) {
    const filePath = path.join(BLOG_POSTS_DIR, fileName);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(fileContent);
    posts.push(toPostMeta(fileName, data));
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(posts, null, 2)}\n`, 'utf-8');
  console.log(`Generated blog index with ${posts.length} posts at ${OUTPUT_PATH}`);
}

main();
