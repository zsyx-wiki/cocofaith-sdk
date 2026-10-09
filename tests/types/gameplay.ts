import { defineGameplay, defineGameplayState, defineGameplayConfig, defineGameplayParameters, gameplayArgument, gameplayInteger, defineGameplayInterface, useGameplayInterface, provideGameplayInterface } from "../../src/gameplay";
const state = defineGameplayState({ defaults: { count: 0 }, parse(value) {
  if (!value || typeof value !== "object" || !("count" in value) || typeof value.count !== "number") throw new TypeError("count");
  return { count: value.count };
} });
const parameters = defineGameplayParameters({ count: gameplayArgument(gameplayInteger(1)) });
defineGameplay({ name: "typed", state, config: defineGameplayConfig({ reward: gameplayInteger(2) }),
  setup: ({ config }) => ({ reward: config.reward }),
  commands: [{ id: "play", triggers: ["play"], parameters, atomic: "user", run({ state, params, config, service, core }) {
    const count: number = params.count;
    const reward: number = config.reward + service.reward;
    state.data.count += count + reward;
    // @ts-expect-error Persistent state has declared fields.
    state.data.count = "bad";
    // @ts-expect-error Atomic commands cannot write outside their transaction.
    core.economy.pay(1, { gold: 1 });
    return "ok";
  } }] });
defineGameplay({ name: "guest", commands: [{ id: "read", triggers: ["read"], guest: true, run({ uid }) {
  // @ts-expect-error Guests may not have a UID.
  const registered: number = uid;
  return "ok";
} }] });
const token = defineGameplayInterface<{ reward: number }>("typed");
declare const context: Parameters<typeof provideGameplayInterface>[0] & Parameters<typeof useGameplayInterface>[0];
const reward: number = useGameplayInterface(context, token).reward;
// @ts-expect-error Provider must implement the shared interface.
provideGameplayInterface(context, token, { reward: "bad" });
