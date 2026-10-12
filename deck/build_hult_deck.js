// Faculty proposal deck for Hult (Dean Mary): course portfolio from venture idea to exit, remote delivery, contracting routes, pilot.
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");
const OUT = process.argv[2];

const THEME = {
  name: "Venture to Exit", headFontFace: "Cambria", bodyFontFace: "Calibri",
  colors: { dk1: "1B1F3B", lt1: "FFFFFF", dk2: "2E3A87", lt2: "F1F2F8", accent1: "2E3A87", accent2: "E0A526",
    accent3: "6C7BD9", accent4: "C9CDE8", accent5: "3C415E", accent6: "C0563E", hlink: "2E3A87", folHlink: "C0563E" },
};
const HEX = THEME.colors;
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Venture to Exit: Faculty Proposal";
pres.author = "Calebe Garcia";
const C = pres.SchemeColor;
const W = 13.333, M = 0.6, MUTED = "5B6078";

pres.defineSlideMaster({
  title: "DARK", background: { color: HEX.dk1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 1.8, w: W - 2 * M, h: 1.9, fontSize: 42, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: "bottom" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 3.9, w: W - 2 * M, h: 3.0, fontSize: 18, color: C.accent4, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT", background: { color: HEX.lt1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.35, w: W - 2 * M, h: 0.85, fontSize: 28, bold: true, color: C.text1, fontFace: THEME.headFontFace, valign: "middle" }, text: "" } },
    { text: { text: "Calebe Garcia · Faculty proposal for Hult International Business School · October 2026", options: { x: M, y: 7.05, w: 9, h: 0.3, fontSize: 10, color: MUTED, margin: 0 } } },
  ],
  slideNumber: { x: W - M - 0.6, y: 7.05, w: 0.6, h: 0.3, fontSize: 10, color: MUTED, align: "right" },
});

let section = "";
const sec = (t) => { section = t; pres.addSection({ title: t }); };
const slide = (m, t) => { const s = pres.addSlide({ masterName: m, sectionTitle: section }); if (t) s.addText(t, { placeholder: "title" }); return s; };
const tb = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, fontSize: 15, color: C.text1, valign: "top", ...o });
const card = (s, x, y, w, h, fill = C.background2) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08 });
const circle = (s, x, y, d, label, fill = C.accent1, fs = 15) =>
  s.addText(String(label), { shape: pres.shapes.OVAL, x, y, w: d, h: d, fill: { color: fill }, color: C.background1, fontSize: fs, bold: true, align: "center", valign: "middle", margin: 0 });
const bullets = (items) => items.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < items.length - 1 } }));
const hdr = (cells) => cells.map((t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.accent1 } } }));
const TBL = { fontFace: "Calibri", color: C.text1, border: { type: "solid", pt: 0.5, color: "D5D8EA" }, valign: "middle" };

const STAGES = [
  { key: "Ideate", col: C.accent6 }, { key: "Build", col: C.accent2 }, { key: "Model", col: C.accent3 }, { key: "Fund", col: C.accent1 }, { key: "Scale and exit", col: C.accent5 },
];
const COURSES = [
  { stage: 0, title: "From Hult Prize to Venture", tag: "Social-impact ventures that can pay for themselves",
    who: "Undergraduate and Master's; Hult Prize teams and alumni", outcomes: ["Frame a social problem as a market with paying customers", "Design a business model that funds its own impact", "Test demand with low-cost experiments before building", "Pitch to impact investors and competition judges"],
    format: "8 weeks online or a 1-week online intensive", assess: "Team venture case and a competition-grade pitch", signature: "Built from the Hult Prize playbook; live feedback rounds modelled on competition judging" },
  { stage: 1, title: "Startups: Zero to First Revenue", tag: "Turning an idea into a business customers pay for",
    who: "Master's and MBA electives; founders in Hult's network", outcomes: ["Find the wedge: the first segment that will pay", "Validate willingness to pay before writing code", "Build a 3-statement founder model and runway plan", "Set up the first sales motion and its metrics"],
    format: "8 weeks online", assess: "Each student takes a real or planned venture from idea to a priced, tested offer", signature: "Weekly teardown of a real startup's pricing page and model" },
  { stage: 1, title: "Incubators, Accelerators and Venture Building", tag: "How venture programmes create, select and grow startups",
    who: "MBA and Master's in Entrepreneurship", outcomes: ["Compare incubator, accelerator and venture-studio models", "Design selection criteria and a programme curriculum", "Measure programme outcomes and economics", "Partner with corporates, universities and government funds"],
    format: "6 weeks online or a 1-week online intensive", assess: "Design a programme for a real city or university", signature: "Field cases from Venture Café, Latin American and European ecosystems" },
  { stage: 2, title: "Multi-Sided Platforms: Strategy and Pricing", tag: "Why platforms win, and how they charge each side",
    who: "MBA and Master's in Business Analytics or Strategy", outcomes: ["Map network effects and the chicken-and-egg problem", "Decide which side to subsidise and which to charge", "Design take rates, fees and usage-based pricing", "Defend against envelopment and multi-homing"],
    format: "8 weeks online", assess: "Platform launch plan with a pricing model", signature: "Cases on marketplaces, payments and AI platforms priced per use" },
  { stage: 2, title: "Value, Pricing and Sustainability", tag: "Capturing the value that sustainable products create",
    who: "MBA and Master's in Sustainability or Marketing", outcomes: ["Quantify economic value to the customer (EVC)", "Measure willingness to pay rigorously, beyond conjoint", "Price green premiums and carbon pass-through (CBAM)", "Build value-based pricing for B2B and AI products"],
    format: "8 weeks online or a 1-week online intensive", assess: "Value and pricing case for a real sustainable product", signature: "Practitioner frameworks from live B2B pricing engagements" },
  { stage: 3, title: "Seed Capital and Venture Finance", tag: "How early-stage money works, from both sides of the table",
    who: "MBA and Master's in Finance or Entrepreneurship", outcomes: ["Value pre-revenue startups (VC method, scorecards)", "Model SAFEs, convertibles, dilution and cap tables", "Read and negotiate a term sheet", "Build the data room and fundraising process"],
    format: "6 weeks online", assess: "Raise simulation: model, term sheet and negotiation", signature: "Students negotiate both founder and investor roles" },
  { stage: 4, title: "Private Equity: Deals, LBOs and Value Creation", tag: "How PE funds buy, improve and sell companies",
    who: "Master's in Finance and MBA", outcomes: ["Build an LBO model from scratch", "Diligence a target: quality of earnings, pricing power", "Design a 100-day value-creation plan, including pricing", "Plan the exit and calculate returns (IRR, MOIC)"],
    format: "8 weeks online or a 1-week online intensive", assess: "Full LBO case with investment-committee memo", signature: "Pricing as a value-creation lever, rarely taught in PE courses" },
  { stage: 4, title: "Investment Banking: Valuation and M&A", tag: "The analyst toolkit, taught by a practitioner",
    who: "Master's in Finance and undergraduate finance", outcomes: ["Value companies with DCF, comparables and precedent deals", "Build merger models: accretion and dilution", "Write a teaser and confidential information memorandum", "Run a sell-side process from mandate to close"],
    format: "8 weeks online", assess: "Sell-side pitch book and merger model", signature: "AI tools in the analyst workflow, used responsibly" },
];

// 1 Title
sec("Proposal");
let s = slide("DARK", "Venture to Exit: A Faculty Proposal for Hult");
s.addText([
  { text: "Eight practitioner courses, from Hult Prize idea to private equity exit", options: { breakLine: true } },
  { text: "Taught live online from Brazil to Boston, London and Dubai", options: { breakLine: true, color: C.accent2 } },
  { text: "Calebe Garcia · Prepared for Dean Mary · October 2026", options: { fontSize: 15 } },
], { placeholder: "body" });

// 2 Proposal in one slide
s = slide("CONTENT", "The proposal: teach the full venture-to-exit journey, remotely");
[
  ["What", "A portfolio of 8 courses covering how ventures are born, built, priced, funded and sold, building on courses I designed for Hult."],
  ["How", "Live online electives taught from Brazil for Boston, London and Dubai students: one course design, every campus."],
  ["Why me", "MBA, Master of Finance and engineering; pricing and valuation practitioner; Hult Prize and Venture Café ecosystem; AI-in-finance work."],
  ["The ask", "Start with one cross-campus online elective next term, then expand course by course on student results."],
].forEach(([h, t], i) => {
  const x = M + (i % 2) * 6.15, y = 1.45 + Math.floor(i / 2) * 2.7;
  card(s, x, y, 5.95, 2.45);
  tb(s, h, { x: x + 0.3, y: y + 0.25, w: 5.35, h: 0.45, fontSize: 21, bold: true, color: C.accent1, fontFace: THEME.headFontFace });
  tb(s, t, { x: x + 0.3, y: y + 0.85, w: 5.35, h: 1.45, fontSize: 16 });
});

// 3 Why now
s = slide("CONTENT", "Why now: students want practitioners who teach what is changing");
[
  ["AI is rewriting finance and pricing", "Students need to learn usage-based pricing, AI-assisted valuation and how AI changes deal work, from someone doing it now."],
  ["Online and hybrid demand", "Remote faculty let Hult offer specialised electives across campuses without relocation costs."],
  ["Entrepreneurship is Hult's identity", "The Hult Prize gives a ready pipeline of student ventures; these courses carry them from idea to funding."],
  ["Latin American reach", "A Brazil-based faculty member who teaches in English, Portuguese and Spanish strengthens recruitment in the region."],
].forEach(([h, t], i) => {
  const y = 1.4 + i * 1.35;
  circle(s, M, y + 0.15, 0.7, i + 1);
  tb(s, h, { x: M + 1.0, y, w: 3.9, h: 1.0, fontSize: 18, bold: true, valign: "middle", color: C.accent1 });
  card(s, M + 5.0, y, W - 2 * M - 5.0, 1.05);
  tb(s, t, { x: M + 5.25, y: y + 0.05, w: W - 2 * M - 5.5, h: 0.95, fontSize: 15, valign: "middle" });
});

// 4 What I bring
s = slide("CONTENT", "What I bring to the classroom");
const creds = [
  ["Academic", ["MBA and Master of Finance", "Engineering degree", "Courses designed for Hult (portfolio available)"]],
  ["Practice", ["Pricing strategy consultant: B2B, AI and SaaS, usage-based and value pricing", "Valuation, LBO, M&A and FP&A modelling", "AI training expert for finance workflows (Mercor)"]],
  ["Ecosystem", ["Hult Prize", "Venture Café founder network in Europe and the US", "Startups, incubators and investors in Brazil and Latin America"]],
  ["Global", ["Teaches in English, Portuguese and Spanish", "Travelled in 50+ countries", "Comfortable across Boston, London and Dubai time zones"]],
];
creds.forEach(([h, items], i) => {
  const x = M + i * 3.07;
  card(s, x, 1.4, 2.9, 5.35);
  tb(s, h, { x: x + 0.25, y: 1.6, w: 2.4, h: 0.5, fontSize: 20, bold: true, color: [C.accent1, C.accent6, C.accent3, C.accent2][i], fontFace: THEME.headFontFace });
  tb(s, bullets(items), { x: x + 0.25, y: 2.25, w: 2.45, h: 4.3, fontSize: 14, paraSpaceAfter: 10 });
});

// 5 Portfolio map
sec("Courses");
s = slide("CONTENT", "The portfolio: one journey, from idea to exit");
const sw = (W - 2 * M - 4 * 0.15) / 5;
STAGES.forEach((st, i) => {
  const x = M + i * (sw + 0.15);
  s.addText(st.key, { shape: pres.shapes.CHEVRON, x, y: 1.4, w: sw, h: 0.7, fill: { color: st.col }, color: C.background1, fontSize: 16, bold: true, align: "center", valign: "middle", margin: 0 });
  COURSES.map((c, j) => ({ ...c, j })).filter((c) => c.stage === i).forEach((c, r) => {
    const y = 2.35 + r * 2.1;
    card(s, x, y, sw, 1.9);
    tb(s, `${c.j + 1}`, { x: x + 0.2, y: y + 0.15, w: 0.5, h: 0.4, fontSize: 18, bold: true, color: st.col, fontFace: THEME.headFontFace });
    tb(s, c.title, { x: x + 0.2, y: y + 0.5, w: sw - 0.4, h: 0.75, fontSize: 12.5, bold: true });
    tb(s, c.tag, { x: x + 0.2, y: y + 1.28, w: sw - 0.4, h: 0.6, fontSize: 10.5, color: MUTED });
  });
});
tb(s, "Each course stands alone; together they form a concentration in venture creation and finance.", { x: M, y: 6.6, w: W - 2 * M, h: 0.35, fontSize: 13, italic: true, color: MUTED });

// 6-13 Course slides
COURSES.forEach((c, i) => {
  const st = STAGES[c.stage];
  s = slide("CONTENT", `${i + 1}. ${c.title}`);
  s.addText(st.key.toUpperCase(), { shape: pres.shapes.ROUNDED_RECTANGLE, x: M, y: 1.25, w: 1.6, h: 0.38, rectRadius: 0.08, fill: { color: st.col }, color: C.background1, fontSize: 11, bold: true, align: "center", valign: "middle", margin: 0 });
  tb(s, c.tag, { x: M + 1.8, y: 1.25, w: W - 2 * M - 1.8, h: 0.4, fontSize: 17, italic: true, color: MUTED, valign: "middle" });
  tb(s, "What students will be able to do", { x: M, y: 1.95, w: 7.2, h: 0.4, fontSize: 17, bold: true, color: C.accent1 });
  c.outcomes.forEach((o, j) => {
    const y = 2.5 + j * 1.0;
    circle(s, M, y + 0.05, 0.55, j + 1, st.col, 14);
    card(s, M + 0.75, y - 0.05, 6.45, 0.78);
    tb(s, o, { x: M + 0.95, y: y, w: 6.1, h: 0.68, fontSize: 15, valign: "middle" });
  });
  const px = 8.3, pw = W - M - px;
  card(s, px, 1.95, pw, 4.85, "E8EAF6");
  let y = 2.15;
  [["For", c.who], ["Format", c.format], ["Assessment", c.assess], ["What makes it different", c.signature]].forEach(([h, t]) => {
    tb(s, h.toUpperCase(), { x: px + 0.3, y, w: pw - 0.6, h: 0.28, fontSize: 11, bold: true, color: C.accent6, charSpacing: 1 });
    tb(s, t, { x: px + 0.3, y: y + 0.3, w: pw - 0.6, h: 0.8, fontSize: 14 });
    y += 1.15;
  });
});

// Delivery
sec("Delivery");
s = slide("CONTENT", "Delivery: live online from Brazil to every campus");
s.addTable([hdr(["Campus", "Time difference from Brazil", "Live session window (local)", "Brazil time"])].concat([
  ["Boston", "Brazil is 1-2 hours ahead", "Evening, 6-8 pm", "7-10 pm"],
  ["London", "Brazil is 3-4 hours behind", "Afternoon, 2-4 pm", "10 am-1 pm"],
  ["Dubai", "Brazil is 7 hours behind", "Evening, 6-8 pm", "11 am-1 pm"],
].map((r) => r.map((t, j) => (j === 0 ? { text: t, options: { bold: true } } : t)))), { ...TBL, x: M, y: 1.4, w: 7.6, colW: [1.4, 2.3, 2.1, 1.8], fontSize: 14, rowH: 0.6 });
tb(s, "Brazil does not observe daylight saving; Boston and London shift by an hour seasonally.", { x: M, y: 4.0, w: 7.6, h: 0.4, fontSize: 12, italic: true, color: MUTED });
card(s, 8.5, 1.4, W - M - 8.5, 5.35);
tb(s, "Online formats", { x: 8.8, y: 1.6, w: 3.6, h: 0.45, fontSize: 19, bold: true, color: C.accent1, fontFace: THEME.headFontFace });
tb(s, [
  { text: "Cross-campus elective: ", options: { bold: true } }, { text: "6-8 weeks, one weekly live session plus asynchronous cases; Boston, London and Dubai students in one cohort.", options: { breakLine: true } },
  { text: "Campus sections: ", options: { bold: true } }, { text: "the same course run at each campus's local time when cohorts are large enough.", options: { breakLine: true } },
  { text: "Online intensive: ", options: { bold: true } }, { text: "1 week of daily live sessions between terms.", options: { breakLine: true } },
  { text: "One course design serves every campus; no travel or relocation needed.", options: { italic: true, color: MUTED } },
], { x: 8.8, y: 2.2, w: 3.65, h: 4.4, fontSize: 14, paraSpaceAfter: 10 });

// Business case
sec("Business case");
s = slide("CONTENT", "Business case: what Hult gains from a remote practitioner faculty");
[
  ["Lower cost per course", "Hult pays the course fee only: no flights, housing, per diem, relocation or visa sponsorship."],
  ["One design, three campuses", "A single course serves Boston, London and Dubai, so electives fill faster and fewer sections are needed."],
  ["New, differentiated electives", "Eight practitioner courses form a venture-to-exit concentration few competing schools offer."],
  ["Spin-off revenue", "The same material can become paid executive-education and alumni short courses."],
  ["Latin American recruitment", "Teaching in English, Portuguese and Spanish supports the São Paulo enrolment team."],
  ["Low risk", "Contract per course, no fixed commitment; continue only if evaluations and enrolment justify it."],
].forEach(([h, t], i) => {
  const x = M + (i % 2) * 6.15, y = 1.4 + Math.floor(i / 2) * 1.8;
  card(s, x, y, 5.95, 1.6);
  circle(s, x + 0.25, y + 0.25, 0.55, i + 1, [C.accent1, C.accent3, C.accent2, C.accent6, C.accent5, C.accent1][i], 14);
  tb(s, h, { x: x + 1.0, y: y + 0.25, w: 4.7, h: 0.45, fontSize: 17, bold: true, color: C.accent1 });
  tb(s, t, { x: x + 1.0, y: y + 0.72, w: 4.7, h: 0.8, fontSize: 14 });
});

s = slide("CONTENT", "Compared with the alternatives for staffing these electives");
const ck = (t, good) => ({ text: t, options: { color: good ? C.accent1 : C.accent6, bold: good } });
s.addTable([hdr(["", "Local adjunct at each campus", "Visiting faculty flown in", "Remote practitioner (this proposal)"])].concat([
  [{ text: "Cost per course", options: { bold: true } }, ck("Fee x 3 campuses", false), ck("Fee + travel + housing + permit", false), ck("One fee, one cohort", true)],
  [{ text: "Specialist depth", options: { bold: true } }, ck("Varies by city", false), ck("High", true), ck("High: active pricing and valuation practitioner", true)],
  [{ text: "Consistency across campuses", options: { bold: true } }, ck("Three versions", false), ck("One campus at a time", false), ck("Same course everywhere", true)],
  [{ text: "Scheduling flexibility", options: { bold: true } }, ck("Good", true), ck("Fixed blocks", false), ck("Good: evening Boston and Dubai, afternoon London", true)],
  [{ text: "Visa and compliance", options: { bold: true } }, ck("Local hiring", true), ck("Work permits per trip", false), ck("None: work done in Brazil", true)],
  [{ text: "Commitment", options: { bold: true } }, ck("Per course", true), ck("Per trip", true), ck("Per course; pilot first", true)],
]), { ...TBL, x: M, y: 1.4, w: W - 2 * M, colW: [2.6, 3.0, 3.0, W - 2 * M - 8.6], fontSize: 14, rowH: 0.72 });
tb(s, "Hult sets the course fee at its standard adjunct rate; no extra cost is assumed. Campus scheduling and accreditation rules to be confirmed with each campus.", { x: M, y: 6.55, w: W - 2 * M, h: 0.4, fontSize: 12, italic: true, color: MUTED });

// Contracting routes
s = slide("CONTENT", "How Hult can engage me without a US or EU work visa");
tb(s, "Teaching online from Brazil means the work is performed in Brazil, so no US, UK or EU work visa is needed. Three ways to contract, simplest first:", { x: M, y: 1.25, w: W - 2 * M, h: 0.7, fontSize: 15 });
[
  ["International contractor", "Hult pays my Brazilian company per course; I provide a W-8BEN. Standard for foreign adjuncts.", "Simplest"],
  ["Through EF Brazil", "EF's São Paulo entity, which already employs Hult's Brazil team, contracts me and charges Hult internally.", "Uses an existing entity"],
  ["Employer of record", "Hult engages me through a provider such as Deel or Remote, which handles the Brazilian contract.", "If the others are not possible"],
].forEach(([h, t, tag], i) => {
  const x = M + i * 4.1;
  card(s, x, 2.15, 3.85, 3.0);
  circle(s, x + 0.25, 2.35, 0.6, i + 1);
  tb(s, h, { x: x + 1.0, y: 2.4, w: 2.7, h: 0.55, fontSize: 17, bold: true, color: C.accent1, valign: "middle" });
  tb(s, t, { x: x + 0.25, y: 3.15, w: 3.35, h: 1.4, fontSize: 14 });
  tb(s, tag, { x: x + 0.25, y: 4.6, w: 3.35, h: 0.35, fontSize: 12, bold: true, color: C.accent6 });
});
card(s, M, 5.4, W - 2 * M, 1.35, "E8EAF6");
tb(s, [
  { text: "No campus travel required: ", options: { bold: true, color: C.accent1 } },
  { text: "all teaching, office hours and grading happen online from Brazil. Any campus-specific faculty approval rules (for example, Dubai's regulator) to be confirmed with each campus.", options: {} },
], { x: M + 0.3, y: 5.5, w: W - 2 * M - 0.6, h: 1.15, fontSize: 14, valign: "middle" });

// Pilot
sec("Pilot");
s = slide("CONTENT", "A low-risk pilot: start with one elective, expand on results");
[
  ["Term 1", ["One online elective for Boston, London and Dubai students", "Suggested: Multi-Sided Platforms or Seed Capital and Venture Finance"]],
  ["Term 2", ["A second online elective, or campus sections at local times", "Suggested: Private Equity or Value, Pricing and Sustainability"]],
  ["Review", ["Student evaluations and enrolment", "Decide which courses to add to the regular schedule"]],
].forEach(([h, items], i) => {
  const x = M + i * 4.1;
  card(s, x, 1.4, 3.85, 3.4);
  circle(s, x + 0.25, 1.6, 0.6, i + 1, [C.accent1, C.accent2, C.accent6][i]);
  tb(s, h, { x: x + 1.0, y: 1.65, w: 2.6, h: 0.5, fontSize: 20, bold: true, color: C.accent1, fontFace: THEME.headFontFace });
  tb(s, bullets(items), { x: x + 0.25, y: 2.4, w: 3.35, h: 2.3, fontSize: 15, paraSpaceAfter: 8 });
});
card(s, M, 5.05, W - 2 * M, 1.7, "E8EAF6");
tb(s, [
  { text: "What success looks like: ", options: { bold: true, color: C.accent1 } },
  { text: "evaluations at or above Hult's elective average, a full cohort, and student teams carrying their ventures or deal work into the Hult Prize, internships or funding.", options: {} },
], { x: M + 0.3, y: 5.15, w: W - 2 * M - 0.6, h: 1.5, fontSize: 16, valign: "middle" });

// Ask
s = slide("DARK", "Next steps");
s.addText(bullets([
  "Choose the first elective and the term",
  "Confirm the contracting route with HR (contractor, EF Brazil or employer of record)",
  "Share syllabi for the selected courses within 2 weeks",
  "Agree which second course to run if the pilot meets its targets",
]), { placeholder: "body", paraSpaceAfter: 8 });

pres.writeFile({ fileName: OUT }).then(() => applyTheme(OUT, THEME)).then(() => console.log("wrote", OUT));
