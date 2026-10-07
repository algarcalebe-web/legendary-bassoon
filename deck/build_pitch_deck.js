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

const PH = "deck/assets/photos/";
const CREST = "deck/assets/crest_cover.jpeg", CREST2 = "deck/assets/crest_illustrated.jpeg", SHIELD = "deck/assets/shield.png";
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.title = "Private travel assurance: strategy deck";
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

// ===== Otium Chigi Journeys · pitch deck =====
pres.title = "Otium Chigi Journeys: pitch deck";
const SRC = "research/fmo_strategy.md and research/raw (Oct 2026).";
function big(s, x, y, w, n, label, opt = {}) {
  s.addText(n, { x, y, w, h: 0.75, fontSize: opt.ns || 34, bold: true, color: opt.dark ? H.gold : H.navy, margin: 0, isTextBox: true });
  s.addText(label, { x, y: y + 0.8, w, h: opt.lh || 0.95, fontSize: opt.ls || 12, color: opt.dark ? H.white : H.text, margin: 0, valign: "top", isTextBox: true });
}
function darkSlide(title, kicker) {
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: sec });
  if (kicker) s.addText(kicker.toUpperCase(), { x: 0.6, y: 0.45, w: 12, h: 0.3, fontSize: 10, bold: true, color: H.gold, charSpacing: 2, margin: 0, isTextBox: true });
  s.addText(title, { x: 0.6, y: 0.8, w: 12.1, h: 1.0, fontSize: 26, bold: true, color: H.white, margin: 0, valign: "top", isTextBox: true });
  return s;
}
function srcDark(s, t) { s.addText("Source: " + t, { x: 0.6, y: 6.95, w: 11.6, h: 0.4, fontSize: 8.5, color: H.light, margin: 0, isTextBox: true }); }

section("Pitch");
// 1 COVER
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: sec });
  s.addImage({ path: CREST, x: 0, y: 0, w: 5.0, h: 7.5 });
  s.addText("PITCH · OCTOBER 2026", { x: 5.6, y: 1.3, w: 7.1, h: 0.35, fontSize: 11, bold: true, color: H.gold, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText("Wealthy families pay to take the risk out of their journeys — and still carry it alone", { x: 5.6, y: 1.8, w: 7.1, h: 1.7, fontSize: 30, bold: true, color: H.white, margin: 0, valign: "top", isTextBox: true });
  s.addText("Every supplier, deposit, border and member of staff is theirs to manage — and when one fails, the loss is theirs too.", { x: 5.6, y: 3.6, w: 7.0, h: 1.2, fontSize: 18, color: H.light, margin: 0, valign: "top", isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: 5.6, y: 5.2, w: 1.6, h: 0 , line: { color: H.gold, width: 2 } });
  s.addText("Otium Chigi Journeys · Rome · Southern Italy · Santa Catarina · Confidential", { x: 5.6, y: 5.4, w: 7.1, h: 0.4, fontSize: 12, color: H.white, margin: 0, isTextBox: true });
  s.addNotes("Audience: regional partners, pilot families, family offices, suppliers and rails partners, and early investors. Ask: pilots and partners per region; capital only after the day-90 gate.");
}
// 1b SCQ
{
  const s = content("Situation · Complication · Question", "Families pay to remove risk from their journeys — yet still carry it alone. Should we build a platform that takes it off them?", "Altrata 2026; Knight Frank 2026; Deloitte 2024; Henley 2025 (vendor projection); research/phase3_uhnw.md; research/opportunity_map.md; research/raw/uhnw_pains.md (OneFlight: press commentary, US private aviation).");
  const cols = [
    ["Situation", "557–714k UHNW people with about three homes each; single family offices 8,030 → 10,720 by 2030; 142k → 165k millionaires relocating. They already pay to remove risk: brokers take 10–20% partly to vouch; deposits run US$100k–1M.", H.panel, H.navy, H.text],
    ["Complication", "Trips alone are copied (a curator scored 11/25, moat 1). No one assures suppliers and deposits across categories: audits cover aviation safety only, while >US$150M sat at risk at one jet provider (Sep 2026).", H.panel, H.navy, H.text],
    ["Question", "Should we create a two-sided platform that integrates exclusive luxury travel for UHNW and affluent families?", H.navy, H.gold, H.white],
    ["How we answer", "Map the pains and what families already pay, compare the options, and test the leading hypothesis in interviews and real sales before we build.", H.gold, H.navy, H.navy],
  ];
  cols.forEach((c, i) => {
    const x = 0.6 + i * 3.06;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 2.95, h: 4.15, fill: { color: c[2] }, line: { color: c[2] } });
    s.addText(c[0], { x: x + 0.2, y: 2.08, w: 2.55, h: 0.45, fontSize: 17, bold: true, color: c[3], margin: 0, isTextBox: true });
    s.addText(c[1], { x: x + 0.2, y: 2.6, w: 2.55, h: 3.4, fontSize: i >= 2 ? 15 : 11.5, bold: i >= 2, color: c[4], margin: 0, valign: "top", isTextBox: true });
  });
}
// 1c PROBLEM STATEMENT
{
  const s = content("Problem statement", "UHNW families carry the risk of every supplier, deposit and border themselves — no one assures the whole journey", "Altrata WUWR 2026; Knight Frank Wealth Report 2026; Deloitte Family Office Landscape 2024; research/phase3_uhnw.md; research/raw/uhnw_pains.md (JetSuite 2020; OneFlight, Sep 2026); Morgan & Mallet, Beyond The Butler 2025/26; Home Office PQ55427 (Jun 2025); UAE Decree-Law 9/2022; Priceline (Jan 2024, n = 3,024).");
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.85, w: 12.13, h: 1.25, fill: { color: H.navy }, line: { color: H.navy } });
  s.addText("Ultra-high-net-worth families build every journey from separate vendors and carry its risk alone: supplier solvency, deposits of US$100k–1M, staff who must cross borders lawfully, and their own privacy. When a supplier fails, the loss is theirs — JetSuite members lost more than US$50M; more than US$150M sat at stake at OneFlight (Sep 2026).", { x: 0.8, y: 1.85, w: 11.8, h: 1.25, fontSize: 13.5, bold: true, color: H.white, margin: 0, valign: "middle", isTextBox: true });
  const g = [
    ["Who", "557–714k UHNW people with about three homes each; 8,030 single family offices, rising to 10,720 by 2030"],
    ["What hurts", "Supplier failure and deposit loss · lawful staff mobility · scarce access and crowds · planning load"],
    ["How much", "Deposits US$100k–1M; brokers take 10–20% partly to vouch; a travelling nanny costs £55–110k a year; 16 hours to plan a trip"],
    ["Why now", "Provider failures 2020–2026; the UK domestic-worker route under review (Jun 2025); UAE fines AED 50–200k; family offices +4.9% a year (CALC)"],
  ];
  g.forEach((c, i) => {
    const x = 0.6 + i * 3.06;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 3.3, w: 2.95, h: 2.75, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 3.3, w: 2.95, h: 0.07, fill: { color: H.gold }, line: { color: H.gold } });
    s.addText([{ text: c[0], options: { bold: true, fontSize: 14, color: H.navy, breakLine: true } }, { text: c[1], options: { fontSize: 11, color: H.text } }], { x: x + 0.18, y: 3.5, w: 2.6, h: 2.45, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  });
  callout(s, "So what: no one assures suppliers, deposits and people together — families pay each vendor separately and keep the risk.");
}
// 2 PROBLEM
{
  const s = content("The problem", "A luxury journey is bought from a dozen vendors — and the people who travel with the family cannot follow lawfully", "Priceline (Jan 2024, n = 3,024); The Roman Guy and operator listings (Vatican); Morgan & Mallet, Beyond The Butler 2025/26; press commentary on OneFlight (Sep 2026).");
  const st = [["16 hours", "to plan and book one trip — before any staff, access or paperwork"], ["9–23×", "the standard ticket for private Vatican access: exclusivity is bought piece by piece"], ["2.36%", "of one agency’s childcare candidates can work rotations that follow the family"], ["~US$150M", "of deposits at risk when a private-aviation provider paused flights (Sep 2026)"]];
  st.forEach((t, i) => {
    const x = 0.6 + i * 3.06;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 2.95, h: 3.0, fill: { color: i === 0 ? H.navy : H.panel }, line: { color: i === 0 ? H.navy : H.line, width: 0.75 } });
    big(s, x + 0.2, 2.15, 2.6, t[0], t[1], { dark: i === 0, ns: 26, lh: 1.6 });
  });
  s.addText("Families stitch it together themselves — and carry the legal and financial risk at every border.", { x: 0.6, y: 5.25, w: 12.13, h: 0.8, fontSize: 15, bold: true, color: H.navy, margin: 0, isTextBox: true });
}
// 2b PAIN
{
  const s = content("Pain detection and measures", "We detected the pain where money is spent and lost — supplier and deposit risk is the most severe and least served", "Priceline (Jan 2024, n = 3,024); court filings and press (OneFlight, Sep 2026); UAE Decree-Law 9/2022; Morgan & Mallet 2025/26; NYSSCPA (2013–17 audits; CALC US$1bn ÷ 15,000); The Roman Guy; Euronews (Feb 2026).");
  table(s, ["Pain", "How we detected it", "How big", "Served today?"], [
    ["Supplier failure and deposit loss", "Court filings and losses", "Deposits US$100k–1M; >US$150M at stake at one jet provider (Sep 2026)", { text: "No", options: { color: H.red, bold: true } }],
    ["Lawful staff mobility", "Rules enforced; scarce supply", "Fines AED 50–200k; only 2.36% of candidates can rotate", { text: "Partly", options: { color: H.goldDk, bold: true } }],
    ["Residency-day exposure", "Audit records", "~US$67k per New York residency audit (CALC)", { text: "Partly", options: { color: H.goldDk, bold: true } }],
    ["Scarce access and crowds", "Price premiums paid", "9–23× for private Vatican access; up to 50,000 day visitors on Capri", { text: "Partly", options: { color: H.goldDk, bold: true } }],
    ["Planning load", "Time studies", "16 hours to plan one trip", { text: "Yes", options: { color: H.mid, bold: true } }],
  ], { colW: [2.9, 2.6, 4.9, 1.73], fs: 10.5, rowH: 0.7 });
  callout(s, "We followed the money and the losses: they point to supplier, deposit and staff risk.", 5.95, 0.5);
}
// 2b2 NEEDS
{
  const s = content("Needs not met", "UHNW travellers’ needs are not met: the most important needs are the worst served — integration is the improvement no single vendor offers", "Importance and performance are our assessment (needs analysis: importance × performance); positioning is hypothesis H1, tested in the 90-day plan. Evidence: Private Jet Card Comparisons survey; research/phase3_uhnw.md; Morgan & Mallet 2025/26; our earlier Southern Italy research (24 suppliers in a 10-night trip); Flywire (Mar 2025; Jan 2026); research/raw/map_a.md (NYSSCPA; CALC US$1bn ÷ 15,000); Campden Wealth with Schillings (2025); The Roman Guy; Priceline (Jan 2024, n = 3,024). ‘How well met’ is our assessment of the alternatives in chapter 1.");
  const X0 = 1.15, Y0 = 1.95, W = 5.9, Hh = 4.0;
  const px = (p) => X0 + (p - 1) / 4 * W, py = (i) => Y0 + (1 - (i - 2.5) / 2.5) * Hh;
  s.addShape(pres.shapes.RECTANGLE, { x: X0, y: Y0, w: W, h: Hh, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  s.addShape(pres.shapes.RECTANGLE, { x: X0, y: Y0, w: px(3) - X0, h: py(3.75) - Y0, fill: { color: "F5EBD3" }, line: { color: "F5EBD3" } });
  s.addText("Potential for improvement", { x: X0 + 0.1, y: Y0 + 0.08, w: 2.8, h: 0.3, fontSize: 10, bold: true, color: H.goldDk, margin: 0, isTextBox: true });
  s.addText("How well met today →", { x: X0, y: Y0 + Hh + 0.05, w: W, h: 0.28, fontSize: 10, bold: true, color: H.muted, align: "center", margin: 0, isTextBox: true });
  s.addText("Importance ↑", { x: 0.3, y: Y0 - 0.32, w: 2, h: 0.28, fontSize: 10, bold: true, color: H.muted, margin: 0, isTextBox: true });
  const pts = [["Supplier and deposit security", 1.5, 4.65, 1], ["Lawful travelling staff", 1.7, 4.35, 1], ["One responsibility, one payment", 2.0, 3.95, 1], ["Residency days and records", 2.55, 3.55, 0], ["Privacy and security", 3.15, 4.7, 0], ["Access without crowds", 3.35, 4.2, 0], ["Planning time", 4.0, 3.15, 0], ["Service on the trip", 4.5, 4.45, 0]];
  pts.forEach((p) => {
    const cx = px(p[1]), cy = py(p[2]);
    s.addShape(pres.shapes.OVAL, { x: cx - 0.11, y: cy - 0.11, w: 0.22, h: 0.22, fill: { color: p[3] ? H.navy : H.mid }, line: { color: H.white, width: 1 } });
    s.addText(p[0], { x: cx + 0.15, y: cy - 0.14, w: 2.3, h: 0.28, fontSize: 9, bold: p[3] === 1, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
  });
  card(s, 7.6, 1.95, 5.13, 4.0, "Unique value proposition (hypothesis H1)", "For UHNW families and their family offices, who move people, money and plans across borders: one assured record that every journey runs on — every supplier filed, every deposit protected, every staff day lawful, every residency day signed off.\n\nUnlike advisors, concierges, agencies and payroll firms, which each solve one piece, integration reuses one record across all of them: vetting once, one payment, staff days feeding the ledger.", { hs: 12.5, fs: 11, dark: true });
  callout(s, "Integration is the improvement no single vendor can offer — whether families pay for it is what the interviews test.", 6.3, 0.48);
}
// 2c OPTIONS
{
  const s = content("Options", "Options to solve the pains, ranked by what families already pay — the assured record is our leading hypothesis, not a given", "research/phase3_uhnw.md (broker markups, deposits); Morgan & Mallet 2025/26; agency fee schedules (2025–26); Deel and Remote pricing (2026); The Roman Guy; Nevada Current (Jun 2025); Stirling Access; research/raw/map_a.md (NYSSCPA; TaxDay); Travel Weekly (Aug 2025); Flywire (Mar 2025). WTP strength is our assessment of money already paid.");
  table(s, ["Pain", "Options that could solve it", "What families already pay (WTP evidence)", "WTP", "Hypothesis"], [
    ["Supplier failure and deposit loss", "Assured supplier files · staged escrow on deposits · insured deposit protection", "Brokers take 10–20% partly to vouch; deposits US$100k–1M at stake", { text: "Inferred", options: { color: H.goldDk, bold: true } }, { text: "H1 · lead", options: { color: H.navy, bold: true } }],
    ["Lawful staff mobility", "Compliance coordination for the family’s own staff · employed relief pool · agency referral", "Travelling nanny £55–110k a year; agency fees 15–25%; EOR US$599–699 a month", { text: "Strong for staff", options: { color: H.mid, bold: true } }, "H2"],
    ["Scarce access and crowds", "Held tables and opening-time slots · exclusive peak-week houses · crowd-smart timing", "9–23× private-access premiums; resold tables above US$2,100; concierge clubs £2k–25k a year", { text: "Strong", options: { color: H.mid, bold: true } }, "H3"],
    ["Residency-day exposure", "Adviser-signed day ledger · day-count apps", "~US$67k per New York residency audit (CALC); TaxDay US$9.99 a month", { text: "Low today", options: { color: H.red, bold: true } }, "H4"],
    ["Planning load", "Questionnaire with three proposals in 24 hours · advisors", "55% of US advisors charge fees, ~US$350 a trip", { text: "Served", options: { color: H.muted, bold: true } }, "H5"],
    ["Payment friction", "One price, one payment, across every supplier", "95% say easy payment matters; 72% worry about security", { text: "Medium", options: { color: H.goldDk, bold: true } }, "H5"],
  ], { colW: [2.1, 3.6, 3.75, 1.3, 1.38], fs: 9.5, rowH: 0.64 });
  callout(s, "The assured record is one option among these — our leading hypothesis, to be proven or rejected in interviews before we build.");
}
// 2d BRAINSTORM
{
  const s = content("Brainstorm", "Brainstorm (1/2): twenty-seven ways to solve the unmet needs, rated on need, willingness to pay, switching cost, moat, envelopment and feasibility", "Our assessment, 1–5 per criterion: need = pain severity × how unmet; WTP = money already paid for the job; switching = cost for families to leave; moat = year-3 defensibility (moat red-team, Oct 2026); envelope-safe = how hard a bigger player bundles it away; feasible = zero capital, ~1 hour a day, licences. Reuses research/opportunity_map.md and research/moat_intelligence.md scores.");
  const I = [["Assured supplier files + escrow deposit terms", "Our research", 5, 3, 3, 3, 3, 4, 21], ["Integrated platform: assured record + journeys + access", "Bundle", 5, 3, 4, 3, 3, 2, 20], ["Private asset exchange club: homes, castles, islands, yachts, jets — never for rent", "Your idea", 3, 4, 4, 4, 3, 2, 20], ["Insured deposit protection with an insurer", "Our research", 5, 3, 4, 3, 2, 2, 19], ["Exclusive peak-week houses (Jurerê first refusal)", "Red team", 3, 4, 2, 3, 4, 3, 19], ["Multi-home operating pool: shared estate staff, empty-home protocol", "Opportunity map", 3, 4, 4, 3, 3, 2, 19], ["Post-retreat health continuity", "Opportunity map", 4, 4, 4, 3, 3, 1, 19], ["Education on the move: travelling tutors with school-credit continuity", "New", 3, 4, 4, 2, 4, 2, 19], ["Invitation-only peer network of UHNW families", "Opportunity map", 3, 3, 4, 3, 3, 2, 18], ["Multigenerational and care orchestration: seniors, access needs, nannies", "New", 4, 3, 3, 2, 3, 3, 18], ["Berth exchange and empty-leg pooling among member families", "New", 3, 4, 3, 4, 3, 1, 18], ["Staff coordination and relief pool", "Earlier wedge", 4, 4, 3, 2, 3, 1, 17], ["Residency-day ledger for tax advisers", "Opportunity map", 4, 2, 4, 2, 2, 3, 17], ["Privacy shield: alias booking, masked payment, anti-impersonation", "Opportunity map", 4, 3, 3, 3, 2, 2, 17], ["Held-access marketplace: tables, opening slots, palazzi", "Earlier research", 3, 5, 2, 2, 2, 3, 17], ["Neutral residency and relocation risk tracker", "New", 3, 3, 3, 3, 3, 2, 17], ["Private-bank white-label family journey desk", "New", 4, 3, 3, 2, 2, 2, 16], ["AI copilot for family-office travel desks", "Opportunity map", 3, 3, 3, 3, 1, 3, 16], ["Event hospitality: authenticated resale with escrow", "New", 3, 4, 2, 3, 2, 2, 16], ["Audited sustainable-aviation-fuel disclosure pack", "New", 3, 2, 2, 4, 3, 2, 16], ["Portable staff record and vetting standard", "Opportunity map", 3, 2, 2, 2, 2, 4, 15], ["OCI: luxury-travel intelligence and reports for data platforms (e.g. Google) and media", "Your idea", 3, 3, 2, 2, 2, 2, 14], ["Insurer-backed trip outcome guarantee", "Opportunity map", 3, 2, 2, 3, 2, 2, 14], ["Invitation-only OCJ membership, issued through cards above Centurion", "Your idea", 3, 4, 2, 2, 1, 1, 13], ["Integrated journeys at one price (trip design)", "Earlier research", 3, 4, 1, 1, 1, 3, 13], ["Destination crowd and flow dashboards for towns", "Earlier research", 2, 3, 2, 1, 1, 3, 12], ["Rome–Santa Catarina corridor curator", "Original concept", 2, 3, 1, 1, 1, 4, 12]].slice(0, 14);
  const h5 = (v) => { const f = v >= 5 ? H.navy : v >= 4 ? H.mid : v >= 3 ? H.light : v >= 2 ? H.panel : H.low; return { text: String(v), options: { align: "center", bold: true, fill: { color: f }, color: v >= 4 ? H.white : v <= 1 ? H.red : H.text } }; };
  const tot = (v) => ({ text: String(v), options: { align: "center", bold: true, color: v >= 19 ? H.goldDk : H.navy } });
  table(s, ["Idea", "Origin", "Need", "WTP", "Switching", "Moat", "Envelope-safe", "Feasible", "Total /30"], I.map((r) => [{ text: r[0], options: { bold: r[1] === "Your idea" || r[8] >= 19, color: r[1] === "Your idea" ? H.red : H.navy } }, { text: r[1], options: { color: H.muted } }, h5(r[2]), h5(r[3]), h5(r[4]), h5(r[5]), h5(r[6]), h5(r[7]), tot(r[8])]), { colW: [4.6, 1.45, 0.75, 0.75, 0.95, 0.75, 1.13, 0.85, 0.9], fs: 9, rowH: 0.31 });
}
{
  const s = content("Brainstorm", "Brainstorm (2/2): the lower half — useful features or later channels, but weaker on moat, envelopment or feasibility", "Our assessment, 1–5 per criterion: need = pain severity × how unmet; WTP = money already paid for the job; switching = cost for families to leave; moat = year-3 defensibility (moat red-team, Oct 2026); envelope-safe = how hard a bigger player bundles it away; feasible = zero capital, ~1 hour a day, licences. Reuses research/opportunity_map.md and research/moat_intelligence.md scores.");
  const I = [["Assured supplier files + escrow deposit terms", "Our research", 5, 3, 3, 3, 3, 4, 21], ["Integrated platform: assured record + journeys + access", "Bundle", 5, 3, 4, 3, 3, 2, 20], ["Private asset exchange club: homes, castles, islands, yachts, jets — never for rent", "Your idea", 3, 4, 4, 4, 3, 2, 20], ["Insured deposit protection with an insurer", "Our research", 5, 3, 4, 3, 2, 2, 19], ["Exclusive peak-week houses (Jurerê first refusal)", "Red team", 3, 4, 2, 3, 4, 3, 19], ["Multi-home operating pool: shared estate staff, empty-home protocol", "Opportunity map", 3, 4, 4, 3, 3, 2, 19], ["Post-retreat health continuity", "Opportunity map", 4, 4, 4, 3, 3, 1, 19], ["Education on the move: travelling tutors with school-credit continuity", "New", 3, 4, 4, 2, 4, 2, 19], ["Invitation-only peer network of UHNW families", "Opportunity map", 3, 3, 4, 3, 3, 2, 18], ["Multigenerational and care orchestration: seniors, access needs, nannies", "New", 4, 3, 3, 2, 3, 3, 18], ["Berth exchange and empty-leg pooling among member families", "New", 3, 4, 3, 4, 3, 1, 18], ["Staff coordination and relief pool", "Earlier wedge", 4, 4, 3, 2, 3, 1, 17], ["Residency-day ledger for tax advisers", "Opportunity map", 4, 2, 4, 2, 2, 3, 17], ["Privacy shield: alias booking, masked payment, anti-impersonation", "Opportunity map", 4, 3, 3, 3, 2, 2, 17], ["Held-access marketplace: tables, opening slots, palazzi", "Earlier research", 3, 5, 2, 2, 2, 3, 17], ["Neutral residency and relocation risk tracker", "New", 3, 3, 3, 3, 3, 2, 17], ["Private-bank white-label family journey desk", "New", 4, 3, 3, 2, 2, 2, 16], ["AI copilot for family-office travel desks", "Opportunity map", 3, 3, 3, 3, 1, 3, 16], ["Event hospitality: authenticated resale with escrow", "New", 3, 4, 2, 3, 2, 2, 16], ["Audited sustainable-aviation-fuel disclosure pack", "New", 3, 2, 2, 4, 3, 2, 16], ["Portable staff record and vetting standard", "Opportunity map", 3, 2, 2, 2, 2, 4, 15], ["OCI: luxury-travel intelligence and reports for data platforms (e.g. Google) and media", "Your idea", 3, 3, 2, 2, 2, 2, 14], ["Insurer-backed trip outcome guarantee", "Opportunity map", 3, 2, 2, 3, 2, 2, 14], ["Invitation-only OCJ membership, issued through cards above Centurion", "Your idea", 3, 4, 2, 2, 1, 1, 13], ["Integrated journeys at one price (trip design)", "Earlier research", 3, 4, 1, 1, 1, 3, 13], ["Destination crowd and flow dashboards for towns", "Earlier research", 2, 3, 2, 1, 1, 3, 12], ["Rome–Santa Catarina corridor curator", "Original concept", 2, 3, 1, 1, 1, 4, 12]].slice(14, 27);
  const h5 = (v) => { const f = v >= 5 ? H.navy : v >= 4 ? H.mid : v >= 3 ? H.light : v >= 2 ? H.panel : H.low; return { text: String(v), options: { align: "center", bold: true, fill: { color: f }, color: v >= 4 ? H.white : v <= 1 ? H.red : H.text } }; };
  const tot = (v) => ({ text: String(v), options: { align: "center", bold: true, color: v >= 19 ? H.goldDk : H.navy } });
  table(s, ["Idea", "Origin", "Need", "WTP", "Switching", "Moat", "Envelope-safe", "Feasible", "Total /30"], I.map((r) => [{ text: r[0], options: { bold: r[1] === "Your idea" || r[8] >= 19, color: r[1] === "Your idea" ? H.red : H.navy } }, { text: r[1], options: { color: H.muted } }, h5(r[2]), h5(r[3]), h5(r[4]), h5(r[5]), h5(r[6]), h5(r[7]), tot(r[8])]), { colW: [4.6, 1.45, 0.75, 0.75, 0.95, 0.75, 1.13, 0.85, 0.9], fs: 9, rowH: 0.31 });
}
{
  const s = content("Brainstorm", "Value against defensibility: the assured record, the asset exchange club, insured deposits and regional pre-emption lead", "Scores from the brainstorm table (our assessment); red = your ideas. Value = need + WTP; defensibility = switching cost + moat. Inputs: Amex Centurion US$10,000 + US$5,000 a year (research/raw/money.md); HomeExchange Collection, Exclusive Resorts (research/raw/map_a.md); Capital One bought Velocity Black (Jun 2023).");
  const I = [["Assured supplier files + escrow deposit terms", "Our research", 5, 3, 3, 3, 3, 4, 21], ["Integrated platform: assured record + journeys + access", "Bundle", 5, 3, 4, 3, 3, 2, 20], ["Private asset exchange club: homes, castles, islands, yachts, jets — never for rent", "Your idea", 3, 4, 4, 4, 3, 2, 20], ["Insured deposit protection with an insurer", "Our research", 5, 3, 4, 3, 2, 2, 19], ["Exclusive peak-week houses (Jurerê first refusal)", "Red team", 3, 4, 2, 3, 4, 3, 19], ["Multi-home operating pool: shared estate staff, empty-home protocol", "Opportunity map", 3, 4, 4, 3, 3, 2, 19], ["Post-retreat health continuity", "Opportunity map", 4, 4, 4, 3, 3, 1, 19], ["Education on the move: travelling tutors with school-credit continuity", "New", 3, 4, 4, 2, 4, 2, 19], ["Invitation-only peer network of UHNW families", "Opportunity map", 3, 3, 4, 3, 3, 2, 18], ["Multigenerational and care orchestration: seniors, access needs, nannies", "New", 4, 3, 3, 2, 3, 3, 18], ["Berth exchange and empty-leg pooling among member families", "New", 3, 4, 3, 4, 3, 1, 18], ["Staff coordination and relief pool", "Earlier wedge", 4, 4, 3, 2, 3, 1, 17], ["Residency-day ledger for tax advisers", "Opportunity map", 4, 2, 4, 2, 2, 3, 17], ["Privacy shield: alias booking, masked payment, anti-impersonation", "Opportunity map", 4, 3, 3, 3, 2, 2, 17], ["Held-access marketplace: tables, opening slots, palazzi", "Earlier research", 3, 5, 2, 2, 2, 3, 17], ["Neutral residency and relocation risk tracker", "New", 3, 3, 3, 3, 3, 2, 17], ["Private-bank white-label family journey desk", "New", 4, 3, 3, 2, 2, 2, 16], ["AI copilot for family-office travel desks", "Opportunity map", 3, 3, 3, 3, 1, 3, 16], ["Event hospitality: authenticated resale with escrow", "New", 3, 4, 2, 3, 2, 2, 16], ["Audited sustainable-aviation-fuel disclosure pack", "New", 3, 2, 2, 4, 3, 2, 16], ["Portable staff record and vetting standard", "Opportunity map", 3, 2, 2, 2, 2, 4, 15], ["OCI: luxury-travel intelligence and reports for data platforms (e.g. Google) and media", "Your idea", 3, 3, 2, 2, 2, 2, 14], ["Insurer-backed trip outcome guarantee", "Opportunity map", 3, 2, 2, 3, 2, 2, 14], ["Invitation-only OCJ membership, issued through cards above Centurion", "Your idea", 3, 4, 2, 2, 1, 1, 13], ["Integrated journeys at one price (trip design)", "Earlier research", 3, 4, 1, 1, 1, 3, 13], ["Destination crowd and flow dashboards for towns", "Earlier research", 2, 3, 2, 1, 1, 3, 12], ["Rome–Santa Catarina corridor curator", "Original concept", 2, 3, 1, 1, 1, 4, 12]];
  const X0 = 0.9, Y0 = 1.95, W = 7.6, Hh = 4.15;
  const px = (v) => X0 + 0.45 + (v - 2) / 7 * (W - 0.7), py = (v) => Y0 + (1 - (v - 4) / 6) * Hh;
  s.addShape(pres.shapes.RECTANGLE, { x: X0, y: Y0, w: W, h: Hh, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  s.addShape(pres.shapes.RECTANGLE, { x: px(6) - 0.42, y: Y0, w: X0 + W - px(6) + 0.42, h: py(7) - Y0 + 0.15, fill: { color: "F5EBD3" }, line: { color: "F5EBD3" } });
  s.addText("Shortlist: valuable and defensible", { x: px(6) - 0.34, y: Y0 + 0.06, w: 3.0, h: 0.28, fontSize: 9.5, bold: true, color: H.goldDk, margin: 0, isTextBox: true });
  s.addText("Defensibility: switching cost + moat →", { x: X0, y: Y0 + Hh + 0.04, w: W, h: 0.28, fontSize: 10, bold: true, color: H.muted, align: "center", margin: 0, isTextBox: true });
  s.addText("Value: need + WTP ↑", { x: 0.3, y: Y0 - 0.32, w: 2.5, h: 0.28, fontSize: 10, bold: true, color: H.muted, margin: 0, isTextBox: true });
  const seen = {};
  I.forEach((r, k) => {
    const dx = r[4] + r[5], vy = r[2] + r[3], key = dx + "," + vy; const n = seen[key] = (seen[key] || 0) + 1;
    num(s, px(dx) - 0.3 + ((n - 1) % 3) * 0.3, py(vy) + Math.floor((n - 1) / 3) * 0.3, 0.28, k + 1, r[1] === "Your idea" ? H.red : r[8] >= 19 ? H.navy : H.mid);
  });
  const leg = I.map((r, k) => ({ text: (k + 1) + "  " + r[0].split(":")[0] + " (" + r[8] + ")", options: { breakLine: k < I.length - 1, bold: r[8] >= 19, color: r[1] === "Your idea" ? H.red : H.navy } }));
  s.addText(leg, { x: 8.75, y: 1.9, w: 3.98, h: 4.35, fontSize: 7.5, margin: 0, valign: "top", isTextBox: true });
  callout(s, "Top-right ideas form the integrated platform; invitation-only OCJ and OCI fit later, as a channel and a business.", 6.38, 0.48);
}
{
  const s = content("Brainstorm", "A private asset exchange club: owners swap homes, castles, islands, yachts and jets never for rent — strong network and switching costs", "Altrata (about three residences per UHNW person); research/raw/map_a.md (HomeExchange Collection; Exclusive Resorts, 2024–25). Scores from the brainstorm table (our assessment).");
  const c = [["The idea", "A members-only exchange: owners swap their own homes, castles, islands, yachts and jets with other members — assets never for rent, reachable only inside the club. Invitation-only OCJ is the door; the assured record vets every asset and member."], ["Why it could work", "UHNW families own about three homes each, mostly empty. Owners already pay for access clubs: HomeExchange Collection US$1,000 a year (homes ≥ US$1.5m); Exclusive Resorts US$195–295k to join plus US$42,250 a year. Every member is both supply and demand."], ["What works against it", "Swaps need matching dates and comparable assets. Exchanging aircraft or yacht time for value can count as commercial charter, so it runs through licensed operators and counsel. Insurance, staff and liability must travel with each asset."]];
  c.forEach((b, i) => {
    const x = 0.6 + i * 4.1, dark = i === 0;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 3.95, h: 3.4, fill: { color: dark ? H.navy : H.panel }, line: { color: dark ? H.navy : H.line, width: 0.75 } });
    s.addText([{ text: b[0], options: { bold: true, fontSize: 15, color: dark ? H.gold : H.navy, breakLine: true } }, { text: b[1], options: { fontSize: 11.5, color: dark ? H.white : H.text } }], { x: x + 0.22, y: 2.08, w: 3.5, h: 3.15, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
  });
  table(s, ["Score", "Moat logic", "Test"], [["20/30 — among the top ideas", "Unique, non-rentable supply plus credits and reputation inside the club: high switching cost and a network that grows on both sides", "10 owner conversations per Wave-1 region: ≥ 3 list an asset; counsel note on jet and yacht exchanges"]], { y: 5.5, colW: [2.9, 4.7, 4.53], fs: 10, rowH: 0.55 });
}
{
  const s = content("Brainstorm", "Invitation-only OCJ through cards above Centurion: strong willingness to pay, but the issuer holds the client — a Wave-2 channel", "research/raw/money.md (Amex Centurion fees); research/raw/uhnw_structure.md (Knightsbridge Circle); research/raw/fmo_competitors.md (Velocity Black, Jun 2023). Scores from the brainstorm table (our assessment).");
  const c = [["The idea", "Invitation-only membership of Otium Chigi Journeys, issued through the cards above Centurion — Amex Centurion and the invitation-only tiers of Visa, Mastercard and private-bank issuers. Every module included, and the door to the asset exchange."], ["Why it could work", "Proven willingness to pay: Centurion costs US$10,000 to join plus US$5,000 a year; Knightsbridge Circle charges £25k–100k a year. Issuers fund benefits to keep top clients, and the card is the trust filter — no cold start on the demand side."], ["What works against it", "The issuer owns the client, the data and the brand; we risk becoming a white-label ingredient (Capital One bought Velocity Black rather than partner). Issuers sign proven suppliers at scale, and card protection already covers card-paid deposits."]];
  c.forEach((b, i) => {
    const x = 0.6 + i * 4.1, dark = i === 0;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 3.95, h: 3.4, fill: { color: dark ? H.navy : H.panel }, line: { color: dark ? H.navy : H.line, width: 0.75 } });
    s.addText([{ text: b[0], options: { bold: true, fontSize: 15, color: dark ? H.gold : H.navy, breakLine: true } }, { text: b[1], options: { fontSize: 11.5, color: dark ? H.white : H.text } }], { x: x + 0.22, y: 2.08, w: 3.5, h: 3.15, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
  });
  table(s, ["As an entry today", "As a Wave-2 channel, after proof", "Test"], [["13/30 as an entry — no record, no references", "Strong as a Wave-2 channel: a gated, pre-qualified demand side; co-branded, data rights agreed first", "3 conversations with premium-card and private-bank benefit teams after day 90; pass = a pilot term sheet"]], { y: 5.5, colW: [2.9, 4.7, 4.53], fs: 10, rowH: 0.55 });
}
// 3 WHO
{
  const s = content("Who feels it", "Two sides: multi-home families who need it all to work, and suppliers who want qualified guests without paying 16–30% to platforms", "Altrata 2026; Knight Frank 2026; Deloitte Family Office Landscape 2024; UBS 2024; Airbnb host fee and Booking.com Preferred commission (Brazil, 2026); Direzione Hotel (Italy); BLTA 2025 via O Hoje (Aug 2026).");
  const st = [["557–714k", "ultra-high-net-worth people (US$30M+), about three homes each"], ["8,030 → 10,720", "single family offices, 2024 → 2030 (Deloitte)"], ["16–30%", "what hotels and villas pay booking platforms: 16–18% in Brazil, up to 30% in Italy"], ["50%", "average occupancy at Brazil’s leading luxury hotels (BLTA 2025)"]];
  st.forEach((t, i) => big(s, 0.6 + i * 3.06, 2.0, 2.9, t[0], t[1], { ns: 24, lh: 1.2 }));
  table(s, ["Side", "What they need"], [
    ["Families and family offices", "One trusted place for the journey, the access and the people — lawful on every leg"],
    ["Villas, hotels, hosts, access providers", "Qualified, high-spending guests in every season, paid only on completed stays"],
    ["Household staff", "Steady, legal travelling work, with a record that follows them"],
  ], { y: 4.15, colW: [4.0, 8.13], fs: 11, rowH: 0.5 });
}
// 4 WORKAROUNDS
{
  const s = content("Today’s workarounds", "Every vendor solves one piece — no one integrates the journey, the access, the people and the trust", "raw/alt_a–c.md and raw/fmo_competitors.md (Oct 2026); raw/novelty_uhnw.md and raw/novelty_1.md (ARGUS, Wyvern, MYBA, package protection); Stirling Access; agency fee schedules (2025–26); Travel Weekly (Aug 2025).");
  const cs = [["Advisors and DMCs", "~US$350 fee; ~10–12% commission", "Design the trip; not the staff, the legal status or the data"], ["Concierge clubs", "£2k–25k a year", "Open doors; outside the family’s own journey and people"], ["Staff agencies", "15–25% of salary, once", "Place a person; the family stays employer everywhere"], ["Payroll and EOR", "£276–474 a year; US$599–699 a month", "One country, or built for companies"], ["Audits and escrow", "ARGUS, Wyvern; MYBA terms", "Safety only, aviation only; escrow one operator at a time"]];
  cs.forEach((c, i) => {
    const x = 0.6 + i * 2.45;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 2.35, h: 3.4, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
    s.addText([{ text: c[0], options: { bold: true, fontSize: 14, color: H.navy, breakLine: true } }, { text: c[1], options: { bold: true, fontSize: 11, color: H.goldDk, breakLine: true } }, { text: c[2], options: { fontSize: 11, color: H.text } }], { x: x + 0.15, y: 2.1, w: 2.05, h: 2.6, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.15, y: 4.75, w: 2.05, h: 0.4, rectRadius: 0.08, fill: { color: H.low }, line: { color: H.low } });
    s.addText("One piece only", { x: x + 0.15, y: 4.75, w: 2.05, h: 0.4, fontSize: 10, bold: true, color: H.red, align: "center", valign: "middle", margin: 0, isTextBox: true });
  });
  callout(s, "The family is the only integrator today — and EU package law protects package buyers only, not villa, boat or membership deposits.", 5.6, 0.55);
}
// 5 SOLUTION
{
  const s = darkSlide("Proposed solution (our leading hypothesis): four modules and an Intelligence engine on one Assured record", "The proposed solution");
  const p = [["Journey design + booking", "Three priced proposals in 24 hours, one price, one payment"], ["Access + hosting", "Held tables, private doors, a local host; first refusal on Jurerê peak weeks"], ["Staff + compliance", "Our vetted staff or the family’s own — counsel-led coordination across borders"], ["Data + trust", "Private supplier files and escrow deposit terms; an adviser-signed day ledger"], ["Intelligence", "Sells only what the record sees — never personal data"]];
  p.forEach((t, i) => {
    const x = 0.6 + i * 2.45;
    const gold = i === 3;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.1, w: 2.35, h: 3.6, fill: { color: gold ? H.gold : "243672" }, line: { color: gold ? H.gold : "243672" } });
    s.addText(String(i + 1), { x: x + 0.18, y: 2.22, w: 0.8, h: 0.7, fontSize: 32, bold: true, color: gold ? H.navy : H.gold, margin: 0, isTextBox: true });
    s.addText([{ text: t[0], options: { bold: true, fontSize: 15, color: gold ? H.navy : H.white, breakLine: true } }, { text: t[1], options: { fontSize: 11.5, color: gold ? H.navy : H.light } }], { x: x + 0.18, y: 2.95, w: 2.0, h: 2.65, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
  });
  s.addText("We start with module 4 — a family office orders a supplier file before a deposit, with zero suppliers on the platform — then run journeys, access and staff on the same record.", { x: 0.6, y: 5.95, w: 12.1, h: 0.7, fontSize: 13, italic: true, color: H.white, margin: 0, isTextBox: true });
}
// 6 HOW IT WORKS (two-sided)
{
  const s = content("How it works", "A two-sided platform useful from day one: family offices order supplier files, and suppliers sign Assured terms to stay eligible", "Operating model: our moat red-team (Oct 2026) and the strategy deck. Partners named are candidates, not agreements.");
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.0, w: 3.4, h: 3.6, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  s.addText([{ text: "Families", options: { bold: true, fontSize: 16, color: H.navy, breakLine: true } }, { text: "and family offices", options: { fontSize: 11, color: H.muted, breakLine: true } }, { text: "Order a supplier file before any deposit; membership per household, ledger included", options: { fontSize: 11.5, color: H.text } }], { x: 0.8, y: 2.15, w: 3.0, h: 3.3, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  s.addShape(pres.shapes.OVAL, { x: 4.85, y: 2.3, w: 3.6, h: 3.0, fill: { color: H.navy }, line: { color: H.navy } });
  s.addText([{ text: "Otium Chigi Journeys", options: { bold: true, fontSize: 14, color: H.white, breakLine: true } }, { text: "one Assured record", options: { fontSize: 11, color: H.gold } }], { x: 4.85, y: 2.3, w: 3.6, h: 3.0, align: "center", valign: "middle", margin: 0, isTextBox: true });
  s.addShape(pres.shapes.RECTANGLE, { x: 9.33, y: 2.0, w: 3.4, h: 3.6, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  s.addText([{ text: "Suppliers", options: { bold: true, fontSize: 16, color: H.navy, breakLine: true } }, { text: "villas, boats, DMCs, hosts, access, staff", options: { fontSize: 11, color: H.muted, breakLine: true } }, { text: "Sign data rights and staged-escrow terms; pay a take rate only on completed bookings", options: { fontSize: 11.5, color: H.text } }], { x: 9.53, y: 2.15, w: 3.0, h: 3.3, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: 4.0, y: 3.8, w: 0.85, h: 0, line: { color: H.navy, width: 2, beginArrowType: "triangle", endArrowType: "triangle" } });
  s.addShape(pres.shapes.LINE, { x: 8.45, y: 3.8, w: 0.88, h: 0, line: { color: H.navy, width: 2, beginArrowType: "triangle", endArrowType: "triangle" } });
  s.addText("Assured moves into a vehicle co-owned with an insurer or broker; client deposits sit in segregated or escrow accounts; costs come only from earned fees. We never hold passports or give legal advice.", { x: 0.6, y: 5.8, w: 12.13, h: 0.6, fontSize: 12, italic: true, color: H.navy, margin: 0, isTextBox: true });
}
// 6a WEDGE
{
  const s = content("Wedge", "Proposed wedge: the supplier file — useful to one family office alone, cash within 90 days, a path to a moat; to be proven in interviews", "Our moat red-team (Oct 2026); research/opportunity_map.md (scores); research/phase4_5.md §4.4 (competences); research/fmo_strategy.md §5 (staff economics); organiser costs from our earlier Southern Italy model.");
  table(s, ["Candidate wedge", "Useful with one side?", "Time to cash", "Competence fit", "Capital", "Moat path (yr 3)", "Verdict"], [
    [{ text: "Assured supplier file + escrow terms", options: { bold: true, color: H.navy } }, { text: "Yes: a family office orders it before a deposit", options: { color: H.mid, bold: true } }, "30–90 days", { text: "Favourable: credit analysis", options: { color: H.mid, bold: true } }, "None", { text: "3", options: { bold: true, color: H.goldDk } }, { text: "Lead wedge", options: { bold: true, color: H.navy } }],
    ["Staff coordination and relief", { text: "Yes", options: { color: H.mid, bold: true } }, "Months 4–15+", { text: "Less than favourable", options: { color: H.red } }, "Payroll float", "1", "Service; employment after T4–T5"],
    ["Jurerê peak-week first refusal", "No: needs families", "Season 1", { text: "Local founder", options: { color: H.mid, bold: true } }, "Paid consideration", { text: "3", options: { bold: true, color: H.goldDk } }, "Regional lock"],
    ["Journeys (trip design and booking)", "No: needs suppliers", "After day 90", "Partly", "Organiser licence €9.1k (CALC)", "1", "On top of the record"],
    ["Family day ledger", { text: "Yes", options: { color: H.mid, bold: true } }, "Month 16+", "Partly", "None", "2", "Retention"],
  ], { colW: [2.45, 2.05, 1.3, 1.85, 1.55, 1.15, 1.78], fs: 9.5, rowH: 0.72 });
  callout(s, "A wedge must work with one side, earn cash fast and lead to a moat — only the supplier file does all three.");
}
// 6b EXPERIENCE
{
  const s = content("The experience", "One family, one record: the arrival, the house, the boat and the family office all run on the same Assured record", "Illustrative images from our earlier Southern Italy work; not real clients or signed suppliers.");
  const ph = [["villa_arrival.jpeg", "Arrival", "A local host and the house ready; every deposit-holding supplier on Assured terms."], ["arrival_amenities.jpeg", "In the house", "Amenities for each member of the family; one price, one payment."], ["yacht_family.jpeg", "At sea", "The family’s own staff on board, lawful on every leg; the deposit in staged escrow."], ["private_bank.jpeg", "Before the deposit", "The family office orders an Assured file; the adviser signs off the day ledger."]];
  ph.forEach((p, i) => {
    const x = 0.6 + i * 3.06;
    s.addImage({ path: PH + p[0], x, y: 1.9, w: 2.95, h: 2.6, sizing: { type: "cover", w: 2.95, h: 2.6 } });
    s.addText([{ text: p[1], options: { bold: true, fontSize: 14, color: H.navy, breakLine: true } }, { text: p[2], options: { fontSize: 11.5, color: H.text } }], { x, y: 4.62, w: 2.95, h: 1.5, margin: 0, valign: "top", paraSpaceAfter: 4, isTextBox: true });
  });
  callout(s, "The record, not the trip, is what a rival would have to copy.", 6.2, 0.5);
}
// 7 WHY NOW
{
  const s = content("Moat", "Moat: designed, not built — 1 today; a narrow 3 by year 3 in three layers, if dated tests pass", "Our moat red-team (Oct 2026): three designs, a judge and three skeptics. Moat gate ≥ 3 (research/opportunity_map.md). Odds assume each test is a coin flip (ASSUMPTION).");
  const r = [["L1 · Assured standard", "Private supplier files plus staged-escrow deposit terms; suppliers sign data rights with their net rates", "MT1 day 60: ≥ 5 of 10 sign and most refuse a rival · MT2 day 90: ≥ 3 of 5 files sell"], ["L2 · Insurer or broker co-owner", "A coverholder makes Assured a condition of deposit cover; we share in the line", "MT4 day 90: a signed exclusive term sheet naming the mark"], ["L3 · Santa Catarina peak weeks", "Exclusive, paid first refusal on Jurerê peak weeks before an operator arrives", "Day 60: ≥ 3 of 5 owners sign"]];
  r.forEach((t, i) => {
    const y = 1.95 + i * 1.12;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.13, h: 1.0, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
    s.addText(t[0], { x: 0.8, y, w: 3.0, h: 1.0, fontSize: 14, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    s.addText(t[1], { x: 3.9, y, w: 4.6, h: 1.0, fontSize: 11.5, color: H.text, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.7, y: y + 0.3, w: 0.9, h: 0.4, rectRadius: 0.08, fill: { color: H.gold }, line: { color: H.gold } });
    s.addText("1 → 3", { x: 8.7, y: y + 0.3, w: 0.9, h: 0.4, fontSize: 11, bold: true, color: H.navy, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(t[2], { x: 9.8, y, w: 2.85, h: 1.0, fontSize: 10, color: H.text, margin: 0, valign: "middle", isTextBox: true });
  });
  s.addText("Not moats: Italy access and the day ledger (2), staff, licences and crowd data (1) — features and minimum requirements.", { x: 0.6, y: 5.35, w: 12.13, h: 0.4, fontSize: 11.5, italic: true, color: H.muted, margin: 0, isTextBox: true });
  callout(s, "Odds: 12.5% that the assurance path passes if each test is a coin flip — so we test before we build.", 5.85, 0.5);
}
// 8 ENVELOPMENT & COMPETITION
{
  const s = content("Competition", "We envelop single-function rivals around our families — and make the bigger players co-owners, not envelopers", "Envelopment per the network-markets framework; our moat red-team (Oct 2026); raw/fmo_competitors.md and raw/alt_a–c.md; our positioning assessment.");
  const X0 = 1.2, Y0 = 1.95, W = 6.6, Hh = 4.1;
  s.addShape(pres.shapes.RECTANGLE, { x: X0, y: Y0, w: W, h: Hh, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  s.addShape(pres.shapes.LINE, { x: X0 + W / 2, y: Y0, w: 0, h: Hh, line: { color: H.line, width: 0.75, dashType: "dash" } });
  s.addShape(pres.shapes.LINE, { x: X0, y: Y0 + Hh / 2, w: W, h: 0, line: { color: H.line, width: 0.75, dashType: "dash" } });
  s.addText("Breadth of the journey covered →", { x: X0, y: Y0 + Hh + 0.05, w: W, h: 0.3, fontSize: 10.5, bold: true, color: H.muted, align: "center", margin: 0, isTextBox: true });
  s.addText("Risk assured: suppliers, deposits, people ↑", { x: 0.3, y: Y0 - 0.32, w: 4, h: 0.3, fontSize: 10.5, bold: true, color: H.muted, margin: 0, isTextBox: true });
  const pts = [["Staff agencies", 0.18, 0.55, H.light, H.text], ["Payroll / EOR", 0.15, 0.3, H.light, H.text], ["Morgan & Mallet", 0.3, 0.72, H.mid, H.white], ["Concierge clubs", 0.55, 0.15, H.light, H.text], ["Advisors and DMCs", 0.78, 0.28, H.light, H.text], ["Booking platforms", 0.6, 0.42, H.light, H.text], ["Otium Chigi Journeys", 0.8, 0.85, H.navy, H.white]];
  pts.forEach((p) => {
    const cx = X0 + p[1] * W, cy = Y0 + (1 - p[2]) * Hh, w = p[0].length > 16 ? 1.95 : 1.6;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx - w / 2, y: cy - 0.2, w, h: 0.4, rectRadius: 0.1, fill: { color: p[3] }, line: { color: H.white, width: 1 } });
    s.addText(p[0], { x: cx - w / 2, y: cy - 0.2, w, h: 0.4, fontSize: 10, bold: true, color: p[4], align: "center", valign: "middle", margin: 0, isTextBox: true });
  });
  card(s, 8.3, 1.95, 4.43, 4.1, "Who envelops whom", "We envelop where we hold the family: trip-only design, day-count apps, deposit vouching, villa concierge in Santa Catarina.\n\nBanks, insurers and advisors hold the families and could envelop us — so they become co-owners and licensees of Assured, on data-right terms. Aviation we concede.", { hs: 13, fs: 12, dark: true });
}
// 8b SWITCHING COSTS
{
  const s = content("Switching costs", "Switching costs are low today — the record, escrow terms and insurer cover make leaving costly, while export stays free", "Switching-cost types per the market-entry questions (features that overcome switching costs). Our moat red-team (Oct 2026); research/fmo_strategy.md §3 (contracts 6–12 months); research/raw/uhnw_pains.md (96% rely on advisors, Flywire).");
  table(s, ["Type", "Families today", "Families with us", "Suppliers today", "Suppliers with us"], [
    ["Procedural (set-up, learning)", { text: "Low: advisors and agencies are easy to swap", options: { color: H.red } }, "Record, staff files and preferences set up once; export stays free", { text: "Low: they list everywhere", options: { color: H.red } }, "One audit and one data-rights letter, reused across every buyer"],
    ["Financial", { text: "Low", options: { color: H.red } }, "Escrowed deposits and insured cover tied to Assured suppliers (MT4)", { text: "None", options: { color: H.red } }, "Eligibility for insured deposits lost on leaving"],
    ["Relational and data", "Medium: trust in a known advisor", "Years of adviser-signed day counts; staff continuity across legs", { text: "Low", options: { color: H.red } }, "Payment and delivery history that earns better terms"],
    ["Contractual", "Staff contracts of 6–12 months", "Contracts and cover that follow the family across legs", { text: "None", options: { color: H.red } }, "Staged-escrow terms; exclusive first refusal on Jurerê peak weeks"],
  ], { colW: [2.1, 2.3, 2.95, 1.95, 2.83], fs: 9.5, rowH: 0.85 });
  callout(s, "We raise switching costs by being useful, not by locking in: export stays free and staff own their record.");
}
// 9 BUSINESS MODEL
{
  const s = content("Business model", "Four revenue lines on one family: supplier files, a take rate on bookings, a membership — and Intelligence once the record is deep enough", "Levels are ASSUMPTIONS until the trade-off interviews. research/phase4_5.md (US$500–2,000 per report); platform fees 16–30% (Brazil 2026; Italy, Direzione Hotel); merchant model from our earlier Southern Italy research; staff CALC in research/fmo_strategy.md.");
  const col = (x, w, head, big1, items, fill, hc, tc) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w, h: 3.85, fill: { color: fill }, line: { color: fill } });
    s.addText([{ text: head, options: { fontSize: 13, bold: true, color: hc, breakLine: true } }, { text: big1, options: { fontSize: 18, bold: true, color: tc } }], { x: x + 0.18, y: 2.05, w: w - 0.36, h: 1.1, margin: 0, valign: "top", isTextBox: true });
    s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })), { x: x + 0.18, y: 3.2, w: w - 0.36, h: 2.5, fontSize: 10.5, color: tc, margin: 0, valign: "top", paraSpaceAfter: 5, isTextBox: true });
  };
  col(0.6, 2.95, "Assured files", "US$500–2,000 a file", ["Ordered by family offices before a deposit", "Year 1: US$2.5–20k (CALC)", "Licensed checks later, via the co-owned vehicle"], H.gold, H.navy, H.navy);
  col(3.66, 2.95, "Take rate on bookings", "10–15%", ["Paid by suppliers, only on completed stays", "Below platforms’ 16–30%", "Or one price: 30% markup on net cost, VAT on the margin only"], H.panel, H.navy, H.text);
  col(6.72, 2.95, "Household membership", "Per family, per year", ["Fixed fee that captures surplus", "Day ledger included (£1.5k value, assumption)", "Set by trade-off interviews"], H.navy, H.gold, H.white);
  col(9.78, 2.95, "Staff + Intelligence", "Later", ["Staff: coordination and referral now; employment after its gates", "Intelligence: €0 until 120+ journeys a year per region"], H.light, H.navy, H.navy);
  callout(s, "Opposite seasons — Italy Apr–Oct, Santa Catarina Dec–Mar — keep the same families and suppliers active all year.", 6.0, 0.5);
}
// 10 UNIT ECONOMICS (honest)
{
  const s = content("Unit economics", "Files pay first, journeys follow, staff waits for its gates — year-1 revenue is small and earned", "CALC from ASSUMPTIONS: files 5–10 × US$500–2,000; journeys 10 trips × €24,300 × 10–15%; organiser licence from our earlier Southern Italy model; staff wedge research/fmo_strategy.md §5.3 (London rates).");
  const r = [["US$2.5–20k", "Assured files, year 1", "5–10 files ordered before deposits", H.gold, H.navy], ["€24.3–36.5k", "Journeys take, year 1", "10 trips at a 10–15% take, sold only after day 90", H.navy, H.white], ["€9.1k + €6–12k a year", "Organiser licence cost", "Through a licensed partner first; our own once margins cover it", H.panel, H.navy], ["−£7.6k to −£13.9k", "Staff wedge, per position-year", "Deferred: employment waits for T4 and T5", H.low, H.red]];
  r.forEach((t, i) => {
    const x = 0.6 + i * 3.06;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 2.95, h: 3.0, fill: { color: t[3] }, line: { color: t[3] } });
    s.addText([{ text: t[0], options: { fontSize: 21, bold: true, color: t[4], breakLine: true } }, { text: t[1], options: { fontSize: 13, bold: true, color: t[4], breakLine: true } }, { text: t[2], options: { fontSize: 11, color: t[4] } }], { x: x + 0.2, y: 2.1, w: 2.55, h: 2.75, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 5.2, w: 12.13, h: 0.9, fill: { color: H.navy }, line: { color: H.navy } });
  s.addText("No founder capital: costs are paid only from earned fees, margins or partner contributions; client deposits sit in segregated or escrow accounts.", { x: 0.8, y: 5.2, w: 11.8, h: 0.9, fontSize: 13, bold: true, color: H.white, margin: 0, valign: "middle", isTextBox: true });
}
// 10b VALUE
{
  const s = content("Economic value", "Economic value: US$5.0–11.5k a year at stake on a US$200k deposit — a US$500–2,000 file prices well inside it", "Economic value to the customer = next best alternative + differences (value map). CALC: US$200k × 2–5% = US$4–10k; US$1.0k + 4k = 5.0k; US$1.5k + 10k = 11.5k. Report price band from research/phase4_5.md; hours and rates are ASSUMPTIONS until the trade-off interviews. Staff value map: pages that follow.");
  const U = 0.62, x0 = 4.0;
  const bars = [["Own diligence avoided", "10 h × US$100–150 of analyst or adviser time (assumption)", 0, 1.25, "US$1.0–1.5k", H.light, H.text], ["+ Expected loss at stake", "US$200k deposit × 2–5% failure risk a year (CALC, assumption)", 1.25, 7.0, "US$4–10k", H.mid, H.white], ["= Economic value to the family", "Ceiling for the price", 0, 8.25, "US$5.0–11.5k", H.navy, H.white], ["Our price", "Per Assured file", 0, 1.25, "US$500–2,000", H.gold, H.navy], ["Our marginal cost", "4–8 analyst hours (assumption)", 0, 0.3, "US$200–400", H.panel, H.text]];
  bars.forEach((b, i) => {
    const y = 1.95 + i * 0.78;
    s.addText([{ text: b[0], options: { bold: true, color: H.navy, breakLine: true } }, { text: b[1], options: { fontSize: 9, color: H.muted } }], { x: 0.6, y, w: 3.3, h: 0.68, fontSize: 11.5, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.RECTANGLE, { x: x0 + b[2] * U, y: y + 0.12, w: Math.max(b[3] * U, 0.08), h: 0.44, fill: { color: b[5] }, line: { color: b[5] } });
    s.addText(b[4], { x: x0 + (b[2] + b[3]) * U + 0.1, y: y + 0.12, w: 1.6, h: 0.44, fontSize: 12, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
  });
  callout(s, "The family keeps most of the value: a US$500–2,000 file against US$5.0–11.5k of value — price shares the wedge, never cost-plus.", 6.0, 0.55);
}
{
  const s = content("Utility value", "Utility value: certainty, discretion, control, time and access — each measured by trade-off, never by asking", "Private Jet Card Comparisons survey; Flywire (Mar 2025; Jan 2026); Campden Wealth with Schillings (2025); research/fmo_strategy.md (needs N1–N9); Priceline (Jan 2024); The Roman Guy. Method: Trade-Off Method protocol (easy opener, unanchored X, iteration).");
  table(s, ["Utility", "Evidence it matters", "How we measure it (trade-off)", "What we offer"], [
    ["Certainty: the supplier delivers and the money is safe", "35.8% of jet-card buyers call provider stability critical; 44.1% important but hard to judge; 72% worry about payment security", "Pay the deposit as today vs Assured file + staged escrow for a fee X", "Assured file; staged escrow"],
    ["Discretion and privacy", "Close protection US$1,800–4,000 a day; 37% of family offices hit by a cyber attack in 24 months", "Share preferences with family-held keys vs keep them offline", "Private files; minimum cell of 10; no GPS"],
    ["Control over who is in the home", "Families prefer known staff and stay the employer", "Your own nanny + a named relief carer vs an agency temp, for X", "Staff coordination; named relievers"],
    ["Time and effort", "16 hours per trip; 47% say less planning would lower stress", "Three proposals in 24 hours vs today’s process, for X", "Questionnaire; one price, one payment"],
    ["Access and exclusivity", "93% say luxury is about access; 9–23× private-access premiums", "A held slot or peak week vs the standard option + X", "Held tables; Jurerê first refusal"],
  ], { colW: [2.6, 3.9, 3.2, 2.43], fs: 9.5, rowH: 0.74 });
  callout(s, "Utility is priced from switching points in face-to-face trade-off interviews — we never ask ‘what would you pay?’");
}
// 11 WAVES
{
  const s = content("Waves", "Three waves: Rome, Southern Italy and Santa Catarina first — opposite seasons, partners on the ground", "Euronews (Feb 2026: Capri); Made in Pompei (Feb 2025); The Roman Guy; Congresso em Foco (Jul 2026); NSC Total (Dec 2025); Civitatis via Brasilturis (Dec 2025). Triggers are assumptions.");
  const w = [["Wave 1", "Rome · Southern Italy · Santa Catarina", ["Rome: private access at 9–23× the standard ticket", "Southern Italy: up to 50,000 day visitors a day on Capri; Pompeii capped at 20,000", "Santa Catarina: a third of Rio’s violent-death rate; seclusion by villa and boat", "Santa Catarina and Rome first; Southern Italy once its seat is confirmed"], H.navy, H.white, H.gold], ["Wave 2", "Rest of Italy · Greece · Ibiza · the Alps", ["Trigger: Assured standard or Santa Catarina supply reaches 3", "Trigger: ≥ 20 suppliers on Assured terms per region", "Summer islands and winter ski for the same families"], H.mid, H.white, H.white], ["Wave 3", "Global", ["Trigger: repeat families across ≥ 2 regions", "Partner-led; never own homes, yachts or aircraft"], H.light, H.navy, H.navy]];
  w.forEach((t, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.9, w: 3.95, h: 4.25, fill: { color: t[3] }, line: { color: t[3] } });
    s.addText([{ text: t[0], options: { bold: true, fontSize: 22, color: t[5], breakLine: true } }, { text: t[1], options: { bold: true, fontSize: 13, color: t[4] } }], { x: x + 0.2, y: 2.0, w: 3.55, h: 1.1, margin: 0, valign: "top", isTextBox: true });
    s.addText(t[2].map((b, k) => ({ text: b, options: { bullet: true, breakLine: k < t[2].length - 1 } })), { x: x + 0.2, y: 3.15, w: 3.55, h: 2.9, fontSize: 11, color: t[4], margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  });
  callout(s, "Go region by region: a region enters the next stage only when its own gates pass.");
}
// 12 ROADMAP
{
  const s = content("Roadmap", "Prove the assured record in 90 days with no capital, pilot it with paying families in Wave 1, then scale the co-owned standard", "Strategy deck operational plan; our moat red-team (Oct 2026); research/fmo_strategy.md §8–9. Thresholds and hours are assumptions.");
  const ph = [["Days 0–90", "Validate", "Counsel note, supplier terms, files sold, insurer or broker term sheet, licensee and bundle tests. ~161 hours, no capital, no journeys sold", H.navy, H.white], ["Months 4–15", "Pilot Wave 1", "Assured files and Journeys with paying families; Jurerê first refusal; co-owned vehicle by month 12", H.mid, H.white], ["Months 16–36", "Scale", "Licensees, ledger seats, first insured line; staff employment only after T4 and T5; Wave 2 on its triggers", H.light, H.navy]];
  ph.forEach((p, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: 3.95, h: 3.6, fill: { color: p[3] }, line: { color: p[3] } });
    s.addText([{ text: p[0], options: { fontSize: 12, bold: true, color: i < 2 ? H.gold : H.goldDk, breakLine: true } }, { text: p[1], options: { fontSize: 22, bold: true, color: p[4], breakLine: true } }, { text: p[2], options: { fontSize: 12.5, color: p[4] } }], { x: x + 0.25, y: 2.15, w: 3.45, h: 3.3, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
    if (i < 2) s.addShape(pres.shapes.LINE, { x: x + 3.95, y: 3.8, w: 0.15, h: 0, line: { color: H.navy, width: 2, endArrowType: "triangle" } });
  });
  callout(s, "GO only if the counsel note, MT1, MT2 and MT4 or MT5 pass — otherwise we stop with nothing lost.", 5.8, 0.5);
}
// 12b PARTNERS
{
  const s = content("Partners", "Partners on the ground: named targets in every Wave-1 region — deposit-holding intermediaries asked to sign data rights and escrow terms", "Our earlier target lists for Rome, Southern Italy and Santa Catarina, and our Southern Italy supplier, partnership and pricing sheets (Sep 2026). Prospects, not agreements; licences, prices and MICHELIN stars confirmed at contracting.");
  table(s, ["", "Rome", "Southern Italy", "Santa Catarina"], [
    ["Stays", "Hotel de la Ville · Hotel Hassler · Six Senses Rome · Bulgari Hotel Roma", "Le Sirenuse · Il San Pietro di Positano · Monastero Santa Rosa · Capri Palace · Punta Tragara · direct villa owners", "Awasi Santa Catarina (Relais & Châteaux) · pousadas at Praia do Rosa · Jurerê houses"],
    ["Access + dining", "Vatican before opening · Colosseum underground · palazzo dinners · La Pergola · Imàgo · Il Pagliaccio", "Pompeii archaeological park (early access) · Don Alfonso 1890 · Torre del Saracino · Zass · L’Olivo · George", "P12 Parador Internacional · Café de la Musique · whale watching at Praia do Rosa (Jul–Nov) · sailing the bay"],
    ["Mobility", "Licensed NCC chauffeurs · a helicopter to the Amalfi Coast", "Muto Travel NCC · Hoverfly (Naples–Capri from ~€1,900) · Amalfi Coast Dream (yacht days from ~€4,500) · D-Marin marinas (warm contact)", "Chauffeurs · boats · a helicopter"],
    ["Local care + chefs", "To source, same vetting standard", "Amalfi Sitters · International Sitters · licensed home-care agencies · Take a Chef (client price: nanny €247, companion €221 a day)", "To source, same vetting standard"],
  ], { colW: [1.6, 3.25, 4.18, 3.1], fs: 9.5, rowH: 0.72 });
  callout(s, "One warm channel today (D-Marin marinas); every other name is a prospect, not an agreement — Le Collectionist is invited in as an Assured supplier.", 6.05, 0.6);
}
// 12c HYPOTHESES
{
  const s = content("Hypotheses", "What we prove in 90 days: each hypothesis has a pass mark set in advance, tested by interviews and real sales", "Trade-Off Method protocol (easy opener, unanchored X, iteration); our moat red-team (Oct 2026); research/fmo_strategy.md §9 (T1); pass marks are ASSUMPTIONS set before the interviews.");
  table(s, ["Hypothesis", "What must be true", "Interview or test", "Pass mark", "By"], [
    [{ text: "H1 · Assured record (lead)", options: { bold: true, color: H.navy } }, "Family offices pay for a supplier file and escrow terms before a deposit", "Trade-off interviews with family offices; 5 files offered for sale (MT2)", "≥ 3 of 5 files sell", "Day 90"],
    ["H1b · Suppliers accept", "Deposit-holding suppliers sign data rights and escrow terms", "10 supplier meetings per region (MT1)", "≥ 5 of 10 sign; most refuse a rival", "Day 60"],
    ["H1c · A co-owner exists", "An insurer or broker makes the mark a condition of cover", "Insurer and broker meetings (MT4, MT5)", "Signed term sheet, or ≥ 3 of 5 licensees", "Day 90"],
    ["H2 · Staff coordination", "Families value lawful, guaranteed staff cover above its cost", "Trade-off interviews: own nanny + named relief vs agency temp (T1)", "Value ≥ £13.6–19.9k per position-year", "Day 90"],
    ["H3 · Access and peak weeks", "Owners grant exclusive first refusal; families pay for held slots", "5 Jurerê owners; held-slot trade-off question", "≥ 3 of 5 sign", "Day 60"],
    ["H4–H5 · Ledger, journeys", "An adviser relies on our day ledger; families buy the bundle", "One tax adviser (MT3); bundle trade-off (T1)", "Written reliance; bundle valued above parts", "Day 90"],
  ], { colW: [2.35, 3.3, 3.35, 2.2, 0.93], fs: 9.5, rowH: 0.64 });
  callout(s, "We never ask ‘what would you pay?’ — every hypothesis is tested by switching points or by a real sale.");
}
// 12d CONCLUSION
{
  const s = content("Conclusion", "Conclusion: trips alone are copied — a platform can hold a moat only as the assured record its journeys run on", "Chapters 1–5 of this deck; research/moat_intelligence.md.");
  const b = [["What we conclude", "Trips alone are copied. A platform for UHNW families can hold a moat only as the assured record its journeys run on — supplier files, escrow deposit terms and the family’s own record — co-owned so bigger players license it rather than envelop it.", H.navy, H.gold, H.white], ["What must be true", "Family offices pay for files before a deposit (H1); suppliers sign data rights and escrow terms (H1b); an insurer or broker co-owns the standard (H1c). Moat 1/5 today; a narrow 3 by year 3 if these pass.", H.panel, H.navy, H.text], ["What we do next", "Interviews and real sales in 90 days, ~161 hours, no capital. GO region by region only if the tests pass; otherwise stop, or keep files as a service.", H.panel, H.navy, H.text]];
  b.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 3.95, h: 4.1, fill: { color: c[2] }, line: { color: c[2] === H.navy ? H.navy : H.line, width: 0.75 } });
    s.addText([{ text: c[0], options: { bold: true, fontSize: 16, color: c[3], breakLine: true } }, { text: c[1], options: { fontSize: 12.5, color: c[4] } }], { x: x + 0.25, y: 2.1, w: 3.45, h: 3.8, margin: 0, valign: "top", paraSpaceAfter: 10, isTextBox: true });
  });
  callout(s, "A hypothesis, not a verdict: the interviews decide.");
}
// 13 TEAM
{
  const s = content("Team", "A founder and two regional partner seats — one team across Rome, Southern Italy and Santa Catarina", "Founder profile (Oct 2026). Regional seats describe roles; partners to be confirmed.");
  const t = [["Calebe Garcia", "Founder · Santa Catarina, Brazil", ["10+ years in investment banking, corporate finance and strategy, incl. Advent International and Whirlpool", "MBA and Master of Finance (Hult)", "Portuguese, Spanish and English"], H.navy, H.white, H.gold], ["Regional partner · Rome", "Partner seat", ["Private doors and HNW client relationships in Rome", "Hospitality operations and B2B pricing", "Italian and English"], H.panel, H.navy, H.goldDk], ["Regional partner · Southern Italy", "Partner seat · to be confirmed", ["Naples, Amalfi Coast and Capri supply on the ground", "Local hosts, boats, chefs and access", "Italian"], H.panel, H.navy, H.goldDk]];
  t.forEach((p, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 3.95, h: 3.3, fill: { color: p[3] }, line: { color: i === 0 ? H.navy : H.line, width: 0.75 } });
    s.addText([{ text: p[0], options: { fontSize: 17, bold: true, color: p[4], breakLine: true } }, { text: p[1], options: { fontSize: 11, italic: true, color: p[5] } }], { x: x + 0.2, y: 2.1, w: 3.55, h: 0.9, margin: 0, isTextBox: true });
    s.addText(p[2].map((b, k) => ({ text: b, options: { bullet: true, breakLine: k < p[2].length - 1 } })), { x: x + 0.2, y: 3.05, w: 3.55, h: 2.1, fontSize: 11.5, color: p[4], margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  });
  table(s, ["We hire", "We partner"], [["An operator to run supplier files, onboarding and staff coordination", "Insurer or broker co-owner, licensed organiser, counsel, employer of record"]], { y: 5.45, colW: [6.0, 6.13], fs: 11, rowH: 0.55 });
}
// 14 ASK
{
  const s = darkSlide("The ask: a co-owner, file buyers, intermediaries and Jurerê owners in each Wave-1 region — no capital until the gate passes", "The ask");
  const a = [["1", "insurer or broker", "to co-own the Assured standard (MT4)"], ["5", "file buyers", "family offices that order a file before a deposit (MT2)"], ["10", "intermediaries per region", "who sign data rights and escrow terms (MT1)"], ["5", "Jurerê owners", "for an exclusive, paid first refusal on peak weeks"], ["1", "partner per region", "Rome and Southern Italy, alongside Santa Catarina"]];
  a.forEach((t, i) => {
    const x = 0.6 + i * 2.45;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.2, w: 2.35, h: 3.0, fill: { color: "243672" }, line: { color: "243672" } });
    s.addText([{ text: t[0], options: { fontSize: 36, bold: true, color: H.gold, breakLine: true } }, { text: t[1], options: { fontSize: 14, bold: true, color: H.white, breakLine: true } }, { text: t[2], options: { fontSize: 11, color: H.light } }], { x: x + 0.18, y: 2.35, w: 2.0, h: 2.7, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  });
  s.addText("Investors: introductions only until the day-90 GO — then we talk with measured demand, signed terms and a co-owner in hand.", { x: 0.6, y: 5.5, w: 12.1, h: 0.5, fontSize: 14, italic: true, color: H.white, margin: 0, isTextBox: true });
  s.addText("Calebe Garcia · algar.calebe@gmail.com · +1 617 949 6729", { x: 0.6, y: 6.3, w: 12.1, h: 0.4, fontSize: 12, color: H.light, margin: 0, isTextBox: true });
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
