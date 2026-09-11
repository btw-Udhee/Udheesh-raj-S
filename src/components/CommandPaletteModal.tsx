import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShieldAlert, 
  Globe, 
  Flame, 
  Briefcase, 
  Radio, 
  Bell, 
  Activity, 
  FileText, 
  Code, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Sliders, 
  Upload, 
  Sun, 
  Moon, 
  UserCheck, 
  Cpu, 
  RotateCcw,
  Zap,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { SuspiciousIP, UserRole, SOCTheme } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onLaunchSimulationModal: () => void;
  onTriggerDirectScenario: (scenarioId: string) => void;
  onToggleSound: () => void;
  isLiveMuted: boolean;
  onToggleAutoRefresh: () => void;
  autoRefreshEnabled: boolean;
  onOpenRulesModal: () => void;
  onOpenUploadModal: () => void;
  onOpenHealthModal: () => void;
  onResetDemo: () => void;
  onToggleTheme: () => void;
  theme: SOCTheme;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  suspiciousIPs: SuspiciousIP[];
  onInvestigateIP: (ip: string) => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Adversary Simulation' | 'SOC Quick Actions' | 'Forensic IP Lookup' | 'Preferences';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onLaunchSimulationModal,
  onTriggerDirectScenario,
  onToggleSound,
  isLiveMuted,
  onToggleAutoRefresh,
  autoRefreshEnabled,
  onOpenRulesModal,
  onOpenUploadModal,
  onOpenHealthModal,
  onResetDemo,
  onToggleTheme,
  theme,
  userRole,
  onChangeRole,
  suspiciousIPs,
  onInvestigateIP
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command list
  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      title: 'Go to Threat Overview',
      subtitle: 'KPIs, time-series charts, and authentication distribution',
      icon: <ShieldAlert className="w-4 h-4 text-blue-400" />,
      shortcut: '1',
      action: () => { onNavigateTab('dashboard'); onClose(); }
    },
    {
      id: 'nav-map',
      category: 'Navigation',
      title: 'Go to Live Threat Radar Map',
      subtitle: 'Geographic visualization of global adversary nodes',
      icon: <Globe className="w-4 h-4 text-emerald-400" />,
      shortcut: '2',
      action: () => { onNavigateTab('map'); onClose(); }
    },
    {
      id: 'nav-patterns',
      category: 'Navigation',
      title: 'Go to Attack Pattern Engine',
      subtitle: 'MITRE ATT&CK heuristics (Brute Force, Sprays, Stuffing)',
      icon: <Flame className="w-4 h-4 text-orange-400" />,
      shortcut: '3',
      action: () => { onNavigateTab('patterns'); onClose(); }
    },
    {
      id: 'nav-cases',
      category: 'Navigation',
      title: 'Go to Cases & Containment',
      subtitle: 'SOC incident investigation dossier & playbooks',
      icon: <Briefcase className="w-4 h-4 text-indigo-400" />,
      shortcut: '4',
      action: () => { onNavigateTab('cases'); onClose(); }
    },
    {
      id: 'nav-pipeline',
      category: 'Navigation',
      title: 'Go to Incident Response Pipeline',
      subtitle: '14-stage end-to-end interactive lifecycle flowchart & stepper',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      shortcut: 'P',
      action: () => { onNavigateTab('pipeline'); onClose(); }
    },
    {
      id: 'nav-logs',
      category: 'Navigation',
      title: 'Go to Raw Telemetry Explorer',
      subtitle: 'Tokenized log stream viewer with regex search',
      icon: <Radio className="w-4 h-4 text-cyan-400" />,
      shortcut: '5',
      action: () => { onNavigateTab('logs'); onClose(); }
    },
    {
      id: 'nav-alerts',
      category: 'Navigation',
      title: 'Go to Security Alerts & IOCs',
      subtitle: 'Active policy violations and high-risk threshold trips',
      icon: <Bell className="w-4 h-4 text-red-400" />,
      shortcut: '6',
      action: () => { onNavigateTab('alerts'); onClose(); }
    },
    {
      id: 'nav-correlation',
      category: 'Navigation',
      title: 'Go to Correlation Analyzer',
      subtitle: 'Temporal cross-referencing of 500 errors and auth failures',
      icon: <Activity className="w-4 h-4 text-purple-400" />,
      shortcut: '7',
      action: () => { onNavigateTab('correlation'); onClose(); }
    },
    {
      id: 'nav-reports',
      category: 'Navigation',
      title: 'Go to Forensic Reports & History',
      subtitle: 'Export CSV/JSON logs, executive briefs, SQLite history',
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      shortcut: '8',
      action: () => { onNavigateTab('reports'); onClose(); }
    },
    {
      id: 'nav-python',
      category: 'Navigation',
      title: 'Go to Architecture & Interview Pipeline',
      subtitle: 'Python implementation code & end-to-end walkthrough',
      icon: <Code className="w-4 h-4 text-blue-400" />,
      shortcut: '9',
      action: () => { onNavigateTab('python'); onClose(); }
    },

    // Adversary Simulation
    {
      id: 'sim-modal',
      category: 'Adversary Simulation',
      title: 'Open Attack Simulator Studio',
      subtitle: 'Configure custom burst velocity, adversary IP, and dialect',
      icon: <Zap className="w-4 h-4 text-red-400" />,
      shortcut: 'S',
      action: () => { onLaunchSimulationModal(); onClose(); }
    },
    {
      id: 'sim-ssh',
      category: 'Adversary Simulation',
      title: 'Simulate: Vertical SSH Brute-Force (T1110.001)',
      subtitle: 'Rapid dictionary attack targeting root and admin',
      icon: <Flame className="w-4 h-4 text-red-400" />,
      action: () => { onTriggerDirectScenario('SSH_BRUTE_FORCE'); onClose(); }
    },
    {
      id: 'sim-spray',
      category: 'Adversary Simulation',
      title: 'Simulate: Horizontal Password Spray (T1110.003)',
      subtitle: 'Low-and-slow single password attempt across AD accounts',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      action: () => { onTriggerDirectScenario('PASSWORD_SPRAY'); onClose(); }
    },
    {
      id: 'sim-stuffing',
      category: 'Adversary Simulation',
      title: 'Simulate: Credential Stuffing Botnet (T1110.004)',
      subtitle: 'Multi-node proxy attack hitting executive accounts',
      icon: <Flame className="w-4 h-4 text-orange-400" />,
      action: () => { onTriggerDirectScenario('CREDENTIAL_STUFFING'); onClose(); }
    },
    {
      id: 'sim-sqli',
      category: 'Adversary Simulation',
      title: 'Simulate: Web SQL Injection Vector (T1190)',
      subtitle: 'Authentication bypass payloads (OR 1=1, UNION SELECT)',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      action: () => { onTriggerDirectScenario('SQL_INJECTION'); onClose(); }
    },

    // SOC Quick Actions
    {
      id: 'action-health',
      category: 'SOC Quick Actions',
      title: 'Inspect SOC Engine & System Health',
      subtitle: 'Throughput gauges, parser memory, sliding window status',
      icon: <Cpu className="w-4 h-4 text-emerald-400" />,
      action: () => { onOpenHealthModal(); onClose(); }
    },
    {
      id: 'action-sound',
      category: 'SOC Quick Actions',
      title: isLiveMuted ? 'Unmute Security Alert Chimes' : 'Mute Security Alert Chimes',
      subtitle: isLiveMuted ? 'Turn on audio feedback for high-risk threats' : 'Silence alert sound effects',
      icon: isLiveMuted ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />,
      shortcut: 'M',
      action: () => { onToggleSound(); onClose(); }
    },
    {
      id: 'action-autorefresh',
      category: 'SOC Quick Actions',
      title: autoRefreshEnabled ? 'Pause Continuous Telemetry Ingestion' : 'Resume Continuous Telemetry Ingestion',
      subtitle: autoRefreshEnabled ? 'Halt periodic auto-scanning' : 'Stream synthetic log events every 5s',
      icon: <RefreshCw className={`w-4 h-4 ${autoRefreshEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />,
      action: () => { onToggleAutoRefresh(); onClose(); }
    },
    {
      id: 'action-rules',
      category: 'SOC Quick Actions',
      title: 'Configure Detection Rules & Thresholds',
      subtitle: 'Modify failed login limits, error rates, and IOC sensitivities',
      icon: <Sliders className="w-4 h-4 text-blue-400" />,
      action: () => { onOpenRulesModal(); onClose(); }
    },
    {
      id: 'action-upload',
      category: 'SOC Quick Actions',
      title: 'Ingest Custom Log File (.log, .txt)',
      subtitle: 'Upload Apache, SSH, Syslog, or Auth log file',
      icon: <Upload className="w-4 h-4 text-cyan-400" />,
      action: () => { onOpenUploadModal(); onClose(); }
    },
    {
      id: 'action-reset',
      category: 'SOC Quick Actions',
      title: 'Reset Demo State to Clean Slate',
      subtitle: 'Wipe synthetic bursts, reset incident cases, and reload baseline',
      icon: <RotateCcw className="w-4 h-4 text-red-400" />,
      action: () => { onResetDemo(); onClose(); }
    },

    // Preferences & Roles
    {
      id: 'pref-theme',
      category: 'Preferences',
      title: theme === 'dark' ? 'Switch to High-Contrast Light Theme' : 'Switch to High-Contrast Dark Theme',
      subtitle: `Currently using ${theme === 'dark' ? 'Cyber Dark' : 'Clean Light'} theme`,
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />,
      action: () => { onToggleTheme(); onClose(); }
    },
    {
      id: 'pref-role-analyst',
      category: 'Preferences',
      title: 'Switch Role: Tier-2 SOC Analyst',
      subtitle: 'Active triage, case management, note additions',
      icon: <UserCheck className="w-4 h-4 text-blue-400" />,
      action: () => { onChangeRole('ANALYST'); onClose(); }
    },
    {
      id: 'pref-role-admin',
      category: 'Preferences',
      title: 'Switch Role: SOC Administrator',
      subtitle: 'Full administrative rights, rule updates, containment overrides',
      icon: <UserCheck className="w-4 h-4 text-purple-400" />,
      action: () => { onChangeRole('ADMIN'); onClose(); }
    },
    {
      id: 'pref-role-viewer',
      category: 'Preferences',
      title: 'Switch Role: Executive Viewer',
      subtitle: 'Read-only visibility for executive briefs and audits',
      icon: <UserCheck className="w-4 h-4 text-slate-400" />,
      action: () => { onChangeRole('VIEWER'); onClose(); }
    },

    // Detected Suspicious IPs
    ...suspiciousIPs.slice(0, 8).map(s => ({
      id: `ip-${s.ip}`,
      category: 'Forensic IP Lookup' as const,
      title: `Investigate Host IP: ${s.ip}`,
      subtitle: `${s.failedLogins} failed logins • Risk Score: ${s.riskScore}/100 (${s.riskLevel})`,
      icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
      action: () => { onInvestigateIP(s.ip); onClose(); }
    }))
  ];

  const filteredCommands = commands.filter(cmd => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-sans">
      <div 
        className="bg-[#0F172A] border border-[#334155] rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1E293B] gap-3 bg-[#0B0E14]/60">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, tab, adversary vector, or IP (e.g. 'SSH', 'Map', '194.26')..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onClose}
              className="px-2 py-1 rounded bg-[#1E293B] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#334155] text-xs font-mono flex items-center gap-1 transition-colors"
              title="Back to Previous Screen (ESC)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Back</span>
            </button>
            <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
              ESC
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1" aria-label="Close command palette">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Command List Container */}
        <div className="overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching commands or telemetry records found for "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-md ${isSelected ? 'bg-blue-700 text-white' : 'bg-[#1E293B]'}`}>
                      {cmd.icon}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {cmd.title}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-mono ${
                          isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {cmd.category}
                        </span>
                      </div>
                      {cmd.subtitle && (
                        <p className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {cmd.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        isSelected ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {cmd.shortcut}
                      </span>
                    )}
                    <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-[#1E293B] bg-[#0B0E14]/70 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Active Role: <strong className="text-blue-400">{userRole}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
          >
            <ArrowLeft className="w-3 h-3 text-blue-400" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
