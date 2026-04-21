import { PROJECT_CHANGELOG } from "../data/project-changelog.js";
import { renderHeroCard } from "../components/hero-card.js";
import { escapeHtml } from "../services/html.js";

function formatDateLabel(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function sortByDateDesc(left, right) {
  return String(right.date).localeCompare(String(left.date));
}

function sortByTimeDesc(left, right) {
  return String(right.time || "").localeCompare(String(left.time || ""));
}

function renderEntry(entry) {
  const details = Array.isArray(entry.details) && entry.details.length
    ? `
          <ul class="mt-3 mb-0 text-secondary small">
            ${entry.details.map((detail) => `<li>${escapeHtml(detail)}</li>`).join("")}
          </ul>`
    : "";

  return `
    <article class="list-group-item py-3">
      <div class="d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div class="min-w-0">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
            <span class="badge rounded-pill text-bg-light border">${escapeHtml(entry.type || "Change")}</span>
            ${entry.time ? `<span class="small text-secondary">${escapeHtml(entry.time)}</span>` : ""}
          </div>
          <h3 class="h5 mb-2">${escapeHtml(entry.title)}</h3>
          <p class="mb-0 text-secondary">${escapeHtml(entry.description)}</p>
          ${details}
        </div>
      </div>
    </article>
  `;
}

function renderDayGroup(group) {
  const entries = [...(group.entries ?? [])].sort(sortByTimeDesc);

  return `
    <section class="card border-0 bg-white shadow-sm rounded-4">
      <div class="card-header bg-transparent border-0 pb-0">
        <p class="text-uppercase small fw-semibold text-secondary mb-1">${escapeHtml(group.date)}</p>
        <h2 class="h4 mb-0 text-capitalize">${escapeHtml(formatDateLabel(group.date))}</h2>
      </div>
      <div class="card-body">
        <div class="list-group list-group-flush">
          ${entries.map(renderEntry).join("")}
        </div>
      </div>
    </section>
  `;
}

export function renderChangeHistoryScreen() {
  const groups = [...PROJECT_CHANGELOG].sort(sortByDateDesc);
  const totalChanges = groups.reduce((total, group) => total + (group.entries?.length ?? 0), 0);

  return `
    ${renderHeroCard({
      title: "Change History",
      description: "Daily record of improvements, fixes, and technical decisions made in ProjectTrack.",
      meta: [`${totalChanges} changes`, `${groups.length} days`],
      actionsHtml: `<button type="button" class="btn btn-outline-light" data-action="navigate-main" data-view-id="dashboard">Back</button>`
    })}

    <section class="d-grid gap-3 gap-xl-4">
      ${groups.length
        ? groups.map(renderDayGroup).join("")
        : `<div class="alert alert-info mb-0">No changes have been recorded yet.</div>`}
    </section>
  `;
}
