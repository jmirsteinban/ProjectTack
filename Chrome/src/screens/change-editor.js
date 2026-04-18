import {
  CHANGE_PRIORITY_OPTIONS,
  CHANGE_STATUS_OPTIONS,
  translatePriority,
  translateStatus,
} from "../services/ui-copy.js";
import { renderHeroCard } from "../components/hero-card.js";
import { escapeAttribute, escapeHtml } from "../services/html.js";

function assigneeChips(assignees) {
  if (!assignees.length) return `<p class="text-secondary mb-0">No assigned people.</p>`;
  return `<div class="d-flex flex-wrap gap-2">${assignees.map((assignee) => `<span class="badge rounded-pill text-bg-light border">${escapeHtml(assignee)}</span>`).join("")}</div>`;
}

function choiceButton(label, value, group, active) {
  return `<button type="button" class="btn btn-outline-primary ${active ? "active" : ""}" data-choice-group="${escapeAttribute(group)}" data-choice-value="${escapeAttribute(value)}">${escapeHtml(label)}</button>`;
}

export function renderChangeEditorScreen(state, data) {
  const baseChange = state.changeEditorMode === "create"
    ? { title: "", description: "", status: "Pendiente", priority: "Media", environment: "QA", assignees: [], workfrontLink: "", onedriveLink: "", visibleEnvironments: ["QA"] }
    : data.changes.find((item) => item.id === state.selectedChangeId);
  if (!baseChange) {
    return `<section class="card bg-body-tertiary"><div class="card-body"><strong>Change unavailable</strong><p class="mb-0">This change is no longer available or was logically deleted.</p></div></section>`;
  }
  const change = state.changeEditorDraft ?? baseChange;
  const visibleSet = new Set(change.visibleEnvironments ?? ["QA"]);
  const title = state.changeEditorMode === "create" ? "New Change" : "Edit Change";
  const fieldErrors = state.changeFieldErrors ?? {};
  const inputErrorClass = (fieldName) => fieldErrors[fieldName] ? " is-invalid" : "";
  const textareaErrorClass = (fieldName) => fieldErrors[fieldName] ? " is-invalid" : "";
  const choiceGroupErrorClass = (fieldName) => fieldErrors[fieldName] ? " border border-danger rounded-2 p-2" : "";
  const inlineFieldError = (fieldName) => fieldErrors[fieldName]
    ? `<p class="invalid-feedback d-block">${escapeHtml(fieldErrors[fieldName])}</p>`
    : "";

  return `
    ${renderHeroCard({
      title,
      description: "Change setup, owners, status, environments, and team links.",
      meta: [`Mode: ${state.changeEditorMode === "create" ? "Create" : "Edit"}`],
      actionsHtml: `
        <button type="button" class="btn btn-light" data-action="save-change">${state.changeEditorMode === "create" ? "Create Change" : "Save Change"}</button>
        <button type="button" class="btn btn-outline-light" data-action="back-to-change-detail">Cancel</button>`
    })}
    ${state.changeFormError ? `<section class="alert alert-danger mb-0"><strong>Unable to save.</strong><p class="mb-0">${escapeHtml(state.changeFormError)}</p></section>` : ""}
    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h2 class="h5 fw-semibold mb-1">General Information</h2>
          <p class="text-secondary mb-0">Base data, description and owners of the change.</p>
        </div>
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label">Name</label>
            <input class="form-control${inputErrorClass("title")}" type="text" value="${escapeAttribute(change.title || "")}" data-field="change-title">
            ${inlineFieldError("title")}
          </div>
          <div class="col-12">
            <label class="form-label">Description</label>
            <textarea class="form-control${textareaErrorClass("description")}" data-field="change-description">${escapeHtml(change.description || "")}</textarea>
          </div>
          <div class="col-12">
            <label class="form-label">Assignees *</label>
            <input class="form-control${inputErrorClass("assignees")}" type="text" value="${escapeAttribute((change.assignees || []).join(", "))}" placeholder="Demo User, QA Team" data-field="change-assignees">
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
          <h2 class="h5 fw-semibold mb-1">Status and Priority</h2>
          <p class="text-secondary mb-0">Functional control of the change progress.</p>
        </div>
        <div class="row g-4">
          <div class="col-12 col-lg-6">
            <h4 class="h6 mb-2">Status</h4>
            <div class="d-flex flex-wrap gap-2">${CHANGE_STATUS_OPTIONS.map((item) => choiceButton(translateStatus(item), item, "change-status", item === change.status)).join("")}</div>
          </div>
          <div class="col-12 col-lg-6">
            <h4 class="h6 mb-2">Priority</h4>
            <div class="d-flex flex-wrap gap-2">${CHANGE_PRIORITY_OPTIONS.map((item) => choiceButton(translatePriority(item), item, "change-priority", item === change.priority)).join("")}</div>
          </div>
        </div>
      </div>
    </section>
    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h2 class="h5 fw-semibold mb-1">Environments</h2>
          <p class="text-secondary mb-0">Define the current environment and link visibility.</p>
        </div>
        <div class="row g-4">
          <div class="col-12 col-lg-6">
            <h4 class="h6 mb-2">Current Environment</h4>
            <div class="d-flex flex-wrap gap-2">${["QA", "STG", "PROD"].map((item) => choiceButton(item, item, "change-environment", item === change.environment)).join("")}</div>
          </div>
          <div class="col-12 col-lg-6">
            <h4 class="h6 mb-2">Visible Links by Environment</h4>
            <div class="d-grid gap-2${choiceGroupErrorClass("visibleEnvironments")}">
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
          <h2 class="h5 fw-semibold mb-1">Access Links</h2>
          <p class="text-secondary mb-0">Main links used by the team.</p>
        </div>
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label">Workfront Link *</label>
            <input class="form-control${inputErrorClass("workfrontLink")}" type="text" value="${escapeAttribute(change.workfrontLink || "")}" data-field="change-workfront">
            ${inlineFieldError("workfrontLink")}
          </div>
          <div class="col-12">
            <label class="form-label">OneDrive Link *</label>
            <input class="form-control${inputErrorClass("onedriveLink")}" type="text" value="${escapeAttribute(change.onedriveLink || "")}" data-field="change-onedrive">
            ${inlineFieldError("onedriveLink")}
          </div>
        </div>
      </div>
    </section>
  `;
}
