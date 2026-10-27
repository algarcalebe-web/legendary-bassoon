"""Boletim de urna web (bweb) do TSE: lê o CSV de dentro do zip em streaming, pela stdin, e grava uma linha por seção
com os campos de Presidente usados em seguranca.py (sem baixar o zip inteiro para o disco).

Uso: curl -s <url bweb_1t_<UF>_*.zip> | python3 -I bweb_presidente.py <bweb_dir>/pres_1t_<UF>.csv
"""
import struct
import sys
import zlib

COLS = ["SG_UF", "CD_MUNICIPIO", "NR_ZONA", "NR_SECAO", "NR_LOCAL_VOTACAO", "QT_APTOS", "QT_COMPARECIMENTO",
        "DS_TIPO_URNA", "NR_URNA_EFETIVADA", "CD_CARGA_1_URNA_EFETIVADA", "CD_CARGA_2_URNA_EFETIVADA",
        "CD_FLASHCARD_URNA_EFETIVADA", "DT_CARGA_URNA_EFETIVADA", "DS_SECOES_AGREGADAS", "DT_ABERTURA",
        "DT_ENCERRAMENTO", "QT_ELEI_BIOM_SEM_HABILITACAO", "DT_EMISSAO_BU", "DT_BU_RECEBIDO"]


def main():
    src, out = sys.stdin.buffer, open(sys.argv[1], "w", encoding="utf-8")
    hdr = src.read(30)
    assert hdr[:4] == b"PK\x03\x04", hdr[:4]
    nlen, xlen = struct.unpack("<HH", hdr[26:30])
    src.read(nlen + xlen)
    d = zlib.decompressobj(-15)
    resto, h, vistos = b"", None, set()
    out.write(";".join(COLS) + "\n")
    while True:
        chunk = src.read(1 << 20)
        if not chunk:
            break
        txt = resto + d.decompress(chunk)
        linhas = txt.split(b"\n")
        resto = linhas.pop()
        for ln in linhas:
            r = [c.strip('"') for c in ln.decode("latin-1").rstrip("\r").split(";")]
            if h is None:
                h = {c: i for i, c in enumerate(r)}
                continue
            if r[h["CD_CARGO_PERGUNTA"]] != "1":
                continue
            k = (r[h["SG_UF"]], r[h["CD_MUNICIPIO"]], r[h["NR_ZONA"]], r[h["NR_SECAO"]])
            if k in vistos:
                continue
            vistos.add(k)
            out.write(";".join(r[h[c]] for c in COLS) + "\n")
        if d.eof:
            break
    out.close()
    print(sys.argv[1], len(vistos), file=sys.stderr)


main()
