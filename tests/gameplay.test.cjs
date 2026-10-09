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

test('nested configuration validates defaults and composed constraints', () => {
  assert.throws(() => gameplay.defineGameplayConfig({ count: gameplay.gameplayInteger(-1, { min: 0 }) }))
  const config = gameplay.refineGameplayConfig(gameplay.defineGameplayConfig({
    mode: gameplay.gameplayEnum(['easy', 'hard'], 'easy'),
    rewards: gameplay.gameplayArray(gameplay.gameplayInteger(1, { min: 0 }), [1], { maxLength: 2 }),
    limits: gameplay.gameplayObject({ max: gameplay.gameplayInteger(2) }),
    label: gameplay.gameplayOptional(gameplay.gameplayString('')),
  }), value => { if (value.rewards.length > value.limits.max) throw new RangeError('too many rewards') })
  assert.equal(config.parse({}).mode, 'easy')
  assert.throws(() => config.parse({ mode: 'invalid' }))
  assert.throws(() => config.parse({ rewards: [-1] }))
  assert.throws(() => config.parse({ rewards: [1, 2], limits: { max: 1 } }))
  assert.throws(() => config.schema({ rewards: [1, 2], limits: { max: 1 } }))
})

test('results reject invalid payloads and preserve delivery options', () => {
  assert.throws(() => gameplay.normalizeGameplayResult({ type: 'image', url: 'file:///tmp/private' }))
  assert.throws(() => gameplay.normalizeGameplayResult('x'.repeat(32769)))
  assert.throws(() => gameplay.normalizeGameplayResult({ type: 'text', content: 'ok', delivery: 'unknown' }))
  const result = gameplay.text('ok', { delivery: 'proactive-required', broadcast: { id: 'notice', content: 'hello' } })
  gameplay.assertGameplayResult(result)
  assert.equal(result.delivery, 'proactive-required')
})


test('string and array schemas enforce the same limits as parsers', () => {
  const config = gameplay.defineGameplayConfig({ label: gameplay.gameplayString('ok', { minLength: 2, maxLength: 4 }), values: gameplay.gameplayArray(gameplay.gameplayInteger(1), [1], { maxLength: 1 }) })
  assert.throws(() => config.schema({ label: 'x' }))
  assert.throws(() => config.parse({ label: 'x' }))
  assert.throws(() => config.schema({ values: [1, 2] }))
  assert.throws(() => config.parse({ values: [1, 2] }))
  const args = gameplay.defineGameplayParameters({ count: gameplay.gameplayArgument(gameplay.gameplayOptional(gameplay.gameplayInteger(1)), { optional: true }) })
  assert.equal(args.parse(['2']).count, 2)
  assert.equal(args.parse([]).count, undefined)
})
