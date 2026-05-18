# Infra dev local

Ambiente Docker para a infraestrutura compartilhada da Onda 1 do
**+Inclusão**. Esta fatia sobe apenas dependências de runtime; containers dos
apps NestJS e Rspack serão adicionados quando cada app existir no monorepo.

## Comandos

```bash
pnpm infra:up
pnpm infra:logs
pnpm infra:down
pnpm infra:reset
```

## Serviços

| Serviço  | Porta padrão | Uso                                       |
| -------- | ------------ | ----------------------------------------- |
| Postgres | `5432`       | Bancos dos serviços de domínio            |
| Redis    | `6379`       | Sessões, rate limit, cache e locks        |
| NATS     | `4222`       | Eventos internos com JetStream            |
| NATS UI  | `8222`       | Endpoint HTTP de monitoramento            |
| MailHog  | `1025/8025`  | SMTP fake e UI para e-mails locais        |
| Jaeger   | `16686`      | UI de traces OpenTelemetry                |
| OTLP     | `4317/4318`  | Recebimento de spans por gRPC e HTTP      |
| MinIO    | `9000/9001`  | S3 local para documentos em ondas futuras |
| Adminer  | `8080`       | Inspecao manual do Postgres durante dev   |

> ✅ O compose cria automaticamente o bucket MinIO padrão `mais-inclusao-documents`.
> Para mudar o nome, use `MINIO_BUCKET`.

## Bancos criados

O init script cria um banco por microsservico de dominio da Onda 1, mantendo
fronteiras fortes desde o desenvolvimento local:

```text
mais_inclusao_auth
mais_inclusao_programs
mais_inclusao_citizens
mais_inclusao_applications
```

Cada banco tambem recebe um schema com o nome do bounded context
(`auth`, `programs`, `citizens`, `applications`).

## Credenciais padrao (dev-only)

| Serviço  | Usuário         | Senha               |
| -------- | --------------- | ------------------- |
| Postgres | `mais_inclusao` | `mais_inclusao_dev` |
| MinIO    | `mais_inclusao` | `mais_inclusao_dev` |

> ⚠️ Apenas para desenvolvimento local. Nunca reutilizar em produção.

## Variaveis opcionais

Todos os valores tem defaults seguros para desenvolvimento local. Quando
necessario, sobrescreva com variaveis de ambiente antes de executar o compose:

```bash
POSTGRES_PORT=15432 pnpm infra:up
```

Variáveis suportadas:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`
- `REDIS_PORT`
- `NATS_PORT`, `NATS_MONITOR_PORT`
- `MAILHOG_SMTP_PORT`, `MAILHOG_UI_PORT`
- `JAEGER_UI_PORT`, `OTEL_GRPC_PORT`, `OTEL_HTTP_PORT`
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_API_PORT`, `MINIO_CONSOLE_PORT`
- `MINIO_BUCKET` (bucket inicial provisionado por `minio-init`)
- `ADMINER_PORT`

Senhas padrao desta fatia sao apenas para desenvolvimento local. Credenciais de
producao entram em secret manager e nunca em arquivos versionados.

## Avisos conhecidos

Redis pode emitir aviso sobre `vm.overcommit_memory` no host Linux. O container
continua funcional; para eliminar o aviso em ambiente local, ajuste o sysctl do
host conforme a recomendacao do proprio Redis:

```bash
sudo sysctl vm.overcommit_memory=1
```
