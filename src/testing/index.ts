import { CallbackDisposable, type FaithAtomicScope, type FaithBusinessCoreScope, type FaithCoreUserData, type UserValueDelta } from "../core";
import { normalizeGameplayResult, type GameplayResult } from "../gameplay/result";
import { executeGameplayCommand } from "../gameplay/runtime";
import type { GameplayDefinition, GameplayEvent, GameplaySetupContext } from "../gameplay/types";
export interface GameplayTestUser extends FaithCoreUserData {
    gold: number;
    ascension_score: number;
    inventory: Record<string, number>;
    private: Record<string, unknown>;
    public: Record<string, unknown>;
}
/** Single-user in-memory host. It models rollback and duplicate events; it is not a database driver. */
export function createGameplayTestHarness<C extends Record<string, unknown>, S, D extends Record<string, unknown>, P extends Record<string, unknown>, A extends Record<string, unknown>>(definition: GameplayDefinition<C, S, D, P, A>, options: {
    uid?: number;
    gameDay?: string;
    config?: Partial<C>;
    gold?: number;
    ascension_score?: number;
} = {}) {
    const uid = options.uid ?? 10000000;
    let date = options.gameDay ?? "2026-01-01";
    let user: GameplayTestUser = {
        uid, faiths: [], abandon_count: 0, profession_id: "", audience_score: 0, audience_rank: 0, status: "active", status_reason: "", created_at: new Date("2026-01-01"), updated_at: new Date("2026-01-01"),
        gold: options.gold ?? 0, ascension_score: options.ascension_score ?? 0, inventory: {}, private: {}, public: {}
    };
    let service: S;
    let ready = false;
    const callbacks: Array<() => void | Promise<void>> = [];
    const seen = new Set<string>();
    let tail: Promise<unknown> = Promise.resolve();
    const config = definition.config?.parse({ ...definition.config.defaults, ...options.config }) ?? {} as C;
    const core = {
        name: definition.name,
        runtime: { apiVersion: "3.0", capabilities: [] },
        gameDay: { currentDate: () => date },
        transaction: {
            async run(_uid: number, task: (tx: FaithAtomicScope) => Promise<GameplayResult>, metadata: {
                idempotencyKey?: string;
            } = {}) {
                if (metadata.idempotencyKey && seen.has(metadata.idempotencyKey))
                    throw new Error("重复事件");
                const draft = structuredClone(user);
                const commits: Array<() => void | Promise<void>> = [];
                const rollbacks: Array<(error: unknown) => void | Promise<void>> = [];
                const wallet = () => ({
                    uid, gold: draft.gold, ascension_score: draft.ascension_score
                });
                const profile = (): FaithCoreUserData => {
                    const { inventory, private: privateData, public: publicData, ...value } = draft;
                    return structuredClone(value);
                };
                const change = (amount: Partial<{
                    gold: number;
                    ascension_score: number;
                }>, direction = 1) => {
                    draft.gold += (amount.gold ?? 0) * direction;
                    draft.ascension_score += (amount.ascension_score ?? 0) * direction;
                    return profile();
                };
                const tx = {
                    uid,
                    data: { get: async () => ({ private: structuredClone(draft.private), public: structuredClone(draft.public) }), set: async (value: {
                            private?: Record<string, unknown>;
                            public?: Record<string, unknown>;
                        }) => {
                            if (value.private)
                                draft.private = structuredClone(value.private);
                            if (value.public)
                                draft.public = structuredClone(value.public);
                        } },
                    economy: {
                        getWallet: async () => wallet(),
                        canAfford: async (amount: {
                            gold?: number;
                            ascension_score?: number;
                        }) => draft.gold >= (amount.gold ?? 0) && draft.ascension_score >= (amount.ascension_score ?? 0),
                        pay: async (amount: {
                            gold?: number;
                            ascension_score?: number;
                        }) => {
                            if (draft.gold < (amount.gold ?? 0) || draft.ascension_score < (amount.ascension_score ?? 0))
                                throw new Error("资源不足");
                            return change(amount, -1);
                        },
                        creditFixed: async (amount: {
                            gold?: number;
                            ascension_score?: number;
                        }) => change(amount),
                        reward: async (amount: {
                            gold?: number;
                            ascension_score?: number;
                        }) => {
                            const before = wallet();
                            change(amount);
                            return {
                                uid, requested: { ...amount }, applied: { ...amount }, before, after: wallet(), user: profile()
                            };
                        },
                    },
                    items: {
                        getQuantity: async (item: string) => draft.inventory[item] ?? 0,
                        getStacks: async () => Object.entries(draft.inventory).map(([item_id, quantity]) => ({ item_id, quantity })),
                        give: async (item: string, count = 1) => {
                            const before = draft.inventory[item] ?? 0;
                            draft.inventory[item] = before + count;
                            return {
                                uid, item_id: item, before, after: before + count, delta: count
                            };
                        },
                        take: async (item: string, count = 1) => {
                            const before = draft.inventory[item] ?? 0;
                            if (before < count)
                                throw new Error("物品不足");
                            draft.inventory[item] = before - count;
                            return {
                                uid, item_id: item, before, after: before - count, delta: -count
                            };
                        },
                        setQuantity: async (item: string, count: number) => {
                            const before = draft.inventory[item] ?? 0;
                            draft.inventory[item] = count;
                            return {
                                uid, item_id: item, before, after: count, delta: count - before
                            };
                        },
                    },
                    users: {
                        get: async () => profile(),
                        change: async (delta: UserValueDelta) => {
                            for (const key of ["gold", "ascension_score", "audience_score", "audience_rank", "abandon_count"] as const)
                                draft[key] += delta[key] ?? 0;
                            return profile();
                        },
                        setFaiths: async (faiths: readonly string[]) => {
                            draft.faiths = [...faiths];
                            return profile();
                        },
                        abandonFaith: async (faith: string) => {
                            draft.faiths = [faith];
                            draft.abandon_count++;
                            return profile();
                        },
                        setProfession: async (profession: string | null) => {
                            draft.profession_id = profession ?? "";
                            return profile();
                        },
                    },
                    table: new Proxy({}, { get: () => () => {
                            throw new Error("测试宿主不支持独立表，请使用真实 Core 集成测试");
                        } }),
                    statusIdentities: new Proxy({}, { get: () => () => {
                            throw new Error("测试宿主不支持身份注册表，请使用真实 Core 集成测试");
                        } }),
                    afterCommit: (callback: () => void | Promise<void>) => commits.push(callback),
                    afterRollback: (callback: (error: unknown) => void | Promise<void>) => rollbacks.push(callback),
                } as unknown as FaithAtomicScope;
                let result: GameplayResult;
                try {
                    result = await task(tx);
                }
                catch (error) {
                    for (const callback of rollbacks)
                        await callback(error);
                    throw error;
                }
                user = draft;
                if (metadata.idempotencyKey)
                    seen.add(metadata.idempotencyKey);
                for (const callback of commits)
                    await callback();
                return result;
            },
        },
    } as unknown as FaithBusinessCoreScope;
    async function initialize() {
        if (ready)
            return;
        try {
            const context: GameplaySetupContext<C> = {
                name: definition.name, core, config,
                track: resource => {
                    callbacks.push(() => resource.dispose());
                    return resource;
                },
                defer: callback => {
                    const resource = new CallbackDisposable(callback);
                    callbacks.push(() => resource.dispose());
                    return resource;
                },
                provide: () => {
                    throw new Error("测试宿主未配置跨模块接口");
                },
                use: () => {
                    throw new Error("测试宿主未配置跨模块接口");
                },
                contribute: () => {
                    throw new Error("测试宿主未配置贡献点");
                },
                collect: async () => ({ results: [], failures: [] }),
            };
            service = definition.setup ? await definition.setup(context) : undefined as S;
            ready = true;
            await definition.ready?.(service);
        }
        catch (error) {
            const errors: unknown[] = [error];
            if (ready) {
                ready = false;
                try { await definition.dispose?.(service); } catch (cleanupError) { errors.push(cleanupError); }
            }
            for (const callback of callbacks.splice(0).reverse()) {
                try {
                    await callback();
                }
                catch (cleanupError) {
                    errors.push(cleanupError);
                }
            }
            if (errors.length > 1)
                throw new AggregateError(errors, "测试宿主初始化和清理失败");
            throw error;
        }
    }
    return {
        snapshot: () => structuredClone(user),
        setGameDay: (value: string) => {
            date = value;
        },
        run(commandId: string, args: readonly string[] = [], event: Partial<GameplayEvent> = {}): Promise<GameplayResult> {
            const execution = tail.catch(() => undefined).then(async () => {
                await initialize();
                const path = commandId.split(".");
                let commands = definition.commands;
                let command;
                for (const id of path) {
                    command = commands.find(item => item.id === id);
                    if (!command)
                        throw new Error(`未知命令：${commandId}`);
                    commands = command.children ?? [];
                }
                if (!command)
                    throw new Error(`未知命令：${commandId}`);
                return normalizeGameplayResult(await executeGameplayCommand({
                    business: definition.name, command: command as unknown as import("../gameplay/types").GameplayCommandDefinition<C, S>, uid: event.uid === undefined ? uid : event.uid,
                    event: {
                        uid, scene: "group", content: "", ...event
                    }, args, path, core, config, service, stateDefinition: definition.state as unknown as import("../gameplay/state").GameplayStateDefinition<Record<string, unknown>, Record<string, unknown>>
                }));
            });
            tail = execution;
            return execution;
        },
        async dispose() {
            await tail.catch(() => undefined);
            const errors: unknown[] = [];
            if (ready) {
                ready = false;
                try {
                    await definition.dispose?.(service);
                }
                catch (error) {
                    errors.push(error);
                }
            }
            for (const callback of callbacks.splice(0).reverse()) {
                try {
                    await callback();
                }
                catch (error) {
                    errors.push(error);
                }
            }
            if (errors.length)
                throw new AggregateError(errors, "测试宿主清理失败");
        },
    };
}
