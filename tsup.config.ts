import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "core/index": "src/core/index.ts",
    "gameplay/index": "src/gameplay/index.ts",
    "testing/index": "src/testing/index.ts",
    "runtime/index": "src/runtime/index.ts",
    "protocol/index": "src/protocol/index.ts",
  },
  outDir: "lib",
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["koishi"],
});
