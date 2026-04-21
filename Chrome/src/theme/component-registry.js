export const THEME_COMPONENT_REGISTRY = [
  {
    id: "global-navbar",
    name: "Global Navbar",
    family: "ProjectTrack",
    tokens: [
      "--pt-workspace-navbar-bg",
      "--pt-workspace-navbar-border-color",
      "--pt-action-primary",
      "--pt-color-brand-primary",
      "--pt-color-text-primary"
    ],
    bootstrapClasses: ["navbar", "btn", "dropdown-menu", "dropdown-item", "badge", "container-fluid"],
    projectClasses: [],
    states: ["default", "hover", "focus", "active", "expanded"],
    screens: ["All workspace views"]
  },
  {
    id: "hero-card",
    name: "Hero Card",
    family: "ProjectTrack",
    tokens: [
      "--pt-gradient-hero",
      "--pt-hero-card-radius",
      "--pt-hero-card-shadow",
      "--pt-color-text-on-dark",
      "--pt-color-text-on-dark-muted"
    ],
    bootstrapClasses: ["card", "card-body", "btn", "badge", "row", "col"],
    projectClasses: [],
    states: ["default", "focus"],
    screens: ["Dashboard", "Projects", "Changes", "Profile", "Change History", "Theme Manager"]
  },
  {
    id: "projecttrack-brand",
    name: "ProjectTrack Brand",
    family: "ProjectTrack",
    tokens: ["--pt-gradient-hero", "--pt-color-white"],
    bootstrapClasses: ["rounded-3", "shadow-sm", "border", "bg-white"],
    projectClasses: [],
    states: ["default"],
    screens: ["Login", "Navbar", "Launcher"]
  },
  {
    id: "environment-progress",
    name: "Environment Progress",
    family: "ProjectTrack",
    tokens: [
      "--pt-gradient-progress-track",
      "--pt-gradient-progress-complete",
      "--pt-gradient-progress-current",
      "--pt-gradient-progress-idle"
    ],
    bootstrapClasses: ["progress", "progress-bar", "card", "badge", "row", "col"],
    projectClasses: [],
    states: ["complete", "current", "upcoming", "hidden"],
    screens: ["Projects", "Project Detail", "Change Detail"]
  },
  {
    id: "status-pill",
    name: "Status Pill",
    family: "ProjectTrack",
    tokens: [
      "--pt-color-status-neutral",
      "--pt-color-status-info",
      "--pt-color-status-warning",
      "--pt-color-status-success",
      "--pt-color-status-danger"
    ],
    bootstrapClasses: ["badge"],
    projectClasses: [],
    states: ["neutral", "pending", "progress", "qa", "done", "error"],
    screens: ["Dashboard", "Projects", "Changes", "Change Detail"]
  },
  {
    id: "priority-pill",
    name: "Priority Pill",
    family: "ProjectTrack",
    tokens: [
      "--pt-color-status-success",
      "--pt-color-status-warning",
      "--pt-color-status-danger"
    ],
    bootstrapClasses: ["badge"],
    projectClasses: [],
    states: ["low", "medium", "high"],
    screens: ["Dashboard", "Changes", "Change Detail"]
  },
  {
    id: "metric-card",
    name: "Metric Card",
    family: "ProjectTrack",
    tokens: [
      "--pt-card-bg",
      "--pt-card-border-color",
      "--pt-card-border-radius",
      "--pt-card-box-shadow",
      "--pt-card-body-padding-x",
      "--pt-card-body-padding-y"
    ],
    bootstrapClasses: ["card", "card-body", "shadow-sm", "rounded-4", "focus-ring"],
    projectClasses: [],
    states: ["default", "hover", "focus"],
    screens: ["Dashboard", "Project Detail"]
  },
  {
    id: "inline-notice-toast",
    name: "Inline Notice Toast",
    family: "ProjectTrack",
    tokens: [
      "--pt-alert-radius",
      "--pt-alert-padding-x",
      "--pt-alert-padding-y",
      "--pt-color-status-success-bg",
      "--pt-color-status-danger-soft"
    ],
    bootstrapClasses: ["alert", "alert-dismissible", "btn-close", "shadow-sm"],
    projectClasses: [],
    states: ["default", "success", "danger", "closing"],
    screens: ["Workspace shell"]
  },
  {
    id: "release-update-panel",
    name: "Release Update Panel",
    family: "ProjectTrack",
    tokens: [
      "--pt-card-bg",
      "--pt-card-border-radius",
      "--pt-card-box-shadow",
      "--pt-color-status-info-bg"
    ],
    bootstrapClasses: ["card", "btn", "alert"],
    projectClasses: [],
    states: ["idle", "checking", "available", "current", "error"],
    screens: ["Profile"]
  },
  {
    id: "change-history-entry",
    name: "Change History Entry",
    family: "ProjectTrack",
    tokens: [
      "--pt-card-bg",
      "--pt-card-border-color",
      "--pt-card-border-radius",
      "--pt-color-text-secondary"
    ],
    bootstrapClasses: ["card", "list-group", "badge"],
    projectClasses: [],
    states: ["default", "linked", "empty"],
    screens: ["Change Detail", "Change History"]
  }
];

export const BOOTSTRAP_THEME_SCALES = {
  shadow: [
    { label: "No shadow", className: "shadow-none", value: "none" },
    { label: "Small shadow", className: "shadow-sm", value: "var(--bs-box-shadow-sm)" },
    { label: "Regular shadow", className: "shadow", value: "var(--bs-box-shadow)" },
    { label: "Large shadow", className: "shadow-lg", value: "var(--bs-box-shadow-lg)" }
  ],
  spacing: [
    { label: "0", className: "0", value: "0" },
    { label: "1 / 0.25rem", className: "1", value: "0.25rem" },
    { label: "2 / 0.5rem", className: "2", value: "0.5rem" },
    { label: "3 / 1rem", className: "3", value: "1rem" },
    { label: "4 / 1.5rem", className: "4", value: "1.5rem" },
    { label: "5 / 3rem", className: "5", value: "3rem" }
  ],
  radius: [
    { label: "None", className: "rounded-0", value: "0" },
    { label: "Small", className: "rounded-1", value: "0.25rem" },
    { label: "Base", className: "rounded-2", value: "0.375rem" },
    { label: "Large", className: "rounded-3", value: "0.5rem" },
    { label: "XL", className: "rounded-4", value: "1rem" },
    { label: "XXL", className: "rounded-5", value: "2rem" },
    { label: "Pill", className: "rounded-pill", value: "999px" },
    { label: "Circle", className: "rounded-circle", value: "50%" }
  ]
};
