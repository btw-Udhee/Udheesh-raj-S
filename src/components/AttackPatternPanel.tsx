import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Crosshair, 
  ExternalLink, 
  Users, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Terminal, 
  Filter, 
  Info,
  Server,
  Zap
} from 'lucide-react';
import { AttackPattern, AttackPatternType, RiskLevel } from '../types';

interface AttackPatternPanelProps {
  patterns: AttackPattern[];
  onInvestigateIP: (ip: string) => void;
  onFilterByIP?: (ip: string) => void;
}

export const AttackPatternPanel: React.FC<AttackPatternPanelProps> = ({
  patterns,
  onInvestigateIP,
  onFilterByIP
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering
  const filteredPatterns = useMemo(() => {
    return patterns.filter(p => {
      if (selectedType !== 'ALL' && p.type !== selectedType) return false;
      if (selectedSeverity !== 'ALL' && p.severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchIP = p.sourceIPs.some(ip => ip.toLowerCase().includes(q));
        const matchUser = p.targetedUsers.some(u => u.toLowerCase().includes(q));
        return matchTitle || matchDesc || matchIP || matchUser;
      }
      return true;
    });
  }, [patterns, selectedType, selectedSeverity, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const critical = patterns.filter(p => p.severity === 'CRITICAL').length;
    const high = patterns.filter(p => p.severity === 'HIGH').length;
    const distinctIPs = new Set<string>();
    const distinctUsers = new Set<string>();
    patterns.forEach(p => {
      p.sourceIPs.forEach(ip => distinctIPs.add(ip));
      p.targetedUsers.forEach(u => distinctUsers.add(u));
    });

    return {
      total: patterns.length,
      critical,
      high,
      uniqueAttackingIPs: distinctIPs.size,
      targetedAccounts: distinctUsers.size
    };
  }, [patterns]);

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">TOTAL PATTERNS DETECTED</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-mono font-bold text-white">
            {stats.total}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Multi-vector behavioral heuristics
          </p>
        </div>

        <div className="bg-[#0F172A] border border-red-500/30 rounded-xl p-4 shadow-sm bg-red-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-red-400">CRITICAL ATTACK CAMPAIGNS</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-mono font-bold text-red-400">
            {stats.critical}
          </div>
          <p className="mt-1 text-[11px] text-red-300/70">
            Requires immediate defensive mitigation
          </p>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">TARGETED USER IDENTITIES</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-mono font-bold text-amber-400">
            {stats.targetedAccounts}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            High-value credentials under attack
          </p>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">ACTIVE ADVERSARY IPS</span>
            <Crosshair className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-mono font-bold text-purple-400">
            {stats.uniqueAttackingIPs}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Distinct origin points identified
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#1E293B] text-slate-200 border border-[#334155] rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Attack Types</option>
            <option value="BRUTE_FORCE">Vertical Brute-Force</option>
            <option value="PASSWORD_SPRAYING">Horizontal Password Spraying</option>
            <option value="CREDENTIAL_STUFFING">Credential Stuffing (Bot)</option>
            <option value="PORT_SCAN_PATH_PROBE">Port Scan / Path Probes</option>
            <option value="SENSITIVE_ENDPOINT_ABUSE">Sensitive Endpoint Abuse</option>
            <option value="MULTI_USER_DICTIONARY_ATTACK">Multi-User Dictionary Enum</option>
            <option value="DISTRIBUTED_BRUTE_FORCE">Distributed Botnet Swarm</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-[#1E293B] text-slate-200 border border-[#334155] rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Filter by IP, username, keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#1E293B] text-slate-200 border border-[#334155] rounded-lg px-3 py-1.5 text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-64"
        />
      </div>

      {/* Pattern Cards List */}
      {filteredPatterns.length === 0 ? (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white font-mono">No Matching Attack Patterns Detected</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Current log window does not exhibit matching behavioral signatures or filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPatterns.map((pattern) => {
            const isCritical = pattern.severity === 'CRITICAL';
            const isHigh = pattern.severity === 'HIGH';

            return (
              <div
                key={pattern.id}
                className={`bg-[#0F172A] border rounded-xl p-5 transition-all shadow-sm ${
                  isCritical 
                    ? 'border-red-500/40 bg-red-950/5' 
                    : isHigh 
                      ? 'border-orange-500/40 bg-orange-950/5' 
                      : 'border-[#1E293B]'
                }`}
              >
                {/* Header & Badges */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg shrink-0 border ${
                      isCritical
                        ? 'bg-red-950/60 border-red-500/40 text-red-400'
                        : isHigh
                          ? 'bg-orange-950/60 border-orange-500/40 text-orange-400'
                          : 'bg-blue-950/60 border-blue-500/40 text-blue-400'
                    }`}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-white tracking-tight font-mono">
                          {pattern.title}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${
                          isCritical
                            ? 'bg-red-500/20 text-red-300 border-red-500/30'
                            : isHigh
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {pattern.severity}
                        </span>
                        <a
                          href={pattern.mitreTechnique.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] bg-[#1E293B] hover:bg-[#334155] text-blue-400 border border-[#334155] px-2 py-0.5 rounded font-mono flex items-center gap-1 transition-colors"
                        >
                          <span>MITRE {pattern.mitreTechnique.id}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        Pattern Type: <span className="text-slate-300 font-bold">{pattern.type}</span> • {pattern.eventCount} correlated events • Confidence: {pattern.confidenceScore}%
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {pattern.sourceIPs.length === 1 && (
                      <button
                        onClick={() => onInvestigateIP(pattern.sourceIPs[0])}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Investigate IP</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="mt-3 text-xs text-slate-300 leading-relaxed bg-[#0A0F1D] p-3 rounded-lg border border-[#1E293B]">
                  {pattern.description}
                </p>

                {/* Targeted User & IP Chips */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {/* Origin IPs */}
                  <div className="bg-[#0A0E1A] p-2.5 rounded-lg border border-[#1E293B]">
                    <span className="text-[10px] text-slate-400 block mb-1.5 font-bold uppercase">
                      Originating Threat Actor IP(s):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {pattern.sourceIPs.map(ip => (
                        <button
                          key={ip}
                          onClick={() => onInvestigateIP(ip)}
                          className="bg-[#1E293B] hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <span>{ip}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Targeted Accounts or Paths */}
                  <div className="bg-[#0A0E1A] p-2.5 rounded-lg border border-[#1E293B]">
                    <span className="text-[10px] text-slate-400 block mb-1.5 font-bold uppercase">
                      {pattern.targetedUsers.length > 0 ? 'Targeted User Identities:' : 'Targeted Endpoints / Paths:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {pattern.targetedUsers.length > 0 ? (
                        pattern.targetedUsers.map(user => (
                          <span
                            key={user}
                            className="bg-amber-950/40 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px]"
                          >
                            user={user}
                          </span>
                        ))
                      ) : pattern.targetedEndpoints.length > 0 ? (
                        pattern.targetedEndpoints.map(endp => (
                          <span
                            key={endp}
                            className="bg-purple-950/40 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[11px]"
                          >
                            {endp}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-[11px]">System endpoints</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Behavioral Indicators & Remediation */}
                <div className="mt-4 pt-3 border-t border-[#1E293B]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>
                      <strong className="text-slate-300">Remediation:</strong> {pattern.recommendedAction}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 shrink-0">
                    Observed: {pattern.firstSeen} → {pattern.lastSeen}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
