# ADR-0000: Template de Architecture Decision Record

- **Status:** template (não é uma decisão)
- **Data:** 2026-05-16
- **Decisores:** —
- **Tags:** meta, template

> Este arquivo é o **modelo** a copiar para criar novos ADRs. Não é uma decisão arquitetural.

---

## Contexto

Descreva as **forças** em jogo (técnicas, políticas, sociais, regulatórias) que motivam a necessidade de uma decisão. Que problema precisa ser resolvido? Quais restrições existem?

Algumas perguntas que ajudam:

- Qual é o cenário sem esta decisão?
- Quem é afetado?
- O que acontece se não decidirmos?

## Decisão

A escolha feita, expressa de forma **afirmativa e curta**:

> "Vamos usar X para resolver Y, configurado com Z."

Detalhe os elementos essenciais. Sem subjetividade.

## Consequências

### Positivas

- Liste benefícios concretos.
- Use bullets.

### Negativas

- Custos, dívida técnica que isto cria.
- Riscos a monitorar.

### Neutras

- Mudanças que não são bem positivas nem negativas, mas que precisam ser entendidas.

## Alternativas consideradas

### Alternativa A — Nome curto

**Resumo**: descrição.

**Por que rejeitada**: razão concreta.

### Alternativa B — Nome curto

**Resumo**: descrição.

**Por que rejeitada**: razão concreta.

## Referências

- [Spec de decomposição §X](../superpowers/specs/2026-05-16-programa-mais-inclusao-decomposicao.md)
- [Issue / discussion](https://github.com/...)
- Leitura externa (artigos, livros, RFCs)

---

## Notas para quem usa o template

1. **Renomeie o arquivo** para `NNNN-titulo-kebab-case.md` (próximo número disponível, sem buracos).
2. **Status inicial**: `proposed`. Muda para `accepted` no merge da PR.
3. **Decisores**: liste GitHub handles de quem decidiu.
4. **Tags** ajudam a filtrar — exemplos: `backend`, `frontend`, `security`, `lgpd`, `a11y`, `governance`, `tooling`.
5. **Não edite ADRs aceitos**. Mudou? Crie ADR novo com `Superseded by ADR-NNNN` no antigo.
6. **Atualize o índice** em [`README.md`](./README.md) na mesma PR.
