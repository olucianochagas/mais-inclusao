# Lista de Sub-operadores — +Inclusão

> Esta lista pública identifica os **sub-operadores** que o +Inclusão emprega para tratar dados pessoais em nome dos controladores (tenants). Alterações exigem **notificação aos tenants com 30 dias de antecedência** (cláusula padrão do DPA).

---

## Definições

- **Operador**: o +Inclusão SaaS, conforme [LGPD Art. 5º X](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709.htm).
- **Sub-operador**: terceiro que trata dados em nome do operador (ex: cloud provider, KMS, e-mail provider).
- **Controlador**: cada tenant (secretaria, ONG, consórcio) que opera a plataforma.

---

## Sub-operadores em uso

> ⚠️ **Status:** O +Inclusão está em **pre-alpha** e ainda não opera com dados reais. Esta tabela está vazia até a Onda 1 entrar em operação. Quando entrar, será preenchida com:

```
| Sub-operador | Função | Categoria de dados | Localização | Certificações | Status |
|---|---|---|---|---|---|
```

Exemplos de campos a serem preenchidos:

- **Sub-operador**: nome jurídico + URL.
- **Função**: o que o sub-operador faz no fluxo (ex: "hospedagem de banco PostgreSQL", "envio de SMS").
- **Categoria de dados**: L0–L3 conforme [classificação](../../SECURITY.md#classificação-de-dados-4-níveis).
- **Localização**: país onde os dados são processados.
- **Certificações**: ISO 27001, SOC 2, ANPD-aderente, etc.
- **Status**: ativo / em avaliação / descontinuado.

---

## Sub-operadores previstos por onda

### Onda 1 (MVP) — infraestrutura mínima

Quando a Onda 1 entrar em operação, prováveis sub-operadores:

| Categoria                   | Função                                | Candidatos prováveis                                  | Notas                                                                    |
| --------------------------- | ------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| Cloud / Compute             | Hospedagem de containers              | A definir por tenant (cada cliente escolhe sua cloud) | Pode ser AWS, GCP, Azure ou cloud nacional (Locaweb, Magalu Cloud, etc.) |
| Banco gerenciado            | PostgreSQL 16                         | A definir                                             | Hospedagem na mesma cloud para minimizar latência                        |
| Cache                       | Redis 7                               | A definir                                             | Idem                                                                     |
| Mensageria                  | NATS JetStream                        | Self-hosted dentro da cloud do tenant                 | Não há SaaS NATS estabelecido                                            |
| Observabilidade             | Tempo / Jaeger + Grafana / Prometheus | Self-hosted ou Grafana Cloud                          | Decisão por tenant                                                       |
| KMS / chave de criptografia | KMS gerenciado                        | AWS KMS / GCP KMS / Azure Key Vault / HashiCorp Vault | Crítico: KEK por tenant                                                  |

### Onda 2

| Categoria           | Função                   | Candidatos prováveis                                                                                                                      |
| ------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Identidade cidadã   | Gov.br como IdP federado | [Gov.br Login (SerPro)](https://www.gov.br/governodigital/pt-br/conta-gov-br) — pertence ao Estado, não é sub-operador no sentido estrito |
| E-mail transacional | Notificações             | SendGrid / Mailgun / AWS SES / Brevo                                                                                                      |
| SMS                 | Notificações             | Twilio / Zenvia / Infobip                                                                                                                 |
| WhatsApp            | Notificações             | WhatsApp Business Cloud API (Meta) — alta consideração de privacidade                                                                     |
| Storage de anexos   | Documents service        | AWS S3 / GCP Storage / MinIO self-hosted                                                                                                  |
| AV scan             | Anexos                   | ClamAV self-hosted ou VirusTotal API                                                                                                      |

### Onda 3+

| Categoria           | Função                          | Candidatos prováveis                                                      |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| Search              | Indexação cross-context         | Meilisearch self-hosted / OpenSearch / Elastic Cloud                      |
| Pagamento           | Billing                         | Stripe / Iugu / Pagar.me — apenas dados do tenant pagante, não de cidadão |
| Bug bounty platform | Recompensas de segurança        | HackerOne / Bugcrowd                                                      |
| CDN                 | Estáticos do shell + remotes MF | CloudFront / Cloudflare / Fastly                                          |
| WAF                 | Proteção do BFF Cidadão         | Cloudflare / CloudFront WAF                                               |

---

## Processo de aceite de novo sub-operador

1. **Avaliação técnica** — fit funcional, performance, certificações de segurança.
2. **Avaliação de privacidade** — categoria de dados (L0–L3), localização, base legal de transferência internacional.
3. **Avaliação contratual** — DPA disponível, conformidade LGPD, cláusulas de subcontratação.
4. **Notificação aos tenants** — 30 dias de antecedência para objeção.
5. **Atualização desta lista** — em PR explícito, com link para o anúncio aos tenants.
6. **Atualização do [ROPA](./ropa.md)** — operação afetada recebe novo destinatário.

---

## Direito de objeção do controlador

Cada tenant (controlador) tem direito de **objetar** ao uso de sub-operador específico, conforme cláusulas do DPA. Em caso de objeção:

- O +Inclusão tem prazo de 60 dias para apresentar alternativa equivalente.
- Se não houver alternativa viável, o tenant pode encerrar o contrato sem multa, com restituição proporcional.

---

**Última atualização:** 2026-05-16

**Próxima revisão:** trimestral (ou em mudança material).
