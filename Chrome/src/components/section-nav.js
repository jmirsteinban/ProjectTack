import { escapeAttribute, escapeHtml } from "../services/html.js";

const DEFAULT_SECTION_NAV_TEMPLATE = `
  <div class="card border-0 shadow-sm sticky-top pt-theme-nav-card" style="top: 96px;">
    <div class="card-body d-grid gap-3">
      <div class="d-grid gap-1">
        <p class="text-uppercase text-secondary fw-bold small mb-0">Theme Manager</p>
        <h2 class="h6 mb-0">Sections</h2>
        <p class="small text-secondary mb-0">Move between token editing, previews, backups, and diff review.</p>
      </div>
      <nav class="nav flex-column gap-2" aria-label="Theme Manager sections">
        {{PRIMARY_ITEMS}}
        {{SECONDARY_BLOCK}}
      </nav>
      <div class="pt-theme-nav-summary border-top pt-3 d-grid gap-1 text-secondary small">
        <strong data-theme-diff-count>{{UNSAVED_COUNT}}</strong>
        <span>unsaved changes</span>
      </div>
    </div>
  </div>
`;

function renderSectionNavButton(id, label, activeSection) {
  const active = activeSection === id;
  return `
    <button
      type="button"
      class="nav-link text-start pt-theme-nav-link ${active ? "active" : ""}"
      data-theme-section="${escapeAttribute(id)}"
    >
      ${escapeHtml(label)}
    </button>
  `;
}

function renderSectionNavGroup(title, items, activeSection) {
  if (!items.length) {
    return "";
  }

  return `
    <div class="pt-theme-nav-group border-top pt-3 mt-2 d-grid gap-2">
      <span class="pt-theme-nav-group-title text-uppercase text-secondary fw-bold small">${escapeHtml(title)}</span>
      <div class="d-grid gap-2">
        ${items.map(([id, label]) => renderSectionNavButton(id, label, activeSection)).join("")}
      </div>
    </div>
  `;
}

export function renderSectionNav({
  items = [],
  secondaryTitle = "",
  secondaryItems = [],
  activeSection = "overview",
  unsavedCount = 0,
  template = "",
} = {}) {
  const replacements = {
    "{{PRIMARY_ITEMS}}": items.map(([id, label]) => renderSectionNavButton(id, label, activeSection)).join(""),
    "{{SECONDARY_BLOCK}}": renderSectionNavGroup(secondaryTitle, secondaryItems, activeSection),
    "{{UNSAVED_COUNT}}": escapeHtml(String(unsavedCount)),
  };

  return Object.entries(replacements).reduce(
    (html, [placeholder, value]) => html.split(placeholder).join(value),
    template || DEFAULT_SECTION_NAV_TEMPLATE,
  );
}
