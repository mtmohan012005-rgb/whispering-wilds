using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace WhisperingWilds.Online
{
    /// <summary>
    /// Represents the currently signed-in user. Only the non-sensitive fields
    /// returned by the server are stored; the password and raw session token are
    /// never persisted as PlayerPrefs.
    /// </summary>
    [Serializable]
    public class AuthUser
    {
        public string id;
        public string email;
        public string displayName;
        public bool emailVerified;
    }

    /// <summary>
    /// Generic server response wrapper: { success, message, data?, token? }
    /// Used for login, register, logout, and me endpoints.
    /// </summary>
    [Serializable]
    public class AuthUserDataWrapper
    {
        public AuthUser user;
    }

    /// <summary>
    /// Generic server response wrapper: { success, message, data: { user }, token? }
    /// Maps nested backend contracts where data contains the authenticated user.
    /// </summary>
    [Serializable]
    public class AuthResponse
    {
        public bool success;
        public string message;
        public AuthUserDataWrapper data;
        public AuthUser user;
        public string token;

        public AuthUser GetUser()
        {
            if (data != null && data.user != null) return data.user;
            if (user != null) return user;
            return null;
        }
    }

    /// <summary>
    /// Unity-side HTTP client for the Whispering Wilds authentication backend.
    ///
    /// Talks to the session-based /api/auth endpoints (login, logout, register, me).
    /// The session token is kept in memory only and is NOT stored as PlayerPrefs.
    /// If the backend is unreachable, single-player gameplay remains fully functional.
    ///
    /// Sends X-WW-CSRF: 1 on all POST requests to satisfy the server's CSRF middleware.
    /// </summary>
    public class AuthService : MonoBehaviour
    {
        public static AuthService Instance { get; private set; }

        [Header("Backend Configuration")]
        [Tooltip("Base URL of the auth backend, e.g. http://localhost:3000. Empty = offline.")]
        [SerializeField] private string baseUrl = "http://localhost:3000";

        [SerializeField] private int requestTimeoutSeconds = 10;

        /// <summary>True while a network request is in flight.</summary>
        public bool IsRequesting { get; private set; }

        /// <summary>True once a valid session token is held in memory.</summary>
        public bool IsSignedIn => !string.IsNullOrEmpty(_sessionToken);

        /// <summary>The currently signed-in user, or null when offline.</summary>
        public AuthUser CurrentUser { get; private set; }

        /// <summary>The configured backend base URL.</summary>
        public string BaseUrl => baseUrl;

        public event Action<bool, string> OnSignInComplete;
        public event Action OnSignOutComplete;
        public event Action<string> OnError;

        private string _sessionToken;

        public const string ProductionDefaultUrl = "https://thewhisperingwilds.netlify.app";

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(this);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            ResolveBaseUrl();
        }

        private void ResolveBaseUrl()
        {
            string cliUrl = ReadCommandLineArg("-authUrl") ?? ReadCommandLineArg("-serverUrl");
            string envUrl = global::System.Environment.GetEnvironmentVariable("WW_AUTH_BACKEND_URL") 
                         ?? global::System.Environment.GetEnvironmentVariable("WW_SERVER_URL");

            if (!string.IsNullOrWhiteSpace(cliUrl))
            {
                baseUrl = cliUrl.Trim();
                Debug.Log($"[AuthService] Base URL overridden via command line: {baseUrl}");
                return;
            }

            if (!string.IsNullOrWhiteSpace(envUrl))
            {
                baseUrl = envUrl.Trim();
                Debug.Log($"[AuthService] Base URL overridden via environment variable: {baseUrl}");
                return;
            }

            // In production player builds (non-editor, non-debug), ensure localhost is never used
            if (!Application.isEditor && !Debug.isDebugBuild)
            {
                if (string.IsNullOrWhiteSpace(baseUrl) || baseUrl.Contains("localhost") || baseUrl.Contains("127.0.0.1"))
                {
                    baseUrl = ProductionDefaultUrl;
                    Debug.Log($"[AuthService] Production build defaulting to canonical HTTPS endpoint: {baseUrl}");
                }
            }
        }

        private static string ReadCommandLineArg(string flag)
        {
            string[] args;
            try
            {
                args = global::System.Environment.GetCommandLineArgs();
            }
            catch
            {
                return null;
            }

            for (int i = 0; i < args.Length - 1; i++)
            {
                if (string.Equals(args[i], flag, StringComparison.OrdinalIgnoreCase))
                {
                    return args[i + 1];
                }
            }
            return null;
        }

        /// <summary>
        /// Explicitly overrides the backend base URL (for testing or runtime reconfiguration).
        /// </summary>
        public void SetBaseUrl(string url)
        {
            baseUrl = url?.Trim();
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        /// <summary>
        /// Configures CloudSaveManager with the persistence backend after successful sign-in.
        /// The token provider returns the current session token per-request. The persistence
        /// routes use session-based auth (matching /api/auth/login), so the session token
        /// is the correct credential Ã¢â‚¬â€ no Firebase Auth SDK is required in Unity.
        /// </summary>
        private void ConfigureCloudSaves()
        {
            if (CloudSaveManager.Instance == null)
            {
                Debug.LogWarning("[AuthService] CloudSaveManager not found. Cloud saves will not be configured.");
                return;
            }

            // Build the persistence endpoint URL from the auth base URL
            string persistenceUrl = $"{baseUrl.TrimEnd('/')}/api/v1/persistence";

            // Token provider returns the current session token per-request.
            // The persistence routes use session-based auth, so this is the correct token type.
            IdTokenProvider tokenProvider = () => _sessionToken;

            CloudSaveManager.Instance.Configure(persistenceUrl, tokenProvider);
            Debug.Log($"[AuthService] CloudSaveManager configured with endpoint: {persistenceUrl}");
        }

        /// <summary>
        /// Clears CloudSaveManager configuration when signing out.
        /// </summary>
        private void ClearCloudSaves()
        {
            if (CloudSaveManager.Instance != null)
            {
                CloudSaveManager.Instance.Configure("", null);
                Debug.Log("[AuthService] CloudSaveManager cleared on sign-out.");
            }
        }

        /// <summary>
        /// Signs in with email and password. The game remains responsive while the
        /// request is pending. On success the session token is kept in memory only.
        /// </summary>
        public void SignIn(string email, string password, Action<bool, string> callback)
        {
            SignIn(email, password, false, callback);
        }

        public void SignIn(string email, string password, bool remember, Action<bool, string> callback)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                string msg = "Email and password are required.";
                callback?.Invoke(false, msg);
                OnError?.Invoke(msg);
                return;
            }

            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                string msg = "Backend is not configured. Sign in is unavailable.";
                callback?.Invoke(false, msg);
                OnError?.Invoke(msg);
                return;
            }

            if (IsRequesting)
            {
                string msg = "A request is already in progress.";
                callback?.Invoke(false, msg);
                return;
            }

            StartCoroutine(SignInCoroutine(email, password, remember, callback));
        }

        private IEnumerator SignInCoroutine(string email, string password, bool remember, Action<bool, string> callback)
        {
            IsRequesting = true;
            string url = $"{baseUrl.TrimEnd('/')}/api/auth/login";

            string json = $"{{\"email\":\"{EscapeJson(email)}\",\"password\":\"{EscapeJson(password)}\",\"remember\":{(remember ? "true" : "false")}}}";

            using (var uwr = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                uwr.uploadHandler = new UploadHandlerRaw(bodyRaw);
                uwr.downloadHandler = new DownloadHandlerBuffer();
                uwr.SetRequestHeader("Content-Type", "application/json");
                uwr.SetRequestHeader("X-WW-CSRF", "1");
                uwr.timeout = requestTimeoutSeconds;

                yield return uwr.SendWebRequest();

                IsRequesting = false;

                if (uwr.isNetworkError || uwr.isHttpError)
                {
                    string msg = uwr.isNetworkError
                        ? "Cannot reach the server. Check your internet connection."
                        : ParseErrorMessage(uwr.downloadHandler?.text) ?? "Sign in failed.";
                    callback?.Invoke(false, msg);
                    OnError?.Invoke(msg);
                    OnSignInComplete?.Invoke(false, msg);
                }
                else
                {
                    string response = uwr.downloadHandler?.text;
                    var result = ParseSignInResponse(response);
                    if (result.success && !string.IsNullOrEmpty(result.token))
                    {
                        _sessionToken = result.token;
                        CurrentUser = result.GetUser() ?? ExtractUserFromResponse(response);
                        // Configure cloud saves with the persistence backend
                        ConfigureCloudSaves();
                        callback?.Invoke(true, "Signed in successfully.");
                        OnSignInComplete?.Invoke(true, "Signed in successfully.");
                    }
                    else
                    {
                        string msg = result.message ?? "Sign in failed: no session received.";
                        callback?.Invoke(false, msg);
                        OnError?.Invoke(msg);
                        OnSignInComplete?.Invoke(false, msg);
                    }
                }
            }
        }

        /// <summary>
        /// Registers a new account. Returns success only if the server creates the account.
        /// </summary>
        public void Register(string email, string password, string confirmPassword, string displayName, Action<bool, string> callback)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password)
                || string.IsNullOrWhiteSpace(confirmPassword) || string.IsNullOrWhiteSpace(displayName))
            {
                string msg = "All fields are required.";
                callback?.Invoke(false, msg);
                OnError?.Invoke(msg);
                return;
            }

            if (password != confirmPassword)
            {
                string msg = "Passwords do not match.";
                callback?.Invoke(false, msg);
                OnError?.Invoke(msg);
                return;
            }

            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                string msg = "Backend is not configured. Registration is unavailable.";
                callback?.Invoke(false, msg);
                OnError?.Invoke(msg);
                return;
            }

            if (IsRequesting)
            {
                callback?.Invoke(false, "A request is already in progress.");
                return;
            }

            StartCoroutine(RegisterCoroutine(email, password, confirmPassword, displayName, callback));
        }

        private IEnumerator RegisterCoroutine(string email, string password, string confirmPassword, string displayName, Action<bool, string> callback)
        {
            IsRequesting = true;
            string url = $"{baseUrl.TrimEnd('/')}/api/auth/register";

            string json = $"{{\"email\":\"{EscapeJson(email)}\",\"password\":\"{EscapeJson(password)}\",\"confirmPassword\":\"{EscapeJson(confirmPassword)}\",\"displayName\":\"{EscapeJson(displayName)}\"}}";

            using (var uwr = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                uwr.uploadHandler = new UploadHandlerRaw(bodyRaw);
                uwr.downloadHandler = new DownloadHandlerBuffer();
                uwr.SetRequestHeader("Content-Type", "application/json");
                uwr.SetRequestHeader("X-WW-CSRF", "1");
                uwr.timeout = requestTimeoutSeconds;

                yield return uwr.SendWebRequest();

                IsRequesting = false;

                if (uwr.isNetworkError || uwr.isHttpError)
                {
                    string msg = uwr.isNetworkError
                        ? "Cannot reach the server. Check your internet connection."
                        : ParseErrorMessage(uwr.downloadHandler?.text) ?? "Registration failed.";
                    callback?.Invoke(false, msg);
                    OnError?.Invoke(msg);
                }
                else
                {
                    string response = uwr.downloadHandler?.text;
                    var result = ParseGenericResponse(response);
                    callback?.Invoke(result.success, result.message);
                    if (!result.success) OnError?.Invoke(result.message);
                }
            }
        }

        /// <summary>
        /// Requests a password recovery link/token to be sent to the registered email address.
        /// </summary>
        public void ForgotPassword(string email, Action<bool, string> callback)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                string msg = "Email is required.";
                callback?.Invoke(false, msg);
                OnError?.Invoke(msg);
                return;
            }

            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                string msg = "Backend is not configured. Password recovery is unavailable.";
                callback?.Invoke(false, msg);
                OnError?.Invoke(msg);
                return;
            }

            if (IsRequesting)
            {
                callback?.Invoke(false, "A request is already in progress.");
                return;
            }

            StartCoroutine(ForgotPasswordCoroutine(email.Trim(), callback));
        }

        private IEnumerator ForgotPasswordCoroutine(string email, Action<bool, string> callback)
        {
            IsRequesting = true;
            string url = $"{baseUrl.TrimEnd('/')}/api/auth/forgot-password";
            string json = $"{{\"email\":\"{EscapeJson(email)}\"}}";

            using (var uwr = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                uwr.uploadHandler = new UploadHandlerRaw(bodyRaw);
                uwr.downloadHandler = new DownloadHandlerBuffer();
                uwr.SetRequestHeader("Content-Type", "application/json");
                uwr.SetRequestHeader("X-WW-CSRF", "1");
                uwr.timeout = requestTimeoutSeconds;

                yield return uwr.SendWebRequest();
                IsRequesting = false;

                if (uwr.isNetworkError || uwr.isHttpError)
                {
                    string msg = uwr.isNetworkError
                        ? "Cannot reach the server. Check your internet connection."
                        : ParseErrorMessage(uwr.downloadHandler?.text) ?? "Password reset request failed.";
                    callback?.Invoke(false, msg);
                    OnError?.Invoke(msg);
                }
                else
                {
                    string response = uwr.downloadHandler?.text;
                    var result = ParseGenericResponse(response);
                    callback?.Invoke(result.success, result.message);
                    if (!result.success) OnError?.Invoke(result.message);
                }
            }
        }

        /// <summary>
        /// Submits a password reset request using a valid token and new password.
        /// </summary>
        public void ResetPassword(string token, string newPassword, string confirmPassword, Action<bool, string> callback)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                string msg = "Recovery token is required.";
                callback?.Invoke(false, msg);
                OnError?.Invoke(msg);
                return;
            }

            if (string.IsNullOrWhiteSpace(newPassword) || string.IsNullOrWhiteSpace(confirmPassword))
            {
                string msg = "New password and confirmation are required.";
                callback?.Invoke(false, msg);
                OnError?.Invoke(msg);
                return;
            }

            if (newPassword != confirmPassword)
            {
                string msg = "Passwords do not match.";
                callback?.Invoke(false, msg);
                OnError?.Invoke(msg);
                return;
            }

            if (newPassword.Length < 8)
            {
                string msg = "Password must be at least 8 characters long.";
                callback?.Invoke(false, msg);
                OnError?.Invoke(msg);
                return;
            }

            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                string msg = "Backend is not configured. Password reset is unavailable.";
                callback?.Invoke(false, msg);
                OnError?.Invoke(msg);
                return;
            }

            if (IsRequesting)
            {
                callback?.Invoke(false, "A request is already in progress.");
                return;
            }

            StartCoroutine(ResetPasswordCoroutine(token.Trim(), newPassword, confirmPassword, callback));
        }

        private IEnumerator ResetPasswordCoroutine(string token, string newPassword, string confirmPassword, Action<bool, string> callback)
        {
            IsRequesting = true;
            string url = $"{baseUrl.TrimEnd('/')}/api/auth/reset-password";
            string json = $"{{\"token\":\"{EscapeJson(token)}\",\"newPassword\":\"{EscapeJson(newPassword)}\",\"confirmPassword\":\"{EscapeJson(confirmPassword)}\"}}";

            using (var uwr = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                uwr.uploadHandler = new UploadHandlerRaw(bodyRaw);
                uwr.downloadHandler = new DownloadHandlerBuffer();
                uwr.SetRequestHeader("Content-Type", "application/json");
                uwr.SetRequestHeader("X-WW-CSRF", "1");
                uwr.timeout = requestTimeoutSeconds;

                yield return uwr.SendWebRequest();
                IsRequesting = false;

                if (uwr.isNetworkError || uwr.isHttpError)
                {
                    string msg = uwr.isNetworkError
                        ? "Cannot reach the server. Check your internet connection."
                        : ParseErrorMessage(uwr.downloadHandler?.text) ?? "Password reset failed.";
                    callback?.Invoke(false, msg);
                    OnError?.Invoke(msg);
                }
                else
                {
                    string response = uwr.downloadHandler?.text;
                    var result = ParseGenericResponse(response);
                    callback?.Invoke(result.success, result.message);
                    if (!result.success) OnError?.Invoke(result.message);
                }
            }
        }

        /// <summary>
        /// Signs out by clearing the in-memory session token. The server is notified
        /// if reachable, but local sign-out always succeeds.
        /// </summary>
        public void SignOut()
        {
            if (!IsSignedIn)
            {
                ClearCloudSaves();
                _sessionToken = null;
                CurrentUser = null;
                OnSignOutComplete?.Invoke();
                return;
            }

            StartCoroutine(SignOutCoroutine());
        }

        private IEnumerator SignOutCoroutine()
        {
            string url = $"{baseUrl.TrimEnd('/')}/api/auth/logout";

            using (var uwr = new UnityWebRequest(url, "POST"))
            {
                uwr.uploadHandler = new UploadHandlerRaw(new byte[0]);
                uwr.downloadHandler = new DownloadHandlerBuffer();
                uwr.SetRequestHeader("Content-Type", "application/json");
                uwr.SetRequestHeader("X-WW-CSRF", "1");
                if (!string.IsNullOrEmpty(_sessionToken))
                {
                    uwr.SetRequestHeader("Authorization", $"Bearer {_sessionToken}");
                }
                uwr.timeout = requestTimeoutSeconds;

                yield return uwr.SendWebRequest();

                // Always clear locally, even if the server call fails
                ClearCloudSaves();
                _sessionToken = null;
                CurrentUser = null;
                OnSignOutComplete?.Invoke();
            }
        }

        /// <summary>
        /// Fetches the current profile. Only used after sign-in to verify the session.
        /// </summary>
        public void GetProfile(Action<bool, AuthUser> callback)
        {
            if (!IsSignedIn || string.IsNullOrWhiteSpace(baseUrl))
            {
                callback?.Invoke(false, null);
                return;
            }

            StartCoroutine(GetProfileCoroutine(callback));
        }

        private IEnumerator GetProfileCoroutine(Action<bool, AuthUser> callback)
        {
            string url = $"{baseUrl.TrimEnd('/')}/api/auth/me";

            using (var uwr = new UnityWebRequest(url, "GET"))
            {
                uwr.downloadHandler = new DownloadHandlerBuffer();
                if (!string.IsNullOrEmpty(_sessionToken))
                {
                    uwr.SetRequestHeader("Authorization", $"Bearer {_sessionToken}");
                }
                uwr.timeout = requestTimeoutSeconds;

                yield return uwr.SendWebRequest();

                if (uwr.isNetworkError || uwr.isHttpError)
                {
                    callback?.Invoke(false, null);
                }
                else
                {
                    string response = uwr.downloadHandler?.text;
                    var user = ParseMeResponse(response);
                    callback?.Invoke(user != null, user);
                }
            }
        }

        /// <summary>
        /// Returns the session token for use by other online services (e.g. CloudSaveManager).
        /// </summary>
        public string GetSessionToken() => _sessionToken;

        // --- Parsing helpers using JsonUtility ---

        public AuthResponse ParseSignInResponse(string response)
        {
            if (string.IsNullOrEmpty(response))
                return new AuthResponse { success = false, message = "Invalid server response." };

            try
            {
                var authResponse = JsonUtility.FromJson<AuthResponse>(response);
                if (authResponse != null)
                {
                    if (authResponse.GetUser() == null)
                    {
                        var extracted = ExtractUserFromResponse(response);
                        if (extracted != null)
                        {
                            authResponse.data = new AuthUserDataWrapper { user = extracted };
                        }
                    }
                    return authResponse;
                }
            }
            catch
            {
                // Fall through to manual parsing if JsonUtility fails
            }

            // Fallback: manual extraction for responses JsonUtility cannot parse
            var fallbackUser = ExtractUserFromResponse(response);
            return new AuthResponse
            {
                success = response.Contains("\"success\":true") || response.Contains("\"success\": true"),
                message = ExtractJsonString(response, "message") ?? "Sign in failed.",
                token = ExtractJsonString(response, "token"),
                data = fallbackUser != null ? new AuthUserDataWrapper { user = fallbackUser } : null,
                user = fallbackUser
            };
        }

        private AuthResponse ParseGenericResponse(string response)
        {
            if (string.IsNullOrEmpty(response))
                return new AuthResponse { success = false, message = "Unknown error." };

            try
            {
                var authResponse = JsonUtility.FromJson<AuthResponse>(response);
                if (authResponse != null)
                    return authResponse;
            }
            catch
            {
                // Fall through
            }

            return new AuthResponse
            {
                success = response.Contains("\"success\":true") || response.Contains("\"success\": true"),
                message = ExtractJsonString(response, "message") ?? "Unknown error."
            };
        }

        public AuthUser ParseMeResponse(string response)
        {
            if (string.IsNullOrEmpty(response)) return null;

            try
            {
                var authResponse = JsonUtility.FromJson<AuthResponse>(response);
                if (authResponse != null && authResponse.success)
                {
                    var u = authResponse.GetUser();
                    if (u != null) return u;
                }
            }
            catch
            {
                // Fall through
            }

            return ExtractUserFromResponse(response);
        }

        public AuthUser ExtractUserFromResponse(string response)
        {
            if (string.IsNullOrEmpty(response)) return null;

            // The server returns { success, message, data: { user: { id, email, displayName, emailVerified } } }
            // Prefer the nested 'user' block; fall back to 'data' block
            int userStart = response.IndexOf("\"user\"");
            int searchStart = userStart >= 0 ? userStart : response.IndexOf("\"data\"");
            if (searchStart < 0) return null;

            int objStart = response.IndexOf("{", searchStart);
            int objEnd = FindMatchingBrace(response, objStart);
            if (objStart < 0 || objEnd <= objStart) return null;

            string obj = response.Substring(objStart, objEnd - objStart + 1);
            return new AuthUser
            {
                id = ExtractJsonString(obj, "id"),
                email = ExtractJsonString(obj, "email"),
                displayName = ExtractJsonString(obj, "displayName"),
                emailVerified = obj.Contains("\"emailVerified\":true") || obj.Contains("\"emailVerified\": true")
            };
        }

        private string ParseErrorMessage(string response)
        {
            if (string.IsNullOrEmpty(response)) return "Sign in failed.";
            string message = ExtractJsonString(response, "message");
            return message ?? "Sign in failed.";
        }

        private static string ExtractJsonString(string json, string key)
        {
            string search = $"\"{key}\"";
            int idx = json.IndexOf(search);
            if (idx < 0) return null;

            int colon = json.IndexOf(':', idx + search.Length);
            if (colon < 0) return null;

            int start = json.IndexOf('"', colon + 1);
            if (start < 0) return null;

            int end = start + 1;
            while (end < json.Length)
            {
                if (json[end] == '\\') { end += 2; continue; }
                if (json[end] == '"') break;
                end++;
            }

            if (end >= json.Length) return null;
            return json.Substring(start + 1, end - start - 1);
        }

        private static int FindMatchingBrace(string s, int open)
        {
            int depth = 0;
            for (int i = open; i < s.Length; i++)
            {
                if (s[i] == '{') depth++;
                else if (s[i] == '}') { depth--; if (depth == 0) return i; }
            }
            return -1;
        }

        private static string EscapeJson(string value)
        {
            if (string.IsNullOrEmpty(value)) return value;
            return value.Replace("\\", "\\\\")
                        .Replace("\"", "\\\"")
                        .Replace("\n", "\\n")
                        .Replace("\r", "\\r")
                        .Replace("\t", "\\t");
        }

    }
}
