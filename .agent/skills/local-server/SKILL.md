---
name: local-server
description: Use when you need to start a local development server, view the site locally, provide a localhost URL, or when the user wants to preview their work. Handles port conflicts automatically.
---

# Skill: Local Server

Servidor de desenvolvimento local usando Netlify Dev.

---

## REGRA ABSOLUTA: Apenas Netlify Dev

**NUNCA** use alternativas como `python -m http.server`, `npx serve`, etc.

O Netlify Dev é obrigatório porque:
- CDN de imagens (`/.netlify/images`) só funciona com ele
- Simula redirects do netlify.toml
- Testa formulários Netlify
- Mostra o site EXATAMENTE como vai ao ar

---

## Processo (SEMPRE seguir)

### 1. Verificar se já existe servidor DESTA pasta

```bash
lsof -i :8888 -i :8889 -i :8890 -i :3999 -i :4000 -i :4001 2>/dev/null | grep node
```

Se houver processos, verifique o diretório de trabalho deles:

```bash
# Substitua PID pelo número do processo encontrado
lsof -p PID 2>/dev/null | grep cwd
```

**Se o diretório for a pasta atual:**
- O servidor já está rodando
- Apenas informe o link ao usuário (a porta está na saída do primeiro comando)
- **NÃO inicie outro servidor**

### 2. Se NÃO houver servidor desta pasta

Verifique quais portas estão ocupadas e escolha o primeiro par livre:

- 8888 / 3999
- 8889 / 4000
- 8890 / 4001
- 8891 / 4002
- 8892 / 4003

### 3. Iniciar o servidor

```bash
netlify dev --port {PRINCIPAL} --functions-port {FUNCOES}
```

---

## Resumo do Fluxo

```
1. Verificar processos node nas portas 8888-8892 e 3999-4003
   │
   ├── Encontrou processo?
   │   │
   │   ├── É desta pasta? → Informar link existente, NÃO criar novo
   │   │
   │   └── É de outra pasta? → Escolher próximo par de portas livre
   │
   └── Nenhum processo? → Usar portas padrão 8888/3999

2. Iniciar servidor (se necessário)

3. Informar URL ao usuário
```

---

## Troubleshooting

### netlify: command not found

```bash
npm install -g netlify-cli
```

### Servidor não atualiza

Cache do navegador. Hard refresh:
- Mac: `Cmd+Shift+R`
- Windows: `Ctrl+Shift+R`

---

## Ao Finalizar

Informe a URL ao usuário:

> "Servidor iniciado. Acesse: http://localhost:{PORTA}"

Ou se já existia:

> "Servidor já está rodando. Acesse: http://localhost:{PORTA}"

Após fornecer o link:
1. Aguarde o usuário visualizar
2. **PARE COMPLETAMENTE E AGUARDE**

**NUNCA** continue para outras etapas automaticamente.
