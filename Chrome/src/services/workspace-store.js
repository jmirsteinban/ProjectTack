import {
  ensureAuthenticatedBackendSession,
  fetchRemoteWorkspaceData,
  importRemoteChangeTasks,
  isBackendAuthError,
  loadBackendAuthState,
  loadBackendConfig,
  loadBackendSession,
  loadBackendStatus,
  loadSavedBackendCredentials,
  saveRemoteChange,
  saveRemoteNote,
  saveRemoteProject,
  replaceRemoteChangeTasks,
  softDeleteRemoteChange,
  softDeleteRemoteNote,
  softDeleteRemoteProject,
  toggleRemoteNoteStatus,
  updateRemoteChangeTask
} from "./backend.js";

let lastWorkspaceSyncMeta = {
  channel: "auth-required",
  operation: "idle",
  ok: false,
  message: "Session required"
};

let lastWorkspaceMutationMeta = {
  operation: "idle",
  ok: false,
  createdProjectId: null,
  createdChangeId: null,
  createdNoteId: null,
  importedTaskCount: 0,
  updatedTaskCount: 0,
  deletedTaskCount: 0,
  taskImportMode: "import"
};

function setWorkspaceSyncMeta(meta) {
  lastWorkspaceSyncMeta = {
    ...lastWorkspaceSyncMeta,
    ...meta
  };
}

export function getLastWorkspaceSyncMeta() {
  return { ...lastWorkspaceSyncMeta };
}

function setWorkspaceMutationMeta(meta) {
  lastWorkspaceMutationMeta = {
    ...lastWorkspaceMutationMeta,
    ...meta
  };
}

export function getLastWorkspaceMutationMeta() {
  return { ...lastWorkspaceMutationMeta };
}

function toUrlMap(rows) {
  return rows.reduce((accumulator, row) => {
    const label = row.label.trim();
    const value = row.value.trim();
    if (label && value) {
      accumulator[label] = value;
    }
    return accumulator;
  }, {});
}

function createLockedWorkspace(seedData, session = null) {
  const base = structuredClone(seedData);
  const resolvedName =
    session?.user?.user_metadata?.display_name ||
    session?.user?.user_metadata?.full_name ||
    base.user.name;

  return {
    ...base,
    user: {
      ...base.user,
      id: session?.user?.id ?? base.user.id,
      email: session?.user?.email ?? base.user.email,
      name: resolvedName
    },
    users: session?.user?.email ? [{
      id: session.user.id ?? base.user.id,
      email: session.user.email,
      name: resolvedName
    }] : [],
    projects: [],
    changes: [],
    changeHistory: [],
    changeTasks: [],
    changeTaskEvents: [],
    mentionedNotes: [],
    taskFeatureStatus: {
      available: true,
      missingRelations: [],
      migrationFile: "Android/sql/change_tasks_excel_import_20260331.sql"
    },
    dashboardHero: {
      ...base.dashboardHero,
      openTodoCount: 0
    },
    qaSummary: {
      tests: 0,
      ok: 0,
      errors: 0,
      pending: 0
    },
    dashboardPanels: (base.dashboardPanels ?? []).map((panel) => ({
      ...panel,
      countLabel: "0"
    })),
    dashboardMetrics: (base.dashboardMetrics ?? []).map((metric) => ({
      ...metric,
      value: "0"
    }))
  };
}

async function getWorkspaceContext() {
  const [backendConfig, backendStatus, backendSession, savedCredentials, authState] = await Promise.all([
    loadBackendConfig(),
    loadBackendStatus(),
    loadBackendSession(),
    loadSavedBackendCredentials(),
    loadBackendAuthState()
  ]);

  return {
    backendConfig,
    backendStatus,
    backendSession,
    savedCredentials,
    authState
  };
}

async function executeRemoteMutation(operation, action, refreshData) {
  const backendConfig = await loadBackendConfig();
  setWorkspaceMutationMeta({
    operation,
    ok: false,
    createdProjectId: null,
    createdChangeId: null,
    createdNoteId: null,
    importedTaskCount: 0,
    updatedTaskCount: 0,
    deletedTaskCount: 0,
    taskImportMode: "import"
  });

  try {
    await ensureAuthenticatedBackendSession(backendConfig);
    const mutationMeta = await action(backendConfig);
    const remoteData = await fetchRemoteWorkspaceData(backendConfig, refreshData);
    setWorkspaceMutationMeta({
      operation,
      ok: true,
      ...(mutationMeta ?? {})
    });
    setWorkspaceSyncMeta({
      channel: "remote",
      operation,
      ok: true,
      message: "Data synced with Supabase"
    });
    return remoteData;
  } catch (error) {
    setWorkspaceMutationMeta({
      operation,
      ok: false,
      createdProjectId: null,
      createdChangeId: null,
      createdNoteId: null,
      importedTaskCount: 0,
      updatedTaskCount: 0,
      deletedTaskCount: 0,
      taskImportMode: "import"
    });
    setWorkspaceSyncMeta({
      channel: isBackendAuthError(error) ? "auth-required" : "remote-error",
      operation,
      ok: false,
      message: error.message || "The remote operation could not be completed"
    });
    throw error;
  }
}

export async function initializeWorkspace(seedData) {
  const context = await getWorkspaceContext();
  const lockedData = createLockedWorkspace(seedData, context.backendSession);

  try {
    await ensureAuthenticatedBackendSession(context.backendConfig);
    const remoteData = await fetchRemoteWorkspaceData(context.backendConfig, lockedData);
    const backendSession = await loadBackendSession();
    const backendStatus = {
      ...(await loadBackendStatus()),
      reason: `Remote read active: ${remoteData.projects.length} projects, ${remoteData.changes.length} changes`,
      mode: "remote-read"
    };
    setWorkspaceSyncMeta({
      channel: "remote",
      operation: "initialize",
      ok: true,
      message: backendStatus.reason
    });
    return {
      data: remoteData,
      backendConfig: context.backendConfig,
      backendStatus,
      backendSession,
      savedCredentials: await loadSavedBackendCredentials(),
      authState: await loadBackendAuthState()
    };
  } catch (error) {
    const backendStatus = isBackendAuthError(error)
      ? await loadBackendStatus()
      : {
          ...context.backendStatus,
          mode: "remote-error",
          reason: `Could not load the remote workspace: ${error.message || "unknown error"}`
        };

    setWorkspaceSyncMeta({
      channel: isBackendAuthError(error) ? "auth-required" : "remote-error",
      operation: "initialize",
      ok: false,
      message: backendStatus.reason
    });

    return {
      data: lockedData,
      backendConfig: context.backendConfig,
      backendStatus,
      backendSession: await loadBackendSession(),
      savedCredentials: context.savedCredentials,
      authState: context.authState
    };
  }
}

export async function saveProject(data, payload, mode, selectedProjectId) {
  return executeRemoteMutation(
    mode === "create" ? "create-project" : "update-project",
    (backendConfig) => saveRemoteProject(backendConfig, data, {
      ...payload,
      qaUrls: toUrlMap(payload.qaRows),
      stgUrls: toUrlMap(payload.stgRows),
      prodUrls: toUrlMap(payload.prodRows)
    }, mode, selectedProjectId),
    data
  );
}

export async function saveChange(data, payload, mode, selectedChangeId, options = {}) {
  return executeRemoteMutation(
    mode === "create" ? "create-change" : "update-change",
    (backendConfig) => saveRemoteChange(backendConfig, data, payload, mode, selectedChangeId, options),
    data
  );
}

export async function saveProfileName(data, name) {
  const nextData = structuredClone(data);
  nextData.user = {
    ...nextData.user,
    name: name || nextData.user.name
  };

  setWorkspaceSyncMeta({
    channel: "session",
    operation: "update-profile-name",
    ok: true,
    message: "Display name updated in memory only"
  });
  return nextData;
}

export async function softDeleteProject(data, selectedProjectId) {
  return executeRemoteMutation(
    "delete-project",
    (backendConfig) => softDeleteRemoteProject(backendConfig, selectedProjectId),
    data
  );
}

export async function softDeleteChange(data, selectedChangeId) {
  return executeRemoteMutation(
    "delete-change",
    (backendConfig) => softDeleteRemoteChange(backendConfig, selectedChangeId),
    data
  );
}

export async function saveNote(data, payload, editingNoteId) {
  return executeRemoteMutation(
    editingNoteId ? "update-note" : "create-note",
    (backendConfig) => saveRemoteNote(backendConfig, data, payload, editingNoteId),
    data
  );
}

export async function toggleNoteStatus(data, noteId) {
  const currentNote = (data.mentionedNotes ?? []).find((note) => note.id === noteId);
  if (!currentNote) {
    return data;
  }

  return executeRemoteMutation(
    "toggle-note",
    (backendConfig) => toggleRemoteNoteStatus(backendConfig, noteId, currentNote.status !== "Completado"),
    data
  );
}

export async function softDeleteNote(data, noteId) {
  return executeRemoteMutation(
    "delete-note",
    (backendConfig) => softDeleteRemoteNote(backendConfig, noteId),
    data
  );
}

export async function importChangeTasks(data, payload) {
  return executeRemoteMutation(
    "import-change-tasks",
    (backendConfig) => importRemoteChangeTasks(backendConfig, data, payload),
    data
  );
}

export async function replaceChangeTasks(data, payload) {
  return executeRemoteMutation(
    "replace-change-tasks",
    (backendConfig) => replaceRemoteChangeTasks(backendConfig, data, payload),
    data
  );
}

export async function updateChangeTask(data, taskId, payload) {
  return executeRemoteMutation(
    "update-change-task",
    (backendConfig) => updateRemoteChangeTask(backendConfig, taskId, payload),
    data
  );
}
