// Network information and provider detection
export class NetworkInfoManager {
  async fetchIPAddress() {
    try {
      const response = await fetch("https://ipinfo.io/json");
      const data = await response.json();
      return {
        ip: data.ip,
        city: data.city,
        region: data.region,
        org: data.org,
        success: true
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
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
}