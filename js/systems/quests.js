// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - QUEST & NARRATIVE PROGRESSION SYSTEM
// Main Heist Storyline, Cultural Side-Missions & Non-Combat Environmental Puzzles
// ============================================================================

class QuestManager {
  constructor() {
    this.quests = [
      {
        id: 'main_prologue',
        title: 'Prologue: The Shadow of George Town (மதராஸ் மர்மம்)',
        description: 'A shadowy rider on a vintage Royal Enfield 350 snatched critical pages of your inherited blueprint outside the Madras High Court during a sudden downpour.',
        status: 'active', // active, completed
        reward: 'Tread Evidence & Murugan’s Map Clue',
        objectives: [
          { id: 'inspect_heist', text: 'Inspect the High Court gates crime scene', done: true },
          { id: 'follow_tracks', text: 'Follow the muddy Enfield tyre skids along the red-clay road', done: false },
          { id: 'talk_murugan', text: 'Question Murugan Annan at his roadside Tea Kadai', done: false }
        ]
      },
      {
        id: 'side_bull',
        title: 'Side Quest: Farmer Selvam’s Escaped Champion (காணாமல் போன காளை)',
        description: 'Farmer Selvam lost his prized Kangayam bull when morning thunder startled the herd into the palmyra groves.',
        status: 'active',
        reward: '₹50 Rupees & Ancient Chola Sluice Seal',
        objectives: [
          { id: 'find_bull', text: 'Locate the Kangayam bull near the red-soil grove', done: false },
          { id: 'photo_bull', text: 'Photograph the bull with your Explorer Camera [F]', done: false },
          { id: 'report_selvam', text: 'Show the photograph to Farmer Selvam', done: false }
        ]
      },
      {
        id: 'main_delta',
        title: 'Chapter 1: Secrets of the Pichavaram Tide (பிச்சாவரம் அலைகள்)',
        description: 'Tidal mangrove channels block access to the Western Ghats. Ancient Chola hydraulic engineering can regulate the floodgates.',
        status: 'locked',
        reward: 'Passage to Western Ghats & Highland Poncho',
        objectives: [
          { id: 'reach_mangroves', text: 'Travel east to the Pichavaram canoe jetty', done: false },
          { id: 'solve_waterwheel', text: 'Inspect and align the Chola stone hydro-mechanism', done: false }
        ]
      },
      {
        id: 'main_ghats',
        title: 'Chapter 2: The Whispering Eco-Sanctuary (பசுமைத் தடம்)',
        description: 'Ascend the misty tea slopes of the Nilgiris and unlock the ancient underground biosphere before the syndicate arrives.',
        status: 'locked',
        reward: 'Preservation of Tamil Nadu’s Ancient Eco-Sanctuary',
        objectives: [
          { id: 'reach_ghats', text: 'Enter the misty Nilgiri mountain pass', done: false },
          { id: 'survive_cold', text: 'Warm up near a campfire or outpost fireplace', done: false },
          { id: 'photo_tahr', text: 'Capture evidence of the endangered Nilgiri Tahr', done: false },
          { id: 'unlock_portal', text: 'Open the ancient subterranean sanctuary portal', done: false }
        ]
      }
    ];
  }

  completeObjective(questId, objId, audio) {
    const quest = this.quests.find(q => q.id === questId);
    if (!quest) return;

    const obj = quest.objectives.find(o => o.id === objId);
    if (obj && !obj.done) {
      obj.done = true;
      if (audio) audio.playDiscoveryJingle();
      this.showQuestNotification(`Objective Complete: ${obj.text}`);

      // Check if all objectives in quest are done
      if (quest.objectives.every(o => o.done)) {
        quest.status = 'completed';
        this.showQuestNotification(`Quest Complete: ${quest.title}!`);

        // Unlock subsequent quests
        if (questId === 'main_prologue') {
          const deltaQuest = this.quests.find(q => q.id === 'main_delta');
          if (deltaQuest) deltaQuest.status = 'active';
        } else if (questId === 'main_delta') {
          const ghatsQuest = this.quests.find(q => q.id === 'main_ghats');
          if (ghatsQuest) ghatsQuest.status = 'active';
        }
      }
    }
  }

  showQuestNotification(msg) {
    const notif = document.getElementById('quest-toast');
    if (notif) {
      notif.textContent = msg;
      notif.classList.remove('hidden');
      notif.classList.add('slide-in');
      setTimeout(() => {
        notif.classList.remove('slide-in');
        notif.classList.add('hidden');
      }, 3500);
    }
  }
}

window.QuestManager = QuestManager;
