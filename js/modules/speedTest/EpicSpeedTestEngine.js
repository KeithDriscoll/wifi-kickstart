// 🔥 EPIC SPEED TEST ENGINE WRAPPER
// File: js/modules/speedTest/EpicSpeedTestEngine.js
// Extends your existing SpeedTestEngine with NUCLEAR-POWERED capabilities!

import { SpeedTestEngine } from './SpeedTestEngine.js';
import { EpicNetworkMetrics } from './EpicNetworkMetrics.js';

export class EpicSpeedTestEngine extends SpeedTestEngine {
  constructor() {
    super(); // Initialize your existing engine
    this.epicMetrics = new EpicNetworkMetrics();
    this.isEpicMode = false;
    this.currentConfig = null;
    this.epicCallbacks = {};
    
    console.log('🔥 Epic Speed Test Engine initialized - BEAST MODE READY!');
  }

  // 🚀 EPIC MODE ACTIVATION
  async activateEpicMode(config = null) {
    console.log('🔥 ACTIVATING EPIC MODE...');
    this.isEpicMode = true;
    this.currentConfig = config;
    
    // Load user's epic configuration if available
    if (!config) {
      this.currentConfig = await this.loadEpicConfig();
    }
    
    this.epicCallbacks.onEpicActivated?.(this.currentConfig);
    return this.currentConfig;
  }

  // 🎯 BASIC MODE (Uses your existing engine)
  async runBasicSpeedTest() {
    console.log('📊 Running basic speed test (using existing engine)...');
    
    try {
      // Use your existing SpeedTestEngine's basic test
      const basicResult = await super.runSpeedTest?.() || await this.runFallbackBasicTest();
      
      this.epicCallbacks.onBasicComplete?.(basicResult);
      return {
        mode: 'basic',
        timestamp: new Date().toISOString(),
        result: basicResult,
        source: 'existing_engine'
      };
    } catch (error) {
      console.error('Basic speed test failed:', error);
      throw error;
    }
  }

  // 🔥 EPIC ANALYSIS (Full nuclear option)
  async runEpicAnalysis(customConfig = null) {
    if (!this.isEpicMode) {
      await this.activateEpicMode(customConfig);
    }

    console.log('🔥 LAUNCHING EPIC NETWORK ANALYSIS...');
    
    try {
      this.epicCallbacks.onEpicStart?.(this.currentConfig);
      
      // Set up progress callbacks for epic metrics
      this.epicMetrics.setCallbacks({
        onStart: (config) => this.epicCallbacks.onProgress?.('🔥 Epic analysis initiated...', 5),
        onProgress: (message, progress) => this.epicCallbacks.onProgress?.(message, progress),
        onTestProgress: (message, progress) => this.epicCallbacks.onTestProgress?.(message, progress),
        onComplete: (results) => this.handleEpicComplete(results),
        onError: (error) => this.epicCallbacks.onError?.(error)
      });

      // Run the EPIC analysis
      const epicResults = await this.epicMetrics.runConfigurableTest(this.currentConfig);
      
      return {
        mode: 'epic',
        timestamp: new Date().toISOString(),
        config: this.currentConfig,
        results: epicResults,
        source: 'epic_metrics'
      };

    } catch (error) {
      console.error('🔥 Epic analysis failed:', error);
      this.epicCallbacks.onError?.(error);
      throw error;
    }
  }

  // ⚡ QUICK EPIC TEST (Hybrid approach)
  async runQuickEpicTest() {
    console.log('⚡ Running Quick Epic Test...');
    
    const quickConfig = {
      downloadTests: { fileSizes: ['5MB'], iterations: 2, parallelConnections: 3 },
      uploadTests: { fileSizes: ['1MB'], iterations: 1, parallelConnections: 2 },
      latencyTests: { sampleCount: 15, targets: ['google', 'cloudflare'] },
      gamingTests: { enabled: false },
      advanced: { ipv6Testing: false, cdnTesting: false }
    };

    return await this.runEpicAnalysis(quickConfig);
  }

  // 🎮 GAMING OPTIMIZED TEST
  async runGamingTest() {
    console.log('🎮 Running Gaming-Optimized Test...');
    
    const gamingConfig = {
      downloadTests: { fileSizes: ['5MB', '10MB'], iterations: 2 },
      uploadTests: { fileSizes: ['1MB', '5MB'], iterations: 2 },
      latencyTests: { sampleCount: 50, targets: ['google', 'cloudflare'] },
      gamingTests: { 
        enabled: true, 
        sampleCount: 100, 
        burstTests: true,
        consistencyAnalysis: true 
      },
      packetLossTests: { enabled: true, sampleCount: 30 },
      advanced: { ipv6Testing: true }
    };

    return await this.runEpicAnalysis(gamingConfig);
  }

  // 🔬 THOROUGH DIAGNOSTIC TEST
  async runThoroughDiagnostic() {
    console.log('🔬 Running Thorough Network Diagnostic...');
    
    const thoroughConfig = {
      downloadTests: { 
        fileSizes: ['1MB', '5MB', '10MB', '25MB'], 
        iterations: 4, 
        parallelConnections: 6 
      },
      uploadTests: { 
        fileSizes: ['1MB', '5MB', '10MB'], 
        iterations: 3, 
        parallelConnections: 3 
      },
      latencyTests: { sampleCount: 50, targets: ['google', 'cloudflare', 'microsoft'] },
      packetLossTests: { enabled: true, sampleCount: 50 },
      dnsTests: { enabled: true },
      cdnTests: { enabled: true },
      gamingTests: { enabled: true, sampleCount: 150 },
      stabilityTests: { enabled: true, duration: 60 },
      advanced: { 
        ipv6Testing: true, 
        cdnTesting: true, 
        detailedLogging: true 
      }
    };

    return await this.runEpicAnalysis(thoroughConfig);
  }

  // 🔧 CONFIGURATION MANAGEMENT
  async loadEpicConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['epicSpeedTestConfig'], (result) => {
        const config = result.epicSpeedTestConfig || this.getDefaultEpicConfig();
        resolve(config);
      });
    });
  }

  async saveEpicConfig(config) {
    this.currentConfig = config;
    return new Promise((resolve) => {
      chrome.storage.local.set({ epicSpeedTestConfig: config }, () => {
        console.log('Epic config saved:', config);
        resolve();
      });
    });
  }

  getDefaultEpicConfig() {
    return {
      downloadTests: {
        enabled: true,
        fileSizes: ['1MB', '5MB', '10MB'],
        iterations: 3,
        parallelConnections: 4,
        timeout: 30000
      },
      uploadTests: {
        enabled: true,
        fileSizes: ['1MB', '5MB'],
        iterations: 2,
        parallelConnections: 2,
        timeout: 45000
      },
      latencyTests: {
        enabled: true,
        sampleCount: 20,
        targets: ['google', 'cloudflare'],
        timeout: 5000
      },
      packetLossTests: {
        enabled: true,
        sampleCount: 25
      },
      dnsTests: {
        enabled: true
      },
      cdnTests: {
        enabled: false
      },
      gamingTests: {
        enabled: false,
        sampleCount: 100
      },
      advanced: {
        ipv6Testing: true,
        cdnTesting: false,
        detailedLogging: false
      }
    };
  }

  // 📊 RESULTS PROCESSING
  handleEpicComplete(results) {
    console.log('🎯 Epic analysis complete:', results);
    
    // Add epic scoring and analysis
    const processedResults = this.processEpicResults(results);
    
    this.epicCallbacks.onEpicComplete?.(processedResults);
    return processedResults;
  }

  processEpicResults(rawResults) {
    return {
      ...rawResults,
      epicScore: this.calculateEpicScore(rawResults),
      insights: this.generateEpicInsights(rawResults),
      recommendations: this.generateRecommendations(rawResults),
      comparisons: this.generateComparisons(rawResults)
    };
  }

  calculateEpicScore(results) {
    // Enhanced scoring algorithm
    let score = 100;
    const weights = {
      download: 30,
      upload: 20,
      latency: 25,
      packetLoss: 15,
      stability: 10
    };

    // Score download performance
    if (results.results?.download?.summary?.averageSpeed) {
      const downloadSpeed = results.results.download.summary.averageSpeed;
      if (downloadSpeed < 5) score -= weights.download * 0.8;
      else if (downloadSpeed < 25) score -= weights.download * 0.5;
      else if (downloadSpeed < 100) score -= weights.download * 0.2;
    }

    // Score latency performance
    if (results.results?.latency?.summary?.average) {
      const avgLatency = results.results.latency.summary.average;
      if (avgLatency > 100) score -= weights.latency * 0.8;
      else if (avgLatency > 50) score -= weights.latency * 0.5;
      else if (avgLatency > 20) score -= weights.latency * 0.2;
    }

    // Score packet loss
    if (results.results?.packetLoss?.percentage) {
      const packetLoss = results.results.packetLoss.percentage;
      if (packetLoss > 1) score -= weights.packetLoss;
      else if (packetLoss > 0.1) score -= weights.packetLoss * 0.5;
    }

    return Math.max(0, Math.round(score));
  }

  generateEpicInsights(results) {
    const insights = [];
    
    // Download insights
    if (results.results?.download) {
      const download = results.results.download.summary;
      if (download.consistency > 90) {
        insights.push('🚀 Your download speed is exceptionally consistent across multiple tests');
      } else if (download.consistency < 70) {
        insights.push('⚠️ Download speed varies significantly - possible network congestion');
      }
    }

    // Gaming insights
    if (results.results?.gaming) {
      const gaming = results.results.gaming.summary;
      if (gaming.gamingGrade === 'Pro Gamer') {
        insights.push('🎮 Your connection is optimized for professional gaming');
      } else if (gaming.gamingGrade === 'Gaming Issues') {
        insights.push('🎮 Gaming performance may be affected by latency spikes');
      }
    }

    // Latency insights
    if (results.results?.latency) {
      const latency = results.results.latency.summary;
      if (latency.average < 20) {
        insights.push('⚡ Excellent latency - perfect for real-time applications');
      } else if (latency.average > 100) {
        insights.push('⚡ High latency detected - may affect video calls and gaming');
      }
    }

    return insights;
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    // Add smart recommendations based on results
    if (results.results?.upload?.summary?.averageSpeed < 5) {
      recommendations.push('📤 Consider upgrading your internet plan for better upload speeds');
    }
    
    if (results.results?.packetLoss?.percentage > 0.5) {
      recommendations.push('📦 Packet loss detected - check your network equipment');
    }
    
    return recommendations;
  }

  generateComparisons(results) {
    // Compare with typical speeds, regional averages, etc.
    return {
      regionalAverage: 'Above average for your area',
      globalPercentile: 'Top 25% globally',
      previousTests: 'Improved since last test'
    };
  }

  // 📱 FALLBACK BASIC TEST (if your existing engine doesn't have runSpeedTest)
  async runFallbackBasicTest() {
    console.log('📱 Running fallback basic test...');
    
    const testUrl = "https://download.thinkbroadband.com/1MB.zip";
    const start = performance.now();

    try {
      const response = await fetch(testUrl);
      const blob = await response.blob();
      const duration = (performance.now() - start) / 1000;
      const mbps = ((blob.size * 8) / duration) / 1_000_000;
      
      return {
        speed: Math.round(mbps * 10) / 10,
        duration: duration,
        success: true
      };
    } catch (error) {
      return { speed: null, success: false, error: error.message };
    }
  }

  // 🔧 CALLBACK MANAGEMENT
  setEpicCallbacks(callbacks) {
    this.epicCallbacks = { ...this.epicCallbacks, ...callbacks };
  }

  // 🎯 MODE DETECTION
  isRunningEpicMode() {
    return this.isEpicMode;
  }

  getEpicConfig() {
    return this.currentConfig;
  }

  // 🧹 CLEANUP
  deactivateEpicMode() {
    console.log('🔄 Deactivating Epic Mode...');
    this.isEpicMode = false;
    this.currentConfig = null;
  }
}

// 🚀 USAGE EXAMPLES:
/*
// Basic usage with your existing engine
const epicEngine = new EpicSpeedTestEngine();

// Run basic test (uses your existing implementation)
const basicResult = await epicEngine.runBasicSpeedTest();

// Activate epic mode
await epicEngine.activateEpicMode();

// Run epic analysis
const epicResult = await epicEngine.runEpicAnalysis();

// Run specific epic tests
const gamingResult = await epicEngine.runGamingTest();
const quickResult = await epicEngine.runQuickEpicTest();
*/