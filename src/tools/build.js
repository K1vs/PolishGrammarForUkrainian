#!/usr/bin/env node
'use strict';
// Inlines src/index.html + app.css + content/*.js + app.js into one self-contained HTML file.
// Usage: node src/tools/build.js [output]   (default: <project>/polish-grammar-a1-b1.html)
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(SRC, '..', 'polish-grammar-a1-b1.html'));

let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
const read = rel => fs.readFileSync(path.join(SRC, rel), 'utf8');
const safeScript = s => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => `<style>\n${read(href)}\n</style>`);

const missing = [];
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  const file = path.join(SRC, src);
  if (!fs.existsSync(file)) { missing.push(src); return `<!-- missing: ${src} -->`; }
  return `<script>\n${safeScript(read(src))}\n</script>`;
});

fs.writeFileSync(OUT, html, 'utf8');
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`Built ${OUT} (${kb} KB)`);
if (missing.length) console.log(`Skipped missing scripts: ${missing.join(', ')}`);
