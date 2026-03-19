/**
 * @file src/modules/golf/domain/errors.ts
 * @description Standardized Domain Error classes for Golf module.
 */

export type GolfErrorCode =
  | 'AUTH_REQUIRED'
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'SYNC_CONFLICT'
  | 'STORAGE_ERROR'
  | 'UNKNOWN_ERROR';

export class GolfError extends Error {
  public readonly code: GolfErrorCode;
  public readonly details?: unknown;

  constructor(code: GolfErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'GolfError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, GolfError.prototype);
  }
}

export class RoundNotFoundError extends GolfError {
  constructor(roundId: string) {
    super('NOT_FOUND', `Golf round with ID ${roundId} not found.`);
    this.name = 'RoundNotFoundError';
  }
}

export class ValidationFailedError extends GolfError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_FAILED', message, details);
    this.name = 'ValidationFailedError';
  }
}

export class SyncConflictError extends GolfError {
  constructor(message: string, details?: unknown) {
    super('SYNC_CONFLICT', message, details);
    this.name = 'SyncConflictError';
  }
}
