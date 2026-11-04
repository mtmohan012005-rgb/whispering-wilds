using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Threading;

public class TestPrintWindow {
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);

    [DllImport("user32.dll")]
    public static extern IntPtr GetWindowDC(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

    [DllImport("gdi32.dll")]
    public static extern bool BitBlt(IntPtr hObject, int nXDest, int nYDest, int nWidth, int nHeight, IntPtr hObjectSource, int nXSrc, int nYSrc, int dwRop);

    public const int SRCCOPY = 0x00CC0020;

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left, Top, Right, Bottom;
        public int Width { get { return Right - Left; } }
        public int Height { get { return Bottom - Top; } }
    }

    public static int Main() {
        string gameDir = @"C:\Users\mohan\Games\WhisperingWilds-Candidate-v1.0.2";
        string exe = gameDir + @"\TheWhisperingWilds.exe";
        ProcessStartInfo psi = new ProcessStartInfo(exe, "-force-d3d11 -screen-fullscreen 0 -screen-width 1366 -screen-height 768");
        psi.WorkingDirectory = gameDir;
        psi.EnvironmentVariables["WW_SAVE_DIR"] = Environment.GetEnvironmentVariable("USERPROFILE") + @"\AppData\LocalLow\Whispering Wilds Studios\The Whispering Wilds\TestProfile_v102";
        psi.UseShellExecute = false;

        Process p = Process.Start(psi);
        Console.WriteLine("Started PID: " + p.Id);

        IntPtr hWnd = IntPtr.Zero;
        for (int i = 0; i < 40; i++) {
            Thread.Sleep(500);
            p.Refresh();
            if (p.HasExited) {
                Console.WriteLine("Process exited prematurely!");
                return 1;
            }
            if (p.MainWindowHandle != IntPtr.Zero) {
                hWnd = p.MainWindowHandle;
                break;
            }
        }

        Console.WriteLine("MainWindowHandle: " + hWnd);
        if (hWnd == IntPtr.Zero) {
            Console.WriteLine("No window handle found.");
            p.Kill();
            return 2;
        }

        Thread.Sleep(8000); // Wait for boot scene to render

        RECT r;
        GetWindowRect(hWnd, out r);
        Console.WriteLine(string.Format("Window Rect: {0},{1} to {2},{3} (Size: {4}x{5})", r.Left, r.Top, r.Right, r.Bottom, r.Width, r.Height));

        string savePath = @"C:\Users\mohan\.gemini\antigravity\brain\955190fd-76fd-4764-9675-aac1bc7fe6b9\test_printwindow_login.png";
        using (Bitmap bmp = new Bitmap(r.Width, r.Height)) {
            using (Graphics g = Graphics.FromImage(bmp)) {
                IntPtr hdcDest = g.GetHdc();
                bool pw = PrintWindow(hWnd, hdcDest, 2);
                int err = Marshal.GetLastWin32Error();
                Console.WriteLine("PrintWindow (PW_RENDERFULLCONTENT) returned: " + pw + " (err: " + err + ")");
                if (!pw) {
                    pw = PrintWindow(hWnd, hdcDest, 0);
                    Console.WriteLine("PrintWindow (default) returned: " + pw);
                }
                if (!pw) {
                    IntPtr hdcSrc = GetWindowDC(hWnd);
                    bool bb = BitBlt(hdcDest, 0, 0, r.Width, r.Height, hdcSrc, 0, 0, SRCCOPY);
                    ReleaseDC(hWnd, hdcSrc);
                    Console.WriteLine("BitBlt returned: " + bb);
                }
                g.ReleaseHdc(hdcDest);
            }
            bmp.Save(savePath, ImageFormat.Png);
        }

        Console.WriteLine("Saved screenshot to: " + savePath);
        p.Kill();
        return 0;
    }
}
