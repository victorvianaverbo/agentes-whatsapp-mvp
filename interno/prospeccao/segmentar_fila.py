#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Segmentação da fila de prospecção — Raio-X do Consultório (Vértice Labs)

Objetivo: a partir da base MEDSimple, montar uma fila priorizada de quem abordar
no WhatsApp 1x1, separando PROVÁVEIS FORMADOS (compram captação de paciente) de
estudante (descartar).

Como a base não tem campo de "ano de formatura", inferimos por COORTE de compra
(medicina = 6 anos; base começa em 2021) cruzada com o PLANO/PRODUTO comprado:
- Produto de Residência  -> sinal mais forte de fim de curso / já formado
- Plano Pro              -> internato / preparação residência
- Plano Basic            -> início de curso (descartar)

Fontes (somente leitura):
- new_clients.csv : 1 linha por cliente único (com ano da 1ª compra, LTV, etc.)
- guru_raw.csv    : transações com nome_oferta (de onde sai o plano/produto)

Saída (NÃO commitar — contém dados pessoais):
- saida/fila_tier1_formados.csv
- saida/fila_tier2_provaveis.csv
- saida/fila_formandos_2a_onda.csv
"""

import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
# Projetos/novos clientes medsimple/.tmp  (ajuste se mover a base)
DEFAULT_BASE = ROOT.parent.parent / "novos clientes medsimple" / ".tmp"
BASE = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_BASE
OUT = ROOT / "saida"

COORTE_ANTIGA = {"2021", "2022"}   # prováveis já formados hoje (jun/2026)


def detectar_sinais(oferta: str) -> set:
    """Extrai sinais de estágio a partir do nome_oferta do guru."""
    o = (oferta or "").lower()
    s = set()
    if "resid" in o:                         # residência / upgrade residência
        s.add("residencia")
    if "plano pro" in o or "plano pró" in o:
        s.add("pro")
    if "plano basic" in o:
        s.add("basic")
    if "plano max" in o:
        s.add("max")
    if "vital" in o or "6 anos" in o:        # vitalício / 6 anos
        s.add("longo")
    return s


def norm_tel(tel: str) -> str:
    """Normaliza telefone para formato wa.me (apenas dígitos com DDI 55)."""
    d = re.sub(r"\D", "", tel or "")
    if not d:
        return ""
    if d.startswith("55") and len(d) >= 12:
        return d
    if len(d) in (10, 11):                    # DDD + número, sem DDI
        return "55" + d
    if len(d) in (12, 13) and not d.startswith("55"):
        return d                              # já tem algum DDI estrangeiro? mantém
    return ""                                  # inválido / incompleto


def ler_planos_guru() -> dict:
    """Mapa email/telefone -> conjunto de sinais (pro, residencia, basic...)."""
    m = {}
    path = BASE / "guru_raw.csv"
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            sinais = detectar_sinais(r.get("nome_oferta"))
            if not sinais:
                continue
            for chave in (r.get("email"), norm_tel(r.get("telefone"))):
                if chave:
                    m.setdefault(chave.strip().lower(), set()).update(sinais)
    return m


def classificar(ano: str, sinais: set):
    """Retorna (tier, motivo) ou (None, None) para descarte."""
    is_resid = "residencia" in sinais
    is_pro = "pro" in sinais
    is_basic = "basic" in sinais
    forte = is_resid or is_pro
    antiga = ano in COORTE_ANTIGA

    # Tier 1 — prováveis FORMADOS: coorte antiga + sinal de fim de curso
    if antiga and forte:
        return ("tier1", "residência" if is_resid else "pro")
    # Tier 2 — prováveis formados/formando: coorte antiga (sem plano claro) OU forte em 2023
    if antiga and not is_basic:
        return ("tier2", "coorte 2021-2022")
    if forte and ano == "2023":
        return ("tier2", "residência/pro 2023")
    # 2ª onda — FORMANDO de último ano: produto de residência recente (internato agora)
    if is_resid and ano in ("2024", "2025"):
        return ("formandos", "residência recente (internato)")
    return (None, None)


def main():
    if not (BASE / "new_clients.csv").exists():
        sys.exit(f"[erro] não encontrei a base em: {BASE}\n"
                 f"Passe o caminho como argumento: python segmentar_fila.py <pasta_.tmp>")

    OUT.mkdir(exist_ok=True)
    planos = ler_planos_guru()
    print(f"[ok] {len(planos)} contatos com plano identificado no guru")

    buckets = {"tier1": [], "tier2": [], "formandos": []}
    total = 0
    with open(BASE / "new_clients.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            total += 1
            ano = (r.get("ano") or "").strip()
            email = (r.get("email") or "").strip().lower()
            tel_norm = norm_tel(r.get("telefone"))
            sinais = set()
            sinais |= planos.get(email, set())
            if tel_norm:
                sinais |= planos.get(tel_norm, set())

            tier, motivo = classificar(ano, sinais)
            if not tier:
                continue
            buckets[tier].append({
                "nome": (r.get("nome") or "").strip(),
                "telefone": tel_norm,
                "whatsapp": f"https://wa.me/{tel_norm}" if tel_norm else "",
                "email": email,
                "ano_1a_compra": ano,
                "plano_sinal": motivo,
                "ltv": r.get("ltv") or "",
                "n_compras": r.get("n_compras") or "",
                "data_ultima_compra": r.get("data_ultima_compra") or "",
            })

    # ordenação: residência antes de pro; ano mais antigo primeiro; LTV desc
    def ord_key(c):
        resid = 0 if c["plano_sinal"] == "residência" else 1
        try:
            ltv = float(c["ltv"] or 0)
        except ValueError:
            ltv = 0.0
        return (resid, c["ano_1a_compra"], -ltv)

    arquivos = {
        "tier1": "fila_tier1_formados.csv",
        "tier2": "fila_tier2_provaveis.csv",
        "formandos": "fila_formandos_2a_onda.csv",
    }
    cols = ["nome", "telefone", "whatsapp", "email", "ano_1a_compra",
            "plano_sinal", "ltv", "n_compras", "data_ultima_compra"]

    print(f"\n[base] {total} clientes únicos analisados\n")
    for tier, nome_arq in arquivos.items():
        linhas = sorted(buckets[tier], key=ord_key)
        # prioriza quem tem telefone válido no topo
        linhas.sort(key=lambda c: 0 if c["telefone"] else 1)
        with open(OUT / nome_arq, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=cols)
            w.writeheader()
            w.writerows(linhas)
        com_tel = sum(1 for c in linhas if c["telefone"])
        print(f"  {nome_arq:32s} {len(linhas):6d} contatos  ({com_tel} com WhatsApp válido)")

    print(f"\n[ok] arquivos gerados em: {OUT}")
    print("[atenção] os CSVs contêm dados pessoais — NÃO commitar no git.")


if __name__ == "__main__":
    main()
