---
description: gerar-copy
---

# Instruções

Você vai trabalhar na copy (textos) da landing page.

## ESCOPO DESTE WORKFLOW

Este workflow APENAS:
- Cria ou melhora os textos da landing page
- Salva a copy estruturada no arquivo `copy.md`

Este workflow NÃO:
- Cria a página HTML
- Escreve CSS ou JavaScript
- Faz design
- Implementa nada visualmente
- Cria implementation plans
- Executa nenhuma etapa seguinte

## Antes de Começar

### Criar a Pasta da Pagina

Pergunte ao usuario qual sera o nome desta pagina (ex: "pagina-vendas", "pagina-obrigado", "lp-lancamento").

Crie uma pasta com este nome na raiz do projeto. Todos os arquivos desta pagina ficarao dentro desta pasta:

```
projeto/
├── pagina-vendas/      ← pasta criada
│   ├── copy.md         ← sera criado agora
│   ├── index.html      ← sera criado em /gerar-design
│   └── style.css       ← sera criado em /gerar-design
└── .agent/
```

### Entender o Contexto

1. Entenda o contexto do projeto (produto/serviço, público-alvo, objetivo)
2. Se ja existir um `index.html` na pasta, leia para ver textos existentes

## Diretrizes de Copy

### Tom e Voz
- Direto e persuasivo
- Focado em benefícios, não features
- Linguagem do público-alvo
- NUNCA use emojis

### Estrutura Recomendada

**Hero:**
- Headline principal (benefício claro, máximo 10 palavras)
- Subheadline (explicação breve, 1-2 linhas)
- CTA claro e urgente

**Seções:**
- Problema/dor do público
- Solução/benefícios
- Prova social (depoimentos, números)
- Como funciona (se aplicável)
- FAQ (objeções comuns)
- CTA final

### Boas Práticas
- Headlines curtas e impactantes
- Parágrafos curtos (máximo 3 linhas)
- Bullets para listas
- Verbos de ação nos CTAs
- Números específicos quando possível

## Sua Tarefa

Pergunte ao usuário:
- O que precisa ser criado/melhorado na copy?
- Há algum texto específico que deve ser mantido?
- Qual é o diferencial do produto/serviço?

Então crie ou melhore a copy conforme solicitado.

## Saída

Salve a copy estruturada em um arquivo `copy.md` dentro da pasta da pagina criada.

Formato do arquivo:

```markdown
# Copy - [Nome do Projeto]

## Hero
- Headline: ...
- Subheadline: ...
- CTA: ...

## Seção: [Nome]
- Título: ...
- Conteúdo: ...

## Depoimentos
- Nome: ...
  Texto: ...

## FAQ
- Pergunta: ...
  Resposta: ...
```

## Ao Finalizar

Após salvar o arquivo `copy.md`:

1. Informe ao usuário que a copy foi salva
2. Apresente um resumo das seções criadas
3. Pergunte se quer ajustar algo na copy
4. Sugira a próxima etapa: "Quando a copy estiver aprovada, use `/gerar-design` para definirmos a identidade visual."
5. **PARE COMPLETAMENTE E AGUARDE**

## IMPORTANTE: Regras de Comportamento

- NUNCA continue para a próxima etapa automaticamente
- NUNCA comece a criar HTML, CSS ou design
- Se o usuário aprovar ("ok", "aprovado", etc.), apenas confirme e sugira `/gerar-design`
- AGUARDE o usuário digitar o próximo comando explicitamente
