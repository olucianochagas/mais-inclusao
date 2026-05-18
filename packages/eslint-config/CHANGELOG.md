# @mais-inclusao/eslint-config

## 0.2.0

### Minor Changes

- a266ba0: **Fundação 1 (Onda 1) — primeira release dos pacotes de tooling e contratos.**

  ### `@mais-inclusao/tsconfig`
  - 5 variantes: `base`, `nest`, `react`, `lib`, `test`.
  - Modo strict completo (`noUncheckedIndexedAccess`, `isolatedModules`, `verbatimModuleSyntax`).
  - README com tabela de uso por tipo de projeto.

  ### `@mais-inclusao/eslint-config`
  - 4 presets ESM em TypeScript: base, `nest`, `react`, `lib`.
  - ESLint 9 flat config + typescript-eslint v8 strict.
  - Plugins: `import`, `security`, `simple-import-sort`, `jsx-a11y` (no preset `react`).
  - README com governança de rules.

  ### `@mais-inclusao/contracts`
  - **shared/**: `EventEnvelope` (NATS), `TenantId` (branded), IDs branded (`User`/`Program`/`Citizen`/`Application`), Pagination (cursor-based, limit max 100), ProblemDetails (RFC 9457).
  - **auth/**: 4 eventos thin (`tenant.created`/`deactivated`, `user.created`/`deactivated`) + 5 DTOs HTTP (`Login` request/response, `Refresh` request/response, `Me` response).
  - Build dual ESM + CJS + DTS (tsup + tsc).
  - 128 testes (Vitest), 100% coverage, snapshots JSON Schema como golden master.
  - README com status por contexto, scripts e princípios não-negociáveis (eventos thin, `tenant_id` obrigatório, sem PII em eventos, SemVer rigoroso).
