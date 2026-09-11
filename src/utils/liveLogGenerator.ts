/**
 * Utility to generate realistic streaming log entries during live streaming / auto-refresh.
 * Generates events matching the active log file dialect (Standard, Apache, Syslog)
 * and produces realistic attack pattern sequences (Brute-force bursts, Password sprays, Path probes).
 */

export interface GeneratedEventMeta {
  rawLogLine: string;
  isHighRisk: boolean;
  event: 'LOGIN_FAILED' | 'LOGIN_SUCCESS' | 'ERROR' | 'PROBE';
  ip: string;
  user?: string;
  threatTitle?: string;
  threatDescription?: string;
  riskLevel?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

const GLOBAL_ATTACKER_IPS = [
  '203.0.113.45',
  '194.26.29.111',
  '185.220.101.5',
  '45.33.32.156',
  '198.51.100.89',
  '185.190.140.22'
];

const INDIA_ATTACKER_IPS = [
  '103.21.244.0',
  '49.36.120.18',
  '103.48.196.22',
  '117.211.89.5',
  '14.139.180.2',
  '182.72.10.45',
  '103.152.112.4'
];

const INTERNAL_CORPORATE_IPS = [
  '192.168.1.10',
  '192.168.1.5',
  '10.0.0.42',
  '10.0.2.45',
  '192.168.1.15'
];

const ALL_ATTACKER_IPS = [...GLOBAL_ATTACKER_IPS, ...INDIA_ATTACKER_IPS, '192.168.1.10'];

const USERNAMES = [
  'admin',
  'root',
  'administrator',
  'guest',
  'sysadmin',
  'operator',
  'postgres',
  'backup',
  'deploy',
  'sarah_admin',
  'dev_lead',
  'finance_mgr'
];

const PROBE_PATHS = [
  '/.env',
  '/wp-login.php',
  '/admin/config.php',
  '/.git/config',
  '/actuator/env',
  '/api/v1/auth',
  '/phpmyadmin/index.php',
  '/api/secrets'
];

const FAILURE_REASONS = [
  'invalid_password',
  'user_not_found',
  'account_locked',
  'mfa_challenge_failed',
  'password_expired',
  'bad_credentials',
  'ip_rate_limited'
];

function formatStandardDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

function formatApacheDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = pad(d.getDate());
  const m = months[d.getMonth()];
  const y = d.getFullYear();
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${day}/${m}/${y}:${h}:${min}:${s} +0000`;
}

function formatSyslogDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, ' ');
  const m = months[d.getMonth()];
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${m} ${day} ${h}:${min}:${s}`;
}

/**
 * Generates realistic streaming log entries with rich threat metadata.
 */
export function generateSimulatedLogEntry(fileName: string, presetId: string): string {
  const meta = generateSimulatedLogEntryWithMeta(fileName, presetId);
  return meta.rawLogLine;
}

/**
 * Generates an event along with risk metadata for live notifications
 */
export function generateSimulatedLogEntryWithMeta(fileName: string, presetId: string): GeneratedEventMeta {
  const now = new Date();
  const isApache = fileName.toLowerCase().includes('apache') || 
                   fileName.toLowerCase().includes('access') || 
                   presetId.includes('web');
  const isSyslog = fileName.toLowerCase().includes('syslog') || 
                   fileName.toLowerCase().includes('messages');

  // Roll scenario:
  // 65% failed/suspicious attack, 20% benign, 15% path probe/error
  const roll = Math.random();

  if (roll < 0.20) {
    // Benign success
    const ip = INTERNAL_CORPORATE_IPS[Math.floor(Math.random() * INTERNAL_CORPORATE_IPS.length)];
    const user = USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
    if (isApache) {
      return {
        rawLogLine: `${ip} - - [${formatApacheDate(now)}] "GET /dashboard HTTP/1.1" 200 4230`,
        isHighRisk: false,
        event: 'LOGIN_SUCCESS',
        ip,
        user
      };
    }
    if (isSyslog) {
      const pid = Math.floor(Math.random() * 9000) + 1000;
      return {
        rawLogLine: `${formatSyslogDate(now)} sec-node-01 sshd[${pid}]: Accepted publickey for ${user} from ${ip} port 22 ssh2`,
        isHighRisk: false,
        event: 'LOGIN_SUCCESS',
        ip,
        user
      };
    }
    return {
      rawLogLine: `${formatStandardDate(now)} LOGIN_SUCCESS ${ip} user=${user}`,
      isHighRisk: false,
      event: 'LOGIN_SUCCESS',
      ip,
      user
    };
  }

  if (roll < 0.35) {
    // Reconnaissance / Path Probing
    const ip = ALL_ATTACKER_IPS[Math.floor(Math.random() * ALL_ATTACKER_IPS.length)];
    const path = PROBE_PATHS[Math.floor(Math.random() * PROBE_PATHS.length)];
    const timeStr = formatStandardDate(now);

    if (isApache) {
      return {
        rawLogLine: `${ip} - - [${formatApacheDate(now)}] "GET ${path} HTTP/1.1" 404 198`,
        isHighRisk: true,
        event: 'PROBE',
        ip,
        threatTitle: 'SENSITIVE PATH PROBE DETECTED',
        threatDescription: `Adversary ${ip} actively probed restricted resource '${path}'`,
        riskLevel: 'HIGH'
      };
    }

    return {
      rawLogLine: `${timeStr} WARNING ${ip} path_probe target=${path} status=404`,
      isHighRisk: true,
      event: 'PROBE',
      ip,
      threatTitle: 'SECURITY RECONNAISSANCE DETECTED',
      threatDescription: `Host ${ip} probed confidential configuration endpoint '${path}'`,
      riskLevel: 'HIGH'
    };
  }

  // Failed Login / Brute Force / Spraying
  const ip = ALL_ATTACKER_IPS[Math.floor(Math.random() * ALL_ATTACKER_IPS.length)];
  const user = USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
  const reason = FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)];

  const isHighRisk = ['203.0.113.45', '194.26.29.111', '185.220.101.5', '103.21.244.0', '192.168.1.10'].includes(ip);

  if (isApache) {
    const status = Math.random() < 0.7 ? 401 : 403;
    return {
      rawLogLine: `${ip} - - [${formatApacheDate(now)}] "POST /api/v1/login HTTP/1.1" ${status} 512`,
      isHighRisk,
      event: 'LOGIN_FAILED',
      ip,
      user,
      threatTitle: isHighRisk ? 'HIGH-RISK AUTHENTICATION ATTEMPT' : undefined,
      threatDescription: isHighRisk ? `IP ${ip} attempted unauthorized access on identity '${user}'` : undefined,
      riskLevel: isHighRisk ? 'CRITICAL' : 'MEDIUM'
    };
  }

  if (isSyslog) {
    const pid = Math.floor(Math.random() * 9000) + 1000;
    const port = Math.floor(Math.random() * 40000) + 10000;
    return {
      rawLogLine: `${formatSyslogDate(now)} sec-node-01 sshd[${pid}]: Failed password for invalid user ${user} from ${ip} port ${port} ssh2`,
      isHighRisk,
      event: 'LOGIN_FAILED',
      ip,
      user,
      threatTitle: isHighRisk ? 'SSHD BRUTE-FORCE BURST' : undefined,
      threatDescription: isHighRisk ? `Multiple rapid SSH failure events from ${ip} targeting user '${user}'` : undefined,
      riskLevel: isHighRisk ? 'CRITICAL' : 'HIGH'
    };
  }

  // Standard log format
  const timeStr = formatStandardDate(now);
  return {
    rawLogLine: `${timeStr} LOGIN_FAILED ${ip} user=${user} reason=${reason}`,
    isHighRisk,
    event: 'LOGIN_FAILED',
    ip,
    user,
    threatTitle: isHighRisk ? 'HIGH-RISK ACTIVITY DETECTED' : undefined,
    threatDescription: isHighRisk ? `Adversary ${ip} failed login for account '${user}' (${reason})` : undefined,
    riskLevel: isHighRisk ? 'CRITICAL' : 'MEDIUM'
  };
}
