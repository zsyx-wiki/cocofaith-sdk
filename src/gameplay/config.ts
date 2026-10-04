import { Schema } from "koishi";

export interface GameplayConfigField<T> {
  readonly defaultValue: T;
  readonly schema: Schema<T>;
  parse(value: unknown, key: string): T;
}

export type GameplayConfigShape = Record<string, GameplayConfigField<any>>;
export type InferGameplayConfig<T extends GameplayConfigShape> = {
  [K in keyof T]: T[K] extends GameplayConfigField<infer V> ? V : never;
};

export interface GameplayConfigDefinition<C extends Record<string, unknown>> {
  readonly defaults: Readonly<C>;
  readonly schema: Schema<C>;
  parse(value: unknown): C;
}

export function defineGameplayConfig<T extends GameplayConfigShape>(
  shape: T,
): GameplayConfigDefinition<InferGameplayConfig<T>> {
  const defaults = Object.fromEntries(
    Object.entries(shape).map(([key, field]) => [key, field.defaultValue]),
  ) as InferGameplayConfig<T>;
  const schemas = Object.fromEntries(
    Object.entries(shape).map(([key, field]) => [key, field.schema]),
  );

  return Object.freeze({
    defaults: Object.freeze({ ...defaults }),
    schema: Schema.object(schemas) as Schema<InferGameplayConfig<T>>,
    parse(value: unknown) {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new TypeError("玩法配置必须是对象");
      }
      const input = value as Record<string, unknown>;
      return Object.freeze(Object.fromEntries(
        Object.entries(shape).map(([key, field]) => [
          key,
          field.parse(input[key] === undefined ? field.defaultValue : input[key], key),
        ]),
      )) as InferGameplayConfig<T>;
    },
  });
}

export function gameplayInteger(
  defaultValue: number,
  options: { min?: number; max?: number; description?: string } = {},
): GameplayConfigField<number> {
  let schema = Schema.number().step(1).default(defaultValue);
  if (options.min !== undefined) schema = schema.min(options.min);
  if (options.max !== undefined) schema = schema.max(options.max);
  if (options.description) schema = schema.description(options.description);
  return Object.freeze({
    defaultValue,
    schema,
    parse(value: unknown, key: string) {
      if (!Number.isSafeInteger(value)) throw new TypeError(`${key} 必须是安全整数`);
      const number = value as number;
      if (options.min !== undefined && number < options.min) throw new RangeError(`${key} 不能小于 ${options.min}`);
      if (options.max !== undefined && number > options.max) throw new RangeError(`${key} 不能大于 ${options.max}`);
      return number;
    },
  });
}

export function gameplayNumber(
  defaultValue: number,
  options: { min?: number; max?: number; description?: string } = {},
): GameplayConfigField<number> {
  let schema = Schema.number().default(defaultValue);
  if (options.min !== undefined) schema = schema.min(options.min);
  if (options.max !== undefined) schema = schema.max(options.max);
  if (options.description) schema = schema.description(options.description);
  return Object.freeze({
    defaultValue,
    schema,
    parse(value: unknown, key: string) {
      if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`${key} 必须是有限数字`);
      if (options.min !== undefined && value < options.min) throw new RangeError(`${key} 不能小于 ${options.min}`);
      if (options.max !== undefined && value > options.max) throw new RangeError(`${key} 不能大于 ${options.max}`);
      return value;
    },
  });
}

export function gameplayBoolean(defaultValue: boolean, description?: string): GameplayConfigField<boolean> {
  let schema = Schema.boolean().default(defaultValue);
  if (description) schema = schema.description(description);
  return Object.freeze({
    defaultValue,
    schema,
    parse(value: unknown, key: string) {
      if (typeof value !== "boolean") throw new TypeError(`${key} 必须是布尔值`);
      return value;
    },
  });
}

export function gameplayString(
  defaultValue: string,
  options: { minLength?: number; maxLength?: number; description?: string } = {},
): GameplayConfigField<string> {
  let schema = Schema.string().default(defaultValue);
  if (options.description) schema = schema.description(options.description);
  return Object.freeze({
    defaultValue,
    schema,
    parse(value: unknown, key: string) {
      if (typeof value !== "string") throw new TypeError(`${key} 必须是字符串`);
      if (options.minLength !== undefined && value.length < options.minLength) throw new RangeError(`${key} 长度不能小于 ${options.minLength}`);
      if (options.maxLength !== undefined && value.length > options.maxLength) throw new RangeError(`${key} 长度不能大于 ${options.maxLength}`);
      return value;
    },
  });
}
