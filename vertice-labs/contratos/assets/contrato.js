/* Página do contrato: busca o JSON via API, preenche o template (proposta +
   contrato) e cuida da assinatura eletrônica da CONTRATANTE (cliente). */
(function () {
  "use strict";
  var U = window.VerticeUtil;
  var V = U.VERTICE;
  var esc = U.esc;
  var $ = function (id) { return document.getElementById(id); };

  var id = new URLSearchParams(location.search).get("id") || "";
  var modoPdf = new URLSearchParams(location.search).get("pdf") === "1";
  var contrato = null;

  function mostrarErro() {
    $("estadoCarregando").hidden = true;
    $("estadoErro").hidden = false;
  }
  if (!id) { mostrarErro(); return; }

  function authHeader() {
    try {
      var s = sessionStorage.getItem("vertice_admin_senha");
      return s ? { Authorization: "Bearer " + s } : {};
    } catch (e) { return {}; }
  }

  var busca = window.__contratoPromise ||
    fetch("/api/contratos/" + encodeURIComponent(id), { headers: authHeader() })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
  busca.then(function (c) { contrato = c; render(c); }).catch(mostrarErro);

  /* ================================ RENDER ================================ */
  function render(c) {
    var f = c.financeiro || {}, u = f.unico, m = f.mensal, s = c.servico || {}, p = c.proposta || {}, ct = c.contratante || {};
    var cortesias = Array.isArray(f.cortesias) ? f.cortesias : [];
    var verba = f.verbaMidia;
    var especiais = Array.isArray(c.clausulasEspeciais) ? c.clausulasEspeciais : [];

    document.title = "Proposta & Contrato · " + (ct.nomeExibicao || ct.razaoSocial || "") + " · Vértice Labs";

    var cond = {
      temSite: !!s.site,
      temLanding: !!(s.site && s.site.tipo === "landing"),
      temSiteCompleto: !!(s.site && s.site.tipo !== "landing"),
      temPrazoSite: !!(s.site && Number(s.site.prazoDiasUteis) > 0),
      temHospedagem: !!(s.site && s.site.hospedagemInclusa !== false),
      temTrafego: !!s.trafego,
      temRelatorio: !!(s.trafego && s.trafego.relatorioMensal !== false),
      temCriativos: !!s.criativos,
      temVerba: !!verba,
      temCortesia: cortesias.length > 0,
      temUnico: !!u,
      temMensal: !!m,
      soUnico: !!u && !m,
      semPrazo: !!m && !(Number(m.meses) > 0),
      comPrazo: !!m && Number(m.meses) > 0,
      comDiaFixo: !!(m && m.diaVencimento),
      semDiaFixo: !!m && !m.diaVencimento,
      temEscalonamento: !!(m && Array.isArray(m.escalonamento) && m.escalonamento.length),
      temTabela: !!((u && u.valorTabela) || (m && m.valorTabela)),
      temUnicoDescricao: !!(u && u.descricao),
      semUnicoDescricao: !!u && !u.descricao,
      temMensalDescricao: !!(m && m.descricao),
      semMensalDescricao: !!m && !m.descricao,
      temNaoIncluso: !!p.naoIncluso,
      temEspeciais: especiais.length > 0,
      temAcessos: !!s.trafego || !!s.site,
      temRepresentante: !!ct.representante
    };
    document.querySelectorAll("[data-se]").forEach(function (el) {
      if (!cond[el.getAttribute("data-se")]) el.remove();
    });

    // numeração das cláusulas e dos itens (depois de remover o que não vale)
    var numeros = {};
    document.querySelectorAll("#panel-contrato .clause").forEach(function (cl, i) {
      var n = i + 1;
      numeros[cl.getAttribute("data-clausula")] = n;
      cl.querySelector(".cnum").textContent = "Cláusula " + n + "ª";
      var k = 0;
      cl.querySelectorAll(":scope > p > .ix, :scope > ul > li > .ix").forEach(function (ix) {
        if (ix.textContent.trim()) return;
        k++;
        ix.textContent = n + "." + k;
      });
    });
    document.querySelectorAll("[data-ref]").forEach(function (el) {
      var n = numeros[el.getAttribute("data-ref")];
      el.textContent = n ? "Cláusula " + n + "ª" : "cláusula correspondente";
    });

    var primeiraMensalidadeTxt = m && m.inicio === "operacao"
      ? "no início da operação, em data comunicada pela CONTRATADA à CONTRATANTE"
      : "no ato da assinatura deste instrumento";

    var tabela = [];
    if (u && u.valorTabela) tabela.push((u.descricao || "pagamento único") + " " + U.moeda(u.valorTabela));
    if (m && m.valorTabela) tabela.push((m.descricao || "mensalidade") + " " + U.moeda(m.valorTabela) + " por mês");

    var campos = {
      numero: c.numero,
      emissao: U.dataCurta(c.criadoEm),
      validade: p.validaDias ? "Válida por " + p.validaDias + " dias" : "",
      clienteNome: ct.nomeExibicao || ct.razaoSocial || "—",
      clienteRazao: ct.razaoSocial || ct.nomeExibicao || "—",
      clienteDoc: U.formatarDoc(ct.cnpjCpf),
      representante: ct.representante || "",
      propostaTitulo: p.titulo || "Proposta comercial",
      propostaLead: p.lead || "",
      naoIncluso: p.naoIncluso || "",
      paginasTxt: s.site ? U.qtd(s.site.paginas, "página", "páginas") : "",
      prazoSiteTxt: s.site ? U.qtd(s.site.prazoDiasUteis, "dia útil", "dias úteis") : "",
      revisoesTxt: s.site ? U.qtd(s.site.revisoes, "rodada", "rodadas") : "",
      plataformasTrafego: s.trafego ? s.trafego.plataformas : "",
      criativosTxt: s.criativos ? U.qtd(s.criativos.qtdMes, "criativo estático", "criativos estáticos") : "",
      verbaDestino: verba ? verba.destino : "",
      verbaMidiaFmt: verba ? U.moeda(verba.valorMes) + " (" + U.extensoReais(verba.valorMes) + ")" : "",
      unicoDescricao: u ? u.descricao : "",
      valorUnicoFmt: u ? U.moeda(u.valor) : "",
      valorUnicoExtenso: u ? U.extensoReais(u.valor) : "",
      mensalDescricao: m ? m.descricao : "",
      valorMensalFmt: m ? U.moeda(m.valor) : "",
      valorMensalExtenso: m ? U.extensoReais(m.valor) : "",
      primeiraMensalidadeTxt: primeiraMensalidadeTxt,
      diaVencimento: m && m.diaVencimento ? String(m.diaVencimento) : "",
      escalonamentoTxt: escalonamentoTexto(m),
      tabelaTxt: tabela.join("; "),
      avisoDiasTxt: m ? U.qtd(m.avisoDias || 30, "dia", "dias") : "",
      mesesTxt: m ? U.qtd(m.meses, "mês", "meses") : "",
      dataAssinaturaLonga: U.dataLonga((c.assinaturas.contratante && c.assinaturas.contratante.assinadoEm) || c.enviadoEm || c.criadoEm),
      investLabel: investLabel(u, m, cortesias)
    };
    document.querySelectorAll("[data-campo]").forEach(function (el) {
      var v = campos[el.getAttribute("data-campo")];
      if (v !== undefined) el.textContent = v;
    });

    // qualificação da contratante
    var pj = String(ct.cnpjCpf || "").replace(/\D/g, "").length === 14;
    document.querySelectorAll('[data-campo="contratanteQualificacao"]').forEach(function (el) {
      var html = esc(ct.razaoSocial || ct.nomeExibicao) +
        (pj ? ", pessoa jurídica de direito privado" : "") +
        (pj && ct.nomeExibicao && ct.nomeExibicao !== ct.razaoSocial ? ", que atua sob o nome fantasia <b>" + esc(ct.nomeExibicao) + "</b>" : "") +
        (pj ? ", inscrita no CNPJ sob o nº <b>" : ", inscrita no CPF sob o nº <b>") + esc(U.formatarDoc(ct.cnpjCpf)) + "</b>" +
        (ct.endereco ? ", com sede na " + esc(ct.endereco) : "") +
        (ct.cidadeUf ? ", " + esc(ct.cidadeUf) : "") +
        (ct.cep ? ", CEP " + esc(ct.cep) : "") +
        (ct.contatoEmail ? ", e-mail <b>" + esc(ct.contatoEmail) + "</b>" : "") +
        (ct.contatoTelefone ? " e telefone <b>" + esc(ct.contatoTelefone) + "</b>" : "") +
        (ct.representante ? ", neste ato representada por <b>" + esc(ct.representante) + "</b>" + (ct.representanteCpf ? ", CPF " + esc(U.formatarDoc(ct.representanteCpf)) : "") : "") +
        " (doravante denominada simplesmente <b>CONTRATANTE</b>).";
      el.innerHTML = html;
    });

    /* ---- proposta ---- */
    renderProposta(c, cond);

    /* ---- contrato: objeto, cortesias, parcelas, pagamento ---- */
    var blocos = Array.isArray(p.blocos) ? p.blocos : [];
    var objetos = blocos.filter(function (b) { return b.objeto && (b.itens || []).length; });
    if (!objetos.length) objetos = blocos.slice(0, 1);
    $("objetoItens").innerHTML = objetos.map(function (b, i) {
      var sufixo = b.etiqueta === "cortesia" ? ", <b>a título de cortesia</b>, sem custo para a CONTRATANTE" :
        b.etiqueta === "mensal" ? " (serviço mensal)" : "";
      return '<p class="obj"><span class="ix">' + String.fromCharCode(97 + i) + ")</span> " + esc(b.titulo) +
        (b.itens.length ? ": " + b.itens.map(esc).join("; ") : "") + sufixo + ".</p>";
    }).join("");

    if (cond.temCortesia) {
      $("listaCortesias").innerHTML = cortesias.map(function (x) {
        return "<li>" + esc(x.descricao) + (x.valorTabela ? " (valor de tabela " + U.moeda(x.valorTabela) + ")" : "") + ";</li>";
      }).join("");
    }

    var parcelas = u ? parcelasUnico(u) : [];
    if (u) {
      $("listaParcelas").innerHTML = parcelas.map(function (pc) {
        return "<li><b>" + pc.pct + "% (" + U.moeda(pc.valor) + ")</b> " + esc(pc.gatilho) + ";</li>";
      }).join("");
    }

    var payPrice = m ? U.moeda(m.valor) + " <small>· por mês</small>" + (u ? "<br>" + U.moeda(u.valor) + " <small>· pagamento único</small>" : "")
      : (u ? U.moeda(u.valor) + " <small>· pagamento único</small>" : "Sem custo <small>· cortesia</small>");
    $("payPrice").innerHTML = payPrice;
    var linhas = [];
    parcelas.forEach(function (pc) { linhas.push("• " + esc(u.descricao || "Pagamento único") + ": <b>" + U.moeda(pc.valor) + "</b> " + esc(pc.gatilho) + ";"); });
    if (m) {
      linhas.push("• 1ª mensalidade: <b>" + U.moeda(m.valor) + "</b> · " + esc(m.inicio === "operacao" ? "no início da operação" : "no ato da assinatura") + ";");
      linhas.push("• Demais mensalidades: <b>" + U.moeda(m.valor) + "</b> · " + (m.diaVencimento ? "todo dia " + m.diaVencimento : "no mesmo dia dos meses seguintes") + ";");
    }
    cortesias.forEach(function (x) { linhas.push("• " + esc(x.descricao) + ": <b>cortesia, sem custo</b>;"); });
    if (verba) linhas.push("• Verba de mídia (referência " + U.moeda(verba.valorMes) + "/mês): paga direto a " + esc(verba.destino) + " pela CONTRATANTE.");
    $("payLinhas").innerHTML = linhas.join("<br>");

    if (cond.temEspeciais) {
      $("listaEspeciais").innerHTML = especiais.map(function (t, i) {
        return '<p><span class="ix">' + String.fromCharCode(97 + i) + ")</span> " + esc(t) + "</p>";
      }).join("");
    }

    renderAssinaturas(c);

    /* ---- abas / navegação ---- */
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

    if (modoPdf) {
      panels.proposta.hidden = false;
      panels.contrato.hidden = false;
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
        .then(function () { document.documentElement.setAttribute("data-pronto", "1"); });
    }
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
    ativarCopiar();

    $("estadoCarregando").hidden = true;
    $("doc").hidden = false;
  }

  function investLabel(u, m, cortesias) {
    if (u && m) return (m.descricao || "Serviço mensal") + " + " + (u.descricao || "pagamento único");
    if (m) return m.descricao || "Serviço mensal";
    if (u) return u.descricao || "Pagamento único";
    return cortesias.length ? "Cortesia de parceria" : "Investimento";
  }

  function escalonamentoTexto(m) {
    if (!m || !Array.isArray(m.escalonamento) || !m.escalonamento.length) return "";
    return "O valor da mensalidade segue a seguinte escala: " + m.escalonamento.map(function (e) {
      return "a partir da " + e.aPartirDoMes + "ª mensalidade, " + U.moeda(e.valor) + " (" + U.extensoReais(e.valor) + ") por mês";
    }).join("; ") + ".";
  }

  function parcelasUnico(u) {
    var total = Number(u.valor) || 0;
    var lista = Array.isArray(u.parcelas) && u.parcelas.length ? u.parcelas : [{ pct: 100, gatilho: "na assinatura do contrato" }];
    var acumulado = 0;
    return lista.map(function (p, i) {
      var pct = Number(p.pct) || 0;
      var valor = i === lista.length - 1 ? Math.round((total - acumulado) * 100) / 100
        : (Number(p.valor) > 0 ? Math.round(Number(p.valor) * 100) / 100 : Math.round(total * pct) / 100);
      acumulado += valor;
      return { pct: pct, gatilho: p.gatilho || "", valor: valor };
    });
  }

  /* ---- proposta ---- */
  function renderProposta(c, cond) {
    var f = c.financeiro || {}, u = f.unico, m = f.mensal, p = c.proposta || {}, s = c.servico || {};
    var cortesias = Array.isArray(f.cortesias) ? f.cortesias : [];

    // cards do topo (até 3)
    var cards = [];
    if (u) cards.push([u.descricao || "Pagamento único", U.moedaCurta(u.valor) + " · único"]);
    if (m) cards.push([m.descricao || "Mensalidade", U.moedaCurta(m.valor) + "/mês"]);
    cortesias.forEach(function (x) { if (cards.length < 3) cards.push([x.descricao, "Cortesia · R$ 0"]); });
    if (cards.length < 3 && m) cards.push(["Fidelidade", cond.semPrazo ? "Nenhuma · aviso de " + (m.avisoDias || 30) + " dias" : U.qtd(m.meses, "mês", "meses")]);
    if (cards.length < 3 && s.site && s.site.prazoDiasUteis) cards.push(["Prazo de entrega", s.site.prazoDiasUteis + " dias úteis"]);
    $("metaCards").innerHTML = cards.slice(0, 3).map(function (k) {
      return '<div class="m"><span class="lbl">' + esc(k[0]) + '</span><span class="val">' + esc(k[1]) + "</span></div>";
    }).join("");

    // contexto
    var contexto = Array.isArray(p.contexto) ? p.contexto : [];
    if (contexto.length) {
      $("secContexto").hidden = false;
      $("contextoParagrafos").innerHTML = contexto.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");
    }

    // blocos
    var blocos = Array.isArray(p.blocos) ? p.blocos : [];
    $("blocosProposta").innerHTML = blocos.map(function (b, i) {
      var itens = (b.itens || []).map(function (it) { return "<li>" + esc(it) + "</li>"; }).join("");
      var badge = "";
      if (b.etiqueta === "incluso") badge = '<span class="bp free">Incluso</span>';
      else if (b.etiqueta === "cortesia") badge = '<span class="bp free">Cortesia</span>';
      else if (b.etiqueta === "mensal" && m) badge = '<span class="bp mensal">' + esc(U.moedaCurta(m.valor)) + " · mês</span>";
      else if (b.etiqueta === "unico" && u) badge = '<span class="bp">' + esc(U.moedaCurta(u.valor)) + " · único</span>";
      return '<div class="block"><div class="bh"><span class="bn">' + (i + 1) + '</span><span class="bt">' +
        esc(b.titulo) + "</span>" + badge + "</div><ul>" + itens + "</ul></div>";
    }).join("");
    if (!blocos.length) $("secBlocos").remove();

    // investimento
    $("investPrice").innerHTML = m
      ? U.moedaCurta(m.valor) + "<small> · por mês</small>"
      : (u ? U.moedaCurta(u.valor) + "<small> · pagamento único</small>" : "R$ 0<small> · cortesia</small>");
    var was = [];
    if (u && u.valorTabela) was.push("Tabela: <s>" + U.moedaCurta(u.valorTabela) + "</s>. Sai por <b>" + U.moedaCurta(u.valor) + "</b>.");
    if (m && m.valorTabela) was.push("Tabela: <s>" + U.moedaCurta(m.valorTabela) + "/mês</s>. Sai por <b>" + U.moedaCurta(m.valor) + "/mês</b>.");
    cortesias.forEach(function (x) { if (x.valorTabela) was.push(esc(x.descricao) + ": <s>" + U.moedaCurta(x.valorTabela) + "</s>. Sai por <b>R$ 0</b>, cortesia de parceria."); });
    if (was.length) { $("investWas").hidden = false; $("investWas").innerHTML = was.join(" "); }

    var sbs = [];
    if (u) {
      var pcs = parcelasUnico(u);
      sbs.push('<div class="sb"><span class="sl">' + esc(u.descricao || "Pagamento único") + '</span><div class="sv">' + U.moedaCurta(u.valor) + ' <small>· único</small></div><ul>' +
        pcs.map(function (pc) { return "<li>" + (pcs.length > 1 ? pc.pct + "% " : "") + esc(pc.gatilho) + "</li>"; }).join("") + "</ul></div>");
    }
    if (m) {
      sbs.push('<div class="sb"><span class="sl">1ª mensalidade' + (m.descricao ? " · " + esc(m.descricao) : "") + '</span><div class="sv">' + U.moedaCurta(m.valor) + '</div><ul><li>' +
        (m.inicio === "operacao" ? "Quando a operação começa" : "No ato da assinatura") + "</li><li>" +
        (m.diaVencimento ? "Demais todo dia " + m.diaVencimento : "Demais no mesmo dia dos meses seguintes") + "</li></ul></div>");
    }
    $("investSplit").innerHTML = sbs.join("");
    $("investSplit").className = "split" + (sbs.length === 1 ? " um" : "");
    if (!sbs.length) $("investSplit").hidden = true;

    var termos = [["Pagamento", "Pix"]];
    if (m) termos.push(["Vigência", cond.semPrazo ? "Mensal, renovação automática" : U.qtd(m.meses, "mês", "meses")]);
    if (m) termos.push(["Saída", "Aviso de " + (m.avisoDias || 30) + " dias, sem multa"]);
    if (s.site && s.site.prazoDiasUteis) termos.push(["Prazo do site", s.site.prazoDiasUteis + " dias úteis após a aprovação"]);
    if (f.verbaMidia) termos.push(["Verba de mídia", U.moedaCurta(f.verbaMidia.valorMes) + "/mês, direto a " + f.verbaMidia.destino]);
    $("investTerms").innerHTML = termos.map(function (t) {
      return '<div><span class="tl">' + esc(t[0]) + "</span><b>" + esc(t[1]) + "</b></div>";
    }).join("");

    var nota = [];
    if (p.naoIncluso) nota.push("Não estão inclusos: " + p.naoIncluso);
    nota.push("O trabalho é obrigação de meio: entregamos estrutura e execução com dedicação total, sem promessa de número de contatos ou de faturamento.");
    $("investNota").textContent = nota.join(" ");

    // próximos passos
    var passos = Array.isArray(p.passos) && p.passos.length ? p.passos.map(function (x) { return [x.titulo, x.texto]; }) : passosPadrao(c, cond);
    $("passos").innerHTML = passos.map(function (ps, i) {
      return '<div class="step"><div class="n">' + (i + 1) + '</div><div class="st">' + esc(ps[0]) + "</div><p>" + esc(ps[1]) + "</p></div>";
    }).join("");
  }

  function passosPadrao(c, cond) {
    var s = c.servico || {}, m = (c.financeiro || {}).mensal, u = (c.financeiro || {}).unico;
    var lista = [["Assinatura", "Você lê o contrato na aba ao lado e assina eletronicamente."]];
    if (u && m && m.inicio === "operacao") lista.push(["Materiais e acessos", "Identidade de marca, informações dos serviços e acessos das contas."]);
    else lista.push(["Pagamento e acessos", "Pix da " + (u ? "parcela inicial" : "1ª mensalidade") + " e os acessos das contas."]);
    if (s.site) lista.push(["Prévia do site", "Em cerca de " + (s.site.prazoDiasUteis || 7) + " dias úteis você recebe o site para aprovar."]);
    if (s.trafego) lista.push(["Campanhas no ar", "Anúncios ligados e os primeiros contatos chegando no WhatsApp."]);
    if (s.trafego && s.trafego.relatorioMensal !== false) lista.push(["Relatório e ajuste", "Todo mês, os números na mesa e a verba ajustada para o que está fechando."]);
    if (!s.trafego && s.site) lista.push(["No ar", "Site publicado e arquivos seus."]);
    return lista.slice(0, 5);
  }

  function ativarCopiar() {
    document.querySelectorAll("[data-copiar]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var valor = btn.getAttribute("data-copiar"), rotulo = btn.textContent;
        function confirmar() { btn.textContent = "Copiada ✓"; btn.classList.add("ok"); setTimeout(function () { btn.textContent = rotulo; btn.classList.remove("ok"); }, 2000); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(valor).then(confirmar).catch(function () { window.prompt("Copie a chave Pix:", valor); });
        else window.prompt("Copie a chave Pix:", valor);
      });
    });
  }

  /* ============================= ASSINATURAS ============================= */
  var CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  var CLOCK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>';

  function stampHtml(a, pendenteLabel) {
    if (a) {
      return '<div class="stamp"><span class="sc">' + CHECK_SVG + '</span><span class="stx"><b>Assinado eletronicamente</b>' +
        esc(a.nome) + " · " + esc(U.dataHora(a.assinadoEm)) + (a.ip ? " · IP " + esc(a.ip) : "") +
        (a.protocolo ? "<br>Protocolo " + esc(a.protocolo) : "") + "</span></div>";
    }
    return '<div class="stamp pend"><span class="sc">' + CLOCK_SVG + '</span><span class="stx"><b>Aguardando assinatura</b>' + esc(pendenteLabel) + "</span></div>";
  }

  function renderAssinaturas(c) {
    var aCt = c.assinaturas.contratante, aCd = c.assinaturas.contratada;
    var aberto = c.status === "aguardando_assinaturas";
    if (aCt || aberto) $("sigContratante").querySelector(".line").outerHTML = stampHtml(aCt, "Assinatura eletrônica pendente");
    if (aCd || aberto) $("sigContratada").querySelector(".line").outerHTML = stampHtml(aCd, "Assinatura eletrônica pendente");
    $("acceptSection").hidden = !(aberto && !aCt);
    if (aberto && !aCt && aCd) {
      $("acceptHint").textContent = "A Vértice Labs já assinou. Para fechar o contrato, preencha seus dados e clique para assinar. Registramos data, hora, IP e protocolo de autenticidade. A assinatura só pode ser feita uma vez.";
    }
    if (aCt) mostrarComprovante(aCt, c.status, c);
  }

  function mostrarComprovante(a, status, c) {
    $("compTitulo").textContent = status === "assinado" ? "Contrato assinado pelas duas partes" : "Contrato assinado";
    $("cpNome").textContent = a.nome;
    $("cpDoc").textContent = U.formatarDoc(a.cpfCnpj);
    $("cpEmail").textContent = a.email || "—";
    $("cpData").textContent = U.dataHora(a.assinadoEm);
    $("cpIp").textContent = a.ip || "não disponível";
    $("cpProto").textContent = a.protocolo || "—";
    $("aguardeOutra").hidden = status === "assinado";
    var f = (c && c.financeiro) || {};
    var devido = [];
    if (f.unico && (f.unico.parcelas || []).some(function (p) { return p.quando === "assinatura"; })) {
      var pc = parcelasUnico(f.unico).filter(function (x, i) { return f.unico.parcelas[i].quando === "assinatura"; });
      pc.forEach(function (x) { devido.push(U.moeda(x.valor) + " (" + (f.unico.descricao || "pagamento único") + ")"); });
    }
    if (f.mensal && f.mensal.inicio !== "operacao") devido.push(U.moeda(f.mensal.valor) + " (1ª mensalidade)");
    if (devido.length) {
      $("compPagamento").hidden = false;
      $("compPagamento").innerHTML = "<b>Devido agora: " + esc(devido.join(" + ")) + ".</b> Pix CNPJ <b>" + V.pix + "</b> · " + esc(V.razaoSocial) + " · " + esc(V.banco) + ". Envie o comprovante no WhatsApp " + esc(V.whatsapp) + ".";
    }
    $("comprovante").classList.add("show");
  }

  function assinar() {
    var btn = $("acBtn"), err = $("acErr");
    err.textContent = "";
    var nome = $("acNome").value.trim(), doc = $("acDoc").value.trim(), email = $("acEmail").value.trim();
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
        mostrarComprovante(a, status, contrato);
        $("comprovante").scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .catch(function (e) {
        btn.disabled = false; btn.innerHTML = 'Assinar contrato <span class="arr">→</span>';
        err.textContent = e.message + " Se o problema continuar, fale com a Vértice Labs pelo WhatsApp " + V.whatsapp + ".";
      });
  }
})();
