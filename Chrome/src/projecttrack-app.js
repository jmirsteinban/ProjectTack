import { createProjectTrackState } from "./projecttrack-state.js";
import { renderProjectTrackView } from "./projecttrack-router.js";
import { projectTrackMockData } from "./services/mock-data.js";
import {
  clearBackendAuthState,
  clearBackendConfig,
  clearBackendSession,
  clearSavedBackendCredentials,
  fetchRemoteUsersDirectory,
  isBackendAuthError,
  loadBackendStatus,
  markBackendManualLogout,
  saveBackendConfig,
  signInWithPassword
} from "./services/backend.js";
import {
  getLastWorkspaceMutationMeta,
  getLastWorkspaceSyncMeta,
  importChangeTasks,
  initializeWorkspace,
  replaceChangeTasks,
  saveChange,
  saveNote,
  saveProfileName,
  saveProject,
  softDeleteChange,
  softDeleteNote,
  softDeleteProject,
  toggleNoteStatus,
  updateChangeTask
} from "./services/workspace-store.js";
import { pickNativeDirectoryPath } from "./services/native-host.js";
import { parseTrackerWorkbook } from "./services/xlsx-import.js";
import {
  checkChromeReleaseUpdate,
  getReleaseChannelSummary,
  getInstalledExtensionVersion,
  openChromeReleaseDownload
} from "./services/release-updates.js";
import {
  PROJECT_ACTIVITY_FILTERS,
  translateTaskStatus,
  translatePriority,
  translateStatus
} from "./services/ui-copy.js";
import { getVisibleProjects, getVisibleTasksForChange } from "./services/workspace-selectors.js";
import { renderProjectTrackBrand } from "./components/projecttrack-brand.js";
import { renderUserMenu } from "./components/user-menu.js";
import { escapeAttribute, escapeHtml } from "./services/html.js";
import { bindThemeManagerControls, setThemeManagerNavTemplate } from "./screens/theme-manager.js";


function setAuthSubmissionState(state, isSubmitting, pendingStep = "") {
  state.authIsSubmitting = isSubmitting;
  state.authPendingStep = isSubmitting ? pendingStep : "";
}

function startPerformanceMeasure(label) {
  const startedAt = typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
  console.info(`[ProjectTrack] ${label} iniciado`);
  return () => {
    const endedAt = typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
    console.info(`[ProjectTrack] ${label} completado en ${(endedAt - startedAt).toFixed(1)} ms`);
  };
}

async function measureAsync(label, operation) {
  const finish = startPerformanceMeasure(label);
  try {
    return await operation();
  } finally {
    finish();
  }
}

async function loadGlobalNavbarTemplate() {
  try {
    const templateUrl = new URL("../components/global-navbar.html", import.meta.url);
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Template request failed with ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.warn("[ProjectTrack] Could not load global navbar template.", error);
    return "";
  }
}

async function loadUserMenuTemplate() {
  try {
    const templateUrl = new URL("../components/user-menu.html", import.meta.url);
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Template request failed with ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.warn("[ProjectTrack] Could not load user menu template.", error);
    return "";
  }
}

async function loadPillDropdownTemplate() {
  try {
    const templateUrl = new URL("../components/pill-dropdown.html", import.meta.url);
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Template request failed with ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.warn("[ProjectTrack] Could not load pill dropdown template.", error);
    return "";
  }
}

async function loadSectionNavTemplate() {
  try {
    const templateUrl = new URL("../components/section-nav.html", import.meta.url);
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Template request failed with ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.warn("[ProjectTrack] Could not load section nav template.", error);
    return "";
  }
}

function navigateMain(state, viewId) {
  pushViewHistory(state);
  state.currentView = viewId;
  state.selectedProjectId = null;
  state.selectedChangeId = null;
  state.projectEditorMode = "edit";
  state.changeEditorMode = "edit";
  closeChangeHeaderMenu(state);
  state.projectFormError = "";
  state.changeFormError = "";
  clearNoteComposerState(state);
  state.backendConfigMessage = "";
  state.authMessage = "";
}

function syncWorkspaceUrl(state) {
  if (typeof window === "undefined" || !window.history?.replaceState) {
    return;
  }

  const params = new URLSearchParams();
  params.set("view", state.currentView || "dashboard");

  if (state.selectedProjectId && ["project-detail", "project-editor"].includes(state.currentView)) {
    params.set("projectId", state.selectedProjectId);
  }

  if (state.selectedChangeId && ["change-detail", "change-editor"].includes(state.currentView)) {
    params.set("changeId", state.selectedChangeId);
  }

  if (state.currentView === "project-editor") {
    params.set("mode", state.projectEditorMode || "edit");
  }

  if (state.currentView === "change-editor") {
    params.set("mode", state.changeEditorMode || "edit");
  }

  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState({}, "", nextUrl);
  }
}

function hasAuthenticatedSession(state) {
  return Boolean(state.backendSession?.accessToken);
}

function syncInitializedState(state, initialized) {
  state.data = initialized.data;
  state.backendConfig = initialized.backendConfig;
  state.backendStatus = initialized.backendStatus;
  state.backendSession = initialized.backendSession;
  state.savedCredentials = initialized.savedCredentials ?? state.savedCredentials;
  state.authState = initialized.authState ?? state.authState;
}

function createIdleReleaseUpdateState() {
  const releaseChannel = getReleaseChannelSummary();
  return {
    status: "idle",
    currentVersion: getInstalledExtensionVersion(),
    latestVersion: "",
    releaseId: "",
    releaseName: "",
    releaseUrl: releaseChannel.releasesPageUrl,
    downloadUrl: releaseChannel.releasesPageUrl,
    assetName: releaseChannel.zipAssetName,
    publishedAt: "",
    checkedAt: "",
    message: "Update check has not run yet."
  };
}

function clearChangeEditorState(state) {
  state.changeFormError = "";
  state.changeFieldErrors = {};
  state.changeEditorDraft = null;
}

function clearNoteComposerState(state) {
  state.noteFormError = "";
  state.noteDraftText = "";
  state.noteLinkedTaskIds = [];
  state.noteModalOpen = false;
  state.editingNoteId = null;
}

function closeChangeHeaderMenu(state) {
  state.changeHeaderMenu = null;
}

function resolveSelectedChange(state) {
  return (state.data?.changes ?? []).find((item) => item.id === state.selectedChangeId) ?? null;
}

function resolveSelectedChangeProject(state) {
  const change = resolveSelectedChange(state);
  if (!change) {
    return null;
  }

  return (state.data?.projects ?? []).find((item) => item.name === change.project) ?? null;
}

function resolveSelectedProject(state) {
  return (state.data?.projects ?? []).find((item) => item.id === state.selectedProjectId) ?? null;
}

function buildWorkspaceBreadcrumbLabel(state) {
  const selectedProject = resolveSelectedProject(state);
  const selectedChange = resolveSelectedChange(state);
  const selectedChangeProject = resolveSelectedChangeProject(state);
  const projectLabel = selectedProject?.name || selectedChangeProject?.name || selectedChange?.project || "Project";
  const changeLabel = selectedChange?.title || "Change";

  switch (state.currentView) {
    case "dashboard":
      return "Workspace / Dashboard";
    case "projects":
      return "Workspace / Projects";
    case "project-detail":
      return `Workspace / Projects / Details / ${projectLabel}`;
    case "project-editor":
      return state.projectEditorMode === "create"
        ? "Workspace / Projects / New"
        : `Workspace / Projects / Details / ${projectLabel} / Edit`;
    case "changes":
      return selectedProject
        ? `Workspace / Projects / Details / ${selectedProject.name} / Changes`
        : "Workspace / Changes";
    case "change-detail":
      return `Workspace / Projects / Details / ${projectLabel} / Changes / Details / ${changeLabel}`;
    case "change-editor":
      return state.changeEditorMode === "create"
        ? `Workspace / Projects / Details / ${projectLabel} / Changes / New`
        : `Workspace / Projects / Details / ${projectLabel} / Changes / Details / ${changeLabel} / Edit`;
    case "change-history":
      return "Workspace / Change History";
    case "theme-manager":
      return "Workspace / Theme Manager";
    case "login":
      return "Workspace / Login";
    case "profile":
      return "Workspace / Profile";
    default:
      return "Workspace";
  }
}

function resolveSelectedChangeTasks(state) {
  const change = resolveSelectedChange(state);
  if (!change) {
    return [];
  }

  return getVisibleTasksForChange(state.data, change);
}

function parsePositiveInteger(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function slugifyFilenamePart(value, fallback = "export") {
  const normalized = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized || fallback;
}

function buildChangeTaskExportContent(change, entries, startIndex) {
  const header = [
    `Project: ${change?.project ?? "Unknown Project"}`,
    `Change: ${change?.title ?? "Unknown Change"}`,
    `Exported: ${new Date().toISOString()}`,
    "",
  ];

  const body = entries.flatMap((entry, index) => [
    `TSKID ${startIndex + index}`,
    `Status: ${translateTaskStatus(entry.status) || entry.status || "Pending"}`,
    `Assignee: ${entry.assignedToName || "Unassigned"}`,
    `Page: ${entry.page || "N/A"}`,
    `Item: ${entry.itemNumber || "N/A"}`,
    `Document: ${entry.documentName || "N/A"}`,
    `Annotation: ${entry.annotationType || "N/A"}`,
    `Request: ${entry.requestText || "No request text"}`,
    "",
  ]);

  return [...header, ...body].join("\n");
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function buildSelectedChangePayload(state, overrides = {}) {
  const change = resolveSelectedChange(state);
  const project = resolveSelectedChangeProject(state);
  if (!change || !project?.id) {
    return null;
  }

  return {
    title: change.title,
    description: change.description ?? "",
    projectId: project.id,
    project: project.name,
    status: change.status ?? "Pendiente",
    priority: change.priority ?? "Media",
    environment: change.environment ?? "QA",
    assignees: [...(change.assignees ?? [])],
    workfrontLink: change.workfrontLink || "",
    onedriveLink: change.onedriveLink || "",
    visibleEnvironments: [...(change.visibleEnvironments ?? ["QA"])]
  };
}

function forceLoginScreen(state, message = "") {
  setAuthSubmissionState(state, false);
  state.currentView = "login";
  state.selectedProjectId = null;
  state.selectedChangeId = null;
  state.projectFormError = "";
  clearChangeEditorState(state);
  closeChangeHeaderMenu(state);
  clearNoteComposerState(state);
  if (message) {
    state.authMessage = message;
  }
}

function pushViewHistory(state) {
  const snapshot = {
    currentView: state.currentView,
    selectedProjectId: state.selectedProjectId,
    selectedChangeId: state.selectedChangeId,
    projectEditorMode: state.projectEditorMode,
    changeEditorMode: state.changeEditorMode
  };

  const last = state.viewHistory[state.viewHistory.length - 1];
  const sameAsLast = last &&
    last.currentView === snapshot.currentView &&
    last.selectedProjectId === snapshot.selectedProjectId &&
    last.selectedChangeId === snapshot.selectedChangeId &&
    last.projectEditorMode === snapshot.projectEditorMode &&
    last.changeEditorMode === snapshot.changeEditorMode;

  if (sameAsLast) {
    return;
  }

  state.viewHistory.push(snapshot);
  if (state.viewHistory.length > 20) {
    state.viewHistory.shift();
  }
}

function restorePreviousView(state, fallbackView) {
  const previous = state.viewHistory.pop();
  if (previous) {
    state.currentView = previous.currentView;
    state.selectedProjectId = previous.selectedProjectId;
    state.selectedChangeId = previous.selectedChangeId;
    state.projectEditorMode = previous.projectEditorMode;
    state.changeEditorMode = previous.changeEditorMode;
    state.projectFormError = "";
    clearChangeEditorState(state);
    clearNoteComposerState(state);
    state.backendConfigMessage = "";
    return;
  }

  state.currentView = fallbackView;
}

async function reloadWorkspaceState(state, reason = "workspace.reload") {
  const initialized = await measureAsync(reason, () => initializeWorkspace(projectTrackMockData));
  syncInitializedState(state, initialized);
  console.info(
    `[ProjectTrack] ${reason} ready with ${initialized.data?.projects?.length ?? 0} projects, ` +
    `${initialized.data?.changes?.length ?? 0} changes and ${initialized.data?.mentionedNotes?.length ?? 0} notes`
  );
  if (!hasAuthenticatedSession(state)) {
    forceLoginScreen(state, state.authMessage || initialized.backendStatus?.reason || "Sign in to continue.");
  }
}

export async function mountProjectTrackApp(rootNode, options = {}) {
  const state = createProjectTrackState(options);
  const globalNavbarTemplate = await loadGlobalNavbarTemplate();
  const userMenuTemplate = await loadUserMenuTemplate();
  const pillDropdownTemplate = await loadPillDropdownTemplate();
  const sectionNavTemplate = await loadSectionNavTemplate();
  state.pillDropdownTemplate = pillDropdownTemplate;
  setThemeManagerNavTemplate(sectionNavTemplate);
  state.releaseUpdate = {
    ...createIdleReleaseUpdateState(),
    ...(state.releaseUpdate ?? {})
  };
  let noticeTimeoutId = null;
  let noticeFadeTimeoutId = null;
  let promptedReleaseId = "";
  const appNode = document.createElement("div");
  appNode.className = "position-relative d-flex flex-column flex-grow-1 min-vh-100";
  appNode.dataset.projecttrackShell = "true";

  const navbar = document.createElement("nav");
  navbar.className = "navbar navbar-expand-lg bg-white border-bottom sticky-top shadow-sm";
  navbar.setAttribute("aria-label", "ProjectTrack main navigation");
  const viewNode = document.createElement("section");
  viewNode.className = "container-fluid px-4 px-xl-5 py-4 py-xl-5 d-grid gap-4 align-content-start flex-grow-1";
  const overlayNode = document.createElement("div");
  overlayNode.className = "position-absolute top-0 start-0 w-100 h-100 pe-none";
  overlayNode.dataset.overlayLayer = "true";

  const tabItems = [
    ["dashboard", "Dashboard"],
    ["projects", "Projects"],
    ["changes", "Changes"],
    ["profile", "Profile"]
  ];

  function renderNavBar() {
    navbar.hidden = false;
    const userName = state.data?.user?.name || state.backendSession?.user?.email || "ProjectTrack User";
    const userRole = state.data?.user?.role || (hasAuthenticatedSession(state) ? "Workspace member" : "Workspace locked");
    const userInitial = String(userName).trim().charAt(0).toUpperCase() || "P";
    const breadcrumbLabel = buildWorkspaceBreadcrumbLabel(state);
    const menuItems = tabItems.map(([id, label]) => {
      const isBase = id === state.currentView;
      const isProjectBranch = id === "projects" && ["project-detail", "project-editor"].includes(state.currentView);
      const isChangeBranch = id === "changes" && ["change-detail", "change-editor"].includes(state.currentView);
      const isActive = isBase || isProjectBranch || isChangeBranch;
      return { id, label, active: isActive };
    });
    const userMenuHtml = renderUserMenu({
      userInitial,
      userName,
      userRole,
      template: userMenuTemplate,
      items: [
        ...menuItems,
        { type: "divider" },
        { id: "theme-manager", label: "Theme Manager", active: state.currentView === "theme-manager" },
        { id: "change-history", label: "Change History", active: state.currentView === "change-history" }
      ]
    });
    const replacements = {
      "{{BRAND_MARK}}": renderProjectTrackBrand(34),
      "{{BREADCRUMB_LABEL}}": escapeHtml(breadcrumbLabel),
      "{{USER_MENU}}": userMenuHtml,
      "{{NOTICE}}": renderNotice()
    };
    const template = globalNavbarTemplate || `
      <div class="container-fluid px-4 px-xl-5">
        <div class="navbar-brand d-inline-flex align-items-center gap-3 mb-0 text-body min-w-0">
          <button type="button" class="btn btn-link d-inline-flex align-items-center p-0 border-0 text-decoration-none text-reset" data-action="navigate-main" data-view-id="dashboard" aria-label="Go to Dashboard">
            {{BRAND_MARK}}
          </button>
          <span class="d-grid min-w-0">
            <button type="button" class="btn btn-link p-0 border-0 text-start text-decoration-none text-reset fw-bold" data-action="navigate-main" data-view-id="dashboard">
              <strong>ProjectTrack</strong>
            </button>
            <small class="text-secondary d-block text-break user-select-text" title="{{BREADCRUMB_LABEL}}">{{BREADCRUMB_LABEL}}</small>
          </span>
        </div>
        <div class="d-flex align-items-center gap-2 ms-auto flex-wrap justify-content-end">
          <button type="button" class="btn btn-outline-primary" data-action="navigate-main" data-view-id="dashboard">Open Classic Workspace</button>
          <button type="button" class="btn btn-primary" data-action="refresh-workspace">Refresh Data</button>
          {{USER_MENU}}
        </div>
      </div>
      {{NOTICE}}
    `;
    navbar.innerHTML = Object.entries(replacements).reduce(
      (html, [placeholder, value]) => html.split(placeholder).join(value),
      template
    );
  }

  function renderNotice() {
    if (!state.notice?.message) {
      return "";
    }

    const toneClass = state.notice.tone === "success" ? "alert-success" : "alert-info";
    return `
      <section class="alert alert-dismissible shadow-sm ${toneClass}" role="status" aria-live="polite">
        <strong class="alert-heading">${escapeHtml(state.notice.title || "Notice")}</strong>
        <p>${escapeHtml(state.notice.message)}</p>
        <button type="button" class="btn-close" data-action="dismiss-notice" aria-label="Close notice"></button>
      </section>
    `;
  }

  function renderConfirmDialog() {
    if (!state.confirmDialog?.open) {
      return;
    }

    overlayNode.innerHTML = `
      <div class="modal show d-block" role="alertdialog" aria-modal="true" aria-label="${state.confirmDialog.title || "Confirm action"}">
        <div class="modal-backdrop show"></div>
        <div class="modal-dialog modal-sm">
          <section class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">${state.confirmDialog.title || "Confirm action"}</h3>
              <button type="button" class="btn-close" data-action="confirm-dialog-cancel" aria-label="Close dialog">X</button>
            </div>
            <div class="modal-body">
              <p>${state.confirmDialog.message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn ${state.confirmDialog.confirmButtonClass || "btn-danger"}" data-action="confirm-dialog-accept">${state.confirmDialog.confirmLabel || "Confirm"}</button>
              <button type="button" class="btn btn-secondary" data-action="confirm-dialog-cancel">${state.confirmDialog.cancelLabel || "Cancel"}</button>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  function setNotice(message, tone = "info", title = "Updated") {
    if (noticeTimeoutId) {
      clearTimeout(noticeTimeoutId);
      noticeTimeoutId = null;
    }
    if (noticeFadeTimeoutId) {
      clearTimeout(noticeFadeTimeoutId);
      noticeFadeTimeoutId = null;
    }

    state.notice = { message, tone, title, closing: false };

    noticeTimeoutId = setTimeout(() => {
      dismissNotice();
    }, 3500);
  }

  function clearNotice() {
    if (noticeTimeoutId) {
      clearTimeout(noticeTimeoutId);
      noticeTimeoutId = null;
    }
    if (noticeFadeTimeoutId) {
      clearTimeout(noticeFadeTimeoutId);
      noticeFadeTimeoutId = null;
    }
    state.notice = null;
  }

  function dismissNotice() {
    if (!state.notice) {
      return;
    }

    if (noticeTimeoutId) {
      clearTimeout(noticeTimeoutId);
      noticeTimeoutId = null;
    }

    state.notice = {
      ...state.notice,
      closing: true
    };
    render();

    noticeFadeTimeoutId = setTimeout(() => {
      clearNotice();
      render();
    }, 260);
  }

  function applySyncNotice(successTitle, successMessage, fallbackTitle) {
    const syncMeta = getLastWorkspaceSyncMeta();
    if (syncMeta.channel === "remote") {
      setNotice(`${successMessage} ${syncMeta.message}`.trim(), "success", successTitle);
      return;
    }
    if (syncMeta.channel === "auth-required") {
      setNotice(syncMeta.message || "Your session is no longer valid. Sign in again.", "info", "Session Required");
      return;
    }
    if (syncMeta.channel === "remote-error") {
      setNotice(syncMeta.message || "The remote operation could not be completed.", "info", fallbackTitle);
      return;
    }
    setNotice(successMessage, "success", successTitle);
  }

  function openConfirmDialog(title, message, onConfirm, options = {}) {
    state.confirmDialog = {
      open: true,
      title,
      message,
      onConfirm,
      confirmLabel: options.confirmLabel || "Confirm",
      cancelLabel: options.cancelLabel || "Cancel",
      confirmButtonClass: options.confirmButtonClass || "btn-danger"
    };
  }

  function closeConfirmDialog() {
    state.confirmDialog = null;
  }

  function renderNoteDialog() {
    if (!state.noteModalOpen) {
      return false;
    }

    const changeTasks = resolveSelectedChangeTasks(state);
    const taskFeatureStatus = state.data?.taskFeatureStatus ?? {
      available: true,
      missingRelations: [],
      migrationFile: "sql/change_tasks_excel_import_20260331.sql",
    };
    const tasksFeatureAvailable = taskFeatureStatus.available !== false;
    const linkedTasksAttributes = changeTasks.length > 4
      ? 'class="d-grid gap-2 overflow-auto pe-1" style="max-height:16rem;"'
      : 'class="d-grid gap-2"';

    overlayNode.innerHTML = `
      <div class="modal show d-block" role="dialog" aria-modal="true" aria-label="${state.editingNoteId ? "Edit note" : "New note"}">
        <div class="modal-backdrop show"></div>
        <div class="modal-dialog modal-lg">
          <section class="modal-content">
            <div class="modal-header">
              <div class="d-grid gap-2 min-w-0">
                <h3 class="modal-title">${state.editingNoteId ? "Edit note" : "New note"}</h3>
                <p class="form-text">Write the note details and use <code>@name</code> if you need to mention someone.</p>
              </div>
              <button type="button" class="btn-close" data-action="cancel-note-modal" aria-label="Close dialog">X</button>
            </div>
            <div class="modal-body">
              ${state.noteFormError ? `<section class="alert alert-danger"><strong>Unable to save.</strong><p>${state.noteFormError}</p></section>` : ""}
              <div class="d-grid gap-2">
                <label class="form-label">Note</label>
                <textarea class="form-control" data-field="note-text" placeholder="Write a note or TO-DO for this change...">${state.noteDraftText || ""}</textarea>
                <div class="list-group mt-2" data-note-mention-suggestions hidden></div>
              </div>
              <div class="d-grid gap-2">
                <div class="d-flex align-items-center w-100 gap-2 flex-wrap">
                  <label class="form-label m-0">Linked Tasks</label>
                  <span class="badge rounded-pill text-bg-light border">${changeTasks.length} available</span>
                </div>
                ${
                  !tasksFeatureAvailable
                    ? `<p class="form-text m-0">Linked tasks are unavailable until <code>${escapeHtml(taskFeatureStatus.migrationFile)}</code> is applied in Supabase.</p>`
                    : changeTasks.length
                    ? `
                      <div ${linkedTasksAttributes}>
                        ${changeTasks.map((task) => `
                          <label class="form-check border rounded-3 p-3 bg-white">
                            <input
                              class="form-check-input"
                              type="checkbox"
                              data-field="note-task-link"
                              value="${escapeAttribute(task.id)}"
                              ${state.noteLinkedTaskIds.includes(task.id) ? "checked" : ""}
                            />
                            <span class="form-check-label d-grid gap-1 min-w-0">
                              <strong>${escapeHtml(task.label)}</strong>
                              <span class="text-body-secondary">${escapeHtml(task.documentName || task.annotationType || "Task")}</span>
                              <span>${escapeHtml(task.requestText)}</span>
                            </span>
                          </label>
                        `).join("")}
                      </div>
                    `
                    : `<p class="form-text m-0">Import tasks first if you need to link this note to tracker items.</p>`
                }
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" data-action="save-note">${state.editingNoteId ? "Save Note" : "Create Note"}</button>
              <button type="button" class="btn btn-secondary" data-action="cancel-note-modal">Cancel</button>
            </div>
          </section>
        </div>
      </div>
    `;

    return true;
  }

  function closeNoteDialog() {
    closeChangeHeaderMenu(state);
    clearNoteComposerState(state);
  }

  async function refreshUsersDirectoryFromBackend() {
    if (!state.backendSession?.accessToken) {
      return false;
    }

    try {
      const users = await fetchRemoteUsersDirectory(state.backendConfig);
      if (users.length) {
        state.data = {
          ...state.data,
          users
        };
      }
      return true;
    } catch {
      return false;
    }
  }

  function ensureAuthenticatedView(targetView = state.currentView, noticeMessage = "") {
    if (targetView === "profile" || targetView === "login" || targetView === "change-history" || hasAuthenticatedSession(state)) {
      return true;
    }

    forceLoginScreen(state, state.backendStatus?.reason || "The session is not active.");
    if (noticeMessage) {
      setNotice(noticeMessage, "info", "Session Required");
    }
    return false;
  }

  async function runProtectedAction(action, options = {}) {
    try {
      return await action();
    } catch (error) {
      await reloadWorkspaceState(state);
      if (isBackendAuthError(error)) {
        forceLoginScreen(
          state,
          options.authMessage || error.message || "Your session expired. Sign in again."
        );
        setNotice(
          options.noticeMessage || "The extension requires an active session to continue.",
          "info",
          "Session Required"
        );
      } else {
        setNotice(error.message || "The operation could not be completed.", "info", options.errorTitle || "Operation Not Completed");
      }
      return null;
    }
  }

  async function updateSelectedChangeHeaderField(fieldName, nextValue) {
    if (!ensureAuthenticatedView("change-detail", "Sign in to update this change.")) {
      render();
      return;
    }

    const change = resolveSelectedChange(state);
    const project = resolveSelectedChangeProject(state);
    const payload = buildSelectedChangePayload(state);
    if (!change || !project?.id || !payload) {
      closeChangeHeaderMenu(state);
      setNotice("The selected change or its project could not be resolved.", "info", "Change Unavailable");
      render();
      return;
    }

    const currentValue = change[fieldName];
    if (!nextValue || nextValue === currentValue) {
      closeChangeHeaderMenu(state);
      render();
      return;
    }

    const translateValue = fieldName === "status" ? translateStatus : translatePriority;
    const previousLabel = translateValue(currentValue) || currentValue || "Not defined";
    const nextLabel = translateValue(nextValue) || nextValue || "Not defined";
    const actorName = state.data?.user?.name?.trim() || state.backendSession?.user?.email || "Someone";
    const historyLabel = fieldName === "status" ? "status" : "priority";
    closeChangeHeaderMenu(state);

    const nextData = await runProtectedAction(() => saveChange(
      state.data,
      {
        ...payload,
        [fieldName]: nextValue
      },
      "edit",
      state.selectedChangeId,
      {
        historyEntry: {
          projectId: project.id,
          changeId: change.id,
          createdBy: state.backendSession?.user?.id ?? state.data?.user?.id ?? null,
          text: `${actorName} changed ${historyLabel} from ${previousLabel} to ${nextLabel}.`
        }
      }
    ), {
      authMessage: "Your session expired while updating the change.",
      errorTitle: "Change Not Updated"
    });

    if (!nextData) {
      render();
      return;
    }

    state.data = nextData;
    applySyncNotice(
      "Change Updated",
      fieldName === "status"
        ? `The change status is now ${nextLabel}.`
        : `The change priority is now ${nextLabel}.`,
      "Change Not Synced"
    );
    render();
  }

  function render() {
    if (state.currentView !== "change-detail") {
      closeChangeHeaderMenu(state);
    }
    syncWorkspaceUrl(state);
    if (!state.isReady) {
      viewNode.className = "container-fluid px-4 px-xl-5 py-5 d-grid gap-4 align-content-start flex-grow-1";
      viewNode.innerHTML = `
        <section class="card border-0 shadow-sm">
          <div class="card-body p-4 p-xl-5 text-center">
            <div class="spinner-border text-success mb-3" role="status" aria-hidden="true"></div>
            <h1 class="h4 mb-2">Loading ProjectTrack</h1>
            <p class="mb-0 text-secondary">Preparing session, credentials and remote data load.</p>
          </div>
        </section>
      `;
      overlayNode.innerHTML = "";
      return;
    }

    viewNode.className = state.currentView === "login"
      ? "container-fluid px-4 px-xl-5 py-4 py-xl-5 d-grid gap-4 align-content-start flex-grow-1 justify-items-center"
      : "container-fluid px-4 px-xl-5 py-4 py-xl-5 d-grid gap-4 align-content-start flex-grow-1";
    renderNavBar();
    viewNode.innerHTML = renderProjectTrackView(state, state.data);
    overlayNode.innerHTML = "";
    if (!renderNoteDialog()) {
      renderConfirmDialog();
    }
    wireActions();
    bindThemeManagerControls(viewNode);
  }

  async function refreshChromeReleaseUpdate(promptedByUser = false) {
    state.releaseUpdate = {
      ...createIdleReleaseUpdateState(),
      ...(state.releaseUpdate ?? {}),
      status: "checking",
      message: "Checking GitHub Releases for a newer package..."
    };

    if (promptedByUser) {
      render();
    }

    try {
      const updateState = await checkChromeReleaseUpdate({
        backendConfig: state.backendConfig,
        backendSession: state.backendSession,
      });
      state.releaseUpdate = updateState;

      if (updateState.status === "available") {
        const shouldPrompt = promptedByUser || promptedReleaseId !== updateState.releaseId;
        promptedReleaseId = updateState.releaseId;

        if (shouldPrompt) {
          openConfirmDialog(
            "ProjectTrack update available",
            `Version ${updateState.latestVersion} is ready. Chrome cannot replace this unpacked extension automatically, but it can open the release package for download.`,
            async () => {
              await openChromeReleaseDownload(updateState);
              setNotice(
                "Download the zip, unzip it over your local Chrome folder, then reload ProjectTrack from chrome://extensions.",
                "info",
                "Manual Update"
              );
            },
            {
              confirmLabel: "Open Release",
              cancelLabel: "Later",
              confirmButtonClass: "btn-primary"
            }
          );
        }
      } else if (updateState.status === "setup-required" && promptedByUser) {
        setNotice(updateState.message, "info", "Release Setup Required");
      } else if (updateState.status === "auth-required" && promptedByUser) {
        setNotice(updateState.message, "info", "Sign In Required");
      } else if (promptedByUser) {
        setNotice(updateState.message, "success", "ProjectTrack Is Current");
      }
    } catch (error) {
      state.releaseUpdate = {
        ...createIdleReleaseUpdateState(),
        status: "error",
        checkedAt: new Date().toISOString(),
        message: error.message || "The update check could not be completed."
      };

      if (promptedByUser) {
        setNotice(state.releaseUpdate.message, "info", "Update Check Failed");
      }
    }

    render();
  }

  async function copyTextToClipboard(value) {
    if (!value) {
      setNotice("There is no link available to copy.", "info", "Link Unavailable");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setNotice("The link was copied to the clipboard.", "success", "Link Copied");
    } catch {
      setNotice("The link could not be copied.", "info", "Copy Unavailable");
    }
  }

  function wireActions() {
    navbar.querySelectorAll("[data-action='navigate-main']").forEach((node) => {
      node.addEventListener("click", () => {
        if (!ensureAuthenticatedView(node.dataset.viewId, "Sign in to open that screen.")) {
          render();
          return;
        }
        navigateMain(state, node.dataset.viewId);
        clearNotice();
        render();
      });
    });

    navbar.querySelector("[data-action='refresh-workspace']")?.addEventListener("click", async () => {
      try {
        await reloadWorkspaceState(state, "workspace.reload.navbar");
        setNotice("Workspace data was refreshed.", "success", "Data Refreshed");
      } catch (error) {
        console.error("[ProjectTrack] Could not refresh workspace data.", error);
        setNotice("Workspace data could not be refreshed.", "danger", "Refresh Failed");
      }
      render();
    });

    navbar.querySelector("[data-action='dismiss-notice']")?.addEventListener("click", () => {
      dismissNotice();
    });

    viewNode.querySelectorAll("[data-action='navigate-main']").forEach((node) => {
      node.addEventListener("click", () => {
        if (!ensureAuthenticatedView(node.dataset.viewId, "Sign in to open that screen.")) {
          render();
          return;
        }
        navigateMain(state, node.dataset.viewId);
        clearNotice();
        render();
      });
    });

    overlayNode.querySelectorAll("[data-action='confirm-dialog-cancel']").forEach((node) => {
      node.addEventListener("click", () => {
        closeConfirmDialog();
        render();
      });
    });

    overlayNode.querySelector("[data-action='confirm-dialog-accept']")?.addEventListener("click", async () => {
      const action = state.confirmDialog?.onConfirm;
      closeConfirmDialog();
      if (typeof action === "function") {
        await action();
      }
      render();
    });

    overlayNode.querySelectorAll("[data-action='cancel-note-modal']").forEach((node) => {
      node.addEventListener("click", () => {
        closeNoteDialog();
        render();
      });
    });

    viewNode.querySelector("[data-input='project-search']")?.addEventListener("input", (event) => {
      const selectionStart = event.target.selectionStart;
      const selectionEnd = event.target.selectionEnd;
      state.projectSearchQuery = event.target.value;
      render();
      const nextInput = viewNode.querySelector("[data-input='project-search']");
      if (nextInput) {
        nextInput.focus({ preventScroll: true });
        if (selectionStart != null && selectionEnd != null) {
          nextInput.setSelectionRange(selectionStart, selectionEnd);
        }
      }
    });

    viewNode.querySelector("[data-input='change-search']")?.addEventListener("input", (event) => {
      const selectionStart = event.target.selectionStart;
      const selectionEnd = event.target.selectionEnd;
      state.changeSearchQuery = event.target.value;
      render();
      const nextInput = viewNode.querySelector("[data-input='change-search']");
      if (nextInput) {
        nextInput.focus({ preventScroll: true });
        if (selectionStart != null && selectionEnd != null) {
          nextInput.setSelectionRange(selectionStart, selectionEnd);
        }
      }
    });

    viewNode.querySelectorAll("[data-action='copy-link-value']").forEach((node) => {
      node.addEventListener("click", async () => {
        await copyTextToClipboard(decodeURIComponent(node.dataset.copyValue ?? ""));
        render();
      });
    });

    viewNode.querySelector("[data-field='task-export-start']")?.addEventListener("input", (event) => {
      state.taskExportStart = event.target.value;
    });

    viewNode.querySelector("[data-field='task-export-end']")?.addEventListener("input", (event) => {
      state.taskExportEnd = event.target.value;
    });

    viewNode.querySelector("[data-field='change-task-import-file']")?.addEventListener("change", async (event) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      input.value = "";

      if (!file) {
        return;
      }
      const taskImportMode = state.taskImportMode === "replace" ? "replace" : "import";
      state.taskImportMode = "import";
      if (state.data?.taskFeatureStatus?.available === false) {
        setNotice(
          `Apply ${state.data.taskFeatureStatus.migrationFile || "sql/change_tasks_excel_import_20260331.sql"} in Supabase before ${taskImportMode === "replace" ? "replacing" : "importing"} tasks.`,
          "info",
          "Tasks Migration Required",
        );
        render();
        return;
      }

      const change = resolveSelectedChange(state);
      const project = resolveSelectedChangeProject(state);
      if (!change || !project?.id) {
        setNotice("The selected change or project could not be resolved for the task import.", "info", "Import Not Completed");
        render();
        return;
      }

      let parsedWorkbook;
      try {
        parsedWorkbook = await parseTrackerWorkbook(file);
      } catch (error) {
        setNotice(error.message || "The tracker workbook could not be parsed.", "info", "Import Not Completed");
        render();
        return;
      }

      if (taskImportMode === "replace" && !(parsedWorkbook.tasks ?? []).length) {
        setNotice(
          "Replace Tasks needs at least one valid task in the workbook so the current list is not cleared by accident.",
          "info",
          "Replace Not Completed",
        );
        render();
        return;
      }

      const taskMutation = taskImportMode === "replace" ? replaceChangeTasks : importChangeTasks;
      const nextData = await runProtectedAction(() => taskMutation(state.data, {
        projectId: project.id,
        changeId: change.id,
        sourceFile: parsedWorkbook.fileName,
        tasks: parsedWorkbook.tasks,
      }), {
        authMessage: taskImportMode === "replace"
          ? "Your session expired while replacing tasks."
          : "Your session expired while importing tasks.",
        errorTitle: taskImportMode === "replace" ? "Tasks Not Replaced" : "Tasks Not Imported",
      });
      if (!nextData) {
        render();
        return;
      }

      state.data = nextData;
      const mutationMeta = getLastWorkspaceMutationMeta();
      const importedCount = mutationMeta.importedTaskCount ?? 0;
      const updatedCount = mutationMeta.updatedTaskCount ?? 0;
      const deletedCount = mutationMeta.deletedTaskCount ?? 0;
      const noticeParts = [];
      if (importedCount > 0) {
        noticeParts.push(`${importedCount} imported`);
      }
      if (updatedCount > 0) {
        noticeParts.push(`${updatedCount} refreshed`);
      }
      if (deletedCount > 0) {
        noticeParts.push(`${deletedCount} removed`);
      }
      if (!noticeParts.length) {
        noticeParts.push("no task changes were required");
      }
      applySyncNotice(
        taskImportMode === "replace" ? "Tasks Replaced" : "Tasks Imported",
        `${parsedWorkbook.fileName} was processed: ${noticeParts.join(", ")}.`,
        taskImportMode === "replace" ? "Tasks Not Replaced" : "Tasks Not Synced",
      );
      render();
    });

    const noteTextarea = overlayNode.querySelector("[data-field='note-text']") ?? viewNode.querySelector("[data-field='note-text']");
    const noteSuggestionNode = overlayNode.querySelector("[data-note-mention-suggestions]") ?? viewNode.querySelector("[data-note-mention-suggestions]");
    if (noteTextarea && noteSuggestionNode) {
      const updateSuggestions = () => {
        state.noteDraftText = noteTextarea.value;
        const suggestions = getNoteMentionSuggestions(state.data, noteTextarea.value);
        noteSuggestionNode.innerHTML = suggestions.map((item) => `
          <button type="button" class="list-group-item list-group-item-action d-grid gap-1" data-action="apply-note-mention" data-mention-value="${item.value}">
            <strong>@${item.value}</strong>
            <span>${item.label}</span>
          </button>
        `).join("");
        noteSuggestionNode.hidden = suggestions.length === 0;
        noteSuggestionNode.querySelectorAll("[data-action='apply-note-mention']").forEach((node) => {
          node.addEventListener("click", () => {
            const nextValue = applyMentionToDraft(noteTextarea.value, node.dataset.mentionValue);
            noteTextarea.value = nextValue;
            state.noteDraftText = nextValue;
            noteSuggestionNode.hidden = true;
            noteSuggestionNode.innerHTML = "";
            noteTextarea.focus();
          });
        });
      };

      noteTextarea.addEventListener("input", updateSuggestions);
      noteTextarea.addEventListener("focus", async () => {
        await refreshUsersDirectoryFromBackend();
        updateSuggestions();
      });
      updateSuggestions();
    }

    overlayNode.querySelectorAll("[data-field='note-task-link']").forEach((node) => {
      node.addEventListener("change", () => {
        state.noteLinkedTaskIds = Array.from(
          overlayNode.querySelectorAll("[data-field='note-task-link']:checked"),
          (checkedNode) => checkedNode.value,
        );
      });
    });

    viewNode.querySelectorAll("[data-action='change-task-status']").forEach((node) => {
      node.addEventListener("change", async () => {
        const taskId = node.dataset.taskId;
        const nextStatus = node.value;
        const task = (state.data?.changeTasks ?? []).find((item) => item.id === taskId);
        if (!task || task.status === nextStatus) {
          return;
        }

        const nextData = await runProtectedAction(() => updateChangeTask(state.data, taskId, {
          status: nextStatus,
        }), {
          authMessage: "Your session expired while updating the task status.",
          errorTitle: "Task Not Updated",
        });
        if (!nextData) {
          render();
          return;
        }

        state.data = nextData;
        applySyncNotice(
          "Task Updated",
          `${task.label} is now ${translateTaskStatus(nextStatus)}.`,
          "Task Not Synced",
        );
        render();
      });
    });

    viewNode.querySelectorAll("[data-action='change-task-assignee']").forEach((node) => {
      node.addEventListener("change", async () => {
        const taskId = node.dataset.taskId;
        const nextAssigneeId = node.value || null;
        const task = (state.data?.changeTasks ?? []).find((item) => item.id === taskId);
        if (!task || task.assignedToId === nextAssigneeId) {
          return;
        }

        const nextData = await runProtectedAction(() => updateChangeTask(state.data, taskId, {
          assignedToId: nextAssigneeId,
        }), {
          authMessage: "Your session expired while updating the task assignee.",
          errorTitle: "Task Not Updated",
        });
        if (!nextData) {
          render();
          return;
        }

        state.data = nextData;
        const selectedUserName = (state.data?.users ?? []).find((user) => user.id === nextAssigneeId)?.name ?? "Unassigned";
        applySyncNotice(
          "Task Updated",
          `${task.label} is now assigned to ${selectedUserName}.`,
          "Task Not Synced",
        );
        render();
      });
    });

    const changeAssigneeInput = viewNode.querySelector("[data-field='change-assignees']");
    const changeAssigneeSuggestionNode = viewNode.querySelector("[data-change-assignee-suggestions]");
    if (changeAssigneeInput && changeAssigneeSuggestionNode) {
      const updateAssigneeSuggestions = () => {
        const suggestions = getAssigneeMentionSuggestions(state.data, changeAssigneeInput.value);
        changeAssigneeSuggestionNode.innerHTML = suggestions.map((item) => `
          <button type="button" class="list-group-item list-group-item-action d-grid gap-1" data-action="apply-change-assignee" data-assignee-value="${item.value}">
            <strong>${item.value}</strong>
            <span>${item.label}</span>
          </button>
        `).join("");
        changeAssigneeSuggestionNode.hidden = suggestions.length === 0;
        changeAssigneeSuggestionNode.querySelectorAll("[data-action='apply-change-assignee']").forEach((node) => {
          node.addEventListener("click", () => {
            changeAssigneeInput.value = applyAssigneeSuggestion(changeAssigneeInput.value, node.dataset.assigneeValue);
            changeAssigneeSuggestionNode.hidden = true;
            changeAssigneeSuggestionNode.innerHTML = "";
            changeAssigneeInput.focus();
          });
        });
      };

      changeAssigneeInput.addEventListener("input", updateAssigneeSuggestions);
      changeAssigneeInput.addEventListener("focus", async () => {
        await refreshUsersDirectoryFromBackend();
        updateAssigneeSuggestions();
      });
      updateAssigneeSuggestions();
    }

    viewNode.querySelectorAll("[data-action='cycle-project-filter']").forEach((node) => {
      node.addEventListener("click", () => {
        const currentIndex = PROJECT_ACTIVITY_FILTERS.indexOf(state.projectActivityFilter);
        state.projectActivityFilter = PROJECT_ACTIVITY_FILTERS[(currentIndex + 1) % PROJECT_ACTIVITY_FILTERS.length];
        render();
      });
    });

    viewNode.querySelectorAll("[data-project-id]").forEach((node) => {
      node.addEventListener("click", (event) => {
        if (event.target.closest("[data-change-id]")) {
          return;
        }
        if (!ensureAuthenticatedView("project-detail", "Sign in to view projects.")) {
          render();
          return;
        }
        pushViewHistory(state);
        state.projectDetailReturnView = state.currentView;
        state.selectedProjectId = node.dataset.projectId;
        state.currentView = "project-detail";
        render();
      });
      node.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
        if (event.target.closest("[data-change-id]")) {
          return;
        }
        event.preventDefault();
        node.click();
      });
    });

    viewNode.querySelectorAll("[data-change-id]").forEach((node) => {
      node.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!ensureAuthenticatedView("change-detail", "Sign in to view changes.")) {
          render();
          return;
        }
        pushViewHistory(state);
        state.changeDetailReturnView = state.currentView;
        state.selectedChangeId = node.dataset.changeId;
        state.currentView = "change-detail";
        render();
      });
      node.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
        event.preventDefault();
        node.click();
      });
    });

    viewNode.querySelectorAll("[data-choice-group]").forEach((node) => {
      node.addEventListener("click", () => {
        const group = node.dataset.choiceGroup;
        viewNode.querySelectorAll(`[data-choice-group='${group}']`).forEach((button) => {
          button.classList.remove("active");
        });
        node.classList.add("active");
      });
    });

    viewNode.querySelectorAll("[data-action='add-url-row']").forEach((node) => {
      node.addEventListener("click", () => {
        const envName = node.dataset.envName;
        const group = viewNode.querySelector(`[data-env-group='${envName}']`);
        if (!group) {
          return;
        }
        group.querySelector("[data-empty-row]")?.remove();
        group.insertAdjacentHTML("beforeend", buildUrlRowMarkup(group.querySelectorAll("[data-url-row]").length + 1));
        const removeButton = group.querySelector("[data-url-row]:last-child [data-action='remove-url-row']");
        removeButton?.addEventListener("click", () => {
          const row = removeButton.closest("[data-url-row]");
          row?.remove();
          if (group.querySelectorAll("[data-url-row]").length === 0) {
            group.innerHTML = `<div class="list-group-item text-secondary" data-empty-row><span>No URLs configured.</span></div>`;
          }
        });
      });
    });

    viewNode.querySelectorAll("[data-action='remove-url-row']").forEach((node) => {
      node.addEventListener("click", () => {
        const row = node.closest("[data-url-row]");
        const group = row?.closest("[data-env-group]");
        row?.remove();
        if (group && group.querySelectorAll("[data-url-row]").length === 0) {
          group.innerHTML = `<div class="list-group-item text-secondary" data-empty-row><span>No URLs configured.</span></div>`;
        }
      });
    });

    bindSimpleAction("back-to-projects", () => {
      if (!ensureAuthenticatedView("projects", "Sign in to view projects.")) {
        render();
        return;
      }
      state.currentView = "projects";
      render();
    });
    bindSimpleAction("back-to-changes", () => {
      if (!ensureAuthenticatedView("changes", "Sign in to view changes.")) {
        render();
        return;
      }
      state.currentView = "changes";
      render();
    });
    bindSimpleAction("go-to-projects", () => {
      if (!ensureAuthenticatedView("projects", "Sign in to view projects.")) {
        render();
        return;
      }
      state.currentView = "projects";
      state.selectedProjectId = null;
      render();
    });
    bindSimpleAction("open-project-create", () => {
      if (!ensureAuthenticatedView("project-editor", "Sign in to create projects.")) {
        render();
        return;
      }
      pushViewHistory(state);
      state.projectFormError = "";
      state.projectEditorMode = "create";
      state.projectEditorReturnView = state.currentView;
      state.selectedProjectId = null;
      state.currentView = "project-editor";
      render();
    });
    bindSimpleAction("open-project-editor", () => {
      if (!ensureAuthenticatedView("project-editor", "Sign in to edit projects.")) {
        render();
        return;
      }
      pushViewHistory(state);
      state.projectFormError = "";
      state.projectEditorMode = "edit";
      state.projectEditorReturnView = state.currentView;
      state.currentView = "project-editor";
      render();
    });
    bindSimpleAction("back-to-project-detail", () => {
      restorePreviousView(
        state,
        state.selectedProjectId
          ? state.projectEditorReturnView || "project-detail"
          : "projects"
      );
      render();
    });
    bindSimpleAction("open-change-project", () => {
      if (!ensureAuthenticatedView("project-detail", "Sign in to view the related project.")) {
        render();
        return;
      }

      const project = resolveSelectedChangeProject(state);
      if (!project) {
        setNotice("The project related to this change could not be found.", "info", "Project Unavailable");
        render();
        return;
      }

      pushViewHistory(state);
      state.projectDetailReturnView = state.currentView;
      state.selectedProjectId = project.id;
      state.currentView = "project-detail";
      render();
    });
    bindSimpleAction("toggle-change-status-menu", () => {
      if (!ensureAuthenticatedView("change-detail", "Sign in to update the change status.")) {
        render();
        return;
      }
      state.changeHeaderMenu = state.changeHeaderMenu === "status" ? null : "status";
      render();
    });
    bindSimpleAction("toggle-change-priority-menu", () => {
      if (!ensureAuthenticatedView("change-detail", "Sign in to update the change priority.")) {
        render();
        return;
      }
      state.changeHeaderMenu = state.changeHeaderMenu === "priority" ? null : "priority";
      render();
    });
    bindSimpleAction("set-change-status", async (event) => {
      await updateSelectedChangeHeaderField("status", event.currentTarget.dataset.statusValue ?? "");
    });
    bindSimpleAction("set-change-priority", async (event) => {
      await updateSelectedChangeHeaderField("priority", event.currentTarget.dataset.priorityValue ?? "");
    });
    bindSimpleAction("open-change-create", () => {
      if (!ensureAuthenticatedView("change-editor", "Sign in to create changes.")) {
        render();
        return;
      }
      pushViewHistory(state);
      clearChangeEditorState(state);
      clearNoteComposerState(state);
      state.changeEditorMode = "create";
      state.changeEditorReturnView = state.currentView;
      state.selectedChangeId = null;
      state.currentView = "change-editor";
      render();
    });
    bindSimpleAction("open-change-editor", () => {
      if (!ensureAuthenticatedView("change-editor", "Sign in to edit changes.")) {
        render();
        return;
      }
      pushViewHistory(state);
      clearChangeEditorState(state);
      clearNoteComposerState(state);
      state.changeEditorMode = "edit";
      state.changeEditorReturnView = state.currentView;
      state.currentView = "change-editor";
      render();
    });
    bindSimpleAction("back-to-change-detail", () => {
      clearChangeEditorState(state);
      clearNoteComposerState(state);
      restorePreviousView(
        state,
        state.selectedChangeId
          ? state.changeEditorReturnView || "change-detail"
          : "changes"
      );
      render();
    });
    bindSimpleAction("back-to-project-origin", () => {
      restorePreviousView(state, state.projectDetailReturnView || "projects");
      if (state.currentView !== "project-detail") {
        state.selectedProjectId = null;
      }
      render();
    });
    bindSimpleAction("back-to-change-origin", () => {
      clearNoteComposerState(state);
      restorePreviousView(state, state.changeDetailReturnView || "changes");
      if (state.currentView !== "change-detail") {
        state.selectedChangeId = null;
      }
      render();
    });

    bindSimpleAction("save-project", async () => {
      const projectPayload = readProjectPayload(viewNode);
      const projectValidation = validateProjectPayload(projectPayload);
      if (projectValidation) {
        state.projectFormError = projectValidation;
        render();
        return;
      }
      state.projectFormError = "";

      const nextData = await runProtectedAction(() => saveProject(
        state.data,
        projectPayload,
        state.projectEditorMode,
        state.selectedProjectId
      ), {
        authMessage: "Your session expired while saving the project.",
        errorTitle: "Project Not Saved"
      });
      if (!nextData) {
        render();
        return;
      }
      state.data = nextData;
      if (state.projectEditorMode === "create") {
        const mutationMeta = getLastWorkspaceMutationMeta();
        state.selectedProjectId = mutationMeta.createdProjectId || state.data.projects[0]?.id || null;
        applySyncNotice("Project Created", "The project was created successfully.", "Project Not Synced");
      } else {
        applySyncNotice("Project Updated", "The project changes were saved successfully.", "Project Not Synced");
      }
      state.currentView = "project-detail";
      render();
    });

    bindSimpleAction("pick-project-onedrive-folder", async () => {
      const onedriveInput = viewNode.querySelector("[data-field='project-onedrive']");
      if (!onedriveInput) {
        return;
      }

      try {
        const selectedPath = await pickNativeDirectoryPath();
        onedriveInput.value = selectedPath;
        setNotice("The local folder was loaded into the OneDrive field.", "success", "Folder Selected");
      } catch (error) {
        setNotice(
          error.message || "The local folder picker could not be opened.",
          "info",
          "Local Picker Unavailable"
        );
      }
    });

    bindSimpleAction("save-change", async () => {
      const changePayload = readChangePayload(viewNode, state);
      state.changeEditorDraft = changePayload;
      const changeValidation = validateChangePayload(changePayload);
      if (changeValidation.formError) {
        state.changeFormError = changeValidation.formError;
        state.changeFieldErrors = changeValidation.fieldErrors;
        render();
        return;
      }
      state.changeFormError = "";
      state.changeFieldErrors = {};

      const nextData = await runProtectedAction(() => saveChange(
        state.data,
        changePayload,
        state.changeEditorMode,
        state.selectedChangeId
      ), {
        authMessage: "Your session expired while saving the change.",
        errorTitle: "Change Not Saved"
      });
      if (!nextData) {
        render();
        return;
      }
      state.data = nextData;
      state.changeEditorDraft = null;
      state.changeFieldErrors = {};
      if (state.changeEditorMode === "create") {
        const mutationMeta = getLastWorkspaceMutationMeta();
        state.selectedChangeId = mutationMeta.createdChangeId || state.data.changes[0]?.id || null;
        applySyncNotice("Change Created", "The change was created successfully.", "Change Not Synced");
      } else {
        applySyncNotice("Change Updated", "The changes were saved successfully.", "Change Not Synced");
      }
      state.currentView = "change-detail";
      render();
    });

    bindSimpleAction("save-profile-name", async () => {
      const nextName = viewNode.querySelector("[data-field='profile-display-name']")?.value.trim() ?? "";
      if (!nextName) {
        return;
      }

      state.data = await saveProfileName(state.data, nextName);
      setNotice("The display name was updated.", "success", "Profile Updated");
      render();
    });

    bindSimpleAction("check-extension-update", () => {
      void refreshChromeReleaseUpdate(true);
    });

    bindSimpleAction("open-extension-release", async () => {
      await openChromeReleaseDownload(state.releaseUpdate);
      setNotice(
        "Download the zip, unzip it over your local Chrome folder, then reload ProjectTrack from chrome://extensions.",
        "info",
        "Manual Update"
      );
      render();
    });

    bindSimpleAction("save-backend-config", async () => {
      if (state.authIsSubmitting) {
        return;
      }

      const url = viewNode.querySelector("[data-field='backend-url']")?.value.trim() ?? "";
      const publishableKey = viewNode.querySelector("[data-field='backend-publishable-key']")?.value.trim() ?? "";

      if (!url || !publishableKey) {
        state.backendConfigMessage = "You must complete the URL and publishable key.";
        render();
        return;
      }

      state.backendConfig = await saveBackendConfig({ url, publishableKey });
      state.backendStatus = await loadBackendStatus();
      state.authMessage = "";
      state.backendConfigMessage = "Configuration saved in chrome.storage.";
      setNotice("The backend configuration was saved and is ready for authentication.", "success", "Backend Ready");
      render();
    });

    bindSimpleAction("clear-backend-config", async () => {
      if (state.authIsSubmitting) {
        return;
      }

      await clearBackendConfig();
      await clearBackendSession();
      await clearSavedBackendCredentials();
      await clearBackendAuthState();
      state.authMessage = "";
      state.backendConfigMessage = "Configuration and credentials were cleared.";
      setNotice("The backend configuration was removed.", "info", "Backend Cleared");
      await reloadWorkspaceState(state);
      render();
    });

    bindSimpleAction("sign-in-backend", async () => {
      if (state.authIsSubmitting) {
        return;
      }

      const email = viewNode.querySelector("[data-field='auth-email']")?.value.trim() ?? "";
      const password = viewNode.querySelector("[data-field='auth-password']")?.value ?? "";

      if (!email || !password) {
        state.authMessage = "You must complete the email and password.";
        render();
        return;
      }

      setAuthSubmissionState(state, true, "Authenticating credentials...");
      state.authMessage = "";
      render();

      try {
        state.backendSession = await measureAsync("auth.sign-in", () => signInWithPassword(state.backendConfig, email, password));
        state.authMessage = "Signed in successfully. Credentials were saved for automatic re-login.";
        state.backendConfigMessage = "";
        setAuthSubmissionState(state, true, "Syncing remote workspace...");
        render();
        await reloadWorkspaceState(state, "workspace.reload.post-login");
        if (hasAuthenticatedSession(state)) {
          state.currentView = "dashboard";
          void refreshChromeReleaseUpdate(false);
          const syncMeta = getLastWorkspaceSyncMeta();
          if (syncMeta.channel === "remote") {
            setNotice("Signed in and remote data is ready.", "success", "Backend Authenticated");
          } else {
            setNotice(
              syncMeta.message || "The session started, but the remote read needs review.",
              "info",
              "Backend Authenticated with Issues"
            );
          }
        }
      } catch (error) {
        state.backendStatus = await loadBackendStatus();
        state.authMessage = error.message || "Could not sign in.";
      } finally {
        setAuthSubmissionState(state, false);
      }

      render();
    });

    bindSimpleAction("sign-out-backend", async () => {
      if (state.authIsSubmitting) {
        return;
      }

      await markBackendManualLogout();
      state.authMessage = "Signed out manually. The extension will stay on the login view until you sign in again.";
      await reloadWorkspaceState(state);
      setNotice("The remote session was closed.", "info", "Session Closed");
      render();
    });

    bindSimpleAction("delete-project", async () => {
      openConfirmDialog(
        "Delete project",
        "This project will be marked as logically deleted together with its related changes and notes.",
        async () => {
          const nextData = await runProtectedAction(() => softDeleteProject(state.data, state.selectedProjectId), {
            authMessage: "Your session expired while deleting the project.",
            errorTitle: "Project Not Deleted"
          });
          if (!nextData) {
            return;
          }
          state.data = nextData;
          state.selectedProjectId = null;
          state.currentView = "projects";
          applySyncNotice("Project Deleted", "The project was marked as logically deleted.", "Project Not Synced");
        }
      );
      render();
    });

    bindSimpleAction("delete-change", async () => {
      openConfirmDialog(
        "Delete change",
        "This change will be marked as logically deleted together with its related notes.",
        async () => {
          const nextData = await runProtectedAction(() => softDeleteChange(state.data, state.selectedChangeId), {
            authMessage: "Your session expired while deleting the change.",
            errorTitle: "Change Not Deleted"
          });
          if (!nextData) {
            return;
          }
          state.data = nextData;
          state.selectedChangeId = null;
          state.currentView = "changes";
          applySyncNotice("Change Deleted", "The change was marked as logically deleted.", "Change Not Synced");
        }
      );
      render();
    });

    bindSimpleAction("open-task-import", () => {
      if (state.data?.taskFeatureStatus?.available === false) {
        setNotice(
          `Apply ${state.data.taskFeatureStatus.migrationFile || "sql/change_tasks_excel_import_20260331.sql"} in Supabase before importing tasks.`,
          "info",
          "Tasks Migration Required",
        );
        render();
        return;
      }
      if (!ensureAuthenticatedView("change-detail", "Sign in to import tasks from Excel.")) {
        render();
        return;
      }
      closeChangeHeaderMenu(state);
      state.taskImportMode = "import";
      viewNode.querySelector("[data-field='change-task-import-file']")?.click();
    });

    bindSimpleAction("open-task-replace", () => {
      if (state.data?.taskFeatureStatus?.available === false) {
        setNotice(
          `Apply ${state.data.taskFeatureStatus.migrationFile || "sql/change_tasks_excel_import_20260331.sql"} in Supabase before replacing tasks.`,
          "info",
          "Tasks Migration Required",
        );
        render();
        return;
      }
      if (!ensureAuthenticatedView("change-detail", "Sign in to replace tasks from Excel.")) {
        render();
        return;
      }
      closeChangeHeaderMenu(state);
      openConfirmDialog(
        "Replace tasks",
        "Import a workbook for this change and mark as deleted any current tasks that do not appear in that file.",
        () => {
          state.taskImportMode = "replace";
          requestAnimationFrame(() => {
            viewNode.querySelector("[data-field='change-task-import-file']")?.click();
          });
        },
      );
      render();
    });

    bindSimpleAction("export-change-tasks", () => {
      const change = resolveSelectedChange(state);
      const tasks = resolveSelectedChangeTasks(state);
      if (!change || !tasks.length) {
        setNotice("There are no tasks available to export for this change.", "info", "Export Not Completed");
        render();
        return;
      }

      const startRaw = viewNode.querySelector("[data-field='task-export-start']")?.value ?? state.taskExportStart;
      const endRaw = viewNode.querySelector("[data-field='task-export-end']")?.value ?? state.taskExportEnd;
      state.taskExportStart = startRaw;
      state.taskExportEnd = endRaw;

      const start = parsePositiveInteger(startRaw) ?? 1;
      const end = parsePositiveInteger(endRaw) ?? tasks.length;

      if (start < 1 || end < 1 || start > end || end > tasks.length) {
        setNotice(
          `Choose a valid TSKID range between 1 and ${tasks.length}.`,
          "info",
          "Export Not Completed",
        );
        render();
        return;
      }

      const selectedEntries = tasks.slice(start - 1, end);
      const fileName = `${slugifyFilenamePart(change.project, "project")}-${slugifyFilenamePart(change.title, "change")}-tasks-tskid-${start}-to-${end}.txt`;
      const content = buildChangeTaskExportContent(change, selectedEntries, start);
      downloadTextFile(fileName, content);
      setNotice(`Tasks TSKID ${start} to ${end} were exported.`, "success", "Tasks Exported");
      render();
    });

    bindSimpleAction("open-note-modal", () => {
      if (!ensureAuthenticatedView("change-detail", "Sign in to create notes.")) {
        render();
        return;
      }
      closeChangeHeaderMenu(state);
      clearNoteComposerState(state);
      state.noteModalOpen = true;
      render();
    });

    bindSimpleAction("save-note", async () => {
      const text = overlayNode.querySelector("[data-field='note-text']")?.value.trim() ?? "";
      state.noteLinkedTaskIds = Array.from(
        overlayNode.querySelectorAll("[data-field='note-task-link']:checked"),
        (node) => node.value,
      );
      if (!text) {
        state.noteFormError = "The note cannot be empty.";
        render();
        return;
      }
      const change = state.data.changes.find((item) => item.id === state.selectedChangeId);
      if (!change) {
        state.noteFormError = "The change associated with the note was not found.";
        render();
        return;
      }
      const project = (state.data.projects ?? []).find((item) => item.name === change.project);
      state.noteFormError = "";
      const nextData = await runProtectedAction(() => saveNote(state.data, {
        text,
        projectId: project?.id ?? null,
        project: change.project,
        changeId: change.id,
        change: change.title,
        status: "Pendiente",
        assigneeNames: change.assignees ?? [],
        linkedTaskIds: state.noteLinkedTaskIds,
      }, state.editingNoteId), {
        authMessage: "Your session expired while saving the note.",
        errorTitle: "Note Not Saved"
      });
      if (!nextData) {
        render();
        return;
      }
      state.data = nextData;
      clearNoteComposerState(state);
      applySyncNotice("Note Saved", "The note was saved successfully.", "Note Not Synced");
      render();
    });

    bindSimpleAction("cancel-note-edit", () => {
      closeNoteDialog();
      render();
    });

    viewNode.querySelectorAll("[data-action='edit-note']").forEach((node) => {
      node.addEventListener("click", () => {
        const noteId = node.dataset.noteId;
        const note = state.data.mentionedNotes?.find((item) => item.id === noteId);
        closeChangeHeaderMenu(state);
        state.editingNoteId = noteId;
        state.noteDraftText = note?.text ?? "";
        state.noteFormError = "";
        state.noteLinkedTaskIds = [...(note?.linkedTaskIds ?? [])];
        state.noteModalOpen = true;
        render();
      });
    });

    viewNode.querySelectorAll("[data-action='toggle-note-status']").forEach((node) => {
      node.addEventListener("click", async () => {
        const nextData = await runProtectedAction(() => toggleNoteStatus(state.data, node.dataset.noteId), {
          authMessage: "Your session expired while updating the note.",
          errorTitle: "Note Not Updated"
        });
        if (!nextData) {
          render();
          return;
        }
        state.data = nextData;
        applySyncNotice("Note Updated", "The note status was updated.", "Note Not Synced");
        render();
      });
    });

    viewNode.querySelectorAll("[data-action='delete-note']").forEach((node) => {
      node.addEventListener("click", async () => {
        openConfirmDialog(
          "Delete note",
          "This note will be marked as logically deleted.",
          async () => {
            const nextData = await runProtectedAction(() => softDeleteNote(state.data, node.dataset.noteId), {
              authMessage: "Your session expired while deleting the note.",
              errorTitle: "Note Not Deleted"
            });
            if (!nextData) {
              return;
            }
            state.data = nextData;
            if (state.editingNoteId === node.dataset.noteId) {
              clearNoteComposerState(state);
            }
            applySyncNotice("Note Deleted", "The note was marked as logically deleted.", "Note Not Synced");
          }
        );
        render();
      });
    });
  }

  function bindSimpleAction(actionName, handler) {
    viewNode.querySelectorAll(`[data-action='${actionName}']`).forEach((node) => {
      node.addEventListener("click", handler);
    });
    overlayNode.querySelectorAll(`[data-action='${actionName}']`).forEach((node) => {
      node.addEventListener("click", handler);
    });
  }

  appNode.append(navbar, viewNode, overlayNode);
  rootNode.appendChild(appNode);
  render();

  await reloadWorkspaceState(state, "workspace.initialize.bootstrap");
  state.isReady = true;
  render();
  void refreshChromeReleaseUpdate(false);
}

function buildUrlRowMarkup(index) {
  return `
    <div class="list-group-item d-grid gap-2" data-url-row>
      <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
        <strong>URL ${index}</strong>
        <button type="button" class="btn btn-secondary btn-sm" data-action="remove-url-row">Remove</button>
      </div>
      <label class="form-label">Name</label>
      <input class="form-control" type="text" value="" data-field="url-label">
      <label class="form-label">URL</label>
      <input class="form-control" type="text" value="" data-field="url-value">
    </div>
  `;
}

function readProjectPayload(viewNode) {
  return {
    name: viewNode.querySelector("[data-field='project-name']")?.value.trim() ?? "",
    description: viewNode.querySelector("[data-field='project-description']")?.value.trim() ?? "",
    startDate: viewNode.querySelector("[data-field='project-start-date']")?.value.trim() ?? "",
    workfrontLink: viewNode.querySelector("[data-field='project-workfront']")?.value.trim() ?? "",
    onedriveLink: viewNode.querySelector("[data-field='project-onedrive']")?.value.trim() ?? "",
    qaRows: readUrlRows(viewNode, "QA"),
    stgRows: readUrlRows(viewNode, "STG"),
    prodRows: readUrlRows(viewNode, "PROD")
  };
}

function readUrlRows(viewNode, groupName) {
  const group = viewNode.querySelector(`[data-env-group='${groupName}']`);
  if (!group) {
    return [];
  }

  return Array.from(group.querySelectorAll("[data-url-row]")).map((row) => ({
    label: row.querySelector("[data-field='url-label']")?.value ?? "",
    value: row.querySelector("[data-field='url-value']")?.value ?? ""
  }));
}

function readChoice(viewNode, groupName, fallback) {
  const activeChoice = viewNode.querySelector(`[data-choice-group='${groupName}'].active`);
  return activeChoice?.dataset.choiceValue || activeChoice?.textContent?.trim() || fallback;
}

function readChangePayload(viewNode, state) {
  const visibleProjects = getVisibleProjects(state.data);
  const selectedProject = state.selectedProjectId
    ? visibleProjects.find((project) => project.id === state.selectedProjectId)
    : visibleProjects[0];
  return {
    title: viewNode.querySelector("[data-field='change-title']")?.value.trim() ?? "",
    description: viewNode.querySelector("[data-field='change-description']")?.value.trim() ?? "",
    projectId: selectedProject?.id ?? null,
    project: selectedProject?.name ?? "Project",
    status: readChoice(viewNode, "change-status", "Pendiente"),
    priority: readChoice(viewNode, "change-priority", "Media"),
    environment: readChoice(viewNode, "change-environment", "QA"),
    assignees: (viewNode.querySelector("[data-field='change-assignees']")?.value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    workfrontLink: viewNode.querySelector("[data-field='change-workfront']")?.value.trim() ?? "",
    onedriveLink: viewNode.querySelector("[data-field='change-onedrive']")?.value.trim() ?? "",
    visibleEnvironments: [
      viewNode.querySelector("[data-field='show-qa-links']")?.checked ? "QA" : null,
      viewNode.querySelector("[data-field='show-stg-links']")?.checked ? "STG" : null,
      viewNode.querySelector("[data-field='show-prod-links']")?.checked ? "PROD" : null
    ].filter(Boolean)
  };
}

function validateProjectPayload(payload) {
  if (!payload.name) {
    return "The project name is required.";
  }
  return "";
}

function validateChangePayload(payload) {
  const fieldErrors = {};

  if (!payload.title) {
    fieldErrors.title = "The change name is required.";
  }
  if (!payload.assignees.length) {
    fieldErrors.assignees = "You must assign at least one person.";
  }
  if (!payload.workfrontLink) {
    fieldErrors.workfrontLink = "The Workfront link is required.";
  }
  if (!payload.onedriveLink) {
    fieldErrors.onedriveLink = "The OneDrive link is required.";
  }
  if (!payload.visibleEnvironments.length) {
    fieldErrors.visibleEnvironments = "You must leave at least one environment visible.";
  }

  const firstError = Object.values(fieldErrors)[0] ?? "";
  return {
    formError: firstError,
    fieldErrors
  };
}

function getNoteMentionSuggestions(data, draftText) {
  const match = draftText.match(/(?:^|\s)@([A-Za-z0-9._-]*)$/);
  if (!match) {
    return [];
  }

  const query = match[1].toLowerCase();
  const directory = new Map();

  (data?.users ?? []).forEach((user) => {
    const value = toMentionValue(user.name);
    if (value) {
      directory.set(value.toLowerCase(), {
        value,
        label: `${user.name} (${user.email})`
      });
    }
  });

  if (data?.user?.name) {
    const value = toMentionValue(data.user.name);
    if (value && !directory.has(value.toLowerCase())) {
      directory.set(value.toLowerCase(), {
        value,
        label: `${data.user.name} (${data.user.email ?? "no email"})`
      });
    }
  }

  (data?.changes ?? []).forEach((change) => {
    (change.assignees ?? []).forEach((assignee) => {
      const value = toMentionValue(assignee);
      if (value && !directory.has(value.toLowerCase())) {
        directory.set(value.toLowerCase(), {
          value,
          label: assignee
        });
      }
    });
  });

  return Array.from(directory.values())
    .filter((item) => !query || item.value.toLowerCase().includes(query) || item.label.toLowerCase().includes(query))
    .slice(0, 6);
}

function applyMentionToDraft(draftText, mentionValue) {
  return draftText.replace(/(^|\s)@([A-Za-z0-9._-]*)$/, `$1@${mentionValue} `);
}

function getAssigneeMentionSuggestions(data, draftText) {
  const match = draftText.match(/(?:^|,\s*)@([^,]*)$/);
  if (!match) {
    return [];
  }

  const query = match[1].trim().toLowerCase();
  const directory = new Map();

  (data?.users ?? []).forEach((user) => {
    const name = (user.name ?? "").trim();
    if (!name) {
      return;
    }
    directory.set(name.toLowerCase(), {
      value: name,
      label: user.email ? `${user.name} (${user.email})` : user.name
    });
  });

  if (data?.user?.name) {
    const ownName = data.user.name.trim();
    if (ownName && !directory.has(ownName.toLowerCase())) {
      directory.set(ownName.toLowerCase(), {
        value: ownName,
        label: data.user.email ? `${data.user.name} (${data.user.email})` : data.user.name
      });
    }
  }

  return Array.from(directory.values())
    .filter((item) => !query || item.value.toLowerCase().includes(query) || item.label.toLowerCase().includes(query))
    .slice(0, 6);
}

function applyAssigneeSuggestion(draftText, assigneeValue) {
  return draftText.replace(/(^|,\s*)@([^,]*)$/, (_, prefix) => `${prefix}${assigneeValue}, `);
}

function toMentionValue(name) {
  return (name ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^A-Za-z0-9._-]/g, "");
}
