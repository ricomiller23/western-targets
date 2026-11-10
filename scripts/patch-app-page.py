path = '/Users/ericmiller/.gemini/antigravity/scratch/western-targets/app/page.tsx'
content = open(path).read()

# 1. Add state and tier to default filters
old_filters = '''  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priorityBucket: "all_priority",'''

new_filters = '''  const [filters, setFilters] = useState<FilterState>({
    search: "",
    state: "all",
    tier: "all",
    priorityBucket: "all_priority",'''

content = content.replace(old_filters, new_filters)

# 2. Add state and tier filtering logic to baseFilteredDomestic
old_filter_code = '''    if (filters.search) {
      list = list.filter(t => matchTargetSearch(t, filters.search));
    }'''

new_filter_code = '''    if (filters.search) {
      list = list.filter(t => matchTargetSearch(t, filters.search));
    }

    if (filters.state && filters.state !== "all") {
      list = list.filter(t => (t.stateCode || "").toUpperCase() === filters.state!.toUpperCase() || (t.state || "").toUpperCase() === filters.state!.toUpperCase());
    }

    if (filters.tier && filters.tier !== "all") {
      list = list.filter(t => (t.tier || "").toLowerCase() === filters.tier!.toLowerCase());
    }'''

content = content.replace(old_filter_code, new_filter_code)

# 3. Replace hardcoded text in Header & KPI podiums
content = content.replace(
    'Maxim Conference Diligence, Market Data &amp; Restructuring Engine',
    'Western Targets Regional OTC Diligence & Restructuring Engine'
)
content = content.replace(
    'Audited SEC forensic screening across 113 presenting and screened companies. Tracking liquidity runways, working capital deficits, 2-year financing flows, and 24-month registration statement shelf gaps.',
    'Audited forensic screening across 119 Western US companies (CA, NV, AZ, CO, WY, ID). Tracking aged debt, Section 3(a)(10) court restructuring eligibility, equity line facilities, cash runways, and working capital deficits.'
)
content = content.replace(
    '<p className="font-mono text-xl sm:text-2xl font-black text-emerald-400 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">\n                    113 Issuers\n                  </p>',
    '<p className="font-mono text-xl sm:text-2xl font-black text-emerald-400 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">\n                    {metadata.totalTargets} Issuers\n                  </p>'
)
content = content.replace(
    '<p className="font-mono text-xl sm:text-2xl font-black text-rose-400 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">\n                    23 Targets\n                  </p>',
    '<p className="font-mono text-xl sm:text-2xl font-black text-rose-400 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">\n                    {metadata.negativeWorkingCapitalCount} Targets\n                  </p>'
)
content = content.replace(
    '<p className="font-mono text-xl sm:text-2xl font-black text-amber-400 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">\n                    12 Targets\n                  </p>',
    '<p className="font-mono text-xl sm:text-2xl font-black text-amber-400 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">\n                    {metadata.criticalCount} Targets\n                  </p>'
)
content = content.replace(
    '<p className="font-mono text-xl sm:text-2xl font-black text-[#f5d378] mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">\n                    65 Targets\n                  </p>',
    '<p className="font-mono text-xl sm:text-2xl font-black text-[#f5d378] mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">\n                    {metadata.noActiveRegStatementsCount || 117} Targets\n                  </p>'
)

# 4. Strip "(domesticTargets.length} Domestic • 13 Foreign/SEDAR Excluded)"
content = content.replace(
    'Showing <strong className="text-white">{filteredTargets.length}</strong> of {priorityCounts.allPriority} Priority Issuers ({domesticTargets.length} Domestic • 13 Foreign/SEDAR Excluded)',
    'Showing <strong className="text-white">{filteredTargets.length}</strong> of {domesticTargets.length} Western OTC Targets across 6 Western States'
)

open(path, 'w').write(content)
print("Updated app/page.tsx")
