/* Helpers compartilhados — moeda, extenso, máscaras, datas */
(function (global) {
  "use strict";

  function moeda(n) {
    return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  /* ---- número por extenso (pt-BR) ---- */
  var UN = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
    "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  var DEZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  var CEM = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function ate999(n) {
    if (n === 0) return "";
    if (n === 100) return "cem";
    var c = Math.floor(n / 100), r = n % 100, partes = [];
    if (c) partes.push(CEM[c]);
    if (r) {
      if (r < 20) partes.push(UN[r]);
      else {
        var d = Math.floor(r / 10), u = r % 10;
        partes.push(u ? DEZ[d] + " e " + UN[u] : DEZ[d]);
      }
    }
    return partes.join(" e ");
  }

  function extensoNumero(n) {
    n = Math.floor(Math.abs(Number(n) || 0));
    if (n === 0) return "zero";
    var bi = Math.floor(n / 1e9), mi = Math.floor((n % 1e9) / 1e6),
        mil = Math.floor((n % 1e6) / 1000), resto = n % 1000, partes = [];
    if (bi) partes.push(bi === 1 ? "um bilhão" : ate999(bi) + " bilhões");
    if (mi) partes.push(mi === 1 ? "um milhão" : ate999(mi) + " milhões");
    if (mil) partes.push(mil === 1 ? "mil" : ate999(mil) + " mil");
    var texto = partes.join(" ");
    if (resto) {
      // "e" antes do último bloco quando ele é < 100 ou centena exata
      // ("mil e cem", "mil e cinquenta"), senão espaço ("mil novecentos e cinquenta")
      var liga = (resto < 100 || resto % 100 === 0) && partes.length ? " e " : (partes.length ? " " : "");
      texto += liga + ate999(resto);
    }
    return texto;
  }

  function extensoReais(valor) {
    valor = Math.round((Number(valor) || 0) * 100) / 100;
    var inteiro = Math.floor(valor), centavos = Math.round((valor - inteiro) * 100), partes = [];
    if (inteiro) {
      partes.push(extensoNumero(inteiro) + (inteiro === 1 ? " real" : " reais"));
      // "um milhão de reais"
      if (inteiro % 1e6 === 0) partes[0] = extensoNumero(inteiro) + " de reais";
    }
    if (centavos) partes.push(extensoNumero(centavos) + (centavos === 1 ? " centavo" : " centavos"));
    return partes.length ? partes.join(" e ") : "zero reais";
  }

  /* ---- CPF/CNPJ ---- */
  function formatarDoc(v) {
    var d = String(v || "").replace(/\D/g, "");
    if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return String(v || "");
  }

  /* ---- datas ---- */
  function dataCurta(iso) {
    if (!iso) return "—";
    var dt = new Date(iso);
    return dt.toLocaleDateString("pt-BR");
  }
  function dataLonga(iso) {
    var dt = iso ? new Date(iso) : new Date();
    return dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  }
  function dataHora(iso) {
    if (!iso) return "—";
    var dt = new Date(iso);
    return dt.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "medium" });
  }

  global.VerticeUtil = {
    moeda: moeda,
    extensoNumero: extensoNumero,
    extensoReais: extensoReais,
    formatarDoc: formatarDoc,
    dataCurta: dataCurta,
    dataLonga: dataLonga,
    dataHora: dataHora
  };
})(window);
