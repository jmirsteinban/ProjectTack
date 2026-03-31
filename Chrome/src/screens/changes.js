import { priorityClass, statusClass, translatePriority, translateStatus } from "../services/ui-copy.js";
import { getVisibleChanges } from "../services/workspace-selectors.js";

function normalizeText(value) {
  return value.normalize("NFD").replace(/\p{Diacritic}+/gu, "").toLowerCase().trim();
}

export function renderChangesScreen(state, data) {
  const visibleChanges = getVisibleChanges(data);
  const query = normalizeText(state.changeSearchQuery);
  const filteredChanges = visibleChanges.filter((change) => {
    if (!query) return true;
    return normalizeText(change.title).includes(query) ||
      normalizeText(change.description || "").includes(query) ||
      normalizeText(change.project).includes(query);
  });

  const rows = filteredChanges.map((change) => `
    <article class="card bg-body-tertiary pt-change-card" data-change-id="${change.id}">
      <div class="card-body">
        <div class="pt-row-top">
          <div class="pt-change-copy">
            <strong>${change.title}</strong>
            <p>${change.description || "No description"}</p>
          </div>
        </div>
        <div class="pt-pill-row">
          <span class="pt-pill ${statusClass(change.status)}">${translateStatus(change.status)}</span>
          <span class="pt-pill ${priorityClass(change.priority)}">${translatePriority(change.priority)}</span>
        </div>
        <div class="pt-change-meta">
          <span class="pt-change-project">${change.project}</span>
          <span class="pt-pill neutral">${change.id}</span>
          <span class="pt-pill info">${change.environment}</span>
        </div>
        <div class="pt-inline-list">
          ${change.assignees.map((assignee) => `<span class="pt-mini-chip">${assignee}</span>`).join("")}
        </div>
      </div>
    </article>
  `).join("");

  return `
    <section class="pt-screen-hero">
      <div class="row">
        <div class="col">
          <div class="pt-change-detail-topline">
            <span>Workspace / Changes</span>
          </div>
          <div class="pt-change-detail-copy">
            <h3>Project Changes</h3>
          </div>
          <div class="pt-change-detail-meta">
            <span class="pt-mini-chip">Total: ${filteredChanges.length}</span>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col d-flex justify-content-end gap-2 flex-wrap">
          <button type="button" class="btn btn-primary pt-change-create-button" data-action="open-change-create">New Change</button>
          <button type="button" class="btn btn-outline-primary pt-back-button pt-back-button--hero" data-action="back-to-project-detail">Back</button>
        </div>
      </div>
    </section>
    <section class="pt-screen-card">
      <div class="pt-row-top">
        <div>
          <h3 class="pt-section-title">Search and Create</h3>
          <p>Review project changes and create new records.</p>
        </div>
      </div>
      <div class="pt-change-header-actions">
        <input class="form-control pt-change-search-input" type="text" value="${state.changeSearchQuery}" placeholder="Search changes..." data-input="change-search">
      </div>
    </section>
    <section class="pt-list">${rows || `<div class="pt-empty-state-card"><strong>No visible changes</strong><p>No changes were found for the current filter.</p></div>`}</section>
  `;
}


