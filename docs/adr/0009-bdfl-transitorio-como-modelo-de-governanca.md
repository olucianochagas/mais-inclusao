# ADR-0009: BDFL transitório como modelo inicial de governança

- **Status:** accepted
- **Data:** 2026-05-16
- **Decisores:** @olucianochagas
- **Tags:** governanca, comunidade

---

## Contexto

O +Inclusão é projeto open source de missão social. Em 2026-05-16, há **1 mantenedor único** (autor do projeto) sem comunidade externa ativa ainda. O projeto tem ambição de longo prazo e quer atrair contribuidores, mas precisa **declarar honestamente como decisões são tomadas hoje** e **como o modelo evoluirá**.

Considerando:

- **Tentar montar comitê com 1 pessoa é teatro** — gera ilusão de coletivo que minimiza accountability.
- **Não declarar modelo** deixa contribuidores no escuro sobre como propor mudanças, resolver disputas, virar mantenedor.
- **Decisões grandes** (mudança de stack, contratos, licença) precisam de processo, mesmo em modelo de 1 pessoa.
- **Equidade de acesso ao poder** é parte da missão — caminho para virar mantenedor deve ser objetivo, não baseado em rede social.

Modelos possíveis:

|                                  | BDFL transitório        | Comitê desde o dia 0           | Meritocracia "informal"   | Fundação formal |
| -------------------------------- | ----------------------- | ------------------------------ | ------------------------- | --------------- |
| Honestidade sobre quem decide    | **Sim**                 | Não (1 pessoa fingindo comitê) | Não (decisão opaca)       | Sim             |
| Velocidade de decisão            | Alta                    | Alta (com 1 pessoa)            | Variável                  | Baixa           |
| Atratividade para contribuidores | Média (depende do BDFL) | Baixa (parece fechada)         | Baixa (parece arbitrária) | Alta            |
| Custo administrativo             | Baixo                   | Baixo (fictício)               | Baixo                     | Alto            |
| Adequado a pre-alpha             | **Sim**                 | Não                            | Não                       | Não             |

## Decisão

**Adotar BDFL (Benevolent Dictator For Life) transitório como modelo de governança inicial, com path explícito de transição para comitê comunitário.**

### Componentes

1. **BDFL atual**: @olucianochagas — autor do projeto, único mantenedor.
2. **Decisões pequenas** (bug fix, docs, melhoria pontual): aprovação direta do BDFL.
3. **Decisões médias** (feature, refactor de módulo): preferível issue/discussion prévia.
4. **Decisões grandes**: passam por **RFC formal** (Request For Comments) com:
   - Issue com label `rfc`.
   - Período de discussão ≥ 14 dias.
   - Período de objeção ≥ 7 dias após acordo aparente.
   - Decisão final do BDFL **registrada com justificativa**.
   - Aprovação registra-se como **ADR** (este formato).
5. **O que o BDFL NÃO pode fazer unilateralmente**:
   - Mudar licença (requer RFC + 30 dias de comentário público).
   - Mudar contrato em `packages/contracts` sem Changeset + revisão.
   - Banir contribuidor sem aplicar processo do Código de Conduta.
   - Aceitar contribuição que viole DCO ou licença.
   - Tomar decisão que contrarie GOVERNANCE.md sem antes alterá-lo via RFC.

### Marcos de transição

| Marco                                  | Critério                                  | Mudança no modelo                                                                     |
| -------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| **0 → BDFL transitório**               | Início do projeto                         | Atual                                                                                 |
| **BDFL → Comitê**                      | 3+ mantenedores ativos                    | Decisões grandes passam de "BDFL decide" para "consenso ou maioria simples do comitê" |
| **Comitê → Conselho com áreas**        | 5+ mantenedores ativos em áreas distintas | Decisões setoriais ficam com mantenedores de área; estratégicas com o conselho        |
| **Conselho → Fundação / Org sem-fins** | Tração e operação real                    | Estrutura jurídica formal se justificar                                               |

Cada transição é **proposta via RFC** e debatida publicamente antes de efetivada.

### Critérios para virar mantenedor

Objetivos, não subjetivos:

1. Contribuição substancial e consistente ao longo de **≥ 3 meses** (múltiplas PRs aceitas em uma ou mais áreas, ou trabalho equivalente em docs/design/a11y/tradução).
2. Demonstração de cuidado com qualidade técnica, ética, acessibilidade, privacidade.
3. Boa convivência com a comunidade (sem violações de CoC).
4. Endossamento por mantenedor existente.
5. Aceite explícito do candidato.

Processo: PR adicionando a pessoa em `MAINTAINERS.md` e `.github/CODEOWNERS`. PR aberto por **≥ 7 dias** para comentários da comunidade. Sem objeção fundamentada → merge.

## Consequências

### Positivas

- **Honestidade pública** sobre quem decide. Contribuidores entendem o cenário e podem decidir engajar ou não com informação completa.
- **Velocidade de decisão** mantida (1 pessoa decide sem comitê fictício).
- **Path explícito de transição** evita o anti-padrão de BDFLs que nunca abrem mão. Quando 3+ mantenedores existirem, transição é compromisso registrado.
- **RFCs viram ADRs**: decisões grandes ficam imutavelmente registradas neste diretório.
- **Critérios objetivos para virar mantenedor** democratizam acesso. Sem clube fechado.
- **Limites explícitos do BDFL** (lista de "o que NÃO pode fazer unilateralmente") protege o projeto de captura unilateral.

### Negativas

- **Dependência crítica de 1 pessoa**: se @olucianochagas se afastar, projeto pode parar. Mitigação: documentação extensa, transição planejada, herança via `MAINTAINERS.md`.
- **Velocidade de transição depende de contribuidores qualificados** aparecerem — não está sob controle direto.
- **Risco de "benevolent dictator for life" virar autocrata** se BDFL não aplicar a si mesmo os limites. Mitigação: limites públicos + revisão pela comunidade.
- **Decisões pessoais do BDFL** podem refletir vieses inconscientes. Mitigação: RFC público com discussão antes de decisão.

### Neutras

- **Modelo Linux Kernel** (Linus) e **CPython** (até 2018) provaram que BDFL funciona quando o BDFL pratica o que prega. Modelo Python pós-Linus (Steering Council) mostra que transição é possível.

## Alternativas consideradas

### Alternativa A — Comitê desde o dia 0

**Resumo**: Estabelecer estrutura formal de comitê de mantenedores desde o início, mesmo com 1 pessoa.

**Por que rejeitada**:

- Teatro. Comitê de 1 pessoa é apenas BDFL com maquiagem.
- Pior em transparência (parece coletivo, mas não é).

### Alternativa B — Meritocracia "informal"

**Resumo**: Não declarar modelo; deixar fluir.

**Por que rejeitada**:

- Opacidade afasta contribuidores. Pessoas marginalizadas (público do projeto, lembremos) são especialmente prejudicadas por estruturas opacas.
- Sem critério objetivo para virar mantenedor, ascensão depende de "conhecer alguém" — anti-equidade.

### Alternativa C — Fundação formal (associação sem-fins-lucrativos)

**Resumo**: Constituir CNPJ desde o início, com estatuto, conselho, etc.

**Por que rejeitada**:

- Custo administrativo desproporcional para projeto pre-alpha.
- Estrutura formal é boa em fase posterior, quando há recursos para sustentar.
- Marca como marco de transição (Conselho → Fundação) — não como ponto de partida.

## Referências

- [GOVERNANCE.md](../../GOVERNANCE.md) — modelo de governança detalhado.
- [Spec de decomposição — Apêndice E (decisões revertidas)](../superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md#apêndice-e--decisões-revertidas-durante-o-brainstorming)
- [Eric S. Raymond, "Homesteading the Noosphere"](http://www.catb.org/~esr/writings/homesteading/homesteading/) — gift culture em open source.
- [Python — PEP 8016: The Steering Council Model](https://peps.python.org/pep-8016/)
- [Apache Software Foundation — How the ASF works](https://www.apache.org/foundation/how-it-works.html)
