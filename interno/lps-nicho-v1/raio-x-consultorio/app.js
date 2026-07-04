/* =========================================================
   Raio-X do Consultório — interatividade
   Vanilla JS, sem dependências. Reveal, counters, parallax e o quiz.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. Reveal pós-carregamento (hero/dor) ---------- */
  window.addEventListener('load', function () {
    document.body.classList.add('loaded');
  });

  /* ---------- 2. Reveal on scroll para seções abaixo da dobra ---------- */
  var ioTargets = document.querySelectorAll('[data-io]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    ioTargets.forEach(function (t) { io.observe(t); });
  } else {
    ioTargets.forEach(function (t) { t.classList.add('in'); });
  }

  /* ---------- 3. Counters (seção autoridade) ---------- */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-target')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1400, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('.counter');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCounter(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.getAttribute('data-target') + (c.getAttribute('data-suffix') || ''); });
  }

  /* ---------- 4. Glow parallax no bloco CTA final ---------- */
  var ctaBlock = document.getElementById('ctaBlock');
  if (ctaBlock && window.matchMedia('(pointer:fine)').matches) {
    var glow = ctaBlock.querySelector('.cta-glow');
    ctaBlock.addEventListener('mousemove', function (ev) {
      var r = ctaBlock.getBoundingClientRect();
      var mx = ((ev.clientX - r.left) / r.width) * 100;
      var my = ((ev.clientY - r.top) / r.height) * 100;
      if (glow) { glow.style.setProperty('--mx', mx + '%'); glow.style.setProperty('--my', my + '%'); }
    });
  }

  /* ---------- 5. Ano no footer ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* =========================================================
     6. QUIZ
     ========================================================= */
  var WHATS = '5531991618745';
  // URL de agendamento (Cal.com)
  var CALENDLY = 'https://cal.com/victor-viana-wj5ekx/30min';

  var QUESTIONS = [
    { id: 'q1', type: 'single', prompt: 'Em que momento da carreira você está?', opts: [
      { v: 'estudante', t: 'Ainda sou estudante de medicina', terminal: true },
      { v: 'r1', t: 'Estou na residência (R1)', terminal: true },
      { v: 'atende', t: 'Já atendo no meu consultório' },
      { v: 'montando', t: 'Me formei e estou montando meu consultório' },
      { v: 'abrir', t: 'Quero abrir meu consultório em breve' }
    ]},
    { id: 'q2', type: 'single', prompt: 'Qual é a sua área de atuação?', opts: [
      { v: 'dermato', t: 'Dermatologia' }, { v: 'pediatria', t: 'Pediatria' },
      { v: 'gineco', t: 'Ginecologia' }, { v: 'orto', t: 'Ortopedia' },
      { v: 'psiq', t: 'Psiquiatria' }, { v: 'cardio', t: 'Cardiologia' },
      { v: 'clinica', t: 'Clínica geral' }, { v: 'outra', t: 'Outra' }
    ]},
    { id: 'q3', type: 'text', prompt: 'Em qual cidade você atende ou vai atender?', placeholder: 'Cidade / estado' },
    { id: 'q4', type: 'single', prompt: 'Você já tem um site ou página própria do consultório?', opts: [
      { v: 'nada', t: 'Não tenho nada' },
      { v: 'instagram', t: 'Tenho perfil no Instagram, mas site não' },
      { v: 'sitefraco', t: 'Tenho site, mas quase não traz paciente' },
      { v: 'siteok', t: 'Tenho site e funciona bem' }
    ]},
    { id: 'q5', type: 'multi', prompt: 'Como os pacientes te encontram hoje?', hint: 'Pode marcar mais de uma.', opts: [
      { v: 'indicacao', t: 'Indicação boca a boca' }, { v: 'convenio', t: 'Convênio' },
      { v: 'instagram', t: 'Instagram' }, { v: 'google', t: 'Google ou busca' },
      { v: 'quasenao', t: 'Sinceramente, quase não chegam pacientes novos' },
      { v: 'vouabrir', t: 'Ainda não atendo, vou abrir' }
    ]},
    { id: 'q6', type: 'single', prompt: 'Você já investiu em anúncios (Google ou Instagram) pra atrair paciente?', opts: [
      { v: 'nunca', t: 'Nunca investi' }, { v: 'tentou', t: 'Já tentei, mas não deu resultado' },
      { v: 'melhorar', t: 'Invisto hoje e acho que dá pra melhorar' },
      { v: 'bem', t: 'Invisto e está indo bem' }
    ]},
    { id: 'q7', type: 'single', prompt: 'Quantos pacientes novos você recebe por mês hoje?', opts: [
      { v: 'naoatende', t: 'Ainda não atendo', n: 0 }, { v: 'lt5', t: 'Menos de 5', n: 5 },
      { v: '5_15', t: 'Entre 5 e 15', n: 15 }, { v: '15_30', t: 'Entre 15 e 30', n: 30 },
      { v: 'gt30', t: 'Mais de 30', n: 40 }
    ]},
    { id: 'q8', type: 'single', prompt: 'Quantos pacientes novos por mês deixariam sua agenda do jeito que você quer?', opts: [
      { v: 'ate20', t: 'Até 20', n: 20 }, { v: '20_40', t: 'Entre 20 e 40', n: 40 },
      { v: '40_60', t: 'Entre 40 e 60', n: 60 }, { v: 'gt60', t: 'Mais de 60', n: 80 }
    ]},
    { id: 'q9', type: 'single', prompt: 'Você já tem onde atender?', opts: [
      { v: 'proprio', t: 'Tenho consultório próprio' },
      { v: 'compartilhada', t: 'Uso sala compartilhada ou por hora' },
      { v: 'vaimontar', t: 'Ainda vou montar a estrutura' }
    ]},
    { id: 'q10', type: 'single', prompt: 'Quanto você conseguiria investir por mês pra atrair mais pacientes?', opts: [
      { v: 'ate500', t: 'Até R$ 500' }, { v: '500_1500', t: 'Entre R$ 500 e R$ 1.500' },
      { v: '1500_3000', t: 'Entre R$ 1.500 e R$ 3.000' }, { v: 'acima3000', t: 'Acima de R$ 3.000' }
    ]},
    { id: 'q11', type: 'single', prompt: 'Quando você quer começar a resolver isso?', opts: [
      { v: 'agora', t: 'O quanto antes' }, { v: '1_3', t: 'Nos próximos 1 a 3 meses' },
      { v: 'pesquisando', t: 'Só estou pesquisando por enquanto' }
    ]}
  ];

  var TOTAL = QUESTIONS.length;
  var quiz = document.getElementById('quiz');
  var stage = document.getElementById('quizStage');
  var progressFill = document.getElementById('progressFill');
  var closeBtn = document.getElementById('quizClose');
  var lastTrigger = null;
  var answers = {};
  var idx = 0;

  function setProgress(pct) { if (progressFill) progressFill.style.width = pct + '%'; }

  function optByVal(q, v) { for (var i = 0; i < q.opts.length; i++) if (q.opts[i].v === v) return q.opts[i]; return null; }

  /* monta uma tela de pergunta */
  function renderQuestion(i) {
    idx = i;
    var q = QUESTIONS[i];
    setProgress(Math.round((i / TOTAL) * 100));

    var s = document.createElement('div');
    s.className = 'screen in-right';

    var html = '';
    if (i > 0) html += '<button class="q-back" type="button">&larr; voltar</button>';
    html += '<span class="q-label">Pergunta ' + (i + 1) + ' de ' + TOTAL + '</span>';
    html += '<h2 class="q-prompt">' + q.prompt + '</h2>';
    if (q.hint) html += '<span class="result-gauge-meta" style="display:block;margin:-14px 0 16px">' + q.hint + '</span>';

    if (q.type === 'text') {
      html += '<input class="q-input" type="text" placeholder="' + (q.placeholder || '') + '" value="' + (answers[q.id] || '') + '" />';
      html += '<button class="btn btn-grad btn-lg q-continue" type="button" disabled>Continuar</button>';
    } else {
      html += '<div class="opts">';
      q.opts.forEach(function (o) {
        var sel = '';
        if (q.type === 'multi') { sel = (answers[q.id] || []).indexOf(o.v) > -1 ? ' sel' : ''; }
        else { sel = answers[q.id] === o.v ? ' sel' : ''; }
        html += '<button class="opt' + sel + '" type="button" data-v="' + o.v + '"><span>' + o.t + '</span><span class="tick"></span></button>';
      });
      html += '</div>';
      if (q.type === 'multi') html += '<button class="btn btn-grad btn-lg q-continue" type="button">Continuar</button>';
    }

    s.innerHTML = html;
    swapScreen(s);

    // back
    var back = s.querySelector('.q-back');
    if (back) back.addEventListener('click', function () { renderQuestion(i - 1); });

    // text input
    if (q.type === 'text') {
      var input = s.querySelector('.q-input');
      var cont = s.querySelector('.q-continue');
      function check() { cont.disabled = input.value.trim().length < 2; }
      check();
      input.addEventListener('input', function () { answers[q.id] = input.value.trim(); check(); });
      cont.addEventListener('click', function () { next(i); });
      setTimeout(function () { input.focus(); }, 60);
    }

    // single / multi
    var optEls = s.querySelectorAll('.opt');
    optEls.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.getAttribute('data-v');
        if (q.type === 'multi') {
          var arr = answers[q.id] || [];
          var pos = arr.indexOf(v);
          if (pos > -1) { arr.splice(pos, 1); btn.classList.remove('sel'); }
          else { arr.push(v); btn.classList.add('sel'); }
          answers[q.id] = arr;
        } else {
          answers[q.id] = v;
          optEls.forEach(function (e) { e.classList.remove('sel'); });
          btn.classList.add('sel');
          // ramificação: P1 terminal => Final B
          var chosen = optByVal(q, v);
          if (chosen && chosen.terminal) { setTimeout(renderInteresse, 240); return; }
          setTimeout(function () { next(i); }, 240);
        }
      });
    });

    var cont2 = (q.type === 'multi') ? s.querySelector('.q-continue') : null;
    if (cont2) cont2.addEventListener('click', function () { next(i); });

    if (q.type !== 'text') {
      var first = s.querySelector('.opt'); if (first) setTimeout(function () { first.focus(); }, 60);
    }
  }

  function next(i) {
    if (i + 1 < TOTAL) renderQuestion(i + 1);
    else showFinalA();
  }

  function swapScreen(newScreen) {
    var prev = stage.querySelector('.screen, .result-card');
    if (prev) {
      prev.classList.add('out-left');
      setTimeout(function () { if (prev.parentNode) prev.parentNode.removeChild(prev); }, 320);
    }
    stage.appendChild(newScreen);
  }

  /* ---------- cálculo do resultado ---------- */
  function compute() {
    var q7 = optByVal(QUESTIONS[6], answers.q7) || { n: 0, t: '' };
    var q8 = optByVal(QUESTIONS[7], answers.q8) || { n: 0, t: '' };
    var vaiAbrir = answers.q1 === 'abrir' || answers.q7 === 'naoatende';
    var gap = Math.max(0, q8.n - q7.n);
    var pct = vaiAbrir ? 0 : (q8.n > 0 ? Math.min(100, Math.round((q7.n / q8.n) * 100)) : 0);
    return { q7: q7, q8: q8, vaiAbrir: vaiAbrir, gap: gap, pct: pct };
  }

  function buildDiag() {
    var d = [];
    if (answers.q4 === 'nada' || answers.q4 === 'instagram') {
      d.push('Quando um paciente te procura no Google hoje, ele não te encontra. Essa é a maior fonte de pacientes que você está deixando na mesa.');
    }
    var q5 = answers.q5 || [];
    if (q5.indexOf('quasenao') > -1 || q5.indexOf('vouabrir') > -1 || answers.q1 === 'abrir') {
      d.push('Sua captação depende de indicação, e indicação não escala. Você precisa de um canal que traga paciente de forma previsível.');
    }
    if (answers.q6 === 'tentou') {
      d.push('Anúncio para médico tem regra do CFM e exige segmentação certa. Mal configurado, queima verba. Bem feito, é o canal mais previsível que existe.');
    }
    if (!d.length) d.push('Dá pra deixar sua captação de pacientes muito mais previsível com a estrutura certa.');
    return d;
  }

  function buildRec() {
    if (answers.q4 === 'nada' || answers.q4 === 'instagram') return 'um site de conversão com presença no Google local';
    if (answers.q6 === 'nunca' || answers.q6 === 'tentou') return 'estruturar o tráfego para captação previsível';
    return 'revisar e escalar a campanha dentro das regras do CFM';
  }

  function showFinalA() {
    setProgress(100);
    var c = compute();
    var gapText;
    if (c.vaiAbrir) {
      gapText = 'Você quer abrir e já mira <b>' + c.q8.t.toLowerCase() + '</b> pacientes novos por mês. Sem captação montada, esse número não chega sozinho. Dá pra começar com isso resolvido desde o primeiro dia.';
    } else {
      gapText = 'Hoje você recebe <b>' + c.q7.t.toLowerCase() + '</b> pacientes novos por mês. Sua meta é <b>' + c.q8.t.toLowerCase() + '</b>. A diferença é de até <span class="big">' + c.gap + '</span> pacientes por mês que seu consultório poderia atender e não atende.';
    }
    var diag = buildDiag();
    var rec = buildRec();
    var waText = encodeURIComponent('Oi, acabei de fazer o Raio-X do Consultório e quero entender como destravar minha captação de pacientes.');

    var card = document.createElement('div');
    card.className = 'result-card';
    card.setAttribute('role', 'document');
    var diagHtml = diag.map(function (t) { return '<li>' + t + '</li>'; }).join('');
    card.innerHTML =
      '<div class="result-head">Seu Raio-X está pronto</div>' +
      '<div class="result-body">' +
        '<p class="result-gap">' + gapText + '</p>' +
        '<div class="result-gauge"><i id="resGauge"></i></div>' +
        '<div class="result-gauge-meta">' + (c.vaiAbrir ? 'captação ainda não montada' : c.pct + '% do seu potencial sendo usado') + '</div>' +
        '<ul class="result-diag">' + diagHtml + '</ul>' +
        '<p class="result-rec">Com base nas suas respostas, o primeiro passo pra você é <b>' + rec + '</b>.</p>' +
        '<a class="btn btn-grad btn-lg result-cta" href="https://wa.me/' + WHATS + '?text=' + waText + '" target="_blank" rel="noopener">Quero conversar sobre como destravar isso</a>' +
        '<a class="result-alt" href="' + CALENDLY + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> Agendar um horário online</a>' +
        '<p class="result-micro">Conversa direta, sem custo. A gente mostra o plano e você decide.</p>' +
      '</div>';
    swapScreen(card);
    setTimeout(function () {
      var g = document.getElementById('resGauge');
      if (g) g.style.width = (c.vaiAbrir ? 4 : Math.max(c.pct, 3)) + '%';
    }, 80);
    fireConfetti();
  }

  // estudante/R1: antes de descartar, pergunta se há interesse em ter consultório
  function renderInteresse() {
    setProgress(70);
    var s = document.createElement('div');
    s.className = 'screen in-right';
    s.innerHTML =
      '<span class="q-label">Quase lá</span>' +
      '<h2 class="q-prompt">Mesmo na formação, você pretende montar seu próprio consultório?</h2>' +
      '<div class="opts">' +
        '<button class="opt" data-i="agora"><span>Sim, quero começar a planejar agora</span><span class="tick"></span></button>' +
        '<button class="opt" data-i="futuro"><span>Sim, mas mais pra frente</span><span class="tick"></span></button>' +
        '<button class="opt" data-i="nao"><span>Não, quero seguir em hospital ou academia</span><span class="tick"></span></button>' +
      '</div>';
    swapScreen(s);
    var optEls = s.querySelectorAll('.opt');
    optEls.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = btn.getAttribute('data-i');
        optEls.forEach(function (e) { e.classList.remove('sel'); });
        btn.classList.add('sel');
        answers.interesse = i;
        if (i === 'nao') { setTimeout(showFinalB, 240); }
        else { setTimeout(function () { showFinalC(i); }, 240); }
      });
    });
    var first = s.querySelector('.opt'); if (first) setTimeout(function () { first.focus(); }, 60);
  }

  // Final C — residente/formando COM interesse: caminho de planejamento (não descarte)
  function showFinalC(quando) {
    setProgress(100);
    var sub = (quando === 'agora')
      ? 'Quem chega formado já com presença no Google e captação montada larga na frente. Dá pra começar a construir isso agora, pra você abrir já recebendo paciente, não do zero.'
      : 'Quando chegar a hora de montar o consultório, a captação pode já estar pronta. A gente fica no seu radar e, quando fizer sentido, planeja tudo junto com você.';
    var waText = encodeURIComponent('Oi! Ainda estou na formação, mas tenho interesse em planejar a captação de pacientes pro meu futuro consultório.');
    var card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML =
      '<div class="result-head">Boa, dá pra já começar a construir isso</div>' +
      '<div class="result-body">' +
        '<p class="result-gap">Você ainda está na formação, então captar paciente não é a urgência de hoje. ' + sub + '</p>' +
        '<a class="btn btn-grad btn-lg result-cta" href="https://wa.me/' + WHATS + '?text=' + waText + '" target="_blank" rel="noopener">Quero planejar meu consultório</a>' +
        '<a class="result-alt" href="' + CALENDLY + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> Agendar uma conversa</a>' +
        '<p class="result-micro">Sem custo e sem compromisso. É só um papo pra te orientar.</p>' +
      '</div>';
    swapScreen(card);
  }

  function showFinalB() {
    setProgress(100);
    var card = document.createElement('div');
    card.className = 'result-card soft';
    card.innerHTML =
      '<div class="result-head">Esse ainda não é o seu momento, e tudo bem</div>' +
      '<div class="result-body">' +
        '<p>O Raio-X do Consultório foi feito pra quem já atende ou está abrindo consultório. Como você ainda está na formação, captar paciente não é a sua prioridade agora. Focar nos estudos é.</p>' +
        '<p>Quando chegar a hora de montar seu consultório, a gente vai estar aqui. Por enquanto, segue firme nos estudos com a MEDSimple.</p>' +
        '<a class="btn btn-primary btn-lg result-cta" href="https://medsimple.com.br" target="_blank" rel="noopener">Conhecer a MEDSimple</a>' +
      '</div>';
    swapScreen(card);
  }

  /* ---------- abrir / fechar ---------- */
  function openQuiz(trigger) {
    lastTrigger = trigger || null;
    answers = {}; idx = 0;
    stage.innerHTML = '';
    quiz.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { quiz.classList.add('open'); });
    renderQuestion(0);
    if (closeBtn) closeBtn.focus();
  }
  function closeQuiz() {
    quiz.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { quiz.hidden = true; stage.innerHTML = ''; }, 280);
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }

  // disparadores: qualquer link para #quiz ou [data-open-quiz]
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[href="#quiz"], [data-open-quiz]');
    if (a) { ev.preventDefault(); openQuiz(a); }
  });
  if (closeBtn) closeBtn.addEventListener('click', closeQuiz);
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && quiz && !quiz.hidden) closeQuiz();
  });

  /* ---------- 7. Confete (Final A) ---------- */
  function fireConfetti() {
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    var canvas = document.getElementById('confetti');
    if (!canvas) { canvas = document.createElement('canvas'); canvas.id = 'confetti'; document.body.appendChild(canvas); }
    var ctx = canvas.getContext('2d');
    var W = canvas.width = window.innerWidth;
    var H = canvas.height = window.innerHeight;
    var colors = ['#4f5bd5', '#7c5cff', '#a9b0ff', '#ffffff'];
    var parts = [];
    for (var i = 0; i < 90; i++) {
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * 120,
        y: H * 0.32,
        vx: (Math.random() - 0.5) * 9,
        vy: Math.random() * -9 - 3,
        s: Math.random() * 6 + 4,
        c: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3
      });
    }
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var t = ts - start;
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.vy += 0.32; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - t / 1500);
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      });
      if (t < 1500) requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, W, H); }
    }
    requestAnimationFrame(frame);
  }

})();
