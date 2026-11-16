/**
 * CarrerSync Storage Factory
 * Phase 08 — Provider-Independent Storage Architecture
 */

import { IStorageService } from './storage.interface';
import { LocalStorageEngine } from './local.storage';
import { S3CompatibleStorageEngine } from './s3-compatible.storage';
import { StorageProviderType } from './storage.types';

export class StorageFactory {
  private static instance: IStorageService | null = null;

  /**
   * Returns the configured storage service instance.
   * Defaults to LocalStorageEngine if STORAGE_PROVIDER is not set.
   */
  public static getInstance(forceProvider?: StorageProviderType): IStorageService {
    if (this.instance && !forceProvider) {
      return this.instance;
    }

    const provider: StorageProviderType =
      forceProvider ||
      (process.env.STORAGE_DRIVER as StorageProviderType) ||
      (process.env.STORAGE_PROVIDER as StorageProviderType) ||
      'local';

    if (provider === 's3') {
      this.instance = new S3CompatibleStorageEngine();
    } else {
      this.instance = new LocalStorageEngine();
    }

    return this.instance;
  }

  /**
   * Alias for getInstance to retrieve active storage service.
   */
  public static getStorage(forceProvider?: StorageProviderType): IStorageService {
    return this.getInstance(forceProvider);
  }

  /**
   * Resets the active singleton instance.
   * Used strictly in automated testing to switch or clean up providers.
   */
  public static resetInstance(): void {
    this.instance = null;
  }
}

export const getStorageService = (forceProvider?: StorageProviderType): IStorageService =>
  StorageFactory.getInstance(forceProvider);
