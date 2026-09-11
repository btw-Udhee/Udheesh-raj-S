import { LogEntry, EventType, ParsingStats } from '../types';

// IP Regex pattern
const IP_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;

// Standard format: YYYY-MM-DD HH:MM:SS EVENT IP [EXTRA]
const STANDARD_REGEX = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+([A-Za-z0-9_]+)\s+((?:\d{1,3}\.){3}\d{1,3})(?:\s+(.*))?$/;

// Apache Combined log: IP - - [date] "METHOD PATH HTTP/..." STATUS BYTES
const APACHE_REGEX = /^((?:\d{1,3}\.){3}\d{1,3})\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"([A-Z]+)\s+([^\s]+)\s+[^"]+"\s+(\d{3})\s+(\d+|-)/;

// Syslog SSH: Month Day HH:MM:SS host program[pid]: message
const SYSLOG_REGEX = /^([A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:]+):\s+(.*)$/;

/**
 * Determines and normalizes the reason for a failed authentication or access denial.
 */
export function extractFailureReason(
  rawLine: string,
  event: EventType,
  user?: string,
  statusCode?: number,
  path?: string,
  extraMessage?: string
): string | undefined {
  if (event !== 'LOGIN_FAILED' && event !== 'ACCESS_DENIED' && (statusCode === undefined || statusCode < 400)) {
    return undefined;
  }

  const lowerRaw = rawLine.toLowerCase();
  const lowerMsg = (extraMessage || '').toLowerCase();

  // 1. Explicit reason attribute in log line: reason=xxx, cause=xxx, error_code=xxx
  const explicitReasonMatch = rawLine.match(/(?:reason|cause|error_code|failure_reason)[:=]\s*([a-zA-Z0-9_\-\.\s]+?)(?:\s+[a-zA-Z0-9_\-]+[:=]|$)/i);
  if (explicitReasonMatch) {
    const rawReason = explicitReasonMatch[1].trim().toLowerCase().replace(/_/g, ' ');
    if (rawReason.includes('invalid pass') || rawReason.includes('bad pass') || rawReason.includes('wrong pass')) {
      return 'Invalid password';
    }
    if (rawReason.includes('user not found') || rawReason.includes('unknown user') || rawReason.includes('no such user')) {
      return `User not found (${user ? `'${user}'` : 'unknown account'})`;
    }
    if (rawReason.includes('lock') || rawReason.includes('too many attempt')) {
      return 'Account locked (Max login attempts exceeded)';
    }
    if (rawReason.includes('expir')) {
      return 'Password / Credentials expired';
    }
    if (rawReason.includes('mfa') || rawReason.includes('2fa') || rawReason.includes('otp')) {
      return 'MFA / 2FA verification challenge failed';
    }
    if (rawReason.includes('socket') || rawReason.includes('hangup')) {
      return 'Socket hangup after failed authentication handshake';
    }
    if (rawReason.includes('token') || rawReason.includes('jwt')) {
      return 'Invalid or expired auth session token';
    }
    if (rawReason.includes('disabled') || rawReason.includes('inactive')) {
      return 'Account disabled / Inactive user';
    }
    if (rawReason.includes('unauthorized') || rawReason.includes('permission')) {
      return 'Unauthorized / Insufficient role privileges';
    }
    // Capitalize first letter
    return rawReason.charAt(0).toUpperCase() + rawReason.slice(1);
  }

  // 2. Syslog / SSH authentication patterns
  if (lowerRaw.includes('failed password for invalid user')) {
    const invalidUserMatch = rawLine.match(/invalid user\s+([a-zA-Z0-9_\-\.]+)/i);
    const target = invalidUserMatch ? invalidUserMatch[1] : user || 'unknown';
    return `Invalid username (User '${target}' does not exist in directory)`;
  }

  if (lowerRaw.includes('failed password for')) {
    const targetUser = user || 'target account';
    return `Bad credentials (Password verification rejected for user '${targetUser}')`;
  }

  if (lowerRaw.includes('authentication failure') || lowerRaw.includes('pam_unix')) {
    if (lowerRaw.includes('sudo:auth')) {
      return `PAM authentication failure (Sudo unauthorized password for '${user || 'user'}')`;
    }
    return 'PAM: Authentication failure (Credentials rejected by PAM module)';
  }

  if (lowerRaw.includes('connection closed by') && lowerRaw.includes('[preauth]')) {
    return 'Connection dropped before authentication completed (Preauth termination)';
  }

  if (lowerRaw.includes('maximum authentication attempts exceeded')) {
    return 'Exceeded maximum allowable login attempts';
  }

  // 3. HTTP / Web server access log patterns
  if (statusCode === 401) {
    if (path && path.toLowerCase().includes('oauth')) {
      return 'OAuth 401: Invalid client credentials or token';
    }
    if (path && (path.toLowerCase().includes('wp-login') || path.toLowerCase().includes('admin'))) {
      return 'HTTP 401: CMS administrative login credentials rejected';
    }
    return 'HTTP 401 Unauthorized: Invalid username, password, or Bearer token';
  }

  if (statusCode === 403) {
    if (path && (path.toLowerCase().includes('login') || path.toLowerCase().includes('auth'))) {
      return 'HTTP 403 Forbidden: Account suspended, rate-limited, or CSRF token mismatch';
    }
    if (path && (path.includes('.env') || path.includes('etc/passwd') || path.includes('phpmyadmin'))) {
      return 'HTTP 403 Forbidden: Malicious path probe blocked by WAF';
    }
    return 'HTTP 403 Forbidden: Access denied by access control list (ACL)';
  }

  if (statusCode === 404 && path && (path.toLowerCase().includes('login') || path.toLowerCase().includes('auth'))) {
    return 'HTTP 404: Authentication route not found / probed';
  }

  // 4. Standard format without explicit reason attribute:
  // e.g. "2026-09-01 10:01:15 LOGIN_FAILED 192.168.1.10 user=admin"
  if (event === 'LOGIN_FAILED') {
    if (user) {
      const defaultPrivileged = ['root', 'admin', 'administrator', 'operator', 'sysadmin', 'postgres', 'oracle', 'mysql', 'support', 'ubuntu', 'master', 'superadmin'];
      const testAccounts = ['test', 'guest', 'user1', 'temp', 'demo', 'user', 'backup'];

      if (defaultPrivileged.includes(user.toLowerCase())) {
        return `Bad password / Dictionary attempt on privileged account '${user}'`;
      }
      if (testAccounts.includes(user.toLowerCase())) {
        return `Non-existent / Inactive test account probing ('${user}')`;
      }
      return `Invalid credentials (Password verification failed for user '${user}')`;
    }

    // No user specified in log (e.g. Phase 1 format: "2026-09-01 10:01:15 LOGIN_FAILED 192.168.1.10")
    return 'Invalid credentials (Bad password or unauthenticated handshake)';
  }

  if (event === 'ACCESS_DENIED') {
    return 'Access denied (Insufficient permissions or unauthorized endpoint)';
  }

  return undefined;
}

export function parseLogTimestampToDate(timestampStr: string): Date {
  if (!timestampStr) return new Date();

  // Format 1: Standard YYYY-MM-DD HH:MM:SS
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(timestampStr)) {
    const d = new Date(timestampStr.replace(' ', 'T') + 'Z');
    if (!isNaN(d.getTime())) return d;
  }

  // Format 2: Apache/Nginx DD/MMM/YYYY:HH:MM:SS +ZZZZ
  if (/^\d{2}\/[A-Za-z]{3}\/\d{4}:\d{2}:\d{2}:\d{2}/.test(timestampStr)) {
    const formatted = timestampStr.replace(':', ' ');
    const d = new Date(formatted);
    if (!isNaN(d.getTime())) return d;
  }

  // Format 3: Syslog MMM DD HH:MM:SS (assume 2026)
  if (/^[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/.test(timestampStr)) {
    const d = new Date(`${timestampStr} 2026 UTC`);
    if (!isNaN(d.getTime())) return d;
  }

  const generic = new Date(timestampStr);
  if (!isNaN(generic.getTime())) return generic;

  return new Date();
}

export function parseSingleLogLine(line: string, index: number): LogEntry | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const id = `log-${index}-${Date.now().toString(36)}`;

  // 1. Try Standard format (Prompt Phase 1 format)
  const stdMatch = trimmed.match(STANDARD_REGEX);
  if (stdMatch) {
    const [, timestampStr, rawEvent, ip, extra] = stdMatch;
    let event: EventType = 'INFO';
    const upperEvent = rawEvent.toUpperCase();
    if (upperEvent === 'LOGIN_SUCCESS' || upperEvent === 'SUCCESS') {
      event = 'LOGIN_SUCCESS';
    } else if (upperEvent === 'LOGIN_FAILED' || upperEvent === 'FAILED' || upperEvent === 'FAIL') {
      event = 'LOGIN_FAILED';
    } else if (upperEvent === 'ERROR' || upperEvent === 'ERR') {
      event = 'ERROR';
    } else if (upperEvent === 'WARNING' || upperEvent === 'WARN') {
      event = 'WARNING';
    } else if (upperEvent.includes('GRANT')) {
      event = 'ACCESS_GRANTED';
    } else if (upperEvent.includes('DENI')) {
      event = 'ACCESS_DENIED';
    }

    // Extract user if extra contains user=xxx or username xxx
    let user: string | undefined;
    const userMatch = extra ? extra.match(/user(?:name)?[:=]\s*([a-zA-Z0-9_\-\.]+)/i) : null;
    if (userMatch) {
      user = userMatch[1];
    }

    const validDate = parseLogTimestampToDate(timestampStr);
    const failureReason = extractFailureReason(trimmed, event, user, undefined, undefined, extra);

    return {
      id,
      raw: trimmed,
      timestamp: timestampStr,
      timestampObj: validDate,
      event,
      ip,
      user,
      message: extra || undefined,
      failureReason,
      isFlagged: event === 'LOGIN_FAILED' || event === 'ERROR'
    };
  }

  // 2. Try Apache / Nginx format
  const apacheMatch = trimmed.match(APACHE_REGEX);
  if (apacheMatch) {
    const [, ip, dateStr, method, path, statusStr] = apacheMatch;
    const statusCode = parseInt(statusStr, 10);
    let event: EventType = 'INFO';

    const isLoginEndpoint = path.toLowerCase().includes('login') || path.toLowerCase().includes('auth');
    if (statusCode === 200 && isLoginEndpoint) {
      event = 'LOGIN_SUCCESS';
    } else if (statusCode === 401 || (statusCode === 403 && isLoginEndpoint)) {
      event = 'LOGIN_FAILED';
    } else if (statusCode === 403 || statusCode === 404) {
      event = 'ACCESS_DENIED';
    } else if (statusCode >= 500) {
      event = 'ERROR';
    }

    const failureReason = extractFailureReason(trimmed, event, undefined, statusCode, path, `${method} ${path}`);
    const validDate = parseLogTimestampToDate(dateStr);

    return {
      id,
      raw: trimmed,
      timestamp: dateStr,
      timestampObj: validDate,
      event,
      ip,
      statusCode,
      method,
      path,
      message: `${method} ${path} (${statusCode})`,
      failureReason,
      isFlagged: event === 'LOGIN_FAILED' || event === 'ERROR' || statusCode >= 400
    };
  }

  // 3. Try Linux Syslog format (e.g. auth.log with sshd, sudo)
  const syslogMatch = trimmed.match(SYSLOG_REGEX);
  if (syslogMatch) {
    const [, dateStr, , service, msg] = syslogMatch;
    const ipMatch = msg.match(IP_REGEX);
    const ip = ipMatch ? ipMatch[0] : '127.0.0.1';

    let event: EventType = 'INFO';
    let user: string | undefined;

    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes('failed password') || lowerMsg.includes('authentication failure') || lowerMsg.includes('invalid user')) {
      event = 'LOGIN_FAILED';
    } else if (lowerMsg.includes('accepted password') || lowerMsg.includes('accepted publickey') || lowerMsg.includes('session opened')) {
      event = 'LOGIN_SUCCESS';
    } else if (lowerMsg.includes('error') || lowerMsg.includes('fatal') || lowerMsg.includes('kill process')) {
      event = 'ERROR';
    } else if (lowerMsg.includes('warning')) {
      event = 'WARNING';
    }

    const userRegex = /(?:for|user(?:name)?)\s+([a-zA-Z0-9_\-]+)/i;
    const matchedUser = msg.match(userRegex);
    if (matchedUser && matchedUser[1] !== 'invalid') {
      user = matchedUser[1];
    }

    const failureReason = extractFailureReason(trimmed, event, user, undefined, undefined, msg);
    const validDate = parseLogTimestampToDate(dateStr);

    return {
      id,
      raw: trimmed,
      timestamp: dateStr,
      timestampObj: validDate,
      event,
      ip,
      user,
      message: `${service}: ${msg}`,
      failureReason,
      isFlagged: event === 'LOGIN_FAILED' || event === 'ERROR'
    };
  }

  // 4. Fallback: simple tokenized split (Phase 1 simplicity from prompt)
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 3) {
    const foundIp = parts.find(p => IP_REGEX.test(p)) || '0.0.0.0';
    let event: EventType = 'INFO';
    const joined = trimmed.toUpperCase();

    if (joined.includes('LOGIN_FAILED') || joined.includes('FAILED') || joined.includes('FAIL')) {
      event = 'LOGIN_FAILED';
    } else if (joined.includes('LOGIN_SUCCESS') || joined.includes('SUCCESS')) {
      event = 'LOGIN_SUCCESS';
    } else if (joined.includes('ERROR') || joined.includes('ERR')) {
      event = 'ERROR';
    } else if (joined.includes('WARNING') || joined.includes('WARN')) {
      event = 'WARNING';
    }

    const timestamp = parts.length >= 2 && parts[0].includes('-') ? `${parts[0]} ${parts[1]}` : new Date().toLocaleTimeString();
    const failureReason = extractFailureReason(trimmed, event, undefined, undefined, undefined, trimmed);
    const validDate = parseLogTimestampToDate(timestamp);

    return {
      id,
      raw: trimmed,
      timestamp,
      timestampObj: validDate,
      event,
      ip: foundIp,
      message: parts.slice(3).join(' ') || undefined,
      failureReason,
      isFlagged: event === 'LOGIN_FAILED' || event === 'ERROR'
    };
  }


  return null;
}

export function parseLogText(rawText: string): LogEntry[] {
  return parseLogTextWithStats(rawText).entries;
}

export function parseLogTextWithStats(rawText: string): {
  entries: LogEntry[];
  stats: ParsingStats;
  unparsedLines: { lineNum: number; text: string }[];
} {
  const startTime = performance.now();
  if (!rawText) {
    return {
      entries: [],
      stats: {
        totalLines: 0,
        parsedCount: 0,
        emptyLinesCount: 0,
        errorLinesCount: 0,
        bytesTotal: 0,
        durationMs: 0,
        throughputEventsPerSec: 0
      },
      unparsedLines: []
    };
  }

  const lines = rawText.split(/\r?\n/);
  const entries: LogEntry[] = [];
  const unparsedLines: { lineNum: number; text: string }[] = [];
  let emptyLinesCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine || rawLine.trim() === '') {
      emptyLinesCount++;
      continue;
    }

    const parsed = parseSingleLogLine(rawLine, i);
    if (parsed) {
      entries.push(parsed);
    } else {
      unparsedLines.push({ lineNum: i + 1, text: rawLine });
    }
  }

  const durationMs = Math.max(0.1, Number((performance.now() - startTime).toFixed(2)));
  const bytesTotal = new Blob([rawText]).size;
  const throughputEventsPerSec = Math.round((entries.length / (durationMs / 1000)));

  return {
    entries,
    stats: {
      totalLines: lines.length,
      parsedCount: entries.length,
      emptyLinesCount,
      errorLinesCount: unparsedLines.length,
      bytesTotal,
      durationMs,
      throughputEventsPerSec: throughputEventsPerSec || 0
    },
    unparsedLines
  };
}
