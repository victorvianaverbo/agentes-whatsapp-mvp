---
name: optimize
description: Use when the user wants to optimize performance, improve PageSpeed score, check if the site is optimized, or before deploying to production. Covers loading (images, CSS, fonts, scripts, resource hints) AND runtime (animations, RAF, scroll).
---

# Skill: Optimize

Referencia rapida para otimizacoes de performance.

**Metas:**
- PageSpeed: **90+** (Desktop e Mobile)
- Runtime: **60 FPS**
- CLS: **< 0.1**
- TBT: **< 200ms**
- LCP: **< 2.5s**

Para instrucoes detalhadas, use o workflow `/otimizar`.

---

# REGRA DE OURO

**Medir ANTES, medir DEPOIS. Se piorou, reverter.**

NUNCA aplique otimizacoes "porque sao boas praticas". Cada mudanca deve ser verificavel. Se a nota caiu, a mudanca foi errada.

---

# AUDITORIA PRIMEIRO (OBRIGATORIO)

**NUNCA corrija antes de auditar.** Leia TODOS os arquivos e liste TODOS os problemas.

## Checklist de Auditoria

Para CADA `<img>`:
- [ ] Usa CDN? width numerico? height numerico? loading correto?

Para CADA `<script>`:
- [ ] Tem defer? Pode ser removido?
- [ ] **Esta linkado no HTML mas deveria ser Dynamic Import?**

Para CADA `import` estatico no JS:
- [ ] Biblioteca pesada? (Three.js, GSAP, etc.) Usar Dynamic Import!

Para CADA biblioteca:
- [ ] CSS E JS podem ser removidos? (ambos, nao so um)

Hero/LCP:
- [ ] opacity:0? data-aos? animacao entrada? transform inicial?
- [ ] Hero container tem min-height fixo?

Fonts:
- [ ] Quantos weights? (max 3) display=swap na URL?
- [ ] preconnect para fonts.googleapis.com e fonts.gstatic.com?

AOS:
- [ ] `disableMutationObserver: true`? `once: true`?

Runtime (se houver animacoes JS):
- [ ] Quantos RAF loops? (deve ser 1) Throttle no scroll?

Three.js (se houver):
- [ ] GLB > 500KB? Usa Draco? Luzes? (max 3)
- [ ] Usa import estatico? (ERRADO - usar Dynamic Import)

**Apresente relatorio completo antes de corrigir.**

---

# OTIMIZACOES SEGURAS (SEMPRE aplicar)

Estas mudancas SEMPRE melhoram ou sao neutras. Nunca pioram a nota.

## 1. Imagens

```html
<!-- ERRADO -->
<img src="..." width="600" height="auto">

<!-- CORRETO -->
<img
  src="/.netlify/images?url=/images/foto.jpg&w=600&q=80"
  width="600"
  height="400"
  loading="lazy"
  alt="Descricao"
>
```

- [ ] Netlify CDN com `q=80`
- [ ] **width + height NUMERICOS** (NUNCA "auto" ou "100%")
- [ ] Hero: `loading="eager"` + `fetchpriority="high"`
- [ ] Demais: `loading="lazy"`

## 2. Hero (LCP) - CRITICO

- [ ] **SEM animacao de ENTRADA** (fade, slide, scale)
- [ ] **SEM `opacity: 0` inicial**
- [ ] **SEM `data-aos`** em nenhum elemento do hero
- [ ] **SEM `transform` inicial** (scale, translate)
- [ ] Texto visivel no PRIMEIRO frame
- [ ] Container com min-height fixo

```css
/* ERRADO - Google considera o site "vazio" */
.hero-title {
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
}

/* CORRETO - Visivel no primeiro frame */
.hero-title {
  opacity: 1;
}
```

## 3. AOS - Configuracao Correta

```javascript
// CORRETO
AOS.init({
  duration: 800,
  once: true,
  offset: 50,
  easing: 'ease-out-cubic',
  disableMutationObserver: true
});
```

**Regras:**
- [ ] `disableMutationObserver: true` SEMPRE (previne CLS no body)
- [ ] `once: true` SEMPRE (anima apenas uma vez)
- [ ] Inicializar no DOMContentLoaded (NAO adiar com Interaction Trigger)

## 4. Resource Hints

```html
<head>
  <!-- Preconnect para Google Fonts (OBRIGATORIO) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <!-- DNS Prefetch para terceiros -->
  <link rel="dns-prefetch" href="//www.google-analytics.com">
  <link rel="dns-prefetch" href="//connect.facebook.net">

  <!-- Preload da imagem do hero (se houver) -->
  <link rel="preload" href="/.netlify/images?url=/images/hero.jpg&w=1200&q=80" as="image">
</head>
```

## 5. Fontes

A configuracao padrao do template JA e otima:

```html
<!-- CORRETO - Manter assim -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Font:wght@400;700&display=swap" rel="stylesheet">
```

- [ ] `preconnect` para ambos os dominios
- [ ] `display=swap` na URL
- [ ] **Max 2-3 weights** (cada weight extra = ~20-50KB)
- [ ] **NAO tornar async** (ver secao NUNCA FAZER)

## 6. Scripts

```html
<script src="/script.js" defer></script>
```

- [ ] Scripts com `defer`
- [ ] Bibliotecas minimas (jQuery -> Vanilla JS, Swiper -> CSS puro)
- [ ] **Modulos pesados NAO linkados no HTML**

## 7. Videos

```html
<video poster="poster.jpg" preload="none">
  <source src="video.webm" type="video/webm">
</video>
```

## 8. Iframes

```html
<iframe src="..." loading="lazy"></iframe>
```

- [ ] `loading="lazy"`
- [ ] Facade pattern para YouTube

## 9. Acessibilidade

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# OTIMIZACOES CONDICIONAIS (aplicar com cuidado)

Estas mudancas PODEM melhorar, mas tambem PODEM piorar se feitas errado. Verificar resultado apos cada uma.

## 10. Dynamic Import para Modulos Pesados

**Quando usar:** Three.js, GSAP pesado, particulas, qualquer modulo >100KB.

**Padrao: Lazy Load por Visibilidade**

```javascript
// Carrega modulo quando a secao entra no viewport
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

// USO:
lazyLoadModule('#secao-3d', async () => {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  initScene(THREE, GLTFLoader);
});

lazyLoadModule('#secao-particulas', async () => {
  const { initParticles } = await import('./particles.js');
  const isMobile = window.innerWidth < 768;
  initParticles({ count: isMobile ? 25 : 40 });
});
```

**Por que IntersectionObserver e nao Interaction Trigger:**
- PageSpeed NAO interage com a pagina. Interaction Trigger com fallback de 8s carrega recursos durante a janela de medicao do PageSpeed, gerando pico de TBT.
- IntersectionObserver so carrega quando a secao esta proxima do viewport. Se a secao esta abaixo do fold, nao carrega durante o teste.
- Para o usuario real, carrega naturalmente ao scrollar.

### Script no Caminho Critico (ARMADILHA)

```html
<!-- ERRADO - modulo pesado esta no HTML = caminho critico -->
<script src="/script.js" defer></script>
<script src="/module-3d.js" defer></script>  <!-- PROBLEMA! -->

<!-- CORRETO - modulo pesado SO carrega via Dynamic Import -->
<script src="/script.js" defer></script>
<!-- Nenhuma referencia ao modulo pesado aqui -->
```

### Falso Deferimento (ARMADILHA)

```javascript
// ERRADO - import estatico SEMPRE baixa imediatamente
import * as THREE from 'three';
setTimeout(() => initScene(), 5000); // THREE ja foi baixado!

// CORRETO - Dynamic Import so baixa quando chamado
async function initScene() {
  const THREE = await import('three');
}
```

## 11. Third-Party (Analytics, Pixels)

```javascript
// Carregar apos idle do browser
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => { loadAnalytics(); loadPixels(); });
} else {
  setTimeout(() => { loadAnalytics(); loadPixels(); }, 3000);
}
```

- [ ] `requestIdleCallback` ou delay de 3s
- [ ] `dns-prefetch` para dominios terceiros

## 12. Critical CSS Inline + CSS Async

**Quando usar:** Quando o PageSpeed reporta "Eliminate render-blocking resources" no CSS.

**Pattern correto (2 passos OBRIGATORIOS):**

```html
<head>
  <!-- PASSO 1: CSS critico inline (above-the-fold) -->
  <style>
    /* Incluir: variaveis CSS, reset, fontes, nav, hero, primeira secao */
    :root { --color-primary: #...; --color-bg: #...; }
    body { margin: 0; font-family: ...; background: var(--color-bg); color: ...; }
    .nav { ... }
    .hero { min-height: 100vh; ... }
    .hero-title { ... }
    .btn { ... }
    /* TUDO que aparece no primeiro viewport sem scroll */
  </style>

  <!-- PASSO 2: CSS completo async + fallback noscript -->
  <link rel="stylesheet" href="/style.css" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="/style.css"></noscript>
</head>
```

**REGRAS CRITICAS:**
- [ ] O inline DEVE cobrir TUDO visivel no primeiro viewport (hero, nav, botoes, tipografia, cores, backgrounds)
- [ ] Incluir `:root` com variaveis, reset basico, todas as classes do hero/nav
- [ ] O `<noscript>` fallback e OBRIGATORIO
- [ ] **Medir CLS apos a mudanca** - se CLS > 0.1, o inline esta incompleto → adicionar mais estilos ou reverter
- [ ] NUNCA fazer CSS async SEM o inline critico (ver secao NUNCA FAZER)

**Por que funciona:** O browser renderiza o above-fold usando o CSS inline (sem request extra). O CSS completo carrega async e aplica estilos das secoes below-fold. Como o above-fold ja tem todos os estilos inline, nao ha layout shift.

## 13. content-visibility (CUIDADO)

```css
/* SOMENTE em secoes bem abaixo do fold com altura conhecida */
.secao-longe-do-fold {
  content-visibility: auto;
  contain-intrinsic-size: 0 600px; /* DEVE ser proximo da altura REAL */
}
```

**REGRAS:**
- [ ] NUNCA usar em secoes perto do topo (hero, segunda secao)
- [ ] O `contain-intrinsic-size` DEVE ser proximo da altura real da secao
- [ ] Se nao sabe a altura, NAO USE (CLS garantido)
- [ ] Testar antes e depois - se CLS subiu, remover

## 14. Three.js (CRITICO)

```javascript
lazyLoadModule('#secao-3d', async () => {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');

  initScene(THREE, GLTFLoader, DRACOLoader);
});

function initScene(THREE, GLTFLoader, DRACOLoader) {
  const isMobile = window.innerWidth < 768;

  const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  // Max 3 luzes!
}
```

**Checklist Three.js:**
- [ ] **Dynamic Import** (NUNCA import estatico)
- [ ] **IntersectionObserver** para carregar quando visivel
- [ ] **Modulo NAO linkado no HTML**
- [ ] GLB com Draco (se > 500KB)
- [ ] Max 3 luzes
- [ ] Antialias OFF em mobile
- [ ] Pixel ratio 1 em mobile

---

# NUNCA FAZER (causa queda de nota)

## 1. NUNCA tornar CSS async SEM critical CSS inline

```html
<!-- PROIBIDO - pagina renderiza SEM estilo = CLS 0.3-0.7 -->
<link rel="stylesheet" href="/style.css" media="print" onload="this.media='all'">
<!-- Sem <style> inline = FOUC + CLS massivo -->

<!-- CORRETO opcao A - CSS sincrono (padrao seguro) -->
<link rel="stylesheet" href="/style.css">

<!-- CORRETO opcao B - Critical CSS inline + async (maior performance) -->
<style>/* CSS above-the-fold completo aqui */</style>
<link rel="stylesheet" href="/style.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/style.css"></noscript>
```

**Por que:** CSS async SEM critical inline faz a pagina renderizar sem nenhum estilo e re-renderizar quando o CSS carrega = CLS massivo. COM critical inline, o above-fold ja tem estilos e nao ha shift. Ver secao 12 para o pattern correto.

## 2. NUNCA tornar Google Fonts async via media="print"

```html
<!-- PROIBIDO -->
<link href="https://fonts.googleapis.com/css2?..." rel="stylesheet" media="print" onload="this.media='all'">

<!-- CORRETO - manter sincrono com preconnect -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?...&display=swap" rel="stylesheet">
```

**Por que:** O CSS do Google Fonts e minusculo (~500 bytes, so @font-face). Torna-lo async ATRASA o inicio do download das fontes e ANULA o preconnect. O `display=swap` na URL ja garante que o texto aparece imediatamente.

## 3. NUNCA adiar AOS com Interaction Trigger

```javascript
// PROIBIDO - conteudo fica invisivel ate interacao
onFirstInteraction(() => {
  AOS.init({ once: true, disableMutationObserver: true });
});

// CORRETO - inicializar normalmente no DOMContentLoaded
AOS.init({
  once: true,
  disableMutationObserver: true
});
```

**Por que:** O CSS do AOS aplica `opacity: 0` nos elementos `[data-aos]` imediatamente. Se o JS so roda apos interacao, os elementos ficam INVISIVEIS. Quando o AOS finalmente inicia, todos aparecem de uma vez = CLS massivo.

## 4. NUNCA usar `contain: layout paint` em secoes com overflow

```css
/* PERIGOSO - pode clipar conteudo que transborda */
.section { contain: layout paint; }

/* SO usar quando a secao tem altura/largura bem definidas e nenhum overflow */
```

**Por que:** `contain: paint` cria um novo contexto de pintura e CLIPA todo overflow. Elementos posicionados absolutamente, decoracoes que transbordam, e gradientes que saem da secao serao cortados.

## 5. NUNCA usar Interaction Trigger com fallback curto

```javascript
// PROIBIDO - 8 segundos cai na janela de medicao do PageSpeed
setTimeout(() => {
  if (!interacted) { interacted = true; callbacks.forEach(cb => cb()); }
}, 8000);
```

**Por que:** PageSpeed Lighthouse mede por ~10-15 segundos e NAO interage. Um fallback de 8s carrega recursos pesados DURANTE a medicao, gerando pico de TBT que derruba a nota. Use IntersectionObserver em vez de timers.

---

# REGRAS DE CORRECAO

1. **Medir antes**: Anotar nota atual do PageSpeed antes de qualquer mudanca
2. **Exaustivo**: Corrigir TODAS as imagens, nao apenas algumas
3. **Completo**: Remover biblioteca = remover CSS + JS + codigo dependente
4. **Numerico**: width/height SEMPRE numeros (NUNCA "auto" ou "100%")
5. **Dynamic Import**: Bibliotecas pesadas (>100KB) com IntersectionObserver
6. **Manter funcionalidade**: NUNCA desabilitar recursos - otimizar para que funcionem
7. **Medir depois**: Comparar nota final com nota inicial. Se caiu, reverter.

---

# CHECKLIST RAPIDO

## Seguro (SEMPRE aplicar)
- [ ] Hero: sem opacity:0, sem data-aos, sem animacao entrada, min-height fixo
- [ ] Imagens: CDN, width/height numerico, loading correto
- [ ] AOS: `disableMutationObserver: true`, `once: true`, init no DOMContentLoaded
- [ ] Fontes: preconnect + display=swap (manter sincrono)
- [ ] Scripts: defer
- [ ] Resource hints: preconnect, dns-prefetch, preload hero
- [ ] Reduced motion media query

## Condicional (verificar resultado)
- [ ] Critical CSS inline + CSS async (cobrir TODO o above-fold no inline)
- [ ] Scripts pesados: Dynamic Import + IntersectionObserver
- [ ] Third-party: requestIdleCallback
- [ ] content-visibility em secoes BEM abaixo do fold (altura conhecida)

## NUNCA fazer
- [ ] CSS async SEM critical CSS inline
- [ ] Fontes async (media="print")
- [ ] AOS via Interaction Trigger
- [ ] contain: layout paint em secoes com overflow
- [ ] Fallback timer < 20 segundos para recursos pesados

---

# ERROS COMUNS DO AGENTE

1. **CSS async sem inline**: Tornar stylesheet async SEM critical CSS inline = CLS massivo
2. **Fontes async**: Usar media="print" em Google Fonts = atrasa fontes, anula preconnect
3. **AOS adiado**: Defer AOS com Interaction Trigger = conteudo invisivel + CLS
4. **Import estatico**: Usar `import THREE from 'three'` no topo (SEMPRE use Dynamic Import)
5. **Script no HTML**: Linkar modulo pesado no HTML alem do Dynamic Import
6. **Corrigir parcialmente**: Verificar apenas algumas imagens, nao todas
7. **Remover incompleto**: Remover JS mas esquecer CSS da biblioteca
8. **height="auto"**: Usar "auto" mesmo documentacao dizendo para nao usar
9. **Pular auditoria**: Ir direto para correcoes sem listar problemas
10. **Nao medir**: Nao comparar nota antes/depois

---

# PROBLEMAS COMUNS

- CLS 0.7+ no body -> AOS sem `disableMutationObserver: true`
- CLS alto -> height="auto" em imagens -> height NUMERICO
- CLS no hero -> Fontes causando reflow -> display=swap ja resolve (NAO tornar async)
- CLS no hero -> Container sem altura fixa -> min-height no container
- CLS botoes -> transform/opacity inicial no hero -> Remover animacao de entrada
- LCP alto -> opacity:0 no hero -> Hero visivel no primeiro frame
- LCP alto -> imagem sem preload -> preload hero + CDN
- TBT alto -> import estatico de libs pesadas -> Dynamic Import + IntersectionObserver
- Script critico -> `<script src="modulo.js">` no HTML -> Remover do HTML, usar Dynamic Import
- FCP alto -> Muitos weights de fonte -> Reduzir para 2-3 weights
- Nota cai apos otimizar -> CSS async sem critical inline OU fontes async -> Reverter ou completar o inline

---

# TESTANDO

1. **PageSpeed**: https://pagespeed.web.dev/ (testar Desktop E Mobile)
2. **DevTools Performance**: gravar 5s scroll
3. **DevTools Network**: verificar se Dynamic Imports so aparecem apos scroll
4. **Meta**: 90+ Score Desktop E Mobile, 60 FPS
5. **Comparar**: nota ANTES vs nota DEPOIS de cada mudanca
