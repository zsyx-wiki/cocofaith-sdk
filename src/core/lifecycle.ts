export interface FaithDisposable {
    readonly disposed: boolean;
    dispose(): void | Promise<void>;
}
export class CallbackDisposable implements FaithDisposable {
    disposed = false;
    constructor(private readonly callback: () => void | Promise<void>) {
    }
    async dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        await this.callback();
    }
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
