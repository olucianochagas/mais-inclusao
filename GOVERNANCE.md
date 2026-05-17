# Governança do +Inclusão

> Este documento descreve como decisões são tomadas no projeto, quem as toma, e como a comunidade pode influenciá-las. **Transparência sobre poder é parte da promessa de governança que o produto tenta materializar para o setor público.**

---

## Sumário

- [Princípios](#princípios)
- [Modelo atual: BDFL transitório](#modelo-atual-bdfl-transitório)
- [Caminho de transição para community-driven](#caminho-de-transição-para-community-driven)
- [Papéis](#papéis)
- [Processo de decisão](#processo-de-decisão)
- [Processo de RFC](#processo-de-rfc)
- [Como se tornar mantenedor](#como-se-tornar-mantenedor)
- [Resolução de conflitos](#resolução-de-conflitos)
- [Transparência operacional](#transparência-operacional)
- [Revisão deste documento](#revisão-deste-documento)

---

## Princípios

1. **Transparência por padrão.** Decisões acontecem em espaços públicos (PRs, Issues, Discussions). Quando uma decisão precisa ser privada (segurança, conduta), o resultado é comunicado e a *razão* da privacidade é explicada.
2. **Argumento bate hierarquia.** Em qualquer discussão técnica, o argumento melhor justificado vence — independente de quem o trouxe.
3. **Reconhecer todo trabalho.** Código, design, docs, tradução, a11y testing, mentoria, evangelismo — todos têm peso de contribuição.
4. **Equidade no acesso ao poder.** O caminho para se tornar mantenedor é explícito, objetivo e baseado em mérito demonstrável — não em rede social.
5. **Privacidade dos contribuidores é inegociável.** Identidade civil, dados pessoais, conflitos privados — tudo protegido. Nome social e pronomes declarados são respeitados em todas as superfícies.
6. **A missão do produto orienta a governança.** Quando há trade-off entre velocidade e inclusão, escolhemos inclusão.

---

## Modelo atual: BDFL transitório

> **Status:** Maio de 2026. Projeto recém-iniciado com 1 mantenedor.

O modelo atual é **BDFL transitório**:

- **Luciano Douglas Machado Chagas** (@olucianochagas) é o **Benevolent Dictator** atual — autor do projeto, único mantenedor, tomador de decisão de última instância.
- "Transitório" porque este modelo **tem prazo de validade**: a meta declarada é evoluir para um **comitê de mantenedores** assim que houver pelo menos 3 contribuidores ativos qualificados (ver [Como se tornar mantenedor](#como-se-tornar-mantenedor)).
- Mesmo no modelo BDFL, decisões grandes (mudanças de contrato em `packages/contracts`, mudança de stack, mudança de licença, mudança neste documento de governança) **passam por RFC público**.

### Por que esse modelo?

Honestamente: é o único que funciona para 1 pessoa. Tentar montar comitê quando há 1 mantenedor é teatro. A escolha aqui é entre:

- **BDFL declarado** (este modelo): honesto sobre quem decide, com path de saída claro.
- **BDFL escondido** (modelo "consenso" com 1 pessoa): dá ilusão de coletivo mas a decisão é a mesma — pior em transparência.

Escolhemos o primeiro.

### O que o BDFL pode fazer unilateralmente

- Aceitar / rejeitar PRs sem RFC, exceto os listados em [Processo de RFC](#processo-de-rfc).
- Aplicar Código de Conduta.
- Adicionar mantenedores (após cumprirem critérios).
- Decidir conflitos não resolvidos em discussão.
- Mudar este documento de governança via RFC público (sim, isso é meta — mas é necessário).

### O que o BDFL NÃO pode fazer

- Mudar a licença sem RFC e período de comentário público de 30 dias.
- Mudar contrato público em `packages/contracts` sem changeset + revisão.
- Banir contribuidor sem aplicar processo do Código de Conduta.
- Aceitar contribuição que viole DCO ou licença.
- Tomar decisão que vá contra o conteúdo deste documento sem antes alterá-lo via RFC.

---

## Caminho de transição para community-driven

### Marcos de evolução

| Marco | Critério | Mudança no modelo |
|---|---|---|
| **0 → BDFL transitório** | Início do projeto | Atual |
| **BDFL → Comitê** | 3+ mantenedores ativos | Decisões grandes passam de "BDFL decide" para "consenso ou maioria simples do comitê" |
| **Comitê → Conselho com áreas** | 5+ mantenedores ativos em áreas distintas | Decisões setoriais ficam com mantenedores de área; estratégicas com o conselho |
| **Conselho → Fundação / Org sem-fins** | Tração e operação real | Estrutura jurídica formal (ex: associação ou fundação) se justificar |

Cada transição é **proposta via RFC** e debatida publicamente antes de efetivada. Não há promessa de prazos.

### Sinais de que estamos prontos para transição

- Pelo menos N mantenedores ativos, geograficamente diversos.
- Procesos de revisão funcionando consistentemente sem BDFL no caminho crítico.
- Diversidade na origem dos contribuidores (não só "amigos do BDFL").
- Carga de manutenção ≥ capacidade de 1 pessoa.

---

## Papéis

### 👀 **Visitante / Usuário**

Lê o código, usa o produto. Sem responsabilidades.

### 💬 **Contribuidor**

Quem abre issues, PRs, discussions, ou contribui de outra forma (docs, design, a11y, mentoria). Reconhecido em `CONTRIBUTORS.md` (a criar) após primeira contribuição aceita.

### 🛠 **Mantenedor**

Tem permissão de:
- Revisar e aprovar PRs em sua área (`CODEOWNERS`).
- Mergear PRs aprovados (em sua área).
- Triar issues.
- Aplicar Código de Conduta.
- Votar em decisões do comitê (no futuro).

**Responsabilidades:**
- Best-effort de resposta a issues/PRs em sua área (objetivo: < 7 dias para primeira resposta).
- Manter qualidade técnica e ética do código em sua área.
- Mentorar contribuidores novos.
- Participar de decisões via RFC.

Lista atual em [MAINTAINERS.md](./MAINTAINERS.md).

### 👑 **BDFL (atual: @olucianochagas)**

Decisão de última instância enquanto o modelo BDFL transitório estiver em vigor.

### 🏛 **Comitê de mantenedores (futuro)**

Substituirá o BDFL quando os critérios de transição forem atingidos.

### 🧑‍🏫 **DPO (Data Protection Officer) — futuro**

Quando o produto começar a operar com dados reais, designaremos um DPO responsável por:
- Manutenção do ROPA.
- Resposta a pedidos de titulares (Art. 18 LGPD).
- Comunicação com ANPD.
- Cláusulas de operador em DPAs.

Provisoriamente, esse papel é acumulado pelo BDFL.

---

## Processo de decisão

### Decisões pequenas

PRs de bug fix, docs, melhoria pontual, atualização de dep, novo teste — **aprovação de 1 mantenedor é suficiente**. Não exige RFC nem discussão prévia.

### Decisões médias

PRs que adicionam feature, refactor de módulo, mudança de UX significativa — **aprovação de 1 mantenedor + discussão prévia em Issue** (preferível). Se a discussão prévia foi feita e aceita, PR direto está OK.

### Decisões grandes

Mudanças listadas em [Processo de RFC](#processo-de-rfc) — **passam por RFC formal**.

### Quórum (futuro, quando houver comitê)

- Decisões pequenas: 1 mantenedor.
- Decisões médias: 1 mantenedor (área) + 1 mantenedor de outra área.
- Decisões grandes (via RFC): maioria simples do comitê após período de discussão (≥ 14 dias) e período de objeção (≥ 7 dias após acordo).

---

## Processo de RFC

### Quando exigir RFC

Toda mudança que se enquadre em pelo menos uma destas:

- Mudança incompatível em `packages/contracts` (DTO público ou evento).
- Mudança de stack (substituir framework, banco, mensageria, bundler).
- Mudança de licença.
- Mudança neste documento ou no Código de Conduta.
- Adicionar / remover bounded context da arquitetura.
- Mudança de política LGPD ou de segurança.
- Mudança de processo de release.
- Adicionar/remover mantenedor.

### Como propor um RFC

1. **Abra issue** com label `rfc` e título `[RFC] Resumo da proposta`.
2. **Conteúdo mínimo:**
   - Motivação (problema concreto, não preferência estética).
   - Proposta detalhada.
   - Alternativas consideradas e rejeitadas, com razão.
   - Impacto (quem é afetado, breaking changes, path de migração).
   - Riscos.
3. **Período de discussão:** mínimo de 14 dias. Mais para temas complexos.
4. **Período de objeção:** após aparente consenso, 7 dias adicionais para objeções formais.
5. **Decisão:** BDFL (hoje) ou comitê (futuro) registra decisão final como comentário na issue, com justificativa.
6. **Implementação:** PR referencia a RFC; merge requer aprovação conforme o nível da mudança.
7. **Registro perene:** RFCs aprovados viram ADR (Architecture Decision Record) em `docs/adr/`.

### Quem pode propor RFC

Qualquer pessoa.

---

## Como se tornar mantenedor

Não há "tempo de espera" mecânico — é qualitativo. Os critérios são:

1. **Contribuição substancial e consistente** ao longo de pelo menos 3 meses. "Substancial" significa: múltiplas PRs aceitas em uma ou mais áreas, ou trabalho equivalente em docs/design/a11y/tradução.
2. **Demonstração de cuidado** com qualidade técnica, ética, acessibilidade, privacidade — não só com "ship feature".
3. **Boa convivência** com a comunidade (sem violações de CoC, postura colaborativa em PRs).
4. **Endossamento por mantenedor existente** (no início, pelo BDFL).
5. **Aceite explícito** do candidato quanto às responsabilidades.

O processo é:

1. Mantenedor existente abre PR adicionando a pessoa em `MAINTAINERS.md` e `.github/CODEOWNERS` para sua área.
2. PR aberto por **mínimo 7 dias** para comentários da comunidade.
3. Sem objeção fundamentada → merge. Com objeção fundamentada → discussão e decisão do BDFL/comitê.

### Áreas previstas (à medida que crescemos)

- **Backend / NestJS** — auth, programs, citizens, applications, BFFs
- **Frontend / MF** — shell, gestor-mf, cidadao-mf, design system
- **Infra & DevOps** — Docker, K8s, IaC, CI
- **Segurança & LGPD** — políticas, ROPA, criptografia, RLS
- **Acessibilidade & UX inclusivo** — WCAG, leitores de tela, linguagem cidadã, VLibras
- **Documentação & Comunidade** — README, guias, traduções, evangelismo

### Saída de mantenedor

- Voluntária a qualquer momento (PR removendo de MAINTAINERS).
- Por inatividade (sem revisões ou contribuições em 6 meses) — após contato amigável; passa a "emérito" (reconhecido em CONTRIBUTORS), pode voltar.
- Por violação grave de CoC — após processo do [Código de Conduta](./CODE-OF-CONDUCT.md).

---

## Resolução de conflitos

### Conflitos técnicos

1. Discussão pública na issue/PR, sustentada por argumentos.
2. Se travar, peça opinião de outro mantenedor (ou da comunidade via discussion).
3. Persistindo, abra RFC para forçar decisão estruturada.
4. Última instância: BDFL decide com justificativa registrada.

### Conflitos interpessoais

Aplicar o processo de [Código de Conduta](./CODE-OF-CONDUCT.md). Mantenedor envolvido **não** participa da decisão.

### Conflito de interesse

Mantenedor que tem interesse pessoal/comercial em uma decisão deve declarar e abster-se. Exemplo: mantenedor que trabalha para fornecedor de KMS não decide sobre escolha de KMS.

---

## Transparência operacional

- **Todas as decisões técnicas** ficam registradas em PRs/Issues públicos. Discussions são para conversa exploratória.
- **Decisões privadas** (segurança, conduta) têm o **resultado** comunicado publicamente quando seguro, e a **razão** da privacidade explicada.
- **Reuniões síncronas**, quando existirem, terão **resumo escrito** público (em Discussion ou em `docs/community/meetings/`).
- **Roadmap** vive em `docs/superpowers/specs/` e em milestones/projects do GitHub.
- **Métricas operacionais** (tempo de primeira resposta, PRs abertos, issues por área) — futuro: dashboard público.

---

## Revisão deste documento

Este documento é revisto:

- **Anualmente** (revisão obrigatória, mesmo sem mudanças).
- **Sob demanda** quando o modelo de governança muda (transição BDFL → comitê, etc.) — sempre via RFC.

Sugestões à governança são bem-vindas — abra issue com label `governance`.

---

**Última atualização:** 2026-05-16
**Próxima revisão obrigatória:** 2027-05-16
