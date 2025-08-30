document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const elements = {
    status: document.getElementById("status"),
    checkBtn: document.getElementById("checkBtn"),
    ip: document.getElementById("ipAddress"),
    latency: document.getElementById("latency"),
    jitter: document.getElementById("jitter"),
    speed: document.getElementById("speedTest"),
    speedSimple: document.getElementById("speedSimple"),
    runSpeedBtn: document.getElementById("runSpeedBtn"),
    runSpeedBtnSimple: document.getElementById("runSpeedBtnSimple"),
    score: document.getElementById("networkScore"),
    lastSpeed: document.getElementById("lastSpeed"),
    menuToggle: document.getElementById("menuToggle"),
    sidePanel: document.getElementById("sidePanel"),
    closePanel: document.getElementById("closePanel"),
    warpStatus: document.getElementById("warpStatus"),
    asnStatus: document.getElementById("asnStatus")
  };

  // State
  let latestLatency = null;
  let latestJitter = null;
  let latestSpeed = null;
  let isAdvancedMode = true; // Default to advanced mode

  // Initialize everything
  initSidePanel();
  initModeToggle();
  initToggleFeatures();
  initTheme();
  initThemeSystem();
  initThemeSystem();

  // Initial data load
  requestConnectionCheck();
  fetchIPAddress();
  detectCloudflareUsage();

  // Event listeners
  if (elements.checkBtn) {
    elements.checkBtn.addEventListener("click", requestConnectionCheck);
  }

  if (elements.runSpeedBtn) {
    elements.runSpeedBtn.addEventListener("click", () => runSpeedTest(false));
  }

  if (elements.runSpeedBtnSimple) {
    elements.runSpeedBtnSimple.addEventListener("click", () => runSpeedTest(true));
  }

  function initSidePanel() {
    if (elements.menuToggle && elements.sidePanel && elements.closePanel) {
      elements.menuToggle.addEventListener("click", () => {
        elements.sidePanel.classList.add("open");
        elements.menuToggle.classList.add("hidden");
      });

      elements.closePanel.addEventListener("click", () => {
        elements.sidePanel.classList.remove("open");
        elements.menuToggle.classList.remove("hidden");
      });
    }
  }

  function initModeToggle() {
    const advancedToggle = document.getElementById("toggleAdvancedMode");
    
    // Load saved mode preference
    chrome.storage.local.get("advancedModeEnabled", (data) => {
      isAdvancedMode = data.advancedModeEnabled ?? true; // Default to advanced
      if (advancedToggle) advancedToggle.checked = isAdvancedMode;
      applyMode(isAdvancedMode);
    });

    // Save on change
    if (advancedToggle) {
      advancedToggle.addEventListener("change", () => {
        isAdvancedMode = advancedToggle.checked;
        chrome.storage.local.set({ advancedModeEnabled: isAdvancedMode });
        applyMode(isAdvancedMode);
      });
    }
  }

  function applyMode(advanced) {
    // Remove existing classes first to prevent conflicts
    document.body.classList.remove("advanced-mode", "simple-mode");
    
    // Add the appropriate class
    if (advanced) {
      document.body.classList.add("advanced-mode");
    } else {
      document.body.classList.add("simple-mode");
    }
    
    // Reset measurements for current mode
    if (advanced && latestLatency === null) {
      measureLatency();
      measureJitter();
    }
  }

  function getTimestamp() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function updateStatus(text, isOnline) {
    if (elements.status) {
      elements.status.textContent = `${text} (${getTimestamp()})`;
    }
    chrome.action.setBadgeText({ text: isOnline ? "✓" : "!" });
    chrome.action.setBadgeBackgroundColor({ color: isOnline ? "#28a745" : "#d93025" });
  }

  function requestConnectionCheck() {
    chrome.runtime.sendMessage({ action: "checkConnection" }, (response) => {
      const isOnline = response?.status === "online";
      const status = isOnline ? "Online ✅" : "Offline ❌";
      updateStatus(`Status: ${status}`, isOnline);
      
      if (isOnline && isAdvancedMode) {
        measureLatency();
        measureJitter();
        runSpeedTest(false);
      }
    });
  }

  function fetchIPAddress() {
    fetch("https://ipinfo.io/json")
      .then((res) => res.json())
      .then((data) => {
        if (elements.ip && data?.ip) {
          elements.ip.textContent = `IP: ${data.ip}`;
          elements.ip.title = `Location: ${data.city || "?"}, ${data.region || "?"}`;
        } else if (elements.ip) {
          elements.ip.textContent = "IP: Unavailable";
        }
      })
      .catch(() => {
        if (elements.ip) elements.ip.textContent = "IP: Unavailable";
      });
  }

  function measureLatency() {
    if (!isAdvancedMode) return;
    
    const start = performance.now();
    fetch("https://www.google.com/generate_204", { method: "GET", mode: "no-cors" })
      .then(() => {
        const latency = Math.round(performance.now() - start);
        latestLatency = latency;
        if (elements.latency) elements.latency.textContent = `Latency: ${latency} ms`;
        updateNetworkScore();
      })
      .catch(() => {
        if (elements.latency) elements.latency.textContent = "Latency: Unavailable";
      });
  }

  function measureJitter(samples = 5) {
    if (!isAdvancedMode) return;
    
    const times = [];
    let completed = 0;

    function ping() {
      const start = performance.now();
      fetch("https://www.google.com/generate_204", { method: "GET", mode: "no-cors" })
        .then(() => {
          const latency = performance.now() - start;
          times.push(latency);
        })
        .catch(() => {
          times.push(null);
        })
        .finally(() => {
          completed++;
          if (completed < samples) {
            setTimeout(ping, 100);
          } else {
            displayJitter(times);
          }
        });
    }

    ping();
  }

  function displayJitter(times) {
    if (!elements.jitter || !isAdvancedMode) return;

    const validTimes = times.filter((t) => typeof t === "number");
    if (validTimes.length < 2) {
      elements.jitter.textContent = "Jitter: Unavailable";
      elements.jitter.style.color = "#666";
      elements.jitter.title = "Unable to measure jitter due to network errors.";
      return;
    }

    const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
    const deviations = validTimes.map((t) => Math.abs(t - avg));
    const jitter = Math.round(deviations.reduce((a, b) => a + b, 0) / deviations.length);
    latestJitter = jitter;

    const { color, emoji, tooltip } = getJitterMetrics(jitter);

    elements.jitter.textContent = `Jitter: ${jitter} ms ${emoji}`;
    elements.jitter.style.color = color;
    elements.jitter.title = tooltip;

    updateNetworkScore();
  }

  function getJitterMetrics(jitter) {
    if (jitter > 100) {
      return { color: "#d93025", emoji: "🔴", tooltip: "Poor stability — expect stuttering" };
    } else if (jitter > 30) {
      return { color: "#f9a825", emoji: "🟡", tooltip: "Acceptable stability" };
    } else {
      return { color: "#28a745", emoji: "🟢", tooltip: "Excellent stability" };
    }
  }

  function runSpeedTest(isSimpleMode = false) {
    const speedElement = isSimpleMode ? elements.speedSimple : elements.speed;
    if (!speedElement) return;

    const testUrl = "https://download.thinkbroadband.com/1MB.zip";
    const start = performance.now();

    speedElement.textContent = "Testing...";
    speedElement.style.color = "#666";
    speedElement.title = "Running speed test...";

    fetch(testUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const end = performance.now();
        const duration = (end - start) / 1000;
        const bits = blob.size * 8;
        const mbps = (bits / duration) / 1_000_000;
        const rounded = Math.round(mbps * 10) / 10;
        latestSpeed = rounded;

        const { emoji, color, tooltip } = getSpeedMetrics(rounded);

        if (isSimpleMode) {
          speedElement.textContent = `${rounded} Mbps ${emoji}`;
        } else {
          speedElement.textContent = `Speed: ${rounded} Mbps ${emoji}`;
        }
        
        speedElement.style.color = color;
        speedElement.title = tooltip;

        // Update timestamp for advanced mode
        if (!isSimpleMode && elements.lastSpeed) {
          const timestamp = new Date().toLocaleString();
          elements.lastSpeed.textContent = `Last Speed Test: ${timestamp}`;
        }

        updateNetworkScore();
      })
      .catch(() => {
        speedElement.textContent = isSimpleMode ? "Test failed" : "Speed: Unavailable";
        speedElement.style.color = "#666";
        speedElement.title = "Unable to measure speed";
        
        if (!isSimpleMode && elements.lastSpeed) {
          elements.lastSpeed.textContent = "Last Speed Test: Failed";
        }
      });
  }

  function getSpeedMetrics(speed) {
    if (speed < 5) {
      return { emoji: "🐢", color: "#d93025", tooltip: "Slow connection" };
    } else if (speed < 20) {
      return { emoji: "🚶", color: "#f9a825", tooltip: "Moderate speed" };
    } else {
      return { emoji: "🚀", color: "#28a745", tooltip: "Fast connection" };
    }
  }

  function updateNetworkScore() {
    if (!elements.score || !isAdvancedMode) return;
    
    if (latestLatency === null || latestJitter === null || latestSpeed === null) {
      elements.score.textContent = "Network Score: Incomplete";
      elements.score.style.color = "#666";
      elements.score.title = "Waiting for latency, jitter, and speed results";
      return;
    }

    let score = 100;
    if (latestLatency > 100) score -= 20;
    if (latestJitter > 100) score -= 30;
    if (latestSpeed < 5) score -= 40;
    else if (latestSpeed < 20) score -= 20;

    const { emoji, color, label } = getScoreMetrics(score);

    elements.score.textContent = `Network Score: ${score} ${emoji} (${label})`;
    elements.score.style.color = color;
    elements.score.title = "Based on latency, jitter, and speed";
  }

  function getScoreMetrics(score) {
    if (score < 40) {
      return { emoji: "⚠️", color: "#d93025", label: "Poor" };
    } else if (score < 70) {
      return { emoji: "📶", color: "#f9a825", label: "Fair" };
    } else {
      return { emoji: "💯", color: "#28a745", label: "Excellent" };
    }
  }

  function detectCloudflareUsage() {
    // WARP detection
    fetch("https://www.cloudflare.com/cdn-cgi/trace")
      .then(res => res.text())
      .then(text => {
        const warpMatch = text.match(/warp=(\w+)/);
        if (elements.warpStatus && isAdvancedMode) {
          if (warpMatch && warpMatch[1] === "on") {
            elements.warpStatus.textContent = "WARP: Active 🔒";
            elements.warpStatus.style.color = "#28a745";
            elements.warpStatus.title = "Your traffic is routed through Cloudflare WARP";
          } else {
            elements.warpStatus.textContent = "WARP: Inactive";
            elements.warpStatus.style.color = "#666";
            elements.warpStatus.title = "WARP is not currently active";
          }
        }
      })
      .catch(() => {
        if (elements.warpStatus && isAdvancedMode) {
          elements.warpStatus.textContent = "WARP: Unknown";
          elements.warpStatus.style.color = "#999";
          elements.warpStatus.title = "Unable to detect WARP status";
        }
      });

    // ASN lookup
    fetch("https://ipinfo.io/json")
      .then(res => res.json())
      .then(data => {
        if (!elements.asnStatus || !isAdvancedMode) return;

        const org = data.org || "";
        const provider = org.split(" ").slice(1).join(" "); // Strip "ASxxxxx"

        if (provider.toLowerCase().includes("cloudflare")) {
          elements.asnStatus.textContent = `Network Provider: Cloudflare 🌀`;
          elements.asnStatus.style.color = "#28a745";
          elements.asnStatus.title = "Your IP is routed through Cloudflare";
        } else {
          elements.asnStatus.textContent = `Network Provider: ${provider || "Unknown"}`;
          elements.asnStatus.style.color = "#666";
          elements.asnStatus.title = "Your traffic flows through this provider";
        }
      })
      .catch(() => {
        if (elements.asnStatus && isAdvancedMode) {
          elements.asnStatus.textContent = "Network Provider: Unknown";
          elements.asnStatus.style.color = "#999";
          elements.asnStatus.title = "Unable to retrieve provider info";
        }
      });
  }

  function initToggleFeatures() {
    const toggles = [
      { id: "toggleSpeedTest", key: "enableSpeedTest", elementId: "speedTest" },
      { id: "toggleWarpCheck", key: "showWarpStatus", elementId: "warpStatus" },
      { id: "toggleNetworkScore", key: "showNetworkScore", elementId: "networkScore" }
    ];

    // Load saved states
    chrome.storage.local.get(toggles.map(t => t.key), (data) => {
      toggles.forEach(({ id, key, elementId }) => {
        const toggleEl = document.getElementById(id);
        const targetEl = document.getElementById(elementId);
        if (toggleEl && targetEl) {
          const enabled = data[key] ?? true; // default to true
          toggleEl.checked = enabled;
          targetEl.style.display = enabled ? "block" : "none";
        }
      });
    });

    // Save on change
    toggles.forEach(({ id, key, elementId }) => {
      const toggleEl = document.getElementById(id);
      const targetEl = document.getElementById(elementId);
      if (toggleEl && targetEl) {
        toggleEl.addEventListener("change", () => {
          const enabled = toggleEl.checked;
          chrome.storage.local.set({ [key]: enabled });
          targetEl.style.display = enabled ? "block" : "none";
        });
      }
    });
  }

  function initTheme() {
    const darkToggle = document.getElementById("toggleDarkMode");
    
    // Load saved theme
    chrome.storage.local.get("darkModeEnabled", (data) => {
      const enabled = data.darkModeEnabled ?? false;
      if (darkToggle) darkToggle.checked = enabled;
      applyTheme(enabled);
    });

    // Save on change
    if (darkToggle) {
      darkToggle.addEventListener("change", () => {
        const enabled = darkToggle.checked;
        chrome.storage.local.set({ darkModeEnabled: enabled });
        applyTheme(enabled);
      });
    }
  }

  function applyTheme(enabled) {
    if (enabled) {
      // Dark mode: purple theme that overrides everything
      const root = document.documentElement;
      root.style.setProperty('--primary-color', '#b48cff');
      root.style.setProperty('--bg-primary', '#1a0e2a');
      root.style.setProperty('--bg-secondary', '#2b1850');
      root.style.setProperty('--text-primary', '#e0d7f5');
      root.style.setProperty('--success-color', '#28a745');
      root.style.setProperty('--warning-color', '#f9a825');
      root.style.setProperty('--switch-active', '#6a3fc9');
    } else {
      // Light mode: check for saved custom theme
      chrome.storage.local.get(["customTheme", "currentThemeName"], (data) => {
        if (data.customTheme && data.currentThemeName !== "dark") {
          applyCustomTheme(data.customTheme);
        } else {
          // Default light theme
          const root = document.documentElement;
          root.style.setProperty('--primary-color', '#0078d4');
          root.style.setProperty('--bg-primary', '#f9f9f9');
          root.style.setProperty('--bg-secondary', '#ffffff');
          root.style.setProperty('--text-primary', '#333');
          root.style.setProperty('--success-color', '#28a745');
          root.style.setProperty('--warning-color', '#f9a825');
          root.style.setProperty('--switch-active', '#0078d4');
        }
      });
    }
    
    document.body.classList.toggle("dark", enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }

  function initThemeSystem() {
    const themeBtn = document.getElementById("themeBtn");
    const themePanel = document.getElementById("themePanel");
    const closeThemePanel = document.getElementById("closeThemePanel");
    const customColorsBtn = document.getElementById("customColorsBtn");
    const customColorsPanel = document.getElementById("customColorsPanel");
    const closeCustomPanel = document.getElementById("closeCustomPanel");

    // Preset themes data
    const themes = {
      default: { primary: "#0078d4", bg: "#f9f9f9", success: "#28a745", warning: "#f9a825" },
      ocean: { primary: "#0891b2", bg: "#f0f9ff", success: "#059669", warning: "#0891b2" },
      forest: { primary: "#16a34a", bg: "#f7fdf7", success: "#22c55e", warning: "#eab308" },
      sunset: { primary: "#ea580c", bg: "#fff7ed", success: "#f97316", warning: "#eab308" },
      purple: { primary: "#9333ea", bg: "#faf5ff", success: "#a855f7", warning: "#d946ef" }
    };

    // Open theme panel
    if (themeBtn && themePanel) {
      themeBtn.addEventListener("click", () => {
        themePanel.classList.add("open");
        elements.sidePanel.style.zIndex = "999";
      });
    }

    // Close theme panel
    if (closeThemePanel && themePanel) {
      closeThemePanel.addEventListener("click", () => {
        themePanel.classList.remove("open");
        elements.sidePanel.style.zIndex = "1000";
      });
    }

    // Open custom colors panel
    if (customColorsBtn && customColorsPanel) {
      customColorsBtn.addEventListener("click", () => {
        customColorsPanel.classList.add("open");
        themePanel.style.zIndex = "1099";
        loadCurrentColors();
      });
    }

    // Close custom colors panel
    if (closeCustomPanel && customColorsPanel) {
      closeCustomPanel.addEventListener("click", () => {
        customColorsPanel.classList.remove("open");
        themePanel.style.zIndex = "1100";
      });
    }

    // Preset theme selection
    document.querySelectorAll(".theme-option").forEach(option => {
      option.addEventListener("click", () => {
        const themeName = option.dataset.theme;
        if (themes[themeName]) {
          // Turn off dark mode when selecting a preset theme
          const darkToggle = document.getElementById("toggleDarkMode");
          if (darkToggle) {
            darkToggle.checked = false;
            chrome.storage.local.set({ darkModeEnabled: false });
          }
          
          applyCustomTheme(themes[themeName]);
          chrome.storage.local.set({ 
            customTheme: themes[themeName],
            currentThemeName: themeName 
          });
          
          // Update selection visual
          document.querySelectorAll(".theme-option").forEach(opt => 
            opt.classList.remove("selected"));
          option.classList.add("selected");
          
          // Remove dark mode classes
          document.body.classList.remove("dark");
          document.documentElement.classList.remove("dark");
        }
      });
    });

    // Custom color controls
    const applyBtn = document.getElementById("applyCustom");
    const resetBtn = document.getElementById("resetCustom");

    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        const customTheme = {
          primary: document.getElementById("primaryColorPicker").value,
          bg: document.getElementById("bgColorPicker").value,
          success: document.getElementById("successColorPicker").value,
          warning: document.getElementById("warningColorPicker").value
        };
        
        // Turn off dark mode when applying custom colors
        const darkToggle = document.getElementById("toggleDarkMode");
        if (darkToggle) {
          darkToggle.checked = false;
          chrome.storage.local.set({ darkModeEnabled: false });
        }
        
        applyCustomTheme(customTheme);
        chrome.storage.local.set({ 
          customTheme: customTheme,
          currentThemeName: "custom" 
        });
        
        // Remove dark mode classes
        document.body.classList.remove("dark");
        document.documentElement.classList.remove("dark");
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        applyCustomTheme(themes.default);
        chrome.storage.local.set({ 
          customTheme: themes.default,
          currentThemeName: "default" 
        });
        loadCurrentColors();
      });
    }

    // Load saved theme
    chrome.storage.local.get(["customTheme", "currentThemeName"], (data) => {
      if (data.customTheme) {
        applyCustomTheme(data.customTheme);
        
        // Mark selected preset if applicable
        if (data.currentThemeName && data.currentThemeName !== "custom") {
          const selectedOption = document.querySelector(`[data-theme="${data.currentThemeName}"]`);
          if (selectedOption) selectedOption.classList.add("selected");
        }
      }
    });
  }

  function applyCustomTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--bg-primary', theme.bg);
    root.style.setProperty('--success-color', theme.success);
    root.style.setProperty('--warning-color', theme.warning);
    root.style.setProperty('--switch-active', theme.primary);
    
    // Handle optional text and background colors for dark mode
    if (theme.textPrimary) {
      root.style.setProperty('--text-primary', theme.textPrimary);
    }
    if (theme.bgSecondary) {
      root.style.setProperty('--bg-secondary', theme.bgSecondary);
    }
  }

  function loadCurrentColors() {
    const style = getComputedStyle(document.documentElement);
    const primaryPicker = document.getElementById("primaryColorPicker");
    const bgPicker = document.getElementById("bgColorPicker");
    const successPicker = document.getElementById("successColorPicker");
    const warningPicker = document.getElementById("warningColorPicker");

    if (primaryPicker) primaryPicker.value = rgbToHex(style.getPropertyValue('--primary-color').trim());
    if (bgPicker) bgPicker.value = rgbToHex(style.getPropertyValue('--bg-primary').trim());
    if (successPicker) successPicker.value = rgbToHex(style.getPropertyValue('--success-color').trim());
    if (warningPicker) warningPicker.value = rgbToHex(style.getPropertyValue('--warning-color').trim());
  }

  function rgbToHex(color) {
    // Handle hex colors that are already in correct format
    if (color.startsWith('#')) return color;
    
    // Handle rgb colors
    const rgb = color.match(/\d+/g);
    if (rgb) {
      return '#' + rgb.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for named colors or other formats
    return '#0078d4';
  }
});