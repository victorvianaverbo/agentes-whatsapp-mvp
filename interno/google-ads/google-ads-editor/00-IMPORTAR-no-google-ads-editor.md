# Importar no Google Ads Editor — Vértice Labs

Importe os arquivos **nesta ordem** (pai antes de filho). No Google Ads Editor:
**Conta → Importar → Do arquivo** (ou Ctrl+I), um CSV por vez, conferindo o preview antes de aceitar.

| Ordem | Arquivo | O que cria |
|---|---|---|
| 1 | `1-vertice-campanhas.csv` | 5 campanhas (tipo Pesquisa, orçamento diário, Maximizar cliques) — **criadas Pausadas** |
| 2 | `2-vertice-grupos.csv` | 10 grupos de anúncios + CPC máx. padrão |
| 3 | `3-vertice-keywords.csv` | Palavras-chave (Exata e Frase) |
| 4 | `4-vertice-anuncios-rsa.csv` | Anúncios responsivos (RSA) — 1 por grupo |
| 5 | `5-vertice-negativas-por-campanha.csv` | Palavras-chave negativas por campanha |
| 6 | `6-vertice-sitelinks.csv` | Sitelinks |
| 7 | `7-vertice-frases-destaque.csv` | Frases de destaque (callouts) |
| 8 | `8-vertice-snippets-estruturados.csv` | Snippets estruturados |

> Os arquivos 1 e 2 são o esqueleto que faltava. Sem eles, ao importar keywords/anúncios o Editor cria campanhas/grupos "vazios", sem orçamento nem lance.

## Depois de importar — ajustar no Editor (não vem por CSV)

Por campanha (todas):
- **Locais:** Brasil · **Opção de local = "Presença"** (não "interesse").
- **Idioma:** Português.
- **Redes:** só Pesquisa → **desmarcar** "Parceiros de pesquisa" e "Rede de Display".
- **Maximizar cliques:** definir **CPC máximo (teto) ≈ R$ 8–12** (Fase 1 de coleta).
- **Programação/dispositivos:** padrão no início.

Negativas gerais (lista compartilhada — aplicar à conta toda, via UI/biblioteca):
`grátis, gratis, curso, cursos, aula, vaga, emprego, salário, concurso, estágio, freelancer, download, pdf, apostila, faculdade, "o que é", "reclame aqui", golpe`

## Lançamento (do plano)
- **Onda 1 (D0):** ativar **VL | Marca**, **VL | Tráfego Pago**, **VL | Robô WhatsApp IA**.
- **Onda 2 (semana 2-3, com dados):** ativar **VL | Sites** e **VL | Agência**.
- Todas entram **Pausadas** de propósito — você ativa quando for ao ar.

## Antes de postar (revisar)
- Conversão "Lead formulário" já está no site (gtag dispara no envio). Marque como **Primária**, contagem **"Uma"**.
- Confira em **Manter alterações** (Keep) e só então **Postar** para a conta.
