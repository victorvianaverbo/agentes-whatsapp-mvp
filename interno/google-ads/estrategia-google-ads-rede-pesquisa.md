# Estratégia Google Ads — Rede de Pesquisa · Vértice Labs

> **Premissas (definidas com o cliente):**
> - Verba de mídia: **> R$10.000/mês** (exemplo base de cálculo: **R$12.000/mês ≈ R$395/dia**)
> - Geografia: **Brasil inteiro**
> - Serviços-foco: **Tráfego pago · Robô WhatsApp IA · Sites · Ecossistema (agência)**
> - Conversão de valor: **Lead no formulário** (diagnóstico gratuito)
> - Honorário de gestão é separado desta verba.

---

## 0. PRÉ-REQUISITOS — sem isso, NÃO suba campanha

Estes 3 itens são bloqueadores técnicos. Rodar pesquisa sem eles = pagar clique e perder o lead / ficar cego.

### 0.1 — Rastreamento de conversão (obrigatório)
A conversão escolhida é "lead no formulário". Hoje o form não envia nada e não há `gtag`. Fluxo correto:

1. Criar conversão no Google Ads → tipo **Site → Enviar formulário de lead** → copiar `AW-XXXXXXXXX` e o rótulo (`label`).
2. Tag global `gtag.js` no `<head>` de **todas** as páginas (`index`, `trafego-pago`, `robo-whatsapp`, `sites-de-alta-conversao`, `seo`).
3. Disparar o evento no momento em que o formulário é concluído (em `site.js`, quando aparece o `#formDone`):

```js
// dentro do else final do btnNext (quando o form é concluído):
if (typeof gtag === 'function') {
  gtag('event', 'conversion', {
    'send_to': 'AW-XXXXXXXXX/RotuloAqui',
    'value': 1.0, 'currency': 'BRL'
  });
}
```

4. **Importante:** marcar essa conversão como **"Primária"** (otimização) e usar **contagem "Uma"** (1 lead por clique, evita inflar).
5. Conectar o `<form>` à function `netlify/functions/capi-lead.js` (ou Netlify Forms) para o lead **chegar até você** — o gtag mede, a function entrega.

### 0.2 — Página com URL pública
A `vertice-labs/` não tem rota no `netlify.toml`. Criar redirect (ex.: `/vertice` → `vertice-labs/index.html`) e por serviço (`/vertice/trafego` etc.) para usar como URL final dos anúncios.

### 0.3 — Conteúdo que sustenta o anúncio
- Substituir os **depoimentos `[PREENCHER]`** por reais (mín. 2 por página).
- Trocar os **números "ilustrativos"** (`+R$ X mi`, ROAS 3.4x) por reais OU benefício qualitativo. **Alegação financeira não comprovada pode reprovar o anúncio** e fere a política do Google.

---

## 1. ESTRUTURA DA CONTA

Separação por **serviço** (cada um tem CPC, intenção e LP próprios → melhor Índice de Qualidade e controle de verba).

```
CONTA — Vértice Labs
│
├── CAMP 1 · MARCA ............................ 5%   (~R$20/dia)   → index.html
├── CAMP 2 · TRÁFEGO PAGO (gestão) ........... 28%   (~R$110/dia)  → /vertice/trafego
├── CAMP 3 · ROBÔ WHATSAPP IA ................ 24%   (~R$95/dia)   → /vertice/robo
├── CAMP 4 · SITES ALTA CONVERSÃO ........... 18%   (~R$70/dia)   → /vertice/sites
├── CAMP 5 · AGÊNCIA / ECOSSISTEMA .......... 15%   (~R$60/dia)   → index.html
└── CAMP 6 · CONCORRÊNCIA (opcional) ......... 10%   (~R$40/dia)   → /vertice/trafego
```

> Distribuição ajustável. **Recomendo subir em 2 ondas:** Onda 1 = Marca + Tráfego + Robô IA (maior intenção/melhor lead). Onda 2 (após 2-3 semanas com dados) = Sites + Agência + Concorrência.

### Configurações comuns a TODAS as campanhas de pesquisa
| Item | Valor |
|---|---|
| Tipo | Apenas **Rede de Pesquisa** |
| Redes | ❌ Desmarcar "Parceiros de pesquisa" e "Rede de Display" (ligar só depois) |
| Local | Brasil |
| **Opções de local** | **"Presença: pessoas que ESTÃO nos locais segmentados"** ⚠️ (NÃO "interesse" — evita tráfego internacional) |
| Idioma | Português |
| Dispositivos | Todos no início; ajustar lance por dados depois |
| Programação | Inicialmente 24/7; após dados, reforçar horário comercial |
| Estratégia de lance | **Fase 1:** Maximizar cliques (c/ CPC máx. teto) → **Fase 2:** Maximizar conversões → **Fase 3:** CPA desejado (ver §6) |

---

## 2. PALAVRAS-CHAVE POR CAMPANHA

**Regra de correspondência:** começar com **Exata** `[ ]` e **Frase** `" "`. Evitar **Ampla** até ter Smart Bidding + dados (Brasil inteiro + ampla cedo = verba queimada). 1 tema por grupo de anúncios.

### CAMP 1 · MARCA
Grupo único:
```
[vértice labs]   "vertice labs"   [vértice labs agência]   [agência vértice labs]
```
> Barata, protege a marca de concorrente, CTR altíssimo. Sempre rode.

### CAMP 2 · TRÁFEGO PAGO  → /vertice/trafego
**Grupo 2A · Gestão de tráfego**
```
[gestão de tráfego pago]  "agência de tráfego pago"  [gestor de tráfego]
"empresa de tráfego pago"  [gestão de tráfego para empresas]  "consultoria de tráfego pago"
```
**Grupo 2B · Google Ads**
```
"gestão de google ads"  [agência google ads]  "anunciar no google"
[criar campanha google ads]  "especialista em google ads"
```
**Grupo 2C · Meta/Instagram Ads**
```
"gestão de meta ads"  [agência de tráfego instagram]  "anunciar no instagram"
[gestor de tráfego meta ads]  "tráfego pago instagram"
```

### CAMP 3 · ROBÔ WHATSAPP IA  → /vertice/robo
**Grupo 3A · Atendimento IA / chatbot**
```
"chatbot para whatsapp"  [atendimento automático whatsapp]  "robô de atendimento whatsapp"
[agente de ia para whatsapp]  "automação de atendimento whatsapp"  [ia para atendimento]
```
**Grupo 3B · IA para vendas/SDR**
```
"agente de ia para vendas"  [ia que atende cliente]  "robô que qualifica lead"
[automação de vendas whatsapp]  "atendimento com inteligência artificial"
```
> CPC mais barato e menos concorrência que tráfego. Costuma trazer o melhor custo por lead da conta.

### CAMP 4 · SITES ALTA CONVERSÃO  → /vertice/sites
**Grupo 4A · Criação de site/LP**
```
[criação de site que converte]  "agência de criação de sites"  [criar landing page]
"empresa de criação de sites"  [site para empresa]  "desenvolvimento de landing page"
```
**Grupo 4B · Site que vende**
```
"site de alta conversão"  [site profissional para empresa]  "página de vendas"
[criar site para vender]  "site institucional profissional"
```

### CAMP 5 · AGÊNCIA / ECOSSISTEMA  → index.html
**Grupo 5A · Agência de marketing**
```
"agência de marketing digital"  [agência de marketing para empresas]
[agência de marketing de performance]  "empresa de marketing digital"
```
> ⚠️ Termos caros e mais genéricos. Lance conservador + negativas fortes. Avalie pausar grupos com CPA ruim.

### CAMP 6 · CONCORRÊNCIA (opcional)  → /vertice/trafego
```
"[nome de agência concorrente]"  (frase/ampla modificada)
```
> Nunca usar a marca do concorrente no TEXTO do anúncio (viola política). Só como palavra-chave. CTR baixo, CPC alto — monitorar de perto.

---

## 3. PALAVRAS-CHAVE NEGATIVAS (lista compartilhada — aplicar à conta toda)

Você vende serviço B2B. Quem busca curso/emprego/grátis **não é cliente** — é clique queimado.

```
Lista "Negativas Geral":
grátis, gratis, curso, cursos, aula, aulas, como fazer, tutorial, aprender, passo a passo,
vaga, vagas, emprego, salário, salario, concurso, estágio, estagio, trainee, clt, pj,
freelancer, freela, download, pdf, apostila, planilha, template grátis, faculdade,
significado, "o que é", "o que significa", reclame aqui, golpe, "é confiável", processo seletivo
```
Negativas extras por campanha:
- **CAMP 3 (robô IA):** `whatsapp gb`, `whatsapp plus`, `baixar whatsapp`, `figurinha`, `status`
- **CAMP 4 (sites):** `wix`, `gratuito`, `wordpress curso`, `criar site grátis`, `hospedagem`
- **CAMP 2 (tráfego):** `curso de tráfego`, `formação`, `mentoria`, `como ser gestor`

> Revisar o **Relatório de Termos de Pesquisa** 2x/semana nas primeiras 4 semanas e ir engordando a lista.

---

## 4. ANÚNCIOS (RSA — Anúncio Responsivo de Pesquisa)

Cada grupo: **1 RSA** com até 15 títulos + 4 descrições. **Fixe** 1-2 títulos com a palavra-chave do grupo na posição 1. Inclua o benefício, a prova e o CTA.

### Modelo — CAMP 2 (Tráfego pago) — copie e adapte
**Títulos (até 30 caracteres cada):**
```
1. Agência de Tráfego Pago        (fixar pos. 1)
2. Gestão de Google e Meta Ads
3. Tráfego Focado em Venda
4. Pare de Gastar Sem Vender
5. Lead Qualificado e Barato
6. Diagnóstico Gratuito Hoje      (fixar pos. 1 ou 2)
7. Otimização Diária da Verba
8. ROI Que Você Consegue Prever
9. Google + Meta no Mesmo Plano
10. Custo por Lead Sob Controle
11. Mais Cliente, Não Curtida
12. Gestão de Tráfego Profissional
13. 100% Online, Todo o Brasil
14. Transparência Total na Verba
15. Anuncie com Quem Mira Venda
```
**Descrições (até 90 caracteres cada):**
```
1. Gestão de Google Ads e Meta Ads que mira venda, não vaidade. Diagnóstico gratuito.
2. Atraia o cliente certo, baixe seu custo por lead e tenha retorno previsível todo mês.
3. Ecossistema completo: anúncio + site que converte + atendimento por IA 24h. Fale agora.
4. Sem pacote engessado. Montamos a estratégia sob medida. Solicite seu diagnóstico grátis.
```

### Linhas de título por campanha (use como base)
- **CAMP 3 (Robô IA):** "Atendimento por IA 24h" · "Robô de WhatsApp com IA" · "Nunca Perca um Lead" · "IA Que Qualifica e Agenda" · "Implantamos e Gerimos Tudo" · "Responde em Segundos, 24h"
- **CAMP 4 (Sites):** "Site Que Converte Visita" · "Criação de Site Profissional" · "Landing Page de Alta Conversão" · "Site Feito Para Vender" · "Página Rápida e Persuasiva"
- **CAMP 5 (Agência):** "Agência de Marketing Digital" · "Marketing de Performance" · "Sua Máquina de Vendas" · "Ecossistema Completo de Venda"

> Em cada RSA, mantenha **"Diagnóstico Gratuito"** e **"100% Online, Todo o Brasil"** — são seus diferenciais e melhoram o CTR.

---

## 5. RECURSOS / EXTENSÕES (ativar em todas — sobem o CTR e o Índice de Qualidade)

| Recurso | Conteúdo |
|---|---|
| **Sitelinks** (6) | Tráfego Pago · Atendimento com IA · Sites de Conversão · SEO · Como Funciona · Diagnóstico Grátis |
| **Frases de destaque** | 100% Online · Otimização Diária · Foco em Venda · Transparência Total · Atendimento 24/7 · Todo o Brasil |
| **Snippets estruturados** | Cabeçalho "Serviços": Tráfego Pago, Atendimento IA, Criação de Sites, SEO |
| **Formulário de lead** | Ativar extensão de formulário (lead direto na SERP) — backup do form do site |
| **Chamada** | Se atender por telefone, adicionar nº (senão, pular — conversão é form) |
| **Local** | Pular (atendimento 100% online, sem endereço físico relevante) |
| **Imagem** | Subir 3-4 imagens da marca/peças (melhora destaque no mobile) |

---

## 6. ESTRATÉGIA DE LANCES — evolução em 3 fases

| Fase | Quando | Estratégia | Objetivo |
|---|---|---|---|
| **1 — Coleta** | Semanas 1–3 (até ~15-30 conversões) | **Maximizar cliques** com **CPC máx. teto** (ex.: R$8-12) | Gerar dados de conversão sem o algoritmo "voar cego" |
| **2 — Aprendizado** | Após 15-30 conv. | **Maximizar conversões** | Deixar o Smart Bidding otimizar por lead |
| **3 — Eficiência** | Após ~30-50 conv./mês estáveis | **CPA desejado** (tCPA) | Travar o custo por lead no patamar saudável |

> Não pule pra tCPA cedo — sem histórico de conversão ele sufoca a entrega. A conversão do §0.1 **precisa** estar funcionando desde o dia 1.

---

## 7. CRONOGRAMA DE LANÇAMENTO

| Quando | Ação |
|---|---|
| **Antes do D0** | Concluir §0 (conversão + form + URL + depoimentos/números reais) |
| **D0** | Subir Onda 1: Marca + Tráfego + Robô IA. Lance = Maximizar cliques c/ teto |
| **D1–D3** | Monitorar diário: termos de pesquisa, CTR, se conversão dispara. Engordar negativas |
| **Semana 2** | Subir Onda 2: Sites + Agência. Pausar keywords com CPC alto e zero conversão |
| **Semana 3-4** | Migrar campanhas com dados → Maximizar conversões. Cortar termos ruins |
| **Mês 2** | Campanhas estáveis → tCPA. Testar correspondência Ampla + Smart Bidding em 1 grupo campeão |
| **Mês 2+** | Avaliar **Performance Max** de apoio e **remarketing** (depende de volume de tráfego no site) |

---

## 8. METAS E KPIs

| Métrica | Meta inicial (referência B2B serviço) | Onde olhar |
|---|---|---|
| CTR (Pesquisa) | > 5% (marca > 15%) | Campanhas |
| Índice de Qualidade | ≥ 7/10 | Palavras-chave → colunas |
| Taxa de conversão da LP | 3-8% | Conversões |
| Custo por lead (CPL) | Definir teto no diagnóstico — acompanhar tendência | Conversões |
| Parcela de impressão | > 60% na marca | Métricas de concorrência |

> **Otimização semanal fixa:** (1) termos de pesquisa → negativar; (2) pausar keyword com gasto alto e 0 conversão; (3) realocar verba pra campanha de menor CPL; (4) testar 1 título novo no RSA campeão.

---

## 9. CHECKLIST RÁPIDO DE GO-LIVE

- [ ] Conversão "Lead formulário" criada, marcada como Primária, contagem "Uma"
- [ ] `gtag.js` em todas as páginas + evento no submit do form
- [ ] Form conectado à function `capi-lead.js` (lead chega no e-mail/CRM)
- [ ] Redirect `/vertice/*` no `netlify.toml`
- [ ] Depoimentos reais + números reais (ou removidos)
- [ ] Negativas "Geral" aplicadas à conta
- [ ] Opção de local = **Presença** (não interesse)
- [ ] Display e Parceiros de pesquisa **desmarcados**
- [ ] Sitelinks, frases de destaque e snippets ativos
- [ ] Lance = Maximizar cliques com teto (fase 1)
- [ ] Orçamento diário distribuído por campanha
```
