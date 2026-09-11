export interface PythonFile {
  name: string;
  path: string;
  language: string;
  description: string;
  code: string;
}

export const PYTHON_PROJECT_STRUCTURE: PythonFile[] = [
  {
    name: 'main.py',
    path: 'main.py',
    language: 'python',
    description: 'CLI entry point, orchestrating parsing, analysis, alert checks, database persistence, and reporting.',
    code: `"""
Cybersecurity Log Analyzer - Main Orchestrator
CLI & Core Workflow Entry Point
"""
import sys
import os
from log_parser import parse_log_file
from analyzer import analyze_logs, get_suspicious_ips
from alerts import generate_alerts, print_alerts
from database import init_db, save_analysis_summary, save_suspicious_ip

def main(log_filepath="logs/sample.log"):
    print("=" * 60)
    print("🔐 CYBERSECURITY LOG ANALYZER")
    print("=" * 60)
    
    if not os.path.exists(log_filepath):
        print(f"[!] Error: Target log file '{log_filepath}' not found.")
        sys.exit(1)

    print(f"[*] Parsing log file: {log_filepath}...")
    logs = parse_log_file(log_filepath)
    print(f"[✓] Successfully parsed {len(logs)} log entries.\\n")

    # Step 1: Run core log analytics
    summary, failed_logins, ip_activity = analyze_logs(logs)
    print("--- 📊 Analysis Summary ---")
    print(f"Total Logs:            {summary['total_logs']}")
    print(f"Successful Logins:     {summary['successful_logins']}")
    print(f"Failed Login Attempts: {summary['failed_logins']}")
    print(f"Errors/Exceptions:     {summary['errors']}")
    print(f"Unique IPs:            {summary['unique_ips']}")
    
    # Step 2: Detection Logic
    suspicious_ips = get_suspicious_ips(failed_logins, threshold=5)
    
    # Step 3: Security Alerts
    alerts = generate_alerts(suspicious_ips)
    print_alerts(alerts)

    # Step 4: Persist to SQLite Database
    init_db()
    save_analysis_summary(summary)
    for item in suspicious_ips:
        save_suspicious_ip(item['ip'], item['failed_count'], item['risk_level'])
    print("[✓] Analysis and IOCs saved to SQLite database.\\n")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "logs/sample.log"
    main(target)
`
  },
  {
    name: 'log_parser.py',
    path: 'log_parser.py',
    language: 'python',
    description: 'Parses standard space-delimited logs, regex-based server logs, and auth syslog files into structured dictionaries.',
    code: `"""
Cybersecurity Log Analyzer - Log Parser
Level 1 (File Handling & Dictionaries) + Level 2 (Regex Parser)
"""
import re
from datetime import datetime

# Regex pattern for timestamp, event, IP, and optional message
STD_PATTERN = re.compile(
    r'^(?P<timestamp>\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})\\s+(?P<event>[A-Z_]+)\\s+(?P<ip>\\d{1,3}(?:\\.\\d{1,3}){3})(?:\\s+(?P<message>.*))?$'
)

# Apache / Nginx combined access log pattern
APACHE_PATTERN = re.compile(
    r'^(?P<ip>\\d{1,3}(?:\\.\\d{1,3}){3})\\s+\\S+\\s+\\S+\\s+\\[(?P<timestamp>[^\\]]+)\\]\\s+"(?P<method>[A-Z]+)\\s+(?P<path>\\S+)\\s+[^\"]+"\\s+(?P<status>\\d{3})\\s+(?P<bytes>\\d+)'
)

def parse_line(line: str) -> dict:
    """Parses a single log line into a structured record."""
    line = line.strip()
    if not line or line.startswith('#'):
        return None

    # Try Standard format
    m_std = STD_PATTERN.match(line)
    if m_std:
        d = m_std.groupdict()
        return {
            "timestamp": d["timestamp"],
            "event": d["event"],
            "ip": d["ip"],
            "message": d["message"] or "",
            "raw": line
        }

    # Try Apache / Nginx format
    m_web = APACHE_PATTERN.match(line)
    if m_web:
        d = m_web.groupdict()
        status = int(d["status"])
        event = "LOGIN_SUCCESS" if status == 200 and "login" in d["path"] else \\
                "LOGIN_FAILED" if status == 401 else \\
                "ERROR" if status >= 500 else "INFO"
        return {
            "timestamp": d["timestamp"],
            "event": event,
            "ip": d["ip"],
            "message": f"{d['method']} {d['path']} [{status}]",
            "raw": line
        }

    # Fallback to basic space split (Phase 1 simplicity)
    parts = line.split()
    if len(parts) >= 4:
        return {
            "timestamp": f"{parts[0]} {parts[1]}",
            "event": parts[2],
            "ip": parts[3],
            "message": " ".join(parts[4:]) if len(parts) > 4 else "",
            "raw": line
        }
    return None

def parse_log_file(filepath: str) -> list:
    """Opens and processes a log file line by line."""
    parsed_logs = []
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            entry = parse_line(line)
            if entry:
                parsed_logs.append(entry)
    return parsed_logs
`
  },
  {
    name: 'analyzer.py',
    path: 'analyzer.py',
    language: 'python',
    description: 'Statistical aggregation, failed login counters, IP activity tracking, and risk assessment logic.',
    code: `"""
Cybersecurity Log Analyzer - Analysis Engine
Computes aggregates, failed login frequency, and suspicious IP detection.
"""
from collections import defaultdict

def analyze_logs(logs: list):
    """
    Analyzes log entries to compute totals and IP failure counts.
    Returns:
        summary (dict): overall count metrics
        failed_logins (dict): {ip: count}
        ip_activity (dict): {ip: total_requests}
    """
    total = len(logs)
    successful_logins = 0
    failed_logins = defaultdict(int)
    ip_activity = defaultdict(int)
    errors = 0

    for entry in logs:
        ip = entry["ip"]
        event = entry["event"]
        ip_activity[ip] += 1

        if event == "LOGIN_SUCCESS":
            successful_logins += 1
        elif event == "LOGIN_FAILED":
            failed_logins[ip] += 1
        elif event == "ERROR":
            errors += 1

    summary = {
        "total_logs": total,
        "successful_logins": successful_logins,
        "failed_logins": sum(failed_logins.values()),
        "errors": errors,
        "unique_ips": len(ip_activity)
    }
    return summary, dict(failed_logins), dict(ip_activity)

def get_suspicious_ips(failed_logins: dict, threshold: int = 5) -> list:
    """
    Detection Logic:
    Flags IPs with failed logins exceeding the threshold.
    Assigns Risk Levels:
      - >= 10: HIGH / CRITICAL
      - >= 5:  MEDIUM (Suspicious)
      - < 5:   LOW
    """
    suspicious = []
    for ip, count in failed_logins.items():
        if count >= threshold:
            risk = "CRITICAL" if count >= 15 else ("HIGH" if count >= 10 else "MEDIUM")
            suspicious.append({
                "ip": ip,
                "failed_count": count,
                "risk_level": risk,
                "reason": f"{count} failed authentication attempts (Threshold: {threshold})"
            })
    # Sort by highest failed count
    suspicious.sort(key=lambda x: x["failed_count"], reverse=True)
    return suspicious
`
  },
  {
    name: 'alerts.py',
    path: 'alerts.py',
    language: 'python',
    description: 'Generates structured security alerts for SOC operators and formats terminal output.',
    code: `"""
Cybersecurity Log Analyzer - Alerts Module
Formats and emits security warnings based on detected suspicious activity.
"""
from datetime import datetime

def generate_alerts(suspicious_ips: list) -> list:
    """Generates alert dictionaries for all flagged IPs."""
    alerts = []
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    for item in suspicious_ips:
        alert = {
            "title": f"ALERT: Suspicious Brute Force from {item['ip']}",
            "ip": item["ip"],
            "failed_attempts": item["failed_count"],
            "risk_level": item["risk_level"],
            "timestamp": now,
            "message": f"IP: {item['ip']} triggered security alert with {item['failed_count']} failed login attempts."
        }
        alerts.append(alert)
    return alerts

def print_alerts(alerts: list):
    """Outputs formatted alerts to terminal (matches Project Plan spec)."""
    if not alerts:
        print("\\n[✓] No suspicious activity detected. All systems normal.\\n")
        return

    print("\\n" + "!" * 50)
    print("🚨 SECURITY ALERTS DETECTED")
    print("!" * 50)
    for alert in alerts:
        print(f"\\nALERT!")
        print(f"IP: {alert['ip']}")
        print(f"Failed Login Attempts: {alert['failed_attempts']}")
        print(f"Risk Level: {alert['risk_level']}")
        print("-" * 30)
`
  },
  {
    name: 'database.py',
    path: 'database.py',
    language: 'python',
    description: 'Level 3 SQLite database layer for persistent audit logs, IOC storage, and historical run tracking.',
    code: `"""
Cybersecurity Log Analyzer - SQLite Database Layer
Stores analysis history and flagged malicious IPs (Level 3 Upgrade)
"""
import sqlite3
from datetime import datetime

DB_FILE = "log_analyzer.db"

def get_connection():
    return sqlite3.connect(DB_FILE)

def init_db():
    """Initializes tables for analysis history and suspicious IP records."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analysis_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_date TEXT,
        total_logs INTEGER,
        successful_logins INTEGER,
        failed_logins INTEGER,
        errors INTEGER,
        unique_ips INTEGER
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS suspicious_ips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT,
        failed_count INTEGER,
        risk_level TEXT,
        flagged_date TEXT
    )
    """)
    conn.commit()
    conn.close()

def save_analysis_summary(summary: dict):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO analysis_runs (run_date, total_logs, successful_logins, failed_logins, errors, unique_ips)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        summary["total_logs"],
        summary["successful_logins"],
        summary["failed_logins"],
        summary["errors"],
        summary["unique_ips"]
    ))
    conn.commit()
    conn.close()

def save_suspicious_ip(ip: str, failed_count: int, risk_level: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO suspicious_ips (ip, failed_count, risk_level, flagged_date)
    VALUES (?, ?, ?, ?)
    """, (ip, failed_count, risk_level, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    conn.commit()
    conn.close()
`
  },
  {
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    description: 'Interview project documentation outlining problem, architecture, detection logic, and execution.',
    code: `# 🔐 Cybersecurity Log Analyzer

An automated log intelligence and intrusion detection system designed to parse high-volume authentication logs, isolate brute-force attacks and error bursts, and generate actionable SOC alerts.

## 🎯 Interview Pitch & Talking Points
- **Problem Statement**: Modern enterprises generate gigabytes of log telemetry every day. Manual inspection is unscalable and misses credential stuffing and distributed brute-force velocity.
- **Solution**: A modular Python engine (or Flask web dashboard) that parses logs via regex, aggregates authentication attempts per IP, detects policy violations (>5 failed logins), and persists IOCs to SQLite.
- **Key Detection Logic**:
  \`\`\`python
  for ip, count in failed_logins.items():
      if count >= 5:
          print("ALERT: Suspicious activity detected from", ip)
  \`\`\`
- **Project Structure**:
  \`main.py\` → \`log_parser.py\` → \`analyzer.py\` → \`alerts.py\` → \`database.py\`
- **Placement Levels Demonstrated**:
  - Level 1: File I/O & Hash Maps (Python Dictionaries)
  - Level 2: Regular Expressions & JSON/CSV Reports
  - Level 3: SQLite Relational Persistence
  - Level 4: Interactive Web Dashboard & Real-Time SOC Telemetry
`
  }
];

export const INTERVIEW_SECTIONS = [
  {
    title: '1. Problem Statement',
    desc: 'Why did you build this project?',
    content: 'Organizations generate massive volumes of authentication and system logs every second (SSH, Web, PAM, Active Directory). Without automated analysis, brute-force credential stuffing and unauthorized probing slip through undetected until a breach occurs.'
  },
  {
    title: '2. Detection Architecture',
    desc: 'How does your detection pipeline work?',
    content: '1. Ingestion: Reads text logs line-by-line via streaming file handles to avoid memory bottlenecks.\n2. Extraction: Applies regex tokenizers to pull Timestamp, Event (LOGIN_FAILED, ERROR, etc.), and Client IP.\n3. Aggregation: Builds high-performance frequency maps {IP: failed_count}.\n4. Threshold Evaluation: Evaluates security policies (e.g., failed attempts >= 5 => Flag Suspicious, >= 10 => HIGH Alert).'
  },
  {
    title: '3. Data Structures & Complexity',
    desc: 'Which data structures did you use and why?',
    content: 'We use Python dictionaries (Hash Maps) to achieve O(1) average-time lookups and amortized O(N) total processing time where N is the number of log lines. A threshold scan over unique IPs takes O(U) where U <= N.'
  },
  {
    title: '4. Scalability & Upgrades',
    desc: 'How would you scale this to millions of lines?',
    content: 'For large enterprise telemetry: replace single-node file reading with Kafka or Logstash streaming queues, chunk logs across Celery worker pools, and index aggregated events in OpenSearch/Elasticsearch with Redis rate-limiting windows.'
  }
];
