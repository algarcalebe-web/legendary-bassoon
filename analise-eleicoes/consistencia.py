"""Testes de consistência do 1º para o 2º turno, 2002–2026, por município. Só dados do TSE.

1. Contabilidade, por zona e por município, nos dois turnos:
     aptos = comparecimento + abstenção
     comparecimento = válidos + brancos + nulos + anulados
     válidos = soma dos votos dos candidatos
2. 2026: as duas publicações do TSE para o 1º turno (dados abertos e API de resultados) batem cidade a cidade?
3. Crescimento líquido (ganho do PT − ganho do adversário):
     cidades que destoam do próprio estado (z robusto do swing da margem contra a mediana da UF)
     estabilidade: correlação, entre cidades, da votação e do swing com a eleição anterior
     votos novos indo todos para um lado: inclinação do ganho líquido sobre a variação do comparecimento,
       dentro de cada UF (1 = cada eleitor a mais virou margem para o PT)
     concentração: correlação do ganho líquido com a força do PT no 1º turno
     extremos: saltos de comparecimento e brancos+nulos quase zerados

Uso (numpy): python -I consistencia.py <od_dir> <api_dir> <mun_dir> <detalhe_2026_zip> <out_dir>
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import auditoria as au  # noqa: E402
import build_dataset as bd  # noqa: E402

MIN_APTOS_LISTA = 5_000


def contab_aberto(od_dir, ano, detalhe=None):
    """Identidades contábeis nos dados abertos, por zona. Devolve contagens e o agregado por município."""
    z = defaultdict(lambda: defaultdict(int))
    for r in bd.read_brasil_csv(detalhe or Path(od_dir) / f"detalhe_votacao_munzona_{ano}.zip"):
        if r["CD_CARGO"] != "1":
            continue
        k = (int(r["NR_TURNO"]), r["CD_MUNICIPIO"].zfill(5), r["NR_ZONA"])
        g = lambda c: int(r.get(c) or 0)
        z[k]["aptos"] += g("QT_APTOS")
        z[k]["comp"] += g("QT_COMPARECIMENTO")
        z[k]["abst"] += g("QT_ABSTENCOES")
        z[k]["validos"] += g("QT_TOTAL_VOTOS_VALIDOS")
        z[k]["brancos"] += g("QT_VOTOS_BRANCOS")
        z[k]["nulos"] += g("QT_TOTAL_VOTOS_NULOS")
        z[k]["anulados"] += g("QT_TOTAL_VOTOS_ANULADOS") + g("QT_TOTAL_VOTOS_ANUL_SUBJUD") + g("QT_VOTOS_ANULADOS_APU_SEP")
    cand = defaultdict(int)
    por_cand = defaultdict(lambda: defaultdict(int))
    turnos = {t for t, _, _ in z}
    for r in bd.read_brasil_csv(Path(od_dir) / f"votacao_partido_munzona_{ano}.zip"):
        if r["CD_CARGO"] == "1" and int(r["NR_TURNO"]) in turnos:
            k = (int(r["NR_TURNO"]), r["CD_MUNICIPIO"].zfill(5), r["NR_ZONA"])
            v = bd.votos_partido(r)
            cand[k] += v
            por_cand[(k[0], k[1])][int(r["NR_PARTIDO"])] += v
    out = {"zonas": len(z), "z_aptos": 0, "z_comp": 0, "z_validos": 0, "v_aptos": 0, "v_comp": 0, "v_validos": 0}
    mun = defaultdict(lambda: defaultdict(int))
    for k, d in z.items():
        e1 = d["aptos"] - d["comp"] - d["abst"]
        e2 = d["comp"] - d["validos"] - d["brancos"] - d["nulos"] - d["anulados"]
        e3 = d["validos"] - cand.get(k, 0)
        for nome, e in (("aptos", e1), ("comp", e2), ("validos", e3)):
            out[f"z_{nome}"] += int(e != 0)
            out[f"v_{nome}"] += abs(e)
        for c, v in d.items():
            mun[(k[0], k[1])][c] += v
    return out, mun, por_cand


def contab_api(mun_dir):
    """Identidades contábeis nos arquivos por município da API de 2026 (1º e 2º turno)."""
    cm = json.load(open(Path(mun_dir) / "cm.json", encoding="utf-8"))
    out = {"t1": {"zonas": 0, "z_aptos": 0, "z_comp": 0, "z_validos": 0, "v_aptos": 0, "v_comp": 0, "v_validos": 0},
           "t2": {"zonas": 0, "z_aptos": 0, "z_comp": 0, "z_validos": 0, "v_aptos": 0, "v_comp": 0, "v_validos": 0}}
    api1 = {}
    for a in cm["abr"]:
        for m in a["mu"]:
            for t, cd in ((1, 6257), (2, 6258)):
                d = json.load(open(Path(mun_dir) / "files" / f"{a['cd']}{m['cd']}-{cd}.json", encoding="utf-8"))
                e, v = d["e"], d["v"]
                cands = {int(c["n"]): int(c["vap"]) for g in d["carg"][0]["agr"] for p in g["par"] for c in p["cand"]}
                i = lambda x: int(x or 0)
                e1 = i(e["te"]) - i(e["c"]) - i(e["a"])
                e2 = i(e["c"]) - i(v["vv"]) - i(v["vb"]) - i(v["tvn"]) - i(v.get("van")) - i(v.get("vansj"))
                e3 = i(v["vv"]) - sum(cands.values())
                o = out[f"t{t}"]
                o["zonas"] += 1
                for nome, err in (("aptos", e1), ("comp", e2), ("validos", e3)):
                    o[f"z_{nome}"] += int(err != 0)
                    o[f"v_{nome}"] += abs(err)
                if t == 1:
                    api1[m["cd"]] = {"aptos": i(e["te"]), "comp": i(e["c"]), "abst": i(e["a"]), "validos": i(v["vv"]),
                                     "brancos": i(v["vb"]), "cands": cands}
    return out, api1


def cruzamento_2026(od_dir, detalhe_2026, api1):
    """Dados abertos × API do 1º turno de 2026, cidade a cidade."""
    _, mun, por_cand = contab_aberto(od_dir, 2026, detalhe_2026)
    dif = {"cidades": 0, "aptos": 0, "comp": 0, "abst": 0, "validos": 0, "brancos": 0, "candidatos": 0, "so_um_lado": 0}
    for (t, cod), d in mun.items():
        if t != 1:
            continue
        a = api1.get(cod)
        if not a:
            dif["so_um_lado"] += 1
            continue
        dif["cidades"] += 1
        for c in ("aptos", "comp", "abst", "validos", "brancos"):
            dif[c] += int(d[c] != a[c])
        dif["candidatos"] += int(dict(por_cand[(1, cod)]) != {k: v for k, v in a["cands"].items() if v or k in por_cand[(1, cod)]})
    dif["so_um_lado"] += len(set(api1) - {cod for t, cod in mun if t == 1})
    return dif


def wcorr(x, y, w):
    mx, my = np.average(x, weights=w), np.average(y, weights=w)
    return float(np.average((x - mx) * (y - my), weights=w) / np.sqrt(np.average((x - mx) ** 2, weights=w) * np.average((y - my) ** 2, weights=w)))


def metricas_cidades(cs):
    g = lambda t, k: np.array([c[t][k] for c in cs], float)
    apt1, apt2 = g("t1", "aptos"), g("t2", "aptos")
    comp1, comp2 = g("t1", "comp"), g("t2", "comp")
    v1, v2 = g("t1", "validos"), g("t2", "validos")
    pt1, pt2, ad1, ad2 = g("t1", "pt"), g("t2", "pt"), g("t1", "dir"), g("t2", "dir")
    return {"cod": np.array([c["cod"] for c in cs]), "uf": np.array([c["uf"] for c in cs]), "aptos": apt1,
            "net": (pt2 - pt1) - (ad2 - ad1), "net_apt": ((pt2 - pt1) - (ad2 - ad1)) / apt1,
            "swing": (pt2 - ad2) / v2 - (pt1 - ad1) / v1, "pt2": pt2 / v2, "pt1": pt1 / v1,
            "dcomp": comp2 / apt2 - comp1 / apt1, "turn2": comp2 / apt2, "bn2": (comp2 - v2) / comp2}


def main(od_dir, api_dir, mun_dir, detalhe_2026, out_dir):
    out = Path(out_dir)
    serie, locais, extremos = [], [], []
    prev = None
    api_contab, api1 = contab_api(mun_dir)
    cruz = cruzamento_2026(od_dir, detalhe_2026, api1)
    for ano in au.ANOS:
        cs = au.cidades_do_ano(od_dir, api_dir, mun_dir, ano)
        m = metricas_cidades(cs)
        w = m["aptos"]
        linha = {"id": str(ano), "ano": ano, "cidades": len(cs)}
        # 1. contabilidade
        if ano == 2026:
            for t in ("t1", "t2"):
                for k, v in api_contab[t].items():
                    linha[f"{t}_{k}"] = v
            linha.update({f"cruz_{k}": v for k, v in cruz.items()})
        else:
            c, _, _ = contab_aberto(od_dir, ano)
            for k, v in c.items():
                linha[f"t12_{k}"] = v
        # 2. crescimento líquido
        linha["net_votos"] = float(m["net"].sum())
        linha["net_pct_aptos"] = float(m["net"].sum() / w.sum())
        linha["pct_cid_net_pt"] = float((m["net"] > 0).mean())
        linha["sd_swing_margem"] = float(np.sqrt(np.average((m["swing"] - np.average(m["swing"], weights=w)) ** 2, weights=w)))
        # cidades que destoam do próprio estado
        zl = np.zeros(len(cs))
        for u in np.unique(m["uf"]):
            k = m["uf"] == u
            med = np.median(m["swing"][k])
            mad = 1.4826 * np.median(np.abs(m["swing"][k] - med)) or 1e-9
            zl[k] = (m["swing"][k] - med) / mad
        linha["locais_z4_por_mil"] = float((np.abs(zl) > 4).mean() * 1000)
        linha["locais_z4_pro_pt"] = int((zl > 4).sum())
        linha["locais_z4_pro_adv"] = int((zl < -4).sum())
        grande = m["aptos"] >= MIN_APTOS_LISTA
        for rank, i in enumerate([i for i in np.argsort(-np.abs(zl)) if grande[i]][:25], 1):
            c = cs[i]
            locais.append({"id": f"{ano}-{c['cod']}", "ano": ano, "rank": rank, "cod": c["cod"], "municipio": c["municipio"],
                           "uf": c["uf"], "aptos": int(w[i]), "z_local": float(zl[i]), "swing_margem": float(m["swing"][i]),
                           "mediana_uf": float(np.median(m["swing"][m["uf"] == c["uf"]])), "net_votos": int(m["net"][i]),
                           "d_comp_pp": float(m["dcomp"][i])})
        # votos novos indo todos para um lado: inclinação dentro de cada UF
        dm = lambda x: x - np.array([np.average(x[m["uf"] == u], weights=w[m["uf"] == u]) for u in m["uf"]])
        x, y = dm(m["dcomp"]), dm(m["net_apt"])
        linha["inclinacao_net_comparecimento"] = float(np.sum(w * x * y) / np.sum(w * x * x))
        linha["corr_net_comparecimento"] = wcorr(x, y, w)
        linha["corr_net_pt_1t"] = wcorr(m["net_apt"], m["pt1"], w)
        # extremos
        linha["pct_cid_comp_sobe_5pp"] = float((m["dcomp"] >= 0.05).mean())
        linha["pct_cid_comp_cai_5pp"] = float((m["dcomp"] <= -0.05).mean())
        linha["pct_cid_comp2_95"] = float((m["turn2"] >= 0.95).mean())
        linha["pct_cid_bn2_1pct"] = float((m["bn2"] < 0.01).mean())
        for i in np.where((m["dcomp"] >= 0.05) | (m["bn2"] < 0.01))[0]:
            c = cs[i]
            extremos.append({"id": f"{ano}-{c['cod']}", "ano": ano, "cod": c["cod"], "municipio": c["municipio"], "uf": c["uf"],
                             "aptos": int(w[i]), "tipo": "comparecimento +5 p.p." if m["dcomp"][i] >= 0.05 else "brancos + nulos < 1%",
                             "d_comp_pp": float(m["dcomp"][i]), "comp_2t": float(m["turn2"][i]), "bn_2t": float(m["bn2"][i]),
                             "swing_margem": float(m["swing"][i]), "net_votos": int(m["net"][i]),
                             "venc_2t": "PT" if m["pt2"][i] > 0.5 else "DIR" if m["pt2"][i] < 0.5 else "EMP"})
        # estabilidade com a eleição anterior
        if prev is not None:
            idx = {c: i for i, c in enumerate(prev["cod"])}
            par = [(i, idx[c]) for i, c in enumerate(m["cod"]) if c in idx]
            a, b = np.array([p[0] for p in par]), np.array([p[1] for p in par])
            linha["corr_pt2_anterior"] = wcorr(m["pt2"][a], prev["pt2"][b], w[a])
            linha["corr_swing_anterior"] = wcorr(m["swing"][a], prev["swing"][b], w[a])
        linha["corr_pt1_pt2"] = wcorr(m["pt1"], m["pt2"], w)
        serie.append(linha)
        prev = m
        print(ano, "ok")
    bd.write_csv(out / "consistencia_serie.csv", serie)
    bd.write_csv(out / "consistencia_locais.csv", locais)
    bd.write_csv(out / "consistencia_extremos.csv", extremos)


if __name__ == "__main__":
    main(*sys.argv[1:6])
