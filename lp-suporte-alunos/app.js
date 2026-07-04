/* ============================================
   app.js — FAQ Accordion + Form Wizard
   Pagina: IA Especialista para Alunos
   ============================================ */

// Supabase (anon key publica, RLS controla INSERT)
const SUPABASE_URL = 'https://ltzcxvbfywkzgwijvpre.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0emN4dmJmeXdremd3aWp2cHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMzQwMjMsImV4cCI6MjA5MjgxMDAyM30.a5E2Zi1Qe3KKx_R4jPtMCmOVXSCl-oXmnE8VwmFGd0E';

// Tabela por LP - detecta pelo path (cobre rewrite /operacao tambem)
function supabaseTable() {
  return /operacao/i.test(location.pathname) ? 'lead_kairos_operacao' : 'lead_kairos_suporte';
}

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

      // Close all
      items.forEach(it => {
        it.classList.remove('is-open');
        it.querySelector('.faq-item__trigger').setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked
      if (!wasOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* --- Form Wizard (typeform-style) --- */
function initFormWizard() {
  const form = document.getElementById('form-aplicacao');
  if (!form) return;

  const wizard = form.querySelector('.wizard');
  const bar = form.querySelector('.wizard__bar');
  const steps = form.querySelectorAll('.wizard__step');
  const totalSteps = steps.length;
  let currentStep = 1;

  // Phone input - ja foi inicializado pelo script.js (initPhoneInput), com strictMode.
  // NAO inicializar de novo aqui - causava dupla instancia que travava input.value na validacao.
  const phoneInput = form.querySelector('input[type="tel"]');

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
      // Le do _iti em runtime (foi populado pelo lazy load se chegou depois)
      const itiInstance = phoneInput && phoneInput._iti;
      if (itiInstance) formData.set('telefone', itiInstance.getNumber());

      // Gera event_id unico pra deduplicacao Pixel + CAPI
      const eventId = 'lead_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
      const nome = formData.get('nome') || '';
      const telefone = formData.get('telefone') || '';
      const lp = (window.location.pathname.match(/lp-[a-z0-9-]+/i) || ['kairos'])[0];

      // Meta Pixel client-side (Lead com event_id)
      if (typeof fbq === 'function') {
        fbq('track', 'Lead', {}, { eventID: eventId });
      }

      // GTM dataLayer (se houver)
      if (typeof dataLayer !== 'undefined') {
        dataLayer.push({ event: 'generate_lead', form_name: form.getAttribute('name'), event_id: eventId });
      }

      // Meta CAPI server-side (fire-and-forget, nao bloqueia o redirect)
      fetch('/api/capi-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, phone: telefone, lp, event_id: eventId })
      }).catch(() => {}); // erro de CAPI nao impede o submit

      // Supabase - persistir lead na tabela (fire-and-forget, mas com log)
      const supaTable = supabaseTable();
      fetch(`${SUPABASE_URL}/rest/v1/${supaTable}`, {
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
          curso: formData.get('curso') || '',
          alunos: formData.get('alunos') || '',
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          page_url: location.href
        })
      })
      .then(r => { if (!r.ok) console.error('[supabase] HTTP', r.status, supaTable); })
      .catch(e => console.error('[supabase] fetch error', supaTable, e));

      // Submit pro Netlify Forms
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });

      showThankYou();
    } catch {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar aplicacao';
    }
  });

  function validateCurrentStep() {
    const step = steps[currentStep - 1];
    // Importante: filtrar por [name] para nao pegar inputs internos do intl-tel-input
    // (search do dropdown de paises, etc, que sao injetados sem name).
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

  function showThankYou() {
    const nome = (form.querySelector('input[name="nome"]').value || '').split(' ')[0];
    const thankyou = form.querySelector('.thankyou');
    const nameEl = thankyou.querySelector('.thankyou__name');

    if (nameEl) nameEl.textContent = nome;

    wizard.style.opacity = '0';
    wizard.style.transform = 'scale(.98)';

    setTimeout(() => {
      wizard.style.display = 'none';
      thankyou.style.display = 'block';
      requestAnimationFrame(() => {
        thankyou.style.opacity = '1';
        thankyou.style.transform = 'scale(1)';
      });
    }, 300);
  }
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
