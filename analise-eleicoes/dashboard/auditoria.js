// Abas 3ª via (bancadas, origem e transferência) e auditoria estatística.
(() => {
  const { $, F, cls, isNum, tbl, failed, failLine, rowsTable, NOMES, ANOS, st, nf0, tipAt } = window.ST;
  st.audVar = 'd_abst';
  st.flag = 'todas';
  st.flagSort = { k: 'exc', d: -1 };
  const PERDA_CURTO = { saida_caiu: 'troca: abstenção caiu', perda_maior: 'troca: perda > saída', oponente_acima: 'troca: oponente acima', explicavel: 'explicável' };
  const FLAG_SEL = {
    todas: (r) => ['pt_acima', 'dir_acima', 'pt_alerta', 'dir_alerta'].includes(r.flag_conv) || +r.troca_min_pt > 0 || +r.troca_min_dir > 0,
    pt_acima: (r) => r.flag_conv === 'pt_acima', pt_alerta: (r) => r.flag_conv === 'pt_alerta', pt_improv: (r) => r.flag_conv === 'pt_improv',
    dir_acima: (r) => r.flag_conv === 'dir_acima', dir_alerta: (r) => r.flag_conv === 'dir_alerta', dir_improv: (r) => r.flag_conv === 'dir_improv',
    troca_dir: (r) => +r.troca_min_dir > 0, troca_pt: (r) => +r.troca_min_pt > 0,
    perda_pt: (r) => !!r.flag_perda_pt, perda_dir: (r) => !!r.flag_perda_dir,
    explicavel: (r) => r.flag_perda_pt === 'explicavel' || r.flag_perda_dir === 'explicavel',
  };
  const CHAVE = { municipio: (r) => r.municipio, uf: (r) => r.uf, aptos: (r) => +r.aptos, terceira_via: (r) => +r.terceira_via, rec_pt: (r) => +r.rec_pt,
    rec_dir: (r) => +r.rec_dir, rec_ter: (r) => +r.rec_ter, ganho_pt: (r) => +r.ganho_pt, ganho_dir: (r) => +r.ganho_dir, conv_pt: (r) => +r.x_levou_pt, conv_dir: (r) => -r.x_levou_pt,
    exc: (r) => +r.exc_pt + +r.exc_dir, troca: (r) => +r.troca_min_pt + +r.troca_min_dir, venc: (r) => r.venc_2t };
  const fora = (v) => isNum(v) && (+v < -0.05 || +v > 1.05);
  const pctF = (v) => F.pct(v);

  function terceira(p) {
    window.ST.leituras('#t3-leituras', (x) => x.id === 'aud-3via' || x.id === 'aud-conversao' || x.id === 'goias');
    const n = NOMES[p.ano];
    $('#t3-banc-h').textContent = `Bancadas por candidato, ${p.ano}`;
    $('#t3-eleit-h').textContent = `Eleitores de cada candidato em ${p.ano}: de onde vinham e para onde foram`;
    const apoio = (v) => ({ PT: `apoiou ${n.pt}`, ADV: `apoiou ${n.dir}`, neutro: 'neutro', 'sem registro': 'sem registro', '—': '—' }[v] || v);
    const bc = tbl('bancadas');
    if (bc) {
      rowsTable($('#t3-banc tbody'), bc.rows.filter((r) => String(r.ano) === p.ano && (r.grupo === 'PT' || r.grupo === 'ADV' || r.grupo === 'OUTROS' || +r.pct_pres_1t >= 0.001)),
        [['candidato', F.txt, 0, 1], ['partido', F.txt, 0, 1], ['coligacao', F.txt, 0, 1], ['pct_pres_1t', pctF], ['apoio_2t', (v, r) => (r.grupo === 'PT' || r.grupo === 'ADV' ? 'finalista' : apoio(v)), 0, 1],
          ['deputados', F.int], ['senadores', F.int], ['governadores', F.int], ['pct_votos_dep', pctF]]);
    } else if (failed('bancadas')) failLine($('#t3-banc tbody'));
    const el = tbl('eleitores_3a_via');
    if (!el) { if (failed('eleitores_3a_via')) { failLine($('#t3-tab tbody')); failLine($('#t3-tres tbody')); } return; }
    const marca = (v) => (v == null || v === '' ? '—' : F.pct(v));
    rowsTable($('#t3-tab tbody'), el.rows.filter((r) => String(r.ano) === p.ano),
      [['candidato', F.txt, 0, 1], ['pct_pres_1t', pctF], ['apoio_2t', (v, r) => (r.grupo === 'pt' || r.grupo === 'adv' ? 'finalista' : r.grupo === 'terceira' || r.grupo === 'resto' ? '—' : apoio(v)), 0, 1],
        ['pos_prev', marca], ['pos_dep', marca], ['origem_pt', marca], ['transf_pt', marca]],
      (tr, r) => {
        [3, 4, 5, 6].forEach((i) => { const f = ['pos_prev', 'pos_dep', 'origem_pt', 'transf_pt'][i - 3]; if (fora(r[f])) tr.children[i].classList.add('mut'); });
        tr.classList.toggle('st-sel', r.grupo === 'terceira');
      });
    rowsTable($('#t3-tres tbody'), ANOS.map((a) => el.by.get(a + '-terceira')).filter(Boolean),
      [['ano', F.txt, 0, 1], ['pos_prev', marca], ['pos_dep', marca], ['origem_pt', marca], ['transf_pt', marca], ['transf_pt_alt', marca],
        ['conversao', (v) => (isNum(v) ? F.pp(v) : '—'), 1], ['conversao_alt', (v) => (isNum(v) ? F.pp(v) : '—'), 1]],
      (tr, r) => {
        tr.classList.toggle('st-sel', String(r.ano) === p.ano);
        ['pos_prev', 'pos_dep', 'origem_pt'].forEach((f, i) => { if (fora(r[f])) tr.children[i + 1].classList.add('mut'); });
      });
  }

  function auditoria(p) {
    window.ST.leituras('#aud-leituras', (x) => x.tema === 'auditoria');
    const se = tbl('auditoria_serie');
    const sel = (tr, r) => tr.classList.toggle('st-sel', String(r.ano) === p.ano);
    if (se) {
      const list = ANOS.map((a) => se.by.get(a)).filter(Boolean);
      rowsTable($('#aud-serie tbody'), list, [['ano', F.txt, 0, 1], ['abst_1t', F.pct], ['abst_2t', F.pct], ['d_abst_pp', F.pp],
        ['bn_1t', F.pct], ['bn_2t', F.pct], ['d_bn_pp', F.pp], ['pct_cid_abst_caiu', F.pct0], ['pct_cid_bn_caiu', F.pct0], ['pct_cid_ambos_caiu', F.pct0], ['pct_cid_swing_pt', F.pct0]], sel);
      rowsTable($('#aud-forense tbody'), list, [['ano', F.txt, 0, 1], ['sd_swing', (v) => F.pp(v).replace('+', '')], ['r2_uniforme', F.dec],
        ['outliers_z5_por_mil', (v) => (isNum(v) ? window.ST.nf1.format(+v) : '—')], ['corr_comparecimento_pt', F.dec2, 1], ['corr_mobilizacao', F.dec2, 1],
        ['klimek_cidades', F.int], ['benford2_p', F.dec], ['ultimo_digito_p', F.dec], ['x_hat', F.pct], ['y_hat', F.pct], ['c_hat', F.pp, 1]], sel);
    } else if (failed('auditoria_serie')) { failLine($('#aud-serie tbody')); failLine($('#aud-forense tbody')); }
    sinais(p);
    dist(p);
    consistencia(p);
    const ou = tbl('auditoria_outliers');
    if (ou) {
      rowsTable($('#aud-out tbody'), ou.rows.filter((r) => String(r.ano) === p.ano).sort((a, b) => +a.rank - +b.rank),
        [['rank', F.int], ['municipio', F.txt, 0, 1], ['uf', F.txt, 0, 1], ['aptos', F.int], ['z', (v) => window.ST.nf1.format(+v), 1],
          ['ganho_pt', F.sint, 1], ['esperado_pt', F.sint], ['ganho_adv', F.sint, 1], ['terceira', F.int], ['delta', F.sint, 1]]);
    } else if (failed('auditoria_outliers')) failLine($('#aud-out tbody'));
  }

  // conversão da 3ª via necessária para o resultado e perdas de votos: série e lista completa de cidades
  function sinais(p) {
    const cs = tbl('conversao_serie');
    const sel = (tr, r) => tr.classList.toggle('st-sel', String(r.ano) === p.ano);
    $('#aud-conv-h').textContent = `Conversão da 3ª via necessária para o resultado, 2002–2026 · ${window.ST.REG[p.reg]}`;
    if (cs) {
      const list = ANOS.map((a) => cs.by.get(`${a}-${p.reg}`)).filter(Boolean);
      rowsTable($('#aud-conv tbody'), list, [['ano', F.txt, 0, 1], ['conv_pt', (v, r) => `${F.pct(v)} / ${isNum(v) ? F.pct(1 - +v) : '—'}`], ['flag_conv', (v) => window.ST.CONV_ROT[v] || '—', 0, 1],
        ['cidades_avaliadas', F.int], ['n_pt_acima', F.int], ['n_pt_alerta', F.int], ['n_pt_improv', F.int], ['n_ok', F.int], ['n_dir_improv', F.int],
        ['n_dir_alerta', F.int], ['n_dir_acima', F.int], ['exc_pt', F.int], ['exc_dir', F.int],
        ['n_pt_acima_2t', F.int], ['n_dir_acima_2t', F.int]], (tr, r) => {
        sel(tr, r);
        const k = window.ST.CONV_CLS[r.flag_conv]; if (k) tr.children[1].classList.add(k);
        if (+r.n_pt_acima > 0) tr.children[4].classList.add('neg');
        if (+r.n_dir_acima > 0) tr.children[10].classList.add('neg');
      });
      rowsTable($('#aud-perda2 tbody'), list, [['ano', F.txt, 0, 1], ['perdeu_pt', F.int], ['votos_perdidos_pt', F.int], ['pt_saida_caiu', F.int], ['pt_perda_maior', F.int],
        ['pt_oponente_acima', F.int], ['pt_explicavel', F.int], ['troca_min_pt', F.int], ['perdeu_dir', F.int], ['votos_perdidos_dir', F.int], ['dir_saida_caiu', F.int],
        ['dir_perda_maior', F.int], ['dir_oponente_acima', F.int], ['dir_explicavel', F.int], ['troca_min_dir', F.int]], (tr, r) => {
        sel(tr, r);
        [3, 4, 5, 7, 10, 11, 12, 14].forEach((i) => { if (+tr.children[i].textContent.replace(/\D/g, '') > 0) tr.children[i].classList.add('neg'); });
      });
    } else if (failed('conversao_serie')) { failLine($('#aud-conv tbody')); failLine($('#aud-perda2 tbody')); }
    // lista completa da eleição escolhida
    const src = 'mapa_' + p.ano;
    const t = $('#aud-flag');
    t.dataset.source = src;
    t.dataset.rowKey = 'id';
    const n = NOMES[p.ano];
    $('#aud-flag-h').textContent = `Cidades sinalizadas, ${p.ano} · ${n.pt} × ${n.dir}`;
    $('#f-flag').value = st.flag;
    const cid = tbl(src);
    const tb = $('#aud-flag tbody');
    if (!cid) { if (failed(src)) failLine(tb); return; }
    const { k, d } = st.flagSort;
    window.ST.$$('#aud-flag thead th').forEach((th) => th.setAttribute('aria-sort', th.dataset.sort === k ? (d > 0 ? 'ascending' : 'descending') : 'none'));
    const fs = FLAG_SEL[st.flag] || FLAG_SEL.todas;
    const all = cid.rows.filter((r) => window.ST.noFiltro(r, p) && fs(r));
    const ch = CHAVE[k] || CHAVE.exc;
    all.sort((a, b) => { const x = ch(a), y = ch(b); return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : (x || 0) - (y || 0)) * d; });
    $('#aud-flag-n').textContent = `${F.int(all.length)} cidades${all.length > 500 ? ', mostrando as 500 primeiras na ordem escolhida' : ''}. Recorte: ${p.uf ? window.ST.UF_NOME[p.uf] : window.ST.REG[p.reg]}.`;
    const exc = (v, r) => (+r.exc_pt > 0 ? `${F.int(r.exc_pt)} (PT)` : +r.exc_dir > 0 ? `${F.int(r.exc_dir)} (adv.)` : '—');
    const troca = (v, r) => (+r.troca_min_dir > 0 ? `${F.int(r.troca_min_dir)} adv.→PT` : +r.troca_min_pt > 0 ? `${F.int(r.troca_min_pt)} PT→adv.` : '—');
    rowsTable(tb, all.slice(0, 500), [['municipio', F.txt, 0, 1], ['uf', F.txt, 0, 1], ['aptos', F.int], ['terceira_via', F.int], ['rec_pt', F.sint], ['rec_dir', F.sint], ['rec_ter', F.sint],
      ['ganho_pt', F.sint, 1], ['ganho_dir', F.sint, 1], ['x_levou_pt', F.pct], ['x_levou_pt', (v) => (isNum(v) ? F.pct(1 - +v) : '—')],
      ['flag_conv', (v) => window.ST.CONV_ROT[v] || '—', 0, 1], ['exc_pt', exc], ['flag_perda_pt', (v) => PERDA_CURTO[v] || '—', 0, 1],
      ['flag_perda_dir', (v) => PERDA_CURTO[v] || '—', 0, 1], ['troca_min_dir', troca], ['venc_2t', F.txt, 0, 1]], (tr, r) => {
      const c = window.ST.CONV_CLS[r.flag_conv];
      if (c) [9, 10].forEach((i) => tr.children[i].classList.add(c));
      [13, 14].forEach((i) => { const v = r[i === 13 ? 'flag_perda_pt' : 'flag_perda_dir']; if (v && v !== 'explicavel') tr.children[i].classList.add('neg'); });
    });
  }

  function consistencia(p) {
    const cs = tbl('consistencia_serie');
    const tb = $('#aud-contab tbody');
    const sel = (tr, r) => tr.classList.toggle('st-sel', String(r.ano) === p.ano);
    if (!cs) { if (failed('consistencia_serie')) { failLine(tb); failLine($('#aud-net tbody')); } return; }
    tb.replaceChildren(...ANOS.map((a) => {
      const r = cs.by.get(a);
      const tr = document.createElement('tr');
      if (!r) return tr;
      tr.classList.toggle('st-sel', a === p.ano);
      const pre = a === '2026' ? 't2_' : 't12_';
      tr.append(window.ST.td(a === '2026' ? '2026 (2º turno)' : a, 'txt'));
      [['zonas', F.int], ['z_aptos', F.int], ['v_aptos', F.int], ['z_comp', F.int], ['v_comp', F.int], ['z_validos', F.int], ['v_validos', F.int]].forEach(([k, fm]) => {
        const c = window.ST.td(fm(r[pre + k]), +r[pre + k] > 0 && k !== 'zonas' ? 'neg' : '');
        window.ST.setMark(c, 'consistencia_serie', pre + k, a);
        tr.append(c);
      });
      const cz = window.ST.td(a === '2026' ? F.int(+r.cruz_aptos + +r.cruz_comp + +r.cruz_abst + +r.cruz_validos + +r.cruz_brancos + +r.cruz_candidatos + +r.cruz_so_um_lado) : '—');
      if (a === '2026') window.ST.setMark(cz, 'consistencia_serie', 'cruz_candidatos', a);
      tr.append(cz);
      return tr;
    }));
    rowsTable($('#aud-net tbody'), ANOS.map((a) => cs.by.get(a)).filter(Boolean), [['ano', F.txt, 0, 1], ['net_votos', F.sint, 1], ['pct_cid_net_pt', F.pct0],
      ['sd_swing_margem', (v) => F.pp(v).replace('+', '')], ['locais_z4_por_mil', (v) => window.ST.nf1.format(+v)], ['locais_z4_pro_pt', F.int], ['locais_z4_pro_adv', F.int],
      ['inclinacao_net_comparecimento', F.dec2], ['corr_net_pt_1t', F.dec2], ['corr_pt2_anterior', F.dec], ['pct_cid_comp_sobe_5pp', F.pct], ['pct_cid_bn2_1pct', F.pct]], sel);
    const lo = tbl('consistencia_locais');
    if (lo) rowsTable($('#aud-loc tbody'), lo.rows.filter((r) => String(r.ano) === p.ano).sort((a, b) => +a.rank - +b.rank),
      [['rank', F.int], ['municipio', F.txt, 0, 1], ['uf', F.txt, 0, 1], ['aptos', F.int], ['z_local', (v) => window.ST.nf1.format(+v), 1],
        ['swing_margem', F.pp, 1], ['mediana_uf', F.pp], ['net_votos', F.sint, 1]]);
    else if (failed('consistencia_locais')) failLine($('#aud-loc tbody'));
    const ex = tbl('consistencia_extremos');
    if (ex) rowsTable($('#aud-ext tbody'), ex.rows.filter((r) => String(r.ano) === p.ano).sort((a, b) => +b.d_comp_pp - +a.d_comp_pp),
      [['municipio', F.txt, 0, 1], ['uf', F.txt, 0, 1], ['aptos', F.int], ['tipo', F.txt, 0, 1], ['d_comp_pp', F.pp, 1], ['bn_2t', F.pct],
        ['swing_margem', F.pp, 1], ['venc_2t', F.txt, 0, 1]]);
    else if (failed('consistencia_extremos')) failLine($('#aud-ext tbody'));
  }

  function dist(p) {
    const box = $('#aud-dist');
    $('#f-aud-var').value = st.audVar;
    const h = tbl('auditoria_hist');
    if (!h) { if (failed('auditoria_hist')) failLine(box); return; }
    const rows = h.rows.filter((r) => r.var === st.audVar);
    const por = d3.group(rows, (r) => String(r.ano));
    const W = Math.max(280, box.clientWidth);
    const H = 260;
    const m = { t: 12, r: 12, b: 30, l: 44 };
    const lo = d3.min(rows, (r) => +r.lo), hi = d3.max(rows, (r) => +r.hi);
    const x = d3.scaleLinear([lo, hi], [m.l, W - m.r]);
    const y = d3.scaleLinear([0, d3.max(rows, (r) => +r.pct) * 1.08], [H - m.b, m.t]);
    const svg = d3.create('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Distribuição entre cidades por eleição');
    box.replaceChildren(svg.node());
    box.style.minHeight = H + 'px';
    x.ticks(Math.max(3, Math.floor(W / 90))).forEach((t) => {
      svg.append('line').attr('x1', x(t)).attr('x2', x(t)).attr('y1', m.t).attr('y2', H - m.b).style('stroke', t === 0 ? 'var(--cds-chart-axis)' : 'var(--cds-chart-grid)');
      svg.append('text').attr('x', x(t)).attr('y', H - m.b + 16).attr('text-anchor', 'middle').attr('font-size', 11).style('fill', 'var(--color-fg-muted)').text(nf0.format(t * 100) + ' p.p.');
    });
    y.ticks(4).forEach((t) => svg.append('text').attr('x', m.l - 6).attr('y', y(t)).attr('dy', '0.35em').attr('text-anchor', 'end').attr('font-size', 11).style('fill', 'var(--color-fg-muted)').text(nf0.format(t * 100) + '%'));
    const line = d3.line().x((r) => x((+r.lo + +r.hi) / 2)).y((r) => y(+r.pct));
    const anos = [...por.keys()].sort();
    anos.filter((a) => a !== p.ano).forEach((a) => {
      const d = por.get(a).slice().sort((u, v) => +u.lo - +v.lo);
      svg.append('path').attr('d', line(d)).style('fill', 'none').style('stroke', 'var(--cds-chart-muted)').attr('stroke-width', 1.2).attr('stroke-opacity', 0.8);
      const pk = d.reduce((u, v) => (+v.pct > +u.pct ? v : u));
      svg.append('text').attr('x', x((+pk.lo + +pk.hi) / 2)).attr('y', y(+pk.pct) - 4).attr('text-anchor', 'middle').attr('font-size', 9).style('fill', 'var(--color-fg-muted)').text(a);
    });
    const dsel = (por.get(p.ano) || []).slice().sort((u, v) => +u.lo - +v.lo);
    if (dsel.length) {
      svg.append('path').attr('d', line(dsel)).style('fill', 'none').style('stroke', 'var(--color-fg)').attr('stroke-width', 2.4).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');
      const pk = dsel.reduce((u, v) => (+v.pct > +u.pct ? v : u));
      svg.append('text').attr('x', x((+pk.lo + +pk.hi) / 2)).attr('y', y(+pk.pct) - 6).attr('text-anchor', 'middle').attr('font-size', 11).attr('font-weight', 600).style('fill', 'var(--color-fg)').text(p.ano);
    }
    const tip = document.createElement('div'); tip.className = 'st-tip'; tip.hidden = true; box.appendChild(tip);
    svg.on('mousemove', (ev) => {
      const [mx] = d3.pointer(ev);
      const v = x.invert(mx);
      const r = dsel.find((u) => v >= +u.lo && v < +u.hi);
      if (!r) { tip.hidden = true; return; }
      const a = document.createElement('div'); a.className = 'st-tip-h'; a.textContent = `${p.ano}: de ${F.pp(r.lo)} a ${F.pp(r.hi)}`;
      const b = document.createElement('div'); b.textContent = `${F.int(r.cidades)} cidades (${F.pct(r.pct)})`;
      tip.replaceChildren(a, b);
      tipAt(box, tip, ev);
    }).on('mouseleave', () => { tip.hidden = true; });
  }

  window.ST.init.auditoria = () => {
    $('#f-aud-var').addEventListener('change', (e) => { st.audVar = e.target.value; window.ST.draw(); });
    $('#f-flag').addEventListener('change', (e) => { st.flag = e.target.value; window.ST.draw(); });
    $('#aud-flag thead').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      st.flagSort = { k, d: st.flagSort.k === k ? -st.flagSort.d : (k === 'municipio' || k === 'uf' ? 1 : -1) };
      window.ST.draw();
    });
    window.ST.clicavel($('#aud-flag tbody'));
    window.ST.clicavel($('#aud-out tbody'));
    window.ST.clicavel($('#aud-loc tbody'));
    window.ST.clicavel($('#aud-ext tbody'));
  };
  Object.assign(window.ST.abas, { terceira, auditoria });
})();
