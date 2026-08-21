[CmdletBinding()]
param(
  [string]$DshProject,
  [string]$DshHome
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$packageName = 'dsh-mornye-harness-pack'
$releaseVersion = '0.3.1'
$requiredDshVersion = '0.1.0-rc.6'

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

  throw "dsh was not found in PATH. Run this installer again with -DshProject 'C:\path\to\DeepSeekHarness'."
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

function Invoke-DshCommand {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory = $true)]
    [string]$Command,
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [switch]$Quiet
  )

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

  $textOutput = @($nativeOutput | ForEach-Object { "$($_)" })
  if (-not $Quiet) {
    foreach ($line in $textOutput) {
      Write-Host $line
    }
  }

  return [PSCustomObject]@{
    ExitCode = $nativeExitCode
    Output = $textOutput
  }
}

$DshHome = Resolve-DshHome $DshHome
$script:dshHomeForCli = $DshHome
$dshCommand = Resolve-DshCommand $DshProject
$profilePackageJson = Join-Path $DshHome 'profiles\web\package.json'
$extensionsRoot = Join-Path $DshHome 'extensions'
$installedExtension = Join-Path $extensionsRoot $packageName

if (-not (Test-Path -LiteralPath $profilePackageJson -PathType Leaf)) {
  throw "The DSH web profile has not been initialized: $profilePackageJson"
}
if (Test-Path -LiteralPath $installedExtension) {
  throw "The skin directory already exists: $installedExtension`nRun uninstall.ps1 first, then install this version."
}

$sourcePackagePath = Join-Path $PSScriptRoot 'package.json'
$sourceMarkerPath = Join-Path $PSScriptRoot 'mornye-pack.manifest.json'
foreach ($requiredFile in @($sourcePackagePath, $sourceMarkerPath, (Join-Path $PSScriptRoot 'cordis.patch.yml'), (Join-Path $PSScriptRoot 'index.js'))) {
  if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
    throw "The release archive is incomplete: $requiredFile"
  }
}

$sourcePackage = Get-Content -LiteralPath $sourcePackagePath -Raw | ConvertFrom-Json
$sourceMarker = Get-Content -LiteralPath $sourceMarkerPath -Raw | ConvertFrom-Json
if ($sourcePackage.name -ne $packageName -or $sourcePackage.version -ne $releaseVersion) {
  throw 'The packaged extension metadata does not match this installer.'
}
if ($sourceMarker.packageName -ne $packageName -or $sourceMarker.version -ne $releaseVersion) {
  throw 'The packaged safety marker does not match this installer.'
}

$versionResult = Invoke-DshCommand -Command $dshCommand -Arguments @('--version') -Quiet
if ($versionResult.ExitCode -ne 0) {
  throw "The dsh version check failed:`n$($versionResult.Output -join [Environment]::NewLine)"
}
$resolvedVersion = $versionResult.Output |
  ForEach-Object { "$($_)".Trim() } |
  Where-Object { $_ -match '^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$' } |
  Select-Object -Last 1
if ($resolvedVersion -ne $requiredDshVersion) {
  throw "This skin targets dsh $requiredDshVersion, but the selected command reports '$resolvedVersion'."
}

$profilePackage = Get-Content -LiteralPath $profilePackageJson -Raw | ConvertFrom-Json
if ($null -ne (Find-Dependency $profilePackage $packageName)) {
  throw "$packageName is already registered in the web profile. Run uninstall.ps1 first."
}

$createdExtension = $false
$preserveExtension = $false
try {
  New-Item -ItemType Directory -Path $extensionsRoot -Force | Out-Null
  New-Item -ItemType Directory -Path $installedExtension | Out-Null
  $createdExtension = $true

  foreach ($file in @('package.json', 'cordis.patch.yml', 'index.js', 'mornye-pack.manifest.json')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination $installedExtension
  }
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'styles') -Destination $installedExtension -Recurse
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'assets') -Destination $installedExtension -Recurse

  $addResult = Invoke-DshCommand -Command $dshCommand -Arguments @('plugin', '--profile', 'web', 'add', $installedExtension)
  if ($addResult.ExitCode -ne 0) {
    throw "dsh plugin add failed with exit code $($addResult.ExitCode)."
  }
  $registeredProfile = Get-Content -LiteralPath $profilePackageJson -Raw | ConvertFrom-Json
  if ($null -eq (Find-Dependency $registeredProfile $packageName)) {
    throw 'dsh plugin add returned success, but the web profile did not register the skin.'
  }
} catch {
  $installError = $_
  $dependencyWasAdded = $false
  try {
    $failedProfile = Get-Content -LiteralPath $profilePackageJson -Raw | ConvertFrom-Json
    $dependencyWasAdded = $null -ne (Find-Dependency $failedProfile $packageName)
  } catch {
    $preserveExtension = $true
    Write-Warning "The web profile could not be checked during rollback. The extension directory was preserved: $installedExtension"
  }

  if ($dependencyWasAdded) {
    $rollback = Invoke-DshCommand -Command $dshCommand -Arguments @('plugin', '--profile', 'web', 'remove', $packageName) -Quiet
    if ($rollback.ExitCode -ne 0) {
      $preserveExtension = $true
      Write-Warning "Profile rollback failed. The extension directory was preserved: $installedExtension"
    }
  }

  if ($createdExtension -and -not $preserveExtension -and (Test-Path -LiteralPath $installedExtension)) {
    Remove-Item -LiteralPath $installedExtension -Recurse -Force
  }
  throw $installError
}

Write-Host ''
Write-Host "Mornye Observation Skin $releaseVersion installed." -ForegroundColor Green
Write-Host "Extension: $installedExtension"
Write-Host 'No persona preset, API key or session data was installed.'
Write-Host 'Start DSH and use its light theme to enable the complete layout.'
