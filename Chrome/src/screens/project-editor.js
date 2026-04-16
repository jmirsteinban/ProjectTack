function rowsFromMap(urlMap) {
  const entries = Object.entries(urlMap ?? {});
  if (entries.length === 0) {
    return `<div class="list-group-item pt-editor-empty-row" data-empty-row><span>No URLs configured.</span></div>`;
  }

  return entries.map(([label, value], index) => `
    <div class="list-group-item pt-editor-url-row" data-url-row>
      <div class="pt-editor-url-header">
        <strong>URL ${index + 1}</strong>
        <button type="button" class="btn btn-secondary btn-sm" data-action="remove-url-row">Remove</button>
      </div>
      <label class="form-label">Name</label>
      <input class="form-control" type="text" value="${label}" data-field="url-label">
      <label class="form-label">URL</label>
      <input class="form-control" type="text" value="${value}" data-field="url-value">
    </div>
  `).join("");
}

export function renderProjectEditorScreen(state, data) {
  const project = state.projectEditorMode === "create"
    ? { name: "", description: "", startDate: "", workfrontLink: "", onedriveLink: "", qaUrls: {}, stgUrls: {}, prodUrls: {} }
    : data.projects.find((item) => item.id === state.selectedProjectId) ?? data.projects[0];

  const title = state.projectEditorMode === "create" ? "New Project" : "Edit Project";

  return `
    <section class="pt-screen-hero">
      <div class="row g-3">
        <div class="col-12 col-lg">
          <div class="pt-change-detail-topline">
            <span>Project</span>
          </div>
          <div class="pt-change-detail-copy">
            <h3>${title}</h3>
          </div>
        </div>
        <div class="col-12 col-lg-auto d-flex justify-content-lg-end align-items-start gap-2 flex-wrap">
          <button type="button" class="btn btn-primary pt-hero-button" data-action="save-project">${state.projectEditorMode === "create" ? "Create Project" : "Save Project"}</button>
          <button type="button" class="btn btn-outline-primary pt-hero-button" data-action="back-to-project-detail">Cancel</button>
        </div>
      </div>
    </section>
    ${state.projectFormError ? `<section class="alert alert-danger mb-0"><strong>Unable to save.</strong><p class="mb-0">${state.projectFormError}</p></section>` : ""}
    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h3 class="pt-section-title mb-1">General Information</h3>
          <p class="text-secondary mb-0">Core project data and main access links.</p>
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label">Name *</label>
            <input class="form-control" type="text" value="${project.name || ""}" data-field="project-name">
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Start Date</label>
            <input class="form-control" type="date" value="${project.startDate || ""}" data-field="project-start-date">
          </div>
          <div class="col-12">
            <label class="form-label">Description</label>
            <textarea class="form-control" data-field="project-description">${project.description || ""}</textarea>
          </div>
          <div class="col-12 col-xl-6">
            <label class="form-label">Workfront Link</label>
            <input class="form-control" type="text" value="${project.workfrontLink || ""}" data-field="project-workfront">
          </div>
          <div class="col-12">
            <label class="form-label">OneDrive Link</label>
            <div class="input-group">
              <input class="form-control" type="text" value="${project.onedriveLink || ""}" data-field="project-onedrive">
              <button type="button" class="btn btn-secondary pt-path-picker-button" data-action="pick-project-onedrive-folder">Pick Folder</button>
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
                <h3 class="pt-section-title mb-1">QA Environment</h3>
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
                <h3 class="pt-section-title mb-1">STG Environment</h3>
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
                <h3 class="pt-section-title mb-1">PROD Environment</h3>
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
