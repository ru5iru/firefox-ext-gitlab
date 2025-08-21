const output = document.getElementById("output");
const refreshBtn = document.getElementById("refreshBtn");

function render(responses) {
  if (!responses || Object.keys(responses).length === 0) {
    output.textContent = "No data yet.";
    return;
  }
  output.innerHTML = Object.entries(responses)
    .map(([mrId, endpoints]) => {
      const endpointHtml = Object.entries(endpoints)
        .map(([type, data]) =>
          `<h5>${type}</h5><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`
        )
        .join("");
      return `<h3>Merge Request #${mrId}</h3>${endpointHtml}`;
    })
    .join("");
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function load() {
  try {
    const responses = await browser.runtime.sendMessage({ type: "getResponses" });
    render(responses);
  } catch (e) {
    output.textContent = "Failed to load data: " + e;
    console.error(e);
  }
}

refreshBtn.addEventListener("click", load);

// Auto-refresh when background captures new data
browser.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "responsesUpdated") {
    load();
  }
});

// Initial load
load();
