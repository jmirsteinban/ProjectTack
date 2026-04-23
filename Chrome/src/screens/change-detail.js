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
import { renderHeroCard } from "../components/hero-card.js";
import { renderPillDropdown } from "../components/pill-dropdown.js";
import { escapeAttribute, escapeHtml, isHttpUrl } from "../services/html.js";

function urlsByEnvironment(project, environment) {
  if (!project) return {};
  if (environment === "QA") return project.qaUrls ?? {};
  if (environment === "STG") return project.stgUrls ?? {};
  if (environment === "PROD") return project.prodUrls ?? {};
  return {};
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

function renderLinkValue(value) {
  if (!value) {
    return `
      <span class="d-flex min-w-0">
        <span class="text-secondary">Not defined</span>
      </span>
    `;
  }

  const valueMarkup = isHttpUrl(value)
    ? `<a class="link-primary text-break min-w-0" href="${escapeAttribute(value)}" target="_blank" rel="noopener noreferrer" title="${escapeAttribute(value)}">${escapeHtml(value)}</a>`
    : `<span class="text-break min-w-0" title="${escapeAttribute(value)}">${escapeHtml(value)}</span>`;

  return `
    <span class="d-flex align-items-start gap-2 flex-wrap min-w-0">
      ${valueMarkup}
      <button type="button" class="btn btn-outline-secondary btn-sm" data-action="copy-link-value" data-copy-value="${escapeAttribute(encodeCopyValue(value))}" aria-label="Copy link" title="Copy link">Copy</button>
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
    <div class="d-flex flex-wrap gap-2 mt-2">
      ${mentions.map((mention) => `<span class="badge rounded-pill text-bg-light border" title="${escapeAttribute(mention.title)}">${escapeHtml(mention.text)}</span>`).join("")}
    </div>
  `;
}

function noteLinkedTasks(note) {
  if (!(note.linkedTasks ?? []).length) {
    return "";
  }

  return `
    <div class="d-flex flex-wrap gap-2 mt-2">
      ${(note.linkedTasks ?? [])
        .map(
          (task) => `
        <span class="badge rounded-pill text-bg-light border" title="${escapeAttribute(task.documentName || task.label)}">
          ${escapeHtml(task.label)}
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

export function renderChangeDetailScreen(state, data) {
  const visibleChanges = getVisibleChanges(data);
  const visibleProjects = getVisibleProjects(data);
  const change = visibleChanges.find((item) => item.id === state.selectedChangeId);
  if (!change) {
    return `<section class="card bg-body-tertiary"><div class="card-body"><strong>Change unavailable</strong><p class="mb-0">This change is no longer available or was logically deleted.</p></div></section>`;
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
        <div class="list-group-item px-0">
          <div class="d-grid gap-1">
            <span class="small fw-semibold text-secondary">${escapeHtml(label)}</span>
            ${renderLinkValue(value)}
          </div>
        </div>
      `,
              )
              .join("")
          : `<div class="alert alert-info mb-0">No URLs configured for this environment.</div>`;

      return `
      <div class="col-12">
        <article class="${environmentCardSurfaceClasses(environment)}">
          <div class="card-header bg-transparent border-0 pb-0">
            <span class="badge rounded-pill text-bg-light border">${escapeHtml(environment)}</span>
          </div>
          <div class="card-body d-grid gap-2 min-w-0">
            ${Object.entries(urls).length > 0 ? `<div class="list-group list-group-flush">${urlRows}</div>` : urlRows}
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
      <article class="list-group-item">
        <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <span class="small text-secondary">Note #${index + 1}</span>
          <span class="badge rounded-pill ${statusClass(note.status)}">${escapeHtml(translateStatus(note.status))}</span>
        </div>
        <strong>${escapeHtml(note.text)}</strong>
        <p>${escapeHtml(note.project)}</p>
        ${noteMentions(note)}
        ${noteLinkedTasks(note)}
        <div class="d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-secondary btn-sm" data-action="edit-note" data-note-id="${escapeAttribute(note.id)}">Edit</button>
          <button type="button" class="btn btn-secondary btn-sm" data-action="toggle-note-status" data-note-id="${escapeAttribute(note.id)}">${isCompletedStatus(note.status) ? "Reopen" : "Complete"}</button>
          <button type="button" class="btn btn-secondary btn-sm" data-action="delete-note" data-note-id="${escapeAttribute(note.id)}">Delete</button>
        </div>
      </article>
    `,
          )
          .join("")
      : `<section class="card bg-body-tertiary border-0"><div class="card-body d-grid gap-2"><strong>No related notes</strong><p class="mb-0 text-secondary">There are no visible notes related to this change yet.</p></div></section>`;

  const taskRows = !tasksFeatureAvailable
    ? `
        <section class="alert alert-warning" role="status">
          <strong>Tasks require the Supabase migration and permissions.</strong>
          <p>Apply or re-run <code>${escapeHtml(taskFeatureStatus.migrationFile)}</code> so the tables, grants and RLS policies are available for authenticated users.</p>
        </section>
      `
    : tasks.length > 0
      ? tasks
          .map(
            (task, index) => `
      <article class="list-group-item min-w-0">
        <div class="d-grid gap-3 min-w-0">
          <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <span class="small text-secondary">TSKID ${index + 1}</span>
            <span class="badge rounded-pill ${taskStatusClass(task.status)}">${escapeHtml(translateTaskStatus(task.status))}</span>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2 min-w-0">
            ${task.page ? `<span class="badge rounded-pill text-bg-light border">Page ${escapeHtml(task.page)}</span>` : ""}
            ${task.itemNumber ? `<span class="badge rounded-pill text-bg-light border">#${escapeHtml(task.itemNumber)}</span>` : ""}
            ${task.annotationType ? `<span class="badge rounded-pill text-bg-light border">${escapeHtml(task.annotationType)}</span>` : ""}
            ${task.linkedNoteCount > 0 ? `<span class="badge rounded-pill text-bg-light border">${escapeHtml(String(task.linkedNoteCount))} linked ${task.linkedNoteCount === 1 ? "note" : "notes"}</span>` : ""}
          </div>
          <div class="d-grid gap-1 min-w-0">
            ${task.documentName ? `<strong class="d-block">${escapeHtml(task.documentName)}</strong>` : ""}
            <p class="m-0 text-body">${escapeHtml(task.requestText)}</p>
          </div>
          <div class="row g-2 align-items-end">
            <div class="col-12 col-sm-6">
              <label class="form-label" for="task-assignee-${escapeAttribute(task.id)}">Assignee</label>
              <select id="task-assignee-${escapeAttribute(task.id)}" class="form-select" data-action="change-task-assignee" data-task-id="${escapeAttribute(task.id)}"${tasksFeatureAvailable ? "" : " disabled"}>
                <option value="">Unassigned</option>
                ${(data.users ?? [])
                  .map(
                    (user) => `
                  <option value="${escapeAttribute(user.id)}"${user.id === task.assignedToId ? " selected" : ""}>${escapeHtml(user.name || user.email)}</option>
                `,
                  )
                  .join("")}
              </select>
            </div>
            <div class="col-12 col-sm-6">
              <label class="form-label" for="task-status-${escapeAttribute(task.id)}">Status</label>
              <select id="task-status-${escapeAttribute(task.id)}" class="form-select" data-action="change-task-status" data-task-id="${escapeAttribute(task.id)}"${tasksFeatureAvailable ? "" : " disabled"}>
                ${TASK_STATUS_OPTIONS.map(
                  (statusValue) => `
                  <option value="${escapeAttribute(statusValue)}"${statusValue === task.status ? " selected" : ""}>${escapeHtml(translateTaskStatus(statusValue))}</option>
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
      : `<section class="card bg-body-tertiary border-0"><div class="card-body d-grid gap-2"><strong>No tasks imported</strong><p class="mb-0 text-secondary">Import the tracker workbook to register the requested modifications for this change.</p></div></section>`;
  const taskListClass =
    tasks.length > 4
      ? "list-group min-w-0 overflow-auto pe-1"
      : "list-group min-w-0";

  const siblingRows = siblingChanges
    .slice(0, 3)
    .map(
      (item) => `
    <article class="list-group-item list-group-item-action py-3 focus-ring focus-ring-primary" data-change-id="${escapeAttribute(item.id)}" role="button" tabindex="0">
      <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <strong class="min-w-0">${escapeHtml(item.title)}</strong>
        <div class="d-flex gap-2 flex-wrap">
          <span class="badge rounded-pill ${statusClass(item.status)}">${escapeHtml(translateStatus(item.status))}</span>
          <span class="badge rounded-pill ${priorityClass(item.priority)}">${escapeHtml(translatePriority(item.priority))}</span>
        </div>
      </div>
      <p class="mb-0 mt-2 small text-secondary">${escapeHtml(item.description || "No description")}</p>
    </article>
  `,
    )
    .join("");

  const historyRows =
    historyEntries.length > 0
      ? historyEntries
          .map(
            (entry, index) => `
      <article class="list-group-item min-w-0">
        <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <span class="small text-secondary">HSTID ${index + 1}</span>
          <span class="small text-secondary">${escapeHtml(formatHistoryTimestamp(entry.createdAt))}</span>
        </div>
        <p class="mb-0 mt-2">${escapeHtml(entry.text || "A change update was recorded.")}</p>
      </article>
    `,
          )
          .join("")
      : `<section class="card bg-body-tertiary border-0"><div class="card-body d-grid gap-2"><strong>No history yet</strong><p class="mb-0 text-secondary">Status and priority updates will be recorded here automatically.</p></div></section>`;
  const historyListClass =
    historyEntries.length > 4
      ? "list-group overflow-auto pe-1"
      : "list-group";

  return `
    ${renderHeroCard({
      title: change.title,
      description: change.project,
      meta: [`Environment: ${change.environment}`],
      controlsHtml: `
        <article class="card bg-body-tertiary rounded-3 h-100">
          <div class="card-body d-grid gap-3 min-w-0">
            <h2 class="h6 fw-semibold m-0">Environment Path: ${escapeHtml(change.environment)}</h2>
            ${renderEnvironmentProgress(change.environment, visibleEnvironments)}
          </div>
        </article>`,
      actionsHtml: `
        <button type="button" class="btn btn-light" data-action="open-change-project">View Project</button>
        <button type="button" class="btn btn-light" data-action="open-change-editor">Edit Change</button>
        <button type="button" class="btn btn-danger" data-action="delete-change">Delete Change</button>
        <button type="button" class="btn btn-outline-light" data-action="back-to-change-origin">Back</button>`
    })}


    <section class="card bg-body-tertiary rounded-3">
      <div class="card-header">
        <div class="d-flex align-items-center w-100">
          
          <div class="d-flex flex-column">
            <span class="small text-secondary">${escapeHtml(change.id)}</span>
            <h2 class="h5 fw-semibold mb-0">Change Details</h2>
          </div>

          <div class="d-flex gap-2 ms-auto">
            ${renderPillDropdown({
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
              template: state.pillDropdownTemplate,
            })}
            ${renderPillDropdown({
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
              template: state.pillDropdownTemplate,
            })}
          </div>

        </div>
      </div>


      <div class="card-body d-grid gap-3">
        <div class="row g-2">
          <div class="col-12">
            <div class="d-grid gap-2">
              <span class="small fw-semibold text-secondary">Assignees</span>
              <div class="d-flex flex-wrap gap-2">
                ${
                  (change.assignees ?? []).length > 0
                    ? change.assignees
                        .map(
                          (assignee) =>
                            `<span class="badge rounded-pill text-bg-light border">${escapeHtml(assignee)}</span>`,
                        )
                        .join("")
                    : `<span class="text-body-secondary">No assignees</span>`
                }
              </div>
            </div>
          </div>
          <div class="col-12">
            <div class="d-grid gap-2">
              <span class="small fw-semibold text-secondary">Details</span>
              <span class="text-break">${escapeHtml(change.description || "No description")}</span>
            </div>
          </div>
        </div>

        <div class="row g-2">
          <div class="col-12">
            <div class="d-grid gap-1">
              <span class="small fw-semibold text-secondary">Workfront</span>
              ${renderLinkValue(change.workfrontLink || project?.workfrontLink)}
            </div>
          </div>
          <div class="col-12">
            <div class="d-grid gap-1">
              <span class="small fw-semibold text-secondary">OneDrive</span>
              ${renderLinkValue(change.onedriveLink || project?.onedriveLink)}
            </div>
          </div>
        </div>

        <hr class="my-1">

        <div class="d-flex align-items-center w-100 gap-2 min-w-0">
          <h2 class="h5 fw-semibold m-0">Environments</h2>
          <span class="ms-auto text-body-secondary text-end">${escapeHtml(visibleEnvironmentsLabel)}</span>
        </div>
        <div class="row g-3">${environmentCards}</div>

        <hr class="my-1">
      </div>

      <div class="card-body">
        <div class="d-flex align-items-center w-100 gap-2 flex-wrap">
          <div class="d-flex flex-column">
            <h2 class="h5 fw-semibold mb-0">Tasks</h2>
          </div>

          <div class="d-flex gap-2 ms-auto flex-wrap align-items-end">
            <span class="badge rounded-pill text-bg-light border">${taskOpenCount} open</span>
            <span class="badge rounded-pill text-bg-light border">${taskCompletedCount} completed</span>
            ${taskErrorCount > 0 ? `<span class="badge rounded-pill text-bg-light border">${taskErrorCount} error</span>` : ""}
            <button type="button" class="btn btn-secondary d-inline-flex align-items-center gap-2 rounded-pill px-3 py-2 fw-bold" data-action="open-task-import"${tasksFeatureAvailable ? "" : " disabled"}>
              <span class="material-symbols-outlined" aria-hidden="true">upload_file</span>
              <span>Import Tasks from Excel</span>
            </button>
            <button type="button" class="btn btn-outline-secondary d-inline-flex align-items-center gap-2 rounded-pill px-3 py-2 fw-bold" data-action="open-task-replace"${tasksFeatureAvailable ? "" : " disabled"}>
              <span class="material-symbols-outlined" aria-hidden="true">sync_saved_locally</span>
              <span>Replace Tasks</span>
            </button>
            <div class="d-flex flex-column">
              <label class="form-label mb-1" for="task-export-start">From TSKID</label>
              <input id="task-export-start" type="number" min="1" max="${Math.max(tasks.length, 1)}" inputmode="numeric" class="form-control" style="width:112px;min-width:112px;" data-field="task-export-start" value="${escapeAttribute(state.taskExportStart ?? "")}" placeholder="1">
            </div>
            <div class="d-flex flex-column">
              <label class="form-label mb-1" for="task-export-end">To TSKID</label>
              <input id="task-export-end" type="number" min="1" max="${Math.max(tasks.length, 1)}" inputmode="numeric" class="form-control" style="width:112px;min-width:112px;" data-field="task-export-end" value="${escapeAttribute(state.taskExportEnd ?? "")}" placeholder="${tasks.length || 1}">
            </div>
            <button type="button" class="btn btn-outline-secondary d-inline-flex align-items-center gap-2 rounded-pill px-3 py-2 fw-bold" data-action="export-change-tasks"${tasks.length ? "" : " disabled"}>
              <span class="material-symbols-outlined" aria-hidden="true">download</span>
              <span>Export</span>
            </button>
          </div>
        </div>
        <input type="file" class="visually-hidden" data-field="change-task-import-file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
        <div class="${escapeAttribute(taskListClass)}">${taskRows}</div>
      </div>

      <hr class="mx-3 my-0">

      <div class="card-body">
        <div class="d-flex align-items-center w-100">
          <div class="d-flex flex-column">
            <h2 class="h5 fw-semibold mb-0">Notes</h2>
          </div>

          <div class="d-flex gap-2 ms-auto">
            <span class="badge rounded-pill text-bg-light border">${notes.length} notes</span>
            <button type="button" class="btn btn-warning d-inline-flex align-items-center gap-2 rounded-pill px-3 py-2 fw-bold" data-action="open-note-modal">
              <span class="material-symbols-outlined" aria-hidden="true">edit_note</span>
              <span>Create Note</span>
            </button>
          </div>
        </div>
        ${notes.length
          ? `<div class="list-group">${todoRows}</div>`
          : todoRows}
      </div>

      <hr class="mx-3 my-0">

      <div class="card-body">
        <div class="d-flex align-items-center w-100 gap-2 flex-wrap">
          <div class="d-flex flex-column">
            <h2 class="h5 fw-semibold mb-0">History</h2>
          </div>

          <div class="d-flex gap-2 ms-auto flex-wrap">
            <span class="badge rounded-pill text-bg-light border">${historyEntries.length} events</span>
          </div>
        </div>
        <div class="${escapeAttribute(historyListClass)}">${historyRows}</div>
      </div>
      
    </section>

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
      <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
          <h2 class="h5 fw-semibold mb-1">Other Project Changes</h2>
          <p class="text-secondary mb-0">Related to the same project in the current local state.</p>
        </div>
        <span class="badge rounded-pill text-bg-light border">${siblingChanges.length} related</span>
      </div>
      ${siblingRows
        ? `<div class="list-group">${siblingRows}</div>`
        : `<div class="alert alert-info mb-0"><strong>No related changes</strong><p class="mb-0">There are no other visible changes for this project.</p></div>`}
      </div>
    </section>
  `;
}
