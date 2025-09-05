// Upload Test Module
// File: js/modules/speedTest/tests/UploadTest.js

export class UploadTest {
  constructor() {
    this.testEndpoints = [
      {
        name: 'httpbin.org',
        url: 'https://httpbin.org/post',
        method: 'POST'
      },
      {
        name: 'Cloudflare Workers',
        url: 'https://cloudflare-workers-speedtest.example.workers.dev/upload',
        method: 'POST',
        fallback: true
      }
    ];
    this.isRunning = false;
    this.abortController = null;
  }

  async run(config = {}) {
    if (this.isRunning) {
      throw new Error('Upload test already running');
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    try {
      const testSize = config.uploadSize || '500KB';
      const iterations = config.iterations || 1;
      const timeout = config.timeout || 15000;

      // Generate test data
      const testData = this.generateTestData(testSize);

      const results = {
        success: true,
        speeds: [],
        endpoints: [],
        average: 0,
        max: 0,
        min: Infinity,
        consistency: 0,
        testSize,
        iterations,
        timestamp: Date.now()
      };

      // Test primary endpoint (or fallback if needed)
      const endpoint = await this.selectBestEndpoint();
      
      for (let i = 0; i < iterations; i++) {
        if (!this.isRunning) break;

        try {
          const result = await this.singleUploadTest(endpoint, testData, timeout);
          results.speeds.push(result.speed);
        } catch (error) {
          console.warn(`Upload iteration ${i + 1} failed:`, error);
        }
      }

      if (results.speeds.length === 0) {
        throw new Error('All upload tests failed');
      }

      // Calculate statistics
      results.average = this.calculateAverage(results.speeds);
      results.max = Math.max(...results.speeds);
      results.min = Math.min(...results.speeds);
      results.consistency = this.calculateConsistency(results.speeds);
      results.endpoint = endpoint.name;

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

  async singleUploadTest(endpoint, testData, timeout) {
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.abortController?.abort();
        reject(new Error('Upload test timeout'));
      }, timeout);

      const formData = new FormData();
      formData.append('file', new Blob([testData]), 'speedtest.dat');
      formData.append('timestamp', Date.now().toString());

      fetch(endpoint.url, {
        method: endpoint.method,
        body: formData,
        signal: this.abortController?.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      .then(response => {
        const endTime = performance.now();
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const duration = (endTime - startTime) / 1000; // seconds
        const speed = (testData.length * 8) / duration / 1_000_000; // Mbps
        
        clearTimeout(timeoutId);
        resolve({
          speed: Math.round(speed * 100) / 100,
          duration,
          bytesUploaded: testData.length
        });
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  generateTestData(sizeString) {
    const sizes = {
      '500KB': 500 * 1024,
      '1MB': 1 * 1024 * 1024,
      '5MB': 5 * 1024 * 1024,
      '10MB': 10 * 1024 * 1024
    };

    const sizeBytes = sizes[sizeString] || sizes['500KB'];
    
    // Generate random data that compresses poorly (more realistic)
    const data = new Uint8Array(sizeBytes);
    for (let i = 0; i < sizeBytes; i++) {
      data[i] = Math.floor(Math.random() * 256);
    }
    
    return data;
  }

  async selectBestEndpoint() {
    // Try to ping each endpoint to find the fastest responding one
    const pingResults = await Promise.allSettled(
      this.testEndpoints.map(endpoint => this.pingEndpoint(endpoint))
    );

    // Find the fastest responding endpoint
    let bestEndpoint = this.testEndpoints[0];
    let bestLatency = Infinity;

    pingResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value < bestLatency) {
        bestLatency = result.value;
        bestEndpoint = this.testEndpoints[index];
      }
    });

    return bestEndpoint;
  }

  async pingEndpoint(endpoint) {
    const startTime = performance.now();
    
    try {
      const response = await fetch(endpoint.url, {
        method: 'OPTIONS',
        signal: AbortSignal.timeout(5000)
      });
      
      const endTime = performance.now();
      return endTime - startTime;
    } catch (error) {
      return Infinity;
    }
  }

  calculateAverage(values) {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round((sum / values.length) * 100) / 100;
  }

  calculateConsistency(speeds) {
    if (speeds.length < 2) return 100;
    
    const avg = this.calculateAverage(speeds);
    const variance = speeds.reduce((sum, speed) => {
      return sum + Math.pow(speed - avg, 2);
    }, 0) / speeds.length;
    
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - (stdDev / avg * 100));
    
    return Math.round(consistency);
  }

  stop() {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  // Estimate upload speed based on connection type
  getUploadEstimate() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      const effectiveType = conn.effectiveType;
      
      const estimates = {
        'slow-2g': 0.1,
        '2g': 0.3,
        '3g': 2,
        '4g': 10
      };
      
      return estimates[effectiveType] || 5;
    }
    
    return null;
  }

  // Check if upload test is recommended
  shouldTestUpload() {
    // Skip upload test on slow connections to save time
    if ('connection' in navigator) {
      const conn = navigator.connection;
      if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
        return false;
      }
    }
    
    return true;
  }
}