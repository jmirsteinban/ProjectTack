export const PROJECT_ACTIVITY_FILTERS = ["All", "Active", "Inactive"];
export const CHANGE_STATUS_OPTIONS = ["Pendiente", "En desarrollo", "En revision de QA", "Completado"];
export const CHANGE_PRIORITY_OPTIONS = ["Baja", "Media", "Alta"];
export const TASK_STATUS_OPTIONS = ["Pendiente", "En desarrollo", "Completado", "Error"];

const STATUS_CLASS_BY_VALUE = {
  Pendiente: "text-bg-info",
  "En desarrollo": "text-bg-primary",
  "En revision de QA": "text-bg-warning text-dark",
  Completado: "text-bg-success"
};

const STATUS_LABEL_BY_VALUE = {
  Pendiente: "Pending",
  "En desarrollo": "In Progress",
  "En revision de QA": "In QA Review",
  Completado: "Completed"
};

const PRIORITY_CLASS_BY_VALUE = {
  Alta: "text-bg-danger",
  Media: "text-bg-warning text-dark",
  Baja: "text-bg-success"
};

const PRIORITY_LABEL_BY_VALUE = {
  Alta: "High",
  Media: "Medium",
  Baja: "Low"
};

const TASK_STATUS_CLASS_BY_VALUE = {
  Pendiente: "text-bg-info",
  "En desarrollo": "text-bg-primary",
  Completado: "text-bg-success",
  Error: "text-bg-danger"
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
  return STATUS_CLASS_BY_VALUE[status] ?? "text-bg-secondary";
}

export function priorityClass(priority) {
  return PRIORITY_CLASS_BY_VALUE[priority] ?? "text-bg-secondary";
}

export function translateStatus(status) {
  return STATUS_LABEL_BY_VALUE[status] ?? status ?? "";
}

export function translatePriority(priority) {
  return PRIORITY_LABEL_BY_VALUE[priority] ?? priority ?? "";
}

export function taskStatusClass(status) {
  return TASK_STATUS_CLASS_BY_VALUE[status] ?? "text-bg-secondary";
}

export function translateTaskStatus(status) {
  return TASK_STATUS_LABEL_BY_VALUE[status] ?? status ?? "";
}
