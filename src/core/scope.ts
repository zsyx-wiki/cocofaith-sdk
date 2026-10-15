import type { Field, Model } from "koishi";
import type { BonusCalculation, BonusProvider, BonusProviderOptions, BonusRequest } from "./bonuses";
import type { FaithCoreUserData, FaithDefinition, FaithEffectRow, FaithItemDefinition, FaithOpenResult, FaithProfessionDefinition, FaithStatusIdentityDefinition, FaithStatusIdentityState, IdentityInput, UserValueDelta } from "./definitions";
import type { FaithBusinessEconomyOptions, FaithBusinessRewardOptions, FaithEconomyChangeResult, FaithMoney, FaithRewardPreview, FaithTransferResult, FaithWallet } from "./economy";
import type { FaithDisposable, FaithLifecycleScope } from "./lifecycle";
import type { FaithAtomicScope, FaithTransactionOptions } from "./transaction";
export interface FaithBusinessEffectsApi {
    create(input: Omit<FaithEffectRow, "id" | "owner">): Promise<FaithEffectRow>;
    remove(id: number): Promise<unknown>;
    list(query?: Partial<Pick<FaithEffectRow, "target_type" | "target" | "value_type">>): Promise<FaithEffectRow[]>;
}
export interface FaithBusinessItemsApi {
    readonly revision: number;
    register(definition: FaithItemDefinition, options?: {
        replace?: boolean;
    }): Readonly<FaithItemDefinition>;
    registerMany(definitions: readonly FaithItemDefinition[], options?: {
        replace?: boolean;
    }): Readonly<FaithItemDefinition>[];
    unregister(itemId: string): Promise<boolean>;
    get(itemId: string): Readonly<FaithItemDefinition> | undefined;
    resolve(key: string): Readonly<FaithItemDefinition> | undefined;
    require(key: string): Readonly<FaithItemDefinition>;
    has(key: string): boolean;
    all(): Readonly<FaithItemDefinition>[];
    obtainable(): Readonly<FaithItemDefinition>[];
    marketable(): Readonly<FaithItemDefinition>[];
    isOpenable(key: string): boolean;
    rollOpenable(key: string, random?: () => number): FaithOpenResult;
    getInventoryEntries(uid: number): Promise<Array<{
        uid: number;
        item_id: string;
        quantity: number;
        item: Readonly<FaithItemDefinition>;
    }>>;
    getInventoryStacks(uid: number): Promise<Array<{
        item_id: string;
        quantity: number;
    }>>;
    getQuantity(uid: number, key: string): Promise<number>;
    hasQuantity(uid: number, key: string, quantity?: number): Promise<boolean>;
    readonly levels: FaithBusinessItemLevelsApi;
}
export interface FaithBusinessItemLevelsApi {
    get(id: string): Readonly<{
        id: string;
        name: string;
        rank: number;
        color?: string;
    }> | undefined;
    require(id: string): Readonly<{
        id: string;
        name: string;
        rank: number;
        color?: string;
    }>;
    all(): ReadonlyArray<Readonly<{
        id: string;
        name: string;
        rank: number;
        color?: string;
    }>>;
    compare(a: string, b: string): number;
}
export interface FaithBusinessUsersApi {
    listUids(after?: number, limit?: number): Promise<number[]>;
    get(uid: number): Promise<FaithCoreUserData | null>;
    require(uid: number): Promise<FaithCoreUserData>;
    currentFaith(user: FaithCoreUserData): string | null;
}
export interface FaithBusinessProfessionsApi {
    register(definition: FaithProfessionDefinition, options?: {
        override?: boolean;
    }): Readonly<FaithProfessionDefinition>;
    registerMany(definitions: readonly FaithProfessionDefinition[], options?: {
        override?: boolean;
    }): Readonly<FaithProfessionDefinition>[];
    unregister(id: string): boolean;
    get(id: string): Readonly<FaithProfessionDefinition> | undefined;
    resolve(key: string): Readonly<FaithProfessionDefinition> | undefined;
    require(key: string): Readonly<FaithProfessionDefinition>;
    all(): Readonly<FaithProfessionDefinition>[];
    list(query?: {
        faith?: string;
        type?: string;
        source?: string;
    }): Readonly<FaithProfessionDefinition>[];
    getUserProfession(uid: number): Promise<Readonly<FaithProfessionDefinition> | null>;
}
export interface FaithBusinessFaithsApi {
    get(name: string): Readonly<FaithDefinition> | undefined;
    require(name: string): Readonly<FaithDefinition>;
    has(name: string): boolean;
    all(): Readonly<FaithDefinition>[];
    byPath(path: string): Readonly<FaithDefinition>[];
    paths(): readonly string[];
    resolvePrayerWord(word: string): Readonly<FaithDefinition> | undefined;
    registerUser(identity: IdentityInput, faithName: string, initialGold?: number): Promise<FaithCoreUserData>;
    registerDynamic(input: {
        name: string;
        path: string;
        creatorUid: number;
        prayerWord?: string;
        metadata?: Record<string, unknown>;
    }): Promise<Readonly<FaithDefinition>>;
    unregisterDynamic(name: string, creatorUid?: number): Promise<boolean>;
    setPrayerWord(name: string, word: string, creatorUid?: number): Promise<Readonly<FaithDefinition>>;
    setCustomProfession(name: string, type: string, professionName: string, creatorUid?: number): Promise<Readonly<FaithDefinition>>;
}
export interface FaithBusinessPermissionsApi {
    register(permission: string, policy: unknown): FaithDisposable;
    check(uid: number, permission: string, data?: Record<string, unknown>, scope?: string, scopeValue?: string): Promise<boolean>;
}
export interface FaithBusinessHooksApi {
    on<T, R = void>(event: string, handler: (payload: T) => R | Promise<R>, options?: Record<string, unknown>): FaithDisposable;
    emit<T>(event: string, payload: T): Promise<unknown>;
}
export interface FaithBusinessBonusesApi {
    calculate(request: BonusRequest): Promise<BonusCalculation>;
    overview(uid: number, types?: readonly string[], baseValue?: number): Promise<BonusCalculation[]>;
    registerProvider(provider: BonusProvider, options: Omit<BonusProviderOptions, "owner">): FaithDisposable;
}
export interface FaithBusinessIdentitiesApi {
    resolve(input: IdentityInput): Promise<number | null>;
    list(uid: number): Promise<Array<{
        adapter: string;
        type: string;
        value: string;
        scope: string;
        scope_value: string;
    }>>;
    bindExisting(uid: number, input: IdentityInput): Promise<boolean>;
}
export interface FaithBusinessStatusIdentitiesApi {
    register(definition: FaithStatusIdentityDefinition): FaithDisposable;
    get(id: string): Readonly<FaithStatusIdentityDefinition> | undefined;
    require(id: string): Readonly<FaithStatusIdentityDefinition>;
    all(): readonly Readonly<FaithStatusIdentityDefinition>[];
    state(uid: number, identity: string): Promise<Readonly<FaithStatusIdentityState> | null>;
    list(uid: number): Promise<readonly Readonly<FaithStatusIdentityState>[]>;
    listByIdentity(identity: string, options?: Record<string, unknown>): Promise<readonly Readonly<FaithStatusIdentityState>[]>;
}
export interface FaithBusinessTransactionApi {
    run<T>(uid: number, task: (scope: FaithAtomicScope) => Promise<T>, options?: FaithTransactionOptions): Promise<T>;
    runMany<T>(uids: readonly number[], task: (scopes: ReadonlyMap<number, FaithAtomicScope>) => Promise<T>, options?: FaithTransactionOptions): Promise<T>;
}
export interface FaithBusinessBulkApi {
    changeValuesForAll(delta: Readonly<UserValueDelta>, options: FaithBulkOptions): Promise<FaithBulkResult>;
    giveItemToAll(item: string, quantity: number, options: FaithBulkOptions): Promise<FaithBulkResult>;
}
export interface FaithBulkOptions {
    operationId: string;
    status?: FaithCoreUserData["status"] | "all";
    pageSize?: number;
    concurrency?: number;
    continueOnError?: boolean;
}
export interface FaithBulkFailure {
    uid: number;
    code: string;
    message: string;
}
export interface FaithBulkResult {
    operationId: string;
    total: number;
    succeeded: number;
    skipped: number;
    failed: readonly FaithBulkFailure[];
}
export interface FaithBusinessEconomyApi {
    getWallet(uid: number): Promise<FaithWallet>;
    canAfford(uid: number, cost: Readonly<FaithMoney>): Promise<boolean>;
    requireFunds(uid: number, cost: Readonly<FaithMoney>): Promise<FaithWallet>;
    pay(uid: number, cost: Readonly<FaithMoney>, options: FaithBusinessEconomyOptions): Promise<FaithEconomyChangeResult>;
    reward(uid: number, amount: Readonly<FaithMoney>, options: FaithBusinessRewardOptions): Promise<FaithEconomyChangeResult>;
    refund(uid: number, amount: Readonly<FaithMoney>, options: FaithBusinessEconomyOptions): Promise<FaithEconomyChangeResult>;
    transfer(fromUid: number, toUid: number, amount: Readonly<FaithMoney>, options: FaithBusinessEconomyOptions): Promise<FaithTransferResult>;
    previewReward(uid: number, amount: Readonly<FaithMoney>, action: string, metadata?: Readonly<Record<string, unknown>>): Promise<FaithRewardPreview>;
}
export interface FaithBusinessCoreScope {
    readonly name: string;
    readonly lifecycle: FaithLifecycleScope;
    readonly runtime: {
        readonly apiVersion: string;
        readonly version?: string;
        readonly capabilities: readonly string[];
    };
    readonly users: FaithBusinessUsersApi;
    readonly items: FaithBusinessItemsApi;
    readonly permissions: FaithBusinessPermissionsApi;
    readonly hooks: FaithBusinessHooksApi;
    readonly bonuses: FaithBusinessBonusesApi;
    readonly professions: FaithBusinessProfessionsApi;
    readonly identities: FaithBusinessIdentitiesApi;
    readonly statusIdentities: FaithBusinessStatusIdentitiesApi;
    readonly faiths: FaithBusinessFaithsApi;
    readonly transaction: FaithBusinessTransactionApi;
    readonly effects: FaithBusinessEffectsApi;
    readonly bulk: FaithBusinessBulkApi;
    readonly economy: FaithBusinessEconomyApi;
    readonly gameDay: {
        currentDate(now?: Date): string;
    };
    readonly data: {
        get(uid: number): Promise<{
            private: Record<string, unknown>;
            public: Record<string, unknown>;
        }>;
        set(uid: number, value: {
            private?: Record<string, unknown>;
            public?: Record<string, unknown>;
        }): Promise<unknown>;
    };
    readonly table: FaithAtomicScope["table"] & {
        upsert(values: readonly Record<string, unknown>[], keys?: readonly string[]): Promise<unknown>;
    };
    registerTable(fields: Record<string, Field.Type | Field>, config?: Partial<Model.Config>): string;
}
