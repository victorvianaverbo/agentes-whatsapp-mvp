/* ============================================
   app.js | Judah Co. — vitrine multi-marca
   Menu mobile + links de WhatsApp por produto + scroll progress
   ============================================ */

const WHATSAPP = '5531991618745';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initProductWhatsApp();
  initScrollProgressFallback();
});

/* --- Menu mobile --- */
function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Fecha o menu ao clicar num link
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* --- Monta o link wa.me de cada botão "Consultar" com o nome do produto --- */
function initProductWhatsApp() {
  const ctas = document.querySelectorAll('.js-wa');
  ctas.forEach(cta => {
    const produto = cta.dataset.produto || 'um produto';
    const msg = `Olá! Vim pelo site da Judah Co. e quero consultar disponibilidade e valor do ${produto}.`;
    const href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
    cta.setAttribute('href', href);
    cta.setAttribute('target', '_blank');
    cta.setAttribute('rel', 'noopener');
  });
}

/* --- Scroll Progress Fallback (browsers sem animation-timeline) --- */
function initScrollProgressFallback() {
  if (CSS.supports && CSS.supports('animation-timeline', 'scroll()')) return;

  const bar = document.querySelector('.scroll-progress__bar');
  if (!bar) return;

  bar.style.animation = 'none';
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    bar.style.transform = 'scaleX(' + Math.min(pct, 1) + ')';
  }, { passive: true });
}
