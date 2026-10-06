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
    { placeholder: { options: { name: "kicker", type: "body", x: 0.6, y: 0.32, w: 12.1, h: 0.3, fontSize: 10, bold: true, color: C.accent4, charSpacing: 2, margin: 0, valign: "middle", align: "left" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.62, w: 12.1, h: 0.95, fontSize: 22, bold: true, color: C.text2, margin: 0, valign: "top", align: "left" }, text: "" } },
    { line: { x: 0.6, y: 1.62, w: 12.13, h: 0, line: { color: H.line, width: 1 } } },
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

// ---------- 1 COVER ----------
section("Opening");
{
  const s = pres.addSlide({ masterName: "DARK", sectionTitle: sec });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 4.4, h: 7.5, fill: { color: "14213F" }, line: { color: "14213F" } });
  s.addText([{ text: "WORKING TITLE", options: { fontSize: 11, bold: true, color: H.gold, charSpacing: 3, breakLine: true } },
    { text: "Private Travel Assurance", options: { fontSize: 26, bold: true, color: H.white, breakLine: true } },
    { text: "Name to be decided", options: { fontSize: 12, italic: true, color: H.light } }],
    { x: 0.5, y: 2.8, w: 3.5, h: 1.8, margin: 0, valign: "top", isTextBox: true });
  s.addText("STRATEGY DECK · OCTOBER 2026", { x: 5.0, y: 1.2, w: 7.6, h: 0.35, fontSize: 11, bold: true, color: H.gold, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText("The richest travellers pay most to avoid risk, not research. No one protects the money and trust they hand to private-travel suppliers", { x: 5.0, y: 1.7, w: 7.6, h: 2.3, fontSize: 26, bold: true, color: H.white, margin: 0, valign: "top", isTextBox: true });
  s.addText("A problem-first study of affluent and ultra-high-net-worth leisure travel: what the pains cost, what travellers resort to, where every option fails, and one breakthrough with a moat", { x: 5.0, y: 4.15, w: 7.6, h: 1.0, fontSize: 13, color: H.light, margin: 0, valign: "top", isTextBox: true });
  s.addText([{ text: "Calebe Garcia · prepared for Francesco Ficorilli", options: { breakLine: true } }, { text: "Discussion document · Confidential", options: { color: H.light } }], { x: 5.0, y: 5.9, w: 7.6, h: 0.7, fontSize: 12, color: H.white, margin: 0, isTextBox: true });
  s.addNotes("This deck replaces the earlier corridor strategy. It starts from the problem, tests the core claim, and only then screens solutions outside-in. Founder fit was not used to rank options.");
}

// ---------- 2 EXEC SUMMARY ----------
{
  const s = content("Executive summary", "Executive summary", "pages that follow; figures are dated and sourced on each page and in the appendix.");
  const rows = [
    ["The claim, tested", "Planning is costly — 16 hours per trip (Priceline, Jan 2024, n = 3,024) — but affluent travellers already pay advisors to remove it. The ‘long interview’ is contradicted: discovery calls run 15–45 minutes."],
    ["Where the pain really is", "For ultra-high-net-worth (UHNW) travellers the best-evidenced pains are solvency, supplier legitimacy, privacy and security. JetSuite owed card holders ~US$50M (2020); OneFlight put ~US$150M of deposits at risk (Sep 2026)."],
    ["What they already pay", "Heavily for privacy and for someone to vouch: private airport suites US$3,550–4,850 a visit; close protection US$1,800–4,000 a day; charter brokers’ 10–20% markup."],
    ["Where every option fails", "Risk stays with the traveller; providers keep failing; safety audits (ARGUS, Wyvern) ignore solvency; no scheme protects deposits across providers."],
    ["The breakthrough", "Counterparty assurance for private travel: a solvency-and-legitimacy standard (stage 1, capital-light), then insured deposit protection with an insurer (stage 2). Scores 16/20 outside-in. Its wedge: buyers value certainty at their loss exposure; each report costs us little."],
    ["Next 90 days", "A free failure tracker, one paid due-diligence pilot, 10 suppliers to a verified badge and insurer feedback; go/no-go at day 90, with no capital at risk."],
  ];
  rows.forEach((r, i) => {
    const y = 1.85 + i * 0.8;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 2.9, h: 0.72, fill: { color: i === 4 ? H.navy : H.panel }, line: { color: i === 4 ? H.navy : H.panel } });
    s.addText(r[0], { x: 0.75, y, w: 2.65, h: 0.72, fontSize: 12, bold: true, color: i === 4 ? H.white : H.navy, margin: 0, valign: "middle", isTextBox: true });
    s.addText(r[1], { x: 3.65, y, w: 9.05, h: 0.72, fontSize: 11, color: H.text, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.LINE, { x: 3.65, y: y + 0.76, w: 9.08, h: 0, line: { color: H.line, width: 0.75 } });
  });
}

// ---------- 3 CONTENTS ----------
{
  const s = content("Contents", "Contents", null);
  const items = [
    ["1", "The problem, proven: the claim tested, the pain map, UHNW pains and what they already pay", "4–7"],
    ["2", "What travellers resort to, and where every option fails", "8–10"],
    ["3", "Unmet needs and breakthrough hypotheses, screened for novelty and moat", "11–14"],
    ["4", "Can it win? How to win, six forces, funnel, rivals, advantage, competences, position", "15–22"],
    ["5", "Capturing value: value map, monetization, services and the trade-off interview guide", "23–26"],
    ["6", "Validation (operational strategy), partners and investors, risks and questions", "27–30"],
    ["", "Appendix: sources", "31"],
  ];
  items.forEach((it, i) => {
    const y = 1.95 + i * 0.62;
    s.addText(it[0], { x: 0.6, y, w: 0.5, h: 0.5, fontSize: 20, bold: true, color: H.gold, margin: 0, valign: "middle", isTextBox: true });
    s.addText(it[1], { x: 1.2, y, w: 9.8, h: 0.5, fontSize: 14, color: it[0] ? H.text : H.muted, italic: !it[0], margin: 0, valign: "middle", isTextBox: true });
    s.addText(it[2], { x: 11.3, y, w: 1.4, h: 0.5, fontSize: 12, color: H.muted, align: "right", margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.LINE, { x: 0.6, y: y + 0.56, w: 12.13, h: 0, line: { color: H.line, width: 0.5 } });
  });
}

// ---------- SECTION 1 ----------
section("1 · The problem, proven");
{
  const s = content("1 · The problem, proven", "The core claim, tested: planning costs real time, but the ‘long interview’ is a myth and the pain is already served",
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
  const s = content("1 · The problem, proven", "The pain map: the frequent pains are mild and already served; the severe ones are rare",
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
  const s = content("1 · The problem, proven", "For ultra-high-net-worth travellers the evidenced pains are solvency, legitimacy, privacy and security — not planning",
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
  const s = content("1 · The problem, proven", "What the pains already cost: UHNW travellers pay most for privacy, protection and someone to vouch for a supplier",
    "PS and travelextra (2026); Executive Traveller (Windsor Suite); security and protection price guides (2025–26); private-charter market reports (2025, two agree); broker and MYBA terms; PinnacleCare; Altrata World Ultra Wealth Report 2025 via Black Enterprise; K&R broker quotes. Figures from search summaries except PS and Windsor pages.");
  const stats = [
    ["US$3,550–4,850", "per visit to a private airport suite (PS, LAX/ATL); Heathrow’s Windsor Suite from £3,812"],
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

// ---------- SECTION 2 ----------
section("2 · What they resort to");
{
  const s = content("2 · What they resort to", "No alternative handles supplier and deposit risk well — the gap every option leaves open",
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
{
  const s = content("2 · What they resort to", "Five failure patterns cut across every alternative",
    "Travel Weekly (Aug 2025); Quintessentially accounts 2019/20 (BDO going-concern note); Inspirato and Exclusive Resorts announcements (Dec 2025–Feb 2026); Wheels Up FY2025; ARGUS, Wyvern, IS-BAO; Private Jet Card Comparisons; Harris Poll for Preferred Hotels (2025, n ≈ 503, search summary only).");
  const pats = [
    ["1 · Risk stays with the traveller", "Fees and deposits of US$100k–1M are paid up front; no one guarantees the outcome."],
    ["2 · Providers are fragile", "Quintessentially’s going-concern flag; Inspirato sold for ~US$59M of equity; Wheels Up lost US$82.3M in 2025."],
    ["3 · Trust is certified for safety, not solvency", "ARGUS, Wyvern and IS-BAO audit operations; the leading jet-card comparison site says it does not vet financials."],
    ["4 · Demand for help exceeds use", "84% say an advisor beats internet research, yet advisors handled 17% of past trips (weak)."],
    ["5 · Each pain is bought separately", "Jets, yachts, security, medical and privacy come from different vendors; preference data sits in silos at card issuers, banks and networks."],
  ];
  pats.forEach((p, i) => {
    const y = 1.9 + i * 0.84;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w: 12.13, h: 0.74, fill: { color: i < 3 ? H.panel : H.bg }, line: { color: H.line, width: 0.75 } });
    s.addText(p[0], { x: 0.8, y, w: 4.3, h: 0.74, fontSize: 13, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    s.addText(p[1], { x: 5.2, y, w: 7.4, h: 0.74, fontSize: 11.5, color: H.text, margin: 0, valign: "middle", isTextBox: true });
  });
  callout(s, "Patterns 1–3 point at the same gap: nobody independent stands between the buyer and the supplier’s balance sheet.");
}
{
  const s = content("2 · What they resort to", "Asset-heavy aggregators lose money or get absorbed; the asset-light advisor model wins",
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
// ---------- SECTION 3 ----------
section("3 · Unmet needs and hypotheses");
{
  const s = content("3 · Unmet needs and hypotheses", "Unmet needs: two UHNW needs score high on importance, low on every alternative — and carry visible money at stake",
    "Our assessment (1–10) from Phases 1–3; Private Jet Card Comparisons survey (n = 594); price sources as on page 7. An unmet need counts only with evidence that people pay.");
  const X0 = 1.3, Y0 = 1.95, W = 6.6, Hh = 3.85, xmin = 1, xmax = 10, ymin = 5, ymax = 10;
  const px = (v) => X0 + ((v - xmin) / (xmax - xmin)) * W, py = (v) => Y0 + Hh - ((v - ymin) / (ymax - ymin)) * Hh;
  s.addShape(pres.shapes.RECTANGLE, { x: X0, y: Y0, w: W, h: Hh, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  s.addShape(pres.shapes.RECTANGLE, { x: X0, y: Y0, w: px(5.5) - X0, h: py(7.5) - Y0, fill: { color: "E3E9F3" }, line: { color: H.mid, width: 1, dashType: "dash" } });
  s.addText("Unmet zone: important, poorly served", { x: X0 + 0.1, y: Y0 + 0.06, w: 3.0, h: 0.3, fontSize: 9.5, bold: true, italic: true, color: H.navy, margin: 0, isTextBox: true });
  [2, 4, 6, 8, 10].forEach((v) => s.addText(String(v), { x: px(v) - 0.2, y: Y0 + Hh + 0.04, w: 0.4, h: 0.25, fontSize: 9, color: H.muted, align: "center", margin: 0, isTextBox: true }));
  s.addText("How well the best alternative meets it (1–10) →", { x: X0, y: Y0 + Hh + 0.3, w: W, h: 0.28, fontSize: 10, bold: true, color: H.muted, align: "center", margin: 0, isTextBox: true });
  [6, 7, 8, 9, 10].forEach((v) => s.addText(String(v), { x: X0 - 0.45, y: py(v) - 0.13, w: 0.35, h: 0.26, fontSize: 9, color: H.muted, align: "right", margin: 0, isTextBox: true }));
  s.addText("Importance ↑", { x: 0.45, y: Y0 - 0.32, w: 1.3, h: 0.28, fontSize: 10, bold: true, color: H.muted, margin: 0, isTextBox: true });
  const pts = [["Deposit safety", 3, 9, 1], ["Supplier solvency, legitimacy", 5, 9, 1], ["Movement privacy", 4, 8, 2], ["Physical security", 7, 8, 0, 0], ["Medical continuity", 8.6, 8.6, 0, 1], ["Trip as promised", 3, 7, 2], ["Sold-out access", 7, 7, 0], ["Peer recommendations", 6, 6, 2]];
  pts.forEach((p) => {
    const f = p[3] === 1 ? H.navy : p[3] === 2 ? H.mid : H.light;
    s.addShape(pres.shapes.OVAL, { x: px(p[1]) - 0.14, y: py(p[2]) - 0.14, w: 0.28, h: 0.28, fill: { color: f }, line: { color: H.white, width: 1 } });
    if (p[4]) s.addText(p[0], { x: px(p[1]) - 2.48, y: py(p[2]) - 0.15, w: 2.3, h: 0.3, fontSize: 9.5, color: H.navy, align: "right", margin: 0, isTextBox: true });
    else s.addText(p[0], { x: px(p[1]) + 0.18, y: py(p[2]) - 0.15, w: 2.3, h: 0.3, fontSize: 9.5, bold: p[3] === 1, color: H.navy, margin: 0, isTextBox: true });
  });
  card(s, 8.4, 1.95, 4.33, 1.85, "Deposit safety · unmet", "Deposits of US$100k–1M; 35.8% of jet-card buyers call provider stability ‘critical’, 44.1% ‘important but hard to know’. Best alternative: optional escrow (3).", { hs: 12, fs: 10.5, dark: true });
  card(s, 8.4, 3.95, 4.33, 1.85, "Supplier solvency · unmet", "Safety audits cover aviation only and ignore finances (5). Buyers already pay brokers 10–20% partly to vouch for suppliers.", { hs: 12, fs: 10.5 });
  callout(s, "Unmet and paid for: deposit safety and supplier solvency. Everything else is served or lacks evidence of payment.");
}
{
  const s = content("3 · Unmet needs and hypotheses", "We screened 22 ideas for novelty and moat: most already exist or are easy to copy",
    "Novelty checks by web search (Oct 2026), summaries only; ‘not found’ means not found in those searches. Full list of 22 with closest players in the research files.");
  const v = (t, strong) => ({ text: t, options: strong ? { bold: true, color: H.navy } : {} });
  table(s, ["Idea", "Novelty (closest players)", "Moat"], [
    [v("Insured deposit protection for private travel", true), v("Partly: operator escrow optional; no cross-provider scheme or startup found", true), v("Licence + insurer + loss data", true)],
    [v("Solvency-and-legitimacy standard for suppliers", true), v("Partly: ARGUS, Wyvern, IS-BAO cover safety only; nothing for yachts, villas, concierges", true), v("Standard + two-sided network + data", true)],
    ["Wealth-verified peer recommendation network", "Partly: Indagare, ASMALLWORLD", "Network, contestable"],
    ["Insurer-underwritten trip-outcome guarantee", "Partly: HNW policies cover loss, not experience", "Coverholder licence"],
    ["Per-trip movement-privacy service", "Partly: 360 Privacy, free FAA programmes", "Weak: copyable"],
    ["Family-office risk office", "Exists: Crisis24, Global Guardian, International SOS", "–"],
    ["Portable staff and crew credential", "Exists for yacht crew (CrewPass, £199 a check)", "Network"],
    ["Itinerary audit / AI verification", "Exists cheaply (US$99–200)", "None"],
    ["Refundable planning fee", "Not found — but copyable in a contract", "None"],
    ["Private palazzo access, trip tender, home exchange", "Exist (Bellini Travel; Zicasso; ThirdHome)", "Weak"],
    ["Rome–Santa Catarina curator (earlier concept)", "Exists in form: advisors and destination agencies", "None"],
  ], { colW: [4.0, 5.3, 2.83], fs: 10.5, rowH: 0.4 });
  callout(s, "Only two ideas are both new to the market and hard to copy — and they reinforce each other.");
}
{
  const s = content("3 · Unmet needs and hypotheses", "Six UHNW hypotheses: what must be true, and the cheapest test that could prove each one wrong",
    "Novelty checks by web search (Oct 2026), summaries only; tests are our design and need no capital.");
  table(s, ["#", "Hypothesis", "Pain removed, and how", "What must be true", "Zero-capital first test"], [
    ["U1", { text: "Insured deposit protection", options: { bold: true, color: H.navy } }, "Deposit loss: money held in trust or insured across providers", "An insurer writes capacity; sellers offer it at checkout", "3 underwriter meetings; 1 letter of intent"],
    ["U2", { text: "Solvency-and-legitimacy standard", options: { bold: true, color: H.navy } }, "Unknown supplier risk: independent audit and rating", "Suppliers disclose financials; buyers trust the badge", "10 suppliers pay an audit fee"],
    ["U3", "Per-trip movement privacy", "Exposure: tail privacy, nominee bookings, data removal per trip", "Travellers pay beyond free FAA programmes", "5 paid privacy audits"],
    ["U4", "Family-office risk office", "Fragmented security, medical and vetting", "Offices switch from incumbent security firms", "None: already served — dropped"],
    ["U5", "Portable credential for nannies, drivers, chefs", "Unvetted household staff on the move", "Agencies and families accept one credential", "3 agencies agree to a pilot"],
    ["U6", "Insured trip-outcome guarantee", "Trip not delivered as promised", "An insurer prices experience risk; buyers pay a premium", "10 trade-off interviews; 1 insurer conversation"],
  ], { colW: [0.5, 2.6, 3.3, 3.1, 2.63], fs: 10.5, rowH: 0.62 });
  callout(s, "U1 and U2 survive the screen; U3 becomes a module; U4 is served; U5 and U6 lack evidence of payment.");
}
{
  const s = content("3 · Unmet needs and hypotheses", "Shortlist, scored outside-in: counterparty assurance leads; the earlier curator concept fails the moat test",
    "Our assessment. Criteria 1–5: pain severity × frequency, gap vs best alternative, evidence of willingness to pay, hard to copy. Moat gate: 3 or more. Founder fit and capital were not scored; they appear on page 21 as facts.");
  const cols = [H.navy, H.mid, H.light, H.gold], names = ["Severity", "Gap", "WTP evidence", "Moat"];
  names.forEach((n, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 4.4 + i * 1.6, y: 1.85, w: 0.22, h: 0.22, fill: { color: cols[i] }, line: { color: cols[i] } });
    s.addText(n, { x: 4.7 + i * 1.6, y: 1.8, w: 1.3, h: 0.3, fontSize: 10, color: H.text, margin: 0, isTextBox: true });
  });
  s.addText("Total / 20", { x: 10.95, y: 1.8, w: 0.8, h: 0.3, fontSize: 9.5, bold: true, color: H.muted, margin: 0, isTextBox: true });
  s.addText("Moat gate", { x: 11.85, y: 1.8, w: 0.9, h: 0.3, fontSize: 9.5, bold: true, color: H.muted, margin: 0, isTextBox: true });
  const rows = [["Counterparty assurance (standard + deposit protection)", [4, 5, 3, 4], 1], ["Verified peer network", [3, 3, 4, 3], 1], ["Insurer-underwritten outcome guarantee", [3, 4, 2, 3], 1], ["Movement privacy per trip", [3, 3, 4, 2], 0], ["Family-office risk office (already served)", [3, 2, 4, 3], 1], ["Pay-per-trip family-office desk", [3, 3, 4, 2], 0], ["Itinerary audit / AI verification", [3, 4, 2, 1], 0], ["Rome–Santa Catarina curator", [3, 1, 4, 1], 0]];
  const unit = 0.32;
  rows.forEach((r, i) => {
    const y = 2.3 + i * 0.49, lead = i === 0;
    s.addText(r[0], { x: 0.6, y, w: 3.7, h: 0.38, fontSize: 10.5, bold: lead, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    let x = 4.4;
    r[1].forEach((v, k) => { s.addShape(pres.shapes.RECTANGLE, { x, y: y + 0.04, w: v * unit, h: 0.3, fill: { color: cols[k] }, line: { color: H.bg, width: 0.5 } }); x += v * unit; });
    const tot = r[1].reduce((a, b) => a + b, 0);
    s.addText(String(tot), { x: x + 0.08, y, w: 0.6, h: 0.38, fontSize: 12, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 11.9, y: y + 0.05, w: 0.75, h: 0.28, rectRadius: 0.08, fill: { color: r[2] ? H.navy : H.low }, line: { color: r[2] ? H.navy : H.low } });
    s.addText(r[2] ? "Pass" : "Fail", { x: 11.9, y: y + 0.05, w: 0.75, h: 0.28, fontSize: 9.5, bold: true, color: r[2] ? H.white : H.red, align: "center", valign: "middle", margin: 0, isTextBox: true });
  });
  callout(s, "Even the leader scores 16/20 and rests on inferred willingness to pay — which is exactly what the tests on page 27 must prove.");
}
// ---------- SECTION 4 ----------
section("4 · Can it win?");
{
  const s = content("4 · Can it win?", "How to win: clear buyers’ minimum requirements, then meet an unmet need better — judged by the value–cost wedge, not a label",
    "Deneffe: to win, meet minimum requirements, then meet an important unmet need better, meet an existing need at lower cost, or remove what customers value below its cost. Generic labels prove nothing. Our assessment.");
  card(s, 0.6, 1.9, 4.6, 4.2, "Minimum requirements buyers will check", "• Ratings that withstand legal challenge\n• Independence: no commissions from rated suppliers\n• Confidentiality and data security\n• Claims backed by a licensed insurer\n• A published, credible methodology\n\nStatus: none exists yet; each is built with a partner (counsel, insurer, methodology advisers).", { hs: 13, fs: 11.5 });
  table(s, ["Route to win", "Applied to counterparty assurance", "Verdict"], [
    ["Meet an important unmet need better", "Solvency and deposit safety that no alternative covers (best score 3–5)", { text: "Primary route", options: { bold: true, color: H.navy } }],
    ["Meet an existing need at lower cost", "Replace part of the broker’s 10–20% vouching markup with a badge", "Secondary"],
    ["Remove what customers value below its cost", "Drop per-deal lawyer and accountant checks on each provider", "Possible"],
  ], { x: 5.4, y: 1.9, w: 7.33, colW: [2.3, 3.6, 1.43], fs: 10.5, rowH: 0.75 });
  s.addText([{ text: "The wedge: ", options: { bold: true, color: H.navy } }, { text: "buyers’ willingness to pay is anchored on the deposit they could lose; our marginal cost per report or badge is analyst time, and claims sit with the insurer. Wide if the standard is adopted; zero if it is not." }],
    { x: 5.4, y: 5.0, w: 7.33, h: 1.1, fontSize: 11.5, color: H.text, margin: 0, isTextBox: true });
  callout(s, "We do not conclude with ‘differentiation’: the case stands or falls on that wedge.");
}
{
  const s = content("4 · Can it win?", "Six forces: a small market in heads but large in stakes, with no rival in solvency today — and barriers that only rise once we are in",
    "Private-charter market reports (2025); Knight Frank Wealth Report (713,626 UHNW people); Wheels Up, Inspirato, Exclusive Resorts disclosures; MYBA; ARGUS, Wyvern; Private Jet Card Comparisons. Forces read forward-looking, market size first (Deneffe).");
  s.addText([{ text: "Market defined: ", options: { bold: true, color: H.navy } }, { text: "assurance on prepaid private-travel spend — jet cards and memberships, charter, yacht charter, villa and club deposits — for UHNW families, family offices and private banks." }],
    { x: 0.6, y: 1.8, w: 12.13, h: 0.5, fontSize: 12, color: H.text, margin: 0, isTextBox: true });
  table(s, ["Force", "Pressure on margins", "Evidence", "Looking ahead"], [
    ["1 · Size and growth", rate("Medium"), "~US$16bn charter (2025); 713,626 UHNW people; thousands of card and club members (Wheels Up 6,166 active; Inspirato 10,700)", "Grows with every new failure in the news"],
    ["2 · Substitutes", rate("Medium"), "Optional operator escrow; yacht stakeholder accounts; broker vouching; lawyers", "Escrow spreads, but stays operator by operator"],
    ["3 · Entry barriers", rate("Low today, high once built"), "Coverholder licence, insurer capacity, rating reputation, loss data", "First mover sets the standard"],
    ["4 · Buyer power", rate("Medium–high"), "Few, sophisticated family offices and banks", "Lower once the standard is adopted"],
    ["5 · Supplier power", rate("High at the start"), "Insurers hold capacity; operators may refuse audits", "Falls as buyers ask for the badge"],
    ["6 · Rivalry", rate("Low now"), "No one rates solvency; ARGUS, Wyvern and the comparison site could extend", "Rises if the model proves out"],
  ], { y: 2.4, colW: [2.0, 2.0, 5.1, 3.03], fs: 10.5, rowH: 0.52 });
  callout(s, "Attractive if we get in first: the barriers that protect an incumbent here are the ones we would build.");
}
{
  const s = content("4 · Can it win?", "Six forces across the shortlist: assurance is the most attractive; the peer network faces the strongest substitutes",
    "Our assessment, forward-looking; market evidence as on pages 7, 16 and the research files. Size of the peer-network market not measured.");
  table(s, ["Force", "Counterparty assurance", "Verified peer network", "Outcome guarantee"], [
    ["1 · Size and growth", rate("Medium: ~US$16bn charter; deposits US$100k–1M each"), rate("Medium: paid networks at US$395–2,850 a year"), rate("Large market, but a feature")],
    ["2 · Substitutes", rate("Medium: optional escrow, brokers, lawyers"), rate("High: forums, AI, advisors, paid networks"), rate("High: insurance, card protection")],
    ["3 · Entry barriers", rate("High once built: licence, standard, data"), rate("Medium once dense"), rate("Low: a contract clause")],
    ["4 · Buyer power", rate("Medium–high"), rate("Medium"), rate("Medium")],
    ["5 · Supplier power", rate("High at the start: insurers"), rate("Medium: members are the content"), rate("High: insurer and partners")],
    ["6 · Rivalry", rate("Low now"), rate("Medium"), rate("Medium")],
    [{ text: "Outlook", options: { bold: true } }, { text: "Medium–high", options: { bold: true, color: H.navy } }, { text: "Medium", options: { bold: true } }, { text: "Low on its own", options: { bold: true } }],
  ], { colW: [2.2, 3.5, 3.3, 3.13], fs: 10.5, rowH: 0.55 });
  callout(s, "Only assurance has barriers that rise with success — the reason it leads.");
}
{
  const s = content("4 · Can it win?", "Market funnel: the accessible slice is reached through banks, family offices and brokers — not direct",
    "Knight Frank Wealth Report; Private Jet Card Comparisons survey (n = 594); realistic share is our hypothesis for the first 12 months.");
  const steps = [
    ["Total", "UHNW and HNW families prepaying private travel: jet cards, charter, yachts, villas, clubs", 12.1],
    ["Potential", "Those committing US$100k+ deposits; 35.8% call provider stability ‘critical’ and 44.1% ‘important but hard to know’", 10.0],
    ["Accessible", "Clients of partner private banks, family offices and brokers who adopt the standard", 7.6],
    ["Realistic, 12 months", "5–10 paid reports · 10 badged suppliers · 1 insurer term sheet (hypothesis)", 5.2],
  ];
  steps.forEach((st, i) => {
    const y = 1.95 + i * 1.0, w = st[2], x = 0.6 + (12.13 - w) / 2;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 0.85, fill: { color: [H.light, H.mid, H.navy, H.gold][i] }, line: { color: H.bg } });
    s.addText([{ text: st[0] + " · ", options: { bold: true } }, { text: st[1] }], { x: x + 0.2, y, w: w - 0.4, h: 0.85, fontSize: 11.5, color: i === 0 || i === 3 ? H.text : H.white, margin: 0, valign: "middle", align: "center", isTextBox: true });
  });
  callout(s, "Reputation is the gate: win reference partners first, then the buyers come through them.");
}
{
  const s = content("4 · Can it win?", "Rivals: able to copy, mostly unwilling today — so partner with the ones who could extend fastest",
    "Our assessment of each rival’s ability and willingness to imitate, from the novelty checks (Oct 2026).");
  table(s, ["Rival", "What it does today", "Able to copy?", "Willing?", "Our response"], [
    ["ARGUS, Wyvern, IS-BAO", "Safety and legitimacy audits of operators and brokers", "Yes", "Possibly: solvency is outside their remit", "Partner: add solvency to their audits"],
    ["Private Jet Card Comparisons", "Compares 50+ jet-card programmes; does not vet financials", "Yes", "Possibly", "Data partner or acquirer"],
    ["Yacht-broker associations (MYBA)", "Hold charter money in stakeholder accounts", "Partly", "For yachts only", "Extend the same logic to villas and clubs"],
    ["HNW insurers, Lloyd’s syndicates", "Annual HNW travel policies; charter cancellation cover", "Yes, with data", "Only with loss data", "Supply the data; they supply capacity"],
    ["Security and risk firms", "Family-office security, medical, cyber", "Partly", "Unlikely: no financial analysis", "Distribution partner"],
    ["Rating agencies", "Corporate credit ratings", "Yes", "No: market too small", "Methodology advisers"],
  ], { colW: [2.5, 3.4, 1.3, 2.3, 2.63], fs: 10.5, rowH: 0.55 });
  callout(s, "The window is open because no one combines solvency, legitimacy and deposit protection — it closes once an auditor or insurer moves.");
}
{
  const s = content("4 · Can it win?", "Sources of advantage: the only option whose moat stacks pre-emption, a two-sided network and proprietary data",
    "Deneffe: two vehicles to an as-long-as-possible advantage (pre-emption, capabilities); Eisenmann, Parker & Van Alstyne, ‘Strategies for Two-Sided Markets’, HBR (2006). Our assessment.");
  card(s, 0.6, 1.9, 5.9, 1.95, "Pre-emption", "Be the first reference standard; sign insurer capacity exclusively; badge the best suppliers first, so buyers ask for the badge by name.", { hs: 14, fs: 12 });
  card(s, 0.6, 4.0, 5.9, 1.95, "Capabilities", "Credit analysis of private suppliers; a loss database no one else holds, which prices the protection. Each claim and audit makes the data harder to copy.", { hs: 14, fs: 12 });
  s.addText("Network-effects test (three winner-take-all conditions)", { x: 6.8, y: 1.9, w: 5.9, h: 0.35, fontSize: 13, bold: true, color: H.navy, margin: 0, isTextBox: true });
  table(s, ["Condition", "Holds?"], [
    ["High multi-homing cost for one side", { text: "Partly: suppliers can hold several badges; buyers adopt one standard", options: {} }],
    ["Strong positive network effects", { text: "Yes: more badged suppliers → more subscribers → more suppliers", options: { bold: true, color: H.navy } }],
    ["Limited demand for differentiated features", { text: "Yes: a standard is valuable because it is one", options: { bold: true, color: H.navy } }],
  ], { x: 6.8, y: 2.35, w: 5.93, colW: [2.4, 3.53], fs: 10.5, rowH: 0.62 });
  s.addText("Playbook: marquee suppliers first; subsidise the supplier side early; watch envelopment by an insurer or card issuer bundling it.", { x: 6.8, y: 5.25, w: 5.93, h: 0.8, fontSize: 11.5, italic: true, color: H.text, margin: 0, isTextBox: true });
  callout(s, "Not guaranteed to be sustainable — but it is the only option where scale could tilt toward winner-take-most.");
}
{
  const s = content("4 · Can it win?", "Competences: credit analysis and pricing are strengths; auditing, licensing and defensible ratings must be partnered",
    "Our assessment; LinkedIn profiles and résumé (Oct 2026). Base: needed to stay in business · Key: differentiating today · Pacing: could differentiate tomorrow. Reported as facts; not used in the ranking.");
  const heads = [["We know how to…", 0.6, 4.2], ["Type", 4.9, 0.8], ["Our position", 5.8, 2.3], ["Evidence or route", 8.3, 4.43]];
  heads.forEach((h) => s.addText(h[0], { x: h[1], y: 1.85, w: h[2], h: 0.3, fontSize: 10.5, bold: true, color: H.navy, margin: 0, isTextBox: true }));
  s.addShape(pres.shapes.LINE, { x: 0.6, y: 2.18, w: 12.13, h: 0, line: { color: H.navy, width: 1.75 } });
  s.addText("Less than fav. → Clear leader", { x: 5.8, y: 2.2, w: 2.4, h: 0.22, fontSize: 8, italic: true, color: H.muted, margin: 0, isTextBox: true });
  const rows = [["analyse private-company financials and credit risk", "Key", 3, "Calebe: 10+ years in investment banking, corporate finance and private equity (Advent International)"], ["price risk and B2B offers", "Key", 3, "Francesco: co-founder of GRAFF (B2B pricing); Calebe: corporate finance"], ["serve HNW clients discreetly", "Base", 2, "Francesco: luxury real estate for HNW clients; 12 years in hospitality"], ["audit aviation, yacht and villa operations", "Key", 1, "Partner with existing auditors"], ["distribute insurance under a licence", "Base", 1, "Via a Lloyd’s coverholder or managing general agent"], ["publish ratings that withstand legal challenge", "Key", 1, "Counsel and rating-methodology advisers"], ["earn the trust of buyers who have never heard of us", "Pacing", 1, "Reference partners; a public failure tracker"]];
  const lab = ["", "Less than favourable", "Competitive average", "Favourable", "Clear leader"];
  rows.forEach((r, i) => {
    const y = 2.45 + i * 0.53;
    s.addText(r[0], { x: 0.6, y, w: 4.2, h: 0.48, fontSize: 10.5, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    s.addText(r[1], { x: 4.9, y, w: 0.8, h: 0.48, fontSize: 10.5, color: H.text, margin: 0, valign: "middle", isTextBox: true });
    for (let k = 1; k <= 4; k++) s.addShape(pres.shapes.OVAL, { x: 5.8 + (k - 1) * 0.3, y: y + 0.15, w: 0.18, h: 0.18, fill: { color: k <= r[2] ? (r[2] === 1 ? H.red : H.navy) : H.bg }, line: { color: r[2] === 1 && k <= r[2] ? H.red : H.navy, width: 0.75 } });
    s.addText(lab[r[2]], { x: 7.05, y, w: 1.2, h: 0.48, fontSize: 9, color: r[2] === 1 ? H.red : H.navy, margin: 0, valign: "middle", isTextBox: true });
    s.addText(r[3], { x: 8.3, y, w: 4.43, h: 0.48, fontSize: 10, color: H.text, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.LINE, { x: 0.6, y: y + 0.5, w: 12.13, h: 0, line: { color: H.line, width: 0.5 } });
  });
  callout(s, "Time is the hard constraint: about one hour a day each fits research and partner work, not round-the-clock service.");
}
{
  const s = content("4 · Can it win?", "Strategic position: lead with counterparty assurance; keep the peer network as an option; exit the curator concept",
    "Strategic Position Analysis, our first hypothesis. Attractiveness: size, growth, willingness to pay, competition, ease of reach. Position: the offer’s ability to meet needs vs rivals. Bubble size: rough expected revenue.");
  const X0 = 1.6, Y0 = 1.95, W = 7.2, Hh = 4.2;
  s.addShape(pres.shapes.RECTANGLE, { x: X0, y: Y0, w: W, h: Hh, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
  s.addShape(pres.shapes.LINE, { x: X0 + W / 2, y: Y0, w: 0, h: Hh, line: { color: H.line, width: 0.75, dashType: "dash" } });
  s.addShape(pres.shapes.LINE, { x: X0, y: Y0 + Hh / 2, w: W, h: 0, line: { color: H.line, width: 0.75, dashType: "dash" } });
  [["Opportunistic", X0 + 0.1, Y0 + 0.08], ["Offensive", X0 + W - 1.6, Y0 + 0.08], ["Disinvest", X0 + 0.1, Y0 + Hh - 0.4], ["Defensive", X0 + W - 1.6, Y0 + Hh - 0.4]].forEach((q) =>
    s.addText(q[0], { x: q[1], y: q[2], w: 1.5, h: 0.3, fontSize: 10, italic: true, color: H.muted, margin: 0, align: q[0] === "Offensive" || q[0] === "Defensive" ? "right" : "left", isTextBox: true }));
  s.addText("Attractiveness ↑", { x: 0.4, y: Y0 + 1.6, w: 1.1, h: 0.9, fontSize: 10, color: H.muted, margin: 0, isTextBox: true });
  s.addText("Weak  ·  Tenable  ·  Favourable  ·  Strong   — Competitive position →", { x: X0, y: Y0 + Hh + 0.05, w: W, h: 0.3, fontSize: 10, color: H.muted, align: "center", margin: 0, isTextBox: true });
  const bub = [["A", 0.66, 0.78, 1.0, H.navy, H.white], ["B", 0.48, 0.55, 0.7, H.mid, H.white], ["C", 0.3, 0.6, 0.55, H.light, H.text], ["D", 0.28, 0.42, 0.5, H.light, H.text], ["E", 0.2, 0.22, 0.6, H.low, H.text]];
  bub.forEach((b) => {
    const cx = X0 + b[1] * W, cy = Y0 + (1 - b[2]) * Hh;
    s.addShape(pres.shapes.OVAL, { x: cx - b[3] / 2, y: cy - b[3] / 2, w: b[3], h: b[3], fill: { color: b[4] }, line: { color: H.white, width: 1 } });
    s.addText(b[0], { x: cx - 0.3, y: cy - 0.2, w: 0.6, h: 0.4, fontSize: 14, bold: true, color: b[5], align: "center", margin: 0, isTextBox: true });
  });
  const leg = [["A", "Counterparty assurance", "Offensive: first-mover standard, insurer partner"], ["B", "Verified peer network", "Opportunistic: small verified pilot"], ["C", "Outcome guarantee", "Fold into A as a product line"], ["D", "Movement privacy", "Module of A, not a business"], ["E", "Rome–Santa Catarina curator", "Disinvest"]];
  leg.forEach((l, i) => {
    const y = 1.95 + i * 0.84;
    s.addText([{ text: l[0] + "  " + l[1], options: { bold: true, color: H.navy, breakLine: true } }, { text: l[2], options: { color: H.text } }], { x: 9.2, y, w: 3.53, h: 0.78, fontSize: 11, margin: 0, valign: "top", isTextBox: true });
  });
  callout(s, "One offensive bet, one option kept open, everything else folded in or exited.");
}

// ---------- SECTION 5 ----------
section("5 · Capturing value");
{
  const s = content("5 · Capturing value", "Value map: the ceiling is the next best alternative plus the value of independent assurance — measured, never asked",
    "Deneffe, value pricing: ceiling = next best alternative ± value of differences; floor = marginal cost. Broker markup 10–20% (market sources, 2025). The failure probability is an ASSUMPTION for illustration only; no published failure rate exists.");
  const bars = [["Next best alternative", "Optional escrow, broker vouching (10–20% markup), lawyer review", 2.0, H.light], ["+ Positive differences", "Cross-provider solvency view; insured deposit; independence", 1.6, H.mid], ["− Negative differences", "Unknown brand; liability limits", 0.7, H.low], ["= Price ceiling", "Scales with deposit at risk", 2.9, H.navy], ["Our floor", "Analyst hours; claims ceded to the insurer", 0.8, H.gold]];
  let base = 0;
  bars.forEach((b, i) => {
    const y = 1.9 + i * 0.7, unit = 1.35;
    let x = 3.2;
    if (i === 1) x = 3.2 + 2.0 * unit; if (i === 2) x = 3.2 + (3.6 - 0.7) * unit;
    s.addText(b[0], { x: 0.6, y, w: 2.5, h: 0.55, fontSize: 11.5, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: b[2] * unit, h: 0.55, fill: { color: b[3] }, line: { color: b[3] } });
    s.addText(b[1], { x: 9.0, y, w: 3.73, h: 0.55, fontSize: 10.5, color: H.text, margin: 0, valign: "middle", isTextBox: true });
  });
  s.addText([{ text: "Illustration (assumption): ", options: { bold: true, color: H.navy } }, { text: "a US$200k deposit × an assumed 2–5% yearly failure risk = US$4–10k expected loss a year — well above a US$500–2,000 report. Price below the ceiling to win references; measure the real ceiling with the trade-off interviews." }],
    { x: 0.6, y: 5.5, w: 12.13, h: 0.65, fontSize: 11, color: H.text, margin: 0, isTextBox: true });
  callout(s, "Charge buyers for certainty and suppliers for credibility; let the insurer carry the risk.", 6.3);
}
{
  const s = content("5 · Capturing value", "Monetization: two-part fees on both sides, a share of premium on protection — sold inside a partner’s transaction",
    "Deneffe, pricing strategy: price discrimination, two-part pricing, bundling, value-added services; our hypotheses for this business.");
  table(s, ["Mechanism", "How it applies", "Watch-out"], [
    ["Two-part pricing (suppliers)", "Audit fee plus an annual badge fee", "Keep the badge below the bookings it wins"],
    ["Two-part pricing (buyers)", "Subscription plus per-report fee", "A free tracker feeds the funnel"],
    ["Price discrimination (third degree)", "Family offices and banks vs individuals; fenced by coverage depth and update frequency", "Fence with the product, never the price alone"],
    ["Share of premium", "Commission on deposit protection written by the insurer partner", "Needs a licensed partner"],
    ["Bundling", "Only at the point of sale: deposit plus protection at a broker’s or seller’s checkout", "No standalone consumer bundle"],
    ["Peak-load pricing", "Higher report fees and premiums in peak booking seasons (Dec–Jan, Jul–Aug), when audit and insurer capacity is tight (hypothesis)", "Capacity is the insurer’s; agree peak terms up front"],
  ], { colW: [3.0, 5.6, 3.53], fs: 10.5, rowH: 0.55, y: 1.85 });
  callout(s, "Every mechanism needs the trade-off interviews first, to know where each segment’s ceiling sits.", 6.3);
}
{
  const s = content("5 · Capturing value", "Value-added services: value-price what only we offer, match rivals who charge, give free what rivals give free",
    "Deneffe, value-added services decision rule and the two-way menu; audit prices of existing safety programmes not published. Our hypotheses.");
  table(s, ["Service", "Do rivals offer it?", "Rule", "Our price"], [
    ["Solvency report", "No one vets financials", "Only we offer it: value-price", "Per report or subscription"],
    ["Verified badge", "Safety auditors charge for audits", "A rival charges: match its price, add solvency", "Audit fee near safety-audit levels"],
    ["Deposit protection", "Optional operator escrow, sometimes for a fee", "Only we offer cross-provider cover: value-price", "Share of premium"],
    ["Public failure tracker", "Comparison sites inform for free", "Rivals give it free: give it free", "Free"],
    ["Alerts on suppliers a client uses", "Brokers phone clients for free", "Give free; discount clients who need fewer manual checks", "Included"],
  ], { colW: [2.6, 3.2, 3.8, 2.53], fs: 10.5, rowH: 0.5, y: 1.85 });
  card(s, 0.6, 5.0, 12.13, 1.15, "Two-way menu: what customers could give us for a perk", "Supplier contracts and disclosures (our data) · early loss reports · referrals to peers and family offices · consent to use anonymised claim data · early renewals.", { hs: 12, fs: 11 });
  callout(s, "Rule check: a perk must cost us less than the service it brings saves us.");
}
{
  const s = content("5 · Capturing value", "Trade-off interview guide: eight indifference questions — no direct ‘what would you pay?’",
    "Deneffe, Trade-Off Method: indifference questions reveal each customer’s switching point. Never Van Westendorp or Gabor–Granger. Include some people outside the target segment.");
  const qs = [
    ["Buyer", "Commit your deposit of US$[amount] after your own checks, or after an independent solvency report costing X. At what X are A and B equally attractive?"],
    ["Buyer", "A jet card with optional operator escrow, or a card from a badged operator with an insured deposit at premium Y. At what Y are you indifferent?"],
    ["Buyer", "Your usual broker at its usual markup, or a badged broker. What markup difference makes you indifferent?"],
    ["Family office", "In-house due diligence on a provider, or a subscription at X a year. At what X are you indifferent?"],
    ["Supplier", "No badge, or a badge with an annual audit fee X. Given the bookings you expect, at what X are you indifferent?"],
    ["Peer network", "Your current paid membership network, or a wealth-verified peer network at X a year. At what X are you indifferent?"],
    ["Guarantee", "Your HNW travel policy as it is, or the same policy plus an experience guarantee at premium X. At what X are you indifferent?"],
    ["Privacy", "A private airport suite as today, or the suite plus a per-trip privacy service at X. At what X are you indifferent?"],
  ];
  qs.forEach((q, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.12, y = 1.85 + row * 1.08;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 6.0, h: 0.98, fill: { color: H.panel }, line: { color: H.line, width: 0.75 } });
    s.addText([{ text: (i + 1) + " · " + q[0], options: { bold: true, color: H.navy, breakLine: true } }, { text: q[1] }], { x: x + 0.15, y: y + 0.06, w: 5.7, h: 0.88, fontSize: 10.5, color: H.text, margin: 0, valign: "top", isTextBox: true });
  });
  callout(s, "Each answer is a switching point; together they forecast demand at any price.", 6.3);
}

// ---------- SECTION 6 ----------
section("6 · Validation, partners, risks");
{
  const s = content("6 · Validation, partners, risks", "Operational strategy: six zero-capital tests with pass marks turn the grand-strategy hypotheses into a go/no-go at day 90",
    "Our 90-day plan. Every pass mark is set before the test; missing the gate parks the idea. Dark bars: tests that decide the go/no-go.");
  const T0 = 4.3, TW = 4.55, dx = (d) => T0 + (d / 90) * TW;
  s.addText("Hypothesis and test", { x: 0.6, y: 1.85, w: 3.6, h: 0.3, fontSize: 10.5, bold: true, color: H.navy, margin: 0, isTextBox: true });
  s.addText("Pass mark", { x: 9.45, y: 1.85, w: 3.28, h: 0.3, fontSize: 10.5, bold: true, color: H.navy, margin: 0, isTextBox: true });
  [0, 30, 60, 90].forEach((d) => s.addText("Day " + d, { x: dx(d) - 0.4, y: 1.85, w: 0.8, h: 0.3, fontSize: 9.5, bold: true, color: H.navy, align: "center", margin: 0, isTextBox: true }));
  s.addShape(pres.shapes.LINE, { x: 0.6, y: 2.18, w: 12.13, h: 0, line: { color: H.navy, width: 1.75 } });
  [30, 60].forEach((d) => s.addShape(pres.shapes.LINE, { x: dx(d), y: 2.2, w: 0, h: 3.85, line: { color: H.line, width: 0.75, dashType: "dash" } }));
  s.addShape(pres.shapes.LINE, { x: dx(90), y: 2.2, w: 0, h: 3.85, line: { color: H.gold, width: 2.25 } });
  s.addText("Go / no-go", { x: dx(90) - 1.05, y: 5.85, w: 1.0, h: 0.25, fontSize: 9, bold: true, color: H.goldDk, align: "right", margin: 0, isTextBox: true });
  const rows = [["Publishing ratings is legally defensible", "Counsel opinion; methodology draft", 0, 30, "Written opinion, conditions met", 1], ["Buyers value solvency information", "Free failure tracker; 10 trade-off interviews", 0, 45, "200 subscribers; median indifference > US$500", 0], ["Buyers pay before committing", "One paid due-diligence pilot", 30, 90, "3 paid reports", 1], ["Suppliers pay for a badge", "Approach 30 operators, brokers, villa companies", 15, 90, "10 sign up and pay an audit fee", 1], ["An insurer writes deposit protection", "Lloyd’s Lab application; 3 underwriter meetings", 15, 90, "1 letter of intent or term sheet", 1], ["A verified peer network gets used", "30-member verified pilot (option B)", 30, 90, "30% of members post", 0]];
  rows.forEach((r, i) => {
    const y = 2.3 + i * 0.62;
    s.addText([{ text: (i + 1) + " · " + r[0], options: { bold: true, color: H.navy, breakLine: true } }, { text: r[1], options: { color: H.muted, fontSize: 9.5 } }], { x: 0.6, y, w: 3.6, h: 0.55, fontSize: 10.5, margin: 0, valign: "middle", isTextBox: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: dx(r[2]), y: y + 0.14, w: dx(r[3]) - dx(r[2]), h: 0.27, rectRadius: 0.06, fill: { color: r[5] ? H.navy : H.mid }, line: { color: r[5] ? H.navy : H.mid } });
    s.addText(r[4], { x: 9.45, y, w: 3.28, h: 0.55, fontSize: 10.5, color: H.text, margin: 0, valign: "middle", isTextBox: true });
  });
  callout(s, "Go if tests 1, 3, 4 and 5 pass; park the idea with no capital lost if they do not.");
}
{
  const s = content("6 · Validation, partners, risks", "Partners and investors: win distribution and insurance capacity first, raise capital last",
    "Brainstorm; partner and investor names are fit hypotheses, not checked. Lloyd’s Lab is Lloyd’s insurance accelerator.");
  table(s, ["Role", "Who (examples)", "They get", "We get"], [
    ["Insurance capacity", "Lloyd’s syndicates via a coverholder; HNW insurers", "A new line with loss data", "The licensed wrapper — the moat, with no capital"],
    ["Buyer distribution", "Private banks, family-office networks, assistant communities, luxury advisor networks", "Protection to offer clients", "Buyers without building a brand"],
    ["Supplier distribution", "Charter brokers and operators, yacht-broker associations, villa companies", "A badge that wins bookings", "Audit fees; the supplier side"],
    ["Credibility and data", "Safety auditors; jet-card comparison site", "Solvency added to their offer", "An audited supplier base"],
    ["Money handling", "Trust banks and escrow providers; law firms", "Client-money flows", "The escrow leg"],
  ], { colW: [2.1, 4.3, 2.6, 3.13], fs: 10.5, rowH: 0.52, y: 1.85 });
  s.addText([{ text: "Investors, only after the day-90 gate: ", options: { bold: true, color: H.navy } }, { text: "insurtech funds and reinsurers’ venture arms (they value loss data); wealth-tech and privacy investors; travel-tech funds; strategic investors such as a private bank or insurer that bring distribution with the money." }],
    { x: 0.6, y: 5.0, w: 12.13, h: 0.85, fontSize: 11.5, color: H.text, margin: 0, isTextBox: true });
  callout(s, "Never own aircraft, homes or inventory; never sell direct to consumers at the start.");
}
{
  const s = content("6 · Validation, partners, risks", "Risks: the biggest is that nobody pays for assurance before a loss",
    "Our assessment; likelihood and impact scored low, medium or high.");
  const X0 = 1.3, Y0 = 1.95, W = 4.2, Hh = 3.6, cw = W / 3, ch = Hh / 3;
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
    const sev = a + b; const f = sev >= 4 ? "C9D5EA" : sev === 3 ? "E3E9F3" : H.panel;
    s.addShape(pres.shapes.RECTANGLE, { x: X0 + a * cw, y: Y0 + (2 - b) * ch, w: cw, h: ch, fill: { color: f }, line: { color: H.white, width: 2 } });
  }
  ["Low", "Medium", "High"].forEach((t, i) => {
    s.addText(t, { x: X0 + i * cw, y: Y0 + Hh + 0.04, w: cw, h: 0.26, fontSize: 9, color: H.muted, align: "center", margin: 0, isTextBox: true });
    s.addText(t, { x: 0.55, y: Y0 + (2 - i) * ch + ch / 2 - 0.13, w: 0.7, h: 0.26, fontSize: 9, color: H.muted, align: "right", margin: 0, isTextBox: true });
  });
  s.addText("Likelihood →", { x: X0, y: Y0 + Hh + 0.3, w: W, h: 0.26, fontSize: 10, bold: true, color: H.muted, align: "center", margin: 0, isTextBox: true });
  s.addText("Impact ↑", { x: 0.45, y: Y0 - 0.32, w: 1.2, h: 0.28, fontSize: 10, bold: true, color: H.muted, margin: 0, isTextBox: true });
  const pos = { 1: [2, 2, 0, 0], 2: [1, 2, -0.35, -0.3], 3: [1, 2, 0.35, -0.3], 5: [1, 2, 0, 0.32], 4: [2, 1, -0.3, 0], 6: [2, 1, 0.3, 0], 7: [1, 1, 0, 0] };
  Object.keys(pos).forEach((k) => { const p = pos[k]; num(s, X0 + p[0] * cw + cw / 2 + p[2], Y0 + (2 - p[1]) * ch + ch / 2 + p[3], 0.4, k, +k === 1 || +k === 3 ? H.goldDk : H.navy); });
  const rs = [["Nobody pays for assurance before a loss", "Sell inside partner transactions; the public tracker keeps losses visible"], ["Safety auditors or the comparison site add solvency", "Partner with them before they build it"], ["Legal action over published ratings", "Counsel first; publish positive badges before any negative ratings"], ["No access to private suppliers’ financials", "Disclosure as the condition of the badge"], ["No insurer writes capacity", "Start with escrow partners; Lloyd’s Lab route"], ["Evidence rests on search summaries", "Verify every external figure against its primary source"], ["Market small in heads", "Extend from jets to yachts, villas and clubs; sell through banks"]];
  rs.forEach((r, i) => {
    const y = 1.9 + i * 0.6;
    num(s, 6.2, y + 0.25, 0.34, i + 1, i === 0 || i === 2 ? H.goldDk : H.navy);
    s.addText([{ text: r[0], options: { bold: true, color: H.navy, breakLine: true } }, { text: r[1], options: { color: H.text } }], { x: 6.5, y, w: 6.23, h: 0.55, fontSize: 10.5, margin: 0, valign: "middle", isTextBox: true });
  });
  callout(s, "Risks 1 and 3 (gold) decide the business; tests 1–3 on page 27 address them first.");
}
{
  const s = content("For discussion", "Five questions for you, Francesco", null);
  const qs = [
    "From your HNW clients: have deposit losses or unvetted suppliers come up — and who did they blame?",
    "Which private banks or family offices would pilot a paid due-diligence report?",
    "Which insurers, brokers or Lloyd’s contacts could we approach for deposit protection?",
    "Keep the Otium Chigi name for an assurance business, or adopt a neutral one?",
    "Do we commit 90 days to the six tests, with a go/no-go at day 90?",
  ];
  qs.forEach((q, i) => {
    const y = 1.95 + i * 0.82;
    s.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.05, w: 0.55, h: 0.55, fill: { color: H.navy }, line: { color: H.navy } });
    s.addText(String(i + 1), { x: 0.6, y: y + 0.05, w: 0.55, h: 0.55, fontSize: 16, bold: true, color: H.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(q, { x: 1.4, y, w: 11.3, h: 0.65, fontSize: 15, color: H.text, margin: 0, valign: "middle", isTextBox: true });
  });
  s.addText("Calebe Garcia · algar.calebe@gmail.com · +1 617 949 6729", { x: 0.6, y: 6.4, w: 12.13, h: 0.4, fontSize: 12, color: H.muted, margin: 0, isTextBox: true });
}

// ---------- APPENDIX ----------
section("Appendix");
{
  const s = content("Appendix", "Sources", null);
  const src = [
    "Priceline — two work days to plan a trip (Jan 2024)", "Expedia Group / Luth Research — Path to Purchase (2023)", "Wyndham / APCO — Vacation Ready survey (2017)",
    "Park & Jang — choice overload, Tourism Management 35 (2013)", "Nawijn et al. — vacationers’ happiness (2010)", "Greetwell — AI Travel Survey (Aug 2026)",
    "Phocuswright — AI use in travel (Mar 2026)", "Travel Weekly — advisors charging fees (Aug 2025)", "Flywire — luxury and ultra-luxury traveller surveys (2025, 2026)",
    "Harris Poll for Preferred Hotels (2025)", "SITA — Baggage IT Insights 2026", "Action Fraud via ATOL — holiday fraud 2024",
    "ACI Europe — EES open letter (1 Jul 2026)", "Global Rescue — member survey (Jan 2025)", "The Watch Register — 2024 theft data",
    "FAA — illegal charter enforcement releases", "Private Jet Card Comparisons — survey (n = 594)", "Court and press records: JetSuite, Verijet, Jet It, OneFlight",
    "Wheels Up, Volato, Inspirato filings (2024–26)", "Accor / onefinestay; Joby / Blade; Fora Series D (Jul 2026)", "Quintessentially accounts 2019/20",
    "ARGUS, Wyvern, IS-BAO programme pages", "MYBA charter terms", "CrewPass pricing",
    "PS and Heathrow Windsor Suite pricing (2026)", "PinnacleCare; security price guides (2025–26)", "Altrata World Ultra Wealth Report 2025",
    "Knight Frank Wealth Report", "UBS Global Family Office Report 2025; Campden Wealth (2025)", "Deneffe & Vantrappen, Fad-Free Strategy (2020); Hult courses (2024)",
  ];
  const half = Math.ceil(src.length / 2);
  [src.slice(0, half), src.slice(half)].forEach((col, c) => {
    s.addText(col.map((t, i) => ({ text: (c * half + i + 1) + ". " + t, options: { breakLine: i < col.length - 1 } })),
      { x: 0.6 + c * 6.15, y: 1.85, w: 5.95, h: 4.95, fontSize: 10, color: H.text, margin: 0, valign: "top", paraSpaceAfter: 3, isTextBox: true });
  });
  s.addText("Full source tables with dates, samples, methods and evidence grades: research/sources.md and research/raw/ in the project repository.", { x: 0.6, y: 6.88, w: 11.4, h: 0.4, fontSize: 8.5, color: H.muted, margin: 0, isTextBox: true });
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
