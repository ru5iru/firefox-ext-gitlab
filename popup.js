const output = document.getElementById("output");
const refreshBtn = document.getElementById("refreshBtn");

function render(responses) {
  if (!responses || Object.keys(responses).length === 0) {
    output.textContent = "No data yet.";
    return;
  }

  output.innerHTML = Object.entries(responses)
    .map(([mrId, endpoints]) => {
      let html = `<h3>Merge Request #${mrId}</h3>`;

      // ✅ Show commit messages from cached_widget.json
      if (endpoints.cached_widget && endpoints.cached_widget.commits_without_merge_commits) {
        const commits = endpoints.cached_widget.commits_without_merge_commits;
        if (commits.length > 0) {
          html += "<h4>Commits:</h4><ul>";
          html += commits
            .map(c => `<li>${c.title}</li>`)
            .join("");
          html += "</ul>";
        }
      }

      // Optionally: show changed files from diffs_metadata
      if (endpoints.diffs_metadata && endpoints.diffs_metadata.diff_files) {
        const files = endpoints.diffs_metadata.diff_files;
        if (files.length > 0) {
          html += "<h4>Changed Files:</h4><ul>";
          html += files
            .map(f => `<li>${f.new_path} (+${f.added_lines} / -${f.removed_lines})</li>`)
            .join("");
          html += "</ul>";
        }
      }

      // 🔍 Keep raw JSON collapsible for debugging
      const endpointHtml = Object.entries(endpoints)
        .map(([type, data]) =>
          `<details><summary>${type} (raw JSON)</summary><pre>${escapeHtml(
            JSON.stringify(data, null, 2)
          )}</pre></details>`
        )
        .join("");

      return html + endpointHtml;
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
