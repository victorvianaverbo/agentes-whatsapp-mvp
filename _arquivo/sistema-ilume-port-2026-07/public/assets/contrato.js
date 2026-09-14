/* Página do contrato: busca o JSON via API, preenche o template e
   cuida da assinatura eletrônica do CONTRATANTE (cliente). */
(function () {
  "use strict";
  var U = window.IlumeUtil;
  var $ = function (id) { return document.getElementById(id); };

  var id = new URLSearchParams(location.search).get("id") || "";
  var contrato = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function qtd(n, singular, plural) {
    n = Number(n) || 0;
    return n + " (" + U.extensoNumero(n) + ") " + (n === 1 ? singular : plural);
  }

  function mostrarErro() {
    $("estadoCarregando").hidden = true;
    $("estadoErro").hidden = false;
  }

  if (!id) { mostrarErro(); return; }

  fetch("/api/contratos/" + encodeURIComponent(id), { headers: authHeader() })
    .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then(function (c) { contrato = c; render(c); })
    .catch(mostrarErro);

  // Se o painel admin abriu este link (preview de rascunho), reaproveita a senha da sessão
  function authHeader() {
    try {
      var s = sessionStorage.getItem("ilume_admin_senha");
      return s ? { Authorization: "Bearer " + s } : {};
    } catch (e) { return {}; }
  }

  /* ================================ RENDER ================================ */
  function render(c) {
    var f = c.financeiro || {}, s = c.servico || {}, p = c.proposta || {}, ct = c.contratante || {};
    var recorrente = c.tipo === "recorrente";
    var valorTotal = Number(f.valorTotal) || 0;
    var qtdParcelas = Number(f.qtdParcelas) || (recorrente ? Number(s.meses) || 1 : 1);
    var valorParcela = recorrente ? valorTotal / qtdParcelas : valorTotal;

    document.title = "Proposta & Contrato · " + (ct.nomeExibicao || ct.razaoSocial || "") + " · ILUME FILMES";

    // remove o grupo de cláusulas do outro tipo (removido do DOM, não escondido — o print sai limpo)
    document.querySelectorAll("[data-tipo]").forEach(function (el) {
      if (el.getAttribute("data-tipo") !== c.tipo) el.remove();
    });

    // condicionais
    var cond = {
      temGravacao: !!s.dataGravacao,
      temObjeto: Array.isArray(s.descricaoObjeto) && s.descricaoObjeto.length > 0,
      temCortes: Number(s.qtdCortes) > 0,
      temVideos: Number(s.qtdVideos) > 0,
      semVideos: !(Number(s.qtdVideos) > 0)
    };
    document.querySelectorAll("[data-se]").forEach(function (el) {
      if (!cond[el.getAttribute("data-se")]) el.remove();
    });

    // ---- campos simples ----
    var campos = {
      numero: c.numero,
      emissao: U.dataCurta(c.criadoEm),
      validade: p.validaDias ? "Válida por " + p.validaDias + " dias" : "",
      clienteNome: ct.nomeExibicao || ct.razaoSocial || "—",
      clienteRazao: ct.razaoSocial || "—",
      clienteDoc: U.formatarDoc(ct.cnpjCpf),
      propostaTitulo: p.titulo || "Proposta de produção audiovisual",
      propostaLead: p.lead || "",
      valorTotalFmt: U.moeda(valorTotal),
      valorTotalExtenso: U.extensoReais(valorTotal),
      valorParcelaFmt: U.moeda(valorParcela),
      valorParcelaExtenso: U.extensoReais(valorParcela),
      qtdParcelasTxt: qtdParcelas + " (" + U.extensoNumero(qtdParcelas) + ")",
      diaVencimento: String(f.diaVencimento || s.diaVencimento || "—"),
      dataGravacao: s.dataGravacao || "",
      localGravacao: s.localGravacao || "",
      qtdVideosTxt: qtd(s.qtdVideos, "vídeo editado", "vídeos editados"),
      qtdCortesTxt: qtd(s.qtdCortes, "corte", "cortes"),
      mesesTxt: qtd(s.meses, "mês", "meses"),
      videosMesTxt: qtd(s.videosMes, "vídeo", "vídeos"),
      horasMensaisTxt: qtd(s.horasMensais, "hora", "horas"),
      prazoEntregaDiasTxt: qtd(s.prazoEntregaDias, "dia", "dias"),
      prazoEntregaTxt: qtd(s.prazoEntregaDias, "dia útil", "dias úteis"),
      vigenciaTxt: qtd(s.meses, "mês", "meses") + (s.videosMes ? ", ou " + qtd(s.meses, "ciclo", "ciclos") + " de " + (Number(s.videosMes) || 0) + " vídeos dentro desse período" : ""),
      horaExcedenteTxt: horaExcedenteTexto(s),
      contatoContratante: contatoContratante(ct),
      dataAssinaturaLonga: U.dataLonga((c.assinaturas.contratante && c.assinaturas.contratante.assinadoEm) || c.enviadoEm || c.criadoEm),
      investimentoCurto: recorrente ? U.moeda(valorParcela).replace(",00", "") + "/mês" : U.moeda(valorTotal).replace(",00", ""),
      pagamentoCurto: recorrente ? qtdParcelas + "× mensais" : resumoParcelas(f),
      metaPrazoLabel: recorrente ? "Volume mensal" : "Prazo de entrega",
      metaPrazo: recorrente
        ? (Number(s.videosMes) || 0) + " vídeos/mês"
        : (s.prazoEntregaDias ? s.prazoEntregaDias + " dias úteis" : "A combinar"),
      investLabel: recorrente ? "Assinatura mensal de vídeos" : "Produção audiovisual"
    };
    document.querySelectorAll("[data-campo]").forEach(function (el) {
      var v = campos[el.getAttribute("data-campo")];
      if (v !== undefined) el.textContent = v;
    });

    // qualificação do contratante (com negrito no papel)
    var pj = String(ct.cnpjCpf || "").replace(/\D/g, "").length === 14;
    document.querySelectorAll('[data-campo="contratanteQualificacao"]').forEach(function (el) {
      el.innerHTML = esc(ct.razaoSocial) +
        (pj ? ", pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº " : ", inscrita no CPF sob o nº ") +
        esc(U.formatarDoc(ct.cnpjCpf)) +
        (ct.endereco ? ", com sede na " + esc(ct.endereco) : "") +
        (ct.cidadeUf ? ", " + esc(ct.cidadeUf) : "") +
        (ct.cep ? ", CEP " + esc(ct.cep) : "") +
        " (doravante <b>CONTRATANTE</b>).";
    });

    // ---- proposta: blocos de entregáveis ----
    var blocos = Array.isArray(p.blocos) ? p.blocos : [];
    $("blocosProposta").innerHTML = blocos.map(function (b, i) {
      var itens = (b.itens || []).map(function (it) { return "<li>" + esc(it) + "</li>"; }).join("");
      return '<div class="block"><div class="bh"><span class="bn">' + (i + 1) + '</span><span class="bt">' +
        esc(b.titulo) + "</span></div><ul>" + itens + "</ul></div>";
    }).join("");
    if (!blocos.length) $("secBlocos").remove();

    // ---- investimento: termos ----
    var termos = recorrente
      ? [["Valor mensal", U.moeda(valorParcela)],
         ["Vigência", qtd(s.meses, "mês", "meses")],
         ["Vencimento", "todo dia " + (f.diaVencimento || s.diaVencimento || "—")]]
      : [["Forma de pagamento", resumoParcelasLongo(f)],
         ["Prazo de entrega", s.prazoEntregaDias ? s.prazoEntregaDias + " dias úteis" : "A combinar"]]
          .concat(s.dataGravacao ? [["Data da gravação", s.dataGravacao]] : []);
    $("investTerms").innerHTML = termos.map(function (t) {
      return '<div><span class="tl">' + esc(t[0]) + "</span><b>" + esc(t[1]) + "</b></div>";
    }).join("");

    // ---- próximos passos ----
    var passos = recorrente
      ? [["Aprovação", "Você confirma a proposta e assina o contrato."],
         ["1ª parcela", "Primeira mensalidade paga na assinatura."],
         ["Agendamento", "Gravações agendadas mês a mês, conforme o contrato."],
         ["Entregas", "Vídeos entregues em até " + (s.prazoEntregaDias || "—") + " dias após cada gravação."]]
      : [["Aprovação", "Você confirma a proposta e assina o contrato."],
         ["Sinal", "Primeiro pagamento conforme a cláusula 3ª."],
         ["Gravação", s.dataGravacao ? "Captação em " + s.dataGravacao + "." : "Captação na data combinada."],
         ["Entrega", "Vídeos prontos em até " + (s.prazoEntregaDias || "—") + " dias úteis."]];
    $("passos").innerHTML = passos.map(function (pss, i) {
      return '<div class="step"><div class="n">' + (i + 1) + '</div><div class="st">' + esc(pss[0]) + "</div><p>" + esc(pss[1]) + "</p></div>";
    }).join("");

    // ---- cláusula 1ª pontual: lista do objeto ----
    if (!recorrente) {
      var lista = $("listaObjetoPontual");
      if (lista) lista.innerHTML = (s.descricaoObjeto || []).map(function (it) { return "<li>" + esc(it) + "</li>"; }).join("");
      var parcelas = parcelasPontual(f, valorTotal);
      $("listaParcelasPontual").innerHTML = parcelas.map(function (pc) {
        return "<li><b>" + pc.pct + "% (" + U.moeda(pc.valor) + ")</b> " + esc(pc.gatilho) + ";</li>";
      }).join("");
      $("payParcelasPontual").innerHTML = parcelas.map(function (pc) {
        return "• <b>" + pc.pct + "% (" + U.moeda(pc.valor) + ")</b> " + esc(pc.gatilho);
      }).join("<br>");
    }

    renderAssinaturas(c);

    // ---- abas / navegação ----
    var panels = { proposta: $("panel-proposta"), contrato: $("panel-contrato") };
    var tabBtns = document.querySelectorAll(".tabs button");
    function activate(tab) {
      Object.keys(panels).forEach(function (k) { panels[k].hidden = (k !== tab); });
      tabBtns.forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-tab") === tab); });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    tabBtns.forEach(function (b) { b.addEventListener("click", function () { activate(b.getAttribute("data-tab")); }); });
    $("goContrato").addEventListener("click", function () { activate("contrato"); });
    if (location.hash === "#contrato") activate("contrato");

    // #baixar: abre com proposta+contrato visíveis e dispara a impressão sozinho
    if (location.hash === "#baixar") {
      panels.proposta.hidden = false;
      panels.contrato.hidden = false;
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
        .then(function () { setTimeout(function () { window.print(); }, 300); });
    }

    $("baixarPdf").addEventListener("click", function () {
      var propWasHidden = panels.proposta.hidden;
      panels.proposta.hidden = false;
      panels.contrato.hidden = false;
      function restore() { panels.proposta.hidden = propWasHidden; window.removeEventListener("afterprint", restore); }
      window.addEventListener("afterprint", restore);
      window.print();
    });

    $("acBtn").addEventListener("click", assinar);

    $("estadoCarregando").hidden = true;
    $("doc").hidden = false;
  }

  function horaExcedenteTexto(s) {
    var v = Number(s.valorHoraExcedente) || 0;
    if (v > 0) {
      return "O valor da hora excedente será de " + U.moeda(v) + " (" + U.extensoReais(v) +
        ") por hora. Será concedida tolerância de 30 (trinta) minutos após o horário contratado; ultrapassado esse limite, será devida a cobrança de uma hora extra integral, quitada junto com o pagamento final.";
    }
    return "O valor da hora excedente, com o acréscimo de 30% (trinta por cento), calculado pro rata em caso de fração, deverá ser quitado em conjunto com o valor devido ao final do contrato.";
  }

  function contatoContratante(ct) {
    var partes = [];
    if (ct.contatoNome) partes.push(ct.contatoNome);
    if (ct.contatoTelefone) partes.push("Telefone " + ct.contatoTelefone);
    if (ct.contatoEmail) partes.push("E-mail " + ct.contatoEmail);
    return partes.length ? partes.join(" · ") : (ct.nomeExibicao || ct.razaoSocial || "—");
  }

  function parcelasPontual(f, valorTotal) {
    var lista = Array.isArray(f.parcelas) && f.parcelas.length ? f.parcelas
      : [{ pct: 50, gatilho: "em até 24h após a assinatura do contrato" },
         { pct: 50, gatilho: "em até 24h após a entrega do material editado" }];
    return lista.map(function (p) {
      var pct = Number(p.pct) || 0;
      return { pct: pct, gatilho: p.gatilho || "", valor: Math.round(valorTotal * pct) / 100 };
    });
  }

  function resumoParcelas(f) {
    var lista = Array.isArray(f.parcelas) && f.parcelas.length ? f.parcelas : [{ pct: 50 }, { pct: 50 }];
    return lista.map(function (p) { return (Number(p.pct) || 0) + "%"; }).join(" + ");
  }

  function resumoParcelasLongo(f) {
    var lista = Array.isArray(f.parcelas) && f.parcelas.length ? f.parcelas : null;
    if (!lista) return "50% na assinatura · 50% na entrega";
    return lista.map(function (p) { return (Number(p.pct) || 0) + "% " + (p.gatilho || ""); }).join(" · ");
  }

  /* ============================= ASSINATURAS ============================= */
  var CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  var CLOCK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>';

  function stampHtml(a, pendenteLabel) {
    if (a) {
      return '<div class="stamp"><span class="sc">' + CHECK_SVG + '</span><span class="stx"><b>Assinado eletronicamente</b>' +
        esc(a.nome) + " · " + esc(U.dataHora(a.assinadoEm)) +
        (a.ip ? " · IP " + esc(a.ip) : "") +
        "<br>Protocolo " + esc(a.protocolo) + "</span></div>";
    }
    return '<div class="stamp pend"><span class="sc">' + CLOCK_SVG + '</span><span class="stx"><b>Aguardando assinatura</b>' +
      esc(pendenteLabel) + "</span></div>";
  }

  function renderAssinaturas(c) {
    var aCt = c.assinaturas.contratante, aCd = c.assinaturas.contratado;
    var aberto = c.status === "aguardando_assinaturas";

    // carimbo (ou linha em branco) de cada parte
    if (aCt || aberto) {
      $("sigContratante").querySelector(".line").outerHTML = stampHtml(aCt, "Assinatura eletrônica pendente");
    }
    if (aCd || aberto) {
      $("sigContratado").querySelector(".line").outerHTML = stampHtml(aCd, "Assinatura eletrônica pendente");
    }

    // formulário do cliente: só se aberto e ele ainda não assinou
    $("acceptSection").hidden = !(aberto && !aCt);
    if (aberto && !aCt && aCd) {
      $("acceptHint").textContent = "A ILUME FILMES já assinou. Para fechar o contrato, preencha seus dados e clique para assinar. Registramos data, hora, IP e protocolo de autenticidade. A assinatura só pode ser feita uma vez.";
    }

    // comprovante: aparece quando o cliente já assinou
    if (aCt) mostrarComprovante(aCt, c.status);
  }

  function mostrarComprovante(a, status) {
    $("compTitulo").textContent = status === "assinado" ? "Contrato assinado pelas duas partes" : "Contrato assinado";
    $("cpNome").textContent = a.nome;
    $("cpDoc").textContent = U.formatarDoc(a.cpfCnpj);
    $("cpEmail").textContent = a.email;
    $("cpData").textContent = U.dataHora(a.assinadoEm);
    $("cpIp").textContent = a.ip || "não disponível";
    $("cpProto").textContent = a.protocolo;
    $("aguardeOutra").hidden = status === "assinado";
    $("comprovante").classList.add("show");
  }

  function assinar() {
    var btn = $("acBtn"), err = $("acErr");
    err.textContent = "";
    var nome = $("acNome").value.trim();
    var doc = $("acDoc").value.trim();
    var email = $("acEmail").value.trim();
    var digits = doc.replace(/\D/g, "");
    if (nome.length < 3) { err.textContent = "Informe seu nome completo."; return; }
    if (digits.length !== 11 && digits.length !== 14) { err.textContent = "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido."; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Informe um e-mail válido."; return; }
    if (!$("acCheck").checked) { err.textContent = "Marque a caixa de concordância para assinar."; return; }

    btn.disabled = true; btn.textContent = "Registrando assinatura…";
    fetch("/api/contratos/" + encodeURIComponent(id) + "/assinar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parte: "contratante", nome: nome, cpfCnpj: doc, email: email, aceite: true })
    })
      .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.body && res.body.erro ? res.body.erro : "Erro ao assinar");
        var a = res.body.assinatura, status = res.body.status;
        contrato.assinaturas.contratante = a;
        contrato.status = status;
        $("acceptSection").hidden = true;
        $("sigContratante").querySelector(".stamp, .line").outerHTML = stampHtml(a, "");
        mostrarComprovante(a, status);
        $("comprovante").scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .catch(function (e) {
        btn.disabled = false; btn.innerHTML = 'Assinar contrato <span class="arr">→</span>';
        err.textContent = e.message + " — se o problema persistir, fale com a ILUME FILMES pelo WhatsApp (27) 99960-9077.";
      });
  }
})();
