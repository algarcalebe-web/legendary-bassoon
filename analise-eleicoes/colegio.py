"""Vitória líquida: o 2º turno de 2002 a 2026 contado por outras regras de agregação. Só dados do TSE.

Regras (todas pelo vencedor do 2º turno em cada unidade, o vencedor leva tudo, exceto o voto popular):
  popular      votos válidos no país (o resultado real)
  colegio      colégio eleitoral à americana: cada UF vale deputados federais eleitos + 3 senadores
  deputados    cada UF vale seus deputados federais eleitos
  estados      cada UF vale 1
  eleitorado   cada UF vale seu eleitorado apto
  regioes      cada região vale 1
  municipios   cada município vale 1
Para o colégio: estado decisivo (tipping point) e o swing uniforme que viraria o resultado (metade da margem do
estado decisivo, em pontos percentuais dos válidos: é a medida de quão perto o resultado esteve). Também o menor
número absoluto de votos que viraria — matematicamente mínimo, mas concentrado em estados pequenos com margens
grandes, então não é um cenário plausível.

Uso: python3 -I colegio.py <od_dir> <apiuf_dir> <data_dir>
"""
import csv
import io
import json
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_dataset as bd  # noqa: E402

SENADORES = 3  # por UF, fixo na Constituição


def eleito(situacao):
    """Situações de eleito no cadastro do TSE ao longo dos anos: ELEITO, ELEITO POR QP, ELEITO POR MÉDIA, MÉDIA."""
    return situacao.startswith("ELEITO") or situacao == "MÉDIA"


def deputados_por_uf(od_dir, apiuf_dir, ano):
    out = defaultdict(int)
    if ano == 2026:
        for f in Path(apiuf_dir).glob("*-6259-0006.json"):
            d = json.load(open(f, encoding="utf-8"))
            out[f.name[:2].upper()] += sum(c["st"].startswith("Eleito") for a in d["carg"][0]["agr"] for p in a["par"] for c in p["cand"])
        return out
    vistos = set()
    with zipfile.ZipFile(Path(od_dir) / f"consulta_cand_{ano}.zip") as z:
        n = next(x for x in z.namelist() if x.endswith("_BRASIL.csv"))
        for r in csv.DictReader(io.TextIOWrapper(z.open(n), encoding="latin1"), delimiter=";"):
            chave = (r["SG_UF"], r["NR_CANDIDATO"])  # SQ_CANDIDATO se repete entre UFs em anos antigos
            if r["CD_CARGO"] == "6" and eleito(r["DS_SIT_TOT_TURNO"]) and chave not in vistos:
                vistos.add(chave)
                out[r["SG_UF"]] += 1
    return out


def virar(ufs, peso, alvo):
    """Menor número de votos trocando de lado (margem // 2 + 1) nos estados do vencedor para dar ao perdedor `alvo` pesos."""
    # programação dinâmica sobre o peso: menor custo para somar pelo menos `alvo` pesos
    melhor = {0: (0, ())}
    for u in ufs:
        custo = u["margem_votos"] // 2 + 1
        for w, (c, sel) in list(melhor.items()):
            nw = min(alvo, w + peso[u["uf"]])
            if nw not in melhor or melhor[nw][0] > c + custo:
                melhor[nw] = (c + custo, sel + (u["uf"],))
    return melhor.get(alvo)


def main(od_dir, apiuf_dir, data_dir):
    d = Path(data_dir)
    uf = list(csv.DictReader(open(d / "uf.csv", encoding="utf-8")))
    vir = {r["id"]: r for r in csv.DictReader(open(d / "viradas.csv", encoding="utf-8"))}
    sistemas, estados = [], []
    for ano in bd.ANOS:
        _, pt_nome, _, adv_nome = bd.FINAIS[ano]
        dep = deputados_por_uf(od_dir, apiuf_dir, ano)
        rows = [r for r in uf if int(r["ano"]) == ano and r["nivel"] == "UF" and r["uf"] in dep]
        regs = [r for r in uf if int(r["ano"]) == ano and r["nivel"] == "REGIAO"]
        br = next(r for r in uf if int(r["ano"]) == ano and r["nivel"] == "BR")
        for r in rows:
            r["deputados"] = dep[r["uf"]]
            r["venc"] = "PT" if int(r["pt_2t"]) > int(r["dir_2t"]) else "DIR"
            r["margem_votos"] = abs(int(r["pt_2t"]) - int(r["dir_2t"]))
        pesos = {
            "colegio": {r["uf"]: r["deputados"] + SENADORES for r in rows},
            "deputados": {r["uf"]: r["deputados"] for r in rows},
            "estados": {r["uf"]: 1 for r in rows},
            "eleitorado": {r["uf"]: int(r["aptos"]) for r in rows},
        }
        venc_pop = "PT" if int(br["pt_2t"]) > int(br["dir_2t"]) else "DIR"
        linhas = [{"sistema": "popular", "pt": int(br["pt_2t"]), "dir": int(br["dir_2t"])}]
        for s, p in pesos.items():
            linhas.append({"sistema": s, "pt": sum(p[r["uf"]] for r in rows if r["venc"] == "PT"),
                           "dir": sum(p[r["uf"]] for r in rows if r["venc"] == "DIR")})
        linhas.append({"sistema": "regioes", "pt": sum(int(r["pt_2t"]) > int(r["dir_2t"]) for r in regs),
                       "dir": sum(int(r["dir_2t"]) > int(r["pt_2t"]) for r in regs)})
        v = vir[f"{ano}-BR"]
        linhas.append({"sistema": "municipios", "pt": int(v["venc_pt_2t"]), "dir": int(v["venc_dir_2t"])})
        for l in linhas:
            tot = l["pt"] + l["dir"]
            l.update({"id": f"{ano}-{l['sistema']}", "ano": ano, "pt_nome": pt_nome, "adv_nome": adv_nome, "total": tot,
                      "maioria": tot // 2 + 1, "pct_pt": l["pt"] / tot if tot else None,
                      "vencedor": "PT" if l["pt"] > l["dir"] else "DIR" if l["dir"] > l["pt"] else "EMP",
                      "igual_popular": int(("PT" if l["pt"] > l["dir"] else "DIR") == venc_pop)})
        # colégio: estado decisivo e votos para virar
        col = next(l for l in linhas if l["sistema"] == "colegio")
        venc = col["vencedor"]
        p = pesos["colegio"]
        ordem = sorted(rows, key=lambda r: (1 if r["venc"] == venc else -1) * r["margem_votos"] / int(r["validos_2t"]))
        acum, decisivo = 0, None
        for r in reversed(ordem):  # do estado mais seguro do vencedor para o menos seguro
            if r["venc"] != venc:
                continue
            acum += p[r["uf"]]
            if acum >= col["maioria"]:
                decisivo = r
                break
        perdedor_tem = col["pt"] if venc == "DIR" else col["dir"]
        res = virar([r for r in rows if r["venc"] == venc], p, col["maioria"] - perdedor_tem)
        m_dec = abs(float(decisivo["margem_2t"])) if decisivo else None
        cairiam = sorted((r for r in rows if r["venc"] == venc and abs(float(r["margem_2t"])) <= m_dec),
                         key=lambda r: abs(float(r["margem_2t"]))) if decisivo else []
        col.update({"decisivo_uf": decisivo["uf"] if decisivo else "",
                    "decisivo_margem_pp": m_dec,
                    "swing_para_virar_pp": m_dec / 2 if decisivo else None,
                    "swing_popular_pp": abs(int(br["pt_2t"]) - int(br["dir_2t"])) / int(br["validos_2t"]) / 2,
                    "estados_swing": " ".join(r["uf"] for r in cairiam),
                    "eleitores_swing": round(m_dec / 2 * int(br["validos_2t"])) if decisivo else None,
                    "votos_para_virar": res[0] if res else None, "estados_para_virar": " ".join(sorted(res[1])) if res else "",
                    "pct_validos_para_virar": res[0] / int(br["validos_2t"]) if res else None})
        sistemas += linhas
        ordem_v = {r["uf"]: i for i, r in enumerate(sorted((r for r in rows if r["venc"] == venc),
                                                           key=lambda r: abs(float(r["margem_2t"]))), 1)}
        for r in rows:
            estados.append({"id": f"{ano}-{r['uf']}", "ano": ano, "uf": r["uf"], "nome": r["nome"], "regiao": r["regiao"],
                            "deputados": r["deputados"], "peso_colegio": p[r["uf"]], "venc_2t": r["venc"],
                            "pt_2t": int(r["pt_2t"]), "dir_2t": int(r["dir_2t"]), "margem_votos": r["margem_votos"],
                            "margem_2t": float(r["margem_2t"]), "margem_1t": float(r["margem_1t"]),
                            "net_votos": int(r["net_votos"]), "swing_margem": float(r["swing_margem"]),
                            "votos_para_virar": r["margem_votos"] // 2 + 1,
                            "swing_para_virar_pp": abs(float(r["margem_2t"])) / 2,
                            "ordem_swing": ordem_v.get(r["uf"]),
                            "decisivo": int(bool(decisivo) and r["uf"] == decisivo["uf"])})
        print(ano, {l["sistema"]: f"{l['pt']}x{l['dir']}" for l in linhas}, "decisivo", col["decisivo_uf"],
              "swing", col["swing_para_virar_pp"], col["estados_swing"], "| mínimo absoluto", col["votos_para_virar"],
              col["estados_para_virar"])
    # vitória líquida: saldo (PT − adversário) de cada unidade e quanto ela contribui para o saldo nacional;
    # crescimento líquido = saldo do 2º turno − saldo do 1º turno
    saldos = []
    for ano in bd.ANOS:
        br = next(r for r in uf if int(r["ano"]) == ano and r["nivel"] == "BR")
        nac = int(br["pt_2t"]) - int(br["dir_2t"])
        for r in (x for x in uf if int(x["ano"]) == ano and x["uf"] not in ("ZZ", "VT")):
            s1 = int(r["pt_1t"]) - int(r["dir_1t"])
            s2 = int(r["pt_2t"]) - int(r["dir_2t"])
            saldos.append({"id": f"{ano}-{r['uf']}", "ano": ano, "nivel": r["nivel"], "uf": r["uf"], "nome": r["nome"],
                           "regiao": r["regiao"], "saldo_1t": s1, "saldo_2t": s2, "net_votos": s2 - s1,
                           "margem_1t": float(r["margem_1t"]), "margem_2t": float(r["margem_2t"]),
                           "swing_margem": float(r["swing_margem"]), "contrib_pct": s2 / nac if nac else None,
                           "contrib_net_pct": (s2 - s1) / (int(br["net_votos"])) if int(br["net_votos"]) else None,
                           "venc_2t": "PT" if s2 > 0 else "DIR" if s2 < 0 else "EMP"})
    bd.write_csv(d / "saldos.csv", saldos)
    bd.write_csv(d / "colegio.csv", sistemas)
    bd.write_csv(d / "colegio_uf.csv", estados)


if __name__ == "__main__":
    main(*sys.argv[1:4])
