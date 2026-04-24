import { renderProjectTrackBrand } from "./projecttrack-brand.js";
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
      className:
        "alert-danger border-danger-subtle bg-danger-subtle text-danger-emphasis",
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

function shouldRenderAuthMessage(message) {
  const normalized = String(message ?? "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return ![
    "backend ready, sign in required",
    "sign in to continue.",
    "sign in required",
    "session closed manually. sign in to continue.",
  ].includes(normalized);
}

export function renderLoginCard({
  savedEmail = "",
  isSubmitting = false,
  authPendingStep = "",
  authMessage = "",
  emailPlaceholder = "user@company.com",
  passwordPlaceholder = "Enter your password",
  submitLabel = "",
  submitAction = "sign-in-backend",
  submitButtonClass = "btn btn-primary px-4",
} = {}) {
  const effectiveSubmitLabel = submitLabel || (isSubmitting ? "Connecting..." : "Sign In");
  const disabledAttr = isSubmitting ? "disabled" : "";
  const showAuthMessage = shouldRenderAuthMessage(authMessage);
  const authMessageState = authMessagePresentation(authMessage);

  return `
    <section class="card border-0 shadow-sm overflow-hidden w-100 mx-auto" style="max-width: 48rem;">
      <div class="card-body p-0">
        <section class="card border-0 rounded-0 shadow-none text-white" style="background: var(--pt-gradient-hero);">
          <div class="card-body p-3 p-xl-4">
            <div class="d-flex align-items-start gap-3 mb-2">
              <div class="flex-shrink-0 mt-1">
                ${renderProjectTrackBrand(34)}
              </div>
              <div class="min-w-0">
                <h1 class="display-6 fw-bold mb-2">Sign In</h1>
                <p class="lead mb-0">Access your ProjectTrack workspace and keep work in sync.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div class="card-body p-4">
        <div class="w-100 mx-auto d-grid gap-3" style="max-width: 36rem;">
          <div class="d-flex align-items-center gap-3 min-w-0">
            <label class="form-label mb-0 flex-shrink-0" for="auth-email" style="width: 6rem;">Email</label>
            <input
              id="auth-email"
              class="form-control"
              type="email"
              value="${escapeAttribute(savedEmail)}"
              placeholder="${escapeAttribute(emailPlaceholder)}"
              data-field="auth-email"
              ${disabledAttr}
            >
          </div>
          <div class="d-flex align-items-center gap-3 min-w-0">
            <label class="form-label mb-0 flex-shrink-0" for="auth-password" style="width: 6rem;">Password</label>
            <input
              id="auth-password"
              class="form-control"
              type="password"
              value=""
              placeholder="${escapeAttribute(passwordPlaceholder)}"
              data-field="auth-password"
              ${disabledAttr}
            >
          </div>
          <div class="d-grid gap-2">
            ${authPendingStep ? `
            <section class="alert alert-info border-info-subtle bg-info-subtle text-info-emphasis mb-0" role="status">
              <strong>Processing access</strong>
              <p class="mb-0">${escapeHtml(authPendingStep)}</p>
            </section>
          ` : ""}
            ${showAuthMessage ? `<section class="alert ${authMessageState.className} mb-0" role="${authMessageState.role}"><strong>${authMessageState.heading}</strong><p class="mb-0">${escapeHtml(authMessage)}</p></section>` : ""}
          </div>
          <div class="d-flex justify-content-end flex-wrap gap-2">
            <button type="button" class="${escapeAttribute(submitButtonClass)}" data-action="${escapeAttribute(submitAction)}" ${disabledAttr} aria-busy="${isSubmitting ? "true" : "false"}">${escapeHtml(effectiveSubmitLabel)}</button>
          </div>
        </div>
      </div>
    </section>
  `;
}
