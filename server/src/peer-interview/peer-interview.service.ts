import crypto from 'crypto';
import type {
  PeerInterviewRoom,
  NewPeerInterviewRoom,
  PeerInterviewParticipant,
  NewPeerInterviewParticipant,
  PeerInterviewQuestion,
  NewPeerInterviewQuestion,
  PeerInterviewFeedback,
  NewPeerInterviewFeedback,
  PeerInterviewType,
  PeerInterviewMode,
  PeerInterviewStatus
} from '../db/schema';
import { getDb } from '../db';
import * as schema from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { moderationService } from '../moderation/moderation.service';

export interface CreateInterviewRoomInput {
  title: string;
  interviewType: PeerInterviewType;
  mode: PeerInterviewMode;
  scheduledStartTime?: Date;
  scheduledDurationMinutes?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  maxParticipants?: number;
  codeLanguage?: string;
  initialQuestions?: Array<{
    questionTitle: string;
    questionDescription: string;
    difficulty?: string;
    category?: string;
    standardAnswer?: string;
    codeTemplate?: string;
  }>;
}

export interface SubmitPeerFeedbackInput {
  roomId: string;
  evaluateeUserId: string;
  overallRating: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  codeQualityScore: number;
  detailedRubricScores?: Record<string, number>;
  strengthsText?: string;
  improvementsText?: string;
  generalFeedback?: string;
}

export interface PeerFeedbackResult extends PeerInterviewFeedback {
  isPeerProvidedLabel: true;
}

// Built-in question bank starter questions by category
const DEFAULT_QUESTION_BANK: Record<
  string,
  Array<{
    title: string;
    description: string;
    difficulty: string;
    category: string;
    standardAnswer: string;
    codeTemplate: string;
  }>
> = {
  TECHNICAL: [
    {
      title: 'Two Sum & Optimization',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Optimize from O(N^2) to O(N).',
      difficulty: 'EASY',
      category: 'Data Structures & Algorithms',
      standardAnswer: 'Use a hash map to store seen values and indices. Check if target - num exists in map in O(1) time.',
      codeTemplate: 'function twoSum(nums: number[], target: number): number[] {\n  // Implementation here\n}'
    },
    {
      title: 'Valid Parentheses & Stack Handling',
      description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
      difficulty: 'EASY',
      category: 'Data Structures & Algorithms',
      standardAnswer: 'Use a stack. Push expected closing bracket when opening bracket is encountered. If current char does not match stack.pop(), invalid.',
      codeTemplate: 'function isValid(s: string): boolean {\n  // Implementation here\n}'
    }
  ],
  HR: [
    {
      title: 'Behavioral: Conflict Resolution',
      description: 'Tell me about a time when you had a disagreement with a team member or peer on a technical approach. How did you resolve it?',
      difficulty: 'MEDIUM',
      category: 'Behavioral & Leadership',
      standardAnswer: 'Structure using STAR (Situation, Task, Action, Result). Focus on data-driven discussion, active listening, and collective objective.',
      codeTemplate: ''
    }
  ],
  SYSTEM_DESIGN: [
    {
      title: 'URL Shortener (TinyURL) Architecture',
      description: 'Design a scalable URL shortener service that handles 100M new URLs per month with low latency and high availability.',
      difficulty: 'HARD',
      category: 'System Design',
      standardAnswer: 'API endpoints, Base62 encoding / Hash with collision resolution, Redis caching tier, Relational/NoSQL store with read replicas, Rate limiting.',
      codeTemplate: ''
    }
  ],
  BEHAVIORAL: [
    {
      title: 'Handling Tight Deadlines',
      description: 'Describe a situation where a critical academic or project deadline was approaching with incomplete requirements. What steps did you take?',
      difficulty: 'MEDIUM',
      category: 'Behavioral',
      standardAnswer: 'STAR methodology: prioritization, scope negotiation, transparent stakeholder communication, successful delivery.',
      codeTemplate: ''
    }
  ]
};

export class PeerInterviewService {
  private static instance: PeerInterviewService | null = null;

  // In-memory repositories
  private rooms = new Map<string, PeerInterviewRoom>();
  private roomsByCode = new Map<string, string>(); // `${tenantId}:${roomCode}` -> roomId
  private participants = new Map<string, PeerInterviewParticipant>(); // id -> participant
  private questions = new Map<string, PeerInterviewQuestion>(); // id -> question
  private feedbacks = new Map<string, PeerInterviewFeedback>(); // id -> feedback

  public static getInstance(): PeerInterviewService {
    if (!PeerInterviewService.instance) {
      PeerInterviewService.instance = new PeerInterviewService();
    }
    return PeerInterviewService.instance;
  }

  public static resetInstance(): void {
    if (PeerInterviewService.instance) {
      PeerInterviewService.instance.clear();
    }
    PeerInterviewService.instance = null;
  }

  public clear(): void {
    this.rooms.clear();
    this.roomsByCode.clear();
    this.participants.clear();
    this.questions.clear();
    this.feedbacks.clear();
  }

  // ==========================================================================
  // 1. Room Creation & Marketplace Discovery
  // ==========================================================================

  /**
   * Create peer mock interview room
   */
  public async createRoom(
    tenantId: string,
    hostUserId: string,
    input: CreateInterviewRoomInput
  ): Promise<PeerInterviewRoom> {
    const roomId = crypto.randomUUID();
    const roomCode = `PEER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = new Date();

    const roomRecord: PeerInterviewRoom = {
      id: roomId,
      tenantId,
      roomCode,
      title: input.title,
      interviewType: input.interviewType,
      mode: input.mode,
      status: 'SCHEDULED',
      scheduledStartTime: input.scheduledStartTime ? new Date(input.scheduledStartTime) : now,
      scheduledDurationMinutes: input.scheduledDurationMinutes || 45,
      actualStartTime: null,
      actualEndTime: null,
      createdBy: hostUserId,
      maxParticipants: input.maxParticipants || 2,
      sharedCodeContent: '// Welcome to your Peer Mock Interview\n// Write your solution below:\n\n',
      codeLanguage: input.codeLanguage || 'javascript',
      sharedWhiteboardState: {},
      rubricTemplate: {
        technicalWeight: 0.35,
        communicationWeight: 0.25,
        problemSolvingWeight: 0.25,
        codeQualityWeight: 0.15
      },
      createdAt: now,
      updatedAt: now
    };

    this.rooms.set(roomId, roomRecord);
    this.roomsByCode.set(`${tenantId}:${roomCode}`, roomId);

    // Auto-register host participant
    const hostRole = input.mode === 'STRUCTURED_INTERVIEW' ? 'INTERVIEWER' : 'PEER';
    const hostParticipantId = crypto.randomUUID();
    const hostParticipant: PeerInterviewParticipant = {
      id: hostParticipantId,
      tenantId,
      roomId,
      userId: hostUserId,
      studentId: null,
      role: hostRole,
      joinedAt: now,
      leftAt: null,
      connectionStatus: 'CONNECTED',
      cameraEnabled: false,
      micEnabled: false,
      screenShareEnabled: false
    };
    this.participants.set(hostParticipantId, hostParticipant);

    // Populate questions (custom or curated question bank)
    const questionsToInsert =
      input.initialQuestions && input.initialQuestions.length > 0
        ? input.initialQuestions
        : DEFAULT_QUESTION_BANK[input.interviewType] || DEFAULT_QUESTION_BANK.TECHNICAL;

    let order = 0;
    for (const q of questionsToInsert as any[]) {
      const qId = crypto.randomUUID();
      const questionRecord: PeerInterviewQuestion = {
        id: qId,
        tenantId,
        roomId,
        questionTitle: q.questionTitle || q.title || 'Technical Question',
        questionDescription: q.questionDescription || q.description || '',
        difficulty: q.difficulty || input.difficulty || 'MEDIUM',
        category: q.category || input.interviewType,
        standardAnswer: q.standardAnswer || 'Standard answer key available to interviewer.',
        codeTemplate: q.codeTemplate || '',
        orderIndex: order++,
        isCompleted: false,
        completedAt: null,
        createdAt: now
      };
      this.questions.set(qId, questionRecord);
    }

    try {
      const db = getDb();
      await db.insert(schema.peerInterviewRooms).values(roomRecord as any);
      await db.insert(schema.peerInterviewParticipants).values(hostParticipant as any);
    } catch {
      // Offline fallback
    }

    return roomRecord;
  }

  /**
   * Discover available marketplace rooms for peer matching
   */
  public async discoverMarketplaceRooms(
    tenantId: string,
    filters?: {
      interviewType?: PeerInterviewType;
      mode?: PeerInterviewMode;
      difficulty?: string;
    }
  ): Promise<Array<PeerInterviewRoom & { participantCount: number }>> {
    const list: Array<PeerInterviewRoom & { participantCount: number }> = [];

    for (const room of this.rooms.values()) {
      if (room.tenantId !== tenantId) continue;
      if (room.status !== 'SCHEDULED' && room.status !== 'IN_PROGRESS') continue;

      if (filters?.interviewType && room.interviewType !== filters.interviewType) continue;
      if (filters?.mode && room.mode !== filters.mode) continue;

      // Count active participants
      let count = 0;
      for (const p of this.participants.values()) {
        if (p.roomId === room.id && p.leftAt === null) {
          count++;
        }
      }

      // Filter out full rooms
      if (count >= room.maxParticipants) continue;

      list.push({
        ...room,
        participantCount: count
      });
    }

    return list.sort(
      (a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
    );
  }

  /**
   * Get single room details, participants, and sanitized questions
   *
   * SECURITY GUARANTEE:
   * During Mode A (STRUCTURED_INTERVIEW), the candidate NEVER sees standardAnswer!
   */
  public async getRoomDetails(
    tenantId: string,
    roomIdOrCode: string,
    requestingUserId: string
  ): Promise<{
    room: PeerInterviewRoom;
    participants: PeerInterviewParticipant[];
    questions: Array<Omit<PeerInterviewQuestion, 'standardAnswer'> & { standardAnswer?: string | null }>;
  }> {
    let room = this.rooms.get(roomIdOrCode);
    if (!room) {
      const id = this.roomsByCode.get(`${tenantId}:${roomIdOrCode.toUpperCase()}`);
      if (id) room = this.rooms.get(id);
    }

    if (!room || room.tenantId !== tenantId) {
      throw new Error(`Peer interview room ${roomIdOrCode} not found in tenant.`);
    }

    // Get participants
    const participants: PeerInterviewParticipant[] = [];
    let isInterviewer = false;

    for (const p of this.participants.values()) {
      if (p.roomId === room.id) {
        participants.push(p);
        if (p.userId === requestingUserId && p.role === 'INTERVIEWER') {
          isInterviewer = true;
        }
      }
    }

    // Get questions & sanitize standardAnswer for candidate
    const questions: Array<Omit<PeerInterviewQuestion, 'standardAnswer'> & { standardAnswer?: string | null }> = [];
    for (const q of this.questions.values()) {
      if (q.roomId === room.id) {
        if (room.mode === 'STRUCTURED_INTERVIEW' && !isInterviewer) {
          // Hide standard answer from candidate!
          questions.push({
            ...q,
            standardAnswer: null
          });
        } else {
          questions.push(q);
        }
      }
    }

    questions.sort((a, b) => a.orderIndex - b.orderIndex);

    return { room, participants, questions };
  }

  /**
   * Join an interview room (via marketplace or private code)
   */
  public async joinRoom(
    tenantId: string,
    roomIdOrCode: string,
    userId: string,
    studentId?: string
  ): Promise<{ room: PeerInterviewRoom; participant: PeerInterviewParticipant }> {
    let room = this.rooms.get(roomIdOrCode);
    if (!room) {
      const id = this.roomsByCode.get(`${tenantId}:${roomIdOrCode.toUpperCase()}`);
      if (id) room = this.rooms.get(id);
    }

    if (!room || room.tenantId !== tenantId) {
      throw new Error(`Peer interview room ${roomIdOrCode} not found.`);
    }

    if (room.status === 'COMPLETED' || room.status === 'CANCELLED') {
      throw new Error(`Cannot join room in status ${room.status}.`);
    }

    // Moderation check: ensure user is not blocked by existing participants
    for (const p of this.participants.values()) {
      if (p.roomId === room.id && p.leftAt === null) {
        const isBlocked = await moderationService.isBlocked(tenantId, userId, p.userId);
        if (isBlocked) {
          throw new Error('Access denied: Interaction is restricted with a room participant.');
        }
      }
    }

    // Check if user already joined
    for (const p of this.participants.values()) {
      if (p.roomId === room.id && p.userId === userId) {
        p.leftAt = null;
        p.connectionStatus = 'CONNECTED';
        return { room, participant: p };
      }
    }

    // Check capacity
    let activeCount = 0;
    let hasInterviewer = false;
    for (const p of this.participants.values()) {
      if (p.roomId === room.id && p.leftAt === null) {
        activeCount++;
        if (p.role === 'INTERVIEWER') hasInterviewer = true;
      }
    }

    if (activeCount >= room.maxParticipants) {
      throw new Error('This interview room has reached maximum participant capacity.');
    }

    const assignedRole =
      room.mode === 'STRUCTURED_INTERVIEW'
        ? hasInterviewer
          ? 'CANDIDATE'
          : 'INTERVIEWER'
        : 'PEER';

    const participantId = crypto.randomUUID();
    const now = new Date();
    const newParticipant: PeerInterviewParticipant = {
      id: participantId,
      tenantId,
      roomId: room.id,
      userId,
      studentId: studentId || null,
      role: assignedRole,
      joinedAt: now,
      leftAt: null,
      connectionStatus: 'CONNECTED',
      cameraEnabled: false,
      micEnabled: false,
      screenShareEnabled: false
    };

    this.participants.set(participantId, newParticipant);

    // If room was SCHEDULED, mark as IN_PROGRESS
    if (room.status === 'SCHEDULED' && activeCount + 1 >= 2) {
      room.status = 'IN_PROGRESS';
      room.actualStartTime = now;
      this.rooms.set(room.id, room);
    }

    try {
      const db = getDb();
      await db.insert(schema.peerInterviewParticipants).values(newParticipant as any);
    } catch {
      // Fallback
    }

    return { room, participant: newParticipant };
  }

  /**
   * Leave interview room
   */
  public async leaveRoom(tenantId: string, roomId: string, userId: string): Promise<void> {
    for (const p of this.participants.values()) {
      if (p.roomId === roomId && p.userId === userId && p.tenantId === tenantId) {
        p.leftAt = new Date();
        p.connectionStatus = 'DISCONNECTED';
        this.participants.set(p.id, p);

        try {
          const db = getDb();
          await db
            .update(schema.peerInterviewParticipants)
            .set({ leftAt: new Date(), connectionStatus: 'DISCONNECTED' })
            .where(eq(schema.peerInterviewParticipants.id, p.id));
        } catch {
          // Fallback
        }
      }
    }
  }

  /**
   * Switch roles between interviewer and candidate (Mode A only)
   */
  public async switchRoles(
    tenantId: string,
    roomId: string,
    requestingUserId: string
  ): Promise<PeerInterviewParticipant[]> {
    const room = this.rooms.get(roomId);
    if (!room || room.tenantId !== tenantId) {
      throw new Error('Room not found.');
    }
    if (room.mode !== 'STRUCTURED_INTERVIEW') {
      throw new Error('Role switching is only supported in Mode A: Structured Interview.');
    }

    const roomParticipants: PeerInterviewParticipant[] = [];
    for (const p of this.participants.values()) {
      if (p.roomId === roomId && p.leftAt === null) {
        roomParticipants.push(p);
      }
    }

    if (roomParticipants.length !== 2) {
      throw new Error('Role switching requires exactly 2 active participants in the room.');
    }

    // Swap roles
    const p1 = roomParticipants[0];
    const p2 = roomParticipants[1];

    const temp = p1.role;
    p1.role = p2.role;
    p2.role = temp;

    this.participants.set(p1.id, p1);
    this.participants.set(p2.id, p2);

    return [p1, p2];
  }

  /**
   * Complete interview session
   */
  public async completeInterview(
    tenantId: string,
    roomId: string,
    requestingUserId: string
  ): Promise<PeerInterviewRoom> {
    const room = this.rooms.get(roomId);
    if (!room || room.tenantId !== tenantId) {
      throw new Error('Interview room not found.');
    }

    const now = new Date();
    room.status = 'COMPLETED';
    room.actualEndTime = now;
    room.updatedAt = now;

    this.rooms.set(roomId, room);

    try {
      const db = getDb();
      await db
        .update(schema.peerInterviewRooms)
        .set({
          status: 'COMPLETED',
          actualEndTime: now,
          updatedAt: now
        })
        .where(
          and(
            eq(schema.peerInterviewRooms.id, roomId),
            eq(schema.peerInterviewRooms.tenantId, tenantId)
          )
        );
    } catch {
      // Fallback
    }

    return room;
  }

  // ==========================================================================
  // 2. Structured Constructive Feedback Rubric
  // ==========================================================================

  /**
   * Submit structured constructive peer feedback
   *
   * CRITICAL GUARANTEE:
   * Returns isPeerProvidedLabel: true. Peer mock interview evaluation must NEVER
   * be classified as official certification or verified skill.
   */
  public async submitFeedback(
    tenantId: string,
    evaluatorUserId: string,
    input: SubmitPeerFeedbackInput
  ): Promise<PeerFeedbackResult> {
    const room = this.rooms.get(input.roomId);
    if (!room || room.tenantId !== tenantId) {
      throw new Error(`Peer interview room ${input.roomId} not found.`);
    }

    if (evaluatorUserId === input.evaluateeUserId) {
      throw new Error('Cannot evaluate yourself in peer interview feedback.');
    }

    // Validate scores between 1 and 5
    const scores = [
      input.overallRating,
      input.technicalScore,
      input.communicationScore,
      input.problemSolvingScore,
      input.codeQualityScore
    ];
    for (const score of scores) {
      if (score < 1 || score > 5) {
        throw new Error('All rubric scores must be between 1 and 5.');
      }
    }

    const feedbackId = crypto.randomUUID();
    const now = new Date();

    const feedbackRecord: PeerInterviewFeedback = {
      id: feedbackId,
      tenantId,
      roomId: input.roomId,
      evaluatorUserId,
      evaluateeUserId: input.evaluateeUserId,
      overallRating: input.overallRating,
      technicalScore: input.technicalScore,
      communicationScore: input.communicationScore,
      problemSolvingScore: input.problemSolvingScore,
      codeQualityScore: input.codeQualityScore,
      detailedRubricScores: input.detailedRubricScores || {},
      strengthsText: input.strengthsText || '',
      improvementsText: input.improvementsText || '',
      generalFeedback: input.generalFeedback || '',
      createdAt: now,
      updatedAt: now
    };

    this.feedbacks.set(feedbackId, feedbackRecord);

    try {
      const db = getDb();
      await db.insert(schema.peerInterviewFeedback).values(feedbackRecord as any);
    } catch {
      // Fallback
    }

    return {
      ...feedbackRecord,
      isPeerProvidedLabel: true
    };
  }

  /**
   * Get user's interview history (both as candidate and interviewer)
   */
  public async getUserInterviewHistory(
    tenantId: string,
    userId: string
  ): Promise<Array<PeerInterviewRoom & { role: string; feedbackReceived?: PeerFeedbackResult | null }>> {
    const history: Array<PeerInterviewRoom & { role: string; feedbackReceived?: PeerFeedbackResult | null }> = [];

    for (const p of this.participants.values()) {
      if (p.tenantId === tenantId && p.userId === userId) {
        const room = this.rooms.get(p.roomId);
        if (room) {
          // Find feedback received by user for this room
          let fb: PeerFeedbackResult | null = null;
          for (const f of this.feedbacks.values()) {
            if (f.roomId === room.id && f.evaluateeUserId === userId) {
              fb = { ...f, isPeerProvidedLabel: true };
              break;
            }
          }

          history.push({
            ...room,
            role: p.role,
            feedbackReceived: fb
          });
        }
      }
    }

    return history.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const peerInterviewService = PeerInterviewService.getInstance();
