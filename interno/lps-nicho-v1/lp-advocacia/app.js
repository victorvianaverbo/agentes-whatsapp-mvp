/* ============================================
   app.js | FAQ Accordion + Form Wizard + Cal.com
   Pagina: LP Advocacia (Vertice Labs)
   ============================================ */

// Supabase (anon key publica, RLS controla INSERT)
const SUPABASE_URL = 'https://ltzcxvbfywkzgwijvpre.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0emN4dmJmeXdremd3aWp2cHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMzQwMjMsImV4cCI6MjA5MjgxMDAyM30.a5E2Zi1Qe3KKx_R4jPtMCmOVXSCl-oXmnE8VwmFGd0E';
const SUPABASE_TABLE = 'lead_advocacia';

// Cal.com
const CAL_LINK = 'victor-viana-wj5ekx/diagnostico-escritorio-advocacia';

document.addEventListener('DOMContentLoaded', () => {
  initFAQ();
  initFormWizard();
  initScrollProgressFallback();
});

/* --- FAQ Accordion --- */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const trigger = item.querySelector('.faq-item__trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');

      items.forEach(it => {
        it.classList.remove('is-open');
        it.querySelector('.faq-item__trigger').setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* --- Form Wizard (typeform-style) --- */
function initFormWizard() {
  const form = document.getElementById('form-diagnostico');
  if (!form) return;

  const wizard = form.querySelector('.wizard');
  const bar = form.querySelector('.wizard__bar');
  const steps = form.querySelectorAll('.wizard__step');
  const totalSteps = steps.length;
  let currentStep = 1;

  // Next buttons
  form.querySelectorAll('.wizard__next').forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateCurrentStep() && currentStep < totalSteps) {
        goToStep(currentStep + 1);
      }
    });
  });

  // Enter key advances step
  form.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('input[type="text"], input[type="tel"]')) {
      e.preventDefault();
      const nextBtn = steps[currentStep - 1].querySelector('.wizard__next');
      if (nextBtn) nextBtn.click();
    }
  });

  // Form submit
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    const submitBtn = form.querySelector('.wizard__submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
      const formData = new FormData(form);
      const nome = formData.get('nome') || '';
      const telefone = formData.get('telefone') || '';
      const area = formData.get('area') || '';
      const lp = 'lp-advocacia';

      // Gera event_id unico pra deduplicacao Pixel + CAPI
      const eventId = 'lead_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);

      // Meta Pixel client-side (Lead com event_id)
      if (typeof fbq === 'function') {
        fbq('track', 'Lead', {}, { eventID: eventId });
      }

      // GTM dataLayer (se houver)
      if (typeof dataLayer !== 'undefined') {
        dataLayer.push({ event: 'generate_lead', form_name: form.getAttribute('name'), event_id: eventId });
      }

      // Meta CAPI server-side (fire-and-forget)
      fetch('/api/capi-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, phone: telefone, lp, event_id: eventId })
      }).catch(() => {});

      // Supabase - persistir lead (fire-and-forget, com log)
      fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          nome,
          telefone,
          area,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          page_url: location.href
        })
      })
      .then(r => { if (!r.ok) console.error('[supabase] HTTP', r.status, SUPABASE_TABLE); })
      .catch(err => console.error('[supabase] fetch error', SUPABASE_TABLE, err));

      // Submit pro Netlify Forms (sempre funciona)
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });

      showScheduler(nome, telefone, area);
    } catch {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Ver horarios disponiveis';
    }
  });

  function validateCurrentStep() {
    const step = steps[currentStep - 1];
    const textInput = step.querySelector('input[type="tel"][name], input[type="text"][name]');
    const radios = step.querySelectorAll('input[type="radio"]');

    if (textInput && !textInput.value.trim()) {
      textInput.focus();
      textInput.style.borderColor = 'var(--error)';
      setTimeout(() => { textInput.style.borderColor = ''; }, 1500);
      return false;
    }

    if (radios.length && !step.querySelector('input[type="radio"]:checked')) {
      return false;
    }

    return true;
  }

  function goToStep(n) {
    steps[currentStep - 1].classList.remove('is-active');
    steps[n - 1].classList.add('is-active');
    currentStep = n;
    bar.style.width = ((n / totalSteps) * 100) + '%';

    const input = steps[n - 1].querySelector('input[type="tel"][name], input[type="text"][name]');
    if (input) setTimeout(() => input.focus(), 350);
  }

  function showScheduler(nome, telefone, area) {
    const primeiroNome = (nome || '').split(' ')[0];
    const thankyou = form.querySelector('.thankyou');
    const nameEl = thankyou.querySelector('.thankyou__name');
    if (nameEl) nameEl.textContent = primeiroNome;

    wizard.style.opacity = '0';
    wizard.style.transform = 'scale(.98)';

    setTimeout(() => {
      wizard.style.display = 'none';
      thankyou.style.display = 'block';
      requestAnimationFrame(() => {
        thankyou.style.opacity = '1';
        thankyou.style.transform = 'scale(1)';
      });
      loadCalEmbed(nome, telefone, area);
    }, 300);
  }
}

/* --- Cal.com inline embed (lazy) --- */
let calLoaded = false;
function loadCalEmbed(nome, telefone, area) {
  const target = document.getElementById('cal-inline');
  if (!target || calLoaded) return;
  calLoaded = true;

  // Snippet oficial do Cal.com (init)
  (function (C, A, L) {
    let p = function (a, ar) { a.q.push(ar); };
    let d = C.document;
    C.Cal = C.Cal || function () {
      let cal = C.Cal; let ar = arguments;
      if (!cal.loaded) {
        cal.ns = {}; cal.q = cal.q || [];
        d.head.appendChild(d.createElement('script')).src = A;
        cal.loaded = true;
      }
      if (ar[0] === L) {
        const api = function () { p(api, arguments); };
        const namespace = ar[1];
        api.q = api.q || [];
        if (typeof namespace === 'string') {
          cal.ns[namespace] = cal.ns[namespace] || api;
          p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]);
        } else p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, 'https://app.cal.com/embed/embed.js', 'init');

  const notes = [
    telefone ? ('WhatsApp: ' + telefone) : '',
    area ? ('Area de atuacao: ' + area) : ''
  ].filter(Boolean).join(' | ');

  Cal('init', 'diagnostico', { origin: 'https://cal.com' });
  Cal.ns.diagnostico('inline', {
    elementOrSelector: '#cal-inline',
    config: {
      layout: 'month_view',
      name: nome || '',
      notes: notes
    },
    calLink: CAL_LINK
  });
  Cal.ns.diagnostico('ui', {
    theme: 'light',
    cssVarsPerTheme: { light: { 'cal-brand': '#4F46E5' } },
    hideEventTypeDetails: false
  });
}

/* --- Scroll Progress Fallback --- */
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
