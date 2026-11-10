"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Download, 
  HelpCircle, 
  BookOpen
} from "lucide-react";
import { Navbar, NavTab } from "@/components/Navbar";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { PriorityColumnsView } from "@/components/PriorityColumnsView";
import { TargetCard } from "@/components/TargetCard";
import { TargetTable } from "@/components/TargetTable";
import { TargetDrawer } from "@/components/TargetDrawer";
import { CrmPipelineView } from "@/components/CrmPipelineView";
import { RegistrationShelvesView } from "@/components/RegistrationShelvesView";
import { DistressMatrixView } from "@/components/DistressMatrixView";
import { NoActiveRegView } from "@/components/NoActiveRegView";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { MaximTarget, MaximDatasetMetadata } from "@/lib/types";
import { matchTargetSearch } from "@/lib/search";
import { 
  getPriorityBucket, 
  getPriorityBadgeMeta, 
  getPriorityOrderWeight, 
  isForeignSedarIssuer 
} from "@/lib/priority";
import seedData from "@/data/maxim-targets.json";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("screener");
  
  // Instant Initial State — No Blank Loading Shell (Standing Rule 9)
  const [targets, setTargets] = useState<MaximTarget[]>(seedData.targets as unknown as MaximTarget[]);
  const [metadata, setMetadata] = useState<MaximDatasetMetadata>(seedData.metadata as unknown as MaximDatasetMetadata);

  const [selectedTarget, setSelectedTarget] = useState<MaximTarget | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [methodologyModalOpen, setMethodologyModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    state: "all",
    tier: "all",
    priorityBucket: "all_priority",
    sector: "all",
    workingCapital: "all",
    urgency: "all",
    status: "all",
    panelist: "all",
    secStatus: "all",
    hasDeficiency8K: false,
    hasActiveShelves: false,
    noActiveRegStatements: false,
    priceRange: "all",
    volumeRange: "all",
    sortBy: "priority_asc",
    viewMode: "columns"
  });

  // Revalidate state in background if needed
  useEffect(() => {
    fetch("/api/targets")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.targets) {
          setTargets(data.targets);
          if (data.metadata) setMetadata(data.metadata);
        }
      })
      .catch((err) => console.error("Data refresh error:", err));
  }, []);

  // Exclude Foreign / SEDAR issuers ("Forget Foreign issuers (Sedar) for the moment")
  const domesticTargets = useMemo(() => {
    return targets.filter((t) => !isForeignSedarIssuer(t));
  }, [targets]);

  const priorityCounts = useMemo(() => {
    const p1 = domesticTargets.filter((t) => getPriorityBucket(t) === "priority_1_crit_urgent").length;
    const p2 = domesticTargets.filter((t) => getPriorityBucket(t) === "priority_2_moderate").length;
    return {
      p1,
      p2,
      allPriority: p1 + p2,
      allDomestic: domesticTargets.length
    };
  }, [domesticTargets]);

  const baseFilteredDomestic = useMemo(() => {
    let list = [...domesticTargets];

    if (filters.search) {
      list = list.filter(t => matchTargetSearch(t, filters.search));
    }

    if (filters.state && filters.state !== "all") {
      list = list.filter(t => (t.stateCode || "").toUpperCase() === filters.state!.toUpperCase() || (t.state || "").toUpperCase() === filters.state!.toUpperCase());
    }

    if (filters.tier && filters.tier !== "all") {
      list = list.filter(t => (t.tier || "").toLowerCase() === filters.tier!.toLowerCase());
    }

    if (filters.sector !== "all") {
      list = list.filter(t => 
        (t.sector && t.sector.toLowerCase().includes(filters.sector.toLowerCase())) || 
        t.category === filters.sector
      );
    }

    if (filters.workingCapital === "negative") {
      list = list.filter(t => t.financialMetrics.isNegativeWorkingCapital);
    } else if (filters.workingCapital === "positive") {
      list = list.filter(t => !t.financialMetrics.isNegativeWorkingCapital && t.financialMetrics.workingCapital !== null);
    }

    if (filters.urgency !== "all") {
      list = list.filter(t => t.financialMetrics.capitalNeedUrgency === filters.urgency);
    }

    if (filters.status !== "all") {
      list = list.filter(t => t.status === filters.status);
    }

    if (filters.panelist === "yes") {
      list = list.filter(t => t.isPanelist);
    } else if (filters.panelist === "no") {
      list = list.filter(t => !t.isPanelist);
    }

    if (filters.secStatus && filters.secStatus !== "all") {
      list = list.filter(t => t.secStatus === filters.secStatus);
    }

    if (filters.hasDeficiency8K) {
      list = list.filter(t => t.financialMetrics.hasItem301Notice || (t.signals8K && t.signals8K.some(s => s.item === "Item 3.01")));
    }

    if (filters.hasActiveShelves) {
      list = list.filter(t => t.registrationStatements2Y.activeShelvesFiled > 0);
    }

    if (filters.noActiveRegStatements) {
      list = list.filter(t => t.noActiveRegStatements24M);
    }

    if (filters.priceRange && filters.priceRange !== "all") {
      if (filters.priceRange === "penny_under_1") {
        list = list.filter(t => t.marketData?.price !== null && t.marketData.price < 1.0);
      } else if (filters.priceRange === "sub_5") {
        list = list.filter(t => t.marketData?.price !== null && t.marketData.price >= 1.0 && t.marketData.price <= 5.0);
      } else if (filters.priceRange === "mid_5_20") {
        list = list.filter(t => t.marketData?.price !== null && t.marketData.price > 5.0 && t.marketData.price <= 20.0);
      } else if (filters.priceRange === "above_20") {
        list = list.filter(t => t.marketData?.price !== null && t.marketData.price > 20.0);
      }
    }

    if (filters.volumeRange && filters.volumeRange !== "all") {
      if (filters.volumeRange === "high_above_5m") {
        list = list.filter(t => t.marketData?.avgMonthlyVolume !== null && t.marketData.avgMonthlyVolume >= 5000000);
      } else if (filters.volumeRange === "mid_500k_5m") {
        list = list.filter(t => t.marketData?.avgMonthlyVolume !== null && t.marketData.avgMonthlyVolume >= 500000 && t.marketData.avgMonthlyVolume < 5000000);
      } else if (filters.volumeRange === "low_under_500k") {
        list = list.filter(t => t.marketData?.avgMonthlyVolume !== null && t.marketData.avgMonthlyVolume < 500000);
      }
    }

    return list;
  }, [domesticTargets, filters]);

  // Filtered & Sorted targets computation
  const filteredTargets = useMemo(() => {
    let list = [...baseFilteredDomestic];

    const bucket = filters.priorityBucket || "all_priority";
    if (bucket === "all_priority") {
      list = list.filter(t => {
        const b = getPriorityBucket(t);
        return b === "priority_1_crit_urgent" || b === "priority_2_moderate";
      });
    } else if (bucket === "priority_1_crit_urgent" || bucket === "priority_2_moderate") {
      list = list.filter(t => getPriorityBucket(t) === bucket);
    }

    // Sort
    list.sort((a, b) => {
      if (filters.sortBy === "priority_asc") {
        const wA = getPriorityOrderWeight(a);
        const wB = getPriorityOrderWeight(b);
        if (wA !== wB) return wA - wB;
        return (a.financialMetrics.runwayMonths ?? 999) - (b.financialMetrics.runwayMonths ?? 999);
      }
      if (filters.sortBy === "runway_asc") {
        return (a.financialMetrics.runwayMonths ?? 999) - (b.financialMetrics.runwayMonths ?? 999);
      }
      if (filters.sortBy === "price_desc") {
        return (b.marketData?.price ?? -999) - (a.marketData?.price ?? -999);
      }
      if (filters.sortBy === "price_asc") {
        return (a.marketData?.price ?? 999999) - (b.marketData?.price ?? 999999);
      }
      if (filters.sortBy === "volume_desc") {
        return (b.marketData?.avgMonthlyVolume ?? -1) - (a.marketData?.avgMonthlyVolume ?? -1);
      }
      if (filters.sortBy === "volume_asc") {
        return (a.marketData?.avgMonthlyVolume ?? 9999999999) - (b.marketData?.avgMonthlyVolume ?? 9999999999);
      }
      if (filters.sortBy === "cash_desc") {
        return (b.financialMetrics.cashOnHand ?? -1) - (a.financialMetrics.cashOnHand ?? -1);
      }
      if (filters.sortBy === "deficit_desc") {
        return b.financialMetrics.workingCapitalDeficit - a.financialMetrics.workingCapitalDeficit;
      }
      if (filters.sortBy === "financing_desc") {
        return b.financingHistory2Y.totalRaised - a.financingHistory2Y.totalRaised;
      }
      if (filters.sortBy === "ticker_asc") {
        return a.ticker.localeCompare(b.ticker);
      }
      return 0;
    });

    return list;
  }, [baseFilteredDomestic, filters.priorityBucket, filters.sortBy]);

  // CRM update handlers
  const handleUpdateStage = async (targetId: string, stage: any) => {
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, stage })
      });
      const data = await res.json();
      if (data.success && data.target) {
        setTargets(prev => prev.map(t => t.id === targetId ? data.target : t));
        if (selectedTarget?.id === targetId) setSelectedTarget(data.target);
      }
    } catch (e) {
      console.error("Stage update failed:", e);
    }
  };

  const handleAddNote = async (targetId: string, noteText: string) => {
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, noteText })
      });
      const data = await res.json();
      if (data.success && data.target) {
        setTargets(prev => prev.map(t => t.id === targetId ? data.target : t));
        if (selectedTarget?.id === targetId) setSelectedTarget(data.target);
      }
    } catch (e) {
      console.error("Note addition failed:", e);
    }
  };

  const handleLogActivity = async (targetId: string, activity: any) => {
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, activity })
      });
      const data = await res.json();
      if (data.success && data.target) {
        setTargets(prev => prev.map(t => t.id === targetId ? data.target : t));
        if (selectedTarget?.id === targetId) setSelectedTarget(data.target);
      }
    } catch (e) {
      console.error("Activity log failed:", e);
    }
  };

  // Export Executive Dossier to ~/Downloads
  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setExportNotice(`Executive Dossier exported to ~/Downloads (${data.path || data.reportPath})`);
        setTimeout(() => setExportNotice(null), 6000);
      } else {
        setExportNotice("Export error: " + data.error);
        setTimeout(() => setExportNotice(null), 5000);
      }
    } catch (err: any) {
      setExportNotice("Export request failed: " + err.message);
      setTimeout(() => setExportNotice(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        metadata={metadata}
        onOpenSearch={() => setSearchModalOpen(true)}
        onExportReport={handleExportReport}
        isExporting={isExporting}
      />

      {/* Export Notification Toast */}
      {exportNotice && (
        <div className="fixed bottom-4 right-4 z-50 rounded-2xl bg-zinc-900 border border-amber-500/50 p-4 shadow-2xl text-xs text-zinc-200 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <Download className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-mono">{exportNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-16 px-2 sm:px-4 overflow-x-hidden">
        {/* TAB 1: Screener Radar (Priority Columns + Dense Table or Cards) */}
        {activeTab === "screener" && (
          <div className="space-y-4">
            <div className="p-4 pb-0 space-y-4">
              {/* Royal Grandmaster 3D Hero Strategy Briefing Banner */}
              <div className="filter-console-3d p-5 sm:p-7 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)] relative overflow-hidden">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(245,211,120,0.08)_0%,transparent_70%)] pointer-events-none" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="crest-badge">
                        ROYAL SALON • CAPITAL RADAR 3D ENGINE
                      </span>
                      <span className="text-[11px] font-bold text-[#f5d378] tracking-wider uppercase">
                        24K GOLD 3D STANDARD
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      Western Targets Regional OTC Diligence & Restructuring Engine
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                      Audited forensic screening across 119 Western US companies (CA, NV, AZ, CO, WY, ID). Tracking aged debt, Section 3(a)(10) court restructuring eligibility, equity line facilities, cash runways, and working capital deficits.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3D Floating KPI Podiums */}
              <div className="perspective-1200 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="kpi-podium p-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block font-semibold">TOTAL SOURCED TARGETS</span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-emerald-400 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {metadata.totalTargets} Issuers
                  </p>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Presenting &amp; screened cohort</span>
                </div>

                <div className="kpi-podium p-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block font-semibold">NEGATIVE WORKING CAPITAL</span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-rose-400 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {metadata.negativeWorkingCapitalCount} Targets
                  </p>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Reconciled without gaps</span>
                </div>

                <div className="kpi-podium p-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block font-semibold">CRITICAL RUNWAY (&lt;3MO)</span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-amber-400 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {metadata.criticalCount} Targets
                  </p>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Immediate capital requirement</span>
                </div>

                <div className="kpi-podium p-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block font-semibold">NO ACTIVE REG (24M)</span>
                  <p className="font-mono text-xl sm:text-2xl font-black text-[#f5d378] mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {metadata.noActiveRegStatementsCount || 117} Targets
                  </p>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Zero S-3/S-1 effective shelves</span>
                </div>
              </div>

              <FilterBar
                filters={filters}
                onChange={setFilters}
                totalFiltered={filteredTargets.length}
                totalUniverse={domesticTargets.length}
                noActiveRegCount={domesticTargets.filter(t => t.noActiveRegStatements24M).length}
                priorityCounts={priorityCounts}
              />

              {/* Forensic Metric Strip & Methodology Link */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs">
                <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px] flex-wrap">
                  <span>
                    Showing <strong className="text-white">{filteredTargets.length}</strong> of {domesticTargets.length} Western OTC Targets across 6 Western States
                  </span>
                  <span>•</span>
                  <button
                    onClick={() => setMethodologyModalOpen(true)}
                    className="text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Priority Columns &amp; Tier Methodology</span>
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    const csvRows = [
                      ["Priority Column", "Ticker", "Company", "CIK", "Exchange", "Sector", "Stock Price", "Avg Monthly Vol", "No Active Reg 24M", "Cash ($)", "Working Capital Deficit ($)", "Runway (Months)", "Urgency Tier", "Latest Form", "Period End", "SEC Accession", "SEC Receipt URL"].join(",")
                    ];
                    filteredTargets.forEach(t => {
                      const pMeta = getPriorityBadgeMeta(t);
                      csvRows.push([
                        `"${pMeta.fullLabel}"`,
                        `"${t.ticker}"`,
                        `"${t.name.replace(/"/g, '""')}"`,
                        `"${t.cik}"`,
                        `"${t.exchange}"`,
                        `"${t.sector}"`,
                        `"${t.marketData?.priceDisplay || 'N/A'}"`,
                        `"${t.marketData?.avgMonthlyVolumeDisplay || 'N/A'}"`,
                        `"${t.noActiveRegStatements24M ? 'YES' : 'NO'}"`,
                        t.financialMetrics.cashOnHand ?? "N/A",
                        t.financialMetrics.workingCapitalDeficit,
                        t.financialMetrics.runwayMonths,
                        t.financialMetrics.capitalNeedUrgency,
                        t.financialMetrics.filingForm,
                        t.financialMetrics.asOfDate,
                        t.financialMetrics.accessionNumber,
                        t.financialMetrics.secViewerUrl || t.secEdgarUrl
                      ].join(","));
                    });
                    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `maxim-targets-priority-${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                  }}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Export currently filtered targets with priority columns, stock prices, volumes, and accession numbers"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export Filtered CSV ({filteredTargets.length})</span>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {filteredTargets.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-zinc-800 bg-zinc-900/40">
                  <p className="text-zinc-400 text-sm font-semibold">No companies match current filter parameters.</p>
                  <button
                    onClick={() => setFilters({
                      search: "",
                      priorityBucket: "all_priority",
                      sector: "all",
                      workingCapital: "all",
                      urgency: "all",
                      status: "all",
                      panelist: "all",
                      secStatus: "all",
                      hasDeficiency8K: false,
                      hasActiveShelves: false,
                      noActiveRegStatements: false,
                      priceRange: "all",
                      volumeRange: "all",
                      sortBy: "priority_asc",
                      viewMode: filters.viewMode
                    })}
                    className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : filters.viewMode === "columns" ? (
                <div className="space-y-6">
                  <PriorityColumnsView
                    targets={baseFilteredDomestic}
                    onSelect={setSelectedTarget}
                    activePriorityFilter={filters.priorityBucket}
                    onSelectPriorityFilter={(bucket) =>
                      setFilters((prev) => ({ ...prev, priorityBucket: bucket as any }))
                    }
                  />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                        Priority Forensic Roster Table ({filteredTargets.length} Issuers)
                      </h3>
                      <span className="text-[11px] font-mono text-zinc-500">
                        Sorted by Priority Column: P1 (Critical &amp; Urgent With/Without Reg) → P2 (Moderate Issuers)
                      </span>
                    </div>
                    <TargetTable
                      targets={filteredTargets}
                      onSelect={setSelectedTarget}
                    />
                  </div>
                </div>
              ) : filters.viewMode === "cards" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTargets.map((target) => (
                    <TargetCard
                      key={target.id}
                      target={target}
                      onSelect={setSelectedTarget}
                      onQuickStageChange={handleUpdateStage}
                    />
                  ))}
                </div>
              ) : (
                <TargetTable
                  targets={filteredTargets}
                  onSelect={setSelectedTarget}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CRM Pipeline Kanban */}
        {activeTab === "crm" && (
          <CrmPipelineView
            targets={domesticTargets}
            onSelect={setSelectedTarget}
            onUpdateStage={handleUpdateStage}
          />
        )}

        {/* TAB 3: S-3 Shelves & ATM */}
        {activeTab === "shelves" && (
          <RegistrationShelvesView
            targets={domesticTargets}
            onSelect={setSelectedTarget}
          />
        )}

        {/* TAB 4: Distress Matrix */}
        {activeTab === "distress" && (
          <DistressMatrixView
            targets={domesticTargets}
            onSelect={setSelectedTarget}
          />
        )}

        {/* TAB 5: No Active Reg Statements (24M) Dedicated Tab */}
        {activeTab === "no_reg" && (
          <NoActiveRegView
            targets={domesticTargets}
            onSelect={setSelectedTarget}
          />
        )}
      </main>

      {/* Sliding Diligence Drawer */}
      <TargetDrawer
        target={selectedTarget}
        onClose={() => setSelectedTarget(null)}
        onUpdateStage={handleUpdateStage}
        onAddNote={handleAddNote}
        onLogActivity={handleLogActivity}
      />

      {/* Global Cmd+K Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        targets={domesticTargets}
        onSelect={setSelectedTarget}
      />

      {/* Methodology & Tier Thresholds Modal (Standing Rule 5) */}
      {methodologyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Priority Column Classification &amp; Diligence Methodology
                </h3>
              </div>
              <button
                onClick={() => setMethodologyModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-zinc-300 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-1">
                <h4 className="font-bold text-rose-300 uppercase">PRIORITY 1: CRITICAL &amp; URGENT FLAGGED ISSUERS (WITH / WITHOUT REG STATEMENTS)</h4>
                <p className="text-zinc-300 leading-relaxed">
                  Includes both Critical (&lt;3 months cash runway) and Urgent (3–6 months cash runway) domestic issuers, clearly tagged by whether they have active S-3/S-1 registration statements or zero S-3 shelf capacity in the past 24 months. Foreign/SEDAR issuers are excluded.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/40 space-y-1">
                <h4 className="font-bold text-blue-300 uppercase">PRIORITY 2: MODERATE ISSUERS (6 TO 12 MONTHS RUNWAY)</h4>
                <p className="text-zinc-300 leading-relaxed">
                  Includes domestic issuers with 6 to 12 months of estimated operating cash runway evaluating non-dilutive credit facilities, convertible structures, or shelf takedowns. Foreign/SEDAR issuers are excluded.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 text-right">
              <button
                onClick={() => setMethodologyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs cursor-pointer"
              >
                Close &amp; Return to Screener
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
