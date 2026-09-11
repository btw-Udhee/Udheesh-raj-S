import { GeoLocationData, RiskLevel } from '../types';

interface KnownGeoLocation {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  asn: string;
  isIndia: boolean;
}

// Well-known and realistic geolocation profiles for demo and sample IPs
const KNOWN_IP_REGISTRY: Record<string, KnownGeoLocation> = {
  // Global Attacker IPs
  '203.0.113.45': {
    city: 'Sofia',
    region: 'Sofia-Grad',
    country: 'Bulgaria',
    countryCode: 'BG',
    latitude: 42.6977,
    longitude: 23.3219,
    asn: 'AS49304 (Hostkey B.V.)',
    isIndia: false
  },
  '194.26.29.111': {
    city: 'Frankfurt',
    region: 'Hesse',
    country: 'Germany',
    countryCode: 'DE',
    latitude: 50.1109,
    longitude: 8.6821,
    asn: 'AS200019 (Alexhost SRL)',
    isIndia: false
  },
  '185.220.101.5': {
    city: 'Amsterdam',
    region: 'North Holland',
    country: 'Netherlands',
    countryCode: 'NL',
    latitude: 52.3676,
    longitude: 4.9041,
    asn: 'AS208367 (Tor Exit Relay)',
    isIndia: false
  },
  '45.33.32.156': {
    city: 'Fremont',
    region: 'California',
    country: 'United States',
    countryCode: 'US',
    latitude: 37.5485,
    longitude: -121.9886,
    asn: 'AS63949 (Linode Cloud)',
    isIndia: false
  },
  '198.51.100.89': {
    city: 'Beijing',
    region: 'Beijing',
    country: 'China',
    countryCode: 'CN',
    latitude: 39.9042,
    longitude: 116.4074,
    asn: 'AS4134 (China Telecom)',
    isIndia: false
  },
  '185.190.140.22': {
    city: 'Moscow',
    region: 'Central',
    country: 'Russia',
    countryCode: 'RU',
    latitude: 55.7558,
    longitude: 37.6173,
    asn: 'AS48282 (Selectel ISP)',
    isIndia: false
  },
  '104.244.76.13': {
    city: 'Reykjavik',
    region: 'Capital Region',
    country: 'Iceland',
    countryCode: 'IS',
    latitude: 64.1466,
    longitude: -21.9426,
    asn: 'AS39351 (FlokiNET Bulletproof)',
    isIndia: false
  },

  // Indian Threats and Infrastructure Nodes
  '103.21.244.0': {
    city: 'Bengaluru',
    region: 'Karnataka',
    country: 'India',
    countryCode: 'IN',
    latitude: 12.9716,
    longitude: 77.5946,
    asn: 'AS13335 (Cloudflare South Asia)',
    isIndia: true
  },
  '49.36.120.18': {
    city: 'Mumbai',
    region: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    latitude: 19.0760,
    longitude: 72.8777,
    asn: 'AS55836 (Reliance Jio Infocomm)',
    isIndia: true
  },
  '103.48.196.22': {
    city: 'New Delhi',
    region: 'Delhi NCR',
    country: 'India',
    countryCode: 'IN',
    latitude: 28.6139,
    longitude: 77.2090,
    asn: 'AS45820 (Bharti Airtel Ltd)',
    isIndia: true
  },
  '117.211.89.5': {
    city: 'Chennai',
    region: 'Tamil Nadu',
    country: 'India',
    countryCode: 'IN',
    latitude: 13.0827,
    longitude: 80.2707,
    asn: 'AS9829 (BSNL National Network)',
    isIndia: true
  },
  '14.139.180.2': {
    city: 'Hyderabad',
    region: 'Telangana',
    country: 'India',
    countryCode: 'IN',
    latitude: 17.3850,
    longitude: 78.4867,
    asn: 'AS4758 (Tata Communications)',
    isIndia: true
  },
  '182.72.10.45': {
    city: 'Kolkata',
    region: 'West Bengal',
    country: 'India',
    countryCode: 'IN',
    latitude: 22.5726,
    longitude: 88.3639,
    asn: 'AS24186 (Vodafone Idea Telecom)',
    isIndia: true
  },
  '103.152.112.4': {
    city: 'Pune',
    region: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    latitude: 18.5204,
    longitude: 73.8567,
    asn: 'AS138139 (Gigabit Infotech)',
    isIndia: true
  },

  // Internal Corporate & VPC Subnets (Mapped to Indian & Enterprise Gateway datacenters for SOC visibility)
  '192.168.1.10': {
    city: 'Mumbai',
    region: 'Corporate DC',
    country: 'India',
    countryCode: 'IN',
    latitude: 19.1100,
    longitude: 72.8800,
    asn: 'Internal Enterprise LAN (Zone 2)',
    isIndia: true
  },
  '192.168.1.5': {
    city: 'Mumbai',
    region: 'SOC Headquarters',
    country: 'India',
    countryCode: 'IN',
    latitude: 19.0760,
    longitude: 72.8777,
    asn: 'Corporate Core Gateway',
    isIndia: true
  },
  '192.168.1.20': {
    city: 'Bengaluru',
    region: 'Development Hub',
    country: 'India',
    countryCode: 'IN',
    latitude: 12.9800,
    longitude: 77.6000,
    asn: 'Internal R&D Network',
    isIndia: true
  },
  '10.0.0.1': {
    city: 'Bengaluru',
    region: 'VPC South-1',
    country: 'India',
    countryCode: 'IN',
    latitude: 12.9352,
    longitude: 77.6245,
    asn: 'Cloud DB Cluster (Internal)',
    isIndia: true
  },
  '10.0.0.2': {
    city: 'Mumbai',
    region: 'VPC West-1',
    country: 'India',
    countryCode: 'IN',
    latitude: 19.0500,
    longitude: 72.8500,
    asn: 'LDAP Active Directory Cluster',
    isIndia: true
  },
  '10.0.2.45': {
    city: 'Hyderabad',
    region: 'VPC Central-2',
    country: 'India',
    countryCode: 'IN',
    latitude: 17.4400,
    longitude: 78.3800,
    asn: 'Engineering Subnet',
    isIndia: true
  }
};

// Fallback pool of global and Indian cities for arbitrary IPs
const GLOBAL_FALLBACK_CITIES: KnownGeoLocation[] = [
  { city: 'London', region: 'England', country: 'United Kingdom', countryCode: 'GB', latitude: 51.5074, longitude: -0.1278, asn: 'AS2856 (BT Group)', isIndia: false },
  { city: 'Tokyo', region: 'Kanto', country: 'Japan', countryCode: 'JP', latitude: 35.6762, longitude: 139.6503, asn: 'AS2516 (KDDI Corp)', isIndia: false },
  { city: 'Singapore', region: 'Singapore', country: 'Singapore', countryCode: 'SG', latitude: 1.3521, longitude: 103.8198, asn: 'AS4657 (StarHub)', isIndia: false },
  { city: 'Sydney', region: 'New South Wales', country: 'Australia', countryCode: 'AU', latitude: -33.8688, longitude: 151.2093, asn: 'AS1221 (Telstra)', isIndia: false },
  { city: 'São Paulo', region: 'São Paulo', country: 'Brazil', countryCode: 'BR', latitude: -23.5505, longitude: -46.6333, asn: 'AS27699 (Telecom Italia)', isIndia: false },
  { city: 'Bengaluru', region: 'Karnataka', country: 'India', countryCode: 'IN', latitude: 12.9716, longitude: 77.5946, asn: 'AS13335 (Cloudflare India)', isIndia: true },
  { city: 'Mumbai', region: 'Maharashtra', country: 'India', countryCode: 'IN', latitude: 19.0760, longitude: 72.8777, asn: 'AS55836 (Jio Infocomm)', isIndia: true },
  { city: 'New Delhi', region: 'Delhi', country: 'India', countryCode: 'IN', latitude: 28.6139, longitude: 77.2090, asn: 'AS45820 (Airtel Broadband)', isIndia: true }
];

/**
 * Hash an IP string into a deterministic integer
 */
function hashIP(ip: string): number {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash << 5) - hash + ip.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Look up or compute realistic geolocation data for any given IP
 */
export function getIPGeoLocation(
  ip: string, 
  riskLevel: RiskLevel = 'LOW', 
  attackCount: number = 0,
  attackTypes: string[] = ['AUTH_PROBE'],
  lastTimestamp: string = new Date().toLocaleTimeString()
): GeoLocationData {
  const cleanIP = ip.trim();
  const known = KNOWN_IP_REGISTRY[cleanIP];

  if (known) {
    return {
      ip: cleanIP,
      city: known.city,
      region: known.region,
      country: known.country,
      countryCode: known.countryCode,
      latitude: known.latitude,
      longitude: known.longitude,
      asn: known.asn,
      isIndia: known.isIndia,
      threatLevel: riskLevel,
      attackCount,
      attackTypes,
      lastAttackTimestamp: lastTimestamp
    };
  }

  // Generate deterministic geolocation from IP hash
  const hash = hashIP(cleanIP);
  const fallback = GLOBAL_FALLBACK_CITIES[hash % GLOBAL_FALLBACK_CITIES.length];

  // Slight jitter to prevent nodes from perfectly stacking
  const latJitter = ((hash % 100) - 50) * 0.01;
  const lonJitter = (((hash >> 2) % 100) - 50) * 0.01;

  return {
    ip: cleanIP,
    city: fallback.city,
    region: fallback.region,
    country: fallback.country,
    countryCode: fallback.countryCode,
    latitude: fallback.latitude + latJitter,
    longitude: fallback.longitude + lonJitter,
    asn: fallback.asn,
    isIndia: fallback.isIndia,
    threatLevel: riskLevel,
    attackCount,
    attackTypes,
    lastAttackTimestamp: lastTimestamp
  };
}

/**
 * Central Enterprise Gateway coordinates (Target Hub for attack indicators)
 * Standardized on Mumbai Cyber Operations Center (19.0760° N, 72.8777° E)
 */
export const TARGET_CYBER_GATEWAY = {
  name: 'Central SOC Gateway (Mumbai HQ)',
  city: 'Mumbai',
  country: 'India',
  countryCode: 'IN',
  latitude: 19.0760,
  longitude: 72.8777
};

/**
 * Convert World Latitude & Longitude to SVG coordinates (1000 x 500 projection)
 */
export function projectWorldCoordinates(lat: number, lon: number, width: number = 1000, height: number = 500): { x: number; y: number } {
  // Equirectangular projection
  const x = ((lon + 180) / 360) * width;
  // Latitude clamped between -85 and 85
  const clampedLat = Math.max(-85, Math.min(85, lat));
  const y = ((90 - clampedLat) / 180) * height;
  return { x, y };
}

/**
 * Convert India Latitude & Longitude to SVG coordinates (India Regional Map 800 x 600)
 * Bounds: Lat 8.0° to 37.5° N, Long 68.0° to 97.5° E
 */
export function projectIndiaCoordinates(lat: number, lon: number, width: number = 800, height: number = 600): { x: number; y: number } {
  const minLat = 7.0;
  const maxLat = 37.5;
  const minLon = 67.5;
  const maxLon = 98.0;

  const x = ((lon - minLon) / (maxLon - minLon)) * (width * 0.85) + (width * 0.075);
  const y = ((maxLat - lat) / (maxLat - minLat)) * (height * 0.85) + (height * 0.075);

  return { 
    x: Math.max(20, Math.min(width - 20, x)), 
    y: Math.max(20, Math.min(height - 20, y)) 
  };
}
