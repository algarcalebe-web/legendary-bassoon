// Núcleo: formatação, leitura de dados, filtros, abas e o ciclo de desenho. As outras abas se registram em ST.abas.
(() => {
  const NOMES = {
    2002: { pt: 'Lula', dir: 'Serra' }, 2006: { pt: 'Lula', dir: 'Alckmin' }, 2010: { pt: 'Dilma', dir: 'Serra' },
    2014: { pt: 'Dilma', dir: 'Aécio' }, 2018: { pt: 'Haddad', dir: 'Bolsonaro' }, 2022: { pt: 'Lula', dir: 'Bolsonaro' },
    2026: { pt: 'Lula', dir: 'Flávio' },
  };
  const ANOS = ['2026', '2022', '2018', '2014', '2010', '2006', '2002'];
  const REG = { BR: 'Brasil', N: 'Norte', NE: 'Nordeste', CO: 'Centro-Oeste', SE: 'Sudeste', S: 'Sul', EX: 'Exterior' };
  const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
  const TABS = ['mapa', 'geral', 'estados', 'porte', 'cenarios', 'cidades', 'terceira', 'auditoria', 'metodo'];
  const STATUS = { dispensa: 'Basta a 3ª via', viavel: 'Viável', inviavel: 'Acima do disponível' };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const isNum = (v) => v !== '' && v != null && !Number.isNaN(+v);
  const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nf3 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const sgn = (v) => (+v > 0 ? '+' : +v < 0 ? '−' : '');
  const neg = (v) => (+v < 0 ? '−' : '');
  const F = {
    int: (v) => (isNum(v) ? neg(v) + nf0.format(Math.abs(+v)) : '—'),
    sint: (v) => (isNum(v) ? sgn(v) + nf0.format(Math.abs(+v)) : '—'),
    pct: (v) => (isNum(v) ? neg(v) + nf1.format(Math.abs(+v) * 100) + '%' : '—'),
    pct0: (v) => (isNum(v) ? neg(v) + nf0.format(Math.abs(+v) * 100) + '%' : '—'),
    spct: (v) => (isNum(v) ? sgn(v) + nf1.format(Math.abs(+v) * 100) + '%' : '—'),
    pp: (v) => (isNum(v) ? sgn(v) + nf1.format(Math.abs(+v) * 100) + ' p.p.' : '—'),
    mi: (v) => (isNum(v) ? neg(v) + nf2.format(Math.abs(+v) / 1e6) + ' mi' : '—'),
    smi: (v) => (isNum(v) ? sgn(v) + nf2.format(Math.abs(+v) / 1e6) + ' mi' : '—'),
    dec: (v) => (isNum(v) ? neg(v) + nf3.format(Math.abs(+v)) : '—'),
    dec2: (v) => (isNum(v) ? sgn(v) + nf2.format(Math.abs(+v)) : '—'),
    txt: (v) => (v == null || v === '' ? '—' : String(v)),
  };
  const cls = (v) => (!isNum(v) ? '' : +v > 0 ? 'pos' : +v < 0 ? 'neg' : '');

  // dados: índice por id, refeito só quando o dataset muda
  const cache = new Map();
  function tbl(id) {
    const d = dash.data(id);
    if (d.status !== 'ok' || !Array.isArray(d.data)) return null;
    let c = cache.get(id);
    if (!c || c.src !== d.data) {
      c = { src: d.data, rows: d.data, by: new Map(d.data.map((r) => [String(r.id), r])) };
      cache.set(id, c);
    }
    return c;
  }
  const failed = (id) => dash.data(id).status === 'error';
  function setMark(el, src, field, id) {
    el.dataset.source = src;
    el.dataset.field = field;
    el.dataset.where = 'id=' + encodeURIComponent(id);
  }
  function fill(el, src, field, id, text, extra) {
    if (!el) return;
    setMark(el, src, field, id);
    el.textContent = text;
    el.classList.remove('dash-skeleton', 'pos', 'neg');
    if (extra) el.classList.add(extra);
  }
  function failLine(container) {
    const d = document.createElement('div');
    d.className = 'st-fail';
    d.textContent = 'Failed to load';
    container.replaceChildren(d);
  }
  function td(text, className) {
    const c = document.createElement('td');
    c.textContent = text;
    if (className) c.className = className;
    return c;
  }
  // linhas de uma tabela marcada com data-source + data-row-key="id": cols = [campo, formato, colorir?, texto?]
  function rowsTable(tb, list, cols, extra) {
    tb.replaceChildren(...list.map((r) => {
      const tr = document.createElement('tr');
      tr.dataset.key = r.id;
      if (r.cod) tr.dataset.cod = r.cod;
      if (r.uf) tr.dataset.uf = r.uf;
      cols.forEach(([f, fm, c, t]) => tr.append(f == null ? td(fm(r), t ? 'txt' : '') : td(fm(r[f], r), (t ? 'txt' : '') + (c ? ' ' + cls(r[f]) : ''))));
      if (extra) extra(tr, r);
      return tr;
    }));
  }
  function textWidth(svg, s, size = 12) {
    const t = svg.append('text').attr('font-size', size).text(s);
    const w = t.node().getComputedTextLength();
    t.remove();
    return w;
  }
  function segPressed(sel, v) { $$(sel + ' button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v))); }
  function tipAt(box, tip, ev) {
    const [x, y] = d3.pointer(ev, box);
    tip.hidden = false;
    tip.style.left = Math.max(0, Math.min(box.clientWidth - tip.offsetWidth, x + 12)) + 'px';
    tip.style.top = Math.min(box.clientHeight - tip.offsetHeight, y + 14) + 'px';
  }

  const st = { tab: 'mapa' };
  const P = () => {
    const p = dash.params();
    return { ano: String(p.ano ?? '2026'), reg: String(p.regiao ?? 'BR') };
  };
  const abas = {};

  function drawHead(p) {
    segPressed('#f-ano', p.ano);
    $('#f-reg').value = p.reg;
    const n = NOMES[p.ano];
    $('#disputa').textContent = n.pt + ' (PT) × ' + n.dir;
    $$('.n-pt').forEach((el) => { el.textContent = n.pt; });
    $$('.n-dir').forEach((el) => { el.textContent = n.dir; });
    $$('button[data-lab]').forEach((b) => { b.textContent = n[b.dataset.lab] + b.dataset.suf; });
    const ins = tbl('insights');
    const lede = $('#lede');
    if (ins) {
      const id = 'lede-' + p.ano;
      const r = ins.by.get(id);
      fill(lede, 'insights', 'texto', id, r ? r.texto : '—');
    } else if (failed('insights')) {
      lede.classList.remove('dash-skeleton');
      lede.textContent = '—';
    }
  }

  function draw() {
    const p = P();
    drawHead(p);
    const f = abas[st.tab];
    if (f) f(p);
  }

  function showTab(tab, push) {
    if (!TABS.includes(tab)) tab = 'mapa';
    st.tab = tab;
    TABS.forEach((t) => {
      $('#' + t).hidden = t !== tab;
      $('#tab-' + t).setAttribute('aria-selected', String(t === tab));
    });
    if (push) dash.setLink(tab);
    draw();
  }

  // abre uma cidade no mapa (usado pelas tabelas clicáveis)
  function abrirCidade(cod, uf) {
    if (ST.selecionar) ST.selecionar(String(cod), uf);
    showTab('mapa', true);
  }
  function clicavel(tbody) {
    tbody.addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-cod]');
      if (tr) abrirCidade(tr.dataset.cod, tr.dataset.uf);
    });
  }

  function start() {
    $('#f-ano').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) dash.setParams({ ano: b.dataset.v }); });
    $('#f-reg').addEventListener('change', (e) => dash.setParams({ regiao: e.target.value }));
    $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (b) showTab(b.dataset.tab, true); });
    Object.values(ST.init).forEach((f) => f());
    const h = location.hash.slice(1);
    showTab(TABS.includes(h) ? h : 'mapa', false);
    dash.onData(draw);
  }

  window.ST = { NOMES, ANOS, REG, UFS, STATUS, F, cls, isNum, $, $$, tbl, failed, setMark, fill, failLine, td, rowsTable,
    textWidth, segPressed, tipAt, st, P, abas, init: {}, draw, start, abrirCidade, clicavel, nf0, nf1 };
})();
