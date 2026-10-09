import { loadGameplayState, GAMEPLAY_STATE_VERSION_KEY, type GameplayStateDefinition } from "./state";
import { createHash } from "node:crypto";
import type { FaithBusinessCoreScope } from "../core";
import { GameplayError } from "./errors";
import { normalizeGameplayResult, type GameplayResult } from "./result";
import type {
  GameplayAtomicCommandContext,
  GameplayCommandContext,
  GameplayCommandDefinition,
  GameplayEvent,
} from "./types";

export interface GameplayExecutionInput<C extends Record<string, unknown>, S> {
  readonly business: string;
  readonly command: GameplayCommandDefinition<C, S>;
  readonly uid: number | null;
  readonly event: GameplayEvent;
  readonly args: readonly string[];
  readonly path: readonly string[];
  readonly core: FaithBusinessCoreScope;
  readonly config: Readonly<C>;
  readonly service: S;
  readonly stateDefinition?: GameplayStateDefinition<Record<string, unknown>, Record<string, unknown>>;
}

export async function executeGameplayCommand<C extends Record<string, unknown>, S>(
  input: GameplayExecutionInput<C, S>,
): Promise<GameplayResult> {
  const { command } = input;
  if (!command.run) throw new GameplayError("INVALID_INPUT", `命令 ${input.business}/${command.id} 需要子命令`);
  if (input.uid === null && command.guest !== true) {
    throw new GameplayError("UNREGISTERED", "用户尚未注册。");
  }
  if (command.atomic === "user") {
    if (input.uid === null) {
      throw new GameplayError("UNREGISTERED", "原子玩法需要已注册玩家。");
    }
    return executeAtomic(input as GameplayExecutionInput<C, S> & {
      uid: number;
      command: Extract<typeof command, { atomic: "user" }>;
    });
  }

  const run = command.run as (
    context: GameplayCommandContext<C, S, number | null>,
  ) => ReturnType<NonNullable<typeof command.run>>;
  const output = await run({
    uid: input.uid,
    event: input.event,
    args: input.args,
    params: input.command.parameters?.parse(input.args) ?? {},
    path: input.path,
    core: input.core,
    config: input.config,
    service: input.service,
  });
  return normalizeGameplayResult(output);
}

async function executeAtomic<C extends Record<string, unknown>, S>(
  input: GameplayExecutionInput<C, S> & {
    readonly uid: number;
    readonly command: Extract<GameplayCommandDefinition<C, S>, { atomic: "user" }>;
  },
): Promise<GameplayResult> {
  const source = `${input.business}.${input.command.id}`;
  return input.core.transaction.run(
    input.uid,
    async (tx) => {
      const row = await tx.data.get();
      const state = {
        ...(input.stateDefinition ? loadGameplayState(input.stateDefinition, row) : { data: structuredClone(row.private), publicData: structuredClone(row.public) }),
        gameDay: input.core.gameDay.currentDate(),
      };
      const economy = Object.freeze({
        getWallet: tx.economy.getWallet,
        canAfford: tx.economy.canAfford,
        pay: tx.economy.pay,
        creditFixed: tx.economy.creditFixed,
        reward: (
          amount: Parameters<typeof tx.economy.reward>[0],
          options: Parameters<typeof tx.economy.reward>[1] = {},
        ) => tx.economy.reward(amount, {
          ...options,
          source: options.source ?? source,
        }),
      });
      const output = await input.command.run({
        uid: input.uid,
        event: input.event,
        args: input.args,
    params: input.command.parameters?.parse(input.args) ?? {},
        path: input.path,
        core: Object.freeze({ name: input.core.name, runtime: input.core.runtime, gameDay: input.core.gameDay }),
        afterCommit: tx.afterCommit,
        afterRollback: tx.afterRollback,
        config: input.config,
        service: input.service,
        tx,
        state,
        economy,
        items: tx.items,
        user: tx.users,
      } satisfies GameplayAtomicCommandContext<C, S>);

      const result = normalizeGameplayResult(output);
      const data = input.stateDefinition ? input.stateDefinition.parse(state.data) : state.data;
      const publicData = input.stateDefinition ? input.stateDefinition.parsePublic(state.publicData) : state.publicData;
      await tx.data.set({ private: input.stateDefinition ? { ...data, [GAMEPLAY_STATE_VERSION_KEY]: input.stateDefinition.version } : data, public: publicData });
      return result;
    },
    {
      source,
      idempotencyKey: gameplayIdempotencyKey(
        input.business,
        input.command.id,
        input.event,
      ),
    },
  );
}

export function gameplayIdempotencyKey(
  business: string,
  command: string,
  event: Pick<GameplayEvent, "eventId" | "roomKey" | "channelId" | "adapter">,
): string | undefined {
  if (!event.eventId) return undefined;
  const digest = createHash("sha256")
    .update(JSON.stringify([
      event.adapter?.name ?? "unknown",
      event.roomKey ?? "",
      event.channelId ?? "",
      event.eventId,
    ]))
    .digest("hex")
    .slice(0, 24);
  return `${business}:${command}:${digest}`;
}
