# Layout — Raio-X do Consultório (Vértice Labs + MEDSimple)

Especificação de direção de arte para construção da página completa. Hero e Seção "A dor" já implementados em `index.html` + `style.css` e servem de referência viva. Este documento especifica TODAS as seções, incluindo o quiz interativo.

---

## Linguagem visual global (vale para a página inteira)

### Paleta (hex exatos)
- Fundo página: `#f3f4f9` · Fundo alt: `#eceef6` · Card: `#ffffff`
- Tinta principal (navy): `#15152e` · Tinta-2: `#3a3a55` · Muted: `#71718a` · Muted-2: `#9a9ab0`
- Linhas: `rgba(20,20,60,.09)` · Linha-2: `rgba(20,20,60,.15)`
- Grade de fundo: `rgba(30,30,80,.055)`
- Azul MEDSimple: `#4f5bd5` · Roxo MEDSimple: `#7c5cff`
- Gradiente de marca: `linear-gradient(100deg,#4f5bd5 0%,#7c5cff 100%)`
- Azul transparente: `rgba(79,91,213,.12)`
- Bloco escuro (navy gradiente): `linear-gradient(165deg,#1d1d3d 0%,#141430 100%)`

### Tipografia
- Display/headings: **Space Grotesk** (400/500/600/700)
- Corpo: **Inter** (400/450/500/600)
- Acento mono (kickers, labels, números técnicos): **JetBrains Mono** (500)
- MANTER esse pairing em toda a página. Não introduzir novas fontes.

### Tokens de raio e sombra
- Raios: `--r-sm:12px` · `--r:18px` · `--r-lg:24px`
- Sombra padrão: `0 2px 10px rgba(20,20,60,.06),0 18px 40px -18px rgba(20,20,60,.22)`
- Sombra lift: `0 10px 24px rgba(20,20,60,.10),0 36px 70px -22px rgba(60,50,160,.30)`

### Container e ritmo
- `max-width:1200px` · gutter `clamp(20px,5vw,64px)` · seções `padding-block: clamp(48px,7vw,96px)`
- Fundo de grade fixo (`.grid-bg`) com máscara radial já existente: manter em toda a página, atrás de tudo (`z-index:0`).

### Animação base (já implementada)
- `[data-reveal]`: opacity 0 + translateY(16px) → revela com `.loaded` no body. Easing `cubic-bezier(.2,.7,.3,1)`, duração 700ms, delay via `--d`.
- Hero sem animação de ENTRADA; demais seções revelam ao entrar no viewport (IntersectionObserver, trigger a 18% de visibilidade, adicionar classe `.in` ⇒ reusar a mesma transição de `[data-reveal]`).
- Respeitar `prefers-reduced-motion`: desligar transform/opacity.

### Estados globais de botão
- `.btn-grad` (CTA primário): fundo gradiente de marca, texto `#fff`, sombra `0 8px 22px -8px rgba(79,91,213,.6)`. Hover: `translateY(-2px)` + sombra lift, 300ms.
- `.btn-primary`: fundo `#15152e`, texto `#fff`. Hover igual.
- Foco visível (acessibilidade): `outline:2px solid #7c5cff; outline-offset:2px` em todos os interativos.

---

## Estrutura da página (ordem)

0. Header sticky (co-branded)
1. Hero (entrada) — IMPLEMENTADO
2. A dor — IMPLEMENTADO (painel de sinais escuro em destaque)
3. O que o Raio-X revela
4. Como funciona
5. Quem está por trás (autoridade + depoimentos)
6. FAQ
7. CTA final
8. Footer
9. **Quiz overlay** (form wizard fullscreen) + telas de resultado A/B — disparado por todo CTA "Fazer meu Raio-X"

---

## Seção 0: Header (sticky)

### Arquétipo e Constraints
- Arquétipo: Sticky Header
- Constraints: Glassmorphism (Efeitos), Logo Lockup co-branded (Mídia)
- Justificativa: a parceria precisa estar visível o tempo todo; o lockup é o ativo de autoridade.

### Conteúdo
- Esquerda: `▲ Vértice Labs` `×` `[logo MEDSimple]`
- Direita: botão `Fazer meu Raio-X`

### Layout / Tipografia / Cores
- Altura 66px, sticky top 0, `z-index:40`.
- Fundo `rgba(243,244,249,.72)` + `backdrop-filter:saturate(160%) blur(12px)`. Borda inferior `1px solid rgba(20,20,60,.09)`.
- Brand: Space Grotesk 700, 17px, `#15152e`. Mark triângulo SVG 22px (path stroke currentColor).
- `×` em `#9a9ab0`. Logo MEDSimple: altura 21px, `opacity:.92`.
- Botão `.btn-primary.btn-sm` (10px 16px, 14px).

### Animações / Interatividade / Responsividade
- Ao rolar >8px: já é translúcido; opcional intensificar sombra `0 1px 0 rgba(20,20,60,.06)`.
- ≤560px: esconder `×`; logo 18px; brand 15px.

---

## Seção 1: Hero — IMPLEMENTADO (referência)
- Arquétipo: Split Assimétrico (1.15fr / .85fr).
- Constraints: Texto com Gradiente (headline `.hl` azul→roxo) + Grid Background mascarado + Hover Lift.
- Esquerda: kicker pill mono, h1 Space Grotesk 700 `clamp(34px,5.2vw,60px)` lh 1.04, sub Inter `clamp(16px,1.5vw,18.5px)` `#3a3a55`, CTA grad lg + microcopy, faixa de trust.
- Direita: `.card-xray` (mockup do resultado): header gradiente, medidor `.gauge` (anima scaleX no `.loaded`), linhas hoje 6 / meta 30 / +24/mês, flag azul. Sombra lift.
- Responsivo: ≤900px vira 1 coluna; card max-width 440px.

---

## Seção 2: A dor — IMPLEMENTADO (referência)
- Arquétipo: Editorial (texto) + Spotlight Panel (painel escuro).
- Constraints: Color Blocking escuro (painel navy gradiente com glow radial) + Sticky Element (painel `top:90px`) + Hover translateX nos itens.
- Esquerda: eyebrow mono azul, h2 Space Grotesk 700 `clamp(26px,3.4vw,40px)` com grifo `.ul` (faixa azul-dim a 62%), 2 parágrafos Inter 16.5px `#3a3a55`.
- Direita: card escuro `linear-gradient(165deg,#1d1d3d,#141430)`, título mono `#a9b0ff`, 5 sinais com `.x` (quadrado gradiente, sombra roxa), divisórias `rgba(255,255,255,.07)`, hover item `#fff` + translateX(3px). CTA pill translúcido `Fazer meu Raio-X gratuito →` com gap-grow no hover.
- DESTAQUE reforçado: este painel é o ponto focal escuro da metade superior. Manter contraste alto.

---

## Seção 3: O que o Raio-X revela

### Arquétipo e Constraints
- Arquétipo: Editorial / Progressive Reveal (lista numerada vertical, NÃO 3 cards lado a lado)
- Constraints: Número gigante como elemento gráfico (Tipografia, `clamp(64px,9vw,120px)`) + Draw SVG (linha vertical conectora desenhada no scroll) + Stagger
- Justificativa: três frentes pedem hierarquia sequencial, não paridade de cards. O número grande vira o decorativo.

### Conteúdo
- Eyebrow: `O QUE O RAIO-X REVELA`
- Título (h2): "Em 2 minutos você vai saber onde está perdendo paciente"
- Subtítulo: "O Raio-X olha as três frentes que decidem se um consultório lota ou fica vazio."
- Item 01 — Sua presença online: "se um paciente te procura agora, ele te encontra ou encontra o concorrente?"
- Item 02 — Seu canal de captação: "de onde vêm seus pacientes hoje e o quanto isso é previsível"
- Item 03 — Seu potencial real: "quantos pacientes novos por mês seu consultório poderia receber com a estrutura certa"
- Fecho (faixa): "No final você recebe um diagnóstico personalizado com o primeiro passo pra destravar a sua agenda."

### Layout
- Bloco de título: largura máx 22ch, centralizado à esquerda (não centralizar a página).
- Lista vertical: cada item em grid `[120px coluna do número] [1fr texto]`, gap 28px, padding-block 28px, com linha divisória `1px solid rgba(20,20,60,.09)` entre itens.
- Linha conectora SVG vertical de 2px passando pelo centro da coluna dos números (`#4f5bd5→#7c5cff` gradiente vertical), desenhada via `stroke-dashoffset` conforme `animation-timeline:view()`.
- Fecho: faixa full-width interna com fundo `rgba(79,91,213,.08)`, borda-esquerda 3px `#4f5bd5`, raio 14px, padding 18px 22px, texto Inter 16px `#3a3a55`.

### Tipografia
- Número: Space Grotesk 700, `clamp(64px,9vw,120px)`, com fill gradiente de marca (background-clip text), lh 1, `opacity:.9`.
- Título do item: Space Grotesk 600, 20px desktop / 18px mobile, `#15152e`.
- Texto do item: Inter 16px, `#3a3a55`, lh 1.55, max 48ch.
- Eyebrow: JetBrains Mono 12.5px, uppercase, tracking .06em, `#4f5bd5`.

### Cores
- Números: gradiente marca. Linha conectora: gradiente vertical `#4f5bd5→#7c5cff`. Divisórias: `rgba(20,20,60,.09)`.

### Animações
- Stagger: cada item revela fade-up 700ms, delays 0 / .08s / .16s, trigger a 20% no viewport.
- Linha SVG: draw de 0→100% em scroll (scroll-driven), fallback: desenha 1.2s ao entrar.
- Número: leve contador de hover não; manter estático, só reveal.

### Interatividade
- Hover no item: número passa de `opacity:.9` → `1` e escala `1.03` (transform-origin left), 300ms; texto do item `#15152e`.

### Responsividade
- ≤640px: número vira 48px e fica acima do texto (coluna única), linha conectora à esquerda (12px do início).

---

## Seção 4: Como funciona

### Arquétipo e Constraints
- Arquétipo: Flow / Timeline horizontal (3 passos conectados, NÃO 3 cards isolados)
- Constraints: Linha de progresso animada por scroll (Movimento) + Badges numerados com glow (Tipografia/Efeito) + Diagonal/connector entre passos
- Justificativa: processo é sequência; a linha conectora comunica "passo a passo" melhor que cards paralelos.

### Conteúdo
- Eyebrow: `COMO FUNCIONA`
- Título (h2): "Simples assim"
- Passo 1: "Responda 10 perguntas rápidas sobre seu momento e seu consultório"
- Passo 2: "Receba o diagnóstico na hora, com o furo e o que priorizar"
- Passo 3: "Converse com a gente no WhatsApp se quiser ajuda pra executar"

### Layout
- Desktop: 3 colunas iguais com uma linha horizontal conectora a 26px do topo dos badges, passando por trás dos números.
- Cada passo: badge circular 52px no topo + título + texto, alinhamento à esquerda dentro da coluna, gap 18px.
- Mobile: vira vertical, linha conectora vertical à esquerda dos badges.
- Padding-block da seção `clamp(48px,7vw,96px)`.

### Tipografia
- Badge número: Space Grotesk 700, 22px, `#fff` sobre fundo gradiente.
- Título do passo: Space Grotesk 600, 18px, `#15152e`.
- Texto: Inter 15.5px, `#3a3a55`, lh 1.5, max 32ch.

### Cores
- Badge: fundo gradiente de marca, sombra `0 8px 20px -6px rgba(124,92,255,.55)`.
- Linha conectora: `rgba(20,20,60,.12)` base; preenchimento progressivo gradiente de marca conforme scroll.

### Animações
- Badges entram com scale-in (0.6→1) + fade, stagger 0/.12/.24s, easing back `cubic-bezier(.34,1.56,.64,1)`.
- Linha conectora: preenche da esquerda→direita (scaleX) ligada ao progresso de scroll da seção; fallback 1s ao entrar.

### Interatividade
- Hover no passo: badge `translateY(-4px)` + glow intensifica; título ganha cor `#4f5bd5`.

### Responsividade
- ≤760px: coluna única, badges 46px, linha vertical à esquerda (left:22px).

---

## Seção 5: Quem está por trás (autoridade + depoimentos)

### Arquétipo e Constraints
- Arquétipo: Split Assimétrico + Layered (texto à esquerda, painel de credibilidade à direita; depoimentos abaixo como quotes editoriais — NÃO foto circular + texto)
- Constraints: Counter Animation (números 50 mil / 3 mil / 6 anos) + Glassmorphism (painel de credibilidade) + Logo Lockup
- Justificativa: a autoridade do Victor + MEDSimple é o argumento central; números contando dão prova, o lockup ancora a marca.

### Conteúdo
- Eyebrow: `QUEM ESTÁ POR TRÁS`
- Título (h2): "Uma parceria de quem entende de médico"
- Parágrafo 1: "O Raio-X é uma parceria entre a Vértice Labs, que cuida de sites e captação de pacientes para consultórios, e a MEDSimple, plataforma que já acompanhou a formação de mais de 50 mil estudantes de medicina e 3 mil aprovados no ENAMED."
- Parágrafo 2 (DESTAQUE de autoridade): "Quem está à frente é o Victor, que faz parte da equipe de marketing da MEDSimple há 6 anos. Os serviços do Raio-X são prestados sob a responsabilidade dele. Não é uma agência de fora: é a mesma equipe que já cuida do marketing da MEDSimple, agora trabalhando direto com você."
- Parágrafo 3: "A gente trabalha só com consultório. Entende a regra do CFM para publicidade médica e sabe o que faz um paciente escolher você em vez do concorrente da esquina."
- Painel de credibilidade (3 números com contador): `50 mil+ estudantes acompanhados` · `3 mil+ aprovados no ENAMED` · `6 anos cuidando do marketing`
- Depoimentos (placeholders, coletar dos primeiros clientes): 2 quotes.

### Layout
- Split `1.2fr / .8fr`. Esquerda: textos. Direita: painel glass sticky (top 90px) com o lockup `Vértice Labs × MEDSimple` no topo + 3 números empilhados com divisórias.
- O parágrafo 2 recebe um marcador visual: borda-esquerda 3px gradiente + leve fundo `rgba(79,91,213,.05)`, padding-left 16px, para sinalizar que é o ponto-chave de autoridade.
- Depoimentos: faixa abaixo do split, 2 colunas (≥760px). Cada quote: aspas grandes decorativas Space Grotesk 700 64px `rgba(79,91,213,.18)`, texto do depoimento Inter 17px italic-off `#15152e`, assinatura mono `#71718a`. Sem foto circular; usar um chip com iniciais + especialidade/cidade.

### Tipografia
- h2: Space Grotesk 700, `clamp(26px,3.2vw,38px)`, `#15152e`.
- Parágrafos: Inter 16.5px, `#3a3a55`, lh 1.65.
- Número (counter): Space Grotesk 700, 34px, gradiente de marca. Rótulo: Inter 14px `#71718a`.

### Cores
- Painel glass: `rgba(255,255,255,.6)` + `backdrop-filter:blur(14px)`, borda `1px solid rgba(255,255,255,.5)` sobre sombra. Divisórias internas `rgba(20,20,60,.09)`.

### Animações
- Counters: ao entrar no viewport, contam de 0 ao valor em 1.4s, easing out, com sufixo (`mil+`, `anos`). Trigger único (não repete).
- Quotes: fade-up stagger 0/.1s.

### Interatividade
- Hover no quote: leve lift `translateY(-3px)` + sombra.

### Responsividade
- ≤900px: split vira 1 coluna; painel glass deixa de ser sticky e vai abaixo do texto. Depoimentos viram 1 coluna.

---

## Seção 6: FAQ

### Arquétipo e Constraints
- Arquétipo: Editorial Q&A em grid (perguntas SEMPRE abertas, NÃO accordion básico)
- Constraints: Rótulos mono `P` / `R` (Tipografia) + Divisórias com hover highlight (Layout) + Sticky título à esquerda
- Justificativa: confiança no nicho médico pede transparência; respostas abertas leem melhor que accordion e fogem do genérico.

### Conteúdo
- Eyebrow: `PERGUNTAS FREQUENTES`
- Título (h2, sticky à esquerda em desktop): "Sem letra miúda"
- Pares (todos visíveis):
  1. P: O Raio-X custa alguma coisa? — R: Não. É um diagnóstico gratuito. No final, se fizer sentido, você decide se quer ajuda pra executar.
  2. P: Vocês são uma agência de marketing? — R: A gente é especializado em captação de pacientes para consultório, em parceria com a MEDSimple. Não atendemos outros nichos, só médicos.
  3. P: Anunciar não é proibido pra médico? — R: Não. O CFM permite divulgação dentro de regras claras, sem sensacionalismo, sem promessa de resultado e sem preço em destaque. A gente trabalha dentro dessas regras.
  4. P: Eu preciso já ter consultório montado? — R: Não. A gente atende quem já atende, quem está montando e quem ainda vai abrir. Saber disso antes ajuda a não gastar errado com a estrutura.
  5. P: Quanto tempo leva pra ver resultado? — R: Site no ar em poucos dias. Os primeiros contatos por anúncio costumam aparecer nas primeiras semanas. A gente mede por paciente que chega, não por curtida.

### Layout
- Desktop: grid `[.42fr título sticky] [.58fr lista de Q&A]`, gap clamp(32px,5vw,64px).
- Cada par: bloco com `P` (mono, gradiente) acima da pergunta, `R` (mono, `#9a9ab0`) acima da resposta. Divisória `1px solid rgba(20,20,60,.09)` entre pares, padding-block 22px.

### Tipografia
- Pergunta: Space Grotesk 600, 18px, `#15152e`.
- Resposta: Inter 15.5px, `#3a3a55`, lh 1.6, max 56ch.
- Rótulos P/R: JetBrains Mono 12px.

### Cores / Interatividade
- Hover no par: fundo `rgba(79,91,213,.04)`, raio 12px, pergunta vira `#4f5bd5`. Transição 250ms.

### Responsividade
- ≤860px: 1 coluna; título deixa de ser sticky.

---

## Seção 7: CTA final

### Arquétipo e Constraints
- Arquétipo: Hero Dominante / Spotlight (bloco escuro de fechamento)
- Constraints: Dark block com Grid Background próprio + Glow radial + Mouse Parallax no glow
- Justificativa: encerrar com o mesmo bloco navy da dor cria simetria e foco total no CTA.

### Conteúdo
- Título: "Sua agenda pode parar de depender de sorte"
- Subtítulo: "Faça o Raio-X gratuito e descubra o primeiro passo pra encher seu consultório."
- CTA: "Fazer meu Raio-X agora"
- Selo abaixo: `Gratuito · 2 minutos · Vértice Labs + MEDSimple`

### Layout / Cores
- Faixa interna full-bleed com fundo `linear-gradient(165deg,#1d1d3d,#141430)`, raio `--r-lg`, padding `clamp(48px,7vw,80px) clamp(24px,5vw,64px)`, margem inferior antes do footer.
- Grade própria sobre o bloco: `linear-gradient` 46px com `rgba(255,255,255,.05)`, máscara radial central.
- Glow: dois radiais roxo/azul `rgba(124,92,255,.28)` e `rgba(79,91,213,.22)` que seguem o mouse (parallax suave, lerp 0.08).
- Título Space Grotesk 700 `clamp(28px,4vw,46px)` `#fff`, centralizado. Sub Inter 17px `rgba(255,255,255,.7)`. CTA `.btn-grad.btn-lg`. Selo mono `rgba(255,255,255,.5)`.

### Animações / Interatividade / Responsividade
- Reveal fade-up ao entrar. Glow parallax com mouse (desktop). CTA hover lift.
- ≤560px: padding reduz; glow parallax desligado (sem mouse).

---

## Seção 8: Footer
- Fundo `#f3f4f9`, borda-topo `1px solid rgba(20,20,60,.09)`, padding 40px 0.
- Esquerda: lockup `▲ Vértice Labs × MEDSimple` + linha mono `Raio-X do Consultório · captação de pacientes para consultório`.
- Direita: contato (WhatsApp), nota CFM curta, ano. Tipografia Inter 13.5px `#71718a`.

---

## Seção 9: Quiz overlay (form wizard) + resultados

### Arquétipo e Constraints
- Arquétipo: Form Wizard / Conversational (fullscreen stepper, uma pergunta por tela)
- Constraints: Progress bar gradiente + Transições slide/clip entre telas + Branching logic (P1 → Final B) + Reveal on demand
- Justificativa: quiz é o coração do funil; uma pergunta por tela maximiza conclusão (benchmark ≥25%).

### Disparo e shell
- Todo CTA com `href="#quiz"` ou `[data-open-quiz]` abre o overlay: `position:fixed;inset:0;z-index:80`, fundo `#f3f4f9` com `.grid-bg` próprio, fade+scale-in 280ms. Botão fechar (X) topo-direito; ESC fecha; trava scroll do body.
- Topo do overlay: lockup `Vértice Labs × MEDSimple` (esquerda) + barra de progresso (centro) + `X` (direita).
- Barra de progresso: trilho `rgba(20,20,60,.1)` altura 6px raio 999; preenchimento gradiente de marca, largura = `etapaAtual/totalEtapas`, transição width 400ms.

### Telas de pergunta (P1–P11 da copy)
- Cada tela centralizada, max-width 640px: rótulo mono `Pergunta X de N`, enunciado Space Grotesk 600 `clamp(22px,3.5vw,32px)` `#15152e`, opções abaixo.
- Opções (single choice P1,P2(lista),P4,P6,P7,P8,P9,P10,P11): cartões-botão empilhados, fundo `#fff`, borda `1px solid rgba(20,20,60,.12)`, raio 14px, padding 16px 18px, Inter 16px. Hover: borda `#4f5bd5` + `translateY(-2px)` + sombra. Selecionado: borda 2px `#7c5cff` + fundo `rgba(79,91,213,.06)` + check gradiente à direita. Ao escolher: avança automático após 220ms.
- P5 (múltipla escolha): mesmos cartões, mas toggle; rodapé com botão `Continuar` (`.btn-grad`) que só habilita com ≥1 selecionado.
- P3 (cidade) e P2 livre: input texto fundo `#fff`, borda, foco `#7c5cff`; botão `Continuar`.
- Navegação: botão `← voltar` discreto (mono, `#71718a`) topo-esquerda da área de conteúdo (exceto na 1ª).
- Transição entre telas: tela sai com slide-left + fade (clip-path inset), entra com slide-right + fade, 320ms `cubic-bezier(.2,.7,.3,1)`.

### Lógica de ramificação (branching)
- **P1** = "Ainda sou estudante de medicina" OU "Estou na residência (R1)" ⇒ pular direto para **Final B** (descarte). Não mostrar P2–P11.
- Demais respostas de P1 ⇒ seguir fluxo normal até P11 ⇒ **Final A**.
- Flag derivada `vaiAbrir = (P1 == "Quero abrir meu consultório em breve") || (P7 == "Ainda não atendo")` controla a variação de texto no Final A.

### Final A — Qualificado (tela de resultado)
- Layout: cartão central (max 560px) estilo `.card-xray` ampliado, header gradiente "Seu Raio-X está pronto".
- Bloco de gap dinâmico:
  - Se já atende: "Hoje você recebe **[faixa P7]** pacientes novos por mês. Sua meta é **[faixa P8]**. A diferença é de até **[gap]** pacientes por mês que seu consultório poderia atender e não atende." (gap = limite superior P8 − limite superior P7, mínimo 0).
  - Se `vaiAbrir`: "Você quer abrir e já mira **[faixa P8]** pacientes novos por mês. Sem captação montada, esse número não chega sozinho. Dá pra começar com isso resolvido desde o primeiro dia."
- Medidor `.gauge` animado com `% = pacienteHoje/meta` (se vaiAbrir, mostrar 0%).
- Diagnóstico (1 a 3 frases, montadas pelas regras P4/P5/P6 da copy — incluir só as que baterem).
- Recomendação (primeiro passo): texto base "Com base nas suas respostas, o primeiro passo pra você é " + sufixo derivado (sem site ⇒ "um site de conversão com presença no Google local"; tem site mas não anuncia ⇒ "estruturar tráfego para captação previsível"; já anuncia ⇒ "revisar e escalar a campanha dentro das regras do CFM").
- CTA primário `.btn-grad.btn-lg`: "Quero conversar sobre como destravar isso" ⇒ abre WhatsApp `https://wa.me/5531991618745?text=` + encode("Oi, acabei de fazer o Raio-X do Consultório e quero entender como destravar minha captação de pacientes.").
- Microcopy: "Conversa direta, sem custo. A gente mostra o plano e você decide."
- Animação: cartão entra scale-in 0.96→1 + fade 400ms; gauge anima após 500ms; confete sutil opcional (1 burst discreto) no load do Final A.

### Final B — Descarte (tela de resultado)
- Layout: cartão central calmo, SEM gradiente forte (fundo `#fff`, borda simples), tom acolhedor.
- Título: "Esse ainda não é o seu momento, e tudo bem"
- Texto: os 2 parágrafos da copy (estudante/R1).
- CTA suave (secundário, `.btn-primary` outline): "Conhecer a MEDSimple" ⇒ link MEDSimple (placeholder `https://medsimple.com.br`).
- SEM captura de dados, SEM segunda oferta (decisão do plano).

### Acessibilidade do overlay
- `role="dialog" aria-modal="true"`, foco inicial no primeiro controle, foco preso (focus trap), ESC fecha, retorno de foco ao CTA que abriu.

### Responsividade
- ≤560px: enunciado 22px, cartões full-width, barra de progresso fina (5px), header do overlay compacto (logo 18px, esconder `×`).

---

## Observações de implementação para `/desenvolver`
- Persistir respostas em objeto JS em memória (não precisa backend para o MVP). Opcional: enviar evento/console.log do payload para futura integração.
- Faixas P7/P8 mapeadas para números (limite superior) para cálculo do gap e do gauge.
- Telefone WhatsApp: `5531991618745` (número atual do Victor).
- Manter tudo em `index.html` + `style.css` (+ um `<script>` no fim ou `app.js` na pasta). Sem dependências externas além do Google Fonts; confete e parallax podem ser CSS/Canvas leve sem libs.
- Reaproveitar tokens e componentes já existentes (`.btn`, `.card-xray`, `.gauge`, `.grid-bg`, `[data-reveal]`).
