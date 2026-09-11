import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar 
} from 'recharts';
import { TimeSeriesDataPoint, AnalysisSummary } from '../types';

interface ChartsSectionProps {
  timeSeries: TimeSeriesDataPoint[];
  ipData: Array<{ ip: string; failed: number; success: number; total: number }>;
  summary: AnalysisSummary;
  onSelectIP?: (ip: string) => void;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  timeSeries,
  ipData,
  summary,
  onSelectIP
}) => {
  // Top IPs
  const topIPs = [...ipData].sort((a, b) => b.total - a.total).slice(0, 5);

  // Risk Distribution calculation
  const totalEvents = summary.totalLogs || 1;
  const bruteForcePercent = Math.min(100, Math.round((summary.failedLogins / totalEvents) * 100));
  const errorPercent = Math.min(100, Math.round((summary.errorCount / totalEvents) * 100));
  const legitPercent = Math.max(0, 100 - bruteForcePercent - errorPercent);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Incident & Authentication Timeline (8 cols on lg) */}
      <div 
        id="chart-activity-timeline"
        className="lg:col-span-8 bg-[#111827] border border-[#334155] rounded-lg flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-[#334155] flex items-center justify-between bg-[#0F172A]/40">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Authentication & Event Timeline
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chronological distribution of failed login bursts vs verified traffic
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Failed Logins
            </span>
            <span className="flex items-center gap-1.5 text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Verified Auth
            </span>
          </div>
        </div>

        <div className="p-4 h-64 w-full">
          {timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="failedColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="successColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="timeLabel" stroke="#64748B" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11, fontFamily: 'monospace' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#E2E8F0',
                    fontFamily: 'monospace'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="failedLogins" 
                  name="Failed Logins"
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#failedColor)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="successLogins" 
                  name="Successful"
                  stroke="#10b981" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#successColor)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
              No timeline data points registered
            </div>
          )}
        </div>
      </div>

      {/* 2. Risk Distribution & Top Sources Panel (4 cols on lg) */}
      <div 
        id="chart-risk-distribution"
        className="lg:col-span-4 bg-[#111827] border border-[#334155] rounded-lg p-5 flex flex-col justify-between"
      >
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Risk Distribution
          </h3>

          <div className="space-y-4 font-mono">
            {/* Brute Force */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-slate-400">Brute Force / Auth Attacks</span>
                <span className="text-white font-bold">{bruteForcePercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-500" 
                  style={{ width: `${Math.max(5, bruteForcePercent)}%` }}
                />
              </div>
            </div>

            {/* Error / System Failures */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-slate-400">System Exceptions & Errors</span>
                <span className="text-white font-bold">{errorPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-500" 
                  style={{ width: `${Math.max(2, errorPercent)}%` }}
                />
              </div>
            </div>

            {/* Normal Verified Traffic */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-slate-400">Legitimate Verified Traffic</span>
                <span className="text-white font-bold">{legitPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${Math.max(5, legitPercent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Attacking Source Summary */}
        {topIPs.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#1E293B]">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2 font-mono">
              Primary Threat Vector
            </span>
            <div 
              onClick={() => onSelectIP && onSelectIP(topIPs[0].ip)}
              className="p-2.5 bg-[#0B0E14] border border-[#1E293B] rounded flex items-center justify-between cursor-pointer hover:border-red-500/40 transition-colors"
            >
              <span className="font-mono text-xs text-red-400 font-bold">{topIPs[0].ip}</span>
              <span className="text-[11px] font-mono text-slate-400">{topIPs[0].failed} failures</span>
            </div>
          </div>
        )}

        {/* SOC Heuristic Callout */}
        <div className="mt-4 p-3 bg-slate-900/90 border border-[#1E293B] rounded">
          <p className="text-[10px] text-slate-500 leading-relaxed italic font-mono">
            "Heuristic detection enabled. Multi-source regex parsing and dictionary aggregation active."
          </p>
        </div>
      </div>
    </div>
  );
};
