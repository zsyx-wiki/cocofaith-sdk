import type { BonusContribution } from "./bonuses";
export interface IdentityInput {
    adapter: string;
    type: string;
    value: string;
    scope: string;
    scopeValue?: string;
}
export interface FaithCoreUserData {
    uid: number;
    faiths: string[];
    abandon_count: number;
    profession_id: string;
    gold: number;
    ascension_score: number;
    audience_score: number;
    audience_rank: number;
    status: "active" | "disabled" | "closed";
    status_reason: string;
    created_at: Date;
    updated_at: Date;
}
export interface FaithOpenableDefinition {
    guaranteed?: {
        gold?: number;
        ascension_score?: number;
        audience_score?: number;
    };
    independentDrops?: readonly {
        item: string;
        chance: number;
        quantity?: number;
    }[];
    randomDrop?: {
        goldRange?: readonly [
            number,
            number
        ];
        itemCount?: number;
        itemPool: readonly {
            level: string;
            weight: number;
        }[];
    };
}
export interface FaithEffectRow {
    id: number;
    owner: string;
    target_type: "user" | "faith" | "global";
    target: string;
    value_type: string;
    modifier: number;
    fixed_bonus: number;
    source: string;
    starts_at: Date;
    expires_at: Date | null;
    metadata: Record<string, unknown>;
}
export interface FaithItemDefinition {
    item_id: string;
    name: string;
    type: string;
    level: string;
    description: string;
    max_quantity: number;
    marketable: boolean;
    price: number;
    obtainable: boolean;
    actions?: readonly string[];
    openable?: FaithOpenableDefinition;
}
export interface FaithOpenResult {
    currencies: Readonly<{
        gold: number;
        ascension_score: number;
        audience_score: number;
    }>;
    items: Readonly<Record<string, number>>;
}
export interface InventoryMutation {
    uid: number;
    item_id: string;
    before: number;
    after: number;
    delta: number;
}
export interface UserValueDelta {
    gold?: number;
    ascension_score?: number;
    audience_score?: number;
    audience_rank?: number;
    abandon_count?: number;
}
export interface FaithProfessionDefinition {
    id: string;
    name: string;
    type: string;
    faith: string;
    description?: string;
    source?: string;
    metadata?: Readonly<Record<string, unknown>>;
}
export interface FaithDefinition {
    name: string;
    path: string;
    type: "fixed" | "dynamic";
    deity_name?: string;
    creator_uid?: number;
    believer_count: number;
    prayer_word?: string;
    custom_professions?: Record<string, string>;
    metadata?: Readonly<Record<string, unknown>>;
}
export interface FaithStatusIdentityDefinition {
    id: string;
    name: string;
    description?: string;
    levels: readonly {
        id: string;
        name: string;
        rank: number;
        bonuses?: readonly Omit<BonusContribution, "source">[];
    }[];
}
export interface FaithStatusIdentityState {
    uid: number;
    identity: string;
    level: string;
    active: boolean;
    parameters: Readonly<Record<string, unknown>>;
    version: number;
    updated_at: Date;
}
