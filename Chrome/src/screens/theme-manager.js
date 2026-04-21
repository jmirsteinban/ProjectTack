import { renderEnvironmentProgress } from "../components/environment-progress.js";
import { renderHeroCard } from "../components/hero-card.js";
import { renderProjectTrackBrand } from "../components/projecttrack-brand.js";
import { BOOTSTRAP_THEME_SCALES, THEME_COMPONENT_REGISTRY } from "../theme/component-registry.js";

const SERVER_URL = "http://127.0.0.1:4177";
const START_MARKER = "/* THEME MANAGER TOKENS START */";
const END_MARKER = "/* THEME MANAGER TOKENS END */";
const LOCAL_FALLBACK_CSS_URL = "styles/projecttrack.css";

const THEME_TOKEN_DEFINITIONS = [
  { name: "--bs-primary", label: "Bootstrap primary", category: "Colors", type: "color", fallback: "#0d6efd" },
  { name: "--bs-secondary", label: "Bootstrap secondary", category: "Colors", type: "color", fallback: "#6c757d" },
  { name: "--bs-success", label: "Bootstrap success", category: "Colors", type: "color", fallback: "#198754" },
  { name: "--bs-info", label: "Bootstrap info", category: "Colors", type: "color", fallback: "#0dcaf0" },
  { name: "--bs-warning", label: "Bootstrap warning", category: "Colors", type: "color", fallback: "#ffc107" },
  { name: "--bs-danger", label: "Bootstrap danger", category: "Colors", type: "color", fallback: "#dc3545" },
  { name: "--bs-light", label: "Bootstrap light", category: "Colors", type: "color", fallback: "#f8f9fa" },
  { name: "--bs-dark", label: "Bootstrap dark", category: "Colors", type: "color", fallback: "#212529" },
  { name: "--bs-body-color", label: "Bootstrap body text", category: "Colors", type: "color", fallback: "#212529" },
  { name: "--bs-body-bg", label: "Bootstrap body background", category: "Colors", type: "color", fallback: "#ffffff" },
  { name: "--pt-color-brand-primary", label: "ProjectTrack brand", category: "Colors", type: "color", fallback: "#204d38" },
  { name: "--pt-color-brand-strong", label: "Brand strong", category: "Colors", type: "color", fallback: "#153426" },
  { name: "--pt-color-brand-soft", label: "Brand soft", category: "Colors", type: "color", fallback: "#d9e9df" },
  { name: "--pt-color-text-primary", label: "Text primary", category: "Colors", type: "color", fallback: "#1d2a23" },
  { name: "--pt-color-text-secondary", label: "Text secondary", category: "Colors", type: "color", fallback: "#66756c" },
  { name: "--pt-color-bg-canvas", label: "Canvas background", category: "Colors", type: "text", fallback: "rgba(247, 246, 240, 0.92)" },
  { name: "--pt-color-card", label: "Card surface", category: "Colors", type: "color", fallback: "#fbfaf6" },
  { name: "--pt-color-border-subtle", label: "Subtle border", category: "Colors", type: "text", fallback: "rgba(29, 42, 35, 0.12)" },
  { name: "--pt-color-text-on-dark", label: "Text on dark", category: "Colors", type: "text", fallback: "var(--pt-color-white)" },
  { name: "--pt-color-text-on-dark-muted", label: "Muted text on dark", category: "Colors", type: "text", fallback: "rgba(255, 255, 255, 0.78)" },
  { name: "--pt-card-bg", label: "Component card background", category: "Component Tokens", type: "text", fallback: "var(--pt-color-card)" },
  { name: "--pt-card-border-color", label: "Component card border", category: "Component Tokens", type: "text", fallback: "var(--pt-color-border-subtle)" },
  { name: "--pt-color-status-info", label: "Status info", category: "States", type: "color", fallback: "#7cb7ff" },
  { name: "--pt-color-status-info-bg", label: "Status info background", category: "States", type: "color", fallback: "#eef5ff" },
  { name: "--pt-color-status-warning", label: "Status warning", category: "States", type: "color", fallback: "#f59e0b" },
  { name: "--pt-color-status-success", label: "Status success", category: "States", type: "color", fallback: "#16a34a" },
  { name: "--pt-color-status-success-bg", label: "Status success background", category: "States", type: "color", fallback: "#edf8f1" },
  { name: "--pt-color-status-neutral", label: "Status neutral", category: "States", type: "color", fallback: "#e8ece8" },
  { name: "--pt-color-status-neutral-text", label: "Status neutral text", category: "States", type: "color", fallback: "#415046" },
  { name: "--pt-color-status-danger", label: "Status danger", category: "States", type: "color", fallback: "#dc2626" },
  { name: "--pt-color-status-danger-soft", label: "Status danger soft", category: "States", type: "color", fallback: "#fff0ee" },
  { name: "--pt-gradient-hero", label: "Hero gradient", category: "Gradients", type: "text", fallback: "linear-gradient(135deg, #26263a 0%, #46307a 52%, #6740aa 100%)" },
  { name: "--pt-gradient-progress-track", label: "Progress gradient", category: "Gradients", type: "text", fallback: "linear-gradient(90deg, #f17d2f 0%, #ff4b5c 48%, #b33ee6 100%)" },
  { name: "--pt-gradient-progress-complete", label: "Progress complete gradient", category: "Gradients", type: "text", fallback: "linear-gradient(135deg, #f17d2f 0%, #ff4b5c 100%)" },
  { name: "--pt-gradient-progress-current", label: "Progress current gradient", category: "Gradients", type: "text", fallback: "linear-gradient(135deg, #ff4b5c 0%, #b33ee6 100%)" },
  { name: "--pt-gradient-progress-idle", label: "Progress idle gradient", category: "Gradients", type: "text", fallback: "linear-gradient(135deg, #c8cbd3 0%, #aeb5c2 100%)" }
];

const THEME_TOKEN_DEFINITION_BY_NAME = new Map(
  THEME_TOKEN_DEFINITIONS.map((definition) => [definition.name, definition])
);

const themeState = {
  activeSection: "overview",
  source: "loading",
  serverAvailable: false,
  projectCss: "",
  originalTokens: {},
  editedTokens: {},
  backups: [],
  importCss: "",
  message: "Loading project CSS...",
  messageTone: "info",
  loadedAt: null
};

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

function isColorLike(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value).trim());
}

function normalizeColor(value, fallback) {
  const trimmed = String(value ?? "").trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed;
  }
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed.slice(1).split("").map((char) => `${char}${char}`).join("")}`;
  }
  return fallback;
}

function hexToRgb(value) {
  const hex = normalizeColor(value, "#000000").replace("#", "");
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16)
  ];
}

function mixColor(value, target, weight) {
  const sourceRgb = hexToRgb(value);
  const targetRgb = hexToRgb(target);
  const mixed = sourceRgb.map((channel, index) => Math.round(channel + (targetRgb[index] - channel) * weight));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function parseRootVariables(css) {
  const variables = {};
  const rootMatches = String(css ?? "").matchAll(/:root\s*\{([\s\S]*?)\}/g);
  for (const match of rootMatches) {
    const body = match[1].replace(/\/\*[\s\S]*?\*\//g, "");
    for (const declaration of body.split(";")) {
      const pair = declaration.match(/(--[a-zA-Z0-9-_]+)\s*:\s*([\s\S]+)/);
      if (pair) {
        variables[pair[1].trim()] = pair[2].trim();
      }
    }
  }
  return variables;
}

function extractMarkedBlock(css) {
  const text = String(css ?? "");
  const startCount = text.split(START_MARKER).length - 1;
  const endCount = text.split(END_MARKER).length - 1;
  if (startCount !== endCount) {
    return { status: "error", message: "Theme Manager markers are unbalanced.", css: "" };
  }
  if (startCount > 1) {
    return { status: "error", message: "Multiple Theme Manager token blocks were found.", css: "" };
  }
  if (startCount === 0) {
    return { status: "missing", message: "Theme Manager token block is missing.", css: "" };
  }
  const start = text.indexOf(START_MARKER) + START_MARKER.length;
  const end = text.indexOf(END_MARKER, start);
  return { status: "found", message: "Theme Manager token block loaded.", css: text.slice(start, end).trim() };
}

function getDefaultTokens() {
  return Object.fromEntries(THEME_TOKEN_DEFINITIONS.map((token) => [token.name, token.fallback]));
}

function normalizeTokens(tokens) {
  const defaults = getDefaultTokens();
  return Object.fromEntries(
    THEME_TOKEN_DEFINITIONS.map((token) => [token.name, tokens[token.name] || defaults[token.name]])
  );
}

function buildRootBlock(tokens = themeState.editedTokens) {
  const groups = new Map();
  for (const token of THEME_TOKEN_DEFINITIONS) {
    if (!groups.has(token.category)) {
      groups.set(token.category, []);
    }
    groups.get(token.category).push(`  ${token.name}: ${tokens[token.name] || token.fallback};`);
  }
  const lines = [];
  for (const [group, declarations] of groups.entries()) {
    lines.push(`  /* ${group} */`);
    lines.push(...declarations);
    if (group === "Colors") {
      lines.push(...buildDerivedColorLines(tokens));
    }
    lines.push("");
  }
  return `:root {\n${lines.join("\n").trimEnd()}\n}`;
}

function getDerivedTokens(tokens = themeState.editedTokens) {
  const derived = {};
  [
    ["--bs-primary", "--bs-primary-rgb"],
    ["--bs-secondary", "--bs-secondary-rgb"],
    ["--bs-success", "--bs-success-rgb"],
    ["--bs-info", "--bs-info-rgb"],
    ["--bs-warning", "--bs-warning-rgb"],
    ["--bs-danger", "--bs-danger-rgb"],
    ["--bs-light", "--bs-light-rgb"],
    ["--bs-dark", "--bs-dark-rgb"]
  ].forEach(([source, target]) => {
    if (isColorLike(tokens[source])) {
      derived[target] = hexToRgb(tokens[source]).join(", ");
    }
  });

  if (isColorLike(tokens["--pt-color-brand-primary"])) {
    derived["--pt-action-primary"] = tokens["--pt-color-brand-primary"];
    derived["--pt-action-primary-strong"] = mixColor(tokens["--pt-color-brand-primary"], "#000000", 0.24);
    derived["--pt-action-primary-soft"] = `rgba(${hexToRgb(tokens["--pt-color-brand-primary"]).join(", ")}, 0.1)`;
  }

  return derived;
}

function buildDerivedColorLines(tokens) {
  return Object.entries(getDerivedTokens(tokens)).map(([name, value]) => `  ${name}: ${value};`);
}

function buildMarkedBlock(tokens = themeState.editedTokens) {
  return `${START_MARKER}\n${buildRootBlock(tokens)}\n${END_MARKER}`;
}

export function exportThemeCss(values = themeState.editedTokens) {
  return buildRootBlock(values);
}

function applyTheme(tokens) {
  const fullTokens = {
    ...tokens,
    ...getDerivedTokens(tokens)
  };
  const targets = [
    document.documentElement,
    document.querySelector("[data-projecttrack-root]")
  ].filter(Boolean);

  targets.forEach((target) => {
    Object.entries(fullTokens).forEach(([property, value]) => {
      target.style.setProperty(property, value);
    });
  });
}

function diffTokens() {
  return THEME_TOKEN_DEFINITIONS
    .map((token) => ({
      ...token,
      original: themeState.originalTokens[token.name] || "",
      edited: themeState.editedTokens[token.name] || ""
    }))
    .filter((token) => token.original !== token.edited);
}

function getImpactedComponents(tokenName) {
  return THEME_COMPONENT_REGISTRY.filter((component) => component.tokens.includes(tokenName));
}

function buildComponentDiffGroups(changes) {
  const groups = new Map();

  changes.forEach((change) => {
    const impactedComponents = getImpactedComponents(change.name);
    if (!impactedComponents.length) {
      const groupId = "__global__";
      if (!groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          name: "Global / Bootstrap Base",
          screens: ["Theme-wide"],
          changes: []
        });
      }
      groups.get(groupId).changes.push(change);
      return;
    }

    impactedComponents.forEach((component) => {
      if (!groups.has(component.id)) {
        groups.set(component.id, {
          id: component.id,
          name: component.name,
          screens: component.screens,
          changes: []
        });
      }
      groups.get(component.id).changes.push(change);
    });
  });

  return [...groups.values()];
}

function renderDiffChangeRow(change) {
  return `
    <tr>
      <td>
        <code>${escapeHtml(change.name)}</code>
        <span class="d-block small text-secondary">${escapeHtml(change.category)}</span>
      </td>
      <td><code>${escapeHtml(change.original)}</code></td>
      <td><code>${escapeHtml(change.edited)}</code></td>
      <td><button type="button" class="btn btn-sm btn-outline-secondary" data-action="theme-revert-token" data-theme-token-name="${escapeAttribute(change.name)}">Revert</button></td>
    </tr>
  `;
}

function setMessage(message, tone = "info") {
  themeState.message = message;
  themeState.messageTone = tone;
}

async function requestServer(path, options = {}) {
  const response = await fetch(`${SERVER_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || "Theme Manager server error.");
  }
  return payload;
}

async function loadProjectCss() {
  try {
    const payload = await requestServer("/api/theme");
    themeState.serverAvailable = true;
    themeState.source = "python-server";
    themeState.projectCss = payload.css || "";
    themeState.backups = payload.backups || [];
    setMessage("Project CSS loaded from local Python server.", "success");
  } catch {
    const response = await fetch(LOCAL_FALLBACK_CSS_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Could not read projecttrack.css.");
    }
    themeState.serverAvailable = false;
    themeState.source = "read-only-css-fetch";
    themeState.projectCss = await response.text();
    themeState.backups = [];
    setMessage("Project CSS loaded in read-only mode. Start the Python server to save and list backups.", "warning");
  }

  const allTokens = parseRootVariables(themeState.projectCss);
  const marked = extractMarkedBlock(themeState.projectCss);
  const markedTokens = marked.status === "found" ? parseRootVariables(marked.css) : {};
  themeState.originalTokens = normalizeTokens({ ...allTokens, ...markedTokens });
  themeState.editedTokens = { ...themeState.originalTokens };
  themeState.loadedAt = new Date();

  if (marked.status === "missing") {
    setMessage("Project CSS loaded. The marked Theme Manager block is missing; saving can create it with confirmation.", "warning");
  }
  if (marked.status === "error") {
    setMessage(marked.message, "danger");
  }

  applyTheme(themeState.editedTokens);
}

function getControlValue(control) {
  const unit = control.dataset.themeUnit || "";
  return unit
    ? `${Number.parseFloat(control.value)}${unit}`
    : control.value;
}

function setControlValue(control, value) {
  if (control.dataset.themeUnit) {
    control.value = Number.parseFloat(value) || 0;
    return;
  }
  control.value = value;
}

function syncTokenControls(manager, tokenName) {
  manager.querySelectorAll(`[data-theme-token="${CSS.escape(tokenName)}"]`).forEach((control) => {
    setControlValue(control, themeState.editedTokens[tokenName] || "");
  });
}

function updateEditedTokenFromControl(manager, control) {
  const tokenName = control.dataset.themeToken;
  themeState.editedTokens[tokenName] = getControlValue(control);
  syncTokenControls(manager, tokenName);
  applyTheme(themeState.editedTokens);
}

function renderInto(manager) {
  const parent = manager.parentElement;
  if (!parent) {
    return;
  }
  parent.innerHTML = renderThemeManagerScreen();
  bindThemeManagerControls(parent);
}

function renderValueInput(token) {
  const value = themeState.editedTokens[token.name] || token.fallback;
  const original = themeState.originalTokens[token.name] || token.fallback;
  const changed = value !== original;

  if (token.type === "select") {
    const hasKnownValue = token.options.some((option) => option.value === value);
    const options = token.options.map((option) => {
      const selected = option.value === value || (!hasKnownValue && option.value === original && value === token.fallback);
      return `<option value="${escapeAttribute(option.value)}" ${selected ? "selected" : ""}>${escapeHtml(option.label)} (${escapeHtml(option.className)})</option>`;
    }).join("");
    const customOption = hasKnownValue
      ? ""
      : `<option value="${escapeAttribute(value)}" selected>Custom / current</option>`;
    return `<select class="form-select" data-theme-token="${escapeAttribute(token.name)}">${options}${customOption}</select>`;
  }

  if (token.type === "range") {
    const numeric = Number.parseFloat(value) || Number.parseFloat(token.fallback);
    return `
      <input class="form-range" type="range" min="${token.min}" max="${token.max}" step="${token.step}" value="${numeric}" data-theme-token="${escapeAttribute(token.name)}" data-theme-unit="${escapeAttribute(token.unit)}">
      <div class="small text-secondary">Edited: <strong data-theme-live-value="${escapeAttribute(token.name)}">${escapeHtml(`${numeric}${token.unit}`)}</strong></div>
    `;
  }

  if (token.type === "color") {
    return `<input class="form-control form-control-color" type="color" value="${escapeAttribute(normalizeColor(value, token.fallback))}" data-theme-token="${escapeAttribute(token.name)}" aria-label="${escapeAttribute(token.label)}">`;
  }

  return `<input class="form-control" type="text" value="${escapeAttribute(value)}" data-theme-token="${escapeAttribute(token.name)}">`;
}

function renderTokenControl(token) {
  const original = themeState.originalTokens[token.name] || token.fallback;
  const value = themeState.editedTokens[token.name] || token.fallback;
  const changed = original !== value;
  return `
    <label class="d-grid gap-2 border rounded-3 p-3 ${changed ? "border-warning bg-warning-subtle" : "bg-white"}">
      <span class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
        <span class="fw-semibold">${escapeHtml(token.label)}</span>
        <code>${escapeHtml(token.name)}</code>
      </span>
      ${renderValueInput(token)}
      <span class="small text-secondary">Current: <code>${escapeHtml(original)}</code></span>
    </label>
  `;
}

function renderComponentTokenControl(tokenName) {
  const token = THEME_TOKEN_DEFINITION_BY_NAME.get(tokenName);
  if (!token) {
    return "";
  }
  return `
    <div class="min-w-0">
      ${renderTokenControl(token)}
    </div>
  `;
}

function renderComponentTokenSummary(component) {
  const editableTokens = component.tokens.filter((tokenName) => THEME_TOKEN_DEFINITION_BY_NAME.has(tokenName));
  const pendingTokens = component.tokens.filter((tokenName) => !THEME_TOKEN_DEFINITION_BY_NAME.has(tokenName));
  const changedTokens = editableTokens.filter((tokenName) => themeState.originalTokens[tokenName] !== themeState.editedTokens[tokenName]);

  return `
    <div class="d-flex flex-wrap gap-2 mt-3 pt-3 border-top small text-secondary">
      <span class="badge text-bg-light border"><strong>${editableTokens.length}</strong> editable</span>
      <span class="badge text-bg-light border"><strong>${pendingTokens.length}</strong> pending</span>
      <span class="badge text-bg-light border"><strong>${changedTokens.length}</strong> changed</span>
    </div>
    ${editableTokens.length ? `
      <details class="mt-3">
        <summary>Component token controls</summary>
        <div class="d-grid gap-3 mt-3">
          ${editableTokens.map(renderComponentTokenControl).join("")}
        </div>
      </details>
    ` : ""}
    ${pendingTokens.length ? `
      <div class="d-grid gap-2 mt-3">
        <span class="small fw-bold">Pending token definitions</span>
        <div class="d-flex flex-wrap gap-2">${pendingTokens.map((token) => `<code>${escapeHtml(token)}</code>`).join("")}</div>
      </div>
    ` : ""}
  `;
}

function renderTokensSection() {
  const grouped = THEME_TOKEN_DEFINITIONS.reduce((groups, token) => {
    groups[token.category] = groups[token.category] || [];
    groups[token.category].push(token);
    return groups;
  }, {});

  return Object.entries(grouped).map(([group, tokens]) => `
    <section class="card border-0 shadow-sm" id="theme-${escapeAttribute(group.toLowerCase())}">
      <div class="card-body d-grid gap-3">
        <div class="d-flex justify-content-between gap-3 flex-wrap mb-3">
          <div>
            <p class="text-uppercase text-secondary fw-bold small mb-1">Theme Tokens</p>
            <h2 class="h4 mb-0">${escapeHtml(group)}</h2>
          </div>
          <span class="badge text-bg-light border">${tokens.length} tokens</span>
        </div>
        <div class="d-grid gap-3">
          ${tokens.map(renderTokenControl).join("")}
        </div>
      </div>
    </section>
  `).join("");
}

function renderBootstrapSection() {
  return `
    <section class="card border-0 shadow-sm">
      <div class="card-body d-grid gap-3">
        <p class="text-uppercase text-secondary fw-bold small mb-1">Bootstrap 5.3</p>
        <h2 class="h4">Closed scales</h2>
        <p class="text-secondary">These controls intentionally expose only Bootstrap-approved options. ProjectTrack is currently using one active light theme, while still exposing Bootstrap light and dark color tokens.</p>
        <div class="row g-3">
          ${Object.entries(BOOTSTRAP_THEME_SCALES).map(([key, options]) => `
            <div class="col-12 col-lg-4">
              <section class="border rounded-3 p-3 h-100">
                <h3 class="h6 text-capitalize">${escapeHtml(key)}</h3>
                <div class="d-grid gap-2">
                  ${options.map((option) => `<span class="d-flex justify-content-between gap-3 small"><span>${escapeHtml(option.label)}</span><code>${escapeHtml(option.className)}</code></span>`).join("")}
                </div>
              </section>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
    <section class="card border-0 shadow-sm">
      <div class="card-body d-grid gap-3">
        <p class="text-uppercase text-secondary fw-bold small mb-1">Bootstrap Colors</p>
        <h2 class="h4">Theme color preview</h2>
        <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3">
          ${["primary", "secondary", "success", "info", "warning", "danger", "light", "dark"].map((tone) => `
            <div class="col"><div class="border rounded-3 p-3 h-100 bg-${tone} ${["light", "warning", "info"].includes(tone) ? "text-dark" : "text-white"}" style="min-height:84px;"><strong class="d-block">${tone}</strong><code>${escapeHtml(`--bs-${tone}`)}</code></div></div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderProjectTrackComponentsSection() {
  return `
    <section class="card border-0 shadow-sm">
      <div class="card-body d-grid gap-3">
        <p class="text-uppercase text-secondary fw-bold small mb-1">ProjectTrack Components</p>
        <h2 class="h4">Registered components</h2>
        <div class="row row-cols-1 row-cols-xl-2 g-3">
          ${THEME_COMPONENT_REGISTRY.map((component) => `
            <div class="col">
              <article class="border rounded-3 p-3 h-100 bg-white">
                <div class="d-flex justify-content-between gap-3 mb-2">
                  <h3 class="h6 mb-0">${escapeHtml(component.name)}</h3>
                  <span class="badge text-bg-success">${escapeHtml(component.family)}</span>
                </div>
                <p class="small text-secondary mb-2">Screens: ${escapeHtml(component.screens.join(", "))}</p>
                <p class="small mb-1"><strong>Tokens</strong></p>
                <div class="d-flex flex-wrap gap-2">${component.tokens.map((token) => `<code>${escapeHtml(token)}</code>`).join("")}</div>
                <p class="small mt-3 mb-1"><strong>Project classes</strong></p>
                <div class="d-flex flex-wrap gap-2">${component.projectClasses.map((className) => `<code>${escapeHtml(className)}</code>`).join("")}</div>
                ${renderComponentTokenSummary(component)}
              </article>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
    ${renderComponentGallerySection()}
  `;
}

function renderComponentGallerySection() {
  return `
    <section class="card border-0 shadow-sm">
      <div class="card-body d-grid gap-3">
        <p class="text-uppercase text-secondary fw-bold small mb-1">Component Gallery</p>
        <h2 class="h4">Real states preview</h2>
        <p class="text-secondary">A wider visual QA surface for Bootstrap and ProjectTrack components before editing tokens by component.</p>
        <div class="row row-cols-1 row-cols-xl-2 g-3">
          <div class="col"><section class="border rounded-3 p-3 h-100 bg-white">
            <h3 class="h6">Breadcrumbs and navigation</h3>
            <nav aria-label="Theme preview breadcrumb">
              <ol class="breadcrumb mb-3">
                <li class="breadcrumb-item"><a href="#">Workspace</a></li>
                <li class="breadcrumb-item"><a href="#">Projects</a></li>
                <li class="breadcrumb-item active" aria-current="page">Theme Manager</li>
              </ol>
            </nav>
            <ul class="nav nav-pills gap-2">
              <li class="nav-item"><a class="nav-link active" href="#">Active</a></li>
              <li class="nav-item"><a class="nav-link" href="#">Default</a></li>
              <li class="nav-item"><a class="nav-link disabled" aria-disabled="true">Disabled</a></li>
            </ul>
          </section></div>

          <div class="col"><section class="border rounded-3 p-3 h-100 bg-white">
            <h3 class="h6">Form states</h3>
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label" for="theme-valid-field">Valid field</label>
                <input class="form-control is-valid" id="theme-valid-field" type="text" value="Approved">
                <div class="valid-feedback">Looks good.</div>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="theme-invalid-field">Invalid field</label>
                <input class="form-control is-invalid" id="theme-invalid-field" type="text" value="Missing owner">
                <div class="invalid-feedback">Owner is required.</div>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="theme-disabled-field">Disabled field</label>
                <input class="form-control" id="theme-disabled-field" type="text" value="Locked" disabled>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="theme-readonly-field">Readonly field</label>
                <input class="form-control" id="theme-readonly-field" type="text" value="System generated" readonly>
              </div>
            </div>
          </section></div>

          <div class="col"><section class="border rounded-3 p-3 h-100 bg-white">
            <h3 class="h6">Metric cards</h3>
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <div class="border rounded-3 p-3 h-100">
                  <p class="text-uppercase text-secondary small fw-bold mb-1">Assigned</p>
                  <strong class="h3 d-block mb-1">18</strong>
                  <span class="badge text-bg-primary">Active</span>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="border rounded-3 p-3 h-100">
                  <p class="text-uppercase text-secondary small fw-bold mb-1">QA Ready</p>
                  <strong class="h3 d-block mb-1">7</strong>
                  <span class="badge text-bg-warning">Review</span>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="border rounded-3 p-3 h-100">
                  <p class="text-uppercase text-secondary small fw-bold mb-1">Done</p>
                  <strong class="h3 d-block mb-1">42</strong>
                  <span class="badge text-bg-success">Closed</span>
                </div>
              </div>
            </div>
          </section></div>

          <div class="col"><section class="border rounded-3 p-3 h-100 bg-white">
            <h3 class="h6">Notes and tasks</h3>
            <div class="list-group">
              <article class="list-group-item">
                <div class="d-flex justify-content-between gap-3">
                  <strong>Review launch checklist</strong>
                  <span class="badge rounded-pill text-bg-danger">High</span>
                </div>
                <p class="mb-2 text-secondary small">Confirm tracker import and final QA notes before release.</p>
                <div class="d-flex flex-wrap gap-2">
                  <span class="badge rounded-pill text-bg-primary">In progress</span>
                  <span class="badge rounded-pill text-bg-info">Linked note</span>
                </div>
              </article>
              <article class="list-group-item">
                <div class="d-flex justify-content-between gap-3">
                  <strong>Document rollback path</strong>
                  <span class="badge rounded-pill text-bg-warning text-dark">Medium</span>
                </div>
                <p class="mb-2 text-secondary small">Keep backup restore behavior visible in Theme Manager.</p>
                <span class="badge rounded-pill text-bg-warning text-dark">QA</span>
              </article>
            </div>
          </section></div>

          <div class="col"><section class="border rounded-3 p-3 h-100 bg-white">
            <h3 class="h6">Release update panel</h3>
            <div class="alert alert-info mb-3" role="status">
              <strong>Version check.</strong> ProjectTrack Chrome is checking the private release channel.
            </div>
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-primary" type="button">Download update</button>
              <button class="btn btn-outline-secondary" type="button">Check again</button>
              <button class="btn btn-outline-danger" type="button" disabled>Unavailable</button>
            </div>
          </section></div>

          <div class="col"><section class="border rounded-3 p-3 h-100 bg-white">
            <h3 class="h6">Change History entry</h3>
            <article class="border rounded-3 p-3">
              <div class="d-flex justify-content-between gap-3 flex-wrap">
                <div>
                  <strong>Theme Manager gallery coverage</strong>
                  <p class="text-secondary small mb-0">Component preview expanded for visual QA.</p>
                </div>
                <span class="badge text-bg-success">Feature</span>
              </div>
              <ul class="mt-3 mb-0 small">
                <li>Forms, navigation, modal, metrics and tasks are visible.</li>
                <li>States can be checked before token changes are saved.</li>
              </ul>
            </article>
          </section></div>

          <div class="col"><section class="border rounded-3 p-3 h-100 bg-white">
            <h3 class="h6">Modal preview</h3>
            <div class="card" role="dialog" aria-modal="false" aria-label="Theme modal preview">
              <div class="modal-header">
                <h4 class="modal-title h6">Confirm theme save</h4>
                <button type="button" class="btn-close" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p class="mb-0">Only the marked token block will be replaced. A backup is created first.</p>
              </div>
              <div class="modal-footer">
                <button class="btn btn-outline-secondary" type="button">Cancel</button>
                <button class="btn btn-primary" type="button">Save tokens</button>
              </div>
            </div>
          </section></div>

          <div class="col"><section class="border rounded-3 p-3 h-100 bg-white">
            <h3 class="h6">Confirm dialog</h3>
            <div class="card">
              <div class="card-body">
              <strong>Restore backup?</strong>
              <p class="text-secondary mb-3">The current CSS will be backed up before restoring the selected version.</p>
              <div class="d-flex flex-wrap gap-2 justify-content-end">
                <button class="btn btn-outline-secondary btn-sm" type="button">Cancel</button>
                <button class="btn btn-danger btn-sm" type="button">Restore</button>
              </div>
              </div>
            </div>
          </section></div>
        </div>
      </div>
    </section>
  `;
}

function renderAuditSection() {
  const customClasses = [...new Set((themeState.projectCss.match(/\.pt-[a-zA-Z0-9_-]+/g) || []).map((item) => item.slice(1)))].sort();
  const registeredClasses = new Set(THEME_COMPONENT_REGISTRY.flatMap((component) => component.projectClasses));
  const rows = customClasses.slice(0, 80).map((className) => {
    const status = registeredClasses.has(className) ? "keep" : "componentize";
    const action = status === "keep" ? "Document tokens and cover in Theme Manager." : "Move to Chrome/components, migrate to Bootstrap, or remove.";
    return `
      <tr>
        <td><code>${escapeHtml(className)}</code></td>
        <td><span class="badge ${status === "keep" ? "text-bg-success" : "text-bg-warning"}">${status}</span></td>
        <td>${escapeHtml(action)}</td>
      </tr>
    `;
  }).join("");

  return `
    <section class="card border-0 shadow-sm">
      <div class="card-body d-grid gap-3">
        <p class="text-uppercase text-secondary fw-bold small mb-1">Legacy / Audit</p>
        <h2 class="h4">Custom class inventory</h2>
        <p class="text-secondary">Initial automatic audit. Future source of truth should be the explicit component registry.</p>
        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead><tr><th>Class</th><th>Status</th><th>Recommended action</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="3">No pt-* classes detected.</td></tr>`}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function luminance(hex) {
  const channels = hex.replace("#", "").match(/.{2}/g)?.map((pair) => {
    const channel = Number.parseInt(pair, 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  if (!channels) {
    return 0;
  }
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(foreground, background) {
  if (!isColorLike(foreground) || !isColorLike(background)) {
    return null;
  }
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function renderAccessibilitySection() {
  const checks = [
    ["Text primary on card", "--pt-color-text-primary", "--pt-color-card"],
    ["Text secondary on card", "--pt-color-text-secondary", "--pt-color-card"],
    ["Primary button text", "--pt-color-white", "--bs-primary"],
    ["Danger button text", "--pt-color-white", "--bs-danger"]
  ].map(([label, foregroundToken, backgroundToken]) => {
    const foreground = themeState.editedTokens[foregroundToken] || (foregroundToken === "--pt-color-white" ? "#ffffff" : "");
    const background = themeState.editedTokens[backgroundToken] || "";
    const ratio = contrastRatio(foreground, background);
    const status = ratio == null ? "Review" : ratio >= 4.5 ? "Pass" : "Fail";
    return { label, foreground, background, ratio, status };
  });

  return `
    <section class="card border-0 shadow-sm">
      <div class="card-body">
        <p class="text-uppercase text-secondary fw-bold small mb-1">WCAG AA</p>
        <h2 class="h4">Accessibility checks</h2>
        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead><tr><th>Check</th><th>Ratio</th><th>Status</th><th>Colors</th></tr></thead>
            <tbody>
              ${checks.map((check) => `
                <tr>
                  <td>${escapeHtml(check.label)}</td>
                  <td>${check.ratio == null ? "Manual" : check.ratio.toFixed(2)}</td>
                  <td><span class="badge ${check.status === "Pass" ? "text-bg-success" : check.status === "Fail" ? "text-bg-danger" : "text-bg-warning"}">${check.status}</span></td>
                  <td><code>${escapeHtml(check.foreground)}</code> / <code>${escapeHtml(check.background)}</code></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderImportExportSection() {
  return `
    <section class="card border-0 shadow-sm">
      <div class="card-body d-grid gap-3">
        <p class="text-uppercase text-secondary fw-bold small mb-1">Import / Export</p>
        <h2 class="h4">Reusable CSS</h2>
        <div class="row g-3">
          <div class="col-12 col-xl-6">
            <label class="form-label fw-bold" for="theme-import-css">Import :root block</label>
            <textarea class="form-control font-monospace" id="theme-import-css" data-theme-import rows="14" spellcheck="false">${escapeHtml(themeState.importCss)}</textarea>
            <button type="button" class="btn btn-outline-primary mt-3" data-action="theme-import-css">Apply import to preview</button>
          </div>
          <div class="col-12 col-xl-6">
            <label class="form-label fw-bold" for="theme-export-css">Export :root block</label>
            <textarea class="form-control font-monospace" id="theme-export-css" data-theme-output rows="14" spellcheck="false">${escapeHtml(buildRootBlock())}</textarea>
            <div class="d-flex flex-wrap gap-2 mt-3">
              <button type="button" class="btn btn-primary" data-action="theme-copy-css">Copy CSS</button>
              <button type="button" class="btn btn-outline-secondary" data-action="theme-copy-marked-css">Copy marked block</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderBackupsSection() {
  return `
    <section class="card border-0 shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between gap-3 flex-wrap mb-3">
          <div>
            <p class="text-uppercase text-secondary fw-bold small mb-1">Backups / Versions</p>
            <h2 class="h4 mb-0">Previous CSS versions</h2>
          </div>
          <button type="button" class="btn btn-outline-primary" data-action="theme-refresh-backups">Refresh</button>
        </div>
        ${themeState.serverAvailable ? "" : `<p class="alert alert-warning">Backups are available when the Python server is running.</p>`}
        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead><tr><th>Version</th><th>Modified</th><th>Size</th><th>Actions</th></tr></thead>
            <tbody>
              ${themeState.backups.map((backup) => `
                <tr>
                  <td><code>${escapeHtml(backup.name)}</code></td>
                  <td>${escapeHtml(backup.modified || "")}</td>
                  <td>${Math.round(Number(backup.size || 0) / 1024)} KB</td>
                  <td class="d-flex flex-wrap gap-2">
                    <button type="button" class="btn btn-sm btn-outline-secondary" data-action="theme-preview-backup" data-backup-name="${escapeAttribute(backup.name)}">Preview</button>
                    <button type="button" class="btn btn-sm btn-outline-primary" data-action="theme-restore-backup" data-backup-name="${escapeAttribute(backup.name)}">Restore</button>
                  </td>
                </tr>
              `).join("") || `<tr><td colspan="4">No backups found yet.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderDiffSection() {
  const changes = diffTokens();
  const componentGroups = buildComponentDiffGroups(changes);
  const changedComponents = new Set(
    changes.flatMap((change) => getImpactedComponents(change.name).map((component) => component.id))
  );
  const categoryCounts = changes.reduce((counts, change) => {
    counts[change.category] = (counts[change.category] || 0) + 1;
    return counts;
  }, {});

  return `
    <section class="card border-0 shadow-sm">
      <div class="card-body d-grid gap-3">
        <p class="text-uppercase text-secondary fw-bold small mb-1">Diff</p>
        <h2 class="h4">Unsaved changes</h2>
        ${changes.length ? `
          <div class="row row-cols-1 row-cols-md-3 g-3">
            <div class="col"><div class="border rounded-3 p-3 h-100 bg-white">
              <strong>${changes.length}</strong>
              <span>changed tokens</span>
            </div></div>
            <div class="col"><div class="border rounded-3 p-3 h-100 bg-white">
              <strong>${changedComponents.size}</strong>
              <span>impacted components</span>
            </div></div>
            <div class="col"><div class="border rounded-3 p-3 h-100 bg-white">
              <strong>${Object.keys(categoryCounts).length}</strong>
              <span>changed categories</span>
            </div></div>
          </div>

          <div class="d-flex flex-wrap gap-2 mt-3">
            ${Object.entries(categoryCounts).map(([category, count]) => `<code>${escapeHtml(category)}: ${count}</code>`).join("")}
          </div>

          <div class="row row-cols-1 g-3 mt-3">
            ${componentGroups.map((group) => `
              <div class="col"><article class="border rounded-3 p-3 bg-white h-100">
                <div class="d-flex justify-content-between gap-3 flex-wrap mb-2">
                  <div>
                    <h3 class="h6 mb-1">${escapeHtml(group.name)}</h3>
                    <p class="small text-secondary mb-0">${escapeHtml(group.screens.join(", "))}</p>
                  </div>
                  <span class="badge text-bg-primary">${group.changes.length} changes</span>
                </div>
                <div class="table-responsive">
                  <table class="table table-sm align-middle mb-0">
                    <thead><tr><th>Variable</th><th>Current</th><th>Edited</th><th>Action</th></tr></thead>
                    <tbody>${group.changes.map(renderDiffChangeRow).join("")}</tbody>
                  </table>
                </div>
              </article></div>
            `).join("")}
          </div>
        ` : `
          <p class="alert alert-success mb-0">No changes. The edited theme matches project CSS.</p>
        `}
      </div>
    </section>

    <section class="card border-0 shadow-sm">
      <div class="card-body">
        <p class="text-uppercase text-secondary fw-bold small mb-1">Full Token Diff</p>
        <h2 class="h4">Flat review</h2>
        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead><tr><th>Variable</th><th>Current</th><th>Edited</th><th>Impacted components</th><th>Action</th></tr></thead>
            <tbody>
              ${changes.map((change) => {
                const impacted = getImpactedComponents(change.name);
                return `
                  <tr>
                    <td><code>${escapeHtml(change.name)}</code><span class="d-block small text-secondary">${escapeHtml(change.category)}</span></td>
                    <td><code>${escapeHtml(change.original)}</code></td>
                    <td><code>${escapeHtml(change.edited)}</code></td>
                    <td>${impacted.length ? impacted.map((component) => `<span class="badge text-bg-light border me-1">${escapeHtml(component.name)}</span>`).join("") : `<span class="badge text-bg-secondary">Global</span>`}</td>
                    <td><button type="button" class="btn btn-sm btn-outline-secondary" data-action="theme-revert-token" data-theme-token-name="${escapeAttribute(change.name)}">Revert</button></td>
                  </tr>
                `;
              }).join("") || `<tr><td colspan="5">No changes. The edited theme matches project CSS.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderPreviewSection() {
  return `
    <section class="d-grid gap-4" aria-label="Live theme preview">
      <nav class="navbar navbar-expand-lg bg-body-tertiary border rounded mb-4">
        <div class="container-fluid">
          <span class="navbar-brand d-flex align-items-center gap-2 fw-bold">${renderProjectTrackBrand(32)} ProjectTrack</span>
          <div class="d-flex gap-2 flex-wrap">
            <a class="nav-link active" href="#">Overview</a>
            <a class="nav-link" href="#">Components</a>
            <button class="btn btn-primary btn-sm" type="button">Refresh Data</button>
          </div>
        </div>
      </nav>

      ${renderHeroCard({
        title: "Clinical operations workspace",
        description: "Review project signals, align decisions, and keep the next action visible.",
        meta: ["Hero Card", "ProjectTrack", "Live preview"],
        actionsHtml: `
          <button class="btn btn-light" type="button">Primary path</button>
          <button class="btn btn-outline-light" type="button">Secondary</button>
        `
      })}

      <div class="row g-3 mt-1">
        <div class="col-12 col-xl-6">
          <section class="card h-100">
            <div class="card-body">
              <span class="badge rounded-pill text-bg-primary">In progress</span>
              <h3 class="h5 mt-3">Bootstrap and ProjectTrack cards</h3>
              <p class="text-secondary">Cards, buttons, forms, alerts and pills consume the edited tokens in real time.</p>
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-primary" type="button">Primary</button>
                <button class="btn btn-secondary" type="button">Secondary</button>
                <button class="btn btn-info" type="button">Info</button>
                <button class="btn btn-warning" type="button">Warning</button>
                <button class="btn btn-dark" type="button">Dark</button>
                <button class="btn btn-outline-primary" type="button">Outline</button>
              </div>
            </div>
          </section>
        </div>
        <div class="col-12 col-xl-6">
          <section class="card h-100">
            <div class="card-body">
              <h3 class="h5">Environment Progress</h3>
              ${renderEnvironmentProgress("STG", ["QA", "STG", "PROD"])}
              <div class="progress mt-4" role="progressbar" aria-label="Theme progress" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar bg-success" style="width: 72%">72%</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="row g-3 mt-1">
        <div class="col-12 col-lg-6">
          <div class="alert alert-success" role="alert"><strong>Success.</strong> The selected success token is readable.</div>
          <div class="alert alert-warning" role="alert"><strong>Warning.</strong> Bootstrap warning should remain readable on light surfaces.</div>
          <div class="alert alert-info" role="alert"><strong>Info.</strong> Bootstrap info covers neutral guidance and support messages.</div>
          <div class="alert alert-danger mb-lg-0" role="alert"><strong>Danger.</strong> Critical states use the danger token.</div>
        </div>
        <div class="col-12 col-lg-6">
          <section class="card">
            <div class="card-body">
              <h3 class="h5">Contact form</h3>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label" for="theme-preview-name">Name</label>
                  <input class="form-control" id="theme-preview-name" type="text" value="Astellas Partner">
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label" for="theme-preview-status">Status</label>
                  <select class="form-select" id="theme-preview-status"><option>Ready</option><option>Review</option></select>
                </div>
                <div class="col-12">
                  <textarea class="form-control" rows="3">Share a concise update for the project team.</textarea>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="row g-3 mt-1">
        <div class="col-12 col-xl-6">
          <section class="card h-100">
            <div class="card-body">
              <h3 class="h5">List group and dropdown</h3>
              <div class="list-group mb-3">
                <button type="button" class="list-group-item list-group-item-action active">Active workspace item</button>
                <button type="button" class="list-group-item list-group-item-action">Default workspace item</button>
                <button type="button" class="list-group-item list-group-item-action disabled" disabled>Disabled workspace item</button>
              </div>
              <div class="dropdown">
                <button class="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">Dropdown states</button>
                <ul class="dropdown-menu show position-static mt-2">
                  <li><button class="dropdown-item active" type="button">Active item</button></li>
                  <li><button class="dropdown-item" type="button">Default item</button></li>
                  <li><button class="dropdown-item disabled" type="button" disabled>Disabled item</button></li>
                </ul>
              </div>
            </div>
          </section>
        </div>
        <div class="col-12 col-xl-6">
          <section class="card h-100">
            <div class="card-body">
              <h3 class="h5">Table and badges</h3>
              <div class="table-responsive">
                <table class="table table-sm align-middle">
                  <thead>
                    <tr><th>Component</th><th>Status</th><th>Token</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Cards</td><td><span class="badge text-bg-success">Pass</span></td><td><code>--pt-card-bg</code></td></tr>
                    <tr><td>Buttons</td><td><span class="badge text-bg-warning">Review</span></td><td><code>--bs-primary</code></td></tr>
                    <tr><td>Alerts</td><td><span class="badge text-bg-info">Info</span></td><td><code>--bs-info</code></td></tr>
                    <tr><td>Danger</td><td><span class="badge text-bg-danger">Fail</span></td><td><code>--bs-danger</code></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  `;
}

function renderActiveSection() {
  switch (themeState.activeSection) {
    case "tokens":
      return renderTokensSection();
    case "bootstrap":
      return renderBootstrapSection();
    case "components":
      return renderProjectTrackComponentsSection();
    case "audit":
      return renderAuditSection();
    case "accessibility":
      return renderAccessibilitySection();
    case "import-export":
      return renderImportExportSection();
    case "backups":
      return renderBackupsSection();
    case "diff":
      return renderDiffSection();
    default:
      return `
        <section class="card border-0 shadow-sm">
          <div class="card-body">
            <p class="text-uppercase text-secondary fw-bold small mb-1">Overview</p>
            <h2 class="h4">Project theme status</h2>
            <div class="row g-3 mt-1">
              <div class="col-12 col-md-6 col-xl-3"><div class="border rounded-3 p-3"><strong>${Object.keys(themeState.originalTokens).filter((key) => key.startsWith("--bs-")).length}</strong><span class="d-block text-secondary small">Bootstrap tokens</span></div></div>
              <div class="col-12 col-md-6 col-xl-3"><div class="border rounded-3 p-3"><strong>${Object.keys(themeState.originalTokens).filter((key) => key.startsWith("--pt-")).length}</strong><span class="d-block text-secondary small">ProjectTrack tokens</span></div></div>
              <div class="col-12 col-md-6 col-xl-3"><div class="border rounded-3 p-3"><strong>${THEME_COMPONENT_REGISTRY.length}</strong><span class="d-block text-secondary small">Registered components</span></div></div>
              <div class="col-12 col-md-6 col-xl-3"><div class="border rounded-3 p-3"><strong>${diffTokens().length}</strong><span class="d-block text-secondary small">Unsaved changes</span></div></div>
            </div>
          </div>
        </section>
        ${renderPreviewSection()}
      `;
  }
}

function renderNavButton(id, label) {
  const active = themeState.activeSection === id;
  return `<button type="button" class="nav-link text-start ${active ? "active" : ""}" data-theme-section="${escapeAttribute(id)}">${escapeHtml(label)}</button>`;
}

function updateLiveOutputs(manager) {
  const output = manager.querySelector("[data-theme-output]");
  if (output) {
    output.value = buildRootBlock();
  }
  manager.querySelectorAll("[data-theme-live-value]").forEach((node) => {
    const token = node.dataset.themeLiveValue;
    node.textContent = themeState.editedTokens[token] || "";
  });
  const diffCount = manager.querySelector("[data-theme-diff-count]");
  if (diffCount) {
    diffCount.textContent = String(diffTokens().length);
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const element = document.createElement("textarea");
    element.value = text;
    document.body.appendChild(element);
    element.select();
    document.execCommand("copy");
    element.remove();
  }
}

async function saveWithFileSystemApi() {
  if (!window.showOpenFilePicker) {
    throw new Error("File System Access API is not available in this browser.");
  }
  const [handle] = await window.showOpenFilePicker({
    multiple: false,
    types: [{ description: "ProjectTrack CSS", accept: { "text/css": [".css"] } }]
  });
  const file = await handle.getFile();
  const currentCss = await file.text();
  const marked = extractMarkedBlock(currentCss);
  if (marked.status !== "found") {
    throw new Error("Selected CSS file must contain the Theme Manager token block for File System API save.");
  }
  const start = currentCss.indexOf(START_MARKER);
  const end = currentCss.indexOf(END_MARKER, start) + END_MARKER.length;
  const nextCss = `${currentCss.slice(0, start)}${buildMarkedBlock()}${currentCss.slice(end)}`;
  const writable = await handle.createWritable();
  await writable.write(nextCss);
  await writable.close();
}

export function bindThemeManagerControls(rootNode = document) {
  const manager = rootNode.querySelector("[data-theme-manager]");
  if (!manager) {
    return;
  }

  manager.querySelectorAll("[data-theme-token]").forEach((control) => {
    control.addEventListener("input", () => {
      updateEditedTokenFromControl(manager, control);
      updateLiveOutputs(manager);
    });
    control.addEventListener("change", () => {
      updateEditedTokenFromControl(manager, control);
      renderInto(manager);
    });
  });

  manager.querySelectorAll("[data-theme-section]").forEach((button) => {
    button.addEventListener("click", () => {
      themeState.activeSection = button.dataset.themeSection;
      renderInto(manager);
    });
  });

  manager.querySelector("[data-action='theme-load-css']")?.addEventListener("click", async () => {
    try {
      await loadProjectCss();
    } catch (error) {
      setMessage(error.message, "danger");
    }
    renderInto(manager);
  });

  manager.querySelector("[data-action='theme-reset-project']")?.addEventListener("click", () => {
    themeState.editedTokens = { ...themeState.originalTokens };
    applyTheme(themeState.editedTokens);
    setMessage("Preview reset to project CSS.", "info");
    renderInto(manager);
  });

  manager.querySelector("[data-action='theme-import-css']")?.addEventListener("click", () => {
    const input = manager.querySelector("[data-theme-import]");
    themeState.importCss = input?.value || "";
    const imported = parseRootVariables(themeState.importCss);
    const knownNames = new Set(THEME_TOKEN_DEFINITIONS.map((token) => token.name));
    Object.entries(imported).forEach(([name, value]) => {
      if (knownNames.has(name)) {
        themeState.editedTokens[name] = value;
      }
    });
    applyTheme(themeState.editedTokens);
    setMessage("Known imported tokens were applied to the preview.", "success");
    renderInto(manager);
  });

  manager.querySelectorAll("[data-action='theme-copy-css']").forEach((button) => {
    button.addEventListener("click", async () => {
      await copyText(buildRootBlock());
      setMessage("CSS copied.", "success");
      renderInto(manager);
    });
  });

  manager.querySelector("[data-action='theme-copy-marked-css']")?.addEventListener("click", async () => {
    await copyText(buildMarkedBlock());
    setMessage("Marked Theme Manager block copied.", "success");
    renderInto(manager);
  });

  manager.querySelector("[data-action='theme-save-css']")?.addEventListener("click", async () => {
    const marked = extractMarkedBlock(themeState.projectCss);
    const createBlock = marked.status === "missing";
    const confirmed = window.confirm(
      createBlock
        ? "The marked Theme Manager block is missing. Create it and save the edited tokens?"
        : "Save edited tokens to Chrome/styles/projecttrack.css? A backup will be created first."
    );
    if (!confirmed) {
      return;
    }

    try {
      if (themeState.serverAvailable) {
        const payload = await requestServer("/api/theme", {
          method: "POST",
          body: JSON.stringify({ css: buildRootBlock(), createBlock })
        });
        themeState.projectCss = payload.css || themeState.projectCss;
        themeState.backups = payload.backups || themeState.backups;
        themeState.originalTokens = { ...themeState.editedTokens };
        setMessage(`Saved. Backup created: ${payload.backup}.`, "success");
      } else {
        await saveWithFileSystemApi();
        themeState.originalTokens = { ...themeState.editedTokens };
        setMessage("Saved with File System Access API. Create an external backup if Python is unavailable.", "success");
      }
    } catch (error) {
      setMessage(error.message, "danger");
    }
    renderInto(manager);
  });

  manager.querySelector("[data-action='theme-refresh-backups']")?.addEventListener("click", async () => {
    try {
      const payload = await requestServer("/api/backups");
      themeState.backups = payload.backups || [];
      setMessage("Backups refreshed.", "success");
    } catch (error) {
      setMessage(error.message, "danger");
    }
    renderInto(manager);
  });

  manager.querySelectorAll("[data-action='theme-preview-backup']").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const payload = await requestServer(`/api/backups/${encodeURIComponent(button.dataset.backupName)}`);
        await copyText(payload.css || "");
        setMessage(`Backup ${button.dataset.backupName} copied for preview.`, "success");
      } catch (error) {
        setMessage(error.message, "danger");
      }
      renderInto(manager);
    });
  });

  manager.querySelectorAll("[data-action='theme-restore-backup']").forEach((button) => {
    button.addEventListener("click", async () => {
      const name = button.dataset.backupName;
      if (!window.confirm(`Restore ${name}? Current projecttrack.css will be backed up first.`)) {
        return;
      }
      try {
        const payload = await requestServer("/api/restore", {
          method: "POST",
          body: JSON.stringify({ name })
        });
        themeState.projectCss = payload.css || themeState.projectCss;
        themeState.backups = payload.backups || themeState.backups;
        const tokens = parseRootVariables(themeState.projectCss);
        themeState.originalTokens = normalizeTokens(tokens);
        themeState.editedTokens = { ...themeState.originalTokens };
        applyTheme(themeState.editedTokens);
        setMessage(`Restored ${payload.restored}. Current file backup: ${payload.backup}.`, "success");
      } catch (error) {
        setMessage(error.message, "danger");
      }
      renderInto(manager);
    });
  });

  manager.querySelectorAll("[data-action='theme-revert-token']").forEach((button) => {
    button.addEventListener("click", () => {
      const token = button.dataset.themeTokenName;
      themeState.editedTokens[token] = themeState.originalTokens[token];
      applyTheme(themeState.editedTokens);
      setMessage(`${token} reverted.`, "info");
      renderInto(manager);
    });
  });

  if (themeState.source === "loading") {
    loadProjectCss()
      .catch((error) => {
        themeState.source = "error";
        themeState.originalTokens = normalizeTokens({});
        themeState.editedTokens = { ...themeState.originalTokens };
        setMessage(error.message, "danger");
      })
      .finally(() => renderInto(manager));
  }
}

export function renderThemeManagerScreen() {
  const changes = diffTokens();
  const sourceLabel = themeState.serverAvailable
    ? "Python server"
    : themeState.source === "read-only-css-fetch"
      ? "Read-only CSS"
      : "Loading";
  const navItems = [
    ["overview", "Overview"],
    ["tokens", "Theme Tokens"],
    ["bootstrap", "Bootstrap Base"],
    ["components", "ProjectTrack Components"],
    ["audit", "Legacy / Audit"],
    ["accessibility", "Accessibility"],
    ["import-export", "Import / Export"],
    ["backups", "Backups / Versions"],
    ["diff", "Diff"]
  ];

  return `
    ${renderHeroCard({
      title: "Theme Manager",
      description: "Read projecttrack.css, edit controlled tokens, preview real components, export CSS and save through a safe backup flow.",
      meta: ["One theme per project", sourceLabel, `${changes.length} unsaved changes`],
      actionsHtml: `<button type="button" class="btn btn-outline-light" data-action="navigate-main" data-view-id="dashboard">Back</button>`
    })}

    <section class="d-grid gap-4" data-theme-manager>
      <header class="card border-0 shadow-sm">
        <div class="card-body d-grid gap-3">
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
          <p class="text-uppercase text-secondary fw-bold small mb-1">Source</p>
          <h2 class="h5 mb-0">Chrome/styles/projecttrack.css</h2>
          <p class="mb-0 small text-secondary">Loaded: ${themeState.loadedAt ? escapeHtml(themeState.loadedAt.toLocaleString()) : "pending"}</p>
        </div>
        <span class="badge ${themeState.messageTone === "danger" ? "text-bg-danger" : themeState.messageTone === "warning" ? "text-bg-warning" : themeState.messageTone === "success" ? "text-bg-success" : "text-bg-info"}">${escapeHtml(themeState.message)}</span>
        <div class="d-flex gap-2 flex-wrap justify-content-end">
          <button type="button" class="btn btn-outline-secondary" data-action="theme-load-css">Reload CSS</button>
          <button type="button" class="btn btn-outline-secondary" data-action="theme-reset-project">Reset to project CSS</button>
          <button type="button" class="btn btn-primary" data-action="theme-save-css">Save to projecttrack.css</button>
        </div>
        </div>
        </div>
      </header>

      <div class="row g-4">
        <aside class="col-12 col-xl-3" aria-label="Theme Manager sections">
          <div class="card border-0 shadow-sm sticky-top" style="top: 96px;">
          <div class="card-body d-grid gap-3">
          <nav class="nav nav-pills flex-column gap-1">
            ${navItems.map(([id, label]) => renderNavButton(id, label)).join("")}
          </nav>
          <div class="border-top pt-3 d-grid gap-1 text-secondary small">
            <strong data-theme-diff-count>${changes.length}</strong>
            <span>unsaved changes</span>
          </div>
          </div>
          </div>
        </aside>
        <main class="col-12 col-xl-9 d-grid gap-4">
          ${renderActiveSection()}
          ${themeState.activeSection !== "overview" ? renderPreviewSection() : ""}
        </main>
      </div>
    </section>
  `;
}
