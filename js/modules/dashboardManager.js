// Dashboard data management and integration
export class DashboardManager {
  constructor(connectionManager, networkInfoManager) {
    this.connectionManager = connectionManager;
    this.networkInfoManager = networkInfoManager;
    this.dashboardData = {
      latencyHistory: [],
      speedHistory: [],
      jitterHistory: [],
      scoreHistory: [],
      timestamps: []
    };
    this.maxEntries = 50;
  }

  // Store data point for dashboard
  addDataPoint(data) {
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    this.dashboardData.timestamps.push(timestamp);
    
    if (data.latency !== undefined) {
      this.dashboardData.latencyHistory.push(data.latency);
    }
    if (data.jitter !== undefined) {
      this.dashboardData.jitterHistory.push(data.jitter);
    }
    if (data.speed !== undefined) {
      this.dashboardData.speedHistory.push(data.speed);
    }
    if (data.score !== undefined) {
      this.dashboardData.scoreHistory.push(data.score);
    }

    // Keep only recent entries
    Object.keys(this.dashboardData).forEach(key => {
      if (this.dashboardData[key].length > this.maxEntries) {
        this.dashboardData[key] = this.dashboardData[key].slice(-this.maxEntries);
      }
    });

    // Store in Chrome storage for dashboard access
    chrome.storage.local.set({ dashboardData: this.dashboardData });
  }

  // Get current dashboard data
  async getDashboardData() {
    return new Promise((resolve) => {
      chrome.storage.local.get('dashboardData', (data) => {
        resolve(data.dashboardData || this.dashboardData);
      });
    });
  }

  // Get current network info for dashboard
  async getCurrentNetworkInfo() {
    const ipData = await this.networkInfoManager.fetchIPAddress();
    const warpData = await this.networkInfoManager.detectCloudflareWARP();
    const providerData = await this.networkInfoManager.getNetworkProvider();
    
    return {
      ip: ipData.success ? ipData.ip : 'Unknown',
      location: ipData.success ? `${ipData.city || '?'}, ${ipData.region || '?'}` : 'Unknown',
      provider: providerData.success ? providerData.provider : 'Unknown',
      warpActive: warpData.success ? warpData.isActive : false,
      warpStatus: warpData.success ? (warpData.isActive ? 'Active 🔒' : 'Inactive') : 'Unknown'
    };
  }

  // Run diagnostics and store results
  async runFullDiagnostics() {
    const results = {};
    
    // Run all tests
    const latencyResult = await this.connectionManager.measureLatency();
    if (latencyResult.success) results.latency = latencyResult.latency;
    
    const jitterResult = await this.connectionManager.measureJitter();
    if (jitterResult.success) results.jitter = jitterResult.jitter;
    
    const speedResult = await this.connectionManager.runSpeedTest();
    if (speedResult.success) results.speed = speedResult.speed;
    
    // Calculate score
    if (results.latency && results.jitter && results.speed) {
      results.score = this.calculateNetworkScore(results);
    }
    
    // Store the results
    this.addDataPoint(results);
    
    return results;
  }

  calculateNetworkScore(data) {
    let score = 100;
    if (data.latency > 100) score -= 20;
    if (data.jitter > 100) score -= 30;
    if (data.speed < 5) score -= 40;
    else if (data.speed < 20) score -= 20;
    return Math.max(0, score);
  }

  // Clear dashboard history
  clearHistory() {
    this.dashboardData = {
      latencyHistory: [],
      speedHistory: [],
      jitterHistory: [],
      scoreHistory: [],
      timestamps: []
    };
    chrome.storage.local.set({ dashboardData: this.dashboardData });
  }

  // Open dashboard in new tab
  openDashboard() {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  }
}