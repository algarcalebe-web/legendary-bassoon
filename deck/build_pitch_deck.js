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
  s.addText("The family mobility office", { x: 5.6, y: 1.8, w: 7.1, h: 1.4, fontSize: 38, bold: true, color: H.white, margin: 0, valign: "top", isTextBox: true });
  s.addText("Trusted household staff who travel with the family — employed, insured and lawful in every country they go", { x: 5.6, y: 3.4, w: 7.0, h: 1.3, fontSize: 18, color: H.light, margin: 0, valign: "top", isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: 5.6, y: 5.2, w: 1.6, h: 0, line: { color: H.gold, width: 2 } });
  s.addText("Otium Chigi Journeys · Confidential", { x: 5.6, y: 5.4, w: 7.0, h: 0.4, fontSize: 12, color: H.white, margin: 0, isTextBox: true });
  s.addNotes("Audience: pilot families, family offices, channel and rails partners, and early investors. The ask is pilots and partners, not capital: investment only after the day-90 gate.");
}
// 2 PROBLEM
{
  const s = content("The problem", "Wealthy families move across borders — their trusted staff cannot follow them lawfully", "Morgan & Mallet, Beyond The Butler 2025/26 and agency pages (read 2026-10-06); GOV.UK Overseas Domestic Worker visa (2026); Home Office PQ55427 (Jun 2025); UAE Decree-Law 9/2022.");
  const st = [["2.36%", "of one agency’s childcare candidates can work rotations; 4.82% travel regularly"], ["6 months", "maximum UK stay for a domestic worker — and 12 months’ prior work for the same employer is required"], ["AED 50k–200k", "UAE fine for illegally employing a domestic worker (about US$13.6–54.5k)"], ["25–40%", "travel premium families already pay staff to move with them"]];
  st.forEach((t, i) => {
    const x = 0.6 + i * 3.06;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 2.95, h: 3.0, fill: { color: i === 0 ? H.navy : H.panel }, line: { color: i === 0 ? H.navy : H.line, width: 0.75 } });
    big(s, x + 0.2, 2.15, 2.6, t[0], t[1], { dark: i === 0, ns: 26, lh: 1.6 });
  });
  s.addText("Every move creates an immigration, employment and liability question — and today the family answers it alone, trip by trip.", { x: 0.6, y: 5.25, w: 12.13, h: 0.8, fontSize: 15, bold: true, color: H.navy, margin: 0, isTextBox: true });
}
// 3 WHO
{
  const s = content("Who feels it", "Multi-home families and the family offices that run them: few in number, very high in stakes", "Altrata World Ultra Wealth Report 2026; Knight Frank Wealth Report 2026; Deloitte Family Office Landscape 2024; UBS Global Family Office Report 2024; Morgan & Mallet 2025/26.");
  const st = [["557–714k", "ultra-high-net-worth people (US$30M+), about three homes each"], ["8,030 → 10,720", "single family offices, 2024 → 2030 (Deloitte)"], ["~47%", "of family offices offer no lifestyle services today (UBS)"], ["£55–110k", "a year for a travelling nanny in the UK; US$70–150k in the US"]];
  st.forEach((t, i) => big(s, 0.6 + i * 3.06, 2.0, 2.9, t[0], t[1], { ns: 24, lh: 1.2 }));
  table(s, ["Customer", "The job they need done"], [
    ["Multi-home family with a family office", "Staff every home and trip lawfully, without adding headcount or employer exposure"],
    ["Family run by the principal or an assistant", "The same trusted people in each home — and no gap when someone quits or a border says no"],
    ["Visiting family bringing its own staff", "Bring staff in lawfully; cover their days off"],
  ], { y: 4.15, colW: [4.0, 8.13], fs: 11, rowH: 0.5 });
}
// 4 TODAY
{
  const s = content("Today’s workarounds", "Families stitch together agencies, temps and payroll — no one employs travelling staff and clears every border", "raw/fmo_competitors.md (Oct 2026); agency fee schedules (2025–26); temp rate from one ad (weak); Nannytax and Deel/Remote pricing (2026-10-06).");
  const cs = [["Placement agencies", "15–25% of salary, once", "Find the person; the family stays employer in every country"], ["Temp desks", "£300–400 a day (London)", "Short-notice cover, one city, no cross-border cover"], ["Household payroll", "£276–474 a year", "One country; no relief, no visas"], ["Corporate EOR", "US$599–699 a month", "Built for companies; domestic workers not found"]];
  cs.forEach((c, i) => {
    const x = 0.6 + i * 3.06;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 2.95, h: 3.4, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
    s.addText([{ text: c[0], options: { bold: true, fontSize: 15, color: H.navy, breakLine: true } }, { text: c[1], options: { bold: true, fontSize: 13, color: H.goldDk, breakLine: true } }, { text: c[2], options: { fontSize: 12, color: H.text } }], { x: x + 0.2, y: 2.1, w: 2.55, h: 2.6, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.2, y: 4.75, w: 2.55, h: 0.4, rectRadius: 0.08, fill: { color: H.low }, line: { color: H.low } });
    s.addText("Does not travel with the family", { x: x + 0.2, y: 4.75, w: 2.55, h: 0.4, fontSize: 10, bold: true, color: H.red, align: "center", valign: "middle", margin: 0, isTextBox: true });
  });
  callout(s, "The closest rival, Morgan & Mallet, places staff and runs employer services in four countries — but runs no shared pool that rotates.", 5.6, 0.55);
}
// 5 SOLUTION
{
  const s = darkSlide("Keep your nanny. Add guaranteed cover — lawful on every leg.", "The solution");
  const p = [["Relief club", "An employed, vetted reliever your family has met, covering days off, holidays and gaps — guaranteed within 7 days, 72 hours or 24 hours"], ["Compliance coordination", "Counsel-led visas for each leg, a payroll check and liability and medical cover bound before travel — we coordinate, licensed partners advise"], ["Staff-owned record", "A portable, verified vetting record that follows the staff member — free to staff, accepted by employers"]];
  p.forEach((t, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.2, w: 3.9, h: 3.6, fill: { color: "243672" }, line: { color: "243672" } });
    s.addText(String(i + 1), { x: x + 0.25, y: 2.4, w: 0.8, h: 0.7, fontSize: 36, bold: true, color: H.gold, margin: 0, isTextBox: true });
    s.addText([{ text: t[0], options: { bold: true, fontSize: 18, color: H.white, breakLine: true } }, { text: t[1], options: { fontSize: 13, color: H.light } }], { x: x + 0.25, y: 3.15, w: 3.4, h: 2.5, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
  });
  s.addText("The family keeps employing its regular staff. We employ the relievers — so nothing changes for the people they already trust.", { x: 0.6, y: 6.1, w: 12.1, h: 0.6, fontSize: 13, italic: true, color: H.white, margin: 0, isTextBox: true });
}
// 6 HOW
{
  const s = content("How it works", "One membership per position: we employ, clear, insure and cover — partners hold the licences", "Operating model in research/fmo_strategy.md §8. Partners named are candidates, not agreements.");
  const st = [["1", "Join", "Membership per staff position; travel calendar shared"], ["2", "Meet", "A vetted reliever is introduced to the family"], ["3", "Clear", "Counsel clears each foreign leg in writing"], ["4", "Insure", "Liability and trip-medical cover bound before travel"], ["5", "Cover", "Relief arrives within the tier’s response time"]];
  st.forEach((t, i) => {
    const x = 0.6 + i * 2.45;
    s.addShape(pres.shapes.OVAL, { x: x + 0.7, y: 2.0, w: 0.9, h: 0.9, fill: { color: H.navy }, line: { color: H.navy } });
    s.addText(t[0], { x: x + 0.7, y: 2.0, w: 0.9, h: 0.9, fontSize: 22, bold: true, color: H.gold, align: "center", valign: "middle", margin: 0, isTextBox: true });
    if (i < 4) s.addShape(pres.shapes.LINE, { x: x + 1.65, y: 2.45, w: 1.5, h: 0, line: { color: H.line, width: 1.5, endArrowType: "triangle" } });
    s.addText([{ text: t[1], options: { bold: true, fontSize: 15, color: H.navy, breakLine: true } }, { text: t[2], options: { fontSize: 11.5, color: H.text } }], { x: x + 0.1, y: 3.05, w: 2.1, h: 1.3, align: "center", margin: 0, valign: "top", isTextBox: true });
  });
  table(s, ["We own", "Partners provide", "We never"], [
    ["Relief scheduling, reliever contracts, welfare monitoring, the staff record", "Employer of record, insurance broker, immigration counsel, background-check rails", "Hold passports, give legal advice, or own homes, yachts or aircraft"],
  ], { y: 4.6, colW: [4.04, 4.04, 4.05], fs: 11, rowH: 0.75 });
}
// 7 WHY NOW
{
  const s = content("Why now", "Wealth is moving, rules are tightening and family offices are multiplying", "Henley Private Wealth Migration Report 2025 (vendor projection); Home Office PQ55427 (Jun 2025); Gulf News on MOHRE actions (2022–26); Deloitte 2024; Altrata 2026.");
  const st = [["142k → 165k", "millionaires projected to relocate in 2025 and 2026 (Henley; vendor estimate)"], ["Jun 2025", "UK Home Office says it will reconsider the domestic-worker visa route"], ["153", "UAE employers acted against for domestic-worker swaps; fines up to AED 50,000"], ["+4.9% a year", "growth in single family offices to 2030 (CALC from Deloitte)"]];
  st.forEach((t, i) => {
    const x = 0.6 + (i % 2) * 6.12, y = 1.95 + Math.floor(i / 2) * 2.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 6.0, h: 1.95, fill: { color: i === 1 ? H.navy : H.panel }, line: { color: i === 1 ? H.navy : H.line, width: 0.75 } });
    big(s, x + 0.25, y + 0.2, 5.5, t[0], t[1], { dark: i === 1, ns: 30, lh: 0.8 });
  });
}
// 8 BUSINESS MODEL
{
  const s = content("Business model", "A membership per staff position: a base, premiums for speed and reach, discounts for what families give us back", "research/fmo_strategy.md §5.6 and §6. Break-even fee and discount ceilings are CALC; fixed costs £90k a year (assumption).");
  const col = (x, w, head, items, fill, hc, tc) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w, h: 3.85, fill: { color: fill }, line: { color: fill } });
    s.addText(head, { x: x + 0.2, y: 2.05, w: w - 0.4, h: 0.45, fontSize: 15, bold: true, color: hc, margin: 0, isTextBox: true });
    s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })), { x: x + 0.2, y: 2.6, w: w - 0.4, h: 3.1, fontSize: 12, color: tc, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  };
  col(0.6, 3.95, "Base membership", ["Planned relief from an employed reliever", "Replacement guarantee", "Compliance coordination for cleared legs", "Staff-owned record"], H.navy, H.gold, H.white);
  col(4.69, 3.95, "Premiums", ["Faster response: 72 h or 24 h", "Dedicated reliever", "Extra jurisdictions at partner cost", "Peak-season cover"], H.panel, H.navy, H.text);
  col(8.78, 3.95, "Discounts", ["12-month travel calendar", "90 days’ notice", "Billing in advance", "Multi-year contract; referrals"], H.light, H.navy, H.text);
  callout(s, "Break-even: £30.6–31.4k per position-year at 15 positions — the target for year 3 (CALC).", 6.0, 0.5);
}
// 9 ECONOMICS (honest)
{
  const s = content("Unit economics", "The economics hinge on one number: what families pay for guaranteed, lawful cover — our 90-day test measures it", "research/fmo_strategy.md §5.3–5.5 (CALC, £ per position-year, 5 positions per reliever); temp rate from one ad (weak); assistant hours are an assumption.");
  const unit = 0.24, x0 = 3.5;
  const bars = [["What families can save today", "Temps + assistant time", 14.25, "£11.5–17.0k", H.light, H.text], ["Our cost per position", "Reliever, employer, recruiting, capital", 25.0, "£24.6–25.4k", H.gold, H.text], ["Break-even fee, year 3", "15 positions incl. fixed costs", 31.0, "£30.6–31.4k", H.navy, H.white]];
  bars.forEach((b, i) => {
    const y = 2.05 + i * 1.0;
    s.addText([{ text: b[0], options: { bold: true, color: H.navy, breakLine: true } }, { text: b[1], options: { fontSize: 9.5, color: H.muted } }], { x: 0.6, y, w: 2.8, h: 0.8, fontSize: 12, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.RECTANGLE, { x: x0, y: y + 0.12, w: b[2] * unit, h: 0.56, fill: { color: b[4] }, line: { color: b[4] } });
    s.addText(b[3], { x: x0 + 0.1, y: y + 0.12, w: 2.0, h: 0.56, fontSize: 13, bold: true, color: b[5], margin: 0, valign: "middle", isTextBox: true });
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 5.15, w: 12.13, h: 0.95, fill: { color: H.navy }, line: { color: H.navy } });
  s.addText("The value we must prove: £13.6–19.9k per position-year for the guarantee, continuity and lawful status — about what families already pay staff to travel (£16.5–23.6k).", { x: 0.8, y: 5.15, w: 11.8, h: 0.95, fontSize: 14, bold: true, color: H.white, margin: 0, valign: "middle", isTextBox: true });
}
// 10 COMPETITION
{
  const s = content("Competition", "No one combines an employed rotating pool with cross-border compliance — the corner we take", "raw/fmo_competitors.md (Oct 2026); our positioning assessment.");
  const X0 = 1.2, Y0 = 1.95, W = 6.6, Hh = 4.1;
  s.addShape(pres.shapes.RECTANGLE, { x: X0, y: Y0, w: W, h: Hh, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  s.addShape(pres.shapes.LINE, { x: X0 + W / 2, y: Y0, w: 0, h: Hh, line: { color: H.line, width: 0.75, dashType: "dash" } });
  s.addShape(pres.shapes.LINE, { x: X0, y: Y0 + Hh / 2, w: W, h: 0, line: { color: H.line, width: 0.75, dashType: "dash" } });
  s.addText("Cross-border compliance →", { x: X0, y: Y0 + Hh + 0.05, w: W, h: 0.3, fontSize: 10.5, bold: true, color: H.muted, align: "center", margin: 0, isTextBox: true });
  s.addText("Employed relief pool ↑", { x: 0.3, y: Y0 - 0.32, w: 3, h: 0.3, fontSize: 10.5, bold: true, color: H.muted, margin: 0, isTextBox: true });
  const pts = [["Temp desks", 0.2, 0.62, H.light, H.text], ["Travel-nanny apps", 0.12, 0.35, H.light, H.text], ["Household payroll", 0.35, 0.12, H.light, H.text], ["Placement agencies", 0.45, 0.25, H.light, H.text], ["Morgan & Mallet", 0.72, 0.3, H.mid, H.white], ["Corporate EOR", 0.85, 0.08, H.light, H.text], ["Otium Chigi Journeys", 0.8, 0.82, H.navy, H.white]];
  pts.forEach((p) => {
    const cx = X0 + p[1] * W, cy = Y0 + (1 - p[2]) * Hh, w = p[0].length > 16 ? 1.9 : 1.6;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx - w / 2, y: cy - 0.2, w, h: 0.4, rectRadius: 0.1, fill: { color: p[3] }, line: { color: H.white, width: 1 } });
    s.addText(p[0], { x: cx - w / 2, y: cy - 0.2, w, h: 0.4, fontSize: 10, bold: true, color: p[4], align: "center", valign: "middle", margin: 0, isTextBox: true });
  });
  card(s, 8.3, 1.95, 4.43, 4.1, "Honest about the moat", "Morgan & Mallet could copy within 12–24 months (assumption) and has a lower cost base.\n\nOur answer is speed, owning the reliever contracts, and partnering where it pays — not a claim of a permanent moat.", { hs: 13, fs: 12, dark: true });
}
// 11 GO TO MARKET
{
  const s = content("Go-to-market", "London first, through the people families already trust — foreign legs only once counsel clears them", "research/fmo_strategy.md §2.2, §2.5, §11. Channels are candidates; London chosen because the evidence is densest there.");
  table(s, ["Step", "What", "Why"], [
    ["1 · Channel", "Family-office directories, private banks, multi-family offices, agencies with unfilled rota roles", "Trust ranks first in household hiring (72% of family offices, UBS 2025)"],
    ["2 · Base city", "London; staff with UK work rights", "Densest evidence; UK route rules are known"],
    ["3 · Cleared legs", "France and the UAE only after written counsel opinions", "No leg is sold before it is lawful"],
    ["4 · References", "2–3 paid pilot families with deposits", "In an NDA market, references travel by word of mouth"],
    ["5 · Expand", "More relievers and positions; then the staff record and a residency day-count ledger", "Each step has its own trigger"],
  ], { colW: [1.9, 5.6, 4.63], fs: 11.5, rowH: 0.75 });
}
// 12 ROADMAP
{
  const s = content("Roadmap", "Prove it in 90 days with no capital, pilot it with paying families, then scale to 15 positions", "research/fmo_strategy.md §8–9. Thresholds are assumptions; pass marks for the family test and paid pilots are derived from the economics.");
  const ph = [["Days 0–90", "Validate", "9 tests, ~160 hours, no capital. Kill gates: lawful route and employer route. Family trade-off interviews (n = 12). 2 paid pilots signed", H.navy, H.white], ["Months 4–15", "Pilot", "1 reliever, 4–6 positions, 2–3 families; deposits cover the cash outlay", H.mid, H.white], ["Months 16–36", "Scale", "3 relievers, 15 positions; ≥ 68% utilisation; economic profit ≥ 0", H.light, H.navy]];
  ph.forEach((p, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: 3.95, h: 3.6, fill: { color: p[3] }, line: { color: p[3] } });
    s.addText([{ text: p[0], options: { fontSize: 12, bold: true, color: i < 2 ? H.gold : H.goldDk, breakLine: true } }, { text: p[1], options: { fontSize: 22, bold: true, color: p[4], breakLine: true } }, { text: p[2], options: { fontSize: 12.5, color: p[4] } }], { x: x + 0.25, y: 2.15, w: 3.45, h: 3.3, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
    if (i < 2) s.addShape(pres.shapes.LINE, { x: x + 3.95, y: 3.8, w: 0.15, h: 0, line: { color: H.navy, width: 2, endArrowType: "triangle" } });
  });
  callout(s, "Go only if every gate passes and the measured value makes economic profit positive — otherwise we stop with nothing lost.", 5.8, 0.5);
}
// 13 TEAM
{
  const s = content("Team", "Two founders across Brazil and Rome — finance and pricing on one side, HNW clients and hospitality on the other", "Founders’ LinkedIn profiles and résumé (Oct 2026).");
  const t = [["Calebe Garcia", "Santa Catarina, Brazil", ["10+ years in investment banking, corporate finance and strategy, incl. Advent International and Whirlpool", "MBA and Master of Finance (Hult)", "Portuguese, Spanish and English"]], ["Francesco Ficorilli", "Rome, Italy", ["Luxury real-estate advisor at Berkshire Hathaway HomeServices: historic palazzi and HNW clients", "Founder of Monster Burger and Monster Hospitality Group (12 years in hospitality); co-founder of GRAFF (B2B pricing)", "MBA and MS Finance (Hult); Italian and English"]]];
  t.forEach((p, i) => {
    const x = 0.6 + i * 6.12;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 6.0, h: 3.3, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
    s.addText([{ text: p[0], options: { fontSize: 20, bold: true, color: H.navy, breakLine: true } }, { text: p[1], options: { fontSize: 12, italic: true, color: H.goldDk } }], { x: x + 0.25, y: 2.1, w: 5.5, h: 0.85, margin: 0, isTextBox: true });
    s.addText(p[2].map((b, k) => ({ text: b, options: { bullet: true, breakLine: k < p[2].length - 1 } })), { x: x + 0.25, y: 3.0, w: 5.5, h: 2.1, fontSize: 12, color: H.text, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  });
  table(s, ["We hire", "We partner"], [["An operator to run relief scheduling and staff welfare", "Employer of record, insurance broker, immigration counsel, background-check rails"]], { y: 5.45, colW: [6.0, 6.13], fs: 11, rowH: 0.55 });
}
// 14 ASK
{
  const s = darkSlide("The ask: three pilot families, one channel, three partners — no capital until the gate passes", "The ask");
  const a = [["2–3", "pilot families", "who pay a deposit for a London relief membership"], ["1", "vouching channel", "a family-office directory, private bank or multi-family office"], ["3", "rails partners", "employment or immigration counsel, an employer of record, an insurance broker"]];
  a.forEach((t, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.2, w: 3.9, h: 3.0, fill: { color: "243672" }, line: { color: "243672" } });
    s.addText([{ text: t[0], options: { fontSize: 44, bold: true, color: H.gold, breakLine: true } }, { text: t[1], options: { fontSize: 18, bold: true, color: H.white, breakLine: true } }, { text: t[2], options: { fontSize: 12.5, color: H.light } }], { x: x + 0.25, y: 2.35, w: 3.4, h: 2.7, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  });
  s.addText("Investors: we talk after day 90, with measured demand, signed pilots and cleared routes in hand.", { x: 0.6, y: 5.5, w: 12.1, h: 0.5, fontSize: 14, italic: true, color: H.white, margin: 0, isTextBox: true });
  s.addText("Calebe Garcia · algar.calebe@gmail.com · +1 617 949 6729", { x: 0.6, y: 6.3, w: 12.1, h: 0.4, fontSize: 12, color: H.light, margin: 0, isTextBox: true });
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
