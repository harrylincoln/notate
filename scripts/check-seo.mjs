import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const origin = 'https://www.notestotab.com';
const pages = [
  ['/', 'Convert Musical Notes to Guitar Tabs | Notes to Tab'],
  ['/sheet-music-to-guitar-tabs/', 'How to Convert Sheet Music to Guitar Tabs | Notes to Tab'],
];
for (const [route, title] of pages) {
  const file = path.join('build', route, 'index.html');
  const html = await readFile(file, 'utf8');
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.querySelectorAll('title').length, 1, `${route}: title count`);
  assert.equal(doc.title, title);
  assert.equal(doc.querySelectorAll('h1').length, 1, `${route}: H1 count`);
  assert.equal(doc.querySelectorAll('link[rel="canonical"]').length, 1, `${route}: canonical count`);
  assert.equal(doc.querySelector('link[rel="canonical"]').getAttribute('href'), origin + route);
  assert.ok(doc.querySelector('meta[name="description"]').content.length > 50);
  assert.equal(doc.querySelector('meta[property="og:url"]').content, origin + route);
  assert.ok(doc.querySelector('main').textContent.length > 300, 'Static content must be meaningful');
  assert.ok(!/noindex/i.test(doc.querySelector('meta[name="robots"]')?.content || ''));
  for (const node of doc.querySelectorAll('a[href], script[src], link[rel="stylesheet"], img[src]')) {
    const href = node.getAttribute('href') || node.getAttribute('src');
    if (!href || href.startsWith('#') || /^https?:/.test(href)) continue;
    const url = new URL(href, origin + route);
    const target = path.join('build', url.pathname, url.pathname.endsWith('/') ? 'index.html' : '');
    await access(target);
  }
  for (const data of doc.querySelectorAll('script[type="application/ld+json"]')) JSON.parse(data.textContent);
}
const xml = new JSDOM(await readFile('build/sitemap.xml', 'utf8'), { contentType: 'application/xml' }).window.document;
assert.deepEqual([...xml.querySelectorAll('loc')].map(node => node.textContent), pages.map(([route]) => origin + route));
const robots = await readFile('build/robots.txt', 'utf8');
assert.ok(robots.includes('Sitemap: https://www.notestotab.com/sitemap.xml'));
assert.ok(!/Disallow:\s*\//.test(robots));
console.log('SEO checks passed: both built pages, static content, metadata, canonical tags, internal links, assets, sitemap and robots.txt.');
