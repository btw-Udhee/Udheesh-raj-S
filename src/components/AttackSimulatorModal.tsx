import React, { useState } from 'react';
import { 
  Zap, 
  X, 
  ShieldAlert, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertTriangle, 
  Globe, 
  Users, 
  Crosshair, 
  Activity, 
  Clock, 
  Terminal,
  ExternalLink,
  Flame,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { 
  SIMULATION_SCENARIOS, 
  SimulationScenario, 
  SimulationScenarioId, 
  generateAttackScenarioLogs,
  GeneratedSimulationResult 
} from '../utils/attackSimulator';

interface AttackSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectLogs: (result: GeneratedSimulationResult) => void;
  activeFileName: string;
  onInvestigateIP?: (ip: string) => void;
  onNavigateTab?: (tab: 'dashboard' | 'alerts' | 'map' | 'patterns' | 'cases') => void;
}

export const AttackSimulatorModal: React.FC<AttackSimulatorModalProps> = ({
  isOpen,
  onClose,
  onInjectLogs,
  activeFileName,
  onInvestigateIP,
  onNavigateTab
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<SimulationScenarioId>('SSH_BRUTE_FORCE');
  const [customIP, setCustomIP] = useState<string>('');
  const [eventCount, setEventCount] = useState<number>(8);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamProgress, setStreamProgress] = useState<number>(0);
  const [lastResult, setLastResult] = useState<GeneratedSimulationResult | null>(null);

  if (!isOpen) return null;

  const activeScenario = SIMULATION_SCENARIOS.find(s => s.id === selectedScenarioId) || SIMULATION_SCENARIOS[0];

  const handleRunSimulation = (instant: boolean = true) => {
    const result = generateAttackScenarioLogs(
      selectedScenarioId,
      customIP,
      eventCount,
      activeFileName
    );

    if (instant) {
      onInjectLogs(result);
      setLastResult(result);
    } else {
      // Stepped streaming simulation
      setIsStreaming(true);
      setStreamProgress(0);
      let currentIdx = 0;
      const total = result.rawLogLines.length;

      const interval = setInterval(() => {
        currentIdx++;
        setStreamProgress(Math.round((currentIdx / total) * 100));

        if (currentIdx >= total) {
          clearInterval(interval);
          setIsStreaming(false);
          onInjectLogs(result);
          setLastResult(result);
        }
      }, 350);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-[#0D121F] border border-[#1E293B] rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1E293B] flex items-center justify-between bg-[#0F172A]">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg">
              <Zap className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide uppercase font-mono">
                  Adversary Attack Simulator Suite
                </h2>
                <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  SOC DEMO ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inject realistic multi-vector cyber attack telemetry to test detection, risk scoring, alerts, and containment.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#334155] text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Back to Previous Screen (ESC)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Back</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Scenario Grid */}
          <div>
            <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">
              1. Select Attack Scenario Vector ({SIMULATION_SCENARIOS.length} Presets Available)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SIMULATION_SCENARIOS.map((sc) => {
                const isSelected = sc.id === selectedScenarioId;
                return (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setSelectedScenarioId(sc.id);
                      setEventCount(sc.defaultBurstCount);
                      setCustomIP('');
                    }}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-red-950/40 border-red-500/80 shadow-md shadow-red-950/40'
                        : 'bg-[#131B2E] border-[#1E293B] hover:border-slate-700 hover:bg-[#162038]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <Crosshair className={`w-3.5 h-3.5 ${isSelected ? 'text-red-400' : 'text-slate-500'}`} />
                        {sc.name}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded">
                        {sc.mitreId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {sc.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Category: <strong className="text-slate-300">{sc.category}</strong></span>
                      <span className="text-red-400 font-bold">Risk: {sc.riskScore}/100</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration Parameters */}
          <div className="bg-[#131B2E] border border-[#1E293B] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2.5">
              <span className="text-xs font-mono font-semibold text-slate-300 uppercase">
                2. Attack Parameters & Injection Target
              </span>
              <span className="text-[11px] font-mono text-blue-400">
                Target Log: {activeFileName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-mono">
                  Adversary Source IP:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customIP}
                    placeholder={activeScenario.defaultAttackerIP}
                    onChange={(e) => setCustomIP(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => setCustomIP(activeScenario.defaultAttackerIP)}
                    className="absolute right-2 top-1.5 text-[10px] text-slate-500 hover:text-slate-300 font-mono"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-mono">
                  Event Burst Velocity: <strong className="text-white">{eventCount} events</strong>
                </label>
                <div className="flex items-center gap-2">
                  {[5, 8, 15, 25].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setEventCount(cnt)}
                      className={`flex-1 py-1 rounded text-xs font-mono border transition-colors ${
                        eventCount === cnt
                          ? 'bg-red-600 text-white border-red-500 font-bold'
                          : 'bg-[#0B0E14] text-slate-400 border-[#334155] hover:text-white'
                      }`}
                    >
                      {cnt}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target Account Preview */}
            <div className="text-xs font-mono text-slate-400 flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-slate-500">Target Accounts:</span>
              {activeScenario.defaultTargetUsers.slice(0, 4).map((usr) => (
                <span key={usr} className="px-1.5 py-0.5 rounded bg-[#0B0E14] border border-[#334155] text-slate-300 text-[11px]">
                  {usr}
                </span>
              ))}
              {activeScenario.defaultTargetUsers.length > 4 && (
                <span className="text-slate-500 text-[10px]">
                  +{activeScenario.defaultTargetUsers.length - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Stepped Simulation Progress Indicator */}
          {isStreaming && (
            <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-3.5 space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-mono text-red-200">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-400 animate-spin" />
                  Streaming adversary telemetry in real-time...
                </span>
                <span>{streamProgress}%</span>
              </div>
              <div className="w-full bg-[#0B0E14] h-2 rounded-full overflow-hidden border border-red-500/30">
                <div 
                  className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-300"
                  style={{ width: `${streamProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Recent Simulation Success Result Banner */}
          {lastResult && !isStreaming && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-mono font-bold text-emerald-300">
                    Attack Injected: {lastResult.totalEvents} events parsed from {lastResult.attackerIPs[0]}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Triggered {lastResult.scenario.name} (Risk: {lastResult.primaryRiskScore}/100 • {lastResult.threatSeverity})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onInvestigateIP && (
                  <button
                    onClick={() => {
                      onInvestigateIP(lastResult.attackerIPs[0]);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold transition-colors flex items-center gap-1 shadow"
                  >
                    <span>Investigate IP</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      onNavigateTab('patterns');
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-mono transition-colors"
                  >
                    View Attack Patterns
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0F172A] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Scenario: <strong className="text-white">{activeScenario.name}</strong></span>
            <span className="text-slate-600">•</span>
            <span>MITRE: <strong className="text-red-400">{activeScenario.mitreId}</strong></span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white bg-[#1E293B] hover:bg-slate-800 border border-[#334155] text-xs font-mono transition-colors flex items-center gap-1.5"
              title="Return to previous screen (ESC)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Back</span>
            </button>
            <button
              onClick={() => handleRunSimulation(false)}
              disabled={isStreaming}
              className="px-3.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-slate-200 text-xs font-mono font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Step-by-Step Stream</span>
            </button>
            <button
              onClick={() => handleRunSimulation(true)}
              disabled={isStreaming}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold shadow-lg shadow-red-900/40 transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-white" />
              <span>Launch Instant Attack</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
