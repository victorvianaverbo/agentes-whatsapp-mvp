---
description: visualizar-local
---

# Instrucoes

O usuario quer visualizar a pagina no navegador localmente. Use a skill `local-server` que contem toda a logica necessaria.

## Processo

1. **Leia a skill `local-server`** (`.agent/skills/local-server/SKILL.md`) e siga as instrucoes detalhadas
2. A skill cobre: verificacao de servidor existente, portas disponiveis, e troubleshooting

## REGRA ABSOLUTA: Apenas Netlify Dev

**NUNCA** use alternativas como `python -m http.server`, `npx serve`, etc.

O Netlify Dev e **OBRIGATORIO** porque:
1. CDN de imagens (`/.netlify/images`) so funciona com ele
2. Redirects do netlify.toml sao simulados
3. Formularios Netlify funcionam
4. Mostra o site EXATAMENTE como vai ao ar

## Ao Finalizar

Informe a URL ao usuario e:
1. Aguarde o usuario visualizar
2. **PARE COMPLETAMENTE E AGUARDE**

**NUNCA** continue para outras etapas automaticamente.
