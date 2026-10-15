// Dependency-free documentation checks. Mermaid parsing/rendering is separate.
const fs = require('node:fs');
const path = require('node:path');
const docs = path.resolve(__dirname, '..');
const root = path.resolve(docs, '..');
const files = fs.readdirSync(docs).filter(name => name.endsWith('.md'));
const documentFiles = [...files, '../README.md'];
const errors = [], diagrams = [];
let links = 0;
for (const name of documentFiles) {
  const text = fs.readFileSync(path.join(docs, name), 'utf8');
  for (const field of ['Purpose:', 'Intended reader:', 'Last verified against commit', 'Next:']) {
    if (!text.includes(field)) errors.push(`${name}: missing ${field}`);
  }
  if (!text.trimEnd().split(/\r?\n/).at(-1).startsWith('Next:')) errors.push(`${name}: final line must be Next link`);
  if (!text.includes('9b02e7db044bfa763c69c7b956fa379ee3ddd2d0')) errors.push(`${name}: baseline missing`);
  if (!/\*\*\[(Verified|Inferred|Unknown)\]\*\*/.test(text)) errors.push(`${name}: evidence labels missing`);
  for (const match of text.matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    links++;
    const [file, anchor] = target.split('#');
    const absolute = path.resolve(path.dirname(path.resolve(docs, name)), decodeURIComponent(file));
    if (!absolute.startsWith(root + path.sep)) { errors.push(`${name}: link outside repo ${target}`); continue; }
    if (!fs.existsSync(absolute)) { errors.push(`${name}: missing ${target}`); continue; }
    if (anchor && /^L\d+$/.test(anchor)) {
      const lines = fs.readFileSync(absolute, 'utf8').split(/\r?\n/).length;
      if (Number(anchor.slice(1)) > lines) errors.push(`${name}: out-of-range ${target}`);
    }
  }
  let number = 0;
  for (const match of text.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)) {
    const after = text.slice(match.index + match[0].length).trimStart().split(/\r?\n/)[0];
    if (!/Caption:/.test(after) || !/How to read this:/.test(after)) errors.push(`${name}: diagram missing caption/read note`);
    diagrams.push({ file: name, number: ++number, source: match[1].trim() });
  }
}
const index = fs.readFileSync(path.join(docs, 'README.md'), 'utf8');
for (const name of files.filter(name => name !== 'README.md')) {
  if (!index.includes(`](${name})`)) errors.push(`README.md: missing index link to ${name}`);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const configuredHost = new URL(manifest.permissions.find(permission => permission.startsWith('https://'))).hostname;
function checkPrivateHost(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.validation', 'node_modules'].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) checkPrivateHost(file);
    else if (fs.readFileSync(file, 'utf8').includes(configuredHost)) errors.push(`Private configured hostname appears in ${path.relative(root, file)}`);
  }
}
checkPrivateHost(docs);
if (fs.readFileSync(path.join(root, 'README.md'), 'utf8').includes(configuredHost)) errors.push('Private configured hostname appears in root README.md');
const missingAssets = Object.values(manifest.browser_action.default_icon).filter(file => !fs.existsSync(path.join(root, file)));
console.log(`Checked ${documentFiles.length} Markdown files, ${links} local links and line bounds, ${diagrams.length} Mermaid blocks, and documentation hostname redaction.`);
console.log(`Known source gaps: ${missingAssets.length} missing manifest icon assets. No source fixes applied.`);
if (process.argv.includes('--extract')) {
  // Optional ephemeral renderer input, kept inside docs as required.
  const destination = path.join(docs, '.validation', 'diagrams');
  fs.mkdirSync(destination, { recursive: true });
  for (const item of diagrams) {
    fs.writeFileSync(path.join(destination, `${item.file.replace('.md', '')}-${item.number}.mmd`), item.source + '\n');
  }
  console.log(`Extracted ${diagrams.length} diagrams beneath docs/.validation/diagrams.`);
}
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log('Documentation structure and local-link checks passed. Mermaid syntax is not checked by this script.');
}
