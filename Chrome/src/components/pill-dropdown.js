import { escapeAttribute, escapeHtml } from "../services/html.js";

const DEFAULT_PILL_DROPDOWN_TEMPLATE = `
  <div class="dropdown position-relative">
    <button
      type="button"
      class="btn pt-header-pill-trigger d-inline-flex align-items-center p-0 border-0 bg-transparent"
      data-action="{{TOGGLE_ACTION}}"
      aria-expanded="{{IS_OPEN}}"
      aria-haspopup="true"
      title="{{TITLE}}"
    >
      <span class="badge rounded-pill pt-header-pill-badge {{CURRENT_TONE_CLASS}}">
        {{CURRENT_LABEL}}
        <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
          <path d="M4.47 6.97a.75.75 0 0 1 1.06 0L8 9.44l2.47-2.47a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 0-1.06Z"></path>
        </svg>
      </span>
    </button>
    {{MENU_PANEL}}
  </div>
`;

function renderOptionButton({ itemAction, dataAttribute, value, toneClass, translate }) {
  return `
    <li>
      <button
        type="button"
        class="dropdown-item pt-header-pill-option d-flex align-items-center justify-content-start"
        data-action="${escapeAttribute(itemAction)}"
        data-${dataAttribute}="${escapeAttribute(value)}"
      >
        <span class="badge rounded-pill ${toneClass(value)}">${escapeHtml(translate(value))}</span>
      </button>
    </li>
  `;
}

export function renderPillDropdown({
  menuKey,
  state,
  title,
  currentValue,
  toggleAction,
  itemAction,
  dataAttribute,
  options,
  toneClass,
  translate,
  template = "",
}) {
  const isOpen = state.changeHeaderMenu === menuKey;
  const items = options
    .filter((value) => value !== currentValue)
    .map((value) => renderOptionButton({ itemAction, dataAttribute, value, toneClass, translate }))
    .join("");

  const replacements = {
    "{{TOGGLE_ACTION}}": escapeAttribute(toggleAction),
    "{{IS_OPEN}}": isOpen ? "true" : "false",
    "{{TITLE}}": escapeAttribute(title),
    "{{CURRENT_TONE_CLASS}}": toneClass(currentValue),
    "{{CURRENT_LABEL}}": escapeHtml(translate(currentValue)),
    "{{MENU_PANEL}}": isOpen ? `<ul class="dropdown-menu pt-header-pill-panel d-grid gap-1 p-2 border-0 shadow show">${items}</ul>` : "",
  };

  return Object.entries(replacements).reduce(
    (html, [placeholder, value]) => html.split(placeholder).join(value),
    template || DEFAULT_PILL_DROPDOWN_TEMPLATE,
  );
}
