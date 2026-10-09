import Schema from "schemastery";
export interface GameplayConfigField<T> {
    readonly defaultValue: T;
    readonly inputKind?: "number" | "boolean" | "string";
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
export function defineGameplayConfig<T extends GameplayConfigShape>(shape: T): GameplayConfigDefinition<InferGameplayConfig<T>> {
    const defaults = Object.fromEntries(Object.entries(shape).map(([key, field]) => [key, field.defaultValue])) as InferGameplayConfig<T>;
    const schemas = Object.fromEntries(Object.entries(shape).map(([key, field]) => [key, field.schema]));
    for (const [key, field] of Object.entries(shape))
        field.parse(field.defaultValue, key);
    return Object.freeze({
        defaults: freezeConfig(structuredClone(defaults)),
        schema: Schema.object(schemas) as Schema<InferGameplayConfig<T>>,
        parse(value: unknown) {
            if (!value || typeof value !== "object" || Array.isArray(value)) {
                throw new TypeError("玩法配置必须是对象");
            }
            const input = value as Record<string, unknown>;
            return freezeConfig(Object.fromEntries(Object.entries(shape).map(([key, field]) => [
                key,
                field.parse(input[key] === undefined ? field.defaultValue : input[key], key),
            ]))) as InferGameplayConfig<T>;
        },
    });
}
export function gameplayInteger(defaultValue: number, options: {
    min?: number;
    max?: number;
    description?: string;
} = {}): GameplayConfigField<number> {
    let schema = Schema.number().step(1).default(defaultValue);
    if (options.min !== undefined)
        schema = schema.min(options.min);
    if (options.max !== undefined)
        schema = schema.max(options.max);
    if (options.description)
        schema = schema.description(options.description);
    return Object.freeze({
        defaultValue,
        inputKind: "number" as const,
        schema,
        parse(value: unknown, key: string) {
            if (!Number.isSafeInteger(value))
                throw new TypeError(`${key} 必须是安全整数`);
            const number = value as number;
            if (options.min !== undefined && number < options.min)
                throw new RangeError(`${key} 不能小于 ${options.min}`);
            if (options.max !== undefined && number > options.max)
                throw new RangeError(`${key} 不能大于 ${options.max}`);
            return number;
        },
    });
}
export function gameplayNumber(defaultValue: number, options: {
    min?: number;
    max?: number;
    description?: string;
} = {}): GameplayConfigField<number> {
    let schema = Schema.number().default(defaultValue);
    if (options.min !== undefined)
        schema = schema.min(options.min);
    if (options.max !== undefined)
        schema = schema.max(options.max);
    if (options.description)
        schema = schema.description(options.description);
    return Object.freeze({
        defaultValue,
        inputKind: "number" as const,
        schema,
        parse(value: unknown, key: string) {
            if (typeof value !== "number" || !Number.isFinite(value))
                throw new TypeError(`${key} 必须是有限数字`);
            if (options.min !== undefined && value < options.min)
                throw new RangeError(`${key} 不能小于 ${options.min}`);
            if (options.max !== undefined && value > options.max)
                throw new RangeError(`${key} 不能大于 ${options.max}`);
            return value;
        },
    });
}
export function gameplayBoolean(defaultValue: boolean, description?: string): GameplayConfigField<boolean> {
    let schema = Schema.boolean().default(defaultValue);
    if (description)
        schema = schema.description(description);
    return Object.freeze({
        defaultValue,
        inputKind: "boolean" as const,
        schema,
        parse(value: unknown, key: string) {
            if (typeof value !== "boolean")
                throw new TypeError(`${key} 必须是布尔值`);
            return value;
        },
    });
}
export function gameplayString(defaultValue: string, options: {
    minLength?: number;
    maxLength?: number;
    description?: string;
} = {}): GameplayConfigField<string> {
    let schema = Schema.string().default(defaultValue);
    if (options.minLength !== undefined)
        schema = schema.min(options.minLength);
    if (options.maxLength !== undefined)
        schema = schema.max(options.maxLength);
    if (options.description)
        schema = schema.description(options.description);
    return Object.freeze({
        defaultValue,
        inputKind: "string" as const,
        schema,
        parse(value: unknown, key: string) {
            if (typeof value !== "string")
                throw new TypeError(`${key} 必须是字符串`);
            if (options.minLength !== undefined && value.length < options.minLength)
                throw new RangeError(`${key} 长度不能小于 ${options.minLength}`);
            if (options.maxLength !== undefined && value.length > options.maxLength)
                throw new RangeError(`${key} 长度不能大于 ${options.maxLength}`);
            return value;
        },
    });
}
export function gameplayEnum<const T extends readonly [
    string,
    ...string[]
]>(values: T, defaultValue: T[number], description?: string): GameplayConfigField<T[number]> {
    const choices = Object.freeze([...values]);
    let schema = Schema.union(choices.map(value => Schema.const(value))).default(defaultValue);
    if (description)
        schema = schema.description(description);
    return Object.freeze({
        defaultValue, schema, parse(value: unknown, key: string) {
            if (typeof value !== "string" || !choices.includes(value))
                throw new TypeError(`${key} 必须是 ${choices.join(" / ")}`);
            return value as T[number];
        }
    });
}
export function gameplayArray<T>(field: GameplayConfigField<T>, defaultValue: readonly T[] = [], options: {
    minLength?: number;
    maxLength?: number;
    description?: string;
} = {}): GameplayConfigField<T[]> {
    let schema = Schema.array(field.schema).default([...defaultValue]);
    if (options.minLength !== undefined)
        schema = schema.min(options.minLength);
    if (options.maxLength !== undefined)
        schema = schema.max(options.maxLength);
    if (options.description)
        schema = schema.description(options.description);
    return Object.freeze({
        defaultValue: [...defaultValue], schema, parse(value: unknown, key: string) {
            if (!Array.isArray(value))
                throw new TypeError(`${key} 必须是数组`);
            if (value.length < (options.minLength ?? 0) || value.length > (options.maxLength ?? Infinity))
                throw new RangeError(`${key} 数组长度超出范围`);
            return value.map((item, index) => field.parse(item, `${key}[${index}]`));
        }
    });
}
export function gameplayObject<T extends GameplayConfigShape>(shape: T): GameplayConfigField<InferGameplayConfig<T>> {
    const definition = defineGameplayConfig(shape);
    return Object.freeze({
        defaultValue: structuredClone(definition.defaults), schema: definition.schema,
        parse(value: unknown, key: string) {
            try {
                return definition.parse(value);
            }
            catch (cause) {
                throw new TypeError(`${key}: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
            }
        },
    });
}
export function gameplayOptional<T>(field: GameplayConfigField<T>): GameplayConfigField<T | undefined> {
    return Object.freeze({
        defaultValue: undefined, inputKind: field.inputKind, schema: Schema.union([Schema.const(undefined), field.schema]) as Schema<T | undefined>,
        parse(value: unknown, key: string) {
            return value === undefined ? undefined : field.parse(value, key);
        },
    });
}
export function refineGameplayConfig<C extends Record<string, unknown>>(definition: GameplayConfigDefinition<C>, validate: (value: Readonly<C>) => void): GameplayConfigDefinition<C> {
    validate(definition.defaults);
    const parse = (value: unknown) => {
        const parsed = definition.parse(value);
        validate(parsed);
        return parsed;
    };
    return Object.freeze({ ...definition, schema: Schema.transform(definition.schema, parse), parse });
}

function freezeConfig<T>(value: T): Readonly<T> {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        for (const child of Object.values(value))
            freezeConfig(child);
        Object.freeze(value);
    }
    return value;
}
