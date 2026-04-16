import { renderProjectTrackBrand } from "../components/projecttrack-brand.js";

export function renderLoginScreen(state, data) {
  const isSubmitting = Boolean(state.authIsSubmitting);
  const submitLabel = isSubmitting ? "Connecting..." : "Sign In";
  const disabledAttr = isSubmitting ? "disabled" : "";

  return `
    <section class="card bg-body-tertiary pt-login-card">
      <section class="pt-screen-hero pt-screen-hero--login pt-login-card-hero">
        <div class="row g-3">
          <div class="col-12">
            <h3 class="pt-section-title pt-login-title">
              <span class="pt-login-title-icon">${renderProjectTrackBrand(32)}</span>
              <span>Sign In</span>
            </h3>
            <p class="pt-login-breadcrumb mb-0">Home / Login</p>
          </div>
        </div>
      </section>
      <div class="card-body pt-profile-form d-grid gap-3">
        <div class="d-grid gap-2 min-w-0">
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
        ${state.authPendingStep ? `
          <section class="alert alert-info mb-0">
            <strong>Processing access</strong>
            <p class="mb-0">${state.authPendingStep}</p>
          </section>
        ` : ""}
        <div class="pt-project-editor-actions">
          <button type="button" class="btn btn-primary pt-login-submit-button" data-action="sign-in-backend" ${disabledAttr} aria-busy="${isSubmitting ? "true" : "false"}">${submitLabel}</button>
        </div>
        ${state.authMessage ? `<section class="alert alert-danger mb-0"><strong>Authentication Required</strong><p class="mb-0">${state.authMessage}</p></section>` : ""}
      </div>
    </section>
  `;
}
