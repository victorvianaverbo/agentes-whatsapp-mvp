# Como importar no Google Ads Editor

Arquivos nesta pasta:

| Arquivo | O que é |
|---|---|
| `vertice-keywords.csv` | Palavras-chave positivas (Exata + Frase) das 5 campanhas |
| `vertice-anuncios-rsa.csv` | Anúncios responsivos de pesquisa (1 por grupo) |
| `vertice-negativas-por-campanha.csv` | Negativas específicas por campanha |
| `vertice-negativas-geral.txt` | Lista de negativas B2B para a lista compartilhada da conta |
| `vertice-sitelinks.csv` | Links de site (conta + por campanha) |
| `vertice-frases-destaque.csv` | Frases de destaque (callouts) |
| `vertice-snippets-estruturados.csv` | Snippets estruturados (Serviços) |
| `recursos-extensoes.md` | Guia de todos os recursos + os que se adicionam pela interface |

> **Campanhas incluídas:** Marca · Tráfego Pago · Robô WhatsApp IA · Sites · Agência.
> **SEO foi removido** conforme solicitado.

---

## URLs finais (já configuradas)

Os anúncios já apontam para o domínio real:

| Campanha | URL final |
|---|---|
| Marca · Agência | `https://verticelabs.iafunil.com.br/` |
| Tráfego Pago (3 grupos) | `https://verticelabs.iafunil.com.br/trafego-pago` |
| Robô WhatsApp IA (3 grupos) | `https://verticelabs.iafunil.com.br/robo-whatsapp` |
| Sites (2 grupos) | `https://verticelabs.iafunil.com.br/sites-de-alta-conversao` |

## ⚠️ ANTES de importar — 1 ajuste a conferir

**Idioma do Editor.** Se o seu Google Ads Editor estiver em **português**, os valores da coluna `Criterion Type` podem precisar virar `Exata` / `Frase` / `Frase negativa`. Se estiver em inglês, deixe como está (`Exact` / `Phrase` / `Negative Phrase`). Dica: dá pra trocar o idioma em *Tools → Settings → Language*.

---

## Passo a passo

### 1. Criar as campanhas (manual, 1 vez)
O CSV cria grupos, palavras-chave e anúncios, mas **as campanhas em si** (orçamento, lance, local, rede) crie manualmente no Editor ou na interface, com estas configs:
- Tipo: **apenas Rede de Pesquisa** (desmarcar Display e Parceiros de pesquisa)
- Local: **Brasil** · Opção de local: **Presença** (não "interesse")
- Idioma: Português
- Lance: **Maximizar cliques** com teto de CPC (fase 1)
- Orçamento diário por campanha (ver estratégia: Tráfego 28% · Robô 24% · Sites 18% · Agência 15% · Marca 5%)

### 2. Importar palavras-chave, anúncios e recursos
No Editor: **Conta → Importar → De arquivo…** → selecione cada CSV, revise a prévia (verde = novo) e confirme. Ordem sugerida:
1. `vertice-keywords.csv`
2. `vertice-anuncios-rsa.csv`
3. `vertice-negativas-por-campanha.csv`
4. `vertice-sitelinks.csv`
5. `vertice-frases-destaque.csv`
6. `vertice-snippets-estruturados.csv`

Recursos que **não** são CSV (formulário de lead, imagem, logo, chamada) adicione pela interface — tudo pronto em `recursos-extensoes.md`.

### 3. Lista de negativas geral (compartilhada)
Melhor não duplicar as negativas B2B em cada campanha. Crie **uma lista compartilhada**:
- Na **interface** do Google Ads: *Ferramentas → Palavras-chave negativas → criar lista "Negativas Geral B2B"* → cole o conteúdo de `vertice-negativas-geral.txt` → aplique a **todas as campanhas**.

### 4. Publicar
Revise tudo no Editor e clique em **Publicar**. Confira no dia seguinte: termos de pesquisa, se a conversão está registrando, e CTR.

---

## Lembrete crítico
Nada disso mede resultado sem o **rastreamento de conversão** instalado na página (gtag + evento no envio do formulário) e o **formulário conectado** para o lead chegar até você. Veja `../estrategia-google-ads-rede-pesquisa.md` §0.
