export const PROJECT_CHANGELOG = [
  {
    date: "2026-04-20",
    entries: [
      {
        time: "22:45",
        type: "Maintenance",
        title: "Theme tokens narrowed to color surfaces",
        description: "Stopped exposing non-color ProjectTrack theme tokens where Bootstrap/default values should own the surface.",
        details: [
          "Removed non-color pt tokens for shape, spacing, sizing, shadow, and typography from the active theme surface.",
          "Kept the Theme Manager focused on color, status, surface, and gradient tokens that still represent real ProjectTrack identity.",
          "Updated the component registry so component token summaries only track the remaining intentionally custom color-oriented tokens."
        ]
      },
      {
        time: "17:28",
        type: "Fix",
        title: "Theme Manager duplicated token control sync",
        description: "Fixed inline component token controls so repeated variables stay synchronized while editing.",
        details: [
          "A token edited from one component card now updates the shared theme state directly from that control.",
          "Duplicated controls for the same variable are synchronized immediately instead of overwriting the new value with an older duplicate.",
          "Live preview, export output, and diff counters continue updating while editing."
        ]
      },
      {
        time: "16:57",
        type: "Feature",
        title: "Theme Manager component-aware diff",
        description: "Improved the Theme Manager diff so changes are grouped by impacted ProjectTrack component.",
        details: [
          "The diff now summarizes changed tokens, impacted components, and changed categories.",
          "Changed tokens are grouped by component using Chrome/src/theme/component-registry.js.",
          "A flat token review remains available and now lists impacted components per variable.",
          "Individual token revert actions continue to work from grouped and flat diff tables."
        ]
      },
      {
        time: "16:53",
        type: "Feature",
        title: "Theme Manager component token controls",
        description: "Connected registered ProjectTrack components with editable token summaries and inline controls.",
        details: [
          "Component cards now show editable, pending, and changed token counts.",
          "Known component tokens can be edited inline from the ProjectTrack Components section.",
          "Referenced tokens that are not yet defined in the Theme Manager remain visible as pending token definitions.",
          "Expanded the controlled token set for cards, overlays, alerts, status colors, progress gradients, and text on dark surfaces.",
          "The marked Theme Manager token block now includes the newly controlled component tokens."
        ]
      },
      {
        time: "16:51",
        type: "Feature",
        title: "Theme Manager component gallery",
        description: "Expanded the ProjectTrack Components section with a broader visual QA gallery.",
        details: [
          "Added previews for breadcrumbs, nav pills, form validation states, disabled and readonly fields.",
          "Added metric cards, notes/tasks, release update panel, and Change History entry previews.",
          "Added static modal and confirm dialog previews to cover overlay styling without opening runtime dialogs.",
          "Theme Manager documentation now lists the expanded gallery coverage."
        ]
      },
      {
        time: "12:15",
        type: "Feature",
        title: "Theme Manager Bootstrap color coverage",
        description: "Expanded Theme Manager coverage for Bootstrap theme colors and preview components.",
        details: [
          "Theme tokens now include Bootstrap info, warning, light, dark, body color, and body background.",
          "The generated theme export derives RGB tokens for the Bootstrap color palette.",
          "The Bootstrap section now previews primary, secondary, success, info, warning, danger, light, and dark color swatches.",
          "The live preview now includes additional Bootstrap components: list group, dropdown, progress, table, badges, and state alerts.",
          "Documentation clarifies that light and dark are currently colors in the active light theme, not separate Bootstrap color modes."
        ]
      },
      {
        time: "12:05",
        type: "UI",
        title: "Theme Manager menu placement",
        description: "Moved Theme Manager below the user menu separator so it is grouped with workspace tools instead of primary navigation.",
        details: [
          "Dashboard, Projects, Changes, and Profile remain above the separator.",
          "Theme Manager now appears with UI Guide and Change History below the separator.",
          "The active state is preserved when Theme Manager is open."
        ]
      },
      {
        time: "12:00",
        type: "Feature",
        title: "Theme Manager real implementation",
        description: "Started the production Theme Manager architecture with safe CSS reading, token editing, export, diff, backups, and guarded save flow.",
        details: [
          "The Theme Manager now reads Chrome/styles/projecttrack.css and uses the marked THEME MANAGER TOKENS block as the only automatic write area.",
          "Added a local Python server for read/save/backup/restore operations on 127.0.0.1:4177.",
          "Added a manual Python save script as fallback when the local server is unavailable.",
          "Added an initial component registry for ProjectTrack components such as global navbar, hero card, brand mark, environment progress, pills, metric cards, inline notices, release updates, and change history entries.",
          "The UI now includes sections for Overview, Theme Tokens, Bootstrap Base, ProjectTrack Components, Legacy / Audit, Accessibility, Import / Export, Backups / Versions, and Diff.",
          "The first implementation supports live preview, known-token import, reusable :root export, basic WCAG AA checks, pt-* audit, backup listing, and backup restore through the Python server.",
          "Theme Manager documentation was updated to reflect the implemented architecture and remaining product gaps."
        ]
      },
      {
        time: "10:23",
        type: "Feature",
        title: "Theme Manager",
        description: "Added a workspace page for real-time theme configuration and reusable CSS variable export.",
        details: [
          "The page is available from the global menu as Theme Manager.",
          "Controls cover brand colors, base typography, global radius, and suggested Google Font stacks.",
          "The preview applies the selected tokens live to buttons, cards, alerts, navigation, and a contact form.",
          "The export panel generates a ready-to-use :root block for a custom.css file."
        ]
      }
    ]
  },
  {
    date: "2026-04-17",
    entries: [
      {
        time: "16:05",
        type: "Release",
        title: "ProjectTrack Chrome 0.1.2 release prep",
        description: "Prepared the next Chrome release with consolidated documentation and the simplified Bootstrap stylesheet stack.",
        details: [
          "The central project document was renamed to docs/PROJECTTRACK.md.",
          "The highest-priority pending work now starts with the Bootstrap 100% review, reusable UI configuration screen, user documentation page, and the next feature cycle.",
          "Change History records the documentation consolidation, single ProjectTrack stylesheet, Bootstrap migration QA approval, and release preparation."
        ]
      },
      {
        time: "15:50",
        type: "Documentation",
        title: "Central documentation consolidated",
        description: "Merged the operational tracking notes into the central ProjectTrack documentation and removed the separate operational file.",
        details: [
          "docs/PROJECTTRACK.md is now the single canonical project status and pending-work document.",
          "README.md was simplified into a short repository entry point.",
          "The active documentation now points to the central document for status and pending work."
        ]
      },
      {
        time: "15:35",
        type: "Maintenance",
        title: "Single ProjectTrack stylesheet",
        description: "Consolidated Chrome custom styling into projecttrack.css so the runtime loads Bootstrap plus one ProjectTrack stylesheet.",
        details: [
          "workspace.html and the UI Guide now load local Bootstrap followed by projecttrack.css.",
          "ProjectTrack tokens, full-tab skin, workspace layout, domain components, popup/side-panel styles, and docs helpers live in projecttrack.css.",
          "Removed projecttrack-theme.css, projecttrack-fulltab.css, and projecttrack-workspace.css from the active stack."
        ]
      },
      {
        time: "15:15",
        type: "QA",
        title: "Functional QA approved",
        description: "Confirmed the main Chrome workspace functional QA checklist passed.",
        details: [
          "Projects search, filters, project navigation, and recent change navigation passed.",
          "Project Details, Change Details, editors, Login, Profile, navbar, Change History, and UI Guide passed.",
          "Long text, long URLs, stale project/change selections, breadcrumbs, release channel, notes, tasks, and related navigation passed."
        ]
      },
      {
        time: "15:05",
        type: "QA",
        title: "Full-tab visual QA approved",
        description: "Confirmed Chrome full-tab visual QA for 360px, 550px, 960px, and desktop wide.",
        details: [
          "No horizontal overflow was reported.",
          "Navbar, dropdown, selectable breadcrumbs, cards, lists, tables, forms, and buttons passed the visual review."
        ]
      },
      {
        time: "14:40",
        type: "Migration",
        title: "Bootstrap migration resumed",
        description: "Completed the next Bootstrap migration pass for Project Detail, Change Detail, Project Editor, and Change Editor.",
        details: [
          "Project Detail no longer depends on legacy change link, summary, environment, or separator classes.",
          "Change Detail now uses the shared Hero Card, Bootstrap cards, list groups, badges, and alerts for its main layout.",
          "Change Detail no longer falls back silently to the first change when the selected change id is stale.",
          "Project Editor and Change Editor now use the shared Hero Card and Bootstrap heading/button patterns.",
          "Change Editor replaced pt-editor-choice controls with Bootstrap outline buttons while preserving the existing choice data attributes.",
          "The workspace CSS no longer carries runtime compatibility rules for the removed hero, screen card, project title/search, list caption, change summary, or change link classes.",
          "The active runtime no longer references the critical legacy classes tracked for this migration pass."
        ]
      },
      {
        time: "14:05",
        type: "UI",
        title: "Reusable hero card",
        description: "Added a reusable Hero Card template and renderer for migrated Chrome workspace screens.",
        details: [
          "The editable template lives in Chrome/components/hero-card.html.",
          "The runtime renderer lives in Chrome/src/components/hero-card.js.",
          "Dashboard, Projects, Changes, Project Detail, Profile, and Change History now use the shared hero renderer.",
          "Legacy screens can migrate to the same component in the next Bootstrap pass."
        ]
      },
      {
        time: "13:55",
        type: "Navigation",
        title: "Selectable dynamic breadcrumbs",
        description: "Replaced the fixed Bootstrap dashboard subtitle in the global navbar with the current workspace route.",
        details: [
          "Breadcrumbs now update from the active view, selected project, selected change, and editor mode.",
          "The breadcrumb text is rendered as selectable text so it can be copied without triggering navigation.",
          "The ProjectTrack mark and title still navigate back to Workspace / Dashboard."
        ]
      },
      {
        time: "13:50",
        type: "Planning",
        title: "Bootstrap migration paused",
        description: "Paused the Bootstrap migration at the current cut to preserve quota and make the next restart point explicit.",
        details: [
          "The next migration pass should resume in Project Detail link and environment blocks.",
          "Change Detail, Project Editor, and Change Editor remain the largest pending migration surfaces."
        ]
      },
      {
        time: "13:35",
        type: "Documentation",
        title: "Central log moved to Change History",
        description: "Moved the recent project log out of the central documentation and into the workspace Change History page.",
        details: [
          "The central documentation now keeps a short pointer to Change History instead of duplicating the running log.",
          "Historical entries from March and April were converted into English changelog entries grouped by date.",
          "Change History now supports optional detail lists inside each entry."
        ]
      },
      {
        time: "13:10",
        type: "Migration",
        title: "Login, Profile, and Projects Bootstrap cleanup",
        description: "Continued the Chrome Bootstrap migration by removing legacy structure classes from high-traffic screens.",
        details: [
          "Login no longer depends on pt-login-* or pt-profile-form structure classes.",
          "Profile now uses pt-web-hero with Bootstrap row, columns, badges, and buttons.",
          "Profile escapes form values, status messages, and summary card values before rendering HTML.",
          "Projects now uses Bootstrap row-cols, card, card-header, card-body, list-group, badge, input-group, and buttons.",
          "Dashboard removed the legacy pt-hero-button class from its primary action.",
          "The migration tracking document was updated with the completed validation checks."
        ]
      },
      {
        time: "12:45",
        type: "Fix",
        title: "Change History menu placement",
        description: "Moved Change History below UI Guide in the global menu and translated the new page copy to English."
      },
      {
        time: "12:35",
        type: "Feature",
        title: "Change History",
        description: "Added a workspace page available from the global menu to track fixes and project changes."
      },
      {
        time: "12:20",
        type: "Maintenance",
        title: "Centralized SQL",
        description: "Moved Supabase migrations from Android/sql to the global sql folder so Chrome, Android, and documentation share the same source."
      },
      {
        time: "12:05",
        type: "Migration",
        title: "Navbar Bootstrap",
        description: "Removed the legacy navMenuOpen state and old navbar/avatar CSS; Bootstrap now owns the dropdown behavior."
      },
      {
        time: "11:50",
        type: "Documentation",
        title: "Single UI Guide",
        description: "Consolidated ProjectTrack UI in Chrome/docs/projecttrack-ui.html to avoid drift between documentation and the extension."
      },
      {
        time: "11:35",
        type: "Planning",
        title: "Plan Bootstrap 100%",
        description: "Created the tracking document for completing the migration to real Bootstrap in focused cycles."
      },
      {
        time: "09:00",
        type: "Migration",
        title: "Chrome full-tab Bootstrap runtime",
        description: "Applied the first full-tab Bootstrap cut with workspace.html as the main Chrome runtime entry.",
        details: [
          "popup.js now opens workspace.html, while dashboard.html remains as a separate visual reference during transition.",
          "workspace.html loads local Bootstrap, projecttrack-theme.css, projecttrack-fulltab.css, and projecttrack-workspace.css.",
          "projecttrack.css remains temporarily loaded as a legacy layer for pt-* styles still used by larger screens.",
          "main.js no longer mounts the scaled side-panel viewport and instead mounts the app in a full-tab shell.",
          "projecttrack-app.js uses a Bootstrap-based full-tab navbar and Bootstrap loading states with spinner-border, card, and container-fluid.",
          "Dashboard, Projects, Project Details, and Login received the first full-tab Bootstrap migration.",
          "Static QA fixes included stable search focus/caret, bubbling guards between recent changes and project cards, HTML/attribute escaping, stale selectedProjectId handling, and clearer login message tones.",
          "Visual QA remains pending for 360px, 550px, 960px, and wide desktop."
        ]
      }
    ]
  },
  {
    date: "2026-04-16",
    entries: [
      {
        time: "18:30",
        type: "Release",
        title: "Private Chrome release channel",
        description: "Defined the private delivery channel for the Chrome extension without OneDrive as the primary package source.",
        details: [
          "Local packaging and CI were added through scripts/package-chrome-release.ps1 and .github/workflows/chrome-release.yml.",
          "The private v0.1.0 release was created with ProjectTrack-Chrome.zip, a versioned zip, and JSON metadata.",
          "GitHub tokens are not stored inside the extension because the repository remains private.",
          "sql/app_releases_chrome_20260416.sql creates public.app_releases, enables RLS, and publishes initial projecttrack-chrome metadata for version 0.1.0.",
          "release-updates.js reads the latest version from Supabase using the authenticated user session.",
          "Profile / Extension Updates shows the guided update and download panel.",
          "projecttrack-app.js refreshes update state after successful login.",
          "The operational guide lives in docs/chrome/deployment-github-releases.md.",
          "Supabase app_releases was confirmed and Profile / Extension Updates validated local version 0.1.0 as current.",
          "The side panel was temporarily hidden by removing sidePanel / side_panel from the manifest and removing the SidePanel action from the popup.",
          "The AI agents playbook and feedback log were added for future QA and development cycles."
        ]
      }
    ]
  },
  {
    date: "2026-04-01",
    entries: [
      {
        type: "Migration",
        title: "Bootstrap-first pass in the classic workspace runtime",
        description: "Continued moving the active Chrome workspace toward Bootstrap structure while preserving needed domain-specific pt-* styles.",
        details: [
          "Profile migrated its main shells from pt-screen-card, pt-row, and pt-col-* to card bg-body-tertiary, card-body, row, and col-*.",
          "Project Editor now uses card bg-body-tertiary, card-body, row, and col-* for the base form and the three environment panels.",
          "Change Editor now uses card bg-body-tertiary, card-body, row, and col-* for general information, status and priority, environments, and access links.",
          "Projects, Changes, and Project Detail removed their main pt-screen-card / pt-row-top shells in favor of card bg-body-tertiary, card-header, card-body, row, col-*, and d-flex.",
          "Login moved its main wrapper to card bg-body-tertiary and card-body while retaining the access block shell.",
          "pt-* remained only where it still provided domain behavior or visual value, such as choice grids, suggestions, chips, and URL rows."
        ]
      }
    ]
  },
  {
    date: "2026-03-31",
    entries: [
      {
        type: "Documentation",
        title: "Chrome UI conventions and Change Detail task workflow",
        description: "Updated central and operational documentation to reflect the current Chrome visual conventions and the expanded Change Detail workflow.",
        details: [
          "bg-body-tertiary was aligned with the real card background through --pt-card-bg.",
          "The recommended card, panel, and documentation demo shell became card bg-body-tertiary.",
          "The live UI guide card examples were corrected so snippets are valid and copyable.",
          "Home / Projects / Details / Changes / Details received wired hero buttons, row + col-* layout, long URL wrappers, and a simpler QA card.",
          "Status and priority pills can be edited inline from dropdowns in the Change Detail header.",
          "Inline status and priority edits create persistent History entries.",
          "Change history is stored in project_notes with is_todo = false.",
          "Tasks were added below Environments with Excel tracker import into change_tasks.",
          "Tasks now separate Import Tasks from Excel and Replace Tasks; replacement logically deletes tasks missing from the new workbook.",
          "Tasks support inline assignee and status updates.",
          "Notes can link one or more tasks through project_note_task_links.",
          "change_task_events was added as the base log for future task history and burndown charts.",
          "Tasks can be exported by manual From TSKID / To TSKID range.",
          "Runtime lists moved further toward list-group for Changes, Notes, History, Other Project Changes, and editor URL groups.",
          "Buttons were documented in two families: Hero buttons with pt-hero-button and Runtime buttons with a Bootstrap-first palette.",
          "The UI guide documented contextual buttons using bg-*-subtle, text-*-emphasis, and border-*-subtle.",
          "sidepanel.html became a vertical launcher instead of mounting the full app.",
          "popup.html exposes explicit ProjectTrack and SidePanel options.",
          "dashboard.html was added as the first full-tab Bootstrap-first surface using local Bootstrap.",
          "workspace.html was added as a transition shell for opening the complete app outside the side panel.",
          "projecttrack-theme.css and projecttrack-fulltab.css were versioned to separate shared branding from the web full-tab layer.",
          "The Supabase migration for task import lives in sql/change_tasks_excel_import_20260331.sql."
        ]
      }
    ]
  },
  {
    date: "2026-03-25",
    entries: [
      {
        type: "Documentation",
        title: "Operational tracking and UI guide expansion",
        description: "Expanded operational tracking and the live Chrome UI documentation.",
        details: [
          "The central documentation became the main operational list for findings and pending work.",
          "The central documentation was defined as the short AI reference to review before analyzing, proposing changes, or documenting the runtime.",
          "Useful pending information was migrated from the old Chrome tracking document.",
          "docs/chrome/Seguimiento_Chrome_ProjectTrack.md was removed to avoid duplicate tracking.",
          "The live Chrome documentation was updated to reflect the recent UI system evolution.",
          "Hero card was formally documented as the real pattern used by dashboard and main screens.",
          "The text-step scale was redefined from step--3 through step-5.",
          "text-step-4, text-step-5, pt-text-step-4, and pt-text-step-5 were added.",
          "Negative margin utilities m-n1 through m-n5 and directional variants were added.",
          "Automatic margin utilities m-auto, me-auto, ms-auto, mx-auto, and my-auto were added.",
          "pt-pill gained small and medium size variants.",
          "Pill and spacing examples were updated in the UI guide."
        ]
      },
      {
        type: "UI",
        title: "Change Detail visual refinement",
        description: "Refined Home / Projects / Details / Changes / Details and propagated the newer hero pattern.",
        details: [
          "The top hero was reordered around project, change title, and Environment Path.",
          "Change Details header pills were aligned to the end using auto utilities.",
          "The body was split into clearer Project, Change, Details, Workfront, OneDrive, and visible environment blocks.",
          "The Notes section received a clearer top toolbar.",
          "The pt-screen-hero pattern was extended to main screens that still used the previous hero shell classes.",
          "The active Chrome hero pattern was documented and implemented with row + col-* composition."
        ]
      }
    ]
  },
  {
    date: "2026-03-23",
    entries: [
      {
        type: "Documentation",
        title: "Bootstrap-ProjectTrack naming and layout contract",
        description: "Renamed the Chrome design system language and documented the public layout direction.",
        details: [
          "Bootstrap-like was renamed to Bootstrap-ProjectTrack in documentation and UI system comments.",
          "Bootstrap-ProjectTrack was defined as the Chrome design system base and Grid as the layout layer.",
          "Chrome layout guidance was clarified: row + col-* is the default public API, while pt-row + pt-col-* remains only for existing or internal CSS Grid compositions.",
          "Home / Dashboard Work Queue and Latest Notes Mentioning You were refined with better chip hierarchy, metadata, counts, and spacing.",
          "A manual Dashboard round aligned both panels with row/col layout, clearer project/title/meta order, compact pills, and content-aware cards."
        ]
      },
      {
        type: "Localization",
        title: "Chrome runtime English migration",
        description: "Started and expanded the global English migration for the active Chrome runtime.",
        details: [
          "The first slice translated the global shell, notices, dialogs, Dashboard, Projects, and base demo mock copy.",
          "The second slice translated Project Detail, Changes, Change Detail, Login, Profile, Project Editor, Change Editor, Environment Progress, backend messages, and workspace-store messages.",
          "Startup messages in main.js and native-host errors/responses were translated.",
          "Functional breadcrumbs were updated in the central documentation.",
          "Manual language QA passed for Home / Dashboard, Home / Projects, Home / Projects / Details, Change Screens, Home / Profile, and Home / Login.",
          "The next focus moved to visual QA, layout and color refinements, and remaining functional documentation in English."
        ]
      }
    ]
  },
  {
    date: "2026-03-22",
    entries: [
      {
        type: "UI",
        title: "Bootstrap-ProjectTrack UI layer consolidation",
        description: "Consolidated the Chrome UI layer and confirmed the active runtime structure.",
        details: [
          "Chrome/styles/projecttrack.css became the consolidated Bootstrap-ProjectTrack UI layer.",
          "The live reference was set to Chrome/docs/projecttrack-ui.html.",
          "The compatibility layer covers btn, form-*, alert, modal, breadcrumb, nav, navbar, card, list-group, badge, progress, and table.",
          "pt-* aliases remain for product identity and domain components, not as a replacement for the base layer.",
          "The real Chrome runtime was confirmed in sidepanel.html, main.js, projecttrack-app.js, and projecttrack-router.js.",
          "Runtime naming was normalized by removing live and v2 suffixes from active files and exports.",
          "The global navbar uses semantic breadcrumbs and lets the ProjectTrack brand return to Home / Dashboard.",
          "Dashboard metric cards were documented and refined with card, card-body, and badge.",
          "The main real screens were migrated into the new UI layer, including Login, Profile, Projects, Project Detail, Project Editor, Changes, Change Detail, and Change Editor.",
          "Actions, forms, notices, and modals in those views use the newer btn, form-control, alert, and modal semantics.",
          "The extension was left ready for a final side-panel visual pass and later legacy cleanup."
        ]
      }
    ]
  },
  {
    date: "2026-03-16",
    entries: [
      {
        type: "Stability",
        title: "Chrome login freeze mitigation",
        description: "Analyzed and mitigated browser freeze risk during Chrome login, especially on macOS.",
        details: [
          "Login was confirmed to authenticate, reload the full remote workspace, and render views across projects, changes, and notes.",
          "The login button is disabled while authentication is in progress.",
          "Visible progress is shown during authentication and initial sync.",
          "Console timing traces were added for login, initial workspace bootstrap, and post-login reload.",
          "Created projects and changes select the id returned by the backend.",
          "Hard pagination and remote read trimming were deferred to avoid breaking dashboard counts, selection fallback, and assignee resolution."
        ]
      },
      {
        type: "UI",
        title: "Responsive layout and ProjectTrack UI foundation",
        description: "Fixed intermediate-width layout issues and started the internal ProjectTrack UI layout layer.",
        details: [
          "Environment stacks were adjusted so project/detail/editor screens distribute cards from 550px using repeat(auto-fit, minmax(220px, 1fr)).",
          "An internal layout utility layer was started in projecttrack.css with stacks, 12-column rows, responsive spans for 550px and 960px, and auto-fit grids.",
          "Project Detail, Project Editor, and Change Detail were the first screens migrated to the new system.",
          "The second phase extended the system to Dashboard, Projects, and Profile.",
          "The Chrome visual system was named ProjectTrack UI and its layout layer was named Grid.",
          "The viewport contract was documented: 360px minimum, 550px optimal design width, proportional host zoom below 550px, and horizontal responsive composition above 550px.",
          "The live HTML documentation was added at Chrome/docs/projecttrack-ui.html.",
          "The Chrome extension was refactored into a single app mounted directly by sidepanel.html, removing the legacy multiapp shell/router layer.",
          "The extension identity changed from Workspace to ProjectTrack."
        ]
      }
    ]
  },
  {
    date: "2026-03-13",
    entries: [
      {
        type: "Backend",
        title: "Initial real Chrome backend integration",
        description: "Centralized documentation and connected Chrome to real Supabase authentication and workspace data.",
        details: [
          "The project documentation was centralized into a single file.",
          "Chrome gained initial real email/password authentication from Profile.",
          "Chrome stopped using silent local fallback for workspace data.",
          "Valid credentials are stored in Profile for automatic re-login.",
          "Chrome distinguishes first login pending, recoverable expired session, and manual logout.",
          "Remote reads cover projects, changes, users, change assignees, notes, and note assignees.",
          "Initial remote writes cover projects, changes, and notes.",
          "Initial remote logical delete covers projects, changes, and notes.",
          "Visible diagnostics were added when an operation is remote or requires reauthentication.",
          "A future improvement for per-device OneDrive local paths through Native Messaging was analyzed and left pending."
        ]
      }
    ]
  },
  {
    date: "2026-03-12",
    entries: [
      {
        type: "Foundation",
        title: "Chrome extension functional base",
        description: "Built the first functional Chrome extension base in Chrome/src and Chrome/styles.",
        details: [
          "The main Android screens were visually cloned for Chrome: Dashboard, Projects, Changes, Profile, Details, and editors.",
          "Local persistence was enabled with chrome.storage.",
          "The first backend configuration layer was prepared in Profile."
        ]
      }
    ]
  }
];
