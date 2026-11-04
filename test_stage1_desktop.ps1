# Stage 1: Live Desktop Interaction Test for The Whispering Wilds v1.0.2 Login Screen
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$code = @"
using System;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Threading;

public class WinAuto {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);

    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP   = 0x0004;

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    public static void ClickAt(int x, int y, int delayMs = 100) {
        SetCursorPos(x, y);
        Thread.Sleep(delayMs);
        mouse_event(MOUSEEVENTF_LEFTDOWN, (uint)x, (uint)y, 0, 0);
        Thread.Sleep(50);
        mouse_event(MOUSEEVENTF_LEFTUP, (uint)x, (uint)y, 0, 0);
        Thread.Sleep(delayMs);
    }
}
"@
if (-not ([System.Management.Automation.PSTypeName]'WinAuto').Type) {
    Add-Type -TypeDefinition $code
}

function Take-Screenshot([string]$savePath) {
    $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $bounds.Size, [System.Drawing.CopyPixelOperation]::SourceCopy)
    $bitmap.Save($savePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    Write-Host "[SCREENSHOT] Saved: $savePath" -ForegroundColor Green
}

$artifactDir = "C:\Users\mohan\.gemini\antigravity\brain\955190fd-76fd-4764-9675-aac1bc7fe6b9"
$gameDir = "C:\Users\mohan\Games\WhisperingWilds-Candidate-v1.0.2"
$testProfile = "$env:USERPROFILE\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\TestProfile_v102"

Write-Host "=== STAGE 1: LIVE GAME LOGIN SCREEN TEST ===" -ForegroundColor Cyan
Write-Host "Target Candidate: $gameDir"

# 1. Stop any existing instance
Get-Process -Name "TheWhisperingWilds" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# 2. Set save override environment variable for process isolation
$env:WW_SAVE_DIR = $testProfile

# 3. Launch via Play-Candidate.bat
Write-Host "Launching Play-Candidate.bat..." -ForegroundColor Yellow
$proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$gameDir\Play-Candidate.bat`"" -WorkingDirectory $gameDir -PassThru

# 4. Wait for TheWhisperingWilds process
$gameProc = $null
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    $gameProc = Get-Process -Name "TheWhisperingWilds" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($gameProc -and $gameProc.MainWindowHandle -ne 0) {
        break
    }
}

if (-not $gameProc) {
    throw "Game process failed to start within 30 seconds."
}

Write-Host "Found Game PID: $($gameProc.Id), WindowHandle: $($gameProc.MainWindowHandle)" -ForegroundColor Cyan
[WinAuto]::ShowWindow($gameProc.MainWindowHandle, 3) # SW_MAXIMIZE
[WinAuto]::SetForegroundWindow($gameProc.MainWindowHandle)
Start-Sleep -Seconds 10 # Allow shaders and intro to initialize

# 5. Bring to foreground and dismiss intro / transition to main menu
[WinAuto]::SetForegroundWindow($gameProc.MainWindowHandle)
[System.Windows.Forms.SendKeys]::SendWait(" ")
Start-Sleep -Seconds 1
[WinAuto]::ClickAt(683, 384, 100) # Click center to dismiss intro
Start-Sleep -Seconds 4

# Capture Main Menu
$mainMenuShot = Join-Path $artifactDir "stage1_01_main_menu.png"
Take-Screenshot -savePath $mainMenuShot

# 6. Click Login button
# On 1366x768, MenuContainer centered, Btn_Login is at (683, 306)
Write-Host "Clicking Login button at (683, 306)..." -ForegroundColor Yellow
[WinAuto]::SetForegroundWindow($gameProc.MainWindowHandle)
[WinAuto]::ClickAt(683, 306, 150)
Start-Sleep -Seconds 3

# Capture Login Screen
$loginPanelShot = Join-Path $artifactDir "stage1_02_login_panel.png"
Take-Screenshot -savePath $loginPanelShot

# 7. Test Email input focus and typing
Write-Host "Clicking Email input field at (970, 205)..." -ForegroundColor Yellow
[WinAuto]::ClickAt(970, 205, 100)
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait("qa_explorer@example.com")
Start-Sleep -Seconds 1

# 8. Test Password input focus, typing, and mask
Write-Host "Clicking Password input field at (940, 280)..." -ForegroundColor Yellow
[WinAuto]::ClickAt(940, 280, 100)
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait("SamplePass123!")
Start-Sleep -Seconds 1

# Capture masked password
$typingShot = Join-Path $artifactDir "stage1_03_login_typing_masked.png"
Take-Screenshot -savePath $typingShot

# 9. Test Show/Hide password toggle
Write-Host "Clicking Show/Hide Password button at (1145, 280)..." -ForegroundColor Yellow
[WinAuto]::ClickAt(1145, 280, 150)
Start-Sleep -Seconds 1

# Capture unmasked password
$unmaskShot = Join-Path $artifactDir "stage1_04_login_typing_unmasked.png"
Take-Screenshot -savePath $unmaskShot

# Re-mask password
[WinAuto]::ClickAt(1145, 280, 150)
Start-Sleep -Milliseconds 500

# 10. Test Remember Email checkbox
Write-Host "Clicking Remember Email toggle at (730, 345)..." -ForegroundColor Yellow
[WinAuto]::ClickAt(730, 345, 150)
Start-Sleep -Seconds 1

$rememberShot = Join-Path $artifactDir "stage1_05_login_remember_toggled.png"
Take-Screenshot -savePath $rememberShot

Write-Host "Stage 1 automation complete. Game left running at login screen as requested." -ForegroundColor Green
