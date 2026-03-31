export function createProjectTrackState() {
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
    notice: null,
    confirmDialog: null,
    navMenuOpen: false,
    viewHistory: [],
    currentView: "dashboard",
    projectDetailReturnView: "projects",
    changeDetailReturnView: "changes",
    projectEditorReturnView: "project-detail",
    changeEditorReturnView: "change-detail",
    selectedChangeId: null,
    selectedProjectId: null,
    projectEditorMode: "edit",
    changeEditorMode: "edit",
    projectFormError: "",
    changeFormError: "",
    changeFieldErrors: {},
    changeEditorDraft: null,
    changeHeaderMenu: null,
    noteFormError: "",
    noteDraftText: "",
    noteModalOpen: false,
    editingNoteId: null,
    projectSearchQuery: "",
    projectActivityFilter: "All",
    changeSearchQuery: ""
  };
}
