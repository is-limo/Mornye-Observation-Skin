Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:MornyeName = 'dsh-mornye-desktop-skin'
$script:MornyeVersion = '0.4.1'
$script:RequiredDesktop = '0.1.7-rc.2'
$script:Utf8 = New-Object System.Text.UTF8Encoding($false)

function Get-MornyePaths([string]$DshPath, [string]$DshHome) {
  if ([string]::IsNullOrWhiteSpace($DshPath)) {
    $running = Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $running -and $running.Path) { $DshPath = Split-Path -Parent $running.Path }
  }
  if ([string]::IsNullOrWhiteSpace($DshPath)) { throw 'Specify -DshPath with the folder containing DeepSeek Harness.exe.' }
  if ([string]::IsNullOrWhiteSpace($DshHome)) { $DshHome = $env:DSH_HOME }
  if ([string]::IsNullOrWhiteSpace($DshHome)) { $DshHome = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.dsh' }
  $app = [IO.Path]::GetFullPath($DshPath)
  $dataRoot = [IO.Path]::GetFullPath($DshHome)
  $profile = Join-Path $dataRoot 'profiles\desktop'
  return [PSCustomObject]@{
    App = $app; Home = $dataRoot; Profile = $profile
    Exe = Join-Path $app 'DeepSeek Harness.exe'
    Asar = Join-Path $app 'resources\app.asar'
    Manifest = Join-Path $profile 'package.json'
    Extension = Join-Path $dataRoot ('extensions\' + $script:MornyeName)
    Module = Join-Path $profile ('node_modules\' + $script:MornyeName)
    State = Join-Path $profile '.mornye-desktop-skin-state.json'
  }
}
function Assert-Stopped($Paths) {
  foreach ($process in @(Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue)) {
    if (-not $process.Path -or $process.Path -eq $Paths.Exe) { throw 'Fully quit DeepSeek Harness (including the tray) before changing the skin.' }
  }
}
function Assert-DesktopVersion($Paths) {
  if (-not (Test-Path -LiteralPath $Paths.Exe -PathType Leaf)) { throw 'DeepSeek Harness.exe was not found in -DshPath.' }
  $stream = [IO.File]::OpenRead($Paths.Asar)
  $reader = New-Object IO.BinaryReader($stream)
  try {
    $sizeSize = $reader.ReadUInt32(); $headerSize = $reader.ReadUInt32()
    $headerPayload = $reader.ReadUInt32(); $jsonSize = $reader.ReadUInt32()
    if ($sizeSize -ne 4 -or $jsonSize -gt 33554432 -or $headerSize -lt ($jsonSize + 8)) { throw 'Unsupported ASAR header.' }
    $header = $script:Utf8.GetString($reader.ReadBytes($jsonSize)) | ConvertFrom-Json
    $entry = $header.files.'package.json'
    if ($entry.size -gt 1048576) { throw 'Unexpected desktop manifest size.' }
    $null = $stream.Seek(8 + [long]$headerSize + [long]$entry.offset, [IO.SeekOrigin]::Begin)
    $manifest = $script:Utf8.GetString($reader.ReadBytes($entry.size)) | ConvertFrom-Json
    if ($manifest.name -ne '@deepseek-ai/dsh-desktop' -or $manifest.version -ne $script:RequiredDesktop) {
      throw "This release requires desktop $script:RequiredDesktop; found $($manifest.name) $($manifest.version)."
    }
  } finally { $reader.Dispose(); $stream.Dispose() }
}
function Read-Json([string]$Path) { return [IO.File]::ReadAllText($Path, $script:Utf8) | ConvertFrom-Json }
function Write-Json([string]$Path, $Value) { [IO.File]::WriteAllText($Path, (($Value | ConvertTo-Json -Depth 100) + "`n"), $script:Utf8) }
function Get-FileHashText([string]$Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Enter-ProfileLock($Paths) {
  $lockPath = Join-Path $Paths.Profile 'lock'
  try { $stream = [IO.File]::Open($lockPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None) }
  catch { throw "The desktop profile is locked. Quit DSH and other plugin installers. Lock: $lockPath" }
  $bytes = $script:Utf8.GetBytes("$PID`n"); $stream.Write($bytes, 0, $bytes.Length); $stream.Flush()
  return $stream
}
function Remove-OwnedDirectory([string]$Path, [string]$ExpectedParent) {
  $full = [IO.Path]::GetFullPath($Path).TrimEnd('\')
  $parent = [IO.Path]::GetFullPath($ExpectedParent).TrimEnd('\')
  if ((Split-Path -Parent $full) -ne $parent -or (Split-Path -Leaf $full) -ne $script:MornyeName) { throw 'Refusing cleanup outside the exact skin directory.' }
  if (-not (Test-Path -LiteralPath $full)) { return }
  $item = Get-Item -LiteralPath $full -Force
  if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'The skin directory became a link. Use the DSH plugin manager to remove it.' }
  $manifest = Read-Json (Join-Path $full 'package.json')
  if ($manifest.name -ne $script:MornyeName) { throw 'Directory ownership check failed.' }
  foreach ($child in @(Get-ChildItem -LiteralPath $full -Recurse -Force)) {
    if (($child.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Unexpected link inside skin directory; refusing recursive cleanup.' }
  }
  Remove-Item -LiteralPath $full -Recurse -Force
}
