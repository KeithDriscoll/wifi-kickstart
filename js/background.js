// 🔥 ENHANCED BACKGROUND SCRIPT WITH EPIC CAPABILITIES
// Handles all network testing requests with consolidated engine

const TEST_URL = "https://www.google.com/generate_204";
const FALLBACK_URL = "http://neverssl.com";
let captiveTabId = null;
let failureCount = 0;

// Enhanced message listener with EPIC support
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  // Existing connection check
  if (message.action === "checkConnection") {
    checkConnection(true, (result) => {
      sendResponse(result);
    });
    return true;
  }
  
  // Network info request
  if (message.action === "getNetworkInfo") {
    console.log('Getting network info for dashboard...');
    getNetworkInfoForDashboard().then(data => {
      console.log('Network info retrieved:', data);
      sendResponse({ success: true, data: data });
    }).catch(error => {
      console.error('Network info error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  // 🔥 EPIC SPEED TEST REQUESTS
  if (message.action === "runBasicSpeedTest") {
    console.log('🚀 Running basic speed test...');
    runEnhancedSpeedTest('basic').then(results => {
      console.log('Basic speed test completed:', results);
      sendResponse({ success: true, data: results });
    }).catch(error => {
      console.error('Basic speed test failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (message.action === "runQuickEpicTest") {
    console.log('⚡ Running quick epic test...');
    runEnhancedSpeedTest('quick_epic').then(results => {
      console.log('Quick epic test completed:', results);
      sendResponse({ success: true, data: results });
    }).catch(error => {
      console.error('Quick epic test failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (message.action === "runEpicAnalysis") {
    console.log('🔥 Running FULL EPIC analysis...');
    runEnhancedSpeedTest('full_epic', message.config).then(results => {
      console.log('🎯 EPIC analysis completed:', results);
      sendResponse({ success: true, data: results });
    }).catch(error => {
      console.error('🔥 EPIC analysis failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (message.action === "runGamingTest") {
    console.log('🎮 Running gaming test...');
    runEnhancedSpeedTest('gaming').then(results => {
      console.log('Gaming test completed:', results);
      sendResponse({ success: true, data: results });
    }).catch(error => {
      console.error('Gaming test failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  // Legacy support for existing diagnostics
  if (message.action === "runFullDiagnostics") {
    console.log('Running full diagnostics (legacy)...');
    runLegacyDiagnostics().then(results => {
      console.log('Legacy diagnostics completed:', results);
      sendResponse({ success: true, data: results });
    }).catch(error => {
      console.error('Legacy diagnostics failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// 🚀 ENHANCED SPEED TEST RUNNER
async function runEnhancedSpeedTest(testType = 'basic', customConfig = null) {
  console.log(`Starting ${testType} speed test...`);
  
  try {
    // Dynamic import of the enhanced engine
    const { EnhancedSpeedTestEngine } = await import('./modules/speedTest/EnhancedSpeedTestEngine.js');
    const engine = new EnhancedSpeedTestEngine();
    
    let results;
    
    // Run the appropriate test type
    switch (testType) {
      case 'basic':
        results = await engine.runBasicSpeedTest();
        break;
      case 'quick_epic':
        results = await engine.runQuickEpicTest();
        break;
      case 'full_epic':
        results = await engine.runFullEpicAnalysis(customConfig);
        break;
      case 'gaming':
        results = await engine.runGamingTest();
        break;
      default:
        throw new Error(`Unknown test type: ${testType}`);
    }
    
    // Store results for dashboard
    await storeSpeedTestResults(results);
    
    return results;
    
  } catch (error) {
    console.error(`${testType} speed test failed:`, error);
    throw error;
  }
}

// 🗄️ RESULTS STORAGE
async function storeSpeedTestResults(results) {
  try {
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Get existing results
    const stored = await chrome.storage.local.get(['speedTestHistory', 'dashboardData']);
    
    // Update speed test history
    const history = stored.speedTestHistory || [];
    history.push({
      ...results,
      timestamp: timestamp
    });
    
    // Keep only last 50 tests
    const trimmedHistory = history.slice(-50);
    
    // Update dashboard data for charts
    let dashboardData = stored.dashboardData || {
      latencyHistory: [],
      speedHistory: [],
      jitterHistory: [],
      scoreHistory: [],
      timestamps: []
    };
    
    // Extract metrics for dashboard
    const speed = results.results?.download?.speed || results.results?.download?.summary?.averageSpeed || null;
    const latency = results.results?.latency?.average || results.results?.latency?.summary?.average || null;
    const jitter = results.results?.jitter?.standardDeviation || null;
    const score = results.networkScore || null;
    
    // Add to dashboard data
    dashboardData.timestamps.push(timestamp);
    dashboardData.speedHistory.push(speed);
    dashboardData.latencyHistory.push(latency);
    dashboardData.jitterHistory.push(jitter);
    dashboardData.scoreHistory.push(score);
    
    // Keep arrays aligned and limit size
    const maxEntries = 50;
    Object.keys(dashboardData).forEach(key => {
      if (dashboardData[key].length > maxEntries) {
        dashboardData[key] = dashboardData[key].slice(-maxEntries);
      }
    });
    
    // Store everything
    await chrome.storage.local.set({ 
      speedTestHistory: trimmedHistory,
      dashboardData: dashboardData,
      lastSpeedTest: results
    });
    
    console.log('Speed test results stored successfully');
  } catch (error) {
    console.error('Failed to store speed test results:', error);
  }
}

// 🔄 LEGACY SUPPORT - Keep existing functions working
async function runLegacyDiagnostics() {
  console.log('Starting legacy diagnostics...');
  const results = {};
  const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  try {
    // Measure latency
    console.log('Measuring latency...');
    const latencyResult = await measureLatency();
    if (latencyResult.success) {
      results.latency = latencyResult.latency;
      console.log('Latency:', results.latency);
    }
    
    // Measure jitter
    console.log('Measuring jitter...');
    const jitterResult = await measureJitter();
    if (jitterResult.success) {
      results.jitter = jitterResult.jitter;
      console.log('Jitter:', results.jitter);
    }
    
    // Run speed test
    console.log('Running speed test...');
    const speedResult = await runBasicSpeedTest();
    if (speedResult.success) {
      results.speed = speedResult.speed;
      console.log('Speed:', results.speed);
    }
    
    // Calculate network score
    if (results.latency && results.jitter && results.speed) {
      results.score = calculateNetworkScore(results);
      console.log('Score:', results.score);
    }
    
    // Store results for dashboard
    await storeDashboardData(results, timestamp);
    
    // Store provider info
    await storeProviderInfo();
    
    return results;
  } catch (error) {
    console.error('Full diagnostics failed:', error);
    throw error;
  }
}

// Legacy basic speed test
async function runBasicSpeedTest() {
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

// Legacy latency measurement
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

// Legacy jitter measurement
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

// Legacy network score calculation
function calculateNetworkScore(data) {
  let score = 100;
  if (data.latency > 100) score -= 20;
  if (data.jitter > 100) score -= 30;
  if (data.speed < 5) score -= 40;
  else if (data.speed < 20) score -= 20;
  return Math.max(0, score);
}

// Legacy dashboard data storage
async function storeDashboardData(results, timestamp) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['dashboardData', 'providerHistory'], (storage) => {
      let dashboardData = storage.dashboardData || {
        latencyHistory: [],
        speedHistory: [],
        jitterHistory: [],
        scoreHistory: [],
        timestamps: []
      };
      
      console.log('Current dashboard data:', dashboardData);
      
      // Add new data point
      dashboardData.timestamps.push(timestamp);
      
      // Fill with null if not provided to keep arrays aligned
      dashboardData.latencyHistory.push(results.latency || null);
      dashboardData.speedHistory.push(results.speed || null);
      dashboardData.jitterHistory.push(results.jitter || null);
      dashboardData.scoreHistory.push(results.score || null);

      // Keep only recent entries
      const maxEntries = 50;
      Object.keys(dashboardData).forEach(key => {
        if (dashboardData[key].length > maxEntries) {
          dashboardData[key] = dashboardData[key].slice(-maxEntries);
        }
      });

      chrome.storage.local.set({ dashboardData }, () => {
        console.log('Dashboard data stored:', dashboardData);
        resolve();
      });
    });
  });
}

// Network info for dashboard
async function getNetworkInfoForDashboard() {
  try {
    const response = await fetch("https://ipinfo.io/json");
    const data = await response.json();
    
    // Check WARP status
    let warpActive = false;
    try {
      const warpResponse = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
      const warpText = await warpResponse.text();
      const warpMatch = warpText.match(/warp=(\w+)/);
      warpActive = warpMatch && warpMatch[1] === "on";
    } catch (error) {
      console.log('WARP check failed:', error);
    }
    
    // Basic VPN detection
    const org = (data.org || '').toLowerCase();
    const vpnKeywords = ['vpn', 'proxy', 'hosting', 'server', 'datacenter', 'cloud'];
    const vpnActive = vpnKeywords.some(keyword => org.includes(keyword));
    
    return {
      ip: data.ip,
      location: `${data.city || 'Unknown'}, ${data.region || 'Unknown'}`,
      provider: data.org ? data.org.split(" ").slice(1).join(" ") : 'Unknown',
      warpActive: warpActive,
      vpnActive: vpnActive
    };
  } catch (error) {
    console.error('Failed to get network info:', error);
    throw error;
  }
}

// Store provider info
async function storeProviderInfo() {
  try {
    const networkInfo = await getNetworkInfoForDashboard();
    
    chrome.storage.local.get(['providerHistory'], (storage) => {
      let providerHistory = storage.providerHistory || [];
      
      // Check if this provider already exists today
      const today = new Date().toDateString();
      const existingIndex = providerHistory.findIndex(entry => 
        entry.provider === networkInfo.provider && 
        new Date(entry.date).toDateString() === today
      );
      
      if (existingIndex >= 0) {
        // Update existing entry
        providerHistory[existingIndex].count++;
        providerHistory[existingIndex].lastSeen = new Date().toISOString();
      } else {
        // Add new entry
        providerHistory.push({
          provider: networkInfo.provider,
          location: networkInfo.location,
          count: 1,
          date: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        });
      }
      
      // Keep only last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      providerHistory = providerHistory.filter(entry => 
        new Date(entry.date) > thirtyDaysAgo
      );
      
      chrome.storage.local.set({ providerHistory });
    });
  } catch (error) {
    console.error('Failed to store provider info:', error);
  }
}

// Connection check (existing functionality)
function checkConnection(openFallback, callback) {
  console.log('Checking connection...');
  
  fetch(TEST_URL, { method: "HEAD", mode: "no-cors" })
    .then(() => {
      console.log('Connection check successful');
      callback({ 
        status: "connected", 
        message: "Connection is working properly" 
      });
    })
    .catch(() => {
      console.log('Connection check failed, possible captive portal');
      failureCount++;
      
      if (openFallback) {
        openCaptivePortalTab();
      }
      
      callback({ 
        status: "captive", 
        message: "Captive portal detected - opening login page",
        failureCount: failureCount
      });
    });
}

// Open captive portal tab
function openCaptivePortalTab() {
  if (captiveTabId) {
    chrome.tabs.get(captiveTabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        createNewCaptiveTab();
      } else {
        chrome.tabs.update(captiveTabId, { 
          active: true, 
          url: FALLBACK_URL 
        });
      }
    });
  } else {
    createNewCaptiveTab();
  }
}

function createNewCaptiveTab() {
  chrome.tabs.create({ 
    url: FALLBACK_URL,
    active: true
  }, (tab) => {
    captiveTabId = tab.id;
    console.log('Created captive portal tab:', tab.id);
  });
}

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === captiveTabId) {
    captiveTabId = null;
    console.log('Captive portal tab closed');
  }
});

// Initialize
console.log('🔥 Enhanced Wi-Fi Kickstart background script loaded with EPIC capabilities!');