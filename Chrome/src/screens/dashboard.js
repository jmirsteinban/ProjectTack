import {
  getVisibleChanges,
  getVisibleNotes,
} from "../services/workspace-selectors.js";
import {
  isCompletedStatus,
  priorityClass,
  statusClass,
  translatePriority,
  translateStatus,
} from "../services/ui-copy.js";
import { escapeAttribute, escapeHtml } from "../services/html.js";

function normalizeIdentity(value) {
  return (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .trim()
    .toLowerCase();
}

function buildUserIdentitySet(data) {
  const email = data.user?.email ?? "";
  const emailLocalPart = email.includes("@") ? email.split("@")[0] : email;
  return new Set(
    [
      normalizeIdentity(data.user?.name),
      normalizeIdentity(email),
      normalizeIdentity(emailLocalPart),
    ].filter(Boolean),
  );
}

function isAssignedToCurrentUser(change, userIdentities) {
  return (change.assignees ?? []).some((assignee) =>
    userIdentities.has(normalizeIdentity(assignee)),
  );
}

function getAssignedActiveChanges(data, visibleChanges) {
  const userIdentities = buildUserIdentitySet(data);
  return visibleChanges.filter(
    (change) =>
      !isCompletedStatus(change.status) &&
      isAssignedToCurrentUser(change, userIdentities),
  );
}

function formatCountLabel(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildDashboardMetrics(data, activeAssignedChanges) {
  const metricValues = {
    assigned: activeAssignedChanges.length,
    pending: activeAssignedChanges.filter(
      (change) => change.status === "Pendiente",
    ).length,
    "in-progress": activeAssignedChanges.filter(
      (change) => change.status === "En desarrollo",
    ).length,
    "qa-review": activeAssignedChanges.filter(
      (change) => change.status === "En revision de QA",
    ).length,
    completed: 0,
    "high-priority": activeAssignedChanges.filter(
      (change) => change.priority === "Alta",
    ).length,
  };

  return (data.dashboardMetrics ?? []).map((metric) => ({
    ...metric,
    value: String(metricValues[metric.tone] ?? 0),
  }));
}

function renderDashboardEmptyState(title, description) {
  return `
    <div class="list-group-item py-4 text-secondary">
      <strong>${escapeHtml(title)}</strong>
      <p class="mb-0">${escapeHtml(description)}</p>
    </div>
  `;
}

export function renderDashboardScreen(data) {
  const visibleChanges = getVisibleChanges(data);
  const visibleNotes = getVisibleNotes(data);
  const activeAssignedChanges = getAssignedActiveChanges(data, visibleChanges);
  const openTodoCount = visibleNotes.filter(
    (note) => !isCompletedStatus(note.status),
  ).length;
  const metrics = buildDashboardMetrics(data, activeAssignedChanges)
    .map(
      (metric) => `
    <div class="col-12 col-sm-6 col-xl-3">
      <article class="card h-100 pt-web-card pt-web-metric-card border-0">
        <div class="card-body">
          <p class="text-uppercase small fw-semibold text-secondary mb-2">${escapeHtml(metric.title)}</p>
          <div class="d-flex align-items-end justify-content-between gap-3">
            <h3 class="display-6 mb-0 fw-bold">${escapeHtml(metric.value)}</h3>
            <span class="badge rounded-pill text-bg-light border">${escapeHtml(metric.tone || "summary")}</span>
          </div>
        </div>
      </article>
    </div>
  `,
    )
    .join("");
  const [
    workQueuePanel = {
      title: "Work Queue",
      subtitle: "Prioritize your open changes",
    },
    notesPanel = {
      title: "Latest Notes Mentioning You",
      subtitle: "Follow recent mentions quickly",
    },
  ] = data.dashboardPanels ?? [];
  const workQueueCountLabel = formatCountLabel(
    activeAssignedChanges.length,
    "change",
    "changes",
  );
  const notesCountLabel = formatCountLabel(
    visibleNotes.length,
    "note",
    "notes",
  );

  const openChanges = activeAssignedChanges
    .slice(0, 8)
    .map(
      (item) => `
      <article class="list-group-item list-group-item-action py-3 pt-clickable-card" data-change-id="${escapeAttribute(item.id)}" role="button" tabindex="0">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <div class="min-w-0">
            <h3 class="h6 mb-1">${escapeHtml(item.title)}</h3>
            <p class="mb-0 text-secondary small">${escapeHtml(item.project)}</p>
          </div>
          <div class="d-flex flex-wrap gap-2 justify-content-end">
            <span class="badge rounded-pill pt-pill ${priorityClass(item.priority)}">${escapeHtml(translatePriority(item.priority))}</span>
            <span class="badge rounded-pill pt-pill ${statusClass(item.status)}">${escapeHtml(translateStatus(item.status))}</span>
            <span class="badge rounded-pill bg-light text-dark border">${escapeHtml(item.environment)}</span>
          </div>
        </div>
        <p class="mb-2 small">${escapeHtml(item.description || "No description available.")}</p>
        <span class="badge rounded-pill text-bg-light border">${escapeHtml(item.id)}</span>
      </article>
    `,
    )
    .join("");
  const openChangesMarkup =
    openChanges ||
    renderDashboardEmptyState(
      "No assigned changes",
      "Your active assigned work will appear here for faster follow-up.",
    );

  const mentionedNotes = visibleNotes
    .slice(0, 8)
    .map((note) => {
      const relatedChange = visibleChanges.find(
        (change) => change.id === note.changeId || change.title === note.change,
      );
      const navigationAttr = relatedChange
        ? `data-change-id="${escapeAttribute(relatedChange.id)}"`
        : `data-project-id="${escapeAttribute(data.projects.find((project) => project.id === note.projectId || project.name === note.project)?.id ?? "")}"`;
      const noteMeta = relatedChange
        ? `${relatedChange.id} - ${relatedChange.environment} environment`
        : "Linked note";
      const noteDetail =
        noteMeta === "Linked note"
          ? note.change
          : `${note.change} - ${noteMeta}`;
      const noteEnvironmentPill = relatedChange
        ? `<span class="badge rounded-pill bg-light text-dark border">${escapeHtml(relatedChange.environment)}</span>`
        : "";

      return `
      <article class="list-group-item list-group-item-action py-3 pt-clickable-card" ${navigationAttr} role="button" tabindex="0">
        <div class="d-flex flex-wrap justify-content-between gap-2 mb-2">
          <div class="min-w-0">
            <span class="badge rounded-pill text-bg-light border">${escapeHtml(note.id)}</span>
            <p class="mb-1 mt-2 text-secondary small">${escapeHtml(note.project)}</p>
            <p class="mb-0 fw-semibold">${escapeHtml(note.text)}</p>
          </div>
          <div class="d-flex flex-wrap gap-2 align-content-start">
            <span class="badge rounded-pill pt-pill ${statusClass(note.status)}">${escapeHtml(translateStatus(note.status))}</span>
            ${noteEnvironmentPill}
          </div>
        </div>
        <p class="mb-0 small text-secondary">${escapeHtml(noteDetail)}</p>
      </article>
    `;
    })
    .join("");
  const mentionedNotesMarkup =
    mentionedNotes ||
    renderDashboardEmptyState(
      "No recent mentions",
      "Notes that mention you will appear here so you can pick them up quickly.",
    );

  return `
    <section class="d-grid gap-4 gap-xl-5 min-w-0">
      <section class="card border-0 pt-web-hero">
        <div class="card-body p-4 p-xl-5">
          <div class="row g-4 align-items-center">
            <div class="col-12 col-xl-8">
              <span class="badge rounded-pill bg-light text-dark border mb-3">Home / Dashboard</span>
              <h1 class="display-5 fw-bold mb-3">Hello, ${escapeHtml(data.user?.name || "ProjectTrack User")}</h1>
              <p class="lead mb-0">You have <strong>${escapeHtml(String(openTodoCount))}</strong> open tasks to move forward today.</p>
            </div>
            <div class="col-12 col-xl-4 d-flex justify-content-xl-end">
              <button type="button" class="btn btn-primary pt-hero-button" data-action="go-to-projects">Go to Projects</button>
            </div>
          </div>
        </div>
      </section>

      <section class="row g-3 g-xl-4">${metrics}</section>

      <section class="row g-4">

          <div class="col-12 col-xxl-6">
              <article class="card border-0 shadow-sm h-100">
                  <div class="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex flex-wrap justify-content-between align-items-start gap-2">
                      <div class="pt-dashboard-panel-copy">
                          <h2 class="h4 mb-1">${escapeHtml(workQueuePanel.title)}</h2>
                          <p class="text-secondary mb-0">${escapeHtml(workQueuePanel.subtitle)}</p>
                      </div>
                      <span class="badge rounded-pill text-bg-light border">${escapeHtml(workQueueCountLabel)}</span>
                  </div>

                  <div class="card-body pt-3 px-4 pb-4">
                    <div class="list-group list-group-flush pt-web-list-group">${openChangesMarkup}</div>
                  </div>
              </article>
          </div>

          <div class="col-12 col-xxl-6">
              <article class="card border-0 shadow-sm h-100">
                  <div class="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex flex-wrap justify-content-between align-items-start gap-2">
                      <div class="pt-dashboard-panel-copy">
                          <h2 class="h4 mb-1">${escapeHtml(notesPanel.title)}</h2>
                          <p class="text-secondary mb-0">${escapeHtml(notesPanel.subtitle)}</p>
                      </div>
                      <span class="badge rounded-pill text-bg-light border">${escapeHtml(notesCountLabel)}</span>
                  </div>

                  <div class="card-body pt-3 px-4 pb-4">
                    <div class="list-group list-group-flush pt-web-list-group">${mentionedNotesMarkup}</div>
                  </div>
              </article>
          </div>
          
      </section>

    </section>
  `;
}


