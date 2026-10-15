import type { Context } from "koishi";

export interface FaithAdapterInfo {
  id: string;
  name: string;
  platform: string;
  version: string;
  mode: "binding" | "normal";
}

/** 已启用的接入插件。登记接入能力，不代表机器人在线。 */
export interface FaithAdapterService {
  list(): readonly FaithAdapterInfo[];
  has(platform: string): boolean;
}

declare module "koishi" {
  interface Context {
    faithAdapter: FaithAdapterService;
  }
}

/** Cordis 共享插件：每个 Adapter 持有一个 fork，最后一个卸载时服务自动撤销。 */
class AdapterRegistry implements FaithAdapterService {
  private readonly adapters = new Map<symbol, Readonly<FaithAdapterInfo>>();

  constructor(ctx: Context) {
    ctx.set("faithAdapter", this);
  }

  fork(ctx: Context, info: FaithAdapterInfo) {
    const key = Symbol(info.id);
    this.adapters.set(key, Object.freeze({ ...info }));
    ctx.on("dispose", () => { this.adapters.delete(key); });
  }

  list(): readonly FaithAdapterInfo[] {
    return [...this.adapters.values()];
  }

  has(platform: string): boolean {
    return this.list().some(adapter => adapter.platform === platform);
  }
}

/** 在等待 faithCore / faithBusiness 之前调用，避免与 CoCoFaith 形成依赖循环。 */
export function provideFaithAdapter(ctx: Context, info: FaithAdapterInfo): void {
  ctx.plugin(AdapterRegistry, info);
}
