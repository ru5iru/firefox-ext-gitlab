const output = document.getElementById("output");
const refreshBtn = document.getElementById("refreshBtn");
const clearBtn = document.getElementById("clearBtn"); // Clear button

function render(response) {
  if (!response || Object.keys(response).length === 0) {
    output.textContent = "No data yet.";
    return;
  }

  // Only use the last MR
  const [mrId, endpoints] = Object.entries(response).pop();
  
  // Get MR name from cached_widget
  const mrName = endpoints.cached_widget?.title || "Unnamed MR";

  let html = `<h3>#${mrId} ${mrName}</h3>`;

  // Show commit messages
  if (endpoints.cached_widget && endpoints.cached_widget.commits_without_merge_commits) {
    const commits = endpoints.cached_widget.commits_without_merge_commits;
    if (commits.length > 0) {
      html += "<h4>Commits:</h4><ul>";
      html += commits.map(c => `<li>${c.title}</li>`).join("");
      html += "</ul>";
    }
  }

  // Show changed files
  if (endpoints.diffs_metadata && endpoints.diffs_metadata.diff_files) {
    const files = endpoints.diffs_metadata.diff_files;
    if (files.length > 0) {
      html += "<h4>Changed Files:</h4><ul>";
      html += files.map(f => `<li>${f.new_path} (+${f.added_lines} / -${f.removed_lines})</li>`).join("");
      html += "</ul>";
    }
  }

  output.innerHTML = html;
}

async function load() {
  try {
    const response = await browser.runtime.sendMessage({ type: "getResponses" });
    render(response);
  } catch (e) {
    output.textContent = "Failed to load data: " + e;
    console.error(e);
  }
}

// Refresh button
refreshBtn.addEventListener("click", load);

// Clear button
clearBtn.addEventListener("click", async () => {
  try {
    // Clear stored responses in background
    await browser.runtime.sendMessage({ type: "clearResponses" });
    output.textContent = "No data yet.";
  } catch (e) {
    console.error("Failed to clear data:", e);
  }
});

// Auto-refresh when background captures new data
browser.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "responsesUpdated") {
    load();
  }
});

// Initial load
load();
