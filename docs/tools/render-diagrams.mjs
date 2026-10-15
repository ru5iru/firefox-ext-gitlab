// Optional documentation renderer. Dependencies live only in docs/.validation.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = path.join(docs, '.validation');
const dependencyRequire = createRequire(path.join(work, 'package.json'));
const { run } = await import(pathToFileURL(dependencyRequire.resolve('@mermaid-js/mermaid-cli')));
const { default: puppeteer } = await import(pathToFileURL(dependencyRequire.resolve('puppeteer')));
const browserPath = process.env.DOCS_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
await fs.mkdir(path.join(work, 'diagrams'), { recursive: true });
await fs.mkdir(path.join(docs, 'diagrams'), { recursive: true });
const browser = await puppeteer.launch({
  executablePath: browserPath,
  headless: true,
  userDataDir: path.join(work, 'chrome-profile'),
  args: ['--no-first-run', '--disable-background-networking', '--disable-extensions']
});
try {
  console.log(`Renderer browser: ${await browser.version()}`);
  let count = 0;
  for (const file of (await fs.readdir(docs)).filter(name => name.endsWith('.md')).sort()) {
    const text = await fs.readFile(path.join(docs, file), 'utf8');
    let index = 0;
    for (const match of text.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)) {
      const stem = `${file.replace('.md', '')}-${++index}`;
      const input = path.join(work, 'diagrams', stem + '.mmd');
      const output = path.join(docs, 'diagrams', stem + '.svg');
      await fs.writeFile(input, match[1].trim() + '\n');
      await run(input, output, { browser, quiet: true });
      const svg = await fs.readFile(output, 'utf8');
      if (!svg.includes('<svg') || svg.includes('Syntax error in text')) throw Error(`Invalid render: ${stem}`);
      console.log(`Rendered ${stem}.svg`);
      count++;
    }
  }
  console.log(`Successfully parsed and rendered ${count} Mermaid diagrams.`);
} finally {
  await browser.close();
}
