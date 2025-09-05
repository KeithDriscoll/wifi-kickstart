// Wi-Fi Kickstart Popup - Clean & Simple Version
// Removed all enhanced speed test clutter - runs from dashboard instead

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

    // Speed test buttons - SIMPLE BASIC SPEED TEST ONLY
    if (this.uiManager.elements.runSpeedBtn) {
      this.uiManager.elements.runSpeedBtn.addEventListener("click", () => {
        this.runBasicSpeedTest(false);
      });
    }

    if (this.uiManager.elements.runSpeedBtnSimple) {
      this.uiManager.elements.runSpeedBtnSimple.addEventListener("click", () => {
        this.runBasicSpeedTest(true);
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
      this.uiManager.isAdvancedMode = event.detail.isAdvanced;
      
      // Update metrics when switching modes
      if (this.uiManager.isAdvancedMode) {
        this.measureLatency();
        this.measureJitter();
      }
    });

    // Listen for theme changes
    window.addEventListener('themeChanged', (event) => {
      console.log('Theme changed to:', event.detail.theme);
    });
  }

  async performInitialLoad() {
    try {
      // Check connection status immediately
      await this.requestConnectionCheck();
      
      // Load network information
      await this.loadNetworkInfo();
      
      // If in advanced mode, measure latency and jitter
      if (this.uiManager.isAdvancedMode) {
        await this.measureLatency();
        await this.measureJitter();
      }
      
      // Update network score if we have enough data
      this.updateNetworkScore();
      
    } catch (error) {
      console.error('Initial load failed:', error);
      this.uiManager.updateStatus({ success: false, message: 'Initialization failed' });
    }
  }

  async requestConnectionCheck() {
    try {
      this.uiManager.updateStatus({ success: null, message: 'Checking...' });
      
      const result = await chrome.runtime.sendMessage({ action: "checkConnection" });
      
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
      
      this.uiManager.updateStatus(result);
      
    } catch (error) {
      console.error('Connection check failed:', error);
      this.uiManager.updateStatus({ success: false, message: 'Check failed' });
    }
  }

  async loadNetworkInfo() {
    try {
      const networkData = await this.networkInfoManager.getNetworkInfo();
      this.uiManager.updateNetworkInfo(networkData);
      
      // Detect VPN usage and store results
      this.detectVPNUsage();
      
    } catch (error) {
      console.error('Network info failed:', error);
      this.uiManager.updateNetworkInfo({ success: false });
    }
  }

  async detectVPNUsage() {
    try {
      const vpnData = await this.networkInfoManager.detectVPN();
      this.uiManager.updateVPNStatus(vpnData);
      
      // Store VPN history for dashboard
      this.storeVPNHistory(vpnData);
      
    } catch (error) {
      console.error('VPN detection failed:', error);
      this.uiManager.updateVPNStatus({ success: false });
    }
  }

  storeVPNHistory(vpnData) {
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

  // SIMPLE BASIC SPEED TEST - No enhanced features, just basic speed
  async runBasicSpeedTest(isSimpleMode = false) {
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
      console.log('Dashboard data stored:', dashboardResults);
      
      // Update VPN detection after speed test
      this.detectVPNUsage();
      
    } catch (error) {
      console.error('Speed test failed:', error);
      this.uiManager.updateSpeedTest({ success: false }, isSimpleMode);
    }
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

  updateNetworkScore() {
    if (!this.uiManager.isAdvancedMode) return;
    
    const score = this.connectionManager.calculateNetworkScore();
    this.uiManager.updateNetworkScore(score);
  }

  // Event handlers for settings
  handleModeChange(isAdvanced) {
    console.log('Mode changed:', isAdvanced ? 'Advanced' : 'Simple');
    
    if (isAdvanced) {
      // When switching to advanced, measure metrics
      this.measureLatency();
      this.measureJitter();
    }
  }

  handleFeatureToggle(feature, enabled) {
    console.log(`Feature ${feature} ${enabled ? 'enabled' : 'disabled'}`);
    
    // Update UI based on feature toggles
    switch (feature) {
      case 'speedTest':
        this.uiManager.toggleSpeedTest(enabled);
        break;
      case 'vpnCheck':
        if (enabled) this.detectVPNUsage();
        break;
      case 'warpCheck':
        if (enabled) this.loadNetworkInfo();
        break;
      case 'networkScore':
        if (enabled) this.updateNetworkScore();
        break;
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const app = new WiFiKickstartApp();
    await app.initialize();
    
    // Make app globally available for debugging
    window.app = app;
    
    console.log('✅ Wi-Fi Kickstart popup initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Wi-Fi Kickstart popup:', error);
  }
});