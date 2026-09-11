import React, { useState } from 'react';
import { 
  Briefcase, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  Filter, 
  Search, 
  Plus, 
  ExternalLink, 
  Terminal, 
  FileText, 
  Flame, 
  ArrowRight, 
  Lock, 
  Send, 
  Download, 
  Copy, 
  Check, 
  Slash,
  RefreshCw,
  X,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { IncidentCase, IncidentStatus, RiskLevel, CaseContainmentAction, CaseAnalystNote } from '../types';

interface CaseManagementPanelProps {
  cases: IncidentCase[];
  onUpdateCase: (updatedCase: IncidentCase) => void;
  onCreateCase: (newCase: IncidentCase) => void;
  onInvestigateIP: (ip: string) => void;
  onBack?: () => void;
}

export const CaseManagementPanel: React.FC<CaseManagementPanelProps> = ({
  cases,
  onUpdateCase,
  onCreateCase,
  onInvestigateIP,
  onBack
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(cases[0]?.id || null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // New Case Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseIP, setNewCaseIP] = useState('');
  const [newCaseSeverity, setNewCaseSeverity] = useState<RiskLevel>('HIGH');
  const [newCaseAnalyst, setNewCaseAnalyst] = useState('Analyst Sarah M. (SOC Tier-2)');
  const [newCaseSummary, setNewCaseSummary] = useState('');

  // Analyst Note Input State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);

  const activeCase = cases.find(c => c.id === selectedCaseId) || cases[0];

  const filteredCases = cases.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && c.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNumber = c.caseNumber.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchIP = c.primaryIP.toLowerCase().includes(q);
      const matchUser = c.targetedUsers.some(u => u.toLowerCase().includes(q));
      if (!matchNumber && !matchTitle && !matchIP && !matchUser) return false;
    }
    return true;
  });

  const openCasesCount = cases.filter(c => c.status !== 'RESOLVED').length;
  const criticalCasesCount = cases.filter(c => c.severity === 'CRITICAL' && c.status !== 'RESOLVED').length;
  const containedCount = cases.filter(c => c.status === 'CONTAINED').length;

  const handleExecuteContainment = (actionId: string) => {
    if (!activeCase) return;
    const now = new Date().toLocaleTimeString();
    const updatedActions: CaseContainmentAction[] = activeCase.containmentActions.map(a => {
      if (a.id === actionId) {
        return {
          ...a,
          status: 'EXECUTED',
          executedAt: now
        };
      }
      return a;
    });

    const autoNote: CaseAnalystNote = {
      id: Math.random().toString(),
      author: 'Automated Containment Engine',
      timestamp: now,
      content: `Containment action executed: ${activeCase.containmentActions.find(a => a.id === actionId)?.label}`
    };

    onUpdateCase({
      ...activeCase,
      status: activeCase.status === 'NEW' || activeCase.status === 'TRIAGED' ? 'CONTAINED' : activeCase.status,
      updatedAt: now,
      containmentActions: updatedActions,
      notes: [...activeCase.notes, autoNote]
    });
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim() || !activeCase) return;
    const now = new Date().toLocaleTimeString();
    const note: CaseAnalystNote = {
      id: Math.random().toString(),
      author: 'SOC Lead Analyst',
      timestamp: now,
      content: newNoteContent.trim()
    };

    onUpdateCase({
      ...activeCase,
      updatedAt: now,
      notes: [...activeCase.notes, note]
    });
    setNewNoteContent('');
  };

  const handleChangeStatus = (status: IncidentStatus) => {
    if (!activeCase) return;
    const now = new Date().toLocaleTimeString();
    onUpdateCase({
      ...activeCase,
      status,
      updatedAt: now
    });
  };

  const handleCreateNewCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle || !newCaseIP) return;

    const caseNumber = `CASE-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const now = new Date().toLocaleTimeString();

    const created: IncidentCase = {
      id: Math.random().toString(),
      caseNumber,
      title: newCaseTitle,
      severity: newCaseSeverity,
      status: 'TRIAGED',
      riskScore: newCaseSeverity === 'CRITICAL' ? 95 : newCaseSeverity === 'HIGH' ? 82 : 60,
      assignedAnalyst: newCaseAnalyst,
      createdAt: now,
      updatedAt: now,
      primaryIP: newCaseIP,
      associatedIPs: [newCaseIP],
      targetedUsers: ['root', 'admin'],
      mitreTechnique: { id: 'T1110', name: 'Brute Force' },
      summary: newCaseSummary || `Security incident initiated for suspicious activity originating from ${newCaseIP}.`,
      rootCauseAnalysis: 'Investigation pending telemetry correlation and adversary forensic evaluation.',
      evidenceLogCount: 12,
      notes: [
        {
          id: Math.random().toString(),
          author: newCaseAnalyst,
          timestamp: now,
          content: 'Case initialized and assigned to tier-2 incident response queue.'
        }
      ],
      containmentActions: [
        {
          id: 'action-1',
          type: 'FIREWALL_BLOCK',
          label: `Perimeter Firewall Block (${newCaseIP})`,
          status: 'PENDING',
          commandExecuted: `iptables -A INPUT -s ${newCaseIP} -j DROP`
        },
        {
          id: 'action-2',
          type: 'REVOKE_SESSIONS',
          label: 'Invalidate Active Tokens for Targeted Users',
          status: 'PENDING',
          commandExecuted: `authctl session revoke --user root --ip ${newCaseIP}`
        }
      ]
    };

    onCreateCase(created);
    setSelectedCaseId(created.id);
    setShowCreateModal(false);
    setNewCaseTitle('');
    setNewCaseIP('');
    setNewCaseSummary('');
  };

  const handleCopyReport = () => {
    if (!activeCase) return;
    const reportText = `================================================================================
SECURITY INCIDENT CASE REPORT: ${activeCase.caseNumber}
================================================================================
Title: ${activeCase.title}
Status: ${activeCase.status} | Severity: ${activeCase.severity} | Risk Score: ${activeCase.riskScore}/100
Assigned Analyst: ${activeCase.assignedAnalyst}
Created: ${activeCase.createdAt} | Updated: ${activeCase.updatedAt}

1. ADVERSARY ATTRIBUTION
Primary IP: ${activeCase.primaryIP}
MITRE Technique: ${activeCase.mitreTechnique ? `${activeCase.mitreTechnique.id} - ${activeCase.mitreTechnique.name}` : 'N/A'}
Targeted Accounts: ${activeCase.targetedUsers.join(', ')}

2. EXECUTIVE SUMMARY
${activeCase.summary}

3. ROOT CAUSE ANALYSIS
${activeCase.rootCauseAnalysis || 'Under investigation.'}

4. CONTAINMENT PLAYBOOK STATUS
${activeCase.containmentActions.map(a => `- [${a.status}] ${a.label} ${a.executedAt ? `(Executed at ${a.executedAt})` : ''}`).join('\n')}

5. INVESTIGATION LOG & NOTES
${activeCase.notes.map(n => `[${n.timestamp}] ${n.author}: ${n.content}`).join('\n')}
================================================================================`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Optional Top Back Navigation Bar */}
      {onBack && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0F172A] border border-[#1E293B] text-xs font-mono">
          <button
            onClick={onBack}
            className="px-2.5 py-1 rounded bg-[#1E293B] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#334155] flex items-center gap-1.5 transition-colors font-medium"
            title="Return to previous screen"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>Back to Previous Screen</span>
          </button>
          <span className="text-slate-500 text-[11px]">SOC Case Management Engine</span>
        </div>
      )}

      {/* Top Banner & KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">TOTAL CASES</span>
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {cases.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active SOC Registry</p>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-amber-400">OPEN / TRIAGED</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {openCasesCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Requires Analyst Action</p>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-red-400">CRITICAL SEVERITY</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-300 mt-1">
            {criticalCasesCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">P1 Priority Breaches</p>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-400">CONTAINED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {containedCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Firewall Rules Active</p>
        </div>
      </div>

      {/* Main Split Interface: Left Case List + Right Case Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Case Navigator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                Incident Cases ({filteredCases.length})
              </span>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold flex items-center gap-1 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Case</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case #, IP, user, title..."
                className="w-full bg-[#0B0E14] border border-[#334155] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
              {['ALL', 'NEW', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    statusFilter === st
                      ? 'bg-blue-950 text-blue-300 border-blue-500/50 font-bold'
                      : 'bg-[#0B0E14] text-slate-400 border-[#1E293B] hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Case List Cards */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredCases.map(c => {
              const isSelected = c.id === activeCase?.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#131B2E] border-blue-500/80 shadow-md shadow-blue-950/40 ring-1 ring-blue-500/30'
                      : 'bg-[#0F172A] border-[#1E293B] hover:border-slate-700 hover:bg-[#11192C]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      <span className="text-blue-400">{c.caseNumber}</span>
                      {c.mitreTechnique && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                          {c.mitreTechnique.id}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                        c.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        c.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {c.severity}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                        c.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        c.status === 'CONTAINED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        c.status === 'INVESTIGATING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-slate-200 line-clamp-1 mb-2">
                    {c.title}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-slate-300">
                      IP: <strong className="text-red-400">{c.primaryIP}</strong>
                    </span>
                    <span className="text-slate-500">Risk: <strong className="text-amber-400">{c.riskScore}/100</strong></span>
                  </div>
                </div>
              );
            })}

            {filteredCases.length === 0 && (
              <div className="p-8 text-center bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-slate-500 font-mono">
                No matching security incident cases found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Case Dossier (7 cols) */}
        {activeCase ? (
          <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 space-y-5">
            
            {/* Dossier Header */}
            <div className="border-b border-[#1E293B] pb-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
                    {activeCase.caseNumber}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {activeCase.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyReport}
                    className="px-2.5 py-1 rounded bg-[#131B2E] hover:bg-slate-800 border border-[#334155] text-slate-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1.5"
                    title="Copy full incident case report"
                  >
                    {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedReport ? 'Copied' : 'Export Report'}</span>
                  </button>
                </div>
              </div>

              {/* Status & Assigned Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Status:</span>
                  <select
                    value={activeCase.status}
                    onChange={(e) => handleChangeStatus(e.target.value as IncidentStatus)}
                    className="bg-[#0B0E14] border border-[#334155] text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  >
                    <option value="NEW">NEW</option>
                    <option value="TRIAGED">TRIAGED</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="CONTAINED">CONTAINED</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <span>Analyst: <strong className="text-slate-200">{activeCase.assignedAnalyst}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>Risk Score: <strong className="text-red-400">{activeCase.riskScore}/100</strong></span>
                </div>
              </div>
            </div>

            {/* Threat Attribution & Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#0B0E14] border border-[#1E293B] rounded-xl p-3.5 text-xs font-mono">
              <div className="space-y-1.5">
                <div className="text-slate-500">ATTACKER IP NODE</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-400">{activeCase.primaryIP}</span>
                  <button
                    onClick={() => onInvestigateIP(activeCase.primaryIP)}
                    className="text-[10px] px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-500/30 rounded hover:bg-blue-900 transition-colors flex items-center gap-1"
                  >
                    <span>Inspect Forensic Node</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Targeted Accounts: <span className="text-slate-200">{activeCase.targetedUsers.join(', ')}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-slate-500">MITRE ATT&CK FRAMEWORK</div>
                <div className="text-sm font-bold text-purple-300">
                  {activeCase.mitreTechnique ? `${activeCase.mitreTechnique.id} • ${activeCase.mitreTechnique.name}` : 'T1110 • Brute Force'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Created: <span className="text-slate-300">{activeCase.createdAt}</span> | Updated: <span className="text-slate-300">{activeCase.updatedAt}</span>
                </div>
              </div>
            </div>

            {/* Incident Summary */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                Incident Executive Summary
              </h4>
              <p className="text-xs text-slate-300 bg-[#0B0E14] border border-[#1E293B] p-3 rounded-lg leading-relaxed font-sans">
                {activeCase.summary}
              </p>
            </div>

            {/* SOC Containment & Remediation Playbook */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  SOC Containment & Response Playbook
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  1-Click Perimeter Mitigation
                </span>
              </div>

              <div className="space-y-2">
                {activeCase.containmentActions.map(action => (
                  <div
                    key={action.id}
                    className="p-3 bg-[#0B0E14] border border-[#1E293B] rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${action.status === 'EXECUTED' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span className="font-bold text-slate-200">{action.label}</span>
                      </div>
                      {action.commandExecuted && (
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 bg-[#131B2E] px-2 py-0.5 rounded border border-[#1E293B] w-fit">
                          <Terminal className="w-3 h-3 text-slate-400" />
                          <code>{action.commandExecuted}</code>
                        </div>
                      )}
                    </div>

                    <div>
                      {action.status === 'EXECUTED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Executed {action.executedAt ? `(${action.executedAt})` : ''}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleExecuteContainment(action.id)}
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono transition-colors shadow flex items-center gap-1"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Execute Mitigation</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analyst Investigation Notes Thread */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                SOC Analyst Investigation Notes ({activeCase.notes.length})
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {activeCase.notes.map(note => (
                  <div key={note.id} className="p-2.5 bg-[#0B0E14] border border-[#1E293B] rounded-lg text-xs space-y-1 font-mono">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="text-blue-400 font-semibold">{note.author}</span>
                      <span>{note.timestamp}</span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs">{note.content}</p>
                  </div>
                ))}
              </div>

              {/* Add Note Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  placeholder="Add analyst observation or root-cause finding..."
                  className="flex-1 bg-[#0B0E14] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddNote}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] rounded-xl p-12 text-center text-slate-500 font-mono text-xs">
            Select a security incident case from the left to inspect dossier.
          </div>
        )}

      </div>

      {/* Modal: Create New Case */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans animate-in fade-in">
          <div className="bg-[#0D121F] border border-[#1E293B] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Initialize New SOC Security Case
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-2 py-1 rounded bg-[#1E293B] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#334155] text-xs font-mono flex items-center gap-1 transition-colors"
                  title="Back to Cases (ESC)"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateNewCaseSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Case Title:</label>
                <input
                  type="text"
                  required
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  placeholder="e.g. Coordinated Password Spraying against Admin Portal"
                  className="w-full bg-[#0B0E14] border border-[#334155] rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Primary Adversary IP:</label>
                  <input
                    type="text"
                    required
                    value={newCaseIP}
                    onChange={(e) => setNewCaseIP(e.target.value)}
                    placeholder="e.g. 203.0.113.45"
                    className="w-full bg-[#0B0E14] border border-[#334155] rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Severity:</label>
                  <select
                    value={newCaseSeverity}
                    onChange={(e) => setNewCaseSeverity(e.target.value as RiskLevel)}
                    className="w-full bg-[#0B0E14] border border-[#334155] rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Assigned Analyst:</label>
                <select
                  value={newCaseAnalyst}
                  onChange={(e) => setNewCaseAnalyst(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#334155] rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="Analyst Sarah M. (SOC Tier-2)">Analyst Sarah M. (SOC Tier-2)</option>
                  <option value="Incident Commander David R.">Incident Commander David R.</option>
                  <option value="Forensic Investigator Alex T.">Forensic Investigator Alex T.</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Summary / Initial Finding:</label>
                <textarea
                  rows={3}
                  value={newCaseSummary}
                  onChange={(e) => setNewCaseSummary(e.target.value)}
                  placeholder="Describe observed attack activity, impacted endpoints, and recommended triage actions..."
                  className="w-full bg-[#0B0E14] border border-[#334155] rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded text-slate-300 hover:text-white bg-[#1E293B] hover:bg-slate-800 border border-[#334155] text-xs font-mono transition-colors flex items-center gap-1.5"
                  title="Return to cases list"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono font-semibold shadow"
                >
                  Initialize Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
