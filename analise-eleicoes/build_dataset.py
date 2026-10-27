"""Monta as bases 1º × 2º turno das eleições presidenciais de 2002 a 2026: Brasil, regiões, UFs e municípios,
cenários de transferência, regressão ecológica, porte, viradas, perdas e top 100, e os arquivos do mapa.

Fontes (TSE):
  2002–2022: dados abertos (detalhe_votacao_munzona + votacao_partido_munzona), zips em <od_dir>
  2026:      API de resultados (6257 = 1º turno, 6258 = 2º turno): <api_dir>/<uf>-<cd>.json (UFs),
             <mun_dir>/files/<uf><mun>-<cd>.json (municípios) e <mun_dir>/cm.json (lista de municípios);
             líder do 1º turno entre todos os candidatos: votacao_partido_munzona_2026.zip

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
           "SC": "Santa Catarina", "SE": "Sergipe", "SP": "São Paulo", "TO": "Tocantins", "ZZ": "Exterior",
           "VT": "Voto em trânsito"}  # VT: seções de trânsito que o TSE publicou à parte em 2010
UFS = list(UF_NOME)
REGIAO = {"AC": "N", "AM": "N", "AP": "N", "PA": "N", "RO": "N", "RR": "N", "TO": "N",
          "AL": "NE", "BA": "NE", "CE": "NE", "MA": "NE", "PB": "NE", "PE": "NE", "PI": "NE", "RN": "NE", "SE": "NE",
          "DF": "CO", "GO": "CO", "MS": "CO", "MT": "CO",
          "ES": "SE", "MG": "SE", "RJ": "SE", "SP": "SE",
          "PR": "S", "RS": "S", "SC": "S", "ZZ": "EX", "VT": "EX"}
REGIAO_NOME = {"N": "Norte", "NE": "Nordeste", "CO": "Centro-Oeste", "SE": "Sudeste", "S": "Sul", "EX": "Exterior"}
# ano: (nº do PT, candidato do PT, nº do adversário no 2º turno, adversário). Nos campos, "dir" = adversário.
FINAIS = {2002: (13, "Lula", 45, "Serra"), 2006: (13, "Lula", 45, "Alckmin"), 2010: (13, "Dilma", 45, "Serra"),
          2014: (13, "Dilma", 45, "Aécio"), 2018: (13, "Haddad", 17, "Bolsonaro"),
          2022: (13, "Lula", 22, "Bolsonaro"), 2026: (13, "Lula", 22, "Flávio")}
ANOS = sorted(FINAIS)
CENARIOS_X = [40, 50, 60, 70, 80]
CAMPOS = ("aptos", "comp", "abst", "validos", "brancos", "pt", "dir")
PORTES = [(10_000, "1 · até 10 mil"), (50_000, "2 · 10 a 50 mil"), (200_000, "3 · 50 a 200 mil"),
          (1_000_000, "4 · 200 mil a 1 milhão"), (float("inf"), "5 · mais de 1 milhão")]
TOP_N = 100
MIN_APTOS_PCT = 10_000  # ranking por % só entre cidades com 10 mil+ eleitores (base pequena distorce %)


# ---------- leitura ----------

def read_brasil_csv(zip_path):
    with zipfile.ZipFile(zip_path) as z:
        name = next(n for n in z.namelist() if n.endswith("_BRASIL.csv"))
        with z.open(name) as f:
            yield from csv.DictReader(io.TextIOWrapper(f, encoding="latin1"), delimiter=";")


def votos_partido(r):
    """Votos válidos de um partido numa linha de votacao_partido_munzona (esquema novo ou antigo)."""
    if "QT_VOTOS_NOMINAIS_VALIDOS" in r:
        return int(r["QT_VOTOS_NOMINAIS_VALIDOS"]) + int(r.get("QT_TOTAL_VOTOS_LEG_VALIDOS") or 0)
    return int(r["QT_VOTOS_NOMINAIS"]) + int(r.get("QT_VOTOS_LEGENDA") or 0)


def load_open_data(od_dir, ano):
    """({(turno, uf, cod_mun): contagens}, {cod_mun: nome}) para presidente."""
    pt_nr, _, dir_nr, _ = FINAIS[ano]
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
            agg[k]["pt" if nr == pt_nr else "dir"] += votos_partido(r)
    return agg, nomes


def parse_api(path):
    pt_nr, _, dir_nr, _ = FINAIS[2026]
    d = json.load(open(path, encoding="utf-8"))
    votos = {int(c["n"]): int(c["vap"]) for a in d["carg"][0]["agr"] for p in a["par"] for c in p["cand"]}
    return {"aptos": int(d["e"]["te"]), "comp": int(d["e"]["c"]), "abst": int(d["e"]["a"]),
            "validos": int(d["v"]["vv"]), "brancos": int(d["v"]["vb"]),
            "pt": votos.get(pt_nr, 0), "dir": votos.get(dir_nr, 0)}


def load_api_2026(api_dir, mun_dir):
    """Municípios da API de 2026; confere a soma por UF contra o arquivo estadual."""
    cm = json.load(open(Path(mun_dir) / "cm.json", encoding="utf-8"))
    agg, nomes = {}, {}
    for a in cm["abr"]:
        uf = a["cd"].upper()
        for m in a["mu"]:
            nomes[m["cd"]] = m["nm"]
            for turno, cd in ((1, 6257), (2, 6258)):
                agg[(turno, uf, m["cd"])] = parse_api(Path(mun_dir) / "files" / f"{a['cd']}{m['cd']}-{cd}.json")
    for turno, cd in ((1, 6257), (2, 6258)):
        for uf in [u for u in UFS if u != "VT"]:
            oficial = parse_api(Path(api_dir) / f"{uf.lower()}-{cd}.json")
            soma = {c: sum(v[c] for k, v in agg.items() if k[0] == turno and k[1] == uf) for c in CAMPOS}
            assert soma == oficial, (uf, turno, soma, oficial)
    return agg, nomes


def lideres_1t(od_dir, ano):
    """{cod_mun: (nº, sigla, fatia dos válidos)} do mais votado no 1º turno entre todos os candidatos."""
    votos = defaultdict(lambda: defaultdict(int))
    sigla = {}
    for r in read_brasil_csv(Path(od_dir) / f"votacao_partido_munzona_{ano}.zip"):
        if r["CD_CARGO"] == "1" and r["NR_TURNO"] == "1":
            nr = int(r["NR_PARTIDO"])
            sigla[nr] = r["SG_PARTIDO"]
            votos[r["CD_MUNICIPIO"].zfill(5)][nr] += votos_partido(r)
    out = {}
    for cod, vs in votos.items():
        nr, v = max(vs.items(), key=lambda kv: kv[1])
        tot = sum(vs.values())
        out[cod] = (nr, sigla[nr], v / tot if tot else None)
    return out


def nome_mun(nome):
    minus = {"de", "da", "do", "das", "dos", "e", "d'"}
    partes = nome.title().split(" ")
    return " ".join(w.lower() if i and w.lower() in minus else w for i, w in enumerate(partes))


# ---------- métricas ----------

def somar(itens):
    tot = defaultdict(int)
    for it in itens:
        for c in CAMPOS:
            tot[c] += it[c]
    return tot


def div(a, b):
    return a / b if b else None


def metricas(t1, t2):
    v1, v2 = t1["validos"], t2["validos"]
    nu1 = t1["comp"] - v1 - t1["brancos"]   # nulos inclui nulos técnicos e anulados
    nu2 = t2["comp"] - v2 - t2["brancos"]
    bn1, bn2 = t1["brancos"] + nu1, t2["brancos"] + nu2
    terceira = v1 - t1["pt"] - t1["dir"]
    delta = (t1["abst"] + bn1) - (t2["abst"] + bn2)
    g_pt, g_dir = t2["pt"] - t1["pt"], t2["dir"] - t1["dir"]
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
        "abst_1t": t1["abst"], "abst_2t": t2["abst"], "brancos_1t": t1["brancos"], "brancos_2t": t2["brancos"],
        "nulos_1t": nu1, "nulos_2t": nu2, "bn_1t": bn1, "bn_2t": bn2,
        "pct_abst_1t": div(t1["abst"], t1["aptos"]), "pct_abst_2t": div(t2["abst"], t2["aptos"]),
        "pct_bn_1t": div(bn1, t1["comp"]), "pct_bn_2t": div(bn2, t2["comp"]),
        "pct_brancos_1t": div(t1["brancos"], t1["comp"]), "pct_brancos_2t": div(t2["brancos"], t2["comp"]),
        "pct_nulos_1t": div(nu1, t1["comp"]), "pct_nulos_2t": div(nu2, t2["comp"]),
        # quedas entre turnos (positivo = menos abstenção, brancos ou nulos no 2º turno)
        "delta_abst": t1["abst"] - t2["abst"], "delta_brancos": t1["brancos"] - t2["brancos"],
        "delta_nulos": nu1 - nu2, "delta_bn": bn1 - bn2, "delta": delta,
        "delta_pct": div(delta, t1["aptos"]),
        "pool": terceira + delta,
        "captura_pt": div(g_pt, g_pt + g_dir),
        "x_min": div(g_pt - max(delta, 0), terceira),
        "x_impl_50": div(g_pt - 0.5 * delta, terceira),
        # referência: o resto do disponível dividido 50/50 (o meio a meio se anula; só a vantagem do 1º turno conta)
        "x_req50_pt": 0.5 + (t1["dir"] - t1["pt"]) / (2 * terceira) if terceira > 0 else None,
        "x_levou50_pt": 0.5 + (g_pt - g_dir) / (2 * terceira) if terceira > 0 else None,
        "estoque_2t": t2["abst"] + bn2,
        "gap_vitoria": v2 / 2 - t1["pt"],
        "venceu_pt": int(t2["pt"] > t2["dir"]),
        "margem_2t": div(t2["pt"], v2) - div(t2["dir"], v2) if v2 else None,
        "margem_1t": div(t1["pt"], v1) - div(t1["dir"], v1) if v1 else None,
        # crescimento líquido: o que o PT ganhou menos o que o adversário ganhou entre os turnos
        "net_votos": g_pt - g_dir,
        "net_pct_aptos": div(g_pt - g_dir, t1["aptos"]),
        "swing_margem": (div(t2["pt"], v2) - div(t2["dir"], v2)) - (div(t1["pt"], v1) - div(t1["dir"], v1)) if v1 and v2 else None,
        "pct_comp_1t": div(t1["comp"], t1["aptos"]), "pct_comp_2t": div(t2["comp"], t2["aptos"]),
        "d_comp_pp": div(t2["comp"], t2["aptos"]) - div(t1["comp"], t1["aptos"]) if t1["aptos"] and t2["aptos"] else None,
        **req_local(t1, t2, *rec_local(t1, t2)),
    }


# conversão da 3ª via que cada lado precisou (x para o PT, 1 − x para o adversário): até 60% plausível; 60–90%
# improvável; 90–100% alerta; acima de 100% alerta (impossível pela regra)
CONV_PLAUS = 0.6
CONV_ALERTA = 0.9
CONV_MIN_T = 100     # cidades com bolo a converter menor que isso ficam sem avaliação de conversão (base pequena)


def sinais(m, minimo=0):
    """Sinais de auditoria de uma unidade, a partir das métricas já calculadas.
    Conversão: fatia do bolo a converter (3ª via + parte da 3ª via nos recuperados) que cada finalista precisou para o
    resultado que teve, com abstenção, brancos e nulos recuperados divididos pela distribuição do 1º turno (PT,
    adversário, 3ª via). Por lado: até 60% plausível, 60–90% improvável, 90–100% alerta, acima de 100% alerta de
    possível fraude (salvo troca de lado, recuperados muito além da distribuição do 1º turno ou outros votos).
    Perdas: quem perdeu votos entre os turnos. Saída = alta de abstenção + brancos + nulos (quem deixou de votar
    validamente). A perda só se explica sem troca de lado se a saída cobre a perda e o oponente não ganhou mais que a
    3ª via mais os recuperados; senão, a diferença é o mínimo de eleitores que trocaram de lado."""
    T = m["terceira_via"]
    B = m["bolo_conv"]
    x = m["x_levou_pt"]
    out = {"flag_conv": "", "exc_pt": 0, "exc_dir": 0, "conv2_pt": None}
    if x is not None and B >= minimo:
        out["flag_conv"] = ("pt_acima" if x > 1 else "pt_alerta" if x > CONV_ALERTA else "pt_improv" if x > CONV_PLAUS
                            else "dir_acima" if x < 0 else "dir_alerta" if x < 1 - CONV_ALERTA
                            else "dir_improv" if x < 1 - CONV_PLAUS else "ok")
        out["exc_pt"], out["exc_dir"] = round(max(0, x - 1) * B), round(max(0, -x) * B)
        tot2 = m["pt_2t"] + m["dir_2t"]
        if tot2 and T:  # sensibilidade: recuperados na proporção do 2º turno, sobre a 3ª via
            extra = tot2 - (m["pt_1t"] + m["dir_1t"]) - T
            out["conv2_pt"] = (m["ganho_pt"] - m["pt_2t"] / tot2 * extra) / T
    saida = -m["delta"]
    rec = max(m["delta"], 0)
    for c, o in (("pt", "dir"), ("dir", "pt")):
        perda = max(0, -m[f"ganho_{c}"])
        acima = m[f"ganho_{o}"] - T - rec  # o oponente ganhou mais que 3ª via + recuperados
        out[f"troca_min_{c}"] = max(perda - max(saida, 0), acima, 0)  # mínimo de eleitores de c que foram para o oponente
        if not perda:
            out[f"flag_perda_{c}"] = ""
        elif saida <= 0:
            out[f"flag_perda_{c}"] = "saida_caiu"
        elif saida < perda:
            out[f"flag_perda_{c}"] = "perda_maior"
        elif acima > 0:
            out[f"flag_perda_{c}"] = "oponente_acima"
        else:
            out[f"flag_perda_{c}"] = "explicavel"
    return out


def rec_local(t1, t2):
    """Votos que os finalistas somaram além da 3ª via (abstenção, brancos e nulos recuperados), divididos pela
    distribuição do 1º turno na própria cidade: PT, adversário e 3ª via. A parte da 3ª via entra no bolo a converter."""
    terceira = t1["validos"] - t1["pt"] - t1["dir"]
    extra = (t2["pt"] + t2["dir"]) - (t1["pt"] + t1["dir"]) - terceira
    if not t1["validos"]:
        return extra / 2, extra / 2, 0.0
    return t1["pt"] / t1["validos"] * extra, t1["dir"] / t1["validos"] * extra, terceira / t1["validos"] * extra


def req_local(t1, t2, rec_pt, rec_dir, rec_ter):
    """Com os recuperados divididos pela distribuição local do 1º turno, a fatia do bolo a converter (3ª via + parte da
    3ª via nos recuperados) que o PT precisava para empatar e a que levou. Para estados, regiões e Brasil, rec_* são
    somas cidade a cidade."""
    bolo = t1["validos"] - t1["pt"] - t1["dir"] + rec_ter
    base = {"rec_pt": rec_pt, "rec_dir": rec_dir, "rec_ter": rec_ter, "bolo_conv": bolo}
    if bolo <= 0:
        return {**base, "x_req_pt": None, "x_levou_pt": None, "status_req_pt": ""}
    x = 0.5 + (t1["dir"] - t1["pt"] + rec_dir - rec_pt) / (2 * bolo)
    return {**base, "x_req_pt": x, "x_levou_pt": (t2["pt"] - t1["pt"] - rec_pt) / bolo, "status_req_pt": status_req(x)}


def status_req(x):
    """dispensa: vence sem nenhum voto da 3ª via; inviavel: nem com toda a 3ª via, se o resto se divide 50/50."""
    return "dispensa" if x <= 0 else "inviavel" if x > 1 else "viavel"


def cenario(m, cand, x):
    """Se o candidato levou X% da 3ª via, quanto ainda faltava para 50% dos válidos do 2º turno e que fatia
    disso teria de vir do saldo recuperado (Δ) e do restante disponível (pool − X% da 3ª via)."""
    need = m["validos_2t"] / 2 - m[f"{cand}_1t"] - x / 100 * m["terceira_via"]
    d = m["delta"]
    resto = m["pool"] - x / 100 * m["terceira_via"]
    if need <= 0:
        status = "dispensa"
    elif resto <= 0 or need > resto:
        status = "inviavel"
    else:
        status = "viavel"
    return {"need": round(need), "status": status,
            "y_saldo": need / d if d > 0 else None,
            "y_resto": need / resto if resto > 0 else None,
            "y_estoque": need / m["estoque_2t"] if m["estoque_2t"] else None,
            "y_impl": (m[f"ganho_{cand}"] - x / 100 * m["terceira_via"]) / d if d else None}


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
    r2 = 1 - (W * e ** 2).sum() / (W * (y - (W * y).sum()) ** 2).sum()
    return {"n": n, "c_hat": beta[0], "x_hat": beta[1], "x_se": se[1], "y_hat": beta[2], "y_se": se[2], "r2": r2}


def lider(pt, dr):
    return "PT" if pt > dr else "DIR" if dr > pt else "EMP"


def porte(aptos):
    """Porte da cidade pelo eleitorado (aptos), não pela população."""
    return next(nome for lim, nome in PORTES if aptos < lim)


# ---------- saída ----------

def r5(v):
    return round(v, 5) if isinstance(v, float) else v


def write_csv(path, rows, campos=None):
    campos = campos or list(dict.fromkeys(k for r in rows for k in r))
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
        w.writeheader()
        w.writerows({k: r5(r.get(k)) for k in campos} for r in rows)


def por_porte(mun_rows):
    out = []
    for ano in ANOS:
        base = [r for r in mun_rows if r["ano"] == ano and r["uf"] not in ("ZZ", "VT")]
        for esc in ["BR", "N", "NE", "CO", "SE", "S"]:
            sub_esc = [r for r in base if esc == "BR" or r["regiao"] == esc]
            tot_pt = sum(r["ganho_pt"] for r in sub_esc)
            tot_dir = sum(r["ganho_dir"] for r in sub_esc)
            tot_apt = sum(r["aptos"] for r in sub_esc)
            for _, nome in PORTES:
                sub = [r for r in sub_esc if r["porte"] == nome]
                if not sub:
                    continue
                t = {c: sum(r[c] for r in sub) for c in ("aptos", "pt_1t", "pt_2t", "dir_1t", "dir_2t", "validos_1t",
                                                          "validos_2t", "terceira_via", "delta", "ganho_pt", "ganho_dir")}
                out.append({
                    "id": f"{ano}-{esc}-{nome[0]}", "ano": ano, "escopo": esc, "porte": nome, "cidades": len(sub),
                    "eleitores": t["aptos"], "pct_eleitores": t["aptos"] / tot_apt,
                    "pct_pt_1t": t["pt_1t"] / t["validos_1t"], "pct_pt_2t": t["pt_2t"] / t["validos_2t"],
                    "pp_pt": t["pt_2t"] / t["validos_2t"] - t["pt_1t"] / t["validos_1t"],
                    "cresc_pt": div(t["ganho_pt"], t["pt_1t"]),
                    "pct_dir_1t": t["dir_1t"] / t["validos_1t"], "pct_dir_2t": t["dir_2t"] / t["validos_2t"],
                    "pp_dir": t["dir_2t"] / t["validos_2t"] - t["dir_1t"] / t["validos_1t"],
                    "cresc_dir": div(t["ganho_dir"], t["dir_1t"]),
                    "ganho_pt": t["ganho_pt"], "ganho_dir": t["ganho_dir"],
                    "pct_ganho_pt": div(t["ganho_pt"], tot_pt), "pct_ganho_dir": div(t["ganho_dir"], tot_dir),
                    "captura_pt": div(t["ganho_pt"], t["ganho_pt"] + t["ganho_dir"]),
                    "pct_terceira": t["terceira_via"] / t["validos_1t"], "delta_pct": t["delta"] / t["aptos"],
                    **req_local({"validos": t["validos_1t"], "pt": t["pt_1t"], "dir": t["dir_1t"]}, {"pt": t["pt_2t"], "dir": t["dir_2t"]},
                                sum(r["rec_pt"] for r in sub), sum(r["rec_dir"] for r in sub), sum(r["rec_ter"] for r in sub)),
                    "venc_pt": sum(r["venc_2t"] == "PT" for r in sub), "venc_dir": sum(r["venc_2t"] == "DIR" for r in sub),
                    "viradas_pt": sum(r["virou"] and r["venc_2t"] == "PT" for r in sub),
                    "viradas_dir": sum(r["virou"] and r["venc_2t"] == "DIR" for r in sub),
                    "perdeu_pt": sum(r["ganho_pt"] < 0 for r in sub), "perdeu_dir": sum(r["ganho_dir"] < 0 for r in sub),
                })
    return out


def viradas_e_top(mun_rows, capitais):
    venc = defaultdict(dict)
    for r in mun_rows:
        venc[r["ano"]][r["cod"]] = r["venc_2t"]
    for r in mun_rows:
        i = ANOS.index(r["ano"])
        ant = venc[ANOS[i - 1]].get(r["cod"]) if i else None
        r["venc_2t_ant"] = ant or ""
        r["mudou_vs_ant"] = "" if not ant else int(ant != r["venc_2t"])

    vir = []
    for ano in ANOS:
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
                "perdeu_pt": sum(r["ganho_pt"] < 0 for r in sub),
                "perdeu_dir": sum(r["ganho_dir"] < 0 for r in sub),
                "perdeu_so_pt": sum(r["ganho_pt"] < 0 <= r["ganho_dir"] for r in sub),
                "perdeu_so_dir": sum(r["ganho_dir"] < 0 <= r["ganho_pt"] for r in sub),
                "perdeu_ambos": sum(r["ganho_pt"] < 0 and r["ganho_dir"] < 0 for r in sub),
                "votos_perdidos_pt": -sum(r["ganho_pt"] for r in sub if r["ganho_pt"] < 0),
                "votos_perdidos_dir": -sum(r["ganho_dir"] for r in sub if r["ganho_dir"] < 0),
                # perdas que a queda de comparecimento não explica: o candidato perdeu votos onde o saldo foi positivo
                "perda_dir_saldo_pos": sum(r["ganho_dir"] < 0 < r["delta"] for r in sub),
                "perda_pt_saldo_pos": sum(r["ganho_pt"] < 0 < r["delta"] for r in sub),
                # ganhos que só fecham com eleitor trocando de lado: maiores que 3ª via + saldo positivo
                "pt_acima_pool": sum(r["ganho_pt"] > r["terceira_via"] + max(r["delta"], 0) for r in sub),
                "dir_acima_pool": sum(r["ganho_dir"] > r["terceira_via"] + max(r["delta"], 0) for r in sub),
            })

    top, res = [], []
    tops = {}
    for ano in ANOS:
        base = [r for r in mun_rows if r["ano"] == ano and r["uf"] not in ("ZZ", "VT")]
        for cand in ("pt", "dir"):
            sinal = 1 if cand == "pt" else -1
            for crit in ("abs", "pct", "perda", "net"):
                if crit == "abs":
                    sel = sorted(base, key=lambda r: r[f"ganho_{cand}"], reverse=True)[:TOP_N]
                elif crit == "net":  # maior crescimento líquido a favor do candidato
                    sel = sorted(base, key=lambda r: sinal * r["net_votos"], reverse=True)[:TOP_N]
                elif crit == "pct":
                    pool = [r for r in base if r["aptos"] >= MIN_APTOS_PCT and r[f"{cand}_1t"]]
                    sel = sorted(pool, key=lambda r: r[f"cresc_{cand}"], reverse=True)[:TOP_N]
                else:
                    sel = sorted((r for r in base if r[f"ganho_{cand}"] < 0), key=lambda r: r[f"ganho_{cand}"])[:TOP_N]
                tops[(ano, cand, crit)] = {r["cod"] for r in sel}
                for i, r in enumerate(sel, 1):
                    top.append({"id": f"{ano}-{cand}-{crit}-{i}", "ano": ano, "cand": cand, "crit": crit,
                                "rank": i, "cod": r["cod"], "municipio": r["municipio"], "uf": r["uf"],
                                "regiao": r["regiao"], "capital": int(r["cod"] in capitais), "aptos": r["aptos"],
                                "votos_1t": r[f"{cand}_1t"], "votos_2t": r[f"{cand}_2t"],
                                "ganho": sinal * r["net_votos"] if crit == "net" else r[f"ganho_{cand}"],
                                "cresc": r[f"cresc_{cand}"],
                                "pp": sinal * r["swing_margem"] if crit == "net" else r[f"pp_{cand}"],
                                "virou": r["virou"], "venc_2t": r["venc_2t"]})
                val = (lambda r: sinal * r["net_votos"]) if crit == "net" else (lambda r: r[f"ganho_{cand}"])
                ganho_total = sum(val(r) for r in base)
                i = ANOS.index(ano)
                prev = tops.get((ANOS[i - 1], cand, crit)) if i else None
                res.append({"id": f"{ano}-{cand}-{crit}", "ano": ano, "cand": cand, "crit": crit, "cidades": len(sel),
                            "ganho_top": sum(val(r) for r in sel),
                            "pct_ganho_total": (sum(val(r) for r in sel) / ganho_total
                                                if ganho_total > 0 and crit != "perda" else None),
                            "ganho_total": ganho_total,
                            "mediana_cresc": float(np.median([r[f"cresc_{cand}"] for r in sel])) if sel else None,
                            "capitais": sum(r["cod"] in capitais for r in sel),
                            **{f"reg_{g}": sum(r["regiao"] == g for r in sel) for g in ["N", "NE", "CO", "SE", "S"]},
                            "repetidas_ant": len(tops[(ano, cand, crit)] & prev) if prev else None})
    return vir, top, res


MAPA = ["id", "cod", "ano", "municipio", "uf", "regiao", "aptos", "porte", "pct_pt_1t", "pct_pt_2t", "pct_dir_1t",
        "pct_dir_2t", "pp_pt", "pp_dir", "cresc_pt", "cresc_dir", "ganho_pt", "ganho_dir", "pct_terceira", "delta_pct",
        "captura_pt", "margem_2t", "lider_1t", "lider1_nr", "lider1_sigla", "lider1_pct", "venc_2t", "virou",
        "mudou_vs_ant", "perda", "y_resto_pt_50", "status_pt_50", "net_votos", "net_pct_aptos", "swing_margem", "d_comp_pp",
        "x_req_pt", "x_levou_pt", "status_req_pt", "x_req50_pt", "x_levou50_pt", "flag_conv", "exc_pt", "exc_dir",
        "flag_perda_pt", "flag_perda_dir", "troca_min_pt", "troca_min_dir", "terceira_via", "delta", "rec_pt", "rec_dir",
        "rec_ter", "bolo_conv"]
HIST = ["id", "cod", "ano", "municipio", "uf", "regiao", "aptos", "porte",
        "pt_1t", "pt_2t", "dir_1t", "dir_2t", "validos_1t", "validos_2t", "pct_pt_1t", "pct_pt_2t", "pct_dir_1t",
        "pct_dir_2t", "pp_pt", "pp_dir", "ganho_pt", "ganho_dir", "cresc_pt", "cresc_dir",
        "terceira_via", "pct_terceira", "abst_1t", "abst_2t", "brancos_1t", "brancos_2t", "nulos_1t", "nulos_2t",
        "pct_abst_1t", "pct_abst_2t", "pct_brancos_1t", "pct_brancos_2t", "pct_nulos_1t", "pct_nulos_2t",
        "delta_abst", "delta_brancos", "delta_nulos", "delta", "pool", "captura_pt", "lider1_sigla", "lider1_pct",
        "net_votos", "net_pct_aptos", "margem_1t", "margem_2t", "swing_margem", "pct_comp_1t", "pct_comp_2t", "d_comp_pp",
        "lider_1t", "venc_2t", "virou", "mudou_vs_ant", "x_req_pt", "x_levou_pt", "status_req_pt", "x_req50_pt", "x_levou50_pt",
        "rec_pt", "rec_dir", "rec_ter", "bolo_conv", "flag_conv", "exc_pt", "exc_dir", "conv2_pt", "flag_perda_pt", "flag_perda_dir",
        "troca_min_pt", "troca_min_dir"] + \
       [f"{k}_{c}_{x}" for c in ("pt", "dir") for x in CENARIOS_X for k in ("need", "status", "y_saldo", "y_resto")]


QUEDAS = {"abst": ("abst", "aptos"), "nulos": ("nulos", "comp"), "brancos": ("brancos", "comp")}


def quedas(mun_rows, capitais):
    """Top 100 cidades com maior queda de abstenção, nulos e brancos do 1º para o 2º turno, em % (queda relativa,
    só cidades com 10 mil+ eleitores) e em número de votos, e o que aconteceu no 2º turno nessas cidades."""
    top, res, tops = [], [], {}
    for ano in ANOS:
        base = [r for r in mun_rows if r["ano"] == ano and r["uf"] not in ("ZZ", "VT")]
        for tipo, (campo, den) in QUEDAS.items():
            def taxa(r, t, campo=campo, den=den):
                d = r["aptos"] if den == "aptos" else r["validos_" + t] + r["brancos_" + t] + r["nulos_" + t]
                return div(r[f"{campo}_{t}"], d)
            for r in base:
                r["_q"] = r[f"{campo}_1t"] - r[f"{campo}_2t"]
                r["_qp"] = div(r["_q"], r[f"{campo}_1t"])
            for crit in ("pct", "abs"):
                if crit == "abs":
                    sel = sorted((r for r in base if r["_q"] > 0), key=lambda r: r["_q"], reverse=True)[:TOP_N]
                else:
                    pool = [r for r in base if r["aptos"] >= MIN_APTOS_PCT and r[f"{campo}_1t"] > 0 and r["_q"] > 0]
                    sel = sorted(pool, key=lambda r: r["_qp"], reverse=True)[:TOP_N]
                for i, r in enumerate(sel, 1):
                    t1, t2 = taxa(r, "1t"), taxa(r, "2t")
                    top.append({"id": f"{ano}-{tipo}-{crit}-{i}", "ano": ano, "tipo": tipo, "crit": crit, "rank": i,
                                "cod": r["cod"], "municipio": r["municipio"], "uf": r["uf"], "regiao": r["regiao"],
                                "capital": int(r["cod"] in capitais), "aptos": r["aptos"],
                                "v_1t": r[f"{campo}_1t"], "v_2t": r[f"{campo}_2t"], "queda": r["_q"],
                                "queda_pct": r["_qp"], "taxa_1t": t1, "taxa_2t": t2,
                                "queda_pp": t1 - t2 if t1 is not None and t2 is not None else None,
                                "venc_2t": r["venc_2t"], "virou": r["virou"], "net_votos": r["net_votos"],
                                "swing_margem": r["swing_margem"]})
                cods = {r["cod"] for r in sel}
                resto = [r for r in base if r["cod"] not in cods]
                total = sum(r["_q"] for r in base)
                i = ANOS.index(ano)
                prev = tops.get((ANOS[i - 1], tipo, crit)) if i else None
                tops[(ano, tipo, crit)] = cods
                swing = lambda rs: (sum(r["swing_margem"] * r["aptos"] for r in rs) / sum(r["aptos"] for r in rs)
                                    if rs else None)
                res.append({"id": f"{ano}-{tipo}-{crit}", "ano": ano, "tipo": tipo, "crit": crit, "cidades": len(sel),
                            "queda_top": sum(r["_q"] for r in sel), "queda_total": total,
                            "pct_queda_total": div(sum(r["_q"] for r in sel), total) if total > 0 else None,
                            "mediana_queda_pct": float(np.median([r["_qp"] for r in sel])) if sel else None,
                            "capitais": sum(r["cod"] in capitais for r in sel),
                            **{f"reg_{g}": sum(r["regiao"] == g for r in sel) for g in ("N", "NE", "CO", "SE", "S")},
                            "venc_pt": sum(r["venc_2t"] == "PT" for r in sel),
                            "net_votos_top": sum(r["net_votos"] for r in sel),
                            "swing_top": swing(sel), "swing_resto": swing(resto),
                            "repetidas_ant": len(cods & prev) if prev is not None else None})
    for r in mun_rows:
        r.pop("_q", None)
        r.pop("_qp", None)
    return top, res


PERDA_ROT = {"saida_caiu": "perdeu votos com abstenção, brancos e nulos caindo",
             "perda_maior": "perdeu mais do que subiram abstenção, brancos e nulos",
             "oponente_acima": "perda cabe na abstenção, mas o oponente ganhou mais que 3ª via + recuperados",
             "explicavel": "perda explicável por quem deixou de votar"}


def conversao(mun_rows, uf_rows):
    """Série por eleição e região dos sinais de conversão e de perda (a lista cidade a cidade está em mapa_<ano>)."""
    ufi = {r["id"]: r for r in uf_rows}
    serie = []
    for ano in ANOS:
        base_ano = [r for r in mun_rows if r["ano"] == ano and r["uf"] not in ("ZZ", "VT")]
        for esc in ["BR", "N", "NE", "CO", "SE", "S"]:
            b = [r for r in base_ano if esc == "BR" or r["regiao"] == esc]
            apt = sum(r["aptos"] for r in b)
            av = [r for r in b if r["flag_conv"]]
            u = ufi.get(f"{ano}-{esc}", {})
            s = {"id": f"{ano}-{esc}", "ano": ano, "escopo": esc, "cidades": len(b), "cidades_avaliadas": len(av),
                 "conv_pt": u.get("x_levou_pt"), "flag_conv": u.get("flag_conv", "")}
            for f in ("pt_acima", "pt_alerta", "pt_improv", "ok", "dir_improv", "dir_alerta", "dir_acima"):
                sel = [r for r in av if r["flag_conv"] == f]
                s[f"n_{f}"] = len(sel)
                s[f"eleit_{f}"] = div(sum(r["aptos"] for r in sel), apt)
            s["exc_pt"] = sum(r["exc_pt"] for r in b)
            s["exc_dir"] = sum(r["exc_dir"] for r in b)
            s["n_pt_acima_2t"] = sum(1 for r in av if r["conv2_pt"] is not None and r["conv2_pt"] > 1)
            s["n_dir_acima_2t"] = sum(1 for r in av if r["conv2_pt"] is not None and r["conv2_pt"] < 0)
            for c in ("pt", "dir"):
                s[f"perdeu_{c}"] = sum(r[f"ganho_{c}"] < 0 for r in b)
                s[f"votos_perdidos_{c}"] = -sum(r[f"ganho_{c}"] for r in b if r[f"ganho_{c}"] < 0)
                for f in PERDA_ROT:
                    s[f"{c}_{f}"] = sum(r[f"flag_perda_{c}"] == f for r in b)
                s[f"troca_min_{c}"] = sum(r[f"troca_min_{c}"] for r in b)
                s[f"cid_troca_{c}"] = sum(r[f"troca_min_{c}"] > 0 for r in b)
            serie.append(s)
    return serie


def main(od_dir, api_dir, mun_dir, out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    uf_rows, cen_rows, mun_rows, reg_rows = [], [], [], []
    for ano in ANOS:
        agg, nomes = load_api_2026(api_dir, mun_dir) if ano == 2026 else load_open_data(od_dir, ano)
        lid = lideres_1t(od_dir, ano)
        cidades = []
        for uf, cod in sorted({(k[1], k[2]) for k in agg}):
            t1, t2 = agg.get((1, uf, cod)), agg.get((2, uf, cod))
            if not t1 or not t2 or not t1["aptos"] or not t1["validos"] or not t2["validos"]:
                continue
            m = metricas(t1, t2)
            m.update(sinais(m, CONV_MIN_T))
            ln, ls, lp = lid.get(cod, (None, "", None))
            c = {"id": f"{ano}-{cod}", "ano": ano, "cod": cod, "municipio": nome_mun(nomes[cod]), "uf": uf,
                 "regiao": REGIAO[uf], **m, "porte": porte(m["aptos"]),
                 "lider_1t": lider(m["pt_1t"], m["dir_1t"]), "venc_2t": lider(m["pt_2t"], m["dir_2t"]),
                 "lider1_nr": ln, "lider1_sigla": ls, "lider1_pct": lp,
                 "perda": "ambos" if m["ganho_pt"] < 0 and m["ganho_dir"] < 0 else "pt" if m["ganho_pt"] < 0
                 else "dir" if m["ganho_dir"] < 0 else ""}
            c["virou"] = int(c["lider_1t"] != c["venc_2t"])
            for cand in ("pt", "dir"):
                for x in CENARIOS_X:
                    for k, v in cenario(m, cand, x).items():
                        c[f"{k}_{cand}_{x}"] = v
            cidades.append(c)
        rec = {(uf, cod): rec_local(agg[(1, uf, cod)], agg[(2, uf, cod)]) for uf, cod in {(k[1], k[2]) for k in agg}
               if (1, uf, cod) in agg and (2, uf, cod) in agg}
        grupos = [("UF", uf, UF_NOME[uf], REGIAO[uf], lambda k, uf=uf: k[1] == uf) for uf in UFS]
        grupos += [("REGIAO", r, REGIAO_NOME[r], r, lambda k, r=r: REGIAO[k[1]] == r) for r in REGIAO_NOME if r != "EX"]
        grupos += [("BR", "BR", "Brasil", "BR", lambda k: True)]
        for nivel, cod, nome, reg, sel in grupos:
            t1 = somar(v for k, v in agg.items() if k[0] == 1 and sel(k))
            t2 = somar(v for k, v in agg.items() if k[0] == 2 and sel(k))
            if not t1["validos"] or not t2["validos"]:
                continue
            m = metricas(t1, t2)
            m.update(req_local(t1, t2, *(sum(rec[k][i] for k in rec if sel((1,) + k)) for i in range(3))))
            m.update(sinais(m))
            uf_rows.append({"id": f"{ano}-{cod}", "ano": ano, "nivel": nivel, "uf": cod, "nome": nome, "regiao": reg, **m})
            for cand in ("pt", "dir"):
                for x in CENARIOS_X:
                    cen_rows.append({"id": f"{ano}-{cod}-{cand}-{x}", "ano": ano, "nivel": nivel, "uf": cod, "nome": nome,
                                     "regiao": reg, "cand": cand, "x": x, **cenario(m, cand, x)})
        for escopo in ["BR", "N", "NE", "CO", "SE", "S"]:
            sub = [c for c in cidades if c["uf"] not in ("ZZ", "VT") and (escopo == "BR" or c["regiao"] == escopo)]
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
    write_csv(out / "conversao_serie.csv", conversao(mun_rows, uf_rows))
    q_rows, q_res = quedas(mun_rows, capitais)
    write_csv(out / "quedas.csv", q_rows)
    write_csv(out / "quedas_resumo.csv", q_res)
    write_csv(out / "porte.csv", por_porte(mun_rows))
    for ano in ANOS:
        write_csv(out / f"mapa_{ano}.csv", [r for r in mun_rows if r["ano"] == ano and r["uf"] not in ("ZZ", "VT")], MAPA)
    for uf in UFS:
        if uf not in ("ZZ", "VT"):
            write_csv(out / f"hist_{uf}.csv", sorted((r for r in mun_rows if r["uf"] == uf),
                                                     key=lambda r: (r["cod"], -r["ano"])), HIST)
    print("ok ->", out)


if __name__ == "__main__":
    main(*sys.argv[1:5])
