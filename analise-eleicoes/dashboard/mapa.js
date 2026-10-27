// Capa: mapa municipal (malha pré-projetada em caminhos SVG) e painel da cidade com o histórico 2002–2026.
(() => {
  const { $, F, cls, isNum, tbl, failed, setMark, fill, td, NOMES, ANOS, REG, STATUS, st } = window.ST;
  const REGIAO = { AC: 'N', AM: 'N', AP: 'N', PA: 'N', RO: 'N', RR: 'N', TO: 'N', AL: 'NE', BA: 'NE', CE: 'NE', MA: 'NE', PB: 'NE', PE: 'NE', PI: 'NE', RN: 'NE', SE: 'NE', DF: 'CO', GO: 'CO', MS: 'CO', MT: 'CO', ES: 'SE', MG: 'SE', RJ: 'SE', SP: 'SE', PR: 'S', RS: 'S', SC: 'S' };
  const ADV_NR = { 2002: 45, 2006: 45, 2010: 45, 2014: 45, 2018: 17, 2022: 22, 2026: 22 };
  const C = { pt: '#d4513f', dir: '#3d78d8', terc: '#c98a1b', sobe: '#2a9d8f', desce: '#c0703a', ambos: '#8e6bbf', ok: '#4c9a5b', ruim: '#b23a3a', perda: '#7a5c99' };
  const OUTROS = { PSB: '#e09f3e', PPS: '#8e6bbf', PSOL: '#c05b8c', PDT: '#d97b29', PV: '#4f9d3a', MDB: '#2a9d8f', NOVO: '#e36414', AVANTE: '#9c6644', 'MISSÃO': '#6c757d', PSD: '#3c7a89', PSDB: '#5b8cc0', 'UNIÃO': '#7b6d8d', REDE: '#3a9d7a', PODE: '#6a8caf', PATRI: '#8d7b5c' };
  st.cor = 'venc2';
  st.city = '71072';
  st.cityUf = 'SP';
  const M = { src: null, regZoom: 'BR' };

  const escuro = () => {
    const c = d3.color(getComputedStyle($('#mapa-chart')).backgroundColor);
    return c ? (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255 < 0.5 : false;
  };
  const neutro = () => (escuro() ? '#3a3d42' : '#e9e6e1');
  const vazio = () => (escuro() ? '#26282c' : '#f4f2ee');
  const mix = (a, b, t) => d3.interpolateRgb(a, b)(Math.max(0, Math.min(1, t)));
  const quant = (vals, q) => { const s = vals.filter(isNum).map(Number).sort(d3.ascending); return s.length ? d3.quantileSorted(s, q) : 0; };

  // ---------- cor ----------
  function esquema(cor, ano, rows) {
    const N = neutro();
    const n = NOMES[ano];
    const seq = (campo, cor2, rotulo, fmt) => {
      const hi = quant(rows.map((r) => r[campo]).filter((v) => +v > 0), 0.98) || 1;
      return { fill: (r) => (!isNum(r[campo]) ? null : +r[campo] < 0 ? C.perda : mix(N, cor2, 0.15 + 0.85 * (+r[campo] / hi))),
        legenda: { ramp: [N, cor2], de: fmt(0), ate: fmt(hi), extra: [[C.perda, 'perdeu (negativo)']] }, rotulo, campo, fmt };
    };
    const div = (campo, c1, c2, centro, rotulo, fmt, lim) => {
      const m = lim || quant(rows.map((r) => Math.abs(+r[campo] - centro)), 0.98) || 1;
      return { fill: (r) => (!isNum(r[campo]) ? null : +r[campo] >= centro ? mix(N, c2, (+r[campo] - centro) / m) : mix(N, c1, (centro - +r[campo]) / m)),
        legenda: { ramp: [c1, N, c2], de: fmt(centro - m), ate: fmt(centro + m) }, rotulo, campo, fmt };
    };
    switch (cor) {
      case 'venc2': return {
        fill: (r) => { const s = Math.max(+r.pct_pt_2t, +r.pct_dir_2t); const c = r.venc_2t === 'PT' ? C.pt : r.venc_2t === 'DIR' ? C.dir : null; return c ? mix(N, c, 0.3 + 0.7 * (s - 0.5) / 0.35) : N; },
        legenda: { cat: [[C.pt, n.pt], [C.dir, n.dir]], nota: 'cor mais forte = votação maior' }, rotulo: 'Vencedor do 2º turno',
        texto: (r) => `${n.pt} ${F.pct(r.pct_pt_2t)} × ${n.dir} ${F.pct(r.pct_dir_2t)}` };
      case 'venc1': {
        const cores = (r) => (+r.lider1_nr === 13 ? C.pt : +r.lider1_nr === ADV_NR[ano] ? C.dir : OUTROS[r.lider1_sigla] || '#8a8f98');
        const outros = [...new Set(rows.filter((r) => isNum(r.lider1_nr) && +r.lider1_nr !== 13 && +r.lider1_nr !== ADV_NR[ano]).map((r) => r.lider1_sigla))];
        return { fill: (r) => (isNum(r.lider1_pct) ? mix(N, cores(r), 0.3 + 0.7 * (+r.lider1_pct - 0.3) / 0.5) : null),
          legenda: { cat: [[C.pt, n.pt + ' (PT)'], [C.dir, n.dir], ...outros.map((s) => [OUTROS[s] || '#8a8f98', s])], nota: 'cor mais forte = votação maior' },
          rotulo: 'Mais votado no 1º turno', texto: (r) => `${r.lider1_sigla} com ${F.pct(r.lider1_pct)}` };
      }
      case 'margem': return div('margem_2t', C.dir, C.pt, 0, 'Margem do PT no 2º turno', F.pp, 0.6);
      case 'net': return div('net_pct_aptos', C.dir, C.pt, 0, `Crescimento líquido de ${n.pt} (% do eleitorado)`, F.spct);
      case 'swing_margem': return div('swing_margem', C.dir, C.pt, 0, `Variação da margem de ${n.pt}`, F.pp);
      case 'cresc_pt': return seq('cresc_pt', C.pt, `Crescimento de ${n.pt} em votos`, F.spct);
      case 'cresc_dir': return seq('cresc_dir', C.dir, `Crescimento de ${n.dir} em votos`, F.spct);
      case 'pp_pt': return seq('pp_pt', C.pt, `Variação de ${n.pt}`, F.pp);
      case 'pp_dir': return seq('pp_dir', C.dir, `Variação de ${n.dir}`, F.pp);
      case 'pct_terceira': return seq('pct_terceira', C.terc, '3ª via no 1º turno', F.pct);
      case 'delta_pct': return div('delta_pct', C.desce, C.sobe, 0, 'Saldo recuperado (% do eleitorado)', F.spct);
      case 'captura_pt': return div('captura_pt', C.dir, C.pt, 0.5, `Fatia de ${n.pt} nos votos novos`, F.pct, 0.5);
      case 'virou': return {
        fill: (r) => (String(r.virou) === '1' ? (r.venc_2t === 'PT' ? C.pt : C.dir) : N),
        legenda: { cat: [[C.pt, `virou para ${n.pt}`], [C.dir, `virou para ${n.dir}`], [N, 'não virou']] }, rotulo: 'Virou entre os turnos',
        texto: (r) => (String(r.virou) === '1' ? `virou para ${r.venc_2t === 'PT' ? n.pt : n.dir}` : 'não virou') };
      case 'perda': return {
        fill: (r) => ({ pt: C.pt, dir: C.dir, ambos: C.ambos }[r.perda] || N),
        legenda: { cat: [[C.pt, `${n.pt} perdeu votos`], [C.dir, `${n.dir} perdeu votos`], [C.ambos, 'os dois perderam'], [N, 'ninguém perdeu']] },
        rotulo: 'Quem perdeu votos do 1º para o 2º', texto: (r) => ({ pt: `${n.pt} perdeu ${F.sint(r.ganho_pt)}`, dir: `${n.dir} perdeu ${F.sint(r.ganho_dir)}`, ambos: 'os dois perderam' }[r.perda] || 'ninguém perdeu') };
      case 'mudou': return {
        fill: (r) => (String(r.mudou_vs_ant) === '' ? vazio() : String(r.mudou_vs_ant) === '1' ? (r.venc_2t === 'PT' ? C.pt : C.dir) : N),
        legenda: { cat: [[C.pt, 'passou ao PT'], [C.dir, 'passou ao adversário'], [N, 'manteve o lado']], nota: ano === '2002' ? 'sem eleição anterior na série' : '' },
        rotulo: 'Vencedor do 2º turno vs. eleição anterior', texto: (r) => (String(r.mudou_vs_ant) === '1' ? 'mudou de lado' : String(r.mudou_vs_ant) === '0' ? 'manteve' : 'sem comparação') };
      case 'x_req_pt': return {
        fill: (r) => (r.status_req_pt === 'dispensa' ? C.ok : r.status_req_pt === 'inviavel' ? C.ruim : isNum(r.x_req_pt) ? mix('#f1c453', C.ruim, +r.x_req_pt) : null),
        legenda: { cat: [[C.ok, 'vence sem a 3ª via'], ['#f1c453', 'precisa de pouco da 3ª via'], [C.ruim, 'precisa de quase toda ou mais']], nota: 'abstenção, brancos e nulos recuperados divididos pela proporção PT × adversário do 1º turno na cidade' },
        rotulo: `3ª via que ${n.pt} precisava`, texto: (r) => reqTxt(r) };
      case 'x_levou_pt': return div('x_levou_pt', C.dir, C.pt, 0.5, `3ª via que ${n.pt} levou (resto proporcional)`, F.pct, 0.5);
      case 'cen50': return {
        fill: (r) => (r.status_pt_50 === 'dispensa' ? C.ok : r.status_pt_50 === 'inviavel' ? C.ruim : isNum(r.y_resto_pt_50) ? mix('#f1c453', C.ruim, +r.y_resto_pt_50) : null),
        legenda: { cat: [[C.ok, 'basta a 3ª via'], ['#f1c453', 'precisa de pouco do restante'], [C.ruim, 'precisa de quase tudo ou mais']] },
        rotulo: `${n.pt} com 50% da 3ª via`, texto: (r) => (r.status_pt_50 === 'dispensa' ? 'basta a 3ª via' : r.status_pt_50 === 'inviavel' ? 'acima do disponível' : `precisa de ${F.pct(r.y_resto_pt_50)} do restante`) };
      default: return esquema('venc2', ano, rows);
    }
  }

  const reqTxt = (r) => (r.status_req_pt === 'dispensa' ? 'vencia sem a 3ª via' : !isNum(r.x_req_pt) ? '—'
    : `precisava de ${F.pct(r.x_req_pt)} da 3ª via${r.status_req_pt === 'inviavel' ? ' (mais que toda)' : ''}; levou ${F.pct(r.x_levou_pt)}`);

  function legenda(e) {
    const el = $('#mapa-legenda');
    const parts = [];
    const span = (txt) => { const s = document.createElement('span'); s.textContent = txt; return s; };
    if (e.legenda.cat) {
      e.legenda.cat.forEach(([c, t]) => { const s = document.createElement('span'); const sw = document.createElement('span'); sw.className = 'st-sw'; sw.style.background = c; s.append(sw, t); parts.push(s); });
    } else {
      const s = document.createElement('span');
      const r = document.createElement('span'); r.className = 'st-ramp'; r.style.background = `linear-gradient(to right, ${e.legenda.ramp.join(', ')})`;
      s.append(e.legenda.de, r, e.legenda.ate);
      parts.push(s);
      (e.legenda.extra || []).forEach(([c, t]) => { const x = document.createElement('span'); const sw = document.createElement('span'); sw.className = 'st-sw'; sw.style.background = c; x.append(sw, t); parts.push(x); });
    }
    if (e.legenda.nota) parts.push(span(e.legenda.nota));
    const sem = document.createElement('span'); const sw = document.createElement('span'); sw.className = 'st-sw'; sw.style.background = vazio(); sw.style.outline = '1px solid var(--color-border-line)'; sem.append(sw, 'sem dado nesta eleição'); parts.push(sem);
    el.replaceChildren(...parts);
  }

  // ---------- malha ----------
  function construir() {
    const mm = tbl('malha_municipios');
    const me = tbl('malha_estados');
    const box = $('#mapa-chart');
    if (!mm || !me) { if (failed('malha_municipios') || failed('malha_estados')) window.ST.failLine(box); return false; }
    if (M.src === mm.src && box.querySelector('svg')) return true;
    const svg = d3.create('svg').attr('role', 'img').attr('aria-label', 'Mapa do Brasil por município');
    const g = svg.append('g');
    const gm = g.append('g');
    const paths = gm.selectAll('path').data(mm.rows).join('path').attr('class', 'm').attr('d', (d) => d.d);
    const gs = g.append('g').attr('pointer-events', 'none');
    gs.selectAll('path').data(me.rows).join('path').attr('d', (d) => d.d)
      .style('fill', 'none').style('stroke', 'var(--color-fg)').style('stroke-opacity', 0.55).attr('stroke-width', 0.9).attr('vector-effect', 'non-scaling-stroke');
    const hl = g.append('path').attr('pointer-events', 'none').style('fill', 'none').style('stroke', 'var(--color-fg)').attr('stroke-width', 2.5).attr('vector-effect', 'non-scaling-stroke');
    const tip = document.createElement('div'); tip.className = 'st-tip'; tip.hidden = true;
    const zb = document.createElement('div'); zb.className = 'st-zoom';
    [['+', 'Aproximar'], ['−', 'Afastar'], ['⟲', 'Ver o Brasil inteiro']].forEach(([t, a]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.setAttribute('aria-label', a); b.title = a; zb.appendChild(b); });
    box.replaceChildren(svg.node(), zb, tip);
    const bb = gs.node().getBBox();
    const vb = bb.width ? [bb.x - 4, bb.y - 4, bb.width + 8, bb.height + 8] : [0, 0, 1000, 940];
    svg.attr('viewBox', vb.join(' '));
    const ext = [[vb[0], vb[1]], [vb[0] + vb[2], vb[1] + vb[3]]];
    const zoom = d3.zoom().scaleExtent([1, 80]).extent(ext).translateExtent(ext)
      .filter((ev) => (ev.type === 'wheel' ? ev.ctrlKey || ev.metaKey : !ev.button))
      .on('zoom', (ev) => g.attr('transform', ev.transform));
    svg.call(zoom).on('dblclick.zoom', null);
    const [bMais, bMenos, bReset] = zb.children;
    const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tr = () => (reduz ? svg : svg.transition().duration(450));
    bMais.addEventListener('click', () => tr().call(zoom.scaleBy, 1.8));
    bMenos.addEventListener('click', () => tr().call(zoom.scaleBy, 1 / 1.8));
    bReset.addEventListener('click', () => tr().call(zoom.transform, d3.zoomIdentity));
    gm.on('mousemove', (ev) => {
      const d = ev.target.__data__;
      const r = d && M.linhas && M.linhas.get(d.cod);
      if (!d) { tip.hidden = true; return; }
      const h = document.createElement('div'); h.className = 'st-tip-h'; h.textContent = r ? `${r.municipio} – ${r.uf}` : d.uf;
      const l = document.createElement('div');
      l.textContent = !r ? 'sem dado nesta eleição' : M.esq.texto ? M.esq.texto(r) : `${M.esq.rotulo}: ${M.esq.fmt(r[M.esq.campo])}`;
      tip.replaceChildren(h, l);
      window.ST.tipAt(box, tip, ev);
    }).on('mouseleave', () => { tip.hidden = true; });
    gm.on('click', (ev) => {
      const d = ev.target.__data__;
      if (!d) return;
      st.city = d.cod;
      st.cityUf = d.uf;
      window.ST.draw();
    });
    const porCod = new Map();
    paths.each(function (d) { porCod.set(d.cod, this); });
    Object.assign(M, { src: mm.src, svg, g, paths, hl, zoom, vb, porCod, tr, chave: null, regZoom: 'BR', bboxReg: {} });
    return true;
  }

  function zoomPara(bb, frac) {
    const [x0, y0, w, h] = M.vb;
    const k = Math.max(1, Math.min(60, frac * Math.min(w / Math.max(bb.width, 1), h / Math.max(bb.height, 1))));
    const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
    M.tr().call(M.zoom.transform, d3.zoomIdentity.translate(x0 + w / 2 - k * cx, y0 + h / 2 - k * cy).scale(k));
  }

  function pintar(p) {
    const box = $('#mapa-chart');
    const dados = tbl('mapa_' + p.ano);
    box.dataset.source = `malha_municipios malha_estados mapa_${p.ano}`;
    if (!dados) { if (failed('mapa_' + p.ano)) window.ST.failLine(box); return; }
    const chave = [p.ano, st.cor, p.reg, dados.src.length, escuro()].join('|');
    if (M.chave !== chave || M.dadosSrc !== dados.src) {
      M.linhas = new Map(dados.rows.map((r) => [String(r.cod), r]));
      M.esq = esquema(st.cor, p.ano, dados.rows);
      const vz = vazio();
      M.paths.style('fill', (d) => { const r = M.linhas.get(d.cod); return (r && M.esq.fill(r)) || vz; })
        .style('opacity', (d) => (p.reg === 'BR' || REGIAO[d.uf] === p.reg ? 1 : 0.22));
      legenda(M.esq);
      M.chave = chave;
      M.dadosSrc = dados.src;
      // lista para a busca
      if (M.listaAno !== p.ano) {
        const dl = $('#lista-cidades');
        dl.replaceChildren(...dados.rows.map((r) => new Option(`${r.municipio} – ${r.uf}`)));
        M.nomeCod = new Map(dados.rows.map((r) => [`${r.municipio} – ${r.uf}`, [String(r.cod), r.uf]]));
        M.listaAno = p.ano;
      }
    }
    $('#mapa-h').textContent = `${M.esq.rotulo} · ${p.ano}`;
    // região: aproxima uma vez quando muda
    if (M.regZoom !== p.reg) {
      M.regZoom = p.reg;
      if (p.reg === 'BR') M.tr().call(M.zoom.transform, d3.zoomIdentity);
      else {
        let bb = M.bboxReg[p.reg];
        if (!bb) {
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          M.paths.each(function (d) { if (REGIAO[d.uf] === p.reg) { const b = this.getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); } });
          bb = M.bboxReg[p.reg] = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
        }
        zoomPara(bb, 0.92);
      }
    }
    const node = M.porCod.get(st.city);
    M.hl.attr('d', node ? node.getAttribute('d') : null);
    if (st.zoomCidade && node) { zoomPara(node.getBBox(), 0.3); st.zoomCidade = false; }
  }

  // ---------- painel da cidade ----------
  const histCache = new Map();
  function historico(uf, cod) {
    const h = tbl('hist_' + uf);
    if (!h) return null;
    let por = histCache.get(uf);
    if (!por || por.src !== h.src) {
      por = { src: h.src, m: d3.group(h.rows, (r) => String(r.cod)) };
      histCache.set(uf, por);
    }
    return (por.m.get(String(cod)) || []).slice().sort((a, b) => +b.ano - +a.ano);
  }

  function fato(rot, src, campo, id, valor, c) {
    const d = document.createElement('div'); d.className = 'st-fact';
    const a = document.createElement('span'); a.textContent = rot;
    const b = document.createElement('span');
    if (src) setMark(b, src, campo, id);
    b.textContent = valor;
    if (c) b.className = c;
    d.append(a, b);
    return d;
  }

  function painel(p) {
    const uf = st.cityUf, cod = st.city;
    const src = 'hist_' + uf;
    const linhas = historico(uf, cod);
    ['cid-cand', 'cid-disp'].forEach((id) => { const t = $('#' + id); t.dataset.source = src; t.dataset.rowKey = 'id'; });
    $('#cid-chart').dataset.source = src;
    if (!linhas) {
      if (failed(src)) ['#cid-cand tbody', '#cid-disp tbody', '#cid-cen tbody'].forEach((s) => window.ST.failLine($(s)));
      return;
    }
    if (!linhas.length) { $('#cid-nome').textContent = 'Cidade sem dados'; return; }
    const ult = linhas[0];
    $('#cid-nome').textContent = `${ult.municipio} – ${ult.uf}`;
    $('#cid-sub').textContent = `${REG[ult.regiao] || ''} · ${F.int(ult.aptos)} eleitores em ${ult.ano} · porte ${String(ult.porte).slice(4)}`;
    const r = linhas.find((x) => String(x.ano) === p.ano);
    const n = NOMES[p.ano];
    const fatos = $('#cid-fatos');
    if (r) {
      fatos.replaceChildren(
        fato(`${n.pt} no 1º → 2º`, src, 'pct_pt_2t', r.id, `${F.pct(r.pct_pt_1t)} → ${F.pct(r.pct_pt_2t)}`),
        fato(`${n.dir} no 1º → 2º`, src, 'pct_dir_2t', r.id, `${F.pct(r.pct_dir_1t)} → ${F.pct(r.pct_dir_2t)}`),
        fato(`Votos ganhos por ${n.pt}`, src, 'ganho_pt', r.id, F.sint(r.ganho_pt), cls(r.ganho_pt)),
        fato(`Votos ganhos por ${n.dir}`, src, 'ganho_dir', r.id, F.sint(r.ganho_dir), cls(r.ganho_dir)),
        fato(`Crescimento líquido de ${n.pt}`, src, 'net_votos', r.id, F.sint(r.net_votos), cls(r.net_votos)),
        fato('Variação da margem', src, 'swing_margem', r.id, F.pp(r.swing_margem), cls(r.swing_margem)),
        fato('3ª via no 1º turno', src, 'terceira_via', r.id, F.int(r.terceira_via)),
        fato('Total disponível', src, 'pool', r.id, F.int(r.pool)),
        fato(`Resto do disponível: ${n.pt} / ${n.dir} (proporção do 1º turno)`, src, 'rec_pt', r.id, `${F.sint(r.rec_pt)} / ${F.sint(r.rec_dir)}`),
        fato(`3ª via que ${n.pt} precisava (resto proporcional)`, src, 'x_req_pt', r.id, F.req(r.x_req_pt), r.status_req_pt === 'inviavel' ? 'neg' : ''),
        fato(`3ª via que ${n.pt} levou (resto proporcional)`, src, 'x_levou_pt', r.id, F.pct(r.x_levou_pt)),
      );
    } else fatos.replaceChildren(fato(`${p.ano}`, null, null, null, 'sem dado nesta eleição'));
    graficoCidade(linhas);
    // tabela de candidatos
    window.ST.rowsTable($('#cid-cand tbody'), linhas, [['ano', F.txt, 0, 1], [null, (x) => `${NOMES[x.ano].pt} × ${NOMES[x.ano].dir}`, 0, 1],
      ['pct_pt_1t', F.pct], ['pct_pt_2t', F.pct], ['ganho_pt', F.sint, 1], ['cresc_pt', F.spct, 1],
      ['pct_dir_1t', F.pct], ['pct_dir_2t', F.pct], ['ganho_dir', F.sint, 1], ['cresc_dir', F.spct, 1],
      ['net_votos', F.sint, 1], ['margem_2t', F.pp, 1], ['swing_margem', F.pp, 1],
      ['lider1_sigla', F.txt, 0, 1], ['venc_2t', F.txt, 0, 1]], (tr, x) => tr.classList.toggle('st-sel', String(x.ano) === p.ano));
    window.ST.rowsTable($('#cid-disp tbody'), linhas, [['ano', F.txt, 0, 1], ['terceira_via', F.int],
      ['abst_1t', F.int], ['abst_2t', F.int], ['delta_abst', F.sint, 1], ['brancos_1t', F.int], ['brancos_2t', F.int], ['delta_brancos', F.sint, 1],
      ['nulos_1t', F.int], ['nulos_2t', F.int], ['delta_nulos', F.sint, 1], ['delta', F.sint, 1], ['pool', F.int], ['captura_pt', F.pct],
      ['x_req_pt', F.req], ['x_levou_pt', F.pct]],
    (tr, x) => {
      tr.classList.toggle('st-sel', String(x.ano) === p.ano);
      const c = tr.children[14];
      if (c && x.status_req_pt) c.classList.add(x.status_req_pt);
    });
    // cenários da eleição escolhida
    $('#cid-cen-h').textContent = `Cenários em ${ult.municipio}, ${p.ano}`;
    $('#cid-cen-pt').textContent = n.pt;
    $('#cid-cen-dir').textContent = n.dir;
    const tb = $('#cid-cen tbody');
    if (!r) { tb.replaceChildren(); return; }
    tb.replaceChildren(...[40, 50, 60, 70, 80].map((x) => {
      const tr = document.createElement('tr');
      tr.append(td(x + '%', 'txt'));
      ['pt', 'dir'].forEach((c) => {
        [[`need_${c}_${x}`, F.int], [`y_resto_${c}_${x}`, F.pct], [`y_saldo_${c}_${x}`, F.pct]].forEach(([f, fm]) => {
          const cell = td(fm(r[f]), +r[f] < 0 ? 'mut' : '');
          setMark(cell, src, f, r.id);
          tr.append(cell);
        });
        const s = r[`status_${c}_${x}`];
        const cell = td('', 'txt');
        const chip = document.createElement('span'); chip.className = 'st-chip ' + s; chip.textContent = STATUS[s] || s;
        setMark(chip, src, `status_${c}_${x}`, r.id);
        cell.append(chip);
        tr.append(cell);
      });
      return tr;
    }));
  }

  function graficoCidade(linhas) {
    const box = $('#cid-chart');
    const W = Math.max(260, box.clientWidth);
    const H = 190;
    const m = { t: 10, r: 8, b: 24, l: 34 };
    const anos = ANOS.slice().reverse();
    const x = d3.scalePoint(anos, [m.l + 14, W - m.r - 14]);
    const y = d3.scaleLinear([0, 1], [H - m.b, m.t]);
    const svg = d3.create('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Fatia dos válidos do PT e do adversário, 1º e 2º turno, por eleição');
    [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
      svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(t)).attr('y2', y(t)).style('stroke', t === 0.5 ? 'var(--cds-chart-reference)' : 'var(--cds-chart-grid)').attr('stroke-dasharray', t === 0.5 ? '3 3' : null);
      svg.append('text').attr('x', m.l - 6).attr('y', y(t)).attr('dy', '0.35em').attr('text-anchor', 'end').attr('font-size', 10).style('fill', 'var(--color-fg-muted)').text(F.pct0(t));
    });
    anos.forEach((a) => svg.append('text').attr('x', x(a)).attr('y', H - 6).attr('text-anchor', 'middle').attr('font-size', 10).style('fill', 'var(--color-fg-muted)').text(a));
    linhas.forEach((r) => {
      const a = String(r.ano);
      [['pct_pt', '#d4513f', -5], ['pct_dir', '#3d78d8', 5]].forEach(([k, c, off]) => {
        const v1 = +r[k + '_1t'], v2 = +r[k + '_2t'];
        if (!isNum(r[k + '_1t']) || !isNum(r[k + '_2t'])) return;
        const xx = x(a) + off;
        svg.append('line').attr('x1', xx).attr('x2', xx).attr('y1', y(v1)).attr('y2', y(v2)).style('stroke', c).attr('stroke-width', 2.5).attr('stroke-linecap', 'round');
        svg.append('circle').attr('cx', xx).attr('cy', y(v1)).attr('r', 2.5).style('fill', 'var(--color-panel)').style('stroke', c).attr('stroke-width', 1.5);
        svg.append('circle').attr('cx', xx).attr('cy', y(v2)).attr('r', 3.2).style('fill', c);
      });
    });
    box.replaceChildren(svg.node());
    box.style.minHeight = H + 'px';
  }

  function desenhar(p) {
    if (construir()) pintar(p);
    painel(p);
  }

  window.ST.init.mapa = () => {
    $('#f-cor').addEventListener('change', (e) => { st.cor = e.target.value; window.ST.draw(); });
    $('#f-cidade').addEventListener('change', (e) => {
      const alvo = M.nomeCod && M.nomeCod.get(e.target.value);
      if (alvo) { st.city = alvo[0]; st.cityUf = alvo[1]; st.zoomCidade = true; window.ST.draw(); }
    });
  };
  window.ST.selecionar = (cod, uf) => { st.city = String(cod); st.cityUf = uf; st.zoomCidade = true; };
  window.ST.abas.mapa = desenhar;
})();
