// =========================================================
// Kairós Operação · Proposta Celso
// Vanilla JS — sem libs externas
// =========================================================

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -------------------------------------------------------
  // 1. Intersection Observer — reveal de seções
  // -------------------------------------------------------
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    const setStaggerIndex = (parent) => {
      [...parent.children].forEach((child, i) => {
        child.style.setProperty('--si', i);
      });
    };

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            if (el.hasAttribute('data-reveal-stagger')) {
              setStaggerIndex(el);
            }
            el.classList.add('is-visible');
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -10% 0px' }
    );

    revealEls.forEach((el) => observer.observe(el));
  }

  // -------------------------------------------------------
  // 2. Diagram visibility (S6) — controla draw SVG + nodes
  // -------------------------------------------------------
  const diagram = document.querySelector('.diagram');
  if (diagram) {
    const obsDiag = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            diagram.classList.add('is-visible');
            obs.unobserve(diagram);
          }
        });
      },
      { threshold: 0.3 }
    );
    obsDiag.observe(diagram);
  }

  // -------------------------------------------------------
  // 3. Timeline (S9) — fill da linha + nodes acendendo
  // -------------------------------------------------------
  const timeline = document.querySelector('.timeline');
  if (timeline) {
    const obsTl = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            timeline.classList.add('is-visible');
            obs.unobserve(timeline);
          }
        });
      },
      { threshold: 0.25 }
    );
    obsTl.observe(timeline);
  }

  // -------------------------------------------------------
  // 4. Counter animation (cases stats e invest big number)
  // -------------------------------------------------------
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length && !reduceMotion) {
    const animateCounter = (el) => {
      const target = parseInt(el.dataset.counter, 10);
      const suffix = el.dataset.suffix || '';
      const isThousands = el.dataset.format === 'thousands';
      const duration = 1400;
      const start = performance.now();

      const formatNumber = (n) => {
        if (isThousands) return Math.round(n).toLocaleString('pt-BR');
        return Math.round(n);
      };

      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out quad
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = formatNumber(target * eased) + (progress === 1 ? suffix : '');
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    const counterObs = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => counterObs.observe(c));
  }

  // -------------------------------------------------------
  // 5. Scroll progress bar (top)
  // -------------------------------------------------------
  const progressFill = document.getElementById('scrollProgress');
  if (progressFill) {
    let ticking = false;
    const updateProgress = () => {
      const h = document.documentElement;
      const scrollTop = h.scrollTop || document.body.scrollTop;
      const scrollHeight = h.scrollHeight - h.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      progressFill.style.width = pct + '%';
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });
    updateProgress();
  }

  // -------------------------------------------------------
  // 6. Anchor marks (lateral) — active state + scroll
  // -------------------------------------------------------
  const anchorBtns = document.querySelectorAll('.anchor-marks__dot');
  if (anchorBtns.length) {
    const sections = [...anchorBtns].map((btn) => ({
      btn,
      target: document.getElementById(btn.dataset.anchor),
    })).filter((x) => x.target);

    // Click → smooth scroll
    sections.forEach(({ btn, target }) => {
      btn.addEventListener('click', () => {
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });

    // Active state
    let activeIdx = 0;
    const updateActive = () => {
      const mid = window.scrollY + window.innerHeight / 2;
      let bestIdx = 0;
      sections.forEach(({ target }, i) => {
        if (target.offsetTop <= mid) bestIdx = i;
      });
      if (bestIdx !== activeIdx) {
        sections[activeIdx]?.btn.classList.remove('is-active');
        sections[bestIdx].btn.classList.add('is-active');
        activeIdx = bestIdx;
      }
    };
    let activeTicking = false;
    window.addEventListener('scroll', () => {
      if (!activeTicking) {
        requestAnimationFrame(() => { updateActive(); activeTicking = false; });
        activeTicking = true;
      }
    }, { passive: true });
    updateActive();
  }

  // -------------------------------------------------------
  // 7. Cursor customizado (desktop + hover devices)
  // -------------------------------------------------------
  const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1025px)').matches;
  if (isDesktop) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (dot && ring) {
      let mouseX = 0, mouseY = 0;
      let ringX = 0, ringY = 0;

      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      });

      const animateRing = () => {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
        requestAnimationFrame(animateRing);
      };
      animateRing();

      // Hover state em interativos
      const interactiveSelector = 'a, button, .bcard, .layer, .case, .suporte__card, .invest__block, .diagram__node, .next__step, .crm__feature';
      document.querySelectorAll(interactiveSelector).forEach((el) => {
        el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
        el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
      });
    }
  }

  // -------------------------------------------------------
  // 8. Smooth scroll para links âncora (bento → seções)
  // -------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
})();
