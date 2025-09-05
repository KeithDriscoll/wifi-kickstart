export class JitterTest {
  constructor() {
    this.isRunning = false;
    this.abortController = null;
  }

  async run(config = {}) {
    if (this.isRunning) {
      throw new Error('Jitter test already running');
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    try {
      const samples = config.samples || 10;
      const timeout = config.timeout || 3000;
      const times = [];

      for (let i = 0; i < samples; i++) {
        if (!this.isRunning) break;

        try {
          const latency = await this.measureLatency(timeout);
          times.push(latency);
        } catch (error) {
          times.push(null);
        }

        if (i < samples - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const validTimes = times.filter(t => t !== null);
      if (validTimes.length < 3) {
        throw new Error('Insufficient samples for jitter calculation');
      }

      const average = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
      const deviations = validTimes.map(t => Math.abs(t - average));
      const jitter = deviations.reduce((a, b) => a + b, 0) / deviations.length;

      return {
        success: true,
        average: Math.round(jitter),
        samples: validTimes.length,
        measurements: validTimes,
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

  async measureLatency(timeout) {
    const startTime = performance.now();
    
    await fetch('https://www.google.com/generate_204', {
      method: 'GET',
      mode: 'no-cors',
      signal: AbortSignal.timeout(timeout)
    });
    
    return performance.now() - startTime;
  }

  stop() {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}