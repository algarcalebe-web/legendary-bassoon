// Aba Vitória líquida: o resultado contado por outras regras (colégio pelo 1º ou pelo 2º turno, estados, eleitorado,
// regiões, municípios) e o saldo de votos (PT − adversário) por estado e região em todas as eleições.
(() => {
  const { $, $$, F, isNum, tbl, failed, failLine, td, setMark, NOMES, ANOS, st, tipAt, nf0 } = window.ST;
  st.saldoM = 'saldo_2t';
  st.colBase = '1t';
  const UFS = window.ST.UFS;
  const xy = (r) => `${F.int(r.pt)} × ${F.int(r.dir)}`;
  const SIS = [['popular', (r) => `${F.mi(r.pt)} × ${F.mi(r.dir)}`], ['colegio_1t', (r) => xy(r) + (+r.outros ? ` (+${F.int(r.outros)})` : '')], ['colegio', xy],
    ['deputados', xy], ['estados', xy], ['eleitorado', (r) => `${window.ST.nf1.format(r.pt / 1e6)} × ${window.ST.nf1.format(r.dir / 1e6)}`], ['regioes', xy], ['municipios', xy]];
  const tinta = (v, max) => {
    if (!isNum(v) || !+v) return '';
    const k = Math.round(8 + 40 * Math.min(1, Math.abs(+v) / max));
    return `background: color-mix(in srgb, var(${+v > 0 ? '--st-pt' : '--st-dir'}) ${k}%, transparent)`;
  };
  const FMT = { saldo_2t: F.smi, net_votos: F.smi, swing_margem: F.pp };
  const COR = { PT: '#d4513f', DIR: '#3d78d8', OUTRO: '#9a8f80' };
  const BASE_ROT = { '1t': 'pelo 1º turno', '2t': 'pelo 2º turno' };

  // Estado numa base. Com swing s (fração dos válidos indo do adversário para o PT): o PT leva o estado se s > tPT,
  // o adversário se s < uADV; no 1º turno um terceiro pode ficar com ele no meio.
  function estadoBase(r, base) {
    if (base === '2t') {
      const m = +r.margem_2t;
      return { r, uf: r.uf, w: +r.peso_colegio, holder: r.venc_2t, tPT: -m / 2, uADV: -m / 2, swing: Math.abs(m) / 2, sigla: '' };
    }
    const V = +r.validos_1t_uf, pt = +r.pt_1t_uf, dr = +r.dir_1t_uf, o = +r.outro_1t;
    const holder = r.venc_1t === 'OUTRO' ? 'OUTRO' : r.venc_1t;
    return { r, uf: r.uf, w: +r.peso_colegio, holder, tPT: Math.max((dr - pt) / (2 * V), (o - pt) / V), uADV: Math.min((dr - pt) / (2 * V), (dr - o) / V),
      swing: +r.swing_1t_pp, sigla: holder === 'OUTRO' ? r.outro_sigla_1t : '' };
  }
  const estados = (cu, ano, base) => cu.rows.filter((r) => String(r.ano) === ano).map((r) => estadoBase(r, base));
  const placar = (L0, s) => ({ pt: L0.reduce((a, d) => a + (s > d.tPT ? d.w : 0), 0), dir: L0.reduce((a, d) => a + (s < d.uADV ? d.w : 0), 0) });
  const linhaCol = (col, ano, base) => col && col.by.get(`${ano}-${base === '1t' ? 'colegio_1t' : 'colegio'}`);
  const desfecho = (pt, dir, maj, base, n) => (pt >= maj ? `${n.pt} vence${base === '1t' ? ' no 1º turno' : ''}` : dir >= maj ? `${n.dir} vence${base === '1t' ? ' no 1º turno' : ''}`
    : base === '1t' ? 'ninguém com maioria: haveria 2º turno' : 'empate');

  function sistemas(p) {
    const col = tbl('colegio');
    const tb = $('#col-tabela tbody');
    if (!col) { if (failed('colegio')) failLine(tb); return; }
    tb.replaceChildren(...ANOS.map((a) => {
      const tr = document.createElement('tr');
      tr.classList.toggle('st-sel', a === p.ano);
      tr.append(td(`${a} · ${NOMES[a].pt} × ${NOMES[a].dir}`, 'txt'));
      SIS.forEach(([s, fm]) => {
        const id = `${a}-${s}`;
        const r = col.by.get(id);
        const c = td(r ? fm(r) : '—', 'txt');
        if (r) {
          setMark(c, 'colegio', 'pt', id);
          c.style.cssText = tinta(r.vencedor === 'PT' ? 1 : r.vencedor === 'DIR' ? -1 : 0, 2.5);
          c.title = r.vencedor === '2T' ? 'ninguém com maioria: haveria 2º turno'
            : `${r.vencedor === 'PT' ? NOMES[a].pt : NOMES[a].dir} vence${s === 'colegio_1t' ? ' sem 2º turno' : ''}${String(r.igual_popular) === '0' ? ' (contraria o voto popular)' : ''}`;
          if (String(r.igual_popular) === '0') c.style.fontWeight = '600';
        }
        tr.append(c);
      });
      const r1 = col.by.get(`${a}-colegio_1t`);
      [['swing_pt_maioria_pp', F.ppu], ['swing_dir_maioria_pp', F.ppu]].forEach(([f, fm]) => {
        const c = td(r1 ? fm(r1[f]) : '—');
        if (r1) setMark(c, 'colegio', f, `${a}-colegio_1t`);
        tr.append(c);
      });
      const r = col.by.get(`${a}-colegio`);
      [['decisivo_uf', F.txt, 'txt'], ['swing_para_virar_pp', F.ppu, ''], ['estados_swing', F.txt, 'txt'], ['swing_popular_pp', F.ppu, ''],
        ['votos_para_virar', F.int, 'mut'], ['estados_para_virar', F.txt, 'txt mut']].forEach(([f, fm, k]) => {
        const c = td(r ? fm(r[f]) : '—', k);
        if (r) setMark(c, 'colegio', f, `${a}-colegio`);
        tr.append(c);
      });
      return tr;
    }));
  }

  function mapaEstados(p) {
    const box = $('#col-mapa');
    const me = tbl('malha_estados');
    const cu = tbl('colegio_uf');
    const n = NOMES[p.ano];
    const base = st.colBase;
    $('#col-mapa-h').textContent = `Colégio eleitoral ${BASE_ROT[base]}, ${p.ano}`;
    const c = linhaCol(tbl('colegio'), p.ano, base);
    const leg = $('#col-legenda');
    if (c) {
      const sp = (cor, txt) => { const s = document.createElement('span'); const sw = document.createElement('span'); sw.className = 'st-sw'; sw.style.background = cor; s.append(sw, txt); return s; };
      leg.replaceChildren(sp(COR.PT, `${n.pt} ${F.int(c.pt)}`), sp(COR.DIR, `${n.dir} ${F.int(c.dir)}`), ...(+c.outros ? [sp(COR.OUTRO, `outros ${F.int(c.outros)}`)] : []),
        document.createTextNode(`maioria: ${F.int(c.maioria)} · ${desfecho(+c.pt, +c.dir, +c.maioria, base, n)}`));
    }
    if (!me || !cu) { if (failed('malha_estados') || failed('colegio_uf')) failLine(box); return; }
    let svg = box.querySelector('svg');
    if (!svg || box.dataset.src !== String(me.rows.length)) {
      const s = d3.create('svg').attr('role', 'img').attr('aria-label', 'Estados pelo vencedor');
      s.append('g').attr('class', 'uf').selectAll('path').data(me.rows).join('path').attr('d', (d) => d.d)
        .style('stroke', 'var(--color-panel)').attr('stroke-width', 1).attr('vector-effect', 'non-scaling-stroke');
      s.append('g').attr('class', 'rot').attr('pointer-events', 'none');
      const tip = document.createElement('div'); tip.className = 'st-tip'; tip.hidden = true;
      box.replaceChildren(s.node(), tip);
      const bb = s.select('g.uf').node().getBBox();
      s.attr('viewBox', bb.width ? `${bb.x - 4} ${bb.y - 4} ${bb.width + 8} ${bb.height + 8}` : '0 0 1000 940');
      box.dataset.src = String(me.rows.length);
      svg = s.node();
    }
    const s = d3.select(svg);
    const tip = box.querySelector('.st-tip');
    const linha = (uf) => { const r = cu.by.get(`${p.ano}-${uf}`); return r ? estadoBase(r, base) : null; };
    s.select('g.uf').selectAll('path')
      .style('fill', (d) => { const e = linha(d.uf); if (!e) return 'var(--cds-chart-muted)'; return d3.interpolateRgb('#ffffff', COR[e.holder] || COR.OUTRO)(0.35 + 0.65 * Math.min(1, e.swing / 0.2)); })
      .on('mousemove', (ev, d) => {
        const e = linha(d.uf);
        if (!e) return;
        const r = e.r;
        const h = document.createElement('div'); h.className = 'st-tip-h'; h.textContent = `${r.nome}: ${F.int(r.peso_colegio)} votos no colégio`;
        const l1 = document.createElement('div');
        l1.textContent = base === '1t'
          ? `1º turno: ${n.pt} ${F.pct(+r.pt_1t_uf / +r.validos_1t_uf)} × ${F.pct(+r.dir_1t_uf / +r.validos_1t_uf)} ${n.dir}${+r.outro_1t ? ` · ${r.outro_sigla_1t} ${F.pct(+r.outro_1t / +r.validos_1t_uf)}` : ''}`
          : `2º turno: ${n.pt} ${F.int(r.pt_2t)} × ${F.int(r.dir_2t)} ${n.dir} (margem ${F.pp(r.margem_2t)})`;
        const l2 = document.createElement('div'); l2.textContent = `virar o estado: ${F.ppu(e.swing)} dos válidos trocando de lado`;
        tip.replaceChildren(h, l1, l2);
        tipAt(box, tip, ev);
      })
      .on('mouseleave', () => { tip.hidden = true; });
    const rot = s.select('g.rot');
    rot.selectAll('text').remove();
    s.select('g.uf').selectAll('path').each(function (d) {
      const e = linha(d.uf);
      if (!e) return;
      const b = this.getBBox();
      rot.append('text').attr('x', b.x + b.width / 2).attr('y', b.y + b.height / 2).attr('text-anchor', 'middle').attr('dy', '0.35em')
        .attr('font-size', 11).attr('font-weight', 600).style('fill', '#1d1d1d').style('paint-order', 'stroke').style('stroke', 'rgba(255,255,255,0.7)').attr('stroke-width', 2.5)
        .text(`${d.uf} ${e.w}`);
    });
  }

  function barras(p) {
    const box = $('#saldo-chart');
    const sa = tbl('saldos');
    $('#saldo-h').textContent = `Saldo de votos por estado, ${p.ano}`;
    if (!sa) { if (failed('saldos')) failLine(box); return; }
    const data = sa.rows.filter((r) => String(r.ano) === p.ano && r.nivel === 'UF' && (p.reg === 'BR' || r.regiao === p.reg)).sort((a, b) => +b.saldo_2t - +a.saldo_2t);
    const W = Math.max(280, box.clientWidth);
    const rowH = 22;
    const H = data.length * rowH + 26;
    const svg = d3.create('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Saldo de votos por estado');
    box.replaceChildren(svg.node());
    box.style.minHeight = H + 'px';
    const left = 34;
    const valW = 64;
    const lo = Math.min(0, d3.min(data, (d) => Math.min(+d.saldo_2t, +d.saldo_1t)));
    const hi = Math.max(0, d3.max(data, (d) => Math.max(+d.saldo_2t, +d.saldo_1t)));
    const x = d3.scaleLinear([lo, hi], [left + valW, W - valW]).nice();
    x.ticks(Math.max(2, Math.floor(W / 110))).forEach((t) => {
      svg.append('line').attr('x1', x(t)).attr('x2', x(t)).attr('y1', 0).attr('y2', H - 20).style('stroke', t === 0 ? 'var(--cds-chart-axis)' : 'var(--cds-chart-grid)');
      svg.append('text').attr('x', x(t)).attr('y', H - 6).attr('text-anchor', 'middle').attr('font-size', 10).style('fill', 'var(--color-fg-muted)').text(nf0.format(t / 1e6) + ' mi');
    });
    const tip = document.createElement('div'); tip.className = 'st-tip'; tip.hidden = true; box.appendChild(tip);
    const n = NOMES[p.ano];
    data.forEach((d, i) => {
      const y0 = i * rowH + 3;
      const v = +d.saldo_2t, v1 = +d.saldo_1t;
      svg.append('text').attr('x', left - 6).attr('y', y0 + 8).attr('dy', '0.35em').attr('text-anchor', 'end').attr('font-size', 11).style('fill', 'var(--color-fg)').text(d.uf);
      const a = x(Math.min(0, v)), b = x(Math.max(0, v));
      svg.append('rect').attr('x', a).attr('y', y0 + 2).attr('width', Math.max(1, b - a)).attr('height', 12).attr('rx', 3).style('fill', v >= 0 ? 'var(--st-pt)' : 'var(--st-dir)');
      svg.append('line').attr('x1', x(v1)).attr('x2', x(v1)).attr('y1', y0).attr('y2', y0 + 16).style('stroke', 'var(--color-fg)').attr('stroke-width', 2);
      svg.append('text').attr('x', v >= 0 ? Math.max(b, x(v1)) + 5 : Math.min(a, x(v1)) - 5).attr('y', y0 + 8).attr('dy', '0.35em').attr('text-anchor', v >= 0 ? 'start' : 'end')
        .attr('font-size', 10).style('fill', 'var(--color-fg-muted)').text(F.smi(v));
      svg.append('rect').attr('x', 0).attr('y', y0 - 1).attr('width', W).attr('height', rowH).style('fill', 'transparent')
        .on('mousemove', (ev) => {
          const h = document.createElement('div'); h.className = 'st-tip-h'; h.textContent = d.nome;
          const l1 = document.createElement('div'); l1.textContent = `Saldo no 1º turno: ${F.sint(d.saldo_1t)} (${F.pp(d.margem_1t)})`;
          const l2 = document.createElement('div'); l2.textContent = `Saldo no 2º turno: ${F.sint(d.saldo_2t)} (${F.pp(d.margem_2t)})`;
          const l3 = document.createElement('div'); l3.textContent = `Crescimento líquido de ${n.pt}: ${F.sint(d.net_votos)} · ${F.pct(d.contrib_pct)} do saldo nacional`;
          tip.replaceChildren(h, l1, l2, l3);
          tipAt(box, tip, ev);
        })
        .on('mouseleave', () => { tip.hidden = true; });
    });
  }

  function tabelas(p) {
    const sa = tbl('saldos');
    window.ST.segPressed('#f-saldo-m', st.saldoM);
    const tr1 = $('#saldo-reg tbody'), tr2 = $('#saldo-uf tbody');
    if (!sa) { if (failed('saldos')) { failLine(tr1); failLine(tr2); } return; }
    const f = st.saldoM, fm = FMT[f];
    const max = f === 'swing_margem' ? 0.15 : f === 'net_votos' ? 3e6 : 6e6;
    tr1.replaceChildren(...ANOS.map((a) => {
      const tr = document.createElement('tr');
      tr.classList.toggle('st-sel', a === p.ano);
      tr.append(td(`${a} · ${NOMES[a].pt} × ${NOMES[a].dir}`, 'txt'));
      ['N', 'NE', 'CO', 'SE', 'S', 'BR'].forEach((g) => {
        const id = `${a}-${g}`;
        const r = sa.by.get(id);
        const c = td(r ? fm(r[f]) : '—');
        if (r) { setMark(c, 'saldos', f, id); c.style.cssText = tinta(r[f], g === 'BR' ? max * 2 : max); }
        tr.append(c);
      });
      return tr;
    }));
    const maxUf = f === 'swing_margem' ? 0.15 : f === 'net_votos' ? 1e6 : 2.5e6;
    const ufs = UFS.filter((u) => p.reg === 'BR' || (sa.by.get(`2026-UF-${u}`) || {}).regiao === p.reg);
    tr2.replaceChildren(...ufs.map((u) => {
      const tr = document.createElement('tr');
      const ref = sa.by.get(`2026-UF-${u}`);
      tr.append(td(ref ? ref.nome : u, 'txt'));
      ANOS.forEach((a) => {
        const id = `${a}-UF-${u}`;
        const r = sa.by.get(id);
        const c = td(r ? fm(r[f]) : '—');
        if (r) { setMark(c, 'saldos', f, id); c.style.cssText = tinta(r[f], maxUf); }
        if (a === p.ano) c.style.fontWeight = '600';
        tr.append(c);
      });
      return tr;
    }));
  }

  // swing (p.p. dos válidos) que viraria cada estado em cada eleição, na base escolhida; cor pelo dono do estado
  function viraUf(p) {
    const cu = tbl('colegio_uf');
    const tb = $('#vira-uf tbody');
    if (!cu) { if (failed('colegio_uf')) failLine(tb); return; }
    const base = st.colBase;
    $('#vira-h').textContent = `Quanto cada estado precisaria mudar para virar, ${BASE_ROT[base]}, ordenado por ${p.ano}`;
    const e = (a, u) => { const r = cu.by.get(`${a}-${u}`); return r ? estadoBase(r, base) : null; };
    const ufs = UFS.filter((u) => p.reg === 'BR' || (cu.by.get(`2026-${u}`) || {}).regiao === p.reg)
      .sort((a, b) => ((e(p.ano, a) || {}).swing ?? 9) - ((e(p.ano, b) || {}).swing ?? 9));
    tb.replaceChildren(...ufs.map((u) => {
      const tr = document.createElement('tr');
      const ref = cu.by.get(`2026-${u}`);
      tr.append(td(ref ? `${ref.nome} (${ref.peso_colegio})` : u, 'txt'));
      ANOS.forEach((a) => {
        const x = e(a, u);
        const c = td(x ? F.ppu(x.swing) : '—');
        if (x) {
          setMark(c, 'colegio_uf', base === '1t' ? 'swing_1t_pp' : 'swing_para_virar_pp', x.r.id);
          c.style.cssText = x.holder === 'OUTRO' ? 'background: color-mix(in srgb, #9a8f80 25%, transparent)' : tinta((x.holder === 'PT' ? 1 : -1) * Math.max(0.005, x.swing), 0.25);
          c.title = `${x.holder === 'PT' ? NOMES[a].pt : x.holder === 'DIR' ? NOMES[a].dir : x.sigla} ${base === '1t' ? 'liderou o 1º turno' : 'venceu o 2º turno'}`;
          if (base === '2t' && String(x.r.decisivo) === '1') { c.style.fontWeight = '600'; c.style.outline = '2px solid var(--color-fg)'; c.style.outlineOffset = '-2px'; c.title += ' · estado decisivo do colégio'; }
        }
        if (a === p.ano) c.style.fontWeight = '600';
        tr.append(c);
      });
      return tr;
    }));
  }

  // ataque e defesa: votos de cada lado no colégio sob swing uniforme, estados mais frágeis e simulador de viradas
  function curva(p, L0, c, base) {
    const box = $('#ad-chart');
    const maj = +c.maioria, tot = +c.total;
    const n = NOMES[p.ano];
    const need = base === '1t' ? Math.max(+c.swing_pt_maioria_pp || 0, +c.swing_dir_maioria_pp || 0) : Math.abs(+c.swing_para_virar_pp || 0);
    const L = Math.min(0.25, Math.max(0.08, Math.ceil((need || 0.03) * 2 * 100) / 100));
    const W = Math.max(280, box.clientWidth);
    const H = 280;
    const m = { t: 16, r: 14, b: 34, l: 44 };
    const x = d3.scaleLinear([-L, L], [m.l, W - m.r]);
    const y = d3.scaleLinear([0, tot], [H - m.b, m.t]);
    const passos = Array.from({ length: 801 }, (_, i) => -L + (i * L) / 400);
    const svg = d3.create('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Votos no colégio sob swing uniforme');
    box.replaceChildren(svg.node());
    box.style.minHeight = H + 'px';
    x.ticks(Math.max(4, Math.floor(W / 80))).forEach((t) => {
      svg.append('line').attr('x1', x(t)).attr('x2', x(t)).attr('y1', m.t).attr('y2', H - m.b).style('stroke', t === 0 ? 'var(--cds-chart-axis)' : 'var(--cds-chart-grid)');
      svg.append('text').attr('x', x(t)).attr('y', H - m.b + 15).attr('text-anchor', 'middle').attr('font-size', 11).style('fill', 'var(--color-fg-muted)').text(t === 0 ? 'real' : (t > 0 ? '+' : '−') + nf0.format(Math.abs(t) * 100));
    });
    svg.append('text').attr('x', W - m.r).attr('y', H - 4).attr('text-anchor', 'end').attr('font-size', 10).style('fill', 'var(--color-fg-muted)').text(`p.p. para ${n.pt} →`);
    svg.append('text').attr('x', m.l).attr('y', H - 4).attr('font-size', 10).style('fill', 'var(--color-fg-muted)').text(`← p.p. para ${n.dir}`);
    y.ticks(5).forEach((t) => svg.append('text').attr('x', m.l - 6).attr('y', y(t)).attr('dy', '0.35em').attr('text-anchor', 'end').attr('font-size', 11).style('fill', 'var(--color-fg-muted)').text(nf0.format(t)));
    svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(maj)).attr('y2', y(maj)).style('stroke', 'var(--color-fg)').attr('stroke-dasharray', '4 3').attr('stroke-width', 1);
    svg.append('text').attr('x', m.l + 4).attr('y', y(maj) - 4).attr('font-size', 10).style('fill', 'var(--color-fg-muted)').text(`maioria ${F.int(maj)}`);
    const pts = passos.map((s) => [s, placar(L0, s)]);
    [['pt', 'var(--st-pt)'], ['dir', 'var(--st-dir)']].forEach(([k, cor]) => {
      svg.append('path').attr('d', d3.line()(pts.map(([s, v]) => [x(s), y(v[k])]))).style('fill', 'none').style('stroke', cor).attr('stroke-width', 2.2);
    });
    L0.filter((d) => d.tPT > -L && d.tPT < L).sort((a, b) => a.tPT - b.tPT).forEach((d, i) => {
      const v = placar(L0, d.tPT + 1e-9).pt;
      svg.append('text').attr('x', x(d.tPT) + 3).attr('y', y(v) + (i % 2 ? 12 : -5)).attr('font-size', 9).style('fill', COR[d.holder] || COR.OUTRO).text(d.uf);
    });
    const tip = document.createElement('div'); tip.className = 'st-tip'; tip.hidden = true; box.appendChild(tip);
    svg.on('mousemove', (ev) => {
      const s = x.invert(d3.pointer(ev)[0]);
      const v = placar(L0, s);
      const h = document.createElement('div'); h.className = 'st-tip-h'; h.textContent = Math.abs(s) < 0.0005 ? 'resultado real' : `${F.ppu(Math.abs(s))} para ${s > 0 ? n.pt : n.dir} em todos os estados`;
      const l = document.createElement('div'); l.textContent = `${n.pt} ${F.int(v.pt)} × ${F.int(v.dir)} ${n.dir}${tot - v.pt - v.dir ? ` (+${F.int(tot - v.pt - v.dir)} outros)` : ''}: ${desfecho(v.pt, v.dir, maj, base, n)}`;
      tip.replaceChildren(h, l);
      tipAt(box, tip, ev);
    }).on('mouseleave', () => { tip.hidden = true; });
  }

  function ataqueDefesa(p) {
    const cu = tbl('colegio_uf');
    const col = tbl('colegio');
    const box = $('#ad-chart');
    const tbs = [$('#ad-def tbody'), $('#ad-atq tbody')];
    if (!cu || !col) { if (failed('colegio_uf') || failed('colegio')) { failLine(box); tbs.forEach(failLine); } return; }
    const base = st.colBase;
    const c = linhaCol(col, p.ano, base);
    if (!c) return;
    const n = NOMES[p.ano];
    $('#ad-h').textContent = `Ataque e defesa no colégio ${BASE_ROT[base]}, ${p.ano}`;
    $('#ad-def-h').textContent = `Estados de ${n.pt} mais fáceis de perder`;
    $('#ad-atq-h').textContent = `Estados que ${n.pt} ganharia mais fácil`;
    const L0 = estados(cu, p.ano, base);
    curva(p, L0, c, base);
    const maj = +c.maioria, tot = +c.total;
    const lista = (tb, sel, sinal) => {
      tb.replaceChildren(...sel.slice(0, 10).map((d) => {
        const v = placar(L0, sinal > 0 ? d.tPT + 1e-9 : d.tPT - 1e-9);
        const tr = document.createElement('tr');
        tr.dataset.key = d.r.id;
        tr.append(td(d.holder === 'OUTRO' ? `${d.r.nome} (${d.sigla})` : d.r.nome, 'txt'));
        [[F.int(d.w), 'peso_colegio'], [F.ppu(Math.abs(d.tPT)), base === '1t' ? 'swing_1t_pp' : 'swing_para_virar_pp'], [nf0.format(d.w / Math.max(Math.abs(d.tPT) * 100, 0.01)), 'peso_colegio']].forEach(([t, f]) => {
          const cell = td(t); setMark(cell, 'colegio_uf', f, d.r.id); tr.append(cell);
        });
        const res = td(`${F.int(v.pt)} × ${F.int(v.dir)}${tot - v.pt - v.dir ? ` (+${F.int(tot - v.pt - v.dir)})` : ''}`, v.pt >= maj ? 'pos' : 'neg');
        res.title = desfecho(v.pt, v.dir, maj, base, n);
        tr.append(res);
        return tr;
      }));
    };
    lista(tbs[0], L0.filter((d) => d.holder === 'PT').sort((a, b) => b.tPT - a.tPT), -1);
    lista(tbs[1], L0.filter((d) => d.holder !== 'PT').sort((a, b) => a.tPT - b.tPT), 1);
    simulador(p, L0, c, base);
  }

  function simulador(p, L0, c, base) {
    const chave = p.ano + base;
    if (!st.sim || st.sim.chave !== chave) st.sim = { chave, set: new Set() };
    const n = NOMES[p.ano];
    const box = $('#sim-ufs');
    const novo = (d) => (d.holder === 'PT' ? 'DIR' : 'PT');
    box.replaceChildren(...L0.slice().sort((a, b) => a.swing - b.swing).map((d) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.uf = d.uf;
      const on = st.sim.set.has(d.uf);
      b.setAttribute('aria-pressed', String(on));
      b.style.borderColor = COR[d.holder] || COR.OUTRO;
      if (on) b.style.background = `color-mix(in srgb, ${COR[novo(d)]} 24%, transparent)`;
      b.textContent = `${d.uf} ${d.w} (${F.ppu(Math.abs(d.tPT)).replace(' p.p.', '')})`;
      b.title = `${d.r.nome}: ${d.holder === 'PT' ? n.pt : d.holder === 'DIR' ? n.dir : d.sigla} ${base === '1t' ? 'liderou o 1º turno' : 'venceu'}; virar exige ${F.ppu(Math.abs(d.tPT))} dos válidos trocando de lado`;
      setMark(b, 'colegio_uf', base === '1t' ? 'venc_1t' : 'venc_2t', d.r.id);
      return b;
    }));
    const dono = (d) => (st.sim.set.has(d.uf) ? novo(d) : d.holder);
    const pt = L0.reduce((a, d) => a + (dono(d) === 'PT' ? d.w : 0), 0);
    const dir = L0.reduce((a, d) => a + (dono(d) === 'DIR' ? d.w : 0), 0);
    const out = +c.total - pt - dir;
    const placarTxt = `${n.pt} ${F.int(pt)} × ${F.int(dir)} ${n.dir}${out ? ` (+${F.int(out)} outros)` : ''}`;
    const res = $('#sim-res');
    const viradas = L0.filter((d) => st.sim.set.has(d.uf));
    if (!viradas.length) { res.textContent = `Resultado ${BASE_ROT[base]}: ${placarTxt}, maioria ${F.int(c.maioria)}: ${desfecho(pt, dir, +c.maioria, base, n)}. Clique nos estados para virar.`; return; }
    const pro = viradas.filter((d) => novo(d) === 'PT'), contra = viradas.filter((d) => novo(d) === 'DIR');
    const maxS = (ds) => (ds.length ? Math.max(...ds.map((d) => Math.abs(d.tPT))) : 0);
    res.textContent = `${placarTxt}: ${desfecho(pt, dir, +c.maioria, base, n)}. `
      + (pro.length ? `Para ${n.pt}: ${pro.map((d) => d.uf).join(', ')} (swing de até ${F.ppu(maxS(pro))}). ` : '')
      + (contra.length ? `Para ${n.dir}: ${contra.map((d) => d.uf).join(', ')} (swing de até ${F.ppu(maxS(contra))}).` : '');
  }

  function liquida(p) {
    window.ST.leituras('#liq-leituras', (x) => x.id === 'saldo' || x.id === 'colegio' || x.id === 'net' || x.id === 'defesa');
    window.ST.segPressed('#f-col-base', st.colBase);
    sistemas(p);
    mapaEstados(p);
    viraUf(p);
    ataqueDefesa(p);
    barras(p);
    tabelas(p);
  }

  window.ST.init.liquida = () => {
    $('#f-col-base').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) { st.colBase = b.dataset.v; window.ST.draw(); } });
    $('#sim-ufs').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-uf]');
      if (!b || !st.sim) return;
      if (st.sim.set.has(b.dataset.uf)) st.sim.set.delete(b.dataset.uf); else st.sim.set.add(b.dataset.uf);
      window.ST.draw();
    });
    $('#sim-limpar').addEventListener('click', () => { if (st.sim) st.sim.set.clear(); window.ST.draw(); });
    $('#f-saldo-m').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) { st.saldoM = b.dataset.v; window.ST.draw(); } });
  };
  window.ST.abas.liquida = liquida;
})();
