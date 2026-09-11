import React from 'react';
import { 
  Search, 
  X, 
  Hash, 
  Globe, 
  ShieldAlert, 
  RotateCcw,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface LogSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  totalLogs: number;
  matchingLogs: number;
  frequentIPs?: string[];
}

export const LogSearchBar: React.FC<LogSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  totalLogs,
  matchingLogs,
  frequentIPs = []
}) => {
  // Pre-configured quick search tags for fast triage
  const ERROR_CODES = ['401', '403', '404', '500'];
  const KEYWORDS = ['LOGIN_FAILED', 'root', 'admin', 'password'];
  const FAILURE_REASONS = ['Invalid password', 'User not found', 'Account locked', 'MFA'];
  const COMMON_SUBNETS = frequentIPs.slice(0, 3).length > 0 
    ? frequentIPs.slice(0, 3) 
    : ['192.168.', '203.0.', '45.33.'];

  const handleChipClick = (value: string) => {
    if (searchTerm === value) {
      onSearchChange('');
    } else {
      onSearchChange(value);
    }
  };

  const hasFilter = searchTerm.trim().length > 0;

  return (
    <div 
      id="log-search-bar-container"
      className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 sm:p-5 shadow-lg shadow-black/40 space-y-3.5 transition-all duration-200"
    >
      {/* Top Header Row of Search Container */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>Real-Time Log Stream Search</span>
              {hasFilter && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Filtering Active
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Instant grep filter by HTTP error codes (e.g. 401, 500), partial IP strings (e.g. 192.168), or attack keywords.
            </p>
          </div>
        </div>

        {/* Live Match Counter Badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Matches:</span>
          <span className={`px-2 py-0.5 rounded font-bold border ${
            hasFilter 
              ? (matchingLogs > 0 ? 'bg-blue-500/15 border-blue-500/40 text-blue-400' : 'bg-red-500/15 border-red-500/40 text-red-400')
              : 'bg-[#0B0E14] border-[#334155] text-slate-300'
          }`}>
            {matchingLogs} / {totalLogs} logs
          </span>
          {hasFilter && (
            <button
              id="clear-log-search-btn"
              onClick={() => onSearchChange('')}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-[#334155]"
              title="Reset search filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center gap-1.5">
          <Search className="w-4 h-4 text-blue-400" />
        </div>

        <input
          id="log-search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by failure reason ('invalid password', 'account locked'), error code (401), IP, or user..."
          className="w-full bg-[#0B0E14] border border-[#334155] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-100 placeholder-slate-500 text-xs sm:text-sm rounded-lg pl-10 pr-24 py-2.5 font-mono shadow-inner outline-none transition-all"
        />

        {/* Right Action Icons inside Input */}
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800/80 border border-slate-700 text-slate-400">
            ESC / LIVE
          </span>
        </div>
      </div>

      {/* Quick Filter Presets Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
        {/* Error Code Quick Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 flex items-center gap-1 font-mono text-[10px] uppercase">
            <Hash className="w-3 h-3 text-amber-400" /> Error Codes:
          </span>
          <div className="flex items-center gap-1">
            {ERROR_CODES.map((code) => {
              const isActive = searchTerm === code;
              return (
                <button
                  key={code}
                  id={`filter-chip-code-${code}`}
                  onClick={() => handleChipClick(code)}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] transition-all border ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-sm'
                      : 'bg-[#0B0E14] text-slate-400 hover:text-slate-200 border-[#1E293B] hover:border-slate-700'
                  }`}
                >
                  {code}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-slate-700 hidden sm:inline">•</span>

        {/* Keyword Quick Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 flex items-center gap-1 font-mono text-[10px] uppercase">
            <ShieldAlert className="w-3 h-3 text-red-400" /> Keywords:
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {KEYWORDS.map((kw) => {
              const isActive = searchTerm === kw;
              return (
                <button
                  key={kw}
                  id={`filter-chip-keyword-${kw}`}
                  onClick={() => handleChipClick(kw)}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] transition-all border ${
                    isActive
                      ? 'bg-red-500/20 text-red-300 border-red-500/50 font-bold shadow-sm'
                      : 'bg-[#0B0E14] text-slate-400 hover:text-slate-200 border-[#1E293B] hover:border-slate-700'
                  }`}
                >
                  {kw}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-slate-700 hidden sm:inline">•</span>

        {/* Failure Reasons Quick Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 flex items-center gap-1 font-mono text-[10px] uppercase">
            <AlertCircle className="w-3 h-3 text-rose-400" /> Causes:
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {FAILURE_REASONS.map((fr) => {
              const isActive = searchTerm === fr;
              return (
                <button
                  key={fr}
                  id={`filter-chip-cause-${fr.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => handleChipClick(fr)}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] transition-all border ${
                    isActive
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold shadow-sm'
                      : 'bg-[#0B0E14] text-slate-400 hover:text-slate-200 border-[#1E293B] hover:border-slate-700'
                  }`}
                  title={`Filter failed logins caused by ${fr}`}
                >
                  {fr}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-slate-700 hidden lg:inline">•</span>

        {/* Partial IP Subnets */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 flex items-center gap-1 font-mono text-[10px] uppercase">
            <Globe className="w-3 h-3 text-blue-400" /> IP Substrings:
          </span>
          <div className="flex items-center gap-1">
            {COMMON_SUBNETS.map((ipPart) => {
              const isActive = searchTerm === ipPart;
              return (
                <button
                  key={ipPart}
                  id={`filter-chip-ip-${ipPart.replace(/\./g, '_')}`}
                  onClick={() => handleChipClick(ipPart)}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] transition-all border ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 font-bold shadow-sm'
                      : 'bg-[#0B0E14] text-slate-400 hover:text-slate-200 border-[#1E293B] hover:border-slate-700'
                  }`}
                  title={`Filter by ${ipPart}`}
                >
                  {ipPart}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
