param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("rig", "asset", "scenes", "capture", "build")]
    [string]$Action
)

$unityExe = "C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe"
$projectPath = Join-Path $PSScriptRoot "..\unity"
$artifactsDir = Join-Path $PSScriptRoot "..\artifacts"

if (-not (Test-Path $artifactsDir)) {
    New-Item -ItemType Directory -Path $artifactsDir -Force | Out-Null
}

$method = ""
$logName = ""
$extraArgs = @("-batchmode", "-quit", "-projectPath", $projectPath)

switch ($Action) {
    "rig" {
        $method = "WhisperingWilds.Editor.QA.EditorCharacterRigAuditor.RunBatchAudit"
        $logName = "unity_rig_audit.log"
        $extraArgs += "-nographics"
    }
    "asset" {
        $method = "WhisperingWilds.Editor.QA.AssetReferenceAudit.RunBatchAudit"
        $logName = "unity_asset_ref_audit.log"
        $extraArgs += "-nographics"
    }
    "scenes" {
        $method = "WhisperingWilds.Editor.BuildPipelineAutomation.RegenerateAllScenesFromCommandLine"
        $logName = "unity_scene_regen.log"
        $extraArgs += "-nographics"
    }
    "capture" {
        $method = "WhisperingWilds.Editor.QA.SceneVisualCapturePipeline.RunBatchCapture"
        $logName = "unity_visual_capture.log"
        # Omit -nographics so DirectX 11 device initializes for real GPU rendering
    }
    "build" {
        $method = "WhisperingWilds.Editor.BuildPipelineAutomation.BuildProductionWindowsFromCommandLine"
        $logName = "unity_standalone_build.log"
        $extraArgs += "-nographics"
    }
}

$logPath = Join-Path $artifactsDir $logName
$argList = $extraArgs + @("-executeMethod", $method, "-logFile", $logPath)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Running Unity Action: $Action" -ForegroundColor Cyan
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
