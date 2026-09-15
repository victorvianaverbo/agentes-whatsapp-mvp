/* Painel de gestão de contratos da Vértice Labs: login, lista, criar/editar,
   enviar, assinar como CONTRATADA, pagamentos, gestão anual, contratos legados. */
(function () {
  "use strict";
  var U = window.VerticeUtil;
  var esc = U.esc;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = "vertice_admin_senha";
  var CACHE_LISTA = "vertice_lista_cache";

  var estado = {
    lista: [], editandoId: null, assinandoId: null, statusId: null, anual: null
  };

  function senha() { try { return sessionStorage.getItem(KEY) || ""; } catch (e) { return ""; } }

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ Authorization: "Bearer " + senha() }, opts.headers || {});
    if (opts.body && !opts.headers["Content-Type"]) opts.headers["Content-Type"] = "application/json";
    if (opts.method && opts.method !== "GET") { try { sessionStorage.removeItem(CACHE_LISTA); } catch (e) {} }
    return fetch(path, opts).then(function (r) {
      if (r.status === 401) { logout(); throw new Error("Sessão expirada. Faça login de novo."); }
      if (r.status === 204) return null;
      return r.json().then(function (b) {
        if (!r.ok) throw new Error(b && b.erro ? b.erro : "Erro " + r.status);
        return b;
      });
    });
  }

  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove("show"); }, 2800);
  }

  function mostrar(view) {
    ["viewLogin", "viewLista", "viewForm", "viewPagamentos", "viewAnual"].forEach(function (v) { $(v).hidden = (v !== view); });
    window.scrollTo(0, 0);
  }

  function linhas(texto) {
    return String(texto || "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
  }

  /* ================================ LOGIN ================================ */
  function logout() {
    try { sessionStorage.removeItem(KEY); sessionStorage.removeItem(CACHE_LISTA); } catch (e) {}
    estado.lista = []; estado.anual = null;
    mostrar("viewLogin");
  }
  $("loginBtn").addEventListener("click", entrar);
  $("loginSenha").addEventListener("keydown", function (e) { if (e.key === "Enter") entrar(); });
  function entrar() {
    var s = $("loginSenha").value;
    if (!s) { $("loginErr").textContent = "Digite a senha."; return; }
    $("loginBtn").disabled = true;
    fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senha: s }) })
      .then(function (r) {
        $("loginBtn").disabled = false;
        if (!r.ok) { $("loginErr").textContent = "Senha incorreta."; return; }
        try { sessionStorage.setItem(KEY, s); } catch (e) {}
        $("loginSenha").value = ""; $("loginErr").textContent = "";
        abrirLista();
      }).catch(function () { $("loginBtn").disabled = false; $("loginErr").textContent = "Erro de conexão. Tente de novo."; });
  }
  $("btnSair").addEventListener("click", logout);
  $("btnAtualizar").addEventListener("click", abrirLista);

  /* ================================ LISTA ================================ */
  function abrirLista() {
    mostrar("viewLista");
    var pintou = false;
    try {
      var cache = JSON.parse(sessionStorage.getItem(CACHE_LISTA) || "null");
      if (cache && cache.length) { estado.lista = cache; renderLista(); pintou = true; }
    } catch (e) {}
    if (!pintou) $("listaBody").innerHTML = '<tr><td colspan="5" class="empty">Carregando…</td></tr>';
    var busca = window.__listaPromise || api("/api/contratos");
    window.__listaPromise = null;
    return busca.then(function (lista) { return lista || api("/api/contratos"); }).then(function (lista) {
      estado.lista = lista;
      try { sessionStorage.setItem(CACHE_LISTA, JSON.stringify(lista)); } catch (e) {}
      renderLista();
    }).catch(function (e) {
      if (!pintou) $("listaBody").innerHTML = '<tr><td colspan="5" class="empty">' + esc(e.message) + "</td></tr>";
      else toast(e.message);
    });
  }

  var ROTULOS = { rascunho: "Rascunho", proposta: "Só proposta", em_operacao: "Em operação", expirada: "Expirada", substituido: "Substituído", terceiro: "Terceiro", encerrado: "Encerrado", assinado: "✓ Assinado" };
  function badge(c) {
    if (c.status === "aguardando_assinaturas") {
      var n = (c.assinaturas.contratante ? 1 : 0) + (c.assinaturas.contratada ? 1 : 0);
      return '<span class="badge aguardando">' + n + "/2 assinaturas</span>";
    }
    var cls = c.status === "assinado" ? "assinado" : (c.status === "em_operacao" ? "operacao" : c.status);
    var extra = mensalRodando(c) ? " · mensal ativo" : "";
    return '<span class="badge ' + cls + '">' + esc(ROTULOS[c.status] || c.status) + extra + "</span>";
  }
  function valorCol(c) {
    var partes = [];
    if (c.valorUnico) partes.push(U.moedaCurta(c.valorUnico));
    if (c.valorMensal) partes.push(U.moedaCurta(c.valorMensal) + "/mês");
    return partes.join(" + ") || (c.valorTotal ? U.moedaCurta(c.valorTotal) : "—");
  }
  /* Contrato em sociedade: nos totais entra só a fatia da casa (financeiro.participacao.pct).
     Os valores por cobrança continuam cheios — é o que o cliente paga. */
  function fatorCasa(c) {
    var p = c && c.participacao;
    var pct = p ? Number(p.pct) : NaN;
    return pct >= 0 && pct < 100 ? pct / 100 : 1;
  }
  function seloSocio(c) {
    var p = c && c.participacao;
    if (!p || !(Number(p.pct) >= 0) || Number(p.pct) >= 100) return "";
    return '<span class="sub">sua parte ' + Number(p.pct) + "%" + (p.socio ? " · " + esc(p.socio) : "") + "</span>";
  }
  /* Mensalidade que de fato ainda rende, para o card de recorrente bater com a
     gestão anual: fora parceria sem cobrança ao cliente (Hype), mensal de prazo
     já vencido (Ilume) e mensal à espera do início da operação (Judah). */
  function mensalRodando(c) {
    if (!c.mensalAtivo || c.cobrarCliente === false) return false;
    var comData = (c.pagamentos || []).filter(function (p) { return p.serie === "mensal" && p.vencimento; });
    if (!comData.length) return false;
    if (Number(c.mensalMeses) > 0) {
      var ultima = comData.map(function (p) { return p.vencimento; }).sort().pop();
      if (ultima < U.hojeISO()) return false;
    }
    return true;
  }
  /* Totais de gestão, já na fatia da casa. Mesma conta na lista e em Pagamentos.
     comPrev inclui as cobranças previstas (contratos ainda não assinados). */
  function totaisGestao(lista, comPrev) {
    var hoje = U.hojeISO(), mes = hoje.slice(0, 7);
    var t = {
      recebido: 0, aReceber: 0, atrasado: 0, doMes: 0, setup: 0, setupRecebido: 0,
      mensal: 0, mensalRecebido: 0, mrr: 0, ativos: 0,
      // recorte do mês corrente, para a tela de Pagamentos
      recebidoMes: 0, aReceberMes: 0, setupMes: 0, mensalMes: 0
    };
    (lista || []).forEach(function (c) {
      var fc = fatorCasa(c);
      if (mensalRodando(c)) { t.mrr += (Number(c.valorMensal) || 0) * fc; t.ativos++; }
      (c.pagamentos || []).forEach(function (p) {
        if (p.previsao && !comPrev) return;
        var v = p.valor * fc;
        // "deste mês" é onde o dinheiro cai: quando foi pago, o dia do pagamento;
        // quando não foi, o vencimento.
        var noMes = p.pago
          ? String(p.pagoEm || "").slice(0, 7) === mes
          : !!(p.vencimento && p.vencimento.slice(0, 7) === mes);
        if (p.serie === "mensal") { t.mensal += v; if (p.pago) t.mensalRecebido += v; if (noMes) t.mensalMes += v; }
        else { t.setup += v; if (p.pago) t.setupRecebido += v; if (noMes) t.setupMes += v; }
        if (p.pago) { t.recebido += v; if (noMes) t.recebidoMes += v; return; }
        t.aReceber += v;
        if (noMes) t.aReceberMes += v;
        if (p.vencimento && p.vencimento < hoje && !p.previsao) t.atrasado += v;
        if (p.vencimento && p.vencimento.slice(0, 7) === mes) t.doMes += v;
      });
    });
    t.totalMes = t.recebidoMes + t.aReceberMes;
    return t;
  }
  var MESES_BR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  function mesCurto(iso) {
    var p = String(iso).split("-");
    return MESES_BR[Number(p[1]) - 1] + "/" + p[0].slice(2);
  }
  function cardStat(rotulo, valor, sub, cor) {
    return '<div class="stat"><span class="sl">' + rotulo + '</span><span class="sv"' + (cor ? ' style="color:var(--' + cor + ')"' : "") +
      ">" + valor + "</span>" + (sub ? '<span class="sx">' + sub + "</span>" : "") + "</div>";
  }
  function filtrar(lista) {
    var q = ($("busca").value || "").trim().toLowerCase();
    var f = $("filtroStatus").value;
    return lista.filter(function (c) {
      if (q && (c.cliente + " " + c.numero).toLowerCase().indexOf(q) < 0) return false;
      if (!f) return true;
      if (f === "ativos") return mensalRodando(c);
      if (f === "encerrado") return ["encerrado", "substituido", "expirada", "terceiro"].indexOf(c.status) >= 0;
      return c.status === f;
    });
  }
  $("busca").addEventListener("input", renderLista);
  $("filtroStatus").addEventListener("change", renderLista);

  function renderLista() {
    var todos = estado.lista || [];
    var t = totaisGestao(todos, true);
    var rendendo = todos.filter(function (c) { return c.status === "assinado" || c.status === "em_operacao"; }).length;
    // Aqui é o acumulado; o recorte do mês fica na tela de Pagamentos.
    $("listaResumo").innerHTML =
      cardStat("Contratos", todos.length, rendendo + " rendendo") +
      cardStat("Recorrente por mês", U.moedaCurta(t.mrr), t.ativos + (t.ativos === 1 ? " contrato ativo" : " contratos ativos")) +
      cardStat("Entrada única no ano", U.moedaCurta(t.setup), U.moedaCurta(t.setupRecebido) + " recebido") +
      cardStat("A receber no ano", U.moedaCurta(t.aReceber), U.moedaCurta(t.doMes) + " vence este mês") +
      cardStat("Atrasado", U.moedaCurta(t.atrasado), null, "warn") +
      cardStat("Recebido no ano", U.moedaCurta(t.recebido), null, "ok");

    var lista = filtrar(todos);
    var body = $("listaBody");
    $("listaVazia").hidden = todos.length > 0;
    body.innerHTML = lista.map(function (c) {
      var acts = [];
      var legado = !!c.legado;
      if (legado) {
        if (c.legado.url) acts.push(bt("Abrir proposta", "abrir", c.id));
        if (c.legado.docId) acts.push(bt("Sincronizar", "sincronizar", c.id));
        acts.push(bt("Status", "status", c.id));
        if (c.mensalAtivo) acts.push(bt("Encerrar mensal", "encerrar", c.id));
      } else if (c.status === "rascunho") {
        acts.push(bt("Visualizar", "ver", c.id));
        acts.push(bt("Editar", "editar", c.id));
        acts.push(bt("Enviar ao cliente", "enviar", c.id, "acc"));
      } else {
        acts.push(bt("Copiar link", "link", c.id));
        acts.push(bt("Ver", "ver", c.id));
        acts.push(bt("PDF", "baixar", c.id));
        if (c.status === "aguardando_assinaturas" && !c.assinaturas.contratante && !c.assinaturas.contratada) acts.push(bt("Editar", "editar", c.id));
        if (c.status === "aguardando_assinaturas" && !c.assinaturas.contratada) acts.push(bt("Assinar", "assinar", c.id, "acc"));
        if (c.mensalAtivo) acts.push(bt("Encerrar mensal", "encerrar", c.id));
      }
      acts.push(bt("Excluir", "excluir", c.id, "danger"));
      return "<tr><td><b>" + esc(c.numero) + '</b><br><span class="tipo-tag">' + (legado ? "legado · " : "") + esc(U.dataCurta(c.criadoEm)) + "</span></td>" +
        "<td>" + esc(c.cliente) + (c.proximoVencimento ? '<br><span class="sub">próx. venc. ' + esc(U.dataBR(c.proximoVencimento)) + "</span>" : "") + "</td>" +
        "<td>" + esc(valorCol(c)) + (seloSocio(c) ? "<br>" + seloSocio(c) : "") + "</td>" +
        "<td>" + badge(c) + (c.atrasado ? '<br><span class="badge atrasada" style="margin-top:4px">' + esc(U.moedaCurta(c.atrasado)) + " atrasado</span>" : "") + "</td>" +
        '<td><div class="acts">' + acts.join("") + "</div></td></tr>";
    }).join("") || '<tr><td colspan="5" class="empty">Nada neste filtro.</td></tr>';
  }

  function bt(rotulo, acao, id, extra) {
    return '<button class="btn sec mini ' + (extra || "") + '" data-acao="' + acao + '" data-id="' + id + '">' + rotulo + "</button>";
  }
  function achar(id) { return (estado.lista || []).find(function (x) { return x.id === id; }) || {}; }

  $("listaBody").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-acao]");
    if (!b) return;
    var id = b.getAttribute("data-id"), acao = b.getAttribute("data-acao"), c = achar(id);
    if (acao === "editar") abrirForm(id);
    if (acao === "enviar") enviar(id, b);
    if (acao === "link") copiarLink(id);
    if (acao === "ver") window.open("/contrato?id=" + id, "_blank");
    if (acao === "baixar") window.open("/contrato?id=" + id + "#baixar", "_blank");
    if (acao === "assinar") abrirAssinar(id);
    if (acao === "excluir") excluir(id, b);
    if (acao === "abrir") window.open(c.legado.url, "_blank");
    if (acao === "sincronizar") sincronizar(id, b);
    if (acao === "status") abrirStatus(id);
    if (acao === "encerrar") encerrarMensal(id, b);
  });

  function linkContrato(id) { return location.origin + "/contrato?id=" + id; }
  function copiarLink(id) {
    var url = linkContrato(id);
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
      .then(function () { toast("Link copiado! Envie ao cliente pelo WhatsApp."); })
      .catch(function () { prompt("Copie o link do contrato:", url); });
  }
  function enviar(id, b) {
    if (!confirm("Enviar este contrato? Ele fica editável só até a primeira assinatura.")) return;
    b.disabled = true;
    api("/api/contratos/" + id, { method: "PATCH", body: JSON.stringify({ acao: "enviar" }) })
      .then(function () { copiarLink(id); abrirLista(); })
      .catch(function (e) { b.disabled = false; toast(e.message); });
  }
  function excluir(id, b) {
    var c = achar(id);
    if (!confirm("Excluir o contrato " + (c.numero || "") + " (" + (c.cliente || "") + ")? Essa ação não pode ser desfeita.")) return;
    b.disabled = true;
    api("/api/contratos/" + id, { method: "DELETE" })
      .then(function () { toast("Contrato excluído."); abrirLista(); })
      .catch(function (e) { b.disabled = false; toast(e.message); });
  }
  function sincronizar(id, b) {
    b.disabled = true;
    api("/api/contratos/" + id, { method: "PATCH", body: JSON.stringify({ acao: "sincronizar" }) })
      .then(function (c) { toast(c.status === "assinado" ? "Assinado pelas duas partes." : "Sincronizado: " + (c.assinaturas.contratante ? "cliente assinou" : "cliente ainda não assinou") + "."); abrirLista(); })
      .catch(function (e) { b.disabled = false; toast(e.message); });
  }
  function encerrarMensal(id, b) {
    var em = prompt("Data do encerramento da mensalidade (AAAA-MM-DD):", U.hojeISO());
    if (!em) return;
    b.disabled = true;
    api("/api/contratos/" + id, { method: "PATCH", body: JSON.stringify({ acao: "encerrarMensal", em: em }) })
      .then(function () { toast("Mensalidade encerrada."); abrirLista(); })
      .catch(function (e) { b.disabled = false; toast(e.message); });
  }

  /* ---- status de legado ---- */
  var dlgSt = $("dlgStatus");
  function abrirStatus(id) {
    var c = achar(id);
    estado.statusId = id;
    $("stSelect").value = c.status || "proposta";
    $("stObs").value = "";
    $("stErr").textContent = "";
    dlgSt.showModal();
  }
  $("stCancelar").addEventListener("click", function () { dlgSt.close(); });
  $("stConfirmar").addEventListener("click", function () {
    var id = estado.statusId, btn = $("stConfirmar");
    btn.disabled = true;
    api("/api/contratos/" + id, { method: "PATCH", body: JSON.stringify({ acao: "status", status: $("stSelect").value }) })
      .then(function () {
        var obs = $("stObs").value.trim();
        return obs ? api("/api/contratos/" + id, { method: "PATCH", body: JSON.stringify({ acao: "observacoes", observacoes: obs }) }) : null;
      })
      .then(function () { btn.disabled = false; dlgSt.close(); toast("Status atualizado."); abrirLista(); })
      .catch(function (e) { btn.disabled = false; $("stErr").textContent = e.message; });
  });

  /* ============================ ASSINAR (VÉRTICE) ============================ */
  var dlg = $("dlgAssinar");
  function abrirAssinar(id) {
    var c = achar(id);
    estado.assinandoId = id;
    $("asNumero").textContent = "Nº " + (c.numero || "");
    $("asCheck").checked = false;
    $("asErr").textContent = "";
    dlg.showModal();
  }
  $("asCancelar").addEventListener("click", function () { dlg.close(); });
  $("asConfirmar").addEventListener("click", function () {
    var err = $("asErr");
    err.textContent = "";
    if (!$("asCheck").checked) { err.textContent = "Marque a caixa de concordância para assinar."; return; }
    var btn = $("asConfirmar");
    btn.disabled = true; btn.textContent = "Assinando…";
    api("/api/contratos/" + estado.assinandoId + "/assinar", {
      method: "POST",
      body: JSON.stringify({ parte: "contratada", nome: $("asNome").value.trim(), cpfCnpj: $("asDoc").value.trim(), email: $("asEmail").value.trim(), aceite: true })
    }).then(function (res) {
      btn.disabled = false; btn.textContent = "Assinar contrato";
      dlg.close();
      toast(res.status === "assinado" ? "Contrato assinado pelas duas partes." : "Assinatura registrada. Aguardando o cliente.");
      abrirLista();
    }).catch(function (e) { btn.disabled = false; btn.textContent = "Assinar contrato"; err.textContent = e.message; });
  });

  /* ================================ FORM ================================ */
  $("btnNovo").addEventListener("click", function () { abrirForm(null); });
  $("btnVoltar").addEventListener("click", abrirLista);

  ["chkSite", "chkTrafego", "chkCriativos", "chkUnico", "chkMensal"].forEach(function (id) {
    $(id).addEventListener("change", aplicarGrupos);
  });
  function aplicarGrupos() {
    $("grpSite").hidden = !$("chkSite").checked;
    $("grpTrafego").hidden = !$("chkTrafego").checked;
    $("grpCriativos").hidden = !$("chkCriativos").checked;
    $("grpUnico").hidden = !$("chkUnico").checked;
    $("grpMensal").hidden = !$("chkMensal").checked;
    atualizarHintFinanceiro();
  }
  ["fUnicoValor", "fMensalValor", "fMeses"].forEach(function (id) { $(id).addEventListener("input", atualizarHintFinanceiro); });
  function atualizarHintFinanceiro() {
    var u = $("chkUnico").checked ? Number($("fUnicoValor").value) || 0 : 0;
    var m = $("chkMensal").checked ? Number($("fMensalValor").value) || 0 : 0;
    var meses = Number($("fMeses").value) || 0;
    var partes = [];
    if (u) partes.push(U.moeda(u) + " único");
    if (m) partes.push(U.moeda(m) + "/mês" + (meses ? " × " + meses + " = " + U.moeda(m * meses) : " sem prazo"));
    $("hintFinanceiro").textContent = partes.length ? "Resumo: " + partes.join(" + ") : "";
  }

  /* ---- blocos da proposta ---- */
  function addBloco(b, wrap) {
    b = b || {};
    var alvo = wrap || $("blocosWrap");
    var div = document.createElement("div");
    div.className = "bloco-item";
    var et = b.etiqueta || "";
    div.innerHTML = '<div class="grid2"><label class="f">Título do bloco<input class="bTitulo" placeholder="Site completo" value="' + esc(b.titulo || "") + '"></label>' +
      '<label class="f">Etiqueta<select class="bEtiqueta">' +
      ['', 'incluso', 'unico', 'mensal', 'cortesia'].map(function (v) {
        var r = { "": "nenhuma", incluso: "Incluso", unico: "Valor único", mensal: "Mensal", cortesia: "Cortesia" }[v];
        return '<option value="' + v + '"' + (v === et ? " selected" : "") + ">" + r + "</option>";
      }).join("") + "</select></label></div>" +
      '<label class="f">Itens (um por linha)<textarea class="bItens">' + esc((b.itens || []).join("\n")) + "</textarea></label>" +
      '<label class="chk"><input type="checkbox" class="bObjeto"' + (b.objeto !== false ? " checked" : "") + '> Este bloco entra na cláusula do objeto do contrato</label>' +
      '<button class="btn danger mini" type="button" style="align-self:flex-start">Remover bloco</button>';
    div.querySelector("button").addEventListener("click", function () { div.remove(); });
    alvo.appendChild(div);
  }
  $("btnAddBloco").addEventListener("click", function () { addBloco(); });
  function lerBlocos() {
    return Array.prototype.map.call(document.querySelectorAll("#blocosWrap .bloco-item"), function (div) {
      return {
        titulo: div.querySelector(".bTitulo").value.trim(),
        itens: linhas(div.querySelector(".bItens").value),
        objeto: div.querySelector(".bObjeto").checked,
        etiqueta: div.querySelector(".bEtiqueta").value
      };
    }).filter(function (b) { return b.titulo || b.itens.length; });
  }

  /* ---- parcelas do pagamento único ---- */
  var PRESETS = {
    "100a": [{ pct: 100, gatilho: "no fechamento do contrato", quando: "assinatura" }],
    "5050": [{ pct: 50, gatilho: "no fechamento do contrato", quando: "assinatura" }, { pct: 50, gatilho: "na entrega", quando: "entrega" }],
    "aprov": [{ pct: 100, gatilho: "na aprovação da prévia do site", quando: "definir" }]
  };
  function addParcela(p) {
    p = p || {};
    var div = document.createElement("div");
    div.className = "bloco-item";
    div.innerHTML = '<div class="grid4">' +
      '<label class="f">% do total<input class="pPct" type="number" min="1" max="100" value="' + (p.pct || "") + '"></label>' +
      '<label class="f">Texto (quando)<input class="pGatilho" value="' + esc(p.gatilho || "") + '" placeholder="na entrega do site"></label>' +
      '<label class="f">Vence<select class="pQuando">' +
      [["assinatura", "na assinatura"], ["dias", "N dias após"], ["entrega", "na entrega (prazo do site)"], ["definir", "a definir"]].map(function (o) {
        return '<option value="' + o[0] + '"' + (o[0] === (p.quando || "definir") ? " selected" : "") + ">" + o[1] + "</option>";
      }).join("") + "</select></label>" +
      '<label class="f">Dias (se "N dias")<input class="pDias" type="number" min="0" value="' + (p.dias || "") + '"></label>' +
      '</div><button class="btn danger mini" type="button" style="align-self:flex-start">Remover</button>';
    div.querySelector("button").addEventListener("click", function () { div.remove(); });
    $("parcelasWrap").appendChild(div);
  }
  $("btnAddParcela").addEventListener("click", function () { addParcela(); });
  function setPreset(preset, parcelas) {
    $("fPreset").value = preset;
    var custom = preset === "custom";
    $("parcelasWrap").style.display = custom ? "flex" : "none";
    $("btnAddParcela").style.display = custom ? "inline-flex" : "none";
    $("parcelasWrap").innerHTML = "";
    if (custom) (parcelas && parcelas.length ? parcelas : PRESETS["5050"]).forEach(addParcela);
  }
  $("fPreset").addEventListener("change", function () { setPreset(this.value); });
  function lerParcelas() {
    var preset = $("fPreset").value;
    if (PRESETS[preset]) return PRESETS[preset];
    return Array.prototype.map.call(document.querySelectorAll("#parcelasWrap .bloco-item"), function (div) {
      return { pct: Number(div.querySelector(".pPct").value) || 0, gatilho: div.querySelector(".pGatilho").value.trim(), quando: div.querySelector(".pQuando").value, dias: Number(div.querySelector(".pDias").value) || 0 };
    }).filter(function (p) { return p.pct > 0; });
  }
  function presetDe(parcelas) {
    var chaves = Object.keys(PRESETS);
    for (var i = 0; i < chaves.length; i++) {
      var pr = PRESETS[chaves[i]];
      if (pr.length === parcelas.length && pr.every(function (p, j) { return p.pct === Number(parcelas[j].pct) && p.quando === parcelas[j].quando; })) return chaves[i];
    }
    return "custom";
  }

  function preencherPropostaServicoFinanceiro(m) {
    var p = m.proposta || m, s = m.servico || {}, f = m.financeiro || {};
    $("fPropTitulo").value = p.titulo || "";
    $("fPropLead").value = p.lead || "";
    $("fPropContexto").value = (p.contexto || []).join("\n");
    $("fNaoIncluso").value = p.naoIncluso || "";
    $("blocosWrap").innerHTML = "";
    (p.blocos || []).forEach(function (b) { addBloco(b); });
    if (!(p.blocos || []).length) addBloco();

    $("chkSite").checked = !!s.site;
    if (s.site) { $("fSiteTipo").value = s.site.tipo || "site"; $("fSitePaginas").value = s.site.paginas || 1; $("fSitePrazo").value = s.site.prazoDiasUteis != null ? s.site.prazoDiasUteis : 10; $("fSiteRevisoes").value = s.site.revisoes != null ? s.site.revisoes : 2; $("fSiteHosp").checked = s.site.hospedagemInclusa !== false; }
    $("chkTrafego").checked = !!s.trafego;
    if (s.trafego) { $("fPlataformas").value = s.trafego.plataformas || "Meta Ads e Google Ads"; $("fRelatorio").checked = s.trafego.relatorioMensal !== false; }
    $("chkCriativos").checked = !!s.criativos;
    if (s.criativos) $("fCriativosQtd").value = s.criativos.qtdMes || 8;
    $("fOutros").value = s.outros || "";

    $("chkUnico").checked = !!f.unico;
    if (f.unico) { $("fUnicoDesc").value = f.unico.descricao || ""; $("fUnicoValor").value = f.unico.valor || ""; $("fUnicoTabela").value = f.unico.valorTabela || ""; setPreset(presetDe(f.unico.parcelas || []), f.unico.parcelas); }
    else setPreset("100a");
    $("chkMensal").checked = !!f.mensal;
    if (f.mensal) {
      $("fMensalDesc").value = f.mensal.descricao || ""; $("fMensalValor").value = f.mensal.valor || ""; $("fMensalTabela").value = f.mensal.valorTabela || "";
      $("fMeses").value = f.mensal.meses || 0; $("fInicio").value = f.mensal.inicio || "assinatura"; $("fDiaVenc").value = f.mensal.diaVencimento || ""; $("fAvisoDias").value = f.mensal.avisoDias != null ? f.mensal.avisoDias : 30;
      $("fEscalonamento").value = (f.mensal.escalonamento || []).map(function (e) { return e.aPartirDoMes + " | " + e.valor; }).join("\n");
    }
    $("fCortesias").value = (f.cortesias || []).map(function (c) { return c.descricao + (c.valorTabela ? " | " + c.valorTabela : ""); }).join("\n");
    $("fVerba").value = f.verbaMidia ? f.verbaMidia.valorMes : "";
    $("fVerbaDestino").value = f.verbaMidia ? f.verbaMidia.destino : "";
    aplicarGrupos();
  }

  /* ---- consulta CNPJ (BrasilAPI) ---- */
  $("btnBuscarCnpj").addEventListener("click", function () {
    var d = $("fCnpjBusca").value.replace(/\D/g, ""), hint = $("cnpjHint");
    if (d.length !== 14) { hint.textContent = "Digite um CNPJ com 14 dígitos."; return; }
    var b = $("btnBuscarCnpj");
    b.disabled = true; hint.textContent = "Consultando a Receita…";
    fetch("https://brasilapi.com.br/api/cnpj/v1/" + d)
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (j) {
        $("fRazao").value = j.razao_social || "";
        if (!$("fNomeExib").value) $("fNomeExib").value = j.nome_fantasia || j.razao_social || "";
        $("fDoc").value = U.formatarDoc(d);
        $("fEndereco").value = [[j.descricao_tipo_de_logradouro, j.logradouro].filter(Boolean).join(" "), j.numero, j.complemento, j.bairro].filter(Boolean).join(", ");
        $("fCidadeUf").value = j.municipio ? j.municipio + "/" + (j.uf || "") : "";
        $("fCep").value = j.cep ? String(j.cep).replace(/^(\d{5})(\d{3})$/, "$1-$2") : "";
        if (j.email && !$("fContatoEmail").value) $("fContatoEmail").value = j.email;
        if (j.ddd_telefone_1 && !$("fContatoTel").value) $("fContatoTel").value = j.ddd_telefone_1;
        sugerirSiglaNoForm();
        hint.textContent = "Dados preenchidos automaticamente. Confira e ajuste se precisar.";
      })
      .catch(function () { hint.textContent = "Não foi possível consultar esse CNPJ agora. Preencha os campos à mão."; })
      .finally(function () { b.disabled = false; });
  });

  function sugerirSigla(nome) {
    var limpo = String(nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 ]+/g, " ").trim().toUpperCase();
    var pal = limpo.split(/\s+/).filter(function (p) { return p && ["DE", "DA", "DO", "DAS", "DOS", "E", "LTDA", "ME", "EPP", "SA"].indexOf(p) < 0; });
    if (!pal.length) return "VL";
    if (pal.length >= 2) return (pal[0][0] + pal[1][0]);
    return pal[0].slice(0, 2);
  }
  function sugerirSiglaNoForm() {
    if (!$("fSigla").value) $("fSigla").value = sugerirSigla($("fNomeExib").value || $("fRazao").value);
  }
  $("fNomeExib").addEventListener("blur", sugerirSiglaNoForm);

  /* ---- abrir / limpar / preencher ---- */
  function limparForm() {
    document.querySelectorAll("#viewForm input:not([type=checkbox]), #viewForm textarea").forEach(function (i) { i.value = ""; });
    $("fValidaDias").value = "7"; $("fSitePaginas").value = "1"; $("fSitePrazo").value = "10"; $("fSiteRevisoes").value = "2";
    $("fPlataformas").value = "Meta Ads e Google Ads"; $("fCriativosQtd").value = "8"; $("fMeses").value = "0"; $("fAvisoDias").value = "30";
    $("fSiteTipo").value = "site"; $("fInicio").value = "assinatura";
    ["chkSite", "chkTrafego", "chkCriativos", "chkUnico", "chkMensal"].forEach(function (id) { $(id).checked = false; });
    $("fSiteHosp").checked = true; $("fRelatorio").checked = true;
    setPreset("100a");
    $("blocosWrap").innerHTML = "";
    $("formErr").textContent = "";
    aplicarGrupos();
  }

  function abrirForm(id) {
    limparForm();
    estado.editandoId = id;
    $("formTitulo").textContent = id ? "Editar contrato" : "Novo contrato";
    if (!id) { addBloco(); mostrar("viewForm"); return; }
    api("/api/contratos/" + id).then(function (c) { preencherForm(c); mostrar("viewForm"); }).catch(function (e) { toast(e.message); });
  }

  function preencherForm(c) {
    var ct = c.contratante || {};
    $("fNumero").value = c.numero || ""; $("fSigla").value = (c.numero || "").split("-")[0] || "";
    $("fValidaDias").value = (c.proposta && c.proposta.validaDias) || "7";
    $("fRazao").value = ct.razaoSocial || ""; $("fNomeExib").value = ct.nomeExibicao || ""; $("fDoc").value = ct.cnpjCpf || "";
    $("fCidadeUf").value = ct.cidadeUf || ""; $("fCep").value = ct.cep || ""; $("fEndereco").value = ct.endereco || "";
    $("fContatoNome").value = ct.contatoNome || ""; $("fContatoTel").value = ct.contatoTelefone || ""; $("fContatoEmail").value = ct.contatoEmail || "";
    $("fRepresentante").value = ct.representante || ""; $("fRepresentanteCpf").value = ct.representanteCpf || "";
    preencherPropostaServicoFinanceiro({ proposta: c.proposta, servico: c.servico, financeiro: c.financeiro });
    $("fEspeciais").value = (c.clausulasEspeciais || []).join("\n");
    $("fObservacoes").value = c.observacoes || "";
  }

  function parPipe(texto) {
    return linhas(texto).map(function (l) { var p = l.split("|"); return [p[0].trim(), Number(String(p[1] || "").replace(",", ".")) || 0]; });
  }

  function montarPropostaServicoFinanceiro() {
    var servico = {
      site: $("chkSite").checked ? { tipo: $("fSiteTipo").value, paginas: Number($("fSitePaginas").value) || 1, prazoDiasUteis: Number($("fSitePrazo").value) || 0, revisoes: Number($("fSiteRevisoes").value) || 0, hospedagemInclusa: $("fSiteHosp").checked } : null,
      trafego: $("chkTrafego").checked ? { plataformas: $("fPlataformas").value.trim(), relatorioMensal: $("fRelatorio").checked } : null,
      criativos: $("chkCriativos").checked ? { qtdMes: Number($("fCriativosQtd").value) || 8 } : null,
      outros: $("fOutros").value.trim()
    };
    var financeiro = {
      unico: $("chkUnico").checked ? { descricao: $("fUnicoDesc").value.trim(), valor: Number($("fUnicoValor").value) || 0, valorTabela: Number($("fUnicoTabela").value) || null, parcelas: lerParcelas() } : null,
      mensal: $("chkMensal").checked ? {
        descricao: $("fMensalDesc").value.trim(), valor: Number($("fMensalValor").value) || 0, valorTabela: Number($("fMensalTabela").value) || null,
        meses: Number($("fMeses").value) || 0, inicio: $("fInicio").value, diaVencimento: Number($("fDiaVenc").value) || null, avisoDias: Number($("fAvisoDias").value) || 30,
        escalonamento: parPipe($("fEscalonamento").value).map(function (p) { return { aPartirDoMes: Number(p[0]) || 2, valor: p[1] }; })
      } : null,
      cortesias: parPipe($("fCortesias").value).map(function (p) { return { descricao: p[0], valorTabela: p[1] || null }; }),
      verbaMidia: Number($("fVerba").value) > 0 ? { valorMes: Number($("fVerba").value), destino: $("fVerbaDestino").value.trim() } : null
    };
    var proposta = {
      titulo: $("fPropTitulo").value.trim(), lead: $("fPropLead").value.trim(), contexto: linhas($("fPropContexto").value),
      validaDias: Number($("fValidaDias").value) || 7, blocos: lerBlocos(), naoIncluso: $("fNaoIncluso").value.trim()
    };
    return { proposta: proposta, servico: servico, financeiro: financeiro };
  }

  function validarComum(psf) {
    if ($("chkUnico").checked && !(psf.financeiro.unico.valor > 0)) return "Preencha o valor do pagamento único.";
    if ($("chkMensal").checked && !(psf.financeiro.mensal.valor > 0)) return "Preencha o valor mensal.";
    if (psf.financeiro.unico) {
      var soma = psf.financeiro.unico.parcelas.reduce(function (t, x) { return t + x.pct; }, 0);
      if (soma !== 100) return "As parcelas somam " + soma + "%. Precisam somar 100%.";
    }
    return "";
  }

  $("btnSalvar").addEventListener("click", function () {
    var err = $("formErr");
    err.textContent = "";
    var psf = montarPropostaServicoFinanceiro();
    var problema = validarComum(psf);
    if (problema) { err.textContent = problema; return; }

    var p = {
      numero: $("fNumero").value.trim(), sigla: $("fSigla").value.trim(),
      contratante: {
        razaoSocial: $("fRazao").value, nomeExibicao: $("fNomeExib").value, cnpjCpf: $("fDoc").value, endereco: $("fEndereco").value, cidadeUf: $("fCidadeUf").value, cep: $("fCep").value,
        contatoNome: $("fContatoNome").value, contatoTelefone: $("fContatoTel").value, contatoEmail: $("fContatoEmail").value,
        representante: $("fRepresentante").value, representanteCpf: $("fRepresentanteCpf").value
      },
      proposta: psf.proposta, servico: psf.servico, financeiro: psf.financeiro,
      clausulasEspeciais: linhas($("fEspeciais").value), observacoes: $("fObservacoes").value.trim()
    };
    if (!p.contratante.razaoSocial.trim()) { err.textContent = "Preencha a razão social do cliente."; return; }
    var dig = p.contratante.cnpjCpf.replace(/\D/g, "");
    if (dig.length !== 11 && dig.length !== 14) { err.textContent = "Preencha um CNPJ (14 dígitos) ou CPF (11 dígitos) válido."; return; }
    if (!p.financeiro.unico && !p.financeiro.mensal && !p.financeiro.cortesias.length) { err.textContent = "Informe um valor único, um valor mensal ou ao menos uma cortesia."; return; }
    if (!p.proposta.blocos.some(function (b) { return b.objeto && b.itens.length; })) { err.textContent = "Marque ao menos um bloco com itens para entrar no objeto do contrato."; return; }

    var btn = $("btnSalvar");
    btn.disabled = true; btn.textContent = "Salvando…";
    var reqp = estado.editandoId
      ? api("/api/contratos/" + estado.editandoId, { method: "PATCH", body: JSON.stringify(p) })
      : api("/api/contratos", { method: "POST", body: JSON.stringify(p) });
    reqp.then(function () { btn.disabled = false; btn.textContent = "Salvar rascunho"; toast("Contrato salvo."); abrirLista(); })
      .catch(function (e) { btn.disabled = false; btn.textContent = "Salvar rascunho"; err.textContent = e.message; });
  });

  /* ============================ TELA PAGAMENTOS ============================ */
  $("btnPagamentos").addEventListener("click", abrirPagamentos);
  $("btnAtualizarPag").addEventListener("click", abrirPagamentos);
  $("btnVoltarPag").addEventListener("click", abrirLista);
  $("pagFiltro").addEventListener("change", renderPagamentos);
  $("pagPrevisoes").addEventListener("change", renderPagamentos);

  function abrirPagamentos() {
    mostrar("viewPagamentos");
    $("pagResumo").innerHTML = "";
    $("pagBody").innerHTML = '<tr><td colspan="7" class="empty">Carregando…</td></tr>';
    api("/api/contratos").then(function (lista) {
      estado.lista = lista;
      var hoje = U.hojeISO();
      var tarefas = [];
      lista.forEach(function (c) {
        if (c.status !== "assinado" && c.status !== "em_operacao") return;
        var pags = c.pagamentos || [];
        if (!pags.length) tarefas.push(patch(c, { acao: "gerar" }));
        else if (c.mensalAtivo && !pags.some(function (p) { return p.serie === "mensal" && p.vencimento && p.vencimento > hoje; })) tarefas.push(patch(c, { acao: "completar" }));
      });
      if (!tarefas.length) return renderPagamentos();
      $("pagBody").innerHTML = '<tr><td colspan="7" class="empty">Preparando cobranças…</td></tr>';
      return Promise.all(tarefas).then(renderPagamentos);
    }).catch(function (e) { $("pagBody").innerHTML = '<tr><td colspan="7" class="empty">' + esc(e.message) + "</td></tr>"; });
  }
  function patch(c, body) {
    return api("/api/contratos/" + c.id + "/pagamentos", { method: "PATCH", body: JSON.stringify(body) })
      .then(function (r) { c.pagamentos = r.pagamentos; })
      .catch(function () {});
  }
  function statusPagamento(p) {
    var hoje = U.hojeISO();
    if (p.pago) return { cls: "assinado", rotulo: "✓ Paga" };
    if (p.previsao) return { cls: "previsto", rotulo: "Previsão" };
    if (!p.vencimento) return { cls: "rascunho", rotulo: "Sem data" };
    if (p.vencimento < hoje) return { cls: "atrasada", rotulo: "Atrasada" };
    return { cls: "aguardando", rotulo: "A vencer" };
  }
  function renderPagamentos() {
    var hoje = U.hojeISO(), mes = hoje.slice(0, 7), filtro = $("pagFiltro").value, comPrev = $("pagPrevisoes").checked;
    var itens = [];
    (estado.lista || []).forEach(function (c) {
      (c.pagamentos || []).forEach(function (p) {
        if (p.previsao && !comPrev) return;
        if (filtro === "abertas" && p.pago) return;
        if (filtro === "atrasadas" && (p.pago || !p.vencimento || p.vencimento >= hoje || p.previsao)) return;
        if (filtro === "mes" && (!p.vencimento || p.vencimento.slice(0, 7) !== mes)) return;
        if (filtro === "pagas" && !p.pago) return;
        itens.push({ c: c, p: p });
      });
    });
    itens.sort(function (a, b) {
      var va = a.p.vencimento || "9999", vb = b.p.vencimento || "9999";
      if (va !== vb) return va.localeCompare(vb);
      return (a.c.numero || "").localeCompare(b.c.numero || "");
    });
    var t = totaisGestao(estado.lista, comPrev);
    // Esta tela é o mês corrente. O acumulado do ano fica na tela inicial.
    $("pagResumo").innerHTML =
      cardStat("Recebido este mês", U.moedaCurta(t.recebidoMes), U.moedaCurta(t.recebido) + " no ano", "ok") +
      cardStat("A receber este mês", U.moedaCurta(t.aReceberMes), U.moedaCurta(t.aReceber) + " em aberto no ano") +
      cardStat("Atrasado", U.moedaCurta(t.atrasado), "acumulado, de qualquer mês", "warn") +
      cardStat("Total do mês", U.moedaCurta(t.totalMes), "recebido mais a receber") +
      cardStat("Entrada única", U.moedaCurta(t.setupMes), "cobrança que não se repete") +
      cardStat("Recorrente por mês", U.moedaCurta(t.mrr),
        t.ativos + (t.ativos === 1 ? " contrato ativo" : " contratos ativos"));
    $("pagVazio").hidden = itens.length > 0;
    var anterior = null;
    $("pagBody").innerHTML = itens.map(function (it) {
      var st = statusPagamento(it.p);
      var primeira = it.c.id !== anterior; anterior = it.c.id;
      var dataCel = it.p.vencimento
        ? '<span class="data-txt" title="Clique para alterar">' + U.dataBR(it.p.vencimento) + "</span>"
        : '<span class="data-txt vazia" title="Clique para definir">definir data</span>';
      return '<tr class="' + (primeira ? "novo-contrato" : "") + '" data-cid="' + it.c.id + '" data-pid="' + esc(it.p.id) + '">' +
        '<td class="cel-data">' + dataCel + "</td>" +
        '<td><b class="num-contrato">' + esc(it.c.numero) + "</b></td>" +
        "<td>" + esc(it.c.cliente) + "</td>" +
        "<td>" + esc(it.p.descricao) + (it.p.quando ? '<br><span class="hint">' + esc(it.p.quando) + "</span>" : "") + "</td>" +
        "<td><b>" + U.moeda(it.p.valor) + "</b>" +
          (fatorCasa(it.c) < 1 ? '<br><span class="sub">sua parte ' + U.moedaCurta(it.p.valor * fatorCasa(it.c)) + "</span>" : "") + "</td>" +
        '<td><span class="badge ' + st.cls + '">' + st.rotulo + "</span></td>" +
        '<td><div class="acts">' + (it.p.pago ? '<button class="btn sec mini" data-pacao="desfazer">Desfazer</button>' : '<button class="btn sec mini" data-pacao="pagar">✓ Marcar pago</button>') + "</div></td></tr>";
    }).join("");
  }
  function acharPagamento(cid, pid) {
    var c = (estado.lista || []).find(function (x) { return x.id === cid; });
    var p = c && (c.pagamentos || []).find(function (x) { return x.id === pid; });
    return c && p ? { c: c, p: p } : null;
  }
  function salvarPagamentos(c) {
    return api("/api/contratos/" + c.id + "/pagamentos", { method: "PATCH", body: JSON.stringify({ pagamentos: c.pagamentos }) })
      .then(function (r) { c.pagamentos = r.pagamentos; renderPagamentos(); })
      .catch(function (e) { toast(e.message); abrirPagamentos(); });
  }
  $("pagBody").addEventListener("click", function (e) {
    var dt = e.target.closest(".data-txt");
    if (dt) return editarData(dt);
    var b = e.target.closest("button[data-pacao]");
    if (!b) return;
    var tr = b.closest("tr");
    var it = acharPagamento(tr.getAttribute("data-cid"), tr.getAttribute("data-pid"));
    if (!it) return;
    b.disabled = true;
    if (b.getAttribute("data-pacao") === "pagar") { it.p.pago = true; it.p.pagoEm = new Date().toISOString(); it.p.previsao = false; salvarPagamentos(it.c).then(function () { toast("Cobrança marcada como paga."); }); }
    else { it.p.pago = false; it.p.pagoEm = null; salvarPagamentos(it.c).then(function () { toast("Pagamento desfeito."); }); }
  });
  function editarData(span) {
    var tr = span.closest("tr");
    var it = acharPagamento(tr.getAttribute("data-cid"), tr.getAttribute("data-pid"));
    if (!it) return;
    var cel = span.parentNode, inp = document.createElement("input");
    inp.type = "date"; inp.className = "data-venc"; inp.value = it.p.vencimento || "";
    cel.innerHTML = ""; cel.appendChild(inp); inp.focus();
    if (inp.showPicker) { try { inp.showPicker(); } catch (e) {} }
    var fechado = false;
    function fechar(salvar) {
      if (fechado) return;
      fechado = true;
      var novo = inp.value || null;
      if (salvar && novo !== it.p.vencimento) { it.p.vencimento = novo; salvarPagamentos(it.c).then(function () { toast("Vencimento atualizado."); }); }
      else renderPagamentos();
    }
    inp.addEventListener("change", function () { fechar(true); });
    inp.addEventListener("blur", function () { fechar(true); });
    inp.addEventListener("keydown", function (ev) { if (ev.key === "Escape") fechar(false); if (ev.key === "Enter") fechar(true); });
  }

  /* ============================ TELA GESTÃO ANUAL ============================ */
  $("btnAnual").addEventListener("click", function () { abrirAnual(true); });
  $("btnAtualizarAnual").addEventListener("click", function () { abrirAnual(true); });
  $("btnVoltarAnual").addEventListener("click", abrirLista);

  function abrirAnual(recarregar) {
    mostrar("viewAnual");
    if (estado.anual && !recarregar) return renderAnual();
    $("anualResumo").innerHTML = "";
    $("anualCab").innerHTML = "";
    $("anualPe").innerHTML = "";
    $("anualBody").innerHTML = '<tr><td class="empty">Projetando…</td></tr>';
    api("/api/previsao").then(function (p) { estado.anual = p; renderAnual(); })
      .catch(function (e) { $("anualBody").innerHTML = '<tr><td class="empty">' + esc(e.message) + "</td></tr>"; });
  }

  function classeMes(mes, hoje) {
    var atual = hoje.slice(0, 7);
    if (mes === atual) return "mes-atual";
    return mes < atual ? "mes-passado" : "";
  }
  function celulaValor(v, cls) {
    if (!v) return '<td class="' + cls + '"><span class="zero">—</span></td>';
    return '<td class="' + cls + '">' + U.moedaCurta(v) + "</td>";
  }

  function renderAnual() {
    var p = estado.anual;
    if (!p) return;
    var temSemData = p.geral.semData > 0;

    $("anualResumo").innerHTML =
      cardStat("Previsto no período", U.moedaCurta(p.geral.total), mesCurto(p.meses[0]) + " a " + mesCurto(p.meses[p.meses.length - 1])) +
      cardStat("Já recebido", U.moedaCurta(p.geral.pago), "dentro do período", "ok") +
      cardStat("Ainda por receber", U.moedaCurta(p.geral.previsto), "se ninguém sair") +
      cardStat("Recorrente", U.moedaCurta(p.geral.mensal), "mensalidades somadas") +
      cardStat("Entrada única", U.moedaCurta(p.geral.unico), "setup e avulsos") +
      cardStat("Sem data", U.moedaCurta(p.geral.semData), temSemData ? "depende de uma etapa" : "nada pendente de data");

    $("anualCab").innerHTML = "<th>Contrato</th>" +
      p.meses.map(function (m) { return '<th class="' + classeMes(m, p.hoje) + '">' + mesCurto(m) + "</th>"; }).join("") +
      (temSemData ? "<th>Sem data</th>" : "") + "<th>Total</th>";

    $("anualVazio").hidden = p.linhas.length > 0;
    $("anualTabela").hidden = p.linhas.length === 0;
    $("anualBody").innerHTML = p.linhas.map(function (l) {
      return "<tr><td><b class=\"num-contrato\">" + esc(l.numero) + "</b><br>" + esc(l.cliente) +
        (l.participacao ? '<br><span class="sub">sua parte ' + Number(l.participacao.pct) + "%</span>" : "") + "</td>" +
        l.valores.map(function (v) { return celulaValor(v.total, classeMes(v.mes, p.hoje)); }).join("") +
        (temSemData ? celulaValor(l.semData, "") : "") +
        "<td><b>" + U.moedaCurta(l.total) + "</b></td></tr>";
    }).join("");

    var vazias = (temSemData ? 1 : 0);
    $("anualPe").innerHTML =
      "<tr><td>Total do mês</td>" +
        p.totais.map(function (t) { return celulaValor(t.total, classeMes(t.mes, p.hoje)); }).join("") +
        (temSemData ? celulaValor(p.geral.semData, "") : "") +
        "<td>" + U.moedaCurta(p.geral.total) + "</td></tr>" +
      '<tr class="comp"><td>recorrente</td>' +
        p.totais.map(function (t) { return celulaValor(t.mensal, classeMes(t.mes, p.hoje)); }).join("") +
        (vazias ? "<td></td>" : "") + "<td>" + U.moedaCurta(p.geral.mensal) + "</td></tr>" +
      '<tr class="comp"><td>entrada única</td>' +
        p.totais.map(function (t) { return celulaValor(t.unico, classeMes(t.mes, p.hoje)); }).join("") +
        (vazias ? "<td></td>" : "") + "<td>" + U.moedaCurta(p.geral.unico) + "</td></tr>";
  }

  /* ================================ BOOT ================================ */
  if (senha()) {
    if (location.hash === "#novo") abrirForm(null);
    else if (location.hash === "#pagamentos") abrirPagamentos();
    else if (location.hash === "#anual") abrirAnual();
    else abrirLista();
  } else {
    mostrar("viewLogin");
  }
})();
