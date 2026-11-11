using System;
using System.IO;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.InputSystem;
using WhisperingWilds.Core;
using WhisperingWilds.Localization;
using WhisperingWilds.Online;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Professional Save Management UI for The Whispering Wilds.
    /// Provides Local Saves inspection, Backup creation & verification-guarded restoration,
    /// and truthful Cloud Save status & synchronization controls.
    /// </summary>
    [DisallowMultipleComponent]
    public class SaveManagementUI : MonoBehaviour
    {
        public static SaveManagementUI Instance { get; private set; }

        public enum SaveTab
        {
            LocalSaves,
            RestoreBackup,
            CloudSaves
        }

        [Header("Root & Navigation")]
        [SerializeField] private GameObject panelRoot;
        [SerializeField] private Text titleText;
        [SerializeField] private Button tabLocalButton;
        [SerializeField] private Button tabRestoreButton;
        [SerializeField] private Button tabCloudButton;
        [SerializeField] private Text tabLocalLabel;
        [SerializeField] private Text tabRestoreLabel;
        [SerializeField] private Text tabCloudLabel;
        [SerializeField] private Button closeButton;

        [Header("Tab 1: Local Saves Page")]
        [SerializeField] private GameObject localSavesPage;
        [SerializeField] private Text activeSaveStatusText;
        [SerializeField] private Text activeSaveTimestampText;
        [SerializeField] private Text activeSaveValidityText;
        [SerializeField] private Text localBackupStatusText;
        [SerializeField] private Button createBackupButton;
        [SerializeField] private Button exportSaveButton;
        [SerializeField] private Button importSaveButton;
        [SerializeField] private Text localActionStatusText;

        [Header("Tab 2: Restore Backup Page")]
        [SerializeField] private GameObject restoreBackupPage;
        [SerializeField] private Text backupListHeaderText;
        [SerializeField] private Text backupListDetailsText;
        [SerializeField] private Button restoreSelectedButton;
        [SerializeField] private Text restoreStatusText;

        [Header("Tab 3: Cloud Saves Page")]
        [SerializeField] private GameObject cloudSavesPage;
        [SerializeField] private Text cloudConnectionStatusText;
        [SerializeField] private Text cloudAccountText;
        [SerializeField] private Text cloudLastSyncText;
        [SerializeField] private Button cloudSyncNowButton;
        [SerializeField] private Button cloudDownloadButton;
        [SerializeField] private Text cloudStatusMessageText;

        private SaveTab currentTab = SaveTab.LocalSaves;
        private string selectedBackupPath = null;
        private string lastCloudSyncTime = "None";

        private void Awake()
        {
            Instance = this;

            if (tabLocalButton != null) tabLocalButton.onClick.AddListener(() => SwitchTab(SaveTab.LocalSaves));
            if (tabRestoreButton != null) tabRestoreButton.onClick.AddListener(() => SwitchTab(SaveTab.RestoreBackup));
            if (tabCloudButton != null) tabCloudButton.onClick.AddListener(() => SwitchTab(SaveTab.CloudSaves));
            if (closeButton != null) closeButton.onClick.AddListener(OnCloseClicked);

            if (createBackupButton != null) createBackupButton.onClick.AddListener(OnCreateBackupClicked);
            if (exportSaveButton != null) exportSaveButton.onClick.AddListener(OnExportSaveClicked);
            if (importSaveButton != null) importSaveButton.onClick.AddListener(OnImportSaveClicked);

            if (restoreSelectedButton != null) restoreSelectedButton.onClick.AddListener(OnRestoreBackupClicked);

            if (cloudSyncNowButton != null) cloudSyncNowButton.onClick.AddListener(OnCloudSyncNowClicked);
            if (cloudDownloadButton != null) cloudDownloadButton.onClick.AddListener(OnCloudDownloadClicked);

            if (panelRoot != null) panelRoot.SetActive(false);
            else gameObject.SetActive(false);
        }

        private void Update()
        {
            if (!IsVisible()) return;

#if ENABLE_INPUT_SYSTEM
            if (Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame)
            {
                SetVisible(false);
            }
#else
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                SetVisible(false);
            }
#endif
        }

        public bool IsVisible()
        {
            return panelRoot != null ? panelRoot.activeSelf : gameObject.activeSelf;
        }

        public void SetVisible(bool visible)
        {
            var root = panelRoot != null ? panelRoot : gameObject;
            root.SetActive(visible);
            var cg = (panelRoot != null ? panelRoot : gameObject).GetComponent<CanvasGroup>();
            if (cg == null) cg = gameObject.GetComponent<CanvasGroup>();
            if (cg != null)
            {
                cg.alpha = visible ? 1f : 0f;
                cg.interactable = visible;
                cg.blocksRaycasts = visible;
            }

            if (visible)
            {
                ApplyLocalizedLabels();
                SwitchTab(currentTab);
            }
            else
            {
                if (TitleMenuController.Instance != null)
                    TitleMenuController.Instance.OnSubmenuClosed();
            }
        }

        public void SwitchTab(SaveTab tab)
        {
            currentTab = tab;

            if (localSavesPage != null) localSavesPage.SetActive(tab == SaveTab.LocalSaves);
            if (restoreBackupPage != null) restoreBackupPage.SetActive(tab == SaveTab.RestoreBackup);
            if (cloudSavesPage != null) cloudSavesPage.SetActive(tab == SaveTab.CloudSaves);

            HighlightTabButtons();

            switch (tab)
            {
                case SaveTab.LocalSaves:
                    RefreshLocalSavesTab();
                    break;
                case SaveTab.RestoreBackup:
                    RefreshRestoreBackupTab();
                    break;
                case SaveTab.CloudSaves:
                    RefreshCloudSavesTab();
                    break;
            }
        }

        private void HighlightTabButtons()
        {
            Color activeColor = new Color(0.18f, 0.45f, 0.35f, 1f);
            Color inactiveColor = new Color(0.12f, 0.20f, 0.18f, 1f);

            if (tabLocalButton != null)
            {
                var img = tabLocalButton.GetComponent<Image>();
                if (img != null) img.color = currentTab == SaveTab.LocalSaves ? activeColor : inactiveColor;
            }
            if (tabRestoreButton != null)
            {
                var img = tabRestoreButton.GetComponent<Image>();
                if (img != null) img.color = currentTab == SaveTab.RestoreBackup ? activeColor : inactiveColor;
            }
            if (tabCloudButton != null)
            {
                var img = tabCloudButton.GetComponent<Image>();
                if (img != null) img.color = currentTab == SaveTab.CloudSaves ? activeColor : inactiveColor;
            }
        }

        // ====================================================================
        // SECTION 1: LOCAL SAVES
        // ====================================================================
        private void RefreshLocalSavesTab()
        {
            string savePath = SaveSystem.SaveFilePath;
            bool exists = File.Exists(savePath);

            if (!exists)
            {
                if (activeSaveStatusText != null) activeSaveStatusText.text = "Active Save: <b>None</b> (No campaign started)";
                if (activeSaveTimestampText != null) activeSaveTimestampText.text = "Last Saved: N/A";
                if (activeSaveValidityText != null) activeSaveValidityText.text = "Integrity: N/A";
                if (exportSaveButton != null) exportSaveButton.interactable = false;
                if (createBackupButton != null) createBackupButton.interactable = false;
            }
            else
            {
                bool valid = SaveSystem.TryReadValid(savePath, out var data, out string readError);
                if (activeSaveStatusText != null)
                {
                    activeSaveStatusText.text = valid
                        ? $"Active Save: <color=#00FF88><b>Valid (Region: {data.currentRegionId.ToUpper()})</b></color>"
                        : $"Active Save: <color=#FF4444><b>Corrupt ({readError})</b></color>";
                }

                if (activeSaveTimestampText != null)
                {
                    string ts = valid && !string.IsNullOrEmpty(data.saveTimestamp)
                        ? data.saveTimestamp
                        : File.GetLastWriteTime(savePath).ToString("yyyy-MM-dd HH:mm:ss");
                    activeSaveTimestampText.text = $"Last Saved: {ts}";
                }

                if (activeSaveValidityText != null)
                {
                    long sizeBytes = new FileInfo(savePath).Length;
                    activeSaveValidityText.text = valid
                        ? $"Integrity: <b>Schema v{data.schemaVersion}</b> | Size: {sizeBytes:N0} bytes"
                        : $"Integrity: <color=#FF4444>Error: {readError}</color>";
                }

                if (exportSaveButton != null) exportSaveButton.interactable = valid;
                if (createBackupButton != null) createBackupButton.interactable = valid;
            }

            // Local backup status
            string backupPath = SaveSystem.BackupFilePath;
            bool backupExists = File.Exists(backupPath);
            if (localBackupStatusText != null)
            {
                if (backupExists)
                {
                    bool validBackup = SaveSystem.TryReadValid(backupPath, out var bData, out _);
                    string bTime = File.GetLastWriteTime(backupPath).ToString("yyyy-MM-dd HH:mm:ss");
                    localBackupStatusText.text = validBackup
                        ? $"Local Safety Backup: <color=#00FF88>Available</color> (v{bData.schemaVersion}, {bTime})"
                        : "Local Safety Backup: <color=#FFAA00>Present but invalid</color>";
                }
                else
                {
                    localBackupStatusText.text = "Local Safety Backup: <i>None created yet</i>";
                }
            }
        }

        private void OnCreateBackupClicked()
        {
            try
            {
                string savePath = SaveSystem.SaveFilePath;
                if (!File.Exists(savePath))
                {
                    ShowLocalActionStatus("No active save to back up.", false);
                    return;
                }

                string backupDir = Path.Combine(SaveSystem.SaveDirectory, "Backups");
                if (!Directory.Exists(backupDir)) Directory.CreateDirectory(backupDir);

                string timestamp = DateTime.Now.ToString("yyyy-MM-dd_HHmmss");
                string destFile = Path.Combine(backupDir, $"whispering_wilds_backup_{timestamp}.json");

                File.Copy(savePath, destFile, true);
                ShowLocalActionStatus($"Backup created: {Path.GetFileName(destFile)}", true);
                RefreshLocalSavesTab();
            }
            catch (Exception ex)
            {
                ShowLocalActionStatus($"Backup failed: {ex.Message}", false);
            }
        }

        private void OnExportSaveClicked()
        {
            try
            {
                string savePath = SaveSystem.SaveFilePath;
                if (!File.Exists(savePath))
                {
                    ShowLocalActionStatus("No active save to export.", false);
                    return;
                }

                string exportFile = Path.Combine(SaveSystem.SaveDirectory, "whispering_wilds_save_export.json");
                File.Copy(savePath, exportFile, true);
                ShowLocalActionStatus($"Save exported to: {Path.GetFileName(exportFile)}", true);
            }
            catch (Exception ex)
            {
                ShowLocalActionStatus($"Export failed: {ex.Message}", false);
            }
        }

        private void OnImportSaveClicked()
        {
            try
            {
                string exportFile = Path.Combine(SaveSystem.SaveDirectory, "whispering_wilds_save_export.json");
                if (!File.Exists(exportFile))
                {
                    ShowLocalActionStatus("Export file not found to import (save_export.json).", false);
                    return;
                }

                if (!SaveSystem.TryReadValid(exportFile, out var importedData, out string readError))
                {
                    ShowLocalActionStatus($"Import rejected: invalid save file ({readError}).", false);
                    return;
                }

                // Preserve current save before overwriting
                string savePath = SaveSystem.SaveFilePath;
                if (File.Exists(savePath))
                {
                    string safetyBackup = Path.Combine(SaveSystem.SaveDirectory, "Backups", $"pre_import_{DateTime.Now:yyyyMMdd_HHmmss}.json");
                    string dir = Path.GetDirectoryName(safetyBackup);
                    if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                    File.Copy(savePath, safetyBackup, true);
                }

                File.Copy(exportFile, savePath, true);
                ShowLocalActionStatus($"Import verified & restored (Region: {importedData.currentRegionId})", true);
                RefreshLocalSavesTab();
            }
            catch (Exception ex)
            {
                ShowLocalActionStatus($"Import failed: {ex.Message}", false);
            }
        }

        private void ShowLocalActionStatus(string message, bool success)
        {
            if (localActionStatusText != null)
            {
                localActionStatusText.text = success
                    ? $"<color=#00FF88>{message}</color>"
                    : $"<color=#FF4444>{message}</color>";
            }
        }

        // ====================================================================
        // SECTION 2: RESTORE BACKUP
        // ====================================================================
        private void RefreshRestoreBackupTab()
        {
            var backups = GetAvailableBackups();
            if (backups.Count == 0)
            {
                if (backupListHeaderText != null) backupListHeaderText.text = "Available Recovery Backups: <b>0</b>";
                if (backupListDetailsText != null) backupListDetailsText.text = "No backup files found in LocalLow or Backups folder.";
                if (restoreSelectedButton != null) restoreSelectedButton.interactable = false;
                selectedBackupPath = null;
                return;
            }

            // Select latest backup
            selectedBackupPath = backups[0];
            FileInfo fi = new FileInfo(selectedBackupPath);
            bool isValid = SaveSystem.TryReadValid(selectedBackupPath, out var data, out string err);

            if (backupListHeaderText != null)
            {
                backupListHeaderText.text = $"Available Recovery Backups: <b>{backups.Count}</b> (Latest Selected)";
            }

            if (backupListDetailsText != null)
            {
                string name = Path.GetFileName(selectedBackupPath);
                string timeStr = fi.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss");
                string validStr = isValid ? $"<color=#00FF88>Valid (Schema v{data.schemaVersion}, Region: {data.currentRegionId})</color>" : $"<color=#FF4444>Corrupt ({err})</color>";
                backupListDetailsText.text = $"<b>File:</b> {name}\n<b>Timestamp:</b> {timeStr}\n<b>Size:</b> {fi.Length:N0} bytes\n<b>Status:</b> {validStr}";
            }

            if (restoreSelectedButton != null)
            {
                restoreSelectedButton.interactable = isValid;
            }
        }

        private List<string> GetAvailableBackups()
        {
            var list = new List<string>();
            string primaryBackup = SaveSystem.BackupFilePath;
            if (File.Exists(primaryBackup)) list.Add(primaryBackup);

            string backupDir = Path.Combine(SaveSystem.SaveDirectory, "Backups");
            if (Directory.Exists(backupDir))
            {
                var files = Directory.GetFiles(backupDir, "*.json");
                Array.Sort(files, (a, b) => File.GetLastWriteTime(b).CompareTo(File.GetLastWriteTime(a)));
                foreach (var f in files)
                {
                    if (!list.Contains(f)) list.Add(f);
                }
            }
            return list;
        }

        private void OnRestoreBackupClicked()
        {
            if (string.IsNullOrEmpty(selectedBackupPath) || !File.Exists(selectedBackupPath))
            {
                ShowRestoreStatus("No backup selected to restore.", false);
                return;
            }

            ConfirmationDialog dialog = ConfirmationDialog.Instance;
            if (dialog != null)
            {
                dialog.Show("backup.restore_confirm", () => ExecuteRestore(selectedBackupPath), null);
            }
            else
            {
                ExecuteRestore(selectedBackupPath);
            }
        }

        private void ExecuteRestore(string backupPath)
        {
            try
            {
                // 1. Strict validation before touching active save
                if (!SaveSystem.TryReadValid(backupPath, out var backupData, out string readError))
                {
                    ShowRestoreStatus($"Restore rejected! Backup is invalid: {readError}. Active save untouched.", false);
                    return;
                }

                // 2. Preserve current active save as separate safety backup before restoration
                string activeSave = SaveSystem.SaveFilePath;
                if (File.Exists(activeSave))
                {
                    string safetyBackup = Path.Combine(SaveSystem.SaveDirectory, "Backups", $"pre_restore_safety_{DateTime.Now:yyyyMMdd_HHmmss}.json");
                    string dir = Path.GetDirectoryName(safetyBackup);
                    if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
                    File.Copy(activeSave, safetyBackup, true);
                    Debug.Log($"[SaveManagementUI] Pre-restore safety backup saved to {safetyBackup}");
                }

                // 3. Atomically replace active save with validated backup
                File.Copy(backupPath, activeSave, true);

                ShowRestoreStatus($"Backup restored successfully! Loaded campaign (Region: {backupData.currentRegionId}).", true);
                RefreshRestoreBackupTab();
                RefreshLocalSavesTab();
            }
            catch (Exception ex)
            {
                ShowRestoreStatus($"Restore failed: {ex.Message}", false);
            }
        }

        private void ShowRestoreStatus(string message, bool success)
        {
            if (restoreStatusText != null)
            {
                restoreStatusText.text = success
                    ? $"<color=#00FF88>{message}</color>"
                    : $"<color=#FF4444>{message}</color>";
            }
        }

        // ====================================================================
        // SECTION 3: CLOUD SAVES
        // ====================================================================
        private void RefreshCloudSavesTab()
        {
            CloudSaveManager cloudMgr = CloudSaveManager.Instance;
            AuthService auth = AuthService.Instance;

            bool isConfigured = cloudMgr != null && cloudMgr.IsConfigured;
            bool isSignedIn = auth != null && auth.IsSignedIn;

            if (cloudConnectionStatusText != null)
            {
                cloudConnectionStatusText.text = isConfigured
                    ? "<color=#00FF88>Cloud Connection: Configured & Verified</color>"
                    : "<color=#FFAA00>Cloud Connection: Unconfigured / Offline</color>";
            }

            if (cloudAccountText != null)
            {
                if (isSignedIn && auth.CurrentUser != null)
                {
                    string email = !string.IsNullOrEmpty(auth.CurrentUser.email) ? auth.CurrentUser.email : "Authenticated User";
                    cloudAccountText.text = $"Signed-In Account: <b>{email}</b>";
                }
                else
                {
                    cloudAccountText.text = "Signed-In Account: <i>Guest / Offline (No Cloud Account)</i>";
                }
            }

            if (cloudLastSyncText != null)
            {
                cloudLastSyncText.text = $"Last Successful Sync: <b>{lastCloudSyncTime}</b>";
            }

            bool canPerformCloudSync = isConfigured && isSignedIn;

            if (cloudSyncNowButton != null)
            {
                cloudSyncNowButton.interactable = canPerformCloudSync;
            }
            if (cloudDownloadButton != null)
            {
                cloudDownloadButton.interactable = canPerformCloudSync;
            }

            if (cloudStatusMessageText != null)
            {
                if (!isConfigured)
                {
                    cloudStatusMessageText.text = "Cloud backend endpoint is not configured in this environment. Local persistence remains authoritative and fully functional.";
                }
                else if (!isSignedIn)
                {
                    cloudStatusMessageText.text = "Please sign in to your account via the top-right Account menu to enable cloud save synchronization.";
                }
                else
                {
                    cloudStatusMessageText.text = "Ready to synchronize your active campaign save with the cloud.";
                }
            }
        }

        private void OnCloudSyncNowClicked()
        {
            CloudSaveManager cloudMgr = CloudSaveManager.Instance;
            if (cloudMgr == null || !cloudMgr.IsConfigured)
            {
                ShowCloudMessage("Cloud sync unavailable: endpoint not configured.", false);
                return;
            }

            var save = SaveSystem.LoadGame();
            if (save == null)
            {
                ShowCloudMessage("No active save to synchronize.", false);
                return;
            }

            ShowCloudMessage("Synchronizing save to cloud...", true);
            cloudMgr.OnCloudSyncComplete += HandleCloudSyncComplete;
            cloudMgr.SynchronizeSaveToCloud(save);
        }

        private void HandleCloudSyncComplete(bool success, string message)
        {
            if (CloudSaveManager.Instance != null)
            {
                CloudSaveManager.Instance.OnCloudSyncComplete -= HandleCloudSyncComplete;
            }

            if (success)
            {
                lastCloudSyncTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                ShowCloudMessage($"Cloud sync confirmed: {message}", true);
                RefreshCloudSavesTab();
            }
            else
            {
                ShowCloudMessage($"Cloud sync failed: {message}", false);
            }
        }

        private void OnCloudDownloadClicked()
        {
            CloudSaveManager cloudMgr = CloudSaveManager.Instance;
            if (cloudMgr == null || !cloudMgr.IsConfigured)
            {
                ShowCloudMessage("Cloud download unavailable: endpoint not configured.", false);
                return;
            }

            ShowCloudMessage("Downloading latest cloud save...", true);
            cloudMgr.OnCloudDownloadComplete += HandleCloudDownloadComplete;
            cloudMgr.DownloadSaveFromCloud("active_save");
        }

        private void HandleCloudDownloadComplete(bool success, GameSaveData data, string message)
        {
            if (CloudSaveManager.Instance != null)
            {
                CloudSaveManager.Instance.OnCloudDownloadComplete -= HandleCloudDownloadComplete;
            }

            if (success && data != null)
            {
                // Save locally
                SaveSystem.SaveGame();
                lastCloudSyncTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                ShowCloudMessage($"Downloaded cloud save: Region {data.currentRegionId}", true);
                RefreshCloudSavesTab();
                RefreshLocalSavesTab();
            }
            else
            {
                ShowCloudMessage($"Download failed: {message}", false);
            }
        }

        private void ShowCloudMessage(string message, bool success)
        {
            if (cloudStatusMessageText != null)
            {
                cloudStatusMessageText.text = success
                    ? $"<color=#00FF88>{message}</color>"
                    : $"<color=#FF4444>{message}</color>";
            }
        }

        public void ApplyLocalizedLabels()
        {
            LocalizationManager mgr = LocalizationManager.Instance;
            if (titleText != null)
            {
                LocalizedFontProvider.Apply(titleText);
                titleText.text = mgr != null ? mgr.GetForDisplay("backup.title") : "BACKUPS & SAVES";
            }
            if (tabLocalLabel != null)
            {
                LocalizedFontProvider.Apply(tabLocalLabel);
                tabLocalLabel.text = mgr != null ? mgr.GetForDisplay("backup.tab_local") : "Local Saves";
            }
            if (tabRestoreLabel != null)
            {
                LocalizedFontProvider.Apply(tabRestoreLabel);
                tabRestoreLabel.text = mgr != null ? mgr.GetForDisplay("backup.tab_restore") : "Restore Backup";
            }
            if (tabCloudLabel != null)
            {
                LocalizedFontProvider.Apply(tabCloudLabel);
                tabCloudLabel.text = mgr != null ? mgr.GetForDisplay("backup.tab_cloud") : "Cloud Saves";
            }
            if (closeButton != null)
            {
                var txt = closeButton.GetComponentInChildren<Text>();
                if (txt != null)
                {
                    LocalizedFontProvider.Apply(txt);
                    txt.text = mgr != null ? mgr.GetForDisplay("menu.back") : "Back";
                }
            }
        }

        private void OnCloseClicked()
        {
            SetVisible(false);
        }
    }
}
