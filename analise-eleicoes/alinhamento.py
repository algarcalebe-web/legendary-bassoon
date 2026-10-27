"""Quem era a 3ª via e para onde foi no 2º turno, de 2002 a 2026. Só dados do TSE, exceto a coluna de
apoio formal no 2º turno, que é hipótese de partida (registro de imprensa) e é testada contra os dados.

Para cada eleição:
  1. Grupos partidários pela coligação registrada no TSE: coligação do PT, coligação do adversário,
     coligação de cada candidato da 3ª via, demais partidos.
  2. Bancadas: deputados federais, senadores e governadores eleitos por grupo (consulta_cand do TSE;
     2026 pela API de resultados) e votos para deputado federal.
  3. Origem: que fatia dos eleitores de cada candidato do 1º turno tinha votado no PT no 2º turno da
     eleição anterior (regressão ecológica entre municípios).
  4. Voto para deputado: que fatia dos eleitores de cada candidato votou em deputados da coligação do PT
     e da coligação do adversário (regressão ecológica).
  5. Transferência no 2º turno por candidato:
     ganho do PT/eleitor = c_região + Σ X_k·(votos do candidato k/eleitor) + Y·(saldo/eleitor).

Uso (numpy): python -I alinhamento.py <od_dir> <api_dir> <mun_dir> <apiuf_dir> <out_dir>
"""
import csv
import io
import json
import re
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import auditoria as au  # noqa: E402
import build_dataset as bd  # noqa: E402

MIN_3A = 0.015  # candidato da 3ª via com estimativa própria se tiver 1,5%+ dos válidos
# Apoio formal declarado no 2º turno pelo candidato ou partido (registro de imprensa). Hipótese, não dado do TSE.
APOIO = {
    2002: {40: "PT", 23: "PT"},                       # Garotinho (PSB), Ciro (PPS)
    2010: {43: "neutro"},                             # Marina (PV)
    2014: {40: "ADV"},                                # Marina (PSB)
    2018: {12: "PT", 45: "neutro", 30: "neutro"},     # Ciro (PDT, apoio crítico), Alckmin (PSDB), Amoêdo (Novo)
    2022: {15: "PT", 12: "PT"},                       # Tebet (MDB), Ciro (PDT)
    2026: {55: "ADV", 70: "ADV", 30: "ADV", 14: "neutro"},  # Caiado (PSD), Cury (Avante), Zema (Novo), Renan (Missão)
}


def norm(sigla):
    return re.sub(r"[^A-Z0-9]", "", sigla.upper().replace("Ç", "C").replace("Ã", "A").replace("Õ", "O"))


def siglas_coligacao(texto, propria):
    """'PSB / FEDERAÇÃO X (PT / PC do B) / PDT' -> {'PSB','PT','PCDOB','PDT'} (inclui a própria sigla)."""
    out = {norm(propria)}
    texto = re.sub(r"[^()/]*\(([^)]*)\)", lambda m: m.group(1), texto)
    for parte in texto.split("/"):
        p = norm(parte)
        if p and p not in ("NULO", "NULO#"):
            out.add(p)
    return out


def ler_partidos(od_dir, ano):
    """Votos por (cargo, município) e partido no 1º turno; coligação de cada candidato a presidente."""
    votos = defaultdict(lambda: defaultdict(int))
    sigla, colig = {}, {}
    for r in bd.read_brasil_csv(Path(od_dir) / f"votacao_partido_munzona_{ano}.zip"):
        cargo = int(r["CD_CARGO"])
        if r["NR_TURNO"] != "1" or cargo not in (1, 6) or r["SG_UF"] == "ZZ":
            continue
        if "QT_VOTOS_NOMINAIS_VALIDOS" in r:
            v = int(r["QT_VOTOS_NOMINAIS_VALIDOS"]) + int(r["QT_TOTAL_VOTOS_LEG_VALIDOS"] or 0)
        else:
            v = int(r["QT_VOTOS_NOMINAIS"]) + int(r.get("QT_VOTOS_LEGENDA") or 0)
        nr = int(r["NR_PARTIDO"])
        sigla[nr] = r["SG_PARTIDO"]
        if cargo == 1 and nr not in colig:
            colig[nr] = siglas_coligacao(r.get("DS_COMPOSICAO_COLIGACAO") or "", r["SG_PARTIDO"])
        votos[(cargo, r["CD_MUNICIPIO"].zfill(5))][nr] += v
    return votos, sigla, colig


def nomes_presidente(od_dir, ano, api_dir):
    if ano == 2026:
        d = json.load(open(Path(api_dir) / "br-6257.json", encoding="utf-8"))
        return {int(c["n"]): c["nmu"].title() for a in d["carg"][0]["agr"] for p in a["par"] for c in p["cand"]}
    out = {}
    with zipfile.ZipFile(Path(od_dir) / f"consulta_cand_{ano}.zip") as z:
        n = next(x for x in z.namelist() if x.endswith("_BRASIL.csv"))
        for r in csv.DictReader(io.TextIOWrapper(z.open(n), encoding="latin1"), delimiter=";"):
            if r["CD_CARGO"] == "1" and r["NR_TURNO"] == "1":
                out[int(r["NR_PARTIDO"])] = r["NM_URNA_CANDIDATO"].title()
    return out


def eleitos(od_dir, ano, apiuf_dir):
    """{(cargo, sigla normalizada): eleitos}."""
    out = defaultdict(int)
    if ano == 2026:
        for cargo, cd in ((3, "0003"), (5, "0005"), (6, "0006")):
            for f in sorted(Path(apiuf_dir).glob(f"*-6259-{cd}.json")):
                d = json.load(open(f, encoding="utf-8"))
                seg = {}
                f2 = Path(apiuf_dir) / f"{f.name[:2]}-6260-0003.json"
                if cargo == 3 and f2.exists():
                    d2 = json.load(open(f2, encoding="utf-8"))
                    seg = {c["sqcand"]: c["st"] for a in d2["carg"][0]["agr"] for p in a["par"] for c in p["cand"]}
                for a in d["carg"][0]["agr"]:
                    for p in a["par"]:
                        for c in p["cand"]:
                            st = seg.get(c["sqcand"], c["st"]) if c["st"].startswith("2º") else c["st"]
                            if st.startswith("Eleito"):
                                out[(cargo, norm(p["sg"]))] += 1
        return out
    vistos = set()
    with zipfile.ZipFile(Path(od_dir) / f"consulta_cand_{ano}.zip") as z:
        n = next(x for x in z.namelist() if x.endswith("_BRASIL.csv"))
        for r in csv.DictReader(io.TextIOWrapper(z.open(n), encoding="latin1"), delimiter=";"):
            cargo = int(r["CD_CARGO"])
            chave = (cargo, r["SG_UF"], r["NR_CANDIDATO"])  # SQ_CANDIDATO se repete entre UFs em anos antigos
            sit = r["DS_SIT_TOT_TURNO"]
            if cargo in (3, 5, 6) and (sit.startswith("ELEITO") or sit == "MÉDIA") and chave not in vistos:
                vistos.add(chave)
                out[(cargo, norm(r["SG_PARTIDO"]))] += 1
    return out


def goodman(Y, X, w):
    W = w / w.sum()
    XtW = X.T * W
    beta = np.linalg.solve(XtW @ X, XtW @ Y)
    e = Y - X @ beta
    n, k = X.shape
    s2 = (W * e ** 2).sum() * n / (n - k)
    se = np.sqrt(np.diag(s2 * np.linalg.inv(XtW @ X)) / n)
    return beta, se


def analisa(ano, od_dir, api_dir, mun_dir, apiuf_dir, cid_por_ano):
    pt_nr, pt_nome, adv_nr, adv_nome = au.FINAIS[ano]
    votos, sigla, colig = ler_partidos(od_dir, ano)
    nomes = nomes_presidente(od_dir, ano, api_dir)
    cs = [c for c in cid_por_ano[ano] if (1, c["cod"]) in votos and (6, c["cod"]) in votos]
    cods = [c["cod"] for c in cs]
    reg = np.array([c["regiao"] for c in cs])
    w = np.array([c["t1"]["aptos"] for c in cs], float)

    pres_tot = defaultdict(int)
    for cod in cods:
        for nr, v in votos[(1, cod)].items():
            pres_tot[nr] += v
    tot = sum(pres_tot.values())
    terceiros = [nr for nr, v in sorted(pres_tot.items(), key=lambda kv: -kv[1]) if nr not in (pt_nr, adv_nr) and v / tot >= MIN_3A]
    todos_3a = [nr for nr, v in sorted(pres_tot.items(), key=lambda kv: -kv[1]) if nr not in (pt_nr, adv_nr)]

    # 1. grupo de cada partido
    grupo_sigla = {}
    for s in colig.get(pt_nr, set()):
        grupo_sigla[s] = "PT"
    for s in colig.get(adv_nr, set()):
        grupo_sigla.setdefault(s, "ADV")
    for nr in todos_3a:
        for s in colig.get(nr, set()):
            grupo_sigla.setdefault(s, f"C{nr}")
    grupo = lambda nr: grupo_sigla.get(norm(sigla.get(nr, str(nr))), "OUTROS")

    # 2. bancadas por grupo
    el = eleitos(od_dir, ano, apiuf_dir)
    dep_tot = defaultdict(int)
    for cod in cods:
        for nr, v in votos[(6, cod)].items():
            dep_tot[grupo(nr)] += v
    dep_sum = sum(dep_tot.values())
    el_g = defaultdict(lambda: defaultdict(int))
    for (cargo, s), n in el.items():
        el_g[grupo_sigla.get(s, "OUTROS")][cargo] += n
    grupos = ["PT", "ADV"] + [f"C{nr}" for nr in todos_3a if any(grupo_sigla.get(s) == f"C{nr}" for s in colig.get(nr, ()))] + ["OUTROS"]
    bancadas = []
    for g in grupos:
        nr = pt_nr if g == "PT" else adv_nr if g == "ADV" else int(g[1:]) if g.startswith("C") else None
        apoio = "PT" if g == "PT" else "ADV" if g == "ADV" else APOIO.get(ano, {}).get(nr, "sem registro") if nr else "—"
        bancadas.append({"id": f"{ano}-{g}", "ano": ano, "grupo": g,
                         "candidato": (pt_nome if g == "PT" else adv_nome if g == "ADV" else nomes.get(nr, "")) if nr else "Partidos sem candidato a presidente",
                         "partido": sigla.get(nr, "") if nr else "",
                         "coligacao": " / ".join(sorted(s for s, gg in grupo_sigla.items() if gg == g)) if nr else "",
                         "pct_pres_1t": pres_tot.get(nr, 0) / tot if nr else None, "apoio_2t": apoio,
                         "deputados": el_g[g][6], "senadores": el_g[g][5], "governadores": el_g[g][3],
                         "pct_votos_dep": dep_tot[g] / dep_sum})

    # fatias do 1º turno presidencial por município
    val1 = np.array([sum(votos[(1, c)].values()) for c in cods], float)
    sh = lambda nr: np.array([votos[(1, c)].get(nr, 0) for c in cods], float) / val1
    cols = [("pt", sh(pt_nr)), ("adv", sh(adv_nr))] + [(str(nr), sh(nr)) for nr in terceiros]
    resto = 1 - sum(c for _, c in cols)
    cols.append(("resto", resto))
    X = np.column_stack([c for _, c in cols])
    X3 = np.column_stack([sh(pt_nr), sh(adv_nr), 1 - sh(pt_nr) - sh(adv_nr)])

    def linha(nome, extra):
        nr = int(nome) if nome.isdigit() else None
        rot = {"pt": pt_nome, "adv": adv_nome, "resto": "Demais da 3ª via", "terceira": "3ª via inteira"}.get(nome) or nomes.get(nr, sigla.get(nr, nome))
        return {"id": f"{ano}-{nome}", "ano": ano, "grupo": nome, "candidato": rot,
                "partido": sigla.get(nr, "") if nr else "", "pct_pres_1t": pres_tot.get(nr, 0) / tot if nr else None,
                "apoio_2t": APOIO.get(ano, {}).get(nr, "sem registro") if nr else "—", **extra}

    res = {nome: {} for nome, _ in cols}
    res["terceira"] = {}
    # 3. origem: voto no PT no 2º turno anterior
    ant = cid_por_ano.get(ano - 4)
    if ant:
        prev = {c["cod"]: c["t2"]["pt"] / (c["t2"]["pt"] + c["t2"]["dir"]) for c in ant if c["t2"]["pt"] + c["t2"]["dir"]}
        ok = np.array([c in prev for c in cods])
        y = np.array([prev.get(c, 0) for c in cods])
        b, se = goodman(y[ok], X[ok], w[ok])
        b3, se3 = goodman(y[ok], X3[ok], w[ok])
        for (nome, _), bi, si in zip(cols, b, se):
            res[nome].update({"origem_pt": bi, "origem_pt_se": si})
        res["terceira"].update({"origem_pt": b3[2], "origem_pt_se": se3[2]})
    # 4. voto para deputado federal por grupo
    dep_val = np.array([sum(votos[(6, c)].values()) for c in cods], float)
    for g in ("PT", "ADV"):
        y = np.array([sum(v for nr, v in votos[(6, c)].items() if grupo(nr) == g) for c in cods], float) / dep_val
        b, se = goodman(y, X, w)
        b3, se3 = goodman(y, X3, w)
        for (nome, _), bi, si in zip(cols, b, se):
            res[nome].update({f"dep_{g.lower()}": bi, f"dep_{g.lower()}_se": si})
        res["terceira"].update({f"dep_{g.lower()}": b3[2], f"dep_{g.lower()}_se": se3[2]})
    # índice geográfico: média, ponderada pelos votos de cada candidato, de características das cidades,
    # posicionada entre o eleitorado do adversário (0) e o do PT (1). Descritivo, sem regressão.
    votos_k = {nome: col * val1 for nome, col in cols}
    votos_k["terceira"] = (1 - sh(pt_nr) - sh(adv_nr)) * val1
    carac = {}
    if ant:
        carac["prev"] = (np.array([prev.get(c, np.nan) for c in cods]))
    dep_pt = np.array([sum(v for nr, v in votos[(6, c)].items() if grupo(nr) == "PT") for c in cods], float) / dep_val
    dep_adv = np.array([sum(v for nr, v in votos[(6, c)].items() if grupo(nr) == "ADV") for c in cods], float) / dep_val
    carac["dep"] = dep_pt - dep_adv
    for chave, x in carac.items():
        ok = ~np.isnan(x)
        med = {nome: float(np.average(x[ok], weights=vk[ok])) if vk[ok].sum() else None for nome, vk in votos_k.items()}
        for nome in res:
            if med.get(nome) is not None:
                res[nome][f"geo_{chave}"] = med[nome]
                res[nome][f"pos_{chave}"] = (med[nome] - med["adv"]) / (med["pt"] - med["adv"])
    # 5. transferência no 2º turno por candidato
    g2 = lambda t, k: np.array([c[t][k] for c in cs], float)
    ab1, ab2, comp1, comp2 = g2("t1", "abst"), g2("t2", "abst"), g2("t1", "comp"), g2("t2", "comp")
    v1, v2 = g2("t1", "validos"), g2("t2", "validos")
    gpt = g2("t2", "pt") - g2("t1", "pt")
    delta = (ab1 + comp1 - v1) - (ab2 + comp2 - v2)
    regs = sorted(set(reg))
    D = np.column_stack([(reg == r).astype(float) for r in regs])
    cv = {nr: np.array([votos[(1, c)].get(nr, 0) for c in cods], float) for nr in terceiros}
    resto_v = v1 - g2("t1", "pt") - g2("t1", "dir") - sum(cv.values())
    Xt = np.column_stack([D] + [cv[nr] / w for nr in terceiros] + [resto_v / w, delta / w])
    bt, st = goodman(gpt / w, Xt, w)
    for j, nome in enumerate([str(nr) for nr in terceiros] + ["resto"]):
        res[nome].update({"transf_pt": bt[len(regs) + j], "transf_pt_se": st[len(regs) + j]})
    Xt3 = np.column_stack([D, (v1 - g2("t1", "pt") - g2("t1", "dir")) / w, delta / w])
    bt3, st3 = goodman(gpt / w, Xt3, w)
    res["terceira"].update({"transf_pt": bt3[len(regs)], "transf_pt_se": st3[len(regs)]})
    # especificação alternativa (uma constante nacional): mostra a sensibilidade da estimativa ao modelo
    Xt4 = np.column_stack([np.ones_like(w), (v1 - g2("t1", "pt") - g2("t1", "dir")) / w, delta / w])
    bt4, st4 = goodman(gpt / w, Xt4, w)
    res["terceira"].update({"transf_pt_alt": bt4[1], "transf_pt_alt_se": st4[1]})
    t = res["terceira"]
    if "origem_pt" in t:
        t["conversao"] = t["transf_pt"] - t["origem_pt"]
        t["conversao_alt"] = t["transf_pt_alt"] - t["origem_pt"]
    eleitores = [linha(nome, {k: float(v) for k, v in res[nome].items()}) for nome in [n for n, _ in cols] + ["terceira"]]
    return bancadas, eleitores


def main(od_dir, api_dir, mun_dir, apiuf_dir, out_dir):
    out = Path(out_dir)
    cid = {ano: au.cidades_do_ano(od_dir, api_dir, mun_dir, ano) for ano in au.ANOS}
    B, E = [], []
    for ano in au.ANOS:
        b, e = analisa(ano, od_dir, api_dir, mun_dir, apiuf_dir, cid)
        B += b
        E += e
        print(ano, "ok")
    chaves = list(dict.fromkeys(k for r in E for k in r))
    E = [{k: r.get(k) for k in chaves} for r in E]
    bd.write_csv(out / "bancadas.csv", B)
    bd.write_csv(out / "eleitores_3a_via.csv", E)


if __name__ == "__main__":
    main(*sys.argv[1:6])
