---
description: debug
---

# Instruções

O usuário encontrou um problema e precisa de ajuda para investigar e resolver.

---

## Processo de Investigação Sistemática

### 1. Coletar Informações

Antes de qualquer coisa, entenda o problema:

- **O que está acontecendo?** (sintoma)
- **O que deveria acontecer?** (comportamento esperado)
- **Quando começou?** (mudanças recentes)
- **Há mensagem de erro?** (console, terminal)

Se o usuário não forneceu essas informações, **pergunte**.

### 2. Formar Hipóteses

Liste as possíveis causas, ordenadas por probabilidade:

```
1. [Causa mais provável]
2. [Segunda possibilidade]
3. [Menos provável]
```

### 3. Investigar Sistematicamente

**Teste cada hipótese**, uma por vez:

- Verifique o código relacionado
- Cheque o console do navegador (F12)
- Verifique o terminal do servidor
- Use eliminação: descarte hipóteses até encontrar a causa

### 4. Corrigir e Prevenir

Após identificar a causa:
- Aplique a correção
- Explique **por que** o problema ocorreu
- Sugira como prevenir no futuro (se aplicável)

---

## Formato de Resposta

```markdown
## Investigação: [Problema]

### Sintoma
[O que está acontecendo]

### Informações Coletadas
- Erro: `[mensagem de erro]`
- Arquivo: `[caminho]`
- Linha: [número]

### Hipóteses
1. [Causa mais provável]
2. [Segunda possibilidade]
3. [Menos provável]

### Investigação

**Hipótese 1:**
[O que verifiquei] → [Resultado]

**Hipótese 2:**
[O que verifiquei] → [Resultado]

### Causa Raiz
[Explicação de por que isso aconteceu]

### Correção
[Código corrigido ou ação tomada]

### Prevenção
[Como evitar no futuro]
```

---

## Problemas Comuns em Landing Pages

- Imagem não aparece → Caminho errado, falta CDN Netlify, arquivo não existe
- Layout quebrado no mobile → Falta media query, overflow, largura fixa
- Formulário não envia → Falta `data-netlify="true"`, action errado
- Animação não funciona → AOS não inicializado, classe errada
- Fonte não carrega → URL errada, CORS, fallback não definido
- CLS alto → Imagem sem width/height, fonte sem fallback
- LCP lento → Imagem grande, hero sem `loading="eager"` ou sem preload

---

## Ferramentas de Diagnóstico

### Console do Navegador (F12)
- Erros JavaScript em vermelho
- Recursos não carregados (404)
- Warnings de performance

### DevTools Network
- Recursos que falharam
- Tempo de carregamento
- Tamanho dos arquivos

### Lighthouse (DevTools)
- Performance score
- Problemas específicos
- Sugestões de correção

---

## Princípios

1. **Pergunte antes de assumir** - colete contexto completo
2. **Teste hipóteses** - não adivinhe aleatoriamente
3. **Explique o porquê** - não apenas o que corrigir
4. **Previna recorrência** - sugira melhorias

---

## Ao Finalizar

Após resolver o problema:
1. Confirme que está funcionando
2. Explique a causa raiz
3. **PARE COMPLETAMENTE E AGUARDE**

**NUNCA** continue para outras tarefas automaticamente.
