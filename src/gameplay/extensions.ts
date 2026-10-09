import type { FaithDisposable } from "../core";
/** Tokens are shared by provider and consumers, so names and payload types have one source. */
export interface GameplayInterface<T> {
    readonly provider: string;
    readonly name: string;
    readonly type?: (value: T) => T;
}
export interface GameplayContribution<I, O> {
    readonly name: string;
    readonly input?: (value: I) => I;
    readonly output?: (value: O) => O;
}
export interface GameplayContributionResult<O> {
    readonly results: readonly O[];
    readonly failures: readonly {
        provider: string;
        id: string;
        error: unknown;
    }[];
}
export type GameplayContributionHandler<I, O> = (input: Readonly<I>) => O | readonly O[] | null | undefined | Promise<O | readonly O[] | null | undefined>;
function validateName(value: string) {
    if (!/^[a-z][a-z0-9_.-]{0,63}$/.test(value))
        throw new TypeError(`非法扩展名称：${value}`);
}
export function defineGameplayInterface<T>(provider: string, name = "default"): GameplayInterface<T> {
    validateName(provider);
    validateName(name);
    return Object.freeze({ provider, name });
}
export function defineGameplayContribution<I, O>(name: string): GameplayContribution<I, O> {
    validateName(name);
    return Object.freeze({ name });
}
export function provideGameplayInterface<T>(context: {
    name: string;
    provide<T>(name: string, value: T, options?: {
        version?: string;
    }): FaithDisposable;
}, token: GameplayInterface<T>, value: NoInfer<T>, options?: {
    version?: string;
}): FaithDisposable {
    if (context.name !== token.provider)
        throw new TypeError(`接口 ${token.name} 只能由 ${token.provider} 提供`);
    return context.provide(token.name, value, options);
}
export function useGameplayInterface<T>(context: {
    use<T>(business: string, name?: string): T;
}, token: GameplayInterface<T>): T {
    return context.use<T>(token.provider, token.name);
}
export function contributeGameplay<I, O>(context: {
    contribute<I, O>(slot: string, handler: GameplayContributionHandler<I, O>, options: {
        id: string;
        priority?: number;
    }): FaithDisposable;
}, token: GameplayContribution<I, O>, handler: GameplayContributionHandler<NoInfer<I>, NoInfer<O>>, options: {
    id: string;
    priority?: number;
}): FaithDisposable {
    return context.contribute(token.name, handler, options);
}
export async function collectGameplay<I, O>(context: {
    collect<I, O>(slot: string, input: Readonly<I>): Promise<unknown>;
}, token: GameplayContribution<I, O>, input: NoInfer<I>): Promise<GameplayContributionResult<O>> {
    return await context.collect<I, O>(token.name, input) as GameplayContributionResult<O>;
}
