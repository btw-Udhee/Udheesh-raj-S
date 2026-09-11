import { LogEntry, AttackPattern, RiskLevel } from '../types';

/**
 * Known sensitive administrative and configuration paths frequently probed by attackers
 */
const SENSITIVE_PATHS = [
  '/.env',
  '/wp-login.php',
  '/admin',
  '/admin/config.php',
  '/phpmyadmin',
  '/.git',
  '/.git/config',
  '/actuator',
  '/actuator/env',
  '/actuator/health',
  '/api/v1/auth',
  '/api/secrets',
  '/oauth/token',
  '/xmlrpc.php',
  '/console',
  '/manager/html',
  '/shell',
  '/root'
];

/**
 * Detect sophisticated attack patterns from parsed log telemetry
 */
export function detectAttackPatterns(entries: LogEntry[]): AttackPattern[] {
  const patterns: AttackPattern[] = [];

  if (!entries || entries.length === 0) {
    return patterns;
  }

  // Groupings for multi-dimensional behavioral analysis
  const ipToLogs = new Map<string, LogEntry[]>();
  const userToFailedLogs = new Map<string, LogEntry[]>();
  const ipToSensitivePaths = new Map<string, Set<string>>();
  const ipToUserAttempts = new Map<string, Set<string>>();

  for (const entry of entries) {
    const ip = entry.ip || 'Unknown';
    if (!ipToLogs.has(ip)) {
      ipToLogs.set(ip, []);
    }
    ipToLogs.get(ip)!.push(entry);

    // Track usernames targeted by IP
    if (entry.user) {
      if (!ipToUserAttempts.has(ip)) {
        ipToUserAttempts.set(ip, new Set());
      }
      ipToUserAttempts.get(ip)!.add(entry.user);
    }

    // Track failed logins by username across all IPs
    if (entry.event === 'LOGIN_FAILED' && entry.user) {
      if (!userToFailedLogs.has(entry.user)) {
        userToFailedLogs.set(entry.user, []);
      }
      userToFailedLogs.get(entry.user)!.push(entry);
    }

    // Track path probes
    if (entry.path) {
      const lowerPath = entry.path.toLowerCase();
      const isSensitive = SENSITIVE_PATHS.some(sp => lowerPath.includes(sp));
      if (isSensitive) {
        if (!ipToSensitivePaths.has(ip)) {
          ipToSensitivePaths.set(ip, new Set());
        }
        ipToSensitivePaths.get(ip)!.add(entry.path);
      }
    } else if (entry.message || entry.raw) {
      // Check message for path hints (e.g. Apache or Syslog)
      const content = `${entry.message || ''} ${entry.raw}`.toLowerCase();
      const foundPath = SENSITIVE_PATHS.find(sp => content.includes(sp));
      if (foundPath) {
        if (!ipToSensitivePaths.has(ip)) {
          ipToSensitivePaths.set(ip, new Set());
        }
        ipToSensitivePaths.get(ip)!.add(foundPath);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 1. PATTERN 1: Brute-Force Detection (Vertical Attack - Single IP hammering single user)
  // -------------------------------------------------------------------------
  for (const [ip, logs] of ipToLogs.entries()) {
    const failedLogs = logs.filter(l => l.event === 'LOGIN_FAILED');
    // Group by user
    const userFailCounts = new Map<string, LogEntry[]>();
    for (const fl of failedLogs) {
      const u = fl.user || 'unspecified_user';
      if (!userFailCounts.has(u)) userFailCounts.set(u, []);
      userFailCounts.get(u)!.push(fl);
    }

    for (const [user, userLogs] of userFailCounts.entries()) {
      if (userLogs.length >= 4) {
        const severity: RiskLevel = userLogs.length >= 8 ? 'CRITICAL' : 'HIGH';
        const first = userLogs[0].timestamp;
        const last = userLogs[userLogs.length - 1].timestamp;

        patterns.push({
          id: `pattern-bruteforce-${ip}-${user}-${Date.now()}`,
          type: 'BRUTE_FORCE',
          title: `Vertical Brute-Force Attack: ${ip} targeting '${user}'`,
          severity,
          sourceIPs: [ip],
          targetedUsers: [user],
          targetedEndpoints: userLogs.map(l => l.path).filter((p): p is string => Boolean(p)),
          eventCount: userLogs.length,
          firstSeen: first,
          lastSeen: last,
          mitreTechnique: {
            id: 'T1110.001',
            name: 'Brute Force: Password Guessing',
            url: 'https://attack.mitre.org/techniques/T1110/001/'
          },
          confidenceScore: Math.min(99, 75 + userLogs.length * 3),
          description: `Host ${ip} executed ${userLogs.length} repeated failed login attempts exclusively targeting account '${user}'. High request concentration indicates focused vertical brute-force password cracking.`,
          indicators: [
            `${userLogs.length} consecutive authentication failures on single identity`,
            `Source IP: ${ip}`,
            `Target identity: ${user}`,
            `Failure reasons: ${Array.from(new Set(userLogs.map(l => l.failureReason || 'Invalid credentials'))).join(', ')}`
          ],
          recommendedAction: `Apply temporary rate-limiting or firewall block on IP ${ip}. Notify user '${user}' to verify password strength and enforce mandatory MFA.`
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2. PATTERN 2: Password Spraying (Horizontal Attack - One IP testing multiple accounts low-and-slow)
  // -------------------------------------------------------------------------
  for (const [ip, logs] of ipToLogs.entries()) {
    const failedLogs = logs.filter(l => l.event === 'LOGIN_FAILED');
    const uniqueUsers = Array.from(new Set(failedLogs.map(l => l.user).filter((u): u is string => Boolean(u))));

    // Password spray is defined as testing 3 or more distinct users with low/moderate attempts per user
    if (uniqueUsers.length >= 3) {
      const maxPerUser = Math.max(...uniqueUsers.map(u => failedLogs.filter(l => l.user === u).length));
      
      // If each user is only attempted a few times (classic low-and-slow spray to evade lockouts)
      const isSpray = maxPerUser <= 6 || uniqueUsers.length >= 4;
      if (isSpray) {
        const severity: RiskLevel = uniqueUsers.length >= 5 ? 'CRITICAL' : 'HIGH';
        patterns.push({
          id: `pattern-spray-${ip}-${Date.now()}`,
          type: 'PASSWORD_SPRAYING',
          title: `Horizontal Password Spraying Detected from ${ip}`,
          severity,
          sourceIPs: [ip],
          targetedUsers: uniqueUsers,
          targetedEndpoints: failedLogs.map(l => l.path).filter((p): p is string => Boolean(p)),
          eventCount: failedLogs.length,
          firstSeen: failedLogs[0].timestamp,
          lastSeen: failedLogs[failedLogs.length - 1].timestamp,
          mitreTechnique: {
            id: 'T1110.003',
            name: 'Brute Force: Password Spraying',
            url: 'https://attack.mitre.org/techniques/T1110/003/'
          },
          confidenceScore: Math.min(95, 70 + uniqueUsers.length * 5),
          description: `Single origin IP ${ip} attempted logins against ${uniqueUsers.length} distinct user accounts (${uniqueUsers.slice(0, 5).join(', ')}${uniqueUsers.length > 5 ? '...' : ''}). This horizontal spray pattern is designed to evade per-account lockout thresholds.`,
          indicators: [
            `${uniqueUsers.length} distinct target usernames tested from single source IP`,
            `Total failure volume: ${failedLogs.length} across broad account spectrum`,
            `Target accounts: ${uniqueUsers.join(', ')}`
          ],
          recommendedAction: `Blacklist IP ${ip} at WAF/edge layer. Audit targeted accounts for successful logins from the same subnet to detect compromised credentials.`
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. PATTERN 3: Credential Stuffing (High-velocity testing of breached credential pairs)
  // -------------------------------------------------------------------------
  for (const [ip, logs] of ipToLogs.entries()) {
    const failedLogs = logs.filter(l => l.event === 'LOGIN_FAILED');
    if (failedLogs.length >= 6) {
      // Check timestamp deltas to verify automated velocity
      let rapidCount = 0;
      for (let i = 1; i < failedLogs.length; i++) {
        const deltaMs = Math.abs(failedLogs[i].timestampObj.getTime() - failedLogs[i - 1].timestampObj.getTime());
        if (deltaMs <= 5000) { // within 5 seconds
          rapidCount++;
        }
      }

      if (rapidCount >= 3) {
        const uniqueUsers = Array.from(new Set(failedLogs.map(l => l.user).filter((u): u is string => Boolean(u))));
        patterns.push({
          id: `pattern-stuffing-${ip}-${Date.now()}`,
          type: 'CREDENTIAL_STUFFING',
          title: `Automated Credential Stuffing Pattern: ${ip}`,
          severity: 'CRITICAL',
          sourceIPs: [ip],
          targetedUsers: uniqueUsers,
          targetedEndpoints: failedLogs.map(l => l.path).filter((p): p is string => Boolean(p)),
          eventCount: failedLogs.length,
          firstSeen: failedLogs[0].timestamp,
          lastSeen: failedLogs[failedLogs.length - 1].timestamp,
          mitreTechnique: {
            id: 'T1110.004',
            name: 'Brute Force: Credential Stuffing',
            url: 'https://attack.mitre.org/techniques/T1110/004/'
          },
          confidenceScore: 92,
          description: `High-velocity automated authentication attempts detected from ${ip} with rapid inter-request intervals (<5s). Suggests automated script iterating through breached credential lists.`,
          indicators: [
            `${rapidCount} rapid-fire login attempts within 5-second windows`,
            `Testing multiple credential pairs in rapid sequence`,
            `Automated bot/tooling signature`
          ],
          recommendedAction: `Deploy CAPTCHA challenge on authentication route, block IP ${ip}, and verify if any credentials matched breached data feeds.`
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // 4. PATTERN 4: Port-Scan / Sensitive Path Probing
  // -------------------------------------------------------------------------
  for (const [ip, paths] of ipToSensitivePaths.entries()) {
    if (paths.size >= 2) {
      const logs = ipToLogs.get(ip) || [];
      const probeLogs = logs.filter(l => {
        const p = (l.path || l.message || l.raw).toLowerCase();
        return Array.from(paths).some(sp => p.includes(sp.toLowerCase()));
      });

      const pathList = Array.from(paths);
      const severity: RiskLevel = paths.size >= 4 ? 'CRITICAL' : 'HIGH';

      patterns.push({
        id: `pattern-probe-${ip}-${Date.now()}`,
        type: 'PORT_SCAN_PATH_PROBE',
        title: `Vulnerability Scanning & Path Probing: ${ip}`,
        severity,
        sourceIPs: [ip],
        targetedUsers: [],
        targetedEndpoints: pathList,
        eventCount: probeLogs.length,
        firstSeen: probeLogs[0]?.timestamp || new Date().toISOString(),
        lastSeen: probeLogs[probeLogs.length - 1]?.timestamp || new Date().toISOString(),
        mitreTechnique: {
          id: 'T1595.002',
          name: 'Active Scanning: Vulnerability Scanning',
          url: 'https://attack.mitre.org/techniques/T1595/002/'
        },
        confidenceScore: Math.min(98, 80 + paths.size * 5),
        description: `Source ${ip} executed automated reconnaissance targeting ${paths.size} high-risk configuration and credential paths (${pathList.slice(0, 4).join(', ')}). Looking for exposed environment secrets, admin consoles, and CMS backdoors.`,
        indicators: [
          `Targeted sensitive endpoints: ${pathList.join(', ')}`,
          `Probed ${paths.size} distinct restricted paths`,
          `Status codes returned: ${Array.from(new Set(probeLogs.map(l => l.statusCode).filter(Boolean))).join(', ') || '404/403'}`
        ],
        recommendedAction: `Immediately block IP ${ip} at web application firewall (WAF). Ensure dot-files like '.env' and '.git' are strictly blocked by reverse-proxy rules.`
      });
    }
  }

  // -------------------------------------------------------------------------
  // 5. PATTERN 5: Repeated Access to Sensitive Endpoints (Admin / Auth Abuse)
  // -------------------------------------------------------------------------
  for (const [ip, logs] of ipToLogs.entries()) {
    const sensitiveAttempts = logs.filter(l => {
      const path = (l.path || '').toLowerCase();
      const isAuthOrAdmin = path.includes('/admin') || path.includes('/oauth') || path.includes('/api/v1/auth') || path.includes('/sudo');
      const isFailedOrDenied = l.statusCode === 401 || l.statusCode === 403 || l.event === 'ACCESS_DENIED' || l.event === 'LOGIN_FAILED';
      return isAuthOrAdmin && isFailedOrDenied;
    });

    if (sensitiveAttempts.length >= 3) {
      patterns.push({
        id: `pattern-sensitive-abuse-${ip}-${Date.now()}`,
        type: 'SENSITIVE_ENDPOINT_ABUSE',
        title: `Persistent Sensitive Endpoint Abuse: ${ip}`,
        severity: 'HIGH',
        sourceIPs: [ip],
        targetedUsers: Array.from(new Set(sensitiveAttempts.map(l => l.user).filter((u): u is string => Boolean(u)))),
        targetedEndpoints: Array.from(new Set(sensitiveAttempts.map(l => l.path).filter((p): p is string => Boolean(p)))),
        eventCount: sensitiveAttempts.length,
        firstSeen: sensitiveAttempts[0].timestamp,
        lastSeen: sensitiveAttempts[sensitiveAttempts.length - 1].timestamp,
        mitreTechnique: {
          id: 'T1078',
          name: 'Valid Accounts / Unauthorized Route Exploitation',
          url: 'https://attack.mitre.org/techniques/T1078/'
        },
        confidenceScore: 84,
        description: `Host ${ip} made ${sensitiveAttempts.length} repeated unauthorized requests against protected endpoints without valid credentials.`,
        indicators: [
          `Repeated 401/403 status codes on privileged routes`,
          `Endpoints targeted: ${Array.from(new Set(sensitiveAttempts.map(l => l.path))).join(', ')}`
        ],
        recommendedAction: `Review authorization policies and restrict access to these endpoints via IP whitelist or VPN gateway.`
      });
    }
  }

  // -------------------------------------------------------------------------
  // 6. PATTERN 6: Multi-User Dictionary Attack from One IP (Horizontal Enumeration)
  // -------------------------------------------------------------------------
  for (const [ip, userSet] of ipToUserAttempts.entries()) {
    if (userSet.size >= 4) {
      const logs = (ipToLogs.get(ip) || []).filter(l => l.event === 'LOGIN_FAILED');
      const userList = Array.from(userSet);

      patterns.push({
        id: `pattern-dict-enum-${ip}-${Date.now()}`,
        type: 'MULTI_USER_DICTIONARY_ATTACK',
        title: `Multi-User Dictionary Enumeration from ${ip}`,
        severity: 'HIGH',
        sourceIPs: [ip],
        targetedUsers: userList,
        targetedEndpoints: logs.map(l => l.path).filter((p): p is string => Boolean(p)),
        eventCount: logs.length,
        firstSeen: logs[0]?.timestamp || new Date().toISOString(),
        lastSeen: logs[logs.length - 1]?.timestamp || new Date().toISOString(),
        mitreTechnique: {
          id: 'T1087.002',
          name: 'Account Discovery: Domain Account',
          url: 'https://attack.mitre.org/techniques/T1087/002/'
        },
        confidenceScore: 88,
        description: `One single IP address ${ip} systematically tested ${userSet.size} distinct account names, characteristic of automated dictionary username enumeration.`,
        indicators: [
          `Tested ${userSet.size} distinct usernames: ${userList.slice(0, 6).join(', ')}`,
          `Single originating IP address: ${ip}`
        ],
        recommendedAction: `Enable generic error messaging on authentication endpoint ('Invalid username or password') to prevent username discovery.`
      });
    }
  }

  // -------------------------------------------------------------------------
  // 7. PATTERN 7: One Username Attacked from Many IPs (Distributed Brute-Force / Botnet)
  // -------------------------------------------------------------------------
  for (const [user, failedLogs] of userToFailedLogs.entries()) {
    const distinctIPs = Array.from(new Set(failedLogs.map(l => l.ip)));
    if (distinctIPs.length >= 3) {
      const first = failedLogs[0].timestamp;
      const last = failedLogs[failedLogs.length - 1].timestamp;

      patterns.push({
        id: `pattern-distributed-${user}-${Date.now()}`,
        type: 'DISTRIBUTED_BRUTE_FORCE',
        title: `Distributed Brute-Force Botnet Swarm targeting '${user}'`,
        severity: 'CRITICAL',
        sourceIPs: distinctIPs,
        targetedUsers: [user],
        targetedEndpoints: failedLogs.map(l => l.path).filter((p): p is string => Boolean(p)),
        eventCount: failedLogs.length,
        firstSeen: first,
        lastSeen: last,
        mitreTechnique: {
          id: 'T1110.001',
          name: 'Brute Force: Distributed Password Guessing',
          url: 'https://attack.mitre.org/techniques/T1110/001/'
        },
        confidenceScore: 96,
        description: `High-value account '${user}' is under coordinated attack from ${distinctIPs.length} distinct IP addresses (${distinctIPs.slice(0, 4).join(', ')}${distinctIPs.length > 4 ? '...' : ''}). This distributed pattern bypasses single-IP rate-limiting.`,
        indicators: [
          `Targeted single account: '${user}'`,
          `${distinctIPs.length} distinct attacking IP nodes involved`,
          `Total coordinated failed login attempts: ${failedLogs.length}`
        ],
        recommendedAction: `Temporarily lock account '${user}' or mandate hardware token MFA. Implement global account-level lockout thresholds regardless of originating IP.`
      });
    }
  }

  // Sort by severity (CRITICAL -> HIGH -> MEDIUM -> LOW) and event count
  const rank: Record<RiskLevel, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  return patterns.sort((a, b) => rank[b.severity] - rank[a.severity] || b.eventCount - a.eventCount);
}
