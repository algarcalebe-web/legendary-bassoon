// Waves deck: 43 streams ordered by the capital each needs, funded from organic profit.
// Inputs: pb.json (collector output, for portfolio stack), waves_slides.json (condensed streams), playbooks_deck_slides.json (days, risks), deneffe_pivot.json.
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");
const [PBJ, WJ, DJ, OUT] = process.argv.slice(2);
const PF = JSON.parse(fs.readFileSync(PBJ, "utf8")).portfolio;
const ST = JSON.parse(fs.readFileSync(WJ, "utf8"));
const DS = JSON.parse(fs.readFileSync(DJ, "utf8"));
const PIV = JSON.parse(fs.readFileSync(__dirname + "/deneffe_pivot.json", "utf8"));

const THEME = {
  name: "Revenue Waves", headFontFace: "Cambria", bodyFontFace: "Calibri",
  colors: { dk1: "14211D", lt1: "FFFFFF", dk2: "0D6655", lt2: "EEF3F1", accent1: "0D6655", accent2: "8A5A00",
    accent3: "5CC2A8", accent4: "C9D8D2", accent5: "2F4A43", accent6: "B84A2E", hlink: "0D6655", folHlink: "8A5A00" },
};
const HEX = THEME.colors;
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Revenue Waves: From Zero Capital to Compounding Assets";
pres.author = "Calebe Garcia";
const C = pres.SchemeColor;
const W = 13.333, M = 0.6, MUTED = "55645F";

pres.defineSlideMaster({
  title: "DARK", background: { color: HEX.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 1.9, w: W - 2 * M, h: 1.9, fontSize: 42, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: "bottom" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 4.0, w: W - 2 * M, h: 3.0, fontSize: 17, color: C.accent4, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "DARKLIST", background: { color: HEX.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.5, w: W - 2 * M, h: 1.0, fontSize: 40, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: "middle" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 1.75, w: W - 2 * M, h: 5.3, fontSize: 16, color: C.accent4, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT", background: { color: HEX.lt1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.35, w: W - 2 * M, h: 0.85, fontSize: 28, bold: true, color: C.text1, fontFace: THEME.headFontFace, valign: "middle" }, text: "" } },
    { text: { text: "Calebe Garcia · Revenue Waves · Oct 2026", options: { x: M, y: 7.05, w: 6, h: 0.3, fontSize: 10, color: MUTED, margin: 0 } } },
  ],
  slideNumber: { x: W - M - 0.6, y: 7.05, w: 0.6, h: 0.3, fontSize: 10, color: MUTED, align: "right" },
});

let section = "";
const sec = (t) => { section = t; pres.addSection({ title: t }); };
const slide = (m, t) => { const s = pres.addSlide({ masterName: m, sectionTitle: section }); if (t) s.addText(t, { placeholder: "title" }); return s; };
const tb = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, fontSize: 14, color: C.text1, valign: "top", ...o });
const card = (s, x, y, w, h, fill = C.background2) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08 });
const circle = (s, x, y, d, label, fill = C.accent1, fs = 14) =>
  s.addText(String(label), { shape: pres.shapes.OVAL, x, y, w: d, h: d, fill: { color: fill }, color: C.background1, fontSize: fs, bold: true, align: "center", valign: "middle", margin: 0 });
const k = (n) => (n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${Math.round(n)}`);
const hdr = (cells, fill = C.accent1) => cells.map((t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: fill } } }));
const TBL = { fontFace: "Calibri", color: C.text1, border: { type: "solid", pt: 0.5, color: "D3DCD8" }, valign: "middle" };

// Waves by start capital; inside a wave: core streams first, then fastest cash, then month-12 value.
const CORE = new Set(PF.phases.flatMap((p) => p.streams));
const WAVES = [
  { n: 1, name: "Wave 1 · Zero capital: sell expertise and time", max: 150, col: C.accent1, hex: HEX.accent1,
    entry: "Start now. Needs only a laptop, Wise and free tools.", rule: "Goal: first USD in weeks 2-4 and a monthly surplus. Put 30% of every net dollar into the growth fund." },
  { n: 2, name: "Wave 2 · Bootstrap: productise what Wave 1 taught you", max: 1000, col: C.accent3, hex: HEX.accent3,
    entry: "Opens when Wave 1 nets US$2k+/month for 2 months in a row and the growth fund covers the wave's start capital.", rule: "Build products from repeated client questions; each launch is paid from the fund, never from savings." },
  { n: 3, name: "Wave 3 · Reinvest: buy speed with profit", max: 5000, col: C.accent2, hex: HEX.accent2,
    entry: "Opens when net income is US$5k+/month and the growth fund holds US$5k+.", rule: "Spend on panels, ads tests, analysts and apps only after a paid pilot proves demand." },
  { n: 4, name: "Wave 4 · Capital-backed: compounding assets", max: Infinity, col: C.accent6, hex: HEX.accent6,
    entry: "Opens when net income clears the US$10k floor for 3 months and the growth fund holds US$15k+.", rule: "Cap any single bet at 25% of the fund; keep 6 months of personal costs untouched." },
];
ST.forEach((x) => { x.wave = WAVES.find((w) => x.start_capital_usd <= w.max); x.core = CORE.has(x.id); });
const days = (t) => { const m = String(t).match(/(\d+)\s*(day|week|month)/i); if (!m) return 999; return +m[1] * (/day/i.test(m[2]) ? 1 : /week/i.test(m[2]) ? 7 : 30); };
WAVES.forEach((w) => { w.items = ST.filter((x) => x.wave === w).sort((a, b) => (b.core - a.core) || (days(a.first_cash) - days(b.first_cash)) || (b.m12 - a.m12)); });
const stack = PF.stack, at = (m) => stack.find((r) => r.month === m);

// ---------- Overview ----------
sec("Overview");
let s = slide("DARK", "Revenue Waves: From Zero Capital to Compounding Assets");
s.addText([
  { text: `${ST.length} revenue streams in 4 waves, ordered by the cash each needs to start`, options: { breakLine: true } },
  { text: "Start with what needs only your expertise; let profit, not savings, fund every next wave", options: { breakLine: true, color: C.accent3 } },
  { text: "Calebe Garcia · October 2026 · US$10k/month net is the floor, not the target", options: { fontSize: 14 } },
], { placeholder: "body" });

s = slide("CONTENT", "The rule: every wave is paid for by the one before it");
WAVES.forEach((w, i) => {
  const x = M + i * 3.07, y = 4.3 - i * 0.85, h = 2.4 + i * 0.85;
  card(s, x, y, 2.9, h, i === 0 ? "DCEFEA" : C.background2);
  circle(s, x + 0.2, y + 0.2, 0.6, w.n, w.col, 18);
  const cap = i === 0 ? "≤ US$150" : i === 3 ? "> US$5k" : `≤ US$${w.max.toLocaleString("en-US")}`;
  tb(s, cap + " to start", { x: x + 0.95, y: y + 0.28, w: 1.85, h: 0.45, fontSize: 15, bold: true, color: w.col });
  tb(s, `${w.items.length} streams`, { x: x + 0.2, y: y + 0.95, w: 2.5, h: 0.35, fontSize: 14, bold: true });
  tb(s, w.entry, { x: x + 0.2, y: y + 1.35, w: 2.5, h: h - 1.5, fontSize: 12, color: MUTED });
});
tb(s, "Growth fund: 30% of every net dollar. A wave opens only when its entry trigger is met; until then its streams stay on the bench.", { x: M, y: 1.25, w: 8.6, h: 0.8, fontSize: 15, bold: true, color: C.accent1 });

s = slide("CONTENT", "Where it lands, and the uncomfortable part");
[[`Month 10`, "Base case clears US$10k net (Aug 2027)", C.accent1], [k(at(12).base), "Base net/month at month 12", C.accent1], [k(at(24).base), `Base at month 24 (strong ${k(at(24).strong)})`, C.accent1], ["> 24 mo", `Conservative: ${k(at(24).conservative)} at month 24`, C.accent6]].forEach(([v, l, col], i) => {
  const x = M + i * 3.1;
  card(s, x, 1.4, 2.85, 2.2);
  tb(s, v, { x: x + 0.25, y: 1.6, w: 2.4, h: 0.95, fontSize: 36, bold: true, color: col, fontFace: THEME.headFontFace });
  tb(s, l, { x: x + 0.25, y: 2.6, w: 2.4, h: 0.85, fontSize: 13 });
});
const sumH = ST.reduce((a, x) => a + (parseFloat(String(x.hours).split("·")[1]) || 0), 0);
tb(s, [
  { text: "You cannot run all of these at once. ", options: { bold: true, color: C.accent6 } },
  { text: `The ${ST.length} streams need roughly ${Math.round(sumH)} hours a week in steady state; you have 40. The waves decide the order; the gates decide what survives. Expect to run 8-12 streams at any time and keep the rest on the bench.`, options: { breakLine: true } },
  { text: "The projection above comes from the 13-stream stack plan (assumption-based, after a 25% overlap cut). The two travel streams in that plan are excluded here, so treat it as an upper reference until the gates produce real numbers.", options: { color: MUTED, fontSize: 13 } },
], { x: M, y: 3.95, w: W - 2 * M, h: 2.8, fontSize: 15, paraSpaceAfter: 10 });

// Capital by wave chart + summary table
s = slide("CONTENT", "Capital needed rises wave by wave; so does what it can earn");
const capW = WAVES.map((w) => w.items.reduce((a, x) => a + x.start_capital_usd, 0));
const m12W = WAVES.map((w) => w.items.reduce((a, x) => a + x.m12, 0));
s.addChart(pres.charts.BAR, [{ name: "Start capital (US$, all streams in wave)", labels: WAVES.map((w) => `Wave ${w.n}`), values: capW }], {
  x: M, y: 1.3, w: 6.0, h: 4.6, barDir: "col", chartColors: [HEX.accent2], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "$#,##0", dataLabelFontSize: 12, dataLabelFontFace: "+mn-lt", dataLabelColor: "333333",
  showTitle: true, title: "Start capital per wave (sum, US$)", titleFontSize: 14, titleFontFace: "+mn-lt", titleColor: "333333", showLegend: false,
  catAxisLabelColor: MUTED, valAxisLabelColor: MUTED, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", catAxisLabelFontSize: 12, valAxisLabelFontSize: 11, valAxisLabelFormatCode: "$#,##0",
  valGridLine: { color: "E3E9E6", size: 0.5 }, catGridLine: { style: "none" },
});
const sumRows = WAVES.map((w, i) => [{ text: `Wave ${w.n}`, options: { bold: true, color: w.col } }, String(w.items.length), String(w.items.filter((x) => x.core).length), k(capW[i]), k(m12W[i])]);
s.addTable([hdr(["Wave", "Streams", "Core", "Start capital", "Month-12 base (sum)"])].concat(sumRows), { ...TBL, x: 7.0, y: 1.4, w: W - M - 7.0, colW: [1.1, 1.0, 0.8, 1.4, 1.43], fontSize: 13, rowH: 0.5 });
tb(s, "Month-12 sums assume every stream in a wave runs, which the 40-hour week does not allow; read them as each wave's ceiling, not a forecast. Core = in the stack plan.", { x: 7.0, y: 4.2, w: W - M - 7.0, h: 1.4, fontSize: 12, italic: true, color: MUTED });

// Master wave timeline
sec("Timeline");
s = slide("CONTENT", "Master timeline: when each wave opens if the triggers are hit on plan");
const TM = 24, gx = M + 3.0, gw = W - M - gx;
const wins = [[0, 24], [3, 24], [6, 24], [12, 24]];
WAVES.forEach((w, i) => {
  const y = 1.45 + i * 1.3, [a, b] = wins[i];
  tb(s, `Wave ${w.n}`, { x: M, y, w: 2.9, h: 0.4, fontSize: 16, bold: true, color: w.col });
  tb(s, `${w.items.length} streams · from month ${a}`, { x: M, y: y + 0.4, w: 2.9, h: 0.3, fontSize: 12, color: MUTED });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: gx + (a / TM) * gw, y: y + 0.1, w: ((b - a) / TM) * gw, h: 0.55, fill: { color: w.col }, line: { type: "none" }, rectRadius: 0.06 });
  tb(s, w.items.slice(0, 6).map((x) => x.name).join(" · ") + (w.items.length > 6 ? " …" : ""), { x: gx + (a / TM) * gw, y: y + 0.72, w: ((b - a) / TM) * gw, h: 0.45, fontSize: 11, color: MUTED });
});
[0, 3, 6, 9, 12, 18, 24].forEach((m) => tb(s, "M" + m, { x: gx + (m / TM) * gw - 0.3, y: 6.7, w: 0.6, h: 0.3, fontSize: 11, color: MUTED, align: "center" }));
tb(s, "Month 0 = 12 Oct 2026. Planned opening months follow the stack plan's base case; a wave opens later if its trigger is late, never earlier.", { x: M, y: 6.35, w: 2.9, h: 0.7, fontSize: 10, italic: true, color: MUTED });

// Growth fund mechanics
s = slide("CONTENT", "How organic capital is built and spent");
[
  ["Bank it", "Every client payment lands in Wise USD/EUR. Pay yourself a fixed draw; the rest is surplus."],
  ["Split it", "30% of net profit goes to the growth fund, 10% to tax reserve; keep 6 months of personal costs untouched."],
  ["Prove it", "Before spending, pre-sell: a paid pilot, a waitlist with deposits, or 3 signed buyers."],
  ["Spend it", "Fund the next wave's start capital only; cap any single bet at 25% of the fund."],
  ["Judge it", "Every stream has a dated kill/hold/scale gate. Killed streams return their budget to the fund."],
].forEach(([h, t], i) => {
  const y = 1.4 + i * 1.08;
  circle(s, M, y + 0.08, 0.65, i + 1);
  tb(s, h, { x: M + 0.95, y, w: 2.2, h: 0.85, fontSize: 18, bold: true, valign: "middle", color: C.accent1 });
  card(s, M + 3.3, y - 0.02, W - 2 * M - 3.3, 0.88);
  tb(s, t, { x: M + 3.55, y: y + 0.03, w: W - 2 * M - 3.8, h: 0.8, fontSize: 15, valign: "middle" });
});

// First 14 days
sec("First 14 days");
[[0, 7], [7, 14]].forEach(([a, b], pi) => {
  s = slide("CONTENT", pi ? "First 14 days: week 2" : "First 14 days: week 1 (zero capital, payment gates first)");
  DS.days.slice(a, b).forEach((d, i) => {
    const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4, cw = (W - 2 * M - 0.3) / 2;
    const x = M + col * (cw + 0.3), y = 1.4 + row * 1.38;
    card(s, x, y, cw, 1.22);
    circle(s, x + 0.2, y + 0.3, 0.62, a + i + 1, C.accent1, 16);
    tb(s, d.day, { x: x + 1.0, y: y + 0.12, w: cw - 1.2, h: 0.3, fontSize: 13, bold: true, color: C.accent2 });
    tb(s, d.do, { x: x + 1.0, y: y + 0.42, w: cw - 1.2, h: 0.75, fontSize: 13 });
  });
});

// ---------- Waves ----------
function streamSlide(x, w, idx) {
  const s = slide("CONTENT", `${w.n}.${idx} ${x.name}`);
  tb(s, [{ text: x.core ? "CORE · " : "BENCH · ", options: { bold: true, color: x.core ? C.accent1 : C.accent2 } }, { text: x.why, options: { italic: true, color: MUTED } }], { x: M, y: 1.15, w: 7.6, h: 0.55, fontSize: 13 });
  x.steps.slice(0, 8).forEach((st, j) => {
    const y = 1.8 + j * 0.64;
    circle(s, M, y + 0.06, 0.42, j + 1, w.col, 13);
    tb(s, st.when, { x: M + 0.55, y, w: 1.35, h: 0.55, fontSize: 12, bold: true, color: C.accent2, valign: "middle" });
    tb(s, st.do, { x: M + 1.95, y, w: 5.75, h: 0.58, fontSize: 13, valign: "middle" });
  });
  const px = 8.75, pw = W - M - px, cw = (pw - 0.5) / 3;
  card(s, px, 1.15, pw, 5.75);
  let y = 1.28;
  const lab = (t) => { tb(s, t, { x: px + 0.25, y, w: pw - 0.5, h: 0.25, fontSize: 10, bold: true, color: C.accent2, charSpacing: 1 }); y += 0.27; };
  const trio = (vals, color) => { vals.forEach(([l, v], j) => { const bx = px + 0.25 + j * cw; tb(s, v, { x: bx, y, w: cw, h: 0.36, fontSize: 16, bold: true, color, fontFace: THEME.headFontFace }); tb(s, l, { x: bx, y: y + 0.36, w: cw, h: 0.22, fontSize: 10, color: MUTED }); }); y += 0.64; };
  lab("CAPITAL");
  trio([["to start", k(x.start_capital_usd)], ["per month", k(x.monthly_cost_usd)], ["first cash", x.first_cash]], w.col);
  tb(s, x.capital_note, { x: px + 0.25, y, w: pw - 0.5, h: 0.5, fontSize: 11 }); y += 0.55;
  lab("OFFERS");
  x.offers.slice(0, 3).forEach((o) => { tb(s, [{ text: o.name + ": ", options: { bold: true } }, { text: o.price, options: { color: C.accent1 } }], { x: px + 0.25, y, w: pw - 0.5, h: 0.4, fontSize: 11 }); y += 0.42; });
  lab("BASE NET US$/MONTH");
  trio([["M3", k(x.m3)], ["M12", k(x.m12)], ["M24", k(x.m24)]], C.accent1);
  tb(s, x.hours, { x: px + 0.25, y, w: pw - 0.5, h: 0.25, fontSize: 11, color: MUTED }); y += 0.3;
  tb(s, [{ text: "Gate: ", options: { bold: true, color: C.accent6 } }, { text: x.gate }], { x: px + 0.25, y, w: pw - 0.5, h: 6.8 - y, fontSize: 11 });
  return s;
}
function pivotSlides() {
  const TB = { ...TBL };
  const H = (cells) => hdr(cells, C.accent2);
  let s = slide("CONTENT", "Pricing practice pivot: build it with Deneffe Consulting");
  tb(s, PIV.summary, { x: M, y: 1.2, w: W - 2 * M, h: 1.05, fontSize: 14 });
  s.addTable([H(["Joint offer", "Price (illustrative)", "Who does what", "Role"])].concat(PIV.ladder.map((r) => r.map((t, j) => (j === 0 ? { text: t, options: { bold: true } } : t)))),
    { ...TB, x: M, y: 2.4, w: 7.7, colW: [2.2, 1.6, 2.6, 1.3], fontSize: 12, rowH: 0.62 });
  const px2 = 8.55, pw2 = W - M - px2;
  card(s, px2, 2.4, pw2, 4.4);
  tb(s, "HIS GAPS → WHAT CLOSES THEM", { x: px2 + 0.25, y: 2.55, w: pw2 - 0.5, h: 0.25, fontSize: 11, bold: true, color: C.accent2, charSpacing: 1 });
  tb(s, PIV.gaps.flatMap(([g, f], j) => [{ text: `${g}: `, options: { bold: true } }, { text: f, options: { breakLine: j < PIV.gaps.length - 1 } }]), { x: px2 + 0.25, y: 2.9, w: pw2 - 0.5, h: 3.8, fontSize: 12, paraSpaceAfter: 6 });
  tb(s, PIV.economics, { x: M, y: 5.75, w: 7.7, h: 1.0, fontSize: 12, italic: true, color: MUTED });
  s = slide("CONTENT", "Pricing practice pivot: terms and the 90-day pilot");
  s.addTable([H(["Term", "Proposal"])].concat(PIV.terms.map(([a, b]) => [{ text: a, options: { bold: true } }, b])), { ...TB, x: M, y: 1.3, w: 6.0, colW: [1.5, 4.5], fontSize: 12, rowH: 0.7 });
  PIV.pilot.forEach(([wk, d], j) => {
    const y = 1.3 + j * 1.15;
    circle(s, 6.95, y + 0.15, 0.55, j + 1, C.accent2, 14);
    tb(s, wk, { x: 7.65, y, w: 5.1, h: 0.3, fontSize: 13, bold: true, color: C.accent2 });
    tb(s, d, { x: 7.65, y: y + 0.3, w: 5.1, h: 0.8, fontSize: 12 });
  });
  card(s, 6.95, 4.85, W - M - 6.95, 1.95, "DCEFEA");
  tb(s, [{ text: "Success bar: ", options: { bold: true, color: C.accent1 } }, { text: PIV.success_bar, options: { breakLine: true } }, { text: "Capital needed: ", options: { bold: true, color: C.accent1 } }, { text: "none beyond Wave 1 tools; the partnership trades revenue share for credibility and higher price points." }],
    { x: 7.15, y: 4.95, w: W - M - 7.35, h: 1.8, fontSize: 12, paraSpaceAfter: 6 });
}

WAVES.forEach((w) => {
  if (!w.items.length) return;
  sec(`Wave ${w.n}`);
  let s = slide("DARK", w.name);
  s.addText([
    { text: "Entry trigger: ", options: { bold: true, color: C.accent3 } }, { text: w.entry, options: { breakLine: true } },
    { text: "Rule: ", options: { bold: true, color: C.accent3 } }, { text: w.rule, options: { breakLine: true } },
    { text: `${w.items.length} streams · start capital ${k(w.items.reduce((a, x) => a + x.start_capital_usd, 0))} if all launched · core first: ${w.items.filter((x) => x.core).map((x) => x.name).join(", ") || "none"}`, options: { fontSize: 14 } },
  ], { placeholder: "body", paraSpaceAfter: 8 });
  // Wave overview table (split at 10 rows)
  for (let a = 0; a < w.items.length; a += 10) {
    const part = w.items.slice(a, a + 10);
    s = slide("CONTENT", `Wave ${w.n} at a glance${w.items.length > 10 ? ` (${a / 10 + 1}/${Math.ceil(w.items.length / 10)})` : ""}: launch in this order`);
    s.addTable([hdr(["#", "Stream", "Status", "Start $", "Per month $", "First cash", "M12 base", "Hours"])].concat(part.map((x, j) => [
      String(a + j + 1), { text: x.name, options: { bold: true } }, { text: x.core ? "Core" : "Bench", options: { color: x.core ? C.accent1 : C.accent2, bold: true } },
      k(x.start_capital_usd), k(x.monthly_cost_usd), x.first_cash, k(x.m12), x.hours])),
      { ...TBL, x: M, y: 1.3, w: W - 2 * M, colW: [0.45, 3.6, 0.9, 1.0, 1.15, 1.6, 1.05, 2.38], fontSize: 12, rowH: 0.48 });
  }
  // Scale levers
  for (let a = 0; a < w.items.length; a += 8) {
    const part = w.items.slice(a, a + 8);
    s = slide("CONTENT", `Wave ${w.n}: what to watch, and what capital unlocks later${w.items.length > 8 ? ` (${a / 8 + 1}/${Math.ceil(w.items.length / 8)})` : ""}`);
    s.addTable([hdr(["Stream", "Target", "Scale with capital"])].concat(part.map((x) => [{ text: x.name, options: { bold: true } }, x.kpi, x.scale_with_capital])),
      { ...TBL, x: M, y: 1.3, w: W - 2 * M, colW: [3.0, 4.6, W - 2 * M - 7.6], fontSize: 11, rowH: 0.64 });
  }
  w.items.forEach((x, i) => { streamSlide(x, w, i + 1); if (x.id === PIV.id) pivotSlides(); });
});

// ---------- Control ----------
sec("Control");
const all = WAVES.flatMap((w) => w.items.map((x) => ({ ...x, wn: w.n })));
for (let a = 0; a < all.length; a += 11) {
  s = slide("CONTENT", `Decision gates: kill, hold or scale on dates (${a / 11 + 1}/${Math.ceil(all.length / 11)})`);
  s.addTable([hdr(["Wave", "Stream", "Rule"])].concat(all.slice(a, a + 11).map((x) => [String(x.wn), { text: x.name, options: { bold: true } }, x.gate])),
    { ...TBL, x: M, y: 1.3, w: W - 2 * M, colW: [0.7, 3.0, W - 2 * M - 3.7], fontSize: 11, rowH: 0.49 });
}
s = slide("CONTENT", "What could break the plan, and the response");
DS.risks.slice(0, 5).forEach((r, i) => {
  const y = 1.4 + i * 1.08;
  circle(s, M, y + 0.1, 0.6, "!", C.accent6, 18);
  tb(s, r.risk, { x: M + 0.85, y, w: 3.9, h: 0.8, fontSize: 16, bold: true, valign: "middle" });
  card(s, M + 4.9, y - 0.02, W - 2 * M - 4.9, 0.85);
  tb(s, r.response, { x: M + 5.1, y: y + 0.02, w: W - 2 * M - 5.3, h: 0.78, fontSize: 14, valign: "middle" });
});
s = slide("DARKLIST", "This week");
s.addText([{ text: "Now: " + PIV.first_steps[0] + "; propose the 90-day pilot.", options: { bullet: true, breakLine: true, color: C.accent3, bold: true } }]
  .concat(DS.days.slice(0, 5).map((d, i) => ({ text: `${d.day}: ${d.do}`, options: { bullet: true, breakLine: i < 4 } }))), { placeholder: "body", fontSize: 15, paraSpaceAfter: 8 });

pres.writeFile({ fileName: OUT }).then(() => applyTheme(OUT, THEME)).then(() => console.log("wrote", OUT, ST.length, "streams", WAVES.map((w) => w.items.length).join("/")));
