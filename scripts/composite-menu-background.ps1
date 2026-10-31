# Composite high-resolution Main Menu / Login screen background
Add-Type -AssemblyName System.Drawing

$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }
$repo = Resolve-Path "$root\.."

$bgPath = Join-Path $repo "assets\ui\menu\menu-mamallapuram.jpg"
$charsPath = Join-Path $repo "assets\ui\characters\tn_npc_lineup_12_characters.png"
$logoPath = Join-Path $repo "assets\ui\logo\whispering-wilds-logo.png"

$targetWidth = 1920
$targetHeight = 1080

$finalBmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gfx = [System.Drawing.Graphics]::FromImage($finalBmp)
$gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gfx.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# 1. Base dark background
$darkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 12, 18, 24))
$gfx.FillRectangle($darkBrush, 0, 0, $targetWidth, $targetHeight)

# 2. Draw Mamallapuram Shore temple landscape
if (Test-Path $bgPath) {
    $bgImg = [System.Drawing.Bitmap]::FromFile($bgPath)
    $srcRect = New-Object System.Drawing.Rectangle(0, 0, $bgImg.Width, $bgImg.Height)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $targetWidth, $targetHeight)
    $gfx.DrawImage($bgImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $bgImg.Dispose()
}

# 3. Apply soft darkening gradient so menu buttons and text remain crystal clear
$gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point(0, $targetHeight)),
    [System.Drawing.Color]::FromArgb(140, 5, 10, 18),
    [System.Drawing.Color]::FromArgb(235, 8, 14, 22)
)
$gfx.FillRectangle($gradBrush, 0, 0, $targetWidth, $targetHeight)

# 4. Draw character lineup in bottom-center
if (Test-Path $charsPath) {
    $charImg = [System.Drawing.Bitmap]::FromFile($charsPath)
    # Scale characters to span across lower third
    $charW = 1500
    $charH = [int](($charImg.Height / $charImg.Width) * $charW)
    $charX = [int](($targetWidth - $charW) / 2)
    $charY = $targetHeight - $charH + 40 # seat at bottom

    # Draw subtle ground shadow under characters
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 0, 0, 0))
    $gfx.FillEllipse($shadowBrush, $charX + 50, $targetHeight - 120, $charW - 100, 100)

    $gfx.DrawImage($charImg, $charX, $charY, $charW, $charH)
    $charImg.Dispose()
}

# 5. Vignette border darkening
$vignetteTop = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point(0, 300)),
    [System.Drawing.Color]::FromArgb(200, 0, 0, 0),
    [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
)
$gfx.FillRectangle($vignetteTop, 0, 0, $targetWidth, 300)

$vignetteBottom = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, ($targetHeight - 200))),
    (New-Object System.Drawing.Point(0, $targetHeight)),
    [System.Drawing.Color]::FromArgb(0, 0, 0, 0),
    [System.Drawing.Color]::FromArgb(230, 0, 0, 0)
)
$gfx.FillRectangle($vignetteBottom, 0, ($targetHeight - 200), $targetWidth, 200)

# Save output
$outDir1 = Join-Path $repo "assets\ui\menu"
$out1 = Join-Path $outDir1 "main_menu_characters_background.png"
$finalBmp.Save($out1, [System.Drawing.Imaging.ImageFormat]::Png)

$outDir2 = Join-Path $repo "unity\Assets\_Project\Resources\UI"
if (-not (Test-Path $outDir2)) { New-Item -ItemType Directory -Path $outDir2 -Force | Out-Null }
$out2 = Join-Path $outDir2 "MainMenuBackground.png"
$finalBmp.Save($out2, [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "Successfully generated Main Menu Background:"
Write-Host "  -> $out1"
Write-Host "  -> $out2"

$gfx.Dispose()
$finalBmp.Dispose()
