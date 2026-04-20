import { renderEnvironmentProgress } from "../components/environment-progress.js";
import { renderHeroCard } from "../components/hero-card.js";
import { renderProjectTrackBrand } from "../components/projecttrack-brand.js";
import { BOOTSTRAP_THEME_SCALES, THEME_COMPONENT_REGISTRY } from "../theme/component-registry.js";

const SERVER_URL = "http://127.0.0.1:4177";
const START_MARKER = "/* THEME MANAGER TOKENS START */";
const END_MARKER = "/* THEME MANAGER TOKENS END */";
const LOCAL_FALLBACK_CSS_URL = "styles/projecttrack.css";

const FONT_STACKS = {
  Graphik: '"Graphik", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  "System UI": 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  Inter: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  Roboto: '"Roboto", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  Montserrat: '"Montserrat", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  "Nunito Sans": '"Nunito Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  "Source Sans 3": '"Source Sans 3", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  "Open Sans": '"Open Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  Lato: '"Lato", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  Poppins: '"Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  "IBM Plex Sans": '"IBM Plex Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  "Noto Sans": '"Noto Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
};

const THEME_TOKEN_DEFINITIONS = [
  { name: "--bs-primary", label: "Bootstrap primary", category: "Colors", type: "color", fallback: "#0d6efd" },
  { name: "--bs-secondary", label: "Bootstrap secondary", category: "Colors", type: "color", fallback: "#6c757d" },
  { name: "--bs-success", label: "Bootstrap success", category: "Colors", type: "color", fallback: "#198754" },
  { name: "--bs-danger", label: "Bootstrap danger", category: "Colors", type: "color", fallback: "#dc3545" },
  { name: "--pt-color-brand-primary", label: "ProjectTrack brand", category: "Colors", type: "color", fallback: "#204d38" },
  { name: "--pt-color-brand-strong", label: "Brand strong", category: "Colors", type: "color", fallback: "#153426" },
  { name: "--pt-color-brand-soft", label: "Brand soft", category: "Colors", type: "color", fallback: "#d9e9df" },
  { name: "--pt-color-text-primary", label: "Text primary", category: "Colors", type: "color", fallback: "#1d2a23" },
  { name: "--pt-color-text-secondary", label: "Text secondary", category: "Colors", type: "color", fallback: "#66756c" },
  { name: "--pt-color-bg-canvas", label: "Canvas background", category: "Colors", type: "text", fallback: "rgba(247, 246, 240, 0.92)" },
  { name: "--pt-color-card", label: "Card surface", category: "Colors", type: "color", fallback: "#fbfaf6" },
  { name: "--pt-color-border-subtle", label: "Subtle border", category: "Colors", type: "text", fallback: "rgba(29, 42, 35, 0.12)" },
  { name: "--pt-color-status-info", label: "Status info", category: "States", type: "color", fallback: "#7cb7ff" },
  { name: "--pt-color-status-warning", label: "Status warning", category: "States", type: "color", fallback: "#f59e0b" },
  { name: "--pt-color-status-success", label: "Status success", category: "States", type: "color", fallback: "#16a34a" },
  { name: "--pt-color-status-danger", label: "Status danger", category: "States", type: "color", fallback: "#dc2626" },
  { name: "--pt-font-sans", label: "Body font stack", category: "Typography", type: "font", fallback: FONT_STACKS["System UI"] },
  { name: "--pt-font-heading", label: "Heading font stack", category: "Typography", type: "font", fallback: FONT_STACKS.Graphik },
  { name: "--pt-text-step-base", label: "Base text size", category: "Typography", type: "range", min: 10, max: 18, step: 1, unit: "px", fallback: "12px" },
  { name: "--pt-card-border-radius", label: "Card radius", category: "Shape", type: "select", options: BOOTSTRAP_THEME_SCALES.radius, fallback: "20px" },
  { name: "--pt-btn-border-radius", label: "Button radius", category: "Shape", type: "select", options: BOOTSTRAP_THEME_SCALES.radius, fallback: "14px" },
  { name: "--pt-form-control-radius", label: "Form radius", category: "Shape", type: "select", options: BOOTSTRAP_THEME_SCALES.radius, fallback: "12px" },
  { name: "--pt-alert-radius", label: "Alert radius", category: "Shape", type: "select", options: BOOTSTRAP_THEME_SCALES.radius, fallback: "16px" },
  { name: "--pt-card-box-shadow", label: "Card shadow", category: "Shadows", type: "select", options: BOOTSTRAP_THEME_SCALES.shadow, fallback: "0 14px 28px rgba(22, 36, 27, 0.08)" },
  { name: "--pt-btn-shadow", label: "Button shadow", category: "Shadows", type: "select", options: BOOTSTRAP_THEME_SCALES.shadow, fallback: "0 8px 18px rgba(22, 36, 27, 0.08)" },
  { name: "--pt-card-body-padding-x", label: "Card padding X", category: "Spacing", type: "select", options: BOOTSTRAP_THEME_SCALES.spacing, fallback: "18px" },
  { name: "--pt-card-body-padding-y", label: "Card padding Y", category: "Spacing", type: "select", options: BOOTSTRAP_THEME_SCALES.spacing, fallback: "18px" },
  { name: "--pt-btn-padding-x", label: "Button padding X", category: "Spacing", type: "select", options: BOOTSTRAP_THEME_SCALES.spacing, fallback: "16px" },
  { name: "--pt-gradient-hero", label: "Hero gradient", category: "Gradients", type: "text", fallback: "linear-gradient(135deg, #26263a 0%, #46307a 52%, #6740aa 100%)" },
  { name: "--pt-gradient-progress-track", label: "Progress gradient", category: "Gradients", type: "text", fallback: "linear-gradient(90deg, #f17d2f 0%, #ff4b5c 48%, #b33ee6 100%)" }
];

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
    ["--bs-danger", "--bs-danger-rgb"]
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
    document.querySelector(".pt-web-app")
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

function readControls(manager) {
  manager.querySelectorAll("[data-theme-token]").forEach((control) => {
    const unit = control.dataset.themeUnit || "";
    themeState.editedTokens[control.dataset.themeToken] = unit
      ? `${Number.parseFloat(control.value)}${unit}`
      : control.value;
  });
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

  if (token.type === "font") {
    const selectedFont = Object.entries(FONT_STACKS).find(([, stack]) => stack === value)?.[0] || "Custom";
    const options = Object.keys(FONT_STACKS)
      .map((font) => `<option value="${escapeAttribute(FONT_STACKS[font])}" ${selectedFont === font ? "selected" : ""}>${escapeHtml(font)}</option>`)
      .join("");
    return `
      <select class="form-select" data-theme-token="${escapeAttribute(token.name)}">
        ${options}
        <option value="${escapeAttribute(value)}" ${selectedFont === "Custom" ? "selected" : ""}>Custom / current</option>
      </select>
    `;
  }

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
    <label class="pt-theme-token-control ${changed ? "pt-theme-token-control--changed" : ""}">
      <span class="pt-theme-token-label">
        <span>${escapeHtml(token.label)}</span>
        <code>${escapeHtml(token.name)}</code>
      </span>
      ${renderValueInput(token)}
      <span class="pt-theme-token-meta">Current: <code>${escapeHtml(original)}</code></span>
    </label>
  `;
}

function renderTokensSection() {
  const grouped = THEME_TOKEN_DEFINITIONS.reduce((groups, token) => {
    groups[token.category] = groups[token.category] || [];
    groups[token.category].push(token);
    return groups;
  }, {});

  return Object.entries(grouped).map(([group, tokens]) => `
    <section class="card pt-theme-section-card" id="theme-${escapeAttribute(group.toLowerCase())}">
      <div class="card-body">
        <div class="d-flex justify-content-between gap-3 flex-wrap mb-3">
          <div>
            <p class="text-uppercase text-secondary fw-bold small mb-1">Theme Tokens</p>
            <h2 class="h4 mb-0">${escapeHtml(group)}</h2>
          </div>
          <span class="badge text-bg-light border">${tokens.length} tokens</span>
        </div>
        <div class="pt-theme-token-grid">
          ${tokens.map(renderTokenControl).join("")}
        </div>
      </div>
    </section>
  `).join("");
}

function renderBootstrapSection() {
  return `
    <section class="card pt-theme-section-card">
      <div class="card-body">
        <p class="text-uppercase text-secondary fw-bold small mb-1">Bootstrap 5.3</p>
        <h2 class="h4">Closed scales</h2>
        <p class="text-secondary">These controls intentionally expose only Bootstrap-approved options.</p>
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
  `;
}

function renderProjectTrackComponentsSection() {
  return `
    <section class="card pt-theme-section-card">
      <div class="card-body">
        <p class="text-uppercase text-secondary fw-bold small mb-1">ProjectTrack Components</p>
        <h2 class="h4">Registered components</h2>
        <div class="pt-theme-component-grid">
          ${THEME_COMPONENT_REGISTRY.map((component) => `
            <article class="border rounded-3 p-3">
              <div class="d-flex justify-content-between gap-3 mb-2">
                <h3 class="h6 mb-0">${escapeHtml(component.name)}</h3>
                <span class="badge text-bg-success">${escapeHtml(component.family)}</span>
              </div>
              <p class="small text-secondary mb-2">Screens: ${escapeHtml(component.screens.join(", "))}</p>
              <p class="small mb-1"><strong>Tokens</strong></p>
              <div class="pt-theme-code-list">${component.tokens.map((token) => `<code>${escapeHtml(token)}</code>`).join("")}</div>
              <p class="small mt-3 mb-1"><strong>Project classes</strong></p>
              <div class="pt-theme-code-list">${component.projectClasses.map((className) => `<code>${escapeHtml(className)}</code>`).join("")}</div>
            </article>
          `).join("")}
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
    <section class="card pt-theme-section-card">
      <div class="card-body">
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
    <section class="card pt-theme-section-card">
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
    <section class="card pt-theme-section-card">
      <div class="card-body">
        <p class="text-uppercase text-secondary fw-bold small mb-1">Import / Export</p>
        <h2 class="h4">Reusable CSS</h2>
        <div class="row g-3">
          <div class="col-12 col-xl-6">
            <label class="form-label fw-bold" for="theme-import-css">Import :root block</label>
            <textarea class="form-control pt-theme-output" id="theme-import-css" data-theme-import rows="14" spellcheck="false">${escapeHtml(themeState.importCss)}</textarea>
            <button type="button" class="btn btn-outline-primary mt-3" data-action="theme-import-css">Apply import to preview</button>
          </div>
          <div class="col-12 col-xl-6">
            <label class="form-label fw-bold" for="theme-export-css">Export :root block</label>
            <textarea class="form-control pt-theme-output" id="theme-export-css" data-theme-output rows="14" spellcheck="false">${escapeHtml(buildRootBlock())}</textarea>
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
    <section class="card pt-theme-section-card">
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
  return `
    <section class="card pt-theme-section-card">
      <div class="card-body">
        <p class="text-uppercase text-secondary fw-bold small mb-1">Diff</p>
        <h2 class="h4">Unsaved changes</h2>
        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead><tr><th>Variable</th><th>Current</th><th>Edited</th><th>Action</th></tr></thead>
            <tbody>
              ${changes.map((change) => `
                <tr>
                  <td><code>${escapeHtml(change.name)}</code></td>
                  <td><code>${escapeHtml(change.original)}</code></td>
                  <td><code>${escapeHtml(change.edited)}</code></td>
                  <td><button type="button" class="btn btn-sm btn-outline-secondary" data-action="theme-revert-token" data-theme-token-name="${escapeAttribute(change.name)}">Revert</button></td>
                </tr>
              `).join("") || `<tr><td colspan="4">No changes. The edited theme matches project CSS.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderPreviewSection() {
  return `
    <section class="pt-theme-preview-stage" aria-label="Live theme preview">
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
              <span class="pt-pill status-progress">In progress</span>
              <h3 class="h5 mt-3">Bootstrap and ProjectTrack cards</h3>
              <p class="text-secondary">Cards, buttons, forms, alerts and pills consume the edited tokens in real time.</p>
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-primary" type="button">Primary</button>
                <button class="btn btn-secondary" type="button">Secondary</button>
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
            </div>
          </section>
        </div>
      </div>

      <div class="row g-3 mt-1">
        <div class="col-12 col-lg-6">
          <div class="alert alert-success" role="alert"><strong>Success.</strong> The selected success token is readable.</div>
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
        <section class="card pt-theme-section-card">
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
      readControls(manager);
      updateLiveOutputs(manager);
    });
    control.addEventListener("change", () => {
      readControls(manager);
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

  manager.querySelector("[data-action='theme-add-google-font']")?.addEventListener("click", () => {
    const family = window.prompt("Google Font family name");
    if (!family) {
      return;
    }
    const normalized = family.trim().replace(/\s+/g, "+");
    const href = `https://fonts.googleapis.com/css2?family=${normalized}:wght@400;500;600;700&display=swap`;
    let link = document.querySelector("link[data-theme-google-font]");
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.dataset.themeGoogleFont = "true";
      document.head.appendChild(link);
    }
    link.href = href;
    const stack = `"${family.trim()}", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    themeState.editedTokens["--pt-font-sans"] = stack;
    themeState.editedTokens["--pt-font-heading"] = stack;
    applyTheme(themeState.editedTokens);
    setMessage(`${family.trim()} added to the preview. Export or save to persist the stack.`, "success");
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

    <section class="pt-theme-manager-v2" data-theme-manager>
      <header class="pt-theme-status-bar">
        <div>
          <p class="text-uppercase text-secondary fw-bold small mb-1">Source</p>
          <h2 class="h5 mb-0">Chrome/styles/projecttrack.css</h2>
          <p class="mb-0 small text-secondary">Loaded: ${themeState.loadedAt ? escapeHtml(themeState.loadedAt.toLocaleString()) : "pending"}</p>
        </div>
        <span class="badge ${themeState.messageTone === "danger" ? "text-bg-danger" : themeState.messageTone === "warning" ? "text-bg-warning" : themeState.messageTone === "success" ? "text-bg-success" : "text-bg-info"}">${escapeHtml(themeState.message)}</span>
        <div class="d-flex gap-2 flex-wrap justify-content-end">
          <button type="button" class="btn btn-outline-secondary" data-action="theme-load-css">Reload CSS</button>
          <button type="button" class="btn btn-outline-secondary" data-action="theme-reset-project">Reset to project CSS</button>
          <button type="button" class="btn btn-outline-primary" data-action="theme-add-google-font">Add Google Font</button>
          <button type="button" class="btn btn-primary" data-action="theme-save-css">Save to projecttrack.css</button>
        </div>
      </header>

      <div class="pt-theme-shell">
        <aside class="pt-theme-sidebar" aria-label="Theme Manager sections">
          <nav class="nav nav-pills flex-column gap-1">
            ${navItems.map(([id, label]) => renderNavButton(id, label)).join("")}
          </nav>
          <div class="pt-theme-sidebar-note">
            <strong data-theme-diff-count>${changes.length}</strong>
            <span>unsaved changes</span>
          </div>
        </aside>
        <main class="pt-theme-workbench">
          ${renderActiveSection()}
          ${themeState.activeSection !== "overview" ? renderPreviewSection() : ""}
        </main>
      </div>
    </section>
  `;
}
