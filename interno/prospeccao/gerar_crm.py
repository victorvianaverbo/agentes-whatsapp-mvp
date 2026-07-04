#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera um CRM de prospecção (HTML estático, abre direto no navegador) a partir
das filas geradas por segmentar_fila.py.

- Lê os 3 CSVs em saida/.
- Embute os leads no próprio HTML (sem servidor, sem CORS).
- Cada lead tem botão de WhatsApp com a mensagem já preenchida (nome + ano).
- Status de cada lead é salvo no localStorage do navegador.

Saída: saida/crm.html  (contém dados pessoais — NÃO commitar; já está no .gitignore)
"""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "saida"

ARQS = [
    ("tier1", "Tier 1 · prováveis formados", "fila_tier1_formados.csv"),
    ("tier2", "Tier 2 · base antiga", "fila_tier2_provaveis.csv"),
    ("formandos", "Formandos · 2ª onda", "fila_formandos_2a_onda.csv"),
]


def primeiro_nome(nome: str) -> str:
    p = (nome or "").strip().split()
    return p[0].capitalize() if p else "Doutor(a)"


def fmt_ltv(v) -> str:
    try:
        return f"R$ {float(v):,.0f}".replace(",", ".")
    except (ValueError, TypeError):
        return ""


def carregar():
    data = {}
    for key, _titulo, arq in ARQS:
        leads = []
        path = OUT / arq
        if not path.exists():
            data[key] = leads
            continue
        with open(path, encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                tel = (r.get("telefone") or "").strip()
                if not tel:
                    continue
                leads.append({
                    "n": primeiro_nome(r.get("nome")),
                    "full": (r.get("nome") or "").strip(),
                    "t": tel,
                    "a": (r.get("ano_1a_compra") or "").strip(),
                    "p": (r.get("plano_sinal") or "").strip(),
                    "l": fmt_ltv(r.get("ltv")),
                    "c": (r.get("n_compras") or "").strip(),
                })
        data[key] = leads
    return data


TEMPLATE = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CRM Prospecção · Raio-X do Consultório</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#FBFAF9;--card:#fff;--soft:#F4F3FB;--ink:#1A1A1A;--muted:#52525B;--muted2:#8a8a93;
  --line:#E5E7EB;--accent:#4F46E5;--accent-hover:#4338CA;--accent-light:#818CF8;--accent-soft:rgba(79,70,229,.08);
  --serif:'Instrument Serif',Georgia,serif;
  --wa:#25D366;--wa-d:#1EBE5A;
  --novo:#9a9ab0;--contatado:#4F46E5;--respondeu:#0ea5e9;--agendado:#f59e0b;--fechado:#10B981;--descartado:#ef4444;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Space Grotesk',system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.5;padding-bottom:40px}
.grid-bg{position:fixed;inset:0;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(79,70,229,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(79,70,229,.035) 1px,transparent 1px);
  background-size:60px 60px;
  -webkit-mask-image:radial-gradient(1100px 600px at 50% -8%,#000,transparent 80%);mask-image:radial-gradient(1100px 600px at 50% -8%,#000,transparent 80%)}
.wrap{max-width:920px;margin:0 auto;padding:0 18px;position:relative;z-index:1}
header{background:rgba(251,250,249,.85);backdrop-filter:saturate(160%) blur(12px);-webkit-backdrop-filter:saturate(160%) blur(12px);border-bottom:1px solid var(--line);padding:18px 0;margin-bottom:18px;position:sticky;top:0;z-index:5}
.brand{display:inline-flex;align-items:center;gap:8px;font-family:'Sora',sans-serif;font-weight:700;font-size:.95rem;color:var(--ink);margin-bottom:10px;letter-spacing:-.02em}
.brand svg{width:18px;height:18px}
.brand .x{color:var(--muted2);font-weight:400}
.brand .ms{color:var(--accent);font-weight:600}
h1{font-family:'Sora',sans-serif;font-size:1.5rem;font-weight:800;letter-spacing:-.02em}
h1 em{font-family:var(--serif);font-style:italic;font-weight:400;color:var(--accent)}
.sub{color:var(--muted);font-size:.9rem;margin-top:3px}
.stats{display:flex;gap:18px;margin-top:14px;flex-wrap:wrap}
.stat{font-size:.85rem;color:var(--muted)}
.stat b{font-family:'Sora',sans-serif;font-size:1.15rem;color:var(--accent);font-weight:800;display:block}
.lead-name{font-family:'Sora',sans-serif}
.tabs{display:flex;gap:8px;margin:16px 0;flex-wrap:wrap}
.tab{padding:9px 14px;border:1px solid var(--line);background:var(--card);border-radius:10px;font-size:.9rem;font-weight:600;cursor:pointer;color:var(--muted);font-family:inherit}
.tab.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.tab .ct{opacity:.7;font-weight:500}
.controls{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.controls input,.controls select{padding:10px 12px;border:1px solid var(--line);border-radius:10px;font-size:.9rem;font-family:inherit;background:var(--card)}
.controls input{flex:1;min-width:180px}
.lead{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--novo);border-radius:12px;padding:14px 16px;margin-bottom:10px;transition:border-color .2s}
.lead-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.lead-name{font-weight:700;font-size:1.05rem}
.lead-full{color:var(--muted2);font-size:.8rem}
.badges{display:flex;gap:7px;flex-wrap:wrap;margin:9px 0}
.b{font-size:.72rem;background:var(--accent-soft);color:var(--accent);padding:3px 8px;border-radius:6px;font-weight:600}
.b.gray{background:#f1f1f4;color:var(--muted)}
.lead-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px}
.wa{display:inline-flex;align-items:center;gap:7px;background:var(--wa);color:#fff;text-decoration:none;font-weight:700;font-size:.9rem;padding:9px 16px;border-radius:9px;transition:background .2s}
.wa:hover{background:var(--wa-d)}
.wa svg{width:17px;height:17px;fill:#fff}
.mini{background:none;border:1px solid var(--line);color:var(--muted);font-size:.82rem;padding:8px 11px;border-radius:8px;cursor:pointer;font-family:inherit}
.mini:hover{border-color:var(--accent);color:var(--accent)}
.tel{font-size:.8rem;color:var(--muted2);margin-left:auto}
.status{padding:7px 9px;border:1px solid var(--line);border-radius:8px;font-size:.8rem;font-family:inherit;font-weight:600;cursor:pointer}
.more{display:block;width:100%;padding:12px;margin-top:6px;background:var(--card);border:1px solid var(--line);border-radius:10px;font-weight:600;color:var(--accent);cursor:pointer;font-family:inherit}
.empty{text-align:center;color:var(--muted);padding:40px 0}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 18px;border-radius:10px;font-size:.85rem;opacity:0;transition:opacity .25s;pointer-events:none}
.toast.on{opacity:1}
</style>
</head>
<body>
<div class="grid-bg"></div>
<header><div class="wrap">
  <div class="brand"><svg viewBox="0 0 28 28" fill="none"><path d="M14 3 L25 24 L3 24 Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="14" cy="3" r="2.4" fill="currentColor"/><circle cx="25" cy="24" r="2.4" fill="currentColor"/><circle cx="3" cy="24" r="2.4" fill="currentColor"/></svg> Vértice Labs <span class="x">×</span> <span class="ms">MEDSimple</span></div>
  <h1>CRM de <em>Prospecção</em></h1>
  <div class="sub">Clique no WhatsApp e a mensagem já vai preenchida com o nome e o ano do lead.</div>
  <div class="stats" id="stats"></div>
</div></header>

<div class="wrap">
  <div class="tabs" id="tabs"></div>
  <div class="controls">
    <input id="search" type="text" placeholder="Buscar por nome ou telefone...">
    <select id="fstatus">
      <option value="">Todos os status</option>
      <option value="novo">Novo</option>
      <option value="contatado">Contatado</option>
      <option value="respondeu">Respondeu</option>
      <option value="agendado">Agendado</option>
      <option value="fechado">Fechado</option>
      <option value="descartado">Descartado</option>
    </select>
  </div>
  <div id="list"></div>
</div>
<div class="toast" id="toast"></div>

<script>
const DATA = __DATA__;
const TABS = [["tier1","Tier 1 · formados"],["tier2","Tier 2 · base antiga"],["formandos","Formandos · 2ª onda"]];
const STATUSES = ["novo","contatado","respondeu","agendado","fechado","descartado"];
const PAGE = 60;
let tab = "tier1", shown = PAGE;

function msg(n,a){
  const desde = a ? (" desde "+a) : "";
  return "Ei "+n+"! Tudo bem?\n"+
    "Aqui é o Victor, do time de *Marketing da MEDSimple*.\n\n"+
    "Vi que você é da nossa base"+desde+". Rapidinho: *você já tá atendendo no consultório ou ainda tá na formação/residência?*\n\n"+
    "A gente abriu um programa pra usuários e ex-usuários da MEDSimple captarem mais pacientes pro consultório. Tem interesse em saber mais?";
}
function waLink(L){ return "https://wa.me/"+L.t+"?text="+encodeURIComponent(msg(L.n,L.a)); }
function getStatus(t){ return localStorage.getItem("crm_"+t) || "novo"; }
function setStatus(t,v){ localStorage.setItem("crm_"+t,v); }

function toast(m){ const e=document.getElementById("toast"); e.textContent=m; e.classList.add("on"); setTimeout(()=>e.classList.remove("on"),1400); }

function planoLabel(p){ if(!p) return ""; return "plano: "+p; }

function renderStats(){
  let total=0, contatados=0;
  TABS.forEach(([k])=> (DATA[k]||[]).forEach(L=>{ total++; if(getStatus(L.t)!=="novo") contatados++; }));
  document.getElementById("stats").innerHTML =
    '<div class="stat"><b>'+total+'</b>leads com WhatsApp</div>'+
    '<div class="stat"><b>'+contatados+'</b>já trabalhados</div>'+
    '<div class="stat"><b>'+(DATA.tier1||[]).length+'</b>no Tier 1 (comece aqui)</div>';
}
function renderTabs(){
  document.getElementById("tabs").innerHTML = TABS.map(([k,t])=>
    '<button class="tab'+(k===tab?' active':'')+'" data-k="'+k+'">'+t+' <span class="ct">('+(DATA[k]||[]).length+')</span></button>'
  ).join("");
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{ tab=b.dataset.k; shown=PAGE; render(); });
}
function filtered(){
  const q=document.getElementById("search").value.trim().toLowerCase();
  const fs=document.getElementById("fstatus").value;
  return (DATA[tab]||[]).filter(L=>{
    if(q && !((L.full||"").toLowerCase().includes(q) || L.t.includes(q))) return false;
    if(fs && getStatus(L.t)!==fs) return false;
    return true;
  });
}
function render(){
  renderStats(); renderTabs();
  const arr=filtered();
  const list=document.getElementById("list");
  if(!arr.length){ list.innerHTML='<div class="empty">Nenhum lead com esse filtro.</div>'; return; }
  const slice=arr.slice(0,shown);
  list.innerHTML = slice.map(L=>{
    const st=getStatus(L.t);
    const badges=['<span class="b">cliente desde '+(L.a||"?")+'</span>',
      planoLabel(L.p)?'<span class="b">'+planoLabel(L.p)+'</span>':'',
      L.l?'<span class="b gray">LTV '+L.l+'</span>':'',
      (L.c&&L.c!=="1")?'<span class="b gray">'+L.c+' compras</span>':''].join('');
    const opts=STATUSES.map(s=>'<option value="'+s+'"'+(s===st?' selected':'')+'>'+s[0].toUpperCase()+s.slice(1)+'</option>').join('');
    return '<div class="lead" data-t="'+L.t+'" style="border-left-color:var(--'+st+')">'+
      '<div class="lead-top"><div><span class="lead-name">'+L.n+'</span> <span class="lead-full">'+(L.full||"")+'</span></div>'+
      '<select class="status" data-t="'+L.t+'">'+opts+'</select></div>'+
      '<div class="badges">'+badges+'</div>'+
      '<div class="lead-actions">'+
        '<a class="wa" href="'+waLink(L)+'" target="_blank" rel="noopener" data-mark="'+L.t+'">'+
          '<svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.044zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>'+
          'WhatsApp</a>'+
        '<button class="mini" data-copy="'+L.t+'">copiar msg</button>'+
        '<span class="tel">+'+L.t+'</span>'+
      '</div></div>';
  }).join('') + (arr.length>shown?'<button class="more" id="more">Carregar mais ('+(arr.length-shown)+' restantes)</button>':'');

  document.querySelectorAll(".status").forEach(s=>s.onchange=()=>{ setStatus(s.dataset.t,s.value); render(); });
  document.querySelectorAll(".wa").forEach(a=>a.onclick=()=>{ const t=a.dataset.mark; if(getStatus(t)==="novo"){ setStatus(t,"contatado"); setTimeout(render,400);} });
  document.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>{
    const L=(DATA[tab]||[]).find(x=>x.t===b.dataset.copy);
    navigator.clipboard.writeText(msg(L.n,L.a)).then(()=>toast("Mensagem copiada"));
  });
  const more=document.getElementById("more");
  if(more) more.onclick=()=>{ shown+=PAGE; render(); };
}
document.getElementById("search").oninput=()=>{ shown=PAGE; render(); };
document.getElementById("fstatus").onchange=()=>{ shown=PAGE; render(); };
render();
</script>
</body>
</html>
"""


def main():
    data = carregar()
    total = sum(len(v) for v in data.values())
    html = TEMPLATE.replace("__DATA__", json.dumps(data, ensure_ascii=False))
    out = OUT / "crm.html"
    out.write_text(html, encoding="utf-8")
    print(f"[ok] CRM gerado: {out}")
    print(f"     leads com WhatsApp: tier1={len(data['tier1'])} · tier2={len(data['tier2'])} · formandos={len(data['formandos'])} (total {total})")
    print(f"[abrir] dê dois cliques no arquivo crm.html (abre no navegador)")


if __name__ == "__main__":
    main()
