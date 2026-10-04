export type GameplayErrorCode =
  | "NOT_FOUND"
  | "NOT_ALLOWED"
  | "INVALID_INPUT"
  | "INSUFFICIENT_RESOURCE"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  | "LIMIT_REACHED"
  | "UNREGISTERED";

export class GameplayError extends Error {
  constructor(
    readonly code: GameplayErrorCode,
    message?: string,
    readonly details?: Record<string, unknown>,
    options?: ErrorOptions,
  ) {
    super(message ?? code, options);
    this.name = "GameplayError";
  }
}

export function fail(
  code: GameplayErrorCode,
  message?: string,
  details?: Record<string, unknown>,
): never {
  throw new GameplayError(code, message, details);
}
