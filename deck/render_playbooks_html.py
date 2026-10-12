"""Render research/revenue_playbooks.html from a playbooks JSON ({playbooks, portfolio})."""
import html, json, sys

src, out = sys.argv[1], sys.argv[2]
D = json.load(open(src))
P, PF, PEND = D["playbooks"], D.get("portfolio"), D.get("pending", [])
e = lambda x: html.escape(str(x if x is not None else ""))
money = lambda v: "US$" + format(int(round(v)), ",") if isinstance(v, (int, float)) else e(v)
title_of = {p["id"]: p["title"] for p in P}

def table(head, rows, cls=""):
    h = "".join(f"<th>{e(x)}</th>" for x in head)
    b = "".join("<tr>" + "".join(f"<td{(' class=num' if isinstance(c, (int, float)) else '')}>{c if isinstance(c, str) and c.startswith('<') else e(c) if not isinstance(c, (int, float)) else money(c)}</td>" for c in r) + "</tr>" for r in rows)
    return f'<div class="tw {cls}"><table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>'

def link(u):
    u = str(u)
    return f'<a href="{e(u)}" target="_blank" rel="noopener">{e(u)}</a>' if u.startswith("http") else e(u)

# portfolio
if PF:
    stack_rows = [[f"Month {r['month']}", r["conservative"], r["base"], r["strong"]] for r in PF["stack"]]
    maxv = max(max(r["strong"], 1) for r in PF["stack"])
    bars = "".join(
        f'<div class="bar"><span class="bl">M{r["month"]}</span><div class="track"><i class="s" style="width:{r["strong"]/maxv*100:.1f}%"></i><i class="b" style="width:{r["base"]/maxv*100:.1f}%"></i><i class="c" style="width:{r["conservative"]/maxv*100:.1f}%"></i><b class="floor" style="left:{min(10000/maxv,1)*100:.1f}%"></b></div><span class="bv">{money(r["base"])}</span></div>'
        for r in PF["stack"])
    phases = "".join(
        f'<div class="card"><div class="eyebrow">{e(ph["months"])}</div><h3>{e(ph["name"])}</h3><p>{e(ph["goal"])}</p>'
        + table(["Stream", "h/week"], [[f'<a href="#{e(h["id"])}">{e(title_of.get(h["id"], h["id"]))}</a>', h["h"]] for h in ph["hours"]] + [["Total", sum(h["h"] for h in ph["hours"])]])
        + "</div>" for ph in PF["phases"])
nav = "".join(f'<a href="#{e(p["id"])}">{e(p["title"])}</a>' for p in P)


def fwblock(p):
    f = p.get("frameworks")
    if not f: return '<p class="legend">Strategy framework analysis is being written for this stream.</p>'
    li = lambda xs: "<ul>" + "".join(f"<li>{e(x)}</li>" for x in xs) + "</ul>"
    vd = table(["Value driver", "Type", "Quantified"], [[v["driver"], v["kind"], v["quantified"]] for v in f["value_drivers"]])
    wt = table(["Segment", "Willingness to pay", "Basis"], [[w["segment"], w["wtp"], w["basis"]] for w in f["wtp"]])
    va = table(["Alternative", "Why we win", "Where we lose"], [[a["alternative"], a["why_we_win"], a["where_we_lose"]] for a in f["vs_alternatives"]])
    df = table(["Defensive mechanism", "Strength (1-5)"], [[d["mechanism"], d["strength_1to5"]] for d in f["defensibility"]])
    return f"""<div class="fw"><h3 class="fwh">Strategy frameworks</h3>
<div class="grid2"><div><h4>Unmet needs</h4>{li(f["unmet_needs"])}</div><div><h4>Unserved segments</h4>{li(f["unserved_segments"])}</div></div>
<h4>Economic value to the customer (EVC)</h4><p>{e(f["evc"])}</p>{vd}
<div class="grid2"><div><h4>Willingness to pay</h4>{wt}<p><strong>How to validate:</strong> {e(f["wtp_validation"])}</p></div><div><h4>Pricing</h4><p>{e(f["pricing"])}</p><h4>Wedge</h4><p>{e(f["wedge"])}</p></div></div>
<h4>Positioning</h4><p class="lede">{e(f["positioning"])}</p>{va}
<div class="grid2"><div><h4>Switching costs in (barriers to buying)</h4><p>{e(f["switching_in"])}</p><h4>Switching costs out (lock-in)</h4><p>{e(f["switching_out"])}</p></div><div><h4>Defensibility</h4>{df}<h4>Envelopment and network effects</h4><p>{e(f["envelopment"])}</p></div></div>
<p><strong>Verdict:</strong> {e(f["verdict"])}</p></div>"""

def pb(p):
    sc = table(["Month", "Conservative", "Base", "Strong"], [[f"Month {s['month']}", s["conservative"], s["base"], s["strong"]] for s in p["scenarios"]])
    steps = table(["When", "Action", "Tool", "Output"], [[s["when"], s["action"], s["tool"], s["output"]] for s in p["build_steps"]])
    offer = table(["Product", "Format", "Price", "Buyer"], [[o["name"], o["format"], o["price"], o["buyer"]] for o in p["offer"]])
    traffic = table(["Channel", "Tactic", "Specifics", "Cadence"], [[t["channel"], t["tactic"], t["specifics"], t["cadence"]] for t in p["traffic"]])
    auto = table(["Task", "How", "Tool", "Cost"], [[a["task"], a["how"], a["tool"], a["cost"]] for a in p["automation"]])
    kpi = table(["Metric", "Target", "By"], [[k["metric"], k["target"], k["by"]] for k in p["kpis"]])
    ex = "".join(f'<li><a href="{e(x["url"])}" target="_blank" rel="noopener">{e(x["name"])}</a>: {e(x["shows"])}</li>' for x in p["examples"])
    feeds = " ".join(f'<a class="chip" href="#{e(f)}">{e(title_of.get(f, f))}</a>' for f in p.get("feeds", []) if f in title_of)
    vi = p.get("verify_issues") or []
    ver = f'<details class="ver"><summary>Skeptic check: {len(vi)} issues found and corrected</summary><ul>{"".join(f"<li>{e(i)}</li>" for i in vi)}</ul></details>' if vi else ""
    src = "".join(f"<li>{link(s)}</li>" for s in p.get("sources", []))
    base12 = next((s["base"] for s in p["scenarios"] if s["month"] == 12), None)
    return f'''<section id="{e(p["id"])}" class="pb">
<div class="eyebrow">Playbook · setup {e(p["setup_hours"])} h · then {e(p["weekly_hours"])} h/week · base month 12: {money(base12) if base12 is not None else "n/a"}</div>
<h2>{e(p["title"])}</h2>
<p class="lede">{e(p["thesis"])}</p>
<div class="grid2"><div><h4>Who buys</h4><p>{e(p["buyer"]["who"])}</p><h4>Where they are</h4><p>{e(p["buyer"]["where"])}</p><h4>When they buy</h4><p>{e(p["buyer"]["trigger"])}</p></div>
<div><h4>How value is extracted</h4><p>{e(p["value_extraction"])}</p><h4>Unit economics</h4><p class="mono">{e(p["unit_economics"])}</p><h4>Tools per month</h4><p>{e(p["tools_cost_monthly"])}</p></div></div>
{fwblock(p)}
<h4>Product ladder</h4>{offer}
<h4>Build it, step by step</h4>{steps}
<h4>Traffic engine</h4>{traffic}
<h4>What runs on autopilot</h4>{auto}
<div class="grid2"><div><h4>Net revenue scenarios (US$/month)</h4>{sc}</div><div><h4>KPIs</h4>{kpi}<h4>Kill or scale</h4><p>{e(p["kill_scale"])}</p></div></div>
<div class="grid2"><div><h4>Risks</h4><p>{e(p["risks"])}</p><h4>Brazil notes</h4><p>{e(p["brazil"])}</p></div><div><h4>Real examples</h4><ul>{ex}</ul>{f"<h4>Feeds and is fed by</h4><p>{feeds}</p>" if feeds else ""}</div></div>
{ver if vi else ''}<details class="src"><summary>Sources</summary><ul>{src}</ul></details>
</section>'''

def timeline():
    import re as _re
    if not PF: return ""
    PB = {p["id"]: p for p in P}
    ph = PF["phases"]; span = []
    for x in ph:
        m = _re.findall(r"\d+", x["months"]); span.append((int(m[0]), int(m[1])))
    core = []
    for i, x in enumerate(ph):
        for sid in x["streams"]:
            if sid not in [c[0] for c in core]: core.append((sid, i))
    last = {sid: max(i for i, x in enumerate(ph) if sid in x["streams"]) for sid, _ in core}
    M = span[-1][1]
    rows = ""
    for sid, i in core:
        a, b = span[i][0], span[last[sid]][1]
        t = PB.get(sid, {}).get("title", sid)
        rows += f'<div class="gr"><a href="#{e(sid)}" class="gl">{e(sid)}</a><div class="gt"><i style="left:{a/M*100:.1f}%;width:{(b-a)/M*100:.1f}%" title="{e(t)}"></i></div></div>'
    ticks = "".join(f'<span style="left:{m/M*100:.1f}%">M{m}</span>' for m in [0, 3, 6, 9, 12, 18, 24] if m <= M)
    gantt = f'<div class="gantt"><div class="gr"><span></span><div class="gx">{ticks}</div></div>{rows}</div>'
    steps = ""
    for i, x in enumerate(ph):
        new = [sid for sid, j in core if j == i]
        hrs = ", ".join(f'{e(h["id"])} {h["h"]}h' for h in x["hours"])
        body = ""
        for sid in new:
            p = PB.get(sid)
            if not p: continue
            li = "".join(f'<li><strong>{e(st.get("when",""))}:</strong> {e(st.get("action",""))}</li>' for st in p.get("build_steps", []))
            body += f'<details class="stp"><summary><strong>{e(sid)}</strong>: {e(p["title"])} ({len(p.get("build_steps",[]))} steps)</summary><ol>{li}</ol></details>'
        cont = [sid for sid in x["streams"] if sid not in new]
        launch = f"<h4>Launch now</h4>{body}" if body else ""
        keep = f'<p class="legend">Keep running: {e(", ".join(cont))}</p>' if cont else ""
        steps += f'<div class="ph"><h3>{e(x["name"])} <span class="legend">months {e(x["months"])}</span></h3><p>{e(x["goal"])}</p><p class="legend">Weekly hours: {hrs}</p>{launch}{keep}</div>'
    gates = "".join(f'<tr><td><a href="#{e(sid)}">{e(sid)}</a></td><td>M{span[i][0]}</td><td>{e(PB[sid]["kill_scale"])}</td></tr>' for sid, i in core if sid in PB)
    return (f'<section id="timeline"><h2>What to do, when: master timeline</h2><p class="lede">The {len(core)} core streams from the stack plan, in launch order. Bars show when each stream is active (months from 12 Oct 2026). Under each phase, open a stream to see its build steps in order.</p>'
            f'{gantt}<h4>Step by step, phase by phase</h4>{steps}'
            f'<h4>Decision gates (kill, hold or scale)</h4><div class="tw"><table><tr><th>Stream</th><th>Starts</th><th>Rule</th></tr>{gates}</table></div></section>')

PORT = (f'''<section id="portfolio"><h2>The stack plan</h2><p class="lede">{e(PF["thesis"])}</p>
<h4>Total net revenue by month (US$/month)</h4><div class="bars">{bars}</div>
<p class="legend">Dark: conservative · medium: base · light: strong · vertical line: US$10k floor. Value shown: base case.</p>
{table(["Month", "Conservative", "Base", "Strong"], stack_rows)}
<p><strong>When the US$10k floor is cleared:</strong> {e(PF["floor_month"])}</p>
<h4>Launch phases (hours per week)</h4><div class="cards">{phases}</div>
<h4>The flywheel</h4><p>{e(PF["flywheel"])}</p>
<h4>Defer or drop</h4><ul>{"".join(f"<li>{e(c)}</li>" for c in PF["cut_list"])}</ul></section>
<section id="first14"><h2>First 14 days</h2><ol>{"".join(f"<li>{e(x)}</li>" for x in PF["first_14_days"])}</ol></section>''') if PF else (f'<section id="portfolio"><h2>The stack plan</h2><p class="lede">Being built: the stack plan is assembled after all playbooks finish. {len(P)} of {len(P)+len(PEND)} playbooks are ready below; still running: {e(", ".join(PEND)) or "none"}.</p></section>')
page = f'''<title>Calebe Revenue Playbooks</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,600&family=Public+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
/* Layout: operator's manual. Sticky stream index on wide screens; portfolio first, then one deep section per stream. */
:root{{--bg:#f5f7f6;--surface:#fff;--sunk:#e9eeec;--fg:#14211d;--muted:#55645f;--line:#d3dcd8;--accent:#0d6655;--brass:#8a5a00;--soft:#d8ece6;
--display:"Newsreader",Georgia,serif;--body:"Public Sans","Segoe UI",system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#0f1715;--surface:#16211e;--sunk:#1c2a26;--fg:#e4ece9;--muted:#9db0aa;--line:#2b3b36;--accent:#5cc2a8;--brass:#e0b45a;--soft:#163a32;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#0f1715;--surface:#16211e;--sunk:#1c2a26;--fg:#e4ece9;--muted:#9db0aa;--line:#2b3b36;--accent:#5cc2a8;--brass:#e0b45a;--soft:#163a32;color-scheme:dark}}
*{{box-sizing:border-box}}body{{background:var(--bg);color:var(--fg);font:15px/1.6 var(--body);margin:0}}a{{color:var(--accent)}}
.wrap{{max-width:1240px;margin:0 auto;padding-inline:20px;padding-block:28px 64px;display:grid;grid-template-columns:240px minmax(0,1fr);gap:32px}}
nav{{position:sticky;top:env(safe-area-inset-top,0px);align-self:start;max-height:100vh;overflow:auto;padding-block:8px;display:grid;gap:2px}}
nav a{{text-decoration:none;color:var(--muted);font-size:13px;padding:5px 8px;border-radius:6px}}nav a:hover{{background:var(--sunk);color:var(--fg)}}nav .nh{{font:700 11px var(--body);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:10px 8px 4px}}
main{{min-width:0}}h1{{font:600 clamp(30px,4.5vw,44px)/1.1 var(--display);margin:.2em 0 .3em;text-wrap:balance}}h2{{font:600 28px/1.2 var(--display);margin:4px 0 8px;text-wrap:balance}}h3{{font:600 17px/1.3 var(--body);margin:0 0 6px}}
h4{{font:700 11.5px/1 var(--body);letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin:20px 0 8px}}
.eyebrow{{font:600 12px/1.3 var(--body);letter-spacing:.08em;text-transform:uppercase;color:var(--brass)}}
.lede{{font-size:16.5px;max-width:75ch}}p{{max-width:80ch}}.mono{{font:13px/1.55 var(--mono);white-space:pre-wrap}}
section{{padding-block:28px;border-bottom:1px solid var(--line);scroll-margin-top:12px}}
.tw{{overflow-x:auto;background:var(--surface);border:1px solid var(--line);border-radius:10px}}table{{border-collapse:collapse;width:100%;font-size:13.5px}}
th,td{{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top}}th{{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);background:var(--sunk)}}td.num{{font-family:var(--mono);font-variant-numeric:tabular-nums;white-space:nowrap}}
.grid2{{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:8px 28px}}.grid2>div{{min-width:0}}
.cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}}.card{{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:16px;min-width:0}}
.chip{{display:inline-block;font-size:12.5px;padding:3px 9px;border-radius:999px;background:var(--soft);text-decoration:none;margin:2px}}
.bars{{display:grid;gap:8px;max-width:760px}}.bar{{display:grid;grid-template-columns:44px 1fr 90px;gap:10px;align-items:center;font-size:13px}}
.track{{position:relative;height:18px;background:var(--sunk);border-radius:4px}}.track i{{position:absolute;left:0;top:0;bottom:0;border-radius:4px}}
.track .s{{background:var(--brass);opacity:.35}}.track .b{{background:var(--accent);opacity:.65}}.track .c{{background:var(--accent)}}
.track .floor{{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--fg)}}.bv{{font-family:var(--mono);text-align:right}}
.fw{{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:4px 18px 16px;margin-top:16px}}.fwh{{font:600 20px/1.2 var(--display);margin:14px 0 0;color:var(--accent)}}
.legend{{font-size:12.5px;color:var(--muted)}}details{{margin-top:12px}}summary{{cursor:pointer;color:var(--muted);font-size:13px}}
.gantt{{display:grid;gap:5px;margin:12px 0;max-width:900px}}.gr{{display:grid;grid-template-columns:150px 1fr;gap:10px;align-items:center;font-size:13px}}.gl{{font-family:var(--mono);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
.gt{{position:relative;height:16px;background:var(--sunk);border-radius:4px}}.gt i{{position:absolute;top:0;bottom:0;background:var(--accent);border-radius:4px}}.gx{{position:relative;height:16px;font:11px var(--mono);color:var(--muted)}}.gx span{{position:absolute;transform:translateX(-50%)}}.gx span:first-child{{transform:none}}
.ph{{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px 18px;margin:12px 0}}.stp ol{{font-size:14px}}.stp li{{margin:4px 0}}
@media (max-width:860px){{.wrap{{grid-template-columns:1fr}}nav{{position:static;max-height:none;grid-auto-flow:column;overflow-x:auto}}nav .nh{{display:none}}}}
</style>
<div class="wrap">
<nav aria-label="Streams"><div class="nh">Portfolio</div><a href="#portfolio">Stack plan</a><a href="#first14">First 14 days</a><a href="#timeline">Master timeline</a><div class="nh">Playbooks</div>{nav}</nav>
<main>
<header><div class="eyebrow">Operating playbooks · October 2026</div><h1>Calebe Revenue Playbooks</h1>
<p class="lede">{len(P)+len(PEND)} revenue streams you can run at the same time, each with a strategy analysis (unmet needs, economic value, willingness to pay, pricing, wedge, positioning, switching costs, defensibility) plus the exact product ladder, where buyers are, step-by-step build, traffic engine, automation, unit economics and kill-or-scale rules. US$10k a month is the floor the stack has to clear, not the ceiling.</p></header>
{PORT}
{timeline()}
{"".join(pb(p) for p in P)}
<p class="legend">Figures labelled SOURCED, CALC or ASSUMPTION as the agents reported them. No income is guaranteed; not tax or legal advice.</p>
</main></div>'''
open(out, "w").write(page)
print("wrote", out, len(page))
