// Main application entry point - Enhanced with VPN detection
import { ConnectionManager } from './modules/connection.js';
import { NetworkInfoManager } from './modules/networkInfo.js';
import { UIManager } from './modules/uiManager.js';
import { ThemeManager } from './modules/themeManager.js';
import { SettingsManager } from './modules/settingsManager.js';
import { DashboardManager } from './modules/dashboardManager.js';

class WiFiKickstartApp {
  constructor() {
    this.connectionManager = new ConnectionManager();
    this.networkInfoManager = new NetworkInfoManager();
    this.uiManager = new UIManager();
    this.themeManager = new ThemeManager();
    this.settingsManager = new SettingsManager();
    this.dashboardManager = new DashboardManager(this.connectionManager, this.networkInfoManager);
  }

  async initialize() {
    // Initialize all subsystems
    this.settingsManager.initializeSettings();
    this.themeManager.initializeThemeSystem();
    
    // Set up event listeners
    this.setupEventListeners();
    this.setupCustomEvents();
    
    // Force CSS variables to be applied on load
    this.themeManager.reapplyThemeState();
    
    // Initial data load
    await this.performInitialLoad();
  }

  setupEventListeners() {
    // Connection check button
    if (this.uiManager.elements.checkBtn) {
      this.uiManager.elements.checkBtn.addEventListener("click", () => {
        this.requestConnectionCheck();
      });
    }

    // Speed test buttons
    if (this.uiManager.elements.runSpeedBtn) {
      this.uiManager.elements.runSpeedBtn.addEventListener("click", () => {
        this.runSpeedTest(false);
      });
    }

    if (this.uiManager.elements.runSpeedBtnSimple) {
      this.uiManager.elements.runSpeedBtnSimple.addEventListener("click", () => {
        this.runSpeedTest(true);
      });
    }

    // Dashboard button
    const dashboardBtn = document.getElementById("dashboardBtn");
    if (dashboardBtn) {
      dashboardBtn.addEventListener("click", () => {
        this.dashboardManager.openDashboard();
      });
    }
  }

  setupCustomEvents() {
    // Listen for mode changes
    window.addEventListener('modeChanged', (event) => {
      this.uiManager.isAdvancedMode = event.detail.isAdvancedMode;
      this.uiManager.setAdvancedMode(event.detail.isAdvancedMode);
      
      // Collect data when switching to advanced mode
      if (event.detail.isAdvancedMode) {
        this.runFullDiagnostics();
      }
    });

    // Listen for theme reapplication requests
    window.addEventListener('themeReapply', () => {
      this.themeManager.reapplyThemeState();
    });
  }

  async performInitialLoad() {
    // Load user preferences
    const isAdvancedMode = await this.settingsManager.getSetting('advancedModeEnabled');
    this.uiManager.isAdvancedMode = isAdvancedMode;
    this.uiManager.setAdvancedMode(isAdvancedMode);

    // Initial data fetching
    this.requestConnectionCheck();
    this.fetchIPAddress();
    this.detectVPNUsage();
    this.detectCloudflareUsage();
    
    // Run initial diagnostics to populate dashboard
    if (isAdvancedMode) {
      setTimeout(() => this.runFullDiagnostics(), 1000);
    }
  }

  async requestConnectionCheck() {
    try {
      const response = await this.connectionManager.checkConnection();
      const isOnline = response?.status === "online";
      const status = isOnline ? "Online ✅" : "Offline ❌";
      this.uiManager.updateStatus(`Status: ${status}`, isOnline);
      
      // Always collect data when checking connection
      if (isOnline) {
        this.runFullDiagnostics();
      }
    } catch (error) {
      this.uiManager.updateStatus("Status: Error", false);
    }
  }

  async fetchIPAddress() {
    try {
      const ipData = await this.networkInfoManager.fetchIPAddress();
      this.uiManager.updateIPAddress(ipData);
    } catch (error) {
      this.uiManager.updateIPAddress({ success: false });
    }
  }

  // Enhanced VPN detection
  async detectVPNUsage() {
    try {
      const vpnData = await this.networkInfoManager.detectVPN();
      this.uiManager.updateVPNStatus(vpnData);
      
      // Store VPN data for dashboard charts
      if (vpnData.success) {
        this.storeVPNData(vpnData);
      }
    } catch (error) {
      this.uiManager.updateVPNStatus({ success: false });
    }
  }

  // Store VPN detection results for dashboard
  storeVPNData(vpnData) {
    chrome.storage.local.get('vpnHistory', (storage) => {
      const vpnHistory = storage.vpnHistory || [];
      vpnHistory.push({
        timestamp: new Date().toISOString(),
        isVPN: vpnData.isVPN,
        provider: vpnData.vpnProvider,
        type: vpnData.vpnType,
        confidence: vpnData.confidence,
        indicators: vpnData.indicators
      });
      
      // Keep only recent 50 entries
      const recentVPN = vpnHistory.slice(-50);
      chrome.storage.local.set({ vpnHistory: recentVPN });
    });
  }

  // Combined diagnostics method that stores dashboard data
  async runFullDiagnostics() {
    if (!this.uiManager.isAdvancedMode) return;
    
    try {
      console.log('Running full diagnostics from popup...');
      
      // Measure latency
      const latencyData = await this.connectionManager.measureLatency();
      this.uiManager.updateLatency(latencyData);
      
      // Measure jitter
      const jitterData = await this.connectionManager.measureJitter();
      this.uiManager.updateJitter(jitterData);
      
      // Run speed test
      const speedData = await this.connectionManager.runSpeedTest();
      this.uiManager.updateSpeedTest(speedData, false);
      
      // Calculate and update score
      const score = this.connectionManager.calculateNetworkScore();
      this.uiManager.updateNetworkScore(score);
      
      // Store all data together for dashboard
      const dashboardResults = {};
      if (latencyData.success) dashboardResults.latency = latencyData.latency;
      if (jitterData.success) dashboardResults.jitter = jitterData.jitter;
      if (speedData.success) dashboardResults.speed = speedData.speed;
      if (score !== null) dashboardResults.score = score;
      
      this.dashboardManager.addDataPoint(dashboardResults);
      console.log('Dashboard data stored:', dashboardResults);
      
      // Update VPN detection after diagnostics
      this.detectVPNUsage();
      
    } catch (error) {
      console.error('Full diagnostics failed:', error);
    }
  }

  async measureLatency() {
    if (!this.uiManager.isAdvancedMode) return;
    
    try {
      const latencyData = await this.connectionManager.measureLatency();
      this.uiManager.updateLatency(latencyData);
      this.updateNetworkScore();
      
      // Store for dashboard
      if (latencyData.success) {
        this.dashboardManager.addDataPoint({ latency: latencyData.latency });
      }
    } catch (error) {
      this.uiManager.updateLatency({ success: false });
    }
  }

  async measureJitter() {
    if (!this.uiManager.isAdvancedMode) return;
    
    try {
      const jitterData = await this.connectionManager.measureJitter();
      this.uiManager.updateJitter(jitterData);
      this.updateNetworkScore();
      
      // Store for dashboard
      if (jitterData.success) {
        this.dashboardManager.addDataPoint({ jitter: jitterData.jitter });
      }
    } catch (error) {
      this.uiManager.updateJitter({ success: false });
    }
  }

  async runSpeedTest(isSimpleMode = false) {
    this.uiManager.setSpeedTestLoading(isSimpleMode);
    
    try {
      const speedData = await this.connectionManager.runSpeedTest();
      this.uiManager.updateSpeedTest(speedData, isSimpleMode);
      this.updateNetworkScore();
      
      // Store complete data point for dashboard
      const dashboardResults = { speed: speedData.speed };
      
      // If in advanced mode, include current metrics
      if (this.uiManager.isAdvancedMode) {
        const metrics = this.connectionManager.getMetrics();
        if (metrics.latency) dashboardResults.latency = metrics.latency;
        if (metrics.jitter) dashboardResults.jitter = metrics.jitter;
        
        const score = this.connectionManager.calculateNetworkScore();
        if (score !== null) dashboardResults.score = score;
      }
      
      this.dashboardManager.addDataPoint(dashboardResults);
      console.log('Speed test data stored for dashboard:', dashboardResults);
      
    } catch (error) {
      this.uiManager.updateSpeedTest({ success: false }, isSimpleMode);
    }
  }

  updateNetworkScore() {
    if (!this.uiManager.isAdvancedMode) return;
    
    const score = this.connectionManager.calculateNetworkScore();
    this.uiManager.updateNetworkScore(score);
    
    // Store for dashboard only if we have a complete score
    if (score !== null) {
      const metrics = this.connectionManager.getMetrics();
      const dashboardResults = { score: score };
      
      // Include current metrics if available
      if (metrics.latency) dashboardResults.latency = metrics.latency;
      if (metrics.jitter) dashboardResults.jitter = metrics.jitter;
      if (metrics.speed) dashboardResults.speed = metrics.speed;
      
      this.dashboardManager.addDataPoint(dashboardResults);
    }
  }

  async detectCloudflareUsage() {
    try {
      // WARP detection
      const warpData = await this.networkInfoManager.detectCloudflareWARP();
      this.uiManager.updateWARPStatus(warpData);

      // Network provider detection
      const providerData = await this.networkInfoManager.getNetworkProvider();
      this.uiManager.updateNetworkProvider(providerData);
    } catch (error) {
      this.uiManager.updateWARPStatus({ success: false });
      this.uiManager.updateNetworkProvider({ success: false });
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const app = new WiFiKickstartApp();
  app.initialize();
});