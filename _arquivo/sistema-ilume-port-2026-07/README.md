# Sistema de Contratos · ILUME FILMES

Sistema de geração e assinatura eletrônica de contratos (pontual e recorrente), com painel de gestão, preenchimento automático por CNPJ e armazenamento gratuito em repositório GitHub privado. Custo: **R$ 0/mês**.

## Como funciona

```
[admin.html Painel] ──senha──┐
[contrato.html?id=X Cliente] ─┼──► Netlify Functions ──token──► GitHub Contents API
                              │        │                        (repo privado ilume-contratos-data,
[BrasilAPI CNPJ] ◄── direto ──┘        └──► FormSubmit (e-mail)  1 JSON por contrato)
```

- **Painel** (`/admin.html`): criar contrato (pontual/recorrente), buscar dados pelo CNPJ, enviar link ao cliente, assinar como CONTRATADO, baixar PDF, excluir.
- **Página do cliente** (`/contrato.html?id=...`): proposta + contrato renderizados no design da Ilume, com assinatura eletrônica (nome, CPF/CNPJ, e-mail, IP, data/hora, protocolo SHA-256 — MP 2.200-2/2001 e Lei 14.063/2020).
- **Fluxo**: rascunho → enviar (link único não-adivinhável) → cliente analisa e assina → Filipe assina pelo painel → status "assinado" → PDF com os dois carimbos. Cada parte assina **uma única vez** (o servidor rejeita re-assinatura).
- **Armazenamento**: cada contrato é um arquivo `contratos/{uuid}.json` no repo privado `ilume-contratos-data`. Cada gravação vira um commit — trilha de auditoria automática.
- **E-mail**: a cada assinatura, o FormSubmit envia notificação para `EMAIL_ASSINATURA`.

## Configuração (uma vez só)

### 1. Repositório de dados
Já criado: `victorvianaverbo/ilume-contratos-data` (privado).

### 2. Token do GitHub
GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate new token:
- Repository access: **Only select repositories** → `ilume-contratos-data`
- Permissions → Repository permissions → **Contents: Read and write**
- Expiração: 1 ano (anote para renovar)

### 3. Site no Netlify
1. app.netlify.com → **Add new site → Import an existing project** → conecte o repo `ilume-filmes`.
2. O `netlify.toml` da raiz já configura tudo (publish `sistema/public`, functions `sistema/functions`).
3. Em **Site configuration → Environment variables**, adicione:

| Variável | Valor |
|---|---|
| `GITHUB_TOKEN` | o token fine-grained do passo 2 |
| `GITHUB_DATA_REPO` | `victorvianaverbo/ilume-contratos-data` |
| `GITHUB_BRANCH` | `main` |
| `ADMIN_PASSWORD` | senha longa do painel (é a senha que o Filipe usa) |
| `EMAIL_ASSINATURA` | `Ilumefilmes@gmail.com` |

4. Deploy. O painel fica em `https://SEU-SITE.netlify.app/admin.html`.
5. (Opcional) Domínio próprio: `contratos.ilumefilmes.com.br` via CNAME.

> **FormSubmit**: o e-mail `Ilumefilmes@gmail.com` já foi ativado no FormSubmit (usado na proposta Casa Hunter). Se trocar o e-mail, a primeira notificação chega como pedido de ativação — clique em "Activate".

## Rodar local

```bash
# na raiz do projeto (ilume-filmes/)
cp sistema/.env.example .env   # e preencha os valores
netlify dev                     # http://localhost:8888
```

## API (Netlify Functions)

| Rota | Método | Auth | Função |
|---|---|---|---|
| `/api/login` | POST | — | valida a senha do painel |
| `/api/contratos` | GET / POST | admin | listar / criar (rascunho) |
| `/api/contratos/:id` | GET | pública se enviado | JSON do contrato (rascunho → 404) |
| `/api/contratos/:id` | PATCH | admin | editar rascunho ou `{"acao":"enviar"}` |
| `/api/contratos/:id` | DELETE | admin | excluir |
| `/api/contratos/:id/assinar` | POST | contratado: admin | assina; rejeita re-assinatura (409) |

Auth = header `Authorization: Bearer <ADMIN_PASSWORD>`.

## Segurança

- Link do contrato usa UUID v4 (~122 bits) — não listável, não adivinhável; rascunhos respondem 404 ao público.
- O token do GitHub existe só nas variáveis de ambiente das functions — nunca chega ao navegador.
- IP, data/hora e protocolo SHA-256 são calculados **no servidor**; gravação usa lock otimista (sha do arquivo) contra corridas.
- Contrato enviado não é mais editável; assinado é imutável (só exclusão).
