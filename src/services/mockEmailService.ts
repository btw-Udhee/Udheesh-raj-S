import { SecurityAlert, RiskLevel } from '../types';

export interface EmailNotificationConfig {
  enabled: boolean;
  recipient: string;
  sender: string;
  notifyOnSeverity: RiskLevel[];
  cooldownMinutes: number;
}

export interface EmailNotificationLog {
  id: string;
  alertId: string;
  targetIP: string;
  recipient: string;
  sender: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  severity: RiskLevel;
  failedCount: number;
  sentAt: string;
  deliveryStatus: 'DELIVERED (SIMULATED)' | 'FAILED';
  simulatedLatencyMs: number;
}

const STORAGE_KEY_CONFIG = 'cyber_email_alert_config';
const STORAGE_KEY_LOGS = 'cyber_email_alert_logs';

const DEFAULT_CONFIG: EmailNotificationConfig = {
  enabled: true,
  recipient: 'soc-oncall@enterprise.security.org',
  sender: 'siem-alerts@ids-node-01.corp.internal',
  notifyOnSeverity: ['CRITICAL', 'HIGH'],
  cooldownMinutes: 10
};

class MockEmailNotificationService {
  private config: EmailNotificationConfig;
  private logs: EmailNotificationLog[];
  private listeners: Set<(logs: EmailNotificationLog[], latestSent?: EmailNotificationLog) => void>;

  constructor() {
    this.config = this.loadConfig();
    this.logs = this.loadLogs();
    this.listeners = new Set();
  }

  private loadConfig(): EmailNotificationConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_CONFIG };
  }

  private loadLogs(): EmailNotificationLog[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs));
    } catch {
      // ignore
    }
  }

  public getConfig(): EmailNotificationConfig {
    return { ...this.config };
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.persist();
    this.notifyListeners();
  }

  public updateConfig(updates: Partial<EmailNotificationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.persist();
    this.notifyListeners();
  }

  public getLogs(): EmailNotificationLog[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.persist();
    this.notifyListeners();
  }

  public subscribe(listener: (logs: EmailNotificationLog[], latestSent?: EmailNotificationLog) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(latestSent?: EmailNotificationLog) {
    for (const listener of this.listeners) {
      try {
        listener([...this.logs], latestSent);
      } catch (err) {
        console.error('Email service listener error:', err);
      }
    }
  }

  /**
   * Generates a realistic SIEM email notification template
   */
  private buildEmailTemplate(alert: SecurityAlert): { subject: string; textBody: string; htmlBody: string } {
    const subject = `[${alert.riskLevel} ALERT] Potential Intrusion / Brute-Force from IP ${alert.ip}`;
    
    const textBody = `
======================================================
SOC HIGH-RISK INCIDENT NOTIFICATION (SIMULATED EMAIL)
======================================================
Incident ID:    INC-${alert.id}
Severity:       ${alert.riskLevel}
Timestamp:      ${alert.timestamp}
Targeted IP:    ${alert.ip}
Failed Logins:  ${alert.failedCount}
Rule Triggered: ${alert.ruleTriggered}
Description:    ${alert.description}

RECOMMENDED INCIDENT RESPONSE ACTIONS:
1. Block IP ${alert.ip} at border firewall / iptables.
2. Invalidate active sessions associated with user accounts targeted by ${alert.ip}.
3. Conduct deep-packet inspection of ingress requests from subnet.

SIEM Automated Incident Response System v4.1
Security Operations Center (SOC)
`.trim();

    const htmlBody = `
<div style="font-family: monospace, sans-serif; background-color: #0F172A; color: #E2E8F0; padding: 20px; border-radius: 8px; border: 1px solid #DC2626;">
  <div style="border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 15px;">
    <span style="background-color: #7F1D1D; color: #FECACA; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">
      ${alert.riskLevel} PRIORITY
    </span>
    <h2 style="color: #F87171; margin: 10px 0 5px 0; font-size: 18px;">
      Intrusion Detection: ${alert.ruleTriggered}
    </h2>
    <p style="color: #94A3B8; font-size: 12px; margin: 0;">
      Automated SOC notification generated at ${new Date().toISOString()}
    </p>
  </div>

  <table style="width: 100%; font-size: 13px; margin-bottom: 15px; border-collapse: collapse;">
    <tr>
      <td style="padding: 6px 0; color: #94A3B8; width: 140px;">Target IP Address:</td>
      <td style="padding: 6px 0; color: #38BDF8; font-weight: bold;">${alert.ip}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #94A3B8;">Failed Logins:</td>
      <td style="padding: 6px 0; color: #F87171; font-weight: bold;">${alert.failedCount} attempts</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #94A3B8;">Rule Triggered:</td>
      <td style="padding: 6px 0; color: #E2E8F0;">${alert.ruleTriggered}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #94A3B8;">Summary:</td>
      <td style="padding: 6px 0; color: #E2E8F0;">${alert.description}</td>
    </tr>
  </table>

  <div style="background-color: #1E293B; padding: 12px; border-radius: 6px; border-left: 4px solid #EF4444; font-size: 12px;">
    <strong style="color: #F87171;">RECOMMENDED MITIGATION ACTIONS:</strong>
    <ul style="margin: 6px 0 0 16px; padding: 0; color: #CBD5E1;">
      <li>Enforce firewall drop rule for ${alert.ip}</li>
      <li>Audit target account authentication logs</li>
      <li>Notify SOC tier-2 analyst on-call</li>
    </ul>
  </div>
</div>
`.trim();

    return { subject, textBody, htmlBody };
  }

  /**
   * Dispatches email alert if conditions are met
   */
  public async sendAlertNotification(
    alert: SecurityAlert, 
    force: boolean = false
  ): Promise<EmailNotificationLog | null> {
    if (!this.config.enabled && !force) {
      return null;
    }

    // Only trigger for configured severities (usually HIGH or CRITICAL) unless forced
    if (!force && !this.config.notifyOnSeverity.includes(alert.riskLevel)) {
      return null;
    }

    // Check cooldown to avoid redundant spam for the same IP
    const now = Date.now();
    const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
    const recentDuplicate = this.logs.find(
      l => l.targetIP === alert.ip && (now - new Date(l.sentAt).getTime() < cooldownMs)
    );

    if (recentDuplicate && !force) {
      return null;
    }

    const { subject, textBody, htmlBody } = this.buildEmailTemplate(alert);

    // Simulate network latency (200-400ms)
    const simulatedLatencyMs = Math.floor(Math.random() * 200) + 150;
    await new Promise(resolve => setTimeout(resolve, 80));

    const logItem: EmailNotificationLog = {
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      alertId: alert.id,
      targetIP: alert.ip,
      recipient: this.config.recipient,
      sender: this.config.sender,
      subject,
      textBody,
      htmlBody,
      severity: alert.riskLevel,
      failedCount: alert.failedCount,
      sentAt: new Date().toLocaleTimeString(),
      deliveryStatus: 'DELIVERED (SIMULATED)',
      simulatedLatencyMs
    };

    // Prepend to logs (keep max 30 items)
    this.logs = [logItem, ...this.logs.slice(0, 29)];
    this.persist();
    this.notifyListeners(logItem);

    return logItem;
  }

  /**
   * Helper to send a test high-risk alert email
   */
  public async sendTestAlert(customIP?: string): Promise<EmailNotificationLog> {
    const testAlert: SecurityAlert = {
      id: `test-${Date.now()}`,
      ip: customIP || '198.51.100.77',
      title: 'CRITICAL Intrusion Test Alert',
      description: 'Simulated high-risk credential stuffing attack triggered for mock testing.',
      failedCount: 14,
      riskLevel: 'CRITICAL',
      timestamp: new Date().toLocaleTimeString(),
      ruleTriggered: 'HIGH_RISK_BRUTE_FORCE (Mock Simulation)'
    };

    const result = await this.sendAlertNotification(testAlert, true);
    return result!;
  }
}

export const mockEmailService = new MockEmailNotificationService();
