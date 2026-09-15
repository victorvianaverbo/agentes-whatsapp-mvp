/* Painel de gestão de contratos da Vértice Labs: login, lista, criar/editar,
   enviar, assinar como CONTRATADA, pagamentos, modelos, contratos legados. */
(function () {
  "use strict";
  var U = window.VerticeUtil;
  var esc = U.esc;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = "vertice_admin_senha";
  var CACHE_LISTA = "vertice_lista_cache";

  var estado = {
    lista: [], editandoId: null, assinandoId: null, statusId: null,
    modelos: null, modelosSha: null, modoForm: "contrato", editandoModeloId: null, modeloAnterior: ""
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
    ["viewLogin", "viewLista", "viewForm", "viewModelos", "viewPagamentos"].forEach(function (v) { $(v).hidden = (v !== view); });
    window.scrollTo(0, 0);
  }

  function linhas(texto) {
    return String(texto || "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
  }

  /* ================================ LOGIN ================================ */
  function logout() {
    try { sessionStorage.removeItem(KEY); sessionStorage.removeItem(CACHE_LISTA); } catch (e) {}
    estado.lista = []; estado.modelos = null;
    mostrar("viewLogin");
  }
  function prefetchModelos() {
    var ocioso = window.requestIdleCallback || function (fn) { setTimeout(fn, 400); };
    ocioso(function () { carregarModelos().catch(function () {}); });
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
        abrirLista(); prefetchModelos();
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

  var ROTULOS = { rascunho: "Rascunho", proposta: "Só proposta", expirada: "Expirada", substituido: "Substituído", terceiro: "Terceiro", encerrado: "Encerrado", assinado: "✓ Assinado" };
  function badge(c) {
    if (c.status === "aguardando_assinaturas") {
      var n = (c.assinaturas.contratante ? 1 : 0) + (c.assinaturas.contratada ? 1 : 0);
      return '<span class="badge aguardando">' + n + "/2 assinaturas</span>";
    }
    var cls = c.status === "assinado" ? "assinado" : c.status;
    var extra = c.status === "assinado" && c.mensalAtivo ? " · mensal ativo" : "";
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
  function filtrar(lista) {
    var q = ($("busca").value || "").trim().toLowerCase();
    var f = $("filtroStatus").value;
    return lista.filter(function (c) {
      if (q && (c.cliente + " " + c.numero).toLowerCase().indexOf(q) < 0) return false;
      if (!f) return true;
      if (f === "ativos") return c.status === "assinado" && c.mensalAtivo;
      if (f === "encerrado") return ["encerrado", "substituido", "expirada", "terceiro"].indexOf(c.status) >= 0;
      return c.status === f;
    });
  }
  $("busca").addEventListener("input", renderLista);
  $("filtroStatus").addEventListener("change", renderLista);

  function renderLista() {
    var todos = estado.lista || [];
    var ativos = todos.filter(function (c) { return c.status === "assinado" && c.mensalAtivo; });
    var mrr = ativos.reduce(function (t, c) { return t + (c.valorMensal || 0) * fatorCasa(c); }, 0);
    var aReceber = todos.reduce(function (t, c) { return t + (c.aReceber || 0) * fatorCasa(c); }, 0);
    var atrasado = todos.reduce(function (t, c) { return t + (c.atrasado || 0) * fatorCasa(c); }, 0);
    $("listaResumo").innerHTML =
      '<div class="stat"><span class="sl">Contratos</span><span class="sv">' + todos.length + "</span></div>" +
      '<div class="stat"><span class="sl">Mensal ativo</span><span class="sv">' + U.moedaCurta(mrr) + '<span class="sub"> /mês · ' + ativos.length + "</span></span></div>" +
      '<div class="stat"><span class="sl">A receber</span><span class="sv">' + U.moedaCurta(aReceber) + "</span></div>" +
      '<div class="stat"><span class="sl">Atrasado</span><span class="sv" style="color:var(--warn)">' + U.moedaCurta(atrasado) + "</span></div>";

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
        if (c.status === "assinado" && c.mensalAtivo) acts.push(bt("Encerrar mensal", "encerrar", c.id));
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
        if (c.status === "assinado" && c.mensalAtivo) acts.push(bt("Encerrar mensal", "encerrar", c.id));
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

  /* ============================ FORM (contrato / modelo) ============================ */
  $("btnNovo").addEventListener("click", function () { abrirForm(null); });
  $("btnVoltar").addEventListener("click", function () { estado.modoForm === "modelo" ? abrirModelos() : abrirLista(); });

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

  /* ---- modelos: carga e aplicação ---- */
  function carregarModelos(force) {
    if (estado.modelos && !force) return Promise.resolve(estado.modelos);
    return api("/api/modelos").then(function (r) { estado.modelos = r.modelos; estado.modelosSha = r.sha; return r.modelos; });
  }
  function popularSeletorModelos() {
    var sel = $("fModelo"), atual = sel.value;
    sel.innerHTML = '<option value="">— começar em branco —</option>';
    (estado.modelos || []).forEach(function (m) {
      var op = document.createElement("option"); op.value = m.id; op.textContent = m.nome; sel.appendChild(op);
    });
    sel.value = atual || "";
  }
  $("fModelo").addEventListener("change", function () {
    var id = this.value;
    if (!id) { estado.modeloAnterior = ""; return; }
    var m = (estado.modelos || []).find(function (x) { return x.id === id; });
    if (!m) return;
    var temConteudo = $("fPropTitulo").value.trim() || lerBlocos().length;
    if (temConteudo && !confirm('Aplicar o modelo "' + m.nome + '" substitui proposta, serviço e financeiro já preenchidos. Continuar?')) { this.value = estado.modeloAnterior; return; }
    estado.modeloAnterior = id;
    preencherPropostaServicoFinanceiro(m);
  });

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
    $("fModelo").value = ""; estado.modeloAnterior = "";
    aplicarGrupos();
  }

  function modoForm(modo) {
    estado.modoForm = modo;
    var modelo = modo === "modelo";
    $("fsModelo").hidden = modelo; $("fsNumero").hidden = modelo; $("fsContratante").hidden = modelo; $("fsEspeciais").hidden = modelo;
    $("fsModeloNome").hidden = !modelo;
    $("btnSalvar").textContent = modelo ? "Salvar modelo" : "Salvar rascunho";
  }

  function abrirForm(id) {
    limparForm();
    modoForm("contrato");
    estado.editandoId = id;
    $("formTitulo").textContent = id ? "Editar contrato" : "Novo contrato";
    carregarModelos().then(popularSeletorModelos).catch(function () { toast("Não foi possível carregar os modelos. O formulário segue em branco."); });
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

    if (estado.modoForm === "modelo") {
      var nome = $("mNome").value.trim();
      if (!nome) { err.textContent = "Dê um nome ao modelo."; return; }
      var m = Object.assign({ id: estado.editandoModeloId || "", nome: nome }, psf.proposta, { servico: psf.servico, financeiro: psf.financeiro });
      var lista = (estado.modelos || []).slice();
      var i = lista.findIndex(function (x) { return x.id === estado.editandoModeloId; });
      if (estado.editandoModeloId && i >= 0) lista[i] = m; else lista.push(m);
      salvarModelos(lista, $("btnSalvar"), "Modelo salvo.").then(function (ok) { if (ok) abrirModelos(); });
      return;
    }

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

  /* ============================ TELA MODELOS ============================ */
  $("btnModelos").addEventListener("click", abrirModelos);
  $("btnVoltarModelos").addEventListener("click", abrirLista);
  $("btnNovoModelo").addEventListener("click", function () { abrirModeloForm(null); });

  function abrirModelos() {
    mostrar("viewModelos");
    $("modelosBody").innerHTML = '<tr><td colspan="4" class="empty">Carregando…</td></tr>';
    carregarModelos(true).then(renderListaModelos).catch(function (e) { $("modelosBody").innerHTML = '<tr><td colspan="4" class="empty">' + esc(e.message) + "</td></tr>"; });
  }
  function resumoFin(f) {
    f = f || {};
    var p = [];
    if (f.unico) p.push(U.moedaCurta(f.unico.valor) + " único");
    if (f.mensal) p.push(U.moedaCurta(f.mensal.valor) + "/mês");
    if ((f.cortesias || []).length) p.push("cortesia");
    return p.join(" + ") || "—";
  }
  function renderListaModelos() {
    var lista = estado.modelos || [];
    $("modelosVazio").hidden = lista.length > 0;
    $("modelosBody").innerHTML = lista.map(function (m) {
      return "<tr><td><b>" + esc(m.nome) + "</b></td><td>" + esc(resumoFin(m.financeiro)) + "</td><td>" + esc(m.titulo || "—") + "</td>" +
        '<td><div class="acts"><button class="btn sec mini" data-macao="editar" data-id="' + esc(m.id) + '">Editar</button>' +
        '<button class="btn sec mini danger" data-macao="excluir" data-id="' + esc(m.id) + '">Excluir</button></div></td></tr>';
    }).join("");
  }
  $("modelosBody").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-macao]");
    if (!b) return;
    var id = b.getAttribute("data-id");
    if (b.getAttribute("data-macao") === "editar") abrirModeloForm(id); else excluirModelo(id, b);
  });
  function abrirModeloForm(id) {
    limparForm();
    modoForm("modelo");
    estado.editandoModeloId = id;
    $("formTitulo").textContent = id ? "Editar modelo" : "Novo modelo";
    $("mNome").value = "";
    var m = id ? (estado.modelos || []).find(function (x) { return x.id === id; }) : null;
    if (m) { $("mNome").value = m.nome || ""; preencherPropostaServicoFinanceiro(m); }
    else addBloco();
    mostrar("viewForm");
  }
  function salvarModelos(lista, btn, msgOk) {
    if (btn) btn.disabled = true;
    return api("/api/modelos", { method: "PUT", body: JSON.stringify({ modelos: lista, sha: estado.modelosSha }) })
      .then(function (r) { estado.modelos = r.modelos; estado.modelosSha = r.sha; if (btn) btn.disabled = false; toast(msgOk); return true; })
      .catch(function (e) { if (btn) btn.disabled = false; toast(e.message); if (/outra sessão/i.test(e.message)) carregarModelos(true).then(renderListaModelos); return false; });
  }
  function excluirModelo(id, b) {
    var m = (estado.modelos || []).find(function (x) { return x.id === id; }) || {};
    if (!confirm('Excluir o modelo "' + (m.nome || id) + '"? Contratos já criados não são afetados.')) return;
    salvarModelos((estado.modelos || []).filter(function (x) { return x.id !== id; }), b, "Modelo excluído.").then(function (ok) { if (ok) renderListaModelos(); });
  }

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
        if (c.status !== "assinado") return;
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
    var recebido = 0, aReceber = 0, atrasado = 0, doMes = 0;
    // Setup x recorrente: toda cobrança que não é da série mensal conta como setup/avulsa.
    var setupTotal = 0, setupRecebido = 0, mensalTotal = 0, mensalRecebido = 0;
    (estado.lista || []).forEach(function (c) {
      var fc = fatorCasa(c);
      (c.pagamentos || []).forEach(function (p) {
        if (p.previsao && !comPrev) return;
        var v = p.valor * fc;
        if (p.serie === "mensal") { mensalTotal += v; if (p.pago) mensalRecebido += v; }
        else { setupTotal += v; if (p.pago) setupRecebido += v; }
        if (p.pago) { recebido += v; return; }
        aReceber += v;
        if (p.vencimento && p.vencimento < hoje && !p.previsao) atrasado += v;
        if (p.vencimento && p.vencimento.slice(0, 7) === mes) doMes += v;
      });
    });
    // Recorrente por mês (MRR): só contratos assinados com mensalidade ativa, sem depender da agenda.
    var mrr = 0, ativos = 0;
    (estado.lista || []).forEach(function (c) {
      if (!c.mensalAtivo) return;
      mrr += (Number(c.valorMensal) || 0) * fatorCasa(c);
      ativos++;
    });
    $("pagResumo").innerHTML =
      '<div class="stat"><span class="sl">A receber</span><span class="sv">' + U.moedaCurta(aReceber) + "</span></div>" +
      '<div class="stat"><span class="sl">Atrasado</span><span class="sv" style="color:var(--warn)">' + U.moedaCurta(atrasado) + "</span></div>" +
      '<div class="stat"><span class="sl">Vence este mês</span><span class="sv">' + U.moedaCurta(doMes) + "</span></div>" +
      '<div class="stat"><span class="sl">Recebido</span><span class="sv" style="color:var(--ok)">' + U.moedaCurta(recebido) + "</span></div>" +
      '<div class="stat"><span class="sl">Setup / avulso</span><span class="sv">' + U.moedaCurta(setupTotal) +
        '</span><span class="sx">' + U.moedaCurta(setupRecebido) + " recebido</span></div>" +
      '<div class="stat"><span class="sl">Recorrente por mês</span><span class="sv">' + U.moedaCurta(mrr) +
        '</span><span class="sx">' + ativos + (ativos === 1 ? " contrato ativo · " : " contratos ativos · ") +
        U.moedaCurta(mensalRecebido) + " de " + U.moedaCurta(mensalTotal) + " recebido</span></div>";
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

  /* ================================ BOOT ================================ */
  if (senha()) {
    if (location.hash === "#novo") abrirForm(null);
    else if (location.hash === "#modelos") abrirModelos();
    else if (location.hash === "#pagamentos") abrirPagamentos();
    else abrirLista();
    prefetchModelos();
  } else {
    mostrar("viewLogin");
  }
})();
