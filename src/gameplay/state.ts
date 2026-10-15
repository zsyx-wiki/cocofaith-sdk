import { defineGameplayConfig, type GameplayConfigShape, type InferGameplayConfig } from "./config";
import { GameplayError } from "./errors";
export interface GameplayStateDefinition<
  D extends Record<string, unknown>,
  P extends Record<string, unknown>,
> {
  readonly version: number;
  readonly defaults: Readonly<D>;
  readonly publicDefaults: Readonly<P>;
  parse(value: unknown): D;
  parsePublic(value: unknown): P;
  migrate?(data: Record<string, unknown>, fromVersion: number): D;
  migratePublic?(data: Record<string, unknown>, fromVersion: number): P;
}
type ParsedState<D extends Record<string, unknown>, P extends Record<string, unknown>> = Omit<
  GameplayStateDefinition<D, P>,
  "version" | "publicDefaults" | "parsePublic"
> & {
  version?: number;
  publicDefaults?: P;
  parsePublic?: (value: unknown) => P;
};

export interface GameplayStateFields<D extends GameplayConfigShape, P extends GameplayConfigShape> {
  fields: D;
  publicFields?: P;
  version?: number;
  migrate?: GameplayStateDefinition<InferGameplayConfig<D>, InferGameplayConfig<P>>["migrate"];
  migratePublic?: GameplayStateDefinition<
    InferGameplayConfig<D>,
    InferGameplayConfig<P>
  >["migratePublic"];
}

export function defineGameplayState<
  D extends GameplayConfigShape,
  P extends GameplayConfigShape = {},
>(
  definition: GameplayStateFields<D, P>,
): GameplayStateDefinition<InferGameplayConfig<D>, InferGameplayConfig<P>>;
export function defineGameplayState<
  D extends Record<string, unknown>,
  P extends Record<string, unknown> = Record<string, never>,
>(definition: ParsedState<D, P>): GameplayStateDefinition<D, P>;
export function defineGameplayState(
  definition:
    | GameplayStateFields<GameplayConfigShape, GameplayConfigShape>
    | ParsedState<Record<string, unknown>, Record<string, unknown>>,
): GameplayStateDefinition<Record<string, unknown>, Record<string, unknown>> {
  const parsed = "fields" in definition ? stateFromFields(definition) : definition;
  const version = parsed.version ?? 1;
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new TypeError("状态版本必须是正安全整数");
  }
  parsed.parse(structuredClone(parsed.defaults));
  const publicDefaults = parsed.publicDefaults ?? {};
  parsed.parsePublic?.(structuredClone(publicDefaults));
  return Object.freeze({
    ...parsed,
    version,
    defaults: structuredClone(parsed.defaults),
    publicDefaults: structuredClone(publicDefaults),
    parsePublic: parsed.parsePublic ?? ((value: unknown) => value as Record<string, unknown>),
  });
}

function stateFromFields(
  definition: GameplayStateFields<GameplayConfigShape, GameplayConfigShape>,
) {
  const data = defineGameplayConfig(definition.fields);
  const publicData = definition.publicFields
    ? defineGameplayConfig(definition.publicFields)
    : undefined;
  return {
    version: definition.version,
    defaults: data.defaults,
    publicDefaults: publicData?.defaults ?? {},
    // 配置只读，事务中的状态可修改；校验后创建独立副本。
    parse: (value: unknown) => structuredClone(data.parse(value)),
    parsePublic: (value: unknown) =>
      publicData
        ? structuredClone(publicData.parse(value))
        : structuredClone(value as Record<string, unknown>),
    migrate: definition.migrate,
    migratePublic: definition.migratePublic,
  };
}
export const GAMEPLAY_STATE_VERSION_KEY = "__cocofaith_state_version";
export function loadGameplayState<
  D extends Record<string, unknown>,
  P extends Record<string, unknown>,
>(
  definition: GameplayStateDefinition<D, P>,
  row: {
    private: Record<string, unknown>;
    public: Record<string, unknown>;
  },
): {
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
    data: definition.parse(
      fromVersion < definition.version && definition.migrate
        ? definition.migrate(data, fromVersion)
        : { ...structuredClone(definition.defaults), ...data },
    ),
    publicData: definition.parsePublic(
      fromVersion < definition.version && definition.migratePublic
        ? definition.migratePublic(publicData, fromVersion)
        : { ...structuredClone(definition.publicDefaults), ...publicData },
    ),
  };
}
