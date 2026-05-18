# Política de Segurança — +Inclusão

> Considerando que o +Inclusão trata dados de populações vulneráveis e dados sensíveis do **Art. 11 da LGPD**, a segurança da plataforma e a privacidade dos titulares são valores **inegociáveis**. Esta política descreve como reportar vulnerabilidades de maneira responsável, o que esperar de nós em resposta, e como protegemos quem reporta.

---

## Sumário

- [Versões suportadas](#versões-suportadas)
- [Escopo](#escopo)
- [O que reportar (e o que não)](#o-que-reportar-e-o-que-não)
- [Como reportar uma vulnerabilidade](#como-reportar-uma-vulnerabilidade)
- [Processo de resposta](#processo-de-resposta)
- [Safe harbor](#safe-harbor)
- [Hall of Fame](#hall-of-fame)
- [Programa de recompensa](#programa-de-recompensa)
- [Privacidade e LGPD](#privacidade-e-lgpd)
- [Política de divulgação coordenada](#política-de-divulgação-coordenada)

---

## Versões suportadas

O +Inclusão está em **pre-alpha**; ainda não há releases públicos. Quando releases começarem, esta seção declarará quais versões recebem patches de segurança.

| Versão                    | Suporte de segurança                   |
| ------------------------- | -------------------------------------- |
| `main` (atual, pre-alpha) | ✅ Best effort durante desenvolvimento |
| `<não há releases ainda>` | —                                      |

**Política futura** (a partir do primeiro release estável):

- Versão atual (`x.y`): suporte completo.
- Versão anterior (`x.(y-1)`): suporte por 6 meses após release de `x.y`.
- Versões anteriores: sem suporte de segurança (recomendação: atualizar).

---

## Escopo

### Em escopo (reporte)

- Código deste repositório (`github.com/olucianochagas/mais-inclusao`)
- Infraestrutura associada quando hospedada por instâncias oficiais (futuro)
- Dependências configuradas neste repositório (exemplo: configuração permissiva no `next.config`, dockerfile vulnerável, GitHub Action vulnerável, secret commitado por engano)

### Fora de escopo

- Vulnerabilidades em deployments de **tenants individuais** (cada órgão/ONG que hospedar a sua instância) — reportar diretamente ao tenant.
- Bugs sem implicação de segurança — abrir issue pública normal.
- Engenharia social, phishing, ataques físicos.
- Spam, abuso de produto, fraude de tenant (caminho específico — contate o tenant).
- Vulnerabilidades em produtos de terceiros (NestJS, React, Prisma, NATS, etc.) — reporte ao mantenedor do produto. Se houver impacto direto no +Inclusão devido à configuração, aí é em escopo.

---

## O que reportar (e o que não)

### ⚠️ Reporte de forma privada (este documento)

- Vulnerabilidades de injeção (SQL, command, template, etc.)
- Quebras de autenticação ou autorização
- Cross-tenant data leak (qualquer caminho que permita acessar dado de outro tenant)
- Exposição de PII em logs, traces, error pages, response bodies
- Exposição de chaves, tokens, secrets
- Vulnerabilidades XSS, CSRF, clickjacking
- SSRF, XXE, deserialization
- Quebra de criptografia (uso incorreto de KMS, fallback inseguro)
- Vulnerabilidades em dependências com exploit conhecido
- Quebras de RLS (Row Level Security), de TenantContext, de TenantAwareRepository
- Quebras de outbox que permitem duplicação ou perda de evento crítico
- Bypass de aceite de consentimento LGPD

### 🐛 Reporte como issue pública

- Bug funcional sem implicação de segurança (não há exploit conhecido, não há dado exposto)
- UX confusa
- Erro de digitação em documentação
- Sugestão de melhoria

> Em caso de dúvida, **reporte como privado**. Nós convertemos para pública se concluirmos que não é vulnerabilidade.

---

## Como reportar uma vulnerabilidade

### Canal preferencial: GitHub Security Advisories (privado)

1. Acesse: **https://github.com/olucianochagas/mais-inclusao/security/advisories/new**
2. Preencha:
   - Título objetivo (não incluir exploit em texto livre)
   - Descrição: o que é, qual o impacto, como reproduzir (passos numerados)
   - Severity sugerida (você estima; nós refinamos)
   - Versão/commit afetado
   - Proof-of-concept (se aplicável) — anexo cifrado ou link
   - Sua sugestão de correção (opcional, super bem-vinda)
3. Aguarde nossa resposta (ver [Processo de resposta](#processo-de-resposta)).

### Canal alternativo: e-mail

Se você não tem conta GitHub ou prefere e-mail, envie para:

- **security@mais-inclusao.org** _(a configurar; placeholder)_
- Enquanto este não estiver ativo: **olucianochagas@gmail.com** com assunto `[SECURITY]`

**Recomendamos cifrar e-mails sensíveis com GPG.** Chave pública será publicada em `docs/security/pgp-key.asc` na primeira Onda — até lá, use Security Advisories preferencialmente.

### Informações que ajudam (mas não são obrigatórias)

- Versão / commit SHA afetado
- Ambiente onde reproduziu (dev local, staging, prod hipotético)
- Cenário de exploração
- Privilégio necessário para explorar
- Impacto observado (vazamento, escalada, DoS, etc.)
- Sua avaliação de severidade

Não deixe de reportar por não saber tudo isso. **Reporte o que conseguiu.**

---

## Processo de resposta

| Etapa                                 | Prazo alvo                               | Quem                                               |
| ------------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| **Confirmação de recebimento**        | 48 horas úteis                           | Mantenedor                                         |
| **Avaliação inicial e classificação** | 7 dias                                   | Mantenedor                                         |
| **Investigação completa**             | 14-30 dias (depende da complexidade)     | Mantenedor + autor do relato (se quiser colaborar) |
| **Fix proposto**                      | Conforme severidade (ver tabela)         | Mantenedor                                         |
| **Validação do relator**              | Você confirma antes de divulgar          | Você                                               |
| **Disclosure coordenada**             | Após fix aplicado nas versões suportadas | Mantenedor + relator                               |

### Prazos de fix por severidade

| Severidade                  | Critério                                                        | Prazo para fix | Notificação proativa de tenants |
| --------------------------- | --------------------------------------------------------------- | -------------- | ------------------------------- |
| 🔴 **Crítico (CVSS 9.0+)**  | Cross-tenant leak, RCE, comprometimento total de auth           | 7 dias         | Sim, imediata                   |
| 🟠 **Alto (CVSS 7.0-8.9)**  | Bypass de RLS, exposição de PII em prod, escalada de privilégio | 30 dias        | Sim                             |
| 🟡 **Médio (CVSS 4.0-6.9)** | XSS estored, CSRF em ação destrutiva, leak de info não-PII      | 60 dias        | Não, mas anunciado              |
| 🟢 **Baixo (CVSS 0.1-3.9)** | Exposição de info técnica, missing security header              | 90 dias        | Não                             |

Severidades seguem [CVSS v3.1](https://www.first.org/cvss/) com ajustes contextuais (uma vuln que normalmente seria média pode subir para alta se envolver PII de menores, por exemplo).

---

## Safe harbor

Nós nos comprometemos a:

- **Não tomar ação legal contra você** se a pesquisa de segurança for conduzida de boa-fé e em conformidade com esta política.
- **Não relatar** sua atividade a autoridades, contanto que você siga estas diretrizes.
- **Trabalhar com você** para entender e resolver o problema rapidamente.
- **Atribuir** publicamente sua descoberta (se você quiser), no nosso [Hall of Fame](#hall-of-fame) e nas notas de release.

Para se qualificar para safe harbor, você precisa:

1. **Fazer um esforço de boa-fé** para evitar violação de privacidade, destruição de dados ou interrupção de serviço.
2. **Apenas interagir** com contas próprias ou com permissão explícita do titular.
3. **Não acessar, modificar ou exfiltrar** dados de cidadãos reais. Use dados sintéticos (seeds, fixtures).
4. **Notificar imediatamente** se você acidentalmente acessou ou viu dados de pessoas reais — e descartá-los sem reter.
5. **Não divulgar** publicamente a vulnerabilidade antes de coordenar conosco.
6. **Dar tempo razoável** para nós corrigirmos (ver tabela de prazos acima).

Se você seguir estas regras, **não vamos atrás de você**. Se houver dúvida sobre o que constitui "boa-fé", nos pergunte antes via canal privado.

---

## Hall of Fame

Pesquisadores que reportaram vulnerabilidades com responsabilidade serão listados publicamente (com seu consentimento) em `docs/security/hall-of-fame.md` (a criar). Você pode optar por:

- Nome completo
- Pseudônimo / handle
- Anônimo (apenas o registro da CVE, sem atribuição)

Esta lista honra quem ajudou a manter cidadãos seguros. Sem hierarquia de "mérito" — todo reporte recebido com responsabilidade entra.

---

## Programa de recompensa

**Atualmente, não.** O +Inclusão está em pre-alpha sem operação real, e não temos orçamento para bug bounty.

**Planejado para Onda 3:** programa de recompensa formal (provavelmente via HackerOne ou Bugcrowd), com escopos e payouts claros, quando o produto tiver tenants pagantes.

Até lá: nossa moeda é **gratidão pública**, atribuição, e o conforto de saber que você contribuiu para proteger pessoas que não teriam como se proteger sozinhas.

---

## Privacidade e LGPD

### Diferença crítica: vulnerabilidade vs. incidente real

Esta seção é **especialmente importante** para um produto sob LGPD.

| Situação                                                                                   | É vulnerabilidade técnica? | É incidente LGPD?                    |
| ------------------------------------------------------------------------------------------ | -------------------------- | ------------------------------------ |
| Você descobriu que `citizens-service` permite ler PII de outro tenant em ambiente de teste | ✅ Sim                     | ❌ Não (dados sintéticos)            |
| Você descobriu o mesmo, e há indício de que ocorreu com dados reais em prod                | ✅ Sim                     | ✅ **SIM — notificação ANPD em 72h** |
| Você descobriu que logs contêm CPF (dados sintéticos em dev)                               | ✅ Sim                     | ❌ Não                               |
| Você descobriu CPFs reais expostos em log de prod acessível externamente                   | ✅ Sim                     | ✅ **SIM — notificação ANPD em 72h** |

**Se houver suspeita de que dados reais de cidadãos foram expostos**:

1. **Não baixe** os dados além do mínimo absoluto para comprovar a exposição.
2. **Reporte imediatamente** via canal de segurança.
3. Mencione explicitamente: _"Há indício de exposição de dados reais — pode ser incidente LGPD."_
4. Nós ativamos o **playbook de incidente** (notificação à ANPD em 72h conforme Art. 48 LGPD, notificação aos titulares, comunicação aos tenants controladores).

### O que NÃO fazer

- **Não publique screenshot** com PII real, mesmo borrada — borragens podem ser revertidas.
- **Não use BurpSuite/OWASP ZAP contra produção** sem autorização explícita. Use ambiente local com `pnpm infra:up` + dados sintéticos.
- **Não busque ativamente** por dados de pessoas reais para "provar gravidade". O fato de a vulnerabilidade existir já é suficiente.

---

## Política de divulgação coordenada

Após o fix:

1. **Coordenamos com você** o momento da divulgação pública.
2. **Publicamos** um Security Advisory no GitHub com:
   - Descrição da vulnerabilidade
   - Versões afetadas
   - Mitigação para quem ainda usa versão vulnerável
   - Crédito ao relator (se consentido)
3. **CVE é solicitado** (via GitHub) para vulnerabilidades de severidade média ou superior.
4. **Tenants controladores** afetados são notificados antes da divulgação pública, conforme cláusulas do DPA.

Tipicamente publicamos **30 a 90 dias** após o fix estar disponível, dando tempo para usuários atualizarem.

---

## Reportar má conduta da comunidade (não vulnerabilidade)

Se você quer reportar **comportamento inadequado de pessoa da comunidade** (não código), use o processo em [CODE-OF-CONDUCT.md](./CODE-OF-CONDUCT.md#como-reportar). Canais diferentes, processos diferentes.

---

## Histórico de avisos publicados

Nenhum até o momento.

Quando publicarmos, ficará disponível em **https://github.com/olucianochagas/mais-inclusao/security/advisories**.

---

**Última atualização:** 2026-05-16

**Obrigado por nos ajudar a manter o +Inclusão e seus usuários seguros.**
