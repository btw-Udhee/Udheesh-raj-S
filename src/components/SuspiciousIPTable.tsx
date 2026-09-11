import React, { useState } from 'react';
import { 
  Users, 
  Ban, 
  ShieldCheck, 
  Search,
  ExternalLink
} from 'lucide-react';
import { SuspiciousIP, RiskLevel } from '../types';

interface SuspiciousIPTableProps {
  suspiciousIPs: SuspiciousIP[];
  onInvestigateIP: (ip: string) => void;
  onToggleBlockIP: (ip: string) => void;
  onToggleWhitelistIP: (ip: string) => void;
  blockedIPs: Set<string>;
  whitelistedIPs: Set<string>;
}

export const SuspiciousIPTable: React.FC<SuspiciousIPTableProps> = ({
  suspiciousIPs,
  onInvestigateIP,
  onToggleBlockIP,
  onToggleWhitelistIP,
  blockedIPs,
  whitelistedIPs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  const filteredList = suspiciousIPs.filter(item => {
    const matchesSearch = item.ip.includes(searchTerm) || 
      item.associatedUsers.some(u => u.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterRisk === 'ALL') return true;
    return item.riskLevel === filterRisk;
  });

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40 font-bold';
      case 'HIGH':
        return 'bg-red-500/15 text-red-400 border-red-500/30 font-semibold';
      case 'MEDIUM':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30 font-medium';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30 font-medium';
    }
  };

  return (
    <div className="bg-[#111827] border border-[#334155] rounded-lg overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F172A]/40">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Suspicious Host Activity & Blacklist Registry
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Heuristic detection of hosts exceeding failed login limits
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search IP or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0B0E14] border border-[#334155] text-slate-200 text-xs rounded pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 w-44 sm:w-56 font-mono"
            />
          </div>

          {/* Risk Filter */}
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-[#0B0E14] border border-[#334155] text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer font-mono"
          >
            <option value="ALL">All Risks</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#0F172A] text-slate-400 uppercase text-[10px] tracking-widest border-b border-[#334155]">
            <tr>
              <th className="py-3 px-4">Source Host</th>
              <th className="py-3 px-4">Failed Logins</th>
              <th className="py-3 px-4">Volume</th>
              <th className="py-3 px-4">Targeted Users</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4">Firewall Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {filteredList.length > 0 ? (
              filteredList.map((item) => {
                const isBlocked = blockedIPs.has(item.ip);
                const isWhitelisted = whitelistedIPs.has(item.ip);

                return (
                  <tr 
                    key={item.ip}
                    id={`suspicious-ip-row-${item.ip.replace(/\./g, '-')}`}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    {/* IP */}
                    <td className="py-3 px-4 font-bold text-slate-200">
                      <div className="flex items-center gap-2">
                        <span>{item.ip}</span>
                        {item.ip.startsWith('192.168.') || item.ip.startsWith('10.') ? (
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-sans">
                            RFC1918
                          </span>
                        ) : (
                          <span className="text-[9px] bg-blue-950 text-blue-400 border border-blue-800/60 px-1.5 py-0.2 rounded font-sans">
                            WAN
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Failed Logins & Primary Reason */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                            {item.failedLogins}
                          </span>
                        </div>
                        {item.primaryFailureReason && (
                          <span 
                            className="text-[10px] text-red-300 font-mono truncate max-w-[150px] block" 
                            title={`Primary root cause: ${item.primaryFailureReason}`}
                          >
                            Cause: <strong className="text-red-200">{item.primaryFailureReason}</strong>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Requests */}
                    <td className="py-3 px-4 text-slate-400">
                      {item.totalRequests} events
                    </td>

                    {/* Targeted Accounts */}
                    <td className="py-3 px-4">
                      {item.associatedUsers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.associatedUsers.slice(0, 3).map((usr, i) => (
                            <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                              {usr}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">None logged</span>
                      )}
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${getRiskBadge(item.riskLevel)}`}>
                        {item.riskLevel}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {isBlocked ? (
                        <span className="inline-flex items-center gap-1 bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          <Ban className="w-3 h-3" /> BLACKLISTED
                        </span>
                      ) : isWhitelisted ? (
                        <span className="inline-flex items-center gap-1 bg-green-950 text-green-400 border border-green-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" /> WHITELISTED
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Monitoring</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onToggleBlockIP(item.ip)}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                            isBlocked
                              ? 'bg-red-600 text-white'
                              : 'bg-[#1E293B] text-slate-300 hover:text-red-400 hover:bg-slate-800 border border-[#334155]'
                          }`}
                          title={isBlocked ? 'Unblock' : 'Blacklist'}
                        >
                          {isBlocked ? 'Unblock' : 'Drop'}
                        </button>

                        <button
                          onClick={() => onInvestigateIP(item.ip)}
                          className="px-2 py-1 bg-[#1E293B] text-slate-300 hover:text-white hover:bg-slate-800 border border-[#334155] rounded text-[10px] transition-colors"
                          title="Forensic view"
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                  No hosts matching detection parameters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
