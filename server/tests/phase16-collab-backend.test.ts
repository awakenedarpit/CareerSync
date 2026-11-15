/**
 * CarrerSync Phase 16 — Alumni Mentorship, Peer Mock Interviews & Realtime Collaboration Backend Tests
 *
 * Comprehensive unit & integration test suite validating:
 * 1. Alumni Profile Lifecycle & TPO Verification Workflow
 * 2. Mentor Directory Discovery, Multi-faceted Filtering & Privacy Guarantees (Zero PII)
 * 3. Mentorship Request State Machine, Duplicate Prevention & Session Feedback
 * 4. Peer Mock Interview Engine, Role Switching, Question Bank & Hidden Answer Keys
 * 5. Structured Constructive Feedback Rubric & isPeerProvidedLabel Disclaimer
 * 6. Real-Time Collaboration Study Rooms across 9 Disciplines
 * 7. Shared Notes Versioning & Optimistic Concurrency Conflict Protection (409)
 * 8. Task Checklist & In-Room Chat Stream
 * 9. Moderation Reporting, Participant Blocking & TPO Safety Triage
 * 10. Self-Hosted WebSocket Realtime Server & WebRTC Signaling Relay
 * 11. REST API Endpoints & Role-Based Access Control (RBAC)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import http from 'http';
import { WebSocket } from 'ws';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import { alumniService } from '../src/alumni/alumni.service';
import { peerInterviewService } from '../src/peer-interview/peer-interview.service';
import { collaborationService } from '../src/collaboration/collaboration.service';
import { moderationService } from '../src/moderation/moderation.service';
import { realtimeWebSocketServer } from '../src/realtime/websocket.server';

describe('Phase 16 — Collaboration, Alumni Mentorship & Peer Interview Backend Engine', () => {
  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';

  // Test User Identities
  const tpoUserA = {
    id: 'a1111111-1111-4111-8111-111111111111',
    email: 'tpo.alpha@college.edu',
    role: 'TPO_ADMIN',
    tenantId: TENANT_A
  };

  const alumniUserA1 = {
    id: 'al111111-1111-4111-8111-111111111111',
    email: 'priya.sharma@alumni.edu',
    role: 'ALUMNI',
    tenantId: TENANT_A
  };

  const alumniUserA2 = {
    id: 'al222222-2222-4222-8222-222222222222',
    email: 'rohit.verma@alumni.edu',
    role: 'ALUMNI',
    tenantId: TENANT_A
  };

  const studentUserA1 = {
    id: 's1111111-1111-4111-8111-111111111111',
    email: 'aarav.patel@college.edu',
    role: 'STUDENT',
    tenantId: TENANT_A
  };

  const studentUserA2 = {
    id: 's2222222-2222-4222-8222-222222222222',
    email: 'diya.nair@college.edu',
    role: 'STUDENT',
    tenantId: TENANT_A
  };

  const studentUserB = {
    id: 'sb111111-1111-4111-8111-111111111111',
    email: 'cross.tenant@othercollege.edu',
    role: 'STUDENT',
    tenantId: TENANT_B
  };

  // JWT Tokens
  let tpoTokenA: string;
  let alumniTokenA1: string;
  let alumniTokenA2: string;
  let studentTokenA1: string;
  let studentTokenA2: string;
  let studentTokenB: string;

  beforeEach(async () => {
    alumniService.clear();
    peerInterviewService.clear();
    collaborationService.clear();
    moderationService.clear();

    tpoTokenA = await createJwtToken({
      sub: tpoUserA.id,
      tenant_id: tpoUserA.tenantId,
      role: tpoUserA.role,
      email: tpoUserA.email
    });

    alumniTokenA1 = await createJwtToken({
      sub: alumniUserA1.id,
      tenant_id: alumniUserA1.tenantId,
      role: alumniUserA1.role,
      email: alumniUserA1.email
    });

    alumniTokenA2 = await createJwtToken({
      sub: alumniUserA2.id,
      tenant_id: alumniUserA2.tenantId,
      role: alumniUserA2.role,
      email: alumniUserA2.email
    });

    studentTokenA1 = await createJwtToken({
      sub: studentUserA1.id,
      tenant_id: studentUserA1.tenantId,
      role: studentUserA1.role,
      email: studentUserA1.email
    });

    studentTokenA2 = await createJwtToken({
      sub: studentUserA2.id,
      tenant_id: studentUserA2.tenantId,
      role: studentUserA2.role,
      email: studentUserA2.email
    });

    studentTokenB = await createJwtToken({
      sub: studentUserB.id,
      tenant_id: studentUserB.tenantId,
      role: studentUserB.role,
      email: studentUserB.email
    });
  });

  // ==========================================================================
  // Track 1: Alumni Profile Lifecycle & TPO Verification Workflow
  // ==========================================================================
  describe('1. Alumni Profile Lifecycle & TPO Verification Workflow', () => {
    it('creates alumni profile with initial status PENDING', async () => {
      const profile = await alumniService.createOrUpdateProfile(TENANT_A, alumniUserA1.id, {
        currentCompany: 'Google',
        currentRole: 'Senior Software Engineer',
        industryDomain: 'Cloud & AI Infrastructure',
        graduationYear: 2021,
        department: 'Computer Science and Engineering',
        skills: ['Distributed Systems', 'Go', 'Kubernetes', 'TypeScript'],
        totalExperienceYears: 5
      });

      expect(profile).toBeDefined();
      expect(profile.verificationStatus).toBe('PENDING');
      expect(profile.verifiedBy).toBeNull();
      expect(profile.currentCompany).toBe('Google');
    });

    it('allows TPO Admin to verify alumni profile with audit logging', async () => {
      const profile = await alumniService.createOrUpdateProfile(TENANT_A, alumniUserA1.id, {
        currentCompany: 'Microsoft',
        currentRole: 'Cloud Architect',
        graduationYear: 2020
      });

      const verified = await alumniService.verifyAlumni(
        TENANT_A,
        profile.id,
        tpoUserA.id,
        'Identity confirmed via institutional convocation roll.'
      );

      expect(verified.verificationStatus).toBe('VERIFIED');
      expect(verified.verifiedBy).toBe(tpoUserA.id);
      expect(verified.verifiedAt).toBeInstanceOf(Date);
      expect(verified.verificationNotes).toContain('Identity confirmed');
    });

    it('allows TPO Admin to reject or suspend an alumni profile', async () => {
      const profile = await alumniService.createOrUpdateProfile(TENANT_A, alumniUserA2.id, {
        currentCompany: 'Startup Inc',
        currentRole: 'Engineer'
      });

      const rejected = await alumniService.rejectAlumni(
        TENANT_A,
        profile.id,
        tpoUserA.id,
        'Incomplete alumni credentials.'
      );
      expect(rejected.verificationStatus).toBe('REJECTED');

      const suspended = await alumniService.suspendAlumni(
        TENANT_A,
        profile.id,
        tpoUserA.id,
        'Mentorship conduct violation.'
      );
      expect(suspended.verificationStatus).toBe('SUSPENDED');
    });

    it('rejects student attempting to verify alumni with 403 Forbidden', async () => {
      const profile = await alumniService.createOrUpdateProfile(TENANT_A, alumniUserA1.id, {
        currentCompany: 'Amazon',
        currentRole: 'SDE II'
      });

      const res = await request(app)
        .post(`/api/v1/alumni/${profile.id}/verify`)
        .set('Authorization', `Bearer ${studentTokenA1}`)
        .send({ notes: 'Student self-verification attempt' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('TPO_AUTHORITY_REQUIRED');
    });
  });

  // ==========================================================================
  // Track 2: Mentor Directory Discovery, Filtering & Privacy
  // ==========================================================================
  describe('2. Mentor Directory Discovery & Zero-PII Privacy', () => {
    beforeEach(async () => {
      // 1 verified mentor
      const p1 = await alumniService.createOrUpdateProfile(TENANT_A, alumniUserA1.id, {
        currentCompany: 'Google',
        currentRole: 'Senior SDE',
        industryDomain: 'Fintech',
        department: 'Computer Science',
        graduationYear: 2022,
        skills: ['React', 'Node.js', 'System Design'],
        mentorshipEnabled: true
      });
      await alumniService.verifyAlumni(TENANT_A, p1.id, tpoUserA.id);

      // 1 unverified mentor (PENDING)
      await alumniService.createOrUpdateProfile(TENANT_A, alumniUserA2.id, {
        currentCompany: 'Stripe',
        currentRole: 'Backend Engineer',
        industryDomain: 'Fintech',
        skills: ['Python', 'Postgres'],
        mentorshipEnabled: true
      });
    });

    it('guarantees unverified alumni NEVER appear in mentor discovery directory', async () => {
      const mentors = await alumniService.discoverMentors(TENANT_A);
      expect(mentors.length).toBe(1);
      expect(mentors[0].profile.userId).toBe(alumniUserA1.id);
      expect(mentors[0].profile.verificationStatus).toBe('VERIFIED');
    });

    it('computes explainable recommendation matching scores with zero protected attributes', async () => {
      const results = await alumniService.discoverMentors(TENANT_A, {
        studentInterests: ['React', 'System Design'],
        studentTargetRole: 'Senior SDE',
        studentDepartment: 'Computer Science'
      });

      expect(results.length).toBe(1);
      const match = results[0];
      expect(match.matchScore).toBeGreaterThan(60);
      expect(match.matchReasons.length).toBeGreaterThanOrEqual(1);
      expect(match.matchReasons.some((r) => r.includes('target skills'))).toBe(true);
    });

    it('enforces platform-mediated communication: zero exposure of private email or phone numbers to students', async () => {
      const res = await request(app)
        .get('/api/v1/alumni')
        .set('Authorization', `Bearer ${studentTokenA1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);

      const mentor = res.body.data[0].profile;
      expect(mentor.email).toBeUndefined();
      expect(mentor.phone).toBeUndefined();
    });
  });

  // ==========================================================================
  // Track 3: Mentorship Request State Machine & Duplicate Prevention
  // ==========================================================================
  describe('3. Mentorship Request State Machine & Duplicate Prevention', () => {
    let verifiedProfileId: string;

    beforeEach(async () => {
      const p = await alumniService.createOrUpdateProfile(TENANT_A, alumniUserA1.id, {
        currentCompany: 'Meta',
        currentRole: 'Staff Engineer'
      });
      const verified = await alumniService.verifyAlumni(TENANT_A, p.id, tpoUserA.id);
      verifiedProfileId = verified.id;
    });

    it('allows student to send mentorship request transitioning to PENDING', async () => {
      const req = await alumniService.createRequest(TENANT_A, studentUserA1.id, undefined, {
        mentorUserId: alumniUserA1.id,
        alumniProfileId: verifiedProfileId,
        topic: 'Resume Review & System Design Guidance',
        message: 'Looking for advice on preparing for Big Tech backend interviews.'
      });

      expect(req).toBeDefined();
      expect(req.status).toBe('PENDING');
      expect(req.studentUserId).toBe(studentUserA1.id);
      expect(req.mentorUserId).toBe(alumniUserA1.id);
    });

    it('prevents duplicate active request between same student and mentor', async () => {
      await alumniService.createRequest(TENANT_A, studentUserA1.id, undefined, {
        mentorUserId: alumniUserA1.id,
        alumniProfileId: verifiedProfileId,
        topic: 'Career Transition',
        message: 'First inquiry.'
      });

      // Second active request must fail
      await expect(
        alumniService.createRequest(TENANT_A, studentUserA1.id, undefined, {
          mentorUserId: alumniUserA1.id,
          alumniProfileId: verifiedProfileId,
          topic: 'System Design',
          message: 'Second inquiry.'
        })
      ).rejects.toThrow('An active mentorship request already exists');
    });

    it('executes full request state machine: PENDING -> ACCEPTED -> RESCHEDULE_REQUESTED -> CANCELLED', async () => {
      const req = await alumniService.createRequest(TENANT_A, studentUserA1.id, undefined, {
        mentorUserId: alumniUserA1.id,
        alumniProfileId: verifiedProfileId,
        topic: 'Mock Interview Prep',
        message: 'Can we connect this weekend?'
      });

      // 1. Accept
      const accepted = await alumniService.updateRequestStatus(
        TENANT_A,
        req.id,
        alumniUserA1.id,
        'ACCEPT'
      );
      expect(accepted.status).toBe('ACCEPTED');

      // 2. Reschedule
      const rescheduled = await alumniService.updateRequestStatus(
        TENANT_A,
        req.id,
        studentUserA1.id,
        'RESCHEDULE',
        { rescheduleNote: 'Need to shift by 1 hour due to lab exam.' }
      );
      expect(rescheduled.status).toBe('RESCHEDULE_REQUESTED');

      // 3. Cancel
      const cancelled = await alumniService.updateRequestStatus(
        TENANT_A,
        req.id,
        studentUserA1.id,
        'CANCEL'
      );
      expect(cancelled.status).toBe('CANCELLED');
    });

    it('schedules session, marks completed, and records structured feedback', async () => {
      const req = await alumniService.createRequest(TENANT_A, studentUserA1.id, undefined, {
        mentorUserId: alumniUserA1.id,
        alumniProfileId: verifiedProfileId,
        topic: 'Full-stack Portfolio Audit',
        message: 'Review my GitHub projects.'
      });
      await alumniService.updateRequestStatus(TENANT_A, req.id, alumniUserA1.id, 'ACCEPT');

      const session = await alumniService.createSession(TENANT_A, alumniUserA1.id, {
        requestId: req.id,
        alumniProfileId: verifiedProfileId,
        mentorUserId: alumniUserA1.id,
        studentUserId: studentUserA1.id,
        scheduledAt: new Date(Date.now() + 86400000),
        durationMinutes: 45
      });
      expect(session.status).toBe('SCHEDULED');

      const completed = await alumniService.completeSession(TENANT_A, session.id, alumniUserA1.id, {
        alumniNotes: 'Candidate demonstrated strong React knowledge.',
        actionItems: 'Refactor state management using Redux Toolkit.'
      });
      expect(completed.status).toBe('COMPLETED');

      const feedback = await alumniService.submitFeedback(TENANT_A, studentUserA1.id, {
        sessionId: session.id,
        feedbackTarget: 'ALUMNI',
        rating: 5,
        feedbackText: 'Exceptional guidance on architecture and interview readiness!'
      });
      expect(feedback.rating).toBe(5);
    });
  });

  // ==========================================================================
  // Track 4: Peer Mock Interview Engine & Question Bank Security
  // ==========================================================================
  describe('4. Peer Mock Interview Engine & Answer Key Protection', () => {
    it('creates peer interview room and auto-registers host as INTERVIEWER in Mode A', async () => {
      const room = await peerInterviewService.createRoom(TENANT_A, studentUserA1.id, {
        title: 'DSA: Graphs & Dynamic Programming Mock',
        interviewType: 'TECHNICAL',
        mode: 'STRUCTURED_INTERVIEW',
        difficulty: 'MEDIUM'
      });

      expect(room).toBeDefined();
      expect(room.mode).toBe('STRUCTURED_INTERVIEW');
      expect(room.status).toBe('SCHEDULED');

      const details = await peerInterviewService.getRoomDetails(TENANT_A, room.id, studentUserA1.id);
      expect(details.participants.length).toBe(1);
      expect(details.participants[0].role).toBe('INTERVIEWER');
    });

    it('security guarantee: candidate NEVER sees standardAnswer during active Mode A assessment', async () => {
      const room = await peerInterviewService.createRoom(TENANT_A, studentUserA1.id, {
        title: 'Backend Systems Mock',
        interviewType: 'TECHNICAL',
        mode: 'STRUCTURED_INTERVIEW',
        initialQuestions: [
          {
            questionTitle: 'Reverse Linked List',
            questionDescription: 'Reverse a singly linked list in-place.',
            standardAnswer: 'Iterative pointer reversal: prev, curr, next. O(1) space.'
          }
        ]
      });

      // Student 2 joins as candidate
      await peerInterviewService.joinRoom(TENANT_A, room.id, studentUserA2.id);

      // Interviewer perspective: sees answer key
      const interviewerPerspective = await peerInterviewService.getRoomDetails(
        TENANT_A,
        room.id,
        studentUserA1.id
      );
      expect(interviewerPerspective.questions[0].standardAnswer).toContain('Iterative pointer reversal');

      // Candidate perspective: answer key is hidden!
      const candidatePerspective = await peerInterviewService.getRoomDetails(
        TENANT_A,
        room.id,
        studentUserA2.id
      );
      expect(candidatePerspective.questions[0].standardAnswer).toBeNull();
    });

    it('allows role switching in Mode A between interviewer and candidate', async () => {
      const room = await peerInterviewService.createRoom(TENANT_A, studentUserA1.id, {
        title: 'System Design Practice',
        interviewType: 'SYSTEM_DESIGN',
        mode: 'STRUCTURED_INTERVIEW'
      });
      await peerInterviewService.joinRoom(TENANT_A, room.id, studentUserA2.id);

      const switched = await peerInterviewService.switchRoles(TENANT_A, room.id, studentUserA1.id);
      const student1 = switched.find((p) => p.userId === studentUserA1.id);
      const student2 = switched.find((p) => p.userId === studentUserA2.id);

      expect(student1?.role).toBe('CANDIDATE');
      expect(student2?.role).toBe('INTERVIEWER');
    });

    it('structured feedback rubric guarantees isPeerProvidedLabel: true disclaimer', async () => {
      const room = await peerInterviewService.createRoom(TENANT_A, studentUserA1.id, {
        title: 'Behavioral HR Mock',
        interviewType: 'HR',
        mode: 'STRUCTURED_INTERVIEW'
      });
      await peerInterviewService.joinRoom(TENANT_A, room.id, studentUserA2.id);

      const feedback = await peerInterviewService.submitFeedback(TENANT_A, studentUserA1.id, {
        roomId: room.id,
        evaluateeUserId: studentUserA2.id,
        overallRating: 4,
        technicalScore: 4,
        communicationScore: 5,
        problemSolvingScore: 4,
        codeQualityScore: 4,
        strengthsText: 'Clear articulation using the STAR methodology.',
        improvementsText: 'Be more concise on situational background.'
      });

      expect(feedback.isPeerProvidedLabel).toBe(true);
      expect(feedback.communicationScore).toBe(5);
    });
  });

  // ==========================================================================
  // Track 5: Real-Time Collaboration Study Rooms & Shared Notes Versioning
  // ==========================================================================
  describe('5. Collaboration Study Rooms & Notes Concurrency Protection', () => {
    it('creates collaboration room in DSA category and tracks membership', async () => {
      const room = await collaborationService.createRoom(TENANT_A, studentUserA1.id, {
        name: 'LeetCode 75 Sprint Pod',
        category: 'DSA',
        description: 'Daily grinding of trees and dynamic programming.'
      });

      expect(room.category).toBe('DSA');
      expect(room.activeMemberCount).toBe(1);

      await collaborationService.joinRoom(TENANT_A, room.id, studentUserA2.id);
      const details = await collaborationService.getRoomDetails(TENANT_A, room.id, studentUserA2.id);
      expect(details.participants.length).toBe(2);
    });

    it('rejects unauthorized join to private room with invalid passcode', async () => {
      const privateRoom = await collaborationService.createRoom(TENANT_A, studentUserA1.id, {
        name: 'Private Capstone Group',
        category: 'PROJECT',
        isPrivate: true,
        passcode: 'SECRET_42'
      });

      await expect(
        collaborationService.joinRoom(TENANT_A, privateRoom.id, studentUserA2.id, 'WRONG_CODE')
      ).rejects.toThrow('Invalid room passcode');
    });

    it('enforces notes optimistic concurrency: rejects conflicting edits with 409 Conflict', async () => {
      const room = await collaborationService.createRoom(TENANT_A, studentUserA1.id, {
        name: 'Web Dev Full-Stack Notes',
        category: 'WEB_DEV'
      });

      // Update 1: Version 1 -> Version 2
      const update1 = await collaborationService.updateNotes(TENANT_A, room.id, studentUserA1.id, {
        content: '# React Server Components Overview\nDetailed notes...',
        expectedVersion: 1
      });
      expect(update1.version).toBe(2);

      // Concurrent Update 2: Still presenting expectedVersion: 1 -> MUST BE REJECTED WITH 409 CONFLICT!
      await expect(
        collaborationService.updateNotes(TENANT_A, room.id, studentUserA2.id, {
          content: 'Conflicting simultaneous overwrite...',
          expectedVersion: 1
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'VERSION_CONFLICT',
        currentVersion: 2
      });
    });

    it('manages task checklists and in-room chat messages', async () => {
      const room = await collaborationService.createRoom(TENANT_A, studentUserA1.id, {
        name: 'Database Architecture Study Group',
        category: 'DATABASE'
      });

      // Add task
      const task = await collaborationService.createTask(TENANT_A, room.id, studentUserA1.id, {
        title: 'Read ACID properties chapter in Designing Data-Intensive Applications',
        priority: 'HIGH'
      });
      expect(task.status).toBe('TODO');

      // Complete task
      const completedTask = await collaborationService.updateTask(
        TENANT_A,
        task.id,
        studentUserA1.id,
        { status: 'COMPLETED' }
      );
      expect(completedTask.status).toBe('COMPLETED');
      expect(completedTask.completedAt).toBeInstanceOf(Date);

      // Send chat message with code snippet
      const chat = await collaborationService.sendMessage(TENANT_A, room.id, studentUserA1.id, {
        content: 'Check out this indexing strategy:',
        messageType: 'CODE',
        codeSnippetJson: {
          language: 'sql',
          code: 'CREATE INDEX CONCURRENTLY ix_users_email ON users(email);'
        }
      });
      expect(chat.messageType).toBe('CODE');

      const messages = await collaborationService.getMessages(TENANT_A, room.id);
      expect(messages.length).toBe(1);
    });
  });

  // ==========================================================================
  // Track 6: Safety, Participant Moderation & Blocking
  // ==========================================================================
  describe('6. Safety, Moderation Queue & Participant Blocking', () => {
    it('submits moderation report against inappropriate behavior', async () => {
      const report = await moderationService.createReport(TENANT_A, studentUserA1.id, {
        reportedUserId: studentUserA2.id,
        entityType: 'PEER_INTERVIEW',
        entityId: 'room-123',
        reason: 'INAPPROPRIATE_BEHAVIOR',
        description: 'Offensive language during mock interview session.'
      });

      expect(report.status).toBe('PENDING_REVIEW');
      expect(report.reportedUserId).toBe(studentUserA2.id);
    });

    it('enforces participant blocking: prevents blocked user from interacting', async () => {
      await moderationService.blockParticipant(
        TENANT_A,
        alumniUserA1.id,
        studentUserA2.id,
        'Harassment in chat'
      );

      const isBlocked = await moderationService.isBlocked(
        TENANT_A,
        studentUserA2.id,
        alumniUserA1.id
      );
      expect(isBlocked).toBe(true);

      // Blocked student cannot send mentorship request to this alumni
      const p = await alumniService.createOrUpdateProfile(TENANT_A, alumniUserA1.id, {});
      await expect(
        alumniService.createRequest(TENANT_A, studentUserA2.id, undefined, {
          mentorUserId: alumniUserA1.id,
          alumniProfileId: p.id,
          topic: 'Guidance',
          message: 'Hello'
        })
      ).rejects.toThrow('Interaction is blocked');
    });

    it('allows TPO Admin to resolve moderation report and issue enforcement action', async () => {
      const report = await moderationService.createReport(TENANT_A, studentUserA1.id, {
        reportedUserId: studentUserA2.id,
        entityType: 'COLLABORATION_ROOM',
        entityId: 'room-456',
        reason: 'SPAM_PROMOTION',
        description: 'Posting commercial discord links.'
      });

      const { report: resolved, actionRecord } = await moderationService.resolveReport(
        TENANT_A,
        report.id,
        tpoUserA.id,
        {
          status: 'RESOLVED_ACTION_TAKEN',
          actionType: 'WARNING_ISSUED',
          notes: 'First warning issued for spamming.'
        }
      );

      expect(resolved.status).toBe('RESOLVED_ACTION_TAKEN');
      expect(resolved.investigatedBy).toBe(tpoUserA.id);
      expect(actionRecord?.actionType).toBe('WARNING_ISSUED');
    });
  });

  // ==========================================================================
  // Track 7: Self-Hosted WebSocket Realtime Server & WebRTC Relay
  // ==========================================================================
  describe('7. Self-Hosted WebSocket Realtime Server & WebRTC Relay', () => {
    const createMockWs = (userId: string, tenantId: string, role = 'STUDENT') => {
      const sentMessages: any[] = [];
      let isClosed = false;
      let closeCode: number | null = null;

      const mockWs: any = {
        userId,
        tenantId,
        role,
        currentRoomId: null,
        readyState: 1, // OPEN
        send: (data: string) => {
          sentMessages.push(JSON.parse(data));
        },
        close: (code: number) => {
          isClosed = true;
          closeCode = code;
        },
        terminate: () => {
          isClosed = true;
        },
        ping: () => {},
        sentMessages,
        isClosed: () => isClosed,
        closeCode: () => closeCode
      };

      return mockWs;
    };

    beforeEach(() => {
      realtimeWebSocketServer.close();
    });

    afterEach(() => {
      realtimeWebSocketServer.close();
    });

    it('authenticates WebSocket connection via JWT query parameter', async () => {
      const auth = await realtimeWebSocketServer.authenticateConnection({
        url: `/ws?token=${studentTokenA1}`,
        headers: {}
      });

      expect(auth).not.toBeNull();
      expect(auth?.userId).toBe(studentUserA1.id);
      expect(auth?.tenantId).toBe(TENANT_A);
      expect(auth?.role).toBe('STUDENT');
    });

    it('rejects unauthenticated WebSocket connection without token', async () => {
      const auth = await realtimeWebSocketServer.authenticateConnection({
        url: '/ws',
        headers: {}
      });

      expect(auth).toBeNull();
    });

    it('relays WebRTC signaling frames between room participants with zero paid services', async () => {
      const roomId = 'room-mock-789';

      const ws1 = createMockWs(studentUserA1.id, TENANT_A);
      const ws2 = createMockWs(studentUserA2.id, TENANT_A);
      const ws3 = createMockWs(studentUserB.id, TENANT_B); // Cross-tenant user in different room

      realtimeWebSocketServer.registerClient(ws1, {
        userId: studentUserA1.id,
        tenantId: TENANT_A,
        role: 'STUDENT',
        email: studentUserA1.email
      });
      realtimeWebSocketServer.registerClient(ws2, {
        userId: studentUserA2.id,
        tenantId: TENANT_A,
        role: 'STUDENT',
        email: studentUserA2.email
      });
      realtimeWebSocketServer.registerClient(ws3, {
        userId: studentUserB.id,
        tenantId: TENANT_B,
        role: 'STUDENT',
        email: studentUserB.email
      });

      // Join room
      realtimeWebSocketServer.handleMessage(ws1, {
        type: 'JOIN_ROOM',
        payload: { roomId }
      });
      realtimeWebSocketServer.handleMessage(ws2, {
        type: 'JOIN_ROOM',
        payload: { roomId }
      });

      // User 2 received presence of user 1 or join ack
      expect(ws1.sentMessages.some((m: any) => m.type === 'JOIN_ACK')).toBe(true);
      expect(ws2.sentMessages.some((m: any) => m.type === 'JOIN_ACK')).toBe(true);

      // WebRTC offer relay from user 1 to user 2
      realtimeWebSocketServer.handleMessage(ws1, {
        type: 'WEBRTC_SIGNAL',
        payload: {
          targetUserId: studentUserA2.id,
          signalType: 'offer',
          data: { sdp: 'v=0\r\no=alice ...' }
        }
      });

      const signalMsg = ws2.sentMessages.find((m: any) => m.type === 'WEBRTC_SIGNAL');
      expect(signalMsg).toBeDefined();
      expect(signalMsg.payload.fromUserId).toBe(studentUserA1.id);
      expect(signalMsg.payload.signalType).toBe('offer');

      // Security check: ws3 (different tenant/room) received ZERO signals
      expect(ws3.sentMessages.length).toBe(0);
    });
  });

  // ==========================================================================
  // Track 8: REST API Routes & Multi-Tenant RBAC Validation
  // ==========================================================================
  describe('8. REST API Routes & Multi-Tenant RBAC Security', () => {
    it('GET /api/v1/tpo/alumni/analytics requires TPO institutional authority', async () => {
      // Student rejected
      const resForbidden = await request(app)
        .get('/api/v1/tpo/alumni/analytics')
        .set('Authorization', `Bearer ${studentTokenA1}`);
      expect(resForbidden.status).toBe(403);
      expect(resForbidden.body.code).toBe('TPO_AUTHORITY_REQUIRED');

      // TPO Admin permitted
      const resAllowed = await request(app)
        .get('/api/v1/tpo/alumni/analytics')
        .set('Authorization', `Bearer ${tpoTokenA}`);
      expect(resAllowed.status).toBe(200);
      expect(resAllowed.body.success).toBe(true);
      expect(resAllowed.body.data.totalMentors).toBeDefined();
    });

    it('GET /api/v1/tpo/moderation/reports is blocked for students with 403', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/moderation/reports')
        .set('Authorization', `Bearer ${studentTokenA1}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('TPO_AUTHORITY_REQUIRED');
    });

    it('rejects cross-tenant header spoofing with 403 TENANT_SPOOFING_REJECTED', async () => {
      const res = await request(app)
        .get('/api/v1/alumni')
        .set('Authorization', `Bearer ${studentTokenA1}`)
        .set('x-tenant-id', TENANT_B); // Attempting to spoof Tenant B

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('TENANT_SPOOFING_REJECTED');
    });

    it('POST /api/v1/peer-interviews creates room via REST and returns 201', async () => {
      const res = await request(app)
        .post('/api/v1/peer-interviews')
        .set('Authorization', `Bearer ${studentTokenA1}`)
        .send({
          title: 'Full-Stack JavaScript Mock',
          interviewType: 'TECHNICAL',
          mode: 'COLLABORATIVE_PRACTICE'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.roomCode).toContain('PEER-');
    });

    it('PATCH /api/v1/collaboration/rooms/:id/notes enforces version conflict via REST (409)', async () => {
      const room = await collaborationService.createRoom(TENANT_A, studentUserA1.id, {
        name: 'Distributed Systems Study Pod',
        category: 'BACKEND'
      });

      // Legitimate update
      const res1 = await request(app)
        .patch(`/api/v1/collaboration/rooms/${room.id}/notes`)
        .set('Authorization', `Bearer ${studentTokenA1}`)
        .send({ content: 'Initial version 1 notes', expectedVersion: 1 });
      expect(res1.status).toBe(200);
      expect(res1.body.data.version).toBe(2);

      // Stale update (expectedVersion 1 when version is 2)
      const resConflict = await request(app)
        .patch(`/api/v1/collaboration/rooms/${room.id}/notes`)
        .set('Authorization', `Bearer ${studentTokenA2}`)
        .send({ content: 'Stale overwrite', expectedVersion: 1 });

      expect(resConflict.status).toBe(409);
      expect(resConflict.body.code).toBe('VERSION_CONFLICT');
      expect(resConflict.body.currentVersion).toBe(2);
    });
  });
});
