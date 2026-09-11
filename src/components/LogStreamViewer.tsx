import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  Clock,
  Bookmark,
  Download,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { LogEntry, EventType, ParsingStats } from '../types';

interface LogStreamViewerProps {
  entries: LogEntry[];
  onSelectIP: (ip: string) => void;
  activeFilterEvent?: string | null;
  onClearFilterEvent?: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  stats?: ParsingStats;
  onBack?: () => void;
}

export const LogStreamViewer: React.FC<LogStreamViewerProps> = ({
  entries,
  onSelectIP,
  activeFilterEvent,
  onClearFilterEvent,
  searchTerm: externalSearchTerm,
  onSearchChange: externalOnSearchChange,
  stats,
  onBack
}) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const activeSearch = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;

  const handleSearchChange = (term: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(term);
    } else {
      setInternalSearchTerm(term);
    }
    setCurrentPage(1);
  };

  const [selectedEventType, setSelectedEventType] = useState<string>(activeFilterEvent || 'ALL');
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [timeRange, setTimeRange] = useState<string>('ALL');
  const [savedFilter, setSavedFilter] = useState<string>('ALL');

  React.useEffect(() => {
    if (activeFilterEvent) {
      setSelectedEventType(activeFilterEvent);
    }
  }, [activeFilterEvent]);

  // Reset page when search or filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeSearch, selectedEventType, onlyFlagged, timeRange, savedFilter, pageSize]);

  // Calculate maximum timestamp for relative time ranges
  const maxTimestampMs = useMemo(() => {
    let max = 0;
    for (const e of entries) {
      const ms = e.timestampObj ? e.timestampObj.getTime() : 0;
      if (ms > max) max = ms;
    }
    return max || Date.now();
  }, [entries]);

  const filteredLogs = useMemo(() => {
    return entries.filter(log => {
      // 1. Saved filter presets
      if (savedFilter === 'PRIVILEGED') {
        const u = (log.user || '').toLowerCase();
        if (!u.includes('root') && !u.includes('admin') && !u.includes('sysadmin')) return false;
      } else if (savedFilter === 'AUTH_FAIL') {
        if (log.event !== 'LOGIN_FAILED') return false;
      } else if (savedFilter === 'ERRORS_500') {
        if (log.event !== 'ERROR' && (!log.statusCode || log.statusCode < 500)) return false;
      } else if (savedFilter === 'OFF_HOURS') {
        const h = log.timestampObj ? log.timestampObj.getHours() : 0;
        if (h >= 6 && h <= 20) return false;
      } else if (savedFilter === 'FLAGGED') {
        if (!log.isFlagged) return false;
      }

      // 2. Event type filter
      if (selectedEventType !== 'ALL' && log.event !== selectedEventType) return false;

      // 3. Only Flagged checkbox
      if (onlyFlagged && !log.isFlagged) return false;

      // 4. Time range filter
      if (timeRange !== 'ALL' && log.timestampObj) {
        const diffMs = maxTimestampMs - log.timestampObj.getTime();
        if (timeRange === '15M' && diffMs > 15 * 60 * 1000) return false;
        if (timeRange === '1H' && diffMs > 60 * 60 * 1000) return false;
        if (timeRange === '6H' && diffMs > 6 * 60 * 60 * 1000) return false;
        if (timeRange === '24H' && diffMs > 24 * 60 * 60 * 1000) return false;
        if (timeRange === 'OFF_HOURS') {
          const h = log.timestampObj.getHours();
          if (h >= 6 && h <= 20) return false;
        }
      }
      
      // 5. Active Search term grep
      if (activeSearch && activeSearch.trim()) {
        const term = activeSearch.trim().toLowerCase();
        const matchStatus = log.statusCode !== undefined && String(log.statusCode).includes(term);
        const matchIP = log.ip.toLowerCase().includes(term);
        const matchEvent = log.event.toLowerCase().includes(term);
        const matchUser = log.user ? log.user.toLowerCase().includes(term) : false;
        const matchMessage = log.message ? log.message.toLowerCase().includes(term) : false;
        const matchPath = log.path ? log.path.toLowerCase().includes(term) : false;
        const matchMethod = log.method ? log.method.toLowerCase().includes(term) : false;
        const matchRaw = log.raw.toLowerCase().includes(term);
        const matchTime = log.timestamp.toLowerCase().includes(term);
        const matchFailureReason = log.failureReason ? log.failureReason.toLowerCase().includes(term) : false;

        if (!matchStatus && !matchIP && !matchEvent && !matchUser && !matchMessage && !matchPath && !matchMethod && !matchRaw && !matchTime && !matchFailureReason) {
          return false;
        }
      }
      return true;
    });
  }, [entries, onlyFlagged, selectedEventType, activeSearch, timeRange, savedFilter, maxTimestampMs]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCopyRaw = (log: LogEntry) => {
    navigator.clipboard.writeText(log.raw);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportFilteredLogs = (format: 'csv' | 'json') => {
    let content = '';
    let mime = 'text/plain';
    if (format === 'json') {
      content = JSON.stringify(filteredLogs, null, 2);
      mime = 'application/json';
    } else {
      const headers = 'timestamp,event,ip,user,statusCode,failureReason,raw\n';
      const rows = filteredLogs.map(l => 
        `"${l.timestamp}","${l.event}","${l.ip}","${l.user || ''}","${l.statusCode || ''}","${l.failureReason || ''}","${l.raw.replace(/"/g, '""')}"`
      ).join('\n');
      content = headers + rows;
      mime = 'text/csv';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soc-filtered-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEventClass = (event: EventType) => {
    switch (event) {
      case 'LOGIN_FAILED':
        return 'text-red-400 font-bold';
      case 'LOGIN_SUCCESS':
        return 'text-green-400 font-bold';
      case 'ERROR':
        return 'text-orange-400 font-bold';
      case 'WARNING':
        return 'text-yellow-400 font-bold';
      default:
        return 'text-blue-400 font-semibold';
    }
  };

  // Safe highlight helper for text substrings matching search
  const renderHighlighted = (text: string, term: string) => {
    if (!term.trim() || !text) return text;
    const cleanTerm = term.trim();
    const parts = text.split(new RegExp(`(${cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    if (parts.length === 1) return text;

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === cleanTerm.toLowerCase() ? (
            <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded font-bold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="bg-black border border-[#334155] rounded-lg overflow-hidden flex flex-col">
      {/* Terminal Title Bar with Stats Badge */}
      <div className="px-4 py-2.5 bg-[#1E293B] flex flex-wrap items-center justify-between gap-2 border-b border-[#334155]">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-[11px] font-mono flex items-center gap-1 transition-colors mr-1"
              title="Return to previous screen"
            >
              <ArrowLeft className="w-3 h-3 text-blue-400" />
              <span>Back</span>
            </button>
          )}
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">
            TERMINAL_OUTPUT: RAW_LOG_FEED
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            ({filteredLogs.length} / {entries.length} events matching filter)
          </span>

          {/* Telemetry Stats Pill */}
          {stats && (
            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
              <span>{(stats.bytesTotal / 1024).toFixed(1)} KB</span>
              <span>•</span>
              <span className="text-emerald-400">{stats.durationMs}ms</span>
              <span>•</span>
              <span className={stats.errorLinesCount ? 'text-amber-400' : 'text-slate-400'}>
                {stats.errorLinesCount} parse errors
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Export Filtered Logs */}
          <div className="flex items-center rounded border border-[#334155] bg-[#0B0E14] overflow-hidden text-[10px] font-mono">
            <button
              onClick={() => handleExportFilteredLogs('csv')}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 border-r border-[#334155] flex items-center gap-1"
              title="Download filtered log records as CSV"
            >
              <Download className="w-3 h-3 text-slate-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExportFilteredLogs('json')}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800"
              title="Download filtered log records as JSON"
            >
              JSON
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"></div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#0F172A] border-b border-[#1E293B] flex flex-col gap-2.5 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Quick Search Grep */}
          <div className="relative flex items-center flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="log-stream-grep-input"
              type="text"
              placeholder="Grep regex, IP, user, status (e.g. 401, root, /admin)..."
              value={activeSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-[#0B0E14] border border-[#334155] text-slate-200 text-xs rounded pl-8 pr-7 py-1.5 focus:outline-none focus:border-blue-500 w-full font-mono"
            />
            {activeSearch && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2 text-slate-400 hover:text-white"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Saved Filters & Time Range Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            {/* Saved Filter Preset */}
            <div className="flex items-center gap-1 bg-[#0B0E14] border border-[#334155] rounded px-2 py-1">
              <Bookmark className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="text-slate-500 text-[10px]">Filter:</span>
              <select
                value={savedFilter}
                onChange={e => setSavedFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#0B0E14] text-white">All Events</option>
                <option value="PRIVILEGED" className="bg-[#0B0E14] text-white">Privileged Users (root/admin)</option>
                <option value="AUTH_FAIL" className="bg-[#0B0E14] text-white">Auth Failures (401/LOGIN_FAILED)</option>
                <option value="ERRORS_500" className="bg-[#0B0E14] text-white">Server Errors (500/ERROR)</option>
                <option value="OFF_HOURS" className="bg-[#0B0E14] text-white">Off-Hours Telemetry (00-06h)</option>
                <option value="FLAGGED" className="bg-[#0B0E14] text-white">Flagged Anomaly IOCs</option>
              </select>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-1 bg-[#0B0E14] border border-[#334155] rounded px-2 py-1">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-slate-500 text-[10px]">Window:</span>
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#0B0E14] text-white">All Time</option>
                <option value="15M" className="bg-[#0B0E14] text-white">Last 15m</option>
                <option value="1H" className="bg-[#0B0E14] text-white">Last 1 Hour</option>
                <option value="6H" className="bg-[#0B0E14] text-white">Last 6 Hours</option>
                <option value="24H" className="bg-[#0B0E14] text-white">Last 24 Hours</option>
                <option value="OFF_HOURS" className="bg-[#0B0E14] text-white">Off-Hours Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Event Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
            {['ALL', 'LOGIN_FAILED', 'LOGIN_SUCCESS', 'ERROR', 'WARNING', 'INFO'].map(type => (
              <button
                key={type}
                onClick={() => {
                  setSelectedEventType(type);
                  setCurrentPage(1);
                  if (onClearFilterEvent && type === 'ALL') onClearFilterEvent();
                }}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedEventType === type
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white bg-[#0B0E14] border border-[#1E293B]'
                }`}
              >
                {type}
              </button>
            ))}

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 text-[10px] ml-2 select-none hover:text-slate-200 font-sans">
              <input
                type="checkbox"
                checked={onlyFlagged}
                onChange={(e) => {
                  setOnlyFlagged(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded bg-slate-900 border-[#334155] accent-red-500"
              />
              <span>Flagged Only</span>
            </label>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#0B0E14] border border-[#334155] rounded px-1.5 py-0.5 text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
      </div>

      {/* Terminal Log Rows */}
      <div className="p-4 font-mono text-[11px] leading-relaxed space-y-1.5 max-h-[500px] overflow-y-auto bg-black select-text">
        {paginatedLogs.length > 0 ? (
          paginatedLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const isFailed = log.event === 'LOGIN_FAILED' || (log.statusCode && log.statusCode >= 400);

            return (
              <div 
                key={log.id} 
                className={`p-2 rounded transition-colors flex flex-col ${
                  isFailed ? 'bg-red-500/5 border border-red-500/10' : 'hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-500 text-[10px] select-all">
                      {log.timestamp}
                    </span>

                    <span className={getEventClass(log.event)}>
                      [{renderHighlighted(log.event, activeSearch)}]
                    </span>

                    {/* HTTP status code tag if parsed */}
                    {log.statusCode !== undefined && (
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                        log.statusCode >= 500 
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                          : log.statusCode >= 400 
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-green-500/20 text-green-400 border-green-500/30'
                      }`}>
                        HTTP {renderHighlighted(String(log.statusCode), activeSearch)}
                      </span>
                    )}

                    <button
                      onClick={() => onSelectIP(log.ip)}
                      className="text-white hover:text-blue-400 underline decoration-slate-600 hover:decoration-blue-400 font-bold"
                      title="Inspect IP"
                    >
                      {renderHighlighted(log.ip, activeSearch)}
                    </button>

                    {log.user && (
                      <span className="text-slate-400 text-[10px]">
                        user='{renderHighlighted(log.user, activeSearch)}'
                      </span>
                    )}

                    {log.failureReason && (
                      <span 
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-950/80 text-red-300 border border-red-800/60 font-medium"
                        title={`Authentication failure cause: ${log.failureReason}`}
                      >
                        <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                        <span>Reason: <strong className="text-red-200">{renderHighlighted(log.failureReason, activeSearch)}</strong></span>
                      </span>
                    )}

                    {log.message && (
                      <span className="text-slate-300">
                        {renderHighlighted(log.message, activeSearch)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopyRaw(log)}
                      className="p-1 text-slate-500 hover:text-white rounded hover:bg-slate-800"
                      title="Copy raw line"
                    >
                      {copiedId === log.id ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="p-1 text-slate-500 hover:text-white rounded hover:bg-slate-800"
                      title="Inspect payload"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Raw Inspector & Root Cause Diagnostic */}
                {isExpanded && (
                  <div className="mt-2 space-y-2">
                    {log.failureReason && (
                      <div className="p-2.5 bg-red-950/30 border border-red-800/40 rounded flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-red-300 font-bold">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>FAILED AUTHENTICATION ROOT CAUSE:</span>
                        </div>
                        <div className="text-red-200 font-mono pl-5 text-xs font-semibold">
                          {renderHighlighted(log.failureReason, activeSearch)}
                        </div>
                        {log.user && (
                          <div className="text-slate-400 pl-5 text-[10px]">
                            Targeted account: <span className="text-white font-mono">{log.user}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-2 bg-[#0B0E14] border border-[#1E293B] rounded text-[10px] text-green-500/90 break-all select-all">
                      <code>{renderHighlighted(log.raw, activeSearch)}</code>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-500 font-mono text-xs space-y-2">
            <div>No log entries match the search pattern: <span className="text-amber-400 font-bold">"{activeSearch}"</span></div>
            {activeSearch && (
              <button 
                onClick={() => handleSearchChange('')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors border border-slate-700"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Pagination Bar */}
      <div className="px-4 py-2.5 bg-[#1E293B]/70 border-t border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-white">{filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-white">{Math.min(currentPage * pageSize, filteredLogs.length)}</strong> of{' '}
            <strong className="text-white">{filteredLogs.length}</strong> events
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* First Page */}
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(1)}
            className="p-1.5 bg-[#0F172A] hover:bg-slate-800 disabled:opacity-30 rounded border border-[#334155] text-slate-300 transition-colors"
            title="First Page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Previous Page */}
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="px-2.5 py-1 bg-[#0F172A] hover:bg-slate-800 disabled:opacity-30 rounded border border-[#334155] text-slate-300 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          {/* Page Counter & Direct Jump */}
          <div className="flex items-center gap-1 px-2">
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  setCurrentPage(val);
                }
              }}
              className="w-12 text-center bg-[#0B0E14] border border-[#334155] rounded py-0.5 text-white font-mono focus:outline-none focus:border-blue-500"
            />
            <span>of {totalPages}</span>
          </div>

          {/* Next Page */}
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="px-2.5 py-1 bg-[#0F172A] hover:bg-slate-800 disabled:opacity-30 rounded border border-[#334155] text-slate-300 flex items-center gap-1 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page */}
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="p-1.5 bg-[#0F172A] hover:bg-slate-800 disabled:opacity-30 rounded border border-[#334155] text-slate-300 transition-colors"
            title="Last Page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
