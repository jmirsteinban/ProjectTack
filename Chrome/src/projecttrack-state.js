export function createProjectTrackState(options = {}) {
  const initialView = typeof options.initialView === "string" && options.initialView.trim()
    ? options.initialView.trim()
    : "dashboard";
  const initialProjectEditorMode = options.initialProjectEditorMode === "create" ? "create" : "edit";
  const initialChangeEditorMode = options.initialChangeEditorMode === "create" ? "create" : "edit";

  return {
    isReady: false,
    data: null,
    backendStatus: null,
    backendSession: {
      accessToken: "",
      refreshToken: "",
      expiresAt: null,
      user: null
    },
    savedCredentials: {
      email: "",
      password: "",
      updatedAt: null,
      lastValidatedAt: null
    },
    authState: {
      hasAuthenticated: false,
      manuallyLoggedOut: false,
      updatedAt: null
    },
    authIsSubmitting: false,
    authPendingStep: "",
    authMessage: "",
    backendConfig: {
      url: "",
      publishableKey: "",
      updatedAt: null
    },
    backendConfigMessage: "",
    releaseUpdate: {
      status: "idle",
      currentVersion: "",
      latestVersion: "",
      releaseId: "",
      releaseName: "",
      releaseUrl: "",
      downloadUrl: "",
      assetName: "",
      publishedAt: "",
      checkedAt: "",
      message: "Update check has not run yet."
    },
    notice: null,
    confirmDialog: null,
    navMenuOpen: false,
    viewHistory: [],
    currentView: initialView,
    projectDetailReturnView: "projects",
    changeDetailReturnView: "changes",
    projectEditorReturnView: "project-detail",
    changeEditorReturnView: "change-detail",
    selectedChangeId: options.initialSelectedChangeId || null,
    selectedProjectId: options.initialSelectedProjectId || null,
    projectEditorMode: initialProjectEditorMode,
    changeEditorMode: initialChangeEditorMode,
    projectFormError: "",
    changeFormError: "",
    changeFieldErrors: {},
    changeEditorDraft: null,
    changeHeaderMenu: null,
    taskImportMode: "import",
    noteFormError: "",
    noteDraftText: "",
    noteLinkedTaskIds: [],
    noteModalOpen: false,
    editingNoteId: null,
    taskExportStart: "",
    taskExportEnd: "",
    projectSearchQuery: "",
    projectActivityFilter: "All",
    changeSearchQuery: ""
  };
}
