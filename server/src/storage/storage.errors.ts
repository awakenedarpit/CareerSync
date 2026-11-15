/**
 * CarrerSync Storage Error Classes
 * Phase 08 — Provider-Independent Storage Architecture
 */

export class StorageError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code = 'STORAGE_ERROR', statusCode = 500) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FileNotFoundError extends StorageError {
  constructor(storageKey: string) {
    super(`File with storage key '${storageKey}' not found`, 'FILE_NOT_FOUND', 404);
    this.name = 'FileNotFoundError';
  }
}

export class InvalidFileTypeError extends StorageError {
  constructor(reason: string) {
    super(`Invalid file type: ${reason}`, 'INVALID_FILE_TYPE', 400);
    this.name = 'InvalidFileTypeError';
  }
}

export class FileTooLargeError extends StorageError {
  constructor(maxBytes: number, actualBytes: number) {
    super(
      `File size (${(actualBytes / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit (${(maxBytes / (1024 * 1024)).toFixed(2)} MB)`,
      'FILE_TOO_LARGE',
      413
    );
    this.name = 'FileTooLargeError';
  }
}

export class PathTraversalError extends StorageError {
  constructor(targetPath: string) {
    super(`Forbidden path traversal attempt detected: '${targetPath}'`, 'PATH_TRAVERSAL_DETECTED', 403);
    this.name = 'PathTraversalError';
  }
}

export class StorageConfigurationError extends StorageError {
  constructor(missingParam: string) {
    super(`Storage engine configuration error: missing required parameter '${missingParam}'`, 'STORAGE_MISCONFIGURED', 500);
    this.name = 'StorageConfigurationError';
  }
}

export class StorageOperationError extends StorageError {
  constructor(operation: string, details: string) {
    super(`Storage operation '${operation}' failed: ${details}`, 'STORAGE_OPERATION_FAILED', 500);
    this.name = 'StorageOperationError';
  }
}

export class DocumentAccessDeniedError extends StorageError {
  constructor(reason = 'Access to the requested document is forbidden under current RBAC policy') {
    super(reason, 'DOCUMENT_ACCESS_DENIED', 403);
    this.name = 'DocumentAccessDeniedError';
  }
}
