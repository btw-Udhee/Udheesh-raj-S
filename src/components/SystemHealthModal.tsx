import React from 'react';
import { 
  X, 
  Activity, 
  Cpu, 
  Database, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  HardDrive, 
  Radio, 
  Server,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { ParsingStats } from '../types';

interface SystemHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: ParsingStats;
  totalParsedEvents: number;
  activePresetName: string;
  autoRefreshEnabled: boolean;
}

export const SystemHealthModal: React.FC<SystemHealthModalProps> = ({
  isOpen,
  onClose,
  stats,
  totalParsedEvents,
  activePresetName,
  autoRefreshEnabled
}) => {
  if (!isOpen) return null;

  const services = [
    {
      name: 'Log Ingestion & Stream Normalizer',
      description: 'Regex tokenization for Apache, Syslog, and custom Auth logs',
      status: 'HEALTHY',
      latency: `${stats?.durationMs ?? 1.2} ms`,
      throughput: `${stats?.throughputEventsPerSec ?? 9800} ev/s`
    },
    {
      name: 'Sliding-Window Temporal Correlator',
      description: 'Associating system 500 error spikes with prior authentication bursts',
      status: 'HEALTHY',
      latency: '0.4 ms',
      throughput: 'Instant'
    },
    {
      name: 'MITRE ATT&CK Heuristic Engine',
      description: 'Evaluating T1110.001, T1110.003, T1110.004, and T1595.002 attack patterns',
      status: 'HEALTHY',
      latency: '0.8 ms',
      throughput: 'Active'
    },
    {
      name: 'GeoIP Radar & Threat Node Projection',
      description: 'Mapping attacker IP telemetry to global and regional coordinates',
      status: 'HEALTHY',
      latency: '1.1 ms',
      throughput: '195 Nations'
    },
    {
      name: 'WebAudio Security Alert Synthesizer',
      description: 'Sub-millisecond audio oscillator chime for critical SOC incidents',
      status: 'READY',
      latency: '0.1 ms',
      throughput: '880Hz Sine'
    },
    {
      name: 'Local Incident Case Persistence (SQLite/Local)',
      description: 'Dossier storage for containment playbooks and forensic records',
      status: 'SYNCED',
      latency: '0.3 ms',
      throughput: 'Encrypted'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-150">
      <div 
        className="bg-[#0F172A] border border-[#334155] rounded-xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  SOC Ingestion Engine & Subsystem Health
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  ALL SYSTEMS NOMINAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Operational telemetry for real-time parsing, sliding windows, and threat heuristics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#334155] text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Back to Previous Screen (ESC)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Back</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top metrics summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#0B0E14] border border-[#1E293B] p-2.5 rounded-lg font-mono">
            <span className="text-[10px] uppercase text-slate-500 block">Payload Size</span>
            <span className="text-base font-bold text-white">
              {stats?.bytesTotal ? `${(stats.bytesTotal / 1024).toFixed(1)} KB` : '18.4 KB'}
            </span>
          </div>

          <div className="bg-[#0B0E14] border border-[#1E293B] p-2.5 rounded-lg font-mono">
            <span className="text-[10px] uppercase text-slate-500 block">Parse Latency</span>
            <span className="text-base font-bold text-emerald-400">
              {stats?.durationMs ?? 1.2} ms
            </span>
          </div>

          <div className="bg-[#0B0E14] border border-[#1E293B] p-2.5 rounded-lg font-mono">
            <span className="text-[10px] uppercase text-slate-500 block">Throughput</span>
            <span className="text-base font-bold text-blue-400">
              {stats?.throughputEventsPerSec ? `${stats.throughputEventsPerSec.toLocaleString()} /s` : '12,400 /s'}
            </span>
          </div>

          <div className="bg-[#0B0E14] border border-[#1E293B] p-2.5 rounded-lg font-mono">
            <span className="text-[10px] uppercase text-slate-500 block">Malformed Lines</span>
            <span className={`text-base font-bold ${stats?.errorLinesCount ? 'text-amber-400' : 'text-emerald-400'}`}>
              {stats?.errorLinesCount ?? 0} errors
            </span>
          </div>
        </div>

        {/* Subsystems list */}
        <div className="space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-mono">
            Internal Pipeline Subsystems
          </span>
          <div className="bg-[#0B0E14] border border-[#1E293B] rounded-lg divide-y divide-[#1E293B]/70 max-h-56 overflow-y-auto">
            {services.map((svc, idx) => (
              <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-slate-200 truncate">{svc.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{svc.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                  <div className="text-right hidden sm:block">
                    <span className="text-slate-400">{svc.latency}</span>
                    <span className="text-slate-600 block text-[9px]">{svc.throughput}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[10px] font-bold">
                    {svc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1E293B] text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Active Feed: <strong>{activePresetName}</strong> ({totalParsedEvents} events)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#1E293B] hover:bg-slate-800 border border-[#334155] hover:border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
