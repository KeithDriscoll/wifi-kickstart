const TEST_URL = "https://www.google.com/generate_204";
const FALLBACK_URL = "http://neverssl.com";
let captiveTabId = null;
let failureCount = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkConnection") {
    checkConnection(true, (result) => {
      sendResponse(result);
    });
    return true; // keep the message channel open for async response
  }
  
  // Handle dashboard diagnostics request
  if (message.action === "runFullDiagnostics") {
    runFullDiagnostics().then(results => {
      sendResponse({ success: true, data: results });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  // Handle dashboard speed test request
  if (message.action === "runSpeedTest") {
    runSpeedTestOnly().then(results => {
      sendResponse({ success: true, data: results });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// Full diagnostics function for dashboard
async function runFullDiagnostics() {
  const results = {};
  const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  try {
    // Measure latency
    const latencyResult = await measureLatency();
    if (latencyResult.success) results.latency = latencyResult.latency;
    
    // Measure jitter
    const jitterResult = await measureJitter();
    if (jitterResult.success) results.jitter = jitterResult.jitter;
    
    // Run speed test
    const speedResult = await runSpeedTest();
    if (speedResult.success) results.speed = speedResult.speed;
    
    // Calculate network score
    if (results.latency && results.jitter && results.speed) {
      results.score = calculateNetworkScore(results);
    }
    
    // Store results for dashboard
    storeDashboardData(results, timestamp);
    
    return results;
  } catch (error) {
    console.error('Full diagnostics failed:', error);
    throw error;
  }
}

// Speed test only function
async function runSpeedTestOnly() {
  const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  try {
    const speedResult = await runSpeedTest();
    
    if (speedResult.success) {
      const results = { speed: speedResult.speed };
      storeDashboardData(results, timestamp);
      return results;
    } else {
      throw new Error('Speed test failed');
    }
  } catch (error) {
    console.error('Speed test failed:', error);
    throw error;
  }
}

// Measure latency
async function measureLatency() {
  const start = performance.now();
  try {
    await fetch(TEST_URL, { method: "GET", mode: "no-cors" });
    const latency = Math.round(performance.now() - start);
    return { latency, success: true };
  } catch (error) {
    return { latency: null, success: false };
  }
}

// Measure jitter
async function measureJitter(samples = 5) {
  const times = [];
  
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    try {
      await fetch(TEST_URL, { method: "GET", mode: "no-cors" });
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
  
  return { jitter, success: true };
}

// Run speed test
async function runSpeedTest() {
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
    
    return { speed, success: true };
  } catch (error) {
    return { speed: null, success: false };
  }
}

// Calculate network score
function calculateNetworkScore(data) {
  let score = 100;
  if (data.latency > 100) score -= 20;
  if (data.jitter > 100) score -= 30;
  if (data.speed < 5) score -= 40;
  else if (data.speed < 20) score -= 20;
  return Math.max(0, score);
}

// Store dashboard data
function storeDashboardData(results, timestamp) {
  chrome.storage.local.get('dashboardData', (data) => {
    let dashboardData = data.dashboardData || {
      latencyHistory: [],
      speedHistory: [],
      jitterHistory: [],
      scoreHistory: [],
      timestamps: []
    };
    
    // Add new data point
    dashboardData.timestamps.push(timestamp);
    
    if (results.latency !== undefined) {
      dashboardData.latencyHistory.push(results.latency);
    }
    if (results.jitter !== undefined) {
      dashboardData.jitterHistory.push(results.jitter);
    }
    if (results.speed !== undefined) {
      dashboardData.speedHistory.push(results.speed);
    }
    if (results.score !== undefined) {
      dashboardData.scoreHistory.push(results.score);
    }
    
    // Keep only recent entries (max 50)
    const maxEntries = 50;
    Object.keys(dashboardData).forEach(key => {
      if (dashboardData[key].length > maxEntries) {
        dashboardData[key] = dashboardData[key].slice(-maxEntries);
      }
    });
    
    // Save to storage
    chrome.storage.local.set({ dashboardData: dashboardData });
  });
}

function findExistingFallbackTab(callback) {
  chrome.tabs.query({}, (tabs) => {
    const match = tabs.find(tab => tab.url && tab.url.includes("neverssl.com"));
    callback(match);
  });
}

function openOrRefreshFallbackTab() {
  findExistingFallbackTab((existingTab) => {
    if (existingTab) {
      captiveTabId = existingTab.id;
      chrome.tabs.update(captiveTabId, { url: existingTab.url, active: true });
    } else {
      chrome.tabs.create({ url: FALLBACK_URL }, (tab) => {
        captiveTabId = tab.id;
      });
    }
  });
}

function logFailure() {
  const timestamp = new Date().toISOString();
  chrome.storage.local.get({ failures: [] }, (data) => {
    const failures = Array.isArray(data.failures) ? data.failures : [];
    const updated = [...failures, timestamp];
    chrome.storage.local.set({ failures: updated });
  });
}

function handleOnlineState() {
  chrome.action.setIcon({ path: "icons/icon16.png" });
  chrome.action.setTitle({ title: "Online ✅" });
  chrome.action.setBadgeText({ text: "✓" });
  chrome.action.setBadgeBackgroundColor({ color: "#28a745" });
  captiveTabId = null;
  failureCount = 0;
  chrome.storage.local.set({ fallbackTabOpened: false });
}

function handleOfflineState() {
  chrome.action.setIcon({ path: "icons/icon48.png" });
  chrome.action.setTitle({ title: "Offline ❌" });
  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#d93025" });
  logFailure();
  failureCount++;

  chrome.storage.local.get({ fallbackTabOpened: false }, (data) => {
    if (!data.fallbackTabOpened) {
      findExistingFallbackTab((existingTab) => {
        if (!existingTab) {
          openOrRefreshFallbackTab();
        } else {
          captiveTabId = existingTab.id;
          chrome.tabs.update(captiveTabId, { url: existingTab.url, active: true });
        }
        chrome.storage.local.set({ fallbackTabOpened: true });
      });
    }
  });
}

function checkConnection(triggeredByClick = false, callback = null) {
  fetch(TEST_URL, { method: "GET", mode: "no-cors" })
    .then(() => {
      handleOnlineState();
      if (callback) callback({ status: "online" });
    })
    .catch(() => {
      handleOfflineState();
      if (callback) callback({ status: "offline" });
    });
}

// Toolbar icon click will trigger immediate check
chrome.action.onClicked.addListener(() => {
  checkConnection(true);
});

// Auto-check connection every 5 seconds
setInterval(() => checkConnection(false), 5000);