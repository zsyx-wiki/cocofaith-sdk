import type { IdentityInput } from "../core";
import type { GameplayResult, GameplayScene } from "../gameplay";
/** Platform-neutral host protocol shared by Business and every Adapter. */
export interface BusinessAdapterInfo {
    readonly name: string;
    readonly version: string;
    readonly allowRegistration?: boolean;
}
export interface BusinessEvent {
    readonly uid: number | null;
    readonly identity?: Readonly<IdentityInput>;
    readonly scene: GameplayScene;
    readonly content: string;
    readonly channelId?: string;
    readonly roomKey?: string;
    readonly eventId?: string;
    readonly displayName?: string;
    readonly adapter?: Readonly<BusinessAdapterInfo>;
    readonly reply?: (result: GameplayResult) => Promise<unknown>;
}
export type BusinessDispatchResult = {
    matched: false;
    reason: "empty" | "not-found";
} | {
    matched: true;
    business: string;
    command: string;
    result: GameplayResult;
} | {
    matched: true;
    business: string;
    command: string;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
};
export interface FaithBusinessAdapterContract {
    acceptsCommand(content: string): boolean;
    dispatch(event: BusinessEvent): Promise<BusinessDispatchResult>;
}
