async function syncProjectTrackActionBehavior() {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  } catch {}

  try {
    await chrome.sidePanel.setOptions({ path: "sidepanel.html", enabled: true });
  } catch {}
}

chrome.runtime.onInstalled.addListener(() => {
  syncProjectTrackActionBehavior();
});

chrome.runtime.onStartup?.addListener(() => {
  syncProjectTrackActionBehavior();
});

syncProjectTrackActionBehavior();
