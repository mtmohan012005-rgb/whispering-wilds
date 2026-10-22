param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("rig", "asset", "scenes", "characters", "capture", "build", "benchmark", "editmode", "playmode", "map")]
    [string]$Action
)

$unityExe = "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe"
$projectPath = Join-Path $PSScriptRoot "..\unity"
$artifactsDir = Join-Path $PSScriptRoot "..\artifacts"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$currentSha = (git -C $repoRoot rev-parse HEAD).Trim()
$env:WW_AUDIT_SHA = $currentSha

if (-not (Test-Path $artifactsDir)) {
    New-Item -ItemType Directory -Path $artifactsDir -Force | Out-Null
}

$method = ""
$logName = ""
$extraArgs = @("-batchmode", "-projectPath", $projectPath)

switch ($Action) {
    "rig" {
        $method = "WhisperingWilds.Editor.QA.EditorCharacterRigAuditor.RunBatchAudit"
        $logName = "unity_rig_audit.log"
        $extraArgs += @("-quit", "-nographics", "-gitSha", $currentSha)
    }
    "asset" {
        $method = "WhisperingWilds.Editor.QA.AssetReferenceAudit.RunBatchAudit"
        $logName = "unity_asset_ref_audit.log"
        $extraArgs += @("-quit", "-nographics", "-gitSha", $currentSha)
    }
    "scenes" {
        $method = "WhisperingWilds.Editor.BuildPipelineAutomation.RegenerateAllScenesFromCommandLine"
        $logName = "unity_scene_regen.log"
        $extraArgs += @("-quit", "-nographics")
    }
    "characters" {
        $method = "WhisperingWilds.Editor.Characters.CharacterAssetBuilder.BuildAllCharactersBatch"
        $logName = "unity_character_build.log"
        $extraArgs += @("-quit", "-nographics")
    }
    "capture" {
        $method = "WhisperingWilds.Editor.QA.SceneVisualCapturePipeline.RunBatchCapture"
        $logName = "unity_visual_capture.log"
        $extraArgs += @("-quit", "-gitSha", $currentSha)
        # Omit -nographics so DirectX 11 device initializes for real GPU rendering
    }
    "build" {
        $method = "WhisperingWilds.Editor.BuildPipelineAutomation.BuildProductionWindowsFromCommandLine"
        $logName = "unity_standalone_build.log"
        $extraArgs += @("-quit", "-nographics", "-gitSha", $currentSha)
    }
    "benchmark" {
        $method = "WhisperingWilds.Editor.BuildPipelineAutomation.BuildQABenchmarkWindowsFromCommandLine"
        $logName = "unity_benchmark_build.log"
        $extraArgs += @("-quit", "-nographics", "-gitSha", $currentSha)
    }
    "editmode" {
        $logName = "unity_editmode_tests.log"
        $extraArgs += @("-runTests", "-testPlatform", "EditMode", "-testResults", (Join-Path $artifactsDir "test_results_EditMode.xml"), "-nographics")
    }
    "playmode" {
        $logName = "unity_playmode_tests.log"
        $extraArgs += @("-runTests", "-testPlatform", "PlayMode", "-testResults", (Join-Path $artifactsDir "test_results_PlayMode.xml"))
    }
    "map" {
        $method = "WhisperingWilds.Editor.Geography.TamilNaduMapImporter.ImportAll"
        $logName = "unity_map_import.log"
        $extraArgs += @("-quit", "-nographics")
    }
}

$logPath = Join-Path $artifactsDir $logName
if ($method -ne "") {
    $argList = $extraArgs + @("-executeMethod", $method, "-logFile", $logPath)
} else {
    $argList = $extraArgs + @("-logFile", $logPath)
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Running Unity Action: $Action" -ForegroundColor Cyan
Write-Host "Git SHA: $currentSha" -ForegroundColor Gray
Write-Host "Method: $method" -ForegroundColor Gray
Write-Host "Log: $logPath" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

$proc = Start-Process -FilePath $unityExe -ArgumentList $argList -Wait -PassThru
$exitCode = $proc.ExitCode

if ($exitCode -eq 0) {
    Write-Host "`n>>> [SUCCESS] Unity Action '$Action' completed with EXIT CODE 0" -ForegroundColor Green
} else {
    Write-Host "`n>>> [FAILURE] Unity Action '$Action' FAILED with EXIT CODE $exitCode" -ForegroundColor Red
}

exit $exitCode
