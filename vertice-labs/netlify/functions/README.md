# Assinatura eletrônica das propostas estáticas

`assinar.mjs` registra a assinatura das propostas que moram em `propostas/<slug>/index.html`.
Mesmo desenho do `sistema/` da Ilume, sem o painel: **IP, data/hora e protocolo SHA-256 são
calculados no servidor**, e cada assinatura vira um commit num repositório privado.

O navegador manda só nome, documento e e-mail. Ele não escolhe o horário nem o hash, que é o
que dá peso à assinatura se alguém contestar depois.

```
propostas/previ/index.html  ──POST /api/assinar──►  assinar.mjs
                                                       ├─► GitHub Contents API
                                                       │   (repo privado, 1 JSON por documento,
                                                       │    cada gravação = 1 commit)
                                                       └─► FormSubmit (e-mail de aviso)
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

## Comportamento

- **Uma assinatura por documento.** A segunda tentativa recebe 409, inclusive se for outra pessoa.
- **Validação de CPF/CNPJ com dígito verificador**, e não só contagem de caracteres. Aceita o
  CNPJ alfanumérico (o valor de cada caractere é o código ASCII menos 48).
- **Lock otimista** na gravação: se duas requisições chegarem juntas, a segunda relê e cai no 409.
- Se o e-mail do FormSubmit falhar, a assinatura **continua registrada**; o erro só vai para o log.

## Rodar local

```bash
cd vertice-labs
# .env com GITHUB_TOKEN e GITHUB_DATA_REPO
netlify dev   # http://localhost:8888/previ
```

## Nota sobre o fonte exposto

`publish = "."` no `netlify.toml` publica a pasta inteira, então o fonte destas functions ficaria
acessível em `/netlify/functions/...`. O redirect no fim do `netlify.toml` (`/netlify/*` → 404)
esconde isso. De todo modo, nenhum segredo mora no código: o token só existe nas variáveis de
ambiente e nunca chega ao navegador.
