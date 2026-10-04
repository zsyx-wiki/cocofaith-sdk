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
