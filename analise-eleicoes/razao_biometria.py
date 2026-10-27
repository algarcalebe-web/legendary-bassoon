"""Razão de ganho entre turnos (votos ganhos pelo PT ÷ votos ganhos pelo adversário, por cidade) e sua relação com o voto
sem biometria. Só dados do TSE.

Razão = ganho_pt / ganho_dir quando os dois ganham votos (Araruama/RJ 2026: 5.581 / 11 = 507,4×, ou 50.736%). Quando o
adversário perde ou empata votos a razão não existe (divisão por zero ou negativa) e a cidade vai para a classe própria
"adversário perdeu"; quando o PT perde, "PT perdeu". Denominador pequeno explode a razão, então a ordenação vale, mas a
média não: as estatísticas usam mediana, classes e correlação de postos (Spearman).

Biometria:
  cidade (todas)   QT_ELEI_BIOM_SEM_HABILITACAO ÷ comparecimento no bweb do 1º turno (eleitor com biometria liberado
                   sem ela). O bweb do 2º turno ainda não foi publicado; quando sair, o mesmo teste roda com ele.
  seção (amostra)  logs de urna dos dois turnos nas seções lidas em seguranca.py (seg_secoes.csv): votos com e sem
                   identificação biométrica e liberações pelo mesário, 1º e 2º turno.

Uso: python3 -I razao_biometria.py <bweb_dir> <data_dir>
"""
import csv
import glob
import sys

import numpy as np
from scipy import stats

ANOS = ("2002", "2006", "2010", "2014", "2018", "2022", "2026")
CLASSES = (("dir_perdeu", "Adversário perdeu votos (razão infinita)"), ("r100", "100× ou mais"), ("r10", "10× a 100×"),
           ("r3", "3× a 10×"), ("r1", "1× a 3×"), ("r0", "Abaixo de 1× (adversário ganhou mais)"), ("pt_perdeu", "PT perdeu votos"))
ALERTA = ("pt_acima", "pt_alerta")


def mil(x):
    return f"{x:,.0f}".replace(",", ".")


def pc(x):
    return f"{x * 100:.1f}%".replace(".", ",")


def r5(x):
    return None if x is None or not np.isfinite(x) else round(float(x), 5)


def razao(gp, gd):
    return np.where((gp > 0) & (gd > 0), gp / np.where(gd > 0, gd, 1), np.nan)


def classe(gp, gd):
    r = razao(gp, gd)
    return np.select([gp <= 0, gd <= 0, r >= 100, r >= 10, r >= 3, r >= 1], ["pt_perdeu", "dir_perdeu", "r100", "r10", "r3", "r1"], "r0")


def bweb(bweb_dir):
    out = {}
    for f in glob.glob(f"{bweb_dir}/pres_1t_*.csv"):
        for r in csv.DictReader(open(f, encoding="utf-8"), delimiter=";"):
            nb = r["QT_ELEI_BIOM_SEM_HABILITACAO"]
            if r["SG_UF"] == "ZZ" or not nb.isdigit():
                continue
            a = out.setdefault(r["CD_MUNICIPIO"].lstrip("0"), [0, 0])
            a[0] += int(nb)
            a[1] += int(r["QT_COMPARECIMENTO"] or 0)
    return out


def cidades(data_dir, ano):
    R = list(csv.DictReader(open(f"{data_dir}/mapa_{ano}.csv", encoding="utf-8")))
    f = lambda k: np.array([float(r[k] or "nan") for r in R])  # noqa: E731
    return R, f("ganho_pt"), f("ganho_dir"), f("aptos"), np.array([r["flag_conv"] for r in R])


def dentro_uf(x, uf):
    # posto relativo dentro de cada UF: tira o efeito de estado (Nordeste com mais ganho e menos biometria, p. ex.)
    y = np.full(len(x), np.nan)
    for u in np.unique(uf):
        m = uf == u
        y[m] = stats.rankdata(x[m]) / m.sum()
    return y


def main():
    bweb_dir, data_dir = sys.argv[1:3]
    B = bweb(bweb_dir)
    res, teste, bio = [], [], []
    for ano in ANOS:
        R, gp, gd, ap, fl = cidades(data_dir, ano)
        c, r = classe(gp, gd), razao(gp, gd)
        sb = np.full(len(R), np.nan)
        if ano == "2026":
            for i, x in enumerate(R):
                b = B.get(x["cod"].lstrip("0"))
                if b and b[1]:
                    sb[i] = b[0] / b[1]
                    bio.append({"id": x["id"], "cod": x["cod"], "uf": x["uf"], "comp_1t": b[1], "sem_biom": b[0], "sem_biom_1t": r5(sb[i]),
                                "razao_ganho": r5(r[i]), "classe": c[i]})
        tot = ap.sum()
        for k, rot in CLASSES:
            m = c == k
            res.append({"id": f"{ano}-{k}", "ano": ano, "classe": k, "rotulo": rot, "cidades": int(m.sum()), "aptos": int(ap[m].sum()),
                        "pct_aptos": r5(ap[m].sum() / tot), "ganho_pt": int(gp[m].sum()), "ganho_dir": int(gd[m].sum()),
                        "razao_mediana": r5(np.nanmedian(r[m])) if np.isfinite(r[m]).any() else None,
                        "pct_alerta": r5(np.isin(fl[m], ALERTA).mean()) if m.any() else None,
                        "sem_biom_1t": r5(np.nansum(sb[m] * ap[m]) / ap[m][np.isfinite(sb[m])].sum()) if ano == "2026" and np.isfinite(sb[m]).any() else None})
        ok = np.isfinite(r)
        res.append({"id": f"{ano}-total", "ano": ano, "classe": "total", "rotulo": "Total", "cidades": len(R), "aptos": int(tot), "pct_aptos": 1.0,
                    "ganho_pt": int(gp.sum()), "ganho_dir": int(gd.sum()), "razao_mediana": r5(np.median(r[ok])),
                    "pct_alerta": r5(np.isin(fl, ALERTA).mean()), "sem_biom_1t": None})
        if ano != "2026":
            continue
        uf = np.array([x["uf"] for x in R])
        share = gp / (np.abs(gp) + np.abs(gd))  # fatia do PT no ganho dos dois, limitada: inclui as cidades sem razão
        m = ok & np.isfinite(sb)
        add = lambda i, nivel, t, n, v, p, txt: teste.append({"id": i, "nivel": nivel, "teste": t, "n": n, "valor": r5(v), "p": r5(p) if p is not None else None, "leitura": txt})  # noqa: E731
        s = stats.spearmanr(r[m], sb[m])
        add("cid-razao", "Cidade, 1º turno", "Spearman: razão de ganho × % sem biometria", int(m.sum()), s[0], s[1],
            "negativa: cidades com razão maior tiveram menos voto sem biometria no 1º turno")
        mm = np.isfinite(sb)
        s = stats.spearmanr(share[mm], sb[mm])
        add("cid-fatia", "Cidade, 1º turno", "Spearman: fatia do PT no ganho × % sem biometria (todas as cidades)", int(mm.sum()), s[0], s[1], "")
        s = stats.pearsonr(dentro_uf(r[m], uf[m]), dentro_uf(sb[m], uf[m]))
        add("cid-razao-uf", "Cidade, 1º turno", "Mesmo teste dentro de cada estado (postos por UF)", int(m.sum()), s[0], s[1],
            "quase nula: a maior parte da correlação nacional é diferença entre estados")
        q = np.nanquantile(sb, [0, .2, .4, .6, .8, 1])
        for i in range(5):
            k = mm & (sb >= q[i]) & (sb <= q[i + 1])
            add(f"cid-q{i + 1}", "Cidade, 1º turno", f"Quintil {i + 1} de voto sem biometria ({pc(q[i])} a {pc(q[i + 1])})", int(k.sum()),
                np.nanmedian(r[k]), None, f"razão mediana; adversário perdeu votos em {np.mean(c[k] == 'dir_perdeu') * 100:.0f}%, "
                f"conversão acima de 100% em {np.mean(fl[k] == 'pt_acima') * 100:.0f}% das cidades")
        S = [x for x in csv.DictReader(open(f"{data_dir}/seg_secoes.csv", encoding="utf-8"))
             if all(x[k] for k in ("t1_nao_biom", "t2_nao_biom", "t1_log_votos", "t2_log_votos", "t1_mesario", "t2_mesario"))]
        g = lambda k: np.array([float(x[k]) for x in S])  # noqa: E731
        v1, v2 = g("t1_log_votos"), g("t2_log_votos")
        nb1, nb2, ms1, ms2 = g("t1_nao_biom") * v1, g("t2_nao_biom") * v2, g("t1_mesario") * v1, g("t2_mesario") * v2
        sp, sd = g("pt_2t") - g("pt_1t"), g("adv_2t") - g("adv_1t")
        dnb, dbi = nb2 - nb1, (v2 - nb2) - (v1 - nb1)
        n = len(S)
        add("sec-nb", "Seção, logs 1º e 2º", "Votos sem biometria: 1º → 2º turno", n, nb2.sum() / v2.sum(), None,
            f"{pc(nb1.sum() / v1.sum())} → {pc(nb2.sum() / v2.sum())} dos votos; +{mil(dnb.sum())} votos sem biometria")
        add("sec-mes", "Seção, logs 1º e 2º", "Liberados pelo mesário: 1º → 2º turno", n, ms2.sum() / v2.sum(), None,
            f"{pc(ms1.sum() / v1.sum())} → {pc(ms2.sum() / v2.sum())} dos votos; +{mil((ms2 - ms1).sum())} votos")
        add("sec-saldo", "Seção, logs 1º e 2º", "Saldo líquido do PT nas mesmas seções", n, (sp - sd).sum(), None,
            f"PT +{mil(sp.sum())}, adversário +{mil(sd.sum())}; o aumento de votos sem biometria equivale a {dnb.sum() / (sp - sd).sum() * 100:.0f}% do saldo")
        X = np.column_stack([np.ones(n), dbi, dnb])
        bp, bd_ = np.linalg.lstsq(X, sp, rcond=None)[0], np.linalg.lstsq(X, sd, rcond=None)[0]
        add("sec-reg-pt", "Seção, logs 1º e 2º", "PT ganha por voto novo com biometria / sem biometria", n, bp[2], None,
            f"{bp[1]:.2f} com × {bp[2]:.2f} sem: o voto novo sem biometria rende ao PT o mesmo que o com biometria".replace(".", ","))
        add("sec-reg-dir", "Seção, logs 1º e 2º", "Adversário ganha por voto novo com biometria / sem biometria", n, bd_[2], None, f"{bd_[1]:.2f} com × {bd_[2]:.2f} sem".replace(".", ","))
        s = stats.spearmanr(dnb, sp - sd)
        add("sec-rho-nb", "Seção, logs 1º e 2º", "Spearman: variação de votos sem biometria × saldo do PT", n, s[0], s[1], "")
        s = stats.spearmanr(dbi, sp - sd)
        add("sec-rho-bi", "Seção, logs 1º e 2º", "Spearman: variação de votos com biometria × saldo do PT", n, s[0], s[1], "")
        ok2 = (sp > 0) & (sd > 0)
        s = stats.spearmanr(sp[ok2] / sd[ok2], (nb2 / v2 - nb1 / v1)[ok2])
        add("sec-razao", "Seção, logs 1º e 2º", "Spearman: razão de ganho × variação da taxa sem biometria", int(ok2.sum()), s[0], s[1], "")
    for nome, rows in (("razao_ganho", res), ("biometria_teste", teste), ("biometria_cidade", bio)):
        with open(f"{data_dir}/{nome}.csv", "w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=list(rows[0]))
            w.writeheader()
            w.writerows(rows)
        print(nome, len(rows))


if __name__ == "__main__":
    main()
