const test = require('node:test')
const assert = require('node:assert/strict')
const g = require('../lib/gameplay/index.js')
const { createGameplayTestHarness } = require('../lib/testing/index.js')

test('atomic host rolls back assets/state and commits effects only after valid output', async () => {
  let effects = 0, rollbacks = 0
  const definition = g.defineGameplay({ name: 'atomic_test', commands: [{ id: 'run', triggers: ['run'], atomic: 'user',
    async run({ economy, state, afterCommit, afterRollback, args }) {
      await economy.pay({ gold: 5 })
      state.data.count = Number(state.data.count ?? 0) + 1
      afterCommit(() => effects++)
      afterRollback(() => rollbacks++)
      if (args[0] === 'fail') g.fail('NOT_ALLOWED', 'no')
      if (args[0] === 'invalid') return { type: 'image', url: 'file:///tmp/no' }
      return 'ok'
    } }] })
  const host = createGameplayTestHarness(definition, { gold: 20 })
  await assert.rejects(host.run('run', ['fail']))
  await assert.rejects(host.run('run', ['invalid']))
  assert.equal(host.snapshot().gold, 20)
  assert.equal(effects, 0)
  assert.equal(rollbacks, 2)
  await host.run('run', [], { eventId: '1' })
  assert.equal(host.snapshot().gold, 15)
  assert.equal(host.snapshot().private.count, 1)
  assert.equal(effects, 1)
  await assert.rejects(host.run('run', [], { eventId: '1' }))
  assert.equal(host.snapshot().gold, 15)
})

test('typed parameters and state are parsed, migrated and validated before commit', async () => {
  const state = g.defineGameplayState({ version: 2, defaults: { count: 0 }, parse(value) {
    if (!Number.isSafeInteger(value.count)) throw new TypeError('count must be an integer')
    return { count: value.count }
  }, migrate(value, from) { return { count: Number(value.old ?? value.count ?? 0) + (from === 1 ? 1 : 0) } } })
  assert.equal(g.loadGameplayState(state, { private: { old: 3, __cocofaith_state_version: 1 }, public: {} }).data.count, 4)
  assert.throws(() => g.loadGameplayState(state, { private: { __cocofaith_state_version: 3 }, public: {} }))
  const parameters = g.defineGameplayParameters({ count: g.gameplayArgument(g.gameplayInteger(1, { min: 1 })) })
  const host = createGameplayTestHarness(g.defineGameplay({ name: 'state_test', state, commands: [{ id: 'add', triggers: ['add'], parameters, atomic: 'user', run({ params, state }) { state.data.count += params.count; return 'ok' } }] }))
  await host.run('add', ['2'])
  assert.equal(host.snapshot().private.count, 2)
  assert.equal(host.snapshot().private.__cocofaith_state_version, 2)
  await assert.rejects(host.run('add', ['NaN']))
  await assert.rejects(host.run('add', []))
  assert.equal(host.snapshot().private.count, 2)
})

test('definitions fail early for invalid combinations and command trees', () => {
  assert.throws(() => g.defineGameplay({ name: 'bad', commands: [{ id: 'play', triggers: ['play'], guest: true, atomic: 'user', run() {} }] }))
  assert.throws(() => g.defineGameplay({ name: 'bad', commands: [{ id: 'play', triggers: ['two words'], run() {} }] }))
  assert.throws(() => g.defineGameplay({ name: 'bad', commands: [{ id: 'play', triggers: ['play'] }] }))
  const definition = g.defineGameplay({ name: 'tree', commands: [{ id: 'root', triggers: ['root'], children: [{ id: 'child', triggers: ['child'], run: () => 'ok' }] }] })
  const host = createGameplayTestHarness(definition)
  return host.run('root.child').then(result => assert.equal(result.content, 'ok'))
})

test('test host returns complete economy and user contracts', async () => {
  const host = createGameplayTestHarness(g.defineGameplay({ name: 'contracts', commands: [{ id: 'run', triggers: ['run'], atomic: 'user', async run({ economy, user }) {
    const reward = await economy.reward({ gold: 5 })
    assert.equal(reward.before.gold, 10)
    assert.equal(reward.after.gold, 15)
    assert.equal(reward.user.status, 'active')
    assert.equal(reward.requested.gold, 5)
    const paid = await economy.pay({ gold: 2 })
    assert.deepEqual(paid.faiths, [])
    await user.setFaiths(['test'])
    await user.setProfession('test_profession')
    assert.equal((await user.get()).profession_id, 'test_profession')
    return 'ok'
  } }] }), { gold: 10 })
  await host.run('run')
  assert.equal(host.snapshot().gold, 13)
  assert.deepEqual(host.snapshot().faiths, ['test'])
})

test('test host cleans resources after setup and disposal failures', async () => {
  let cleaned = 0
  const broken = createGameplayTestHarness(g.defineGameplay({ name: 'broken', setup({ defer }) { defer(() => cleaned++); throw new Error('setup') }, commands: [{ id: 'run', triggers: ['run'], run: () => 'ok' }] }))
  await assert.rejects(broken.run('run'))
  assert.equal(cleaned, 1)
  const host = createGameplayTestHarness(g.defineGameplay({ name: 'cleanup', setup({ defer }) { const resource = defer(() => cleaned++); defer(() => { throw new Error('cleanup') }); return resource }, dispose(resource) { return resource.dispose() }, commands: [{ id: 'run', triggers: ['run'], run: () => 'ok' }] }))
  await host.run('run')
  await assert.rejects(host.dispose(), AggregateError)
  assert.equal(cleaned, 2)
  await host.dispose()
  assert.equal(cleaned, 2)
})

test('test host runs ready before commands and disposes a service whose ready fails', async () => {
  const events = []
  const host = createGameplayTestHarness(g.defineGameplay({ name: 'ready_test',
    setup() { events.push('setup'); return { value: 1 } },
    ready(service) { events.push(`ready:${service.value}`); throw new Error('ready failed') },
    dispose(service) { events.push(`dispose:${service.value}`) },
    commands: { read: { triggers: ['read'], run() { events.push('run'); return 'ok' } } },
  }))
  await assert.rejects(host.run('read'), /ready failed/)
  assert.deepEqual(events, ['setup', 'ready:1', 'dispose:1'])
  await host.dispose()
  assert.deepEqual(events, ['setup', 'ready:1', 'dispose:1'])
})
