---
description: previsualizar
---

# Instruções

O usuário quer criar um Deploy Preview (PR) para testar antes de ir para produção.

## REGRA DE OURO: Autonomia Total

**VOCÊ DEVE fazer tudo sozinho. NUNCA peça para o usuário executar comandos manualmente.**

Se o Netlify não estiver configurado com CI/CD, configure você mesmo antes de criar o PR.

---

## Por Que Usar Preview?

- Commits para `main` = deploy de produção
- Pull Requests = Deploy Preview (link temporário para testar)

O Deploy Preview é ideal para:
- Testar alterações antes de aprovar
- Mostrar para cliente revisar

---

## Pré-requisito: Identificar Contexto

### Identificar a Pasta da Pagina

Identifique em qual pasta da pagina voce esta trabalhando. Use os arquivos da pasta da pagina (ex: `pagina-vendas/`).

**IMPORTANTE:** Pastas com prefixo `_backup_` sao versoes antigas - NAO inclua no commit/PR.

### Verificar CI/CD

**ANTES de criar o PR**, verifique se o Netlify está configurado com CI/CD:

```bash
netlify status
```

### Se NÃO mostrar um site linkado ou se não tiver integração Git:

**VOCÊ deve configurar o CI/CD primeiro.** Execute `netlify init` e responda aos prompts:

```bash
netlify init
```

Respostas para os prompts interativos:
1. **"What would you like to do?"** → Envie: `1` (Create & configure a new site)
2. **"Team"** → Envie: `1` (primeiro time)
3. **"Site name"** → Envie: nome desejado
4. **"Build command"** → Envie: Enter (vazio)
5. **"Directory to deploy"** → Envie: `.`
6. **OAuth** → Informe ao usuário que ele precisa autorizar no navegador que abriu

**Se o site já existe mas não tem CI/CD:**
```bash
netlify unlink
netlify init
```

Só prossiga para criar o PR após ver: `Success! Netlify CI/CD Configured!`

---

## Processo Completo

### 1. Criar branch e PR

```bash
# Criar branch
git checkout -b preview/alteracoes

# Commitar alterações
git add .
git commit -m "Preview: Descrição das alterações"

# Push e criar PR
git push -u origin preview/alteracoes
gh pr create --title "Preview: Descrição" --body "Alterações para revisão"
```

### 2. Aguardar o Deploy Preview

Após criar o PR, aguarde o Netlify processar:

```bash
gh pr checks {NUMERO_PR} --watch
```

Este comando aguarda até todos os checks completarem.

### 3. Obter o link do Deploy Preview

Após os checks completarem, extraia o link:

```bash
gh pr checks {NUMERO_PR} --json name,link --jq '.[] | select(.name | contains("netlify")) | .link'
```

Se o comando acima não retornar nada, tente:

```bash
gh pr checks {NUMERO_PR}
```

E procure a linha do Netlify - o link estará na coluna final.

### 4. Informar ao usuário

Forneça:
- O link do Deploy Preview (URL do Netlify)
- O link do PR no GitHub (para referência)

---

## Resumo do Fluxo

```
1. Criar branch e PR
2. Aguardar checks: gh pr checks {PR} --watch
3. Extrair link: gh pr checks {PR} (procurar URL do Netlify)
4. Informar o link do PREVIEW ao usuário (não só o link do PR)
```

**IMPORTANTE:** O valor para o usuário é o **link do preview**, não o link do PR.

---

## Para Aprovar (quando o usuário solicitar)

```bash
gh pr merge {NUMERO_PR} --merge
```

---

## Troubleshooting

### Deploy Preview não aparece no PR

**Causa mais comum:** O CI/CD não está configurado corretamente.

Verifique:
```bash
netlify status
```

Se não mostrar "Linked to" com o repositório GitHub, configure:
```bash
netlify unlink
netlify init
```

E responda aos prompts interativos (veja seção "Pré-requisito").

Depois, faça um push para a branch do PR:
```bash
git push origin preview/alteracoes
```

### Comando `gh pr checks` não mostra Netlify

O CI/CD pode não estar configurado. Siga os passos acima.

### OAuth não completa

Se o navegador não abrir ou a autorização não completar:
```bash
netlify logout
netlify login
netlify init
```

**IMPORTANTE:** Mesmo com erros, VOCÊ deve tentar resolver. Só peça ajuda ao usuário em último caso.

---

## Ao Finalizar

Após fornecer o link do Deploy Preview:
1. **PARE COMPLETAMENTE E AGUARDE**

**NUNCA** faça merge automaticamente.
