/* ============================================
   app.js — FAQ Accordion + Form Wizard
   Pagina: IA Especialista para Alunos
   ============================================ */

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

  // Phone input
  const phoneInput = form.querySelector('input[type="tel"]');
  let iti = null;
  if (phoneInput && window.intlTelInput) {
    iti = window.intlTelInput(phoneInput, {
      initialCountry: 'br',
      preferredCountries: ['br', 'us', 'pt'],
      strictMode: true,
      loadUtilsOnInit: 'https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/utils.js'
    });
  }

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
      if (iti) formData.set('telefone', iti.getNumber());

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
    const textInput = step.querySelector('input[type="text"], input[type="tel"]');
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

    const input = steps[n - 1].querySelector('input[type="text"], input[type="tel"]');
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
