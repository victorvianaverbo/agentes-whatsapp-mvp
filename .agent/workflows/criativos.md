---
description: criativos
---

# Instrucoes

O usuario quer gerar criativos estaticos (copy de anuncios) para rodar no Meta Ads.
Use a skill `andromeda` que contem toda a logica necessaria - matriz de diversidade
conceitual (hooks x angulos x formatos), regras de copy, estrutura de output e
checklist de diversidade obrigatorio.

## Processo

1. **Leia a skill `andromeda`** (`.agent/skills/andromeda/SKILL.md`) e siga as fases:
   - Fase 0: Briefing (confirma produto, dor, persona, cases)
   - Fase 1: Matriz de diversidade (selecionar 10-15 combinacoes hook x angulo x formato)
   - Fase 2: Geracao de copy por criativo
   - Fase 3: Output em `criativos/[lp-nome]/lote-YYYY-MM-DD.md`

2. Se o user nao especificou QUAL LP, pergunte. Hoje os produtos sao:
   - `lp-suporte-alunos` (Kairos Suporte)
   - `lp-operacao` (Kairos Operacao)

3. Se o user pediu "ambas" ou "todas", gere 1 lote por LP, em sequencia.

## REGRA DE OURO

**Diversidade semantica, nao cosmetica.** Cada criativo no lote precisa de hook +
angulo + formato visual genuinamente diferentes. O Andromeda agrupa ads similares
como uma so entidade - 15 variacoes cosmeticas viram 1 entidade.

## Ao Finalizar

1. Apresente o caminho do arquivo gerado
2. Mostre a tabela-indice resumida (1 linha por criativo)
3. Confirme que o checklist de diversidade passou
4. **PARE E AGUARDE** - nao gere o proximo lote automaticamente

## IMPORTANTE: Regras de Comportamento

- Apos entregar o lote, PARE e aguarde feedback do usuario
- NUNCA invente numeros ou cases que nao existem no produto
- NUNCA entregue lote com < 10 criativos
- NUNCA use em-dash (preferencia do user)
