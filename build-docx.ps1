# Builds the Word version of the spec from TZ.md.
#   powershell -ExecutionPolicy Bypass -File build-docx.ps1
#
# Why the extra steps instead of a plain "pandoc TZ.md -o out.docx":
#
#   * Word needs a real title block (title / subtitle / version on separate
#     lines); markdown has a single H1. So the title comes from docx-meta.yaml
#     and the H1 block is cut from the body, otherwise the heading is doubled.
#   * The version is read out of TZ.md, so the markdown stays the single source
#     of truth and nobody has to remember to bump it in two places.
#   * Everything Cyrillic lives in UTF-8 files, never in this script and never
#     in a command-line argument: PS 5.1 mangles non-ASCII args to native exes.
#   * docx-reference.docx carries the house style: navy headings, the navy
#     table header, cell borders and the page number in the footer. Without it
#     pandoc falls back to its plain default and all of that is lost.
#
# NOTE: keep this file ASCII-only. Windows PowerShell 5.1 reads .ps1 as ANSI
# unless there is a BOM, so Cyrillic here becomes mojibake and breaks parsing.

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $here

$pandoc = Join-Path $env:LOCALAPPDATA 'Pandoc\pandoc.exe'
if (-not (Test-Path $pandoc)) { throw "pandoc not found: $pandoc" }

$src = 'TZ.md'
$out = [char]0x0422 + [char]0x0417 + '_' + [char]0x0424 + [char]0x041D + [char]0x0422 +
       '_' + [char]0x0420 + [char]0x041A + '.docx'

$lines = Get-Content $src -Encoding UTF8

# Version line: "**<word> X.Y, 2025**" -> "<word> X.Y . 2025" with a middle dot.
$verLine = ($lines | Where-Object { $_ -match '^\*\*.+, \d{4}\*\*$' } | Select-Object -First 1)
if (-not $verLine) { throw "version line not found in $src" }
$version = $verLine.Trim('*').Replace(',', ' ' + [char]0x00B7)

# Body starts at the first "## " heading: drops the H1 and the version line.
$start = 0
for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match '^## ') { $start = $i; break } }
if ($start -eq 0) { throw "no '## ' heading found in $src" }

$meta = Get-Content 'docx-meta.yaml' -Encoding UTF8
$tmp = Join-Path $env:TEMP 'tz-docx-body.md'
$doc = @('---') + $meta + ("date: `"$version`"") + @('---', '') + $lines[$start..($lines.Count - 1)]
$doc | Set-Content $tmp -Encoding UTF8

& $pandoc $tmp -o $out --toc --toc-depth=2 --reference-doc=docx-reference.docx
$code = $LASTEXITCODE
Remove-Item $tmp -Force

# $ErrorActionPreference does not catch a native exe's exit code, so check it by
# hand. Without this the script cheerfully reports success on a failed build:
# the usual cause is the .docx being open in Word, which locks it for writing.
if ($code -ne 0) {
  Pop-Location
  throw "pandoc failed (exit $code). If the file is open in Word, close it and run again."
}

Pop-Location
Write-Host "done -> $out  ($version)"
