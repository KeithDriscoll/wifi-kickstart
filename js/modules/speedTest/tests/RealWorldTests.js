// Real World Tests Module - Simulate actual usage scenarios
// File: js/modules/speedTest/tests/RealWorldTests.js

export class RealWorldTests {
  constructor() {
    this.isRunning = false;
    this.abortController = null;
  }

  async run(config = {}) {
    if (this.isRunning) {
      throw new Error('Real world tests already running');
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    try {
      const results = {
        success: true,
        scenarios: {},
        timestamp: Date.now()
      };

      // Run different real-world scenarios
      const scenarios = [
        { name: 'videoCall', test: () => this.testVideoCall() },
        { name: 'streaming', test: () => this.testStreaming() },
        { name: 'gaming', test: () => this.testGaming() },
        { name: 'webBrowsing', test: () => this.testWebBrowsing() },
        { name: 'fileTransfer', test: () => this.testFileTransfer() }
      ];

      for (const scenario of scenarios) {
        if (!this.isRunning) break;

        try {
          results.scenarios[scenario.name] = await scenario.test();
        } catch (error) {
          console.warn(`${scenario.name} test failed:`, error);
          results.scenarios[scenario.name] = {
            success: false,
            error: error.message
          };
        }
      }

      // Generate overall assessment
      results.assessment = this.generateAssessment(results.scenarios);

      return results;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  async testVideoCall() {
    // Simulate video call requirements: consistent upload/download + low latency
    const results = {
      success: true,
      quality: 'unknown',
      issues: [],
      metrics: {}
    };

    try {
      // Test sustained bandwidth (5 second test)
      const sustainedTest = await this.sustainedBandwidthTest(3000, 5000); // 3 Mbps for 5 seconds
      results.metrics.sustainedBandwidth = sustainedTest;

      // Check for quality levels
      if (sustainedTest.averageSpeed >= 3 && sustainedTest.consistency > 80) {
        if (sustainedTest.averageSpeed >= 8) {
          results.quality = 'HD';
        } else if (sustainedTest.averageSpeed >= 5) {
          results.quality = 'Good';
        } else {
          results.quality = 'Basic';
        }
      } else {
        results.quality = 'Poor';
        results.issues.push('Inconsistent bandwidth');
      }

      // Simulate concurrent upload/download (like video call)
      const duplexTest = await this.duplexTest();
      results.metrics.duplex = duplexTest;

      if (duplexTest.uploadDrop > 50 || duplexTest.downloadDrop > 50) {
        results.issues.push('Bandwidth sharing issues');
        if (results.quality === 'HD') results.quality = 'Good';
        if (results.quality === 'Good') results.quality = 'Basic';
      }

      return results;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        quality: 'Failed'
      };
    }
  }

  async testStreaming() {
    const results = {
      success: true,
      supportedQualities: [],
      bufferingRisk: 'low',
      metrics: {}
    };

    try {
      // Test burst capacity (simulate video buffer filling)
      const burstTest = await this.burstDownloadTest();
      results.metrics.burst = burstTest;

      // Determine supported streaming qualities
      const avgSpeed = burstTest.averageSpeed;
      
      if (avgSpeed >= 3) results.supportedQualities.push('720p');
      if (avgSpeed >= 5) results.supportedQualities.push('1080p');
      if (avgSpeed >= 25) results.supportedQualities.push('4K');
      if (avgSpeed >= 50) results.supportedQualities.push('4K HDR');

      // Assess buffering risk based on consistency
      if (burstTest.consistency < 70) {
        results.bufferingRisk = 'high';
      } else if (burstTest.consistency < 85) {
        results.bufferingRisk = 'medium';
      }

      // Test multiple connections (family streaming scenario)
      const multiStreamTest = await this.multipleConnectionTest(3);
      results.metrics.multiStream = multiStreamTest;

      if (multiStreamTest.speedPerConnection < 5) {
        results.bufferingRisk = 'high';
        results.supportedQualities = results.supportedQualities.filter(q => q !== '4K' && q !== '4K HDR');
      }

      return results;

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testGaming() {
    const results = {
      success: true,
      gameTypes: {
        casual: false,
        competitive: false,
        professional: false
      },
      issues: [],
      metrics: {}
    };

    try {
      // Test gaming-specific latency patterns
      const gamingLatencyTest = await this.gamingLatencyTest();
      results.metrics.gaming = gamingLatencyTest;

      const avgLatency = gamingLatencyTest.averageLatency;
      const jitter = gamingLatencyTest.jitter;
      const packetLoss = gamingLatencyTest.packetLoss || 0;

      // Gaming suitability assessment
      if (avgLatency < 100 && packetLoss < 1) {
        results.gameTypes.casual = true;
      }
      
      if (avgLatency < 50 && jitter < 10 && packetLoss < 0.5) {
        results.gameTypes.competitive = true;
      }
      
      if (avgLatency < 20 && jitter < 5 && packetLoss < 0.1) {
        results.gameTypes.professional = true;
      }

      // Identify specific issues
      if (avgLatency > 100) results.issues.push('High latency');
      if (jitter > 20) results.issues.push('Inconsistent timing');
      if (packetLoss > 1) results.issues.push('Packet loss detected');

      return results;

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testWebBrowsing() {
    const results = {
      success: true,
      pageLoadQuality: 'unknown',
      metrics: {},
      issues: []
    };

    try {
      // Simulate web page loading (multiple small requests)
      const webLoadTest = await this.webPageLoadTest();
      results.metrics.webLoad = webLoadTest;

      const avgLoadTime = webLoadTest.averageLoadTime;
      
      if (avgLoadTime < 2000) {
        results.pageLoadQuality = 'Excellent';
      } else if (avgLoadTime < 4000) {
        results.pageLoadQuality = 'Good';
      } else if (avgLoadTime < 7000) {
        results.pageLoadQuality = 'Fair';
      } else {
        results.pageLoadQuality = 'Slow';
        results.issues.push('Slow page loading');
      }

      // Test DNS resolution speed
      const dnsTest = await this.dnsSpeedTest();
      results.metrics.dns = dnsTest;

      if (dnsTest.averageTime > 200) {
        results.issues.push('Slow DNS resolution');
      }

      return results;

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testFileTransfer() {
    const results = {
      success: true,
      transferRates: {},
      timeEstimates: {},
      metrics: {}
    };

    try {
      // Test different file size scenarios
      const transferTest = await this.fileTransferTest();
      results.metrics.transfer = transferTest;

      // Calculate time estimates for common file sizes
      const avgSpeed = transferTest.averageSpeed; // in Mbps
      const speedMBps = avgSpeed / 8; // Convert to MB/s

      results.timeEstimates = {
        '10MB': this.formatTime((10 / speedMBps) * 1000),
        '100MB': this.formatTime((100 / speedMBps) * 1000),
        '1GB': this.formatTime((1000 / speedMBps) * 1000),
        '10GB': this.formatTime((10000 / speedMBps) * 1000)
      };

      results.transferRates = {
        download: avgSpeed,
        practical: avgSpeed * 0.8 // Account for overhead
      };

      return results;

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper test methods

  async sustainedBandwidthTest(targetSpeedKbps, durationMs) {
    const chunks = [];
    const startTime = performance.now();
    const endTime = startTime + durationMs;

    while (performance.now() < endTime && this.isRunning) {
      try {
        const chunkStart = performance.now();
        await this.downloadChunk(50000); // 50KB chunks
        const chunkEnd = performance.now();
        
        const chunkDuration = (chunkEnd - chunkStart) / 1000;
        const chunkSpeed = (50000 * 8) / chunkDuration / 1000; // Kbps
        
        chunks.push(chunkSpeed);
      } catch (error) {
        // Continue with other chunks
      }
    }

    const averageSpeed = chunks.reduce((a, b) => a + b, 0) / chunks.length / 1000; // Convert to Mbps
    const consistency = this.calculateConsistency(chunks);

    return { averageSpeed, consistency, samples: chunks.length };
  }

  async duplexTest() {
    // Simulate simultaneous upload and download
    const uploadData = new Uint8Array(100000); // 100KB
    const downloadPromise = this.downloadChunk(100000);
    const uploadPromise = this.uploadChunk(uploadData);

    const [downloadResult, uploadResult] = await Promise.all([
      downloadPromise.catch(e => ({ speed: 0, error: e })),
      uploadPromise.catch(e => ({ speed: 0, error: e }))
    ]);

    return {
      downloadSpeed: downloadResult.speed || 0,
      uploadSpeed: uploadResult.speed || 0,
      downloadDrop: 0, // Would need baseline to calculate
      uploadDrop: 0
    };
  }

  async burstDownloadTest() {
    const speeds = [];
    
    // Download multiple chunks rapidly
    for (let i = 0; i < 5; i++) {
      if (!this.isRunning) break;
      
      try {
        const result = await this.downloadChunk(200000); // 200KB chunks
        speeds.push(result.speed);
      } catch (error) {
        // Continue with other chunks
      }
    }

    const averageSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const consistency = this.calculateConsistency(speeds);

    return { averageSpeed, consistency, speeds };
  }

  async multipleConnectionTest(connections) {
    const promises = [];
    
    for (let i = 0; i < connections; i++) {
      promises.push(this.downloadChunk(100000).catch(e => ({ speed: 0 })));
    }

    const results = await Promise.all(promises);
    const totalSpeed = results.reduce((sum, result) => sum + (result.speed || 0), 0);
    const speedPerConnection = totalSpeed / connections;

    return { totalSpeed, speedPerConnection, connections };
  }

  async gamingLatencyTest() {
    const latencies = [];
    const startTime = Date.now();

    // Send rapid ping-like requests
    for (let i = 0; i < 10; i++) {
      if (!this.isRunning) break;
      
      try {
        const ping = await this.measurePing();
        latencies.push(ping);
      } catch (error) {
        // Continue with other pings
      }
      
      // Small delay between pings
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const jitter = this.calculateJitter(latencies);

    return { averageLatency, jitter, latencies };
  }

  async webPageLoadTest() {
    const loadTimes = [];

    // Simulate loading multiple web resources
    const resources = [
      { url: 'https://httpbin.org/json', size: 'small' },
      { url: 'https://httpbin.org/html', size: 'medium' },
      { url: 'https://httpbin.org/xml', size: 'medium' }
    ];

    for (const resource of resources) {
      if (!this.isRunning) break;
      
      try {
        const startTime = performance.now();
        await fetch(resource.url, { 
          signal: AbortSignal.timeout(5000),
          cache: 'no-cache'
        });
        const endTime = performance.now();
        
        loadTimes.push(endTime - startTime);
      } catch (error) {
        loadTimes.push(5000); // Timeout value
      }
    }

    const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;

    return { averageLoadTime, loadTimes };
  }

  async dnsSpeedTest() {
    const domains = [
      'google.com',
      'cloudflare.com',
      'github.com'
    ];

    const dnsTimes = [];

    for (const domain of domains) {
      if (!this.isRunning) break;
      
      try {
        const startTime = performance.now();
        await fetch(`https://${domain}/favicon.ico`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000),
          cache: 'no-cache'
        });
        const endTime = performance.now();
        
        dnsTimes.push(endTime - startTime);
      } catch (error) {
        dnsTimes.push(3000); // Timeout value
      }
    }

    const averageTime = dnsTimes.reduce((a, b) => a + b, 0) / dnsTimes.length;

    return { averageTime, dnsTimes };
  }

  async fileTransferTest() {
    // Test with a larger download to simulate file transfer
    try {
      const result = await this.downloadChunk(1000000); // 1MB
      return { averageSpeed: result.speed };
    } catch (error) {
      return { averageSpeed: 0, error: error.message };
    }
  }

  // Utility methods

  async downloadChunk(sizeBytes) {
    const startTime = performance.now();
    
    const response = await fetch(`https://httpbin.org/bytes/${sizeBytes}`, {
      signal: this.abortController?.signal,
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    await response.blob();
    const endTime = performance.now();
    
    const duration = (endTime - startTime) / 1000;
    const speed = (sizeBytes * 8) / duration / 1_000_000; // Mbps

    return { speed: Math.round(speed * 100) / 100, duration };
  }

  async uploadChunk(data) {
    const startTime = performance.now();
    
    const formData = new FormData();
    formData.append('file', new Blob([data]));

    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      body: formData,
      signal: this.abortController?.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    await response.json();
    const endTime = performance.now();
    
    const duration = (endTime - startTime) / 1000;
    const speed = (data.length * 8) / duration / 1_000_000; // Mbps

    return { speed: Math.round(speed * 100) / 100, duration };
  }

  async measurePing() {
    const startTime = performance.now();
    
    await fetch('https://httpbin.org/get', {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000),
      cache: 'no-cache'
    });
    
    return performance.now() - startTime;
  }

  calculateConsistency(values) {
    if (values.length < 2) return 100;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, Math.round(100 - (stdDev / avg * 100)));
  }

  calculateJitter(latencies) {
    if (latencies.length < 2) return 0;
    
    const differences = [];
    for (let i = 1; i < latencies.length; i++) {
      differences.push(Math.abs(latencies[i] - latencies[i - 1]));
    }
    
    return differences.reduce((a, b) => a + b, 0) / differences.length;
  }

  formatTime(milliseconds) {
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
    if (milliseconds < 60000) return `${Math.round(milliseconds / 1000)}s`;
    
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.round((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  generateAssessment(scenarios) {
    const assessment = {
      overallGrade: 'C',
      strengths: [],
      weaknesses: [],
      recommendations: []
    };

    let goodScenarios = 0;
    let totalScenarios = 0;

    // Analyze each scenario
    Object.entries(scenarios).forEach(([name, result]) => {
      if (!result.success) return;
      
      totalScenarios++;

      switch (name) {
        case 'videoCall':
          if (result.quality === 'HD' || result.quality === 'Good') {
            assessment.strengths.push('Excellent for video calls');
            goodScenarios++;
          } else if (result.quality === 'Basic') {
            assessment.recommendations.push('Video call quality may vary');
          } else {
            assessment.weaknesses.push('Poor video call performance');
          }
          break;

        case 'streaming':
          if (result.supportedQualities.includes('4K')) {
            assessment.strengths.push('Supports 4K streaming');
            goodScenarios++;
          } else if (result.supportedQualities.includes('1080p')) {
            assessment.strengths.push('Good for HD streaming');
            goodScenarios++;
          } else {
            assessment.weaknesses.push('Limited streaming quality');
          }
          break;

        case 'gaming':
          if (result.gameTypes.competitive) {
            assessment.strengths.push('Great for online gaming');
            goodScenarios++;
          } else if (result.gameTypes.casual) {
            assessment.recommendations.push('Suitable for casual gaming');
            goodScenarios++;
          } else {
            assessment.weaknesses.push('High latency affects gaming');
          }
          break;

        case 'webBrowsing':
          if (result.pageLoadQuality === 'Excellent' || result.pageLoadQuality === 'Good') {
            assessment.strengths.push('Fast web browsing');
            goodScenarios++;
          }
          break;

        case 'fileTransfer':
          if (result.transferRates.download > 50) {
            assessment.strengths.push('Fast file downloads');
            goodScenarios++;
          }
          break;
      }
    });

    // Calculate overall grade
    const successRate = goodScenarios / totalScenarios;
    if (successRate >= 0.8) assessment.overallGrade = 'A';
    else if (successRate >= 0.6) assessment.overallGrade = 'B';
    else if (successRate >= 0.4) assessment.overallGrade = 'C';
    else if (successRate >= 0.2) assessment.overallGrade = 'D';
    else assessment.overallGrade = 'F';

    return assessment;
  }

  stop() {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}