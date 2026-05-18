import { defineConfig } from 'tsup';

/**
 * Build apenas JS via esbuild (rápido). Declarações .d.ts são geradas
 * por `tsc --emitDeclarationOnly` no script `build` (ver package.json) —
 * tsup/rollup-plugin-dts tem problemas com ambient declarations.
 *
 * Dual ESM+CJS porque consumers podem ser tanto NestJS (CJS em paths
 * legacy) quanto React 19/Rspack (ESM nativo). `external: ['zod']`
 * preserva zod como peer ao bundle, evitando duplicação.
 */
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'shared/index': 'src/shared/index.ts',
    'auth/index': 'src/auth/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
  target: 'es2023',
  external: ['zod'],
});
