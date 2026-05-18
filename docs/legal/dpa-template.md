# Template de Acordo de Processamento de Dados (DPA)

> **Este é um template** para o Acordo de Processamento de Dados (Data Processing Agreement, ou Acordo de Operação de Tratamento na nomenclatura LGPD) entre **o controlador (tenant)** e **o operador (+Inclusão SaaS)**.
>
> ⚠️ **Aviso legal:** Este template é fornecido como referência. Antes de assinar um DPA real, **consulte advogado especializado em LGPD**. O texto abaixo cobre boa prática mas não substitui revisão jurídica para o seu caso específico.

---

## Identificação das partes

**CONTROLADOR**:

- Razão social / nome do órgão: **\*\***\_\_\_**\*\***
- CNPJ: **\*\***\_\_\_**\*\***
- Endereço: **\*\***\_\_\_**\*\***
- Representante legal: **\*\***\_\_\_**\*\***
- Encarregado de proteção de dados (DPO): **\*\***\_\_\_**\*\***
- Contato para questões de privacidade: **\*\***\_\_\_**\*\***

**OPERADOR**:

- Razão social: **\*\*\*\***\_**\*\*\*\*** (atualmente: Luciano Douglas Machado Chagas, pessoa física, enquanto não constituída entidade jurídica para o +Inclusão)
- CNPJ / CPF: **\*\***\_\_\_**\*\***
- Endereço: **\*\***\_\_\_**\*\***
- DPO: **\*\***\_\_\_**\*\***
- Contato: lgpd@mais-inclusao.org _(a configurar)_ — provisório: olucianochagas@gmail.com

---

## 1. Objeto

Este Acordo regula o tratamento de dados pessoais que o **OPERADOR** realiza em nome do **CONTROLADOR** por meio do serviço **+Inclusão (mais-inclusao)**, conforme contrato principal celebrado entre as partes.

## 2. Definições

Para fins deste Acordo, aplicam-se as definições da **Lei nº 13.709/2018 (LGPD)**, com destaque para:

- **Dados pessoais**: informação relacionada a pessoa natural identificada ou identificável.
- **Dados pessoais sensíveis**: dados sobre origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato, dado referente à saúde ou à vida sexual, dado genético ou biométrico.
- **Tratamento**: toda operação realizada com dados pessoais.
- **Controlador, Operador, Titular, ANPD**: conforme Art. 5º da LGPD.

## 3. Finalidades autorizadas

O OPERADOR só pode tratar dados pessoais para as finalidades estritamente necessárias à prestação do serviço +Inclusão, conforme listado em [`ropa.md`](./ropa.md) — Registro de Operações de Tratamento. Qualquer tratamento fora dessas finalidades é **vedado**, salvo autorização escrita do CONTROLADOR.

## 4. Instruções do controlador

O OPERADOR processa dados pessoais **exclusivamente conforme instruções documentadas** do CONTROLADOR, materializadas:

- Pela configuração do tenant na plataforma.
- Pelas finalidades declaradas no ROPA.
- Por instruções escritas adicionais via canal oficial.

Se o OPERADOR considerar que uma instrução viola a LGPD, deve **comunicar imediatamente** o CONTROLADOR e abster-se até esclarecimento.

## 5. Sub-operadores

5.1. O CONTROLADOR autoriza o uso dos sub-operadores listados em [`subprocessors.md`](./subprocessors.md).

5.2. Alterações na lista de sub-operadores exigem **notificação prévia de 30 dias**.

5.3. O CONTROLADOR pode **objetar** a sub-operador específico em prazo de 15 dias após notificação; havendo objeção, o OPERADOR tem 60 dias para apresentar alternativa equivalente.

5.4. O OPERADOR é responsável pelos atos dos sub-operadores e deve estender a eles as obrigações deste Acordo.

## 6. Confidencialidade

O OPERADOR garante que todas as pessoas autorizadas a tratar dados pessoais estão sujeitas a obrigação de confidencialidade ou dever legal de confidencialidade.

## 7. Medidas de segurança

O OPERADOR adota medidas técnicas e organizacionais para proteger os dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Medidas mínimas implementadas:

- **Criptografia em repouso** (PII em coluna com KEK por tenant).
- **TLS 1.3** em todas as comunicações.
- **Controle de acesso** baseado em papéis (RBAC) com claim `tenant_id` em JWT.
- **Isolamento multi-tenant em 6 camadas** (ver SECURITY.md § 2).
- **Audit trail** de acessos a dados pessoais.
- **Backup criptografado** com chave separada.
- **Plano de resposta a incidentes** com notificação à ANPD em 72h (LGPD Art. 48).
- **Treinamento de pessoal autorizado** em LGPD e privacidade.

Detalhamento completo em [SECURITY.md](../../SECURITY.md) e na [spec § 5](../superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md#seção-5--lgpd-multi-tenancy-segurança-e-acessibilidade).

## 8. Notificação de incidente

8.1. O OPERADOR notifica o CONTROLADOR **em até 24 horas** após tomar conhecimento de incidente de segurança que envolva dados pessoais.

8.2. A notificação contém:

- Natureza e categoria do incidente.
- Categorias e número aproximado de titulares e registros afetados.
- Consequências prováveis.
- Medidas adotadas para mitigar e proteger.

  8.3. O CONTROLADOR é o responsável pela **comunicação à ANPD em 72h** (LGPD Art. 48), com apoio técnico do OPERADOR.

## 9. Direitos dos titulares

9.1. O OPERADOR auxilia o CONTROLADOR a responder a pedidos de titulares (Art. 18 LGPD) por meio de:

- **Acesso aos dados**: exportação em formato estruturado (Onda 2).
- **Correção**: edição via portal (Onda 2).
- **Anonimização / exclusão**: jobs automatizados (Onda 2).
- **Portabilidade**: exportação JSON em formato aberto (Onda 2).
- **Revogação de consentimento**: revogação granular por finalidade (Onda 2).

  9.2. O OPERADOR responde a pedidos do CONTROLADOR sobre titulares **em até 5 dias úteis**.

## 10. Transferência internacional

10.1. O OPERADOR **não transfere** dados pessoais para fora do Brasil sem autorização prévia do CONTROLADOR.

10.2. Quando o CONTROLADOR autorizar uso de sub-operador internacional, o OPERADOR garante salvaguardas conforme LGPD Art. 33 (cláusulas-padrão, normas corporativas globais, certificações reconhecidas).

## 11. Retenção e devolução

11.1. Os dados pessoais são retidos pelos prazos definidos em [`ropa.md`](./ropa.md), aplicáveis a cada operação.

11.2. Ao término do contrato principal:

- Em até **30 dias**, o OPERADOR oferece ao CONTROLADOR opção de **devolução** ou **destruição** dos dados.
- Cópias de backup são purgadas em até **90 dias**.
- Logs de auditoria são retidos por **7 anos** para conformidade fiscal/regulatória, segregados e cifrados.

## 12. Auditoria

12.1. O CONTROLADOR pode auditar a conformidade do OPERADOR com este Acordo, mediante notificação prévia de 15 dias úteis.

12.2. Frequência: até 1 auditoria a cada 12 meses (exceto em caso de incidente).

12.3. O OPERADOR fornece:

- Documentação técnica e operacional.
- Relatório de auditoria externa (quando disponível, a partir da Onda 3).
- Acesso a logs de auditoria filtrados pelo tenant.

## 13. Vigência

Este Acordo vigora durante o contrato principal e **sobrevive** quanto às obrigações de:

- Confidencialidade.
- Notificação de incidente sobre dados ainda retidos.
- Direito do titular sobre dados ainda em posse do OPERADOR.

## 14. Resolução de disputas

Disputas serão resolvidas conforme cláusulas do contrato principal, com prevalência da legislação brasileira e do foro escolhido pelas partes.

## 15. Disposições gerais

- Atualizações deste Acordo: notificação de 30 dias.
- Conflito com o contrato principal: prevalece este Acordo quanto à matéria de proteção de dados.
- Versionamento: cada versão fica registrada com data e hash; o CONTROLADOR aceita versão específica.

---

**Local e data:** **\*\***\_\_\_**\*\***

**Pelo CONTROLADOR:**

---

Nome, cargo, assinatura digital

**Pelo OPERADOR:**

---

Nome, cargo, assinatura digital

---

**Versão deste template:** 0.1 (rascunho — pendente revisão jurídica)
**Última atualização:** 2026-05-16
