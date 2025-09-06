// 🔥 ENHANCED SPEED TEST ENGINE - SINGLE CONSOLIDATED ENGINE
// Merges your existing SpeedTestEngine with Epic Network Metrics
// ONE ENGINE TO RULE THEM ALL!

import { EpicNetworkMetrics } from './EpicNetworkMetrics.js';

export class EnhancedSpeedTestEngine {
  constructor() {
    // Existing engine capabilities
    this.testModules = new Map();
    this.isRunning = false;
    this.currentResults = {};
    
    // Epic capabilities
    this.epicMetrics = new EpicNetworkMetrics();
    this.epicConfig = null;
    
    // Test configurations
    this.testConfig = {
      quick: {
        downloadSize: '1MB',
        uploadSize: '500KB',
        iterations: 1,
        timeout: 10000
      },
      comprehensive: {
        downloadSize: '10MB',
        uploadSize: '5MB',
        iterations: 3,
        timeout: 30000,
        includeAdvanced: true
      },
      epic: {
        downloadTests: {
          enabled: true,
          fileSizes: ['1MB', '5MB', '10MB'],
          iterations: 3,
          parallelConnections: 4
        },
        uploadTests: {
          enabled: true,
          fileSizes: ['1MB', '5MB'],
          iterations: 2
        },
        latencyTests: {
          enabled: true,
          sampleCount: 20,
          targets: ['google', 'cloudflare']
        },
        gamingTests: {
          enabled: false,
          sampleCount: 100
        },
        advanced: {
          ipv6Testing: true,
          cdnTesting: true,
          packetLossTesting: true,
          dnsTesting: true
        }
      }
    };
    
    this.callbacks = {
      onProgress: null,
      onComplete: null,
      onError: null
    };
  }

  // 🔧 CONFIGURATION MANAGEMENT
  async loadEpicConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['epicSpeedTestConfig'], (result) => {
        this.epicConfig = result.epicSpeedTestConfig || this.testConfig.epic;
        resolve(this.epicConfig);
      });
    });
  }

  async saveEpicConfig(config) {
    this.epicConfig = config;
    return new Promise((resolve) => {
      chrome.storage.local.set({ epicSpeedTestConfig: config }, resolve);
    });
  }

  // 🚀 TEST EXECUTION METHODS

  // BASIC SPEED TEST (Your existing functionality)
  async runBasicSpeedTest() {
    console.log('📊 Running basic speed test...');
    this.notifyProgress(10, 'Starting basic speed test...');
    
    try {
      const testUrl = "https://download.thinkbroadband.com/1MB.zip";
      const start = performance.now();
      
      const response = await fetch(testUrl);
      const blob = await response.blob();
      const duration = (performance.now() - start) / 1000;
      const mbps = ((blob.size * 8) / duration) / 1_000_000;
      
      const results = {
        testType: 'basic',
        timestamp: new Date().toISOString(),
        results: {
          download: {
            speed: Math.round(mbps * 10) / 10,
            success: true
          }
        },
        networkScore: this.calculateBasicScore(mbps),
        grade: this.calculateBasicGrade(mbps)
      };
      
      this.notifyProgress(100, 'Basic test complete!');
      this.notifyComplete(results);
      return results;
      
    } catch (error) {
      this.notifyError(error);
      throw error;
    }
  }

  // QUICK EPIC TEST (5-10 seconds)
  async runQuickEpicTest() {
    console.log('⚡ Running Quick Epic Test...');
    this.notifyProgress(5, 'Starting quick epic analysis...');
    
    const quickConfig = {
      downloadTests: { 
        enabled: true,
        fileSizes: ['5MB'], 
        iterations: 1,
        parallelConnections: 2
      },
      uploadTests: { 
        enabled: true,
        fileSizes: ['1MB'], 
        iterations: 1
      },
      latencyTests: { 
        enabled: true,
        sampleCount: 10,
        targets: ['google']
      },
      gamingTests: { enabled: false },
      advanced: { 
        ipv6Testing: false,
        cdnTesting: false,
        packetLossTesting: true,
        dnsTesting: true
      }
    };

    try {
      const results = await this.epicMetrics.runConfigurableTest(quickConfig);
      
      const processedResults = {
        testType: 'quick_epic',
        timestamp: new Date().toISOString(),
        config: quickConfig,
        results: results,
        networkScore: this.calculateEpicScore(results),
        grade: this.calculateEpicGrade(results)
      };
      
      this.notifyProgress(100, 'Quick epic test complete!');
      this.notifyComplete(processedResults);
      return processedResults;
      
    } catch (error) {
      this.notifyError(error);
      throw error;
    }
  }

  // FULL EPIC ANALYSIS (2-5 minutes)
  async runFullEpicAnalysis(customConfig = null) {
    console.log('🔥 Running FULL EPIC ANALYSIS...');
    this.notifyProgress(5, 'Initializing EPIC analysis...');
    
    try {
      // Load configuration
      const config = customConfig || await this.loadEpicConfig();
      
      // Set up progress callbacks for epic metrics
      this.epicMetrics.setCallbacks({
        onStart: (cfg) => this.notifyProgress(10, '🔥 Epic analysis initiated...'),
        onProgress: (message, progress) => this.notifyProgress(progress, message),
        onTestProgress: (message, progress) => this.notifyProgress(progress, message),
        onComplete: (results) => this.handleEpicComplete(results),
        onError: (error) => this.notifyError(error)
      });

      // Run the EPIC analysis
      const results = await this.epicMetrics.runConfigurableTest(config);
      
      const processedResults = {
        testType: 'full_epic',
        timestamp: new Date().toISOString(),
        config: config,
        results: results,
        networkScore: this.calculateEpicScore(results),
        grade: this.calculateEpicGrade(results),
        insights: this.generateEpicInsights(results),
        recommendations: this.generateRecommendations(results)
      };
      
      this.notifyProgress(100, '🎯 EPIC analysis complete!');
      this.notifyComplete(processedResults);
      return processedResults;
      
    } catch (error) {
      this.notifyError(error);
      throw error;
    }
  }

  // GAMING OPTIMIZED TEST
  async runGamingTest() {
    console.log('🎮 Running Gaming Test...');
    this.notifyProgress(5, 'Starting gaming analysis...');
    
    const gamingConfig = {
      downloadTests: { 
        enabled: true,
        fileSizes: ['5MB', '10MB'], 
        iterations: 2 
      },
      uploadTests: { 
        enabled: true,
        fileSizes: ['1MB', '5MB'], 
        iterations: 2 
      },
      latencyTests: { 
        enabled: true,
        sampleCount: 50,
        targets: ['google', 'cloudflare']
      },
      gamingTests: { 
        enabled: true,
        sampleCount: 100,
        burstTests: true,
        consistencyAnalysis: true
      },
      packetLossTests: { 
        enabled: true,
        sampleCount: 30 
      },
      advanced: { 
        ipv6Testing: true,
        cdnTesting: false,
        packetLossTesting: true,
        dnsTesting: true
      }
    };

    try {
      const results = await this.epicMetrics.runConfigurableTest(gamingConfig);
      
      const processedResults = {
        testType: 'gaming',
        timestamp: new Date().toISOString(),
        config: gamingConfig,
        results: results,
        networkScore: this.calculateGamingScore(results),
        grade: this.calculateGamingGrade(results),
        gamingInsights: this.generateGamingInsights(results)
      };
      
      this.notifyProgress(100, '🎮 Gaming analysis complete!');
      this.notifyComplete(processedResults);
      return processedResults;
      
    } catch (error) {
      this.notifyError(error);
      throw error;
    }
  }

  // 📊 SCORING SYSTEMS
  calculateBasicScore(speed) {
    if (speed > 50) return 90;
    if (speed > 25) return 75;
    if (speed > 10) return 60;
    if (speed > 5) return 45;
    return 30;
  }

  calculateBasicGrade(speed) {
    if (speed > 50) return { letter: 'A', description: 'Excellent' };
    if (speed > 25) return { letter: 'B', description: 'Good' };
    if (speed > 10) return { letter: 'C', description: 'Average' };
    return { letter: 'D', description: 'Below Average' };
  }

  calculateEpicScore(results) {
    let score = 100;
    const weights = { download: 30, upload: 20, latency: 25, packetLoss: 15, stability: 10 };

    // Download performance
    if (results.results?.download?.summary?.averageSpeed) {
      const downloadSpeed = results.results.download.summary.averageSpeed;
      if (downloadSpeed < 5) score -= weights.download * 0.8;
      else if (downloadSpeed < 25) score -= weights.download * 0.5;
      else if (downloadSpeed < 100) score -= weights.download * 0.2;
    }

    // Latency performance
    if (results.results?.latency?.summary?.average) {
      const avgLatency = results.results.latency.summary.average;
      if (avgLatency > 100) score -= weights.latency * 0.8;
      else if (avgLatency > 50) score -= weights.latency * 0.5;
      else if (avgLatency > 20) score -= weights.latency * 0.2;
    }

    // Packet loss
    if (results.results?.packetLoss?.percentage) {
      const packetLoss = results.results.packetLoss.percentage;
      if (packetLoss > 1) score -= weights.packetLoss;
      else if (packetLoss > 0.1) score -= weights.packetLoss * 0.5;
    }

    return Math.max(0, Math.round(score));
  }

  calculateEpicGrade(results) {
    const score = this.calculateEpicScore(results);
    if (score >= 90) return { letter: 'A+', description: 'Exceptional Network Performance' };
    if (score >= 80) return { letter: 'A', description: 'Excellent Network Performance' };
    if (score >= 70) return { letter: 'B', description: 'Good Network Performance' };
    if (score >= 60) return { letter: 'C', description: 'Average Network Performance' };
    if (score >= 50) return { letter: 'D', description: 'Below Average Performance' };
    return { letter: 'F', description: 'Poor Network Performance' };
  }

  calculateGamingScore(results) {
    let score = 100;
    
    // Gaming-specific scoring
    if (results.results?.gaming?.summary?.gamingGrade === 'Gaming Issues') score -= 40;
    else if (results.results?.gaming?.summary?.gamingGrade === 'Casual Gaming') score -= 20;
    else if (results.results?.gaming?.summary?.gamingGrade === 'Competitive') score -= 10;
    
    return Math.max(0, Math.round(score));
  }

  calculateGamingGrade(results) {
    const score = this.calculateGamingScore(results);
    if (score >= 90) return { letter: 'S', description: 'Pro Gamer Ready' };
    if (score >= 80) return { letter: 'A', description: 'Competitive Gaming' };
    if (score >= 70) return { letter: 'B', description: 'Casual Gaming' };
    return { letter: 'C', description: 'Gaming Limitations' };
  }

  // 🤖 AI INSIGHTS GENERATION
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

  generateGamingInsights(results) {
    const insights = [];
    
    if (results.results?.gaming) {
      const gaming = results.results.gaming.summary;
      if (gaming.gamingGrade === 'Pro Gamer') {
        insights.push('🎮 Your connection is optimized for professional gaming');
      } else if (gaming.gamingGrade === 'Gaming Issues') {
        insights.push('🎮 Gaming performance may be affected by latency spikes');
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

  // 🔧 CALLBACK MANAGEMENT
  setCallbacks({ onProgress, onComplete, onError }) {
    this.callbacks = { onProgress, onComplete, onError };
  }

  notifyProgress(percentage, message) {
    if (this.callbacks.onProgress) {
      this.callbacks.onProgress({ percentage, message });
    }
  }

  notifyComplete(results) {
    if (this.callbacks.onComplete) {
      this.callbacks.onComplete(results);
    }
  }

  notifyError(error) {
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  handleEpicComplete(results) {
    console.log('🎯 Epic analysis complete:', results);
    return results;
  }

  // 🛠️ UTILITY METHODS
  isRunning() {
    return this.isRunning || this.epicMetrics.isRunning;
  }

  stop() {
    this.isRunning = false;
    // Stop epic metrics if running
    if (this.epicMetrics.stop && typeof this.epicMetrics.stop === 'function') {
      this.epicMetrics.stop();
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning(),
      epicConfig: this.epicConfig,
      availableTests: ['basic', 'quick_epic', 'full_epic', 'gaming']
    };
  }
}

// 🎯 EXPORT
export { EnhancedSpeedTestEngine };