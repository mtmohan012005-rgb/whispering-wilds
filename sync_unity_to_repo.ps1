$src = "C:\Users\mohan\My project"
$dst = "C:\Users\mohan\.gemini\antigravity-ide\scratch\whispering-wilds\unity"

Write-Host "Syncing Assets from $src to $dst..."
robocopy "$src\Assets" "$dst\Assets" /MIR /FFT /Z /XA:H /W:1 /R:1 /XD "Library" "Temp" "obj" "Build"
if ($LASTEXITCODE -ge 8) {
    Write-Error "Robocopy Assets failed with exit code $LASTEXITCODE"
}

Write-Host "Syncing ProjectSettings from $src to $dst..."
robocopy "$src\ProjectSettings" "$dst\ProjectSettings" /MIR /FFT /Z /XA:H /W:1 /R:1
if ($LASTEXITCODE -ge 8) {
    Write-Error "Robocopy ProjectSettings failed with exit code $LASTEXITCODE"
}

Write-Host "Copying Packages manifest..."
if (-not (Test-Path "$dst\Packages")) {
    New-Item -ItemType Directory -Path "$dst\Packages" -Force
}
Copy-Item "$src\Packages\manifest.json" "$dst\Packages\manifest.json" -Force

Write-Host "Sync completed successfully."
