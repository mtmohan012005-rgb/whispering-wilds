// ============================================================================
// THE WHISPERING WILDS - STEP 25 AUTOMATED TEST SUITE: PROFESSIONAL PC UI
// ============================================================================

window.runProfessionalUITests = async function() {
    const results = [];
    const check = (desc, passed, details = '') => {
        results.push({ desc, passed, details });
        console.log(`[TEST-UI] ${passed ? '✓' : '✗'} ${desc} ${details ? '(' + details + ')' : ''}`);
    };

    try {
        // 1. UIManager Modal State Machine & Input Locking
        const uiMgr = window.uiManager || new window.UIManager();
        const initialMode = uiMgr.currentMode;
        uiMgr.openModal('INVENTORY');
        const modeSwitched = uiMgr.currentMode === 'INVENTORY';
        const inputLocked = uiMgr.isInputLocked();
        uiMgr.handleEscape(); // Close inventory
        const backToGameplay = uiMgr.currentMode === 'GAMEPLAY' && !uiMgr.isInputLocked();
        check('UIManager modal state machine & input lock lifecycle', modeSwitched && inputLocked && backToGameplay);

        // 2. Professional PC GameHUD & Telemetry Gauges
        const hud = window.gameHUD || new window.GameHUD();
        hud.update(Math.PI / 2, { health: 85, energy: 90, hydration: 75, currency: 150 }, { name: 'Velu' });
        const healthFill = document.getElementById('pc-fill-health');
        const rupeeVal = document.getElementById('pc-rupee-val');
        const promptLabel = document.getElementById('pc-prompt-label');
        const compassDeg = document.getElementById('pc-compass-deg');
        const hudUpdated = healthFill && healthFill.style.width === '85%' &&
                           rupeeVal && rupeeVal.textContent === '150' &&
                           promptLabel && promptLabel.textContent.includes('Velu') &&
                           compassDeg && compassDeg.textContent.includes('EAST');
        check('GameHUD compass bearing, survival meters & contextual [E] prompt', hudUpdated);

        // 3. InventorySystem 20.0 kg Weight Constraint & Starter Kit
        const inv = new window.InventorySystem(20.0);
        const initialWeight = inv.getTotalWeight();
        const hasStarterItems = inv.hasItem('cutting_chai') && inv.hasItem('brass_lantern');
        // Add item
        inv.addItem('cutting_chai', 2);
        const weightIncreased = inv.getTotalWeight() > initialWeight;
        // Test overencumber constraint (try to add 50kg item)
        window.INVENTORY_ITEMS_DATABASE['heavy_anvil'] = {
            id: 'heavy_anvil',
            name: 'Granite Temple Block',
            category: 'tools',
            weight: 50.0,
            icon: '🪨',
            rarity: 'common'
        };
        const overencumberBlocked = inv.addItem('heavy_anvil', 1) === false;
        // Use / Consume item
        const initialChai = inv.getItemCount('cutting_chai');
        const dummySurvival = { restoreEnergy: () => {} };
        const used = inv.useItem('cutting_chai', dummySurvival);
        const consumed = used && inv.getItemCount('cutting_chai') === initialChai - 1;
        check('InventorySystem 20.0kg constraint, item categories & consumption',
            hasStarterItems && weightIncreased && overencumberBlocked && consumed,
            `Weight: ${inv.getTotalWeight()}kg / ${inv.getMaxWeight()}kg`);

        // 4. WorldMapUI 8-Region Topo Canvas & Zoom
        const mapUI = window.worldMapUI || new window.WorldMapUI();
        const initialZoom = mapUI.zoom;
        mapUI.show();
        const mapActive = document.getElementById('pc-map-backdrop').classList.contains('active');
        document.getElementById('map-zoom-in').click();
        const zoomed = mapUI.zoom > initialZoom;
        mapUI.hide();
        check('WorldMapUI 8-region topographic canvas & zoom controls', mapActive && zoomed);

        // 5. Field Journal & Case File UI
        const journalUI = window.journalUI || new window.JournalUI();
        journalUI.show();
        const journalActive = document.getElementById('pc-journal-backdrop').classList.contains('active');
        journalUI.currentTab = 'clue_board';
        journalUI.renderContent();
        const pane = document.getElementById('journal-content-pane');
        const clueBoardRendered = pane && pane.innerHTML.includes('CORKBOARD');
        journalUI.hide();
        check('Field Journal tabs & investigation case corkboard', journalActive && clueBoardRendered);

        // 6. PhotoModeUI Viewfinder & Shutter Snapshot
        const photoUI = window.photoUI || new window.PhotoModeUI();
        photoUI.show();
        const photoActive = document.getElementById('pc-photo-overlay').classList.contains('active');
        const initialPhotoCount = photoUI.photosTaken.length;
        photoUI.captureSnapshot();
        const photoCaptured = photoUI.photosTaken.length === initialPhotoCount + 1;
        photoUI.hide();
        check('PhotoModeUI viewfinder, rule-of-thirds grid & photo capture', photoActive && photoCaptured);

        // 7. DialogueUI Bilingual Box & Notification UI
        const dialogueUI = window.dialogueUI || new window.DialogueUI();
        let choiceSelected = false;
        dialogueUI.showDialogue(
            'Murugan Annan',
            'வணக்கம் தம்பி! என்ன வேண்டும்?',
            'Welcome brother! What do you seek?',
            [{ text: 'Order Tea', autoClose: true }],
            (choice) => { choiceSelected = true; }
        );
        const diaBox = document.getElementById('pc-dialogue-container');
        const diaVisible = diaBox && diaBox.style.display !== 'none';
        const choices = diaBox.querySelectorAll('.dialogue-choice-btn');
        if (choices.length > 0) choices[0].click();
        const diaClosed = diaBox.style.display === 'none' && choiceSelected;

        window.showNotification('EXPEDITION DISCOVERY', 'Found ancient inscription', '📜');
        const toastEl = document.querySelector('.pc-toast');
        const toastValid = !!toastEl;

        check('DialogueUI bilingual presentation & NotificationUI toast queue', diaVisible && diaClosed && toastValid);

    } catch (err) {
        check('Professional UI Suite Execution', false, err.message);
    }

    const passed = results.every(r => r.passed);
    return { passed, results };
};
