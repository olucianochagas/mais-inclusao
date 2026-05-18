# ADR-0006: Criptografia de PII em coluna com KEK por tenant

- **Status:** accepted
- **Data:** 2026-05-16
- **Decisores:** @olucianochagas
- **Tags:** seguranca, lgpd, criptografia, fundacional

---

## Contexto

O +Inclusão trata **dados pessoais identificáveis (PII)** de cidadãos em situação de vulnerabilidade. A classificação de dados (ver [SECURITY.md](../../SECURITY.md#classificação-de-dados-4-níveis)) tem 4 níveis:

- **L0** Público — sem proteção adicional.
- **L1** Interno — TLS, log permitido com IDs redacted.
- **L2** PII — CPF, nome, contato, endereço. **Criptografia em coluna**, log PROIBIDO.
- **L3** PII altamente sensível (Art. 11 LGPD) — raça, gênero, deficiência, saúde, religião. Idem L2 + RBAC adicional + audit + revisão mensal.

Considerando:

- **Postgres TDE / encryption-at-rest no disco** protege contra roubo físico de disco, mas **não protege contra acesso ao banco vivo** (DBA, backup mal-tratado, dump SQL).
- **LGPD exige medidas técnicas adequadas** (Art. 46). Em caso de incidente, criptografia robusta é fator mitigante.
- **Multi-tenant**: se uma chave única protege todos tenants, comprometimento dela = vazamento de todos. Chave por tenant limita raio de explosão.
- **Busca por CPF/email** ainda precisa funcionar — não dá para criptografar e perder capacidade de query.

Opções de criptografia:

|                                 | Banco inteiro (TDE) | Coluna com chave única | **Coluna com KEK por tenant**          | Cliente-side (E2EE)                    |
| ------------------------------- | ------------------- | ---------------------- | -------------------------------------- | -------------------------------------- |
| Protege contra DBA comprometido | Não                 | Parcial                | **Sim (chave fora do banco)**          | Sim                                    |
| Raio de explosão se chave vaza  | Total               | Total                  | **Por tenant**                         | Por usuário (mas perde funcionalidade) |
| Performance de query            | Boa                 | Médio                  | Médio                                  | Ruim (sem queries no servidor)         |
| Busca por valor encriptado      | Direto              | Direto (mas inseguro)  | Hash determinístico em coluna paralela | Impossível                             |
| Complexidade operacional        | Baixa               | Média                  | Alta                                   | Muito alta                             |

## Decisão

**Adotar criptografia em coluna com hierarquia de chaves: KEK (Key Encryption Key) por tenant + DEK (Data Encryption Key) por linha.**

### Modelo concreto

1. **KEK por tenant** armazenada em KMS externo (AWS KMS / GCP KMS / HashiCorp Vault self-hosted) — nunca no banco da aplicação.
2. **DEK por linha** gerada via **HKDF** a partir da KEK + nonce do registro. DEK nunca persistida — derivada on-the-fly.
3. **Algoritmo**: **AES-256-GCM** (AEAD com autenticação integrada — previne tampering).
4. **Busca por CPF/e-mail**: coluna paralela com **hash determinístico HMAC-SHA256** + pepper global (não-tenant-specific, para permitir cross-tenant uniqueness check).
5. **Rotação de KEK**: anual. DEKs antigas continuam válidas (descrita pelo KMS via key version).
6. **Acesso à KEK**: serviço autentica no KMS via OIDC / IAM — sem credencial estática armazenada.
7. **Falha aberta vs fechada**: queries que dependem de criptografia falham se KMS indisponível (fail-closed).

### Aplicação

`packages/persistence` exporta:

- `@Encrypted()` decorator de campo Prisma — marcado como criptografado, automaticamente cifrado/decifrado pelo repository base.
- `@SearchableHash()` decorator para campos com hash determinístico (CPF, e-mail).
- `KmsProvider` interface plugável (AWS, GCP, Vault, dev-mode local).

## Consequências

### Positivas

- **Raio de explosão limitado por tenant** se KEK vaza: outros tenants permanecem cifrados.
- **DBA comprometido NÃO acessa PII**: chaves vivem fora do banco, em KMS com IAM separado.
- **Conformidade LGPD reforçada**: Art. 46 exige medidas técnicas adequadas. Criptografia em coluna com KMS é estado-da-arte para SaaS.
- **Auditável**: KMS registra cada decrypt request, com identificador de quem pediu. Audit trail cruzada com `audit_log` da aplicação fortalece evidência.
- **Hash determinístico permite busca** sem decifrar (CPF normalizado → HMAC-SHA256 com pepper).
- **Rotação anual** mantém criptografia atualizada sem migração massiva.

### Negativas

- **Latência adicional**: chamadas ao KMS adicionam ~20-50ms por operação. Para queries que precisam decifrar muitas linhas (relatório), pode ser significativo. Mitigação: cache de DEK por linha em memória da requisição.
- **Custo operacional do KMS**: AWS KMS / GCP KMS cobram por requisição. Em volume alto, vira custo perceptível.
- **Complexidade de migração**: rotear KEK exige re-criptografar todos os dados do tenant (ou cifragem em camadas para diferimento). Não trivial.
- **Falha do KMS = falha da aplicação**: dependência crítica. Mitigação: failover de KMS, cache local de DEKs autorizadas (TTL curto).
- **Backup precisa de chave separada**: backups são criptografados com chave distinta da KEK de PII — para que comprometimento de uma não comprometa a outra.

### Neutras

- **Dev local** usa `KmsProvider` mode `local` com chave em variável de ambiente (`.env.local`, no gitignore). Reproduz comportamento sem dependência de KMS real.
- **Performance é aceitável** para o domínio: latência humana de UI (gestor cadastrando cidadão) absorve 30ms sem perceptibilidade.

## Alternativas consideradas

### Alternativa A — TDE (Transparent Data Encryption) do PostgreSQL

**Resumo**: Criptografia transparente no nível de disco / tablespace.

**Por que rejeitada**:

- Não protege contra acesso ao banco vivo. DBA, dump SQL, ferramentas de debug — todos veem PII em claro.
- Insuficiente para LGPD em projeto sob auditoria.

### Alternativa B — pgcrypto com chave única em variável de ambiente

**Resumo**: Postgres `pgcrypto` com chave em config.

**Por que rejeitada**:

- Chave única para todos os tenants = raio de explosão total.
- Chave em env var ainda é gerenciada pela aplicação — sem KMS, sem rotação automática, sem audit.
- Para MVP sem tenant real, pode ser substituto temporário, mas o caminho para produção precisa ser KMS.

### Alternativa C — Cliente-side encryption (E2EE)

**Resumo**: Cidadão / gestor cifra antes de enviar, servidor armazena cifrado, decifra só no cliente.

**Por que rejeitada**:

- Servidor não consegue indexar, buscar, validar elegibilidade — quebra o produto.
- Recuperação de senha fica impossível sem comprometer o modelo.
- Operacionalmente inviável para o caso de uso (gestor precisa ver dados do cidadão para tomar decisões).

### Alternativa D — Postgres como cifrador (extensões como `pgsodium`)

**Resumo**: Cifragem dentro do próprio banco via extensões.

**Por que rejeitada**:

- Chave vive próxima do banco (em config Postgres) — DBA comprometido continua tendo acesso.
- Extensions terceiras nem sempre disponíveis em managed Postgres (RDS, Cloud SQL).
- Sem ganho sobre KMS externo.

## Referências

- [Spec de decomposição — Seção 5 (LGPD)](../superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md#seção-5--lgpd-multi-tenancy-segurança-e-acessibilidade)
- [LGPD Art. 46](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709.htm) — medidas técnicas e administrativas adequadas.
- [NIST SP 800-57 Part 1](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final) — recommendation for key management.
- [AWS KMS — Encryption at rest patterns](https://docs.aws.amazon.com/whitepapers/latest/efficient-encryption-aws-kms/efficient-encryption-aws-kms.html)
- [HashiCorp Vault — Transit secrets engine](https://developer.hashicorp.com/vault/docs/secrets/transit)
