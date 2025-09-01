// Dashboard JavaScript - Cleaned up and enhanced
let dashboardData = {
  latencyHistory: [],
  speedHistory: [],
  jitterHistory: [],
  scoreHistory: [],
  timestamps: [],
  providerHistory: []
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
  
  // Main control buttons
  document.getElementById('runDiagnosticsBtn')?.addEventListener('click', runDiagnostics);
  document.getElementById('speedTestBtn')?.addEventListener('click', runSpeedTest);
  document.getElementById('clearHistoryBtn')?.addEventListener('click', clearHistory);
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

  // Network Providers (Polar Area)
  charts.provider = new Chart(document.getElementById('providerChart'), {
    type: 'polarArea',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#0078d4',
          '#28a745', 
          '#f9a825',
          '#d93025',
          '#9333ea',
          '#17a2b8'
        ],
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
            padding: 10,
            font: {
              size: 11
            }
          }
        }
      },
      scales: {
        r: {
          ticks: {
            color: textColor,
            backdropColor: 'transparent'
          },
          grid: {
            color: gridColor
          },
          pointLabels: {
            color: textColor
          }
        }
      }
    }
  });

  // Performance Distribution (Radar)
  charts.performanceDist = new Chart(document.getElementById('performanceDistChart'), {
    type: 'radar',
    data: {
      labels: ['Speed Score', 'Latency Score', 'Jitter Score', 'Overall Score', 'Consistency Score'],
      datasets: [{
        label: 'Current Session',
        data: [0, 0, 0, 0, 0],
        borderColor: '#0078d4',
        backgroundColor: 'rgba(0, 120, 212, 0.2)',
        pointBackgroundColor: '#0078d4',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#0078d4'
      }]
    },
    options: {
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
        r: {
          min: 0,
          max: 100,
          ticks: {
            color: textColor,
            backdropColor: 'transparent'
          },
          grid: {
            color: gridColor
          },
          pointLabels: {
            color: textColor,
            font: {
              size: 11
            }
          }
        }
      }
    }
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

  // Update speed chart
  charts.speed.data.labels = dashboardData.timestamps.slice(-10);
  charts.speed.data.datasets[0].data = dashboardData.speedHistory.slice(-10);
  charts.speed.update('none');

  // Update provider chart
  updateProviderChart();

  // Update performance distribution radar
  updatePerformanceDistribution();

  // Update quality distribution
  const scores = dashboardData.scoreHistory.filter(s => s !== null && s !== undefined);
  if (scores.length > 0) {
    const excellent = scores.filter(s => s >= 80).length;
    const good = scores.filter(s => s >= 60 && s < 80).length;
    const fair = scores.filter(s => s >= 40 && s < 60).length;
    const poor = scores.filter(s => s < 40).length;
    
    charts.quality.data.datasets[0].data = [excellent, good, fair, poor];
    charts.quality.update('none');
  }

  // Update score chart
  charts.score.data.labels = dashboardData.timestamps.slice(-20);
  charts.score.data.datasets[0].data = dashboardData.scoreHistory.slice(-20);
  charts.score.update('none');
}

function updateProviderChart() {
  // Get provider data from storage
  chrome.storage.local.get('providerHistory', (data) => {
    const providers = data.providerHistory || [];
    
    if (providers.length === 0) {
      // Show placeholder data
      charts.provider.data.labels = ['No Data Available'];
      charts.provider.data.datasets[0].data = [1];
      charts.provider.data.datasets[0].backgroundColor = ['#666'];
    } else {
      // Count provider occurrences
      const providerCounts = {};
      providers.forEach(provider => {
        const name = provider.split(' ')[0] || 'Unknown'; // Get first word
        providerCounts[name] = (providerCounts[name] || 0) + 1;
      });
      
      charts.provider.data.labels = Object.keys(providerCounts);
      charts.provider.data.datasets[0].data = Object.values(providerCounts);
    }
    
    charts.provider.update('none');
  });
}

function updatePerformanceDistribution() {
  const latestData = {
    speed: dashboardData.speedHistory[dashboardData.speedHistory.length - 1],
    latency: dashboardData.latencyHistory[dashboardData.latencyHistory.length - 1],
    jitter: dashboardData.jitterHistory[dashboardData.jitterHistory.length - 1],
    score: dashboardData.scoreHistory[dashboardData.scoreHistory.length - 1]
  };

  // Calculate scores out of 100
  const speedScore = latestData.speed ? Math.min(100, (latestData.speed / 50) * 100) : 0;
  const latencyScore = latestData.latency ? Math.max(0, 100 - (latestData.latency / 2)) : 0;
  const jitterScore = latestData.jitter ? Math.max(0, 100 - latestData.jitter) : 0;
  const overallScore = latestData.score || 0;
  
  // Calculate consistency score based on variance
  const consistencyScore = calculateConsistencyScore();

  charts.performanceDist.data.datasets[0].data = [
    speedScore,
    latencyScore, 
    jitterScore,
    overallScore,
    consistencyScore
  ];
  
  charts.performanceDist.update('none');
}

function calculateConsistencyScore() {
  if (dashboardData.scoreHistory.length < 3) return 0;
  
  const recentScores = dashboardData.scoreHistory.slice(-10).filter(s => s !== null);
  if (recentScores.length < 3) return 0;
  
  const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const variance = recentScores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / recentScores.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower standard deviation = higher consistency score
  return Math.max(0, 100 - (stdDev * 2));
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
    timestamps: [],
    providerHistory: []
  };
  
  chrome.storage.local.set({ 
    dashboardData: dashboardData,
    providerHistory: []
  }, () => {
    console.log('History cleared from storage');
    updateAllCharts();
    updateStatusCards();
  });
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
    if (chart.options.scales?.r?.ticks) {
      chart.options.scales.r.ticks.color = textColor;
      chart.options.scales.r.grid.color = gridColor;
      chart.options.scales.r.pointLabels.color = textColor;
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
    
    const provider = data.org ? data.org.split(' ').slice(1).join(' ') : 'Unknown';
    document.getElementById('provider').textContent = provider;
    
    // Store provider for chart
    if (provider !== 'Unknown') {
      chrome.storage.local.get('providerHistory', (storage) => {
        const providers = storage.providerHistory || [];
        providers.push(provider);
        // Keep only recent 50 entries
        const recentProviders = providers.slice(-50);
        chrome.storage.local.set({ providerHistory: recentProviders });
      });
    }
    
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