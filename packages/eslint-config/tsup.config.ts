import { defineConfig } from 'tsup';

/**
 * Build apenas JS via esbuild (rápido). Declarações .d.ts são geradas
 * por `tsc --emitDeclarationOnly` no script `build` (ver package.json) —
 * tsup/rollup-plugin-dts tem problemas com `declare module` inline.
 */
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    nest: 'src/nest.ts',
    react: 'src/react.ts',
    lib: 'src/lib.ts',
  },
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
  target: 'es2023',
  external: [
    'eslint',
    'typescript',
    '@eslint/js',
    'typescript-eslint',
    'eslint-plugin-import',
    'eslint-plugin-jsx-a11y',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'eslint-plugin-security',
    'eslint-plugin-simple-import-sort',
    'globals',
  ],
});
