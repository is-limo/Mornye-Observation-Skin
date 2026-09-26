$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$testRoot = Join-Path $repo ('work\installer-test-' + [Guid]::NewGuid().ToString('N'))
$testApp = Join-Path $testRoot 'app'
$testData = Join-Path $testRoot 'data'
$profileDir = Join-Path $testData 'profiles\desktop'
New-Item -ItemType Directory -Path (Join-Path $testApp 'resources'), $profileDir -Force | Out-Null
$utf8 = New-Object Text.UTF8Encoding($false)
[IO.File]::WriteAllText((Join-Path $testApp 'DeepSeek Harness.exe'), 'test fixture', $utf8)
function Write-TestArchive([string]$Version) {
  $manifest = $utf8.GetBytes('{"name":"@deepseek-ai/dsh-desktop","version":"' + $Version + '"}')
  $header = $utf8.GetBytes('{"files":{"package.json":{"size":' + $manifest.Length + ',"offset":"0"}}}')
  $padded = [int]([Math]::Ceiling(($header.Length + 4) / 4.0) * 4)
  $stream = [IO.File]::Create((Join-Path $testApp 'resources\app.asar'))
  $writer = New-Object IO.BinaryWriter($stream)
  $writer.Write([uint32]4); $writer.Write([uint32]($padded + 4)); $writer.Write([uint32]$padded); $writer.Write([uint32]$header.Length)
  $writer.Write($header)
  for ($n = $header.Length + 4; $n -lt $padded; $n++) { $writer.Write([byte]0) }
  $writer.Write($manifest); $writer.Dispose(); $stream.Dispose()
}
$manifestPath = Join-Path $profileDir 'package.json'
$original = '{"name":"dsh-profile-desktop","private":true,"dependencies":{"other-plugin":"file:../other"},"dsh":{"profile":{"bundles":["@deepseek-ai/dsh-base","@deepseek-ai/dsh-web-app","other-plugin"]}}}'
[IO.File]::WriteAllText($manifestPath, $original, $utf8)
[IO.File]::WriteAllText((Join-Path $profileDir 'cordis.patch.yml'), '# preserve exactly', $utf8)
Write-TestArchive '0.1.7-rc.2'
& (Join-Path $repo 'install-desktop.ps1') -DshPath $testApp -DshHome $testData -CheckOnly
if (Test-Path -LiteralPath (Join-Path $testData 'extensions')) { throw 'CheckOnly changed files' }
& (Join-Path $repo 'install-desktop.ps1') -DshPath $testApp -DshHome $testData
$installed = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if ($installed.dsh.profile.bundles -notcontains 'dsh-mornye-desktop-skin') { throw 'Missing skin bundle' }
if (-not (Test-Path -LiteralPath (Join-Path $profileDir 'node_modules\dsh-mornye-desktop-skin\client.js'))) { throw 'Missing client payload' }
try { & (Join-Path $repo 'install-desktop.ps1') -DshPath $testApp -DshHome $testData; throw 'duplicate unexpectedly installed' }
catch { if ($_.Exception.Message -notmatch 'already exists') { throw } }
& (Join-Path $repo 'uninstall-desktop.ps1') -DshPath $testApp -DshHome $testData
if ([IO.File]::ReadAllText($manifestPath) -cne $original) { throw 'Original manifest was not restored byte for byte' }
if ([IO.File]::ReadAllText((Join-Path $profileDir 'cordis.patch.yml')) -cne '# preserve exactly') { throw 'User patch changed' }
& (Join-Path $repo 'install-desktop.ps1') -DshPath $testApp -DshHome $testData
$modified = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$modified.dependencies | Add-Member -NotePropertyName 'later-plugin' -NotePropertyValue '1.0.0'
$modified.dsh.profile.bundles += 'later-plugin'
[IO.File]::WriteAllText($manifestPath, ($modified | ConvertTo-Json -Depth 20), $utf8)
& (Join-Path $repo 'uninstall-desktop.ps1') -DshPath $testApp -DshHome $testData
$after = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if ($after.dependencies.'later-plugin' -ne '1.0.0' -or $after.dependencies.'other-plugin' -ne 'file:../other') { throw 'Uninstall lost other plugin changes' }
Write-TestArchive '0.1.8'
try { & (Join-Path $repo 'install-desktop.ps1') -DshPath $testApp -DshHome $testData; throw 'wrong version unexpectedly installed' }
catch { if ($_.Exception.Message -notmatch 'requires desktop') { throw } }
Write-Host 'Desktop installer checks passed: dry run, offline install, duplicate guard, exact rollback, preservation of later changes, version guard.'
