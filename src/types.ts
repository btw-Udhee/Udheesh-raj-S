export type EventType = 
  | 'LOGIN_SUCCESS' 
  | 'LOGIN_FAILED' 
  | 'ERROR' 
  | 'WARNING' 
  | 'INFO' 
  | 'ACCESS_GRANTED' 
  | 'ACCESS_DENIED'
  | 'SESSION_TIMEOUT';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface LogEntry {
  id: string;
  raw: string;
  timestamp: string; // ISO or formatted date
  timestampObj: Date;
  event: EventType;
  ip: string;
  user?: string;
  message?: string;
  statusCode?: number;
  method?: string;
  path?: string;
  isFlagged?: boolean;
  failureReason?: string; // Cause/Reason for failed authentication or access denial
}

export interface SuspiciousIP {
  ip: string;
  failedLogins: number;
  totalRequests: number;
  errorCount: number;
  firstSeen: string;
  lastSeen: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0 - 100
  reasons: string[];
  isBlocked?: boolean;
  isWhitelisted?: boolean;
  country?: string;
  associatedUsers: string[];
  failureReasons?: { reason: string; count: number }[];
  primaryFailureReason?: string;
}

export interface SecurityAlert {
  id: string;
  ip: string;
  title: string;
  description: string;
  failedCount: number;
  riskLevel: RiskLevel;
  timestamp: string;
  ruleTriggered: string;
  dismissed?: boolean;
}

export interface DetectionRules {
  failedLoginThreshold: number; // e.g. 5
  highRiskThreshold: number;   // e.g. 10
  errorRateThreshold: number;  // e.g. 8
  flagUnknownIPs: boolean;
  rapidRequestsThreshold: number; // e.g. 15 requests in 60s
}

export interface TimeSeriesDataPoint {
  timeLabel: string;
  timestamp: number;
  total: number;
  failedLogins: number;
  successLogins: number;
  errors: number;
}

export interface AnalysisSummary {
  totalLogs: number;
  successfulLogins: number;
  failedLogins: number;
  errorCount: number;
  infoCount: number;
  warningCount: number;
  uniqueIPsCount: number;
  suspiciousIPsCount: number;
  alertsCount: number;
  criticalAlertsCount: number;
  timeRange: {
    start: string;
    end: string;
  };
  failureReasonsBreakdown?: { reason: string; count: number; percentage: number }[];
  topFailureReason?: string;
}

export interface AnalysisHistoryItem {
  id: string;
  fileName: string;
  analyzedAt: string;
  totalLogs: number;
  failedLogins: number;
  suspiciousIPs: number;
  alertsCount: number;
  rawLogData: string;
}

export type CorrelationCausality = 
  | 'SYSTEM_ERROR_TRIGGERED_AUTH_FAILURES' // System error occurred first -> followed by failed logins
  | 'ATTACK_TRIGGERED_SYSTEM_ERROR'        // High volume failed logins -> followed by system error
  | 'COINCIDENTAL_PROXIMITY';              // Close in time, but likely independent or isolated

export interface CorrelatedFailedLogin {
  log: LogEntry;
  timeDeltaSeconds: number; // positive: failed login occurred after error; negative: failed login occurred before error
  isSameIP: boolean;
}

export interface CorrelatedErrorIncident {
  id: string;
  errorLog: LogEntry;
  errorTimestamp: string;
  errorSignature: string;
  correlatedFailuresCount: number;
  correlatedFailures: CorrelatedFailedLogin[];
  affectedUsers: string[];
  affectedIPs: string[];
  avgDeltaSeconds: number;
  minDeltaSeconds: number;
  maxDeltaSeconds: number;
  causality: CorrelationCausality;
  confidenceScore: number; // 0 to 100
  rootCauseAnalysis: string;
  recommendedAction: string;
}

export interface CorrelationAnalysisResult {
  windowSeconds: number;
  totalErrorLogs: number;
  totalFailedLogins: number;
  correlatedErrorCount: number;
  correlatedFailuresCount: number;
  overallCorrelationRatio: number;
  incidents: CorrelatedErrorIncident[];
  topErrorTriggers: { errorSignature: string; failureCount: number; incidentCount: number }[];
  timelineEvents: Array<{
    id: string;
    type: 'ERROR' | 'LOGIN_FAILED';
    timestamp: string;
    timestampMs: number;
    log: LogEntry;
    incidentId?: string;
    deltaToErrorSeconds?: number;
    relatedErrorSignature?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Attack Pattern Detection Types
// ---------------------------------------------------------------------------
export type AttackPatternType =
  | 'BRUTE_FORCE'                 // Rapid repeated failures targeting single account from one IP
  | 'PASSWORD_SPRAYING'            // Low-and-slow auth attempts across multiple distinct users from one IP
  | 'CREDENTIAL_STUFFING'          // Rapid testing of distinct user/pass pairs from leaked credentials
  | 'PORT_SCAN_PATH_PROBE'         // Probing multiple sensitive endpoints/ports (.env, wp-login, admin, etc.)
  | 'SENSITIVE_ENDPOINT_ABUSE'     // Sustained unauthorized hits against protected endpoints
  | 'MULTI_USER_DICTIONARY_ATTACK' // One IP attempting multiple distinct accounts (horizontal enumeration)
  | 'DISTRIBUTED_BRUTE_FORCE';     // One username targeted by multiple distinct IPs (botnet swarm)

export interface AttackPattern {
  id: string;
  type: AttackPatternType;
  title: string;
  severity: RiskLevel;
  sourceIPs: string[];
  targetedUsers: string[];
  targetedEndpoints: string[];
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
  mitreTechnique: { id: string; name: string; url: string };
  confidenceScore: number; // 0 - 100
  description: string;
  indicators: string[];
  recommendedAction: string;
}

// ---------------------------------------------------------------------------
// IP Geolocation & Live Threat Map Types
// ---------------------------------------------------------------------------
export interface GeoLocationData {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  asn?: string;
  isIndia: boolean;
  threatLevel: RiskLevel;
  attackCount: number;
  attackTypes: string[];
  lastAttackTimestamp: string;
}

export interface LiveThreatEvent {
  id: string;
  timestamp: string;
  sourceGeo: GeoLocationData;
  targetCity: string;
  targetCountry: string;
  attackType: string;
  severity: RiskLevel;
  user?: string;
  endpoint?: string;
}

// ---------------------------------------------------------------------------
// Incident Case Management Types
// ---------------------------------------------------------------------------
export type IncidentStatus = 'NEW' | 'TRIAGED' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED';

export interface CaseAnalystNote {
  id: string;
  author: string;
  timestamp: string;
  content: string;
}

export interface CaseContainmentAction {
  id: string;
  type: 'FIREWALL_BLOCK' | 'REVOKE_SESSIONS' | 'QUARANTINE_IP' | 'NOTIFY_TEAM';
  label: string;
  status: 'PENDING' | 'EXECUTED';
  executedAt?: string;
  commandExecuted?: string;
}

export interface IncidentCase {
  id: string;
  caseNumber: string; // e.g. "CASE-2026-081"
  title: string;
  severity: RiskLevel;
  status: IncidentStatus;
  riskScore: number; // 0 - 100
  assignedAnalyst: string;
  createdAt: string;
  updatedAt: string;
  primaryIP: string;
  associatedIPs: string[];
  targetedUsers: string[];
  mitreTechnique?: { id: string; name: string };
  summary: string;
  rootCauseAnalysis?: string;
  evidenceLogCount: number;
  notes: CaseAnalystNote[];
  containmentActions: CaseContainmentAction[];
}

// ---------------------------------------------------------------------------
// Attack Simulation Scenario Types
// ---------------------------------------------------------------------------
export type SimulationScenarioId =
  | 'SSH_BRUTE_FORCE'
  | 'PASSWORD_SPRAY'
  | 'CREDENTIAL_STUFFING'
  | 'PATH_PROBE_RECON'
  | 'SQL_INJECTION'
  | 'OFF_HOURS_VOLUMETRIC';

export interface SimulationScenario {
  id: SimulationScenarioId;
  name: string;
  category: 'Credential Access' | 'Reconnaissance' | 'Initial Access' | 'Impact';
  mitreId: string;
  mitreName: string;
  description: string;
  defaultAttackerIP: string;
  defaultTargetUsers: string[];
  defaultBurstCount: number;
  riskScore: number;
}

// ---------------------------------------------------------------------------
// Polish & System Configuration Types
// ---------------------------------------------------------------------------
export type UserRole = 'ANALYST' | 'ADMIN' | 'VIEWER';
export type SOCTheme = 'dark' | 'light';

export interface ParsingStats {
  totalLines: number;
  parsedCount: number;
  emptyLinesCount: number;
  errorLinesCount: number;
  bytesTotal: number;
  durationMs: number;
  throughputEventsPerSec: number;
}

export type TimeRangeFilter = 'ALL' | '15M' | '1H' | '6H' | '24H' | 'OFF_HOURS';

export interface DashboardWidgetConfig {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  order: number;
}
