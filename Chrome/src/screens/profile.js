import { renderHeroCard } from "../components/hero-card.js";

function sessionLabel(session) {
  return session?.accessToken ? "Authenticated session" : "No session";
}

function authFlowLabel(authState) {
  if (authState?.manuallyLoggedOut) return "Manual logout";
  if (authState?.hasAuthenticated) return "Auto re-login enabled";
  return "First login pending";
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

function userInitial(name, email) {
  return String(name || email || "P")
    .trim()
    .charAt(0)
    .toUpperCase() || "P";
}

export function renderProfileScreen(state, data) {
  const resolvedEmail = state.backendSession?.user?.email || data.user.email;
  const resolvedId = state.backendSession?.user?.id || data.user.id || "mock-user-001";
  const profileName = data.user.name || "ProjectTrack User";
  const profileInitial = userInitial(profileName, resolvedEmail);
  return `
    ${renderHeroCard({
      title: "Profile",
      description: "Manage your identity and display name for the active workspace.",
      actionsHtml: `<button type="button" class="btn btn-outline-light" data-action="navigate-main" data-view-id="dashboard">Back</button>`
    })}

    <section class="card bg-body-tertiary">
      <div class="card-body d-grid gap-4">
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div class="d-grid gap-1 min-w-0">
            <h3 class="h4 fw-semibold mb-0">Account Profile</h3>
            <p class="text-secondary mb-0">Review your workspace identity and keep your display name aligned with the shared ProjectTrack directory.</p>
          </div>
        </div>

        <section class="border rounded-3 p-3 p-lg-4 bg-white d-grid gap-3">
          <div class="row g-3 align-items-start">
            <div class="col-12">
              <div class="d-flex justify-content-end flex-wrap gap-2">
                <span class="badge text-bg-light border">${escapeHtml(authFlowLabel(state.authState))}</span>
                <span class="badge text-bg-light border">${escapeHtml(data.user.role || "Workspace User")}</span>
                <span class="badge ${state.backendSession?.accessToken ? "text-bg-success" : "text-bg-secondary"}">${escapeHtml(sessionLabel(state.backendSession))}</span>
                <span class="badge text-bg-light border text-break">User ID: ${escapeHtml(resolvedId)}</span>
              </div>
            </div>

            <div class="col-12 col-xl-8">
                <div class="d-flex align-items-start gap-3">
                  <div class="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold shadow-sm" style="width: 4rem; height: 4rem; background: var(--pt-gradient-hero);">
                    ${escapeHtml(profileInitial)}
                  </div>
                  <div class="d-grid gap-1 min-w-0">
                    <div class="d-grid gap-0 min-w-0">
                    <p class="text-uppercase text-secondary fw-bold small mb-0">User</p>
                    <div class="mt-1">
                      <div class="d-flex align-items-end gap-2 flex-nowrap">
                        <input
                          id="profile-display-name"
                          class="form-control fs-4 fw-semibold min-w-0"
                          type="text"
                          value="${escapeAttribute(data.user.name)}"
                          data-field="profile-display-name"
                        >
                        <button type="button" class="btn btn-primary flex-shrink-0" data-action="save-profile-name">Save Name</button>
                      </div>
                    </div>
                    <p class="fw-semibold mb-0 text-break">${escapeHtml(resolvedEmail || "No email available")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>

    <section class="card bg-body-tertiary">
      <div class="card-body">
        <h3 class="h5 fw-semibold mb-2">Access Notice</h3>
        <p class="mb-0">The extension no longer uses silent local fallback. If the session expires or you sign out manually, the screen stays locked on login until authentication is restored.</p>
      </div>
    </section>
  `;
}
