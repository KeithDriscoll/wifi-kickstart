// Dashboard JavaScript - Connected to Extension Data
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
  initializeCharts();
  loadNetworkInfo();
  loadDashboardData();
  
  // Refresh data every 5 seconds
  setInterval(loadDashboardData, 5000);
});

function initializeCharts() {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
        }
      }
    },
    scales: {
      x: {
        ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
        grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') }
      },
      y: {
        ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
        grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') }
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
        tension: 0.3
      }, {
        label: 'Jitter (ms)',
        data: [],
        borderColor: '#f9a825',
        backgroundColor: 'rgba(249, 168, 37, 0.1)',
        tension: 0.3
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
      labels: ['Excellent', 'Good', 'Fair', 'Poor'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: ['#28a745', '#17a2b8', '#f9a825', '#d93025']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
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
}

// Load dashboard data from Chrome storage
function loadDashboardData() {
  chrome.storage.local.get('dashboardData', (data) => {
    if (data.dashboardData) {
      dashboardData = data.dashboardData;
      updateAllCharts();
      updateStatusCards();
    } else {
      // If no data exists, generate some sample data
      generateSampleData();
    }
  });
}

function generateSampleData() {
  // Generate sample data only if no real data exists
  const now = new Date();
  for (let i = 19; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60000);
    const timeLabel = timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    dashboardData.timestamps.push(timeLabel);
    dashboardData.latencyHistory.push(Math.floor(Math.random() * 100) + 20);
    dashboardData.jitterHistory.push(Math.floor(Math.random() * 50) + 5);
    dashboardData.speedHistory.push(Math.floor(Math.random() * 80) + 10);
    dashboardData.scoreHistory.push(Math.floor(Math.random() * 40) + 60);
  }
  
  updateAllCharts();
  updateStatusCards();
}

function updateAllCharts() {
  if (!charts.performance) return;

  // Update performance chart
  charts.performance.data.labels = dashboardData.timestamps.slice(-20);
  charts.performance.data.datasets[0].data = dashboardData.latencyHistory.slice(-20);
  charts.performance.data.datasets[1].data = dashboardData.jitterHistory.slice(-20);
  charts.performance.update('none');

  // Update speed chart
  charts.speed.data.labels = dashboardData.timestamps.slice(-10);
  charts.speed.data.datasets[0].data = dashboardData.speedHistory.slice(-10);
  charts.speed.update('none');

  // Update quality distribution
  const scores = dashboardData.scoreHistory;
  const excellent = scores.filter(s => s >= 80).length;
  const good = scores.filter(s => s >= 60 && s < 80).length;
  const fair = scores.filter(s => s >= 40 && s < 60).length;
  const poor = scores.filter(s => s < 40).length;
  
  charts.quality.data.datasets[0].data = [excellent, good, fair, poor];
  charts.quality.update('none');

  // Update score chart
  charts.score.data.labels = dashboardData.timestamps.slice(-20);
  charts.score.data.datasets[0].data = dashboardData.scoreHistory.slice(-20);
  charts.score.update('none');
}

function updateStatusCards() {
  const latest = {
    latency: dashboardData.latencyHistory[dashboardData.latencyHistory.length - 1] || '--',
    speed: dashboardData.speedHistory[dashboardData.speedHistory.length - 1] || '--',
    jitter: dashboardData.jitterHistory[dashboardData.jitterHistory.length - 1] || '--',
    score: dashboardData.scoreHistory[dashboardData.scoreHistory.length - 1] || '--'
  };

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

  try {
    // Send message to extension background to run diagnostics
    chrome.runtime.sendMessage({ action: 'runFullDiagnostics' }, (response) => {
      if (response && response.success) {
        // Data will be updated via storage listener
        loadDashboardData();
      }
      btn.textContent = 'Run Full Diagnostics';
      btn.disabled = false;
    });
  } catch (error) {
    console.error('Diagnostics failed:', error);
    btn.textContent = 'Try Again';
    btn.disabled = false;
  }
}

async function runSpeedTest() {
  const btn = document.getElementById('speedTestBtn');
  btn.disabled = true;
  btn.textContent = 'Testing Speed...';

  try {
    // Send message to extension to run speed test
    chrome.runtime.sendMessage({ action: 'runSpeedTest' }, (response) => {
      if (response && response.success) {
        loadDashboardData();
      }
      btn.textContent = 'Speed Test Only';
      btn.disabled = false;
    });
  } catch (error) {
    console.error('Speed test failed:', error);
    btn.textContent = 'Try Again';
    btn.disabled = false;
  }
}

function clearHistory() {
  dashboardData = {
    latencyHistory: [],
    speedHistory: [],
    jitterHistory: [],
    scoreHistory: [],
    timestamps: []
  };
  chrome.storage.local.set({ dashboardData: dashboardData });
  updateAllCharts();
  updateStatusCards();
}

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  
  // Update chart colors
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
  const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
  
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
  try {
    // Get network info from extension storage or API calls
    const response = await fetch('https://ipinfo.io/json');
    const data = await response.json();
    
    document.getElementById('ipAddress').textContent = data.ip || 'Unknown';
    document.getElementById('location').textContent = `${data.city || '?'}, ${data.region || '?'}`;
    document.getElementById('provider').textContent = data.org ? data.org.split(' ').slice(1).join(' ') : 'Unknown';
    
    // Check WARP status
    try {
      const warpResponse = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
      const warpText = await warpResponse.text();
      const warpMatch = warpText.match(/warp=(\w+)/);
      const isWarpActive = warpMatch && warpMatch[1] === 'on';
      
      document.getElementById('warpStatus').textContent = isWarpActive ? 'Active 🔒' : 'Inactive';
      document.getElementById('warpStatus').style.color = isWarpActive ? 'var(--success-color)' : 'var(--text-secondary)';
    } catch (e) {
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