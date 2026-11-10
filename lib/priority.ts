import { MaximTarget } from "./types";

export type PriorityBucketId =
  | "priority_1_crit_urgent"
  | "priority_2_moderate"
  | "other_domestic"
  | "foreign_sedar";

/**
 * Identifies Foreign / SEDAR / Cross-Border issuers (TSX, TSXV, CSE, CNSX, LSE, ASX, SEDAR+)
 * so they are excluded by default ("Forget Foreign issuers (Sedar) for the moment").
 */
export function isForeignSedarIssuer(t: MaximTarget): boolean {
  const ex = (t.exchange || "").toUpperCase();
  const tk = (t.ticker || "").toUpperCase();
  const rp = (t.regulatoryPortal || "").toUpperCase();
  const secUrl = (t.secEdgarUrl || "").toUpperCase();

  return (
    t.secStatus === "non_sec_foreign_or_private" ||
    rp.includes("SEDAR") ||
    secUrl.includes("SEDAR") ||
    tk.startsWith("TSX:") ||
    tk.startsWith("TSXV:") ||
    tk.startsWith("CSE:") ||
    tk.startsWith("CNSX:") ||
    tk.startsWith("CSNX:") ||
    tk.startsWith("LSE:") ||
    tk.startsWith("ASX:") ||
    tk.endsWith(".V") ||
    tk.endsWith(".TO") ||
    tk.endsWith(".CN") ||
    ex.includes("TSX") ||
    ex.includes("SEDAR") ||
    ex.includes("CSE") ||
    ex.includes("CNSX") ||
    ex.includes("CSNX") ||
    ex.includes("LSE") ||
    ex.includes("ASX") ||
    ex.includes("FSE") ||
    ex.includes("TASE")
  );
}

/**
 * Classifies each issuer into the user's Priority Columns for maxim-targets:
 * - Priority 1: Both critical and urgent flagged issuers (with / without reg statements)
 * - Priority 2: Moderate issuers
 * - Excludes Foreign / SEDAR issuers
 */
export function getPriorityBucket(t: MaximTarget): PriorityBucketId {
  if (isForeignSedarIssuer(t)) {
    return "foreign_sedar";
  }

  const urgency = t.financialMetrics?.capitalNeedUrgency;
  if (urgency === "critical" || urgency === "urgent") {
    return "priority_1_crit_urgent";
  }

  if (urgency === "moderate") {
    return "priority_2_moderate";
  }

  return "other_domestic";
}

export function getPriorityOrderWeight(t: MaximTarget): number {
  const bucket = getPriorityBucket(t);
  switch (bucket) {
    case "priority_1_crit_urgent": {
      const isCrit = t.financialMetrics?.capitalNeedUrgency === "critical";
      const noShelf = (t.registrationStatements2Y?.activeShelvesFiled ?? 0) === 0 || t.noActiveRegStatements24M;
      if (isCrit && noShelf) return 10;
      if (isCrit && !noShelf) return 12;
      if (!isCrit && noShelf) return 15;
      return 18;
    }
    case "priority_2_moderate":
      return 25;
    case "other_domestic":
      return t.financialMetrics?.capitalNeedUrgency === "stable" ? 40 : 50;
    case "foreign_sedar":
      return 99;
  }
}

export function getPriorityBadgeMeta(t: MaximTarget): {
  shortLabel: string;
  fullLabel: string;
  className: string;
} {
  const bucket = getPriorityBucket(t);
  const hasShelf = (t.registrationStatements2Y?.activeShelvesFiled ?? 0) > 0;
  const regSuffix = t.noActiveRegStatements24M
    ? "NO REG"
    : hasShelf
      ? `WITH S-3 (${t.registrationStatements2Y.activeShelvesFiled})`
      : "WITH REG (NO S-3)";

  switch (bucket) {
    case "priority_1_crit_urgent":
      return {
        shortLabel: `P1 • CRIT/URG (${regSuffix})`,
        fullLabel: `Priority 1: Critical & Urgent (${regSuffix})`,
        className:
          t.financialMetrics?.capitalNeedUrgency === "critical"
            ? "bg-rose-950/80 text-rose-300 border-rose-500/50"
            : "bg-amber-950/80 text-amber-300 border-amber-500/50"
      };
    case "priority_2_moderate":
      return {
        shortLabel: `P2 • MODERATE (${regSuffix})`,
        fullLabel: `Priority 2: Moderate Issuer (${regSuffix})`,
        className: "bg-blue-950/80 text-blue-300 border-blue-500/50"
      };
    case "other_domestic":
      return {
        shortLabel: `SECONDARY (${t.financialMetrics?.capitalNeedUrgency?.toUpperCase() || "DOMESTIC"})`,
        fullLabel: `Secondary Domestic (${t.financialMetrics?.capitalNeedUrgency || "Domestic"})`,
        className: "bg-zinc-900 text-zinc-400 border-zinc-700"
      };
    case "foreign_sedar":
      return {
        shortLabel: "FOREIGN / SEDAR (EXCLUDED)",
        fullLabel: "Foreign / SEDAR Issuer",
        className: "bg-zinc-950 text-zinc-500 border-zinc-800"
      };
  }
}
