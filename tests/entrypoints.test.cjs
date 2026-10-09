const test = require('node:test')
const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const path = require('node:path')

test('all public entrypoints load in isolated CommonJS and ESM hosts', () => {
  const entries = ['', '/core', '/gameplay', '/runtime', '/protocol', '/testing']
  for (const mode of ['commonjs', 'module']) {
    const source = entries.map(entry => {
      const target = JSON.stringify(path.resolve(__dirname, '../lib', entry ? entry.slice(1) + '/index' : 'index') + (mode === 'module' ? '.mjs' : '.js'))
      return mode === 'module' ? `await import(${target});` : `require(${target});`
    }).join('\n')
    const result = spawnSync(process.execPath, ['--input-type=' + mode, '-e', source], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
  }
})
