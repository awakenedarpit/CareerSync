import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import env from '../config/env';
import { verifyJwtToken } from '../utils/crypto';

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  tenantId?: string;
  role?: string;
  email?: string;
  currentRoomId?: string | null;
  isAlive?: boolean;
}

export interface WsMessage {
  type: string;
  payload: any;
}

export class RealtimeWebSocketServer {
  private static instance: RealtimeWebSocketServer | null = null;
  private wss: WebSocketServer | null = null;

  // Map of `${tenantId}:${roomId}` -> Set of connected WebSockets
  private rooms = new Map<string, Set<AuthenticatedWebSocket>>();

  // Map of userId -> Set of connected WebSockets (across devices/tabs)
  private userSockets = new Map<string, Set<AuthenticatedWebSocket>>();

  public static getInstance(): RealtimeWebSocketServer {
    if (!RealtimeWebSocketServer.instance) {
      RealtimeWebSocketServer.instance = new RealtimeWebSocketServer();
    }
    return RealtimeWebSocketServer.instance;
  }

  public static resetInstance(): void {
    if (RealtimeWebSocketServer.instance) {
      RealtimeWebSocketServer.instance.close();
    }
    RealtimeWebSocketServer.instance = null;
  }

  /**
   * Attach WebSocket server to an existing Node.js HTTP Server
   */
  public init(httpServer: HttpServer): WebSocketServer {
    if (this.wss) {
      return this.wss;
    }

    this.wss = new WebSocketServer({
      server: httpServer,
      path: '/ws'
    });

    this.setupServerEvents();
    return this.wss;
  }

  /**
   * Initialize a standalone WebSocket server for testing or dedicated port
   */
  public initStandalone(port: number): WebSocketServer {
    if (this.wss) {
      return this.wss;
    }

    this.wss = new WebSocketServer({ port });
    this.setupServerEvents();
    return this.wss;
  }

  public getWss(): WebSocketServer | null {
    return this.wss;
  }

  private setupServerEvents(): void {
    if (!this.wss) return;

    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req) => {
      ws.isAlive = true;

      // Authenticate connection
      const auth = await this.authenticateConnection(req);
      if (!auth) {
        ws.close(4001, 'Unauthorized: Invalid or missing token');
        return;
      }

      ws.userId = auth.userId;
      ws.tenantId = auth.tenantId;
      ws.role = auth.role;
      ws.email = auth.email;
      ws.currentRoomId = null;

      this.registerClient(ws, auth);

      // Send connection acknowledgement
      ws.send(
        JSON.stringify({
          type: 'CONNECTED_ACK',
          payload: {
            userId: auth.userId,
            tenantId: auth.tenantId,
            status: 'AUTHENTICATED',
            serverTime: new Date().toISOString()
          }
        })
      );

      // Handle inbound messages
      ws.on('message', (data: Buffer | string) => {
        try {
          const raw = data.toString();
          const parsed: WsMessage = JSON.parse(raw);
          this.handleMessage(ws, parsed);
        } catch (err: any) {
          ws.send(
            JSON.stringify({
              type: 'ERROR',
              payload: { message: 'Malformed JSON frame' }
            })
          );
        }
      });

      // Handle ping/pong heartbeat
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle close
      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', () => {
        this.handleDisconnect(ws);
      });
    });

    // Heartbeat interval to cleanup dead sockets
    const interval = setInterval(() => {
      if (!this.wss) {
        clearInterval(interval);
        return;
      }
      for (const client of this.wss.clients as Set<AuthenticatedWebSocket>) {
        if (!client.isAlive) {
          client.terminate();
          continue;
        }
        client.isAlive = false;
        client.ping();
      }
    }, 30000);
  }

  public registerClient(
    ws: AuthenticatedWebSocket,
    auth: { userId: string; tenantId: string; role: string; email: string }
  ): void {
    ws.userId = auth.userId;
    ws.tenantId = auth.tenantId;
    ws.role = auth.role;
    ws.email = auth.email;
    ws.currentRoomId = null;

    if (!this.userSockets.has(auth.userId)) {
      this.userSockets.set(auth.userId, new Set());
    }
    this.userSockets.get(auth.userId)!.add(ws);
  }

  /**
   * Verify JWT bearer token on connection upgrade
   */
  public async authenticateConnection(
    req: any
  ): Promise<{ userId: string; tenantId: string; role: string; email: string } | null> {
    try {
      const parsedUrl = url.parse(req.url || '', true);
      let token: string | undefined = undefined;

      // 1. Query parameter (?token=...)
      if (parsedUrl.query && parsedUrl.query.token) {
        token = Array.isArray(parsedUrl.query.token)
          ? parsedUrl.query.token[0]
          : parsedUrl.query.token;
      }

      // 2. Authorization header
      if (!token && req.headers['authorization']) {
        const header = req.headers['authorization'];
        if (header.startsWith('Bearer ')) {
          token = header.substring(7).trim();
        }
      }

      // 3. Sec-WebSocket-Protocol header
      if (!token && req.headers['sec-websocket-protocol']) {
        const protocol = req.headers['sec-websocket-protocol'];
        const parts = protocol.split(',').map((p: string) => p.trim());
        if (parts.length > 0 && parts[0].length > 10) {
          token = parts[0];
        }
      }

      if (!token) return null;

      const secret = env.JWT_SECRET || 'carrersync_jwt_default_secret_dev_key_32_chars';
      const payload = await verifyJwtToken(token, secret);

      if (!payload.sub || !payload.tenant_id) {
        return null;
      }

      return {
        userId: payload.sub,
        tenantId: payload.tenant_id,
        role: payload.role || 'student',
        email: payload.email || ''
      };
    } catch {
      return null;
    }
  }

  /**
   * Dispatch incoming WebSocket message based on event type
   */
  public handleMessage(ws: AuthenticatedWebSocket, message: WsMessage): void {
    const { type, payload } = message;
    if (!ws.tenantId || !ws.userId) return;

    switch (type) {
      // 1. Join Room
      case 'JOIN_ROOM': {
        const { roomId } = payload || {};
        if (!roomId) return;

        // Leave existing room if any
        if (ws.currentRoomId) {
          this.leaveRoom(ws, ws.currentRoomId);
        }

        const roomKey = `${ws.tenantId}:${roomId}`;
        if (!this.rooms.has(roomKey)) {
          this.rooms.set(roomKey, new Set());
        }
        this.rooms.get(roomKey)!.add(ws);
        ws.currentRoomId = roomId;

        // Broadcast presence to room
        this.broadcastToRoom(
          ws.tenantId,
          roomId,
          {
            type: 'PRESENCE_JOIN',
            payload: {
              userId: ws.userId,
              role: ws.role,
              timestamp: new Date().toISOString()
            }
          },
          ws
        );

        // Acknowledge join
        ws.send(
          JSON.stringify({
            type: 'JOIN_ACK',
            payload: {
              roomId,
              activeParticipants: this.rooms.get(roomKey)!.size
            }
          })
        );
        break;
      }

      // 2. Leave Room
      case 'LEAVE_ROOM': {
        const { roomId } = payload || {};
        const targetRoom = roomId || ws.currentRoomId;
        if (targetRoom) {
          this.leaveRoom(ws, targetRoom);
          ws.currentRoomId = null;
        }
        break;
      }

      // 3. In-Room Chat Broadcast
      case 'CHAT_MESSAGE': {
        if (!ws.currentRoomId) return;
        this.broadcastToRoom(ws.tenantId, ws.currentRoomId, {
          type: 'CHAT_MESSAGE',
          payload: {
            ...payload,
            senderUserId: ws.userId,
            timestamp: new Date().toISOString()
          }
        });
        break;
      }

      // 4. Typing Indicator
      case 'USER_TYPING': {
        if (!ws.currentRoomId) return;
        this.broadcastToRoom(
          ws.tenantId,
          ws.currentRoomId,
          {
            type: 'USER_TYPING',
            payload: {
              userId: ws.userId,
              isTyping: Boolean(payload?.isTyping)
            }
          },
          ws
        );
        break;
      }

      // 5. Shared Notes Real-Time Sync
      case 'NOTES_UPDATE': {
        if (!ws.currentRoomId) return;
        this.broadcastToRoom(
          ws.tenantId,
          ws.currentRoomId,
          {
            type: 'NOTES_UPDATE',
            payload: {
              content: payload?.content,
              version: payload?.version,
              updatedBy: ws.userId,
              timestamp: new Date().toISOString()
            }
          },
          ws
        );
        break;
      }

      // 6. Collaborative Task Checklist Event
      case 'TASK_EVENT': {
        if (!ws.currentRoomId) return;
        this.broadcastToRoom(ws.tenantId, ws.currentRoomId, {
          type: 'TASK_EVENT',
          payload: {
            ...payload,
            actorUserId: ws.userId,
            timestamp: new Date().toISOString()
          }
        });
        break;
      }

      // 7. Peer Mock Interview Event (Role Switch, Question Switch, Timer Sync)
      case 'INTERVIEW_EVENT': {
        if (!ws.currentRoomId) return;
        this.broadcastToRoom(ws.tenantId, ws.currentRoomId, {
          type: 'INTERVIEW_EVENT',
          payload: {
            ...payload,
            actorUserId: ws.userId,
            timestamp: new Date().toISOString()
          }
        });
        break;
      }

      // 8. WebRTC Signaling Relay (Offer, Answer, ICE Candidate)
      // Strict ₹0 zero-cost compliance: Zero paid TURN/media servers; browser-native P2P mesh
      // Safe-by-default: Explicit user consent indicator required; text/notes fallback primary
      case 'WEBRTC_SIGNAL': {
        if (!ws.currentRoomId) return;
        const { targetUserId, signalType, data } = payload || {};

        if (!targetUserId) {
          // Broadcast to all other room members
          this.broadcastToRoom(
            ws.tenantId,
            ws.currentRoomId,
            {
              type: 'WEBRTC_SIGNAL',
              payload: {
                fromUserId: ws.userId,
                signalType,
                data
              }
            },
            ws
          );
        } else {
          // Direct relay to specific peer
          this.sendToUserInRoom(ws.tenantId, ws.currentRoomId, targetUserId, {
            type: 'WEBRTC_SIGNAL',
            payload: {
              fromUserId: ws.userId,
              signalType,
              data
            }
          });
        }
        break;
      }

      default:
        break;
    }
  }

  private leaveRoom(ws: AuthenticatedWebSocket, roomId: string): void {
    if (!ws.tenantId || !ws.userId) return;
    const roomKey = `${ws.tenantId}:${roomId}`;
    const roomSet = this.rooms.get(roomKey);

    if (roomSet) {
      roomSet.delete(ws);
      if (roomSet.size === 0) {
        this.rooms.delete(roomKey);
      } else {
        // Broadcast presence leave
        this.broadcastToRoom(ws.tenantId, roomId, {
          type: 'PRESENCE_LEAVE',
          payload: {
            userId: ws.userId,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }

  private handleDisconnect(ws: AuthenticatedWebSocket): void {
    if (ws.currentRoomId) {
      this.leaveRoom(ws, ws.currentRoomId);
      ws.currentRoomId = null;
    }

    if (ws.userId && this.userSockets.has(ws.userId)) {
      const set = this.userSockets.get(ws.userId)!;
      set.delete(ws);
      if (set.size === 0) {
        this.userSockets.delete(ws.userId);
      }
    }
  }

  /**
   * Broadcast message to all participants in a tenant-isolated room
   */
  public broadcastToRoom(
    tenantId: string,
    roomId: string,
    message: any,
    excludeWs?: WebSocket
  ): void {
    const roomKey = `${tenantId}:${roomId}`;
    const set = this.rooms.get(roomKey);
    if (!set) return;

    const encoded = JSON.stringify(message);
    for (const client of set) {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(encoded);
      }
    }
  }

  /**
   * Send message to a specific user within a tenant-isolated room
   */
  public sendToUserInRoom(
    tenantId: string,
    roomId: string,
    targetUserId: string,
    message: any
  ): void {
    const roomKey = `${tenantId}:${roomId}`;
    const set = this.rooms.get(roomKey);
    if (!set) return;

    const encoded = JSON.stringify(message);
    for (const client of set) {
      if (client.userId === targetUserId && client.readyState === WebSocket.OPEN) {
        client.send(encoded);
      }
    }
  }

  public getConnectedClientCount(): number {
    return this.wss ? this.wss.clients.size : 0;
  }

  public getActiveRoomCount(): number {
    return this.rooms.size;
  }

  public close(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.rooms.clear();
    this.userSockets.clear();
  }
}

export const realtimeWebSocketServer = RealtimeWebSocketServer.getInstance();
