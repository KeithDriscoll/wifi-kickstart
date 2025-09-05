export class LatencyTest {
  constructor() {
    this.isRunning = false;
    this.abortController = null;
  }

  async run(config = {}) {
    if (this.isRunning) {
      throw new Error('Latency test already running');
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    try {
      const iterations = config.iterations || 5;
      const timeout = config.timeout || 5000;
      const latencies = [];

      for (let i = 0; i < iterations; i++) {
        if (!this.isRunning) break;

        try {
          const latency = await this.measureSingleLatency(timeout);
          latencies.push(latency);
        } catch (error) {
          console.warn(`Latency measurement ${i + 1} failed:`, error);
        }

        // Small delay between measurements
        if (i < iterations - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      if (latencies.length === 0) {
        throw new Error('All latency measurements failed');
      }

      const average = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const min = Math.min(...latencies);
      const max = Math.max(...latencies);

      return {
        success: true,
        average: Math.round(average),
        min: Math.round(min),
        max: Math.round(max),
        measurements: latencies,
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
      this.abortController = null;
    }
  }

  async measureSingleLatency(timeout) {
    const startTime = performance.now();
    
    try {
      await fetch('https://www.google.com/generate_204', {
        method: 'GET',
        mode: 'no-cors',
        signal: AbortSignal.timeout(timeout)
      });
      
      return performance.now() - startTime;
    } catch (error) {
      throw new Error('Latency measurement failed');
    }
  }

  stop() {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}