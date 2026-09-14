# Vértice Labs — sites, clientes e materiais

Repo da operação Vértice Labs (Victor Viana): site institucional, LPs, propostas,
contratos, apresentações e ferramentas internas, organizados por cliente/projeto.

## Estrutura

```
vertice-labs/    SITE DA AGÊNCIA NO AR (verticelabs) — deploy manual via `netlify deploy` a partir desta pasta
sites/           SITES DE CLIENTE NO AR, um projeto Netlify por pasta — deploy manual a partir de cada uma
clientes/        Materiais por cliente (propostas, contratos, LPs, apresentações)
interno/         Materiais da própria Vértice Labs / Kairós (não são de cliente)
_arquivo/        Coisas mortas mantidas por histórico (site Kairós desativado, templates, relatórios)
.agent/          Skills e workflows do fluxo de geração de LPs e criativos
tests/           Testes da function de assinatura (`node --test tests/assinar.test.mjs`)
```

Duas pastas publicam: `vertice-labs/` e cada subpasta de `sites/`. `clientes/` e
`interno/` continuam sendo fonte e histórico, e mexer neles não muda nada no ar.

## vertice-labs/ — o site da agência

Tem `netlify.toml` próprio; o deploy é manual (`netlify deploy --prod` com publish
nessa pasta), sem CI/CD — mexer nos arquivos não muda o site até o próximo deploy.
Rotas: `/advocacia`, `/veterinaria`, `/medicina`, `/judah`, `/judah-proposta`,
`/bni`, `/via-vivance`.

## sites/ — sites de cliente

Um projeto Netlify por pasta, com `netlify.toml` e assets próprios. Cliente cujo
material precisa sobreviver a uma troca de fornecedor, ou que vai ganhar domínio
próprio, nasce aqui em vez de virar sub-rota do site da agência.

| Pasta | Projeto Netlify | O que é |
|---|---|---|
| `ana-mascarenhas/` | `ana-mascarenhas` | Ecossistema do Palestrante: hotsite, guia de marca, mídia kit geral e quatro mídia kits de palestra |

Deploy: `netlify deploy --prod --site <projeto>` de dentro da pasta. O `--site`
explícito importa, porque o vínculo gravado na pasta ao lado é o do vertice-labs.

O briefing de cada palestrante fica no site da agência, não aqui: ele depende da
function `/api/briefing` e das env vars do GitHub, que são do vertice-labs.
O template que gera esses sites está em
`interno/ecossistema-palestrante/template/palestrante.css`.

As propostas dos clientes **ILUME Filmes / Casa Hunter** vivem em
`vertice-labs/propostas/ilume` e `vertice-labs/propostas/ilume-filmes`
(ficam lá porque são páginas publicadas do site).

## clientes/

| Pasta | Cliente | Conteúdo |
|---|---|---|
| `avantik/` | Avantik (palestrantes) | LP da parceria |
| `judah/` | Judah Co. (eletrônicos premium) | Vitrine + proposta/contrato |
| `celso/` | Celso (corrida de rua) | LP-proposta Kairós Operação |
| `faz-morar/` | FazMorar (imobiliário) | Proposta + contrato |
| `via-vivance/` | Via Vivance | Proposta (peças de design da home) |
| `advocacia-regularizacao/` | Advocacia — regularização de imóveis | Apresentação + proposta (PDF) |
| `cambio-automatico/` | Câmbio Automático das Américas (imersão presencial, venda de ingressos com o Greyk) | Texto original da proposta. A página publicada (proposta + contrato com 3 assinantes) está em `vertice-labs/propostas/cambio-automatico`, rota `/cambio-automatico` |

Padrão para cliente novo: `clientes/<nome>/{lp,proposta,contrato,apresentacao}` —
crie só as subpastas que existirem de fato.

## interno/

| Pasta | O que é |
|---|---|
| `kairos/` | Sub-marca Kairós: logo (`marca/`), LPs de venda (`lp-operacao/`, `lp-suporte-alunos/`) e `criativos/` de Meta Ads |
| `produto/` | Descoberta, narrativa, pesquisa de mercado e arquitetura do produto (agentes IA no WhatsApp) |
| `google-ads/` | Estratégia de rede de pesquisa, palavras-chave e CSVs do Google Ads Editor |
| `prospeccao/` | Scripts Python de outbound + CRM gerado. **Contém dados de leads (PII) — nunca publicar em site** |
| `lps-servicos/` | Rascunhos de copy (só `copy.md`) das LPs de serviço: automação IA, robô WhatsApp, SEO, sites, tráfego |
| `lps-nicho-v1/` | Versões antigas das LPs de nicho (advocacia, veterinária, raio-x-consultório) — as atuais estão em `vertice-labs/` |
| `apresentacao-bni/` | Deck da apresentação 1 a 1 do BNI (versão atual em `vertice-labs/bni/`) |
| `home-v1/` | Home institucional antiga + backups |

## _arquivo/

- `site-kairos/` — `netlify.toml` e function `capi-lead` do antigo site kairos.iafunil.com.br (Netlify `ia-especialista-alunos`, desativado em julho/2026).
- `template-raiz/` — template de LP e proposta genérica que ficavam soltos na raiz.
- `lighthouse/` — relatórios de performance "antes" das otimizações.

## Avisos

- As LPs movidas para `clientes/` e `interno/` usam caminhos absolutos
  (ex.: `/lp-avantik/style.css`) do site antigo — **não renderizam com CSS ao abrir
  localmente**. São histórico/insumo, não páginas publicadas.
- `vertice-labs/advocacia/app.js` e `vertice-labs/veterinaria/app.js` chamam
  `/api/capi-lead`, que não existe no site vertice-labs (404 silencioso). Se quiser
  o tracking Meta CAPI lá, porte `_arquivo/site-kairos/netlify/functions/capi-lead.js`
  para o site vertice-labs.
