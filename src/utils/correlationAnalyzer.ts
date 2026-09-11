import { 
  LogEntry, 
  CorrelatedErrorIncident, 
  CorrelatedFailedLogin, 
  CorrelationAnalysisResult,
  CorrelationCausality 
} from '../types';

/**
 * Extracts a normalized, human-readable error signature from an ERROR log entry
 */
export function extractErrorSignature(entry: LogEntry): string {
  const text = `${entry.message || ''} ${entry.raw || ''} ${entry.path || ''}`.toLowerCase();

  if (text.includes('database_timeout') || text.includes('db_timeout') || text.includes('query timeout')) {
    return 'Database Connection Timeout';
  }
  if (text.includes('pool_exhausted') || text.includes('connection pool') || text.includes('too many connections')) {
    return 'Database Connection Pool Exhaustion';
  }
  if (text.includes('ldap') || text.includes('directory_unreachable') || text.includes('active directory')) {
    return 'LDAP / Directory Service Unreachable';
  }
  if (text.includes('socket_exhaustion') || text.includes('too many open files') || text.includes('file descriptor')) {
    return 'Excessive Socket / Resource Exhaustion';
  }
  if (text.includes('connection_reset_by_peer') || text.includes('conn_reset') || text.includes('econnreset')) {
    return 'TCP Connection Reset by Peer';
  }
  if (text.includes('pam_unix') || text.includes('auth service failure') || text.includes('pam_auth')) {
    return 'PAM Auth Subsystem Module Fault';
  }
  if (text.includes('out of memory') || text.includes('kill process') || text.includes('oom')) {
    return 'Kernel Out-Of-Memory (OOM) Process Termination';
  }
  if (text.includes('redis') || text.includes('cache_timeout') || text.includes('token_store')) {
    return 'Session Cache / Token Store Failure';
  }
  if (entry.statusCode === 500 || text.includes('500 internal')) {
    return 'HTTP 500 Internal Server Error';
  }
  if (entry.statusCode === 502 || text.includes('502 bad gateway')) {
    return 'HTTP 502 Bad Gateway';
  }
  if (entry.statusCode === 503 || text.includes('503 service unavailable')) {
    return 'HTTP 503 Service Unavailable';
  }
  if (entry.statusCode === 504 || text.includes('504 gateway timeout')) {
    return 'HTTP 504 Gateway Timeout';
  }

  // Fallback to formatted message or raw excerpt
  if (entry.message) {
    const clean = entry.message.replace(/^[a-z0-9_\-\.]+:\s*/i, '').trim();
    if (clean.length > 0) {
      return clean.charAt(0).toUpperCase() + clean.slice(1).replace(/_/g, ' ');
    }
  }

  return 'Generic System Exception';
}

export interface CorrelationOptions {
  windowSeconds?: number;
  direction?: 'all' | 'error-first' | 'attack-first';
  sameIPOnly?: boolean;
}

/**
 * Cross-references timestamps of 'ERROR' logs with 'LOGIN_FAILED' attempts
 * to determine if specific system errors are triggering authentication failures.
 */
export function analyzeCorrelations(
  entries: LogEntry[],
  options: CorrelationOptions = {}
): CorrelationAnalysisResult {
  const windowSeconds = options.windowSeconds ?? 60;
  const direction = options.direction ?? 'all';
  const sameIPOnly = options.sameIPOnly ?? false;

  // Filter ERROR logs and LOGIN_FAILED logs
  const errorLogs = entries.filter(e => e.event === 'ERROR');
  const failedLogins = entries.filter(e => e.event === 'LOGIN_FAILED');

  const incidents: CorrelatedErrorIncident[] = [];
  const linkedFailureIds = new Set<string>();
  const errorSignatureStats = new Map<string, { failureCount: number; incidentCount: number }>();

  // Process each error to find temporally adjacent failed logins
  errorLogs.forEach((errorLog, idx) => {
    const errorTimeMs = errorLog.timestampObj.getTime();
    const errorSignature = extractErrorSignature(errorLog);
    const correlatedFailures: CorrelatedFailedLogin[] = [];

    failedLogins.forEach(failLog => {
      const failTimeMs = failLog.timestampObj.getTime();
      // Delta in seconds: positive means failure occurred AFTER error; negative means failure BEFORE error
      const deltaSeconds = Math.round((failTimeMs - errorTimeMs) / 1000);
      const absDelta = Math.abs(deltaSeconds);

      // Check window criteria
      if (absDelta > windowSeconds) return;

      // Check directionality criteria
      if (direction === 'error-first' && deltaSeconds < 0) return;
      if (direction === 'attack-first' && deltaSeconds > 0) return;

      const isSameIP = errorLog.ip === failLog.ip;
      if (sameIPOnly && !isSameIP) return;

      correlatedFailures.push({
        log: failLog,
        timeDeltaSeconds: deltaSeconds,
        isSameIP
      });

      linkedFailureIds.add(failLog.id);
    });

    if (correlatedFailures.length > 0) {
      // Sort failures by absolute proximity
      correlatedFailures.sort((a, b) => Math.abs(a.timeDeltaSeconds) - Math.abs(b.timeDeltaSeconds));

      const deltas = correlatedFailures.map(f => f.timeDeltaSeconds);
      const minDelta = Math.min(...deltas);
      const maxDelta = Math.max(...deltas);
      const avgDelta = Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10;

      const users = Array.from(new Set(correlatedFailures.map(f => f.log.user).filter(Boolean))) as string[];
      const ips = Array.from(new Set(correlatedFailures.map(f => f.log.ip)));

      // Classify Causality
      let causality: CorrelationCausality = 'COINCIDENTAL_PROXIMITY';
      let confidenceScore = 50;
      let rootCauseAnalysis = '';
      let recommendedAction = '';

      const forwardFailures = correlatedFailures.filter(f => f.timeDeltaSeconds >= 0);
      const backwardFailures = correlatedFailures.filter(f => f.timeDeltaSeconds < 0);

      if (forwardFailures.length >= 2 || (forwardFailures.length >= 1 && (users.length > 1 || ips.length > 1 || !correlatedFailures[0].isSameIP))) {
        // System Error occurred first -> auth failures cascaded afterwards!
        causality = 'SYSTEM_ERROR_TRIGGERED_AUTH_FAILURES';
        
        // Compute confidence based on sample size and latency tightness
        const fastFollowers = forwardFailures.filter(f => f.timeDeltaSeconds <= 15).length;
        confidenceScore = Math.min(98, 70 + (forwardFailures.length * 5) + (fastFollowers * 4) + (users.length > 1 ? 10 : 0));

        rootCauseAnalysis = `System error '${errorSignature}' at ${errorLog.timestamp} triggered ${forwardFailures.length} downstream authentication failure(s) within ${windowSeconds}s (avg lag: ${avgDelta}s). Multiple accounts (${users.join(', ') || 'unspecified'}) and IPs experienced simultaneous auth rejections.`;
        recommendedAction = `Investigate root health of '${errorSignature}' (e.g., service availability, database connection pools, LDAP response latency). These failed logins represent false positive security alarms caused by an infrastructure outage rather than a credential attack.`;
      } else if (backwardFailures.length >= 3 && ips.length === 1) {
        // Repeated failed logins from single IP/actor before error occurred
        causality = 'ATTACK_TRIGGERED_SYSTEM_ERROR';
        confidenceScore = Math.min(95, 65 + (backwardFailures.length * 4));

        rootCauseAnalysis = `High-frequency failed login barrage (${backwardFailures.length} attempts) from IP ${ips[0]} preceded the system error '${errorSignature}' by ${Math.abs(minDelta)}s. The attack volume likely caused resource starvation, socket exhaustion, or rate-limit trip.`;
        recommendedAction = `Enforce immediate firewall block on IP ${ips[0]} and verify ingress rate limiting on authentication routes to prevent server denial-of-service.`;
      } else {
        causality = 'COINCIDENTAL_PROXIMITY';
        confidenceScore = 45;
        rootCauseAnalysis = `System error and login failure occurred within ${Math.abs(avgDelta)}s of each other, but sample volume is insufficient to confirm direct causal dependency.`;
        recommendedAction = `Monitor telemetry for repeated temporal patterns between ${errorSignature} and authentication failures.`;
      }

      const incident: CorrelatedErrorIncident = {
        id: `corr-inc-${idx}-${errorLog.id}`,
        errorLog,
        errorTimestamp: errorLog.timestamp,
        errorSignature,
        correlatedFailuresCount: correlatedFailures.length,
        correlatedFailures,
        affectedUsers: users,
        affectedIPs: ips,
        avgDeltaSeconds: avgDelta,
        minDeltaSeconds: minDelta,
        maxDeltaSeconds: maxDelta,
        causality,
        confidenceScore,
        rootCauseAnalysis,
        recommendedAction
      };

      incidents.push(incident);

      // Record stats for top error triggers
      const currentStats = errorSignatureStats.get(errorSignature) || { failureCount: 0, incidentCount: 0 };
      currentStats.failureCount += correlatedFailures.length;
      currentStats.incidentCount += 1;
      errorSignatureStats.set(errorSignature, currentStats);
    }
  });

  // Sort incidents: highest confidence & failure count first
  incidents.sort((a, b) => {
    if (b.causality === 'SYSTEM_ERROR_TRIGGERED_AUTH_FAILURES' && a.causality !== 'SYSTEM_ERROR_TRIGGERED_AUTH_FAILURES') return 1;
    if (a.causality === 'SYSTEM_ERROR_TRIGGERED_AUTH_FAILURES' && b.causality !== 'SYSTEM_ERROR_TRIGGERED_AUTH_FAILURES') return -1;
    return b.correlatedFailuresCount - a.correlatedFailuresCount;
  });

  // Build interleaved chronology timeline events
  const timelineEvents: CorrelationAnalysisResult['timelineEvents'] = [];

  incidents.forEach(incident => {
    // Add the error event
    timelineEvents.push({
      id: `tl-err-${incident.id}`,
      type: 'ERROR',
      timestamp: incident.errorLog.timestamp,
      timestampMs: incident.errorLog.timestampObj.getTime(),
      log: incident.errorLog,
      incidentId: incident.id,
      relatedErrorSignature: incident.errorSignature
    });

    // Add correlated failure events
    incident.correlatedFailures.forEach((corr, fIdx) => {
      timelineEvents.push({
        id: `tl-fail-${incident.id}-${fIdx}-${corr.log.id}`,
        type: 'LOGIN_FAILED',
        timestamp: corr.log.timestamp,
        timestampMs: corr.log.timestampObj.getTime(),
        log: corr.log,
        incidentId: incident.id,
        deltaToErrorSeconds: corr.timeDeltaSeconds,
        relatedErrorSignature: incident.errorSignature
      });
    });
  });

  // Deduplicate and sort timeline
  const uniqueTimelineMap = new Map<string, CorrelationAnalysisResult['timelineEvents'][0]>();
  timelineEvents.forEach(item => {
    uniqueTimelineMap.set(item.id, item);
  });
  const sortedTimeline = Array.from(uniqueTimelineMap.values()).sort((a, b) => a.timestampMs - b.timestampMs);

  // Top error triggers summary
  const topErrorTriggers = Array.from(errorSignatureStats.entries())
    .map(([errorSignature, stat]) => ({
      errorSignature,
      failureCount: stat.failureCount,
      incidentCount: stat.incidentCount
    }))
    .sort((a, b) => b.failureCount - a.failureCount);

  const correlatedFailuresCount = linkedFailureIds.size;
  const overallCorrelationRatio = failedLogins.length > 0
    ? Math.round((correlatedFailuresCount / failedLogins.length) * 100)
    : 0;

  return {
    windowSeconds,
    totalErrorLogs: errorLogs.length,
    totalFailedLogins: failedLogins.length,
    correlatedErrorCount: incidents.length,
    correlatedFailuresCount,
    overallCorrelationRatio,
    incidents,
    topErrorTriggers,
    timelineEvents: sortedTimeline
  };
}
