path = '/Users/ericmiller/.gemini/antigravity/scratch/western-targets/components/TargetTable.tsx'
content = open(path).read()

old_issuer = '''                {/* Issuer */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-black text-white group-hover:text-amber-400 text-sm">
                      {t.ticker}
                    </span>
                    {t.isPanelist && (
                      <span className="rounded bg-purple-500/20 border border-purple-500/40 px-1 py-0.2 text-[9px] font-bold text-purple-300">
                        Panelist
                      </span>
                    )}
                    {t.secStatus !== "sec_verified_filer" && (
                      <span className="rounded bg-sky-500/10 border border-sky-500/30 px-1 py-0.2 text-[9px] font-semibold text-sky-300">
                        {t.secStatus === "bankrupt_defunct" ? "Bankrupt" : t.exchange || "Exempt"}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate max-w-[160px]" title={t.name}>
                    {t.name}
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500">
                    {t.secStatus === "sec_verified_filer" ? `CIK: ${t.cik}` : t.regulatoryPortal}
                  </div>
                </td>'''

new_issuer = '''                {/* Issuer */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-black text-white group-hover:text-amber-400 text-sm">
                      {t.ticker}
                    </span>
                    <span className="rounded bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-mono font-bold text-amber-300">
                      {t.stateCode || t.state || "US"}
                    </span>
                    <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.2 text-[9px] font-mono font-medium text-zinc-300">
                      {t.tier || "OTC"}
                    </span>
                    {t.secStatus !== "sec_verified_filer" && (
                      <span className="rounded bg-sky-500/10 border border-sky-500/30 px-1 py-0.2 text-[9px] font-semibold text-sky-300">
                        {t.secStatus === "otc_alternative_reporting" ? "Alt Reporting" : t.secStatus === "bankrupt_defunct" ? "Bankrupt" : t.exchange || "Exempt"}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate max-w-[160px]" title={t.name}>
                    {t.name}
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500">
                    {t.secStatus === "sec_verified_filer" ? `CIK: ${t.cik}` : `${t.state || "Western US"} • ${t.secType || "Common"}`}
                  </div>
                </td>'''

content = content.replace(old_issuer, new_issuer)
open(path, 'w').write(content)
print("Updated TargetTable.tsx")
