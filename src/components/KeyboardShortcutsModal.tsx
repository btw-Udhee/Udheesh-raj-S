import React from 'react';
import { X, Keyboard, Command, Zap, Volume2, RefreshCw, ShieldAlert, ArrowLeft } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Global SOC Operations',
      shortcuts: [
        { keys: ['⌘', 'K'], label: 'Open Global Command & Search Palette' },
        { keys: ['S'], label: 'Launch Adversary Attack Simulator' },
        { keys: ['M'], label: 'Toggle Security Alert Audio Chimes (Mute / Unmute)' },
        { keys: ['R'], label: 'Trigger Immediate Log Re-Scan' },
        { keys: ['Alt', '←'], label: 'Navigate Back to Previous Tab / Screen' },
        { keys: ['?'], label: 'Open Keyboard Shortcuts Cheatsheet' },
        { keys: ['ESC'], label: 'Close Active Modal / Forensic Drawer' }
      ]
    },
    {
      title: 'Direct Tab Navigation',
      shortcuts: [
        { keys: ['1'], label: 'Threat Overview Dashboard' },
        { keys: ['2'], label: 'Live Threat Radar Map' },
        { keys: ['3'], label: 'Attack Pattern Detection Engine' },
        { keys: ['4'], label: 'Incident Cases & Containment' },
        { keys: ['5'], label: 'Raw Telemetry Stream & Log Explorer' },
        { keys: ['6'], label: 'Security Alerts & IOC Tables' },
        { keys: ['7'], label: 'Correlation Analyzer (500 ↔ Auth)' },
        { keys: ['8'], label: 'Forensic Reports & Database Audit' },
        { keys: ['9'], label: 'Architecture Pipeline & Interview Guide' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-150">
      <div 
        className="bg-[#0F172A] border border-[#334155] rounded-xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                SOC Analyst Keyboard Shortcuts
              </h3>
              <p className="text-xs text-slate-400">
                Quick-access hotkeys for rapid incident response & navigation
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

        {/* Shortcuts list */}
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                {group.title}
              </span>
              <div className="bg-[#0B0E14] border border-[#1E293B] rounded-lg divide-y divide-[#1E293B]/70 overflow-hidden">
                {group.shortcuts.map((s, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="text-slate-300 font-medium">{s.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, kIdx) => (
                        <kbd 
                          key={kIdx} 
                          className="px-2 py-0.5 rounded bg-[#1E293B] text-slate-200 border border-[#334155] font-mono text-[11px] font-bold shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1E293B] text-[11px] text-slate-500 font-mono">
          <span>Press <kbd className="text-slate-300 bg-slate-800 px-1 py-0.2 rounded">ESC</kbd> anytime to dismiss</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            title="Return to previous screen (ESC)"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-white" />
            <span>Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};
