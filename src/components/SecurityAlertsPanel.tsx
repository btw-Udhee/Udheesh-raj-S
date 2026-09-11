import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Sliders, 
  CheckCircle, 
  Copy, 
  Ban, 
  ExternalLink,
  AlertTriangle,
  Mail,
  MailCheck,
  Send,
  ArrowLeft
} from 'lucide-react';
import { SecurityAlert, DetectionRules, RiskLevel } from '../types';
import { 
  mockEmailService, 
  EmailNotificationLog, 
  EmailNotificationConfig 
} from '../services/mockEmailService';
import { EmailLogsModal } from './EmailLogsModal';

interface SecurityAlertsPanelProps {
  alerts: SecurityAlert[];
  rules: DetectionRules;
  onUpdateRules: (newRules: DetectionRules) => void;
  onInvestigateIP: (ip: string) => void;
  onBlockIP: (ip: string) => void;
  blockedIPs: Set<string>;
  onBack?: () => void;
}

export const SecurityAlertsPanel: React.FC<SecurityAlertsPanelProps> = ({
  alerts,
  rules,
  onUpdateRules,
  onInvestigateIP,
  onBlockIP,
  blockedIPs,
  onBack
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Email Notification Mock Service State
  const [emailConfig, setEmailConfig] = useState<EmailNotificationConfig>(() => mockEmailService.getConfig());
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>(() => mockEmailService.getLogs());
  const [showEmailLogsModal, setShowEmailLogsModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [tempThreshold, setTempThreshold] = useState<number>(rules.failedLoginThreshold);
  const [tempHighRisk, setTempHighRisk] = useState<number>(rules.highRiskThreshold);

  // Subscribe to email service updates
  useEffect(() => {
    const unsubscribe = mockEmailService.subscribe((updatedLogs, latestSent) => {
      setEmailLogs(updatedLogs);
      if (latestSent) {
        setToastMessage(`Simulated Email Dispatched to ${latestSent.recipient} for IP ${latestSent.targetIP} (${latestSent.severity})`);
        const timer = setTimeout(() => {
          setToastMessage(null);
        }, 5000);
        return () => clearTimeout(timer);
      }
    });
    return unsubscribe;
  }, []);

  // Monitor incoming alerts for high-risk / critical triggers when email notification is enabled
  useEffect(() => {
    if (!emailConfig.enabled) return;

    // Scan for any high-risk or critical alert that has not been emailed yet
    alerts.forEach(alert => {
      if (alert.riskLevel === 'HIGH' || alert.riskLevel === 'CRITICAL') {
        mockEmailService.sendAlertNotification(alert);
      }
    });
  }, [alerts, emailConfig.enabled]);

  const handleToggleEmail = () => {
    const nextState = !emailConfig.enabled;
    mockEmailService.setEnabled(nextState);
    setEmailConfig(prev => ({ ...prev, enabled: nextState }));

    if (nextState) {
      setToastMessage(`High-risk email notifications ENABLED. Target: ${emailConfig.recipient}`);
      // Check if there are active high-risk alerts to notify immediately
      const highRisk = alerts.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL');
      highRisk.forEach(a => mockEmailService.sendAlertNotification(a));
    } else {
      setToastMessage('High-risk email notifications DISABLED.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleManualDispatch = async (alert: SecurityAlert) => {
    const sent = await mockEmailService.sendAlertNotification(alert, true);
    if (sent) {
      setShowEmailLogsModal(true);
    }
  };

  const handleSendTestEmail = async () => {
    await mockEmailService.sendTestAlert();
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity === 'ALL') return true;
    return alert.riskLevel === filterSeverity;
  });

  const handleCopyAlert = (alert: SecurityAlert) => {
    const text = `ALERT!\nIP: ${alert.ip}\nFailed Login Attempts: ${alert.failedCount}\nRisk Level: ${alert.riskLevel}\nTriggered: ${alert.ruleTriggered}`;
    navigator.clipboard.writeText(text);
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveRules = () => {
    onUpdateRules({
      ...rules,
      failedLoginThreshold: tempThreshold,
      highRiskThreshold: tempHighRisk
    });
    setShowRulesModal(false);
  };

  const hasCritical = alerts.some(a => a.riskLevel === 'CRITICAL' || a.riskLevel === 'HIGH');

  return (
    <div className="bg-[#111827] border border-[#334155] rounded-lg flex flex-col overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-[#334155] flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0F172A]/40">
        <div className="flex flex-wrap items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-2 py-1 rounded bg-[#1E293B] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#334155] text-xs font-mono flex items-center gap-1 transition-colors mr-1"
              title="Return to previous screen"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Back</span>
            </button>
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Live Security Alerts</span>
          </span>
          {hasCritical ? (
            <span className="text-[10px] bg-red-900/40 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
              Critical Priority
            </span>
          ) : (
            <span className="text-[10px] bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono">
              Policy Monitoring Active
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* High-Risk Email Notification Mock Service Toggle Switch */}
          <div 
            id="email-alerts-toggle-container"
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0B0E14] border border-[#1E293B] shadow-inner"
            title="Simulate dispatching automated SIEM incident emails to SOC on-call when high-risk intrusion is detected"
          >
            <Mail className={`w-3.5 h-3.5 transition-colors ${emailConfig.enabled ? 'text-blue-400' : 'text-slate-500'}`} />
            <span className="text-[11px] font-mono text-slate-300 select-none">
              High-Risk Email:
            </span>

            {/* Toggle Switch Component */}
            <button
              id="high-risk-email-toggle"
              type="button"
              role="switch"
              aria-checked={emailConfig.enabled}
              onClick={handleToggleEmail}
              className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                emailConfig.enabled ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  emailConfig.enabled ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </button>

            <span className={`text-[10px] font-mono font-bold ${emailConfig.enabled ? 'text-blue-400' : 'text-slate-500'}`}>
              {emailConfig.enabled ? 'ON' : 'OFF'}
            </span>

            {/* View Dispatch Logs Button */}
            <button
              id="view-email-logs-btn"
              onClick={() => setShowEmailLogsModal(true)}
              className="ml-1 px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 transition-colors flex items-center gap-1"
              title="Open simulated email notification logs and preview"
            >
              <span>{emailLogs.length} Sent</span>
            </button>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center bg-[#0B0E14] border border-[#1E293B] rounded p-0.5 text-[11px] font-mono">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilterSeverity(lvl)}
                className={`px-2 py-1 rounded transition-colors ${
                  filterSeverity === lvl 
                    ? 'bg-blue-600 text-white font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Rule Configuration Button */}
          <button
            id="configure-rules-btn"
            onClick={() => setShowRulesModal(true)}
            className="inline-flex items-center gap-1.5 bg-[#1E293B] hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded border border-[#334155] transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Detection Rules</span>
          </button>
        </div>
      </div>

      {/* Simulated Email Notification Toast / Banner */}
      {toastMessage && (
        <div 
          id="email-notification-toast"
          className="mx-4 mt-3 p-2.5 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-top-1"
        >
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <MailCheck className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setShowEmailLogsModal(true)}
            className="underline text-blue-300 hover:text-white text-[11px] font-mono whitespace-nowrap"
          >
            View Email Body →
          </button>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Detection Rule Policy</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowRulesModal(false)}
                  className="px-2 py-1 rounded bg-[#1E293B] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#334155] text-xs font-mono flex items-center gap-1 transition-colors"
                  title="Back to Alerts"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                  <span>Back</span>
                </button>
                <button 
                  onClick={() => setShowRulesModal(false)}
                  className="text-slate-400 hover:text-white text-sm p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Suspicious Failed Login Threshold: <span className="text-orange-400 font-mono text-sm">{tempThreshold} attempts</span>
                </label>
                <p className="text-slate-500 text-[11px] mb-2 font-mono">
                  Default: More than 5 failed attempts → Suspicious (triggers MEDIUM alert)
                </p>
                <input 
                  type="range" 
                  min="2" 
                  max="20" 
                  value={tempThreshold}
                  onChange={(e) => setTempThreshold(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  HIGH / CRITICAL Risk Threshold: <span className="text-red-400 font-mono text-sm">{tempHighRisk} attempts</span>
                </label>
                <p className="text-slate-500 text-[11px] mb-2 font-mono">
                  Severe brute-force lock; triggers immediate HIGH alert format.
                </p>
                <input 
                  type="range" 
                  min="5" 
                  max="30" 
                  value={tempHighRisk}
                  onChange={(e) => setTempHighRisk(parseInt(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-3 py-1.5 rounded text-slate-300 hover:text-white bg-[#1E293B] hover:bg-slate-800 border border-[#334155] text-xs font-mono transition-colors flex items-center gap-1.5"
                title="Return to alerts feed"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                <span>Back</span>
              </button>
              <button
                id="save-rules-btn"
                onClick={handleSaveRules}
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30"
              >
                Apply Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Feed */}
      <div className="p-4 space-y-3 font-mono text-[11px]">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => {
            const isBlocked = blockedIPs.has(alert.ip);
            const isCritical = alert.riskLevel === 'CRITICAL' || alert.riskLevel === 'HIGH';

            return (
              <div 
                key={alert.id}
                id={`alert-card-${alert.ip.replace(/\./g, '-')}`}
                className={`p-3 rounded border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCritical 
                    ? 'bg-red-500/10 border-red-500/20' 
                    : 'bg-orange-500/10 border-orange-500/20'
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`font-bold ${isCritical ? 'text-red-500' : 'text-orange-400'}`}>
                    [{alert.riskLevel}]
                  </span>

                  <span className="text-white font-semibold underline decoration-slate-700">
                    {alert.ip}
                  </span>

                  <span className="text-slate-300">
                    {alert.description}
                  </span>

                  {isBlocked && (
                    <span className="bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                      BLOCKED
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span className="text-slate-500 text-[10px]">
                    {alert.timestamp}
                  </span>

                  {/* Email Notification Status & Manual Trigger for High-Risk Alerts */}
                  {isCritical && (
                    <>
                      {emailLogs.some(l => l.targetIP === alert.ip) ? (
                        <button
                          onClick={() => setShowEmailLogsModal(true)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors"
                          title="Click to view sent email alert preview"
                        >
                          <MailCheck className="w-3 h-3 text-emerald-400" />
                          <span className="hidden md:inline">Email Sent</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleManualDispatch(alert)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 transition-colors"
                          title="Simulate sending email alert for this incident"
                        >
                          <Send className="w-3 h-3 text-blue-400" />
                          <span className="hidden md:inline">Send Email</span>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => handleCopyAlert(alert)}
                    className="p-1 text-slate-400 hover:text-white rounded bg-[#1E293B]/60 hover:bg-slate-800"
                    title="Copy alert format"
                  >
                    {copiedId === alert.id ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => onBlockIP(alert.ip)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                      isBlocked
                        ? 'bg-slate-800 text-slate-400 cursor-default'
                        : 'bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {isBlocked ? 'Blocked' : 'Block IP'}
                  </button>

                  <button
                    onClick={() => onInvestigateIP(alert.ip)}
                    className="px-2 py-1 bg-[#1E293B] hover:bg-slate-800 text-slate-200 rounded text-[10px] font-semibold border border-[#334155] transition-colors"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-500 font-sans text-xs">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-300">No Security Alerts Triggered</p>
            <p className="text-slate-500 mt-1">
              All hosts comply with policy threshold ({rules.failedLoginThreshold} failed attempts).
            </p>
          </div>
        )}
      </div>

      {/* Simulated Email Logs & Preview Modal */}
      <EmailLogsModal
        isOpen={showEmailLogsModal}
        onClose={() => setShowEmailLogsModal(false)}
        logs={emailLogs}
        config={emailConfig}
        onUpdateConfig={(updates) => {
          mockEmailService.updateConfig(updates);
          setEmailConfig(mockEmailService.getConfig());
        }}
        onClearLogs={() => {
          mockEmailService.clearLogs();
          setEmailLogs([]);
        }}
        onSendTest={handleSendTestEmail}
      />
    </div>
  );
};
