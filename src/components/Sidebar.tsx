import React from 'react';
import { 
  BarChart3, 
  Terminal, 
  AlertTriangle, 
  FileText, 
  FileCode2, 
  Upload, 
  Sliders, 
  ShieldAlert, 
  Layers,
  ChevronRight,
  GitCompare,
  Globe,
  Crosshair,
  Briefcase,
  Zap,
  Workflow
} from 'lucide-react';
import { SAMPLE_LOG_PRESETS } from '../data/sampleLogs';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: 'dashboard' | 'logs' | 'alerts' | 'map' | 'patterns' | 'cases' | 'pipeline' | 'correlation' | 'reports' | 'python';
  setActiveTab: (tab: 'dashboard' | 'logs' | 'alerts' | 'map' | 'patterns' | 'cases' | 'pipeline' | 'correlation' | 'reports' | 'python') => void;
  alertsCount: number;
  criticalAlertsCount: number;
  openCasesCount?: number;
  correlatedIncidentsCount?: number;
  attackPatternsCount?: number;
  onOpenUploadModal: () => void;
  onOpenRulesModal: () => void;
  onOpenSimulatorModal?: () => void;
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  alertsCount,
  criticalAlertsCount,
  openCasesCount = 0,
  correlatedIncidentsCount = 0,
  attackPatternsCount = 0,
  onOpenUploadModal,
  onOpenRulesModal,
  onOpenSimulatorModal,
  selectedPresetId,
  onSelectPreset,
  collapsed,
  onToggleCollapse,
  userRole = 'ANALYST'
}) => {
  return (
    <aside 
      className={`border-r border-[#1E293B] bg-[#0F172A] flex flex-col transition-all duration-200 z-30 shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
        {!collapsed ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-bold tracking-tight text-white uppercase text-xs sm:text-sm">
                SecureLog Analytica
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
              v4.2.0-SOC-DEMO
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {/* Analysis Section */}
        {!collapsed && (
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Analysis & Threat Radar
          </div>
        )}

        <button
          onClick={() => setActiveTab('dashboard')}
          title="Live Dashboard"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
            activeTab === 'dashboard'
              ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-medium'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-xs font-medium">Live Dashboard</span>}
        </button>

        <button
          onClick={() => setActiveTab('map')}
          title="Live Threat Radar Map"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
            activeTab === 'map'
              ? 'bg-cyan-500/15 text-cyan-400 border-l-2 border-cyan-500 font-medium'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4 shrink-0 text-cyan-400" />
          {!collapsed && (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-medium">Live Threat Map</span>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.2 rounded font-mono font-bold">
                RADAR
              </span>
            </div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('patterns')}
          title="Attack Pattern Detection"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
            activeTab === 'patterns'
              ? 'bg-purple-500/15 text-purple-400 border-l-2 border-purple-500 font-medium'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          }`}
        >
          <Crosshair className="w-4 h-4 shrink-0 text-purple-400" />
          {!collapsed && (
            <>
              <span className="text-xs font-medium">Attack Patterns</span>
              {attackPatternsCount > 0 && (
                <span className="ml-auto text-purple-300 bg-purple-500/20 border border-purple-500/40 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                  {attackPatternsCount}
                </span>
              )}
            </>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cases')}
          title="Incident Cases & Response"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
            activeTab === 'cases'
              ? 'bg-amber-500/15 text-amber-400 border-l-2 border-amber-500 font-medium'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4 shrink-0 text-amber-400" />
          {!collapsed && (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-medium">Cases & Response</span>
              {openCasesCount > 0 && (
                <span className="text-amber-300 bg-amber-500/20 border border-amber-500/40 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                  {openCasesCount} OPEN
                </span>
              )}
            </div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('pipeline')}
          title="SOC Incident Response Lifecycle Pipeline"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
            activeTab === 'pipeline'
              ? 'bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-500 font-medium'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          }`}
        >
          <Workflow className="w-4 h-4 shrink-0 text-emerald-400" />
          {!collapsed && (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-medium">Incident Pipeline</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold">
                LIFECYCLE
              </span>
            </div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          title="Security Alerts"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
            activeTab === 'alerts'
              ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-medium'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          {!collapsed && (
            <>
              <span className="text-xs font-medium">Security Alerts</span>
              {alertsCount > 0 && (
                <span className={`ml-auto text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  criticalAlertsCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
                }`}>
                  {alertsCount}
                </span>
              )}
            </>
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          title="Raw Log Explorer"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
            activeTab === 'logs'
              ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-medium'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4 shrink-0 text-emerald-400" />
          {!collapsed && <span className="text-xs font-medium">Raw Log Explorer</span>}
        </button>

        <button
          onClick={() => setActiveTab('correlation')}
          title="Correlation Analyzer (Error ↔ Login Failed)"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
            activeTab === 'correlation'
              ? 'bg-rose-500/15 text-rose-400 border-l-2 border-rose-500 font-medium'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          }`}
        >
          <GitCompare className="w-4 h-4 shrink-0 text-rose-400" />
          {!collapsed && (
            <>
              <span className="text-xs font-medium">Correlation Analyzer</span>
              {correlatedIncidentsCount > 0 && (
                <span className="ml-auto text-rose-300 bg-rose-500/20 border border-rose-500/40 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                  {correlatedIncidentsCount}
                </span>
              )}
            </>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          title="Audit Reports"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
            activeTab === 'reports'
              ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-medium'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0 text-indigo-400" />
          {!collapsed && <span className="text-xs font-medium">Reports & History</span>}
        </button>

        {/* Management & Architecture Section */}
        {!collapsed && (
          <div className="pt-4 px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Architecture & Interview
          </div>
        )}

        <button
          onClick={() => setActiveTab('python')}
          title="Architecture & Interview Guide"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${
            activeTab === 'python'
              ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-medium'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          }`}
        >
          <FileCode2 className="w-4 h-4 shrink-0 text-emerald-400" />
          {!collapsed && (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-medium">Architecture & Q&A</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/30">
                PIPELINE
              </span>
            </div>
          )}
        </button>

        {/* Quick Attack Simulator Trigger Button */}
        {onOpenSimulatorModal && (
          <div className="pt-2">
            <button
              onClick={onOpenSimulatorModal}
              title="Launch Adversary Attack Simulator"
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-200 rounded-md transition-all group"
            >
              <Zap className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-mono font-bold">Attack Simulator</span>
                  <span className="text-[9px] bg-red-500/30 text-red-300 px-1 py-0.2 rounded font-mono">
                    DEMO
                  </span>
                </div>
              )}
            </button>
          </div>
        )}

        <button
          onClick={onOpenUploadModal}
          title="Upload Sources"
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 rounded-md transition-colors text-left"
        >
          <Upload className="w-4 h-4 shrink-0 text-blue-400" />
          {!collapsed && <span className="text-xs font-medium">Upload Sources</span>}
        </button>

        <button
          onClick={onOpenRulesModal}
          title="Detection Rules"
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 rounded-md transition-colors text-left"
        >
          <Sliders className="w-4 h-4 shrink-0 text-purple-400" />
          {!collapsed && <span className="text-xs font-medium">Detection Rules</span>}
        </button>

        {/* Dataset Quick Switcher inside Sidebar */}
        {!collapsed && (
          <div className="pt-3 px-1">
            <div className="p-3 bg-[#0A0D16] border border-[#1E293B] rounded-lg">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                <Layers className="w-3 h-3 text-slate-400" />
                <span>Dataset Ingestion</span>
              </div>
              <select
                value={selectedPresetId}
                onChange={(e) => onSelectPreset(e.target.value)}
                className="w-full bg-[#0F172A] border border-[#334155] text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer font-mono"
              >
                {SAMPLE_LOG_PRESETS.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </nav>

      {/* Analyst Profile Footer */}
      <div className="p-3 border-t border-[#1E293B] bg-[#0A0D16]">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 text-white ${
            userRole === 'ADMIN' ? 'bg-purple-900 border-purple-500' : userRole === 'VIEWER' ? 'bg-slate-700 border-slate-500' : 'bg-blue-900 border-blue-500'
          }`}>
            {userRole === 'ADMIN' ? 'ADM' : userRole === 'VIEWER' ? 'AUD' : 'SOC'}
          </div>
          {!collapsed && (
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {userRole === 'ADMIN' ? 'SOC Administrator' : userRole === 'VIEWER' ? 'Executive Auditor' : 'Security Analyst'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {userRole === 'ADMIN' ? 'Full Authority' : userRole === 'VIEWER' ? 'Read-Only View' : 'SOC Tier 2 • Active'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
