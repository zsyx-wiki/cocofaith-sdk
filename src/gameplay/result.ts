export interface GameplayTextResult {
  readonly type: "text";
  readonly content: string;
  readonly delivery?: GameplayDelivery;
  readonly broadcast?: GameplayBroadcast;
}

export interface GameplayImageResult {
  readonly type: "image";
  readonly url: string;
  readonly fallback?: string;
  readonly delivery?: GameplayDelivery;
  readonly broadcast?: GameplayBroadcast;
}

export interface GameplaySilentResult {
  readonly type: "silent";
  readonly delivery?: GameplayDelivery;
  readonly broadcast?: GameplayBroadcast;
}

export interface GameplayMixedResult {
  readonly type: "mixed";
  readonly content: readonly (GameplayTextNode | GameplayImageNode)[];
  readonly delivery?: GameplayDelivery;
  readonly broadcast?: GameplayBroadcast;
}

export interface GameplayTextNode { readonly type: "text"; readonly content: string; }
export interface GameplayImageNode { readonly type: "image"; readonly url: string; readonly fallback?: string; }
export interface GameplayBroadcast { readonly id: string; readonly content: string; }
export type GameplayDelivery = "passive" | "proactive-required";
export type GameplayResult = GameplayTextResult | GameplayImageResult | GameplaySilentResult | GameplayMixedResult;
export type GameplayOutput = GameplayResult | string | void;

export function text(content: string): GameplayTextResult {
  return Object.freeze({ type: "text", content });
}

export function image(url: string, fallback?: string): GameplayImageResult {
  return Object.freeze({ type: "image", url, fallback });
}

export function mixed(content: readonly (GameplayTextNode | GameplayImageNode)[]): GameplayMixedResult {
  return Object.freeze({ type: "mixed", content: Object.freeze([...content]) });
}

export function silent(): GameplaySilentResult {
  return Object.freeze({ type: "silent" });
}

export function normalizeGameplayResult(output: GameplayOutput): GameplayResult {
  if (typeof output === "string") return text(output);
  if (output === undefined) return silent();
  return output;
}
