path = '/Users/ericmiller/.gemini/antigravity/scratch/western-targets/components/TargetDrawer.tsx'
content = open(path).read()

# Replace Maxim Conference Follow-Up
content = content.replace('Maxim Conference Follow-Up', 'Executive Restructuring Proposal (3a10 & Debt)')

# Add State and Tier badges to header
old_hdr = '''              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-black text-white tracking-tight">
                  {target.ticker}
                </span>
                <span className="text-xs font-mono text-zinc-400 border border-zinc-750 px-2 py-0.5 rounded">
                  {target.secStatus === "sec_verified_filer" ? "SEC Verified" : target.regulatoryPortal || "Foreign Exchange"}
                </span>'''

new_hdr = '''              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-2xl font-black text-white tracking-tight">
                  {target.ticker}
                </span>
                <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
                  {target.stateCode || target.state || "Western US"}
                </span>
                <span className="rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs font-mono font-medium text-zinc-300">
                  {target.tier || "OTC"}
                </span>
                <span className="text-xs font-mono text-zinc-400 border border-zinc-750 px-2 py-0.5 rounded">
                  {target.secStatus === "sec_verified_filer" ? "SEC EDGAR Filer" : "OTC Markets Alt Reporting"}
                </span>'''

content = content.replace(old_hdr, new_hdr)
open(path, 'w').write(content)
print("Updated TargetDrawer.tsx")
