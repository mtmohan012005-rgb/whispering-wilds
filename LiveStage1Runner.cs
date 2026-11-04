using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;

public class LiveStage1Runner {
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);

    [DllImport("user32.dll")]
    public static extern IntPtr GetWindowDC(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP   = 0x0004;
    public const uint KEYEVENTF_KEYUP      = 0x0002;

    public const uint WM_LBUTTONDOWN = 0x0201;
    public const uint WM_LBUTTONUP   = 0x0202;
    public const uint WM_KEYDOWN     = 0x0100;
    public const uint WM_KEYUP       = 0x0101;
    public const uint WM_CHAR        = 0x0102;

    public const byte VK_SPACE  = 0x20;
    public const byte VK_ESCAPE = 0x1B;
    public const byte VK_RETURN = 0x0D;
    public const byte VK_TAB    = 0x09;

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left, Top, Right, Bottom;
        public int Width { get { return Right - Left; } }
        public int Height { get { return Bottom - Top; } }
    }

    public static IntPtr MakeLParam(int x, int y) {
        return (IntPtr)((y << 16) | (x & 0xFFFF));
    }

    public static void ClickScreen(int screenX, int screenY, IntPtr hWnd, int clientX, int clientY) {
        SetCursorPos(screenX, screenY);
        Thread.Sleep(50);
        mouse_event(MOUSEEVENTF_LEFTDOWN, (uint)screenX, (uint)screenY, 0, UIntPtr.Zero);
        Thread.Sleep(60);
        mouse_event(MOUSEEVENTF_LEFTUP, (uint)screenX, (uint)screenY, 0, UIntPtr.Zero);
        Thread.Sleep(100);

        if (hWnd != IntPtr.Zero) {
            SendMessage(hWnd, WM_LBUTTONDOWN, (IntPtr)1, MakeLParam(clientX, clientY));
            Thread.Sleep(50);
            SendMessage(hWnd, WM_LBUTTONUP, IntPtr.Zero, MakeLParam(clientX, clientY));
        }
    }

    public static void SendText(IntPtr hWnd, string text) {
        foreach (char c in text) {
            if (hWnd != IntPtr.Zero) {
                SendMessage(hWnd, WM_CHAR, (IntPtr)c, IntPtr.Zero);
            }
            Thread.Sleep(30);
        }
    }

    public static bool Capture(IntPtr hWnd, string savePath) {
        RECT r;
        GetWindowRect(hWnd, out r);
        int w = r.Width;
        int h = r.Height;
        if (w <= 0 || h <= 0) return false;

        using (Bitmap bmp = new Bitmap(w, h)) {
            using (Graphics g = Graphics.FromImage(bmp)) {
                IntPtr hdcDest = g.GetHdc();
                bool ok = PrintWindow(hWnd, hdcDest, 2); // PW_RENDERFULLCONTENT
                if (!ok) {
                    ok = PrintWindow(hWnd, hdcDest, 0);
                }
                g.ReleaseHdc(hdcDest);
            }
            bmp.Save(savePath, ImageFormat.Png);
        }
        Console.WriteLine("[SCREENSHOT CAPTURED] " + savePath + " (" + w + "x" + h + ")");
        return true;
    }

    public static int Main() {
        string brainDir = @"C:\Users\mohan\.gemini\antigravity\brain\955190fd-76fd-4764-9675-aac1bc7fe6b9";
        string gameDir = @"C:\Users\mohan\Games\WhisperingWilds-Candidate-v1.0.2";
        string testProfile = Environment.GetEnvironmentVariable("USERPROFILE") + @"\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\TestProfile_v102";

        // Kill any existing instances first
        foreach (var proc in Process.GetProcessesByName("TheWhisperingWilds")) {
            try { proc.Kill(); } catch { }
        }
        Thread.Sleep(1000);

        Console.WriteLine("=== LIVE GAME TEST - V1.0.2 - STAGE 1: LOGIN SCREEN ===");
        Console.WriteLine("Game directory: " + gameDir);
        Console.WriteLine("Save profile: " + testProfile);

        // Launch candidate game
        ProcessStartInfo psi = new ProcessStartInfo(
            gameDir + @"\TheWhisperingWilds.exe",
            "-force-d3d11 -screen-fullscreen 0 -screen-width 1366 -screen-height 768"
        );
        psi.WorkingDirectory = gameDir;
        psi.EnvironmentVariables["WW_SAVE_DIR"] = testProfile;
        psi.UseShellExecute = false;

        Process game = Process.Start(psi);
        Console.WriteLine("Launched TheWhisperingWilds.exe (PID: " + game.Id + ")");

        // Wait for window to exist and be sized properly
        IntPtr hWnd = IntPtr.Zero;
        RECT r = new RECT();
        for (int i = 0; i < 40; i++) {
            Thread.Sleep(500);
            game.Refresh();
            if (game.HasExited) {
                Console.WriteLine("ERROR: Game exited during startup!");
                return 1;
            }
            hWnd = game.MainWindowHandle;
            if (hWnd != IntPtr.Zero) {
                GetWindowRect(hWnd, out r);
                if (r.Width >= 1000) {
                    break;
                }
            }
        }

        Console.WriteLine(string.Format("Game window ready: HWND={0}, Size={1}x{2} at ({3},{4})", hWnd, r.Width, r.Height, r.Left, r.Top));
        ShowWindow(hWnd, 9); // SW_RESTORE
        SetForegroundWindow(hWnd);

        // Wait 12 seconds for full scene load, audio start, and MainMenuAnimator entrance
        Console.WriteLine("Waiting for scene and shaders to settle...");
        Thread.Sleep(12000);

        // Dismiss intro if playing by pressing Space
        SetForegroundWindow(hWnd);
        keybd_event(VK_SPACE, 0, 0, UIntPtr.Zero);
        Thread.Sleep(50);
        keybd_event(VK_SPACE, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        Thread.Sleep(2500);

        GetWindowRect(hWnd, out r);

        // Capture 1: Main Menu
        string shotMenu = Path.Combine(brainDir, "stage1_01_main_menu.png");
        Capture(hWnd, shotMenu);

        // In 1366x768 (or windowed size), MenuContainer center is horizontally centered.
        // Btn_Login is at top of MenuContainer:
        // Client X = Width / 2 = r.Width / 2
        // Client Y = (int)(r.Height * 0.40)
        int loginClientX = r.Width / 2;
        int loginClientY = (int)(r.Height * 0.40);
        int loginScreenX = r.Left + loginClientX;
        int loginScreenY = r.Top + loginClientY;

        Console.WriteLine(string.Format("Clicking 'Login' button at client ({0},{1}), screen ({2},{3})...", loginClientX, loginClientY, loginScreenX, loginScreenY));
        SetForegroundWindow(hWnd);
        ClickScreen(loginScreenX, loginScreenY, hWnd, loginClientX, loginClientY);
        Thread.Sleep(3000); // Wait for LoginUI panel animation

        // Capture 2: Login Screen (clean view)
        string shotLogin = Path.Combine(brainDir, "stage1_02_login_screen.png");
        Capture(hWnd, shotLogin);

        // Login Card is on right half:
        // Card X is roughly 71% of width: clientX = (int)(r.Width * 0.71)
        // EmailField Y is roughly 27% from top: clientY = (int)(r.Height * 0.27)
        // PasswordField Y is roughly 37% from top: clientY = (int)(r.Height * 0.37)
        // Eye button X is roughly 88% of width: clientX = (int)(r.Width * 0.88)
        // Remember checkbox is at X = 55% of width, Y = 45% of height
        int emailClientX = (int)(r.Width * 0.71);
        int emailClientY = (int)(r.Height * 0.27);
        int passClientX = (int)(r.Width * 0.69);
        int passClientY = (int)(r.Height * 0.37);
        int eyeClientX = (int)(r.Width * 0.88);
        int eyeClientY = (int)(r.Height * 0.37);
        int remClientX = (int)(r.Width * 0.54);
        int remClientY = (int)(r.Height * 0.45);

        // Test Email input focus and typing
        Console.WriteLine("Focusing Email field and typing safe sample...");
        ClickScreen(r.Left + emailClientX, r.Top + emailClientY, hWnd, emailClientX, emailClientY);
        Thread.Sleep(500);
        SendText(hWnd, "explorer.wilds@tamilnadu.in");
        Thread.Sleep(1000);

        // Test Password input focus and typing
        Console.WriteLine("Focusing Password field and typing sample password...");
        ClickScreen(r.Left + passClientX, r.Top + passClientY, hWnd, passClientX, passClientY);
        Thread.Sleep(500);
        SendText(hWnd, "WhisperingPass123!");
        Thread.Sleep(1000);

        // Capture 3: Password Masking verification
        string shotMasked = Path.Combine(brainDir, "stage1_03_login_masked.png");
        Capture(hWnd, shotMasked);

        // Test Show/Hide password toggle
        Console.WriteLine("Clicking Show/Hide password toggle button...");
        ClickScreen(r.Left + eyeClientX, r.Top + eyeClientY, hWnd, eyeClientX, eyeClientY);
        Thread.Sleep(1000);

        // Capture 4: Password Unmasked
        string shotUnmasked = Path.Combine(brainDir, "stage1_04_login_unmasked.png");
        Capture(hWnd, shotUnmasked);

        // Re-mask password
        ClickScreen(r.Left + eyeClientX, r.Top + eyeClientY, hWnd, eyeClientX, eyeClientY);
        Thread.Sleep(500);

        // Test Remember Email checkbox
        Console.WriteLine("Clicking Remember Email toggle...");
        ClickScreen(r.Left + remClientX, r.Top + remClientY, hWnd, remClientX, remClientY);
        Thread.Sleep(1000);

        // Capture 5: Remember Email Toggled
        string shotRemember = Path.Combine(brainDir, "stage1_05_login_remember_toggled.png");
        Capture(hWnd, shotRemember);

        Console.WriteLine("\n=== STAGE 1 VERIFICATION COMPLETED ===");
        Console.WriteLine("Game is remaining open on the desktop at the login screen as requested.");
        Console.WriteLine("Do not kill this process; waiting for user approval for Stage 2.");

        // Keep process open and monitor
        while (!game.HasExited) {
            Thread.Sleep(2000);
        }

        Console.WriteLine("Game process closed by user.");
        return 0;
    }
}
