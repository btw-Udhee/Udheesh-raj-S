import React, { useState } from 'react';
import { SlidersHorizontal, Eye, EyeOff, RotateCcw, Check, LayoutGrid, X, ArrowLeft } from 'lucide-react';
import { DashboardWidgetConfig } from '../types';

interface DashboardWidgetCustomizerProps {
  widgets: DashboardWidgetConfig[];
  onToggleWidget: (id: string) => void;
  onResetWidgets: () => void;
}

export const DashboardWidgetCustomizer: React.FC<DashboardWidgetCustomizerProps> = ({
  widgets,
  onToggleWidget,
  onResetWidgets
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-[#334155] bg-[#0F172A] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        title="Customize visible dashboard widgets"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden sm:inline">Customize Widgets</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
          {widgets.filter(w => w.visible).length}/{widgets.length}
        </span>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-8 mt-1 w-72 sm:w-80 bg-[#0F172A] border border-[#334155] rounded-xl shadow-2xl p-3 z-30 font-sans animate-in fade-in zoom-in-95 duration-100"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#1E293B] mb-2.5">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                Dashboard Widgets
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onResetWidgets}
                className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                title="Reset widgets to default layout"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-2 py-0.5 rounded bg-[#1E293B] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#334155] text-[10px] font-mono flex items-center gap-1 transition-colors"
                title="Back / Close"
              >
                <ArrowLeft className="w-3 h-3 text-blue-400" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-0.5"
                aria-label="Close widget panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {widgets.map(widget => (
              <button
                key={widget.id}
                onClick={() => onToggleWidget(widget.id)}
                className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-colors ${
                  widget.visible
                    ? 'bg-[#0B0E14] border-blue-500/40 text-slate-200'
                    : 'bg-[#0B0E14]/50 border-[#1E293B] text-slate-500 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span>{widget.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {widget.description}
                  </div>
                </div>

                <div className="shrink-0">
                  {widget.visible ? (
                    <span className="p-1 rounded bg-blue-500/20 text-blue-400 inline-flex">
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="p-1 rounded bg-slate-800 text-slate-500 inline-flex">
                      <EyeOff className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#1E293B] text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3 text-blue-400" />
              <span>Back to View</span>
            </button>
            <span className="text-emerald-400 font-bold">Auto-Saved</span>
          </div>
        </div>
      )}
    </div>
  );
};
