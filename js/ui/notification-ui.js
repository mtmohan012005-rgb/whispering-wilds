// ============================================================================
// THE WHISPERING WILDS - DIEGETIC TOAST NOTIFICATION UI
// ============================================================================

class NotificationUI {
    constructor() {
        this.container = null;
        this.initDOM();
    }

    initDOM() {
        this.container = document.createElement('div');
        this.container.id = 'pc-toast-container';
        this.container.className = 'pc-toast-container';
        document.body.appendChild(this.container);
    }

    show(title, message = '', icon = '🧭', durationMs = 4000) {
        if (!this.container) return;

        const toast = document.createElement('div');
        toast.className = 'pc-toast';
        toast.innerHTML = `
            <span style="font-size: 20px;">${icon}</span>
            <div style="display: flex; flex-direction: column;">
                <span style="font-size: 13px; font-weight: 700; color: #ffd700;">${title}</span>
                ${message ? `<span style="font-size: 12px; color: #cbd5e1;">${message}</span>` : ''}
            </div>
        `;

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => toast.remove(), 300);
        }, durationMs);
    }
}

window.NotificationUI = NotificationUI;
window.showNotification = function(title, message, icon) {
    if (!window.notificationUI) {
        window.notificationUI = new NotificationUI();
    }
    window.notificationUI.show(title, message, icon);
};
