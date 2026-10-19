#!/usr/bin/env node
'use strict';
// Content-writing helper (text arrives on stdin, so non-ASCII content never goes through tool arguments).
//
// Insert mode — inserts stdin right before the first line containing <marker>:
//   node src/tools/insert.js <file> <marker> <<'PLGRAM_EOF'
//   ...text...
//   PLGRAM_EOF
//   Repeated calls with the same marker append in order (the marker stays last).
//
// Replace mode — replaces one exact occurrence of a text fragment:
//   node src/tools/insert.js <file> --replace <<'PLGRAM_EOF'
//   ...old text (exact, may span lines)...
//   @@@REPLACE-WITH@@@
//   ...new text...
//   PLGRAM_EOF
//   Fails if the old text is not found or is found more than once.
const fs = require('fs');

const [file, mode] = process.argv.slice(2);
if (!file || !mode) {
  console.error('Usage: node insert.js <file> <marker>   |   node insert.js <file> --replace   (text on stdin)');
  process.exit(2);
}

const SEP = '@@@REPLACE-WITH@@@';
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const input = Buffer.concat(chunks).toString('utf8').replace(/\r\n/g, '\n');
  const src = fs.readFileSync(file, 'utf8');

  if (mode === '--replace') {
    const parts = input.split('\n' + SEP + '\n');
    if (parts.length !== 2) {
      console.error(`Replace mode needs exactly one line "${SEP}" between the old and the new text.`);
      process.exit(2);
    }
    const oldText = parts[0];
    const newText = parts[1].replace(/\n$/, '');
    const first = src.indexOf(oldText);
    if (first < 0) {
      console.error('Old text not found (it must match the file exactly, including spaces and line breaks).');
      process.exit(1);
    }
    if (src.indexOf(oldText, first + 1) >= 0) {
      console.error('Old text occurs more than once; include more surrounding text to make it unique.');
      process.exit(1);
    }
    fs.writeFileSync(file, src.slice(0, first) + newText + src.slice(first + oldText.length), 'utf8');
    console.log(`Replaced ${oldText.length} chars with ${newText.length} chars in ${file}`);
    return;
  }

  let text = input;
  if (!text.endsWith('\n')) text += '\n';
  const at = src.indexOf(mode);
  if (at < 0) {
    console.error(`Marker "${mode}" not found in ${file}`);
    process.exit(1);
  }
  const lineStart = src.lastIndexOf('\n', at) + 1;
  fs.writeFileSync(file, src.slice(0, lineStart) + text + src.slice(lineStart), 'utf8');
  console.log(`Inserted ${text.length} chars before "${mode}" in ${file} (now ${fs.statSync(file).size} bytes)`);
});
