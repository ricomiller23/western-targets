path = '/Users/ericmiller/.gemini/antigravity/scratch/western-targets/app/api/export/route.ts'
content = open(path).read()

# Add State and Tier to CSV headers
old_hdr = '''    const headers = [
      "Priority Column",
      "Ticker",
      "Company Name",'''

new_hdr = '''    const headers = [
      "Priority Column",
      "Ticker",
      "State",
      "OTC Tier",
      "Company Name",'''

content = content.replace(old_hdr, new_hdr)

# Add State and Tier to CSV row mapping
old_row = '''      return [
        `"${pMeta.fullLabel}"`,
        `"${t.ticker}"`,
        `"${t.name.replace(/"/g, '""')}"`,'''

new_row = '''      return [
        `"${pMeta.fullLabel}"`,
        `"${t.ticker}"`,
        `"${t.state || "Western US"}"`,
        `"${t.tier || "OTC"}"`,
        `"${t.name.replace(/"/g, '""')}"`,'''

content = content.replace(old_row, new_row)

# Replace CSV filename
content = content.replace(
    'Maxim_Targets_Priority_Columns_${new Date().toISOString().slice(0, 10)}.csv',
    'Western_Targets_Intelligence_${new Date().toISOString().slice(0, 10)}.csv'
)

# Replace Markdown report filename and title
content = content.replace(
    'Maxim_Targets_Priority_Columns_Report_${today}.md',
    'Western_Targets_Restructuring_Dossier_${today}.md'
)

content = content.replace(
    '# MAXIM TARGETS — Priority Columns & Forensic Diligence Report\n**Priority Column Universe:** ${p1.length + p2.length} Priority Issuers (${domesticTargets.length} Domestic • 13 Foreign/SEDAR Excluded)',
    '# WESTERN TARGETS — Regional OTC Diligence & Restructuring Dossier\n**Target Universe:** ${domesticTargets.length} Western US OTC Issuers across 6 States (CA, NV, AZ, CO, WY, ID)'
)

open(path, 'w').write(content)
print("Updated app/api/export/route.ts")
