# ADR-0007: WCAG 2.2 AA como Definition of Done para frontend

- **Status:** accepted
- **Data:** 2026-05-16
- **Decisores:** @olucianochagas
- **Tags:** acessibilidade, frontend, qualidade, fundacional

---

## Contexto

O +Inclusão tem missão social de **inclusão**. Entre os públicos atendidos estão **pessoas com deficiência visual, auditiva, motora, cognitiva** que dependem de tecnologia assistiva para acessar direitos e benefícios. Para essas pessoas, uma interface inacessível **não é um bug — é exclusão ativa**.

Considerando:

- A LBI (Lei Brasileira de Inclusão — Lei 13.146/2015) Art. 63 obriga acessibilidade em sites e portais.
- O eMAG (Modelo de Acessibilidade em Governo Eletrônico) é referência para sites públicos.
- WCAG 2.2 (publicado em 2023) é o padrão internacional vigente, com 50 success criteria em 3 níveis (A, AA, AAA).
- O custo de retrofitar acessibilidade em código existente é dramaticamente maior que construí-la desde o início (~10x).
- Acessibilidade frequentemente vira "vamos arrumar depois" — e depois nunca chega.

A pergunta concreta: **qual nível adotar, e como integrá-lo no fluxo de trabalho de forma que não seja um nice-to-have?**

## Decisão

**Adotar WCAG 2.2 nível AA como Definition of Done para toda superfície voltada ao usuário (gestor e cidadão), com práticas operacionais que tornem aprovação automática.**

### Definition of Done — toda feature de UI

Um PR de UI não é "pronto" sem:

- [ ] Contraste de cores AA (≥ 4.5:1 texto, ≥ 3:1 não-texto) — validado em build via script no CI.
- [ ] Todo controle interativo navegável por teclado (Tab/Shift+Tab/Enter/Space), sem armadilha.
- [ ] Foco visível (`:focus-visible` com outline 2px, contraste AA contra fundo).
- [ ] Inputs com label associada (`<label htmlFor>` ou `aria-labelledby`).
- [ ] Mensagens de erro com `aria-describedby` + `aria-live`.
- [ ] Headings hierárquicos (h1 → h2 → h3, sem pular para efeito visual).
- [ ] Imagens informativas com `alt` descritivo; decorativas com `alt=""`; ícones interativos com `aria-label`.
- [ ] `prefers-reduced-motion` respeitado.
- [ ] Teste automático `@axe-core/playwright` passou no E2E.
- [ ] Teste manual com pelo menos um leitor de tela (NVDA, VoiceOver, Orca) — ou label `needs-a11y-review` no PR.

### Práticas operacionais

1. **`packages/ui`**: cada componente exporta fixture com `@testing-library/jest-axe`. Adicionar componente sem fixture = PR bloqueado.
2. **CI**: `pnpm e2e` roda Playwright + `@axe-core/playwright` em fluxos críticos. Violação de A ou AA falha o build.
3. **Issues marcadas com label `a11y` têm SLA agressivo**: P0 = 24 horas, P1 = 1 semana.
4. **Teste manual com leitor de tela**: pelo menos 1 fluxo crítico do cidadão por release. Rotação entre devs.
5. **Linguagem cidadã**: Onda 2 prevê revisão editorial de todos os textos voltados ao cidadão por especialista em linguagem simples.
6. **VLibras + audiodescrição + acessibilidade cognitiva**: Ondas 2 e 3 (não Onda 1, mas a fundação técnica não impede).
7. **Auditoria externa anual** (Onda 3) com selo reconhecido (ABNT NBR 17225 / W3C).

### Por que AA e não AAA

- AAA é frequentemente inalcançável sem comprometer funcionalidade (exemplo: critério 1.4.6 exige contraste 7:1, difícil em muitos esquemas).
- AA é o padrão de mercado e o exigido pela maioria das regulamentações.
- Excelência em AA + práticas além-WCAG (Libras, audiodescrição, linguagem cidadã, design cognitivo) entregam mais que perseguir AAA mecanicamente.

## Consequências

### Positivas

- **Acessibilidade desde o nascimento do código**: reduz custo de retrofit em ~10x.
- **CI quebra builds inacessíveis**: contribuidores não conseguem mergear feature que regredu acessibilidade sem saber.
- **Cultura técnica forte**: a11y é critério de revisão, não polish opcional. Reflete o valor central do produto.
- **Conformidade legal**: LBI Art. 63, eMAG, Lei nº 14.341/2022 (acessibilidade em sites governamentais) — todas atendidas.
- **Marketing diferenciado**: para tenants enterprise (gov), poder declarar "WCAG 2.2 AA com auditoria externa" é vantagem competitiva real.
- **Inclusão na comunidade técnica**: pessoas com deficiência conseguem contribuir, pois a documentação é acessível.

### Negativas

- **Curva de aprendizado**: cada contribuidor precisa entender padrões a11y. Mitigação: checklists, componentes prontos em `packages/ui` (a11y embutida), exemplos em CONTRIBUTING.md.
- **Build mais lento**: `@axe-core/playwright` em E2E adiciona alguns minutos ao CI. Custo absorvível.
- **Pressão sobre design**: nem todo design "bonito" passa em AA (contraste, tamanho de alvo). Designers precisam trabalhar dentro de constraints — é boa restrição.
- **Componentes terceiros**: nem toda lib externa é acessível. Por isso `packages/ui` adota shadcn-style (copiamos componentes Radix) — controle total.

### Neutras

- **Acessibilidade é processo, não estado**: novos critérios WCAG saem, navegadores evoluem leitores de tela. Manter conformidade exige revisão contínua, refletida em SLA agressivo de bugs a11y.

## Alternativas consideradas

### Alternativa A — WCAG 2.1 AA (padrão mais antigo)

**Resumo**: WCAG 2.1 (2018) em vez de 2.2.

**Por que rejeitada**:

- 2.2 (2023) adiciona critérios importantes para mobile e cognição (target size, focus appearance, dragging movements).
- Sem custo adicional adotar a versão mais recente desde o início.

### Alternativa B — WCAG 2.2 AAA

**Resumo**: Nível máximo de conformidade.

**Por que rejeitada**:

- Muitos critérios AAA são impraticáveis (contraste 7:1 limita muito design).
- Custo desproporcional ao ganho marginal sobre AA.
- Caminho mais útil: AA + práticas além-WCAG (Libras, linguagem cidadã, design cognitivo).

### Alternativa C — Acessibilidade "best-effort", sem CI gate

**Resumo**: Diretriz de boa prática sem ferramenta de bloqueio.

**Por que rejeitada**:

- Sem CI gate, regressões silenciosas são certas — especialmente em equipe nova ou ritmo de feature pressionado.
- Compromisso público (esta ADR) exige enforcement real.

### Alternativa D — apenas eMAG, sem WCAG

**Resumo**: Aderir apenas ao padrão brasileiro de governo eletrônico.

**Por que rejeitada**:

- eMAG é baseado em WCAG e há dialeto inglês para internacionalização.
- WCAG é referência globalmente reconhecida, importante para auditoria externa e tenants internacionais (futuro).
- eMAG fica como complemento, não substituto.

## Referências

- [Spec de decomposição — Postura WCAG 2.2 AA Onda 1](../superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md#postura-de-acessibilidade--wcag-22-aa-onda-1)
- [WCAG 2.2 — W3C Recommendation](https://www.w3.org/TR/WCAG22/)
- [eMAG — Modelo de Acessibilidade em Governo Eletrônico](https://emag.governoeletronico.gov.br/)
- [Lei Brasileira de Inclusão — Lei 13.146/2015, Art. 63](https://www.planalto.gov.br/ccivil_03/_Ato2015-2018/2015/Lei/L13146.htm)
- [Lei nº 14.341/2022](https://www.planalto.gov.br/ccivil_03/_Ato2019-2022/2022/Lei/L14341.htm) — acessibilidade em sites governamentais.
- [The Cost of Poor Accessibility](https://www.deque.com/blog/the-cost-of-not-building-accessibility-in-from-the-start/) (Deque Systems).
