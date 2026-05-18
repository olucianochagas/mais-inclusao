import { defineConfig } from 'tsup';

/**
 * Dual ESM+CJS para uso em NestJS e em jobs Node sem impor formato unico.
 * Declaracoes ficam com `tsc` para preservar imports type-only.
 */
export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
  target: 'es2023',
  external: ['node:async_hooks', '@mais-inclusao/contracts'],
});
