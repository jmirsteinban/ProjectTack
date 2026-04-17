import {
  isCompletedStatus,
  priorityClass,
  statusClass,
  translatePriority,
  translateStatus
} from "../services/ui-copy.js";
import { getVisibleChangesForProject, getVisibleProjects } from "../services/workspace-selectors.js";
import { escapeAttribute, escapeHtml, isHttpUrl } from "../services/html.js";

function environmentCardClass(environment) {
  if (environment === "QA") return "status-progress";
  if (environment === "STG") return "priority-medium";
  if (environment === "PROD") return "status-done";
  return "neutral";
}

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
      <span class="pt-change-link-content">
        <span class="pt-change-link-value">Not defined</span>
      </span>
    `;
  }

  const valueMarkup = isOpenableLink(value)
    ? `<a class="pt-change-link-value pt-change-link-value--link" href="${escapeAttribute(value)}" target="_blank" rel="noopener noreferrer" title="${escapeAttribute(value)}">${escapeHtml(value)}</a>`
    : `<span class="pt-change-link-value" title="${escapeAttribute(value)}">${escapeHtml(value)}</span>`;

  return `
    <span class="pt-change-link-content">
      ${valueMarkup}
      <button type="button" class="pt-copy-icon-button" data-action="copy-link-value" data-copy-value="${encodeCopyValue(value)}" aria-label="Copy link" title="Copy link">
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M9 9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2Zm-6 6V5a2 2 0 0 1 2-2h8v2H5v10z"></path>
        </svg>
      </button>
    </span>
  `;
}

function buildEnvironmentRows(urls) {
  const entries = Object.entries(urls ?? {});
  if (entries.length === 0) {
    return `<p>No URLs configured</p>`;
  }

  return entries.map(([label, value]) => `
    <div class="pt-change-link-row">
      <span class="pt-change-link-label">${escapeHtml(label)}:</span>
      ${renderLinkValue(value)}
    </div>
  `).join("");
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
    <article class="list-group-item list-group-item-action pt-project-list-group-item pt-clickable-card" data-change-id="${escapeAttribute(change.id)}" role="button" tabindex="0">
      <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <strong class="pt-project-detail-change-title">${escapeHtml(change.title)}</strong>
        <div class="d-flex gap-2 flex-wrap">
          <span class="pt-pill neutral">${escapeHtml(change.id)}</span>
          <span class="pt-pill ${statusClass(change.status)}">${escapeHtml(translateStatus(change.status))}</span>
          <span class="pt-pill ${priorityClass(change.priority)}">${escapeHtml(translatePriority(change.priority))}</span>
        </div>
      </div>
      <p class="pt-project-list-group-caption">${escapeHtml(change.description || "No description")}</p>
    </article>
  `).join("");

  return `
    <section class="pt-screen-hero">
      <div class="row g-3">
        <div class="col-12 col-lg">
          <div class="pt-change-detail-topline">
            <span>Project</span>
          </div>
          <div class="pt-project-detail-copy">
            <h3>${escapeHtml(project.name)}</h3>
            <p>${escapeHtml(project.description || "Review the status, environments and related changes for this project.")}</p>
          </div>
          <div class="pt-change-detail-meta">
            <span class="pt-mini-chip">Start: ${escapeHtml(project.startDate || "Not defined")}</span>
          </div>
        </div>
        <div class="col-12 col-lg-auto d-flex justify-content-lg-end align-items-start gap-2 flex-wrap">
          <button type="button" class="btn btn-primary pt-change-create-button pt-hero-button" data-action="open-change-create">Add Change</button>
          <button type="button" class="btn btn-primary pt-change-create-button pt-hero-button" data-action="open-project-editor">Edit Project</button>
          <button type="button" class="btn btn-danger pt-danger-button pt-hero-button" data-action="delete-project">Delete Project</button>
          <button type="button" class="btn btn-outline-primary pt-back-button pt-back-button--hero pt-hero-button" data-action="back-to-project-origin">Back</button>
        </div>
      </div>
    </section>

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h3 class="pt-section-title mb-1">Project Details</h3>
          <div class="pt-change-detail-meta">
            <span class="pt-mini-chip">Status: ${escapeHtml(status)}</span>
          </div>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <span class="pt-mini-chip">${escapeHtml(project.id)}</span>
          <span class="pt-mini-chip">Related Changes: ${escapeHtml(String(relatedChanges.length))}</span>
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-5">
            <article class="card bg-light border-0 h-100">
              <div class="card-body">
                <div class="pt-change-link-row">
                  <span class="pt-change-link-label">Workfront:</span>
                  ${renderLinkValue(project.workfrontLink)}
                </div>
                <div class="pt-change-link-row">
                  <span class="pt-change-link-label">OneDrive:</span>
                  ${renderLinkValue(project.onedriveLink)}
                </div>
              </div>
            </article>
          </div>
          <div class="col-12 col-md-7">
            <div class="d-grid gap-2">
              <div class="pt-change-summary-row">
                <span class="pt-change-summary-label">Project:</span>
                <span class="pt-change-summary-value">${escapeHtml(project.name)}</span>
              </div>
              <div class="pt-change-summary-row">
                <span class="pt-change-summary-label">Details:</span>
                <span class="pt-change-summary-value">${escapeHtml(project.description || "No description")}</span>
              </div>
              <div class="pt-change-summary-row">
                <span class="pt-change-summary-label">Created:</span>
                <span class="pt-change-summary-value">${escapeHtml(project.createdAt || project.startDate || "Not defined")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h3 class="pt-section-title mb-0">Project Environments</h3>
        </div>
        <div class="row g-3">
          <div class="col-12 col-sm-6 col-lg-4">
            <article class="${environmentCardSurfaceClasses("QA")}">
              <div class="position-absolute top-0 start-0 translate-middle-y ms-3 px-1 bg-body-tertiary">
                <span class="pt-pill ${environmentCardClass("QA")}">QA</span>
              </div>
              <div class="card-body d-grid gap-2 min-w-0">
                <div class="pt-change-environment-links">${buildEnvironmentRows(project.qaUrls)}</div>
              </div>
            </article>
          </div>
          <div class="col-12 col-sm-6 col-lg-4">
            <article class="${environmentCardSurfaceClasses("STG")}">
              <div class="position-absolute top-0 start-0 translate-middle-y ms-3 px-1 bg-body-tertiary">
                <span class="pt-pill ${environmentCardClass("STG")}">STG</span>
              </div>
              <div class="card-body d-grid gap-2 min-w-0">
                <div class="pt-change-environment-links">${buildEnvironmentRows(project.stgUrls)}</div>
              </div>
            </article>
          </div>
          <div class="col-12 col-sm-6 col-lg-4">
            <article class="${environmentCardSurfaceClasses("PROD")}">
              <div class="position-absolute top-0 start-0 translate-middle-y ms-3 px-1 bg-body-tertiary">
                <span class="pt-pill ${environmentCardClass("PROD")}">PROD</span>
              </div>
              <div class="card-body d-grid gap-2 min-w-0">
                <div class="pt-change-environment-links">${buildEnvironmentRows(project.prodUrls)}</div>
              </div>
            </article>
          </div>
        </div>
        <div class="pt-section-separator"></div>
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h3 class="pt-section-title mb-0">Project Changes</h3>
          </div>
          <span class="pt-dashboard-count-chip">${relatedChanges.length} changes</span>
        </div>
        ${recentChanges
          ? `<div class="list-group">${recentChanges}</div>`
          : `<div class="card bg-light border-0"><div class="card-body"><strong>No related changes</strong><p class="mb-0">There are no visible changes related to this project yet.</p></div></div>`}
      </div>
    </section>
  `;
}
