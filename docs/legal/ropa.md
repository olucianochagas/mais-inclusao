# ROPA — Registro de Operações de Tratamento de Dados Pessoais

> **Documento exigido pelo Art. 37 da LGPD (Lei 13.709/2018).** Mantido por **operador (+Inclusão SaaS)** e estendido por **cada controlador (tenant)** ao operacionalizar a plataforma. Este arquivo é o **template canônico das operações** que o +Inclusão executa em nome dos controladores. Tenants instanciam suas próprias finalidades específicas em documento privado (não-versionado neste repo).

---

## Sumário

- [Identificação](#identificação)
- [Como ler este documento](#como-ler-este-documento)
- [Operações de tratamento](#operações-de-tratamento)
- [Transferências internacionais](#transferências-internacionais)
- [Sub-operadores](#sub-operadores)
- [Medidas de segurança](#medidas-de-segurança)
- [Atualização e governança deste ROPA](#atualização-e-governança-deste-ropa)

---

## Identificação

| Campo                                      | Valor                                                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Operador (LGPD Art. 5º X)**              | Luciano Douglas Machado Chagas (mantenedor; provisório enquanto não houver entidade jurídica)        |
| **Encarregado de proteção de dados (DPO)** | A designar quando o produto entrar em operação real                                                  |
| **Canal de contato do operador**           | olucianochagas@gmail.com com assunto `[LGPD]` (provisório) → lgpd@mais-inclusao.org _(a configurar)_ |
| **Controladores (LGPD Art. 5º VI)**        | Cada tenant (município, secretaria, ONG, consórcio) instanciado na plataforma                        |
| **Titulares (LGPD Art. 5º V)**             | Cidadãos atendidos por programas sociais via tenants                                                 |
| **Versão deste ROPA**                      | 0.1 (template inicial — sem operação real ainda)                                                     |
| **Última revisão**                         | 2026-05-16                                                                                           |
| **Próxima revisão obrigatória**            | 2027-05-16 ou em mudança material de tratamento                                                      |

---

## Como ler este documento

Cada **operação de tratamento** abaixo descreve uma atividade discreta que o +Inclusão executa com dados pessoais em nome de um controlador. Cada operação tem os campos exigidos pelo Art. 37 da LGPD:

| Campo                           | O que registra                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Finalidade**                  | Para que o dado é tratado                                                                                       |
| **Base legal**                  | Art. 7º (dados comuns) ou Art. 11 (sensíveis) da LGPD                                                           |
| **Categorias de titulares**     | Quem são as pessoas cujos dados são tratados                                                                    |
| **Categorias de dados**         | Que dados, com classificação L0/L1/L2/L3 (ver [SECURITY.md](../../SECURITY.md#classificação-de-dados-4-níveis)) |
| **Categorias de destinatários** | Quem recebe (sub-operadores, controladores, terceiros)                                                          |
| **Prazo de retenção**           | Quanto tempo o dado permanece                                                                                   |
| **Medidas de segurança**        | Salvaguardas técnicas e organizacionais                                                                         |
| **Transferência internacional** | Se aplicável                                                                                                    |
| **Onda**                        | Quando a operação entra em produção                                                                             |

> ⚠️ Operações marcadas como **Onda 2/3** ainda não estão implementadas. Estão listadas aqui para que tenants e revisores entendam o que virá. Quando entrarem em operação, esta seção é atualizada e os campos completados.

---

## Operações de tratamento

### OP-001 — Cadastro de cidadão pelo gestor

- **Finalidade**: Permitir ao servidor público registrar cidadão atendido para acessar programas sociais.
- **Base legal**: **Art. 7º, III** — execução de políticas públicas previstas em leis e regulamentos pelo controlador (tenant).
- **Categorias de titulares**: Cidadãos em situação de vulnerabilidade social atendidos pelo tenant.
- **Categorias de dados**:
  - L2 (PII): CPF, nome civil, nome social, data de nascimento, contato (telefone, e-mail), endereço.
  - L1 (Interno): vinculação ao tenant, papel do servidor que cadastrou, timestamps.
- **Categorias de destinatários**: Gestores autenticados do mesmo tenant; sub-operadores listados em [subprocessors.md](./subprocessors.md).
- **Prazo de retenção**: Enquanto houver vínculo ativo com o tenant; após desligamento do tenant ou inatividade > 5 anos, anonimização preservando estatísticas agregadas.
- **Medidas de segurança**: Criptografia em coluna (AES-256-GCM, KEK por tenant); RBAC por tenant; audit de todo acesso a PII; multi-tenant isolation em 6 camadas; sem PII em logs.
- **Transferência internacional**: Não, salvo se o tenant optar por sub-operador internacional (declarado no DPA do tenant).
- **Onda**: 1 (MVP).

### OP-002 — Autocadastro do cidadão (portal)

- **Finalidade**: Permitir ao cidadão criar conta no portal e fornecer seus próprios dados para se candidatar a programas.
- **Base legal**:
  - Dados comuns: **Art. 7º, I** — consentimento livre, informado e inequívoco.
  - Dados sensíveis (raça, gênero, deficiência, orientação sexual, etc.): **Art. 11, II, "a"** — consentimento específico e destacado.
- **Categorias de titulares**: Cidadãos com capacidade de uso do portal (ou representantes legais).
- **Categorias de dados**:
  - L2 (PII): mesmos do OP-001.
  - **L3 (sensíveis)**: deficiência, raça/etnia, gênero, orientação sexual, religião (apenas se autodeclarados e consentidos individualmente).
- **Categorias de destinatários**: Tenant escolhido pelo cidadão na inscrição; sub-operadores.
- **Prazo de retenção**: Enquanto vínculo ativo + 5 anos após inatividade. Cidadão pode solicitar exclusão (Art. 18 LGPD) a qualquer momento.
- **Medidas de segurança**: Idem OP-001 + aceites granulares por finalidade (Consent service, Onda 2); revogação de consentimento ativa; CAPTCHA no cadastro; rate limit por IP + CPF.
- **Transferência internacional**: Não.
- **Onda**: 1 (cadastro básico); **2** (direitos LGPD operacionalizados + Gov.br como IdP plugável).

### OP-003 — Inscrição em programa social

- **Finalidade**: Vincular cidadão a um programa específico do tenant, gerando candidatura para avaliação.
- **Base legal**: **Art. 7º, III** — execução de política pública.
- **Categorias de titulares**: Cidadãos previamente cadastrados.
- **Categorias de dados**:
  - L1: program_id, citizen_id, canal de origem (cidadão / gestor / ETL), status da candidatura, proveniência.
  - L2 referenciado por id (não duplicado).
- **Categorias de destinatários**: Gestores do tenant para triagem; cidadão tem acesso à sua candidatura via portal.
- **Prazo de retenção**: 10 anos após decisão final (auditoria de política pública).
- **Medidas de segurança**: Estado-máquina auditável (estados: DRAFT, SUBMITTED, IN_TRIAGE, APPROVED, REJECTED, GRANTED, DENIED); evento `application.*` registrado com correlation_id.
- **Transferência internacional**: Não.
- **Onda**: 1.

### OP-004 — Triagem e concessão de benefício

- **Finalidade**: Avaliar elegibilidade do cidadão segundo critérios do programa e conceder ou negar benefício.
- **Base legal**: **Art. 7º, III** — execução de política pública.
- **Categorias de titulares**: Cidadãos com candidatura submetida.
- **Categorias de dados**:
  - L1: decisão de triagem, justificativa (texto livre — sem PII desnecessária), avaliador, timestamps.
  - L2/L3 lidos para avaliar elegibilidade — **acessos auditados**.
- **Categorias de destinatários**: Cidadão (vê resultado de sua candidatura); gestores do tenant; sub-operadores de notificação (Onda 2).
- **Prazo de retenção**: 10 anos após concessão final (mesma justificativa de OP-003).
- **Medidas de segurança**: Audit trail completo (qual servidor viu quais dados); JSONB para regras de elegibilidade permitindo replay determinístico; assinatura de decisão (Onda 2).
- **Transferência internacional**: Não.
- **Onda**: 1.

### OP-005 — Entrega e comprovação de benefício (Onda 2)

- **Finalidade**: Operacionalizar a entrega do benefício concedido e capturar comprovação.
- **Base legal**: **Art. 7º, III** + **V** (execução de contrato em alguns casos — ex: serviços contratados via programa).
- **Categorias de titulares**: Cidadãos com Grant ativo.
- **Categorias de dados**:
  - L1: data de entrega, local, status (agendado/entregue/no-show).
  - L2: comprovante (foto, assinatura digital).
  - **L3** (eventualmente, se programa toca dado sensível — ex: kit de saúde): natureza do item entregue.
- **Categorias de destinatários**: Cidadão; gestor do tenant; operador de entrega (se houver sub-operador específico).
- **Prazo de retenção**: 5 anos após entrega; comprovantes (anexos) em storage com lifecycle automático.
- **Medidas de segurança**: AV scan em anexos; criptografia em repouso no Documents service; URLs temporárias (signed); audit de acesso.
- **Transferência internacional**: Não.
- **Onda**: 2.

### OP-006 — Comunicação operacional com cidadão (Onda 2)

- **Finalidade**: Notificar cidadão sobre status de candidatura, concessão, entrega, lembretes.
- **Base legal**: **Art. 7º, V** — execução de contrato (programa social) e **IX** — legítimo interesse para comunicação operacional.
- **Categorias de titulares**: Cidadãos com candidatura ou Grant ativo.
- **Categorias de dados**:
  - L2: telefone, e-mail, eventualmente push token.
  - L1: conteúdo da mensagem (template + parâmetros mínimos, sem PII desnecessária).
- **Categorias de destinatários**: Sub-operadores de mensageria (SMS, e-mail, WhatsApp, push) listados em [subprocessors.md](./subprocessors.md).
- **Prazo de retenção**: Logs de envio: 5 anos (auditoria). Conteúdo das mensagens: 12 meses (rotacionado).
- **Medidas de segurança**: Opt-out registrado e respeitado por canal; templates auditáveis; throttle por canal.
- **Transferência internacional**: Possível (provedores SaaS estrangeiros como Twilio, SendGrid se selecionados pelo tenant) — registrado no DPA do tenant.
- **Onda**: 2.

### OP-007 — Indicadores e analytics agregados (Onda 3)

- **Finalidade**: Produzir relatórios e indicadores de cobertura, desigualdades, séries históricas — para governança baseada em evidências.
- **Base legal**: Após **anonimização efetiva**, dados deixam de ser pessoais (LGPD Art. 12) — não há base legal exigida.
- **Categorias de titulares**: Cidadãos atendidos (origem). Após anonimização, não há mais titulares identificáveis.
- **Categorias de dados**:
  - Originais L2/L3 são **anonimizados** via pseudonimização determinística com pepper separado, agrupamento estatístico, k-anonimato (k ≥ 5) e diferencial privacy onde aplicável.
- **Categorias de destinatários**: Gestores do tenant; gestores autorizados de tenants conveniados; publicação Open Data (Onda 4+) exigirá revisão adicional.
- **Prazo de retenção**: Indefinido (dados não-pessoais).
- **Medidas de segurança**: Auditoria de re-identificação anual; revisão de threshold k; logs de queries analíticas; isolamento de tabelas `analytics_*` de tabelas operacionais.
- **Transferência internacional**: Possível (cloud provider) — declarado.
- **Onda**: 3.

### OP-008 — Auditoria interna e investigação de incidente

- **Finalidade**: Registrar acessos a PII, mudanças sensíveis de estado e investigar incidentes de segurança/conduta.
- **Base legal**: **Art. 7º, IX** — legítimo interesse do controlador para garantir direitos do titular e prevenir fraude/incidente.
- **Categorias de titulares**: Cidadãos (cujos dados são acessados); gestores (cujas ações são auditadas).
- **Categorias de dados**:
  - L1: actor_user_id, actor_tenant_id, action, resource_id, timestamp, ip (mascarado), user_agent.
  - L2 referenciado: NÃO armazenamos os valores acessados, apenas a referência (id).
- **Categorias de destinatários**: Operador (DPO + segurança); controlador (mediante pedido formal); ANPD em caso de incidente.
- **Prazo de retenção**: 7 anos (auditoria fiscal e regulatória).
- **Medidas de segurança**: Append-only (sem update/delete); storage segregado (Audit service dedicado na Onda 3); export controlado.
- **Transferência internacional**: Não.
- **Onda**: 1 (capability transversal); **3** (serviço dedicado).

### OP-009 — Autenticação de gestor (RH/identidade interna)

- **Finalidade**: Identificar usuários gestores que operam a plataforma em nome de tenant.
- **Base legal**: **Art. 7º, V** — execução de contrato (vínculo entre tenant e operador).
- **Categorias de titulares**: Servidores e técnicos sociais que operam a plataforma.
- **Categorias de dados**:
  - L2: e-mail corporativo, nome, papel/cargo, tenant.
  - L1: hash de senha (argon2id), refresh tokens, sessões, logs de login.
- **Categorias de destinatários**: O próprio gestor; administrador do tenant; operador SaaS para suporte.
- **Prazo de retenção**: Enquanto usuário ativo; após desativação, 12 meses para auditoria, depois anonimização preservando logs de acesso.
- **Medidas de segurança**: Argon2id para senhas; JWT short-lived + refresh com rotation; sessões em Redis com TTL; MFA opcional (Onda 2).
- **Transferência internacional**: Não.
- **Onda**: 1.

### OP-010 — Autenticação cidadã (portal) (Onda 2)

- **Finalidade**: Identificar cidadão no portal para que ele acompanhe candidatura, exerça direitos LGPD, receba notificações.
- **Base legal**: **Art. 7º, V** — execução de contrato (uso do portal).
- **Categorias de titulares**: Cidadãos que se cadastram no portal.
- **Categorias de dados**:
  - L2: e-mail OU CPF, hash de senha, sessões.
  - Onda 2 com Gov.br: token federado, sem armazenamento de senha (delegada a Gov.br).
- **Categorias de destinatários**: O próprio cidadão.
- **Prazo de retenção**: Idem OP-009.
- **Medidas de segurança**: Idem OP-009 + sessão isolada da do gestor (cookie em path/domain distinto); rate limit agressivo.
- **Transferência internacional**: Não.
- **Onda**: 2.

---

## Transferências internacionais

> A regra geral é **não transferir** dados pessoais para fora do Brasil sem necessidade. Quando o tenant explicitamente optar por sub-operador internacional (ex: provedor de e-mail SaaS estrangeiro), a transferência é declarada no DPA do tenant e registrada nesta seção.

| Sub-operador           | País | Dados transferidos | Salvaguarda | Status |
| ---------------------- | ---- | ------------------ | ----------- | ------ |
| _(nenhum em operação)_ | —    | —                  | —           | —      |

Salvaguardas aceitas (LGPD Art. 33): cláusulas-padrão da ANPD, normas corporativas globais, certificações reconhecidas, ou consentimento específico e destacado do titular.

---

## Sub-operadores

A lista pública de sub-operadores está em [`subprocessors.md`](./subprocessors.md). Alteração de sub-operador exige:

- Notificação aos tenants com 30 dias de antecedência (cláusula do DPA).
- Atualização desta seção e do `subprocessors.md` no mesmo PR.
- Avaliação de impacto se o sub-operador trata dados sensíveis (L3).

---

## Medidas de segurança

Aplicadas a **todas** as operações:

- **Multi-tenant isolation em 6 camadas** (JWT claim → Guard → Repository → RLS Postgres → eventos com `tenant_id` → testes E2E + métrica `tenant_id_mismatch_total`).
- **Criptografia em coluna** (L2/L3) com KEK por tenant em KMS/Vault.
- **TLS 1.3** em toda comunicação.
- **mTLS interno** entre serviços (Onda 2).
- **Audit trail** de acessos a PII via Nest Interceptor + tabela `audit_log` local.
- **Logs sem PII** (filtro Pino com lista de campos sensíveis).
- **Rate limit** + WAF na frente do BFF Cidadão.
- **Política de retenção automatizada** por classe de dado (Onda 2).
- **Backup criptografado** com chave separada da KEK de PII.

Detalhamento em [SECURITY.md](../../SECURITY.md) e na [spec Seção 5](../superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md#seção-5--lgpd-multi-tenancy-segurança-e-acessibilidade).

---

## Atualização e governança deste ROPA

- **Imutável após release**: cada versão deste ROPA fica arquivada no histórico Git. Atualizações são PRs explícitos.
- **CI rule**: PRs que tocam código em paths relacionados a PII (`apps/citizens-service/**`, `packages/persistence/**`, etc.) requerem checkbox confirmando que este ROPA foi revisto.
- **Responsável pela manutenção**: DPO (a designar); provisoriamente @olucianochagas.
- **Revisão anual obrigatória** independente de mudanças.
- **Acionamento**:
  - Nova operação de tratamento → adicionar OP-NNN.
  - Mudança de finalidade, base legal, dados, retenção → atualizar OP existente + adicionar entrada no CHANGELOG.
  - Novo sub-operador → atualizar `subprocessors.md` + secção [Sub-operadores](#sub-operadores) + notificação aos tenants.

---

**Última atualização:** 2026-05-16
**Próxima revisão obrigatória:** 2027-05-16
