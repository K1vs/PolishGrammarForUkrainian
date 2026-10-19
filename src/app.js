/* Polish grammar mindmap engine: data assembly, markdown, mindmap layout, detail tabs, search, LLM context. */
(function () {
  'use strict';

  // ---------------------------------------------------------------- data
  const ROOT = window.PL_ROOT || { id: 'root', t: 'Польська граматика', lvl: 'A1', sum: '', rule: '', ua: '', ex: [] };
  const DATA = window.PL_DATA || [];
  const N = Object.create(null);
  const P = Object.create(null);

  ROOT.kids = DATA.filter(b => b.parent === undefined).sort((a, b) => (a.ord || 0) - (b.ord || 0));
  function index(node, parent) {
    N[node.id] = node;
    if (parent) P[node.id] = parent.id;
    (node.kids || []).forEach(k => index(k, node));
  }
  index(ROOT, null);
  for (const item of DATA.filter(b => b.parent !== undefined)) {
    const host = N[item.parent] || ROOT;
    (host.kids = host.kids || []).push(item);
    index(item, host);
  }
  (function sortKids(n) {
    if (n.kids && n.kids.some(k => k.o !== undefined)) {
      n.kids = n.kids
        .map((k, i) => [k, i])
        .sort((a, b) => ((a[0].o ?? 1e9) - (b[0].o ?? 1e9)) || (a[1] - b[1]))
        .map(x => x[0]);
    }
    (n.kids || []).forEach(sortKids);
  })(ROOT);

  const HUES = { ph: 200, case: 345, noun: 22, pron: 272, adj: 135, adv: 168, num: 42, verb: 0, prep: 222, syn: 300, wf: 88 };
  const ORDER = [];
  (function annotate(n, depth, branch, bi) {
    n.depth = depth;
    n.branch = branch;
    n.hue = branch ? (HUES[branch] ?? (bi * 47) % 360) : 215;
    ORDER.push(n.id);
    (n.kids || []).forEach((k, i) => annotate(k, depth + 1, depth === 0 ? k.id : branch, depth === 0 ? i : bi));
  })(ROOT, 0, null, 0);

  const LV = { A1: 1, A2: 2, B1: 3 };
  const hasKids = n => !!(n.kids && n.kids.length);
  function pathOf(id) {
    const out = [];
    for (let c = id; c; c = P[c]) out.unshift(c);
    return out;
  }
  const isDesc = (id, anc) => pathOf(id).includes(anc);

  // ---------------------------------------------------------------- storage
  const store = {
    get(k, d) {
      try { const v = localStorage.getItem('plgram.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem('plgram.' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ }
    },
  };

  const S = {
    sel: 'root',
    view: 'root',
    open: new Set(['root']),
    tab: store.get('tab', 'rule'),
    level: store.get('level', 'B1'),
    learned: new Set(store.get('learned', []).filter(id => N[id])),
    auto: store.get('auto', true),
    hideUA: false,
    hidePL: false,
    exFilter: '',
    llmOpts: Object.assign({ rule: true, ua: true, trap: true, ex: true, tbl: false, quiz: false }, store.get('llmOpts', {})),
    question: store.get('question', ''),
    oOpen: new Set(),
  };

  // ---------------------------------------------------------------- markdown
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const titleOf = id => (N[id] ? N[id].t : id);

  function inline(s) {
    s = esc(s).replace(/\\\|/g, '|');
    s = s.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (m, id, label) =>
      N[id]
        ? `<a class="xref" href="#${id}" data-go="${id}">${label || esc(titleOf(id))}</a>`
        : `<span class="xref missing">${label || id}</span>`);
    s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    s = s.replace(/==(.+?)==/g, '<mark>$1</mark>');
    s = s.replace(/~~(.+?)~~/g, '<s>$1</s>');
    s = s.replace(/(^|[^\p{L}\p{N}*])\*(?![\s*])(.+?)(?<![\s*])\*(?![\p{L}\p{N}*])/gu, '$1<i>$2</i>');
    return s;
  }

  function dedent(src) {
    const lines = String(src || '').replace(/\r/g, '').split('\n');
    const ind = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
    return Number.isFinite(ind) && ind > 0 ? lines.map(l => l.slice(ind)) : lines;
  }

  const RE_LIST = /^(\s*)([-*]|\d+[.)])\s+(.*)$/;
  const RE_CALLOUT = /^(>!|>\+|>)\s?(.*)$/;

  function md(src) {
    if (!src) return '';
    const lines = dedent(src);
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const t = line.trim();
      if (!t) { i++; continue; }
      let m;
      if ((m = t.match(/^(#{1,6})\s+(.*)$/))) {
        const lvl = Math.min(5, Math.max(3, m[1].length + (m[1].length < 3 ? 1 : 0)));
        out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
        i++;
        continue;
      }
      if (/^(-{3,}|\*{3,})$/.test(t)) { out.push('<hr>'); i++; continue; }
      if (t.startsWith('|')) {
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++].trim());
        out.push(table(rows));
        continue;
      }
      if ((m = t.match(RE_CALLOUT))) {
        const kind = m[1] === '>!' ? 'warn' : m[1] === '>+' ? 'key' : 'note';
        const inner = [];
        while (i < lines.length) {
          const mm = lines[i].trim().match(RE_CALLOUT);
          if (!mm || mm[1] !== m[1]) break;
          inner.push(mm[2]);
          i++;
        }
        out.push(`<div class="callout ${kind}">${md(inner.join('\n'))}</div>`);
        continue;
      }
      if (RE_LIST.test(line)) {
        const [html, next] = list(lines, i);
        out.push(html);
        i = next;
        continue;
      }
      const para = [];
      while (i < lines.length) {
        const l = lines[i];
        const lt = l.trim();
        if (!lt || /^#{1,6}\s/.test(lt) || lt.startsWith('|') || RE_CALLOUT.test(lt) || RE_LIST.test(l) || /^(-{3,}|\*{3,})$/.test(lt)) break;
        para.push(inline(lt));
        i++;
      }
      out.push(`<p>${para.join('<br>')}</p>`);
    }
    return out.join('\n');
  }

  function table(rows) {
    const cells = r => r.replace(/\\\|/g, '\u0000').replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim().replace(/\u0000/g, '\\|'));
    const head = cells(rows[0]);
    let body = rows.slice(1);
    if (body.length && /^\|?[\s:|-]+$/.test(body[0]) && body[0].includes('-')) body = body.slice(1);
    return `<div class="tbl-wrap"><table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${
      body.map(r => `<tr>${cells(r).map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')
    }</tbody></table></div>`;
  }

  function list(lines, i) {
    const items = [];
    while (i < lines.length) {
      const raw = lines[i];
      if (!raw.trim()) {
        let j = i + 1;
        while (j < lines.length && !lines[j].trim()) j++;
        if (j < lines.length && RE_LIST.test(lines[j])) { i = j; continue; }
        break;
      }
      const m = raw.match(RE_LIST);
      if (m) items.push({ indent: m[1].length, ordered: /\d/.test(m[2]), parts: [m[3]] });
      else if (/^\s+\S/.test(raw) && items.length && !RE_CALLOUT.test(raw.trim()) && !raw.trim().startsWith('|')) items[items.length - 1].parts.push(raw.trim());
      else break;
      i++;
    }
    let html = '';
    const stack = [];
    for (const it of items) {
      while (stack.length && it.indent < stack[stack.length - 1].indent) html += `</li></${stack.pop().tag}>`;
      if (!stack.length || it.indent > stack[stack.length - 1].indent) {
        const tag = it.ordered ? 'ol' : 'ul';
        stack.push({ indent: it.indent, tag });
        html += `<${tag}>`;
      } else html += '</li>';
      html += `<li>${it.parts.map(inline).join('<br>')}`;
    }
    while (stack.length) html += `</li></${stack.pop().tag}>`;
    return [html, i];
  }

  // Markdown -> text for LLM prompts (keeps **bold**/*italic*, resolves links, drops == marks).
  function llmMd(src) {
    return dedent(src)
      .join('\n')
      .replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (m, id, l) => l || titleOf(id))
      .replace(/==(.+?)==/g, '$1')
      .replace(/^(\s*)>!\s?/gm, '$1> ⚠️ ')
      .replace(/^(\s*)>\+\s?/gm, '$1> 💡 ')
      .trim();
  }
  const plain = s => llmMd(s || '');
  const bare = s => plain(s).replace(/\*\*(.+?)\*\*/g, '$1').replace(/~~(.+?)~~/g, '$1').replace(/(^|[^\p{L}*])\*([^*\n]+?)\*/gu, '$1$2');

  // ---------------------------------------------------------------- search index
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[’ʼ`]/g, "'");
  const IDX = Object.create(null);
  for (const id of ORDER) {
    const n = N[id];
    const f = {
      t: n.t || '', pl: n.pl || '', sum: bare(n.sum), rule: bare(n.rule), ua: bare(n.ua), tbl: bare(n.tbl),
      ex: (n.ex || []).map(e => e.map(bare).join(' — ')).join(' • '), trap: bare(n.trap),
      quiz: (n.quiz || []).map(q => q.map(bare).join(' → ')).join(' • '),
    };
    const nf = {};
    for (const k in f) nf[k] = norm(f[k]);
    IDX[id] = { f, nf, all: Object.values(nf).join(' \n ') };
  }

  // ---------------------------------------------------------------- DOM refs
  const $ = sel => document.querySelector(sel);
  const app = $('#app');
  const mapEl = $('#map');
  const world = $('#world');
  const edgesSvg = $('#edges');
  const nodesLayer = $('#nodes');
  const detailEl = $('#detail');
  const treeEl = $('#tree');
  const qInput = $('#q');
  const resultsEl = $('#results');
  const SVGNS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  // ---------------------------------------------------------------- toast & clipboard
  let toastTimer = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall back */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) { return false; }
  }
  async function copyPrompt(text, what) {
    const ok = await copyText(text);
    if (ok) toast(`📋 Скопійовано ${what} (${text.length.toLocaleString('uk-UA')} символів). Встав у чат LLM.`);
    else {
      S.tab = 'llm';
      renderDetail();
      toast('Не вдалося скопіювати автоматично — виділи текст у попередньому перегляді й скопіюй вручну.');
    }
  }

  // ---------------------------------------------------------------- speech
  const canSpeak = 'speechSynthesis' in window;
  function speak(text) {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(bare(text).replace(/^[—–-]\s*/, ''));
    u.lang = 'pl-PL';
    const v = window.speechSynthesis.getVoices().find(x => (x.lang || '').toLowerCase().startsWith('pl'));
    if (v) u.voice = v;
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  }

  // ---------------------------------------------------------------- LLM prompts
  const PREAMBLE = [
    'Ти — досвідчений викладач польської мови й лінгвіст-компаративіст (польська ↔ українська).',
    'Про мене: рідна мова — українська; вивчаю польську системно — через розуміння граматичних правил, парадигм і закономірностей, а не «на слух». Цільовий рівень — B1.',
    '',
    'Як мені відповідати:',
    '- українською мовою, структуровано (заголовки, таблиці, списки);',
    '- спирайся на аналогії та відмінності з українською граматикою, показуй паралельні українські форми поруч із польськими;',
    '- давай польські приклади з українським перекладом, виділяй закінчення й чергування;',
    '- попереджай про типові помилки україномовних (кальки, хибні друзі, перенесення українських конструкцій);',
    '- позначай варіанти норми (розмовне / книжне); не вигадуй форм — якщо не впевнений, так і скажи.',
  ].join('\n');

  const PRESETS = [
    ['🔎 Поясни простіше', 'Поясни цю тему простіше й з іншого боку, ніби я бачу її вперше. Спирайся на українську, дай 5 базових прикладів.'],
    ['💬 15 нових прикладів', 'Дай 15 нових прикладів на цю тему (польською з українським перекладом), від простих до складніших, з побутової лексики. Виділи ключові форми й коротко поясни кожну.'],
    ['✍️ Вправа', 'Склади мені вправу з 10 завдань на цю тему (переклад з української, вибір форми, трансформації). Не показуй відповідей — дочекайся моїх і тоді перевір їх із поясненнями.'],
    ['🇺🇦 Глибше порівняння', 'Порівняй цю тему з українською ще детальніше: що збігається повністю, що частково, що зовсім інакше, і чому (коротко про історію мов). Додай мнемоніки, які спираються на українську.'],
    ['⚠️ Типові помилки', 'Які типові помилки роблять україномовні в цій темі? Для кожної: неправильний варіант, правильний, пояснення і як не помилятися.'],
    ['✅ Перевір мої речення', 'Перевір мої польські речення на цю тему, виправ помилки й поясни кожну:\n1. \n2. \n3. '],
    ['🗣 Діалог', 'Склади короткий побутовий діалог (10–12 реплік), у якому багато граматики з цієї теми. Дай переклад і розбери виділені форми.'],
    ['🧩 Зведена таблиця', 'Склади повну зведену таблицю з цієї теми (польські форми + українські відповідники), компактну, щоб її можна було роздрукувати.'],
  ];

  function nodeContext(n, o) {
    const path = pathOf(n.id).map(titleOf).join(' › ');
    let s = `${PREAMBLE}\n\n# Контекст теми\n- **Розділ:** ${path}\n`;
    if (n.pl) s += `- **Польський термін:** ${n.pl}\n`;
    s += `- **Рівень теми:** ${n.lvl}\n- **Суть:** ${plain(n.sum)}\n`;
    if (hasKids(n)) s += `- **Підтеми:** ${n.kids.map(k => k.t).join('; ')}\n`;
    if (o.rule && n.rule) s += `\n## Правило (конспект із моєї шпаргалки)\n${llmMd(n.rule)}\n`;
    if (o.ua && n.ua) s += `\n## Порівняння з українською\n${llmMd(n.ua)}\n`;
    if (o.tbl && n.tbl) s += `\n## Таблиці\n${llmMd(n.tbl)}\n`;
    if (o.trap && n.trap) s += `\n## Типові пастки\n${llmMd(n.trap)}\n`;
    if (o.ex && n.ex && n.ex.length) {
      s += `\n## Приклади\n${n.ex.slice(0, 12).map(e => `- ${plain(e[0])} — ${plain(e[1])}${e[2] ? ` (${plain(e[2])})` : ''}`).join('\n')}\n`;
    }
    if (o.quiz && n.quiz && n.quiz.length) {
      s += `\n## Завдання для самоперевірки\n${n.quiz.map(q => `- ${plain(q[0])} → ${plain(q[1])}`).join('\n')}\n`;
    }
    return s;
  }
  const buildPrompt = (n, q) => `${nodeContext(n, S.llmOpts)}\n# Моє запитання\n${(q || '').trim() || '[впиши тут своє запитання]'}\n`;

  function examplePrompt(n, e) {
    return `${PREAMBLE}\n\n# Контекст\n- **Тема:** ${pathOf(n.id).map(titleOf).join(' › ')}\n- **Суть теми:** ${plain(n.sum)}\n\n` +
      `# Речення\n- PL: ${plain(e[0])}\n- UA: ${plain(e[1])}${e[2] ? `\n- Примітка зі шпаргалки: ${plain(e[2])}` : ''}\n\n` +
      '# Моє запитання\nРозбери це польське речення граматично: кожне слово — частина мови і форма (рід, число, відмінок / час, вид, особа) і чому саме така форма. ' +
      'Порівняй з українським перекладом: що збігається, що відрізняється. Дай 5 схожих речень із перекладом.\n';
  }
  function quizPrompt(n, q) {
    return `${PREAMBLE}\n\n# Контекст\n- **Тема:** ${pathOf(n.id).map(titleOf).join(' › ')}\n- **Суть теми:** ${plain(n.sum)}\n\n` +
      `# Завдання\n${plain(q[0])}\n\n# Відповідь зі шпаргалки\n${plain(q[1])}\n\n` +
      '# Моє запитання\nПоясни детально, чому відповідь саме така (з опорою на українську), які помилки тут типові, і дай ще 3 схожі завдання (відповіді в кінці).\n';
  }

  // ---------------------------------------------------------------- navigation
  function setHash(id) {
    const want = id === 'root' ? '' : id;
    if (decodeURIComponent(location.hash.slice(1)) !== want) {
      if (want) location.hash = want;
      else history.pushState(null, '', location.pathname + location.search);
    }
  }

  function go(id, opts = {}) {
    if (!N[id]) return;
    const prev = S.sel;
    S.sel = id;
    if (!isDesc(id, S.view)) S.view = 'root';
    const path = pathOf(id);
    if (S.auto) {
      const keep = new Set(path);
      for (const o of [...S.open]) if (!keep.has(o) && o !== S.view) S.open.delete(o);
    }
    path.slice(0, -1).forEach(p => S.open.add(p));
    if (hasKids(N[id]) && opts.expand !== false) S.open.add(id);
    if (opts.tab) S.tab = opts.tab;
    if (opts.exFilter !== undefined) S.exFilter = opts.exFilter;
    else if (prev !== id) S.exFilter = '';
    if (!opts.fromHash) setHash(id);
    store.set('last', id);
    renderAll({ focus: id });
    if (opts.scrollTop !== false) {
      const body = $('#dbody');
      if (body) body.scrollTop = 0;
    }
  }

  function toggleOpen(id) {
    if (S.open.has(id)) {
      S.open.delete(id);
      pathDesc(id).forEach(d => S.open.delete(d));
    } else {
      if (S.auto && P[id]) {
        const keep = new Set(pathOf(id));
        for (const o of [...S.open]) if (!keep.has(o) && !isDesc(S.sel, o) && o !== S.view) S.open.delete(o);
      }
      S.open.add(id);
    }
    layoutMap({ focus: id });
  }
  function pathDesc(id) {
    const out = [];
    (function rec(n) { (n.kids || []).forEach(k => { out.push(k.id); rec(k); }); })(N[id]);
    return out;
  }

  function focusView(id) {
    S.view = id;
    S.open.add(id);
    layoutMap({ fit: true });
    renderMapCrumbs();
  }

  function stepOrder(delta) {
    const i = ORDER.indexOf(S.sel);
    const j = i + delta;
    if (j >= 0 && j < ORDER.length) go(ORDER[j]);
  }

  // ---------------------------------------------------------------- map: elements & layout
  const els = new Map();
  const paths = new Map();
  const cur = Object.create(null);
  let animId = 0;

  function nodeEl(n) {
    let el = els.get(n.id);
    if (!el) {
      el = document.createElement('div');
      el.className = 'mm-node';
      el.dataset.id = n.id;
      el.style.setProperty('--h', n.hue);
      el.title = bare(n.sum);
      el.innerHTML = `<div class="mm-row"><span class="mm-t">${esc(n.t)}</span><span class="mm-lvl ${n.lvl}">${n.lvl}</span></div>` +
        (n.pl ? `<span class="mm-pl">${esc(n.pl)}</span>` : '') +
        (hasKids(n) ? `<span class="mm-tog" data-tog="${n.id}"></span>` : '');
      el.style.opacity = '0';
      nodesLayer.appendChild(el);
      els.set(n.id, el);
    }
    return el;
  }

  function visibleList() {
    const out = [];
    (function rec(n) { out.push(n); if (S.open.has(n.id) && n.kids) n.kids.forEach(rec); })(N[S.view]);
    return out;
  }

  function computePositions(root, size) {
    const pos = Object.create(null);
    const sh = Object.create(null);
    const VG = 10;
    (function H(n) {
      const own = size[n.id].h;
      if (!S.open.has(n.id) || !hasKids(n)) return (sh[n.id] = own);
      let s = 0;
      n.kids.forEach((k, i) => { s += H(k) + (i ? VG : 0); });
      return (sh[n.id] = Math.max(own, s));
    })(root);
    const rs = size[root.id];
    pos[root.id] = { x: -rs.w / 2, y: -rs.h / 2, w: rs.w, h: rs.h, side: 0 };
    function place(list, side, edgeX, cy, gap, depth) {
      const total = list.reduce((s, k, i) => s + sh[k.id] + (i ? VG : 0), 0);
      let y = cy - total / 2;
      for (const k of list) {
        const s = size[k.id];
        const kcy = y + sh[k.id] / 2;
        const x = side > 0 ? edgeX + gap : edgeX - gap - s.w;
        pos[k.id] = { x, y: kcy - s.h / 2, w: s.w, h: s.h, side };
        if (S.open.has(k.id) && hasKids(k)) place(k.kids, side, side > 0 ? x + s.w : x, kcy, 40, depth + 1);
        y += sh[k.id] + VG;
      }
    }
    if (S.open.has(root.id) && hasKids(root)) {
      const kids = root.kids;
      if (kids.length < 5) place(kids, 1, rs.w / 2, 0, 64, 1);
      else {
        const split = Math.ceil(kids.length / 2);
        place(kids.slice(0, split), 1, rs.w / 2, 0, 70, 1);
        place(kids.slice(split).reverse(), -1, -rs.w / 2, 0, 70, 1);
      }
    }
    return pos;
  }

  function edgePath(p, c) {
    const sy = p.y + p.h / 2;
    const ey = c.y + c.h / 2;
    const sx = c.side > 0 ? p.x + p.w : p.x;
    const ex = c.side > 0 ? c.x : c.x + c.w;
    const mx = (sx + ex) / 2;
    return `M${sx.toFixed(1)},${sy.toFixed(1)} C${mx.toFixed(1)},${sy.toFixed(1)} ${mx.toFixed(1)},${ey.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
  }

  function layoutMap(opts = {}) {
    const vis = visibleList();
    const visSet = new Set(vis.map(n => n.id));
    const selPath = new Set(pathOf(S.sel));
    for (const n of vis) {
      const el = nodeEl(n);
      el.classList.toggle('sel', n.id === S.sel);
      el.classList.toggle('open', S.open.has(n.id));
      el.classList.toggle('learned', S.learned.has(n.id));
      el.classList.toggle('dim', LV[n.lvl] > LV[S.level]);
      el.classList.toggle('vroot', n.id === S.view);
      el.classList.toggle('onpath', selPath.has(n.id));
      el.dataset.depth = Math.min(n.depth, 3);
      const tog = el.querySelector('.mm-tog');
      if (tog) tog.textContent = S.open.has(n.id) ? '−' : '+' + n.kids.length;
    }
    const size = Object.create(null);
    for (const n of vis) {
      const el = els.get(n.id);
      size[n.id] = { w: el.offsetWidth, h: el.offsetHeight };
    }
    const target = computePositions(N[S.view], size);
    for (const n of vis) els.get(n.id).classList.toggle('side-l', target[n.id].side < 0);
    const viewPath = paths.get(S.view);
    if (viewPath) { viewPath.remove(); paths.delete(S.view); }
    for (const [id, p] of paths) p.classList.toggle('onpath', selPath.has(id));
    const leaving = [...els.keys()].filter(id => !visSet.has(id));
    animate(target, leaving, opts);
  }

  function animate(target, leaving, opts) {
    const dur = reduceMotion || opts.instant ? 0 : 300;
    const from = Object.create(null);
    for (const id in target) {
      target[id].o = 1;
      if (cur[id]) from[id] = Object.assign({}, cur[id]);
      else {
        let pid = P[id];
        while (pid && !cur[pid] && !target[pid]) pid = P[pid];
        const pp = (pid && (cur[pid] || target[pid])) || target[id];
        from[id] = Object.assign({}, target[id], { x: pp.x, y: pp.y, o: 0 });
      }
    }
    for (const id of leaving) {
      if (!cur[id]) { removeNode(id); continue; }
      let pid = P[id];
      while (pid && !target[pid] && P[pid]) pid = P[pid];
      const pt = target[pid] || cur[id];
      from[id] = Object.assign({}, cur[id]);
      target[id] = Object.assign({}, cur[id], { x: pt.x, y: pt.y, o: 0 });
    }
    const myAnim = ++animId;
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const frame = now => {
      if (myAnim !== animId) return;
      const k = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = ease(k);
      for (const id in target) {
        const a = from[id];
        const b = target[id];
        const ao = a.o ?? 1;
        const c = (cur[id] = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, w: b.w, h: b.h, side: b.side, o: ao + (b.o - ao) * e });
        const el = els.get(id);
        if (el) {
          el.style.transform = `translate(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px)`;
          el.style.opacity = c.o.toFixed(3);
        }
      }
      drawEdges(target);
      if (k < 1) requestAnimationFrame(frame);
      else leaving.forEach(removeNode);
    };
    requestAnimationFrame(frame);
    const live = Object.keys(target).filter(id => !leaving.includes(id));
    if (opts.fit) fitTo(bboxOf(live, target), dur);
    else if (opts.focus && target[opts.focus]) ensureVisible(opts.focus, target, dur);
  }

  function removeNode(id) {
    const el = els.get(id);
    if (el) el.remove();
    els.delete(id);
    const p = paths.get(id);
    if (p) p.remove();
    paths.delete(id);
    delete cur[id];
  }

  function drawEdges(target) {
    const selPath = new Set(pathOf(S.sel));
    for (const id in target) {
      const pid = P[id];
      if (id === S.view || !pid || !cur[pid] || !cur[id]) continue;
      let p = paths.get(id);
      if (!p) {
        p = document.createElementNS(SVGNS, 'path');
        p.setAttribute('class', 'mm-edge');
        p.style.setProperty('--h', N[id].hue);
        p.dataset.depth = Math.min(N[id].depth, 3);
        p.classList.toggle('onpath', selPath.has(id));
        edgesSvg.appendChild(p);
        paths.set(id, p);
      }
      p.setAttribute('d', edgePath(cur[pid], cur[id]));
      p.style.opacity = cur[id].o.toFixed(3);
    }
  }

  // ---------------------------------------------------------------- camera
  const cam = { x: 0, y: 0, k: 1 };
  let camAnim = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function applyCam() { world.style.transform = `translate(${cam.x.toFixed(1)}px,${cam.y.toFixed(1)}px) scale(${cam.k.toFixed(4)})`; }
  function camTo(x, y, k, dur) {
    const a = Object.assign({}, cam);
    const my = ++camAnim;
    if (!dur) { Object.assign(cam, { x, y, k }); applyCam(); return; }
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const f = now => {
      if (my !== camAnim) return;
      const t = Math.min(1, (now - t0) / dur);
      const e = ease(t);
      cam.x = a.x + (x - a.x) * e;
      cam.y = a.y + (y - a.y) * e;
      cam.k = a.k + (k - a.k) * e;
      applyCam();
      if (t < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }
  function bboxOf(ids, pos) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (const id of ids) {
      const p = pos[id];
      if (!p) continue;
      x1 = Math.min(x1, p.x - 14); y1 = Math.min(y1, p.y - 10);
      x2 = Math.max(x2, p.x + p.w + 14); y2 = Math.max(y2, p.y + p.h + 10);
    }
    if (!Number.isFinite(x1)) return { x: -100, y: -50, w: 200, h: 100 };
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }
  const TOPBAR = 50;
  function fitTo(bb, dur) {
    const W = mapEl.clientWidth;
    const H = mapEl.clientHeight;
    const pad = 28;
    const k = clamp(Math.min((W - 2 * pad) / bb.w, (H - TOPBAR - pad) / bb.h), 0.22, 1.15);
    camTo(W / 2 - (bb.x + bb.w / 2) * k, TOPBAR + (H - TOPBAR - pad) / 2 - (bb.y + bb.h / 2) * k, k, dur);
  }
  function ensureVisible(id, pos, dur) {
    const ids = [id];
    if (S.open.has(id) && hasKids(N[id])) N[id].kids.forEach(k => ids.push(k.id));
    if (P[id] && pos[P[id]]) ids.push(P[id]);
    const bb = bboxOf(ids, pos);
    const W = mapEl.clientWidth;
    const H = mapEl.clientHeight;
    const pad = 24;
    const fitK = Math.min((W - 2 * pad) / bb.w, (H - TOPBAR - pad) / bb.h);
    if (fitK < cam.k) {
      const k = clamp(fitK, 0.3, 1.15);
      camTo(W / 2 - (bb.x + bb.w / 2) * k, TOPBAR + (H - TOPBAR - pad) / 2 - (bb.y + bb.h / 2) * k, k, dur);
      return;
    }
    let { x, y } = cam;
    const k = cam.k;
    const sx1 = bb.x * k + x, sx2 = (bb.x + bb.w) * k + x, sy1 = bb.y * k + y, sy2 = (bb.y + bb.h) * k + y;
    if (sx1 < pad) x += pad - sx1;
    else if (sx2 > W - pad) x -= sx2 - (W - pad);
    if (sy1 < TOPBAR) y += TOPBAR - sy1;
    else if (sy2 > H - pad) y -= sy2 - (H - pad);
    if (x !== cam.x || y !== cam.y) camTo(x, y, k, dur);
  }
  function zoomAt(px, py, f) {
    const k2 = clamp(cam.k * f, 0.18, 2.4);
    cam.x = px - (px - cam.x) * (k2 / cam.k);
    cam.y = py - (py - cam.y) * (k2 / cam.k);
    cam.k = k2;
    camAnim++;
    applyCam();
  }
  function fitAll() {
    const ids = [...els.keys()].filter(id => cur[id] && cur[id].o > 0.5);
    fitTo(bboxOf(ids, cur), 300);
  }

  // ---------------------------------------------------------------- map interaction
  const pointers = new Map();
  let drag = null;
  let pinch = null;
  mapEl.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('.map-bar')) return;
    mapEl.focus({ preventScroll: true });
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { mapEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (pointers.size === 1) drag = { sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false, target: e.target };
    else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const r = mapEl.getBoundingClientRect();
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: cam.k, mx: (a.x + b.x) / 2 - r.left, my: (a.y + b.y) / 2 - r.top, cx: cam.x, cy: cam.y };
      if (drag) drag.moved = true;
    }
  });
  mapEl.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const k2 = clamp(pinch.k * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, 0.18, 2.4);
      cam.x = pinch.mx - (pinch.mx - pinch.cx) * (k2 / pinch.k);
      cam.y = pinch.my - (pinch.my - pinch.cy) * (k2 / pinch.k);
      cam.k = k2;
      camAnim++;
      applyCam();
      return;
    }
    if (!drag) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) > 5) { drag.moved = true; mapEl.classList.add('panning'); }
    if (drag.moved) {
      cam.x = drag.cx + dx;
      cam.y = drag.cy + dy;
      camAnim++;
      applyCam();
    }
  });
  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (drag && pointers.size === 0) {
      if (!drag.moved && e.type === 'pointerup') {
        const tog = drag.target.closest && drag.target.closest('.mm-tog');
        const node = drag.target.closest && drag.target.closest('.mm-node');
        if (tog) toggleOpen(tog.dataset.tog);
        else if (node) nodeClick(node.dataset.id);
      }
      drag = null;
      mapEl.classList.remove('panning');
    }
  }
  mapEl.addEventListener('pointerup', endPointer);
  mapEl.addEventListener('pointercancel', endPointer);
  mapEl.addEventListener('wheel', e => {
    e.preventDefault();
    const r = mapEl.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0028));
    else {
      const f = e.deltaMode === 1 ? 18 : 1;
      cam.x -= e.deltaX * f;
      cam.y -= e.deltaY * f;
      camAnim++;
      applyCam();
    }
  }, { passive: false });

  function nodeClick(id) {
    if (id === S.sel && hasKids(N[id]) && id !== S.view) toggleOpen(id);
    else go(id);
  }

  $('#zoomIn').onclick = () => zoomAt(mapEl.clientWidth / 2, mapEl.clientHeight / 2, 1.25);
  $('#zoomOut').onclick = () => zoomAt(mapEl.clientWidth / 2, mapEl.clientHeight / 2, 0.8);
  $('#fit').onclick = fitAll;
  $('#expandAll').onclick = () => {
    const base = S.sel === 'root' || !hasKids(N[S.sel]) ? S.view : S.sel;
    S.open.add(base);
    pathDesc(base).forEach(id => { if (hasKids(N[id])) S.open.add(id); });
    pathOf(base).forEach(id => S.open.add(id));
    layoutMap({ fit: true });
    toast(base === S.view ? 'Розгорнуто всю мапу' : `Розгорнуто гілку «${titleOf(base)}»`);
  };
  $('#collapseAll').onclick = () => {
    S.open = new Set([S.view]);
    layoutMap({ fit: true });
  };
  const autoBtn = $('#autoCollapse');
  function syncAutoBtn() { autoBtn.setAttribute('aria-pressed', String(S.auto)); }
  autoBtn.onclick = () => {
    S.auto = !S.auto;
    store.set('auto', S.auto);
    syncAutoBtn();
    toast(S.auto ? 'Авто-згортання увімкнено: відкрита лише гілка поточної теми' : 'Авто-згортання вимкнено: гілки лишаються розгорнутими');
  };

  function renderMapCrumbs() {
    const el = $('#mapCrumbs');
    if (S.view === 'root') {
      el.innerHTML = `<b>🗺 Уся мапа</b>${S.sel !== 'root' && hasKids(N[S.sel]) ? `<span class="sep">·</span><button data-focus="${S.sel}" title="Показати на мапі лише цю гілку">🎯 Фокус: ${esc(titleOf(S.sel))}</button>` : ''}`;
    } else {
      const p = pathOf(S.view);
      el.innerHTML = p.map((id, i) => i === p.length - 1
        ? `<b>🎯 ${esc(titleOf(id))}</b>`
        : `<button data-focus="${id}">${id === 'root' ? '🗺 Уся мапа' : esc(titleOf(id))}</button><span class="sep">›</span>`).join('');
    }
  }
  $('#mapCrumbs').addEventListener('click', e => {
    const b = e.target.closest('[data-focus]');
    if (b) focusView(b.dataset.focus);
  });

  // ---------------------------------------------------------------- outline
  function buildOutline() {
    const rec = n => `<li data-id="${n.id}"><div class="o-row" data-id="${n.id}" style="--h:${n.hue}">` +
      `<span class="o-car">${hasKids(n) ? '▶' : ''}</span>${n.depth === 1 ? '<span class="o-dot"></span>' : ''}` +
      `<span class="o-t">${esc(n.t)}</span><span class="o-chk">✓</span><span class="o-lvl">${n.lvl}</span></div>` +
      (hasKids(n) ? `<ul>${n.kids.map(rec).join('')}</ul>` : '') + '</li>';
    treeEl.innerHTML = `<ul><li data-id="root"><div class="o-row" data-id="root" style="--h:215"><span class="o-car"></span><span class="o-t"><b>${esc(ROOT.t)}</b></span></div></li>${ROOT.kids.map(rec).join('')}</ul>`;
    $('#outlineCount').textContent = `${ORDER.length - 1} тем`;
  }
  function syncOutline() {
    pathOf(S.sel).forEach(id => S.oOpen.add(id));
    treeEl.querySelectorAll('li[data-id]').forEach(li => li.classList.toggle('o-open', S.oOpen.has(li.dataset.id)));
    let selRow = null;
    treeEl.querySelectorAll('.o-row').forEach(r => {
      const id = r.dataset.id;
      const n = N[id];
      r.classList.toggle('o-sel', id === S.sel);
      r.classList.toggle('o-learned', S.learned.has(id));
      r.classList.toggle('o-dim', LV[n.lvl] > LV[S.level]);
      if (id === S.sel) selRow = r;
    });
    if (selRow && app.classList.contains('with-outline')) selRow.scrollIntoView({ block: 'nearest' });
  }
  treeEl.addEventListener('click', e => {
    const row = e.target.closest('.o-row');
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.closest('.o-car') && hasKids(N[id])) {
      if (S.oOpen.has(id)) S.oOpen.delete(id); else S.oOpen.add(id);
      row.parentElement.classList.toggle('o-open', S.oOpen.has(id));
      return;
    }
    go(id);
    if (isMobile()) toggleOutline(false);
  });
  function toggleOutline(force) {
    const on = force === undefined ? !app.classList.contains('with-outline') : force;
    app.classList.toggle('with-outline', on);
    if (!isMobile()) store.set('outline', on);
    if (on) syncOutline();
    if (!isMobile()) setTimeout(() => layoutMap({ instant: true, focus: S.sel }), 30);
  }
  $('#btnOutline').onclick = () => toggleOutline();

  // ---------------------------------------------------------------- detail
  const TABS = [
    { key: 'rule', label: () => '📘 Правило', has: n => !!n.rule },
    { key: 'ua', label: () => '🔁 Укр. ↔ пол.', has: n => !!n.ua },
    { key: 'tbl', label: () => '📊 Таблиці', has: n => !!n.tbl },
    { key: 'ex', label: n => `💬 Приклади<span class="cnt">${n.ex.length}</span>`, has: n => !!(n.ex && n.ex.length) },
    { key: 'trap', label: () => '⚠️ Пастки', has: n => !!n.trap },
    { key: 'quiz', label: n => `🧠 Перевірка<span class="cnt">${n.quiz.length}</span>`, has: n => !!(n.quiz && n.quiz.length) },
    { key: 'llm', label: () => '🤖 Запитати LLM', has: () => true },
  ];

  function renderDetail() {
    const n = N[S.sel];
    const tabs = TABS.filter(t => t.has(n));
    const tab = tabs.some(t => t.key === S.tab) ? S.tab : tabs[0].key;
    const path = pathOf(n.id);
    const i = ORDER.indexOf(n.id);
    const prev = ORDER[i - 1];
    const next = ORDER[i + 1];
    const learned = S.learned.has(n.id);
    const branch = n.branch ? N[n.branch] : null;
    detailEl.style.setProperty('--h', n.hue);
    detailEl.innerHTML =
      `<div class="d-head">
        <nav class="crumbs">${path.slice(0, -1).map(id => `<a href="#${id === 'root' ? '' : id}" data-go="${id}">${esc(titleOf(id))}</a><span>›</span>`).join('')}</nav>
        <div class="d-titlebar">
          <div class="d-titles">
            <h1>${esc(n.t)}</h1>
            <div class="d-sub">${n.pl ? `<span class="d-pl">${esc(n.pl)}</span>` : ''}<span class="lvl ${n.lvl}" title="Рівень, на якому тема з’являється">${n.lvl}</span>${branch && branch !== n ? `<span class="d-branch">${esc(branch.t)}</span>` : ''}</div>
          </div>
          <div class="d-actions">
            ${n.id !== 'root' ? `<button class="btn ${learned ? 'on' : ''}" data-act="learn" title="Позначити тему як вивчену (L)">${learned ? '✓ Вивчено' : '○ Вивчено?'}</button>` : ''}
            ${hasKids(n) && n.id !== 'root' ? '<button class="btn" data-act="focus" title="Показати на мапі лише цю гілку">🎯 Гілка</button>' : ''}
            <button class="btn primary" data-act="copy" title="Скопіювати контекст теми для ChatGPT / Claude (C)">🤖 Копіювати для LLM</button>
          </div>
        </div>
        ${n.sum ? `<p class="d-sum">${inline(dedent(n.sum).join(' ').trim())}</p>` : ''}
        <div class="tabs" role="tablist">${tabs.map(t => `<button class="tab" role="tab" data-tab="${t.key}" aria-selected="${t.key === tab}">${t.label(n)}</button>`).join('')}</div>
      </div>
      <div class="d-body" id="dbody">${renderTab(n, tab)}</div>
      <div class="d-foot">
        ${prev ? `<button class="btn" data-go="${prev}" title="Попередня тема (P)"><span>← ${esc(titleOf(prev))}</span></button>` : '<span></span>'}
        ${next ? `<button class="btn" data-go="${next}" title="Наступна тема (N)"><span>${esc(titleOf(next))} →</span></button>` : '<span></span>'}
      </div>`;
    if (tab === 'ex') applyExFilter();
    if (tab === 'llm') updateLlmPreview();
  }

  function renderTab(n, tab) {
    switch (tab) {
      case 'rule': return `<div class="md">${md(n.rule)}</div>${renderKids(n)}${renderRelated(n)}`;
      case 'ua': return `<div class="md">${md(n.ua)}</div>`;
      case 'tbl': return `<div class="md">${md(n.tbl)}</div>`;
      case 'trap': return `<div class="md">${md(n.trap)}</div>`;
      case 'ex': return renderExamples(n);
      case 'quiz': return renderQuiz(n);
      case 'llm': return renderLlm(n);
      default: return '';
    }
  }

  function renderKids(n) {
    if (!hasKids(n)) return '';
    return `<div class="kids"><h3>Підтеми (${n.kids.length})</h3><div class="kid-grid">${n.kids.map(k =>
      `<div class="kid ${S.learned.has(k.id) ? 'learned' : ''}" role="button" tabindex="0" data-go="${k.id}" style="--h:${k.hue}">` +
      `<span class="lvl ${k.lvl}">${k.lvl}</span><b>${esc(k.t)}</b>${k.pl ? `<em>${esc(k.pl)}</em>` : ''}<small>${esc(bare(k.sum))}</small></div>`).join('')}</div></div>`;
  }

  function renderRelated(n) {
    const own = new Set([n.id, P[n.id], ...(n.kids || []).map(k => k.id)]);
    const found = [];
    const scan = s => { for (const m of String(s || '').matchAll(/\[\[([a-z0-9-]+)/g)) if (N[m[1]] && !own.has(m[1]) && !found.includes(m[1])) found.push(m[1]); };
    ['sum', 'rule', 'ua', 'tbl', 'trap'].forEach(f => scan(n[f]));
    (n.ex || []).forEach(e => e.forEach(scan));
    if (!found.length) return '';
    return `<div class="related"><h3>Пов’язані теми</h3><div class="chips">${found.map(id =>
      `<button class="chip" data-go="${id}" style="--h:${N[id].hue}" title="${esc(pathOf(id).slice(1).map(titleOf).join(' › '))}">${esc(titleOf(id))}</button>`).join('')}</div></div>`;
  }

  function renderExamples(n) {
    return `<div class="ex-tools">
        <input type="search" id="exFilter" placeholder="Фільтр прикладів (польською чи українською)…" value="${esc(S.exFilter)}">
        <label title="Тренування: переклади сам, потім клацни, щоб відкрити"><input type="checkbox" data-opt="hideUA" ${S.hideUA ? 'checked' : ''}> сховати переклад</label>
        <label title="Тренування навпаки: з української на польську"><input type="checkbox" data-opt="hidePL" ${S.hidePL ? 'checked' : ''}> сховати польське</label>
        <span class="ex-count" id="exCount"></span>
      </div>
      <ol class="ex-list ${S.hideUA ? 'hide-ua' : ''} ${S.hidePL ? 'hide-pl' : ''}" id="exList">${n.ex.map((e, i) =>
        `<li class="ex" data-i="${i}">
          <div class="ex-pl"><span class="tag pl">PL</span><span class="txt">${inline(e[0])}</span></div>
          <div class="ex-ua"><span class="tag ua">UA</span><span class="txt">${inline(e[1])}</span></div>
          ${e[2] ? `<div class="ex-note">${inline(e[2])}</div>` : ''}
          <div class="ex-btns">${canSpeak ? `<button class="mini" data-act="speak" data-i="${i}" title="Прослухати польською">🔊</button>` : ''}<button class="mini" data-act="ex-ask" data-i="${i}" title="Скопіювати запит до LLM: розібрати це речення">🤖</button></div>
        </li>`).join('')}</ol>`;
  }

  function applyExFilter() {
    const list = $('#exList');
    if (!list) return;
    const q = norm(S.exFilter.trim());
    const n = N[S.sel];
    let shown = 0;
    list.querySelectorAll('.ex').forEach(li => {
      const e = n.ex[+li.dataset.i];
      const ok = !q || q.split(/\s+/).every(t => norm(e.map(bare).join(' ')).includes(t));
      li.classList.toggle('filtered-out', !ok);
      if (ok) shown++;
    });
    const c = $('#exCount');
    if (c) c.textContent = q ? `${shown} з ${n.ex.length}` : `${n.ex.length} прикладів`;
  }

  function renderQuiz(n) {
    return `<div class="quiz-tools">
        <button class="btn" data-act="quiz-shuffle">🔀 Перемішати</button>
        <button class="btn" data-act="quiz-all">👁 Показати / сховати всі</button>
        <label>Спершу дай відповідь сам — потім клацни по картці.</label>
      </div>
      <ol class="quiz" id="quizList">${n.quiz.map((q, i) =>
        `<li class="qz" data-i="${i}"><div class="qz-q">${inline(q[0])}</div><div class="qz-hint">клацни, щоб побачити відповідь</div><div class="qz-a">${inline(q[1])}</div>
        <button class="mini" data-act="quiz-ask" data-i="${i}" title="Скопіювати запит до LLM: пояснити це завдання">🤖</button></li>`).join('')}</ol>`;
  }

  function renderLlm(n) {
    const o = S.llmOpts;
    const opt = (k, label, avail) => avail ? `<label><input type="checkbox" data-llm="${k}" ${o[k] ? 'checked' : ''}> ${label}</label>` : '';
    return `<div class="llm">
      <p class="lead">Кнопка збирає <b>готовий промпт</b>: хто ти (носій української, системний підхід, ціль — B1), як відповідати, конспект цієї теми й твоє запитання. Встав його в ChatGPT, Claude чи інший чат — і контекст уже заданий.</p>
      <label class="big" for="llmQ">Твоє запитання</label>
      <textarea id="llmQ" placeholder="Напр.: Чому тут родовий, а не знахідний? Або встав своє речення для перевірки.">${esc(S.question)}</textarea>
      <div class="presets">${PRESETS.map((p, i) => `<button class="preset" data-preset="${i}" title="${esc(p[1])}">${p[0]}</button>`).join('')}</div>
      <div class="llm-opts"><b>Додати до контексту:</b>
        ${opt('rule', 'правило', !!n.rule)}${opt('ua', 'порівняння з укр.', !!n.ua)}${opt('trap', 'пастки', !!n.trap)}
        ${opt('ex', 'приклади (до 12)', !!(n.ex && n.ex.length))}${opt('tbl', 'таблиці', !!n.tbl)}${opt('quiz', 'завдання', !!(n.quiz && n.quiz.length))}
      </div>
      <div class="llm-go"><button class="btn primary" data-act="copy">📋 Скопіювати промпт</button><span class="count" id="llmCount"></span></div>
      <details><summary>Попередній перегляд промпту</summary><pre id="llmPreview"></pre></details>
    </div>`;
  }
  function updateLlmPreview() {
    const pre = $('#llmPreview');
    if (!pre) return;
    const text = buildPrompt(N[S.sel], S.question);
    pre.textContent = text;
    const c = $('#llmCount');
    if (c) c.textContent = `≈ ${text.length.toLocaleString('uk-UA')} символів`;
  }

  detailEl.addEventListener('click', e => {
    const t = e.target;
    const goEl = t.closest('[data-go]');
    if (goEl) {
      e.preventDefault();
      go(goEl.dataset.go);
      return;
    }
    const tabEl = t.closest('[data-tab]');
    if (tabEl) {
      S.tab = tabEl.dataset.tab;
      store.set('tab', S.tab);
      renderDetail();
      return;
    }
    const preset = t.closest('[data-preset]');
    if (preset) {
      S.question = PRESETS[+preset.dataset.preset][1];
      store.set('question', S.question);
      const ta = $('#llmQ');
      if (ta) ta.value = S.question;
      updateLlmPreview();
      copyPrompt(buildPrompt(N[S.sel], S.question), 'промпт');
      return;
    }
    const act = t.closest('[data-act]');
    if (act) {
      const n = N[S.sel];
      switch (act.dataset.act) {
        case 'learn': toggleLearned(n.id); break;
        case 'focus': focusView(n.id); break;
        case 'copy': copyPrompt(buildPrompt(n, S.question), 'контекст теми'); break;
        case 'speak': speak(n.ex[+act.dataset.i][0]); break;
        case 'ex-ask': copyPrompt(examplePrompt(n, n.ex[+act.dataset.i]), 'запит про речення'); break;
        case 'quiz-ask': e.stopPropagation(); copyPrompt(quizPrompt(n, n.quiz[+act.dataset.i]), 'запит про завдання'); break;
        case 'quiz-all': {
          const items = detailEl.querySelectorAll('.qz');
          const anyHidden = [...items].some(q => !q.classList.contains('show'));
          items.forEach(q => q.classList.toggle('show', anyHidden));
          break;
        }
        case 'quiz-shuffle': {
          const ol = $('#quizList');
          const items = [...ol.children];
          for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
          }
          items.forEach(li => { li.classList.remove('show'); ol.appendChild(li); });
          break;
        }
      }
      return;
    }
    const qz = t.closest('.qz');
    if (qz) { qz.classList.toggle('show'); return; }
    const exTxt = t.closest('.ex .txt, .ex .ex-note');
    if (exTxt) {
      const li = exTxt.closest('.ex');
      const list = li.parentElement;
      if (list.classList.contains('hide-ua') || list.classList.contains('hide-pl')) li.classList.toggle('revealed');
    }
  });
  detailEl.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.kid[data-go]')) {
      e.preventDefault();
      go(e.target.dataset.go);
    }
  });
  detailEl.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'exFilter') { S.exFilter = t.value; applyExFilter(); }
    if (t.id === 'llmQ') { S.question = t.value; store.set('question', S.question); updateLlmPreview(); }
  });
  detailEl.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.opt) {
      S[t.dataset.opt] = t.checked;
      const list = $('#exList');
      if (list) {
        list.classList.toggle('hide-ua', S.hideUA);
        list.classList.toggle('hide-pl', S.hidePL);
        list.querySelectorAll('.revealed').forEach(li => li.classList.remove('revealed'));
      }
    }
    if (t.dataset.llm) {
      S.llmOpts[t.dataset.llm] = t.checked;
      store.set('llmOpts', S.llmOpts);
      updateLlmPreview();
    }
  });

  function toggleLearned(id) {
    if (id === 'root') return;
    if (S.learned.has(id)) S.learned.delete(id); else S.learned.add(id);
    store.set('learned', [...S.learned]);
    renderDetail();
    syncOutline();
    updateProgress();
    const el = els.get(id);
    if (el) el.classList.toggle('learned', S.learned.has(id));
    if (S.learned.has(id)) toast('✓ Тему позначено як вивчену');
  }

  function updateProgress() {
    const total = ORDER.length - 1;
    const done = S.learned.size;
    $('#progress').innerHTML = `<span>✓ ${done} / ${total}</span><span class="bar"><i style="width:${total ? (100 * done / total).toFixed(1) : 0}%"></i></span>`;
  }

  // ---------------------------------------------------------------- search
  const FIELD_W = [['t', 24], ['pl', 18], ['sum', 7], ['rule', 3], ['ua', 3], ['tbl', 2], ['ex', 2], ['trap', 2], ['quiz', 1]];
  const FIELD_TAB = { t: 'rule', pl: 'rule', sum: 'rule', rule: 'rule', ua: 'ua', tbl: 'tbl', ex: 'ex', trap: 'trap', quiz: 'quiz' };
  let results = [];
  let resActive = -1;
  function countOcc(h, t) {
    let c = 0, i = h.indexOf(t);
    while (i !== -1 && c < 20) { c++; i = h.indexOf(t, i + t.length); }
    return c;
  }
  function snippet(f, nf, tok) {
    const pos = nf.indexOf(tok);
    if (pos < 0) return esc(f.slice(0, 140));
    const a = Math.max(0, pos - 60);
    const b = Math.min(f.length, pos + tok.length + 90);
    return (a > 0 ? '…' : '') + esc(f.slice(a, pos)) + '<mark>' + esc(f.slice(pos, pos + tok.length)) + '</mark>' + esc(f.slice(pos + tok.length, b)) + (b < f.length ? '…' : '');
  }
  function runSearch() {
    const raw = qInput.value.trim();
    const q = norm(raw);
    if (q.length < 2) { resultsEl.hidden = true; results = []; return; }
    const all = q.split(/\s+/).filter(Boolean);
    const toks = all.length > 1 ? all.filter(t => t.length > 1) : all;
    const phrase = all.join(' ');
    results = [];
    for (const id of ORDER) {
      const ix = IDX[id];
      if (!toks.every(t => ix.all.includes(t))) continue;
      let score = 0;
      let firstField = null;
      let exactField = null;
      for (const [f, w] of FIELD_W) {
        const c = toks.reduce((s, t) => s + countOcc(ix.nf[f], t), 0);
        const exact = all.length > 1 ? countOcc(ix.nf[f], phrase) : 0;
        if (c && !firstField) firstField = f;
        if (exact && !exactField) exactField = f;
        score += w * Math.min(c, 6) + w * 12 * Math.min(exact, 3);
      }
      results.push({ id, score, field: exactField || firstField, phrase: !!exactField });
    }
    results.sort((a, b) => b.score - a.score);
    results = results.slice(0, 40);
    resActive = results.length ? 0 : -1;
    resultsEl.innerHTML = results.length
      ? results.map((r, i) => {
        const ix = IDX[r.id];
        const f = r.field && !['t', 'pl'].includes(r.field) ? r.field : 'sum';
        const tok = r.phrase && ix.nf[f].includes(phrase) ? phrase : (toks.find(t => ix.nf[f].includes(t)) || toks[0]);
        return `<button class="res ${i === resActive ? 'active' : ''}" data-i="${i}"><b>${esc(titleOf(r.id))}</b>${N[r.id].pl ? ` <i>· ${esc(N[r.id].pl)}</i>` : ''}` +
          `<div class="res-path">${esc(pathOf(r.id).slice(1, -1).map(titleOf).join(' › ') || 'Корінь')}${r.field ? ` · знайдено: ${({ t: 'назва', pl: 'термін', sum: 'суть', rule: 'правило', ua: 'порівняння', tbl: 'таблиці', ex: 'приклади', trap: 'пастки', quiz: 'перевірка' })[r.field]}` : ''}</div>` +
          `<div class="res-snip">${snippet(ix.f[f], ix.nf[f], tok)}</div></button>`;
      }).join('')
      : `<div class="res-empty">Нічого не знайдено за «${esc(raw)}». Спробуй інше слово або без діакритики (zolw → żółw).</div>`;
    resultsEl.hidden = false;
  }
  function openResult(i) {
    const r = results[i];
    if (!r) return;
    const tab = FIELD_TAB[r.field] || 'rule';
    resultsEl.hidden = true;
    go(r.id, { tab, exFilter: tab === 'ex' ? qInput.value.trim() : '' });
    qInput.blur();
  }
  let searchTimer = 0;
  qInput.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 110); });
  qInput.addEventListener('focus', () => { if (results.length && qInput.value.trim().length >= 2) resultsEl.hidden = false; });
  qInput.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!results.length) return;
      resActive = (resActive + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      resultsEl.querySelectorAll('.res').forEach((b, i) => b.classList.toggle('active', i === resActive));
      const a = resultsEl.querySelector('.res.active');
      if (a) a.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      openResult(resActive >= 0 ? resActive : 0);
    } else if (e.key === 'Escape') {
      resultsEl.hidden = true;
      qInput.blur();
    }
  });
  resultsEl.addEventListener('mousedown', e => {
    const b = e.target.closest('.res');
    if (b) { e.preventDefault(); openResult(+b.dataset.i); }
  });
  document.addEventListener('mousedown', e => { if (!e.target.closest('.search')) resultsEl.hidden = true; });

  // ---------------------------------------------------------------- header controls
  function syncLevels() {
    document.querySelectorAll('.levels [data-lv]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lv === S.level)));
  }
  document.querySelector('.levels').addEventListener('click', e => {
    const b = e.target.closest('[data-lv]');
    if (!b) return;
    S.level = b.dataset.lv;
    store.set('level', S.level);
    syncLevels();
    layoutMap({ instant: true });
    syncOutline();
    toast(S.level === 'B1' ? 'Показано всі теми до B1' : `Теми вище рівня ${S.level} приглушено`);
  });

  function applyTheme(t) {
    if (t) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  applyTheme(store.get('theme', null));
  $('#btnTheme').onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    store.set('theme', next);
  };
  const help = $('#help');
  $('#btnHelp').onclick = () => { help.hidden = false; };
  help.addEventListener('click', e => { if (e.target === help || e.target.closest('.close')) help.hidden = true; });
  document.querySelector('.brand').onclick = () => go('root');

  // ---------------------------------------------------------------- resizer
  (function () {
    const rz = $('#resizer');
    const saved = store.get('dw', null);
    if (saved) app.style.setProperty('--dw', saved + 'px');
    let startX = 0, startW = 0, active = false;
    rz.addEventListener('pointerdown', e => {
      active = true;
      startX = e.clientX;
      startW = detailEl.getBoundingClientRect().width;
      rz.classList.add('drag');
      rz.setPointerCapture(e.pointerId);
    });
    rz.addEventListener('pointermove', e => {
      if (!active) return;
      const w = clamp(startW - (e.clientX - startX), 380, window.innerWidth - 420);
      app.style.setProperty('--dw', w + 'px');
    });
    const end = () => {
      if (!active) return;
      active = false;
      rz.classList.remove('drag');
      store.set('dw', Math.round(detailEl.getBoundingClientRect().width));
      layoutMap({ instant: true, focus: S.sel });
    };
    rz.addEventListener('pointerup', end);
    rz.addEventListener('pointercancel', end);
  })();

  // ---------------------------------------------------------------- keyboard
  document.addEventListener('keydown', e => {
    const inField = e.target.closest('input, textarea, select, [contenteditable]');
    if (e.key === 'Escape') {
      if (!help.hidden) { help.hidden = true; return; }
      resultsEl.hidden = true;
      if (isMobile() && app.classList.contains('with-outline')) toggleOutline(false);
      return;
    }
    if (inField || e.ctrlKey || e.metaKey || e.altKey) return;
    const onMap = document.activeElement === mapEl;
    const n = N[S.sel];
    if (e.key === '/') { e.preventDefault(); qInput.focus(); qInput.select(); return; }
    if (e.key === '?') { help.hidden = !help.hidden; return; }
    if (onMap && e.key === 'ArrowRight') { e.preventDefault(); if (hasKids(n)) go(n.kids[0].id); return; }
    if (onMap && e.key === 'ArrowLeft') {
      e.preventDefault();
      if (S.open.has(n.id) && hasKids(n) && n.id !== S.view) toggleOpen(n.id);
      else if (P[n.id]) go(P[n.id], { expand: true });
      return;
    }
    if (onMap && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const sibs = P[n.id] ? N[P[n.id]].kids : [n];
      const j = sibs.indexOf(n) + (e.key === 'ArrowDown' ? 1 : -1);
      if (sibs[j]) go(sibs[j].id, { expand: false });
      return;
    }
    if (onMap && e.key === 'Enter') { if (hasKids(n)) toggleOpen(n.id); return; }
    switch (e.key.toLowerCase()) {
      case 'n': stepOrder(1); break;
      case 'p': stepOrder(-1); break;
      case 'l': toggleLearned(n.id); break;
      case 'c': copyPrompt(buildPrompt(n, S.question), 'контекст теми'); break;
      case 'f': fitAll(); break;
      case 'o': toggleOutline(); break;
      case '+': case '=': zoomAt(mapEl.clientWidth / 2, mapEl.clientHeight / 2, 1.2); break;
      case '-': zoomAt(mapEl.clientWidth / 2, mapEl.clientHeight / 2, 0.83); break;
      default:
        if (/^[1-7]$/.test(e.key)) {
          const tabs = TABS.filter(t => t.has(n));
          const t = tabs[+e.key - 1];
          if (t) { S.tab = t.key; store.set('tab', S.tab); renderDetail(); }
        }
    }
  });

  // ---------------------------------------------------------------- render all & boot
  function renderAll(opts = {}) {
    layoutMap(opts);
    renderDetail();
    syncOutline();
    updateProgress();
    renderMapCrumbs();
  }

  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent(location.hash.slice(1)) || 'root';
    if (id !== S.sel && N[id]) go(id, { fromHash: true });
  });
  window.addEventListener('popstate', () => {
    const id = decodeURIComponent(location.hash.slice(1)) || 'root';
    if (id !== S.sel && N[id]) go(id, { fromHash: true });
  });
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => layoutMap({ instant: true, focus: S.sel }), 120);
  });

  buildOutline();
  syncLevels();
  syncAutoBtn();
  if (!isMobile() && store.get('outline', window.innerWidth >= 1500)) app.classList.add('with-outline');
  document.addEventListener('click', e => {
    if (isMobile() && app.classList.contains('with-outline') && !e.target.closest('#outline, #btnOutline')) toggleOutline(false);
  });
  const startId = decodeURIComponent(location.hash.slice(1));
  if (startId && N[startId]) go(startId, { fromHash: true });
  else renderAll({ fit: true, instant: true });
  if (canSpeak) window.speechSynthesis.getVoices();
  window.PLGRAM = { N, md, inline, go, buildPrompt };
})();
