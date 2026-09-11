import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Database, 
  Clock, 
  FileSpreadsheet,
  ShieldCheck
} from 'lucide-react';
import { 
  LogEntry, 
  AnalysisSummary, 
  SecurityAlert, 
  SuspiciousIP, 
  AnalysisHistoryItem 
} from '../types';
import { exportToCSV, exportAlertsToJSON } from '../utils/analyzer';
import { analyzeCorrelations } from '../utils/correlationAnalyzer';

interface ReportsPanelProps {
  entries: LogEntry[];
  summary: AnalysisSummary;
  alerts: SecurityAlert[];
  suspiciousIPs: SuspiciousIP[];
  activeFileName: string;
  history: AnalysisHistoryItem[];
  onLoadHistoryItem: (item: AnalysisHistoryItem) => void;
}

export const ReportsPanel: React.FC<ReportsPanelProps> = ({
  entries,
  summary,
  alerts,
  suspiciousIPs,
  activeFileName,
  history,
  onLoadHistoryItem
}) => {
  const [copiedText, setCopiedText] = useState(false);

  const generateExecutiveReport = () => {
    return `# 🛡️ CYBERSECURITY INCIDENT & LOG ANALYSIS REPORT
Generated on: ${new Date().toUTCString()}
Target File: ${activeFileName}

## 1. Executive Summary
- Total Analyzed Records: ${summary.totalLogs}
- Successful Authentications: ${summary.successfulLogins}
- Failed Authentication Attempts: ${summary.failedLogins} (${summary.totalLogs > 0 ? Math.round((summary.failedLogins / summary.totalLogs) * 100) : 0}% failure rate)
- Top Failed Login Root Cause: ${summary.topFailureReason || 'None recorded'}
- System Exceptions / Errors: ${summary.errorCount}
- Flagged Malicious / Suspicious IPs: ${summary.suspiciousIPsCount}
- Security Alerts Raised: ${summary.alertsCount} (${summary.criticalAlertsCount} High/Critical)

${summary.failureReasonsBreakdown && summary.failureReasonsBreakdown.length > 0 ? `### Authentication Failure Causes Breakdown:
${summary.failureReasonsBreakdown.map(f => `- ${f.reason}: ${f.count} attempts (${f.percentage}%)`).join('\n')}
` : ''}
## 2. Identified Threat Actors & Suspicious IPs
${suspiciousIPs.map(ip => `### IP: ${ip.ip}
- Risk Level: ${ip.riskLevel} (Score: ${ip.riskScore}/100)
- Failed Login Attempts: ${ip.failedLogins}
- Primary Failure Cause: ${ip.primaryFailureReason || 'Invalid credentials'}
- Total Request Volume: ${ip.totalRequests}
- First Seen: ${ip.firstSeen} | Last Seen: ${ip.lastSeen}
- Targeted User Accounts: ${ip.associatedUsers.length > 0 ? ip.associatedUsers.join(', ') : 'None specified'}
- Trigger Reasons: ${ip.reasons.join('; ')}
`).join('\n')}

## 3. System Error ↔ Failed Login Correlation Analysis
${(() => {
  const corr = analyzeCorrelations(entries, { windowSeconds: 60 });
  if (corr.incidents.length === 0) {
    return `- No direct temporal correlation detected between system errors and authentication failures.\n`;
  }
  return `- Total Correlated Incidents: ${corr.incidents.length}
- System Errors Linked to Auth Failures: ${corr.correlatedErrorCount}
- Auth Failures Correlated with System Errors: ${corr.correlatedFailuresCount} (${corr.overallCorrelationRatio}% of total failed logins)
- Notable Cascades:
${corr.incidents.slice(0, 5).map(inc => `  * [${inc.causality}] ${inc.errorTimestamp} - Error: "${inc.errorSignature}" linked to ${inc.correlatedFailuresCount} auth failure(s) across ${inc.affectedIPs.length} IP(s)`).join('\n')}
`;
})()}

## 4. Recommended Remediation Actions
1. Immediately enforce IP drop rules on firewall for critical brute-force IPs: ${suspiciousIPs.filter(i => i.riskLevel === 'CRITICAL' || i.riskLevel === 'HIGH').map(i => i.ip).join(', ') || 'None currently'}.
2. Check credential hygiene for compromised targeted accounts.
3. Review database connection pool, LDAP timeout configs, and socket limits to eliminate false positive brute-force alarms caused by backend errors.
4. Enable multi-factor authentication (MFA) on external gateway endpoints.
5. Export forensic records to central SIEM / SQLite cold store.
`;
  };

  const handleDownloadCSV = () => {
    const csvData = exportToCSV(entries);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `security_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const jsonData = exportAlertsToJSON(alerts, summary);
    const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `security_report_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyReport = () => {
    const text = generateExecutiveReport();
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="bg-[#111827] border border-[#334155] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Forensic Reports & SIEM Export Center
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Export structured CSV/JSON telemetry (Level 2) and audit history records (Level 3)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="download-csv-btn"
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 bg-[#1E293B] hover:bg-slate-800 text-slate-300 border border-[#334155] text-xs font-semibold px-4 py-2 rounded transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" />
            <span>Export CSV</span>
          </button>

          <button
            id="download-json-btn"
            onClick={handleDownloadJSON}
            className="inline-flex items-center gap-1.5 bg-[#1E293B] hover:bg-slate-800 text-slate-300 border border-[#334155] text-xs font-semibold px-4 py-2 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export JSON</span>
          </button>

          <button
            id="copy-report-btn"
            onClick={handleCopyReport}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded shadow-lg shadow-blue-900/20 transition-colors"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied Brief</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Executive Brief</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Executive Report Preview & SQLite History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Executive Brief (7 cols) */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#334155] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              Incident Brief (Markdown Preview)
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-[#0B0E14] px-2 py-0.5 rounded border border-[#1E293B]">
              {activeFileName}
            </span>
          </div>

          <div className="bg-[#0B0E14] border border-[#1E293B] rounded p-4 font-mono text-[11px] text-slate-300 overflow-y-auto max-h-[420px] whitespace-pre-wrap leading-relaxed select-text">
            {generateExecutiveReport()}
          </div>
        </div>

        {/* Right: SQLite History Store (5 cols) */}
        <div className="lg:col-span-5 bg-[#111827] border border-[#334155] rounded-lg p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Historical Analysis Database
              </span>
              <span className="text-[10px] bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono">
                SQLite Store
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              Persistent cold store of previous scan runs and IOC metrics
            </p>

            <div className="mt-3 divide-y divide-[#1E293B] max-h-[340px] overflow-y-auto font-mono text-xs">
              {history.length > 0 ? (
                history.map(item => (
                  <div 
                    key={item.id}
                    className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {item.fileName}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span>{item.analyzedAt}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>{item.totalLogs} events</span>
                        <span>•</span>
                        <span className="text-red-400">{item.failedLogins} fails</span>
                        <span>•</span>
                        <span className="text-orange-400">{item.alertsCount} alerts</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onLoadHistoryItem(item)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2.5 py-1 bg-[#1E293B] border border-[#334155] rounded hover:bg-slate-800 transition-colors"
                    >
                      Reload
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs font-mono">
                  No scan runs in local database.
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-[#0B0E14] border border-[#1E293B] rounded text-[10px] text-slate-500 font-mono">
            <span className="font-bold text-slate-300">Level 3 Architecture:</span> Stores timestamps, summary counters, and IOC records in durable relational table format.
          </div>
        </div>
      </div>
    </div>
  );
};
