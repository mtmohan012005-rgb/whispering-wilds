# ============================================================================
# SVG RENDER SANITY CHECK
# Rasterises each SVG with headless Edge, then measures the wordmark band for
# contrast / legibility. Catches "text is invisible" or "text is mush" which a
# well-formedness check cannot.
# Usage: powershell -File brand/check-render.ps1
# ============================================================================
param([string]$Path = "brand")

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$edge = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $edge) { Write-Host "No Chromium browser found - cannot rasterise." -ForegroundColor Red; exit 1 }
Write-Host "Rasteriser: $edge`n"

$tmp = Join-Path $env:TEMP ("wwrender_" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
$fails = 0

# Measure band [x0,y0,x1,y1] of a bitmap: luma percentiles and the contrast
# ratio between the bright "letter" and dark "field" populations.
# GetPixel is slow, so sample on a stride - plenty for a percentile estimate.
function Measure-Band($bmp, $x0, $y0, $x1, $y1, [int]$stride = 4) {
  $rect = New-Object System.Drawing.Rectangle -ArgumentList $x0, $y0, ($x1-$x0), ($y1-$y0)
  $crop = $bmp.Clone($rect, $bmp.PixelFormat)
  $lum = New-Object System.Collections.Generic.List[double]
  for ($y = 0; $y -lt $crop.Height; $y += $stride) {
    for ($x = 0; $x -lt $crop.Width; $x += $stride) {
      $c = $crop.GetPixel($x, $y)
      $lum.Add((0.2126*$c.R + 0.7152*$c.G + 0.0722*$c.B))
    }
  }
  $crop.Dispose()
  $s = @($lum | Sort-Object)
  $n = $s.Count
  $p05 = $s[[int]($n*0.05)]; $p50 = $s[[int]($n*0.50)]; $p95 = $s[[int]($n*0.95)]
  $lin = { param($v) $t = $v/255.0; if ($t -le 0.03928) { $t/12.92 } else { [math]::Pow(($t+0.055)/1.055, 2.4) } }
  $l1 = & $lin $p95; $l2 = & $lin $p05
  $ratio = if ($l1 -gt $l2) { ($l1+0.05)/($l2+0.05) } else { ($l2+0.05)/($l1+0.05) }
  $bright = @($s | Where-Object { $_ -gt 140 }).Count
  [pscustomobject]@{
    P05 = [math]::Round($p05,1); P50 = [math]::Round($p50,1); P95 = [math]::Round($p95,1)
    Contrast = [math]::Round($ratio, 2)
    BrightPct = [math]::Round(100.0 * $bright / $n, 2)
    Samples = $n
  }
}

foreach ($f in (Get-ChildItem -Path $Path -Recurse -Filter *.svg | Sort-Object FullName)) {
  $rel = $f.FullName.Replace((Get-Location).Path + "\", "")
  Write-Host "== $rel" -ForegroundColor Cyan

  [xml]$d = Get-Content $f.FullName -Raw -Encoding UTF8
  $vb = ($d.DocumentElement.GetAttribute('viewBox') -split '[\s,]+') | ForEach-Object { [double]$_ }
  $W = [int]$vb[2]; $H = [int]$vb[3]

  # render at a sane raster size, preserving aspect
  $scale = [math]::Min(1600.0/$W, 1.0)
  $rw = [int]($W*$scale); $rh = [int]($H*$scale)
  $png = Join-Path $tmp ($f.BaseName + ".png")
  $url = "file:///" + ($f.FullName -replace '\\','/')

  $p = Start-Process -FilePath $edge -PassThru -WindowStyle Hidden -ArgumentList @(
    '--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--force-device-scale-factor=1', "--screenshot=$png",
    "--window-size=$rw,$rh", $url)
  $null = $p.WaitForExit(30000)

  if (-not (Test-Path $png)) { Write-Host "  [FAIL] render produced no file" -ForegroundColor Red; $fails++; continue }
  $bmp = [System.Drawing.Bitmap]::FromFile($png)
  Write-Host ("  raster {0}x{1} (scale {2:N2})" -f $bmp.Width, $bmp.Height, $scale)

  # Full-frame ink coverage: is anything actually drawn at all?
  $m = Measure-Band $bmp 0 0 $bmp.Width $bmp.Height
  Write-Host ("  full frame   p05={0,-6} p50={1,-6} p95={2,-6} contrast={3,-6} bright={4}%" -f $m.P05,$m.P50,$m.P95,$m.Contrast,$m.BrightPct)
  if ($m.Contrast -lt 1.6) { Write-Host "  [FAIL] frame is nearly flat - artwork may not be rendering" -ForegroundColor Red; $fails++ }
  elseif ($m.Contrast -lt 3.0) { Write-Host "  [WARN] low overall contrast" -ForegroundColor Yellow }

  # Probe the wordmark band. For the 1600x560 lockup the WILDS cap band is
  # y 318..425; probe it directly.
  if ($W -eq 1600 -and $H -eq 560) {
    $wx0 = 531; $wx1 = 1069; $wy0 = 316; $wy1 = 428
    $wm = Measure-Band $bmp $wx0 $wy0 $wx1 $wy1
    Write-Host ("  WILDS band   p05={0,-6} p50={1,-6} p95={2,-6} contrast={3,-6} bright={4}%" -f $wm.P05,$wm.P50,$wm.P95,$wm.Contrast,$wm.BrightPct)
    if ($wm.Contrast -lt 4.0) { Write-Host "  [FAIL] wordmark lacks contrast against its field" -ForegroundColor Red; $fails++ }
    if ($wm.BrightPct -lt 6)  { Write-Host "  [WARN] very little letter ink - wordmark may be too thin or mispositioned" -ForegroundColor Yellow }
    if ($wm.BrightPct -gt 62) { Write-Host "  [WARN] band is mostly bright - wordmark may be blown out" -ForegroundColor Yellow }
  }

  $bmp.Dispose()
}

Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
Write-Host ""
if ($fails -gt 0) { Write-Host "Render check: $fails failure(s)" -ForegroundColor Red; exit 1 }
Write-Host "Render check: clean" -ForegroundColor Green
exit 0
