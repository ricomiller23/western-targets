#!/usr/bin/env node
// dispatch-legal-counsel-emails.mjs
// Unified Master Dispatch Engine for Outside Legal Counsel across LG Event & Maxim Targets
// Dispatches via Apple Mail from Eric Miller <ricomiller@icloud.com>

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to authoritative datasets
const LG_DATA_PATH = path.resolve(__dirname, "../../lg-event-targets/data/lg-event-targets.json");
const MAXIM_DATA_PATH = path.resolve(__dirname, "../../maxim-targets/data/maxim-targets.json");

// CLI Flags
const args = process.argv.slice(2);
const isExecute = args.includes("--execute") || args.includes("--live");
const isDraft = args.includes("--draft");
const isDryRun = !isExecute && !isDraft;

const modeArg = args.find(a => a.startsWith("--mode="));
const mode = modeArg ? modeArg.split("=")[1].toLowerCase() : (args.includes("--company") ? "company" : "attorney");

const batchArg = args.find(a => a.startsWith("--batch="));
const batchIndex = args.indexOf("--batch");
const requestedBatch = batchArg 
  ? parseInt(batchArg.split("=")[1], 10) 
  : (batchIndex !== -1 ? parseInt(args[batchIndex + 1], 10) : null);

const startArg = args.find(a => a.startsWith("--start="));
const startIndex = args.indexOf("--start");
const startOffset = startArg 
  ? parseInt(startArg.split("=")[1], 10) 
  : (startIndex !== -1 ? parseInt(args[startIndex + 1], 10) : 0);

const delayArg = args.find(a => a.startsWith("--delay="));
const delayMs = delayArg ? parseInt(delayArg.split("=")[1], 10) : 3000;

const filterArg = args.find(a => a.startsWith("--filter="));
const filterIndex = args.indexOf("--filter");
const filterStr = filterArg 
  ? filterArg.split("=")[1].toLowerCase() 
  : (filterIndex !== -1 ? args[filterIndex + 1].toLowerCase() : null);

// Load Datasets
const lgData = JSON.parse(fs.readFileSync(LG_DATA_PATH, "utf8"));
const maximData = JSON.parse(fs.readFileSync(MAXIM_DATA_PATH, "utf8"));

const allTargets = [
  ...lgData.targets.map(t => ({ ...t, datasetSource: "LG Event Targets" })),
  ...maximData.targets.map(t => ({ ...t, datasetSource: "Maxim Targets" }))
];

console.log("======================================================================");
console.log("EQUITY LINE & CLEAN SHELLS — LEGAL COUNSEL DISPATCH ENGINE");
console.log("======================================================================");
console.log(`Datasets Loaded: ${lgData.targets.length} (LG Event) + ${maximData.targets.length} (Maxim) = ${allTargets.length} Total Targets`);
console.log(`Dispatch Mode:   ${mode.toUpperCase()} (${mode === "attorney" ? "Deduplicated to 67 Unique Lead Counsel Partners" : "Individual Company Targets"})`);
console.log(`Execution Mode:  ${isExecute ? "🔴 LIVE SEND (via Apple Mail ricomiller@icloud.com)" : (isDraft ? "🟡 CREATE DRAFTS in Apple Mail" : "🟢 DRY RUN PREVIEW (No transmission)")}`);
if (filterStr) console.log(`Active Filter:   "${filterStr}"`);
console.log("======================================================================\n");

// Grouping by Attorney
const SUPPRESSED_COUNSEL_EMAILS = new Set(["mbaudler@wsgr.com", "aballard@wsgr.com"]);
const attorneyMap = new Map();

for (const t of allTargets) {
  const c = (t.contacts || []).find(x => 
    x.id.includes("counsel") || 
    (x.title && x.title.toLowerCase().includes("counsel")) || 
    (x.name && x.name.toLowerCase().includes("esq"))
  ) || { name: "Counsel", email: "legal@firm.com", firm: "Securities Counsel", phone: "(212) 479-6000" };

  const emailKey = (c.email || "").toLowerCase().trim();
  if (!emailKey || SUPPRESSED_COUNSEL_EMAILS.has(emailKey) || t.crm?.stage === "passed" || t.crm?.responseOutcome === "Declined - Not Interested") continue;

  if (!attorneyMap.has(emailKey)) {
    attorneyMap.set(emailKey, {
      name: c.name,
      firm: c.firm || c.entity || "Securities Law Firm",
      email: emailKey,
      phone: c.phone || "(212) 479-6000",
      companies: []
    });
  }

  attorneyMap.get(emailKey).companies.push(t);
}

// Build Outreach Queue
let queue = [];

if (mode === "attorney") {
  for (const [email, record] of attorneyMap.entries()) {
    if (filterStr && !record.name.toLowerCase().includes(filterStr) && !record.firm.toLowerCase().includes(filterStr) && !record.email.includes(filterStr) && !record.companies.some(c => c.ticker.toLowerCase().includes(filterStr) || c.name.toLowerCase().includes(filterStr))) {
      continue;
    }

    // Sort companies by urgency (critical first, then lowest runway)
    record.companies.sort((a, b) => {
      const getScore = (x) => {
        if (x.financialMetrics?.capitalNeedUrgency === "critical") return 0;
        if (x.financialMetrics?.capitalNeedUrgency === "high") return 1;
        if (x.financialMetrics?.capitalNeedUrgency === "moderate") return 2;
        return 3;
      };
      return getScore(a) - getScore(b);
    });

    const primary = record.companies[0];
    const otherCompanies = record.companies.slice(1);

    const m = primary.financialMetrics || {};
    const runwayMonths = m.runwayMonths != null && m.runwayMonths !== "Not yet sourced" ? m.runwayMonths : "under 12";
    const cashMillions = m.cashOnHand ? (m.cashOnHand / 1e6).toFixed(1) : "N/A";
    const isNegativeWorkingCapital = m.workingCapital != null && m.workingCapital < 0;
    const workingCapitalStatus = isNegativeWorkingCapital
      ? `Negative working capital deficit of $${(Math.abs(m.workingCapital) / 1e6).toFixed(1)}M`
      : (m.workingCapital ? `Working capital surplus of $${(m.workingCapital / 1e6).toFixed(1)}M` : "Tight operating liquidity");

    const financingSummary = primary.hasActiveRegStatements24M
      ? `Active S-3/ATM shelf on file (${primary.regStatementForms24M ? primary.regStatementForms24M.join(", ") : "Shelf"})`
      : `Zero active S-3 shelf registration statements on file in past 24 months`;

    const otherTickersStr = otherCompanies.length > 0 
      ? `\n• Monitored Practice Cohort: ${otherCompanies.map(c => `${c.name} (${c.ticker})`).join(", ")}`
      : "";

    const subject = `CONFIDENTIAL // FOR SECURITIES COUNSEL: ${primary.name} (${primary.ticker}) — Committed Equity Line Facility & Available Clean Shells`;

    const body = `Dear ${record.name},

I am reaching out to you in your capacity as outside securities and corporate counsel representing ${primary.name} (${primary.ticker} • CIK: ${primary.cik || "SEC Filer"})${otherCompanies.length > 0 ? ` as well as other corporate issuers across your practice at ${record.firm}` : ""}.

Our institutional capital desk specializes in structured public market financings, non-toxic growth capital, and balance sheet recapitalizations for NASDAQ, NYSE, and OTC-listed corporate issuers.

Based on our review of ${primary.name}'s recent SEC periodic disclosures, we noted the company's operating balance sheet and liquidity profile:
• Estimated Cash Runway: ~${runwayMonths} months ($${cashMillions}M reported cash reserves)
• Working Capital Position: ${workingCapitalStatus}
• Shelf Profile: ${financingSummary}${otherTickersStr}

### 1. Committed Equity Line of Credit (ELOC / Equity Purchase Facility)
We are currently offering committed equity line facilities (typically $5M to $25M+, calibrated to market capitalization and daily trading volume) structured to provide continuous, predictable capital access directly to the treasury:
• 100% Issuer-Controlled: The company dictates the timing, frequency, and size of every draw.
• Non-Toxic Architecture: No fixed conversion ratios, no pre-set resets, and zero restrictive debt covenants.
• Fully Accommodating & Structurally Flexible: We are completely open to suggestions and terms to accommodate counsel and board preferences—including tailored floor price limits, customized draw thresholds, blackout period flexibility, volume discounts, and customized commitment fees.

### 2. Practice-Wide Applicability / Other Corporate Clients
If ${primary.ticker} is not currently in need of an equity line facility or already has satisfactory financing mechanisms in place, we would welcome the opportunity to discuss this facility for ANY of the other public issuers, emerging growth companies, or corporate clients that your securities practice group at ${record.firm} represents. If you have another client facing capital constraints, shelf overhang, or working capital needs, we can move quickly to structure an accommodating equity line solution.

### 3. Seasoned, Clean Shell Vehicles Available
Additionally, for your private corporate clients seeking an expedited or alternative path to public market quotation, we maintain a portfolio of clean, seasoned public shell vehicles (both SEC-reporting OTC and clean corporate platforms with clean cap tables, verified shareholder structures, and zero toxic legacy liabilities). These vehicles are immediately available for reverse mergers, business combinations, or alternative listing transactions.

We would welcome an introductory discussion with you or your corporate finance partners this week to explore how we can support ${primary.ticker} or your broader corporate practice.

Are you available for a brief 10-minute introductory call this week?

Respectfully,

Eric Miller
Managing Principal
Special Situations & Capital Formation Desk
ricomiller@icloud.com • (480) 287-2227`;

    queue.push({
      recipientName: record.name,
      recipientEmail: record.email,
      firm: record.firm,
      phone: record.phone,
      targetCompany: primary.name,
      targetTicker: primary.ticker,
      totalRepresented: record.companies.length,
      representedTickers: record.companies.map(c => c.ticker).join(", "),
      subject,
      body
    });
  }
} else {
  // Mode === 'company'
  for (const t of allTargets) {
    if (filterStr && !t.ticker.toLowerCase().includes(filterStr) && !t.name.toLowerCase().includes(filterStr)) {
      continue;
    }

    const counsel = (t.contacts || []).find(c => 
      c.id.includes("counsel") || 
      (c.title && c.title.toLowerCase().includes("counsel")) || 
      (c.name && c.name.toLowerCase().includes("esq"))
    ) || { name: "Counsel", email: "legal@firm.com", firm: "Securities Counsel" };

    queue.push({
      recipientName: counsel.name,
      recipientEmail: counsel.email,
      firm: counsel.firm || counsel.entity || "Securities Law Firm",
      phone: counsel.phone || "(212) 479-6000",
      targetCompany: t.name,
      targetTicker: t.ticker,
      totalRepresented: 1,
      representedTickers: t.ticker,
      subject: t.outreach.legalSubject,
      body: t.outreach.legalBody
    });
  }
}

// Slice Batch
const batchSize = requestedBatch || (isDryRun ? queue.length : 5);
const selectedBatch = queue.slice(startOffset, startOffset + batchSize);

console.log(`Total Candidates in Queue: ${queue.length}`);
console.log(`Processing Window:         Index ${startOffset} to ${startOffset + selectedBatch.length} (${selectedBatch.length} messages)\n`);

function executeAppleMail(to, subject, body, action = "send") {
  const escapedSubject = subject.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const escapedBody = body.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const actionCmd = action === "send" ? "send" : "save";

  const script = `tell application "Mail"
  set newMsg to make new outgoing message with properties {sender:"Eric Miller <ricomiller@icloud.com>", subject:"${escapedSubject}", content:"${escapedBody}", visible:false}
  tell newMsg
    make new to recipient at end of to recipients with properties {address:"${to}"}
  end tell
  ${actionCmd} newMsg
end tell`;

  try {
    execSync("osascript", { input: script, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch (err) {
    console.error(`❌ Apple Mail Error for ${to}:`, err.message);
    return false;
  }
}

// Execution Loop
for (let i = 0; i < selectedBatch.length; i++) {
  const item = selectedBatch[i];
  const itemNum = startOffset + i + 1;

  console.log(`----------------------------------------------------------------------`);
  console.log(`[${itemNum}/${queue.length}] ${item.recipientName} (${item.firm})`);
  console.log(`Email:   ${item.recipientEmail} | Phone: ${item.phone}`);
  console.log(`Client:  ${item.targetCompany} (${item.targetTicker}) [Total Represented: ${item.totalRepresented} (${item.representedTickers})]`);
  console.log(`Subject: ${item.subject}`);

  if (isDryRun) {
    const previewLines = item.body.split("\n").slice(0, 10).join("\n");
    console.log(`Body Preview:\n${previewLines}\n... [${item.body.split("\n").length} lines total]`);
    console.log(`Status:  [DRY RUN - READY]`);
  } else if (isDraft) {
    const success = executeAppleMail(item.recipientEmail, item.subject, item.body, "save");
    if (success) {
      console.log(`Status:  ✓ DRAFT CREATED IN APPLE MAIL`);
    } else {
      console.log(`Status:  ✗ FAILED TO CREATE DRAFT`);
    }
    if (i < selectedBatch.length - 1 && delayMs > 0) {
      execSync(`sleep ${(delayMs / 1000).toFixed(1)}`);
    }
  } else if (isExecute) {
    const success = executeAppleMail(item.recipientEmail, item.subject, item.body, "send");
    if (success) {
      console.log(`Status:  ✓ SENT VIA APPLE MAIL (ricomiller@icloud.com)`);
    } else {
      console.log(`Status:  ✗ FAILED TO SEND`);
    }
    if (i < selectedBatch.length - 1 && delayMs > 0) {
      execSync(`sleep ${(delayMs / 1000).toFixed(1)}`);
    }
  }
}

console.log(`\n======================================================================`);
console.log(`SUMMARY: Processed ${selectedBatch.length} messages.`);
if (isDryRun) {
  console.log(`To create drafts in Apple Mail: node scripts/dispatch-legal-counsel-emails.mjs --draft --batch 10`);
  console.log(`To live send via Apple Mail:    node scripts/dispatch-legal-counsel-emails.mjs --execute --batch 5`);
}
console.log(`======================================================================\n`);
