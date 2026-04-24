import { renderLoginCard } from "../components/login-card.js";

export function renderLoginScreen(state, data = {}) {
  const savedEmail = state.backendSession?.user?.email || state.savedCredentials?.email || data.user?.email || "";

  return renderLoginCard({
    savedEmail,
    isSubmitting: Boolean(state.authIsSubmitting),
    authPendingStep: state.authPendingStep || "",
    authMessage: state.authMessage || "",
  });
}
