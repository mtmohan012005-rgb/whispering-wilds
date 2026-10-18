using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace WhisperingWilds.Online
{
    /// <summary>
    /// Lightweight Socket.IO v4 client for Unity.
    /// Uses WebSocket transport after Engine.IO v4 handshake.
    /// Supports emit, on, disconnect, and rooms.
    /// 
    /// Protocol: Engine.IO v4 with JSON handshake response.
    /// Server path: /socket.io/ (default Socket.IO path).
    /// </summary>
    public class SocketIOClient : MonoBehaviour
    {
        public enum ConnectionState
        {
            Disconnected,
            Connecting,
            Connected,
            Reconnecting
        }

        public event Action OnConnected;
        public event Action OnDisconnected;
        public event Action<string, object[]> OnEvent;
        public event Action<string> OnError;

        public ConnectionState State { get; private set; } = ConnectionState.Disconnected;
        public string SocketId { get; private set; }
        public bool PingAutomatically { get; set; } = true;

        private string _baseUrl;
        private string _namespace = "/";
        private WebSocket _webSocket;
        private int _packetId;
        private float _pingTimer;
        private float _pongTimer; // Separate timer for pong timeout
        private float _pingInterval = 10f; // 10 seconds default (matches server config)
        private float _pongTimeout = 5f; // 5 seconds default (matches server config)
        private bool _pongExpected;
        private Dictionary<string, List<Action<object[]>>> _eventHandlers = new Dictionary<string, List<Action<object[]>>>();
        private Coroutine _connectCoroutine;

        /// <summary>
        /// Connects to the Socket.IO server at the given URL.
        /// </summary>
        public void Connect(string url)
        {
            if (_connectCoroutine != null)
            {
                StopCoroutine(_connectCoroutine);
            }
            _baseUrl = url.TrimEnd('/');
            _connectCoroutine = StartCoroutine(ConnectSequence());
        }

        /// <summary>
        /// Disconnects from the server.
        /// </summary>
        public void Disconnect()
        {
            if (_connectCoroutine != null)
            {
                StopCoroutine(_connectCoroutine);
                _connectCoroutine = null;
            }
            SendSocketIOPacket(SocketIOPacketType.Disconnect, _namespace);
            CloseWebSocket();
            State = ConnectionState.Disconnected;
            OnDisconnected?.Invoke();
        }

        /// <summary>
        /// Emits an event to the server.
        /// Supports two formats:
        /// 1. Emit("eventName", arg1, arg2, ...) — positional arguments
        /// 2. Emit("eventName", "key1", val1, "key2", val2, ...) — key-value pairs (converted to JSON object)
        /// </summary>
        public void Emit(string eventName, params object[] data)
        {
            if (State != ConnectionState.Connected)
            {
                Debug.LogWarning($"[SocketIO] Cannot emit '{eventName}': not connected (state={State})");
                return;
            }

            // Detect key-value pair pattern: alternating string keys and values
            if (data.Length >= 2 && data.Length % 2 == 0 && data[0] is string)
            {
                bool allKeysAreStrings = true;
                for (int i = 0; i < data.Length; i += 2)
                {
                    if (data[i] is string == false)
                    {
                        allKeysAreStrings = false;
                        break;
                    }
                }
                if (allKeysAreStrings)
                {
                    // Build JSON object from key-value pairs
                    StringBuilder sb = new StringBuilder();
                    sb.Append("{");
                    for (int i = 0; i < data.Length; i += 2)
                    {
                        if (i > 0) sb.Append(",");
                        sb.Append("\"");
                        sb.Append(((string)data[i]).Replace("\\", "\\\\").Replace("\"", "\\\""));
                        sb.Append("\":");
                        sb.Append(ToJson(data[i + 1]));
                    }
                    sb.Append("}");
                    SendSocketIOPacket(SocketIOPacketType.Event, _namespace, eventName, sb.ToString());
                    return;
                }
            }

            // Positional arguments — wrap in array
            SendSocketIOPacket(SocketIOPacketType.Event, _namespace, eventName, data);
        }

        /// <summary>
        /// Registers a handler for an event from the server.
        /// </summary>
        public void On(string eventName, Action<object[]> handler)
        {
            if (!_eventHandlers.ContainsKey(eventName))
            {
                _eventHandlers[eventName] = new List<Action<object[]>>();
            }
            _eventHandlers[eventName].Add(handler);
        }

        /// <summary>
        /// Joins a Socket.IO room.
        /// </summary>
        public void JoinRoom(string room)
        {
            Emit("joinRoom", room);
        }

        /// <summary>
        /// Leaves a Socket.IO room.
        /// </summary>
        public void LeaveRoom(string room)
        {
            Emit("leaveRoom", room);
        }

        private void Update()
        {
            if (State != ConnectionState.Connected || !PingAutomatically) return;

            _pingTimer += Time.unscaledDeltaTime;

            if (_pingTimer >= _pingInterval)
            {
                _pingTimer = 0f;
                SendEngineIOPacket("2"); // Engine.IO Ping
                _pongExpected = true;
                _pongTimer = 0f; // Start pong timeout timer
            }

            if (_pongExpected)
            {
                _pongTimer += Time.unscaledDeltaTime;
                if (_pongTimer >= _pongTimeout)
                {
                    Debug.LogWarning("[SocketIO] Pong timeout — server may be unreachable");
                    _pongExpected = false;
                }
            }
        }

        private void OnDestroy()
        {
            Disconnect();
        }

        private IEnumerator ConnectSequence()
        {
            State = ConnectionState.Connecting;
            Debug.Log($"[SocketIO] Connecting to {_baseUrl}");

            // Step 1: Engine.IO v4 handshake via HTTP polling
            // Socket.IO default path is /socket.io/, not /engine.io/
            string handshakeUrl = $"{_baseUrl}/socket.io/?EIO=4&transport=polling";

            using (var uwr = new UnityWebRequest(handshakeUrl, "GET"))
            {
                uwr.downloadHandler = new DownloadHandlerBuffer();
                uwr.uploadHandler = new UploadHandlerRaw(new byte[0]);
                uwr.timeout = 10;

                yield return uwr.SendWebRequest();

                if (uwr.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogError($"[SocketIO] Handshake failed: {uwr.error}");
                    OnError?.Invoke(uwr.error);
                    State = ConnectionState.Disconnected;
                    yield break;
                }

                string response = uwr.downloadHandler.text;
                // Engine.IO v4 returns JSON: {"sid":"...","upgrades":["websocket"],"pingInterval":10000,"pingTimeout":5000}
                ParseHandshake(response);

                if (string.IsNullOrEmpty(SocketId))
                {
                    Debug.LogError($"[SocketIO] Handshake did not return sid. Response: {response}");
                    OnError?.Invoke("Invalid handshake response");
                    State = ConnectionState.Disconnected;
                    yield break;
                }

                Debug.Log($"[SocketIO] Engine.IO handshake successful, sid={SocketId}");
            }

            // Step 2: Upgrade to WebSocket transport
            string wsUrl = $"{_baseUrl.Replace("http://", "ws://").Replace("https://", "wss://")}/socket.io/?EIO=4&transport=websocket&sid={SocketId}";

            _webSocket = new WebSocket();
            _webSocket.OnMessage += HandleWebSocketMessage;
            _webSocket.OnClose += HandleWebSocketClose;
            _webSocket.OnError += HandleWebSocketError;

            yield return _webSocket.Connect(wsUrl);

            if (_webSocket.State == WebSocketState.Open)
            {
                // Send Socket.IO connect packet (type 0)
                SendSocketIOPacket(SocketIOPacketType.Connect, _namespace);

                // Socket.IO connection confirmed by '0' connect packet from server
                // We'll handle this in the message handler
                Debug.Log($"[SocketIO] WebSocket connected, awaiting Socket.IO connect confirmation");
            }
            else
            {
                Debug.LogError($"[SocketIO] WebSocket connection failed: {_webSocket.State}");
                OnError?.Invoke("WebSocket connection failed");
                State = ConnectionState.Disconnected;
            }
        }

        private void ParseHandshake(string response)
        {
            // Engine.IO v4 returns JSON:
            // {"sid":"abc123","upgrades":["websocket"],"pingInterval":10000,"pingTimeout":5000}
            // Parse manually to avoid dependency on UnityEngine.JsonUtility for simple objects
            
            if (string.IsNullOrEmpty(response) || response[0] != '{')
            {
                Debug.LogWarning($"[SocketIO] Invalid handshake response (not JSON): {response}");
                return;
            }

            // Extract sid
            int sidIdx = response.IndexOf("\"sid\"");
            if (sidIdx >= 0)
            {
                int colonIdx = response.IndexOf(':', sidIdx);
                int quoteStart = response.IndexOf('"', colonIdx + 1);
                int quoteEnd = response.IndexOf('"', quoteStart + 1);
                if (quoteStart >= 0 && quoteEnd > quoteStart)
                {
                    SocketId = response.Substring(quoteStart + 1, quoteEnd - quoteStart - 1);
                }
            }

            // Extract pingInterval (milliseconds)
            int pingIdx = response.IndexOf("\"pingInterval\"");
            if (pingIdx >= 0)
            {
                int colonIdx = response.IndexOf(':', pingIdx);
                int numStart = colonIdx + 1;
                while (numStart < response.Length && char.IsWhiteSpace(response[numStart])) numStart++;
                int numEnd = numStart;
                while (numEnd < response.Length && char.IsDigit(response[numEnd])) numEnd++;
                if (numEnd > numStart)
                {
                    int ms;
                    if (int.TryParse(response.Substring(numStart, numEnd - numStart), out ms))
                    {
                        _pingInterval = ms / 1000f;
                    }
                }
            }

            // Extract pingTimeout (milliseconds)
            int timeoutIdx = response.IndexOf("\"pingTimeout\"");
            if (timeoutIdx >= 0)
            {
                int colonIdx = response.IndexOf(':', timeoutIdx);
                int numStart = colonIdx + 1;
                while (numStart < response.Length && char.IsWhiteSpace(response[numStart])) numStart++;
                int numEnd = numStart;
                while (numEnd < response.Length && char.IsDigit(response[numEnd])) numEnd++;
                if (numEnd > numStart)
                {
                    int ms;
                    if (int.TryParse(response.Substring(numStart, numEnd - numStart), out ms))
                    {
                        _pongTimeout = ms / 1000f;
                    }
                }
            }

            Debug.Log($"[SocketIO] Handshake parsed: sid={SocketId}, pingInterval={_pingInterval}s, pongTimeout={_pongTimeout}s");
        }

        private enum SocketIOPacketType
        {
            Connect = 0,
            Disconnect = 1,
            Event = 2,
            Ack = 3,
            Error = 4,
            BinaryConnect = 5,
            BinaryDisconnect = 6,
            BinaryEvent = 7,
            BinaryAck = 8
        }

        /// <summary>
        /// Sends a raw Engine.IO control frame (e.g. ping "2", pong "3").
        /// </summary>
        private void SendEngineIOPacket(string packet)
        {
            if (_webSocket == null || _webSocket.State != WebSocketState.Open) return;
            _webSocket.Send(packet);
        }

        /// <summary>
        /// Sends a Socket.IO packet wrapped in an Engine.IO message frame ("4").
        /// Engine.IO requires this prefix or the server will not route the packet
        /// to the Socket.IO layer.
        /// </summary>
        private void SendSocketIOPacket(SocketIOPacketType type, string ns = "", params object[] data)
        {
            if (_webSocket == null || _webSocket.State != WebSocketState.Open) return;

            string socketPacket;
            switch (type)
            {
                case SocketIOPacketType.Connect:
                    socketPacket = "0" + (string.IsNullOrEmpty(ns) ? "" : ns); // Socket.IO connect
                    break;
                case SocketIOPacketType.Disconnect:
                    socketPacket = "1" + (string.IsNullOrEmpty(ns) ? "" : ns); // Socket.IO disconnect
                    break;
                case SocketIOPacketType.Event:
                    socketPacket = BuildEventPacket(ns, data);
                    break;
                default:
                    return;
            }

            _webSocket.Send("4" + socketPacket);
        }

        /// <summary>
        /// Overload for Emit with eventName as separate parameter.
        /// </summary>
        private void SendSocketIOPacket(SocketIOPacketType type, string ns, string eventName, params object[] data)
        {
            if (_webSocket == null || _webSocket.State != WebSocketState.Open) return;

            string socketPacket;
            switch (type)
            {
                case SocketIOPacketType.Event:
                    socketPacket = BuildEventPacket(ns, eventName, data);
                    break;
                default:
                    return;
            }

            _webSocket.Send("4" + socketPacket);
        }

        /// <summary>
        /// Builds a Socket.IO event packet from legacy data array format.
        /// Format: 2["eventName",arg1,arg2,...]
        /// </summary>
        private string BuildEventPacket(string ns, object[] data)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("2");
            if (!string.IsNullOrEmpty(ns)) sb.Append(ns);
            sb.Append("[\"");
            sb.Append(data.Length > 0 ? ((string)data[0]) : "");
            sb.Append("\"");
            if (data.Length > 1)
            {
                for (int i = 1; i < data.Length; i++)
                {
                    sb.Append(',');
                    sb.Append(ToJson(data[i]));
                }
            }
            sb.Append("]");
            return sb.ToString();
        }

        /// <summary>
        /// Builds a Socket.IO event packet with explicit eventName.
        /// Format: 2["eventName",data] or 2["eventName"]
        /// </summary>
        private string BuildEventPacket(string ns, string eventName, params object[] data)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("2");
            if (!string.IsNullOrEmpty(ns)) sb.Append(ns);
            sb.Append("[\"");
            sb.Append(eventName.Replace("\\", "\\\\").Replace("\"", "\\\""));
            sb.Append("\"");
            if (data != null && data.Length > 0)
            {
                sb.Append(',');
                for (int i = 0; i < data.Length; i++)
                {
                    if (i > 0) sb.Append(',');
                    sb.Append(ToJson(data[i]));
                }
            }
            sb.Append("]");
            return sb.ToString();
        }

        private void HandleWebSocketMessage(string message)
        {
            if (string.IsNullOrEmpty(message)) return;

            char type = message[0];

            switch (type)
            {
                case '2': // Engine.IO Ping
                    SendPong();
                    break;
                case '3': // Engine.IO Pong
                    _pongExpected = false;
                    break;
                case '4': // Engine.IO Message (Socket.IO packet)
                    HandleSocketIOPacket(message.Substring(1));
                    break;
            }
        }

        private void HandleSocketIOPacket(string packet)
        {
            if (string.IsNullOrEmpty(packet)) return;

            char socketType = packet[0];

            switch (socketType)
            {
                case '0': // Connect
                    if (State != ConnectionState.Connected)
                    {
                        State = ConnectionState.Connected;
                        Debug.Log("[SocketIO] Connected to server");
                        OnConnected?.Invoke();
                    }
                    break;
                case '1': // Disconnect
                    State = ConnectionState.Disconnected;
                    OnDisconnected?.Invoke();
                    break;
                case '2': // Event
                    ParseEventPacket(packet);
                    break;
                case '4': // Error
                    string errorMsg = packet.Substring(1);
                    Debug.LogError($"[SocketIO] Server error: {errorMsg}");
                    OnError?.Invoke(errorMsg);
                    break;
            }
        }

        private void ParseEventPacket(string packet)
        {
            // Format: ["eventName",data] or ["eventName"]
            int start = packet.IndexOf('[');
            int end = packet.LastIndexOf(']');
            if (start < 0 || end < 0) return;

            string content = packet.Substring(start + 1, end - start - 1);

            // Find the closing quote of the event name
            int firstQuote = content.IndexOf('"');
            int secondQuote = content.IndexOf('"', firstQuote + 1);
            if (firstQuote < 0 || secondQuote < 0) return;

            string eventName = content.Substring(firstQuote + 1, secondQuote - firstQuote - 1);

            // Extract data after the event name
            string dataStr = content.Substring(secondQuote + 1).TrimStart(',');

            object[] args;
            if (string.IsNullOrEmpty(dataStr) || dataStr == "null")
            {
                args = new object[0];
            }
            else
            {
                // Simple JSON parse for common types
                args = new object[] { dataStr };
            }

            // Dispatch to registered handlers
            if (_eventHandlers.ContainsKey(eventName))
            {
                foreach (var handler in _eventHandlers[eventName])
                {
                    try
                    {
                        handler.Invoke(args);
                    }
                    catch (Exception e)
                    {
                        Debug.LogError($"[SocketIO] Error in handler for '{eventName}': {e.Message}");
                    }
                }
            }

            OnEvent?.Invoke(eventName, args);
            Debug.Log($"[SocketIO] Event: {eventName}");
        }

        private void SendPong()
        {
            if (_webSocket != null && _webSocket.State == WebSocketState.Open)
            {
                _webSocket.Send("3"); // Engine.IO Pong
            }
        }

        private void HandleWebSocketClose(int code, string reason)
        {
            State = ConnectionState.Disconnected;
            Debug.LogWarning($"[SocketIO] WebSocket closed: {code} - {reason}");
            OnDisconnected?.Invoke();
        }

        private void HandleWebSocketError(string error)
        {
            Debug.LogError($"[SocketIO] WebSocket error: {error}");
            OnError?.Invoke(error);
        }

        private void CloseWebSocket()
        {
            if (_webSocket != null)
            {
                _webSocket.OnMessage -= HandleWebSocketMessage;
                _webSocket.OnClose -= HandleWebSocketClose;
                _webSocket.OnError -= HandleWebSocketError;
                _webSocket.Close();
                _webSocket = null;
            }
        }

        private string ToJson(object obj)
        {
            if (obj == null) return "null";
            if (obj is string s) return "\"" + s.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
            if (obj is int || obj is float || obj is double || obj is bool) return obj.ToString().ToLowerInvariant();
            if (obj is Vector3 v) return $"{{\"x\":{v.x},\"y\":{v.y},\"z\":{v.z}}}";
            return "\"" + obj.ToString() + "\"";
        }

        /// <summary>
        /// Minimal WebSocket implementation for Unity.
        /// Uses UnityWebRequest for the WebSocket upgrade handshake and
        /// System.Net.WebSockets.ClientWebSocket for the connection.
        /// </summary>
        private class WebSocket
        {
            public event Action<string> OnMessage;
            public event Action<int, string> OnClose;
            public event Action<string> OnError;

            public WebSocketState State { get; private set; } = WebSocketState.Closed;

            private System.Net.WebSockets.ClientWebSocket _ws = new System.Net.WebSockets.ClientWebSocket();
            private string _url;
            private bool _isRunning;

            public System.Threading.Tasks.Task Connect(string url)
            {
                _url = url;
                State = WebSocketState.Connecting;
                return _ws.ConnectAsync(new Uri(url), System.Threading.CancellationToken.None)
                    .ContinueWith(t =>
                    {
                        if (t.IsFaulted)
                        {
                            State = WebSocketState.Closed;
                            OnError?.Invoke(t.Exception?.GetBaseException().Message ?? "Connection failed");
                            return;
                        }
                        State = WebSocketState.Open;
                        _isRunning = true;
                        System.Threading.Tasks.Task.Run(ReceiveLoop);
                    });
            }

            public void Send(string message)
            {
                if (State != WebSocketState.Open) return;
                var bytes = Encoding.UTF8.GetBytes(message);
                _ws.SendAsync(
                    new System.ArraySegment<byte>(bytes),
                    System.Net.WebSockets.WebSocketMessageType.Text,
                    true,
                    System.Threading.CancellationToken.None);
            }

            public void Close()
            {
                _isRunning = false;
                State = WebSocketState.Closed;
                _ws.CloseAsync(
                    System.Net.WebSockets.WebSocketCloseStatus.NormalClosure,
                    "Closing",
                    System.Threading.CancellationToken.None);
            }

            private async void ReceiveLoop()
            {
                var buffer = new byte[4096];
                while (_isRunning && State == WebSocketState.Open)
                {
                    try
                    {
                        var result = await _ws.ReceiveAsync(
                            new System.ArraySegment<byte>(buffer),
                            System.Threading.CancellationToken.None);

                        if (result.MessageType == System.Net.WebSockets.WebSocketMessageType.Close)
                        {
                            State = WebSocketState.Closed;
                            OnClose?.Invoke((int)(result.CloseStatus ?? System.Net.WebSockets.WebSocketCloseStatus.NormalClosure), "Closed");
                            break;
                        }

                        string message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        OnMessage?.Invoke(message);
                    }
                    catch (Exception e)
                    {
                        State = WebSocketState.Closed;
                        OnError?.Invoke(e.Message);
                        break;
                    }
                }
            }
        }

        private enum WebSocketState
        {
            Closed,
            Connecting,
            Open
        }
    }
}
