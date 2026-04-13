---
name: tracking
description: Use when the user wants to add tracking, analytics, pixels, Google Ads, Meta Pixel, Facebook Pixel, conversion tracking, or event tracking to their landing page.
---

# Skill: Tracking

Google Ads (direto via gtag.js) e Meta Pixel (Facebook/Instagram) para landing pages.

---

## Cenarios de Uso

| Cenario | Solucao |
|---------|---------|
| Apenas anuncios Meta (Facebook/Instagram) | Meta Pixel direto |
| Apenas Google Ads | Google Ads direto (gtag.js) |
| Meta + Google Ads | Google Ads (gtag.js) + Meta Pixel direto |

**Recomendacao padrao:** Instalar o que for necessario para as plataformas de anuncio utilizadas. Instalacao direta, sem intermediarios.

---

## 1. Google Ads (direto via gtag.js)

### Snippet no HTML

Adicionar em TODAS as paginas (index.html e obrigado.html):

```html
<head>
  <!-- Google Ads -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-XXXXXXXXXX');
  </script>
  <!-- End Google Ads -->

  <!-- ... resto do head ... -->
</head>
```

**IMPORTANTE:**
- Substituir `AW-XXXXXXXXXX` pelo Conversion ID real do Google Ads
- O snippet deve ficar o mais alto possivel no `<head>` (apos as metas iniciais, antes de outros scripts)

### Onde encontrar o Conversion ID e o Conversion Label

1. Abrir **Google Ads**: https://ads.google.com
2. Ferramentas > Medicao > Conversoes
3. Criar ou selecionar uma conversao
4. O Conversion ID tem formato `AW-XXXXXXXXXX`
5. O Conversion Label aparece junto — necessario para o evento de conversao

### Evento de Conversao

Disparar no submit do formulario:

```javascript
// Google Ads - conversao de lead
if (typeof gtag === 'function') {
  gtag('event', 'conversion', {
    'send_to': 'AW-XXXXXXXXXX/YYYYYYYY'  // Conversion ID + Conversion Label
  });
}
```

### Eventos automaticos do template

| Evento | Quando | Quem dispara |
|--------|--------|-------------|
| `config` (PageView) | Carregamento da pagina | Codigo base (automatico) |
| `conversion` | Form submit com sucesso | `script.js` (adicionar manualmente) |

---

## 2. Meta Pixel (Facebook/Instagram)

### Codigo Base

Adicionar no `<head>` de TODAS as paginas:

```html
<head>
  <!-- Meta Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'PIXEL_ID_AQUI');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=PIXEL_ID_AQUI&ev=PageView&noscript=1"/></noscript>
  <!-- End Meta Pixel Code -->
</head>
```

**IMPORTANTE:** Substituir `PIXEL_ID_AQUI` pelo ID numerico do Pixel.

### Onde encontrar o Pixel ID

1. Abrir **Meta Events Manager**: https://business.facebook.com/events_manager
2. Selecionar o Pixel
3. O ID numerico aparece abaixo do nome (ex: `123456789012345`)

### Eventos do Meta Pixel

O template ja dispara `Lead` automaticamente no submit do formulario.

| Evento | Quando | Quem dispara |
|--------|--------|-------------|
| `PageView` | Carregamento da pagina | Codigo base (automatico) |
| `Lead` | Form submit com sucesso | `script.js` (automatico) |

### Eventos adicionais (se necessario)

```javascript
// Na pagina de obrigado
fbq('track', 'CompleteRegistration');

// Clique em botao de WhatsApp
fbq('track', 'Contact');

// Visualizacao de video
fbq('track', 'ViewContent', {
  content_name: 'Video depoimento',
  content_type: 'video'
});
```

### Pagina de Obrigado

A pagina de obrigado deve ter o **mesmo Pixel com PageView**, mas NAO precisa de `Lead` (ja foi disparado no submit):

```html
<head>
  <!-- Meta Pixel Code (MESMO codigo base, MESMO Pixel ID) -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'PIXEL_ID_AQUI');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=PIXEL_ID_AQUI&ev=PageView&noscript=1"/></noscript>
  <!-- End Meta Pixel Code -->
</head>
```

### Conversions API (CAPI) - Opcional Avancado

Para tracking server-side (mais preciso com bloqueadores):
- Configurar no Meta Events Manager
- Requer backend (Netlify Functions ou Zapier/Make)
- Fora do escopo deste template (HTML estatico)

---

## 3. Ordem dos Scripts no `<head>`

A ordem importa. Seguir esta sequencia:

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- SEO -->
  <title>...</title>
  <meta name="description" content="...">

  <!-- 1. Google Ads gtag.js (PRIMEIRO - se houver) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-XXXXXXXXXX');
  </script>

  <!-- 2. Meta Pixel (SEGUNDO - se houver) -->
  <script>!function(f,b,e,v,n,t,s){...}; fbq('init','PIXEL_ID'); fbq('track','PageView');</script>
  <noscript>...</noscript>

  <!-- 3. Open Graph -->
  <meta property="og:title" content="...">

  <!-- 4. Favicon, Fonts, CSS -->
  <link rel="icon" ...>
  <link rel="preconnect" ...>
  <link rel="stylesheet" ...>

  <!-- 5. Scripts da pagina -->
  <script src="..." defer></script>
</head>
```

---

## 4. Performance

### Impacto no PageSpeed

Google Ads gtag.js e Meta Pixel sao scripts terceiros. Impacto tipico:
- **TBT:** +50-150ms (execucao do JS)
- **Score:** -3 a -8 pontos (aceitavel para tracking)

### Otimizacao (se score for critico)

Se o PageSpeed Score for prioridade maxima, usar carregamento adiado:

```html
<script>
// Adia scripts de tracking para apos idle do browser
function loadTracking() {
  // Google Ads
  const gadsScript = document.createElement('script');
  gadsScript.async = true;
  gadsScript.src = 'https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXXX';
  document.head.appendChild(gadsScript);
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-XXXXXXXXXX');

  // Meta Pixel
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window,document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'PIXEL_ID_AQUI');
  fbq('track', 'PageView');
}

if ('requestIdleCallback' in window) {
  requestIdleCallback(loadTracking);
} else {
  setTimeout(loadTracking, 2000);
}
</script>
```

**ATENCAO:** O carregamento adiado pode:
- Perder PageViews de usuarios que saem muito rapido (<2s)
- Causar discrepancia nos dados de analytics
- **Recomendacao:** SO usar se a nota do PageSpeed for realmente critica. Na maioria dos casos, o carregamento normal e preferivel.

---

## 5. Verificacao e Debug

### Meta Pixel

1. **Meta Pixel Helper** (extensao Chrome): https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc
   - Mostra quais eventos foram disparados
   - Verifica se o Pixel esta ativo

2. **Events Manager**: https://business.facebook.com/events_manager
   - Aba "Test Events" > digitar URL > clicar "Open Website"
   - Navegar no site e verificar eventos em tempo real

3. **Console do browser:**
   ```javascript
   // Verificar se fbq existe
   typeof fbq // deve retornar "function"
   ```

### Google Ads

1. **Google Tag Assistant** (extensao Chrome): Verifica tags Google incluindo gtag.js

2. **Console do browser:**
   ```javascript
   // Verificar se gtag existe
   typeof gtag // deve retornar "function"

   // Ver dataLayer
   dataLayer
   ```

3. **Painel de Conversoes do Google Ads**: Apos publicar o site, verificar se conversoes aparecem como "Gravando conversoes"

### Checklist de Verificacao

- [ ] Pixel Helper mostra PageView no carregamento
- [ ] Pixel Helper mostra Lead apos submit do form
- [ ] Google Tag Assistant detecta gtag.js corretamente (se Google Ads)
- [ ] Events Manager recebe eventos em Test Events
- [ ] Pagina de obrigado tem o mesmo Pixel/Google Ads instalado
- [ ] Nao ha erros no console relacionados a tracking
- [ ] PageSpeed Score nao caiu mais que 10 pontos

---

## 6. Erros Comuns

### Pixel/gtag nao dispara

1. Verificar se o ID esta correto
2. Verificar se o snippet esta no `<head>` (nao no body)
3. Verificar se nao ha bloqueador de anuncios ativo
4. Testar em aba anonima

### Lead nao e registrado (Meta Pixel)

1. Verificar console apos submit do form
2. Verificar se `typeof fbq === 'function'` retorna true
3. Verificar se o form submit esta funcionando (Network tab)
4. O evento Lead e disparado ANTES do redirect - se o redirect for muito rapido, pode nao completar. O template ja cuida disso (dispara Lead, depois faz redirect).

### Conversao nao registrada (Google Ads)

1. Verificar se `typeof gtag === 'function'` retorna true no console
2. Verificar se o `send_to` no evento de conversao tem o formato correto: `AW-XXXXXXXXXX/LABEL`
3. Verificar no painel de conversoes do Google Ads se a conversao esta "Gravando"
4. Conversoes do Google Ads podem demorar ate 24h para aparecer no painel

### Eventos duplicados

1. Verificar se o Pixel NAO esta duplicado no HTML
2. Verificar se Lead NAO esta sendo disparado na pagina de obrigado (ja foi no submit)
3. Verificar se nao ha dois snippets do mesmo Pixel na pagina

---

## 7. Mapeamento de Eventos para Anuncios

### Meta Ads (Facebook/Instagram)

| Objetivo do Anuncio | Evento para Otimizar | Onde Disparar |
|---------------------|---------------------|--------------|
| Gerar leads | Lead | Submit do form |
| Trafego | PageView | Automatico |
| Conversoes | CompleteRegistration | Pagina obrigado |
| Engajamento | ViewContent | Automatico |

### Google Ads

| Objetivo | Evento gtag | Onde Disparar |
|----------|-------------|--------------|
| Gerar leads | `gtag('event', 'conversion', { send_to: 'AW-ID/LABEL' })` | Submit do form |
| Conversao na pagina de obrigado | `gtag('event', 'conversion', { send_to: 'AW-ID/LABEL' })` | Inline na pagina obrigado |

---

## 8. Template de Configuracao

Ao configurar tracking, colete do usuario:

```
TRACKING CONFIGURATION
======================
Google Ads Conversion ID: AW-_______
Google Ads Conversion Label: ________
Meta Pixel ID: _______________

Eventos desejados:
[ ] PageView (automatico)
[ ] Lead no form submit (automatico - Meta Pixel)
[ ] Conversao no form submit (Google Ads)
[ ] Conversao na pagina de obrigado
[ ] Click em CTAs

Plataformas de anuncio:
[ ] Meta Ads (Facebook/Instagram)
[ ] Google Ads
[ ] Outro: _______________
```
