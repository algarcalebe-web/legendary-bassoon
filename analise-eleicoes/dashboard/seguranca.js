// Aba Segurança: camadas (hardware, software, algoritmo, cadastro, transmissão, totalização, auditoria) e o cruzamento
// das seções e cidades sinalizadas com correspondências, logs do GEDAI, boletins de urna, logs das urnas e RDV. Só 2026.
(() => {
  const { $, $$, F, isNum, tbl, failed, failLine, rowsTable, st, nf0, nf1, UF_NOME, REG } = window.ST;
  st.segTipo = 'todas';
  st.segSort = { k: 'aptos', d: -1 };
  const TIPO_SEL = {
    todas: () => true,
    klimek: (r) => r.tipos.includes('95%'),
    bn0: (r) => r.tipos.includes('zerados'),
    z5: (r) => r.tipos.includes('z >'),
    urna: (r) => r.t1_urna === 'nao_confere' || r.t2_urna === 'nao_confere' || r.t1_rdv_bate === '0' || r.t2_rdv_bate === '0' || r.t1_log_bate === '0' || r.t2_log_bate === '0'
      || +r.t1_assin_falha > 0 || +r.t2_assin_falha > 0,
  };
  const num = (k) => (r) => (isNum(r[k]) ? +r[k] : -1e9);
  const CHAVE = { municipio: (r) => r.municipio, uf: (r) => r.uf, aptos: num('aptos'), comp_2t: num('comp_2t'), pt2: (r) => +r.pt_2t / Math.max(+r.pt_2t + +r.adv_2t, 1),
    z: (r) => (isNum(r.z) ? Math.abs(+r.z) : -1), sem_biom: (r) => (isNum(r.sem_biom_1t) ? +r.sem_biom_1t - +r.sem_biom_zona_1t : -1e9),
    nb2: (r) => (isNum(r.t2_nao_biom) ? +r.t2_nao_biom - (isNum(r.t2_nao_biom_ctl) ? +r.t2_nao_biom_ctl : 0) : -1e9), mes2: num('t2_mesario'),
    dur2: (r) => (isNum(r.t2_dur_s) ? -+r.t2_dur_s : -1e9), max2: num('t2_max_10min'), chegada: (r) => r.chegada_2t || '' };
  const STATUS_CLS = { ok: 'dispensa', atencao: 'viavel', alerta: 'inviavel', limite: '', pendente: '' };
  const STATUS_ROT = { ok: 'Sem anomalia nos testes', atencao: 'Atenção', alerta: 'Anomalia', limite: 'Não testável com dados públicos', pendente: 'Dado não publicado' };
  const sim = (v) => (v === '1' ? 'sim' : v === '0' ? 'não' : '—');
  const ok = (v) => (v === '1' ? 'confere' : v === '0' ? 'não confere' : '—');
  const URNA = { confere: 'confere', contingencia: 'contingência', nao_confere: 'não confere' };
  const urnaSt = (v) => URNA[v] || '—';
  const assin = (r) => { const n = +r.t1_assin_falha + +r.t2_assin_falha; return n > 0 ? `${n} (${[r.t1_falhas, r.t2_falhas].filter(Boolean).join(' | ')})` : '—'; };
  const seg = (v) => (isNum(v) ? nf0.format(+v) + ' s' : '—');

  function aviso(p) {
    $('#seg-ano').textContent = p.ano === '2026' ? '' : `Dados técnicos só de 2026 (eleição escolhida: ${p.ano}).`;
  }

  function camadas() {
    const t = tbl('seg_camadas');
    const tb = $('#seg-camadas tbody');
    if (!t) { if (failed('seg_camadas')) failLine(tb); return; }
    rowsTable(tb, t.rows, [['camada', F.txt, 0, 1], ['risco', F.txt, 0, 1], ['teste', F.txt, 0, 1], ['resultado', F.txt, 0, 1], ['status', (v) => STATUS_ROT[v] || v, 0, 1],
      ['falta', F.txt, 0, 1]], (tr, r) => { const c = STATUS_CLS[r.status]; if (c) tr.children[4].classList.add(c); });
  }

  function kpis() {
    const t = tbl('seg_resumo');
    if (!t) return;
    const r = t.rows[0];
    const put = (id, field, text) => window.ST.fill($(id), 'seg_resumo', field, r.id, text);
    put('#sk-cont', 'contingencia_1t', F.int(r.contingencia_1t));
    put('#sk-mud', 'urna_mudou_2t', F.int(r.urna_mudou_2t));
    put('#sk-gedai', 'logs_gedai', F.int(r.logs_gedai));
    put('#sk-alerta', 'maquinas_com_alerta', F.int(r.maquinas_com_alerta));
    put('#sk-amostra', 'amostra_urna', F.int(r.amostra_urna));
    put('#sk-biom', 'sem_biometria_1t', F.pct(r.sem_biometria_1t));
  }

  function grupos() {
    const t = tbl('seg_grupos');
    const tb = $('#seg-grupos tbody');
    if (!t) { if (failed('seg_grupos')) failLine(tb); return; }
    const ctl = t.by.get('controle') || {};
    rowsTable(tb, t.rows, [['grupo', F.txt, 0, 1], ['secoes', F.int], ['eleitores', F.int], ['pct_pt_2t', F.pct], ['net_dz_pp', (v) => (isNum(v) ? F.pp(+v / 100) : '—'), 1],
      ['contingencia_1t', F.pct], ['urna_mudou_2t', F.pct], ['carga_nova_2t', F.pct], ['sem_rastro_gedai_1t', F.pct], ['maquina_com_alerta', F.pct],
      ['sem_biometria_1t', F.pct], ['sem_biometria_1t_dz_pp', (v) => (isNum(v) ? F.pp(+v / 100) : '—'), 1], ['fecha_apos_17h30_1t', F.pct], ['chegada_2t_mediana', F.txt]], (tr, r) => {
      if (r.id === 'controle') { tr.style.borderTop = '2px solid var(--color-border-line)'; return; }
      // acima de 1,5× o controle: destaque
      [['contingencia_1t', 5], ['urna_mudou_2t', 6], ['carga_nova_2t', 7], ['sem_rastro_gedai_1t', 8], ['maquina_com_alerta', 9], ['sem_biometria_1t', 10]].forEach(([k, i]) => {
        if (isNum(r[k]) && isNum(ctl[k]) && +ctl[k] > 0 && +r[k] > 1.5 * +ctl[k]) tr.children[i].classList.add('neg');
      });
    });
  }

  function urna() {
    const t = tbl('seg_urna');
    const tb = $('#seg-urna tbody');
    if (!t) { if (failed('seg_urna')) failLine(tb); return; }
    rowsTable(tb, t.rows, [['grupo', (v, r) => (r.lado === 'sinalizadas' ? v : ''), 0, 1], ['turno', (v) => `${v}º`, 0, 1], ['lado', F.txt, 0, 1], ['secoes_lidas', F.int],
      ['log_bate_comp', F.pct], ['rdv_bate', F.pct], ['urna_confere', F.pct], ['urna_contingencia', F.pct], ['urna_nao_confere', F.int],
      [null, (r) => (isNum(r.assinatura_falha) ? `${F.int(r.assinatura_falha)} / ${F.int(r.assinatura_pendente)}` : '—')], ['mais_de_um_bu', F.pct],
      ['nao_biometrica', F.pct], ['mesario', F.pct], ['dur_mediana_s', seg], ['lt20s', F.pct], ['max_10min_media', (v) => (isNum(v) ? nf1.format(+v) : '—')],
      ['religada', F.pct], ['erros_por_secao', (v) => (isNum(v) ? nf1.format(+v) : '—')]], (tr, r) => {
      if (r.lado === 'sinalizadas') tr.style.borderTop = '2px solid var(--color-border-line)';
      else tr.classList.add('mut');
      if (isNum(r.rdv_bate) && +r.rdv_bate < 1) tr.children[5].classList.add('neg');
      if (+r.urna_nao_confere > 0) tr.children[8].classList.add('neg');
      if (+r.assinatura_pendente > 0) tr.children[9].classList.add('neg');
    });
  }

  function secoes(p) {
    const t = tbl('seg_secoes');
    const tb = $('#seg-sec tbody');
    $('#f-seg-tipo').value = st.segTipo;
    if (!t) { if (failed('seg_secoes')) failLine(tb); return; }
    const { k, d } = st.segSort;
    $$('#seg-sec thead th').forEach((th) => th.setAttribute('aria-sort', th.dataset.sort === k ? (d > 0 ? 'ascending' : 'descending') : 'none'));
    const fs = TIPO_SEL[st.segTipo] || TIPO_SEL.todas;
    const all = t.rows.filter((r) => window.ST.noFiltro(r, p) && fs(r));
    const ch = CHAVE[k] || CHAVE.aptos;
    all.sort((a, b) => { const x = ch(a), y = ch(b); return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : (x || 0) - (y || 0)) * d; });
    $('#seg-sec-n').textContent = `${nf0.format(all.length)} seções${all.length > 500 ? ', mostrando as 500 primeiras na ordem escolhida' : ''}. Recorte: ${p.uf ? UF_NOME[p.uf] : REG[p.reg]}.`;
    const par = (a, b, fm) => (r) => `${fm(r[a])} / ${fm(r[b])}`;
    rowsTable(tb, all.slice(0, 500), [['municipio', F.txt, 0, 1], ['uf', F.txt, 0, 1], [null, (r) => `${r.zona} / ${r.secao}`, 1], ['tipos', F.txt, 0, 1], ['aptos', F.int],
      ['comp_2t', F.pct], [null, (r) => F.pct(+r.pt_2t / Math.max(+r.pt_2t + +r.adv_2t, 1))], ['bn_2t', F.int], ['z', (v) => (isNum(v) ? nf1.format(+v) : '—')],
      ['urna_mudou_2t', sim, 0, 1], ['contingencia_1t', sim, 0, 1], [null, par('sem_biom_1t', 'sem_biom_zona_1t', F.pct)], [null, par('t2_nao_biom', 't2_nao_biom_ctl', F.pct)],
      ['t2_mesario', F.pct], [null, par('t2_dur_s', 't2_dur_s_ctl', seg)], ['t2_max_10min', F.int], [null, (r) => `${ok(r.t1_log_bate)} / ${ok(r.t2_log_bate)}`, 0, 1],
      [null, (r) => `${ok(r.t1_rdv_bate)} / ${ok(r.t2_rdv_bate)}`, 0, 1], [null, (r) => `${urnaSt(r.t1_urna)} / ${urnaSt(r.t2_urna)}`, 0, 1], [null, assin, 0, 1],
      ['chegada_2t', F.txt]], (tr, r) => {
      if (isNum(r.sem_biom_1t) && +r.sem_biom_1t > 2 * +r.sem_biom_zona_1t && +r.sem_biom_1t > 0.1) tr.children[11].classList.add('neg');
      if (isNum(r.t2_nao_biom) && isNum(r.t2_nao_biom_ctl) && +r.t2_nao_biom > 2 * +r.t2_nao_biom_ctl && +r.t2_nao_biom > 0.1) tr.children[12].classList.add('neg');
      [16, 17, 18].forEach((i) => { if (tr.children[i].textContent.includes('não confere')) tr.children[i].classList.add('neg'); });
      if (+r.t1_assin_falha > 0 || +r.t2_assin_falha > 0) tr.children[19].classList.add('viavel');
    });
  }

  function porUf(p) {
    const t = tbl('seg_uf');
    const tb = $('#seg-uf tbody');
    if (!t) { if (failed('seg_uf')) failLine(tb); return; }
    const list = t.rows.filter((r) => (p.reg === 'BR' || r.regiao === p.reg) && (!p.uf || r.uf === p.uf))
      .sort((a, b) => a.uf.localeCompare(b.uf) || +a.turno - +b.turno);
    rowsTable(tb, list, [['uf', F.txt, 0, 1], ['turno', (v) => `${v}º`, 0, 1], ['maquinas', F.int], ['linhas', F.int], ['ERRO', F.int], ['ALERTA', F.int],
      ['assinatura_invalida', F.int], ['integridade_banco', F.int], ['sem_perfil', F.int], ['madrugada', F.int], ['pacotes_multiversao', F.int],
      ['urnas_contingencia', F.int], ['contingencia_1t', F.pct], ['urna_mudou_2t', F.pct], ['carga_nova_2t', F.pct], ['sem_rastro_gedai', F.int]], (tr, r) => {
      if (+r.assinatura_invalida > 0) tr.children[6].classList.add('neg');
      if (+r.integridade_banco > 0) tr.children[7].classList.add('neg');
      if (r.turno === '1' || r.turno === 1) tr.style.borderTop = '2px solid var(--color-border-line)';
    });
  }

  window.ST.abas.seguranca = (p) => {
    aviso(p);
    kpis();
    camadas();
    grupos();
    urna();
    secoes(p);
    porUf(p);
  };
  window.ST.init.seguranca = () => {
    $('#f-seg-tipo').addEventListener('change', (e) => { st.segTipo = e.target.value; window.ST.draw(); });
    $('#seg-sec thead').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      st.segSort = { k, d: st.segSort.k === k ? -st.segSort.d : (k === 'municipio' || k === 'uf' || k === 'chegada' ? 1 : -1) };
      window.ST.draw();
    });
    window.ST.clicavel($('#seg-sec tbody'));
  };
})();
