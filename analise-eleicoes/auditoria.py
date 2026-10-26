"""Auditoria estatística 1T → 2T das eleições presidenciais de 2002 a 2026, por município.

Pergunta: o que aconteceu entre os turnos de 2026 (queda de abstenção, brancos e nulos; transferência
da 3ª via; crescimento de Lula) foge do padrão histórico? É generalizado ou concentrado?

Saídas em <out_dir>:
  auditoria_serie.csv     uma linha por eleição: totais nacionais, distribuição entre cidades,
                          regressões ecológicas e testes forenses
  auditoria_hist.csv      histogramas por cidade (variação de abstenção, de brancos+nulos, swing do PT)
  auditoria_outliers.csv  cidades com resíduo extremo no modelo de transferência
  auditoria_estados.csv   variação de abstenção e brancos+nulos por UF, por eleição

Uso (precisa de numpy e scipy):
  python -I auditoria.py <od_dir> <api_dir> <mun_dir> <out_dir>
"""
import csv
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
from scipy import stats

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_dataset as bd  # noqa: E402

FINAIS = bd.FINAIS
ANOS = bd.ANOS
BENFORD2 = np.array([sum(np.log10(1 + 1 / (10 * k + d)) for k in range(1, 10)) for d in range(10)])


def cidades_do_ano(od_dir, api_dir, mun_dir, ano):
    agg, nomes = (bd.load_api_2026(api_dir, mun_dir) if ano == 2026 else bd.load_open_data(od_dir, ano))
    out = []
    for uf, cod in sorted({(k[1], k[2]) for k in agg}):
        t1, t2 = agg.get((1, uf, cod)), agg.get((2, uf, cod))
        if uf in ("ZZ", "VT") or not t1 or not t2 or not t1["aptos"] or not t2["aptos"]:
            continue
        out.append({"cod": cod, "uf": uf, "regiao": bd.REGIAO.get(uf, "?"), "municipio": bd.nome_mun(nomes[cod]),
                    "t1": dict(t1), "t2": dict(t2)})
    return out


def wls(X, y, w):
    W = w / w.sum()
    XtW = X.T * W
    beta = np.linalg.solve(XtW @ X, XtW @ y)
    e = y - X @ beta
    n, k = X.shape
    s2 = (W * e ** 2).sum() * n / (n - k)
    se = np.sqrt(np.diag(s2 * np.linalg.inv(XtW @ X)) / n)
    r2 = 1 - (W * e ** 2).sum() / (W * (y - (W * y).sum()) ** 2).sum()
    return beta, se, r2, e


def wquant(x, w, q):
    o = np.argsort(x)
    cw = np.cumsum(w[o]) / w.sum()
    return np.interp(q, cw, x[o])


def wsd(x, w):
    m = (w * x).sum() / w.sum()
    return float(np.sqrt((w * (x - m) ** 2).sum() / w.sum()))


def digitos(contagens, minimo):
    c = np.array([v for v in contagens if v >= minimo])
    seg = np.array([int(str(v)[1]) for v in c])
    ult = c % 10
    obs2 = np.bincount(seg, minlength=10)
    chi2_2 = ((obs2 - BENFORD2 * len(seg)) ** 2 / (BENFORD2 * len(seg))).sum()
    obsu = np.bincount(ult, minlength=10)
    expu = len(ult) / 10
    chi2_u = ((obsu - expu) ** 2 / expu).sum()
    return {"n": len(c), "media2": seg.mean(), "chi2_2": chi2_2, "p_2": stats.chi2.sf(chi2_2, 9),
            "chi2_u": chi2_u, "p_u": stats.chi2.sf(chi2_u, 9)}


def analisa(ano, cs):
    pt_nr, pt_nome, adv_nr, adv_nome = FINAIS[ano]
    g = lambda t, k: np.array([c[t][k] for c in cs], float)
    apt1, apt2 = g("t1", "aptos"), g("t2", "aptos")
    comp1, comp2 = g("t1", "comp"), g("t2", "comp")
    ab1, ab2 = g("t1", "abst"), g("t2", "abst")
    v1, v2 = g("t1", "validos"), g("t2", "validos")
    br1, br2 = g("t1", "brancos"), g("t2", "brancos")
    pt1, pt2, ad1, ad2 = g("t1", "pt"), g("t2", "pt"), g("t1", "dir"), g("t2", "dir")
    bn1, bn2 = comp1 - v1, comp2 - v2
    nu1, nu2 = bn1 - br1, bn2 - br2
    terc = v1 - pt1 - ad1
    delta = (ab1 + bn1) - (ab2 + bn2)
    gpt, gad = pt2 - pt1, ad2 - ad1
    w = apt1
    reg = np.array([c["regiao"] for c in cs])

    d_abst = ab2 / apt2 - ab1 / apt1          # variação da taxa de abstenção (fração do eleitorado)
    d_bn = bn2 / comp2 - bn1 / comp1          # variação de brancos+nulos (fração do comparecimento)
    s1 = pt1 / (pt1 + ad1)
    s2 = pt2 / (pt2 + ad2)
    swing = s2 - s1                           # swing bipartidário do PT (Butler)

    # transferência: ganho do PT por eleitor = c + X·(3ª via/eleitor) + Y·(Δ/eleitor)
    X = np.column_stack([np.ones_like(w), terc / w, delta / w])
    beta, se, r2, e = wls(X, gpt / w, w)
    z = e * np.sqrt(w)
    zr = (z - np.median(z)) / (1.4826 * np.median(np.abs(z - np.median(z))))
    # para onde foi a 3ª via que não votou nos finalistas: variação de brancos+nulos e de abstenção por eleitor
    Xt = np.column_stack([np.ones_like(w), terc / w])
    b_bn, se_bn, _, _ = wls(Xt, (bn2 - bn1) / w, w)
    b_ab, se_ab, _, _ = wls(Xt, (ab2 - ab1) / w, w)
    # swing uniforme: quanto do 2T se prevê pelo 1T
    Xu = np.column_stack([np.ones_like(w), pt1 / v1, terc / v1])
    _, _, r2_unif, eu = wls(Xu, pt2 / v2, w)
    # mobilização diferencial: a abstenção caiu mais onde o PT era forte?
    corr_mob = float(np.corrcoef(-d_abst, pt1 / v1)[0, 1])
    # impressão digital (Klimek): cidades com comparecimento ≥ 90% e vencedor ≥ 80% no 2T
    venc2 = np.maximum(pt2, ad2) / v2
    turn2 = comp2 / apt2
    dig = {k: digitos(np.concatenate([pt2, ad2]).astype(int), m) for k, m in (("d", 10),)}["d"]

    nat = lambda a: a.sum()
    linha = {
        "ano": ano, "pt": pt_nome, "adv": adv_nome, "cidades": len(cs),
        "eleitores": nat(apt1),
        "abst_1t": nat(ab1) / nat(apt1), "abst_2t": nat(ab2) / nat(apt2),
        "d_abst_pp": nat(ab2) / nat(apt2) - nat(ab1) / nat(apt1),
        "bn_1t": nat(bn1) / nat(comp1), "bn_2t": nat(bn2) / nat(comp2),
        "d_bn_pp": nat(bn2) / nat(comp2) - nat(bn1) / nat(comp1),
        "brancos_1t": nat(br1) / nat(comp1), "brancos_2t": nat(br2) / nat(comp2),
        "nulos_1t": nat(nu1) / nat(comp1), "nulos_2t": nat(nu2) / nat(comp2),
        "terceira": nat(terc) / nat(v1), "delta": nat(delta), "delta_pct": nat(delta) / nat(apt1),
        "pt_1t": nat(pt1) / nat(v1), "pt_2t": nat(pt2) / nat(v2), "adv_1t": nat(ad1) / nat(v1), "adv_2t": nat(ad2) / nat(v2),
        "captura_pt": nat(gpt) / (nat(gpt) + nat(gad)),
        "pct_cid_abst_caiu": float((d_abst < 0).mean()), "pct_cid_bn_caiu": float((d_bn < 0).mean()),
        "pct_cid_ambos_caiu": float(((d_abst < 0) & (d_bn < 0)).mean()),
        "pct_cid_swing_pt": float((swing > 0).mean()),
        "pct_cid_captura_pt": float((gpt > gad).mean()),
        "med_d_abst": float(wquant(d_abst, w, 0.5)), "p10_d_abst": float(wquant(d_abst, w, 0.1)),
        "p90_d_abst": float(wquant(d_abst, w, 0.9)), "sd_d_abst": wsd(d_abst, w),
        "med_d_bn": float(wquant(d_bn, w, 0.5)), "p10_d_bn": float(wquant(d_bn, w, 0.1)),
        "p90_d_bn": float(wquant(d_bn, w, 0.9)), "sd_d_bn": wsd(d_bn, w),
        "med_swing": float(wquant(swing, w, 0.5)), "p10_swing": float(wquant(swing, w, 0.1)),
        "p90_swing": float(wquant(swing, w, 0.9)), "sd_swing": wsd(swing, w),
        "sd_swing_ufs": float(np.std([wsd(swing[[c["uf"] == u for c in cs]], w[[c["uf"] == u for c in cs]]) for u in sorted({c["uf"] for c in cs})])),
        "r2_uniforme": r2_unif, "sd_resid_uniforme": wsd(eu, w),
        "x_hat": beta[1], "x_se": se[1], "y_hat": beta[2], "y_se": se[2], "c_hat": beta[0], "r2_transf": r2,
        "bn_por_terceira": b_bn[1], "bn_por_terceira_se": se_bn[1], "bn_intercepto": b_bn[0],
        "abst_por_terceira": b_ab[1], "abst_por_terceira_se": se_ab[1], "abst_intercepto": b_ab[0],
        "corr_mobilizacao": corr_mob,
        "outliers_z5_por_mil": float((np.abs(zr) > 5).mean() * 1000),
        "outliers_z5": int((np.abs(zr) > 5).sum()),
        "klimek_cidades": int(((turn2 >= 0.9) & (venc2 >= 0.8)).sum()),
        "corr_comparecimento_venc": float(np.corrcoef(turn2, venc2)[0, 1]),
        "benford2_media": dig["media2"], "benford2_p": dig["p_2"], "ultimo_digito_p": dig["p_u"], "digitos_n": dig["n"],
        "cid_aptos_dif": int((apt1 != apt2).sum()), "cid_nulos_neg": int(((nu1 < 0) | (nu2 < 0)).sum()),
        # voto em trânsito: eleitores que mudam de cidade entre os turnos (existe desde 2010)
        "transito_abs": int(np.abs(apt1 - apt2).sum()),
        # fraude por enchimento de urna favorecendo o PT deixaria comparecimento alto junto de PT alto
        "corr_comparecimento_pt": float(np.corrcoef(turn2, pt2 / v2)[0, 1]),
        "corr_comparecimento_pt_se": float(np.corrcoef(turn2[reg == "SE"], (pt2 / v2)[reg == "SE"])[0, 1]),
        "corr_comparecimento_pt_s": float(np.corrcoef(turn2[reg == "S"], (pt2 / v2)[reg == "S"])[0, 1]),
        # cidades onde o PT ganhou mais que toda a 3ª via + saldo positivo: exige que eleitores do adversário saiam
        "cid_pt_acima_pool": int((gpt > terc + np.maximum(delta, 0)).sum()),
        "adv_perdeu_cidades": int((gad < 0).sum()), "adv_votos_perdidos": int(-gad[gad < 0].sum()),
    }
    hist = []
    for var, arr, lo, hi, passo in (("d_abst", d_abst, -0.15, 0.10, 0.005), ("d_bn", d_bn, -0.10, 0.06, 0.004),
                                    ("swing", swing, -0.10, 0.25, 0.005)):
        bins = np.arange(lo, hi + passo / 2, passo)
        cnt, _ = np.histogram(np.clip(arr, lo, hi - 1e-9), bins=bins)
        for i, n in enumerate(cnt):
            hist.append({"id": f"{ano}-{var}-{i}", "ano": ano, "var": var, "lo": round(bins[i], 4),
                         "hi": round(bins[i + 1], 4), "cidades": int(n), "pct": n / len(arr)})
    ordem = np.argsort(-np.abs(zr))
    outl = []
    for rank, i in enumerate(ordem[:25], 1):
        c = cs[i]
        outl.append({"id": f"{ano}-{c['cod']}", "ano": ano, "rank": rank, "cod": c["cod"], "municipio": c["municipio"],
                     "uf": c["uf"], "aptos": int(apt1[i]), "z": float(zr[i]),
                     "ganho_pt": int(gpt[i]), "ganho_adv": int(gad[i]), "terceira": int(terc[i]), "delta": int(delta[i]),
                     "d_abst": float(d_abst[i]), "d_bn": float(d_bn[i]), "swing": float(swing[i]),
                     "esperado_pt": int(round((X[i] @ beta) * w[i]))})
    est = []
    for u in sorted({c["uf"] for c in cs}):
        m = np.array([c["uf"] == u for c in cs])
        est.append({"id": f"{ano}-{u}", "ano": ano, "uf": u, "regiao": bd.REGIAO.get(u),
                    "d_abst_pp": ab2[m].sum() / apt2[m].sum() - ab1[m].sum() / apt1[m].sum(),
                    "d_bn_pp": bn2[m].sum() / comp2[m].sum() - bn1[m].sum() / comp1[m].sum(),
                    "swing": pt2[m].sum() / (pt2[m].sum() + ad2[m].sum()) - pt1[m].sum() / (pt1[m].sum() + ad1[m].sum()),
                    "pct_cid_abst_caiu": float((d_abst[m] < 0).mean()), "pct_cid_bn_caiu": float((d_bn[m] < 0).mean())})
    return linha, hist, outl, est


def main(od_dir, api_dir, mun_dir, out_dir):
    out = Path(out_dir)
    serie, hist, outl, est = [], [], [], []
    for ano in ANOS:
        cs = cidades_do_ano(od_dir, api_dir, mun_dir, ano)
        l, h, o, e = analisa(ano, cs)
        l["id"] = str(ano)
        serie.append(l)
        hist += h
        outl += o
        est += e
        print(ano, len(cs), "cidades")
    # quão longe 2026 está do histórico 2002–2022, em desvios-padrão
    hist_anos = [s for s in serie if s["ano"] < 2026]
    s26 = next(s for s in serie if s["ano"] == 2026)
    for k in ("d_abst_pp", "d_bn_pp", "pct_cid_abst_caiu", "pct_cid_bn_caiu", "sd_swing", "sd_d_abst", "sd_d_bn",
              "r2_uniforme", "captura_pt", "outliers_z5_por_mil", "bn_por_terceira", "abst_por_terceira"):
        vals = np.array([s[k] for s in hist_anos], float)
        s26[f"z_{k}"] = float((s26[k] - vals.mean()) / vals.std(ddof=1)) if vals.std(ddof=1) else None
        s26[f"rank_{k}"] = int(1 + sum(v < s26[k] for v in vals))  # posição de 2026 entre as 7 eleições, do menor ao maior
    # tendência linear 2002–2022 da variação de abstenção entre turnos, e onde 2026 cai em relação a ela
    y = np.array([s["d_abst_pp"] for s in hist_anos])
    x = np.arange(len(y))
    b = np.polyfit(x, y, 1)
    sd = (y - np.polyval(b, x)).std(ddof=2)
    s26["d_abst_tendencia"] = float(np.polyval(b, len(y)))
    s26["z_d_abst_tendencia"] = float((s26["d_abst_pp"] - s26["d_abst_tendencia"]) / sd)
    chaves = list(dict.fromkeys(k for s in serie for k in s))
    for s in serie:
        for k in chaves:
            s.setdefault(k, None)
    cols = ["id"] + [k for k in chaves if k != "id"]
    bd.write_csv(out / "auditoria_serie.csv", [{k: s[k] for k in cols} for s in serie])
    bd.write_csv(out / "auditoria_hist.csv", hist)
    bd.write_csv(out / "auditoria_outliers.csv", outl)
    bd.write_csv(out / "auditoria_estados.csv", est)


if __name__ == "__main__":
    main(*sys.argv[1:5])
