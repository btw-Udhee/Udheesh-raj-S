import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { ChartsSection } from './components/ChartsSection';
import { SecurityAlertsPanel } from './components/SecurityAlertsPanel';
import { SuspiciousIPTable } from './components/SuspiciousIPTable';
import { LogStreamViewer } from './components/LogStreamViewer';
import { LogSearchBar } from './components/LogSearchBar';
import { ReportsPanel } from './components/ReportsPanel';
import { CorrelationAnalyzerPanel } from './components/CorrelationAnalyzerPanel';
import { LiveThreatMap } from './components/LiveThreatMap';
import { AttackPatternPanel } from './components/AttackPatternPanel';
import { PythonProjectExplorer } from './components/PythonProjectExplorer';
import { IPDetailsModal } from './components/IPDetailsModal';
import { FileUploadModal } from './components/FileUploadModal';
import { CaseManagementPanel } from './components/CaseManagementPanel';
import { AttackSimulatorModal } from './components/AttackSimulatorModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { SystemHealthModal } from './components/SystemHealthModal';
import { DashboardWidgetCustomizer } from './components/DashboardWidgetCustomizer';
import { IncidentPipelineVisualizer } from './components/IncidentPipelineVisualizer';
import { SAMPLE_LOG_PRESETS } from './data/sampleLogs';
import { INITIAL_SEED_CASES } from './data/seedCases';
import { parseLogTextWithStats } from './utils/logParser';
import { analyzeLogs, DEFAULT_DETECTION_RULES } from './utils/analyzer';
import { analyzeCorrelations } from './utils/correlationAnalyzer';
import { detectAttackPatterns } from './utils/attackPatternDetector';
import { generateSimulatedLogEntryWithMeta } from './utils/liveLogGenerator';
import { playSecurityAlertSound } from './utils/audioAlert';
import { generateAttackScenarioLogs, GeneratedSimulationResult } from './utils/attackSimulator';
import { 
  DetectionRules, 
  AnalysisHistoryItem,
  IncidentCase,
  UserRole,
  SOCTheme,
  DashboardWidgetConfig,
  ParsingStats
} from './types';
import { 
  Sliders, 
  RefreshCw, 
  ShieldAlert, 
  Crosshair, 
  Globe, 
  AlertTriangle, 
  X, 
  Zap, 
  Volume2, 
  VolumeX, 
  Flame,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface HighRiskAlertToast {
  id: string;
  title: string;
  description: string;
  ip: string;
  user?: string;
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  timestamp: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'alerts' | 'map' | 'patterns' | 'cases' | 'pipeline' | 'correlation' | 'reports' | 'python'>('dashboard');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('bruteforce-attack');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Find initial preset
  const initialPreset = SAMPLE_LOG_PRESETS.find(p => p.id === 'bruteforce-attack') || SAMPLE_LOG_PRESETS[0];
  const [currentRawLogs, setCurrentRawLogs] = useState<string>(initialPreset.content);
  const [currentFileName, setCurrentFileName] = useState<string>(initialPreset.fileName);

  // Attack Simulator Modal state
  const [showSimulatorModal, setShowSimulatorModal] = useState<boolean>(false);

  // SOC Incident Cases state
  const [incidentCases, setIncidentCases] = useState<IncidentCase[]>(() => {
    try {
      const saved = localStorage.getItem('cyber_incident_cases');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SEED_CASES;
  });

  // Save incident cases to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cyber_incident_cases', JSON.stringify(incidentCases));
    } catch {
      // ignore
    }
  }, [incidentCases]);

  // Detection rules state
  const [rules, setRules] = useState<DetectionRules>(DEFAULT_DETECTION_RULES);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [tempThreshold, setTempThreshold] = useState<number>(rules.failedLoginThreshold);
  const [tempHighRisk, setTempHighRisk] = useState<number>(rules.highRiskThreshold);

  // Blocked and Whitelisted IP sets
  const [blockedIPs, setBlockedIPs] = useState<Set<string>>(new Set());
  const [whitelistedIPs, setWhitelistedIPs] = useState<Set<string>>(new Set());

  // Investigation modal state
  const [investigatingIP, setInvestigatingIP] = useState<string | null>(null);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Active filter for logs tab
  const [eventFilterForLogs, setEventFilterForLogs] = useState<string | null>(null);
  // Real-time log search query for LogSearchBar and LogStreamViewer
  const [logSearchTerm, setLogSearchTerm] = useState<string>('');

  // Auto-Refresh & Periodic Log Re-scanning Feature
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(5);
  const [countdown, setCountdown] = useState<number>(5);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScannedAt, setLastScannedAt] = useState<string | undefined>();
  const [newEntriesDetectedSession, setNewEntriesDetectedSession] = useState<number>(0);
  const [scanNotification, setScanNotification] = useState<{ message: string; timestamp: number } | null>(null);
  const [highRiskToast, setHighRiskToast] = useState<HighRiskAlertToast | null>(null);
  const [isLiveMuted, setIsLiveMuted] = useState<boolean>(false);

  // Theme & Role Persona State
  const [theme, setTheme] = useState<SOCTheme>(() => {
    try {
      const saved = localStorage.getItem('cyber_soc_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem('cyber_soc_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('cyber_user_role');
      if (saved === 'ADMIN' || saved === 'ANALYST' || saved === 'VIEWER') return saved;
    } catch {
      // ignore
    }
    return 'ANALYST';
  });

  useEffect(() => {
    try {
      localStorage.setItem('cyber_user_role', userRole);
    } catch {
      // ignore
    }
  }, [userRole]);

  // Polish Modals State
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showHealthModal, setShowHealthModal] = useState<boolean>(false);

  // Custom Dashboard Widgets State
  const DEFAULT_WIDGETS: DashboardWidgetConfig[] = [
    { id: 'metrics', name: 'Metric KPI Cards', description: 'Total events, failed logins, suspicious IPs, active threats', visible: true, order: 1 },
    { id: 'charts', name: 'Telemetry & IP Charts', description: 'Temporal event velocity and top attacking host distribution', visible: true, order: 2 },
    { id: 'alerts', name: 'Security Alerts Stream', description: 'Active rule violation stream and immediate threshold breaches', visible: true, order: 3 },
    { id: 'suspicious', name: 'Suspicious Host Registry', description: 'Deep host scoring, failed/success ratios, and quick block actions', visible: true, order: 4 },
  ];

  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem('cyber_dashboard_widgets');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_WIDGETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('cyber_dashboard_widgets', JSON.stringify(dashboardWidgets));
    } catch {
      // ignore
    }
  }, [dashboardWidgets]);

  const handleToggleWidget = useCallback((id: string) => {
    setDashboardWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  }, []);

  const handleResetWidgets = useCallback(() => {
    setDashboardWidgets(DEFAULT_WIDGETS);
  }, []);

  const isWidgetVisible = useCallback((id: string) => {
    const widget = dashboardWidgets.find(w => w.id === id);
    return widget ? widget.visible : true;
  }, [dashboardWidgets]);

  // Analysis History (SQLite Simulation)
  const [history, setHistory] = useState<AnalysisHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('cyber_log_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'hist-1',
        fileName: 'sample.log (Initial Scan)',
        analyzedAt: '2026-09-01 10:05:00',
        totalLogs: 5,
        failedLogins: 2,
        suspiciousIPs: 1,
        alertsCount: 1,
        rawLogData: SAMPLE_LOG_PRESETS[0].content
      }
    ];
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cyber_log_history', JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Parse raw logs with parsing metrics telemetry
  const { entries: parsedEntries, stats: parsingStats } = useMemo(() => {
    return parseLogTextWithStats(currentRawLogs);
  }, [currentRawLogs]);

  // Run detection and analytics
  const { summary, suspiciousIPs, alerts, timeSeries, ipMap } = useMemo(() => {
    return analyzeLogs(parsedEntries, rules);
  }, [parsedEntries, rules]);

  // Run Error ↔ Failed Login temporal correlation analyzer
  const correlationAnalysis = useMemo(() => {
    return analyzeCorrelations(parsedEntries, { windowSeconds: 60 });
  }, [parsedEntries]);

  // Run Behavioral Attack Pattern Detection Engine (MITRE ATT&CK heuristics)
  const attackPatterns = useMemo(() => {
    return detectAttackPatterns(parsedEntries);
  }, [parsedEntries]);

  // Transform ipMap for Top IP chart
  const ipChartData = useMemo(() => {
    const list: Array<{ ip: string; failed: number; success: number; total: number }> = [];
    for (const [ip, stat] of ipMap.entries()) {
      list.push({
        ip,
        failed: stat.failedLogins,
        success: stat.totalRequests - stat.failedLogins - stat.errorCount,
        total: stat.totalRequests
      });
    }
    return list;
  }, [ipMap]);

  // Real-time matching logs count for LogSearchBar
  const matchingLogsCount = useMemo(() => {
    if (!logSearchTerm.trim()) {
      return parsedEntries.length;
    }
    const term = logSearchTerm.trim().toLowerCase();
    return parsedEntries.filter(log => {
      const matchStatus = log.statusCode !== undefined && String(log.statusCode).includes(term);
      const matchIP = log.ip.toLowerCase().includes(term);
      const matchEvent = log.event.toLowerCase().includes(term);
      const matchUser = log.user ? log.user.toLowerCase().includes(term) : false;
      const matchMessage = log.message ? log.message.toLowerCase().includes(term) : false;
      const matchPath = log.path ? log.path.toLowerCase().includes(term) : false;
      const matchMethod = log.method ? log.method.toLowerCase().includes(term) : false;
      const matchRaw = log.raw.toLowerCase().includes(term);
      const matchTime = log.timestamp.toLowerCase().includes(term);

      return matchStatus || matchIP || matchEvent || matchUser || matchMessage || matchPath || matchMethod || matchRaw || matchTime;
    }).length;
  }, [parsedEntries, logSearchTerm]);

  // Frequent / suspicious IPs for quick filter chips in LogSearchBar
  const detectedIPList = useMemo(() => {
    return suspiciousIPs.map(s => s.ip);
  }, [suspiciousIPs]);

  // Preset switch handler
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = SAMPLE_LOG_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setCurrentRawLogs(preset.content);
      setCurrentFileName(preset.fileName);

      // Record in history
      const newHistoryItem: AnalysisHistoryItem = {
        id: `hist-${Date.now()}`,
        fileName: preset.fileName,
        analyzedAt: new Date().toLocaleTimeString(),
        totalLogs: preset.content.split('\n').filter(Boolean).length,
        failedLogins: (preset.content.match(/LOGIN_FAILED|Failed password|401/g) || []).length,
        suspiciousIPs: 1,
        alertsCount: 1,
        rawLogData: preset.content
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
    }
  };

  // Custom log file upload or paste handler
  const handleLoadLogContent = (content: string, fileName: string) => {
    setCurrentRawLogs(content);
    setCurrentFileName(fileName);
    setSelectedPresetId('custom');

    const newHistoryItem: AnalysisHistoryItem = {
      id: `hist-${Date.now()}`,
      fileName,
      analyzedAt: new Date().toLocaleTimeString(),
      totalLogs: content.split('\n').filter(Boolean).length,
      failedLogins: (content.match(/LOGIN_FAILED|Failed password|401/g) || []).length,
      suspiciousIPs: 1,
      alertsCount: 1,
      rawLogData: content
    };
    setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
  };

  // Reload an item from history
  const handleLoadHistoryItem = (item: AnalysisHistoryItem) => {
    setCurrentRawLogs(item.rawLogData);
    setCurrentFileName(item.fileName);
  };

  // Toggle firewall block on IP
  const handleToggleBlock = (ip: string) => {
    if (userRole === 'VIEWER') {
      setScanNotification({
        message: 'Action Restricted: Executive Auditor has read-only access. Switch role to Analyst or Admin.',
        timestamp: Date.now()
      });
      setTimeout(() => setScanNotification(null), 4000);
      return;
    }
    setBlockedIPs(prev => {
      const next = new Set(prev);
      if (next.has(ip)) {
        next.delete(ip);
      } else {
        next.add(ip);
        setWhitelistedIPs(w => {
          const nextW = new Set(w);
          nextW.delete(ip);
          return nextW;
        });
      }
      return next;
    });
  };

  // Toggle whitelist on IP
  const handleToggleWhitelist = (ip: string) => {
    if (userRole === 'VIEWER') {
      setScanNotification({
        message: 'Action Restricted: Executive Auditor has read-only access. Switch role to Analyst or Admin.',
        timestamp: Date.now()
      });
      setTimeout(() => setScanNotification(null), 4000);
      return;
    }
    setWhitelistedIPs(prev => {
      const next = new Set(prev);
      if (next.has(ip)) {
        next.delete(ip);
      } else {
        next.add(ip);
        setBlockedIPs(b => {
          const nextB = new Set(b);
          nextB.delete(ip);
          return nextB;
        });
      }
      return next;
    });
  };

  const handleFilterByEvent = (eventType: string) => {
    setEventFilterForLogs(eventType);
    setActiveTab('logs');
  };

  const handleSelectIPForFilter = (ip: string) => {
    setInvestigatingIP(ip);
  };

  const handleRefreshData = () => {
    performLogRescan(false);
  };

  // Periodic Log Re-scanning Execution
  const performLogRescan = useCallback((isAutomatic: boolean = false) => {
    setIsScanning(true);

    setTimeout(() => {
      // Simulate live incoming streaming telemetry tailored to active log dialect
      const meta = generateSimulatedLogEntryWithMeta(currentFileName, selectedPresetId);

      setCurrentRawLogs(prev => {
        const updated = prev ? `${prev.trim()}\n${meta.rawLogLine}` : meta.rawLogLine;
        return updated;
      });

      setNewEntriesDetectedSession(prev => prev + 1);
      const timestamp = new Date().toLocaleTimeString();
      setLastScannedAt(timestamp);
      setIsScanning(false);
      setCountdown(autoRefreshInterval);

      // If this event has high-risk characteristics, trigger SOC audio and toast alert
      if (meta.isHighRisk || meta.threatTitle) {
        playSecurityAlertSound(isLiveMuted);
        setHighRiskToast({
          id: Math.random().toString(),
          title: meta.threatTitle || 'HIGH-RISK ACTIVITY DETECTED',
          description: meta.threatDescription || `Suspicious event from ${meta.ip}`,
          ip: meta.ip,
          user: meta.user,
          level: meta.riskLevel || 'CRITICAL',
          timestamp: Date.now()
        });
      } else {
        setScanNotification({
          message: `Streaming ingestion parsed ${currentFileName}: +1 event from ${meta.ip}`,
          timestamp: Date.now()
        });
        setTimeout(() => setScanNotification(null), 3000);
      }
    }, 320);
  }, [currentFileName, selectedPresetId, autoRefreshInterval, isLiveMuted]);

  // Case Management Handlers
  const handleUpdateCase = (updated: IncidentCase) => {
    if (userRole === 'VIEWER') {
      setScanNotification({
        message: 'Action Restricted: Executive Auditor has read-only access to incident cases.',
        timestamp: Date.now()
      });
      setTimeout(() => setScanNotification(null), 4000);
      return;
    }
    setIncidentCases(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleCreateCase = (newCase: IncidentCase) => {
    if (userRole === 'VIEWER') {
      setScanNotification({
        message: 'Action Restricted: Executive Auditor has read-only access.',
        timestamp: Date.now()
      });
      setTimeout(() => setScanNotification(null), 4000);
      return;
    }
    setIncidentCases(prev => [newCase, ...prev]);
  };

  // Full Attack Scenario Simulation Launcher
  const handleTriggerDirectScenario = useCallback((scenarioId: string) => {
    const result = generateAttackScenarioLogs(scenarioId as any);
    handleInjectSimulationLogs(result);
  }, []);

  // Reset Demo to Initial Baseline
  const handleResetDemo = useCallback(() => {
    const defaultPreset = SAMPLE_LOG_PRESETS[0];
    setSelectedPresetId(defaultPreset.id);
    setCurrentRawLogs(defaultPreset.content);
    setCurrentFileName(defaultPreset.fileName);
    setRules(DEFAULT_DETECTION_RULES);
    setTempThreshold(DEFAULT_DETECTION_RULES.failedLoginThreshold);
    setTempHighRisk(DEFAULT_DETECTION_RULES.highRiskThreshold);
    setBlockedIPs(new Set());
    setWhitelistedIPs(new Set());
    setIncidentCases(INITIAL_SEED_CASES);
    setEventFilterForLogs(null);
    setLogSearchTerm('');
    setNewEntriesDetectedSession(0);
    setHighRiskToast(null);
    try {
      localStorage.removeItem('cyber_incident_cases');
    } catch {
      // ignore
    }
    setScanNotification({
      message: 'Demo baseline reset: Ingestion logs, incident cases, and firewall rules restored.',
      timestamp: Date.now()
    });
    setTimeout(() => setScanNotification(null), 4000);
  }, []);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Command Palette: Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        return;
      }

      // Close modals on Escape
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowShortcutsModal(false);
        setShowHealthModal(false);
        setShowSimulatorModal(false);
        setShowUploadModal(false);
        setShowRulesModal(false);
        setInvestigatingIP(null);
        return;
      }

      if (isInput) return;

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setShowSimulatorModal(prev => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsLiveMuted(prev => {
          const next = !prev;
          if (!next) {
            playSecurityAlertSound(false);
          }
          return next;
        });
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        performLogRescan(false);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setShowHealthModal(prev => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
      } else if (e.key === '1') {
        setActiveTab('dashboard');
      } else if (e.key === '2') {
        setActiveTab('map');
      } else if (e.key === '3') {
        setActiveTab('patterns');
      } else if (e.key === '4') {
        setActiveTab('cases');
      } else if (e.key === '5') {
        setActiveTab('logs');
      } else if (e.key === '6') {
        setActiveTab('alerts');
      } else if (e.key === '7') {
        setActiveTab('correlation');
      } else if (e.key === '8') {
        setActiveTab('reports');
      } else if (e.key === '9') {
        setActiveTab('python');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performLogRescan]);

  const openCasesCount = useMemo(() => {
    return incidentCases.filter(c => c.status !== 'RESOLVED').length;
  }, [incidentCases]);

  // Full Attack Scenario Simulation Launcher
  const handleInjectSimulationLogs = (result: GeneratedSimulationResult) => {
    setCurrentRawLogs(prev => prev ? `${prev.trim()}\n${result.combinedLogText}` : result.combinedLogText);
    setNewEntriesDetectedSession(prev => prev + result.totalEvents);
    setLastScannedAt(new Date().toLocaleTimeString());
    playSecurityAlertSound(isLiveMuted);

    const primaryIP = result.attackerIPs[0] || result.scenario.defaultAttackerIP;

    // Trigger High-Risk SOC Toast
    setHighRiskToast({
      id: Math.random().toString(),
      title: `SIMULATED: ${result.scenario.name.toUpperCase()}`,
      description: `Ingested ${result.totalEvents} synthetic telemetry records. ${primaryIP} targeted.`,
      ip: primaryIP,
      user: result.targetedUsers.slice(0, 3).join(', '),
      level: 'CRITICAL',
      timestamp: Date.now()
    });

    // Automatically provision an active SOC Incident Case for this simulated scenario
    const caseNum = `CASE-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newCase: IncidentCase = {
      id: `case-${Date.now()}`,
      caseNumber: caseNum,
      title: `[Simulated] ${result.scenario.name} (${primaryIP})`,
      severity: result.threatSeverity,
      status: 'INVESTIGATING',
      riskScore: result.primaryRiskScore,
      assignedAnalyst: 'SOC Automated Triage Engine',
      createdAt: new Date().toLocaleTimeString(),
      updatedAt: new Date().toLocaleTimeString(),
      primaryIP: primaryIP,
      associatedIPs: result.attackerIPs,
      targetedUsers: result.targetedUsers,
      mitreTechnique: { id: result.scenario.mitreId, name: result.scenario.mitreName },
      summary: `Automated adversary simulation executed. ${result.scenario.description}`,
      rootCauseAnalysis: `Simulated attack scenario targeting authentication endpoints from ${primaryIP}.`,
      evidenceLogCount: result.totalEvents,
      notes: [
        {
          id: `note-${Date.now()}`,
          author: 'SOC Simulator Engine',
          timestamp: new Date().toLocaleTimeString(),
          content: `Generated ${result.totalEvents} events under MITRE technique ${result.scenario.mitreId} (${result.scenario.mitreName}). Threat score calculated at ${result.primaryRiskScore}/100.`
        }
      ],
      containmentActions: [
        {
          id: `c-act-${Date.now()}-1`,
          type: 'FIREWALL_BLOCK',
          label: `Perimeter Firewall Block (${primaryIP})`,
          status: 'PENDING',
          commandExecuted: `iptables -A INPUT -s ${primaryIP} -j DROP`
        },
        {
          id: `c-act-${Date.now()}-2`,
          type: 'REVOKE_SESSIONS',
          label: `Force Revoke Active Sessions for ${result.targetedUsers[0] || 'account'}`,
          status: 'PENDING',
          commandExecuted: `authctl session revoke --user ${result.targetedUsers[0] || 'root'}`
        }
      ]
    };

    setIncidentCases(prev => [newCase, ...prev]);
  };

  // Demo: Instant multi-event attack burst simulation
  const handleTriggerAttackBurst = () => {
    setIsScanning(true);
    playSecurityAlertSound(isLiveMuted);

    const burstTargetIP = ['203.0.113.45', '194.26.29.111', '103.21.244.0', '185.220.101.5'][Math.floor(Math.random() * 4)];
    const victims = ['root', 'admin', 'sysadmin', 'deploy'];
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const burstLines = victims.map(u => 
      `${timeStr} LOGIN_FAILED ${burstTargetIP} user=${u} reason=invalid_password attack=brute_force`
    ).join('\n');

    setCurrentRawLogs(prev => prev ? `${prev.trim()}\n${burstLines}` : burstLines);
    setNewEntriesDetectedSession(prev => prev + victims.length);
    setLastScannedAt(now.toLocaleTimeString());
    setIsScanning(false);

    setHighRiskToast({
      id: Math.random().toString(),
      title: 'HIGH-VELOCITY ATTACK BURST SIMULATED',
      description: `Detected 4 rapid sequential login failures from ${burstTargetIP} targeting privileged credentials.`,
      ip: burstTargetIP,
      user: 'root/admin',
      level: 'CRITICAL',
      timestamp: Date.now()
    });
  };

  // Periodic Auto-Refresh Effect
  useEffect(() => {
    if (!autoRefreshEnabled) {
      setCountdown(autoRefreshInterval);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          performLogRescan(true);
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, autoRefreshInterval, performLogRescan]);

  // Toggle Auto-Refresh
  const handleToggleAutoRefresh = () => {
    const next = !autoRefreshEnabled;
    setAutoRefreshEnabled(next);
    if (next) {
      setCountdown(autoRefreshInterval);
      setScanNotification({
        message: `Auto-Refresh active: Periodic re-scanning every ${autoRefreshInterval}s`,
        timestamp: Date.now()
      });
      setTimeout(() => setScanNotification(null), 3000);
    } else {
      setScanNotification({
        message: `Auto-Refresh paused`,
        timestamp: Date.now()
      });
      setTimeout(() => setScanNotification(null), 2500);
    }
  };

  const handleChangeInterval = (seconds: number) => {
    setAutoRefreshInterval(seconds);
    setCountdown(seconds);
  };

  const handleApplyRules = () => {
    setRules(prev => ({
      ...prev,
      failedLoginThreshold: tempThreshold,
      highRiskThreshold: tempHighRisk
    }));
    setShowRulesModal(false);
  };

  const activeSuspiciousIP = suspiciousIPs.find(s => s.ip === investigatingIP);

  return (
    <div 
      data-theme={theme}
      className="flex h-screen w-screen bg-[#0B0E14] text-[#E2E8F0] font-sans overflow-hidden select-none"
    >
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertsCount={summary.alertsCount}
        criticalAlertsCount={summary.criticalAlertsCount}
        openCasesCount={openCasesCount}
        correlatedIncidentsCount={correlationAnalysis.correlatedErrorCount}
        attackPatternsCount={attackPatterns.length}
        onOpenUploadModal={() => setShowUploadModal(true)}
        onOpenRulesModal={() => setShowRulesModal(true)}
        onOpenSimulatorModal={() => setShowSimulatorModal(true)}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={userRole}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0B0E14]">
        {/* Top Header with Theme, Role, Command Palette, Auto-Refresh */}
        <Header
          activeTab={activeTab}
          selectedPresetId={selectedPresetId}
          onSelectPreset={handleSelectPreset}
          onOpenUploadModal={() => setShowUploadModal(true)}
          onRefreshData={() => performLogRescan(false)}
          onGenerateReport={() => setActiveTab('reports')}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentFileName={currentFileName}
          autoRefreshEnabled={autoRefreshEnabled}
          onToggleAutoRefresh={handleToggleAutoRefresh}
          autoRefreshInterval={autoRefreshInterval}
          onChangeInterval={handleChangeInterval}
          countdown={countdown}
          isScanning={isScanning}
          lastScannedAt={lastScannedAt}
          newEntriesDetectedSession={newEntriesDetectedSession}
          isLiveMuted={isLiveMuted}
          onToggleMute={() => setIsLiveMuted(!isLiveMuted)}
          onTriggerAttackBurst={handleTriggerAttackBurst}
          theme={theme}
          onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          userRole={userRole}
          onChangeRole={setUserRole}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onOpenShortcutsModal={() => setShowShortcutsModal(true)}
          onOpenHealthModal={() => setShowHealthModal(true)}
          onOpenSimulatorModal={() => setShowSimulatorModal(true)}
          onResetDemo={handleResetDemo}
          stats={parsingStats}
        />

        {/* Scrollable Dashboard View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Real-time High Risk Threat Toast */}
          {highRiskToast && (
            <div 
              id="live-threat-alert-toast"
              className={`p-3.5 rounded-lg border shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 transition-all ${
                highRiskToast.level === 'CRITICAL'
                  ? 'bg-red-950/90 border-red-500/60 text-red-200'
                  : 'bg-amber-950/90 border-amber-500/60 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${highRiskToast.level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'} shrink-0`}>
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold tracking-wide">{highRiskToast.title}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                      highRiskToast.level === 'CRITICAL' ? 'bg-red-500/30 text-red-300' : 'bg-amber-500/30 text-amber-300'
                    }`}>
                      {highRiskToast.level} THREAT
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 font-mono">{highRiskToast.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setInvestigatingIP(highRiskToast.ip);
                    setHighRiskToast(null);
                  }}
                  className="px-2.5 py-1 text-xs font-mono font-semibold rounded bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center gap-1 shadow"
                >
                  <span>Investigate IP</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setHighRiskToast(null)}
                  className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Live Scan Notification Toast */}
          {scanNotification && (
            <div 
              id="live-scan-notification-toast"
              className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-1"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>{scanNotification.message}</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                LIVE UPDATE
              </span>
            </div>
          )}

          {/* Active Policy Strip */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 bg-[#0F172A] border border-[#1E293B] px-4 py-2.5 rounded-lg">
            <div className="flex items-center gap-2 font-mono flex-wrap">
              <span className="text-slate-500">ACTIVE_STREAM:</span>
              <span className="text-blue-400 font-bold">{currentFileName}</span>
              <span className="text-slate-600">•</span>
              <span>{summary.totalLogs} entries</span>
              <span className="text-slate-600">•</span>
              <span className="text-red-400 font-bold">{summary.failedLogins} failed logins</span>
              
              {autoRefreshEnabled && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Auto-scanning ({autoRefreshInterval}s)
                  </span>
                </>
              )}

              {lastScannedAt && (
                <span className="text-slate-500 text-[10px]">
                  Last scan: {lastScannedAt}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 sm:mt-0">
              <span className="text-slate-500 font-mono text-[11px]">Rule:</span>
              <button 
                onClick={() => setShowRulesModal(true)}
                className="font-mono text-amber-400 bg-[#0B0E14] hover:bg-slate-900 px-2 py-0.5 rounded border border-[#334155] text-[11px] transition-colors"
                title="Click to reconfigure threshold"
              >
                Failures &gt; {rules.failedLoginThreshold} = Suspicious (HIGH &gt; {rules.highRiskThreshold})
              </button>

              {activeTab === 'dashboard' && (
                <DashboardWidgetCustomizer
                  widgets={dashboardWidgets}
                  onToggleWidget={handleToggleWidget}
                  onResetWidgets={handleResetWidgets}
                />
              )}
            </div>
          </div>

          {/* 1. DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              {isWidgetVisible('metrics') && (
                <MetricCards
                  summary={summary}
                  onFilterByEvent={handleFilterByEvent}
                  onViewSuspiciousIPs={() => setActiveTab('alerts')}
                  onViewAlerts={() => setActiveTab('alerts')}
                  correlatedIncidentsCount={correlationAnalysis.correlatedErrorCount}
                  onViewCorrelation={() => setActiveTab('correlation')}
                  attackPatternsCount={attackPatterns.length}
                  onViewPatterns={() => setActiveTab('patterns')}
                  onViewThreatMap={() => setActiveTab('map')}
                  onViewPipeline={() => setActiveTab('pipeline')}
                />
              )}

              {/* Charts and Threat Analytics */}
              {isWidgetVisible('charts') && (
                <ChartsSection
                  timeSeries={timeSeries}
                  ipData={ipChartData}
                  summary={summary}
                  onSelectIP={handleSelectIPForFilter}
                />
              )}

              {/* Security Alerts Stream */}
              {isWidgetVisible('alerts') && (
                <SecurityAlertsPanel
                  alerts={alerts}
                  rules={rules}
                  onUpdateRules={setRules}
                  onInvestigateIP={(ip) => setInvestigatingIP(ip)}
                  onBlockIP={handleToggleBlock}
                  blockedIPs={blockedIPs}
                />
              )}

              {/* Suspicious Host Registry */}
              {isWidgetVisible('suspicious') && (
                <SuspiciousIPTable
                  suspiciousIPs={suspiciousIPs}
                  onInvestigateIP={(ip) => setInvestigatingIP(ip)}
                  onToggleBlockIP={handleToggleBlock}
                  onToggleWhitelistIP={handleToggleWhitelist}
                  blockedIPs={blockedIPs}
                  whitelistedIPs={whitelistedIPs}
                />
              )}
            </div>
          )}

          {/* LIVE THREAT RADAR MAP TAB */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              <LiveThreatMap
                entries={parsedEntries}
                suspiciousIPs={suspiciousIPs}
                onInvestigateIP={(ip) => setInvestigatingIP(ip)}
              />
            </div>
          )}

          {/* ATTACK PATTERN DETECTION TAB */}
          {activeTab === 'patterns' && (
            <div className="space-y-4">
              <AttackPatternPanel
                patterns={attackPatterns}
                onInvestigateIP={(ip) => setInvestigatingIP(ip)}
              />
            </div>
          )}

          {/* INCIDENT CASES & RESPONSE TAB */}
          {activeTab === 'cases' && (
            <div className="space-y-4">
              <CaseManagementPanel
                cases={incidentCases}
                onUpdateCase={handleUpdateCase}
                onCreateCase={handleCreateCase}
                onInvestigateIP={(ip) => setInvestigatingIP(ip)}
              />
            </div>
          )}

          {/* SOC INCIDENT RESPONSE LIFECYCLE PIPELINE TAB */}
          {activeTab === 'pipeline' && (
            <div className="space-y-4">
              <IncidentPipelineVisualizer
                cases={incidentCases}
                onBlockIP={handleToggleBlock}
                blockedIPs={Array.from(blockedIPs)}
                logs={parsedEntries}
                rules={rules}
                userRole={userRole}
              />
            </div>
          )}

          {/* 2. LOG STREAM TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Real-time search input bar above LogStreamViewer */}
              <LogSearchBar
                searchTerm={logSearchTerm}
                onSearchChange={setLogSearchTerm}
                totalLogs={parsedEntries.length}
                matchingLogs={matchingLogsCount}
                frequentIPs={detectedIPList}
              />

              <LogStreamViewer
                entries={parsedEntries}
                onSelectIP={(ip) => setInvestigatingIP(ip)}
                activeFilterEvent={eventFilterForLogs}
                onClearFilterEvent={() => setEventFilterForLogs(null)}
                searchTerm={logSearchTerm}
                onSearchChange={setLogSearchTerm}
                stats={parsingStats}
              />
            </div>
          )}

          {/* 3. ALERTS & SUSPICIOUS IPS TAB */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <SecurityAlertsPanel
                alerts={alerts}
                rules={rules}
                onUpdateRules={setRules}
                onInvestigateIP={(ip) => setInvestigatingIP(ip)}
                onBlockIP={handleToggleBlock}
                blockedIPs={blockedIPs}
              />

              <SuspiciousIPTable
                suspiciousIPs={suspiciousIPs}
                onInvestigateIP={(ip) => setInvestigatingIP(ip)}
                onToggleBlockIP={handleToggleBlock}
                onToggleWhitelistIP={handleToggleWhitelist}
                blockedIPs={blockedIPs}
                whitelistedIPs={whitelistedIPs}
              />
            </div>
          )}

          {/* 4. CORRELATION ANALYZER TAB */}
          {activeTab === 'correlation' && (
            <div className="space-y-4">
              <CorrelationAnalyzerPanel
                entries={parsedEntries}
                onInvestigateIP={(ip) => setInvestigatingIP(ip)}
                onFilterByEvent={handleFilterByEvent}
              />
            </div>
          )}

          {/* 5. REPORTS & AUDIT HISTORY TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <ReportsPanel
                entries={parsedEntries}
                summary={summary}
                alerts={alerts}
                suspiciousIPs={suspiciousIPs}
                activeFileName={currentFileName}
                history={history}
                onLoadHistoryItem={handleLoadHistoryItem}
              />
            </div>
          )}

          {/* 6. PYTHON ARCHITECTURE & INTERVIEW PLAN TAB */}
          {activeTab === 'python' && (
            <div className="space-y-4">
              <PythonProjectExplorer
                entries={parsedEntries}
                rawLogContent={currentRawLogs}
                onLaunchSimulator={() => setShowSimulatorModal(true)}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Forensic Inspection Modal */}
      {investigatingIP && (
        <IPDetailsModal
          ip={investigatingIP}
          suspiciousData={activeSuspiciousIP}
          entries={parsedEntries}
          onClose={() => setInvestigatingIP(null)}
          onToggleBlock={handleToggleBlock}
          onToggleWhitelist={handleToggleWhitelist}
          isBlocked={blockedIPs.has(investigatingIP)}
          isWhitelisted={whitelistedIPs.has(investigatingIP)}
        />
      )}

      {/* Attack Simulator Modal */}
      <AttackSimulatorModal
        isOpen={showSimulatorModal}
        onClose={() => setShowSimulatorModal(false)}
        onInjectLogs={handleInjectSimulationLogs}
        activeFileName={currentFileName}
        onInvestigateIP={(ip) => setInvestigatingIP(ip)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Ingestion & Upload Modal */}
      {showUploadModal && (
        <FileUploadModal
          onClose={() => setShowUploadModal(false)}
          onLoadLogContent={handleLoadLogContent}
        />
      )}

      {/* Detection Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
          <div className="bg-[#0F172A] border border-[#334155] rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Detection Rule Configuration
                </h3>
              </div>
              <button 
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Suspicious Failed Login Threshold: <span className="text-orange-400 font-mono text-sm">{tempThreshold} attempts</span>
                </label>
                <p className="text-slate-500 text-[11px] mb-2 font-mono">
                  Default: More than 5 failed attempts → Suspicious
                </p>
                <input 
                  type="range" 
                  min="2" 
                  max="20" 
                  value={tempThreshold}
                  onChange={(e) => setTempThreshold(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  HIGH / CRITICAL Risk Threshold: <span className="text-red-400 font-mono text-sm">{tempHighRisk} attempts</span>
                </label>
                <p className="text-slate-500 text-[11px] mb-2 font-mono">
                  Elevates incident to HIGH severity alert format.
                </p>
                <input 
                  type="range" 
                  min="5" 
                  max="30" 
                  value={tempHighRisk}
                  onChange={(e) => setTempHighRisk(parseInt(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-3 py-1.5 rounded text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyRules}
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-900/30"
              >
                Save & Apply Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Command & Search Palette Modal */}
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setShowCommandPalette(false);
        }}
        onLaunchSimulationModal={() => {
          setShowCommandPalette(false);
          setShowSimulatorModal(true);
        }}
        onTriggerDirectScenario={(scenarioId) => {
          handleTriggerDirectScenario(scenarioId);
          setShowCommandPalette(false);
        }}
        onToggleSound={() => {
          setIsLiveMuted(prev => {
            const next = !prev;
            if (!next) {
              playSecurityAlertSound(false);
            }
            return next;
          });
        }}
        isLiveMuted={isLiveMuted}
        onToggleAutoRefresh={handleToggleAutoRefresh}
        autoRefreshEnabled={autoRefreshEnabled}
        onOpenRulesModal={() => {
          setShowCommandPalette(false);
          setShowRulesModal(true);
        }}
        onOpenUploadModal={() => {
          setShowCommandPalette(false);
          setShowUploadModal(true);
        }}
        onOpenHealthModal={() => {
          setShowCommandPalette(false);
          setShowHealthModal(true);
        }}
        onResetDemo={handleResetDemo}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        theme={theme}
        userRole={userRole}
        onChangeRole={setUserRole}
        suspiciousIPs={suspiciousIPs}
        onInvestigateIP={(ip) => {
          setInvestigatingIP(ip);
          setShowCommandPalette(false);
        }}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* System Health Telemetry Modal */}
      <SystemHealthModal
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        stats={parsingStats}
        totalParsedEvents={summary.totalLogs}
        activePresetName={currentFileName}
        autoRefreshEnabled={autoRefreshEnabled}
      />
    </div>
  );
}
