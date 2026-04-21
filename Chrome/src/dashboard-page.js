import { projectTrackMockData } from "./services/mock-data.js";
import { initializeWorkspace } from "./services/workspace-store.js";
import { getVisibleChanges, getVisibleProjects, getVisibleTasks } from "./services/workspace-selectors.js";
import { translatePriority, translateStatus, translateTaskStatus } from "./services/ui-copy.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function statusBadgeClass(status) {
  switch (status) {
    case "Completado":
      return "text-bg-success";
    case "En desarrollo":
      return "text-bg-warning";
    case "En revision de QA":
      return "text-bg-info";
    case "Pendiente":
    default:
      return "text-bg-secondary";
  }
}

function priorityBadgeClass(priority) {
  switch (priority) {
    case "Alta":
      return "text-bg-danger";
    case "Media":
      return "text-bg-warning";
    case "Baja":
    default:
      return "text-bg-success";
  }
}

function taskBadgeClass(status) {
  switch (status) {
    case "Completado":
      return "bg-success-subtle text-success-emphasis border border-success-subtle";
    case "En desarrollo":
      return "bg-warning-subtle text-warning-emphasis border border-warning-subtle";
    case "Error":
      return "bg-danger-subtle text-danger-emphasis border border-danger-subtle";
    case "Pendiente":
    default:
      return "bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle";
  }
}

function buildMetrics(data, changes, tasks) {
  const dashboardMetrics = Array.isArray(data.dashboardMetrics) ? data.dashboardMetrics : [];
  if (dashboardMetrics.length) {
    return dashboardMetrics;
  }

  const openCount = changes.filter((item) => item.status !== "Completado").length;
  const inProgressCount = changes.filter((item) => item.status === "En desarrollo").length;
  const completedCount = changes.filter((item) => item.status === "Completado").length;
  const highPriorityCount = changes.filter((item) => item.priority === "Alta").length;

  return [
    { title: "Open Changes", value: String(openCount), subtitle: "Current queue" },
    { title: "In Progress", value: String(inProgressCount), subtitle: "Active work" },
    { title: "Completed", value: String(completedCount), subtitle: "Closed changes" },
    { title: "Tasks", value: String(tasks.length), subtitle: "Imported tracker items" },
    { title: "High Priority", value: String(highPriorityCount), subtitle: "Require focus" }
  ];
}

function renderMetricCards(metrics) {
  return metrics.map((metric) => `
    <div class="col">
      <article class="card h-100 border-0 bg-white shadow-sm rounded-4">
        <div class="card-body">
          <p class="text-uppercase small fw-semibold text-secondary mb-2">${escapeHtml(metric.title)}</p>
          <div class="d-flex align-items-end justify-content-between gap-3">
            <h3 class="display-6 mb-0 fw-bold">${escapeHtml(metric.value)}</h3>
            <span class="badge rounded-pill text-bg-light border">${escapeHtml(metric.subtitle || "Summary")}</span>
          </div>
        </div>
      </article>
    </div>
  `).join("");
}

function renderWorkQueue(changes) {
  if (!changes.length) {
    return `<div class="list-group-item py-4 text-secondary">No open changes available.</div>`;
  }

  return changes.map((change) => `
    <article class="list-group-item list-group-item-action py-3">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
        <div>
          <h3 class="h6 mb-1">${escapeHtml(change.title)}</h3>
          <p class="mb-0 text-secondary small">${escapeHtml(change.project)}</p>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <span class="badge ${statusBadgeClass(change.status)} rounded-pill">${escapeHtml(translateStatus(change.status))}</span>
          <span class="badge ${priorityBadgeClass(change.priority)} rounded-pill">${escapeHtml(translatePriority(change.priority))}</span>
        </div>
      </div>
      <p class="mb-2 small">${escapeHtml(change.description || "No description available.")}</p>
      <div class="d-flex flex-wrap gap-2 small text-secondary">
        <span><strong>Env:</strong> ${escapeHtml(change.environment || "N/A")}</span>
        <span><strong>Assignees:</strong> ${escapeHtml((change.assignees ?? []).join(", ") || "Unassigned")}</span>
      </div>
    </article>
  `).join("");
}

function renderNotes(notes) {
  if (!notes.length) {
    return `<div class="list-group-item py-4 text-secondary">No mentions available yet.</div>`;
  }

  return notes.map((note) => `
    <article class="list-group-item list-group-item-action py-3">
      <div class="d-flex flex-wrap justify-content-between gap-2 mb-2">
        <span class="badge ${statusBadgeClass(note.status)} rounded-pill">${escapeHtml(translateStatus(note.status))}</span>
        <span class="small text-secondary">${escapeHtml(note.project || "Unknown Project")}</span>
      </div>
      <p class="mb-2 fw-semibold">${escapeHtml(note.text)}</p>
      <div class="small text-secondary">
        <strong>Change:</strong> ${escapeHtml(note.change || "N/A")}
      </div>
    </article>
  `).join("");
}

function renderTasks(tasks) {
  if (!tasks.length) {
    return `
      <tr>
        <td colspan="5" class="text-center text-secondary py-4">No imported tasks available.</td>
      </tr>
    `;
  }

  return tasks.map((task, index) => `
    <tr>
      <td class="fw-semibold">TSKID ${index + 1}</td>
      <td>
        <div class="fw-semibold">${escapeHtml(task.documentName || "Untitled")}</div>
        <div class="small text-secondary">${escapeHtml(task.requestText || "No request text")}</div>
      </td>
      <td>${escapeHtml(task.page || "N/A")}</td>
      <td>${escapeHtml(task.itemNumber || "N/A")}</td>
      <td>
        <span class="badge rounded-pill ${taskBadgeClass(task.status)}">${escapeHtml(translateTaskStatus(task.status))}</span>
      </td>
    </tr>
  `).join("");
}

function renderProjects(projects) {
  if (!projects.length) {
    return `
      <tr>
        <td colspan="4" class="text-center text-secondary py-4">No visible projects available.</td>
      </tr>
    `;
  }

  return projects.map((project) => `
    <tr>
      <td class="fw-semibold">${escapeHtml(project.name)}</td>
      <td>${escapeHtml(translateStatus(project.status) || project.status || "N/A")}</td>
      <td>${escapeHtml(project.startDate || project.createdAt || "N/A")}</td>
      <td>${escapeHtml(String(project.changes ?? 0))}</td>
    </tr>
  `).join("");
}

function renderDashboard(initialized) {
  const root = document.getElementById("app");
  if (!root) {
    return;
  }

  const data = initialized.data ?? {};
  const changes = getVisibleChanges(data);
  const projects = getVisibleProjects(data);
  const tasks = getVisibleTasks(data);
  const notes = (data.mentionedNotes ?? []).filter((item) => !item?.isDeleted);
  const openChanges = changes.filter((item) => item.status !== "Completado").slice(0, 6);
  const recentNotes = notes.slice(0, 5);
  const recentTasks = tasks.slice(0, 8);
  const metrics = buildMetrics(data, changes, tasks);
  const sessionActive = Boolean(initialized.backendSession?.accessToken);
  const workspaceUrl = typeof chrome !== "undefined" && chrome.runtime?.getURL
    ? chrome.runtime.getURL("workspace.html")
    : "workspace.html";
  const projectsUrl = `${workspaceUrl}?view=projects`;
  const profileUrl = `${workspaceUrl}?view=profile`;
  const userName = data.user?.name || "ProjectTrack User";
  const userRole = data.user?.role || "Workspace member";
  const userInitial = String(userName).trim().charAt(0).toUpperCase() || "P";

  root.innerHTML = `
    <div class="min-vh-100 d-flex flex-column">
      <nav class="navbar navbar-expand-lg bg-white border-bottom sticky-top shadow-sm">
        <div class="container-fluid px-4 px-xl-5">
          <span class="navbar-brand d-flex align-items-center gap-3 mb-0">
            <img src="assets/projecttrack-icon.svg" alt="" width="34" height="34">
            <span class="d-grid">
              <strong>ProjectTrack</strong>
              <small class="text-secondary">Bootstrap dashboard</small>
            </span>
          </span>
          <div class="d-flex align-items-center gap-2 ms-auto">
            <a class="btn btn-outline-primary" href="${workspaceUrl}">Open Classic Workspace</a>
            <button type="button" class="btn btn-primary" data-action="refresh-dashboard">Refresh Data</button>
            <div class="dropdown">
              <button
                type="button"
                class="btn btn-outline-secondary dropdown-toggle d-inline-flex align-items-center gap-2"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <span class="d-inline-flex align-items-center justify-content-center rounded-circle text-bg-secondary fw-bold flex-shrink-0" aria-hidden="true" style="width:2rem;height:2rem;">${escapeHtml(userInitial)}</span>
                <span class="d-grid text-start lh-sm d-none d-lg-inline-grid">
                  <span class="fw-semibold small">${escapeHtml(userName)}</span>
                  <span class="text-secondary" style="font-size:0.72rem;">${escapeHtml(userRole)}</span>
                </span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                <li><a class="dropdown-item" href="${projectsUrl}">Projects</a></li>
                <li><a class="dropdown-item" href="${profileUrl}">Profile</a></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <main class="container-fluid px-4 px-xl-5 py-4 py-xl-5">
        ${sessionActive ? "" : `
          <div class="alert alert-warning border border-warning-subtle bg-warning-subtle text-warning-emphasis mb-4">
            Remote session is not active. This dashboard is showing the locked workspace shell. Use
            <a class="alert-link" href="${workspaceUrl}">Classic Workspace</a> to sign in and continue syncing.
          </div>
        `}

        <section class="card border-0 text-white shadow-lg rounded-4 mb-4 mb-xl-5" style="background: var(--pt-gradient-hero);">
          <div class="card-body p-4 p-xl-5">
            <div class="row g-4 align-items-center">
              <div class="col-12 col-xl-8">
                <span class="badge rounded-pill bg-light text-dark border mb-3">P Dashboard</span>
                <h1 class="display-5 fw-bold mb-3">Hello, ${escapeHtml(data.user?.name || "ProjectTrack User")}</h1>
                <p class="lead mb-3">
                  You have <strong>${escapeHtml(String(data.dashboardHero?.openTodoCount ?? openChanges.length))}</strong>
                  open items to move forward today across <strong>${escapeHtml(String(projects.length))}</strong> projects.
                </p>
                <div class="d-flex flex-wrap gap-2">
                  <span class="badge rounded-pill bg-white text-dark border">Projects ${escapeHtml(String(projects.length))}</span>
                  <span class="badge rounded-pill bg-white text-dark border">Changes ${escapeHtml(String(changes.length))}</span>
                  <span class="badge rounded-pill bg-white text-dark border">Tasks ${escapeHtml(String(tasks.length))}</span>
                  <span class="badge rounded-pill bg-white text-dark border">Notes ${escapeHtml(String(notes.length))}</span>
                </div>
              </div>
              <div class="col-12 col-xl-4">
                <div class="card bg-white border-0 shadow-sm">
                  <div class="card-body">
                    <p class="text-uppercase small fw-semibold text-secondary mb-2">Workspace status</p>
                    <h2 class="h4 mb-3">Remote workspace summary</h2>
                    <dl class="row mb-0 gy-2">
                      <dt class="col-6 text-secondary">Session</dt>
                      <dd class="col-6 text-end fw-semibold">${sessionActive ? "Authenticated" : "Locked"}</dd>
                      <dt class="col-6 text-secondary">Projects</dt>
                      <dd class="col-6 text-end fw-semibold">${escapeHtml(String(projects.length))}</dd>
                      <dt class="col-6 text-secondary">Changes</dt>
                      <dd class="col-6 text-end fw-semibold">${escapeHtml(String(changes.length))}</dd>
                      <dt class="col-6 text-secondary">Last sync</dt>
                      <dd class="col-6 text-end fw-semibold">${escapeHtml(formatDate(initialized.backendStatus?.updatedAt || initialized.backendSession?.expiresAt || new Date().toISOString()))}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-6 g-3 g-xl-4 mb-4 mb-xl-5">
          ${renderMetricCards(metrics)}
        </section>

        <section class="row g-4 mb-4 mb-xl-5">
          <div class="col-12 col-xxl-7">
            <article class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div>
                  <h2 class="h4 mb-1">Work Queue</h2>
                  <p class="text-secondary mb-0">Prioritize active changes and track current momentum.</p>
                </div>
                <span class="badge rounded-pill text-bg-light border">${escapeHtml(String(openChanges.length))} open</span>
              </div>
              <div class="card-body pt-3 px-4 pb-4">
                <div class="list-group list-group-flush">
                  ${renderWorkQueue(openChanges)}
                </div>
              </div>
            </article>
          </div>

          <div class="col-12 col-xxl-5">
            <article class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div>
                  <h2 class="h4 mb-1">Latest Notes Mentioning You</h2>
                  <p class="text-secondary mb-0">Recent notes that still need your attention.</p>
                </div>
                <span class="badge rounded-pill text-bg-light border">${escapeHtml(String(recentNotes.length))} notes</span>
              </div>
              <div class="card-body pt-3 px-4 pb-4">
                <div class="list-group list-group-flush">
                  ${renderNotes(recentNotes)}
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="row g-4">
          <div class="col-12 col-xxl-7">
            <article class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div>
                  <h2 class="h4 mb-1">Recent Tasks</h2>
                  <p class="text-secondary mb-0">Tracker items imported from change workbooks.</p>
                </div>
                <span class="badge rounded-pill text-bg-light border">${escapeHtml(String(recentTasks.length))} tasks</span>
              </div>
              <div class="card-body pt-3 px-0 pb-0">
                <div class="table-responsive">
                  <table class="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th class="ps-4">ID</th>
                        <th>Task</th>
                        <th>Page</th>
                        <th>Item</th>
                        <th class="pe-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${renderTasks(recentTasks)}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          </div>

          <div class="col-12 col-xxl-5">
            <article class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div>
                  <h2 class="h4 mb-1">Projects Snapshot</h2>
                  <p class="text-secondary mb-0">Quick overview of the workspace portfolio.</p>
                </div>
                <span class="badge rounded-pill text-bg-light border">${escapeHtml(String(projects.length))} projects</span>
              </div>
              <div class="card-body pt-3 px-0 pb-0">
                <div class="table-responsive">
                  <table class="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th class="ps-4">Project</th>
                        <th>Status</th>
                        <th>Start</th>
                        <th class="pe-4">Changes</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${renderProjects(projects)}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  `;

  root.querySelector("[data-action='refresh-dashboard']")?.addEventListener("click", () => {
    bootstrapDashboardPage();
  });
}

async function bootstrapDashboardPage() {
  const root = document.getElementById("app");
  if (!root) {
    return;
  }

  root.innerHTML = `
      <main class="d-flex align-items-center justify-content-center min-vh-100">
      <div class="text-center">
        <div class="spinner-border text-success mb-3" role="status" aria-hidden="true"></div>
        <p class="mb-0 text-secondary">Loading ProjectTrack dashboard...</p>
      </div>
    </main>
  `;

  try {
    const initialized = await initializeWorkspace(projectTrackMockData);
    renderDashboard(initialized);
  } catch (error) {
    root.innerHTML = `
      <main class="container py-5">
        <div class="alert alert-danger border border-danger-subtle bg-danger-subtle text-danger-emphasis">
          <h1 class="h4 mb-2">ProjectTrack dashboard could not start.</h1>
          <p class="mb-0">${escapeHtml(error?.message || "Unknown startup error.")}</p>
        </div>
      </main>
    `;
  }
}

bootstrapDashboardPage();
