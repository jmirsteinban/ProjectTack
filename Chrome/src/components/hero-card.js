import { escapeHtml } from "../services/html.js";

function renderOptionalText(tagName, value, className) {
  if (!value) {
    return "";
  }
  return `<${tagName} class="${className}">${escapeHtml(value)}</${tagName}>`;
}

function renderMeta(metaItems = []) {
  const items = metaItems.filter(Boolean);
  if (!items.length) {
    return "";
  }

  return `
      <div class="d-flex flex-wrap gap-2 mt-3">
        ${items.map((item) => `<span class="badge rounded-pill bg-white text-dark border">${escapeHtml(item)}</span>`).join("")}
      </div>
    `;
}

export function renderHeroCard({
  title = "",
  description = "",
  descriptionHtml = "",
  meta = [],
  metaHtml = "",
  controlsHtml = "",
  actionsHtml = "",
  heroClass = "",
  mainClass = "col-12 col-lg",
  titleClass = "display-6 fw-bold mb-2",
  descriptionClass = "lead mb-0",
} = {}) {
  const descriptionMarkup = descriptionHtml || renderOptionalText("p", description, descriptionClass);
  const metaMarkup = metaHtml || renderMeta(meta);
  const controlsMarkup = controlsHtml
    ? `<div class="col-12 col-xl">${controlsHtml}</div>`
    : "";
  const actionsMarkup = actionsHtml
    ? `<div class="col-12 col-lg-auto d-flex justify-content-lg-end align-items-start gap-2 flex-wrap">${actionsHtml}</div>`
    : "";

  return `
    <section class="card border-0 text-white shadow-lg rounded-4 ${heroClass}" style="background: var(--pt-gradient-hero);">
      <div class="card-body p-4 p-xl-5">
        <div class="row g-3 align-items-start">
        <div class="${mainClass}">
          ${renderOptionalText("h1", title, titleClass)}
          ${descriptionMarkup}
          ${metaMarkup}
        </div>
        ${controlsMarkup}
        ${actionsMarkup}
        </div>
      </div>
    </section>
  `;
}
