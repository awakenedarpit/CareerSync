/**
 * CarrerSync Storage Service Interface
 * Phase 08 — Provider-Independent Storage Architecture
 */

import {
  UploadOptions,
  UploadResult,
  FileMetadata,
  DownloadResult,
  SignedUrlOptions
} from './storage.types';

export interface IStorageService {
  /**
   * Uploads a file buffer to the underlying storage provider.
   * Generates a safe server-side storage key and computes a SHA-256 checksum.
   */
  upload(fileBuffer: Buffer, options: UploadOptions): Promise<UploadResult>;

  /**
   * Retrieves a file from storage as a readable stream or buffer.
   */
  download(storageKey: string): Promise<DownloadResult>;

  /**
   * Deletes a file object from storage by its storage key.
   * Resolves to true if deleted, or false if already absent.
   */
  delete(storageKey: string): Promise<boolean>;

  /**
   * Retrieves file metadata (size, mimeType, checksum, lastModified).
   */
  getMetadata(storageKey: string): Promise<FileMetadata>;

  /**
   * Checks whether a file object exists at the specified storage key.
   */
  exists(storageKey: string): Promise<boolean>;

  /**
   * Generates a short-lived presigned URL if supported by the provider.
   * For local disk storage, returns an authenticated API download route.
   */
  generateSignedUrl(storageKey: string, options?: SignedUrlOptions): Promise<string>;
}
