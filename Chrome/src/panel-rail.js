const PANEL_ACTIONS = [
  {
    label: "P Dashboard",
    path: "dashboard.html",
    icon: "space_dashboard",
    description: "Open the Bootstrap-first web dashboard."
  },
  {
    label: "Workspace",
    path: "workspace.html",
    icon: "web",
    description: "Open the current ProjectTrack workspace in a full tab."
  },
  {
    label: "Refresh",
    action: "reload",
    icon: "refresh",
    description: "Refresh the side panel launcher."
  }
];

function renderLauncher() {
  const root = document.getElementById("app");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <main class="pt-panel-launcher-shell" aria-label="ProjectTrack side panel launcher">
      <section class="pt-panel-launcher-rail">
        <button type="button" class="pt-panel-launcher-brand" data-open-path="dashboard.html" title="Open ProjectTrack Dashboard" aria-label="Open ProjectTrack Dashboard">
          <img src="assets/projecttrack-icon.svg" alt="" width="28" height="28">
        </button>
        <div class="pt-panel-launcher-stack">
          ${PANEL_ACTIONS.map((action) => `
            <button
              type="button"
              class="pt-panel-launcher-button"
              ${action.path ? `data-open-path="${action.path}"` : ""}
              ${action.action ? `data-action="${action.action}"` : ""}
              title="${action.description}"
              aria-label="${action.description}"
            >
              <span class="material-symbols-outlined pt-panel-launcher-icon" aria-hidden="true">${action.icon}</span>
              <span class="pt-panel-launcher-label">${action.label}</span>
            </button>
          `).join("")}
        </div>
      </section>
    </main>
  `;

  root.querySelectorAll("[data-open-path]").forEach((node) => {
    node.addEventListener("click", async () => {
      const path = node.dataset.openPath;
      if (!path) {
        return;
      }

      const url = typeof chrome !== "undefined" && chrome.runtime?.getURL
        ? chrome.runtime.getURL(path)
        : path;

      if (typeof chrome !== "undefined" && chrome.tabs?.create) {
        await chrome.tabs.create({ url });
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    });
  });

  root.querySelector("[data-action='reload']")?.addEventListener("click", () => {
    window.location.reload();
  });
}

renderLauncher();
