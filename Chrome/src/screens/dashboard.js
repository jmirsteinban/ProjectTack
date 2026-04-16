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
    <div class="pt-empty-state-card pt-dashboard-empty-state">
      <strong>${title}</strong>
      <p>${description}</p>
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
    <article class="card bg-body-tertiary pt-dashboard-metric-card">
      <div class="card-body">
        <p class="card-subtitle">${metric.title}</p>
        <span class="badge rounded-pill pt-dashboard-metric-badge tone-${metric.tone}">${metric.value}</span>
      </div>
    </article>
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
      <article class="card bg-body-tertiary pt-dashboard-list-card pt-clickable-card rounded-3" data-change-id="${item.id}">
          <div class="card-body">

              <div class="row">

                  <div class="col">

                      <p class="pt-dashboard-list-caption text-step--2">${item.project}</p>
                      <p class="text-step-0 text-info-emphasis"><strong>${item.title}</strong></p>
                      <span class="bg-dark-subtle text-step--3 mt-n1">${item.id}</span>
                  </div>
                  <div class="col-2 d-flex justify-content-end align-items-start">
                      <div class="d-flex flex-wrap gap-1 justify-content-end">
                          <span class="pt-pill ${priorityClass(item.priority)}">${translatePriority(item.priority)}</span>
                          <span class="pt-pill ${statusClass(item.status)}">${translateStatus(item.status)}</span>
                          <span class="pt-pill bg-doc-callout-gradient">${item.environment}</span>


                      </div>

                  </div>
              </div>
              <div class="row">
                  <p class="pt-dashboard-list-meta">${item.description || "No description available."}</p>
              </div>
          </div>
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
        ? `data-change-id="${relatedChange.id}"`
        : `data-project-id="${data.projects.find((project) => project.id === note.projectId || project.name === note.project)?.id ?? ""}"`;
      const noteMeta = relatedChange
        ? `${relatedChange.id} - ${relatedChange.environment} environment`
        : "Linked note";
      const noteDetail =
        noteMeta === "Linked note"
          ? note.change
          : `${note.change} - ${noteMeta}`;
      const noteEnvironmentPill = relatedChange
        ? `<span class="pt-pill bg-doc-callout-gradient">${relatedChange.environment}</span>`
        : "";

      return `
      <article class="card bg-body-tertiary pt-dashboard-list-card pt-dashboard-list-card--note pt-clickable-card rounded-3" ${navigationAttr}>
        <div class="card-body">
          <div class="row">
            <div class="col-8">
              <span class="bg-dark-subtle text-step--2">${note.id}</span>
              <p class="pt-dashboard-list-caption text-step--2 mt-2">${note.project}</p>
              <p class="pt-dashboard-list-title text-step-0 text-info-emphasis"><strong>${note.text}</strong></p>
            </div>
            <div class="col-3 text-center">
              <span class="pt-pill ${statusClass(note.status)}">${translateStatus(note.status)}</span>
              ${noteEnvironmentPill}
            </div>
          </div>
          <div class="row">
            <p class="pt-dashboard-list-meta">${noteDetail}</p>
          </div>
        </div>
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
    <section class="pt-dashboard-layout d-grid gap-cus-14 min-w-0">
      <section class="pt-dashboard-hero-card">
        <div class="pt-dashboard-hero-copy">
          <h3>Hello, ${data.user.name}</h3>
          <p>You have ${openTodoCount} open tasks to move forward today.</p>
        </div>
        <button type="button" class="btn pt-dashboard-hero-button pt-hero-button" data-action="go-to-projects">Go to Projects</button>
      </section>

      <section class="pt-dashboard-metric-strip pt-grid-auto-150">${metrics}</section>

      <section class="row g-3">

          <div class="col-6">
              <article class="card bg-body-tertiary rounded-3">
                  <div class="card-header pt-card-header--dark">
                      <div class="pt-dashboard-panel-copy">
                          <h4 class="card-title">${workQueuePanel.title}</h4>
                          <p class="card-text">${workQueuePanel.subtitle}</p>
                      </div>
                      <span class="pt-dashboard-count-chip">${workQueueCountLabel}</span>
                  </div>

                  <div class="card-body pt-dashboard-panel-body bg-light">${openChangesMarkup}</div>
              </article>
          </div>

          <div class="col-6">
              <article class="card bg-body-tertiary rounded-3">
                  <div class="card-header pt-card-header--dark">
                      <div class="pt-dashboard-panel-copy">
                          <h4 class="card-title">${notesPanel.title}</h4>
                          <p class="card-text">${notesPanel.subtitle}</p>
                      </div>
                      <span class="pt-dashboard-count-chip">${notesCountLabel}</span>
                  </div>

                  <div class="card-body pt-dashboard-panel-body bg-light">${mentionedNotesMarkup}</div>
              </article>
          </div>
          
      </section>

    </section>
  `;
}


