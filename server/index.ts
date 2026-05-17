// Production entry point — re-exports the full server from _core/index.ts
// The build script uses this file as the esbuild entry point.
// DO NOT simplify this file; the full server logic lives in _core/index.ts.
export * from "./_core/index.js";
