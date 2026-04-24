import { renderHeroCard } from "../components/hero-card.js";
import { canAccessAdminDirectory } from "../services/access-control.js";
import { escapeAttribute, escapeHtml } from "../services/html.js";

function summaryCard(label, value) {
  return `
    <div class="col-12 col-md-6 col-xl-3">
      <article class="card bg-light border-0 h-100">
        <div class="card-body">
          <p class="text-secondary small mb-1">${escapeHtml(label)}</p>
          <strong>${escapeHtml(String(value))}</strong>
        </div>
      </article>
    </div>
  `;
}

function configMessageTone(message) {
  const normalized = String(message ?? "").toLowerCase();
  if (!message) return "info";
  if (normalized.includes("you must complete") || normalized.includes("required")) return "danger";
  return "info";
}

function maskedKey(value) {
  if (!value) {
    return "Not configured";
  }
  if (value.length <= 8) {
    return value;
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function releaseStatusTone(status) {
  if (status === "available") return "warning";
  if (status === "current") return "success";
  if (status === "setup-required") return "warning";
  if (status === "auth-required") return "info";
  if (status === "error") return "danger";
  return "info";
}

function releaseStatusTitle(status) {
  if (status === "available") return "New version available";
  if (status === "current") return "Release channel is current";
  if (status === "setup-required") return "Release table setup required";
  if (status === "auth-required") return "Sign in required";
  if (status === "checking") return "Checking for updates";
  if (status === "error") return "Update check failed";
  return "Manual update channel";
}

function formatDate(value) {
  if (!value) {
    return "No date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

function roleBadge(user) {
  if (user.isGodMode) {
    return `<span class="badge text-bg-dark">God Mode</span>`;
  }
  if (user.isAdmin) {
    return `<span class="badge text-bg-primary">Admin</span>`;
  }
  return `<span class="badge text-bg-light border">User</span>`;
}

function visibilityBadge(user) {
  return user.hideFromWorkspace
    ? `<span class="badge text-bg-warning">Hidden from workspace flow</span>`
    : `<span class="badge text-bg-success">Visible in workspace flow</span>`;
}

function userRow(user, index) {
  const actions = user.isGodMode
    ? `<span class="text-secondary small">Password changes for God Mode stay outside this admin shortcut.</span>`
    : `<button type="button" class="btn btn-sm btn-outline-primary" data-action="admin-set-user-password" data-user-id="${escapeAttribute(user.id)}" data-user-name="${escapeAttribute(user.name || user.email || `User ${index + 1}`)}">Set password</button>`;

  return `
    <article class="list-group-item py-3">
      <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div class="min-w-0">
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <strong>${escapeHtml(user.name || user.email || `User ${index + 1}`)}</strong>
            ${roleBadge(user)}
            ${visibilityBadge(user)}
          </div>
          <p class="mb-1 mt-2 text-secondary">${escapeHtml(user.email || "No email")}</p>
          <code>${escapeHtml(user.id || "No id")}</code>
        </div>
        <div class="text-secondary small">
          ${escapeHtml(user.role || "Workspace User")}
        </div>
      </div>
      <div class="d-flex justify-content-end mt-3">
        ${actions}
      </div>
    </article>
  `;
}

export function renderAdminUsersScreen(state, data) {
  if (!canAccessAdminDirectory(data?.user)) {
    return `
      <section class="card bg-body-tertiary">
        <div class="card-body d-grid gap-2">
          <strong>Admin access required</strong>
          <p class="mb-0 text-secondary">This directory is only available to the ProjectTrack administrator account.</p>
        </div>
      </section>
    `;
  }

  const directory = Array.isArray(data?.userDirectory) && data.userDirectory.length
    ? data.userDirectory
    : (data?.users ?? []);
  const hiddenUsers = directory.filter((user) => user.hideFromWorkspace);
  const adminUsers = directory.filter((user) => user.isAdmin);

  return `
    ${renderHeroCard({
      title: "Configuration",
      description:
        "Manage backend settings, release operations and administrative access for ProjectTrack.",
      meta: [
        `${directory.length} users`,
        `${hiddenUsers.length} hidden from workspace`,
        `${adminUsers.length} admin access`,
      ],
      actionsHtml: `<button type="button" class="btn btn-outline-light" data-action="navigate-main" data-view-id="profile">Back to Profile</button>`,
    })}

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h2 class="h5 fw-semibold mb-1">Backend</h2>
          <p class="text-secondary mb-0">Supabase connection used by the extension.</p>
        </div>
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label" for="backend-url">Supabase URL</label>
            <input
              id="backend-url"
              class="form-control"
              type="text"
              value="${escapeAttribute(state.backendConfig?.url ?? "")}"
              placeholder="https://your-project.supabase.co"
              data-field="backend-url"
            >
          </div>
          <div class="col-12">
            <label class="form-label" for="backend-publishable-key">Publishable Key</label>
            <input
              id="backend-publishable-key"
              class="form-control"
              type="password"
              value="${escapeAttribute(state.backendConfig?.publishableKey ?? "")}"
              placeholder="sb_publishable_..."
              data-field="backend-publishable-key"
            >
          </div>
          <div class="col-12 d-flex gap-2 flex-wrap">
            <button type="button" class="btn btn-primary" data-action="save-backend-config">Save Configuration</button>
            <button type="button" class="btn btn-secondary" data-action="clear-backend-config">Clear</button>
          </div>
          ${state.backendConfigMessage ? `<div class="col-12"><section class="alert alert-${configMessageTone(state.backendConfigMessage)} mb-0"><strong>Backend</strong><p class="mb-0">${escapeHtml(state.backendConfigMessage)}</p></section></div>` : ""}
          <div class="col-12">
            <p class="form-text mb-0">The configuration is stored in chrome.storage. Without a valid session, the extension does not show workspace data.</p>
          </div>
        </div>
        <div class="row g-3">
          ${summaryCard("Configured URL", state.backendConfig?.url || "Not configured")}
          ${summaryCard("Configured Key", maskedKey(state.backendConfig?.publishableKey ?? ""))}
          ${summaryCard("Mode", state.backendStatus?.mode ?? "auth-required")}
          ${summaryCard("Updated", state.backendConfig?.updatedAt ?? "No date")}
        </div>
      </div>
    </section>

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h2 class="h5 fw-semibold mb-1">Extension Updates</h2>
            <p class="text-secondary mb-0">Check the Supabase release channel. GitHub Releases stores the downloadable zip.</p>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <button type="button" class="btn btn-primary" data-action="check-extension-update" ${state.releaseUpdate?.status === "checking" ? "disabled" : ""}>Check Release Channel</button>
            <button type="button" class="btn btn-secondary" data-action="open-extension-release" ${state.releaseUpdate?.releaseUrl || state.releaseUpdate?.downloadUrl ? "" : "disabled"}>Open Release</button>
          </div>
        </div>
        <section class="alert alert-${releaseStatusTone(state.releaseUpdate?.status)} mb-0">
          <strong>${releaseStatusTitle(state.releaseUpdate?.status)}</strong>
          <p class="mb-0">${escapeHtml(state.releaseUpdate?.message || "Use Check Release Channel to compare the installed extension with Supabase metadata.")}</p>
        </section>
        <div class="row g-3">
          ${summaryCard("Installed Version", state.releaseUpdate?.currentVersion || "Unknown")}
          ${summaryCard("Supabase Release Channel", state.releaseUpdate?.latestVersion || "Not checked")}
          ${summaryCard("Release Source", "Supabase app_releases")}
          ${summaryCard("Package", state.releaseUpdate?.assetName || "ProjectTrack-Chrome.zip")}
          ${summaryCard("Published", formatDate(state.releaseUpdate?.publishedAt))}
          ${summaryCard("Last Check", formatDate(state.releaseUpdate?.checkedAt))}
        </div>
        <p class="form-text mb-0">Chrome cannot replace this unpacked extension by itself. The release check reads Supabase metadata, then opens the GitHub release for download. After downloading, unzip the package over the local Chrome folder and reload the extension from <code>chrome://extensions</code>.</p>
      </div>
    </section>

    <section class="alert alert-warning mb-0" role="status">
      <strong>Credential note</strong>
      <p class="mb-0">Supabase Auth does not expose user passwords to the Chrome client. This admin view uses a protected server-side function so God Mode can set a new password when SMTP is not available.</p>
    </section>

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h2 class="h5 fw-semibold mb-1">Directory Summary</h2>
          <p class="text-secondary mb-0">The God account stays outside the normal task, assignee and mention flow.</p>
        </div>
        <div class="row g-3">
          ${summaryCard("Total Users", directory.length)}
          ${summaryCard("Workspace Visible", directory.length - hiddenUsers.length)}
          ${summaryCard("Hidden From Workspace", hiddenUsers.length)}
          ${summaryCard("Admin Accounts", adminUsers.length)}
        </div>
      </div>
    </section>

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h2 class="h5 fw-semibold mb-1">Authenticated Directory</h2>
          <p class="text-secondary mb-0">This list comes from the shared user directory used by ProjectTrack.</p>
        </div>
        ${
          directory.length
            ? `<div class="list-group">${directory.map(userRow).join("")}</div>`
            : `<section class="alert alert-info mb-0"><strong>No users loaded</strong><p class="mb-0">Sign in and refresh the remote workspace to load the directory.</p></section>`
        }
      </div>
    </section>
  `;
}
