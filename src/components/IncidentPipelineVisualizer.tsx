import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldAlert, 
  Cpu, 
  Gauge, 
  GitMerge, 
  AlertOctagon, 
  FileSearch, 
  BookOpen, 
  Crosshair, 
  Terminal, 
  CheckCircle2, 
  FileText, 
  ArrowDown, 
  ArrowRight, 
  Play, 
  RotateCcw, 
  ChevronRight, 
  ExternalLink, 
  Lock, 
  Check, 
  Copy, 
  Download, 
  Sparkles,
  Layers,
  User,
  Clock,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { IncidentCase, LogEntry, DetectionRules, UserRole } from '../types';

export type PipelineStageId = 
  | 'SECURITY_EVENT'
  | 'DETECTION_ENGINE'
  | 'RISK_SCORING'
  | 'ALERT_CORRELATION'
  | 'INCIDENT'
  | 'EVIDENCE'
  | 'ATTACK_STORY'
  | 'IOCS'
  | 'PLAYBOOK'
  | 'ANALYST_DECISION'
  | 'SIMULATED_RESPONSE'
  | 'VERIFICATION'
  | 'RESOLVED'
  | 'INCIDENT_REPORT';

interface PipelineStageConfig {
  id: PipelineStageId;
  label: string;
  shortLabel: string;
  category: 'DETECTION' | 'TRIAGE' | 'ANALYSIS' | 'RESPONSE' | 'CLOSURE';
  icon: React.ElementType;
  description: string;
}

const PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    id: 'SECURITY_EVENT',
    label: 'Security Event',
    shortLabel: 'Event',
    category: 'DETECTION',
    icon: Activity,
    description: 'Raw telemetry ingestion, structured tokenization, and metadata normalization.'
  },
  {
    id: 'DETECTION_ENGINE',
    label: 'Detection Engine',
    shortLabel: 'Detection',
    category: 'DETECTION',
    icon: Cpu,
    description: 'Signature pattern matching, behavioral heuristics, and threshold policies.'
  },
  {
    id: 'RISK_SCORING',
    label: 'Risk Scoring',
    shortLabel: 'Risk Score',
    category: 'DETECTION',
    icon: Gauge,
    description: 'Weighted threat calculation (0–100) based on velocity, failed ratio, and target tier.'
  },
  {
    id: 'ALERT_CORRELATION',
    label: 'Alert Correlation',
    shortLabel: 'Correlation',
    category: 'TRIAGE',
    icon: GitMerge,
    description: 'Temporal cross-referencing between auth failure bursts and 5xx backend server exceptions.'
  },
  {
    id: 'INCIDENT',
    label: 'Incident Creation',
    shortLabel: 'Incident',
    category: 'TRIAGE',
    icon: AlertOctagon,
    description: 'Consolidation of correlated alerts into a formal SOC investigation case.'
  },
  {
    id: 'EVIDENCE',
    label: 'Evidence Locker',
    shortLabel: 'Evidence',
    category: 'ANALYSIS',
    icon: FileSearch,
    description: 'Raw logs, audit timestamps, payload strings, and target service attributes.'
  },
  {
    id: 'ATTACK_STORY',
    label: 'Attack Story',
    shortLabel: 'Story',
    category: 'ANALYSIS',
    icon: BookOpen,
    description: 'Chronological reconstruction of adversary tactics from initial access to objective.'
  },
  {
    id: 'IOCS',
    label: 'Indicators of Compromise',
    shortLabel: 'IOCs',
    category: 'ANALYSIS',
    icon: Crosshair,
    description: 'Attacker IP coordinates, ASN, user targets, probed URIs, and signatures.'
  },
  {
    id: 'PLAYBOOK',
    label: 'Playbook Selection',
    shortLabel: 'Playbook',
    category: 'RESPONSE',
    icon: Layers,
    description: 'Standard Operating Procedure (SOP) workflow selection based on NIST SP 800-61.'
  },
  {
    id: 'ANALYST_DECISION',
    label: 'Analyst Decision',
    shortLabel: 'Decision',
    category: 'RESPONSE',
    icon: User,
    description: 'Human-in-the-loop triage: Confirm True Positive, Escalate, or Mitigate.'
  },
  {
    id: 'SIMULATED_RESPONSE',
    label: 'Simulated Response',
    shortLabel: 'Response',
    category: 'RESPONSE',
    icon: Terminal,
    description: 'Automated perimeter containment: iptables firewall drop, token revocation, rate limiting.'
  },
  {
    id: 'VERIFICATION',
    label: 'Post-Mitigation Verification',
    shortLabel: 'Verification',
    category: 'RESPONSE',
    icon: CheckCircle2,
    description: 'Active telemetry confirmation: Zero incoming unauthorized packets from blocked origin.'
  },
  {
    id: 'RESOLVED',
    label: 'Resolved & Closed',
    shortLabel: 'Resolved',
    category: 'CLOSURE',
    icon: ShieldAlert,
    description: 'Incident ticket formal closure, root-cause categorization, and MTTD/MTTR recording.'
  },
  {
    id: 'INCIDENT_REPORT',
    label: 'Incident Report',
    shortLabel: 'Report',
    category: 'CLOSURE',
    icon: FileText,
    description: 'Executive forensic brief compilation, CSV/JSON export, and compliance post-mortem.'
  }
];

interface IncidentPipelineVisualizerProps {
  cases: IncidentCase[];
  activeCaseId?: string;
  onSelectCase?: (caseId: string) => void;
  onExecuteContainment?: (caseId: string, actionId: string) => void;
  onResolveCase?: (caseId: string) => void;
  onBlockIP?: (ip: string) => void;
  blockedIPs?: string[];
  logs?: LogEntry[];
  rules?: DetectionRules;
  userRole?: UserRole;
}

export const IncidentPipelineVisualizer: React.FC<IncidentPipelineVisualizerProps> = ({
  cases,
  activeCaseId,
  onSelectCase,
  onExecuteContainment,
  onResolveCase,
  onBlockIP,
  blockedIPs = [],
  logs = [],
  rules,
  userRole = 'ANALYST'
}) => {
  // Current selected case
  const selectedCase = useMemo(() => {
    if (activeCaseId) {
      const found = cases.find(c => c.id === activeCaseId);
      if (found) return found;
    }
    return cases[0] || null;
  }, [cases, activeCaseId]);

  // Active Stage in pipeline
  const [activeStageId, setActiveStageId] = useState<PipelineStageId>('SECURITY_EVENT');
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Auto-play stepper effect
  useEffect(() => {
    if (!isPlaying) return;
    const stageIds: PipelineStageId[] = [
      'SECURITY_EVENT',
      'DETECTION_ENGINE',
      'RISK_SCORING',
      'ALERT_CORRELATION',
      'INCIDENT',
      'EVIDENCE',
      'ATTACK_STORY',
      'IOCS',
      'PLAYBOOK',
      'ANALYST_DECISION',
      'SIMULATED_RESPONSE',
      'VERIFICATION',
      'RESOLVED',
      'INCIDENT_REPORT'
    ];
    const currentIndex = stageIds.indexOf(activeStageId);
    if (currentIndex >= stageIds.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setActiveStageId(stageIds[currentIndex + 1]);
    }, 1800);

    return () => clearTimeout(timer);
  }, [isPlaying, activeStageId]);

  // Handle copy
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Associated logs for this case
  const caseLogs = useMemo(() => {
    if (!selectedCase) return logs.slice(0, 5);
    const matched = logs.filter(l => l.ip === selectedCase.primaryIP);
    return matched.length > 0 ? matched : logs.slice(0, 5);
  }, [logs, selectedCase]);

  // Derived state values
  const isIPBlocked = selectedCase ? blockedIPs.includes(selectedCase.primaryIP) : false;

  return (
    <div className="space-y-6">
      {/* Top Header & Pipeline Overview */}
      <div className="bg-[#0B0E14] border border-[#1E293B] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-base font-bold text-white tracking-wide uppercase font-mono">
                SOC Incident Response Lifecycle Pipeline
              </h2>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                NIST SP 800-61 / SANS SEC504
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Step-by-step verification pipeline mapping raw telemetry through automated detection, algorithmic risk scoring, multi-log correlation, tri-fold investigation, response playbook execution, and formal executive resolution.
            </p>
          </div>

          {/* Stepper Controls & Case Selector */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {cases.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs font-mono">Active Case:</span>
                <select
                  value={selectedCase?.id || ''}
                  onChange={(e) => onSelectCase && onSelectCase(e.target.value)}
                  className="bg-[#0F172A] border border-[#334155] text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                >
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.caseNumber} - {c.title.slice(0, 24)}...
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold font-mono transition-colors shadow-sm ${
                isPlaying 
                  ? 'bg-amber-500 hover:bg-amber-400 text-black' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  Pause Walkthrough
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Auto-Play Pipeline
                </>
              )}
            </button>

            <button
              onClick={() => {
                setActiveStageId('SECURITY_EVENT');
                setIsPlaying(false);
              }}
              className="px-2.5 py-1.5 rounded bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors border border-[#334155]"
              title="Reset to Stage 1"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Pipeline Architecture Diagram Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Visual Lifecycle Flowchart */}
        <div className="xl:col-span-5 bg-[#0B0E14] border border-[#1E293B] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E293B]">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Pipeline Flow Architecture
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Click any stage to inspect
              </span>
            </div>

            {/* FLOW NODES CONTAINER */}
            <div className="flex flex-col items-center space-y-2 py-2">
              {/* STAGE 1: SECURITY EVENT */}
              <StageNodeButton 
                stage={PIPELINE_STAGES[0]} 
                isActive={activeStageId === 'SECURITY_EVENT'} 
                onClick={() => setActiveStageId('SECURITY_EVENT')} 
              />
              <ArrowDown className="w-3.5 h-3.5 text-slate-600" />

              {/* STAGE 2: DETECTION ENGINE */}
              <StageNodeButton 
                stage={PIPELINE_STAGES[1]} 
                isActive={activeStageId === 'DETECTION_ENGINE'} 
                onClick={() => setActiveStageId('DETECTION_ENGINE')} 
              />
              <ArrowDown className="w-3.5 h-3.5 text-slate-600" />

              {/* STAGE 3: RISK SCORING */}
              <StageNodeButton 
                stage={PIPELINE_STAGES[2]} 
                isActive={activeStageId === 'RISK_SCORING'} 
                onClick={() => setActiveStageId('RISK_SCORING')} 
              />
              <ArrowDown className="w-3.5 h-3.5 text-slate-600" />

              {/* STAGE 4: ALERT CORRELATION */}
              <StageNodeButton 
                stage={PIPELINE_STAGES[3]} 
                isActive={activeStageId === 'ALERT_CORRELATION'} 
                onClick={() => setActiveStageId('ALERT_CORRELATION')} 
              />
              <ArrowDown className="w-3.5 h-3.5 text-slate-600" />

              {/* STAGE 5: INCIDENT */}
              <StageNodeButton 
                stage={PIPELINE_STAGES[4]} 
                isActive={activeStageId === 'INCIDENT'} 
                onClick={() => setActiveStageId('INCIDENT')} 
                highlightColor="amber"
              />
              <ArrowDown className="w-3.5 h-3.5 text-slate-600" />

              {/* TRI-FOLD BRANCH: EVIDENCE / ATTACK STORY / IOCS */}
              <div className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg p-2.5 my-1">
                <div className="text-[10px] text-center font-mono text-slate-400 mb-2 uppercase tracking-wider font-semibold">
                  ┌── Tri-Fold Investigation Triage ──┐
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <StageNodeButton 
                    stage={PIPELINE_STAGES[5]} // EVIDENCE
                    isActive={activeStageId === 'EVIDENCE'} 
                    onClick={() => setActiveStageId('EVIDENCE')} 
                    isCompact
                  />
                  <StageNodeButton 
                    stage={PIPELINE_STAGES[6]} // ATTACK_STORY
                    isActive={activeStageId === 'ATTACK_STORY'} 
                    onClick={() => setActiveStageId('ATTACK_STORY')} 
                    isCompact
                  />
                  <StageNodeButton 
                    stage={PIPELINE_STAGES[7]} // IOCS
                    isActive={activeStageId === 'IOCS'} 
                    onClick={() => setActiveStageId('IOCS')} 
                    isCompact
                  />
                </div>
                <div className="text-[10px] text-center font-mono text-slate-600 mt-1">
                  └── Consolidated Incident Context ──┘
                </div>
              </div>
              <ArrowDown className="w-3.5 h-3.5 text-slate-600" />

              {/* STAGE 7: PLAYBOOK */}
              <StageNodeButton 
                stage={PIPELINE_STAGES[8]} 
                isActive={activeStageId === 'PLAYBOOK'} 
                onClick={() => setActiveStageId('PLAYBOOK')} 
              />
              <ArrowDown className="w-3.5 h-3.5 text-slate-600" />

              {/* STAGE 8: ANALYST DECISION */}
              <StageNodeButton 
                stage={PIPELINE_STAGES[9]} 
                isActive={activeStageId === 'ANALYST_DECISION'} 
                onClick={() => setActiveStageId('ANALYST_DECISION')} 
                highlightColor="purple"
              />
              <ArrowDown className="w-3.5 h-3.5 text-slate-600" />

              {/* STAGE 9: SIMULATED RESPONSE */}
              <StageNodeButton 
                stage={PIPELINE_STAGES[10]} 
                isActive={activeStageId === 'SIMULATED_RESPONSE'} 
                onClick={() => setActiveStageId('SIMULATED_RESPONSE')} 
                highlightColor="cyan"
              />
              <ArrowDown className="w-3.5 h-3.5 text-slate-600" />

              {/* STAGE 10: VERIFICATION */}
              <StageNodeButton 
                stage={PIPELINE_STAGES[11]} 
                isActive={activeStageId === 'VERIFICATION'} 
                onClick={() => setActiveStageId('VERIFICATION')} 
                highlightColor="emerald"
              />
              <ArrowDown className="w-3.5 h-3.5 text-slate-600" />

              {/* STAGE 11: RESOLVED */}
              <StageNodeButton 
                stage={PIPELINE_STAGES[12]} 
                isActive={activeStageId === 'RESOLVED'} 
                onClick={() => setActiveStageId('RESOLVED')} 
                highlightColor="emerald"
              />
              <ArrowDown className="w-3.5 h-3.5 text-slate-600" />

              {/* STAGE 12: INCIDENT REPORT */}
              <StageNodeButton 
                stage={PIPELINE_STAGES[13]} 
                isActive={activeStageId === 'INCIDENT_REPORT'} 
                onClick={() => setActiveStageId('INCIDENT_REPORT')} 
                highlightColor="blue"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E293B] text-[11px] text-slate-500 font-mono text-center">
            Standard: NIST SP 800-61 Rev 2 Computer Security Incident Handling Guide
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Stage Deep-Dive Inspector */}
        <div className="xl:col-span-7 space-y-4">
          {/* Active Stage Header Card */}
          <div className="bg-[#0B0E14] border border-[#1E293B] rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#1E293B] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {React.createElement(
                    PIPELINE_STAGES.find(s => s.id === activeStageId)?.icon || Activity,
                    { className: 'w-5 h-5' }
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-blue-400 font-mono uppercase tracking-wider font-semibold">
                      Pipeline Stage {PIPELINE_STAGES.findIndex(s => s.id === activeStageId) + 1} of 14
                    </span>
                    <span className="text-[10px] bg-[#1E293B] text-slate-400 px-1.5 py-0.2 rounded font-mono">
                      {PIPELINE_STAGES.find(s => s.id === activeStageId)?.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {PIPELINE_STAGES.find(s => s.id === activeStageId)?.label}
                  </h3>
                </div>
              </div>

              {/* Navigation stepper buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  disabled={PIPELINE_STAGES.findIndex(s => s.id === activeStageId) === 0}
                  onClick={() => {
                    const idx = PIPELINE_STAGES.findIndex(s => s.id === activeStageId);
                    if (idx > 0) setActiveStageId(PIPELINE_STAGES[idx - 1].id);
                  }}
                  className="px-2 py-1 rounded bg-[#1E293B] hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-mono transition-colors"
                >
                  ← Prev
                </button>
                <button
                  disabled={PIPELINE_STAGES.findIndex(s => s.id === activeStageId) === PIPELINE_STAGES.length - 1}
                  onClick={() => {
                    const idx = PIPELINE_STAGES.findIndex(s => s.id === activeStageId);
                    if (idx < PIPELINE_STAGES.length - 1) setActiveStageId(PIPELINE_STAGES[idx + 1].id);
                  }}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs font-mono font-semibold transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {PIPELINE_STAGES.find(s => s.id === activeStageId)?.description}
            </p>

            {/* DYNAMIC STAGE CONTENT CONTAINER */}
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-4">
              {/* 1. SECURITY EVENT */}
              {activeStageId === 'SECURITY_EVENT' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Raw Ingested Log Telemetry</span>
                    <span className="text-emerald-400 text-[11px]">Normalized & Parsed</span>
                  </div>
                  <div className="p-3 bg-black/60 rounded border border-slate-800 text-slate-300 space-y-1 overflow-x-auto text-[11px]">
                    {caseLogs.slice(0, 3).map((l, i) => (
                      <div key={i} className="text-slate-400 font-mono">
                        <span className="text-blue-400">{l.timestamp}</span> | IP: <span className="text-amber-400">{l.ip}</span> | User: <span className="text-purple-400">{l.user || 'root'}</span> | <span className="text-red-400">{l.event}</span>: {l.message || 'Authentication failed'}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="bg-[#0B0E14] p-2 rounded border border-[#1E293B]">
                      <span className="text-[10px] text-slate-500 block">Parser Mode</span>
                      <span className="font-semibold text-white">Universal Regex</span>
                    </div>
                    <div className="bg-[#0B0E14] p-2 rounded border border-[#1E293B]">
                      <span className="text-[10px] text-slate-500 block">Source IP</span>
                      <span className="font-semibold text-amber-400">{selectedCase?.primaryIP || '198.51.100.42'}</span>
                    </div>
                    <div className="bg-[#0B0E14] p-2 rounded border border-[#1E293B]">
                      <span className="text-[10px] text-slate-500 block">Target Service</span>
                      <span className="font-semibold text-white">SSHD / Web Auth</span>
                    </div>
                    <div className="bg-[#0B0E14] p-2 rounded border border-[#1E293B]">
                      <span className="text-[10px] text-slate-500 block">Timestamp Precision</span>
                      <span className="font-semibold text-emerald-400">ISO-8601 Millis</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. DETECTION ENGINE */}
              {activeStageId === 'DETECTION_ENGINE' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Signature & Heuristic Matching</span>
                    <span className="text-blue-400 text-[11px]">Policy Rule Applied</span>
                  </div>
                  <div className="p-3 bg-black/60 rounded border border-slate-800 text-slate-300 space-y-1.5 text-[11px]">
                    <div className="text-emerald-400">
                      MATCH [RULE-AUTH-01]: Failed logins from single IP exceeded threshold &gt; {rules?.failedLoginThreshold || 5} attempts.
                    </div>
                    <div className="text-purple-300">
                      MATCH [MITRE-T1110.001]: High-frequency authentication velocity (12 attempts/min).
                    </div>
                    <div className="text-amber-400">
                      MATCH [USER-PRIV]: Targeted privileged user accounts ('root', 'admin').
                    </div>
                  </div>
                  <div className="bg-[#0B0E14] p-3 rounded border border-[#1E293B] space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Detection Logic Specification</span>
                    <code className="text-slate-300 text-[11px] block">
                      if (event == "LOGIN_FAILED" && count(ip, window="5m") &gt;= threshold) trigger_alert()
                    </code>
                  </div>
                </div>
              )}

              {/* 3. RISK SCORING */}
              {activeStageId === 'RISK_SCORING' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Algorithmic Severity Calculation</span>
                    <span className="text-red-400 font-bold text-sm">
                      Score: {selectedCase?.riskScore || 92} / 100 ({selectedCase?.severity || 'CRITICAL'})
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${selectedCase?.riskScore || 92}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="bg-[#0B0E14] p-2 rounded border border-[#1E293B]">
                        <span className="text-slate-500 block">Failure Velocity</span>
                        <span className="text-red-400 font-bold">+45 pts</span>
                      </div>
                      <div className="bg-[#0B0E14] p-2 rounded border border-[#1E293B]">
                        <span className="text-slate-500 block">Privileged Targets</span>
                        <span className="text-orange-400 font-bold">+30 pts</span>
                      </div>
                      <div className="bg-[#0B0E14] p-2 rounded border border-[#1E293B]">
                        <span className="text-slate-500 block">Zero Success Ratio</span>
                        <span className="text-yellow-400 font-bold">+17 pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. ALERT CORRELATION */}
              {activeStageId === 'ALERT_CORRELATION' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Temporal Cross-Log Correlation (ERROR ↔ LOGIN_FAILED)</span>
                    <span className="text-cyan-400 text-[11px]">Sliding Window: 60s</span>
                  </div>
                  <div className="p-3 bg-black/60 rounded border border-slate-800 text-slate-300 text-[11px] space-y-1.5">
                    <div className="text-slate-400">
                      [T - 12s] IP {selectedCase?.primaryIP} flooded 18 failed logins against SSH/Auth endpoint.
                    </div>
                    <div className="text-red-400 font-bold">
                      [T + 0s] System Exception: <span className="text-white">DB_CONNECTION_POOL_EXHAUSTED</span> (HTTP 500)
                    </div>
                    <div className="text-emerald-400">
                      Correlation Result: <span className="underline">CONFIRMED CAUSAL LINK</span>. Auth flood induced backend crash.
                    </div>
                  </div>
                </div>
              )}

              {/* 5. INCIDENT */}
              {activeStageId === 'INCIDENT' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Incident Escalation Ticket</span>
                    <span className="text-amber-400 font-bold">{selectedCase?.caseNumber || 'CASE-2026-081'}</span>
                  </div>
                  <div className="bg-[#0B0E14] p-3 rounded border border-amber-500/30 space-y-2">
                    <div className="text-sm font-bold text-white">{selectedCase?.title || 'Distributed SSH Brute-Force & DB Exhaustion'}</div>
                    <p className="text-slate-300 text-[11px] font-sans">{selectedCase?.summary || 'Sustained adversarial brute-force campaign observed from suspicious external host.'}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-500/40 font-bold">SEVERITY: {selectedCase?.severity || 'CRITICAL'}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-500/40">STATUS: {selectedCase?.status || 'INVESTIGATING'}</span>
                      <span className="px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-500/40">ANALYST: {selectedCase?.assignedAnalyst || 'Tier-2 Analyst'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 6A. EVIDENCE */}
              {activeStageId === 'EVIDENCE' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Evidence Locker & Forensics</span>
                    <span className="text-slate-400 text-[11px]">{caseLogs.length} Verified Log Entries</span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {caseLogs.map((log, i) => (
                      <div key={i} className="p-2 bg-black/60 rounded border border-slate-800 text-[10px] flex items-center justify-between">
                        <span className="text-slate-400 truncate">{log.raw}</span>
                        <span className="text-red-400 font-bold shrink-0 ml-2">{log.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6B. ATTACK STORY */}
              {activeStageId === 'ATTACK_STORY' && (
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Reconstructed Adversarial Attack Story</span>
                    <span className="text-purple-400 text-[11px]">MITRE T1110.001</span>
                  </div>
                  <div className="border-l-2 border-purple-500 pl-3 space-y-2 text-[11px]">
                    <div>
                      <span className="text-purple-400 font-bold">Phase 1: Initial Reconnaissance</span>
                      <p className="text-slate-400 font-sans text-xs">Attacker scanned port 22 and queried API endpoints to verify authentication protocols.</p>
                    </div>
                    <div>
                      <span className="text-purple-400 font-bold">Phase 2: High-Velocity Brute-Force</span>
                      <p className="text-slate-400 font-sans text-xs">Origin executed multi-threaded dictionary credential guessing targeting root and service accounts.</p>
                    </div>
                    <div>
                      <span className="text-purple-400 font-bold">Phase 3: Service Destabilization</span>
                      <p className="text-slate-400 font-sans text-xs">Volume exceeded connection quotas triggering internal database pool degradation.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 6C. IOCS */}
              {activeStageId === 'IOCS' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Indicators of Compromise (IOCs)</span>
                    <span className="text-amber-400 text-[11px]">Threat Intel Feed</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-[#0B0E14] p-2.5 rounded border border-[#1E293B]">
                      <span className="text-slate-500 block text-[10px]">Malicious IP</span>
                      <span className="text-red-400 font-bold">{selectedCase?.primaryIP || '198.51.100.42'}</span>
                    </div>
                    <div className="bg-[#0B0E14] p-2.5 rounded border border-[#1E293B]">
                      <span className="text-slate-500 block text-[10px]">Targeted Usernames</span>
                      <span className="text-amber-400 font-bold">root, admin, deploy, ubuntu</span>
                    </div>
                    <div className="bg-[#0B0E14] p-2.5 rounded border border-[#1E293B]">
                      <span className="text-slate-500 block text-[10px]">Attacker ASN / Region</span>
                      <span className="text-slate-300">AS13335 (Cloud Proxy Node)</span>
                    </div>
                    <div className="bg-[#0B0E14] p-2.5 rounded border border-[#1E293B]">
                      <span className="text-slate-500 block text-[10px]">Detection Signature</span>
                      <span className="text-purple-400">SIG-AUTH-BRUTE-T1110</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. PLAYBOOK */}
              {activeStageId === 'PLAYBOOK' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Standard Operating Procedure (SOP)</span>
                    <span className="text-blue-400 text-[11px]">Playbook: AUTH-BREACH-CONTAIN-04</span>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center gap-2 p-2 bg-[#0B0E14] rounded border border-[#1E293B]">
                      <span className="text-emerald-400 font-bold">Step 1:</span>
                      <span className="text-slate-300">Triage origin IP and cross-reference against corporate bastion whitelist.</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-[#0B0E14] rounded border border-[#1E293B]">
                      <span className="text-emerald-400 font-bold">Step 2:</span>
                      <span className="text-slate-300">Deploy perimeter firewall drop rule on border routers (`iptables` / WAF).</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-[#0B0E14] rounded border border-[#1E293B]">
                      <span className="text-emerald-400 font-bold">Step 3:</span>
                      <span className="text-slate-300">Revoke active sessions and force credential rotation for targeted accounts.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. ANALYST DECISION */}
              {activeStageId === 'ANALYST_DECISION' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Human-in-the-Loop Analyst Authorization</span>
                    <span className="text-purple-400 text-[11px]">Role: {userRole}</span>
                  </div>
                  <div className="p-3 bg-[#0B0E14] rounded border border-[#1E293B] space-y-2">
                    <p className="text-slate-300 text-xs font-sans">
                      Analyst evaluation determines this is a confirmed <strong className="text-red-400">True Positive</strong> adversarial intrusion attempt with zero business justification.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <button
                        onClick={() => {
                          if (selectedCase && onBlockIP) onBlockIP(selectedCase.primaryIP);
                        }}
                        disabled={isIPBlocked}
                        className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition-colors flex items-center gap-1.5 ${
                          isIPBlocked 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-md'
                        }`}
                      >
                        {isIPBlocked ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Decision Approved: Host Blocked
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Authorize Containment & Block IP
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. SIMULATED RESPONSE */}
              {activeStageId === 'SIMULATED_RESPONSE' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Active Perimeter & System Containment Execution</span>
                    <span className="text-cyan-400 text-[11px]">Command Synthesis</span>
                  </div>
                  <div className="p-3 bg-black/80 rounded border border-slate-800 text-slate-300 space-y-1.5 text-[11px]">
                    <div className="text-slate-500"># 1. Block attacker at host firewall layer</div>
                    <div className="text-emerald-400 font-bold">
                      $ sudo iptables -A INPUT -s {selectedCase?.primaryIP || '198.51.100.42'} -j DROP
                    </div>
                    <div className="text-slate-500 pt-1"># 2. Invalidate active bearer tokens for compromised users</div>
                    <div className="text-cyan-400 font-bold">
                      $ auth-cli sessions revoke --user root --all --reason "BRUTE_FORCE_INCIDENT"
                    </div>
                    <div className="text-slate-500 pt-1"># 3. Publish IOC to border edge proxy / Cloudflare</div>
                    <div className="text-purple-400 font-bold">
                      $ curl -X POST https://waf.corp.internal/v1/blocks -d '{`{"ip":"${selectedCase?.primaryIP || '198.51.100.42'}"}`}'
                    </div>
                  </div>
                </div>
              )}

              {/* 10. VERIFICATION */}
              {activeStageId === 'VERIFICATION' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Post-Mitigation Telemetry Verification</span>
                    <span className="text-emerald-400 text-[11px]">Health: STABLE</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-[#0B0E14] p-2.5 rounded border border-emerald-500/30">
                      <span className="text-slate-500 block text-[10px]">Subsequent Dropped Packets</span>
                      <span className="text-emerald-400 font-bold text-sm">48 packets dropped</span>
                    </div>
                    <div className="bg-[#0B0E14] p-2.5 rounded border border-emerald-500/30">
                      <span className="text-slate-500 block text-[10px]">Auth Failure Velocity</span>
                      <span className="text-emerald-400 font-bold text-sm">0 failures / min</span>
                    </div>
                    <div className="bg-[#0B0E14] p-2.5 rounded border border-emerald-500/30">
                      <span className="text-slate-500 block text-[10px]">Database Pool State</span>
                      <span className="text-emerald-400 font-bold text-sm">Healthy (14% util)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 11. RESOLVED */}
              {activeStageId === 'RESOLVED' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Incident Closure & Metrics</span>
                    <span className="text-emerald-400 font-bold text-sm">STATUS: RESOLVED</span>
                  </div>
                  <div className="bg-[#0B0E14] p-3 rounded border border-[#1E293B] space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Mean Time to Detect (MTTD)</span>
                        <span className="text-white font-bold">1 min 24 sec</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Mean Time to Remediate (MTTR)</span>
                        <span className="text-emerald-400 font-bold">3 min 45 sec</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Root Cause Classification</span>
                        <span className="text-amber-400 font-bold">External Brute Force</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Compromise Status</span>
                        <span className="text-emerald-400 font-bold">Prevented / None</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 12. INCIDENT REPORT */}
              {activeStageId === 'INCIDENT_REPORT' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Forensic Executive Incident Report</span>
                    <button
                      onClick={() => handleCopy(
                        `INCIDENT BRIEF\nID: ${selectedCase?.caseNumber}\nTarget: ${selectedCase?.primaryIP}\nSeverity: ${selectedCase?.severity}\nRoot Cause: Correlated Brute-Force & DB Starvation\nStatus: Mitigated`,
                        'report'
                      )}
                      className="text-blue-400 hover:text-blue-300 text-[11px] flex items-center gap-1"
                    >
                      {copiedText === 'report' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedText === 'report' ? 'Copied' : 'Copy Brief'}
                    </button>
                  </div>
                  <div className="p-3 bg-black/60 rounded border border-slate-800 text-slate-300 text-[11px] font-sans space-y-2">
                    <p>
                      <strong>Executive Summary:</strong> On 2026-09-10, an anomalous authentication flood originating from external IP <code>{selectedCase?.primaryIP}</code> was detected by SecureLog Analytica. The engine calculated a threat score of {selectedCase?.riskScore}/100 and correlated it with backend connection pool saturation.
                    </p>
                    <p>
                      <strong>Remediation:</strong> Security operations authorized Playbook <code>AUTH-BREACH-CONTAIN-04</code>, applying border firewall block rules and invalidating active session tokens. Telemetry verified zero subsequent intrusion attempts.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StageNodeButtonProps {
  stage: PipelineStageConfig;
  isActive: boolean;
  onClick: () => void;
  highlightColor?: 'blue' | 'amber' | 'purple' | 'cyan' | 'emerald';
  isCompact?: boolean;
}

const StageNodeButton: React.FC<StageNodeButtonProps> = ({
  stage,
  isActive,
  onClick,
  highlightColor = 'blue',
  isCompact = false
}) => {
  const Icon = stage.icon;

  const colorStyles = {
    blue: isActive ? 'bg-blue-600/20 text-blue-300 border-blue-500 shadow-blue-900/30' : 'bg-[#0F172A] text-slate-400 border-[#1E293B]',
    amber: isActive ? 'bg-amber-600/20 text-amber-300 border-amber-500 shadow-amber-900/30' : 'bg-[#0F172A] text-slate-400 border-[#1E293B]',
    purple: isActive ? 'bg-purple-600/20 text-purple-300 border-purple-500 shadow-purple-900/30' : 'bg-[#0F172A] text-slate-400 border-[#1E293B]',
    cyan: isActive ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500 shadow-cyan-900/30' : 'bg-[#0F172A] text-slate-400 border-[#1E293B]',
    emerald: isActive ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500 shadow-emerald-900/30' : 'bg-[#0F172A] text-slate-400 border-[#1E293B]',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between rounded-lg border transition-all duration-200 text-left font-mono ${
        isCompact ? 'p-2 text-[11px]' : 'px-3.5 py-2 text-xs'
      } ${colorStyles[highlightColor]} ${isActive ? 'shadow-md scale-[1.02] ring-1 ring-white/10' : 'hover:border-slate-600 hover:text-slate-200'}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`shrink-0 ${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${isActive ? 'text-white animate-pulse' : 'text-slate-500'}`} />
        <span className={`truncate font-semibold ${isActive ? 'text-white' : ''}`}>
          {isCompact ? stage.shortLabel : stage.label}
        </span>
      </div>
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping shrink-0 ml-1"></span>
      )}
    </button>
  );
};
