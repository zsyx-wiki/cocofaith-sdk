<div align="center">
  <h1>CoCoFaith SDK</h1>

  <p><strong>CoCoFaith v3 的玩法开发 SDK</strong></p>

  <p>
    <img alt="Koishi" src="https://img.shields.io/badge/Koishi-4.16%2B-60a5fa?style=flat-square">
    <img alt="Version" src="https://img.shields.io/badge/version-3.0.0--alpha.4-a78bfa?style=flat-square">
    <img alt="License" src="https://img.shields.io/badge/License-GPL--3.0-52b788?style=flat-square">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white">
  </p>
</div>

---

用于编写 CoCoFaith 玩法，以及实现 Core、Business 和平台适配器。提供 TypeScript 类型、配置校验、事务执行和测试工具，支持 CommonJS 与 ESM。

## 安装

```sh
npm install @mueo/cocofaith-sdk@alpha
```

Koishi 环境要求 4.16+。运行玩法需要启用 CoCoFaith Core、Business 和对应平台的 Adapter。

## 快速开始

定义一个发放金币的玩法：

```ts
// gameplay.ts
import {
  defineGameplay,
  defineGameplayConfig,
  gameplayInteger,
} from '@mueo/cocofaith-sdk/gameplay'

const config = defineGameplayConfig({
  gold: gameplayInteger(50, { min: 0 }),
})

export const rewardGameplay = defineGameplay({
  name: 'reward_example',
  config,
  commands: [{
    id: 'claim',
    triggers: ['奖励示例'],
    atomic: 'user',
    async run({ economy, config }) {
      const reward = await economy.reward({ gold: config.gold })
      return `获得 ${reward.applied.gold ?? 0} 金币。`
    },
  }],
})
```

在 Koishi 插件中注册：

```ts
// index.ts
import type { Context } from 'koishi'
import type {} from '@mueo/koishi-plugin-cocofaith-business'
import { rewardGameplay } from './gameplay'

export const name = 'reward-example'
export const inject = ['faithBusiness'] as const

export function apply(ctx: Context) {
  const registration = ctx.faithBusiness.register(rewardGameplay)
  ctx.on('dispose', () => registration.dispose())
}
```

`atomic: 'user'` 将资产修改和玩法状态放在同一事务中，执行失败时回滚。
命令可以返回字符串，也可以使用 `text()`、`image()`、`mixed()` 和 `silent()`。

## API 入口

| 导入路径 | 用途 |
| --- | --- |
| `@mueo/cocofaith-sdk/gameplay` | 玩法定义、配置、参数、状态、响应和扩展接口 |
| `@mueo/cocofaith-sdk/core` | Core 服务、业务作用域和事务类型 |
| `@mueo/cocofaith-sdk/testing` | 单用户玩法测试 |
| `@mueo/cocofaith-sdk/protocol` | Business 与 Adapter 的事件和消息协议 |
| `@mueo/cocofaith-sdk/runtime` | Business 宿主的命令执行工具 |

## 测试

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { createGameplayTestHarness } from '@mueo/cocofaith-sdk/testing'
import { rewardGameplay } from './gameplay'

test('发放金币', async () => {
  const host = createGameplayTestHarness(rewardGameplay, { gold: 100 })
  try {
    const result = await host.run('claim', [], { eventId: 'test-1' })
    assert.equal(result.type, 'text')
    assert.equal(host.snapshot().gold, 150)
  } finally {
    await host.dispose()
  }
})
```

测试宿主支持资产、背包、玩法状态、事务回滚和事件幂等。加成、独立业务表、
多用户事务和跨模块调用使用 Core/Business 集成测试。

## 文档

- [玩法开发](https://github.com/zsyx-wiki/koishi-plugin-cocofaith-business/blob/main/docs/gameplay.md)
- [Core API](https://github.com/zsyx-wiki/koishi-plugin-cocofaith-business/blob/main/docs/core-api.md)
- [更新日志](./CHANGELOG.md)

## 本地开发

```sh
npm install
npm test
```

## License

GPL-3.0-or-later
