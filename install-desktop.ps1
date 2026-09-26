[CmdletBinding()]
param([string]$DshPath, [string]$DshHome, [switch]$CheckOnly)
. (Join-Path $PSScriptRoot 'scripts\desktop-common.ps1')
$paths = Get-MornyePaths $DshPath $DshHome
Assert-DesktopVersion $paths
if (-not (Test-Path -LiteralPath $paths.Manifest -PathType Leaf)) { throw 'Launch the official desktop app once to initialize its desktop profile.' }
$source = Join-Path $PSScriptRoot 'dist\desktop'
if (-not (Test-Path -LiteralPath $source)) { $source = Join-Path $PSScriptRoot 'desktop-plugin' }
$pkg = Read-Json (Join-Path $source 'package.json')
if ($pkg.name -ne $script:MornyeName -or $pkg.version -ne $script:MornyeVersion) { throw 'Build the matching desktop plugin first (node scripts/build-desktop.mjs).' }
foreach ($file in @('index.js', 'client.js', 'cordis.patch.yml')) {
  if (-not (Test-Path -LiteralPath (Join-Path $source $file) -PathType Leaf)) { throw "Incomplete release: $file" }
}
$profile = Read-Json $paths.Manifest
if ($profile.name -ne 'dsh-profile-desktop') { throw 'The selected data directory is not a desktop profile.' }
if ($CheckOnly) { Write-Host "Compatible: desktop $script:RequiredDesktop, skin $script:MornyeVersion. No files changed."; return }
Assert-Stopped $paths
foreach ($path in @($paths.Extension, $paths.Module, $paths.State)) {
  if (Test-Path -LiteralPath $path) { throw "A skin installation already exists. Uninstall it first: $path" }
}
if ($null -ne $profile.dependencies.PSObject.Properties[$script:MornyeName] -or @($profile.dsh.profile.bundles) -contains $script:MornyeName) { throw 'The profile already references this skin. Remove it with the matching uninstaller first.' }
$lock = Enter-ProfileLock $paths
$original = [IO.File]::ReadAllBytes($paths.Manifest)
$createdExtension = $false; $createdModule = $false; $changedProfile = $false; $createdState = $false
try {
  # Re-read under the profile lock so another plugin operation cannot be lost.
  $profile = Read-Json $paths.Manifest
  foreach ($path in @($paths.Extension, $paths.Module, $paths.State)) {
    if (Test-Path -LiteralPath $path) { throw "A skin installation already exists: $path" }
  }
  if ($null -ne $profile.dependencies.PSObject.Properties[$script:MornyeName] -or @($profile.dsh.profile.bundles) -contains $script:MornyeName) { throw 'The skin is already registered.' }
  New-Item -ItemType Directory -Path $paths.Extension -Force | Out-Null
  $createdExtension = $true
  foreach ($file in @('package.json', 'index.js', 'client.js', 'cordis.patch.yml')) { Copy-Item -LiteralPath (Join-Path $source $file) -Destination $paths.Extension }
  New-Item -ItemType Directory -Path $paths.Module -Force | Out-Null
  $createdModule = $true
  foreach ($file in @('package.json', 'index.js', 'client.js', 'cordis.patch.yml')) { Copy-Item -LiteralPath (Join-Path $source $file) -Destination $paths.Module }
  $dependency = 'file:' + $paths.Extension.Replace('\', '/')
  $profile.dependencies | Add-Member -NotePropertyName $script:MornyeName -NotePropertyValue $dependency
  $profile.dsh.profile.bundles = @($profile.dsh.profile.bundles) + $script:MornyeName
  $changedProfile = $true
  Write-Json $paths.Manifest $profile
  $createdState = $true
  Write-Json $paths.State ([ordered]@{
    name = $script:MornyeName; version = $script:MornyeVersion; dependency = $dependency
    originalManifestBase64 = [Convert]::ToBase64String($original)
    installedManifestSha256 = Get-FileHashText $paths.Manifest
  })
} catch {
  if ($changedProfile) { [IO.File]::WriteAllBytes($paths.Manifest, $original) }
  if ($createdState -and (Test-Path -LiteralPath $paths.State)) { Remove-Item -LiteralPath $paths.State -Force }
  # These exact paths were created by this invocation; never remove another package.
  if ($createdModule) { Remove-OwnedDirectory $paths.Module (Join-Path $paths.Profile 'node_modules') }
  if ($createdExtension) { Remove-OwnedDirectory $paths.Extension (Join-Path $paths.Home 'extensions') }
  throw
} finally {
  $lock.Dispose(); Remove-Item -LiteralPath (Join-Path $paths.Profile 'lock') -Force
}
Write-Host "Mornye Desktop Skin $script:MornyeVersion installed. Start DeepSeek Harness and choose its light theme." -ForegroundColor Green
Write-Host 'Official application files, credentials, model configuration and sessions were not modified.'
