// Abas 3ª via (bancadas, origem e transferência) e auditoria estatística.
(() => {
  const { $, F, cls, isNum, tbl, failed, failLine, rowsTable, NOMES, ANOS, st, nf0, tipAt } = window.ST;
  st.audVar = 'd_abst';
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
    dist(p);
    consistencia(p);
    const ou = tbl('auditoria_outliers');
    if (ou) {
      rowsTable($('#aud-out tbody'), ou.rows.filter((r) => String(r.ano) === p.ano).sort((a, b) => +a.rank - +b.rank),
        [['rank', F.int], ['municipio', F.txt, 0, 1], ['uf', F.txt, 0, 1], ['aptos', F.int], ['z', (v) => window.ST.nf1.format(+v), 1],
          ['ganho_pt', F.sint, 1], ['esperado_pt', F.sint], ['ganho_adv', F.sint, 1], ['terceira', F.int], ['delta', F.sint, 1]]);
    } else if (failed('auditoria_outliers')) failLine($('#aud-out tbody'));
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
    window.ST.clicavel($('#aud-out tbody'));
    window.ST.clicavel($('#aud-loc tbody'));
    window.ST.clicavel($('#aud-ext tbody'));
  };
  Object.assign(window.ST.abas, { terceira, auditoria });
})();
