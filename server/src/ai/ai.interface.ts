/**
 * AI Service Interface Boundary
 * 
 * Defines standard contract for all profiling and extraction providers.
 */

import type { ProfilingExtractionResult, DocumentAnalysisOptions } from './ai.types';

export interface IAIService {
  /**
   * Analyzes document text and extracts skills, projects, certifications,
   * coursework, and warnings with calibrated confidence and evidence chains.
   */
  analyzeDocument(
    text: string,
    options?: DocumentAnalysisOptions
  ): Promise<ProfilingExtractionResult>;
}
