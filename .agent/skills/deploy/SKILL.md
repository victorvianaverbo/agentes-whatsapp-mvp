---
name: deploy
description: Use when the user wants to publish, deploy, upload the site, put it online, or host it. Covers Git, GitHub via gh CLI, Netlify init with GitHub OAuth integration, Deploy Previews via PR to save build minutes, and pre-deploy checks.
---

# Skill: Deploy

GitHub + Netlify com CI/CD automático. Cada push para main = deploy automático.

---

## REGRA DE OURO: Autonomia Total

**VOCÊ DEVE fazer tudo sozinho. NUNCA peça para o usuário executar comandos manualmente.**

### Comandos Interativos

Quando um comando for interativo (como `netlify init`), VOCÊ deve:
1. Executar o comando
2. Enviar os inputs necessários para responder aos prompts (1, Enter, nome-do-site, etc.)
3. Continuar até concluir

**NUNCA:**
- Peça para o usuário "rodar X no terminal"
- Diga que "requer autenticação interativa"
- Desista porque o comando é interativo

**SEMPRE:**
- Execute você mesmo
- Envie os inputs corretos para cada prompt
- Só informe o usuário quando ele precisar autorizar algo no navegador (OAuth)

---

## IMPORTANTE: Integração GitHub + Netlify

O deploy DEVE ser feito com integração Git automática. NUNCA use:
- `netlify init --manual` (cria conexão manual que requer configuração extra)
- `netlify sites:create` (cria site sem integração Git)
- `netlify deploy --prod` (deploy direto sem Git, perde histórico)

O correto é usar `netlify init` (sem flags) que configura OAuth automaticamente.

---

## Primeiro: Identificar o Cenário

Antes de fazer qualquer coisa, execute estas verificações:

```bash
# Verificar se é repositório Git
git remote -v

# Verificar se está conectado ao Netlify
netlify status
```

### Interpretação dos Resultados

- Git vazio + Netlify não linkado → **Cenário A** (Configuração inicial completa)
- Git com URL GitHub + Netlify não linkado → **Cenário B** (Apenas conectar Netlify)
- Git com URL GitHub + Site linkado sem CI/CD → **Cenário C** (Configurar integração Git)
- Git com URL GitHub + Site linkado com CI/CD → **Cenário D** (Apenas fazer push)

---

## Cenário A: Configuração Inicial Completa

### Passo 1: Inicializar Git

```bash
git init
git add .
git commit -m "Versão inicial"
```

### Passo 2: Criar repositório no GitHub

```bash
gh repo create nome-do-projeto --public --source=. --push
```

Isso cria o repositório E faz o push inicial.

### Passo 3: Conectar ao Netlify (COM integração GitHub)

```bash
netlify init
```

**ATENÇÃO nas opções:**

1. Quando perguntar "What would you like to do?":
   - Selecione **"Create & configure a new site"** (NÃO selecione "Connect to existing")

2. Quando perguntar sobre o time:
   - Selecione o time do usuário

3. Quando perguntar "Site name":
   - Digite o nome desejado (será a URL: nome.netlify.app)

4. Quando perguntar "Your build command":
   - Deixe VAZIO (apenas pressione Enter)

5. Quando perguntar "Directory to deploy":
   - Digite `.` (ponto) ou deixe vazio se já sugerir o diretório atual

6. O Netlify vai pedir autorização OAuth com GitHub:
   - Isso abrirá o navegador para autorizar
   - Autorize a conexão

7. Ao final, deve aparecer:
   ```
   Success! Netlify CI/CD Configured!
   ```

### Verificar se está conectado

```bash
netlify status
```

Deve mostrar informações do site com "Linked to" apontando para o repositório GitHub.

```bash
netlify open:admin
```

No painel, vá em **"Site configuration"** > **"Build & deploy"** > **"Continuous deployment"**. Deve mostrar o repositório GitHub conectado.

---

## Cenário B: Git OK, Falta Netlify

O repositório já está no GitHub. Apenas conecte ao Netlify:

```bash
netlify init
```

Selecione **"Create & configure a new site"** e siga os passos do Cenário A (Passo 3 em diante).

---

## Cenário C: Falta Integração CI/CD

O site existe no Netlify mas não está com deploy automático. Configure:

```bash
netlify open:admin
```

No painel:
1. Vá em **"Site configuration"** > **"Build & deploy"** > **"Continuous deployment"**
2. Clique em **"Link site to Git"**
3. Selecione **GitHub** e autorize
4. Selecione o repositório correto
5. Configure: Branch = `main`, Build command = (vazio), Publish directory = `.`
6. Confirme

Depois faça um push para testar:

```bash
git add .
git commit -m "Testar CI/CD"
git push origin main
```

---

## Cenário D: Tudo Configurado - Apenas Push

### Verificações Pré-Deploy

Antes de subir, verifique:

- [ ] Todas as imagens usam Netlify CDN (`/.netlify/images?url=`)
- [ ] Imagens têm width, height e alt
- [ ] Hero não tem animação de entrada
- [ ] CSS crítico inline no head
- [ ] Formulário funcionando (teste o envio)
- [ ] Site responsivo (teste no mobile)
- [ ] Console sem erros
- [ ] Links funcionando

### Commit e Push

```bash
git status
git add .
git commit -m "Descrição das alterações"
git push origin main
```

O Netlify inicia o deploy automaticamente.

---

## Deploy Previews (Economizar minutos de build)

**O Netlify cobra por minutos de build.** Para evitar custos:

- Commits para `main` = deploy de produção (usa minutos)
- Pull Requests = Deploy Preview (link temporário para testar)

### Fluxo para alterações

```bash
# Criar branch para alterações
git checkout -b preview/descricao-da-alteracao

# Fazer alterações...
git add .
git commit -m "Descrição das alterações"
git push -u origin preview/descricao-da-alteracao

# Criar PR no GitHub
gh pr create --title "Preview: Descrição" --body "Alterações para revisão"
```

O Netlify automaticamente cria um Deploy Preview com URL tipo:
`deploy-preview-123--nome-do-site.netlify.app`

O link aparece nos comentários do PR no GitHub.

### Aprovar e ir para produção

Após testar o preview:

```bash
gh pr merge --merge
```

Isso faz merge para main e dispara o deploy de produção automaticamente.

---

## Comandos Úteis

**Git:**
- `git status` - ver status
- `git add .` - adicionar tudo
- `git commit -m "msg"` - commitar
- `git push` - enviar para GitHub (dispara deploy)

**GitHub CLI:**
- `gh repo create nome --public --source=. --push` - criar repositório
- `gh pr create --title "x" --body "y"` - criar PR
- `gh pr merge --merge` - fazer merge do PR

**Netlify CLI:**
- `netlify dev` - servidor local (porta 8888)
- `netlify status` - status do site
- `netlify open` - abrir site no navegador
- `netlify open:admin` - abrir painel administrativo

---

## Troubleshooting

### "Site não atualiza após push"

Verifique se a integração está ativa:
```bash
netlify open:admin
```
Vá em **"Site configuration"** > **"Build & deploy"** > **"Continuous deployment"**.

Se não mostrar o repositório GitHub conectado, siga o **Cenário C**.

### "netlify status mostra site mas não mostra repo"

O site foi criado com `--manual` ou `sites:create`. Precisa reconfigurar. Siga o **Cenário C**.

### "Netlify init não pede autorização GitHub"

Se já estiver logado, pode pular a autorização. Verifique com:
```bash
netlify status
```

Se precisar reautorizar:
```bash
netlify logout
netlify login
netlify init
```

### "Deploy falhou no Netlify"

Verifique os logs:
```bash
netlify open:admin
```

Vá em **"Deploys"** e clique no deploy com erro para ver os logs.

Erros comuns:
- Arquivo com nome inválido
- Imagem muito grande (>25MB)
- Erro de sintaxe no netlify.toml

---

## Domínio Personalizado

No dashboard do Netlify: Site configuration > Domain management > Add custom domain

DNS necessário:
- A Record: @ → 75.2.60.5
- CNAME: www → seu-site.netlify.app
