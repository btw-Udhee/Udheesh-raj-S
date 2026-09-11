import React, { useState } from 'react';
import { 
  Layers, 
  Cpu, 
  ArrowRight, 
  ShieldCheck, 
  Terminal, 
  GitCompare, 
  Crosshair, 
  Activity, 
  CheckCircle2, 
  Zap, 
  Lock, 
  FileText, 
  AlertTriangle, 
  Share2, 
  Server,
  Database,
  Search,
  ExternalLink,
  Flame,
  Briefcase
} from 'lucide-react';

interface PipelineStage {
  id: string;
  stepNumber: number;
  title: string;
  shortName: string;
  icon: any;
  category: string;
  color: string;
  summary: string;
  complexity: string;
  pythonModule: string;
  productionStack: string;
  inputs: string[];
  outputs: string[];
  codeSnippet: string;
  interviewTalkingPoints: string[];
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'stage-1',
    stepNumber: 1,
    title: 'Log Ingestion & Dialect Normalizer',
    shortName: 'Ingestion & Regex Parser',
    icon: Terminal,
    category: 'Telemetry Ingestion',
    color: 'emerald',
    summary: 'Ingests heterogeneous raw logs (Linux syslog, Apache web access logs, standard auth logs), extracts timestamps, sanitizes IPs, and standardizes events into canonical LogEntry structures.',
    complexity: 'O(N) single-pass regex parsing',
    pythonModule: 'log_parser.py (Level 1 & 2)',
    productionStack: 'FluentBit / Vector → Apache Kafka (100k+ eps) → Redis Queue',
    inputs: ['Raw string log streams', 'syslog / auth.log / access.log files'],
    outputs: ['Normalized LogEntry[] objects', 'Extracted IP addresses', 'Canonical timestamps'],
    codeSnippet: `# Python Regex Normalization Engine
import re
from datetime import datetime

LOG_PATTERN = re.compile(
    r'(?P<ts>\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})\\s+'
    r'(?P<event>[A-Z_]+)\\s+'
    r'(?P<ip>\\d{1,3}(?:\\.\\d{1,3}){3})'
    r'(?:\\s+user=(?P<user>[^\\s]+))?'
)

def parse_line(raw: str):
    m = LOG_PATTERN.search(raw)
    if not m: return None
    return {
        "timestamp": datetime.fromisoformat(m.group("ts")),
        "event": m.group("event"),
        "ip": m.group("ip"),
        "user": m.group("user") or "unknown"
    }`,
    interviewTalkingPoints: [
      'Regex is pre-compiled using re.compile() to avoid re-interpreting bytecode per event.',
      'Handles multi-format fallback dialects (Linux auth.log vs Apache Combined Log Format) gracefully.',
      'In production at scale, regex parsing is offloaded to SIMD-accelerated ingestors like Vector or Logstash.'
    ]
  },
  {
    id: 'stage-2',
    stepNumber: 2,
    title: 'Sliding-Window Correlation Engine',
    shortName: 'Temporal Correlation',
    icon: GitCompare,
    category: 'Temporal Analytics',
    color: 'rose',
    summary: 'Correlates system-level 500/DB errors with preceding or subsequent login failures within a configurable time delta (default 60s) to identify auth service exhaustion or cascade failures.',
    complexity: 'O(E + F log F) two-pointer sliding window',
    pythonModule: 'correlation_analyzer.py (Level 3)',
    productionStack: 'Apache Flink / Spark Streaming with Tumbling & Sliding Event-Time Windows',
    inputs: ['Normalized LogEntry[] sequence', 'Sliding window size (60 seconds)'],
    outputs: ['CorrelatedErrorIncident[]', 'Causality inference: Attack vs Infrastructure Failure'],
    codeSnippet: `# Sliding Window Event-Time Correlation (Python)
from collections import deque

def correlate_failures_with_errors(error_events, failure_events, window_sec=60):
    incidents = []
    for err in error_events:
        window_start = err.timestamp - timedelta(seconds=window_sec)
        window_end = err.timestamp + timedelta(seconds=window_sec)
        
        correlated = [
            f for f in failure_events
            if window_start <= f.timestamp <= window_end
        ]
        if correlated:
            incidents.append({
                "error": err,
                "correlated_count": len(correlated),
                "affected_ips": list({f.ip for f in correlated}),
                "confidence": min(100, len(correlated) * 15)
            })
    return incidents`,
    interviewTalkingPoints: [
      'Discloses whether an error was caused by an authentication assault (DDoS / Auth Exhaustion) or whether backend failure induced login failures.',
      'Prevents false alarms by calculating causality direction and confidence scores.',
      'Production sliding windows maintain event-time watermarking to accommodate out-of-order log deliveries.'
    ]
  },
  {
    id: 'stage-3',
    stepNumber: 3,
    title: 'Behavioral Attack Pattern Detection',
    shortName: 'MITRE ATT&CK Engine',
    icon: Crosshair,
    category: 'Threat Detection',
    color: 'purple',
    summary: 'Goes beyond simple attempt counters to identify distinct tactical behavioral patterns: Vertical Brute-Force (T1110.001), Horizontal Password Spraying (T1110.003), Credential Stuffing (T1110.004), and Vulnerability Probing (T1595.002).',
    complexity: 'O(N) aggregation over grouped IP/User hash maps',
    pythonModule: 'attack_patterns.py (Level 3 & 4)',
    productionStack: 'Sigma Rules Engine / Falco / Elastic Detection Rules',
    inputs: ['Parsed events stream', 'Heuristic thresholds: user count, IP count, velocity'],
    outputs: ['AttackPattern[] detections', 'MITRE ATT&CK technique mapping', 'Indicator tags'],
    codeSnippet: `# Behavioral Pattern Identification (MITRE ATT&CK)
def detect_attack_patterns(logs):
    ip_to_users = defaultdict(set)
    user_to_ips = defaultdict(set)
    ip_failures = defaultdict(int)

    for log in logs:
        if log.event == "LOGIN_FAILED":
            ip_failures[log.ip] += 1
            if log.user:
                ip_to_users[log.ip].add(log.user)
                user_to_ips[log.user].add(log.ip)

    patterns = []
    # 1. Password Spraying: 1 IP hits >= 4 distinct users
    for ip, users in ip_to_users.items():
        if len(users) >= 4:
            patterns.append({
                "mitre": "T1110.003 (Password Spraying)",
                "ip": ip,
                "targeted_users": list(users),
                "severity": "HIGH"
            })
    return patterns`,
    interviewTalkingPoints: [
      'Eliminates the single-metric blindspot: password sprayers intentionally stay under the 5-failure per account threshold by spraying across 100 accounts.',
      'Maps findings to MITRE ATT&CK enterprise matrix for standardized SOC terminology.',
      'Distinguishes distributed botnet swarms (credential stuffing) from single-actor hydra scripts.'
    ]
  },
  {
    id: 'stage-4',
    stepNumber: 4,
    title: 'Dynamic Composite Risk Scoring Engine',
    shortName: 'Risk Scoring (0-100)',
    icon: Activity,
    category: 'Risk Quantification',
    color: 'amber',
    summary: 'Computes a mathematical 0-100 threat score per IP and incident by compounding failure velocity, privileged targets (root/admin), off-hours operations, geographic risk, and attack pattern indicators.',
    complexity: 'O(1) normalized score calculation',
    pythonModule: 'risk_scorer.py (Level 2 & 4)',
    productionStack: 'User and Entity Behavior Analytics (UEBA) Risk Engine',
    inputs: ['Failure counts', 'Targeted usernames', 'GeoIP & ASN risk data', 'Time of day'],
    outputs: ['Numerical Risk Score (0-100)', 'Risk Tier: LOW, MEDIUM, HIGH, CRITICAL'],
    codeSnippet: `# Dynamic Composite Risk Score Formula (0 - 100)
def compute_risk_score(ip_data, geo_data=None):
    score = 0
    # 1. Velocity factor (up to 30 pts)
    score += min(30, ip_data.failed_logins * 3)

    # 2. Privileged targets factor (up to 25 pts)
    privileged = {"root", "admin", "administrator", "sysadmin", "cfo"}
    if any(u in privileged for u in ip_data.users):
        score += 25

    # 3. Behavioral pattern match (up to 20 pts)
    if ip_data.is_pattern_detected:
        score += 20

    # 4. Off-hours activity (00:00 - 05:00 UTC) (up to 15 pts)
    if ip_data.is_off_hours:
        score += 15

    # 5. Geolocation / Bulletproof ASN risk (up to 10 pts)
    if geo_data and geo_data.is_threat_country:
        score += 10

    return min(100, score)`,
    interviewTalkingPoints: [
      'Prevents binary "alert or no-alert" fatigue by providing a prioritized gradient for SOC triage.',
      'Privileged account targeting automatically elevates incident severity even with lower attempt counts.',
      'Audit-ready: every point in the 0-100 scale can be explained mathematically to an auditor or interviewer.'
    ]
  },
  {
    id: 'stage-5',
    stepNumber: 5,
    title: 'Real-Time Alerting & Case Management',
    shortName: 'SOC Case & Triage',
    icon: Briefcase,
    category: 'SOC Incident Response',
    color: 'blue',
    summary: 'Dispatches real-time web audio alerts, floating high-priority toasts, and encapsulates correlated forensic evidence into actionable Incident Cases with assigned analysts and audit logs.',
    complexity: 'O(1) incident dispatch',
    pythonModule: 'case_manager.py (Level 4)',
    productionStack: 'SOAR / SIEM (Splunk, Elastic SIEM, TheHive, PagerDuty)',
    inputs: ['Elevated Risk Alerts (Score >= 75)', 'Forensic timeline & evidence logs'],
    outputs: ['IncidentCase dossier', 'Analyst assignment', 'Audit-ready case report'],
    codeSnippet: `# Incident Case Management & Triage Object
@dataclass
class IncidentCase:
    case_number: str       # e.g. CASE-2026-081
    severity: str          # CRITICAL / HIGH / MEDIUM
    status: str            # NEW -> TRIAGED -> CONTAINED
    risk_score: int        # 0 - 100
    primary_ip: str        # Attacker node
    mitre_technique: str   # T1110.001
    assigned_analyst: str  # Tier 2 IR Specialist
    containment_actions: list`,
    interviewTalkingPoints: [
      'Bridges the gap between raw data science detection and real-world SOC operational workflow.',
      'Maintains case progression lifecycle: NEW → TRIAGED → INVESTIGATING → CONTAINED → RESOLVED.',
      'Stores immutable audit trail of analyst notes and timestamps for compliance post-mortems.'
    ]
  },
  {
    id: 'stage-6',
    stepNumber: 6,
    title: 'Automated Response & Perimeter Containment',
    shortName: 'Perimeter Containment',
    icon: Lock,
    category: 'Active Defense',
    color: 'red',
    summary: 'Provides 1-click active perimeter containment actions: generates and executes host-level iptables DROP rules, cloud WAF ip-set updates, and token invalidation.',
    complexity: 'O(1) rule dispatch to perimeter API',
    pythonModule: 'firewall_action.py (Level 4)',
    productionStack: 'Linux Netfilter / iptables / AWS WAF / Cloudflare API / fail2ban',
    inputs: ['Approved containment order', 'Adversary source IP', 'Affected accounts'],
    outputs: ['iptables DROP rule', 'Cloud WAF block list', 'Session invalidation token'],
    codeSnippet: `# 1-Click Automated Perimeter Containment Playbook
import subprocess

def execute_firewall_drop(ip: str):
    # Linux host-level packet filter command
    cmd = ["iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"]
    # In enterprise cloud: aws wafv2 update-ip-set ...
    return {
        "status": "EXECUTED",
        "command": " ".join(cmd),
        "target_ip": ip,
        "action": "PERIMETER_DROP"
    }`,
    interviewTalkingPoints: [
      'Executes containment without waiting for human delay when critical risk score is confirmed.',
      'Generates exact CLI command syntax (iptables / AWS WAF) so interviewers see concrete systems engineering proficiency.',
      'Supports reversible actions (whitelist unblock) to safeguard against false positives.'
    ]
  }
];

export const ArchitecturePipelineVisualizer: React.FC<{
  onLaunchSimulator?: () => void;
  onNavigateToTab?: (tab: any) => void;
}> = ({ onLaunchSimulator, onNavigateToTab }) => {
  const [selectedStageId, setSelectedStageId] = useState<string>('stage-1');
  const [activeWalkthroughStep, setActiveWalkthroughStep] = useState<number>(1);

  const selectedStage = PIPELINE_STAGES.find(s => s.id === selectedStageId) || PIPELINE_STAGES[0];

  const walkthroughSteps = [
    {
      step: 1,
      title: 'Simulate Attack Vector',
      desc: 'Launch the Adversary Attack Simulator to inject high-velocity SSH brute force or horizontal password spray events.',
      actionLabel: 'Launch Simulator',
      action: onLaunchSimulator
    },
    {
      step: 2,
      title: 'Watch Stream & Regex Parsing',
      desc: 'Normalized telemetry appears in Raw Log Explorer with status code, extracted username, and sanitized IP.',
      actionLabel: 'View Raw Logs',
      action: () => onNavigateToTab && onNavigateToTab('logs')
    },
    {
      step: 3,
      title: 'Inspect MITRE Behavioral Detection',
      desc: 'The Pattern Engine flags T1110.001 (Brute Force) or T1110.003 (Password Spraying) based on multi-user/IP heuristics.',
      actionLabel: 'View Attack Patterns',
      action: () => onNavigateToTab && onNavigateToTab('patterns')
    },
    {
      step: 4,
      title: 'Observe Dynamic Risk Score (0-100)',
      desc: 'Risk Scorer elevates incident to 94/100 (CRITICAL) due to failure velocity and privileged root account targeting.',
      actionLabel: 'Inspect Dashboard Metrics',
      action: () => onNavigateToTab && onNavigateToTab('dashboard')
    },
    {
      step: 5,
      title: 'Triage in Threat Radar Map',
      desc: 'Geolocation engine plots adversary coordinates in Russia / Tor exit node with animated attack trajectory arcs.',
      actionLabel: 'Open Threat Map',
      action: () => onNavigateToTab && onNavigateToTab('map')
    },
    {
      step: 6,
      title: 'Case Management & 1-Click Containment',
      desc: 'Convert alert to CASE-2026-081, assign Tier-2 analyst, execute 1-click iptables firewall drop, and copy export report.',
      actionLabel: 'Open Cases & Response',
      action: () => onNavigateToTab && onNavigateToTab('cases')
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Visual Pipeline Flow Header */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                <Cpu className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                End-to-End SOC Detection & Response Architecture
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Interactive pipeline showing data flow from raw packet ingest to automated perimeter containment.
            </p>
          </div>

          {onLaunchSimulator && (
            <button
              onClick={onLaunchSimulator}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold shadow-lg shadow-red-900/40 transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>Launch Demo Attack</span>
            </button>
          )}
        </div>

        {/* Pipeline Flow Stepper Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          {PIPELINE_STAGES.map((st) => {
            const isSelected = st.id === selectedStage.id;
            const Icon = st.icon;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStageId(st.id)}
                className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-950/50 ring-1 ring-blue-500/50'
                    : 'bg-[#0B0E14] border-[#1E293B] hover:border-slate-700 hover:bg-[#111827]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-mono font-bold">
                      {st.stepNumber}
                    </span>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="text-xs font-bold text-white font-mono line-clamp-1">
                    {st.shortName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {st.category}
                  </div>
                </div>
                <div className="mt-3 text-[9px] font-mono text-blue-400 font-semibold">
                  {isSelected ? '● ACTIVE INSPECTOR' : 'Click to inspect'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deep-Dive Stage Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Architecture & Code */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
                STAGE {selectedStage.stepNumber}
              </span>
              <h3 className="text-sm font-bold text-white font-mono">
                {selectedStage.title}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              {selectedStage.complexity}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {selectedStage.summary}
          </p>

          {/* Module Mapping & Production Stack */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-[#0B0E14] border border-[#1E293B] p-3 rounded-lg">
            <div>
              <span className="text-slate-500 block text-[10px]">PROJECT PYTHON MODULE:</span>
              <span className="text-blue-300 font-bold">{selectedStage.pythonModule}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ENTERPRISE PRODUCTION STACK:</span>
              <span className="text-purple-300 font-bold">{selectedStage.productionStack}</span>
            </div>
          </div>

          {/* Python Implementation Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Algorithmic Python Implementation:</span>
              <span className="text-[10px] text-slate-500">Python 3.11+ / Type-Annotated</span>
            </div>
            <pre className="p-3.5 bg-black border border-[#1E293B] rounded-lg font-mono text-[11px] text-emerald-400/90 overflow-x-auto leading-relaxed max-h-56 select-text">
              <code>{selectedStage.codeSnippet}</code>
            </pre>
          </div>

          {/* Interview Defense Talking Points */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Interview Defense & Architecture Q&A Points
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedStage.interviewTalkingPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2 bg-[#0B0E14] p-2 rounded border border-[#1E293B]">
                  <span className="text-blue-400 font-mono font-bold mt-0.5">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right 5 Columns: The 7-Step Interview Demonstration Script */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-amber-500/20 text-amber-400 rounded">
                <Activity className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                End-to-End SOC Demo Script
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Simulate → Detect → Respond
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Use this structured sequence during interviews or portfolio presentations to demonstrate end-to-end technical mastery.
          </p>

          <div className="space-y-3">
            {walkthroughSteps.map((ws) => (
              <div
                key={ws.step}
                className="p-3 bg-[#0B0E14] border border-[#1E293B] rounded-lg hover:border-slate-700 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-600/40 flex items-center justify-center text-[10px] font-mono font-bold">
                      {ws.step}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      {ws.title}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                  {ws.desc}
                </p>

                {ws.action && (
                  <div className="pl-7 pt-1">
                    <button
                      onClick={ws.action}
                      className="px-2.5 py-1 rounded bg-[#131B2E] hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-semibold transition-all flex items-center gap-1"
                    >
                      <span>{ws.actionLabel}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
