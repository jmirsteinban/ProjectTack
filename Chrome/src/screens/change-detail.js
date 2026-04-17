import { renderEnvironmentProgress } from "../components/environment-progress.js";
import {
  CHANGE_PRIORITY_OPTIONS,
  CHANGE_STATUS_OPTIONS,
  TASK_STATUS_OPTIONS,
  isCompletedStatus,
  priorityClass,
  statusClass,
  taskStatusClass,
  translatePriority,
  translateStatus,
  translateTaskStatus,
} from "../services/ui-copy.js";
import {
  getVisibleChanges,
  getVisibleNotesForChange,
  getVisibleProjects,
  getVisibleTasksForChange,
} from "../services/workspace-selectors.js";

function urlsByEnvironment(project, environment) {
  if (!project) return {};
  if (environment === "QA") return project.qaUrls ?? {};
  if (environment === "STG") return project.stgUrls ?? {};
  if (environment === "PROD") return project.prodUrls ?? {};
  return {};
}

function environmentTone(environment) {
  if (environment === "QA") return "status-progress";
  if (environment === "STG") return "priority-medium";
  if (environment === "PROD") return "status-done";
  return "neutral";
}

function environmentCardSurfaceClasses(environment) {
  const classes = [
    "card",
    "bg-body-tertiary",
    "h-100",
    "position-relative",
    "overflow-visible",
  ];
  if (environment === "QA") {
    classes.push("rounded-2", "shadow-none");
  } else {
    classes.push("rounded-3", "shadow-sm");
  }
  return classes.join(" ");
}

function encodeCopyValue(value) {
  return encodeURIComponent(value ?? "");
}

function isOpenableLink(value) {
  return /^https?:\/\//i.test(value ?? "");
}

function renderLinkValue(value) {
  if (!value) {
    return `
      <span class="pt-change-link-content">
        <span class="pt-change-link-value">Not defined</span>
      </span>
    `;
  }

  const valueMarkup = isOpenableLink(value)
    ? `<a class="pt-change-link-value pt-change-link-value--link" href="${value}" target="_blank" rel="noopener noreferrer" title="${value}">${value}</a>`
    : `<span class="pt-change-link-value" title="${value}">${value}</span>`;

  return `
    <span class="pt-change-link-content">
      ${valueMarkup}
      <button type="button" class="pt-copy-icon-button" data-action="copy-link-value" data-copy-value="${encodeCopyValue(value)}" aria-label="Copy link" title="Copy link">
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path d="M9 9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2Zm-6 6V5a2 2 0 0 1 2-2h8v2H5v10z"></path>
        </svg>
      </button>
    </span>
  `;
}

function noteMentions(note) {
  const mentionUsers = Array.isArray(note.mentionUsers)
    ? note.mentionUsers
    : [];
  const mentions = mentionUsers.length
    ? mentionUsers.map((mention) => ({
        text: mention.handle ?? `@${mention.name ?? ""}`,
        title: mention.email
          ? `${mention.name} (${mention.email})`
          : (mention.name ?? ""),
      }))
    : (
        note.mentions ??
        Array.from(new Set(note.text.match(/@[A-Za-z0-9._-]+/g) ?? []))
      ).map((mention) => ({
        text: mention,
        title: mention,
      }));

  if (!mentions.length) {
    return "";
  }
  return `
    <div class="pt-inline-list">
      ${mentions.map((mention) => `<span class="pt-mini-chip" title="${mention.title}">${mention.text}</span>`).join("")}
    </div>
  `;
}

function noteLinkedTasks(note) {
  if (!(note.linkedTasks ?? []).length) {
    return "";
  }

  return `
    <div class="pt-inline-list">
      ${(note.linkedTasks ?? [])
        .map(
          (task) => `
        <span class="pt-mini-chip pt-mini-chip--task" title="${task.documentName || task.label}">
          ${task.label}
        </span>
      `,
        )
        .join("")}
    </div>
  `;
}

function formatHistoryTimestamp(value) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function renderHeaderPillDropdown({
  menuKey,
  state,
  title,
  currentValue,
  toggleAction,
  itemAction,
  dataAttribute,
  options,
  toneClass,
  translate,
}) {
  const isOpen = state.changeHeaderMenu === menuKey;
  const items = options
    .filter((value) => value !== currentValue)
    .map(
      (value) => `
      <button type="button" class="dropdown-item pt-change-pill-option" data-action="${itemAction}" data-${dataAttribute}="${value}">
        <span class="pt-pill pt-pill--md ${toneClass(value)}">${translate(value)}</span>
      </button>
    `,
    )
    .join("");

  return `
    <div class="dropdown">
      <button type="button" class="pt-pill-dropdown-toggle" data-action="${toggleAction}" aria-expanded="${isOpen ? "true" : "false"}" aria-haspopup="true" title="${title}">
        <span class="pt-pill pt-pill--md ${toneClass(currentValue)}">
          ${translate(currentValue)}
          <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
            <path d="M4.47 6.97a.75.75 0 0 1 1.06 0L8 9.44l2.47-2.47a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 0-1.06Z"></path>
          </svg>
        </span>
      </button>
      ${isOpen ? `<div class="dropdown-menu dropdown-menu-end show pt-change-pill-menu">${items}</div>` : ""}
    </div>
  `;
}

export function renderChangeDetailScreen(state, data) {
  const visibleChanges = getVisibleChanges(data);
  const visibleProjects = getVisibleProjects(data);
  const change =
    visibleChanges.find((item) => item.id === state.selectedChangeId) ??
    visibleChanges[0];
  if (!change) {
    return `<section class="pt-empty-state-card"><strong>Change unavailable</strong><p>This change is no longer available or was logically deleted.</p></section>`;
  }
  const project = visibleProjects.find((item) => item.name === change.project);
  const notes = getVisibleNotesForChange(data, change);
  const tasks = getVisibleTasksForChange(data, change);
  const taskFeatureStatus = data.taskFeatureStatus ?? {
    available: true,
    missingRelations: [],
    migrationFile: "sql/change_tasks_excel_import_20260331.sql",
  };
  const tasksFeatureAvailable = taskFeatureStatus.available !== false;
  const siblingChanges = visibleChanges.filter(
    (item) => item.project === change.project && item.id !== change.id,
  );
  const visibleEnvironments = change.visibleEnvironments ?? [
    "QA",
    "STG",
    "PROD",
  ];
  const visibleEnvironmentsLabel = visibleEnvironments.join(", ");
  const historyEntries = (data.changeHistory ?? []).filter(
    (item) => item.changeId === change.id,
  );
  const taskOpenCount = tasks.filter(
    (task) => !["Completado", "Error"].includes(task.status),
  ).length;
  const taskCompletedCount = tasks.filter(
    (task) => task.status === "Completado",
  ).length;
  const taskErrorCount = tasks.filter((task) => task.status === "Error").length;

  const environmentCards = visibleEnvironments
    .map((environment) => {
      const urls = urlsByEnvironment(project, environment);
      const urlRows =
        Object.entries(urls).length > 0
          ? Object.entries(urls)
              .map(
                ([label, value]) => `
        <div class="pt-change-link-row">
          <span class="pt-change-link-label">${label}:</span>
          ${renderLinkValue(value)}
        </div>
      `,
              )
              .join("")
          : `<p>No URLs configured for this environment.</p>`;

      return `
      <div class="col-12">
        <article class="${environmentCardSurfaceClasses(environment)}">
          <div class="position-absolute top-0 start-0 translate-middle-y ms-3 px-1 bg-body-tertiary">
            <span class="pt-pill pt-pill--md ${environmentTone(environment)}">${environment}</span>
          </div>
          <div class="card-body d-grid gap-2 min-w-0">
            <div class="pt-change-environment-links">${urlRows}</div>
          </div>
        </article>
      </div>
    `;
    })
    .join("");

  const todoRows =
    notes.length > 0
      ? notes
          .map(
            (note, index) => `
      <article class="list-group-item pt-change-note-card">
        <div class="pt-row-top">
          <span class="pt-row-subtle">Note #${index + 1}</span>
          <span class="pt-pill ${statusClass(note.status)}">${translateStatus(note.status)}</span>
        </div>
        <strong>${note.text}</strong>
        <p>${note.project}</p>
        ${noteMentions(note)}
        ${noteLinkedTasks(note)}
        <div class="pt-project-editor-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-action="edit-note" data-note-id="${note.id}">Edit</button>
          <button type="button" class="btn btn-secondary btn-sm" data-action="toggle-note-status" data-note-id="${note.id}">${isCompletedStatus(note.status) ? "Reopen" : "Complete"}</button>
          <button type="button" class="btn btn-secondary btn-sm" data-action="delete-note" data-note-id="${note.id}">Delete</button>
        </div>
      </article>
    `,
          )
          .join("")
      : `<div class="pt-empty-state-card"><strong>No related notes</strong><p>There are no visible notes related to this change yet.</p></div>`;

  const taskRows = !tasksFeatureAvailable
    ? `
        <section class="alert alert-warning pt-change-task-warning" role="status">
          <strong>Tasks require the Supabase migration and permissions.</strong>
          <p>Apply or re-run <code>${taskFeatureStatus.migrationFile}</code> so the tables, grants and RLS policies are available for authenticated users.</p>
        </section>
      `
    : tasks.length > 0
      ? tasks
          .map(
            (task, index) => `
      <article class="list-group-item pt-change-task-card">
        <div class="d-grid gap-3 min-w-0">
          <div class="pt-row-top gap-2">
            <span class="pt-row-subtle">TSKID ${index + 1}</span>
            <span class="pt-pill ${taskStatusClass(task.status)}">${translateTaskStatus(task.status)}</span>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2 min-w-0 pt-change-task-meta">
            ${task.page ? `<span class="pt-mini-chip">Page ${task.page}</span>` : ""}
            ${task.itemNumber ? `<span class="pt-mini-chip">#${task.itemNumber}</span>` : ""}
            ${task.annotationType ? `<span class="pt-mini-chip pt-mini-chip--task">${task.annotationType}</span>` : ""}
            ${task.linkedNoteCount > 0 ? `<span class="pt-mini-chip pt-mini-chip--task">${task.linkedNoteCount} linked ${task.linkedNoteCount === 1 ? "note" : "notes"}</span>` : ""}
          </div>
          <div class="d-grid gap-1 min-w-0">
            ${task.documentName ? `<strong class="pt-change-task-title">${task.documentName}</strong>` : ""}
            <p class="pt-change-task-request m-0">${task.requestText}</p>
          </div>
          <div class="row g-2 pt-change-task-controls">
            <div class="col-12 col-sm-6">
              <label class="form-label" for="task-assignee-${task.id}">Assignee</label>
              <select id="task-assignee-${task.id}" class="form-select" data-action="change-task-assignee" data-task-id="${task.id}"${tasksFeatureAvailable ? "" : " disabled"}>
                <option value="">Unassigned</option>
                ${(data.users ?? [])
                  .map(
                    (user) => `
                  <option value="${user.id}"${user.id === task.assignedToId ? " selected" : ""}>${user.name || user.email}</option>
                `,
                  )
                  .join("")}
              </select>
            </div>
            <div class="col-12 col-sm-6">
              <label class="form-label" for="task-status-${task.id}">Status</label>
              <select id="task-status-${task.id}" class="form-select" data-action="change-task-status" data-task-id="${task.id}"${tasksFeatureAvailable ? "" : " disabled"}>
                ${TASK_STATUS_OPTIONS.map(
                  (statusValue) => `
                  <option value="${statusValue}"${statusValue === task.status ? " selected" : ""}>${translateTaskStatus(statusValue)}</option>
                `,
                ).join("")}
              </select>
            </div>
          </div>
        </div>
      </article>
    `,
          )
          .join("")
      : `<div class="pt-empty-state-card"><strong>No tasks imported</strong><p>Import the tracker workbook to register the requested modifications for this change.</p></div>`;
  const taskListClass =
    tasks.length > 4
      ? "list-group pt-change-task-list pt-change-task-list--scroll"
      : "list-group pt-change-task-list";

  const siblingRows = siblingChanges
    .slice(0, 3)
    .map(
      (item) => `
    <article class="list-group-item list-group-item-action pt-project-list-group-item pt-clickable-card" data-change-id="${item.id}">
      <div class="pt-row-top">
        <strong>${item.title}</strong>
        <div class="pt-dashboard-pill-stack">
          <span class="pt-pill ${statusClass(item.status)}">${translateStatus(item.status)}</span>
          <span class="pt-pill ${priorityClass(item.priority)}">${translatePriority(item.priority)}</span>
        </div>
      </div>
      <p>${item.description || "No description"}</p>
    </article>
  `,
    )
    .join("");

  const historyRows =
    historyEntries.length > 0
      ? historyEntries
          .map(
            (entry, index) => `
      <article class="list-group-item pt-change-history-item">
        <div class="pt-row-top">
          <span class="pt-row-subtle">HSTID ${index + 1}</span>
          <span>${formatHistoryTimestamp(entry.createdAt)}</span>
        </div>
        <p>${entry.text || "A change update was recorded."}</p>
      </article>
    `,
          )
          .join("")
      : `<div class="pt-empty-state-card"><strong>No history yet</strong><p>Status and priority updates will be recorded here automatically.</p></div>`;
  const historyListClass =
    historyEntries.length > 4
      ? "list-group pt-change-history-list pt-change-history-list--scroll"
      : "list-group pt-change-history-list";

  return `
    <section class="pt-screen-hero">
        <div class="row g-3 align-items-center">
            <div class="col-12 col-sm-7">
                <div class="d-grid gap-2 min-w-0">
                    <div class="pt-change-detail-topline">
                        <span>${change.project}</span>
                    </div>
                    <div class="pt-change-detail-copy">
                        <h3>${change.title}</h3>
                    </div>
                </div>
            </div>
            <div class="col-12 col-sm-5">
                <article class="card bg-body-tertiary rounded-3 h-100">
                    <div class="card-body d-grid gap-3 min-w-0">
                        <h5 class="pt-section-title m-0">Environment Path: ${change.environment}</h5>
                        ${renderEnvironmentProgress(change.environment, visibleEnvironments)}
                    </div>
                </article>
            </div>
        </div>

        <div class="row g-2">
            <div class="col d-flex justify-content-end gap-2 flex-wrap">
                <button type="button" class="btn btn-secondary pt-editor-secondary-button pt-hero-button" data-action="open-change-project">
                    View Project
                </button>

                <button type="button" class="btn btn-primary pt-change-create-button pt-hero-button" data-action="open-change-editor">
                    Edit Change
                </button>

                <button type="button" class="btn btn-danger pt-danger-button pt-hero-button" data-action="delete-change">
                    Delete Change
                </button>

                <button type="button" class="btn btn-outline-primary pt-back-button pt-back-button--hero pt-hero-button" data-action="back-to-change-origin">
                    Back
                </button>
            </div>
        </div>
    </section>


    <section class="card bg-body-tertiary rounded-3">
      <div class="card-header">
        <div class="d-flex align-items-center w-100">
          
          <div class="d-flex flex-column">
            <span class="text-step--2">${change.id}</span>
            <h3 class="pt-section-title mb-0">Change Details</h3>
          </div>

          <div class="d-flex gap-2 ms-auto">
            ${renderHeaderPillDropdown({
              menuKey: "status",
              state,
              title: "Change status",
              currentValue: change.status,
              toggleAction: "toggle-change-status-menu",
              itemAction: "set-change-status",
              dataAttribute: "status-value",
              options: CHANGE_STATUS_OPTIONS,
              toneClass: statusClass,
              translate: translateStatus,
            })}
            ${renderHeaderPillDropdown({
              menuKey: "priority",
              state,
              title: "Change priority",
              currentValue: change.priority,
              toggleAction: "toggle-change-priority-menu",
              itemAction: "set-change-priority",
              dataAttribute: "priority-value",
              options: CHANGE_PRIORITY_OPTIONS,
              toneClass: priorityClass,
              translate: translatePriority,
            })}
          </div>

        </div>
      </div>


      <div class="card-body d-grid gap-3">
        <div class="row g-2">
          <div class="col-12">
            <div class="pt-change-summary-row">
              <span class="pt-change-summary-label">Assignees:</span>
              <div class="pt-inline-list">
                ${
                  (change.assignees ?? []).length > 0
                    ? change.assignees
                        .map(
                          (assignee) =>
                            `<span class="pt-mini-chip">${assignee}</span>`,
                        )
                        .join("")
                    : `<span class="text-body-secondary">No assignees</span>`
                }
              </div>
            </div>
          </div>
          <div class="col-12">
            <div class="pt-change-summary-row">
              <span class="pt-change-summary-label">Details:</span>
              <span class="pt-change-summary-value">${change.description || "No description"}</span>
            </div>
          </div>
        </div>

        <div class="row g-2">
          <div class="col-12">
            <div class="pt-change-link-row">
              <span class="pt-change-link-label">Workfront:</span>
              ${renderLinkValue(change.workfrontLink || project?.workfrontLink)}
            </div>
          </div>
          <div class="col-12">
            <div class="pt-change-link-row">
              <span class="pt-change-link-label">OneDrive:</span>
              ${renderLinkValue(change.onedriveLink || project?.onedriveLink)}
            </div>
          </div>
        </div>

        <div class="pt-section-separator"></div>

        <div class="d-flex align-items-center w-100 gap-2 min-w-0">
          <h3 class="pt-section-title m-0">Environments</h3>
          <span class="ms-auto text-body-secondary text-end">${visibleEnvironmentsLabel}</span>
        </div>
        <div class="row g-3">${environmentCards}</div>

        <div class="pt-section-separator"></div>
      </div>

      <div class="card-body">
        <div class="d-flex align-items-center w-100 gap-2 flex-wrap">
          <div class="d-flex flex-column">
            <h3 class="pt-section-title">Tasks</h3>
          </div>

          <div class="d-flex gap-2 ms-auto flex-wrap align-items-end pt-range-export-controls">
            <span class="pt-dashboard-count-chip">${taskOpenCount} open</span>
            <span class="pt-dashboard-count-chip">${taskCompletedCount} completed</span>
            ${taskErrorCount > 0 ? `<span class="pt-dashboard-count-chip">${taskErrorCount} error</span>` : ""}
            <button type="button" class="btn btn-secondary pt-change-task-import-button" data-action="open-task-import"${tasksFeatureAvailable ? "" : " disabled"}>
              <span class="material-symbols-outlined pt-ms-wght-700 pt-ms-opsz-20" aria-hidden="true">upload_file</span>
              <span>Import Tasks from Excel</span>
            </button>
            <button type="button" class="btn btn-outline-secondary pt-change-task-import-button" data-action="open-task-replace"${tasksFeatureAvailable ? "" : " disabled"}>
              <span class="material-symbols-outlined pt-ms-wght-700 pt-ms-opsz-20" aria-hidden="true">sync_saved_locally</span>
              <span>Replace Tasks</span>
            </button>
            <div class="d-flex flex-column">
              <label class="form-label mb-1" for="task-export-start">From TSKID</label>
              <input id="task-export-start" type="number" min="1" max="${Math.max(tasks.length, 1)}" inputmode="numeric" class="form-control pt-range-export-field" data-field="task-export-start" value="${state.taskExportStart ?? ""}" placeholder="1">
            </div>
            <div class="d-flex flex-column">
              <label class="form-label mb-1" for="task-export-end">To TSKID</label>
              <input id="task-export-end" type="number" min="1" max="${Math.max(tasks.length, 1)}" inputmode="numeric" class="form-control pt-range-export-field" data-field="task-export-end" value="${state.taskExportEnd ?? ""}" placeholder="${tasks.length || 1}">
            </div>
            <button type="button" class="btn btn-outline-secondary pt-change-task-import-button" data-action="export-change-tasks"${tasks.length ? "" : " disabled"}>
              <span class="material-symbols-outlined pt-ms-wght-700 pt-ms-opsz-20" aria-hidden="true">download</span>
              <span>Export</span>
            </button>
          </div>
        </div>
        <input type="file" class="visually-hidden" data-field="change-task-import-file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
        <div class="${taskListClass}">${taskRows}</div>
      </div>

      <div class="pt-section-separator mx-3"></div>

      <div class="card-body">
        <div class="d-flex align-items-center w-100">
          <div class="d-flex flex-column">
            <h3 class="pt-section-title">Notes</h3>
          </div>

          <div class="d-flex gap-2 ms-auto">
            <span class="pt-dashboard-count-chip">${notes.length} notes</span>
            <button type="button" class="btn bg-warning-subtle text-warning-emphasis border border-warning-subtle pt-change-note-create-button" data-action="open-note-modal">
              <span class="material-symbols-outlined pt-ms-wght-700 pt-ms-opsz-20" aria-hidden="true">edit_note</span>
              <span>Create Note</span>
            </button>
          </div>
        </div>
        ${notes.length
          ? `<div class="list-group">${todoRows}</div>`
          : todoRows}
      </div>

      <div class="pt-section-separator mx-3"></div>

      <div class="card-body">
        <div class="d-flex align-items-center w-100 gap-2 flex-wrap">
          <div class="d-flex flex-column">
            <h3 class="pt-section-title">History</h3>
          </div>

          <div class="d-flex gap-2 ms-auto flex-wrap">
            <span class="pt-dashboard-count-chip">${historyEntries.length} events</span>
          </div>
        </div>
        <div class="${historyListClass}">${historyRows}</div>
      </div>
      
    </section>

    <section class="pt-screen-card">
      <div class="pt-row-top">
        <div>
          <h3 class="pt-section-title">Other Project Changes</h3>
          <p>Related to the same project in the current local state.</p>
        </div>
        <span class="pt-dashboard-count-chip">${siblingChanges.length} related</span>
      </div>
      ${siblingRows
        ? `<div class="list-group">${siblingRows}</div>`
        : `<div class="pt-empty-state-card"><strong>No related changes</strong><p>There are no other visible changes for this project.</p></div>`}
    </section>
  `;
}
