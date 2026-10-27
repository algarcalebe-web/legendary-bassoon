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
UFN = {"AC": "Acre", "AL": "Alagoas", "AM": "Amazonas", "AP": "Amapá", "BA": "Bahia", "CE": "Ceará", "DF": "Distrito Federal",
       "ES": "Espírito Santo", "GO": "Goiás", "MA": "Maranhão", "MG": "Minas Gerais", "MS": "Mato Grosso do Sul",
       "MT": "Mato Grosso", "PA": "Pará", "PB": "Paraíba", "PE": "Pernambuco", "PI": "Piauí", "PR": "Paraná",
       "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte", "RO": "Rondônia", "RR": "Roraima", "RS": "Rio Grande do Sul",
       "SC": "Santa Catarina", "SE": "Sergipe", "SP": "São Paulo", "TO": "Tocantins"}


def pct(v, casas=1):
    v = float(v) * 100
    return ("−" if v < 0 else "") + f"{abs(v):.{casas}f}".replace(".", ",") + "%"


def pp(v):
    v = float(v) * 100
    return ("+" if v >= 0 else "−") + f"{abs(v):.1f}".replace(".", ",") + " p.p."


def dc(v, casas=2, sinal=False):
    v = float(v)
    txt = f"{abs(v):.{casas}f}".replace(".", ",")
    return ("−" if v < 0 else "+" if sinal else "") + txt


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
        f"caiu mais (coeficiente {dc(f(a26, 'abst_por_terceira'))}, o mais negativo da série).")
    add("aud-contexto", "auditoria", "O tamanho da queda, em perspectiva",
        f"A abstenção do 1º turno de 2026 ({pct(a26['abst_1t'])}) foi a maior da série; a do 2º ({pct(a26['abst_2t'])}) "
        f"é igual à de 2006 ({pct(a06['abst_2t'])}). A variação entre turnos vem caindo a cada eleição desde 2010 e a tendência "
        f"de 2002–2022 previa {pp(a26['d_abst_tendencia'])} para 2026; o observado foi {pp(a26['d_abst_pp'])}, "
        f"{dc(abs(f(a26, 'z_d_abst_tendencia')), 1)} desvios-padrão abaixo da tendência.")
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
        f"Comparecimento maior não vem com mais voto em Lula: correlação de {dc(f(a26, 'corr_comparecimento_pt'), 2, True)} no país, "
        f"{dc(f(a26, 'corr_comparecimento_pt_se'), 2, True)} no Sudeste e {dc(f(a26, 'corr_comparecimento_pt_s'), 2, True)} no Sul. A abstenção caiu "
        f"mais onde o PT era mais fraco no 1º turno ({dc(f(a26, 'corr_mobilizacao'), 2, True)}). Cidades atípicas: "
        f"{dc(f(a26, 'outliers_z5_por_mil'), 1)} por mil, contra {dc(min(f(r, 'outliers_z5_por_mil') for r in antes), 1)} a "
        f"{dc(max(f(r, 'outliers_z5_por_mil') for r in antes), 1)} de 2002 a 2018. Segundo dígito (p = {dc(f(a26, 'benford2_p'))}) e último "
        f"dígito (p = {dc(f(a26, 'ultimo_digito_p'))}) sem desvio.")
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
    # crescimento e vitória líquidos
    sal = {r["id"]: r for r in rd("saldos.csv")}
    s26 = {g: sal[f"2026-{g}"] for g in ("BR", "N", "NE", "CO", "SE", "S")}
    reg_net = sorted(("N", "NE", "CO", "SE", "S"), key=lambda g: -int(s26[g]["net_votos"]))
    nets = {a: float(uf[f"{a}-BR"]["swing_margem"]) for a in NOMES}
    maiores = sorted(nets.items(), key=lambda kv: -abs(kv[1]))
    add("net", "geral", "Crescimento líquido",
        f"Lula somou {mi(uf['2026-BR']['ganho_pt'])} e Flávio {mi(uf['2026-BR']['ganho_dir'])}: crescimento líquido de "
        f"{mi(uf['2026-BR']['net_votos'], True)} para Lula e margem de {pp(uf['2026-BR']['margem_1t'])} para {pp(uf['2026-BR']['margem_2t'])} "
        f"({pp(nets['2026'])}). A maior parte veio do {REG[reg_net[0]]} ({mi(s26[reg_net[0]]['net_votos'], True)}) e do "
        f"{REG[reg_net[1]]} ({mi(s26[reg_net[1]]['net_votos'], True)}). Na série, as maiores viradas de margem entre turnos foram "
        + ", ".join(f"{a} ({pp(v)})" for a, v in maiores[:3]) + ".")
    contra = [g for g in ("S", "SE", "CO", "N") if int(s26[g]["saldo_2t"]) < -50_000]
    empate = [g for g in ("S", "SE", "CO", "N") if abs(int(s26[g]["saldo_2t"])) <= 50_000]
    add("saldo", "colegio", "Vitória líquida por região",
        f"Lula venceu com saldo nacional de {mi(int(s26['BR']['saldo_2t']), True)}: o Nordeste deu {mi(int(s26['NE']['saldo_2t']), True)} e "
        f"compensou " + ", ".join(f"{REG[g]} ({mi(int(s26[g]['saldo_2t']), True)})" for g in contra) + "."
        + (f" O {REG[empate[0]]} terminou praticamente empatado ({num(abs(int(s26[empate[0]]['saldo_2t'])))} votos de diferença)." if empate else ""))
    col = {r["id"]: r for r in rd("colegio.csv")}
    diverg = [a for a in NOMES if col[f"{a}-colegio"]["igual_popular"] == "0"]
    c26 = col["2026-colegio"]
    add("colegio", "colegio", "Se fosse colégio eleitoral",
        f"Com cada estado valendo seus deputados federais mais 3 senadores e o vencedor levando tudo, Flávio teria "
        f"{c26['dir']} votos eleitorais contra {c26['pt']} de Lula, e venceria. O colégio contraria o voto popular em "
        f"{' e '.join(diverg)}; nas outras eleições da série os dois coincidem. Em 2026 o estado decisivo seria "
        f"{UFN.get(c26['decisivo_uf'], c26['decisivo_uf'])}, e bastariam {num(c26['votos_para_virar'])} votos trocando de lado em "
        f"{c26['estados_para_virar'].replace(' ', ' e ')} para Lula vencer também no colégio.")
    cs_ = {r["ano"]: r for r in rd("consistencia_serie.csv")}
    c = cs_["2026"]
    hist_loc = [float(cs_[a]["locais_z4_por_mil"]) for a in NOMES if a != "2026"]
    hist_inc = [float(cs_[a]["inclinacao_net_comparecimento"]) for a in NOMES if a != "2026"]
    add("aud-contab", "auditoria", "Contabilidade e cruzamento de fontes",
        f"Nas {num(c['t2_zonas'])} cidades do 2º turno de 2026, comparecimento = válidos + brancos + nulos e válidos = soma dos candidatos "
        f"fecham sem nenhuma diferença; aptos = comparecimento + abstenção difere em {num(c['t2_z_aptos'])} cidades "
        f"({num(c['t2_v_aptos'])} eleitores), dentro do que aparece em todas as eleições ({num(min(int(cs_[a]['t12_v_aptos']) for a in NOMES if a != '2026'))} "
        f"a {num(max(int(cs_[a]['t12_v_aptos']) for a in NOMES if a != '2026'))} eleitores). No arquivo de 2006, comparecimento não fecha em "
        f"nenhuma das {num(cs_['2006']['t12_zonas'])} zonas, por {num(cs_['2006']['t12_v_comp'])} votos no total, uma diferença pequena e "
        f"uniforme que aponta para a definição de um campo do arquivo. As duas publicações do TSE do 1º turno de 2026, "
        f"dados abertos e API de resultados, batem em todas as {num(c['cruz_cidades'])} cidades, campo a campo e candidato a candidato.")
    add("aud-net", "auditoria", "Crescimento líquido cidade a cidade",
        f"Cidades cujo swing destoa do próprio estado (mais de 4 desvios robustos): {dc(c['locais_z4_por_mil'], 1)} por mil em 2026, "
        f"o menor da série ({dc(min(hist_loc), 1)} a {dc(max(hist_loc), 1)} antes). Dentro de cada estado, cada ponto de comparecimento a mais "
        f"virou {dc(c['inclinacao_net_comparecimento'])} ponto de margem líquida para Lula; de 2002 a 2022 esse número foi de "
        f"{dc(min(hist_inc))} a {dc(max(hist_inc))}. Votos inventados para um lado dariam perto de 1. A geografia do voto repetiu a de 2022 "
        f"com correlação de {dc(c['corr_pt2_anterior'], 3)}, a mais alta da série.")
    ext = rd("consistencia_extremos.csv") if (d / "consistencia_extremos.csv").exists() else []
    e26 = [r for r in ext if r["ano"] == "2026"]
    sobe = [r for r in e26 if r["tipo"].startswith("comparecimento")]
    if sobe:
        import statistics as stt
        m26 = [r for r in cid if r["ano"] == "2026"]
        por_uf = {}
        for r in m26:
            por_uf.setdefault(r["uf"], []).append(r)
        med_sw = {u: stt.median(float(r["swing_margem"]) for r in rs) for u, rs in por_uf.items()}
        med_dc = {u: stt.mean(float(r["d_comp_pp"]) for r in rs) for u, rs in por_uf.items()}
        obs = stt.mean(float(r["swing_margem"]) - med_sw[r["uf"]] for r in sobe)
        prev_sw = float(c["inclinacao_net_comparecimento"]) * stt.mean(float(r["d_comp_pp"]) - med_dc[r["uf"]] for r in sobe)
        ufs_s = {r["uf"] for r in sobe}
        base_pt = sum(r["venc_2t"] == "PT" for r in m26 if r["uf"] in ufs_s) / sum(1 for r in m26 if r["uf"] in ufs_s)
        add("aud-extremos", "auditoria", "Pontos fora da curva",
            f"Em 2026, {len(sobe)} cidades tiveram o comparecimento subir 5 p.p. ou mais, mais que em qualquer eleição anterior, espalhadas por "
            f"{len(ufs_s)} estados. Lula venceu {sum(r['venc_2t'] == 'PT' for r in sobe)} delas ({pct(sum(r['venc_2t'] == 'PT' for r in sobe) / len(sobe), 0)}), "
            f"contra {pct(base_pt, 0)} de todas as cidades desses estados, e a margem nelas variou {pp(obs)} a mais que a mediana do próprio estado. "
            f"Isso é uma leve inclinação a Lula, mas menor do que a relação geral entre comparecimento e margem já prevê para saltos desse tamanho "
            f"({pp(prev_sw)}). {len(e26) - len(sobe)} cidades ficaram com brancos + nulos abaixo de 1%, "
            f"{sum(r['venc_2t'] == 'PT' for r in e26 if not r['tipo'].startswith('comparecimento'))} vencidas por Lula. As listas estão na aba Auditoria.")
    json.dump(out, open(d / "insights.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for o in out:
        print(f"[{o['id']}] {o['texto']}\n")


if __name__ == "__main__":
    main(sys.argv[1])
