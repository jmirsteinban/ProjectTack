import { renderDashboardScreen } from "./screens/dashboard.js";
import { renderProjectsScreen } from "./screens/projects.js";
import { renderChangesScreen } from "./screens/changes.js";
import { renderProfileScreen } from "./screens/profile.js";
import { renderLoginScreen } from "./screens/login.js";
import { renderChangeDetailScreen } from "./screens/change-detail.js";
import { renderProjectDetailScreen } from "./screens/project-detail.js";
import { renderProjectEditorScreen } from "./screens/project-editor.js";
import { renderChangeEditorScreen } from "./screens/change-editor.js";

export function renderProjectTrackView(state, data) {
  switch (state.currentView) {
    case "dashboard":
      return renderDashboardScreen(data);
    case "projects":
      return renderProjectsScreen(state, data);
    case "changes":
      return renderChangesScreen(state, data);
    case "change-detail":
      return renderChangeDetailScreen(state, data);
    case "change-editor":
      return renderChangeEditorScreen(state, data);
    case "project-detail":
      return renderProjectDetailScreen(state, data);
    case "project-editor":
      return renderProjectEditorScreen(state, data);
    case "login":
      return renderLoginScreen(state, data);
    case "profile":
      return renderProfileScreen(state, data);
    default:
      return `<section class="pt-screen-card"><p>Vista no disponible.</p></section>`;
  }
}
