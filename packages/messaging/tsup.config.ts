import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        backoff: 'src/backoff.ts',
        nats: 'src/nats.ts',
        outbox: 'src/outbox.ts',
        subject: 'src/subject.ts',
    },
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false,
    minify: false,
    target: 'es2023',
    external: ['nats'],
});
