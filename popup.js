const output = document.getElementById("output");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");

let latestResponse = null; // keep reference

// Render latest MR
function render(response) {
  output.innerHTML = ""; // clear old data
  latestResponse = response; // save reference for copy

  if (!response || Object.keys(response).length === 0) {
    output.textContent = "No data yet.";
    return;
  }

  const [mrId, endpoints] = Object.entries(response).pop();
  const mrName = endpoints.cached_widget?.title || "Unnamed MR";

  let html = `<h3>#${mrId} ${mrName}</h3>`;

  const commits = endpoints.cached_widget?.commits_without_merge_commits || [];
  if (commits.length) {
    html += "<h4>Commits:</h4><ul>";
    html += commits.map(c => `<li>${c.message}</li>`).join("");
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

// Copy as Markdown
copyBtn.addEventListener("click", () => {
  if (!latestResponse || Object.keys(latestResponse).length === 0) {
    alert("No data to copy!");
    return;
  }

  const [mrId, endpoints] = Object.entries(latestResponse).pop();
  const mrName = endpoints.cached_widget?.title || "Unnamed MR";

  let markdown = `**#${mrId} ${mrName}**\n\n`;

  const files = endpoints.diffs_metadata?.diff_files || [];
  if (files.length) {
    markdown += `**Files:**\n\n`;
    markdown += files.map(f => `- \`${f.new_path}\``).join("\n") + "\n\n";
  }

  const commits = endpoints.cached_widget?.commits_without_merge_commits || [];
  if (commits.length) {
    markdown += `**Commits:**\n\n`;
    markdown += commits.map(c => `- ${c.message}`);
  }

  navigator.clipboard.writeText(markdown).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 2000);
  });
});

// Clear button
clearBtn.addEventListener("click", async () => {
  try {
    await browser.runtime.sendMessage({ type: "clearResponses" });
    latestResponse = null;
    output.textContent = "No data yet.";
  } catch (e) {
    console.error("Failed to clear data:", e);
  }
});

// Auto-refresh when background updates
browser.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "responsesUpdated") {
    (async () => {
      const res = await browser.runtime.sendMessage({ type: "getResponses" });
      render(res);
    })();
  }
});

// Initial load
(async () => {
  const res = await browser.runtime.sendMessage({ type: "getResponses" });
  render(res);
})();
