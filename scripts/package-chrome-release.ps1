[CmdletBinding()]
param(
  [string]$OutputDirectory = "",
  [switch]$KeepStaging
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$chromeDirectory = Join-Path $repoRoot "Chrome"
$manifestPath = Join-Path $chromeDirectory "manifest.json"

if (-not (Test-Path -LiteralPath $manifestPath)) {
  throw "Chrome manifest was not found at $manifestPath"
}

if (-not $OutputDirectory) {
  $OutputDirectory = Join-Path $repoRoot "dist\chrome"
}

$outputPath = [System.IO.Directory]::CreateDirectory($OutputDirectory)
$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
$version = [string]$manifest.version

if (-not $version) {
  throw "Chrome manifest does not define a version."
}

$generatedAtUtc = (Get-Date).ToUniversalTime()
$stamp = $generatedAtUtc.ToString("yyyyMMddHHmmss")
$releaseId = "$version+$stamp"
$stagingPath = Join-Path $outputPath.FullName "ProjectTrack-Chrome"
$stableZipPath = Join-Path $outputPath.FullName "ProjectTrack-Chrome.zip"
$versionedZipName = "ProjectTrack-Chrome-v$version.zip"
$versionedZipPath = Join-Path $outputPath.FullName $versionedZipName
$metadataPath = Join-Path $outputPath.FullName "projecttrack-chrome-release.json"

if (Test-Path -LiteralPath $stagingPath) {
  Remove-Item -LiteralPath $stagingPath -Recurse -Force
}

[System.IO.Directory]::CreateDirectory($stagingPath) | Out-Null
Get-ChildItem -LiteralPath $chromeDirectory -Force | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $stagingPath -Recurse -Force
}

foreach ($zipPath in @($stableZipPath, $versionedZipPath)) {
  if ([System.IO.File]::Exists($zipPath)) {
    [System.IO.File]::Delete($zipPath)
  }
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory(
  $stagingPath,
  $versionedZipPath,
  [System.IO.Compression.CompressionLevel]::Optimal,
  $false
)
Copy-Item -LiteralPath $versionedZipPath -Destination $stableZipPath -Force

$hash = Get-FileHash -LiteralPath $stableZipPath -Algorithm SHA256
$metadata = [ordered]@{
  appName = "ProjectTrack Chrome"
  channel = "github-releases-manual"
  version = $version
  releaseId = $releaseId
  generatedAtUtc = $generatedAtUtc.ToString("o")
  zipAssetName = "ProjectTrack-Chrome.zip"
  versionedZipAssetName = $versionedZipName
  sha256 = $hash.Hash
  installSteps = @(
    "Download ProjectTrack-Chrome.zip from the latest GitHub Release.",
    "Unzip it over the local Chrome extension folder.",
    "Open chrome://extensions and press Reload on ProjectTrack."
  )
}

$metadata | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $metadataPath -Encoding UTF8

if (-not $KeepStaging) {
  Remove-Item -LiteralPath $stagingPath -Recurse -Force
}

Write-Host "ProjectTrack Chrome package created:"
Write-Host "  $stableZipPath"
Write-Host "  $versionedZipPath"
Write-Host "  $metadataPath"
