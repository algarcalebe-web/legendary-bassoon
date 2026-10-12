"""Collect finished playbooks from workflow journals into one JSON (partial results allowed)."""
import json, sys, glob
W = '/root/.claude/projects/-home-user-legendary-bassoon/fdf86186-d2b5-5fda-b68d-796c8730fe71/subagents/workflows/'
RUNS = ['wf_90aeb2df-2ad', 'wf_4a57cc01-2f9', 'wf_99703fae-c5a', 'wf_ffef6c07-e1c', 'wf_77aa1970-6ef']
ORDER = ['pro-firm-pricing','ai-product-pricing','ai-roi-kit','ai-risk-valuation','sustainability-premium','green-export-value','br-tax-reform','yt-finance','course-library','model-templates','travel-stack','b2b-referrals','job-board','directory','hours-anchor','async-reviews','eu-ai-literacy','deal-channel','vc-scout','paid-ads-affiliate','fixed-fee-studio','linkedin-pricing','pj-role','fractional-roles','grant-teardown','ad-desk','whitelabel-backoffice','expert-calls','expert-matching','talent-referrals','hotmart-affiliate','sourcing-agent','travel-host-agency','airbnb-cohost','stock-media','itinerary-licensing','automation-templates','framework-licensing','finance-apps','data-products','seo-calculators','lead-gen-br','acl-energy','carbon-credits','lei-do-bem','export-readiness','ai-spend-fpa','geo-services','niche-calculators','ai-adoption-ptes','ai-automation-agency','dropshipping','print-on-demand','site-flipping']
pb, fx, fw, portfolio = {}, {}, {}, None
for run in RUNS:
    for f in glob.glob(W + run + '*/journal.jsonl'):
        rows = [json.loads(l) for l in open(f)]
        lab = {r['key']: r.get('label') for r in rows if r.get('key') and r.get('label')}
        for r in rows:
            if r.get('type') != 'result': continue
            v = r.get('result') if 'result' in r else r.get('value')
            if isinstance(v, str):
                try: v = json.loads(v)
                except Exception: continue
            l = lab.get(r.get('key'), '')
            if l.startswith('pb:'): pb[l[3:]] = v
            elif l.startswith('fix:'): fx[l[4:]] = v
            elif l.startswith('fw:'): fw[l[3:]] = v
            elif l == 'portfolio': portfolio = v
out = []
for i in ORDER:
    if i in pb:
        p = dict(pb[i])
        if i in fx and isinstance(fx[i], dict):
            p.update(fx[i].get('corrected') or {}); p['verify_issues'] = fx[i].get('issues', [])
        else:
            p['verify_issues'] = None
        if i in fw: p['frameworks'] = fw[i]
        if 'frameworks' in pb[i]: p['frameworks'] = pb[i]['frameworks']
        out.append(p)
json.dump({'playbooks': out, 'portfolio': portfolio, 'pending': [i for i in ORDER if i not in pb]}, open(sys.argv[1], 'w'), ensure_ascii=False)
print(len(out), 'playbooks;', sum(1 for p in out if 'frameworks' in p), 'with frameworks; portfolio', bool(portfolio))
