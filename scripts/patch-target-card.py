path = '/Users/ericmiller/.gemini/antigravity/scratch/western-targets/components/TargetCard.tsx'
content = open(path).read()

old_badges = '''            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-base font-black text-white tracking-tight group-hover:text-amber-400 transition-colors">
                {target.ticker}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-1.5 py-0.2 rounded">
                {target.secStatus === "sec_verified_filer" ? "SEC" : target.regulatoryPortal?.split(" ")[0] || "Foreign"}
              </span>'''

new_badges = '''            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-base font-black text-white tracking-tight group-hover:text-amber-400 transition-colors">
                {target.ticker}
              </span>
              <span className="rounded bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-mono font-bold text-amber-300">
                {target.stateCode || target.state || "US"}
              </span>
              <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.2 text-[9px] font-mono font-medium text-zinc-300">
                {target.tier || "OTC"}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-1.5 py-0.2 rounded">
                {target.secStatus === "sec_verified_filer" ? "SEC" : "Alt Rep"}
              </span>'''

content = content.replace(old_badges, new_badges)
open(path, 'w').write(content)
print("Updated TargetCard.tsx")
