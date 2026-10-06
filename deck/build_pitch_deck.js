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
  s.addText("One platform for exclusive journeys", { x: 5.6, y: 1.8, w: 7.1, h: 1.5, fontSize: 36, bold: true, color: H.white, margin: 0, valign: "top", isTextBox: true });
  s.addText("Trips, private access, homes — and the staff who travel with the family, lawful in every country", { x: 5.6, y: 3.45, w: 7.0, h: 1.2, fontSize: 18, color: H.light, margin: 0, valign: "top", isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: 5.6, y: 5.2, w: 1.6, h: 0 , line: { color: H.gold, width: 2 } });
  s.addText("Otium Chigi Journeys · Rome · Southern Italy · Santa Catarina · Confidential", { x: 5.6, y: 5.4, w: 7.1, h: 0.4, fontSize: 12, color: H.white, margin: 0, isTextBox: true });
  s.addNotes("Audience: regional partners, pilot families, family offices, suppliers and rails partners, and early investors. Ask: pilots and partners per region; capital only after the day-90 gate.");
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
  const s = content("Today’s workarounds", "Every vendor solves one piece — no one integrates the journey, the access, the people and the trust", "raw/alt_a–c.md and raw/fmo_competitors.md (Oct 2026); Stirling Access; agency fee schedules (2025–26); Travel Weekly (Aug 2025).");
  const cs = [["Advisors and DMCs", "~US$350 fee; ~10–12% commission", "Design the trip; not the staff, the legal status or the data"], ["Concierge clubs", "£2k–25k a year", "Open doors; outside the family’s own journey and people"], ["Staff agencies", "15–25% of salary, once", "Place a person; the family stays employer everywhere"], ["Payroll and EOR", "£276–474 a year; US$599–699 a month", "One country, or built for companies"]];
  cs.forEach((c, i) => {
    const x = 0.6 + i * 3.06;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 2.95, h: 3.4, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
    s.addText([{ text: c[0], options: { bold: true, fontSize: 15, color: H.navy, breakLine: true } }, { text: c[1], options: { bold: true, fontSize: 12, color: H.goldDk, breakLine: true } }, { text: c[2], options: { fontSize: 12, color: H.text } }], { x: x + 0.2, y: 2.1, w: 2.55, h: 2.6, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.2, y: 4.75, w: 2.55, h: 0.4, rectRadius: 0.08, fill: { color: H.low }, line: { color: H.low } });
    s.addText("One piece only", { x: x + 0.2, y: 4.75, w: 2.55, h: 0.4, fontSize: 10, bold: true, color: H.red, align: "center", valign: "middle", margin: 0, isTextBox: true });
  });
  callout(s, "The family is the only integrator today — and it pays every vendor separately.", 5.6, 0.55);
}
// 5 SOLUTION
{
  const s = darkSlide("Otium Chigi Journeys: the journey, the access, the people and the trust — in one place", "The solution");
  const p = [["Journey design + booking", "A three-minute questionnaire, three priced proposals in 24 hours, one price"], ["Access + hosting", "Held tables, private doors, crowd-smart timing and a local host in each region"], ["Staff + compliance", "Hire our vetted staff or manage your own — visas, payroll and insurance across borders"], ["Data + trust", "Preferences, residency days, health records, supplier vetting and deposit protection"]];
  p.forEach((t, i) => {
    const x = 0.6 + i * 3.06;
    const gold = i === 2;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.2, w: 2.95, h: 3.5, fill: { color: gold ? H.gold : "243672" }, line: { color: gold ? H.gold : "243672" } });
    s.addText(String(i + 1), { x: x + 0.2, y: 2.35, w: 0.8, h: 0.7, fontSize: 34, bold: true, color: gold ? H.navy : H.gold, margin: 0, isTextBox: true });
    s.addText([{ text: t[0], options: { bold: true, fontSize: 16, color: gold ? H.navy : H.white, breakLine: true } }, { text: t[1], options: { fontSize: 12, color: gold ? H.navy : H.light } }], { x: x + 0.2, y: 3.1, w: 2.55, h: 2.5, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
  });
  s.addText("We start with module 3 — families use it even before suppliers join — then add the rest on the same family, the same people and the same data.", { x: 0.6, y: 6.0, w: 12.1, h: 0.7, fontSize: 13, italic: true, color: H.white, margin: 0, isTextBox: true });
}
// 6 HOW IT WORKS (two-sided)
{
  const s = content("How it works", "A two-sided platform that is useful from day one: families come for staff and compliance, suppliers follow the families", "Operating model and platform logic: research/fmo_strategy.md §8 and the strategy deck (platform economics). Partners named are candidates, not agreements.");
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.0, w: 3.4, h: 3.6, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  s.addText([{ text: "Families", options: { bold: true, fontSize: 16, color: H.navy, breakLine: true } }, { text: "and family offices", options: { fontSize: 11, color: H.muted, breakLine: true } }, { text: "Membership per household; staff fee per position", options: { fontSize: 11.5, color: H.text } }], { x: 0.8, y: 2.15, w: 3.0, h: 3.3, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  s.addShape(pres.shapes.OVAL, { x: 4.85, y: 2.3, w: 3.6, h: 3.0, fill: { color: H.navy }, line: { color: H.navy } });
  s.addText([{ text: "Otium Chigi Journeys", options: { bold: true, fontSize: 14, color: H.white, breakLine: true } }, { text: "design · access · staff · data", options: { fontSize: 11, color: H.gold } }], { x: 4.85, y: 2.3, w: 3.6, h: 3.0, align: "center", valign: "middle", margin: 0, isTextBox: true });
  s.addShape(pres.shapes.RECTANGLE, { x: 9.33, y: 2.0, w: 3.4, h: 3.6, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  s.addText([{ text: "Suppliers", options: { bold: true, fontSize: 16, color: H.navy, breakLine: true } }, { text: "villas, hotels, hosts, access, staff", options: { fontSize: 11, color: H.muted, breakLine: true } }, { text: "Join free; pay a take rate only on completed bookings", options: { fontSize: 11.5, color: H.text } }], { x: 9.53, y: 2.15, w: 3.0, h: 3.3, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  s.addShape(pres.shapes.LINE, { x: 4.0, y: 3.8, w: 0.85, h: 0, line: { color: H.navy, width: 2, beginArrowType: "triangle", endArrowType: "triangle" } });
  s.addShape(pres.shapes.LINE, { x: 8.45, y: 3.8, w: 0.88, h: 0, line: { color: H.navy, width: 2, beginArrowType: "triangle", endArrowType: "triangle" } });
  s.addText("Rails partners — employer of record, insurance broker, immigration counsel, background checks — hold the licences; we never hold passports or give legal advice.", { x: 0.6, y: 5.8, w: 12.13, h: 0.6, fontSize: 12, italic: true, color: H.navy, margin: 0, isTextBox: true });
}
// 7 WHY NOW
{
  const s = content("Why now", "Wealth is moving, rules are tightening and family offices are multiplying", "Henley Private Wealth Migration Report 2025 (vendor projection); Home Office PQ55427 (Jun 2025); Gulf News on MOHRE actions (2022–26); Deloitte 2024; Banco Central via Economic News Brasil (Jan 2026).");
  const st = [["142k → 165k", "millionaires projected to relocate in 2025 and 2026 (Henley; vendor estimate)"], ["Jun 2025", "UK Home Office says it will reconsider the domestic-worker visa route"], ["US$21.7bn", "spent abroad by Brazilians in 2025, up 10% — Italy their most-booked country"], ["+4.9% a year", "growth in single family offices to 2030 (CALC from Deloitte)"]];
  st.forEach((t, i) => {
    const x = 0.6 + (i % 2) * 6.12, y = 1.95 + Math.floor(i / 2) * 2.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 6.0, h: 1.95, fill: { color: i === 1 ? H.navy : H.panel }, line: { color: i === 1 ? H.navy : H.line, width: 0.75 } });
    big(s, x + 0.25, y + 0.2, 5.5, t[0], t[1], { dark: i === 1, ns: 30, lh: 0.8 });
  });
}
// 8 ENVELOPMENT & COMPETITION
{
  const s = content("Competition", "We envelop single-function rivals by bundling them around the family’s own people and data", "Envelopment per the network-markets framework; raw/fmo_competitors.md and raw/alt_a–c.md (Oct 2026); our positioning assessment.");
  const X0 = 1.2, Y0 = 1.95, W = 6.6, Hh = 4.1;
  s.addShape(pres.shapes.RECTANGLE, { x: X0, y: Y0, w: W, h: Hh, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  s.addShape(pres.shapes.LINE, { x: X0 + W / 2, y: Y0, w: 0, h: Hh, line: { color: H.line, width: 0.75, dashType: "dash" } });
  s.addShape(pres.shapes.LINE, { x: X0, y: Y0 + Hh / 2, w: W, h: 0, line: { color: H.line, width: 0.75, dashType: "dash" } });
  s.addText("Breadth of the journey covered →", { x: X0, y: Y0 + Hh + 0.05, w: W, h: 0.3, fontSize: 10.5, bold: true, color: H.muted, align: "center", margin: 0, isTextBox: true });
  s.addText("People and legal status covered ↑", { x: 0.3, y: Y0 - 0.32, w: 4, h: 0.3, fontSize: 10.5, bold: true, color: H.muted, margin: 0, isTextBox: true });
  const pts = [["Staff agencies", 0.18, 0.55, H.light, H.text], ["Payroll / EOR", 0.15, 0.3, H.light, H.text], ["Morgan & Mallet", 0.3, 0.72, H.mid, H.white], ["Concierge clubs", 0.55, 0.15, H.light, H.text], ["Advisors and DMCs", 0.78, 0.28, H.light, H.text], ["Booking platforms", 0.6, 0.42, H.light, H.text], ["Otium Chigi Journeys", 0.8, 0.85, H.navy, H.white]];
  pts.forEach((p) => {
    const cx = X0 + p[1] * W, cy = Y0 + (1 - p[2]) * Hh, w = p[0].length > 16 ? 1.95 : 1.6;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx - w / 2, y: cy - 0.2, w, h: 0.4, rectRadius: 0.1, fill: { color: p[3] }, line: { color: H.white, width: 1 } });
    s.addText(p[0], { x: cx - w / 2, y: cy - 0.2, w, h: 0.4, fontSize: 10, bold: true, color: p[4], align: "center", valign: "middle", margin: 0, isTextBox: true });
  });
  card(s, 8.3, 1.95, 4.43, 4.1, "Honest about envelopment", "Bigger platforms could do it to us: card issuers and banks, advisor networks, booking platforms.\n\nOur defence: partner with them — white-label staff and compliance — and stay where they cannot: the family’s own staff, legal status and private access.", { hs: 13, fs: 12, dark: true });
}
// 9 BUSINESS MODEL
{
  const s = content("Business model", "Three revenue lines on one family: a membership, a take rate on bookings and a fee per staff position", "Benchmarks: platform fees 16–30% (Brazil 2026; Italy, Direzione Hotel); merchant model from our earlier Southern Italy model; advisor commissions ~10–12%; agency fees 15–25%. Levels are assumptions until the trade-off interviews; staff break-even is CALC (research/fmo_strategy.md).");
  const col = (x, w, head, big1, items, fill, hc, tc) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w, h: 3.85, fill: { color: fill }, line: { color: fill } });
    s.addText([{ text: head, options: { fontSize: 14, bold: true, color: hc, breakLine: true } }, { text: big1, options: { fontSize: 22, bold: true, color: tc } }], { x: x + 0.2, y: 2.05, w: w - 0.4, h: 1.1, margin: 0, valign: "top", isTextBox: true });
    s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })), { x: x + 0.2, y: 3.25, w: w - 0.4, h: 2.45, fontSize: 11.5, color: tc, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  };
  col(0.6, 3.95, "Household membership", "Per family, per year", ["Fixed fee that captures surplus", "Access to all modules", "Set by trade-off interviews"], H.navy, H.gold, H.white);
  col(4.69, 3.95, "Take rate on bookings", "10–15% (assumption)", ["Paid by suppliers, only on completed stays", "Below platforms’ 16–30%", "€2.4–3.6k on a €24k family trip (CALC)", "Or one price: 30% markup on net cost, VAT on the margin only"], H.panel, H.navy, H.text);
  col(8.78, 3.95, "Staff + compliance", "Per position-year", ["Break-even £30.6–31.4k at 15 positions (CALC)", "Premiums for speed and reach", "Discounts for notice and calendars"], H.light, H.navy, H.navy);
  callout(s, "Opposite seasons — Italy Apr–Oct, Santa Catarina Dec–Mar — keep the same staff and the same families active all year.", 6.0, 0.5);
}
// 10 UNIT ECONOMICS (honest)
{
  const s = content("Unit economics", "The wedge must pay first: what families pay for guaranteed, lawful staff cover is the number our 90-day test measures", "research/fmo_strategy.md §5.3–5.5 (CALC, £ per position-year, 5 positions per reliever); temp rate from one ad (weak); assistant hours are an assumption. Priced on London rates; Wave-1 rates measured in the 90-day test.");
  const unit = 0.24, x0 = 3.5;
  const bars = [["What families can save today", "Temps + assistant time", 14.25, "£11.5–17.0k", H.light, H.text], ["Our cost per position", "Reliever, employer, recruiting, capital", 25.0, "£24.6–25.4k", H.gold, H.text], ["Break-even fee, year 3", "15 positions incl. fixed costs", 31.0, "£30.6–31.4k", H.navy, H.white]];
  bars.forEach((b, i) => {
    const y = 2.05 + i * 1.0;
    s.addText([{ text: b[0], options: { bold: true, color: H.navy, breakLine: true } }, { text: b[1], options: { fontSize: 9.5, color: H.muted } }], { x: 0.6, y, w: 2.8, h: 0.8, fontSize: 12, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.RECTANGLE, { x: x0, y: y + 0.12, w: b[2] * unit, h: 0.56, fill: { color: b[4] }, line: { color: b[4] } });
    s.addText(b[3], { x: x0 + 0.1, y: y + 0.12, w: 2.0, h: 0.56, fontSize: 13, bold: true, color: b[5], margin: 0, valign: "middle", isTextBox: true });
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 5.15, w: 12.13, h: 0.95, fill: { color: H.navy }, line: { color: H.navy } });
  s.addText("The value we must prove: £13.6–19.9k per position-year for the guarantee, continuity and lawful status — about what families already pay staff to travel (£16.5–23.6k). Bookings and membership add revenue on top only once both sides are on.", { x: 0.8, y: 5.15, w: 11.8, h: 0.95, fontSize: 13, bold: true, color: H.white, margin: 0, valign: "middle", isTextBox: true });
}
// 11 WAVES
{
  const s = content("Waves", "Three waves: Rome, Southern Italy and Santa Catarina first — opposite seasons, partners on the ground", "Euronews (Feb 2026: Capri); Made in Pompei (Feb 2025); The Roman Guy; Congresso em Foco (Jul 2026); NSC Total (Dec 2025); Civitatis via Brasilturis (Dec 2025). Triggers are assumptions.");
  const w = [["Wave 1", "Rome · Southern Italy · Santa Catarina", ["Rome: private access at 9–23× the standard ticket", "Southern Italy: up to 50,000 day visitors a day on Capri; Pompeii capped at 20,000", "Santa Catarina: a third of Rio’s violent-death rate; seclusion by villa and boat", "Regional partner in each"], H.navy, H.white, H.gold], ["Wave 2", "Rest of Italy · Greece · Ibiza · the Alps", ["Trigger: Wave-1 staff wedge at economic profit ≥ 0", "Trigger: ≥ 20 live suppliers per Wave-1 region", "Summer islands and winter ski for the same families"], H.mid, H.white, H.white], ["Wave 3", "Global", ["Trigger: repeat families across ≥ 2 regions", "Partner-led; never own homes, yachts or aircraft"], H.light, H.navy, H.navy]];
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
  const s = content("Roadmap", "Prove the wedge in 90 days with no capital, pilot it with paying families in Wave 1, then add the other modules", "Strategy deck validation plan and research/fmo_strategy.md §8–9. Thresholds are assumptions; pass marks for the family test and paid pilots derive from the economics.");
  const ph = [["Days 0–90", "Validate", "9 tests, ~160 hours, no capital. Kill gates: lawful route and employer route. Family trade-off interviews. Suppliers signed per region", H.navy, H.white], ["Months 4–15", "Pilot Wave 1", "Staff + compliance with 2–3 paying families per region; first suppliers live; deposits cover the cash outlay", H.mid, H.white], ["Months 16–36", "Add modules", "Journey design, booking and access on the same families; data layer; then Wave 2 on its triggers", H.light, H.navy]];
  ph.forEach((p, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.0, w: 3.95, h: 3.6, fill: { color: p[3] }, line: { color: p[3] } });
    s.addText([{ text: p[0], options: { fontSize: 12, bold: true, color: i < 2 ? H.gold : H.goldDk, breakLine: true } }, { text: p[1], options: { fontSize: 22, bold: true, color: p[4], breakLine: true } }, { text: p[2], options: { fontSize: 12.5, color: p[4] } }], { x: x + 0.25, y: 2.15, w: 3.45, h: 3.3, margin: 0, valign: "top", paraSpaceAfter: 8, isTextBox: true });
    if (i < 2) s.addShape(pres.shapes.LINE, { x: x + 3.95, y: 3.8, w: 0.15, h: 0, line: { color: H.navy, width: 2, endArrowType: "triangle" } });
  });
  callout(s, "Go only if every gate passes and the measured value makes economic profit positive — otherwise we stop with nothing lost.", 5.8, 0.5);
}
// 12b PARTNERS
{
  const s = content("Partners", "Partners on the ground: named targets in every Wave-1 region — prospects today, signed with free content for net rates", "Our earlier target lists for Rome, Southern Italy and Santa Catarina, and our Southern Italy supplier, partnership and pricing sheets (Sep 2026). Prospects, not agreements; verify licences, prices and MICHELIN stars before contracting.");
  table(s, ["", "Rome", "Southern Italy", "Santa Catarina"], [
    ["Stays", "Hotel de la Ville · Hotel Hassler · Six Senses Rome · Bulgari Hotel Roma", "Le Sirenuse · Il San Pietro di Positano · Monastero Santa Rosa · Capri Palace · Punta Tragara · direct villa owners", "Awasi Santa Catarina (Relais & Châteaux) · pousadas at Praia do Rosa · Jurerê houses"],
    ["Access + dining", "Vatican before opening · Colosseum underground · palazzo dinners · La Pergola · Imàgo · Il Pagliaccio", "Pompeii archaeological park (early access) · Don Alfonso 1890 · Torre del Saracino · Zass · L’Olivo · George", "P12 Parador Internacional · Café de la Musique · whale watching at Praia do Rosa (Jul–Nov) · sailing the bay"],
    ["Mobility", "Licensed NCC chauffeurs · a helicopter to the Amalfi Coast", "Muto Travel NCC · Hoverfly (Naples–Capri from ~€1,900) · Amalfi Coast Dream (yacht days from ~€4,500) · D-Marin marinas (warm contact)", "Chauffeurs · boats · a helicopter"],
    ["Local care + chefs", "To source, same vetting standard", "Amalfi Sitters · International Sitters · licensed home-care agencies · Take a Chef (client price: nanny €247, companion €221 a day)", "To source, same vetting standard"],
  ], { colW: [1.6, 3.25, 4.18, 3.1], fs: 9.5, rowH: 0.8 });
  callout(s, "One warm channel today (D-Marin marinas); every other name is a target to sign before the pilot.", 5.75, 0.5);
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
  table(s, ["We hire", "We partner"], [["An operator to run relief scheduling, staff welfare and supplier onboarding", "Employer of record, insurance broker, immigration counsel, background-check rails"]], { y: 5.45, colW: [6.0, 6.13], fs: 11, rowH: 0.55 });
}
// 14 ASK
{
  const s = darkSlide("The ask: a partner, pilot families and suppliers in each Wave-1 region — no capital until the gate passes", "The ask");
  const a = [["1", "partner per region", "Rome and Southern Italy, alongside Santa Catarina"], ["2–3", "pilot families per region", "who pay a deposit for staff + compliance"], ["20", "supplier letters per region", "from our named target lists; net rates for free content, paid only on stays"], ["3", "rails partners", "counsel, employer of record, insurance broker"]];
  a.forEach((t, i) => {
    const x = 0.6 + i * 3.06;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.2, w: 2.95, h: 3.0, fill: { color: "243672" }, line: { color: "243672" } });
    s.addText([{ text: t[0], options: { fontSize: 40, bold: true, color: H.gold, breakLine: true } }, { text: t[1], options: { fontSize: 15, bold: true, color: H.white, breakLine: true } }, { text: t[2], options: { fontSize: 11.5, color: H.light } }], { x: x + 0.2, y: 2.35, w: 2.55, h: 2.7, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  });
  s.addText("Investors: we talk after day 90, with measured demand, signed pilots and cleared routes in hand.", { x: 0.6, y: 5.5, w: 12.1, h: 0.5, fontSize: 14, italic: true, color: H.white, margin: 0, isTextBox: true });
  s.addText("Calebe Garcia · algar.calebe@gmail.com · +1 617 949 6729", { x: 0.6, y: 6.3, w: 12.1, h: 0.4, fontSize: 12, color: H.light, margin: 0, isTextBox: true });
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
