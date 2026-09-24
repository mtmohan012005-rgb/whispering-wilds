// ============================================================================
// THE WHISPERING WILDS - LOADING DATA
// Authored loading screen tips + region artwork references.
// ============================================================================

(function () {
  'use strict';

  window.LOADING_DATA = {
    // -------------------------------------------------------------------------
    // Tips shown during loading screen (bilingual)
    // -------------------------------------------------------------------------
    tips: [
      { key: 'tip.rain_discovery',   ta: 'மழைக்குப் பிறகு சில இடங்களை கவனிக்க எளிதாக இருக்கும்.',          en: 'Some places are easier to notice after rain.' },
      { key: 'tip.water_sounds',     ta: 'நீர் அருகில் கவனமாக கேளுங்கள்.',                                     en: 'Listen carefully near water channels.' },
      { key: 'tip.npc_routine',      ta: 'ஊர்வாசிகளின் நடை-முறைகள் பகல் / இரவு மாறும்.',                      en: 'NPC routines change throughout the day.' },
      { key: 'tip.campfire_rest',    ta: 'நெருப்பு அருகில் இரவு ஓய்வெடுக்க சக்தி மீட்கும்.',                 en: 'Rest near a campfire to recover energy overnight.' },
      { key: 'tip.temperature',      ta: 'வெப்பநிலை நீங்கள் எவ்வளவு நேரம் தேட முடியும் என்பதை பாதிக்கிறது.', en: 'Regional temperature affects how long you can explore.' },
      { key: 'tip.side_quests',      ta: 'பக்க பணிகளை முடிக்க புதிய பகுதிகள் திறக்கும்.',                   en: 'Complete side quests to unlock new regions.' },
      { key: 'tip.journal_clues',    ta: 'தினசரி பதிவில் விசாரணை குறிப்புகள் உள்ளன.',                        en: 'Check your journal for investigation clues.' },
      { key: 'tip.photo_mode',       ta: 'புகைப்பட முறை தமிழகத்தின் உண்மையான வனவிலங்குகளை பதிவு செய்யும்.', en: 'Photo Mode captures authentic Tamil Nadu wildlife.' },
      { key: 'tip.kolam',            ta: 'திருவிழா காலைகளில் கோலம் வரிசைகள் தாழ்வாரத்தில் தோன்றும்.',        en: 'Kolam patterns appear fresh on festival mornings.' },
      { key: 'tip.traders',          ta: 'அறியா பகுதிக்கு செல்வதற்கு முன் வணிகரிடம் கேளுங்கள்.',            en: 'Ask local traders before entering unknown territory.' },
      { key: 'tip.transport',        ta: 'பேருந்து நிலையங்கள் விரைவான பயண புள்ளிகளாக செயல்படுகின்றன.',     en: 'Bus stands act as fast travel points once discovered.' },
      { key: 'tip.lantern',          ta: 'இரவு நேரத்தில் விளக்கு ஒளி தோலியியல் சேதத்தை தடுக்கும்.',         en: 'Using a lantern at night prevents hypothermia.' },
      { key: 'tip.chola_puzzles',    ta: 'சோழ கல்வெட்டுக்கள் பழைய வழிகளை வெளிப்படுத்தும்.',                 en: 'Chola inscriptions can reveal old pathways.' }
    ],

    // -------------------------------------------------------------------------
    // Region loading background art (paths to region artwork sprites / gradients)
    // These reference the asset registry at runtime — no hardcoded URLs.
    // -------------------------------------------------------------------------
    regionArt: {
      george_town:    { type: 'gradient', value: 'linear-gradient(160deg,#1a0a05,#3d1a0a)' },
      cauvery_delta:  { type: 'gradient', value: 'linear-gradient(160deg,#050f08,#0e2a18)' },
      pichavaram:     { type: 'gradient', value: 'linear-gradient(160deg,#050e0a,#091a14)' },
      chettinad:      { type: 'gradient', value: 'linear-gradient(160deg,#0f0a04,#2a1a08)' },
      thanjavur:      { type: 'gradient', value: 'linear-gradient(160deg,#0f0805,#2a160a)' },
      mamallapuram:   { type: 'gradient', value: 'linear-gradient(160deg,#050a12,#0a1a30)' },
      nilgiris:       { type: 'gradient', value: 'linear-gradient(160deg,#050a08,#0a1e14)' },
      final_sanctuary:{ type: 'gradient', value: 'linear-gradient(160deg,#030a06,#071a0e)' }
    }
  };

})();
