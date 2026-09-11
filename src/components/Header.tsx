import React, { useState } from 'react';
import { 
  RefreshCw, 
  FileText, 
  Upload, 
  Sliders, 
  Menu, 
  Layers,
  ShieldCheck,
  Radio,
  Clock,
  ChevronDown,
  Volume2,
  VolumeX,
  Zap,
  Search,
  Keyboard,
  Sun,
  Moon,
  RotateCcw,
  Cpu,
  UserCheck,
  Briefcase,
  ArrowLeft
} from 'lucide-react';
import { SAMPLE_LOG_PRESETS } from '../data/sampleLogs';
import { UserRole, SOCTheme, ParsingStats } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'logs' | 'alerts' | 'map' | 'patterns' | 'correlation' | 'reports' | 'python' | 'cases' | 'pipeline';
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  onOpenUploadModal: () => void;
  onOpenRulesModal?: () => void;
  onRefreshData: () => void;
  onGenerateReport: () => void;
  onToggleSidebar?: () => void;
  currentFileName: string;
  onGoBack?: () => void;
  canGoBack?: boolean;
  previousTabName?: string;
  // Auto-Refresh & Live Streaming Feature
  autoRefreshEnabled?: boolean;
  onToggleAutoRefresh?: () => void;
  autoRefreshInterval?: number;
  onChangeInterval?: (seconds: number) => void;
  countdown?: number;
  isScanning?: boolean;
  lastScannedAt?: string;
  newEntriesDetectedSession?: number;
  isLiveMuted?: boolean;
  onToggleMute?: () => void;
  onTriggerAttackBurst?: () => void;
  // Polish Features
  onOpenCommandPalette?: () => void;
  onOpenShortcutsModal?: () => void;
  onOpenHealthModal?: () => void;
  onResetDemo?: () => void;
  theme?: SOCTheme;
  onToggleTheme?: () => void;
  userRole?: UserRole;
  onChangeRole?: (role: UserRole) => void;
  stats?: ParsingStats;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  selectedPresetId,
  onSelectPreset,
  onOpenUploadModal,
  onRefreshData,
  onGenerateReport,
  onToggleSidebar,
  currentFileName,
  onGoBack,
  canGoBack = false,
  previousTabName,
  autoRefreshEnabled = false,
  onToggleAutoRefresh,
  autoRefreshInterval = 5,
  onChangeInterval,
  countdown = 5,
  isScanning = false,
  lastScannedAt,
  newEntriesDetectedSession = 0,
  isLiveMuted = false,
  onToggleMute,
  onTriggerAttackBurst,
  onOpenCommandPalette,
  onOpenShortcutsModal,
  onOpenHealthModal,
  onResetDemo,
  theme = 'dark',
  onToggleTheme,
  userRole = 'ANALYST',
  onChangeRole,
  stats
}) => {
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const INTERVAL_OPTIONS = [1, 2, 3, 5, 10];

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Threat Overview',
          subtitle: `Monitoring ${currentFileName} and system authentication events for suspicious behavior`
        };
      case 'cases':
        return {
          title: 'Incident Cases & Containment',
          subtitle: 'Active SOC investigation dossiers, playbook actions, and containment logs'
        };
      case 'pipeline':
        return {
          title: 'SOC Incident Response Lifecycle Pipeline',
          subtitle: 'End-to-end interactive operational pipeline: Security Event → Detection → Correlation → Response → Resolution'
        };
      case 'map':
        return {
          title: 'Live Threat Radar Map',
          subtitle: 'Interactive World & India geographic visualization of attacking IP nodes, trajectories, and SOC defense targets'
        };
      case 'patterns':
        return {
          title: 'Attack Pattern Detection Engine',
          subtitle: 'Multi-vector behavioral heuristics: brute force, password spraying, credential stuffing, and port/path scanning'
        };
      case 'logs':
        return {
          title: 'Raw Log Explorer',
          subtitle: `Real-time tokenized telemetry feed from ${currentFileName}`
        };
      case 'alerts':
        return {
          title: 'Security Alerts & IOCs',
          subtitle: 'Active policy violations, high-velocity brute force, and anomalous IP scores'
        };
      case 'correlation':
        return {
          title: 'Correlation Analyzer (ERROR ↔ LOGIN_FAILED)',
          subtitle: 'Cross-referencing system exception timestamps with authentication failures to determine root causes'
        };
      case 'reports':
        return {
          title: 'Forensic Reports & Database',
          subtitle: 'Export CSV/JSON logs, executive incident brief, and SQLite run history'
        };
      case 'python':
        return {
          title: 'Python Project & Interview Architecture',
          subtitle: 'Levels 1–4 implementation code, in-browser CLI simulator, and technical interview guide'
        };
    }
  };

  const { title, subtitle } = getTabTitle();

  const getRoleBadgeStyle = (role?: UserRole | string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-950/70 text-purple-300 border-purple-600/40';
      case 'VIEWER':
        return 'bg-slate-800/70 text-slate-300 border-slate-600/40';
      case 'ANALYST':
      default:
        return 'bg-blue-950/70 text-blue-300 border-blue-600/40';
    }
  };

  return (
    <header className="h-16 border-b border-[#1E293B] flex items-center justify-between px-3 sm:px-6 bg-[#0F172A]/90 backdrop-blur shrink-0 sticky top-0 z-20">
      {/* Left side: Navigation toggle + Back button + Title + Global Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-slate-400 hover:text-white rounded bg-[#1E293B] border border-[#334155] sm:hidden shrink-0"
            title="Toggle Navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Universal Back Button */}
        {canGoBack && onGoBack && (
          <button
            id="header-global-back-btn"
            onClick={onGoBack}
            className="px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-slate-200 hover:text-white border border-[#334155] hover:border-blue-500/50 text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm shrink-0 active:scale-95 group"
            title={`Back to ${previousTabName || 'Dashboard'} (Alt+←)`}
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-white tracking-tight truncate">
              {title}
            </h1>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-400 border border-blue-800/60 shrink-0">
              {currentFileName}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate hidden sm:flex max-w-xs md:max-w-sm lg:max-w-md">
            {activeTab !== 'dashboard' && onGoBack && (
              <>
                <button 
                  onClick={onGoBack}
                  className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer hover:underline shrink-0"
                  title="Return to previous screen"
                >
                  Dashboard
                </button>
                <span className="text-slate-600 shrink-0">/</span>
              </>
            )}
            <span className="truncate">{subtitle}</span>
          </div>
        </div>

        {/* Global Command Search Bar Trigger */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="hidden xl:flex items-center gap-2 ml-3 px-3 py-1.5 bg-[#0B0E14] hover:bg-slate-900 border border-[#334155] rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
            title="Search commands, tabs, or IPs (⌘K / Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-mono">Quick Search...</span>
            <kbd className="px-1.5 py-0.2 rounded bg-[#1E293B] border border-slate-700 text-[10px] font-mono text-slate-400">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* Right side: Auto-Refresh, Role Selector, Theme & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Toggleable Auto-Refresh Feature */}
        <div 
          id="header-auto-refresh-container"
          className={`relative hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
            autoRefreshEnabled
              ? 'bg-emerald-950/40 border-emerald-500/40 shadow-sm shadow-emerald-950/50'
              : 'bg-[#0B0E14] border-[#1E293B]'
          }`}
          title={autoRefreshEnabled 
            ? `Auto-scan active: re-scanning ${currentFileName} every ${autoRefreshInterval}s (Next in ${countdown}s)` 
            : `Auto-refresh paused. Toggle to re-scan ${currentFileName} automatically for new entries.`}
        >
          {/* Status Icon / Pulse Indicator */}
          <div className="flex items-center gap-1 text-slate-400">
            {autoRefreshEnabled ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600"></span>
            )}
            <span className="hidden xl:inline text-[11px] font-mono font-medium text-slate-300">
              Auto-Stream
            </span>
          </div>

          {/* Toggle Switch */}
          {onToggleAutoRefresh && (
            <button
              id="auto-refresh-toggle-switch"
              type="button"
              role="switch"
              aria-checked={autoRefreshEnabled}
              onClick={onToggleAutoRefresh}
              className={`relative inline-flex h-4 w-7.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoRefreshEnabled ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoRefreshEnabled ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </button>
          )}

          {/* Countdown & Interval selector */}
          {autoRefreshEnabled && (
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className={`font-bold ${isScanning ? 'text-emerald-300 animate-pulse' : 'text-emerald-400'}`}>
                {isScanning ? 'Scan' : `${countdown}s`}
              </span>
              
              {onChangeInterval && (
                <div className="relative">
                  <button
                    onClick={() => setShowIntervalMenu(!showIntervalMenu)}
                    className="px-1 py-0.2 rounded text-[9px] bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-600/30 flex items-center gap-0.5"
                  >
                    <span>{autoRefreshInterval}s</span>
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>

                  {showIntervalMenu && (
                    <div 
                      className="absolute right-0 mt-1 w-24 bg-[#0F172A] border border-[#334155] rounded-md shadow-xl py-1 z-30 font-mono text-xs"
                      onMouseLeave={() => setShowIntervalMenu(false)}
                    >
                      {INTERVAL_OPTIONS.map(sec => (
                        <button
                          key={sec}
                          onClick={() => {
                            onChangeInterval(sec);
                            setShowIntervalMenu(false);
                          }}
                          className={`w-full text-left px-2 py-1 hover:bg-slate-800 transition-colors flex items-center justify-between text-[11px] ${
                            autoRefreshInterval === sec ? 'text-emerald-400 font-bold' : 'text-slate-300'
                          }`}
                        >
                          <span>{sec}s</span>
                          {autoRefreshInterval === sec && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Role Selector Dropdown */}
        {onChangeRole && (
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`px-2 py-1 rounded text-[11px] font-mono border flex items-center gap-1.5 transition-colors ${getRoleBadgeStyle(userRole)}`}
              title="Change User Persona / Role"
            >
              <UserCheck className="w-3 h-3" />
              <span className="hidden sm:inline font-bold">{userRole}</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>

            {showRoleMenu && (
              <div 
                className="absolute right-0 mt-1 w-48 bg-[#0F172A] border border-[#334155] rounded-lg shadow-xl py-1 z-30 font-sans text-xs"
                onMouseLeave={() => setShowRoleMenu(false)}
              >
                <div className="px-3 py-1 text-[10px] text-slate-500 uppercase font-mono font-semibold border-b border-[#1E293B]">
                  Select Persona / Role
                </div>
                {(['ANALYST', 'ADMIN', 'VIEWER'] as UserRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      onChangeRole(role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 transition-colors flex items-center justify-between ${
                      userRole === role ? 'text-blue-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">
                        {role === 'ANALYST' ? 'Tier-2 Analyst' : role === 'ADMIN' ? 'SOC Administrator' : 'Executive Viewer'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {role === 'ANALYST' ? 'Triage & Playbooks' : role === 'ADMIN' ? 'Full Authority' : 'Read-Only Audit'}
                      </div>
                    </div>
                    {userRole === role && <span className="text-blue-400 font-mono">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* System Health Panel Trigger */}
        {onOpenHealthModal && (
          <button
            onClick={onOpenHealthModal}
            className="p-1.5 rounded border border-[#334155] bg-[#0B0E14] hover:bg-slate-800 text-emerald-400 transition-colors"
            title="System & Pipeline Health"
          >
            <Cpu className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Audio Mute / Unmute Toggle */}
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded border transition-colors ${
              isLiveMuted 
                ? 'bg-[#0B0E14] text-slate-500 border-[#1E293B] hover:text-slate-300' 
                : 'bg-blue-950/50 text-blue-400 border-blue-500/40 hover:bg-blue-900/50'
            }`}
            title={isLiveMuted ? "Sound alerts muted. Click to enable SOC audio chimes" : "Audio chimes active for high-risk threats. Click to mute (Hotkey: M)"}
          >
            {isLiveMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Theme Toggle (Dark / Light) */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded border border-[#334155] bg-[#0B0E14] hover:bg-slate-800 text-slate-300 transition-colors"
            title={`Toggle Theme (Current: ${theme === 'dark' ? 'Cyber Dark' : 'Clean Light'})`}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
          </button>
        )}

        {/* Keyboard Shortcuts Trigger */}
        {onOpenShortcutsModal && (
          <button
            onClick={onOpenShortcutsModal}
            className="hidden sm:flex p-1.5 rounded border border-[#334155] bg-[#0B0E14] hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Keyboard Shortcuts Cheatsheet (?)"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Demo / Reset Button */}
        {onResetDemo && (
          <button
            onClick={onResetDemo}
            className="hidden md:flex items-center gap-1 text-[11px] font-mono bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded transition-colors"
            title="Reset telemetry bursts, cases, and rules to default baseline"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset Demo</span>
          </button>
        )}

        {/* Quick Attack Simulator Trigger */}
        {onTriggerAttackBurst && (
          <button
            onClick={onTriggerAttackBurst}
            className="flex items-center gap-1 text-[11px] font-mono bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/40 px-2 py-1 rounded transition-colors"
            title="Launch Attack Simulation Studio (Hotkey: S)"
          >
            <Zap className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="hidden sm:inline">Simulate</span>
          </button>
        )}

        {/* Manual Re-scan / Refresh button */}
        <button
          id="manual-refresh-data-btn"
          onClick={onRefreshData}
          className={`bg-[#1E293B] text-slate-300 text-xs px-2 sm:px-2.5 py-1.5 rounded border border-[#334155] hover:bg-slate-800 transition-colors flex items-center gap-1 ${
            isScanning ? 'ring-1 ring-emerald-500/50' : ''
          }`}
          title="Manually trigger immediate log re-scan (Hotkey: R)"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isScanning ? 'animate-spin text-emerald-400' : ''}`} />
          <span className="hidden xl:inline">
            {isScanning ? 'Scanning...' : 'Scan'}
          </span>
        </button>

        {/* Generate Report button */}
        <button
          onClick={onGenerateReport}
          className="bg-blue-600 text-white text-xs px-2.5 sm:px-3 py-1.5 rounded font-semibold hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-colors flex items-center gap-1 shrink-0"
          title="Export CSV/JSON forensic report"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Report</span>
        </button>
      </div>
    </header>
  );
};

