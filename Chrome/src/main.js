import { mountProjectTrackApp } from "./projecttrack-app.js";

const PROJECTTRACK_MIN_VIEWPORT = 360;
const PROJECTTRACK_OPTIMAL_VIEWPORT = 550;

function syncProjectTrackViewport(contentNode) {
  const viewportWidth = Math.max(contentNode.clientWidth || PROJECTTRACK_MIN_VIEWPORT, PROJECTTRACK_MIN_VIEWPORT);
  const scale = viewportWidth < PROJECTTRACK_OPTIMAL_VIEWPORT
    ? viewportWidth / PROJECTTRACK_OPTIMAL_VIEWPORT
    : 1;

  contentNode.style.setProperty("--projecttrack-min-viewport", `${PROJECTTRACK_MIN_VIEWPORT}px`);
  contentNode.style.setProperty("--projecttrack-optimal-viewport", `${PROJECTTRACK_OPTIMAL_VIEWPORT}px`);
  contentNode.style.setProperty("--projecttrack-viewport-width", `${viewportWidth}px`);
  contentNode.style.setProperty("--projecttrack-viewport-scale", scale.toFixed(4));
  contentNode.dataset.viewportMode = scale < 1 ? "scaled" : "fluid";
}

async function mountProjectTrackExtension(rootNode) {
  const host = document.createElement("div");
  host.className = "projecttrack-root";

  const content = document.createElement("section");
  content.className = "projecttrack-root__viewport";

  host.appendChild(content);
  rootNode.replaceChildren(host);

  syncProjectTrackViewport(content);

  if (typeof ResizeObserver === "function") {
    const resizeObserver = new ResizeObserver(() => syncProjectTrackViewport(content));
    resizeObserver.observe(content);
  } else {
    window.addEventListener("resize", () => syncProjectTrackViewport(content));
  }

  try {
    await mountProjectTrackApp(content);
  } catch (error) {
    console.error("[ProjectTrack] Could not mount the extension.", error);
    content.innerHTML = `
      <div class="pt-view">
        <article class="pt-screen-card d-grid gap-cus-10 min-w-0">
          <span class="pt-eyebrow" style="color: var(--pt-color-danger-solid);">Startup Error</span>
          <h2 style="margin: 0;">ProjectTrack could not start.</h2>
          <p style="margin: 0;">Review the extension console for more details.</p>
        </article>
      </div>
    `;
  }
}

const root = document.getElementById("app");

if (root) {
  mountProjectTrackExtension(root);
}

