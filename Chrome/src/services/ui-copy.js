export const PROJECT_ACTIVITY_FILTERS = ["All", "Active", "Inactive"];
export const CHANGE_STATUS_OPTIONS = ["Pendiente", "En desarrollo", "En revision de QA", "Completado"];
export const CHANGE_PRIORITY_OPTIONS = ["Baja", "Media", "Alta"];
export const TASK_STATUS_OPTIONS = ["Pendiente", "En desarrollo", "Completado", "Error"];

const STATUS_CLASS_BY_VALUE = {
  Pendiente: "status-pending",
  "En desarrollo": "status-progress",
  "En revision de QA": "status-qa",
  Completado: "status-done"
};

const STATUS_LABEL_BY_VALUE = {
  Pendiente: "Pending",
  "En desarrollo": "In Progress",
  "En revision de QA": "In QA Review",
  Completado: "Completed"
};

const PRIORITY_CLASS_BY_VALUE = {
  Alta: "priority-high",
  Media: "priority-medium",
  Baja: "priority-low"
};

const PRIORITY_LABEL_BY_VALUE = {
  Alta: "High",
  Media: "Medium",
  Baja: "Low"
};

const TASK_STATUS_CLASS_BY_VALUE = {
  Pendiente: "status-pending",
  "En desarrollo": "status-progress",
  Completado: "status-done",
  Error: "status-error"
};

const TASK_STATUS_LABEL_BY_VALUE = {
  Pendiente: "Pending",
  "En desarrollo": "In Progress",
  Completado: "Completed",
  Error: "Error"
};

export function isCompletedStatus(status) {
  return status === "Completado";
}

export function statusClass(status) {
  return STATUS_CLASS_BY_VALUE[status] ?? "neutral";
}

export function priorityClass(priority) {
  return PRIORITY_CLASS_BY_VALUE[priority] ?? "neutral";
}

export function translateStatus(status) {
  return STATUS_LABEL_BY_VALUE[status] ?? status ?? "";
}

export function translatePriority(priority) {
  return PRIORITY_LABEL_BY_VALUE[priority] ?? priority ?? "";
}

export function taskStatusClass(status) {
  return TASK_STATUS_CLASS_BY_VALUE[status] ?? "neutral";
}

export function translateTaskStatus(status) {
  return TASK_STATUS_LABEL_BY_VALUE[status] ?? status ?? "";
}
