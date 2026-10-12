// Revenue Network deck: 43 streams as a layered network launched in sprints.
// Each layer consumes what earlier layers produce; gate results re-weight hours and capital.
// Inputs: pb.json (portfolio stack), waves_slides.json (steps, capital), pitches.json, playbooks_deck_slides.json (days, risks).
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");
const [PBJ, WJ, PJ, DJ, OUT] = process.argv.slice(2);
const PF = JSON.parse(fs.readFileSync(PBJ, "utf8")).portfolio;
const ST = Object.fromEntries(JSON.parse(fs.readFileSync(WJ, "utf8")).map((x) => [x.id, x]));
const PT = Object.fromEntries(JSON.parse(fs.readFileSync(PJ, "utf8")).map((x) => [x.id, x]));
const DS = JSON.parse(fs.readFileSync(DJ, "utf8"));
const NET = JSON.parse(fs.readFileSync(__dirname + "/network_layers.json", "utf8"));
const PIV = JSON.parse(fs.readFileSync(__dirname + "/deneffe_pivot.json", "utf8"));

const THEME = {
  name: "Revenue Network", headFontFace: "Cambria", bodyFontFace: "Calibri",
  colors: { dk1: "14211D", lt1: "FFFFFF", dk2: "0D6655", lt2: "EEF3F1", accent1: "0D6655", accent2: "8A5A00",
    accent3: "5CC2A8", accent4: "C9D8D2", accent5: "2F4A43", accent6: "B84A2E", hlink: "0D6655", folHlink: "8A5A00" },
};
const HEX = THEME.colors;
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Revenue Network: Sprints, Layers and Pitches";
pres.author = "Calebe Garcia";
const C = pres.SchemeColor;
const W = 13.333, M = 0.6, MUTED = "55645F";

pres.defineSlideMaster({
  title: "DARK", background: { color: HEX.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 1.7, w: W - 2 * M, h: 1.9, fontSize: 40, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: "bottom" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 3.8, w: W - 2 * M, h: 3.2, fontSize: 16, color: C.accent4, valign: "top" }, text: "" } },
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
    { text: { text: "Calebe Garcia · Revenue Network · Oct 2026", options: { x: M, y: 7.05, w: 6, h: 0.3, fontSize: 10, color: MUTED, margin: 0 } } },
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
const k = (n) => (n < 0 ? "-" + k(-n) : n >= 1000 ? `$${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : `$${Math.round(n)}`);
const hdr = (cells, fill = C.accent1) => cells.map((t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: fill } } }));
const TBL = { fontFace: "Calibri", color: C.text1, border: { type: "solid", pt: 0.5, color: "D3DCD8" }, valign: "middle" };

const LCOL = [C.accent1, C.accent3, C.accent5, C.accent2, C.accent6];
const LHEX = [HEX.accent1, HEX.accent3, HEX.accent5, HEX.accent2, HEX.accent6];
const CORE = new Set(PF.phases.flatMap((p) => p.streams));
const L = NET.layers.map((l, i) => ({ ...l, col: LCOL[i], hex: LHEX[i], items: l.members.map((id) => ({ ...ST[id], pitch: PT[id], core: CORE.has(id), short: NET.short[id] })) }));
L.forEach((l) => l.items.forEach((x) => { x.risk = x.start_capital_usd + 3 * x.monthly_cost_usd; if (!x.pitch) throw new Error("missing pitch " + x.id); }));
const ALL = L.flatMap((l) => l.items.map((x) => ({ ...x, ln: l.n })));
const stack = PF.stack, at = (m) => stack.find((r) => r.month === m);

// ---------- Overview ----------
sec("Overview");
let s = slide("DARK", "Revenue Network: Sprints, Layers and Pitches");
s.addText([
  { text: `${ALL.length} revenue streams wired as a 5-layer network and launched in 5 sprints`, options: { breakLine: true } },
  { text: "Each layer feeds the next with cash, insight, IP and audience; gate results re-weight hours and capital every month", options: { breakLine: true, color: C.accent3 } },
  { text: "Calebe Garcia · October 2026 · US$10k/month net is the floor, not the target", options: { fontSize: 14 } },
], { placeholder: "body" });

// Network diagram
s = slide("CONTENT", "The architecture: five layers, each feeding the next");
const colW = 2.25, gap = (W - 2 * M - 5 * colW) / 4, top = 1.75;
L.forEach((l, i) => {
  const x = M + i * (colW + gap);
  tb(s, `${l.n} · ${l.name.split(" · ")[0]}`, { x, y: 1.2, w: colW, h: 0.28, fontSize: 12, bold: true, color: l.col });
  tb(s, l.name.split(" · ")[1], { x, y: 1.45, w: colW, h: 0.26, fontSize: 11, color: MUTED });
  const nh = Math.min(0.46, 4.75 / l.items.length);
  l.items.forEach((it, j) => {
    s.addText(it.short, { shape: pres.shapes.ROUNDED_RECTANGLE, x, y: top + j * nh, w: colW, h: nh - 0.07, rectRadius: 0.06,
      fill: { color: l.col }, color: C.background1, fontSize: 10.5, bold: it.core, align: "center", valign: "middle", margin: 0 });
  });
  if (i < L.length - 1) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + colW + 0.06, y: 3.85, w: gap - 0.12, h: 0.45, fill: { color: HEX.accent4 }, line: { type: "none" } });
});
s.addShape(pres.shapes.LEFT_ARROW, { x: M, y: 6.6, w: W - 2 * M, h: 0.32, fill: { color: "F1DCD5" }, line: { type: "none" } });
tb(s, "Feedback: monthly gate results move hours and capital back toward the streams that work", { x: M + 0.6, y: 6.62, w: W - 2 * M - 1.2, h: 0.28, fontSize: 12, bold: true, color: C.accent6, align: "center", valign: "middle" });

// Neural-network rules
s = slide("CONTENT", "Run it like a neural network: inputs, weights, activation, feedback");
[
  ["Inputs", "Layer 1 turns expertise into cash and signal: what buyers ask, what they pay, which cases convert."],
  ["Hidden layers", "Layer 2 encodes that signal into IP; layer 3 amplifies it through channels and partners."],
  ["Weights", "Your 40 hours and the growth fund (30% of every net dollar) are the weights. Each stream gets an explicit allocation."],
  ["Activation", "A stream switches on only when its sprint trigger is met and a paid pilot or pre-sale proves demand."],
  ["Feedback", "Every month, compare each stream with its gate: scale winners, hold the unclear, kill losers, and move their hours and capital."],
  ["Output", "Layer 4 converts trust into retainers and success fees; layer 5 compounds with capital, data and a small team."],
].forEach(([h, t], i) => {
  const y = 1.35 + i * 0.93;
  circle(s, M, y + 0.06, 0.6, i + 1, LCOL[Math.min(i, 4)]);
  tb(s, h, { x: M + 0.85, y, w: 2.2, h: 0.75, fontSize: 17, bold: true, valign: "middle", color: C.accent1 });
  card(s, M + 3.15, y - 0.02, W - 2 * M - 3.15, 0.78);
  tb(s, t, { x: M + 3.4, y: y + 0.02, w: W - 2 * M - 3.65, h: 0.7, fontSize: 14, valign: "middle" });
});

// Where it lands
s = slide("CONTENT", "Where it lands, and the uncomfortable part");
[[`Month 10`, "Base case clears US$10k net (Aug 2027)", C.accent1], [k(at(12).base), "Base net/month at month 12", C.accent1], [k(at(24).base), `Base at month 24 (strong ${k(at(24).strong)})`, C.accent1], ["> 24 mo", `Conservative: ${k(at(24).conservative)} at month 24`, C.accent6]].forEach(([v, l, col], i) => {
  const x = M + i * 3.1;
  card(s, x, 1.4, 2.85, 2.2);
  tb(s, v, { x: x + 0.25, y: 1.6, w: 2.4, h: 0.95, fontSize: 36, bold: true, color: col, fontFace: THEME.headFontFace });
  tb(s, l, { x: x + 0.25, y: 2.6, w: 2.4, h: 0.85, fontSize: 13 });
});
const sumH = ALL.reduce((a, x) => a + (parseFloat(String(x.hours).split("·")[1]) || 0), 0);
tb(s, [
  { text: "You cannot run all of these at once. ", options: { bold: true, color: C.accent6 } },
  { text: `The ${ALL.length} streams need roughly ${Math.round(sumH)} hours a week in steady state; you have 40. The sprints decide the order; the feedback loop decides what survives. Expect 8-12 active streams at any time; the rest wait on the bench.`, options: { breakLine: true } },
  { text: "Figures come from the 13-stream stack plan (assumption-based, 25% overlap cut), which included two travel streams now excluded: treat them as an upper reference until gates produce real numbers.", options: { color: MUTED, fontSize: 13 } },
], { x: M, y: 3.95, w: W - 2 * M, h: 2.8, fontSize: 15, paraSpaceAfter: 10 });

// Sprint timeline
sec("Sprints");
s = slide("CONTENT", "Sprint timeline: each layer starts when the one before it produces");
const TM = 24, gx = M + 3.2, gw = W - M - gx;
L.forEach((l, i) => {
  const y = 1.35 + i * 1.08, [a, b] = l.window;
  tb(s, `Sprint ${l.n} · ${l.name.split(" · ")[1]}`, { x: M, y, w: 3.1, h: 0.4, fontSize: 14, bold: true, color: l.col });
  tb(s, `${l.items.length} streams · ${l.when}`, { x: M, y: y + 0.4, w: 3.1, h: 0.3, fontSize: 12, color: MUTED });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: gx + (a / TM) * gw, y: y + 0.08, w: ((b - a) / TM) * gw, h: 0.42, fill: { color: l.col }, line: { type: "none" }, rectRadius: 0.06 });
  s.addShape(pres.shapes.RECTANGLE, { x: gx + (b / TM) * gw, y: y + 0.24, w: ((TM - b) / TM) * gw, h: 0.1, fill: { color: l.hex, transparency: 60 }, line: { type: "none" } });
  tb(s, "Trigger: " + l.trigger, { x: gx + (a / TM) * gw, y: y + 0.55, w: Math.max(((TM - a) / TM) * gw, 3), h: 0.42, fontSize: 10.5, color: MUTED });
});
[0, 3, 6, 9, 12, 18, 24].forEach((m) => tb(s, "M" + m, { x: gx + (m / TM) * gw - 0.3, y: 6.75, w: 0.6, h: 0.25, fontSize: 11, color: MUTED, align: "center" }));
tb(s, "Thick bar: build sprint. Thin bar: the layer keeps running. Month 0 = 12 Oct 2026; a sprint starts later if its trigger is late, never earlier.", { x: M, y: 6.75, w: 3.1, h: 0.3, fontSize: 9, italic: true, color: MUTED });

// Layer I/O table
s = slide("CONTENT", "What each layer consumes and produces");
s.addTable([hdr(["Layer", "Consumes", "Produces", "Capital at risk (sum)"])].concat(L.map((l) => [
  { text: `${l.n} · ${l.name.split(" · ")[1]}`, options: { bold: true, color: l.col } }, l.consumes, l.produces, k(l.items.reduce((a, x) => a + x.risk, 0))])),
  { ...TBL, x: M, y: 1.35, w: W - 2 * M, colW: [3.0, 3.9, 4.1, 1.13], fontSize: 13, rowH: 0.95 });
tb(s, "Capital at risk = start cost + 3 months of running costs, summed over all streams in the layer if every one launched.", { x: M, y: 6.45, w: W - 2 * M, h: 0.4, fontSize: 11, italic: true, color: MUTED });

// Growth fund
s = slide("CONTENT", "How organic capital is built and spent");
[
  ["Bank it", "Every client payment lands in Wise USD/EUR. Pay yourself a fixed draw; the rest is surplus."],
  ["Split it", "30% of net profit goes to the growth fund, 10% to tax reserve; keep 6 months of personal costs untouched."],
  ["Prove it", "Before spending, pre-sell: a paid pilot, a waitlist with deposits, or 3 signed buyers."],
  ["Spend it", "Fund only the next sprint's streams; cap any single bet at 25% of the fund."],
  ["Judge it", "Every stream has a dated kill/hold/scale gate. Killed streams return their hours and budget to the network."],
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
  s = slide("CONTENT", pi ? "First 14 days: week 2" : "First 14 days: week 1 (input layer, payment gates first)");
  DS.days.slice(a, b).forEach((d, i) => {
    const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4, cw = (W - 2 * M - 0.3) / 2;
    const x = M + col * (cw + 0.3), y = 1.4 + row * 1.38;
    card(s, x, y, cw, 1.22);
    circle(s, x + 0.2, y + 0.3, 0.62, a + i + 1, C.accent1, 16);
    tb(s, d.day, { x: x + 1.0, y: y + 0.12, w: cw - 1.2, h: 0.3, fontSize: 13, bold: true, color: C.accent2 });
    tb(s, d.do, { x: x + 1.0, y: y + 0.42, w: cw - 1.2, h: 0.75, fontSize: 13 });
  });
});

// ---------- Per stream: pitch + build ----------
function pitchSlide(x, l, idx, prev, next) {
  const p = x.pitch;
  const s = slide("CONTENT", `${l.n}.${idx} ${x.name}`);
  tb(s, [{ text: (x.core ? "CORE" : "BENCH") + " · PITCH · ", options: { bold: true, color: x.core ? C.accent1 : C.accent2 } }, { text: p.one_liner, options: { italic: true } }], { x: M, y: 1.15, w: W - 2 * M, h: 0.4, fontSize: 14 });
  // Left: description, buyer, problem
  card(s, M, 1.7, 4.0, 5.15);
  const lab = (t, x0, y0, w0) => tb(s, t, { x: x0, y: y0, w: w0, h: 0.25, fontSize: 10, bold: true, color: C.accent2, charSpacing: 1 });
  lab("WHAT IT IS", M + 0.25, 1.85, 3.5);
  tb(s, p.description, { x: M + 0.25, y: 2.12, w: 3.5, h: 1.55, fontSize: 12.5 });
  lab("WHO PAYS", M + 0.25, 3.75, 3.5);
  tb(s, p.buyer, { x: M + 0.25, y: 4.02, w: 3.5, h: 0.8, fontSize: 12.5 });
  lab("UNMET NEED", M + 0.25, 4.9, 3.5);
  tb(s, p.problem, { x: M + 0.25, y: 5.17, w: 3.5, h: 1.0, fontSize: 12.5 });
  tb(s, [{ text: "Network: ", options: { bold: true, color: l.col } }, { text: `fed by ${prev}; feeds ${next}` }], { x: M + 0.25, y: 6.2, w: 3.5, h: 0.6, fontSize: 10.5, color: MUTED });
  // Middle: strategy
  const mx = M + 4.2, mw = 4.0;
  tb(s, "STRATEGY", { x: mx, y: 1.75, w: mw, h: 0.3, fontSize: 13, bold: true, color: C.accent1, charSpacing: 1 });
  ["Wedge", "Positioning", "Pricing"].forEach((h, j) => {
    const y = 2.1 + j * 1.18;
    circle(s, mx, y + 0.05, 0.42, j + 1, C.accent1, 12);
    tb(s, h, { x: mx + 0.55, y, w: mw - 0.55, h: 0.28, fontSize: 12, bold: true });
    tb(s, p.strategy[j] || "", { x: mx + 0.55, y: y + 0.28, w: mw - 0.55, h: 0.85, fontSize: 12 });
  });
  card(s, mx, 5.7, mw, 1.15, "F7EFE0");
  tb(s, [{ text: "Moat: ", options: { bold: true, color: C.accent2 } }, { text: p.moat }], { x: mx + 0.2, y: 5.78, w: mw - 0.4, h: 1.0, fontSize: 11.5, valign: "middle" });
  // Right: value
  const rx = mx + mw + 0.2, rw = W - M - rx;
  tb(s, "VALUE", { x: rx, y: 1.75, w: rw, h: 0.3, fontSize: 13, bold: true, color: C.accent1, charSpacing: 1 });
  ["Economic value to the customer", "Value drivers", "Willingness to pay"].forEach((h, j) => {
    const y = 2.1 + j * 1.18;
    circle(s, rx, y + 0.05, 0.42, j + 1, C.accent3, 12);
    tb(s, h, { x: rx + 0.55, y, w: rw - 0.55, h: 0.28, fontSize: 12, bold: true });
    tb(s, p.value[j] || "", { x: rx + 0.55, y: y + 0.28, w: rw - 0.55, h: 0.85, fontSize: 12 });
  });
  card(s, rx, 5.7, rw, 1.15, "DCEFEA");
  tb(s, [{ text: "Verdict: ", options: { bold: true, color: C.accent1 } }, { text: p.verdict }], { x: rx + 0.2, y: 5.78, w: rw - 0.4, h: 1.0, fontSize: 11.5, valign: "middle" });
}
function buildSlide(x, l, idx) {
  const s = slide("CONTENT", `${l.n}.${idx} ${x.name}: build it step by step`);
  tb(s, [{ text: (x.core ? "CORE · " : "BENCH · "), options: { bold: true, color: x.core ? C.accent1 : C.accent2 } }, { text: x.why, options: { italic: true, color: MUTED } }], { x: M, y: 1.15, w: 7.6, h: 0.55, fontSize: 13 });
  x.steps.slice(0, 8).forEach((st, j) => {
    const y = 1.8 + j * 0.64;
    circle(s, M, y + 0.06, 0.42, j + 1, l.col, 13);
    tb(s, st.when, { x: M + 0.55, y, w: 1.35, h: 0.55, fontSize: 12, bold: true, color: C.accent2, valign: "middle" });
    tb(s, st.do, { x: M + 1.95, y, w: 5.75, h: 0.58, fontSize: 13, valign: "middle" });
  });
  const px = 8.75, pw = W - M - px, cw = (pw - 0.5) / 3;
  card(s, px, 1.15, pw, 5.75);
  let y = 1.28;
  const lab = (t) => { tb(s, t, { x: px + 0.25, y, w: pw - 0.5, h: 0.25, fontSize: 10, bold: true, color: C.accent2, charSpacing: 1 }); y += 0.27; };
  const trio = (vals, color) => { vals.forEach(([lb, v], j) => { const bx = px + 0.25 + j * cw; tb(s, v, { x: bx, y, w: cw, h: 0.36, fontSize: 16, bold: true, color, fontFace: THEME.headFontFace }); tb(s, lb, { x: bx, y: y + 0.36, w: cw, h: 0.22, fontSize: 10, color: MUTED }); }); y += 0.64; };
  lab("CAPITAL");
  trio([["to start", k(x.start_capital_usd)], ["per month", k(x.monthly_cost_usd)], ["first cash", x.first_cash]], C.accent2);
  tb(s, x.capital_note, { x: px + 0.25, y, w: pw - 0.5, h: 0.62, fontSize: 10.5 }); y += 0.68;
  lab("OFFERS");
  x.offers.slice(0, 3).forEach((o) => { tb(s, [{ text: o.name + ": ", options: { bold: true } }, { text: o.price, options: { color: C.accent1 } }], { x: px + 0.25, y, w: pw - 0.5, h: 0.38, fontSize: 11 }); y += 0.4; });
  lab("BASE NET US$/MONTH");
  trio([["M3", k(x.m3)], ["M12", k(x.m12)], ["M24", k(x.m24)]], C.accent1);
  tb(s, x.hours, { x: px + 0.25, y, w: pw - 0.5, h: 0.25, fontSize: 11, color: MUTED }); y += 0.3;
  tb(s, [{ text: "Gate: ", options: { bold: true, color: C.accent6 } }, { text: x.gate }], { x: px + 0.25, y, w: pw - 0.5, h: 6.8 - y, fontSize: 11 });
}
function pivotSlides() {
  const H = (cells) => hdr(cells, C.accent2);
  let s = slide("CONTENT", "Pricing practice pivot: build it with Deneffe Consulting");
  tb(s, PIV.summary, { x: M, y: 1.2, w: W - 2 * M, h: 1.05, fontSize: 14 });
  s.addTable([H(["Joint offer", "Price (illustrative)", "Who does what", "Role"])].concat(PIV.ladder.map((r) => r.map((t, j) => (j === 0 ? { text: t, options: { bold: true } } : t)))),
    { ...TBL, x: M, y: 2.4, w: 7.7, colW: [2.2, 1.6, 2.6, 1.3], fontSize: 12, rowH: 0.62 });
  const px2 = 8.55, pw2 = W - M - px2;
  card(s, px2, 2.4, pw2, 4.4);
  tb(s, "HIS GAPS → WHAT CLOSES THEM", { x: px2 + 0.25, y: 2.55, w: pw2 - 0.5, h: 0.25, fontSize: 11, bold: true, color: C.accent2, charSpacing: 1 });
  tb(s, PIV.gaps.flatMap(([g, f], j) => [{ text: `${g}: `, options: { bold: true } }, { text: f, options: { breakLine: j < PIV.gaps.length - 1 } }]), { x: px2 + 0.25, y: 2.9, w: pw2 - 0.5, h: 3.8, fontSize: 12, paraSpaceAfter: 6 });
  tb(s, PIV.economics, { x: M, y: 5.75, w: 7.7, h: 1.0, fontSize: 12, italic: true, color: MUTED });
  s = slide("CONTENT", "Pricing practice pivot: terms and the 90-day pilot");
  s.addTable([H(["Term", "Proposal"])].concat(PIV.terms.map(([a, b]) => [{ text: a, options: { bold: true } }, b])), { ...TBL, x: M, y: 1.3, w: 6.0, colW: [1.5, 4.5], fontSize: 12, rowH: 0.7 });
  PIV.pilot.forEach(([wk, d], j) => {
    const y = 1.3 + j * 1.15;
    circle(s, 6.95, y + 0.15, 0.55, j + 1, C.accent2, 14);
    tb(s, wk, { x: 7.65, y, w: 5.1, h: 0.3, fontSize: 13, bold: true, color: C.accent2 });
    tb(s, d, { x: 7.65, y: y + 0.3, w: 5.1, h: 0.8, fontSize: 12 });
  });
  card(s, 6.95, 4.85, W - M - 6.95, 1.95, "DCEFEA");
  tb(s, [{ text: "Success bar: ", options: { bold: true, color: C.accent1 } }, { text: PIV.success_bar, options: { breakLine: true } }, { text: "Network role: ", options: { bold: true, color: C.accent1 } }, { text: "strengthens the input layer: Dan's credibility lifts conversion and price points for every downstream layer." }],
    { x: 7.15, y: 4.95, w: W - M - 7.35, h: 1.8, fontSize: 12, paraSpaceAfter: 6 });
}

L.forEach((l, li) => {
  sec(`Sprint ${l.n}`);
  let s = slide("DARK", `Sprint ${l.n} · ${l.name}`);
  s.addText([
    { text: "Role: ", options: { bold: true, color: C.accent3 } }, { text: l.role, options: { breakLine: true } },
    { text: "Consumes: ", options: { bold: true, color: C.accent3 } }, { text: l.consumes, options: { breakLine: true } },
    { text: "Produces: ", options: { bold: true, color: C.accent3 } }, { text: l.produces, options: { breakLine: true } },
    { text: "Trigger: ", options: { bold: true, color: C.accent3 } }, { text: `${l.trigger} (${l.when})`, options: { breakLine: true } },
    { text: `${l.items.length} streams: ${l.items.map((x) => x.short).join(" · ")}`, options: { fontSize: 13 } },
  ], { placeholder: "body", paraSpaceAfter: 6 });
  s = slide("CONTENT", `Sprint ${l.n} at a glance: launch in this order`);
  s.addTable([hdr(["#", "Stream", "Status", "At risk $", "First cash", "M3", "M12", "M24", "Hours"])].concat(l.items.map((x, j) => [
    String(j + 1), { text: x.name, options: { bold: true } }, { text: x.core ? "Core" : "Bench", options: { color: x.core ? C.accent1 : C.accent2, bold: true } },
    k(x.risk), x.first_cash, k(x.m3), k(x.m12), k(x.m24), x.hours])),
    { ...TBL, x: M, y: 1.3, w: W - 2 * M, colW: [0.45, 3.45, 0.8, 0.95, 1.5, 0.8, 0.8, 0.8, 2.58], fontSize: 12, rowH: 0.5 });
  const prevL = li ? L[li - 1].name.split(" · ")[1].toLowerCase() : "your expertise and network";
  const nextL = li < L.length - 1 ? L[li + 1].name.split(" · ")[1].toLowerCase() : "the growth fund and the next cycle";
  l.items.forEach((x, i) => {
    pitchSlide(x, l, i + 1, prevL, nextL);
    buildSlide(x, l, i + 1);
    if (x.id === PIV.id) pivotSlides();
  });
});

// ---------- Control ----------
sec("Control");
for (let a = 0; a < ALL.length; a += 8) {
  s = slide("CONTENT", `Feedback gates: kill, hold or scale on dates (${a / 8 + 1}/${Math.ceil(ALL.length / 8)})`);
  s.addTable([hdr(["Sprint", "Stream", "Rule"])].concat(ALL.slice(a, a + 8).map((x) => [String(x.ln), { text: x.name, options: { bold: true } }, x.gate])),
    { ...TBL, x: M, y: 1.3, w: W - 2 * M, colW: [0.8, 3.0, W - 2 * M - 3.8], fontSize: 12, rowH: 0.58 });
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

pres.writeFile({ fileName: OUT }).then(() => applyTheme(OUT, THEME)).then(() => console.log("wrote", OUT, ALL.length, "streams", L.map((l) => l.items.length).join("/")));
