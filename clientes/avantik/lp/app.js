/* Victor Viana × Avantik — interações da página */

document.addEventListener('DOMContentLoaded', function () {
  // AOS (Animate On Scroll)
  if (window.AOS) {
    AOS.init({ duration: 600, easing: 'ease-out', once: true, offset: 60 });
  }

  // Ano no footer
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // FAQ accordion (um item aberto por vez)
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var trigger = item.querySelector('.faq-item__trigger');
    if (!trigger) return;
    trigger.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        var t = other.querySelector('.faq-item__trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
});
