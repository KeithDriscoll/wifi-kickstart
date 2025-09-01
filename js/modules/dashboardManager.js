// Dashboard data management and integration - Fixed with tab switching
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
    this.loadExistingData();
  }

  // Load existing dashboard data on initialization
  async loadExistingData() {
    return new Promise((resolve) => {
      chrome.storage.local.get('dashboardData', (data) => {
        if (data.dashboardData) {
          this.dashboardData = data.dashboardData;
        }
        resolve();
      });
    });
  }

  // Store data point for dashboard
  addDataPoint(data) {
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Always add timestamp
    this.dashboardData.timestamps.push(timestamp);
    
    // Add data points, filling with null if not provided
    this.dashboardData.latencyHistory.push(data.latency || null);
    this.dashboardData.jitterHistory.push(data.jitter || null);
    this.dashboardData.speedHistory.push(data.speed || null);
    this.dashboardData.scoreHistory.push(data.score || null);

    // Keep only recent entries
    Object.keys(this.dashboardData).forEach(key => {
      if (this.dashboardData[key].length > this.maxEntries) {
        this.dashboardData[key] = this.dashboardData[key].slice(-this.maxEntries);
      }
    });

    // Store in Chrome storage for dashboard access
    chrome.storage.local.set({ dashboardData: this.dashboardData });
    console.log('Dashboard data stored:', this.dashboardData);
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
    
    try {
      console.log('Starting full diagnostics...');
      
      const latencyResult = await this.connectionManager.measureLatency();
      if (latencyResult.success) {
        results.latency = latencyResult.latency;
        console.log('Latency measured:', results.latency);
      }
      
      const jitterResult = await this.connectionManager.measureJitter();
      if (jitterResult.success) {
        results.jitter = jitterResult.jitter;
        console.log('Jitter measured:', results.jitter);
      }
      
      const speedResult = await this.connectionManager.runSpeedTest();
      if (speedResult.success) {
        results.speed = speedResult.speed;
        console.log('Speed measured:', results.speed);
      }
      
      // Calculate score if we have all data
      if (results.latency && results.jitter && results.speed) {
        results.score = this.calculateNetworkScore(results);
        console.log('Score calculated:', results.score);
      }
      
      // Store the complete results
      this.addDataPoint(results);
      console.log('Full diagnostics completed and stored');
      
      return results;
    } catch (error) {
      console.error('Diagnostics error:', error);
      throw error;
    }
  }

  // Speed test only
  async runSpeedTestOnly() {
    try {
      console.log('Starting speed test...');
      const speedResult = await this.connectionManager.runSpeedTest();
      
      if (speedResult.success) {
        const results = { speed: speedResult.speed };
        this.addDataPoint(results);
        console.log('Speed test completed and stored:', results.speed);
        return results;
      } else {
        throw new Error('Speed test failed');
      }
    } catch (error) {
      console.error('Speed test error:', error);
      throw error;
    }
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
    chrome.storage.local.set({ 
      dashboardData: this.dashboardData,
      providerHistory: []
    });
    console.log('Dashboard history cleared');
  }

  // Open dashboard in new tab or switch to existing
  openDashboard() {
    const dashboardUrl = chrome.runtime.getURL('fulltab/dashboard.html');
    
    // Check if dashboard is already open
    chrome.tabs.query({}, (tabs) => {
      const existingDashboard = tabs.find(tab => tab.url === dashboardUrl);
      
      if (existingDashboard) {
        // Switch to existing dashboard tab
        chrome.tabs.update(existingDashboard.id, { active: true });
        console.log('Switched to existing dashboard tab');
      } else {
        // Create new dashboard tab
        chrome.tabs.create({ url: dashboardUrl });
        console.log('Created new dashboard tab');
      }
    });
  }

  // Force data collection for testing
  async collectTestData() {
    console.log('Collecting test data...');
    const results = await this.runFullDiagnostics();
    return results;
  }
}