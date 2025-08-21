const output = document.getElementById("output");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");

let latestResponse = null; // keep reference

// Render latest MR with improved UI
function render(response) {
  latestResponse = response; // save reference for copy

  if (!response || Object.keys(response).length === 0) {
    output.innerHTML = `
      <div class="empty-state">
        <div class="icon">📡</div>
        <div>No merge request data captured yet.</div>
        <div class="help-text">
          Navigate to a GitLab MR page to start capturing data.
        </div>
      </div>
    `;
    return;
  }

  const [mrId, endpoints] = Object.entries(response).pop();
  const mrName = endpoints.cached_widget?.title || "Unnamed MR";

  let html = `
    <div class="mr-card">
      <div class="mr-header">
        <div class="mr-title">${escapeHtml(mrName)}</div>
        <div class="mr-id">
          <span class="status-indicator"></span>
          Merge Request #${mrId}
        </div>
      </div>
  `;

  const commits = endpoints.cached_widget?.commits_without_merge_commits || [];
  if (commits.length) {
    html += `
      <div class="section">
        <div class="section-title">Commits (${commits.length})</div>
        <ul class="commit-list">
    `;
    html += commits.map(c => `
      <li class="commit-item">${escapeHtml(c.message || 'No commit message')}</li>
    `).join("");
    html += `
        </ul>
      </div>
    `;
  }

  const files = endpoints.diffs_metadata?.diff_files || [];
  if (files.length) {
    html += `
      <div class="section">
        <div class="section-title">Changed Files (${files.length})</div>
        <ul class="file-list">
    `;
    html += files.map(f => `
      <li class="file-item">
        <span class="file-path">${escapeHtml(f.new_path)}</span>
        <div class="file-stats">
          <span class="stat-add">+${f.added_lines || 0}</span>
          <span class="stat-remove">-${f.removed_lines || 0}</span>
        </div>
      </li>
    `).join("");
    html += `
        </ul>
      </div>
    `;
  }

  html += `</div>`;
  output.innerHTML = html;
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Copy as Markdown with enhanced feedback
copyBtn.addEventListener("click", async () => {
  if (!latestResponse || Object.keys(latestResponse).length === 0) {
    showButtonStatus(copyBtn, "❌ No data", "btn", 2000);
    return;
  }

  const [mrId, endpoints] = Object.entries(latestResponse).pop();
  const mrName = endpoints.cached_widget?.title || "Unnamed MR";

  let markdown = `**#${mrId} ${mrName}**\n\n`;

  const files = endpoints.diffs_metadata?.diff_files || [];
  if (files.length) {
    markdown += `**Files (${files.length}):**\n\n`;
    markdown += files.map(f => `- \`${f.new_path}\` (+${f.added_lines || 0}/-${f.removed_lines || 0})`).join("\n") + "\n\n";
  }

  const commits = endpoints.cached_widget?.commits_without_merge_commits || [];
  if (commits.length) {
    markdown += `**Commits (${commits.length}):**\n\n`;
    markdown += commits.map(c => `- ${c.message || 'No commit message'}`).join("\n");
  }

  try {
    await navigator.clipboard.writeText(markdown);
    showButtonStatus(copyBtn, "✅ Copied!", "btn success", 2000);
  } catch (err) {
    console.error("Copy failed:", err);
    showButtonStatus(copyBtn, "❌ Failed", "btn", 2000);
  }
});

// Clear button with confirmation
clearBtn.addEventListener("click", async () => {
  try {
    await browser.runtime.sendMessage({ type: "clearResponses" });
    latestResponse = null;
    render(null);
    
    showButtonStatus(clearBtn, "✅ Cleared", "btn", 1500);
  } catch (e) {
    console.error("Failed to clear data:", e);
    showButtonStatus(clearBtn, "❌ Error", "btn", 2000);
  }
});

// Utility function for button status feedback
function showButtonStatus(button, text, className, duration) {
  const originalText = button.textContent;
  const originalClass = button.className;
  
  button.textContent = text;
  button.className = className;
  
  setTimeout(() => {
    button.textContent = originalText;
    button.className = originalClass;
  }, duration);
}

// Auto-refresh when background updates
browser.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "responsesUpdated") {
    (async () => {
      try {
        const res = await browser.runtime.sendMessage({ type: "getResponses" });
        render(res);
      } catch (e) {
        console.error("Failed to get responses:", e);
      }
    })();
  }
});

// Initial load
(async () => {
  try {
    const res = await browser.runtime.sendMessage({ type: "getResponses" });
    render(res);
  } catch (e) {
    console.error("Failed to load initial data:", e);
    output.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <div>Failed to load data</div>
        <div class="help-text">Please try refreshing the extension</div>
      </div>
    `;
  }
})();