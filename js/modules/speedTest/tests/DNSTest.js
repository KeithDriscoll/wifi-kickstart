export class DNSTest {
  constructor() {
    this.isRunning = false;
    this.testDomains = [
      'google.com',
      'cloudflare.com',
      'github.com',
      'amazon.com',
      'microsoft.com'
    ];
  }

  async run(config = {}) {
    if (this.isRunning) {
      throw new Error('DNS test already running');
    }

    this.isRunning = true;

    try {
      const timeout = config.timeout || 3000;
      const results = [];

      for (const domain of this.testDomains.slice(0, 3)) {
        if (!this.isRunning) break;

        try {
          const dnsTime = await this.measureDNSTime(domain, timeout);
          results.push({ domain, time: dnsTime, success: true });
        } catch (error) {
          results.push({ domain, time: null, success: false, error: error.message });
        }
      }

      const successfulResults = results.filter(r => r.success);
      if (successfulResults.length === 0) {
        throw new Error('All DNS lookups failed');
      }

      const averageTime = successfulResults.reduce((sum, r) => sum + r.time, 0) / successfulResults.length;

      return {
        success: true,
        averageTime: Math.round(averageTime),
        results,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    } finally {
      this.isRunning = false;
    }
  }

  async measureDNSTime(domain, timeout) {
    const startTime = performance.now();
    
    await fetch(`https://${domain}/favicon.ico`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(timeout),
      cache: 'no-cache'
    });
    
    return performance.now() - startTime;
  }

  stop() {
    this.isRunning = false;
  }
}