import type { BonusCalculation } from "./bonuses";
import type { FaithCoreUserData } from "./definitions";
export type FaithMoney = Partial<Record<"gold" | "ascension_score", number>>;
export interface FaithWallet {
    uid: number;
    gold: number;
    ascension_score: number;
}
export interface FaithEconomyOptions {
    source: string;
    idempotencyKey?: string;
    operatorUid?: number;
    metadata?: Record<string, unknown>;
}
export interface FaithRewardOptions extends FaithEconomyOptions {
    applyBonuses?: boolean;
}
export interface FaithBusinessEconomyOptions extends Omit<FaithEconomyOptions, "source"> {
    action: string;
}
export interface FaithBusinessRewardOptions extends Omit<FaithRewardOptions, "source"> {
    action: string;
}
export interface FaithRewardPreview {
    uid: number;
    requested: Readonly<FaithMoney>;
    applied: Readonly<FaithMoney>;
    calculations: Readonly<Partial<Record<"gold" | "ascension_score", BonusCalculation>>>;
}
export interface FaithEconomyChangeResult {
    uid: number;
    requested: Readonly<FaithMoney>;
    applied: Readonly<FaithMoney>;
    before: Readonly<{
        uid: number;
        gold: number;
        ascension_score: number;
    }>;
    after: Readonly<{
        uid: number;
        gold: number;
        ascension_score: number;
    }>;
    user: FaithCoreUserData;
}
export interface FaithTransferResult {
    amount: Readonly<FaithMoney>;
    from: FaithEconomyChangeResult;
    to: FaithEconomyChangeResult;
}
