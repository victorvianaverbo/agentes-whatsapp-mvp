# Assinatura eletrônica das propostas estáticas

`assinar.mjs` registra a assinatura das propostas que moram em `propostas/<slug>/index.html`.
Mesmo desenho do `sistema/` da Ilume, sem o painel: **IP, data/hora e protocolo SHA-256 são
calculados no servidor**, e cada assinatura vira um commit num repositório privado.

O navegador manda só nome, documento e e-mail (e, nos documentos com várias partes, como qual
parte está assinando). Ele não escolhe o horário nem o hash, que é o que dá peso à assinatura se
alguém contestar depois.

```
propostas/lm-bids/index.html            ──POST /api/assinar────────►  assinar.mjs
propostas/cambio-automatico/index.html  ──GET  /api/assinar?docId=─►    ├─► GitHub Contents API
                                        ──POST /api/assinar────────►    │   (repo privado, 1 JSON por documento,
                                                                        │    cada gravação = 1 commit)
                                                                        └─► FormSubmit (e-mail de aviso; o servidor
                                                                            tenta, o navegador reenvia, ver lib/email.mjs)
```

## Setup (uma vez só)

### 1. Repositório de dados

Crie no GitHub um repositório **privado** chamado `vertice-contratos-data`.
Não precisa de nada dentro: a primeira assinatura cria a pasta `assinaturas/`.

### 2. Token do GitHub

GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate new token:

- Repository access: **Only select repositories** → `vertice-contratos-data`
- Permissions → Repository permissions → **Contents: Read and write**
- Expiração: 1 ano (anote para renovar)

### 3. Variáveis de ambiente no Netlify

Site `verticelabs-br` → **Site configuration → Environment variables**:

| Variável | Valor |
|---|---|
| `GITHUB_TOKEN` | o token fine-grained do passo 2 |
| `GITHUB_DATA_REPO` | `victorvianaverbo/vertice-contratos-data` |
| `GITHUB_BRANCH` | `main` (opcional, é o padrão) |
| `EMAIL_ASSINATURA` | `vianavictorv@gmail.com` (opcional, é o padrão) |

Sem `GITHUB_TOKEN` e `GITHUB_DATA_REPO` a rota responde 500 e ninguém consegue assinar.

## Adicionar uma proposta nova

### Documento de assinatura única (cliente assina, Vértice tem carimbo estático na página)

Uma linha no `DOCUMENTOS` de `assinar.mjs`:

```js
const DOCUMENTOS = {
  "previ-2026-01": { numero: "PV-2026-01", titulo: "...", cliente: "Previ Serviços Previdenciários" },
  "cliente-novo-2026-01": { numero: "XX-2026-01", titulo: "...", cliente: "Cliente Novo" }
};
```

E na página, `var DOC_ID="cliente-novo-2026-01";` com a mesma chave.

Documento fora dessa lista responde 404 e não grava nada. É o que impede alguém de usar a rota
para escrever arquivo arbitrário no repositório de dados.

### Documento com várias partes (todo mundo assina pelo sistema)

Acrescente `partes` à entrada. É a presença de `partes` que liga o modo multi-parte; o arquivo
gravado nunca decide o formato.

```js
"cambio-automatico-2026-08": {
  numero: "CA-2026-08",
  titulo: "Contrato de Prestação de Serviços · Venda de ingressos · Câmbio Automático das Américas",
  cliente: "Câmbio Automático das Américas Ltda - ME",
  partes: {
    "contratante":  { rotulo: "CONTRATANTE",  curto: "Câmbio Automático", quem: "Câmbio Automático das Américas Ltda - ME" },
    "contratada":   { rotulo: "CONTRATADA",   curto: "Vértice", quem: "Viana Mídias e Marketing LTDA · Vértice Labs", documentos: ["40461516000158"] },
    "contratado-2": { rotulo: "CONTRATADO 2", curto: "Greyk",   quem: "Greyk da Silva Sousa", documentos: ["22555670831"] }
  }
}
```

- A ordem das chaves é a ordem dos carimbos na página e da lista "faltam" no e-mail.
- `rotulo` entra nas mensagens de erro e no e-mail; `curto` no assunto do e-mail; `quem` no GET.
- `documentos` (opcional): CPF/CNPJ que aquela parte pode usar, só dígitos. Sem a lista, qualquer
  documento válido serve (o contratante costuma assinar com o CPF do sócio, não com o CNPJ).
- **Nunca acrescente `partes` a um docId que já tem arquivo gravado no formato antigo**, nem tire
  `partes` de um que já tem arquivo multi-parte. A function responde 500 em vez de misturar.
- Na página: `var DOC_ID="cambio-automatico-2026-08";`, o POST leva `parte`, e a página chama o GET
  ao abrir para desenhar os carimbos. Use `propostas/cambio-automatico/index.html` como modelo.
- Links: `/cambio-automatico` (cliente), `/cambio-automatico?parte=contratada` (Victor),
  `/cambio-automatico?parte=contratado-2` (Greyk). O `?parte=` só pré-seleciona o campo "Assino como".

## Formato dos arquivos (`assinaturas/<docId>.json` no repo de dados)

Assinatura única:

```json
{
  "docId": "lm-bids-2026-08", "numero": "LB-2026-08", "titulo": "...", "cliente": "LM Bids Ltda",
  "assinatura": { "nome": "...", "cpfCnpj": "...", "email": "...", "ip": "...", "userAgent": "...", "assinadoEm": "...", "protocolo": "<sha256>" },
  "criadoEm": "..."
}
```

Várias partes:

```json
{
  "docId": "cambio-automatico-2026-08", "numero": "CA-2026-08", "titulo": "...", "cliente": "...",
  "formato": "multiparte",
  "partes": ["contratante", "contratada", "contratado-2"],
  "status": "aguardando_assinaturas",
  "assinaturas": {
    "contratado-2": { "parte": "contratado-2", "nome": "...", "cpfCnpj": "...", "email": "...", "ip": "...", "userAgent": "...", "assinadoEm": "...", "protocolo": "<sha256>" }
  },
  "criadoEm": "...", "atualizadoEm": "...", "concluidoEm": null
}
```

`status` vira `"assinado"` (e `concluidoEm` é preenchido) quando todas as partes da allowlist
estão em `assinaturas`. `partes` no arquivo é um retrato da config na hora da assinatura.

## Consultar o estado (GET)

`GET /api/assinar?docId=cambio-automatico-2026-08` responde:

```json
{
  "docId": "cambio-automatico-2026-08", "numero": "CA-2026-08", "status": "aguardando_assinaturas",
  "total": 3, "assinadas": 1, "faltam": ["contratante", "contratada"],
  "partes": {
    "contratante":  { "rotulo": "CONTRATANTE",  "quem": "...", "assinada": false },
    "contratada":   { "rotulo": "CONTRATADA",   "quem": "...", "assinada": false },
    "contratado-2": { "rotulo": "CONTRATADO 2", "quem": "...", "assinada": true, "nome": "...", "assinadoEm": "...", "ip": "...", "protocolo": "..." }
  }
}
```

- Só documentos com `partes` respondem; os de assinatura única dão 404 (não expõem nada).
- Sem arquivo (ninguém assinou) é 200 com tudo pendente, não erro.
- De cada assinatura sai só `nome`, `assinadoEm`, `ip` e `protocolo` (o que o carimbo da página
  mostra). **CPF/CNPJ, e-mail e User-Agent nunca saem no GET.**
- `Cache-Control: no-store` em tudo.

## Comportamento

- **Assinatura única: uma por documento.** A segunda tentativa recebe 409, inclusive se for outra pessoa.
- **Várias partes: uma por parte, em qualquer ordem.** Repetir a parte dá 409; depois de todas
  assinarem, qualquer POST dá 409. O protocolo inclui a parte no hash.
- **Validação de CPF/CNPJ com dígito verificador**, e não só contagem de caracteres. Aceita o
  CNPJ alfanumérico (o valor de cada caractere é o código ASCII menos 48).
- **Lock otimista** na gravação: se duas requisições chegarem juntas, a segunda relê e revalida.
  No multi-parte a releitura traz a assinatura que entrou antes, então as duas ficam no arquivo.
- Todas as validações de entrada acontecem **antes** de qualquer chamada ao GitHub.
- Se o e-mail do FormSubmit falhar, a assinatura **continua registrada**; a resposta devolve o
  e-mail pronto (`email: { destino, campos }`) e a página posta do navegador.

Códigos que vêm junto com `erro` no corpo (só nas respostas novas; o fluxo antigo não mudou):

| Status | `codigo` | Quando |
|---|---|---|
| 400 | `parte_ausente` | documento multi-parte sem `parte` |
| 400 | `parte_invalida` | `parte` fora da allowlist do documento |
| 400 | `parte_nao_suportada` | documento de assinatura única recebeu `parte` |
| 400 | `documento_nao_confere` | CPF/CNPJ diferente do cadastrado em `documentos` da parte |
| 409 | `parte_ja_assinou` | a parte já tem assinatura |
| 409 | `contrato_concluido` | todas as partes já assinaram |
| 409 | `conflito_gravacao` | três corridas seguidas na gravação; é só tentar de novo |

Assunto dos e-mails de aviso no multi-parte: `Contrato CA-2026-08 · CONTRATADO 2 (Greyk) assinou ·
faltam 1` a cada assinatura, e `Contrato CA-2026-08 · ... · ASSINADO por todas as partes` na última.

### Se alguém assinar na parte errada

Não há rota para desfazer, de propósito. A correção é manual no repo de dados: edite
`assinaturas/<docId>.json`, remova a chave da parte em `assinaturas` e, se preciso, volte `status`
para `aguardando_assinaturas` e `concluidoEm` para `null`. A edição vira um commit e fica na trilha.

## Rodar local

```bash
cd vertice-labs
netlify dev   # http://localhost:8888/cambio-automatico
```

A pasta está linkada ao site e a CLI está logada, então o `netlify dev` injeta as variáveis do
site sozinho e **aponta para o repositório de dados real**: um POST válido local grava assinatura
de verdade. Use local só para GET e para ver a página.

**Não crie `.env` dentro de `vertice-labs/`:** `publish = "."` publicaria o arquivo. Se um dia
precisar apontar para outro repo, passe pela variável de terminal (`GITHUB_DATA_REPO=... netlify dev`).

Testes da lógica, sem token e sem gravar nada (GitHub em memória), na raiz do repo:

```bash
node --test tests/assinar.test.mjs
```

## Nota sobre o fonte exposto

`publish = "."` no `netlify.toml` publica a pasta inteira, então o fonte destas functions ficaria
acessível em `/netlify/functions/...`. O redirect no fim do `netlify.toml` (`/netlify/*` → 404)
esconde isso. De todo modo, nenhum segredo mora no código: o token só existe nas variáveis de
ambiente e nunca chega ao navegador.

## Cópia assinada em PDF por e-mail (`/api/copia-assinada`)

Documento com `partes` **e** `pagina` na allowlist ganha, depois da última assinatura, uma cópia
em PDF enviada por e-mail a todas as partes. Quem dispara é a página (`copia-assinada.mjs` tem o
desenho completo no cabeçalho):

1. `POST /api/copia-assinada { docId, etapa: "pdf" }`: abre a página em `?pdf=1` no Chromium
   (`@sparticuz/chromium` + `puppeteer-core`, só nesta function), imprime proposta + contrato com os
   carimbos e grava `contratos/<docId>.pdf` no repo de dados. Marca `registro.copia.geradoEm`.
2. `POST /api/copia-assinada { docId, etapa: "enviar" }`: manda o PDF pela API de e-mail da
   Hostinger, da caixa `contato@vianamidias.com.br`, para os e-mails digitados nas assinaturas
   mais `EMAIL_ASSINATURA`. Marca `registro.copia.enviadaEm` e `destinatarios`.

As duas etapas são idempotentes e cabem nos 10 s do plano atual do Netlify. Se uma falhar, a
página avisa e tenta de novo na próxima abertura do contrato. O `GET /api/assinar` passa a expor
`copia: { geradoEm, enviadaEm, destinatarios: <quantidade> }`, nunca os e-mails.

**Modo teste** (antes da assinatura real): `{ docId, etapa, teste: true, chave: COPIA_CHAVE }`
gera `contratos/<docId>-teste.pdf` com o estado atual e envia só para `EMAIL_ASSINATURA`, sem
gravar `copia`. Sem a chave a rota responde 403.

Env vars a mais no site: `HOSTINGER_MAIL_TOKEN` (token da API de e-mail da Hostinger, escopo na
caixa remetente), `HOSTINGER_MAIL_BOX` (resourceId da caixa) e `COPIA_CHAVE`. Dependências em
`vertice-labs/package.json`: rode `npm install` em `vertice-labs/` antes do `netlify deploy`.

Aviso: a caixa `contato@vianamidias.com.br` está num plano Free Business Email da Hostinger; se o
plano vencer, o envio para (a assinatura em si continua funcionando).

Testes: `node --test tests/copia-assinada.test.mjs` na raiz do repo.

## Sistema de contratos (painel + contrato por UUID)

Port do sistema da Ilume Filmes (`ilume-filmes/sistema/`) para a Vértice, dentro deste site.
Custo zero: front estático em `contratos/`, functions aqui, dados no repo privado
`vertice-contratos-data` (`contratos/{uuid}.json`, `config/indice.json`, `config/modelos.json`).

- Painel: https://verticelabs.iafunil.com.br/painel (senha = env `ADMIN_PASSWORD`, secret).
- Cliente: `/contrato?id=UUID` (rascunho e legado respondem 404 ao público).
- Rotas: `POST /api/login` · `GET/POST /api/contratos` · `GET/PATCH/DELETE /api/contratos/:id`
  (PATCH: campos, ou `{acao}` = `enviar` | `encerrarMensal` | `sincronizar` | `status` | `observacoes`) ·
  `POST /api/contratos/:id/assinar` (`contratante` público, `contratada` admin + CNPJ da Vértice) ·
  `PATCH /api/contratos/:id/pagamentos` (`{pagamentos}` ou `{acao: "completar" | "gerar"}`) · `GET/PUT /api/modelos`.
- Financeiro: `unico` (parcelas por gatilho) e/ou `mensal` (meses 0 = sem prazo, rolante mês a mês),
  cortesias e verba de mídia. Regras em `lib/cobrancas.mjs`; forma do JSON em `lib/contrato-schema.mjs`.
- Cláusulas: HTML fixo em `contratos/contrato.html`, blocos `data-se` ligados por `contratos/assets/contrato.js`,
  numeração dinâmica e `data-ref`. Não editáveis pelo painel; escape = condições especiais (última cláusula).
- E-mail de assinatura: `lib/notificar.mjs` via Hostinger (`EMAIL_ASSINATURA`). PDF: `window.print()` e modo `?pdf=1`.
- Legados: `ops/importar-legado.mjs` + `ops/legado.json` (raiz do monorepo, fora do publish). uuid v5 do slug;
  idempotente; preserva pagos e status alterado no painel. `assinaturas/<docId>.json` nunca é alterado;
  botão "Sincronizar" relê. `/api/assinar` e as propostas artesanais continuam iguais.
- Cache: assets em `/contratos/assets/*` têm 7 dias de cache; ao editar um `.js`/`.css`, subir o `?v=N` no HTML.
- Testes: `node --test tests/*.test.mjs` (cobranças, API, importação, mais os antigos).
- Dev local: `netlify dev --port=8888` com `GITHUB_TOKEN`, `GITHUB_BRANCH=sandbox` e `ADMIN_PASSWORD` no ambiente.
  A cópia do Chromium da `copia-assinada` pode dar EBUSY no Windows: afaste o arquivo durante o teste.
