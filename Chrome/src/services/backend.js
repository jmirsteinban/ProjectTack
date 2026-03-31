const CONFIG_KEY = "projecttrack.chrome.backend.config";
const SESSION_KEY = "projecttrack.chrome.backend.session";
const CREDENTIALS_KEY = "projecttrack.chrome.backend.credentials";
const AUTH_STATE_KEY = "projecttrack.chrome.backend.auth-state";
const DEFAULT_BACKEND_CONFIG = {
  url: "https://sbsntggoospecdlvjzet.supabase.co",
  publishableKey: "sb_publishable_v3vhryHWTv6NdK2jqRG6hg_i649bWZk"
};
const DEFAULT_AUTH_STATE = {
  hasAuthenticated: false,
  manuallyLoggedOut: false,
  updatedAt: null
};

function canUseChromeStorage() {
  return typeof chrome !== "undefined" && !!chrome.storage?.local;
}

function normalizeBackendConfig(config) {
  return {
    url: config?.url?.trim() ?? DEFAULT_BACKEND_CONFIG.url,
    publishableKey: config?.publishableKey?.trim() ?? DEFAULT_BACKEND_CONFIG.publishableKey,
    updatedAt: config?.updatedAt ?? null
  };
}

export async function loadBackendConfig() {
  if (!canUseChromeStorage()) {
    return normalizeBackendConfig({});
  }

  const result = await chrome.storage.local.get([CONFIG_KEY]);
  return normalizeBackendConfig(result[CONFIG_KEY]);
}

export async function saveBackendConfig(config) {
  if (!canUseChromeStorage()) {
    return normalizeBackendConfig(config);
  }

  const nextConfig = normalizeBackendConfig({
    ...config,
    updatedAt: new Date().toISOString()
  });
  await chrome.storage.local.set({ [CONFIG_KEY]: nextConfig });
  return nextConfig;
}

export async function clearBackendConfig() {
  if (!canUseChromeStorage()) {
    return;
  }

  await chrome.storage.local.remove(CONFIG_KEY);
}

function normalizeBackendSession(session) {
  return {
    accessToken: session?.accessToken ?? session?.access_token ?? "",
    refreshToken: session?.refreshToken ?? session?.refresh_token ?? "",
    expiresAt: session?.expiresAt ?? session?.expires_at ?? null,
    user: session?.user ?? null
  };
}

function normalizeSavedCredentials(credentials) {
  return {
    email: credentials?.email?.trim() ?? "",
    password: credentials?.password ?? "",
    updatedAt: credentials?.updatedAt ?? null,
    lastValidatedAt: credentials?.lastValidatedAt ?? null
  };
}

function normalizeAuthState(state) {
  return {
    hasAuthenticated: Boolean(state?.hasAuthenticated),
    manuallyLoggedOut: Boolean(state?.manuallyLoggedOut),
    updatedAt: state?.updatedAt ?? null
  };
}

export async function loadBackendSession() {
  if (!canUseChromeStorage()) {
    return normalizeBackendSession({});
  }

  const result = await chrome.storage.local.get([SESSION_KEY]);
  return normalizeBackendSession(result[SESSION_KEY]);
}

export async function saveBackendSession(session) {
  const normalized = normalizeBackendSession(session);
  if (!canUseChromeStorage()) {
    return normalized;
  }

  await chrome.storage.local.set({ [SESSION_KEY]: normalized });
  return normalized;
}

export async function clearBackendSession() {
  if (!canUseChromeStorage()) {
    return;
  }

  await chrome.storage.local.remove(SESSION_KEY);
}

export async function loadSavedBackendCredentials() {
  if (!canUseChromeStorage()) {
    return normalizeSavedCredentials({});
  }

  const result = await chrome.storage.local.get([CREDENTIALS_KEY]);
  return normalizeSavedCredentials(result[CREDENTIALS_KEY]);
}

export async function saveSavedBackendCredentials(credentials) {
  const normalized = normalizeSavedCredentials({
    ...credentials,
    updatedAt: new Date().toISOString()
  });
  if (!canUseChromeStorage()) {
    return normalized;
  }

  await chrome.storage.local.set({ [CREDENTIALS_KEY]: normalized });
  return normalized;
}

export async function clearSavedBackendCredentials() {
  if (!canUseChromeStorage()) {
    return;
  }

  await chrome.storage.local.remove(CREDENTIALS_KEY);
}

export async function loadBackendAuthState() {
  if (!canUseChromeStorage()) {
    return normalizeAuthState(DEFAULT_AUTH_STATE);
  }

  const result = await chrome.storage.local.get([AUTH_STATE_KEY]);
  return normalizeAuthState({
    ...DEFAULT_AUTH_STATE,
    ...result[AUTH_STATE_KEY]
  });
}

export async function saveBackendAuthState(partialState) {
  const current = await loadBackendAuthState();
  const normalized = normalizeAuthState({
    ...current,
    ...partialState,
    updatedAt: new Date().toISOString()
  });
  if (!canUseChromeStorage()) {
    return normalized;
  }

  await chrome.storage.local.set({ [AUTH_STATE_KEY]: normalized });
  return normalized;
}

export async function clearBackendAuthState() {
  if (!canUseChromeStorage()) {
    return;
  }

  await chrome.storage.local.remove(AUTH_STATE_KEY);
}

export async function markBackendManualLogout() {
  await clearBackendSession();
  return saveBackendAuthState({
    hasAuthenticated: true,
    manuallyLoggedOut: true
  });
}

function isSessionExpired(session) {
  if (!session?.accessToken) {
    return true;
  }

  if (!session.expiresAt) {
    return false;
  }

  const expiresAtMs = Number(session.expiresAt) * 1000;
  if (!Number.isFinite(expiresAtMs)) {
    return false;
  }

  return Date.now() >= expiresAtMs - 30_000;
}

export function isBackendAuthError(error) {
  const message = String(error?.message ?? "").toLowerCase();
  return [
    "se requiere iniciar sesion",
    "sign in required",
    "auth",
    "jwt",
    "token",
    "session",
    "sesion",
    "supabase 401",
    "supabase 403",
    "invalid login credentials",
    "refresh_token",
    "not authenticated"
  ].some((token) => message.includes(token));
}

export async function loadBackendStatus() {
  if (!canUseChromeStorage()) {
    return {
      connected: false,
      reason: "chrome.storage unavailable"
    };
  }

  const config = await loadBackendConfig();

  if (!config?.url || !config?.publishableKey) {
    return {
      connected: false,
      reason: "Backend not configured",
      mode: "local"
    };
  }

  const [session, credentials, authState] = await Promise.all([
    loadBackendSession(),
    loadSavedBackendCredentials(),
    loadBackendAuthState()
  ]);

  if (session.accessToken && !isSessionExpired(session)) {
    return {
      connected: true,
      reason: "Backend and session ready for remote fetch",
      mode: "authenticated",
      updatedAt: config.updatedAt ?? null
    };
  }

  if (authState.manuallyLoggedOut) {
    return {
      connected: true,
      reason: "Session closed manually. Sign in to continue.",
      mode: "manual-logout",
      updatedAt: config.updatedAt ?? null
    };
  }

  if (credentials.email && credentials.password) {
    return {
      connected: true,
      reason: "Session expired or missing. The extension can sign in automatically.",
      mode: "auto-login-ready",
      updatedAt: config.updatedAt ?? null
    };
  }

  return {
    connected: true,
    reason: authState.hasAuthenticated
      ? "The session is no longer valid. Sign in again."
      : "Backend ready, sign in required",
    mode: "auth-required",
    updatedAt: config.updatedAt ?? null
  };
}

function buildHeaders(config, session = null) {
  const bearer = session?.accessToken || config.publishableKey;
  return {
    apikey: config.publishableKey,
    Authorization: `Bearer ${bearer}`,
    Accept: "application/json"
  };
}

function buildRestUrl(config, pathAndQuery) {
  return `${config.url.replace(/\/+$/, "")}/rest/v1/${pathAndQuery}`;
}

async function requestJson(config, pathAndQuery, options = {}, session = null) {
  const response = await fetch(buildRestUrl(config, pathAndQuery), {
    method: options.method ?? "GET",
    headers: {
      ...buildHeaders(config, session),
      ...(options.body ? { "Content-Type": "application/json", Prefer: "return=representation" } : {}),
      ...(options.headers ?? {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase ${response.status}: ${body || response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function fetchJson(config, pathAndQuery, session = null) {
  return requestJson(config, pathAndQuery, { method: "GET" }, session);
}

function isMissingColumnError(error, columnName) {
  const message = String(error?.message ?? "").toLowerCase();
  return message.includes("does not exist") && message.includes(columnName.toLowerCase());
}

async function fetchUsersWithFallback(config, session) {
  const candidateQueries = [
    "users?select=id,user_id,email,display_name,full_name,name",
    "users?select=id,email,display_name,full_name,name",
    "users?select=id,email,full_name,name",
    "users?select=id,email,name",
    "users?select=id,email"
  ];

  let lastError = null;

  for (const query of candidateQueries) {
    try {
      return await fetchJson(config, query, session);
    } catch (error) {
      const message = String(error?.message ?? "").toLowerCase();
      if (!message.includes("does not exist")) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError ?? new Error("Could not read the users table");
}

function normalizeStatus(status) {
  switch (canonicalChangeStatus(status)) {
    case "pendiente":
      return "Pendiente";
    case "en_desarrollo":
      return "En desarrollo";
    case "en_revision_qa":
      return "En revision de QA";
    case "completado_qa":
      return "Completado";
    default: {
      const value = (status ?? "").trim();
      return value || "Pendiente";
    }
  }
}

function canonicalChangeStatus(status) {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

  switch (normalized) {
    case "":
    case "pendiente":
      return "pendiente";
    case "en progreso":
    case "en desarrollo":
    case "in progress":
      return "en_desarrollo";
    case "en revision de qa":
    case "en revision qa":
    case "revision qa":
    case "qa review":
    case "en qa":
      return "en_revision_qa";
    case "completado":
    case "completada":
    case "completed":
    case "done":
    case "qa aprobado":
    case "completado (qa aprobado)":
      return "completado_qa";
    default:
      return normalized;
  }
}

function normalizeStatusForRemoteWrite(status) {
  switch (canonicalChangeStatus(status)) {
    case "pendiente":
      return "Pendiente";
    case "en_desarrollo":
      return "En desarrollo";
    case "en_revision_qa":
      return "En revision de QA";
    case "completado_qa":
      return "Completado";
    default: {
      const value = String(status ?? "").trim();
      return value || "Pendiente";
    }
  }
}

function mapStatusToLegacyConstraint(status) {
  switch (canonicalChangeStatus(status)) {
    case "pendiente":
      return "Pendiente";
    case "en_desarrollo":
    case "en_revision_qa":
      return "En progreso";
    case "completado_qa":
      return "Completado";
    default: {
      const value = String(status ?? "").trim();
      return value || "Pendiente";
    }
  }
}

function isChangeStatusConstraintViolation(error) {
  const normalized = String(error?.message ?? "").toLowerCase();
  return normalized.includes("changes_status_check")
    || (normalized.includes("changes") && normalized.includes("status") && normalized.includes("constraint"));
}

function normalizeEnvironment(value) {
  const normalized = (value ?? "").trim().toUpperCase();
  if (normalized === "STG") return "STG";
  if (normalized === "PROD") return "PROD";
  return "QA";
}

function visibleEnvironmentsFromChange(row) {
  const environment = normalizeEnvironment(row.current_environment);
  const fallback = {
    QA: ["QA"],
    STG: ["QA", "STG"],
    PROD: ["QA", "STG", "PROD"]
  }[environment];

  const explicit = [
    row.show_qa_links ? "QA" : null,
    row.show_stg_links ? "STG" : null,
    row.show_prod_links ? "PROD" : null
  ].filter(Boolean);

  return explicit.length ? explicit : fallback;
}

function normalizeUserRow(row) {
  const id = row.id ?? row.user_id ?? row.email ?? "";
  const name = row.display_name ?? row.full_name ?? row.name ?? row.email ?? id;
  return {
    id,
    name,
    email: row.email ?? ""
  };
}

function toUrlMap(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function mapRemoteProjects(projectRows, changeRows) {
  return projectRows.map((row) => {
    const relatedChanges = changeRows.filter((change) => change.project_id === row.id);
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      createdAt: row.start_date ?? "",
      startDate: row.start_date ?? "",
      status: relatedChanges.some((change) => normalizeStatus(change.status) !== "Completado") ? "Activo" : "Completado",
      changes: relatedChanges.length,
      onedriveLink: row.onedrive_link ?? "",
      workfrontLink: row.workfront_link ?? "",
      qaUrls: toUrlMap(row.qa_urls),
      stgUrls: toUrlMap(row.stg_urls),
      prodUrls: toUrlMap(row.prod_urls)
    };
  });
}

function mapRemoteChanges(changeRows, projectsById, assigneesByChangeId, usersById) {
  return changeRows.map((row) => {
    const project = projectsById.get(row.project_id) ?? null;
    const assigneeIds = assigneesByChangeId.get(row.id) ?? [];
    const fallbackAssigned = row.assigned_to ? [row.assigned_to] : [];
    const combined = Array.from(new Set([...assigneeIds, ...fallbackAssigned]));
    const assignees = combined.map((id) => usersById.get(id)?.name || usersById.get(id)?.email || id);

    return {
      id: row.id,
      title: row.name,
      description: row.description ?? "",
      project: project?.name ?? row.project_id ?? "Project",
      status: normalizeStatus(row.status),
      environment: normalizeEnvironment(row.current_environment),
      priority: row.priority ?? "Media",
      assignees,
      workfrontLink: row.workfront_link ?? "",
      onedriveLink: row.onedrive_link ?? "",
      visibleEnvironments: visibleEnvironmentsFromChange(row)
    };
  });
}

function mapRemoteNotes(noteRows, projectsById, changesById, noteAssigneesByNoteId, usersById) {
  return noteRows.map((row) => {
    const project = projectsById.get(row.project_id) ?? null;
    const change = changesById.get(row.change_id) ?? null;
    const assigneeIds = noteAssigneesByNoteId.get(row.id) ?? [];
    const fallbackAssigned = row.assigned_to ? [row.assigned_to] : [];
    const combined = Array.from(new Set([...assigneeIds, ...fallbackAssigned]));
    const mentionUsers = combined.map((id) => {
      const resolved = usersById.get(id);
      const handleSource = resolved?.name || resolved?.email || id;
      const handle = `@${String(handleSource).replace(/\s+/g, "").replace(/[^A-Za-z0-9._-]/g, "")}`;
      return {
        id,
        name: resolved?.name || handleSource,
        email: resolved?.email || null,
        handle
      };
    });

    return {
      id: row.id,
      text: row.text ?? "",
      projectId: row.project_id ?? project?.id ?? null,
      project: project?.name ?? row.project_id ?? "Project",
      changeId: row.change_id ?? change?.id ?? null,
      change: change?.title ?? row.change_id ?? "Change",
      status: row.status ?? "Pendiente",
      isTodo: row.is_todo ?? true,
      createdBy: row.created_by ?? null,
      createdAt: row.created_at ?? null,
      mentions: Array.from(new Set((String(row.text ?? "").match(/@[A-Za-z0-9._-]+/g) ?? []))),
      mentionUsers
    };
  });
}

function mapRemoteChangeHistory(noteRows, projectsById, changesById, usersById) {
  return [...noteRows]
    .map((row) => {
      const project = projectsById.get(row.project_id) ?? null;
      const change = changesById.get(row.change_id) ?? null;
      const createdByUser = usersById.get(row.created_by);
      return {
        id: row.id,
        text: row.text ?? "",
        projectId: row.project_id ?? project?.id ?? null,
        project: project?.name ?? row.project_id ?? "Project",
        changeId: row.change_id ?? change?.id ?? null,
        change: change?.title ?? row.change_id ?? "Change",
        createdBy: row.created_by ?? null,
        createdByName: createdByUser?.name || createdByUser?.email || "Unknown user",
        createdAt: row.created_at ?? null
      };
    })
    .filter((entry) => entry.changeId)
    .sort((left, right) => {
      const leftTime = Date.parse(left.createdAt ?? "");
      const rightTime = Date.parse(right.createdAt ?? "");
      if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
      if (Number.isNaN(leftTime)) return 1;
      if (Number.isNaN(rightTime)) return -1;
      return rightTime - leftTime;
    });
}

export async function fetchRemoteWorkspaceData(config, currentData) {
  if (!config?.url || !config?.publishableKey) {
    throw new Error("Backend not configured");
  }

  const session = await ensureAuthenticatedBackendSession(config);

  const [projectRows, changeRows, changeAssigneeRows, noteRows, historyRows, noteAssigneeRows] = await Promise.all([
    fetchJson(
      config,
      "projects?select=id,name,description,start_date,onedrive_link,workfront_link,qa_urls,stg_urls,prod_urls,is_deleted&is_deleted=eq.false",
      session
    ),
    fetchJson(
      config,
      "changes?select=id,project_id,assigned_to,workfront_link,onedrive_link,current_environment,show_qa_links,show_stg_links,show_prod_links,name,description,status,priority,is_deleted&is_deleted=eq.false",
      session
    ),
    fetchJson(
      config,
      "change_assignees?select=change_id,user_id",
      session
    ),
    fetchJson(
      config,
      "project_notes?select=id,project_id,change_id,text,is_todo,status,created_by,assigned_to,created_at,is_deleted&is_todo=eq.true&is_deleted=eq.false",
      session
    ),
    fetchJson(
      config,
      "project_notes?select=id,project_id,change_id,text,is_todo,status,created_by,assigned_to,created_at,is_deleted&is_todo=eq.false&is_deleted=eq.false",
      session
    ),
    fetchJson(
      config,
      "project_note_assignees?select=note_id,user_id,mention_order",
      session
    )
  ]);

  const userRows = await fetchUsersWithFallback(config, session);

  const users = userRows.map(normalizeUserRow).filter((user) => user.id);
  const usersById = new Map(users.map((user) => [user.id, user]));
  const assigneesByChangeId = changeAssigneeRows.reduce((map, row) => {
    if (!row.change_id || !row.user_id) {
      return map;
    }
    const current = map.get(row.change_id) ?? [];
    current.push(row.user_id);
    map.set(row.change_id, current);
    return map;
  }, new Map());
  const noteAssigneesByNoteId = noteAssigneeRows.reduce((map, row) => {
    if (!row.note_id || !row.user_id) {
      return map;
    }
    const current = map.get(row.note_id) ?? [];
    current.push(row.user_id);
    map.set(row.note_id, current);
    return map;
  }, new Map());

  const projects = mapRemoteProjects(projectRows, changeRows);
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const changes = mapRemoteChanges(changeRows, projectsById, assigneesByChangeId, usersById);
  const changesById = new Map(changes.map((change) => [change.id, change]));
  const notes = mapRemoteNotes(noteRows, projectsById, changesById, noteAssigneesByNoteId, usersById);
  const changeHistory = mapRemoteChangeHistory(historyRows, projectsById, changesById, usersById);

  return {
    ...structuredClone(currentData),
    user: session.user?.email ? {
      ...currentData.user,
      email: session.user.email,
      id: session.user.id ?? currentData.user.id,
      name: session.user.user_metadata?.display_name || session.user.user_metadata?.full_name || currentData.user.name
    } : currentData.user,
    users: users.length ? users : currentData.users,
    projects,
    changes,
    changeHistory,
    mentionedNotes: notes
  };
}

export async function fetchRemoteUsersDirectory(config) {
  if (!config?.url || !config?.publishableKey) {
    throw new Error("Backend not configured");
  }

  const session = await ensureAuthenticatedBackendSession(config);

  const userRows = await fetchUsersWithFallback(config, session);
  return userRows.map(normalizeUserRow).filter((user) => user.id);
}

export async function signInWithPassword(config, email, password, options = {}) {
  const response = await fetch(`${config.url.replace(/\/+$/, "")}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: config.publishableKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.msg || payload.error_description || payload.message || `Supabase Auth ${response.status}`);
  }

  const session = await saveBackendSession({
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: payload.expires_at,
    user: payload.user ?? null
  });
  const shouldPersistCredentials = options.persistCredentials !== false;
  if (shouldPersistCredentials) {
    await saveSavedBackendCredentials({
      email,
      password,
      lastValidatedAt: new Date().toISOString()
    });
  }
  await saveBackendAuthState({
    hasAuthenticated: true,
    manuallyLoggedOut: false
  });
  return session;
}

function ensureAuthenticatedSession(session) {
  if (!session?.accessToken) {
    throw new Error("Sign in required");
  }
}

export async function attemptAutomaticSignIn(config) {
  const [credentials, authState] = await Promise.all([
    loadSavedBackendCredentials(),
    loadBackendAuthState()
  ]);

  if (authState.manuallyLoggedOut || !credentials.email || !credentials.password) {
    return null;
  }

  try {
    return await signInWithPassword(config, credentials.email, credentials.password, {
      persistCredentials: true
    });
  } catch (error) {
    await clearBackendSession();
    const message = String(error?.message ?? "").toLowerCase();
    const invalidCredentials = message.includes("invalid login credentials") || message.includes("supabase auth 400");
    if (invalidCredentials) {
      await clearSavedBackendCredentials();
      await saveBackendAuthState({
        hasAuthenticated: false,
        manuallyLoggedOut: false
      });
    }
    throw new Error(`Automatic session renewal failed: ${error.message || "invalid credentials"}`);
  }
}

export async function ensureAuthenticatedBackendSession(config, options = {}) {
  const session = await loadBackendSession();
  if (session.accessToken && !isSessionExpired(session)) {
    return session;
  }

  if (options.allowAutoSignIn !== false) {
    const renewedSession = await attemptAutomaticSignIn(config);
    if (renewedSession?.accessToken) {
      return renewedSession;
    }
  }

  await clearBackendSession();
  throw new Error("Sign in required");
}

function toRemoteProjectWrite(payload) {
  return {
    name: payload.name,
    description: payload.description || null,
    start_date: payload.startDate || null,
    onedrive_link: payload.onedriveLink || null,
    workfront_link: payload.workfrontLink || null,
    qa_urls: payload.qaUrls ?? {},
    stg_urls: payload.stgUrls ?? {},
    prod_urls: payload.prodUrls ?? {}
  };
}

function toRemoteChangeWrite(payload, assignedUserIds) {
  const visible = new Set(payload.visibleEnvironments ?? []);
  return {
    project_id: payload.projectId,
    assigned_to: assignedUserIds[0] ?? null,
    workfront_link: payload.workfrontLink || null,
    onedrive_link: payload.onedriveLink || null,
    current_environment: payload.environment || "QA",
    show_qa_links: visible.has("QA"),
    show_stg_links: visible.has("STG"),
    show_prod_links: visible.has("PROD"),
    name: payload.title,
    description: payload.description || null,
    status: normalizeStatusForRemoteWrite(payload.status || "Pendiente"),
    priority: payload.priority || "Media"
  };
}

function resolveAssignedUserIds(data, assigneeNames) {
  const byName = new Map((data?.users ?? []).map((user) => [(user.name ?? "").trim().toLowerCase(), user.id]));
  return Array.from(new Set(
    (assigneeNames ?? [])
      .map((name) => byName.get((name ?? "").trim().toLowerCase()))
      .filter(Boolean)
  ));
}

async function replaceChangeAssignees(config, session, changeId, userIds) {
  await requestJson(
    config,
    `change_assignees?change_id=eq.${encodeURIComponent(changeId)}`,
    { method: "DELETE", headers: { Prefer: "return=minimal" } },
    session
  );

  if (!userIds.length) {
    return;
  }

  await requestJson(
    config,
    "change_assignees",
    {
      method: "POST",
      body: userIds.map((userId) => ({
        change_id: changeId,
        user_id: userId
      }))
    },
    session
  );
}

export async function saveRemoteProject(config, data, payload, mode, selectedProjectId) {
  const session = await ensureAuthenticatedBackendSession(config);

  const body = toRemoteProjectWrite(payload);
  if (mode === "create") {
    const rows = await requestJson(config, "projects", { method: "POST", body }, session);
    return {
      createdProjectId: Array.isArray(rows) ? (rows[0]?.id ?? null) : (rows?.id ?? null)
    };
  }

  await requestJson(
    config,
    `projects?id=eq.${encodeURIComponent(selectedProjectId)}`,
    { method: "PATCH", body },
    session
  );
}

async function createChangeHistoryEntry(config, session, entry) {
  await requestJson(
    config,
    "project_notes",
    {
      method: "POST",
      body: {
        project_id: entry.projectId,
        change_id: entry.changeId,
        text: entry.text,
        is_todo: false,
        status: "Completado",
        created_by: entry.createdBy ?? session.user?.id ?? null,
        assigned_to: null
      }
    },
    session
  );
}

export async function saveRemoteChange(config, data, payload, mode, selectedChangeId, options = {}) {
  const session = await ensureAuthenticatedBackendSession(config);

  const assignedUserIds = resolveAssignedUserIds(data, payload.assignees);
  const body = toRemoteChangeWrite(payload, assignedUserIds);
  const legacyBody = {
    ...body,
    status: mapStatusToLegacyConstraint(body.status)
  };

  async function persistChange(writeBody) {
    if (mode === "create") {
      const rows = await requestJson(config, "changes", { method: "POST", body: writeBody }, session);
      const createdId = Array.isArray(rows) ? rows[0]?.id : rows?.id;
      if (createdId) {
        await replaceChangeAssignees(config, session, createdId, assignedUserIds);
      }
      return {
        createdChangeId: createdId ?? null
      };
    }

    await requestJson(
      config,
      `changes?id=eq.${encodeURIComponent(selectedChangeId)}`,
      { method: "PATCH", body: writeBody },
      session
    );
    await replaceChangeAssignees(config, session, selectedChangeId, assignedUserIds);
    return undefined;
  }

  async function persistChangeWithFallback() {
    try {
      return await persistChange(body);
    } catch (error) {
      const sameStatus = legacyBody.status === body.status;
      if (sameStatus || !isChangeStatusConstraintViolation(error)) {
        throw error;
      }

      return persistChange(legacyBody);
    }
  }

  const mutationMeta = await persistChangeWithFallback();
  const historyEntry = options?.historyEntry;
  const resolvedChangeId = mode === "create"
    ? mutationMeta?.createdChangeId ?? null
    : selectedChangeId;

  if (historyEntry?.text && historyEntry.projectId && resolvedChangeId) {
    await createChangeHistoryEntry(config, session, {
      ...historyEntry,
      changeId: resolvedChangeId
    });
  }

  return mutationMeta;
}

async function callRpc(config, fnName, body, session) {
  return requestJson(
    config,
    `rpc/${fnName}`,
    { method: "POST", body },
    session
  );
}

export async function softDeleteRemoteProject(config, projectId) {
  const session = await ensureAuthenticatedBackendSession(config);
  await callRpc(config, "soft_delete_project", { p_project_id: projectId }, session);
}

export async function softDeleteRemoteChange(config, changeId) {
  const session = await ensureAuthenticatedBackendSession(config);
  await callRpc(config, "soft_delete_change", { p_change_id: changeId }, session);
}

export async function softDeleteRemoteNote(config, noteId) {
  const session = await ensureAuthenticatedBackendSession(config);
  await callRpc(config, "soft_delete_note", { p_note_id: noteId }, session);
}

async function replaceNoteAssignees(config, session, noteId, userIds) {
  await requestJson(
    config,
    `project_note_assignees?note_id=eq.${encodeURIComponent(noteId)}`,
    { method: "DELETE", headers: { Prefer: "return=minimal" } },
    session
  );

  if (!userIds.length) {
    return;
  }

  await requestJson(
    config,
    "project_note_assignees",
    {
      method: "POST",
      body: userIds.map((userId, index) => ({
        note_id: noteId,
        user_id: userId,
        mention_order: index
      }))
    },
    session
  );
}

export async function saveRemoteNote(config, data, payload, editingNoteId) {
  const session = await ensureAuthenticatedBackendSession(config);

  const assignedUserIds = resolveAssignedUserIds(data, payload.assigneeNames ?? []);
  const body = {
    project_id: payload.projectId,
    change_id: payload.changeId,
    text: payload.text,
    is_todo: true,
    status: payload.status ?? "Pendiente",
    assigned_to: assignedUserIds[0] ?? null
  };

  if (editingNoteId) {
    await requestJson(
      config,
      `project_notes?id=eq.${encodeURIComponent(editingNoteId)}`,
      { method: "PATCH", body },
      session
    );
    await replaceNoteAssignees(config, session, editingNoteId, assignedUserIds);
    return;
  }

  const rows = await requestJson(config, "project_notes", { method: "POST", body }, session);
  const createdId = Array.isArray(rows) ? rows[0]?.id : rows?.id;
  if (createdId) {
    await replaceNoteAssignees(config, session, createdId, assignedUserIds);
  }
  return {
    createdNoteId: createdId ?? null
  };
}

export async function toggleRemoteNoteStatus(config, noteId, completed) {
  const session = await ensureAuthenticatedBackendSession(config);
  await requestJson(
    config,
    `project_notes?id=eq.${encodeURIComponent(noteId)}`,
    {
      method: "PATCH",
      body: {
        status: completed ? "Completado" : "Pendiente",
        is_todo: true
      }
    },
    session
  );
}
