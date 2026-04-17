import { getVisibleChanges, getVisibleProjects } from "../services/workspace-selectors.js";
import { renderHeroCard } from "../components/hero-card.js";

function backendLabel(backendStatus) {
  if (!backendStatus) return "Local state";
  if (backendStatus.reason) return backendStatus.reason;
  if (backendStatus.connected) return "Backend connected";
  return backendStatus.reason || "Backend not configured";
}

function sessionLabel(session) {
  return session?.accessToken ? "Authenticated session" : "No session";
}

function credentialsLabel(savedCredentials) {
  return savedCredentials?.email ? "Saved credentials" : "No saved credentials";
}

function authFlowLabel(authState) {
  if (authState?.manuallyLoggedOut) return "Manual logout";
  if (authState?.hasAuthenticated) return "Auto re-login enabled";
  return "First login pending";
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

function summaryCard(label, value) {
  return `
    <div class="col-12 col-sm-6 col-xl-4">
      <article class="card bg-light border-0 h-100">
        <div class="card-body">
          <p class="text-secondary small mb-1">${escapeHtml(label)}</p>
          <strong>${escapeHtml(value)}</strong>
        </div>
      </article>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
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

export function renderProfileScreen(state, data) {
  const visibleProjects = getVisibleProjects(data);
  const visibleChanges = getVisibleChanges(data);
  const isSubmitting = Boolean(state.authIsSubmitting);
  const disabledAttr = isSubmitting ? "disabled" : "";
  const signInLabel = isSubmitting ? "Connecting..." : "Sign In";
  return `
    ${renderHeroCard({
      title: "Profile",
      meta: [
        sessionLabel(state.backendSession),
        backendLabel(state.backendStatus),
        credentialsLabel(state.savedCredentials)
      ],
      actionsHtml: `<button type="button" class="btn btn-outline-light" data-action="navigate-main" data-view-id="dashboard">Back</button>`
    })}

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h3 class="h5 fw-semibold mb-1">Preferences</h3>
            <p class="text-secondary mb-0">Personal settings for the active workspace session.</p>
          </div>
          <button type="button" class="btn btn-primary" data-action="save-profile-name">Save Name</button>
        </div>
        <div class="row g-3 align-items-end">
          <div class="col-12 col-lg-8">
            <label class="form-label" for="profile-display-name">Display Name</label>
            <input
              id="profile-display-name"
              class="form-control"
              type="text"
              value="${escapeAttribute(data.user.name)}"
              data-field="profile-display-name"
            >
          </div>
          <div class="col-12">
            <p class="form-text mb-0">This display name only lives in memory while the extension is open.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h3 class="h5 fw-semibold mb-1">Account</h3>
          <p class="text-secondary mb-0">Authenticated user identity and current access state.</p>
        </div>
        <div class="row g-3">
          ${summaryCard("Status", sessionLabel(state.backendSession))}
          ${summaryCard("Email", state.backendSession?.user?.email || data.user.email)}
          ${summaryCard("ID", state.backendSession?.user?.id || data.user.id || "mock-user-001")}
          ${summaryCard("Role", data.user.role)}
          ${summaryCard("Auth Flow", authFlowLabel(state.authState))}
        </div>
      </div>
    </section>

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h3 class="h5 fw-semibold mb-1">Extension Updates</h3>
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

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h3 class="h5 fw-semibold mb-1">Workspace</h3>
          <p class="text-secondary mb-0">Visible data and current workspace context.</p>
        </div>
        <div class="row g-3">
          ${summaryCard("Visible Projects", visibleProjects.length)}
          ${summaryCard("Visible Changes", visibleChanges.length)}
          ${summaryCard("Current Filter", state.projectActivityFilter)}
          ${summaryCard("Backend", backendLabel(state.backendStatus))}
          ${summaryCard("Credentials", credentialsLabel(state.savedCredentials))}
        </div>
      </div>
    </section>

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h3 class="h5 fw-semibold mb-1">Session</h3>
          <p class="text-secondary mb-0">Authentication for the remote workspace.</p>
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label" for="auth-email">Email</label>
            <input
              id="auth-email"
              class="form-control"
              type="email"
              value="${escapeAttribute(state.backendSession?.user?.email || state.savedCredentials?.email || data.user.email || "")}"
              placeholder="user@company.com"
              data-field="auth-email"
              ${disabledAttr}
            >
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label" for="auth-password">Password</label>
            <input
              id="auth-password"
              class="form-control"
              type="password"
              value=""
              placeholder="Enter your password"
              data-field="auth-password"
              ${disabledAttr}
            >
          </div>
          ${state.authPendingStep ? `
            <div class="col-12">
              <section class="alert alert-info mb-0">
                <strong>Processing access</strong>
                <p class="mb-0">${escapeHtml(state.authPendingStep)}</p>
              </section>
            </div>
          ` : ""}
          <div class="col-12 d-flex gap-2 flex-wrap">
            <button type="button" class="btn btn-primary" data-action="sign-in-backend" ${disabledAttr} aria-busy="${isSubmitting ? "true" : "false"}">${signInLabel}</button>
            <button type="button" class="btn btn-secondary" data-action="sign-out-backend" ${disabledAttr}>Sign Out</button>
          </div>
          ${state.authMessage ? `<div class="col-12"><section class="alert alert-danger mb-0"><strong>Authentication Required</strong><p class="mb-0">${escapeHtml(state.authMessage)}</p></section></div>` : ""}
          <div class="col-12">
            <p class="form-text mb-0">When the login is valid, credentials are stored for automatic re-login while you do not sign out manually.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-3">
        <div>
          <h3 class="h5 fw-semibold mb-1">Backend</h3>
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
              ${disabledAttr}
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
              ${disabledAttr}
            >
          </div>
          <div class="col-12 d-flex gap-2 flex-wrap">
            <button type="button" class="btn btn-primary" data-action="save-backend-config" ${disabledAttr}>Save Configuration</button>
            <button type="button" class="btn btn-secondary" data-action="clear-backend-config" ${disabledAttr}>Clear</button>
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
      <div class="card-body">
        <h3 class="h5 fw-semibold mb-2">Access Notice</h3>
        <p class="mb-0">The extension no longer uses silent local fallback. If the session expires or you sign out manually, the screen stays locked on login until authentication is restored.</p>
      </div>
    </section>
  `;
}
