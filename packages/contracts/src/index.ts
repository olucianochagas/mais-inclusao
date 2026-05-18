// @mais-inclusao/contracts — re-export flat para consumers
// Tree-shake friendly graças a sideEffects: false no package.json.
// auth/* re-exports adicionados na Task 17 quando src/auth/index.ts existir.

export * from './shared/index.js';
