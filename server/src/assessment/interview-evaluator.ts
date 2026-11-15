/**
 * CarrerSync Phase 12 — Interview Practice Evaluator
 *
 * Implements hybrid interview evaluation:
 * 1. AI-driven structured evaluation using Google Gemini free-tier model when configured.
 * 2. Deterministic rule-based evaluation fallback when offline or unconfigured.
 * 3. 5-Dimension scoring: Correctness, Concept Understanding, Completeness, Relevance, Clarity.
 * 4. Zero invasive surveillance: STRICTLY no camera/facial tracking, eye-tracking, or behavioral surveillance.
 * 5. Comprehensive question banks for 12 standard roles across 9 interview categories.
 */

import {
  STANDARD_TARGET_ROLES,
  INTERVIEW_CATEGORIES,
  StandardTargetRole,
  InterviewCategory,
  InterviewQuestion,
  InterviewAnswerEvaluation,
  FiveDimensionScores,
  InterviewPracticeSession,
  InterviewSummaryReport
} from './assessment.types';
import { GeminiAIProvider } from '../ai/providers/gemini.provider';

// ---------------------------------------------------------------------------
// Seed Interview Questions Repository (12 Roles x 9 Categories)
// ---------------------------------------------------------------------------

export const SEED_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // 1. Technical Fundamentals / DSA
  {
    id: 'int-dsa-01',
    targetRole: 'Software Engineer',
    category: 'Data Structures and Algorithms',
    difficulty: 'MEDIUM',
    question: 'Explain the difference between an Array and a Linked List in memory allocation and time complexity for search and insertion.',
    keyPointsExpected: [
      'Contiguous vs non-contiguous memory allocation',
      'Array O(1) random access vs Linked List O(n) traversal',
      'Insertion at beginning: Linked List O(1) vs Array O(n) shift',
      'Memory overhead: Linked list requires pointer storage per node'
    ]
  },
  {
    id: 'int-dsa-02',
    targetRole: 'Full Stack Developer',
    category: 'Data Structures and Algorithms',
    difficulty: 'MEDIUM',
    question: 'How does a Hash Table achieve average O(1) time complexity, and how are hash collisions resolved?',
    keyPointsExpected: [
      'Hash function maps key to index array',
      'Collision resolution via separate chaining (linked list / balanced tree) or open addressing (linear/quadratic probing)',
      'Load factor threshold triggers resizing and rehashing'
    ]
  },
  // 2. Database Management
  {
    id: 'int-db-01',
    targetRole: 'Backend Developer',
    category: 'Database Management',
    difficulty: 'HARD',
    question: 'What are ACID properties in relational databases, and how does PostgreSQL implement Isolation and Durability?',
    keyPointsExpected: [
      'Atomicity, Consistency, Isolation, Durability definitions',
      'MVCC (Multi-Version Concurrency Control) for non-blocking reads/writes',
      'Write-Ahead Logging (WAL) and fsync for durability across crashes'
    ]
  },
  {
    id: 'int-db-02',
    targetRole: 'Data Analyst',
    category: 'Database Management',
    difficulty: 'MEDIUM',
    question: 'Compare INNER JOIN, LEFT JOIN, and FULL OUTER JOIN. When would you use a Window Function over a GROUP BY?',
    keyPointsExpected: [
      'Inner join intersection vs Left join all from left table',
      'Full outer join unions matching and unmatched from both',
      'Window functions retain individual row identities while aggregating over partitions (e.g. ROW_NUMBER, RANK, running sum)'
    ]
  },
  // 3. Operating Systems
  {
    id: 'int-os-01',
    targetRole: 'Software Engineer',
    category: 'Operating Systems',
    difficulty: 'MEDIUM',
    question: 'Explain the fundamental differences between a Process and a Thread. How does the OS handle context switching between them?',
    keyPointsExpected: [
      'Process has independent virtual memory address space',
      'Threads share memory, file descriptors, and heap within parent process',
      'Thread context switch is faster because MMU page table cache (TLB) does not need to be flushed'
    ]
  },
  // 4. Computer Networks
  {
    id: 'int-net-01',
    targetRole: 'Cloud Engineer',
    category: 'Computer Networks',
    difficulty: 'MEDIUM',
    question: 'Describe what happens under the hood when a user types https://example.com in their browser and presses Enter.',
    keyPointsExpected: [
      'DNS resolution (browser cache, OS cache, recursive resolver)',
      'TCP 3-way handshake (SYN, SYN-ACK, ACK)',
      'TLS cryptographic handshake (certificate validation, session key negotiation)',
      'HTTP GET request, web server response, DOM parsing and rendering'
    ]
  },
  // 5. Frontend Developer / Web
  {
    id: 'int-fe-01',
    targetRole: 'Frontend Developer',
    category: 'Programming',
    difficulty: 'MEDIUM',
    question: 'Explain the Virtual DOM in React. How does the reconciliation diffing algorithm optimize DOM updates?',
    keyPointsExpected: [
      'Virtual DOM is in-memory JavaScript representation of real DOM',
      'State change creates new VDOM tree; diffed with previous tree using heuristic O(n) algorithm',
      'Keys identify elements across re-renders to prevent unnecessary recreation',
      'Batched updates committed to real DOM in single repaint/reflow'
    ]
  },
  // 6. Python Developer
  {
    id: 'int-py-01',
    targetRole: 'Python Developer',
    category: 'Programming',
    difficulty: 'MEDIUM',
    question: 'What is the Global Interpreter Lock (GIL) in CPython, and how does it affect CPU-bound vs I/O-bound concurrency?',
    keyPointsExpected: [
      'GIL is a mutex protecting access to Python objects, preventing multiple native threads from executing bytecode simultaneously',
      'CPU-bound tasks do not benefit from multithreading (use multiprocessing or C extensions)',
      'I/O-bound tasks release GIL during I/O operations (asyncio or threading is effective)'
    ]
  },
  // 7. Java Developer
  {
    id: 'int-java-01',
    targetRole: 'Java Developer',
    category: 'Programming',
    difficulty: 'MEDIUM',
    question: 'Explain the JVM memory model (Heap, Stack, Metaspace) and how Garbage Collection works in modern JVMs.',
    keyPointsExpected: [
      'Stack stores thread execution frames and local primitives/references',
      'Heap stores objects and arrays, divided into Young (Eden, Survivor) and Old generations',
      'Metaspace stores class metadata in native memory',
      'GC algorithms (G1, ZGC) perform mark-sweep-compact with minimal pause times'
    ]
  },
  // 8. DevOps & Cloud
  {
    id: 'int-devops-01',
    targetRole: 'DevOps Engineer',
    category: 'Role-Specific Questions',
    difficulty: 'HARD',
    question: 'How would you architect a zero-downtime CI/CD deployment pipeline for a high-traffic microservices application?',
    keyPointsExpected: [
      'Blue-Green or Canary deployment strategies',
      'Automated testing gates (lint, unit, integration, smoke tests)',
      'Health check endpoints and automated rollback on error threshold spike',
      'Database schema migration backward compatibility (expand-contract pattern)'
    ]
  },
  // 9. QA Engineer
  {
    id: 'int-qa-01',
    targetRole: 'QA Engineer',
    category: 'Software Engineering',
    difficulty: 'MEDIUM',
    question: 'What is the difference between Boundary Value Analysis (BVA) and Equivalence Partitioning in test design?',
    keyPointsExpected: [
      'Equivalence partitioning divides input data into valid and invalid partitions',
      'BVA focuses on values at edge boundaries (min, min-1, min+1, max, max-1, max+1)',
      'Defects cluster disproportionately at boundaries rather than in the center of partitions'
    ]
  },
  // 10. Cybersecurity Analyst
  {
    id: 'int-sec-01',
    targetRole: 'Cybersecurity Analyst',
    category: 'Role-Specific Questions',
    difficulty: 'HARD',
    question: 'Explain Cross-Site Scripting (XSS) and SQL Injection (SQLi). What defense-in-depth measures mitigate them?',
    keyPointsExpected: [
      'XSS allows execution of malicious scripts in victim browser; mitigated by context-aware output encoding, Content Security Policy (CSP), HttpOnly cookies',
      'SQLi executes arbitrary SQL commands; mitigated by parameterized queries / prepared statements, ORM abstraction, least privilege DB accounts'
    ]
  },
  // 11. Data Scientist
  {
    id: 'int-ds-01',
    targetRole: 'Data Scientist',
    category: 'Role-Specific Questions',
    difficulty: 'HARD',
    question: 'Explain the Bias-Variance tradeoff in machine learning and how regularization techniques (L1 vs L2) address overfitting.',
    keyPointsExpected: [
      'High bias causes underfitting (oversimplified model)',
      'High variance causes overfitting (model models noise in training data)',
      'L1 (Lasso) adds absolute penalty and encourages sparsity (feature selection)',
      'L2 (Ridge) adds squared penalty and shrinks coefficients smoothly'
    ]
  },
  // 12. HR and Communication
  {
    id: 'int-hr-01',
    targetRole: 'Software Engineer',
    category: 'HR and Communication',
    difficulty: 'EASY',
    question: 'Describe a challenging technical situation where you had a disagreement with a team member or deadline constraint. How did you resolve it?',
    keyPointsExpected: [
      'STAR method (Situation, Task, Action, Result)',
      'Professional communication and data-driven debate',
      'Compromise or consensus aligned with product goals',
      'Constructive retrospective and post-launch learnings'
    ]
  }
];

export class InterviewEvaluator {
  private static instance: InterviewEvaluator;
  private readonly geminiProvider: GeminiAIProvider;

  private constructor() {
    this.geminiProvider = new GeminiAIProvider();
  }

  public static getInstance(): InterviewEvaluator {
    if (!InterviewEvaluator.instance) {
      InterviewEvaluator.instance = new InterviewEvaluator();
    }
    return InterviewEvaluator.instance;
  }

  /**
   * Returns list of supported target roles.
   */
  public getSupportedRoles(): readonly string[] {
    return STANDARD_TARGET_ROLES;
  }

  /**
   * Returns list of interview categories.
   */
  public getSupportedCategories(): readonly string[] {
    return INTERVIEW_CATEGORIES;
  }

  /**
   * Fetches practice interview questions for a specified target role.
   */
  public getQuestionsForRole(role: string, count: number = 5): InterviewQuestion[] {
    const normalizedRole = role.toLowerCase().trim();

    // 1. Find role-specific questions
    const matching = SEED_INTERVIEW_QUESTIONS.filter((q) =>
      q.targetRole.toLowerCase().includes(normalizedRole) ||
      normalizedRole.includes(q.targetRole.toLowerCase())
    );

    // 2. Find general technical and HR questions
    const general = SEED_INTERVIEW_QUESTIONS.filter((q) =>
      q.category === 'HR and Communication' ||
      q.category === 'Technical Fundamentals' ||
      q.category === 'Data Structures and Algorithms' ||
      q.category === 'Database Management'
    );

    const combined = [...matching, ...general];
    // Deduplicate by ID
    const uniqueMap = new Map<string, InterviewQuestion>();
    for (const q of combined) {
      uniqueMap.set(q.id, q);
    }

    const list = Array.from(uniqueMap.values());
    return list.slice(0, count);
  }

  /**
   * Evaluates student's answer using hybrid AI + Deterministic fallback.
   */
  public async evaluateAnswer(
    question: InterviewQuestion,
    answerText: string
  ): Promise<InterviewAnswerEvaluation> {
    const evaluatedAt = new Date().toISOString();

    if (!answerText || answerText.trim().length === 0) {
      return {
        questionId: question.id,
        questionText: question.question,
        answerText: '',
        dimensions: {
          correctness: 0,
          conceptUnderstanding: 0,
          completeness: 0,
          relevance: 0,
          clarity: 0,
          overallScore: 0
        },
        strengths: [],
        areasToImprove: ['No answer provided. Attempting to articulate thoughts is critical for interview success.'],
        suggestedAnswerModel: question.keyPointsExpected.join('; '),
        evaluationProvider: 'rule-based',
        evaluatedAt
      };
    }

    // Try AI provider if configured
    if (this.geminiProvider.isConfigured()) {
      try {
        const aiEvaluation = await this.evaluateWithGemini(question, answerText);
        if (aiEvaluation) {
          return {
            ...aiEvaluation,
            questionId: question.id,
            questionText: question.question,
            answerText,
            evaluationProvider: 'gemini',
            evaluatedAt
          };
        }
      } catch (err: any) {
        console.warn(`[InterviewEvaluator] AI evaluation error, falling back to rule-based: ${err.message}`);
      }
    }

    // Deterministic Rule-Based Fallback
    return this.evaluateWithRuleBased(question, answerText, evaluatedAt);
  }

  /**
   * Deterministic rule-based evaluation fallback.
   */
  private evaluateWithRuleBased(
    question: InterviewQuestion,
    answerText: string,
    evaluatedAt: string
  ): InterviewAnswerEvaluation {
    const lowerAnswer = answerText.toLowerCase();
    const keyPoints = question.keyPointsExpected || [];

    let keyPointsMatched = 0;
    const strengths: string[] = [];
    const areasToImprove: string[] = [];

    // Analyze key points coverage
    for (const point of keyPoints) {
      const words = point.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      const matchCount = words.filter((w) => lowerAnswer.includes(w)).length;
      if (matchCount >= 2 || (words.length > 0 && matchCount / words.length >= 0.4)) {
        keyPointsMatched++;
      }
    }

    const wordCount = answerText.trim().split(/\s+/).length;

    // 1. Completeness score based on keypoints matched and length
    const completenessRatio = keyPoints.length > 0 ? keyPointsMatched / keyPoints.length : 0.6;
    let completeness = Math.min(100, Math.round(completenessRatio * 85 + Math.min(15, wordCount / 10)));

    // 2. Correctness score
    let correctness = Math.min(100, Math.round(completenessRatio * 90 + 10));

    // 3. Concept Understanding score
    let conceptUnderstanding = Math.min(100, Math.round(completenessRatio * 80 + (wordCount > 30 ? 20 : 10)));

    // 4. Relevance score (penalize extreme brevity or spam)
    let relevance = wordCount < 5 ? 20 : wordCount < 15 ? 55 : 85;

    // 5. Clarity score (structure, punctuation, sentence count)
    const sentences = answerText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    let clarity = sentences.length >= 3 ? 85 : sentences.length >= 2 ? 75 : 60;

    // Bound all scores 0-100
    correctness = Math.max(0, Math.min(100, correctness));
    conceptUnderstanding = Math.max(0, Math.min(100, conceptUnderstanding));
    completeness = Math.max(0, Math.min(100, completeness));
    relevance = Math.max(0, Math.min(100, relevance));
    clarity = Math.max(0, Math.min(100, clarity));

    const overallScore = Math.round(
      correctness * 0.30 +
      conceptUnderstanding * 0.25 +
      completeness * 0.20 +
      relevance * 0.15 +
      clarity * 0.10
    );

    if (keyPointsMatched > 0) {
      strengths.push(`Successfully addressed ${keyPointsMatched} core technical concepts.`);
    }
    if (wordCount >= 40) {
      strengths.push('Provided a well-elaborated response with sufficient detail.');
    } else {
      areasToImprove.push('Answer could be more thorough; include specific examples or underlying mechanisms.');
    }

    if (completeness < 70) {
      areasToImprove.push('Missing critical foundational points; review expected architecture/principles.');
    }
    if (clarity < 70) {
      areasToImprove.push('Structure your answer with clear transitions (e.g. definitions, trade-offs, and practical examples).');
    }

    const dimensions: FiveDimensionScores = {
      correctness,
      conceptUnderstanding,
      completeness,
      relevance,
      clarity,
      overallScore
    };

    return {
      questionId: question.id,
      questionText: question.question,
      answerText,
      dimensions,
      strengths: strengths.length > 0 ? strengths : ['Good initial attempt.'],
      areasToImprove: areasToImprove.length > 0 ? areasToImprove : ['Keep practicing with timed scenarios.'],
      suggestedAnswerModel: question.keyPointsExpected.join('; '),
      evaluationProvider: 'rule-based',
      evaluatedAt
    };
  }

  /**
   * Invokes Gemini for structured AI answer evaluation.
   */
  private async evaluateWithGemini(
    question: InterviewQuestion,
    answerText: string
  ): Promise<Omit<InterviewAnswerEvaluation, 'questionId' | 'questionText' | 'answerText' | 'evaluationProvider' | 'evaluatedAt'> | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const prompt = `
You are a senior technical interviewer evaluating a student candidate's response.
Evaluation Guidelines:
- Question: "${question.question}"
- Category: "${question.category}"
- Role: "${question.targetRole}"
- Expected Key Points: ${JSON.stringify(question.keyPointsExpected)}
- Candidate Answer: "${answerText}"

Provide a structured evaluation JSON with 5 dimensional scores (0 to 100):
- correctness: Accuracy of technical claims and facts.
- conceptUnderstanding: Depth of theoretical grasp.
- completeness: Coverage of essential components.
- relevance: Focus on the prompt without unnecessary tangents.
- clarity: Coherence, structure, and communication effectiveness.
- overallScore: Weighted composite score (0 to 100).
- strengths: List of 2-3 specific positive aspects.
- areasToImprove: List of 2-3 concrete constructive suggestions.
- suggestedAnswerModel: A concise exemplary model answer.

Respond ONLY with valid JSON matching:
{
  "dimensions": {
    "correctness": number,
    "conceptUnderstanding": number,
    "completeness": number,
    "relevance": number,
    "clarity": number,
    "overallScore": number
  },
  "strengths": string[],
  "areasToImprove": string[],
  "suggestedAnswerModel": string
}
`;

    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!resp.ok) return null;
      const data: any = await resp.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      const parsed = JSON.parse(rawText);
      return {
        dimensions: {
          correctness: Math.round(parsed.dimensions?.correctness ?? 70),
          conceptUnderstanding: Math.round(parsed.dimensions?.conceptUnderstanding ?? 70),
          completeness: Math.round(parsed.dimensions?.completeness ?? 70),
          relevance: Math.round(parsed.dimensions?.relevance ?? 75),
          clarity: Math.round(parsed.dimensions?.clarity ?? 75),
          overallScore: Math.round(parsed.dimensions?.overallScore ?? 72)
        },
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Clear articulation of technical concepts.'],
        areasToImprove: Array.isArray(parsed.areasToImprove) ? parsed.areasToImprove : ['Consider adding concrete production examples.'],
        suggestedAnswerModel: parsed.suggestedAnswerModel || question.keyPointsExpected.join('; ')
      };
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }

  /**
   * Compiles complete practice session summary report.
   */
  public generateSessionReport(session: InterviewPracticeSession): InterviewSummaryReport {
    const totalQuestions = session.questions.length;
    const answeredEntries = Object.entries(session.answers);
    const completedQuestions = answeredEntries.length;

    let sumCorrectness = 0;
    let sumConcept = 0;
    let sumCompleteness = 0;
    let sumRelevance = 0;
    let sumClarity = 0;
    let sumOverall = 0;

    const categoryMap: Record<string, { total: number; scoreSum: number }> = {};
    const allStrengths: string[] = [];
    const allGaps: string[] = [];

    for (const [qId, ans] of answeredEntries) {
      const q = session.questions.find((x) => x.id === qId);
      const evalScores = ans.evaluation?.dimensions;
      if (evalScores) {
        sumCorrectness += evalScores.correctness;
        sumConcept += evalScores.conceptUnderstanding;
        sumCompleteness += evalScores.completeness;
        sumRelevance += evalScores.relevance;
        sumClarity += evalScores.clarity;
        sumOverall += evalScores.overallScore;

        if (q) {
          if (!categoryMap[q.category]) {
            categoryMap[q.category] = { total: 0, scoreSum: 0 };
          }
          categoryMap[q.category].total++;
          categoryMap[q.category].scoreSum += evalScores.overallScore;
        }

        if (ans.evaluation?.strengths) {
          allStrengths.push(...ans.evaluation.strengths);
        }
        if (ans.evaluation?.areasToImprove) {
          allGaps.push(...ans.evaluation.areasToImprove);
        }
      }
    }

    const count = completedQuestions || 1;
    const dimensionAverages: FiveDimensionScores = {
      correctness: Math.round(sumCorrectness / count),
      conceptUnderstanding: Math.round(sumConcept / count),
      completeness: Math.round(sumCompleteness / count),
      relevance: Math.round(sumRelevance / count),
      clarity: Math.round(sumClarity / count),
      overallScore: Math.round(sumOverall / count)
    };

    const categoryBreakdown: Record<string, number> = {};
    for (const [cat, data] of Object.entries(categoryMap)) {
      categoryBreakdown[cat] = Math.round(data.scoreSum / data.total);
    }

    return {
      sessionId: session.id,
      targetRole: session.targetRole,
      totalQuestions,
      completedQuestions,
      dimensionAverages,
      categoryBreakdown,
      topStrengths: Array.from(new Set(allStrengths)).slice(0, 3),
      recommendedFocusAreas: Array.from(new Set(allGaps)).slice(0, 3),
      coachingFeedback: `Completed ${completedQuestions} of ${totalQuestions} interview questions with an overall composite rating of ${dimensionAverages.overallScore}/100.`,
      completedAt: new Date().toISOString()
    };
  }
}

export const interviewEvaluator = InterviewEvaluator.getInstance();
