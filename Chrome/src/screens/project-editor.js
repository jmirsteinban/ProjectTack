import { renderHeroCard } from "../components/hero-card.js";
import { escapeAttribute, escapeHtml } from "../services/html.js";

function rowsFromMap(urlMap) {
  const entries = Object.entries(urlMap ?? {});
  if (entries.length === 0) {
    return `<div class="list-group-item text-secondary" data-empty-row><span>No URLs configured.</span></div>`;
  }

  return entries.map(([label, value], index) => `
    <div class="list-group-item d-grid gap-2" data-url-row>
      <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
        <strong>URL ${index + 1}</strong>
        <button type="button" class="btn btn-secondary btn-sm" data-action="remove-url-row">Remove</button>
      </div>
      <label class="form-label">Name</label>
      <input class="form-control" type="text" value="${escapeAttribute(label)}" data-field="url-label">
      <label class="form-label">URL</label>
      <input class="form-control" type="text" value="${escapeAttribute(value)}" data-field="url-value">
    </div>
  `).join("");
}

export function renderProjectEditorScreen(state, data) {
  const project = state.projectEditorMode === "create"
    ? { name: "", description: "", startDate: "", workfrontLink: "", onedriveLink: "", qaUrls: {}, stgUrls: {}, prodUrls: {} }
    : data.projects.find((item) => item.id === state.selectedProjectId);

  if (!project) {
    return `<section class="card bg-body-tertiary"><div class="card-body"><strong>Project unavailable</strong><p class="mb-0">This project is no longer available or was logically deleted.</p></div></section>`;
  }

  const title = state.projectEditorMode === "create" ? "New Project" : "Edit Project";

  return `
    ${renderHeroCard({
      title,
      description: "Project setup, environments, and shared access links.",
      meta: [`Mode: ${state.projectEditorMode === "create" ? "Create" : "Edit"}`],
      actionsHtml: `
        <button type="button" class="btn btn-light" data-action="save-project">${state.projectEditorMode === "create" ? "Create Project" : "Save Project"}</button>
        <button type="button" class="btn btn-outline-light" data-action="back-to-project-detail">Cancel</button>`
    })}
    ${state.projectFormError ? `<section class="alert alert-danger mb-0"><strong>Unable to save.</strong><p class="mb-0">${escapeHtml(state.projectFormError)}</p></section>` : ""}
    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h2 class="h5 fw-semibold mb-1">General Information</h2>
          <p class="text-secondary mb-0">Core project data and main access links.</p>
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label">Name *</label>
            <input class="form-control" type="text" value="${escapeAttribute(project.name || "")}" data-field="project-name">
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Start Date</label>
            <input class="form-control" type="date" value="${escapeAttribute(project.startDate || "")}" data-field="project-start-date">
          </div>
          <div class="col-12">
            <label class="form-label">Description</label>
            <textarea class="form-control" data-field="project-description">${escapeHtml(project.description || "")}</textarea>
          </div>
          <div class="col-12 col-xl-6">
            <label class="form-label">Workfront Link</label>
            <input class="form-control" type="text" value="${escapeAttribute(project.workfrontLink || "")}" data-field="project-workfront">
          </div>
          <div class="col-12">
            <label class="form-label">OneDrive Link</label>
            <div class="input-group">
              <input class="form-control" type="text" value="${escapeAttribute(project.onedriveLink || "")}" data-field="project-onedrive">
              <button type="button" class="btn btn-secondary" data-action="pick-project-onedrive-folder">Pick Folder</button>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="row g-3">
      <div class="col-12 col-lg-4">
        <article class="card bg-body-tertiary h-100">
          <div class="card-body d-grid gap-3">
            <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
              <div>
                <h2 class="h5 fw-semibold mb-1">QA Environment</h2>
                <p class="text-secondary mb-0">Visible URLs in QA.</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" data-action="add-url-row" data-env-name="QA">Add URL</button>
            </div>
            <div class="list-group" data-env-group="QA">${rowsFromMap(project.qaUrls)}</div>
          </div>
        </article>
      </div>
      <div class="col-12 col-lg-4">
        <article class="card bg-body-tertiary h-100">
          <div class="card-body d-grid gap-3">
            <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
              <div>
                <h2 class="h5 fw-semibold mb-1">STG Environment</h2>
                <p class="text-secondary mb-0">Visible URLs in STG.</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" data-action="add-url-row" data-env-name="STG">Add URL</button>
            </div>
            <div class="list-group" data-env-group="STG">${rowsFromMap(project.stgUrls)}</div>
          </div>
        </article>
      </div>
      <div class="col-12 col-lg-4">
        <article class="card bg-body-tertiary h-100">
          <div class="card-body d-grid gap-3">
            <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
              <div>
                <h2 class="h5 fw-semibold mb-1">PROD Environment</h2>
                <p class="text-secondary mb-0">Visible URLs in production.</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" data-action="add-url-row" data-env-name="PROD">Add URL</button>
            </div>
            <div class="list-group" data-env-group="PROD">${rowsFromMap(project.prodUrls)}</div>
          </div>
        </article>
      </div>
    </section>
  `;
}
