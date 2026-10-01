using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.NPC;
using WhisperingWilds.Quests;
using WhisperingWilds.Localization;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Interactive dialogue interface for NPC conversations with Tamil and English subtitles.
    /// </summary>
    public class DialogueUI : MonoBehaviour
    {
        public static DialogueUI Instance { get; private set; }

        [Header("UI Panels")]
        [SerializeField] private GameObject dialoguePanelRoot;
        [SerializeField] private Text speakerNameText;
        [SerializeField] private Text speechTextEn;
        [SerializeField] private Text speechTextTa;

        [Header("Choice Container")]
        [SerializeField] private Transform choicesContainer;
        [SerializeField] private GameObject choiceButtonPrefab;

        private NPCCharacter activeNPC;
        private DialogueNode activeNode;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            if (dialoguePanelRoot != null) dialoguePanelRoot.SetActive(false);

            // Listen to any NPC in the scene
            var npcs = FindObjectsByType<NPCCharacter>();
            foreach (var npc in npcs)
            {
                npc.OnDialogueStarted += OpenDialogue;
            }
        }

        public void OpenDialogue(NPCCharacter npc, DialogueNode startNode)
        {
            activeNPC = npc;
            activeNode = startNode;

            if (dialoguePanelRoot != null) dialoguePanelRoot.SetActive(true);
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;

            DisplayNode(activeNode);
        }

        public void CloseDialogue()
        {
            if (dialoguePanelRoot != null) dialoguePanelRoot.SetActive(false);
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
            activeNPC = null;
            activeNode = null;
        }

        private void DisplayNode(DialogueNode node)
        {
            if (node == null)
            {
                CloseDialogue();
                return;
            }

            // Tamil is shown only in Tamil mode; the English line is always present so the
            // conversation stays readable in both languages.
            bool tamil = LocalizationManager.Instance != null
                         && LocalizationManager.Instance.CurrentLanguage == Language.Tamil;

            if (speechTextEn != null)
            {
                LocalizedFontProvider.Apply(speechTextEn);
                speechTextEn.text = node.speakerTextEn;
                speechTextEn.gameObject.SetActive(!tamil);
            }
            if (speechTextTa != null)
            {
                LocalizedFontProvider.Apply(speechTextTa);
                speechTextTa.text = node.speakerTextTa;
                speechTextTa.gameObject.SetActive(tamil);
            }
            if (speakerNameText != null) LocalizedFontProvider.Apply(speakerNameText);

            // Clear old buttons
            if (choicesContainer != null)
            {
                foreach (Transform child in choicesContainer)
                {
                    Destroy(child.gameObject);
                }

                // If no choices, show a default "Continue / Close" button
                if (node.choices == null || node.choices.Count == 0)
                {
                    CreateChoiceButton("Continue (தொடரவும்)", () => CloseDialogue());
                }
                else
                {
                    foreach (var choice in node.choices)
                    {
                        var capturedChoice = choice;
                        string label = $"{capturedChoice.choiceTextTa}\n{capturedChoice.choiceTextEn}";
                        CreateChoiceButton(label, () => SelectChoice(capturedChoice));
                    }
                }
            }
        }

        private void CreateChoiceButton(string text, Action onClick)
        {
            if (choicesContainer == null) return;

            GameObject btnObj;
            if (choiceButtonPrefab != null)
            {
                btnObj = Instantiate(choiceButtonPrefab, choicesContainer);
            }
            else
            {
                // Fallback runtime UI button
                btnObj = new GameObject("ChoiceButton", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button));
                btnObj.transform.SetParent(choicesContainer, false);
                var btnImg = btnObj.GetComponent<Image>();
                btnImg.color = new Color(0.15f, 0.2f, 0.25f, 0.9f);

                var txtObj = new GameObject("Text", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
                txtObj.transform.SetParent(btnObj.transform, false);
                var txt = txtObj.GetComponent<Text>();
                txt.text = text;
                txt.color = Color.white;
                txt.alignment = TextAnchor.MiddleCenter;
                // Tamil-capable font; the builtin font renders Tamil as blank boxes.
                txt.font = LocalizedFontProvider.Font;
                var txtRect = txtObj.GetComponent<RectTransform>();
                txtRect.anchorMin = Vector2.zero;
                txtRect.anchorMax = Vector2.one;
                txtRect.sizeDelta = Vector2.zero;
            }

            var btn = btnObj.GetComponent<Button>();
            if (btn != null)
            {
                btn.onClick.AddListener(() => onClick?.Invoke());
            }
        }

        private void SelectChoice(DialogueChoice choice)
        {
            if (activeNPC != null && !string.IsNullOrEmpty(choice.questTriggerId))
            {
                // Trigger quest advancement
                if (QuestManager.Instance != null)
                {
                    QuestManager.Instance.AdvanceObjective(choice.questTriggerId, "talk_npc");
                }
            }

            if (choice.nextNodeIndex < 0)
            {
                CloseDialogue();
            }
            else
            {
                // Advance to next node
                CloseDialogue(); // or load next node if mapped
            }
        }
    }
}
