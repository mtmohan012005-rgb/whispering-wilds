using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.IO;

public static class PreviewRenderer
{
    public static void Main(string[] args)
    {
        string repoRoot = @"c:\Users\mohan\.gemini\antigravity\scratch\whispering-wilds";
        string bgPath = Path.Combine(repoRoot, @"assets\ui\menu\main_menu_characters_background.png");
        string logoPath = Path.Combine(repoRoot, @"unity\Assets\_Project\Resources\UI\AppLogo.png");
        string outputDir = Path.Combine(repoRoot, @"docs\screenshots");

        Directory.CreateDirectory(outputDir);

        using (Bitmap bgImg = new Bitmap(bgPath))
        using (Bitmap logoImg = new Bitmap(logoPath))
        {
            RenderTitleMenu(bgImg, logoImg, Path.Combine(outputDir, "M1_Title_Menu_Preview.png"));
            RenderLoginModal(bgImg, logoImg, Path.Combine(outputDir, "M1_Login_Modal_Preview.png"));
            RenderSavedGamesModal(bgImg, Path.Combine(outputDir, "M1_Saved_Games_Modal_Preview.png"));
            RenderCreditsModal(bgImg, Path.Combine(outputDir, "M1_Credits_Modal_Preview.png"));
        }

        Console.WriteLine("All 4 preview screenshots successfully rendered.");
    }

    private static void DrawRoundedRect(Graphics g, Brush brush, Pen pen, Rectangle rect, int radius)
    {
        using (GraphicsPath path = new GraphicsPath())
        {
            int d = radius * 2;
            path.AddArc(rect.X, rect.Y, d, d, 180, 90);
            path.AddArc(rect.Right - d, rect.Y, d, d, 270, 90);
            path.AddArc(rect.Right - d, rect.Bottom - d, d, d, 0, 90);
            path.AddArc(rect.X, rect.Bottom - d, d, d, 90, 90);
            path.CloseFigure();
            if (brush != null) g.FillPath(brush, path);
            if (pen != null) g.DrawPath(pen, path);
        }
    }

    private static void RenderTitleMenu(Bitmap bg, Bitmap logo, string outputPath)
    {
        using (Bitmap bmp = new Bitmap(1920, 1080))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = TextRenderingHint.ClearTypeGridFit;
            g.DrawImage(bg, 0, 0, 1920, 1080);

            // Logo
            g.DrawImage(logo, new Rectangle(896, 50, 128, 128));

            // Title
            using (Font fTitle = new Font("Arial", 36, FontStyle.Bold))
            using (Font fSub = new Font("Arial", 16, FontStyle.Regular))
            using (Brush bTitle = new SolidBrush(Color.FromArgb(255, 225, 120)))
            using (Brush bSub = new SolidBrush(Color.FromArgb(210, 225, 240)))
            using (StringFormat sfCenter = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
            {
                g.DrawString("THE WHISPERING WILDS", fTitle, bTitle, 960, 205, sfCenter);
                g.DrawString("காட்டு வழி • தடம்  —  A Living Exploration of Tamil Nadu", fSub, bSub, 960, 250, sfCenter);

                string[] buttons = new string[]
                {
                    "New Game  /  புதிய விளையாட்டு",
                    "Continue  /  தொடரவும்",
                    "Load Game  /  விளையாட்டை ஏற்று",
                    "Settings  /  அமைப்புகள்",
                    "Co-op Expedition  /  கூட்டுப் பயணம்",
                    "Credits  /  பங்களிப்பாளர்கள்",
                    "Exit Game  /  வெளியேறு"
                };

                Color[] btnColors = new Color[]
                {
                    Color.FromArgb(235, 22, 75, 60),
                    Color.FromArgb(235, 30, 60, 90),
                    Color.FromArgb(235, 35, 50, 80),
                    Color.FromArgb(235, 42, 60, 75),
                    Color.FromArgb(235, 90, 60, 25),
                    Color.FromArgb(235, 38, 48, 58),
                    Color.FromArgb(235, 95, 32, 32)
                };

                using (Font fBtn = new Font("Arial", 13, FontStyle.Bold))
                using (Pen penBtn = new Pen(Color.FromArgb(180, 210, 180, 120), 1.5f))
                using (Brush bBtnText = new SolidBrush(Color.White))
                {
                    int startY = 320;
                    int btnW = 380;
                    int btnH = 46;
                    int gap = 12;

                    for (int i = 0; i < buttons.Length; i++)
                    {
                        int y = startY + i * (btnH + gap);
                        Rectangle r = new Rectangle(770, y, btnW, btnH);
                        using (Brush bFill = new SolidBrush(btnColors[i]))
                        {
                            DrawRoundedRect(g, bFill, penBtn, r, 8);
                        }
                        g.DrawString(buttons[i], fBtn, bBtnText, 960, y + btnH / 2, sfCenter);
                    }
                }

                using (Font fRule = new Font("Arial", 11, FontStyle.Italic))
                using (Brush bRule = new SolidBrush(Color.FromArgb(255, 195, 80)))
                {
                    g.DrawString("Strict Appearance Rule: 5 permanent modifications recorded per campaign across Tamil Nadu.", fRule, bRule, 960, 760, sfCenter);
                }
            }

            bmp.Save(outputPath, ImageFormat.Png);
        }
    }

    private static void RenderLoginModal(Bitmap bg, Bitmap logo, string outputPath)
    {
        using (Bitmap bmp = new Bitmap(1920, 1080))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = TextRenderingHint.ClearTypeGridFit;
            g.DrawImage(bg, 0, 0, 1920, 1080);

            using (Brush bDark = new SolidBrush(Color.FromArgb(170, 5, 8, 12)))
            {
                g.FillRectangle(bDark, 0, 0, 1920, 1080);
            }

            Rectangle modalRect = new Rectangle(680, 200, 560, 580);
            using (Brush bModal = new SolidBrush(Color.FromArgb(245, 12, 18, 26)))
            using (Pen pModal = new Pen(Color.FromArgb(220, 212, 175, 95), 2))
            {
                DrawRoundedRect(g, bModal, pModal, modalRect, 12);
            }

            using (Font fTitle = new Font("Arial", 20, FontStyle.Bold))
            using (Font fSub = new Font("Arial", 14, FontStyle.Regular))
            using (Brush bGold = new SolidBrush(Color.FromArgb(255, 225, 120)))
            using (Brush bSub = new SolidBrush(Color.FromArgb(210, 225, 240)))
            using (StringFormat sfCenter = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
            using (StringFormat sfLeft = new StringFormat { Alignment = StringAlignment.Near, LineAlignment = StringAlignment.Center })
            using (Font fLabel = new Font("Arial", 11, FontStyle.Bold))
            using (Brush bLabel = new SolidBrush(Color.FromArgb(200, 210, 220)))
            using (Font fVal = new Font("Arial", 13, FontStyle.Regular))
            using (Brush bVal = new SolidBrush(Color.FromArgb(230, 240, 255)))
            using (Pen pField = new Pen(Color.FromArgb(100, 100, 140, 180), 1))
            using (Brush bField = new SolidBrush(Color.FromArgb(230, 20, 30, 40)))
            using (Font fBtn = new Font("Arial", 13, FontStyle.Bold))
            using (Pen penBtn = new Pen(Color.FromArgb(180, 210, 180, 120), 1.5f))
            using (Brush bBtnText = new SolidBrush(Color.White))
            {
                g.DrawString("SIGN IN & CLOUD PERSISTENCE", fTitle, bGold, 960, 245, sfCenter);
                g.DrawString("உள்நுழைவு / கணக்கு விவரம்", fSub, bSub, 960, 280, sfCenter);

                // Email
                g.DrawString("Email Address / மின்னஞ்சல்", fLabel, bLabel, 730, 325, sfLeft);
                Rectangle rField1 = new Rectangle(730, 345, 460, 42);
                DrawRoundedRect(g, bField, pField, rField1, 6);
                g.DrawString("arun.kumar@whisperingwilds.tn", fVal, bVal, 745, 366, sfLeft);

                // Password
                g.DrawString("Password / கடவுச்சொல்", fLabel, bLabel, 730, 410, sfLeft);
                Rectangle rField2 = new Rectangle(730, 430, 460, 42);
                DrawRoundedRect(g, bField, pField, rField2, 6);
                g.DrawString("••••••••••••••••", fVal, bVal, 745, 451, sfLeft);

                // Sign in button
                Rectangle rSign = new Rectangle(730, 500, 460, 46);
                using (Brush bSign = new SolidBrush(Color.FromArgb(240, 28, 120, 85)))
                {
                    DrawRoundedRect(g, bSign, penBtn, rSign, 8);
                }
                g.DrawString("Sign In  /  உள்நுழை", fBtn, bBtnText, 960, 523, sfCenter);

                // Play offline button
                Rectangle rGuest = new Rectangle(730, 560, 460, 44);
                using (Brush bGuest = new SolidBrush(Color.FromArgb(240, 35, 80, 110)))
                {
                    DrawRoundedRect(g, bGuest, penBtn, rGuest, 8);
                }
                g.DrawString("Play Offline (Guest Mode)  /  விருந்தினராக விளையாடு", fBtn, bBtnText, 960, 582, sfCenter);

                // Register & Back
                Rectangle rReg = new Rectangle(730, 620, 220, 40);
                using (Brush bReg = new SolidBrush(Color.FromArgb(230, 45, 55, 70)))
                {
                    DrawRoundedRect(g, bReg, penBtn, rReg, 6);
                }
                using (Font fSm = new Font("Arial", 11, FontStyle.Bold))
                {
                    g.DrawString("Create Account", fSm, bBtnText, 840, 640, sfCenter);

                    Rectangle rBack = new Rectangle(970, 620, 220, 40);
                    using (Brush bBack = new SolidBrush(Color.FromArgb(230, 60, 40, 40)))
                    {
                        DrawRoundedRect(g, bBack, penBtn, rBack, 6);
                    }
                    g.DrawString("Back to Menu", fSm, bBtnText, 1080, 640, sfCenter);
                }
            }

            bmp.Save(outputPath, ImageFormat.Png);
        }
    }

    private static void RenderSavedGamesModal(Bitmap bg, string outputPath)
    {
        using (Bitmap bmp = new Bitmap(1920, 1080))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = TextRenderingHint.ClearTypeGridFit;
            g.DrawImage(bg, 0, 0, 1920, 1080);

            using (Brush bDark = new SolidBrush(Color.FromArgb(170, 5, 8, 12)))
            {
                g.FillRectangle(bDark, 0, 0, 1920, 1080);
            }

            Rectangle sgRect = new Rectangle(640, 180, 640, 620);
            using (Brush bModal = new SolidBrush(Color.FromArgb(245, 12, 18, 26)))
            using (Pen pModal = new Pen(Color.FromArgb(220, 212, 175, 95), 2))
            {
                DrawRoundedRect(g, bModal, pModal, sgRect, 12);
            }

            using (Font fTitle = new Font("Arial", 20, FontStyle.Bold))
            using (Font fSub = new Font("Arial", 14, FontStyle.Regular))
            using (Brush bGold = new SolidBrush(Color.FromArgb(255, 225, 120)))
            using (Brush bSub = new SolidBrush(Color.FromArgb(210, 225, 240)))
            using (StringFormat sfCenter = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
            using (StringFormat sfLeft = new StringFormat { Alignment = StringAlignment.Near, LineAlignment = StringAlignment.Center })
            {
                g.DrawString("SAVED CAMPAIGNS & PAST GAMES", fTitle, bGold, 960, 230, sfCenter);
                g.DrawString("சேமிக்கப்பட்ட பயண விவரங்கள்", fSub, bSub, 960, 265, sfCenter);

                Rectangle cardRect = new Rectangle(680, 310, 560, 210);
                using (Brush bCard = new SolidBrush(Color.FromArgb(240, 20, 30, 42)))
                using (Pen pCard = new Pen(Color.FromArgb(150, 80, 140, 180), 1.5f))
                {
                    DrawRoundedRect(g, bCard, pCard, cardRect, 8);
                }

                using (Font fSlot = new Font("Arial", 14, FontStyle.Bold))
                using (Brush bSlot = new SolidBrush(Color.FromArgb(100, 240, 180)))
                {
                    g.DrawString("SLOT 1: ACTIVE CAMPAIGN (ARUN KUMAR)", fSlot, bSlot, 705, 340, sfLeft);
                }

                using (Font fInfo = new Font("Arial", 12, FontStyle.Regular))
                using (Brush bWhite = new SolidBrush(Color.White))
                using (Brush bGray = new SolidBrush(Color.FromArgb(180, 200, 215)))
                {
                    g.DrawString("Current Region: THANJAVUR / CAUVERY DELTA (தஞ்சாவூர் டெல்டா)", fInfo, bWhite, 705, 375, sfLeft);
                    g.DrawString("Timestamp: 2026-10-31 23:45 IST  |  Integrity: Healthy (Atomic Swap + Hash)", fInfo, bGray, 705, 405, sfLeft);
                    g.DrawString("Progress: 3 Quests Done  •  4 Clues Discovered  •  4/7 Regions Unlocked", fInfo, bGold, 705, 435, sfLeft);
                    g.DrawString("Appearance Changes Used: 0 / 5  |  Currency: 100 Sparks", fInfo, bGray, 705, 465, sfLeft);
                }

                using (Font fBtn = new Font("Arial", 13, FontStyle.Bold))
                using (Pen penBtn = new Pen(Color.FromArgb(180, 210, 180, 120), 1.5f))
                using (Brush bBtnText = new SolidBrush(Color.White))
                {
                    Rectangle rResume = new Rectangle(680, 545, 265, 46);
                    using (Brush bResume = new SolidBrush(Color.FromArgb(240, 28, 120, 85)))
                    {
                        DrawRoundedRect(g, bResume, penBtn, rResume, 8);
                    }
                    g.DrawString("Resume Campaign", fBtn, bBtnText, 812, 568, sfCenter);

                    Rectangle rDel = new Rectangle(975, 545, 265, 46);
                    using (Brush bDel = new SolidBrush(Color.FromArgb(240, 100, 35, 35)))
                    {
                        DrawRoundedRect(g, bDel, penBtn, rDel, 8);
                    }
                    g.DrawString("Delete Save", fBtn, bBtnText, 1107, 568, sfCenter);

                    Rectangle rClose = new Rectangle(820, 615, 280, 42);
                    using (Brush bClose = new SolidBrush(Color.FromArgb(230, 45, 55, 70)))
                    {
                        DrawRoundedRect(g, bClose, penBtn, rClose, 6);
                    }
                    g.DrawString("Back to Menu", fBtn, bBtnText, 960, 636, sfCenter);
                }
            }

            bmp.Save(outputPath, ImageFormat.Png);
        }
    }

    private static void RenderCreditsModal(Bitmap bg, string outputPath)
    {
        using (Bitmap bmp = new Bitmap(1920, 1080))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = TextRenderingHint.ClearTypeGridFit;
            g.DrawImage(bg, 0, 0, 1920, 1080);

            using (Brush bDark = new SolidBrush(Color.FromArgb(170, 5, 8, 12)))
            {
                g.FillRectangle(bDark, 0, 0, 1920, 1080);
            }

            Rectangle crRect = new Rectangle(560, 110, 800, 760);
            using (Brush bModal = new SolidBrush(Color.FromArgb(245, 12, 18, 26)))
            using (Pen pModal = new Pen(Color.FromArgb(220, 212, 175, 95), 2))
            {
                DrawRoundedRect(g, bModal, pModal, crRect, 12);
            }

            using (Font fTitle = new Font("Arial", 20, FontStyle.Bold))
            using (Font fSub = new Font("Arial", 14, FontStyle.Regular))
            using (Brush bGold = new SolidBrush(Color.FromArgb(255, 225, 120)))
            using (Brush bSub = new SolidBrush(Color.FromArgb(210, 225, 240)))
            using (StringFormat sfCenter = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
            {
                g.DrawString("CREDITS & CULTURAL ACKNOWLEDGEMENTS", fTitle, bGold, 960, 160, sfCenter);
                g.DrawString("பங்களிப்பாளர்கள் & வரலாற்று நன்றிகள்", fSub, bSub, 960, 195, sfCenter);

                string creditsContent =
                    "THE WHISPERING WILDS (காட்டு வழி • தடம்)\n\n" +
                    "Project Production & Direction:\n" +
                    "Whispering Wilds Studios\n\n" +
                    "Cultural, Geographic & Historical Heritage Research:\n" +
                    "Rooted in Tamil Nadu's living geography, Sangam literature, Dravidian temple architecture, " +
                    "Chola & Pallava epigraphy, and the Western Ghats Nilgiri biosphere.\n\n" +
                    "Authored Campaign Regions:\n" +
                    "1. Chennai George Town  —  Urban-coastal trade & Indo-Saracenic heritage\n" +
                    "2. Pichavaram Mangrove Wetlands  —  Estuarine waterways & tidal prop roots\n" +
                    "3. Thanjavur / Cauvery Delta  —  Agrarian irrigation & Brihadisvara Chola heritage\n" +
                    "4. Chettinad Kanadukathan  —  Heritage courtyards & Athangudi craft tiles\n" +
                    "5. Mamallapuram Shore  —  Pallava granite coast & 7th-century bas-reliefs\n" +
                    "6. Nilgiris Sanctuary  —  Shola-grasslands, montane tea slopes & Toda culture\n" +
                    "7. Ancient Temple Ruins Finale  —  Mohanam musical pillars & Kaveri Star Seal\n\n" +
                    "Sound & Audio Direction:\n" +
                    "Mohanam Carnatic pentatonic raga scales & authentic regional field acoustic recordings.\n\n" +
                    "Engine & Platform:\n" +
                    "Unity 6 HDRP Baseline  |  Direct3D 11 Architecture  |  Node.js & Socket.IO Services\n\n" +
                    "Typography & Open Licenses:\n" +
                    "Noto Sans Tamil (Google Fonts, SIL Open Font License 1.1)";

                RectangleF textRect = new RectangleF(610, 235, 700, 500);
                using (Font fBody = new Font("Arial", 11, FontStyle.Regular))
                using (Brush bBody = new SolidBrush(Color.FromArgb(230, 235, 245)))
                {
                    g.DrawString(creditsContent, fBody, bBody, textRect);
                }

                Rectangle rClose = new Rectangle(820, 780, 280, 44);
                using (Font fBtn = new Font("Arial", 13, FontStyle.Bold))
                using (Pen penBtn = new Pen(Color.FromArgb(180, 210, 180, 120), 1.5f))
                using (Brush bClose = new SolidBrush(Color.FromArgb(230, 45, 55, 70)))
                using (Brush bBtnText = new SolidBrush(Color.White))
                {
                    DrawRoundedRect(g, bClose, penBtn, rClose, 6);
                    g.DrawString("Back to Menu", fBtn, bBtnText, 960, 802, sfCenter);
                }
            }

            bmp.Save(outputPath, ImageFormat.Png);
        }
    }
}
