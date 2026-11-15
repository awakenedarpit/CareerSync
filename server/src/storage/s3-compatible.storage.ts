/**
 * CarrerSync S3-Compatible Cloud Storage Engine
 * Phase 08 — Provider-Independent Storage Architecture
 * 
 * Works with Neon Object Storage, MinIO, and standard AWS S3-compatible endpoints.
 * Requires explicit configuration via environment variables:
 * - AWS_ACCESS_KEY_ID or STORAGE_ACCESS_KEY
 * - AWS_SECRET_ACCESS_KEY or STORAGE_SECRET_KEY
 * - AWS_ENDPOINT_URL_S3 or STORAGE_ENDPOINT
 * - AWS_REGION or STORAGE_REGION (e.g. 'ap-southeast-1')
 * - STORAGE_BUCKET
 */

import crypto from 'crypto';
import path from 'path';
import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  NotFound
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
  StorageConfigurationError,
  StorageOperationError
} from './storage.errors';

export class S3CompatibleStorageEngine implements IStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(customConfig?: {
    bucket?: string;
    region?: string;
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    forcePathStyle?: boolean;
  }) {
    const accessKeyId =
      customConfig?.accessKeyId ||
      process.env.STORAGE_ACCESS_KEY ||
      process.env.AWS_ACCESS_KEY_ID;

    const secretAccessKey =
      customConfig?.secretAccessKey ||
      process.env.STORAGE_SECRET_KEY ||
      process.env.AWS_SECRET_ACCESS_KEY;

    const bucket = customConfig?.bucket || process.env.STORAGE_BUCKET;
    const region = customConfig?.region || process.env.STORAGE_REGION || process.env.AWS_REGION || 'ap-southeast-1';
    const endpoint = customConfig?.endpoint || process.env.STORAGE_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3;

    if (!accessKeyId) {
      throw new StorageConfigurationError('AWS_ACCESS_KEY_ID / STORAGE_ACCESS_KEY');
    }
    if (!secretAccessKey) {
      throw new StorageConfigurationError('AWS_SECRET_ACCESS_KEY / STORAGE_SECRET_KEY');
    }
    if (!bucket) {
      throw new StorageConfigurationError('STORAGE_BUCKET');
    }

    this.bucket = bucket;

    this.client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      // Neon Object Storage and MinIO require path-style addressing
      forcePathStyle: customConfig?.forcePathStyle !== undefined ? customConfig.forcePathStyle : true
    });
  }

  private generateStorageKey(options: UploadOptions): string {
    const rawExt = path.extname(options.originalFilename).toLowerCase().replace(/[^a-z0-9]/g, '');
    const ext = rawExt ? `.${rawExt}` : '';
    const uniqueId = crypto.randomUUID();
    const prefix = options.customPrefix ? `${options.customPrefix.replace(/[^a-zA-Z0-9_-]/g, '')}/` : '';

    return `${options.tenantId}/${options.documentType}/${prefix}${uniqueId}${ext}`;
  }

  private computeChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  public async upload(fileBuffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const storageKey = this.generateStorageKey(options);
    const checksum = this.computeChecksum(fileBuffer);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
          Body: fileBuffer,
          ContentType: options.mimeType,
          Metadata: {
            'tenant-id': options.tenantId,
            'owner-id': options.ownerUserId,
            'doc-type': options.documentType,
            'sha256-checksum': checksum,
            'original-filename': encodeURIComponent(options.originalFilename)
          }
        })
      );

      return {
        storageKey,
        checksum,
        size: fileBuffer.length,
        mimeType: options.mimeType,
        storedAt: new Date()
      };
    } catch (err: unknown) {
      throw new StorageOperationError('upload', (err as Error).message);
    }
  }

  public async download(storageKey: string): Promise<DownloadResult> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: storageKey
        })
      );

      if (!response.Body) {
        throw new FileNotFoundError(storageKey);
      }

      // Convert response stream
      const stream = response.Body as unknown as Readable;

      return {
        stream,
        mimeType: response.ContentType || 'application/octet-stream',
        size: response.ContentLength || 0
      };
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'NoSuchKey' || err instanceof NotFound) {
        throw new FileNotFoundError(storageKey);
      }
      throw new StorageOperationError('download', (err as Error).message);
    }
  }

  public async delete(storageKey: string): Promise<boolean> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storageKey
        })
      );
      return true;
    } catch (err: unknown) {
      throw new StorageOperationError('delete', (err as Error).message);
    }
  }

  public async getMetadata(storageKey: string): Promise<FileMetadata> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: storageKey
        })
      );

      return {
        storageKey,
        size: response.ContentLength || 0,
        mimeType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified,
        eTag: response.ETag,
        checksum: response.Metadata?.['sha256-checksum']
      };
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'NotFound' || (err as { name?: string }).name === 'NoSuchKey') {
        throw new FileNotFoundError(storageKey);
      }
      throw new StorageOperationError('getMetadata', (err as Error).message);
    }
  }

  public async exists(storageKey: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: storageKey
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  public async generateSignedUrl(storageKey: string, options?: SignedUrlOptions): Promise<string> {
    const expiresIn = options?.expiresInSeconds || 3600; // 1 hour default

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        ResponseContentDisposition: options?.downloadFilename
          ? `attachment; filename="${encodeURIComponent(options.downloadFilename)}"`
          : 'attachment'
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (err: unknown) {
      throw new StorageOperationError('generateSignedUrl', (err as Error).message);
    }
  }
}
