import React, { useState } from 'react';
import { 
  FileCode, 
  Folder, 
  Copy, 
  Check, 
  Play, 
  Terminal, 
  BookOpen, 
  ChevronRight,
  Layers,
  Award,
  Cpu
} from 'lucide-react';
import { PYTHON_PROJECT_STRUCTURE, INTERVIEW_SECTIONS } from '../data/pythonProjectFiles';
import { LogEntry } from '../types';
import { ArchitecturePipelineVisualizer } from './ArchitecturePipelineVisualizer';

interface PythonProjectExplorerProps {
  entries: LogEntry[];
  rawLogContent: string;
  onLaunchSimulator?: () => void;
  onNavigateToTab?: (tab: any) => void;
}

export const PythonProjectExplorer: React.FC<PythonProjectExplorerProps> = ({
  entries,
  rawLogContent,
  onLaunchSimulator,
  onNavigateToTab
}) => {
  const [activeFileId, setActiveFileId] = useState<string>('main.py');
  const [copied, setCopied] = useState(false);
  const [subTab, setSubTab] = useState<'architecture' | 'code' | 'simulator' | 'interview'>('architecture');
  const [simOutput, setSimOutput] = useState<string | null>(null);

  const activeFile = PYTHON_PROJECT_STRUCTURE.find(f => f.name === activeFileId) || PYTHON_PROJECT_STRUCTURE[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // In-browser execution of Step 5 & 6 algorithm from the prompt
  const handleRunPythonSimulation = () => {
    const lines = rawLogContent.split('\n').filter(Boolean);
    const failedLogins: Record<string, number> = {};
    const successLogins: Record<string, number> = {};
    const errors: Record<string, number> = {};
    const logsList: Array<{ timestamp: string; event: string; ip: string }> = [];

    // Step 2 & 3 & 4
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        let timestamp = parts[0] + ' ' + (parts[1] || '');
        let event = parts[2] || '';
        let ip = parts[3] || '';

        // Check if syslog or alternative format
        if (line.includes('LOGIN_FAILED')) event = 'LOGIN_FAILED';
        if (line.includes('LOGIN_SUCCESS')) event = 'LOGIN_SUCCESS';
        if (line.includes('ERROR')) event = 'ERROR';

        const ipMatch = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
        if (ipMatch) ip = ipMatch[1];

        logsList.push({ timestamp, event, ip });

        // Step 5: Counting Failed Attempts using Python Dictionary
        if (event === 'LOGIN_FAILED' && ip) {
          failedLogins[ip] = (failedLogins[ip] || 0) + 1;
        } else if (event === 'LOGIN_SUCCESS' && ip) {
          successLogins[ip] = (successLogins[ip] || 0) + 1;
        } else if (event === 'ERROR') {
          errors[ip || 'unknown'] = (errors[ip || 'unknown'] || 0) + 1;
        }
      }
    }

    let output = `[user@cyber-lab ~]$ python3 cybersecurity-log-analyzer/main.py\n`;
    output += `[+] Ingesting: logs/sample.log\n`;
    output += `[+] Total lines read: ${lines.length}\n`;
    output += `--------------------------------------------------\n`;
    output += `--- Log Analysis Summary ---\n`;
    output += `Total Logs Processed : ${lines.length}\n`;
    output += `Failed Logins Count  : ${Object.values(failedLogins).reduce((a, b) => a + b, 0)}\n`;
    output += `Successful Logins    : ${Object.values(successLogins).reduce((a, b) => a + b, 0)}\n\n`;

    output += `--- Failed Logins Dictionary State (Step 5) ---\n`;
    output += JSON.stringify(failedLogins, null, 2) + '\n\n';

    output += `--- Detection Engine Output (Step 6) ---\n`;
    let alertsCount = 0;
    for (const [ip, count] of Object.entries(failedLogins)) {
      if (count >= 5) {
        alertsCount++;
        output += `🚨 ALERT!\n`;
        output += `IP: ${ip}\n`;
        output += `Failed Login Attempts: ${count}\n`;
        output += `Risk Level: ${count >= 10 ? 'HIGH' : 'MEDIUM'}\n`;
        output += `Rule: More than 5 failed attempts -> Suspicious\n`;
        output += `Action: Firewall DROP recommendation sent to iptables\n\n`;
      }
    }

    if (alertsCount === 0) {
      output += `[OK] No hosts exceeded the 5-attempt threshold.\n`;
    }

    output += `[+] Analysis run finished with code 0.\n`;
    setSimOutput(output);
  };

  return (
    <div className="space-y-4">
      {/* Subnav Tabs */}
      <div className="flex items-center justify-between border-b border-[#334155] pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSubTab('architecture')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              subTab === 'architecture'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-400 hover:text-white bg-[#111827] border border-[#1E293B]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Architecture & Pipeline</span>
          </button>

          <button
            onClick={() => setSubTab('code')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              subTab === 'code'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-400 hover:text-white bg-[#111827] border border-[#1E293B]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Python Source Files</span>
          </button>

          <button
            onClick={() => {
              setSubTab('simulator');
              if (!simOutput) handleRunPythonSimulation();
            }}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              subTab === 'simulator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-400 hover:text-white bg-[#111827] border border-[#1E293B]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>In-Browser Python CLI</span>
          </button>

          <button
            onClick={() => setSubTab('interview')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              subTab === 'interview'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-400 hover:text-white bg-[#111827] border border-[#1E293B]'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Placement Interview Q&A</span>
          </button>
        </div>

        <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
          cybersecurity-log-analyzer/ (Levels 1–4)
        </span>
      </div>

      {/* 0. ARCHITECTURE PIPELINE VISUALIZER SUBTAB */}
      {subTab === 'architecture' && (
        <ArchitecturePipelineVisualizer 
          onLaunchSimulator={onLaunchSimulator}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {/* 1. CODE EXPLORER SUBTAB */}
      {subTab === 'code' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#111827] border border-[#334155] rounded-lg p-4">
          {/* File Tree (3 cols) */}
          <div className="md:col-span-4 bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 pb-2 border-b border-[#1E293B]">
              <Folder className="w-4 h-4 text-blue-400" />
              <span>cybersecurity-log-analyzer/</span>
            </div>

            <div className="space-y-1 font-mono text-xs">
              {PYTHON_PROJECT_STRUCTURE.map(file => (
                <button
                  key={file.name}
                  onClick={() => setActiveFileId(file.name)}
                  className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors ${
                    activeFileId === file.name
                      ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{file.name}</span>
                  <span className="text-[9px] text-slate-500 uppercase">{file.language}</span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-[#1E293B] text-[10px] text-slate-500 font-sans">
              <p className="font-semibold text-slate-400 mb-1">File Purpose:</p>
              <p>{activeFile.description}</p>
            </div>
          </div>

          {/* Code Viewer (8 cols) */}
          <div className="md:col-span-8 bg-black border border-[#334155] rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-2 bg-[#1E293B] flex items-center justify-between border-b border-[#334155]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-white font-bold">{activeFile.name}</span>
                <span className="text-[10px] font-mono text-slate-400">({activeFile.language})</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-300 hover:text-white bg-[#0F172A] hover:bg-slate-800 px-2 py-1 rounded border border-[#334155] transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 font-mono text-[11px] text-green-400/90 overflow-x-auto max-h-[500px] leading-relaxed select-text">
              <code>{activeFile.code}</code>
            </pre>
          </div>
        </div>
      )}

      {/* 2. IN-BROWSER PYTHON SIMULATOR */}
      {subTab === 'simulator' && (
        <div className="bg-black border border-[#334155] rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-[#1E293B] flex items-center justify-between border-b border-[#334155]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">
                PYTHON_VIRTUALENV: /bin/python3 main.py
              </span>
            </div>
            <button
              onClick={handleRunPythonSimulation}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs px-3 py-1 rounded shadow-sm transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Re-run Simulation</span>
            </button>
          </div>

          <pre className="p-5 font-mono text-xs text-green-400 bg-black min-h-[380px] overflow-y-auto leading-relaxed select-text whitespace-pre-wrap">
            {simOutput || 'Click "Re-run Simulation" to execute the Python detection script on current log content.'}
          </pre>
        </div>
      )}

      {/* 3. INTERVIEW QUESTIONS & TALKING POINTS */}
      {subTab === 'interview' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#111827] border border-[#334155] rounded-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
              Placement & Interview Master Script
            </h3>
            <p className="text-xs text-slate-400">
              Structured responses for engineering and cybersecurity technical interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTERVIEW_SECTIONS.map((item, index) => (
              <div 
                key={index}
                className="bg-[#111827] border border-[#334155] rounded-lg p-5 space-y-2 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 border border-blue-700/50 flex items-center justify-center text-[10px] font-mono font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-7 whitespace-pre-line font-mono">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
