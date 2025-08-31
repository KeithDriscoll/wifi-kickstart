// Dashboard JavaScript - CSP Fixed with proper event listeners
let dashboardData = {
  latencyHistory: [],
  speedHistory: [],
  jitterHistory: [],
  scoreHistory: [],
  timestamps: []
};

let charts = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard loading...');
  
  // Check if we're in extension context
  if (typeof chrome === 'undefined') {
    console.error('Chrome extension APIs not available');
    showExtensionNotAvailable();
    return;
  }
  
  console.log('Extension context detected');
  
  initializeCharts();
  loadNetworkInfo();
  loadDashboardData();
  debugStorageContents();
  setupEventListeners();
  
  // Set up storage listener for real-time updates
  chrome.storage.onChanged.addListener((changes, namespace) => {
    console.log('Storage changed:', changes, namespace);
    if (namespace === 'local' && changes.dashboardData) {
      console.log('Dashboard data updated:', changes.dashboardData.newValue);
      dashboardData = changes.dashboardData.newValue || dashboardData;
      updateAllCharts();
      updateStatusCards();
    }
  });
  
  // Refresh data every 10 seconds
  setInterval(() => {
    console.log('Auto-refreshing dashboard data...');
    loadDashboardData();
  }, 10000);
});

// Setup all event listeners (CSP compliant)
function setupEventListeners() {
  // Dark mode toggle
  document.getElementById('toggleDarkBtn')?.addEventListener('click', toggleDarkMode);
  
  // Debug buttons
  document.getElementById('debugStorageBtn')?.addEventListener('click', debugStorageContents);
  document.getElementById('createTestDataBtn')?.addEventListener('click', createTestData);
  document.getElementById('refreshDataBtn')?.addEventListener('click', refreshData);
  
  // Main control buttons
  document.getElementById('runDiagnosticsBtn')?.addEventListener('click', runDiagnostics);
  document.getElementById('speedTestBtn')?.addEventListener('click', runSpeedTest);
  document.getElementById('clearHistoryBtn')?.addEventListener('click', clearHistory);
}

// Debug function to check all storage contents
function debugStorageContents() {
  chrome.storage.local.get(null, (data) => {
    console.log('=== ALL CHROME STORAGE CONTENTS ===');
    console.log(data);
    console.log('=== END STORAGE CONTENTS ===');
    
    if (data.dashboardData) {
      console.log('Dashboard data found:', data.dashboardData);
      alert(`Dashboard data found!\nLatency points: ${data.dashboardData.latencyHistory?.length || 0}\nSpeed points: ${data.dashboardData.speedHistory?.length || 0}`);
    } else {
      console.log('No dashboardData found in storage');
      alert('No dashboardData found in Chrome storage. Run tests from the extension popup first.');
    }
  });
}

function showExtensionNotAvailable() {
  document.getElementById('currentLatency').textContent = 'Extension Required';
  document.getElementById('currentSpeed').textContent = 'Extension Required';
  document.getElementById('currentJitter').textContent = 'Extension Required';
  document.getElementById('networkScore').textContent = 'Extension Required';
  
  alert('This dashboard requires the Wi-Fi Kickstart extension to be installed and active.');
}

function initializeCharts() {
  console.log('Initializing charts...');
  
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#e0d7f5' : '#333';
  const gridColor = isDark ? '#444' : '#ddd';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor
        }
      }
    },
    scales: {
      x: {
        ticks: { color: textColor },
        grid: { color: gridColor }
      },
      y: {
        ticks: { color: textColor },
        grid: { color: gridColor }
      }
    }
  };

  // Performance Chart (Line)
  charts.performance = new Chart(document.getElementById('performanceChart'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Latency (ms)',
        data: [],
        borderColor: '#0078d4',
        backgroundColor: 'rgba(0, 120, 212, 0.1)',
        tension: 0.3,
        fill: false
      }, {
        label: 'Jitter (ms)',
        data: [],
        borderColor: '#f9a825',
        backgroundColor: 'rgba(249, 168, 37, 0.1)',
        tension: 0.3,
        fill: false
      }]
    },
    options: chartOptions
  });

  // Speed Chart (Bar)
  charts.speed = new Chart(document.getElementById('speedChart'), {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Download Speed (Mbps)',
        data: [],
        backgroundColor: '#28a745',
        borderColor: '#1e7e34',
        borderWidth: 1
      }]
    },
    options: chartOptions
  });

  // Quality Distribution (Doughnut)
  charts.quality = new Chart(document.getElementById('qualityChart'), {
    type: 'doughnut',
    data: {
      labels: ['Excellent (80+)', 'Good (60-79)', 'Fair (40-59)', 'Poor (<40)'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: ['#28a745', '#17a2b8', '#f9a825', '#d93025'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            padding: 15
          }
        }
      }
    }
  });

  // Network Score (Line)
  charts.score = new Chart(document.getElementById('scoreChart'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Network Score',
        data: [],
        borderColor: '#9333ea',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        y: { ...chartOptions.scales.y, min: 0, max: 100 }
      }
    }
  });
  
  console.log('Charts initialized');
}

// Load dashboard data from Chrome storage
function loadDashboardData() {
  console.log('Loading dashboard data...');
  
  chrome.storage.local.get('dashboardData', (data) => {
    console.log('Storage get result:', data);
    
    if (chrome.runtime.lastError) {
      console.error('Storage error:', chrome.runtime.lastError);
      return;
    }
    
    if (data.dashboardData && data.dashboardData.timestamps && data.dashboardData.timestamps.length > 0) {
      console.log('Dashboard data found:', data.dashboardData);
      dashboardData = data.dashboardData;
      updateAllCharts();
      updateStatusCards();
    } else {
      console.log('No dashboard data found or empty data');
      console.log('Data structure:', data.dashboardData);
      updateEmptyState();
    }
  });
}

function updateEmptyState() {
  console.log('Updating empty state...');
  document.getElementById('currentLatency').textContent = 'No Data';
  document.getElementById('currentSpeed').textContent = 'No Data';
  document.getElementById('currentJitter').textContent = 'No Data';
  document.getElementById('networkScore').textContent = 'No Data';
}

function updateAllCharts() {
  console.log('Updating charts with data:', dashboardData);
  
  if (!charts.performance || !dashboardData.timestamps || !dashboardData.timestamps.length) {
    console.log('Charts not ready or no data available');
    return;
  }

  // Update performance chart
  charts.performance.data.labels = dashboardData.timestamps.slice(-20);
  charts.performance.data.datasets[0].data = dashboardData.latencyHistory.slice(-20);
  charts.performance.data.datasets[1].data = dashboardData.jitterHistory.slice(-20);
  charts.performance.update('none');
  console.log('Performance chart updated');

  // Update speed chart
  charts.speed.data.labels = dashboardData.timestamps.slice(-10);
  charts.speed.data.datasets[0].data = dashboardData.speedHistory.slice(-10);
  charts.speed.update('none');
  console.log('Speed chart updated');

  // Update quality distribution
  const scores = dashboardData.scoreHistory.filter(s => s !== null && s !== undefined);
  if (scores.length > 0) {
    const excellent = scores.filter(s => s >= 80).length;
    const good = scores.filter(s => s >= 60 && s < 80).length;
    const fair = scores.filter(s => s >= 40 && s < 60).length;
    const poor = scores.filter(s => s < 40).length;
    
    charts.quality.data.datasets[0].data = [excellent, good, fair, poor];
    charts.quality.update('none');
    console.log('Quality chart updated with distribution:', [excellent, good, fair, poor]);
  }

  // Update score chart
  charts.score.data.labels = dashboardData.timestamps.slice(-20);
  charts.score.data.datasets[0].data = dashboardData.scoreHistory.slice(-20);
  charts.score.update('none');
  console.log('Score chart updated');
}

function updateStatusCards() {
  console.log('Updating status cards...');
  
  const latest = {
    latency: dashboardData.latencyHistory[dashboardData.latencyHistory.length - 1] || '--',
    speed: dashboardData.speedHistory[dashboardData.speedHistory.length - 1] || '--',
    jitter: dashboardData.jitterHistory[dashboardData.jitterHistory.length - 1] || '--',
    score: dashboardData.scoreHistory[dashboardData.scoreHistory.length - 1] || '--'
  };

  console.log('Latest values:', latest);

  document.getElementById('currentLatency').textContent = latest.latency;
  document.getElementById('currentSpeed').textContent = latest.speed;
  document.getElementById('currentJitter').textContent = latest.jitter;
  document.getElementById('networkScore').textContent = latest.score;

  // Update colors based on values
  updateCardColor('currentLatency', latest.latency, [50, 100], ['success', 'warning', 'error']);
  updateCardColor('currentSpeed', latest.speed, [20, 5], ['success', 'warning', 'error'], true);
  updateCardColor('currentJitter', latest.jitter, [30, 100], ['success', 'warning', 'error']);
  updateCardColor('networkScore', latest.score, [70, 40], ['success', 'warning', 'error'], true);
}

function updateCardColor(elementId, value, thresholds, colors, reverse = false) {
  const element = document.getElementById(elementId);
  if (!element || value === '--') return;

  let colorClass;
  if (reverse) {
    if (value >= thresholds[0]) colorClass = colors[0];
    else if (value >= thresholds[1]) colorClass = colors[1];
    else colorClass = colors[2];
  } else {
    if (value <= thresholds[0]) colorClass = colors[0];
    else if (value <= thresholds[1]) colorClass = colors[1];
    else colorClass = colors[2];
  }

  const colorMap = {
    success: 'var(--success-color)',
    warning: 'var(--warning-color)',
    error: 'var(--error-color)'
  };

  element.style.color = colorMap[colorClass];
}

// Test data generation for debugging
function createTestData() {
  console.log('Creating test data...');
  
  const testData = {
    latencyHistory: [45, 52, 38, 61, 47],
    speedHistory: [25.3, 28.1, 22.7, 31.2, 26.8],
    jitterHistory: [12, 18, 9, 25, 14],
    scoreHistory: [85, 78, 92, 65, 81],
    timestamps: ['10:30', '10:31', '10:32', '10:33', '10:34']
  };
  
  chrome.storage.local.set({ dashboardData: testData }, () => {
    console.log('Test data stored');
    loadDashboardData();
  });
}

async function runDiagnostics() {
  const btn = document.getElementById('runDiagnosticsBtn');
  btn.disabled = true;
  btn.textContent = 'Running Diagnostics...';
  
  console.log('Running diagnostics from dashboard...');

  try {
    chrome.runtime.sendMessage({ action: 'runFullDiagnostics' }, (response) => {
      console.log('Diagnostics response:', response);
      
      if (chrome.runtime.lastError) {
        console.error('Extension communication error:', chrome.runtime.lastError);
        btn.textContent = 'Extension Error';
        setTimeout(() => {
          btn.textContent = 'Run Full Diagnostics';
          btn.disabled = false;
        }, 2000);
        return;
      }
      
      if (response && response.success) {
        console.log('Diagnostics successful, reloading data...');
        setTimeout(() => loadDashboardData(), 1000);
      } else {
        console.log('Diagnostics failed:', response);
      }
      
      btn.textContent = 'Run Full Diagnostics';
      btn.disabled = false;
    });
  } catch (error) {
    console.error('Diagnostics failed:', error);
    btn.textContent = 'Error';
    setTimeout(() => {
      btn.textContent = 'Run Full Diagnostics';
      btn.disabled = false;
    }, 2000);
  }
}

async function runSpeedTest() {
  const btn = document.getElementById('speedTestBtn');
  btn.disabled = true;
  btn.textContent = 'Testing Speed...';
  
  console.log('Running speed test from dashboard...');

  try {
    chrome.runtime.sendMessage({ action: 'runSpeedTest' }, (response) => {
      console.log('Speed test response:', response);
      
      if (chrome.runtime.lastError) {
        console.error('Extension communication error:', chrome.runtime.lastError);
        btn.textContent = 'Extension Error';
        setTimeout(() => {
          btn.textContent = 'Speed Test Only';
          btn.disabled = false;
        }, 2000);
        return;
      }
      
      if (response && response.success) {
        console.log('Speed test successful, reloading data...');
        setTimeout(() => loadDashboardData(), 1000);
      }
      
      btn.textContent = 'Speed Test Only';
      btn.disabled = false;
    });
  } catch (error) {
    console.error('Speed test failed:', error);
    btn.textContent = 'Error';
    setTimeout(() => {
      btn.textContent = 'Speed Test Only';
      btn.disabled = false;
    }, 2000);
  }
}

function clearHistory() {
  console.log('Clearing dashboard history...');
  
  dashboardData = {
    latencyHistory: [],
    speedHistory: [],
    jitterHistory: [],
    scoreHistory: [],
    timestamps: []
  };
  
  chrome.storage.local.set({ dashboardData: dashboardData }, () => {
    console.log('History cleared from storage');
    updateAllCharts();
    updateStatusCards();
  });
}

function refreshData() {
  console.log('Manual refresh triggered...');
  debugStorageContents();
  loadDashboardData();
  loadNetworkInfo();
}

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  updateChartColors();
  
  const isDark = document.documentElement.classList.contains('dark');
  chrome.storage.local.set({ dashboardDarkMode: isDark });
}

function updateChartColors() {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#e0d7f5' : '#333';
  const gridColor = isDark ? '#444' : '#ddd';
  
  Object.values(charts).forEach(chart => {
    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = textColor;
    }
    if (chart.options.scales?.x?.ticks) {
      chart.options.scales.x.ticks.color = textColor;
      chart.options.scales.x.grid.color = gridColor;
    }
    if (chart.options.scales?.y?.ticks) {
      chart.options.scales.y.ticks.color = textColor;
      chart.options.scales.y.grid.color = gridColor;
    }
    chart.update('none');
  });
}

async function loadNetworkInfo() {
  console.log('Loading network info...');
  
  try {
    const response = await fetch('https://ipinfo.io/json');
    const data = await response.json();
    
    console.log('Network info loaded:', data);
    
    document.getElementById('ipAddress').textContent = data.ip || 'Unknown';
    document.getElementById('location').textContent = `${data.city || '?'}, ${data.region || '?'}`;
    document.getElementById('provider').textContent = data.org ? data.org.split(' ').slice(1).join(' ') : 'Unknown';
    
    // Check WARP status
    try {
      const warpResponse = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
      const warpText = await warpResponse.text();
      const warpMatch = warpText.match(/warp=(\w+)/);
      const isWarpActive = warpMatch && warpMatch[1] === 'on';
      
      const warpElement = document.getElementById('warpStatus');
      warpElement.textContent = isWarpActive ? 'Active 🔒' : 'Inactive';
      warpElement.style.color = isWarpActive ? 'var(--success-color)' : 'var(--text-secondary)';
      
      console.log('WARP status:', isWarpActive ? 'Active' : 'Inactive');
    } catch (e) {
      console.log('WARP check failed:', e);
      document.getElementById('warpStatus').textContent = 'Unknown';
    }
    
  } catch (error) {
    console.error('Failed to load network info:', error);
    document.getElementById('ipAddress').textContent = 'Failed to load';
    document.getElementById('location').textContent = 'Unknown';
    document.getElementById('provider').textContent = 'Unknown';
    document.getElementById('warpStatus').textContent = 'Unknown';
  }
}