import { getVisibleChanges, getVisibleProjects } from "../services/workspace-selectors.js";

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

export function renderProfileScreen(state, data) {
  const visibleProjects = getVisibleProjects(data);
  const visibleChanges = getVisibleChanges(data);
  const isSubmitting = Boolean(state.authIsSubmitting);
  const disabledAttr = isSubmitting ? "disabled" : "";
  const signInLabel = isSubmitting ? "Connecting..." : "Sign In";
  return `
    <section class="pt-screen-hero">
      <div class="row">
        <div class="col">
          <div class="pt-change-detail-topline">
            <span>Workspace / Profile</span>
          </div>
          <div class="pt-change-detail-copy">
            <h3>Profile</h3>
          </div>
          <div class="pt-change-detail-meta">
            <span class="pt-mini-chip">${sessionLabel(state.backendSession)}</span>
            <span class="pt-mini-chip">${backendLabel(state.backendStatus)}</span>
            <span class="pt-mini-chip">${credentialsLabel(state.savedCredentials)}</span>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col d-flex justify-content-end gap-2 flex-wrap">
          <button type="button" class="pt-back-button pt-back-button--hero" data-action="navigate-main" data-view-id="dashboard">Back</button>
        </div>
      </div>
    </section>

    <section class="pt-screen-card d-grid gap-cus-14 min-w-0">
      <h3 class="pt-section-title">Preferences</h3>
      <div class="pt-row pt-row--comfortable">
        <div class="pt-col pt-col-12 pt-col-lg-8 pt-field-group">
          <label class="form-label" for="profile-display-name">Display Name</label>
          <input
            id="profile-display-name"
            class="form-control"
            type="text"
            value="${data.user.name}"
            data-field="profile-display-name"
          >
        </div>
        <div class="pt-col pt-col-12 pt-col-lg-4">
          <div class="pt-actions-row">
            <button type="button" class="btn btn-primary" data-action="save-profile-name">Save Name</button>
          </div>
        </div>
        <div class="pt-col pt-col-12">
          <p class="pt-row-subtle">This display name only lives in memory while the extension is open.</p>
        </div>
      </div>
    </section>

    <section class="pt-screen-card d-grid gap-cus-14 min-w-0">
      <div class="pt-row-top">
        <h3 class="pt-section-title">Account</h3>
      </div>
      <div class="pt-grid-auto-190">
        <article class="pt-meta-card">
          <p>Status</p>
          <strong>${sessionLabel(state.backendSession)}</strong>
        </article>
        <article class="pt-meta-card">
          <p>Email</p>
          <strong>${state.backendSession?.user?.email || data.user.email}</strong>
        </article>
        <article class="pt-meta-card">
          <p>ID</p>
          <strong>${state.backendSession?.user?.id || data.user.id || "mock-user-001"}</strong>
        </article>
        <article class="pt-meta-card">
          <p>Role</p>
          <strong>${data.user.role}</strong>
        </article>
        <article class="pt-meta-card">
          <p>Auth Flow</p>
          <strong>${authFlowLabel(state.authState)}</strong>
        </article>
      </div>
    </section>

    <section class="pt-screen-card d-grid gap-cus-14 min-w-0">
      <div class="pt-row-top">
        <h3 class="pt-section-title">Workspace</h3>
      </div>
      <div class="pt-grid-auto-190">
        <article class="pt-meta-card">
          <p>Visible Projects</p>
          <strong>${visibleProjects.length}</strong>
        </article>
        <article class="pt-meta-card">
          <p>Visible Changes</p>
          <strong>${visibleChanges.length}</strong>
        </article>
        <article class="pt-meta-card">
          <p>Current Filter</p>
          <strong>${state.projectActivityFilter}</strong>
        </article>
        <article class="pt-meta-card">
          <p>Backend</p>
          <strong>${backendLabel(state.backendStatus)}</strong>
        </article>
        <article class="pt-meta-card">
          <p>Credentials</p>
          <strong>${credentialsLabel(state.savedCredentials)}</strong>
        </article>
      </div>
    </section>

    <section class="pt-screen-card d-grid gap-cus-14 min-w-0">
      <div class="pt-row-top">
        <h3 class="pt-section-title">Session</h3>
      </div>
      <div class="pt-row pt-row--comfortable">
        <div class="pt-col pt-col-12 pt-col-sm-6 pt-field-group">
          <label class="form-label" for="auth-email">Email</label>
          <input
            id="auth-email"
            class="form-control"
            type="email"
            value="${state.backendSession?.user?.email || state.savedCredentials?.email || data.user.email || ""}"
            placeholder="user@company.com"
            data-field="auth-email"
            ${disabledAttr}
          >
        </div>
        <div class="pt-col pt-col-12 pt-col-sm-6 pt-field-group">
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
          <div class="pt-col pt-col-12">
            <section class="alert alert-info">
              <strong>Processing access</strong>
              <p>${state.authPendingStep}</p>
            </section>
          </div>
        ` : ""}
        <div class="pt-col pt-col-12">
          <div class="pt-actions-row">
            <button type="button" class="btn btn-primary" data-action="sign-in-backend" ${disabledAttr} aria-busy="${isSubmitting ? "true" : "false"}">${signInLabel}</button>
            <button type="button" class="btn btn-secondary" data-action="sign-out-backend" ${disabledAttr}>Sign Out</button>
          </div>
        </div>
        ${state.authMessage ? `<div class="pt-col pt-col-12"><section class="alert alert-danger"><strong>Authentication Required</strong><p>${state.authMessage}</p></section></div>` : ""}
        <div class="pt-col pt-col-12">
          <p class="form-text">When the login is valid, credentials are stored for automatic re-login while you do not sign out manually.</p>
        </div>
      </div>
    </section>

    <section class="pt-screen-card d-grid gap-cus-14 min-w-0">
      <div class="pt-row-top">
        <h3 class="pt-section-title">Backend</h3>
      </div>
      <div class="pt-row pt-row--comfortable">
        <div class="pt-col pt-col-12 pt-field-group">
          <label class="form-label" for="backend-url">Supabase URL</label>
          <input
            id="backend-url"
            class="form-control"
            type="text"
            value="${state.backendConfig?.url ?? ""}"
            placeholder="https://your-project.supabase.co"
            data-field="backend-url"
            ${disabledAttr}
          >
        </div>
        <div class="pt-col pt-col-12 pt-field-group">
          <label class="form-label" for="backend-publishable-key">Publishable Key</label>
          <input
            id="backend-publishable-key"
            class="form-control"
            type="password"
            value="${state.backendConfig?.publishableKey ?? ""}"
            placeholder="sb_publishable_..."
            data-field="backend-publishable-key"
            ${disabledAttr}
          >
        </div>
        <div class="pt-col pt-col-12">
          <div class="pt-actions-row">
            <button type="button" class="btn btn-primary" data-action="save-backend-config" ${disabledAttr}>Save Configuration</button>
            <button type="button" class="btn btn-secondary" data-action="clear-backend-config" ${disabledAttr}>Clear</button>
          </div>
        </div>
        ${state.backendConfigMessage ? `<div class="pt-col pt-col-12"><section class="alert alert-${configMessageTone(state.backendConfigMessage)}"><strong>Backend</strong><p>${state.backendConfigMessage}</p></section></div>` : ""}
        <div class="pt-col pt-col-12">
          <p class="form-text">The configuration is stored in chrome.storage. Without a valid session, the extension does not show workspace data.</p>
        </div>
      </div>
      <div class="pt-grid-auto-190">
        <article class="pt-meta-card">
          <p>Configured URL</p>
          <strong>${state.backendConfig?.url || "Not configured"}</strong>
        </article>
        <article class="pt-meta-card">
          <p>Configured Key</p>
          <strong>${maskedKey(state.backendConfig?.publishableKey ?? "")}</strong>
        </article>
        <article class="pt-meta-card">
          <p>Mode</p>
          <strong>${state.backendStatus?.mode ?? "auth-required"}</strong>
        </article>
        <article class="pt-meta-card">
          <p>Updated</p>
          <strong>${state.backendConfig?.updatedAt ?? "No date"}</strong>
        </article>
      </div>
    </section>

    <section class="pt-screen-card d-grid gap-cus-14 min-w-0">
      <h3 class="pt-section-title">Access Notice</h3>
      <p>The extension no longer uses silent local fallback. If the session expires or you sign out manually, the screen stays locked on login until authentication is restored.</p>
    </section>
  `;
}
