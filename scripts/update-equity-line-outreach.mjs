import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../data/maxim-targets.json");
const STORE_PATH = path.resolve(__dirname, "../data/maxim-store.json");

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const targets = data.targets;

let updatedCount = 0;

targets.forEach((target) => {
  const m = target.financialMetrics || {};
  const runwayMonths = m.runwayMonths != null && m.runwayMonths !== "Not yet sourced" ? m.runwayMonths : "under 12";
  const cashMillions = m.cashOnHand ? (m.cashOnHand / 1e6).toFixed(1) : "N/A";
  const isNegativeWorkingCapital = m.workingCapital != null && m.workingCapital < 0;
  const workingCapitalStatus = isNegativeWorkingCapital
    ? `Negative working capital deficit of $${(Math.abs(m.workingCapital) / 1e6).toFixed(1)}M`
    : (m.workingCapital ? `Working capital surplus of $${(m.workingCapital / 1e6).toFixed(1)}M` : "Tight operating liquidity");

  const financingSummary = target.hasActiveRegStatements24M
    ? `Active S-3/ATM shelf on file (${target.regStatementForms24M ? target.regStatementForms24M.join(", ") : "Shelf Registration"})`
    : `Zero active S-3 shelf registration statements on file in past 24 months`;

  const counsel = (target.contacts || []).find((c) =>
    c.id.includes("counsel") ||
    (c.title && c.title.toLowerCase().includes("counsel")) ||
    (c.name && c.name.toLowerCase().includes("esq"))
  ) || target.contacts[0] || { name: "Counsel", firm: "Securities Counsel" };

  const firmName = counsel.firm || counsel.entity || "your firm";

  target.outreach = target.outreach || {};

  target.outreach.legalSubject = `CONFIDENTIAL // FOR SECURITIES COUNSEL: ${target.name} (${target.ticker}) — Committed Equity Line Facility & Available Clean Shells`;

  target.outreach.legalBody = `Dear ${counsel.name},

I am reaching out to you in your capacity as outside securities and corporate counsel representing ${target.name} (${target.ticker} • CIK: ${target.cik || "SEC Filer"}).

Our institutional capital desk specializes in structured public market financings, non-toxic growth capital, and balance sheet recapitalizations for NASDAQ, NYSE, and OTC-listed corporate issuers.

Based on our review of ${target.name}'s recent SEC periodic disclosures, we noted the company's operating balance sheet and liquidity profile:
• Estimated Cash Runway: ~${runwayMonths} months ($${cashMillions}M reported cash reserves)
• Working Capital Position: ${workingCapitalStatus}
• Shelf Profile: ${financingSummary}

### 1. Committed Equity Line of Credit (ELOC / Equity Purchase Facility)
We are currently offering committed equity line facilities (typically $5M to $25M+, calibrated to market capitalization and daily trading volume) structured to provide continuous, predictable capital access directly to the treasury:
• 100% Issuer-Controlled: The company dictates the timing, frequency, and size of every draw.
• Non-Toxic Architecture: No fixed conversion ratios, no pre-set resets, and zero restrictive debt covenants.
• Fully Accommodating & Structurally Flexible: We are completely open to suggestions and terms to accommodate counsel and board preferences—including tailored floor price limits, customized draw thresholds, blackout period flexibility, volume discounts, and customized commitment fees.

### 2. Practice-Wide Applicability / Other Corporate Clients
If ${target.ticker} is not currently in need of an equity line facility or already has satisfactory financing mechanisms in place, we would welcome the opportunity to discuss this facility for ANY of the other public issuers, emerging growth companies, or corporate clients that your securities practice group at ${firmName} represents. If you have another client facing capital constraints, shelf overhang, or working capital needs, we can move quickly to structure an accommodating equity line solution.

### 3. Seasoned, Clean Shell Vehicles Available
Additionally, for your private corporate clients seeking an expedited or alternative path to public market quotation, we maintain a portfolio of clean, seasoned public shell vehicles (both SEC-reporting OTC and clean corporate platforms with clean cap tables, verified shareholder structures, and zero toxic legacy liabilities). These vehicles are immediately available for reverse mergers, business combinations, or alternative listing transactions.

We would welcome an introductory discussion with you or your corporate finance partners this week to explore how we can support ${target.ticker} or your broader corporate practice.

Are you available for a brief 10-minute introductory call this week?

Respectfully,

Eric Miller
Managing Principal
Special Situations & Capital Formation Desk
ricomiller@icloud.com • (480) 287-2227`;

  updatedCount++;
});

data.metadata.lastRefreshedAt = new Date().toISOString();
data.metadata.legalCampaign = "Committed Equity Line & Clean Shells Outreach (Fall 2026)";

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");

// Also sync store if it exists
if (fs.existsSync(STORE_PATH)) {
  const storeData = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
  if (Array.isArray(storeData.targets)) {
    storeData.targets.forEach((st) => {
      const match = targets.find((t) => t.id === st.id);
      if (match) {
        st.outreach = match.outreach;
      }
    });
    fs.writeFileSync(STORE_PATH, JSON.stringify(storeData, null, 2) + "\n", "utf8");
  }
}

console.log(`Successfully updated Equity Line & Clean Shells legal outreach across all ${updatedCount} targets in Maxim.`);
