# Segundo Turno em Números

Comparativo 1º × 2º turno das eleições presidenciais de 2002 a 2026 (Brasil, regiões, UFs e os 5.570 municípios),
com mapa municipal, cenários de transferência, análise da 3ª via e auditoria estatística. Só dados do TSE,
exceto a coluna de apoio formal no 2º turno (`APOIO` em `alinhamento.py`), que é hipótese testada contra os dados.

## Scripts

| Script | Gera |
|---|---|
| `build_dataset.py` | `uf.csv`, `cenarios.csv`, `regressao.csv`, `viradas.csv`, `top100*.csv`, `porte.csv`, `mapa_<ano>.csv`, `hist_<UF>.csv` |
| `build_mapa.py` | `malha_municipios.json`, `malha_estados.json` (caminhos SVG pré-projetados) |
| `auditoria.py` | `auditoria_serie.csv`, `auditoria_hist.csv`, `auditoria_outliers.csv`, `auditoria_estados.csv` |
| `alinhamento.py` | `bancadas.csv`, `eleitores_3a_via.csv` |
| `consistencia.py` | `consistencia_serie.csv`, `consistencia_locais.csv`, `consistencia_extremos.csv` (identidades contábeis, cruzamento 2026 dados abertos × API, desvios locais, extremos) |
| `colegio.py` | `colegio.csv`, `colegio_uf.csv`, `saldos.csv` (vitória líquida por UF/região e sistemas de apuração alternativos) |
| `build_insights.py` | `insights.json` (leituras em texto, todos os números tirados das tabelas) |

`dashboard/` tem a página do dashboard (tipo Dashboard do claude.ai): `index.html`, `core.js`, `mapa.js`, `abas.js`, `auditoria.js`, `liquida.js`.

## Fontes

- 2002–2022: dados abertos do TSE em `https://cdn.tse.jus.br/estatistica/sead/odsele/`:
  `detalhe_votacao_munzona_<ano>.zip`, `votacao_partido_munzona_<ano>.zip`, `consulta_cand_<ano>.zip`.
- 2026: `votacao_partido_munzona_2026.zip` (1º turno, todos os cargos) e a API de resultados
  `https://resultados.tse.jus.br/oficial/ele2026/<cd>/dados/<uf>/<uf>[<mun>]-c<cargo>-e00<cd>-u.json`
  (6257/6258 presidente, 6259/6260 cargos estaduais) e `.../6258/config/mun-e006258-cm.json` (municípios e código IBGE).
  `build_dataset.py` confere que a soma dos municípios bate com o total oficial de cada UF.
- Malha: IBGE 2024 via geobr (Ipea), `municipality_2024_simplified.gpkg` por UF, simplificada e projetada com mapshaper.

## Reproduzir

```
python3 -I build_dataset.py <od_dir> <api_dir> <mun_dir> data
python3 -I build_mapa.py <mun_proj.json> <uf_proj.json> <mun_dir>/cm.json data
python -I auditoria.py <od_dir> <api_dir> <mun_dir> data            # numpy, scipy
python -I alinhamento.py <od_dir> <api_dir> <mun_dir> <apiuf_dir> data  # numpy
python -I consistencia.py <od_dir> <api_dir> <mun_dir> <detalhe_munzona_2026.zip> data  # numpy
python3 -I colegio.py <od_dir> <apiuf_dir> data
python3 -I build_insights.py data
```

`<od_dir>`: zips do TSE. `<api_dir>`: `<uf>-6257.json` e `<uf>-6258.json`. `<mun_dir>`: `cm.json` e
`files/<uf><mun>-<cd>.json`. `<apiuf_dir>`: `<uf>-6259-<cargo>.json` e `<uf>-6260-0003.json`.

## Definições

- PT: Lula (2002, 2006, 2022, 2026), Dilma (2010, 2014), Haddad (2018). Adversário ("dir" nos campos):
  Serra (2002, 2010), Alckmin (2006), Aécio (2014), Bolsonaro (2018, 2022), Flávio (2026).
- 3ª via = válidos do 1º turno fora dos dois finalistas. Nulos inclui nulos técnicos e anulados.
- Saldo recuperado = queda de abstenção + brancos + nulos do 1º para o 2º turno; total disponível = 3ª via + saldo.
- Cenários: o candidato leva X% da 3ª via; % do restante = (válidos do 2º/2 − votos no 1º − X·3ª via) ÷ (total disponível − X·3ª via).
- Regressões ecológicas (Goodman) por município, ponderadas pelo eleitorado. Tudo é saldo líquido.
- Crescimento líquido (net) = ganho do PT − ganho do adversário do 1º para o 2º turno = saldo do 2º − saldo do 1º.
- Vitória líquida = votos do vencedor − votos do perdedor no 2º turno, por UF, região e Brasil.
- Colégio: cada UF pesa deputados federais eleitos naquele ano (contados nos dados do TSE) + 3 senadores; quem vence a UF
  leva o peso todo. "Votos para virar" = menor número de eleitores que, trocando de lado, inverteria o resultado.
