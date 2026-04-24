export const projectTrackMockData = {
  taskFeatureStatus: {
    available: true,
    missingRelations: [],
    migrationFile: "sql/change_tasks_excel_import_20260331.sql"
  },
  user: {
    name: "Demo User",
    role: "Workspace User",
    email: "demo.user@example.com",
    id: "user_12345678"
  },
  userDirectory: [
    {
      id: "user_12345678",
      name: "Demo User",
      email: "demo.user@example.com",
      role: "Workspace User",
      isAdmin: false,
      isGodMode: false,
      hideFromWorkspace: false
    },
    {
      id: "user_qa_team",
      name: "QA Team",
      email: "qa.team@example.com",
      role: "Workspace User",
      isAdmin: false,
      isGodMode: false,
      hideFromWorkspace: false
    },
    {
      id: "user_support",
      name: "Support",
      email: "support@example.com",
      role: "Workspace User",
      isAdmin: false,
      isGodMode: false,
      hideFromWorkspace: false
    }
  ],
  users: [
    {
      id: "user_12345678",
      name: "Demo User",
      email: "demo.user@example.com",
      role: "Workspace User",
      isAdmin: false,
      isGodMode: false,
      hideFromWorkspace: false
    },
    {
      id: "user_qa_team",
      name: "QA Team",
      email: "qa.team@example.com",
      role: "Workspace User",
      isAdmin: false,
      isGodMode: false,
      hideFromWorkspace: false
    },
    {
      id: "user_support",
      name: "Support",
      email: "support@example.com",
      role: "Workspace User",
      isAdmin: false,
      isGodMode: false,
      hideFromWorkspace: false
    }
  ],
  dashboardHero: {
    openTodoCount: 3
  },
  qaSummary: {
    tests: 44,
    ok: 38,
    errors: 4,
    pending: 1
  },
  projects: [
    {
      id: "PRJ-001",
      name: "ProjectTrack Core",
      description: "Main product foundation and its tracking flows.",
      createdAt: "2026-03-08",
      startDate: "2026-03-08",
      status: "Activo",
      changes: 7,
      onedriveLink: "https://onedrive.example.com/projecttrack-core",
      workfrontLink: "https://workfront.example.com/projecttrack-core",
      qaUrls: {
        Home: "https://qa.projecttrack.example.com",
        Login: "https://qa.projecttrack.example.com/login"
      },
      stgUrls: {
        Home: "https://stg.projecttrack.example.com"
      },
      prodUrls: {
        Home: "https://projecttrack.example.com"
      }
    },
    {
      id: "PRJ-002",
      name: "Chrome Workspace",
      description: "Browser version with a side launcher and embedded subapp.",
      createdAt: "2026-03-12",
      startDate: "2026-03-12",
      status: "En desarrollo",
      changes: 3,
      onedriveLink: "https://onedrive.example.com/chrome-workspace",
      workfrontLink: "https://workfront.example.com/chrome-workspace",
      qaUrls: {
        SidePanel: "https://qa.chrome-workspace.example.com/sidepanel"
      },
      stgUrls: {
        SidePanel: "https://stg.chrome-workspace.example.com/sidepanel",
        Dashboard: "https://stg.chrome-workspace.example.com/dashboard"
      },
      prodUrls: {}
    }
  ],
  changes: [
    {
      id: "CHG-101",
      title: "Replicate the Android dashboard in Chrome",
      description: "Clone the hero, metrics and panels from the original dashboard to keep the same visual hierarchy.",
      project: "Chrome Workspace",
      status: "Pendiente",
      environment: "QA",
      priority: "Alta",
      assignees: ["Demo User", "QA Team"],
      workfrontLink: "https://workfront.example.com/chg-101",
      onedriveLink: "https://onedrive.example.com/chg-101",
      visibleEnvironments: ["QA"]
    },
    {
      id: "CHG-102",
      title: "Define the shell persistent layout",
      description: "Ensure ProjectTrack loads inside the panel without depending on the global launcher.",
      project: "Chrome Workspace",
      status: "En desarrollo",
      environment: "STG",
      priority: "Media",
      assignees: ["Demo User"],
      workfrontLink: "https://workfront.example.com/chg-102",
      onedriveLink: "https://onedrive.example.com/chg-102",
      visibleEnvironments: ["QA", "STG"]
    },
    {
      id: "CHG-103",
      title: "Review ProjectTrack Core consistency",
      description: "Verify that colors, badges and counters still follow the Android project convention.",
      project: "ProjectTrack Core",
      status: "En revision de QA",
      environment: "QA",
      priority: "Alta",
      assignees: ["QA Team"],
      workfrontLink: "https://workfront.example.com/chg-103",
      onedriveLink: "https://onedrive.example.com/chg-103",
      visibleEnvironments: ["QA", "STG", "PROD"]
    },
    {
      id: "CHG-104",
      title: "Validate note and mention status",
      description: "Confirm that the board shows recent notes and full status tracking in the Chrome view.",
      project: "ProjectTrack Core",
      status: "Completado",
      environment: "PROD",
      priority: "Baja",
      assignees: ["Demo User", "Support"],
      workfrontLink: "https://workfront.example.com/chg-104",
      onedriveLink: "https://onedrive.example.com/chg-104",
      visibleEnvironments: ["QA", "STG", "PROD"]
    }
  ],
  dashboardPanels: [
    {
      title: "Work Queue",
      subtitle: "Prioritize your open changes",
      countLabel: "4 changes"
    },
    {
      title: "Latest Notes Mentioning You",
      subtitle: "Follow recent mentions quickly",
      countLabel: "3 notes"
    }
  ],
  mentionedNotes: [
    {
      id: "NT-201",
      text: "@DemoUser review the evidence before the STG pass",
      project: "Chrome Workspace",
      changeId: "CHG-101",
      change: "Replicate the Android dashboard in Chrome",
      status: "Pendiente",
      linkedTaskIds: ["TASK-301"],
      linkedTasks: [
        {
          id: "TASK-301",
          label: "P12 / #1 / Login",
          status: "Pendiente"
        }
      ]
    },
    {
      id: "NT-202",
      text: "@DemoUser confirm the visual adjustment functional validation",
      project: "ProjectTrack Core",
      changeId: "CHG-103",
      change: "Review ProjectTrack Core consistency",
      status: "Completado"
    },
    {
      id: "NT-203",
      text: "@DemoUser document the final panel behavior",
      project: "Chrome Workspace",
      changeId: "CHG-102",
      change: "Define the shell persistent layout",
      status: "Pendiente"
    }
  ],
  changeTasks: [
    {
      id: "TASK-301",
      projectId: "PRJ-002",
      project: "Chrome Workspace",
      changeId: "CHG-101",
      change: "Replicate the Android dashboard in Chrome",
      sourceFile: "IB01 - Tracker.xlsx",
      sourceExternalId: "101",
      taskKey: "source:101",
      page: "12",
      itemNumber: "1",
      documentName: "Login",
      requestText: "[Sticky Note] Update the hero spacing and align the KPI labels with the side panel shell.",
      annotationType: "Sticky Note",
      status: "Pendiente",
      assignedToId: "user_12345678",
      assignedToName: "Demo User",
      importedBy: "user_12345678",
      importedByName: "Demo User",
      importedAt: "2026-03-30T14:10:00.000Z",
      completedAt: null,
      label: "P12 / #1 / Login",
      linkedNoteIds: ["NT-201"],
      linkedNoteCount: 1,
      linkedNotes: [
        {
          id: "NT-201",
          text: "@DemoUser review the evidence before the STG pass",
          status: "Pendiente"
        }
      ]
    },
    {
      id: "TASK-302",
      projectId: "PRJ-002",
      project: "Chrome Workspace",
      changeId: "CHG-101",
      change: "Replicate the Android dashboard in Chrome",
      sourceFile: "IB01 - Tracker.xlsx",
      sourceExternalId: "102",
      taskKey: "source:102",
      page: "14",
      itemNumber: "2",
      documentName: "Dashboard",
      requestText: "[Cross-Out] Remove the redundant divider below the greeting section and tighten the card spacing.",
      annotationType: "Cross-Out",
      status: "En desarrollo",
      assignedToId: "user_qa_team",
      assignedToName: "QA Team",
      importedBy: "user_12345678",
      importedByName: "Demo User",
      importedAt: "2026-03-30T14:10:00.000Z",
      completedAt: null,
      label: "P14 / #2 / Dashboard",
      linkedNoteIds: [],
      linkedNoteCount: 0,
      linkedNotes: []
    },
    {
      id: "TASK-303",
      projectId: "PRJ-002",
      project: "Chrome Workspace",
      changeId: "CHG-101",
      change: "Replicate the Android dashboard in Chrome",
      sourceFile: "IB01 - Tracker.xlsx",
      sourceExternalId: "103",
      taskKey: "source:103",
      page: "16",
      itemNumber: "3",
      documentName: "Panels",
      requestText: "[Comment on Text] Confirm the final copy for the activity counters after QA review.",
      annotationType: "Comment on Text",
      status: "Completado",
      assignedToId: "user_support",
      assignedToName: "Support",
      importedBy: "user_12345678",
      importedByName: "Demo User",
      importedAt: "2026-03-30T14:10:00.000Z",
      completedAt: "2026-03-31T09:42:00.000Z",
      label: "P16 / #3 / Panels",
      linkedNoteIds: [],
      linkedNoteCount: 0,
      linkedNotes: []
    }
  ],
  changeTaskEvents: [
    {
      id: "TKE-401",
      taskId: "TASK-301",
      taskLabel: "P12 / #1 / Login",
      projectId: "PRJ-002",
      project: "Chrome Workspace",
      changeId: "CHG-101",
      change: "Replicate the Android dashboard in Chrome",
      eventType: "imported",
      eventText: "Task imported from Excel.",
      previousValue: null,
      nextValue: "Pendiente",
      createdBy: "user_12345678",
      createdByName: "Demo User",
      createdAt: "2026-03-30T14:10:00.000Z"
    }
  ],
  dashboardMetrics: [
    {
      title: "Assigned",
      value: "4",
      subtitle: "User total",
      tone: "assigned"
    },
    {
      title: "Pending",
      value: "1",
      subtitle: "Not started",
      tone: "pending"
    },
    {
      title: "In Progress",
      value: "1",
      subtitle: "Active work",
      tone: "in-progress"
    },
    {
      title: "In QA Review",
      value: "1",
      subtitle: "Validation in progress",
      tone: "qa-review"
    },
    {
      title: "QA Approved",
      value: "1",
      subtitle: "Completed changes",
      tone: "completed"
    },
    {
      title: "High Priority",
      value: "2",
      subtitle: "Require focus",
      tone: "high-priority"
    }
  ]
};
