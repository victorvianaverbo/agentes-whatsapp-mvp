---
trigger: always_on
---

# Comunicação em Português Brasileiro

Todas as mensagens, explicações e respostas devem ser em Português do Brasil. Termos técnicos e código permanecem em inglês.

# AUTONOMIA TOTAL NO TERMINAL

**Este framework é para leigos. O usuário NÃO sabe usar terminal.**

VOCÊ DEVE executar TODOS os comandos sozinho. NUNCA peça para o usuário:
- "Rode este comando no terminal"
- "Execute X manualmente"
- "Abra o terminal e faça Y"

**Comandos interativos (netlify init, gh auth, etc.):**
1. Execute o comando
2. Envie os inputs necessários para cada prompt (1, Enter, nome, etc.)
3. Continue até concluir

**A única exceção:** Quando o navegador abrir para OAuth (autorização GitHub/Netlify), informe ao usuário que ele precisa clicar em "Autorizar" no navegador que abriu automaticamente.

**Se algo falhar:** Tente resolver sozinho. Só peça ajuda ao usuário em último caso, e mesmo assim, nunca peça para ele executar comandos.

# Servidor Local

Use a skill `local-server` para gerenciar o servidor de desenvolvimento. A skill cuida de:
- Verificar se já existe um servidor rodando
- Encontrar uma porta disponível se necessário
- Fornecer a URL correta

NUNCA rode múltiplas instâncias do servidor para a mesma pasta.

# Imagens via Netlify CDN

Formato: `/.netlify/images?url=/images/foto.jpg&w=800&q=80`. NUNCA use caminhos diretos para imagens.

# Hero sem animação de ENTRADA

NUNCA adicione animações de entrada (AOS, fade, opacity:0) no hero. O hero deve aparecer instantaneamente. Animações pós-carregamento são permitidas e encorajadas.

# Formulário

Use o formulário existente no index.html como base. Ele já tem intl-tel-input e Netlify Forms configurados.

# AOS em elementos de scroll

Use `data-aos="fade-up"` em elementos que aparecem no scroll. NUNCA no hero.
Ao inicializar AOS, SEMPRE use `disableMutationObserver: true` para evitar CLS.

# Performance Preventiva (aplicar durante desenvolvimento)

**Imagens:** Sempre com width/height numéricos e CDN. Hero com `loading="eager"`, resto com `loading="lazy"`.

**Scripts pesados (Three.js, GSAP, partículas):** NUNCA import estático. SEMPRE Dynamic Import + IntersectionObserver para carregar quando a seção ficar visível. NUNCA linkar no HTML.

**Fontes:** Manter síncronas com `preconnect` + `display=swap`. NUNCA usar `media="print" onload` (atrasa download e anula preconnect). Max 3 weights.

**Hero:** NUNCA opacity:0, transform, ou data-aos inicial. Container com min-height fixo.

**CSS principal:** Durante desenvolvimento, manter síncrono (bloqueante). No `/otimizar`, pode ser convertido para critical CSS inline + async (ver skill optimize secao 12). NUNCA usar `media="print" onload` SEM critical CSS inline (causa CLS massivo).

# Caminhos absolutos

Comece caminhos de arquivos com `/`. NUNCA use caminhos relativos como `./` ou `../`.

# NUNCA instalar pacotes

Este template não tem build step. NUNCA rode npm, node, ou comandos de build.

# NUNCA usar emojis

Não use emojis em nenhum lugar. A não ser se for solicitado explicitamente pelo usuário

# Socratic Gate (Perguntar Antes de Implementar)

Para tarefas complexas ou ambíguas, PERGUNTE antes de implementar:

- Requisito vago → Pergunte: "O que exatamente você quer?"
- Múltiplas abordagens possíveis → Pergunte: "Prefere A ou B?"
- Impacto em outras partes → Pergunte: "Isso vai afetar X, posso prosseguir?"
- Decisão de design → Pergunte: "Qual estilo prefere?"

**Regra:** Se houver 1% de dúvida, PERGUNTE. Não assuma.

**Exceção:** Correções óbvias de bugs ou erros de sintaxe podem ser feitas diretamente.

# NUNCA proceder automaticamente

Cada workflow tem um escopo definido. Ao finalizar um workflow:
- PARE COMPLETAMENTE
- Aguarde instrução explícita do usuário
- NUNCA inicie o próximo workflow automaticamente
- NUNCA comece a implementar código sem instrução explícita
- Mesmo se o usuário disser "ok" ou "aprovado", apenas confirme e aguarde comando para próxima ação

# Estrutura de Pastas e Versoes

Cada pagina do site fica em sua propria pasta. A versao ATIVA sempre fica na raiz da pasta da pagina.

```
projeto/
├── produto/                ← gerado pelos workflows de estrategia
│   ├── descoberta.md       ← produto e avatar
│   ├── pesquisa-mercado.md ← analise de concorrentes
│   └── narrativa.md        ← big idea e posicionamento
├── pagina-vendas/
│   ├── index.html          ← versao ATIVA
│   ├── style.css
│   ├── copy.md
│   ├── layout.md
│   ├── _backup_v1/         ← versao anterior
│   └── _backup_v2/         ← outra versao anterior
├── pagina-obrigado/
│   ├── index.html
│   └── style.css
└── .agent/
```

**Regras:**
1. `/gerar-copy` cria a pasta da pagina com o nome fornecido
2. Versao ativa = SEMPRE na raiz da pasta da pagina
3. Ao pedir nova versao → mover arquivos atuais para `_backup_vN/` e criar nova versao na raiz
4. Pastas com prefixo `_backup_` sao versoes antigas (ignorar em operacoes normais)
5. Numeracao sequencial: `_backup_v1/`, `_backup_v2/`, etc.

# Fluxo Completo do Projeto

Este framework cobre duas fases:

**Fase 1 — Estrategia (workflows de texto, sem codigo):**
```
/descoberta → /pesquisa-mercado → /narrativa
```
- Geram arquivos `.md` na pasta `produto/`
- Nao tocam em HTML, CSS ou JavaScript
- O usuario com produto ja definido pode pular `/descoberta` e comecar em `/pesquisa-mercado`

**Fase 2 — Construcao (workflows de pagina):**
```
/gerar-copy → /gerar-design → /gerar-layout → /desenvolver → /publicar
```
- O `/gerar-copy` DEVE ler `produto/narrativa.md` para alimentar os textos com o posicionamento definido
- Se `narrativa.md` nao existir, pergunte ao usuario se quer pular a estrategia ou rodar `/narrativa` antes

# Verificacao Obrigatoria Antes de Confirmar ao Usuario

**NUNCA diga "pronto", "esta no ar" ou "alteracoes aplicadas" sem verificar antes.**

## Apos `/visualizar-local` ou qualquer alteracao em desenvolvimento:

1. Acesse a URL local no navegador (use a skill `local-server` para obter a URL)
2. Verifique que a alteracao especifica que foi feita esta visivel
3. Se nao estiver visivel: investigue (cache, arquivo errado, servidor desatualizado) e corrija
4. SO ENTAO confirme ao usuario

## Apos `/publicar` ou qualquer push para producao:

1. Execute `netlify status` para obter a URL de producao
2. Aguarde o deploy completar — monitore com `netlify watch` ou verifique o status no painel
3. Acesse a URL de producao e confirme que as alteracoes estao visiveis
4. Se o deploy demorar mais de 3 minutos ou falhar: verifique os logs com `netlify open:admin`
5. SO ENTAO confirme ao usuario que o site esta no ar com a URL correta

**Problema comum:** alteracoes locais que nao aparecem em producao geralmente indicam que o push nao foi feito ou o deploy nao completou. NUNCA assuma que funcionou — verifique.