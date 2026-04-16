const RELEASE_CHANNEL = {
  appName: "projecttrack-chrome",
  releasesPageUrl: "https://github.com/jmirsteinban/ProjectTack/releases",
  zipAssetName: "ProjectTrack-Chrome.zip",
  migrationFile: "Android/sql/app_releases_chrome_20260416.sql",
};

function getChromeRuntime() {
  return typeof chrome !== "undefined" ? chrome.runtime : null;
}

function normalizeVersion(value) {
  const match = String(value ?? "").trim().match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.(\d+))?/i);
  if (!match) {
    return "";
  }

  return [match[1], match[2] ?? "0", match[3] ?? "0", match[4]]
    .filter((part) => part !== undefined)
    .join(".");
}

function compareVersions(left, right) {
  const leftParts = normalizeVersion(left).split(".").map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = normalizeVersion(right).split(".").map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length, 3);

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }

  return 0;
}

function hasSupabaseConfig(config) {
  return Boolean(config?.url && config?.publishableKey);
}

function buildRestUrl(config, pathAndQuery) {
  return `${config.url.replace(/\/+$/, "")}/rest/v1/${pathAndQuery}`;
}

function buildHeaders(config, session) {
  const bearer = session?.accessToken || config.publishableKey;
  return {
    apikey: config.publishableKey,
    Authorization: `Bearer ${bearer}`,
    Accept: "application/json",
  };
}

function isMissingReleaseTable(status, body) {
  const normalized = String(body ?? "").toLowerCase();
  return status === 404
    || normalized.includes("app_releases")
    || normalized.includes("42p01")
    || normalized.includes("could not find")
    || normalized.includes("does not exist");
}

function mapReleaseRow(row = {}) {
  const version = normalizeVersion(row.version || row.release_id || row.tag_name);
  const releaseUrl = row.release_url || RELEASE_CHANNEL.releasesPageUrl;
  return {
    latestVersion: version,
    releaseId: row.release_id || `v${version}`,
    releaseName: row.release_name || row.title || `ProjectTrack Chrome ${version}`,
    releaseUrl,
    downloadUrl: row.download_url || releaseUrl,
    assetName: row.asset_name || RELEASE_CHANNEL.zipAssetName,
    publishedAt: row.published_at || row.created_at || "",
  };
}

function setupRequiredState(currentVersion, checkedAt, message) {
  return {
    status: "setup-required",
    currentVersion,
    latestVersion: "",
    releaseId: "",
    releaseName: "",
    releaseUrl: RELEASE_CHANNEL.releasesPageUrl,
    downloadUrl: RELEASE_CHANNEL.releasesPageUrl,
    assetName: RELEASE_CHANNEL.zipAssetName,
    publishedAt: "",
    checkedAt,
    message,
  };
}

export function getInstalledExtensionVersion() {
  const manifest = getChromeRuntime()?.getManifest?.();
  return manifest?.version ?? "0.0.0";
}

export async function checkChromeReleaseUpdate(options = {}) {
  const currentVersion = getInstalledExtensionVersion();
  const checkedAt = new Date().toISOString();
  const { backendConfig, backendSession } = options;

  if (!hasSupabaseConfig(backendConfig)) {
    return setupRequiredState(
      currentVersion,
      checkedAt,
      "Supabase is not configured. Save the backend configuration before checking Chrome releases.",
    );
  }

  if (!backendSession?.accessToken) {
    return {
      ...setupRequiredState(
        currentVersion,
        checkedAt,
        "Sign in before checking the private Chrome release channel.",
      ),
      status: "auth-required",
    };
  }

  const query = [
    "app_releases",
    "?select=app_name,version,release_id,release_name,release_url,download_url,asset_name,published_at,created_at",
    `&app_name=eq.${encodeURIComponent(RELEASE_CHANNEL.appName)}`,
    "&active=eq.true",
    "&order=published_at.desc",
    "&limit=1",
  ].join("");

  const response = await fetch(buildRestUrl(backendConfig, query), {
    headers: buildHeaders(backendConfig, backendSession),
  });
  const body = await response.text();

  if (!response.ok) {
    if (isMissingReleaseTable(response.status, body)) {
      return setupRequiredState(
        currentVersion,
        checkedAt,
        `Apply ${RELEASE_CHANNEL.migrationFile} in Supabase to enable private release checks.`,
      );
    }

    throw new Error(`Supabase returned ${response.status} while checking Chrome releases.`);
  }

  const rows = body ? JSON.parse(body) : [];
  const release = mapReleaseRow(rows[0]);

  if (!release.latestVersion) {
    return setupRequiredState(
      currentVersion,
      checkedAt,
      "No active Chrome release is registered in Supabase yet.",
    );
  }

  const isNewer = compareVersions(release.latestVersion, currentVersion) > 0;

  return {
    status: isNewer ? "available" : "current",
    currentVersion,
    latestVersion: release.latestVersion,
    releaseId: release.releaseId,
    releaseName: release.releaseName,
    releaseUrl: release.releaseUrl,
    downloadUrl: release.downloadUrl,
    assetName: release.assetName,
    publishedAt: release.publishedAt,
    checkedAt,
    message: isNewer
      ? `Version ${release.latestVersion} is available.`
      : `ProjectTrack Chrome is already on version ${currentVersion}.`,
  };
}

export async function openChromeReleaseDownload(updateState = {}) {
  const url = updateState.downloadUrl || updateState.releaseUrl || RELEASE_CHANNEL.releasesPageUrl;

  if (typeof chrome !== "undefined" && chrome.tabs?.create) {
    await chrome.tabs.create({ url });
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

export function getReleaseChannelSummary() {
  return { ...RELEASE_CHANNEL };
}
