---
description: publicar
---

# Instrucoes

O usuario quer fazer deploy para producao. Use a skill `deploy` que contem toda a logica necessaria.

## Processo

1. **Leia a skill `deploy`** (`.agent/skills/deploy/SKILL.md`) e siga as instrucoes detalhadas
2. A skill cobre: primeiro deploy, atualizacoes, cenarios A/B/C/D, troubleshooting, e verificacoes pre-deploy

## REGRA DE OURO: Autonomia Total

**VOCE DEVE fazer tudo sozinho. NUNCA peca para o usuario executar comandos manualmente.**

Quando um comando for interativo (como `netlify init`), VOCE deve:
1. Executar o comando
2. Enviar os inputs necessarios para responder aos prompts
3. Continuar ate concluir

Se algo falhar, tente resolver. So peca ajuda ao usuario se realmente nao conseguir resolver sozinho.

## Ao Finalizar

Apos o deploy:

1. Informe que o site esta no ar
2. Forneca o link do site
3. **PARE COMPLETAMENTE E AGUARDE**

## IMPORTANTE: Regras de Comportamento

- Apos o deploy, PARE e aguarde instrucao do usuario
- NUNCA continue fazendo alteracoes automaticamente
- NUNCA rode outros workflows automaticamente
