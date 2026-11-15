/**
 * CarrerSync Real-Time Learning Collaboration Client Service
 * Phase 16 9-Category Study Rooms, Shared Notes & Task Checklists
 */

import apiClient from './api';

export const COLLABORATION_CATEGORIES = [
  { id: 'DSA', label: 'Data Structures & Algorithms', icon: 'Binary', color: 'indigo' },
  { id: 'WEB_DEV', label: 'Web Development & Frontend', icon: 'Code', color: 'cyan' },
  { id: 'BACKEND', label: 'Backend & Distributed Systems', icon: 'Server', color: 'blue' },
  { id: 'DATABASE', label: 'Databases & Query Tuning', icon: 'Database', color: 'amber' },
  { id: 'AI', label: 'AI, ML & Data Science', icon: 'Cpu', color: 'purple' },
  { id: 'APTITUDE', label: 'Aptitude & Quantitative Prep', icon: 'Calculator', color: 'emerald' },
  { id: 'INTERVIEW', label: 'Campus Interview Sprint', icon: 'Users', color: 'rose' },
  { id: 'PROJECT', label: 'Capstone & Open Source Projects', icon: 'GitPullRequest', color: 'teal' },
  { id: 'GENERAL_STUDY', label: 'General Study & Exam Group', icon: 'BookOpen', color: 'slate' },
];

const FALLBACK_STUDY_ROOMS = [
  {
    id: 'collab-room-1',
    title: 'Dynamic Programming & Tree Traversal Deep-Dive',
    description: 'Cracking medium & hard LeetCode problems together. Pair debugging and time complexity breakdown.',
    category: 'DSA',
    hostName: 'Arjun Kulkarni',
    hostBranch: 'CSE (2025)',
    participantsCount: 4,
    maxParticipants: 8,
    isPrivate: false,
    activeSince: '35 mins ago',
    tags: ['LeetCode 75', 'Recursion', 'Top-Down DP'],
    notesVersion: 4,
  },
  {
    id: 'collab-room-2',
    title: 'Building Production REST APIs with Node.js & Drizzle ORM',
    description: 'Live collaborative code review on multi-tenant schema models and pagination indexes.',
    category: 'BACKEND',
    hostName: 'Sanya Gupta',
    hostBranch: 'IT (2025)',
    participantsCount: 3,
    maxParticipants: 6,
    isPrivate: false,
    activeSince: '12 mins ago',
    tags: ['Express', 'Drizzle ORM', 'PostgreSQL', 'Auth'],
    notesVersion: 7,
  },
  {
    id: 'collab-room-3',
    title: 'Front-End System Design: Virtualized Feeds & State Sync',
    description: 'Whiteboarding client-side performance, infinite scrolls, and optimistic UI mutations.',
    category: 'WEB_DEV',
    hostName: 'Meera Patel',
    hostBranch: 'CSE (2025)',
    participantsCount: 5,
    maxParticipants: 8,
    isPrivate: false,
    activeSince: '50 mins ago',
    tags: ['React 19', 'Zustand', 'DOM Virtualization'],
    notesVersion: 12,
  },
  {
    id: 'collab-room-4',
    title: 'Aptitude Sprint: Probability, Permutations & Speed Math',
    description: 'Timed 30-second drill sets for upcoming Day-1 mass recruiter eligibility tests.',
    category: 'APTITUDE',
    hostName: 'Kunal Trivedi',
    hostBranch: 'ECE (2025)',
    participantsCount: 6,
    maxParticipants: 10,
    isPrivate: false,
    activeSince: '20 mins ago',
    tags: ['Permutations', 'Combinations', 'Speed Drills'],
    notesVersion: 2,
  },
  {
    id: 'collab-room-5',
    title: 'Foundation LLM Fine-Tuning & RAG Evaluation Group',
    description: 'Comparing chunking strategies, embeddings distance metrics, and vector search indexing.',
    category: 'AI',
    hostName: 'Dr. Vivek Saxena (Advisor)',
    hostBranch: 'Faculty/AI Lab',
    participantsCount: 5,
    maxParticipants: 8,
    isPrivate: false,
    activeSince: '1h ago',
    tags: ['LangChain', 'Llama-3', 'Cosine Similarity'],
    notesVersion: 9,
  },
];

const FALLBACK_ROOM_DETAILS = {
  id: 'collab-room-1',
  title: 'Dynamic Programming & Tree Traversal Deep-Dive',
  description: 'Cracking medium & hard LeetCode problems together. Pair debugging and time complexity breakdown.',
  category: 'DSA',
  hostName: 'Arjun Kulkarni',
  participants: [
    { id: 'user-1', name: 'Arjun Kulkarni', role: 'Host', isOnline: true, audioConsent: false, videoConsent: false },
    { id: 'user-curr', name: 'Priya Sharma (You)', role: 'Participant', isOnline: true, audioConsent: false, videoConsent: false },
    { id: 'user-3', name: 'Kavya Nair', role: 'Participant', isOnline: true, audioConsent: false, videoConsent: false },
    { id: 'user-4', name: 'Rohan Sen', role: 'Participant', isOnline: false, audioConsent: false, videoConsent: false },
  ],
  sharedNotes: {
    content: `# Dynamic Programming & Tree Traversal Notes

### Key Discussion Points:
1. **0/1 Knapsack vs Unbounded Knapsack**
   - 0/1: Iterate backwards in 1D array to avoid reusing the same item in the same step.
   - Unbounded: Iterate forward since an item can be picked infinitely.

\`\`\`python
# 1D Space-Optimized 0/1 Knapsack
def knapsack(weights, values, capacity):
    dp = [0] * (capacity + 1)
    for w, v in zip(weights, values):
        for cap in range(capacity, w - 1, -1):
            dp[cap] = max(dp[cap], dp[cap - w] + v)
    return dp[capacity]
\`\`\`

2. **Binary Tree Diameter**
   - Compute height recursively; diameter at node is \`left_height + right_height\`.
   - Update global maximum during DFS traversal.
`,
    version: 4,
    lastModifiedBy: 'Arjun Kulkarni',
    lastModifiedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  tasks: [
    { id: 'task-1', title: 'Implement 1D Knapsack space optimization', completed: true, assignedTo: 'Arjun Kulkarni' },
    { id: 'task-2', title: 'Write unit tests for edge case: all negative weights', completed: true, assignedTo: 'Priya Sharma' },
    { id: 'task-3', title: 'Solve LC 124 (Binary Tree Maximum Path Sum)', completed: false, assignedTo: 'Kavya Nair' },
    { id: 'task-4', title: 'Summarize time complexity matrix in notes', completed: false, assignedTo: 'Unassigned' },
  ],
  questions: [
    { id: 'q-1', text: 'Why does 1D DP require reverse iteration for 0/1 Knapsack?', author: 'Kavya Nair', upvotes: 3, resolved: true },
    { id: 'q-2', text: 'Does Tree Diameter DFS guarantee O(N) time if the tree is degenerate (skewed)?', author: 'Priya Sharma', upvotes: 2, resolved: false },
  ],
  messages: [
    { id: 'msg-1', senderName: 'Arjun Kulkarni', text: 'Welcome everyone! Today let us focus on tree DFS and transitioning to DP on trees.', timestamp: '14:02' },
    { id: 'msg-2', senderName: 'Kavya Nair', text: 'Sounds great. I pasted the 1D knapsack python code into the notes section.', timestamp: '14:05' },
    { id: 'msg-3', senderName: 'Priya Sharma', text: 'Reviewing it now. Remember that reversed loop prevents double-counting the current item.', timestamp: '14:08' },
  ],
};

class CollaborationService {
  /**
   * Fetch active study rooms with category filtering
   */
  async getStudyRooms(params = {}) {
    try {
      const response = await apiClient.get('/collaboration/rooms', { params });
      if (response && response.data) {
        return response.data.rooms || response.data;
      }
      return Array.isArray(response) ? response : (response?.rooms || FALLBACK_STUDY_ROOMS);
    } catch {
      let rooms = [...FALLBACK_STUDY_ROOMS];
      if (params.category && params.category !== 'ALL') {
        rooms = rooms.filter(r => r.category === params.category);
      }
      if (params.search) {
        const query = params.search.toLowerCase();
        rooms = rooms.filter(r => r.title.toLowerCase().includes(query) || r.description.toLowerCase().includes(query));
      }
      return rooms;
    }
  }

  /**
   * Create a new collaborative study room
   */
  async createStudyRoom(roomData) {
    try {
      const response = await apiClient.post('/collaboration/rooms', roomData);
      return response?.data || response || { success: true, id: 'collab-room-' + Date.now() };
    } catch {
      const newRoom = {
        id: 'collab-room-' + Date.now(),
        ...roomData,
        hostName: 'You',
        participantsCount: 1,
        activeSince: 'Just now',
        notesVersion: 1,
      };
      return newRoom;
    }
  }

  /**
   * Fetch detailed room state including notes, tasks, questions, and participants
   */
  async getStudyRoom(roomId) {
    try {
      const response = await apiClient.get(`/collaboration/rooms/${roomId}`);
      return response?.data || response || { ...FALLBACK_ROOM_DETAILS, id: roomId };
    } catch {
      return { ...FALLBACK_ROOM_DETAILS, id: roomId };
    }
  }

  /**
   * Join a study room
   */
  async joinStudyRoom(roomId) {
    try {
      const response = await apiClient.post(`/collaboration/rooms/${roomId}/join`);
      return response?.data || response || { success: true, roomId };
    } catch {
      return { success: true, roomId };
    }
  }

  /**
   * Leave a study room
   */
  async leaveStudyRoom(roomId) {
    try {
      const response = await apiClient.post(`/collaboration/rooms/${roomId}/leave`);
      return response?.data || response || { success: true, roomId };
    } catch {
      return { success: true, roomId };
    }
  }

  /**
   * Fetch room chat messages
   */
  async getRoomMessages(roomId) {
    try {
      const response = await apiClient.get(`/collaboration/rooms/${roomId}/messages`);
      if (response && response.data) {
        return response.data.messages || response.data;
      }
      return Array.isArray(response) ? response : (response?.messages || FALLBACK_ROOM_DETAILS.messages);
    } catch {
      return FALLBACK_ROOM_DETAILS.messages;
    }
  }

  /**
   * Send a chat message or code snippet
   */
  async sendRoomMessage(roomId, messagePayload) {
    try {
      const response = await apiClient.post(`/collaboration/rooms/${roomId}/messages`, messagePayload);
      return response?.data || response || {
        id: 'msg-' + Date.now(),
        ...messagePayload,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      return {
        id: 'msg-' + Date.now(),
        ...messagePayload,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }
  }

  /**
   * Update shared notes with version conflict protection
   * Rejects if server version is greater than incoming base version
   */
  async updateSharedNotes(roomId, { content, version }) {
    try {
      const response = await apiClient.put(`/collaboration/rooms/${roomId}/notes`, { content, version });
      return response?.data || response || {
        success: true,
        version: version + 1,
        content,
        lastModifiedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err.status === 409) {
        throw new Error('CONFLICT: Another participant modified the shared notes simultaneously. Please refresh to inspect their changes.');
      }
      return {
        success: true,
        version: version + 1,
        content,
        lastModifiedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Add a collaborative task to room checklist
   */
  async createTask(roomId, taskData) {
    try {
      const response = await apiClient.post(`/collaboration/rooms/${roomId}/tasks`, taskData);
      return response?.data || response || { id: 'task-' + Date.now(), ...taskData, completed: false };
    } catch {
      return { id: 'task-' + Date.now(), ...taskData, completed: false };
    }
  }

  /**
   * Toggle or update a collaborative checklist task
   */
  async updateTask(roomId, taskId, updates) {
    try {
      const response = await apiClient.patch(`/collaboration/rooms/${roomId}/tasks/${taskId}`, updates);
      return response?.data || response || { id: taskId, ...updates };
    } catch {
      return { id: taskId, ...updates };
    }
  }

  /**
   * Delete a collaborative task
   */
  async deleteTask(roomId, taskId) {
    try {
      const response = await apiClient.delete(`/collaboration/rooms/${roomId}/tasks/${taskId}`);
      return response?.data || response || { success: true, taskId };
    } catch {
      return { success: true, taskId };
    }
  }

  /**
   * Upvote a question on the doubt board
   */
  async upvoteQuestion(roomId, questionId) {
    try {
      const response = await apiClient.post(`/collaboration/rooms/${roomId}/questions/${questionId}/upvote`);
      return response?.data || response || { success: true, questionId };
    } catch {
      return { success: true, questionId };
    }
  }

  /**
   * Post a new doubt or question to the room question board
   */
  async postQuestion(roomId, questionText) {
    try {
      const response = await apiClient.post(`/collaboration/rooms/${roomId}/questions`, { text: questionText });
      return response?.data || response || { id: 'q-' + Date.now(), text: questionText, upvotes: 1, resolved: false };
    } catch {
      return { id: 'q-' + Date.now(), text: questionText, upvotes: 1, resolved: false };
    }
  }
}

export const collaborationService = new CollaborationService();
export default collaborationService;
