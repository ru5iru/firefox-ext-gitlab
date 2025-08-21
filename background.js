const endpointsRegex = /\/merge_requests\/(\d+)\/(diffs_metadata|cached_widget)\.json/;

// Store only latest MR
let latestResponse = null;

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
      filter.write(event.data); // pass-through
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

        // Initialize structure if needed
        if (!latestResponse) latestResponse = {};
        if (!latestResponse[mergeRequestId]) latestResponse[mergeRequestId] = {};
        
        // Store the captured data
        latestResponse[mergeRequestId][endpointType] = json;

        console.log(`✅ Captured MR#${mergeRequestId} - ${endpointType}:`, {
          endpoint: endpointType,
          dataSize: text.length,
          timestamp: new Date().toISOString()
        });

        // Notify popup with error handling
        browser.runtime.sendMessage({ type: "responsesUpdated" })
          .catch((error) => {
            console.warn("Failed to notify popup (popup likely closed):", error.message);
          });
          
      } catch (e) {
        console.error("❌ Failed to parse intercepted JSON for MR#" + mergeRequestId + ":", e);
      } finally {
        filter.disconnect();
      }
    };

    filter.onerror = () => {
      console.error("❌ Filter error for MR#" + mergeRequestId);
      filter.disconnect();
    };
  },
  { urls: ["https://gitlabcloud.dialog.lk/*"] },
  ["blocking"]
);

// Message responder with better error handling
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  try {
    if (msg.type === "getResponses") {
      sendResponse(latestResponse);
      return true; // Keep message channel open for async response
    }

    if (msg.type === "clearResponses") {
      latestResponse = null; // clear all data
      console.log("🗑️ Cleared all captured MR data");
      sendResponse({ success: true });
      return true;
    }

    // Unknown message type
    console.warn("⚠️ Unknown message type:", msg.type);
    sendResponse({ error: "Unknown message type" });
    
  } catch (error) {
    console.error("❌ Error handling message:", error);
    sendResponse({ error: error.message });
  }
  
  return true; // Keep message channel open
});

// Log extension startup
console.log("🚀 GitLab Network Catcher v2.0 - Background script loaded");