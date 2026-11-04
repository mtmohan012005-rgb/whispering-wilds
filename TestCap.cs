using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Windows.Forms;

public class Program {
    public static int Main() {
        try {
            Rectangle bounds = Screen.PrimaryScreen.Bounds;
            using (Bitmap bmp = new Bitmap(bounds.Width, bounds.Height)) {
                using (Graphics g = Graphics.FromImage(bmp)) {
                    g.CopyFromScreen(bounds.Left, bounds.Top, 0, 0, bounds.Size, CopyPixelOperation.SourceCopy);
                }
                bmp.Save(@"C:\Users\mohan\.gemini\antigravity\brain\955190fd-76fd-4764-9675-aac1bc7fe6b9\test_winexe_cap.png", ImageFormat.Png);
            }
            Console.WriteLine("SUCCESS: Screenshot captured!");
            return 0;
        } catch (Exception ex) {
            Console.WriteLine("ERROR: " + ex.ToString());
            return 1;
        }
    }
}
