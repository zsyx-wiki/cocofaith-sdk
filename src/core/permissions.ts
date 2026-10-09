import type { FaithDisposable } from "./lifecycle";
export interface FaithPermissionContext {
    uid: number;
    permission: string;
    data?: Record<string, unknown>;
    scope?: string;
    scopeValue?: string;
}
export type FaithPermissionPolicy = (context: FaithPermissionContext) => boolean | Promise<boolean>;
export interface FaithCorePermissionsApi {
    register(permission: string, policy: FaithPermissionPolicy, options?: {
        owner?: string;
    }): FaithDisposable;
    check(uid: number, permission: string, data?: Record<string, unknown>, scope?: string, scopeValue?: string): Promise<boolean>;
}
