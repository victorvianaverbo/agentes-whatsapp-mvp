# Ações de otimização — Google Ads Vértice Labs

Base: período com R$ 249,34 / 122 cliques / 5 conversões / R$ 49,87 por conversão. Diagnóstico: tráfego lixo por correspondência ampla + verba em campanha sem retorno. Ordem de execução pela maior alavanca.

---

## 1. Aplicar as negativas em TODAS as campanhas (correção mais urgente)

Termos lixo passaram apesar de já existir `vertice-negativas-geral.txt`. Provável que a lista não estava associada às campanhas.

- No Google Ads: criar/usar uma **Lista de palavras-chave negativas** com o conteúdo de `vertice-negativas-geral.txt` (já expandida) e **associar às 5 campanhas** (Robô WhatsApp IA, Tráfego Pago, Sites, Agência, Automação IA).
- Tipo de correspondência das negativas: **frase** (padrão da lista).
- Manter também as negativas por campanha de `5-vertice-negativas-por-campanha.csv`.

Termos reais que motivaram a expansão (todos devem ficar bloqueados):
`chatgpt`, `chat ia`, `chat got`, `ia gratis`, `inteligência artificial gratuito`, `namorado virtual ia gratuito`, `falar com ia`, `assistente de ia`, `typebot desbanir`, `como criar um site gratuito`, `como fazer um site`, `ugc`, `email marketing`, `agencias de publicidad en queretaro`.

---

## 2. Pausar palavras-chave amplas perdedoras (`3-vertice-keywords.csv`)

Correspondência ampla sem dados de conversão = queima de verba. Pausar (ou mudar para frase/exata):

| Palavra-chave | Corresp. | Gasto | Conv. | Ação |
|---|---|---|---|---|
| chatbot inteligência artificial | ampla | R$ 23,51 | 0 | **Pausar** |
| inteligência artificial chatbot | ampla | R$ 17,41 | 0 | **Pausar** |
| chatbot com inteligencia artificial | ampla | R$ 1,83 | 0 | **Pausar** |
| criar um site profissional | ampla | R$ 15,32 | 0 | **Pausar** |
| empresas de marketing | ampla | R$ 38,60 | 1 | Mudar p/ **frase** "marketing para empresas" e vigiar |
| google marketing digital | ampla | R$ 7,65 | 0 | **Pausar** |
| consultoria de marketing | ampla | R$ 6,86 | 0 | **Pausar** |
| bot ia | ampla | R$ 1,98 | 0 | **Pausar** (status "baixa qualidade") |
| robo inteligencia artificial | ampla | R$ 0 | 0 | **Pausar** |
| inteligencia artificial conversar online | ampla | R$ 4,66 | 0 | **Pausar** |

Regra geral: o que sobrar de **correspondência ampla** sem conversão nos próximos dias → mudar para **frase** ou **exata**. Com R$ 250 de orçamento, broad é arriscado demais.

---

## 3. Manter / priorizar (intenção de compra comprovada)

Estas converteram ou têm intenção clara de contratação — manter e concentrar verba:

| Palavra-chave | Corresp. | Conv. | Obs. |
|---|---|---|---|
| [agente de ia para atendimento] | exata | 1 | R$ 3,23/conv — melhor da conta |
| "marketing digital para empresas" | frase | 2 | R$ 1,82/conv |
| [agencia de marketing] | exata | parte das 3 da Agência | CTR alto |
| "contratar agencia de marketing" | frase | — | intenção máxima, CTR 54% |
| [trafego pago instagram] | exata | — | CTR 15% |
| [agente de ia para vendas] | exata | — | intenção de SDR |

---

## 4. Pausar campanha "VL | Sites"

21 cliques, ~R$ 46, **0 conversão**. Termos foram DIY/site grátis (`como criar um site gratuito`, `como fazer um site`, `desenvelope site`).

- **Pausar a campanha agora.** Reavaliar no futuro só com palavras **exatas** de alta intenção (ex.: `[criação de site profissional]`, `[landing page de alta conversão]`) e orçamento próprio.

---

## 5. Ajuste de lance por dispositivo

96% do tráfego e ~100% das conversões vieram de **smartphone**. Desktop e tablet gastaram com ~0 conversão.

- Aplicar **ajuste de lance negativo** em Computadores e Tablets nas campanhas ativas: começar com **−50%** e, se mantiver 0 conversão, ir para **−80% / −90%**.
- Avaliar **excluir tablets** (volume e conversão desprezíveis).

---

## 6. Realocar verba

- Tirar verba de **Sites** (pausada) e das amplas pausadas.
- Concentrar em **VL | Agência** (3 conversões) e no grupo **IA Atendimento (exatas)** do Robô WhatsApp IA (origem da conversão mais barata).

---

## 7. Day-parting (programação) — adiar

Com apenas 5 conversões, dados por hora/dia são ruído estatístico. Como o atendimento pós-form é IA 24/7, **manter todas as horas** e revisar a programação só após ~30–50 conversões.

---

## Acompanhamento

Em 3–7 dias após aplicar 1–6, reabrir o **Relatório de termos de pesquisa** e confirmar:
- Sumiço dos termos lixo (chatgpt / ia grátis / site grátis / DIY / geo errada).
- Queda no custo por conversão e subida na taxa de resposta dos leads (tráfego mais qualificado).
