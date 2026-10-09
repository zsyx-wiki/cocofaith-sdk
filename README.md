# CoCoFaith SDK

CoCoFaith v3 的公共开发协议，包含 Core 结构契约和 Gameplay SDK。

它是普通 TypeScript 库，不是 Koishi 插件，不注册服务、命令或数据库模型。

```bash
npm install @mueo/cocofaith-sdk
```

实现 Core 时从 `@mueo/cocofaith-sdk/core` 引入服务契约；开发玩法时从
`@mueo/cocofaith-sdk/gameplay` 引入玩法定义、配置和结果工具。

SDK 使用与 CoCoFaith v3 相同的主版本号。预发布版本通过 npm 的 `alpha`
标签发布，不会占用 `latest`。

## 开发入口

| 入口 | 使用者 | 内容 |
| --- | --- | --- |
| `/gameplay` | 玩法作者 | 定义、配置、参数、状态、结果、错误、扩展 token |
| `/core` | 高级玩法与 Core 实现者 | 按领域划分的服务契约、作用域与生命周期 |
| `/testing` | 玩法测试 | 单用户内存宿主，事务回滚与事件幂等测试 |
| `/runtime` | Business 宿主实现者 | 执行与状态保存；玩法通常不需要导入 |
| `/protocol` | Business/Adapter 实现者 | 平台无关的事件、响应和适配器契约 |

根入口保留兼容导出；新代码优先使用对应子入口。

## 最小玩法

```ts
import { defineGameplay, defineGameplayConfig, gameplayInteger }
  from "@mueo/cocofaith-sdk/gameplay"

const config = defineGameplayConfig({ reward: gameplayInteger(50, { min: 0 }) })
export const fish = defineGameplay({
  name: "fish", config,
  commands: [{
    id: "play", triggers: ["摸鱼"], atomic: "user",
    async run({ economy, config }) {
      const reward = await economy.reward({ gold: config.reward })
      return `获得 ${reward.applied.gold ?? 0} 金币。`
    },
  }],
})
```

调用 `faithBusiness.register(fish)` 注册。文本直接返回字符串，图片与混合响应使用
`image()`、`mixed()`；使用 `fail()` 返回明确的玩家错误。命令修改资产时使用
`atomic: "user"`，事务上下文中的 `core` 只提供运行时信息和游戏日，写操作经由
`economy`、`items`、`user` 或 `tx`。外部副作用放在 `afterCommit()` 中。

## 测试

```ts
import { createGameplayTestHarness } from "@mueo/cocofaith-sdk/testing"
const host = createGameplayTestHarness(fish, { gold: 100 })
await host.run("play", [], { eventId: "test-1" })
console.assert(host.snapshot().gold === 150)
await host.dispose()
```

测试宿主支持单用户资产、背包、私有/公开状态、事务回滚、重复事件和资源清理。
它不模拟加成注册表、独立业务表、多用户事务、平台发送和跨模块注册；这些行为应在
真实 Core/Business 中做集成测试。`reward()` 在宿主中按输入金额入账。

执行 `npm test` 会检查源码与开发者类型用例、构建 CJS/ESM/声明文件并运行行为测试。
执行 `npm run format` 可统一源码排版。

状态、参数、生命周期与高级模块示例见 Business 的 `docs/gameplay.md`。
