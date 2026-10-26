// Abas de análise: visão geral, estados, porte, cenários e cidades.
(() => {
  const { $, $$, F, cls, isNum, tbl, failed, setMark, fill, failLine, td, rowsTable, textWidth, segPressed, tipAt, NOMES, ANOS, REG, STATUS, st, nf0 } = window.ST;
  st.metrica = 'cresc';
  st.sort = { k: 'cresc_pt', d: -1 };
  st.porteM = 'pp_pt';
  st.cenCand = 'pt';
  st.esc = null;
  st.cand = 'pt';
  st.crit = 'abs';
  st.q = '';
  st.filtro = 'todas';
  const disputa = (r) => `${NOMES[r.ano].pt} × ${NOMES[r.ano].dir}`;

  // ---------- visão geral ----------
  function geral(p) {
    const uf = tbl('uf');
    const id = p.ano + '-' + p.reg;
    const r = uf && uf.by.get(id);
    if (r) {
      fill($('#k-pt2'), 'uf', 'pct_pt_2t', id, F.pct(r.pct_pt_2t));
      fill($('#k-pt1'), 'uf', 'pct_pt_1t', id, F.pct(r.pct_pt_1t));
      fill($('#k-pppt'), 'uf', 'pp_pt', id, F.pp(r.pp_pt), cls(r.pp_pt));
      fill($('#k-dir2'), 'uf', 'pct_dir_2t', id, F.pct(r.pct_dir_2t));
      fill($('#k-dir1'), 'uf', 'pct_dir_1t', id, F.pct(r.pct_dir_1t));
      fill($('#k-ppdir'), 'uf', 'pp_dir', id, F.pp(r.pp_dir), cls(r.pp_dir));
      fill($('#k-cpt'), 'uf', 'cresc_pt', id, F.spct(r.cresc_pt));
      fill($('#k-gpt'), 'uf', 'ganho_pt', id, F.sint(r.ganho_pt));
      fill($('#k-cdir'), 'uf', 'cresc_dir', id, F.spct(r.cresc_dir));
      fill($('#k-gdir'), 'uf', 'ganho_dir', id, F.sint(r.ganho_dir));
      fill($('#k-pool'), 'uf', 'pool', id, F.mi(r.pool));
      fill($('#k-t'), 'uf', 'terceira_via', id, F.mi(r.terceira_via));
      fill($('#k-d'), 'uf', 'delta', id, F.smi(r.delta));
      fill($('#k-cap'), 'uf', 'captura_pt', id, F.pct(r.captura_pt));
      fill($('#k-xmin'), 'uf', 'x_min', id, F.pct(r.x_min));
    }
    fluxo(p, r);
    leituras('#leituras', (x) => x.tema !== 'lede' && x.tema !== 'auditoria');
    const tb = $('#comp-tabela tbody');
    $('#comp-nota').textContent = `Uma linha por eleição. Recorte: ${REG[p.reg]}.`;
    if (!uf) { if (failed('uf')) failLine(tb); return; }
    rowsTable(tb, ANOS.map((a) => uf.by.get(a + '-' + p.reg)).filter(Boolean), [['ano', F.txt, 0, 1], [null, disputa, 0, 1],
      ['pct_pt_1t', F.pct], ['pct_pt_2t', F.pct], ['ganho_pt', F.sint, 1], ['cresc_pt', F.spct, 1],
      ['pct_dir_1t', F.pct], ['pct_dir_2t', F.pct], ['ganho_dir', F.sint, 1], ['cresc_dir', F.spct, 1],
      ['pct_terceira', F.pct], ['delta_abst', F.sint, 1], ['delta_brancos', F.sint, 1], ['delta_nulos', F.sint, 1], ['pool', F.int], ['captura_pt', F.pct]],
    (tr, x) => tr.classList.toggle('st-sel', String(x.ano) === p.ano));
  }

  function leituras(sel, filtro) {
    const ul = $(sel);
    const ins = tbl('insights');
    if (!ins) { if (failed('insights')) failLine(ul); return; }
    const items = ins.rows.filter(filtro).sort((a, b) => +a.ordem - +b.ordem);
    ul.replaceChildren(...items.map((r) => {
      const li = document.createElement('li');
      li.id = 'leitura-' + r.id;
      const b = document.createElement('b'); setMark(b, 'insights', 'titulo', r.id); b.textContent = r.titulo;
      const s = document.createElement('span'); setMark(s, 'insights', 'texto', r.id); s.textContent = r.texto;
      li.append(b, s);
      return li;
    }));
  }
  window.ST.leituras = leituras;

  function fluxo(p, r) {
    const box = $('#fluxo-chart');
    if (!r) { if (failed('uf')) failLine(box); return; }
    const n = NOMES[p.ano];
    const muted = 'var(--cds-chart-muted)';
    const items = [
      { g: 'Origem', label: '3ª via do 1º turno', f: 'terceira_via', c: muted },
      { g: 'Origem', label: 'Queda da abstenção', f: 'delta_abst', c: muted },
      { g: 'Origem', label: 'Queda de brancos', f: 'delta_brancos', c: muted },
      { g: 'Origem', label: 'Queda de nulos', f: 'delta_nulos', c: muted },
      { g: 'Destino', label: 'Votos novos de ' + n.pt, f: 'ganho_pt', c: 'var(--st-pt)' },
      { g: 'Destino', label: 'Votos novos de ' + n.dir, f: 'ganho_dir', c: 'var(--st-dir)' },
    ].map((d) => ({ ...d, v: +r[d.f] }));
    const W = Math.max(280, box.clientWidth);
    const rowH = 28, headH = 22;
    let y = 0;
    const pos = items.map((d, i) => { if (i === 0 || items[i - 1].g !== d.g) y += headH; const yy = y; y += rowH; return yy; });
    const H = y + 8;
    const svg = d3.create('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Origem e destino dos votos novos');
    box.replaceChildren(svg.node());
    const left = Math.min(W * 0.45, d3.max(items, (d) => textWidth(svg, d.label)) + 12);
    const valW = d3.max(items, (d) => textWidth(svg, F.smi(d.v))) + 10;
    const lo = Math.min(0, d3.min(items, (d) => d.v));
    const x = d3.scaleLinear([lo, d3.max(items, (d) => Math.max(0, d.v))], [left + (lo < 0 ? valW : 0), W - valW]);
    let lastG = null;
    items.forEach((d, i) => {
      if (d.g !== lastG) { svg.append('text').attr('x', 0).attr('y', pos[i] - 6).attr('font-size', 11).style('fill', 'var(--color-fg-muted)').attr('letter-spacing', '0.04em').text(d.g.toUpperCase()); lastG = d.g; }
      const yc = pos[i] + rowH / 2;
      svg.append('text').attr('x', left - 10).attr('y', yc).attr('dy', '0.35em').attr('text-anchor', 'end').attr('font-size', 12).style('fill', 'var(--color-fg)').text(d.label);
      const x0 = x(Math.min(0, d.v)), x1 = x(Math.max(0, d.v));
      svg.append('rect').attr('x', x0).attr('y', yc - 8).attr('width', Math.max(1, x1 - x0)).attr('height', 16).attr('rx', 4).style('fill', d.c);
      svg.append('text').attr('x', d.v >= 0 ? x1 + 6 : x0 - 6).attr('y', yc).attr('dy', '0.35em').attr('text-anchor', d.v >= 0 ? 'start' : 'end').attr('font-size', 12).style('fill', 'var(--color-fg)').text(F.smi(d.v));
    });
    svg.append('line').attr('x1', x(0)).attr('x2', x(0)).attr('y1', headH - 4).attr('y2', H - 4).style('stroke', 'var(--cds-chart-axis)');
  }

  // ---------- estados ----------
  function estados(p) {
    const uf = tbl('uf');
    const box = $('#estados-chart');
    const tb = $('#estados-tabela tbody');
    segPressed('#f-metrica', st.metrica);
    if (!uf) { if (failed('uf')) { failLine(box); failLine(tb); } return; }
    const rows = uf.rows.filter((r) => r.nivel === 'UF' && r.uf !== 'VT' && String(r.ano) === p.ano && (p.reg === 'BR' || r.regiao === p.reg));
    const kp = st.metrica === 'cresc' ? 'cresc_pt' : 'pp_pt';
    const kd = st.metrica === 'cresc' ? 'cresc_dir' : 'pp_dir';
    const fmt = st.metrica === 'cresc' ? F.spct : F.pp;
    const data = rows.slice().sort((a, b) => +b[kp] - +a[kp]);
    const W = Math.max(280, box.clientWidth);
    const rowH = 30;
    const H = data.length * rowH + 28;
    const svg = d3.create('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Crescimento por estado');
    box.replaceChildren(svg.node());
    box.style.minHeight = H + 'px';
    const left = d3.max(data, (d) => textWidth(svg, d.uf)) + 12;
    const valW = d3.max(data, (d) => Math.max(textWidth(svg, fmt(d[kp]), 10), textWidth(svg, fmt(d[kd]), 10))) + 10;
    const lo = Math.min(0, d3.min(data, (d) => Math.min(+d[kp], +d[kd])));
    const hi = Math.max(0, d3.max(data, (d) => Math.max(+d[kp], +d[kd])));
    const x = d3.scaleLinear([lo, hi], [left + (lo < 0 ? valW : 0), W - valW]).nice();
    x.ticks(Math.max(2, Math.floor(W / 110))).forEach((t) => {
      svg.append('line').attr('x1', x(t)).attr('x2', x(t)).attr('y1', 0).attr('y2', H - 20).style('stroke', t === 0 ? 'var(--cds-chart-axis)' : 'var(--cds-chart-grid)');
      svg.append('text').attr('x', x(t)).attr('y', H - 6).attr('text-anchor', 'middle').attr('font-size', 11).style('fill', 'var(--color-fg-muted)').text(st.metrica === 'cresc' ? nf0.format(t * 100) + '%' : nf0.format(t * 100) + ' p.p.');
    });
    const tip = document.createElement('div'); tip.className = 'st-tip'; tip.hidden = true; box.appendChild(tip);
    const n = NOMES[p.ano];
    data.forEach((d, i) => {
      const y0 = i * rowH + 4;
      const row = svg.append('g');
      row.append('text').attr('x', left - 10).attr('y', y0 + 11).attr('dy', '0.35em').attr('text-anchor', 'end').attr('font-size', 12).style('fill', 'var(--color-fg)').text(d.uf);
      [[kp, 'var(--st-pt)', 0], [kd, 'var(--st-dir)', 12]].forEach(([k, c, off]) => {
        const v = +d[k];
        const a = x(Math.min(0, v)), b = x(Math.max(0, v));
        row.append('rect').attr('x', a).attr('y', y0 + off).attr('width', Math.max(1, b - a)).attr('height', 10).attr('rx', 3).style('fill', c);
        row.append('text').attr('x', v >= 0 ? b + 4 : a - 4).attr('y', y0 + off + 5).attr('dy', '0.35em').attr('text-anchor', v >= 0 ? 'start' : 'end').attr('font-size', 10).style('fill', 'var(--color-fg-muted)').text(fmt(v));
      });
      row.append('rect').attr('x', 0).attr('y', y0 - 2).attr('width', W).attr('height', rowH).style('fill', 'transparent')
        .on('mousemove', (ev) => {
          const h = document.createElement('div'); h.className = 'st-tip-h'; h.textContent = d.nome;
          const l1 = document.createElement('div'); l1.textContent = `${n.pt}: ${F.spct(d.cresc_pt)} · ${F.pp(d.pp_pt)} · ${F.sint(d.ganho_pt)} votos`;
          const l2 = document.createElement('div'); l2.textContent = `${n.dir}: ${F.spct(d.cresc_dir)} · ${F.pp(d.pp_dir)} · ${F.sint(d.ganho_dir)} votos`;
          tip.replaceChildren(h, l1, l2);
          tipAt(box, tip, ev);
        })
        .on('mouseleave', () => { tip.hidden = true; });
    });
    const { k, d: dir } = st.sort;
    $$('#estados-tabela thead th').forEach((th) => th.setAttribute('aria-sort', th.dataset.field === k ? (dir > 0 ? 'ascending' : 'descending') : 'none'));
    const sorted = rows.slice().sort((a, b) => (k === 'nome' ? a.nome.localeCompare(b.nome, 'pt-BR') : (+a[k] - +b[k])) * dir);
    rowsTable(tb, sorted, [['nome', F.txt, 0, 1], ['pct_pt_1t', F.pct], ['pct_pt_2t', F.pct], ['pp_pt', F.pp, 1], ['cresc_pt', F.spct, 1],
      ['pct_dir_1t', F.pct], ['pct_dir_2t', F.pct], ['pp_dir', F.pp, 1], ['cresc_dir', F.spct, 1], ['pct_terceira', F.pct],
      ['delta_abst', F.sint, 1], ['delta_brancos', F.sint, 1], ['delta_nulos', F.sint, 1], ['pool', F.int], ['captura_pt', F.pct]]);
  }

  // ---------- porte ----------
  const PORTE_FMT = { pp_pt: F.pp, pp_dir: F.pp, captura_pt: F.pct, pct_terceira: F.pct, delta_pct: F.spct, viradas_pt: F.int, viradas_dir: F.int, perdeu_dir: F.int, perdeu_pt: F.int };
  function porte(p) {
    const po = tbl('porte');
    const box = $('#porte-chart');
    const tb = $('#porte-tres tbody');
    $('#f-porte-m').value = st.porteM;
    if (!po) { if (failed('porte')) { failLine(box); failLine(tb); } return; }
    const data = [1, 2, 3, 4, 5].map((k) => po.by.get(`${p.ano}-${p.reg}-${k}`)).filter(Boolean);
    const W = Math.max(280, box.clientWidth);
    const H = 230;
    const m = { t: 18, r: 10, b: 40, l: 44 };
    const svg = d3.create('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Variação por porte');
    box.replaceChildren(svg.node());
    box.style.minHeight = H + 'px';
    const x = d3.scaleBand(data.map((d) => d.porte), [m.l, W - m.r]).padding(0.25);
    const xs = d3.scaleBand(['pt', 'dir'], [0, x.bandwidth()]).padding(0.12);
    const lo = Math.min(0, d3.min(data, (d) => Math.min(+d.pp_pt, +d.pp_dir)));
    const hi = Math.max(0.01, d3.max(data, (d) => Math.max(+d.pp_pt, +d.pp_dir)));
    const y = d3.scaleLinear([lo, hi], [H - m.b, m.t]).nice();
    y.ticks(5).forEach((t) => {
      svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(t)).attr('y2', y(t)).style('stroke', t === 0 ? 'var(--cds-chart-axis)' : 'var(--cds-chart-grid)');
      svg.append('text').attr('x', m.l - 6).attr('y', y(t)).attr('dy', '0.35em').attr('text-anchor', 'end').attr('font-size', 11).style('fill', 'var(--color-fg-muted)').text(nf0.format(t * 100) + ' p.p.');
    });
    data.forEach((d) => {
      [['pt', 'pp_pt', 'var(--st-pt)'], ['dir', 'pp_dir', 'var(--st-dir)']].forEach(([s, k, c]) => {
        const v = +d[k];
        const xx = x(d.porte) + xs(s);
        svg.append('rect').attr('x', xx).attr('y', y(Math.max(0, v))).attr('width', xs.bandwidth()).attr('height', Math.max(1, Math.abs(y(v) - y(0)))).attr('rx', 3).style('fill', c);
        svg.append('text').attr('x', xx + xs.bandwidth() / 2).attr('y', y(Math.max(0, v)) - 4).attr('text-anchor', 'middle').attr('font-size', 10).style('fill', 'var(--color-fg-muted)').text(F.pp(v).replace(' p.p.', ''));
      });
      svg.append('text').attr('x', x(d.porte) + x.bandwidth() / 2).attr('y', H - m.b + 16).attr('text-anchor', 'middle').attr('font-size', 11).style('fill', 'var(--color-fg)').text(String(d.porte).slice(4));
      svg.append('text').attr('x', x(d.porte) + x.bandwidth() / 2).attr('y', H - m.b + 30).attr('text-anchor', 'middle').attr('font-size', 10).style('fill', 'var(--color-fg-muted)').text(F.int(d.cidades) + ' cidades');
    });
    const f = st.porteM;
    tb.replaceChildren(...ANOS.map((a) => {
      const tr = document.createElement('tr');
      tr.classList.toggle('st-sel', a === p.ano);
      tr.append(td(a, 'txt'));
      [1, 2, 3, 4, 5].forEach((k) => {
        const id = `${a}-${p.reg}-${k}`;
        const r = po.by.get(id);
        const c = td(r ? PORTE_FMT[f](r[f]) : '—', f.startsWith('pp') || f === 'delta_pct' ? (r ? cls(r[f]) : '') : '');
        if (r) setMark(c, 'porte', f, id);
        tr.append(c);
      });
      return tr;
    }));
  }

  // ---------- cenários ----------
  function cenarios(p) {
    const cen = tbl('cenarios');
    const uf = tbl('uf');
    const tb = $('#cen-tabela tbody');
    const tt = $('#cen-tres tbody');
    segPressed('#f-cen-cand', st.cenCand);
    $$('#f-cen-cand button').forEach((b) => { b.textContent = NOMES[p.ano][b.dataset.v]; });
    if (!cen || !uf) { if (failed('cenarios') || failed('uf')) { failLine(tb); failLine(tt); } return; }
    const sel = $('#f-esc');
    const ufs = uf.rows.filter((r) => r.nivel === 'UF' && r.uf !== 'VT' && String(r.ano) === p.ano && (p.reg === 'BR' || r.regiao === p.reg)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const opts = [[p.reg, REG[p.reg]], ...ufs.map((r) => [r.uf, r.nome])];
    if (!st.esc || !opts.some(([v]) => v === st.esc)) st.esc = p.reg;
    sel.replaceChildren(...opts.map(([v, t]) => new Option(t, v)));
    sel.value = st.esc;
    const c = st.cenCand;
    const linhas = [40, 50, 60, 70, 80].map((x) => cen.by.get(`${p.ano}-${st.esc}-${c}-${x}`)).filter(Boolean);
    tb.replaceChildren(...linhas.map((r) => {
      const tr = document.createElement('tr');
      tr.dataset.key = r.id;
      const chip = document.createElement('span'); chip.className = 'st-chip ' + r.status; chip.textContent = STATUS[r.status] || r.status;
      const stc = td('', 'txt'); stc.append(chip);
      tr.append(td(String(r.x), 'txt'), td(F.int(r.need), +r.need < 0 ? 'mut' : ''), td(F.pct(r.y_resto), +r.y_resto < 0 ? 'mut' : ''),
        td(F.pct(r.y_saldo), +r.y_saldo < 0 ? 'mut' : ''), stc, td(F.pct(r.y_impl)));
      return tr;
    }));
    tt.replaceChildren(...ANOS.map((a) => {
      const tr = document.createElement('tr');
      tr.classList.toggle('st-sel', a === p.ano);
      tr.append(td(`${a} · ${NOMES[a][c]}`, 'txt'));
      [40, 50, 60, 70, 80].forEach((x) => {
        const id = `${a}-${st.esc}-${c}-${x}`;
        const r = cen.by.get(id);
        const cell = td(r ? F.pct(r.y_resto) : '—', r ? r.status : '');
        if (r) { setMark(cell, 'cenarios', 'y_resto', id); cell.title = STATUS[r.status]; }
        tr.append(cell);
      });
      return tr;
    }));
  }

  // ---------- cidades ----------
  function cidades(p) {
    segPressed('#f-cand', st.cand);
    segPressed('#f-crit', st.crit);
    $$('#f-cand button').forEach((b) => { b.textContent = NOMES[p.ano][b.dataset.v]; });
    const vir = tbl('viradas');
    if (vir) {
      const list = ANOS.map((a) => vir.by.get(a + '-' + p.reg)).filter(Boolean);
      const sel = (tr, x) => tr.classList.toggle('st-sel', String(x.ano) === p.ano);
      rowsTable($('#viradas-tabela tbody'), list, [['ano', F.txt, 0, 1], ['cidades', F.int], ['viradas', F.int], ['viradas_para_pt', F.int], ['viradas_para_dir', F.int],
        ['eleitores_virados', F.int], ['venc_pt_2t', F.int], ['venc_dir_2t', F.int], ['mudou_para_pt', F.int], ['mudou_para_dir', F.int]], sel);
      rowsTable($('#perdas-tabela tbody'), list, [['ano', F.txt, 0, 1], ['perdeu_pt', F.int], ['votos_perdidos_pt', F.int], ['perda_pt_saldo_pos', F.int], ['pt_acima_pool', F.int],
        ['perdeu_dir', F.int], ['votos_perdidos_dir', F.int], ['perda_dir_saldo_pos', F.int], ['dir_acima_pool', F.int]], sel);
    } else if (failed('viradas')) { failLine($('#viradas-tabela tbody')); failLine($('#perdas-tabela tbody')); }

    const res = tbl('top100_resumo');
    if (res) {
      rowsTable($('#top-resumo tbody'), ANOS.map((a) => res.by.get(`${a}-${st.cand}-${st.crit}`)).filter(Boolean), [['ano', F.txt, 0, 1], ['cidades', F.int], ['ganho_top', F.sint, 1],
        ['pct_ganho_total', F.pct], ['mediana_cresc', F.spct], ['capitais', F.int], ['reg_N', F.int], ['reg_NE', F.int], ['reg_CO', F.int], ['reg_SE', F.int], ['reg_S', F.int], ['repetidas_ant', F.int]],
      (tr, x) => tr.classList.toggle('st-sel', String(x.ano) === p.ano));
    } else if (failed('top100_resumo')) failLine($('#top-resumo tbody'));
    const top = tbl('top100');
    if (top) {
      const list = top.rows.filter((r) => String(r.ano) === p.ano && r.cand === st.cand && r.crit === st.crit && (p.reg === 'BR' || r.regiao === p.reg)).sort((a, b) => +a.rank - +b.rank);
      rowsTable($('#top-lista tbody'), list, [['rank', F.int], ['municipio', F.txt, 0, 1], ['uf', F.txt, 0, 1], ['aptos', F.int], ['votos_1t', F.int], ['votos_2t', F.int],
        ['ganho', F.sint, 1], ['cresc', F.spct, 1], ['pp', F.pp, 1], ['venc_2t', F.txt, 0, 1]]);
    } else if (failed('top100')) failLine($('#top-lista tbody'));

    const src = 'mapa_' + p.ano;
    const tabela = $('#busca-tabela');
    tabela.dataset.source = src;
    tabela.dataset.rowKey = 'id';
    const cid = tbl(src);
    const tb = $('#busca-tabela tbody');
    if (!cid) { if (failed(src)) failLine(tb); return; }
    $('#f-filtro').value = st.filtro;
    const norm = (s) => String(s).toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
    const q = norm(st.q.trim());
    const cond = { todas: () => true, pt: (r) => r.perda === 'pt' || r.perda === 'ambos', dir: (r) => r.perda === 'dir' || r.perda === 'ambos',
      ambos: (r) => r.perda === 'ambos', viradas: (r) => String(r.virou) === '1' }[st.filtro];
    const list = cid.rows.filter((r) => (p.reg === 'BR' || r.regiao === p.reg) && cond(r) && (q.length < 2 || norm(r.municipio).includes(q)))
      .sort((a, b) => +b.aptos - +a.aptos).slice(0, 200);
    rowsTable(tb, list, [['municipio', F.txt, 0, 1], ['uf', F.txt, 0, 1], ['aptos', F.int], ['pct_pt_1t', F.pct], ['pct_pt_2t', F.pct],
      ['cresc_pt', F.spct, 1], ['ganho_pt', F.sint, 1], ['pct_dir_1t', F.pct], ['pct_dir_2t', F.pct], ['cresc_dir', F.spct, 1], ['ganho_dir', F.sint, 1],
      ['pct_terceira', F.pct], ['venc_2t', F.txt, 0, 1]]);
  }

  window.ST.init.abas = () => {
    const draw = () => window.ST.draw();
    $('#f-metrica').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) { st.metrica = b.dataset.v; draw(); } });
    $('#estados-tabela thead').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-sort]');
      if (!b) return;
      const k = b.dataset.sort;
      st.sort = { k, d: st.sort.k === k ? -st.sort.d : (k === 'nome' ? 1 : -1) };
      draw();
    });
    $('#f-porte-m').addEventListener('change', (e) => { st.porteM = e.target.value; draw(); });
    $('#f-cen-cand').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) { st.cenCand = b.dataset.v; draw(); } });
    $('#f-esc').addEventListener('change', (e) => { st.esc = e.target.value; draw(); });
    $('#f-cand').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) { st.cand = b.dataset.v; draw(); } });
    $('#f-crit').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) { st.crit = b.dataset.v; draw(); } });
    let t;
    $('#f-busca').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value; draw(); }, 200); });
    $('#f-filtro').addEventListener('change', (e) => { st.filtro = e.target.value; draw(); });
    window.ST.clicavel($('#top-lista tbody'));
    window.ST.clicavel($('#busca-tabela tbody'));
  };
  Object.assign(window.ST.abas, { geral, estados, porte, cenarios, cidades });
})();
