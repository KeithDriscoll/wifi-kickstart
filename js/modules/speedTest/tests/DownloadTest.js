// Enhanced Download Test Module
// File: js/modules/speedTest/tests/DownloadTest.js

export class DownloadTest {
  constructor() {
    this.testServers = [
      { 
        name: 'Cloudflare CDN',
        baseUrl: 'https://speed.cloudflare.com/__down',
        sizes: { '1MB': 1000000, '10MB': 10000000, '25MB': 25000000 }
      },
      {
        name: 'Google CDN',
        baseUrl: 'https://www.google.com/gen_204',
        fallback: true
      },
      {
        name: 'jsDelivr CDN',
        baseUrl: 'https://cdn.jsdelivr.net/npm/speedtest-net@2.0.0/package.json',
        fallback: true
      }
    ];
    this.isRunning = false;
    this.abortController = null;
  }

  async run(config = {}) {
    if (this.isRunning) {
      throw new Error('Download test already running');
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    try {
      const testSize = config.downloadSize || '1MB';
      const iterations = config.iterations || 1;
      const timeout = config.timeout || 10000;

      const results = {
        success: true,
        speeds: [],
        servers: [],
        average: 0,
        max: 0,
        min: Infinity,
        consistency: 0,
        testSize,
        iterations,
        timestamp: Date.now()
      };

      // Test multiple servers if comprehensive
      const serversToTest = config.includeAdvanced ? 
        this.testServers.slice(0, 2) : 
        [this.testServers[0]];

      for (const server of serversToTest) {
        if (!this.isRunning) break;

        try {
          const serverResult = await this.testServer(server, testSize, iterations, timeout);
          results.servers.push(serverResult);
          results.speeds.push(...serverResult.speeds);
        } catch (error) {
          console.warn(`Server ${server.name} failed:`, error);
          results.servers.push({
            name: server.name,
            success: false,
            error: error.message
          });
        }
      }

      if (results.speeds.length === 0) {
        throw new Error('All download tests failed');
      }

      // Calculate statistics
      results.average = this.calculateAverage(results.speeds);
      results.max = Math.max(...results.speeds);
      results.min = Math.min(...results.speeds);
      results.consistency = this.calculateConsistency(results.speeds);

      // Determine best server
      results.bestServer = this.findBestServer(results.servers);

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

  async testServer(server, testSize, iterations, timeout) {
    const serverResult = {
      name: server.name,
      success: true,
      speeds: [],
      latencies: [],
      average: 0,
      testUrl: this.buildTestUrl(server, testSize)
    };

    for (let i = 0; i < iterations; i++) {
      if (!this.isRunning) break;

      try {
        const result = await this.singleDownloadTest(
          serverResult.testUrl, 
          testSize,
          timeout
        );
        
        serverResult.speeds.push(result.speed);
        serverResult.latencies.push(result.latency);
      } catch (error) {
        console.warn(`Download iteration ${i + 1} failed:`, error);
        // Continue with other iterations
      }
    }

    if (serverResult.speeds.length === 0) {
      throw new Error(`No successful downloads from ${server.name}`);
    }

    serverResult.average = this.calculateAverage(serverResult.speeds);
    return serverResult;
  }

  async singleDownloadTest(url, testSize, timeout) {
    const startTime = performance.now();
    let firstByteTime = null;
    let bytesReceived = 0;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.abortController?.abort();
        reject(new Error('Download test timeout'));
      }, timeout);

      fetch(url, {
        signal: this.abortController?.signal,
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        firstByteTime = performance.now();
        const reader = response.body.getReader();

        const readChunk = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              const endTime = performance.now();
              const duration = (endTime - startTime) / 1000; // seconds
              const speed = (bytesReceived * 8) / duration / 1_000_000; // Mbps
              
              clearTimeout(timeoutId);
              resolve({
                speed: Math.round(speed * 100) / 100,
                latency: Math.round(firstByteTime - startTime),
                duration,
                bytesReceived
              });
              return;
            }

            bytesReceived += value.length;
            readChunk();
          }).catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
        };

        readChunk();
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  buildTestUrl(server, testSize) {
    if (server.fallback) {
      // Use a fallback method for servers that don't have dedicated speed test endpoints
      return `${server.baseUrl}?${Date.now()}&size=${testSize}`;
    }

    const sizeBytes = server.sizes[testSize] || server.sizes['1MB'];
    return `${server.baseUrl}?bytes=${sizeBytes}&${Date.now()}`;
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

  findBestServer(servers) {
    const successfulServers = servers.filter(s => s.success && s.average > 0);
    
    if (successfulServers.length === 0) return null;
    
    // Sort by average speed (descending)
    successfulServers.sort((a, b) => b.average - a.average);
    
    return {
      name: successfulServers[0].name,
      speed: successfulServers[0].average,
      advantage: successfulServers.length > 1 ? 
        Math.round(((successfulServers[0].average - successfulServers[1].average) / successfulServers[1].average) * 100) : 0
    };
  }

  stop() {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  // Get server recommendations based on location/ISP
  async getOptimalServers() {
    try {
      // Get user's location info
      const ipInfo = await fetch('https://ipinfo.io/json').then(r => r.json());
      
      // Recommend servers based on location
      const recommendations = this.testServers.map(server => ({
        ...server,
        recommended: this.calculateServerScore(server, ipInfo)
      }));

      return recommendations.sort((a, b) => b.recommended - a.recommended);
    } catch (error) {
      console.warn('Could not get server recommendations:', error);
      return this.testServers;
    }
  }

  calculateServerScore(server, ipInfo) {
    // Simple scoring based on server name and user location
    let score = 50; // Base score
    
    if (server.name.includes('Cloudflare')) score += 20; // Generally fast
    if (server.name.includes('Google')) score += 15;
    
    // Geographic bonuses (simplified)
    if (ipInfo.country === 'US') {
      if (server.name.includes('Cloudflare')) score += 10;
    }
    
    return score;
  }
}