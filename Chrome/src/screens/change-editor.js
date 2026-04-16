import {
  CHANGE_PRIORITY_OPTIONS,
  CHANGE_STATUS_OPTIONS,
  translatePriority,
  translateStatus,
} from "../services/ui-copy.js";

function assigneeChips(assignees) {
  if (!assignees.length) return `<p class="pt-row-subtle">No assigned people.</p>`;
  return `<div class="pt-inline-list">${assignees.map((assignee) => `<span class="pt-mini-chip">${assignee}</span>`).join("")}</div>`;
}

function choiceButton(label, value, group, active) {
  return `<button type="button" class="pt-editor-choice ${active ? "active" : ""}" data-choice-group="${group}" data-choice-value="${value}">${label}</button>`;
}

export function renderChangeEditorScreen(state, data) {
  const baseChange = state.changeEditorMode === "create"
    ? { title: "", description: "", status: "Pendiente", priority: "Media", environment: "QA", assignees: [], workfrontLink: "", onedriveLink: "", visibleEnvironments: ["QA"] }
    : data.changes.find((item) => item.id === state.selectedChangeId) ?? data.changes[0];
  const change = state.changeEditorDraft ?? baseChange;
  const visibleSet = new Set(change.visibleEnvironments ?? ["QA"]);
  const title = state.changeEditorMode === "create" ? "New Change" : "Edit Change";
  const fieldErrors = state.changeFieldErrors ?? {};
  const inputErrorClass = (fieldName) => fieldErrors[fieldName] ? " is-invalid" : "";
  const textareaErrorClass = (fieldName) => fieldErrors[fieldName] ? " is-invalid" : "";
  const choiceGroupErrorClass = (fieldName) => fieldErrors[fieldName] ? " pt-editor-visibility-grid--error" : "";
  const inlineFieldError = (fieldName) => fieldErrors[fieldName]
    ? `<p class="invalid-feedback">${fieldErrors[fieldName]}</p>`
    : "";

  return `
    <section class="pt-screen-hero">
      <div class="row g-3">
        <div class="col-12 col-lg">
          <div class="pt-change-detail-topline">
            <span>Change</span>
          </div>
          <div class="pt-change-detail-copy">
            <h3>${title}</h3>
          </div>
          <div class="pt-change-detail-meta">
            <span class="pt-mini-chip">Mode: ${state.changeEditorMode === "create" ? "Create" : "Edit"}</span>
          </div>
        </div>
        <div class="col-12 col-lg-auto d-flex justify-content-lg-end align-items-start gap-2 flex-wrap">
          <button type="button" class="btn btn-primary pt-hero-button" data-action="save-change">${state.changeEditorMode === "create" ? "Create Change" : "Save Change"}</button>
          <button type="button" class="btn btn-outline-primary pt-hero-button" data-action="back-to-change-detail">Cancel</button>
        </div>
      </div>
    </section>
    ${state.changeFormError ? `<section class="alert alert-danger mb-0"><strong>Unable to save.</strong><p class="mb-0">${state.changeFormError}</p></section>` : ""}
    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h3 class="pt-section-title mb-1">General Information</h3>
          <p class="text-secondary mb-0">Base data, description and owners of the change.</p>
        </div>
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label">Name</label>
            <input class="form-control${inputErrorClass("title")}" type="text" value="${change.title || ""}" data-field="change-title">
            ${inlineFieldError("title")}
          </div>
          <div class="col-12">
            <label class="form-label">Description</label>
            <textarea class="form-control${textareaErrorClass("description")}" data-field="change-description">${change.description || ""}</textarea>
          </div>
          <div class="col-12">
            <label class="form-label">Assignees *</label>
            <input class="form-control${inputErrorClass("assignees")}" type="text" value="${(change.assignees || []).join(", ")}" placeholder="Demo User, QA Team" data-field="change-assignees">
            ${inlineFieldError("assignees")}
            <p class="form-text mb-2">Separate people with commas or type <code>@</code> to search users.</p>
            <div class="pt-note-mention-suggestions" data-change-assignee-suggestions hidden></div>
            ${assigneeChips(change.assignees || [])}
          </div>
        </div>
      </div>
    </section>
    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h3 class="pt-section-title mb-1">Status and Priority</h3>
          <p class="text-secondary mb-0">Functional control of the change progress.</p>
        </div>
        <div class="row g-4">
          <div class="col-12 col-lg-6">
            <h4 class="h6 mb-2">Status</h4>
            <div class="pt-editor-choice-grid">${CHANGE_STATUS_OPTIONS.map((item) => choiceButton(translateStatus(item), item, "change-status", item === change.status)).join("")}</div>
          </div>
          <div class="col-12 col-lg-6">
            <h4 class="h6 mb-2">Priority</h4>
            <div class="pt-editor-choice-grid">${CHANGE_PRIORITY_OPTIONS.map((item) => choiceButton(translatePriority(item), item, "change-priority", item === change.priority)).join("")}</div>
          </div>
        </div>
      </div>
    </section>
    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h3 class="pt-section-title mb-1">Environments</h3>
          <p class="text-secondary mb-0">Define the current environment and link visibility.</p>
        </div>
        <div class="row g-4">
          <div class="col-12 col-lg-6">
            <h4 class="h6 mb-2">Current Environment</h4>
            <div class="pt-editor-choice-grid">${["QA", "STG", "PROD"].map((item) => choiceButton(item, item, "change-environment", item === change.environment)).join("")}</div>
          </div>
          <div class="col-12 col-lg-6">
            <h4 class="h6 mb-2">Visible Links by Environment</h4>
            <div class="pt-editor-visibility-grid${choiceGroupErrorClass("visibleEnvironments")}">
              <label class="form-check"><input class="form-check-input" type="checkbox" data-field="show-qa-links" ${visibleSet.has("QA") ? "checked" : ""}><span class="form-check-label">Show QA links</span></label>
              <label class="form-check"><input class="form-check-input" type="checkbox" data-field="show-stg-links" ${visibleSet.has("STG") ? "checked" : ""}><span class="form-check-label">Show STG links</span></label>
              <label class="form-check"><input class="form-check-input" type="checkbox" data-field="show-prod-links" ${visibleSet.has("PROD") ? "checked" : ""}><span class="form-check-label">Show PROD links</span></label>
            </div>
            ${inlineFieldError("visibleEnvironments")}
          </div>
        </div>
      </div>
    </section>
    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h3 class="pt-section-title mb-1">Access Links</h3>
          <p class="text-secondary mb-0">Main links used by the team.</p>
        </div>
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label">Workfront Link *</label>
            <input class="form-control${inputErrorClass("workfrontLink")}" type="text" value="${change.workfrontLink || ""}" data-field="change-workfront">
            ${inlineFieldError("workfrontLink")}
          </div>
          <div class="col-12">
            <label class="form-label">OneDrive Link *</label>
            <input class="form-control${inputErrorClass("onedriveLink")}" type="text" value="${change.onedriveLink || ""}" data-field="change-onedrive">
            ${inlineFieldError("onedriveLink")}
          </div>
        </div>
      </div>
    </section>
  `;
}
