# @mais-inclusao/persistence

Contexto de tenant e guardas de persistência do +Inclusão.

Esta primeira fatia não cria repositories Prisma. Ela entrega o núcleo que
todo repository futuro deve usar para não deixar isolamento multi-tenant
dependente de disciplina manual:

- `runWithTenantContext()` para popular `AsyncLocalStorage` por request/job.
- `getRequiredTenantContext()` para falhar alto sem tenant ativo.
- `scopeTenantWhere()` para injetar `tenant_id` em filtros de persistência.
- `assertTenantMatchesContext()` para bloquear tentativa cross-tenant explícita.

## Por que existe

O ADR-0005 define `tenant_id` como defesa central contra vazamento entre
organizações. Este package materializa a camada de aplicação: se uma operação
não tem tenant, ela falha; se tenta usar outro tenant, ela falha com erro
explícito e rastreável.

## Uso esperado em NestJS

```ts
import {
  runWithTenantContext,
  scopeTenantWhere,
} from '@mais-inclusao/persistence';

const result = runWithTenantContext(tenantClaim, () =>
  prisma.program.findMany({
    where: scopeTenantWhere({ status: 'active' }),
  }),
);
```

Em produção, o `tenantClaim` virá de um Guard global NestJS que valida JWT,
extrai `tenant_id`, `user_id` e `roles`, e executa o handler dentro do contexto.

## Erros públicos

| Erro                            | Quando ocorre                                   |
| ------------------------------- | ----------------------------------------------- |
| `MissingTenantContextError`     | Operação multi-tenant sem contexto ativo        |
| `CrossTenantAccessAttemptError` | Filtro explícito tenta acessar tenant diferente |

Esses erros devem gerar log estruturado e métrica de segurança quando usados
pelos serviços de domínio.

## Próximos passos

As próximas fatias deste package devem adicionar:

- `TenantAwareRepository` com adapter Prisma.
- integração com transações e `SET LOCAL app.current_tenant`.
- hooks para auditoria e métrica `tenant_id_mismatch_total`.
