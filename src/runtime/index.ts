/** Host-side execution APIs. Gameplay authors normally import /gameplay instead. */
export { GAMEPLAY_PROTOCOL_LIMITS, assertGameplayResult } from "../gameplay/result";
export { executeGameplayCommand, gameplayIdempotencyKey } from "../gameplay/runtime";
export type { GameplayExecutionInput } from "../gameplay/runtime";
export { GAMEPLAY_STATE_VERSION_KEY, loadGameplayState } from "../gameplay/state";
