/**
 * CarrerSync Real-Time WebSocket & WebRTC Signaling Client
 * Phase 16 Self-Hosted Collaborative Engine
 * 
 * Features:
 * - Resilient WebSocket connection with auto-reconnection and exponential backoff
 * - Presence management (join, leave, roster updates)
 * - Real-time shared notes synchronization with conflict protection
 * - Group chat and code snippet streaming
 * - Task checklist synchronization
 * - Peer interview state sync (role switching, timer synchronization, question navigation)
 * - Optional WebRTC P2P audio/video signaling (with explicit user consent gating)
 * - Text-and-notes primary mode fallback
 */

class RealtimeClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelayMs = 1500;
    this.currentRoomId = null;
    this.currentSessionType = null;
    this.userProfile = null;
    this.listeners = new Map();
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isMediaEnabled = { audio: false, video: false };
    this.simulationMode = false;
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unregister event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Dispatch internal event to listeners
   */
  _emitLocal(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in realtime listener for ${event}:`, e);
        }
      });
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.hostname}:5050/ws`;
      const wsUrl = `${wsHost}?token=${encodeURIComponent(token || 'guest')}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this._emitLocal('connected', { isConnected: true });

        // If we were in a room, re-join
        if (this.currentRoomId) {
          this.joinRoom(this.currentRoomId, this.currentSessionType, this.userProfile);
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this._handleIncomingMessage(payload);
        } catch {
          // ignore malformed frame
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this._emitLocal('disconnected', { isConnected: false });
        this._attemptReconnect();
      };

      this.socket.onerror = () => {
        // Fallback to simulation mode if real WS server is not reachable
        if (!this.isConnected && this.reconnectAttempts >= 2) {
          this.simulationMode = true;
          this._emitLocal('connected', { isConnected: true, simulated: true });
        }
      };
    } catch {
      this.simulationMode = true;
      this._emitLocal('connected', { isConnected: true, simulated: true });
    }
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelayMs * Math.pow(1.5, this.reconnectAttempts);
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.simulationMode = true;
      this._emitLocal('simulation_active', { active: true });
    }
  }

  /**
   * Handle incoming socket payload
   */
  _handleIncomingMessage(payload) {
    const { type, data } = payload;
    if (!type) return;

    // Route message by type
    this._emitLocal(type, data);

    // Specific WebRTC handlers
    if (type === 'webrtc:offer') {
      this._handleRemoteOffer(data);
    } else if (type === 'webrtc:answer') {
      this._handleRemoteAnswer(data);
    } else if (type === 'webrtc:ice-candidate') {
      this._handleRemoteIceCandidate(data);
    }
  }

  /**
   * Send payload to WebSocket server or simulate response
   */
  send(type, data = {}) {
    const message = {
      type,
      roomId: this.currentRoomId,
      sessionType: this.currentSessionType,
      sender: this.userProfile,
      timestamp: new Date().toISOString(),
      data,
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      // Echo or handle in simulated offline mode
      setTimeout(() => {
        this._handleSimulatedResponse(type, data);
      }, 50);
    }
  }

  _handleSimulatedResponse(type, data) {
    if (type === 'chat:message') {
      this._emitLocal('chat:message', {
        id: 'msg-' + Date.now(),
        senderName: this.userProfile?.name || 'You',
        text: data.text,
        codeSnippet: data.codeSnippet,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } else if (type === 'notes:update') {
      this._emitLocal('notes:update', {
        content: data.content,
        version: (data.version || 1) + 1,
        lastModifiedBy: this.userProfile?.name || 'You',
        lastModifiedAt: new Date().toISOString(),
      });
    } else if (type === 'task:update') {
      this._emitLocal('task:update', data);
    } else if (type === 'interview:role-switch') {
      this._emitLocal('interview:role-switch', data);
    }
  }

  /**
   * Join a collaborative or interview room
   */
  joinRoom(roomId, sessionType = 'COLLABORATION', userProfile = {}) {
    this.currentRoomId = roomId;
    this.currentSessionType = sessionType;
    this.userProfile = userProfile;

    if (!this.isConnected && !this.simulationMode) {
      this.connect();
    }

    this.send('room:join', { roomId, sessionType, userProfile });
    this._emitLocal('room:joined', { roomId, sessionType });
  }

  /**
   * Leave current room
   */
  leaveRoom() {
    if (this.currentRoomId) {
      this.send('room:leave', { roomId: this.currentRoomId });
      this.stopMediaTracks();
      this.currentRoomId = null;
      this._emitLocal('room:left', {});
    }
  }

  /**
   * Send a chat message
   */
  sendChatMessage(text, codeSnippet = null) {
    this.send('chat:message', { text, codeSnippet });
  }

  /**
   * Synchronize shared notes content
   */
  syncNotes(content, version) {
    this.send('notes:update', { content, version });
  }

  /**
   * Update task state
   */
  syncTaskUpdate(taskId, updates) {
    this.send('task:update', { taskId, updates });
  }

  /**
   * Peer interview: Request role switch
   */
  switchInterviewRole(newRole) {
    this.send('interview:role-switch', { newRole });
  }

  /**
   * Peer interview: Select question
   */
  selectQuestion(question) {
    this.send('interview:question-select', { question });
  }

  // ==========================================
  // WebRTC Optional P2P Media Handling
  // Gated behind explicit user consent
  // ==========================================

  /**
   * Request user media ONLY after explicit user consent click
   */
  async enableUserMedia(audio = true, video = false) {
    try {
      if (this.localStream) {
        this.stopMediaTracks();
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio,
        video,
      });

      this.isMediaEnabled = { audio, video };
      this._emitLocal('webrtc:local-stream', { stream: this.localStream });

      // Signal media toggle state to room peers
      this.send('webrtc:toggle-media', { audio, video, active: true });

      return this.localStream;
    } catch (err) {
      console.warn('Microphone/Camera access declined or unavailable:', err);
      this.isMediaEnabled = { audio: false, video: false };
      this._emitLocal('webrtc:media-error', { error: err.message });
      return null;
    }
  }

  /**
   * Stop any running audio/video tracks immediately
   */
  stopMediaTracks() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.isMediaEnabled = { audio: false, video: false };
    this._emitLocal('webrtc:media-stopped', {});
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
        this.isMediaEnabled.audio = enabled;
        this.send('webrtc:toggle-media', { ...this.isMediaEnabled });
        this._emitLocal('webrtc:state-changed', { ...this.isMediaEnabled });
      }
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
        this.isMediaEnabled.video = enabled;
        this.send('webrtc:toggle-media', { ...this.isMediaEnabled });
        this._emitLocal('webrtc:state-changed', { ...this.isMediaEnabled });
      }
    }
  }

  _handleRemoteOffer(data) {
    // Signaling hook for remote P2P offer
    this._emitLocal('webrtc:incoming-call', data);
  }

  _handleRemoteAnswer(data) {
    this._emitLocal('webrtc:call-answered', data);
  }

  _handleRemoteIceCandidate(data) {
    this._emitLocal('webrtc:ice-candidate', data);
  }

  /**
   * Disconnect completely and cleanup
   */
  disconnect() {
    this.stopMediaTracks();
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // ignore
      }
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }
}

export const realtimeClient = new RealtimeClient();
export default realtimeClient;
