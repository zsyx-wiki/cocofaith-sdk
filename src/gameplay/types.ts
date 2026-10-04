import type {
  FaithAtomicScope,
  FaithBusinessCoreScope,
  FaithDisposable,
  IdentityInput,
} from "../core";
import type { GameplayConfigDefinition } from "./config";
import type { GameplayOutput } from "./result";

export type GameplayScene = "group" | "private";

export interface GameplayEvent {
  readonly uid: number | null;
  readonly identity?: Readonly<IdentityInput>;
  readonly scene: GameplayScene;
  readonly content: string;
  readonly channelId?: string;
  readonly roomKey?: string;
  readonly eventId?: string;
  readonly displayName?: string;
  readonly adapter?: Readonly<{ name: string; version: string }>;
}

export interface GameplaySetupContext<C extends Record<string, unknown>> {
  readonly name: string;
  readonly core: FaithBusinessCoreScope;
  readonly config: Readonly<C>;
  provide<T>(name: string, value: T, options?: { version?: string }): FaithDisposable;
  use<T>(business: string, name?: string): T;
  contribute<I, O>(
    slot: string,
    handler: (input: Readonly<I>) => O | Promise<O>,
    options: Record<string, unknown>,
  ): FaithDisposable;
  collect<I, O>(slot: string, input: Readonly<I>): Promise<unknown>;
}

export interface GameplayCommandContext<
  C extends Record<string, unknown>,
  S,
  U extends number | null = number,
> {
  readonly uid: U;
  readonly event: GameplayEvent;
  readonly args: readonly string[];
  readonly path: readonly string[];
  readonly core: FaithBusinessCoreScope;
  readonly config: Readonly<C>;
  readonly service: S;
}

export interface GameplayAtomicState {
  data: Record<string, unknown>;
  publicData: Record<string, unknown>;
  readonly gameDay: string;
}

export interface GameplayAtomicCommandContext<C extends Record<string, unknown>, S>
  extends GameplayCommandContext<C, S> {
  readonly tx: FaithAtomicScope;
  readonly state: GameplayAtomicState;
  readonly economy: FaithAtomicScope["economy"];
  readonly items: FaithAtomicScope["items"];
  readonly user: FaithAtomicScope["users"];
}

interface GameplayCommandBase {
  readonly id: string;
  readonly triggers: readonly string[];
  readonly description?: string;
  readonly scenes?: readonly GameplayScene[];
}

export interface GameplayCommand<C extends Record<string, unknown>, S> extends GameplayCommandBase {
  readonly guest?: false;
  readonly atomic?: false;
  run(context: GameplayCommandContext<C, S>): GameplayOutput | Promise<GameplayOutput>;
}

export interface GameplayGuestCommand<C extends Record<string, unknown>, S> extends GameplayCommandBase {
  readonly guest: true;
  readonly atomic?: false;
  run(context: GameplayCommandContext<C, S, number | null>): GameplayOutput | Promise<GameplayOutput>;
}

export interface GameplayAtomicCommand<C extends Record<string, unknown>, S> extends GameplayCommandBase {
  readonly guest?: false;
  readonly atomic: "user";
  run(context: GameplayAtomicCommandContext<C, S>): GameplayOutput | Promise<GameplayOutput>;
}

export type GameplayCommandDefinition<C extends Record<string, unknown>, S> =
  | GameplayCommand<C, S>
  | GameplayGuestCommand<C, S>
  | GameplayAtomicCommand<C, S>;

export interface GameplayDefinition<
  C extends Record<string, unknown> = Record<string, never>,
  S = undefined,
> {
  readonly kind: "faith-gameplay";
  readonly name: string;
  readonly description?: string;
  readonly dependencies?: readonly string[];
  readonly config?: GameplayConfigDefinition<C>;
  setup?(context: GameplaySetupContext<C>): S | Promise<S>;
  readonly commands: readonly GameplayCommandDefinition<C, S>[];
}

export type GameplayInput<C extends Record<string, unknown>, S> = Omit<GameplayDefinition<C, S>, "kind">;
