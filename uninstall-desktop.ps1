[CmdletBinding()]
param([string]$DshPath, [string]$DshHome)
. (Join-Path $PSScriptRoot 'scripts\desktop-common.ps1')
$paths = Get-MornyePaths $DshPath $DshHome
# Uninstall also works after an official app update; do not gate it by version.
Assert-Stopped $paths
if (-not (Test-Path -LiteralPath $paths.State -PathType Leaf)) { throw 'No managed Mornye desktop installation was found.' }
$state = Read-Json $paths.State
if ($state.name -ne $script:MornyeName) { throw 'Installation ownership marker is invalid.' }
$profile = Read-Json $paths.Manifest
$dependency = $profile.dependencies.PSObject.Properties[$script:MornyeName]
if ($null -ne $dependency -and $dependency.Value -ne $state.dependency) { throw 'Another tool changed the skin dependency. Remove it with the DSH plugin manager.' }
$lock = Enter-ProfileLock $paths
try {
  $state = Read-Json $paths.State
  $profile = Read-Json $paths.Manifest
  $dependency = $profile.dependencies.PSObject.Properties[$script:MornyeName]
  if ($null -ne $dependency -and $dependency.Value -ne $state.dependency) { throw 'The skin dependency changed. Use the DSH plugin manager.' }
  if ((Get-FileHashText $paths.Manifest) -eq $state.installedManifestSha256) {
    [IO.File]::WriteAllBytes($paths.Manifest, [Convert]::FromBase64String($state.originalManifestBase64))
  } else {
    $profile.dependencies.PSObject.Properties.Remove($script:MornyeName)
    $profile.dsh.profile.bundles = @($profile.dsh.profile.bundles | Where-Object { $_ -ne $script:MornyeName })
    Write-Json $paths.Manifest $profile
  }
  Remove-OwnedDirectory $paths.Module (Join-Path $paths.Profile 'node_modules')
  Remove-OwnedDirectory $paths.Extension (Join-Path $paths.Home 'extensions')
  Remove-Item -LiteralPath $paths.State -Force
} finally {
  $lock.Dispose(); Remove-Item -LiteralPath (Join-Path $paths.Profile 'lock') -Force
}
Write-Host 'Mornye desktop skin uninstalled. Other plugins and settings were preserved.' -ForegroundColor Green
