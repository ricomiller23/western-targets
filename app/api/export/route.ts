import { NextRequest, NextResponse } from "next/server";
import { maximStore } from "@/lib/store";
import { 
  getPriorityBucket, 
  getPriorityBadgeMeta, 
  getPriorityOrderWeight, 
  isForeignSedarIssuer 
} from "@/lib/priority";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterSearch = searchParams.get("search") || undefined;
    const filterSector = searchParams.get("sector") || undefined;
    const filterUrgency = searchParams.get("urgency") || undefined;
    const filterWc = (searchParams.get("workingCapital") as any) || undefined;
    const filterStatus = (searchParams.get("status") as any) || undefined;
    const filterPanelist = (searchParams.get("panelist") as any) || undefined;
    const filterStage = searchParams.get("stage") || undefined;

    let targets = maximStore.getTargets({
      search: filterSearch,
      sector: filterSector,
      urgency: filterUrgency,
      workingCapital: filterWc,
      status: filterStatus,
      panelist: filterPanelist,
      stage: filterStage
    });

    // Exclude Foreign / SEDAR issuers by default unless explicitly requested
    if (searchParams.get("includeForeign") !== "true") {
      targets = targets.filter(t => !isForeignSedarIssuer(t));
    }

    const filterSecStatus = searchParams.get("secStatus");
    if (filterSecStatus && filterSecStatus !== "all") {
      targets = targets.filter(t => t.secStatus === filterSecStatus);
    }

    if (searchParams.get("noActiveReg") === "true") {
      targets = targets.filter(t => t.noActiveRegStatements24M);
    }

    // Sort by Priority Column Order (P1 -> P2 -> Secondary Domestic)
    targets.sort((a, b) => {
      const wA = getPriorityOrderWeight(a);
      const wB = getPriorityOrderWeight(b);
      if (wA !== wB) return wA - wB;
      return (a.financialMetrics.runwayMonths ?? 999) - (b.financialMetrics.runwayMonths ?? 999);
    });

    const headers = [
      "Priority Column",
      "Ticker",
      "State",
      "OTC Tier",
      "Company Name",
      "CIK",
      "Exchange",
      "Regulatory Venue",
      "Stock Price",
      "Currency",
      "Avg Monthly Volume",
      "No Active Reg Statements (24M)",
      "Filing Form",
      "Period End Date",
      "SEC Accession Number",
      "SEC Direct Document URL",
      "Cash On Hand ($)",
      "Cash On Hand (Display)",
      "Current Assets ($)",
      "Current Liabilities ($)",
      "Working Capital ($)",
      "Working Capital (Display)",
      "Negative Working Capital",
      "Current Ratio",
      "Monthly Net Operating Burn ($)",
      "Runway (Months)",
      "Runway (Display)",
      "Capital Need Urgency",
      "Urgency Rationale",
      "Calculation Methodology",
      "8-K Disclosure Signals",
      "Active Shelves Filed",
      "Baby Shelf Constrained (I.B.6)",
      "Dilution Overhang Risk",
      "Net Financing Cash Flow 2Y ($)",
      "CEO Name",
      "CEO Title",
      "CEO Email",
      "Corporate Phone",
      "CFO Name",
      "CFO Title",
      "CFO Email",
      "Securities Counsel Partner",
      "Securities Counsel Firm",
      "Securities Counsel Email",
      "CRM Contact Status",
      "CRM Response Outcome",
      "CRM Next Step",
      "SEC EDGAR Profile URL"
    ];

    const rows = targets.map(t => {
      const m = t.financialMetrics;
      const mk = t.marketData;
      const f = t.financingHistory2Y;
      const r = t.registrationStatements2Y;
      const pMeta = getPriorityBadgeMeta(t);
      const ceo = t.contacts.find(c => c.id.includes("ceo"));
      const cfo = t.contacts.find(c => c.id.includes("cfo"));
      const counsel = t.contacts.find(c => c.id.includes("counsel"));

      const sigs = t.signals8K && t.signals8K.length > 0 
        ? t.signals8K.map(s => `${s.item}: ${s.title} (${s.date})`).join(" | ")
        : "None";

      return [
        `"${pMeta.fullLabel}"`,
        `"${t.ticker}"`,
        `"${t.state || "Western US"}"`,
        `"${t.tier || "OTC"}"`,
        `"${t.name.replace(/"/g, '""')}"`,
        `"${t.cik}"`,
        `"${t.exchange}"`,
        `"${t.secStatus === "sec_verified_filer" ? "SEC EDGAR" : t.regulatoryPortal || "Exempt"}"`,
        `"${mk?.priceDisplay || "N/A"}"`,
        `"${mk?.currency || "USD"}"`,
        `"${mk?.avgMonthlyVolumeDisplay || "N/A"}"`,
        t.noActiveRegStatements24M ? "YES" : "NO",
        `"${m.filingForm}"`,
        `"${m.asOfDate}"`,
        `"${m.accessionNumber}"`,
        `"${m.secViewerUrl || ""}"`,
        m.cashOnHand !== null ? m.cashOnHand : "N/A",
        `"${m.cashOnHandDisplay}"`,
        m.currentAssets !== null ? m.currentAssets : "N/A",
        m.currentLiabilities !== null ? m.currentLiabilities : "N/A",
        m.workingCapital !== null ? m.workingCapital : "N/A",
        `"${m.workingCapitalDisplay}"`,
        m.isNegativeWorkingCapital ? "YES" : "NO",
        m.currentRatio !== null ? m.currentRatio : "N/A",
        m.monthlyBurnRate,
        m.runwayMonths,
        `"${m.runwayDisplay}"`,
        `"${m.capitalNeedUrgency.toUpperCase()}"`,
        `"${(m.urgencyRationale || "").replace(/"/g, '""')}"`,
        `"${(m.calculationMethodology || "").replace(/"/g, '""')}"`,
        `"${sigs.replace(/"/g, '""')}"`,
        r.activeShelvesFiled,
        r.babyShelfConstrained ? "YES" : "NO",
        `"${r.dilutionRisk}"`,
        f.netFinancingCashFlow !== null ? f.netFinancingCashFlow : "N/A",
        `"${(ceo?.name || "").replace(/"/g, '""')}"`,
        `"${(ceo?.title || "").replace(/"/g, '""')}"`,
        `"${ceo?.email || ""}"`,
        `"${t.telephone || ""}"`,
        `"${(cfo?.name || "").replace(/"/g, '""')}"`,
        `"${(cfo?.title || "").replace(/"/g, '""')}"`,
        `"${cfo?.email || ""}"`,
        `"${(counsel?.name || "").replace(/"/g, '""')}"`,
        `"${(counsel?.firm || counsel?.entity || "").replace(/"/g, '""')}"`,
        `"${counsel?.email || ""}"`,
        `"${t.crm.contactStatus}"`,
        `"${t.crm.responseOutcome}"`,
        `"${(t.crm.nextStep || "").replace(/"/g, '""')}"`,
        `"${t.secEdgarUrl}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Western_Targets_Intelligence_${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const allTargets = maximStore.getTargets();
    const domesticTargets = allTargets.filter(t => !isForeignSedarIssuer(t));
    const p1 = domesticTargets.filter(t => getPriorityBucket(t) === "priority_1_crit_urgent");
    const p2 = domesticTargets.filter(t => getPriorityBucket(t) === "priority_2_moderate");
    const today = new Date().toISOString().slice(0, 10);
    const reportPath = path.join("/Users/ericmiller/Downloads", `Western_Targets_Restructuring_Dossier_${today}.md`);

    let md = `# WESTERN TARGETS — Regional OTC Diligence & Restructuring Dossier
**Target Universe:** ${domesticTargets.length} Western US OTC Issuers across 6 States (CA, NV, AZ, CO, WY, ID)  
- **Priority 1 — Both Critical & Urgent Flagged Issuers (With / Without Reg Statements):** ${p1.length} companies  
- **Priority 2 — Moderate Issuers (6 to 12 Months Runway):** ${p2.length} companies  
**Date:** ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}  

---

## Priority 1: Critical & Urgent Flagged Issuers (With / Without Reg Statements) (${p1.length})

| # | Ticker | Company Name | Exchange | Stock Price | Monthly Volume | Cash on Hand | Working Capital | Runway | Urgency | Reg / S-3 Status (24M) |
| :-: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
`;

    p1.forEach((t, i) => {
      const m = t.financialMetrics;
      const mk = t.marketData;
      const reg = t.registrationStatements2Y;
      const regStr = t.noActiveRegStatements24M
        ? "Without Reg (24M)"
        : reg.activeShelvesFiled > 0
          ? `With S-3 Shelf (${reg.activeShelvesFiled})`
          : `With Reg (${reg.filingCount} Filings • No S-3)`;
      md += `| ${i + 1} | **${t.ticker}** | ${t.name} | ${t.exchange} | **${mk?.priceDisplay || "N/A"}** | ${mk?.avgMonthlyVolumeDisplay || "N/A"} | ${m.cashOnHandDisplay} | ${m.workingCapitalDisplay} | **${m.runwayDisplay}** | ${m.capitalNeedUrgency.toUpperCase()} | ${regStr} |
`;
    });

    md += `
---
## Priority 2: Moderate Issuers (6 to 12 Months Runway) (${p2.length})

| # | Ticker | Company Name | Exchange | Stock Price | Monthly Vol | Cash on Hand | Working Capital | Runway | Reg / S-3 Status (24M) |
| :-: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
`;

    p2.forEach((t, i) => {
      const m = t.financialMetrics;
      const mk = t.marketData;
      const reg = t.registrationStatements2Y;
      const regStr = t.noActiveRegStatements24M
        ? "Without Reg (24M)"
        : reg.activeShelvesFiled > 0
          ? `With S-3 Shelf (${reg.activeShelvesFiled})`
          : `With Reg (${reg.filingCount} Filings • No S-3)`;
      md += `| ${i + 1} | **${t.ticker}** | ${t.name} | ${t.exchange} | **${mk?.priceDisplay || "N/A"}** | ${mk?.avgMonthlyVolumeDisplay || "N/A"} | ${m.cashOnHandDisplay} | ${m.workingCapitalDisplay} | **${m.runwayDisplay}** | ${regStr} |
`;
    });

    fs.writeFileSync(reportPath, md, "utf8");

    return NextResponse.json({
      success: true,
      path: reportPath,
      reportPath,
      targetsExported: p1.length + p2.length
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
