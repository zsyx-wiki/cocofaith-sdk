const test = require('node:test')
const assert = require('node:assert/strict')
const { assertFaithCoreContract } = require('../lib/core/index.js')

test('Core contract accepts structural implementations and rejects incompatible API versions', () => {
  const core = {
    apiVersion: '3.0',
    capabilities: { has: () => false, all: () => [] },
    lifecycle: { scope: () => ({}) },
    locks: { run: (_key, task) => task() },
    adapter: {
      normalize: (identity) => identity,
      resolve: async () => null,
      bind: async () => true,
    },
    permissions: {
      register: () => ({ disposed: false, dispose() {} }),
      check: async () => false,
    },
    createBusinessScope: () => ({}),
  }
  assert.doesNotThrow(() => assertFaithCoreContract(core))
  assert.throws(() => assertFaithCoreContract({ ...core, apiVersion: '4.0' }), /Core API 3\.0/)
})
