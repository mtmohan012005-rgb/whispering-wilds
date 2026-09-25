$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

if (Test-Path "test_results.json") {
    Remove-Item "test_results.json" -Force
}

$edgeArgs = @(
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--enable-logging=stderr",
    "--v=1",
    "http://localhost:8080/?runTests=true"
)

Write-Host "Launching Edge headless to execute tests..."
$proc = Start-Process -FilePath $edgePath -ArgumentList $edgeArgs -PassThru -RedirectStandardError "edge_stderr.log"

$timeoutSec = 90
$elapsed = 0
while ($elapsed -lt $timeoutSec) {
    Start-Sleep -Seconds 1
    $elapsed++
    if (Test-Path "test_results.json") {
        Write-Host "Test results received after $elapsed seconds!"
        break
    }
}

if (-not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}

if (Test-Path "test_results.json") {
    $results = Get-Content "test_results.json" -Raw
    Write-Host "=== TEST SUITE RESULTS ==="
    Write-Host $results
} else {
    Write-Host "Timed out waiting for test_results.json."
}
