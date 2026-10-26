"""Monta as bases 1T x 2T (Brasil, regiões, UFs e municípios) das eleições presidenciais
de 2018, 2022 e 2026, os cenários de transferência e a regressão ecológica.

Fontes (TSE):
  2018/2022: dados abertos (detalhe_votacao_munzona + votacao_partido_munzona), zips em <od_dir>
  2026:      API de resultados (ele2026/6257 = 1T, 6258 = 2T):
             <api_dir>/<uf>-<cd>.json (UFs) e <mun_dir>/files/<uf><mun>-<cd>.json + <mun_dir>/cm.json

Uso: python3 -I build_dataset.py <od_dir> <api_dir> <mun_dir> <out_dir>
"""
import csv
import io
import json
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

import numpy as np

UF_NOME = {"AC": "Acre", "AL": "Alagoas", "AM": "Amazonas", "AP": "Amapá", "BA": "Bahia", "CE": "Ceará",
           "DF": "Distrito Federal", "ES": "Espírito Santo", "GO": "Goiás", "MA": "Maranhão",
           "MG": "Minas Gerais", "MS": "Mato Grosso do Sul", "MT": "Mato Grosso", "PA": "Pará",
           "PB": "Paraíba", "PE": "Pernambuco", "PI": "Piauí", "PR": "Paraná", "RJ": "Rio de Janeiro",
           "RN": "Rio Grande do Norte", "RO": "Rondônia", "RR": "Roraima", "RS": "Rio Grande do Sul",
           "SC": "Santa Catarina", "SE": "Sergipe", "SP": "São Paulo", "TO": "Tocantins", "ZZ": "Exterior"}
UFS = list(UF_NOME)
REGIAO = {"AC": "N", "AM": "N", "AP": "N", "PA": "N", "RO": "N", "RR": "N", "TO": "N",
          "AL": "NE", "BA": "NE", "CE": "NE", "MA": "NE", "PB": "NE", "PE": "NE", "PI": "NE", "RN": "NE", "SE": "NE",
          "DF": "CO", "GO": "CO", "MS": "CO", "MT": "CO",
          "ES": "SE", "MG": "SE", "RJ": "SE", "SP": "SE",
          "PR": "S", "RS": "S", "SC": "S", "ZZ": "EX"}
REGIAO_NOME = {"N": "Norte", "NE": "Nordeste", "CO": "Centro-Oeste", "SE": "Sudeste", "S": "Sul", "EX": "Exterior"}
# ano: (nº PT, nome PT, nº direita, nome direita)
CANDS = {2018: (13, "Haddad", 17, "Bolsonaro"),
         2022: (13, "Lula", 22, "Bolsonaro"),
         2026: (13, "Lula", 22, "Flávio")}
CENARIOS_X = [40, 50, 60, 70, 80]
CAMPOS = ("aptos", "comp", "abst", "validos", "brancos", "pt", "dir")


def read_brasil_csv(zip_path):
    with zipfile.ZipFile(zip_path) as z:
        name = next(n for n in z.namelist() if n.endswith("_BRASIL.csv"))
        with z.open(name) as f:
            yield from csv.DictReader(io.TextIOWrapper(f, encoding="latin1"), delimiter=";")


def load_open_data(od_dir, ano):
    """Retorna ({(turno, uf, cod_mun): contagens}, {cod_mun: nome})."""
    pt_nr, _, dir_nr, _ = CANDS[ano]
    agg = defaultdict(lambda: defaultdict(int))
    nomes = {}
    for r in read_brasil_csv(Path(od_dir) / f"detalhe_votacao_munzona_{ano}.zip"):
        if r["CD_CARGO"] != "1":
            continue
        k = (int(r["NR_TURNO"]), r["SG_UF"], r["CD_MUNICIPIO"].zfill(5))
        nomes[k[2]] = r["NM_MUNICIPIO"]
        agg[k]["aptos"] += int(r["QT_APTOS"])
        agg[k]["comp"] += int(r["QT_COMPARECIMENTO"])
        agg[k]["abst"] += int(r["QT_ABSTENCOES"])
        agg[k]["validos"] += int(r["QT_TOTAL_VOTOS_VALIDOS"])
        agg[k]["brancos"] += int(r["QT_VOTOS_BRANCOS"])
    for r in read_brasil_csv(Path(od_dir) / f"votacao_partido_munzona_{ano}.zip"):
        if r["CD_CARGO"] != "1":
            continue
        nr = int(r["NR_PARTIDO"])
        if nr in (pt_nr, dir_nr):
            k = (int(r["NR_TURNO"]), r["SG_UF"], r["CD_MUNICIPIO"].zfill(5))
            agg[k]["pt" if nr == pt_nr else "dir"] += int(r["QT_VOTOS_NOMINAIS_VALIDOS"])
    return agg, nomes


def parse_api(path):
    pt_nr, _, dir_nr, _ = CANDS[2026]
    d = json.load(open(path, encoding="utf-8"))
    votos = {int(c["n"]): int(c["vap"]) for a in d["carg"][0]["agr"] for p in a["par"] for c in p["cand"]}
    return {"aptos": int(d["e"]["te"]), "comp": int(d["e"]["c"]), "abst": int(d["e"]["a"]),
            "validos": int(d["v"]["vv"]), "brancos": int(d["v"]["vb"]),
            "pt": votos.get(pt_nr, 0), "dir": votos.get(dir_nr, 0)}


def load_api_2026(api_dir, mun_dir):
    """Municípios da API; confere a soma por UF contra o arquivo estadual."""
    cm = json.load(open(Path(mun_dir) / "cm.json", encoding="utf-8"))
    agg, nomes = {}, {}
    for a in cm["abr"]:
        uf = a["cd"].upper()
        for m in a["mu"]:
            nomes[m["cd"]] = m["nm"]
            for turno, cd in ((1, 6257), (2, 6258)):
                agg[(turno, uf, m["cd"])] = parse_api(Path(mun_dir) / "files" / f"{a['cd']}{m['cd']}-{cd}.json")
    for turno, cd in ((1, 6257), (2, 6258)):
        for uf in UFS:
            oficial = parse_api(Path(api_dir) / f"{uf.lower()}-{cd}.json")
            soma = {c: sum(v[c] for k, v in agg.items() if k[0] == turno and k[1] == uf) for c in CAMPOS}
            assert soma == oficial, (uf, turno, soma, oficial)
    return agg, nomes


def nome_mun(nome):
    minus = {"de", "da", "do", "das", "dos", "e", "d'"}
    partes = nome.title().split(" ")
    return " ".join(w.lower() if i and w.lower() in minus else w for i, w in enumerate(partes))


def somar(itens):
    tot = defaultdict(int)
    for it in itens:
        for c in CAMPOS:
            tot[c] += it[c]
    return tot


def metricas(t1, t2):
    v1, v2 = t1["validos"], t2["validos"]
    bn1, bn2 = t1["comp"] - v1, t2["comp"] - v2  # brancos + nulos (inclui nulos técnicos e anulados)
    terceira = v1 - t1["pt"] - t1["dir"]
    delta = (t1["abst"] + bn1) - (t2["abst"] + bn2)
    g_pt, g_dir = t2["pt"] - t1["pt"], t2["dir"] - t1["dir"]
    div = lambda a, b: a / b if b else None
    return {
        "aptos": t1["aptos"], "validos_1t": v1, "validos_2t": v2,
        "pt_1t": t1["pt"], "pt_2t": t2["pt"], "dir_1t": t1["dir"], "dir_2t": t2["dir"],
        "pct_pt_1t": div(t1["pt"], v1), "pct_pt_2t": div(t2["pt"], v2),
        "pct_dir_1t": div(t1["dir"], v1), "pct_dir_2t": div(t2["dir"], v2),
        "ganho_pt": g_pt, "ganho_dir": g_dir,
        "cresc_pt": div(g_pt, t1["pt"]), "cresc_dir": div(g_dir, t1["dir"]),
        "pp_pt": div(t2["pt"], v2) - div(t1["pt"], v1) if v1 and v2 else None,
        "pp_dir": div(t2["dir"], v2) - div(t1["dir"], v1) if v1 and v2 else None,
        "terceira_via": terceira, "pct_terceira": div(terceira, v1),
        "abst_1t": t1["abst"], "abst_2t": t2["abst"], "bn_1t": bn1, "bn_2t": bn2,
        "pct_abst_1t": div(t1["abst"], t1["aptos"]), "pct_abst_2t": div(t2["abst"], t2["aptos"]),
        "pct_bn_1t": div(bn1, t1["comp"]), "pct_bn_2t": div(bn2, t2["comp"]),
        "delta_abst": t1["abst"] - t2["abst"], "delta_bn": bn1 - bn2, "delta": delta,
        "pool": terceira + delta,
        "captura_pt": div(g_pt, g_pt + g_dir),
        # % da 3ª via que o PT precisaria ter levado mesmo ficando com 100% do Δ positivo
        "x_min": div(g_pt - max(delta, 0), terceira),
        # transferência da 3ª via implícita supondo Δ dividido 50/50
        "x_impl_50": div(g_pt - 0.5 * delta, terceira),
        "estoque_2t": t2["abst"] + bn2,
        "gap_vitoria": v2 / 2 - t1["pt"],
        "venceu_pt": int(t2["pt"] > t2["dir"]),
    }


def cenarios(m):
    """Para cada X: Y = % do Δ que o PT precisaria para 50% dos válidos; Y implícito no resultado real."""
    out = []
    for x in CENARIOS_X:
        need = m["gap_vitoria"] - x / 100 * m["terceira_via"]
        d = m["delta"]
        if need <= 0:
            status = "dispensa"
        elif d <= 0:
            status = "delta_negativo"
        elif need > d:
            status = "inviavel"
        else:
            status = "viavel"
        out.append({"x": x, "need": round(need), "status": status,
                    "y_win": need / d if d > 0 else None,
                    "y_estoque": need / m["estoque_2t"],
                    "y_impl": (m["ganho_pt"] - x / 100 * m["terceira_via"]) / d if d else None})
    return out


def regressao(rows):
    """Goodman ponderada por aptos: ganho_pt/aptos = c + X·(3ª via/aptos) + Y·(Δ/aptos)."""
    a = np.array([r["aptos"] for r in rows], float)
    y = np.array([r["ganho_pt"] for r in rows], float) / a
    X = np.column_stack([np.ones_like(a), np.array([r["terceira_via"] for r in rows]) / a,
                         np.array([r["delta"] for r in rows]) / a])
    W = a / a.sum()
    XtW = X.T * W
    beta = np.linalg.solve(XtW @ X, XtW @ y)
    e = y - X @ beta
    n, k = X.shape
    s2 = (W * e ** 2).sum() * n / (n - k)
    se = np.sqrt(np.diag(s2 * np.linalg.inv(XtW @ X)) / n)
    ybar = (W * y).sum()
    r2 = 1 - (W * e ** 2).sum() / (W * (y - ybar) ** 2).sum()
    return {"n": n, "c_hat": beta[0], "x_hat": beta[1], "x_se": se[1], "y_hat": beta[2], "y_se": se[2], "r2": r2}


def r4(v):
    return round(v, 5) if isinstance(v, float) else v


def write_csv(path, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows({k: r4(v) for k, v in r.items()} for r in rows)


def main(od_dir, api_dir, mun_dir, out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    uf_rows, cen_rows, mun_rows, reg_rows = [], [], [], []
    for ano in (2018, 2022, 2026):
        agg, nomes = load_api_2026(api_dir, mun_dir) if ano == 2026 else load_open_data(od_dir, ano)
        muns = sorted({(k[1], k[2]) for k in agg})
        cidades = []
        for uf, cod in muns:
            t1, t2 = agg.get((1, uf, cod)), agg.get((2, uf, cod))
            if not t1 or not t2 or not t1["aptos"]:
                continue
            m = metricas(t1, t2)
            cidades.append({"id": f"{ano}-{cod}", "ano": ano, "cod": cod, "municipio": nome_mun(nomes[cod]),
                            "uf": uf, "regiao": REGIAO[uf], **m})
        # agregados: UF, região, Brasil
        grupos = [("UF", uf, UF_NOME[uf], REGIAO[uf], lambda k, uf=uf: k[1] == uf) for uf in UFS]
        grupos += [("REGIAO", r, REGIAO_NOME[r], r, lambda k, r=r: REGIAO[k[1]] == r) for r in REGIAO_NOME if r != "EX"]
        grupos += [("BR", "BR", "Brasil", "BR", lambda k: True)]
        for nivel, cod, nome, reg, sel in grupos:
            t1 = somar(v for k, v in agg.items() if k[0] == 1 and sel(k))
            t2 = somar(v for k, v in agg.items() if k[0] == 2 and sel(k))
            m = metricas(t1, t2)
            uf_rows.append({"id": f"{ano}-{cod}", "ano": ano, "nivel": nivel, "uf": cod, "nome": nome,
                            "regiao": reg, **m})
            for c in cenarios(m):
                cen_rows.append({"id": f"{ano}-{cod}-{c['x']}", "ano": ano, "nivel": nivel, "uf": cod,
                                 "nome": nome, "regiao": reg, **c})
        for escopo in ["BR", "N", "NE", "CO", "SE", "S"]:
            sub = [c for c in cidades if c["uf"] != "ZZ" and (escopo == "BR" or c["regiao"] == escopo)]
            reg_rows.append({"id": f"{ano}-{escopo}", "ano": ano, "escopo": escopo,
                             "nome": "Brasil" if escopo == "BR" else REGIAO_NOME[escopo], **regressao(sub)})
        mun_rows += cidades
        print(ano, "municípios:", len(cidades))
    capitais = {m["cd"] for a in json.load(open(Path(mun_dir) / "cm.json", encoding="utf-8"))["abr"]
                for m in a["mu"] if m.get("c") == "s"}
    vir_rows, top_rows, top_res = viradas_e_top(mun_rows, capitais)
    write_csv(out / "uf.csv", uf_rows)
    write_csv(out / "cenarios.csv", cen_rows)
    write_csv(out / "regressao.csv", reg_rows)
    write_csv(out / "viradas.csv", vir_rows)
    write_csv(out / "top100.csv", top_rows)
    write_csv(out / "top100_resumo.csv", top_res)
    keep = ["id", "ano", "cod", "municipio", "uf", "regiao", "aptos", "pt_1t", "pt_2t", "dir_1t", "dir_2t",
            "validos_1t", "validos_2t", "terceira_via", "delta", "ganho_pt", "ganho_dir", "pct_pt_1t",
            "pct_pt_2t", "pp_pt", "pp_dir", "cresc_pt", "cresc_dir", "pct_terceira", "captura_pt",
            "lider_1t", "venc_2t", "virou", "venc_2t_ant", "mudou_vs_ant"]
    write_csv(out / "cidades.csv", [{k: r[k] for k in keep} for r in mun_rows])
    print("ok ->", out)


def lider(pt, dr):
    return "PT" if pt > dr else "DIR" if dr > pt else "EMP"


TOP_N = 100
MIN_APTOS_PCT = 10_000  # ranking por % só entre cidades com 10 mil+ eleitores (base pequena distorce %)


def viradas_e_top(mun_rows, capitais):
    """Marca viradas por cidade e monta o resumo de viradas e os rankings top 100."""
    venc = defaultdict(dict)  # ano -> cod -> vencedor 2T
    for r in mun_rows:
        r["lider_1t"] = lider(r["pt_1t"], r["dir_1t"])
        r["venc_2t"] = lider(r["pt_2t"], r["dir_2t"])
        r["virou"] = int(r["lider_1t"] != r["venc_2t"])
        venc[r["ano"]][r["cod"]] = r["venc_2t"]
    anos = sorted(venc)
    for r in mun_rows:
        i = anos.index(r["ano"])
        ant = venc[anos[i - 1]].get(r["cod"]) if i else None
        r["venc_2t_ant"] = ant or ""
        r["mudou_vs_ant"] = "" if not ant else int(ant != r["venc_2t"])

    vir = []
    for ano in anos:
        for esc in ["BR", "N", "NE", "CO", "SE", "S", "EX"]:
            sub = [r for r in mun_rows if r["ano"] == ano and (esc == "BR" or r["regiao"] == esc)]
            comp = [r for r in sub if r["mudou_vs_ant"] != ""]
            vir.append({
                "id": f"{ano}-{esc}", "ano": ano, "escopo": esc,
                "nome": "Brasil" if esc == "BR" else REGIAO_NOME[esc], "cidades": len(sub),
                "lider_pt_1t": sum(r["lider_1t"] == "PT" for r in sub),
                "lider_dir_1t": sum(r["lider_1t"] == "DIR" for r in sub),
                "venc_pt_2t": sum(r["venc_2t"] == "PT" for r in sub),
                "venc_dir_2t": sum(r["venc_2t"] == "DIR" for r in sub),
                "viradas": sum(r["virou"] for r in sub),
                "viradas_para_pt": sum(r["virou"] and r["venc_2t"] == "PT" for r in sub),
                "viradas_para_dir": sum(r["virou"] and r["venc_2t"] == "DIR" for r in sub),
                "eleitores_virados": sum(r["aptos"] for r in sub if r["virou"]),
                "mudou_vs_ant": sum(r["mudou_vs_ant"] == 1 for r in comp) if comp else None,
                "mudou_para_pt": sum(r["mudou_vs_ant"] == 1 and r["venc_2t"] == "PT" for r in comp) if comp else None,
                "mudou_para_dir": sum(r["mudou_vs_ant"] == 1 and r["venc_2t"] == "DIR" for r in comp) if comp else None,
                # cidades onde um ou ambos os finalistas tiveram MENOS votos no 2T que no 1T
                "perdeu_pt": sum(r["ganho_pt"] < 0 for r in sub),
                "perdeu_dir": sum(r["ganho_dir"] < 0 for r in sub),
                "perdeu_so_pt": sum(r["ganho_pt"] < 0 <= r["ganho_dir"] for r in sub),
                "perdeu_so_dir": sum(r["ganho_dir"] < 0 <= r["ganho_pt"] for r in sub),
                "perdeu_ambos": sum(r["ganho_pt"] < 0 and r["ganho_dir"] < 0 for r in sub),
                "votos_perdidos_pt": -sum(r["ganho_pt"] for r in sub if r["ganho_pt"] < 0),
                "votos_perdidos_dir": -sum(r["ganho_dir"] for r in sub if r["ganho_dir"] < 0),
                "eleitores_perda_pt": sum(r["aptos"] for r in sub if r["ganho_pt"] < 0),
                "eleitores_perda_dir": sum(r["aptos"] for r in sub if r["ganho_dir"] < 0),
            })

    top, res = [], []
    tops = {}  # (ano, cand, crit) -> set de códigos
    for ano in anos:
        base = [r for r in mun_rows if r["ano"] == ano and r["uf"] != "ZZ"]
        for cand in ("pt", "dir"):
            for crit in ("abs", "pct", "perda"):
                if crit == "abs":
                    sel = sorted(base, key=lambda r: r[f"ganho_{cand}"], reverse=True)[:TOP_N]
                elif crit == "pct":
                    pool = [r for r in base if r["aptos"] >= MIN_APTOS_PCT and r[f"{cand}_1t"]]
                    sel = sorted(pool, key=lambda r: r[f"cresc_{cand}"], reverse=True)[:TOP_N]
                else:  # maiores perdas absolutas de votos entre 1T e 2T
                    sel = sorted((r for r in base if r[f"ganho_{cand}"] < 0), key=lambda r: r[f"ganho_{cand}"])[:TOP_N]
                tops[(ano, cand, crit)] = {r["cod"] for r in sel}
                for i, r in enumerate(sel, 1):
                    top.append({"id": f"{ano}-{cand}-{crit}-{i}", "ano": ano, "cand": cand, "crit": crit,
                                "rank": i, "cod": r["cod"], "municipio": r["municipio"], "uf": r["uf"],
                                "regiao": r["regiao"], "capital": int(r["cod"] in capitais), "aptos": r["aptos"],
                                "votos_1t": r[f"{cand}_1t"], "votos_2t": r[f"{cand}_2t"],
                                "ganho": r[f"ganho_{cand}"], "cresc": r[f"cresc_{cand}"], "pp": r[f"pp_{cand}"],
                                "virou": r["virou"], "venc_2t": r["venc_2t"]})
                ganho_total = sum(r[f"ganho_{cand}"] for r in base)
                i = anos.index(ano)
                prev = tops.get((anos[i - 1], cand, crit)) if i else None
                res.append({"id": f"{ano}-{cand}-{crit}", "ano": ano, "cand": cand, "crit": crit,
                            "ganho_top": sum(r[f"ganho_{cand}"] for r in sel),
                            "pct_ganho_total": (sum(r[f"ganho_{cand}"] for r in sel) / ganho_total
                                                if ganho_total and crit != "perda" else None),
                            "ganho_total": ganho_total,
                            "cidades": len(sel),
                            "mediana_cresc": float(np.median([r[f"cresc_{cand}"] for r in sel])) if sel else None,
                            "capitais": sum(r["cod"] in capitais for r in sel),
                            **{f"reg_{g}": sum(r["regiao"] == g for r in sel) for g in ["N", "NE", "CO", "SE", "S"]},
                            "repetidas_ant": len(tops[(ano, cand, crit)] & prev) if prev else None})
    return vir, top, res


if __name__ == "__main__":
    main(*sys.argv[1:5])
