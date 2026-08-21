[CmdletBinding()]
param(
  [string]$DshProject,
  [string]$DshHome
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$packageName = 'dsh-mornye-harness-pack'

function Resolve-DshHome([string]$RequestedHome) {
  if (-not [string]::IsNullOrWhiteSpace($RequestedHome)) {
    return [System.IO.Path]::GetFullPath($RequestedHome)
  }
  if (-not [string]::IsNullOrWhiteSpace($env:DSH_HOME)) {
    return [System.IO.Path]::GetFullPath($env:DSH_HOME)
  }
  return Join-Path ([Environment]::GetFolderPath('UserProfile')) '.dsh'
}

function Resolve-DshCommand([string]$RequestedProject) {
  if (-not [string]::IsNullOrWhiteSpace($RequestedProject)) {
    $project = [System.IO.Path]::GetFullPath($RequestedProject)
    $localCommand = Join-Path $project 'node_modules\.bin\dsh.cmd'
    if (-not (Test-Path -LiteralPath $localCommand -PathType Leaf)) {
      throw "Local dsh command was not found: $localCommand"
    }
    return $localCommand
  }

  foreach ($name in @('dsh.cmd', 'dsh.exe', 'dsh')) {
    $command = Get-Command $name -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $command) {
      return $command.Source
    }
  }

  throw "dsh was not found in PATH. Run this uninstaller again with -DshProject 'C:\path\to\DeepSeekHarness'."
}

function Find-Dependency($ProfilePackage, [string]$Name) {
  $dependenciesProperty = $ProfilePackage.PSObject.Properties['dependencies']
  if ($null -eq $dependenciesProperty -or $null -eq $dependenciesProperty.Value) {
    return $null
  }
  return $dependenciesProperty.Value.PSObject.Properties |
    Where-Object { $_.Name -eq $Name } |
    Select-Object -First 1
}

function Test-PackMarker([string]$Directory) {
  $markerPath = Join-Path $Directory 'mornye-pack.manifest.json'
  if (-not (Test-Path -LiteralPath $markerPath -PathType Leaf)) {
    return $false
  }
  try {
    $marker = Get-Content -LiteralPath $markerPath -Raw | ConvertFrom-Json
    return $marker.packageName -eq $packageName
  } catch {
    return $false
  }
}

function Invoke-DshCommand([string]$Command, [string[]]$Arguments) {
  $previousDshHome = [Environment]::GetEnvironmentVariable('DSH_HOME', 'Process')
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    [Environment]::SetEnvironmentVariable('DSH_HOME', $script:dshHomeForCli, 'Process')
    $ErrorActionPreference = 'Continue'
    $nativeOutput = @(& $Command @Arguments 2>&1)
    $nativeExitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
    [Environment]::SetEnvironmentVariable('DSH_HOME', $previousDshHome, 'Process')
  }
  foreach ($line in $nativeOutput) {
    Write-Host "$line"
  }
  return $nativeExitCode
}

$DshHome = Resolve-DshHome $DshHome
$script:dshHomeForCli = $DshHome
$profilePackageJson = Join-Path $DshHome 'profiles\web\package.json'
$installedExtension = Join-Path (Join-Path $DshHome 'extensions') $packageName

if (Test-Path -LiteralPath $installedExtension) {
  if (-not (Test-PackMarker $installedExtension)) {
    throw "The extension directory has no valid Mornye marker and was left untouched: $installedExtension"
  }
}

$dependencyExists = $false
if (Test-Path -LiteralPath $profilePackageJson -PathType Leaf) {
  $profilePackage = Get-Content -LiteralPath $profilePackageJson -Raw | ConvertFrom-Json
  $dependencyExists = $null -ne (Find-Dependency $profilePackage $packageName)
}

if ($dependencyExists) {
  $dshCommand = Resolve-DshCommand $DshProject
  $exitCode = Invoke-DshCommand $dshCommand @('plugin', '--profile', 'web', 'remove', $packageName)
  if ($exitCode -ne 0) {
    throw "dsh plugin remove failed with exit code $exitCode. Installed files were left in place."
  }

  $updatedProfile = Get-Content -LiteralPath $profilePackageJson -Raw | ConvertFrom-Json
  if ($null -ne (Find-Dependency $updatedProfile $packageName)) {
    throw 'The web profile still references the skin. Installed files were left in place.'
  }
}

if (Test-Path -LiteralPath $installedExtension) {
  Remove-Item -LiteralPath $installedExtension -Recurse -Force
}

Write-Host ''
Write-Host 'Mornye Observation Skin removed.' -ForegroundColor Green
Write-Host 'Persona presets and DSH settings were not changed.'
