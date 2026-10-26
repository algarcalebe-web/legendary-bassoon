"""Gera data/insights.json: leituras em texto, com todos os números tirados das tabelas de data/.

Uso: python3 -I build_insights.py <data_dir>
"""
import csv
import json
import sys
from pathlib import Path

NOMES = {"2018": ("Haddad", "Bolsonaro"), "2022": ("Lula", "Bolsonaro"), "2026": ("Lula", "Flávio")}
REG = {"N": "Norte", "NE": "Nordeste", "CO": "Centro-Oeste", "SE": "Sudeste", "S": "Sul"}


def pct(v, casas=1):
    v = float(v) * 100
    return ("−" if v < 0 else "") + f"{abs(v):.{casas}f}".replace(".", ",") + "%"


def pp(v):
    v = float(v) * 100
    return ("+" if v >= 0 else "−") + f"{abs(v):.1f}".replace(".", ",") + " p.p."


def mi(v, sinal=False):
    v = float(v) / 1e6
    return ("−" if v < 0 else "+" if sinal else "") + f"{abs(v):.2f}".replace(".", ",") + " mi"


def num(v):
    return f"{int(float(v)):,}".replace(",", ".")


def main(data_dir):
    d = Path(data_dir)
    rd = lambda f: list(csv.DictReader(open(d / f, encoding="utf-8")))
    uf = {r["id"]: r for r in rd("uf.csv")}
    reg = {r["id"]: r for r in rd("regressao.csv")}
    vir = {r["id"]: r for r in rd("viradas.csv")}
    res = {r["id"]: r for r in rd("top100_resumo.csv")}
    cid = rd("cidades.csv")
    out = []

    def add(id_, tema, titulo, texto):
        out.append({"id": id_, "ordem": len(out) + 1, "tema": tema, "titulo": titulo, "texto": texto})

    for ano in ("2018", "2022", "2026"):
        b = uf[f"{ano}-BR"]
        pt, dr = NOMES[ano]
        lid1 = pt if float(b["pct_pt_1t"]) > float(b["pct_dir_1t"]) else dr
        venc = pt if b["venceu_pt"] == "1" else dr
        add(f"lede-{ano}", "lede", f"Resumo {ano}",
            f"{lid1} liderou o 1º turno e {'venceu' if lid1 == venc else venc + ' venceu'} o 2º com {pct(max(float(b['pct_pt_2t']), float(b['pct_dir_2t'])))} "
            f"dos válidos. {pt} somou {mi(b['ganho_pt'])} de votos ({pct(b['cresc_pt'])}) e {dr} {mi(b['ganho_dir'])} "
            f"({pct(b['cresc_dir'])}); {pt} ficou com {pct(b['captura_pt'])} dos votos novos do 2º turno.")

    b, b22, b18 = uf["2026-BR"], uf["2022-BR"], uf["2018-BR"]
    gap = float(b["gap_vitoria"])
    add("pool", "geral", "O pool de 2026",
        f"O 2º turno teve {mi(b['pool'])} de votos disponíveis: {mi(b['terceira_via'])} da 3ª via e {mi(b['delta'])} "
        f"de eleitores recuperados (abstenção {mi(-float(b['delta_abst']))}, brancos e nulos {mi(-float(b['delta_bn']))}). "
        f"Lula ficou com {pct(b['captura_pt'])}. Mesmo levando 100% dos recuperados, ele precisaria de pelo menos "
        f"{pct(b['x_min'])} da 3ª via, que era majoritariamente de direita.")
    add("delta", "geral", "A abstenção decidiu desta vez",
        f"O saldo de abstenção, brancos e nulos foi {mi(b18['delta'], True)} em 2018 e {mi(b22['delta'], True)} em 2022. "
        f"Em 2026 foi {mi(b['delta'], True)}, o maior das três eleições. Sem nenhum voto desse saldo, Lula precisaria de "
        f"{pct(gap / float(b['terceira_via']))} da 3ª via para vencer.")
    r = {e: reg[f"2026-{e}"] for e in REG}
    xs = sorted(r.values(), key=lambda v: float(v["x_hat"]))
    pos = [e for e in REG if float(r[e]["c_hat"]) > 0]
    neg22 = [e for e in REG if float(reg[f"2022-{e}"]["c_hat"]) < 0]
    add("regressao", "geral", "O que a regressão por cidade sugere",
        f"Nas regiões, a transferência estimada da 3ª via para Lula vai de {pct(xs[0]['x_hat'], 0)} "
        f"({xs[0]['nome']}) a {pct(xs[-1]['x_hat'], 0)} ({xs[-1]['nome']}). O termo constante é positivo em "
        f"{len(pos)} de 5 regiões: um ganho uniforme pró-Lula que nem a 3ª via nem a queda da abstenção explicam, "
        f"compatível com troca direta de eleitores de Flávio. Em 2022 o mesmo termo foi negativo em {len(neg22)} de 5 regiões.")
    v26, v22, v18 = vir["2026-BR"], vir["2022-BR"], vir["2018-BR"]
    maior = max((c for c in cid if c["ano"] == "2026" and c["virou"] == "1"), key=lambda c: int(c["aptos"]))
    add("viradas", "cidades", "Quem fecha o 2º turno leva as viradas",
        f"Em 2026, {num(v26['viradas'])} cidades trocaram de lado entre os turnos ({num(v26['viradas_para_pt'])} para Lula), "
        f"somando {mi(v26['eleitores_virados'])} de eleitores; a maior foi {maior['municipio']} ({mi(maior['aptos'])}). "
        f"Em 2022 foram {num(v22['viradas'])}, {num(v22['viradas_para_dir'])} para Bolsonaro; em 2018, "
        f"{num(v18['viradas'])}, {num(v18['viradas_para_pt'])} para Haddad.")
    add("concentracao", "cidades", "Mais votos em menos cidades",
        f"Comparado a 2022, Lula perdeu {num(v26['mudou_para_dir'])} cidades para a direita e tomou {num(v26['mudou_para_pt'])}. "
        f"Venceu o 2º turno em {num(v26['venc_pt_2t'])} municípios, contra {num(v22['venc_pt_2t'])} em 2022, "
        f"com margem nacional maior: o voto de Lula ficou mais urbano.")
    ta, tp, fa = res["2026-pt-abs"], res["2026-pt-pct"], res["2026-dir-abs"]
    add("top100", "cidades", "Top 100: tamanho e geografia",
        f"Em votos absolutos, as 100 cidades que mais deram votos novos concentram {pct(ta['pct_ganho_total'], 0)} do ganho de Lula "
        f"e {pct(fa['pct_ganho_total'], 0)} do de Flávio, e {ta['repetidas_ant']} delas já estavam no top 100 de Lula em 2022: "
        f"é tamanho de cidade. Em crescimento %, entre cidades com 10 mil+ eleitores, o top 100 de Lula tem "
        f"{tp['reg_CO']} cidades no Centro-Oeste, {tp['reg_SE']} no Sudeste e {tp['reg_NE']} no Nordeste; "
        f"só {tp['repetidas_ant']} repetem 2022.")
    go = uf["2026-GO"]
    ufs = [u for u in uf.values() if u["ano"] == "2026" and u["nivel"] == "UF" and u["uf"] != "ZZ"]
    rk_pp = 1 + sum(float(u["pp_pt"]) > float(go["pp_pt"]) for u in ufs)
    rk_dir = 1 + sum(float(u["cresc_dir"]) > float(go["cresc_dir"]) for u in ufs)
    ordinal = lambda k: "a maior" if k == 1 else f"a {k}ª maior"
    add("goias", "estados", "Goiás, a casa da 3ª via",
        f"Goiás teve {ordinal(rk_pp)} variação de Lula em pontos percentuais entre os estados ({pp(go['pp_pt'])}) e "
        f"{ordinal(rk_dir)} alta % de Flávio ({pct(go['cresc_dir'])}). A 3ª via lá foi {pct(go['pct_terceira'])} dos válidos, contra {pct(b['pct_terceira'])} no Brasil: "
        f"o maior estoque livre do país foi disputado pelos dois.")
    caiu = sorted((u for u in ufs if float(u["ganho_dir"]) < 0), key=lambda u: float(u["cresc_dir"]))
    virou = [u for u in ufs if (float(u["pct_pt_1t"]) > float(u["pct_dir_1t"])) != (float(u["pct_pt_2t"]) > float(u["pct_dir_2t"]))]
    add("estados", "estados", "Estados que mudaram de lado",
        "; ".join(f"{u['nome']} foi o único estado a virar entre os turnos: {'Flávio' if float(u['pct_dir_1t']) > float(u['pct_pt_1t']) else 'Lula'} liderou o 1º e "
                  f"{'Lula' if float(u['pct_pt_2t']) > float(u['pct_dir_2t']) else 'Flávio'} venceu o 2º" for u in virou) + ". "
        f"Flávio perdeu votos em números "
        f"absolutos no 2º turno em {len(caiu)} estados, com a maior queda em {caiu[0]['nome']} ({pct(caiu[0]['cresc_dir'])}).")
    p26, p22, p18 = vir["2026-BR"], vir["2022-BR"], vir["2018-BR"]
    regs26 = {e: vir[f"2026-{e}"] for e in REG}
    add("perdas", "cidades", "Onde os finalistas perderam votos",
        f"Em 2026, Flávio teve menos votos no 2º turno que no 1º em {num(p26['perdeu_dir'])} cidades "
        f"({num(regs26['NE']['perdeu_dir'])} no Nordeste, {num(regs26['N']['perdeu_dir'])} no Norte), somando "
        f"{num(p26['votos_perdidos_dir'])} votos; Lula perdeu em {num(p26['perdeu_pt'])}. Em 2022 o espelho: Lula perdeu em "
        f"{num(p22['perdeu_pt'])} cidades ({num(p22['votos_perdidos_pt'])} votos) e Bolsonaro em {num(p22['perdeu_dir'])}. "
        f"Em 2018, Haddad perdeu em {num(p18['perdeu_pt'])} e Bolsonaro em {num(p18['perdeu_dir'])}. Os dois perderam juntos em {num(p26['perdeu_ambos'])} "
        f"cidades em 2026, {num(regs26['N']['perdeu_ambos'])} delas no Norte, onde a abstenção subiu no 2º turno.")
    json.dump(out, open(d / "insights.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for o in out:
        print(f"[{o['id']}] {o['texto']}\n")


if __name__ == "__main__":
    main(sys.argv[1])
