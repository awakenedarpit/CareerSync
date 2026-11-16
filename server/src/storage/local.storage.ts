/**
 * CarrerSync Local Disk Storage Engine
 * Phase 08 — Provider-Independent Storage Architecture
 * 
 * ============================================================================
 * IMPORTANT NOTICE: DEVELOPMENT AND TEST ONLY
 * ----------------------------------------------------------------------------
 * Render's standard container filesystem is EPHEMERAL and resets on every
 * deploy, restart, or scale event. This local storage adapter is designed
 * strictly for local development, CI pipelines, and automated test execution.
 * Do NOT use local disk as a production substitute for persistent cloud storage.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IStorageService } from './storage.interface';
import {
  UploadOptions,
  UploadResult,
  FileMetadata,
  DownloadResult,
  SignedUrlOptions
} from './storage.types';
import {
  FileNotFoundError,
  PathTraversalError,
  StorageOperationError
} from './storage.errors';

export class LocalStorageEngine implements IStorageService {
  private readonly baseDirectory: string;

  constructor(customDirectory?: string) {
    const defaultDir = path.resolve(process.cwd(), 'uploads');
    this.baseDirectory = path.resolve(
      customDirectory ||
      process.env.UPLOAD_DIR ||
      process.env.STORAGE_LOCAL_DIRECTORY ||
      defaultDir
    );

    // Ensure the base directory exists with restricted permissions (0o700: rwx------)
    if (!fs.existsSync(this.baseDirectory)) {
      try {
        fs.mkdirSync(this.baseDirectory, { recursive: true, mode: 0o700 });
      } catch (err: unknown) {
        throw new StorageOperationError('initialize', (err as Error).message);
      }
    }
  }

  /**
   * Resolves and verifies that a storage key does not escape the configured root directory.
   */
  private resolveSafePath(storageKey: string): string {
    // Sanitize any leading slashes or Windows backslashes
    const normalizedKey = storageKey.replace(/^[/\\]+/, '').replace(/\\/g, '/');

    // Reject obvious traversal tokens immediately
    if (normalizedKey.includes('..') || normalizedKey.includes('\0')) {
      throw new PathTraversalError(storageKey);
    }

    const resolved = path.resolve(this.baseDirectory, normalizedKey);

    // Verify target path remains within baseDirectory
    if (!resolved.startsWith(this.baseDirectory + path.sep) && resolved !== this.baseDirectory) {
      throw new PathTraversalError(storageKey);
    }

    return resolved;
  }

  /**
   * Generates a safe server-side storage key.
   * Format: <tenantId>/<documentType>/<uuid>.<sanitizedExt>
   */
  private generateStorageKey(options: UploadOptions): string {
    const rawExt = path.extname(options.originalFilename).toLowerCase().replace(/[^a-z0-9]/g, '');
    const ext = rawExt ? `.${rawExt}` : '';
    const uniqueId = crypto.randomUUID();
    const prefix = options.customPrefix ? `${options.customPrefix.replace(/[^a-zA-Z0-9_-]/g, '')}/` : '';

    return `${options.tenantId}/${options.documentType}/${prefix}${uniqueId}${ext}`;
  }

  /**
   * Computes SHA-256 checksum for a buffer.
   */
  private computeChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  public async upload(fileBuffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const storageKey = this.generateStorageKey(options);
    const targetFilePath = this.resolveSafePath(storageKey);
    const targetDir = path.dirname(targetFilePath);

    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true, mode: 0o700 });
      }

      // Write file with mode 0o600 (owner read/write only)
      fs.writeFileSync(targetFilePath, fileBuffer, { mode: 0o600, flag: 'wx' });

      const checksum = this.computeChecksum(fileBuffer);

      return {
        storageKey,
        checksum,
        size: fileBuffer.length,
        mimeType: options.mimeType,
        storedAt: new Date()
      };
    } catch (err: unknown) {
      // If incomplete or failed write, attempt cleanup
      if (fs.existsSync(targetFilePath)) {
        try {
          fs.unlinkSync(targetFilePath);
        } catch {
          // Ignore cleanup error
        }
      }
      throw new StorageOperationError('upload', (err as Error).message);
    }
  }

  public async download(storageKey: string): Promise<DownloadResult> {
    const filePath = this.resolveSafePath(storageKey);

    if (!fs.existsSync(filePath)) {
      throw new FileNotFoundError(storageKey);
    }

    try {
      const stats = fs.statSync(filePath);
      const stream = fs.createReadStream(filePath);
      const ext = path.extname(filePath).toLowerCase();

      // Basic mime mapping
      const mimeMap: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.zip': 'application/zip'
      };

      return {
        stream,
        mimeType: mimeMap[ext] || 'application/octet-stream',
        size: stats.size,
        originalFilename: path.basename(filePath)
      };
    } catch (err: unknown) {
      if (err instanceof FileNotFoundError) throw err;
      throw new StorageOperationError('download', (err as Error).message);
    }
  }

  public async delete(storageKey: string): Promise<boolean> {
    const filePath = this.resolveSafePath(storageKey);

    if (!fs.existsSync(filePath)) {
      return false;
    }

    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (err: unknown) {
      throw new StorageOperationError('delete', (err as Error).message);
    }
  }

  public async getMetadata(storageKey: string): Promise<FileMetadata> {
    const filePath = this.resolveSafePath(storageKey);

    if (!fs.existsSync(filePath)) {
      throw new FileNotFoundError(storageKey);
    }

    try {
      const stats = fs.statSync(filePath);
      const buffer = fs.readFileSync(filePath);
      const checksum = this.computeChecksum(buffer);
      const ext = path.extname(filePath).toLowerCase();

      const mimeMap: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };

      return {
        storageKey,
        size: stats.size,
        mimeType: mimeMap[ext] || 'application/octet-stream',
        checksum,
        lastModified: stats.mtime
      };
    } catch (err: unknown) {
      if (err instanceof FileNotFoundError) throw err;
      throw new StorageOperationError('getMetadata', (err as Error).message);
    }
  }

  public async exists(storageKey: string): Promise<boolean> {
    try {
      const filePath = this.resolveSafePath(storageKey);
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  public async generateSignedUrl(storageKey: string, options?: SignedUrlOptions): Promise<string> {
    // For local storage, returns the direct authenticated backend streaming endpoint
    // In production S3, this generates an AWS SigV4 signed URL
    const encodedKey = encodeURIComponent(storageKey);
    const filenameParam = options?.downloadFilename ? `?filename=${encodeURIComponent(options.downloadFilename)}` : '';
    return `/api/v1/files/stream/${encodedKey}${filenameParam}`;
  }

  /**
   * Helper utility to safely clear all files in the test/dev storage folder.
   * Useful for test lifecycle teardown.
   */
  public clearAllFilesSync(): void {
    if (fs.existsSync(this.baseDirectory)) {
      const entries = fs.readdirSync(this.baseDirectory);
      for (const entry of entries) {
        const fullPath = path.join(this.baseDirectory, entry);
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }
  }
}
