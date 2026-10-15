import { commandEntries } from "./commands";
import type { GameplayCommandDefinition, GameplayCommandInput } from "./types";
import type { GameplayDefinition, GameplayInput } from "./types";
export function defineGameplay<
  C extends Record<string, unknown> = Record<string, never>,
  S = undefined,
  D extends Record<string, unknown> = Record<string, unknown>,
  P extends Record<string, unknown> = Record<string, unknown>,
  A extends Record<string, unknown> = Record<string, unknown>,
>(definition: GameplayInput<C, S, D, P, A>): GameplayDefinition<C, S, D, P, A> {
  if (!definition || typeof definition !== "object") {
    throw new TypeError("玩法定义必须是对象");
  }
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(definition.name)) {
    throw new TypeError("玩法名称只能使用小写字母、数字和下划线");
  }
  const commands = normalizeCommands<C, S, D, P, A>(definition.commands, definition.name);
  if (!commands.length) {
    throw new TypeError(`玩法 ${definition.name} 至少需要一个命令`);
  }
  validateGameplayCommands(commands, definition.name);
  return Object.freeze({
    ...definition,
    kind: "faith-gameplay" as const,
    dependencies: Object.freeze([...(definition.dependencies ?? [])]),
    commands: freezeCommands<C, S, D, P, A>(commands),
  });
}
export function isGameplayDefinition(
  value: unknown,
): value is GameplayDefinition<Record<string, unknown>, unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    (
      value as {
        kind?: unknown;
      }
    ).kind === "faith-gameplay"
  );
}
export function validateGameplayCommands(
  commands: readonly import("./types").GameplayCommandDefinition<any, any>[],
  path: string,
  depth = 0,
): void {
  if (depth > 16) throw new TypeError(`${path}: 命令嵌套超过 16 层`);
  const ids = new Set<string>(),
    triggers = new Set<string>();
  for (const command of commands) {
    const location = `${path}/${command?.id ?? "unknown"}`;
    if (!command || !/^[a-z][a-z0-9_-]{0,63}$/.test(command.id) || ids.has(command.id))
      throw new TypeError(`${location}: 命令 ID 无效或重复`);
    ids.add(command.id);
    if (
      !Array.isArray(command.triggers) ||
      (!command.triggers.length && typeof command.match !== "function")
    )
      throw new TypeError(`${location}: 缺少触发词或动态匹配器`);
    for (const trigger of command.triggers) {
      if (
        typeof trigger !== "string" ||
        !trigger.trim() ||
        /\s/.test(trigger) ||
        triggers.has(trigger.toLowerCase())
      )
        throw new TypeError(`${location}: 触发词无效或重复`);
      triggers.add(trigger.toLowerCase());
    }
    if (command.guest !== undefined && typeof command.guest !== "boolean")
      throw new TypeError(`${location}: guest 必须是布尔值`);
    if (command.atomic !== undefined && command.atomic !== false && command.atomic !== "user")
      throw new TypeError(`${location}: atomic 无效`);
    if (command.guest && command.atomic)
      throw new TypeError(`${location}: 访客不能执行用户原子命令`);
    if (command.scenes?.some((scene) => scene !== "group" && scene !== "private"))
      throw new TypeError(`${location}: 场景无效`);
    if (command.match && (depth > 0 || typeof command.match !== "function"))
      throw new TypeError(`${location}: 动态匹配器只能位于根命令`);
    if (typeof command.run !== "function" && !command.children?.length)
      throw new TypeError(`${location}: 缺少执行器或子命令`);
    if (command.parameters && typeof command.parameters.parse !== "function")
      throw new TypeError(`${location}: 参数定义无效`);
    if (command.children) validateGameplayCommands(command.children, location, depth + 1);
  }
}
function freezeCommands<
  C extends Record<string, unknown>,
  S,
  D extends Record<string, unknown>,
  P extends Record<string, unknown>,
  A extends Record<string, unknown>,
>(
  commands: readonly import("./types").GameplayCommandDefinition<C, S, D, P, A>[],
): readonly import("./types").GameplayCommandDefinition<C, S, D, P, A>[] {
  return Object.freeze(
    commands.map((command) =>
      Object.freeze({
        ...command,
        triggers: Object.freeze([...command.triggers]),
        scenes: command.scenes ? Object.freeze([...command.scenes]) : undefined,
        children: command.children ? freezeCommands<C, S, D, P, A>(command.children) : undefined,
      }),
    ),
  ) as readonly import("./types").GameplayCommandDefinition<C, S, D, P, A>[];
}

function normalizeCommands<
  C extends Record<string, unknown>,
  S,
  D extends Record<string, unknown>,
  P extends Record<string, unknown>,
  A extends Record<string, unknown>,
>(
  commands: import("./commands").CommandCollection<GameplayCommandInput<C, S, D, P, A>>,
  path: string,
  depth = 0,
): GameplayCommandDefinition<C, S, D, P, A>[] {
  if (depth > 16) throw new TypeError(`${path}: 命令嵌套超过 16 层`);
  return commandEntries<GameplayCommandInput<C, S, D, P, A>>(commands).map(
    (command) =>
      ({
        ...command,
        children: command.children
          ? normalizeCommands<C, S, D, P, A>(command.children, `${path}/${command.id}`, depth + 1)
          : undefined,
      }) as GameplayCommandDefinition<C, S, D, P, A>,
  );
}
