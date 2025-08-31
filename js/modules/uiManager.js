// UI management and DOM manipulation
export class UIManager {
  constructor() {
    this.elements = this.initializeElements();
    this.isAdvancedMode = true;
  }

  initializeElements() {
    return {
      status: document.getElementById("status"),
      checkBtn: document.getElementById("checkBtn"),
      ip: document.getElementById("ipAddress"),
      latency: document.getElementById("latency"),
      jitter: document.getElementById("jitter"),
      speed: document.getElementById("speed"),
      speedSimple: document.getElementById("speedSimple"),
      runSpeedBtn: document.getElementById("runSpeedBtn"),
      runSpeedBtnSimple: document.getElementById("runSpeedBtnSimple"),
      score: document.getElementById("score"),
      lastSpeed: document.getElementById("lastSpeed"),
      warpStatus: document.getElementById("warpStatus"),
      asnStatus: document.getElementById("asnStatus")
    };
  }

  getTimestamp() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  updateStatus(text, isOnline) {
    if (this.elements.status) {
      this.elements.status.textContent = `${text} (${this.getTimestamp()})`;
    }
    chrome.action.setBadgeText({ text: isOnline ? "✓" : "!" });
    chrome.action.setBadgeBackgroundColor({ color: isOnline ? "#28a745" : "#d93025" });
  }

  updateIPAddress(ipData) {
    if (!this.elements.ip) return;
    
    if (ipData.success && ipData.ip) {
      this.elements.ip.textContent = `IP: ${ipData.ip}`;
      this.elements.ip.title = `Location: ${ipData.city || "?"}, ${ipData.region || "?"}`;
    } else {
      this.elements.ip.textContent = "IP: Unavailable";
    }
  }

  updateLatency(latencyData) {
    if (!this.elements.latency || !this.isAdvancedMode) return;
    
    if (latencyData.success) {
      this.elements.latency.textContent = `Latency: ${latencyData.latency} ms`;
    } else {
      this.elements.latency.textContent = "Latency: Unavailable";
    }
  }

  updateJitter(jitterData) {
    if (!this.elements.jitter || !this.isAdvancedMode) return;
    
    if (jitterData.success) {
      const { color, emoji, tooltip } = this.getJitterMetrics(jitterData.jitter);
      this.elements.jitter.textContent = `Jitter: ${jitterData.jitter} ms ${emoji}`;
      this.elements.jitter.style.color = color;
      this.elements.jitter.title = tooltip;
    } else {
      this.elements.jitter.textContent = "Jitter: Unavailable";
      this.elements.jitter.style.color = "#666";
      this.elements.jitter.title = "Unable to measure jitter due to network errors.";
    }
  }

  updateSpeedTest(speedData, isSimpleMode = false) {
    const speedElement = isSimpleMode ? this.elements.speedSimple : this.elements.speed;
    if (!speedElement) return;

    if (speedData.success) {
      const { emoji, color, tooltip } = this.getSpeedMetrics(speedData.speed);
      
      if (isSimpleMode) {
        speedElement.textContent = `${speedData.speed} Mbps ${emoji}`;
      } else {
        speedElement.textContent = `Speed: ${speedData.speed} Mbps ${emoji}`;
      }
      
      speedElement.style.color = color;
      speedElement.title = tooltip;

      // Update timestamp for advanced mode
      if (!isSimpleMode && this.elements.lastSpeed) {
        const timestamp = new Date().toLocaleString();
        this.elements.lastSpeed.textContent = `Last Speed Test: ${timestamp}`;
      }
    } else {
      speedElement.textContent = isSimpleMode ? "Test failed" : "Speed: Unavailable";
      speedElement.style.color = "#666";
      speedElement.title = "Unable to measure speed";
      
      if (!isSimpleMode && this.elements.lastSpeed) {
        this.elements.lastSpeed.textContent = "Last Speed Test: Failed";
      }
    }
  }

  updateNetworkScore(score) {
    if (!this.elements.score || !this.isAdvancedMode) return;
    
    if (score === null) {
      this.elements.score.textContent = "Network Score: Incomplete";
      this.elements.score.style.color = "#666";
      this.elements.score.title = "Waiting for latency, jitter, and speed results";
      return;
    }

    const { emoji, color, label } = this.getScoreMetrics(score);
    this.elements.score.textContent = `Network Score: ${score} ${emoji} (${label})`;
    this.elements.score.style.color = color;
    this.elements.score.title = "Based on latency, jitter, and speed";
  }

  updateWARPStatus(warpData) {
    if (!this.elements.warpStatus || !this.isAdvancedMode) return;
    
    if (warpData.success) {
      if (warpData.isActive) {
        this.elements.warpStatus.textContent = "WARP: Active 🔒";
        this.elements.warpStatus.style.color = "#28a745";
        this.elements.warpStatus.title = "Your traffic is routed through Cloudflare WARP";
      } else {
        this.elements.warpStatus.textContent = "WARP: Inactive";
        this.elements.warpStatus.style.color = "#666";
        this.elements.warpStatus.title = "WARP is not currently active";
      }
    } else {
      this.elements.warpStatus.textContent = "WARP: Unknown";
      this.elements.warpStatus.style.color = "#999";
      this.elements.warpStatus.title = "Unable to detect WARP status";
    }
  }

  updateNetworkProvider(providerData) {
    if (!this.elements.asnStatus || !this.isAdvancedMode) return;
    
    if (providerData.success) {
      if (providerData.isCloudflare) {
        this.elements.asnStatus.textContent = `Network Provider: Cloudflare 🌀`;
        this.elements.asnStatus.style.color = "#28a745";
        this.elements.asnStatus.title = "Your IP is routed through Cloudflare";
      } else {
        this.elements.asnStatus.textContent = `Network Provider: ${providerData.provider || "Unknown"}`;
        this.elements.asnStatus.style.color = "#666";
        this.elements.asnStatus.title = "Your traffic flows through this provider";
      }
    } else {
      this.elements.asnStatus.textContent = "Network Provider: Unknown";
      this.elements.asnStatus.style.color = "#999";
      this.elements.asnStatus.title = "Unable to retrieve provider info";
    }
  }

  setSpeedTestLoading(isSimpleMode = false) {
    const speedElement = isSimpleMode ? this.elements.speedSimple : this.elements.speed;
    if (speedElement) {
      speedElement.textContent = "Testing...";
      speedElement.style.color = "#666";
      speedElement.title = "Running speed test...";
    }
  }

  setAdvancedMode(enabled) {
    this.isAdvancedMode = enabled;
    document.body.classList.remove("advanced-mode", "simple-mode");
    document.body.classList.add(enabled ? "advanced-mode" : "simple-mode");
  }

  // Utility methods for metrics
  getJitterMetrics(jitter) {
    if (jitter > 100) {
      return { color: "#d93025", emoji: "🔴", tooltip: "Poor stability — expect stuttering" };
    } else if (jitter > 30) {
      return { color: "#f9a825", emoji: "🟡", tooltip: "Acceptable stability" };
    } else {
      return { color: "#28a745", emoji: "🟢", tooltip: "Excellent stability" };
    }
  }

  getSpeedMetrics(speed) {
    if (speed < 5) {
      return { emoji: "🐢", color: "#d93025", tooltip: "Slow connection" };
    } else if (speed < 20) {
      return { emoji: "🚶", color: "#f9a825", tooltip: "Moderate speed" };
    } else {
      return { emoji: "🚀", color: "#28a745", tooltip: "Fast connection" };
    }
  }

  getScoreMetrics(score) {
    if (score < 40) {
      return { emoji: "⚠️", color: "#d93025", label: "Poor" };
    } else if (score < 70) {
      return { emoji: "📶", color: "#f9a825", label: "Fair" };
    } else {
      return { emoji: "💯", color: "#28a745", label: "Excellent" };
    }
  }
}