# Segundo Turno em Números

Comparativo 1º × 2º turno das eleições presidenciais de 2018, 2022 e 2026: Brasil, regiões, UFs e municípios.

- `build_dataset.py`: lê o TSE e gera as tabelas em `data/`.
- `build_insights.py`: gera `data/insights.json` (leituras em texto) a partir das tabelas.
- `dashboard/index.html`: a página do dashboard (tipo Dashboard do claude.ai), que lê os arquivos de `data/`.

## Fontes

- 2018 e 2022: dados abertos do TSE, `detalhe_votacao_munzona_<ano>.zip` e `votacao_partido_munzona_<ano>.zip`
  (`https://cdn.tse.jus.br/estatistica/sead/odsele/...`).
- 2026: API de resultados do TSE, eleição 6257 (1º turno) e 6258 (2º turno):
  `https://resultados.tse.jus.br/oficial/ele2026/<cd>/dados/<uf>/<uf>[<mun>]-c0001-e00<cd>-u.json`,
  e a lista de municípios em `.../ele2026/6258/config/mun-e006258-cm.json`.
  O script confere que a soma dos municípios bate com o total oficial de cada UF.

## Reproduzir

```
python3 -I build_dataset.py <dir_zips_tse> <dir_json_ufs_2026> <dir_municipios_2026> data
python3 -I build_insights.py data
```

`<dir_municipios_2026>` contém `cm.json` e `files/<uf><mun>-<cd>.json`.

## Definições

- Candidatos: PT = Haddad (2018), Lula (2022, 2026); direita = Bolsonaro (2018, 2022), Flávio (2026).
- 3ª via = válidos do 1º turno fora dos dois finalistas.
- Saldo recuperado (Δ) = (abstenção + brancos + nulos no 1º) − (o mesmo no 2º).
- Cenários: o PT leva X% da 3ª via; Y = (válidos do 2º/2 − PT no 1º − X·3ª via) / Δ.
- Regressão: por município, ponderada por eleitores, `ganho_PT/aptos = c + X·(3ª via/aptos) + Y·(Δ/aptos)`.

Tudo é saldo líquido; o modelo supõe que ninguém trocou de finalista entre os turnos.
