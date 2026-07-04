---
name: andromeda
description: Use quando o usuario quer gerar criativos estaticos (copy de anuncios) para rodar no Meta Ads (Facebook/Instagram). Esta skill produz lotes de 10-15 criativos por campanha com diversidade conceitual planejada (5+ hooks x 4+ angulos x 3+ formatos visuais) para alimentar o Meta Andromeda - o motor de retrieval que escolhe qual ad mostrar a cada user baseado em embeddings. Output e so copy (headline/body/CTA + descricao visual em texto), formatos 4:5 (feed mobile) e 9:16 (Stories/Reels).
---

# Skill: Andromeda

Gerador de criativos estaticos (copy) para Meta Ads otimizados para o motor de retrieval Andromeda. Produz lotes diversificados conceitualmente, nao iteracoes cosmeticas.

---

## Por que essa skill existe

Meta Andromeda (rollout global outubro/2025) e o motor de retrieval por embeddings que escolhe qual anuncio mostrar a cada user. Ele NAO usa targeting manual - usa similaridade semantica entre user e criativo, escolhendo entre milhoes de candidatos.

**Implicacao critica:**
- O algoritmo agrupa anuncios visualmente e tematicamente similares como UMA entidade. 5 ads que parecem iguais mas tem headlines diferentes = uma entidade so para o sistema.
- Volume sem diversidade = desperdicio. 15 variacoes cosmeticas do mesmo conceito viram 1 entidade.
- Diversidade SEMANTICA (hook + angulo + formato genuinamente diferentes) e o que faz o retrieval performar.

**Benchmarks de mercado pos-Andromeda:**
- 3-5 criativos -> sistema mostra o mesmo ad repetidamente
- 10-15 criativos -> casa angulos com personas
- 15-20+ criativos -> personalizacao maxima
- Iteracao (mesmo conceito, hook diferente) != Variacao (conceito diferente)
- Cadencia: hooks weekly, angulos bi-weekly, formatos monthly

---

## REGRA DE OURO

**Diversidade semantica, nao cosmetica.** Mudar cor de fundo, font ou trocar 1 palavra na headline NAO conta como variacao. Cada criativo do lote precisa de **hook + angulo + formato visual** genuinamente diferentes. O Andromeda detecta similaridade e agrupa ads parecidos como uma so entidade - anula o ganho de quantidade.

Se voce nao consegue resumir um criativo em 3 palavras que sejam DIFERENTES das do criativo anterior (ex: "dor noturna SDR" vs "case real medicina" vs "numero ROAS"), entao sao a mesma entidade pro algoritmo.

---

## FASE 0 - Briefing

Antes de gerar qualquer criativo, colete (ou confirme com o user):

- **LP / produto** (URL ou pasta no projeto)
- **Oferta** (o que vende, ticket, modelo de venda)
- **Persona-alvo principal** (quem compra)
- **Dor central** (o que o produto resolve)
- **Cases reais disponiveis** (nomes, numeros, depoimentos)
- **Diferencial competitivo** (vs concorrentes/alternativas)

Se algum desses estiver faltante e for critico para gerar copy honesta, **pergunte antes de gerar**. Nao invente numeros nem cases.

---

## FASE 1 - Matriz de Diversidade

Voce vai trabalhar em **4 eixos obrigatorios**. O criativo final escolhe 1 valor de cada eixo.

### Eixo 0: ANGULO DE VALOR (qual beneficio do produto destacar) - escolha 3+ por lote

Este eixo entrou no produto Kairos Operacao depois do feedback do user. Os 5 angulos de valor canonicos sao:

1. **Qualificacao desde o 1o contato** - "agente qualifica antes de mandar link", "lead errado some"
2. **Esquentamento desde o 1o contato** - "agente nao deixa esfriar", "do oi ao checkout sem perder"
3. **Identificacao de dor e desejo** - "agente escuta a dor antes de oferecer", "lead conta o que ninguem pergunta"
4. **SPIN Selling como tecnica** - "a maior tecnica de vendas, automatica", "S, P, I, N em cada conversa"
5. **Economia de 3 cargos (SDR + Closer + Suporte)** - "1 agente faz o trabalho de 3", "nao precisa contratar 3"

**Sub-angulos contextuais (1 criativo extra cada quando aplicavel):**
- **Lancamento** (PI/PLF, aulao, semana de imersao) - "qualifique durante a captacao", "captacao que ja qualifica", "chegue na live com lead pronto"
- **Recorrencia/Assinatura** (planos mensais, comunidade) - "cliente nao cancela quando e atendido", "suporte 24h reduz churn"
- **Trafego pago alto** (CAC alto, escala) - "cada lead custa R$ X, nao deixa morrer na 1a msg"
- **High-ticket** (mentoria/consultoria 5k+) - "lead high-ticket exige resposta rapida", "fechamento por SPIN escala mentoria"

**Regra:** cada lote precisa cobrir os 5 angulos de valor principais (3 criativos por angulo = 15 criativos). Sub-angulos contextuais sao opcionais conforme briefing - 1 criativo extra cada. Lote tipico vai de 15 (so principais) ate 19 (principais + 4 sub-angulos).

### Eixo 1: HOOK (gancho de abertura) - escolha 5+

| Hook | Exemplo |
|---|---|
| Pergunta provocativa | "Quanto voce perde por lead nao respondido?" |
| Dor especifica/temporal | "23h47. Lead chega. Ninguem responde." |
| Estatistica/dado | "70% dos infoprodutores perdem o funil aqui" |
| Contradicao | "Voce nao precisa de mais trafego." |
| Promessa direta | "Resposta em 60s. 24h por dia." |
| Curiosidade | "O que MEDSimple descobriu com 50k alunos no DM" |
| Confissao/story | "Eu odiava responder o WhatsApp aos sabados" |
| Comando | "Pare de perder lead as 23h." |

### Eixo 2: ANGULO (gatilho emocional) - escolha 4+

| Angulo | Exemplo |
|---|---|
| Financeiro | "R$ X em trafego no lixo todo mes" |
| Medo/perda | "Cliente vai postar reclamacao no Instagram" |
| FOMO | "Seus concorrentes ja fazem isso" |
| Aspiracional | "Time virando closer e CS senior" |
| Alivio | "Pare de gravar audio de 3min pela 47a vez" |
| Competitivo | "Diferencial que ninguem oferece" |
| Autoridade | "Ja roda em 2 EdTechs de producao" |
| Identidade | "Pra infoprodutor que leva serio" |

### Eixo 3: FORMATO VISUAL (o que aparece) - escolha 3+

| Formato | Descricao |
|---|---|
| Texto-only | Headline gigante MAS com elemento visual de apoio (ver Regra Visual abaixo) |
| Chat mockup | Conversa WhatsApp/Instagram sobre foto real de mao com celular |
| Screenshot CRM | Dashboard com fotos de avatares humanos nos cards, nao so texto |
| Antes/depois split | Foto cansada b&w (antes) vs avatar IA accent (depois) |
| Numero gigante | Numero sobre foto/textura (notas R$, ampulheta, etc) |
| Depoimento/citacao | Foto preto e branco da pessoa + citacao em italic |
| Demonstracao | Foto de mao real usando o produto, nao mockup flat |

### Regra Visual: nada chapado

Criativos chapados (fundo flat + so texto + sem foto/simbolo/textura) tem CTR baixo - competem no feed com fotos coloridas, memes, videos. Andromeda distribui mas user faz scroll-by.

**Cada criativo precisa de pelo menos UM destes elementos visuais (alem da tipografia):**

1. **Foto real** (estoque ou IA-gerada): pessoa, objeto, cenario, mao com celular
2. **Simbolo figurativo carregado de significado:**
   - **Pra valor financeiro:** notas brasileiras de R$ amassadas/voando, pilha de moedas, gota d'agua escorrendo
   - **Pra tempo/urgencia:** relogio analogico, ampulheta, calendario rasgado, vela queimando
   - **Pra IA/automacao:** cerebro com circuitos, engrenagens, robo humanoide minimalista
   - **Pra dor/fracasso:** cabeca nas maos, cadeira vazia, gelo derretendo, fogo
   - **Pra autoridade:** pilar grego classico, livro antigo, mapa antigo
   - **Pra escala:** escada, espiral, gradiente subindo, alvo
   - **Pra qualificacao/filtro:** peneira, lupa, funil, raio-x
3. **Textura:** papel rasgado, gelo derretendo, fogo, glitch digital, dinheiro amassado, marmore, neon
4. **Composicao layered:** foto + tipografia sobreposta + simbolo no canto + tag accent
5. **Mockup com profundidade:** celular real (foto) com chat sobreposto, nao chat flat
6. **Referencia cultural BR:** bandeira sutil, real brasileiro, cor amarelo do real, paisagem brasileira

**Combinacoes que funcionam pro Kairos Operacao:**
- Foto de mao segurando celular + chat WhatsApp sobreposto + tag accent "esquentando"
- Foto de relogio analogico marcando 23h + headline em sobreposicao
- Foto de notas R$ amassadas/voando + numero gigante sobreposto
- Foto de pessoa cansada (b&w, cabeca na mao) + avatar IA accent no outro lado (split)
- Foto de pilha de papeis/CRM caotico vs dashboard organizado (split)
- Foto de cerebro humano em b&w + tipografia "SPIN" em accent
- Foto de funil de cozinha real ou peneira + tipografia "qualifica" em accent
- Foto de termometro caindo + headline "lead esfria"

**Tipografia recomendada (mistura, igual as referencias visuais ricas):**
- Sora 800 + Instrument Serif italic juntos (como hero da LP)
- Headline em sans bold + palavra-destaque em serif italic em accent
- Variacao de tamanho dramatica (1 palavra gigante + 5 palavras pequenas)

**Nunca fazer (visual chapado):**
- Fundo dark/light flat + so texto sem nenhum elemento visual de apoio
- Mockup de chat sem referencia ao mundo real (chat flat solto, sem celular/mao)
- Emoji ` ` ` em vez de simbolo desenhado/fotografico (parece preguica)
- Excesso de elementos (3+ simbolos competindo) - escolher 1 protagonista visual + 1 de apoio
- Stock photo de "homem de terno apontando" - cliche, baixo CTR

**Receita:** 5 hooks x 4 angulos x 3 formatos = 60 combinacoes teoricas. Selecione as 10-15 mais fortes evitando redundancia semantica entre criativos do mesmo lote.

**Como evitar redundancia:** depois de escolher uma combinacao, escreva a "etiqueta semantica" em 3 palavras (ex: "dor-noturna-texto", "case-medsimple-chat", "numero-roas-grande"). Se duas etiquetas estao a 1 palavra de distancia, descarte uma.

---

## FASE 2 - Geracao de Copy por Criativo

Cada criativo gerado segue **exatamente** essa estrutura:

```
CRIATIVO #N
Hook: [tipo do eixo 1]
Angulo: [tipo do eixo 2]
Formato visual: [tipo do eixo 3]
Persona implicita: [quem reage a esse - 1 frase]
Etiqueta semantica: [3 palavras unicas no lote]

HEADLINE: [<= 6 palavras, mobile-first]
SUBHEADLINE: [1 linha, opcional]
BODY: [40-90 caracteres, lead in para o CTA]
CTA: [acionavel, especifico, nunca generico]

VISUAL EM TEXTO:
[Descricao concreta do que aparece. Ex: "Chat
WhatsApp dark mode. Lado direito mensagem do lead
em verde 22:47 'oi, vi o anuncio'. Lado esquerdo
Camila respondendo em cinza 22:47 'opa, te conta o
que te chamou atencao?'. Avatar circular C com
fundo bege na esquerda."]

ADAPTACAO 4:5 (feed mobile):
[Como organiza nesse aspect ratio. Geralmente
headline em cima, visual no centro, CTA embaixo.]

ADAPTACAO 9:16 (Stories/Reels):
[Como organiza no vertical full-screen. Headline
ocupa primeiro terco superior, visual o centro, CTA
no terco inferior. Mais respiro vertical.]
```

### Regras de copy

- **Headlines <= 6 palavras** - mobile feed corta. Sem excecao.
- **CTAs acionaveis** - "Aplica gratis", "Ve se serve pro seu funil", "Quero o CRM". NUNCA "Saiba mais", "Clique aqui", "Conheca".
- **Numeros so reais** - cases (50k MEDSimple, IRD), benchmarks publicados, ou genericos sem promessa ("R$ X", "+%"). Inventar numero queima credibilidade e reprova review do Meta.
- **Tom = primeira pessoa do Victor** - mesmo tom da LP. Coloquial, direto, sem jargao corporativo.
- **Sem em-dash** - troca por virgula, ponto ou dois-pontos. (Padrao do user ja conhecido.)

---

## FASE 3 - Output

Cada lote gera **2 arquivos** em `criativos/[lp-nome]/`:

1. **`lote-YYYY-MM-DD.md`** - briefing visual completo (headlines, body, CTA, descricao visual em texto, adaptacoes 4:5/9:16)
2. **`meta-ads-textos-YYYY-MM-DD.md`** - os 3 campos prontos pra copiar/colar no Meta Ads Manager (Texto principal, Titulo, Descricao) por criativo

### Arquivo 1: lote-YYYY-MM-DD.md

### Estrutura do documento

```markdown
# Criativos [Nome da LP] - Lote [data]

## Resumo da matriz

- Hooks cobertos: [lista]
- Angulos cobertos: [lista]
- Formatos visuais cobertos: [lista]
- Total de criativos: [N]

## Tabela-indice

| # | Hook | Angulo | Formato | Headline | Persona |
|---|------|--------|---------|----------|---------|
| 1 | ... | ... | ... | ... | ... |
| 2 | ... | ... | ... | ... | ... |
...

## Detalhamento

### CRIATIVO #1
[bloco completo da Fase 2]

### CRIATIVO #2
[bloco completo da Fase 2]
...

## Cadencia de upload sugerida

Nao subir os 15 criativos no mesmo dia - escalonar 3-5 por dia ao longo de 3-5 dias.
Isso evita disparar fatigue precoce e da tempo do Andromeda mapear performance
de cada conceito antes de saturar a audiencia.

Dia 1: Criativos #1, #2, #3 (cobrir 3 hooks diferentes)
Dia 2: #4, #5, #6 (cobrir mais 3 hooks)
Dia 3: #7, #8, #9 (formatos visuais novos)
Dia 4: #10, #11, #12 (angulos restantes)
Dia 5: #13-15 (resto)
```

### Arquivo 2: meta-ads-textos-YYYY-MM-DD.md

Arquivo separado pronto pra copiar/colar no Meta Ads Manager. 1 bloco por criativo com 3 campos:

```
## #N - [headline curta do criativo]

**Texto principal:**
[Texto persuasivo, 2-3 paragrafos curtos. Os primeiros 125 chars sao
o que aparece sem "ver mais". Pode passar de 125 (ate 2200), mas a parte
critica (gancho + servico) vai no inicio.]

**Titulo:** [ate 40 caracteres - aparece em destaque embaixo do criativo]

**Descricao:** [ate 30 caracteres - linha menor abaixo do titulo, opcional mas usar quando couber]
```

**Tamanho dos campos do Meta Ads:**
- Texto principal: ate 125 chars sem "ver mais", ate 2200 chars total
- Titulo: ate 40 chars
- Descricao: ate 30 chars

**No final do arquivo, incluir:**
- URL de destino + sugestao de UTMs (`?utm_source=meta&utm_medium=paid&utm_campaign=[lp]&utm_content=criativo-N`)
- Botao CTA recomendado ("Saiba mais" ou "Cadastre-se")
- Nota: todos os criativos no MESMO conjunto de anuncios (Andromeda otimiza melhor cross-creative)

---

## NUNCA FAZER

- Variar so cor de botao/font/background sem mudar o conceito
- Trocar 1 palavra na headline e contar como criativo novo
- Repetir mesmo angulo emocional em 3+ criativos do mesmo lote
- Entregar < 10 criativos por campanha (Andromeda nao tem material)
- Headline > 6 palavras (perde no mobile feed)
- CTA generico ("Saiba mais", "Clique aqui", "Conheca", "Ver mais", "Aplicar agora" sem dizer pra que)
- **CTA sem nome do produto/servico** - o user precisa saber o que vai acontecer se clicar. "Quero o agente no meu WhatsApp" > "Aplicar". "Quero a Camila no meu funil" > "Quero saber mais".
- Ignorar adaptacao 9:16 (Stories tem hierarquia diferente do feed)
- Inventar numero/case que nao existe no produto
- Usar em-dash (preferencia do user)
- Pular Fase 0 (Briefing) - sem dor central e cases reais, copy vira generica
- **Usar "vazar / vazamento"** (preferencia do user). Trocar por: "perde", "morre na 1a msg", "para no caminho", "escapa", "fica para tras"
- **Usar "sub-segundo"** (confuso). Trocar por: "menos de 1 segundo", "instantaneo", "em segundos"
- **Mencionar nomes de clientes especificos do Victor por nome em ad pago** (MEDSimple, IRD, Verstehen, etc). Usar descricoes genericas: "plataforma de medicina com 50k alunos", "preparatorio juridico", "instituto de desenvolvimento infantil". Nomes proprios so na LP (que e contexto/carta), nao em ad publico.
- **Nao deixar claro o que e o servico em ate 2 segundos de leitura.** Em todo criativo precisa aparecer (no body, subhead ou CTA) o que esta sendo oferecido: "agente de IA", "agente que atende WhatsApp/Instagram", "time de IA Operacional", ou "agente que faz SDR + Closer + Suporte". Sem isso o user ve a dor mas nao sabe o que comprar.
- **NUNCA usar "Kairos" como nome da IA / agente.** Kairos e a marca-mae, nao comunica valor pra lead frio que nao conhece. Use:
  - "Seu time de IA Operacional" (descricao do que e)
  - "Agente IA" (generico)
  - "Camila" (persona individual do agente, ja consolidada na LP)
  - "Operacao de IA"
  - **NUNCA:** "Kairos responde", "Kairos Operacao atende", "A Camila do Kairos faz". Trocar por "Seu time de IA Operacional responde", "A Camila atende", "O agente IA faz".
- O nome "Kairos" pode aparecer na assinatura/logo (canto), mas nunca na headline, subhead, body ou CTA como o sujeito que executa a acao.

---

## Checklist de diversidade (rodar antes de entregar)

- [ ] >= 10 criativos no lote
- [ ] >= 5 hooks distintos cobertos
- [ ] >= 4 angulos emocionais distintos
- [ ] >= 3 formatos visuais distintos
- [ ] Pelo menos 1 criativo com case real
- [ ] Pelo menos 1 com numero especifico
- [ ] Pelo menos 1 chat mockup
- [ ] Pelo menos 1 texto-only
- [ ] 100% headlines <= 6 palavras
- [ ] 100% CTAs com nome do produto/servico (nao "Aplicar agora" generico)
- [ ] 100% criativos deixam claro o servico em 2s (mencao a "agente IA", "time de IA Operacional", "WhatsApp/Instagram" no body/subhead/CTA)
- [ ] Zero ocorrencias de "vazar/vazamento" / "sub-segundo"
- [ ] Zero nomes proprios de clientes especificos (MEDSimple/IRD/Verstehen viram "plataforma de medicina"/"preparatorio juridico"/etc)
- [ ] Zero "Kairos" como sujeito que age (Kairos so na assinatura/logo, nunca em "Kairos responde", "Kairos atende"). Trocar por "agente IA", "time de IA Operacional" ou "Camila".
- [ ] Cobertura dos 5 angulos de valor (qualificacao, esquentamento, identificacao de dor, SPIN Selling, economia 3-em-1) - 3 criativos por angulo no lote de 15.
- [ ] **100% criativos com elemento visual rico** (foto/simbolo/textura) - zero criativos chapados (so texto em fundo flat).
- [ ] 2 aspect ratios cobertos (4:5 + 9:16) por criativo
- [ ] Zero etiquetas semanticas redundantes (3 palavras unicas)
- [ ] Cadencia de upload sugerida no rodape

Se algum item falha, ajuste o lote antes de entregar. Nao entregue lote incompleto.

---

## Bibliotecas prontas para os 2 produtos atuais

### Kairos Suporte (lp-suporte-alunos)

**Produto:** IA que absorve conteudo do curso (PDFs, apostilas, transcricoes) e responde aluno no WhatsApp 24/7 com profundidade do criador.

**Persona-alvo:** criador de curso/mentoria com 100-2000 alunos, sente que e gargalo do suporte.

**Dores prontas:**
- Gargalo do dono (tudo trava se ele nao responde)
- Aluno trava na primeira aula e desiste
- Equipe nao domina o conteudo
- Gravar audio de 3min explicando a mesma duvida pela 47a vez
- Churn alto, alunos pedem reembolso
- Nao consegue escalar sem se matar

**Cases:**
- Instituto Verstehen (Filhos e Telas) - 15 capitulos absorvidos, pais perguntam 23h sobre desenvolvimento infantil, IA responde com profundidade do livro

**CTA padrao:** "Quero ver se serve pro meu curso"

### Kairos Operacao (lp-operacao)

**Produto:** Agente IA que faz SDR + Closer + Suporte 24/7 no WhatsApp/Instagram. Vem com CRM web (Kanban, timeline, broadcasts).

**Persona-alvo:** infoprodutor (curso, mentoria, lancamento, EdTech, comunidade paga) com 100+ contatos/mes via WhatsApp/DM.

**Dores prontas:**
- Lead chega 22h47 e ninguem responde
- SDR humano fala com 40 leads/dia, "oi tudo bem" 3h depois
- Cliente pagante manda duvida e ouve grilo
- CRM e planilha, vendas e WhatsApp pessoal, suporte e outro WhatsApp
- Trafego pago no lixo
- Nao sabe quem ta quente, quem abandonou checkout

**Cases:**
- MEDSimple - +50k alunos medicina, Luiza no Instagram DM, responde <1s, identifica estagio (lead/cliente) e vira SDR/Closer/Suporte na mesma caixa
- Instituto IRD - concursos juridicos (ENAM/Magistratura), Camila no WhatsApp + CRM web proprio, esteira de aulao (vespera/1h antes/pos), integracao Hotmart

**CTA padrao:** "Quero entender se serve pro meu funil"

---

## Como invocar essa skill

User pede: "gera criativos pra LP operacao" / "preciso de ads pra Kairos Suporte" / "monta um lote pra Andromeda"

Voce executa:
1. Fase 0 - confirma briefing (usa biblioteca pronta se for um dos 2 produtos atuais)
2. Fase 1 - monta matriz e seleciona 10-15 combinacoes
3. Fase 2 - escreve copy de cada criativo
4. Fase 3 - salva em `criativos/[lp-nome]/lote-YYYY-MM-DD.md`
5. Roda checklist de diversidade
6. Entrega o caminho do arquivo + resumo da matriz

---

## Fontes e referencias

- [Meta Engineering - Andromeda paper original](https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/)
- [303.london - Creative Diversity guide (semantic vs cosmetic)](https://www.303.london/blog/complete-guide-to-creative-diversity-for-meta-andromeda)
- [1ClickReport - Andromeda 2026 (volumes recomendados)](https://www.1clickreport.com/blog/meta-andromeda-update-2025-guide)
- [MTM Agency - benchmark CPA -40%](https://themtmagency.com/blog/meta-andromeda-october-2025-update-why-creative-diversity-now-defines-ad-performance)
