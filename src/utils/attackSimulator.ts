import { SimulationScenario, SimulationScenarioId, RiskLevel } from '../types';

export type { SimulationScenario, SimulationScenarioId };

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'SSH_BRUTE_FORCE',
    name: 'Privileged SSH / Vertical Brute-Force',
    category: 'Credential Access',
    mitreId: 'T1110.001',
    mitreName: 'Brute Force: Password Guessing',
    description: 'A single high-velocity threat actor IP attempts dozens of rapid dictionary passwords against root and admin accounts.',
    defaultAttackerIP: '203.0.113.45',
    defaultTargetUsers: ['root', 'admin', 'administrator', 'sysadmin'],
    defaultBurstCount: 8,
    riskScore: 92
  },
  {
    id: 'PASSWORD_SPRAY',
    name: 'Horizontal Active Directory Password Spray',
    category: 'Credential Access',
    mitreId: 'T1110.003',
    mitreName: 'Brute Force: Password Spraying',
    description: 'Adversary tests a single seasonal password (e.g. Spring2026!) across multiple distinct corporate email identities to evade per-account lockouts.',
    defaultAttackerIP: '194.26.29.111',
    defaultTargetUsers: ['alice.smith', 'bob.johnson', 'carol.danvers', 'david.k', 'eva.green', 'frank.miller', 'grace.hopper'],
    defaultBurstCount: 7,
    riskScore: 88
  },
  {
    id: 'CREDENTIAL_STUFFING',
    name: 'Distributed Botnet Credential Stuffing',
    category: 'Credential Access',
    mitreId: 'T1110.004',
    mitreName: 'Brute Force: Credential Stuffing',
    description: 'Coordinated attack originating from multiple rotating proxy/VPN IP nodes simultaneously hammering high-value financial & executive accounts.',
    defaultAttackerIP: '103.21.244.0',
    defaultTargetUsers: ['cfo_finance', 'api_gateway_admin', 'exec_director'],
    defaultBurstCount: 9,
    riskScore: 95
  },
  {
    id: 'PATH_PROBE_RECON',
    name: 'Reconnaissance & Vulnerability Path Probe',
    category: 'Reconnaissance',
    mitreId: 'T1595.002',
    mitreName: 'Active Scanning: Vulnerability Scanning',
    description: 'Automated crawler aggressively probing sensitive environment files, git repositories, and unauthenticated administrative consoles.',
    defaultAttackerIP: '185.220.101.5',
    defaultTargetUsers: ['guest', 'anonymous'],
    defaultBurstCount: 8,
    riskScore: 84
  },
  {
    id: 'SQL_INJECTION',
    name: 'Malicious Web Application SQL Injection',
    category: 'Initial Access',
    mitreId: 'T1190',
    mitreName: 'Exploit Public-Facing Application',
    description: 'Attack vectors containing SQL injection payloads such as OR 1=1 and UNION SELECT targeting the authentication endpoints.',
    defaultAttackerIP: '45.154.255.89',
    defaultTargetUsers: ["admin' OR '1'='1", "root' --", "test' UNION SELECT 1,2--"],
    defaultBurstCount: 6,
    riskScore: 96
  },
  {
    id: 'OFF_HOURS_VOLUMETRIC',
    name: 'Off-Hours Volumetric Authentication Spike',
    category: 'Impact',
    mitreId: 'T1499.003',
    mitreName: 'Endpoint Denial of Service',
    description: 'Volumetric login burst initiated outside normal business operational hours (03:15 AM UTC) to exhaust system authentication rate limiters.',
    defaultAttackerIP: '91.240.118.172',
    defaultTargetUsers: ['service_account', 'ldap_sync', 'backup_user', 'jenkins_worker'],
    defaultBurstCount: 10,
    riskScore: 82
  }
];

export interface GeneratedSimulationResult {
  scenario: SimulationScenario;
  rawLogLines: string[];
  combinedLogText: string;
  totalEvents: number;
  attackerIPs: string[];
  targetedUsers: string[];
  primaryRiskScore: number;
  threatSeverity: RiskLevel;
}

export function generateAttackScenarioLogs(
  scenarioId: SimulationScenarioId,
  overrideIP?: string,
  eventCount?: number,
  activeFileName?: string
): GeneratedSimulationResult {
  const scenario = SIMULATION_SCENARIOS.find(s => s.id === scenarioId) || SIMULATION_SCENARIOS[0];
  const attackerIP = overrideIP && overrideIP.trim() !== '' ? overrideIP.trim() : scenario.defaultAttackerIP;
  const count = eventCount && eventCount > 0 ? eventCount : scenario.defaultBurstCount;
  
  const isWebLog = activeFileName?.toLowerCase().includes('apache') || activeFileName?.toLowerCase().includes('access');
  const isSyslog = activeFileName?.toLowerCase().includes('syslog');

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  
  // Rotating IPs for credential stuffing scenario
  const rotatingBotnetIPs = [
    attackerIP,
    '103.21.244.15',
    '103.21.244.38',
    '194.26.29.88',
    '185.220.101.42',
    '45.154.255.12',
    '91.240.118.55'
  ];

  const sensitivePaths = [
    '/.env',
    '/.git/config',
    '/wp-login.php',
    '/actuator/env',
    '/actuator/health',
    '/api/v1/debug/keys',
    '/phpmyadmin/index.php',
    '/aws/credentials'
  ];

  const lines: string[] = [];
  const usedUsers = new Set<string>();
  const usedIPs = new Set<string>();

  for (let i = 0; i < count; i++) {
    // increment seconds slightly
    const secOffset = i * 2;
    const eventTime = new Date(now.getTime() + secOffset * 1000);
    const eventTimeStr = `${eventTime.getFullYear()}-${pad(eventTime.getMonth()+1)}-${pad(eventTime.getDate())} ${pad(eventTime.getHours())}:${pad(eventTime.getMinutes())}:${pad(eventTime.getSeconds())}`;
    const apacheDateStr = `${pad(eventTime.getDate())}/Sep/${eventTime.getFullYear()}:${pad(eventTime.getHours())}:${pad(eventTime.getMinutes())}:${pad(eventTime.getSeconds())} +0000`;
    const syslogDateStr = `Sep ${eventTime.getDate()} ${pad(eventTime.getHours())}:${pad(eventTime.getMinutes())}:${pad(eventTime.getSeconds())}`;

    let currentIP = attackerIP;
    let currentUser = scenario.defaultTargetUsers[i % scenario.defaultTargetUsers.length];

    if (scenarioId === 'CREDENTIAL_STUFFING') {
      currentIP = rotatingBotnetIPs[i % rotatingBotnetIPs.length];
      currentUser = scenario.defaultTargetUsers[0]; // All botnet hits target the single high-value identity
    } else if (scenarioId === 'SSH_BRUTE_FORCE') {
      currentUser = scenario.defaultTargetUsers[i % scenario.defaultTargetUsers.length];
    } else if (scenarioId === 'PATH_PROBE_RECON') {
      currentUser = 'anonymous';
    }

    usedUsers.add(currentUser);
    usedIPs.add(currentIP);

    let logLine = '';

    if (scenarioId === 'PATH_PROBE_RECON') {
      const probePath = sensitivePaths[i % sensitivePaths.length];
      if (isWebLog) {
        logLine = `${currentIP} - - [${apacheDateStr}] "GET ${probePath} HTTP/1.1" 403 287 "-" "Mozilla/5.0 (compatible; ReconScanner/2.4)"`;
      } else {
        logLine = `${eventTimeStr} ACCESS_DENIED ${currentIP} path=${probePath} user=anonymous status=403 msg="Probing unauthorized path"`;
      }
    } else if (scenarioId === 'SQL_INJECTION') {
      const sqliPayload = scenario.defaultTargetUsers[i % scenario.defaultTargetUsers.length];
      if (isWebLog) {
        const encoded = encodeURIComponent(sqliPayload);
        logLine = `${currentIP} - - [${apacheDateStr}] "POST /api/v1/auth/login HTTP/1.1" 401 542 "user=${encoded}" "sqlmap/1.7.2#stable"`;
      } else {
        logLine = `${eventTimeStr} LOGIN_FAILED ${currentIP} user="${sqliPayload}" reason=sql_syntax_error status=401 vector=SQLi`;
      }
    } else if (isWebLog) {
      logLine = `${currentIP} - ${currentUser} [${apacheDateStr}] "POST /login HTTP/1.1" 401 128 "https://auth.corp.local" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"`;
    } else if (isSyslog) {
      logLine = `${syslogDateStr} corporate-gateway sshd[${28000 + i}]: Failed password for ${currentUser} from ${currentIP} port ${41000 + i} ssh2`;
    } else {
      // Standard auth log dialect
      const failureReason = scenarioId === 'PASSWORD_SPRAY' 
        ? 'invalid_password_spray' 
        : scenarioId === 'CREDENTIAL_STUFFING' 
          ? 'credential_dump_match_failed' 
          : 'invalid_password';
      logLine = `${eventTimeStr} LOGIN_FAILED ${currentIP} user=${currentUser} reason=${failureReason} attack=${scenarioId.toLowerCase()}`;
    }

    lines.push(logLine);
  }

  const threatSeverity: RiskLevel = 
    scenario.riskScore >= 90 ? 'CRITICAL' : scenario.riskScore >= 75 ? 'HIGH' : 'MEDIUM';

  return {
    scenario,
    rawLogLines: lines,
    combinedLogText: lines.join('\n'),
    totalEvents: lines.length,
    attackerIPs: Array.from(usedIPs),
    targetedUsers: Array.from(usedUsers),
    primaryRiskScore: scenario.riskScore,
    threatSeverity
  };
}
