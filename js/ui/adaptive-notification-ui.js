/**
 * The Whispering Wilds - Adaptive Notification UI
 * Subdued, non-intrusive toast notifying players when automatic graphics adaptation occurs.
 */
(function(root) {
  'use strict';

  class AdaptiveNotificationUI {
    constructor() {
      this.toastEl = null;
      this.timer = null;
      this.initDOM();
    }

    initDOM() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('adaptive-notification-toast')) {
        this.toastEl = document.getElementById('adaptive-notification-toast');
        return;
      }

      this.toastEl = document.createElement('div');
      this.toastEl.id = 'adaptive-notification-toast';
      this.toastEl.className = 'adaptive-toast hidden';
      this.toastEl.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: rgba(20, 35, 25, 0.92);
        border-left: 4px solid #81c784;
        color: #e8f5e9;
        padding: 12px 20px;
        border-radius: 4px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 0.9rem;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        z-index: 9999;
        transition: opacity 0.3s ease, transform 0.3s ease;
        opacity: 0;
        pointer-events: none;
        transform: translateY(10px);
      `;

      document.body.appendChild(this.toastEl);
    }

    show(message = 'Graphics quality adjusted for smoother performance.') {
      if (!this.toastEl) this.initDOM();
      if (!this.toastEl) return;

      this.toastEl.textContent = message;
      this.toastEl.classList.remove('hidden');
      this.toastEl.style.opacity = '1';
      this.toastEl.style.transform = 'translateY(0)';

      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.hide();
      }, 4000);
    }

    hide() {
      if (!this.toastEl) return;
      this.toastEl.style.opacity = '0';
      this.toastEl.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (this.toastEl) this.toastEl.classList.add('hidden');
      }, 350);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdaptiveNotificationUI;
  } else {
    root.AdaptiveNotificationUI = new AdaptiveNotificationUI();
  }
})(typeof window !== 'undefined' ? window : global);
