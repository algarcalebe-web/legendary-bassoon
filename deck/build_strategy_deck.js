const pptxgen = require("pptxgenjs");
const path = require("path");
const { applyTheme } = require("/root/.claude/skills/synced/70c9b129-32db-469b-8f88-983e77e36578_b69fd9ad-3c5a-43f4-937d-aab5e73d1942/pptx/scripts/apply_theme.js");

const OUT = process.argv[2] || "deck.pptx";
const THEME = {
  name: "Strategy Navy",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: {
    dk1: "222222", lt1: "FDFDFC", dk2: "1B2A5C", lt2: "F6F7FA",
    accent1: "1B2A5C", accent2: "C9A24B", accent3: "5B8DB8", accent4: "8C6D23",
    accent5: "B7C6DE", accent6: "D0D4DC", hlink: "1B2A5C", folHlink: "5B8DB8",
  },
};
const H = { navy: "1B2A5C", gold: "C9A24B", goldDk: "8C6D23", bg: "FDFDFC", panel: "F6F7FA", call: "EEF1F7",
  text: "222222", muted: "6B6B6B", line: "D0D4DC", mid: "5B8DB8", light: "B7C6DE", low: "F3D9C9", white: "FFFFFF", red: "A23B2A" };

const CREST = "deck/assets/crest_cover.jpeg", CREST2 = "deck/assets/crest_illustrated.jpeg", SHIELD = "deck/assets/shield.png";
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.title = "Otium Chigi Journeys: strategy deck";
pres.author = "Calebe Garcia";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const FOOT = "Strategy deck · October 2026 · Working title · Confidential, for discussion";

pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: H.bg },
  objects: [
    { placeholder: { options: { name: "kicker", type: "body", x: 0.6, y: 0.32, w: 10.0, h: 0.3, fontSize: 10, bold: true, color: C.accent4, charSpacing: 2, margin: 0, valign: "middle", align: "left" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.62, w: 12.1, h: 0.95, fontSize: 22, bold: true, color: C.text2, margin: 0, valign: "top", align: "left" }, text: "" } },
    { line: { x: 0.6, y: 1.62, w: 12.13, h: 0, line: { color: H.line, width: 1 } } },
    { image: { x: 10.75, y: 0.1, w: 0.24, h: 0.43, path: SHIELD } },
    { text: { text: "OTIUM CHIGI", options: { x: 11.05, y: 0.16, w: 2.0, h: 0.3, fontFace: "Cambria", fontSize: 12, bold: true, color: "1B2A5C", charSpacing: 2, align: "left", valign: "middle", margin: 0 } } },
  ],
  slideNumber: { x: 12.25, y: 7.0, w: 0.5, h: 0.3, fontSize: 9, color: H.muted, align: "right" },
});
pres.defineSlideMaster({ title: "DARK", background: { color: H.navy }, objects: [] });

let sec = null;
function section(t) { sec = t; pres.addSection({ title: t }); }
function content(kicker, title, source, notes) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: sec });
  s.addText(kicker.toUpperCase(), { placeholder: "kicker" });
  s.addText(title, { placeholder: "title" });
  if (source) s.addText("Source: " + source, { x: 0.6, y: 6.88, w: 11.4, h: 0.45, fontSize: 8.5, color: H.muted, margin: 0, valign: "top", isTextBox: true });
  if (notes) s.addNotes(notes);
  return s;
}
function callout(s, text, y = 6.3, h = 0.48) {
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.13, h, fill: { color: H.call }, line: { color: H.call }, objectName: "callout" });
  s.addText(text, { x: 0.8, y, w: 11.8, h, fontSize: 13, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
}
const NONE = { type: "none" };
const hdr = (t) => ({ text: t, options: { bold: true, color: H.navy, fontSize: 10.5, valign: "bottom", border: [NONE, NONE, { type: "solid", pt: 1.75, color: H.navy }, NONE] } });
function table(s, header, rows, opts) {
  const data = [header.map(hdr)];
  rows.forEach((r, i) => data.push(r.map((c, ci) => {
    const o = { fontSize: opts.fs || 10, color: H.text, valign: "middle", bold: ci === 0 && opts.boldFirst !== false && header[0] !== "#",
      border: [NONE, NONE, { type: "solid", pt: i === rows.length - 1 ? 1 : 0.5, color: i === rows.length - 1 ? H.navy : H.line }, NONE] };
    if (ci === 0 && header[0] !== "#") o.color = H.navy;
    if (typeof c === "object" && c !== null && c.text !== undefined) return { text: c.text, options: Object.assign(o, c.options || {}) };
    return { text: String(c), options: o };
  })));
  s.addTable(data, { x: opts.x || 0.6, y: opts.y || 1.85, w: opts.w || 12.13, colW: opts.colW, margin: [3, 6, 3, 6], rowH: opts.rowH, autoPage: false });
}
function rate(t) {
  const l = t.toLowerCase();
  let f = H.panel, c = H.text;
  if (l.startsWith("high")) { f = H.navy; c = H.white; }
  else if (l.startsWith("medium–high") || l.startsWith("medium-high")) { f = H.mid; c = H.white; }
  else if (l.startsWith("medium")) { f = H.light; }
  return { text: t, options: { fill: { color: f }, color: c } };
}
function num(s, x, y, d, n, fill, col) {
  s.addShape(pres.shapes.OVAL, { x: x - d / 2, y: y - d / 2, w: d, h: d, fill: { color: fill || H.navy }, line: { color: H.white, width: 1 } });
  s.addText(String(n), { x: x - d / 2, y: y - d / 2, w: d, h: d, fontSize: d > 0.4 ? 12 : 10, bold: true, color: col || H.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
}
function heat(v) {
  if (v === null) return { text: "–", options: { align: "center" } };
  const f = v >= 8 ? H.navy : v >= 6 ? H.mid : v >= 4 ? H.light : H.low;
  const c = v >= 6 ? H.white : H.text;
  return { text: String(v), options: { align: "center", bold: true, fill: { color: f }, color: c } };
}
function card(s, x, y, w, h, head, body, opt = {}) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: opt.dark ? H.navy : H.panel }, line: { color: opt.dark ? H.navy : H.line, width: 0.75 } });
  const tc = opt.dark ? H.white : H.navy;
  const runs = [{ text: head, options: { bold: true, fontSize: opt.hs || 13, color: opt.dark ? H.gold : tc, breakLine: true } }];
  if (opt.big) runs.push({ text: opt.big, options: { bold: true, fontSize: opt.bs || 26, color: tc, breakLine: true } });
  runs.push({ text: body, options: { fontSize: opt.fs || 11, color: opt.dark ? H.white : H.text } });
  s.addText(runs, { x: x + 0.15, y: y + 0.1, w: w - 0.3, h: h - 0.2, valign: "top", margin: 0, paraSpaceAfter: 4, isTextBox: true });
}

// ===== the family mobility office deck (Minto pyramid) =====
const SRCFMO = "research/fmo_strategy.md (strategy and pricing analysis, adversarially reviewed and fact-checked, Oct 2026)";
function chip(s, x, y, w, t, dark, warn) {
  const f = warn ? H.low : dark ? H.navy : H.light, c = warn ? H.red : dark ? H.white : H.navy;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.3, rectRadius: 0.08, fill: { color: f }, line: { color: f } });
  s.addText(t, { x, y, w, h: 0.3, fontSize: 9.5, bold: true, color: c, align: "center", valign: "middle", margin: 0, isTextBox: true });
}
function diamond(s, cx, cy, d, fill, label, lc) {
  s.addShape(pres.shapes.DIAMOND, { x: cx - d / 2, y: cy - d / 2, w: d, h: d, fill: { color: fill }, line: { color: H.white, width: 1 } });
  s.addText(label, { x: cx - 0.4, y: cy - 0.15, w: 0.8, h: 0.3, fontSize: 10, bold: true, color: lc || H.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
}

// ---------- COVER ----------
section("Opening");
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: sec });
  s.addImage({ path: CREST, x: 0, y: 0, w: 5.0, h: 7.5 });
  s.addText("OTIUM CHIGI JOURNEYS · STRATEGY DECK · OCTOBER 2026", { x: 5.6, y: 1.0, w: 7.1, h: 0.35, fontSize: 11, bold: true, color: H.gold, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText("UHNW families buy every piece of a journey from a different vendor — an integrated platform can win, but only by entering through staff and enveloping the rest", { x: 5.6, y: 1.5, w: 7.13, h: 2.7, fontSize: 24, bold: true, color: H.white, margin: 0, valign: "top", isTextBox: true });
  s.addText("A problem-first study of affluent and ultra-high-net-worth leisure travel: the pains, what families resort to, about 35 opportunities screened outside-in, a two-sided platform tested through its entry wedge, three waves, and a 90-day test that settles the first step", { x: 5.6, y: 4.35, w: 7.1, h: 1.3, fontSize: 13, color: H.light, margin: 0, valign: "top", isTextBox: true });
  s.addText([{ text: "Calebe Garcia · Otium Chigi Journeys", options: { breakLine: true } }, { text: "Discussion document · Confidential", options: { color: H.light } }], { x: 5.6, y: 6.0, w: 7.1, h: 0.7, fontSize: 12, color: H.white, margin: 0, isTextBox: true });
  s.addNotes("Governing thought first (Minto). The deck answers one question: should we create a two-sided platform that integrates exclusive luxury travel for UHNW and affluent families? Founder fit was not used to rank options.");
}

// ---------- EXEC SUMMARY ----------
{
  const s = content("Executive summary", "Executive summary: build the platform in waves — enter through staff, envelop the rest, and prove the wedge pays before scaling", "pages that follow; every figure is dated and sourced there and in the research files.");
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.82, w: 12.13, h: 0.62, fill: { color: H.navy }, line: { color: H.navy } });
  s.addText("Answer: yes, but in waves. Enter through staff and compliance, which families use even before suppliers join; then envelop trip design, access and the data layer. First prove in 90 days, with no capital, that families value guaranteed, lawful staff cover at £13.6–19.9k+ per position-year.", { x: 0.8, y: 1.82, w: 11.8, h: 0.62, fontSize: 12.5, bold: true, color: H.white, margin: 0, valign: "middle", isTextBox: true });
  const rows = [
    ["The problem is real but mostly served", "Planning takes 16 hours a trip (Priceline, Jan 2024, n = 3,024), yet luxury operators already solve it well; discovery calls last only 15–45 minutes."],
    ["The unserved layer crosses borders", "UHNW families buy staff, legal status, records and supplier trust from separate vendors. Only 2.36% of one agency’s childcare candidates can work rotations (Morgan & Mallet, 2025/26)."],
    ["Integration is the gap; staff is the way in", "No one integrates trips, access, staff and trust. Staff + compliance scored top among ~35 opportunities (19/25) and works with one side only — the platform’s entry wedge."],
    ["The wedge must pay before the platform can", "On measurable value the staff wedge is −£7.6k to −£13.9k per position-year (CALC); profit needs the guarantee valued at £13.6–19.9k+. Bundled modules add take-rate revenue only once both sides are on."],
    ["Wave 1: Rome, Southern Italy, Santa Catarina", "Opposite seasons keep staff and suppliers busy all year. Nine tests in 90 days and ~160 hours, two kill gates, no capital; GO region by region."],
  ];
  rows.forEach((r, i) => {
    const y = 2.58 + i * 0.73;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 3.4, h: 0.64, fill: { color: H.panel }, line: { color: H.panel } });
    s.addText((i + 1) + "  " + r[0], { x: 0.75, y, w: 3.2, h: 0.64, fontSize: 11.5, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    s.addText(r[1], { x: 4.15, y, w: 8.55, h: 0.64, fontSize: 10.5, color: H.text, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.LINE, { x: 4.15, y: y + 0.68, w: 8.58, h: 0, line: { color: H.line, width: 0.5 } });
  });
}

// ---------- SCQ ----------
{
  const s = content("Introduction", "Wealthy families pay to remove risk — but no one integrates what their journeys need", "Altrata WUWR 2026; Knight Frank 2026; PS and Heathrow Windsor pricing (2026); security price guides; agency fee schedules (2025–26); GOV.UK and Home Office PQ55427 (Jun 2025); UAE Decree-Law 9/2022.");
  const cols = [
    ["Situation", "557–714k UHNW people (Altrata 2026; Knight Frank 2026), with about three homes each, live and travel across countries — and already pay heavily to remove risk: private airport suites from US$3,550 a visit, close protection US$1,800–4,000 a day, agency fees of 15–25% of salary.", H.panel, H.navy, H.text],
    ["Complication", "Each piece is sold by a different vendor — advisors design, concierges open doors, agencies place staff, payroll firms employ them — and none of it crosses borders with the family. Rules tighten: the UK domestic-worker visa route is under review (Jun 2025); the UAE fines illegal employment AED 50–200k.", H.panel, H.navy, H.text],
    ["Question", "Should we create a two-sided platform that integrates exclusive luxury travel for UHNW and affluent families?", H.navy, H.gold, H.white],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 3.85, h: 4.1, fill: { color: c[2] }, line: { color: c[2] } });
    s.addText(c[0], { x: x + 0.25, y: 2.1, w: 3.4, h: 0.45, fontSize: 18, bold: true, color: c[3], margin: 0, isTextBox: true });
    s.addText(c[1], { x: x + 0.25, y: 2.65, w: 3.4, h: 3.25, fontSize: i === 2 ? 17 : 12, bold: i === 2, color: c[4], margin: 0, valign: "top", isTextBox: true });
    if (i < 2) s.addShape(pres.shapes.RIGHT_ARROW || "rightArrow", { x: x + 3.87, y: 3.8, w: 0.22, h: 0.4, fill: { color: H.gold }, line: { color: H.gold } });
  });
  callout(s, "The rest of the deck answers this one question, branch by branch.");
}

// ---------- ISSUE TREE ----------
{
  const s = content("Introduction", "Five questions decide it: the gap is real, a platform can only win through a wedge, and the wedge must prove it pays", "Our issue analysis (key question in yes/no form, MECE branches, at most four levels); answers from the chapters that follow.");
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 3.15, w: 2.9, h: 1.5, fill: { color: H.navy }, line: { color: H.navy } });
  s.addText("Should we create a two-sided platform that integrates exclusive luxury travel for UHNW and affluent families?", { x: 0.75, y: 3.15, w: 2.6, h: 1.5, fontSize: 13, bold: true, color: H.white, margin: 0, valign: "middle", isTextBox: true });
  const qs = [
    ["1 · Is the pain real and paid for?", "Yes: families pay for staff, access and trust; planning is already served", "Yes", 0],
    ["2 · Is there an unfilled gap?", "Yes: no one integrates staff, access and trust across borders", "Yes", 0],
    ["3 · Can a platform win?", "Not head-on: winner-take-all fails; only via a wedge and envelopment", "Via wedge", 1],
    ["4 · Does it pay?", "Not yet: the wedge is −£7.6k to −£13.9k per position-year (CALC)", "Not yet", 1],
    ["5 · Can we test it cheaply?", "Yes: 9 tests, 90 days, ~160 hours, no capital", "Yes", 0],
  ];
  s.addShape(pres.shapes.LINE, { x: 3.5, y: 3.9, w: 0.35, h: 0, line: { color: H.navy, width: 1.5 } });
  s.addShape(pres.shapes.LINE, { x: 3.85, y: 2.2, w: 0, h: 3.6, line: { color: H.navy, width: 1.5 } });
  qs.forEach((q, i) => {
    const y = 1.92 + i * 0.86;
    s.addShape(pres.shapes.LINE, { x: 3.85, y: y + 0.29, w: 0.3, h: 0, line: { color: H.navy, width: 1.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 4.15, y, w: 4.6, h: 0.72, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
    s.addText(q[0], { x: 4.3, y, w: 4.35, h: 0.72, fontSize: 11, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    chip(s, 8.95, y + 0.2, 0.95, q[2], q[3] === 0, q[3] === 1);
    s.addText(q[1], { x: 10.05, y, w: 2.68, h: 0.72, fontSize: 10, color: H.text, margin: 0, valign: "middle", isTextBox: true });
  });
  callout(s, "Branches 3 and 4 are the binding constraints — the 90-day plan is built to answer them first.");
}

// ---------- CHAPTER 1 ----------
section("1 · The problem");
{
  const s = content("1 · The problem", "The core claim, tested: planning costs real time, but the ‘long interview’ is a myth and the pain is already served",
    "Priceline (Jan 2024, n = 3,024); Expedia Group/Luth Research Path to Purchase (2023); KAYAK, Skyscanner (samples not stated); vendor process pages: Zicasso, Aracari, Forest Travel, Black Tomato, Travelweek (Jul 2026); Nawijn et al., Applied Research in Quality of Life (2010).");
  const cols = [
    ["Supported", H.navy, true, "16 hours to plan and book one trip; 47% say less planning would cut stress (Priceline, n = 3,024).\n\n303 minutes with travel content and 141 pages viewed in the 45 days before booking (Expedia/Luth 2023).\n\n33–47% find planning stressful (KAYAK, Skyscanner; weak)."],
    ["Contradicted", H.panel, false, "Discovery calls last 15–45 minutes.\n\nEnquiry forms hold 10–12 fields.\n\nFirst proposals arrive in 24 hours to 2 weeks, with 2–3 revision rounds.\n\nAll vendor statements: the interview is short, not long."],
    ["Unproven", H.panel, false, "No survey measures planning time, stress or regret for HNW or UHNW travellers.\n\nCounter-evidence: anticipation is the happiest phase of a holiday (Nawijn 2010, n = 1,530).\n\nNo verified first-person quotes were obtainable (forums block automated access)."],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.9, w: 3.93, h: 4.2, fill: { color: c[1] }, line: { color: c[2] ? H.navy : H.line, width: 0.75 } });
    s.addText(c[0], { x: x + 0.2, y: 2.0, w: 3.5, h: 0.45, fontSize: 16, bold: true, color: c[2] ? H.gold : H.navy, margin: 0, isTextBox: true });
    s.addText(c[3], { x: x + 0.2, y: 2.5, w: 3.55, h: 3.5, fontSize: 11.5, color: c[2] ? H.white : H.text, margin: 0, valign: "top", isTextBox: true });
  });
  callout(s, "Verdict: partly true for travellers in general, unproven for the affluent — and the planning pain is one they already pay advisors to remove.");
}

{
  const s = content("1 · The problem", "The pain map: the frequent pains are mild and already served; the severe ones are rare",
    "Priceline (Jan 2024); Expedia/Luth (2023); Wyndham/APCO (2017); Park & Jang, Tourism Management (2013); Greetwell AI Travel Survey (Aug 2026, vendor); ACI Europe open letter (1 Jul 2026); Travel Weekly (Aug 2025); Fora; SITA Baggage IT Insights 2026; Action Fraud via ATOL (2024); insurer survey via eGlobal Travel Media (Feb 2025). Positions: our assessment.");
  const X0 = 1.3, Y0 = 1.9, W = 5.9, Hh = 3.9;
  s.addShape(pres.shapes.RECTANGLE, { x: X0, y: Y0, w: W, h: Hh, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  s.addShape(pres.shapes.RECTANGLE, { x: X0, y: Y0, w: W * 0.45, h: Hh / 3, fill: { color: "E3E9F3" }, line: { color: "E3E9F3" } });
  s.addText("Rare but costly", { x: X0 + 0.1, y: Y0 + 0.06, w: 2.4, h: 0.3, fontSize: 9.5, italic: true, color: H.navy, margin: 0, isTextBox: true });
  s.addText("Frequent but mild — and served", { x: X0 + W - 3.1, y: Y0 + Hh - 0.36, w: 3.0, h: 0.3, fontSize: 9.5, italic: true, color: H.navy, align: "right", margin: 0, isTextBox: true });
  ["Very low", "Low", "Medium", "Med–high", "High"].forEach((t, i) => s.addText(t, { x: X0 + (i / 5) * W, y: Y0 + Hh + 0.05, w: W / 5, h: 0.28, fontSize: 9, color: H.muted, align: "center", margin: 0, isTextBox: true }));
  s.addText("Frequency →", { x: X0, y: Y0 + Hh + 0.32, w: W, h: 0.28, fontSize: 10, bold: true, color: H.muted, align: "center", margin: 0, isTextBox: true });
  ["Low–med", "Medium", "High"].forEach((t, i) => s.addText(t, { x: 0.55, y: Y0 + Hh - ((i + 0.5) / 3) * Hh - 0.15, w: 0.7, h: 0.3, fontSize: 9, color: H.muted, align: "right", margin: 0, isTextBox: true }));
  s.addText("Severity ↑", { x: 0.45, y: Y0 - 0.32, w: 1.2, h: 0.28, fontSize: 10, bold: true, color: H.muted, margin: 0, isTextBox: true });
  const pts = [[1, 4.6, 1], [2, 3.7, 2], [3, 3.05, 2.3], [4, 2.3, 2.1], [5, 1.8, 1.75], [6, 2.9, 1], [7, 1.6, 3], [8, 0.7, 3], [9, 2.95, 1.7]];
  pts.forEach((p) => num(s, X0 + (p[1] / 5) * W, Y0 + Hh - ((p[2] - 0.5) / 3) * Hh, 0.42, p[0], p[2] === 3 ? H.goldDk : H.navy));
  const list = [["Research load", "16 h per trip; 141 pages before booking"], ["Choice overload, regret", "67% ‘information overload’; >22 options → no choice"], ["AI planners get it wrong", "55% of 485 AI users met a bad recommendation"], ["Border friction", "EES waits up to 5 h at peak (Jul 2026)"], ["Stress, couple conflict", "33–47% find planning stressful (weak)"], ["Advisor fees", "55% of US advisors charge; average ~US$350"], ["Baggage and delay", "US$6.3bn cost in 2025; US$260 per bag"], ["Fraud, hidden fees", "UK £11.2M lost in 2024; £1,844 per victim"], ["Health and safety worry", "37% name a medical emergency first"]];
  list.forEach((l, i) => {
    const y = 1.9 + i * 0.47;
    num(s, 7.75, y + 0.2, 0.32, i + 1, i === 6 || i === 7 ? H.goldDk : H.navy);
    s.addText([{ text: l[0] + "  ", options: { bold: true, color: H.navy } }, { text: l[1], options: { color: H.text } }], { x: 8.05, y, w: 4.68, h: 0.42, fontSize: 10, margin: 0, valign: "middle", isTextBox: true });
  });
  callout(s, "Most of these pains hit everyone, rich or not — and luxury operators already solve the frequent ones well.");
}

{
  const s = content("1 · The problem", "For ultra-high-net-worth travellers the evidenced pains are solvency, legitimacy, privacy and security — not planning",
    "Court and press records on JetSuite (2020), Verijet, Jet It (Dec 2025), OneFlight (Sep 2026); FAA enforcement releases; CrewPass; press on Bernard Arnault and @ElonJet; The Watch Register (2024); Global Rescue member survey (Jan 2025, n > 1,300); Flywire (Mar 2025, n 500+, vendor). Most figures from search summaries.");
  const cards = [
    ["Deposits lost when providers fail", "~US$150M", "of deposits at risk when OneFlight paused flights (Sep 2026). JetSuite owed ~US$50M (2020); Verijet >US$10.5M; Jet It filed Chapter 7 (Dec 2025)."],
    ["Illegal or unvetted suppliers", "US$2.19M", "proposed FAA fine for illegal charter; another US$1.5M for 114 flights. Yacht-crew background checks are voluntary."],
    ["Movement exposed", "Sold the jet", "Bernard Arnault now charters after public flight tracking; Elon Musk called @ElonJet ‘a physical safety violation’."],
    ["Theft on the move", "21 a day", "high-end watches reported lost or stolen in 2024, up from 12 in 2021; Paris +31% in 2022–24."],
  ];
  cards.forEach((c, i) => card(s, 0.6 + i * 3.06, 1.9, 2.95, 3.25, c[0], c[2], { big: c[1], bs: 24, hs: 12, fs: 11, dark: i === 0 }));
  s.addText([{ text: "Also evidenced: ", options: { bold: true, color: H.navy } }, { text: "22% of Global Rescue members needed emergency care abroad; 72% of ultra-luxury travellers worry about payment security; 96% rely on advisors." }],
    { x: 0.6, y: 5.35, w: 12.13, h: 0.6, fontSize: 12, color: H.text, margin: 0, isTextBox: true });
  callout(s, "Rarer than planning pain — but each one can cost six or seven figures, and no single provider covers them.");
}

{
  const s = content("1 · The problem", "What the pains already cost: UHNW travellers pay most for privacy, protection and someone to vouch for a supplier",
    "PS and travelextra (2026); Executive Traveller (Windsor Suite); security and protection price guides (2025–26); private-charter market reports (2025, two agree); broker and MYBA terms; PinnacleCare; Altrata World Ultra Wealth Report 2025 via Black Enterprise; K&R broker quotes. Figures from search summaries except PS and Windsor pages.");
  const stats = [
    ["US$3,550", "per visit to a private airport suite (PS, LAX/ATL), on top of US$4,850 a year; Heathrow’s Windsor Suite from £3,812"],
    ["US$1,800–4,000", "a day for high-end close protection in the US; £500–1,000 a day in the UK"],
    ["10–20%", "broker markup on a ~US$16bn private-charter market (2025) — partly payment to vouch"],
    ["15–20%", "broker commission on superyacht charters of €120k–700k+ a week"],
    ["US$15–55k", "a year for concierge medicine (PinnacleCare)"],
    ["US$290bn", "UHNW luxury spend in 2024; jets and yachts US$28.6bn (Altrata)"],
  ];
  stats.forEach((st, i) => {
    const x = 0.6 + (i % 3) * 4.1, y = 1.9 + Math.floor(i / 3) * 2.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 3.93, h: 1.95, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
    s.addText(st[0], { x: x + 0.2, y: y + 0.15, w: 3.6, h: 0.7, fontSize: 26, bold: true, color: H.navy, margin: 0, isTextBox: true });
    s.addText(st[1], { x: x + 0.2, y: y + 0.9, w: 3.6, h: 0.95, fontSize: 11.5, color: H.text, margin: 0, valign: "top", isTextBox: true });
  });
  callout(s, "Little goes on subscriptions (K&R cover ~US$1–2k a year); a lot goes on anyone who takes the risk off them.");
}


{
  const s = content("1 · The problem", "What families resort to: no alternative handles supplier, deposit or cross-border risk well — the gap every option leaves open",
    "Our assessment (1–10) of how well each alternative handles each pain by design, from Phases 1–2 research; prices from operator and vendor pages, Travel Weekly (Aug 2025), Stirling Access, Inspirato and Exclusive Resorts filings and press, NetJets and market reports, UBS and Campden family-office reports (2025).");
  const rows = [
    ["DIY: OTAs, reviews", 4, 3, 4, 2, 2, 1, 2, "Free; hosts pay 16–18%"],
    ["AI planners", 6, 3, 2, 1, 1, 1, 1, "Free to low"],
    ["Advisor networks", 8, 7, 7, 5, 6, 3, 4, "~US$350 fee; 10–12% commission"],
    ["Luxury operators", 9, 7, 7, 6, 7, 6, 5, "A&K small groups from ~US$11k pp"],
    ["Concierge clubs", 4, 3, 4, 3, 3, 2, 2, "£2k–25k a year"],
    ["Card concierge", 3, 2, 3, 2, 2, 1, 3, "Centurion US$15k year one"],
    ["Hotel-led", 2, 3, 6, 2, 5, 4, 6, "Hosted lodges US$1.5–4.5k pp a night"],
    ["Villa companies", 5, 5, 6, 2, 4, 3, 3, "Market rates"],
    ["Destination clubs", 7, 7, 7, 3, 5, 3, 2, "From US$175k + US$1,595 a day"],
    ["Private aviation", 1, 1, 2, 3, 7, 3, 2, "US$8,600–11,426 an hour"],
    ["Family office / assistant", 7, 6, 6, 6, 6, 5, 5, "Assistant £80–130k a year"],
    ["Security, medical, rescue", 1, 1, 1, 2, 5, 9, 2, "US$285–1,325 a year"],
  ];
  table(s, ["Alternative", "Research", "Choice", "Reliable info", "Entry", "On-trip failure", "Health, safety", "Supplier & deposit risk", "Price (examples)"],
    rows.map((r) => [r[0], heat(r[1]), heat(r[2]), heat(r[3]), heat(r[4]), heat(r[5]), heat(r[6]), heat(r[7]), r[8]]),
    { colW: [2.2, 0.95, 0.95, 1.05, 0.85, 1.1, 1.05, 1.35, 2.63], fs: 9.5, rowH: 0.33 });
  callout(s, "Best score on supplier and deposit risk: 6. The pain UHNW buyers cannot hand off is trusting who holds their money.", 6.3);
}


// ---------- CHAPTER 2 ----------
section("2 · Where to play");
{
  const s = content("2 · Where to play", "Across ten domains of UHNW life, the unserved spend sits in what must move with the family: staff, records, health data and trust", "research/opportunity_map.md and raw/map_a–d.md (Oct 2026); figures from search summaries unless stated; most samples affluent rather than verified US$30M+ households.");
  table(s, ["Domain", "Biggest spend pool (examples)", "Sharpest pain (evidence)"], [
    ["Residency, second homes", "Italy flat tax €300k/yr (2026); Greece golden visa €400–800k; estate managers US$150–250k", "Proving day counts (NY counts any part of a day); empty-home insurance lapses after 30–60 days"],
    ["Health and longevity", "Retreats €7–20k a week, up to CHF 40k; memberships US$10.5–85k a year", "No referee of quality (~30% incidental findings); no home physician afterwards"],
    ["Staff and entourage", "Travelling nanny £55–110k; private chef up to US$300k; agency fees 12–25%", "Only 2.36% of one agency’s candidates can rotate; UK visa caps stays at 6 months"],
    ["Time and delegation", "Executive assistants US$120–250k; chief of staff US$150–300k", "The assistant is a single point of failure; ~47% of family offices offer no lifestyle services"],
    ["Mobility", "Yacht running cost 10–15% of value a year; 200ft Antibes berth ~US$78k a month", "Junior crew turnover 37%; provider failures with deposits lost"],
    ["Events and access", "Wimbledon debenture £116k; Super Bowl suites US$0.6–2.5m", "Official channels sell out; UK ticket fraud £9.3m in 13 months"],
    ["Identity and cyber", "Family-office cyber loss US$1.2m per incident (Deloitte 2024)", "37–43% of family offices attacked in 2 years; impersonation targets assistants"],
    ["Impact and carbon", "SAF a few hundred US$ per flight", "Private-jet emissions +25% in a decade; offsets discredited"],
    ["Family and education", "College tours US$25–300k a trip; Le Rosey CHF 125–132k a year", "71% of family offices have not engaged the next generation"],
    ["Money around travel", "71–72% of luxury travellers worry about payment security (Flywire)", "Payment friction and fees; thin evidence"],
  ], { colW: [2.2, 4.9, 5.03], fs: 9.5, rowH: 0.4 });
}
{
  const s = content("2 · Where to play", "Scored outside-in, the people-and-records wedge leads: travelling staff with compliance ties the top score and fuses into one offer", "research/opportunity_map.md. Our assessment, 1–5 per criterion: pain severity × frequency, gap vs best alternative, revealed willingness to pay, moat (gate ≥ 3), spend pool. Founder fit not scored; capital flagged, not filtered.");
  const cols = [H.navy, H.mid, H.light, H.gold, "8FA6C9"], names = ["Pain", "Gap", "WTP evidence", "Moat", "Pool"];
  names.forEach((n, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 4.2 + i * 1.3, y: 1.84, w: 0.2, h: 0.2, fill: { color: cols[i] }, line: { color: cols[i] } });
    s.addText(n, { x: 4.47 + i * 1.3, y: 1.79, w: 1.0, h: 0.3, fontSize: 9.5, color: H.text, margin: 0, isTextBox: true });
  });
  s.addText("Total", { x: 10.95, y: 1.79, w: 0.6, h: 0.3, fontSize: 9.5, bold: true, color: H.muted, margin: 0, isTextBox: true });
  s.addText("Moat gate", { x: 11.85, y: 1.79, w: 0.9, h: 0.3, fontSize: 9.5, bold: true, color: H.muted, margin: 0, isTextBox: true });
  const rows = [["Travelling staff and crew pool ★", [4, 4, 4, 4, 3], 1, 1], ["Post-retreat health continuity", [4, 4, 4, 3, 4], 1, 0], ["Counterparty assurance (earlier lead)", [4, 5, 3, 4, 3], 1, 0], ["Staff mobility compliance + record ★", [4, 4, 3, 4, 3], 1, 1], ["Residency day-count ledger", [4, 4, 3, 4, 3], 1, 0], ["Multi-home operating pool", [3, 3, 4, 3, 4], 1, 0], ["Independent longevity-clinic rating", [3, 4, 3, 3, 3], 1, 0], ["AI copilot for assistants", [3, 3, 3, 3, 4], 1, 0], ["Anti-impersonation protocol", [4, 3, 3, 3, 3], 1, 0], ["Verified peer network", [3, 3, 4, 3, 3], 1, 0], ["Audited SAF registry", [3, 4, 2, 4, 3], 1, 0], ["Advisor agentic back-office", [3, 3, 3, 2, 4], 0, 0], ["Rome–Santa Catarina curator (original)", [3, 1, 4, 1, 2], 0, 0]];
  const unit = 0.26;
  rows.forEach((r, i) => {
    const y = 2.18 + i * 0.315;
    s.addText(r[0], { x: 0.6, y, w: 3.5, h: 0.27, fontSize: 9.5, bold: r[3] === 1, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    let x = 4.2;
    r[1].forEach((v, k) => { s.addShape(pres.shapes.RECTANGLE, { x, y: y + 0.03, w: v * unit, h: 0.21, fill: { color: cols[k] }, line: { color: H.bg, width: 0.5 } }); x += v * unit; });
    s.addText(String(r[1].reduce((a, b) => a + b, 0)), { x: x + 0.08, y, w: 0.5, h: 0.27, fontSize: 10.5, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 11.9, y: y + 0.02, w: 0.7, h: 0.23, rectRadius: 0.06, fill: { color: r[2] ? H.navy : H.low }, line: { color: r[2] ? H.navy : H.low } });
    s.addText(r[2] ? "Pass" : "Fail", { x: 11.9, y: y + 0.02, w: 0.7, h: 0.23, fontSize: 8.5, bold: true, color: r[2] ? H.white : H.red, align: "center", valign: "middle", margin: 0, isTextBox: true });
  });
  callout(s, "★ The two staff ideas fuse into one wedge: an employed rotating pool with the compliance layer built in.");
}
{
  const s = content("2 · Where to play", "The platform: one place where families get the journey, the access, the people and the trust — and suppliers get qualified guests", "Concept to be tested. Modules from research/opportunity_map.md and the owner’s earlier integrated-platform work; evidence on each module in chapters 1–4.");
  s.addShape(pres.shapes.OVAL, { x: 5.1, y: 2.75, w: 3.1, h: 2.2, fill: { color: H.navy }, line: { color: H.navy } });
  s.addText([{ text: "Otium Chigi", options: { bold: true, fontSize: 15, color: H.white, breakLine: true } }, { text: "Journeys platform", options: { fontSize: 12, color: H.gold } }], { x: 5.1, y: 2.75, w: 3.1, h: 2.2, align: "center", valign: "middle", margin: 0, isTextBox: true });
  const mods = [["1 · Journey design + booking", "Three-minute questionnaire, three priced proposals in 24 hours, one price and one payment", 1.3, 1.9], ["2 · Access + hosting", "Held MICHELIN tables, opening-time access, crowd-smart timing and a local host in each region", 8.7, 1.9], ["3 · Staff + compliance", "Hire our vetted staff or manage the family’s own: visas, payroll, insurance across borders", 1.3, 4.55], ["4 · Data + trust", "Preferences, residency days, health records, supplier vetting, deposit protection — and a crowd index from our own trips", 8.7, 4.55]];
  mods.forEach((m) => {
    s.addShape(pres.shapes.RECTANGLE, { x: m[2] - 0.7, y: m[3], w: 4.0, h: 1.3, fill: { color: m[0].startsWith("3") ? H.gold : H.panel }, line: { color: H.line, width: 0.75 } });
    s.addText([{ text: m[0], options: { bold: true, fontSize: 12.5, color: H.navy, breakLine: true } }, { text: m[1], options: { fontSize: 10.5, color: H.text } }], { x: m[2] - 0.55, y: m[3] + 0.08, w: 3.7, h: 1.14, margin: 0, valign: "middle", isTextBox: true });
  });
  s.addText("Families and family offices", { x: 0.6, y: 3.6, w: 2.0, h: 0.5, fontSize: 10.5, bold: true, color: H.navy, margin: 0, isTextBox: true });
  s.addText("Suppliers, staff and rails partners", { x: 10.8, y: 3.6, w: 1.93, h: 0.5, fontSize: 10.5, bold: true, color: H.navy, align: "right", margin: 0, isTextBox: true });
  callout(s, "Module 3 (gold) is the wedge: families use it even before suppliers join — the platform’s answer to chicken-and-egg.");
}
{
  const s = content("2 · Where to play", "Module order: the staff wedge first — each later module and wave needs its own trigger", "research/fmo_strategy.md §8 (roadmap and triggers; thresholds are assumptions); stages 1–2 priced on London rates, to be re-measured for Wave 1; research/opportunity_map.md §3 (platform thesis).");
  const st = [
    ["0", "Validate", "Days 0–90", "GO at day 90 (all gates pass)", H.navy],
    ["1", "Wave-1 relief club", "Months 4–15", "Paid pilot: 1 reliever, 4–6 positions; cleared foreign legs only", H.navy],
    ["2", "Scale the club", "Months 16–36", "3 relievers, 15 positions; ≥ 5 renewals, ≥ 68% utilisation, economic profit ≥ 0", H.mid],
    ["3", "Staff record", "Later", "≥ 3 agencies accept and pay; free to staff", H.light],
    ["4", "Residency day-count ledger", "Later", "Staff diaries for 20+ households and an adviser who signs off", H.light],
    ["5", "Health, identity, supplier trust", "Later", "Separate incumbents; one data vault concentrates breach risk", H.panel],
  ];
  st.forEach((t, i) => {
    const x = 0.6 + i * 2.05, y = 2.0 + (5 - i) * 0.32;
    const dark = i < 3;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 1.95, h: 3.9 - (5 - i) * 0.32, fill: { color: t[4] }, line: { color: t[4] } });
    s.addText([{ text: "Stage " + t[0], options: { fontSize: 10, bold: true, color: dark ? H.gold : H.goldDk, breakLine: true } }, { text: t[1], options: { fontSize: 12.5, bold: true, color: dark ? H.white : H.navy, breakLine: true } }, { text: t[2], options: { fontSize: 9.5, italic: true, color: dark ? H.light : H.muted, breakLine: true } }, { text: "Trigger: " + t[3], options: { fontSize: 9.5, color: dark ? H.white : H.text } }],
      { x: x + 0.12, y: y + 0.1, w: 1.72, h: 3.6 - (5 - i) * 0.32, margin: 0, valign: "top", paraSpaceAfter: 4, isTextBox: true });
  });
  callout(s, "Platform thesis: one vault of people and records that moves with the family — but stages 3–5 stay hypotheses until stage 2 pays.");
}
{
  const s = content("2 · Where to play", "Three waves: start where the partners are and the seasons are opposite — Rome, Southern Italy and the Santa Catarina coast", "Banco Central via Economic News Brasil (Jan 2026); Civitatis via Brasilturis (Dec 2025); Panrotas (Dec 2025); Euronews (Feb 2026: Trevi, Capri); Made in Pompei (Feb 2025); The Roman Guy; Congresso em Foco (Jul 2026); NSC Total (Dec 2025). Triggers are assumptions.");
  const w = [
    ["Wave 1 · Year 1", "Rome · Southern Italy (Naples, Amalfi Coast, Capri) · Santa Catarina coast", ["Rome: private Vatican access sells at 9–23× the standard ticket; up to 70,000 a day at the Trevi Fountain", "Southern Italy: up to 50,000 day visitors a day on Capri for 13–15,000 residents; Pompeii capped at 20,000 a day", "Santa Catarina: violent deaths 7.6 per 100,000 vs 22.6 in Rio; a Jurerê New Year week at R$166,909", "Opposite seasons: Italy Apr–Oct, Santa Catarina Dec–Mar — staff and suppliers work all year"], H.navy, H.white, H.gold],
    ["Wave 2 · Trigger-led", "Rest of Italy · Mediterranean (Greece, Ibiza) · the Alps", ["Where: Florence, Venice, Como, Sicily, Sardinia · Athens and the islands · Ibiza · Cortina, St. Moritz, Zermatt, Courchevel", "Trigger: Wave-1 staff wedge at economic profit ≥ 0 (15 positions)", "Trigger: ≥ 20 suppliers live per Wave-1 region (assumption)", "Adds summer islands and winter ski: the same families, more of the year"], H.mid, H.white, H.white],
    ["Wave 3 · Only if proven", "Global", ["Where: the Riviera, Portugal, Croatia, the Caribbean, the Maldives, Dubai, Aspen", "Trigger: repeat families across ≥ 2 regions and the data layer in use", "Partner-led, never asset-led: no owned homes, yachts or aircraft"], H.light, H.navy, H.navy],
  ];
  w.forEach((t, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.9, w: 3.95, h: 4.25, fill: { color: t[3] }, line: { color: t[3] } });
    s.addText([{ text: t[0], options: { bold: true, fontSize: 10.5, color: t[5], breakLine: true } }, { text: t[1], options: { bold: true, fontSize: 13, color: t[4] } }], { x: x + 0.2, y: 2.0, w: 3.55, h: 1.0, margin: 0, valign: "top", isTextBox: true });
    s.addText(t[2].map((b, k) => ({ text: b, options: { bullet: true, breakLine: k < t[2].length - 1 } })), { x: x + 0.2, y: 3.05, w: 3.55, h: 3.0, fontSize: 10, color: t[4], margin: 0, valign: "top", paraSpaceAfter: 5, isTextBox: true });
  });
  callout(s, "Brazilians spent US$21.7bn abroad in 2025 and booked Italy most; 9.0M foreigners visited Brazil — Wave 1 links both directions.");
}
{
  const s = content("2 · Where to play", "Asset-heavy aggregators lose money or get absorbed; the asset-light advisor model wins",
    "Company filings and press: Vista/XO, Wheels Up FY2025, Volato H1 2026, Jet It (Dec 2025), Joby–Blade (2025), Accor–onefinestay (2016, Jun 2026 exit), Inspirato (Feb 2026), Fora Series D (Jul 2026). Search summaries; verify before external use.");
  const cs = [
    ["JetSmarter → Vista/XO", "Membership flights", "Absorbed; Vista ~US$436M net losses over four years", 0],
    ["Wheels Up", "Membership plus fleet", "FY2025 net loss US$82.3M; active users −40% in Q1 2025", 0],
    ["Volato", "Fractional and jet card", "Revenue −96% to US$2M in H1 2026; card closed", 0],
    ["Jet It", "Fractional", "Chapter 7 liquidation, December 2025", 0],
    ["Blade (passenger)", "Urban air mobility", "Sold to Joby for US$90M plus up to US$35M", 0],
    ["onefinestay", "Managed luxury homes", "Bought for ~US$169M (2016); exits Paris, New York, LA (2026)", 0],
    ["Inspirato", "Destination club", "Sold for ~US$59M of equity (Feb 2026)", 0],
    ["Fora", "Asset-light advisors", "US$1bn valuation; 15,000 advisors (Jul 2026)", 1],
  ];
  cs.forEach((c, i) => {
    const x = 0.6 + (i % 4) * 3.06, y = 1.9 + Math.floor(i / 4) * 2.15, w = 2.95, h = 2.0, win = c[3] === 1;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: win ? H.navy : H.panel }, line: { color: win ? H.navy : H.line, width: 0.75 } });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.15, y: y + 0.15, w: 1.25, h: 0.3, rectRadius: 0.08, fill: { color: win ? H.gold : H.low }, line: { color: win ? H.gold : H.low } });
    s.addText(win ? "Winning" : "Lost or absorbed", { x: x + 0.15, y: y + 0.15, w: 1.25, h: 0.3, fontSize: 8.5, bold: true, color: win ? H.navy : H.red, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText([{ text: c[0], options: { bold: true, fontSize: 13, color: win ? H.white : H.navy, breakLine: true } }, { text: c[1], options: { fontSize: 9.5, italic: true, color: win ? H.light : H.muted, breakLine: true } }, { text: c[2], options: { fontSize: 10.5, color: win ? H.white : H.text } }],
      { x: x + 0.15, y: y + 0.55, w: w - 0.3, h: h - 0.65, margin: 0, valign: "top", paraSpaceAfter: 3, isTextBox: true });
  });
  callout(s, "Lesson: own trust and data, never aircraft, homes or inventory.");
}


// ---------- CHAPTER 3 ----------
section("3 · Can it win?");
{
  const s = content("3 · Can it win?", "Platform economics: a two-sided network with cheap multi-homing — scale alone will not lock it in, so the wedge must work with one side", "research/fmo_strategy.md §4.4; research/phase4_5.md; platform benchmarks: Airbnb host fee 16%, Booking.com Preferred 15–18% in Brazil (2026), ~18% and up to 30% for Italian hotels (Direzione Hotel); partner sign-up cost from our earlier Southern Italy model; advisor commission ~10–12%; broker markups 10–20%; agency fees 15–25%. Network test per the three winner-take-all conditions.");
  table(s, ["Element", "Our platform"], [
    ["Sides", "Demand: UHNW and affluent families, family offices, assistants · Supply: villas, hotels, access providers, hosts, chefs, boats, household staff · Rails: employer of record, insurers, counsel"],
    ["Cross-side effects", "Positive: more vetted suppliers and staff raise value to families, and vice versa"],
    ["Same-side effects", "Negative for families at peaks (scarce staff, exclusivity congestion); positive for staff (steadier work)"],
    ["Multi-homing", "Cheap on both sides: families keep their advisors; suppliers sell on many channels at once"],
    ["Winner-take-all test", { text: "Fails today: multi-homing is cheap, effects are moderate, and demand is highly differentiated", options: { color: H.red, bold: true } }],
    ["Chicken-and-egg", "Single-player mode: staff + compliance is useful to a family with zero suppliers on the platform"],
    ["Subsidy side", "Suppliers join free: a free drone and photo shoot (~€1,040 per partner) buys net rates and Privileges, and they pay only on completed bookings. Staff get benefits, steady contracts and a portable record"],
    ["Marquee users", "A few reference families per region; landmark suppliers (palazzi, top villas, access providers)"],
  ], { colW: [2.4, 9.73], fs: 10, rowH: 0.5 });
  callout(s, "The platform logic holds only if the wedge creates the user base — then each added module raises switching costs.");
}
{
  const s = content("3 · Can it win?", "Envelopment: we bundle what single-function rivals sell alone on a shared user base — and guard against bigger platforms doing it to us", "Envelopment as in the network-markets framework: a platform with an overlapping user base bundles another’s function. raw/fmo_competitors.md; raw/alt_a–c.md; raw/uhnw_structure.md (Oct 2026); The Data Appeal Company (Almawave acquisition).");
  s.addText("We envelop", { x: 0.6, y: 1.85, w: 5.9, h: 0.35, fontSize: 14, bold: true, color: H.navy, margin: 0, isTextBox: true });
  table(s, ["Single-function rival", "What we bundle on top"], [
    ["Staff agencies (place once, 15–25%)", "Rotation, relief, visas and payroll in the same app"],
    ["Temp desks (£300–400 a day)", "Guaranteed relief from staff the family has met"],
    ["Household payroll (one country)", "Cross-border employer of record and cover"],
    ["Concierge clubs (£2k–25k a year)", "Access booked inside the family’s own journey"],
    ["Destination agencies, villa companies", "Design, booking and hosting with the family’s staff and data"],
  ], { y: 2.25, w: 5.9, colW: [2.6, 3.3], fs: 9.5, rowH: 0.55 });
  s.addText("They could envelop us", { x: 6.85, y: 1.85, w: 5.88, h: 0.35, fontSize: 14, bold: true, color: H.red, margin: 0, isTextBox: true });
  table(s, ["Threat (overlapping users)", "Our defence"], [
    ["Card issuers and private banks (Centurion; Capital One owns Velocity Black)", "Be their partner: white-label staff and compliance"],
    ["Advisor networks (Virtuoso ~20,000 advisors; Fora 15,000)", "Sell through advisors, not around them"],
    ["Booking platforms (Booking.com, Airbnb Luxe)", "Stay where they cannot: staff, legal status, private access"],
    ["Morgan & Mallet (EOR in 4 countries)", "Own reliever contracts; partner where it pays"],
    ["Concierge clubs (Quintessentially)", "Their clients’ staff and data are not on their platform"],
    ["Travel-data groups (Almawave bought The Data Appeal Co., which bought 70% of Mabrian)", "Data only from our own journeys; sold to towns and hotels after two seasons"],
  ], { x: 6.85, y: 2.25, w: 5.88, colW: [3.0, 2.88], fs: 9.5, rowH: 0.55 });
  callout(s, "Our moat, if any, is the bundle around the family’s own people and data — no single-function rival holds both.");
}
{
  const s = content("3 · Can it win?", "The wedge’s job: keep every home and trip staffed by the same trusted people, lawfully, with no gap when someone quits or a border says no", SRCFMO + " §2.1–2.2; Morgan & Mallet Beyond The Butler 2025/26; Deloitte 2024; UBS 2024–25; Quay (n = 100 captains); Home Office (ODW visas).");
  table(s, ["Customer", "Job to be done", "Spend evidence"], [
    ["S1 · Multi-home family with a single family office", "Staff every home and trip lawfully, without adding headcount or employer exposure", "~47% of family offices offer no lifestyle services (UBS 2024): a gap, not proof of spend"],
    ["S2 · Multi-home family run by the principal (PA or estate manager decides)", "The same trusted people in each home; no gap when someone quits or a border says no", "Travelling nanny £55–110k (UK), US$70–150k (US); agency fees 15–25%; temps £300–400 a day"],
    ["S3 · Yacht-owning family (hypothesis)", "Stable interior crew across yacht and homes", "No spend found; junior crew turnover 37% (Quay, n = 100 captains)"],
    ["S4 · Visiting family bringing its own staff", "Bring staff in lawfully; cover their days off", "~18–20k UK domestic-worker visas a year (Home Office, 2022)"],
    ["Staff (supply)", "Steady, legal travelling work, with a record that follows me", "Temp roles “harder to fill as strong candidates look for more long-term, steady roles” (Morgan & Mallet)"],
  ], { colW: [3.6, 4.1, 4.43], fs: 10.5, rowH: 0.62 });
  s.addText([{ text: "Market defined: ", options: { bold: true, color: H.navy } }, { text: "guaranteed relief from employed staff plus compliance coordination (counsel-led visas, payroll check, cover bound before travel), London base first; foreign legs only once counsel clears them in writing. Out: placement alone, hourly holiday nannies, corporate EOR." }], { x: 0.6, y: 5.55, w: 12.13, h: 0.6, fontSize: 10.5, color: H.text, margin: 0, isTextBox: true });
  callout(s, "Who decides on a travelling nanny is not yet known — the family office as buyer is a hypothesis to test.");
}
{
  const s = content("3 · Can it win?", "Six forces, looking forward: substitutes and scarce staff hold the power, and the barrier that matters is one we must clear, not one that protects us", SRCFMO + " §2.3; Altrata 2026; Deloitte 2024; UBS 2025; Morgan & Mallet 2025/26; UAE Decree-Law 9/2022. Forces used forward-looking, market size first.");
  table(s, ["Force", "Pressure", "Evidence", "Looking ahead"], [
    ["1 · Size and growth", rate("Unknown"), "UHNW 556,850 → 746,570 by 2030 (Altrata; CALC 6.0% a year); single family offices 8,030 → 10,720 (Deloitte; CALC 4.9% a year). Niche size not found", "Grows with multi-home living; niche must be sized (test T8)"],
    ["2 · Substitutes", rate("High"), "Staff with local work rights plus household payroll (£276–474 a year); in-house hiring; temp desks; clients prefer Western passports", "Cheap substitutes cap the fee"],
    ["3 · Entry barriers", rate("Low threat; high barrier for us"), "Morgan & Mallet already runs EOR in 4 jurisdictions; 72% of family offices hire on trust; unlicensed UAE recruitment means prison", "Any barrier we rent protects no one"],
    ["4 · Buyer power", rate("Medium–high"), "High stakes, a do-it-yourself option, privacy norms; channels own the relationship", "Falls only with references"],
    ["5 · Supplier power", rate("High"), "Rota-ready staff are scarce and clear at a price; NDA premium 15–20%; tenure ~3 years", "Staff pay rises with demand"],
    ["6 · Rivalry", rate("Medium, rising"), "Quay moved into land and sea (Jun 2025); Acquera took Wilsonhalligan (Sep 2026)", "Consolidators with capital arrive"],
  ], { colW: [2.0, 2.2, 5.0, 2.93], fs: 10, rowH: 0.6 });
  callout(s, "Forecast average profitability: low to medium — position, not industry, must carry the case.");
}
{
  const s = content("3 · Can it win?", "Entry funnel: the accessible market is zero today — it opens only when the legal, employer and cover gates pass", SRCFMO + " §2.4–2.5; Deloitte 2024 (single family offices by region; 34% want more third-party providers); Home Office (ODW visas, 2022). Entry definitions per the market-entry framework.");
  const steps = [
    ["Total", "Not found. Proxies: 2,310 single family offices in Europe and the Middle East (CALC, Deloitte); 18–20k UK domestic-worker visas a year", 7.0, H.light, H.text],
    ["Potential", "Not found. Deloitte’s 34% of family offices seeking more third-party providers is a general signal only", 5.8, H.mid, H.white],
    ["Accessible", "0 today: no lawful-route opinion, employer route, insurer or references", 4.6, H.navy, H.white],
    ["Realistic", "0 until the gates pass; pilot 2–3 families, 4–6 positions", 3.4, H.gold, H.text],
  ];
  steps.forEach((st, i) => {
    const y = 1.95 + i * 1.02, w = st[2], x = 0.6 + (7.0 - w) / 2;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 0.9, fill: { color: st[3] }, line: { color: H.bg } });
    s.addText([{ text: st[0] + " · ", options: { bold: true } }, { text: st[1] }], { x: x + 0.12, y, w: w - 0.24, h: 0.9, fontSize: 9.5, color: st[4], margin: 0, valign: "middle", align: "center", isTextBox: true });
  });
  table(s, ["Entry question", "Answer (hypothesis)"], [
    ["1 · Size", "Unmeasured; T8 screens 40+ base-city families"],
    ["2 · Barriers", "Counsel opinion per leg; employer for domestic workers; binding cover; a vouching channel"],
    ["3 · Features vs switching costs", "“Keep your nanny; add guaranteed cover” — the family stays employer"],
    ["4 · Subsegments", "London multi-home families with young children and a travelling worker"],
    ["5 · Path to positive EBIT", "15 positions at £30.6–31.4k per position-year"],
    ["6 · Short-term actions", "Channel first, then the three gates, then interviews"],
  ], { x: 7.85, y: 1.95, w: 4.88, colW: [1.85, 3.03], fs: 9.5, rowH: 0.6 });
  callout(s, "If organic entry fails: partner with Morgan & Mallet or a US payroll firm, or refer clients — never build a thin desk.");
}
{
  const s = content("3 · Can it win?", "Needs vs alternatives: lawful cover from staff who can rotate is the one gap that is both large and partly paid for", SRCFMO + " §3.1–3.3. Importance shown for multi-home families (S1/S2); performance 1–10 per alternative; gap = importance-weighted shortfall vs best alternative. Our assessment.");
  const hd = ["Need", "Imp.", "Agencies", "Temp desks", "Land & sea", "Payroll", "EOR", "In-house", "Yacht mgrs", "Gap S1/S2"];
  const rows = [["N1 Rotation-ready staff, fast", 8, 5, 3, 4, 1, 1, 3, 2, "3 / 3"], ["N2 Continuous cover", 8, 4, 6, 2, 1, 1, 3, 3, "2 / 2"], ["N3 Lawful status on each leg", 7, 4, 1, 2, 1, 2, 3, 3, "3 / 3"], ["N4 One employer and payroll", 7, 6, 1, 1, 4, 3, 2, 4, "1 / 0"], ["N5 Cross-border medical, liability cover", 6, 5, 2, 1, 4, 2, 3, 5, "1 / 1"], ["N6 Portable record", 5, 2, 2, 4, 1, 1, 3, 3, "1 / 1"], ["N7 No exploitation exposure", 7, 4, 3, 3, 3, 3, 3, 4, "3 / 2"], ["N8 Fewer vendors", 7, 5, 3, 3, 5, 3, 4, 3, "2 / 1"], ["N9 Control over who is in the home", 9, 8, 4, 7, 9, 9, 9, 6, "0 / 0"]];
  table(s, hd, rows.map((r) => [r[0], { text: String(r[1]), options: { align: "center", bold: true } }, heat(r[2]), heat(r[3]), heat(r[4]), heat(r[5]), heat(r[6]), heat(r[7]), heat(r[8]), { text: r[9], options: { align: "center", bold: true, color: H.navy } }]), { colW: [3.2, 0.7, 1.05, 1.1, 1.05, 0.95, 0.85, 1.0, 1.05, 1.18], fs: 9.5, rowH: 0.42 });
  callout(s, "Unmet and paid for: lawful status (N3) with rotation supply (N1). Any pool scores below alternatives on control (N9) — a cost families must be paid for.");
}
{
  const s = content("3 · Can it win?", "Rivals: Morgan & Mallet could copy within 12–24 months with a wider wedge — whether it partners or crushes decides the model", SRCFMO + " §2.5, §3.6, §5.4; raw/fmo_competitors.md (Oct 2026). Lead window is an assumption.");
  table(s, ["Rival", "Ability", "Willingness", "Likely move"], [
    ["Morgan & Mallet", rate("High"), "Medium", "Adds relief for its EOR clients once we prove utilisation"],
    ["Quay, Silver Swan, Wilsonhalligan", rate("Medium"), "High on strategy, low on balance sheet", "Partners with an EOR to claim “land and sea”"],
    ["Temp desks (Tiger Private, Randolphs, Greycoat)", rate("Medium"), "Low–medium", "Defend London relief"],
    ["US payroll (TEAM, GTM)", rate("Medium"), "Medium", "Resell through private banks"],
    ["Deel, Remote; yacht managers", rate("High"), "No evidence", "Supplier or enveloper"],
    ["Banks, multi-family offices, Capital One", rate("Medium"), "Unknown", "Envelop through the client relationship"],
  ], { w: 7.4, colW: [2.4, 1.0, 1.7, 2.3], fs: 9.5, rowH: 0.62 });
  const X = 8.25, Y = 2.2, W = 2.2, Hh = 1.75;
  s.addText("Morgan & Mallet: partner or crush?", { x: X, y: 1.85, w: 4.48, h: 0.3, fontSize: 11, bold: true, color: H.navy, margin: 0, isTextBox: true });
  const cells = [["We own the reliever contracts · M&M partners", "M&M refers rota roles it cannot fill — and learns our model", H.light, H.text], ["We own the contracts · M&M crushes", "M&M adds relief; we keep contracts until tenure ends", H.panel, H.text], ["We rent (M&M is our EOR) · M&M partners", "M&M holds contracts and sees clients; margin thin, exit value ~0", H.panel, H.text], ["We rent · M&M crushes", "M&M refuses to be our EOR: no rail. Stop", H.low, H.red]];
  cells.forEach((c, i) => {
    const x = X + (i % 2) * (W + 0.08), y = Y + Math.floor(i / 2) * (Hh + 0.08);
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: W, h: Hh, fill: { color: c[2] }, line: { color: c[2] } });
    s.addText([{ text: c[0], options: { bold: true, color: H.navy, fontSize: 9.5, breakLine: true } }, { text: c[1], options: { color: c[3], fontSize: 9.5 } }], { x: x + 0.1, y: y + 0.08, w: W - 0.2, h: Hh - 0.16, margin: 0, valign: "top", paraSpaceAfter: 3, isTextBox: true });
  });
  callout(s, "Owning the reliever contracts is the only cell that keeps value — renting the employer from a rival leaves nothing.");
}
{
  const s = content("3 · Can it win?", "Competences: every key and base competence is less than favourable today — base gaps must be partnered, and the employer route is a kill gate", SRCFMO + " §4.1 (founder facts from the brief only). Status IV = needed in future, III = under development. Base: must have; Key: differentiating today; Pacing: could differentiate tomorrow.");
  const heads = [["We know how to…", 0.6, 4.6], ["Class", 5.3, 0.75], ["Status", 6.1, 0.65], ["Position", 6.85, 2.2], ["Route to close the gap", 9.15, 3.58]];
  heads.forEach((h) => s.addText(h[0], { x: h[1], y: 1.82, w: h[2], h: 0.28, fontSize: 10, bold: true, color: H.navy, margin: 0, isTextBox: true }));
  s.addShape(pres.shapes.LINE, { x: 0.6, y: 2.12, w: 12.13, h: 0, line: { color: H.navy, width: 1.75 } });
  const rows = [["recruit rotation-ready staff with lawful status for the corridor", "Key", "IV", 1, "Supply partners (Quay class); four languages between us may help"], ["win family offices’ trust without naming clients", "Key", "IV", 1, "A vouching channel and a paid pilot"], ["schedule relief so each reliever is billed on 68%+ of days", "Key", "IV", 1, "Hire an operator; hospitality operations is related"], ["keep rota staff beyond the ~3-year tenure", "Key", "IV", 1, "Steady, benefited contracts"], ["employ one worker lawfully in each corridor jurisdiction", "Base", "IV", 1, "Fatal gap: no EOR partner found yet (T5)"], ["secure lawful work status for each leg", "Base", "IV", 1, "Counsel advises; we coordinate"], ["bind cross-border cover for travelling staff", "Base", "IV", 1, "Broker (T6)"], ["price prepaid household retainers on value", "Base", "III", 2, "Finance and B2B-pricing backgrounds; no evidence vs rivals"], ["issue a vetting record other employers accept", "Pacing", "IV", 1, "CrewPass is the incumbent"]];
  const lab = ["", "Less than favourable", "Competitive average", "Favourable", "Clear leader"];
  rows.forEach((r, i) => {
    const y = 2.2 + i * 0.44;
    s.addText(r[0], { x: 0.6, y, w: 4.6, h: 0.4, fontSize: 10, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    s.addText(r[1], { x: 5.3, y, w: 0.75, h: 0.4, fontSize: 10, color: H.text, margin: 0, valign: "middle", isTextBox: true });
    s.addText(r[2], { x: 6.1, y, w: 0.65, h: 0.4, fontSize: 10, color: H.text, margin: 0, valign: "middle", isTextBox: true });
    for (let k = 1; k <= 4; k++) s.addShape(pres.shapes.OVAL, { x: 6.85 + (k - 1) * 0.26, y: y + 0.12, w: 0.16, h: 0.16, fill: { color: k <= r[3] ? (r[3] === 1 ? H.red : H.navy) : H.bg }, line: { color: r[3] === 1 && k <= r[3] ? H.red : H.navy, width: 0.75 } });
    s.addText(lab[r[3]], { x: 7.95, y, w: 1.2, h: 0.4, fontSize: 8.5, color: r[3] === 1 ? H.red : H.navy, margin: 0, valign: "middle", isTextBox: true });
    s.addText(r[4], { x: 9.15, y, w: 3.58, h: 0.4, fontSize: 9.5, color: H.text, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.LINE, { x: 0.6, y: y + 0.42, w: 12.13, h: 0, line: { color: H.line, width: 0.5 } });
  });
  callout(s, "Time is the hard constraint: 2 founders × 1 hour × 90 days = 180 hours; the plan uses 160.");
}
{
  const s = content("3 · Can it win?", "Ambition and boundaries: one city, three relievers and economic profit by year 3 — never on founders’ cash, never on staff welfare", SRCFMO + " §4.2. Ambition is an assumption; boundaries are a priori choices (Grand Strategy), not a mission statement.");
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.85, w: 12.13, h: 0.7, fill: { color: H.navy }, line: { color: H.navy } });
  s.addText("Ambition (assumption): within 36 months, one city base, 3 relievers covering 15 positions for 7–8 families, economic profit ≥ 0 in year 3. Year 1 is a paid pilot only if the day-90 gates pass.", { x: 0.8, y: 1.85, w: 11.8, h: 0.7, fontSize: 12, bold: true, color: H.white, margin: 0, valign: "middle", isTextBox: true });
  table(s, ["We will", "We will not"], [
    ["Employ staff on steady, benefited contracts", "Treat staff as contractors, or allow work on tourist visas"],
    ["Sell a leg only after a written counsel opinion", "Run a shared UAE bench until counsel clears it (MOHRE acted against 153 employers)"],
    ["Let staff keep passports; log days off; run a hotline", "Hold passports or impose staff non-solicits"],
    ["Let counsel advise on immigration, with us coordinating at cost", "Give tax, immigration or medical advice ourselves"],
    ["Bill in advance where accepted; match client notice to staff contracts", "Put founders’ cash at risk; give 30 days’ notice against 6–12 month staff contracts"],
    ["Buy rails from licensed partners", "Own homes, yachts or aircraft; do placement only; run an hourly marketplace"],
  ], { y: 2.75, colW: [6.0, 6.13], fs: 10.5, rowH: 0.52 });
  callout(s, "Welfare boundaries are not optional: trafficking indicators appear in 40% of post-2012 domestic-worker visa cases (Kalayaan, Jun 2024).");
}
{
  const s = content("3 · Can it win?", "At the wedge, no advantage is sustainable and winner-take-all fails — the bundle around the family’s own people and data is the only path to one", SRCFMO + " §4.3–4.4. Framework: two vehicles to an as-long-as-possible advantage; three winner-take-all conditions (Eisenmann, Parker & Van Alstyne, HBR 2006).");
  table(s, ["Source", "Vehicle", "Sustainable?"], [
    ["Reliever contracts in one city", "Pre-emption (small market)", { text: "No: any corridor above ~12 positions supports several benches", options: { color: H.red } }],
    ["Reference families", "Pre-emption (reputation)", { text: "Weak: in an NDA market, clients cannot be named", options: { color: H.red } }],
    ["Compliance coordination", "Capability", { text: "No: Morgan & Mallet already sells it", options: { color: H.red } }],
    ["Staff-owned record", "None", { text: "No: portability lowers staff switching costs", options: { color: H.red } }],
    ["Passport diversity", "None", { text: "No: clients prefer Western passports", options: { color: H.red } }],
  ], { w: 6.6, colW: [2.2, 1.9, 2.5], fs: 10, rowH: 0.62 });
  s.addText("Network test", { x: 7.45, y: 1.85, w: 5.28, h: 0.3, fontSize: 12, bold: true, color: H.navy, margin: 0, isTextBox: true });
  table(s, ["Condition", "Holds?"], [
    ["Type", "Staffing model with pooling economies; only the record is two-sided"],
    ["High multi-homing cost", { text: "No: cheap once a contract ends", options: { color: H.red } }],
    ["Strong positive network effects", { text: "No: weak cross-side; negative same-side at shared peaks", options: { color: H.red } }],
    ["Limited demand for differentiation", { text: "No: control over who is in the home (N9) differs by family", options: { color: H.red } }],
  ], { x: 7.45, y: 2.2, w: 5.28, colW: [2.0, 3.28], fs: 10, rowH: 0.62 });
  callout(s, "So economic profit must turn positive inside the lead window — speed and a time-limited plan, not a moat.");
}
{
  const s = content("3 · Can it win?", "Strategic position: every option sits in weak-to-tenable — only the relief club with compliance is worth a gated, opportunistic test", SRCFMO + " §4.5. Scored criteria: attractiveness = size 20%, growth 10%, WTP 25%, rivalry 20%, ease/risk/capital 25%; position = must-haves 35%, gap 40%, cost to serve 25%. Diamonds = not launched; size = year-3 net fee (assumption).");
  const X0 = 1.5, Y0 = 1.95, W = 6.9, Hh = 4.1;
  const px = (v) => X0 + ((v - 0.8) / 2.9) * W, py = (v) => Y0 + Hh - ((v - 2.2) / 0.8) * Hh;
  s.addShape(pres.shapes.RECTANGLE, { x: X0, y: Y0, w: W, h: Hh, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  [[2.0, "Tenable"], [2.7, "Favourable"], [3.5, "Strong"]].forEach((t) => {
    s.addShape(pres.shapes.LINE, { x: px(t[0]), y: Y0, w: 0, h: Hh, line: { color: H.line, width: 0.75, dashType: "dash" } });
    s.addText(t[1], { x: px(t[0]) + 0.05, y: Y0 + Hh + 0.02, w: 1.2, h: 0.25, fontSize: 9, color: H.muted, margin: 0, isTextBox: true });
  });
  s.addText("Weak", { x: X0 + 0.05, y: Y0 + Hh + 0.02, w: 1.0, h: 0.25, fontSize: 9, color: H.muted, margin: 0, isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: X0, y: py(2.5), w: W, h: 0, line: { color: H.line, width: 0.75, dashType: "dash" } });
  s.addText("Medium", { x: 0.55, y: py(2.5) - 0.32, w: 0.9, h: 0.25, fontSize: 9, color: H.muted, align: "right", margin: 0, isTextBox: true });
  s.addText("Low", { x: 0.55, y: py(2.5) + 0.08, w: 0.9, h: 0.25, fontSize: 9, color: H.muted, align: "right", margin: 0, isTextBox: true });
  s.addText("Attractiveness ↑ · Position →", { x: X0, y: Y0 + Hh + 0.27, w: W, h: 0.25, fontSize: 9.5, bold: true, color: H.muted, align: "center", margin: 0, isTextBox: true });
  const pts = [["O1", 1.40, 2.50, 0.75, H.navy], ["O2", 1.35, 2.35, 0.3, H.low, H.red], ["O3", 2.00, 2.55, 0.42, H.mid], ["O4", 1.00, 2.55, 0.3, H.low, H.red], ["O5", 2.00, 2.60, 0.3, H.light, H.navy], ["O6", 1.90, 2.75, 0.36, H.light, H.navy]];
  pts.forEach((p) => diamond(s, px(p[1]) + (p[0] === "O5" ? 0.45 : 0), py(p[2]), p[3], p[4], p[0], p[5]));
  s.addText("Axes zoomed to the scored range: attractiveness 2.2–3.0, position 0.8–3.7", { x: X0 + 0.1, y: Y0 + 0.08, w: 5.0, h: 0.25, fontSize: 9, italic: true, color: H.muted, margin: 0, isTextBox: true });
  const leg = [["O1", "London relief club + compliance", "2.50 / 1.40 · £465k · Opportunistic, gated"], ["O2", "Standalone relief bench", "2.35 / 1.35 · Disinvest: temps are cheaper"], ["O3", "Compliance desk only", "2.55 / 2.00 · £52k · Only as the door into O1"], ["O4", "Chefs and crew, land and sea", "2.55 / 1.00 · Disinvest for now"], ["O5", "Portable staff record", "2.60 / 2.00 · Free staff benefit"], ["O6", "Day-count ledger", "2.75 / 1.90 · £30k · Later"]];
  leg.forEach((l, i) => s.addText([{ text: l[0] + "  " + l[1], options: { bold: true, color: H.navy, breakLine: true } }, { text: l[2], options: { color: H.text } }], { x: 8.75, y: 1.9 + i * 0.7, w: 3.98, h: 0.65, fontSize: 10, margin: 0, valign: "top", isTextBox: true }));
  callout(s, "Disinvest from the standalone bench and land-and-sea crews; keep compliance only as the door into the relief club.");
}

// ---------- CHAPTER 4 ----------
section("4 · Does it pay?");
{
  const s = content("4 · Does it pay?", "Families pay staff and agencies, not intermediaries — so measurable value goes on a value map, and intangibles go to trade-off interviews", SRCFMO + " §5.1–5.2; Morgan & Mallet 2025/26; fee schedules (2025–26); Nannytax and Deel/Remote pricing (2026-10-06); UAE Decree-Law 9/2022.");
  table(s, ["What families already pay", "Figure"], [
    ["Travelling-nanny pay", "UK £55–110k; US US$70–150k"],
    ["Travel premium to staff", "25–40% over base"],
    ["Placement fees", "Nannies 10–20%; 20% UK, 25% overseas"],
    ["London temp nanny", "£300–400 a day (one ad; weak)"],
    ["Household payroll", "£276–474 a year (Nannytax)"],
    ["Corporate EOR", "US$599–699 a month (Deel, Remote)"],
    ["Cost of failure (UAE)", "AED 50–200k fine (CALC US$13.6–54.5k)"],
  ], { w: 6.0, colW: [2.8, 3.2], fs: 10.5, rowH: 0.52 });
  table(s, ["Benefit or drawback", "Method"], [
    ["Relief and payroll avoided; assistant hours", "Value map"],
    ["Penalty avoided", "Value map, only if the family’s alternative is non-compliant"],
    ["Guarantee, continuity, lawful status (+); control loss, entrant risk, privacy (−)", "Trade-Off Method"],
    ["Direct questions (Van Westendorp, Gabor-Granger)", { text: "Excluded: biased, over-predict", options: { color: H.red } }],
    ["Cost-plus pricing", { text: "Rejected: death spiral; price at MR = MC", options: { color: H.red } }],
  ], { x: 6.85, w: 5.88, colW: [3.4, 2.48], fs: 10, rowH: 0.62 });
  callout(s, "No recurring intermediary fee was found anywhere — families pay staff, and agencies once.");
}
{
  const s = content("4 · Does it pay?", "Value map: our floor sits £7.6–13.9k above the family’s alternative per position-year — only intangible value can close the gap", SRCFMO + " §5.3 (CALC, £ per position-year, 5 positions per reliever). Ceiling = next best alternative + measurable differences; floor = marginal cost incl. cost of capital on the payroll float. Assistant hours are an assumption. Priced on London rates, the only market with sourced staff prices; Wave-1 rates are measured in the 90-day tests.");
  const unit = 0.215, x0 = 3.3;
  const bars = [["Next best alternative", "30 temp days × £300–400", 0, 10.5, "9.0–12.0k", H.light, H.text], ["+ Assistant hours saved", "100 h × £25–50 (assumption)", 10.5, 3.75, "2.5–5.0k", H.mid, H.white], ["= Measurable ceiling", "What we can prove today", 0, 14.25, "11.5–17.0k", H.navy, H.white], ["Our floor (marginal cost)", "Reliever pay, EOR, recruiting, servicing, capital", 0, 25.0, "24.6–25.4k", H.gold, H.text], ["Wedge before intangibles", "Ceiling minus floor", 14.25, 10.75, "−7.6 to −13.9k", H.low, H.red], ["Break-even fee, year 3", "15 positions, £90k fixed costs", 0, 31.0, "30.6–31.4k", "8FA6C9", H.text]];
  bars.forEach((b, i) => {
    const y = 1.95 + i * 0.68;
    s.addText([{ text: b[0], options: { bold: true, color: H.navy, breakLine: true } }, { text: b[1], options: { fontSize: 8.5, color: H.muted } }], { x: 0.6, y, w: 2.6, h: 0.58, fontSize: 10.5, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.RECTANGLE, { x: x0 + b[2] * unit, y: y + 0.08, w: b[3] * unit, h: 0.42, fill: { color: b[5] }, line: { color: b[5] } });
    s.addText(b[4], { x: x0 + b[2] * unit + 0.05, y: y + 0.08, w: Math.max(b[3] * unit - 0.1, 1.2), h: 0.42, fontSize: 10, bold: true, color: b[6], margin: 0, valign: "middle", isTextBox: true });
  });
  card(s, 10.2, 1.95, 2.53, 3.95, "What must be true", "Families must value guaranteed, lawful cover — net of the control they give up and the risk of a new entrant — at £13.6–19.9k or more per position-year.\n\nThat is about what they already pay staff to travel (£16.5–23.6k, CALC).", { hs: 12, fs: 10.5, dark: true });
  callout(s, "Each extra relief day widens the gap: our day costs £475–479 before idle time, against £300–400 for a temp.");
}
{
  const s = content("4 · Does it pay?", "Economic profit needs ~£31k per position-year at 15 positions — and the pilot year loses money at any fee below ~£36k", SRCFMO + " §5.3–5.5 (CALC). EVA = NOPAT − WACC × invested capital; fixed costs £90k a year (assumption); WACC 12% (assumption); billed in arrears (base case). Priced on London rates, the only market with sourced staff prices; Wave-1 rates are measured in the 90-day tests.");
  const unit = 0.15, x0 = 3.6;
  const bars = [["Floor · 4 positions per reliever", 30.6, "30.1–31.1k", H.light], ["Floor · 5 positions per reliever", 25.0, "24.6–25.4k", H.light], ["Floor · 6 positions per reliever", 21.3, "21.0–21.6k", H.light], ["Break-even fee · pilot (6 positions)", 36.3, "36.0–36.6k", H.navy], ["Break-even fee · year 3 (15 positions)", 31.0, "30.6–31.4k", H.navy], ["Measurable ceiling (family)", 14.25, "11.5–17.0k", H.gold]];
  bars.forEach((b, i) => {
    const y = 1.95 + i * 0.6;
    s.addText(b[0], { x: 0.6, y, w: 2.95, h: 0.5, fontSize: 10.5, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.RECTANGLE, { x: x0, y: y + 0.07, w: b[1] * unit, h: 0.36, fill: { color: b[3] }, line: { color: b[3] } });
    s.addText("£" + b[2], { x: x0 + b[1] * unit + 0.08, y, w: 1.25, h: 0.5, fontSize: 10, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
  });
  s.addShape(pres.shapes.LINE, { x: x0 + 25 * unit, y: 1.9, w: 0, h: 3.7, line: { color: H.red, width: 1.25, dashType: "dash" } });
  s.addText("A £25k fee", { x: x0 + 25 * unit - 0.6, y: 5.6, w: 1.2, h: 0.25, fontSize: 9, bold: true, color: H.red, align: "center", margin: 0, isTextBox: true });
  card(s, 10.45, 1.95, 2.28, 3.9, "At a £25k fee", "Pilot EBIT: −£65.7k to −£69.4k.\nYear-3 EBIT: −£84.4k to −£95.4k.\n\nAt £35k in year 3: EBIT £54.6k, EVA ≈ £38k — needs intangible value of £18–23.5k.\n\nNotice gap risk: up to £41,250 stranded per worker on a 6-month contract.", { hs: 12, fs: 10, dark: true });
  callout(s, "Billing in advance cuts invested capital but does not change the sign — only measured value can.");
}
{
  const s = content("4 · Does it pay?", "Economics checks: the pricing logic holds, but entry dynamics and founders’ unpriced time make the case tighter, not looser", "research/methods_addendum.md (21 econ checks from the marginal-analysis and perfect-competition course materials) applied to " + SRCFMO + ". Verdicts are our review.");
  const ok = (t) => ({ text: t, options: { bold: true, color: H.navy } }), part = (t) => ({ text: t, options: { bold: true, color: H.goldDk } }), bad = (t) => ({ text: t, options: { bold: true, color: H.red } });
  table(s, ["Check", "Verdict", "What it means here"], [
    ["Price at MR = MC; no cost-plus", ok("Pass"), "Launch fee set on the trade-off demand curve; fixed costs only decide whether economic profit is positive"],
    ["Floor is marginal, not average, cost", ok("Pass"), "Floor = reliever pay, EOR, recruiting, servicing, capital on float, per position"],
    ["Sunk costs out of forward decisions", ok("Pass"), "Pre-launch counsel and insurance treated as invested capital, not as a reason to continue"],
    ["Economic profit, not accounting profit", part("Partial"), "Cost of capital included; founders’ ~180 hours are not priced at market pay — economic profit is overstated"],
    ["Will entry compete profits away?", bad("Yes"), "Morgan & Mallet has a wider wedge; a 12–24 month lead at best"],
    ["Price-taking segments", part("Partial"), "London temp relief behaves close to price-taking (many desks): normal returns only"],
    ["Customer opportunity cost caps price", ok("Pass"), "Ceiling built on the family’s next best alternative and a buyout cap of £4.1–6.9k a year"],
    ["Short-run shutdown vs long-run exit", part("Partial"), "Pilot losses are an entry cost; exit if measured value keeps price below average cost at contract renewal"],
  ], { colW: [3.3, 1.2, 7.63], fs: 10, rowH: 0.5 });
  callout(s, "The economics confirm the verdict: the case stands or falls on measured intangible value, inside a short window.");
}
{
  const s = content("4 · Does it pay?", "If families value the guarantee, the price is a membership per position-year: a base, fenced premiums and discounts paid for by what clients give us", SRCFMO + " §5.6 and §6 (value metric, two-part pricing, bundling test, peak-load, value-added services rule, two-way menu). Figures CALC or assumptions.");
  const col = (x, w, head, items, fill, hc, tc) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.9, w, h: 4.25, fill: { color: fill }, line: { color: fill } });
    s.addText(head, { x: x + 0.15, y: 1.98, w: w - 0.3, h: 0.4, fontSize: 13, bold: true, color: hc, margin: 0, isTextBox: true });
    s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })), { x: x + 0.15, y: 2.45, w: w - 0.3, h: 3.6, fontSize: 10.5, color: tc, margin: 0, valign: "top", paraSpaceAfter: 5, isTextBox: true });
  };
  col(0.6, 3.9, "Base (break-even £30.6–31.4k)", ["Planned relief from an employed reliever", "Replacement guarantee on agency terms", "Compliance coordination: counsel-led visas, payroll check, cover before travel", "Staff-owned record", "Client notice matched to staff contracts"], H.navy, H.gold, H.white);
  col(4.62, 3.9, "Premiums (fenced tiers)", ["Response time: 7 days / 72 h / 24 h", "Dedicated or shared reliever", "Rush relief from £300–400 a day + travel", "Extra jurisdiction: counsel at cost + EOR seat US$599–699 a month + visa", "Peak premium if family peaks coincide"], H.panel, H.navy, H.text);
  col(8.64, 4.09, "Discounts (below the saving)", ["12-month calendar, ±7-day window: < £3,671–3,793", "90 days’ notice: < avoided rush cost", "Monthly billing in advance: < £297", "Multi-year, matched notice: < £990", "Referral: < acquisition cost avoided"], H.light, H.navy, H.text);
  callout(s, "Two-part logic: the membership captures surplus and pre-funds the reliever; usage is charged at incremental cost only.");
}

// ---------- CHAPTER 5 ----------
section("5 · What we do");
{
  const s = content("4 · Does it pay?", "Platform monetization: a household membership, a take rate on bookings and a fee per staff position — each module priced on its own value", "Benchmarks: platform fees 16–18% (Airbnb host-only; Booking.com Preferred from Jul 2026); advisor commissions ~10–12%; agency fees 15–25%. Trip size is an ASSUMPTION from the earlier deck’s reference trip (€24,300 for 8 nights, family of four, Rome). Merchant-model and care prices from our earlier Southern Italy model (Signature journey, family of four, 10 nights).");
  table(s, ["Revenue line", "Value metric", "Level (to be measured)", "Mechanism"], [
    ["Household membership", "Per family per year", "Fixed fee capturing surplus; set by trade-off interviews", "Two-part pricing: fixed fee"],
    ["Bookings (design, stays, access)", "% of booking value, paid by suppliers", "10–15% (assumption), below platforms’ 16–30%", "Usage fee near marginal cost of service"],
    ["Or: journeys at one price", "Markup on supplier net cost", "30% on net cost, VAT on the margin only (74-ter); ~17% contribution, client pays ~12% more than booking alone", "Merchant model: test against the take rate"],
    ["Staff + compliance", "Per position-year", "Break-even £30.6–31.4k at 15 positions (CALC); local care from €221–247 a day", "Premiums and discounts per the services rule"],
    ["Data + trust", "Included at first", "Free to staff; priced later to banks, offices, towns and hotels", "Subsidy side until used"],
  ], { colW: [2.6, 2.6, 3.9, 3.03], fs: 9.5, rowH: 0.5 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 5.15, w: 12.13, h: 1.0, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  s.addText([{ text: "Illustration (assumptions): ", options: { bold: true, color: H.navy } }, { text: "one €24,300 Rome family trip at a 10–15% take = €2.4–3.6k per trip (CALC). Bundle only if relative willingness to pay reverses across segments (family offices value compliance, principals value access); otherwise sell the base plus options. Peak-load: Italy Apr–Oct and Santa Catarina Dec–Mar fill the same staff and the same calendar." }], { x: 0.8, y: 5.15, w: 11.8, h: 1.0, fontSize: 10, color: H.text, margin: 0, valign: "middle", isTextBox: true });
  callout(s, "Revenue per family rises with each module — but only after the staff wedge proves it pays on its own.");
}
{
  const s = content("5 · What we do", "Trade-off interviews: ten indifference questions price the guarantee, the control families give up and the staff’s reservation wage", SRCFMO + " §7. Protocol: easy opener; the respondent’s best alternative and its cost; the respondent states X (never anchored); iterate to catch non-linearity; face to face or assisted video. No direct willingness-to-pay questions.");
  const qs = [["Family · opener", "Your nanny with today’s uncovered weeks vs your nanny plus a named second carer you have met. X = annual amount added to B that makes them equal."], ["Family", "You pick each relief person vs we assign from a vetted pool after an introduction. X = fee reduction for the control lost."], ["Family", "Best-effort temp desk vs cover guaranteed within 72 h. X = fee difference; iterate at 24 h and 7 days."], ["Family", "You employ and hire counsel per trip vs our partner employs on every leg. X = fee difference."], ["Family", "Visa-free passports only, with a search of W weeks, vs a wider pool with visas handled. X = W, in money."], ["Family", "Pay on success vs monthly in advance plus a deposit. X = fee reduction that makes B acceptable."], ["Family", "Pay yearly for the worker vs buy them out after year 1. X = buyout amount."], ["Family", "Relief guaranteed except July–August and holidays vs all year. X = fee difference (peak value)."], ["Staff", "Permanent job with one family vs employed rotation, paid between assignments. X = pay in B."], ["Staff", "Current non-travel role vs 6 months of rota work abroad. X = extra pay; iterate at 3 and 9 months."]];
  qs.forEach((q, i) => {
    const c = i % 2, r = Math.floor(i / 2), x = 0.6 + c * 6.12, y = 1.85 + r * 0.87;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 6.0, h: 0.8, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
    s.addText([{ text: (i + 1) + " · " + q[0], options: { bold: true, color: H.navy, breakLine: true } }, { text: q[1] }], { x: x + 0.12, y: y + 0.04, w: 5.76, h: 0.72, fontSize: 9.5, color: H.text, margin: 0, valign: "top", isTextBox: true });
  });
  callout(s, "Sample: 12 family-side respondents, 10 staff, 5 agencies — output is the demand curve, the launch fee at MR = MC and the USP.");
}
{
  const s = content("5 · What we do", "Operational strategy: nine tests in 90 days and ~160 hours — kill gates first, no capital at risk", SRCFMO + " §9. Dark bars = gates that decide GO. Pass marks for T1 and T2 derived from the economics; others are assumptions.");
  const T0 = 4.55, TW = 4.3, dx = (d) => T0 + (d / 90) * TW;
  s.addText("Test", { x: 0.6, y: 1.82, w: 3.8, h: 0.28, fontSize: 10, bold: true, color: H.navy, margin: 0, isTextBox: true });
  s.addText("Pass mark", { x: 9.35, y: 1.82, w: 3.38, h: 0.28, fontSize: 10, bold: true, color: H.navy, margin: 0, isTextBox: true });
  [0, 30, 60, 90].forEach((d) => s.addText("Day " + d, { x: dx(d) - 0.35, y: 1.82, w: 0.7, h: 0.28, fontSize: 9, bold: true, color: H.navy, align: "center", margin: 0, isTextBox: true }));
  s.addShape(pres.shapes.LINE, { x: 0.6, y: 2.12, w: 12.13, h: 0, line: { color: H.navy, width: 1.75 } });
  [30, 60].forEach((d) => s.addShape(pres.shapes.LINE, { x: dx(d), y: 2.15, w: 0, h: 3.95, line: { color: H.line, width: 0.75, dashType: "dash" } }));
  s.addShape(pres.shapes.LINE, { x: dx(90), y: 2.15, w: 0, h: 3.95, line: { color: H.gold, width: 2.25 } });
  const rows = [["T7 Channel", "A private bank, multi-family office or directory", 1, 30, "5+ qualified introductions; vouches without naming clients", 0], ["T8 Sizing screen", "Through the channel", 1, 45, "40+ base-city families with a travelling worker", 0], ["T4 Lawful route · kill gate", "Counsel opinion", 1, 45, "One reliever may work across UK households; ≥ 1 foreign leg cleared", 1], ["T5 Employer · kill gate", "Deel, Remote, TEAM, GTM, M&M; own entity", 1, 45, "UK employer route for domestic workers ≤ US$699 a month", 1], ["T6 Cover", "Broker", 20, 60, "Binding liability and trip-medical quote within budget", 1], ["T9 Agencies", "5 interviews + mystery-shop", 10, 60, "3 of 5 report unfilled rota or relief requests", 0], ["T1 Family trade-off interviews", "n = 12", 20, 70, "Median value ≥ £13.6k; 1 in 3 ≥ £19.9k per position-year", 1], ["T3 Staff interviews + vetting", "n = 10", 20, 70, "10 vetted staff; reservation pay ≤ assumption", 0], ["T2 Paid commitment", "Term sheet", 70, 90, "2+ paid pilots, deposits cover the cash outlay", 1]];
  rows.forEach((r, i) => {
    const y = 2.2 + i * 0.435;
    s.addText([{ text: r[0], options: { bold: true, color: H.navy, breakLine: true } }, { text: r[1], options: { color: H.muted, fontSize: 8.5 } }], { x: 0.6, y, w: 3.85, h: 0.42, fontSize: 9.5, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: dx(r[2]), y: y + 0.11, w: dx(r[3]) - dx(r[2]), h: 0.2, rectRadius: 0.05, fill: { color: r[5] ? H.navy : H.mid }, line: { color: r[5] ? H.navy : H.mid } });
    s.addText(r[4], { x: 9.35, y, w: 3.38, h: 0.42, fontSize: 9.5, color: H.text, margin: 0, valign: "middle", isTextBox: true });
  });
  callout(s, "GO only if T4, T5, T6, T1 and T2 pass, two of the other four pass, and economic profit at the measured value is ≥ 0 by month 36.");
}
{
  const s = content("5 · What we do", "Decision rule: build only if the gates pass and measured value turns economic profit positive — otherwise stop, or refer clients to incumbents", SRCFMO + " §9 (GO / NO-GO) and §8 (staged roadmap).");
  const box = (x, y, w, h, t, f, c, fs) => { s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: f }, line: { color: f } }); s.addText(t, { x: x + 0.1, y, w: w - 0.2, h, fontSize: fs || 11, bold: true, color: c, align: "center", valign: "middle", margin: 0, isTextBox: true }); };
  const arrow = (x, y, w) => s.addShape(pres.shapes.LINE, { x, y, w, h: 0, line: { color: H.navy, width: 1.5, endArrowType: "triangle" } });
  box(0.6, 3.3, 2.2, 1.0, "Day 90 results", H.navy, H.white);
  arrow(2.8, 3.8, 0.45);
  box(3.25, 1.95, 2.9, 1.0, "T4 or T5 fails\n(no lawful or employer route)", H.low, H.red, 10.5);
  box(3.25, 3.3, 2.9, 1.0, "Only compliance value clears its floor", H.light, H.navy, 10.5);
  box(3.25, 4.65, 2.9, 1.0, "All gates pass and economic profit ≥ 0 by month 36", H.mid, H.white, 10.5);
  s.addShape(pres.shapes.LINE, { x: 3.02, y: 2.45, w: 0, h: 2.7, line: { color: H.navy, width: 1.5 } });
  arrow(3.02, 2.45, 0.23); arrow(3.02, 5.15, 0.23);
  arrow(6.15, 2.45, 0.5); arrow(6.15, 3.8, 0.5); arrow(6.15, 5.15, 0.5);
  box(6.65, 1.95, 6.08, 1.0, "STOP — no capital lost; keep the research and the map", H.low, H.red, 11);
  box(6.65, 3.3, 6.08, 1.0, "REFER clients to Morgan & Mallet or agencies — do not build a thin desk a rival already sells", H.light, H.navy, 11);
  box(6.65, 4.65, 6.08, 1.0, "GO — Stage 1 paid pilot: 1 reliever, 4–6 positions, deposits cover the cash outlay", H.navy, H.white, 11);
  callout(s, "Any other failure: stop. The next candidates on the map are ready (page after next).");
}
{
  const s = content("5 · What we do", "Risks: a missing employer route and buyout disintermediation sit at high likelihood and high impact", SRCFMO + " §10. Likelihood and impact are our assessment.");
  const X0 = 1.3, Y0 = 2.0, cw = 1.55, ch = 1.9;
  const cols = ["Medium", "Medium–high", "High"], rowsL = ["High", "Medium–high"];
  for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) {
    const sev = a + (1 - b); const f = sev >= 3 ? "C9D5EA" : sev === 2 ? "E3E9F3" : H.panel;
    s.addShape(pres.shapes.RECTANGLE, { x: X0 + a * cw, y: Y0 + b * ch, w: cw, h: ch, fill: { color: f }, line: { color: H.white, width: 2 } });
  }
  cols.forEach((t, i) => s.addText(t, { x: X0 + i * cw, y: Y0 + 2 * ch + 0.04, w: cw, h: 0.25, fontSize: 9, color: H.muted, align: "center", margin: 0, isTextBox: true }));
  rowsL.forEach((t, i) => s.addText(t, { x: 0.4, y: Y0 + i * ch + ch / 2 - 0.13, w: 0.85, h: 0.26, fontSize: 9, color: H.muted, align: "right", margin: 0, isTextBox: true }));
  s.addText("Likelihood →", { x: X0, y: Y0 + 2 * ch + 0.28, w: 3 * cw, h: 0.25, fontSize: 9.5, bold: true, color: H.muted, align: "center", margin: 0, isTextBox: true });
  s.addText("Impact ↑", { x: 0.45, y: Y0 - 0.3, w: 1.2, h: 0.26, fontSize: 9.5, bold: true, color: H.muted, margin: 0, isTextBox: true });
  const cell = { 1: [2, 0], 8: [2, 0], 2: [1, 0], 4: [1, 0], 9: [1, 0], 3: [0, 0], 5: [0, 0], 6: [0, 0], 10: [0, 0], 7: [2, 1], 11: [2, 1], 12: [0, 1] };
  const cnt = {};
  Object.keys(cell).forEach((k) => {
    const c = cell[k], key = c.join(","); cnt[key] = (cnt[key] || 0); const n = cnt[key]++;
    const cx = X0 + c[0] * cw + 0.4 + (n % 2) * 0.72, cy = Y0 + c[1] * ch + 0.45 + Math.floor(n / 2) * 0.62;
    num(s, cx, cy, 0.42, k, +k === 1 || +k === 8 ? H.goldDk : H.navy);
  });
  const rs = [["No EOR for domestic workers", "T5; own entity"], ["No lawful route for foreign legs", "T4; London base"], ["UAE swap fines", "No UAE bench"], ["Modern slavery and welfare", "Own passports, logged days, hotline"], ["Joint employment or misclassification", "T4 reviews the structure"], ["Notice gap (£41k per worker)", "Matched notice"], ["Supply priced up", "T3 measures reservation pay"], ["Disintermediation (buyout £4.1–6.9k a year)", "Value-based buyout fee"], ["Morgan & Mallet imitation", "Speed; time-limited plan"], ["Privacy breach (US$1.2m average)", "Data minimisation"], ["Concentration (2–3 families)", "Deposits; no family > 40%"], ["Channel envelopment", "Non-circumvention terms"]];
  rs.forEach((r, i) => {
    const y = 1.88 + i * 0.355;
    num(s, 6.6, y + 0.17, 0.28, i + 1, i === 0 || i === 7 ? H.goldDk : H.navy);
    s.addText([{ text: r[0] + "  ", options: { bold: true, color: H.navy } }, { text: r[1], options: { color: H.text } }], { x: 6.85, y, w: 5.88, h: 0.34, fontSize: 9.5, margin: 0, valign: "middle", isTextBox: true });
  });
  callout(s, "Risks 1 and 8 (gold) decide the business; T5 and the buyout fee address them first.");
}
{
  const s = content("5 · What we do", "Partners rent us the rails; if the guarantee fails its test, the next candidates on the map are health continuity, counterparty assurance and the residency ledger", SRCFMO + " §11; research/opportunity_map.md. Partner names are candidates, not agreements.");
  table(s, ["Role", "Candidates", "Condition"], [
    ["Employer of record", "Deel, Remote (US$599–699 a month); TEAM, GTM (US)", "Domestic-worker cover not found (T5)"],
    ["Insurance", "A broker; Nannytax’s insurer and GTM’s health partner as anchors", "Cross-border quote not found (T6)"],
    ["Immigration", "Counsel in each country; a licensed UAE recruiter", "Counsel advises; we coordinate"],
    ["Vetting", "Checkr, Sterling; CrewPass", "Acceptance tested in T9"],
    ["Supply", "Quay, Silver Swan, Wilsonhalligan; temp desks for overflow", "Rivals; no exclusivity"],
    ["Distribution", "Family-office directories, private banks, multi-family offices", "The channel may own the client"],
  ], { w: 7.6, colW: [1.8, 3.3, 2.5], fs: 9.5, rowH: 0.62 });
  card(s, 8.45, 1.85, 4.28, 4.3, "Fallback candidates (scores /25)", "Post-retreat health continuity · 19\nPhysician-led year at home after any longevity clinic; retreats €7–40k a week.\n\nCounterparty assurance · 19\nSolvency standard + insured deposits for private travel; OneFlight put ~US$150M at risk (Sep 2026).\n\nResidency day-count ledger · 18\nAdviser-signed day counts; lowest capital; data moat.", { hs: 12, fs: 10, dark: true });
  callout(s, "Each fallback gets the same chain — novelty, strategy and pricing, economics — before any build.");
}
{
  const s = content("5 · What we do", "Wave-1 supply partners are named for every module — all prospects, one warm marina channel; a free shoot buys net rates", "Our earlier target lists for Rome, Southern Italy and Santa Catarina, and our Southern Italy supplier, partnership and pricing sheets (Sep 2026). Prospects, not agreements; verify licences, prices and MICHELIN stars before contracting.");
  table(s, ["Module", "Rome", "Southern Italy", "Santa Catarina"], [
    ["Stays", "Hotel de la Ville · Hotel Hassler · Six Senses Rome · Bulgari Hotel Roma", "Le Sirenuse · Il San Pietro di Positano · Monastero Santa Rosa · Capri Palace · Punta Tragara · direct villa owners", "Awasi Santa Catarina (Relais & Châteaux) · pousadas at Praia do Rosa · Jurerê houses"],
    ["Access + dining", "Vatican before opening · Colosseum underground · palazzo dinners · La Pergola · Imàgo · Il Pagliaccio", "Pompeii archaeological park (early access) · Don Alfonso 1890 · Torre del Saracino · Zass · L’Olivo · George", "P12 Parador Internacional · Café de la Musique · whale watching at Praia do Rosa (Jul–Nov) · sailing the bay"],
    ["Mobility", "Licensed NCC chauffeurs · a helicopter to the Amalfi Coast", "Muto Travel NCC · Hoverfly (Naples–Capri from ~€1,900) · Amalfi Coast Dream (yacht days from ~€4,500) · D-Marin marinas (warm contact)", "Chauffeurs · boats · a helicopter"],
    ["Local care + chefs", "To source, same vetting standard", "Amalfi Sitters · International Sitters · licensed home-care agencies · Take a Chef (client price: nanny €247, companion €221 a day)", "To source, same vetting standard"],
  ], { colW: [1.6, 3.25, 4.18, 3.1], fs: 9.5, rowH: 0.74 });
  s.addText([{ text: "Across regions — ", options: { bold: true, color: H.navy } }, { text: "insurance and insolvency cover: Europ Assistance, Allianz Partners, AXA Partners, an organiser guarantee fund · demand: Virtuoso and Traveller Made advisors and private banks on a 10% referral; Brazilian, US and Gulf creators on hosted trips" }], { x: 0.6, y: 5.62, w: 12.13, h: 0.6, fontSize: 10, color: H.text, margin: 0, valign: "middle", isTextBox: true });
  callout(s, "The hook for every supplier: free content and guests who spend, for net rates or 10–15% and Privileges — paid only on completed stays.");
}
{
  const s = content("For discussion", "Questions for discussion", null);
  const qs = ["Which Wave-1 region do you lead, and which of the named targets (page 38) would sign first?", "Among the families you know, who decides on household staff that travel — the principal, an assistant or the family office?", "Could you open one vouching channel — a private bank, multi-family office or directory?", "Do you know employment or immigration counsel who could give the lawful-route opinion (kill gate T4)?", "Do we commit ~160 hours over 90 days to the tests, with GO region by region only if the gates pass?"];
  qs.forEach((q, i) => {
    const y = 1.95 + i * 0.82;
    s.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.05, w: 0.55, h: 0.55, fill: { color: H.navy }, line: { color: H.navy } });
    s.addText(String(i + 1), { x: 0.6, y: y + 0.05, w: 0.55, h: 0.55, fontSize: 16, bold: true, color: H.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(q, { x: 1.4, y, w: 11.3, h: 0.65, fontSize: 14, color: H.text, margin: 0, valign: "middle", isTextBox: true });
  });
  s.addText("Calebe Garcia · algar.calebe@gmail.com · +1 617 949 6729", { x: 0.6, y: 6.4, w: 12.13, h: 0.4, fontSize: 12, color: H.muted, margin: 0, isTextBox: true });
}
// ---------- APPENDIX ----------
section("Appendix");
{
  const s = content("Appendix", "The name and the crest", "Treccani and Villa Farnesina (Accademia dei Lincei) on Agostino Chigi; Cicero, Pro Sestio 98. Crests: our own designs, adapted from the Chigi arms.");
  s.addImage({ path: CREST2, x: 0.6, y: 1.85, w: 4.3, h: 4.3 });
  const b = [["Agostino Chigi, ‘il Magnifico’", "Siena 1466 – Rome 1520. Banker to popes Alexander VI and Julius II and holder of the papal alum monopoly: one of the richest men of his age."], ["A villa built for otium", "His villa on the Tiber, built by Peruzzi from 1506 and frescoed by Raphael, is today the Villa Farnesina."], ["Otium cum dignitate", "Romans set negotium, business (‘not-leisure’), against otium: dignified, productive time for thought, the arts and nature. Cicero’s phrase, in the Pro Sestio, names the leisure earned by those who serve."], ["Why it fits", "Our families live in negotium. We keep the people and the paperwork behind their otium running, wherever they are."]];
  b.forEach((t, i) => {
    const y = 1.85 + i * 1.08;
    s.addText([{ text: t[0], options: { bold: true, fontSize: 13, color: H.navy, breakLine: true } }, { text: t[1], options: { fontSize: 11, color: H.text } }], { x: 5.3, y, w: 7.43, h: 1.0, margin: 0, valign: "top", paraSpaceAfter: 3, isTextBox: true });
  });
}
{
  const s = content("Appendix", "Sources", null);
  const src = ["Priceline — two work days to plan a trip (Jan 2024)", "Expedia Group / Luth Research — Path to Purchase (2023)", "Park & Jang (2013); Nawijn et al. (2010)", "Greetwell AI Travel Survey (Aug 2026); Phocuswright (Mar 2026)", "Travel Weekly — advisors charging fees (Aug 2025)", "Flywire — luxury and ultra-luxury surveys (2025, 2026)", "SITA Baggage IT Insights 2026; Action Fraud via ATOL (2024)", "Court and press records: JetSuite, Verijet, Jet It, OneFlight", "FAA enforcement releases; The Watch Register (2024)", "PS and Heathrow Windsor Suite pricing (2026)", "Altrata World Ultra Wealth Report 2026; Knight Frank 2026", "Deloitte Family Office Landscape 2024; UBS GFO Report 2024–25", "Morgan & Mallet — Beyond The Butler 2025/26; agency pages", "Quay Group (2025); CrewPass pricing", "Deel, Remote, Nannytax, HomePay pricing (2026-10-06)", "GOV.UK ODW visa; Home Office PQ55427 (Jun 2025)", "UAE Decree-Law 9/2022; Gulf News (MOHRE actions)", "Kalayaan (Jun 2024); Hinduja case, Geneva (Jun 2024)", "Agency fee schedules (2025–26)", "Henley Private Wealth Migration Report (2025); HMRC", "Clinic price lists; Global Wellness Institute (2024)", "ICCT; Transport & Environment (aviation emissions)", "Deloitte family-office cyber (2024)", "Filings: Wheels Up, Volato, Inspirato, Accor/onefinestay, Fora", "Capgemini World Wealth Report 2025", "Frameworks: six forces, needs analysis, SPA, value pricing, Trade-Off Method", "Issue analysis course notes (IBC); Minto pyramid principle", "Ghemawat & Rivkin (2006); Eisenmann, Parker & Van Alstyne (2006)", "Our earlier Southern Italy research — supplier, partnership and pricing sheets (Sep 2026)", "Euronews — Capri caps tour groups (Feb 2026); Made in Pompei (Feb 2025)", "Direzione Hotel — Booking.com commissions for Italian hotels", "The Data Appeal Company — Almawave acquisition"];
  const half = Math.ceil(src.length / 2);
  [src.slice(0, half), src.slice(half)].forEach((col, c) => {
    s.addText(col.map((t, i) => ({ text: (c * half + i + 1) + ". " + t, options: { breakLine: i < col.length - 1 } })), { x: 0.6 + c * 6.15, y: 1.85, w: 5.95, h: 4.95, fontSize: 9, color: H.text, margin: 0, valign: "top", paraSpaceAfter: 3, isTextBox: true });
  });
  s.addText("Full tables with dates, samples, methods and evidence grades: research/ (sources.md, raw/, opportunity_map.md, fmo_strategy.md, frameworks and methods addenda).", { x: 0.6, y: 6.88, w: 11.4, h: 0.4, fontSize: 8.5, color: H.muted, margin: 0, isTextBox: true });
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
