document.addEventListener("DOMContentLoaded", async () => {
  const output = document.getElementById("output");

  const responses = await browser.runtime.sendMessage("getResponses");

  if (Object.keys(responses).length === 0) {
    output.textContent = "No data captured yet.";
  } else {
    output.innerHTML = Object.entries(responses)
      .map(([mrId, endpoints]) => {
        const endpointHtml = Object.entries(endpoints)
          .map(([type, data]) => `<h5>${type}</h5><pre>${JSON.stringify(data, null, 2)}</pre>`)
          .join("");
        return `<h3>Merge Request #${mrId}</h3>${endpointHtml}`;
      })
      .join("");
  }
});