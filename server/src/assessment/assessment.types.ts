/**
 * CarrerSync Phase 12 — Assessment Engine & Personalized Learning Intelligence Types
 *
 * Types for Question Banks, Mock Drives, Coding Sandboxing,
 * AI Interview Evaluation, Performance Reports, Weakness Mapping,
 * and Personalized Learning Task Lifecycles.
 */

// ---------------------------------------------------------------------------
// 1. Standard Targets & Categories
// ---------------------------------------------------------------------------

export const STANDARD_TARGET_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Data Scientist',
  'Java Developer',
  'Python Developer',
  'DevOps Engineer',
  'Cloud Engineer',
  'QA Engineer',
  'Cybersecurity Analyst'
] as const;

export type StandardTargetRole = (typeof STANDARD_TARGET_ROLES)[number];

export const INTERVIEW_CATEGORIES = [
  'Technical Fundamentals',
  'Programming',
  'Data Structures and Algorithms',
  'Database Management',
  'Operating Systems',
  'Computer Networks',
  'Software Engineering',
  'HR and Communication',
  'Role-Specific Questions'
] as const;

export type InterviewCategory = (typeof INTERVIEW_CATEGORIES)[number];

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

// ---------------------------------------------------------------------------
// 2. Question Bank & Questions
// ---------------------------------------------------------------------------

export type QuestionType = 'MCQ' | 'CODING' | 'DESCRIPTIVE';
export type AssessmentRoundType = 'APTITUDE' | 'CODING' | 'INTERVIEW';

export interface MCQOption {
  id: string;
  text: string;
}

export interface MCQQuestion {
  id: string;
  bankId?: string;
  topic: string;
  subtopic?: string;
  difficulty: DifficultyLevel;
  question: string;
  options: MCQOption[];
  correctOptionId: string; // SERVER-SIDE ONLY - NEVER LEAK TO CLIENT PRIOR TO SUBMISSION!
  marks: number;
  negativeMarks: number;
  explanation?: string;
}

/**
 * Sanitized view of MCQ question sent to students during active tests.
 * Correct answers and internal explanations are strictly omitted!
 */
export interface StudentMCQQuestionView {
  id: string;
  topic: string;
  subtopic?: string;
  difficulty: DifficultyLevel;
  question: string;
  options: MCQOption[];
  marks: number;
  negativeMarks: number;
}

export interface QuestionBank {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  roundType: AssessmentRoundType;
  category: string;
  questionsCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 3. Coding Problems & Test Cases
// ---------------------------------------------------------------------------

export type SupportedLanguage = 'python' | 'javascript' | 'java' | 'cpp';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean; // Hidden test cases evaluate edge conditions
  explanation?: string;
}

export interface CodingProblem {
  id: string;
  bankId?: string;
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  problemStatement: string;
  constraints: string[];
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  initialCodeTemplates: Record<SupportedLanguage, string>;
  testCases: TestCase[];
  marks: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Sanitized student view for a coding problem. Hidden test cases omitted.
 */
export interface StudentCodingProblemView {
  id: string;
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  problemStatement: string;
  constraints: string[];
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  initialCodeTemplates: Record<SupportedLanguage, string>;
  visibleTestCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    explanation?: string;
  }>;
  marks: number;
  tags: string[];
}

export type ExecutionVerdict =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'COMPILATION_ERROR'
  | 'SYNTAX_ERROR'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'DEMO_EVALUATION'
  | 'SECURITY_VIOLATION';

export interface TestCaseExecutionResult {
  testCaseId: string;
  passed: boolean;
  verdict: ExecutionVerdict;
  executionTimeMs: number;
  input: string;
  actualOutput?: string;
  expectedOutput?: string; // Omitted if test case is hidden
  isHidden: boolean;
  errorMessage?: string;
}

export interface CodingExecutionResult {
  problemId: string;
  language: SupportedLanguage;
  verdict: ExecutionVerdict;
  passedCount: number;
  totalCount: number;
  executionTimeMs: number;
  results: TestCaseExecutionResult[];
  score: number;
  maxScore: number;
  feedback: string;
  evaluatedAt: string;
}

// ---------------------------------------------------------------------------
// 4. Interview Practice Session & 5-Dimension Evaluation
// ---------------------------------------------------------------------------

export interface FiveDimensionScores {
  correctness: number;         // 0-100: Accuracy of technical facts & logic
  conceptUnderstanding: number;// 0-100: Grasp of underlying principles
  completeness: number;        // 0-100: Covered key aspects vs surface level
  relevance: number;           // 0-100: Answer directly addressed the prompt
  clarity: number;             // 0-100: Articulation, structure & communication
  overallScore: number;        // 0-100: Weighted composite score
}

export interface InterviewQuestion {
  id: string;
  targetRole: StandardTargetRole | string;
  category: InterviewCategory | string;
  difficulty: DifficultyLevel;
  question: string;
  keyPointsExpected: string[];
  sampleFollowUp?: string;
}

export interface InterviewAnswerEvaluation {
  questionId: string;
  questionText: string;
  answerText: string;
  dimensions: FiveDimensionScores;
  strengths: string[];
  areasToImprove: string[];
  suggestedAnswerModel: string;
  evaluationProvider: 'gemini' | 'rule-based';
  evaluatedAt: string;
}

export interface InterviewPracticeSession {
  id: string;
  tenantId: string;
  studentId: string;
  targetRole: StandardTargetRole | string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, {
    answerText: string;
    evaluation?: InterviewAnswerEvaluation;
    answeredAt: string;
  }>;
  summaryReport?: InterviewSummaryReport;
  startedAt: string;
  completedAt?: string;
}

export interface InterviewSummaryReport {
  sessionId: string;
  targetRole: string;
  totalQuestions: number;
  completedQuestions: number;
  dimensionAverages: FiveDimensionScores;
  categoryBreakdown: Record<string, number>;
  topStrengths: string[];
  recommendedFocusAreas: string[];
  coachingFeedback: string;
  completedAt: string;
}

// ---------------------------------------------------------------------------
// 5. Mock Drive Configuration & Attempts
// ---------------------------------------------------------------------------

export type MockDriveStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface MockDriveRoundConfig {
  id: string;
  roundNumber: number;
  roundType: AssessmentRoundType;
  title: string;
  durationMinutes: number;
  passingScorePercentage: number;
  totalMarks: number;
  questionBankId?: string;
}

export interface MockDrive {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  companyName: string;
  targetRoles: string[];
  status: MockDriveStatus;
  startDate: string;
  endDate: string;
  rounds: MockDriveRoundConfig[];
  registeredStudentsCount: number;
  completedStudentsCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockDriveRegistration {
  id: string;
  tenantId: string;
  driveId: string;
  studentId: string;
  registeredAt: string;
  status: 'REGISTERED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISQUALIFIED';
  currentRound: number;
}

export interface AptitudeAttempt {
  id: string;
  tenantId: string;
  studentId: string;
  driveId?: string;
  roundId?: string;
  questionBankId?: string;
  questions: StudentMCQQuestionView[];
  answers: Record<string, string>; // questionId -> selectedOptionId
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  score?: number;
  maxScore?: number;
  percentage?: number;
  topicBreakdown?: Record<string, {
    total: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    percentage: number;
  }>;
  passed?: boolean;
}

// ---------------------------------------------------------------------------
// 6. Performance Reports & Weakness Identification
// ---------------------------------------------------------------------------

export type WeaknessClassification =
  | 'ASSESSED_STRENGTH'
  | 'IMPROVEMENT_NEEDED'
  | 'NOT_ASSESSED'
  | 'INSUFFICIENT_DATA';

export interface SkillAssessmentVerdict {
  skillName: string;
  category: string;
  scorePercentage: number;
  classification: WeaknessClassification;
  evidenceSummary: string;
  recommendedRemediation: string;
}

export interface MockDrivePerformanceReport {
  id: string;
  tenantId: string;
  driveId: string;
  studentId: string;
  studentName?: string;
  driveTitle: string;
  targetRole: string;
  overallCompositeScore: number;
  percentileRank?: number;
  roundScores: {
    aptitude?: {
      score: number;
      maxScore: number;
      percentage: number;
      passed: boolean;
      topicBreakdown?: Record<string, number>;
    };
    coding?: {
      score: number;
      maxScore: number;
      percentage: number;
      passed: boolean;
      problemsSolved?: number;
      totalProblems?: number;
    };
    interview?: {
      score: number;
      maxScore: number;
      percentage: number;
      passed: boolean;
      dimensions?: FiveDimensionScores;
    };
  };
  skillVerdicts: SkillAssessmentVerdict[];
  topStrengths: string[];
  criticalGaps: string[];
  institutionalBenchmark: {
    averageScore: number;
    highestScore: number;
    participantCount: number;
  };
  generatedAt: string;
}

export interface StudentWeaknessSummary {
  studentId: string;
  tenantId: string;
  targetRole: string;
  assessedStrengths: SkillAssessmentVerdict[];
  improvementNeeded: SkillAssessmentVerdict[];
  notAssessed: string[];
  insufficientData: string[];
  lastAssessedAt: string;
}

// ---------------------------------------------------------------------------
// 7. Personalized Learning Path & Tasks
// ---------------------------------------------------------------------------

export type TaskLifecycleStatus =
  | 'RECOMMENDED'
  | 'IN_PROGRESS'
  | 'SUBMITTED_FOR_REVIEW'
  | 'COMPLETED'
  | 'REJECTED'
  | 'PAUSED';

export type LearningTaskType =
  | 'PROJECT'
  | 'CODING_PRACTICE'
  | 'CONCEPT_STUDY'
  | 'SYSTEM_DESIGN'
  | 'ASSESSMENT';

export interface LearningTaskEvidence {
  submissionType: 'REPOSITORY' | 'DOCUMENTATION' | 'CODE' | 'CERTIFICATE';
  urlOrContent: string;
  notes?: string;
  submittedAt: string;
  reviewerFeedback?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED';
}

export interface LearningTask {
  id: string;
  pathId: string;
  skillName: string;
  targetRole: string;
  title: string;
  description: string;
  taskType: LearningTaskType;
  estimatedHours: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: TaskLifecycleStatus;
  evidence?: LearningTaskEvidence;
  learningResourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPath {
  id: string;
  tenantId: string;
  studentId: string;
  targetRole: string;
  title: string;
  description: string;
  overallProgressPercentage: number;
  totalTasks: number;
  completedTasks: number;
  tasks: LearningTask[];
  createdAt: string;
  updatedAt: string;
}
