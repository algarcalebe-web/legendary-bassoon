"""Gera data/insights.json: leituras em texto, com todos os números tirados das tabelas de data/.

Uso: python3 -I build_insights.py <data_dir>
"""
import csv
import json
import sys
from pathlib import Path

NOMES = {"2002": ("Lula", "Serra"), "2006": ("Lula", "Alckmin"), "2010": ("Dilma", "Serra"), "2014": ("Dilma", "Aécio"),
         "2018": ("Haddad", "Bolsonaro"), "2022": ("Lula", "Bolsonaro"), "2026": ("Lula", "Flávio")}
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
    cid = [r for a in NOMES for r in rd(f"mapa_{a}.csv")]
    out = []

    def add(id_, tema, titulo, texto):
        out.append({"id": id_, "ordem": len(out) + 1, "tema": tema, "titulo": titulo, "texto": texto})

    for ano in NOMES:
        b = uf[f"{ano}-BR"]
        pt, dr = NOMES[ano]
        lid1 = pt if float(b["pct_pt_1t"]) > float(b["pct_dir_1t"]) else dr
        venc = pt if b["venceu_pt"] == "1" else dr
        add(f"lede-{ano}", "lede", f"Resumo {ano}",
            f"{lid1} liderou o 1º turno e {'venceu' if lid1 == venc else venc + ' venceu'} o 2º com {pct(max(float(b['pct_pt_2t']), float(b['pct_dir_2t'])))} "
            f"dos válidos. {pt} somou {mi(b['ganho_pt'])} de votos ({pct(b['cresc_pt'])}) e {dr} {mi(b['ganho_dir'])} "
            f"({pct(b['cresc_dir'])}); " + (f"{pt} ficou com {pct(b['captura_pt'])} dos votos novos do 2º turno." if 0 <= float(b['captura_pt']) <= 1
            else f"{dr if float(b['ganho_dir']) < 0 else pt} perdeu votos entre os turnos."))

    b, b22, b18 = uf["2026-BR"], uf["2022-BR"], uf["2018-BR"]
    gap = float(b["gap_vitoria"])
    add("pool", "geral", "O pool de 2026",
        f"O 2º turno teve {mi(b['pool'])} de votos disponíveis: {mi(b['terceira_via'])} da 3ª via e {mi(b['delta'])} "
        f"de eleitores recuperados (abstenção {mi(-float(b['delta_abst']))}, brancos e nulos {mi(-float(b['delta_bn']))}). "
        f"Lula ficou com {pct(b['captura_pt'])}. Mesmo levando 100% dos recuperados, ele precisaria de pelo menos "
        f"{pct(b['x_min'])} da 3ª via.")
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
    por = {r["id"]: r for r in rd("porte.csv")}
    k = lambda ano, n: por[f"{ano}-BR-{n}"]
    caps = [float(k("2026", n)["captura_pt"]) for n in "12345"]
    add("porte", "porte", "Porte: a mesma regra em toda cidade, efeito maior nas grandes",
        f"Em 2026, a fatia de Lula nos votos novos ficou entre {pct(min(caps), 0)} e {pct(max(caps), 0)} em todos os portes. "
        f"Como as cidades grandes tinham mais 3ª via ({pct(k('2026', '5')['pct_terceira'])} dos válidos acima de 1 milhão de eleitores, "
        f"contra {pct(k('2026', '1')['pct_terceira'])} até 10 mil) e mais eleitores recuperados, a variação de Lula foi de "
        f"{pp(k('2026', '1')['pp_pt'])} nas menores a {pp(k('2026', '5')['pp_pt'])} nas maiores. Já as viradas ficaram nas pequenas: "
        f"{k('2026', '1')['viradas_pt']} das {v26['viradas_para_pt']} cidades viradas para Lula têm até 10 mil eleitores.")
    au = {r["ano"]: r for r in rd("auditoria_serie.csv")}
    a26, a22, a06 = au["2026"], au["2022"], au["2006"]
    antes = [au[a] for a in ("2002", "2006", "2010", "2014", "2018")]
    f = lambda r, k: float(r[k])
    rng = lambda k: (min(f(r, k) for r in antes), max(f(r, k) for r in antes))
    hist_anos = [au[a] for a in ("2002", "2006", "2010", "2014", "2018", "2022")]
    max_delta_ant = max(hist_anos, key=lambda r: f(r, "delta_pct"))
    min_bn2_ant = min(hist_anos, key=lambda r: f(r, "bn_2t"))
    add("aud-veredito", "auditoria", "Veredito dos dados",
        f"2026 tem uma mobilização entre turnos sem precedente na série 2002–2026: a abstenção caiu em "
        f"{pct(a26['pct_cid_abst_caiu'], 0)} das cidades e abstenção e brancos+nulos caíram juntos em "
        f"{pct(a26['pct_cid_ambos_caiu'], 0)}. Nenhum dos testes forenses possíveis com dados municipais aponta anomalia: "
        f"cidades atípicas, relação entre comparecimento e voto e distribuição de dígitos ficam dentro do histórico. "
        f"Um crescimento do PT generalizado entre turnos já ocorreu em 2006.")
    add("aud-novo", "auditoria", "O que é inédito",
        f"Saldo recuperado de {pct(a26['delta_pct'])} do eleitorado, contra no máximo {pct(max_delta_ant['delta_pct'])} antes "
        f"({max_delta_ant['ano']}). Brancos+nulos no 2º turno em {pct(a26['bn_2t'])}, o menor da série (antes, mínimo de "
        f"{pct(min_bn2_ant['bn_2t'])} em {min_bn2_ant['ano']}). Abstenção caindo entre turnos em {pct(a26['pct_cid_abst_caiu'], 0)} "
        f"das cidades; em 2022 foram {pct(a22['pct_cid_abst_caiu'], 0)} e, de 2002 a 2018, entre "
        f"{pct(rng('pct_cid_abst_caiu')[0], 0)} e {pct(rng('pct_cid_abst_caiu')[1], 0)}. Onde a 3ª via era maior a abstenção "
        f"caiu mais (coeficiente {f(a26, 'abst_por_terceira'):.2f}, o mais negativo da série).".replace(".", ",", 0))
    add("aud-contexto", "auditoria", "O tamanho da queda, em perspectiva",
        f"A abstenção do 1º turno de 2026 ({pct(a26['abst_1t'])}) foi a maior da série; a do 2º ({pct(a26['abst_2t'])}) "
        f"é igual à de 2006 ({pct(a06['abst_2t'])}). A variação entre turnos vem caindo a cada eleição desde 2010 e a tendência "
        f"de 2002–2022 previa {pp(a26['d_abst_tendencia'])} para 2026; o observado foi {pp(a26['d_abst_pp'])}, "
        f"{abs(f(a26, 'z_d_abst_tendencia')):.1f} desvios-padrão abaixo da tendência.".replace("1.", "1,").replace("2.", "2,"))
    add("aud-nao-inedito", "auditoria", "O que não é inédito",
        f"Brancos+nulos caírem entre turnos é a regra: aconteceu em {pct(rng('pct_cid_bn_caiu')[0], 0)} a "
        f"{pct(rng('pct_cid_bn_caiu')[1], 0)} das cidades de 2002 a 2018 (exceção: 2018) e em {pct(a26['pct_cid_bn_caiu'], 0)} em 2026. "
        f"A fatia líquida da 3ª via que virou branco ou nulo em 2026 ({pct(a26['bn_por_terceira'], 0)}) está dentro da faixa "
        f"histórica ({pct(min(f(r, 'bn_por_terceira') for r in hist_anos), 0)} a {pct(max(f(r, 'bn_por_terceira') for r in hist_anos), 0)}).")
    add("aud-generalizado", "auditoria", "Crescimento generalizado tem precedente",
        f"Lula ganhou fatia do voto em {pct(a26['pct_cid_swing_pt'], 0)} das cidades em 2026; em 2006, em {pct(a06['pct_cid_swing_pt'], 0)}. "
        f"Em 2006 o adversário perdeu {num(a06['adv_votos_perdidos'])} votos em {num(a06['adv_perdeu_cidades'])} cidades; em 2026, "
        f"{num(a26['adv_votos_perdidos'])} em {num(a26['adv_perdeu_cidades'])}. A dispersão do swing entre cidades foi de "
        f"{pp(a26['sd_swing']).lstrip('+')} em 2026 e {pp(a22['sd_swing']).lstrip('+')} em 2022, contra "
        f"{pp(min(f(r, 'sd_swing') for r in antes)).lstrip('+')} a {pp(max(f(r, 'sd_swing') for r in antes)).lstrip('+')} até 2018: "
        f"swing uniforme é marca das duas últimas eleições, não só de 2026.")
    add("aud-forense", "auditoria", "Testes forenses",
        f"Comparecimento maior não vem com mais voto em Lula: correlação de {f(a26, 'corr_comparecimento_pt'):+.2f} no país, "
        f"{f(a26, 'corr_comparecimento_pt_se'):+.2f} no Sudeste e {f(a26, 'corr_comparecimento_pt_s'):+.2f} no Sul. A abstenção caiu "
        f"mais onde o PT era mais fraco no 1º turno ({f(a26, 'corr_mobilizacao'):+.2f}). Cidades atípicas: "
        f"{f(a26, 'outliers_z5_por_mil'):.1f} por mil, contra {min(f(r, 'outliers_z5_por_mil') for r in antes):.1f} a "
        f"{max(f(r, 'outliers_z5_por_mil') for r in antes):.1f} de 2002 a 2018. Segundo dígito (p = {f(a26, 'benford2_p'):.2f}) e último "
        f"dígito (p = {f(a26, 'ultimo_digito_p'):.2f}) sem desvio.".replace(".", ","). replace(", Cidades", ". Cidades"))
    add("aud-separar", "auditoria", "O que os dados não separam",
        f"A regressão por cidade estima que {pct(a26['x_hat'], 0)} da 3ª via foi para Lula (menor da série) e {pct(a26['y_hat'], 0)} "
        f"do saldo recuperado, mais um ganho uniforme de {pp(a26['c_hat']).replace(' p.p.', '')} p.p. do eleitorado (2006: "
        f"{pp(a06['c_hat']).replace(' p.p.', '')}). Em {num(a26['cid_pt_acima_pool'])} cidades Lula ganhou mais que toda a 3ª via "
        f"somada ao saldo: ali eleitores de Flávio no 1º turno necessariamente saíram. Quando o saldo é parecido em todas as cidades, "
        f"os dados municipais não distinguem eleitor recuperado de eleitor que trocou de lado.")
    add("aud-limites", "auditoria", "Limite desta auditoria",
        "Dados por município não detectam alteração localizada em seções. O teste definitivo compara cada boletim de urna "
        "com a totalização e repete estes testes por seção; os dados abertos do 2º turno de 2026 por seção ainda não estavam "
        "publicados quando esta análise foi feita.")
    vb = {a: vir[f"{a}-BR"] for a in NOMES}
    iv = lambda a, k: int(float(vb[a][k]))
    add("aud-perdas", "auditoria", "Perdas e conversões entre turnos, 2002–2026",
        f"Flávio teve menos votos no 2º turno que no 1º em {num(iv('2026', 'perdeu_dir'))} cidades ({num(iv('2026', 'votos_perdidos_dir'))} votos); "
        f"em {num(iv('2026', 'perda_dir_saldo_pos'))} delas o comparecimento válido subiu, então a perda não vem de gente deixando de votar. "
        f"Lula ganhou mais que toda a 3ª via somada ao saldo recuperado em {num(iv('2026', 'pt_acima_pool'))} cidades, o que só fecha com "
        f"eleitor trocando de lado. Em 2006 os números foram {num(iv('2006', 'perdeu_dir'))} cidades com perda de Alckmin "
        f"({num(iv('2006', 'votos_perdidos_dir'))} votos), {num(iv('2006', 'perda_dir_saldo_pos'))} com saldo positivo e {num(iv('2006', 'pt_acima_pool'))} "
        f"acima do pool. O lado contrário também aparece: o PT perdeu votos em {num(iv('2010', 'perdeu_pt'))} cidades em 2010 e "
        f"{num(iv('2022', 'perdeu_pt'))} em 2022, e o adversário superou o pool em {num(iv('2010', 'dir_acima_pool'))} (2010), "
        f"{num(iv('2014', 'dir_acima_pool'))} (2014) e {num(iv('2022', 'dir_acima_pool'))} (2022) cidades.")
    el = {r["id"]: r for r in rd("eleitores_3a_via.csv")}
    bc = {r["id"]: r for r in rd("bancadas.csv")}
    e26, e22, e18, e14 = el["2026-terceira"], el["2022-terceira"], el["2018-terceira"], el["2014-terceira"]
    apoio_adv = [r for r in bc.values() if r["ano"] == "2026" and r["apoio_2t"] == "ADV" and r["grupo"].startswith("C")]
    dep_apoio = sum(int(r["deputados"]) for r in apoio_adv)
    sen_apoio = sum(int(r["senadores"]) for r in apoio_adv)
    gov_apoio = sum(int(r["governadores"]) for r in apoio_adv)
    pct_apoio = sum(float(r["pct_pres_1t"]) for r in apoio_adv)
    terc26 = float(uf["2026-BR"]["pct_terceira"])
    t_lo = min(f(e26, "transf_pt"), f(e26, "transf_pt_alt"))
    t_hi = max(f(e26, "transf_pt"), f(e26, "transf_pt_alt"))
    t22_lo = min(f(e22, "transf_pt"), f(e22, "transf_pt_alt"))
    t22_hi = max(f(e22, "transf_pt"), f(e22, "transf_pt_alt"))
    add("aud-3via", "auditoria", "A 3ª via de 2026 e para onde ela foi",
        f"Os candidatos que declararam apoio a Flávio somaram {pct(pct_apoio)} dos válidos ({pct(pct_apoio / terc26, 0)} da 3ª via) e seus partidos "
        f"elegeram {num(dep_apoio)} deputados, {num(sen_apoio)} senadores e {num(gov_apoio)} governadores. Pelos dados, só "
        f"{pct(e26['origem_pt'], 0)} dos eleitores da 3ª via vinham do voto em Lula em 2022, e seus votos estavam em cidades "
        f"{pct(e26['pos_prev'], 0)} do caminho entre o eleitorado de Flávio (0%) e o de Lula (100%). Mesmo assim, Lula levou "
        f"entre {pct(t_lo, 0)} e {pct(t_hi, 0)} dessa 3ª via, conforme o modelo. Em 2022, com a 3ª via apoiando Lula, ela também "
        f"estava em cidades próximas do eleitorado de Bolsonaro ({pct(e22['pos_prev'], 0)}) e Lula levou entre {pct(t22_lo, 0)} e {pct(t22_hi, 0)}: "
        f"o apoio formal mudou de lado, a transferência ficou parecida.")
    add("aud-conversao", "auditoria", "Conversão da 3ª via comparada ao histórico",
        f"Conversão = fatia da 3ª via que foi ao PT no 2º turno menos a fatia que tinha votado no PT na eleição anterior. "
        f"2026: {pp(f(e26, 'transf_pt') - f(e26, 'origem_pt'))} (ou {pp(f(e26, 'transf_pt_alt') - f(e26, 'origem_pt'))} no modelo alternativo). "
        f"2018: {pp(f(e18, 'transf_pt') - f(e18, 'origem_pt'))}; 2014: {pp(f(e14, 'transf_pt') - f(e14, 'origem_pt'))} Movimentos dessa ordem, "
        f"para os dois lados, aparecem em outras eleições; 2026 está entre os maiores a favor do PT, ao lado de 2018.")
    json.dump(out, open(d / "insights.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for o in out:
        print(f"[{o['id']}] {o['texto']}\n")


if __name__ == "__main__":
    main(sys.argv[1])
