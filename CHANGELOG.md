# Changelog

## Unreleased

- 分离 gameplay、runtime、testing、protocol 入口并按领域整理 Core 契约。
- 加入嵌套配置、跨字段校验、类型化参数与可迁移状态。
- 加入命令树、动态匹配、类型化跨模块接口和贡献点。
- 约束原子执行上下文，统一结果校验、错误定位和事务提交顺序。
- 加入运行时契约校验、内存测试宿主及作者类型回归。

## 3.0.0-alpha.3

- 提供 CoCoFaith Core API 3.0 的公共结构契约与运行时校验。
- 提供 Gameplay 定义、配置、执行、错误和结构化响应工具。
- 支持 Core、Business 和 Adapter 在不安装官方 Core 插件的情况下独立构建。
