# Renders every .d2 to SVG + PNG.
#   powershell -ExecutionPolicy Bypass -File diagrams/build.ps1
#
# PNG goes through headless Brave on purpose: d2's own PNG export pulls in
# Playwright, whose driver CDN currently 404s.
#
# NOTE: keep this file ASCII-only. Windows PowerShell 5.1 reads .ps1 as ANSI
# unless there is a BOM, so Cyrillic here becomes mojibake and breaks parsing.

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $here

$d2 = "C:\Program Files\D2\d2.exe"
$browser = "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
$out = Join-Path $here 'out'
New-Item -ItemType Directory -Force $out | Out-Null

$files = Get-ChildItem -Filter '*.d2' | Where-Object { $_.Name -notlike '_*' }

foreach ($f in $files) {
  $name = [IO.Path]::GetFileNameWithoutExtension($f.Name)
  $svg = Join-Path $out "$name.svg"

  # Layout engine per diagram type, and this matters:
  #   elk   - orthogonal routing, looks great on DAGs (architecture, domain)
  #   dagre - keeps top-down direction when the graph has CYCLES
  # ELK is a layered engine: it breaks a cycle by REVERSING an edge, which
  # flips the whole flow upside down. Every flow-* here has loops (undo,
  # next game, next match), so they must use dagre.
  # domain: у ER-схемы elk растягивает полотно почти вдвое (8660x4372
  # против 5575x3449 у dagre), поэтому она тоже на dagre.
  $layout = if ($name -like 'flow-*' -or $name -eq 'domain') { 'dagre' } else { 'elk' }
  & $d2 --layout=$layout --theme=0 --pad=40 $f.Name $svg | Out-Null

  if (Test-Path $browser) {
    $png = Join-Path $out "$name.png"
    [xml]$x = Get-Content $svg -Raw
    $vb = ($x.svg.viewBox -split '\s+')
    $w = [int][math]::Ceiling([double]$vb[2])
    $h = [int][math]::Ceiling([double]$vb[3])
    $scale = if ($w -gt 2400) { 2400 / $w } else { 1 }
    $sw = [int]($w * $scale); $sh = [int]($h * $scale)
    # no 2>$null here: redirecting a native exe's stderr in PS 5.1 turns it
    # into a NativeCommandError and aborts the script even on success
    & $browser --headless --disable-gpu --no-sandbox --hide-scrollbars `
      --screenshot="$png" --window-size=$sw,$sh `
      ("file:///" + $svg.Replace('\','/')) | Out-Null
    Write-Host ("{0,-20} {1,-6} {2} x {3}" -f $name, $layout, $w, $h)
  } else {
    Write-Host ("{0,-20} {1,-6} svg only" -f $name, $layout)
  }
}

Pop-Location
Write-Host ""
Write-Host "done -> $out"
