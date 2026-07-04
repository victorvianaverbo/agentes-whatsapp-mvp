# Layout Spec — Proposta Kairós Operação · Celso

Documento de direção de arte. Especifica exaustivamente cada seção da página, do hero ao rodapé. Esta é a bíblia para `/desenvolver`.

---

## SISTEMA VISUAL GLOBAL

### Paleta (variáveis CSS)

| Token | Hex | Uso |
|---|---|---|
| `--bg-light` | `#FBFAF9` | Background principal, light sections |
| `--bg-dark` | `#0F172A` | Background dark sections (S5, S7, S10, S11) |
| `--bg-cream` | `#FFFAF0` | Background warm sections (S5 Suporte) |
| `--bg-lavender` | `#EDE9FE` | Background lavanda suave (S2 SDR card) |
| `--bg-deep` | `#1E1B4B` | Background deep purple (S2 Closer card) |
| `--text-dark` | `#0A0A0A` | Texto principal em fundo claro |
| `--text-muted` | `#52525B` | Texto secundário em fundo claro |
| `--text-soft` | `#71717A` | Texto terciário/labels |
| `--text-light` | `#FAFAFA` | Texto principal em fundo escuro |
| `--text-light-muted` | `#A1A1AA` | Texto secundário em fundo escuro |
| `--accent` | `#4F46E5` | Roxo Kairós (CTAs, destaques, links) |
| `--accent-hover` | `#6D67FE` | Roxo hover |
| `--accent-soft` | `#C7D2FE` | Roxo claro (subtítulos em dark, badges) |
| `--border-light` | `#E4E4E7` | Borda em light |
| `--border-dark` | `rgba(255,255,255,0.08)` | Borda em dark |

### Tipografia

| Token | Família | Uso |
|---|---|---|
| `--font-display` | `Sora` (300/400/500/600/700/800) | Títulos, números grandes, statements |
| `--font-body` | `Space Grotesk` (300/400/500/600/700) | Corpo de texto, descrições, parágrafos |
| `--font-mono` | `JetBrains Mono` (400/500) | Labels técnicas, números técnicos, sobrelinhas, IDs de seção |

### Escala tipográfica

| Token visual | clamp() | line-height | letter-spacing | uso |
|---|---|---|---|---|
| Hero headline | `clamp(44px, 6.8vw, 116px)` | 0.95 | -0.035em | S1 |
| Section title XL | `clamp(40px, 5.5vw, 88px)` | 1.0 | -0.035em | S2, S6, S13 |
| Section title L | `clamp(36px, 4.5vw, 72px)` | 1.05 | -0.03em | S3, S4, S5, S9, S11 |
| Section title M | `clamp(28px, 3vw, 48px)` | 1.1 | -0.025em | S7, S8, S10, S12 |
| Card title | `clamp(22px, 2.2vw, 32px)` | 1.05 | -0.02em | Cards, fichas |
| Subhead L | `clamp(17px, 1.35vw, 22px)` | 1.5 | -0.005em | Hero sub |
| Subhead M | `clamp(15px, 1.15vw, 18px)` | 1.55 | 0 | Subtítulos seção |
| Body | `clamp(15px, 1.05vw, 17px)` | 1.6 | 0 | Texto corrido |
| Body sm | `14px` | 1.55 | 0 | Cards densos |
| Mono label | `12px` | 1.4 | 0.16em uppercase | Sobrelinhas, IDs |
| Mono micro | `10.5–11px` | 1.4 | 0.1em uppercase | Card labels, corner ids |

### Espaçamentos

- `--container-px`: `clamp(24px, 5vw, 80px)` — padding horizontal global
- `--section-py`: `clamp(80px, 10vw, 160px)` — padding vertical de seção padrão
- Gap entre cards: 16px (bento), 24px (grids regulares), 48px (split sections)
- Border-radius: 4px (cards finos/fichas), 6px (bento cards), 12px (cards generosos), 24px (containers grandes)

### Easing global

- `--ease-out`: `cubic-bezier(0.22, 1, 0.36, 1)` (decelerate forte — entradas)
- `--ease-in-out`: `cubic-bezier(0.65, 0, 0.35, 1)` (suave — loops, transições)
- `--ease-magnetic`: `cubic-bezier(0.16, 1, 0.3, 1)` (micro-interações hover)

### Breakpoints

- Desktop large: `> 1280px`
- Desktop: `960px – 1280px`
- Tablet: `640px – 960px`
- Mobile: `< 640px`

### Princípios globais de animação

- **Entrada de seção:** fade-up 800ms `ease-out` com 60ms stagger entre filhos, trigger em 20% viewport (Intersection Observer)
- **Hover:** sempre 400ms `ease-magnetic`, lift de -4 a -6px com sombra crescente
- **Loop ambient:** 12-18s, `ease-in-out` infinite
- **Reduced motion:** respeitar `prefers-reduced-motion: reduce` desabilitando todos os keyframes

---

## SEÇÃO 1 — HERO

### Arquétipo e Constraints
- **Arquétipo:** Type Hero (tipografia como protagonista absoluto)
- **Constraints:** Headline >100px (Tipografia) · Asymmetric Padding (Layout) · Float Loop ambient (Movimento)
- **Justificativa:** A primeira coisa que Celso vê precisa ter peso visual e personalização imediata. Tipografia gigante comunica confiança; ficha lateral mostra que é sob medida.

### Conteúdo
- Topbar: "Kairós Operação / Proposta para Celso / Abril 2026"
- Sobrelinha: "Proposta Kairós Operação" + dot pulse roxo
- Headline: "Time de IA operando dentro do seu funil." (palavra "seu funil." em accent itálico)
- Subheadline: "Um agente de IA que qualifica, vende e atende seus 500 a 2.000 alunos no WhatsApp e no Instagram. 24 horas por dia."
- Ficha lateral: Para Celso · Produto Corrida de rua · Volume 500 a 2.000 alunos/mês · Canais WhatsApp + Instagram · Implementação 15 dias
- Scroll cue: "Role e veja como cada peça funciona" + ícone seta

### Layout
- Container: max-width 1380px, padding `clamp(24px,5vw,80px)`
- Topbar fixa (z-50): height 48px, backdrop-filter blur(20px) sobre `rgba(251,250,249,0.7)`, border-bottom `1px solid #E4E4E7`
- Section: min-height 100vh, padding-top `clamp(96px,11vh,140px)`, padding-bottom `clamp(48px,6vh,96px)`, display flex column justify-center
- Grid interno: `minmax(0, 1fr) clamp(280px, 22vw, 340px)`, align-items end, gap `clamp(32px, 4vw, 72px)`
- Sobrelinha ocupa `grid-column 1 / -1`
- Headline ocupa coluna 1, max-width 13ch
- Subheadline ocupa coluna 1 abaixo do headline, max-width 36ch, margin-top `clamp(24px, 2.8vw, 40px)`
- Ficha lateral ocupa coluna 2, alinhada ao bottom (align-self: end)
- Scroll cue: position absolute, bottom `clamp(28px, 4vh, 48px)`, left `var(--container-px)`

### Tipografia
- Topbar brand: Sora 500, 12px, uppercase, letter-spacing 0.1em, cor `#0A0A0A`
- Topbar separator: opacidade 0.4
- Topbar client: Space Grotesk 500, 12px, cor `#4F46E5`
- Topbar meta: Mono 11px uppercase letter-spacing 0.12em, cor muted, margin-left auto
- Sobrelinha: Mono 12px uppercase, letter-spacing 0.18em, cor `#52525B`
- Headline: Sora 700, `clamp(44px, 6.8vw, 116px)`, line-height 0.95, letter-spacing -0.035em
- Headline accent ("seu funil."): Sora 600 italic, cor `#4F46E5`
- Subheadline: Space Grotesk 400, `clamp(17px, 1.35vw, 22px)`, line-height 1.5, cor `#52525B`
- Em (qualifica/vende/atende): Space Grotesk 500, cor `#4F46E5`, font-style normal
- Card label: Mono 10.5px uppercase, letter-spacing 0.16em, cor `#71717A`
- Card row dt: Mono 11px uppercase, letter-spacing 0.1em, cor `#71717A`
- Card row dd: Space Grotesk 500, 14px, cor `#0A0A0A`
- Scroll cue: Mono 11.5px uppercase, letter-spacing 0.14em, cor `#52525B`

### Cores
- Background: `#FBFAF9`
- Headline: `#0A0A0A`
- Headline accent: `#4F46E5`
- Subheadline: `#52525B`
- Ficha card: bg `rgba(255,255,255,0.8)` + backdrop-filter blur(12px), border `1px solid #E4E4E7`
- Ficha shadow: `0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)`
- Card row "Implementação" highlight: cor `#4F46E5`, weight 600

### Elementos Visuais
- **Shape ambient principal:** absolute top -10% right -15%, width `clamp(420px, 55vw, 780px)`, aspect-ratio 1, radial gradient `rgba(79,70,229,0.18) → transparent 65%`, border-radius 50%, filter blur(40px), z-index 0
- **Shape ambient alt:** absolute bottom -15% left -8%, width `clamp(280px, 35vw, 480px)`, radial gradient `rgba(199,210,254,0.5) → transparent 65%`, blur(40px), animation delay -4s
- **Dot pulse:** 8x8px círculo `#4F46E5`, box-shadow `0 0 0 3px rgba(79,70,229,0.18)` pulsando para `0 0 0 7px rgba(79,70,229,0)`
- **Card label mark:** 6x6 quadrado `#4F46E5`, border-radius 1px, antes do label
- **Card rows:** separados por `border-bottom: 1px dashed rgba(228,228,231,0.7)`, padding 8px 0
- **Scroll arrow:** SVG 20x20, stroke 1.5, currentColor

### Animações
- **Entrada palavras headline:** cada `.word` com keyframe `wordIn` (translateY(40px) opacity 0 → translateY(0) opacity 1), 900ms ease-out, delay calculado `0.25s + var(--i) * 0.07s`
- **Entrada sobrelinha:** fadeUp 800ms ease-out delay 0.1s
- **Entrada subheadline:** fadeUp 1s ease-out delay 1s
- **Entrada ficha lateral:** fadeUp 1s ease-out delay 1.4s
- **Entrada scroll cue:** fadeUp 800ms ease-out delay 1.8s
- **Float loop shape principal:** 14s ease-in-out infinite, 0%/100% translate(0,0) scale(1) → 33% translate(2vw,-3vh) scale(1.05) → 66% translate(-1.5vw,2vh) scale(0.97)
- **Float loop shape alt:** 18s ease-in-out infinite, delay -4s
- **Pulse dot:** 2.4s ease-in-out infinite (box-shadow expande e some)
- **Scroll arrow bounce:** 2s ease-in-out infinite (translateY 0 → 4px → 0)

### Interatividade
- Topbar: sticky/fixed sempre visível, sem hover
- Scroll cue link: hover muda cor para `#4F46E5`, transição 300ms ease-out
- Ficha card: sem hover (informacional)

### Responsividade
- `≤ 960px`: grid colapsa para 1 coluna; ficha vai pra baixo do subtítulo, max-width 460px, margin-top 24px
- `≤ 540px`: topbar__meta desaparece; card__row vira `grid-template-columns: 90px 1fr`; scroll cue esconde texto, mostra só ícone
- Headline em mobile: 44px, line-height 0.95, mantém quebras orgânicas

---

## SEÇÃO 2 — AS QUATRO PEÇAS (BENTO)

### Arquétipo e Constraints
- **Arquétipo:** Bento Box (4 células de tamanhos variados)
- **Constraints:** Color Blocking (Cor) · Hover Lift (Interação)
- **Justificativa:** Resumo executivo das 4 peças (SDR, Closer, Suporte, CRM) sem cair no padrão SaaS de 4 cards iguais. Tamanhos diferentes hierarquizam SDR (porta de entrada) e Closer (vertical alta = continuidade do funil).

### Conteúdo (do copy.md)
- Sobrelinha: "As quatro peças"
- Título: "Quatro peças. Uma operação inteira." (segunda frase em cor muted)
- Card 01 SDR: descrição completa + quote "Em menos de 60 segundos. Inclusive 23h47."
- Card 02 Closer: descrição
- Card 03 Suporte: descrição reduzida
- Card 04 CRM próprio: descrição
- Cada card tem corner com link "→ S3" / "→ S4" / "→ S5" / "→ S8"

### Layout
- Section: padding `var(--section-py) var(--container-px)`, background `#FBFAF9`
- Head: max-width 1480px, margin-bottom `clamp(48px, 6vw, 80px)`
- Grid: max-width 1480px, `grid-template-columns: repeat(3, 1fr)`, `grid-template-rows: minmax(280px, auto) minmax(240px, auto)`, gap 16px
- **SDR**: `grid-column 1/3`, `grid-row 1/2` (2 cols × 1 row)
- **Closer**: `grid-column 3/4`, `grid-row 1/3` (1 col × 2 rows — vertical alta)
- **Suporte**: `grid-column 1/2`, `grid-row 2/3` (1 col × 1 row)
- **CRM**: `grid-column 2/3`, `grid-row 2/3` (1 col × 1 row)

### Tipografia
- Sobrelinha: Mono 12px uppercase letter-spacing 0.16em cor `#71717A`, antes uma linha 32x1px `#4F46E5`
- Título: Sora 700, `clamp(40px, 5.5vw, 88px)`, line-height 1, letter-spacing -0.035em
- Título-2 (segunda frase): Sora 500, cor `#71717A`
- Card num: Mono 13px letter-spacing 0.12em weight 500, opacity 0.5
- Card title: Sora 600, `clamp(22px, 2.2vw, 32px)`, line-height 1.05, letter-spacing -0.02em
- Card desc: Space Grotesk 400, `clamp(15px, 1.05vw, 17px)`, line-height 1.55
- Card quote (só SDR): Sora 400, `clamp(18px, 1.5vw, 22px)`, line-height 1.3, letter-spacing -0.015em, padding-top 18px com border-top 1px solid currentColor 0.12 alpha
- Card quote strong: Sora 600
- Card corner: Mono 11px letter-spacing 0.1em opacity 0.4

### Cores
- SDR card: bg `#EDE9FE`, texto `#0A0A0A`, quote border `rgba(79,70,229,0.25)`, quote text `#4F46E5`
- Closer card: bg `#1E1B4B`, texto `#FAFAFA`, num cor `#C7D2FE`, corner `#A1A1AA`
- Suporte card: bg `#FFFAF0`, texto `#0A0A0A`, border `1px solid #E4E4E7`
- CRM card: bg `#0F172A`, texto `#FAFAFA`, num cor `#C7D2FE`, corner `#A1A1AA`

### Elementos Visuais
- Cards: padding `clamp(28px, 3vw, 44px)`, border-radius 6px, overflow hidden
- Cada card tem 3 zonas: head (num + title), body (desc + quote opcional), corner absoluto bottom-right

### Animações
- Section entrada: cards com stagger 80ms entre si, fade-up 700ms ease-out, trigger 20% viewport via Intersection Observer
- Stagger order: SDR → Closer → Suporte → CRM

### Interatividade
- Hover card: `transform: translateY(-6px)`, `box-shadow: 0 20px 50px -20px rgba(15,23,42,0.25)`, transição 500ms ease-out
- Hover corner: opacity 0.4 → 0.85, translateX 0 → 4px, transição 300ms ease-out
- Click corner: scroll suave (smooth) para a seção referenciada (S3/S4/S5/S8) com offset -80px (compensar topbar)

### Responsividade
- `≤ 960px`: grid colapsa para 1 coluna, todos cards ocupam grid-column 1, grid-row auto, min-height 240px
- Em mobile, ordem mantida: SDR → Closer → Suporte → CRM

---

## SEÇÃO 3 — AGENTE SDR (DETALHADO)

### Arquétipo e Constraints
- **Arquétipo:** Split Vertical (50/50 lado a lado)
- **Constraints:** Mockup Conversa estilizado (Mídia) · Sticky Element (Layout) · Stagger reveal (Movimento)
- **Justificativa:** Detalhamento profundo precisa equilibrar prosa (esquerda) com prova visual (direita: mockup de conversa). Sticky no detalhamento permite ler com calma enquanto a conversa fica visível.

### Conteúdo
- Sobrelinha: "Peça 01 · Agente SDR"
- Título: "O primeiro contato que você nunca mais vai fazer."
- Subtítulo: "Lead novo entra. Em até 60 segundos, recebe a primeira mensagem. E não é \"oi tudo bem\"."
- Bloco "O que ele faz, na prática" — lista de 7 ações
- Mockup conversa real (com timestamps): lead 23h47 / agente 50s / lead resposta / agente próxima pergunta
- Bloco "Por que isso importa pra você" — lista de 4 benefícios

### Layout
- Section: padding `var(--section-py) var(--container-px)`, background `#FBFAF9`
- Container: max-width 1380px
- Grid: `grid-template-columns: 1fr 1fr`, gap `clamp(48px, 6vw, 96px)`, align-items start
- **Coluna esquerda:** sticky (top 120px), contém sobrelinha + título + subtítulo + lista "o que faz" + lista "por que importa"
- **Coluna direita:** mockup conversa (não-sticky, scroll natural)

### Tipografia
- Sobrelinha: Mono 12px letter-spacing 0.16em uppercase cor `#71717A`, antes barra `4px x 24px` `#4F46E5`
- Título: Sora 600, `clamp(36px, 4.5vw, 72px)`, line-height 1.05, letter-spacing -0.03em
- Subtítulo: Space Grotesk 400, `clamp(17px, 1.35vw, 22px)`, line-height 1.5, cor `#52525B`, max-width 32ch, margin-top 24px
- Lista heading "O que ele faz na prática": Mono 12px uppercase letter-spacing 0.16em cor `#0A0A0A` weight 500
- Lista item: Space Grotesk 400, `clamp(15px, 1.05vw, 17px)`, line-height 1.55, padding-left 24px (com `::before` quadrado 6px `#4F46E5`)
- Lista heading "Por que isso importa": mesmo do anterior
- Lista benefícios: Space Grotesk 500 (mais peso), com `::before` seta `→`

### Cores
- Background: `#FBFAF9`
- Título: `#0A0A0A`
- Listas item: `#0A0A0A`
- Bullets/setas: `#4F46E5`

### Elementos Visuais — MOCKUP CONVERSA
- Container: max-width 460px, border-radius 24px, background `#F4F4F5`, padding 24px, position relative
- Header do mockup: barra com avatar circular 36px (gradiente roxo `#4F46E5 → #6D67FE`) + nome "Agente · Persona Celso" (Sora 500 14px) + status dot verde 8px
- Border-top do header: `1px solid #E4E4E7`, padding-bottom 20px

**Bolhas de mensagem:**
- Lead bubble: bg `#FFFFFF`, border `1px solid #E4E4E7`, border-radius 16px 16px 16px 4px, padding 14px 18px, max-width 80%, align-self start, cor `#0A0A0A`
- Agente bubble: bg `#4F46E5`, border-radius 16px 16px 4px 16px, padding 14px 18px, max-width 80%, align-self end, cor `#FFFFFF`
- Timestamp: Mono 10px cor `#A1A1AA`, margin-top 4px, mesma alinhamento da bolha

**Mensagens (texto):**
1. Lead 23h47: "Oi, vi seu Instagram, queria começar a correr mas tô parado faz uns 4 anos"
2. Agente 23h47 + 50s: "Boa noite. Bom que você chegou. Antes de te falar como funciona o método, me ajuda a entender duas coisas. Você quer correr pra emagrecer, voltar pro hábito ou tem alguma prova marcada na cabeça? E hoje, fora corrida, faz alguma atividade?"
3. Lead 23h49: "Quero perder peso e me sentir melhor. Não faço nada hoje. Tenho 38 anos."
4. Agente 23h49 + 40s: "Entendi. Caso clássico de quem quer começar do zero sem se machucar nas duas primeiras semanas. Última coisa antes de te mostrar o caminho: você consegue separar 30 minutos, três vezes na semana?"

**Indicador "digitando":** após mensagem 4, mostrar 3 dots animados (saltam em sequência)

### Animações
- Entrada coluna esquerda: fade-up 800ms ease-out, stagger 100ms entre headings/listas, trigger 20%
- Entrada mockup: scale-in de 0.96 para 1 + fade, 700ms ease-out, trigger 30%
- Bolhas: stagger 200ms entre cada bubble (uma aparece a cada 200ms), fade-up 500ms
- Indicador digitando: dots `transform: translateY(0 → -4px)` em sequência 0/200/400ms, loop infinite 1.4s

### Interatividade
- Sticky coluna esquerda: top 120px (compensar topbar 48 + buffer)
- Hover bubble: nenhum (informacional)
- Hover lista item: cor `#0A0A0A` → `#4F46E5` (apenas o bullet/seta), 200ms

### Responsividade
- `≤ 960px`: grid colapsa para 1 coluna, sticky removido, mockup vai abaixo dos textos com margin-top 48px
- `≤ 640px`: mockup ocupa 100% width, padding interno 16px

---

## SEÇÃO 4 — AGENTE CLOSER (DETALHADO)

### Arquétipo e Constraints
- **Arquétipo:** Editorial (layout de revista com colunas e tipografia elaborada)
- **Constraints:** Pull Quote >40px (Tipografia) · Asymmetric Padding (Layout) · Mixed Weights (Tipografia)
- **Justificativa:** Variação do Split de S3. Aqui a estrutura é editorial — texto principal em coluna larga, quote dramática como respiro, exemplos de conversa em coluna lateral mais estreita. Reforça a ideia de "o vendedor que escreve bem".

### Conteúdo
- Sobrelinha: "Peça 02 · Agente Closer"
- Título: "Quando o lead esquenta, o agente vira vendedor."
- Subtítulo: "É a mesma persona, a mesma voz. O cliente não percebe que mudou de etapa."
- Pull Quote dramática: "O vendedor não dorme. Não cobra. Não esquece o lead que esfriou semana passada."
- Lista "O que ele faz" (6 ações)
- 2 mockups menores: objeção de preço + lembrete de aulão
- Lista "Por que isso importa" (4 itens)

### Layout
- Section: padding `var(--section-py) var(--container-px)`, background `#0F172A` (dark)
- Container: max-width 1380px
- Grid principal: `grid-template-columns: 1fr 1fr 1fr`, gap 48px (3 colunas)
- **Coluna 1-2 (span 2):** sobrelinha + título + subtítulo + pull quote
- **Coluna 3:** lista "o que faz" (mais densa)
- Abaixo do grid principal, 2 mockups conversa lado a lado (split 50/50, gap 24px)
- Lista "por que importa" abaixo dos mockups, em 2 colunas

### Tipografia
- Sobrelinha: Mono 12px uppercase letter-spacing 0.16em cor `#A1A1AA`, antes barra `#C7D2FE`
- Título: Sora 600, `clamp(36px, 4.5vw, 72px)`, line-height 1.05, letter-spacing -0.03em, cor `#FAFAFA`, max-width 18ch
- Subtítulo: Space Grotesk 400, `clamp(17px, 1.35vw, 22px)`, cor `#A1A1AA`, max-width 36ch, margin-top 24px
- **Pull Quote:** Sora 300 italic, `clamp(28px, 3.5vw, 56px)`, line-height 1.2, letter-spacing -0.025em, cor `#FAFAFA`, com sublinhado no "não dorme" em `#C7D2FE`, padding-top 48px, border-top `1px solid rgba(255,255,255,0.08)`
- Lista heading: Mono 11px uppercase letter-spacing 0.16em cor `#C7D2FE`
- Lista item: Space Grotesk 400, 15px, line-height 1.55, cor `#FAFAFA`, com bullet quadrado 4px `#C7D2FE`

### Cores
- Background: `#0F172A`
- Texto principal: `#FAFAFA`
- Texto muted: `#A1A1AA`
- Accent (bullets, sublinhados, números): `#C7D2FE`
- Mockup bg: `rgba(255,255,255,0.04)` com `border: 1px solid rgba(255,255,255,0.08)`

### Elementos Visuais — 2 MOCKUPS

**Mockup 1 — Objeção de preço:**
- Lead: "Curti, mas tô meio apertado esse mês"
- Agente: "Entendo. Deixa eu te perguntar uma coisa antes da gente decidir: o que pesa mais hoje, o valor da mensalidade ou a sensação de gastar e não ir até o fim?"
- Lead: "Os dois, mas mais o segundo. Já paguei academia e não fui."
- Agente: "Faz sentido. É exatamente por isso que o método aqui é com planilha por semana e check-in. Tem o plano trimestral que dilui o investimento. Quer que eu te mande o link?"
- Tag em cima: "OBJEÇÃO DE PREÇO" (Mono 10px uppercase, cor `#C7D2FE`)

**Mockup 2 — Lembrete de aulão:**
- Bubble vespera 19h: "Celso, oi! Amanhã 20h tem o aulão \"Como começar a correr sem se machucar\". É ao vivo, tira dúvida ao vivo. Te vejo lá?"
- Bubble 1h antes: "Começa em 1h. Link: ▸ Se não puder agora, me avisa que eu te mando o replay."
- Tag em cima: "LEMBRETE AGENDADO"

**Bolhas no dark:** Lead bg `rgba(255,255,255,0.06)`, border `1px solid rgba(255,255,255,0.1)`, cor `#FAFAFA`. Agente bg `#4F46E5` cor `#FFFFFF`.

### Animações
- Pull quote: text reveal por palavra (cada palavra com fade-up 400ms, stagger 80ms), trigger 30% viewport, total ~1.5s
- Mockups: stagger entre os 2 (mockup 1 entra primeiro, 200ms depois mockup 2), scale 0.96 → 1 + fade
- Bolhas dentro de cada mockup: stagger 250ms

### Interatividade
- Hover pull quote: sublinhados das palavras destacadas pulsam (opacity 0.6 → 1, 800ms loop)
- Hover lista item: bullet ganha glow (`box-shadow: 0 0 8px rgba(199,210,254,0.6)`)

### Responsividade
- `≤ 960px`: grid colapsa para 1 coluna, lista "o que faz" vai abaixo do quote, mockups empilhados
- `≤ 640px`: pull quote reduz para `clamp(24px, 6vw, 36px)`, mockups full-width

---

## SEÇÃO 5 — AGENTE SUPORTE (DETALHADO)

### Arquétipo e Constraints
- **Arquétipo:** Layered (cards empilhados em Z com profundidade)
- **Constraints:** Card Stack visível (Estrutura) · Cream Background (Cor) · Reveal on Scroll (Movimento)
- **Justificativa:** Quebra do dark de S4 com warm cream. Cards empilhados sugerem "atendimento que se acumula em volume" — visualmente diferente das duas seções anteriores.

### Conteúdo
- Sobrelinha: "Peça 03 · Agente Suporte"
- Título: "O aluno tira dúvida com você, mesmo quando você não está."
- Subtítulo: "Mesma caixa, mesma voz. A diferença é que agora o contato é cliente."
- Lista "O que ele faz na prática" (6 ações)
- Card empilhado 1: Suporte de planilha (mockup conversa)
- Card empilhado 2: Escalada assunto sensível (mockup conversa)
- Lista "Por que isso importa" (4 itens)

### Layout
- Section: padding `var(--section-py) var(--container-px)`, background `#FFFAF0` (cream)
- Container: max-width 1380px
- Grid: `grid-template-columns: 5fr 7fr`, gap `clamp(48px, 6vw, 96px)`, align-items start
- **Coluna esquerda (5fr):** sobrelinha + título + subtítulo + 2 listas (sticky top 120px)
- **Coluna direita (7fr):** stack de 2 cards empilhados (offset um do outro)

### Tipografia
- Sobrelinha: Mono 12px uppercase letter-spacing 0.16em cor `#71717A`, com barra `#4F46E5`
- Título: Sora 600, `clamp(36px, 4.5vw, 72px)`, line-height 1.05, cor `#0A0A0A`
- Subtítulo: Space Grotesk 400 max-width 36ch cor `#52525B`
- Lista heading: Mono 12px uppercase letter-spacing 0.16em cor `#0A0A0A`
- Lista item: Space Grotesk 400 15px cor `#0A0A0A`, bullet `#4F46E5`

### Cores
- Background: `#FFFAF0`
- Card 1 (planilha): bg `#FFFFFF`, border `1px solid #E4E4E7`, shadow `0 10px 40px -12px rgba(0,0,0,0.1)`
- Card 2 (escalada): bg `#0F172A`, cor texto `#FAFAFA` (DARK CARD — contrasta com cream)
- Bullets/destaques: `#4F46E5`

### Elementos Visuais — STACK DE CARDS

**Card 1 — Planilha travada:**
- Position relative, transform `translateY(0) translateX(0) rotate(-1deg)`
- Padding 32px, border-radius 16px
- Tag topo: "DÚVIDA TÉCNICA · RESOLVIDO" (Mono 10px uppercase, cor `#4F46E5`)
- Bolhas:
  1. Aluno: "Não tô conseguindo abrir a planilha da semana 6"
  2. Agente: "Vamos resolver. Você tá tentando pelo celular ou computador? Aparece alguma mensagem?"
  3. Aluno: "Celular, dá erro de permissão"
  4. Agente: "É a permissão de download do Google. Faz o seguinte: abre o link no Chrome, toca nos três pontinhos no canto, vai em \"abrir em\" e escolhe Drive. Funciona?"

**Card 2 — Assunto sensível (DARK):**
- Position relative, margin-top -40px (overlap), transform `translateX(40px) rotate(2deg)`
- Padding 32px, border-radius 16px
- Tag topo: "ASSUNTO SENSÍVEL · ESCALADO PRO CELSO" (Mono 10px uppercase, cor `#FCA5A5`)
- Bolhas (em dark):
  1. Aluno: "Tô com uma dor no joelho depois do treino de quinta. Posso correr amanhã?"
  2. Agente: "Joelho não é assunto pra gente decidir por mensagem. Vou avisar o Celso aqui agora. Enquanto isso, descansa o treino de amanhã. Ele te responde ainda hoje."

### Animações
- Section entrada: stagger lateral (esquerda fade-right, direita fade-left), 800ms ease-out
- Card 1: scale 0.95 → 1, fade, rotate -1deg, 800ms ease-out, trigger 30%
- Card 2: delay 200ms após Card 1, mesma animação mas rotate 2deg

### Interatividade
- Hover Card 1: rotate(-1deg) → rotate(0deg) + translateY(-6px) + lift shadow, 500ms ease-magnetic
- Hover Card 2: rotate(2deg) → rotate(0deg) + translateY(-6px) + brilho border `rgba(252,165,165,0.4)`, 500ms ease-magnetic
- Mouse parallax sutil nos cards: ao mover mouse na seção, cards inclinam até ±2deg seguindo o cursor (CSS perspective + translateZ)

### Responsividade
- `≤ 960px`: grid 1 coluna; cards perdem rotate (mantêm vertical), margin-top entre eles 24px
- `≤ 640px`: cards ocupam 100% width, padding 20px

---

## SEÇÃO 6 — UMA PERSONA, TRÊS CABEÇAS

### Arquétipo e Constraints
- **Arquétipo:** Single Focus / Spotlight (uma única ideia central com tudo ao redor escurecido)
- **Constraints:** Type Hero secundário (Tipografia) · Single Element Diagram (Mídia) · Pulse Loop (Movimento)
- **Justificativa:** É o "ângulo central" da proposta — o diferencial. Precisa de muito espaço negativo e foco absoluto. Diagrama simples (1 nó central → 3 cabeças) ilustra literalmente o título.

### Conteúdo
- Sobrelinha: "O que diferencia"
- Título: "O cliente nunca sente que mudou de pessoa."
- Subtítulo: "Lead novo, comprador, aluno antigo: a voz é a mesma. A memória é a mesma."
- Lista "Como funciona" (4 pontos)
- Lista "Por que isso importa" (3 pontos)

### Layout
- Section: padding `clamp(120px, 14vw, 200px) var(--container-px)` (mais espaço vertical), background `#FBFAF9`
- Container: max-width 1100px (mais estreito que outras), centrado
- Header centralizado: max-width 800px, text-align center, margin-bottom 96px
- Diagrama central: 100% width container, height ~360px, position relative
- Listas abaixo do diagrama: 2 colunas (50/50), gap 64px, max-width 900px centrado

### Tipografia
- Sobrelinha: Mono 12px uppercase letter-spacing 0.16em cor `#71717A`, centralizado, com 2 linhas decorativas (uma de cada lado, 32px x 1px `#4F46E5`)
- Título: Sora 600, `clamp(40px, 5.5vw, 88px)`, line-height 1, letter-spacing -0.035em, max-width 18ch centralizado
- Subtítulo: Space Grotesk 400, `clamp(17px, 1.35vw, 22px)`, line-height 1.5, cor `#52525B`, max-width 50ch centralizado, margin-top 24px

### Cores
- Background: `#FBFAF9`
- Título: `#0A0A0A`
- Diagrama centro: `#4F46E5` (núcleo)
- Diagrama cabeças: `#0A0A0A` com label `#4F46E5`
- Linhas conectoras: `#E4E4E7` (com gradient para `#4F46E5` no centro)

### Elementos Visuais — DIAGRAMA

```
              [ SDR ]
                 |
                 |
[CLIENTE] -- [PERSONA CELSO] -- [SUPORTE]
                 |
                 |
              [ CLOSER ]
```

- **Centro:** círculo 120px diâmetro, bg `#0A0A0A`, texto branco "Persona Celso" (Sora 600 14px, line-height 1.1, padding 16px), com glow `box-shadow: 0 0 0 8px rgba(79,70,229,0.1), 0 0 0 24px rgba(79,70,229,0.05)`
- **3 nós (SDR, Closer, Suporte):** círculos 80px diâmetro, bg `#FFFFFF`, border `2px solid #4F46E5`, texto centralizado (Sora 500 13px cor `#0A0A0A`)
- **Linhas conectoras:** SVG path desenhado entre os nós e o centro, stroke `#4F46E5`, stroke-width 1.5, stroke-dasharray 4 4 (tracejado)
- **Posicionamento dos nós:** SDR top, Suporte right, Closer bottom (3 posições em volta do centro, equidistantes ~140px)
- Antes do diagrama, badge tag flutuante: "1 IA · 3 papéis" (Mono 11px uppercase, cor `#4F46E5`, border 1px solid `#4F46E5`, padding 6px 12px, border-radius 100px)

### Animações
- Núcleo pulse: `box-shadow` expande de 8/24px para 16/40px e volta, 3s ease-in-out infinite
- Linhas: `stroke-dashoffset` animado, draw SVG entrando da centro pra fora, stagger 200ms entre as 3 linhas, 1.2s ease-out, trigger 30% viewport
- 3 nós: scale 0 → 1 + fade, stagger 200ms após linhas conectarem, 600ms ease-magnetic
- Header: stagger entre sobrelinha (delay 0) → título (delay 100ms) → subtítulo (delay 200ms), fade-up 800ms

### Interatividade
- Hover nó (SDR/Closer/Suporte): bg `#4F46E5`, texto `#FFFFFF`, scale 1.08, 300ms ease-magnetic
- Hover núcleo: glow se intensifica (rings duplicam)
- Linhas conectoras pulsam (opacity 0.5 → 1) ao passar mouse na seção

### Responsividade
- `≤ 960px`: diagrama mantém estrutura mas reduz: centro 100px, nós 64px, distância 100px
- `≤ 640px`: diagrama vira layout vertical empilhado (centro em cima, 3 nós embaixo em coluna), conectores viram linhas verticais simples

---

## SEÇÃO 7 — POR QUE NÃO PARECE IA (CARD STACK 3 CAMADAS)

### Arquétipo e Constraints
- **Arquétipo:** Card Stack literal (3 cards empilhados representando as 3 camadas)
- **Constraints:** Layered Z-depth (Camadas) · Numbered Hierarchy (Tipografia) · Reveal on Hover (Interação)
- **Justificativa:** O conceito é "9 camadas de proteção". Mostrar literalmente como 3 cards empilhados (camada de naturalidade, camada de segurança, camada anti-ban) reforça a metáfora de profundidade técnica.

### Conteúdo
- Sobrelinha: "A engenharia por trás"
- Título: "Em dois projetos rodando, ninguém perguntou se era robô."
- Subtítulo: "Nove camadas de proteção. Resumo do que importa pra você."
- Camada 1: Naturalidade (4 itens)
- Camada 2: Segurança (4 itens)
- Camada 3: Anti-ban (3 itens)

### Layout
- Section: padding `var(--section-py) var(--container-px)`, background `#0F172A` (dark)
- Container: max-width 1380px
- Header: max-width 720px, margin-bottom 80px (não centralizado — alinhado à esquerda)
- Stack container: max-width 900px centrado, position relative, perspective 1200px
- Cards: position absolute, transformOrigin top center; primeiro card no topo, outros offset com `translateY(56px * index)` e `scale(1 - index * 0.05)` e `translateZ(-index * 40px)`

### Tipografia
- Sobrelinha: Mono 12px uppercase letter-spacing 0.16em cor `#A1A1AA`
- Título: Sora 600, `clamp(28px, 3vw, 48px)`, line-height 1.1, cor `#FAFAFA`, max-width 22ch
- Subtítulo: Space Grotesk 400 18px cor `#A1A1AA`
- Card numero "01/02/03": Sora 800, `clamp(64px, 8vw, 120px)`, line-height 1, opacity 0.15, cor `#C7D2FE`, position absolute top-right
- Card título "Naturalidade/Segurança/Anti-ban": Sora 600 28px cor `#FAFAFA`, letter-spacing -0.02em
- Card item: Space Grotesk 400 15px cor `#FAFAFA`, padding-left 24px, com `::before` quadrado 6px `#4F46E5`

### Cores
- Background section: `#0F172A`
- Cards: bg `#1E1B4B` com border `1px solid rgba(255,255,255,0.08)`, shadow profunda
- Card hover/active: bg `#252152`, border `1px solid rgba(199,210,254,0.3)`

### Elementos Visuais
- Cards: padding 40px, border-radius 16px, min-height 280px
- Cada card tem o número gigante (`01`, `02`, `03`) opaco no canto superior direito
- Stack height total: ~560px (com scaling visível)

### Animações
- Entrada: stack inteiro fade-in, depois cards expandem (cada um sai do empilhamento e ocupa sua posição final na ordem)
- Trigger 30% viewport: card 1 sobe primeiro com expand, depois card 2 (delay 300ms), depois card 3 (delay 600ms)
- Reveal sequence: 800ms ease-magnetic, transform completion

### Interatividade
- Hover card: o card hovered ganha `translateY(-8px)`, `scale(1)` (volta ao tamanho cheio se estava reduzido), brings to front (z-index 10), border brilha
- Cards não-hovered: `opacity: 0.6`, ficam mais para trás
- Click card (mobile): toggla expansão
- Cursor sobre stack: cursor "pointer" + magnetic effect (cards seguem ligeiramente o mouse)

### Responsividade
- `≤ 960px`: cards perdem stack 3D e viram lista vertical empilhada (gap 16px, sem rotate, sem perspective)
- `≤ 640px`: padding interno cards 24px, número opaco reduz para 64px

---

## SEÇÃO 8 — CRM PRÓPRIO

### Arquétipo e Constraints
- **Arquétipo:** Editorial (revista — coluna texto + showcase visual)
- **Constraints:** Mockup UI (Mídia) · Annotated Screenshot (Estrutura) · Numbered Bullets (Tipografia)
- **Justificativa:** CRM é produto visual; precisa mostrar a interface. Layout editorial com mockup do Kanban à direita e features explicadas à esquerda numa lista bem tipografada.

### Conteúdo
- Sobrelinha: "O que vem junto"
- Título: "Você não recebe só o agente. Recebe o painel inteiro."
- Subtítulo: "Tudo na sua infra, com seu domínio, sua marca."
- Lista 6 features: Kanban do funil · Timeline por contato · Broadcasts agendados · Persona editável · Custo de IA em tempo real · Exportação
- Bloco "Por que isso importa": 3 itens

### Layout
- Section: padding `var(--section-py) var(--container-px)`, background `#FBFAF9`
- Container: max-width 1380px
- Grid: `grid-template-columns: 5fr 7fr`, gap `clamp(48px, 6vw, 96px)`, align-items start
- **Coluna esquerda:** sobrelinha + título + subtítulo + lista de features (numerada) + bloco "por que importa"
- **Coluna direita:** mockup Kanban estilizado

### Tipografia
- Sobrelinha: Mono 12px uppercase letter-spacing 0.16em cor `#71717A`
- Título: Sora 600, `clamp(28px, 3vw, 48px)`, line-height 1.1, cor `#0A0A0A`, max-width 18ch
- Lista item número: Mono 11px uppercase letter-spacing 0.1em cor `#4F46E5` weight 500 (ex: "01")
- Lista item nome: Sora 500 18px cor `#0A0A0A`
- Lista item descrição: Space Grotesk 400 15px cor `#52525B`, line-height 1.55, margin-top 4px

### Cores
- Background: `#FBFAF9`
- Mockup container: bg `#FFFFFF`, border `1px solid #E4E4E7`, shadow generosa

### Elementos Visuais — MOCKUP KANBAN

- Container: aspect-ratio 16/10, border-radius 16px, padding 24px, bg `#FFFFFF`
- Header do mock: barra com "Kairós CRM" (Sora 500 14px) + 3 dots window-style (vermelho/amarelo/verde) à esquerda
- Body: 4 colunas Kanban: "Lead Novo" (3 cards) · "Em Qualificação" (2 cards) · "Quente" (2 cards) · "Cliente" (4 cards)
- Cada coluna: header label (Mono 10px uppercase letter-spacing 0.12em, cor diferente: roxo/laranja/amarelo/verde) + count badge (Mono 11px)
- Cards mini: bg `#FBFAF9`, border `1px solid #E4E4E7`, padding 10px, border-radius 6px, mostram avatar (gradient circle) + nome (Space Grotesk 400 12px) + tag pequena
- Annotation lines: linhas finas saindo das features da coluna esquerda apontando para áreas do mockup (SVG paths animados, opcional desktop only)

### Animações
- Entrada: coluna esquerda fade-right + coluna direita fade-left, stagger 100ms, 800ms ease-out
- Lista: cada item entra com stagger 80ms entre si
- Mockup: scale 0.96 → 1 + fade, 700ms
- Cards Kanban: stagger 50ms, fade-up dentro de cada coluna

### Interatividade
- Hover lista item: número muda cor `#4F46E5` → `#0A0A0A`, e nome ganha sublinhado animado
- Hover mockup card mini: lift -2px com sombra suave
- Cursor sobre Kanban columns: pode "scroll" horizontalmente se mais colunas (overflow scroll suave)

### Responsividade
- `≤ 960px`: grid 1 coluna, mockup vai abaixo
- `≤ 640px`: mockup mostra apenas 2 colunas iniciais (overflow scroll horizontal)

---

## SEÇÃO 9 — COMO FUNCIONA (TIMELINE 15 DIAS)

### Arquétipo e Constraints
- **Arquétipo:** Timeline (Estrutura especial)
- **Constraints:** Horizontal Scroll Track (Layout) · Numbered Phases (Tipografia) · Progress Bar (Estrutura) · Scroll-driven animation (Movimento)
- **Justificativa:** Cronograma é literalmente uma timeline. Apresentar como linha horizontal com fases reforça o "15 dias" como um caminho curto e definido.

### Conteúdo
- Sobrelinha: "O cronograma"
- Título: "15 dias do \"fechou\" até o agente ligado em volume pleno."
- Subtítulo: "Sem improviso. Cada bloco tem entrega clara."
- 4 fases:
  - Dias 1-3: Imersão
  - Dias 4-10: Construção
  - Dias 11-15: Calibração
  - A partir do dia 16: Operação

### Layout
- Section: padding `var(--section-py) var(--container-px)`, background `#FBFAF9`
- Container: max-width 1480px
- Header: max-width 800px, margin-bottom 96px
- Timeline track: position relative, height ~360px desktop
- Track baseline: horizontal line `2px x 100%`, bg `#E4E4E7`, top center
- Filled progress: linha colorida `#4F46E5` que cresce com scroll-driven animation (animation-timeline: view())
- 4 nodes: position absolute, distribuídos com left % proporcional aos dias (1-3 = ~10%, 4-10 = ~40%, 11-15 = ~70%, 16+ = ~95%)

### Tipografia
- Sobrelinha: Mono 12px uppercase letter-spacing 0.16em cor `#71717A`
- Título: Sora 600, `clamp(36px, 4.5vw, 72px)`, line-height 1.05, cor `#0A0A0A`, max-width 22ch
- Phase label "Dias X a Y": Mono 11px uppercase letter-spacing 0.14em cor `#4F46E5` weight 500
- Phase name: Sora 600 22px cor `#0A0A0A`, margin-top 8px
- Phase desc: Space Grotesk 400 14px cor `#52525B`, line-height 1.55, max-width 28ch, margin-top 12px

### Cores
- Background: `#FBFAF9`
- Track inactive: `#E4E4E7`
- Track active (progress): `#4F46E5`
- Node default: bg `#FFFFFF`, border `2px solid #E4E4E7`
- Node active (passed): bg `#4F46E5`, border `2px solid #4F46E5`
- Node label: `#0A0A0A`

### Elementos Visuais — TIMELINE
- Track horizontal: 2px height
- 4 nodes: círculos 24px diâmetro, posicionados na track
- Cada node tem um pin vertical de 24px conectando ao card de fase abaixo
- Cards de fase: bg transparente, padding-top 32px, max-width 240px, alinhados pela posição do node
- Date markers (números): "01", "10", "15", "16+" aparecem abaixo do node (Mono 13px cor `#71717A`)

### Animações
- Track progress: usa `animation-timeline: view(block)` CSS nativo — a linha colorida cresce conforme a section entra no viewport (de width 0% a 100% conforme scroll)
- Nodes: ao serem "alcançados" pela linha colorida, `scale(0.8 → 1.2 → 1)` com fill animado (border + bg para `#4F46E5`), 600ms ease-magnetic
- Cards de fase: fade-up 600ms, stagger calculado para sincronizar com o passage do progress (cada card aparece quando seu node fica ativo)
- Header: stagger normal entrada

### Interatividade
- Hover node: scale 1.15, ring expandido (`box-shadow: 0 0 0 6px rgba(79,70,229,0.15)`), 300ms
- Hover card de fase: opacity dos outros cards diminui para 0.4, focus no hovered, 400ms
- Click node (mobile): expande detalhe do card (toggle)

### Responsividade
- `≤ 960px`: timeline vira vertical (stack com linha vertical à esquerda, cards à direita), mantém node + progress fill
- `≤ 640px`: simplifica — apenas linha vertical com 4 fases empilhadas

---

## SEÇÃO 10 — CASES REAIS

### Arquétipo e Constraints
- **Arquétipo:** Case Study (mídia mostrando processo/resultado)
- **Constraints:** Split com Overlap (Layout) · Stat Highlight (Tipografia) · Color-coded blocks (Cor)
- **Justificativa:** Dois cases são prova social. Apresentar como dois "blocos de relatório" lado a lado com números em destaque, não como depoimento com foto circular (proibido).

### Conteúdo
- Sobrelinha: "Não é promessa"
- Título: "Dois projetos rodando agora, com estes números."
- Case 1 — MEDSimple (todas as infos da copy)
- Case 2 — Instituto IRD (todas as infos da copy)

### Layout
- Section: padding `var(--section-py) var(--container-px)`, background `#0F172A` (dark)
- Container: max-width 1480px
- Header: max-width 720px, margin-bottom 96px
- Grid: 2 colunas iguais, gap 32px (cada caso ocupa 1 coluna em desktop)
- Cada case-card: padding 48px, border-radius 16px, min-height 600px, bg `#1E1B4B` border `1px solid rgba(255,255,255,0.08)`

### Tipografia
- Sobrelinha: Mono 12px uppercase letter-spacing 0.16em cor `#A1A1AA`
- Título: Sora 600, `clamp(28px, 3vw, 48px)`, cor `#FAFAFA`, max-width 22ch
- Case header (nome do projeto): Sora 700, 36px, cor `#FAFAFA`, letter-spacing -0.02em
- Case tagline (o que é): Space Grotesk 400 16px cor `#A1A1AA`, margin-top 4px
- Stat number (50K+, R$ 200-400 etc): Sora 700, 56px, line-height 1, color gradient `linear-gradient(135deg, #C7D2FE, #4F46E5)` com `background-clip: text`
- Stat label: Mono 11px uppercase letter-spacing 0.14em cor `#A1A1AA`
- Field row label (Persona, Canal, etc): Mono 11px uppercase cor `#A1A1AA`, weight 500
- Field row value: Space Grotesk 500 14px cor `#FAFAFA`
- Field "O que faz": Space Grotesk 400 15px line-height 1.55 cor `#FAFAFA`

### Cores
- Background section: `#0F172A`
- Case card bg: `#1E1B4B`
- Stats gradient: `#C7D2FE → #4F46E5`
- Borders internos: `rgba(255,255,255,0.08)`

### Elementos Visuais por Case

**Case 1 — MEDSimple:**
- Header: nome + tagline + tag "EM PRODUÇÃO" (Mono 10px, bg `rgba(74,222,128,0.15)` border `1px solid #4ADE80`, cor `#4ADE80`, padding 4px 10px, border-radius 100px)
- Stats trio (top): "50k+ alunos" · "<1s resposta" · "R$ 200-400 IA/mês"
- Specs (lista field-value):
  - Persona: Luiza
  - Canal: Instagram DM @medsimple_
  - Stack: Claude Sonnet 4.6
- Bloco "O que faz": parágrafo
- Mini gráfico decorativo: 3 barras verticais representando funil (Lead → Qualificado → Cliente), height variável

**Case 2 — Instituto IRD:**
- Header: nome + tagline + tag "EM PRODUÇÃO"
- Stats trio: "Persona Camila" · "<10min primeira mensagem" · "R$ 600-1.2k IA/mês"
- Specs:
  - Funil: ebook grátis → ebook pago → aulão grátis → trial → assinatura R$ 249-2.410
  - Canal: WhatsApp + CRM web próprio
  - Stack: Claude Sonnet 4.5 · Python + FastAPI · Supabase · Evolution API · React
- Bloco "O que faz": parágrafo
- Mini diagrama Kanban (4 colunas verticais com chips simulando contatos)

### Animações
- Cards entram com stagger 200ms (Case 1 primeiro, Case 2 depois), fade-up + scale 0.97 → 1, 800ms
- Stats numbers: counter animation (de 0 ao valor real), 1.4s ease-out, trigger 40% viewport
- Gradient nos stats: subtle shimmer (gradient-position animado), 4s loop infinite
- Mini gráficos/diagramas: bars/cards com stagger interno

### Interatividade
- Hover case-card: lift `translateY(-6px)`, border `rgba(199,210,254,0.3)`, shadow profunda
- Hover stat: scale 1.05, gradient brilha mais

### Responsividade
- `≤ 960px`: 1 coluna, cards empilhados verticalmente
- `≤ 640px`: padding cards 24px, stats viram coluna vertical

---

## SEÇÃO 11 — INVESTIMENTO

### Arquétipo e Constraints
- **Arquétipo:** Type Hero secundário + Receipt (extrato/fatura visual)
- **Constraints:** Big Number (Tipografia >120px) · Itemized List (Estrutura) · Asymmetric Padding (Layout)
- **Justificativa:** Investimento merece destaque numérico próprio (R$ 5.000 grande). Layout estilo "fatura/extrato" comunica transparência total — sem letra miúda.

### Conteúdo
- Sobrelinha: "Os números, sem letra miúda"
- Título: "Um pagamento de fechamento. Operação com custo variável."
- Subtítulo: "Você paga o que custa rodar. Sem mensalidade inflada de SaaS."
- Bloco Fechamento: R$ 5.000 — descrição completa do que inclui
- Bloco Custos mensais variáveis (4 itens): VPS R$ 67 · Chip R$ 20 · Manutenção R$ 250 · Tokens (variável)
- Bloco "Como ler o custo de tokens": parágrafo com referências MEDSimple/IRD
- Resumo final (caixa destacada): Fechamento R$ 5.000 · Fixo mensal R$ 337 · Variável estimado R$ 200-600
- Linha "Sem validade. A proposta fica de pé enquanto fizer sentido pra você."

### Layout
- Section: padding `clamp(120px, 14vw, 200px) var(--container-px)`, background `#FBFAF9`
- Container: max-width 1280px
- Grid header: 1 coluna, max-width 800px, margin-bottom 80px
- Grid body: `grid-template-columns: 1fr 1fr`, gap `clamp(32px, 4vw, 64px)`, align-items start
- **Coluna esquerda:** Bloco Fechamento (com R$ 5.000 GIGANTE) + texto descritivo
- **Coluna direita:** Bloco Custos mensais (lista itemizada) + bloco "como ler tokens"
- Resumo final: full-width abaixo do grid, caixa destacada, padding 48px, border-radius 16px, bg `#0F172A` cor `#FAFAFA`

### Tipografia
- Sobrelinha: Mono 12px uppercase letter-spacing 0.16em cor `#71717A`
- Título: Sora 600, `clamp(36px, 4.5vw, 72px)`, line-height 1.05, cor `#0A0A0A`, max-width 22ch
- **Big Number "R$ 5.000":** Sora 700, `clamp(80px, 11vw, 180px)`, line-height 0.95, letter-spacing -0.04em, cor `#0A0A0A`, com "R$" em peso 400 e tamanho menor (50%)
- Big Number sublinha: "Pagamento único" (Mono 12px uppercase letter-spacing 0.16em cor `#4F46E5`)
- Bloco label: Mono 11px uppercase letter-spacing 0.14em cor `#71717A` weight 500
- Custos item: Space Grotesk 400 15px cor `#0A0A0A`, com `::after` valor (Mono 14px weight 500 cor `#0A0A0A`)
- Resumo bloco título: Sora 600 24px cor `#FAFAFA`
- Resumo linha label: Mono 11px uppercase cor `#A1A1AA`
- Resumo linha valor: Sora 600 32px cor `#FAFAFA` (ou `#C7D2FE` no variável)

### Cores
- Section bg: `#FBFAF9`
- Big number: `#0A0A0A`
- Bloco custos itens: separadores `1px dashed #E4E4E7`
- Resumo bloco bg: `#0F172A`
- Resumo accent (valor variável): `#C7D2FE`

### Elementos Visuais
- Bloco Fechamento: padding 48px, border `1px solid #E4E4E7`, border-radius 16px, bg `#FFFFFF`
- Bloco Custos: padding 32px, lista com border separators
- Cada item de custo:
  - Linha 1: nome (esquerda) ··· valor (direita) — separador pontilhado entre eles
  - Linha 2: descrição em `#71717A` 13px (opcional, para tokens)
- Detalhes decorativos: pequeno `#` em mono no canto de cada bloco como id ("# 01", "# 02", etc)

### Animações
- Big Number "R$ 5.000": counter animation (0 → 5000), 1.4s ease-out, trigger 40% viewport
- Itens custos: stagger 80ms, fade-up
- Resumo bloco: scale 0.97 → 1, fade, 800ms, com shadow growing

### Interatividade
- Hover Big Number: subtle pulse (scale 1 → 1.02), 600ms
- Hover item custo: bg `rgba(79,70,229,0.04)` (highlight sutil), 200ms
- Hover resumo bloco: shadow mais profunda

### Responsividade
- `≤ 960px`: grid 1 coluna, big number fica menor (`clamp(64px, 14vw, 100px)`), resumo bloco ainda full-width
- `≤ 640px`: padding interno reduzido, items custo viram bloco (label em cima, valor embaixo)

---

## SEÇÃO 12 — O QUE NÃO ESTÁ INCLUÍDO

### Arquétipo e Constraints
- **Arquétipo:** Sparse / Minimal (poucos elementos, máximo respiro)
- **Constraints:** Strikethrough Items (Tipografia) · Generous Whitespace (Layout) · Single Color (Cor)
- **Justificativa:** Honestidade merece sobriedade. Lista clara dos exclusos sem decoração — mostra confiança em vender sem esconder.

### Conteúdo
- Sobrelinha: "Pra ficar honesto"
- Título: "O que essa proposta não cobre."
- 4 itens com nome + explicação: Tráfego pago · Produção de criativo · Plataforma de curso · Atendimento humano residual
- Linha de fechamento: "Tudo o que está na proposta acima, está incluído. Tudo o que não está, eu te falo antes de qualquer surpresa."

### Layout
- Section: padding `clamp(120px, 14vw, 180px) var(--container-px)`, background `#FBFAF9`
- Container: max-width 1100px
- Header: max-width 700px, margin-bottom 80px
- Lista: max-width 800px, com border-top `1px solid #E4E4E7` no topo
- Cada item: padding 32px 0, border-bottom `1px solid #E4E4E7`, display grid `120px 1fr`, gap 32px
- Linha fechamento: max-width 600px, padding-top 64px

### Tipografia
- Sobrelinha: Mono 12px uppercase letter-spacing 0.16em cor `#71717A`
- Título: Sora 600, `clamp(36px, 4.5vw, 72px)`, line-height 1.05, cor `#0A0A0A`
- Item label esquerda: Mono 11px uppercase letter-spacing 0.14em cor `#71717A` weight 500 (ex: "01 / FORA")
- Item nome: Sora 600 22px cor `#0A0A0A`, com strikethrough sutil `text-decoration: line-through; text-decoration-color: rgba(228,228,231,0.6); text-decoration-thickness: 2px`
- Item descrição: Space Grotesk 400 15px cor `#52525B`, line-height 1.6, margin-top 8px
- Linha fechamento: Space Grotesk 400 italic 16px cor `#52525B`, line-height 1.6

### Cores
- Background: `#FBFAF9`
- Linhas separadoras: `#E4E4E7`
- Strikethrough: `rgba(228,228,231,0.6)` (sutil, não agressivo)

### Elementos Visuais
- Strikethrough nos nomes dos itens excluídos — comunica visualmente que está fora do escopo, sem usar "X" ou "✗"
- Linha de fechamento separada por padding generoso, com pequeno mark em mono "·" antes

### Animações
- Itens entram com stagger 150ms entre si, fade-up 600ms ease-out, trigger 30%
- Strikethrough anima: width 0 → 100% (draw effect), 600ms ease-out, delay após item entrar (200ms)

### Interatividade
- Hover item: bg `rgba(0,0,0,0.02)` (highlight sutil), 200ms — strikethrough fica mais escuro `rgba(82,82,91,0.4)`

### Responsividade
- `≤ 640px`: grid item vira 1 coluna, label em cima do nome

---

## SEÇÃO 13 — PRÓXIMOS PASSOS

### Arquétipo e Constraints
- **Arquétipo:** Type Hero suave (encerramento volta ao protagonismo da tipografia)
- **Constraints:** Centered Statement (Layout) · Typewriter Reveal (Movimento) · Numbered Steps (Estrutura)
- **Justificativa:** Fechamento precisa ter peso emocional sem virar CTA agressivo. Tipografia centralizada + 4 passos numerados em formato lista de check-in transmitem "tá nas suas mãos".

### Conteúdo
- Sobrelinha: "Daqui pra frente"
- Título: "A bola tá com você, Celso."
- Subtítulo: "Vamos conversar pelo que faz sentido pra sua corrida."
- 4 passos numerados:
  1. Você roda pelo material acima com calma, com qualquer outra pessoa que decide com você
  2. Me devolve as dúvidas que sobraram (técnicas, comerciais, de cronograma)
  3. Se fizer sentido, a gente alinha data de início e eu te mando o contrato
  4. Em 15 dias, o agente tá ligado
- Bloco final "Como me chamar": "Mesmo canal que a gente já tá conversando. Sem formulário, sem funil. Você responde quando quiser."

### Layout
- Section: padding `clamp(140px, 16vw, 220px) var(--container-px) clamp(80px, 10vw, 120px)`, background `#FBFAF9`
- Container: max-width 1100px, centrado
- Header: max-width 800px, text-align center, margin-bottom 96px
- Lista passos: max-width 640px centrado, cada item display flex com número à esquerda + texto
- Bloco "Como me chamar": max-width 480px centrado, margin-top 96px, padding 32px, border-top `1px solid #E4E4E7` (centrado por margin auto), text-align center

### Tipografia
- Sobrelinha: Mono 12px uppercase letter-spacing 0.16em cor `#71717A`, centralizada
- Título: Sora 600, `clamp(48px, 6.5vw, 104px)`, line-height 0.98, letter-spacing -0.035em, cor `#0A0A0A`, "Celso" em italic + cor `#4F46E5`
- Subtítulo: Space Grotesk 400, `clamp(17px, 1.35vw, 22px)`, line-height 1.5, cor `#52525B`, max-width 40ch centralizado
- Passo número: Sora 700 28px cor `#4F46E5`, line-height 1, width 48px (alinhamento)
- Passo texto: Space Grotesk 400, 17px, line-height 1.55, cor `#0A0A0A`
- "Como me chamar" título: Mono 11px uppercase letter-spacing 0.14em cor `#71717A`
- "Como me chamar" texto: Space Grotesk 400 italic 16px cor `#52525B`, line-height 1.6

### Cores
- Background: `#FBFAF9`
- Título: `#0A0A0A` com "Celso" em `#4F46E5`
- Números dos passos: `#4F46E5`

### Elementos Visuais
- Cada passo: padding-bottom 24px, separado por gap 32px
- Bloco final: enquadrado por linha decorativa fina top + bottom (1px `#E4E4E7`)
- Detalhe: dot pulse pequeno (8px `#4F46E5`) antes da sobrelinha, mesmo padrão do hero

### Animações
- Título: typewriter reveal palavra por palavra, mas SUTIL — cada palavra com fade-up + opacity 0 → 1, stagger 100ms
- "Celso" tem destaque extra: scale 1.05 brevemente após aparecer (650ms ease-out)
- Passos: stagger 200ms entre si, fade-up + slide-from-left 12px, 600ms ease-out
- Bloco "Como me chamar": fade-up 800ms com delay grande (~1.5s após passos)

### Interatividade
- Hover passo: número escurece (`#4F46E5` → `#3730A3`), texto sublinha sutilmente
- Sem CTAs/botões — o "como me chamar" é informacional, leve

### Responsividade
- `≤ 640px`: título reduz para `clamp(36px, 8vw, 56px)`, passos mantêm formato
- Espaçamentos verticais reduzidos proporcionalmente

---

## RODAPÉ

### Arquétipo e Constraints
- **Arquétipo:** Sparse / Editorial Mark
- **Constraints:** Mono accent (Tipografia) · Single Line (Layout)

### Conteúdo
- "Construído por Victor Viana — agentes de IA para WhatsApp e Instagram."
- Linha técnica: "Kairós Operação · Proposta v1 · Abril 2026"

### Layout
- Padding: 64px `var(--container-px)` 48px
- Background: `#0A0A0A`
- Container: max-width 1380px, display flex justify-between align-center, gap 32px

### Tipografia
- Crédito: Space Grotesk 400 14px cor `#A1A1AA`, "Victor Viana" em weight 500 cor `#FAFAFA`
- Linha técnica: Mono 11px uppercase letter-spacing 0.14em cor `#52525B`

### Animações
- Sem animação de entrada (sempre presente no fim)

### Interatividade
- Hover "Victor Viana": underline (text-decoration animado)

### Responsividade
- `≤ 640px`: flex column, gap 16px, text-align left

---

## ELEMENTOS GLOBAIS DE ENCANTAMENTO

### Cursor customizado (DESKTOP only)
- Cursor padrão: dot 8px `#4F46E5` com ring 32px outline `1px solid rgba(79,70,229,0.3)`
- Hover sobre interativos (links, cards, nodes): ring expande para 48px e fill com `rgba(79,70,229,0.08)`
- Mix-blend-mode: difference em fundos escuros (cursor inverte cor)

### Scroll Progress Indicator
- Barra fina `2px x 100vw` no topo da viewport (abaixo da topbar)
- Bg `rgba(0,0,0,0.04)`, fill `#4F46E5`
- Width: 0% → 100% conforme scroll global da página
- Position fixed top 47px (logo abaixo da topbar)

### Section Anchor Marks (DESKTOP only)
- Pequenos marcadores no canto direito da viewport: 13 dots verticais (S1 a S13)
- Cada dot 6x6 `#E4E4E7`, dot ativo `#4F46E5` com ring expandido
- Hover dot: tooltip com nome da seção (Mono 11px uppercase, bg `#0A0A0A` cor `#FAFAFA`, padding 6px 10px, border-radius 4px)
- Click dot: scroll suave para a seção

### Noise overlay (sutil)
- Body::after: position fixed, inset 0, pointer-events none, z-index 100
- Background: SVG noise pattern (turbulence + feColorMatrix) com opacity 0.025
- Adiciona textura premium sem distrair

### View Timeline animations (CSS nativo)
- Onde possível, usar `animation-timeline: view(block)` em vez de Intersection Observer JS
- Reduz JS, melhora performance, fluido com scroll

### Reduced motion
- Wrapper `@media (prefers-reduced-motion: reduce)`: anular todos os keyframes, manter apenas opacity transitions

---

## RESUMO DE ARQUÉTIPOS POR SEÇÃO

| # | Seção | Arquétipo | Background |
|---|---|---|---|
| S1 | Hero | Type Hero | Light |
| S2 | 4 Peças | Bento Box | Light |
| S3 | SDR | Split Vertical | Light |
| S4 | Closer | Editorial | **Dark** |
| S5 | Suporte | Layered Card Stack | **Cream** |
| S6 | Persona | Single Focus / Spotlight | Light |
| S7 | Não parece IA | Card Stack 3 layers | **Dark** |
| S8 | CRM | Editorial (Mockup UI) | Light |
| S9 | Cronograma | Timeline (horizontal) | Light |
| S10 | Cases | Case Study (Split) | **Dark** |
| S11 | Investimento | Type Hero (Big Number) + Receipt | Light |
| S12 | NÃO inclui | Sparse / Minimal | Light |
| S13 | Próximos passos | Type Hero suave (centered) | Light |
| Footer | Editorial Mark | **Dark** | |

**Variedade:** 12 arquétipos diferentes em 13 seções. Nenhum consecutivo repete.

**Ritmo de fundo:** Light → Light → Light → **Dark** → Cream → Light → **Dark** → Light → Light → **Dark** → Light → Light → Light → **Dark**. Cria respiração visual e marca seções importantes (Closer, "Não parece IA", Cases, Footer) com peso.

---

## CHECKLIST DE EXECUÇÃO PARA `/desenvolver`

- [ ] Criar `app.js` para: Intersection Observer (entrada de seções), counter animations (S10, S11), cursor customizado, scroll progress indicator, anchor marks
- [ ] Adicionar fontes: Sora, Space Grotesk, JetBrains Mono (já carregadas via CSS)
- [ ] Implementar todas as animações com timing exato
- [ ] Garantir responsividade nos 4 breakpoints
- [ ] Testar prefers-reduced-motion
- [ ] Verificar contraste em todas as combinações cor/fundo (WCAG AA mínimo)
- [ ] Validar HTML semântico (headings hierárquicos, landmarks)
- [ ] Otimizar imagens/SVGs inline para mockups
- [ ] Adicionar meta tags OG para preview no WhatsApp/Insta (caso Celso compartilhe)
- [ ] Smooth scroll global e ancoras dos cards do bento (S2 → S3/S4/S5/S8)
