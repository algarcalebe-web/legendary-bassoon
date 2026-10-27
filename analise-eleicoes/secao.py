"""Seções eleitorais, 1º × 2º turno, 2018, 2022 e 2026 (≈ 500 mil seções por turno). Só dados do TSE.

A seção tem o mesmo cadastro nos dois turnos, então a variação dentro dela não mistura eleitorados diferentes,
como acontece no município. Testes:
1. Contabilidade: aptos = comparecimento + abstenção; comparecimento = nominais + brancos + nulos + anulados;
   o arquivo de votos por candidato bate com o de detalhe, e a soma das seções bate com o total do município.
2. Comparecimento: distribuição da variação por seção e quanto da alta veio das 10% seções que mais subiram.
3. Crescimento líquido (ganho do PT − ganho do adversário): fração de seções a favor de quem ganhou o líquido,
   concentração (quanto do líquido nacional veio do 1% e dos 10% de seções com maior líquido), seções que destoam
   da própria zona (z robusto > 5) e a inclinação do líquido sobre a variação do comparecimento dentro da zona.
4. Transições (Goodman por UF, seções ponderadas pelo eleitorado): para onde foram, no 2º turno, os votos do PT,
   do adversário, da 3ª via, de brancos+nulos e da abstenção do 1º. Versão restrita (taxas entre 0 e 1) e mínimos
   quadrados livres (soma exata do líquido); e uma regressão dentro da zona como terceira leitura.
5. Forense: último dígito e segundo dígito (Benford) dos votos por seção; seções quase unânimes; brancos+nulos zerados.
6. Chegada do boletim ao TSE: distribuição por faixa de 10 minutos, pausas, e o líquido por decil de chegada
   (dentro da UF); modelo da urna (dentro do município).

Uso (numpy, scipy): python -I secao.py <od_dir> <api_dir> <mun_dir> <secao_dir> <out_dir>
<secao_dir>/<ano>/detalhe.zip = detalhe_votacao_secao_<ano>.zip; <secao_dir>/<ano>/votos.zip = votacao_secao_<ano>_BR.zip
"""
import csv
import io
import math
import sys
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path

import numpy as np
from scipy import optimize, stats

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_dataset as bd  # noqa: E402

ANOS = (2018, 2022, 2026)
MIN_APTOS = 50
MIN_ZONA = 20          # z robusto só em zonas com 20+ seções analisadas
Z_LIMITE = 5
N_EXTREMOS = 30
ORIGENS = ("pt", "adv", "ter", "bn", "abst")
DESTINOS = ("pt", "adv", "bn", "abst")
BENFORD2 = np.array([sum(math.log10(1 + 1 / (10 * a + b)) for a in range(1, 10)) for b in range(10)])
CAP = 700_000


def linhas(zip_path):
    """Cabeçalho {coluna: índice} e depois as linhas do CSV de presidente (sufixo _BR.csv)."""
    with zipfile.ZipFile(zip_path) as z:
        nome = next(n for n in z.namelist() if n.endswith("_BR.csv"))
        with z.open(nome) as f:
            r = csv.reader(io.TextIOWrapper(f, encoding="latin1", newline=""), delimiter=";")
            yield {c: i for i, c in enumerate(next(r))}
            yield from r


def minutos(s, cache):
    """'25/10/2026 18:29:46' → minutos desde a meia-noite do dia da eleição do turno (NaN se ausente)."""
    if len(s) < 16 or not s[0].isdigit():
        return np.nan
    d = cache.get(s[:10])
    if d is None:
        d = cache[s[:10]] = date(int(s[6:10]), int(s[3:5]), int(s[:2])).toordinal()
    return (d - cache["dia"]) * 1440 + int(s[11:13]) * 60 + int(s[14:16])


def carrega(pasta, ano):
    pt_nr, _, adv_nr, _ = bd.FINAIS[ano]
    idx, nomes, locais = {}, {}, {}
    zona_id, mun_id = {}, {}
    num = {c: np.zeros((3, CAP)) for c in ("aptos", "comp", "abst", "nom", "bra", "nul", "anu", "presente",
                                          "inst", "anul", "ced", "recv", "modelo",
                                          "pt", "adv", "ter", "v95", "v96", "vx")}
    num["recv"][:] = np.nan
    meta = {c: np.zeros(CAP, dtype=np.int64) for c in ("zona", "mun", "uf", "local", "secao", "nzona")}
    ufs = sorted(bd.REGIAO)
    dup = 0
    it = linhas(Path(pasta) / "detalhe.zip")
    h = next(it)
    cache, dias = {}, {}
    for r in it:
        if r[h["CD_CARGO"]] != "1":
            continue
        t = int(r[h["NR_TURNO"]])
        uf, cod, zona, sec = r[h["SG_UF"]], r[h["CD_MUNICIPIO"]].zfill(5), int(r[h["NR_ZONA"]]), int(r[h["NR_SECAO"]])
        k = (uf, cod, zona, sec)
        i = idx.get(k)
        if i is None:
            i = idx[k] = len(idx)
            meta["zona"][i] = zona_id.setdefault((uf, cod, zona), len(zona_id))
            meta["mun"][i] = mun_id.setdefault((uf, cod), len(mun_id))
            meta["uf"][i] = ufs.index(uf)
            meta["secao"][i], meta["nzona"][i] = sec, zona
            loc = int(r[h["NR_LOCAL_VOTACAO"]] or 0)
            meta["local"][i] = loc
            locais[(uf, cod, zona, loc)] = r[h["NM_LOCAL_VOTACAO"]]
            nomes[cod] = r[h["NM_MUNICIPIO"]]
        elif num["presente"][t, i]:
            dup += 1
        if t not in dias:
            de = r[h["DT_ELEICAO"]]
            dias[t] = date(int(de[6:10]), int(de[3:5]), int(de[:2])).toordinal()
        cache["dia"] = dias[t]
        g = lambda c: int(r[h[c]]) if r[h[c]].lstrip("-").isdigit() else 0
        num["presente"][t, i] = 1
        for c, col in (("aptos", "QT_APTOS"), ("comp", "QT_COMPARECIMENTO"), ("abst", "QT_ABSTENCOES"),
                       ("bra", "QT_VOTOS_BRANCOS"), ("nul", "QT_VOTOS_NULOS"), ("anu", "QT_VOTOS_ANULADOS_APU_SEP")):
            num[c][t, i] += g(col)
        num["nom"][t, i] += g("QT_VOTOS_NOMINAIS") + g("QT_VOTOS_LEGENDA")
        num["inst"][t, i] = r[h["ST_SECAO_INSTALADA"]] != "Não"
        num["anul"][t, i] = r[h["ST_SECAO_ANULADA"]] == "Sim"
        orig = r[h["DS_ORIGEM_VOTO"]]
        num["ced"][t, i] = orig not in ("Urna Eletrônica", "#NULO#", "")
        num["recv"][t, i] = minutos(r[h["DT_RECEBIMENTO_BU_HOR_TSE"]], cache)
        num["modelo"][t, i] = g("CD_MODELO_URNA")
    orfas = 0
    it = linhas(Path(pasta) / "votos.zip")
    h = next(it)
    for r in it:
        if r[h["CD_CARGO"]] != "1":
            continue
        t = int(r[h["NR_TURNO"]])
        i = idx.get((r[h["SG_UF"]], r[h["CD_MUNICIPIO"]].zfill(5), int(r[h["NR_ZONA"]]), int(r[h["NR_SECAO"]])))
        q = int(r[h["QT_VOTOS"]])
        if i is None:
            orfas += q
            continue
        nr = int(r[h["NR_VOTAVEL"]])
        c = "pt" if nr == pt_nr else "adv" if nr == adv_nr else "v95" if nr == 95 else "v96" if nr == 96 \
            else "vx" if nr > 96 else "ter"
        num[c][t, i] += q
    n = len(idx)
    num = {c: v[:, :n] for c, v in num.items()}
    meta = {c: v[:n] for c, v in meta.items()}
    chaves = [None] * n
    for k, i in idx.items():
        chaves[i] = k
    return {"num": num, "meta": meta, "chaves": chaves, "nomes": nomes, "locais": locais, "ufs": ufs,
            "n_zonas": len(zona_id), "n_mun": len(mun_id), "dup": dup, "orfas": orfas}


def municipal(od_dir, api_dir, mun_dir, ano):
    if ano == 2026:
        agg, _ = bd.load_api_2026(api_dir, mun_dir)
    else:
        agg, _ = bd.load_open_data(od_dir, ano)
    return agg


# ---------- estatística por grupo ----------

def gsum(g, v, n):
    return np.bincount(g, v, n)


def demean(g, x, w, n):
    m = gsum(g, w * x, n) / np.maximum(gsum(g, w, n), 1e-12)
    return x - m[g]


def gmedian(g, v, n):
    o = np.lexsort((v, g))
    vs = v[o]
    cnt = np.bincount(g, minlength=n)
    ini = np.concatenate(([0], np.cumsum(cnt)[:-1]))
    med = np.full(n, np.nan)
    ok = cnt > 0
    med[ok] = (vs[ini[ok] + (cnt[ok] - 1) // 2] + vs[ini[ok] + cnt[ok] // 2]) / 2
    return med, cnt


def wcorr(x, y, w):
    mx, my = np.average(x, weights=w), np.average(y, weights=w)
    return float(np.sum(w * (x - mx) * (y - my)) / math.sqrt(np.sum(w * (x - mx) ** 2) * np.sum(w * (y - my) ** 2)))


def goodman(X, Y, w):
    """Mínimos quadrados ponderados (as taxas podem sair de [0, 1]; a soma das contribuições dá o líquido exato)
    e a versão restrita (taxas entre 0 e 1, cada origem somando 1; sobra um resíduo)."""
    sw = np.sqrt(w)[:, None]
    B = np.linalg.lstsq(X * sw, Y * sw, rcond=None)[0]
    G = (X * w[:, None]).T @ X / w.sum()
    H = (X * w[:, None]).T @ Y / w.sum()
    no, nd = B.shape
    x0 = np.clip(B, 0, 1) + 1e-6
    x0 = (x0 / x0.sum(1, keepdims=True)).ravel()
    res = optimize.minimize(
        lambda b: np.sum(b.reshape(no, nd) * (G @ b.reshape(no, nd))) - 2 * np.sum(b.reshape(no, nd) * H), x0,
        jac=lambda b: (2 * (G @ b.reshape(no, nd)) - 2 * H).ravel(), method="SLSQP", bounds=[(0, 1)] * (no * nd),
        constraints=[{"type": "eq", "fun": lambda b, j=j: b.reshape(no, nd)[j].sum() - 1} for j in range(no)],
        options={"maxiter": 1000, "ftol": 1e-14})
    return B, res.x.reshape(no, nd)


def digitos(v, minimo, pos):
    """Maior desvio (fração) da frequência esperada do último dígito (pos=-1, uniforme) ou do 2º dígito
    (pos=1, Benford), média do dígito e nº de casos. Com 300 mil seções o qui-quadrado rejeita em todo ano,
    então o que importa é comparar os anos."""
    v = v[v >= minimo].astype(np.int64)
    if pos == -1:
        d, esp = v % 10, np.full(10, 0.1)
    else:
        d = (v // 10 ** (np.floor(np.log10(v)).astype(np.int64) - 1)) % 10
        esp = BENFORD2
    freq = np.bincount(d, minlength=10) / len(v)
    return float(np.abs(freq - esp).max()), float(d.mean()), int(len(v))


def r5(x):
    return None if x is None or (isinstance(x, float) and not math.isfinite(x)) else round(float(x), 5)


def hhmm(m):
    if not math.isfinite(m):
        return ""
    m = int(round(m))
    return f"{m // 60 % 24:02d}:{m % 60:02d}" + (f" (+{m // 1440}d)" if m >= 1440 else "")


# ---------- análise de um ano ----------

def analisa(D, mun_ref, ano):
    N, M = D["num"], D["meta"]
    pt_nr, pt_nome, adv_nr, adv_nome = bd.FINAIS[ano]
    ufs = D["ufs"]
    s = {"id": ano, "ano": ano, "pt_nome": pt_nome, "adv_nome": adv_nome}
    pres = N["presente"].astype(bool)
    par = pres[1] & pres[2]
    s["secoes_1t"], s["secoes_2t"], s["secoes_pareadas"] = int(pres[1].sum()), int(pres[2].sum()), int(par.sum())
    s["linhas_duplicadas"], s["votos_sem_secao"] = D["dup"], int(D["orfas"])

    # 1. contabilidade
    for t in (1, 2):
        p = pres[t]
        a, c, ab = N["aptos"][t], N["comp"][t], N["abst"][t]
        brn = N["bra"][t] + N["nul"][t] + N["anu"][t]
        s[f"t{t}_ident_aptos"] = int((p & (a != c + ab)).sum())
        s[f"t{t}_ident_comp"] = int((p & (c != N["nom"][t] + brn)).sum())
        s[f"t{t}_cruz_nominais"] = int((p & (N["pt"][t] + N["adv"][t] + N["ter"][t] != N["nom"][t])).sum())
        s[f"t{t}_cruz_brancos"] = int((p & (N["v95"][t] != N["bra"][t])).sum())
        s[f"t{t}_cruz_nulos"] = int((p & (N["v96"][t] + N["vx"][t] != N["nul"][t] + N["anu"][t])).sum())
        s[f"t{t}_comp_maior_aptos"] = int((p & (c > a)).sum())
        s[f"t{t}_anuladas"] = int((p & (N["anul"][t] > 0)).sum())
        s[f"t{t}_nao_instaladas"] = int((p & (N["inst"][t] == 0)).sum())
        s[f"t{t}_cedula"] = int((p & (N["ced"][t] > 0)).sum())
    s["aptos_diferentes"] = int((par & (N["aptos"][1] != N["aptos"][2])).sum())
    s["aptos_diferentes_soma"] = int(np.abs(N["aptos"][1] - N["aptos"][2])[par].sum())
    # soma das seções × arquivo municipal
    soma = defaultdict(lambda: defaultdict(float))
    inv_mun = {}
    for i, (uf, cod, _, _) in enumerate(D["chaves"]):
        inv_mun[M["mun"][i]] = (uf, cod)
    for t in (1, 2):
        p = pres[t]
        for campo, v in (("aptos", N["aptos"][t]), ("comp", N["comp"][t]), ("pt", N["pt"][t]),
                         ("dir", N["adv"][t]), ("brancos", N["bra"][t])):
            tot = gsum(M["mun"][p], v[p], D["n_mun"])
            for m_i, val in enumerate(tot):
                soma[(t,) + inv_mun[m_i]][campo] = val
    dif_mun, dif_votos = set(), 0
    for k, ref in mun_ref.items():
        if k[1] == "VT":
            continue
        got = soma.get(k)
        for campo in ("aptos", "comp", "pt", "dir", "brancos"):
            d = abs((got[campo] if got else 0) - ref[campo])
            if d:
                dif_mun.add(k[1:])
                dif_votos += d
    s["mun_divergentes"], s["mun_divergencia_soma"] = len(dif_mun), int(dif_votos)
    s["mun_conferidos"] = len({k[1:] for k in mun_ref if k[1] != "VT"})
    for t in (1, 2):
        s[f"t{t}_pt_total"] = int(N["pt"][t][pres[t]].sum())
        s[f"t{t}_adv_total"] = int(N["adv"][t][pres[t]].sum())

    # conjunto analisado: seção nos dois turnos, no Brasil, instalada, não anulada, 50+ aptos. Onde o cadastro
    # muda entre os turnos (transferência temporária), a base é o maior dos dois e a diferença conta como abstenção.
    zz = ufs.index("ZZ")
    base = np.maximum(N["aptos"][1], N["aptos"][2])
    ok = (par & (M["uf"] != zz) & (N["inst"][1] > 0) & (N["inst"][2] > 0) & (N["anul"][1] == 0) & (N["anul"][2] == 0)
          & (base >= MIN_APTOS) & (N["pt"][1] + N["adv"][1] + N["ter"][1] > 0) & (N["pt"][2] + N["adv"][2] > 0))
    s["secoes_analisadas"] = int(ok.sum())
    A = base[ok]
    c1, c2 = N["comp"][1][ok], N["comp"][2][ok]
    p1, a1, t1 = N["pt"][1][ok], N["adv"][1][ok], N["ter"][1][ok]
    p2, a2 = N["pt"][2][ok], N["adv"][2][ok]
    bn1 = (N["bra"][1] + N["nul"][1] + N["anu"][1])[ok]
    bn2 = (N["bra"][2] + N["nul"][2] + N["anu"][2])[ok]
    ab1, ab2 = A - c1, A - c2
    zona = np.unique(M["zona"][ok], return_inverse=True)[1]
    nz = zona.max() + 1
    mun = np.unique(M["mun"][ok], return_inverse=True)[1]
    nm = mun.max() + 1
    uf = M["uf"][ok]
    idx_ok = np.flatnonzero(ok)

    # 2. comparecimento
    dc = (c2 - c1) / A
    s["comp_1t"], s["comp_2t"] = c1.sum() / A.sum(), c2.sum() / A.sum()
    s["d_comp_votos"] = int((c2 - c1).sum())
    s["d_comp_media"] = (c2 - c1).sum() / A.sum()
    s["d_comp_dp"] = float(dc.std())
    s["d_comp_p01"], s["d_comp_p50"], s["d_comp_p99"] = (float(np.percentile(dc, q)) for q in (1, 50, 99))
    s["pct_secoes_comp_sobe"] = float((c2 > c1).mean())
    s["por_mil_comp_sobe_10pp"] = float((dc >= 0.10).mean() * 1000)
    s["por_mil_comp_sobe_20pp"] = float((dc >= 0.20).mean() * 1000)
    s["por_mil_comp_cai_10pp"] = float((dc <= -0.10).mean() * 1000)
    d = np.sort(c2 - c1)[::-1]
    pos = d[d > 0]
    s["top10_comp_alta"] = float(pos[: max(1, len(d) // 10)].sum() / pos.sum())
    s["d_comp_dp_zona"] = float(np.sqrt(np.average(demean(zona, dc, A, nz) ** 2, weights=A)))

    # 3. líquido
    net = (p2 - p1) - (a2 - a1)
    netp = net / A
    sinal = 1 if net.sum() > 0 else -1
    s["net_votos"] = int(net.sum())
    s["vencedor_net"] = "PT" if sinal > 0 else "ADV"
    s["net_pct_aptos"] = net.sum() / A.sum()
    s["pct_secoes_net_vencedor"] = float((sinal * net > 0).mean())
    s["pct_secoes_net_pt"] = float((net > 0).mean())
    o = np.sort(sinal * net)[::-1]
    s["top1_net"] = float(o[: max(1, len(o) // 100)].sum() / o.sum())
    s["top10_net"] = float(o[: max(1, len(o) // 10)].sum() / o.sum())
    netd = demean(zona, netp, A, nz)
    s["net_dp_zona"] = float(np.sqrt(np.average(netd ** 2, weights=A)))
    s["net_dp"] = float(netp.std())
    med, cnt = gmedian(zona, netp, nz)
    mad, _ = gmedian(zona, np.abs(netp - med[zona]), nz)
    escala = 1.4826 * mad[zona]
    valido = (cnt[zona] >= MIN_ZONA) & (escala > 0)
    z = np.where(valido, (netp - med[zona]) / np.where(escala > 0, escala, 1), np.nan)
    fora = valido & (np.abs(np.nan_to_num(z)) > Z_LIMITE)
    s["secoes_com_z"] = int(valido.sum())
    s["z5_por_mil"] = float(fora.sum() / max(valido.sum(), 1) * 1000)
    s["z5_pro_pt"], s["z5_pro_adv"] = int((fora & (z > 0)).sum()), int((fora & (z < 0)).sum())
    s["z5_votos_net"] = int(net[fora].sum())
    dcd = demean(zona, dc, A, nz)
    b = float(np.sum(A * dcd * netd) / np.sum(A * dcd ** 2))
    s["incl_net_comp"] = b
    s["novos_para_pt"] = (1 + b) / 2
    s["r2_net_comp"] = float(b ** 2 * np.sum(A * dcd ** 2) / np.sum(A * netd ** 2))
    v1 = p1 + a1 + t1
    pt1s = p1 / v1
    pt1d = demean(zona, pt1s, A, nz)
    s["corr_comp_pt1"] = wcorr(dcd, pt1d, A)
    s["corr_net_pt1"] = wcorr(netd, pt1d, A)
    ter1d = demean(zona, t1 / A, A, nz)
    s["corr_net_ter1"] = wcorr(netd, ter1d, A)

    # 4. transições (Goodman por UF)
    X = np.column_stack([p1, a1, t1, bn1, ab1]) / A[:, None]
    Y = np.column_stack([p2, a2, bn2, ab2]) / A[:, None]
    trans, trans_ols = {}, {}
    for u in np.unique(uf):
        m = uf == u
        B_ols, B = goodman(X[m], Y[m], A[m])
        V = (X[m] * A[m][:, None]).sum(0)
        trans[ufs[u]], trans_ols[ufs[u]] = (B, V), (B_ols, V)

    def contrib(tr, j, lista):
        ajuste = -1 if ORIGENS[j] == "pt" else 1 if ORIGENS[j] == "adv" else 0
        return sum((tr[u][0][j, 0] - tr[u][0][j, 1] + ajuste) * tr[u][1][j] for u in lista)

    for j, o_ in enumerate(ORIGENS):
        s[f"contrib_{o_}"] = int(round(contrib(trans, j, trans)))
        s[f"contrib_{o_}_ols"] = int(round(contrib(trans_ols, j, trans)))
    s["contrib_residuo"] = s["net_votos"] - sum(s[f"contrib_{o_}"] for o_ in ORIGENS)
    s["contrib_soma_ols"] = sum(s[f"contrib_{o_}_ols"] for o_ in ORIGENS)
    s["ols_fora_0_1"] = int(sum(((B < -0.05) | (B > 1.05)).sum() for B, _ in trans_ols.values()))
    s["ols_coeficientes"] = int(sum(B.size for B, _ in trans_ols.values()))
    # o mesmo dentro da zona (compara seções vizinhas): líquido por eleitor a mais, por voto que saiu de
    # branco/nulo e por voto da 3ª via, numa regressão só
    Z = np.column_stack([dcd, demean(zona, (bn1 - bn2) / A, A, nz), ter1d])
    sw = np.sqrt(A)
    s["fe_comp"], s["fe_bn"], s["fe_ter"] = (float(c) for c in np.linalg.lstsq(Z * sw[:, None], netd * sw,
                                                                                 rcond=None)[0])
    bra1, bra2 = N["bra"][1][ok], N["bra"][2][ok]
    nul1, nul2 = bn1 - bra1, bn2 - bra2
    Z = np.column_stack([dcd, demean(zona, (bra1 - bra2) / A, A, nz), demean(zona, (nul1 - nul2) / A, A, nz), ter1d])
    _, s["fe_branco"], s["fe_nulo"], _ = (float(c) for c in np.linalg.lstsq(Z * sw[:, None], netd * sw,
                                                                             rcond=None)[0])
    s["brancos_1t"], s["nulos_1t"] = bra1.sum() / c1.sum(), nul1.sum() / c1.sum()
    s["brancos_2t"], s["nulos_2t"] = bra2.sum() / c2.sum(), nul2.sum() / c2.sum()
    s["corr_net_bn1"] = wcorr(netd, demean(zona, bn1 / c1, A, nz), A)

    # 5. forense e extremos
    vv2 = p2 + a2
    big = (vv2 >= 100) & (A >= 100)
    s["por_mil_pt_95"] = float(((p2 / vv2 >= 0.95) & big).sum() / big.sum() * 1000)
    s["por_mil_adv_95"] = float(((a2 / vv2 >= 0.95) & big).sum() / big.sum() * 1000)
    venc = np.maximum(p2, a2) / vv2
    s["por_mil_klimek"] = float(((c2 / A >= 0.95) & (venc >= 0.90) & big).sum() / big.sum() * 1000)
    s["por_mil_bn2_zero"] = float(((bn2 == 0) & (c2 >= 200)).sum() / max((c2 >= 200).sum(), 1) * 1000)
    s["por_mil_bn1_zero"] = float(((bn1 == 0) & (c1 >= 200)).sum() / max((c1 >= 200).sum(), 1) * 1000)
    s["klimek_n"] = int(((c2 / A >= 0.95) & (venc >= 0.90) & big).sum())
    s["klimek_pt"] = int(((c2 / A >= 0.95) & (p2 / vv2 >= 0.90) & big).sum())
    zero = (bn2 == 0) & (c2 >= 200)
    s["bn2_zero_n"] = int(zero.sum())
    if zero.any():
        s["bn2_zero_bn1_baixo"] = float((bn1[zero] / c1[zero] < 0.01).mean())
        s["bn2_zero_pt_venceu"] = float((p2[zero] > a2[zero]).mean())
        s["bn2_zero_pt2_dm"] = float(np.average(demean(zona, p2 / vv2, A, nz)[zero], weights=A[zero]))
        s["bn2_zero_net_dm"] = float(np.average(netd[zero], weights=A[zero]))
        cont = np.bincount(uf[zero], minlength=len(ufs))
        s["bn2_zero_ufs"] = " ".join(f"{ufs[k]} {cont[k]}" for k in np.argsort(-cont)[:3] if cont[k])
    for nome_, v in (("pt", p2), ("adv", a2)):
        s[f"dig_ult_{nome_}_desvio"], _, s[f"dig_ult_{nome_}_n"] = digitos(v, 100, -1)
        s[f"dig_2bl_{nome_}_desvio"], s[f"dig_2bl_{nome_}_media"], _ = digitos(v, 10, 1)

    # 6. ordem de chegada (decis dentro da UF) e modelo de urna (dentro do município)
    rec = N["recv"][2][ok]
    tem = np.isfinite(rec)
    rank = np.full(len(rec), np.nan)
    for u in np.unique(uf):
        m = (uf == u) & tem
        if m.sum() > 10:
            rank[m] = stats.rankdata(rec[m]) / m.sum()
    tem &= np.isfinite(rank)
    decil = np.minimum((np.nan_to_num(rank) * 10).astype(int), 9)
    netu = demean(uf, netp, A, len(ufs))
    dcu = demean(uf, dc, A, len(ufs))
    pt1u = demean(uf, pt1s, A, len(ufs))
    s["corr_chegada_net"] = wcorr(rank[tem], netu[tem], A[tem]) if tem.sum() else None
    # chegada no TSE em faixas de 10 minutos (17h–23h, horário de Brasília); pausa = maior sequência de faixas
    # com menos de 0,05% das seções antes da mediana
    chegada = []
    for t in (1, 2):
        r_ = N["recv"][t][pres[t] & (M["uf"] != zz)]
        r_ = r_[np.isfinite(r_)]
        s[f"chegada_mediana_{t}t"] = hhmm(float(np.median(r_))) if len(r_) else ""
        if not len(r_):
            continue
        cortes = np.arange(17 * 60, 23 * 60 + 1, 10)
        h_ = np.histogram(r_, bins=cortes)[0] / len(r_)
        s[f"pct_ate_17h30_{t}t"] = float((r_ < 17 * 60 + 30).mean())
        seq = melhor = 0
        for k, q in enumerate(h_):
            if cortes[k] >= np.median(r_):
                break
            seq = seq + 10 if q < 0.0005 else 0
            melhor = max(melhor, seq)
        s[f"pausa_min_{t}t"] = melhor
        for k, q in enumerate(h_):
            chegada.append({"id": f"{ano}-chegada_{t}t-{k}", "ano": ano, "var": f"chegada_{t}t",
                            "centro": round((cortes[k] + 5) / 60, 4), "pct_secoes": r5(q)})
    cedo = tem & (rec < 17 * 60 + 30)
    s["secoes_ate_17h30_2t"] = int(cedo.sum())
    s["net_dm_ate_17h30_2t"] = float(np.average(netu[cedo], weights=A[cedo])) if cedo.any() else None
    tempo = []
    for k in range(10):
        m = tem & (decil == k)
        if not m.any():
            continue
        tempo.append({"id": f"{ano}-{k + 1}", "ano": ano, "decil": k + 1, "secoes": int(m.sum()),
                      "chegada_mediana": hhmm(float(np.median(rec[m]))),
                      "net_dm": r5(np.average(netu[m], weights=A[m])),
                      "d_comp_dm": r5(np.average(dcu[m], weights=A[m])),
                      "pt1_dm": r5(np.average(pt1u[m], weights=A[m]))})
    mod = N["modelo"][2][ok].astype(int)
    netm, dcm, pt1m = demean(mun, netp, A, nm), demean(mun, dc, A, nm), demean(mun, pt1s, A, nm)
    modelos = []
    for md in sorted(set(mod.tolist())):
        m = mod == md
        if md <= 0 or m.sum() < 100:
            continue
        modelos.append({"id": f"{ano}-{md}", "ano": ano, "modelo": f"UE {md}", "secoes": int(m.sum()),
                        "pct_secoes": r5(m.mean()),
                        "net_dm": r5(np.average(netm[m], weights=A[m])),
                        "d_comp_dm": r5(np.average(dcm[m], weights=A[m])),
                        "pt1_dm": r5(np.average(pt1m[m], weights=A[m]))})

    # transições por escopo
    trans_rows = []
    escopos = {"BR": list(trans)}
    for u in trans:
        escopos.setdefault(bd.REGIAO[u], []).append(u)
    for esc, lista in escopos.items():
        for j, o_ in enumerate(ORIGENS):
            V = sum(trans[u][1][j] for u in lista)
            row = {"id": f"{ano}-{esc}-{o_}", "ano": ano, "escopo": esc, "origem": o_, "votos_1t": int(round(V))}
            for tr, suf in ((trans, ""), (trans_ols, "_ols")):
                for k, d_ in enumerate(DESTINOS):
                    row[f"para_{d_}{suf}"] = r5(sum(tr[u][0][j, k] * tr[u][1][j] for u in lista) / V) if V else None
                row[f"contrib_net{suf}"] = int(round(contrib(tr, j, lista)))
            trans_rows.append(row)

    # por UF
    uf_rows = []
    for u in np.unique(uf):
        m = uf == u
        B, V = trans[ufs[u]]
        bz = np.sum(A[m] * dcd[m] * netd[m]) / max(np.sum(A[m] * dcd[m] ** 2), 1e-12)
        uf_rows.append({"id": f"{ano}-{ufs[u]}", "ano": ano, "uf": ufs[u], "regiao": bd.REGIAO[ufs[u]],
                        "secoes": int(m.sum()), "d_comp": r5((c2[m] - c1[m]).sum() / A[m].sum()),
                        "net_votos": int(net[m].sum()), "net_pct_aptos": r5(net[m].sum() / A[m].sum()),
                        "pct_secoes_net_pt": r5((net[m] > 0).mean()),
                        "top10_net": r5(np.sort(sinal * net[m])[::-1][: max(1, m.sum() // 10)].sum()
                                        / (sinal * net[m]).sum()) if (sinal * net[m]).sum() > 0 else None,
                        "incl_net_comp": r5(bz), "ter_para_pt": r5(B[2, 0]), "ter_para_adv": r5(B[2, 1]),
                        "abst_para_pt": r5(B[4, 0]), "abst_para_adv": r5(B[4, 1]),
                        "z5_por_mil": r5(fora[m].sum() / max(valido[m].sum(), 1) * 1000)})

    # extremos: maiores |z| (seções com 100+ aptos), padrão Klimek (comparecimento 95%+ e 90%+ para um lado)
    # e as maiores seções com brancos+nulos zerados no 2º turno
    cand = np.flatnonzero(valido & (A >= 100))
    lista_ext = [(j, "desvio da zona") for j in cand[np.argsort(-np.abs(z[cand]))][:N_EXTREMOS]]
    kl = np.flatnonzero((c2 / A >= 0.95) & (venc >= 0.90) & big)
    lista_ext += [(j, "comparecimento 95%+ e 90%+ para um lado") for j in kl[np.argsort(-A[kl])][:N_EXTREMOS]]
    zr = np.flatnonzero(zero)
    lista_ext += [(j, "brancos e nulos zerados no 2º turno") for j in zr[np.argsort(-c2[zr])][:N_EXTREMOS]]
    ext, vistos = [], set()
    for j, tipo in lista_ext:
        i = idx_ok[j]
        uf_s, cod, zn, sec = D["chaves"][i]
        if (uf_s, cod, zn, sec) in vistos:
            continue
        vistos.add((uf_s, cod, zn, sec))
        ext.append({"id": f"{ano}-{uf_s}-{cod}-{zn}-{sec}", "ano": ano, "tipo": tipo, "cod": cod, "uf": uf_s,
                    "municipio": bd.nome_mun(D["nomes"][cod]), "zona": zn, "secao": sec,
                    "local": D["locais"].get((uf_s, cod, zn, int(M["local"][i])), "").title(),
                    "aptos": int(A[j]), "comp_1t": r5(c1[j] / A[j]), "comp_2t": r5(c2[j] / A[j]),
                    "pt_1t": int(p1[j]), "adv_1t": int(a1[j]), "ter_1t": int(t1[j]),
                    "pt_2t": int(p2[j]), "adv_2t": int(a2[j]), "net_votos": int(net[j]),
                    "bn_1t": int(bn1[j]), "bn_2t": int(bn2[j]),
                    "net_pct_aptos": r5(netp[j]), "mediana_zona": r5(med[zona[j]]),
                    "z": round(float(z[j]), 1) if math.isfinite(z[j]) else None,
                    "chegada": hhmm(float(rec[j])), "modelo": f"UE {int(mod[j])}" if mod[j] > 0 else ""})

    # distribuições
    dist = []
    for var, v in (("net", netp), ("d_comp", dc)):
        cortes = np.arange(-0.15, 0.1501, 0.005)
        h_, _ = np.histogram(np.clip(v, -0.15, 0.15 - 1e-9), bins=cortes)
        for k, q in enumerate(h_):
            centro = round((cortes[k] + cortes[k + 1]) / 2, 4)
            dist.append({"id": f"{ano}-{var}-{k}", "ano": ano, "var": var, "centro": centro,
                         "pct_secoes": r5(q / len(v))})
    dist += chegada

    s = {k: r5(v) if isinstance(v, float) else v for k, v in s.items()}
    return s, trans_rows, uf_rows, tempo, modelos, ext, dist


def main(od_dir, api_dir, mun_dir, secao_dir, out_dir):
    out = Path(out_dir)
    tabelas = defaultdict(list)
    for ano in ANOS:
        D = carrega(Path(secao_dir) / str(ano), ano)
        ref = municipal(od_dir, api_dir, mun_dir, ano)
        s, tr, ufr, tempo, mods, ext, dist = analisa(D, ref, ano)
        print(ano, {k: s[k] for k in ("secoes_pareadas", "secoes_analisadas", "mun_divergentes", "net_votos",
                                      "contrib_soma_ols", "contrib_residuo", "fe_bn", "top10_net")}, flush=True)
        tabelas["secao_serie"].append(s)
        tabelas["secao_transicao"] += tr
        tabelas["secao_uf"] += ufr
        tabelas["secao_tempo"] += tempo
        tabelas["secao_modelo"] += mods
        tabelas["secao_extremos"] += ext
        tabelas["secao_dist"] += dist
    for nome, rows in tabelas.items():
        rows.sort(key=lambda r: -r["ano"])
        campos = list(dict.fromkeys(c for r in rows for c in r))
        bd.write_csv(out / f"{nome}.csv", rows, campos)


if __name__ == "__main__":
    main(*sys.argv[1:6])
