import type { CommandCollection } from "./commands";
import type {
  FaithAtomicScope,
  FaithBusinessCoreScope,
  FaithDisposable,
  IdentityInput,
} from "../core";
import type { GameplayParameters } from "./arguments";
import type { GameplayConfigDefinition } from "./config";
import type { GameplayOutput } from "./result";
import type { GameplayStateDefinition } from "./state";
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
  readonly adapter?: Readonly<{
    name: string;
    version: string;
  }>;
}
export interface GameplaySetupContext<C extends Record<string, unknown>> {
  readonly name: string;
  readonly core: FaithBusinessCoreScope;
  readonly config: Readonly<C>;
  track<T extends FaithDisposable>(resource: T): T;
  defer(callback: () => void | Promise<void>): FaithDisposable;
  provide<T>(
    name: string,
    value: T,
    options?: {
      version?: string;
    },
  ): FaithDisposable;
  use<T>(business: string, name?: string): T;
  contribute<I, O>(
    slot: string,
    handler: (
      input: Readonly<I>,
    ) => O | readonly O[] | null | undefined | Promise<O | readonly O[] | null | undefined>,
    options: {
      id: string;
      priority?: number;
    },
  ): FaithDisposable;
  collect<I, O>(slot: string, input: Readonly<I>): Promise<unknown>;
}
export interface GameplayCommandContext<
  C extends Record<string, unknown>,
  S,
  U extends number | null = number,
  A extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly uid: U;
  readonly event: GameplayEvent;
  readonly args: readonly string[];
  readonly params: Readonly<A>;
  readonly path: readonly string[];
  readonly core: FaithBusinessCoreScope;
  readonly config: Readonly<C>;
  readonly service: S;
}
export interface GameplayAtomicState<
  D extends Record<string, unknown> = Record<string, unknown>,
  P extends Record<string, unknown> = Record<string, unknown>,
> {
  data: D;
  publicData: P;
  readonly gameDay: string;
}
export interface GameplayAtomicCommandContext<
  C extends Record<string, unknown>,
  S,
  D extends Record<string, unknown> = Record<string, unknown>,
  P extends Record<string, unknown> = Record<string, unknown>,
  A extends Record<string, unknown> = Record<string, unknown>,
> extends Omit<GameplayCommandContext<C, S, number, A>, "core"> {
  /** Atomic writes belong to tx; external side effects belong to afterCommit. */
  readonly core: Pick<FaithBusinessCoreScope, "name" | "runtime" | "gameDay">;
  readonly afterCommit: FaithAtomicScope["afterCommit"];
  readonly afterRollback: FaithAtomicScope["afterRollback"];
  readonly tx: FaithAtomicScope;
  readonly state: GameplayAtomicState<D, P>;
  readonly economy: FaithAtomicScope["economy"];
  readonly items: FaithAtomicScope["items"];
  readonly user: FaithAtomicScope["users"];
}
interface GameplayCommandBase<
  C extends Record<string, unknown>,
  S,
  D extends Record<string, unknown>,
  P extends Record<string, unknown>,
  A extends Record<string, unknown>,
> {
  readonly id: string;
  readonly triggers: readonly string[];
  readonly parameters?: GameplayParameters<A>;
  readonly match?: (content: string) => boolean;
  readonly children?: readonly GameplayCommandDefinition<C, S, D, P, A>[];
  readonly description?: string;
  readonly scenes?: readonly GameplayScene[];
}
export interface GameplayCommand<
  C extends Record<string, unknown>,
  S,
  D extends Record<string, unknown>,
  P extends Record<string, unknown>,
  A extends Record<string, unknown>,
> extends GameplayCommandBase<C, S, D, P, A> {
  readonly guest?: false;
  readonly atomic?: false;
  run(context: GameplayCommandContext<C, S, number, A>): GameplayOutput | Promise<GameplayOutput>;
}
export interface GameplayGuestCommand<
  C extends Record<string, unknown>,
  S,
  D extends Record<string, unknown>,
  P extends Record<string, unknown>,
  A extends Record<string, unknown>,
> extends GameplayCommandBase<C, S, D, P, A> {
  readonly guest: true;
  readonly atomic?: false;
  run(
    context: GameplayCommandContext<C, S, number | null, A>,
  ): GameplayOutput | Promise<GameplayOutput>;
}
export interface GameplayAtomicCommand<
  C extends Record<string, unknown>,
  S,
  D extends Record<string, unknown>,
  P extends Record<string, unknown>,
  A extends Record<string, unknown>,
> extends GameplayCommandBase<C, S, D, P, A> {
  readonly guest?: false;
  readonly atomic: "user";
  run(
    context: GameplayAtomicCommandContext<C, S, D, P, A>,
  ): GameplayOutput | Promise<GameplayOutput>;
}
export type GameplayCommandDefinition<
  C extends Record<string, unknown>,
  S,
  D extends Record<string, unknown> = Record<string, unknown>,
  P extends Record<string, unknown> = Record<string, unknown>,
  A extends Record<string, unknown> = Record<string, unknown>,
> =
  | GameplayCommand<C, S, D, P, A>
  | GameplayGuestCommand<C, S, D, P, A>
  | GameplayAtomicCommand<C, S, D, P, A>
  | GameplayCommandGroup<C, S, D, P, A>;
export interface GameplayDefinition<
  C extends Record<string, unknown> = Record<string, never>,
  S = undefined,
  D extends Record<string, unknown> = Record<string, unknown>,
  P extends Record<string, unknown> = Record<string, unknown>,
  A extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly kind: "faith-gameplay";
  readonly name: string;
  readonly description?: string;
  readonly dependencies?: readonly string[];
  readonly config?: GameplayConfigDefinition<C>;
  readonly state?: GameplayStateDefinition<D, P>;
  dispose?(service: S): void | Promise<void>;
  setup?(context: GameplaySetupContext<C>): S | Promise<S>;
  readonly commands: readonly GameplayCommandDefinition<C, S, D, P, A>[];
}
export type GameplayInput<
  C extends Record<string, unknown>,
  S,
  D extends Record<string, unknown> = Record<string, unknown>,
  P extends Record<string, unknown> = Record<string, unknown>,
  A extends Record<string, unknown> = Record<string, unknown>,
> = Omit<GameplayDefinition<C, S, D, P, A>, "kind" | "commands"> & {
  readonly commands: CommandCollection<GameplayCommandInput<C, S, D, P, A>>;
};
export type GameplayCommandInput<
  C extends Record<string, unknown>,
  S,
  D extends Record<string, unknown>,
  P extends Record<string, unknown>,
  A extends Record<string, unknown>,
> =
  GameplayCommandDefinition<C, S, D, P, A> extends infer T
    ? T extends { readonly id: string }
      ? Omit<T, "children"> &
          (T extends { readonly children: readonly unknown[] }
            ? { readonly children: CommandCollection<GameplayCommandInput<C, S, D, P, A>> }
            : { readonly children?: CommandCollection<GameplayCommandInput<C, S, D, P, A>> })
      : never
    : never;
export interface GameplayCommandGroup<
  C extends Record<string, unknown>,
  S,
  D extends Record<string, unknown>,
  P extends Record<string, unknown>,
  A extends Record<string, unknown>,
> extends GameplayCommandBase<C, S, D, P, A> {
  readonly children: readonly GameplayCommandDefinition<C, S, D, P, A>[];
  readonly guest?: false;
  readonly atomic?: false;
  readonly run?: undefined;
}
