import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'correlation-id': 'src/correlation-id.ts',
    logger: 'src/logger.ts',
    otel: 'src/otel.ts',
  },
  format: ['esm', 'cjs'],
  dts: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
  target: 'es2023',
  external: ['pino'],
});
