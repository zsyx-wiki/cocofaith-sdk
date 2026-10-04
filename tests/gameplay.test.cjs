const test = require("node:test")
const assert = require("node:assert/strict")
const gameplay = require("../lib/gameplay/index.js")

test("gameplay config supplies defaults and validates values", () => {
  const config = gameplay.defineGameplayConfig({
    reward: gameplay.gameplayInteger(50, { min: 0, max: 100 }),
    enabled: gameplay.gameplayBoolean(true),
  })

  assert.deepEqual(config.defaults, { reward: 50, enabled: true })
  assert.deepEqual(config.parse({ reward: 80, enabled: false }), {
    reward: 80,
    enabled: false,
  })
  assert.throws(() => config.parse({ reward: 101, enabled: true }))
})

test("gameplay definition and result helpers expose the stable protocol", () => {
  const definition = gameplay.defineGameplay({
    name: "sdk_probe",
    commands: [{ id: "run", triggers: ["SDK"], run: () => gameplay.text("ok") }],
  })

  assert.equal(gameplay.isGameplayDefinition(definition), true)
  assert.deepEqual(gameplay.normalizeGameplayResult("ok"), { type: "text", content: "ok" })
  assert.deepEqual(gameplay.normalizeGameplayResult(undefined), { type: "silent" })
})
