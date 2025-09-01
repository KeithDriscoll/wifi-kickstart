// Network information and provider detection with VPN detection
export class NetworkInfoManager {
  constructor() {
    this.vpnIndicators = {
      // Popular VPN providers
      'NordVPN': ['nordvpn', 'nord', 'tesonet'],
      'ExpressVPN': ['expressvpn', 'express technologies'],
      'Surfshark': ['surfshark'],
      'CyberGhost': ['cyberghost'],
      'Private Internet Access': ['privateinternetaccess', 'private internet access', 'pia'],
      'ProtonVPN': ['protonvpn', 'proton'],
      'Mullvad': ['mullvad'],
      'IPVanish': ['ipvanish'],
      'VyprVPN': ['vyprvpn', 'golden frog'],
      'Atlas VPN': ['atlasvpn'],
      'Windscribe': ['windscribe'],
      'TunnelBear': ['tunnelbear'],
      'Hide.me': ['hide.me', 'egozy'],
      'Hotspot Shield': ['hotspot shield', 'anchorfree'],
      'Cloudflare WARP': ['cloudflare'],
      'AWS VPN': ['amazon', 'aws'],
      'Google Cloud VPN': ['google cloud', 'google llc'],
      'Microsoft Azure VPN': ['microsoft'],
      'DigitalOcean VPN': ['digitalocean'],
      'Linode VPN': ['linode'],
      'Vultr VPN': ['vultr']
    };
    
    this.datacenterIndicators = [
      'hosting', 'server', 'datacenter', 'data center', 'cloud', 'vps', 
      'virtual', 'dedicated', 'colocation', 'colo', 'internet exchange'
    ];
  }

  async fetchIPAddress() {
    try {
      const response = await fetch("https://ipinfo.io/json");
      const data = await response.json();
      return {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country,
        org: data.org,
        timezone: data.timezone,
        success: true
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async detectVPN() {
    try {
      console.log('Starting VPN detection...');
      
      // Get IP info
      const ipInfo = await this.fetchIPAddress();
      if (!ipInfo.success) {
        return { success: false, error: 'Failed to get IP info' };
      }

      // Check multiple VPN detection methods
      const results = await Promise.allSettled([
        this.checkIPInfoVPN(ipInfo),
        this.checkCloudflareWARP(),
        this.checkVPNDatabase(ipInfo.ip),
        this.checkASNForVPN(ipInfo.org)
      ]);

      // Combine results
      const vpnDetection = {
        isVPN: false,
        vpnProvider: null,
        vpnType: null,
        confidence: 0,
        indicators: [],
        ipInfo: ipInfo
      };

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.isVPN) {
          vpnDetection.isVPN = true;
          if (result.value.provider) {
            vpnDetection.vpnProvider = result.value.provider;
          }
          if (result.value.type) {
            vpnDetection.vpnType = result.value.type;
          }
          vpnDetection.confidence = Math.max(vpnDetection.confidence, result.value.confidence || 0);
          vpnDetection.indicators.push(...(result.value.indicators || []));
        }
      });

      // Remove duplicate indicators
      vpnDetection.indicators = [...new Set(vpnDetection.indicators)];

      console.log('VPN detection result:', vpnDetection);
      return { success: true, ...vpnDetection };
      
    } catch (error) {
      console.error('VPN detection failed:', error);
      return { success: false, error: error.message };
    }
  }

  async checkIPInfoVPN(ipInfo) {
    // Check organization name for VPN indicators
    const org = (ipInfo.org || '').toLowerCase();
    
    // Check against known VPN providers
    for (const [provider, keywords] of Object.entries(this.vpnIndicators)) {
      for (const keyword of keywords) {
        if (org.includes(keyword.toLowerCase())) {
          return {
            isVPN: true,
            provider: provider,
            type: 'Commercial VPN',
            confidence: 90,
            indicators: [`ASN: ${keyword}`]
          };
        }
      }
    }

    // Check for datacenter/hosting indicators
    const isDatacenter = this.datacenterIndicators.some(indicator => 
      org.includes(indicator.toLowerCase())
    );
    
    if (isDatacenter) {
      return {
        isVPN: true,
        provider: 'Unknown VPN/Proxy',
        type: 'Datacenter/Hosting',
        confidence: 70,
        indicators: ['Datacenter IP']
      };
    }

    return { isVPN: false };
  }

  async checkCloudflareWARP() {
    try {
      const response = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
      const text = await response.text();
      const warpMatch = text.match(/warp=(\w+)/);
      
      if (warpMatch && warpMatch[1] === "on") {
        return {
          isVPN: true,
          provider: 'Cloudflare WARP',
          type: 'Privacy Service',
          confidence: 95,
          indicators: ['WARP Active']
        };
      }
      
      return { isVPN: false };
    } catch (error) {
      return { isVPN: false };
    }
  }

  async checkVPNDatabase(ip) {
    try {
      // Use a free VPN detection service
      const response = await fetch(`https://ipqualityscore.com/api/json/ip/demo/${ip}`);
      const data = await response.json();
      
      if (data.vpn || data.proxy || data.tor) {
        const types = [];
        if (data.vpn) types.push('VPN');
        if (data.proxy) types.push('Proxy');
        if (data.tor) types.push('Tor');
        
        return {
          isVPN: true,
          provider: 'Detected via Database',
          type: types.join('/'),
          confidence: 85,
          indicators: types
        };
      }
      
      return { isVPN: false };
    } catch (error) {
      // Fallback to basic checks if service unavailable
      return { isVPN: false };
    }
  }

  async checkASNForVPN(org) {
    if (!org) return { isVPN: false };
    
    const orgLower = org.toLowerCase();
    const suspiciousTerms = [
      'vpn', 'proxy', 'anonymous', 'privacy', 'secure', 'tunnel',
      'shield', 'guard', 'protect', 'hide', 'mask', 'stealth'
    ];
    
    const foundTerms = suspiciousTerms.filter(term => orgLower.includes(term));
    
    if (foundTerms.length > 0) {
      return {
        isVPN: true,
        provider: 'Suspected VPN',
        type: 'Privacy Service',
        confidence: 60,
        indicators: foundTerms.map(term => `Keyword: ${term}`)
      };
    }
    
    return { isVPN: false };
  }

  async detectCloudflareWARP() {
    try {
      const response = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
      const text = await response.text();
      const warpMatch = text.match(/warp=(\w+)/);
      
      return {
        isActive: warpMatch && warpMatch[1] === "on",
        success: true
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getNetworkProvider() {
    try {
      const ipInfo = await this.fetchIPAddress();
      if (!ipInfo.success || !ipInfo.org) {
        return { success: false };
      }

      const org = ipInfo.org;
      const provider = org.split(" ").slice(1).join(" "); // Strip "ASxxxxx"
      const isCloudflare = provider.toLowerCase().includes("cloudflare");

      return {
        provider,
        isCloudflare,
        fullOrg: org,
        success: true
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get comprehensive network analysis including VPN
  async getFullNetworkAnalysis() {
    try {
      const [ipInfo, vpnInfo, warpInfo] = await Promise.all([
        this.fetchIPAddress(),
        this.detectVPN(),
        this.detectCloudflareWARP()
      ]);

      return {
        success: true,
        ip: ipInfo.success ? ipInfo : null,
        vpn: vpnInfo.success ? vpnInfo : null,
        warp: warpInfo.success ? warpInfo : null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}