---
'@mais-inclusao/persistence': minor
---

Cria o primeiro núcleo de persistência multi-tenant: contexto de tenant via
`AsyncLocalStorage`, erros públicos de isolamento e helpers para aplicar
`tenant_id` em filtros antes dos repositories Prisma reais.
