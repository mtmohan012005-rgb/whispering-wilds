using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Core;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;
using WhisperingWilds.NPC;
using WhisperingWilds.Quests;
using WhisperingWilds.Localization;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Interactive dialogue interface for NPC conversations with Tamil and English subtitles.
    ///
    /// Conversations are recorded in <see cref="NPCInteractionLog"/>, which is what lets a TalkToNPC
    /// objective be satisfied and restored after travel. The matching gameplay event is emitted by
    /// <c>NPCCharacter</c> once per interaction, so re-reading dialogue nodes cannot inflate
    /// objective progress.
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

        /// <summary>NPCs currently subscribed, so re-entering the scene cannot double-subscribe.</summary>
        private readonly HashSet<NPCCharacter> subscribedNPCs = new HashSet<NPCCharacter>();

        private bool wasConversationRecorded;
        private GameState stateBeforeDialogue = GameState.Gameplay;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void OnEnable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged += OnLanguageChanged;
            }

            UnityEngine.SceneManagement.SceneManager.sceneLoaded += OnSceneLoaded;
        }

        private void OnDisable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged -= OnLanguageChanged;
            }

            UnityEngine.SceneManagement.SceneManager.sceneLoaded -= OnSceneLoaded;

            UnsubscribeFromAllNPCs();
        }

        private void Start()
        {
            if (dialoguePanelRoot != null) dialoguePanelRoot.SetActive(false);
            SubscribeToSceneNPCs();
        }

        /// <summary>
        /// NPCs are scene objects, so a surviving DialogueUI must re-bind after every region load.
        /// </summary>
        private void OnSceneLoaded(UnityEngine.SceneManagement.Scene scene, UnityEngine.SceneManagement.LoadSceneMode mode)
        {
            SubscribeToSceneNPCs();
        }

        private void OnDestroy()
        {
            UnsubscribeFromAllNPCs();
            if (Instance == this) Instance = null;
        }

        /// <summary>
        /// Subscribes to NPCs currently present and refreshes on every scene load, since NPCs are
        /// scene objects and are destroyed when the player travels.
        /// </summary>
        private void SubscribeToSceneNPCs()
        {
            var npcs = FindObjectsByType<NPCCharacter>();
            foreach (var npc in npcs)
            {
                if (npc == null || subscribedNPCs.Contains(npc)) continue;
                npc.OnDialogueStarted += OpenDialogue;
                subscribedNPCs.Add(npc);
            }

            // Drop references to NPCs that a scene change destroyed.
            if (subscribedNPCs.Count > 0)
            {
                subscribedNPCs.RemoveWhere(npc => npc == null);
            }
        }

        private void UnsubscribeFromAllNPCs()
        {
            foreach (var npc in subscribedNPCs)
            {
                if (npc != null) npc.OnDialogueStarted -= OpenDialogue;
            }
            subscribedNPCs.Clear();
        }

        public void OpenDialogue(NPCCharacter npc, DialogueNode startNode)
        {
            if (npc == null || startNode == null) return;

            activeNPC = npc;
            activeNode = startNode;

            if (GameManager.Instance != null)
            {
                stateBeforeDialogue = GameManager.Instance.CurrentState;
                GameManager.Instance.SetGameState(GameState.Dialogue);
            }

            if (dialoguePanelRoot != null) dialoguePanelRoot.SetActive(true);

            DisplayNode(activeNode);
        }

        public void CloseDialogue()
        {
            if (dialoguePanelRoot != null) dialoguePanelRoot.SetActive(false);

            // Restore whatever state opened the dialogue rather than assuming Gameplay, so closing
            // dialogue from a pause menu returns to the pause menu.
            if (GameManager.Instance != null && GameManager.Instance.CurrentState == GameState.Dialogue)
            {
                GameManager.Instance.SetGameState(stateBeforeDialogue == GameState.Dialogue
                    ? GameState.Gameplay
                    : stateBeforeDialogue);
            }

            activeNPC = null;
            activeNode = null;
            wasConversationRecorded = false;
        }

        private void OnLanguageChanged(Language language)
        {
            // Re-render the visible node in place. An open conversation must not require closing
            // and reopening to pick up the language change.
            if (activeNode != null) DisplayNode(activeNode);
        }

        private void DisplayNode(DialogueNode node)
        {
            if (node == null)
            {
                CloseDialogue();
                return;
            }

            // Record the conversation once per session with this NPC, so objective progress and
            // durable NPC memory are both established from a real conversation.
            RecordConversationIfNeeded();

            bool tamil = LocalizationManager.Instance != null
                         && LocalizationManager.Instance.CurrentLanguage == Language.Tamil;

            if (speakerNameText != null)
            {
                LocalizedFontProvider.Apply(speakerNameText);
                speakerNameText.text = ResolveSpeakerName(tamil);
            }

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

            if (choicesContainer != null)
            {
                // Clear old buttons
                foreach (Transform child in choicesContainer)
                {
                    Destroy(child.gameObject);
                }

                bool renderedAny = false;

                if (node.choices != null)
                {
                    foreach (var choice in node.choices)
                    {
                        // A gated choice stays hidden until its prerequisite clue is discovered,
                        // so the player cannot take a branch they have not earned the evidence for.
                        if (!IsChoiceAvailable(choice)) continue;

                        var capturedChoice = choice;
                        string label = ResolveChoiceLabel(capturedChoice, tamil);
                        CreateChoiceButton(label, () => SelectChoice(capturedChoice));
                        renderedAny = true;
                    }
                }

                if (!renderedAny)
                {
                    // No choices, or every choice is still gated: fall back to a plain advance.
                    CreateChoiceButton(Localized("dialogue.continue", "Continue"), () => CloseDialogue());
                }
            }
        }

        /// <summary>
        /// A choice is available when it declares no prerequisite, or when the player has already
        /// discovered the clue it requires.
        /// </summary>
        private static bool IsChoiceAvailable(DialogueChoice choice)
        {
            if (choice == null) return false;
            if (string.IsNullOrEmpty(choice.requiredClueId)) return true;

            return Investigation.InvestigationManager.HasClueStatic(choice.requiredClueId);
        }

        private static string Localized(string key, string fallback)
        {
            var mgr = LocalizationManager.Instance;
            return mgr != null ? mgr.Get(key) : fallback;
        }

        private string ResolveSpeakerName(bool tamil)
        {
            if (activeNPC == null) return string.Empty;
            return tamil && !string.IsNullOrEmpty(activeNPC.DisplayNameTa)
                ? activeNPC.DisplayNameTa
                : activeNPC.DisplayNameEn;
        }

        private static string ResolveChoiceLabel(DialogueChoice choice, bool tamil)
        {
            if (choice == null) return string.Empty;
            if (tamil && !string.IsNullOrEmpty(choice.choiceTextTa)) return choice.choiceTextTa;
            return !string.IsNullOrEmpty(choice.choiceTextEn) ? choice.choiceTextEn : choice.choiceTextTa;
        }

        private void RecordConversationIfNeeded()
        {
            if (wasConversationRecorded || activeNPC == null) return;
            if (string.IsNullOrEmpty(activeNPC.NpcId)) return;

            wasConversationRecorded = true;

            // Durable record only. NPCCharacter.RegisterConversationWithPlayer owns the talk
            // event and fires it once per interaction; emitting it here as well would advance a
            // TalkToNPC objective twice for a single conversation.
            NPCInteractionLog.Record(activeNPC.NpcId);
        }

        private void CreateChoiceButton(string text, Action onClick)
        {
            if (choicesContainer == null) return;

            GameObject btnObj;
            if (choiceButtonPrefab != null)
            {
                btnObj = Instantiate(choiceButtonPrefab, choicesContainer);
                var prefabLabel = btnObj.GetComponentInChildren<Text>(true);
                if (prefabLabel != null)
                {
                    LocalizedFontProvider.Apply(prefabLabel);
                    prefabLabel.text = text;
                }
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

        /// <summary>
        /// Applies a dialogue choice. A choice's revealClueId names a clue to reveal, which is how
        /// the opening hands the player their first evidence. Objective progression itself is never
        /// advanced directly from here; it only happens through real gameplay events.
        /// </summary>
        private void SelectChoice(DialogueChoice choice)
        {
            if (choice == null) return;

            // Re-check the gate here as well as at render time: a stale button could otherwise be
            // clicked after the conversation moved on.
            if (!IsChoiceAvailable(choice)) return;

            string revealId = !string.IsNullOrEmpty(choice.revealClueId)
                ? choice.revealClueId
                : choice.questTriggerId;

            if (!string.IsNullOrEmpty(revealId))
            {
                var clue = GameDataCatalog.GetClue(revealId);
                if (clue != null && Investigation.InvestigationManager.Instance != null)
                {
                    Investigation.InvestigationManager.Instance.DiscoverClue(clue);
                }
                else
                {
                    Debug.LogWarning($"[Dialogue] Choice references unknown clue '{revealId}'; nothing was revealed.");
                }
            }

            if (choice.nextNodeIndex < 0)
            {
                CloseDialogue();
                return;
            }

            var nextNode = FindNode(choice.nextNodeIndex);
            if (nextNode == null)
            {
                // No node with that index exists; end the conversation rather than trapping the
                // player in a dialogue that cannot advance.
                CloseDialogue();
                return;
            }

            activeNode = nextNode;
            DisplayNode(nextNode);
        }

        private DialogueNode FindNode(int nodeIndex)
        {
            if (activeNPC == null) return null;
            var nodes = activeNPC.DialogueNodes;
            if (nodes == null) return null;

            for (int i = 0; i < nodes.Count; i++)
            {
                if (nodes[i] != null && nodes[i].nodeIndex == nodeIndex) return nodes[i];
            }
            return null;
        }
    }
}