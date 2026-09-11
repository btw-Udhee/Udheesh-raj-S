import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  FileCode,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { SAMPLE_LOG_PRESETS } from '../data/sampleLogs';

interface FileUploadModalProps {
  onClose: () => void;
  onLoadLogContent: (content: string, fileName: string) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  onClose,
  onLoadLogContent
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [customFileName, setCustomFileName] = useState('custom.log');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onLoadLogContent(content, file.name);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleLoadPasted = () => {
    if (!pastedText.trim()) return;
    onLoadLogContent(pastedText, customFileName || 'manual_entry.log');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0F172A] border border-[#334155] rounded-xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-5 overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1E293B] rounded border border-[#334155]">
              <Upload className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Upload or Ingest Log Source
              </h3>
              <p className="text-[11px] text-slate-400">
                Supports server.log, access.log, auth.log, or plain text
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
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-950/20'
              : 'border-[#334155] hover:border-slate-400 bg-[#0B0E14]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".log,.txt,.json,.csv"
            className="hidden"
          />
          <FileText className="w-7 h-7 text-blue-400 mx-auto mb-2 opacity-80" />
          <div className="text-xs font-semibold text-slate-200">
            Drag and drop log file here, or <span className="text-blue-400 underline">browse files</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Accepts UTF-8 encoded text logs (.log, .txt, .csv)
          </div>
        </div>

        {/* Paste Raw Logs Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              Or Paste Raw Log Stream:
            </label>
            <input
              type="text"
              placeholder="Filename (e.g. server.log)"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              className="bg-[#0B0E14] border border-[#334155] text-slate-300 text-[11px] rounded px-2 py-0.5 w-36 font-mono focus:border-blue-500"
            />
          </div>
          <textarea
            rows={4}
            placeholder={`2026-09-01 10:00:01 LOGIN_SUCCESS 192.168.1.5\n2026-09-01 10:01:15 LOGIN_FAILED 192.168.1.10...`}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="w-full bg-[#0B0E14] border border-[#334155] rounded-lg p-3 text-slate-300 font-mono text-xs focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
          />
        </div>

        {/* Built-in Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Built-in Test Attack Scenarios:</span>
          </span>
          <div className="grid grid-cols-2 gap-2 font-mono">
            {SAMPLE_LOG_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onLoadLogContent(preset.content, preset.fileName);
                  onClose();
                }}
                className="text-left p-2 rounded bg-[#0B0E14] hover:bg-slate-800 border border-[#1E293B] hover:border-[#334155] transition-colors flex items-center justify-between"
              >
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 truncate">{preset.name}</div>
                  <div className="text-[10px] text-slate-500">{preset.fileName}</div>
                </div>
                <span className="text-[9px] bg-blue-900/40 text-blue-400 border border-blue-800/40 px-1.5 py-0.5 rounded shrink-0 ml-1">
                  Load
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-slate-300 hover:text-white bg-[#1E293B] hover:bg-slate-800 border border-[#334155] text-xs font-mono transition-colors flex items-center gap-1.5"
            title="Return to previous screen (ESC)"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>Back</span>
          </button>
          <button
            onClick={handleLoadPasted}
            disabled={!pastedText.trim()}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition-colors"
          >
            Analyze Pasted Logs
          </button>
        </div>
      </div>
    </div>
  );
};
