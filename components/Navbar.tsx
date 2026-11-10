"use client";

import React from "react";
import { 
  Flame, 
  Search, 
  FileDown, 
  SlidersHorizontal, 
  Briefcase, 
  Layers, 
  BarChart3, 
  Sparkles,
  ShieldAlert,
  FileSpreadsheet,
  Building2,
  FileX
} from "lucide-react";
import { MaximDatasetMetadata } from "@/lib/types";

export type NavTab = "screener" | "crm" | "shelves" | "distress" | "no_reg";

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  metadata?: MaximDatasetMetadata;
  onOpenSearch: () => void;
  onExportReport: () => void;
  isExporting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  metadata,
  onOpenSearch,
  onExportReport,
  isExporting
}) => {
  const noRegCount = metadata?.noActiveRegStatementsCount ?? 0;
  const totalTargets = metadata?.totalTargets || 0;

  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-hidden border-b border-[rgba(245,211,120,0.25)] bg-[rgba(7,10,16,0.92)] backdrop-blur-xl shadow-[0_12px_36px_-10px_rgba(0,0,0,0.85)]">
      {/* Top Telemetry Radar Bar */}
      <div className="border-b border-[rgba(245,211,120,0.14)] bg-[rgba(5,8,14,0.96)] px-4 py-1.5 text-[11px] text-stone-300 font-mono">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-2.5 shrink-0">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
              <span>WESTERN REGION OTC & CAPITAL DISTRESS RADAR</span>
            </span>
            <span className="text-[rgba(245,211,120,0.3)]">|</span>
            <span className="text-stone-400 hidden sm:inline text-[10.5px]">
              {totalTargets} Western US OTC Issuers • CA, NV, AZ, CO, WY, ID • Aged Debt &amp; 3(a)(10) Restructuring
            </span>
          </div>

          <div className="flex items-center space-x-4 shrink-0 text-[10px] sm:text-[11px] font-medium">
            <span>
              TOTAL TARGETS: <strong className="text-white">{totalTargets}</strong>
            </span>
            <span className="text-stone-600">|</span>
            <span>
              NEG WORKING CAPITAL:{" "}
              <strong className="text-rose-400 font-bold">
                {metadata?.negativeWorkingCapitalCount ?? 23} (
                {Math.round(((metadata?.negativeWorkingCapitalCount ?? 23) / (totalTargets || 1)) * 100)}%)
              </strong>
            </span>
            <span className="text-stone-600 hidden md:inline">|</span>
            <span className="hidden md:inline">
              CRITICAL RUNWAY (&lt;3MO):{" "}
              <strong className="text-amber-400 font-bold">{metadata?.criticalCount ?? 12}</strong>
            </span>
            <span className="text-stone-600 hidden lg:inline">|</span>
            <span className="hidden lg:inline">
              NO ACTIVE REG (24M):{" "}
              <strong className="text-rose-400 font-bold">
                {noRegCount} ({Math.round((noRegCount / (totalTargets || 1)) * 100)}%)
              </strong>
            </span>
            <span className="text-stone-600 hidden lg:inline">|</span>
            <span className="hidden lg:inline">
              SEC FILERS:{" "}
              <strong className="text-emerald-400 font-bold">
                {metadata?.secFilersCount ?? 99} / {totalTargets}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f5d378]/25 via-[#c99636]/15 to-transparent border border-[rgba(245,211,120,0.5)] text-[#f5d378] shadow-[0_4px_16px_rgba(212,164,65,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)]">
            <Flame className="w-5 h-5 fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">WESTERN TARGETS</span>
              <span className="hidden md:inline-flex">
                <span className="crest-badge shrink-0">
                  WESTERN 3D RADAR
                </span>
              </span>
            </div>
            <p className="text-[10.5px] text-stone-300 font-medium">Regional OTC Diligence, Market Telemetry &amp; Restructuring Engine</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="hidden md:flex items-center space-x-1 rounded-xl bg-[rgba(6,10,18,0.95)] p-1 border border-[rgba(245,211,120,0.22)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] text-xs font-semibold">
          <button
            id="nav-tab-screener"
            type="button"
            onClick={() => onTabChange("screener")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "screener"
                ? "bg-gradient-to-b from-[#f5d378] to-[#c99636] text-[#070a10] font-bold shadow-[0_4px_12px_rgba(212,164,65,0.4)]"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <SlidersHorizontal className={`w-3.5 h-3.5 ${activeTab === "screener" ? "text-[#070a10]" : "text-amber-400"}`} />
            <span>Screener Radar</span>
          </button>

          <button
            id="nav-tab-crm"
            type="button"
            onClick={() => onTabChange("crm")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "crm"
                ? "bg-gradient-to-b from-[#f5d378] to-[#c99636] text-[#070a10] font-bold shadow-[0_4px_12px_rgba(212,164,65,0.4)]"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Briefcase className={`w-3.5 h-3.5 ${activeTab === "crm" ? "text-[#070a10]" : "text-cyan-400"}`} />
            <span>CRM Pipeline</span>
          </button>

          <button
            id="nav-tab-shelves"
            type="button"
            onClick={() => onTabChange("shelves")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "shelves"
                ? "bg-gradient-to-b from-[#f5d378] to-[#c99636] text-[#070a10] font-bold shadow-[0_4px_12px_rgba(212,164,65,0.4)]"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${activeTab === "shelves" ? "text-[#070a10]" : "text-purple-400"}`} />
            <span>Registration Filings</span>
          </button>

          <button
            id="nav-tab-distress"
            type="button"
            onClick={() => onTabChange("distress")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "distress"
                ? "bg-gradient-to-b from-[#f5d378] to-[#c99636] text-[#070a10] font-bold shadow-[0_4px_12px_rgba(212,164,65,0.4)]"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <BarChart3 className={`w-3.5 h-3.5 ${activeTab === "distress" ? "text-[#070a10]" : "text-rose-400"}`} />
            <span>Distress Matrix</span>
          </button>

          {/* DEDICATED TAB: No Active Reg Statements (24M) */}
          <button
            id="nav-tab-no-reg"
            type="button"
            onClick={() => onTabChange("no_reg")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "no_reg"
                ? "bg-gradient-to-b from-rose-600 to-rose-800 text-white shadow-[0_4px_12px_rgba(244,63,94,0.4)] font-bold"
                : "text-rose-400 hover:text-rose-200"
            }`}
          >
            <FileX className="w-3.5 h-3.5" />
            <span>No Active Reg (24M)</span>
            <span className="rounded-full bg-rose-500/20 text-rose-300 px-1.5 py-0.2 text-[10px] font-mono font-bold">
              {noRegCount}
            </span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Quick Search */}
          <button
            id="nav-search-btn"
            type="button"
            onClick={onOpenSearch}
            className="btn-secondary-3d px-3 py-1.5 text-xs text-stone-300 hover:text-white transition-all cursor-pointer min-h-[38px]"
          >
            <Search className="w-3.5 h-3.5 mr-1.5 text-[#f5d378]" />
            <span className="hidden md:inline">Search Targets...</span>
            <kbd className="hidden sm:inline-block ml-1 rounded bg-[#070a10] border border-[rgba(245,211,120,0.25)] px-1.5 py-0.5 text-[9px] text-[#f5d378] font-mono font-bold">
              ⌘K
            </kbd>
          </button>

          {/* Export CSV */}
          <span className="hidden sm:inline-flex">
            <a
              id="nav-export-csv-btn"
              href="/api/export"
              download
              className="btn-secondary-3d px-3 py-1.5 text-xs font-semibold text-stone-200 hover:text-white transition-all cursor-pointer min-h-[38px] inline-flex items-center"
              title="Download CSV database export including Stock Price & Avg Monthly Volume"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
              <span className="hidden md:inline">Export CSV</span>
            </a>
          </span>

          {/* Export Executive Briefing to ~/Downloads */}
          <button
            id="nav-export-report-btn"
            type="button"
            onClick={onExportReport}
            disabled={isExporting}
            className="btn-gold-3d px-4 py-1.5 text-xs font-bold min-h-[38px]"
            title="Generate comprehensive Markdown dossier to ~/Downloads"
          >
            <FileDown className="w-3.5 h-3.5 mr-1.5 text-[#070a10]" />
            <span className="hidden sm:inline">{isExporting ? "Generating..." : "Download Dossier"}</span><span className="sm:hidden">{isExporting ? "..." : "Dossier"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
