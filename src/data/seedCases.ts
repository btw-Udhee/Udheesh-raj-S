import { IncidentCase } from '../types';

export const INITIAL_SEED_CASES: IncidentCase[] = [
  {
    id: 'case-001',
    caseNumber: 'CASE-2026-081',
    title: 'High-Velocity Vertical SSH Brute-Force against Privileged Accounts',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    riskScore: 94,
    assignedAnalyst: 'Analyst Sarah M. (SOC Tier-2)',
    createdAt: '10:42:15 AM',
    updatedAt: '10:48:30 AM',
    primaryIP: '203.0.113.45',
    associatedIPs: ['203.0.113.45'],
    targetedUsers: ['root', 'admin', 'sysadmin', 'deploy'],
    mitreTechnique: { id: 'T1110.001', name: 'Password Guessing' },
    summary: 'Automated adversary bot identified executing 14 rapid authentication attempts within 45 seconds targeting administrative credentials. Attack pattern matched vertical brute-force heuristic with elevated failure velocity.',
    rootCauseAnalysis: 'Publicly exposed SSH / management gateway without IP rate limiting or fail2ban jail enabled. Attacker utilizing automated hydra-style dictionary attack.',
    evidenceLogCount: 14,
    notes: [
      {
        id: 'note-1',
        author: 'SOC Ingestion Engine',
        timestamp: '10:42:15 AM',
        content: 'Alert elevated to Incident Case based on Failure Threshold > 5 and target="root".'
      },
      {
        id: 'note-2',
        author: 'Analyst Sarah M.',
        timestamp: '10:45:00 AM',
        content: 'Confirmed adversary origin IP 203.0.113.45 is flagged in threat intelligence feeds as a known Russian bulletproof hosting proxy.'
      }
    ],
    containmentActions: [
      {
        id: 'c-act-1',
        type: 'FIREWALL_BLOCK',
        label: 'Perimeter Firewall Block (203.0.113.45)',
        status: 'PENDING',
        commandExecuted: 'iptables -A INPUT -s 203.0.113.45 -j DROP'
      },
      {
        id: 'c-act-2',
        type: 'REVOKE_SESSIONS',
        label: 'Force Terminate Active Root Sessions',
        status: 'PENDING',
        commandExecuted: 'pkill -u root -t pts/0'
      }
    ]
  },
  {
    id: 'case-002',
    caseNumber: 'CASE-2026-078',
    title: 'Distributed Horizontal Password Spraying targeting Enterprise Accounts',
    severity: 'HIGH',
    status: 'CONTAINED',
    riskScore: 86,
    assignedAnalyst: 'Incident Commander David R.',
    createdAt: '08:15:20 AM',
    updatedAt: '09:02:11 AM',
    primaryIP: '194.26.29.111',
    associatedIPs: ['194.26.29.111'],
    targetedUsers: ['alice.smith', 'bob.johnson', 'carol.danvers', 'david.k'],
    mitreTechnique: { id: 'T1110.003', name: 'Password Spraying' },
    summary: 'Low-and-slow authentication attempts observed hitting 7 distinct employee directory accounts using uniform password variants to bypass single-account lockout policies.',
    rootCauseAnalysis: 'Adversary leveraged compromised employee directory list obtained from previous breach data.',
    evidenceLogCount: 9,
    notes: [
      {
        id: 'note-3',
        author: 'Incident Commander David R.',
        timestamp: '08:45:10 AM',
        content: 'Executed perimeter block via cloudflare WAF rule set. Zero successful logins occurred.'
      }
    ],
    containmentActions: [
      {
        id: 'c-act-3',
        type: 'FIREWALL_BLOCK',
        label: 'Perimeter WAF IP-Set Null-Route',
        status: 'EXECUTED',
        executedAt: '08:44:50 AM',
        commandExecuted: 'aws wafv2 update-ip-set --name BlockedAdversaries --addresses 194.26.29.111/32'
      }
    ]
  },
  {
    id: 'case-003',
    caseNumber: 'CASE-2026-064',
    title: 'Automated Vulnerability Path Reconnaissance & Environment File Probing',
    severity: 'MEDIUM',
    status: 'TRIAGED',
    riskScore: 72,
    assignedAnalyst: 'Forensic Investigator Alex T.',
    createdAt: '04:30:12 AM',
    updatedAt: '05:10:00 AM',
    primaryIP: '185.220.101.5',
    associatedIPs: ['185.220.101.5'],
    targetedUsers: ['anonymous', 'guest'],
    mitreTechnique: { id: 'T1595.002', name: 'Vulnerability Scanning' },
    summary: 'Crawler systematically requesting sensitive endpoints including /.env, /.git/config, and /wp-login.php returning 403 Forbidden status codes.',
    rootCauseAnalysis: 'General internet reconnaissance scan originating from Tor exit node.',
    evidenceLogCount: 11,
    notes: [
      {
        id: 'note-4',
        author: 'Forensic Investigator Alex T.',
        timestamp: '05:00:22 AM',
        content: 'All endpoints appropriately returned 403. No data exfiltration detected.'
      }
    ],
    containmentActions: [
      {
        id: 'c-act-4',
        type: 'QUARANTINE_IP',
        label: 'Add IP to Nginx Rate Limit Jail',
        status: 'PENDING',
        commandExecuted: 'fail2ban-client set nginx-badbots banip 185.220.101.5'
      }
    ]
  }
];
