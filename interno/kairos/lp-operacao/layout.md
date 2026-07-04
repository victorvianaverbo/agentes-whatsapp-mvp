# Layout — IA Especialista para Alunos

---

## Especificacoes Globais

### Font System
- Heading: Sora, wght 300–800
- Body: Space Grotesk, wght 300–700
- Fallback: system-ui, sans-serif
- Antialiasing: -webkit-font-smoothing: antialiased

### Paleta de Cores
- --bg-light: #FBFAF9
- --bg-white: #FFFFFF
- --bg-dark: #0F172A
- --bg-card: #1E293B
- --text-dark: #1A1A1A
- --text-muted: #52525B
- --text-on-dark: #E2E8F0
- --text-muted-dark: #94A3B8
- --accent: #4F46E5
- --accent-hover: #4338CA
- --accent-light: #818CF8
- --accent-glow: rgba(79, 70, 229, .18)
- --success: #10B981
- --error: #EF4444
- --border-light: #E5E7EB
- --border-dark: #334155

### Espacamento
- Section padding vertical: clamp(5rem, 12vw, 9rem)
- Container max-width texto: 760px
- Container max-width grid: 1100px
- Container max-width hero: 1280px
- Container padding horizontal: clamp(1.25rem, 5vw, 2rem)

### Breakpoints
- Mobile: < 640px
- Tablet: 640px – 899px
- Desktop: >= 900px
- Wide: >= 1200px

### Animacoes Padrao (AOS)
- Duration: 800ms
- Easing: ease-out-cubic
- Offset: 50px
- Once: true
- disableMutationObserver: true

### Cantos
- --radius-sm: 6px
- --radius-md: 12px
- --radius-lg: 20px
- --radius-xl: 28px

---

## Secao 1: Hero (JA IMPLEMENTADA)

### Arquetipo e Constraints
- Arquetipo: Split Assimetrico (60/40)
- Constraints: Selective Color / Gradient Text (Tipografia), Grid Pattern (Efeitos), Accent Glow (Cor)
- Justificativa: O split cria hierarquia clara — headline domina a esquerda, mockup demonstra o produto a direita. O grid pattern sutil da textura tech sem poluir.

### Fundo
- Background: var(--bg-light) #FBFAF9
- Grid pattern: linhas de 1px cor rgba(79,70,229,.03) em grid 60x60px
- Glow: radial-gradient ellipse top-right rgba(79,70,229,.06) → transparent 65%, posicao top:-15% right:-10%, width:50vw height:60vh

### Layout (APROVADO — manter exatamente como esta)
- Grid: 1fr (mobile) → 1.15fr 0.85fr (desktop 900px+)
- Gap: 3rem (mobile) → 3.5rem (desktop)
- min-height: 100vh no desktop
- Padding: clamp(6rem,12vw,8rem) top clamp(1.25rem,5vw,3rem) sides clamp(3rem,8vw,5rem) bottom

### Chat Mockup (APROVADO — manter)
- 6 mensagens animadas sobre investimentos/Selic
- Delays: 0.6s, 1.8s, 3s, 4.2s, 5.4s, 6.6s
- Animacao float: translateY(0) → translateY(-6px), 6s ease-in-out infinite
- Glow: radial-gradient circle accent-glow 300×300px blur(40px) atras do mockup

---

## Secao 2: O Problema (JA IMPLEMENTADA)

### Arquetipo e Constraints
- Arquetipo: Single Focus
- Constraints: Stagger (Movimento), Selective Color (Cor)
- Justificativa: Foco unico na dor — cada passo se revela em sequencia, criando tensao crescente.

### Fundo
- Background: #FFFFFF
- border-top: 1px solid var(--border-light)

### Layout (APROVADO — manter)
- Container: max-width 760px centralizado
- 4 steps verticais com numeracao 01–04
- Conclusao em bloco escuro com border-left accent
- Stagger delays: 150ms, 250ms, 350ms, 450ms

---

## Secao 3: O Que Muda Com Uma IA Especialista

### Arquetipo e Constraints
- Arquetipo: Split com Overlap
- Constraints: Dark Mode (Cor), Bleed Right (Layout), Fade Up (Movimento)
- Justificativa: Transicao dramatica para dark mode apos a dor cria alivio visual. O split mostra a transformacao: texto explica, visual demonstra. O overlap entre texto e visual cria conexao.

### Conteudo
- Titulo: "E se seus alunos tivessem voce no bolso — sem precisar de voce?"
- Paragrafo 1: "Eu pego todo o conteudo do seu curso — cada capitulo, cada aula, cada apostila — e construo uma IA que domina esse conhecimento tao bem quanto voce."
- Paragrafo 2: "Quando o aluno manda 'meu filho de 3 anos nao larga o tablet, o que eu faco?' as 23h, a IA nao responde com um FAQ generico. Ela busca no capitulo 7 do seu livro, cruza com o conteudo da aula 12 e entrega uma orientacao com a mesma profundidade que voce daria."
- Frase destaque: "No WhatsApp. Na hora. Sem voce levantar do sofa."

### Fundo
- Background: var(--bg-dark) #0F172A
- Mesma noise/grid do hero mas com opacidade menor: rgba(255,255,255,.02) linhas 80×80px
- Glow sutil bottom-left: radial-gradient rgba(79,70,229,.06) 50vw 40vh

### Layout
- Container: max-width 1280px
- Grid: 1fr (mobile) → 1fr 1fr (desktop 900px+)
- Gap: 3rem (mobile) → 5rem (desktop)
- Texto alinhado a esquerda com max-width 520px
- Visual (direita): elemento decorativo representando a busca no conteudo

### Visual (direita)
- Card simulando "busca no conteudo" com glassmorphism:
  - Background: rgba(255,255,255,.04)
  - Border: 1px solid rgba(255,255,255,.06)
  - Backdrop-filter: blur(12px)
  - Border-radius: var(--radius-lg) 20px
  - Padding: 2rem
- Dentro do card:
  - Icone "search" no topo (SVG inline, 20px, cor accent-light)
  - Label: "Buscando no conteudo do curso..." em 0.75rem uppercase tracking .08em cor text-muted-dark
  - Separador: linha 1px rgba(255,255,255,.06) margin 1rem 0
  - Resultado simulado:
    - Tag: "Capitulo 7 — Regulacao Emocional" em 0.7rem uppercase tracking .06em cor accent-light, fundo rgba(79,70,229,.15) padding 4px 10px border-radius 4px
    - Trecho: "Dos 2 aos 4 anos, o vinculo com telas e mais sobre regulacao emocional do que sobre a tela em si. A crianca nao esta 'viciada' — ela esta buscando..." em 0.82rem cor text-on-dark line-height 1.6
    - Palavra "regulacao emocional" em bold com cor accent-light
  - Segundo resultado (parcial, cortado):
    - Tag: "Aula 12 — Limites Saudaveis" mesmo estilo
    - Trecho cortado com mask-image: linear-gradient(to bottom, black 50%, transparent 100%)
- Overlap: o card sangra -40px para a esquerda sobre a area do texto (negative margin-left no desktop)
- O card tem box-shadow: 0 8px 40px rgba(0,0,0,.3)

### Tipografia
- Titulo: Sora 700, clamp(1.75rem, 4vw, 2.75rem), line-height 1.2, cor #fff
- Paragrafos: Space Grotesk 400, clamp(1rem, 1.8vw, 1.1rem), line-height 1.75, cor text-muted-dark
- Frase destaque: Space Grotesk 600, clamp(1.05rem, 1.8vw, 1.15rem), cor accent-light, margin-top 1.5rem

### Animacoes
- Titulo: data-aos="fade-up"
- Paragrafo 1: data-aos="fade-up" delay 100ms
- Paragrafo 2: data-aos="fade-up" delay 200ms
- Frase destaque: data-aos="fade-up" delay 300ms
- Card visual: data-aos="fade-left" delay 200ms duration 1000ms

### Responsividade
- Mobile: grid 1fr, card nao tem overlap (margin-left 0), card abaixo do texto
- Tablet: grid 1fr 1fr mas gap reduzido, overlap reduzido para -20px
- Desktop: grid completo com overlap -40px

---

## Secao 4: O Angulo Que Ninguem Esta Vendo

### Arquetipo e Constraints
- Arquetipo: Type Hero
- Constraints: Headline Full Width (Tipografia), Gradiente Linear (Cor), Stagger (Movimento)
- Justificativa: Este e o momento AHA da pagina. A frase "eu estou com voce todos os dias, 24 horas" merece tratamento tipografico dramatico — e a proposta de valor mais emocional e precisa dominar a tela.

### Conteudo
- Microlabel acima: "O que voce passa a dizer na carta de vendas"
- Citacao grande: "Voce vai ter uma IA no seu WhatsApp que responde qualquer duvida como se eu estivesse ali com voce. Todos os dias. 24 horas. Eu nunca vou te deixar travado."
- Bloco 1 titulo: "Na venda do curso"
- Bloco 1 texto: "Zera a objecao 'sera que vou conseguir aprender sozinho?' e joga o valor percebido do curso nas alturas."
- Bloco 2 titulo: "Na retencao"
- Bloco 2 texto: "Aluno que se sente acompanhado nao cancela. Renova a assinatura. Indica para amigos. Compra o proximo produto."
- Bloco 3 titulo: "No diferencial"
- Bloco 3 texto: "Enquanto todos entregam 'area de membros + grupo no Telegram', voce entrega um especialista particular no bolso do aluno. Nenhum concorrente faz isso."
- Frase de fechamento: "Voce para de vender acesso a aulas e comeca a vender acompanhamento. A diferenca entre um curso de R$297 e uma mentoria de R$5.000."

### Fundo
- Background: var(--bg-light) #FBFAF9

### Layout
- Container: max-width 960px centralizado
- Padding section: clamp(5rem, 12vw, 9rem) vertical
- Microlabel no topo
- Citacao grande centralizada
- Abaixo: 3 blocos em grid 1fr (mobile) → 1fr 1fr 1fr (desktop 900px+) gap 2rem
- Frase de fechamento centralizada abaixo dos blocos

### Tipografia
- Microlabel: Space Grotesk 600, 0.75rem, uppercase, letter-spacing .1em, cor accent, margin-bottom 1.5rem, text-align center
- Citacao: Sora 700, clamp(1.5rem, 3.5vw, 2.5rem), line-height 1.3, text-align center, max-width 800px margin auto
  - Cor base: var(--text-dark) #1A1A1A
  - Trecho "Todos os dias. 24 horas." em bold com gradient: linear-gradient(135deg, var(--accent), var(--accent-light)), background-clip text
  - Aspas decorativas: pseudo-element ::before com content """ em Sora 300, 6rem, cor rgba(79,70,229,.08), position absolute top -1rem left -1rem
  - margin-bottom: 4rem
- Bloco titulo: Sora 700, 1rem, cor text-dark, margin-bottom .5rem
- Bloco texto: Space Grotesk 400, 0.95rem, line-height 1.65, cor text-muted
- Frase fechamento: Space Grotesk 500, clamp(1rem, 1.8vw, 1.15rem), line-height 1.7, cor text-dark, text-align center, max-width 600px margin 3rem auto 0
  - "R$297" e "R$5.000" em bold com cor accent

### Blocos (3 colunas)
- Cada bloco:
  - padding: 1.5rem
  - border-top: 2px solid var(--accent)
  - background: transparent
  - Sem border-radius (contraste com o rounded do resto — cria tensao intencional)

### Animacoes
- Microlabel: data-aos="fade-up"
- Citacao: data-aos="fade-up" delay 100ms
- Bloco 1: data-aos="fade-up" delay 150ms
- Bloco 2: data-aos="fade-up" delay 250ms
- Bloco 3: data-aos="fade-up" delay 350ms
- Frase fechamento: data-aos="fade-up" delay 200ms

### Responsividade
- Mobile: blocos em 1fr, citacao font-size 1.5rem, aspas decorativas escondidas
- Tablet: blocos 1fr 1fr (terceiro ocupa full width abaixo)
- Desktop: 3 colunas iguais

---

## Secao 5: O Impacto No Seu Negocio

### Arquetipo e Constraints
- Arquetipo: Bento Box
- Constraints: Hover Lift (Interacao), Color Blocking (Cor), Counter Animation (Movimento)
- Justificativa: Bento box cria hierarquia visual nao-uniforme — o item mais importante (churn) ganha mais espaco. Hover lift convida exploracao. Color blocking diferencia os 3 impactos.

### Conteudo
- Titulo secao: "Tres numeros que mudam sua operacao"
- Card 1 (grande):
  - Destaque: "Churn despenca"
  - Texto: "Aluno que se sente acompanhado nao cancela. Nao pede reembolso. Renova a assinatura. O custo de aquisicao que voce ja pagou para de ir pelo ralo."
  - Numero decorativo: "0%" (representando churn target) — grande, semi-transparente
- Card 2:
  - Destaque: "Suporte sai das suas costas"
  - Texto: "Voce para de gravar audios de 3 minutos respondendo a mesma duvida pela 47a vez. A IA responde com a precisao do seu conteudo."
  - Numero decorativo: "47x" — referencia ao audio repetido
- Card 3:
  - Destaque: "Upsell natural"
  - Texto: "Aluno satisfeito compra o proximo produto. Indica para amigos. Vira case de sucesso. A IA nao so retem — ela alimenta o topo do funil."
  - Numero decorativo: "LTV" — lifetime value

### Fundo
- Background: #FFFFFF
- border-top: 1px solid var(--border-light)

### Layout
- Container: max-width 1100px centralizado
- Titulo centralizado com margin-bottom 3rem
- Grid Bento:
  - Mobile: 1fr (todos empilhados)
  - Desktop 900px+: grid-template-columns 1fr 1fr, grid-template-rows auto auto
  - Card 1: grid-column 1, grid-row 1 / span 2 (ocupa 2 linhas — e o destaque)
  - Card 2: grid-column 2, grid-row 1
  - Card 3: grid-column 2, grid-row 2
  - Gap: 1.5rem

### Cards
- Cada card:
  - Background: var(--bg-light) #FBFAF9
  - Border: 1px solid var(--border-light)
  - Border-radius: var(--radius-lg) 20px
  - Padding: 2.5rem
  - Position: relative
  - Overflow: hidden
  - Transition: transform 400ms cubic-bezier(0.16,1,0.3,1), box-shadow 400ms cubic-bezier(0.16,1,0.3,1)
- Hover:
  - transform: translateY(-6px)
  - box-shadow: 0 20px 50px rgba(15,23,42,.08)
  - border-color: rgba(79,70,229,.2)
- Numero decorativo:
  - Position: absolute
  - Bottom: -10px, right: 10px
  - Font: Sora 800, 5rem (card grande: 7rem)
  - Color: rgba(79,70,229,.06)
  - Line-height: 1
  - User-select: none
  - Pointer-events: none

### Tipografia
- Titulo secao: Sora 700, clamp(1.75rem, 4vw, 2.5rem), line-height 1.2, text-align center, cor text-dark
- Card destaque: Sora 700, 1.25rem (card grande: 1.5rem), line-height 1.2, cor text-dark, margin-bottom .75rem
- Card texto: Space Grotesk 400, 0.95rem, line-height 1.65, cor text-muted
- Card grande: font-sizes sao 15% maiores que os menores

### Animacoes
- Titulo: data-aos="fade-up"
- Card 1: data-aos="fade-up" delay 100ms
- Card 2: data-aos="fade-up" delay 200ms
- Card 3: data-aos="fade-up" delay 300ms

### Responsividade
- Mobile: grid 1fr, todos os cards mesma largura, card 1 nao e mais alto
- Tablet: grid 1fr 1fr, card 1 span 2 colunas (horizontal em vez de vertical)
- Desktop: layout bento como descrito

---

## Secao 6: Como Funciona Na Pratica

### Arquetipo e Constraints
- Arquetipo: Scroll Triggered / Timeline
- Constraints: Stagger (Movimento), Diagonal Divider (Layout), Counter Animation (Movimento)
- Justificativa: Timeline vertical cria progressao clara. Cada etapa se revela conforme scroll — o usuario "caminha" pelo processo. Numeros grandes criam ancoras visuais.

### Conteudo
- Titulo secao: "Do seu conteudo a uma IA que responde como voce"
- Etapa 1: titulo "Voce me entrega o cerebro" / texto "PDFs, apostilas, transcricoes de aulas, livros, metodo — tudo que voce ja tem. Eu absorvo, organizo e estruturo o conhecimento."
- Etapa 2: titulo "Eu construo o especialista" / texto "Usando engenharia avancada de IA (RAG + prompt engineering), crio um agente que nao alucina, nao inventa resposta e busca a informacao no trecho exato do seu material."
- Etapa 3: titulo "Ativamos no WhatsApp dos seus alunos" / texto "Seu aluno manda mensagem no numero do suporte e recebe resposta imediata, precisa, na linguagem do seu curso. Sem instalar nada. Sem aprender ferramenta nova."
- Etapa 4: titulo "Voce acompanha, eu ajusto" / texto "Voce ve as conversas, identifica padroes e eu refino a IA continuamente. Ela fica mais inteligente a cada semana."

### Fundo
- Background: var(--bg-light) #FBFAF9
- Transicao suave do branco anterior: nenhum border-top, a mudanca de cor ja cria separacao

### Layout
- Container: max-width 760px centralizado
- Titulo centralizado, margin-bottom 4rem
- Timeline vertical:
  - Linha vertical: 2px solid var(--border-light), position absolute, left do numero, top 0 → bottom 0
  - Cada step: display flex, gap 2rem
  - Lado esquerdo: numero (circulo)
  - Lado direito: titulo + texto
  - Espaco entre steps: 3rem

### Numeros (circulos)
- Width/height: 48px
- Border-radius: 50%
- Background: var(--accent) #4F46E5
- Color: #fff
- Font: Sora 700, 1rem
- Display: flex, align-items center, justify-content center
- Flex-shrink: 0
- Position: relative (sobre a linha vertical)
- Box-shadow: 0 0 0 6px var(--bg-light) (cria gap na linha)

### Linha vertical
- Pseudo-element no container da timeline (::before)
- Width: 2px
- Background: var(--border-light) #E5E7EB
- Position: absolute
- Left: 23px (centro do circulo de 48px)
- Top: 24px (metade do primeiro circulo)
- Bottom: 24px (metade do ultimo circulo)

### Tipografia
- Titulo secao: Sora 700, clamp(1.75rem, 4vw, 2.5rem), line-height 1.2, text-align center, cor text-dark
- Step titulo: Sora 700, 1.15rem, line-height 1.3, cor text-dark, margin-bottom .5rem
- Step texto: Space Grotesk 400, 0.95rem, line-height 1.65, cor text-muted

### Animacoes
- Titulo: data-aos="fade-up"
- Step 1: data-aos="fade-up" delay 100ms
- Step 2: data-aos="fade-up" delay 200ms
- Step 3: data-aos="fade-up" delay 300ms
- Step 4: data-aos="fade-up" delay 400ms
- Circulos dos numeros: ao entrar na viewport, escalam de 0 para 1 (scale(0) → scale(1)) com transition 500ms cubic-bezier(0.34, 1.56, 0.64, 1) — efeito "pop" com overshoot

### Responsividade
- Mobile: mesma estrutura mas gap reduzido para 1.25rem, circulos 40px, font 0.85rem
- Desktop: como descrito

---

## Secao 7: Prova Real

### Arquetipo e Constraints
- Arquetipo: Documentary / Case Study
- Constraints: Dark Mode (Cor), Clip Reveal (Movimento), Contained Center (Layout)
- Justificativa: Dark mode cria drama e credibilidade para o case. O formato "documentary" trata o caso como evidencia — nao como depoimento generico.

### Conteudo
- Microlabel: "Case real"
- Titulo: "Ja funciona. Ja esta rodando. Ja esta respondendo alunos."
- Cliente: "Instituto Verstehen — Projeto Filhos e Telas"
- Dado 1: label "Conteudo absorvido" / valor "15 capitulos completos"
- Dado 2: label "Disponibilidade" / valor "24/7 — madrugada, feriado, fim de semana"
- Dado 3: label "Tema" / valor "Desenvolvimento infantil e tecnologia"
- Descricao: "Pais enviam duvidas reais pelo WhatsApp — 'meu filho de 5 anos so quer tela', 'como lidar com birra por causa do tablet' — e a IA responde com orientacao especializada baseada no conteudo do curso."
- Resultado: "Suporte especializado 24/7 sem depender do especialista. Pais atendidos exatamente quando as duvidas mais aparecem."

### Fundo
- Background: var(--bg-dark) #0F172A
- Grid pattern: linhas rgba(255,255,255,.02) 80×80px (mais sutil que o hero)

### Layout
- Container: max-width 900px centralizado
- Padding section: clamp(5rem, 12vw, 9rem) vertical
- Estrutura vertical:
  - Microlabel topo
  - Titulo
  - Nome do cliente (em destaque)
  - 3 dados em row horizontal (mobile: stack vertical)
  - Descricao
  - Resultado em bloco destacado

### Dados (metrics row)
- Display: flex (mobile: column) → row (desktop)
- Gap: 0
- Cada dado:
  - Flex: 1
  - Padding: 1.5rem
  - Border-right: 1px solid var(--border-dark) (ultimo sem border)
  - Mobile: border-bottom em vez de border-right
- Label: Space Grotesk 500, 0.7rem, uppercase, letter-spacing .1em, cor text-muted-dark, margin-bottom .5rem
- Valor: Sora 600, 1.1rem, cor #fff

### Bloco resultado
- Margin-top: 2.5rem
- Padding: 2rem
- Background: rgba(79,70,229,.08)
- Border: 1px solid rgba(79,70,229,.15)
- Border-radius: var(--radius-md) 12px
- Texto: Space Grotesk 500, clamp(1rem, 1.8vw, 1.1rem), line-height 1.7, cor text-on-dark

### Tipografia
- Microlabel: Space Grotesk 600, 0.75rem, uppercase, letter-spacing .12em, cor accent-light, margin-bottom 1rem
- Titulo: Sora 700, clamp(1.75rem, 4vw, 2.5rem), line-height 1.2, cor #fff, margin-bottom 1.5rem
- Cliente: Sora 600, 1.15rem, cor accent-light, margin-bottom 2.5rem
  - Icone decorativo: barra vertical 3px solid accent antes do texto (pseudo-element ::before, height 100%, margin-right .75rem)

### Animacoes
- Microlabel: data-aos="fade-up"
- Titulo: data-aos="fade-up" delay 100ms
- Cliente: data-aos="fade-up" delay 150ms
- Dados: data-aos="fade-up" delay 200ms (container inteiro)
- Descricao: data-aos="fade-up" delay 250ms
- Resultado: data-aos="fade-up" delay 300ms

### Responsividade
- Mobile: dados empilham vertical, border-bottom em vez de right, padding reduzido
- Desktop: dados em row horizontal

---

## Secao 8: Pra Quem Isso Faz Sentido

### Arquetipo e Constraints
- Arquetipo: Split Vertical
- Constraints: Selective Color (Cor), Fade Up (Movimento), Hover Scale (Interacao)
- Justificativa: A divisao visual entre "sim" e "nao" cria contraste imediato. O usuario se identifica (ou nao) instantaneamente. Funciona como filtro de qualificacao.

### Conteudo
- Titulo secao: nenhum titulo global — os dois lados se auto-explicam
- Lado esquerdo titulo: "Isso e pra voce se..."
- Items esquerda:
  1. "Voce vende curso online e tem alunos mandando duvidas que sua equipe nao consegue responder"
  2. "Voce e o gargalo do suporte — se voce parar, o suporte para"
  3. "Voce quer escalar a entrega sem contratar um exercito"
  4. "Voce tem assinatura/recorrencia e churn e um problema real"
  5. "Voce quer um diferencial competitivo que nenhum concorrente tem"
- Lado direito titulo: "Isso NAO e pra voce se..."
- Items direita:
  1. "Voce quer um chatbot de 'aperte 1 para X, aperte 2 para Y'"
  2. "Voce nao tem conteudo proprio estruturado (livro, curso, metodo)"
  3. "Voce quer uma solucao de R$97/mes de prateleira"

### Fundo
- Background: #FFFFFF
- border-top: 1px solid var(--border-light)

### Layout
- Container: max-width 1000px centralizado
- Grid: 1fr (mobile) → 1fr 1fr (desktop 900px+)
- Gap: 2rem (mobile) → 3rem (desktop)
- Separador vertical no desktop: pseudo-element ::after no container, width 1px, height calc(100% - 4rem), background var(--border-light), position absolute left 50% top 2rem

### Cards (cada lado)
- Padding: 2.5rem
- Border-radius: var(--radius-lg) 20px
- Lado esquerdo:
  - Background: rgba(79,70,229,.03)
  - Border: 1px solid rgba(79,70,229,.08)
- Lado direito:
  - Background: var(--bg-light) #FBFAF9
  - Border: 1px solid var(--border-light)

### Items da lista
- Cada item:
  - Display: flex, gap .75rem, align-items flex-start
  - Padding: 1rem 0
  - Border-bottom: 1px solid rgba(0,0,0,.04) (ultimo sem)
- Indicador (lado esquerdo):
  - Icone: circulo 20px com check SVG inline
  - Background: rgba(16,185,129,.1) (success com 10% opacity)
  - Cor do check: var(--success) #10B981
  - Flex-shrink: 0, margin-top 2px
- Indicador (lado direito):
  - Icone: circulo 20px com X SVG inline
  - Background: rgba(239,68,68,.08)
  - Cor do X: var(--error) #EF4444

### Tipografia
- Titulo de cada lado: Sora 700, 1.15rem, line-height 1.3, margin-bottom 1.5rem
  - Esquerda: cor text-dark
  - Direita: cor text-muted
- Items: Space Grotesk 400, 0.95rem, line-height 1.55, cor text-dark (esquerda) / text-muted (direita)

### Animacoes
- Lado esquerdo: data-aos="fade-right" delay 100ms
- Lado direito: data-aos="fade-left" delay 200ms

### Responsividade
- Mobile: stacked, sem separador vertical, gap 1.5rem
- Desktop: side by side com separador

---

## Secao 9: FAQ

### Arquetipo e Constraints
- Arquetipo: Reveal on Demand
- Constraints: Hover Glow (Interacao), Stagger (Movimento), Selective Color (Cor)
- Justificativa: FAQ como accordion estilizado — mas NAO basico. Cada pergunta e um "card" com transicao suave. O glow no hover convida o clique.

### Conteudo
- Titulo: "Perguntas frequentes"
- 6 perguntas/respostas (exatamente como no copy.md)

### Fundo
- Background: var(--bg-light) #FBFAF9

### Layout
- Container: max-width 760px centralizado
- Titulo centralizado, margin-bottom 3rem
- Accordion: lista vertical, gap 0.75rem entre items

### Accordion Items
- Estado fechado:
  - Background: #FFFFFF
  - Border: 1px solid var(--border-light)
  - Border-radius: var(--radius-md) 12px
  - Padding: 1.25rem 1.5rem
  - Cursor: pointer
  - Transition: all 300ms ease
  - Display flex entre pergunta e icone de seta
- Estado fechado hover:
  - Border-color: rgba(79,70,229,.2)
  - Box-shadow: 0 4px 16px rgba(79,70,229,.06)
- Estado aberto:
  - Border-color: var(--accent) rgba(79,70,229,.3)
  - Background: #FFFFFF
  - Box-shadow: 0 4px 20px rgba(79,70,229,.08)
- Icone seta:
  - SVG chevron-down, 20px, cor text-muted
  - Transition: transform 300ms ease
  - Aberto: rotate(180deg), cor accent
- Resposta:
  - Max-height: 0 → auto (com transition via JS ou grid trick: grid-template-rows 0fr → 1fr)
  - Padding-top: 0 → 1rem (aberto)
  - Opacity: 0 → 1 (200ms delay 100ms)
  - Border-top: 1px solid var(--border-light) (aparece quando aberto)

### Tipografia
- Titulo secao: Sora 700, clamp(1.75rem, 4vw, 2.5rem), line-height 1.2, text-align center, cor text-dark
- Pergunta: Space Grotesk 600, 1rem, line-height 1.5, cor text-dark
- Resposta: Space Grotesk 400, 0.95rem, line-height 1.65, cor text-muted

### Interatividade (JS)
- Click no item: toggle classe .is-open
- Apenas 1 item aberto por vez (fechar o anterior ao abrir novo)
- Primeiro item inicia aberto por padrao

### Animacoes
- Titulo: data-aos="fade-up"
- Items: data-aos="fade-up" delay stagger 80ms (80, 160, 240, 320, 400, 480)

### Responsividade
- Mobile: padding reduzido para 1rem 1.25rem, font-size 0.95rem nas perguntas
- Desktop: como descrito

---

## Secao 10: CTA Final + Formulario de Aplicacao

### Arquetipo e Constraints
- Arquetipo: Contained Center + Form Wizard
- Constraints: Dark Mode (Cor), Scale In (Movimento), Progress Bar (Estrutura)
- Justificativa: Dark mode cria urgencia e foco. O form wizard (typeform-style) uma pergunta por vez reduz friccao e aumenta completions. O progresso visual motiva a conclusao.

### Conteudo
- Titulo: "Seu proximo passo"
- Subtitulo: "Se voce quer entender como uma IA especialista funcionaria pro seu curso especifico, preenche a aplicacao abaixo. Sao 4 perguntas rapidas."
- Micro-texto: "Sem compromisso. Sem spam. Eu pessoalmente vou analisar sua aplicacao."
- Step 1: "Qual o seu nome?" — campo texto
- Step 2: "Qual o seu WhatsApp?" — campo telefone com intl-tel-input
- Step 3: "Sobre o que e o seu curso?" — campo texto (placeholder: "Ex: Curso de investimentos, Mentoria de marketing digital")
- Step 4: "Quantos alunos ativos voce tem hoje?" — 4 opcoes selecionaveis (Menos de 100 / 100 a 500 / 500 a 2.000 / Mais de 2.000)
- Botao avancar: "Continuar" (steps 1-3), "Enviar aplicacao" (step 4)
- Indicador: "Passo X de 4"

### Fundo
- Background: var(--bg-dark) #0F172A
- Grid pattern sutil como hero: rgba(255,255,255,.02) 60×60px

### Layout
- Container: max-width 600px centralizado
- Padding section: clamp(5rem, 12vw, 9rem) vertical
- Tudo centralizado (text-align center)
- Estrutura vertical:
  - Titulo
  - Subtitulo
  - Form wizard container
  - Micro-texto

### Form Wizard Container
- Background: rgba(255,255,255,.03)
- Border: 1px solid var(--border-dark)
- Border-radius: var(--radius-xl) 28px
- Padding: 3rem 2.5rem
- Margin-top: 2.5rem

### Progress Bar
- Position: relativa ao topo do form container
- Width: 100%
- Height: 3px
- Background: var(--border-dark)
- Border-radius: 2px
- Barra de progresso dentro:
  - Height: 100%
  - Background: linear-gradient(90deg, var(--accent), var(--accent-light))
  - Border-radius: 2px
  - Width: 25% → 50% → 75% → 100% conforme steps
  - Transition: width 400ms cubic-bezier(0.16, 1, 0.3, 1)

### Steps
- Cada step:
  - Position: relative
  - Transition entre steps: slide-left com fade (translateX(0) → translateX(-20px) opacity 0, novo step translateX(20px) → translateX(0) opacity 1), 300ms ease
- Indicador "Passo X de 4":
  - Space Grotesk 500, 0.75rem, uppercase, letter-spacing .1em, cor text-muted-dark
  - Margin-bottom 1.5rem

### Campos de Input
- Width: 100%
- Background: rgba(255,255,255,.05)
- Border: 1px solid var(--border-dark)
- Border-radius: var(--radius-md) 12px
- Padding: 1rem 1.25rem
- Font: Space Grotesk 400, 1rem
- Color: #fff
- Placeholder color: var(--text-muted-dark)
- Focus:
  - Border-color: var(--accent)
  - Box-shadow: 0 0 0 3px rgba(79,70,229,.15)
  - Outline: none
- Transition: border-color 200ms, box-shadow 200ms

### Campo Telefone (intl-tel-input)
- Mesmo estilo dos inputs
- Container .iti com width 100%
- Flag dropdown com background var(--bg-card) e border var(--border-dark)

### Opcoes Selecionaveis (Step 4)
- 4 botoes em grid 1fr 1fr (mobile: 1fr)
- Cada opcao:
  - Background: rgba(255,255,255,.03)
  - Border: 1px solid var(--border-dark)
  - Border-radius: var(--radius-md) 12px
  - Padding: 1rem 1.25rem
  - Font: Space Grotesk 500, 0.95rem
  - Color: var(--text-on-dark)
  - Cursor: pointer
  - Text-align: center
  - Transition: all 200ms ease
- Hover:
  - Border-color: rgba(79,70,229,.3)
  - Background: rgba(79,70,229,.06)
- Selecionado:
  - Border-color: var(--accent)
  - Background: rgba(79,70,229,.1)
  - Color: #fff
  - Box-shadow: 0 0 0 2px rgba(79,70,229,.2)

### Botao Avancar
- Width: 100%
- Margin-top: 1.5rem
- Padding: 1rem
- Background: var(--accent)
- Color: #fff
- Font: Space Grotesk 600, 1rem
- Border: none
- Border-radius: var(--radius-md) 12px
- Cursor: pointer
- Transition: background 250ms, transform 250ms, box-shadow 250ms
- Hover: background var(--accent-hover), translateY(-2px), box-shadow 0 8px 24px var(--accent-glow)
- Disabled (campo vazio): opacity .4, pointer-events none

### Tipografia
- Titulo: Sora 700, clamp(1.75rem, 4vw, 2.5rem), line-height 1.2, cor #fff, margin-bottom 1rem
- Subtitulo: Space Grotesk 400, clamp(1rem, 1.8vw, 1.1rem), line-height 1.7, cor text-muted-dark, max-width 480px margin auto
- Micro-texto: Space Grotesk 400, 0.8rem, cor text-muted-dark, margin-top 1.5rem
- Label de cada step: Sora 600, 1.1rem, cor #fff, margin-bottom 1.5rem, text-align center

### Animacoes
- Titulo: data-aos="fade-up"
- Subtitulo: data-aos="fade-up" delay 100ms
- Form container: data-aos="fade-up" delay 200ms

### Responsividade
- Mobile: form padding 2rem 1.5rem, opcoes grid 1fr, input padding .85rem 1rem
- Desktop: como descrito

---

## Secao 11: Pagina de Obrigado (estado pos-submit)

### Arquetipo e Constraints
- Arquetipo: Isolated Element
- Constraints: Scale In (Movimento), Contained Center (Layout)
- Justificativa: Apos o submit, o form desaparece e um estado de confirmacao toma conta — simples, limpo, com uma mensagem pessoal.

### Comportamento
- NAO e uma pagina separada — e um estado que substitui o form wizard dentro da mesma secao
- Transicao: form faz fade-out (opacity 0, scale .98, 300ms), estado de obrigado faz fade-in (opacity 1, scale 1, 300ms delay 200ms)

### Conteudo
- Icone: checkmark circular animado (SVG draw animation)
  - Circulo: stroke accent, 64px, stroke-dasharray animado 600ms ease
  - Check: stroke #fff, stroke-dasharray animado 400ms ease delay 400ms
- Titulo: "Recebido, [nome]. Vou analisar sua aplicacao."
  - [nome] e substituido pelo valor do campo nome do step 1
- Texto: "Nos proximos minutos voce vai receber uma mensagem no WhatsApp. E o meu time verificando alguns detalhes pra gente marcar a call."
- Texto secundario (em italico): "Enquanto isso, uma pergunta pra voce pensar: se voce pudesse tirar o suporte das suas costas amanha, o que voce faria com esse tempo?"

### Layout
- Mesmo container do form (max-width 600px)
- Tudo centralizado
- Padding: 3rem 2.5rem

### Tipografia
- Titulo: Sora 700, 1.5rem, line-height 1.3, cor #fff, margin 1.5rem 0 1rem
- Texto: Space Grotesk 400, 1rem, line-height 1.7, cor text-muted-dark
- Texto secundario: Space Grotesk 400 italic, 0.95rem, line-height 1.65, cor text-muted-dark, margin-top 1.5rem, border-left 2px solid var(--accent), padding-left 1rem

---

## Secao 12: Footer

### Layout
- Background: var(--bg-dark) #0F172A (continua da secao CTA — sem separacao visual)
- Padding: 2rem 0
- Border-top: 1px solid var(--border-dark)
- Container: max-width 1280px
- Display flex, justify-content space-between, align-items center
- Mobile: flex-direction column, gap 1rem, text-align center

### Conteudo
- Esquerda: "Victor Viana — Agentes de IA para WhatsApp"
- Direita: "© [ano dinamico]" (injetado via JS existente no script.js)

### Tipografia
- Texto: Space Grotesk 400, 0.8rem, cor text-muted-dark

---

## Elementos Encantadores Globais

### Scroll Progress Bar
- Position: fixed top 0
- Width: 100%, height: 2px
- Background: transparent
- Barra interna: linear-gradient(90deg, var(--accent), var(--accent-light))
- Width controlada via CSS scroll-driven animation (animation-timeline: scroll())
- Z-index: 9999

### Transicoes entre secoes
- Secoes que transicionam de light → dark: wave divider ou clip-path sutil
  - Antes da secao 3 (O Que Muda): clip-path polygon(0 0, 100% 3vw, 100% 100%, 0 100%) na secao dark — cria angulo sutil
  - Antes da secao 7 (Prova Real): mesmo clip-path
  - Antes da secao 10 (CTA): mesmo clip-path
- Secoes que transicionam de dark → light: borda linear simples (sem clip-path)

### Smooth Scroll
- html { scroll-behavior: smooth }
- Scroll suave para ancora #aplicar no CTA

### Reduced Motion
- Todas as animacoes desabilitadas em @media (prefers-reduced-motion: reduce)
- AOS: opacity e transform removidos
- Float, pulse, typing: animation none
- Chat messages: todas visiveis imediatamente
- Form transitions: instantaneas

---

## Ordem de Implementacao

1. Secoes 1-2: JA IMPLEMENTADAS (manter)
2. Secao 3: O Que Muda (dark, split com overlap)
3. Secao 4: O Angulo (light, type hero)
4. Secao 5: Impacto (white, bento box)
5. Secao 6: Como Funciona (light, timeline)
6. Secao 7: Prova Real (dark, case study)
7. Secao 8: Pra Quem (white, split vertical)
8. Secao 9: FAQ (light, accordion)
9. Secao 10: CTA + Form (dark, form wizard)
10. Secao 11: Estado obrigado (dentro da 10)
11. Secao 12: Footer
12. Elementos globais (scroll bar, transicoes, smooth scroll)
