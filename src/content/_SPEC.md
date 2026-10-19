# Polish grammar mindmap (A1–B1) for Ukrainian speakers — CONTENT SPEC

## 1. What we are building

A single-page HTML **mindmap of Polish grammar up to B1**, written for a **native Ukrainian speaker** who learns
**systematically** — through understanding structure, rules, paradigms and exceptions, not "by ear".

Every node of the map opens a detail panel with tabs:

| field  | tab title in UI                    | purpose |
|--------|------------------------------------|---------|
| `rule` | 📘 Система і правило               | the systematic explanation |
| `ua`   | 🇺🇦 Порівняння з українською        | deep, concrete comparison with Ukrainian |
| `tbl`  | 📊 Таблиці                         | paradigms / reference tables |
| `ex`   | 💬 Приклади                        | many example sentences PL + UA |
| `trap` | ⚠️ Пастки                          | typical mistakes of Ukrainian speakers |
| `quiz` | 🧠 Самоперевірка                   | self-check cards (prompt → answer) |

The UI also has a **"copy context for an LLM"** button that pastes the node's `sum + rule + ua + trap + examples`
into ChatGPT/Claude. So every node must be **self-explanatory, precise and correct**.

You write **one content file** (your branch). The engine (renderer) is written separately. **Do not touch other files.**
Do not use the internet; write from your own knowledge.

## 2. Audience, language, tone

- Reader: adult native Ukrainian, analytical; wants systems, tables, decision trees, rules + exception lists. Level A1→B1.
- **Explanations in Ukrainian** — literary standard (правопис 2019), no russisms or surzhyk, Ukrainian linguistic
  terminology: називний, родовий, давальний, знахідний, орудний, місцевий, кличний; доконаний/недоконаний вид;
  дієприкметник, дієприслівник; особово-чоловічий рід (męskoosobowy) / неособово-чоловічий (niemęskoosobowy); etc.
  Give the Polish term in parentheses at first mention: «родовий відмінок (dopełniacz)».
- **Polish**: modern standard norm (RJP / WSJP), correct diacritics (ą ć ę ł ń ó ś ź ż). Mark register where it matters:
  *(розм.)* colloquial, *(книжн.)* bookish, *(офіц.)* formal. When the norm allows variants, say so
  (e.g. **pokoi / pokojów**, **w Ukrainie / na Ukrainie**).
- **Depth, not surface.** Explain *why* (the system, the alternation logic, a short historical parallel with Ukrainian when
  it helps memory). Never "just memorize" without giving structure.
- **Ukrainian parallels are the core value.** Show the parallel Ukrainian form side by side, and say precisely what matches
  (✅) and what differs (⚠️). Ukrainian and Polish share a huge amount — exploit it, but flag false friends.
- **Accuracy is critical.** Never invent forms. If you are not sure about a form/usage/translation, use a different example.
  Double-check endings, consonant alternations, aspect pairs, genders, and translations.

## 3. File format

A plain JavaScript file in `src/content/` that pushes branch object(s) into `window.PL_DATA`:

```js
/* Branch: Відмінки (case) — file 02-cases.js */
(window.PL_DATA = window.PL_DATA || []).push({
  ord: 2,                       // top-level branch order (given in the outline below)
  id: 'case',
  t: 'Відмінки',
  pl: 'Przypadki',
  lvl: 'A1',
  sum: `...`,
  rule: `...`,
  ua: `...`,
  tbl: `...`,
  ex: [
    ["Nie mam ==czasu==.", "Не маю ==часу==.", "Р. після заперечення"],
  ],
  trap: `...`,
  quiz: [
    ["Перекладіть: «Я не п’ю кави».", "Nie piję ==kawy==. (Р. після заперечення)"],
  ],
  kids: [
    { id: 'case-nom', t: '...', /* same shape, may have its own kids */ },
    // @@NEXT@@
  ],
});
```

Nodes that hang under a node of **another** file use `parent` instead of `ord` (only branch H — see outline), and may carry
`o` (order number among siblings):

```js
(window.PL_DATA = window.PL_DATA || []).push(
  { parent: 'verb', o: 50, id: 'asp', t: 'Вид дієслова', /* ... */ kids: [ /* ... */ ] },
  { parent: 'verb', o: 100, id: 'mot', /* ... */ },
);
```

### String rules (JS safety — violations break the whole page)
- Markdown fields (`sum`, `rule`, `ua`, `tbl`, `trap`) are **template literals** (backticks). Inside them **never** use a
  backtick character and never write `${`.
- `ex` and `quiz` items are **double-quoted** strings. Inside them never use a straight double quote `"` — use «…» or „…”.
- Never use single-quoted strings for text (Ukrainian apostrophes would break them). Ids may be single-quoted.
- Ukrainian apostrophe: either ’ or ' is fine inside template literals / double-quoted strings.

### Writing a big file
Your file will be large (roughly 150–300 KB). **Write it incrementally**: first `Write` the file with the branch root node
and a `// @@NEXT@@` marker inside `kids: [ ... ]`, then add nodes one by one with `Edit`, replacing `// @@NEXT@@` with
`{ ...node... },\n    // @@NEXT@@`. Keep each Write/Edit call under ~40 000 characters (one node per call is a good rhythm).
For nested kids use a separate marker, e.g. `// @@NEXT-verb-pres@@`. Markers are comments; you may leave or remove them.

## 4. Node fields

| field  | type | required | notes |
|--------|------|----------|-------|
| `id`   | string | yes | lowercase `a-z0-9-`, use the ids from the outline; extra nodes must use your branch prefix |
| `t`    | string | yes | **short** Ukrainian title, ≤ 40 chars (shown on the map) |
| `pl`   | string | no  | Polish term, e.g. `Dopełniacz` |
| `lvl`  | `'A1'`/`'A2'`/`'B1'` | yes | level at which this topic is introduced |
| `sum`  | md (template) | yes | 1–2 sentences: the essence (shown on hover & in LLM context) |
| `rule` | md | yes | systematic explanation (see quality bar) |
| `ua`   | md | yes | comparison with Ukrainian: ✅ збігається / ⚠️ відрізняється / 💡 мнемоніка |
| `tbl`  | md | for morphology nodes | paradigm tables, reference tables |
| `ex`   | array | yes | `["PL", "UA"]` or `["PL", "UA", "short note"]` |
| `trap` | md | yes for leaves | list of typical mistakes, format below |
| `quiz` | array | yes for leaves | `["prompt", "answer"]` |
| `kids` | array | no | child nodes |
| `ord` / `parent` / `o` | | | branch placement (see §3) |

## 5. Markdown subset — the engine renders ONLY this

Block level (each block separated by an empty line):
- `### Heading` and `#### Subheading` (use these; `##` is rendered like `###`)
- paragraphs (single line breaks inside a paragraph are preserved as line breaks)
- bullet lists `- item`, nested with two-space indent `  - sub`; numbered lists `1. item`
- tables, GitHub style, **header row + separator row required**:
  ```
  | Відмінок | Однина | Множина |
  |---|---|---|
  | D (Р) | stoł==u== | stoł==ów== |
  ```
  A literal pipe inside a cell: `\|`. Keep tables ≤ 6 columns where possible (they must fit a ~700px panel).
- callouts — consecutive lines with the same prefix form one box:
  - `> text` — note (blue)
  - `>! text` — warning / trap (red)
  - `>+ text` — key insight / mnemonic (green 💡)
- `---` horizontal rule

Inline:
- `**bold**` — **Polish words/forms** (convention: Polish in bold)
- `*italic*` — *Ukrainian words/forms* (convention: Ukrainian in italic)
- `==highlight==` — endings, alternating letters, the key part: **stoł==u==**, *стол==у==*, **rę==c==e** / *ру==ц==і*
- `~~strike~~` — incorrect form: ~~Widzę tych kobiet~~
- cross-links to other nodes: `[[case-gen]]` (shows that node's title) or `[[case-gen|родовий відмінок]]`
  — use only ids from the master outline (§8) or ids you create yourself.
- No HTML tags, no backticks, no links to the web, no images.

Examples (`ex`): inline markdown works inside them. Use `==…==` to highlight the target forms **in both** the Polish and the
Ukrainian sentence when there is a parallel. Do not bold the whole Polish sentence.

## 6. Conventions

- Case labels in tables, always in this order and form:
  `M (Н)`, `D (Р)`, `C (Д)`, `B (З)`, `N (О)`, `Ms (М)`, `W (Кл)` —
  mianownik/називний, dopełniacz/родовий, celownik/давальний, biernik/знахідний, narzędnik/орудний,
  miejscownik/місцевий, wołacz/кличний. In prose use full Ukrainian names (родовий відмінок) or short «Р.», «З.», «Ms./М.».
- Gender labels: ч. / ж. / с.; plural: **ос.-чол.** (męskoosobowy) and **неос.-чол.** (niemęskoosobowy).
- Show Ukrainian parallels as: **dom==u==** — *дом==у==*; **rę==ce==** — *ру==ці==*.
- Use ✅ for "same as in Ukrainian", ⚠️ for "differs", ❌ / ✅ in traps.
- Mark sub-points above the node's level inline: «(B1)».
- Cross-link generously: every node should link to the related nodes (inside and outside your branch).

## 7. Quality bar

**Leaf node** (no kids):
- `rule`: 350–1000 words. Structure: what it is → the system (rules, decision tree) → forms → uses/functions → exceptions →
  short summary. Use headings, lists and callouts.
- `ua`: 200–600 words, concrete: parallel forms side by side; sections «✅ Що збігається», «⚠️ Що відрізняється»,
  «💡 Як запам’ятати» (mnemonics based on Ukrainian). Explain *why* the difference exists when it helps.
- `tbl`: 1–4 tables for morphology topics (full paradigms with a Ukrainian column/row where useful).
- `ex`: **15–30** natural, everyday sentences (A1–B1 vocabulary: родина, дім, робота, магазин, кафе, транспорт, місто,
  навчання, лікар, подорожі, погода, свята). Mix statements, questions, negations, dialogue lines (— …). Each illustrates the
  rule; highlight target forms with `==…==`; add a short note where it helps (why this form).
- `trap`: 6–12 items, format:
  `- ❌ ~~Nie lubię kawę~~ → ✅ **Nie lubię kawy** — після заперечення прямий додаток стоїть у Р. (в укр. можна обидва).`
- `quiz`: 8–15 cards: translation UA→PL, choose/fill the form, "why this case?", transform (sg→pl, impf→pf). Answer must
  contain the correct form **and** a 3–10-word reason.

**Overview node** (has kids): `rule` = how this part of grammar is organised: a map of the sub-topics with links
`[[...]]`, the logic connecting them, the 3–7 key principles, a compact summary table. 250–600 words.
`ua` 150–400 words (big-picture comparison). `ex` 6–12. `trap`/`quiz` optional (4–8 if present).

**Accuracy self-check before finishing**: re-read every table and example; verify endings and alternations; verify that each
Ukrainian translation is natural Ukrainian (not a calque of Polish) — when the natural Ukrainian differs structurally, that is
exactly what to point out in a note.

## 8. Validation (mandatory)

After writing, run (from the project root):

```
node src/tools/check.js src/content/<your-file>.js
```

Fix **all ERRORs**. Address WARNINGs (too few examples, unbalanced `**`/`==`, table column mismatch) unless clearly false.
Re-run until there are no errors. In your final message report: file name, node count, example count, and anything you were
unsure about.

---

## 9. Master outline

Top-level branches (`ord`): ph 1 · case 2 · noun 3 · pron 4 · adj 5 · adv 6 · num 7 · verb 8 · prep 9 · syn 10 · wf 11.
All ids (valid cross-link targets):

```
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
```

You may add extra child nodes inside your branch (ids with your prefix, e.g. `noun-masc-gen`) when a topic is too big for one
node — but every id listed for your branch must exist. The bullet points below are the **minimum** content; add more where
it helps the learner. (✅ = matches Ukrainian, ⚠️ = differs.)

---

### Branch A · `ph` — Фонетика і письмо · file `01-phonetics.js` · ord 1

- **ph** «Фонетика і письмо» / Fonetyka i pisownia, A1 — overview: why phonetics matters (Polish spelling is regular but not
  Ukrainian-like), map of subtopics, the idea of the «декодер» (regular UA↔PL sound correspondences let you guess thousands of
  words), the alternation system as the key to morphology.
- **ph-alphabet** «Алфавіт і диграфи» / Alfabet, A1 — 32 letters; letters absent in UA (ą ę ó ł ś ć ź ż ń); digraphs ch, cz,
  dz, dź, dż, rz, sz; szcz = *щ*; w = *в*; ł = [w] (like UA *в* in *вовк*, *був*); l = *ль*; y ≈ *и*; i = *і* + softening;
  j = *й*; c = *ц*; h = ch = *х*; e = *е* (not *є*); ó = u; rz = ż = *ж*; dż = *дж*; dz = *дз*. Table letter → UA approximation →
  example. q, v, x only in loanwords. Polish spelling of Ukrainian names/places: Шевченко → Szewczenko, Київ → Kijów,
  Львів → Lwów, Харків → Charków, Олена → Ołena, Юлія → Julia, Ярослав → Jarosław, Олександр → Ołeksandr, Тетяна → Tetiana.
- **ph-soft** «М’якість: ś ć ź dź ń» , A1 — two spellings of one sound: diacritic before a consonant / at word end vs. letter + i
  before a vowel (**ś**/si, **ć**/ci, **ź**/zi, **dź**/dzi, **ń**/ni); i alone = vowel + softness (**ciocia**); pairs s/ś/sz,
  z/ź/ż, c/ć/cz (**kasza** vs **Kasia**; **sześć**); soft labials pi/bi/mi/wi (**pies**, **biały**, **miasto**, **wiara**);
  UA parallels: *ті/ді/ть/дь* ↔ ci/dzi/ć/dź (*тихо* **cicho**, *діти* **dzieci**, *день* **dzień**, *тінь* **cień**);
  pronunciation advice for UA speakers (ś is softer than *сь*, closer to *щ*-like hiss; cz/sz are hard like UA ч/ш).
- **ph-nasal** «Носові ą, ę», A1 — pronunciation rules: before p/b → om/em (**ząb** [zomp], **gęba**), before t/d → on/en
  (**kąt**, **będę**), before k/g → [oŋ]/[eŋ] (**ręka**), before ć/dź → oń/eń (**pięć**), before ł/l → no nasality (**wziął**,
  **wzięli**), before fricatives → nasal vowel (**wąs**, **gęś**, **wąż**), word-final ę ≈ [e] (**idę**, **proszę**), final ą
  nasal. Correspondences: ą/ę ↔ *у/я*: **ręka** *рука*, **ząb** *зуб*, **dąb** *дуб*, **mąż** *муж*, **sąd** *суд*, **mięso**
  *м’ясо*, **pięć** *п’ять*, **imię** *ім’я*, **święto** *свято*, **język** *язик*, **pamięć** *пам’ять*, **ciężki** *тяжкий*.
  Grammar: 1 ос. одн. -ę ↔ *-у/-ю* (**piszę** *пишу*), 3 ос. мн. -ą ↔ *-уть* (**piszą** *пишуть*), З. ж. -ę ↔ *-у*
  (**kobietę** *жінку*), О. -ą ↔ *-ою* (**kobietą** *жінкою*), -nąć ↔ *-нути*. ą/ę alternation (**ząb–zęby**, **mąż–męża**,
  **ręka–rąk**, **pięć–piąty**).
- **ph-stress** «Наголос», A1 — fixed penultimate stress vs. free & mobile UA stress; exceptions: -yka/-ika loanwords
  (**matematyka**, **muzyka**, **gramatyka** — 3rd from end; penult tolerated colloquially), past 1/2 pl (**robiliśmy**,
  **byliście**), conditional (**zrobilibyśmy**, **byłabym**), hundreds (**czterysta**, **siedemset**), **rzeczpospolita**;
  "nie ma" [ˈɲɛ ma]. Typical UA error: carrying over UA stress: **woda** (WO-da) vs *вода́*, **ręka** vs *рука́*, **noga** vs
  *нога́*, **głowa** vs *голова́*, **zima** vs *зима́*, **mleko** vs *молоко́*, **siostra**, **kobieta**.
- **ph-voicing** «Оглушення та асиміляція», A1 — final devoicing (**chleb** [chlep], **ząb**, **róg** [ruk], **nóż** [nusz],
  **krew** [kref], **Bóg**) — UA keeps final voiced (*хліб*, *дуб*) → main accent marker of Ukrainians; regressive assimilation
  (**wódka** [wutka], **łóżko** [łuszko], **prośba** [proźba], **liczba** [lidżba], **także** [tagże]); w after voiceless → [f]
  (**twój**, **kwiat**, **swój**, **wszystko**); rz after voiceless → [sz] (**przy** [pszy], **trzy**, **krzesło**,
  **przepraszam**) — UA speakers wrongly say [pżi]; prepositions merge (**w szkole** [fszkole], **z kotem** [skotem]);
  contrast with UA assimilation (UA mostly regressive voicing *боротьба* [бород’ба], no final devoicing).
- **ph-spelling** «Правопис: ó/u, rz/ż, ch/h», A2 — same sound, different letters; rules via alternation: ó if alternates with o
  (**stół–stołu**, **mój–moja**, **wóz–wozy**, **pomóc–pomoc**, **Kraków–krakowski**), ó in -ów, -ówka, -ówna; u in -unek,
  -uje, -uch, -uś/-usia (+ exceptions). rz if alternates with r (**morze–morski**, **dobry–dobrze**, **Piotr–Piotrze**), after
  p b t d k g ch j w (**przy, brzeg, trzy, drzewo, krzesło, grzyb, chrzan, wrzesień**; exceptions **pszenica, kształt,
  pszczoła**), suffixes -arz, -erz (**lekarz, żołnierz**); ż if alternates with g, dz, z, s, h (**mogę–może**, **wozić–wożę**,
  **bliski–bliżej**). ch vs h: ch is common (alternates with sz: **mucha–musze**, **cichy–ciszej**); h mostly in loanwords.
  UA heuristics: *р* next to the sound in UA → **rz** (*море* **morze**, *берег* **brzeg**, *три* **trzy**, *при* **przy**,
  *гриб* **grzyb**); UA *ж* → **ż** (*жаба* **żaba**, *може* **może**, *ніж* **nóż**, *книжка* **książka**); UA *і* from *о*
  in a closed syllable → often **ó** (*стіл* **stół**, *віз* **wóz**, *ніж* **nóż**, *мій* **mój**, *ріг* **róg**, *двір*
  **dwór**, *сіль* **sól**, *біль* **ból**, *лід* **lód**) — tendency, not law (*кінь* **koń**, *ніс* **nos**); UA *х* →
  **ch**; international words with UA *г* from Latin h → **h** (*готель* **hotel**, *гумор* **humor**, *гармонія*
  **harmonia**, *гіпотеза* **hipoteza**).
- **ph-alt** «Чергування звуків», A2 — core systematic node. Vowel alternations: o:ó (**stół–stołu**, **Bóg–Boga**,
  **móc–mogę**), o:e (**niosę–niesiesz**), a:e (**las–w lesie**, **miasto–w mieście**, **lato–w lecie**, **wiara–wierzyć**,
  **obiad–po obiedzie**, **sąsiad–sąsiedzi**, **miał–mieli**), ą:ę (**ząb–zęby**, **mąż–męża**, **ręka–rąk**,
  **wziął–wzięła**), fleeting e (**pies–psa**, **sen–snu**, **dzień–dnia**, **ojciec–ojca**, **okno–okien**,
  **matka–matek**). Consonant alternations — big table «перед -e (Ms./C. одн., кличний)» vs «перед -i/-y (ос.-чол. мн.)» vs
  «у дієсловах»: t→ć (**brat–bracie**, **student–studenci**), d→dź (**woda–wodzie**, **sąsiad–sąsiedzi**), s→ś, z→ź,
  n→ń (**okno–oknie**), ł→l (**stół–stole**, **szkoła–szkole**, **miły–mili**), r→rz (**siostra–siostrze**,
  **dobry–dobrzy**, **Piotr–Piotrze**), k→c (**ręka–ręce**, **Polska–Polsce**, **Polak–Polacy**), g→dz (**noga–nodze**,
  **drogi–drodzy**), ch→sz / ch→ś (**mucha–musze**, **Czech–Czesi**, **cichy–cisi**), st→ść (**miasto–mieście**), zd→źdź
  (**gwiazda–gwieździe**), sł→śl (**krzesło–krześle**), sn→śń (**wiosna–wiośnie**); in verbs s→sz (**pisać–piszę**),
  k→cz (**płakać–płaczę**), g→ż (**móc–możesz**), t→c (**płacić–płacę**), d→dz (**chodzić–chodzę**), ść→szcz
  (**czyścić–czyszczę**). UA parallels: *руКа–руЦі*, *ноГа–ноЗі*, *муХа–муСі* (the same second palatalization, but PL g→dz,
  ch→sz vs UA г→з, х→с); *писати–пишу*, *плакати–плачу*, *могти–можу*, *просити–прошу* ✅; *ходити–ходжу* vs
  **chodzę**, *платити–плачу* vs **płacę** ⚠️; UA *і* (from ѣ) never alternates (*ліс–у лісі*) while PL does
  (**las–w lesie**). Where alternations show up in grammar — links: [[noun-masc]] [[noun-fem]] [[noun-neut]] [[case-loc]]
  [[case-voc]] [[noun-virile]] [[adj-virile]] [[adj-comp]] [[verb-pres-alt]] [[verb-past]].
- **ph-corr** «Декодер: укр. ↔ пол. відповідності», A2 — 15–20 regular correspondences, each with 4–8 examples:
  1) повноголосся *оро/оло/ере/еле* ↔ **ro/ło/rze/le**: *голова* **głowa**, *борода* **broda**, *ворона* **wrona**, *город*
  **gród**, *мороз* **mróz**, *золото* **złoto**, *холод* **chłód**, *голос* **głos**, *молоко* **mleko**, *берег*
  **brzeg**, *середа* **środa**, *сорока* **sroka**, *корова* **krowa**, *солома* **słoma**, *болото* **błoto** (⚠️ бруд);
  2) *у* ↔ **ą/ę**; 3) *я* (з носового) ↔ **ę/ą**; 4) *і* (з ѣ) ↔ **ie/ia** (ia перед твердими t d s z n r ł): *ліс* **las**,
  *літо* **lato**, *віра* **wiara**, *місто* **miasto**, *сніг* **śnieg**, *хліб* **chleb**, *білий* **biały**, *сіно*
  **siano**, *обід* **obiad**, *сусід* **sąsiad**, *вітер* **wiatr**, *тіло* **ciało**, *ріка* **rzeka**, *сміх* **śmiech**,
  *місяць* **miesiąc**; 5) *і* (з о/е в закритому складі) ↔ **ó/o/e**: *стіл* **stół**, *ніж* **nóż**, *віз* **wóz**, *мій*
  **mój**, *ріг* **róg**, *кінь* **koń**, *піч* **piec**, *шість* **sześć**, *сім* **siedem**, *камінь* **kamień**; 6) *р*
  (перед колишніми е/і) ↔ **rz**: *ріка* **rzeka**, *море* **morze**, *три* **trzy**, *при* **przy**, *пере-* **prze-**,
  *гриб* **grzyb**, *крик* **krzyk**, *річ* **rzecz**; 7) *ті/ді/ть/дь* ↔ **ci/dzi/ć/dź**: *тихо* **cicho**, *тітка*
  **ciotka**, *діти* **dzieci**, *день* **dzień**, *тепло* **ciepło**, *десять* **dziesięć**, *дівчина* **dziewczyna**,
  *дякувати* **dziękować**; 8) *л* ↔ **ł / l**: *лапа* **łapa**, *лис* **lis**, *люди* **ludzie**, *ложка* **łyżka**;
  9) *в* наприкінці складу ↔ **ł**: *був* **był**, *мав* **miał**, *читав* **czytał**, *вовк* **wilk**, *довгий* **długi**,
  *жовтий* **żółty**, *повний* **pełny**, *вовна* **wełna**; 10) *и* ↔ **y/i**: *син* **syn**, *риба* **ryba**, *ми* **my**,
  *жити* **żyć**; 11) *г* ↔ **g**: *гора* **góra**, *нога* **noga**, *гість* **gość**; 12) *ч/ш/щ/ж* ↔ **cz/sz/szcz/ż**:
  *час* **czas**, *чорний* **czarny**, *щастя* **szczęście**, *ще* **jeszcze**, *шия* **szyja**, *жаба* **żaba**;
  13) початкове *о-* ↔ **je-**: *озеро* **jezioro**, *один* **jeden**, *осінь* **jesień**, *олень* **jeleń**; 14) *-ець* ↔
  **-iec/-ec**: *хлопець* **chłopiec**, *кінець* **koniec**, *палець* **palec**, *заєць* **zając** ⚠️; 15) *дж* ↔ **dz**:
  *ходжу* **chodzę**, *джерело* **źródło** ⚠️; 16) prefixes/suffixes: *пере-* **prze-**, *при-* **przy-**, *від-* **od-**,
  *ви-* **wy-**, *роз-* **roz-**; *-ість* **-ość**, *-ство* **-stwo**, *-ння* **-nie**, *-ар* **-arz**, *-ник* **-nik**,
  *-тель* **-ciel**, *-ський* **-ski**, *-ливий* **-liwy**, *-ти* **-ć**, *-увати* **-ować**. Caveat: tendencies; whole
  words may differ (*говорити* **mówić**, *дивитися* **patrzeć**). Quiz: «вгадай польське слово».
- **ph-false** «Хибні друзі перекладача», A1–B1 — 50–80 items grouped by theme (люди й родина, дім, їжа, місто, час,
  характер/оцінка, дієслова, службові слова), tables: PL слово — що означає — хибна асоціація — правильний UA відповідник.
  Must include: **dywan** килим, **sklep** магазин, **uroda** краса, **dynia** гарбуз, **owoce** фрукти vs **warzywa** овочі,
  **jutro** завтра, **zaraz** незабаром (≠ *зараз* = **teraz**), **pokój** кімната / мир, **gruby** товстий, **laska**,
  **wesele** весілля, **dworzec** вокзал, **biurko** письмовий стіл, **krzesło** стілець vs **fotel** крісло, **ręcznik**
  рушник, **żona** дружина vs **drużyna** команда, **mąż** чоловік (husband) vs **mężczyzna** чоловік (man) vs **człowiek**
  людина, **rodzina** сім’я, **obraz** картина, **pukać** стукати, **czuć** відчувати (≠ *чути* = **słyszeć**), **chyba**
  мабуть (≠ *хіба*), **na pewno** напевно = точно (⚠️ UA *напевно* = probably), **zapomnieć**, **żałować** шкодувати,
  **zostać** залишитися / стати, **bystry** кмітливий, **ładny** гарний, **brzydki** негарний, **kawaler** холостяк,
  **cel** мета, **zakaz** заборона, **dowód osobisty** посвідчення особи, **matka** мати, **lekarstwo** ліки, **urlop**
  відпустка, **wakacje**, **praca** робота, **stolik** столик у кафе, **zegarek**, **kubek**, **szpital** лікарня, **lotnisko**
  аеропорт, **miły** приємний, **przykro mi** мені шкода, **niedziela** ✅. Grammatical false friends with links: **ten** ≠
  *той* [[pron-dem]], **za tydzień** ≠ *за тиждень* [[prep-time]], **przeczytać** ≠ *перечитати* [[asp-prefix]], **chyba**
  [[adv-particles]], **zostać** [[verb-irreg]]. You may split into children `ph-false-…` by theme.

---

### Branch B · `case` — Відмінки · file `02-cases.js` · ord 2

Function-oriented view of the cases (forms are summarised here; full noun paradigms live in [[noun]]).

- **case** «Відмінки: система» / Przypadki, A1 — 7 cases = the same 7 UA cases in the same order; table: PL name — UA name —
  questions PL/UA (kto? co? / kogo? czego? / komu? czemu? / kogo? co? / (z) kim? (z) czym? / o kim? o czym? / o!) — main
  functions — typical prepositions; compact **cheat sheet of endings** (m/f/n sg + pl, with UA endings alongside); where Polish
  case usage differs from UA (links to [[case-neg]], [[case-ins]], [[case-acc]] (plural virility), [[case-gov]], [[prep]]);
  strategy: learn functions + prepositions here, endings in [[noun]], [[adj-decl]], [[pron-pers]].
- **case-nom** «Називний» / Mianownik, A1 — subject; after «to (jest)» (**To jest mój brat**); predicate adjective
  (**On jest zmęczony**); **Kto to jest? Co to jest?** (*Хто це? Що це?*); colloquial nominative used for addressing by first
  name (**Kasia, chodź!**) vs vocative [[case-voc]]; nominative vs instrumental with być [[syn-to]]; dictionary form; nom pl
  preview incl. virile forms [[noun-virile]].
- **case-gen** «Родовий» / Dopełniacz, A1–A2 — forms (all genders sg/pl, adjectives, pronouns); functions: possession
  (**dom ojca**, **samochód brata** — UA *батьків дім* → PL only genitive, see [[adj-short]]); part/partitive (**szklanka
  wody**, **kilogram jabłek**, **trochę cukru**, **Daj mi chleba** ✅ *дай хліба*); quantity (dużo, mało, ile, kilka, 5+)
  [[num-syntax]]; negation [[case-neg]]; **nie ma + Р.**; dates (**piątego maja** ✅); comparison with **od** (**starszy od
  brata**); verbs (szukać, słuchać, potrzebować, używać, bać się, uczyć się, życzyć, unikać, pilnować, spodziewać się)
  [[case-gov]]; prepositions [[prep-gen]]; **co nowego?**, **nic ciekawego** ✅; masculine -a/-u [[noun-masc]].
- **case-dat** «Давальний» / Celownik, A2 — forms (m -owi/-u, f -e/-i/-y = Ms., n -u; pl -om; adj -emu/-ej/-ym; pronouns
  mi/mnie, ci/tobie, mu/jemu/niemu, jej/niej, nam, wam, im/nim); functions: indirect object (dać, kupić, pokazać, powiedzieć,
  pożyczyć); verbs + C. (pomagać, dziękować, wierzyć, ufać, przeszkadzać, podobać się, smakować, kibicować ⚠️ *вболівати
  за*, towarzyszyć, wybaczać, zazdrościć); experiencer constructions ✅ (**Jest mi zimno**, **Smutno mi**, **Chce mi się
  pić**, **Podoba mi się**, **Wydaje mi się**, **Udało mi się**, **Brakuje mi czasu**, **Szkoda mi go**); ⚠️ age is NOT dative
  (**Mam 20 lat** vs *Мені 20 років*) [[num-life]]; prepositions dzięki, ku, przeciw(ko), wbrew [[prep-dat-acc]]; list of
  masculines with -u (**bratu, ojcu, panu, psu, kotu, chłopcu, Bogu, księdzu, światu**); UA *-ові/-еві/-у* ✅.
- **case-acc** «Знахідний» / Biernik, A1 — forms: m sg animate = Р. (**studenta, psa, kota**), inanimate = Н. (**dom**); f -ę
  (**kobietę**), consonant-f = Н. (**noc**), **pani → panią**; n = Н.; pl: ос.-чол. = Р. (**studentów, panów, ich**), all others
  = Н. (**psy, koty, kobiety, domy, je**) — #1 trap for UA speakers (*бачу собак, жінок* → **widzę psy, kobiety**);
  colloquial genitive-like accusative of some inanimates (**zjeść banana**, **zapalić papierosa**, **tańczyć walca**, **grać w
  tenisa**, **wysłać maila/esemesa**, **mieć dolara**) and the similar UA habit (*написати листа*, *з’їсти банана*);
  functions: direct object; time (**w poniedziałek** ✅, **cały dzień**, **przez godzinę**); prepositions with acc (na, w
  (direction), przez, za, o, po (fetch), pod/nad/przed/między (direction)) [[prep-dat-acc]] [[prep-place]]; verbs czekać na,
  patrzeć na, liczyć na, grać w, wierzyć w, pytać o, prosić o, dbać o [[case-gov]]; acc → gen under negation [[case-neg]];
  **Boli mnie głowa** (*У мене болить голова*).
- **case-ins** «Орудний» / Narzędnik, A1–A2 — forms (m/n -em, f -ą, pl -ami; irregular -mi: **ludźmi, dziećmi, końmi,
  gośćmi, pieniędzmi, braćmi, przyjaciółmi** ✅ *людьми, дітьми, кіньми, гістьми, грішми*; adj -ym/-im, -ą, -ymi; pronouns
  mną, tobą, nim, nią, nami, wami, nimi); functions: predicate noun with być/zostać/stać się (**Jestem studentem**,
  **Zostałem lekarzem** = *Я став лікарем*) vs *Я студент*; vs **To jest student** (nominative!) [[syn-to]]; adjectives stay
  nominative (**Jestem zmęczony**), noun+adj both instrumental (**On jest dobrym lekarzem**); instrument (**pisać
  długopisem**, **jeść łyżką** ✅); transport (**jechać autobusem**, **lecieć samolotem** ✅ *їхати автобусом*); **z** +
  О. = with (**z bratem**, **kawa z mlekiem**) vs **z** + Р. = from; time (**wieczorem**, **zimą / latem / jesienią /
  wiosną** ✅ *зимою*); route (**iść lasem** ✅); verbs (interesować się, zajmować się, opiekować się ⚠️, kierować, rządzić,
  pachnieć, zachwycać się, przejmować się ✅) [[case-gov]]; prepositions z, za, nad, pod, przed, między, poza [[prep-ins-loc]].
- **case-loc** «Місцевий» / Miejscownik, A1 — only with prepositions w, na, o, po, przy; forms (m: -e with alternation / -u
  after k, g, ch, soft & functionally soft + **domu, synu, panu**; f = C.; n -e/-u; pl -ach; adj -ym/-im, -ej, -ych; pronouns
  mnie, tobie, nim, niej, nas, was, nich); functions: location (**w Krakowie**, **na poczcie**); topic **o + Ms.** (**mówić o
  pracy**) ⚠️ UA *про + З.* (*говорити про роботу*); time (**w lipcu**, **w 2024 roku**, **po obiedzie**, **o piątej**);
  **po + Ms.** (**po mieście** ✅, **po polsku**); **przy** (**przy stole** = *за столом*, **przy oknie** = *біля вікна*);
  m -e vs -u decision tree; UA comparison (UA М. also only with prepositions; UA *-і/-у/-ові*; *у лісі* vs **w lesie**).
- **case-voc** «Кличний» / Wołacz, A2 — forms: m mostly = Ms. sg (**studencie! panie! Piotrze! Marku! Tomku! synu!
  chłopcze! ojcze! przyjacielu! doktorze! Boże!**); f -o for -a (**Anno! mamo! kobieto!**), -u for diminutives in -sia/-cia/
  -nia/-la (**Kasiu! Basiu! babciu! ciociu! Olu!**), -i/-y for consonant-final f; n = Н.; pl = Н.; usage: formal address
  (**Panie Profesorze! Pani Doktor! Szanowny Panie Dyrektorze! Panie Janie! Pani Anno!**), letters (**Droga Anno! Kochana
  Mamo!**); colloquial nominative for first names (**Anka, chodź!**); UA ✅ nearly identical (*пане! Петре! мамо! Анно!
  бабусю! друже!*), with **rz** ↔ *р* (**Piotrze** *Петре*); UA uses the vocative more consistently.
- **case-neg** «Родовий заперечення» / Dopełniacz negacji, A2 — direct object in З. → Р. under negation, **obligatory**
  (**Mam czas → Nie mam czasu**, **Lubię kawę → Nie lubię kawy**, **Znam ją → Nie znam jej**, **Kupiłem samochód → Nie
  kupiłem samochodu**); also through an infinitive (**Nie chcę jeść mięsa**, **Nie mogę znaleźć kluczy**); other cases do not
  change (**Nie pomagam mu**, **Nie interesuję się polityką**, **Nie myślę o tym**, **Nie czekam na niego**); **jest/był/będzie
  + Н.** vs **nie ma/nie było/nie będzie + Р.** (**Jest mleko / Nie ma mleka**, **Nie ma go w domu** ✅); **Nie jestem
  studentem** (instrumental stays); UA: genitive of negation exists but is optional (*не люблю каву/кави*) → transfer error
  ~~Nie lubię kawę~~.
- **case-gov** «Керування: дієслово + відмінок» / Rekcja, B1 — big reference: 50–70 verbs, grouped «✅ як в укр.»,
  «⚠️ інший відмінок», «⚠️ інший прийменник». Must include: słuchać + Р. (*слухати + З.*), używać + Р., szukać + Р.,
  potrzebować + Р., uczyć się + Р., uczyć kogo czego, dzwonić do + Р. (*дзвонити + Д.*), pisać do kogoś (*писати кому*),
  pytać o + З., prosić o + З. (*просити + Р.*), dbać o, czekać na, patrzeć na, myśleć o + Ms. (*думати про + З.*), mówić o,
  marzyć o, tęsknić za + О. ✅, martwić się o, cieszyć się z + Р. (*радіти + Д.*), śmiać się z ✅, interesować się + О. ✅,
  zajmować się ✅, opiekować się + О. (*піклуватися про*), kierować ✅, zgadzać się z ✅, żenić się z ✅, wyjść za mąż za ✅,
  przyzwyczaić się do ✅, należeć do, zależeć od ✅, zależy mi na + Ms. ⚠️, grać w ✅, grać na ✅, wierzyć w/komuś ✅,
  ufać + Д. (*довіряти*), pomagać ✅, dziękować komuś za ✅, gratulować komuś czegoś (*вітати когось з чимось* ⚠️), życzyć ✅,
  przepraszać kogoś za (*вибачатися перед* ⚠️), zazdrościć komuś czegoś, bać się ✅, unikać ✅, żałować + Р. (*шкодувати
  про* ⚠️), wstydzić się ✅, dotykać ✅, brakować ✅, wymagać ✅, chronić przed (*захищати від* ⚠️), uciekać przed ⚠️, bronić
  + Р. ⚠️, zapominać o, przypominać komuś o ✅, uczestniczyć w ✅, wątpić w + З. ⚠️, zakochać się w + Ms. ⚠️, znać się na ✅,
  nadawać się do ⚠️, składać się z ✅, korzystać z + Р. (*користуватися + О.* ⚠️), rezygnować z (*відмовлятися від* ⚠️),
  pochodzić z ✅, różnić się od ✅, umawiać się z kimś na ✅.

---

### Branch C · `noun` — Іменник · file `03-nouns.js` · ord 3

- **noun** «Іменник» / Rzeczownik, A1 — categories (рід, число, відмінок + особовість/живість); stem types: hard, soft,
  **functionally soft** (c, cz, sz, rz, ż, dz, dż behave like soft in endings: **klucze**, **noże**, **lekarze**), velars k/g/ch;
  declension = gender + stem type; mapping to UA declensions: UA I відміна (-а/-я) ≈ PL f -a; UA II (m/n) ≈ PL m & n; UA III
  (*ніч, сіль, кров*) ≈ PL consonant-final f (**noc, sól, krew**); UA IV (*ім’я, теля*) ≈ PL n -ę (**imię, cielę**). Map of
  children.
- **noun-gender** «Рід і як його визначити», A1 — by ending: consonant → m (exceptions: soft consonant f — **noc, rzecz, mysz,
  twarz, sól, krew, jesień, dłoń, przyjaźń, kolej, podróż, młodzież**; -ść mostly f, but **gość** m; **koń, dzień, tydzień** m);
  -a → f (exceptions m-os: **mężczyzna, kolega, poeta, artysta, turysta, kierowca, sprzedawca, sędzia**; **Kuba**); -o/-e/-ę/-um
  → n (**muzeum, centrum, liceum**); -i → f (**pani, gospodyni**). Gender mismatches PL vs UA — table of 30+: **cień** ч. *тінь*
  ж., **medal** ч. *медаль* ж., **dziecko** с. *дитина* ж., **talerz** ч. *тарілка* ж., **pomarańcza** ж. *апельсин* ч.,
  **zupa** ж. *суп* ч., **herbata** ж. *чай* ч., **ziemniak** ч. *картопля* ж., **kwiat** ч. *квітка* ж., **kraj** ч.
  *країна* ж., **państwo** с. *держава* ж., **mieszkanie** с. *квартира* ж., **pokój** ч. *кімната* ж., **sufit** ч. *стеля*
  ж., **winda** ж. *ліфт* ч., **krzesło** с. *стілець* ч., **długopis** ч. *ручка* ж., **parasol** ч. *парасолька* ж.,
  **szpital** ч. *лікарня* ж., **lotnisko** с. *аеропорт* ч., **wieś** ж. *село* с., **biuro** с. *офіс* ч., **plac** ч.
  *площа* ж., **obraz** ч. *картина* ж., **lekarstwo** с. *ліки* мн., **urodziny** мн. *день народження* ч. + many ✅ pairs.
- **noun-virile** «Особово-чоловічий рід» / męskoosobowość, A2 — in sg: m-os (persons), m-zw (animals), m-rz (things):
  affects acc sg — UA identical (живі/неживі) ✅. In pl only two genders: **ос.-чол.** (male persons or mixed groups) vs
  **неос.-чол.** (everything else: women, children, animals, things). Markers: nom pl ending (**studenci** vs **kobiety, psy,
  domy**), acc pl (= Р. for ос.-чол.: **widzę studentów**; = Н. otherwise: **widzę kobiety, psy**), adjectives (**dobrzy
  studenci** / **dobre kobiety**), pronouns (**oni/one, ci/te, którzy/które, moi/moje, wszyscy/wszystkie, tacy/takie**), past
  tense (**byli/były**), conditional, numerals (**dwaj/dwóch/pięciu studentów** vs **dwie/pięć kobiet**). Mixed group → ос.-чол.
  (one man is enough); animals never ос.-чол.; depreciative/colloquial non-virile forms (**chłopaki**, **te chłopy**). Table of
  all markers, decision tree for acc pl. UA has no such category; UA plural animacy (*бачу студентів / жінок / котів*) vs PL
  virility.
- **noun-masc** «Чоловічий рід: відмінювання», A1–B1 — paradigms: hard animate (**student, pan, Polak, kot**), hard inanimate
  (**dom, stół, samochód**), soft (**koń, nauczyciel, pokój**), functionally soft (**klucz, lekarz, nóż**), velar (**Polak,
  język**), fleeting e (**pies, ojciec, chłopiec, dzień, ołówek**). Gen sg **-a vs -u** with semantic groups (-a: persons,
  animals, tools/small objects, body parts, months, Polish towns in -ów/-in, fruit/vegetables, dances/games, currencies, units;
  -u: abstracts, substances, collectives, most loanwords and big objects/buildings) + UA comparison (UA has the same -а/-у split,
  intuition works ~70%; list matches and mismatches: **ser–sera** vs *сиру*, **świat–świata** vs *світу*, **Paryż–Paryża**,
  **chleb–chleba** ✅, **czas–czasu** ✅, **telefon–telefonu** ✅, **komputer–komputera** ✅). Dat -owi / -u (short list).
  Loc -e with alternation vs -u (after k, g, ch, soft; **domu, synu, panu**). Voc. Plural: nom ос.-чол. (-i/-y with alternation:
  **studenci, Polacy, Ukraińcy, Niemcy, chłopcy, sąsiedzi, koledzy**; -e: **lekarze, nauczyciele**; -owie: **panowie, synowie,
  ojcowie, profesorowie, dziadkowie, mężowie, uczniowie**; irregular **bracia, ludzie, księża, przyjaciele**), nom неос.-чол.
  (-y, -i after k/g, -e after soft), gen pl -ów (✅ *-ів*: **domów** *домів*) / -i/-y (**koni, nauczycieli, pokoi/pokojów,
  kluczy, lekarzy, gości, przyjaciół**), dat -om, ins -ami (-mi), loc -ach. You may split into `noun-masc-sg` / `noun-masc-pl`.
- **noun-fem** «Жіночий рід: відмінювання», A1 — types: hard -a (**kobieta, mama, szkoła, siostra, ręka, noga, Polska**), soft
  -a (**ulica, praca, ziemia, kuchnia, babcia**), -i (**pani**), consonant-final (**noc, rzecz, kość, wieś, krew, sól, twarz,
  miłość**), -ia/-ja (**historia → historii**, **lekcja → lekcji**, **Maria → Marii**). Sg: Р. -y/-i; Д./Ms. -e with
  alternation (**kobiecie, mamie, szkole, siostrze, ręce, nodze, Polsce, matce, książce**) or -i/-y; З. -ę (Ø for
  consonant-final; **panią**); О. -ą; Кл. -o/-u/-i. Pl: Н. -y/-i/-e (**ręce** irregular), Р. zero ending with fleeting e and
  ó/ą (**kobiet, sióstr, rąk, nóg, głów, szkół, matek, książek, ulic, nocy, kości**), -om, -ami, -ach. UA parallels: Д./М. *-і*
  with the same alternations (*жінці, руці, нозі, сестрі*), З. *-у* ↔ -ę, О. *-ою* ↔ -ą, Кл. ✅, Р. мн. zero (*жінок, рук,
  ніг, голів*) with ó ↔ *і*; UA III відміна ↔ PL consonant-f (*ночі* **nocy**, *солі* **soli**, *ніччю* **nocą**).
- **noun-neut** «Середній рід: відмінювання», A1–A2 — -o (**okno, miasto, słowo, jabłko, łóżko, mleko**, **kino** ⚠️
  declinable: **w kinie, do kina**; **metro, radio**), -e (**morze, pole, serce, zdanie, mieszkanie, życie**), -ę type -en-
  (**imię → imienia, imiona**) and -ęt- (**zwierzę → zwierzęcia, zwierzęta; cielę, kurczę, kocię, szczenię**), -um (**muzeum** —
  indeclinable sg, pl **muzea, muzeów**), irregular **dziecko** (pl **dzieci, dziećmi**), **oko → oczy**, **ucho → uszy**.
  Endings sg/pl; gen pl zero (**okien, miast, słów, jabłek, łóżek, pól, mórz, imion, zwierząt**). UA parallels: *ім’я–імені*
  ✅, *теля–телята*, *кошеня–кошенята*, *курча–курчата* (-ęt- ↔ *-ят-* ✅), *вікно–вікон*, *слово–слів*; ⚠️ UA *кіно, метро,
  радіо* indeclinable vs PL declinable; UA *музей* ч. vs PL **muzeum** с.
- **noun-pl** «Множина: загальна система», A2 — cross-gender decision trees for Н. мн. and Р. мн.; universal **-om / -ami /
  -ach** ✅ = *-ам / -ами / -ах*; З. мн. rule; irregular plurals (**człowiek → ludzie**, **rok → lata, lat**, **dziecko →
  dzieci**, **brat → bracia**, **ksiądz → księża**, **przyjaciel → przyjaciele, przyjaciół**, **tydzień → tygodnie**, **oko →
  oczy**, **ucho → uszy**, **ręka → ręce**, **Włoch → Włosi**, **Rosjanin → Rosjanie**, **-anin → -anie** ✅ *киянин → кияни*,
  **pieniądz → pieniądze**, **gość → goście**); pluralia tantum (35+, with UA): **drzwi** ✅, **spodnie** ✅, **okulary** ✅,
  **nożyczki** ✅, **urodziny** ⚠️, **imieniny** ✅, **wakacje**, **ferie**, **plecy** ⚠️ *спина*, **usta** ⚠️, **sanki** ✅,
  **skrzypce** ⚠️, **pieniądze** ✅, **drożdże** ✅, **Niemcy** ⚠️, **Włochy** ⚠️, **Węgry** ⚠️, **Czechy**, **Tatry** ✅,
  **Karpaty** ✅, **Katowice**, **Kielce**, **zaręczyny** ✅, **chrzciny** ✅, **odwiedziny** ✅, **wczasy**, **schody** ✅,
  **szachy** ✅, **mistrzostwa** ⚠️; collective nouns **rodzeństwo** ⚠️, **państwo** (= пан і пані), **młodzież** ✅.
- **noun-special** «Особливі типи іменників», B1 — masculine nouns in -a (**mężczyzna, kolega, poeta, turysta, kierowca,
  sędzia**: sg like f, agreement masculine, pl ос.-чол.); adjectival nouns (**znajomy, chory, narzeczona, bliscy**); surnames
  (**Kowalski / Kowalska / Kowalscy, państwo Kowalscy**; **Nowak** — m declines, f indeclinable: **z panią Nowak**, pl
  **Nowakowie**); indeclinables (**menu, kakao, taxi, kiwi, zoo, jury**); place names: **Kraków → w Krakowie, do Krakowa**;
  **Katowice → w Katowicach, do Katowic**; **Zakopane → w Zakopanem**; **Gdańsk → w Gdańsku**; Ukrainian cities in Polish:
  **Kijów → w Kijowie**, **Lwów → we Lwowie**, **Charków → w Charkowie**, **Odessa → w Odessie**, **Dniepr → w Dnieprze**,
  **Zaporoże → w Zaporożu**, **Tarnopol → w Tarnopolu**, **Łuck → w Łucku**, **Równe → w Równem**, **Winnica → w Winnicy**,
  **Czernihów → w Czernihowie**, **Iwano-Frankiwsk → w Iwano-Frankiwsku**, **Połtawa → w Połtawie**, **Żytomierz → w Żytomierzu**;
  countries with prepositions: **w Polsce**, **w Ukrainie / na Ukrainie**, **w Niemczech**, **we Włoszech**, **na Węgrzech**,
  **w Czechach**, **na Słowacji**, **na Litwie**, **na Białorusi**, **we Francji**, **w Hiszpanii**, **w USA**.

---

### Branch D · `pron` — Займенник · file `04-pronouns.js` · ord 4

- **pron** «Займенник» / Zaimek, A1 — classes (same as UA); Polish specifics: short clitic forms, Pan/Pani, oni/one,
  **ten** ≠ *той*, **który** as the main relative, **swój**.
- **pron-pers** «Особові займенники», A1–A2 — full table all cases with long / short / after-preposition forms (ja: mnie, mi,
  mnie, mną; ty: ciebie/cię, tobie/ci, tobą; on: jego/go/niego, jemu/mu/niemu, nim; ona: jej/niej, ją/nią; ono: je/nie; my, wy,
  oni: ich/nich, im/nim, nimi; one: je/nie). Rules: short forms unstressed, never first, never after a preposition; long forms
  for emphasis/contrast/sentence start; n-forms after prepositions (**do niego, z nią, dla nich**) ✅ *до нього, з нею*;
  **ze mną, przede mną, nade mną, beze mnie**; subject pronoun usually dropped (more than in UA). UA has no clitics (*мені* vs
  **mi/mnie**; *його* ≈ **go/jego**).
- **pron-polite** «Ввічлива форма: Pan, Pani, Państwo», A1 — Pan/Pani/Państwo/Panowie/Panie + verb in **3rd person**
  (**Czy pan jest z Polski?**, **Co pani robi?**, **Czy państwo mają rezerwację?**) vs UA *Ви* + 2 pl ⚠️; declension (pan, pana,
  panu, panem, panie!; pani, panią; państwo, państwa, państwu, państwem); with names/titles (**pan Jan**, **pani Anna**, **pan
  Kowalski**, **pan doktor**, **pani profesor**, **z panią doktor**); vocative **Panie Janie! Pani Anno! Panie Doktorze!**;
  **proszę pana/pani**, **przepraszam pana**; letters **Szanowny Panie / Szanowna Pani / Szanowni Państwo**, capitalization;
  imperative with Pan (**Niech pan usiądzie**, **Proszę usiąść**); **wy** = informal group (to one person — archaic/rude);
  **przejść na ty**; **ten pan** (*цей чоловік*), **pani od polskiego**; typical error ~~Czy wy macie...~~ (to one person).
- **pron-refl** «Зворотні: się, siebie, sobie, swój», A2 — table (się / siebie, sobie, sobą); uses: **Myję się**, **Kupiłem
  sobie książkę**, **Mówię do siebie**, **Mam pieniądze przy sobie**, **Jesteś z siebie zadowolony?** ⚠️ (*задоволений собою*),
  **Wierzę w siebie**; reciprocal (**Znamy się**, **Pomagamy sobie**, **Rozmawiamy ze sobą**); idiomatic **sobie** (**Radzę
  sobie**, **Wyobraź sobie**, **Przypomnij sobie**, **Zdaję sobie sprawę**, **Idę sobie**, **Żartujesz sobie?**); **swój**:
  obligatory for 3rd person (**On kocha swoją żonę** vs **jego żonę** = чужу) ✅ like UA *свій/його*; optional in 1st/2nd person;
  not in subject; **po swojemu** ✅. Verbs with się → [[refl]].
- **pron-poss** «Присвійні», A1–A2 — mój, twój, swój, nasz, wasz (declined like adjectives; tables incl. ос.-чол. pl **moi**);
  **jego, jej, ich** indeclinable (vs UA *їхній* declines ⚠️); bookish short forms **mego, memu, mą**; **czyj?**; possession with
  Pan/Pani: **pana / pani / państwa samochód** (*ваш автомобіль*); omission when obvious (**Boli mnie głowa**, **Myję ręce**) ✅.
- **pron-dem** «Вказівні: ten, tamten, taki», A1 — ten/ta/to/ci/te (= *цей*!), tamten (= *той*), taki/tacy, tyle/tylu, tak;
  declension tables; **tę** (norm) vs **tą** (colloquial) in З. ж.; **to** as demonstrative and as subject/copula (**To jest…**,
  **To prawda**, **To dobrze**, **To ja**); **ten sam** = *той самий* ⚠️, **taki sam** = *такий самий*; ⚠️ false friend:
  **ten** ≠ *той*.
- **pron-int** «Питальні та відносні», A1–A2 — kto/co declension vs UA (*хто, кого, кому, ким, кім; що, чого, чому, чим, чім*);
  jaki vs który (**Jaki to samochód? — Czerwony** / **Który samochód jest twój? — Ten czerwony**); czyj, ile/ilu; **który** as
  the main relative pronoun, fully declined (**człowiek, którego znam**; **kobieta, z którą rozmawiałem**; **dom, w którym
  mieszkam**; **ludzie, którzy…**; **książki, które…**); **co** as relative after to/wszystko/coś/nic (**wszystko, co mam**);
  colloquial **co** = który; **czego szukasz?** ⚠️ (*що шукаєш?*), **czego słuchasz?** ⚠️, **o czym myślisz?** ⚠️ (*про що?*);
  ⚠️ UA *що* = pronoun **co** and conjunction **że** [[syn-sub]].
- **pron-indef** «Неозначені й заперечні», A2 — ktoś, coś, jakiś, czyjś, któryś, gdzieś, kiedyś, jakoś, skądś, dokądś (-ś =
  *-сь* ✅); -kolwiek (= *будь-/-небудь*); **byle kto / byle co / byle jak** ✅ *абихто/абищо/абияк*; **mało kto** ✅,
  **niektórzy**, **pewien** (*один, якийсь*); negative nikt, nic, żaden, nigdzie, nigdy, znikąd, donikąd + obligatory double
  negation ✅ (**Nikt nic nie powiedział**); declension (kogoś, czegoś, nikogo, niczego/nic); ⚠️ no splitting with prepositions:
  **z nikim, o niczym, do nikogo** vs UA *ні з ким, ні про що*; ⚠️ **coś ciekawego** (Р.!) vs *щось цікаве*; **nic nowego** ✅.
- **pron-def** «Означальні: każdy, wszyscy, cały, sam», B1 — każdy, wszyscy (ос.-чол.) / wszystkie / wszystko, cały, sam, ten sam,
  inny, wszelki (книжн.), obaj/obie/oba/oboje → [[num-coll]]; declension; virility (**wszyscy studenci** / **wszystkie
  studentki**); idioms **Wszystko jedno** ✅, **Wszystkiego najlepszego** ✅, **przede wszystkim** ✅, **mimo wszystko** ✅,
  **Wszystko w porządku**, **sam na sam**.

---

### Branch E · `adj` + `adv` — Прикметник; Прислівник · file `05-adj-adv.js` · ord 5 (adj) and 6 (adv) — push two branch objects

- **adj** «Прикметник» / Przymiotnik, A1 — endings almost identical to UA (-y/-a/-e ↔ *-ий/-а/-е*); specifics: ос.-чол.
  plural, post-position of classifying adjectives, no UA-type possessive adjectives (*мамин*), comparison like UA (-szy ↔
  *-ший*, naj- ↔ *най-*).
- **adj-decl** «Відмінювання прикметників», A1–A2 — hard (**dobry, nowy**), soft (**tani, ostatni, średni**), velar
  (**polski, drogi, wysoki**: -ki/-gi + -ego/-ie); full tables sg (m/n/f) and pl (ос.-чол. / неос.-чол.) side by side with UA
  (*добрий, доброго, доброму, добрим, на доброму; добра, доброї, добрій, добру, доброю; добрі, добрих, добрим, добрими*);
  -ego/-emu ↔ *-ого/-ому* ✅; -ej ↔ *-ої/-ій*; -ą = both З. and О. ж. (UA two forms *-у / -ою*) ⚠️; Ms. -ym ↔ *-ому/-ім*;
  Н. мн. неос.-чол. **-e** ↔ *-і* (**dobre domy** *добрі будинки*) ⚠️; spelling y/i.
- **adj-virile** «Особово-чоловіча множина прикметників», A2 — alternations table: -ry→-rzy (**dobry–dobrzy, stary–starzy,
  chory–chorzy**), -ły→-li (**mały–mali, miły–mili, wesoły–weseli**), -ny→-ni (**ładny–ładni, zmęczony–zmęczeni,
  zadowolony–zadowoleni**), -ty→-ci (**bogaty–bogaci**), -dy→-dzi (**młody–młodzi**), -sy→-si, -zy→-zi (**duży–duzi**), -chy→-si
  (**cichy–cisi**), -ki→-cy (**wysoki–wysocy, polski–polscy, wielki–wielcy**), -gi→-dzy (**drogi–drodzy, długi–dłudzy**),
  labials (**nowy–nowi, słaby–słabi**), soft -i unchanged (**tani, ostatni**); participles (**zmęczeni, zajęci, pracujący**);
  usage (**Moi rodzice są zadowoleni**, **Ci ludzie są mili**, **Polscy studenci**); UA no special form; same alternations as
  [[noun-virile]], [[ph-alt]].
- **adj-comp** «Ступені порівняння», A2 — -szy after one consonant (**nowy–nowszy, młody–młodszy, stary–starszy,
  tani–tańszy, drogi–droższy, krótki–krótszy, niski–niższy, wysoki–wyższy, bliski–bliższy, szeroki–szerszy, wąski–węższy,
  lekki–lżejszy, daleki–dalszy, długi–dłuższy**), -ejszy after clusters (**ładny–ładniejszy, trudny–trudniejszy,
  ciepły–cieplejszy, zimny–zimniejszy, mądry–mądrzejszy, łatwy–łatwiejszy**); irregular **dobry–lepszy** (✅ *ліпший*),
  **zły–gorszy** ✅ *гірший*, **duży–większy**, **mały–mniejszy** ✅; analytic **bardziej/najbardziej**, **mniej/najmniej** ✅;
  syntax **niż** + Н. / **od** + Р. (**starszy niż ja / ode mnie**), **najlepszy w klasie / z nas / ze wszystkich**, **coraz
  lepszy** (*дедалі кращий*), **im…, tym…** ✅ *чим…, тим…*, **jak najszybciej** ✅, **o wiele lepszy**, **o dwa lata
  starszy** ⚠️ (*на два роки*). Adverb comparison → [[adv-form]].
- **adj-short** «Короткі й присвійні; назви національностей», B1 — short predicative forms **zdrów, gotów, pewien (Jestem
  pewien), winien, wart, rad, ciekaw, pełen, łaskaw** ✅ (*здоров, готов, певен, винен, повен*); possessive adjectives: UA *мамин,
  батьків* → PL genitive (**książka mamy**, **dom ojca**), residual PL forms (**ojcowski, Boże Narodzenie, babcine ciasto**
  (розм.)); nationality nouns/adjectives: capital letter for nouns (**Polak**) vs lowercase adjectives (**polski**) ⚠️ UA
  *поляк* lowercase; table ≥ 15 countries: kraj — mieszkaniec — mieszkanka — przymiotnik — po … (Polska–Polak–Polka–polski–po
  polsku; Ukraina–Ukrainiec–Ukrainka–ukraiński; Niemcy–Niemiec–Niemka–niemiecki; Anglia–Anglik–Angielka; Francja–Francuz–
  Francuzka; Hiszpania; Włochy–Włoch–Włoszka; Rosja–Rosjanin–Rosjanka; Czechy–Czech–Czeszka; Słowacja; Białoruś–Białorusin;
  Litwa–Litwin; USA–Amerykanin; Węgry–Węgier; Grecja–Grek–Greczynka; Turcja–Turek–Turczynka; Japonia–Japończyk; Chiny–Chińczyk);
  substantivized adjectives (**znajomy, chory, bliscy, narzeczony, dorosły**).
- **adj-agree** «Узгодження й позиція прикметника», A1–A2 — agreement incl. virile; with Pan/Pani/Państwo (**Pan jest
  zmęczony?**, **Państwo są zmęczeni**), mixed groups, numerals (**pięciu dobrych studentów**, **dwa duże domy**, **pięć dużych
  domów**); position: qualitative before noun ✅, classifying/terminological after (**język polski, kuchnia włoska, Morze Czarne,
  sok pomarańczowy, kawa rozpuszczalna, dowód osobisty, karta kredytowa, wojna światowa, Uniwersytet Jagielloński**; but
  **Boże Narodzenie**, **Biały Dom**; **zielona herbata / herbata zielona**) ⚠️ UA always before; rule of thumb «який саме тип?
  → після»; adjective after coś/nic in Р. [[pron-indef]]; predicate: conjugated **być** + Н. (**Jestem cierpliwy**) vs
  infinitive **być** + О. (**Trzeba być cierpliwym**) ✅ like UA.
- **adv** «Прислівник» / Przysłówek, A1 — overview: formation, comparison, predicatives, adverb classes, particles.
- **adv-form** «Творення прислівників, ступені порівняння», A2 — -o (**szybko, wysoko, cicho, ciepło, długo, łatwo, drogo,
  tanio, wesoło, miło, zimno, głupio**) vs -e with alternation (**dobrze, mądrze, ładnie, pięknie, źle, spokojnie, smacznie,
  grzecznie, poprawnie**) + tendencies; **po + -u** (**po polsku, po ukraińsku, po staremu ✅, po swojemu ✅, po cichu, po
  kolei, po trochu ✅**); **z daleka ✅, z bliska ✅**; **na pewno** ⚠️ = точно; **na prawo / w prawo**, **na razie**, **na
  szczęście ✅, na pamięć ✅**; comparison -iej/-ej (**szybciej, wyżej, ciszej, cieplej, łatwiej, częściej, dłużej, krócej,
  dalej, bliżej, drożej, taniej, wcześniej, później**) ✅ *-іше/-ше*; irregular **lepiej, gorzej, więcej, mniej, bardziej**;
  **jak najszybciej** ✅.
- **adv-pred** «Предикативи: zimno, trzeba, można», A2 — state predicatives with dative experiencer ✅ (**(Jest) mi zimno /
  ciepło / gorąco / duszno / niedobrze / smutno / wesoło / przykro / wstyd / głupio / miło / żal / szkoda / łatwo / trudno**;
  **Było mi zimno**, **Będzie ci trudno**); weather **Jest zimno**; modal predicatives **można ✅, trzeba ✅, warto ✅, wolno**
  (⚠️ also «повільно»), **należy** (офіц.), **potrzeba**, **da się** (розм., very common), **widać ✅, słychać ✅, czuć** ⚠️;
  tenses (**trzeba było**, **trzeba będzie**); systematic table **nie wolno** (заборона) / **nie można** (неможливо/заборона) /
  **nie trzeba** (непотрібно) / **nie musisz**; **Szkoda czasu ✅**, **Przykro mi** ⚠️ (= *мені шкода/прикро*), **Głupio mi** ⚠️
  (*мені ніяково*), **Miło mi** ✅.
- **adv-types** «Прислівники місця, часу, способу», A1 — place triads gdzie?/dokąd?/skąd? (**tu/tutaj** = *тут* and *сюди* ⚠️,
  **tam** = *там* and *туди* ⚠️, **stąd/stamtąd/skąd**, **wszędzie, nigdzie** (also *нікуди*), **gdzieś, tędy/tamtędy**, **w
  górze/na dole, do góry/na dół, z przodu/z tyłu, obok, naprzeciwko, w środku, na zewnątrz**); time (**teraz**, **zaraz** ⚠️,
  **dziś/dzisiaj, jutro** ⚠️, **wczoraj, pojutrze, przedwczoraj, rano, wieczorem, w nocy, po południu, już, jeszcze, dopiero** ⚠️,
  **właśnie, niedawno, dawno, wkrótce, niedługo** ⚠️ = *незабаром*, **potem, później, najpierw, wreszcie, nareszcie, w końcu,
  zawsze, często, czasem, rzadko, nigdy, zwykle, codziennie, co tydzień, co roku** (Р.!), **od razu, natychmiast, wtedy,
  kiedyś**); manner/degree (**bardzo, trochę, zbyt / za** (**za drogo** = *задорого*), **całkiem** ⚠️, **dość, prawie, razem,
  osobno, powoli, pieszo, naprawdę, chętnie, niestety, oczywiście, w ogóle, wcale**).
- **adv-particles** «Частки та модальні слова», B1 — czy, nie, niech, by, -że/-ż (**Chodźże!**, **Cóż**), **przecież** (*адже/
  таж/же*), **chyba** ⚠️ (*мабуть*, not *хіба*; but **chyba że** = *хіба що*), **może**, **pewnie** (*мабуть*; розм. **Pewnie!** =
  *Звісно!*), **na pewno** ⚠️, **raczej** (*радше, швидше*), **właśnie** (**No właśnie!**), **nawet ✅, tylko ✅, też / także /
  również ✅, aż ✅, dopiero** ⚠️, **już, jeszcze, no** (**No dobrze**), **ależ**, **oto ✅**, **to** (**To co robimy?**),
  **czyżby ✅** (*невже*), **przynajmniej ✅, w każdym razie ✅, zresztą ✅, akurat ✅, niby ✅, jakby**. Dialogue examples.

---

### Branch F · `num` — Числівник · file `06-numerals.js` · ord 7

- **num** «Числівник» / Liczebnik, A1 — overview: types (кількісні, порядкові, збірні, неозначено-кількісні, дробові); the
  biggest Polish complication is agreement + ос.-чол. forms; map.
- **num-card** «Кількісні 0–1 000 000», A1 — forms; jeden/jedna/jedno; dwa/dwie; 11–19 **-naście** ↔ *-надцять*; 20–90
  **-dzieści/-dziesiąt** ↔ *-дцять/-десят*; hundreds **sto, dwieście, trzysta, czterysta, pięćset…**; **tysiąc** (ч.),
  **dwa tysiące, pięć tysięcy**, **milion**; ⚠️ **czterdzieści** vs *сорок*, **dziewięćdziesiąt** vs *дев’яносто*,
  **dwieście** ✅ *двісті*; reading phone numbers & prices; pronunciation notes.
- **num-syntax** «Числівник + іменник: 1 / 2–4 / 5+», A1–A2 — 1 + Н. одн.; 2–4 (and 22–24, 32–34…, not 12–14) + Н. мн. + verb
  pl (**Dwa koty śpią**); 5+ (and 12–21, 25–31…) + Р. мн. + verb 3 sg, neuter in past (**Pięć kobiet pracowało**, **Minęło
  siedem dni**) — UA ✅ split, but UA verb may be pl ⚠️; ⚠️ compounds ending in **jeden** take Р. мн. and **jeden** does not
  change (**dwadzieścia jeden książek** vs *двадцять одна книжка*); oblique cases: noun follows the case (**z dwoma kotami**,
  **o pięciu książkach**); **jeden złoty / dwa złote / pięć złotych**.
- **num-virile** «Особово-чоловічі числівники», B1 — **dwaj/trzej/czterej** + Н. мн. + verb pl (**Dwaj studenci czekali**) or
  **dwóch/trzech/czterech** + Р. мн. + verb 3 sg n. (**Dwóch studentów czekało** — more common in speech); 5+: **pięciu,
  sześciu, siedmiu, ośmiu, dziesięciu, dwudziestu, stu** + Р. мн. + 3 sg n. (**Przyszło pięciu kolegów**); **wielu, kilku,
  paru, ilu, tylu** (**Ilu was jest?** = *Скільки вас?*); mixed groups; adjective agreement (**pięciu nowych studentów**);
  acc (**Widzę dwóch studentów** / **Widzę dwie studentki**); UA no such forms (closest: *двоє хлопців*).
- **num-coll** «Збірні: dwoje, troje, oboje; obaj/obie/oba», B1 — dwoje, troje, czworo, pięcioro…, kilkoro; used with
  **dzieci**, mixed-gender groups of persons (**dwoje ludzi**, **troje studentów** = mixed), young beings in -ę (**troje
  kociąt**), some pluralia tantum (**dwoje drzwi**), paired body parts (**dwoje oczu**); **oboje** (man + woman: **Oboje
  rodzice pracują**), **obaj** (two men), **obie** (two women / f), **oba** (m non-personal & n); declension (**dwojga,
  dwojgu, dwojgiem**); verb 3 sg n. (**Dwoje dzieci bawiło się**); **Mam dwoje dzieci** ✅ *Маю двоє дітей*; ⚠️ UA uses
  collectives more widely (*двоє друзів* → **dwóch przyjaciół**).
- **num-decl** «Відмінювання числівників», B1 — dwa/dwie/dwaj (dwóch/dwu, dwóm, dwoma / dwiema), trzy (trzech, trzem, trzema),
  cztery, pięć (one form **pięciu** for Р./Д./Ms., О. **pięcioma**), sto (stu), tysiąc (declined as a masculine noun), milion;
  uses (**z dwoma kolegami**, **z dwiema córkami**, **o trzech porach roku**, **przed pięcioma minutami**, **od dwóch lat**,
  **stolik dla dwóch osób**); UA ✅ *двох, двом, двома; п’яти, п’ятьом, п’ятьма* — PL simpler.
- **num-ord** «Порядкові числівники», A1–A2 — 1–100, 1000, declined as adjectives; ⚠️ compound ordinals: PL both tens and units
  ordinal (**dwudziesty pierwszy**) vs UA only last (*двадцять перший*); years (**tysiąc dziewięćset dziewięćdziesiąty
  dziewiąty**, **dwa tysiące dwudziesty czwarty**, **w roku dwutysięcznym**); centuries (**XXI wiek**, **w XX wieku**);
  ⚠️ floors: **parter** = *перший поверх*, **pierwsze piętro** = *другий поверх*; **po raz pierwszy ✅**, **po pierwsze ✅**;
  UA parallels (**szósty** *шостий*, **siódmy** *сьомий*, **ósmy** *восьмий* — ó ↔ *о*).
- **num-date** «Дати, місяці, дні тижня», A1–A2 — **Którego jest dzisiaj? / Który jest dzisiaj?** — **Dzisiaj jest piąty
  maja** (ч. ордінал, «dzień» implied) ⚠️ vs *Сьогодні п’яте травня* (с.); **Kiedy? — Piątego maja** ✅; writing dates; months
  table PL — UA with Р. and Ms. (**styczeń, stycznia, w styczniu** — *січень* ⚠️; **luty, lutego, w lutym** ✅ adjectival like
  *лютий*; **marzec** ⚠️ *березень*; **kwiecień** ✅; **maj** ⚠️ *травень*; **czerwiec, lipiec, sierpień, wrzesień** ✅;
  **październik** ⚠️ *жовтень*; **listopad, grudzień** ✅); days (**w poniedziałek ✅, we wtorek ✅, w środę, w sobotę, w
  niedzielę**), **w weekend** ⚠️, **co poniedziałek / w poniedziałki** ⚠️ (*щопонеділка, по понеділках*), seasons (**wiosną /
  na wiosnę, latem / w lecie, jesienią, zimą / w zimie**); years (**w 2024 roku** ✅); ⚠️ **w zeszłym / przyszłym / tym roku
  (tygodniu, miesiącu)** = *минулого / наступного / цього року* (UA Р. without preposition); **w latach dziewięćdziesiątych**;
  holidays (**Boże Narodzenie, Wigilia, Wielkanoc, Sylwester, Nowy Rok, 11 Listopada, 3 Maja**).
- **num-time** «Котра година», A1–A2 — **Która (jest) godzina? — Jest piąta** ✅; **O której? — O piątej** ✅; official
  24-h (**piętnasta trzydzieści**); colloquial: **wpół do szóstej** (5:30 ✅ *пів на шосту*), ⚠️ **kwadrans po piątej** (5:15,
  UA *чверть на шосту*), **za kwadrans szósta** ✅ (5:45), ⚠️ **dziesięć po piątej**, **za dziesięć szósta** ✅; **w
  południe, o północy**; **od ósmej do szesnastej** ⚠️ (*з восьмої*), **między piątą a szóstą**, **około szóstej** ✅,
  **przed piątą** ⚠️ (*до п’ятої*), **po piątej** ✅, **za pięć minut** ⚠️ (*через п’ять хвилин*), **pięć minut temu** ✅,
  **przez godzinę**, **w ciągu godziny**, **pół godziny** ✅, **półtorej godziny / półtora roku** ✅ *півтори / півтора*,
  **kwadrans**, **doba** ✅; written forms **godz. 15.30 / 15:30**.
- **num-indef** «Неозначено-кількісні: kilka, wiele, dużo», A2–B1 — **kilka/kilku, parę/paru** (⚠️ = *кілька*, not exactly 2),
  **wiele/wielu, dużo** (no virile form), **mało, niewiele/niewielu, ile/ilu, tyle/tylu, trochę, sporo ✅ (чимало), mnóstwo,
  większość, kilkanaście / kilkadziesiąt / kilkaset ✅** (*кільканадцять, кількадесят, кількасот*); + Р. мн., verb 3 sg n.
  (**Kilka osób przyszło**, **Wielu ludzi myśli**); declension (**kilku, kilkoma**); mass nouns (**dużo czasu, mało pieniędzy**).
- **num-life** «Вік, ціни, гроші, дроби», A1–B1 — age: **Ile masz lat? — Mam dwadzieścia lat** ⚠️ (*Скільки тобі років? —
  Мені двадцять*); **rok / lata / lat** suppletion; **dwadzieścia jeden lat**; **w wieku dwudziestu lat**; money: **złoty /
  złote / złotych** (adjectival), **grosz / grosze / groszy**, **euro** (indecl.), **dolar**, **hrywna**; **Płacę kartą /
  gotówką** ✅; fractions **pół, półtora/półtorej ✅, ćwierć, jedna trzecia, dwie trzecie, trzy czwarte, połowa**; decimals
  **dwa i pół**, **trzy przecinek pięć** ⚠️; percent (**dziesięć procent**); multiplicatives **raz, dwa razy, pięć razy**,
  **podwójny ✅**, **dwukrotnie**; distributive **po dwa jabłka ✅, po pięć złotych**; measures (**kilo, pół kilo, deko** —
  **dwadzieścia deko sera** in shops!, litr, metr).

---

### Branch G · `verb` — Дієслово (форми) · file `07-verb-forms.js` · ord 8

Kids carry an order number `o` (branch H inserts its nodes among them): verb-inf o:10, verb-be-have o:15, verb-pres o:20,
verb-past o:30, verb-fut o:40, (asp o:50 — branch H), verb-imp o:60, verb-cond o:70, verb-modal o:80, verb-irreg o:90,
(mot 100, refl 110, impers 120, passive 130, part 140 — branch H).

- **verb** «Дієслово» / Czasownik, A1 — categories table PL vs UA (особа, число, рід у мин. часі ✅, час (3) ✅, вид ✅,
  спосіб, стан); key differences: personal endings in the past (**robiłem**), ос.-чол. in plural past (**-li/-ły**), compound
  imperfective future only (**będę robić / będę robił**, no *-му*), conjugation types vs UA I/II, **być** obligatory in present,
  Pan/Pani + 3rd person, impersonal **-no/-to** ✅, **się** as a separate mobile word; map of children incl. branch-H topics
  ([[asp]], [[mot]], [[refl]], [[impers]], [[passive]], [[part]]); «Як вчити польське дієслово»: інфінітив + 1 ос. одн. + 2 ос.
  одн. (+ мин. ч. ч. р. для неправильних) + видова пара.
- **verb-inf** «Інфінітив і дві основи», A1 — -ć (**robić, czytać, mieć**), -c ↔ *-гти/-кти* (**móc** *могти*, **piec**
  *пекти*, **biec** *бігти*, **strzec** *стерегти*), -ść/-źć ↔ *-сти/-зти* (**iść, jeść, nieść, kraść, wieźć, gryźć, kłaść,
  znaleźć**); infinitive stem vs present stem (**pisać: pisa- / pisz-**, **brać: bra- / bior-/bierz-**, **dawać: dawa- /
  daj-**) ✅ like UA; past from infinitive stem, present & imperative from present stem; infinitive uses (**Lubię czytać**,
  **Trzeba iść**, **Proszę usiąść**, **Nie palić!**, **Co robić?**); UA colloquial *-ть* infinitive (*робить*) is close to
  **robić**.
- **verb-be-have** «Być і mieć», A1 — full conjugations of być (present, past, future, imperative, conditional) and mieć;
  być obligatory in present (**Jestem studentem** vs *Я студент*), except «to»-sentences; predicate case [[syn-to]]
  [[case-ins]]; **jest/są** vs **nie ma + Р.**; mnemonic **są** ↔ old *суть*, **jestem** ↔ *єсмь*; mieć ✅ *маю, маєш…*;
  **miał / mieli** (a:e); idioms: **Mam 20 lat** ⚠️, **Mam na imię Anna** ⚠️, **Mam nadzieję** ⚠️ (*сподіваюся*), **Mam
  rację ✅**, **Masz ochotę na kawę?**, **Mam czas ✅**, **Jak się masz? ✅** (*як ся маєш*), **Co masz na myśli?**, **Mam
  dość** ⚠️, **Mam do ciebie prośbę ✅**, **Mam zamiar ✅**, **Mam to zrobić** (obligation), **Ma padać** (hearsay), **Nie ma za
  co ✅**; ⚠️ calque ~~U mnie jest brat~~ → **Mam brata**.
- **verb-pres** «Теперішній час: типи дієвідміни», A1 — endings table PL vs UA; traditional types: I **-ę, -esz** (pisać,
  nieść, pić, myć, -ować), II **-ę, -isz/-ysz** (robić, mówić, widzieć, leżeć), III **-am, -asz** (czytać, pytać, mieszkać,
  czekać, znać, grać), IV **-em, -esz** (umieć, rozumieć, wiem, jem); mapping: PL I ↔ UA I (*-еш*), PL II ↔ UA II (*-иш*),
  PL III ↔ UA *-аю, -аєш* (contracted: **czytam** ↔ *читаю*), PL IV ↔ *-ію, -ієш* (**umiem** *умію*) + athematic (**jem**
  *їм*, **wiem**); person endings: 1 sg -ę/-m (*-у/-ю*), 2 sg -sz ✅, 3 sg Ø (⚠️ **robi** vs *робить*), 1 pl -my (*-мо*),
  2 pl -cie (*-те*), 3 pl -ą/-ją (*-уть/-ють/-ать*); full paradigms of 6–8 model verbs with UA; uses (habits, general truths,
  scheduled future **Jutro jadę**, **Mieszkam tu od roku** ✅ *живу тут уже рік*). Child:
  - **verb-pres-alt** «Чергування в теперішньому часі», A2 — s→sz (**piszę** ✅ *пишу*), k→cz (**płaczę** ✅; **piekę /
    pieczesz** ⚠️ *печу / печеш*), g→ż (**mogę / możesz / mogą** ⚠️ *можу / можеш / можуть*), t→c (**płacę** ⚠️ *плачу*),
    d→dz (**chodzę** ⚠️ *ходжу*), s→sz (**proszę** ✅), z→ż (**wożę** ✅), ść→szcz (**czyszczę** ✅ *чищу*), labial + i
    (**robię, kupię, mówię, śpię** ↔ *роблю, куплю, мовлю, сплю* — UA epenthetic *л* vs PL *i*), -ować → -uję ✅ (**pracuję**
    *працюю*), -ywać/-iwać → -uję ✅ (**pokazuję**), -awać → -aję ✅ (**daję, wstaję, sprzedaję**), -nąć → -nę ✅ (**zamknę**),
    vowel alternations (**niosę / niesiesz / niosą**, **biorę / bierzesz / biorą**, **jadę / jedziesz** ⚠️ vs *їду / їдеш*);
    systematic table «тип — PL — UA — збігається?».
- **verb-past** «Минулий час», A1–A2 — infinitive stem + ł/ła/ło/li/ły + mobile personal endings (-em, -eś, Ø, -śmy, -ście);
  full table vs UA (*робив/робила + займенник*); pronoun redundant (**Byłem w Krakowie**); ł ↔ UA *в* (same sound [w]: *був*
  **był**); -eć verbs a/e (**miał / mieli, wiedział / wiedzieli, chciał / chcieli, widział, musiał, umiał, rozumiał**);
  irregular: **iść → szedł, szła, szli** (✅ *ішов*), **jeść → jadł, jedli**, **móc → mógł, mogli** (✅ *міг, могли*, ó ↔ *і*),
  **nieść → niósł, nieśli** ✅, **wieźć → wiózł**, **piec → piekł** ✅, **wziąć → wziął, wzięła**, **zacząć → zaczął**,
  **zamknąć → zamknął, zamknęła**, **umrzeć → umarł** ✅, **usiąść → usiadł, usiedli**, **znaleźć → znalazł, znaleźli**;
  stress **robiliśmy**; mobile endings in colloquial speech (**Gdzieś był?**, **Coś zrobił?**, **Myśmy byli**) — recognise only
  (cf. Galician *де-с був?*); aspect in past → [[asp-use]].
- **verb-fut** «Майбутній час», A1–A2 — perfective: present-form = future ✅ (**zrobię, napiszę, kupię, pójdę**);
  imperfective: **będę + інфінітив** or **będę + ł-форма** (**będę robić / będę robił, będziemy robili/robiły**) — both
  standard; ł-form preferred with modals (**będę musiał, będę mógł**); ⚠️ no synthetic *робитиму*; ❌ **będę zrobić** (same rule in
  UA ✅); present for scheduled future; future in if/when clauses ✅ (**Jeśli będę miał czas, przyjdę**, **Kiedy przyjedziesz,
  zadzwoń**).
- **verb-imp** «Наказовий спосіб», A2 — formation from the present stem (3 sg / 3 pl): **pisz! czytaj! rób! (ó) mów! idź!
  siedź! jedź! jedz! pij! śpij! pracuj! dawaj! wstawaj!**; clusters → -ij/-yj (**zamknij! zacznij! wyjmij!**); irregular
  **weź! daj! bądź! miej! wiedz! powiedz! zobacz! patrz! chodź! przyjdź! wejdź! wyjdź! usiądź! stój! nie bój się! pomóż!**;
  1 pl +my (**chodźmy!** ✅ *ходімо*), 2 pl +cie; 3rd person & Pan/Pani: **niech** + present (**Niech pan usiądzie**, ✅ *хай*);
  **Proszę + інфінітив** (**Proszę usiąść**, **Proszę mówić wolniej**); conditional requests (**Czy mógłbyś…?**); infinitive in
  signs (**Nie palić**); aspect in imperative (affirmative pf / friendly impf **Siadaj! Wchodź!**; negative impf **Nie mów!**;
  negative pf = warning **Nie zapomnij!**) ✅ like UA; idioms **Daj spokój!**, **Słuchaj, …**, **Weź się w garść!** ⚠️,
  **Uważaj!**, **Chodź tu!** ⚠️ (*іди сюди*).
- **verb-cond** «Умовний спосіб: by, żeby, gdyby», A2–B1 — forms (**robiłbym / robiłabym … robilibyśmy … robiłyby**) ✅ ≈
  *робив би*; mobile **by** (**Chętnie bym przyszedł**); with conjunctions **gdybym, żebyś, jakby**; uses: politeness
  (**Chciałbym zamówić…**, **Czy mógłbyś mi pomóc?**, **Wolałbym…**); unreal conditional (**Gdybym miał czas,
  pojechałbym…** ✅ *Якби я мав час, поїхав би*), past unreal by context; real conditional **jeśli/jeżeli + майбутній** (not
  gdyby!), colloquial **jak**; **żeby/aby**: purpose with infinitive (same subject) / with past form + person ending on żeby
  (different subject: **Chcę, żebyś przyszedł** ✅ *щоб ти прийшов*; **Powiedz mu, żeby zadzwonił**); wishes (**Żeby tylko nie
  padało!**, **Obyś był zdrowy!**); mnemonic: *якби* = як + би = **gdy + by**; *щоб* = що + б = **że + by**.
- **verb-modal** «Модальні дієслова; wiedzieć / znać / umieć», A2 — **móc** (**Czy mogę wejść?**), **musieć** (✅ *мусити*;
  **nie musisz** ≠ **nie wolno**), **chcieć** (+ **chce mi się**), **woleć** (✅ *воліти*: **Wolę kawę niż herbatę**),
  **umieć** vs **potrafić**, **powinien** (full conjugation incl. past **powinienem był**), **mieć + інфінітив** (**Co mam
  robić?** ⚠️ *Що мені робити?*), можна/треба → [[adv-pred]]; **wiedzieć** (facts, + clause / o + Ms.) vs **znać** (person,
  place, thing, language) vs **umieć** (skill) — UA *знати* covers two ⚠️: table + errors ~~Znam, że…~~, ~~Wiem tego
  człowieka~~; **znać się na** ✅, **poznać** (*познайомитися*, транзитивне ⚠️: **Poznałem ją w Krakowie**), **dowiedzieć się**
  ✅.
- **verb-irreg** «Неправильні й ключові дієслова», A1–A2 — conjugation tables (present / past m-f / future / imperative) with a
  UA row for ~25 verbs: być, mieć, iść, jechać, jeść (✅ athematic *їм, їси, їсть, їмо, їсте, їдять* ↔ **jem, jesz, je,
  jemy, jecie, jedzą**), pić, wiedzieć, chcieć, móc, dać (✅ *дам, даси, дасть…* ↔ **dam, dasz, da, damy, dacie, dadzą**),
  brać / wziąć, spać, żyć, myć, stać (+ **stać się**: **Co się stało?** ✅), bać się, wstać, **zostać** (1. залишитися;
  2. стати: **Zostałem lekarzem**; 3. пасив [[passive]]), dostać, mówić / powiedzieć, widzieć / zobaczyć, umieć, rozumieć,
  znać, zapomnieć, kłaść / położyć, usiąść, znaleźć, **czuć** ⚠️ (*відчувати*).

---

### Branch H · aspect, motion, voice · file `08-verb-aspect.js` · nodes hang under `verb` via `parent: 'verb'`

Push these top items: `asp` (o:50), `mot` (o:100), `refl` (o:110), `impers` (o:120), `passive` (o:130), `part` (o:140).

- **asp** «Вид дієслова» / Aspekt, A2 — overview: same concept as UA (недоконаний / доконаний = niedokonany / dokonany);
  matrix 3 tenses × 2 aspects (pf has no present) ✅; how pairs form → [[asp-form]]; usage → [[asp-use]]; prefixes →
  [[asp-prefix]]; UA aspect intuition transfers ~90%, but pair partners often differ (**gotować / ugotować** vs *готувати /
  приготувати*).
  - **asp-form** «Утворення видових пар», A2 — (1) prefix: big table 40+ pairs with UA and ✅/⚠️ (**robić/zrobić ✅,
    pisać/napisać ✅, czytać/przeczytać ⚠️, jeść/zjeść ✅, pić/wypić ✅, uczyć się/nauczyć się ✅, gotować/ugotować ⚠️,
    myć/umyć ⚠️, płacić/zapłacić ✅, dzwonić/zadzwonić ⚠️, budować/zbudować ✅, czekać/poczekać, prosić/poprosić ✅,
    pytać/zapytać ✅, widzieć/zobaczyć ⚠️, słyszeć/usłyszeć ⚠️, czuć/poczuć, tracić/stracić ⚠️, rozumieć/zrozumieć ✅,
    wierzyć/uwierzyć ⚠️, kończyć/skończyć ✅, piec/upiec ⚠️, sprzątać/posprzątać ⚠️**); (2) suffix (**dawać/dać, sprzedawać/
    sprzedać, wstawać/wstać, kupować/kupić, zapisywać/zapisać, pokazywać/pokazać, opowiadać/opowiedzieć, odpowiadać/odpowiedzieć,
    otwierać/otworzyć, zamykać/zamknąć, wracać/wrócić** (⚠️ no się), **spotykać/spotkać, zaczynać/zacząć, przychodzić/przyjść,
    zapominać/zapomnieć, pomagać/pomóc, wysyłać/wysłać, dostawać/dostać, zostawać/zostać, zostawiać/zostawić, wybierać/wybrać,
    zdawać/zdać** ⚠️ (**zdawać egzamin** = складати, **zdać** = скласти), **poznawać/poznać, wydawać/wydać**); (3) suppletive
    (**brać/wziąć ✅, mówić/powiedzieć ✅, oglądać/obejrzeć, kłaść/położyć ✅, siadać/usiąść ✅**); (4) single-aspect verbs
    (impf only: **mieć, być, znać, móc, musieć, kosztować, należeć**); tips (PL **u-** often where UA *по-/при-*).
  - **asp-use** «Вживання видів», A2–B1 — impf: process/duration, repetition/habit, general fact/experience (**Czytałeś
    Mickiewicza?**), simultaneity, after **zaczynać/zacząć, kończyć/skończyć, przestać, lubić, umieć** ✅; pf: result, single
    completed action, sequence (**Wstałem, umyłem się i zjadłem śniadanie**), future promise; **w godzinę** ⚠️ (*за годину*) vs
    **przez godzinę**; negation (**Nie zrobiłem** vs **Nie robiłem tego**); modals (**Muszę to zrobić** vs **Muszę codziennie
    ćwiczyć**; **Nie mogę otworzyć** vs **Nie wolno otwierać**); questions (**Czy ktoś tu sprzątał?** vs **Czy ktoś
    posprzątał?**); **już / jeszcze nie**; UA rules ~identical ✅ — many contrasting pairs in examples.
  - **asp-prefix** «Префікси дієслів: значення», B1 — table: prefix — spatial meaning — aspectual/other — PL examples — UA
    counterpart ✅/⚠️: do-, na- (**najeść się** ✅ *наїстися*), nad-, o-/ob- (**obejść** ✅, **obudzić** ⚠️), od- (**odejść,
    oddać, odpocząć** ✅), po- (**pójść ✅, posiedzieć ✅** delimitative, **porozmawiać** ⚠️ *поговорити*), pod- (**podejść,
    podpisać** ✅, **podnieść** ⚠️), prze- (**przejść, przepisać** ✅, **przeczytać** ⚠️ = *прочитати*, **przegrać** ⚠️ =
    *програти*, **przeżyć** ✅, **przemyśleć** ⚠️, **przeziębić się** ⚠️), przy- (**przyjść, przynieść, przygotować** ✅), roz-
    (**rozejść się, rozbić, rozpakować** ✅), u- (**ugotować, umyć, usłyszeć** ⚠️, **uciec, ukraść** ✅), w-/we- (**wejść** ✅,
    **włożyć** ⚠️), wy- (**wyjść, wypić, wygrać, wybrać, wyspać się** ✅), z-/s-/ze- (**zejść, zjeść, zrobić, zebrać** ✅,
    **spotkać** ⚠️), za- (**zapisać, zapomnieć, zamknąć, zaprosić, zapłacić, zachorować, zasnąć** ✅, **zacząć, zadzwonić** ⚠️);
    reflexive combos (**najeść się, napić się** ⚠️, **wyspać się, rozpłakać się** ✅); false friends **przeczytać ≠ перечитати**,
    **przegrać ≠ переграти**.
- **mot** «Дієслова руху», A2 — overview: same system as UA (однонаправлені vs різнонаправлені **iść/chodzić** ✅); iść
  (on foot) vs jechać (vehicle) ✅; **chodzić** = attend (**Chodzę do szkoły** ✅); **pójść / pojechać**; **Idę do pracy**
  (now) vs **Chodzę do pracy** (regularly); prepositions → [[prep-place]].
  - **mot-pairs** «Однонаправлені й різнонаправлені», A2 — 8 pairs + UA: iść/chodzić, jechać/jeździć, lecieć/latać,
    płynąć/pływać, biec/biegać, nieść/nosić, wieźć/wozić, prowadzić/wodzić (rare); conjugations (idę, idziesz; szedł /
    chodzę; jadę, jedziesz; jechał / jeżdżę, jeździsz; lecę, lecisz / latam; płynę / pływam; biegnę, biegł / biegam; niosę,
    niósł / noszę; wiozę, wiózł / wożę); contrasts with many examples (now vs habit vs round trip **Wczoraj chodziłem do kina**
    ✅, ability **Dziecko już chodzi**, **pływać** = *плавати*, **nosić okulary** ✅ *носити окуляри*, **prowadzić samochód** ⚠️
    *кермувати*); colloquial **Lecę!**, **Muszę lecieć**, **Jak leci?** (*як справи?*), **Co leci w kinie?**.
  - **mot-prefix** «Префіксальні дієслова руху», B1 — **-jść** (**przyjść, wyjść, wejść, zejść, przejść, odejść, dojść,
    podejść, obejść, rozejść się, pójść, nadejść**) / **-chodzić** pairs ✅; conjugation (**przyjdę; przyszedł, przyszła;
    wejdę; wszedł, weszła; wyszedł; zszedł; obszedł**); prefix + jechać (**przyjechać/przyjeżdżać** ✅ *-жджа-* ↔ **-żdża-**,
    wyjechać, wjechać, zjechać, przejechać, odjechać, dojechać, podjechać, objechać), + nieść (**przynieść/przynosić,
    wynieść, zanieść, odnieść, podnieść** ⚠️), + wieźć (**przywieźć, odwieźć, zawieźć**), + lecieć (**przylecieć/
    przylatywać, wylecieć, odlecieć**), + biec (**uciec/uciekać** ⚠️); prefix ↔ preposition table (**przyjść do, wyjść z,
    wejść do, zejść z / na, przejść przez, odejść od, dojść do, podejść do, obejść + З., zajść do**); idioms **wyjść za mąż ✅,
    dojść do wniosku, przejść na emeryturę ⚠️, przyjść do siebie ⚠️, wejść w życie ⚠️, Co cię to obchodzi? ⚠️, obchodzić
    urodziny ⚠️, Jak ci poszło?, udać się ✅**.
- **refl** «Дієслова з się», A1–B1 — **się** = *-ся* but a separate, mobile word: position rules (usually after the verb or
  second in the clause; never first; **Jak się nazywasz?**, **Nie boję się**, **Muszę się uczyć / Muszę uczyć się**; one się
  serves verb + infinitive); types: true reflexive (**myć się, ubierać się** ✅), reciprocal (**spotykać się, kłócić się, znać
  się** ✅), inherent (**bać się, śmiać się, podobać się, wydawać się, starać się, spieszyć się** ⚠️, **kłaść się** ⚠️, **cieszyć
  się** ⚠️, **nudzić się** ⚠️, **przyzwyczajać się** ⚠️, **dziwić się, zdarzać się, okazać się, udać się** ✅), impersonal/
  middle (**Tak się mówi**, **Drzwi się otworzyły** ✅, **Sklep otwiera się o 9**), lexical change (**uczyć / uczyć się**,
  **bawić / bawić się**, **nazywać się** = прізвище ⚠️ vs **mieć na imię**, **wydawać / wydawać się**); mismatch tables: PL się /
  UA без -ся (**spieszyć się, kłaść się, przyzwyczaić się, cieszyć się, nudzić się, napić się, zdecydować się,
  przeprowadzić się**) and UA -ся / PL без się (**wracać** *повертатися*, **zostać** *залишитися*, **patrzeć / oglądać**
  *дивитися*, **mieć nadzieję** *сподіватися*, **uczestniczyć** *брати участь*); **Uczę się polskiego** (Р.!).
- **impers** «Безособові конструкції», B1 — **-no/-to** (**zrobiono, powiedziano, zbudowano, zamknięto, otwarto,
  znaleziono**) ✅ *зроблено, сказано…* + З. object (**Zbudowano nowy most** ✅); only past reference; impersonal **się**
  (**Mówi się, że…**, **Tu się dobrze je**, **Jak się tam jedzie?**, **Tu sprzedaje się bilety**); 3 pl without subject
  (**Mówią, że…** ✅); trzeba/można/da się + inf → [[adv-pred]]; dative experiencer verbs ✅ (**Chce mi się pić, Nie chce
  mi się, Wydaje mi się, Udało mi się, Śni mi się, Brakuje mi…, Zdarza mi się, Dobrze mi się pracuje, Nudzi mi się,
  Zrobiło mi się zimno**; **Spieszy mi się** ⚠️; **Boli mnie głowa** — З.); weather (**Pada deszcz** ⚠️ *іде дощ*, **Grzmi,
  Błyska się, Wieje, Świta, Ściemnia się, Mży, Leje** ✅); **słychać / widać / czuć**; **Nie ma kogo zapytać ✅, Nie ma gdzie
  usiąść ✅**.
- **passive** «Пасивний стан», B1 — **być** + passive participle (state/process) vs **zostać** + participle (event/result);
  tenses; agreement incl. ос.-чол. (**Studenci zostali zaproszeni / Studentki zostały zaproszone**); agent **przez + З.**
  ⚠️ (UA орудний: *написана Сенкевичем*); when used (news, formal, history); alternatives (3 pl active, się, -no/-to); UA style
  note (UA prefers *-но/-то* or active over *бути + дієприкметник*); stative **Sklep jest zamknięty** ✅; participles → [[part]].
- **part** «Дієприкметники, дієприслівники, віддієслівні іменники», B1 — (1) active present participle **-ący** (**czytający,
  pracujący, śpiący, interesujący**) — used freely in PL; UA norm avoids *-учий/-ючий* → *який + дієслово* or an adjective
  (**interesujący** *цікавий*, **następujący** *наступний*, **wiodący** *провідний*) ⚠️; (2) passive participle
  **-ny/-ony/-ty** (**napisany, zrobiony, kupiony, zmęczony, zadowolony, zaproszony, zamknięty, zajęty, wzięty, umyty,
  otwarty, zepsuty**) ✅ like UA; ос.-чол. forms (**zaproszeni, zmęczeni, zajęci**); (3) adverbial present **-ąc** (**czytając,
  idąc, mówiąc, będąc, mając, wiedząc, siedząc**) ✅ *-учи/-ючи*; same-subject rule ✅; **nie wiedząc** (separate); (4) adverbial
  anterior **-wszy/-łszy** (**przeczytawszy, zrobiwszy, wszedłszy**) ✅ form like *прочитавши*, but ⚠️ bookish/rare in PL speech —
  use **po + віддієслівний іменник** (**Po przeczytaniu…**) or **kiedy…**; (5) verbal noun **-nie/-cie** ✅ *-ння/-ття*
  (**czytanie, pisanie, palenie, picie, życie, spotkanie** ⚠️, **zdanie** ⚠️, **mieszkanie** ⚠️, **zadanie, pytanie,
  ćwiczenie** ⚠️; **Zakaz palenia**, **Do zobaczenia!**, **Dziękuję za zaproszenie**); spelling of **nie** with participles.

---

### Branch I · `prep` + `wf` — Прийменники; Словотвір · file `09-prep-wf.js` · ord 9 (prep) and 11 (wf) — push two branch objects

- **prep** «Прийменники» / Przyimki, A1 — overview: every preposition governs a case; double-case prepositions (motion = З. /
  location = Ms. or О.) ✅ same system as UA; system table (preposition → case(s) → main meanings → UA); vocalization; key
  divergences with links.
- **prep-gen** «Прийменники з родовим», A1–A2 — do, od, z/ze (from, material **z drewna** ✅, cause **z radości** ✅), bez ✅,
  dla ✅, **u** (**u mamy, u lekarza** ✅; **Co u ciebie?** ✅; ⚠️ calque ~~U mnie jest samochód~~ → **Mam samochód**), obok,
  koło, blisko, niedaleko, wśród ✅, według ⚠️ (**według mnie** = *на мою думку*), zamiast ✅, oprócz/poza ✅, podczas ✅, w
  ciągu ✅, z powodu ⚠️ (*через*), naprzeciw(ko) ✅, wzdłuż ✅, wokół/dookoła ✅, około ✅, compound **spod, sprzed, zza, znad,
  spoza** ✅ (*з-під, з-за, з-над, з-поза*); **szczotka do zębów** ⚠️.
- **prep-dat-acc** «Прийменники з давальним і знахідним», A2 — + Д.: **dzięki** ✅, **ku**, **przeciw(ko)** ⚠️ (UA *проти + Р.*),
  **wbrew** ✅; + З.: **przez** (через; **przez telefon** ⚠️ *по телефону*; **przez godzinę**; fault **przez ciebie** ✅;
  passive agent), **na** (direction; purpose/time span **na tydzień ✅, na obiad ✅, na zawsze ✅**; **lekarstwo na kaszel** ⚠️;
  **czekać / patrzeć / liczyć na** ✅; **chory na grypę** ✅), **w** (direction, days, **grać w** ✅, **wierzyć w** ✅), **za**
  (**za tydzień** ⚠️ *через тиждень*; price **za 10 złotych** ✅; **dziękuję za** ✅; **wyjść za mąż za** ✅), **o** (**pytać o
  drogę, prosić o pomoc** ⚠️, **dbać o** ✅, **walczyć o** ⚠️ *за*, **o dwa lata starszy** ⚠️), **po** (fetch: **iść po chleb**
  ✅ *по хліб / за хлібом*; **po kolana** ✅), **pod / nad / przed / między** of direction (**jechać nad morze** ⚠️ *на море*).
- **prep-ins-loc** «Прийменники з орудним і місцевим», A1–A2 — + О.: **z** (**z bratem**, **kawa z mlekiem**, **my z bratem**
  ✅ = *ми з братом*, **z przyjemnością** ✅), **za** (**za domem, za granicą** ✅, **tęsknić za** ✅), **nad** (**nad morzem**
  ⚠️ *на морі*, **nad rzeką** ✅, **pracować nad** ✅), **pod** (**pod Krakowem** ✅), **przed** (**przed domem** ✅, **przed
  obiadem** ✅, **przed chwilą** ⚠️ *щойно*, **chronić przed** ⚠️), **między** ✅, **poza** (**poza tym** ⚠️ *крім того*),
  **zgodnie z** ✅, **w porównaniu z** ✅; + Ms.: **w** (**w domu, w Polsce, w lipcu, w okularach** ✅, **w pracy** ⚠️ *на
  роботі*), **na** (**na stole, na poczcie, na uniwersytecie** ⚠️, **na dworcu** ✅, **na lotnisku** ⚠️, **na koncercie, na
  lekcji** ✅, **na wsi** ⚠️ *у селі*, **grać na gitarze** ✅, **znać się na** ✅), **o** (**mówić o pracy** ⚠️, **o piątej** ✅),
  **po** (**po obiedzie** ⚠️ *після*, **po mieście** ✅, **po polsku**), **przy** (**przy stole** ⚠️ *за столом*, **przy oknie**
  *біля вікна*, **przy sobie** ✅, **przy okazji** ✅, **przy kawie** ⚠️).
- **prep-place** «Де? Куди? Звідки?», A1–A2 — triads table: **w + Ms. / do + Р. / z + Р.** (buildings, cities, most countries);
  **na + Ms. / na + З. / z + Р.** (open spaces, events, institutions, islands, regions: **na poczcie / na pocztę / z poczty;
  na koncercie; na uniwersytecie; na Węgrzech / na Węgry / z Węgier; na wsi / na wieś / ze wsi; na dworcu; na lotnisku**;
  **w Ukrainie / do Ukrainy / z Ukrainy** and the traditional **na Ukrainie / na Ukrainę** — explain RJP 2022 recommendation);
  **u + Р. / do + Р. / od + Р.** (persons ✅ *у / до / від*); **nad + О. / nad + З. / znad + Р.** (water ⚠️); **pod / spod**;
  **za / zza** (**za granicą / za granicę / z zagranicy**); **przed / sprzed**; **w domu / do domu / z domu** ✅; **w górach /
  w góry / z gór** ✅; rules w vs na with lists (regions **na Śląsku** ⚠️ *у Сілезії*, **na Mazurach, na Pomorzu, na Wołyniu ✅,
  na Podolu ✅, na Zakarpaciu ✅**; streets/squares; events; institutions; floors); divergences from UA (**w pracy / na
  uniwersytecie / na lotnisku / nad morzem**).
- **prep-time** «Прийменники часу», A2 — **w + З.** (days), **w + Ms.** (months, years, centuries; ⚠️ **w zeszłym / przyszłym /
  tym roku**), **o + Ms.** (clock ✅), seasons (**zimą / w zimie**), О. alone (**wieczorem, nocą, latem, dniem i nocą** ✅),
  **za + З.** ⚠️ (**za tydzień, za godzinę, za chwilę**), **temu** ✅ (postposition), **przed + О.** (**przed obiadem** ✅,
  **przed wojną** ✅, **przed chwilą** ⚠️), **po + Ms.** ⚠️ (**po obiedzie, po pracy, po południu**), **od + Р.** ⚠️ (**od rana,
  od poniedziałku, od dwóch lat, od dziecka**), **do + Р.** ✅, **od… do…** ⚠️ (*з… до…*), **przez + З.** (duration), **na + З.**
  (planned span/deadline **na tydzień ✅, na jutro ✅, na czas** ⚠️ *вчасно*, **na razie** ⚠️), **w ciągu** ✅, **podczas** ✅,
  **około** ✅, **w godzinę** ⚠️ (*за годину*), **co + З./Р.** (**co tydzień, co roku, co dwa dni**), ⚠️ **na tydzień przed
  wyjazdem** (*за тиждень до від’їзду*); big PL ↔ UA comparison table.
- **prep-vocal** «Вокалізація: ze, we, ode…», A2 — **z → ze** (before z/s/ź/ś/ż/sz + consonant, **ze mną, ze szkoły, ze
  Szczecina, ze wszystkimi, ze złości**), **w → we** (before w/f + consonant: **we Wrocławiu, we wtorek, we Francji, we
  Włoszech, we wsi, we mnie**; **w środę** standard), **ode mnie, nade mną, pode mną, przede mną / przede wszystkim, beze
  mnie, przeze mnie**; pronunciation (**z kotem** [s], **w szkole** [f]); UA parallels (*у/в, з/із/зі; зі мною* ✅, *переді
  мною* ✅, *наді мною* ✅; *без мене* vs **beze mnie** ⚠️, *від мене* vs **ode mnie** ⚠️); prefix spelling **s- / z- / ś- /
  ze-** (**spotkać, skończyć, zrobić, ściągnąć, zebrać**) vs the preposition which is always **z** ✅ like UA prefix *с-*
  before к, п, т, ф, х.
- **prep-false** «Прийменникові пастки: PL ≠ UA», B1 — compact divergence table 30+: **o + Ms.** (*про + З.*), **do kina**
  (*в кіно*), **na uniwersytet**, **w pracy**, **za tydzień**, **przez godzinę**, **w godzinę**, **na tydzień przed**, **od
  rana**, **od… do…**, **po obiedzie**, **przed piątą**, **przy stole**, **przez telefon**, **nad morze / nad morzem**,
  **dzwonić / pisać do kogoś**, **lekarstwo na**, **szczotka do zębów**, **klucz do / od**, **na prawo / w prawo**, **według
  mnie**, **przeciwko + Д.**, **z powodu**, **o dwa lata**, **walczyć o**, **zakochany w + Ms.**, **na wsi**, **pod adresem** ⚠️
  (*за адресою*), **pod warunkiem** ⚠️ (*за умови*), **pod numerem** ⚠️, **w sprawie** ✅, **mówić po polsku** (*говорити
  польською*).
- **wf** «Словотвір» / Słowotwórstwo, A2 — overview: shared Proto-Slavic morphemes let you decode words; suffix correspondence
  table (-arz/*-ар*, -nik/*-ник*, -ciel/*-тель*, -ość/*-ість*, -stwo/*-ство*, -nie/*-ння*, -arnia/*-арня*, -isko/*-ище*,
  -ski/*-ський*, -owy/*-овий*, -liwy/*-ливий*); map.
- **wf-person** «Назви осіб і фемінітиви», A2 — -arz/-erz (**lekarz, piekarz, kucharz, malarz, pisarz** ⚠️, **żołnierz**), -nik
  (**pracownik, urzędnik, rolnik**), -ciel (**nauczyciel, przyjaciel** ⚠️, **właściciel** ⚠️), -ca (**sprzedawca, kierowca** ⚠️,
  **obrońca**), -ec/-iec (**mieszkaniec, Ukrainiec, chłopiec**), -ik/-yk, -ista/-ysta, -ent/-ant, -or/-tor, -anin (**Rosjanin,
  warszawianin, krakowianin, lwowianin, kijowianin** ✅, pl -anie ✅), -ak (**Polak, rodak** ⚠️); feminine -ka (**studentka,
  nauczycielka, Polka, lekarka, aktorka, kelnerka**), -ini/-yni (**gospodyni** ✅ *господиня*, **mistrzyni, sprzedawczyni** ✅,
  **bogini**), -owa (**królowa**); feminitives debate in PL (**pani minister, pani dyrektor, pani prezes** vs **ministra,
  psycholożka**) vs UA 2019 norm (*авторка, директорка* ✅ more established); inhabitants of cities lowercase (**warszawiak**)
  vs nationalities capitalized (**Polak**).
- **wf-dimin** «Зменшувальні та пестливі форми», A2 — m -ek (**domek, kotek, synek**), -ik/-yk (**konik, kluczyk, stolik**
  ⚠️, **deszczyk**), -uś (**tatuś**, **Jaś**), -eczek/-uszek (**kwiatuszek**); f -ka (**rączka, nóżka, główka, kawka, wódka** —
  historically «водичка»!), -eczka (**córeczka**), -usia/-unia/-sia/-cia/-nia (**mamusia, babcia, ciocia, Kasia, Basia**); n -ko
  (**okienko, piwko, słoneczko**, originally diminutive **łóżko, jabłko, dziecko**), -ątko (**zwierzątko** ✅ *звірятко*); first
  names table (Anna–Ania/Anka, Katarzyna–Kasia, Małgorzata–Gosia/Małgosia, Barbara–Basia, Aleksandra–Ola, Joanna–Asia,
  Maria–Marysia, Zofia–Zosia, Elżbieta–Ela, Magdalena–Magda, Jan–Janek/Jaś, Piotr–Piotrek, Tomasz–Tomek, Paweł–Pawełek,
  Michał–Michałek, Krzysztof–Krzysiek, Stanisław–Staszek/Staś, Wojciech–Wojtek, Józef–Józek, Jakub–Kuba, Aleksander–Olek,
  Bartłomiej–Bartek); usage: shop politeness (**Poproszę kawkę i bułeczkę** ✅ *кавочку*), children; augmentatives/pejoratives
  -isko (**psisko** ✅ *псище*), -sko; lexicalised diminutives (**stolik, zegarek** ⚠️, **kubek, wózek, ogródek**); vocative
  -u of diminutives (**Kasiu!**).
- **wf-abstract** «Абстрактні іменники, назви місць і пристроїв», B1 — -ość ✅ *-ість* (**radość, młodość, szybkość, możliwość,
  odpowiedzialność, wiadomość** ⚠️, **przyszłość** ⚠️, **miłość** ⚠️), -stwo/-ctwo ✅ (**bogactwo, społeczeństwo,
  dzieciństwo, towarzystwo, państwo** ⚠️, **bezpieczeństwo** ⚠️, **małżeństwo** ⚠️, **rodzeństwo** ⚠️, **zwycięstwo** ⚠️,
  **lekarstwo** ⚠️), -anie/-enie (→ [[part]]), -ota (**głupota, prostota**), -izna (**ojczyzna** ✅, **polszczyzna** ⚠️), -cja/
  -sja/-zja ✅ *-ція/-сія/-зія*; places -arnia ✅ *-арня* (**kawiarnia, księgarnia, piekarnia, cukiernia** ✅, **kwiaciarnia**),
  -alnia/-elnia (**czytelnia, sypialnia, pralnia, przebieralnia, poczekalnia, jadalnia** ⚠️ (UA *їдальня* = **stołówka**)),
  -isko (**lotnisko, boisko, lodowisko, schronisko, środowisko** ✅, **stanowisko** ⚠️); devices -arka/-ka/-ówka (**zmywarka,
  pralka, lodówka, suszarka, drukarka, ładowarka**), -acz (**odkurzacz** ⚠️, **słuchacz** ✅, **tłumacz** ✅ *перекладач*),
  -dło/-ło (**mydło, źródło, wiosło** ✅).
- **wf-adj** «Творення прикметників», B1 — -ny (**dzienny, nocny, wodny, ręczny, letni, wiosenny, jesienny**), -owy (**domowy,
  kawowy, owocowy, pomarańczowy, zimowy**), -ski/-cki/-dzki (**polski, krakowski, lwowski, kijowski, warszawski, morski, miejski,
  ludzki, gdański, łódzki, ukraiński, rosyjski, angielski**), -liwy/-iwy (**szczęśliwy, prawdziwy** ⚠️, **cierpliwy** ⚠️,
  **troskliwy, gadatliwy, życzliwy, wrażliwy**), -isty (**złocisty, ognisty, puszysty** ⚠️), -aty (**brodaty, skrzydlaty,
  rogaty** ✅), -alny/-elny (**czytelny** ⚠️, **jadalny** ⚠️); prefixes nie-, bez- (**bezpłatny, bezpieczny, bezrobotny** ✅),
  przed-, po- (**przedwojenny, powojenny**), między- (**międzynarodowy** ✅), nad- (**nadmorski** ⚠️ *приморський*), pod-
  (**podmiejski** ⚠️ *приміський*), pra-; compound adjectives & spelling (**biało-czerwony, polsko-ukraiński** ✅,
  **ciemnoniebieski** ⚠️ together vs UA *темно-синій*).

---

### Branch J · `syn` — Синтаксис · file `10-syntax.js` · ord 10

- **syn** «Синтаксис речення» / Składnia, A1 — PL syntax ≈ UA syntax (free word order, pro-drop, same clause types and
  conjunction logic); main differences: enclitics (się, mi, go, by-forms), obligatory **być**, «to»-sentences, **że vs co**,
  **żeby** + person endings, genitive of negation, government; map.
- **syn-order** «Порядок слів і енклітики», A2–B1 — neutral SVO; theme → rheme (new info at the end) ✅; fronting for emphasis;
  question word first; adjective position → [[adj-agree]]; enclitics (**się, mi, ci, cię, go, mu**, by-forms, mobile endings):
  not at the absolute beginning (~~Mi się podoba~~ → **Podoba mi się / Mnie się podoba**), tendency to the second position /
  right after the verb (**Jak się masz?**, **Chyba się spóźnię**, **Dobrze mi się tu mieszka**); sentence-final **się** is fine
  in short clauses (**Boję się**, **Spotkajmy się**); cluster order (**Podoba mi się**, **Pokażę ci go**); long forms for
  emphasis; UA has no clitics → typical errors (overusing **ja**, fronting **mi**); time/place order ✅.
- **syn-quest** «Питальні речення», A1 — **czy** ✅ *чи*; intonation-only questions; question words list with UA (**gdzie,
  dokąd, skąd, kiedy, od kiedy, na jak długo, jak długo, dlaczego / czemu** ✅, **po co** ✅ *навіщо*, **za ile** ✅, **ile razy**,
  **jaki / który**); tags **prawda?, tak?, nie?, no nie?**; negative questions (**Czy nie masz czasu?** ✅); alternative
  **Kawa czy herbata?** ✅; indirect **Nie wiem, czy…** ✅; answers (**Tak / Nie, owszem, jasne, pewnie, oczywiście**; echo answer
  with the verb **Masz czas? — Mam.** ✅); **Słucham?** (polite *перепрошую?*) vs **Co?** (rude-ish).
- **syn-neg** «Заперечення», A1–A2 — **nie** + verb separate ✅; **nie** with adjectives/adverbs/nouns together (**niedobry,
  niedaleko**) except contrast; separate with comparatives, numerals, pronouns; participles → [[part]]; multiple negation ✅
  (**Nikt nigdy nikomu nic nie mówił**); genitive → [[case-neg]]; **nie ma**; **ani… ani…** ✅; **ani razu, ani słowa** ✅;
  **wcale nie ✅, jeszcze nie ✅, już nie ✅, nigdy nie ✅, też nie ✅**; ⚠️ **nie… tylko…** (**To nie mój, tylko twój** = *Це не
  мій, а твій*); **Nie, dziękuję**.
- **syn-to** «Речення з to і być», A1–A2 — **X to Y** (Н.–Н., identification/definition: **Warszawa to stolica Polski** = *Варшава —
  столиця Польщі* (UA dash!), **To jest Anna**, **Kto to jest? — To mój kolega**) vs **X jest + О.** (characterization: **Mój brat
  jest lekarzem**); adjectives always Н. (**Brat jest wysoki**); **to + adj/adv** (**To jest ważne, To dobrze, To prawda** ✅);
  resumptive **to** (**Jeśli przyjdziesz, to porozmawiamy** ✅ *то*); **To są moi rodzice** (verb pl!); past agreement with the
  predicate (**To była moja siostra** ✅); errors ~~On jest lekarz~~, ~~To jest lekarzem~~.
- **syn-coord** «Сполучники сурядності», A1–A2 — **i** ✅, **oraz** (книжн.), **a** ✅, **ale** ✅, **lecz** (книжн.), **tylko**,
  **jednak** ✅, **natomiast** ✅, **albo / lub** ✅ (**albo… albo…**), **czy**, **ani**, **więc** ✅, **zatem**, **dlatego**,
  **bo**, **czyli** ✅ *тобто*, **i… i…** ✅, **zarówno… jak i…** ✅, **nie tylko…, ale też / lecz także…** ✅, **raz…, raz…** ⚠️
  (*то…, то…*); a / i / ale ✅ same logic; commas → [[syn-punct]].
- **syn-sub** «Складнопідрядні речення», A2–B1 — table: type — PL conjunctions — UA — mood/tense notes. ⚠️ **że** (conj.) vs
  **co** (pronoun): *Я знаю, що він робить* = **Wiem, że on pracuje** / **Wiem, co on robi**; temporal **kiedy / gdy** ✅,
  **zanim** ✅ (+ pf future), **aż** ⚠️ (**Czekaj, aż przyjdę** = *Чекай, доки я не прийду* — no negation in PL), **dopóki nie** ✅,
  **odkąd** ✅, **jak tylko / gdy tylko** ✅, **podczas gdy** ✅, **po tym, jak** ✅; causal **bo, ponieważ, dlatego że, gdyż,
  skoro** ✅; concessive **chociaż / choć, mimo że, choćby, nawet jeśli** ✅; purpose **żeby / aby / by**, **po to, żeby** ✅;
  result **więc, tak że**; conditional **jeśli / jeżeli, gdyby, o ile** → [[verb-cond]]; comparative **niż, jak, jakby / jak
  gdyby** ✅; relative **który** (declined), **co, kto, gdzie, kiedy, jaki** → [[pron-int]]; content **że, czy, żeby**, question
  words ✅; correlatives **to, że…** ✅, **o tym, że…** ⚠️ (*про те, що*), **z tego, że…**, **dlatego, że…**; no sequence of
  tenses ✅.
- **syn-reported** «Непряма мова», B1 — statements (**Powiedział, że jest zmęczony** ✅ no tense shift), questions (**Zapytał,
  czy mam czas**, **Zapytała, gdzie mieszkam** ✅), commands (**Powiedział, żebym przyszedł** ✅ *щоб я прийшов*, **Poprosiła,
  żebym zadzwonił**, **Kazał mi czekać** ✅), deixis shifts (tu → tam, dziś → tego dnia, jutro → następnego dnia); reporting
  verbs (**twierdzić, uważać** ✅ *вважати*, **dodać, wyjaśnić, obiecać, przypomnieć, zaproponować, ostrzec** ⚠️, **przyznać**);
  hearsay markers **podobno ✅, rzekomo, jakoby** (книжн.), **mieć** (**Ma być ciepło**).
- **syn-punct** «Пунктуація й оформлення», B1 — commas before **że, który, żeby, bo, ponieważ, gdy, jeśli** ✅; no comma before
  **i, oraz, lub, albo, ani** (single) ✅; comma before **a, ale, lecz, jednak, więc** ✅; ⚠️ no comma in simple comparisons with
  **jak / niż** (**biały jak śnieg**, **starszy niż ja**) vs UA *білий, як сніг*, *старший, ніж я*; ⚠️ introductory words often
  without commas in PL (**Oczywiście masz rację**) vs mandatory in UA (*Звичайно, ти маєш рацію*); vocative commas ✅; participle
  clauses (-ąc, -wszy) separated ✅; dates (**5 maja 2024 r.**, **5.05.2024 r.**, **w latach 90.**), time (**godz. 15.30**);
  abbreviations with/without a dot (**dr, mgr, nr** — no dot: the abbreviation ends with the word's last letter; **prof., ul.,
  np., tzn., tj., itd., itp., m.in., ok., r., godz., tel.**); quotation marks „…” vs UA «…» ⚠️; capitalization (**Polak**,
  **Pan / Pani** in letters, months & days lowercase ✅); letters: **Szanowna Pani,** — after the comma the next line starts with a
  lowercase letter ⚠️; closings (**Z poważaniem**, **Pozdrawiam serdecznie**, **Łączę pozdrowienia**).
- **syn-etiquette** «Мовленнєвий етикет і формули», A1 — greetings (**Dzień dobry** (also in the morning), **Dobry wieczór,
  Cześć** (hi & bye), **Hej, Siema** (розм.), **Witam** (note on its use), **Do widzenia** (verbal noun ✅), **Do zobaczenia, Na
  razie** ⚠️, **Pa!, Dobranoc** ✅, **Do jutra**); politeness (**Proszę** — *будь ласка / прошу / ось / слухаю* (телефон),
  **Poproszę…** (in shops), **Dziękuję / Dzięki, Nie ma za co ✅, Proszę bardzo, Przepraszam** (apology & attention), **Nic nie
  szkodzi, Wszystko w porządku**); wishes (**Smacznego! ✅, Na zdrowie!** (toast & sneeze), **Sto lat!, Wszystkiego
  najlepszego! ✅, Gratuluję!** ⚠️ *вітаю*, **Powodzenia!** ⚠️, **Trzymam kciuki** ⚠️, **Miłego dnia!, Wesołych Świąt!,
  Szczęśliwego Nowego Roku!, Dobrej podróży!, Zapraszam!**); phone (**Halo?, Słucham ✅, Z kim rozmawiam?, Chwileczkę,
  Oddzwonię** ✅); introductions (**Jak masz na imię?, Jak się pan nazywa?, Mam na imię…, Nazywam się…, Miło mi, Skąd jesteś? —
  Jestem z Ukrainy, Jak się masz?, Co słychać? ✅** *Що чути?*, **Tak sobie ✅, W porządku**); emails (**Dzień dobry,** as the
  most common neutral opening; **Szanowna Pani, / Szanowni Państwo, / Pani Anno,**; **Z poważaniem, Pozdrawiam, Z wyrazami
  szacunku, Serdecznie pozdrawiam**); cultural notes: Pan/Pani with strangers of any age, **przejść na ty**.
