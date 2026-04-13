---
name: forms
description: Use when creating or modifying contact forms, lead capture forms, or any form with a phone field. Includes intl-tel-input with masks, email validation, Netlify Forms integration with AJAX submit, redirect with URL params forwarding, and thank you page.
---

# Skill: Forms

Formularios com Netlify Forms, validacao internacional de telefone, submit via AJAX e redirect com repasse de parametros.

---

## Estrutura HTML Completa

```html
<form
  name="contato"
  method="POST"
  action="/obrigado.html"
  data-netlify="true"
  netlify-honeypot="bot-field"
  data-form
>
  <!-- OBRIGATORIO para AJAX: hidden input com form-name -->
  <input type="hidden" name="form-name" value="contato">

  <!-- Honeypot anti-spam -->
  <p hidden><label>Nao preencha: <input name="bot-field"></label></p>

  <div class="form-group">
    <label class="form-label" for="nome">Nome</label>
    <input type="text" id="nome" name="nome" class="form-input" required autocomplete="name">
  </div>

  <div class="form-group">
    <label class="form-label" for="email">E-mail</label>
    <input type="email" id="email" name="email" class="form-input" required autocomplete="email">
  </div>

  <div class="form-group">
    <label class="form-label" for="telefone">WhatsApp</label>
    <input type="tel" id="telefone" name="telefone" class="form-input" required autocomplete="tel">
  </div>

  <div class="form-feedback"></div>
  <button type="submit" class="btn">Enviar</button>
</form>
```

---

## Atributos Obrigatorios do Form

- `name` = Nome unico → Identificador no dashboard Netlify
- `method` = `POST` → Metodo de envio
- `action` = `/pagina-obrigado.html` → Redirect apos sucesso (com repasse de parametros)
- `data-netlify` = `true` → Ativa Netlify Forms
- `netlify-honeypot` = `bot-field` → Anti-spam
- `data-form` (sem valor) → Seletor para JavaScript

### Hidden Input OBRIGATORIO

```html
<input type="hidden" name="form-name" value="contato">
```

**CRITICO:** O `value` DEVE ser EXATAMENTE igual ao atributo `name` do `<form>`. Sem isso, o submit via AJAX nao funciona.

---

## JavaScript para Submit via AJAX

O script.js do template ja inclui tudo. Abaixo a referencia do que ele faz:

### Validacao de Email

Bloqueia dominios de email temporario:

```javascript
const tempEmailDomains = [
  'tempmail', 'guerrillamail', '10minutemail', 'mailinator',
  'throwaway', 'fakeinbox', 'yopmail', 'trashmail', 'temp-mail',
  'disposable', 'sharklasers'
];
```

### Validacao de Telefone

Usa `input._iti.isValidNumber()` para validar o numero no formato internacional (cada input tel tem sua propria instancia).

### Submit e Redirect

Fluxo apos submit bem-sucedido:

1. Dispara `fbq('track', 'Lead')` se Meta Pixel estiver configurado
2. Se o form tem `action`, redireciona com TODOS os parametros:
   - Repassa parametros da URL atual (utm_source, utm_medium, fbclid, gclid, etc)
   - Adiciona `nome` e `email` do formulario como parametros
3. Se o form NAO tem `action`, mostra mensagem de sucesso in-page

**Exemplo de redirect:**

URL de acesso: `https://site.com/?utm_source=google&fbclid=abc123`
Form preenchido: nome="Joao", email="joao@email.com"
Redirect final: `/obrigado.html?utm_source=google&fbclid=abc123&nome=Joao&email=joao%40email.com`

### Pontos CRITICOS do JavaScript

- URL do fetch → `form.getAttribute('action')` (NUNCA `'/'`)
- Content-Type → `application/x-www-form-urlencoded` (NUNCA `application/json`)
- Body → `new URLSearchParams(formData).toString()` (NUNCA `JSON.stringify`)
- FormData → `new FormData(form)` (NUNCA montar objeto manualmente)
- Capturar nome e email ANTES do fetch (form.reset limpa os campos)

---

## Pagina de Agradecimento

Crie uma pagina separada para o redirect apos sucesso. Os parametros `nome` e `email` ficam disponiveis via URL para personalizacao.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Obrigado!</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <section class="thank-you">
    <h1>Inscricao Confirmada!</h1>
    <p>Voce sera redirecionado em <span id="countdown">10</span> segundos...</p>
    <a href="https://link-do-grupo" class="btn" id="btn-action">Entrar no Grupo</a>
  </section>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Parametros disponiveis via URL (nome, email, utms, etc)
      const params = new URLSearchParams(window.location.search);
      const nome = params.get('nome');

      // Personalizar saudacao (opcional)
      if (nome) {
        document.querySelector('h1').textContent = nome + ', Inscricao Confirmada!';
      }

      // Countdown e redirect
      let count = 10;
      const countdownEl = document.getElementById('countdown');
      const linkDestino = document.getElementById('btn-action').href;

      const timer = setInterval(() => {
        count--;
        if (countdownEl) countdownEl.textContent = count;
        if (count <= 0) {
          clearInterval(timer);
          window.location.href = linkDestino;
        }
      }, 1000);
    });
  </script>
</body>
</html>
```

---

## Formulario em Modal

Quando o form abre em popup/modal ao inves de estar direto na pagina.

### Regras CRITICAS

1. **O HTML do form DEVE existir no HTML estatico** (dentro do `<body>`, pode estar com `display:none`). Netlify detecta forms no build time - se o form for criado via JavaScript, Netlify NAO o detecta e os envios falham silenciosamente.

2. **NAO usar `action`** no form do modal. Sem `action`, o script.js mostra mensagem de sucesso in-page ao inves de redirecionar (redirecionar com modal aberto e confuso).

3. **IDs unicos** - Se ja existe outro form na pagina, TODOS os IDs devem ser diferentes (ex: `id="nome"` no form principal → `id="modal-nome"` no modal).

4. **`name` unico no form** - Cada form precisa de um `name` diferente para Netlify distinguir (ex: `name="contato"` vs `name="contato-modal"`). O hidden `form-name` deve ter o MESMO valor.

### Template Modal Completo

```html
<!-- Botao que abre o modal (colocar onde quiser) -->
<button type="button" class="btn" data-modal="contato-modal">Contato</button>

<!-- Modal (DEVE estar no HTML estatico, NAO criado via JS) -->
<div class="modal-overlay" id="contato-modal" role="dialog" aria-modal="true" aria-label="Formulario de contato">
  <div class="modal-content">
    <button type="button" class="modal-close" aria-label="Fechar">&times;</button>

    <h2>Entre em contato</h2>

    <form name="contato-modal" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-form>
      <input type="hidden" name="form-name" value="contato-modal">
      <p hidden><label>Nao preencha: <input name="bot-field"></label></p>

      <div class="form-group">
        <label class="form-label" for="modal-nome">Nome</label>
        <input type="text" id="modal-nome" name="nome" class="form-input" required autocomplete="name">
      </div>

      <div class="form-group">
        <label class="form-label" for="modal-email">E-mail</label>
        <input type="email" id="modal-email" name="email" class="form-input" required autocomplete="email">
      </div>

      <div class="form-group">
        <label class="form-label" for="modal-telefone">WhatsApp</label>
        <input type="tel" id="modal-telefone" name="telefone" class="form-input" required autocomplete="tel">
      </div>

      <div class="form-group">
        <label class="form-label" for="modal-mensagem">Mensagem</label>
        <textarea id="modal-mensagem" name="mensagem" class="form-input" rows="4" required></textarea>
      </div>

      <div class="form-feedback"></div>
      <button type="submit" class="btn">Enviar</button>
    </form>
  </div>
</div>
```

**Observe:**
- Form SEM `action` (mostra mensagem de sucesso, nao redireciona)
- `name="contato-modal"` e `value="contato-modal"` identicos
- IDs com prefixo `modal-` para evitar conflito
- O modal `id="contato-modal"` e aberto pelo botao via `data-modal="contato-modal"`

### JavaScript do Modal

Adicionar ao `script.js`:

```javascript
/* Modal */
function initModals() {
  // Abrir
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById(btn.dataset.modal);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Fechar (X, overlay, Escape)
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.querySelector('.modal-close')?.addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const active = document.querySelector('.modal-overlay.active');
      if (active) closeModal(active);
    }
  });
}

function closeModal(modal) {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}
```

**IMPORTANTE:** Chamar `initModals()` no `DOMContentLoaded` (junto com `initForms`, `initPhoneInput`, etc.)

### CSS do Modal

```css
/* Modal */
.modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  align-items: center;
  justify-content: center;
}

.modal-overlay.active {
  display: flex;
}

.modal-content {
  background: var(--color-bg, #fff);
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: inherit;
  line-height: 1;
}
```

### Fechar modal apos sucesso

Apos submit bem-sucedido, o `showFeedback` exibe a mensagem. Para fechar o modal automaticamente apos a mensagem, adicionar no CSS e depois de `showFeedback`:

```javascript
// Dentro do callback de sucesso do form, apos showFeedback:
const modal = form.closest('.modal-overlay');
if (modal) {
  setTimeout(() => closeModal(modal), 3000);
}
```

---

## Multiplos Formularios

O `script.js` suporta multiplos formularios na mesma pagina. Cada `form[data-form]` e tratado independentemente.

### Regras para multiplos forms

1. **Cada form tem `name` unico** → identifica no dashboard Netlify
2. **Cada hidden `form-name` tem o MESMO valor do `name` do form**
3. **IDs de campos devem ser unicos** no HTML inteiro (usar prefixos: `id="hero-nome"`, `id="modal-nome"`)
4. **Atributos `name` dos campos podem ser iguais** entre forms (ex: ambos com `name="email"`) - so o `name` do `<form>` precisa ser unico

### O script.js cuida de tudo automaticamente

- `initPhoneInput()` inicializa TODOS os `input[type="tel"]` da pagina (cada um com sua instancia)
- `handleFormSubmit` busca o telefone DAQUELE form especifico (via `form.querySelector`)
- Validacao, submit e feedback sao por form

### Exemplo: form no hero + form no modal

```html
<!-- Form 1: no hero -->
<form name="lead-hero" method="POST" action="/obrigado.html" data-netlify="true" netlify-honeypot="bot-field" data-form>
  <input type="hidden" name="form-name" value="lead-hero">
  ...campos com id="hero-nome", id="hero-email", id="hero-tel"...
</form>

<!-- Form 2: no modal -->
<form name="contato-modal" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-form>
  <input type="hidden" name="form-name" value="contato-modal">
  ...campos com id="modal-nome", id="modal-email", id="modal-tel"...
</form>
```

- Form 1: tem `action` → redireciona com parametros
- Form 2: sem `action` → mostra mensagem de sucesso in-page

---

## intl-tel-input (Telefone Internacional)

Ja configurado no template com:
- Strict mode (mascara obrigatoria por pais)
- Brasil como pais padrao
- Bandeiras no dropdown
- Validacao automatica
- Formato internacional no envio

### CDNs necessarias

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/css/intlTelInput.css">
<script src="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/intlTelInput.min.js"></script>
```

### Inicializacao (ja no script.js)

O `initPhoneInput()` inicializa TODOS os `input[type="tel"]` da pagina. Cada input recebe sua propria instancia em `input._iti`:

```javascript
document.querySelectorAll('input[type="tel"]').forEach(input => {
  input._iti = intlTelInput(input, {
    initialCountry: 'br',
    preferredCountries: ['br', 'us', 'pt'],
    separateDialCode: true,
    strictMode: true,
    loadUtilsOnInit: 'https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/utils.js'
  });
});
```

No submit, o handler busca a instancia do telefone DAQUELE form: `form.querySelector('input[type="tel"]')._iti`

---

## Tracking (Meta Pixel / GTM)

O `script.js` ja dispara automaticamente no submit bem-sucedido:
- `fbq('track', 'Lead')` - Meta Pixel
- `dataLayer.push({ event: 'generate_lead' })` - GTM

Para configurar os snippets de tracking (GTM e/ou Meta Pixel), use `/configurar-tracking` ou consulte a skill `tracking`.

---

## Dashboard do Netlify

Apos deploy, os envios aparecem em: **Site > Forms > [nome do formulario]**

Configure notificacoes: **Site > Forms > Form notifications** (Email, Slack, Webhook)

---

## Checklist de Verificacao

### HTML
- [ ] `name="nome-unico"` no `<form>`
- [ ] `method="POST"`
- [ ] `data-netlify="true"`
- [ ] `action="/pagina-obrigado.html"`
- [ ] `netlify-honeypot="bot-field"`
- [ ] `<input type="hidden" name="form-name" value="nome-unico">`
- [ ] Campo honeypot dentro de elemento `hidden`

### JavaScript
- [ ] Fetch usa `form.getAttribute('action')` (NAO usa `'/'`)
- [ ] Header `Content-Type: application/x-www-form-urlencoded`
- [ ] Body usa `new URLSearchParams(formData).toString()`
- [ ] FormData criado a partir do form
- [ ] Nome e email capturados ANTES do fetch
- [ ] Redirect repassa parametros da URL + nome + email

### Modal (se aplicavel)
- [ ] HTML do form esta no HTML estatico (NAO criado via JS)
- [ ] Form SEM `action` (mostra sucesso in-page, nao redireciona)
- [ ] IDs com prefixo unico (ex: `modal-nome`, `modal-email`)
- [ ] `name` do form diferente de outros forms na pagina
- [ ] `initModals()` chamado no DOMContentLoaded
- [ ] CSS do modal incluido no style.css

### Netlify
- [ ] Form aparece listado apos deploy
- [ ] Submissoes aparecem no painel

---

## Troubleshooting

### Form nao aparece no painel Netlify

1. Verificar `data-netlify="true"` no `<form>`
2. Fazer novo deploy (Clear cache and deploy)
3. Verificar se form detection esta habilitado em Forms > Settings

### Submissoes nao sao registradas

1. Verificar se `form-name` hidden tem valor EXATO do `name` do form
2. Verificar se fetch NAO esta enviando para `'/'` (usar `action`)
3. Verificar console do browser por erros
4. Testar submit nativo (sem JS) para isolar problema

### Redirect apos submit nao funciona

1. Verificar se `action` do form esta com caminho correto
2. Verificar se JavaScript redireciona apos `response.ok`
3. Verificar se nao ha erro antes do redirect

### Parametros nao chegam na pagina de obrigado

1. Verificar se `action` esta definido no form (sem action = sem redirect)
2. Verificar se campos `name="nome"` e `name="email"` existem no form
3. Inspecionar a URL de redirect no DevTools Network

### Modal form nao envia / Netlify nao detecta

1. O HTML do form DEVE estar no HTML estatico (NAO criado via JavaScript)
2. Verificar `<input type="hidden" name="form-name" value="NOME_DO_FORM">`
3. O `value` do hidden DEVE ser EXATAMENTE igual ao `name` do `<form>`
4. Fazer novo deploy (Netlify detecta forms no build time)

### Segundo form nao funciona (multiplos forms)

1. Verificar se ambos forms tem `data-form` (seletor do JS)
2. Verificar se cada form tem `name` unico
3. Verificar se IDs dos campos sao unicos (usar prefixos)
4. Verificar se `initPhoneInput` esta usando `querySelectorAll` (nao `querySelector`)

### Telefone nao valida / Bandeiras nao aparecem

1. Verificar se CSS e JS do intl-tel-input v24.6.0 carregaram
2. Verificar console por erros de carregamento
3. Verificar se `loadUtilsOnInit` esta com URL correta
4. Se multiplos forms: verificar se `initPhoneInput` inicializa TODOS os `input[type="tel"]`
