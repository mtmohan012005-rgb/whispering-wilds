// ============================================================================
// THE WHISPERING WILDS - SATCHEL & INVENTORY UI
// ============================================================================

class InventoryUI {
    constructor() {
        this.backdrop = null;
        this.currentCategory = 'all';
        this.selectedItemId = null;
        this.initDOM();
    }

    initDOM() {
        this.backdrop = document.createElement('div');
        this.backdrop.id = 'pc-inventory-backdrop';
        this.backdrop.className = 'pc-modal-backdrop';

        this.backdrop.innerHTML = `
            <div class="pc-modal-window pc-inventory-layout">
                <!-- LEFT COLUMN: GRID & TABS -->
                <div class="pc-inventory-left">
                    <div class="inventory-tabs">
                        <button class="inv-tab active" data-cat="all">All Items</button>
                        <button class="inv-tab" data-cat="provisions">Provisions</button>
                        <button class="inv-tab" data-cat="tools">Tools</button>
                        <button class="inv-tab" data-cat="curios">Curios</button>
                        <button class="inv-tab" data-cat="documents">Documents</button>
                    </div>

                    <div class="inv-grid" id="inv-grid-slots">
                        <!-- Populated dynamically -->
                    </div>

                    <div class="pc-weight-bar-box">
                        <div class="weight-header">
                            <span>Satchel Weight</span>
                            <span id="inv-weight-label">0.0 / 20.0 kg</span>
                        </div>
                        <div class="weight-track">
                            <div class="weight-fill" id="inv-weight-fill" style="width: 0%;"></div>
                        </div>
                    </div>
                </div>

                <!-- RIGHT COLUMN: ITEM DETAILS -->
                <div class="pc-inventory-right" id="inv-detail-panel">
                    <div class="inv-detail-header">
                        <div class="inv-detail-category" id="inv-item-cat">Select an item</div>
                        <div class="inv-detail-name" id="inv-item-name">—</div>
                        <div class="inv-detail-desc" id="inv-item-desc">Click on any item in your satchel to examine details, consume provisions, or check provenance.</div>
                    </div>

                    <div class="inv-actions">
                        <button class="inv-action-btn" id="inv-btn-use" style="display:none;">Use Item</button>
                        <button class="inv-action-btn" id="inv-btn-close">Close <kbd>Esc</kbd></button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.backdrop);
        this.bindEvents();
    }

    bindEvents() {
        const tabs = this.backdrop.querySelectorAll('.inv-tab');
        tabs.forEach(btn => {
            btn.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.getAttribute('data-cat');
                this.renderGrid();
            };
        });

        document.getElementById('inv-btn-close').onclick = () => {
            if (window.uiManager) window.uiManager.closeModal('INVENTORY');
        };

        document.getElementById('inv-btn-use').onclick = () => {
            if (this.selectedItemId && window.inventorySystem) {
                const used = window.inventorySystem.useItem(this.selectedItemId);
                if (used) {
                    if (window.quests && window.quests.showQuestNotification) {
                        window.quests.showQuestNotification(`Consumed ${this.selectedItemId.replace('_', ' ')}!`);
                    }
                    this.renderGrid();
                    this.selectItem(this.selectedItemId);
                }
            }
        };
    }

    show() {
        if (this.backdrop) {
            this.backdrop.classList.add('active');
            this.renderGrid();
        }
    }

    hide() {
        if (this.backdrop) this.backdrop.classList.remove('active');
    }

    renderGrid() {
        const grid = document.getElementById('inv-grid-slots');
        if (!grid || !window.inventorySystem) return;

        grid.innerHTML = '';
        const items = window.inventorySystem.getItemsByCategory(this.currentCategory);

        items.forEach(entry => {
            const slot = document.createElement('div');
            slot.className = `inv-slot ${this.selectedItemId === entry.item.id ? 'selected' : ''}`;
            slot.innerHTML = `
                <div class="inv-slot-icon">${entry.item.icon}</div>
                <div class="inv-slot-qty">${entry.quantity}</div>
            `;
            slot.onclick = () => this.selectItem(entry.item.id);
            grid.appendChild(slot);
        });

        // Fill remaining slots up to 15 slots for empty grid look
        const emptyCount = Math.max(0, 15 - items.length);
        for (let i = 0; i < emptyCount; i++) {
            const empty = document.createElement('div');
            empty.className = 'inv-slot';
            empty.style.opacity = '0.3';
            grid.appendChild(empty);
        }

        // Update weight bar
        const totalW = window.inventorySystem.getTotalWeight();
        const maxW = window.inventorySystem.getMaxWeight();
        const pct = Math.min(100, (totalW / maxW) * 100);

        const fill = document.getElementById('inv-weight-fill');
        const lbl = document.getElementById('inv-weight-label');
        if (fill) {
            fill.style.width = `${pct}%`;
            if (window.inventorySystem.isOverencumbered()) {
                fill.classList.add('overload');
            } else {
                fill.classList.remove('overload');
            }
        }
        if (lbl) {
            lbl.textContent = `${totalW.toFixed(1)} / ${maxW.toFixed(1)} kg`;
        }
    }

    selectItem(itemId) {
        this.selectedItemId = itemId;
        const db = window.INVENTORY_ITEMS_DATABASE;
        const item = db ? db[itemId] : null;

        const catEl = document.getElementById('inv-item-cat');
        const nameEl = document.getElementById('inv-item-name');
        const descEl = document.getElementById('inv-item-desc');
        const useBtn = document.getElementById('inv-btn-use');

        if (item) {
            if (catEl) catEl.textContent = `${item.category.toUpperCase()} • ${item.weight} KG • ${item.rarity.toUpperCase()}`;
            if (nameEl) nameEl.textContent = item.name;
            if (descEl) descEl.textContent = item.desc;
            if (useBtn) {
                if (typeof item.use === 'function') {
                    useBtn.style.display = 'block';
                    useBtn.textContent = `Consume (${item.name})`;
                } else {
                    useBtn.style.display = 'none';
                }
            }
        }

        // Highlight selected slot
        const grid = document.getElementById('inv-grid-slots');
        if (grid) {
            const slots = grid.querySelectorAll('.inv-slot');
            slots.forEach(s => s.classList.remove('selected'));
        }
    }
}

window.InventoryUI = InventoryUI;
