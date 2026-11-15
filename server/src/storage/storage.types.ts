/**
 * CarrerSync File Storage Types & Interfaces
 * Phase 08 — Provider-Independent Storage Architecture
 */

import { Readable } from 'stream';

export type DocumentType =
  | 'resume'
  | 'academic_certificate'
  | 'technical_certificate'
  | 'project_evidence'
  | 'portfolio_attachment'
  | 'placement_document';

export type StorageProviderType = 'local' | 's3';

export interface StorageFile {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  size: number;
}

export interface UploadOptions {
  tenantId: string;
  ownerUserId: string;
  documentType: DocumentType;
  originalFilename: string;
  mimeType: string;
  isPrivate?: boolean;
  customPrefix?: string;
}

export interface UploadResult {
  storageKey: string;
  checksum: string;
  size: number;
  mimeType: string;
  url?: string;
  storedAt: Date;
}

export interface FileMetadata {
  storageKey: string;
  size: number;
  mimeType: string;
  checksum?: string;
  lastModified?: Date;
  eTag?: string;
}

export interface DownloadResult {
  stream: Readable | Buffer;
  mimeType: string;
  size: number;
  originalFilename?: string;
}

export interface SignedUrlOptions {
  expiresInSeconds?: number;
  downloadFilename?: string;
}

export interface StorageConfig {
  provider: StorageProviderType;
  localDirectory?: string;
  s3?: {
    bucket: string;
    region: string;
    endpoint?: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle?: boolean;
  };
}
