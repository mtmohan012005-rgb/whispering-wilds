using NUnit.Framework;
using WhisperingWilds.Display;

namespace WhisperingWilds.Tests.EditMode
{
    /// <summary>
    /// Stability of the display-settings contract: key names the UI and persistence depend on,
    /// the legacy WW_UIScale migration mapping, and the UI-scale factors.
    /// </summary>
    public class DisplaySettingsTests
    {
        [Test]
        public void PlayerPrefsKeyConstants_AreStable()
        {
            Assert.That(DisplaySettingsManager.PlayerPrefsKeyResolution, Is.EqualTo("WW_Resolution"));
            Assert.That(DisplaySettingsManager.PlayerPrefsKeyFullscreen, Is.EqualTo("WW_Fullscreen"));
            Assert.That(DisplaySettingsManager.PlayerPrefsKeyVSync, Is.EqualTo("WW_VSync"));
            Assert.That(DisplaySettingsManager.PlayerPrefsKeyFrameLimit, Is.EqualTo("WW_FrameLimit"));
            Assert.That(DisplaySettingsManager.PlayerPrefsKeyUiScale, Is.EqualTo("WW_UiScale"));
        }

        [Test]
        public void LegacyUiScaleToLevel_MapsBucketsAsDocumented()
        {
            Assert.That(DisplaySettingsManager.LegacyUiScaleToLevel(0.8f), Is.EqualTo(UiScaleLevel.Small));
            Assert.That(DisplaySettingsManager.LegacyUiScaleToLevel(0.9f), Is.EqualTo(UiScaleLevel.Small));
            Assert.That(DisplaySettingsManager.LegacyUiScaleToLevel(1.0f), Is.EqualTo(UiScaleLevel.Medium));
            Assert.That(DisplaySettingsManager.LegacyUiScaleToLevel(1.1f), Is.EqualTo(UiScaleLevel.Medium));
            Assert.That(DisplaySettingsManager.LegacyUiScaleToLevel(1.15f), Is.EqualTo(UiScaleLevel.Large));
            Assert.That(DisplaySettingsManager.LegacyUiScaleToLevel(1.2f), Is.EqualTo(UiScaleLevel.Large));
        }

        [Test]
        public void UiScaleFactor_MapsBucketsAsDocumented()
        {
            Assert.That(DisplaySettingsManager.UiScaleFactor(UiScaleLevel.Small), Is.EqualTo(0.85f).Within(1e-4f));
            Assert.That(DisplaySettingsManager.UiScaleFactor(UiScaleLevel.Medium), Is.EqualTo(1.0f).Within(1e-4f));
            Assert.That(DisplaySettingsManager.UiScaleFactor(UiScaleLevel.Large), Is.EqualTo(1.25f).Within(1e-4f));
        }

        [Test]
        public void DefaultMode_IsFullHdAt60Hz()
        {
            Assert.That(DisplaySettingsManager.DefaultMode.width, Is.EqualTo(1920));
            Assert.That(DisplaySettingsManager.DefaultMode.height, Is.EqualTo(1080));
            Assert.That(DisplaySettingsManager.DefaultMode.refreshRate, Is.EqualTo(60));
        }

        [Test]
        public void UiScaleLevel_OrderIsStable()
        {
            Assert.That((int)UiScaleLevel.Small, Is.EqualTo(0));
            Assert.That((int)UiScaleLevel.Medium, Is.EqualTo(1));
            Assert.That((int)UiScaleLevel.Large, Is.EqualTo(2));
        }
    }
}