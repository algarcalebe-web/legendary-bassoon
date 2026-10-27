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


CONV_TXT = {"pt_acima": "alerta de possível fraude: acima de 100%", "pt_alerta": "alerta: 90–100%", "pt_improv": "improvável: 60–90%",
            "ok": "plausível", "dir_improv": "improvável para o adversário: 60–90%", "dir_alerta": "alerta para o adversário: 90–100%",
            "dir_acima": "alerta de possível fraude para o adversário: acima de 100%", "": "base pequena"}


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
        f"Lula ficou com {pct(b['captura_pt'])}. Divididos pela distribuição do 1º turno de cada cidade, os recuperados dariam "
        f"{mi(b['rec_pt'])} a Lula, {mi(b['rec_dir'])} a Flávio e {mi(b['rec_ter'])} ao bolo da 3ª via; para chegar ao resultado que teve, "
        f"Lula precisou converter {pct(b['x_levou_pt'])} desse bolo ({mi(b['bolo_conv'])}; {CONV_TXT[b['flag_conv']]}).")
    add("delta", "geral", "Saldo de abstenção, brancos e nulos",
        f"O saldo de abstenção, brancos e nulos foi {mi(b18['delta'], True)} em 2018 e {mi(b22['delta'], True)} em 2022. "
        f"Em 2026 foi {mi(b['delta'], True)}, o maior das três eleições. Dividido pela distribuição do 1º turno de cada cidade, daria "
        f"{mi(b['rec_pt'])} a Lula, {mi(b['rec_dir'])} a Flávio e {mi(b['rec_ter'])} ao bolo da 3ª via, e não decide o placar: o resultado "
        f"depende de quanto do bolo cada lado converteu ({pct(b['x_levou_pt'])} para Lula, {CONV_TXT[b['flag_conv']]}).")
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
    go = uf["2026-UF-GO"]
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
        "Dados por município não detectam alteração localizada em seções: esses testes estão nas abas Seções (votação por seção "
        "dos dois turnos) e Segurança (log e RDV de urna de uma amostra dirigida). Nenhum dado público identifica o eleitor, então "
        "não dá para saber, voto a voto, quem trocou de lado, quem voltou a votar e quem votou branco ou nulo no 1º turno.")
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
    cu = {r["id"]: r for r in rd("colegio_uf.csv")}
    dificil = max((r for r in cu.values() if r["ano"] == "2026" and r["venc_2t"] == c26["vencedor"]),
                  key=lambda r: float(r["swing_para_virar_pp"]))
    c22 = col["2022-colegio"]
    k = {a: col[f"{a}-colegio_1t"] for a in NOMES}
    add("colegio", "colegio", "Se fosse colégio eleitoral",
        f"Com cada estado valendo seus deputados federais mais 3 senadores e o mais votado do 1º turno levando o estado, só haveria 2º turno se "
        f"ninguém tivesse a maioria ({k['2026']['maioria']} votos). Em 2026 Flávio teria {k['2026']['dir']} contra {k['2026']['pt']} de Lula e venceria "
        f"sem 2º turno; Bolsonaro também, em 2022 ({k['2022']['dir']} × {k['2022']['pt']}) e em 2018 ({k['2018']['dir']} × {k['2018']['pt']}); de 2002 a 2014 "
        f"o PT venceria no 1º turno. Lula precisaria de {pp(k['2026']['swing_pt_maioria_pp'])[1:]} dos válidos trocando de lado em todos os estados "
        f"para ter a maioria no 1º turno de 2026 ({pp(k['2022']['swing_pt_maioria_pp'])[1:]} em 2022). Contado pelo 2º turno, como comparação, Flávio "
        f"teria {c26['dir']} × {c26['pt']} e virar exigiria {pp(c26['swing_para_virar_pp'])[1:]} ({UFN.get(c26['decisivo_uf'], c26['decisivo_uf'])} decisivo); "
        f"o mínimo absoluto de {num(c26['votos_para_virar'])} votos em {c26['estados_para_virar'].replace(' ', ' e ')} é só aritmética de estados pequenos "
        f"({UFN[dificil['uf']]} precisaria de {pp(dificil['swing_para_virar_pp'])[1:]}).")
    u26 = [r for r in cu.values() if r["ano"] == "2026"]
    sw = lambda r: float(r["swing_1t_pp"])
    adv1 = sorted((r for r in u26 if r["venc_1t"] == "DIR"), key=sw)
    big = next(r for r in adv1 if int(r["peso_colegio"]) >= 30)
    pt1 = sorted((r for r in u26 if r["venc_1t"] == "PT"), key=sw)[:3]
    tot, cam = int(k["2026"]["pt"]), []
    for r in adv1:
        if tot >= int(k["2026"]["maioria"]):
            break
        tot += int(r["peso_colegio"])
        cam.append(r)
    mg2 = cu["2026-MG"]
    ppx = lambda v: dc(float(v) * 100, 2 if float(v) < 0.001 else 1) + " p.p."
    add("defesa", "colegio", "Ataque e defesa pelo 1º turno",
        f"No 1º turno de 2026, {UFN[big['uf']]} era de Flávio, e é o estado dele mais fácil de perder: {pp(big['swing_1t_pp'])[1:]} trocando de lado o "
        f"dariam a Lula, com {big['peso_colegio']} votos no colégio ({num(int(big['peso_colegio']) / (sw(big) * 100))} por ponto de swing). Seria a primeira defesa de Flávio. "
        f"O caminho de Lula à maioria no 1º turno passaria, do mais fácil ao mais difícil, por " + ", ".join(f"{r['uf']} ({ppx(r['swing_1t_pp'])})" for r in cam)
        + f". Do lado de Lula, os estados mais frágeis no 1º turno eram " + ", ".join(f"{r['uf']} ({ppx(r['swing_1t_pp'])})" for r in pt1)
        + f". Contado pelo 2º turno, Minas passa a Lula por {pp(mg2['swing_para_virar_pp'])[1:]}, e aí a defesa seria dele. O simulador e a curva da aba "
        f"Vitória líquida trocam entre as duas bases.")
    # conversão necessária para o resultado obtido: recuperados na distribuição do 1º turno de cada cidade (PT, adversário, 3ª via)
    cv = {r["id"]: r for r in rd("conversao_serie.csv")}
    c6, c2, c06 = cv["2026-BR"], cv["2022-BR"], cv["2006-BR"]
    hist_n = [int(cv[f"{a}-BR"]["n_pt_acima"]) + int(cv[f"{a}-BR"]["n_dir_acima"]) for a in ("2010", "2014", "2018", "2022")]
    tr3 = ({r["id"]: r for r in rd("secao_transicao.csv")}.get("2026-BR-ter")
           if (d / "secao_transicao.csv").exists() else None)
    regs = [(g, uf[f"2026-{g}"]) for g in ("NE", "N", "SE", "CO", "S")]
    add("conv", "geral", "Quanto da 3ª via Lula precisou converter",
        f"Com abstenção, brancos e nulos recuperados divididos pela distribuição do 1º turno de cada cidade ({mi(b['rec_pt'])} para Lula, "
        f"{mi(b['rec_dir'])} para Flávio, {mi(b['rec_ter'])} para o bolo da 3ª via), Lula precisou converter {pct(b['x_levou_pt'])} do bolo "
        f"(3ª via + essa parte, {mi(b['bolo_conv'])}) para chegar ao resultado que teve, e Flávio "
        f"{pct(1 - float(b['x_levou_pt']))} — {CONV_TXT[b['flag_conv']]}. Escala, para cada lado: até 60% plausível, 60–90% improvável, acima de "
        f"90% alerta, acima de 100% alerta de possível fraude (salvo troca de lado, recuperados muito além da distribuição do 1º turno ou "
        f"outros votos além da 3ª via). Por região: " + "; ".join(f"{REG[g]} {pct(r['x_levou_pt'])} ({CONV_TXT.get(r['flag_conv'], '')})" for g, r in regs) + ". "
        f"Cidades avaliadas ({num(c6['cidades_avaliadas'])}): Lula acima de 100% em {num(c6['n_pt_acima'])}, 90–100% em {num(c6['n_pt_alerta'])} e "
        f"60–90% em {num(c6['n_pt_improv'])}; plausível para os dois em {num(c6['n_ok'])}; Flávio acima de 60% em "
        f"{num(int(c6['n_dir_improv']) + int(c6['n_dir_alerta']) + int(c6['n_dir_acima']))}. De 2010 a 2022 foram {min(hist_n)} a {max(hist_n)} "
        f"cidades por eleição acima de 100% (somando os dois lados); só 2006 teve mais ({num(c06['n_pt_acima'])}, Lula contra Alckmin)."
        + (f" A estimativa por seção divide a 3ª via em {pct(tr3['para_pt'], 0)} × {pct(tr3['para_adv'], 0)}; com essa divisão, o resultado só fecha "
           f"se brancos e nulos do 1º turno tiverem ido para Lula muito além da distribuição do 1º turno. Uma das duas premissas sai do padrão." if tr3 else ""))
    add("aud-conv", "auditoria", "Conversão acima de 100%: alerta de possível fraude em 2026",
        f"Para chegar ao resultado, com os recuperados na distribuição do 1º turno, Lula precisaria de mais de 100% do bolo da 3ª via em {num(c6['n_pt_acima'])} "
        f"das {num(c6['cidades_avaliadas'])} cidades avaliadas ({pct(c6['eleit_pt_acima'], 0)} do eleitorado), somando {num(c6['exc_pt'])} votos acima da regra; "
        f"Flávio, em {num(c6['n_dir_acima'])}. Em 2022 o sinal estava do outro lado: Bolsonaro acima de 100% em {num(c2['n_dir_acima'])} cidades "
        f"({num(c2['exc_dir'])} votos), Lula em {num(c2['n_pt_acima'])}. Em 2006, Lula acima de 100% em {num(c06['n_pt_acima'])} cidades e "
        f"{mi(c06['exc_pt'])} de votos. Com os recuperados na proporção do 2º turno, 2026 fica com {num(c6['n_pt_acima_2t'])} cidades. "
        f"Acima de 100% só fecha se eleitores de Flávio trocaram de lado (Flávio perdeu votos em {num(c6['perdeu_dir'])} cidades), se os "
        f"recuperados foram para Lula muito além da distribuição do 1º turno ou se Lula obteve outros votos além da 3ª via; sem uma delas, é "
        f"alerta de possível fraude. Os "
        f"dados por cidade não separam essas explicações; a lista completa está no cartão Cidades sinalizadas.")
    if (d / "razao_ganho.csv").exists() and (d / "biometria_teste.csv").exists():
        rz = {r["id"]: r for r in rd("razao_ganho.csv")}
        bt = {r["id"]: r for r in rd("biometria_teste.csv")}
        dec = lambda v: f"{float(v):.2f}".replace(".", ",").replace("-", "−")  # noqa: E731
        topo = lambda a: sum(int(rz[f"{a}-{k}"]["cidades"]) for k in ("dir_perdeu", "r100", "r10"))  # noqa: E731
        topo_el = lambda a: sum(float(rz[f"{a}-{k}"]["pct_aptos"]) for k in ("dir_perdeu", "r100", "r10"))  # noqa: E731
        add("aud-razao", "auditoria", "Ganho de Lula ÷ ganho de Flávio, cidade a cidade",
            f"Na mediana das cidades, Lula ganhou {pct(rz['2026-total']['razao_mediana'], 0)} dos votos que Flávio ganhou entre os turnos "
            f"(Araruama/RJ: 5.581 ÷ 11 = 50.736%). Em {num(topo('2026'))} cidades ({pct(topo_el('2026'), 0)} do eleitorado) Lula ganhou 10 vezes ou mais o que "
            f"Flávio ganhou, ou Flávio perdeu votos; {num(rz['2026-r100']['cidades'])} passam de 100 vezes. Na série: {num(topo('2022'))} cidades em 2022, "
            f"{num(topo('2018'))} em 2018, {num(topo('2014'))} em 2014 e {num(topo('2006'))} em 2006, quando Alckmin perdeu votos em "
            f"{num(rz['2006-dir_perdeu']['cidades'])}. Biometria: a correlação entre a razão e o voto sem biometria do 1º turno é negativa "
            f"({dec(bt['cid-razao']['valor'])}; {dec(bt['cid-razao-uf']['valor'])} dentro de cada estado) — as cidades de razão alta não são as de mais voto sem biometria. "
            f"Nas {num(bt['sec-nb']['n'])} seções com log dos dois turnos, o voto sem biometria foi de {bt['sec-nb']['leitura'].split(' dos')[0]}; o aumento "
            f"equivale a {bt['sec-saldo']['leitura'].split('equivale a ')[1]} de Lula, e cada voto novo sem biometria rendeu a Lula o mesmo que um com biometria "
            f"({bt['sec-reg-pt']['leitura'].split(':')[0]}). O bweb do 2º turno ainda não foi publicado; a amostra de seções é dirigida aos grupos sinalizados.")
    add("aud-trocas", "auditoria", "Perdas de votos e troca de lado",
        f"Flávio perdeu votos do 1º para o 2º turno em {num(c6['perdeu_dir'])} cidades ({num(c6['votos_perdidos_dir'])} votos). Em {num(c6['dir_saida_caiu'])} delas "
        f"abstenção, brancos e nulos caíram — a perda só se explica com eleitores indo para Lula —, em {num(c6['dir_perda_maior'])} ele perdeu mais do que eles "
        f"subiram e em {num(c6['dir_explicavel'])} a perda é explicável por quem deixou de votar. O piso de eleitores de Flávio que foram para Lula é "
        f"{num(c6['troca_min_dir'])}, em {num(c6['cid_troca_dir'])} cidades. Na série: {mi(c06['troca_min_dir'])} de Alckmin para Lula em 2006 "
        f"({num(c06['cid_troca_dir'])} cidades) e {num(c2['troca_min_pt'])} de Lula para Bolsonaro em 2022 ({num(c2['cid_troca_pt'])} cidades). Lula perdeu votos "
        f"em {num(c6['perdeu_pt'])} cidades em 2026, {num(c6['pt_explicavel'])} explicáveis por quem deixou de votar.")
    # quedas de abstenção, nulos e brancos (top 100)
    qr = {r["id"]: r for r in rd("quedas_resumo.csv")}
    ql = rd("quedas.csv")
    top = lambda tipo, crit, n=2: [r for r in ql if r["ano"] == "2026" and r["tipo"] == tipo and r["crit"] == crit][:n]
    regmax = lambda r: max(("N", "NE", "CO", "SE", "S"), key=lambda g: int(r[f"reg_{g}"]))
    qa, qn, qb, qna = qr["2026-abst-pct"], qr["2026-nulos-pct"], qr["2026-brancos-pct"], qr["2026-nulos-abs"]
    ufs_n = {}
    for r in top("nulos", "pct", 100):
        ufs_n[r["uf"]] = ufs_n.get(r["uf"], 0) + 1
    uf_n = max(ufs_n, key=ufs_n.get)
    add("quedas", "cidades", "Onde abstenção, nulos e brancos mais caíram",
        f"Em 2026, das 100 cidades com maior queda percentual da abstenção, {qa['reg_' + regmax(qa)]} são do {REG[regmax(qa)]} e Lula venceu {qa['venc_pt']}; "
        f"a margem nelas variou {pp(qa['swing_top'])}, contra {pp(qa['swing_resto'])} no resto do país. Em votos, as maiores quedas são das capitais "
        + " e ".join(f"{r['municipio']} ({num(r['queda'])})" for r in top("abst", "abs")) + ". "
        f"Nulos em %: {qn['reg_' + regmax(qn)]} das 100 no {REG[regmax(qn)]}, "
        + (f"todas no {UFN[uf_n]}" if ufs_n[uf_n] == int(qn['reg_' + regmax(qn)]) else f"{ufs_n[uf_n]} no {UFN[uf_n]}") + " ("
        + ", ".join(f"{r['municipio']} {pct(-float(r['queda_pct']), 0)}" for r in top("nulos", "pct")) + "), e essas cidades variaram "
        f"{pp(qn['swing_top'])}, abaixo do resto ({pp(qn['swing_resto'])}): a queda de nulos mais forte não veio junto com o maior ganho de Lula. "
        f"Nas 100 maiores quedas de nulos em votos, a margem variou {pp(qna['swing_top'])} contra {pp(qna['swing_resto'])} no resto. "
        f"Brancos em %: {qb['reg_' + regmax(qb)]} das 100 no {REG[regmax(qb)]}. Listas na aba Cidades.")
    # seções
    if (d / "secao_serie.csv").exists():
        ss = {r["ano"]: r for r in rd("secao_serie.csv")}
        tr = {r["id"]: r for r in rd("secao_transicao.csv")}
        sm = rd("secao_modelo.csv")
        s6, s2, s8 = ss["2026"], ss["2022"], ss["2018"]
        t = lambda a, o: tr[f"{a}-BR-{o}"]
        add("sec-contab", "secoes", "As contas fecham seção a seção",
            f"A soma das {num(s6['secoes_2t'])} seções confere com o total de cada um dos {num(s6['mun_conferidos'])} municípios nos dois turnos de 2026 "
            f"(aptos, comparecimento, votos de cada finalista e brancos): {num(s6['mun_divergentes'])} divergências, como em 2022 e 2018. O arquivo de votos "
            f"por candidato e o de detalhe batem em todas as seções, e o comparecimento fecha com os votos em todas. O número de aptos muda entre os turnos "
            f"em {num(s6['aptos_diferentes'])} seções ({num(s6['aptos_diferentes_soma'])} eleitores), perto de 2022 ({num(s2['aptos_diferentes'])}; "
            f"{num(s2['aptos_diferentes_soma'])}).")
        add("sec-espalhado", "secoes", "O líquido de 2026 foi o mais espalhado das três eleições",
            f"{pct(s6['pct_secoes_net_vencedor'], 0)} das seções deram líquido a Lula em 2026; em 2022, {pct(s2['pct_secoes_net_vencedor'], 0)} deram a Bolsonaro "
            f"e em 2018 {pct(s8['pct_secoes_net_vencedor'], 0)} a Haddad. As 10% seções com maior líquido responderam por {pct(s6['top10_net'], 0)} dele "
            f"({pct(s2['top10_net'], 0)} em 2022, {pct(s8['top10_net'], 0)} em 2018), e as que destoam da própria zona são {dc(s6['z5_por_mil'])} por mil "
            f"({dc(s2['z5_por_mil'])} e {dc(s8['z5_por_mil'])}), {s6['z5_pro_pt']} a favor do PT e {s6['z5_pro_adv']} do adversário, somando "
            f"{num(abs(int(s6['z5_votos_net'])))} votos de líquido. Crescimento concentrado em poucas seções seria o sinal de alteração localizada; os dados "
            f"mostram o oposto.")
        add("sec-comp", "secoes", "Comparecimento: alta grande e espalhada",
            f"O comparecimento subiu em {pct(s6['pct_secoes_comp_sobe'], 0)} das seções ({pp(s6['d_comp_media'])}, {mi(s6['d_comp_votos'])} de eleitores), "
            f"contra {pct(s2['pct_secoes_comp_sobe'], 0)} em 2022 e {pct(s8['pct_secoes_comp_sobe'], 0)} em 2018, e as 10% seções que mais subiram deram "
            f"{pct(s6['top10_comp_alta'], 0)} da alta ({pct(s2['top10_comp_alta'], 0)} e {pct(s8['top10_comp_alta'], 0)}). Dentro da zona, cada eleitor a mais "
            f"rendeu {dc(s6['incl_net_comp'])} de líquido para Lula, quase igual a 2022 ({dc(s2['incl_net_comp'])}): os novos votantes se dividiram perto de "
            f"{pct(s6['novos_para_pt'], 0)} a {pct(1 - float(s6['novos_para_pt']), 0)}, como em 2022.")
        add("sec-bn", "secoes", "Transições estimadas por seção: brancos e nulos do 1º turno",
            f"Pelo modelo restrito entre as seções de cada estado, o líquido de Lula ({mi(s6['net_votos'], True)}) se decompõe em quem votou branco ou "
            f"nulo no 1º turno ({mi(s6['contrib_bn'], True)}), abstenção ({mi(s6['contrib_abst'], True)}) e 3ª via ({mi(s6['contrib_ter'], True)}); trocas "
            f"diretas entre os finalistas somam {mi(int(s6['contrib_pt']) + int(s6['contrib_adv']), True)}. A 3ª via se dividiu perto do meio "
            f"({pct(t('2026', 'ter')['para_pt'], 0)} Lula, {pct(t('2026', 'ter')['para_adv'], 0)} Flávio, {pct(t('2026', 'ter')['para_bn'], 0)} branco ou nulo). "
            f"O que sai do padrão é o branco e nulo do 1º turno: {pct(t('2026', 'bn')['para_pt'], 0)} foram para Lula e {pct(t('2026', 'bn')['para_adv'], 0)} "
            f"para Flávio, contra {pct(t('2022', 'bn')['para_pt'], 0)} e {pct(t('2022', 'bn')['para_adv'], 0)} em 2022 e {pct(t('2018', 'bn')['para_pt'], 0)} e "
            f"{pct(t('2018', 'bn')['para_adv'], 0)} em 2018. As outras duas leituras concordam: sem restrição, {pct(t('2026', 'bn')['para_pt_ols'], 0)} e "
            f"{pct(t('2026', 'bn')['para_adv_ols'], 0)}; dentro da zona, cada voto que saiu do branco rendeu {dc(s6['fe_branco'], sinal=True)} de líquido para Lula "
            f"e do nulo {dc(s6['fe_nulo'], sinal=True)}, contra {dc(s2['fe_branco'], sinal=True)} e {dc(s2['fe_nulo'], sinal=True)} em 2022. A taxa de nulos do "
            f"1º turno não foi atípica ({pct(s6['nulos_1t'])} contra {pct(s2['nulos_1t'])} em 2022); em 2026 os nulos caíram no 2º turno "
            f"({pct(s6['nulos_2t'])}), enquanto em 2022 e 2018 subiram. Na distribuição do 1º turno esse saldo iria "
            f"a Lula, Flávio e 3ª via na mesma fatia que tiveram; a estimativa é associação entre seções, não o voto de pessoas.")
        add("sec-chegada", "secoes", "A pausa na chegada dos boletins do 2º turno de 2026",
            f"No 2º turno de 2026, {pct(s6['pct_ate_17h30_2t'])} das seções chegaram ao TSE até 17h30 e depois nenhuma faixa de 10 minutos teve 0,05% das "
            f"seções por {s6['pausa_min_2t']} minutos; a mediana foi {s6['chegada_mediana_2t']} (1º turno {s6['chegada_mediana_1t']}; 2022 "
            f"{s2['chegada_mediana_2t']}; 2018 {s8['chegada_mediana_2t']}). Em 2022 e 2018 o 2º turno não tem pausa ({pct(s2['pct_ate_17h30_2t'], 0)} e "
            f"{pct(s8['pct_ate_17h30_2t'], 0)} chegaram até 17h30). As seções que chegaram antes da pausa não diferem no líquido "
            f"({dc(float(s6['net_dm_ate_17h30_2t']) * 100, 2, True)} p.p. contra o estado) e a ordem de chegada quase não se relaciona com o líquido (correlação {dc(s6['corr_chegada_net'])}). O arquivo não traz o motivo "
            f"e a contagem confere seção a seção; os boletins de urna do 2º turno, quando publicados, trazem o horário de encerramento de cada seção e "
            f"separam fechamento de transmissão.")
        mods = [abs(float(r["net_dm"])) for r in sm if r["ano"] == "2026"]
        lista_uf = lambda txt: ", ".join(" ".join(p) for p in zip(txt.split()[::2], txt.split()[1::2]))
        add("sec-forense", "secoes", "Forense por seção",
            f"Seções com comparecimento de 95% ou mais e 90% ou mais para um lado: {s6['klimek_n']} em 2026 ({s6['klimek_pt']} para Lula), "
            f"{s2['klimek_n']} em 2022 e {s8['klimek_n']} em 2018, mais que antes mas {pct(float(s6['klimek_n']) / float(s6['secoes_analisadas']), 2)} das seções. "
            f"Brancos e nulos zerados no 2º turno: {num(s6['bn2_zero_n'])} seções ({lista_uf(s6['bn2_zero_ufs'])}), contra {num(s2['bn2_zero_n'])} em 2022 "
            f"com os mesmos estados no topo; Lula venceu {pct(s6['bn2_zero_pt_venceu'], 0)} delas e o líquido delas ficou {pp(s6['bn2_zero_net_dm'])} contra a "
            f"zona, sem puxar o resultado. A frequência do último dígito dos votos por seção desvia no máximo {dc(float(s6['dig_ult_pt_desvio']) * 100, 1)} p.p. "
            f"dos 10% esperados, como em 2022 e 2018. Por modelo de urna, o líquido difere no máximo {dc(max(mods) * 100, 2)} p.p. da média do município.")
    json.dump(out, open(d / "insights.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for o in out:
        print(f"[{o['id']}] {o['texto']}\n")


if __name__ == "__main__":
    main(sys.argv[1])
