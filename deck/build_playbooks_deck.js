// Execution deck: what to do, when, step by step. Inputs: pb.json (collector output) and deck_slides.json (condensed text).
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");
const [PBJ, SLJ, OUT] = process.argv.slice(2);
const D = JSON.parse(fs.readFileSync(PBJ, "utf8"));
const S = JSON.parse(fs.readFileSync(SLJ, "utf8"));
const PF = D.portfolio;

const THEME = {
  name: "Revenue Stack", headFontFace: "Cambria", bodyFontFace: "Calibri",
  colors: { dk1: "14211D", lt1: "FFFFFF", dk2: "0D6655", lt2: "EEF3F1", accent1: "0D6655", accent2: "8A5A00",
    accent3: "5CC2A8", accent4: "C9D8D2", accent5: "2F4A43", accent6: "B84A2E", hlink: "0D6655", folHlink: "8A5A00" },
};
const HEX = THEME.colors;
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Revenue Stack: What to Do, When";
pres.author = "Calebe Garcia";
const C = pres.SchemeColor;
const W = 13.333, M = 0.6;

const num = { type: "sldNum", options: {} };
pres.defineSlideMaster({
  title: "DARK", background: { color: HEX.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 2.2, w: W - 2 * M, h: 1.6, fontSize: 44, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: "bottom" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 3.95, w: W - 2 * M, h: 2.6, fontSize: 18, color: C.accent4, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "DARKLIST", background: { color: HEX.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.5, w: W - 2 * M, h: 1.0, fontSize: 40, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: "middle" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 1.75, w: W - 2 * M, h: 5.2, fontSize: 18, color: C.accent4, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT", background: { color: HEX.lt1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.35, w: W - 2 * M, h: 0.85, fontSize: 30, bold: true, color: C.text1, fontFace: THEME.headFontFace, valign: "middle" }, text: "" } },
    { text: { text: "Calebe Garcia · Revenue Stack · Oct 2026", options: { x: M, y: 7.05, w: 6, h: 0.3, fontSize: 10, color: "55645F", margin: 0 } } },
  ],
  slideNumber: { x: W - M - 0.6, y: 7.05, w: 0.6, h: 0.3, fontSize: 10, color: "55645F", align: "right" },
});

let section = "";
const sec = (t) => { section = t; pres.addSection({ title: t }); };
const slide = (master, title) => { const s = pres.addSlide({ masterName: master, sectionTitle: section }); if (title) s.addText(title, { placeholder: "title" }); return s; };
const tb = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, fontSize: 14, color: C.text1, valign: "top", ...o });
const k = (n) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`);
const circle = (s, x, y, d, label, fill = C.accent1, fs = 14) =>
  s.addText(String(label), { shape: pres.shapes.OVAL, x, y, w: d, h: d, fill: { color: fill }, color: C.background1, fontSize: fs, bold: true, align: "center", valign: "middle", margin: 0 });
const card = (s, x, y, w, h, fill = C.background2) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08 });

const stack = PF.stack, at = (m) => stack.find((r) => r.month === m);
const phases = PF.phases.map((p) => { const m = p.months.match(/\d+/g).map(Number); return { ...p, a: m[0], b: m[1] }; });
const core = []; phases.forEach((p, i) => p.streams.forEach((id) => { if (!core.find((c) => c.id === id)) core.push({ id, start: i }); }));
core.forEach((c) => { c.end = Math.max(...phases.map((p, i) => (p.streams.includes(c.id) ? i : -1))); });
const PIV = JSON.parse(fs.readFileSync(__dirname + "/deneffe_pivot.json", "utf8"));
const SL = Object.fromEntries(S.streams.map((x) => [x.id, x]));

// 1 Title
sec("Overview");
let s = slide("DARK", "Revenue Stack: What to Do, When");
s.addText(`13 streams, 4 phases, 24 months. Built from 56 operating playbooks.\nStart: Monday 12 October 2026 · 40 hours a week · US$10k/month net is the floor, not the target`, { placeholder: "body" });

// 2 Bottom line
s = slide("CONTENT", "The floor is cleared in month 10 in the base case, not before");
const stats = [
  ["Month 10", "Base case clears US$10k net (Aug 2027)", C.accent1],
  [k(at(12).base), "Base net per month at month 12", C.accent1],
  [k(at(24).base), "Base net per month at month 24 (strong " + k(at(24).strong) + ")", C.accent1],
  ["> 24 mo", "Conservative case: " + k(at(24).conservative) + " at month 24", C.accent6],
];
stats.forEach(([v, l, col], i) => {
  const x = M + i * 3.1;
  card(s, x, 1.55, 2.85, 2.6);
  tb(s, v, { x: x + 0.25, y: 1.8, w: 2.4, h: 1.1, fontSize: 40, bold: true, color: col, fontFace: THEME.headFontFace });
  tb(s, l, { x: x + 0.25, y: 2.95, w: 2.4, h: 1.0, fontSize: 14, color: C.text1 });
});
tb(s, "One engine, not 13 businesses: AI pricing and AI cost math for B2B AI/SaaS teams and the finance people who budget for them. Services bring cash in month 1; templates and licences sell without your hours; YouTube, the survey report and the course compound from month 3; travel products arrive in month 12 as a second, uncorrelated asset.", { x: M, y: 4.5, w: W - 2 * M, h: 1.3, fontSize: 16 });
tb(s, "All revenue figures are playbook estimates (assumption-based), after a 25% overlap cut (40% in the strong case). Nothing is tested with buyers yet.", { x: M, y: 6.1, w: W - 2 * M, h: 0.6, fontSize: 12, color: "55645F", italic: true });

// 3 Flywheel
s = slide("CONTENT", "One data loop feeds every cash register");
S.flywheel.forEach((t, i) => {
  const y = 1.45 + i * 1.08;
  circle(s, M, y, 0.7, i + 1);
  card(s, M + 0.95, y - 0.08, W - 2 * M - 0.95, 0.86);
  tb(s, t, { x: M + 1.2, y: y, w: W - 2 * M - 1.45, h: 0.7, fontSize: 16, valign: "middle" });
});

// 4 Ramp chart
s = slide("CONTENT", "Net revenue ramp: three cases against the US$10k floor");
const months = stack.map((r) => "M" + r.month);
s.addChart(pres.charts.LINE, [
  { name: "Strong", labels: months, values: stack.map((r) => r.strong) },
  { name: "Base", labels: months, values: stack.map((r) => r.base) },
  { name: "Conservative", labels: months, values: stack.map((r) => r.conservative) },
  { name: "US$10k floor", labels: months, values: stack.map(() => 10000) },
], {
  x: M, y: 1.35, w: 8.2, h: 5.5, chartColors: [HEX.accent3, HEX.accent1, HEX.accent6, "8A9A95"], lineSize: 3, lineDataSymbolSize: 7,
  showLegend: true, legendPos: "b", legendFontSize: 12, legendFontFace: "+mn-lt",
  catAxisLabelColor: "55645F", valAxisLabelColor: "55645F", catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", catAxisLabelFontSize: 12, valAxisLabelFontSize: 12,
  valAxisLabelFormatCode: "$#,##0", valGridLine: { color: "E3E9E6", size: 0.5 }, catGridLine: { style: "none" },
});
const rows = [["Month", "Cons.", "Base", "Strong"].map((t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.accent1 } } }))]
  .concat(stack.map((r) => [`M${r.month}`, k(r.conservative), k(r.base), k(r.strong)].map((t, j) => ({ text: t, options: { align: j ? "right" : "left", bold: r.base >= 10000 && j === 2 } }))));
s.addTable(rows, { x: 9.1, y: 1.45, w: 3.6, colW: [0.8, 0.9, 0.95, 0.95], fontSize: 13, fontFace: "Calibri", color: C.text1, border: { type: "solid", pt: 0.5, color: "D3DCD8" }, rowH: 0.42 });
tb(s, "Bold: base case at or above the floor.", { x: 9.1, y: 4.65, w: 3.6, h: 0.4, fontSize: 11, color: "55645F" });

// 5 Gantt
sec("Timeline");
s = slide("CONTENT", "Master timeline: launch order and active months");
const gx = M + 2.6, gw = W - M - gx, gy = 1.75, rh = 0.37, TM = 24;
phases.forEach((p, i) => {
  const x = gx + (p.a / TM) * gw, w = ((p.b - p.a) / TM) * gw;
  s.addShape(pres.shapes.RECTANGLE, { x, y: gy - 0.05, w, h: core.length * rh + 0.1, fill: { color: i % 2 ? "FFFFFF" : HEX.lt2 }, line: { color: i % 2 ? "FFFFFF" : HEX.lt2 } });
  tb(s, `Phase ${i + 1} · M${p.a}-${p.b}`, { x: x + 0.05, y: 1.35, w: w - 0.1, h: 0.3, fontSize: 11, bold: true, color: C.accent2 });
});
core.forEach((c, r) => {
  const y = gy + r * rh;
  tb(s, SL[c.id] ? SL[c.id].name : c.id, { x: M, y, w: 2.5, h: rh, fontSize: 12, valign: "middle" });
  const a = phases[c.start].a, b = phases[c.end].b;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: gx + (a / TM) * gw, y: y + 0.07, w: ((b - a) / TM) * gw, h: rh - 0.14, fill: { color: c.start === 0 ? C.accent1 : c.start === 3 ? C.accent2 : C.accent3 }, line: { type: "none" }, rectRadius: 0.05 });
});
[0, 3, 6, 9, 12, 18, 24].forEach((m) => tb(s, "M" + m, { x: gx + (m / TM) * gw - 0.3, y: gy + core.length * rh + 0.1, w: 0.6, h: 0.3, fontSize: 11, color: "55645F", align: "center" }));

// 6 Hours heatmap table
s = slide("CONTENT", "Where the 40 hours go, phase by phase");
const hd = [{ text: "Stream", options: { bold: true, color: C.background1, fill: { color: C.accent1 } } }]
  .concat(phases.map((p, i) => ({ text: `P${i + 1} · M${p.a}-${p.b}`, options: { bold: true, color: C.background1, fill: { color: C.accent1 }, align: "center" } })));
const tint = (h) => (h >= 8 ? "0D6655" : h >= 5 ? "5CC2A8" : h >= 3 ? "A9D9CC" : h >= 1 ? "DCEFEA" : "FFFFFF");
const hrows = core.map((c) => [{ text: SL[c.id] ? SL[c.id].name : c.id }].concat(phases.map((p) => {
  const h = (p.hours.find((x) => x.id === c.id) || {}).h || 0;
  return { text: h ? `${h} h` : "", options: { align: "center", fill: { color: tint(h) }, color: h >= 8 ? C.background1 : C.text1, bold: h >= 8 } };
})));
hrows.push([{ text: "Total", options: { bold: true } }].concat(phases.map((p) => ({ text: `${p.hours.reduce((a, x) => a + x.h, 0)} h`, options: { bold: true, align: "center" } }))));
s.addTable([hd].concat(hrows), { x: M, y: 1.35, w: 8.6, colW: [3.4, 1.3, 1.3, 1.3, 1.3], fontSize: 12, fontFace: "Calibri", color: C.text1, border: { type: "solid", pt: 0.5, color: "D3DCD8" }, rowH: 0.36 });
tb(s, [
  { text: "How the hours shift", options: { bold: true, fontSize: 16, breakLine: true } },
  { text: "Phase 1 is mostly selling services and shipping the two Q4 deadline products.", options: { bullet: true, breakLine: true } },
  { text: "From phase 2, hours move into assets that keep earning: YouTube, templates, the survey report.", options: { bullet: true, breakLine: true } },
  { text: "Phase 3 adds an analyst to draft reviews; you only do final QA.", options: { bullet: true, breakLine: true } },
  { text: "Phase 4 moves service hours into the two travel products.", options: { bullet: true } },
], { x: 9.6, y: 1.4, w: 3.15, h: 5.2, fontSize: 14, paraSpaceAfter: 8 });

// 7-8 First 14 days
sec("First 14 days");
[[0, 7], [7, 14]].forEach(([a, b], pi) => {
  s = slide("CONTENT", pi ? "First 14 days: week 2" : "First 14 days: week 1 (payment and profile gates first)");
  S.days.slice(a, b).forEach((d, i) => {
    const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4, cw = (W - 2 * M - 0.3) / 2;
    const x = M + col * (cw + 0.3), y = 1.4 + row * 1.38;
    card(s, x, y, cw, 1.22);
    circle(s, x + 0.2, y + 0.3, 0.62, a + i + 1, C.accent1, 16);
    tb(s, d.day, { x: x + 1.0, y: y + 0.12, w: cw - 1.2, h: 0.3, fontSize: 13, bold: true, color: C.accent2 });
    tb(s, d.do, { x: x + 1.0, y: y + 0.42, w: cw - 1.2, h: 0.75, fontSize: 13 });
  });
});

// Phases + stream slides
phases.forEach((p, i) => {
  sec(`Phase ${i + 1}`);
  const ex = at(p.b) || at(Math.min(...stack.map((r) => r.month).filter((m) => m >= p.b)));
  s = slide("DARK", p.name);
  const news = core.filter((c) => c.start === i).map((c) => (SL[c.id] ? SL[c.id].name : c.id));
  s.addText([
    { text: `Months ${p.months}`, options: { bold: true, color: C.accent3, breakLine: true } },
    { text: `Launch: ${news.join(" · ")}`, options: { breakLine: true } },
    { text: ex ? `Exit target (base): ${k(ex.base)}/month net · conservative ${k(ex.conservative)} · strong ${k(ex.strong)}` : "", options: {} },
  ], { placeholder: "body" });
  core.filter((c) => c.start === i).forEach((c) => {
    const x = SL[c.id]; if (!x) return;
    s = slide("CONTENT", x.name);
    tb(s, x.why, { x: M, y: 1.15, w: 7.6, h: 0.55, fontSize: 14, italic: true, color: "55645F" });
    x.steps.slice(0, 8).forEach((st, j) => {
      const y = 1.8 + j * 0.64;
      circle(s, M, y + 0.06, 0.42, j + 1, C.accent1, 13);
      tb(s, st.when, { x: M + 0.55, y, w: 1.35, h: 0.55, fontSize: 12, bold: true, color: C.accent2, valign: "middle" });
      tb(s, st.do, { x: M + 1.95, y, w: 5.75, h: 0.58, fontSize: 13, valign: "middle" });
    });
    const px = 8.75, pw = W - M - px;
    card(s, px, 1.15, pw, 5.75);
    let y = 1.3;
    tb(s, "OFFER LADDER", { x: px + 0.25, y, w: pw - 0.5, h: 0.25, fontSize: 11, bold: true, color: C.accent2, charSpacing: 1 }); y += 0.3;
    x.offers.slice(0, 3).forEach((o) => { tb(s, [{ text: o.name, options: { bold: true, breakLine: true } }, { text: o.price, options: { color: C.accent1 } }], { x: px + 0.25, y, w: pw - 0.5, h: 0.58, fontSize: 12 }); y += 0.62; });
    y += 0.05;
    tb(s, "BASE NET US$/MONTH", { x: px + 0.25, y, w: pw - 0.5, h: 0.25, fontSize: 11, bold: true, color: C.accent2, charSpacing: 1 }); y += 0.3;
    [["M3", x.m3], ["M12", x.m12], ["M24", x.m24]].forEach(([l, v], j) => {
      const bx = px + 0.25 + j * ((pw - 0.5) / 3);
      tb(s, k(v), { x: bx, y, w: (pw - 0.5) / 3, h: 0.42, fontSize: 20, bold: true, color: C.accent1, fontFace: THEME.headFontFace });
      tb(s, l, { x: bx, y: y + 0.42, w: (pw - 0.5) / 3, h: 0.25, fontSize: 11, color: "55645F" });
    });
    y += 0.75;
    tb(s, x.hours, { x: px + 0.25, y, w: pw - 0.5, h: 0.28, fontSize: 12, color: "55645F" }); y += 0.35;
    tb(s, [{ text: "Target: ", options: { bold: true } }, { text: x.kpi }], { x: px + 0.25, y, w: pw - 0.5, h: 0.62, fontSize: 12 }); y += 0.66;
    tb(s, [{ text: "Gate: ", options: { bold: true, color: C.accent6 } }, { text: x.gate }], { x: px + 0.25, y, w: pw - 0.5, h: 6.75 - y, fontSize: 12 });
    if (c.id === PIV.id) {
      const TB = { fontFace: "Calibri", color: C.text1, border: { type: "solid", pt: 0.5, color: "D3DCD8" }, valign: "middle" };
      const H = (cells) => cells.map((t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.accent2 } } }));
      // Pivot 1: why and the joint ladder
      s = slide("CONTENT", "Pivot: build the pricing practice with Deneffe Consulting");
      tb(s, PIV.summary, { x: M, y: 1.2, w: W - 2 * M, h: 1.05, fontSize: 14 });
      s.addTable([H(["Joint offer", "Price (illustrative)", "Who does what", "Role"])].concat(PIV.ladder.map((r) => r.map((t, j) => (j === 0 ? { text: t, options: { bold: true } } : t)))),
        { ...TB, x: M, y: 2.4, w: 7.7, colW: [2.2, 1.6, 2.6, 1.3], fontSize: 12, rowH: 0.62 });
      const px2 = 8.55, pw2 = W - M - px2;
      card(s, px2, 2.4, pw2, 4.4);
      tb(s, "HIS GAPS → WHAT CLOSES THEM", { x: px2 + 0.25, y: 2.55, w: pw2 - 0.5, h: 0.25, fontSize: 11, bold: true, color: C.accent2, charSpacing: 1 });
      tb(s, PIV.gaps.map(([g, f], j) => ({ text: `${g}: `, options: { bold: true, breakLine: false } })).flatMap((r, j) => [r, { text: PIV.gaps[j][1], options: { breakLine: j < PIV.gaps.length - 1 } }]),
        { x: px2 + 0.25, y: 2.9, w: pw2 - 0.5, h: 3.8, fontSize: 12, paraSpaceAfter: 6 });
      tb(s, PIV.economics, { x: M, y: 5.75, w: 7.7, h: 1.0, fontSize: 12, italic: true, color: "55645F" });
      // Pivot 2: terms and pilot
      s = slide("CONTENT", "Pivot: terms and the 90-day pilot with Deneffe");
      s.addTable([H(["Term", "Proposal"])].concat(PIV.terms.map(([a, b]) => [{ text: a, options: { bold: true } }, b])),
        { ...TB, x: M, y: 1.3, w: 6.0, colW: [1.5, 4.5], fontSize: 12, rowH: 0.7 });
      PIV.pilot.forEach(([w, d], j) => {
        const y = 1.3 + j * 1.15;
        circle(s, 6.95, y + 0.15, 0.55, j + 1, C.accent2, 14);
        tb(s, w, { x: 7.65, y, w: 5.1, h: 0.3, fontSize: 13, bold: true, color: C.accent2 });
        tb(s, d, { x: 7.65, y: y + 0.3, w: 5.1, h: 0.8, fontSize: 12 });
      });
      card(s, 6.95, 4.85, W - M - 6.95, 1.95, "DCEFEA");
      tb(s, [{ text: "Success bar: ", options: { bold: true, color: C.accent1 } }, { text: PIV.success_bar, options: { breakLine: true } }, { text: "What it changes: ", options: { bold: true, color: C.accent1 } }, { text: PIV.impact.split(". ")[0] + "." }],
        { x: 7.15, y: 4.95, w: W - M - 7.35, h: 1.8, fontSize: 12, paraSpaceAfter: 6 });
    }
  });
});

// Gates table
sec("Control");
[[0, 7], [7, core.length]].forEach(([a, b], pi) => {
  s = slide("CONTENT", `Decision gates: kill, hold or scale on dates (${pi + 1}/2)`);
  const gh = ["Stream", "Starts", "Rule"].map((t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.accent1 } } }));
  s.addTable([gh].concat(core.slice(a, b).map((c) => [{ text: SL[c.id] ? SL[c.id].name : c.id, options: { bold: true } }, `M${phases[c.start].a}`, SL[c.id] ? SL[c.id].gate : ""])),
    { x: M, y: 1.3, w: W - 2 * M, colW: [3.0, 0.9, W - 2 * M - 3.9], fontSize: 13, fontFace: "Calibri", color: C.text1, border: { type: "solid", pt: 0.5, color: "D3DCD8" }, rowH: 0.7, valign: "middle" });
});

// Risks
s = slide("CONTENT", "What could break the plan, and the response");
S.risks.slice(0, 5).forEach((r, i) => {
  const y = 1.4 + i * 1.08;
  circle(s, M, y + 0.1, 0.6, "!", C.accent6, 18);
  tb(s, r.risk, { x: M + 0.85, y, w: 3.9, h: 0.8, fontSize: 16, bold: true, valign: "middle" });
  card(s, M + 4.9, y - 0.02, W - 2 * M - 4.9, 0.85);
  tb(s, r.response, { x: M + 5.1, y: y + 0.02, w: W - 2 * M - 5.3, h: 0.78, fontSize: 14, valign: "middle" });
});

// Cut list
const cuts = S.cuts, half = Math.ceil(cuts.length / 2);
[[0, half], [half, cuts.length]].forEach(([a, b], pi) => {
  s = slide("CONTENT", `Cut or deferred: ${cuts.length} streams (${pi + 1}/2)`);
  const part = cuts.slice(a, b), hh = Math.ceil(part.length / 2), cw = (W - 2 * M - 0.3) / 2;
  [part.slice(0, hh), part.slice(hh)].forEach((col, ci) => {
    s.addTable(col.map((c) => [{ text: c.id, options: { bold: true, color: C.accent1 } }, c.why]),
      { x: M + ci * (cw + 0.3), y: 1.3, w: cw, colW: [2.1, cw - 2.1], fontSize: 12, fontFace: "Calibri", color: C.text1, border: { type: "solid", pt: 0.5, color: "D3DCD8" }, rowH: 0.47, valign: "middle" });
  });
});

// Close
s = slide("DARKLIST", "This week");
s.addText([{ text: "Now: " + PIV.first_steps[0] + "; propose the 90-day pilot.", options: { bullet: true, breakLine: true, color: C.accent3, bold: true } }].concat(S.days.slice(0, 5).map((d, i) => ({ text: `${d.day}: ${d.do}`, options: { bullet: true, breakLine: i < 4 } }))), { placeholder: "body", fontSize: 15, paraSpaceAfter: 8 });

pres.writeFile({ fileName: OUT }).then(() => applyTheme(OUT, THEME)).then(() => console.log("wrote", OUT));
