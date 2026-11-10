# Patch CrmPipelineView.tsx
p_crm = '/Users/ericmiller/.gemini/antigravity/scratch/western-targets/components/CrmPipelineView.tsx'
c_crm = open(p_crm).read()
c_crm = c_crm.replace('Maxim Conference Outreach Pipeline', 'Western Targets Restructuring CRM Pipeline')
open(p_crm, 'w').write(c_crm)

# Patch GlobalSearchModal.tsx
p_gsm = '/Users/ericmiller/.gemini/antigravity/scratch/western-targets/components/GlobalSearchModal.tsx'
c_gsm = open(p_gsm).read()
c_gsm = c_gsm.replace('No matching Maxim conference targets found', 'No matching Western targets found')
open(p_gsm, 'w').write(c_gsm)

print("Updated CrmPipelineView and GlobalSearchModal")
