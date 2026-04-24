export const GOD_MODE_EMAIL = "jmirsteinban@gmail.com";

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function toRoleLabel(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  if (!normalized) {
    return "";
  }

  return normalized
    .split(/\s+/)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

export function isGodModeEmail(email) {
  return normalizeEmail(email) === GOD_MODE_EMAIL;
}

export function normalizeWorkspaceUser(user = {}) {
  const email = String(user.email ?? "").trim();
  const rawRole =
    user.role ??
    user.user_role ??
    user.access_role ??
    "";
  const normalizedRole = String(rawRole ?? "").trim().toLowerCase();
  const isGodMode =
    Boolean(user.isGodMode) ||
    Boolean(user.is_god_mode) ||
    isGodModeEmail(email);
  const isAdmin =
    isGodMode ||
    ["admin", "administrator", "god", "god mode"].includes(normalizedRole);
  const hideFromWorkspace =
    Boolean(user.hideFromWorkspace) ||
    Boolean(user.hide_from_workspace) ||
    Boolean(user.hidden_from_workspace) ||
    Boolean(user.exclude_from_workspace) ||
    isGodMode;
  const role = isGodMode
    ? "God Mode"
    : (toRoleLabel(rawRole) || (isAdmin ? "Administrator" : "Workspace User"));

  return {
    id: user.id ?? user.user_id ?? email ?? "",
    name: String(
      user.name ??
      user.display_name ??
      user.full_name ??
      user.email ??
      user.id ??
      "",
    ).trim(),
    email,
    role,
    isAdmin,
    isGodMode,
    hideFromWorkspace,
  };
}

export function getVisibleWorkspaceUsers(users = []) {
  return users.filter((user) => !normalizeWorkspaceUser(user).hideFromWorkspace);
}

export function canAccessAdminDirectory(user) {
  const normalized = normalizeWorkspaceUser(user);
  return normalized.isAdmin || normalized.isGodMode;
}

export function buildCurrentWorkspaceUser(currentUser = {}, sessionUser = null, directoryUsers = []) {
  const sessionEmail = String(sessionUser?.email ?? currentUser?.email ?? "").trim();
  const sessionId = sessionUser?.id ?? currentUser?.id ?? "";
  const sessionName =
    sessionUser?.user_metadata?.display_name ||
    sessionUser?.user_metadata?.full_name ||
    currentUser?.name ||
    "";

  const matchedDirectoryUser = directoryUsers.find((user) => {
    const normalized = normalizeWorkspaceUser(user);
    return (
      (sessionId && normalized.id === sessionId) ||
      (sessionEmail && normalizeEmail(normalized.email) === normalizeEmail(sessionEmail))
    );
  });

  return normalizeWorkspaceUser({
    ...matchedDirectoryUser,
    ...currentUser,
    id: sessionId || matchedDirectoryUser?.id || currentUser?.id,
    email: sessionEmail || matchedDirectoryUser?.email || currentUser?.email,
    name: sessionName || matchedDirectoryUser?.name || currentUser?.name,
  });
}
