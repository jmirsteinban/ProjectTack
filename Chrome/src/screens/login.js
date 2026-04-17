import { renderProjectTrackBrand } from "../components/projecttrack-brand.js";
import { escapeAttribute, escapeHtml } from "../services/html.js";

function authMessagePresentation(message) {
  const normalized = String(message ?? "").toLowerCase();
  const isDanger = [
    "must complete",
    "could not",
    "failed",
    "invalid",
    "expired",
    "error",
    "unable",
  ].some((token) => normalized.includes(token));

  if (isDanger) {
    return {
      className: "alert-danger border-danger-subtle bg-danger-subtle text-danger-emphasis",
      heading: "Authentication failed",
      role: "alert",
    };
  }

  return {
    className: "alert-info border-info-subtle bg-info-subtle text-info-emphasis",
    heading: "Sign in required",
    role: "status",
  };
}

export function renderLoginScreen(state, data = {}) {
  const isSubmitting = Boolean(state.authIsSubmitting);
  const submitLabel = isSubmitting ? "Connecting..." : "Sign In";
  const disabledAttr = isSubmitting ? "disabled" : "";
  const savedEmail = state.backendSession?.user?.email || state.savedCredentials?.email || data.user?.email || "";
  const authMessage = state.authMessage || "";
  const authMessageState = authMessagePresentation(authMessage);

  return `
    <section class="card border-0 shadow-sm overflow-hidden w-100">
      <div class="card-body p-0">
        <section class="pt-web-hero rounded-0 shadow-none">
          <div class="p-4 p-xl-5">
            <div class="d-flex align-items-center gap-3 mb-3">
              ${renderProjectTrackBrand(34)}
              <span class="badge rounded-pill bg-white text-dark border">Home / Login</span>
            </div>
            <h1 class="display-6 fw-bold mb-2">Sign In</h1>
            <p class="lead mb-0">Access your remote ProjectTrack workspace and continue syncing active project work.</p>
          </div>
        </section>
      </div>
      <div class="card-body d-grid gap-3 p-4">
        <div class="d-grid gap-2 min-w-0">
          <label class="form-label" for="auth-email">Email</label>
          <input
            id="auth-email"
            class="form-control"
            type="email"
            value="${escapeAttribute(savedEmail)}"
            placeholder="user@company.com"
            data-field="auth-email"
            ${disabledAttr}
          >
        </div>
        <div class="d-grid gap-2 min-w-0">
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
        <div class="d-grid gap-2">
          ${state.authPendingStep ? `
          <section class="alert alert-info border-info-subtle bg-info-subtle text-info-emphasis mb-0" role="status">
            <strong>Processing access</strong>
            <p class="mb-0">${escapeHtml(state.authPendingStep)}</p>
          </section>
        ` : ""}
          ${authMessage ? `<section class="alert ${authMessageState.className} mb-0" role="${authMessageState.role}"><strong>${authMessageState.heading}</strong><p class="mb-0">${escapeHtml(authMessage)}</p></section>` : ""}
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-primary px-4" data-action="sign-in-backend" ${disabledAttr} aria-busy="${isSubmitting ? "true" : "false"}">${escapeHtml(submitLabel)}</button>
        </div>
      </div>
    </section>
  `;
}
