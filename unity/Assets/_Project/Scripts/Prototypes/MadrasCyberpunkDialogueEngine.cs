using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Prototypes
{
    [System.Serializable]
    public struct CyberpunkDialogueChoice
    {
        public string choiceTextEn;
        public string choiceTextTa;
        public string targetNodeId;
        public string requiredSkill; // e.g. "TechSavvy", "StreetCred"
        public int difficultyCheck;
    }

    [System.Serializable]
    public class CyberpunkDialogueNode
    {
        public string nodeId;
        public string speakerName;
        public string dialogueEn;
        public string dialogueTa;
        public List<CyberpunkDialogueChoice> choices = new List<CyberpunkDialogueChoice>();
    }

    /// <summary>
    /// Tactical Prototype 2: Madras Cyberpunk Noir.
    /// Narrative detective dialogue state machine featuring bilingual branching paths,
    /// tech-hacking skill checks, Street Cred reputation, and neon Chennai syndicate intrigue.
    /// </summary>
    public class MadrasCyberpunkDialogueEngine : MonoBehaviour
    {
        [Header("Detective Player Stats")]
        public int techSavvy = 5;
        public int streetCred = 4;
        public int decryptedDataCaches = 0;

        [Header("Dialogue Registry")]
        public Dictionary<string, CyberpunkDialogueNode> dialogueGraph = new Dictionary<string, CyberpunkDialogueNode>();
        public CyberpunkDialogueNode currentNode;

        public event Action<CyberpunkDialogueNode> OnNodeLoaded;
        public event Action<bool, string> OnSkillCheckResult;

        private void Awake()
        {
            InitializeSampleNoirCase();
        }

        public void InitializeSampleNoirCase()
        {
            dialogueGraph.Clear();

            var startNode = new CyberpunkDialogueNode
            {
                nodeId = "case_intro",
                speakerName = "Informant Murugan 2.0",
                dialogueEn = "Neon rains drowning Mount Road tonight, detective. You want the decrypt key?",
                dialogueTa = "இன்றிரவு மவுண்ட் ரோடில் நியான் மழை பொழிகிறது, துப்பறிவாளரே. மறைகுறியாக்க விசை வேண்டுமா?"
            };

            startNode.choices.Add(new CyberpunkDialogueChoice
            {
                choiceTextEn = "[Hack] Bypass his cyber-deck security layer.",
                choiceTextTa = "[ஹேக்] அவரது சைபர்-டெக் பாதுகாப்பைத் தவிர்க்கவும்.",
                targetNodeId = "hack_success",
                requiredSkill = "TechSavvy",
                difficultyCheck = 4
            });

            startNode.choices.Add(new CyberpunkDialogueChoice
            {
                choiceTextEn = "[Street Cred] Remind him of your favors in North Madras.",
                choiceTextTa = "[மரியாதை] வட சென்னையில் நீங்கள் செய்த உதவிகளை நினைவூட்டுங்கள்.",
                targetNodeId = "cred_success",
                requiredSkill = "StreetCred",
                difficultyCheck = 3
            });

            dialogueGraph["case_intro"] = startNode;
            currentNode = startNode;
        }

        /// <summary>
        /// Selects a dialogue option and performs skill check evaluation.
        /// </summary>
        public bool SelectChoice(int choiceIndex, out string nextNodeId)
        {
            nextNodeId = null;
            if (currentNode == null || choiceIndex < 0 || choiceIndex >= currentNode.choices.Count)
            {
                return false;
            }

            var choice = currentNode.choices[choiceIndex];
            bool checkPassed = true;

            if (!string.IsNullOrEmpty(choice.requiredSkill))
            {
                int playerSkill = choice.requiredSkill == "TechSavvy" ? techSavvy : streetCred;
                checkPassed = playerSkill >= choice.difficultyCheck;
                OnSkillCheckResult?.Invoke(checkPassed, choice.requiredSkill);
            }

            if (checkPassed)
            {
                nextNodeId = choice.targetNodeId;
                if (dialogueGraph.ContainsKey(nextNodeId))
                {
                    currentNode = dialogueGraph[nextNodeId];
                    OnNodeLoaded?.Invoke(currentNode);
                }
                return true;
            }

            return false;
        }
    }
}
