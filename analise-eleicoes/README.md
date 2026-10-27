# Segundo Turno em Números

Comparativo 1º × 2º turno das eleições presidenciais de 2002 a 2026 (Brasil, regiões, UFs e os 5.570 municípios),
com mapa municipal, cenários de transferência, análise da 3ª via e auditoria estatística. Só dados do TSE,
exceto a coluna de apoio formal no 2º turno (`APOIO` em `alinhamento.py`), que é hipótese testada contra os dados.

## Scripts

| Script | Gera |
|---|---|
| `build_dataset.py` | `uf.csv`, `cenarios.csv`, `regressao.csv`, `viradas.csv`, `top100*.csv`, `quedas*.csv` (top 100 quedas de abstenção, nulos e brancos), `conversao_serie.csv` (sinais de conversão e de perda), `porte.csv`, `mapa_<ano>.csv`, `hist_<UF>.csv` |
| `build_mapa.py` | `malha_municipios.json`, `malha_estados.json` (caminhos SVG pré-projetados) |
| `auditoria.py` | `auditoria_serie.csv`, `auditoria_hist.csv`, `auditoria_outliers.csv`, `auditoria_estados.csv` |
| `alinhamento.py` | `bancadas.csv`, `eleitores_3a_via.csv` |
| `consistencia.py` | `consistencia_serie.csv`, `consistencia_locais.csv`, `consistencia_extremos.csv` (identidades contábeis, cruzamento 2026 dados abertos × API, desvios locais, extremos) |
| `colegio.py` | `colegio.csv`, `colegio_uf.csv`, `saldos.csv` (vitória líquida por UF/região, colégio pelo 1º e pelo 2º turno, sistemas alternativos, swing para virar) |
| `secao.py` | `secao_serie.csv`, `secao_transicao.csv`, `secao_uf.csv`, `secao_tempo.csv`, `secao_modelo.csv`, `secao_extremos.csv`, `secao_dist.csv` (testes com as ~500 mil seções de 2018, 2022 e 2026) |
| `razao_biometria.py` | `razao_ganho.csv`, `biometria_teste.csv`, `biometria_cidade.csv` (votos ganhos pelo PT ÷ votos ganhos pelo adversário por cidade, 2002–2026, e a relação com o voto sem biometria em 2026: bweb do 1º turno por cidade e logs de urna dos dois turnos por seção) |
| `seguranca.py` | `seg_resumo.csv`, `seg_camadas.csv`, `seg_grupos.csv`, `seg_urna.csv`, `seg_secoes.csv`, `seg_uf.csv` (segurança em camadas: seções e cidades sinalizadas × correspondências, logs do GEDAI, boletins de urna, logs das urnas e RDV, 2026) |
| `build_insights.py` | `insights.json` (leituras em texto, todos os números tirados das tabelas) |

`dashboard/` tem a página do dashboard (tipo Dashboard do claude.ai): `index.html`, `core.js`, `mapa.js`, `abas.js`, `auditoria.js`, `liquida.js`, `secoes.js`, `seguranca.js`.

## Fontes

- 2002–2022: dados abertos do TSE em `https://cdn.tse.jus.br/estatistica/sead/odsele/`:
  `detalhe_votacao_munzona_<ano>.zip`, `votacao_partido_munzona_<ano>.zip`, `consulta_cand_<ano>.zip`.
- 2026: `votacao_partido_munzona_2026.zip` (1º turno, todos os cargos) e a API de resultados
  `https://resultados.tse.jus.br/oficial/ele2026/<cd>/dados/<uf>/<uf>[<mun>]-c<cargo>-e00<cd>-u.json`
  (6257/6258 presidente, 6259/6260 cargos estaduais) e `.../6258/config/mun-e006258-cm.json` (municípios e código IBGE).
  `build_dataset.py` confere que a soma dos municípios bate com o total oficial de cada UF.
- Segurança (2026), dados abertos `https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/`: `correspesp/CESP_<t>_<UF>_*.zip`,
  `correspefet/CEFT_1t_<UF>_*.zip`, `logsgedai/log_gedai_<t>_<UF>_*.zip`, `buweb/bweb_1t_<UF>_*.zip`; e, por seção, o portal
  `https://resultados.tse.jus.br/oficial/ele2026/arquivo-urna/<pleito>/dados/<uf>/<mun>/<zona>/<secao>/` (3220 = 1º turno,
  3221 = 2º): `p00<pleito>-<uf>-m<mun>-z<zona>-s<secao>-aux.json` lista o hash e os arquivos (`-log.jez`, `-rdv.dat`, `-bu.dat`).
- Malha: IBGE 2024 via geobr (Ipea), `municipality_2024_simplified.gpkg` por UF, simplificada e projetada com mapshaper.

## Reproduzir

```
python3 -I build_dataset.py <od_dir> <api_dir> <mun_dir> data
python3 -I build_mapa.py <mun_proj.json> <uf_proj.json> <mun_dir>/cm.json data
python -I auditoria.py <od_dir> <api_dir> <mun_dir> data            # numpy, scipy
python -I alinhamento.py <od_dir> <api_dir> <mun_dir> <apiuf_dir> data  # numpy
python -I consistencia.py <od_dir> <api_dir> <mun_dir> <detalhe_munzona_2026.zip> data  # numpy
python3 -I colegio.py <od_dir> <apiuf_dir> data
python -I secao.py <od_dir> <api_dir> <mun_dir> <secao_dir> data  # numpy, scipy
python -I seguranca.py <secao_dir> <seg_raw_dir> <bweb_dir> data data <cache_dir>  # numpy; curl para o portal
python -I razao_biometria.py <bweb_dir> data  # depois de seguranca.py; numpy, scipy
python3 -I build_insights.py data
```

`<secao_dir>/<ano>/`: `detalhe.zip` (detalhe_votacao_secao_<ano>.zip) e `votos.zip` (votacao_secao_<ano>_BR.zip). `<od_dir>`: zips do TSE. `<api_dir>`: `<uf>-6257.json` e `<uf>-6258.json`. `<mun_dir>`: `cm.json` e
`files/<uf><mun>-<cd>.json`. `<apiuf_dir>`: `<uf>-6259-<cargo>.json` e `<uf>-6260-0003.json`.
`<seg_raw_dir>`: os zips de correspondências e de logs do GEDAI. `<bweb_dir>`: `pres_1t_<UF>.csv` (`bweb_presidente.py`), só as linhas de Presidente
de cada boletim web (extraídas em streaming do zip do TSE, uma por seção). `<cache_dir>`: métricas de log e RDV já lidas.

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
- Colégio, swing para virar: metade da margem do estado decisivo, em p.p. dos válidos, aplicada a todos os estados. O "mínimo
  absoluto" de votos concentra-se em estados pequenos e não é cenário plausível.
- Colégio pelo 1º turno: o mais votado do 1º turno leva o estado; sem maioria haveria 2º turno. Pelo 2º turno, como comparação.
- Conversão da 3ª via necessária para o resultado: os votos que os finalistas somaram além da 3ª via (abstenção, brancos e
  nulos recuperados) vão para cada lado na proporção PT × adversário do 1º turno de cada cidade (UF, região e Brasil somam
  cidade a cidade); conversão = (votos ganhos − parte dos recuperados) ÷ 3ª via. Acima de 100%: improvável pela regra;
  90–100%: muito alto; cidades com 3ª via abaixo de 100 votos ficam sem avaliação.
- Perdas de votos: saída = alta de abstenção + brancos + nulos. A perda de um finalista só se explica sem troca de lado se a
  saída cobre a perda e o oponente não ganhou mais que 3ª via + recuperados; senão, a diferença é o piso de eleitores que
  trocaram de lado.
- Seções: transições por Goodman em cada UF (com e sem restrição de 0 a 100%) e regressão dentro da zona eleitoral; associação
  entre seções, não voto individual.
