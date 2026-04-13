---
description: gerar-design
---

# Instrucoes

Voce vai definir a identidade visual da landing page criando uma demonstracao real e impressionante: o Hero + a secao seguinte. Essa demonstracao vai guiar toda a criacao da pagina.

## ESCOPO DESTE WORKFLOW

Este workflow APENAS:
- Coleta informacoes sobre preferencias visuais do usuario
- Cria o Hero + primeira secao como demonstracao de design
- Estabelece a linguagem visual que guiara o resto da pagina

Este workflow NAO:
- Cria a pagina inteira
- Cria todas as secoes
- Cria o layout completo
- Executa nenhuma etapa seguinte

A pagina completa sera criada APENAS quando o usuario usar `/desenvolver` apos aprovar o `/gerar-layout`.

---

## Etapa 1: Coletar Informacoes

### Identificar a Pasta da Pagina

Primeiro, identifique em qual pasta voce esta trabalhando. O `/gerar-copy` ja deve ter criado a pasta da pagina (ex: `pagina-vendas/`).

Leia o arquivo `copy.md` dentro da pasta da pagina. Se nao existir, pergunte ao usuario.

### Versao Alternativa (se aplicavel)

Se o usuario pedir uma NOVA versao ou versao alternativa (ex: "quero mais claro", "faz outra versao"):

1. **Criar backup da versao atual:**
   - Verificar qual e o proximo numero de backup (se existe `_backup_v1/`, criar `_backup_v2/`)
   - Criar pasta `_backup_vN/` dentro da pasta da pagina
   - Mover `index.html` e `style.css` atuais para a pasta de backup

2. **Criar nova versao na raiz da pasta da pagina:**
   - O novo `index.html` e `style.css` ficam na raiz da pasta da pagina
   - Esta e a versao ATIVA

Exemplo:
```
pagina-vendas/
├── index.html          ← nova versao (ATIVA)
├── style.css
├── copy.md
├── _backup_v1/         ← versao anterior
│   ├── index.html
│   └── style.css
```

### Perguntar Referencias (OPCIONAL)

Faca esta pergunta ao usuario:

"Voce tem alguma referencia visual para este projeto?
- Sites que gosta do estilo
- Marcas com identidade visual similar
- Cores da marca / logo
- Prints de inspiracao

Pode mandar links, imagens, ou descrever. Se nao tiver, tudo bem - vou criar algo baseado na copy."

### Se o usuario NAO enviar referencias

Analise a copy e use senso comum para definir a direcao visual:
- Produto/servico premium → design sofisticado, espacos generosos
- Produto/servico acessivel → design amigavel, cores vibrantes
- Tecnologia → design moderno, clean
- Saude/bem-estar → design calmo, organico
- Educacao → design claro, confiavel
- Etc.

### Se o usuario enviar referencias

Use as referencias como guia principal para as escolhas de arquetipo, constraints e paleta de cores.

---

## Etapa 2: Consultar a Skill Creative Reference (OBRIGATORIO)

ANTES de fazer qualquer escolha criativa, LEIA o arquivo:
`.agent/skills/creative-reference/SKILL.md`

Este arquivo contem TODAS as opcoes disponiveis. Voce DEVE consulta-lo.

### Estrutura da Skill

**ARQUETIPOS DE COMPOSICAO** (70+ opcoes em 10 categorias):
- Baseados em Grid (Simetrico, Assimetrico, Masonry, Bento Box, Broken Grid...)
- Baseados em Divisao (Split Vertical, Diagonal, Assimetrico, com Overlap...)
- Baseados em Camadas (Layered, Glassmorphism, Card Stack, Parallax Layers...)
- Baseados em Fluxo (Scroll Cinematico, Horizontal, Snap, Storytelling...)
- Baseados em Foco (Hero Dominante, Spotlight, Progressive Reveal, Isolated...)
- Baseados em Movimento (Kinetic, Reactive, Ambient Motion, Breathing...)
- Baseados em Tipografia (Type Hero, Editorial, Poster, Kinetic Type...)
- Baseados em Midia (Photo Essay, Video Immersive, Gallery Wall, Collage...)
- Baseados em Interacao (Cursor Playground, Drag Interface, Gamified...)
- Baseados em Densidade (Minimal, Sparse, Balanced, Dense, Maximalist...)

**CONSTRAINTS CRIATIVOS** (100+ opcoes em 8 categorias):
- Midia (Fullbleed, Duotone, Parallax, Video Loop, 3D Element, Particles...)
- Tipografia (Headline >150px, Texto em Path, Gradiente, Glitch, Neon, Split...)
- Layout (Bleed, Overlap, Sticky, Diagonal Divider, Clip-path, Skewed...)
- Cor (Monocromatico, Gradiente Mesh, Neon, Color Blocking, Selective...)
- Movimento (Fade, Scale, Rotate, Float Loop, Stagger, Morph Shape, Draw SVG...)
- Interacao (Hover Lift, Cursor Custom, Mouse Parallax, Magnetic, Drag...)
- Efeitos Especiais (Glassmorphism, Noise, Glitch, Chromatic Aberration...)
- Estruturas Especiais (Carousel 3D, Before/After, Timeline, Masonry...)

**FONT PAIRINGS CURADOS** (100+ combinacoes em 6 categorias):
- Serif + Sans (Playfair + Source Sans, DM Serif + DM Sans, Fraunces + Outfit...)
- Sans + Sans (Clash Display + General Sans, Satoshi + Inter, Sora + Geist...)
- Mono + Sans (Space Mono + Space Grotesk, JetBrains Mono + Inter...)
- Condensed (Barlow Condensed + Barlow, Roboto Condensed + Roboto...)
- Display Impact (Clash Display, Unbounded, Syne, Cabinet Grotesk...)
- Alternativas (Hanken Grotesk, Schibsted Grotesk, Atkinson Hyperlegible...)

---

## Etapa 3: Fazer as Escolhas Criativas

Apos ler a skill, faca suas escolhas:

### 1. Escolher UM Arquetipo para o Hero
Declare: "Hero: Arquetipo [NOME] - [ESSENCIA]"

### 2. Escolher 2+ Constraints de categorias DIFERENTES
Declare: "Constraints: [A] (categoria), [B] (categoria)"

Exemplo: "Constraints: Headline >150px (Tipografia), Parallax (Midia), Hover Lift (Interacao)"

### 3. Escolher Font Pairing da lista curada
Declare: "Fontes: [Heading] + [Body] - [Vibe]"

Exemplo: "Fontes: Clash Display + General Sans - Statement moderno"

**FONTES PROIBIDAS (overused):**
- Montserrat + Open Sans
- Poppins + Roboto
- Poppins + Poppins
- Inter + Inter
- Lato + Lato
- Open Sans + Open Sans
- Roboto + Roboto

### REGRA CRITICA - Padroes PROIBIDOS
NUNCA use:
- Hero centralizado com headline + subheadline + botao
- 3 cards lado a lado com icones
- Grid simetrico de features
- Layout que parece template SaaS

---

## Etapa 4: Criar a Demonstracao

Apos definir arquetipo e constraints, crie o Hero + primeira secao real no `index.html` e `style.css`.

### Principios de Execucao (NAO exemplos)

**Tipografia:**
- A hierarquia deve ser dramatica, nao apenas diferente
- O contraste de pesos deve ser extremo quando apropriado
- O tamanho deve criar impacto, nao apenas legibilidade

**Layout:**
- O espaco negativo deve ser intencional, nao residual
- Os elementos devem ter relacao visual clara
- A assimetria deve criar tensao, nao desconforto

**Cor:**
- A paleta deve ter personalidade, nao ser "safe"
- Os gradientes devem ser sofisticados, nao obvios
- O contraste deve servir a hierarquia

**Movimento:**
- As animacoes devem ter proposito, nao ser decorativas
- O timing deve criar ritmo, nao distracoes
- A interatividade deve surpreender, nao irritar

### Recursos Tecnicos Disponiveis
- CSS moderno (grid, flexbox, clamp, container queries)
- CSS scroll-driven animations (animation-timeline)
- CSS view transitions
- Fontes variaveis
- clip-path, mask-image
- backdrop-filter
- mix-blend-mode
- GSAP para animacoes complexas (Dynamic Import)
- Three.js para 3D (Dynamic Import)
- Canvas/WebGL para efeitos (Dynamic Import)

---

## Etapa 5: Apresentar ao Usuario

Apos criar, informe ao usuario:

1. O que foi criado (hero + primeira secao)
2. Qual arquetipo e constraints usados
3. Qual font pairing escolhido
4. Como visualizar: use a skill `local-server` ou `/visualizar-local`
5. Peca feedback: "O que achou? Quer ajustar algo antes de continuarmos?"

---

## Importante

- Esta etapa NAO cria a pagina inteira, apenas Hero + 1 secao
- O objetivo e estabelecer a linguagem visual
- O usuario deve aprovar antes de prosseguir para `/gerar-layout`
- Se o usuario pedir ajustes, faca quantas iteracoes forem necessarias
- Use fontes do Google Fonts (adicione os links necessarios)
- Hero sem animacao de ENTRADA, mas com animacao pos-carregamento

---

## Ao Finalizar

Apos criar o Hero + primeira secao:

1. Informe o que foi criado
2. Explique as escolhas de design (arquetipo + constraints + font pairing)
3. Forneca o link para visualizar (use a skill `local-server` para obter a URL correta) (OBRIGATÓRIO)
4. Pergunte se quer ajustar algo
5. Sugira a proxima etapa: "Quando o design estiver aprovado, use `/gerar-layout` para criar a especificacao detalhada de todas as secoes."
6. **PARE COMPLETAMENTE**

---

## IMPORTANTE: Regras de Comportamento

- NUNCA continue para a proxima etapa automaticamente
- NUNCA crie mais secoes alem do Hero + primeira secao
- Se o usuario aprovar ("ok", "aprovado", etc.), apenas confirme e sugira `/gerar-layout`
- AGUARDE o usuario digitar o proximo comando explicitamente