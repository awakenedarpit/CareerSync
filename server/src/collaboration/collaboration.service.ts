import crypto from 'crypto';
import type {
  CollaborationRoom,
  NewCollaborationRoom,
  CollaborationParticipant,
  NewCollaborationParticipant,
  CollaborationMessage,
  NewCollaborationMessage,
  CollaborationTask,
  NewCollaborationTask,
  CollaborationRoomCategory,
  CollaborationRoomStatus
} from '../db/schema';
import { getDb } from '../db';
import * as schema from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { moderationService } from '../moderation/moderation.service';

export interface CreateCollaborationRoomInput {
  name: string;
  description?: string;
  category: CollaborationRoomCategory;
  isPrivate?: boolean;
  passcode?: string;
  maxMembers?: number;
  tags?: string[];
}

export interface SendMessageInput {
  content: string;
  messageType?: 'TEXT' | 'CODE' | 'ATTACHMENT' | 'SYSTEM';
  codeSnippetJson?: {
    language: string;
    code: string;
    filename?: string;
  };
  attachmentUrl?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: string;
  dueDate?: Date;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: string;
}

export class CollaborationService {
  private static instance: CollaborationService | null = null;

  // In-memory repositories
  private rooms = new Map<string, CollaborationRoom>();
  private roomsBySlug = new Map<string, string>(); // `${tenantId}:${slug}` -> roomId
  private participants = new Map<string, CollaborationParticipant>(); // id -> participant
  private messages = new Map<string, CollaborationMessage>(); // id -> message
  private tasks = new Map<string, CollaborationTask>(); // id -> task

  // Shared Notes store with versioning for conflict protection:
  // roomId -> { content: string, version: number, updatedAt: Date, lastUpdatedBy: string }
  private roomNotes = new Map<
    string,
    { content: string; version: number; updatedAt: Date; lastUpdatedBy: string }
  >();

  public static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  public static resetInstance(): void {
    if (CollaborationService.instance) {
      CollaborationService.instance.clear();
    }
    CollaborationService.instance = null;
  }

  public clear(): void {
    this.rooms.clear();
    this.roomsBySlug.clear();
    this.participants.clear();
    this.messages.clear();
    this.tasks.clear();
    this.roomNotes.clear();
  }

  // ==========================================================================
  // 1. Study Room Lifecycle Across 9 Disciplines
  // ==========================================================================

  /**
   * Create collaboration study room
   */
  public async createRoom(
    tenantId: string,
    hostUserId: string,
    input: CreateCollaborationRoomInput
  ): Promise<CollaborationRoom> {
    const roomId = crypto.randomUUID();
    const slug = `${input.category.toLowerCase().replace(/_/g, '-')}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();

    const initialNotes = `# ${input.name}\n\nWelcome to our study group! Use this shared document for notes, summaries, and problem solving.`;

    const roomRecord: CollaborationRoom = {
      id: roomId,
      tenantId,
      slug,
      name: input.name,
      description: input.description || '',
      category: input.category,
      status: 'ACTIVE',
      isPrivate: input.isPrivate ?? false,
      passcodeHash: input.passcode || null,
      maxMembers: input.maxMembers ?? 10,
      activeMemberCount: 1,
      createdBy: hostUserId,
      pinnedMessageId: null,
      tags: input.tags || [input.category],
      canvasState: {
        notesVersion: 1,
        whiteboard: []
      },
      createdAt: now,
      updatedAt: now
    };

    this.rooms.set(roomId, roomRecord);
    this.roomsBySlug.set(`${tenantId}:${slug}`, roomId);

    // Initialize versioned notes
    this.roomNotes.set(roomId, {
      content: initialNotes,
      version: 1,
      updatedAt: now,
      lastUpdatedBy: hostUserId
    });

    // Auto-register host
    const participantId = crypto.randomUUID();
    const hostParticipant: CollaborationParticipant = {
      id: participantId,
      tenantId,
      roomId,
      userId: hostUserId,
      role: 'HOST',
      isMuted: false,
      joinedAt: now,
      lastActiveAt: now,
      leftAt: null
    };
    this.participants.set(participantId, hostParticipant);

    try {
      const db = getDb();
      await db.insert(schema.collaborationRooms).values(roomRecord as any);
      await db.insert(schema.collaborationParticipants).values(hostParticipant as any);
    } catch {
      // Fallback
    }

    return roomRecord;
  }

  /**
   * List collaboration rooms by category and filters
   */
  public async listRooms(
    tenantId: string,
    filters?: {
      category?: CollaborationRoomCategory;
      search?: string;
      status?: CollaborationRoomStatus;
    }
  ): Promise<CollaborationRoom[]> {
    const list: CollaborationRoom[] = [];

    for (const room of this.rooms.values()) {
      if (room.tenantId !== tenantId) continue;
      if (filters?.status) {
        if (room.status !== filters.status) continue;
      } else {
        if (room.status !== 'ACTIVE') continue;
      }

      if (filters?.category && room.category !== filters.category) continue;

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const matchesName = room.name.toLowerCase().includes(q);
        const matchesDesc = (room.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) continue;
      }

      list.push(room);
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get room details, active participants, notes, and task list
   */
  public async getRoomDetails(
    tenantId: string,
    roomIdOrSlug: string,
    userId: string
  ): Promise<{
    room: CollaborationRoom;
    participants: CollaborationParticipant[];
    notes: { content: string; version: number; lastUpdatedBy: string };
    tasks: CollaborationTask[];
  }> {
    let room = this.rooms.get(roomIdOrSlug);
    if (!room) {
      const id = this.roomsBySlug.get(`${tenantId}:${roomIdOrSlug}`);
      if (id) room = this.rooms.get(id);
    }

    if (!room || room.tenantId !== tenantId) {
      throw new Error(`Collaboration room ${roomIdOrSlug} not found.`);
    }

    const participants: CollaborationParticipant[] = [];
    for (const p of this.participants.values()) {
      if (p.roomId === room.id && p.leftAt === null) {
        participants.push(p);
      }
    }

    const notes = this.roomNotes.get(room.id) || {
      content: '',
      version: 1,
      lastUpdatedBy: room.createdBy
    };

    const tasks: CollaborationTask[] = [];
    for (const t of this.tasks.values()) {
      if (t.roomId === room.id) {
        tasks.push(t);
      }
    }

    return {
      room,
      participants,
      notes: {
        content: notes.content,
        version: notes.version,
        lastUpdatedBy: notes.lastUpdatedBy
      },
      tasks
    };
  }

  /**
   * Join a collaboration room with security and block checks
   */
  public async joinRoom(
    tenantId: string,
    roomIdOrSlug: string,
    userId: string,
    passcode?: string
  ): Promise<{ room: CollaborationRoom; participant: CollaborationParticipant }> {
    let room = this.rooms.get(roomIdOrSlug);
    if (!room) {
      const id = this.roomsBySlug.get(`${tenantId}:${roomIdOrSlug}`);
      if (id) room = this.rooms.get(id);
    }

    if (!room || room.tenantId !== tenantId) {
      throw new Error(`Collaboration room ${roomIdOrSlug} not found.`);
    }

    if (room.status !== 'ACTIVE') {
      throw new Error(`Cannot join room: status is ${room.status}.`);
    }

    // Passcode protection for private study rooms
    if (room.isPrivate && room.passcodeHash) {
      if (!passcode || passcode !== room.passcodeHash) {
        throw new Error('Invalid room passcode for private collaboration room.');
      }
    }

    // Moderation check: ensure no active blocks with existing participants
    for (const p of this.participants.values()) {
      if (p.roomId === room.id && p.leftAt === null) {
        const isBlocked = await moderationService.isBlocked(tenantId, userId, p.userId);
        if (isBlocked) {
          throw new Error('Access denied: Interaction is restricted with an active room participant.');
        }
      }
    }

    // Check if user is already in the room
    for (const p of this.participants.values()) {
      if (p.roomId === room.id && p.userId === userId) {
        p.leftAt = null;
        p.lastActiveAt = new Date();
        return { room, participant: p };
      }
    }

    // Check capacity
    let activeCount = 0;
    for (const p of this.participants.values()) {
      if (p.roomId === room.id && p.leftAt === null) {
        activeCount++;
      }
    }

    if (activeCount >= room.maxMembers) {
      throw new Error('Room has reached maximum participant capacity.');
    }

    const participantId = crypto.randomUUID();
    const now = new Date();
    const newParticipant: CollaborationParticipant = {
      id: participantId,
      tenantId,
      roomId: room.id,
      userId,
      role: 'MEMBER',
      isMuted: false,
      joinedAt: now,
      lastActiveAt: now,
      leftAt: null
    };

    this.participants.set(participantId, newParticipant);
    room.activeMemberCount = activeCount + 1;
    this.rooms.set(room.id, room);

    try {
      const db = getDb();
      await db.insert(schema.collaborationParticipants).values(newParticipant as any);
      await db
        .update(schema.collaborationRooms)
        .set({ activeMemberCount: room.activeMemberCount })
        .where(eq(schema.collaborationRooms.id, room.id));
    } catch {
      // Fallback
    }

    return { room, participant: newParticipant };
  }

  /**
   * Leave collaboration room
   */
  public async leaveRoom(tenantId: string, roomId: string, userId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room || room.tenantId !== tenantId) return;

    for (const p of this.participants.values()) {
      if (p.roomId === roomId && p.userId === userId && p.leftAt === null) {
        p.leftAt = new Date();
        this.participants.set(p.id, p);

        room.activeMemberCount = Math.max(0, room.activeMemberCount - 1);
        this.rooms.set(room.id, room);

        try {
          const db = getDb();
          await db
            .update(schema.collaborationParticipants)
            .set({ leftAt: new Date() })
            .where(eq(schema.collaborationParticipants.id, p.id));
          await db
            .update(schema.collaborationRooms)
            .set({ activeMemberCount: room.activeMemberCount })
            .where(eq(schema.collaborationRooms.id, room.id));
        } catch {
          // Fallback
        }
      }
    }
  }

  // ==========================================================================
  // 2. Shared Notes with Versioning & Conflict Protection
  // ==========================================================================

  /**
   * Update shared notes with optimistic concurrency versioning
   *
   * CONFLICT PROTECTION GUARANTEE:
   * If expectedVersion !== currentVersion, request is rejected with 409 CONFLICT
   * preventing silent lost updates during concurrent edits.
   */
  public async updateNotes(
    tenantId: string,
    roomId: string,
    userId: string,
    data: {
      content: string;
      expectedVersion: number;
    }
  ): Promise<{ content: string; version: number; lastUpdatedBy: string }> {
    const room = this.rooms.get(roomId);
    if (!room || room.tenantId !== tenantId) {
      throw new Error(`Collaboration room ${roomId} not found.`);
    }

    const currentNotes = this.roomNotes.get(roomId) || {
      content: '',
      version: 1,
      updatedAt: new Date(),
      lastUpdatedBy: room.createdBy
    };

    if (data.expectedVersion !== currentNotes.version) {
      const error: any = new Error(
        `Notes version conflict: expected version ${data.expectedVersion}, but current version is ${currentNotes.version}. Please refresh and merge.`
      );
      error.statusCode = 409;
      error.code = 'VERSION_CONFLICT';
      error.currentVersion = currentNotes.version;
      throw error;
    }

    const newVersion = currentNotes.version + 1;
    const now = new Date();

    const updatedNotes = {
      content: data.content,
      version: newVersion,
      updatedAt: now,
      lastUpdatedBy: userId
    };

    this.roomNotes.set(roomId, updatedNotes);

    // Update room canvas state
    room.canvasState = {
      ...(room.canvasState as any),
      notesVersion: newVersion
    };
    room.updatedAt = now;
    this.rooms.set(roomId, room);

    return {
      content: updatedNotes.content,
      version: updatedNotes.version,
      lastUpdatedBy: updatedNotes.lastUpdatedBy
    };
  }

  // ==========================================================================
  // 3. Task Checklist Management
  // ==========================================================================

  /**
   * Create task in collaboration checklist
   */
  public async createTask(
    tenantId: string,
    roomId: string,
    userId: string,
    input: CreateTaskInput
  ): Promise<CollaborationTask> {
    const room = this.rooms.get(roomId);
    if (!room || room.tenantId !== tenantId) {
      throw new Error(`Collaboration room ${roomId} not found.`);
    }

    const taskId = crypto.randomUUID();
    const now = new Date();

    const taskRecord: CollaborationTask = {
      id: taskId,
      tenantId,
      roomId,
      title: input.title,
      description: input.description || '',
      status: 'TODO',
      priority: input.priority || 'MEDIUM',
      assignedTo: input.assignedTo || null,
      createdBy: userId,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };

    this.tasks.set(taskId, taskRecord);

    try {
      const db = getDb();
      await db.insert(schema.collaborationTasks).values(taskRecord as any);
    } catch {
      // Fallback
    }

    return taskRecord;
  }

  /**
   * Update task (toggle status, assign, update priority)
   */
  public async updateTask(
    tenantId: string,
    taskId: string,
    userId: string,
    updates: UpdateTaskInput
  ): Promise<CollaborationTask> {
    const task = this.tasks.get(taskId);
    if (!task || task.tenantId !== tenantId) {
      throw new Error(`Task ${taskId} not found.`);
    }

    const now = new Date();

    if (updates.title !== undefined) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.priority !== undefined) task.priority = updates.priority;
    if (updates.assignedTo !== undefined) task.assignedTo = updates.assignedTo;

    if (updates.status !== undefined) {
      task.status = updates.status;
      if (updates.status === 'COMPLETED') {
        task.completedAt = now;
      } else {
        task.completedAt = null;
      }
    }

    task.updatedAt = now;
    this.tasks.set(taskId, task);

    try {
      const db = getDb();
      await db
        .update(schema.collaborationTasks)
        .set({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assignedTo,
          completedAt: task.completedAt,
          updatedAt: now
        })
        .where(
          and(
            eq(schema.collaborationTasks.id, taskId),
            eq(schema.collaborationTasks.tenantId, tenantId)
          )
        );
    } catch {
      // Fallback
    }

    return task;
  }

  // ==========================================================================
  // 4. In-Room Chat Stream
  // ==========================================================================

  /**
   * Send a message to collaboration room chat
   */
  public async sendMessage(
    tenantId: string,
    roomId: string,
    senderUserId: string,
    input: SendMessageInput
  ): Promise<CollaborationMessage> {
    const room = this.rooms.get(roomId);
    if (!room || room.tenantId !== tenantId) {
      throw new Error(`Collaboration room ${roomId} not found.`);
    }

    const messageId = crypto.randomUUID();
    const now = new Date();

    const messageRecord: CollaborationMessage = {
      id: messageId,
      tenantId,
      roomId,
      senderUserId,
      messageType: input.messageType || 'TEXT',
      content: input.content,
      codeSnippetJson: input.codeSnippetJson || null,
      attachmentUrl: input.attachmentUrl || null,
      isPinned: false,
      isEdited: false,
      reactions: {},
      createdAt: now,
      updatedAt: now
    };

    this.messages.set(messageId, messageRecord);

    try {
      const db = getDb();
      await db.insert(schema.collaborationMessages).values(messageRecord as any);
    } catch {
      // Fallback
    }

    return messageRecord;
  }

  /**
   * Retrieve messages for room
   */
  public async getMessages(
    tenantId: string,
    roomId: string,
    limit: number = 50
  ): Promise<CollaborationMessage[]> {
    const list: CollaborationMessage[] = [];
    for (const msg of this.messages.values()) {
      if (msg.roomId === roomId && msg.tenantId === tenantId) {
        list.push(msg);
      }
    }

    return list
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-limit);
  }
}

export const collaborationService = CollaborationService.getInstance();
