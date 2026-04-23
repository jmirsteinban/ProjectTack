import { escapeHtml } from "../services/html.js";

const DEFAULT_METRIC_CARD_TEMPLATE = `
  <article class="card h-100 border-0 bg-white shadow-sm rounded-4">
    <div class="card-body">
      <p class="text-uppercase small fw-semibold text-secondary mb-2">{{TITLE}}</p>
      <div class="d-flex align-items-end justify-content-between gap-3">
        <h3 class="display-6 mb-0 fw-bold">{{VALUE}}</h3>
        <span class="badge rounded-pill text-bg-light border">{{TONE}}</span>
      </div>
    </div>
  </article>
`;

export function renderMetricCard({
  title = "",
  value = "0",
  tone = "summary",
  template = "",
} = {}) {
  const replacements = {
    "{{TITLE}}": escapeHtml(title),
    "{{VALUE}}": escapeHtml(value),
    "{{TONE}}": escapeHtml(tone),
  };

  return Object.entries(replacements).reduce(
    (html, [placeholder, replacement]) => html.split(placeholder).join(replacement),
    template || DEFAULT_METRIC_CARD_TEMPLATE,
  );
}
