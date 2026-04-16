function renderPopup() {
  const root = document.getElementById("app");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <main class="pt-popup-shell" aria-label="ProjectTrack action menu">
      <section class="pt-popup-card">
        <div class="pt-popup-header">
          <img src="assets/projecttrack-icon.svg" alt="" width="28" height="28">
          <strong>ProjectTrack</strong>
        </div>

        <div class="pt-popup-actions">
          <button type="button" class="pt-popup-action" data-action="open-dashboard">
            <span class="pt-popup-action-label">ProjectTrack</span>
          </button>
          <button type="button" class="pt-popup-action" data-action="open-sidepanel">
            <span class="pt-popup-action-label">SidePanel</span>
          </button>
        </div>
      </section>
    </main>
  `;

  root.querySelector("[data-action='open-dashboard']")?.addEventListener("click", async () => {
    const url = chrome.runtime.getURL("dashboard.html");
    const existingTabs = await chrome.tabs.query({});
    const existingTab = existingTabs.find((tab) => tab.url === url);

    if (existingTab?.id != null) {
      if (existingTab.windowId != null) {
        await chrome.windows.update(existingTab.windowId, { focused: true });
      }
      await chrome.tabs.update(existingTab.id, { active: true });
      window.close();
      return;
    }

    await chrome.tabs.create({ url });
    window.close();
  });

  root.querySelector("[data-action='open-sidepanel']")?.addEventListener("click", async () => {
    const currentWindow = await chrome.windows.getCurrent();
    if (currentWindow?.id != null) {
      await chrome.sidePanel.open({ windowId: currentWindow.id });
    }
    window.close();
  });
}

renderPopup();
