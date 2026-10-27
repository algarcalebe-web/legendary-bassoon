"""Segurança em camadas, 2026: cruza as seções e cidades sinalizadas com os registros técnicos do TSE. Só dados.

Fontes (dadosabertos.tse.jus.br, 2026):
- Correspondências esperadas (CSEC/CCONT, 1º turno 03.10 e 04.10; 2º turno 24.10) e efetivadas (CEFT, 1º turno):
  qual urna e qual carga (código, data, computador que gerou a mídia) estavam previstas e quais votaram.
- Logs do GEDAI-UE (computadores que preparam as mídias), 1º turno (03.10 e 04.10) e 2º turno (24.10).
- Boletim de Urna web do 1º turno (bweb): eleitores sem habilitação biométrica, abertura, encerramento, emissão.
- Arquivos da urna por seção (log logd.dat e RDV), 1º e 2º turno, do portal resultados.tse.jus.br (arquivo-urna),
  lidos para as seções sinalizadas e um controle sorteado na mesma zona: métricas do log e recontagem do RDV.
  A correspondência efetivada e o BU web do 2º turno ainda não estão no portal de dados abertos.

Grupos sinalizados (2º turno 2026, conjunto analisado do secao.py): comparecimento 95%+ e 90%+ para um lado (Klimek),
brancos+nulos zerados (200+ votantes), desvio da zona (z robusto > 5), seções de cidades com conversão acima de
100%, com virada (líder do 1º turno perdeu o 2º) e com perda de votos explicável só por troca. Controle: demais
seções; nas comparações "dentro da zona" a métrica é medida contra a média ponderada da própria zona.

Uso: python -I seguranca.py <secao_dir> <seg_raw_dir> <bweb_dir> <data_dir> <out_dir> <urna_dir>
     python -I seguranca.py camadas <out_dir> <data_dir>
<urna_dir> guarda o aux.json, o log e o RDV de cada seção lida (baixados uma vez).
"""

import csv
import io
import json
import math
import re
import subprocess
import sys
import zipfile
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

import numpy as np
from scipy import stats

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_dataset as bd  # noqa: E402
import secao as sc  # noqa: E402

ANO = 2026
DIA_1T, DIA_2T = "04/10/2026", "25/10/2026"
GRUPOS = (("klimek", "Comparecimento 95%+ e 90%+ para um lado"), ("bn0", "Brancos e nulos zerados"),
          ("z5", "Desvio da zona (z > 5)"), ("cid_conv", "Cidades com conversão acima de 100%"),
          ("cid_virada", "Cidades com virada"), ("cid_troca", "Cidades com perda de votos por troca"),
          ("cid_destoa", "Cidades que mais destoam do estado"), ("cid_local", "Cidades atípicas na vizinhança"),
          ("cid_extremo", "Cidades com resultado extremo"), ("cid_queda", "Maiores quedas de abstenção, nulos e brancos"),
          ("controle", "Demais seções"))
SECAO_GRUPOS = ("klimek", "bn0", "z5")
CIDADE_GRUPOS = ("cid_conv", "cid_virada", "cid_troca", "cid_destoa", "cid_local", "cid_extremo", "cid_queda")
PEQUENOS = ("cid_destoa", "cid_local", "cid_extremo")   # listas curtas da aba Auditoria: várias seções por cidade
PERDA_TROCA = ("saida_caiu", "perda_maior", "oponente_acima")
N_CIDADE = 400     # seções sorteadas em cada grupo grande de cidades
POR_CIDADE = 8     # seções sorteadas por cidade nos grupos curtos
SEMENTE = 2026


def r5(x):
    return sc.r5(x)


def csv_tse(blob):
    """CSV do TSE (latin-1, ';', aspas) -> (cabeçalho, linhas)."""
    rd = csv.reader(io.StringIO(blob.decode("latin-1")), delimiter=";")
    h = {c: i for i, c in enumerate(next(rd))}
    return h, rd


def chave(uf, mun, zona, sec):
    return uf, str(mun).zfill(5), int(zona), int(sec)


# ---------------------------------------------------------------- seções e grupos

def secoes(secao_dir):
    D = sc.carrega(Path(secao_dir) / str(ANO), ANO)
    N, M, ufs = D["num"], D["meta"], D["ufs"]
    pres = N["presente"].astype(bool)
    base = np.maximum(N["aptos"][1], N["aptos"][2])
    ok = (pres[1] & pres[2] & (M["uf"] != ufs.index("ZZ")) & (N["inst"][1] > 0) & (N["inst"][2] > 0)
          & (N["anul"][1] == 0) & (N["anul"][2] == 0) & (base >= sc.MIN_APTOS)
          & (N["pt"][1] + N["adv"][1] + N["ter"][1] > 0) & (N["pt"][2] + N["adv"][2] > 0))
    ix = np.flatnonzero(ok)
    A = base[ok]
    c1, c2 = N["comp"][1][ok], N["comp"][2][ok]
    p1, a1, p2, a2 = N["pt"][1][ok], N["adv"][1][ok], N["pt"][2][ok], N["adv"][2][ok]
    bn2 = (N["bra"][2] + N["nul"][2] + N["anu"][2])[ok]
    zona = np.unique(M["zona"][ok], return_inverse=True)[1]
    nz = zona.max() + 1
    netp = ((p2 - p1) - (a2 - a1)) / A
    med, cnt = sc.gmedian(zona, netp, nz)
    mad, _ = sc.gmedian(zona, np.abs(netp - med[zona]), nz)
    esc = 1.4826 * mad[zona]
    valido = (cnt[zona] >= sc.MIN_ZONA) & (esc > 0)
    z = np.where(valido, (netp - med[zona]) / np.where(esc > 0, esc, 1), np.nan)
    vv2 = p2 + a2
    big = (vv2 >= 100) & (A >= 100)
    venc = np.maximum(p2, a2) / vv2
    g = {"klimek": (c2 / A >= 0.95) & (venc >= 0.90) & big,
         "bn0": (bn2 == 0) & (c2 >= 200),
         "z5": valido & (np.abs(np.nan_to_num(z)) > sc.Z_LIMITE)}
    chaves = [D["chaves"][i] for i in ix]
    return {"chaves": chaves, "pos": {k: j for j, k in enumerate(chaves)}, "zona": zona, "nz": nz, "A": A,
            "c1": c1, "c2": c2, "p1": p1, "a1": a1, "p2": p2, "a2": a2, "bn2": bn2, "netp": netp, "z": z,
            "rec2": N["recv"][2][ok], "rec1": N["recv"][1][ok], "g": g, "nomes": D["nomes"]}


def cidades(data_dir):
    """Cidades dos grupos: mapa (conversão, virada, troca) e listas da aba Auditoria (destoam do estado, desvio
    na vizinhança, resultados extremos, maiores quedas de abstenção, nulos e brancos)."""
    out = {g: set() for g in CIDADE_GRUPOS}
    for g, arq in (("cid_destoa", "auditoria_outliers"), ("cid_local", "consistencia_locais"),
                   ("cid_extremo", "consistencia_extremos"), ("cid_queda", "quedas")):
        with open(Path(data_dir) / f"{arq}.csv", encoding="utf-8") as f:
            out[g] = {(r["uf"], r["cod"].zfill(5)) for r in csv.DictReader(f) if r["ano"] == str(ANO)}
    with open(Path(data_dir) / f"mapa_{ANO}.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            k = (r["uf"], r["cod"].zfill(5))
            if r["flag_conv"] in ("pt_acima", "dir_acima"):
                out["cid_conv"].add(k)
            if r["virou"] == "1":
                out["cid_virada"].add(k)
            if r["flag_perda_pt"] in PERDA_TROCA or r["flag_perda_dir"] in PERDA_TROCA:
                out["cid_troca"].add(k)
    return out


# ---------------------------------------------------------------- correspondências

def membro(zpath, prefixo):
    z = zipfile.ZipFile(zpath)
    nome = [n for n in z.namelist() if n.startswith(prefixo) and n.endswith(".csv")]
    return z.read(nome[0]) if nome else None


def nc(v):
    """Código de carga ou número de urna sem zeros à esquerda (o CSV às vezes os perde)."""
    return str(v or "").strip().lstrip("0")


def correspondencias(raw):
    """Por seção: urna, carga e computador previstos e efetivados; urnas de contingência registradas por zona."""
    raw = Path(raw)
    sec = defaultdict(dict)
    cont = Counter()
    reserva = {1: set(), 2: set()}
    for f in sorted(raw.glob("CEFT_1t_*.zip")):
        h, rd = csv_tse(membro(f, "ceft"))
        for r in rd:
            k = chave(r[h["SG_UF"]], r[h["CD_MUNICIPIO"]], r[h["NR_ZONA"]], r[h["NR_SECAO"]])
            sec[k].update({"urna_esp_1t": r[h["NR_URNA_ESPERADA"]], "urna_1t": r[h["NR_URNA_EFETIVADA"]],
                           "carga_esp_1t": nc(r[h["CD_CARGA_URNA_ESPERADA"]]), "carga_1t": nc(r[h["CD_CARGA_URNA_EFETIVADA"]]),
                           "dt_carga_1t": r[h["DT_CARGA_URNA_EFETIVADA"]], "div_1t": r[h["TP_DIVERGENCIA"]],
                           "origem_1t": r[h["DS_ORIGEM_VOTO"]], "maq_1t": r[h["NM_MAQUINA_GERACAO_MIDIA"]],
                           "maq_esp_1t": r[h["NM_MAQUINA_TRANSM_CORRESP"]]})
    # 1º turno: duas gerações da esperada (03.10 e 04.10); a última diz o que mudou entre elas
    for f in sorted(raw.glob("CESP_1t_*_04*.zip")):
        h, rd = csv_tse(membro(f, "csec"))
        for r in rd:
            k = chave(r[h["SG_UF"]], r[h["CD_MUNICIPIO"]], r[h["NR_ZONA"]], r[h["NR_SECAO"]])
            sec[k]["alt_1t"] = r[h["ST_CORRESP_ALTERADA"]]
        h, rd = csv_tse(membro(f, "ccont"))
        for r in rd:
            cont[(r[h["SG_UF"]], "1t")] += 1
            reserva[1].add((r[h["SG_UF"]], r[h["CD_MUNICIPIO"]].zfill(5), int(r[h["NR_ZONA"]]), nc(r[h["NR_URNA_ESPERADA"]])))
    for f in sorted(raw.glob("CESP_2t_*.zip")):
        h, rd = csv_tse(membro(f, "csec"))
        for r in rd:
            k = chave(r[h["SG_UF"]], r[h["CD_MUNICIPIO"]], r[h["NR_ZONA"]], r[h["NR_SECAO"]])
            sec[k].update({"urna_2t": r[h["NR_URNA_ESPERADA"]], "carga_2t": nc(r[h["CD_CARGA_URNA_ESPERADA"]]),
                           "dt_carga_2t": r[h["DT_CARGA_URNA_ESPERADA"]], "alt_2t": r[h["ST_CORRESP_ALTERADA"]],
                           "maq_2t": r[h["NM_MAQUINA_GERACAO_MIDIA"]]})
        h, rd = csv_tse(membro(f, "ccont"))
        for r in rd:
            cont[(r[h["SG_UF"]], "2t")] += 1
            reserva[2].add((r[h["SG_UF"]], r[h["CD_MUNICIPIO"]].zfill(5), int(r[h["NR_ZONA"]]), nc(r[h["NR_URNA_ESPERADA"]])))
    for v in sec.values():
        v["sub_1t"] = int(bool(v.get("urna_1t")) and nc(v.get("urna_1t")) != nc(v.get("urna_esp_1t")))
        v["urna_mudou_2t"] = int(bool(v.get("urna_2t")) and bool(v.get("urna_1t")) and nc(v["urna_2t"]) != nc(v["urna_1t"]))
        v["carga_nova_2t"] = int(bool(v.get("carga_2t")) and bool(v.get("carga_1t")) and v["carga_2t"] != v["carga_1t"])
    return sec, cont, reserva


# ---------------------------------------------------------------- GEDAI

RX_CORR = re.compile(r"(Transmitida|Recebida) a? ?correspond[êe]ncia de se[çc][ãa]o: munic[íi]pio (\d+), zona (\d+), "
                     r"se[çc][ãa]o (\d+), carga (\d+), id urna (\d+)")
RX_PACOTE = re.compile(r"Pacote (\S+) importado - Vers[ãa]o (\d+)")
RX_NOME = re.compile(r"gedai-ue-(\w\w)-(\d+)-oficial-([A-Z0-9]+)-([0-9A-F]+)-([0-9A-F]+)-log\.jez", re.I)


def logs_gedai(zpath):
    """(arquivo, linhas) de cada computador: zip -> .jez (zip) -> .jez (zip) -> gedai-ue.log."""
    z = zipfile.ZipFile(zpath)
    for n in z.namelist():
        if not n.endswith(".jez"):
            continue
        linhas = []
        z2 = zipfile.ZipFile(io.BytesIO(z.read(n)))
        for m in z2.namelist():
            b = z2.read(m)
            try:
                z3 = zipfile.ZipFile(io.BytesIO(b))
            except zipfile.BadZipFile:
                continue
            for k in z3.namelist():
                if k.endswith(".log"):
                    linhas += z3.read(k).decode("latin-1").splitlines()
        yield n, linhas


def dt(s):
    try:
        return datetime.strptime(s[:19], "%d/%m/%Y %H:%M:%S")
    except ValueError:
        return None


def gedai(raw):
    raw = Path(raw)
    maq, rastro, versoes = {}, defaultdict(set), defaultdict(lambda: defaultdict(set))
    prefixo_ok = Counter()
    anteriores = {}
    for f in sorted(raw.glob("log_gedai_1t_*_03*.zip")):
        for n, L in logs_gedai(f):
            anteriores[n] = L
    for turno, padrao in (("1t", "log_gedai_1t_*_04*.zip"), ("2t", "log_gedai_2t_*.zip")):
        for f in sorted(raw.glob(padrao)):
            for n, L in logs_gedai(f):
                m = RX_NOME.search(n)
                uf = m.group(1).upper() if m else f.name.split("_")[3]
                nome = m.group(3) if m else n
                c = Counter()
                ini = fim = None
                odin, win = set(), set()
                for ln in L:
                    p = ln.split("\t")
                    if len(p) < 3 or p[1] not in ("INFO", "ALERTA", "ERRO"):
                        c["linha_invalida"] += 1
                        continue
                    t = dt(p[0])
                    if t:
                        ini = t if ini is None or t < ini else ini
                        fim = t if fim is None or t > fim else fim
                        if t.hour < 6 or t.hour >= 22:
                            c["madrugada"] += 1
                    msg = p[2]
                    c[p[1]] += 1
                    if "Assinatura inválida" in msg or "assinatura inválida" in msg:
                        c["assinatura_invalida"] += 1
                    if "integridade de banco" in msg:
                        c["integridade_banco"] += 1
                    if msg.startswith("Banco de dados restaurado"):
                        c["banco_restaurado"] += 1
                    if "sem prefil válido" in msg or "sem perfil válido" in msg:
                        c["sem_perfil"] += 1
                    if "rede da Justiça Eleitoral indisponível" in msg:
                        c["sem_rede"] += 1
                    if msg.startswith("Início da geração de mídia de carga"):
                        c["midias_carga"] += 1
                    if msg.startswith("Mídia de votação gerada"):
                        c["midias_votacao"] += 1
                    if msg.startswith("Usuário Odin:"):
                        odin.add(msg.split("|")[0])
                    if msg.startswith("Usuário Windows:"):
                        win.add(msg)
                    mc = RX_CORR.search(msg)
                    if mc:
                        c["corresp"] += 1
                        rastro[turno].add((uf, mc.group(2).zfill(5), int(mc.group(3)), int(mc.group(4)), nc(mc.group(5))))
                    mp = RX_PACOTE.search(msg)
                    if mp:
                        versoes[(turno, uf)][mp.group(1)].add(mp.group(2))
                if turno == "1t" and n in anteriores:
                    a = anteriores[n]
                    prefixo_ok["igual" if a == L else "acrescimo" if L[:len(a)] == a else "divergente"] += 1
                maq[(turno, uf, nome, n)] = {"turno": turno, "uf": uf, "maquina": nome, "linhas": len(L),
                                            "inicio": ini.isoformat(" ") if ini else "",
                                            "fim": fim.isoformat(" ") if fim else "",
                                            "usuarios_odin": len(odin), "usuarios_windows": len(win), **c}
    return maq, rastro, versoes, prefixo_ok


# ---------------------------------------------------------------- BU web do 1º turno

def hm(s):
    return int(s[11:13]) * 60 + int(s[14:16]) if len(s) >= 16 and s[11:13].isdigit() else None


def bweb(bweb_dir):
    out = {}
    for f in sorted(Path(bweb_dir).glob("pres_1t_*.csv")):
        with open(f, encoding="utf-8") as fh:
            for r in csv.DictReader(fh, delimiter=";"):
                k = chave(r["SG_UF"], r["CD_MUNICIPIO"], r["NR_ZONA"], r["NR_SECAO"])
                nb = int(r["QT_ELEI_BIOM_SEM_HABILITACAO"]) if r["QT_ELEI_BIOM_SEM_HABILITACAO"].lstrip("-").isdigit() else -1
                out[k] = {"comp_bu": int(r["QT_COMPARECIMENTO"] or 0), "sem_biom": nb,
                          "abre": hm(r["DT_ABERTURA"]), "fecha": hm(r["DT_ENCERRAMENTO"]), "emite": hm(r["DT_EMISSAO_BU"]),
                          "urna_bu": r["NR_URNA_EFETIVADA"], "agregadas": r["DS_SECOES_AGREGADAS"] not in ("#NULO#", "", "-1"),
                          "tipo_urna": r["DS_TIPO_URNA"]}
    return out


# ---------------------------------------------------------------- arquivos da urna (log e RDV), por seção

def baixa(url):
    r = subprocess.run(["curl", "-sS", "-f", "--retry", "4", "--retry-delay", "2", url], capture_output=True)
    return r.stdout if r.returncode == 0 else None


def der(b, i):
    """(tag, início do valor, tamanho) do elemento DER em b[i]."""
    t = b[i]
    i += 1
    if t & 0x1F == 0x1F:
        while b[i] & 0x80:
            i += 1
        i += 1
    n = b[i]
    i += 1
    if n & 0x80:
        k = n & 0x7F
        n = int.from_bytes(b[i:i + k], "big")
        i += k
    return t, i, n


def filhos(b, i, n):
    out, fim = [], i + n
    while i < fim:
        t, j, m = der(b, i)
        out.append((t, j, m))
        i = j + m
    return out


def recontagem(rdv, eleicao, pt_nr, adv_nr):
    """Votos de Presidente no RDV: (pt, adv, outros). Tipo 2 = nominal; demais tipos (branco, nulo) em outros."""
    t, i, n = der(rdv, 0)
    corpo = filhos(rdv, *filhos(rdv, i, n)[2][1:])
    for _, i2, n2 in filhos(rdv, *[x for x in corpo if x[0] == 0xA1][0][1:]):
        el = filhos(rdv, i2, n2)
        if int.from_bytes(rdv[el[0][1]:el[0][1] + el[0][2]], "big") != eleicao:
            continue
        c = Counter()
        for _, i3, n3 in filhos(rdv, el[1][1], el[1][2]):
            vc = filhos(rdv, i3, n3)
            if rdv[vc[0][1]] != 1:  # cargo 1 = Presidente
                continue
            for _, i4, n4 in filhos(rdv, vc[2][1], vc[2][2]):
                v = filhos(rdv, i4, n4)
                dig = rdv[v[1][1]:v[1][1] + v[1][2]].decode() if len(v) > 1 else ""
                c["pt" if (rdv[v[0][1]], dig) == (2, str(pt_nr)) else "adv" if (rdv[v[0][1]], dig) == (2, str(adv_nr))
                  else "outros"] += 1
        return c["pt"], c["adv"], c["outros"]
    return None


def textos_log(blob):
    """Textos de log (logd.dat) de um pacote .jez, incluindo os pacotes arquivados dentro dele (urna substituída)."""
    out = []
    z = zipfile.ZipFile(io.BytesIO(blob))
    for m in z.namelist():
        b = z.read(m)
        if m.endswith(".dat"):
            out.append(b.decode("latin-1"))
        elif b[:2] == b"PK":
            out += textos_log(b)
    return out


def metricas_log(textos, turno):
    """Métricas dos logs de uma seção num turno: dia da eleição (votos, habilitação, ritmo, urnas) e verificações de
    assinatura no período do turno (até o dia do 1º turno, ou depois dele). Linhas repetidas entre cópias contam uma vez."""
    dia = PLEITOS[turno][2]
    d1 = datetime.strptime(DIA_1T, "%d/%m/%Y").date()
    votos, habil, durs, horas = 0, Counter(), [], []
    c, urnas, versoes, falhas = Counter(), Counter(), set(), []
    pendente = set()   # arquivos com falha de assinatura ainda sem uma verificação bem-sucedida depois
    vistos = set()
    ultimo_hab = None
    for ln in sorted({ln for tx in textos for ln in tx.splitlines()}, key=lambda x: (dt(x) or datetime.min, x)):
        p = ln.split("\t")
        if len(p) < 6 or tuple(p) in vistos:
            continue
        vistos.add(tuple(p))
        t = dt(p[0])
        msg = p[4]
        no_turno = t is not None and ((t.date() <= d1) if turno == 1 else (t.date() > d1))
        if msg.startswith("Versão da aplicação:") and no_turno:
            versoes.add(msg.split(":", 1)[1].split(" - ")[0].strip())
        elif "Verificação de assinatura" in msg and no_turno:
            arq = re.findall(r"\[([^\]]+)\]", msg)
            alvo = arq[1] if len(arq) > 1 else msg[:60]
            if "[SUCESSO]" in msg:
                c["assin_ok"] += 1
                pendente.discard(alvo)
            else:
                c["assin_falha"] += 1
                c["assin_falha_dia"] += p[0].startswith(dia)
                pendente.add(alvo)
                falhas.append(f"{p[0][:16]} {alvo}")
        if not p[0].startswith(dia):
            continue
        urnas[p[2]] += 1
        if p[1] == "ERRO":
            c["erros"] += 1
        elif p[1] == "ALERTA":
            c["alertas"] += 1
        if msg.startswith("Urna ligada em"):
            c["ligada"] += 1
        elif msg == "Eleitor foi habilitado":
            ultimo_hab = t
        elif msg.startswith("Tipo de habilitação do eleitor"):
            habil[msg[msg.find("[") + 1:msg.find("]")]] += 1
        elif "habilitou o eleitor" in msg:
            c["mesario"] += 1
        elif msg == "O voto do eleitor foi computado":
            votos += 1
            if t:
                horas.append(t.hour * 60 + t.minute)
                if ultimo_hab:
                    durs.append((t - ultimo_hab).total_seconds())
            ultimo_hab = None
    h = np.array(horas, dtype=int)
    d = np.array(durs)
    bio = habil.get("biométrica", 0)
    return {"votos": votos, "biometrica": bio, "nao_biometrica": max(votos - bio, 0), "mesario": c["mesario"],
            "dur_mediana": float(np.median(d)) if len(d) else None, "lt20s": int((d < 20).sum()),
            "max_10min": int(np.bincount(h // 10).max()) if len(h) else 0,
            "apos_17h": int((h >= 17 * 60).sum()), "ligada": c["ligada"], "erros": c["erros"], "alertas": c["alertas"],
            "urnas": sorted(urnas), "versoes": sorted(versoes), "assin_ok": c["assin_ok"], "assin_falha": c["assin_falha"],
            "assin_falha_dia": c["assin_falha_dia"], "assin_pendente": len(pendente), "falhas": falhas[:3],
            "pacotes_log": len(textos)}


PORTAL = "https://resultados.tse.jus.br/oficial/ele2026/arquivo-urna/{pl}/dados/{uf}/{mun}/{zona:04d}/{sec:04d}/"
PLEITOS = {1: (3220, 6257, DIA_1T), 2: (3221, 6258, DIA_2T)}


def baixa_urna(k, turno, raw_dir):
    """Baixa (uma vez) o aux.json, o log e o RDV de uma seção para raw_dir/<pleito>/<uf>-<mun>-<zona>-<seção>/."""
    pl = PLEITOS[turno][0]
    uf, mun, zona, sec = k
    pasta = Path(raw_dir) / str(pl) / f"{uf}-{mun}-{zona}-{sec}"
    if (pasta / "ok").exists():
        return
    pasta.mkdir(parents=True, exist_ok=True)
    base = PORTAL.format(pl=pl, uf=uf.lower(), mun=mun, zona=zona, sec=sec)
    aux = baixa(base + f"p{pl:06d}-{uf.lower()}-m{mun}-z{zona:04d}-s{sec:04d}-aux.json")
    if aux is None:
        return
    (pasta / "aux.json").write_bytes(aux)
    hs = json.loads(aux.decode("latin-1")).get("hashes", [])
    tot = [x for x in hs if x.get("st") == "Totalizado"] or hs
    if tot:
        arqs = {a["tp"]: a["nm"] for a in tot[-1].get("arq", [])}
        for tp in ("log", "rdv"):
            if tp in arqs:
                b = baixa(base + tot[-1]["hash"] + "/" + arqs[tp])
                if b is None:
                    return
                (pasta / tp).write_bytes(b)
    (pasta / "ok").write_text("")


def le_urna(k, turno, raw_dir):
    pl, eleicao, _ = PLEITOS[turno]
    uf, mun, zona, sec = k
    pasta = Path(raw_dir) / str(pl) / f"{uf}-{mun}-{zona}-{sec}"
    if not (pasta / "aux.json").exists():
        return {"erro": "sem_aux"}
    hs = json.loads((pasta / "aux.json").read_bytes().decode("latin-1")).get("hashes", [])
    tot = [x for x in hs if x.get("st") == "Totalizado"] or hs
    if not tot:
        return {"erro": "sem_hash"}
    out = {"hashes": len(hs), "recebido": f"{tot[-1].get('dr', '')} {tot[-1].get('hr', '')}"}
    pt_nr, _, adv_nr, _ = bd.FINAIS[ANO]
    if (pasta / "log").exists():
        out.update(metricas_log(textos_log((pasta / "log").read_bytes()), turno))
    if (pasta / "rdv").exists():
        try:
            out["rdv"] = recontagem((pasta / "rdv").read_bytes(), eleicao, pt_nr, adv_nr)
        except (IndexError, ValueError):
            out["rdv"] = None
    return out


def arquivos_urna(alvos, raw_dir, workers=16):
    """alvos: chaves das seções -> {(chave, turno): métricas}. Baixa o que falta e mede tudo a partir do disco."""
    from concurrent.futures import ThreadPoolExecutor
    tarefas = [(k, t) for k in alvos for t in (1, 2)
               if not (Path(raw_dir) / str(PLEITOS[t][0]) / f"{k[0]}-{k[1]}-{k[2]}-{k[3]}" / "ok").exists()]
    print("arquivos de urna a baixar:", len(tarefas), flush=True)
    with ThreadPoolExecutor(workers) as ex:
        for n, _ in enumerate(ex.map(lambda kt: baixa_urna(*kt, raw_dir), tarefas)):
            if n % 1000 == 999:
                print(n + 1, flush=True)
    from concurrent.futures import ProcessPoolExecutor
    kts = [(k, t) for k in alvos for t in (1, 2)]
    with ProcessPoolExecutor() as ex:
        medidas = list(ex.map(le_urna, [k for k, _ in kts], [t for _, t in kts], [raw_dir] * len(kts), chunksize=64))
    return dict(zip(kts, medidas))


# ---------------------------------------------------------------- consolidação

def amostra(S, grupos_sec, grupos_cid, livre_sec, livre, rng):
    """Seções cujos arquivos de urna serão lidos: todas as sinalizadas por seção, cada uma com 1 controle sorteado na
    mesma zona entre as não sinalizadas por seção; nos grupos de cidade, N_CIDADE seções (grupos grandes) ou
    POR_CIDADE por cidade (listas curtas da Auditoria), cada uma com 1 controle na mesma UF fora de qualquer grupo."""
    zona, ufv = S["zona"], np.array([k[0] for k in S["chaves"]])
    por_zona, por_uf = defaultdict(list), defaultdict(list)
    for j in np.flatnonzero(livre_sec):
        por_zona[zona[j]].append(j)
    for j in np.flatnonzero(livre):
        por_uf[ufv[j]].append(j)
    pares = {}
    for g in SECAO_GRUPOS:
        for j in np.flatnonzero(grupos_sec[g]):
            pares.setdefault(int(j), int(rng.choice(por_zona[zona[j]])) if por_zona[zona[j]] else None)
    pares_cid = defaultdict(dict)
    mun = np.array([k[0] + k[1] for k in S["chaves"]])
    for g in CIDADE_GRUPOS:
        idx = np.flatnonzero(grupos_cid[g])
        if g in PEQUENOS:
            esc = []
            for m_ in np.unique(mun[idx]):
                d = idx[mun[idx] == m_]
                esc += list(rng.choice(d, min(POR_CIDADE, len(d)), replace=False))
        else:
            esc = rng.choice(idx, min(N_CIDADE, len(idx)), replace=False)
        for j in esc:
            pares_cid[g][int(j)] = int(rng.choice(por_uf[ufv[j]])) if por_uf[ufv[j]] else None
    return pares, pares_cid


def taxa(num, den):
    return r5(num / den) if den else None


def ident(m, c, k, turno, reserva):
    """Urna da correspondência (efetivada no 1º turno, esperada no 2º) entre as urnas do log no dia: 'confere';
    senão, alguma urna do log está na lista de contingência do estado: 'contingencia'; senão 'nao_confere'."""
    if not m.get("urnas"):
        return None
    urnas = {nc(u) for u in m["urnas"]}
    if nc(c.get("urna_1t" if turno == 1 else "urna_2t")) in urnas:
        return "confere"
    if any((k[0], u) in reserva for u in urnas):
        return "contingencia"
    return "nao_confere"


def resumo_urna(js, U, S, turno, corr, reserva):
    """Agrega as métricas de log e RDV de um conjunto de seções num turno."""
    v = [(j, U.get((S["chaves"][j], turno))) for j in js if j is not None]
    v = [(j, m) for j, m in v if m and "votos" in m]
    if not v:
        return {}
    tot = sum(m["votos"] for _, m in v)
    comp = S["c1"] if turno == 1 else S["c2"]
    p = S["p1"] if turno == 1 else S["p2"]
    a = S["a1"] if turno == 1 else S["a2"]
    rdv = [(j, m["rdv"]) for j, m in v if m.get("rdv")]
    bate = sum(1 for j, r in rdv if tuple(r) == (int(p[j]), int(a[j]), int(comp[j] - p[j] - a[j])))
    durs = [m["dur_mediana"] for _, m in v if m["dur_mediana"] is not None]
    ids = Counter(ident(m, corr.get(S["chaves"][j], {}), S["chaves"][j], turno, reserva) for j, m in v)
    n_id = sum(x for kk, x in ids.items() if kk)
    return {"secoes_lidas": len(v), "votos_log": tot,
            "urna_confere": taxa(ids["confere"], n_id), "urna_contingencia": taxa(ids["contingencia"], n_id),
            "urna_nao_confere": ids["nao_confere"],
            "assinatura_falha": sum(1 for _, m in v if m.get("assin_falha")),
            "assinatura_falha_dia": sum(1 for _, m in v if m.get("assin_falha_dia")),
            "assinatura_pendente": sum(1 for _, m in v if m.get("assin_pendente")),
            "versoes": " ".join(sorted({x for _, m in v for x in m.get("versoes", [])})),
            "mais_de_um_bu": taxa(sum(1 for _, m in v if m.get("hashes", 1) > 1), len(v)),
            "log_bate_comp": taxa(sum(1 for j, m in v if m["votos"] == int(comp[j])), len(v)),
            "rdv_lidos": len(rdv), "rdv_bate": taxa(bate, len(rdv)),
            "nao_biometrica": taxa(sum(m["nao_biometrica"] for _, m in v), tot),
            "mesario": taxa(sum(m["mesario"] for _, m in v), tot),
            "dur_mediana_s": r5(float(np.median(durs))) if durs else None,
            "lt20s": taxa(sum(m["lt20s"] for _, m in v), tot),
            "max_10min_media": r5(float(np.mean([m["max_10min"] for _, m in v]))),
            "apos_17h": taxa(sum(m["apos_17h"] for _, m in v), tot),
            "religada": taxa(sum(1 for _, m in v if m["ligada"] > 1), len(v)),
            "erros_por_secao": r5(sum(m["erros"] for _, m in v) / len(v))}


def main(secao_dir, raw, bweb_dir, data_dir, out_dir, urna_dir):
    out = Path(out_dir)
    rng = np.random.default_rng(SEMENTE)
    S = secoes(secao_dir)
    print("seções analisadas", len(S["chaves"]), {g: int(m.sum()) for g, m in S["g"].items()}, flush=True)
    cid = cidades(data_dir)
    corr, cont, reserva = correspondencias(raw)
    B = bweb(bweb_dir)
    maq, rastro, versoes, prefixo = gedai(raw)
    print("gedai", len(maq), "logs;", dict(prefixo), flush=True)
    n = len(S["chaves"])
    ch, zona, nz, A = S["chaves"], S["zona"], S["nz"], S["A"]
    mun = [(k[0], k[1]) for k in ch]
    gs = dict(S["g"])
    for g, cj in cid.items():
        gs[g] = np.array([m in cj for m in mun])
    algum = np.zeros(n, bool)
    for m in gs.values():
        algum |= m
    gs["controle"] = ~algum

    # vetores por seção
    def vet(f):
        return np.array([f(k) for k in ch], dtype=float)
    rast = rastro["1t"] | rastro["2t"]
    alerta_maq = defaultdict(int)
    for (t, uf, nome, _), r in maq.items():
        alerta_maq[(uf, nome)] += r.get("assinatura_invalida", 0) + r.get("integridade_banco", 0)
    sub1 = vet(lambda k: corr[k]["sub_1t"] if k in corr and "urna_1t" in corr[k] else np.nan)
    mud2 = vet(lambda k: corr[k]["urna_mudou_2t"] if k in corr and "urna_2t" in corr[k] else np.nan)
    car2 = vet(lambda k: corr[k]["carga_nova_2t"] if k in corr and "urna_2t" in corr[k] else np.nan)
    sr1 = vet(lambda k: float(k + (corr[k]["carga_1t"],) not in rast) if k in corr and corr[k].get("carga_1t") else np.nan)
    sr2 = vet(lambda k: float(k + (corr[k]["carga_2t"],) not in rast) if k in corr and corr[k].get("carga_2t") else np.nan)
    malr = vet(lambda k: float(alerta_maq.get((k[0], corr[k].get("maq_1t")), 0) > 0) if k in corr else np.nan)
    sb = vet(lambda k: B[k]["sem_biom"] if k in B and B[k]["sem_biom"] >= 0 else np.nan)
    cb = vet(lambda k: B[k]["comp_bu"] if k in B else np.nan)
    fecha = vet(lambda k: B[k]["fecha"] if k in B and B[k]["fecha"] is not None else np.nan)
    sbp = np.where(cb > 0, sb / np.where(cb > 0, cb, 1), np.nan)
    okb = np.isfinite(sbp)
    zm = np.bincount(zona[okb], (sbp * A)[okb], nz) / np.maximum(np.bincount(zona[okb], A[okb], nz), 1)
    sbp_dz = sbp - zm[zona]
    netd = sc.demean(zona, S["netp"], A, nz)
    rec2 = S["rec2"]

    def media(x, m, w=None):
        ok = m & np.isfinite(x)
        return r5(np.average(x[ok], weights=None if w is None else w[ok])) if ok.any() else None

    grupos_rows = []
    ctl_m = gs["controle"]

    ufi = np.unique(np.array([k[0] for k in ch]), return_inverse=True)[1]

    def esperado(x, m):
        """Taxa esperada no grupo se cada seção tivesse a taxa das demais seções do seu estado; e os resíduos."""
        ok_c = ctl_m & np.isfinite(x)
        taxa_uf = np.bincount(ufi[ok_c], x[ok_c], ufi.max() + 1) / np.maximum(np.bincount(ufi[ok_c], minlength=ufi.max() + 1), 1)
        ok_g = m & np.isfinite(x)
        return ok_g, taxa_uf[ufi[ok_g]]

    def sig_prop(x, m):
        """1 se a taxa do grupo passa de 1,5 vez a esperada pelas demais seções do mesmo estado e o excesso é
        significativo (soma de Bernoullis com a taxa de cada estado, aproximação normal, p < 0,01)."""
        ok_g, e = esperado(x, m)
        if not ok_g.any():
            return 0
        k, mu, var = float(np.nansum(x[ok_g])), float(e.sum()), float((e * (1 - e)).sum())
        if mu <= 0 or k <= 1.5 * mu:
            return 0
        return int(var > 0 and stats.norm.sf((k - 0.5 - mu) / math.sqrt(var)) < 0.01)

    def sig_media(x, m):
        """Igual, para a taxa por seção sem biometria: 1,5 vez a esperada pelo estado e teste t nos resíduos (p < 0,01)."""
        ok_g, e = esperado(x, m)
        if ok_g.sum() < 2 or x[ok_g].mean() <= 1.5 * e.mean():
            return 0
        return int(stats.ttest_1samp(x[ok_g] - e, 0, alternative="greater").pvalue < 0.01)

    for g, rot in GRUPOS:
        m = gs[g]
        grupos_rows.append({
            "id": g, "grupo": rot, "secoes": int(m.sum()), "eleitores": int(A[m].sum()),
            "pct_pt_2t": r5(S["p2"][m].sum() / (S["p2"][m] + S["a2"][m]).sum()) if m.any() else None,
            "net_dz_pp": media(netd * 100, m, A),
            "contingencia_1t": media(sub1, m), "urna_mudou_2t": media(mud2, m), "carga_nova_2t": media(car2, m),
            "sem_rastro_gedai_1t": media(sr1, m), "sem_rastro_gedai_2t": media(sr2, m),
            "maquina_com_alerta": media(malr, m),
            "sem_biometria_1t": r5(np.nansum(sb[m]) / np.nansum(cb[m])) if m.any() else None,
            "sem_biometria_1t_dz_pp": media(sbp_dz * 100, m, A),
            "fecha_apos_17h30_1t": media((fecha > 17 * 60 + 30).astype(float), m & np.isfinite(fecha)),
            "chegada_2t_mediana": sc.hhmm(float(np.nanmedian(rec2[m]))) if m.any() and np.isfinite(rec2[m]).any() else "",
            **({} if g == "controle" else {
                "sig_contingencia_1t": sig_prop(sub1, m), "sig_urna_mudou_2t": sig_prop(mud2, m),
                "sig_carga_nova_2t": sig_prop(car2, m), "sig_sem_rastro_gedai_1t": sig_prop(sr1, m),
                "sig_maquina_com_alerta": sig_prop(malr, m), "sig_sem_biometria_1t": sig_media(sbp, m)})})

    # arquivos da urna (log e RDV): sinalizadas + controles
    sinal_sec = gs["klimek"] | gs["bn0"] | gs["z5"]
    pares, pares_cid = amostra(S, S["g"], {g: gs[g] for g in CIDADE_GRUPOS}, ~sinal_sec, gs["controle"], rng)
    alvos = set(pares) | set(pares.values())
    for d in pares_cid.values():
        alvos |= set(d) | set(d.values())
    alvos.discard(None)
    U = arquivos_urna([ch[j] for j in sorted(alvos)], urna_dir)
    res = {t: {(r[0], r[3]) for r in reserva[1] | reserva[t]} for t in (1, 2)}
    urna_rows = []
    for g, rot in GRUPOS[:-1]:
        if g in SECAO_GRUPOS:
            js = [j for j in pares if gs[g][j]]
            ctl = [pares[j] for j in js if pares[j] is not None]
            rot_ctl = "controle na mesma zona"
        else:
            js, ctl = list(pares_cid[g]), [x for x in pares_cid[g].values() if x is not None]
            rot_ctl = "controle na mesma UF"
        for t in (1, 2):
            a, b = resumo_urna(js, U, S, t, corr, res[t]), resumo_urna(ctl, U, S, t, corr, res[t])
            urna_rows.append({"id": f"{g}-{t}", "grupo": rot, "turno": t, "lado": "sinalizadas", **a})
            urna_rows.append({"id": f"{g}-{t}-c", "grupo": rot, "turno": t, "lado": rot_ctl, **b})

    # lista das seções sinalizadas
    lista = []
    ctl_de = {}
    for d in pares_cid.values():
        ctl_de.update(d)
    ctl_de.update(pares)
    for j in sorted(set(ctl_de)):
        k = ch[j]
        c = corr.get(k, {})
        tipos = [rot for g, rot in GRUPOS[:-1] if gs[g][j] and (g in SECAO_GRUPOS or j in pares_cid[g])]
        r = {"id": f"{ANO}-{k[0]}-{k[1]}-{k[2]}-{k[3]}", "uf": k[0], "regiao": bd.REGIAO.get(k[0], ""), "cod": k[1],
             "municipio": bd.nome_mun(S["nomes"].get(k[1], "")), "zona": k[2], "secao": k[3],
             "tipos": " · ".join(tipos), "aptos": int(A[j]),
             "comp_1t": r5(S["c1"][j] / A[j]), "comp_2t": r5(S["c2"][j] / A[j]),
             "pt_1t": int(S["p1"][j]), "adv_1t": int(S["a1"][j]), "pt_2t": int(S["p2"][j]), "adv_2t": int(S["a2"][j]),
             "bn_2t": int(S["bn2"][j]), "z": r5(S["z"][j]) if np.isfinite(S["z"][j]) else None,
             **{g: int(gs[g][j]) for g in CIDADE_GRUPOS},
             "urna_1t": c.get("urna_1t", ""), "contingencia_1t": c.get("sub_1t"), "urna_2t": c.get("urna_2t", ""),
             "urna_mudou_2t": c.get("urna_mudou_2t"), "carga_nova_2t": c.get("carga_nova_2t"),
             "sem_rastro_gedai": int((sr1[j] == 1) or (sr2[j] == 1)), "maquina_com_alerta": int(malr[j] == 1),
             "sem_biom_1t": r5(sbp[j]) if np.isfinite(sbp[j]) else None,
             "sem_biom_zona_1t": r5(zm[zona[j]]), "chegada_2t": sc.hhmm(float(rec2[j])) if np.isfinite(rec2[j]) else ""}
        cj = ctl_de.get(int(j))
        for t in (1, 2):
            m = U.get((k, t)) or {}
            mc = (U.get((ch[cj], t)) or {}) if cj is not None else {}
            comp = S["c1"][j] if t == 1 else S["c2"][j]
            p, a = (S["p1"][j], S["a1"][j]) if t == 1 else (S["p2"][j], S["a2"][j])
            r[f"t{t}_log_votos"] = m.get("votos")
            r[f"t{t}_log_bate"] = int(m.get("votos") == int(comp)) if "votos" in m else None
            r[f"t{t}_rdv_bate"] = int(tuple(m["rdv"]) == (int(p), int(a), int(comp - p - a))) if m.get("rdv") else None
            r[f"t{t}_nao_biom"] = taxa(m.get("nao_biometrica", 0), m.get("votos", 0)) if m.get("votos") else None
            r[f"t{t}_nao_biom_ctl"] = taxa(mc.get("nao_biometrica", 0), mc.get("votos", 0)) if mc.get("votos") else None
            r[f"t{t}_mesario"] = taxa(m.get("mesario", 0), m.get("votos", 0)) if m.get("votos") else None
            r[f"t{t}_dur_s"] = m.get("dur_mediana")
            r[f"t{t}_dur_s_ctl"] = mc.get("dur_mediana")
            r[f"t{t}_max_10min"] = m.get("max_10min")
            r[f"t{t}_religada"] = int(m["ligada"] > 1) if "ligada" in m else None
            r[f"t{t}_urna"] = ident(m, c, k, t, res[t])
            r[f"t{t}_urnas_log"] = " ".join(m.get("urnas", []))
            r[f"t{t}_assin_falha"] = m.get("assin_falha")
            r[f"t{t}_assin_falha_dia"] = m.get("assin_falha_dia")
            r[f"t{t}_falhas"] = " | ".join(m.get("falhas", []))
            r[f"t{t}_bus"] = m.get("hashes")
        lista.append(r)

    # GEDAI e correspondências por UF
    uf_rows = []
    por = defaultdict(Counter)
    for (t, uf, nome, _), r in maq.items():
        c = por[(t, uf)]
        c["maquinas"] += 1
        for kk in ("linhas", "ERRO", "ALERTA", "assinatura_invalida", "integridade_banco", "banco_restaurado", "sem_perfil", "sem_rede",
                   "madrugada", "corresp", "midias_carga", "midias_votacao"):
            c[kk] += r.get(kk, 0)
    sec_uf = defaultdict(Counter)
    for k, v in corr.items():
        c = sec_uf[k[0]]
        c["secoes"] += 1
        c["contingencia_1t"] += v["sub_1t"]
        c["urna_mudou_2t"] += v["urna_mudou_2t"]
        c["carga_nova_2t"] += v["carga_nova_2t"]
        c["alterada_1t"] += v.get("alt_1t") == "S"
        c["sem_rastro"] += bool(v.get("carga_1t")) and k + (v["carga_1t"],) not in rast
    for (t, uf), c in sorted(por.items()):
        multi = sum(1 for vs in versoes[(t, uf)].values() if len(vs) > 1)
        s_ = sec_uf.get(uf, Counter())
        uf_rows.append({"id": f"{uf}-{t}", "uf": uf, "regiao": bd.REGIAO.get(uf, ""), "turno": int(t[0]), **c,
                        "pacotes": len(versoes[(t, uf)]), "pacotes_multiversao": multi,
                        "urnas_contingencia": cont.get((uf, t), 0), "secoes": s_["secoes"],
                        "contingencia_1t": taxa(s_["contingencia_1t"], s_["secoes"]),
                        "urna_mudou_2t": taxa(s_["urna_mudou_2t"], s_["secoes"]),
                        "carga_nova_2t": taxa(s_["carga_nova_2t"], s_["secoes"]),
                        "alterada_1t": s_["alterada_1t"], "sem_rastro_gedai": s_["sem_rastro"]})

    resumo = {"id": ANO, "secoes_analisadas": n, "logs_gedai": len(maq),
              "gedai_1t_igual": prefixo["igual"], "gedai_1t_acrescimo": prefixo["acrescimo"],
              "gedai_1t_divergente": prefixo["divergente"],
              "secoes_corresp": len(corr), "contingencia_1t": sum(v["sub_1t"] for v in corr.values()),
              "urna_mudou_2t": sum(v["urna_mudou_2t"] for v in corr.values()),
              "carga_nova_2t": sum(v["carga_nova_2t"] for v in corr.values()),
              "assinatura_invalida": sum(r.get("assinatura_invalida", 0) for r in maq.values()),
              "integridade_banco": sum(r.get("integridade_banco", 0) for r in maq.values()),
              "banco_restaurado": sum(r.get("banco_restaurado", 0) for r in maq.values()),
              "maquinas_com_alerta": sum(1 for v in alerta_maq.values() if v),
              "amostra_urna": len(alvos), "sem_biometria_1t": r5(np.nansum(sb) / np.nansum(cb))}
    for t in (1, 2):
        vv = [U.get((k, t)) for k in (ch[j] for j in alvos)]
        vv = [x for x in vv if x and "votos" in x]
        resumo[f"t{t}_urna_lidas"] = len(vv)
        resumo[f"t{t}_urna_erro"] = sum(1 for k in (ch[j] for j in alvos) if "erro" in (U.get((k, t)) or {"erro": 1}))
        resumo.update({f"t{t}_{a}": b for a, b in resumo_urna(sorted(alvos), U, S, t, corr, res[t]).items()})
    for nome, rows in (("seg_grupos", grupos_rows), ("seg_urna", urna_rows), ("seg_secoes", lista),
                       ("seg_uf", uf_rows), ("seg_resumo", [resumo])):
        campos = list(dict.fromkeys(c for r in rows for c in r))
        bd.write_csv(out / f"{nome}.csv", rows, campos)
    camadas(out, data_dir)
    print(json.dumps(resumo, ensure_ascii=False))


def camadas(out_dir, data_dir):
    """seg_camadas.csv: risco, teste, resultado e limite de cada camada, com os números das tabelas seg_*."""
    out, d = Path(out_dir), Path(data_dir)
    rd = lambda f: list(csv.DictReader(open(f, encoding="utf-8")))
    R = rd(out / "seg_resumo.csv")[0]
    G = {r["id"]: r for r in rd(out / "seg_grupos.csv")}
    se = {r["id"]: r for r in rd(d / "secao_serie.csv")}[str(ANO)]
    f = lambda v: float(v) if v not in ("", None) else float("nan")
    pc = lambda v, c=1: "—" if not math.isfinite(f(v)) else f"{f(v) * 100:.{c}f}%".replace(".", ",")
    n = lambda v: "—" if not math.isfinite(f(v)) else f"{f(v):,.0f}".replace(",", ".")
    acima = [G[g]["grupo"].lower() for g, _ in GRUPOS[:-1] if G[g].get("sig_sem_biometria_1t") == "1"]
    cont_acima = [G[g]["grupo"].lower() for g, _ in GRUPOS[:-1] if G[g].get("sig_contingencia_1t") == "1"]
    alerta_acima = [G[g]["grupo"].lower() for g, _ in GRUPOS[:-1] if G[g].get("sig_maquina_com_alerta") == "1"]
    U = {r["id"]: r for r in rd(out / "seg_urna.csv")}
    kl, klc = U.get("klimek-2", {}), U.get("klimek-2-c", {})
    u1, u2 = f(R.get("t1_urna_confere")), f(R.get("t2_urna_confere"))
    rdv1, rdv2 = f(R.get("t1_rdv_bate")), f(R.get("t2_rdv_bate"))
    log1, log2 = f(R.get("t1_log_bate_comp")), f(R.get("t2_log_bate_comp"))
    af = int(f(R.get("t1_assinatura_falha") or 0) + f(R.get("t2_assinatura_falha") or 0))
    afd = int(f(R.get("t1_assinatura_falha_dia") or 0) + f(R.get("t2_assinatura_falha_dia") or 0))
    afp = int(f(R.get("t1_assinatura_pendente") or 0) + f(R.get("t2_assinatura_pendente") or 0))
    gedai_alerta = int(f(R["assinatura_invalida"])) + int(f(R["integridade_banco"]))
    rows = [
        {"camada": "Hardware", "risco": "Urna, mídia ou computador de preparação trocado ou adulterado.",
         "teste": "Urna que votou × urna prevista (todas as seções, 1º turno); urnas gravadas no log do dia × correspondência "
                  "(efetivada no 1º turno, esperada no 2º) e × lista de urnas de contingência da zona (amostra); urna trocada entre turnos.",
         "resultado": f"{n(R['contingencia_1t'])} seções votaram em urna de contingência no 1º turno; {n(R['urna_mudou_2t'])} receberam "
                      f"outra urna no 2º. Nas seções lidas, a urna da correspondência está no log em {pc(u1)} (1º) e {pc(u2)} (2º); "
                      f"urna de contingência registrada em {pc(R.get('t1_urna_contingencia'))} e {pc(R.get('t2_urna_contingencia'))}; "
                      f"urna fora das duas listas: {n(R.get('t1_urna_nao_confere'))} e {n(R.get('t2_urna_nao_confere'))} seções (o log "
                      "mostra a carga oficial da seção; falta a correspondência efetivada do 2º turno para fechar)"
                      + (f"; contingência acima de 1,5 vez o esperado pelo estado (p < 0,01) em: {', '.join(cont_acima)}"
                         if cont_acima else "") + ".",
         "status": "ok" if f(R.get("t1_urna_nao_confere") or 0) + f(R.get("t2_urna_nao_confere") or 0) == 0 and not cont_acima else "atencao",
         "falta": "Integridade física da urna e dos lacres, firmware, chip de segurança: não há dado público por seção."},
        {"camada": "Software", "risco": "Programa diferente do lacrado na urna ou no computador que prepara as mídias.",
         "teste": "Versão do aplicativo e verificações de assinatura registradas no log de cada urna lida; no GEDAI, alertas de "
                  "assinatura inválida e falhas de integridade do banco.",
         "resultado": f"Versões nos logs lidos: {R.get('t1_versoes') or '—'} (1º), {R.get('t2_versoes') or '—'} (2º); seções com falha "
                      f"de verificação de assinatura registrada: {af} ({afd} no dia da eleição); sem nova verificação bem-sucedida do mesmo arquivo depois: {afp}. GEDAI: {n(R['assinatura_invalida'])} avisos de correspondência com assinatura "
                      f"inválida (rejeitadas na entrada) e {n(R['integridade_banco'])} falhas de integridade do banco, seguidas de "
                      f"{n(R.get('banco_restaurado'))} restaurações para a versão anterior, em {n(R['maquinas_com_alerta'])} computadores "
                      "(registrados pelo próprio sistema)"
                      + (f"; mídias geradas nesses computadores acima do esperado pelo estado em: {', '.join(alerta_acima)}" if alerta_acima else "")
                      + ".",
         "status": "alerta" if afp else "ok" if af == 0 and gedai_alerta == 0 else "atencao",
         "falta": "Comparar o binário instalado com o código-fonte lacrado; as assinaturas dos arquivos (.vsc) não foram conferidas aqui."},
        {"camada": "Algoritmo", "risco": "Voto registrado ou contado diferente do digitado.",
         "teste": "Recontagem do RDV × resultado oficial da seção; votos computados no log × comparecimento (amostra, 1º e 2º turnos).",
         "resultado": f"RDV = resultado oficial em {pc(rdv1)} (1º) e {pc(rdv2)} (2º) das seções lidas; log = comparecimento em "
                      f"{pc(log1)} e {pc(log2)}.",
         "status": "ok" if rdv1 == 1 and rdv2 == 1 else "alerta",
         "falta": "RDV, log e boletim são gravados pelo mesmo programa: a recontagem confirma consistência interna, não o que o eleitor "
                  "viu na tela. Não há voto impresso."},
        {"camada": "Cadastro e habilitação", "risco": "Voto em nome de eleitor ausente; cadastro alterado.",
         "teste": "Eleitores habilitados sem biometria (boletins do 1º turno, todas as seções; logs dos dois turnos, amostra) e "
                  "liberações pelo mesário, sinalizadas × controle; aptos diferentes entre turnos.",
         "resultado": f"Sem biometria no 1º turno: {pc(R['sem_biometria_1t'])} do comparecimento"
                      + (f"; acima de 1,5 vez o esperado pelo estado (p < 0,01) em: {', '.join(acima)}" if acima
                         else "; nenhum grupo acima de 1,5 vez o esperado pelo estado (p < 0,01)")
                      + f". Nos logs do 2º turno, habilitação sem biometria nas seções de comparecimento 95%+ e 90%+ para um lado: "
                      f"{pc(kl.get('nao_biometrica'))}, contra {pc(klc.get('nao_biometrica'))} nos controles da mesma zona; liberação pelo "
                      f"mesário: {pc(kl.get('mesario'))} × {pc(klc.get('mesario'))}. {n(se['aptos_diferentes'])} seções com cadastro "
                      "diferente entre turnos.",
         "status": "atencao" if acima else "ok",
         "falta": "Quem votou, de fato, em cada habilitação manual; o cadastro de eleitores por pessoa não é público."},
        {"camada": "Transmissão", "risco": "Boletim interceptado, alterado ou substituído no caminho.",
         "teste": "Seções com mais de um boletim recebido; horário de chegada; rastro das correspondências nos logs do GEDAI.",
         "resultado": f"Mais de um boletim recebido: {pc(R.get('t1_mais_de_um_bu'))} (1º) e {pc(R.get('t2_mais_de_um_bu'))} (2º) das seções "
                      f"lidas. Pausa na chegada dos boletins: {n(se['pausa_min_2t'])} min no 2º turno. Cargas sem rastro nos logs "
                      f"publicados do GEDAI: {pc(G['controle']['sem_rastro_gedai_1t'])} das demais seções.",
         "status": "atencao" if f(se["pausa_min_2t"]) >= 60 else "ok",
         "falta": "Assinatura digital de cada boletim não conferida aqui; registros da rede de transmissão não são públicos."},
        {"camada": "Totalização", "risco": "Soma diferente dos boletins.",
         "teste": "Soma das seções × total de cada município, nos dois turnos; municípios × estados × Brasil.",
         "resultado": f"{n(se['mun_divergentes'])} municípios divergentes em {n(se['mun_conferidos'])}; votos sem seção: {n(se['votos_sem_secao'])}.",
         "status": "ok" if f(se["mun_divergentes"]) == 0 else "alerta",
         "falta": "Nada relevante: a soma é refeita do zero com os arquivos públicos."},
        {"camada": "Auditoria", "risco": "O que não é publicado não pode ser conferido por terceiros.",
         "teste": "Inventário do que já está nos dados abertos do TSE.",
         "resultado": "Publicados: correspondências do 1º turno (esperada e efetivada) e esperada do 2º; logs do GEDAI dos dois turnos; "
                      "boletins web do 1º turno; logs e RDV das urnas do 1º turno. Logs e RDV do 2º turno só no portal de resultados, seção a seção.",
         "status": "pendente",
         "falta": "Correspondência efetivada e boletins web do 2º turno; resultados do teste de integridade (votação paralela) por urna."},
    ]
    for i, r in enumerate(rows):
        r["id"] = str(i + 1)
    bd.write_csv(out / "seg_camadas.csv", rows, ["id", "camada", "risco", "teste", "resultado", "status", "falta"])


if __name__ == "__main__":
    if sys.argv[1] == "camadas":
        camadas(sys.argv[2], sys.argv[3])
    else:
        main(*sys.argv[1:7])
