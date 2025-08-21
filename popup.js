const output = document.getElementById("output");
const clearBtn = document.getElementById("clearBtn");

// Render latest MR
function render(response) {
  output.innerHTML = ""; // clear old data

  if (!response || Object.keys(response).length === 0) {
    output.textContent = "No data yet.";
    return;
  }

  // Only use the last MR in object
  const [mrId, endpoints] = Object.entries(response).pop();
  const mrName = endpoints.cached_widget?.title || "Unnamed MR";

  let html = `<h3>#${mrId} ${mrName}</h3>`;

  const commits = endpoints.cached_widget?.commits_without_merge_commits || [];
  if (commits.length) {
    html += "<h4>Commits:</h4><ul>";
    html += commits.map(c => `<li>${c.title}</li>`).join("");
    html += "</ul>";
  }

  const files = endpoints.diffs_metadata?.diff_files || [];
  if (files.length) {
    html += "<h4>Files:</h4><ul>";
    html += files.map(f => `<li>${f.new_path} (+${f.added_lines} / -${f.removed_lines})</li>`).join("");
    html += "</ul>";
  }

  output.innerHTML = html;
}

// Clear button
clearBtn.addEventListener("click", async () => {
  try {
    await browser.runtime.sendMessage({ type: "clearResponses" });
    output.textContent = "No data yet.";
  } catch (e) {
    console.error("Failed to clear data:", e);
  }
});

// Auto-refresh when background updates
browser.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "responsesUpdated") render(latestResponse);
});

// Initial load
(async () => {
  const res = await browser.runtime.sendMessage({ type: "getResponses" });
  render(res);
})();
