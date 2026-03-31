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
  initializeWorkspace,
  saveChange,
  saveNote,
  saveProfileName,
  saveProject,
  softDeleteChange,
  softDeleteNote,
  softDeleteProject,
  toggleNoteStatus
} from "./services/workspace-store.js";
import { pickNativeDirectoryPath } from "./services/native-host.js";
import {
  PROJECT_ACTIVITY_FILTERS,
  translatePriority,
  translateStatus
} from "./services/ui-copy.js";
import { getVisibleProjects } from "./services/workspace-selectors.js";
import { renderProjectTrackBrand } from "./components/projecttrack-brand.js";

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

function getNavBarInfo(state) {
  if (state.currentView === "dashboard") {
    return { title: "Home", breadcrumb: "Home / Dashboard" };
  }

  if (state.currentView === "projects") {
    return { title: "Projects", breadcrumb: "Home / Projects" };
  }

  if (state.currentView === "project-editor" && state.projectEditorMode === "create") {
    return { title: "New Project", breadcrumb: "Home / Projects / New" };
  }

  if (state.currentView === "project-editor" && state.projectEditorMode === "edit") {
    return { title: "Edit Project", breadcrumb: "Home / Projects / Details / Edit" };
  }

  if (state.currentView === "login") {
    return { title: "Login", breadcrumb: "Home / Login" };
  }

  if (state.currentView === "profile") {
    return { title: "Profile", breadcrumb: "Home / Profile" };
  }

  if (state.currentView === "project-detail") {
    return { title: "Project Details", breadcrumb: "Home / Projects / Details" };
  }

  if (state.currentView === "changes") {
    return { title: "Project Changes", breadcrumb: "Home / Projects / Details / Changes" };
  }

  if (state.currentView === "change-detail") {
    return { title: "Change Details", breadcrumb: "Home / Projects / Details / Changes / Details" };
  }

  if (state.currentView === "change-editor" && state.changeEditorMode === "create") {
    return { title: "New Change", breadcrumb: "Home / Projects / Details / Changes / New" };
  }

  if (state.currentView === "change-editor" && state.changeEditorMode === "edit") {
    return { title: "Edit Change", breadcrumb: "Home / Projects / Details / Changes / Edit" };
  }

  return { title: "ProjectTrack", breadcrumb: "Home" };
}

function renderBreadcrumbTrail(label) {
  const segments = String(label || "")
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!segments.length) {
    return "";
  }

  return `
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb">
        ${segments.map((segment, index) => `
          <li class="breadcrumb-item${index === segments.length - 1 ? " active" : ""}"${index === segments.length - 1 ? ' aria-current="page"' : ""}>${segment}</li>
        `).join("")}
      </ol>
    </nav>
  `;
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
  state.noteFormError = "";
  state.noteDraftText = "";
  state.noteModalOpen = false;
  state.editingNoteId = null;
  state.backendConfigMessage = "";
  state.authMessage = "";
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

function clearChangeEditorState(state) {
  state.changeFormError = "";
  state.changeFieldErrors = {};
  state.changeEditorDraft = null;
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
  state.noteFormError = "";
  state.noteDraftText = "";
  state.noteModalOpen = false;
  state.editingNoteId = null;
  state.navMenuOpen = false;
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
    state.noteFormError = "";
    state.noteDraftText = "";
    state.noteModalOpen = false;
    state.editingNoteId = null;
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

export async function mountProjectTrackApp(rootNode) {
  const state = createProjectTrackState();
  let noticeTimeoutId = null;
  let noticeFadeTimeoutId = null;
  const appNode = document.createElement("div");
  appNode.className = "pt-app";

  const navbar = document.createElement("nav");
  navbar.className = "navbar navbar-expand-sm pt-navbar";
  navbar.setAttribute("aria-label", "ProjectTrack main navigation");
  const viewNode = document.createElement("section");
  viewNode.className = "pt-view";
  const overlayNode = document.createElement("div");
  overlayNode.className = "pt-overlay-layer";

  const tabItems = [
    ["dashboard", "Dashboard"],
    ["projects", "Projects"],
    ["changes", "Changes"],
    ["profile", "Profile"]
  ];

  function renderNavBar() {
    if (state.currentView === "login") {
      navbar.hidden = true;
      navbar.innerHTML = "";
      return;
    }

    navbar.hidden = false;
    const navBarInfo = getNavBarInfo(state);
    navbar.innerHTML = `
      <div class="container-fluid pt-navbar-top">
        <button type="button" class="navbar-brand pt-navbar-copy pt-navbar-brand-button" data-action="navigate-main" data-view-id="dashboard" aria-label="Go to Home / Dashboard">
          <div class="pt-navbar-brand-row">
            ${renderProjectTrackBrand(52)}
            <h1>ProjectTrack</h1>
          </div>
          ${renderBreadcrumbTrail(navBarInfo.breadcrumb)}
        </button>
        <div class="dropdown pt-avatar-area">
          <button type="button" class="pt-avatar-card pt-avatar-button" data-action="toggle-nav-menu" aria-expanded="${state.navMenuOpen ? "true" : "false"}" aria-label="Open main menu">
            <span class="pt-avatar-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.86 0-7 2.24-7 5v1h14v-1c0-2.76-3.14-5-7-5Z" />
              </svg>
            </span>
          </button>
          ${state.navMenuOpen ? `
            <div class="dropdown-menu dropdown-menu-end show pt-avatar-menu">
              ${tabItems.map(([id, label]) => {
                const isBase = id === state.currentView;
                const isProjectBranch = id === "projects" && ["project-detail", "project-editor"].includes(state.currentView);
                const isChangeBranch = id === "changes" && ["change-detail", "change-editor"].includes(state.currentView);
                const isActive = isBase || isProjectBranch || isChangeBranch;
                return `<button type="button" class="dropdown-item pt-avatar-menu-item ${isActive ? "active" : ""}" data-action="navigate-main" data-view-id="${id}">${label}</button>`;
              }).join("")}
            </div>
          ` : ""}
        </div>
      </div>
      ${renderNotice()}
    `;
  }

  function renderNotice() {
    if (!state.notice?.message) {
      return "";
    }

    const toneClass = state.notice.tone === "success" ? "alert-success" : "alert-info";
    const closingClass = state.notice.closing ? "pt-inline-notice-card--closing" : "";
    return `
      <section class="alert alert-dismissible pt-inline-notice-toast ${toneClass} ${closingClass}" role="status" aria-live="polite">
        <strong class="alert-heading">${state.notice.title || "Notice"}</strong>
        <p>${state.notice.message}</p>
        <button type="button" class="btn-close" data-action="dismiss-notice" aria-label="Close notice">X</button>
      </section>
    `;
  }

  function renderConfirmDialog() {
    if (!state.confirmDialog?.open) {
      return;
    }

    overlayNode.innerHTML = `
      <div class="modal show" role="alertdialog" aria-modal="true" aria-label="${state.confirmDialog.title || "Confirm action"}">
        <div class="modal-backdrop"></div>
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
              <button type="button" class="btn btn-danger" data-action="confirm-dialog-accept">Confirm</button>
              <button type="button" class="btn btn-secondary" data-action="confirm-dialog-cancel">Cancel</button>
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

  function openConfirmDialog(title, message, onConfirm) {
    state.confirmDialog = {
      open: true,
      title,
      message,
      onConfirm
    };
  }

  function closeConfirmDialog() {
    state.confirmDialog = null;
  }

  function renderNoteDialog() {
    if (!state.noteModalOpen) {
      return false;
    }

    overlayNode.innerHTML = `
      <div class="modal show" role="dialog" aria-modal="true" aria-label="${state.editingNoteId ? "Edit note" : "New note"}">
        <div class="modal-backdrop"></div>
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
              <div class="pt-project-editor-form">
                <label class="form-label">Note</label>
                <textarea class="form-control" data-field="note-text" placeholder="Write a note or TO-DO for this change...">${state.noteDraftText || ""}</textarea>
                <div class="pt-note-mention-suggestions" data-note-mention-suggestions hidden></div>
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
    state.noteModalOpen = false;
    state.noteFormError = "";
    state.noteDraftText = "";
    state.editingNoteId = null;
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
    if (targetView === "profile" || targetView === "login" || hasAuthenticatedSession(state)) {
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
    if (!state.isReady) {
      viewNode.className = "pt-view";
      viewNode.innerHTML = `
        <section class="pt-empty-state-card pt-empty-state-card--loading">
          <strong>Loading ProjectTrack</strong>
          <p>Preparing session, credentials and remote data load.</p>
        </section>
      `;
      overlayNode.innerHTML = "";
      return;
    }

    viewNode.className = state.currentView === "login" ? "pt-view pt-view--login" : "pt-view";
    renderNavBar();
    viewNode.innerHTML = renderProjectTrackView(state, state.data);
    overlayNode.innerHTML = "";
    if (!renderNoteDialog()) {
      renderConfirmDialog();
    }
    wireActions();
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
    navbar.querySelector("[data-action='toggle-nav-menu']")?.addEventListener("click", () => {
      state.navMenuOpen = !state.navMenuOpen;
      render();
    });

    navbar.querySelectorAll("[data-action='navigate-main']").forEach((node) => {
      node.addEventListener("click", () => {
        if (!ensureAuthenticatedView(node.dataset.viewId, "Sign in to open that screen.")) {
          render();
          return;
        }
        navigateMain(state, node.dataset.viewId);
        clearNotice();
        state.navMenuOpen = false;
        render();
      });
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
      state.projectSearchQuery = event.target.value;
      render();
    });

    viewNode.querySelector("[data-input='change-search']")?.addEventListener("input", (event) => {
      state.changeSearchQuery = event.target.value;
      render();
    });

    viewNode.querySelectorAll("[data-action='copy-link-value']").forEach((node) => {
      node.addEventListener("click", async () => {
        await copyTextToClipboard(decodeURIComponent(node.dataset.copyValue ?? ""));
        render();
      });
    });

    const noteTextarea = overlayNode.querySelector("[data-field='note-text']") ?? viewNode.querySelector("[data-field='note-text']");
    const noteSuggestionNode = overlayNode.querySelector("[data-note-mention-suggestions]") ?? viewNode.querySelector("[data-note-mention-suggestions]");
    if (noteTextarea && noteSuggestionNode) {
      const updateSuggestions = () => {
        state.noteDraftText = noteTextarea.value;
        const suggestions = getNoteMentionSuggestions(state.data, noteTextarea.value);
        noteSuggestionNode.innerHTML = suggestions.map((item) => `
          <button type="button" class="pt-note-suggestion-item" data-action="apply-note-mention" data-mention-value="${item.value}">
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

    const changeAssigneeInput = viewNode.querySelector("[data-field='change-assignees']");
    const changeAssigneeSuggestionNode = viewNode.querySelector("[data-change-assignee-suggestions]");
    if (changeAssigneeInput && changeAssigneeSuggestionNode) {
      const updateAssigneeSuggestions = () => {
        const suggestions = getAssigneeMentionSuggestions(state.data, changeAssigneeInput.value);
        changeAssigneeSuggestionNode.innerHTML = suggestions.map((item) => `
          <button type="button" class="pt-note-suggestion-item" data-action="apply-change-assignee" data-assignee-value="${item.value}">
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
      node.addEventListener("click", () => {
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
    });

    viewNode.querySelectorAll("[data-change-id]").forEach((node) => {
      node.addEventListener("click", () => {
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
            group.innerHTML = `<div class="pt-editor-empty-row" data-empty-row><span>No URLs configured.</span></div>`;
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
          group.innerHTML = `<div class="pt-editor-empty-row" data-empty-row><span>No URLs configured.</span></div>`;
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
      state.navMenuOpen = false;
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
      state.noteFormError = "";
      state.noteDraftText = "";
      state.editingNoteId = null;
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
      state.noteFormError = "";
      state.changeEditorMode = "edit";
      state.changeEditorReturnView = state.currentView;
      state.currentView = "change-editor";
      render();
    });
    bindSimpleAction("back-to-change-detail", () => {
      clearChangeEditorState(state);
      state.noteFormError = "";
      state.noteDraftText = "";
      state.noteModalOpen = false;
      state.editingNoteId = null;
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
      state.noteFormError = "";
      state.noteDraftText = "";
      state.noteModalOpen = false;
      state.editingNoteId = null;
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

    bindSimpleAction("open-note-modal", () => {
      if (!ensureAuthenticatedView("change-detail", "Sign in to create notes.")) {
        render();
        return;
      }
      closeChangeHeaderMenu(state);
      state.noteFormError = "";
      state.noteDraftText = "";
      state.editingNoteId = null;
      state.noteModalOpen = true;
      render();
    });

    bindSimpleAction("save-note", async () => {
      const text = overlayNode.querySelector("[data-field='note-text']")?.value.trim() ?? "";
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
        assigneeNames: change.assignees ?? []
      }, state.editingNoteId), {
        authMessage: "Your session expired while saving the note.",
        errorTitle: "Note Not Saved"
      });
      if (!nextData) {
        render();
        return;
      }
      state.data = nextData;
      state.noteDraftText = "";
      state.noteModalOpen = false;
      state.editingNoteId = null;
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
              state.noteModalOpen = false;
              state.editingNoteId = null;
              state.noteDraftText = "";
              state.noteFormError = "";
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
}

function buildUrlRowMarkup(index) {
  return `
    <div class="pt-editor-url-row" data-url-row>
      <div class="pt-editor-url-header">
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
