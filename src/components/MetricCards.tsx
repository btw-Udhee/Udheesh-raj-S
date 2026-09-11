import React from 'react';
import { 
  FileSpreadsheet, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertOctagon, 
  Users,
  AlertCircle,
  GitCompare,
  ArrowRight,
  Globe,
  Crosshair,
  Flame,
  Workflow
} from 'lucide-react';
import { AnalysisSummary } from '../types';

interface MetricCardsProps {
  summary: AnalysisSummary;
  onFilterByEvent?: (eventType: string) => void;
  onViewSuspiciousIPs?: () => void;
  onViewAlerts?: () => void;
  correlatedIncidentsCount?: number;
  onViewCorrelation?: () => void;
  attackPatternsCount?: number;
  onViewPatterns?: () => void;
  onViewThreatMap?: () => void;
  onViewPipeline?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  summary,
  onFilterByEvent,
  onViewSuspiciousIPs,
  onViewAlerts,
  correlatedIncidentsCount = 0,
  onViewCorrelation,
  attackPatternsCount = 0,
  onViewPatterns,
  onViewThreatMap,
  onViewPipeline
}) => {
  const failureRate = summary.totalLogs > 0 
    ? Math.round((summary.failedLogins / summary.totalLogs) * 100) 
    : 0;

  const systemHealth = summary.totalLogs > 0
    ? (Math.max(0, 100 - (failureRate * 0.8) - (summary.errorCount * 2))).toFixed(1)
    : '100.0';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* 1. Total Events */}
        <div 
          id="metric-card-total-logs"
          className="bg-[#1E293B]/40 border border-[#334155] p-5 rounded-lg flex flex-col justify-center transition-all hover:bg-[#1E293B]/60"
        >
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-between">
            <span>Total Events</span>
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
          </span>
          <span className="text-3xl font-mono text-white tracking-tight">
            {summary.totalLogs.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 font-mono">
            {summary.uniqueIPsCount} source host{summary.uniqueIPsCount === 1 ? '' : 's'} tracked
          </span>
        </div>

        {/* 2. Failed Logins */}
        <div 
          id="metric-card-failed-logins"
          onClick={() => onFilterByEvent?.('LOGIN_FAILED')}
          className="bg-[#1E293B]/40 border border-[#334155] p-5 rounded-lg flex flex-col justify-center transition-all hover:border-red-500/50 hover:bg-[#1E293B]/60 cursor-pointer group"
        >
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-between">
            <span className="text-red-400 group-hover:text-red-300">Failed Logins</span>
            <XCircle className="w-3.5 h-3.5 text-red-400" />
          </span>
          <span className="text-3xl font-mono text-red-400 tracking-tight">
            {summary.failedLogins.toLocaleString()}
          </span>
          <div className="flex flex-col mt-1 font-mono">
            <span className="text-[10px] text-red-500/80">
              {failureRate}% failure ratio ({summary.successfulLogins} verified)
            </span>
            {summary.topFailureReason && (
              <span className="text-[10px] text-red-300 flex items-center gap-1 mt-0.5 truncate" title={`Top failure cause: ${summary.topFailureReason}`}>
                <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                <span className="truncate">Top: {summary.topFailureReason}</span>
              </span>
            )}
          </div>
        </div>

        {/* 3. Suspicious IPs */}
        <div 
          id="metric-card-suspicious-ips"
          onClick={onViewSuspiciousIPs}
          className="bg-[#1E293B]/40 border border-[#334155] p-5 rounded-lg flex flex-col justify-center transition-all hover:border-orange-500/50 hover:bg-[#1E293B]/60 cursor-pointer group"
        >
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-between">
            <span className="text-orange-400 group-hover:text-orange-300">Suspicious IPs</span>
            <Users className="w-3.5 h-3.5 text-orange-400" />
          </span>
          <span className="text-3xl font-mono text-orange-400 tracking-tight">
            {summary.suspiciousIPsCount}
          </span>
          <span className="text-[10px] text-orange-400/70 mt-1 font-mono">
            {summary.criticalAlertsCount} critical priority alert{summary.criticalAlertsCount === 1 ? '' : 's'}
          </span>
        </div>

        {/* 4. System Health / Auth Integrity */}
        <div 
          id="metric-card-system-health"
          onClick={onViewAlerts}
          className="bg-[#1E293B]/40 border border-[#334155] p-5 rounded-lg flex flex-col justify-center transition-all hover:bg-[#1E293B]/60 cursor-pointer"
        >
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-between">
            <span className="text-green-400">System Health</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
          </span>
          <span className="text-3xl font-mono text-green-400 tracking-tight">
            {systemHealth}%
          </span>
          <span className="text-[10px] text-green-500/80 mt-1 font-mono">
            {summary.errorCount} system exception{summary.errorCount === 1 ? '' : 's'} logged
          </span>
        </div>
      </div>

      {/* Attack Patterns Insight Banner */}
      {attackPatternsCount > 0 && (
        <div 
          onClick={onViewPatterns}
          className="bg-purple-950/20 hover:bg-purple-950/30 border border-purple-500/30 rounded-lg p-3 flex items-center justify-between gap-3 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-purple-500/20 text-purple-300 rounded-md border border-purple-500/30">
              <Crosshair className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-mono font-bold text-purple-200 flex items-center gap-2">
                <span>Adversary Attack Patterns Detected: {attackPatternsCount} Distinct Signature{attackPatternsCount === 1 ? '' : 's'}</span>
                <span className="text-[9px] bg-purple-500/30 text-purple-300 px-1.5 py-0.2 rounded font-mono">
                  MITRE ATT&CK
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Identified vertical brute-force, horizontal password spraying, credential stuffing, or port/path reconnaissance patterns.
              </p>
            </div>
          </div>
          <button 
            className="text-xs font-mono text-purple-300 group-hover:text-white flex items-center gap-1 shrink-0 font-semibold"
          >
            <span>View Patterns</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Correlation Insight Banner on Dashboard */}
      {correlatedIncidentsCount > 0 && (
        <div 
          onClick={onViewCorrelation}
          className="bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/30 rounded-lg p-3 flex items-center justify-between gap-3 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-rose-500/20 text-rose-300 rounded-md border border-rose-500/30">
              <GitCompare className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-mono font-bold text-rose-200 flex items-center gap-2">
                <span>Temporal Correlation Detected: {correlatedIncidentsCount} System Error Incident{correlatedIncidentsCount === 1 ? '' : 's'}</span>
                <span className="text-[9px] bg-rose-500/30 text-rose-300 px-1.5 py-0.2 rounded font-mono">
                  ERROR ↔ LOGIN_FAILED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Timestamp cross-referencing identified system errors closely preceding authentication rejections (possible false positive security alarms).
              </p>
            </div>
          </div>
          <button 
            className="text-xs font-mono text-rose-300 group-hover:text-white flex items-center gap-1 shrink-0 font-semibold"
          >
            <span>Inspect Correlation</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* SOC Incident Lifecycle Pipeline Banner */}
      {onViewPipeline && (
        <div 
          onClick={onViewPipeline}
          className="bg-emerald-950/20 hover:bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-3 flex items-center justify-between gap-3 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30">
              <Workflow className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-mono font-bold text-emerald-200 flex items-center gap-2">
                <span>SOC Incident Response Lifecycle Pipeline</span>
                <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                  14-STAGE WORKFLOW
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Event → Detection Engine → Risk Scoring → Correlation → Incident → [Evidence / Story / IOCs] → Playbook → Decision → Response → Report
              </p>
            </div>
          </div>
          <button 
            className="text-xs font-mono text-emerald-300 group-hover:text-white flex items-center gap-1 shrink-0 font-semibold"
          >
            <span>Launch Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};

