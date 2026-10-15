// Documentation-only characterization of unchanged repository source.
// Browser, DOM and clipboard stand-ins do not prove Firefox compatibility.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setImmediate(resolve));

function background() {
  let onRequest, onMessage;
  const notifications = [], logs = [], filters = new Map();
  const context = vm.createContext({
    URL, Uint8Array, TextDecoder,
    console: Object.fromEntries(['log', 'warn', 'error'].map(level => [level, (...args) => logs.push([level, ...args])])),
    browser: {
      webRequest: {
        onBeforeRequest: { addListener(fn, filter, options) { onRequest = fn; this.filter = filter; this.options = options; } },
        filterResponseData(id) {
          const filter = { writes: [], disconnected: false, write(data) { this.writes.push(Buffer.from(data)); }, disconnect() { this.disconnected = true; } };
          filters.set(id, filter);
          return filter;
        }
      },
      runtime: {
        onMessage: { addListener(fn) { onMessage = fn; } },
        sendMessage(message) { notifications.push(clone(message)); return Promise.resolve(); }
      }
    }
  });
  vm.runInContext(read('background.js'), context, { filename: 'background.js' });
  function message(type) {
    let result;
    assert.equal(onMessage({ type }, {}, value => { result = clone(value); }), true);
    return result;
  }
  let requestNumber = 0;
  function begin(url) {
    const id = String(++requestNumber);
    onRequest({ requestId: id, url });
    return filters.get(id);
  }
  function capture(url, value) {
    const filter = begin(url);
    const bytes = Buffer.from(JSON.stringify(value));
    // Deliberately split bytes, including possibly a multibyte character.
    for (const part of [bytes.subarray(0, 7), bytes.subarray(7)]) {
      filter.ondata({ data: part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) });
    }
    filter.onstop();
    return filter;
  }
  return { message, begin, capture, notifications, logs, context };
}

// Synthetic origin only: this harness calls the registered callback directly;
// Firefox's manifest and webRequest host filtering are not simulated.
const url = (id, endpoint = 'cached_widget', project = 'example') =>
  `https://gitlab.example.com/${project}/-/merge_requests/${id}/${endpoint}.json`;
const fixture = {
  cached_widget: { title: 'Example <change>', commits_without_merge_commits: [{ message: 'Example & commit' }] },
  diffs_metadata: { diff_files: [{ new_path: 'example.js', added_lines: 3, removed_lines: 1 }] }
};

async function popup(bg, options = {}) {
  const listeners = {}, timers = [], clipboard = [], logs = [];
  const elements = Object.fromEntries(['output', 'clearBtn', 'copyBtn'].map(id => [id, {
    textContent: id === 'copyBtn' ? 'Copy' : 'Clear', className: 'btn', innerHTML: '',
    addEventListener(type, fn) { listeners[`${id}:${type}`] = fn; }
  }]));
  let onMessage;
  const context = vm.createContext({
    console: Object.fromEntries(['log', 'warn', 'error'].map(level => [level, (...args) => logs.push([level, ...args])])),
    setTimeout(fn, ms) { timers.push({ fn, ms }); },
    document: {
      getElementById(id) { return elements[id]; },
      createElement() {
        // Only textContent -> innerHTML escaping is modeled, not a DOM parser.
        return { textContent: '', get innerHTML() { return String(this.textContent).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); } };
      }
    },
    navigator: { clipboard: { async writeText(value) { if (options.clipboardError) throw Error('denied'); clipboard.push(value); } } },
    browser: { runtime: {
      onMessage: { addListener(fn) { onMessage = fn; } },
      async sendMessage(message) {
        if (options.messageError) throw Error('disconnected');
        return bg.message(message.type);
      }
    } }
  });
  vm.runInContext(read('popup.js'), context, { filename: 'popup.js' });
  await tick();
  return { elements, timers, clipboard, logs, context,
    click: id => listeners[`${id}:click`](),
    async update() { onMessage({ type: 'responsesUpdated' }); await tick(); }
  };
}

test('initial store is null; nonmatching path creates no filter; unknown message returns error', () => {
  const bg = background();
  assert.equal(bg.message('getResponses'), null);
  assert.equal(bg.begin('https://gitlab.example.com/example'), undefined);
  assert.deepEqual(bg.message('other'), { error: 'Unknown message type' });
});

test('capture forwards exact bytes, merges endpoints and notifies after each valid response', () => {
  const bg = background();
  const data = { title: 'Example 🦊', commits_without_merge_commits: [] };
  const filter = bg.capture(url(42), data);
  assert.equal(Buffer.concat(filter.writes).toString(), JSON.stringify(data));
  assert.equal(filter.disconnected, true);
  bg.capture(url(42, 'diffs_metadata'), fixture.diffs_metadata);
  assert.deepEqual(bg.message('getResponses'), { 42: { cached_widget: data, diffs_metadata: fixture.diffs_metadata } });
  assert.deepEqual(bg.notifications, [{ type: 'responsesUpdated' }, { type: 'responsesUpdated' }]);
});

test('invalid JSON and filter error disconnect without changing previous data', () => {
  const bg = background();
  bg.capture(url(42), fixture.cached_widget);
  const previous = bg.message('getResponses');
  const filter = bg.begin(url(42));
  filter.ondata({ data: Uint8Array.from([123]).buffer });
  filter.onstop();
  assert.equal(filter.disconnected, true);
  assert.deepEqual(bg.message('getResponses'), previous);
  const failed = bg.begin(url(42));
  failed.onerror();
  assert.equal(failed.disconnected, true);
  assert.deepEqual(bg.message('getResponses'), previous);
});

test('endpoint matching permits suffixes and scalar JSON because no schema check exists', () => {
  const bg = background();
  bg.capture(url(42) + '/extra?view=example', null);
  assert.deepEqual(bg.message('getResponses'), { 42: { cached_widget: null } });
});

test('same MR number across two projects collides in one bucket', () => {
  const bg = background();
  bg.capture(url(42, 'cached_widget', 'project-a'), fixture.cached_widget);
  bg.capture(url(42, 'diffs_metadata', 'project-b'), fixture.diffs_metadata);
  assert.deepEqual(bg.message('getResponses'), { 42: fixture });
});

test('capture to popup to clipboard; text fields escape HTML; copy uses actual newlines', async () => {
  const bg = background();
  const ui = await popup(bg);
  assert.match(ui.elements.output.innerHTML, /No merge request data captured yet/);
  bg.capture(url(42), fixture.cached_widget);
  bg.capture(url(42, 'diffs_metadata'), fixture.diffs_metadata);
  await ui.update();
  assert.match(ui.elements.output.innerHTML, /Example &lt;change&gt;/);
  assert.match(ui.elements.output.innerHTML, /Example &amp; commit/);
  assert.match(ui.elements.output.innerHTML, /Changed Files \(1\)/);
  await ui.click('copyBtn');
  assert.equal(ui.clipboard[0], '**#42 Example <change>**\n\n**Files (1):**\n\n- `example.js` (+3/-1)\n\n**Commits (1):**\n\n- Example & commit');
  assert.equal(ui.clipboard[0].includes('\\n'), false);
  assert.match(ui.elements.copyBtn.textContent, /Copied/);
});

test('popup selection follows highest ordinary numeric key, not most recent capture', async () => {
  const bg = background();
  bg.capture(url(100), { title: 'Captured first' });
  bg.capture(url(2), { title: 'Captured last' });
  const ui = await popup(bg);
  assert.match(ui.elements.output.innerHTML, /Captured first/);
  assert.doesNotMatch(ui.elements.output.innerHTML, /Captured last/);
  await ui.click('copyBtn');
  assert.match(ui.clipboard[0], /^\*\*#100/);
});

test('clear resets store and popup, then an in-flight response can repopulate them', async () => {
  const bg = background();
  bg.capture(url(42), fixture.cached_widget);
  const ui = await popup(bg);
  const pending = bg.begin(url(42));
  await ui.click('clearBtn');
  assert.equal(bg.message('getResponses'), null);
  assert.match(ui.elements.output.innerHTML, /No merge request data captured yet/);
  const bytes = Buffer.from(JSON.stringify(fixture.cached_widget));
  pending.ondata({ data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) });
  pending.onstop();
  await ui.update();
  assert.match(ui.elements.output.innerHTML, /Example &lt;change&gt;/);
});

test('raw line counts can introduce markup while path text is escaped', async () => {
  const bg = background();
  bg.capture(url(42, 'diffs_metadata'), { diff_files: [{ new_path: '<b>path</b>', added_lines: '<b>count</b>' }] });
  const ui = await popup(bg);
  assert.match(ui.elements.output.innerHTML, /&lt;b&gt;path&lt;\/b&gt;/);
  assert.match(ui.elements.output.innerHTML, /<b>count<\/b>/);
  assert.match(ui.elements.output.innerHTML, /Unnamed MR/);
});

test('missing data and clipboard failure show their implemented statuses', async () => {
  const bg = background();
  const empty = await popup(bg);
  await empty.click('copyBtn');
  assert.match(empty.elements.copyBtn.textContent, /No data/);
  assert.equal(empty.clipboard.length, 0);
  bg.capture(url(42), fixture.cached_widget);
  const denied = await popup(bg, { clipboardError: true });
  await denied.click('copyBtn');
  assert.match(denied.elements.copyBtn.textContent, /Failed/);
});

test('initial message failure shows load fallback and rejected clear shows Error', async () => {
  const ui = await popup(background(), { messageError: true });
  assert.match(ui.elements.output.innerHTML, /Failed to load data/);
  await ui.click('clearBtn');
  assert.match(ui.elements.clearBtn.textContent, /Error/);
});

test('malformed non-array payload fails render and copy before clipboard catch', async () => {
  const bg = background();
  bg.capture(url(42), { commits_without_merge_commits: 'wrong type' });
  const ui = await popup(bg);
  assert.match(ui.elements.output.innerHTML, /Failed to load data/);
  await assert.rejects(ui.click('copyBtn'), /map is not a function/);
  assert.equal(ui.clipboard.length, 0);
});

test('Clear treats a resolved error object as success because reply body is ignored', async () => {
  const fake = { message(type) { return type === 'clearResponses' ? { error: 'synthetic failure' } : { 42: fixture }; } };
  const ui = await popup(fake);
  await ui.click('clearBtn');
  assert.match(ui.elements.clearBtn.textContent, /Cleared/);
  assert.match(ui.elements.output.innerHTML, /No merge request data captured yet/);
});
