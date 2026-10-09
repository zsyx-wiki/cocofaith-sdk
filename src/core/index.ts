import type { Field, Model } from "koishi";

export const FAITH_CORE_API_VERSION = "3.0";

export interface FaithDisposable {
  readonly disposed: boolean;
  dispose(): void | Promise<void>;
}

export class CallbackDisposable implements FaithDisposable {
  disposed = false;
  constructor(private readonly callback: () => void | Promise<void>) {}
  async dispose() {
    if (this.disposed) return;
    this.disposed = true;
    await this.callback();
  }
}

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
  guaranteed?: { gold?: number; ascension_score?: number; audience_score?: number };
  independentDrops?: readonly { item: string; chance: number; quantity?: number }[];
  randomDrop?: { goldRange?: readonly [number, number]; itemCount?: number; itemPool: readonly { level: string; weight: number }[] };
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
export interface FaithBusinessEffectsApi {
  create(input: Omit<FaithEffectRow, "id" | "owner">): Promise<FaithEffectRow>;
  remove(id: number): Promise<unknown>;
  list(query?: Partial<Pick<FaithEffectRow, "target_type" | "target" | "value_type">>): Promise<FaithEffectRow[]>;
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
  currencies: Readonly<{ gold: number; ascension_score: number; audience_score: number }>;
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
export type BonusValueType = "gold" | "ascension_score" | "audience_score" | (string & {});
export interface BonusContribution {
  source: string;
  type: BonusValueType;
  modifier?: number;
  fixedBonus?: number;
  detail?: string;
  expiresAt?: Date;
  metadata?: Readonly<Record<string, unknown>>;
}
export interface BonusRequest {
  uid: number;
  type: BonusValueType;
  baseValue: number;
  source?: string;
  metadata?: Readonly<Record<string, unknown>>;
}
export interface BonusProviderContext extends BonusRequest {
  readonly user: Omit<Readonly<FaithCoreUserData>, "faiths"> & { readonly faiths: readonly string[] };
  readonly faiths: readonly string[];
  readonly currentFaith: string | null;
}
export type BonusProvider = (
  context: BonusProviderContext,
) => BonusContribution | readonly BonusContribution[] | null | undefined
  | Promise<BonusContribution | readonly BonusContribution[] | null | undefined>;
export interface BonusProviderOptions {
  id: string;
  owner?: string;
  priority?: number;
  types?: readonly BonusValueType[];
}
export interface BonusCalculation extends BonusRequest {
  multiplier: number;
  fixedBonus: number;
  finalValue: number;
  contributions: readonly BonusContribution[];
  failures: readonly { provider: string; error: unknown }[];
}
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
  before: Readonly<{ uid: number; gold: number; ascension_score: number }>;
  after: Readonly<{ uid: number; gold: number; ascension_score: number }>;
  user: FaithCoreUserData;
}
export interface FaithTransferResult {
  amount: Readonly<FaithMoney>;
  from: FaithEconomyChangeResult;
  to: FaithEconomyChangeResult;
}

export interface FaithLifecycleScope extends FaithDisposable {
  onReady(handler: () => void | Promise<void>, options?: FaithLifecycleRegistrationOptions): FaithDisposable;
  onReload(handler: () => void | Promise<void>, options?: FaithLifecycleRegistrationOptions): FaithDisposable;
  onGameDay(handler: (event: FaithGameDayEvent) => void | Promise<void>, options?: FaithLifecycleRegistrationOptions): FaithDisposable;
  onDispose(handler: () => void | Promise<void>, options?: FaithLifecycleRegistrationOptions): FaithDisposable;
  defer(disposable: FaithDisposable | (() => void | Promise<void>)): FaithDisposable;
  track<T extends FaithDisposable>(resource: T): T;
}

export interface FaithLifecycleRegistrationOptions {
  name?: string;
  priority?: number;
  critical?: boolean;
}

export interface FaithGameDayEvent {
  readonly date: string;
  readonly previousDate: string | null;
  readonly triggeredAt: Date;
  readonly source: "startup" | "scheduler" | "manual";
}

export interface FaithAtomicUsersApi {
  get(): Promise<FaithCoreUserData>;
  change(delta: UserValueDelta): Promise<FaithCoreUserData>;
  setFaiths(faiths: readonly string[]): Promise<FaithCoreUserData>;
  abandonFaith(newFaith: string): Promise<FaithCoreUserData>;
  setProfession(profession: string | null): Promise<FaithCoreUserData>;
}

export interface FaithAtomicItemsApi {
  getQuantity(item: string): Promise<number>;
  getStacks(): Promise<readonly { item_id: string; quantity: number }[]>;
  give(item: string, quantity?: number): Promise<InventoryMutation>;
  take(item: string, quantity?: number): Promise<InventoryMutation>;
  setQuantity(item: string, quantity: number): Promise<InventoryMutation>;
}

export interface FaithAtomicDataApi {
  get(): Promise<{ private: Record<string, unknown>; public: Record<string, unknown> }>;
  set(value: {
    private?: Record<string, unknown>;
    public?: Record<string, unknown>;
  }): Promise<unknown>;
}

export interface FaithAtomicEconomyApi {
  getWallet(): Promise<{ uid: number; gold: number; ascension_score: number }>;
  canAfford(cost: Readonly<FaithMoney>): Promise<boolean>;
  pay(cost: Readonly<FaithMoney>): Promise<FaithCoreUserData>;
  reward(
    amount: Readonly<FaithMoney>,
    options?: {
      applyBonuses?: boolean;
      source?: string;
      metadata?: Readonly<Record<string, unknown>>;
    },
  ): Promise<FaithEconomyChangeResult>;
  creditFixed(amount: Readonly<FaithMoney>): Promise<FaithCoreUserData>;
}

export interface FaithAtomicTableApi {
  get<T extends object = Record<string, unknown>>(query?: Record<string, unknown>): Promise<T[]>;
  create<T extends object>(value: T): Promise<T>;
  set(query: Record<string, unknown>, patch: Record<string, unknown>): Promise<{ matched?: number }>;
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
    set(
      identity: string,
      value: { level: string; active: boolean; parameters?: Record<string, unknown> },
    ): Promise<Readonly<FaithStatusIdentityState>>;
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

export interface FaithBusinessItemsApi {
  readonly revision: number;
  register(definition: FaithItemDefinition, options?: { replace?: boolean }): Readonly<FaithItemDefinition>;
  registerMany(definitions: readonly FaithItemDefinition[], options?: { replace?: boolean }): Readonly<FaithItemDefinition>[];
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
  getInventoryEntries(uid: number): Promise<Array<{ uid: number; item_id: string; quantity: number; item: Readonly<FaithItemDefinition> }>>;
  getInventoryStacks(uid: number): Promise<Array<{ item_id: string; quantity: number }>>;
  getQuantity(uid: number, key: string): Promise<number>;
  hasQuantity(uid: number, key: string, quantity?: number): Promise<boolean>;
  readonly levels: FaithBusinessItemLevelsApi;
}

export interface FaithBusinessItemLevelsApi {
  get(id: string): Readonly<{ id: string; name: string; rank: number; color?: string }> | undefined;
  require(id: string): Readonly<{ id: string; name: string; rank: number; color?: string }>;
  all(): ReadonlyArray<Readonly<{ id: string; name: string; rank: number; color?: string }>>;
  compare(a: string, b: string): number;
}

export interface FaithBusinessUsersApi {
  listUids(after?: number, limit?: number): Promise<number[]>;
  get(uid: number): Promise<FaithCoreUserData | null>;
  require(uid: number): Promise<FaithCoreUserData>;
  currentFaith(user: FaithCoreUserData): string | null;
}

export interface FaithBusinessProfessionsApi {
  register(definition: FaithProfessionDefinition, options?: { override?: boolean }): Readonly<FaithProfessionDefinition>;
  registerMany(definitions: readonly FaithProfessionDefinition[], options?: { override?: boolean }): Readonly<FaithProfessionDefinition>[];
  unregister(id: string): boolean;
  get(id: string): Readonly<FaithProfessionDefinition> | undefined;
  resolve(key: string): Readonly<FaithProfessionDefinition> | undefined;
  require(key: string): Readonly<FaithProfessionDefinition>;
  all(): Readonly<FaithProfessionDefinition>[];
  list(query?: { faith?: string; type?: string; source?: string }): Readonly<FaithProfessionDefinition>[];
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
  setPrayerWord(name: string, word: string): Promise<Readonly<FaithDefinition>>;
  setCustomProfession(name: string, type: string, professionName: string): Promise<Readonly<FaithDefinition>>;
}

export interface FaithBusinessPermissionsApi {
  register(permission: string, policy: unknown): FaithDisposable;
  check(
    uid: number,
    permission: string,
    data?: Record<string, unknown>,
    scope?: string,
    scopeValue?: string,
  ): Promise<boolean>;
}

export interface FaithBusinessHooksApi {
  on<T, R = void>(
    event: string,
    handler: (payload: T) => R | Promise<R>,
    options?: Record<string, unknown>,
  ): FaithDisposable;
  emit<T>(event: string, payload: T): Promise<unknown>;
}

export interface FaithBusinessBonusesApi {
  calculate(request: BonusRequest): Promise<BonusCalculation>;
  overview(uid: number, types?: readonly string[], baseValue?: number): Promise<BonusCalculation[]>;
  registerProvider(
    provider: BonusProvider,
    options: Omit<BonusProviderOptions, "owner">,
  ): FaithDisposable;
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
  listByIdentity(
    identity: string,
    options?: Record<string, unknown>,
  ): Promise<readonly Readonly<FaithStatusIdentityState>[]>;
}

export interface FaithBusinessTransactionApi {
  run<T>(
    uid: number,
    task: (scope: FaithAtomicScope) => Promise<T>,
    options?: FaithTransactionOptions,
  ): Promise<T>;
  runMany<T>(
    uids: readonly number[],
    task: (scopes: ReadonlyMap<number, FaithAtomicScope>) => Promise<T>,
    options?: FaithTransactionOptions,
  ): Promise<T>;
}

export interface FaithBusinessBulkApi {
  
  changeValuesForAll(
    delta: Readonly<UserValueDelta>,
    options: FaithBulkOptions,
  ): Promise<FaithBulkResult>;
  giveItemToAll(
    item: string,
    quantity: number,
    options: FaithBulkOptions,
  ): Promise<FaithBulkResult>;
}

export interface FaithBulkOptions {
  operationId: string;
  status?: FaithCoreUserData["status"] | "all";
  pageSize?: number;
  concurrency?: number;
  continueOnError?: boolean;
}
export interface FaithBulkFailure { uid: number; code: string; message: string; }
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
  transfer(
    fromUid: number,
    toUid: number,
    amount: Readonly<FaithMoney>,
    options: FaithBusinessEconomyOptions,
  ): Promise<FaithTransferResult>;
  previewReward(
    uid: number,
    amount: Readonly<FaithMoney>,
    action: string,
    metadata?: Readonly<Record<string, unknown>>,
  ): Promise<FaithRewardPreview>;
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
  readonly gameDay: { currentDate(now?: Date): string };
  readonly data: { get(uid: number): Promise<{ private: Record<string, unknown>; public: Record<string, unknown> }>; set(uid: number, value: { private?: Record<string, unknown>; public?: Record<string, unknown> }): Promise<unknown> };
  readonly table: FaithAtomicScope["table"] & {
    upsert(values: readonly Record<string, unknown>[], keys?: readonly string[]): Promise<unknown>;
  };
  registerTable(fields: Record<string, Field.Type | Field>, config?: Partial<Model.Config>): string;
}

export interface FaithCoreServiceContract {
  readonly apiVersion: string;
  readonly version?: string;
  readonly capabilities: {
    has(capability: string): boolean;
    all(): readonly string[];
  };
  readonly lifecycle: { scope(name: string): FaithLifecycleScope };
  readonly locks: { run<T>(key: string, task: () => Promise<T>): Promise<T> };
  readonly adapter: {
    normalize(identity: IdentityInput): IdentityInput;
    resolve(identity: IdentityInput): Promise<number | null>;
    bind(uid: number, identity: IdentityInput): Promise<boolean>;
  };
  readonly permissions: FaithCorePermissionsApi;
  createBusinessScope(name: string, options?: { canRegisterTable?: () => boolean }): FaithBusinessCoreScope;
}

export interface FaithPermissionContext {
  uid: number;
  permission: string;
  data?: Record<string, unknown>;
  scope?: string;
  scopeValue?: string;
}
export type FaithPermissionPolicy = (context: FaithPermissionContext) => boolean | Promise<boolean>;
export interface FaithCorePermissionsApi {
  register(
    permission: string,
    policy: FaithPermissionPolicy,
    options?: { owner?: string },
  ): FaithDisposable;
  check(
    uid: number,
    permission: string,
    data?: Record<string, unknown>,
    scope?: string,
    scopeValue?: string,
  ): Promise<boolean>;
}

export type FaithCoreService = FaithCoreServiceContract;
export interface FaithCoreError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
}

export function assertFaithCoreContract(value: unknown): asserts value is FaithCoreServiceContract {
  const core = value as Partial<FaithCoreServiceContract> | null;
  if (
    !core
    || typeof core !== "object"
    || core.apiVersion !== FAITH_CORE_API_VERSION
    || typeof core.capabilities?.has !== "function"
    || typeof core.capabilities?.all !== "function"
    || typeof core.createBusinessScope !== "function"
    || typeof core.adapter?.normalize !== "function"
    || typeof core.adapter?.resolve !== "function"
    || typeof core.adapter?.bind !== "function"
    || typeof core.lifecycle?.scope !== "function"
    || typeof core.locks?.run !== "function"
    || typeof core.permissions?.register !== "function"
    || typeof core.permissions?.check !== "function"
  ) {
    throw new TypeError(`faithCore 必须实现 CoCoFaith Core API ${FAITH_CORE_API_VERSION}`);
  }
}

export function isFaithCoreError(error: unknown): error is FaithCoreError {
  return error instanceof Error && typeof (error as Partial<FaithCoreError>).code === "string";
}
