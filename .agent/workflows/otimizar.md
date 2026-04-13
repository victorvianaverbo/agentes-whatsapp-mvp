---
description: otimizar
---

# Workflow: Otimizar Performance

Meta: **Score 90+ no PageSpeed** (Desktop E Mobile) e **60 FPS constantes**.

---

# FASE 0: MEDIR ANTES (OBRIGATORIO)

**NUNCA pule esta fase.** Sem a nota inicial, nao da para saber se as mudancas ajudaram ou prejudicaram.

## Medicao automatica com Lighthouse

Garanta que o servidor local esta rodando (skill `local-server`). Depois meça com `npx lighthouse` (funciona sem instalacao):

```bash
# Desktop
npx lighthouse http://localhost:8888/CAMINHO --chrome-flags="--headless=new" --preset=desktop --output=json --output-path=./lighthouse-desktop-antes.json --quiet

# Mobile (padrao do Lighthouse)
npx lighthouse http://localhost:8888/CAMINHO --chrome-flags="--headless=new" --output=json --output-path=./lighthouse-mobile-antes.json --quiet
```

Extraia e apresente os scores:

```bash
node -e "
const d=require('./lighthouse-desktop-antes.json');
const m=require('./lighthouse-mobile-antes.json');
const fmt=(r,label)=>{const c=r.categories.performance.score*100;const a=r.audits;return label+': '+c.toFixed(0)+' | LCP: '+a['largest-contentful-paint'].displayValue+' | TBT: '+a['total-blocking-time'].displayValue+' | CLS: '+a['cumulative-layout-shift'].displayValue+' | FCP: '+a['first-contentful-paint'].displayValue};
console.log(fmt(d,'DESKTOP'));
console.log(fmt(m,'MOBILE'));
"
```

Apresente os resultados ao usuario antes de prosseguir.

Se o site ja esta publicado, substitua `http://localhost:8888/CAMINHO` pela URL de producao.

---

# FASE 1: AUDITORIA (OBRIGATORIA)

**NUNCA corrija antes de completar a auditoria.**

## Passo 1: Ler Todos os Arquivos

Leia COMPLETAMENTE: `index.html`, `style.css`, `script.js` e qualquer CSS/JS linkado.

## Passo 2: Identificar TODOS os Problemas

### 2.1 Imagens
Para CADA `<img>`: Netlify CDN? width/height numericos? loading correto (eager hero, lazy resto)?

### 2.2 Hero/LCP (CRITICO)
opacity:0 inicial? data-aos no hero? Animacao de entrada? transform inicial? Botoes com transform/opacity? Hero tem min-height fixo?

### 2.3 AOS
`disableMutationObserver: true`? `once: true`? Inicializa no DOMContentLoaded?

### 2.4 Fontes
Quantos weights? (max 3) `display=swap` na URL? `preconnect` para ambos dominios?

### 2.5 Resource Hints
Falta preconnect fonts? dns-prefetch analytics? preload hero image?

### 2.6 Scripts
Para CADA `<script>`: tem defer? Pode ser removido?
Para CADA modulo pesado: Usa import estatico? (DEVE ser Dynamic Import) Esta linkado no HTML? (NAO deveria)

### 2.7 Third-Party
Analytics/pixels carregam imediatamente? Deveriam usar requestIdleCallback.

### 2.8 JS Runtime (se houver animacoes JS)
Multiplos RAF loops? Scroll sem throttle? Nao pausa off-screen/tab inativa?

### 2.9 Videos/Iframes
Videos sem poster/preload="none"? Iframes sem loading="lazy"?

## Passo 3: Classificar e Apresentar

Classifique cada problema:
- **SEGURO** = correcao que SEMPRE melhora (imagens, hero, AOS config, resource hints)
- **CONDICIONAL** = correcao que PODE melhorar se feita corretamente (Dynamic Import, content-visibility)

**IMPORTANTE: Verificar se alguma "otimizacao" perigosa JA foi aplicada:**
- CSS com `media="print" onload` SEM `<style>` inline critico? -> REVERTER para sincrono OU adicionar critical CSS inline
- Google Fonts com `media="print" onload`? -> REVERTER para sincrono com preconnect
- AOS inicializado via Interaction Trigger? -> REVERTER para init normal no DOMContentLoaded
- `contain: layout paint` em secoes com overflow? -> REMOVER

Apresente o relatorio completo.

**Aguarde aprovacao antes de corrigir.**

---

# FASE 2: CORRECOES SEGURAS

Estas mudancas SEMPRE melhoram a nota. Aplicar TODAS.

## Regras
1. Corrigir TODAS as imagens, nao algumas
2. Remover biblioteca = CSS + JS + codigo + classes HTML
3. width/height = NUMEROS (nunca "auto", "100%")
4. **NUNCA desabilitar recursos - otimizar para que funcionem**

---

### 1. Imagens

```html
<img src="/.netlify/images?url=/images/foto.jpg&w=600&q=80" width="600" height="400" loading="lazy" alt="Descricao">
<!-- Hero: loading="eager" fetchpriority="high" -->
```

### 2. Hero (LCP)

Remover do hero: opacity:0, data-aos, animacoes de entrada, transform inicial.
Adicionar: min-height fixo no container.
**Texto e CTAs visiveis no primeiro frame.**

### 3. AOS

```javascript
AOS.init({
  duration: 800,
  once: true,
  offset: 50,
  easing: 'ease-out-cubic',
  disableMutationObserver: true
});
```

Inicializar no DOMContentLoaded. NUNCA adiar com Interaction Trigger.

### 4. Resource Hints

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="dns-prefetch" href="//www.google-analytics.com">
<link rel="dns-prefetch" href="//connect.facebook.net">
<link rel="preload" href="/.netlify/images?url=/images/hero.jpg&w=1200&q=80" as="image">
```

### 5. Fontes

Manter sincronas com `preconnect` + `display=swap`. Reduzir para max 2-3 weights.

```html
<!-- CORRETO - manter assim -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Font:wght@400;700&display=swap" rel="stylesheet">
```

### 6. Scripts

```html
<script src="/script.js" defer></script>
```

Modulos pesados NAO no HTML - so Dynamic Import.

### 7. Videos/Iframes

```html
<video poster="poster.jpg" preload="none">...</video>
<iframe src="..." loading="lazy"></iframe>
```

### 8. Acessibilidade

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# FASE 3: CORRECOES CONDICIONAIS

Estas mudancas PODEM ajudar, mas exigem cuidado. Aplicar uma de cada vez e verificar resultado.

### 9. Dynamic Import + IntersectionObserver (modulos pesados)

```javascript
function lazyLoadModule(selectorSecao, loadFn) {
  const section = document.querySelector(selectorSecao);
  if (!section) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      observer.disconnect();
      loadFn();
    }
  }, { rootMargin: '200px' });

  observer.observe(section);
}

// Three.js
lazyLoadModule('#secao-3d', async () => {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
  initScene(THREE, GLTFLoader, DRACOLoader);
});

// Particulas
lazyLoadModule('#secao-particulas', async () => {
  const { initParticles } = await import('./particles.js');
  const isMobile = window.innerWidth < 768;
  initParticles({ count: isMobile ? 25 : 40 });
});
```

**NUNCA usar Interaction Trigger com fallback de 8s.** O PageSpeed nao interage e o fallback carrega recursos durante a janela de medicao.

### 10. Third-Party (Analytics, Pixels)

```javascript
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => { loadAnalytics(); loadPixels(); });
} else {
  setTimeout(() => { loadAnalytics(); loadPixels(); }, 3000);
}
```

### 11. Critical CSS Inline + CSS Async

Extrair CSS above-the-fold, inline no `<head>`, e carregar `style.css` async:

```html
<head>
  <!-- CSS critico inline (above-the-fold) -->
  <style>
    /* :root variaveis, reset, nav, hero, primeira secao, botoes */
    /* TUDO que aparece no primeiro viewport sem scroll */
  </style>

  <!-- CSS completo async + fallback -->
  <link rel="stylesheet" href="/style.css" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="/style.css"></noscript>
</head>
```

**Como extrair o CSS critico:**
1. Identificar quais elementos sao visiveis no primeiro viewport (hero, nav, botoes, tipografia)
2. Copiar TODAS as regras CSS que afetam esses elementos (incluindo `:root`, reset, fontes)
3. Incluir media queries relevantes para esses elementos
4. Testar: abrir a pagina e verificar se o above-fold renderiza identico com e sem o style.css

**Verificacao OBRIGATORIA apos aplicar:**
- [ ] CLS permanece < 0.1 (se subiu, o inline esta incompleto)
- [ ] Above-fold renderiza identico com CSS inline sozinho
- [ ] `<noscript>` fallback presente
- [ ] NUNCA fazer CSS async SEM o inline critico

### 12. content-visibility (CUIDADO)

```css
/* SOMENTE em secoes bem abaixo do fold */
.secao-longe-do-fold {
  content-visibility: auto;
  contain-intrinsic-size: 0 600px; /* DEVE ser proximo da altura REAL */
}
```

- NUNCA nas primeiras secoes
- DEVE saber a altura real da secao
- Se nao sabe a altura, NAO USE

### 12. JS Runtime (se houver animacoes)

```javascript
// Throttle scroll
let scheduled = false;
addEventListener('scroll', () => {
  if (!scheduled) {
    requestAnimationFrame(() => { update(); scheduled = false; });
    scheduled = true;
  }
}, { passive: true });
```

- Unico RAF loop
- IntersectionObserver para pausar off-screen
- visibilitychange para pausar tab inativa

---

# NUNCA FAZER (causa queda de nota)

Estas "otimizacoes" parecem boas praticas mas PIORAM a nota:

1. **CSS async SEM critical CSS inline** (`media="print" onload` sem `<style>` inline)
   -> Pagina renderiza sem estilo, re-renderiza com estilo = CLS 0.3-0.7
   -> COM critical inline e valido (ver item 11 da FASE 3)

2. **Google Fonts async** (`media="print" onload`)
   -> Atrasa download, anula preconnect. display=swap ja resolve.

3. **AOS via Interaction Trigger**
   -> CSS aplica opacity:0 imediatamente, JS so roda apos interacao = conteudo invisivel

4. **`contain: layout paint` em todas as secoes**
   -> Clipa overflow, quebra layouts criativos

5. **Interaction Trigger com fallback < 20s**
   -> Recursos carregam durante janela do PageSpeed = TBT

**Se alguma dessas ja foi aplicada, REVERTER como parte da otimizacao.**

---

# FASE 4: VALIDACAO

## Passo 1: Verificar cada correcao

Confirmar que cada problema da auditoria foi corrigido.
Relatorio: CORRIGIDO / NAO CORRIGIDO / NAO APLICAVEL

## Passo 2: Verificar no DevTools

**Network Tab:** Modulos pesados NAO aparecem no carregamento inicial, SO apos scroll ate a secao.
**Console:** Zero erros.

## Passo 3: Medir DEPOIS

Rodar Lighthouse novamente (mesma URL, mesmo servidor):

```bash
# Desktop
npx lighthouse http://localhost:8888/CAMINHO --chrome-flags="--headless=new" --preset=desktop --output=json --output-path=./lighthouse-desktop-depois.json --quiet

# Mobile
npx lighthouse http://localhost:8888/CAMINHO --chrome-flags="--headless=new" --output=json --output-path=./lighthouse-mobile-depois.json --quiet
```

Comparar ANTES vs DEPOIS:

```bash
node -e "
const da=require('./lighthouse-desktop-antes.json');
const dd=require('./lighthouse-desktop-depois.json');
const ma=require('./lighthouse-mobile-antes.json');
const md=require('./lighthouse-mobile-depois.json');
const g=(r,k)=>r.audits[k].displayValue;
const s=(r)=>(r.categories.performance.score*100).toFixed(0);
console.log('            | ANTES | DEPOIS | DIFF');
console.log('Desktop     |  '+s(da)+'   |  '+s(dd)+'    | '+(s(dd)-s(da)>0?'+':'')+(s(dd)-s(da)));
console.log('Mobile      |  '+s(ma)+'   |  '+s(md)+'    | '+(s(md)-s(ma)>0?'+':'')+(s(md)-s(ma)));
console.log('LCP Desktop | '+g(da,'largest-contentful-paint')+' | '+g(dd,'largest-contentful-paint'));
console.log('LCP Mobile  | '+g(ma,'largest-contentful-paint')+' | '+g(md,'largest-contentful-paint'));
console.log('CLS Desktop | '+g(da,'cumulative-layout-shift')+' | '+g(dd,'cumulative-layout-shift'));
console.log('CLS Mobile  | '+g(ma,'cumulative-layout-shift')+' | '+g(md,'cumulative-layout-shift'));
console.log('TBT Desktop | '+g(da,'total-blocking-time')+' | '+g(dd,'total-blocking-time'));
console.log('TBT Mobile  | '+g(ma,'total-blocking-time')+' | '+g(md,'total-blocking-time'));
"
```

**Se a nota CAIU:** Identificar qual mudanca causou a queda e reverter. As correcoes SEGURAS nunca causam queda - o problema esta nas CONDICIONAIS ou em algo que entrou na lista NUNCA FAZER.

## Passo 4: Limpar arquivos temporarios

```bash
rm -f lighthouse-desktop-antes.json lighthouse-desktop-depois.json lighthouse-mobile-antes.json lighthouse-mobile-depois.json
```

**PARAR E AGUARDAR. Apresentar tabela comparativa ao usuario.**

---

# REGRAS

- **NUNCA** corrija sem auditoria completa
- **NUNCA** corrija parcialmente (todas as imagens, nao algumas)
- **NUNCA** use import estatico para bibliotecas pesadas
- **NUNCA** linke modulos pesados no HTML
- **NUNCA** torne CSS async SEM critical CSS inline
- **NUNCA** torne fontes async
- **NUNCA** adie AOS com Interaction Trigger
- **NUNCA** desabilite recursos - otimize para que funcionem
- **NUNCA** deploy sem comparar nota antes/depois
- **NUNCA** prossiga automaticamente - aguarde comando explicito
