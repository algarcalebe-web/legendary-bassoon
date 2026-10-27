// Aba Vitória líquida: o 2º turno contado por outras regras (colégio, estados, eleitorado, regiões, municípios)
// e o saldo de votos (PT − adversário) por estado e região em todas as eleições.
(() => {
  const { $, F, isNum, tbl, failed, failLine, td, setMark, NOMES, ANOS, st, tipAt, nf0 } = window.ST;
  st.saldoM = 'saldo_2t';
  const UFS = window.ST.UFS;
  const SIS = [['popular', (r) => `${F.mi(r.pt)} × ${F.mi(r.dir)}`], ['colegio', (r) => `${F.int(r.pt)} × ${F.int(r.dir)}`],
    ['deputados', (r) => `${F.int(r.pt)} × ${F.int(r.dir)}`], ['estados', (r) => `${F.int(r.pt)} × ${F.int(r.dir)}`],
    ['eleitorado', (r) => `${window.ST.nf1.format(r.pt / 1e6)} × ${window.ST.nf1.format(r.dir / 1e6)}`],
    ['regioes', (r) => `${F.int(r.pt)} × ${F.int(r.dir)}`], ['municipios', (r) => `${F.int(r.pt)} × ${F.int(r.dir)}`]];
  const tinta = (v, max) => {
    if (!isNum(v) || !+v) return '';
    const k = Math.round(8 + 40 * Math.min(1, Math.abs(+v) / max));
    return `background: color-mix(in srgb, var(${+v > 0 ? '--st-pt' : '--st-dir'}) ${k}%, transparent)`;
  };
  const FMT = { saldo_2t: F.smi, net_votos: F.smi, swing_margem: F.pp };

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
          c.title = `${r.vencedor === 'PT' ? NOMES[a].pt : NOMES[a].dir} vence${r.igual_popular === '0' || r.igual_popular === 0 ? ' (contraria o voto popular)' : ''}`;
          if (String(r.igual_popular) === '0') c.style.fontWeight = '600';
        }
        tr.append(c);
      });
      const r = col.by.get(`${a}-colegio`);
      [['decisivo_uf', F.txt, 'txt'], ['votos_para_virar', F.int, ''], ['estados_para_virar', F.txt, 'txt']].forEach(([f, fm, k]) => {
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
    $('#col-mapa-h').textContent = `Colégio eleitoral, ${p.ano}`;
    const col = tbl('colegio');
    const c = col && col.by.get(`${p.ano}-colegio`);
    const leg = $('#col-legenda');
    if (c) {
      const sp = (cor, txt) => { const s = document.createElement('span'); const sw = document.createElement('span'); sw.className = 'st-sw'; sw.style.background = cor; s.append(sw, txt); return s; };
      leg.replaceChildren(sp('#d4513f', `${n.pt} ${F.int(c.pt)}`), sp('#3d78d8', `${n.dir} ${F.int(c.dir)}`), document.createTextNode(`maioria: ${F.int(c.maioria)}`));
    }
    if (!me || !cu) { if (failed('malha_estados') || failed('colegio_uf')) failLine(box); return; }
    let svg = box.querySelector('svg');
    if (!svg || box.dataset.src !== String(me.rows.length)) {
      const s = d3.create('svg').attr('role', 'img').attr('aria-label', 'Estados pelo vencedor do 2º turno');
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
    const linha = (uf) => cu.by.get(`${p.ano}-${uf}`);
    s.select('g.uf').selectAll('path')
      .style('fill', (d) => { const r = linha(d.uf); if (!r) return 'var(--cds-chart-muted)'; const m = Math.min(1, Math.abs(+r.margem_2t) / 0.4); return d3.interpolateRgb('#ffffff', r.venc_2t === 'PT' ? '#d4513f' : '#3d78d8')(0.35 + 0.65 * m); })
      .on('mousemove', (ev, d) => {
        const r = linha(d.uf);
        if (!r) return;
        const h = document.createElement('div'); h.className = 'st-tip-h'; h.textContent = `${r.nome}: ${F.int(r.peso_colegio)} votos no colégio`;
        const l1 = document.createElement('div'); l1.textContent = `${n.pt} ${F.int(r.pt_2t)} × ${F.int(r.dir_2t)} ${n.dir} (margem ${F.pp(r.margem_2t)})`;
        const l2 = document.createElement('div'); l2.textContent = `virar o estado: ${F.int(r.votos_para_virar)} votos trocando de lado`;
        tip.replaceChildren(h, l1, l2);
        tipAt(box, tip, ev);
      })
      .on('mouseleave', () => { tip.hidden = true; });
    const rot = s.select('g.rot');
    rot.selectAll('text').remove();
    s.select('g.uf').selectAll('path').each(function (d) {
      const r = linha(d.uf);
      if (!r) return;
      const b = this.getBBox();
      rot.append('text').attr('x', b.x + b.width / 2).attr('y', b.y + b.height / 2).attr('text-anchor', 'middle').attr('dy', '0.35em')
        .attr('font-size', 11).attr('font-weight', 600).style('fill', '#1d1d1d').style('paint-order', 'stroke').style('stroke', 'rgba(255,255,255,0.7)').attr('stroke-width', 2.5)
        .text(`${d.uf} ${r.peso_colegio}`);
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
    const ufs = UFS.filter((u) => p.reg === 'BR' || (sa.by.get(`2026-${u}`) || {}).regiao === p.reg);
    tr2.replaceChildren(...ufs.map((u) => {
      const tr = document.createElement('tr');
      const ref = sa.by.get(`2026-${u}`);
      tr.append(td(ref ? ref.nome : u, 'txt'));
      ANOS.forEach((a) => {
        const id = `${a}-${u}`;
        const r = sa.by.get(id);
        const c = td(r ? fm(r[f]) : '—');
        if (r) { setMark(c, 'saldos', f, id); c.style.cssText = tinta(r[f], maxUf); }
        if (a === p.ano) c.style.fontWeight = '600';
        tr.append(c);
      });
      return tr;
    }));
  }

  function liquida(p) {
    window.ST.leituras('#liq-leituras', (x) => x.id === 'saldo' || x.id === 'colegio' || x.id === 'net');
    sistemas(p);
    mapaEstados(p);
    barras(p);
    tabelas(p);
  }

  window.ST.init.liquida = () => {
    $('#f-saldo-m').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) { st.saldoM = b.dataset.v; window.ST.draw(); } });
  };
  window.ST.abas.liquida = liquida;
})();
