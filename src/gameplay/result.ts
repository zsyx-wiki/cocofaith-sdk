import { GameplayError } from "./errors";
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
export interface GameplayTextNode {
    readonly type: "text";
    readonly content: string;
}
export interface GameplayImageNode {
    readonly type: "image";
    readonly url: string;
    readonly fallback?: string;
}
export interface GameplayBroadcast {
    readonly id: string;
    readonly content: string;
}
export type GameplayDelivery = "passive" | "proactive-required";
export type GameplayResult = GameplayTextResult | GameplayImageResult | GameplaySilentResult | GameplayMixedResult;
export type GameplayOutput = GameplayResult | string | void;
export function text(content: string, options: GameplayDeliveryOptions = {}): GameplayTextResult {
    return Object.freeze({
        type: "text", content, ...options
    });
}
export function image(url: string, fallback?: string, options: GameplayDeliveryOptions = {}): GameplayImageResult {
    return Object.freeze({
        type: "image", url, fallback, ...options
    });
}
export function mixed(content: readonly (GameplayTextNode | GameplayImageNode)[], options: GameplayDeliveryOptions = {}): GameplayMixedResult {
    return Object.freeze({
        type: "mixed", content: Object.freeze([...content]), ...options
    });
}
export function silent(options: GameplayDeliveryOptions = {}): GameplaySilentResult {
    return Object.freeze({ type: "silent", ...options });
}
export function normalizeGameplayResult(output: GameplayOutput): GameplayResult {
    if (typeof output === "string")
        output = text(output);
    if (output === undefined)
        return silent();
    assertGameplayResult(output);
    return output;
}
export interface GameplayDeliveryOptions {
    delivery?: GameplayDelivery;
    broadcast?: GameplayBroadcast;
}
export const GAMEPLAY_PROTOCOL_LIMITS = Object.freeze({
    inputLength: 8192, textLength: 32768, fallbackLength: 4096, urlLength: 2048, mixedNodes: 100,
});
export function assertGameplayResult(result: unknown): asserts result is GameplayResult {
    if (!result || typeof result !== "object")
        throw invalidResult();
    const value = result as Record<string, unknown>;
    if (value.broadcast !== undefined) {
        const notice = value.broadcast as Record<string, unknown>;
        if (!notice || typeof notice !== "object" || typeof notice.id !== "string" || !notice.id || notice.id.length > 255)
            throw invalidResult("广播标识无效。");
        assertText(notice.content, GAMEPLAY_PROTOCOL_LIMITS.fallbackLength);
    }
    if (value.delivery !== undefined && value.delivery !== "passive" && value.delivery !== "proactive-required")
        throw invalidResult("消息发送策略无效。");
    if (value.type === "silent")
        return;
    if (value.type === "text") {
        assertText(value.content, GAMEPLAY_PROTOCOL_LIMITS.textLength);
        return;
    }
    if (value.type === "image") {
        assertImage(value);
        return;
    }
    if (value.type === "mixed" && Array.isArray(value.content) && value.content.length <= GAMEPLAY_PROTOCOL_LIMITS.mixedNodes) {
        for (const node of value.content)
            assertNode(node);
        return;
    }
    throw invalidResult();
}
function assertNode(node: unknown): asserts node is GameplayTextNode | GameplayImageNode {
    if (!node || typeof node !== "object")
        throw invalidResult("mixed 消息节点无效。");
    const value = node as Record<string, unknown>;
    if (value.type === "text") {
        assertText(value.content, GAMEPLAY_PROTOCOL_LIMITS.textLength);
        return;
    }
    if (value.type === "image") {
        assertImage(value);
        return;
    }
    throw invalidResult("mixed 消息节点无效。");
}
function assertImage(value: Record<string, unknown>) {
    if (typeof value.url !== "string" || !value.url || value.url.length > GAMEPLAY_PROTOCOL_LIMITS.urlLength)
        throw invalidResult("图片 URL 无效。");
    let url: URL;
    try {
        url = new URL(value.url);
    }
    catch {
        throw invalidResult("图片 URL 无效。");
    }
    if (url.protocol !== "https:" && url.protocol !== "http:")
        throw invalidResult("图片仅支持 HTTP(S) URL。");
    if (value.fallback !== undefined)
        assertText(value.fallback, GAMEPLAY_PROTOCOL_LIMITS.fallbackLength);
}
function assertText(value: unknown, maximum: number) {
    if (typeof value !== "string" || value.length > maximum)
        throw invalidResult("消息文本无效或超过长度限制。");
}
function invalidResult(message = "业务返回了不受支持的消息结果。") {
    return new GameplayError("INTERNAL_ERROR", message);
}
