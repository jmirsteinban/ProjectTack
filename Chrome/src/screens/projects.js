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
        <div class="list-group">
          ${projectChanges
            .map(
              (change) => `
        <article class="list-group-item list-group-item-action pt-project-list-group-item pt-clickable-card" data-change-id="${change.id}">
          <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <strong>${change.title}</strong>
            <div class="d-flex gap-2 flex-wrap">
              <span class="pt-pill ${statusClass(change.status)}">${translateStatus(change.status)}</span>
              <span class="pt-pill ${priorityClass(change.priority)}">${translatePriority(change.priority)}</span>
            </div>
          </div>
          <p class="pt-project-list-group-caption">${change.description || "No description"}</p>
        </article>
      `,
            )
            .join("")}
        </div>
      `
          : `<p class="pt-project-empty">No recent changes</p>`;

      return `
      <article class="card bg-body-tertiary rounded-3 pt-project-card" data-project-id="${project.id}">
        <div class="card-header d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <strong class="pt-project-title">${project.name}</strong>
          <div class="pt-project-date-row">
            <span>Created:</span>
            <span class="pt-project-date-badge">${project.startDate}</span>
          </div>
        </div>
        <div class="card-body pt-card-body--project">
          <p class="pt-card-text">${project.description}</p>
          <div class="pt-project-fieldset">
            <span class="pt-project-fieldset-label">CHANGES</span>
            <div class="pt-project-fieldset-body">${changeRows}</div>
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  return `
    <section class="pt-screen-hero">
      <div class="row g-3">
        <div class="col-12">
          <h1 class="pt-screen-hero-title">Projects</h1>
          <p class="mb-0">Centralize workspace tracking and jump quickly into each project's recent changes.</p>
        </div>
        <div class="col-12 col-lg">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="pt-project-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path
                  d="M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
              </svg>
            </span>
            <input class="form-control" type="text" value="${state.projectSearchQuery}" placeholder="Search projects..." data-input="project-search">
            <button type="button" class="btn btn-secondary pt-project-filter-button" data-action="cycle-project-filter">${state.projectActivityFilter}</button>
          </div>
        </div>
        <div class="col-12 col-lg-auto d-flex justify-content-lg-end align-items-start gap-2 flex-wrap">
          <button type="button" class="btn btn-outline-primary pt-back-button pt-back-button--hero pt-hero-button" data-action="navigate-main" data-view-id="dashboard">Back</button>
          <button type="button" class="btn btn-primary pt-change-create-button pt-hero-button" data-action="open-project-create">New Project</button>
        </div>
      </div>
    </section>

    ${
      rows ||
      `<section class="card bg-body-tertiary">
        <div class="card-body">
          <strong>${emptyTitle}</strong>
          <p class="mb-0">${emptyDescription}</p>
        </div>
      </section>`
    }
  `;
}

