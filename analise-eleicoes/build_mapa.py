"""Converte a malha municipal projetada (mapshaper) em caminhos SVG prontos para o dashboard.

Entrada: GeoJSON já projetado (Albers) de municípios e de UFs, e o cm.json da API do TSE 2026
(que liga o código TSE ao código IBGE). Saída: data/malha_municipios.json e data/malha_estados.json,
cada linha com o caminho SVG num viewBox de LARGURA de largura.

Uso: python3 -I build_mapa.py <mun_proj.json> <uf_proj.json> <cm.json> <out_dir>
"""
import json
import sys
from pathlib import Path

LARGURA = 1000


def main(mun_path, uf_path, cm_path, out_dir):
    mun = json.load(open(mun_path, encoding="utf-8"))["features"]
    ufs = json.load(open(uf_path, encoding="utf-8"))["features"]
    cm = json.load(open(cm_path, encoding="utf-8"))
    tse = {m["cdi"]: m["cd"] for a in cm["abr"] for m in a["mu"] if m.get("cdi")}

    def rings(geom):
        if geom["type"] == "Polygon":
            return geom["coordinates"]
        return [r for poly in geom["coordinates"] for r in poly]

    xs, ys = [], []
    for f in ufs:
        for r in rings(f["geometry"]):
            xs += [p[0] for p in r]
            ys += [p[1] for p in r]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    k = LARGURA / (x1 - x0)
    altura = round((y1 - y0) * k, 1)

    def path(geom):
        out = []
        for r in rings(geom):
            pts = [(round((p[0] - x0) * k, 1), round((y1 - p[1]) * k, 1)) for p in r]
            if len(pts) < 3:
                continue
            seg = [f"M{pts[0][0]:g} {pts[0][1]:g}"]
            px, py = pts[0]
            rel = []
            for x, y in pts[1:-1] if pts[0] == pts[-1] else pts[1:]:
                dx, dy = round(x - px, 1), round(y - py, 1)
                if dx or dy:
                    rel.append(f"{dx:g} {dy:g}")
                px, py = x, y
            out.append(seg[0] + ("l" + " ".join(rel) if rel else "") + "z")
        return "".join(out)

    linhas, sem = [], []
    for f in mun:
        ibge = f["properties"]["ibge"]
        cod = tse.get(ibge)
        if not cod:
            sem.append((ibge, f["properties"]["nome"]))
            continue
        linhas.append({"cod": cod, "ibge": ibge, "uf": f["properties"]["uf"], "d": path(f["geometry"])})
    estados = [{"uf": f["properties"]["uf"], "d": path(f["geometry"])} for f in ufs]
    out = Path(out_dir)
    meta = {"largura": LARGURA, "altura": altura}
    json.dump({"meta": meta, "rows": linhas}, open(out / "malha_municipios.json", "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
    json.dump({"meta": meta, "rows": estados}, open(out / "malha_estados.json", "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
    faltam = set(tse.values()) - {r["cod"] for r in linhas}
    print(f"{len(linhas)} municípios no mapa; sem código TSE: {sem}; TSE sem polígono: {len(faltam)}; viewBox {LARGURA}x{altura}")


if __name__ == "__main__":
    main(*sys.argv[1:5])
