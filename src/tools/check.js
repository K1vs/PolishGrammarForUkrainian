#!/usr/bin/env node
'use strict';
// Validates mindmap content files.
// Usage: node src/tools/check.js            -> all files in src/content (NN-*.js)
//        node src/tools/check.js <file...>  -> only the given files
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Master outline: every id here must exist once all branches are written.
const MASTER = `
root
ph ph-alphabet ph-soft ph-nasal ph-stress ph-voicing ph-spelling ph-alt ph-corr ph-false
case case-nom case-gen case-dat case-acc case-ins case-loc case-voc case-neg case-gov
noun noun-gender noun-virile noun-masc noun-fem noun-neut noun-pl noun-special
pron pron-pers pron-polite pron-refl pron-poss pron-dem pron-int pron-indef pron-def
adj adj-decl adj-virile adj-comp adj-short adj-agree
adv adv-form adv-pred adv-types adv-particles
num num-card num-syntax num-virile num-coll num-decl num-ord num-date num-time num-indef num-life
verb verb-inf verb-be-have verb-pres verb-pres-alt verb-past verb-fut verb-imp verb-cond verb-modal verb-irreg
asp asp-form asp-use asp-prefix mot mot-pairs mot-prefix refl impers passive part
prep prep-gen prep-dat-acc prep-ins-loc prep-place prep-time prep-vocal prep-false
syn syn-order syn-quest syn-neg syn-to syn-coord syn-sub syn-reported syn-punct syn-etiquette
wf wf-person wf-dimin wf-abstract wf-adj
`.split(/\s+/).filter(Boolean);
const MASTER_SET = new Set(MASTER);

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const args = process.argv.slice(2);
const checkingAll = args.length === 0;
const files = checkingAll
  ? fs.readdirSync(CONTENT_DIR).filter(f => /^\d\d-.+\.js$/.test(f)).sort().map(f => path.join(CONTENT_DIR, f))
  : args.map(f => path.resolve(f));

const LEVELS = ['A1', 'A2', 'B1'];
const KNOWN = new Set(['ord', 'parent', 'o', 'id', 't', 'pl', 'lvl', 'sum', 'rule', 'ua', 'tbl', 'ex', 'trap', 'quiz', 'kids']);
const MD_FIELDS = ['sum', 'rule', 'ua', 'tbl', 'trap'];

const errors = [];
const warns = [];
const ids = new Map();
const xrefs = [];
const perFile = new Map();

const base = f => path.basename(f);
const err = (f, id, msg) => errors.push(`${base(f)} [${id || '?'}] ${msg}`);
const warn = (f, id, msg) => warns.push(`${base(f)} [${id || '?'}] ${msg}`);

function words(s) {
  return (s.match(/[\p{L}\p{N}’'-]+/gu) || []).length;
}

function checkInline(f, id, where, s) {
  s.split('\n').forEach((line, i) => {
    if (((line.match(/\*\*/g) || []).length) % 2) warn(f, id, `${where} line ${i + 1}: unbalanced ** in "${line.trim().slice(0, 60)}"`);
    if (((line.match(/==/g) || []).length) % 2) warn(f, id, `${where} line ${i + 1}: unbalanced == in "${line.trim().slice(0, 60)}"`);
  });
  if (/<\/?[a-z][a-z0-9]*[\s>\/]/i.test(s)) warn(f, id, `${where}: contains an HTML-like tag (rendered as plain text)`);
  if (s.includes('`')) warn(f, id, `${where}: contains a backtick (not supported)`);
  const draft = s.match(/.{0,30}\?\s*[—–-]?\s*(ні(?=[\s,—–.:])|Ні(?=\s*[—–:])).{0,30}/u);
  if (draft) warn(f, id, `${where}: looks like a draft self-correction ("${draft[0].trim()}")`);
  const mixed = s.match(/[^\s*=~|]*([Ѐ-ӿ][A-Za-zĀ-ſ]|[A-Za-zĀ-ſ][Ѐ-ӿ])[^\s*=~|]*/);
  if (mixed) warn(f, id, `${where}: Latin and Cyrillic letters mixed inside one word: "${mixed[0].slice(0, 40)}"`);
  if (/\bundefined\b|\[object Object\]/.test(s)) warn(f, id, `${where}: contains "undefined"/"[object Object]"`);
  for (const m of s.matchAll(/\[\[([^\]|]*)(?:\|([^\]]*))?\]\]/g)) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m[1])) err(f, id, `${where}: malformed cross-link [[${m[1]}...]] (id must be lowercase a-z0-9-)`);
    else xrefs.push({ from: id, to: m[1], file: f });
  }
}

function checkMarkdown(f, id, field, s) {
  checkInline(f, id, field, s);
  const lines = s.split('\n').map(l => l.trim());
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('|')) continue;
    if (i > 0 && lines[i - 1].startsWith('|')) continue;
    const sep = lines[i + 1] || '';
    if (!/^\|?\s*:?-{2,}/.test(sep)) {
      err(f, id, `${field}: table without a header separator row (|---|---|) near "${lines[i].slice(0, 50)}"`);
      continue;
    }
    const cols = r => r.replace(/\\\|/g, '').replace(/^\|/, '').replace(/\|$/, '').split('|').length;
    const n = cols(lines[i]);
    for (let j = i + 2; j < lines.length && lines[j].startsWith('|'); j++) {
      if (cols(lines[j]) !== n) warn(f, id, `${field}: table row has ${cols(lines[j])} cells, header has ${n}: "${lines[j].slice(0, 50)}"`);
    }
  }
}

function walk(f, node) {
  const id = node && node.id;
  if (typeof id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
    err(f, id, 'missing or malformed id');
    return;
  }
  if (ids.has(id)) err(f, id, `duplicate id (also in ${base(ids.get(id))})`);
  else ids.set(id, f);
  for (const k of Object.keys(node)) if (!KNOWN.has(k)) warn(f, id, `unknown field "${k}"`);

  if (typeof node.t !== 'string' || !node.t.trim()) err(f, id, 'missing t (title)');
  else if (node.t.length > 40) warn(f, id, `t is ${node.t.length} chars; map labels should be <= 40`);
  if (node.pl !== undefined && typeof node.pl !== 'string') err(f, id, 'pl must be a string');
  if (!LEVELS.includes(node.lvl)) err(f, id, `lvl must be A1/A2/B1 (got ${JSON.stringify(node.lvl)})`);
  if (typeof node.sum !== 'string' || !node.sum.trim()) err(f, id, 'missing sum');
  else if (node.sum.length > 320) warn(f, id, `sum is ${node.sum.length} chars; keep it to 1-2 sentences`);
  if (typeof node.rule !== 'string' || node.rule.trim().length < 200) err(f, id, 'rule missing or shorter than 200 chars');
  if (typeof node.ua !== 'string' || node.ua.trim().length < 150) err(f, id, 'ua missing or shorter than 150 chars');
  for (const fld of MD_FIELDS) {
    if (node[fld] === undefined) continue;
    if (typeof node[fld] !== 'string') err(f, id, `${fld} must be a string`);
    else checkMarkdown(f, id, fld, node[fld]);
  }

  const isLeaf = !Array.isArray(node.kids) || node.kids.length === 0;
  if (!Array.isArray(node.ex)) err(f, id, 'ex must be an array of ["PL", "UA", "note?"]');
  else {
    node.ex.forEach((e, i) => {
      if (!Array.isArray(e) || e.length < 2 || e.length > 3 || e.some(x => typeof x !== 'string' || !x.trim())) {
        err(f, id, `ex[${i}] must be ["PL", "UA"] or ["PL", "UA", "note"] with non-empty strings`);
      } else e.forEach(x => checkInline(f, id, `ex[${i}]`, x));
    });
    const min = isLeaf ? 15 : 6;
    if (node.ex.length < min) warn(f, id, `only ${node.ex.length} examples (target >= ${min})`);
  }
  if (node.quiz !== undefined) {
    if (!Array.isArray(node.quiz)) err(f, id, 'quiz must be an array of ["prompt", "answer"]');
    else node.quiz.forEach((q, i) => {
      if (!Array.isArray(q) || q.length !== 2 || q.some(x => typeof x !== 'string' || !x.trim())) err(f, id, `quiz[${i}] must be ["prompt", "answer"]`);
      else q.forEach(x => checkInline(f, id, `quiz[${i}]`, x));
    });
  }
  if (isLeaf) {
    if (!node.trap) warn(f, id, 'leaf node without trap');
    if (!node.quiz || node.quiz.length < 6) warn(f, id, `leaf node: quiz has ${(node.quiz || []).length} items (target >= 6)`);
  }
  if (node.kids !== undefined) {
    if (!Array.isArray(node.kids)) err(f, id, 'kids must be an array');
    else node.kids.forEach(k => walk(f, k));
  }

  const st = perFile.get(f);
  st.nodes++;
  st.ex += Array.isArray(node.ex) ? node.ex.length : 0;
  st.quiz += Array.isArray(node.quiz) ? node.quiz.length : 0;
  st.words += MD_FIELDS.reduce((n, k) => n + (typeof node[k] === 'string' ? words(node[k]) : 0), 0);
}

for (const f of files) {
  perFile.set(f, { nodes: 0, ex: 0, quiz: 0, words: 0 });
  let code;
  try { code = fs.readFileSync(f, 'utf8'); } catch (e) { err(f, null, `cannot read: ${e.message}`); continue; }
  const ctx = { window: {} };
  vm.createContext(ctx);
  try {
    vm.runInContext(code, ctx, { filename: f });
  } catch (e) {
    err(f, null, `JavaScript error: ${e.message}${e.stack ? '\n    ' + String(e.stack).split('\n').slice(0, 2).join('\n    ') : ''}`);
    continue;
  }
  const items = ctx.window.PL_DATA || [];
  if (ctx.window.PL_ROOT) walk(f, ctx.window.PL_ROOT);
  if (!items.length && !ctx.window.PL_ROOT) err(f, null, 'nothing pushed to window.PL_DATA');
  for (const it of items) {
    if (it.parent === undefined && typeof it.ord !== 'number') err(f, it.id, 'top-level branch needs numeric "ord" (or "parent")');
    if (it.parent !== undefined && typeof it.parent !== 'string') err(f, it.id, '"parent" must be an id string');
    if (it.parent !== undefined && !MASTER_SET.has(it.parent)) warn(f, it.id, `parent "${it.parent}" is not in the master outline`);
    walk(f, it);
  }
}

for (const x of xrefs) {
  if (ids.has(x.to)) continue;
  if (!checkingAll && MASTER_SET.has(x.to)) continue; // lives in another branch file
  err(x.file, x.from, `broken cross-link [[${x.to}]]`);
}
const myIds = new Set(ids.keys());
if (checkingAll) {
  for (const id of MASTER) if (!myIds.has(id)) err('ALL', id, 'master-outline id is missing');
} else {
  // ids that this file set should own: master ids whose branch prefix matches ids found here
  const prefixes = new Set([...myIds].map(id => id.split('-')[0]));
  for (const id of MASTER) {
    if (id === 'root') continue;
    if (prefixes.has(id.split('-')[0]) && !myIds.has(id)) warn('FILES', id, 'master-outline id with your prefix is not present yet');
  }
}

console.log('\n=== Content stats ===');
let tot = { nodes: 0, ex: 0, quiz: 0, words: 0 };
for (const [f, s] of perFile) {
  console.log(`${base(f).padEnd(24)} nodes ${String(s.nodes).padStart(3)} | examples ${String(s.ex).padStart(4)} | quiz ${String(s.quiz).padStart(4)} | words ${String(s.words).padStart(6)}`);
  for (const k in tot) tot[k] += s[k];
}
console.log(`${'TOTAL'.padEnd(24)} nodes ${String(tot.nodes).padStart(3)} | examples ${String(tot.ex).padStart(4)} | quiz ${String(tot.quiz).padStart(4)} | words ${String(tot.words).padStart(6)}`);

if (warns.length) {
  console.log(`\n=== ${warns.length} warning(s) ===`);
  warns.forEach(w => console.log('  WARN  ' + w));
}
if (errors.length) {
  console.log(`\n=== ${errors.length} ERROR(S) ===`);
  errors.forEach(e => console.log('  ERROR ' + e));
  process.exit(1);
}
console.log('\nOK: no errors.');
