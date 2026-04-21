const ENVIRONMENT_ORDER = ["QA", "STG", "PROD"];

function resolveEnvironmentState(
  environment,
  currentEnvironment,
  visibleEnvironments,
) {
  const currentIndex = Math.max(
    ENVIRONMENT_ORDER.indexOf(currentEnvironment),
    0,
  );
  const environmentIndex = ENVIRONMENT_ORDER.indexOf(environment);
  const visibleSet = new Set(visibleEnvironments ?? []);

  if (environmentIndex < currentIndex) {
    return "complete";
  }

  if (environmentIndex === currentIndex) {
    return "current";
  }

  if (!visibleSet.has(environment)) {
    return "hidden";
  }

  return "upcoming";
}

export function renderEnvironmentProgress(
  currentEnvironment = "QA",
  visibleEnvironments = ["QA", "STG", "PROD"],
) {
  const safeCurrentEnvironment = ENVIRONMENT_ORDER.includes(currentEnvironment)
    ? currentEnvironment
    : "QA";

  const steps = ENVIRONMENT_ORDER.map((environment) => {
    const stepState = resolveEnvironmentState(
      environment,
      safeCurrentEnvironment,
      visibleEnvironments,
    );
    const isCurrent = stepState === "current";
    const stateLabel = isCurrent
      ? "Current"
      : stepState === "complete"
        ? "Completed"
        : "Pending";

    const cardClasses = stepState === "current"
      ? "border-primary bg-primary-subtle"
      : stepState === "complete"
        ? "border-success bg-success-subtle"
        : stepState === "hidden"
          ? "border-secondary-subtle bg-body-tertiary"
          : "border-light-subtle bg-light";
    const badgeClasses = stepState === "current"
      ? "text-bg-primary"
      : stepState === "complete"
        ? "text-bg-success"
        : stepState === "hidden"
          ? "text-bg-secondary"
          : "text-bg-light border text-dark";

    return `
      <div class="col" aria-current="${isCurrent ? "step" : "false"}">
        <div class="card h-100 border ${cardClasses}">
          <div class="card-body d-flex justify-content-between align-items-center gap-2 py-2 px-3">
            <strong class="mb-0">${environment}</strong>
            <span class="badge rounded-pill ${badgeClasses}">${stateLabel}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");

  const currentIndex = Math.max(ENVIRONMENT_ORDER.indexOf(safeCurrentEnvironment), 0);
  const progressValue = ((currentIndex + 1) / ENVIRONMENT_ORDER.length) * 100;

  return `
    <section aria-label="Environment progress" class="d-grid gap-3">
      <div class="progress" role="progressbar" aria-label="Environment progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressValue}">
        <div class="progress-bar" style="width: ${progressValue}%"></div>
      </div>
      <div class="row row-cols-1 row-cols-md-3 g-2">${steps}</div>
    </section>
  `;
}
