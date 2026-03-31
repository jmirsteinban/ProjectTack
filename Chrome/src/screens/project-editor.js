function rowsFromMap(urlMap) {
  const entries = Object.entries(urlMap ?? {});
  if (entries.length === 0) {
    return `<div class="pt-editor-empty-row" data-empty-row><span>No URLs configured.</span></div>`;
  }

  return entries.map(([label, value], index) => `
    <div class="pt-editor-url-row" data-url-row>
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
      <div class="row">
        <div class="col">
          <div class="pt-change-detail-topline">
            <span>Project</span>
          </div>
          <div class="pt-change-detail-copy">
            <h3>${title}</h3>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col d-flex justify-content-end gap-2 flex-wrap">
          <button type="button" class="btn btn-primary" data-action="save-project">${state.projectEditorMode === "create" ? "Create Project" : "Save Project"}</button>
          <button type="button" class="btn btn-outline-primary" data-action="back-to-project-detail">Cancel</button>
        </div>
      </div>
    </section>
    ${state.projectFormError ? `<section class="alert alert-danger"><strong>Unable to save.</strong><p>${state.projectFormError}</p></section>` : ""}
    <section class="pt-screen-card pt-form-section d-grid gap-cus-14 min-w-0">
      <div class="pt-form-section-header">
        <h3 class="pt-section-title">General Information</h3>
        <p>Core project data and main access links.</p>
      </div>
      <div class="pt-row pt-row--comfortable">
        <div class="pt-col pt-col-12 pt-col-sm-6 pt-field-group">
          <label class="form-label">Name *</label>
          <input class="form-control" type="text" value="${project.name || ""}" data-field="project-name">
        </div>
        <div class="pt-col pt-col-12 pt-col-sm-6 pt-field-group">
          <label class="form-label">Start Date</label>
          <input class="form-control" type="date" value="${project.startDate || ""}" data-field="project-start-date">
        </div>
        <div class="pt-col pt-col-12 pt-field-group">
          <label class="form-label">Description</label>
          <textarea class="form-control" data-field="project-description">${project.description || ""}</textarea>
        </div>
        <div class="pt-col pt-col-12 pt-col-lg-6 pt-field-group">
          <label class="form-label">Workfront Link</label>
          <input class="form-control" type="text" value="${project.workfrontLink || ""}" data-field="project-workfront">
        </div>
        <div class="pt-col pt-col-12 pt-field-group">
          <label class="form-label">OneDrive Link</label>
          <div class="input-group">
            <input class="form-control" type="text" value="${project.onedriveLink || ""}" data-field="project-onedrive">
            <button type="button" class="btn btn-secondary pt-path-picker-button" data-action="pick-project-onedrive-folder">Pick Folder</button>
          </div>
        </div>
      </div>
    </section>
    <section class="pt-row pt-row--comfortable">
      <article class="pt-col pt-col-12 pt-col-sm-6 pt-col-lg-4 pt-screen-card pt-form-section d-grid gap-cus-14 min-w-0">
        <div class="pt-row-top">
          <div class="pt-form-section-header">
            <h3 class="pt-section-title">QA Environment</h3>
            <p>Visible URLs in QA.</p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" data-action="add-url-row" data-env-name="QA">Add URL</button>
        </div>
        <div class="pt-list" data-env-group="QA">${rowsFromMap(project.qaUrls)}</div>
      </article>
      <article class="pt-col pt-col-12 pt-col-sm-6 pt-col-lg-4 pt-screen-card pt-form-section d-grid gap-cus-14 min-w-0">
        <div class="pt-row-top">
          <div class="pt-form-section-header">
            <h3 class="pt-section-title">STG Environment</h3>
            <p>Visible URLs in STG.</p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" data-action="add-url-row" data-env-name="STG">Add URL</button>
        </div>
        <div class="pt-list" data-env-group="STG">${rowsFromMap(project.stgUrls)}</div>
      </article>
      <article class="pt-col pt-col-12 pt-col-sm-6 pt-col-lg-4 pt-screen-card pt-form-section d-grid gap-cus-14 min-w-0">
        <div class="pt-row-top">
          <div class="pt-form-section-header">
            <h3 class="pt-section-title">PROD Environment</h3>
            <p>Visible URLs in production.</p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" data-action="add-url-row" data-env-name="PROD">Add URL</button>
        </div>
        <div class="pt-list" data-env-group="PROD">${rowsFromMap(project.prodUrls)}</div>
      </article>
    </section>
  `;
}
