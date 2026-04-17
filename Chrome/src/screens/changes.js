import { priorityClass, statusClass, translatePriority, translateStatus } from "../services/ui-copy.js";
import { getVisibleChanges } from "../services/workspace-selectors.js";
import { escapeAttribute, escapeHtml } from "../services/html.js";
import { renderHeroCard } from "../components/hero-card.js";

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
    <article class="list-group-item list-group-item-action py-3 pt-clickable-card" data-change-id="${escapeAttribute(change.id)}" role="button" tabindex="0">
      <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div class="min-w-0">
          <strong>${escapeHtml(change.title)}</strong>
          <p class="mb-0 mt-2 text-secondary small">${escapeHtml(change.description || "No description")}</p>
        </div>
        <div class="d-flex flex-wrap gap-2 justify-content-end">
          <span class="badge rounded-pill pt-pill ${statusClass(change.status)}">${escapeHtml(translateStatus(change.status))}</span>
          <span class="badge rounded-pill pt-pill ${priorityClass(change.priority)}">${escapeHtml(translatePriority(change.priority))}</span>
        </div>
      </div>
      <div class="d-flex flex-wrap align-items-center gap-2 mt-3">
        <span class="badge rounded-pill text-bg-light border">${escapeHtml(change.project)}</span>
        <span class="badge rounded-pill text-bg-light border">${escapeHtml(change.id)}</span>
        <span class="badge rounded-pill text-bg-light border">${escapeHtml(change.environment)}</span>
      </div>
      <div class="d-flex flex-wrap gap-2 mt-3">
        ${(change.assignees ?? []).map((assignee) => `<span class="badge rounded-pill bg-light text-dark border">${escapeHtml(assignee)}</span>`).join("")}
      </div>
    </article>
  `).join("");

  return `
    ${renderHeroCard({
      title: "Project Changes",
      meta: [`Total: ${filteredChanges.length}`],
      actionsHtml: `
        <button type="button" class="btn btn-light" data-action="open-change-create">New Change</button>
        <button type="button" class="btn btn-outline-light" data-action="back-to-project-detail">Back</button>`
    })}

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h2 class="h5 fw-semibold mb-1">Search and Create</h2>
          <p class="text-secondary mb-0">Review project changes and create new records.</p>
        </div>
        <div class="input-group">
          <span class="input-group-text" aria-hidden="true">
            <span class="material-symbols-outlined">search</span>
          </span>
          <input class="form-control" type="text" value="${escapeAttribute(state.changeSearchQuery)}" placeholder="Search changes..." data-input="change-search" aria-label="Search changes">
        </div>
      </div>
    </section>

    ${rows
      ? `<section class="list-group">${rows}</section>`
      : `<section class="card bg-body-tertiary"><div class="card-body"><strong>No visible changes</strong><p class="mb-0">No changes were found for the current filter.</p></div></section>`}
  `;
}
