import React, { useState, useMemo, useEffect } from 'react';
import { 
  Globe, 
  MapPin, 
  ShieldAlert, 
  Radio, 
  Maximize2, 
  Filter, 
  ArrowUpRight, 
  Crosshair, 
  AlertTriangle,
  Flame,
  Activity,
  Zap,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Compass,
  Navigation,
  ArrowLeft
} from 'lucide-react';
import { SuspiciousIP, RiskLevel, GeoLocationData, LogEntry } from '../types';
import { 
  getIPGeoLocation, 
  projectWorldCoordinates, 
  projectIndiaCoordinates,
  TARGET_CYBER_GATEWAY 
} from '../utils/geoIP';

interface LiveThreatMapProps {
  suspiciousIPs: SuspiciousIP[];
  entries: LogEntry[];
  onInvestigateIP: (ip: string) => void;
  onFilterByEvent?: (event: string) => void;
  isLiveStreamActive?: boolean;
  onBack?: () => void;
}

export const LiveThreatMap: React.FC<LiveThreatMapProps> = ({
  suspiciousIPs,
  entries,
  onInvestigateIP,
  onFilterByEvent,
  isLiveStreamActive = false,
  onBack
}) => {
  const [mapView, setMapView] = useState<'world' | 'india'>('world');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [activeNodeIP, setActiveNodeIP] = useState<string | null>(null);
  const [animatingRays, setAnimatingRays] = useState(true);

  // Compute geolocations for all suspicious IPs and active log IPs
  const geoNodes = useMemo(() => {
    const list: GeoLocationData[] = [];
    const seenIPs = new Set<string>();

    // 1. Process suspicious IPs first (they have highest priority and risk)
    for (const sip of suspiciousIPs) {
      if (!seenIPs.has(sip.ip)) {
        seenIPs.add(sip.ip);
        const geo = getIPGeoLocation(
          sip.ip, 
          sip.riskLevel, 
          sip.failedLogins, 
          sip.reasons.slice(0, 2),
          sip.lastSeen
        );
        list.push(geo);
      }
    }

    // 2. Process other failed login IPs from entries to populate the map realistically
    for (const entry of entries) {
      if (entry.event === 'LOGIN_FAILED' && !seenIPs.has(entry.ip)) {
        seenIPs.add(entry.ip);
        const geo = getIPGeoLocation(
          entry.ip,
          'LOW',
          1,
          ['AUTH_FAILURE'],
          entry.timestamp
        );
        list.push(geo);
      }
    }

    return list;
  }, [suspiciousIPs, entries]);

  // Filtered nodes based on view (world vs india) and severity
  const filteredNodes = useMemo(() => {
    return geoNodes.filter(node => {
      if (mapView === 'india' && !node.isIndia) {
        return false;
      }
      if (selectedSeverity !== 'ALL' && node.threatLevel !== selectedSeverity) {
        return false;
      }
      return true;
    });
  }, [geoNodes, mapView, selectedSeverity]);

  // Target Gateway coordinates in SVG space
  const targetSvgCoords = useMemo(() => {
    return mapView === 'world' 
      ? projectWorldCoordinates(TARGET_CYBER_GATEWAY.latitude, TARGET_CYBER_GATEWAY.longitude, 1000, 500)
      : projectIndiaCoordinates(TARGET_CYBER_GATEWAY.latitude, TARGET_CYBER_GATEWAY.longitude, 800, 600);
  }, [mapView]);

  // Selected node details
  const activeGeoNode = useMemo(() => {
    if (!activeNodeIP) return null;
    return geoNodes.find(n => n.ip === activeNodeIP) || null;
  }, [activeNodeIP, geoNodes]);

  // Live attack log feed (last 6 failed events with geo)
  const recentAttackFeed = useMemo(() => {
    const failed = entries.filter(e => e.event === 'LOGIN_FAILED');
    return failed.slice(-6).reverse().map((f, idx) => {
      const geo = getIPGeoLocation(f.ip, 'HIGH', 1, [], f.timestamp);
      return {
        id: `live-feed-${f.id || idx}-${f.ip}`,
        ip: f.ip,
        user: f.user || 'admin',
        reason: f.failureReason || 'Auth failed',
        city: geo.city,
        country: geo.country,
        countryCode: geo.countryCode,
        timestamp: f.timestamp,
        threatLevel: geo.threatLevel
      };
    });
  }, [entries]);

  // Set initial selected node if available
  useEffect(() => {
    if (!activeNodeIP && filteredNodes.length > 0) {
      setActiveNodeIP(filteredNodes[0].ip);
    }
  }, [filteredNodes, activeNodeIP]);

  return (
    <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Map Control Bar */}
      <div className="p-4 border-b border-[#1E293B] bg-[#0A0F1D] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-2 py-1 rounded bg-[#1E293B] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#334155] text-xs font-mono flex items-center gap-1 transition-colors mr-1"
              title="Return to previous screen"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Back</span>
            </button>
          )}
          <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5 font-mono">
                <span>LIVE THREAT RADAR MAP</span>
                {isLiveStreamActive && (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    LIVE TELEMETRY
                  </span>
                )}
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Geographic telemetry showing {filteredNodes.length} active attacking nodes targeting SOC Core Gateway
            </p>
          </div>
        </div>

        {/* View Switches & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* World vs India Switch */}
          <div className="bg-[#1E293B] p-0.5 rounded-lg flex border border-[#334155] text-xs font-mono">
            <button
              onClick={() => setMapView('world')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                mapView === 'world'
                  ? 'bg-blue-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>World View</span>
            </button>
            <button
              onClick={() => setMapView('india')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                mapView === 'india'
                  ? 'bg-amber-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>India Focus</span>
            </button>
          </div>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-[#1E293B] text-slate-300 border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Threats</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          {/* Attack Rays Toggle */}
          <button
            onClick={() => setAnimatingRays(!animatingRays)}
            title={animatingRays ? "Pause attack vectors" : "Resume attack vectors"}
            className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 ${
              animatingRays 
                ? 'bg-red-950/40 text-red-400 border-red-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {animatingRays ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{animatingRays ? 'Attack Vectors: ON' : 'Vectors: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main Map Viewport & Cyber Grid Canvas */}
      <div className="relative bg-[#070B14] min-h-[380px] sm:min-h-[460px] overflow-hidden flex items-center justify-center">
        {/* Subtle Cyber Radar Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(30, 41, 59, 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(30, 41, 59, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* High-Tech Radar Scanning Sweep Effect */}
        {animatingRays && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-10 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(59,130,246,0.3)_0deg,transparent_60deg,transparent_360deg)] animate-spin"
            style={{ animationDuration: '14s' }}
          />
        )}

        {/* Target Gateway Status Tag in Top Left */}
        <div className="absolute top-3 left-3 z-10 bg-[#0B0F1A]/90 border border-[#1E293B] px-3 py-1.5 rounded-md backdrop-blur text-[11px] font-mono text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-400">TARGET:</span>
          <span className="text-emerald-400 font-bold">{TARGET_CYBER_GATEWAY.name}</span>
          <span className="text-slate-500">[{TARGET_CYBER_GATEWAY.latitude.toFixed(2)}°N, {TARGET_CYBER_GATEWAY.longitude.toFixed(2)}°E]</span>
        </div>

        {/* Active Threats Counter Tag Top Right */}
        <div className="absolute top-3 right-3 z-10 bg-[#0B0F1A]/90 border border-red-500/30 px-3 py-1.5 rounded-md backdrop-blur text-[11px] font-mono text-red-300 flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span>ACTIVE ATTACK VECTORS:</span>
          <span className="font-bold text-red-200">{filteredNodes.length}</span>
        </div>

        {/* SVG Projection Map */}
        <svg
          viewBox={mapView === 'world' ? "0 0 1000 500" : "0 0 800 600"}
          className="w-full h-full max-h-[460px] select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Linear and Radial Gradients for Attack Rays */}
            <linearGradient id="attackGradCritical" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="attackGradHigh" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
            </linearGradient>
            <radialGradient id="gatewayGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="threatGlowCritical" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. World Map Geometries */}
          {mapView === 'world' ? (
            <g id="world-continents-layer" className="fill-[#141E33] stroke-[#243552] stroke-[0.7]">
              {/* North America */}
              <path d="M 80 80 Q 140 60 220 70 Q 280 85 280 130 Q 250 170 200 190 Q 180 230 150 250 Q 120 220 90 180 Q 70 130 80 80 Z" />
              {/* South America */}
              <path d="M 210 260 Q 270 270 290 320 Q 280 390 230 460 Q 190 410 180 340 Q 170 280 210 260 Z" />
              {/* Europe */}
              <path d="M 450 70 Q 530 60 550 110 Q 520 150 470 160 Q 430 150 410 110 Q 420 80 450 70 Z" />
              {/* Africa */}
              <path d="M 430 175 Q 520 170 550 230 Q 550 310 500 390 Q 450 410 430 350 Q 400 270 410 210 Q 415 180 430 175 Z" />
              {/* Asia & Eurasia */}
              <path d="M 540 60 Q 720 50 830 100 Q 860 160 800 230 Q 710 230 640 200 Q 580 210 540 160 Q 530 100 540 60 Z" />
              {/* Australia */}
              <path d="M 750 320 Q 840 310 860 360 Q 830 420 760 410 Q 730 360 750 320 Z" />
              {/* India Silhouette Accent within Asia */}
              <path 
                d="M 645 190 Q 675 195 680 220 Q 665 260 655 280 Q 645 260 635 220 Z" 
                className="fill-[#1E293B] stroke-amber-500/40 stroke-1"
              />
            </g>
          ) : (
            /* 2. India Detailed Focus Map Geometries */
            <g id="india-regional-layer">
              {/* Sub-continental outline */}
              <path
                d="
                  M 330 60 
                  Q 370 70 440 90 
                  Q 490 120 520 150 
                  Q 580 150 630 160 
                  Q 660 180 630 210 
                  Q 580 230 550 240 
                  Q 530 260 540 300 
                  Q 500 370 460 440 
                  Q 420 510 390 560 
                  Q 380 570 370 560 
                  Q 340 500 320 440 
                  Q 290 380 270 320 
                  Q 240 280 220 250 
                  Q 200 230 220 190 
                  Q 270 170 290 130 
                  Q 300 80 330 60 Z
                "
                className="fill-[#101A2E] stroke-[#3B82F6]/40 stroke-2"
              />
              {/* Regional grid lines */}
              <line x1="100" y1="250" x2="700" y2="250" stroke="#1E293B" strokeDasharray="4 4" strokeWidth="0.8" />
              <line x1="100" y1="400" x2="700" y2="400" stroke="#1E293B" strokeDasharray="4 4" strokeWidth="0.8" />
              <line x1="390" y1="50" x2="390" y2="570" stroke="#1E293B" strokeDasharray="4 4" strokeWidth="0.8" />
              {/* Coastline labels */}
              <text x="170" y="380" fill="#334155" fontSize="12" fontFamily="monospace">ARABIAN SEA</text>
              <text x="560" y="380" fill="#334155" fontSize="12" fontFamily="monospace">BAY OF BENGAL</text>
              <text x="350" y="590" fill="#334155" fontSize="11" fontFamily="monospace">INDIAN OCEAN</text>
            </g>
          )}

          {/* 3. Animated Attack Vectors / Arcs from Attacking Nodes to Central Gateway */}
          {animatingRays && filteredNodes.map((node) => {
            const sourceCoords = mapView === 'world' 
              ? projectWorldCoordinates(node.latitude, node.longitude, 1000, 500)
              : projectIndiaCoordinates(node.latitude, node.longitude, 800, 600);

            // Compute bezier curve midpoint for organic curved attack trajectories
            const midX = (sourceCoords.x + targetSvgCoords.x) / 2;
            const midY = Math.min(sourceCoords.y, targetSvgCoords.y) - 40;
            const pathD = `M ${sourceCoords.x} ${sourceCoords.y} Q ${midX} ${midY} ${targetSvgCoords.x} ${targetSvgCoords.y}`;

            const isCritical = node.threatLevel === 'CRITICAL';
            const strokeColor = isCritical ? '#EF4444' : node.threatLevel === 'HIGH' ? '#F97316' : '#EAB308';

            return (
              <g key={`vector-${node.ip}`}>
                {/* Background faint trajectory arc */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeOpacity="0.2"
                  strokeWidth="1.2"
                />
                {/* Moving glowing attack packet particle */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeOpacity="0.85"
                  strokeWidth={isCritical ? "2.2" : "1.6"}
                  strokeDasharray="12 280"
                  className="animate-pulse"
                  style={{
                    animationDuration: isCritical ? '1.5s' : '2.8s',
                    filter: 'drop-shadow(0 0 3px currentColor)'
                  }}
                />
              </g>
            );
          })}

          {/* 4. Target Enterprise SOC Gateway Center Node (Mumbai) */}
          <g transform={`translate(${targetSvgCoords.x}, ${targetSvgCoords.y})`}>
            {/* Pulsing Target Rings */}
            <circle r="22" fill="url(#gatewayGlow)" className="animate-ping" style={{ animationDuration: '3s' }} />
            <circle r="12" fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle r="6" fill="#10B981" stroke="#064E3B" strokeWidth="2" />
            <text
              y="20"
              textAnchor="middle"
              fill="#10B981"
              fontSize="10"
              fontWeight="bold"
              fontFamily="monospace"
              className="drop-shadow-md"
            >
              SOC GATEWAY
            </text>
          </g>

          {/* 5. Attacking Threat Source Nodes */}
          {filteredNodes.map((node) => {
            const coords = mapView === 'world'
              ? projectWorldCoordinates(node.latitude, node.longitude, 1000, 500)
              : projectIndiaCoordinates(node.latitude, node.longitude, 800, 600);

            const isCritical = node.threatLevel === 'CRITICAL';
            const isHigh = node.threatLevel === 'HIGH';
            const isSelected = node.ip === activeNodeIP;

            const fillColor = isCritical ? '#EF4444' : isHigh ? '#F97316' : '#EAB308';
            const outerGlowRadius = isCritical ? 16 : isHigh ? 12 : 8;

            return (
              <g
                key={`node-${node.ip}`}
                transform={`translate(${coords.x}, ${coords.y})`}
                onClick={() => {
                  setActiveNodeIP(node.ip);
                  onInvestigateIP(node.ip);
                }}
                className="cursor-pointer transition-transform hover:scale-125 group"
              >
                {/* Outer Ping for Critical/High */}
                {(isCritical || isHigh) && (
                  <circle
                    r={outerGlowRadius}
                    fill={fillColor}
                    fillOpacity="0.25"
                    className="animate-ping"
                    style={{ animationDuration: isCritical ? '1.2s' : '2.2s' }}
                  />
                )}

                {/* Selection indicator halo */}
                {isSelected && (
                  <circle
                    r="14"
                    fill="none"
                    stroke="#60A5FA"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    className="animate-spin"
                    style={{ animationDuration: '6s' }}
                  />
                )}

                {/* Node Core Marker */}
                <circle
                  r={isCritical ? "6" : "4.5"}
                  fill={fillColor}
                  stroke="#0B0E14"
                  strokeWidth="1.5"
                  className="group-hover:stroke-white transition-colors"
                  style={{ filter: `drop-shadow(0 0 6px ${fillColor})` }}
                />

                {/* Quick IP Label on hover or if high risk */}
                <text
                  y="-9"
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  className={`transition-opacity ${
                    isSelected ? 'opacity-100 font-bold fill-blue-400' : 'opacity-70 group-hover:opacity-100'
                  }`}
                >
                  {node.city || node.ip}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Overlay Card (Bottom Center) */}
        {activeGeoNode && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-10 bg-[#0B0F1D]/95 border border-[#1E293B] rounded-lg p-3 shadow-xl backdrop-blur flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-md shrink-0 border ${
                activeGeoNode.threatLevel === 'CRITICAL' 
                  ? 'bg-red-950/60 border-red-500/40 text-red-400' 
                  : 'bg-orange-950/60 border-orange-500/40 text-orange-400'
              }`}>
                <Crosshair className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white truncate">
                    {activeGeoNode.ip}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    activeGeoNode.threatLevel === 'CRITICAL' 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                      : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  }`}>
                    {activeGeoNode.threatLevel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  📍 {activeGeoNode.city}, {activeGeoNode.country} • {activeGeoNode.asn || 'ISP Subnet'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onInvestigateIP(activeGeoNode.ip)}
              className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold flex items-center gap-1 shrink-0 transition-colors shadow"
            >
              <span>Investigate</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Real-Time Live Attack Stream Ticker */}
      <div className="border-t border-[#1E293B] bg-[#0A0E1A] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-slate-300 uppercase">Live Attack Ticker</span>
            <span className="text-slate-600">•</span>
            <span>Real-time authentication breach attempts</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Click any entry to open deep forensic panel
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {recentAttackFeed.map((attack) => (
            <div
              key={attack.id}
              onClick={() => onInvestigateIP(attack.ip)}
              className="bg-[#0F172A] hover:bg-[#1E293B] border border-[#1E293B] hover:border-red-500/40 p-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 group-hover:animate-ping"></span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-white">
                    <span className="font-bold text-red-400 truncate">{attack.ip}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-slate-300 truncate">user={attack.user}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    📍 {attack.city}, {attack.countryCode} • {attack.reason}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                {attack.timestamp.slice(-8)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
