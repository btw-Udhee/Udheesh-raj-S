import React, { useState } from 'react';
import { 
  Mail, 
  X, 
  Send, 
  Trash2, 
  CheckCircle2, 
  ShieldAlert, 
  ExternalLink,
  Clock,
  User,
  Settings2,
  ArrowLeft
} from 'lucide-react';
import { EmailNotificationLog, mockEmailService, EmailNotificationConfig } from '../services/mockEmailService';

interface EmailLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: EmailNotificationLog[];
  config: EmailNotificationConfig;
  onUpdateConfig: (newConfig: Partial<EmailNotificationConfig>) => void;
  onClearLogs: () => void;
  onSendTest: () => void;
  selectedAlertIP?: string | null;
}

export const EmailLogsModal: React.FC<EmailLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
  config,
  onUpdateConfig,
  onClearLogs,
  onSendTest,
  selectedAlertIP
}) => {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(
    logs.length > 0 ? logs[0].id : null
  );
  const [isEditingSettings, setIsEditingSettings] = useState<boolean>(false);
  const [recipientInput, setRecipientInput] = useState<string>(config.recipient);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  if (!isOpen) return null;

  // Find active selected log
  const activeLog = logs.find(l => l.id === selectedLogId) || logs[0] || null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (recipientInput.trim()) {
      onUpdateConfig({ recipient: recipientInput.trim() });
      setIsEditingSettings(false);
    }
  };

  return (
    <div 
      id="email-dispatch-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans"
    >
      <div className="bg-[#0F172A] border border-[#334155] rounded-xl max-w-4xl w-full h-[620px] shadow-2xl flex flex-col overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Security Email Notification Service (Mock)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  SIMULATION READY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Dispatches high-risk intrusion alert emails to SOC on-call engineers when threshold is exceeded.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              className={`p-1.5 rounded text-xs flex items-center gap-1 border transition-colors ${
                isEditingSettings 
                  ? 'bg-blue-600 text-white border-blue-500' 
                  : 'bg-[#1E293B] text-slate-300 hover:text-white border-[#334155]'
              }`}
              title="Configure recipient and sender"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={onSendTest}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Send a sample high-risk email notification"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test Alert</span>
            </button>

            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded bg-[#1E293B] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#334155] text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Back to Previous View (ESC)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Back</span>
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Settings Drawer */}
        {isEditingSettings && (
          <form onSubmit={handleSaveSettings} className="bg-[#0B0E14] border-b border-[#1E293B] p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <label className="text-slate-400 whitespace-nowrap">Recipient Email:</label>
              <input 
                type="email"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                className="bg-[#111827] border border-[#334155] focus:border-blue-500 text-white px-3 py-1.5 rounded text-xs flex-1 outline-none font-mono"
                placeholder="e.g. soc-oncall@enterprise.security.org"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">
                Trigger: <span className="text-red-400 font-bold">HIGH / CRITICAL</span> only
              </span>
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingSettings(false)}
                className="px-2 py-1.5 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Modal Main Content: Left Log History + Right Email Viewer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Dispatch Audit Trail */}
          <div className="w-full md:w-72 border-r border-[#1E293B] bg-[#0B0E14] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[#1E293B] flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">
                Dispatched Emails ({logs.length})
              </span>
              {logs.length > 0 && (
                <button
                  onClick={onClearLogs}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  title="Clear simulated email logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#1E293B]">
              {logs.length > 0 ? (
                logs.map(log => {
                  const isSelected = activeLog?.id === log.id;
                  const isCritical = log.severity === 'CRITICAL';
                  return (
                    <button
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className={`w-full text-left p-3 transition-colors flex flex-col gap-1 ${
                        isSelected 
                          ? 'bg-blue-600/15 border-l-2 border-blue-500' 
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className={`font-bold ${isCritical ? 'text-red-400' : 'text-orange-400'}`}>
                          [{log.severity}]
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {log.sentAt}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        IP: {log.targetIP}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {log.failedCount} failed attempts
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs font-mono">
                  <Mail className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                  No emails dispatched yet. Trigger or simulate an alert to view output.
                </div>
              )}
            </div>
          </div>

          {/* Right: Email Previewer */}
          <div className="flex-1 flex flex-col bg-[#0F172A] overflow-hidden">
            {activeLog ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Email Metadata Header */}
                <div className="p-4 border-b border-[#1E293B] bg-[#111827] space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/30 text-emerald-400 border border-emerald-500/30">
                        {activeLog.deliveryStatus}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Latency: {activeLog.simulatedLatencyMs}ms
                      </span>
                    </div>

                    <div className="flex items-center bg-[#0B0E14] border border-[#1E293B] rounded p-0.5 text-[11px]">
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          viewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        Formatted Preview
                      </button>
                      <button
                        onClick={() => setViewMode('raw')}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          viewMode === 'raw' ? 'bg-blue-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        Plain Text
                      </button>
                    </div>
                  </div>

                  <div className="text-white font-bold text-sm">
                    {activeLog.subject}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-400 text-[11px]">
                    <div>
                      <span className="text-slate-500">From:</span> {activeLog.sender}
                    </div>
                    <div>
                      <span className="text-slate-500">To:</span> <span className="text-blue-400">{activeLog.recipient}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Target IP:</span> <span className="text-slate-200 font-bold">{activeLog.targetIP}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Sent:</span> {activeLog.sentAt}
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <div className="flex-1 p-4 overflow-y-auto font-sans">
                  {viewMode === 'preview' ? (
                    <div 
                      className="rounded-lg overflow-hidden max-w-2xl mx-auto shadow-md"
                      dangerouslySetInnerHTML={{ __html: activeLog.htmlBody }}
                    />
                  ) : (
                    <pre className="p-4 bg-[#0B0E14] border border-[#1E293B] rounded-lg text-green-400/90 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {activeLog.textBody}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 font-sans">
                <Mail className="w-12 h-12 text-slate-600 mb-3 opacity-60" />
                <h4 className="text-sm font-bold text-slate-300">No Email Selected</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  When high-risk brute-force attempts exceed threshold and email dispatch is active, simulated emails will appear here.
                </p>
                <button
                  onClick={onSendTest}
                  className="mt-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Immediate Test Alert</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#1E293B] bg-[#111827] flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Mock Service Status: ONLINE</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1E293B] hover:bg-slate-800 border border-[#334155] text-white rounded text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Return to previous screen (ESC)"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};
