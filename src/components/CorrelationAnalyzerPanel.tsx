import React, { useState, useMemo } from 'react';
import { 
  GitCompare, 
  Activity, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Search, 
  Sliders, 
  Server, 
  User, 
  Copy, 
  Check, 
  Zap, 
  Database,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { LogEntry, CorrelatedErrorIncident } from '../types';
import { analyzeCorrelations, CorrelationOptions } from '../utils/correlationAnalyzer';

interface CorrelationAnalyzerPanelProps {
  entries: LogEntry[];
  onInvestigateIP?: (ip: string) => void;
  onFilterByEvent?: (event: string) => void;
}

export const CorrelationAnalyzerPanel: React.FC<CorrelationAnalyzerPanelProps> = ({
  entries,
  onInvestigateIP,
}) => {
  // Configurable settings
  const [windowSeconds, setWindowSeconds] = useState<number>(60);
  const [direction, setDirection] = useState<'all' | 'error-first' | 'attack-first'>('error-first');
  const [sameIPOnly, setSameIPOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'incidents' | 'timeline' | 'signatures'>('incidents');

  // Compute correlation analysis
  const correlationResult = useMemo(() => {
    const opts: CorrelationOptions = {
      windowSeconds,
      direction,
      sameIPOnly
    };
    return analyzeCorrelations(entries, opts);
  }, [entries, windowSeconds, direction, sameIPOnly]);

  // Filtered incidents based on search term
  const filteredIncidents = useMemo(() => {
    if (!searchTerm.trim()) return correlationResult.incidents;
    const q = searchTerm.toLowerCase();
    return correlationResult.incidents.filter(inc => {
      const matchSig = inc.errorSignature.toLowerCase().includes(q);
      const matchRaw = inc.errorLog.raw.toLowerCase().includes(q);
      const matchIP = inc.errorLog.ip.toLowerCase().includes(q) || inc.affectedIPs.some(ip => ip.toLowerCase().includes(q));
      const matchUser = inc.affectedUsers.some(u => u.toLowerCase().includes(q));
      const matchMsg = inc.errorLog.message ? inc.errorLog.message.toLowerCase().includes(q) : false;
      return matchSig || matchRaw || matchIP || matchUser || matchMsg;
    });
  }, [correlationResult.incidents, searchTerm]);

  // Copy handler
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export correlation findings as Markdown
  const handleExportMarkdown = () => {
    const md = [
      `# Temporal Correlation Analysis Report`,
      `Generated: ${new Date().toISOString()}`,
      `Correlation Window: ±${windowSeconds} seconds | Direction: ${direction}`,
      ``,
      `## Executive Summary`,
      `- Total System Error Events: ${correlationResult.totalErrorLogs}`,
      `- Total Failed Login Attempts: ${correlationResult.totalFailedLogins}`,
      `- Linked System Error Incidents: ${correlationResult.correlatedErrorCount}`,
      `- Failed Logins Induced/Linked: ${correlationResult.correlatedFailuresCount} (${correlationResult.overallCorrelationRatio}% of all failures)`,
      ``,
      `## Identified Correlated Incidents`,
      ...correlationResult.incidents.map((inc, i) => {
        return [
          `### Incident #${i + 1}: ${inc.errorSignature} (${inc.causality})`,
          `- Error Timestamp: ${inc.errorTimestamp}`,
          `- Error Source: ${inc.errorLog.ip} | Message: ${inc.errorLog.message || inc.errorLog.raw}`,
          `- Correlated Failed Logins: ${inc.correlatedFailuresCount} attempts`,
          `- Average Lag Time (Δt): ${inc.avgDeltaSeconds}s (Min: ${inc.minDeltaSeconds}s, Max: ${inc.maxDeltaSeconds}s)`,
          `- Affected Users: ${inc.affectedUsers.join(', ') || 'None specified'}`,
          `- Affected IPs: ${inc.affectedIPs.join(', ')}`,
          `- Confidence: ${inc.confidenceScore}%`,
          `- Root Cause Analysis: ${inc.rootCauseAnalysis}`,
          `- Recommended SOC Action: ${inc.recommendedAction}`,
          ``
        ].join('\n');
      })
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error_auth_correlation_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
                <GitCompare className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Temporal Correlation Analyzer
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  ERROR ↔ LOGIN_FAILED
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cross-references exact timestamps of system <span className="text-red-400 font-mono font-bold">ERROR</span> logs with <span className="text-amber-400 font-mono font-bold">LOGIN_FAILED</span> attempts. Determines whether backend database pool exhaustion, LDAP/PAM timeouts, or socket failures are triggering false-positive authentication lockouts, or if brute-force attack surges are exhausting server capacity.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="export-correlation-report-btn"
              onClick={handleExportMarkdown}
              className="px-3 py-2 bg-[#1E293B] hover:bg-[#334155] text-slate-200 hover:text-white rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm"
              title="Export correlation findings as Markdown"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#1E293B]">
          {/* KPI 1 */}
          <div className="bg-[#0B0E14] border border-[#1E293B] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Correlation Ratio</span>
              <Activity className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-rose-400">
                {correlationResult.overallCorrelationRatio}%
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                ({correlationResult.correlatedFailuresCount}/{correlationResult.totalFailedLogins} failures)
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 truncate">
              {correlationResult.overallCorrelationRatio > 50 ? 'High error-induced failure rate' : 'Standard failure distribution'}
            </p>
          </div>

          {/* KPI 2 */}
          <div className="bg-[#0B0E14] border border-[#1E293B] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Clusters</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-amber-400">
                {correlationResult.correlatedErrorCount}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                of {correlationResult.totalErrorLogs} errors
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 truncate">
              Errors exhibiting temporal alignment
            </p>
          </div>

          {/* KPI 3 */}
          <div className="bg-[#0B0E14] border border-[#1E293B] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Top Error Trigger</span>
              <Database className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="mt-1">
              <div className="text-xs font-mono font-bold text-blue-300 truncate" title={correlationResult.topErrorTriggers[0]?.errorSignature || 'None'}>
                {correlationResult.topErrorTriggers[0]?.errorSignature || 'No errors tied to logins'}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 truncate">
              {correlationResult.topErrorTriggers[0] 
                ? `${correlationResult.topErrorTriggers[0].failureCount} linked failure attempts` 
                : 'Zero error triggers detected'}
            </p>
          </div>

          {/* KPI 4 */}
          <div className="bg-[#0B0E14] border border-[#1E293B] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Average Lag (Δt)</span>
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-emerald-400">
                {correlationResult.incidents.length > 0 
                  ? `${Math.abs(Math.round(correlationResult.incidents.reduce((acc, i) => acc + i.avgDeltaSeconds, 0) / correlationResult.incidents.length))}s`
                  : '0s'}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                window ±{windowSeconds}s
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 truncate">
              Reaction interval between events
            </p>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Correlation Window Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 text-xs font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Window (Δt):
            </span>
            <div className="flex items-center gap-1 bg-[#0B0E14] p-1 rounded-lg border border-[#1E293B]">
              {[15, 30, 60, 120, 300].map((sec) => (
                <button
                  key={sec}
                  id={`window-btn-${sec}`}
                  onClick={() => setWindowSeconds(sec)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                    windowSeconds === sec
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Directionality Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 text-xs font-mono flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Causality:
            </span>
            <div className="flex items-center gap-1 bg-[#0B0E14] p-1 rounded-lg border border-[#1E293B]">
              <button
                id="dir-error-first"
                onClick={() => setDirection('error-first')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1 ${
                  direction === 'error-first'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="System Error occurred first -> followed by failed logins"
              >
                <span>Error → Auth Failure</span>
              </button>
              <button
                id="dir-attack-first"
                onClick={() => setDirection('attack-first')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1 ${
                  direction === 'attack-first'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Auth failures occurred first -> followed by system error (resource exhaustion)"
              >
                <span>Attack → System Error</span>
              </button>
              <button
                id="dir-all"
                onClick={() => setDirection('all')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  direction === 'all'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Any temporal proximity within window"
              >
                <span>Bidirectional (±Δt)</span>
              </button>
            </div>
          </div>

          {/* Same IP Only Checkbox */}
          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sameIPOnly}
              onChange={(e) => setSameIPOnly(e.target.checked)}
              className="rounded bg-[#0B0E14] border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
            />
            <span>Same Host / IP Only</span>
          </label>
        </div>

        {/* Search & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#1E293B]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search error signature, IP, user account, or raw message..."
              className="w-full bg-[#0B0E14] border border-[#1E293B] focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#0B0E14] p-1 rounded-lg border border-[#1E293B] shrink-0">
            <button
              onClick={() => setActiveViewMode('incidents')}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
                activeViewMode === 'incidents'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Incident Clusters ({filteredIncidents.length})
            </button>
            <button
              onClick={() => setActiveViewMode('timeline')}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
                activeViewMode === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Event Timeline ({correlationResult.timelineEvents.length})
            </button>
            <button
              onClick={() => setActiveViewMode('signatures')}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
                activeViewMode === 'signatures'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Top Signatures ({correlationResult.topErrorTriggers.length})
            </button>
          </div>
        </div>
      </div>

      {/* 1. INCIDENT CLUSTERS VIEW */}
      {activeViewMode === 'incidents' && (
        <div className="space-y-4">
          {filteredIncidents.length === 0 ? (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-800/80 rounded-full flex items-center justify-center mx-auto text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white">No Correlated Incidents Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No system <span className="text-red-400 font-mono">ERROR</span> logs match authentication failures within the chosen <span className="font-mono text-blue-400">±{windowSeconds}s</span> window. Try increasing the window or switching causality directions.
              </p>
            </div>
          ) : (
            filteredIncidents.map((incident) => {
              const isExpanded = expandedIncidentId === incident.id;
              const isSystemCausal = incident.causality === 'SYSTEM_ERROR_TRIGGERED_AUTH_FAILURES';
              const isAttackCausal = incident.causality === 'ATTACK_TRIGGERED_SYSTEM_ERROR';

              return (
                <div 
                  key={incident.id}
                  className={`bg-[#0F172A] border rounded-xl transition-all overflow-hidden ${
                    isSystemCausal 
                      ? 'border-rose-800/50 shadow-sm shadow-rose-950/20' 
                      : isAttackCausal 
                        ? 'border-amber-800/50' 
                        : 'border-[#1E293B]'
                  }`}
                >
                  {/* Card Header Summary */}
                  <div 
                    onClick={() => setExpandedIncidentId(isExpanded ? null : incident.id)}
                    className="p-4 cursor-pointer hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                        isSystemCausal 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : isAttackCausal 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {isSystemCausal ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : isAttackCausal ? (
                          <Zap className="w-4 h-4" />
                        ) : (
                          <Info className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-white">
                            {incident.errorSignature}
                          </span>

                          {/* Causality Verdict Pill */}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                            isSystemCausal
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : isAttackCausal
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {isSystemCausal
                              ? 'System Error Triggered Auth Failures'
                              : isAttackCausal
                                ? 'Attack Surge Caused System Error'
                                : 'Temporal Coincidence'}
                          </span>

                          <span className="text-[10px] font-mono text-slate-400">
                            Confidence: <strong className="text-white">{incident.confidenceScore}%</strong>
                          </span>
                        </div>

                        {/* Error log details */}
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono flex-wrap">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3" /> {incident.errorTimestamp}
                          </span>
                          <span>Host: <strong className="text-slate-200">{incident.errorLog.ip}</strong></span>
                          {incident.affectedUsers.length > 0 && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-500" />
                              Impacted: <span className="text-amber-300 font-semibold">{incident.affectedUsers.join(', ')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side stats & toggle */}
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-red-400">
                            {incident.correlatedFailuresCount} Failed Logins
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            Avg Δt: {incident.avgDeltaSeconds > 0 ? `+${incident.avgDeltaSeconds}s` : `${incident.avgDeltaSeconds}s`}
                          </div>
                        </div>
                      </div>

                      <button 
                        className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800/60"
                        title={isExpanded ? 'Collapse incident details' : 'Expand incident details'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Drawer */}
                  {isExpanded && (
                    <div className="p-4 border-t border-[#1E293B] bg-[#0B0E14] space-y-4">
                      {/* Diagnostic & Action Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Root Cause Analysis */}
                        <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 font-mono uppercase">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                            <span>SOC Root Cause Analysis</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {incident.rootCauseAnalysis}
                          </p>
                        </div>

                        {/* Recommended Remediation */}
                        <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 font-mono uppercase">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Recommended Remediation</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {incident.recommendedAction}
                          </p>
                        </div>
                      </div>

                      {/* Raw Origin Error Log Box */}
                      <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <Server className="w-3 h-3 text-red-400" />
                            Origin Error Log Record
                          </span>
                          <button
                            onClick={() => handleCopy(`err-${incident.id}`, incident.errorLog.raw)}
                            className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            {copiedId === `err-${incident.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>Copy Raw</span>
                          </button>
                        </div>
                        <div className="font-mono text-xs text-red-400 bg-black/70 p-2 rounded border border-red-950 break-all select-all">
                          {incident.errorLog.raw}
                        </div>
                      </div>

                      {/* Correlated Failed Logins Sequence Table */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-bold">
                          <span>Correlated Failed Login Attempts ({incident.correlatedFailures.length})</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            Relative offset (Δt) relative to system error timestamp
                          </span>
                        </div>

                        <div className="max-h-56 overflow-y-auto rounded-lg border border-[#1E293B] bg-black/40">
                          <table className="w-full text-left font-mono text-xs">
                            <thead className="bg-[#0F172A] text-slate-400 text-[10px] uppercase border-b border-[#1E293B]">
                              <tr>
                                <th className="py-2 px-3">Offset (Δt)</th>
                                <th className="py-2 px-3">Timestamp</th>
                                <th className="py-2 px-3">Client IP</th>
                                <th className="py-2 px-3">Target Account</th>
                                <th className="py-2 px-3">Failure Reason / Cause</th>
                                <th className="py-2 px-3 text-right">Host Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1E293B]">
                              {incident.correlatedFailures.map((corr, idx) => {
                                const isAfter = corr.timeDeltaSeconds >= 0;
                                return (
                                  <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                                    <td className="py-2 px-3 whitespace-nowrap">
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        isAfter 
                                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' 
                                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                      }`}>
                                        {isAfter ? `+${corr.timeDeltaSeconds}s after` : `${Math.abs(corr.timeDeltaSeconds)}s before`}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                                      {corr.log.timestamp}
                                    </td>
                                    <td className="py-2 px-3 text-slate-200 font-bold whitespace-nowrap">
                                      {corr.log.ip}
                                      {corr.isSameIP && (
                                        <span className="ml-1 text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded border border-slate-700">
                                          same IP
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-amber-300 font-semibold whitespace-nowrap">
                                      {corr.log.user || '<anonymous>'}
                                    </td>
                                    <td className="py-2 px-3 text-slate-300 text-[11px] truncate max-w-[200px]">
                                      {corr.log.failureReason || corr.log.message || 'Authentication rejected'}
                                    </td>
                                    <td className="py-2 px-3 text-right whitespace-nowrap">
                                      {onInvestigateIP && (
                                        <button
                                          onClick={() => onInvestigateIP(corr.log.ip)}
                                          className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline font-mono"
                                        >
                                          Inspect IP
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. CHRONOLOGICAL EVENT TIMELINE WATERFALL VIEW */}
      {activeViewMode === 'timeline' && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Interleaved Event Sequence Waterfall</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {correlationResult.timelineEvents.length} events logged in temporal proximity
            </span>
          </div>

          {correlationResult.timelineEvents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No correlated timeline events available for current filter criteria.
            </div>
          ) : (
            <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {correlationResult.timelineEvents.map((evt, idx) => {
                const isError = evt.type === 'ERROR';
                return (
                  <div key={idx} className="relative group">
                    {/* Node Dot */}
                    <div className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 ${
                      isError 
                        ? 'bg-red-500 border-red-950 animate-pulse' 
                        : 'bg-amber-400 border-amber-950'
                    }`} />

                    <div className={`p-3 rounded-lg border font-mono text-xs transition-colors ${
                      isError 
                        ? 'bg-red-950/20 border-red-800/40 text-red-200' 
                        : 'bg-[#0B0E14] border-[#1E293B] text-slate-300'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isError 
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40' 
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            [{evt.type}]
                          </span>
                          <span className="text-slate-400 text-[11px]">{evt.timestamp}</span>
                          <span className="font-bold text-white">{evt.log.ip}</span>
                          {evt.log.user && (
                            <span className="text-amber-300">user={evt.log.user}</span>
                          )}
                        </div>

                        {evt.deltaToErrorSeconds !== undefined && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold self-start sm:self-auto ${
                            evt.deltaToErrorSeconds >= 0 ? 'text-rose-400 bg-rose-950/40' : 'text-amber-400 bg-amber-950/40'
                          }`}>
                            {evt.deltaToErrorSeconds >= 0 ? `+${evt.deltaToErrorSeconds}s lag` : `${Math.abs(evt.deltaToErrorSeconds)}s prior`}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 text-[11px] text-slate-400 break-all">
                        {evt.log.message || evt.log.raw}
                      </div>

                      {evt.log.failureReason && (
                        <div className="mt-1 text-[10px] text-red-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Cause: {evt.log.failureReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. TOP ERROR SIGNATURES BREAKDOWN */}
      {activeViewMode === 'signatures' && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Top Error Signatures Inducing Authentication Failures</span>
            </h3>
          </div>

          <div className="space-y-3">
            {correlationResult.topErrorTriggers.map((trig, idx) => {
              const maxCount = correlationResult.topErrorTriggers[0]?.failureCount || 1;
              const pct = Math.round((trig.failureCount / maxCount) * 100);

              return (
                <div key={idx} className="bg-[#0B0E14] border border-[#1E293B] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                        {idx + 1}
                      </span>
                      {trig.errorSignature}
                    </span>
                    <span className="text-rose-400 font-bold">
                      {trig.failureCount} failed login attempts ({trig.incidentCount} error events)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
