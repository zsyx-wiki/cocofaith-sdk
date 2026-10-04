import type { GameplayDefinition, GameplayInput } from "./types";

export function defineGameplay<
  C extends Record<string, unknown> = Record<string, never>,
  S = undefined,
>(definition: GameplayInput<C, S>): GameplayDefinition<C, S> {
  if (!definition || typeof definition !== "object") {
    throw new TypeError("玩法定义必须是对象");
  }
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(definition.name)) {
    throw new TypeError("玩法名称只能使用小写字母、数字和下划线");
  }
  if (!Array.isArray(definition.commands) || !definition.commands.length) {
    throw new TypeError(`玩法 ${definition.name} 至少需要一个命令`);
  }
  return Object.freeze({
    ...definition,
    kind: "faith-gameplay" as const,
    dependencies: Object.freeze([...(definition.dependencies ?? [])]),
    commands: Object.freeze([...definition.commands]),
  });
}

export function isGameplayDefinition(
  value: unknown,
): value is GameplayDefinition<Record<string, unknown>, unknown> {
  return !!value
    && typeof value === "object"
    && (value as { kind?: unknown }).kind === "faith-gameplay";
}
