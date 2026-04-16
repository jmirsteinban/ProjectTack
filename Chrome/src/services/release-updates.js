const RELEASE_CHANNEL = {
  apiUrl: "https://api.github.com/repos/jmirsteinban/ProjectTack/releases/latest",
  releaseUrl: "https://github.com/jmirsteinban/ProjectTack/releases/latest",
  releasesPageUrl: "https://github.com/jmirsteinban/ProjectTack/releases",
  zipAssetName: "ProjectTrack-Chrome.zip",
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

function pickZipAsset(assets = []) {
  return assets.find((asset) => asset?.name === RELEASE_CHANNEL.zipAssetName)
    ?? assets.find((asset) => String(asset?.name ?? "").toLowerCase().endsWith(".zip"))
    ?? null;
}

export function getInstalledExtensionVersion() {
  const manifest = getChromeRuntime()?.getManifest?.();
  return manifest?.version ?? "0.0.0";
}

export async function checkChromeReleaseUpdate() {
  const currentVersion = getInstalledExtensionVersion();
  const checkedAt = new Date().toISOString();

  const response = await fetch(RELEASE_CHANNEL.apiUrl, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        status: "private",
        currentVersion,
        latestVersion: "",
        releaseId: "",
        releaseName: "",
        releaseUrl: RELEASE_CHANNEL.releasesPageUrl,
        downloadUrl: RELEASE_CHANNEL.releasesPageUrl,
        assetName: RELEASE_CHANNEL.zipAssetName,
        publishedAt: "",
        checkedAt,
        message: "The release channel is private. Open GitHub Releases with an authorized account to download the latest package.",
      };
    }

    throw new Error(
      `GitHub returned ${response.status} while checking the latest version.`
    );
  }

  const release = await response.json();
  const latestVersion = normalizeVersion(release?.tag_name || release?.name);
  if (!latestVersion) {
    throw new Error("The latest release does not have a recognizable version tag, for example v0.2.0.");
  }

  const zipAsset = pickZipAsset(release?.assets ?? []);
  const releaseUrl = release?.html_url || RELEASE_CHANNEL.releaseUrl;
  const downloadUrl = zipAsset?.browser_download_url || releaseUrl;
  const isNewer = compareVersions(latestVersion, currentVersion) > 0;

  return {
    status: isNewer ? "available" : "current",
    currentVersion,
    latestVersion,
    releaseId: release?.tag_name || latestVersion,
    releaseName: release?.name || release?.tag_name || latestVersion,
    releaseUrl,
    downloadUrl,
    assetName: zipAsset?.name || "",
    publishedAt: release?.published_at || release?.created_at || "",
    checkedAt,
    message: isNewer
      ? `Version ${latestVersion} is available.`
      : `ProjectTrack Chrome is already on version ${currentVersion}.`,
  };
}

export async function openChromeReleaseDownload(updateState = {}) {
  const url = updateState.downloadUrl || updateState.releaseUrl || RELEASE_CHANNEL.releaseUrl;

  if (typeof chrome !== "undefined" && chrome.tabs?.create) {
    await chrome.tabs.create({ url });
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

export function getReleaseChannelSummary() {
  return { ...RELEASE_CHANNEL };
}
