/* Painel de gestão de contratos — login, lista, criar/editar, enviar,
   assinar como CONTRATADO, copiar link, excluir. */
(function () {
  "use strict";
  var U = window.IlumeUtil;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = "ilume_admin_senha";

  var estado = {
    lista: [], editandoId: null, tipo: "pontual", assinandoId: null,
    modelos: null, modelosSha: null, editandoModeloId: null, tipoModelo: "pontual", modeloAnterior: ""
  };

  function senha() { try { return sessionStorage.getItem(KEY) || ""; } catch (e) { return ""; } }

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ Authorization: "Bearer " + senha() }, opts.headers || {});
    if (opts.body && !opts.headers["Content-Type"]) opts.headers["Content-Type"] = "application/json";
    return fetch(path, opts).then(function (r) {
      if (r.status === 401) { logout(); throw new Error("Sessão expirada — faça login de novo."); }
      if (r.status === 204) return null;
      return r.json().then(function (b) {
        if (!r.ok) throw new Error(b && b.erro ? b.erro : "Erro " + r.status);
        return b;
      });
    });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function mostrar(view) {
    ["viewLogin", "viewLista", "viewForm", "viewModelos", "viewModeloForm"].forEach(function (v) { $(v).hidden = (v !== view); });
  }

  /* ================================ LOGIN ================================ */
  function logout() {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    mostrar("viewLogin");
  }

  $("loginBtn").addEventListener("click", entrar);
  $("loginSenha").addEventListener("keydown", function (e) { if (e.key === "Enter") entrar(); });

  function entrar() {
    var s = $("loginSenha").value;
    if (!s) { $("loginErr").textContent = "Digite a senha."; return; }
    $("loginBtn").disabled = true;
    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha: s })
    }).then(function (r) {
      $("loginBtn").disabled = false;
      if (!r.ok) { $("loginErr").textContent = "Senha incorreta."; return; }
      try { sessionStorage.setItem(KEY, s); } catch (e) {}
      $("loginSenha").value = "";
      $("loginErr").textContent = "";
      abrirLista();
    }).catch(function () {
      $("loginBtn").disabled = false;
      $("loginErr").textContent = "Erro de conexão. Tente de novo.";
    });
  }

  $("btnSair").addEventListener("click", logout);
  $("btnAtualizar").addEventListener("click", abrirLista);

  /* ================================ LISTA ================================ */
  function abrirLista() {
    mostrar("viewLista");
    $("listaBody").innerHTML = '<tr><td colspan="5" class="empty">Carregando…</td></tr>';
    api("/api/contratos").then(function (lista) {
      estado.lista = lista;
      renderLista();
    }).catch(function (e) {
      $("listaBody").innerHTML = '<tr><td colspan="5" class="empty">' + esc(e.message) + "</td></tr>";
    });
  }

  function badge(c) {
    if (c.status === "assinado") return '<span class="badge assinado">✓ Assinado</span>';
    if (c.status === "aguardando_assinaturas") {
      var n = (c.assinaturas.contratante ? 1 : 0) + (c.assinaturas.contratado ? 1 : 0);
      return '<span class="badge aguardando">' + n + "/2 assinaturas</span>";
    }
    return '<span class="badge rascunho">Rascunho</span>';
  }

  function renderLista() {
    var body = $("listaBody");
    $("listaVazia").hidden = estado.lista.length > 0;
    body.innerHTML = estado.lista.map(function (c) {
      var acts = [];
      if (c.status === "rascunho") {
        acts.push(bt("Visualizar", "ver", c.id));
        acts.push(bt("Editar", "editar", c.id));
        acts.push(bt("Enviar ao cliente", "enviar", c.id));
      } else {
        acts.push(bt("Copiar link", "link", c.id));
        acts.push(bt("Ver", "ver", c.id));
        acts.push(bt("Baixar", "baixar", c.id));
        if (c.status === "aguardando_assinaturas" && !c.assinaturas.contratado) {
          acts.push(bt("Assinar", "assinar", c.id));
        }
      }
      acts.push(bt("Excluir", "excluir", c.id, "danger"));
      return "<tr><td><b>" + esc(c.numero) + '</b><br><span class="tipo-tag">' + esc(c.tipo) + "</span></td>" +
        "<td>" + esc(c.cliente) + "</td>" +
        "<td>" + U.moeda(c.valorTotal) + "</td>" +
        "<td>" + badge(c) + "</td>" +
        '<td><div class="acts">' + acts.join("") + "</div></td></tr>";
    }).join("");
  }

  function bt(rotulo, acao, id, extra) {
    return '<button class="btn sec mini ' + (extra || "") + '" data-acao="' + acao + '" data-id="' + id + '">' + rotulo + "</button>";
  }

  $("listaBody").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-acao]");
    if (!b) return;
    var id = b.getAttribute("data-id"), acao = b.getAttribute("data-acao");
    if (acao === "editar") abrirForm(id);
    if (acao === "enviar") enviar(id, b);
    if (acao === "link") copiarLink(id);
    if (acao === "ver") window.open("contrato.html?id=" + id, "_blank");
    if (acao === "baixar") window.open("contrato.html?id=" + id + "#baixar", "_blank");
    if (acao === "assinar") abrirAssinar(id);
    if (acao === "excluir") excluir(id, b);
  });

  function linkContrato(id) { return location.origin + "/contrato.html?id=" + id; }

  function copiarLink(id) {
    var url = linkContrato(id);
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
      .then(function () { toast("Link copiado! Envie ao cliente pelo WhatsApp."); })
      .catch(function () { prompt("Copie o link do contrato:", url); });
  }

  function enviar(id, b) {
    if (!confirm("Enviar este contrato? Depois de enviado ele não pode mais ser editado — só assinado ou excluído.")) return;
    b.disabled = true;
    api("/api/contratos/" + id, { method: "PATCH", body: JSON.stringify({ acao: "enviar" }) })
      .then(function () { copiarLink(id); abrirLista(); })
      .catch(function (e) { b.disabled = false; toast(e.message); });
  }

  function excluir(id, b) {
    var c = estado.lista.find(function (x) { return x.id === id; }) || {};
    if (!confirm("Excluir o contrato " + (c.numero || "") + " (" + (c.cliente || "") + ")? Essa ação não pode ser desfeita.")) return;
    b.disabled = true;
    api("/api/contratos/" + id, { method: "DELETE" })
      .then(function () { toast("Contrato excluído."); abrirLista(); })
      .catch(function (e) { b.disabled = false; toast(e.message); });
  }

  /* ============================ ASSINAR (ILUME) ============================ */
  var dlg = $("dlgAssinar");
  function abrirAssinar(id) {
    var c = estado.lista.find(function (x) { return x.id === id; }) || {};
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
      body: JSON.stringify({
        parte: "contratado",
        nome: $("asNome").value.trim(),
        cpfCnpj: $("asDoc").value.trim(),
        email: $("asEmail").value.trim(),
        aceite: true
      })
    }).then(function (res) {
      btn.disabled = false; btn.textContent = "Assinar contrato";
      dlg.close();
      toast(res.status === "assinado" ? "Contrato assinado pelas duas partes! 🎉" : "Assinatura registrada. Aguardando o cliente.");
      abrirLista();
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = "Assinar contrato";
      err.textContent = e.message;
    });
  });

  /* ============================ FORM (criar/editar) ============================ */
  $("btnNovo").addEventListener("click", function () { abrirForm(null); });
  $("btnVoltar").addEventListener("click", abrirLista);

  document.querySelectorAll("#segTipo button").forEach(function (b) {
    b.addEventListener("click", function () { setTipo(b.getAttribute("data-v")); });
  });

  function setTipo(t) {
    estado.tipo = t;
    document.querySelectorAll("#segTipo button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-v") === t);
    });
    $("fsPontual").hidden = t !== "pontual";
    $("fsFinPontual").hidden = t !== "pontual";
    $("fsRecorrente").hidden = t !== "recorrente";
    $("fsFinRecorrente").hidden = t !== "recorrente";
  }

  /* ---- blocos da proposta (reusado no editor de modelos via wrap) ---- */
  function addBloco(titulo, itens, wrap) {
    var div = document.createElement("div");
    div.className = "bloco-item";
    div.innerHTML = '<label class="f">Título do bloco<input class="bTitulo" value="' + esc(titulo || "") + '"></label>' +
      '<label class="f">Itens (um por linha)<textarea class="bItens">' + esc((itens || []).join("\n")) + "</textarea></label>" +
      '<button class="btn danger mini" type="button" style="align-self:flex-start">Remover bloco</button>';
    div.querySelector("button").addEventListener("click", function () { div.remove(); });
    (wrap || $("blocosWrap")).appendChild(div);
  }
  $("btnAddBloco").addEventListener("click", function () { addBloco("", []); });
  $("btnAddBlocoM").addEventListener("click", function () { addBloco("", [], $("mBlocosWrap")); });

  function lerBlocos(wrapSel) {
    return Array.prototype.map.call(document.querySelectorAll(wrapSel + " .bloco-item"), function (div) {
      return { titulo: div.querySelector(".bTitulo").value.trim(), itens: linhas(div.querySelector(".bItens").value) };
    }).filter(function (b) { return b.titulo || b.itens.length; });
  }

  /* ---- parcelas personalizadas (pontual; reusado no editor de modelos) ---- */
  function addParcela(pct, gatilho, wrap) {
    var div = document.createElement("div");
    div.className = "bloco-item";
    div.innerHTML = '<div class="grid2">' +
      '<label class="f">% do total<input class="pPct" type="number" min="1" max="100" value="' + (pct || "") + '"></label>' +
      '<label class="f">Quando<input class="pGatilho" value="' + esc(gatilho || "") + '" placeholder="em até 24h após a assinatura"></label>' +
      '</div><button class="btn danger mini" type="button" style="align-self:flex-start">Remover</button>';
    div.querySelector("button").addEventListener("click", function () { div.remove(); });
    (wrap || $("parcelasWrap")).appendChild(div);
  }
  $("btnAddParcela").addEventListener("click", function () { addParcela("", ""); });
  $("btnAddParcelaM").addEventListener("click", function () { addParcela("", "", $("mParcelasWrap")); });

  function lerParcelas(wrapSel) {
    return Array.prototype.map.call(document.querySelectorAll(wrapSel + " .bloco-item"), function (div) {
      return { pct: Number(div.querySelector(".pPct").value) || 0, gatilho: div.querySelector(".pGatilho").value.trim() };
    }).filter(function (p) { return p.pct > 0; });
  }

  var PARCELAS_5050 = [
    { pct: 50, gatilho: "em até 24h após a assinatura do contrato" },
    { pct: 50, gatilho: "em até 24h após a entrega do material editado" }
  ];

  function setPreset(selId, wrapId, btnId, preset, parcelas) {
    $(selId).value = preset;
    var custom = preset === "custom";
    $(wrapId).style.display = custom ? "flex" : "none";
    $(btnId).style.display = custom ? "inline-flex" : "none";
    $(wrapId).innerHTML = "";
    if (custom) {
      (parcelas && parcelas.length ? parcelas : PARCELAS_5050).forEach(function (p) {
        addParcela(p.pct, p.gatilho, $(wrapId));
      });
    }
  }
  $("fPreset").addEventListener("change", function () { setPreset("fPreset", "parcelasWrap", "btnAddParcela", this.value); });
  $("mPreset").addEventListener("change", function () { setPreset("mPreset", "mParcelasWrap", "btnAddParcelaM", this.value); });

  /* ---- visibilidade dos grupos opcionais do serviço pontual ---- */
  function aplicarVisibilidadeGrupos() {
    $("grpVideosCortes").hidden = !$("chkVideos").checked;
    $("grpGravacao").hidden = !$("chkGravacao").checked;
  }
  $("chkVideos").addEventListener("change", aplicarVisibilidadeGrupos);
  $("chkGravacao").addEventListener("change", aplicarVisibilidadeGrupos);

  /* ---- modelos de serviço: carga e aplicação no form ---- */
  function carregarModelos(force) {
    if (estado.modelos && !force) return Promise.resolve(estado.modelos);
    return api("/api/modelos").then(function (r) {
      estado.modelos = r.modelos;
      estado.modelosSha = r.sha;
      return r.modelos;
    });
  }

  function popularSeletorModelos() {
    var sel = $("fModelo");
    var atual = sel.value;
    sel.innerHTML = '<option value="">— começar em branco —</option>';
    var grupos = { pontual: [], recorrente: [] };
    (estado.modelos || []).forEach(function (m) { (grupos[m.tipo] || grupos.pontual).push(m); });
    [["pontual", "Pontual (projeto único)"], ["recorrente", "Recorrente (mensal)"]].forEach(function (g) {
      if (!grupos[g[0]].length) return;
      var og = document.createElement("optgroup");
      og.label = g[1];
      grupos[g[0]].forEach(function (m) {
        var op = document.createElement("option");
        op.value = m.id;
        op.textContent = m.nome;
        og.appendChild(op);
      });
      sel.appendChild(og);
    });
    sel.value = atual || "";
  }

  $("fModelo").addEventListener("change", function () {
    var id = this.value;
    if (!id) { estado.modeloAnterior = ""; return; }
    var m = (estado.modelos || []).find(function (x) { return x.id === id; });
    if (!m) return;
    var temConteudo = $("fPropTitulo").value.trim() || $("fPropLead").value.trim() || lerBlocos("#blocosWrap").length;
    if (temConteudo && !confirm('Aplicar o modelo "' + m.nome + '" substitui título, texto, blocos e campos de serviço já preenchidos. Continuar?')) {
      this.value = estado.modeloAnterior;
      return;
    }
    estado.modeloAnterior = id;
    aplicarModelo(m);
  });

  function aplicarModelo(m) {
    setTipo(m.tipo);
    $("fPropTitulo").value = m.titulo || "";
    $("fPropLead").value = m.lead || "";
    $("blocosWrap").innerHTML = "";
    (m.blocos || []).forEach(function (b) { addBloco(b.titulo, b.itens); });
    if (!(m.blocos || []).length) addBloco("", []);
    var sv = m.servico || {}, fin = m.financeiro || {};
    if (m.tipo === "pontual") {
      $("chkVideos").checked = !!m.mostrarVideosCortes;
      $("chkGravacao").checked = !!m.mostrarGravacao;
      aplicarVisibilidadeGrupos();
      $("fQtdVideos").value = sv.qtdVideos != null ? sv.qtdVideos : 1;
      $("fQtdCortes").value = sv.qtdCortes != null ? sv.qtdCortes : 0;
      $("fPrazoP").value = sv.prazoEntregaDias || 7;
      $("fHoraExc").value = sv.valorHoraExcedente || "";
      $("fObjeto").value = (sv.descricaoObjeto || []).join("\n");
      setPreset("fPreset", "parcelasWrap", "btnAddParcela", fin.preset || "5050", fin.parcelas);
    } else {
      $("fMeses").value = sv.meses || 3;
      $("fVideosMes").value = sv.videosMes || 4;
      $("fHorasMes").value = sv.horasMensais || 8;
      $("fPrazoR").value = sv.prazoEntregaDias || 7;
      $("fQtdParcelas").value = sv.meses || 3;
      $("fDiaVenc").value = fin.diaVencimento || 5;
      atualizarTotalRec();
    }
    // preço nunca vem do modelo: fValorTotal/fValorMensal ficam como estão
  }

  /* ---- total do recorrente ---- */
  function atualizarTotalRec() {
    var mensal = Number($("fValorMensal").value) || 0;
    var n = Number($("fQtdParcelas").value) || 0;
    $("hintTotalRec").textContent = "Valor total do contrato: " + U.moeda(mensal * n) + " (" + n + "× de " + U.moeda(mensal) + ")";
  }
  $("fValorMensal").addEventListener("input", atualizarTotalRec);
  $("fQtdParcelas").addEventListener("input", atualizarTotalRec);
  $("fMeses").addEventListener("input", function () { $("fQtdParcelas").value = this.value; atualizarTotalRec(); });

  /* ---- consulta CNPJ (BrasilAPI, direto do browser) ---- */
  $("btnBuscarCnpj").addEventListener("click", function () {
    var d = $("fCnpjBusca").value.replace(/\D/g, "");
    var hint = $("cnpjHint");
    if (d.length !== 14) { hint.textContent = "Digite um CNPJ com 14 dígitos."; return; }
    var b = $("btnBuscarCnpj");
    b.disabled = true; hint.textContent = "Consultando a Receita…";
    fetch("https://brasilapi.com.br/api/cnpj/v1/" + d)
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (j) {
        $("fRazao").value = j.razao_social || "";
        $("fNomeExib").value = j.nome_fantasia || j.razao_social || "";
        $("fDoc").value = U.formatarDoc(d);
        $("fEndereco").value = [
          [j.descricao_tipo_de_logradouro, j.logradouro].filter(Boolean).join(" "),
          j.numero, j.complemento, j.bairro
        ].filter(Boolean).join(", ");
        $("fCidadeUf").value = j.municipio ? j.municipio + "/" + (j.uf || "") : "";
        $("fCep").value = j.cep ? String(j.cep).replace(/^(\d{5})(\d{3})$/, "$1-$2") : "";
        if (j.email && !$("fContatoEmail").value) $("fContatoEmail").value = j.email;
        if (j.ddd_telefone_1 && !$("fContatoTel").value) $("fContatoTel").value = j.ddd_telefone_1;
        hint.textContent = "Dados preenchidos automaticamente — confira e ajuste se precisar.";
      })
      .catch(function () {
        hint.textContent = "Não foi possível consultar esse CNPJ agora. Preencha os campos manualmente.";
      })
      .finally(function () { b.disabled = false; });
  });

  /* ---- abrir form (novo ou edição) ---- */
  function limparForm() {
    ["fNumero", "fCnpjBusca", "fRazao", "fNomeExib", "fDoc", "fCidadeUf", "fCep", "fEndereco",
      "fContatoNome", "fContatoTel", "fContatoEmail", "fPropTitulo", "fPropLead",
      "fDataGrav", "fLocalGrav", "fObjeto", "fHoraExc", "fValorTotal", "fValorMensal"]
      .forEach(function (i) { $(i).value = ""; });
    $("fValidaDias").value = "7";
    $("fQtdVideos").value = "1"; $("fQtdCortes").value = "0"; $("fPrazoP").value = "7";
    $("fMeses").value = "3"; $("fVideosMes").value = "4"; $("fHorasMes").value = "8"; $("fPrazoR").value = "7";
    $("fQtdParcelas").value = "3"; $("fDiaVenc").value = "5";
    setPreset("fPreset", "parcelasWrap", "btnAddParcela", "5050");
    $("blocosWrap").innerHTML = "";
    $("formErr").textContent = "";
    $("fModelo").value = "";
    estado.modeloAnterior = "";
    $("chkVideos").checked = true;
    $("chkGravacao").checked = true;
    aplicarVisibilidadeGrupos();
    atualizarTotalRec();
  }

  function abrirForm(id) {
    limparForm();
    estado.editandoId = id;
    $("formTitulo").textContent = id ? "Editar rascunho" : "Novo contrato";
    setTipo("pontual");
    carregarModelos().then(popularSeletorModelos).catch(function () {
      toast("Não foi possível carregar os modelos — o formulário segue em branco.");
    });
    if (!id) { addBloco("", []); mostrar("viewForm"); return; }
    api("/api/contratos/" + id).then(function (c) {
      preencherForm(c);
      mostrar("viewForm");
    }).catch(function (e) { toast(e.message); });
  }

  function preencherForm(c) {
    var ct = c.contratante || {}, p = c.proposta || {}, s = c.servico || {}, f = c.financeiro || {};
    setTipo(c.tipo);
    $("fNumero").value = c.numero || "";
    $("fValidaDias").value = p.validaDias || "7";
    $("fRazao").value = ct.razaoSocial || "";
    $("fNomeExib").value = ct.nomeExibicao || "";
    $("fDoc").value = ct.cnpjCpf || "";
    $("fCidadeUf").value = ct.cidadeUf || "";
    $("fCep").value = ct.cep || "";
    $("fEndereco").value = ct.endereco || "";
    $("fContatoNome").value = ct.contatoNome || "";
    $("fContatoTel").value = ct.contatoTelefone || "";
    $("fContatoEmail").value = ct.contatoEmail || "";
    $("fPropTitulo").value = p.titulo || "";
    $("fPropLead").value = p.lead || "";
    (p.blocos || []).forEach(function (b) { addBloco(b.titulo, b.itens); });
    if (!(p.blocos || []).length) addBloco("", []);
    if (c.tipo === "pontual") {
      $("fQtdVideos").value = s.qtdVideos != null ? s.qtdVideos : "1";
      $("fQtdCortes").value = s.qtdCortes != null ? s.qtdCortes : "0";
      $("fPrazoP").value = s.prazoEntregaDias || "7";
      $("fHoraExc").value = s.valorHoraExcedente || "";
      $("fDataGrav").value = s.dataGravacao || "";
      $("fLocalGrav").value = s.localGravacao || "";
      $("fObjeto").value = (s.descricaoObjeto || []).join("\n");
      $("fValorTotal").value = f.valorTotal || "";
      $("chkVideos").checked = Number(s.qtdVideos) > 0 || Number(s.qtdCortes) > 0;
      $("chkGravacao").checked = !!(s.dataGravacao || s.localGravacao);
      aplicarVisibilidadeGrupos();
      var parcelas = f.parcelas || [];
      var assinatura5050 = parcelas.length === 2 && Number(parcelas[0].pct) === 50;
      var preset304030 = parcelas.length === 3 && Number(parcelas[0].pct) === 30;
      var preset = assinatura5050 ? "5050" : preset304030 ? "304030" : "custom";
      setPreset("fPreset", "parcelasWrap", "btnAddParcela", preset, parcelas);
    } else {
      $("fMeses").value = s.meses || "3";
      $("fVideosMes").value = s.videosMes || "4";
      $("fHorasMes").value = s.horasMensais || "8";
      $("fPrazoR").value = s.prazoEntregaDias || "7";
      $("fQtdParcelas").value = f.qtdParcelas || s.meses || "3";
      $("fDiaVenc").value = f.diaVencimento || "5";
      var n = Number(f.qtdParcelas) || 1;
      $("fValorMensal").value = f.valorTotal ? (Number(f.valorTotal) / n) : "";
      atualizarTotalRec();
    }
  }

  /* ---- montar payload e salvar ---- */
  var PRESETS = {
    "5050": [
      { pct: 50, gatilho: "em até 24h após a assinatura do contrato" },
      { pct: 50, gatilho: "em até 24h após a entrega do material editado" }
    ],
    "304030": [
      { pct: 30, gatilho: "no ato da assinatura do contrato" },
      { pct: 40, gatilho: "antes do início das gravações" },
      { pct: 30, gatilho: "na entrega do trabalho" }
    ]
  };

  function linhas(texto) {
    return String(texto || "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
  }

  function montarPayload() {
    var tipo = estado.tipo;
    var blocos = lerBlocos("#blocosWrap");

    var payload = {
      tipo: tipo,
      numero: $("fNumero").value.trim(),
      contratante: {
        razaoSocial: $("fRazao").value,
        nomeExibicao: $("fNomeExib").value,
        cnpjCpf: $("fDoc").value,
        endereco: $("fEndereco").value,
        cidadeUf: $("fCidadeUf").value,
        cep: $("fCep").value,
        contatoNome: $("fContatoNome").value,
        contatoTelefone: $("fContatoTel").value,
        contatoEmail: $("fContatoEmail").value
      },
      proposta: {
        titulo: $("fPropTitulo").value.trim(),
        lead: $("fPropLead").value.trim(),
        validaDias: Number($("fValidaDias").value) || 7,
        blocos: blocos
      }
    };

    if (tipo === "pontual") {
      var comVideos = $("chkVideos").checked;
      var comGravacao = $("chkGravacao").checked;
      payload.servico = {
        qtdVideos: comVideos ? Number($("fQtdVideos").value) || 0 : 0,
        qtdCortes: comVideos ? Number($("fQtdCortes").value) || 0 : 0,
        prazoEntregaDias: Number($("fPrazoP").value) || 7,
        valorHoraExcedente: Number($("fHoraExc").value) || 0,
        dataGravacao: comGravacao ? $("fDataGrav").value.trim() : "",
        localGravacao: comGravacao ? $("fLocalGrav").value.trim() : "",
        descricaoObjeto: linhas($("fObjeto").value)
      };
      var preset = $("fPreset").value;
      var parcelas = PRESETS[preset] || lerParcelas("#parcelasWrap");
      payload.financeiro = { valorTotal: Number($("fValorTotal").value) || 0, parcelas: parcelas };
    } else {
      var meses = Number($("fMeses").value) || 1;
      var qtdParcelas = Number($("fQtdParcelas").value) || meses;
      var mensal = Number($("fValorMensal").value) || 0;
      payload.servico = {
        meses: meses,
        videosMes: Number($("fVideosMes").value) || 1,
        horasMensais: Number($("fHorasMes").value) || 1,
        prazoEntregaDias: Number($("fPrazoR").value) || 7
      };
      payload.financeiro = {
        valorTotal: Math.round(mensal * qtdParcelas * 100) / 100,
        qtdParcelas: qtdParcelas,
        diaVencimento: Number($("fDiaVenc").value) || 5
      };
    }
    return payload;
  }

  $("btnSalvar").addEventListener("click", function () {
    var err = $("formErr");
    err.textContent = "";
    var p = montarPayload();
    if (!p.contratante.razaoSocial.trim()) { err.textContent = "Preencha a razão social do cliente."; return; }
    var dig = p.contratante.cnpjCpf.replace(/\D/g, "");
    if (dig.length !== 11 && dig.length !== 14) { err.textContent = "Preencha um CNPJ (14 dígitos) ou CPF (11 dígitos) válido."; return; }
    if (!(p.financeiro.valorTotal > 0)) { err.textContent = "Preencha o valor do contrato."; return; }
    if (estado.tipo === "pontual") {
      var soma = p.financeiro.parcelas.reduce(function (t, x) { return t + x.pct; }, 0);
      if (soma !== 100) { err.textContent = "As parcelas somam " + soma + "% — precisam somar 100%."; return; }
    }
    var btn = $("btnSalvar");
    btn.disabled = true; btn.textContent = "Salvando…";
    var req = estado.editandoId
      ? api("/api/contratos/" + estado.editandoId, { method: "PATCH", body: JSON.stringify(p) })
      : api("/api/contratos", { method: "POST", body: JSON.stringify(p) });
    req.then(function () {
      btn.disabled = false; btn.textContent = "Salvar rascunho";
      toast("Rascunho salvo.");
      abrirLista();
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = "Salvar rascunho";
      err.textContent = e.message;
    });
  });

  /* ============================ TELA MODELOS ============================ */
  $("btnModelos").addEventListener("click", abrirModelos);
  $("btnVoltarModelos").addEventListener("click", abrirLista);
  $("btnNovoModelo").addEventListener("click", function () { abrirModeloForm(null); });
  $("btnVoltarModelo").addEventListener("click", abrirModelos);

  function abrirModelos() {
    mostrar("viewModelos");
    $("modelosBody").innerHTML = '<tr><td colspan="4" class="empty">Carregando…</td></tr>';
    carregarModelos(true).then(renderListaModelos).catch(function (e) {
      $("modelosBody").innerHTML = '<tr><td colspan="4" class="empty">' + esc(e.message) + "</td></tr>";
    });
  }

  function renderListaModelos() {
    var lista = estado.modelos || [];
    $("modelosVazio").hidden = lista.length > 0;
    $("modelosBody").innerHTML = lista.map(function (m) {
      return "<tr><td><b>" + esc(m.nome) + "</b></td>" +
        '<td><span class="tipo-tag">' + esc(m.tipo) + "</span></td>" +
        "<td>" + esc(m.titulo || "—") + "</td>" +
        '<td><div class="acts">' +
        '<button class="btn sec mini" data-macao="editar" data-id="' + esc(m.id) + '">Editar</button>' +
        '<button class="btn sec mini danger" data-macao="excluir" data-id="' + esc(m.id) + '">Excluir</button>' +
        "</div></td></tr>";
    }).join("");
  }

  $("modelosBody").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-macao]");
    if (!b) return;
    var id = b.getAttribute("data-id");
    if (b.getAttribute("data-macao") === "editar") abrirModeloForm(id);
    else excluirModelo(id, b);
  });

  document.querySelectorAll("#mSegTipo button").forEach(function (b) {
    b.addEventListener("click", function () { setTipoModelo(b.getAttribute("data-v")); });
  });

  function setTipoModelo(t) {
    estado.tipoModelo = t;
    document.querySelectorAll("#mSegTipo button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-v") === t);
    });
    $("mFsPontual").hidden = t !== "pontual";
    $("mFsRecorrente").hidden = t !== "recorrente";
  }

  function abrirModeloForm(id) {
    estado.editandoModeloId = id;
    $("modeloFormTitulo").textContent = id ? "Editar modelo" : "Novo modelo";
    ["mNome", "mTitulo", "mLead", "mObjeto", "mHoraExc"].forEach(function (i) { $(i).value = ""; });
    $("mQtdVideos").value = "1"; $("mQtdCortes").value = "0"; $("mPrazoP").value = "7";
    $("mMeses").value = "3"; $("mVideosMes").value = "4"; $("mHorasMes").value = "8";
    $("mPrazoR").value = "7"; $("mDiaVenc").value = "5";
    $("mChkVideos").checked = true; $("mChkGravacao").checked = true;
    $("mBlocosWrap").innerHTML = "";
    setPreset("mPreset", "mParcelasWrap", "btnAddParcelaM", "5050");
    $("mErr").textContent = "";
    setTipoModelo("pontual");
    if (id) {
      var m = (estado.modelos || []).find(function (x) { return x.id === id; });
      if (m) preencherModeloForm(m);
    } else {
      addBloco("", [], $("mBlocosWrap"));
    }
    mostrar("viewModeloForm");
  }

  function preencherModeloForm(m) {
    setTipoModelo(m.tipo);
    $("mNome").value = m.nome || "";
    $("mTitulo").value = m.titulo || "";
    $("mLead").value = m.lead || "";
    (m.blocos || []).forEach(function (b) { addBloco(b.titulo, b.itens, $("mBlocosWrap")); });
    if (!(m.blocos || []).length) addBloco("", [], $("mBlocosWrap"));
    var sv = m.servico || {}, fin = m.financeiro || {};
    if (m.tipo === "pontual") {
      $("mChkVideos").checked = !!m.mostrarVideosCortes;
      $("mChkGravacao").checked = !!m.mostrarGravacao;
      $("mQtdVideos").value = sv.qtdVideos != null ? sv.qtdVideos : 1;
      $("mQtdCortes").value = sv.qtdCortes != null ? sv.qtdCortes : 0;
      $("mPrazoP").value = sv.prazoEntregaDias || 7;
      $("mHoraExc").value = sv.valorHoraExcedente || "";
      $("mObjeto").value = (sv.descricaoObjeto || []).join("\n");
      setPreset("mPreset", "mParcelasWrap", "btnAddParcelaM", fin.preset || "5050", fin.parcelas);
    } else {
      $("mMeses").value = sv.meses || 3;
      $("mVideosMes").value = sv.videosMes || 4;
      $("mHorasMes").value = sv.horasMensais || 8;
      $("mPrazoR").value = sv.prazoEntregaDias || 7;
      $("mDiaVenc").value = fin.diaVencimento || 5;
    }
  }

  function montarModeloPayload() {
    var tipo = estado.tipoModelo;
    var m = {
      id: estado.editandoModeloId || "",
      nome: $("mNome").value.trim(),
      tipo: tipo,
      titulo: $("mTitulo").value.trim(),
      lead: $("mLead").value.trim(),
      blocos: lerBlocos("#mBlocosWrap"),
      mostrarVideosCortes: $("mChkVideos").checked,
      mostrarGravacao: $("mChkGravacao").checked
    };
    if (tipo === "pontual") {
      m.servico = {
        qtdVideos: Number($("mQtdVideos").value) || 0,
        qtdCortes: Number($("mQtdCortes").value) || 0,
        prazoEntregaDias: Number($("mPrazoP").value) || 7,
        valorHoraExcedente: Number($("mHoraExc").value) || 0,
        descricaoObjeto: linhas($("mObjeto").value)
      };
      m.financeiro = {
        preset: $("mPreset").value,
        parcelas: $("mPreset").value === "custom" ? lerParcelas("#mParcelasWrap") : []
      };
    } else {
      m.servico = {
        meses: Number($("mMeses").value) || 3,
        videosMes: Number($("mVideosMes").value) || 4,
        horasMensais: Number($("mHorasMes").value) || 8,
        prazoEntregaDias: Number($("mPrazoR").value) || 7
      };
      m.financeiro = { preset: "5050", diaVencimento: Number($("mDiaVenc").value) || 5 };
    }
    return m;
  }

  function salvarModelos(lista, btn, msgOk) {
    if (btn) btn.disabled = true;
    return api("/api/modelos", { method: "PUT", body: JSON.stringify({ modelos: lista, sha: estado.modelosSha }) })
      .then(function (r) {
        estado.modelos = r.modelos;
        estado.modelosSha = r.sha;
        if (btn) btn.disabled = false;
        toast(msgOk);
        return true;
      })
      .catch(function (e) {
        if (btn) btn.disabled = false;
        toast(e.message);
        if (/outra sessão/i.test(e.message)) carregarModelos(true).then(renderListaModelos);
        return false;
      });
  }

  $("btnSalvarModelo").addEventListener("click", function () {
    var err = $("mErr");
    err.textContent = "";
    var m = montarModeloPayload();
    if (!m.nome) { err.textContent = "Dê um nome ao modelo."; return; }
    if (m.tipo === "pontual" && m.financeiro.preset === "custom") {
      var soma = m.financeiro.parcelas.reduce(function (t, p) { return t + p.pct; }, 0);
      if (soma !== 100) { err.textContent = "As parcelas somam " + soma + "% — precisam somar 100%."; return; }
    }
    var lista = (estado.modelos || []).slice();
    if (estado.editandoModeloId) {
      var i = lista.findIndex(function (x) { return x.id === estado.editandoModeloId; });
      if (i >= 0) lista[i] = m; else lista.push(m);
    } else {
      lista.push(m);
    }
    salvarModelos(lista, $("btnSalvarModelo"), "Modelo salvo.").then(function (ok) { if (ok) abrirModelos(); });
  });

  function excluirModelo(id, b) {
    var m = (estado.modelos || []).find(function (x) { return x.id === id; }) || {};
    if (!confirm('Excluir o modelo "' + (m.nome || id) + '"? Contratos já criados não são afetados.')) return;
    var lista = (estado.modelos || []).filter(function (x) { return x.id !== id; });
    salvarModelos(lista, b, "Modelo excluído.").then(function (ok) { if (ok) renderListaModelos(); });
  }

  /* ================================ BOOT ================================ */
  if (senha()) {
    // valida a senha guardada antes de mostrar o painel
    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha: senha() })
    }).then(function (r) {
      if (!r.ok) return logout();
      if (location.hash === "#novo") abrirForm(null);
      else if (location.hash === "#modelos") abrirModelos();
      else abrirLista();
    }).catch(logout);
  } else {
    mostrar("viewLogin");
  }
})();
