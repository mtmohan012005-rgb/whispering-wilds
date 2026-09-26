# ============================================================================
# SVG BRAND ASSET VALIDATOR
# Checks well-formedness, id-reference integrity, and path bounds.
# Usage: powershell -File brand/validate-svg.ps1
# ============================================================================
param([string]$Path = "brand")

$ErrorActionPreference = "Stop"
$script:Fails = 0
$script:Warns = 0

function Fail($m) { Write-Host ("  [FAIL] " + $m) -ForegroundColor Red;   $script:Fails++ }
function Warn($m) { Write-Host ("  [WARN] " + $m) -ForegroundColor Yellow; $script:Warns++ }
function Ok($m)   { Write-Host ("  [ ok ] " + $m) -ForegroundColor Green }

# Extract every coordinate pair from a path 'd' string, honouring the
# relative/absolute command letters. Control points are included, so the
# resulting box is a safe over-estimate - which is what we want for
# overflow detection.
function Get-PathBBox([string]$d) {
  $nums = [regex]::Matches($d, '-?\d*\.?\d+(?:[eE][-+]?\d+)?') | ForEach-Object { [double]$_.Value }
  if ($nums.Count -lt 2) { return $null }
  $xs = @(); $ys = @()
  for ($i = 0; $i + 1 -lt $nums.Count; $i += 2) { $xs += $nums[$i]; $ys += $nums[$i + 1] }
  return [pscustomobject]@{
    MinX = ($xs | Measure-Object -Minimum).Minimum
    MaxX = ($xs | Measure-Object -Maximum).Maximum
    MinY = ($ys | Measure-Object -Minimum).Minimum
    MaxY = ($ys | Measure-Object -Maximum).Maximum
  }
}

$files = Get-ChildItem -Path $Path -Recurse -Filter *.svg | Sort-Object FullName

if ($files.Count -eq 0) { Write-Host "No SVG files found under '$Path'." -ForegroundColor Red; exit 1 }

foreach ($f in $files) {
  $rel = $f.FullName.Replace((Get-Location).Path + "\", "")
  Write-Host ""
  Write-Host "== $rel" -ForegroundColor Cyan
  $script:Fails = 0; $script:Warns = 0

  # ---------- 1. well-formedness ----------
  try {
    [xml]$doc = Get-Content $f.FullName -Raw -Encoding UTF8
    Ok "well-formed XML"
  } catch {
    Fail "XML parse error: $($_.Exception.Message)"
    continue
  }

  $svg = $doc.DocumentElement
  if ($svg.LocalName -ne 'svg') { Fail "root element is <$($svg.LocalName)>, expected <svg>"; continue }

  # ---------- 2. viewBox ----------
  $vb = $svg.GetAttribute('viewBox')
  if (-not $vb) { Fail "missing viewBox" }
  else {
    $p = $vb -split '[\s,]+' | ForEach-Object { [double]$_ }
    if ($p.Count -ne 4) { Fail "viewBox '$vb' is not 4 numbers" }
    else { Ok "viewBox $vb  ($($p[2]) x $($p[3]))" }
    $script:VB = $p
  }

  # ---------- 3. id reference integrity ----------
  $ids = @{}
  foreach ($n in $doc.SelectNodes('//*[@id]')) { $ids[$n.GetAttribute('id')] = $true }
  Ok "$($ids.Count) ids defined"

  $refs = @()
  foreach ($n in $doc.SelectNodes('//*[@href]')) {
    $h = $n.GetAttribute('href')
    if ($h) { $refs += ($h -replace '^#','') }   # strip the leading '#'
  }
  foreach ($n in $doc.SelectNodes('//*[@fill]'))            { $refs += @([regex]::Matches($n.GetAttribute('fill'),    'url\(#([^)]+)\)') | ForEach-Object { $_.Groups[1].Value }) }
  foreach ($n in $doc.SelectNodes('//*[@stroke]'))          { $refs += @([regex]::Matches($n.GetAttribute('stroke'),  'url\(#([^)]+)\)') | ForEach-Object { $_.Groups[1].Value }) }
  foreach ($n in $doc.SelectNodes('//*[@filter]'))          { $refs += @([regex]::Matches($n.GetAttribute('filter'),  'url\(#([^)]+)\)') | ForEach-Object { $_.Groups[1].Value }) }
  foreach ($n in $doc.SelectNodes('//*[@clip-path]'))       { $refs += @([regex]::Matches($n.GetAttribute('clip-path'),'url\(#([^)]+)\)') | ForEach-Object { $_.Groups[1].Value }) }
  foreach ($n in $doc.SelectNodes('//*[@mask]'))            { $refs += @([regex]::Matches($n.GetAttribute('mask'),    'url\(#([^)]+)\)') | ForEach-Object { $_.Groups[1].Value }) }
  $refs = $refs | Where-Object { $_ } | Sort-Object -Unique

  $badRefs = @($refs | Where-Object { -not $ids.ContainsKey($_) })
  if ($badRefs.Count -gt 0) { foreach ($b in $badRefs) { Fail "dangling reference: #$b" } }
  else { Ok "all $($refs.Count) id references resolve" }

  # ---------- 4. unused defs (informational) ----------
  $unused = @($ids.Keys | Where-Object { $refs -notcontains $_ -and $_ -notmatch '^(Title|Desc|ww)' })
  if ($unused.Count -gt 0) { Warn "defined but never referenced: $($unused -join ', ')" }

  # ---------- 5. duplicate ids ----------
  $allIds = @($doc.SelectNodes('//*[@id]') | ForEach-Object { $_.GetAttribute('id') })
  $dupes = @($allIds | Group-Object | Where-Object { $_.Count -gt 1 })
  if ($dupes.Count -gt 0) { foreach ($d in $dupes) { Fail "duplicate id #$($d.Name) x$($d.Count)" } }
  else { Ok "no duplicate ids" }

  # ---------- 6. transform parsing sanity ----------
  # A transform is a whitespace-separated LIST of functions, each optionally
  # followed by either (a,b,c,d,e,f) or comma/space separated numbers.
  $fn = '(translate|scale|rotate|matrix|skewX|skewY)'
  $argParen = "$fn\s*\([^)]*\)"
  $argBare  = "$fn\s*[-+0-9.,eE\s]+?(?=\s*$fn|\s*$)"
  $txOk = "^(\s*($argParen|$argBare))+$"
  $badT = @()
  foreach ($n in $doc.SelectNodes('//*[@transform]')) {
    $t = $n.GetAttribute('transform').Trim()
    if ($t -notmatch $txOk) { $badT += $t }
  }
  if ($badT.Count -gt 0) { foreach ($b in $badT) { Fail "unparseable transform '$b'" } }
  else { Ok "all transforms parse" }

  # ---------- 7. path geometry vs viewBox (raw local coords, defs excluded) ----------
  $vbx = $script:VB[0]; $vby = $script:VB[1]; $vbw = $script:VB[2]; $vbh = $script:VB[3]
  $oob = 0
  foreach ($n in $doc.SelectNodes('//*[local-name()="path"][@d]')) {
    # NB: the SVG xmlns means an unprefixed XPath name matches nothing,
    # so namespace-agnose the test with local-name().
    if ($n.SelectNodes('ancestor::*[local-name()="defs"]').Count -gt 0) { continue }
    $bb = Get-PathBBox $n.GetAttribute('d')
    if (-not $bb) { continue }
    if ($bb.MinX -lt ($vbx - 2) -or $bb.MaxX -gt ($vbx + $vbw + 2) -or
        $bb.MinY -lt ($vby - 2) -or $bb.MaxY -gt ($vby + $vbh + 2)) {
      Warn ("path outside viewBox: x[$([math]::Round($bb.MinX,1)),$([math]::Round($bb.MaxX,1))] y[$([math]::Round($bb.MinY,1)),$([math]::Round($bb.MaxY,1))]  d=" + $n.GetAttribute('d').Substring(0, [math]::Min(52, $n.GetAttribute('d').Length)) + "...")
      $oob++
    }
  }
  if ($oob -eq 0) { Ok "no drawn path escapes the viewBox" }

  # ---------- 8. wordmark cap-height + glyph metrics ----------
  # Letters must share a cap line and a baseline, and the tracking between
  # them must be even, or the wordmark reads as misspelled.
  $wmGroups = @($doc.SelectNodes('//*[local-name()="g"][@id]') | Where-Object { $_.GetAttribute('id') -match '(?i)wilds|wordmark' })
  foreach ($lg in $wmGroups) {
    $glyphs = @()
    foreach ($ch in $lg.SelectNodes('./*[local-name()="path"]')) {
      $bb = Get-PathBBox $ch.GetAttribute('d')
      if (-not $bb) { continue }
      $sw = 0.0
      $sAttr = $ch.GetAttribute('stroke-width')
      if ($sAttr) { $sw = [double]$sAttr }        # stroked glyphs grow by half
      $tx = 0.0
      if ($ch.GetAttribute('transform') -match 'translate\(\s*(-?[0-9.]+)') { $tx = [double]$Matches[1] }
      $glyphs += [pscustomobject]@{
        X0 = $bb.MinX + $tx - $sw/2; X1 = $bb.MaxX + $tx + $sw/2
        Y0 = $bb.MinY - $sw/2;        Y1 = $bb.MaxY + $sw/2
      }
    }
    if ($glyphs.Count -eq 0) { continue }

    $capTop = ($glyphs | Measure-Object -Property Y0 -Minimum).Minimum
    $capBot = ($glyphs | Measure-Object -Property Y1 -Maximum).Maximum
    $cap = $capBot - $capTop
    if ([math]::Abs($cap - 100) -gt 4) { Fail "wordmark cap height is $cap, expected 100" }
    else { Ok "wordmark cap height locked at $([math]::Round($cap,1))" }

    # baseline + cap line agreement, glyph by glyph
    $ragged = @($glyphs | Where-Object { [math]::Abs($_.Y0 - $capTop) -gt 2 -or [math]::Abs($_.Y1 - $capBot) -gt 2 })
    if ($ragged.Count -gt 0) { Fail "$($ragged.Count) glyph(s) do not share the cap line / baseline" }
    else { Ok "all $($glyphs.Count) glyphs share cap line and baseline" }

    # even tracking
    $sorted = @($glyphs | Sort-Object -Property X0)
    $gaps = @()
    for ($i = 0; $i -lt $sorted.Count - 1; $i++) { $gaps += ($sorted[$i+1].X0 - $sorted[$i].X1) }
    $gTxt = ($gaps | ForEach-Object { [math]::Round($_,1) }) -join ', '
    $gSpread = if ($gaps.Count -gt 1) { (($gaps | Measure-Object -Maximum).Maximum - ($gaps | Measure-Object -Minimum).Minimum) } else { 0 }
    if ($gSpread -gt 2.0) { Fail "uneven letter tracking (spread $gSpread): $gTxt" }
    else { Ok "letter tracking even: $gTxt" }

    $wTxt = ($sorted | ForEach-Object { [math]::Round($_.X1 - $_.X0, 1) }) -join ', '
    Ok "glyph widths: $wTxt"
    Ok "wordmark spans x $([math]::Round($sorted[0].X0,1)) .. $([math]::Round($sorted[-1].X1,1))"
  }

  if ($script:Fails -gt 0) { Write-Host "  => $($script:Fails) failure(s), $($script:Warns) warning(s)" -ForegroundColor Red }
  else { Write-Host "  => clean$($script:Warns | ForEach-Object { '' })" -ForegroundColor Green }
}

Write-Host ""
Write-Host "Validator finished." -ForegroundColor Cyan
if ($script:Fails -gt 0) { exit 1 } else { exit 0 }
