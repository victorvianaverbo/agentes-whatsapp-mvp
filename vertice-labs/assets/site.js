/* ============================================================
   VÉRTICE — shared site behaviour (vanilla, no libs)
   Every block guards on element presence so one file serves all pages.
   ============================================================ */
(function(){
  "use strict";

  /* ---- Supabase (anon key: pública por design; RLS permite só INSERT) ---- */
  var SUPA_URL="https://ltzcxvbfywkzgwijvpre.supabase.co";
  var SUPA_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0emN4dmJmeXdremd3aWp2cHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMzQwMjMsImV4cCI6MjA5MjgxMDAyM30.a5E2Zi1Qe3KKx_R4jPtMCmOVXSCl-oXmnE8VwmFGd0E";

  /* ---- Cal.com: link padrão (override por página via body[data-cal] ou form[data-cal]) ---- */
  var CAL_DEFAULT="victor-viana-wj5ekx/vertice-labs-diagnostico";
  function resolveCalLink(el){
    return (el&&el.getAttribute('data-cal'))||document.body.getAttribute('data-cal')||CAL_DEFAULT;
  }

  /* ---- Cal.com: agendamento inline reutilizável (lazy, 1x por página) ---- */
  var _calBooted=false;
  window.VerticeBookCal=function(calLink, prefill, mountSel){
    var mount=document.querySelector(mountSel);
    if(!mount||_calBooted) return;
    _calBooted=true;
    (function(C,A,L){var p=function(a,ar){a.q.push(ar);};var d=C.document;C.Cal=C.Cal||function(){var cal=C.Cal;var ar=arguments;if(!cal.loaded){cal.ns={};cal.q=cal.q||[];d.head.appendChild(d.createElement('script')).src=A;cal.loaded=true;}if(ar[0]===L){var api=function(){p(api,arguments);};var ns=ar[1];api.q=api.q||[];if(typeof ns==='string'){cal.ns[ns]=cal.ns[ns]||api;p(cal.ns[ns],ar);p(cal,['initNamespace',ns]);}else p(cal,ar);return;}p(cal,ar);};})(window,'https://app.cal.com/embed/embed.js','init');
    Cal('init','diag',{origin:'https://cal.com'});
    Cal.ns.diag('inline',{
      elementOrSelector:mountSel,
      config:{layout:'month_view',name:(prefill&&prefill.name)||'',notes:(prefill&&prefill.notes)||''},
      calLink:calLink
    });
    Cal.ns.diag('ui',{theme:'light',cssVarsPerTheme:{light:{'cal-brand':'#5BA300'}},hideEventTypeDetails:false});
  };

  /* ---- post-load flag (animation only after load) ---- */
  window.addEventListener('load',function(){
    requestAnimationFrame(function(){document.body.classList.add('loaded');});
  });

  /* ---- header scroll state ---- */
  var hdr=document.getElementById('hdr');
  if(hdr){
    var onScroll=function(){hdr.classList.toggle('scrolled',window.scrollY>12);};
    onScroll();window.addEventListener('scroll',onScroll,{passive:true});
  }

  /* ---- mobile menu ---- */
  var burger=document.querySelector('.burger');
  var mobnav=document.querySelector('.mobnav');
  if(burger&&mobnav){
    burger.addEventListener('click',function(){mobnav.classList.add('open');document.body.style.overflow='hidden';});
    mobnav.querySelectorAll('[data-close], a').forEach(function(el){
      el.addEventListener('click',function(){mobnav.classList.remove('open');document.body.style.overflow='';});
    });
  }

  /* ---- reveal on scroll ---- */
  var revs=document.querySelectorAll('[data-reveal]');
  if(revs.length){
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
      },{threshold:0.14,rootMargin:'0px 0px -8% 0px'});
      revs.forEach(function(el){io.observe(el);});
    }else{revs.forEach(function(el){el.classList.add('in');});}
  }

  /* ---- hero chat: typing -> AI reply (post-load) ---- */
  window.addEventListener('load',function(){
    var t=document.getElementById('typing'),a=document.getElementById('aibubble');
    if(t&&a){
      setTimeout(function(){t.style.display='none';a.style.display='block';a.style.animation='fadeUp .4s ease';},2200);
    }
  });

  /* ---- counters ---- */
  function animateCount(el){
    var to=parseFloat(el.getAttribute('data-to'));
    var dec=parseInt(el.getAttribute('data-dec'))||0;
    var start=null,dur=1400;
    function ease(t){return 1-Math.pow(1-t,3);}
    function frame(ts){
      if(!start)start=ts;
      var p=Math.min((ts-start)/dur,1);
      var val=to*ease(p);
      el.textContent=val.toFixed(dec).replace('.',',');
      if(p<1)requestAnimationFrame(frame);else el.textContent=to.toFixed(dec).replace('.',',');
    }
    requestAnimationFrame(frame);
  }
  var counters=document.querySelectorAll('.count');
  if(counters.length){
    if('IntersectionObserver' in window){
      var cio=new IntersectionObserver(function(entries){
        entries.forEach(function(e){if(e.isIntersecting){animateCount(e.target);cio.unobserve(e.target);}});
      },{threshold:0.4});
      counters.forEach(function(c){cio.observe(c);});
    }else{counters.forEach(animateCount);}
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-item').forEach(function(item){
    var q=item.querySelector('.faq-q'),a=item.querySelector('.faq-a');
    if(!q||!a)return;
    q.addEventListener('click',function(){
      var open=item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function(o){
        o.classList.remove('open');o.querySelector('.faq-a').style.maxHeight=null;
      });
      if(!open){item.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';}
    });
  });

  /* ---- option selected styling ---- */
  document.querySelectorAll('.opts').forEach(function(group){
    group.addEventListener('change',function(){
      group.querySelectorAll('.opt').forEach(function(o){
        o.classList.toggle('sel',o.querySelector('input').checked);
      });
    });
  });

  /* ---- máscara de WhatsApp (formato BR quando DDI = 55) ---- */
  (function(){
    var whats=document.getElementById('whats'), ddiEl=document.getElementById('ddi');
    if(!whats) return;
    function maskBR(v){
      var d=v.replace(/\D/g,'').slice(0,11);
      if(!d) return '';
      if(d.length<=2) return '('+d;
      if(d.length<=6) return '('+d.slice(0,2)+') '+d.slice(2);
      if(d.length<=10) return '('+d.slice(0,2)+') '+d.slice(2,6)+'-'+d.slice(6);
      return '('+d.slice(0,2)+') '+d.slice(2,7)+'-'+d.slice(7);
    }
    function apply(){ if(!ddiEl||ddiEl.value==='55') whats.value=maskBR(whats.value); }
    whats.addEventListener('input',apply);
    if(ddiEl) ddiEl.addEventListener('change',function(){
      whats.placeholder = ddiEl.value==='55' ? '(DDD) 00000-0000' : 'número com DDD';
      apply();
    });
  })();

  /* ---- multi-step diagnostic form ---- */
  var form=document.getElementById('diagForm');
  if(form){
    var step=1,maxStep=3;
    var steps=form.querySelectorAll('.fstep');
    var inds=form.querySelectorAll('.steps-ind i');
    var btnNext=form.querySelector('#btnNext');
    var btnBack=form.querySelector('#btnBack');
    var formDone=form.querySelector('#formDone');
    var formNav=form.querySelector('#formNav');
    var lastLabel=btnNext?btnNext.getAttribute('data-last')||'Quero meu diagnóstico':'';

    function showStep(n){
      steps.forEach(function(s){s.classList.toggle('show',parseInt(s.getAttribute('data-step'))===n);});
      inds.forEach(function(i,idx){i.classList.toggle('on',idx<n);});
      btnBack.style.display=n>1?'flex':'none';
      btnNext.innerHTML=(n===maxStep?lastLabel:'Continuar')+' <span class="arr">→</span>';
    }
    function clearErr(){form.querySelectorAll('.ferr').forEach(function(e){e.textContent='';});}
    function validate(n){
      clearErr();
      var err=form.querySelector('.ferr[data-err="'+n+'"]');
      if(n===1){
        var segEl=form.querySelector('#segmento');
        if(segEl){ if(segEl.value.trim().length<2){err.textContent='Conte sua área de atuação para continuar.';return false;} }
        else if(!form.querySelector('input[name=segmento]:checked')){err.textContent='Selecione uma opção para continuar.';return false;}
      }
      if(n===2&&!form.querySelector('input[name=gargalo]:checked')){err.textContent='Selecione uma opção para continuar.';return false;}
      if(n===3){
        var nome=form.querySelector('#nome').value.trim();
        var ddi=(form.querySelector('#ddi')||{}).value||'55';
        var digits=((form.querySelector('#whats')||{}).value||'').replace(/\D/g,'');
        if(nome.length<2){err.textContent='Informe seu nome.';return false;}
        if(ddi==='55'){ if(digits.length<10||digits.length>11){err.textContent='Informe um WhatsApp válido com DDD.';return false;} }
        else if(digits.length<8){err.textContent='Informe um WhatsApp válido.';return false;}
      }
      return true;
    }
    btnNext.addEventListener('click',function(){
      if(!validate(step))return;
      if(step<maxStep){step++;showStep(step);}
      else{
        var g=function(sel){var el=form.querySelector(sel);return el?el.value.trim():'';};
        var r=function(name){var el=form.querySelector('input[name='+name+']:checked');return el?el.value:'';};
        var payload={
          nome:g('#nome'),
          contato:'+'+((form.querySelector('#ddi')||{}).value||'55')+' '+g('#whats'),
          segmento:form.querySelector('#segmento')?g('#segmento'):r('segmento'),
          qualificacao:r('gargalo'),
          origem:(location.pathname.split('/').pop()||'index.html').replace('.html','')
        };
        try{
          fetch(SUPA_URL+'/rest/v1/leads',{
            method:'POST',
            headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},
            body:JSON.stringify(payload)
          });
        }catch(e){}
        // Google Ads — conversão (1 por lead enviado)
        if(typeof gtag==='function'){
          gtag('event','conversion',{send_to:'AW-18203621875/QywZCNOoirccEPPzlOhD',value:1.0,currency:'BRL'});
        }
        steps.forEach(function(s){s.classList.remove('show');});
        formNav.style.display='none';
        inds.forEach(function(i){i.classList.add('on');});
        formDone.classList.add('show');

        // Atualiza a copy do estado final para agendamento
        var doneH=formDone.querySelector('h3'), doneP=formDone.querySelector('p');
        if(doneH) doneH.textContent='Quase lá, '+(payload.nome.split(' ')[0]||'')+'!';
        if(doneP) doneP.textContent='Escolha o melhor dia e horário para o seu diagnóstico gratuito.';

        // Injeta o container e carrega a agenda do Cal.com
        if(!formDone.querySelector('#calBook')){
          var cb=document.createElement('div');
          cb.id='calBook'; cb.className='cal-book';
          formDone.appendChild(cb);
        }
        var notes='Contato: '+payload.contato+' | Área: '+payload.segmento+' | Gargalo: '+payload.qualificacao+' | Origem: '+payload.origem;
        window.VerticeBookCal(resolveCalLink(form), {name:payload.nome, notes:notes}, '#calBook');
      }
    });
    btnBack.addEventListener('click',function(){if(step>1){step--;showStep(step);}});
  }
})();
