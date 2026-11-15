/**
 * CarrerSync Phase 13 — Skill Taxonomy Service
 *
 * Implements:
 * 1. Pre-seeded canonical taxonomy across 8 industry-standard categories:
 *    - Programming Languages
 *    - Frontend
 *    - Backend
 *    - Database
 *    - Cloud & DevOps
 *    - Data & AI
 *    - Core Computer Science
 *    - Professional Skills
 * 2. High-speed alias resolution and canonical normalization.
 * 3. External standard mappings (ESCO, O*NET, and India NSQF level).
 * 4. Custom skill registration and search.
 */

import { randomUUID as uuidv4 } from 'crypto';
import {
  SkillCategory,
  SKILL_CATEGORIES,
  TaxonomySkill
} from './industry.types';

export class SkillTaxonomyService {
  private static instance: SkillTaxonomyService;

  // Canonical name -> TaxonomySkill
  private skillsMap = new Map<string, TaxonomySkill>();

  // Normalized alias (lowercased, stripped) -> Canonical Name
  private aliasIndex = new Map<string, string>();

  private constructor() {
    this.seedDefaultTaxonomy();
  }

  public static getInstance(): SkillTaxonomyService {
    if (!SkillTaxonomyService.instance) {
      SkillTaxonomyService.instance = new SkillTaxonomyService();
    }
    return SkillTaxonomyService.instance;
  }

  /**
   * Normalizes arbitrary string for resilient matching (lowercase, strip symbols & extra whitespace)
   */
  public normalizeKey(input: string): string {
    if (!input) return '';
    return input
      .trim()
      .toLowerCase()
      .replace(/[\s\-_./\\+]+/g, '');
  }

  /**
   * Resolves any skill name or variant/alias to its canonical name.
   * If no canonical match is found, returns clean capitalized version of input.
   */
  public resolveCanonicalName(input: string): string {
    if (!input || !input.trim()) return '';
    const key = this.normalizeKey(input);
    const resolved = this.aliasIndex.get(key);
    if (resolved) return resolved;

    // Direct check against canonical keys
    for (const [canonical, skill] of this.skillsMap.entries()) {
      if (this.normalizeKey(canonical) === key) {
        return skill.canonicalName;
      }
    }

    return input.trim();
  }

  /**
   * Returns complete canonical taxonomy item if found.
   */
  public getSkillByCanonicalName(canonicalName: string): TaxonomySkill | undefined {
    const resolved = this.resolveCanonicalName(canonicalName);
    return this.skillsMap.get(resolved);
  }

  /**
   * Returns all pre-seeded and custom taxonomy skills.
   */
  public getAllSkills(): TaxonomySkill[] {
    return Array.from(this.skillsMap.values());
  }

  /**
   * Filters skills by one of the 8 canonical categories.
   */
  public getSkillsByCategory(category: SkillCategory): TaxonomySkill[] {
    return this.getAllSkills().filter((s) => s.category === category);
  }

  /**
   * Returns list of widely demanded skills across industries.
   */
  public getPopularSkills(): TaxonomySkill[] {
    return this.getAllSkills().filter((s) => s.isPopularDemand);
  }

  /**
   * Searches skills by keyword across canonical name, aliases, and description.
   */
  public searchSkills(query: string): TaxonomySkill[] {
    if (!query || !query.trim()) return this.getAllSkills();
    const q = query.trim().toLowerCase();

    return this.getAllSkills().filter((skill) => {
      if (skill.canonicalName.toLowerCase().includes(q)) return true;
      if (skill.description.toLowerCase().includes(q)) return true;
      return skill.aliases.some((alias) => alias.toLowerCase().includes(q));
    });
  }

  /**
   * Registers a new custom skill into the taxonomy.
   */
  public registerSkill(skillData: {
    canonicalName: string;
    category: SkillCategory;
    aliases?: string[];
    description?: string;
    isPopularDemand?: boolean;
    escoUri?: string;
    onetCode?: string;
    nsqfLevel?: number;
  }): TaxonomySkill {
    const existing = this.skillsMap.get(skillData.canonicalName);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const newSkill: TaxonomySkill = {
      id: uuidv4(),
      canonicalName: skillData.canonicalName.trim(),
      category: skillData.category,
      aliases: skillData.aliases || [],
      description: skillData.description || `${skillData.canonicalName} technical competency`,
      isPopularDemand: Boolean(skillData.isPopularDemand),
      externalMappings: {
        escoUri: skillData.escoUri,
        onetCode: skillData.onetCode,
        nsqfLevel: skillData.nsqfLevel || 6,
        carrersyncCategory: skillData.category
      },
      createdAt: now,
      updatedAt: now
    };

    this.skillsMap.set(newSkill.canonicalName, newSkill);

    // Index canonical name
    this.aliasIndex.set(this.normalizeKey(newSkill.canonicalName), newSkill.canonicalName);

    // Index all aliases
    for (const alias of newSkill.aliases) {
      this.aliasIndex.set(this.normalizeKey(alias), newSkill.canonicalName);
    }

    return newSkill;
  }

  /**
   * Seeds comprehensive default taxonomy across all 8 standard categories.
   */
  private seedDefaultTaxonomy(): void {
    const initialSkills: Array<{
      name: string;
      category: SkillCategory;
      aliases: string[];
      description: string;
      popular: boolean;
      onet?: string;
      esco?: string;
      nsqf?: number;
    }> = [
      // 1. Programming Languages
      {
        name: 'Python',
        category: 'Programming Languages',
        aliases: ['py', 'python3', 'python2', 'cpython'],
        description: 'Interpreted, high-level, general-purpose programming language widely used in AI, web development, and data engineering.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/e322b647-73d8-4f51-b0db-64df4df22368',
        nsqf: 7
      },
      {
        name: 'JavaScript',
        category: 'Programming Languages',
        aliases: ['js', 'ecmascript', 'es6', 'es2020', 'vanilla js'],
        description: 'Dynamic scripting language that is the foundational technology of the World Wide Web and Node.js runtimes.',
        popular: true,
        onet: '15-1254.00',
        esco: 'http://data.europa.eu/esco/skill/4426563d-a417-4952-b108-a57007421c60',
        nsqf: 7
      },
      {
        name: 'TypeScript',
        category: 'Programming Languages',
        aliases: ['ts', 'typescriptlang'],
        description: 'Strict syntactical superset of JavaScript that adds optional static typing for scalable enterprise applications.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/4426563d-a417-4952-b108-a57007421c60',
        nsqf: 7
      },
      {
        name: 'Java',
        category: 'Programming Languages',
        aliases: ['java8', 'java11', 'java17', 'java21', 'core java'],
        description: 'Object-oriented, class-based language designed to have as few implementation dependencies as possible (WORA).',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/2a2e4136-1e0e-4091-bbd4-53907e8d6728',
        nsqf: 7
      },
      {
        name: 'C++',
        category: 'Programming Languages',
        aliases: ['cpp', 'c plus plus', 'cxx'],
        description: 'High-performance compiled language with low-level memory manipulation, widely used in systems, game engines, and competitive programming.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/96f86c25-39fe-45df-bbca-83445e99aa56',
        nsqf: 7
      },
      {
        name: 'C#',
        category: 'Programming Languages',
        aliases: ['csharp', 'c sharp', 'dotnet c#'],
        description: 'Modern, object-oriented language developed by Microsoft for the .NET ecosystem and enterprise systems.',
        popular: false,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/f7a01a30-80ea-4395-9730-17e9fe558d11',
        nsqf: 7
      },
      {
        name: 'Go',
        category: 'Programming Languages',
        aliases: ['golang'],
        description: 'Statically typed, compiled programming language designed at Google for high-concurrency network servers and distributed systems.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/b689aa45-975f-4a0b-80a5-f86a2f4ca6b8',
        nsqf: 7
      },
      {
        name: 'Rust',
        category: 'Programming Languages',
        aliases: ['rustlang', 'rust-lang'],
        description: 'Systems language focused on safety, speed, and concurrency with guaranteed memory safety without garbage collection.',
        popular: false,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/b689aa45-975f-4a0b-80a5-f86a2f4ca6b8',
        nsqf: 7
      },
      {
        name: 'SQL',
        category: 'Programming Languages',
        aliases: ['ansi sql', 'structured query language'],
        description: 'Domain-specific language used in programming and designed for managing data held in relational database management systems.',
        popular: true,
        onet: '15-1251.00',
        esco: 'http://data.europa.eu/esco/skill/d45c555d-ef34-448c-90da-8d77c44c5ff0',
        nsqf: 6
      },

      // 2. Frontend
      {
        name: 'React',
        category: 'Frontend',
        aliases: ['reactjs', 'react.js', 'react 18', 'react native'],
        description: 'Declarative component-based UI library developed by Meta for building interactive single-page applications.',
        popular: true,
        onet: '15-1254.00',
        esco: 'http://data.europa.eu/esco/skill/95adbb47-7667-4eb4-b97c-9b7e732d8fe7',
        nsqf: 7
      },
      {
        name: 'Angular',
        category: 'Frontend',
        aliases: ['angularjs', 'angular2+', 'angular 16', 'angular 17'],
        description: 'Comprehensive TypeScript-based open-source web application framework led by Google.',
        popular: true,
        onet: '15-1254.00',
        esco: 'http://data.europa.eu/esco/skill/95adbb47-7667-4eb4-b97c-9b7e732d8fe7',
        nsqf: 7
      },
      {
        name: 'Vue.js',
        category: 'Frontend',
        aliases: ['vue', 'vuejs', 'vue3'],
        description: 'Progressive JavaScript framework for building user interfaces and single-page applications.',
        popular: false,
        onet: '15-1254.00',
        esco: 'http://data.europa.eu/esco/skill/95adbb47-7667-4eb4-b97c-9b7e732d8fe7',
        nsqf: 6
      },
      {
        name: 'Next.js',
        category: 'Frontend',
        aliases: ['nextjs', 'next js', 'next 14', 'app router'],
        description: 'React framework providing server-side rendering, static site generation, and full-stack API capabilities.',
        popular: true,
        onet: '15-1254.00',
        esco: 'http://data.europa.eu/esco/skill/95adbb47-7667-4eb4-b97c-9b7e732d8fe7',
        nsqf: 7
      },
      {
        name: 'HTML5 & CSS3',
        category: 'Frontend',
        aliases: ['html', 'css', 'html5', 'css3', 'web markup', 'responsive design'],
        description: 'Core semantic structuring and presentation standards for web page authoring and responsive interfaces.',
        popular: true,
        onet: '15-1254.00',
        esco: 'http://data.europa.eu/esco/skill/33a1e2bf-3746-4cb4-8d4e-12fae2e505a7',
        nsqf: 6
      },
      {
        name: 'Tailwind CSS',
        category: 'Frontend',
        aliases: ['tailwind', 'tailwindcss'],
        description: 'Utility-first CSS framework packed with classes that can be composed to build custom modern designs.',
        popular: true,
        onet: '15-1254.00',
        esco: 'http://data.europa.eu/esco/skill/33a1e2bf-3746-4cb4-8d4e-12fae2e505a7',
        nsqf: 6
      },
      {
        name: 'Redux',
        category: 'Frontend',
        aliases: ['redux toolkit', 'rtk', 'react-redux'],
        description: 'Predictable state container for JavaScript apps facilitating centralized state management.',
        popular: false,
        onet: '15-1254.00',
        esco: 'http://data.europa.eu/esco/skill/95adbb47-7667-4eb4-b97c-9b7e732d8fe7',
        nsqf: 7
      },

      // 3. Backend
      {
        name: 'Node.js',
        category: 'Backend',
        aliases: ['nodejs', 'node', 'node runtime'],
        description: 'Asynchronous event-driven JavaScript runtime built on Chrome\'s V8 engine for building scalable server-side applications.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/4426563d-a417-4952-b108-a57007421c60',
        nsqf: 7
      },
      {
        name: 'Express.js',
        category: 'Backend',
        aliases: ['express', 'expressjs'],
        description: 'Fast, unopinionated, minimalist web framework for Node.js powering REST APIs.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/4426563d-a417-4952-b108-a57007421c60',
        nsqf: 6
      },
      {
        name: 'Spring Boot',
        category: 'Backend',
        aliases: ['spring', 'springboot', 'spring framework', 'spring mvc'],
        description: 'Open source Java-based framework used to build stand-alone, production-grade microservices and web backends.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/2a2e4136-1e0e-4091-bbd4-53907e8d6728',
        nsqf: 7
      },
      {
        name: 'Django',
        category: 'Backend',
        aliases: ['django framework', 'drf', 'django rest framework'],
        description: 'High-level Python web framework that encourages rapid development and clean, pragmatic MVC design.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/e322b647-73d8-4f51-b0db-64df4df22368',
        nsqf: 7
      },
      {
        name: 'FastAPI',
        category: 'Backend',
        aliases: ['fast api', 'fastapi python'],
        description: 'Modern, fast (high-performance) web framework for building APIs with Python 3.8+ based on standard Python type hints.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/e322b647-73d8-4f51-b0db-64df4df22368',
        nsqf: 7
      },
      {
        name: 'RESTful APIs',
        category: 'Backend',
        aliases: ['rest api', 'rest', 'restful web services', 'api design'],
        description: 'Representational State Transfer architectural pattern for stateless, standard HTTP client-server communications.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/8f3ec29a-277d-411a-b60b-80862086e344',
        nsqf: 6
      },
      {
        name: 'GraphQL',
        category: 'Backend',
        aliases: ['gql', 'apollo server', 'graphql schema'],
        description: 'Query language for APIs and runtime for fulfilling queries with existing data providing declarative data fetching.',
        popular: false,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/8f3ec29a-277d-411a-b60b-80862086e344',
        nsqf: 7
      },
      {
        name: 'Microservices',
        category: 'Backend',
        aliases: ['microservice architecture', 'microservices architecture', 'distributed systems'],
        description: 'Architectural design pattern arranging an application as a collection of loosely coupled, fine-grained services.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/8f3ec29a-277d-411a-b60b-80862086e344',
        nsqf: 8
      },

      // 4. Database
      {
        name: 'PostgreSQL',
        category: 'Database',
        aliases: ['postgres', 'psql', 'postgresql db', 'pgsql'],
        description: 'Powerful, open-source object-relational database system with robust reliability, feature robustness, and performance.',
        popular: true,
        onet: '15-1243.00',
        esco: 'http://data.europa.eu/esco/skill/9f268bcf-f7b2-4d22-9226-c2306fbc9b90',
        nsqf: 7
      },
      {
        name: 'MySQL',
        category: 'Database',
        aliases: ['mysql server', 'mariadb'],
        description: 'Ubiquitous open-source relational database management system widely powering enterprise and web workloads.',
        popular: true,
        onet: '15-1243.00',
        esco: 'http://data.europa.eu/esco/skill/9f268bcf-f7b2-4d22-9226-c2306fbc9b90',
        nsqf: 6
      },
      {
        name: 'MongoDB',
        category: 'Database',
        aliases: ['mongo', 'mongodb atlas', 'nosql mongodb'],
        description: 'Leading document-based NoSQL database program providing high availability, scaling, and JSON-like schemas.',
        popular: true,
        onet: '15-1243.00',
        esco: 'http://data.europa.eu/esco/skill/9f268bcf-f7b2-4d22-9226-c2306fbc9b90',
        nsqf: 6
      },
      {
        name: 'Redis',
        category: 'Database',
        aliases: ['redis cache', 'in-memory db'],
        description: 'In-memory data structure store used as a database, cache, streaming engine, and message broker.',
        popular: true,
        onet: '15-1243.00',
        esco: 'http://data.europa.eu/esco/skill/9f268bcf-f7b2-4d22-9226-c2306fbc9b90',
        nsqf: 7
      },
      {
        name: 'Database Indexing & Query Tuning',
        category: 'Database',
        aliases: ['indexing', 'query optimization', 'explain analyze', 'acid transactions'],
        description: 'Techniques for analyzing query execution plans, indexing strategies, and locking behavior to maximize throughput.',
        popular: true,
        onet: '15-1243.00',
        esco: 'http://data.europa.eu/esco/skill/9f268bcf-f7b2-4d22-9226-c2306fbc9b90',
        nsqf: 7
      },

      // 5. Cloud & DevOps
      {
        name: 'Docker',
        category: 'Cloud & DevOps',
        aliases: ['docker containers', 'dockerfile', 'containerization'],
        description: 'Industry-standard OS-level virtualization platform for packaging software into isolated containers.',
        popular: true,
        onet: '15-1251.00',
        esco: 'http://data.europa.eu/esco/skill/8f3ec29a-277d-411a-b60b-80862086e344',
        nsqf: 7
      },
      {
        name: 'Kubernetes',
        category: 'Cloud & DevOps',
        aliases: ['k8s', 'k8', 'kube', 'kubernetes cluster'],
        description: 'Production-grade container orchestration system for automating application deployment, scaling, and management.',
        popular: true,
        onet: '15-1251.00',
        esco: 'http://data.europa.eu/esco/skill/8f3ec29a-277d-411a-b60b-80862086e344',
        nsqf: 8
      },
      {
        name: 'AWS',
        category: 'Cloud & DevOps',
        aliases: ['amazon web services', 'aws cloud', 'ec2', 's3', 'lambda', 'aws iam'],
        description: 'Comprehensive and broadly adopted cloud platform offering over 200 fully featured services from data centers globally.',
        popular: true,
        onet: '15-1241.00',
        esco: 'http://data.europa.eu/esco/skill/e322b647-73d8-4f51-b0db-64df4df22368',
        nsqf: 7
      },
      {
        name: 'Microsoft Azure',
        category: 'Cloud & DevOps',
        aliases: ['azure', 'azure cloud', 'azure devops'],
        description: 'Cloud computing platform operated by Microsoft for application management via Microsoft-managed data centers.',
        popular: true,
        onet: '15-1241.00',
        esco: 'http://data.europa.eu/esco/skill/e322b647-73d8-4f51-b0db-64df4df22368',
        nsqf: 7
      },
      {
        name: 'Google Cloud Platform (GCP)',
        category: 'Cloud & DevOps',
        aliases: ['gcp', 'google cloud', 'gcs', 'google compute engine'],
        description: 'Suite of cloud computing services provided by Google that runs on the same infrastructure Google uses internally.',
        popular: true,
        onet: '15-1241.00',
        esco: 'http://data.europa.eu/esco/skill/e322b647-73d8-4f51-b0db-64df4df22368',
        nsqf: 7
      },
      {
        name: 'CI/CD Pipelines',
        category: 'Cloud & DevOps',
        aliases: ['cicd', 'continuous integration', 'continuous deployment', 'github actions', 'jenkins', 'gitlab ci'],
        description: 'Automated software delivery practice enabling development teams to build, test, and release code faster and more reliably.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/8f3ec29a-277d-411a-b60b-80862086e344',
        nsqf: 7
      },
      {
        name: 'Linux / Unix Administration',
        category: 'Cloud & DevOps',
        aliases: ['linux', 'bash', 'shell scripting', 'unix', 'ubuntu', 'centos'],
        description: 'Command line proficiency, process management, file permissions, and shell automation on POSIX operating systems.',
        popular: true,
        onet: '15-1244.00',
        esco: 'http://data.europa.eu/esco/skill/c46522c0-7f28-4447-98ec-66b9d62dbd66',
        nsqf: 6
      },
      {
        name: 'Terraform',
        category: 'Cloud & DevOps',
        aliases: ['iac', 'infrastructure as code', 'hashicorp terraform'],
        description: 'Infrastructure as code tool that lets you build, change, and version cloud and on-prem resources safely.',
        popular: false,
        onet: '15-1241.00',
        esco: 'http://data.europa.eu/esco/skill/8f3ec29a-277d-411a-b60b-80862086e344',
        nsqf: 8
      },

      // 6. Data & AI
      {
        name: 'Machine Learning',
        category: 'Data & AI',
        aliases: ['ml', 'statistical learning', 'supervised learning', 'unsupervised learning'],
        description: 'Study of algorithms that improve automatically through experience and data analysis.',
        popular: true,
        onet: '15-1221.00',
        esco: 'http://data.europa.eu/esco/skill/666cfb71-c0ef-4f9e-953b-e02ff3cf4e08',
        nsqf: 8
      },
      {
        name: 'Deep Learning',
        category: 'Data & AI',
        aliases: ['dl', 'neural networks', 'ann', 'cnn', 'rnn', 'transformer models'],
        description: 'Subset of machine learning based on artificial neural networks with representation learning.',
        popular: true,
        onet: '15-1221.00',
        esco: 'http://data.europa.eu/esco/skill/666cfb71-c0ef-4f9e-953b-e02ff3cf4e08',
        nsqf: 8
      },
      {
        name: 'PyTorch',
        category: 'Data & AI',
        aliases: ['torch', 'pytorch library'],
        description: 'Optimized tensor library for deep learning using GPUs and CPUs, widely favored in AI research and production.',
        popular: true,
        onet: '15-1221.00',
        esco: 'http://data.europa.eu/esco/skill/666cfb71-c0ef-4f9e-953b-e02ff3cf4e08',
        nsqf: 8
      },
      {
        name: 'TensorFlow',
        category: 'Data & AI',
        aliases: ['tf', 'keras', 'tensorflow2'],
        description: 'End-to-end open source platform for machine learning developed by Google Brain.',
        popular: true,
        onet: '15-1221.00',
        esco: 'http://data.europa.eu/esco/skill/666cfb71-c0ef-4f9e-953b-e02ff3cf4e08',
        nsqf: 8
      },
      {
        name: 'Pandas & NumPy',
        category: 'Data & AI',
        aliases: ['pandas', 'numpy', 'scipy', 'data manipulation', 'data wrangling'],
        description: 'Core scientific computing libraries in Python providing high-performance multidimensional arrays and DataFrames.',
        popular: true,
        onet: '15-2051.00',
        esco: 'http://data.europa.eu/esco/skill/666cfb71-c0ef-4f9e-953b-e02ff3cf4e08',
        nsqf: 7
      },
      {
        name: 'Natural Language Processing (NLP)',
        category: 'Data & AI',
        aliases: ['nlp', 'text mining', 'bert', 'tokenization', 'sentiment analysis'],
        description: 'Subfield of linguistics, computer science, and AI concerned with the interactions between computers and human language.',
        popular: true,
        onet: '15-1221.00',
        esco: 'http://data.europa.eu/esco/skill/666cfb71-c0ef-4f9e-953b-e02ff3cf4e08',
        nsqf: 8
      },
      {
        name: 'Large Language Models (LLMs)',
        category: 'Data & AI',
        aliases: ['llm', 'genai', 'generative ai', 'prompt engineering', 'rag', 'langchain'],
        description: 'Generative foundation models, retrieval-augmented generation architectures, and prompt orchestration for AI agents.',
        popular: true,
        onet: '15-1221.00',
        esco: 'http://data.europa.eu/esco/skill/666cfb71-c0ef-4f9e-953b-e02ff3cf4e08',
        nsqf: 8
      },
      {
        name: 'Data Warehousing & ETL',
        category: 'Data & AI',
        aliases: ['etl', 'elt', 'data pipelines', 'snowflake', 'bigquery', 'dbt'],
        description: 'Extract, Transform, Load workflows and columnar data warehouses designed for enterprise business intelligence.',
        popular: true,
        onet: '15-2051.00',
        esco: 'http://data.europa.eu/esco/skill/d45c555d-ef34-448c-90da-8d77c44c5ff0',
        nsqf: 7
      },

      // 7. Core Computer Science
      {
        name: 'Data Structures & Algorithms',
        category: 'Core Computer Science',
        aliases: ['dsa', 'algorithms', 'data structures', 'problem solving dsa', 'leetcode', 'sorting', 'trees', 'graphs'],
        description: 'Fundamental computational constructs (arrays, hash maps, trees, graphs) and algorithmic techniques (dynamic programming, greedy, divide & conquer).',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/96f86c25-39fe-45df-bbca-83445e99aa56',
        nsqf: 7
      },
      {
        name: 'Object-Oriented Programming (OOP)',
        category: 'Core Computer Science',
        aliases: ['oop', 'oops', 'solid principles', 'design patterns', 'inheritance', 'polymorphism'],
        description: 'Programming paradigm based on the concept of objects containing data and code, adhering to encapsulation, inheritance, and SOLID principles.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/96f86c25-39fe-45df-bbca-83445e99aa56',
        nsqf: 7
      },
      {
        name: 'System Design & Scalability',
        category: 'Core Computer Science',
        aliases: ['system design', 'high level design', 'hld', 'low level design', 'lld', 'distributed architecture', 'load balancing', 'caching'],
        description: 'Process of defining the architecture, modules, interfaces, and data for large-scale systems to satisfy specified availability and throughput requirements.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/8f3ec29a-277d-411a-b60b-80862086e344',
        nsqf: 8
      },
      {
        name: 'Computer Networks',
        category: 'Core Computer Science',
        aliases: ['networking', 'tcp/ip', 'http', 'https', 'dns', 'osi model', 'sockets'],
        description: 'Understanding of OSI layers, TCP/IP stack, routing protocols, TLS/SSL handshakes, and network socket programming.',
        popular: true,
        onet: '15-1241.00',
        esco: 'http://data.europa.eu/esco/skill/c46522c0-7f28-4447-98ec-66b9d62dbd66',
        nsqf: 7
      },
      {
        name: 'Operating Systems & Concurrency',
        category: 'Core Computer Science',
        aliases: ['os', 'operating systems', 'threads', 'processes', 'deadlocks', 'memory management', 'virtual memory', 'semaphores'],
        description: 'Kernel architectures, multi-threading, CPU scheduling algorithms, mutexes, virtual memory paging, and file system primitives.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/c46522c0-7f28-4447-98ec-66b9d62dbd66',
        nsqf: 7
      },
      {
        name: 'Database Management Systems (DBMS)',
        category: 'Core Computer Science',
        aliases: ['dbms', 'rdbms concepts', 'relational algebra', 'normalization', 'bcnf', 'concurrency control'],
        description: 'Theoretical foundations of transactional databases, B-trees, serializability, write-ahead logging, and normal forms.',
        popular: true,
        onet: '15-1243.00',
        esco: 'http://data.europa.eu/esco/skill/9f268bcf-f7b2-4d22-9226-c2306fbc9b90',
        nsqf: 7
      },

      // 8. Professional Skills
      {
        name: 'Git & Version Control',
        category: 'Professional Skills',
        aliases: ['git', 'github', 'gitlab', 'git branching', 'pull requests', 'git rebase'],
        description: 'Distributed version control workflows, semantic commits, branching strategies, code conflict resolution, and peer code reviews.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/8f3ec29a-277d-411a-b60b-80862086e344',
        nsqf: 6
      },
      {
        name: 'Agile & Scrum Methodologies',
        category: 'Professional Skills',
        aliases: ['agile', 'scrum', 'kanban', 'sprint planning', 'jira', 'user stories'],
        description: 'Iterative project management framework emphasizing cross-functional collaboration, continuous feedback, and sprint retrospectives.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/6ffbe9c5-34eb-4fa5-aa67-72750da52b0a',
        nsqf: 6
      },
      {
        name: 'Technical Communication & Documentation',
        category: 'Professional Skills',
        aliases: ['technical writing', 'documentation', 'api documentation', 'presentation skills', 'client communication'],
        description: 'Clear, concise articulation of complex technical concepts in architectural design docs, RFCs, release notes, and presentations.',
        popular: true,
        onet: '15-1252.00',
        esco: 'http://data.europa.eu/esco/skill/6ffbe9c5-34eb-4fa5-aa67-72750da52b0a',
        nsqf: 6
      },
      {
        name: 'Testing & Quality Assurance',
        category: 'Professional Skills',
        aliases: ['qa', 'unit testing', 'integration testing', 'jest', 'pytest', 'tdd', 'test driven development', 'playwright', 'cypress'],
        description: 'Disciplined automated testing practices including unit tests, integration tests, mocking, and end-to-end regression suites.',
        popular: true,
        onet: '15-1253.00',
        esco: 'http://data.europa.eu/esco/skill/96f86c25-39fe-45df-bbca-83445e99aa56',
        nsqf: 7
      }
    ];

    for (const item of initialSkills) {
      this.registerSkill({
        canonicalName: item.name,
        category: item.category,
        aliases: item.aliases,
        description: item.description,
        isPopularDemand: item.popular,
        onetCode: item.onet,
        escoUri: item.esco,
        nsqfLevel: item.nsqf
      });
    }
  }
}

export const skillTaxonomyService = SkillTaxonomyService.getInstance();
