import {
  isCompletedStatus,
  priorityClass,
  statusClass,
  translatePriority,
  translateStatus
} from "../services/ui-copy.js";
import { getVisibleChangesForProject, getVisibleProjects } from "../services/workspace-selectors.js";
import { escapeAttribute, escapeHtml, isHttpUrl } from "../services/html.js";
import { renderHeroCard } from "../components/hero-card.js";

function environmentCardSurfaceClasses(environment) {
  const classes = [
    "card",
    "bg-body-tertiary",
    "h-100",
    "position-relative",
    "overflow-visible",
  ];
  if (environment === "QA") {
    classes.push("rounded-2", "shadow-none");
  } else {
    classes.push("rounded-3", "shadow-sm");
  }
  return classes.join(" ");
}

function encodeCopyValue(value) {
  return encodeURIComponent(value ?? "");
}

function isOpenableLink(value) {
  return isHttpUrl(value);
}

function renderLinkValue(value) {
  if (!value) {
    return `
      <span class="d-flex min-w-0">
        <span class="text-secondary">Not defined</span>
      </span>
    `;
  }

  const valueMarkup = isOpenableLink(value)
    ? `<a class="link-primary text-break min-w-0" href="${escapeAttribute(value)}" target="_blank" rel="noopener noreferrer" title="${escapeAttribute(value)}">${escapeHtml(value)}</a>`
    : `<span class="text-break min-w-0" title="${escapeAttribute(value)}">${escapeHtml(value)}</span>`;

  return `
    <span class="d-flex align-items-start gap-2 flex-wrap min-w-0">
      ${valueMarkup}
      <button type="button" class="btn btn-outline-secondary btn-sm" data-action="copy-link-value" data-copy-value="${escapeAttribute(encodeCopyValue(value))}" aria-label="Copy link" title="Copy link">Copy</button>
    </span>
  `;
}

function buildEnvironmentRows(urls) {
  const entries = Object.entries(urls ?? {});
  if (entries.length === 0) {
    return `<div class="alert alert-info mb-0">No URLs configured</div>`;
  }

  return `
    <div class="list-group list-group-flush">
      ${entries.map(([label, value]) => `
        <div class="list-group-item px-0">
          <div class="d-grid gap-1">
            <span class="small fw-semibold text-secondary">${escapeHtml(label)}</span>
            ${renderLinkValue(value)}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function projectStatusLabel(changes) {
  if (!changes.length) return "No Changes";
  if (changes.some((change) => !isCompletedStatus(change.status))) return "Active";
  return "Completed";
}

export function renderProjectDetailScreen(state, data) {
  const visibleProjects = getVisibleProjects(data);
  const project = visibleProjects.find((item) => item.id === state.selectedProjectId);
  if (!project) {
    return `<section class="card bg-body-tertiary"><div class="card-body"><strong>Project unavailable</strong><p class="mb-0">This project is no longer available or was logically deleted.</p></div></section>`;
  }
  const relatedChanges = getVisibleChangesForProject(data, project.name);
  const status = projectStatusLabel(relatedChanges);
  const recentChanges = relatedChanges.map((change) => `
    <article class="list-group-item list-group-item-action py-3 pt-clickable-card" data-change-id="${escapeAttribute(change.id)}" role="button" tabindex="0">
      <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <strong class="min-w-0">${escapeHtml(change.title)}</strong>
        <div class="d-flex gap-2 flex-wrap">
          <span class="badge rounded-pill text-bg-light border">${escapeHtml(change.id)}</span>
          <span class="badge rounded-pill pt-pill ${statusClass(change.status)}">${escapeHtml(translateStatus(change.status))}</span>
          <span class="badge rounded-pill pt-pill ${priorityClass(change.priority)}">${escapeHtml(translatePriority(change.priority))}</span>
        </div>
      </div>
      <p class="mb-0 mt-2 small text-secondary">${escapeHtml(change.description || "No description")}</p>
    </article>
  `).join("");

  return `
    ${renderHeroCard({
      title: project.name,
      description: project.description || "Review the status, environments and related changes for this project.",
      meta: [`Start: ${project.startDate || "Not defined"}`],
      actionsHtml: `
        <button type="button" class="btn btn-light" data-action="open-change-create">Add Change</button>
        <button type="button" class="btn btn-light" data-action="open-project-editor">Edit Project</button>
        <button type="button" class="btn btn-danger" data-action="delete-project">Delete Project</button>
        <button type="button" class="btn btn-outline-light" data-action="back-to-project-origin">Back</button>`
    })}

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h2 class="h5 fw-semibold mb-1">Project Details</h2>
          <div class="d-flex flex-wrap gap-2">
            <span class="badge rounded-pill text-bg-light border">Status: ${escapeHtml(status)}</span>
          </div>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <span class="badge rounded-pill text-bg-light border">${escapeHtml(project.id)}</span>
          <span class="badge rounded-pill text-bg-light border">Related Changes: ${escapeHtml(String(relatedChanges.length))}</span>
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-5">
            <article class="card bg-light border-0 h-100">
              <div class="card-body d-grid gap-3">
                <div class="d-grid gap-1">
                  <span class="small fw-semibold text-secondary">Workfront</span>
                  ${renderLinkValue(project.workfrontLink)}
                </div>
                <div class="d-grid gap-1">
                  <span class="small fw-semibold text-secondary">OneDrive</span>
                  ${renderLinkValue(project.onedriveLink)}
                </div>
              </div>
            </article>
          </div>
          <div class="col-12 col-md-7">
            <div class="list-group list-group-flush">
              <div class="list-group-item bg-transparent px-0">
                <span class="small fw-semibold text-secondary d-block">Project</span>
                <span class="text-break">${escapeHtml(project.name)}</span>
              </div>
              <div class="list-group-item bg-transparent px-0">
                <span class="small fw-semibold text-secondary d-block">Details</span>
                <span class="text-break">${escapeHtml(project.description || "No description")}</span>
              </div>
              <div class="list-group-item bg-transparent px-0">
                <span class="small fw-semibold text-secondary d-block">Created</span>
                <span class="text-break">${escapeHtml(project.createdAt || project.startDate || "Not defined")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h2 class="h5 fw-semibold mb-0">Project Environments</h2>
        </div>
        <div class="row g-3">
          <div class="col-12 col-sm-6 col-lg-4">
            <article class="${environmentCardSurfaceClasses("QA")}">
              <div class="card-header bg-transparent border-0 pb-0">
                <span class="badge rounded-pill text-bg-light border">QA</span>
              </div>
              <div class="card-body d-grid gap-2 min-w-0">
                ${buildEnvironmentRows(project.qaUrls)}
              </div>
            </article>
          </div>
          <div class="col-12 col-sm-6 col-lg-4">
            <article class="${environmentCardSurfaceClasses("STG")}">
              <div class="card-header bg-transparent border-0 pb-0">
                <span class="badge rounded-pill text-bg-light border">STG</span>
              </div>
              <div class="card-body d-grid gap-2 min-w-0">
                ${buildEnvironmentRows(project.stgUrls)}
              </div>
            </article>
          </div>
          <div class="col-12 col-sm-6 col-lg-4">
            <article class="${environmentCardSurfaceClasses("PROD")}">
              <div class="card-header bg-transparent border-0 pb-0">
                <span class="badge rounded-pill text-bg-light border">PROD</span>
              </div>
              <div class="card-body d-grid gap-2 min-w-0">
                ${buildEnvironmentRows(project.prodUrls)}
              </div>
            </article>
          </div>
        </div>
        <hr class="my-1">
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h2 class="h5 fw-semibold mb-0">Project Changes</h2>
          </div>
          <span class="badge rounded-pill text-bg-light border">${relatedChanges.length} changes</span>
        </div>
        ${recentChanges
          ? `<div class="list-group">${recentChanges}</div>`
          : `<div class="card bg-light border-0"><div class="card-body"><strong>No related changes</strong><p class="mb-0">There are no visible changes related to this project yet.</p></div></div>`}
      </div>
    </section>
  `;
}
