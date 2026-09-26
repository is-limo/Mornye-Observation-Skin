[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$version = (Get-Content -LiteralPath (Join-Path $repo 'desktop\package.json') -Raw | ConvertFrom-Json).version
& node (Join-Path $PSScriptRoot 'build-desktop.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Desktop build failed.' }
$releaseDir = Join-Path $repo 'dist\releases'
$packageName = "Mornye-Observation-Skin-Desktop-$version"
$stage = Join-Path $repo ('work\release-stage-' + [Guid]::NewGuid().ToString('N'))
$package = Join-Path $stage $packageName
New-Item -ItemType Directory -Path $package, (Join-Path $package 'scripts'), (Join-Path $package 'docs'), $releaseDir -Force | Out-Null
foreach ($file in @('install-desktop.ps1','uninstall-desktop.ps1','README.desktop.zh-CN.md','LICENSE','ASSETS-NOTICE.md','PRIVACY.md','CHANGELOG.md')) {
  Copy-Item -LiteralPath (Join-Path $repo $file) -Destination $package
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'desktop-common.ps1') -Destination (Join-Path $package 'scripts')
Copy-Item -LiteralPath (Join-Path $repo 'docs\desktop-preview.png') -Destination (Join-Path $package 'docs')
Copy-Item -LiteralPath (Join-Path $repo 'dist\desktop') -Destination (Join-Path $package 'desktop-plugin') -Recurse
$entries = @(Get-ChildItem -LiteralPath $package -File -Recurse | Sort-Object FullName | ForEach-Object {
  $relative = $_.FullName.Substring($package.Length + 1).Replace('\', '/')
  (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() + '  ' + $relative
})
$utf8 = New-Object Text.UTF8Encoding($false)
[IO.File]::WriteAllText((Join-Path $package 'SHA256SUMS.txt'), (($entries -join "`n") + "`n"), $utf8)
$zip = Join-Path $releaseDir ($packageName + '.zip')
Compress-Archive -LiteralPath $package -DestinationPath $zip -Force
$hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText(($zip + '.sha256'), ($hash + '  ' + [IO.Path]::GetFileName($zip) + "`n"), $utf8)
Write-Host "Packaged: $zip"
Write-Host "SHA256: $hash"
