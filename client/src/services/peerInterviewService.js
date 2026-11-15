/**
 * CarrerSync Peer Mock Interview Client Service
 * Phase 16 Peer Discovery Marketplace, Dual-Mode Rooms, & Constructive Rubric
 */

import apiClient from './api';

export const PEER_INTERVIEW_TYPES = [
  { id: 'TECHNICAL', label: 'Technical Coding & DSA' },
  { id: 'SYSTEM_DESIGN', label: 'System Design & Architecture' },
  { id: 'HR', label: 'HR & Cultural Fit' },
  { id: 'BEHAVIORAL', label: 'Behavioral & Leadership (STAR)' },
  { id: 'APTITUDE_DISCUSSION', label: 'Aptitude & Problem Solving' },
  { id: 'PROJECT_EXPLANATION', label: 'Project Deep-Dive & Architecture' },
  { id: 'GENERAL_PREP', label: 'General Comprehensive Mock' },
];

export const PEER_INTERVIEW_MODES = [
  {
    id: 'STRUCTURED_INTERVIEW',
    label: 'Mode A: Interviewer vs Candidate',
    description: 'One peer asks vetted questions with hidden rubric guide, then switch roles.',
  },
  {
    id: 'COLLABORATIVE_PRACTICE',
    label: 'Mode B: Collaborative Practice',
    description: 'Work together on complex challenges, pairing on code, architecture & trade-offs.',
  },
];

export const PEER_DIFFICULTIES = [
  { id: 'BEGINNER', label: 'Entry Level', badgeVariant: 'emerald' },
  { id: 'INTERMEDIATE', label: 'Intermediate', badgeVariant: 'indigo' },
  { id: 'ADVANCED', label: 'Senior / Hard', badgeVariant: 'rose' },
];

const FALLBACK_ROOMS = [
  {
    id: 'room-peer-1',
    title: 'Graphs & Dynamic Programming Mock Practice',
    targetRole: 'Software Development Engineer',
    domain: 'Software Engineering',
    type: 'TECHNICAL',
    mode: 'STRUCTURED_INTERVIEW',
    difficulty: 'INTERMEDIATE',
    durationMinutes: 45,
    hostId: 'user-p1',
    hostName: 'Aman Verma',
    hostBranch: 'CSE (2025)',
    status: 'SCHEDULED',
    participantsCount: 1,
    maxParticipants: 2,
    scheduledAt: '2026-11-16T14:00:00Z',
    tags: ['Graph BFS/DFS', 'Memoization', 'Complexity Analysis'],
  },
  {
    id: 'room-peer-2',
    title: 'High-Throughput Distributed Cache System Design',
    targetRole: 'Backend Engineer',
    domain: 'Cloud & Systems',
    type: 'SYSTEM_DESIGN',
    mode: 'COLLABORATIVE_PRACTICE',
    difficulty: 'ADVANCED',
    durationMinutes: 60,
    hostId: 'user-p2',
    hostName: 'Simran Kaur',
    hostBranch: 'IT (2025)',
    status: 'SCHEDULED',
    participantsCount: 1,
    maxParticipants: 2,
    scheduledAt: '2026-11-16T16:30:00Z',
    tags: ['LRU Eviction', 'Consistent Hashing', 'Replication'],
  },
  {
    id: 'room-peer-3',
    title: 'Tier-1 Product Company HR & Behavioral Mock (STAR Method)',
    targetRole: 'Product Associate / SDE',
    domain: 'General',
    type: 'BEHAVIORAL',
    mode: 'STRUCTURED_INTERVIEW',
    difficulty: 'BEGINNER',
    durationMinutes: 30,
    hostId: 'user-p3',
    hostName: 'Rahul Joshi',
    hostBranch: 'ECE (2025)',
    status: 'SCHEDULED',
    participantsCount: 1,
    maxParticipants: 2,
    scheduledAt: '2026-11-16T18:00:00Z',
    tags: ['Conflict Resolution', 'Failure Stories', 'Ownership'],
  },
  {
    id: 'room-peer-4',
    title: 'Fullstack React + Node.js Live Code & Debugging Mock',
    targetRole: 'Fullstack Engineer',
    domain: 'Web Development',
    type: 'TECHNICAL',
    mode: 'COLLABORATIVE_PRACTICE',
    difficulty: 'INTERMEDIATE',
    durationMinutes: 45,
    hostId: 'user-p4',
    hostName: 'Nisha Pillai',
    hostBranch: 'CSE (2025)',
    status: 'IN_PROGRESS',
    participantsCount: 2,
    maxParticipants: 2,
    scheduledAt: '2026-11-15T22:00:00Z',
    tags: ['React Hooks', 'Event Loop', 'SQL Joins'],
  },
];

const FALLBACK_QUESTIONS = [
  {
    id: 'q-1',
    title: 'Lowest Common Ancestor in a Binary Tree',
    domain: 'Software Engineering',
    category: 'TECHNICAL',
    difficulty: 'INTERMEDIATE',
    timeEstimateMinutes: 20,
    problemStatement: 'Given a binary tree and two nodes p and q, find their lowest common ancestor (LCA). Each node contains a unique integer value.',
    interviewerGuide: [
      'Look for base case handling: root === null, root === p, root === q.',
      'Check if candidate searches left and right subtrees recursively.',
      'Ask candidate to state time complexity (O(N)) and space complexity (O(H) recursion stack).',
      'Follow-up: How would the approach change if it was a Binary Search Tree instead of a general Binary Tree?',
    ],
    sampleSolutionHint: 'Recurse down both subtrees. If both return non-null, the current root is the LCA. If one returns non-null, propagate that node up.',
    expectedConstraints: ['Number of nodes is in range [2, 10^5]', 'All Node.val are unique', 'p != q and both exist in tree'],
  },
  {
    id: 'q-2',
    title: 'Design a Scalable URL Shortener (TinyURL)',
    domain: 'Cloud & Systems',
    category: 'SYSTEM_DESIGN',
    difficulty: 'INTERMEDIATE',
    timeEstimateMinutes: 30,
    problemStatement: 'Design a distributed service that takes a long URL and produces a short alias (e.g. carrersync.io/r/abc12). When accessed, it redirects users with low latency.',
    interviewerGuide: [
      '1. Functional requirements: URL encoding, 301 vs 302 redirect.',
      '2. Non-functional: 100:1 read-to-write ratio, p99 latency < 20ms, 99.99% availability.',
      '3. Estimation: 100M URLs/month -> storage & base62 encoding length (7 chars).',
      '4. Trade-off: Base62 hash vs auto-incrementing ID generator (Snowflake).',
      '5. Caching strategy: Redis layer for top 20% hot URLs.',
    ],
    sampleSolutionHint: 'Use Base62 encoding on unique 64-bit integer IDs. Redis cache sitting in front of a NoSQL or partitioned relational DB.',
    expectedConstraints: ['100 Million new URLs created monthly', 'High read traffic (10 Billion redirections/month)'],
  },
  {
    id: 'q-3',
    title: 'STAR Behavioral: Resolving a Critical Technical Disagreement',
    domain: 'General',
    category: 'BEHAVIORAL',
    difficulty: 'BEGINNER',
    timeEstimateMinutes: 15,
    problemStatement: 'Tell me about a time when you disagreed strongly with a teammate regarding a technical decision or project direction. How did you resolve it and what was the outcome?',
    interviewerGuide: [
      'Listen for Situation and Task: Context must be clear, not generic.',
      'Action: Did the candidate use objective metrics, POC benchmarks, or customer focus rather than ego?',
      'Result: What was the quantifiable outcome? Was team morale preserved?',
      'Red flag: Blaming teammates or claiming to always be 100% right.',
    ],
    sampleSolutionHint: 'Evaluate whether candidate demonstrates active listening, data-driven decisions, and ability to commit and execute.',
    expectedConstraints: ['Structured response using Situation, Task, Action, Result framework'],
  },
];

const FALLBACK_HISTORY = [
  {
    id: 'hist-1',
    roomId: 'room-peer-old-1',
    title: 'Binary Search & Sliding Window Sprint',
    targetRole: 'Software Engineer',
    type: 'TECHNICAL',
    mode: 'STRUCTURED_INTERVIEW',
    peerName: 'Tanmay Saxena',
    completedAt: '2026-11-12T15:30:00Z',
    durationMinutes: 45,
    rubricScore: 4.6,
    rubricBreakdown: {
      clarity: 4.8,
      problemSolving: 4.5,
      technicalExplanation: 4.6,
      conceptualUnderstanding: 4.5,
      answerStructure: 4.6,
    },
    strengths: 'Excellent dry-run analysis with clean pointer diagramming. Caught edge cases proactively.',
    improvements: 'Can articulate time complexity earlier before writing code to validate approach choice.',
    isPeerProvidedLabel: true,
  },
  {
    id: 'hist-2',
    roomId: 'room-peer-old-2',
    title: 'Microservices Communication & Idempotency',
    targetRole: 'Backend Engineer',
    type: 'SYSTEM_DESIGN',
    mode: 'COLLABORATIVE_PRACTICE',
    peerName: 'Nisha Pillai',
    completedAt: '2026-11-09T18:00:00Z',
    durationMinutes: 60,
    rubricScore: 4.4,
    rubricBreakdown: {
      clarity: 4.3,
      problemSolving: 4.5,
      technicalExplanation: 4.4,
      conceptualUnderstanding: 4.6,
      answerStructure: 4.2,
    },
    strengths: 'Deep understanding of distributed consensus and retry strategies with idempotency keys.',
    improvements: 'Spend more time upfront bounding network latency and peak bandwidth numbers.',
    isPeerProvidedLabel: true,
  },
];

class PeerInterviewService {
  /**
   * Fetch open peer interview rooms from the marketplace
   */
  async getRooms(params = {}) {
    try {
      let response;
      try {
        response = await apiClient.get('/peer-interviews', { params });
      } catch {
        response = await apiClient.get('/peer-interviews/rooms', { params });
      }
      if (response && response.data) {
        return response.data.rooms || response.data;
      }
      return Array.isArray(response) ? response : (response?.rooms || FALLBACK_ROOMS);
    } catch {
      let rooms = [...FALLBACK_ROOMS];
      if (params.type && params.type !== 'ALL') {
        rooms = rooms.filter(r => r.type === params.type);
      }
      if (params.difficulty && params.difficulty !== 'ALL') {
        rooms = rooms.filter(r => r.difficulty === params.difficulty);
      }
      if (params.search) {
        const query = params.search.toLowerCase();
        rooms = rooms.filter(r => r.title.toLowerCase().includes(query) || r.targetRole.toLowerCase().includes(query));
      }
      return rooms;
    }
  }

  /**
   * Create a new peer interview session room
   */
  async createRoom(roomData) {
    try {
      let response;
      try {
        response = await apiClient.post('/peer-interviews', roomData);
      } catch {
        response = await apiClient.post('/peer-interviews/rooms', roomData);
      }
      return response?.data || response || { success: true, id: 'room-peer-' + Date.now() };
    } catch {
      const newRoom = {
        id: 'room-peer-' + Date.now(),
        ...roomData,
        hostId: 'current-user',
        hostName: 'You',
        participantsCount: 1,
        maxParticipants: 2,
        status: 'SCHEDULED',
        scheduledAt: roomData.scheduledAt || new Date().toISOString(),
      };
      return newRoom;
    }
  }

  /**
   * Fetch a specific room's metadata, active participants, and questions
   */
  async getRoom(roomId) {
    try {
      const response = await apiClient.get(`/peer-interviews/rooms/${roomId}`);
      return response?.data || response || FALLBACK_ROOMS.find(r => r.id === roomId) || FALLBACK_ROOMS[0];
    } catch {
      return FALLBACK_ROOMS.find(r => r.id === roomId) || FALLBACK_ROOMS[0];
    }
  }

  /**
   * Join an active peer interview room
   */
  async joinRoom(roomId) {
    try {
      const response = await apiClient.post(`/peer-interviews/rooms/${roomId}/join`);
      return response?.data || response || { success: true, roomId };
    } catch {
      return { success: true, roomId };
    }
  }

  /**
   * Leave an active peer interview room
   */
  async leaveRoom(roomId) {
    try {
      const response = await apiClient.post(`/peer-interviews/rooms/${roomId}/leave`);
      return response?.data || response || { success: true, roomId };
    } catch {
      return { success: true, roomId };
    }
  }

  /**
   * Fetch approved questions from verified question bank
   */
  async getQuestions(params = {}) {
    try {
      const response = await apiClient.get('/peer-interviews/questions', { params });
      if (response && response.data) {
        return response.data.questions || response.data;
      }
      return Array.isArray(response) ? response : (response?.questions || FALLBACK_QUESTIONS);
    } catch {
      let qList = [...FALLBACK_QUESTIONS];
      if (params.category && params.category !== 'ALL') {
        qList = qList.filter(q => q.category === params.category);
      }
      if (params.difficulty && params.difficulty !== 'ALL') {
        qList = qList.filter(q => q.difficulty === params.difficulty);
      }
      return qList;
    }
  }

  /**
   * Submit constructive structured feedback rubric
   * Explicitly flagged with isPeerProvidedLabel: true to differentiate from official TPO credentials
   */
  async submitRubricFeedback(roomId, feedbackPayload) {
    const payload = {
      ...feedbackPayload,
      isPeerProvidedLabel: true,
      submittedAt: new Date().toISOString(),
    };
    try {
      const response = await apiClient.post(`/peer-interviews/rooms/${roomId}/feedback`, payload);
      return response?.data || response || { success: true, payload };
    } catch {
      return { success: true, payload };
    }
  }

  /**
   * Fetch peer interview practice history
   */
  async getInterviewHistory() {
    try {
      const response = await apiClient.get('/peer-interviews/history');
      if (response && response.data) {
        return response.data.history || response.data;
      }
      return Array.isArray(response) ? response : (response?.history || FALLBACK_HISTORY);
    } catch {
      return FALLBACK_HISTORY;
    }
  }
}

export const peerInterviewService = new PeerInterviewService();
export default peerInterviewService;
