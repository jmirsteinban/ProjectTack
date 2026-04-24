[CmdletBinding()]
param(
  [string]$OutputDirectory = "",
  [switch]$KeepStaging
)

$ErrorActionPreference = "Stop"

function Join-PathLiteral {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$ChildPath
  )

  return [System.IO.Path]::Combine($Path, $ChildPath)
}

$repoRoot = [System.IO.Path]::GetFullPath((Join-PathLiteral $PSScriptRoot ".."))
$chromeDirectory = Join-PathLiteral $repoRoot "Chrome"
$manifestPath = Join-PathLiteral $chromeDirectory "manifest.json"

if (-not (Test-Path -LiteralPath $manifestPath)) {
  throw "Chrome manifest was not found at $manifestPath"
}

if (-not $OutputDirectory) {
  $OutputDirectory = Join-PathLiteral $repoRoot "dist\chrome"
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
$stagingPath = Join-PathLiteral $outputPath.FullName "ProjectTrack-Chrome"
$stableZipPath = Join-PathLiteral $outputPath.FullName "ProjectTrack-Chrome.zip"
$metadataPath = Join-PathLiteral $outputPath.FullName "projecttrack-chrome-release.json"

if (Test-Path -LiteralPath $stagingPath) {
  Remove-Item -LiteralPath $stagingPath -Recurse -Force
}

[System.IO.Directory]::CreateDirectory($stagingPath) | Out-Null
Get-ChildItem -LiteralPath $chromeDirectory -Force | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $stagingPath -Recurse -Force
}

if ([System.IO.File]::Exists($stableZipPath)) {
  [System.IO.File]::Delete($stableZipPath)
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory(
  $stagingPath,
  $stableZipPath,
  [System.IO.Compression.CompressionLevel]::Optimal,
  $false
)

$hash = Get-FileHash -LiteralPath $stableZipPath -Algorithm SHA256
$metadata = [ordered]@{
  appName = "ProjectTrack Chrome"
  channel = "github-releases-manual"
  version = $version
  releaseId = $releaseId
  generatedAtUtc = $generatedAtUtc.ToString("o")
  zipAssetName = "ProjectTrack-Chrome.zip"
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
Write-Host "  $metadataPath"
