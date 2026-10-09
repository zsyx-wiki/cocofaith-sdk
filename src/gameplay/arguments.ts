import type { GameplayConfigField, InferGameplayConfig } from "./config";
import { GameplayError } from "./errors";

export interface GameplayArgument<T> {
  readonly field: GameplayConfigField<T>;
  readonly optional?: boolean;
  readonly rest?: boolean;
}
export interface GameplayParameters<A extends Record<string, unknown>> {
  parse(args: readonly string[]): A;
}
export type GameplayArgumentShape = Record<string, GameplayArgument<any>>;
type ArgumentValues<T extends GameplayArgumentShape> = InferGameplayConfig<{ [K in keyof T]: T[K]["field"] }>;

export function gameplayArgument<T>(field: GameplayConfigField<T>, options: { optional?: boolean; rest?: boolean } = {}): GameplayArgument<T> {
  return Object.freeze({ field, ...options });
}

export function defineGameplayParameters<T extends GameplayArgumentShape>(shape: T): GameplayParameters<ArgumentValues<T>> {
  const entries = Object.entries(shape);
  let optionalSeen = false;
  for (let index = 0; index < entries.length; index++) {
    const [name, argument] = entries[index];
    if (argument.rest && index !== entries.length - 1) throw new TypeError(`剩余文本参数 ${name} 必须位于末尾`);
    if (optionalSeen && !argument.optional) throw new TypeError(`必填参数 ${name} 不能位于可选参数之后`);
    optionalSeen ||= argument.optional === true;
  }
  return Object.freeze({ parse(args: readonly string[]) {
    const result: Record<string, unknown> = {};
    let cursor = 0;
    for (const [name, argument] of entries) {
      const raw = argument.rest ? args.slice(cursor).join(" ") || undefined : args[cursor];
      if (raw === undefined && !argument.optional) throw new GameplayError("INVALID_INPUT", `缺少参数：${name}`, { argument: name });
      try {
        let value: unknown = raw === undefined ? argument.field.defaultValue : raw;
        // Convert only when the field's declared primitive default identifies its parser.
        if (raw !== undefined && typeof argument.field.defaultValue === "number") {
          if (!raw.trim()) throw new TypeError("数字不能为空");
          value = Number(raw);
        }
        if (raw !== undefined && typeof argument.field.defaultValue === "boolean") {
          if (raw !== "true" && raw !== "false") throw new TypeError("布尔值必须是 true 或 false");
          value = raw === "true";
        }
        result[name] = argument.field.parse(value, name);
      } catch (cause) {
        throw new GameplayError("INVALID_INPUT", cause instanceof Error ? cause.message : String(cause), { argument: name }, { cause });
      }
      cursor = argument.rest ? args.length : cursor + (raw === undefined ? 0 : 1);
    }
    if (cursor < args.length) throw new GameplayError("INVALID_INPUT", "参数数量过多");
    return result as ArgumentValues<T>;
  } });
}
