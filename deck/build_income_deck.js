// Builds the Calebe Income Atlas deck from research/income_atlas.html.
// Run: NODE_PATH=<dir with pptxgenjs> node deck/build_income_deck.js out.pptx
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/root/.claude/skills/synced/70c9b129-32db-469b-8f88-983e77e36578_b69fd9ad-3c5a-43f4-937d-aab5e73d1942/pptx/scripts/apply_theme.js");

const OUT = process.argv[2] || "Calebe_Income_Atlas.pptx";
const html = fs.readFileSync(path.join(__dirname, "../research/income_atlas.html"), "utf8");
const js = html.split("<script>")[1].split("const PIL=")[0];
const D = new Function(js + "; return {TIERS,C,PLANS,GUIDE,WEEKS,BR,REJ,BASE,OPENQ,STREAMS,TRACKS,LADDER};")();
const byId = Object.fromEntries(D.C.map(c => [c.id, c]));

const THEME = {
  name: "Income Atlas",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "14211D", lt1: "FFFFFF", dk2: "0B2E28", lt2: "EAF0EE",
    accent1: "0D6655", accent2: "B07A1E", accent3: "5A6964", accent4: "1D7A3E",
    accent5: "A3312B", accent6: "CFDAD5", hlink: "0D6655", folHlink: "5A6964",
  },
};
const HEX = THEME.colors;
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.title = "Calebe Income Atlas";
pres.author = "Calebe Garcia";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const W = 13.333, M = 0.55, CW = W - 2 * M;

// ---------- layouts ----------
pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "kicker", type: "body", x: M, y: 1.0, w: 9, h: 0.5, fontSize: 14, color: C.accent2, bold: true, charSpacing: 2 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: M, y: 1.6, w: 11, h: 1.6, fontSize: 48, bold: true, color: C.background1, valign: "top", align: "left" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 3.4, w: 10.5, h: 2.2, fontSize: 18, color: C.accent6, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "SECTION",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "kicker", type: "body", x: M, y: 2.35, w: 9, h: 0.45, fontSize: 14, color: C.accent2, bold: true, charSpacing: 2 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: M, y: 2.85, w: 11.5, h: 1.2, fontSize: 40, bold: true, color: C.background1, valign: "top", align: "left" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 4.15, w: 10.5, h: 1.2, fontSize: 18, color: C.accent6, valign: "top" }, text: "" } },
  ],
  slideNumber: { x: W - 1.0, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.accent6, align: "right" },
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.35, w: CW, h: 0.95, fontSize: 30, bold: true, color: C.text2, valign: "middle", align: "left" }, text: "" } },
    { text: { text: "Calebe Income Atlas · October 2026", options: { x: M, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: C.accent3, margin: 0 } } },
  ],
  slideNumber: { x: W - 1.0, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.accent3, align: "right" },
});

// ---------- helpers ----------
let sec = "";
function slide(master, title, extra = {}) {
  const s = pres.addSlide({ masterName: master, sectionTitle: sec });
  if (title) s.addText(title, { placeholder: "title" });
  if (extra.kicker) s.addText(extra.kicker, { placeholder: "kicker" });
  if (extra.body) s.addText(extra.body, { placeholder: "body" });
  return s;
}
function section(title) { sec = title; pres.addSection({ title }); }
const T = (s, text, o) => s.addText(text, Object.assign({ isTextBox: true, margin: 0, valign: "top", fontSize: 14, color: C.text1 }, o));
const box = (s, x, y, w, h, fill, name) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { type: "none" }, objectName: name });
// Motif: five fit pips, the score used on every opportunity
function pips(s, x, y, n, onDark) {
  for (let i = 0; i < 5; i++) {
    const on = n >= i + 0.75;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + i * 0.2, y, w: 0.14, h: 0.14, rectRadius: 0.02,
      fill: { color: on ? (onDark ? C.accent2 : C.accent1) : (onDark ? C.accent3 : C.accent6) }, line: { type: "none" }, objectName: "fit pip" });
  }
}
const PILL = { none: "No pillar bent", passivity: "Bends passivity", outreach: "Bends outreach", faceless: "Bends faceless", capital: "Bends capital", speed: "Bends speed" };
const SHORT = {
  "hours-stack": "Anchor contract at US$80–85/h for ~26 h/wk plus AI-data platforms as ~8 h/wk filler.",
  "vetted": "Real-name, ID-verified profile on gated marketplaces that route senior analyst work.",
  "ai-data": "Author and grade finance tasks for AI labs on platforms other than Mercor.",
  "pj-role": "Full-time USD contract via Deel or Remote at US$11.5k+ gross a month.",
  "fixed-fee": "Investor-ready models, sell-side packs and model reviews as fixed-scope listings.",
  "linkedin-pricing": "Written pricing Diagnostic (~US$3k) and Sprint (~US$8k) sold through text posts.",
  "templates": "Original DCF, LBO, SaaS and pricing models on eFinancialModels, Etsy and Payhip.",
  "courses": "Short practical courses with a template each, in English, Spanish and Portuguese.",
  "itineraries": "Hour-by-hour trip plans and the Europe master route sold as downloads.",
  "grant-teardown": "Written review of a grant or SaaS pricing section and financial plan at US$400–600.",
  "ai-pricing-sprint": "Usage and outcome-based pricing plus an AI-ROI case for AI vendors (~US$4.5k).",
  "ad-desk": "Search ads feed a ~US$1,900 model pack delivered by a per-task analyst bench.",
  "expert-calls": "Paid one-hour calls through GLG, AlphaSights, Guidepoint and similar networks.",
  "whitelabel": "CIMs, teasers and FP&A packs delivered under brokers' and CPA firms' brands.",
  "apps": "Margin or budget app sold in the Shopify or Atlassian marketplaces.",
  "data": "Brazil power-market and CADE deal trackers; SEC valuation datasets.",
  "seo": "Comparison hubs, free calculators, affiliate and ad revenue.",
  "brokerage": "Commission deals: blueberries, SC sourcing, TTD 409 importers, HVAC, energy.",
};
const ODDS = { "hours-stack": "15–25%", "pj-role": "25–35% offer odds", "fixed-fee": "5–10%", "ai-pricing-sprint": "20–25% (unverified)", "grant-teardown": "3–8%", "expert-calls": "≈0% as main income", "ai-data": "8–15% alone" };
function oppCard(s, c, x, y, w, h) {
  box(s, x, y, w, h, C.background2, "card " + c.id);
  const ix = x + 0.25, iw = w - 0.5;
  T(s, c.title, { x: ix, y: y + 0.22, w: iw - 1.2, h: 0.62, fontSize: 15, bold: true, color: C.text2, fit: "shrink" });
  pips(s, x + w - 1.25, y + 0.3, c.plaus);
  T(s, "Fit " + c.plaus + "/5", { x: x + w - 1.25, y: y + 0.5, w: 1.0, h: 0.25, fontSize: 10, color: C.accent3 });
  T(s, PILL[c.bent], { x: ix, y: y + 0.86, w: iw, h: 0.26, fontSize: 11, bold: true, color: c.bent === "none" ? C.accent4 : C.accent2 });
  T(s, SHORT[c.id], { x: ix, y: y + 1.12, w: iw, h: 0.55, fontSize: 13, color: C.text1 });
  const stats = [["US$10k in 12 mo", ODDS[c.id] || c.odds12], ["Likely by month 12", c.m12], ["First money", c.first]];
  const sw = iw / 3;
  stats.forEach((st, i) => {
    T(s, st[0], { x: ix + i * sw, y: y + h - 0.82, w: sw - 0.1, h: 0.22, fontSize: 10, color: C.accent3 });
    T(s, st[1], { x: ix + i * sw, y: y + h - 0.58, w: sw - 0.1, h: 0.45, fontSize: 12.5, bold: true, color: C.text1, fit: "shrink" });
  });
}
function notesFor(c) {
  return [c.title, "How it works: " + c.how, "Who pays: " + c.pays, "Arithmetic: " + c.math.replace(/\n/g, "; "), "Evidence: " + c.evidence,
    c.start && c.start.length ? "First steps: " + c.start.join("; ") : "", c.kill ? "Kill rule: " + c.kill : "", "Risks: " + c.risks,
    "Brazil: " + c.br, "Deneffe/Mercor: " + c.conflict, "Links: " + c.links.map(l => l[0] + " " + l[1] + " (" + l[2] + ")").join("; ")].filter(Boolean).join("\n");
}
function tierSlide(key, title) {
  const cs = D.C.filter(c => c.tier === key && c.id !== "courses");
  const s = slide("CONTENT", title);
  const gw = (CW - 0.3) / 2, gh = 2.6, y0 = 1.5;
  cs.slice(0, 4).forEach((c, i) => oppCard(s, c, M + (i % 2) * (gw + 0.3), y0 + Math.floor(i / 2) * (gh + 0.3), gw, gh));
  s.addNotes(cs.map(notesFor).join("\n\n---\n\n"));
  return s;
}
const tableOpts = (o) => Object.assign({ x: M, w: CW, fontFace: "Calibri", fontSize: 12, color: HEX.dk1, valign: "top", border: { type: "solid", pt: 0.75, color: HEX.accent6 }, margin: [0.06, 0.1, 0.06, 0.1] }, o);
const th = t => ({ text: t, options: { bold: true, color: HEX.accent3, fontSize: 11, fill: { color: HEX.lt2 } } });

// ---------- 1. Title ----------
section("Answer");
{
  const s = slide("TITLE_DARK", "Calebe Income Atlas", {
    kicker: "INCOME RESEARCH · 11 OCTOBER 2026",
    body: "Ranked routes to US$10,000 a month of new income in USD or EUR, from Santa Catarina, with 40 hours a week. Built from 4 research runs, about 80 agents and 55 adversarial skeptic checks.",
  });
  pips(s, M, 6.35, 3, true);
  T(s, "Best skeptic-checked fit: 3 of 5", { x: M + 1.15, y: 6.29, w: 5, h: 0.3, fontSize: 12, color: C.accent6 });
  s.addNotes("Deneffe and Mercor income are excluded throughout; they count as credentials only. Every probability in this deck is a judgment from the research, not data. No income is guaranteed.");
}

// ---------- 2. The answer ----------
{
  const s = slide("CONTENT", "Only bending passivity gets to US$10k a month");
  const pts = [
    ["Nothing passes with all five pillars intact", "Across 55 skeptic checks, no route reached US$10k a month while staying faceless, inbound-only, zero-capital and passive."],
    ["Paid hours close the arithmetic", "An anchor contract at US$80–85/h plus AI-data filler reaches ≈US$10k at 34–40 active hours a week."],
    ["Passive products are side assets", "Templates, itineraries, apps, data and SEO need 130–1,000 sales a month and 24–54 months."],
  ];
  pts.forEach((p, i) => {
    const y = 1.55 + i * 1.65;
    T(s, String(i + 1), { x: M, y, w: 0.5, h: 0.6, fontFace: "Cambria", fontSize: 30, bold: true, color: C.accent2 });
    T(s, p[0], { x: M + 0.6, y: y + 0.02, w: 5.6, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
    T(s, p[1], { x: M + 0.6, y: y + 0.45, w: 5.6, h: 1.0, fontSize: 14 });
  });
  const kp = [["15–25%", "Plan A holds US$10k net for 3 months within 12 months"], ["US$4–8k", "Plan A's likelier net per month by month 12"], ["US$11.6–13.6k", "Gross needed to net US$10k after Brazilian tax and FX"], ["<5%", "US$10k by month 12 from any passive or faceless route alone"]];
  kp.forEach((k, i) => {
    const x = 7.25 + (i % 2) * 2.85, y = 1.55 + Math.floor(i / 2) * 2.55;
    box(s, x, y, 2.6, 2.3, i === 0 ? C.text2 : C.background2, "stat " + k[0]);
    T(s, k[0], { x: x + 0.2, y: y + 0.3, w: 2.2, h: 0.8, fontFace: "Cambria", fontSize: k[0].length > 8 ? 24 : 34, bold: true, color: i === 0 ? C.background1 : C.accent1, fit: "shrink" });
    T(s, k[1], { x: x + 0.2, y: y + 1.2, w: 2.2, h: 0.95, fontSize: 12.5, color: i === 0 ? C.accent6 : C.text1 });
  });
  s.addNotes("Plan A: one anchor client or contract at US$80–85/h for about 26 h a week, plus 2–3 AI-data platforms other than Mercor for about 8 h a week. Applying to posted jobs and private ID or video checks come with it. CALC: anchor 26 h × 4.33 × US$80 × 0.86 = US$7,745; filler 8 h × 4.33 × US$75 × 0.73 = US$1,896; total ≈ US$9,642; at US$85 the anchor gives US$10,126.");
}

// ---------- 3. Findings ----------
{
  const s = slide("CONTENT", "Six findings the plan has to respect");
  const F = [
    ["0 of 55", "skeptic checks found a route that keeps all five pillars and reaches US$10k"],
    ["US$80/h", "Mercor's Brazil finance listing; its ≈US$100/h finance listings exclude Brazil"],
    ["−21.9%", "Fiverr active buyers in Q2 2026; Upwork volume −4%. Marketplaces are shrinking"],
    ["<3%", "of applicants accepted by Toptal; skeptics give a Toptal route 3–6% by month 12"],
    ["3 / 5", "the best skeptic-checked fit; skeptics cut most proposer ratings by 1–2 points"],
    ["2 contracts", "Deneffe and Mercor, unread. Either could block an hours route or a pricing offer"],
  ];
  const gw = (CW - 0.6) / 3, gh = 2.45;
  F.forEach((f, i) => {
    const x = M + (i % 3) * (gw + 0.3), y = 1.55 + Math.floor(i / 3) * (gh + 0.3);
    box(s, x, y, gw, gh, C.background2, "finding " + (i + 1));
    T(s, f[0], { x: x + 0.25, y: y + 0.3, w: gw - 0.5, h: 0.8, fontFace: "Cambria", fontSize: 34, bold: true, color: i === 5 ? C.accent5 : C.accent1, fit: "shrink" });
    T(s, f[1], { x: x + 0.25, y: y + 1.2, w: gw - 0.5, h: 1.1, fontSize: 14 });
  });
  s.addNotes("Other AI-data platforms advertise US$15–65/h for finance work (micro1 US$30–65, Outlier US$30–40, Alignerr US$15–60). Every income probability is a judgment; earnings base rates were NONE FOUND for almost every route. Faceless costs conversion because NDA work cannot be shown.");
}

// ---------- 4. Section: Opportunities ----------
section("Opportunities");
slide("SECTION", "17 routes in four tiers", { kicker: "OPPORTUNITIES", body: "Tiered by what to do with each, ranked by realistic chance of contributing to US$10k a month at 40 hours a week." });

// ---------- 5. Overview ----------
{
  const s = slide("CONTENT", "Only the start-now tier has real odds within 12 months");
  const cw = (CW - 0.9) / 4;
  D.TIERS.forEach((t, i) => {
    const x = M + i * (cw + 0.3), y = 1.5;
    const cs = D.C.filter(c => c.tier === t.key);
    box(s, x, y, cw, 5.25, i === 0 ? C.text2 : C.background2, "tier " + t.key);
    const dark = i === 0;
    T(s, t.label, { x: x + 0.2, y: y + 0.2, w: cw - 0.4, h: 0.45, fontFace: "Cambria", fontSize: 20, bold: true, color: dark ? C.background1 : C.text2 });
    T(s, cs.length + " routes", { x: x + 0.2, y: y + 0.66, w: cw - 0.4, h: 0.3, fontSize: 11, color: dark ? C.accent6 : C.accent3 });
    cs.forEach((c, j) => {
      const yy = y + 1.1 + j * 0.8;
      T(s, c.title, { x: x + 0.2, y: yy, w: cw - 0.4, h: 0.5, fontSize: 12, bold: true, color: dark ? C.background1 : C.text1, fit: "shrink" });
      pips(s, x + 0.2, yy + 0.52, c.plaus, dark);
      T(s, ODDS[c.id] || c.odds12, { x: x + 1.3, y: yy + 0.47, w: cw - 1.5, h: 0.25, fontSize: 10, color: dark ? C.accent6 : C.accent3, fit: "shrink" });
    });
  });
  s.addNotes(D.TIERS.map(t => t.label + ": " + t.why).join("\n"));
}

// ---------- 6. Start now ----------
tierSlide("start", "Start now: four routes that pay for hours");

// ---------- 7. Plan A arithmetic chart ----------
{
  const s = slide("CONTENT", "The hours stack clears US$10k only if the anchor pays US$85/h");
  const labels = ["Anchor US$85/h, 26 h", "Anchor US$80/h, 26 h", "Skeptic case: anchor US$65 + filler US$100", "Filler at US$50/h"];
  s.addChart(pres.charts.BAR, [
    { name: "Anchor contract (net)", labels, values: [8230, 7745, 4841, 4841] },
    { name: "AI-data filler (net)", labels, values: [1896, 1896, 4425, 2213] },
  ], {
    x: M, y: 1.45, w: 8.2, h: 5.3, barDir: "bar", barGrouping: "stacked", chartColors: [HEX.accent1, HEX.accent2],
    showValue: true, dataLabelPosition: "ctr", dataLabelColor: HEX.lt1, dataLabelFontSize: 11, dataLabelFormatCode: "$#,##0", dataLabelFontFace: "+mn-lt",
    catAxisLabelColor: HEX.accent3, valAxisLabelColor: HEX.accent3, catAxisLabelFontSize: 11, valAxisLabelFontSize: 10, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
    valAxisMaxVal: 12000, valAxisMinVal: 0, valAxisMajorUnit: 2000, valAxisLabelFormatCode: "$#,##0", catAxisOrientation: "maxMin",
    valGridLine: { color: HEX.accent6, size: 0.5 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "b", legendFontSize: 11, legendColor: HEX.accent3, legendFontFace: "+mn-lt",
    showTitle: true, title: "Net US$ per month after tax and FX (CALC)", titleFontSize: 13, titleColor: HEX.dk2, titleFontFace: "+mn-lt",
  });
  const tx = 9.15, tw = W - M - tx;
  box(s, tx, 1.45, tw, 5.3, C.background2, "chart commentary");
  T(s, "Read the bars against US$10,000", { x: tx + 0.25, y: 1.7, w: tw - 0.5, h: 0.6, fontSize: 16, bold: true, color: C.text2 });
  T(s, [
    { text: "US$85/h anchor: ≈US$10,126. The only case that clears.", options: { bullet: true, breakLine: true } },
    { text: "US$80/h anchor: ≈US$9,642, 4% short.", options: { bullet: true, breakLine: true } },
    { text: "Skeptic's base case: ≈US$9,266.", options: { bullet: true, breakLine: true } },
    { text: "Real non-Mercor rates (US$15–65/h) drag the filler toward the bottom bar: ≈US$7,054.", options: { bullet: true } },
  ], { x: tx + 0.25, y: 2.35, w: tw - 0.5, h: 3.2, fontSize: 13.5, paraSpaceAfter: 8 });
  T(s, "Keep factors: Simples ≈0.86, carnê-leão ≈0.73 (ASSUMPTION).", { x: tx + 0.25, y: 6.05, w: tw - 0.5, h: 0.5, fontSize: 11, color: C.accent3 });
  s.addNotes("CALC: anchor 26 h × 4.33 × US$85 × 0.86 = US$8,230; at US$80 = US$7,745. Filler 8 h × 4.33 × US$75 × 0.73 = US$1,896. Skeptic case: anchor 20 h × 4.33 × US$65 × 0.86 = US$4,841; filler 14 h × 4.33 × US$100 × 0.73 = US$4,425. At a US$50 filler rate the filler gives US$2,213 and the total ≈ US$7,054.");
}

// ---------- 8–9. Build alongside, test cheaply ----------
tierSlide("build", "Build alongside: assets that compound next to the hours");
tierSlide("test", "Test cheaply: free or low-cost bets with kill rules");

// ---------- 10. Long shots ----------
{
  const s = slide("CONTENT", "Long shots: the math closes only with top-percentile outcomes");
  const cs = D.C.filter(c => c.tier === "long");
  const rows = [[th("Route"), th("Bends"), th("Fit"), th("US$10k in 12 mo"), th("What US$10k requires")]];
  const req = { whitelabel: "16 retainer accounts at US$1,000", apps: "≈515 Shopify merchants at US$20 or 400 Atlassian sites at US$25", data: "≈160 power-market accounts or ≈105 dataset sales a month", seo: "32–127k high-intent visits a month", brokerage: "≈3 orders of US$50k a month at 7%; commission rates NONE FOUND" };
  cs.forEach(c => rows.push([{ text: c.title, options: { bold: true } }, PILL[c.bent].replace("Bends ", ""), c.plaus + " / 5", c.odds12, req[c.id]]));
  s.addTable(rows, tableOpts({ y: 1.55, colW: [3.6, 1.3, 0.8, 1.8, 4.73], fontSize: 13, rowH: 0.62 }));
  T(s, "Indie SaaS base rate: 6.1% of revenue-reporting bootstrapped startups reach US$10k MRR, the upper bound; median ≈US$145.", { x: M, y: 6.3, w: CW, h: 0.4, fontSize: 12, color: C.accent3 });
  s.addNotes(cs.map(notesFor).join("\n\n---\n\n"));
}

// ---------- 11. Pillar unlock map ----------
{
  const s = slide("CONTENT", "What bending each pillar buys");
  const U = [
    ["Passivity", "Turns 200–1,000 sales a month into ≈115–145 billed hours", "8–14 months; 25–30% in 12 if a US$80+/h anchor lands", "A second job of 34–40 h a week; no asset", "The only lever that changes the math"],
    ["Outreach", "Applying to posted jobs; up to 10 messages a day", "9–15 months for the hours stack", "≈97% silence on cold sends; application time", "An enabler for hours routes"],
    ["Faceless", "Toptal-type gated marketplaces, trust at US$1k+, LinkedIn", "Toptal 3–6% by month 12; LinkedIn practice 24–30 months", "Real name, video screening, client calls", "Buys access, not speed"],
    ["Capital", "Paid demand tests, a rented analyst bench", "24–36 months or never; 10–15% by month 24", "US$1.5–2k at risk", "Buys visibility, not credibility"],
    ["Speed", "Time for reviews, SEO and subscriptions to compound", "36–54 months; ≈8–10% by month 36 for the catalog", "≈2,000 unpaid hours", "Weakest lever: time doesn't create demand"],
  ];
  const rows = [[th("Pillar bent"), th("What it unlocks"), th("Best time to US$10k"), th("What it costs you"), th("Verdict")]];
  U.forEach((u, i) => rows.push([{ text: u[0], options: { bold: true, color: i === 0 ? HEX.accent1 : HEX.dk1 } }, u[1], u[2], u[3], { text: u[4], options: { bold: i === 0 } }]));
  s.addTable(rows, tableOpts({ y: 1.55, colW: [1.5, 3.0, 2.9, 2.5, 2.33], fontSize: 13, rowH: 0.85 }));
  s.addNotes("No single relaxation produced a strong fit (4–5 of 5). Ranking of relaxations from the pillar panel: passivity first, outreach (apply to posted demand) as a near-free enabler second, faceless third.");
}

// ---------- 12. Catalog ----------
{
  const s = slide("CONTENT", "The catalog needs hundreds of sales a month at any price");
  s.addChart(pres.charts.BAR, [{ name: "Sales a month for US$10k", labels: ["US$12 itinerary", "US$19 template", "US$29 template", "US$49 model", "US$149 bundle"], values: [961, 600, 390, 230, 75] }], {
    x: M, y: 1.45, w: 7.4, h: 5.3, barDir: "col", chartColors: [HEX.accent2], showValue: true, dataLabelPosition: "outEnd", dataLabelColor: HEX.dk1, dataLabelFontSize: 12, dataLabelFontFace: "+mn-lt", dataLabelFormatCode: "#,##0",
    catAxisLabelColor: HEX.accent3, valAxisLabelColor: HEX.accent3, catAxisLabelFontSize: 11, valAxisLabelFontSize: 10, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
    valAxisMaxVal: 1100, valAxisMinVal: 0, valAxisMajorUnit: 200, valGridLine: { color: HEX.accent6, size: 0.5 }, catGridLine: { style: "none" }, showLegend: false,
    showTitle: true, title: "Sales needed per month for US$10k (CALC, after fees)", titleFontSize: 13, titleColor: HEX.dk2, titleFontFace: "+mn-lt",
  });
  const tx = 8.35, tw = W - M - tx;
  T(s, "What the evidence shows", { x: tx, y: 1.5, w: tw, h: 0.45, fontSize: 17, bold: true, color: C.text2 });
  T(s, [
    { text: "Best documented spreadsheet shop: ≈US$10.4k gross a month after 29k sales and 2+ years, with email and Facebook ads.", options: { bullet: true, breakLine: true } },
    { text: "Itinerary sales data: NONE FOUND. The best tracked Gumroad travel item made ≈US$720 lifetime.", options: { bullet: true, breakLine: true } },
    { text: "Skeptic odds for the full catalog: 2–3% by month 24, 8–10% by month 36.", options: { bullet: true, breakLine: true } },
    { text: "Its real job: proof of expertise and a tripwire into paid custom work.", options: { bullet: true, bold: true } },
  ], { x: tx, y: 2.05, w: tw, h: 3.6, fontSize: 14, paraSpaceAfter: 8 });
  T(s, "Go/no-go first: confirm Etsy Payments accepts a Brazilian seller.", { x: tx, y: 5.9, w: tw, h: 0.6, fontSize: 12.5, color: C.accent5, bold: true });
  s.addNotes(notesFor(byId["templates"]) + "\n\n---\n\n" + notesFor(byId["itineraries"]));
}

// ---------- Stack streams ----------
section("Stack");
slide("SECTION", "Stack automatic streams on one body of work", { kicker: "STACK STREAMS", body: "One framework sells five ways: a course, a template, a bundle, a translation and a review. No single stream reaches US$10k; together they add to the hours leg and keep paying when the hours stop." });
{
  const s = slide("CONTENT", "Seven streams add ≈US$3.7k a month in the base case");
  const names = ["Mini-courses", "Models and templates", "Toolkit bundles", "Itineraries EN/PT/ES", "Affiliate links", "Async reviews", "1-1 sessions"];
  const num = v => Number(String(v).replace(/,/g, ""));
  s.addChart(pres.charts.BAR, [
    { name: "Low", labels: names, values: D.STREAMS.map(r => num(r[3])) },
    { name: "Base", labels: names, values: D.STREAMS.map(r => num(r[4])) },
    { name: "High", labels: names, values: D.STREAMS.map(r => num(r[5])) },
  ], {
    x: M, y: 1.45, w: 7.9, h: 5.3, barDir: "bar", barGrouping: "clustered", chartColors: [HEX.accent6, HEX.accent1, HEX.accent2], barGapWidthPct: 50, catAxisOrientation: "maxMin",
    showValue: true, dataLabelPosition: "outEnd", dataLabelColor: HEX.dk1, dataLabelFontSize: 9, dataLabelFormatCode: "$#,##0", dataLabelFontFace: "+mn-lt",
    catAxisLabelColor: HEX.accent3, valAxisLabelColor: HEX.accent3, catAxisLabelFontSize: 11, valAxisLabelFontSize: 10, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
    valAxisMaxVal: 3500, valAxisMinVal: 0, valAxisMajorUnit: 500, valAxisLabelFormatCode: "$#,##0", valGridLine: { color: HEX.accent6, size: 0.5 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "b", legendFontSize: 11, legendColor: HEX.accent3, legendFontFace: "+mn-lt",
    showTitle: true, title: "Net US$ per month at month 24 (ASSUMPTION)", titleFontSize: 13, titleColor: HEX.dk2, titleFontFace: "+mn-lt",
  });
  const tx = 8.85, tw = W - M - tx;
  const K = [["US$2.4k", "Automated layer, base case (first five streams)"], ["US$3.7k", "All seven streams, base case; US$0.3–10k range"], ["<5–10%", "Odds the stack alone reaches US$10k within 24 months"]];
  K.forEach((k, i) => {
    const y = 1.45 + i * 1.8;
    box(s, tx, y, tw, 1.6, i === 1 ? C.text2 : C.background2, "stack stat " + i);
    T(s, k[0], { x: tx + 0.2, y: y + 0.18, w: tw - 0.4, h: 0.6, fontFace: "Cambria", fontSize: 28, bold: true, color: i === 1 ? C.background1 : C.accent1 });
    T(s, k[1], { x: tx + 0.2, y: y + 0.85, w: tw - 0.4, h: 0.65, fontSize: 12.5, color: i === 1 ? C.accent6 : C.text1 });
  });
  s.addNotes(D.STREAMS.map(r => r[0] + ": effort " + r[1] + ", passivity " + r[2] + ", month-24 net US$" + r[3] + " / " + r[4] + " / " + r[5] + ", feeds " + r[6]).join("\n") + "\nRanges are ASSUMPTIONS built from the atlas base rates; no stream-level earnings data was found. Reviews and 1-1 sessions are hours, and 1-1 bends the faceless pillar.");
}
{
  const s = slide("CONTENT", "A course library from the MBA and Master of Finance");
  const cw = (CW - 0.6) / 3, ch = 2.55;
  D.TRACKS.forEach((t, i) => {
    const x = M + (i % 3) * (cw + 0.3), y = 1.45 + Math.floor(i / 3) * (ch + 0.25);
    box(s, x, y, cw, ch, i === 0 ? C.text2 : C.background2, "track " + t[0]);
    const dark = i === 0;
    T(s, t[0], { x: x + 0.2, y: y + 0.15, w: cw - 0.4, h: 0.4, fontFace: "Cambria", fontSize: 15, bold: true, color: dark ? C.background1 : C.text2 });
    const items = t[1].length > 6 ? t[1].slice(0, 5).concat(["+ " + (t[1].length - 5) + " more in the atlas"]) : t[1];
    T(s, items.map((c, j) => ({ text: c, options: { bullet: true, breakLine: j < items.length - 1 } })), { x: x + 0.2, y: y + 0.6, w: cw - 0.4, h: ch - 0.75, fontSize: 11.5, color: dark ? C.background1 : C.text1, paraSpaceAfter: 2, fit: "shrink" });
  });
  s.addNotes("Each course ships with a template or model so it sells as a course, a toolkit and a bundle. All material original: no Harvard cases, Hult or university slides, CFA Institute content or CFA mark. Personal-finance courses teach methods, never specific securities (CVM). Pricing courses use public examples; ask Deneffe in writing first. Course earnings for this niche: NONE FOUND in the research.");
}
{
  const s = slide("CONTENT", "Price ladder: free lesson to 1-1, in three languages");
  const rows = [[th("Step"), th("Format"), th("Price"), th("Effort")]];
  D.LADDER.forEach(r => rows.push([{ text: r[0], options: { bold: true } }, r[1], r[2], r[3]]));
  s.addTable(rows, tableOpts({ y: 1.5, w: 7.6, colW: [1.6, 3.2, 1.5, 1.3], fontSize: 13, rowH: 0.7 }));
  const tx = 8.45, tw = W - M - tx;
  box(s, tx, 1.5, tw, 5.2, C.background2, "channels");
  T(s, "Where to sell", { x: tx + 0.25, y: 1.7, w: tw - 0.5, h: 0.4, fontSize: 16, bold: true, color: C.text2 });
  T(s, [
    "Udemy in English and Spanish: discovery, but you keep 37% of organic sales.",
    "Own storefront (Gumroad, Payhip, Podia): higher margin, your own traffic.",
    "Hotmart or Kiwify for Portuguese editions only: BRL.",
    "Every template links to its course; every course sells the bundle and a review.",
    "Test 2–3 courses first: under 20 sales in 90 days → stop adding.",
  ].map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1 } })), { x: tx + 0.25, y: 2.2, w: tw - 0.5, h: 4.3, fontSize: 13, paraSpaceAfter: 6, fit: "shrink" });
}

// ---------- 13. Section: Plans ----------
section("Plans");
slide("SECTION", "Four ways to spend the 40 hours", { kicker: "PLANS", body: "Each plan combines routes within 40 hours a week. Plan A has the best odds; B, C and D trade odds for assets that keep paying." });

// ---------- 14. Plans compare ----------
{
  const s = slide("CONTENT", "Plan A has the best odds; D builds the most automatic income");
  const cw = (CW - 0.9) / 4;
  const segCol = [C.accent1, C.accent2, C.accent3, C.accent6];
  D.PLANS.forEach((p, i) => {
    const x = M + i * (cw + 0.3), y = 1.5, h = 5.3, dark = p.rec;
    box(s, x, y, cw, h, dark ? C.text2 : C.background2, "plan " + p.id);
    const fg = dark ? C.background1 : C.text1, mut = dark ? C.accent6 : C.accent3;
    T(s, p.rec ? "RECOMMENDED" : "ALTERNATIVE", { x: x + 0.25, y: y + 0.2, w: cw - 0.5, h: 0.25, fontSize: 10, bold: true, color: dark ? C.accent2 : C.accent3, charSpacing: 2 });
    T(s, p.name, { x: x + 0.25, y: y + 0.48, w: cw - 0.5, h: 0.75, fontFace: "Cambria", fontSize: 15, bold: true, color: dark ? C.background1 : C.text2, fit: "shrink" });
    T(s, "Bends: " + p.bent, { x: x + 0.25, y: y + 1.22, w: cw - 0.5, h: 0.45, fontSize: 11, color: mut, fit: "shrink" });
    let xx = x + 0.25; const bw = cw - 0.5;
    p.legs.forEach((l, j) => { const w = bw * l[2] / 40; s.addShape(pres.shapes.RECTANGLE, { x: xx, y: y + 1.75, w, h: 0.16, fill: { color: segCol[j % 4] }, line: { color: dark ? HEX.dk2 : HEX.lt2, width: 1 }, objectName: "hours " + l[1] }); xx += w; });
    p.legs.forEach((l, j) => T(s, l[2] + " h · " + l[1], { x: x + 0.25, y: y + 2.02 + j * 0.27, w: cw - 0.5, h: 0.26, fontSize: 10.5, color: fg, fit: "shrink" }));
    const ny = y + 2.02 + p.legs.length * 0.27 + 0.15;
    T(s, p.odds, { x: x + 0.25, y: ny, w: cw - 0.5, h: 1.1, fontSize: 11.5, bold: true, color: fg, fit: "shrink" });
    T(s, p.gates[0], { x: x + 0.25, y: y + h - 1.0, w: cw - 0.5, h: 0.8, fontSize: 11, color: mut, fit: "shrink" });
  });
  s.addNotes(D.PLANS.map(p => p.name + "\nMath: " + p.math + "\nRamp: " + p.ramp.map(r => r[0] + " " + r[1]).join("; ") + "\nOdds: " + p.odds + "\nGates: " + p.gates.join("; ")).join("\n\n"));
}

// ---------- 15. Plan A ramp ----------
{
  const s = slide("CONTENT", "Plan A ramps over a year, and month 4 decides it");
  const labels = ["Months 1–2", "Months 3–5", "Months 6–9", "Months 10–12"];
  s.addChart(pres.charts.BAR, [
    { name: "Low case", labels, values: [0, 3000, 6000, 8000] },
    { name: "High case", labels, values: [1500, 5000, 9000, 10000] },
  ], {
    x: M, y: 1.45, w: 7.6, h: 5.3, barDir: "col", barGrouping: "clustered", chartColors: [HEX.accent6, HEX.accent1], barGapWidthPct: 60,
    showValue: true, dataLabelPosition: "outEnd", dataLabelColor: HEX.dk1, dataLabelFontSize: 11, dataLabelFormatCode: "$#,##0", dataLabelFontFace: "+mn-lt",
    catAxisLabelColor: HEX.accent3, valAxisLabelColor: HEX.accent3, catAxisLabelFontSize: 11, valAxisLabelFontSize: 10, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
    valAxisMaxVal: 12000, valAxisMajorUnit: 2000, valAxisLabelFormatCode: "$#,##0", valGridLine: { color: HEX.accent6, size: 0.5 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "b", legendFontSize: 11, legendColor: HEX.accent3, legendFontFace: "+mn-lt",
    showTitle: true, title: "Plan A net US$ per month (ASSUMPTION)", titleFontSize: 13, titleColor: HEX.dk2, titleFontFace: "+mn-lt",
  });
  const tx = 8.55, tw = W - M - tx;
  T(s, "Checkpoints", { x: tx, y: 1.5, w: tw, h: 0.45, fontSize: 17, bold: true, color: C.text2 });
  const G = [["Day 30", "Contracts read; 2+ platforms active or 3+ interviews"], ["Day 60", "No engagement at US$60/h net → drop premium targets"], ["Month 4", "No signed anchor → a US$3–5k filler income, not US$10k"], ["Day 90", "<40 billed hours in 30 days → off track"]];
  G.forEach((g, i) => {
    const y = 2.1 + i * 1.12;
    box(s, tx, y, tw, 0.95, i === 2 ? C.text2 : C.background2, "gate " + g[0]);
    T(s, g[0], { x: tx + 0.2, y: y + 0.12, w: 1.1, h: 0.4, fontSize: 14, bold: true, color: i === 2 ? C.accent2 : C.accent1 });
    T(s, g[1], { x: tx + 1.3, y: y + 0.12, w: tw - 1.45, h: 0.75, fontSize: 12.5, color: i === 2 ? C.background1 : C.text1 });
  });
  s.addNotes("Ramp from the pillar panel: M1–2 filler assessments US$0–1.5k; M3–5 first Upwork and Contra contracts at US$50–65/h, US$3–5k; M6–9 premium match, US$6–9k; M10–12 US$8–10k if it lands. Odds: 15–25% to hold US$10k net for 3 months within 12 months; ≈35% within 24.");
}

// ---------- 16. Choose ----------
{
  const s = slide("CONTENT", "Your pillars decide the plan");
  D.GUIDE.forEach((g, i) => {
    const y = 1.45 + i * 0.77;
    box(s, M, y, CW, 0.67, i === 0 ? C.text2 : C.background2, "path " + (i + 1));
    const dark = i === 0;
    T(s, "If " + g[0].charAt(0).toLowerCase() + g[0].slice(1), { x: M + 0.25, y: y + 0.08, w: 5.9, h: 0.52, fontSize: 13.5, bold: true, color: dark ? C.background1 : C.text1, valign: "middle", fit: "shrink" });
    T(s, g[1], { x: M + 6.4, y: y + 0.08, w: CW - 6.6, h: 0.52, fontSize: 13.5, color: dark ? C.accent6 : C.text1, valign: "middle", fit: "shrink" });
  });
}

// ---------- 17. First 30 days ----------
section("Start");
{
  const s = slide("CONTENT", "First 30 days: contracts and payout before any hours");
  const cw = (CW - 0.9) / 4;
  D.WEEKS.forEach((w, i) => {
    const x = M + i * (cw + 0.3), y = 1.5;
    box(s, x, y, cw, 5.25, i === 0 ? C.text2 : C.background2, "week " + (i + 1));
    const dark = i === 0;
    T(s, w[0], { x: x + 0.2, y: y + 0.2, w: cw - 0.4, h: 0.7, fontFace: "Cambria", fontSize: 15, bold: true, color: dark ? C.background1 : C.text2, fit: "shrink" });
    T(s, w[1].map((a, j) => ({ text: a, options: { bullet: true, breakLine: j < w[1].length - 1 } })), { x: x + 0.2, y: y + 1.0, w: cw - 0.4, h: 4.1, fontSize: 12, color: dark ? C.background1 : C.text1, paraSpaceAfter: 6, fit: "shrink" });
  });
}

// ---------- 18. Brazil ----------
{
  const s = slide("CONTENT", "Brazil setup: confirm each line with a contador first");
  const pick = [0, 1, 2, 3, 4, 6, 8, 11];
  const SH = [
    "MEI can't be used. Use an ME or SLU in Simples: Anexo III if payroll ≥28% of revenue (Fator R), else Anexo V from 15.5%.",
    "PIS/COFINS exempt with FX inflow; ISS doesn't apply when the result is used abroad; IRPJ and CSLL still apply.",
    "0% on service-export receipts; 0.38% if funds are kept abroad first. Confirm with your bank.",
    "Carnê-leão up to 27.5% marginal, so platform income paid to you as an individual keeps ≈73%.",
    "Possible dividend withholding and minimum-tax effects. Get a written contador opinion.",
    "Direct to a Brazilian bank in BRL, US$0.99 per withdrawal; names must match.",
    "Via Payoneer to a Brazilian bank, ≈1% + 1.4% + Etsy FX 2.5%.",
    "No single-stock research (CVM Res. 20); sell models, not signed valuations; Law 4.886/65 for representation.",
  ];
  const rows = [[th("Topic"), th("What the research found"), th("Status")]];
  pick.forEach((k, i) => {
    const r = D.BR[k], col = r[2] === "sourced" ? HEX.accent4 : r[2] === "secondary" ? HEX.accent2 : HEX.accent5;
    rows.push([{ text: r[0], options: { bold: true } }, SH[i], { text: r[2], options: { bold: true, color: col } }]);
  });
  s.addTable(rows, tableOpts({ y: 1.5, colW: [2.7, 8.13, 1.4], fontSize: 12.5, rowH: 0.56 }));
  s.addNotes(D.BR.map(r => r[0] + " (" + r[2] + "): " + r[1]).join("\n"));
}

// ---------- 19. Avoid ----------
{
  const s = slide("CONTENT", "Researched and ruled out");
  const L = D.REJ.slice(0, 12);
  const half = Math.ceil(L.length / 2), cw = (CW - 0.3) / 2;
  [L.slice(0, half), L.slice(half)].forEach((col, ci) => {
    col.forEach((r, i) => {
      const x = M + ci * (cw + 0.3), y = 1.5 + i * 0.88;
      T(s, r[0], { x, y, w: cw, h: 0.32, fontSize: 13, bold: true, color: C.text2, fit: "shrink" });
      T(s, r[1], { x, y: y + 0.33, w: cw, h: 0.5, fontSize: 11.5, color: C.accent3, fit: "shrink" });
    });
  });
  s.addNotes(D.REJ.map(r => r[0] + ": " + r[1]).join("\n"));
}

// ---------- 20. Evidence ----------
{
  const s = slide("CONTENT", "How much to trust these numbers");
  const cw = (CW - 0.3) / 2;
  box(s, M, 1.5, cw, 5.25, C.background2, "base rates");
  T(s, "Base rates", { x: M + 0.25, y: 1.7, w: cw - 0.5, h: 0.4, fontSize: 16, bold: true, color: C.text2 });
  T(s, D.BASE.filter((b, i) => [0, 1, 3, 5, 6].includes(i)).map((b, i) => ({ text: b, options: { bullet: true, breakLine: i < 4 } })), { x: M + 0.25, y: 2.2, w: cw - 0.5, h: 4.4, fontSize: 13, paraSpaceAfter: 6, fit: "shrink" });
  const x2 = M + cw + 0.3;
  box(s, x2, 1.5, cw, 5.25, C.text2, "limits");
  T(s, "Limits", { x: x2 + 0.25, y: 1.7, w: cw - 0.5, h: 0.4, fontSize: 16, bold: true, color: C.background1 });
  T(s, [
    "Four runs: broad routes (34 agents), EU grants (17), US startups (13), pillar panel (15).",
    "55 skeptic checks re-tested the top options; their numbers replace the proposers'.",
    "Most sites couldn't be opened directly, so figures come from search summaries (SECONDARY).",
    "Many skeptics ran out of search budget: Brazil eligibility for most AI-data platforms is UNVERIFIED.",
    "Every probability is a judgment, not data. No income is guaranteed.",
  ].map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1 } })), { x: x2 + 0.25, y: 2.2, w: cw - 0.5, h: 4.4, fontSize: 13, color: C.background1, paraSpaceAfter: 6, fit: "shrink" });
  s.addNotes("Open questions to settle before committing hours:\n" + D.OPENQ.join("\n"));
}

// ---------- 21. Close ----------
{
  const s = slide("TITLE_DARK", "Two actions before any hours", {
    kicker: "NEXT",
    body: [
      { text: "1. Read the Deneffe and Mercor agreements and any moonlighting clause. Ask Deneffe in writing before any pricing offer.", options: { breakLine: true } },
      { text: " ", options: { breakLine: true } },
      { text: "2. Book one hour with a contador: company type, Simples annex, export invoicing, IOF and Lei 15.270/2025." },
    ],
  });
  s.addNotes("Then follow the first-30-days plan: plumbing and proof in week 1, applications in weeks 2–3, the catalog test and day-30 gate in week 4.");
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
