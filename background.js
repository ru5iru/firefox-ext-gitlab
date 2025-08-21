const endpointsRegex = /\/merge_requests\/(\d+)\/(diffs_metadata|cached_widget)\.json/;

// In-memory store
let responses = {};

// Intercept and copy response bodies
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = new URL(details.url);
    const match = url.pathname.match(endpointsRegex);
    if (!match) return;

    const mergeRequestId = match[1];
    const endpointType   = match[2];

    const filter = browser.webRequest.filterResponseData(details.requestId);
    const chunks = [];

    filter.ondata = (event) => {
      chunks.push(event.data);
      filter.write(event.data); // pass-through to the page
    };

    filter.onstop = () => {
      try {
        const totalLen = chunks.reduce((n, a) => n + a.byteLength, 0);
        const buf = new Uint8Array(totalLen);
        let off = 0;
        for (const c of chunks) {
          buf.set(new Uint8Array(c), off);
          off += c.byteLength;
        }
        const text = new TextDecoder("utf-8").decode(buf);

        const json = JSON.parse(text);
        if (!responses[mergeRequestId]) responses[mergeRequestId] = {};
        responses[mergeRequestId][endpointType] = json;

        console.log(`Captured MR#${mergeRequestId} - ${endpointType}`, json);

        // Notify any open popup to refresh
        browser.runtime.sendMessage({ type: "responsesUpdated" }).catch(() => {});
      } catch (e) {
        console.error("Failed to parse intercepted JSON:", e);
      } finally {
        filter.disconnect();
      }
    };
  },
  { urls: ["https://gitlabcloud.dialog.lk/*"] },
  ["blocking"]
);

// Promise-based responder (Firefox 'browser.*' style)
browser.runtime.onMessage.addListener((message, sender) => {
  if (message && message.type === "getResponses") {
    return Promise.resolve(responses);
  }
});
