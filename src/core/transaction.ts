import type { FaithCoreUserData, FaithStatusIdentityState, InventoryMutation, UserValueDelta } from "./definitions";
import type { FaithEconomyChangeResult, FaithMoney } from "./economy";
export interface FaithAtomicUsersApi {
    get(): Promise<FaithCoreUserData>;
    change(delta: UserValueDelta): Promise<FaithCoreUserData>;
    setFaiths(faiths: readonly string[]): Promise<FaithCoreUserData>;
    abandonFaith(newFaith: string): Promise<FaithCoreUserData>;
    setProfession(profession: string | null): Promise<FaithCoreUserData>;
}
export interface FaithAtomicItemsApi {
    getQuantity(item: string): Promise<number>;
    getStacks(): Promise<readonly {
        item_id: string;
        quantity: number;
    }[]>;
    give(item: string, quantity?: number): Promise<InventoryMutation>;
    take(item: string, quantity?: number): Promise<InventoryMutation>;
    setQuantity(item: string, quantity: number): Promise<InventoryMutation>;
}
export interface FaithAtomicDataApi {
    get(): Promise<{
        private: Record<string, unknown>;
        public: Record<string, unknown>;
    }>;
    set(value: {
        private?: Record<string, unknown>;
        public?: Record<string, unknown>;
    }): Promise<unknown>;
}
export interface FaithAtomicEconomyApi {
    getWallet(): Promise<{
        uid: number;
        gold: number;
        ascension_score: number;
    }>;
    canAfford(cost: Readonly<FaithMoney>): Promise<boolean>;
    pay(cost: Readonly<FaithMoney>): Promise<FaithCoreUserData>;
    reward(amount: Readonly<FaithMoney>, options?: {
        applyBonuses?: boolean;
        source?: string;
        metadata?: Readonly<Record<string, unknown>>;
    }): Promise<FaithEconomyChangeResult>;
    creditFixed(amount: Readonly<FaithMoney>): Promise<FaithCoreUserData>;
}
export interface FaithAtomicTableApi {
    get<T extends object = Record<string, unknown>>(query?: Record<string, unknown>): Promise<T[]>;
    create<T extends object>(value: T): Promise<T>;
    set(query: Record<string, unknown>, patch: Record<string, unknown>): Promise<{
        matched?: number;
    }>;
    remove(query: Record<string, unknown>): Promise<unknown>;
}
export interface FaithAtomicScope {
    readonly uid: number;
    readonly users: FaithAtomicUsersApi;
    readonly items: FaithAtomicItemsApi;
    readonly data: FaithAtomicDataApi;
    readonly economy: FaithAtomicEconomyApi;
    readonly statusIdentities: {
        get(identity: string): Promise<Readonly<FaithStatusIdentityState> | null>;
        set(identity: string, value: {
            level: string;
            active: boolean;
            parameters?: Record<string, unknown>;
        }): Promise<Readonly<FaithStatusIdentityState>>;
    };
    readonly table: FaithAtomicTableApi;
    afterCommit(callback: () => void | Promise<void>): void;
    afterRollback(callback: (error: unknown) => void | Promise<void>): void;
}
export interface FaithTransactionOptions {
    idempotencyKey?: string;
    business?: string;
    source?: string;
    operatorUid?: number;
    metadata?: Record<string, unknown>;
}
