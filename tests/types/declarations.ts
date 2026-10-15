import {
  defineGameplay,
  defineGameplayState,
  defineGameplayConfig,
  gameplayInteger,
  gameplayBoolean,
  gameplayString,
} from "../../src/gameplay";

const state = defineGameplayState({
  fields: {
    count: gameplayInteger(0),
    label: gameplayString(""),
  },
  publicFields: { visible: gameplayBoolean(true) },
});

const game = defineGameplay({
  name: "typed_table",
  config: defineGameplayConfig({ gold: gameplayInteger(5) }),
  state,
  setup: ({ config }) => ({ reward: config.gold }),
  commands: {
    claim: {
      triggers: ["领取"],
      atomic: "user",
      async run({ state, service, economy, config }) {
        state.data.count += service.reward + config.gold;
        state.publicData.visible = true;
        // @ts-expect-error State fields retain their declared type.
        state.data.count = "bad";
        await economy.creditFixed({ gold: service.reward });
        return state.data.label;
      },
    },
    group: {
      triggers: ["组"],
      children: {
        guest: {
          triggers: ["访客"],
          guest: true,
          run({ uid }) {
            const value: number | null = uid;
            return String(value);
          },
        },
      },
    },
  },
});
void game;

import type { GameplayCommandInput } from "../../src/gameplay";
// @ts-expect-error A command needs a handler or a non-optional child collection.
const missingHandler: GameplayCommandInput<{}, undefined, {}, {}, {}> = {
  id: "missing",
  triggers: ["missing"],
};
void missingHandler;
