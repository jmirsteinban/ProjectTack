import { mountProjectTrackApp } from "./projecttrack-app.js";

const VALID_INITIAL_VIEWS = [
  "dashboard",
  "projects",
  "project-detail",
  "project-editor",
  "changes",
  "change-detail",
  "change-history",
  "change-editor",
  "profile",
  "login"
];

async function mountProjectTrackExtension(rootNode) {
  const searchParams = new URLSearchParams(window.location.search);
  const requestedView = searchParams.get("view");
  const initialView = VALID_INITIAL_VIEWS.includes(requestedView)
    ? requestedView
    : "dashboard";

  const host = document.createElement("div");
  host.className = "pt-web-app pt-workspace-app";

  const content = document.createElement("section");
  content.className = "pt-workspace-mount";

  host.appendChild(content);
  rootNode.replaceChildren(host);

  try {
    await mountProjectTrackApp(content, {
      initialView,
      initialSelectedProjectId: searchParams.get("projectId"),
      initialSelectedChangeId: searchParams.get("changeId"),
      initialProjectEditorMode: searchParams.get("mode"),
      initialChangeEditorMode: searchParams.get("mode")
    });
  } catch (error) {
    console.error("[ProjectTrack] Could not mount the extension.", error);
    content.innerHTML = `
      <main class="container-fluid px-4 px-xl-5 py-5">
        <section class="alert alert-danger border border-danger-subtle bg-danger-subtle text-danger-emphasis">
          <h1 class="h4 mb-2">ProjectTrack could not start.</h1>
          <p class="mb-0">Review the extension console for more details.</p>
        </section>
      </main>
    `;
  }
}

const root = document.getElementById("app");

if (root) {
  mountProjectTrackExtension(root);
}

