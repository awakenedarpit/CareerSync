/**
 * AI Module Type Definitions
 * 
 * Defines standard contracts for skills, projects, certifications, coursework,
 * warnings, and profiling extraction outputs across AI providers.
 */

export interface EvidenceItem {
  documentId?: string;
  evidenceType: string;
  description: string;
}

export type SkillCategory =
  | 'programming_languages'
  | 'frameworks'
  | 'databases'
  | 'cloud_devops'
  | 'core_cs'
  | 'data_ai'
  | 'soft_skills'
  | 'tools'
  | string;

export type ProficiencyClaim =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert'
  | 'unspecified'
  | string;

export type SkillVerificationStatus =
  | 'Claimed'
  | 'Observed'
  | 'Evidence-linked'
  | 'Pending_Review'
  | 'PENDING_REVIEW'
  | 'EVIDENCE_FOUND'
  | 'CLAIMED'
  | 'OBSERVED'
  | string;

export interface ExtractedSkill {
  name: string;
  category: SkillCategory;
  proficiencyClaim?: ProficiencyClaim;
  evidence: EvidenceItem[];
  confidence: number; // 0.0 to 1.0
  verificationStatus: SkillVerificationStatus;
  explanation?: string;
}

export interface ExtractedProject {
  title: string;
  description?: string;
  technologies: string[];
  role?: string;
  liveUrl?: string;
  repoUrl?: string;
  startDate?: string;
  endDate?: string;
  highlights?: string[];
}

export interface ExtractedCertification {
  name: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  verificationUrl?: string;
}

export interface Coursework {
  name: string;
  institution?: string;
  grade?: string;
  skillsCovered?: string[];
}

export interface ExtractionWarning {
  code: string;
  message: string;
  field?: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface ProfilingMetadata {
  provider: 'gemini' | 'rule-based' | string;
  model?: string;
  extractedAt: string;
  processingTimeMs: number;
  documentId?: string;
  documentType?: string;
  redactedEntitiesCount?: number;
}

export interface ProfilingExtractionResult {
  skills: ExtractedSkill[];
  projects: ExtractedProject[];
  certifications: ExtractedCertification[];
  coursework: Coursework[];
  warnings: ExtractionWarning[];
  metadata: ProfilingMetadata;
}

export interface DocumentAnalysisOptions {
  documentType?: string;
  documentId?: string;
  timeoutMs?: number;
  forceProvider?: 'gemini' | 'rule-based';
  skipPIIFilter?: boolean;
}
