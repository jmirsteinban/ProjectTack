import {
  getVisibleChanges,
  getVisibleChangesForProject,
  getVisibleProjects,
} from "../services/workspace-selectors.js";
import {
  isCompletedStatus,
  priorityClass,
  statusClass,
  translatePriority,
  translateStatus,
} from "../services/ui-copy.js";
import { escapeAttribute, escapeHtml } from "../services/html.js";
import { renderHeroCard } from "../components/hero-card.js";

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase()
    .trim();
}

function isProjectActive(changes) {
  return changes.some((change) => !isCompletedStatus(change.status));
}

export function renderProjectsScreen(state, data) {
  const visibleProjects = getVisibleProjects(data);
  const visibleChanges = getVisibleChanges(data);
  const query = normalizeText(state.projectSearchQuery);
  const filteredProjects = visibleProjects.filter((project) => {
    const projectChanges = visibleChanges.filter(
      (change) => change.project === project.name,
    );
    const matchesQuery = !query || normalizeText(project.name).includes(query);
    const matchesFilter =
      state.projectActivityFilter === "All" ||
      (state.projectActivityFilter === "Active" &&
        isProjectActive(projectChanges)) ||
      (state.projectActivityFilter === "Inactive" &&
        !isProjectActive(projectChanges));
    return matchesQuery && matchesFilter;
  });
  const emptyTitle =
    query || state.projectActivityFilter !== "All"
      ? "No projects match this filter"
      : "No visible projects";
  const emptyDescription =
    query || state.projectActivityFilter !== "All"
      ? "Try a different name or switch filters to show projects again."
      : "There are no projects loaded for this view yet.";

  const rows = filteredProjects
    .map((project) => {
      const projectChanges = getVisibleChangesForProject(
        data,
        project.name,
      ).slice(0, 4);
      const changeRows =
        projectChanges.length > 0
          ? `
        <div class="list-group list-group-flush">
          ${projectChanges
            .map(
              (change) => `
        <article class="list-group-item list-group-item-action py-3 pt-clickable-card" data-change-id="${escapeAttribute(change.id)}" role="button" tabindex="0">
          <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <strong class="min-w-0">${escapeHtml(change.title)}</strong>
            <div class="d-flex gap-2 flex-wrap">
              <span class="badge rounded-pill pt-pill ${statusClass(change.status)}">${escapeHtml(translateStatus(change.status))}</span>
              <span class="badge rounded-pill pt-pill ${priorityClass(change.priority)}">${escapeHtml(translatePriority(change.priority))}</span>
            </div>
          </div>
          <p class="mb-0 mt-2 small text-secondary">${escapeHtml(change.description || "No description")}</p>
        </article>
      `,
            )
            .join("")}
        </div>
      `
          : `<p class="mb-0 small text-secondary">No recent changes</p>`;

      return `
      <div class="col">
        <article class="card border-0 shadow-sm h-100 pt-clickable-card" data-project-id="${escapeAttribute(project.id)}" role="button" tabindex="0">
          <div class="card-header bg-white border-0 d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <h2 class="h5 mb-0 min-w-0">${escapeHtml(project.name)}</h2>
            <span class="badge rounded-pill text-bg-light border">Created: ${escapeHtml(project.startDate || "Not defined")}</span>
          </div>
          <div class="card-body d-grid gap-3">
            <p class="mb-0 text-secondary">${escapeHtml(project.description || "No description")}</p>
            <div class="d-grid gap-2">
              <span class="text-uppercase small fw-semibold text-secondary">Changes</span>
              ${changeRows}
            </div>
          </div>
        </article>
      </div>
    `;
    })
    .join("");

  return `
    ${renderHeroCard({
      title: "Projects",
      description: "Centralize workspace tracking and jump quickly into each project's recent changes.",
      mainClass: "col-12 col-xl-5",
      controlsHtml: `
          <div class="d-flex align-items-stretch gap-2 flex-wrap">
            <div class="input-group flex-grow-1 min-w-0">
              <span class="input-group-text" aria-hidden="true">
                <span class="material-symbols-outlined">search</span>
              </span>
              <input class="form-control" type="text" value="${escapeAttribute(state.projectSearchQuery)}" placeholder="Search projects..." data-input="project-search" aria-label="Search projects">
            </div>
            <button type="button" class="btn btn-light" data-action="cycle-project-filter">${escapeHtml(state.projectActivityFilter)}</button>
          </div>`,
      actionsHtml: `
        <button type="button" class="btn btn-outline-light" data-action="navigate-main" data-view-id="dashboard">Back</button>
        <button type="button" class="btn btn-light" data-action="open-project-create">New Project</button>`
    })}

    ${rows
      ? `<section class="row row-cols-1 row-cols-xl-2 g-3 g-xl-4">${rows}</section>`
      : `<section class="card bg-body-tertiary">
        <div class="card-body">
          <strong>${emptyTitle}</strong>
          <p class="mb-0">${emptyDescription}</p>
        </div>
      </section>`}
  `;
}

