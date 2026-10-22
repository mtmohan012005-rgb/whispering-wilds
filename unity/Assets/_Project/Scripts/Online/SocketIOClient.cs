using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;

namespace WhisperingWilds.Online
{
    /// <summary>
    /// Minimal Socket.IO v4 client for Unity over a direct Engine.IO v4
    /// WebSocket transport.
    ///
    /// Handshake:
    ///   server -> 0{"sid":...}   (Engine.IO open)
    ///   client -> 40             (Socket.IO connect to "/")
    ///   server -> 40{"sid":...}  (namespace connected)
    ///   server -> 2              (ping)
    ///   client -> 3              (pong)
    ///   server -> 42["event", {...}]
    ///
    /// No HTTP polling session is created, so the transport cannot be left in a
    /// half-upgraded polling state. All Unity API access remains on the main
    /// thread; network callbacks only enqueue data.
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
        private ClientWebSocket _webSocket;
        private CancellationTokenSource _lifetime;
        private Task _receiveTask;
        private Task _sendTask;
        private bool _opened;
        private bool _disconnectNotified;

        private readonly ConcurrentQueue<string> _incomingMessages = new ConcurrentQueue<string>();
        private readonly ConcurrentQueue<string> _incomingErrors = new ConcurrentQueue<string>();
        private readonly ConcurrentQueue<string> _incomingCloses = new ConcurrentQueue<string>();
        private readonly ConcurrentQueue<string> _outgoing = new ConcurrentQueue<string>();
        private readonly SemaphoreSlim _sendSignal = new SemaphoreSlim(0);
        private readonly Dictionary<string, List<Action<object[]>>> _eventHandlers =
            new Dictionary<string, List<Action<object[]>>>();

        public void Connect(string url)
        {
            if (State == ConnectionState.Connecting || State == ConnectionState.Connected)
            {
                return;
            }

            ResetTransport();
            _disconnectNotified = false;
            _opened = false;
            _baseUrl = string.IsNullOrWhiteSpace(url) ? "http://localhost:3000" : url.Trim();
            State = ConnectionState.Connecting;
            _lifetime = new CancellationTokenSource();
            _ = ConnectAsync(_lifetime.Token);
        }

        private async Task ConnectAsync(CancellationToken token)
        {
            var socket = new ClientWebSocket();
            _webSocket = socket;

            try
            {
                string wsUrl = BuildWebSocketUrl(_baseUrl);
                Debug.Log($"[SocketIO] Connecting to {wsUrl}");
                await socket.ConnectAsync(new Uri(wsUrl), token).ConfigureAwait(false);

                if (token.IsCancellationRequested)
                {
                    return;
                }

                _receiveTask = Task.Run(() => ReceiveLoop(socket, token), token);
                _sendTask = Task.Run(() => SendLoop(socket, token), token);

                // The Socket.IO connect packet is sent only after the Engine.IO
                // open packet arrives (handled on the main thread in Update).
                await WaitForNamespaceConnectAsync(token).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                // Expected during disconnect.
            }
            catch (Exception ex)
            {
                if (!token.IsCancellationRequested)
                {
                    _incomingErrors.Enqueue(ex.GetBaseException().Message);
                }
            }
        }

        private async Task WaitForNamespaceConnectAsync(CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(8);
            while (!token.IsCancellationRequested &&
                   State == ConnectionState.Connecting &&
                   DateTime.UtcNow < deadline)
            {
                await Task.Delay(25, token).ConfigureAwait(false);
            }

            if (!token.IsCancellationRequested && State == ConnectionState.Connecting)
            {
                _incomingErrors.Enqueue("Socket.IO namespace connect timed out");
            }
        }

        public void Disconnect()
        {
            if (State == ConnectionState.Disconnected && _webSocket == null) return;

            try
            {
                if (_webSocket != null && _webSocket.State == WebSocketState.Open && _opened)
                {
                    _outgoing.Enqueue("41");
                }
            }
            catch (Exception)
            {
                // Best-effort disconnect packet.
            }

            ResetTransport();
            State = ConnectionState.Disconnected;
            NotifyDisconnected();
        }

        private void ResetTransport()
        {
            try { _lifetime?.Cancel(); } catch (Exception) { }
            try
            {
                if (_webSocket != null &&
                    (_webSocket.State == WebSocketState.Open || _webSocket.State == WebSocketState.CloseReceived))
                {
                    _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "closing", CancellationToken.None)
                        .GetAwaiter().GetResult();
                }
            }
            catch (Exception) { }
            try { _webSocket?.Dispose(); } catch (Exception) { }
            _webSocket = null;
            _lifetime?.Dispose();
            _lifetime = null;
            _receiveTask = null;
            _sendTask = null;
            _opened = false;
            while (_outgoing.TryDequeue(out _)) { }
        }

        private async Task SendLoop(ClientWebSocket socket, CancellationToken token)
        {
            try
            {
                while (!token.IsCancellationRequested && socket.State == WebSocketState.Open)
                {
                    await _sendSignal.WaitAsync(token).ConfigureAwait(false);
                    while (_outgoing.TryDequeue(out string packet))
                    {
                        byte[] bytes = Encoding.UTF8.GetBytes(packet);
                        await socket.SendAsync(
                            new ArraySegment<byte>(bytes),
                            WebSocketMessageType.Text,
                            true,
                            token).ConfigureAwait(false);
                    }
                }
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                if (!token.IsCancellationRequested)
                {
                    _incomingErrors.Enqueue($"send: {ex.GetBaseException().Message}");
                }
            }
        }

        private async Task ReceiveLoop(ClientWebSocket socket, CancellationToken token)
        {
            var buffer = new byte[16384];
            var assembled = new System.IO.MemoryStream();
            try
            {
                while (!token.IsCancellationRequested && socket.State == WebSocketState.Open)
                {
                    WebSocketReceiveResult result = await socket.ReceiveAsync(
                        new ArraySegment<byte>(buffer), token).ConfigureAwait(false);

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        _incomingCloses.Enqueue("server closed the connection");
                        return;
                    }

                    assembled.Write(buffer, 0, result.Count);
                    if (!result.EndOfMessage) continue;

                    string message = Encoding.UTF8.GetString(
                        assembled.GetBuffer(), 0, (int)assembled.Length);
                    assembled.SetLength(0);
                    _incomingMessages.Enqueue(message);
                }
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                if (!token.IsCancellationRequested)
                {
                    _incomingErrors.Enqueue($"receive: {ex.GetBaseException().Message}");
                }
            }
            finally
            {
                assembled.Dispose();
            }
        }

        private void Update()
        {
            DrainIncoming();
        }

        private void DrainIncoming()
        {
            while (_incomingErrors.TryDequeue(out string error))
            {
                Debug.LogError($"[SocketIO] {error}");
                OnError?.Invoke(error);
                if (State != ConnectionState.Connected)
                {
                    State = ConnectionState.Disconnected;
                }
            }

            while (_incomingCloses.TryDequeue(out string reason))
            {
                if (State != ConnectionState.Disconnected)
                {
                    Debug.LogWarning($"[SocketIO] Connection closed: {reason}");
                    State = ConnectionState.Disconnected;
                    NotifyDisconnected();
                }
            }

            while (_incomingMessages.TryDequeue(out string message))
            {
                HandleEnginePacket(message);
            }
        }

        private void NotifyDisconnected()
        {
            if (_disconnectNotified) return;
            _disconnectNotified = true;
            OnDisconnected?.Invoke();
        }

        public void Emit(string eventName, object payload = null)
        {
            if (State != ConnectionState.Connected)
            {
                Debug.LogWarning($"[SocketIO] Cannot emit '{eventName}': not connected (state={State})");
                return;
            }

            string json = payload == null ? "null" : MiniJson.Serialize(payload);
            string packet = "42[" + MiniJson.Serialize(eventName) + "," + json + "]";
            Enqueue(packet);
        }

        public void On(string eventName, Action<object[]> handler)
        {
            if (!_eventHandlers.TryGetValue(eventName, out List<Action<object[]>> handlers))
            {
                handlers = new List<Action<object[]>>();
                _eventHandlers[eventName] = handlers;
            }
            handlers.Add(handler);
        }

        public void JoinRoom(string roomCode)
        {
            Emit("joinRoom", new Dictionary<string, object> { { "roomCode", roomCode } });
        }

        public void LeaveRoom()
        {
            Emit("leaveRoom", null);
        }

        private void Enqueue(string packet)
        {
            _outgoing.Enqueue(packet);
            try { _sendSignal.Release(); } catch (ObjectDisposedException) { }
        }

        private void HandleEnginePacket(string frame)
        {
            if (string.IsNullOrEmpty(frame)) return;

            string[] packets = frame.Split('\u001e');
            foreach (string packet in packets)
            {
                if (string.IsNullOrEmpty(packet)) continue;
                switch (packet[0])
                {
                    case '0': // Engine.IO open
                        ParseOpenPacket(packet.Substring(1));
                        Enqueue("40");
                        break;
                    case '1': // Engine.IO close
                        _incomingCloses.Enqueue("engine close");
                        break;
                    case '2': // ping
                        Enqueue("3");
                        break;
                    case '3': // pong
                        break;
                    case '4': // Socket.IO message
                        HandleSocketIOPacket(packet.Substring(1));
                        break;
                    default:
                        break;
                }
            }
        }

        private void ParseOpenPacket(string json)
        {
            _opened = true;
            var obj = MiniJson.AsObject(MiniJson.Deserialize(json));
            SocketId = MiniJson.GetString(obj, "sid", string.Empty);
            Debug.Log($"[SocketIO] Engine.IO open, sid={SocketId}");
        }

        private void HandleSocketIOPacket(string packet)
        {
            if (string.IsNullOrEmpty(packet)) return;

            char type = packet[0];
            string rest = packet.Length > 1 ? packet.Substring(1) : string.Empty;

            // Namespaced packets start with "/", e.g. 0/nsp,{"sid":...}. The
            // backend uses the default namespace, but tolerate the prefix.
            if (rest.StartsWith("/", StringComparison.Ordinal))
            {
                int comma = rest.IndexOf(',');
                rest = comma >= 0 ? rest.Substring(comma + 1) : string.Empty;
            }

            switch (type)
            {
                case '0':
                    var ack = MiniJson.AsObject(MiniJson.Deserialize(rest));
                    string sid = MiniJson.GetString(ack, "sid", SocketId);
                    if (!string.IsNullOrEmpty(sid)) SocketId = sid;
                    if (State != ConnectionState.Connected)
                    {
                        State = ConnectionState.Connected;
                        Debug.Log("[SocketIO] Namespace connected");
                        OnConnected?.Invoke();
                    }
                    break;
                case '1':
                    _incomingCloses.Enqueue("socket.io disconnect");
                    break;
                case '2':
                    ParseEventPacket(rest);
                    break;
                case '4':
                    _incomingErrors.Enqueue($"socket.io error: {rest}");
                    break;
            }
        }

        private void ParseEventPacket(string payload)
        {
            int start = payload.IndexOf('[');
            int end = payload.LastIndexOf(']');
            if (start < 0 || end <= start) return;

            string arrayJson = payload.Substring(start, end - start + 1);
            var args = MiniJson.AsArray(MiniJson.Deserialize(arrayJson));
            if (args == null || args.Count == 0) return;

            string eventName = args[0] as string;
            if (string.IsNullOrEmpty(eventName)) return;

            var eventArgs = new object[Math.Max(0, args.Count - 1)];
            for (int i = 1; i < args.Count; i++)
            {
                eventArgs[i - 1] = args[i];
            }

            if (_eventHandlers.TryGetValue(eventName, out List<Action<object[]>> handlers))
            {
                foreach (Action<object[]> handler in handlers)
                {
                    try
                    {
                        handler.Invoke(eventArgs);
                    }
                    catch (Exception ex)
                    {
                        Debug.LogError($"[SocketIO] Handler for '{eventName}' failed: {ex}");
                    }
                }
            }

            OnEvent?.Invoke(eventName, eventArgs);
        }

        private static string BuildWebSocketUrl(string baseUrl)
        {
            string url = baseUrl.TrimEnd('/');
            if (url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                url = "wss://" + url.Substring("https://".Length);
            }
            else if (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
            {
                url = "ws://" + url.Substring("http://".Length);
            }
            else if (!url.StartsWith("ws://", StringComparison.OrdinalIgnoreCase) &&
                     !url.StartsWith("wss://", StringComparison.OrdinalIgnoreCase))
            {
                url = "ws://" + url;
            }

            if (url.IndexOf("/socket.io", StringComparison.OrdinalIgnoreCase) < 0)
            {
                url += "/socket.io/";
            }

            url += url.IndexOf('?') >= 0 ? "&" : "?";
            url += "EIO=4&transport=websocket";
            return url;
        }

        private void OnDestroy()
        {
            Disconnect();
        }
    }
}
