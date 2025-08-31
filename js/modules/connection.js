// Connection testing and status management
export class ConnectionManager {
  constructor() {
    this.latestLatency = null;
    this.latestJitter = null;
    this.latestSpeed = null;
  }

  async checkConnection() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "checkConnection" }, (response) => {
        resolve(response);
      });
    });
  }

  async measureLatency() {
    const start = performance.now();
    try {
      await fetch("https://www.google.com/generate_204", { method: "GET", mode: "no-cors" });
      const latency = Math.round(performance.now() - start);
      this.latestLatency = latency;
      return { latency, success: true };
    } catch (error) {
      return { latency: null, success: false };
    }
  }

  async measureJitter(samples = 5) {
    const times = [];
    
    for (let i = 0; i < samples; i++) {
      const start = performance.now();
      try {
        await fetch("https://www.google.com/generate_204", { method: "GET", mode: "no-cors" });
        times.push(performance.now() - start);
      } catch (error) {
        times.push(null);
      }
      if (i < samples - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const validTimes = times.filter(t => typeof t === "number");
    if (validTimes.length < 2) {
      return { jitter: null, success: false };
    }

    const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
    const deviations = validTimes.map(t => Math.abs(t - avg));
    const jitter = Math.round(deviations.reduce((a, b) => a + b, 0) / deviations.length);
    
    this.latestJitter = jitter;
    return { jitter, success: true };
  }

  async runSpeedTest() {
    const testUrl = "https://download.thinkbroadband.com/1MB.zip";
    const start = performance.now();

    try {
      const response = await fetch(testUrl);
      const blob = await response.blob();
      const end = performance.now();
      const duration = (end - start) / 1000;
      const bits = blob.size * 8;
      const mbps = (bits / duration) / 1_000_000;
      const speed = Math.round(mbps * 10) / 10;
      
      this.latestSpeed = speed;
      return { speed, success: true };
    } catch (error) {
      return { speed: null, success: false };
    }
  }

  getMetrics() {
    return {
      latency: this.latestLatency,
      jitter: this.latestJitter,
      speed: this.latestSpeed
    };
  }

  calculateNetworkScore() {
    if (this.latestLatency === null || this.latestJitter === null || this.latestSpeed === null) {
      return null;
    }

    let score = 100;
    if (this.latestLatency > 100) score -= 20;
    if (this.latestJitter > 100) score -= 30;
    if (this.latestSpeed < 5) score -= 40;
    else if (this.latestSpeed < 20) score -= 20;

    return Math.max(0, score);
  }
}