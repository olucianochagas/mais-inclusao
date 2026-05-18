# @mais-inclusao/observability

Base compartilhada de observabilidade do monorepo +Inclusão.

## O que este pacote entrega

- Logger Pino com redaction de campos sensíveis por padrão.
- Helpers de correlação com `correlation_id`.
- Preset inicial para OpenTelemetry em Node.js.

## Princípios

- Logs nunca devem conter PII por padrão.
- `correlation_id` deve ser propagado em toda a trilha de requisição.
- O pacote deve ser framework-agnóstico para servir NestJS, BFFs e serviços de infraestrutura.

## API pública

- `createCorrelationId`
- `normalizeCorrelationId`
- `buildLoggerOptions`
- `createLogger`
- `withLogContext`
- `buildOpenTelemetryEnvironment`
- `bootstrapOpenTelemetry`
- `shutdownOpenTelemetry`

## Uso sugerido

1. Criar o logger base no bootstrap do serviço.
2. Adicionar `correlation_id` e `tenant_id` no contexto da request.
3. Aplicar o preset OTel na inicialização do processo.

## Observações

- Exporters, dashboards e instrumentações por framework ficam para fases posteriores.
- O pacote foi desenhado para permanecer pequeno e previsível na primeira entrega.
