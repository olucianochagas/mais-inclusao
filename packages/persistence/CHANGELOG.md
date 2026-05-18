# @mais-inclusao/persistence

## 0.2.0

### Minor Changes

- ebb4611: Cria o primeiro núcleo de persistência multi-tenant: contexto de tenant via
  `AsyncLocalStorage`, erros públicos de isolamento e helpers para aplicar
  `tenant_id` em filtros antes dos repositories Prisma reais.
