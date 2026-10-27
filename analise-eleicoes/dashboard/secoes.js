// Aba Seções: os testes refeitos com as ~500 mil seções eleitorais de 2018, 2022 e 2026 (mesmo cadastro nos dois turnos).
(() => {
  const { $, F, isNum, tbl, failed, failLine, rowsTable, NOMES, st, nf0, nf1, tipAt, segPressed } = window.ST;
  const SA = ['2026', '2022', '2018'];
  st.secVar = 'net';
  const pm = (v) => (isNum(v) ? nf1.format(+v) : '—');
  const ORIG = ['pt', 'adv', 'ter', 'bn', 'abst'];
  const origem = (v, r) => ({ pt: NOMES[r.ano].pt, adv: NOMES[r.ano].dir, ter: '3ª via', bn: 'Brancos e nulos', abst: 'Abstenção' }[v] || v);
  const venc = (v, r) => (v === 'PT' ? NOMES[r.ano].pt : NOMES[r.ano].dir);
  const anoS = (p) => (SA.includes(p.ano) ? p.ano : '2026');
  const hora = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

  function series(p) {
    const se = tbl('secao_serie');
    const ids = ['#sec-contab', '#sec-comp', '#sec-net', '#sec-fe', '#sec-tempo', '#sec-forense'];
    if (!se) { if (failed('secao_serie')) ids.forEach((s) => failLine($(s + ' tbody'))); return; }
    const list = SA.map((a) => se.by.get(a)).filter(Boolean);
    const sel = (tr, r) => tr.classList.toggle('st-sel', String(r.ano) === anoS(p));
    const cruz = (r) => ['1', '2'].reduce((s, t) => s + ['cruz_nominais', 'cruz_brancos', 'cruz_nulos', 'ident_comp'].reduce((u, k) => u + +r[`t${t}_${k}`], 0), 0);
    rowsTable($('#sec-contab tbody'), list, [['ano', F.txt, 0, 1], ['secoes_2t', F.int], ['mun_conferidos', F.int], ['mun_divergentes', F.int],
      ['mun_divergencia_soma', F.int], [null, (r) => F.int(cruz(r))], ['votos_sem_secao', F.int], ['aptos_diferentes', F.int], ['aptos_diferentes_soma', F.int],
      [null, (r) => `${F.int(r.t1_cedula)} / ${F.int(r.t2_cedula)}`], ['t2_nao_instaladas', F.int], ['secoes_analisadas', F.int]], sel);
    rowsTable($('#sec-comp tbody'), list, [['ano', F.txt, 0, 1], ['comp_1t', F.pct], ['comp_2t', F.pct], ['d_comp_media', F.pp, 1], ['d_comp_votos', F.sint, 1],
      ['pct_secoes_comp_sobe', F.pct0], ['por_mil_comp_sobe_10pp', pm], ['por_mil_comp_sobe_20pp', (v) => (isNum(v) ? window.ST.nf1.format(+v * 10) + ' por 10 mil' : '—')],
      ['por_mil_comp_cai_10pp', pm], ['top10_comp_alta', F.pct], ['d_comp_p99', F.pp], ['d_comp_dp_zona', F.ppu]], sel);
    rowsTable($('#sec-net tbody'), list, [['ano', F.txt, 0, 1], ['net_votos', F.sint, 1], ['vencedor_net', venc, 0, 1], ['pct_secoes_net_vencedor', F.pct],
      ['top1_net', F.pct], ['top10_net', F.pct], ['net_dp_zona', F.ppu], ['z5_por_mil', pm], ['z5_pro_pt', F.int], ['z5_pro_adv', F.int], ['z5_votos_net', F.sint, 1],
      ['incl_net_comp', F.dec2], ['novos_para_pt', F.pct], ['corr_comp_pt1', F.dec2, 1]], sel);
    rowsTable($('#sec-fe tbody'), list, [['ano', F.txt, 0, 1], ['brancos_1t', F.pct], ['brancos_2t', F.pct], ['nulos_1t', F.pct], ['nulos_2t', F.pct],
      ['fe_comp', F.dec2, 1], ['fe_branco', F.dec2, 1], ['fe_nulo', F.dec2, 1], ['fe_ter', F.dec2, 1], ['corr_net_bn1', F.dec2, 1],
      ['contrib_residuo', F.sint], ['ols_fora_0_1', (v, r) => `${F.int(v)} de ${F.int(r.ols_coeficientes)}`]], sel);
    rowsTable($('#sec-tempo tbody'), list, [['ano', F.txt, 0, 1], ['chegada_mediana_1t', F.txt], ['chegada_mediana_2t', F.txt], ['pct_ate_17h30_1t', F.pct],
      ['pct_ate_17h30_2t', F.pct], ['pausa_min_1t', (v) => (isNum(v) ? nf0.format(+v) + ' min' : '—')], ['pausa_min_2t', (v) => (isNum(v) ? nf0.format(+v) + ' min' : '—')],
      ['net_dm_ate_17h30_2t', F.pp, 1], ['corr_chegada_net', F.dec2, 1]], (tr, r) => {
      sel(tr, r);
      if (+r.pausa_min_2t >= 60) tr.children[6].classList.add('neg');
    });
    rowsTable($('#sec-forense tbody'), list, [['ano', F.txt, 0, 1], ['klimek_n', F.int], ['klimek_pt', F.int], ['por_mil_pt_95', pm], ['por_mil_adv_95', pm],
      ['bn2_zero_n', F.int], ['bn2_zero_pt_venceu', F.pct0], ['bn2_zero_net_dm', F.pp, 1], ['bn2_zero_ufs', F.txt, 0, 1],
      ['dig_ult_pt_desvio', F.ppu], ['dig_ult_adv_desvio', F.ppu], ['dig_2bl_pt_media', F.dec], ['dig_2bl_adv_media', F.dec]], sel);
  }

  function fluxos(p) {
    const tr_ = tbl('secao_transicao');
    const tb = $('#sec-fluxo tbody');
    if (!tr_) { if (failed('secao_transicao')) failLine(tb); return; }
    const esc = p.reg;
    $('#sec-fluxo-h').textContent = `De onde veio o crescimento líquido: ${window.ST.REG[esc]}`;
    const list = SA.flatMap((a) => ORIG.map((o) => tr_.by.get(`${a}-${esc}-${o}`))).filter(Boolean);
    rowsTable(tb, list, [['ano', F.txt, 0, 1], ['origem', origem, 0, 1], ['votos_1t', F.int], ['para_pt', F.pct], ['para_adv', F.pct], ['para_bn', F.pct],
      ['para_abst', F.pct], ['contrib_net', F.sint, 1], ['para_pt_ols', F.pct], ['para_adv_ols', F.pct], ['contrib_net_ols', F.sint, 1]], (tr, r) => {
      tr.classList.toggle('st-sel', String(r.ano) === anoS(p));
      if (r.origem === 'pt') tr.style.borderTop = '2px solid var(--color-border-line)';
      [8, 9].forEach((i) => { const v = +r[i === 8 ? 'para_pt_ols' : 'para_adv_ols']; if (v < -0.05 || v > 1.05) tr.children[i].classList.add('mut'); });
    });
  }

  function porAno(p) {
    const a = anoS(p);
    const n = NOMES[a];
    $('#sec-ano-nota').textContent = SA.includes(p.ano) ? '' : `Seções só para 2018, 2022 e 2026; mostrando ${a}.`;
    const te = tbl('secao_tempo');
    $('#sec-decis-h').textContent = `Chegada ao TSE por decil, ${a}`;
    if (te) rowsTable($('#sec-decis tbody'), te.rows.filter((r) => String(r.ano) === a).sort((x, y) => +x.decil - +y.decil),
      [['decil', F.int], ['secoes', F.int], ['chegada_mediana', F.txt], ['net_dm', F.pp, 1], ['d_comp_dm', F.pp, 1], ['pt1_dm', F.pp, 1]]);
    else if (failed('secao_tempo')) failLine($('#sec-decis tbody'));
    const mo = tbl('secao_modelo');
    if (mo) rowsTable($('#sec-modelo tbody'), SA.flatMap((y) => mo.rows.filter((r) => String(r.ano) === y)),
      [['ano', F.txt, 0, 1], ['modelo', F.txt, 0, 1], ['secoes', F.int], ['pct_secoes', F.pct], ['net_dm', F.pp, 1], ['d_comp_dm', F.pp, 1], ['pt1_dm', F.pp, 1]],
      (tr, r) => tr.classList.toggle('st-sel', String(r.ano) === a));
    else if (failed('secao_modelo')) failLine($('#sec-modelo tbody'));
    const uf = tbl('secao_uf');
    $('#sec-uf-h').textContent = `Por estado, ${a} · ${n.pt} × ${n.dir}`;
    if (uf) rowsTable($('#sec-uf tbody'), uf.rows.filter((r) => String(r.ano) === a && (p.reg === 'BR' || r.regiao === p.reg)).sort((x, y) => +y.net_votos - +x.net_votos),
      [['uf', F.txt, 0, 1], ['secoes', F.int], ['d_comp', F.pp, 1], ['net_votos', F.sint, 1], ['net_pct_aptos', F.spct, 1], ['pct_secoes_net_pt', F.pct0],
        ['top10_net', F.pct], ['incl_net_comp', F.dec2, 1], ['ter_para_pt', F.pct], ['ter_para_adv', F.pct], ['abst_para_pt', F.pct], ['abst_para_adv', F.pct], ['z5_por_mil', pm]]);
    else if (failed('secao_uf')) failLine($('#sec-uf tbody'));
    const ex = tbl('secao_extremos');
    $('#sec-ext-h').textContent = `Seções extremas, ${a}`;
    const seta = (k) => (v, r) => `${F.int(r[k + '_1t'])} → ${F.int(r[k + '_2t'])}`;
    if (ex) rowsTable($('#sec-ext tbody'), ex.rows.filter((r) => String(r.ano) === a),
      [['tipo', F.txt, 0, 1], ['municipio', F.txt, 0, 1], ['uf', F.txt, 0, 1], ['secao', (v, r) => `${r.zona} / ${v}`, 0, 1], ['local', F.txt, 0, 1], ['aptos', F.int],
        ['comp_2t', (v, r) => `${F.pct0(r.comp_1t)} → ${F.pct0(v)}`], ['pt_2t', seta('pt')], ['adv_2t', seta('adv')], ['bn_2t', seta('bn')],
        ['net_votos', F.sint, 1], ['z', (v) => (isNum(v) ? nf1.format(+v) : '—'), 1], ['chegada', F.txt], ['modelo', F.txt, 0, 1]]);
    else if (failed('secao_extremos')) failLine($('#sec-ext tbody'));
  }

  function distribuicao(p) {
    const box = $('#sec-dist');
    segPressed('#f-sec-var', st.secVar);
    const h = tbl('secao_dist');
    if (!h) { if (failed('secao_dist')) failLine(box); return; }
    const v = st.secVar;
    const horas = v.startsWith('chegada');
    const rows = h.rows.filter((r) => r.var === v);
    const por = d3.group(rows, (r) => String(r.ano));
    const W = Math.max(280, box.clientWidth);
    const H = 260;
    const m = { t: 14, r: 12, b: 30, l: 44 };
    const x = d3.scaleLinear(d3.extent(rows, (r) => +r.centro), [m.l, W - m.r]);
    const y = d3.scaleLinear([0, (d3.max(rows, (r) => +r.pct_secoes) || 0.01) * 1.1], [H - m.b, m.t]);
    const svg = d3.create('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Distribuição entre seções por eleição');
    box.replaceChildren(svg.node());
    box.style.minHeight = H + 'px';
    const fx = horas ? hora : (t) => nf0.format(t * 100) + ' p.p.';
    x.ticks(Math.max(3, Math.floor(W / 90))).forEach((t) => {
      svg.append('line').attr('x1', x(t)).attr('x2', x(t)).attr('y1', m.t).attr('y2', H - m.b).style('stroke', !horas && t === 0 ? 'var(--cds-chart-axis)' : 'var(--cds-chart-grid)');
      svg.append('text').attr('x', x(t)).attr('y', H - m.b + 16).attr('text-anchor', 'middle').attr('font-size', 11).style('fill', 'var(--color-fg-muted)').text(fx(t));
    });
    y.ticks(4).forEach((t) => svg.append('text').attr('x', m.l - 6).attr('y', y(t)).attr('dy', '0.35em').attr('text-anchor', 'end').attr('font-size', 11).style('fill', 'var(--color-fg-muted)').text(nf1.format(t * 100) + '%'));
    const line = d3.line().x((r) => x(+r.centro)).y((r) => y(+r.pct_secoes));
    const a0 = anoS(p);
    const ordem = (a) => (por.get(a) || []).slice().sort((u, w) => +u.centro - +w.centro);
    SA.filter((a) => a !== a0).forEach((a) => {
      const d = ordem(a);
      if (!d.length) return;
      svg.append('path').attr('d', line(d)).style('fill', 'none').style('stroke', 'var(--cds-chart-muted)').attr('stroke-width', 1.4);
      const pk = d.reduce((u, w) => (+w.pct_secoes > +u.pct_secoes ? w : u));
      svg.append('text').attr('x', x(+pk.centro)).attr('y', y(+pk.pct_secoes) - 4).attr('text-anchor', 'middle').attr('font-size', 10).style('fill', 'var(--color-fg-muted)').text(a);
    });
    const ds = ordem(a0);
    if (ds.length) {
      svg.append('path').attr('d', line(ds)).style('fill', 'none').style('stroke', 'var(--color-fg)').attr('stroke-width', 2.4).attr('stroke-linejoin', 'round');
      const pk = ds.reduce((u, w) => (+w.pct_secoes > +u.pct_secoes ? w : u));
      svg.append('text').attr('x', x(+pk.centro)).attr('y', y(+pk.pct_secoes) - 6).attr('text-anchor', 'middle').attr('font-size', 11).attr('font-weight', 600).style('fill', 'var(--color-fg)').text(a0);
    }
    const tip = document.createElement('div'); tip.className = 'st-tip'; tip.hidden = true; box.appendChild(tip);
    svg.on('mousemove', (ev) => {
      const [mx] = d3.pointer(ev);
      const c = x.invert(mx);
      const r = ds.reduce((u, w) => (Math.abs(+w.centro - c) < Math.abs(+u.centro - c) ? w : u), ds[0]);
      if (!r) { tip.hidden = true; return; }
      const t1 = document.createElement('div'); t1.className = 'st-tip-h'; t1.textContent = `${a0}: ${horas ? hora(+r.centro) : F.pp(r.centro)}`;
      const t2 = document.createElement('div'); t2.textContent = `${F.pct(r.pct_secoes)} das seções`;
      tip.replaceChildren(t1, t2);
      tipAt(box, tip, ev);
    }).on('mouseleave', () => { tip.hidden = true; });
  }

  function secoes(p) {
    window.ST.leituras('#sec-leituras', (x) => x.tema === 'secoes');
    series(p);
    fluxos(p);
    porAno(p);
    distribuicao(p);
  }

  window.ST.init.secoes = () => {
    $('#f-sec-var').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) { st.secVar = b.dataset.v; window.ST.draw(); } });
    window.ST.clicavel($('#sec-ext tbody'));
  };
  window.ST.abas.secoes = secoes;
})();
