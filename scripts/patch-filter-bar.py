import re

path = '/Users/ericmiller/.gemini/antigravity/scratch/western-targets/components/FilterBar.tsx'
content = open(path).read()

# Fix className in state pills
old_btn = '''          <button
            key={s.code}
            type="button"
            onClick={() => update({ state: (filters.state || "all") === s.code ? "all" : s.code })}
            className={}
          >'''

new_btn = '''          <button
            key={s.code}
            type="button"
            onClick={() => update({ state: (filters.state || "all") === s.code ? "all" : s.code })}
            className={`px-2.5 py-1 rounded-xl border transition-all cursor-pointer inline-flex items-center gap-1.5 font-mono text-[11px] ${
              (filters.state || "all") === s.code
                ? "bg-gradient-to-r from-amber-500/25 to-yellow-500/20 border-amber-500 text-amber-200 font-bold shadow-sm"
                : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >'''

content = content.replace(old_btn, new_btn)
open(path, 'w').write(content)
print("Fixed FilterBar.tsx state pills className")
