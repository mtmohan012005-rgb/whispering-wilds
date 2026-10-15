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
    /// Unity-side HTTP client for the Whispering Wilds authentication backend.
    ///
    /// Talks to the session-based /api/auth endpoints (login, logout, register, me).
    /// The session token is kept in memory only and is NOT stored as PlayerPrefs.
    /// If the backend is unreachable, single-player gameplay remains fully functional.
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

        public event Action<bool, string> OnSignInComplete;
        public event Action OnSignOutComplete;
        public event Action<string> OnError;

        private string _sessionToken;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(this);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        /// <summary>
        /// Signs in with email and password. The game remains responsive while the
        /// request is pending. On success the session token is kept in memory only.
        /// </summary>
        public void SignIn(string email, string password, Action<bool, string> callback)
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

            StartCoroutine(SignInCoroutine(email, password, callback));
        }

        private IEnumerator SignInCoroutine(string email, string password, Action<bool, string> callback)
        {
            IsRequesting = true;
            string url = $"{baseUrl.TrimEnd('/')}/api/auth/login";

            var payload = new System.Text.Json.JsonSerializerOptions();
            string json = $"{{\"email\":\"{EscapeJson(email)}\",\"password\":\"{EscapeJson(password)}\"}}";

            using (var uwr = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                uwr.uploadHandler = new UploadHandlerRaw(bodyRaw);
                uwr.downloadHandler = new DownloadHandlerBuffer();
                uwr.SetRequestHeader("Content-Type", "application/json");
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
                    if (result.success)
                    {
                        _sessionToken = result.token;
                        CurrentUser = result.user;
                        callback?.Invoke(true, "Signed in successfully.");
                        OnSignInComplete?.Invoke(true, "Signed in successfully.");
                    }
                    else
                    {
                        callback?.Invoke(false, result.message);
                        OnError?.Invoke(result.message);
                        OnSignInComplete?.Invoke(false, result.message);
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
        /// Signs out by clearing the in-memory session token. The server is notified
        /// if reachable, but local sign-out always succeeds.
        /// </summary>
        public void SignOut()
        {
            if (!IsSignedIn)
            {
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
                if (!string.IsNullOrEmpty(_sessionToken))
                {
                    uwr.SetRequestHeader("Authorization", $"Bearer {_sessionToken}");
                }
                uwr.timeout = requestTimeoutSeconds;

                yield return uwr.SendWebRequest();

                // Always clear locally, even if the server call fails
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

        // --- Parsing helpers ---

        private struct SignInResult
        {
            public bool success;
            public string message;
            public string token;
            public AuthUser user;
        }

        private struct GenericResult
        {
            public bool success;
            public string message;
        }

        private SignInResult ParseSignInResponse(string response)
        {
            var result = new SignInResult { success = false, message = "Invalid server response." };

            if (string.IsNullOrEmpty(response)) return result;

            // Simple JSON parsing without external dependency
            bool success = response.Contains("\"success\":true") || response.Contains("\"success\": true");
            result.success = success;

            string message = ExtractJsonString(response, "message");
            result.message = message ?? "Sign in failed.";

            string token = ExtractJsonString(response, "token");
            result.token = token;

            // Extract user data
            int userStart = response.IndexOf("\"data\"");
            if (userStart >= 0)
            {
                int userObjStart = response.IndexOf("{", userStart);
                int userObjEnd = FindMatchingBrace(response, userObjStart);
                if (userObjStart >= 0 && userObjEnd > userObjStart)
                {
                    string userJson = response.Substring(userObjStart, userObjEnd - userObjStart + 1);
                    var user = new AuthUser
                    {
                        id = ExtractJsonString(userJson, "id"),
                        email = ExtractJsonString(userJson, "email"),
                        displayName = ExtractJsonString(userJson, "displayName"),
                        emailVerified = userJson.Contains("\"emailVerified\":true") || userJson.Contains("\"emailVerified\": true")
                    };
                    result.user = user;
                }
            }

            return result;
        }

        private GenericResult ParseGenericResponse(string response)
        {
            bool success = false;
            string message = "Unknown error.";

            if (!string.IsNullOrEmpty(response))
            {
                success = response.Contains("\"success\":true") || response.Contains("\"success\": true");
                message = ExtractJsonString(response, "message") ?? message;
            }

            return new GenericResult { success = success, message = message };
        }

        private AuthUser ParseMeResponse(string response)
        {
            if (string.IsNullOrEmpty(response)) return null;

            int dataStart = response.IndexOf("\"data\"");
            if (dataStart < 0) return null;

            int objStart = response.IndexOf("{", dataStart);
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
