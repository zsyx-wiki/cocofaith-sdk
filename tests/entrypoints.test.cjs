const test = require('node:test')
const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const path = require('node:path')

test('all public entrypoints load in isolated CommonJS and ESM hosts', () => {
  const entries = ['', '/core', '/gameplay', '/runtime', '/protocol', '/testing', '/adapter']
  for (const mode of ['commonjs', 'module']) {
    const source = entries.map(entry => {
      const target = JSON.stringify(path.resolve(__dirname, '../lib', entry ? entry.slice(1) + '/index' : 'index') + (mode === 'module' ? '.mjs' : '.js'))
      return mode === 'module' ? `await import(${target});` : `require(${target});`
    }).join('\n')
    const result = spawnSync(process.execPath, ['--input-type=' + mode, '-e', source], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
  }
})

// 两种模块格式必须取得同一个注册插件，否则同时加载会重复提供服务。
test('adapter entry shares its provider across CommonJS and ESM imports', async () => {
  const cjs = require('../lib/adapter/index.js')
  const esm = await import('cocofaith-sdk/adapter')
  assert.equal(esm.provideFaithAdapter, cjs.provideFaithAdapter)
})
