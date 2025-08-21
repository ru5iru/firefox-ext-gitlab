const endpointsRegex = /\/merge_requests\/(\d+)\/(diffs_metadata|cached_widget)\.json/;

// Store captured data
let responses = {};

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = new URL(details.url);
    const match = url.pathname.match(endpointsRegex);

    if (match) {
      const mergeRequestId = match[1];
      const endpointType = match[2];

      const filter = browser.webRequest.filterResponseData(details.requestId);
      let dataChunks = [];

      filter.ondata = (event) => {
        dataChunks.push(event.data);
        filter.write(event.data);
      };

      filter.onstop = () => {
        const concatenated = new Uint8Array(dataChunks.reduce((acc, val) => acc + val.byteLength, 0));
        let offset = 0;
        for (const chunk of dataChunks) {
          concatenated.set(new Uint8Array(chunk), offset);
          offset += chunk.byteLength;
        }

        const text = new TextDecoder("utf-8").decode(concatenated);
        try {
          const jsonData = JSON.parse(text);

          if (!responses[mergeRequestId]) responses[mergeRequestId] = {};
          responses[mergeRequestId][endpointType] = jsonData;

          console.log(`Captured MR#${mergeRequestId} - ${endpointType}`, jsonData);
        } catch (e) {
          console.error("Failed to parse JSON", e);
        }
        filter.disconnect();
      };
    }
  },
  { urls: ["https://gitlabcloud.dialog.lk/*"] },
  ["blocking"]
);

// Provide responses to popup
browser.runtime.onMessage.addListener((message) => {
  if (message === "getResponses") {
    return Promise.resolve(responses);
  }
});
