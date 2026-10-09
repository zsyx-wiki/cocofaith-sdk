import { GameplayError } from "./errors";
export interface GameplayStateDefinition<D extends Record<string, unknown>, P extends Record<string, unknown>> {
    readonly version: number;
    readonly defaults: Readonly<D>;
    readonly publicDefaults: Readonly<P>;
    parse(value: unknown): D;
    parsePublic(value: unknown): P;
    migrate?(data: Record<string, unknown>, fromVersion: number): D;
    migratePublic?(data: Record<string, unknown>, fromVersion: number): P;
}
export function defineGameplayState<D extends Record<string, unknown>, P extends Record<string, unknown> = Record<string, never>>(definition: Omit<GameplayStateDefinition<D, P>, "version" | "publicDefaults" | "parsePublic"> & {
    version?: number;
    publicDefaults?: P;
    parsePublic?: (value: unknown) => P;
}): GameplayStateDefinition<D, P> {
    const version = definition.version ?? 1;
    if (!Number.isSafeInteger(version) || version < 1)
        throw new TypeError("状态版本必须是正安全整数");
    definition.parse(structuredClone(definition.defaults));
    const publicDefaults = definition.publicDefaults ?? {} as P;
    if (definition.parsePublic)
        definition.parsePublic(structuredClone(publicDefaults));
    return Object.freeze({
        ...definition, version, defaults: structuredClone(definition.defaults),
        publicDefaults: structuredClone(publicDefaults),
        parsePublic: definition.parsePublic ?? ((value: unknown) => value as P),
    });
}
export const GAMEPLAY_STATE_VERSION_KEY = "__cocofaith_state_version";
export function loadGameplayState<D extends Record<string, unknown>, P extends Record<string, unknown>>(definition: GameplayStateDefinition<D, P>, row: {
    private: Record<string, unknown>;
    public: Record<string, unknown>;
}): {
    data: D;
    publicData: P;
} {
    const fromVersion = Number(row.private[GAMEPLAY_STATE_VERSION_KEY] ?? 0);
    if (!Number.isSafeInteger(fromVersion) || fromVersion < 0 || fromVersion > definition.version) {
        throw new GameplayError("INVALID_INPUT", "玩法状态版本无效或高于当前代码版本");
    }
    const data = structuredClone(row.private);
    delete data[GAMEPLAY_STATE_VERSION_KEY];
    const publicData = structuredClone(row.public);
    return {
        data: definition.parse(fromVersion < definition.version && definition.migrate
            ? definition.migrate(data, fromVersion) : { ...structuredClone(definition.defaults), ...data }),
        publicData: definition.parsePublic(fromVersion < definition.version && definition.migratePublic
            ? definition.migratePublic(publicData, fromVersion) : { ...structuredClone(definition.publicDefaults), ...publicData }),
    };
}
