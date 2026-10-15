const test = require("node:test");
const assert = require("node:assert/strict");
const g = require("../lib/gameplay/index.js");
const { createGameplayTestHarness } = require("../lib/testing/index.js");

test("state fields reuse config validation and yield isolated mutable state", () => {
  const fields = {
    count: g.gameplayInteger(0, { min: 0 }),
    tags: g.gameplayArray(g.gameplayString("")),
    settings: g.gameplayObject({ enabled: g.gameplayBoolean(true) }),
  };
  const config = g.defineGameplayConfig(fields);
  const state = g.defineGameplayState({ fields, publicFields: { score: g.gameplayNumber(0) } });
  assert.deepEqual(state.defaults, config.defaults);
  const first = state.parse({}),
    second = state.parse({});
  first.tags.push("changed");
  first.settings.enabled = false;
  assert.deepEqual(second, { count: 0, tags: [], settings: { enabled: true } });
  assert.deepEqual(state.publicDefaults, { score: 0 });
  assert.throws(() => state.parse({ count: -1 }), /count/);
  assert.throws(() => config.parse({ count: -1 }), /count/);
  assert.throws(() => state.parsePublic({ score: NaN }), /score/);
});

test("command tables preserve nested IDs, state commits, idempotency and rollback", async () => {
  const state = g.defineGameplayState({ fields: { count: g.gameplayInteger(0, { min: 0 }) } });
  const definition = g.defineGameplay({
    name: "table_game",
    state,
    commands: {
      root: {
        triggers: ["测试"],
        children: {
          claim: {
            triggers: ["领取"],
            atomic: "user",
            async run({ state, economy, args }) {
              state.data.count++;
              await economy.creditFixed({ gold: 5 });
              if (args[0] === "invalid") state.data.count = -1;
              return String(state.data.count);
            },
          },
        },
      },
    },
  });
  assert.equal(definition.commands[0].id, "root");
  assert.equal(definition.commands[0].children[0].id, "claim");
  assert.equal(Object.isFrozen(definition.commands[0].children), true);
  const host = createGameplayTestHarness(definition);
  try {
    assert.equal((await host.run("root.claim", [], { eventId: "first" })).content, "1");
    const before = host.snapshot();
    await assert.rejects(host.run("root.claim", ["invalid"], { eventId: "invalid" }));
    assert.deepEqual(host.snapshot(), before);
    await assert.rejects(host.run("root.claim", [], { eventId: "first" }));
    assert.deepEqual(host.snapshot(), before);
  } finally {
    await host.dispose();
  }
});

test("command table rejects conflicting IDs, invalid keys and recursive trees", () => {
  const run = () => "ok";
  assert.throws(
    () => g.defineGameplay({ name: "bad", commands: { x: { id: "other", triggers: ["x"], run } } }),
    /ID/,
  );
  assert.throws(
    () => g.defineGameplay({ name: "bad", commands: { 非法: { triggers: ["x"], run } } }),
    /ID/,
  );
  const recursive = { x: { triggers: ["x"] } };
  recursive.x.children = recursive;
  assert.throws(() => g.defineGameplay({ name: "bad", commands: recursive }), /16/);
});

test("field states keep version migration behavior", () => {
  const state = g.defineGameplayState({
    fields: { count: g.gameplayInteger(0) },
    version: 2,
    migrate(data, version) {
      assert.equal(version, 1);
      return { count: Number(data.oldCount) };
    },
  });
  const { loadGameplayState } = require("../lib/runtime/index.js");
  assert.deepEqual(
    loadGameplayState(state, { private: { oldCount: 3, __cocofaith_state_version: 1 }, public: {} })
      .data,
    { count: 3 },
  );
});

test("adapter contract checks accept compatible hosts without official Core implementation", () => {
  const { assertFaithAdapterServices } = require("../lib/adapter/index.js");
  const host = {
    faithCore: { adapter: { resolve: async () => null } },
    faithBusiness: { dispatch: async () => ({ matched: false }), acceptsCommand: () => false },
  };
  assert.doesNotThrow(() => assertFaithAdapterServices(host, "Example"));
  assert.throws(() => assertFaithAdapterServices(null, "Example"), /Example.*faithCore/);
  assert.throws(
    () => assertFaithAdapterServices({ faithCore: host.faithCore }, "Example"),
    /faithBusiness/,
  );
  assert.throws(
    () => assertFaithAdapterServices({ ...host, faithBusiness: { dispatch() {} } }, "Example"),
    /acceptsCommand/,
  );
});

test("state fields preserve undeclared public state when no public schema is specified", () => {
  const state = g.defineGameplayState({ fields: { count: g.gameplayInteger(0) } });
  const saved = { existingExtension: { value: 1 } };
  const parsed = state.parsePublic(saved);
  assert.deepEqual(parsed, saved);
  parsed.existingExtension.value = 2;
  assert.equal(saved.existingExtension.value, 1);
});
