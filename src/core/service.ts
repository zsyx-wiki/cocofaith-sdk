import type { IdentityInput } from "./definitions";
import type { FaithLifecycleScope } from "./lifecycle";
import type { FaithCorePermissionsApi } from "./permissions";
import type { FaithBusinessCoreScope } from "./scope";
export const FAITH_CORE_API_VERSION = "3.0";
export interface FaithCoreServiceContract {
    readonly apiVersion: string;
    readonly version?: string;
    readonly capabilities: {
        has(capability: string): boolean;
        all(): readonly string[];
    };
    readonly lifecycle: {
        scope(name: string): FaithLifecycleScope;
    };
    readonly locks: {
        run<T>(key: string, task: () => Promise<T>): Promise<T>;
    };
    readonly adapter: {
        normalize(identity: IdentityInput): IdentityInput;
        resolve(identity: IdentityInput): Promise<number | null>;
        bind(uid: number, identity: IdentityInput): Promise<boolean>;
    };
    readonly permissions: FaithCorePermissionsApi;
    createBusinessScope(name: string, options?: {
        canRegisterTable?: () => boolean;
    }): FaithBusinessCoreScope;
}
export type FaithCoreService = FaithCoreServiceContract;
export interface FaithCoreError extends Error {
    readonly code: string;
    readonly details?: Record<string, unknown>;
}
export function assertFaithCoreContract(value: unknown): asserts value is FaithCoreServiceContract {
    const core = value as Partial<FaithCoreServiceContract> | null;
    if (!core
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
        || typeof core.permissions?.check !== "function") {
        throw new TypeError(`faithCore 必须实现 CoCoFaith Core API ${FAITH_CORE_API_VERSION}`);
    }
}
export function isFaithCoreError(error: unknown): error is FaithCoreError {
    return error instanceof Error && typeof (error as Partial<FaithCoreError>).code === "string";
}
/** Validate host scopes before invoking gameplay hooks, with the missing API in diagnostics. */
export function assertFaithBusinessCoreScope(value: unknown): asserts value is import("./scope").FaithBusinessCoreScope {
    const scope = value as Record<string, unknown> | null;
    if (!scope || typeof scope !== "object" || typeof scope.name !== "string")
        throw new TypeError("Core Scope 必须包含模块名");
    const required = [
        "lifecycle.onReady", "lifecycle.onReload", "lifecycle.onDispose", "lifecycle.onGameDay", "lifecycle.defer", "lifecycle.track", "lifecycle.dispose",
        "users.require", "items.require", "items.getQuantity", "economy.pay", "economy.reward",
        "transaction.run", "transaction.runMany", "data.get", "data.set", "gameDay.currentDate",
        "permissions.check", "hooks.on", "hooks.emit", "bonuses.calculate", "professions.get",
        "identities.resolve", "statusIdentities.get", "faiths.get", "effects.create", "effects.list", "effects.remove",
        "bulk.changeValuesForAll", "table.get", "table.create", "table.set", "table.remove", "table.upsert", "registerTable",
    ];
    for (const path of required) {
        let current: unknown = scope;
        for (const key of path.split("."))
            current = current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined;
        if (typeof current !== "function")
            throw new TypeError(`Core Scope ${scope.name} 缺少 ${path}()`);
    }
    const runtime = scope.runtime as {
        apiVersion?: unknown;
        capabilities?: unknown;
    } | undefined;
    if (runtime?.apiVersion !== FAITH_CORE_API_VERSION || !Array.isArray(runtime.capabilities))
        throw new TypeError(`Core Scope ${scope.name} 运行时版本或能力列表无效`);
}
