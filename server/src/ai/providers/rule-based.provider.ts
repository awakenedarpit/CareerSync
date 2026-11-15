/**
 * Rule-Based AI Profiling Provider
 * 
 * Deterministic skill and competency extraction engine.
 * Uses keyword taxonomies, regex pattern recognizers, and structural context analyzers.
 * 
 * Zero external API dependencies, zero network requests, 100% reliable fallback.
 * 
 * Evidence Attribution Rules:
 * - Resume mention only: RESUME / PENDING_REVIEW (confidence: 0.55)
 * - Project description: PROJECT / EVIDENCE_FOUND (confidence: 0.80)
 * - Certification: CERTIFICATE / PENDING_REVIEW (confidence: 0.75)
 */

import type {
  ExtractedSkill,
  ExtractedProject,
  ExtractedCertification,
  Coursework,
  ExtractionWarning,
  ProfilingExtractionResult,
  DocumentAnalysisOptions,
  SkillCategory,
} from '../ai.types';
import type { IAIService } from '../ai.interface';

interface SkillTaxonomyDefinition {
  name: string;
  category: SkillCategory;
  patterns: RegExp[];
  aliases?: string[];
}

export class RuleBasedAIProvider implements IAIService {
  private readonly taxonomy: SkillTaxonomyDefinition[] = [
    // Programming Languages
    { name: 'JavaScript', category: 'programming_languages', patterns: [/\bjavascript\b/i, /\bjs\b/i, /\bes6\b/i] },
    { name: 'TypeScript', category: 'programming_languages', patterns: [/\btypescript\b/i, /\bts\b/i] },
    { name: 'Python', category: 'programming_languages', patterns: [/\bpython\b/i, /\bpy\b/i] },
    { name: 'Java', category: 'programming_languages', patterns: [/\bjava\b(?!\s*script)/i] },
    { name: 'C++', category: 'programming_languages', patterns: [/\bc\+\+\b/i, /\bcpp\b/i] },
    { name: 'C', category: 'programming_languages', patterns: [/\bC\s*(?:language|\/C\+\+|programming)\b/i, /\bansi\s+c\b/i] },
    { name: 'C#', category: 'programming_languages', patterns: [/\bc#\b/i, /\bcsharp\b/i] },
    { name: 'Go', category: 'programming_languages', patterns: [/\bgolang\b/i, /\bgo\s+language\b/i] },
    { name: 'Rust', category: 'programming_languages', patterns: [/\brust\b/i, /\brust-lang\b/i] },
    { name: 'Ruby', category: 'programming_languages', patterns: [/\bruby\b/i] },
    { name: 'PHP', category: 'programming_languages', patterns: [/\bphp\b/i] },
    { name: 'Swift', category: 'programming_languages', patterns: [/\bswift\b/i] },
    { name: 'Kotlin', category: 'programming_languages', patterns: [/\bkotlin\b/i] },
    { name: 'SQL', category: 'programming_languages', patterns: [/\bsql\b/i, /\bstructured\s+query\s+language\b/i] },
    { name: 'Bash/Shell', category: 'programming_languages', patterns: [/\bbash\b/i, /\bshell\s+scripting\b/i, /\bzsh\b/i] },

    // Frameworks & Libraries
    { name: 'React', category: 'frameworks', patterns: [/\breact(?:\.js)?\b/i, /\breactjs\b/i] },
    { name: 'Node.js', category: 'frameworks', patterns: [/\bnode(?:\.js)?\b/i, /\bnodejs\b/i] },
    { name: 'Express.js', category: 'frameworks', patterns: [/\bexpress(?:\.js)?\b/i] },
    { name: 'Next.js', category: 'frameworks', patterns: [/\bnext(?:\.js)?\b/i, /\bnextjs\b/i] },
    { name: 'Angular', category: 'frameworks', patterns: [/\bangular(?:\.js|\s*\d+)?\b/i] },
    { name: 'Vue.js', category: 'frameworks', patterns: [/\bvue(?:\.js)?\b/i, /\bvuejs\b/i] },
    { name: 'NestJS', category: 'frameworks', patterns: [/\bnest\.?js\b/i, /\bnestjs\b/i] },
    { name: 'Django', category: 'frameworks', patterns: [/\bdjango\b/i] },
    { name: 'Flask', category: 'frameworks', patterns: [/\bflask\b/i] },
    { name: 'FastAPI', category: 'frameworks', patterns: [/\bfastapi\b/i] },
    { name: 'Spring Boot', category: 'frameworks', patterns: [/\bspring\s*boot\b/i, /\bspring\s+framework\b/i] },
    { name: 'ASP.NET Core', category: 'frameworks', patterns: [/\basp\.net(?:\s*core)?\b/i, /\bdotnet(?:\s*core)?\b/i] },
    { name: 'Tailwind CSS', category: 'frameworks', patterns: [/\btailwind(?:\s*css)?\b/i] },
    { name: 'Bootstrap', category: 'frameworks', patterns: [/\bbootstrap\b/i] },

    // Databases
    { name: 'PostgreSQL', category: 'databases', patterns: [/\bpostgres(?:ql)?\b/i] },
    { name: 'MySQL', category: 'databases', patterns: [/\bmysql\b/i] },
    { name: 'MongoDB', category: 'databases', patterns: [/\bmongodb\b/i, /\bmongoose\b/i] },
    { name: 'Redis', category: 'databases', patterns: [/\bredis\b/i] },
    { name: 'SQLite', category: 'databases', patterns: [/\bsqlite\b/i] },
    { name: 'Oracle Database', category: 'databases', patterns: [/\boracle(?:\s*db|\s*database)?\b/i] },
    { name: 'Cassandra', category: 'databases', patterns: [/\bcassandra\b/i] },
    { name: 'DynamoDB', category: 'databases', patterns: [/\bdynamodb\b/i] },
    { name: 'Firebase', category: 'databases', patterns: [/\bfirebase\b/i, /\bfirestore\b/i] },

    // Cloud & DevOps
    { name: 'AWS', category: 'cloud_devops', patterns: [/\baws\b/i, /\bamazon\s+web\s+services\b/i] },
    { name: 'Azure', category: 'cloud_devops', patterns: [/\bazure\b/i, /\bmicrosoft\s+azure\b/i] },
    { name: 'Google Cloud Platform (GCP)', category: 'cloud_devops', patterns: [/\bgcp\b/i, /\bgoogle\s+cloud\b/i] },
    { name: 'Docker', category: 'cloud_devops', patterns: [/\bdocker\b/i, /\bcontainerization\b/i] },
    { name: 'Kubernetes', category: 'cloud_devops', patterns: [/\bkubernetes\b/i, /\bk8s\b/i] },
    { name: 'Terraform', category: 'cloud_devops', patterns: [/\bterraform\b/i] },
    { name: 'CI/CD', category: 'cloud_devops', patterns: [/\bci\/?cd\b/i, /\bcontinuous\s+integration\b/i] },
    { name: 'GitHub Actions', category: 'cloud_devops', patterns: [/\bgithub\s+actions\b/i] },
    { name: 'Jenkins', category: 'cloud_devops', patterns: [/\bjenkins\b/i] },
    { name: 'Linux', category: 'cloud_devops', patterns: [/\blinux\b/i, /\bubuntu\b/i, /\bdebian\b/i] },
    { name: 'Nginx', category: 'cloud_devops', patterns: [/\bnginx\b/i] },

    // Tools
    { name: 'Git', category: 'tools', patterns: [/\bgit\b(?!\s*hub|\s*lab)/i, /\bversion\s+control\b/i] },
    { name: 'GitHub', category: 'tools', patterns: [/\bgithub\b/i] },
    { name: 'Postman', category: 'tools', patterns: [/\bpostman\b/i] },
    { name: 'Jira', category: 'tools', patterns: [/\bjira\b/i] },
    { name: 'Figma', category: 'tools', patterns: [/\bfigma\b/i] },
    { name: 'Vite', category: 'tools', patterns: [/\bvite(?:\.js)?\b/i] },
    { name: 'Webpack', category: 'tools', patterns: [/\bwebpack\b/i] },

    // Data & AI / Machine Learning
    { name: 'Machine Learning', category: 'data_ai', patterns: [/\bmachine\s+learning\b/i, /\bml\b/i] },
    { name: 'Deep Learning', category: 'data_ai', patterns: [/\bdeep\s+learning\b/i] },
    { name: 'PyTorch', category: 'data_ai', patterns: [/\bpytorch\b/i] },
    { name: 'TensorFlow', category: 'data_ai', patterns: [/\btensorflow\b/i] },
    { name: 'Pandas', category: 'data_ai', patterns: [/\bpandas\b/i] },
    { name: 'NumPy', category: 'data_ai', patterns: [/\bnumpy\b/i] },
    { name: 'Scikit-Learn', category: 'data_ai', patterns: [/\bscikit-learn\b/i, /\bsklearn\b/i] },
    { name: 'OpenCV', category: 'data_ai', patterns: [/\bopencv\b/i] },
    { name: 'NLP', category: 'data_ai', patterns: [/\bnlp\b/i, /\bnatural\s+language\s+processing\b/i] },
    { name: 'Large Language Models (LLMs)', category: 'data_ai', patterns: [/\bllm\b/i, /\blarge\s+language\s+models?\b/i] },

    // Core CS
    { name: 'Data Structures & Algorithms', category: 'core_cs', patterns: [/\bdsa\b/i, /\bdata\s+structures\s*(?:&|and)\s*algorithms\b/i] },
    { name: 'Object-Oriented Programming (OOP)', category: 'core_cs', patterns: [/\boop\b/i, /\bobject-oriented\b/i] },
    { name: 'Database Management Systems (DBMS)', category: 'core_cs', patterns: [/\bdbms\b/i, /\bdatabase\s+management\b/i] },
    { name: 'Operating Systems', category: 'core_cs', patterns: [/\boperating\s+systems?\b/i] },
    { name: 'Computer Networks', category: 'core_cs', patterns: [/\bcomputer\s+networks?\b/i, /\btcp\/ip\b/i] },
    { name: 'System Design', category: 'core_cs', patterns: [/\bsystem\s+design\b/i, /\bmicroservices\b/i] },
  ];

  public async analyzeDocument(
    text: string,
    options?: DocumentAnalysisOptions
  ): Promise<ProfilingExtractionResult> {
    const startTime = Date.now();
    const documentId = options?.documentId || 'doc-local';
    const documentType = options?.documentType || 'resume';

    const warnings: ExtractionWarning[] = [];

    // Parse sections
    const sections = this.extractSections(text);

    // Extract projects
    const projects = this.extractProjects(sections.projects || '', documentId);

    // Extract certifications
    const certifications = this.extractCertifications(
      sections.certifications || '',
      text
    );

    // Extract coursework
    const coursework = this.extractCoursework(sections.academics || '', text);

    // Extract and categorize skills with evidence source evaluation
    const skills = this.extractSkillsWithEvidence(
      text,
      sections,
      projects,
      certifications,
      documentId
    );

    if (skills.length === 0) {
      warnings.push({
        code: 'NO_SKILLS_DETECTED',
        message: 'No recognizable technical skills identified in document text.',
        severity: 'medium',
      });
    }

    if (projects.length === 0 && documentType === 'resume') {
      warnings.push({
        code: 'NO_PROJECTS_FOUND',
        message: 'No distinct project sections detected. Skills lack hands-on evidence linkage.',
        severity: 'low',
      });
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      skills,
      projects,
      certifications,
      coursework,
      warnings,
      metadata: {
        provider: 'rule-based',
        model: 'deterministic-taxonomy-v1',
        extractedAt: new Date().toISOString(),
        processingTimeMs,
        documentId,
        documentType,
        redactedEntitiesCount: 0,
      },
    };
  }

  /**
   * Partitions document text into semantic sections based on conventional headers.
   */
  private extractSections(text: string): Record<string, string> {
    const lines = text.split(/\r?\n/);
    const sections: Record<string, string[]> = {
      skills: [],
      projects: [],
      certifications: [],
      academics: [],
      experience: [],
      general: [],
    };

    let currentSection = 'general';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      const lower = line.toLowerCase();

      if (
        /^(?:technical\s+)?skills(?:\s*&|\s+and\s+abilities|\s+summary)?[:\s]*$/i.test(line) ||
        /^(?:core\s+competencies|technologies|tools\s*&\s*technologies)[:\s]*$/i.test(line)
      ) {
        currentSection = 'skills';
        continue;
      } else if (
        /^(?:academic\s+|personal\s+)?projects[:\s]*$/i.test(line) ||
        /^(?:key\s+projects|project\s+experience)[:\s]*$/i.test(line)
      ) {
        currentSection = 'projects';
        continue;
      } else if (
        /^(?:licenses\s*&|\s+and\s+)?certifications?[:\s]*$/i.test(line) ||
        /^(?:certificates|credentials)[:\s]*$/i.test(line)
      ) {
        currentSection = 'certifications';
        continue;
      } else if (
        /^(?:education|academics|relevant\s+coursework)[:\s]*$/i.test(line)
      ) {
        currentSection = 'academics';
        continue;
      } else if (
        /^(?:work\s+)?experience|employment(?:\s+history)?|internships?[:\s]*$/i.test(line)
      ) {
        currentSection = 'experience';
        continue;
      }

      sections[currentSection].push(rawLine);
    }

    return {
      skills: sections.skills.join('\n'),
      projects: sections.projects.join('\n'),
      certifications: sections.certifications.join('\n'),
      academics: sections.academics.join('\n'),
      experience: sections.experience.join('\n'),
      general: sections.general.join('\n'),
    };
  }

  /**
   * Extracts project items from the project section text.
   */
  private extractProjects(projectsText: string, documentId: string): ExtractedProject[] {
    if (!projectsText.trim()) return [];

    const projects: ExtractedProject[] = [];
    const paragraphs = projectsText.split(/\n\s*\n/);

    for (const para of paragraphs) {
      const lines = para.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      const firstLine = lines[0];
      // Title extraction heuristic (ignore short noise lines)
      let title = firstLine.replace(/^[-*•#\d.]+\s*/, '').trim();
      if (!title || title.length > 100) {
        title = firstLine.substring(0, 60);
      }

      const description = lines.slice(1).join(' ');

      // Find technologies mentioned in this project block
      const technologies: string[] = [];
      const combinedProjectText = para.toLowerCase();

      for (const item of this.taxonomy) {
        if (item.patterns.some((pattern) => pattern.test(combinedProjectText))) {
          if (!technologies.includes(item.name)) {
            technologies.push(item.name);
          }
        }
      }

      // Detect links
      const liveUrlMatch = para.match(/https?:\/\/(?!github\.com)[^\s)]+/i);
      const repoUrlMatch = para.match(/https?:\/\/github\.com\/[^\s)]+/i);

      projects.push({
        title,
        description: description || undefined,
        technologies,
        liveUrl: liveUrlMatch ? liveUrlMatch[0] : undefined,
        repoUrl: repoUrlMatch ? repoUrlMatch[0] : undefined,
        highlights: lines.slice(1).filter((l) => /^[-*•]/.test(l)),
      });
    }

    return projects;
  }

  /**
   * Extracts certifications from text.
   */
  private extractCertifications(
    certSectionText: string,
    fullText: string
  ): ExtractedCertification[] {
    const certs: ExtractedCertification[] = [];
    const targetText = certSectionText.trim() ? certSectionText : fullText;

    const certPatterns = [
      { pattern: /(?:AWS\s+Certified[^\n\r,]+)/gi, issuer: 'Amazon Web Services (AWS)' },
      { pattern: /(?:Microsoft\s+Certified[^\n\r,]+|Azure\s+Fundamentals[^\n\r,]*)/gi, issuer: 'Microsoft' },
      { pattern: /(?:Google\s+Cloud\s+Certified[^\n\r,]+)/gi, issuer: 'Google Cloud' },
      { pattern: /(?:Certified\s+Kubernetes\s+(?:Administrator|Application\s+Developer))/gi, issuer: 'CNCF / Linux Foundation' },
      { pattern: /(?:HackerRank\s+[^\n\r,]+)/gi, issuer: 'HackerRank' },
      { pattern: /(?:Coursera[:\s]+[^\n\r,]+)/gi, issuer: 'Coursera' },
      { pattern: /(?:Oracle\s+Certified[^\n\r,]+)/gi, issuer: 'Oracle' },
    ];

    for (const { pattern, issuer } of certPatterns) {
      const matches = targetText.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleanName = match.replace(/^[-*•]\s*/, '').trim();
          if (!certs.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
            certs.push({
              name: cleanName,
              issuer,
            });
          }
        }
      }
    }

    // Also look for individual lines in cert section if present
    if (certSectionText.trim()) {
      const lines = certSectionText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        const clean = line.replace(/^[-*•\d.]+\s*/, '').trim();
        if (
          clean.length > 5 &&
          clean.length < 90 &&
          !certs.some((c) => c.name.toLowerCase() === clean.toLowerCase())
        ) {
          certs.push({
            name: clean,
          });
        }
      }
    }

    return certs;
  }

  /**
   * Extracts coursework entries.
   */
  private extractCoursework(academicsText: string, fullText: string): Coursework[] {
    const courseworkList: Coursework[] = [];
    const source = academicsText.trim() ? academicsText : fullText;

    const subjects = [
      'Data Structures',
      'Algorithms',
      'Database Management Systems',
      'Operating Systems',
      'Computer Networks',
      'Software Engineering',
      'Compiler Design',
      'Theory of Computation',
      'Artificial Intelligence',
      'Machine Learning',
    ];

    for (const subject of subjects) {
      const regex = new RegExp(`\\b${subject}\\b`, 'i');
      if (regex.test(source)) {
        courseworkList.push({
          name: subject,
          skillsCovered: [subject],
        });
      }
    }

    return courseworkList;
  }

  /**
   * Identifies skills, evaluates evidence sources, assigns calibrated confidence scores,
   * non-verified statuses, and generates human-readable explanations.
   */
  private extractSkillsWithEvidence(
    fullText: string,
    sections: Record<string, string>,
    projects: ExtractedProject[],
    certifications: ExtractedCertification[],
    documentId: string
  ): ExtractedSkill[] {
    const extractedSkills: ExtractedSkill[] = [];
    const lowerFullText = fullText.toLowerCase();

    for (const item of this.taxonomy) {
      // Check if any pattern matches the document
      const isPresent = item.patterns.some((pattern) => pattern.test(lowerFullText));
      if (!isPresent) continue;

      let evidenceType: string = 'RESUME';
      let verificationStatus: string = 'PENDING_REVIEW';
      let confidence = 0.55;
      let description = `Skill "${item.name}" listed in resume content.`;
      let explanation = `Skill "${item.name}" was declared in resume text without inspectable implementation. Stored as claim pending reviewer validation.`;

      // 1. Check if backed by a Certification
      const certMatch = certifications.find((cert) =>
        item.patterns.some((pattern) => pattern.test(cert.name.toLowerCase()))
      );
      if (certMatch) {
        evidenceType = 'CERTIFICATE';
        verificationStatus = 'PENDING_REVIEW';
        confidence = 0.75;
        description = `Backed by certification: "${certMatch.name}"`;
        explanation = `Skill "${item.name}" is evidenced by certification "${certMatch.name}". Assigned PENDING_REVIEW status with elevated confidence (0.75).`;
      }

      // 2. Check if implemented within a concrete Project (higher evidence strength)
      const projectMatch = projects.find((proj) =>
        proj.technologies.some((tech) => tech.toLowerCase() === item.name.toLowerCase())
      );
      if (projectMatch) {
        evidenceType = 'PROJECT';
        verificationStatus = 'EVIDENCE_FOUND';
        confidence = 0.80;
        description = `Demonstrated in project "${projectMatch.title}"`;
        explanation = `Skill "${item.name}" is evidenced through implementation in project "${projectMatch.title}". Assigned EVIDENCE_FOUND status with confidence 0.80.`;
      }

      extractedSkills.push({
        name: item.name,
        category: item.category,
        proficiencyClaim: 'intermediate',
        evidence: [
          {
            documentId,
            evidenceType,
            description,
          },
        ],
        confidence,
        verificationStatus,
        explanation,
      });
    }

    return extractedSkills;
  }
}
