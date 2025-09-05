// Enhanced Speed Test Engine - Modular Architecture
// File: js/modules/speedTest/SpeedTestEngine.js

export class SpeedTestEngine {
  constructor() {
    this.testModules = new Map();
    this.isRunning = false;
    this.currentResults = {};
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
      }
    };
    this.callbacks = {
      onProgress: null,
      onComplete: null,
      onError: null
    };
  }

  // Register test modules dynamically
  registerTestModule(name, module) {
    this.testModules.set(name, module);
    console.log(`Registered speed test module: ${name}`);
  }

  // Initialize all test modules
  async initializeModules() {
    try {
      // Core speed tests
      const { DownloadTest } = await import('./tests/DownloadTest.js');
      const { UploadTest } = await import('./tests/UploadTest.js');
      const { LatencyTest } = await import('./tests/LatencyTest.js');
      const { JitterTest } = await import('./tests/JitterTest.js');
      
      // Advanced tests
      const { DNSTest } = await import('./tests/DNSTest.js');
      const { PacketLossTest } = await import('./tests/PacketLossTest.js');
      const { RealWorldTests } = await import('./tests/RealWorldTests.js');

      // Register modules
      this.registerTestModule('download', new DownloadTest());
      this.registerTestModule('upload', new UploadTest());
      this.registerTestModule('latency', new LatencyTest());
      this.registerTestModule('jitter', new JitterTest());
      this.registerTestModule('dns', new DNSTest());
      this.registerTestModule('packetLoss', new PacketLossTest());
      this.registerTestModule('realWorld', new RealWorldTests());

      console.log('All speed test modules initialized');
    } catch (error) {
      console.error('Failed to initialize speed test modules:', error);
      throw error;
    }
  }

  // Set event callbacks
  setCallbacks({ onProgress, onComplete, onError }) {
    this.callbacks = { onProgress, onComplete, onError };
  }

  // Run quick speed test (original functionality)
  async runQuickTest() {
    return this.runTest('quick');
  }

  // Run comprehensive speed test
  async runComprehensiveTest() {
    return this.runTest('comprehensive');
  }

  // Run custom test configuration
  async runTest(testType = 'quick') {
    if (this.isRunning) {
      throw new Error('Speed test already running');
    }

    this.isRunning = true;
    this.currentResults = {
      testType,
      startTime: Date.now(),
      results: {},
      metadata: {
        userAgent: navigator.userAgent,
        connection: this.getConnectionInfo(),
        timestamp: new Date().toISOString()
      }
    };

    try {
      const config = this.testConfig[testType];
      const testsToRun = this.getTestsForConfig(config);
      
      this.notifyProgress(0, 'Initializing tests...');

      // Run tests sequentially with progress updates
      let completedTests = 0;
      for (const testName of testsToRun) {
        const testModule = this.testModules.get(testName);
        if (!testModule) {
          console.warn(`Test module ${testName} not found`);
          continue;
        }

        this.notifyProgress(
          (completedTests / testsToRun.length) * 100,
          `Running ${testName} test...`
        );

        try {
          const result = await testModule.run(config);
          this.currentResults.results[testName] = result;
          completedTests++;
        } catch (error) {
          console.error(`${testName} test failed:`, error);
          this.currentResults.results[testName] = {
            success: false,
            error: error.message
          };
        }
      }

      // Calculate composite metrics
      this.calculateCompositeMetrics();
      
      this.notifyProgress(100, 'Tests complete!');
      this.currentResults.endTime = Date.now();
      this.currentResults.duration = this.currentResults.endTime - this.currentResults.startTime;

      // Store results for AI analysis
      await this.storeResults();

      this.notifyComplete(this.currentResults);
      return this.currentResults;

    } catch (error) {
      this.notifyError(error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Determine which tests to run based on configuration
  getTestsForConfig(config) {
    const basicTests = ['latency', 'jitter', 'download'];
    
    if (config.includeAdvanced) {
      return [
        ...basicTests,
        'upload',
        'dns', 
        'packetLoss',
        'realWorld'
      ];
    }
    
    return basicTests;
  }

  // Calculate composite metrics from individual test results
  calculateCompositeMetrics() {
    const results = this.currentResults.results;
    
    // Network Score (0-100)
    this.currentResults.networkScore = this.calculateNetworkScore(results);
    
    // Quality Assessment
    this.currentResults.qualityAssessment = this.assessConnectionQuality(results);
    
    // Use Case Suitability
    this.currentResults.useCases = this.assessUseCases(results);
    
    // Performance Grade
    this.currentResults.grade = this.calculateGrade(results);
  }

  calculateNetworkScore(results) {
    let score = 100;
    
    // Latency impact (30% weight)
    if (results.latency?.average > 100) score -= 20;
    else if (results.latency?.average > 50) score -= 10;
    
    // Download speed impact (40% weight)
    if (results.download?.speed < 5) score -= 30;
    else if (results.download?.speed < 25) score -= 15;
    
    // Jitter impact (20% weight)
    if (results.jitter?.average > 50) score -= 15;
    else if (results.jitter?.average > 20) score -= 8;
    
    // Packet loss impact (10% weight)
    if (results.packetLoss?.percentage > 5) score -= 10;
    else if (results.packetLoss?.percentage > 1) score -= 5;
    
    return Math.max(0, Math.round(score));
  }

  assessConnectionQuality(results) {
    const download = results.download?.speed || 0;
    const latency = results.latency?.average || Infinity;
    const jitter = results.jitter?.average || Infinity;
    
    if (download > 100 && latency < 20 && jitter < 5) {
      return { level: 'excellent', description: 'Premium fiber-like performance' };
    } else if (download > 50 && latency < 40 && jitter < 15) {
      return { level: 'good', description: 'Solid broadband connection' };
    } else if (download > 10 && latency < 100) {
      return { level: 'fair', description: 'Basic internet service' };
    } else {
      return { level: 'poor', description: 'Limited connectivity' };
    }
  }

  assessUseCases(results) {
    const download = results.download?.speed || 0;
    const upload = results.upload?.speed || 0;
    const latency = results.latency?.average || Infinity;
    const jitter = results.jitter?.average || Infinity;
    
    return {
      streaming: {
        hd: download >= 5,
        fourK: download >= 25,
        multipleDevices: download >= 50
      },
      gaming: {
        casual: latency < 100,
        competitive: latency < 30 && jitter < 10,
        professional: latency < 15 && jitter < 5
      },
      videoCall: {
        basic: upload >= 1 && download >= 1 && latency < 150,
        hd: upload >= 3 && download >= 3 && latency < 100,
        group: upload >= 5 && download >= 5 && latency < 80
      },
      workFromHome: {
        basic: upload >= 5 && download >= 10 && latency < 100,
        advanced: upload >= 20 && download >= 50 && latency < 50
      }
    };
  }

  calculateGrade(results) {
    const score = this.currentResults.networkScore;
    
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 40) return 'D';
    return 'F';
  }

  // Get connection information from Navigator API
  getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData
      };
    }
    return null;
  }

  // Store results for historical analysis and AI training
  async storeResults() {
    try {
      // Get existing results
      const stored = await chrome.storage.local.get('speedTestHistory');
      const history = stored.speedTestHistory || [];
      
      // Add current results
      history.push(this.currentResults);
      
      // Keep only last 50 tests
      const trimmedHistory = history.slice(-50);
      
      // Store back
      await chrome.storage.local.set({ 
        speedTestHistory: trimmedHistory,
        lastSpeedTest: this.currentResults
      });
      
      console.log('Speed test results stored successfully');
    } catch (error) {
      console.error('Failed to store speed test results:', error);
    }
  }

  // Event notification methods
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

  // Get test history for AI analysis
  async getTestHistory() {
    try {
      const stored = await chrome.storage.local.get('speedTestHistory');
      return stored.speedTestHistory || [];
    } catch (error) {
      console.error('Failed to get test history:', error);
      return [];
    }
  }

  // Stop current test
  stop() {
    if (this.isRunning) {
      this.isRunning = false;
      // Signal all running tests to stop
      for (const [name, module] of this.testModules) {
        if (module.stop && typeof module.stop === 'function') {
          module.stop();
        }
      }
    }
  }

  // Get current test status
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentResults: this.currentResults,
      availableTests: Array.from(this.testModules.keys())
    };
  }
}