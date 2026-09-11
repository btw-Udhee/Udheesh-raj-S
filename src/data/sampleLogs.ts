export interface SampleLogPreset {
  id: string;
  name: string;
  badge: string;
  fileName: string;
  description: string;
  content: string;
}

export const SAMPLE_LOG_PRESETS: SampleLogPreset[] = [
  {
    id: 'phase1-simple',
    name: 'Phase 1: Basic Sample (From Plan)',
    badge: 'Phase 1',
    fileName: 'sample.log',
    description: 'The exact initial log file defined in Phase 1 of the project plan.',
    content: `2026-09-01 10:00:01 LOGIN_SUCCESS 192.168.1.5
2026-09-01 10:01:15 LOGIN_FAILED 192.168.1.10
2026-09-01 10:02:20 LOGIN_FAILED 192.168.1.10
2026-09-01 10:03:10 LOGIN_SUCCESS 192.168.1.5
2026-09-01 10:04:00 ERROR 192.168.1.20`
  },
  {
    id: 'bruteforce-attack',
    name: 'Brute Force & Credential Stuffing',
    badge: 'High Risk Attack',
    fileName: 'auth.log',
    description: 'Simulated brute-force attack matching the prompt alert scenario (>10 failed logins on 192.168.1.10 and dictionary attack from 203.0.113.45).',
    content: `2026-09-01 10:00:01 LOGIN_SUCCESS 192.168.1.5 user=sarah_admin
2026-09-01 10:01:15 LOGIN_FAILED 192.168.1.10 user=admin
2026-09-01 10:01:30 LOGIN_FAILED 192.168.1.10 user=root
2026-09-01 10:02:20 LOGIN_FAILED 192.168.1.10 user=administrator
2026-09-01 10:02:45 LOGIN_FAILED 192.168.1.10 user=test
2026-09-01 10:03:00 LOGIN_FAILED 192.168.1.10 user=user1
2026-09-01 10:03:10 LOGIN_SUCCESS 192.168.1.5 user=sarah_admin
2026-09-01 10:03:22 LOGIN_FAILED 192.168.1.10 user=guest
2026-09-01 10:03:40 LOGIN_FAILED 192.168.1.10 user=sysadmin
2026-09-01 10:03:55 LOGIN_FAILED 192.168.1.10 user=operator
2026-09-01 10:04:00 ERROR 192.168.1.20 connection_reset_by_peer
2026-09-01 10:04:12 LOGIN_FAILED 192.168.1.10 user=postgres
2026-09-01 10:04:30 LOGIN_FAILED 192.168.1.10 user=backup
2026-09-01 10:04:50 LOGIN_FAILED 192.168.1.10 user=master
2026-09-01 10:05:00 LOGIN_FAILED 192.168.1.10 user=superadmin
2026-09-01 10:05:15 LOGIN_SUCCESS 10.0.0.42 user=dev_lead
2026-09-01 10:06:01 LOGIN_FAILED 203.0.113.45 user=root
2026-09-01 10:06:05 LOGIN_FAILED 203.0.113.45 user=oracle
2026-09-01 10:06:10 LOGIN_FAILED 203.0.113.45 user=mysql
2026-09-01 10:06:15 LOGIN_FAILED 203.0.113.45 user=ftpuser
2026-09-01 10:06:20 LOGIN_FAILED 203.0.113.45 user=support
2026-09-01 10:06:25 LOGIN_FAILED 203.0.113.45 user=ubuntu
2026-09-01 10:07:00 ERROR 203.0.113.45 excessive_socket_exhaustion
2026-09-01 10:07:15 LOGIN_SUCCESS 192.168.1.15 user=accounting_01
2026-09-01 10:08:00 INFO 192.168.1.5 session_keepalive
2026-09-01 10:08:45 WARNING 192.168.1.30 ssl_certificate_near_expiry
2026-09-01 10:09:10 ERROR 192.168.1.30 database_timeout`
  },
  {
    id: 'web-access-log',
    name: 'Web Server Access & Probe Scan',
    badge: 'Web Exploit Scan',
    fileName: 'access.log',
    description: 'Web server access log containing directory traversal attempts, SQL injection probes, 401 unauthorized, and 500 error spikes.',
    content: `198.51.100.24 - - [01/Sep/2026:11:10:00 +0000] "GET /api/v1/health HTTP/1.1" 200 145
198.51.100.24 - - [01/Sep/2026:11:10:15 +0000] "POST /api/login HTTP/1.1" 200 892
45.33.32.156 - - [01/Sep/2026:11:11:02 +0000] "POST /api/login HTTP/1.1" 401 234
45.33.32.156 - - [01/Sep/2026:11:11:10 +0000] "POST /api/login HTTP/1.1" 401 234
45.33.32.156 - - [01/Sep/2026:11:11:18 +0000] "POST /api/login HTTP/1.1" 401 234
45.33.32.156 - - [01/Sep/2026:11:11:25 +0000] "POST /api/login HTTP/1.1" 401 234
45.33.32.156 - - [01/Sep/2026:11:11:32 +0000] "POST /api/login HTTP/1.1" 401 234
45.33.32.156 - - [01/Sep/2026:11:11:40 +0000] "POST /api/login HTTP/1.1" 401 234
45.33.32.156 - - [01/Sep/2026:11:11:55 +0000] "GET /wp-login.php HTTP/1.1" 404 180
45.33.32.156 - - [01/Sep/2026:11:12:01 +0000] "GET /.env HTTP/1.1" 403 150
45.33.32.156 - - [01/Sep/2026:11:12:09 +0000] "GET /phpmyadmin/index.php HTTP/1.1" 404 180
45.33.32.156 - - [01/Sep/2026:11:12:15 +0000] "GET /../../etc/passwd HTTP/1.1" 403 150
192.168.1.5 - - [01/Sep/2026:11:13:00 +0000] "GET /dashboard HTTP/1.1" 200 4520
192.168.1.5 - - [01/Sep/2026:11:13:45 +0000] "GET /api/reports HTTP/1.1" 200 8912
185.220.101.5 - - [01/Sep/2026:11:14:02 +0000] "POST /login HTTP/1.1" 401 210
185.220.101.5 - - [01/Sep/2026:11:14:10 +0000] "POST /login HTTP/1.1" 401 210
185.220.101.5 - - [01/Sep/2026:11:14:15 +0000] "POST /login HTTP/1.1" 401 210
185.220.101.5 - - [01/Sep/2026:11:14:22 +0000] "POST /login HTTP/1.1" 401 210
185.220.101.5 - - [01/Sep/2026:11:14:30 +0000] "POST /login HTTP/1.1" 401 210
185.220.101.5 - - [01/Sep/2026:11:14:38 +0000] "POST /login HTTP/1.1" 401 210
185.220.101.5 - - [01/Sep/2026:11:14:45 +0000] "POST /login HTTP/1.1" 401 210
10.0.0.12 - - [01/Sep/2026:11:15:00 +0000] "POST /api/checkout HTTP/1.1" 500 512
10.0.0.12 - - [01/Sep/2026:11:15:20 +0000] "POST /api/checkout HTTP/1.1" 500 512`
  },
  {
    id: 'server-syslog',
    name: 'Linux System auth.log (SSH & Sudo)',
    badge: 'Syslog Auth',
    fileName: 'server.log',
    description: 'Authentic Linux SSH daemon authentication log showing failed passwords, invalid user brute force, and accepted publickeys.',
    content: `Sep 01 10:00:15 soc-server sshd[14210]: Accepted publickey for ubuntu from 192.168.1.50 port 52310 ssh2
Sep 01 10:01:05 soc-server sshd[14221]: Failed password for root from 194.26.29.111 port 41202 ssh2
Sep 01 10:01:08 soc-server sshd[14223]: Failed password for invalid user admin from 194.26.29.111 port 41208 ssh2
Sep 01 10:01:12 soc-server sshd[14225]: Failed password for invalid user test from 194.26.29.111 port 41212 ssh2
Sep 01 10:01:16 soc-server sshd[14228]: Failed password for invalid user guest from 194.26.29.111 port 41218 ssh2
Sep 01 10:01:21 soc-server sshd[14231]: Failed password for root from 194.26.29.111 port 41224 ssh2
Sep 01 10:01:25 soc-server sshd[14234]: Failed password for invalid user nagios from 194.26.29.111 port 41230 ssh2
Sep 01 10:02:00 soc-server sudo: pam_unix(sudo:auth): authentication failure; logname=alice uid=1001 euid=0 tty=/dev/pts/1 ruser=alice rhost=192.168.1.105
Sep 01 10:03:40 soc-server sshd[14240]: Accepted password for devops from 192.168.1.50 port 52400 ssh2
Sep 01 10:04:15 soc-server sshd[14255]: Connection closed by 194.26.29.111 port 41235 [preauth]
Sep 01 10:05:00 soc-server kernel: [19420.12] Out of memory: Kill process 891 (python3) score 410 or sacrifice child`
  },
  {
    id: 'system-error-auth-cascade',
    name: 'System Outage & Auth Cascade (Correlation Analysis)',
    badge: 'Error-Induced Failures',
    fileName: 'prod_auth_telemetry.log',
    description: 'Demonstrates cascading authentication failures directly caused by database pool exhaustion and LDAP timeouts across multiple departments and IPs, plus an attacker causing socket exhaustion.',
    content: `2026-09-01 10:00:05 LOGIN_SUCCESS 192.168.1.15 user=sarah_admin
2026-09-01 10:01:20 LOGIN_SUCCESS 192.168.1.22 user=accounting_01
2026-09-01 10:02:10 INFO 10.0.0.1 db_pool_active_connections=48 max=50
2026-09-01 10:04:00 ERROR 10.0.0.1 database_timeout pool_exhausted max_connections_reached
2026-09-01 10:04:02 LOGIN_FAILED 192.168.1.15 user=sarah_admin db_query_timeout
2026-09-01 10:04:06 LOGIN_FAILED 192.168.1.22 user=accounting_01 connection_timeout
2026-09-01 10:04:11 LOGIN_FAILED 10.0.2.45 user=dev_lead connection_timeout
2026-09-01 10:04:18 LOGIN_FAILED 192.168.1.80 user=hr_director auth_backend_unavailable
2026-09-01 10:04:30 INFO 10.0.0.1 db_pool_recycled connections_released
2026-09-01 10:05:00 LOGIN_SUCCESS 192.168.1.15 user=sarah_admin
2026-09-01 10:06:15 LOGIN_SUCCESS 10.0.2.45 user=dev_lead
2026-09-01 10:07:30 ERROR 10.0.0.2 ldap_directory_unreachable connection_refused
2026-09-01 10:07:33 LOGIN_FAILED 192.168.1.110 user=finance_mgr ldap_lookup_failed
2026-09-01 10:07:38 LOGIN_FAILED 192.168.1.115 user=ops_engineer ldap_timeout
2026-09-01 10:07:44 LOGIN_FAILED 10.0.2.12 user=intern_02 directory_service_unavailable
2026-09-01 10:08:10 LOGIN_SUCCESS 10.0.0.2 ldap_service_restored
2026-09-01 10:09:00 LOGIN_FAILED 203.0.113.45 user=root
2026-09-01 10:09:02 LOGIN_FAILED 203.0.113.45 user=admin
2026-09-01 10:09:04 LOGIN_FAILED 203.0.113.45 user=test
2026-09-01 10:09:06 LOGIN_FAILED 203.0.113.45 user=backup
2026-09-01 10:09:08 LOGIN_FAILED 203.0.113.45 user=guest
2026-09-01 10:09:10 ERROR 203.0.113.45 excessive_socket_exhaustion too_many_open_files
2026-09-01 10:10:00 WARNING 192.168.1.30 rate_limit_approaching`
  }
];

