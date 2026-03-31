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

    return `
      <div class="pt-environment-progress-step pt-environment-progress-step--${stepState}" aria-current="${isCurrent ? "step" : "false"}">
        <div class="pt-environment-progress-node-wrap">
          <span class="pt-environment-progress-node">${environment}</span>
        </div>
        <div class="pt-environment-progress-copy text-step--1">
          <span>${stateLabel}</span>
        </div>
      </div>
    `;
  }).join("");

  return `
    <section class="pt-environment-progress" aria-label="Environment progress">
      <div class="pt-environment-progress-track" aria-hidden="true"></div>
      <div class="pt-environment-progress-steps">${steps}</div>
    </section>
  `;
}
