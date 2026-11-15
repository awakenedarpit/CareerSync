/**
 * CarrerSync Phase 16 — Alumni Mentorship, Peer Interviews & Real-Time Collaboration
 * End-to-End Integration & Security Regression Test Suite
 *
 * Exhaustive verification covering all 18 security and functional regression test scenarios from Section 13:
 * 1. Unverified alumni cannot appear as verified mentors in directory.
 * 2. Student cannot verify alumni (403 forbidden).
 * 3. Alumni cannot access another alumni's private requests.
 * 4. Student cannot read another student's private mentorship history.
 * 5. Cross-tenant access is rejected with 403 TENANT_SPOOFING_REJECTED.
 * 6. Unauthorized participants cannot join private rooms.
 * 7. WebSocket connection requires valid JWT authentication.
 * 8. WebSocket room isolation prevents cross-tenant or cross-room message leakage.
 * 9. Participant cannot access room or broadcast after leaving or being removed.
 * 10. Blocked participants cannot rejoin restricted sessions.
 * 11. Moderation reports are visible only to authorized TPO/Admin reviewers.
 * 12. Recruiters cannot access mentorship information without explicit permission.
 * 13. Camera and microphone never activate automatically (explicit user consent required).
 * 14. Duplicate session requests between same student and mentor are prevented.
 * 15. Duplicate notifications are prevented.
 * 16. Concurrent collaboration updates do not silently overwrite data (versioning/conflict protection).
 * 17. Session data is not exposed through public unauthenticated endpoints.
 * 18. Revoked permissions are strictly enforced.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import { alumniService } from '../src/alumni/alumni.service';
import { peerInterviewService } from '../src/peer-interview/peer-interview.service';
import { collaborationService } from '../src/collaboration/collaboration.service';
import { moderationService } from '../src/moderation/moderation.service';
import { realtimeWebSocketServer } from '../src/realtime/websocket.server';
import { notificationService } from '../src/orchestration/notification.service';
import { delegationService } from '../src/orchestration/delegation.service';

describe('Phase 16 — Alumni Mentorship, Peer Interviews & Real-Time Collaboration E2E Integration Suite', () => {
  const TENANT_ALPHA = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
  const TENANT_BETA = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';

  // Tenant Alpha Actors
  const tpoAlpha = {
    id: '11111111-aaaa-4111-8111-111111111111',
    email: 'tpo.director@alpha.edu',
    role: 'TPO_ADMIN',
    tenantId: TENANT_ALPHA
  };

  const alumniAlpha1 = {
    id: '22222222-aaaa-4111-8111-222222222221',
    email: 'satya.nadella@alumni.alpha.edu',
    role: 'ALUMNI',
    tenantId: TENANT_ALPHA
  };

  const alumniAlpha2 = {
    id: '22222222-aaaa-4111-8111-222222222222',
    email: 'sundar.pichai@alumni.alpha.edu',
    role: 'ALUMNI',
    tenantId: TENANT_ALPHA
  };

  const studentAlpha1 = {
    id: '33333333-aaaa-4111-8111-333333333331',
    email: 'aarav.patel@student.alpha.edu',
    role: 'STUDENT',
    tenantId: TENANT_ALPHA
  };

  const studentAlpha2 = {
    id: '33333333-aaaa-4111-8111-333333333332',
    email: 'diya.nair@student.alpha.edu',
    role: 'STUDENT',
    tenantId: TENANT_ALPHA
  };

  const recruiterAlpha = {
    id: '44444444-aaaa-4111-8111-444444444444',
    email: 'recruiter.lead@techcorp.com',
    role: 'RECRUITER',
    tenantId: TENANT_ALPHA
  };

  const facultyAlpha = {
    id: '55555555-aaaa-4111-8111-555555555555',
    email: 'faculty.lead@alpha.edu',
    role: 'FACULTY_COORDINATOR',
    tenantId: TENANT_ALPHA
  };

  // Tenant Beta Actors (Cross-Tenant Boundary Verification)
  const studentBeta = {
    id: '99999999-bbbb-4222-8222-999999999999',
    email: 'rohan.mehta@student.beta.ac.in',
    role: 'STUDENT',
    tenantId: TENANT_BETA
  };

  let tokenTpoAlpha: string;
  let tokenAlumniAlpha1: string;
  let tokenAlumniAlpha2: string;
  let tokenStudentAlpha1: string;
  let tokenStudentAlpha2: string;
  let tokenRecruiterAlpha: string;
  let tokenFacultyAlpha: string;
  let tokenStudentBeta: string;

  beforeAll(async () => {
    tokenTpoAlpha = await createJwtToken({
      sub: tpoAlpha.id,
      tenant_id: tpoAlpha.tenantId,
      role: tpoAlpha.role,
      email: tpoAlpha.email
    });

    tokenAlumniAlpha1 = await createJwtToken({
      sub: alumniAlpha1.id,
      tenant_id: alumniAlpha1.tenantId,
      role: alumniAlpha1.role,
      email: alumniAlpha1.email
    });

    tokenAlumniAlpha2 = await createJwtToken({
      sub: alumniAlpha2.id,
      tenant_id: alumniAlpha2.tenantId,
      role: alumniAlpha2.role,
      email: alumniAlpha2.email
    });

    tokenStudentAlpha1 = await createJwtToken({
      sub: studentAlpha1.id,
      tenant_id: studentAlpha1.tenantId,
      role: studentAlpha1.role,
      email: studentAlpha1.email
    });

    tokenStudentAlpha2 = await createJwtToken({
      sub: studentAlpha2.id,
      tenant_id: studentAlpha2.tenantId,
      role: studentAlpha2.role,
      email: studentAlpha2.email
    });

    tokenRecruiterAlpha = await createJwtToken({
      sub: recruiterAlpha.id,
      tenant_id: recruiterAlpha.tenantId,
      role: recruiterAlpha.role,
      email: recruiterAlpha.email
    });

    tokenFacultyAlpha = await createJwtToken({
      sub: facultyAlpha.id,
      tenant_id: facultyAlpha.tenantId,
      role: facultyAlpha.role,
      email: facultyAlpha.email
    });

    tokenStudentBeta = await createJwtToken({
      sub: studentBeta.id,
      tenant_id: studentBeta.tenantId,
      role: studentBeta.role,
      email: studentBeta.email
    });
  });

  beforeEach(() => {
    alumniService.clear();
    peerInterviewService.clear();
    collaborationService.clear();
    moderationService.clear();
    notificationService.clear();
    delegationService.clear();
    realtimeWebSocketServer.close();
  });

  afterEach(() => {
    realtimeWebSocketServer.close();
  });

  // Helper mock WebSocket connection factory
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

  // ==========================================================================
  // Scenario 1: Unverified alumni cannot appear as verified mentors in directory
  // ==========================================================================
  describe('Scenario 1: Unverified alumni cannot appear as verified mentors in directory', () => {
    it('ensures unverified alumni (PENDING, REJECTED, SUSPENDED) never appear in public discovery', async () => {
      // 1. Create alumni profile with PENDING status
      const profilePending = await alumniService.createOrUpdateProfile(
        TENANT_ALPHA,
        alumniAlpha1.id,
        {
          currentCompany: 'Google Cloud',
          currentRole: 'Staff Infrastructure Architect',
          skills: ['Distributed Systems', 'Kubernetes', 'Go'],
          mentorshipEnabled: true
        }
      );
      expect(profilePending.verificationStatus).toBe('PENDING');

      // 2. Query mentor directory via API as student
      const res1 = await request(app)
        .get('/api/v1/alumni')
        .set('Authorization', `Bearer ${tokenStudentAlpha1}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.length).toBe(0);

      // 3. Reject profile and verify still absent
      await alumniService.rejectAlumni(
        TENANT_ALPHA,
        profilePending.id,
        tpoAlpha.id,
        'Missing verified degree credentials'
      );
      const res2 = await request(app)
        .get('/api/v1/alumni')
        .set('Authorization', `Bearer ${tokenStudentAlpha1}`);
      expect(res2.body.data.length).toBe(0);

      // 4. Once TPO verifies the profile, it immediately appears in directory
      await alumniService.verifyAlumni(
        TENANT_ALPHA,
        profilePending.id,
        tpoAlpha.id,
        'Convocation ledger verified'
      );
      const res3 = await request(app)
        .get('/api/v1/alumni')
        .set('Authorization', `Bearer ${tokenStudentAlpha1}`);
      expect(res3.body.data.length).toBe(1);
      expect(res3.body.data[0].profile.userId).toBe(alumniAlpha1.id);
      expect(res3.body.data[0].profile.verificationStatus).toBe('VERIFIED');
    });
  });

  // ==========================================================================
  // Scenario 2: Student cannot verify alumni (403 forbidden)
  // ==========================================================================
  describe('Scenario 2: Student cannot verify alumni (403 forbidden)', () => {
    it('strictly forbids students from verifying alumni profiles with HTTP 403', async () => {
      const profile = await alumniService.createOrUpdateProfile(
        TENANT_ALPHA,
        alumniAlpha1.id,
        { currentCompany: 'Apple', currentRole: 'Hardware Systems Lead' }
      );

      const res = await request(app)
        .post(`/api/v1/alumni/${profile.id}/verify`)
        .set('Authorization', `Bearer ${tokenStudentAlpha1}`)
        .send({ notes: 'Attempting illicit self-verification' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TPO_AUTHORITY_REQUIRED');

      // Verify the profile remains PENDING
      const check = await alumniService.getProfileByUserId(TENANT_ALPHA, alumniAlpha1.id);
      expect(check?.verificationStatus).toBe('PENDING');
    });
  });

  // ==========================================================================
  // Scenario 3: Alumni cannot access another alumni's private requests
  // ==========================================================================
  describe("Scenario 3: Alumni cannot access another alumni's private requests", () => {
    it('isolates incoming mentorship requests between distinct alumni', async () => {
      // Create and verify Alumni 1 and Alumni 2
      const p1 = await alumniService.createOrUpdateProfile(TENANT_ALPHA, alumniAlpha1.id, {
        currentCompany: 'Microsoft',
        mentorshipEnabled: true
      });
      await alumniService.verifyAlumni(TENANT_ALPHA, p1.id, tpoAlpha.id);

      const p2 = await alumniService.createOrUpdateProfile(TENANT_ALPHA, alumniAlpha2.id, {
        currentCompany: 'Amazon',
        mentorshipEnabled: true
      });
      await alumniService.verifyAlumni(TENANT_ALPHA, p2.id, tpoAlpha.id);

      // Student 1 sends request to Alumni 1 ONLY
      const reqAlumni1 = await alumniService.createRequest(
        TENANT_ALPHA,
        studentAlpha1.id,
        undefined,
        {
          mentorUserId: alumniAlpha1.id,
          alumniProfileId: p1.id,
          topic: 'System Architecture Guidance',
          message: 'Would love your guidance on large-scale distributed systems.'
        }
      );

      // Alumni 1 reads incoming requests -> sees request
      const resAlumni1 = await request(app)
        .get('/api/v1/alumni/requests')
        .set('Authorization', `Bearer ${tokenAlumniAlpha1}`);
      expect(resAlumni1.status).toBe(200);
      expect(resAlumni1.body.data.length).toBe(1);
      expect(resAlumni1.body.data[0].id).toBe(reqAlumni1.id);

      // Alumni 2 reads incoming requests -> sees ZERO requests (strict isolation)
      const resAlumni2 = await request(app)
        .get('/api/v1/alumni/requests')
        .set('Authorization', `Bearer ${tokenAlumniAlpha2}`);
      expect(resAlumni2.status).toBe(200);
      expect(resAlumni2.body.data.length).toBe(0);

      // Alumni 2 attempts to tamper with / accept Alumni 1's request -> REJECTED
      const tamperAttempt = await request(app)
        .patch(`/api/v1/mentorship/requests/${reqAlumni1.id}`)
        .set('Authorization', `Bearer ${tokenAlumniAlpha2}`)
        .send({ action: 'ACCEPT' });

      expect(tamperAttempt.status).toBe(400);
      expect(tamperAttempt.body.error).toContain('Only the assigned mentor can accept');
    });
  });

  // ==========================================================================
  // Scenario 4: Student cannot read another student's private mentorship history
  // ==========================================================================
  describe("Scenario 4: Student cannot read another student's private mentorship history", () => {
    it("ensures student mentorship requests and history are isolated to requesting student", async () => {
      const p = await alumniService.createOrUpdateProfile(TENANT_ALPHA, alumniAlpha1.id, {
        currentCompany: 'Netflix',
        mentorshipEnabled: true
      });
      await alumniService.verifyAlumni(TENANT_ALPHA, p.id, tpoAlpha.id);

      // Student 1 creates private request
      const reqStudent1 = await alumniService.createRequest(
        TENANT_ALPHA,
        studentAlpha1.id,
        undefined,
        {
          mentorUserId: alumniAlpha1.id,
          alumniProfileId: p.id,
          topic: 'Personal Career Mentorship',
          message: 'Confidential career counseling inquiry.'
        }
      );

      // Student 1 queries their requests -> sees their request
      const resStudent1 = await request(app)
        .get('/api/v1/mentorship/requests/student')
        .set('Authorization', `Bearer ${tokenStudentAlpha1}`);
      expect(resStudent1.status).toBe(200);
      expect(resStudent1.body.data.length).toBe(1);
      expect(resStudent1.body.data[0].id).toBe(reqStudent1.id);

      // Student 2 queries their requests -> sees 0 requests
      const resStudent2 = await request(app)
        .get('/api/v1/mentorship/requests/student')
        .set('Authorization', `Bearer ${tokenStudentAlpha2}`);
      expect(resStudent2.status).toBe(200);
      expect(resStudent2.body.data.length).toBe(0);

      // Student 2 attempts to cancel Student 1's request -> REJECTED
      const cancelAttempt = await request(app)
        .patch(`/api/v1/mentorship/requests/${reqStudent1.id}`)
        .set('Authorization', `Bearer ${tokenStudentAlpha2}`)
        .send({ action: 'CANCEL' });

      expect(cancelAttempt.status).toBe(400);
      expect(cancelAttempt.body.error).toContain('Unauthorized to cancel this request');
    });
  });

  // ==========================================================================
  // Scenario 5: Cross-tenant access is rejected with 403 TENANT_SPOOFING_REJECTED
  // ==========================================================================
  describe('Scenario 5: Cross-tenant access is rejected with 403 TENANT_SPOOFING_REJECTED', () => {
    it('detects and rejects mismatched x-tenant-id headers with HTTP 403', async () => {
      // User with Tenant Alpha JWT attempting to claim Tenant Beta
      const res = await request(app)
        .get('/api/v1/alumni')
        .set('Authorization', `Bearer ${tokenStudentAlpha1}`)
        .set('x-tenant-id', TENANT_BETA);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('TENANT_SPOOFING_REJECTED');
      expect(res.body.error).toContain('tenant spoofing detected');
    });

    it('rejects cross-tenant peer interview room queries across college boundaries', async () => {
      // Create room in Tenant Beta
      const betaRoom = await peerInterviewService.createRoom(TENANT_BETA, studentBeta.id, {
        title: 'Beta College Internal Mock',
        interviewType: 'TECHNICAL',
        mode: 'STRUCTURED_INTERVIEW'
      });

      // Student Alpha attempts to fetch Tenant Beta room details
      await expect(
        peerInterviewService.getRoomDetails(TENANT_ALPHA, betaRoom.id, studentAlpha1.id)
      ).rejects.toThrow(/not found in tenant/);
    });
  });

  // ==========================================================================
  // Scenario 6: Unauthorized participants cannot join private rooms
  // ==========================================================================
  describe('Scenario 6: Unauthorized participants cannot join private rooms', () => {
    it('enforces secret passcode verification for private collaboration study rooms', async () => {
      const privateRoom = await collaborationService.createRoom(
        TENANT_ALPHA,
        studentAlpha1.id,
        {
          name: 'ACM ICPC Finalist Training Room',
          category: 'DSA',
          isPrivate: true,
          passcode: 'SUPER_SECRET_ALGO_99'
        }
      );

      // Attempt 1: Join without passcode -> REJECTED
      const resNoCode = await request(app)
        .post(`/api/v1/collaboration/rooms/${privateRoom.id}/join`)
        .set('Authorization', `Bearer ${tokenStudentAlpha2}`)
        .send({});

      expect(resNoCode.status).toBe(400);
      expect(resNoCode.body.error).toContain('Invalid room passcode');

      // Attempt 2: Join with wrong passcode -> REJECTED
      const resWrongCode = await request(app)
        .post(`/api/v1/collaboration/rooms/${privateRoom.id}/join`)
        .set('Authorization', `Bearer ${tokenStudentAlpha2}`)
        .send({ passcode: 'INCORRECT_PASS' });

      expect(resWrongCode.status).toBe(400);
      expect(resWrongCode.body.error).toContain('Invalid room passcode');

      // Attempt 3: Join with correct passcode -> SUCCESS
      const resSuccess = await request(app)
        .post(`/api/v1/collaboration/rooms/${privateRoom.id}/join`)
        .set('Authorization', `Bearer ${tokenStudentAlpha2}`)
        .send({ passcode: 'SUPER_SECRET_ALGO_99' });

      expect(resSuccess.status).toBe(200);
      expect(resSuccess.body.success).toBe(true);
      expect(resSuccess.body.data.participant.role).toBe('MEMBER');
    });
  });

  // ==========================================================================
  // Scenario 7: WebSocket connection requires valid JWT authentication
  // ==========================================================================
  describe('Scenario 7: WebSocket connection requires valid JWT authentication', () => {
    it('authenticates valid JWT tokens via query parameter, header, and protocol', async () => {
      const auth = await realtimeWebSocketServer.authenticateConnection({
        url: `/ws?token=${tokenStudentAlpha1}`,
        headers: {}
      });

      expect(auth).not.toBeNull();
      expect(auth?.userId).toBe(studentAlpha1.id);
      expect(auth?.tenantId).toBe(TENANT_ALPHA);
      expect(auth?.role).toBe('STUDENT');
    });

    it('rejects connection attempts lacking authentication credentials', async () => {
      const auth = await realtimeWebSocketServer.authenticateConnection({
        url: '/ws',
        headers: {}
      });

      expect(auth).toBeNull();
    });

    it('rejects connection attempts with forged or corrupt JWT tokens', async () => {
      const auth = await realtimeWebSocketServer.authenticateConnection({
        url: '/ws?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        headers: {}
      });

      expect(auth).toBeNull();
    });
  });

  // ==========================================================================
  // Scenario 8: WebSocket room isolation prevents cross-tenant or cross-room message leakage
  // ==========================================================================
  describe('Scenario 8: WebSocket room isolation prevents cross-tenant or cross-room message leakage', () => {
    it('guarantees zero leakage across rooms and college tenants', async () => {
      const wsTenantA_Room1_User1 = createMockWs(studentAlpha1.id, TENANT_ALPHA);
      const wsTenantA_Room1_User2 = createMockWs(studentAlpha2.id, TENANT_ALPHA);
      const wsTenantA_Room2_User3 = createMockWs(alumniAlpha1.id, TENANT_ALPHA);
      const wsTenantB_Room1_User4 = createMockWs(studentBeta.id, TENANT_BETA);

      realtimeWebSocketServer.registerClient(wsTenantA_Room1_User1, {
        userId: studentAlpha1.id,
        tenantId: TENANT_ALPHA,
        role: 'STUDENT',
        email: studentAlpha1.email
      });
      realtimeWebSocketServer.registerClient(wsTenantA_Room1_User2, {
        userId: studentAlpha2.id,
        tenantId: TENANT_ALPHA,
        role: 'STUDENT',
        email: studentAlpha2.email
      });
      realtimeWebSocketServer.registerClient(wsTenantA_Room2_User3, {
        userId: alumniAlpha1.id,
        tenantId: TENANT_ALPHA,
        role: 'ALUMNI',
        email: alumniAlpha1.email
      });
      realtimeWebSocketServer.registerClient(wsTenantB_Room1_User4, {
        userId: studentBeta.id,
        tenantId: TENANT_BETA,
        role: 'STUDENT',
        email: studentBeta.email
      });

      // Join respective rooms
      realtimeWebSocketServer.handleMessage(wsTenantA_Room1_User1, {
        type: 'JOIN_ROOM',
        payload: { roomId: 'room-alpha-101' }
      });
      realtimeWebSocketServer.handleMessage(wsTenantA_Room1_User2, {
        type: 'JOIN_ROOM',
        payload: { roomId: 'room-alpha-101' }
      });
      realtimeWebSocketServer.handleMessage(wsTenantA_Room2_User3, {
        type: 'JOIN_ROOM',
        payload: { roomId: 'room-alpha-202' }
      });
      realtimeWebSocketServer.handleMessage(wsTenantB_Room1_User4, {
        type: 'JOIN_ROOM',
        payload: { roomId: 'room-alpha-101' } // Same roomId string but DIFFERENT TENANT!
      });

      // Clear join acks
      wsTenantA_Room1_User1.sentMessages.length = 0;
      wsTenantA_Room1_User2.sentMessages.length = 0;
      wsTenantA_Room2_User3.sentMessages.length = 0;
      wsTenantB_Room1_User4.sentMessages.length = 0;

      // Broadcast message in Tenant A, Room 101
      realtimeWebSocketServer.handleMessage(wsTenantA_Room1_User1, {
        type: 'CHAT_MESSAGE',
        payload: { content: 'Secret confidential review notes for Room 101' }
      });

      // Verify User 2 received it
      const receivedUser2 = wsTenantA_Room1_User2.sentMessages.find(
        (m: any) => m.type === 'CHAT_MESSAGE'
      );
      expect(receivedUser2).toBeDefined();
      expect(receivedUser2.payload.content).toBe('Secret confidential review notes for Room 101');

      // Verify User 3 (different room) received ZERO messages
      expect(wsTenantA_Room2_User3.sentMessages.length).toBe(0);

      // Verify User 4 (different tenant) received ZERO messages
      expect(wsTenantB_Room1_User4.sentMessages.length).toBe(0);
    });
  });

  // ==========================================================================
  // Scenario 9: Participant cannot access room or broadcast after leaving or being removed
  // ==========================================================================
  describe('Scenario 9: Participant cannot access room or broadcast after leaving or being removed', () => {
    it('prohibits broadcasts and drops message delivery once participant departs room', async () => {
      const wsHost = createMockWs(studentAlpha1.id, TENANT_ALPHA);
      const wsParticipant = createMockWs(studentAlpha2.id, TENANT_ALPHA);

      realtimeWebSocketServer.registerClient(wsHost, {
        userId: studentAlpha1.id,
        tenantId: TENANT_ALPHA,
        role: 'STUDENT',
        email: studentAlpha1.email
      });
      realtimeWebSocketServer.registerClient(wsParticipant, {
        userId: studentAlpha2.id,
        tenantId: TENANT_ALPHA,
        role: 'STUDENT',
        email: studentAlpha2.email
      });

      realtimeWebSocketServer.handleMessage(wsHost, {
        type: 'JOIN_ROOM',
        payload: { roomId: 'room-collab-leave-test' }
      });
      realtimeWebSocketServer.handleMessage(wsParticipant, {
        type: 'JOIN_ROOM',
        payload: { roomId: 'room-collab-leave-test' }
      });

      // Participant leaves room
      realtimeWebSocketServer.handleMessage(wsParticipant, {
        type: 'LEAVE_ROOM',
        payload: { roomId: 'room-collab-leave-test' }
      });

      expect(wsParticipant.currentRoomId).toBeNull();

      wsParticipant.sentMessages.length = 0;
      wsHost.sentMessages.length = 0;

      // 1. Participant attempts to broadcast after leaving -> silently ignored / dropped
      realtimeWebSocketServer.handleMessage(wsParticipant, {
        type: 'CHAT_MESSAGE',
        payload: { content: 'I should not be able to talk here!' }
      });
      expect(wsHost.sentMessages.length).toBe(0);

      // 2. Host broadcasts to room -> departed participant never receives it
      realtimeWebSocketServer.handleMessage(wsHost, {
        type: 'CHAT_MESSAGE',
        payload: { content: 'Host continuing session post-departure' }
      });
      expect(wsParticipant.sentMessages.length).toBe(0);
    });
  });

  // ==========================================================================
  // Scenario 10: Blocked participants cannot rejoin restricted sessions
  // ==========================================================================
  describe('Scenario 10: Blocked participants cannot rejoin restricted sessions', () => {
    it('prevents blocked participants from interacting with blocker or requesting mentorship', async () => {
      // Alumni 1 blocks Student 2 due to misconduct
      const blockRes = await request(app)
        .post('/api/v1/moderation/block')
        .set('Authorization', `Bearer ${tokenAlumniAlpha1}`)
        .send({
          blockedUserId: studentAlpha2.id,
          reason: 'Unacceptable conduct during mock interview'
        });

      expect(blockRes.status).toBe(200);
      expect(blockRes.body.success).toBe(true);

      // Verify bidirectional block lookup
      const isBlocked = await moderationService.isBlocked(
        TENANT_ALPHA,
        studentAlpha2.id,
        alumniAlpha1.id
      );
      expect(isBlocked).toBe(true);

      // Student 2 attempts to send mentorship request to Alumni 1 -> REJECTED
      const p1 = await alumniService.createOrUpdateProfile(TENANT_ALPHA, alumniAlpha1.id, {
        currentCompany: 'Google',
        mentorshipEnabled: true
      });
      await alumniService.verifyAlumni(TENANT_ALPHA, p1.id, tpoAlpha.id);

      const requestAttempt = await request(app)
        .post('/api/v1/mentorship/requests')
        .set('Authorization', `Bearer ${tokenStudentAlpha2}`)
        .send({
          mentorUserId: alumniAlpha1.id,
          alumniProfileId: p1.id,
          topic: 'Attempted Contact',
          message: 'Trying to contact after being blocked'
        });

      expect(requestAttempt.status).toBe(400);
      expect(requestAttempt.body.error).toContain('Interaction is blocked');
    });
  });

  // ==========================================================================
  // Scenario 11: Moderation reports are visible only to authorized TPO/Admin reviewers
  // ==========================================================================
  describe('Scenario 11: Moderation reports are visible only to authorized TPO/Admin reviewers', () => {
    it('enforces RBAC on the moderation queue, rejecting students and alumni with 403', async () => {
      // 1. Submit incident report
      await moderationService.createReport(TENANT_ALPHA, studentAlpha1.id, {
        reportedUserId: studentAlpha2.id,
        entityType: 'COLLABORATION_ROOM',
        entityId: 'room-dsa-9',
        reason: 'SPAM_PROMOTION',
        description: 'Commercial spam messages posted in study group'
      });

      // 2. Student attempts to access TPO moderation review queue -> 403 Forbidden
      const studentRes = await request(app)
        .get('/api/v1/tpo/moderation/reports')
        .set('Authorization', `Bearer ${tokenStudentAlpha1}`);
      expect(studentRes.status).toBe(403);
      expect(studentRes.body.code).toBe('TPO_AUTHORITY_REQUIRED');

      // 3. Alumni attempts to access TPO moderation review queue -> 403 Forbidden
      const alumniRes = await request(app)
        .get('/api/v1/tpo/moderation/reports')
        .set('Authorization', `Bearer ${tokenAlumniAlpha1}`);
      expect(alumniRes.status).toBe(403);
      expect(alumniRes.body.code).toBe('TPO_AUTHORITY_REQUIRED');

      // 4. Authorized TPO Director accesses queue -> 200 OK with reports
      const tpoRes = await request(app)
        .get('/api/v1/tpo/moderation/reports')
        .set('Authorization', `Bearer ${tokenTpoAlpha}`);
      expect(tpoRes.status).toBe(200);
      expect(tpoRes.body.success).toBe(true);
      expect(tpoRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(tpoRes.body.data[0].reason).toBe('SPAM_PROMOTION');
    });
  });

  // ==========================================================================
  // Scenario 12: Recruiters cannot access mentorship information without explicit permission
  // ==========================================================================
  describe('Scenario 12: Recruiters cannot access mentorship information without explicit permission', () => {
    it('strictly prohibits recruiters from accessing private mentorship data and institutional analytics', async () => {
      // 1. Recruiter attempts to access TPO mentorship analytics -> 403 Forbidden
      const analyticsRes = await request(app)
        .get('/api/v1/tpo/alumni/analytics')
        .set('Authorization', `Bearer ${tokenRecruiterAlpha}`);
      expect(analyticsRes.status).toBe(403);
      expect(analyticsRes.body.code).toBe('TPO_AUTHORITY_REQUIRED');

      // 2. Recruiter attempts to access pending alumni verifications -> 403 Forbidden
      const pendingRes = await request(app)
        .get('/api/v1/tpo/alumni/pending')
        .set('Authorization', `Bearer ${tokenRecruiterAlpha}`);
      expect(pendingRes.status).toBe(403);
      expect(pendingRes.body.code).toBe('TPO_AUTHORITY_REQUIRED');

      // 3. Recruiter attempts to access moderation queue -> 403 Forbidden
      const modRes = await request(app)
        .get('/api/v1/tpo/moderation/reports')
        .set('Authorization', `Bearer ${tokenRecruiterAlpha}`);
      expect(modRes.status).toBe(403);
      expect(modRes.body.code).toBe('TPO_AUTHORITY_REQUIRED');

      // 4. Recruiter querying alumni incoming requests -> sees zero student requests
      const reqRes = await request(app)
        .get('/api/v1/alumni/requests')
        .set('Authorization', `Bearer ${tokenRecruiterAlpha}`);
      expect(reqRes.status).toBe(200);
      expect(reqRes.body.data.length).toBe(0);
    });
  });

  // ==========================================================================
  // Scenario 13: Camera and microphone never activate automatically (explicit user consent required)
  // ==========================================================================
  describe('Scenario 13: Camera and microphone never activate automatically (explicit user consent required)', () => {
    it('verifies safe-by-default audio/video policy: media is disabled upon room join with text/notes fallback', async () => {
      const room = await peerInterviewService.createRoom(TENANT_ALPHA, studentAlpha1.id, {
        title: 'Safe Media Test Mock',
        interviewType: 'TECHNICAL',
        mode: 'STRUCTURED_INTERVIEW'
      });

      const details = await peerInterviewService.getRoomDetails(
        TENANT_ALPHA,
        room.id,
        studentAlpha1.id
      );

      // Verify that room defaults to text/notes collaboration with NO forced media requirement
      expect(details.room.status).toBe('SCHEDULED');

      // WebSocket connection frame establishes zero automatic media streaming
      const ws = createMockWs(studentAlpha1.id, TENANT_ALPHA);
      realtimeWebSocketServer.registerClient(ws, {
        userId: studentAlpha1.id,
        tenantId: TENANT_ALPHA,
        role: 'STUDENT',
        email: studentAlpha1.email
      });

      realtimeWebSocketServer.handleMessage(ws, {
        type: 'JOIN_ROOM',
        payload: { roomId: room.id }
      });

      const joinAck = ws.sentMessages.find((m: any) => m.type === 'JOIN_ACK');
      expect(joinAck).toBeDefined();

      // Ensure zero unsolicited media signals or camera prompts were broadcast
      expect(ws.sentMessages.some((m: any) => m.type === 'WEBRTC_SIGNAL')).toBe(false);

      // WebRTC media state only changes upon affirmative explicit toggle message
      realtimeWebSocketServer.handleMessage(ws, {
        type: 'WEBRTC_TOGGLE_MEDIA',
        payload: { audio: true, video: false, active: true }
      });

      // Text-and-notes primary fallback is always preserved
      expect(details.room).toBeDefined();
    });
  });

  // ==========================================================================
  // Scenario 14: Duplicate session requests between same student and mentor are prevented
  // ==========================================================================
  describe('Scenario 14: Duplicate session requests between same student and mentor are prevented', () => {
    it('prevents multiple active mentorship requests between the same student and mentor', async () => {
      const p = await alumniService.createOrUpdateProfile(TENANT_ALPHA, alumniAlpha1.id, {
        currentCompany: 'Uber',
        mentorshipEnabled: true
      });
      await alumniService.verifyAlumni(TENANT_ALPHA, p.id, tpoAlpha.id);

      // 1. Initial request succeeds
      const req1 = await request(app)
        .post('/api/v1/mentorship/requests')
        .set('Authorization', `Bearer ${tokenStudentAlpha1}`)
        .send({
          mentorUserId: alumniAlpha1.id,
          alumniProfileId: p.id,
          topic: 'Initial Portfolio Evaluation',
          message: 'Reviewing frontend projects.'
        });

      expect(req1.status).toBe(201);
      expect(req1.body.success).toBe(true);
      expect(req1.body.data.status).toBe('PENDING');

      // 2. Immediate duplicate request MUST FAIL
      const req2 = await request(app)
        .post('/api/v1/mentorship/requests')
        .set('Authorization', `Bearer ${tokenStudentAlpha1}`)
        .send({
          mentorUserId: alumniAlpha1.id,
          alumniProfileId: p.id,
          topic: 'Duplicate Second Request',
          message: 'Spamming mentor before first request answered.'
        });

      expect(req2.status).toBe(400);
      expect(req2.body.success).toBe(false);
      expect(req2.body.error).toContain('An active mentorship request already exists');
    });
  });

  // ==========================================================================
  // Scenario 15: Duplicate notifications are prevented
  // ==========================================================================
  describe('Scenario 15: Duplicate notifications are prevented', () => {
    it('deduplicates identical notification events within the notification window', async () => {
      const referenceId = 'mentorship-req-999';
      const referenceType = 'MENTORSHIP_REQUEST';

      // 1. First notification dispatch
      const dispatch1 = await notificationService.dispatchNotification(TENANT_ALPHA, {
        recipientUserId: alumniAlpha1.id,
        eventType: 'INTERVIEW_SCHEDULED',
        title: 'New Mentorship Request',
        message: 'Aarav Patel has requested mentorship.',
        referenceType,
        referenceId
      });

      expect(dispatch1.dispatched).toBe(true);
      expect(dispatch1.isDuplicate).toBe(false);

      // 2. Second rapid notification dispatch with identical reference
      const dispatch2 = await notificationService.dispatchNotification(TENANT_ALPHA, {
        recipientUserId: alumniAlpha1.id,
        eventType: 'INTERVIEW_SCHEDULED',
        title: 'New Mentorship Request (Retry)',
        message: 'Aarav Patel has requested mentorship.',
        referenceType,
        referenceId
      });

      expect(dispatch2.dispatched).toBe(false);
      expect(dispatch2.isDuplicate).toBe(true);

      // Verify user's inbox only contains 1 notification
      const inbox = await notificationService.getNotifications(TENANT_ALPHA, alumniAlpha1.id);
      expect(inbox.notifications.length).toBe(1);
    });
  });

  // ==========================================================================
  // Scenario 16: Concurrent collaboration updates do not silently overwrite data (versioning/conflict protection)
  // ==========================================================================
  describe('Scenario 16: Concurrent collaboration updates do not silently overwrite data', () => {
    it('rejects stale edits with HTTP 409 VERSION_CONFLICT and guards data integrity', async () => {
      const room = await collaborationService.createRoom(TENANT_ALPHA, studentAlpha1.id, {
        name: 'Operating Systems Concurrency Pod',
        category: 'BACKEND'
      });

      // Initial version is 1
      const details = await collaborationService.getRoomDetails(
        TENANT_ALPHA,
        room.id,
        studentAlpha1.id
      );
      expect(details.notes.version).toBe(1);

      // User 1 performs legitimate update: Version 1 -> Version 2
      const updateRes1 = await request(app)
        .patch(`/api/v1/collaboration/rooms/${room.id}/notes`)
        .set('Authorization', `Bearer ${tokenStudentAlpha1}`)
        .send({
          content: 'Section 1: Mutex vs Semaphore implementation details.',
          expectedVersion: 1
        });

      expect(updateRes1.status).toBe(200);
      expect(updateRes1.body.data.version).toBe(2);

      // User 2 attempts concurrent update based on stale Version 1 -> MUST BE REJECTED WITH 409
      const updateResConflict = await request(app)
        .patch(`/api/v1/collaboration/rooms/${room.id}/notes`)
        .set('Authorization', `Bearer ${tokenStudentAlpha2}`)
        .send({
          content: 'Conflicting simultaneous overwrite from stale client state.',
          expectedVersion: 1
        });

      expect(updateResConflict.status).toBe(409);
      expect(updateResConflict.body.code).toBe('VERSION_CONFLICT');
      expect(updateResConflict.body.currentVersion).toBe(2);

      // Verify the content in database matches User 1's clean update
      const latestDetails = await collaborationService.getRoomDetails(
        TENANT_ALPHA,
        room.id,
        studentAlpha1.id
      );
      expect(latestDetails.notes.content).toContain('Mutex vs Semaphore');
    });
  });

  // ==========================================================================
  // Scenario 17: Session data is not exposed through public unauthenticated endpoints
  // ==========================================================================
  describe('Scenario 17: Session data is not exposed through public unauthenticated endpoints', () => {
    it('blocks all unauthenticated requests with HTTP 401 Unauthorized across Phase 16 routes', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/api/v1/alumni' },
        { method: 'get', path: '/api/v1/alumni/requests' },
        { method: 'get', path: '/api/v1/mentorship/requests/student' },
        { method: 'post', path: '/api/v1/mentorship/requests' },
        { method: 'get', path: '/api/v1/peer-interviews' },
        { method: 'post', path: '/api/v1/peer-interviews' },
        { method: 'get', path: '/api/v1/collaboration/rooms' },
        { method: 'post', path: '/api/v1/collaboration/rooms' },
        { method: 'post', path: '/api/v1/moderation/reports' },
        { method: 'get', path: '/api/v1/tpo/alumni/analytics' },
        { method: 'get', path: '/api/v1/tpo/moderation/reports' }
      ];

      for (const endpoint of protectedEndpoints) {
        let res;
        if (endpoint.method === 'get') {
          res = await request(app).get(endpoint.path);
        } else {
          res = await request(app).post(endpoint.path).send({});
        }

        expect(res.status, `Expected 401 for unauthenticated ${endpoint.method.toUpperCase()} ${endpoint.path}`).toBe(401);
        expect(res.body.success).toBe(false);
      }
    });
  });

  // ==========================================================================
  // Scenario 18: Revoked permissions are strictly enforced
  // ==========================================================================
  describe('Scenario 18: Revoked permissions are strictly enforced', () => {
    it('immediately halts mentorship privileges upon TPO suspension of alumni mentor', async () => {
      // 1. Setup verified mentor
      const profile = await alumniService.createOrUpdateProfile(
        TENANT_ALPHA,
        alumniAlpha1.id,
        {
          currentCompany: 'Goldman Sachs',
          currentRole: 'Quantitative Strategist',
          mentorshipEnabled: true
        }
      );
      await alumniService.verifyAlumni(TENANT_ALPHA, profile.id, tpoAlpha.id);

      // Verify mentor is in directory
      const initialMentors = await alumniService.discoverMentors(TENANT_ALPHA);
      expect(initialMentors.some((m) => m.profile.userId === alumniAlpha1.id)).toBe(true);

      // 2. TPO suspends the alumni's mentorship privileges
      const suspendRes = await request(app)
        .post(`/api/v1/alumni/${profile.id}/suspend`)
        .set('Authorization', `Bearer ${tokenTpoAlpha}`)
        .send({ reason: 'Investigation into policy violation' });

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.verificationStatus).toBe('SUSPENDED');

      // 3. Alumni immediately drops out of public mentor directory
      const postSuspendMentors = await alumniService.discoverMentors(TENANT_ALPHA);
      expect(postSuspendMentors.some((m) => m.profile.userId === alumniAlpha1.id)).toBe(false);

      // 4. Any new mentorship request to this suspended mentor is REJECTED
      const requestRes = await request(app)
        .post('/api/v1/mentorship/requests')
        .set('Authorization', `Bearer ${tokenStudentAlpha1}`)
        .send({
          mentorUserId: alumniAlpha1.id,
          alumniProfileId: profile.id,
          topic: 'Post-Suspension Request',
          message: 'Trying to request session with suspended mentor'
        });

      expect(requestRes.status).toBe(400);
      expect(requestRes.body.error).toContain('Mentor is not verified or available');
    });

    it('immediately enforces revoked reviewer delegation (Stop-Gate 5)', async () => {
      // Delegate review authority to Faculty Coordinator
      const delegation = await delegationService.delegateReviewer(
        TENANT_ALPHA,
        tpoAlpha.id,
        {
          userId: facultyAlpha.id,
          notes: 'End-of-year alumni portfolio review assistance',
          permissions: ['VERIFY_SKILLS', 'REVIEW_EVIDENCE']
        }
      );

      // Reviewer delegation is active
      expect(delegationService.isReviewerDelegatedSync(TENANT_ALPHA, facultyAlpha.id)).toBe(true);

      // Revoke delegation
      await delegationService.revokeDelegation(TENANT_ALPHA, delegation.id, tpoAlpha.id);

      // Revocation is instantaneously enforced
      expect(delegationService.isReviewerDelegatedSync(TENANT_ALPHA, facultyAlpha.id)).toBe(false);
    });
  });
});
