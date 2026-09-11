import { 
  LogEntry, 
  SuspiciousIP, 
  SecurityAlert, 
  DetectionRules, 
  AnalysisSummary, 
  TimeSeriesDataPoint,
  RiskLevel
} from '../types';

export const DEFAULT_DETECTION_RULES: DetectionRules = {
  failedLoginThreshold: 5,
  highRiskThreshold: 10,
  errorRateThreshold: 6,
  flagUnknownIPs: false,
  rapidRequestsThreshold: 15
};

export function analyzeLogs(
  entries: LogEntry[], 
  rules: DetectionRules = DEFAULT_DETECTION_RULES
): {
  summary: AnalysisSummary;
  suspiciousIPs: SuspiciousIP[];
  alerts: SecurityAlert[];
  timeSeries: TimeSeriesDataPoint[];
  ipMap: Map<string, {
    ip: string;
    failedLogins: number;
    totalRequests: number;
    errorCount: number;
    firstSeen: string;
    lastSeen: string;
    users: Set<string>;
    failureReasonsMap: Map<string, number>;
  }>;
} {
  let successfulLogins = 0;
  let failedLogins = 0;
  let errorCount = 0;
  let infoCount = 0;
  let warningCount = 0;

  const globalFailureReasonsMap = new Map<string, number>();

  const ipStats = new Map<string, {
    ip: string;
    failedLogins: number;
    totalRequests: number;
    errorCount: number;
    firstSeen: string;
    lastSeen: string;
    users: Set<string>;
    failureReasonsMap: Map<string, number>;
  }>();

  // Sequential or minute-based buckets for charts
  const timeBuckets = new Map<string, {
    label: string;
    timestamp: number;
    total: number;
    failedLogins: number;
    successLogins: number;
    errors: number;
  }>();

  for (const entry of entries) {
    // 1. Overall counts
    if (entry.event === 'LOGIN_SUCCESS') {
      successfulLogins++;
    } else if (entry.event === 'LOGIN_FAILED') {
      failedLogins++;
      const reason = entry.failureReason || 'Invalid credentials';
      globalFailureReasonsMap.set(reason, (globalFailureReasonsMap.get(reason) || 0) + 1);
    } else if (entry.event === 'ERROR') {
      errorCount++;
    } else if (entry.event === 'WARNING') {
      warningCount++;
    } else {
      infoCount++;
    }

    // 2. IP Map tracking
    const ip = entry.ip || 'Unknown';
    if (!ipStats.has(ip)) {
      ipStats.set(ip, {
        ip,
        failedLogins: 0,
        totalRequests: 0,
        errorCount: 0,
        firstSeen: entry.timestamp,
        lastSeen: entry.timestamp,
        users: new Set<string>(),
        failureReasonsMap: new Map<string, number>()
      });
    }

    const current = ipStats.get(ip)!;
    current.totalRequests++;
    current.lastSeen = entry.timestamp;
    if (entry.event === 'LOGIN_FAILED') {
      current.failedLogins++;
      const reason = entry.failureReason || 'Invalid credentials';
      current.failureReasonsMap.set(reason, (current.failureReasonsMap.get(reason) || 0) + 1);
    }
    if (entry.event === 'ERROR') current.errorCount++;
    if (entry.user) current.users.add(entry.user);

    // 3. Time-series bucket
    // Create friendly label from timestamp (e.g. HH:MM)
    let timeKey = '00:00';
    const timeMatch = entry.timestamp.match(/\d{2}:\d{2}(?::\d{2})?/);
    if (timeMatch) {
      timeKey = timeMatch[0].slice(0, 5); // HH:MM
    } else {
      timeKey = entry.timestamp.slice(0, 10);
    }

    if (!timeBuckets.has(timeKey)) {
      timeBuckets.set(timeKey, {
        label: timeKey,
        timestamp: entry.timestampObj.getTime(),
        total: 0,
        failedLogins: 0,
        successLogins: 0,
        errors: 0
      });
    }

    const bucket = timeBuckets.get(timeKey)!;
    bucket.total++;
    if (entry.event === 'LOGIN_FAILED') bucket.failedLogins++;
    if (entry.event === 'LOGIN_SUCCESS') bucket.successLogins++;
    if (entry.event === 'ERROR') bucket.errors++;
  }

  // 4. Identify Suspicious IPs and Generate Alerts
  const suspiciousIPs: SuspiciousIP[] = [];
  const alerts: SecurityAlert[] = [];

  for (const [ip, stat] of ipStats.entries()) {
    const reasons: string[] = [];
    let riskLevel: RiskLevel = 'LOW';
    let riskScore = 10;

    // Evaluate rules
    if (stat.failedLogins >= rules.highRiskThreshold) {
      riskLevel = stat.failedLogins >= 15 ? 'CRITICAL' : 'HIGH';
      riskScore = Math.min(100, 60 + stat.failedLogins * 3);
      reasons.push(`High failed login volume (${stat.failedLogins} failures)`);
    } else if (stat.failedLogins >= rules.failedLoginThreshold) {
      riskLevel = 'MEDIUM';
      riskScore = 40 + stat.failedLogins * 3;
      reasons.push(`Failed login threshold exceeded (${stat.failedLogins} failures)`);
    }

    if (stat.errorCount >= rules.errorRateThreshold) {
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      riskScore = Math.max(riskScore, 50 + stat.errorCount * 4);
      reasons.push(`High error spike detected (${stat.errorCount} system errors)`);
    }

    if (stat.users.size > 3) {
      reasons.push(`Multi-account credential spray (${stat.users.size} unique usernames targeted)`);
      if (riskLevel === 'MEDIUM') riskLevel = 'HIGH';
      riskScore = Math.max(riskScore, 75);
    }

    const isSuspicious = stat.failedLogins >= rules.failedLoginThreshold || stat.errorCount >= rules.errorRateThreshold;

    // Compute failure breakdown for this IP
    const ipFailureReasons = Array.from(stat.failureReasonsMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
    const primaryFailureReason = ipFailureReasons[0]?.reason;

    if (isSuspicious) {
      suspiciousIPs.push({
        ip,
        failedLogins: stat.failedLogins,
        totalRequests: stat.totalRequests,
        errorCount: stat.errorCount,
        firstSeen: stat.firstSeen,
        lastSeen: stat.lastSeen,
        riskLevel,
        riskScore,
        reasons,
        isBlocked: false,
        isWhitelisted: false,
        associatedUsers: Array.from(stat.users),
        failureReasons: ipFailureReasons,
        primaryFailureReason
      });

      // Emit Alert matching the exact prompt template!
      alerts.push({
        id: `alert-${ip.replace(/\./g, '-')}-${Date.now()}`,
        ip,
        title: `ALERT! Suspicious Authentication Detected`,
        description: `IP: ${ip} failed ${stat.failedLogins} login attempts${primaryFailureReason ? ` (${primaryFailureReason})` : ''}. Risk Level: ${riskLevel}.`,
        failedCount: stat.failedLogins,
        riskLevel,
        timestamp: stat.lastSeen,
        ruleTriggered: `Rule: > ${rules.failedLoginThreshold} failed attempts`
      });
    }
  }

  // Sort suspicious IPs by risk score descending
  suspiciousIPs.sort((a, b) => b.riskScore - a.riskScore || b.failedLogins - a.failedLogins);
  
  // Sort alerts by severity
  const severityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  alerts.sort((a, b) => severityRank[b.riskLevel] - severityRank[a.riskLevel]);

  // Convert timeBuckets to array
  const timeSeries: TimeSeriesDataPoint[] = Array.from(timeBuckets.values()).map(b => ({
    timeLabel: b.label,
    timestamp: b.timestamp,
    total: b.total,
    failedLogins: b.failedLogins,
    successLogins: b.successLogins,
    errors: b.errors
  }));

  const failureReasonsBreakdown = Array.from(globalFailureReasonsMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: failedLogins > 0 ? Math.round((count / failedLogins) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const topFailureReason = failureReasonsBreakdown[0]?.reason;

  const summary: AnalysisSummary = {
    totalLogs: entries.length,
    successfulLogins,
    failedLogins,
    errorCount,
    infoCount,
    warningCount,
    uniqueIPsCount: ipStats.size,
    suspiciousIPsCount: suspiciousIPs.length,
    alertsCount: alerts.length,
    criticalAlertsCount: alerts.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL').length,
    timeRange: {
      start: entries.length > 0 ? entries[0].timestamp : 'N/A',
      end: entries.length > 0 ? entries[entries.length - 1].timestamp : 'N/A'
    },
    failureReasonsBreakdown,
    topFailureReason
  };

  return {
    summary,
    suspiciousIPs,
    alerts,
    timeSeries,
    ipMap: ipStats
  };
}

export function exportToCSV(entries: LogEntry[]): string {
  const headers = ['Timestamp', 'Event', 'IP', 'User', 'Failure_Reason', 'Message', 'Flagged'];
  const rows = entries.map(e => [
    `"${e.timestamp}"`,
    `"${e.event}"`,
    `"${e.ip}"`,
    `"${e.user || ''}"`,
    `"${(e.failureReason || '').replace(/"/g, '""')}"`,
    `"${(e.message || e.raw).replace(/"/g, '""')}"`,
    e.isFlagged ? 'YES' : 'NO'
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportAlertsToJSON(alerts: SecurityAlert[], summary: AnalysisSummary): string {
  return JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary,
    alerts
  }, null, 2);
}
