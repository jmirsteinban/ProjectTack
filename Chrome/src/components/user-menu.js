import { escapeAttribute, escapeHtml } from "../services/html.js";

const DEFAULT_USER_MENU_TEMPLATE = `
  <div class="dropdown">
    <button
      type="button"
      class="btn pt-user-menu-trigger dropdown-toggle d-inline-flex align-items-center gap-3 px-3 py-2"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    >
      <span class="pt-user-menu-avatar" aria-hidden="true">{{USER_INITIAL}}</span>
      <span class="d-grid text-start lh-sm flex-grow-1">
        <span class="fw-semibold pt-user-menu-name">{{USER_NAME}}</span>
        <span class="pt-user-menu-role">{{USER_ROLE}}</span>
      </span>
    </button>

    <ul class="dropdown-menu dropdown-menu-end pt-user-menu-panel p-2 border-0 shadow" data-user-menu>
      {{MENU_ITEMS}}
    </ul>
  </div>
`;

function renderMenuButton({ id, label, active = false, action = "navigate-main" }) {
  const viewIdAttr = action === "navigate-main" && id
    ? ` data-view-id="${escapeAttribute(id)}"`
    : "";
  return `<li><button type="button" class="dropdown-item pt-user-menu-link ${active ? "active" : ""}" data-action="${escapeAttribute(action)}"${viewIdAttr}>${escapeHtml(label)}</button></li>`;
}

export function renderUserMenu({
  userInitial = "P",
  userName = "ProjectTrack User",
  userRole = "Workspace member",
  items = [],
  template = ""
} = {}) {
  const menuItemsMarkup = items.map((item) => item.type === "divider"
    ? '<li><hr class="dropdown-divider pt-user-menu-divider my-2"></li>'
    : renderMenuButton(item)).join("");

  const replacements = {
    "{{USER_INITIAL}}": escapeHtml(userInitial),
    "{{USER_NAME}}": escapeHtml(userName),
    "{{USER_ROLE}}": escapeHtml(userRole),
    "{{MENU_ITEMS}}": menuItemsMarkup
  };

  return Object.entries(replacements).reduce(
    (html, [placeholder, value]) => html.split(placeholder).join(value),
    template || DEFAULT_USER_MENU_TEMPLATE
  );
}
