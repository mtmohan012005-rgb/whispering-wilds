/**
 * The Whispering Wilds (Kaattu Vazhi) - Cinematic UI Overlay
 * Renders letterbox bars, chapter title cards, location intro banners,
 * bilingual subtitles, and skip prompt indicators.
 */

class CinematicUI {
  constructor() {
    this.container = null;
    this.topBar = null;
    this.bottomBar = null;
    this.subtitleBox = null;
    this.titleCard = null;
    this.skipPrompt = null;
    this.initDOM();
  }

  initDOM() {
    let existing = document.getElementById('pc-cinematic-container');
    if (existing) {
      this.container = existing;
      return;
    }

    const root = document.createElement('div');
    root.id = 'pc-cinematic-container';
    root.className = 'cinematic-overlay hidden';
    root.innerHTML = `
      <div class="cinematic-letterbox top-bar"></div>
      <div class="cinematic-letterbox bottom-bar"></div>

      <!-- Chapter / Location Title Card -->
      <div class="cinematic-title-card hidden" id="cin-title-card">
        <div class="cin-chapter-num" id="cin-chapter-num">CHAPTER I</div>
        <h1 class="cin-chapter-title" id="cin-chapter-title">THE MISSING TRAIL</h1>
        <div class="cin-tamil-title" id="cin-tamil-title">மறைந்த தடம்</div>
      </div>

      <!-- Bilingual Subtitle Panel -->
      <div class="cinematic-subtitle-box hidden" id="cin-subtitle-box">
        <div class="cin-speaker" id="cin-speaker">Arun</div>
        <div class="cin-text-tamil" id="cin-text-tamil">...</div>
        <div class="cin-text-english" id="cin-text-english">...</div>
      </div>

      <!-- Skip Prompt Indicator -->
      <div class="cinematic-skip-prompt hidden" id="cin-skip-prompt">
        <span>Press <kbd>ESC</kbd> to Skip</span>
      </div>
    `;

    document.body.appendChild(root);
    this.container = root;
    this.topBar = root.querySelector('.top-bar');
    this.bottomBar = root.querySelector('.bottom-bar');
    this.subtitleBox = document.getElementById('cin-subtitle-box');
    this.titleCard = document.getElementById('cin-title-card');
    this.skipPrompt = document.getElementById('cin-skip-prompt');
  }

  showLetterbox() {
    this.container.classList.remove('hidden');
    this.container.classList.add('letterbox-active');
    this.skipPrompt.classList.remove('hidden');
  }

  hideLetterbox() {
    this.container.classList.remove('letterbox-active');
    this.skipPrompt.classList.add('hidden');
    this.hideSubtitle();
    this.hideTitleCard();
    setTimeout(() => {
      if (!this.container.classList.contains('letterbox-active')) {
        this.container.classList.add('hidden');
      }
    }, 400);
  }

  showSubtitle({ speaker, tamilText, englishText }) {
    if (!this.subtitleBox) return;
    document.getElementById('cin-speaker').textContent = speaker || '';
    document.getElementById('cin-text-tamil').textContent = tamilText || '';
    document.getElementById('cin-text-english').textContent = englishText || '';
    this.subtitleBox.classList.remove('hidden');
  }

  hideSubtitle() {
    if (this.subtitleBox) {
      this.subtitleBox.classList.add('hidden');
    }
  }

  showTitleCard({ number, title, tamilTitle }, duration = 3.5) {
    if (!this.titleCard) return;
    document.getElementById('cin-chapter-num').textContent = number || '';
    document.getElementById('cin-chapter-title').textContent = title || '';
    document.getElementById('cin-tamil-title').textContent = tamilTitle || '';
    this.titleCard.classList.remove('hidden');

    if (duration > 0) {
      setTimeout(() => {
        this.hideTitleCard();
      }, duration * 1000);
    }
  }

  hideTitleCard() {
    if (this.titleCard) {
      this.titleCard.classList.add('hidden');
    }
  }
}

window.CinematicUI = CinematicUI;
