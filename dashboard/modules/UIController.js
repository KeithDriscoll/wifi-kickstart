/**
 * UI Controller with Theme Sync
 * Handles all UI interactions and updates with popup theme synchronization
 */

class UIController {
  constructor(state, chartManager) {
    this.state = state;
    this.chartManager = chartManager;
    this.notificationTimeout = null;
    this.themeManager = null;
    this.setupEventListeners();
    this.initializeDashboardThemes();
  }
  
  setupEventListeners() {
    // Dark mode toggle
    document.getElementById('toggleDarkBtn')?.addEventListener('click', () => this.toggleDarkMode());
    
    // Control buttons
    document.getElementById('runDiagnosticsBtn')?.addEventListener('click', () => this.runDiagnostics());
    document.getElementById('speedTestBtn')?.addEventListener('click', () => this.runSpeedTest());
    document.getElementById('clearHistoryBtn')?.addEventListener('click', () => this.clearHistory());
    
    // Chart action buttons
    document.querySelectorAll('.chart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleChartAction(e));
    });
    
    // Export data link
    document.getElementById('exportData')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.exportData();
    });
  }
  
  initializeDashboardThemes() {
    // Load theme manager for dashboard
    if (typeof chrome !== 'undefined' && chrome.storage) {
      // Listen for theme changes from popup
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
          if (changes.darkModeEnabled || changes.customTheme || changes.currentThemeName) {
            console.log('Theme updated in dashboard from popup');
            this.applyThemeFromStorage();
            
            // Update chart colors if needed
            if (this.chartManager) {
              this.chartManager.chartConfig = this.chartManager.getChartConfig();
              this.chartManager.updateAllCharts();
            }
          }
        }
      });
      
      // Apply initial theme from storage
      this.applyThemeFromStorage();
    }
    
    // Set up dashboard dark mode toggle to sync with popup
    this.initializeDarkModeSync();
  }
  
  initializeDarkModeSync() {
    const darkToggle = document.getElementById('toggleDarkBtn');
    if (!darkToggle) return;
    
    // Load initial state from storage
    chrome.storage.local.get('darkModeEnabled', (data) => {
      const isDark = data.darkModeEnabled ?? false;
      this.updateDarkModeUI(isDark);
    });
    
    // Handle dashboard dark mode toggle
    darkToggle.addEventListener('click', () => {
      chrome.storage.local.get('darkModeEnabled', (data) => {
        const currentState = data.darkModeEnabled ?? false;
        const newState = !currentState;
        
        // Save to storage (this will trigger the storage listener)
        chrome.storage.local.set({ darkModeEnabled: newState });
        
        // Apply immediately to dashboard
        this.updateDarkModeUI(newState);
        
        // Update charts
        if (this.chartManager) {
          this.chartManager.chartConfig = this.chartManager.getChartConfig();
          this.chartManager.updateAllCharts();
        }
      });
    });
  }
  
  updateDarkModeUI(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    
    // Update button icon
    const darkToggle = document.getElementById('toggleDarkBtn');
    if (darkToggle) {
      darkToggle.textContent = isDark ? '☀️' : '🌓';
    }
  }
  
  applyThemeFromStorage() {
    chrome.storage.local.get(['darkModeEnabled', 'customTheme', 'currentThemeName'], (data) => {
      const isDarkMode = data.darkModeEnabled ?? false;
      
      if (isDarkMode) {
        this.applyDarkTheme();
      } else if (data.customTheme) {
        this.applyCustomTheme(data.customTheme);
      } else {
        this.applyDefaultTheme();
      }
      
      // Update dark mode UI
      this.updateDarkModeUI(isDarkMode);
    });
  }
  
  applyDarkTheme() {
    const root = document.documentElement;
    root.classList.add('dark');
    
    // Apply dark theme CSS variables (matching popup)
    root.style.setProperty('--bg-primary', '#0f0a1a');
    root.style.setProperty('--bg-secondary', '#1a1330');
    root.style.setProperty('--bg-tertiary', '#241840');
    root.style.setProperty('--text-primary', '#e0d7f5');
    root.style.setProperty('--text-secondary', '#b3a3d0');
    root.style.setProperty('--text-tertiary', '#8b7aa3');
    root.style.setProperty('--primary-color', '#b48cff');
    root.style.setProperty('--primary-hover', '#9a6fe8');
    root.style.setProperty('--border-color', '#3a2e50');
    root.style.setProperty('--success-color', '#28a745');
    root.style.setProperty('--warning-color', '#f9a825');
    root.style.setProperty('--error-color', '#d93025');
  }
  
  applyDefaultTheme() {
    const root = document.documentElement;
    root.classList.remove('dark');
    
    // Apply default theme CSS variables (matching popup)
    root.style.setProperty('--bg-primary', '#f5f7fa');
    root.style.setProperty('--bg-secondary', '#ffffff');
    root.style.setProperty('--bg-tertiary', '#fafbfc');
    root.style.setProperty('--text-primary', '#2c3e50');
    root.style.setProperty('--text-secondary', '#6b7280');
    root.style.setProperty('--primary-color', '#0078d4');
    root.style.setProperty('--primary-hover', '#005ea2');
    root.style.setProperty('--border-color', '#e1e4e8');
    root.style.setProperty('--success-color', '#28a745');
    root.style.setProperty('--warning-color', '#f9a825');
    root.style.setProperty('--error-color', '#d93025');
  }
  
  applyCustomTheme(theme) {
    const root = document.documentElement;
    root.classList.remove('dark');
    
    // Apply custom theme colors
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--primary-hover', theme.primary);
    root.style.setProperty('--bg-primary', theme.bg);
    root.style.setProperty('--bg-secondary', '#ffffff');
    root.style.setProperty('--success-color', theme.success);
    root.style.setProperty('--warning-color', theme.warning);
    root.style.setProperty('--text-primary', '#2c3e50');
    root.style.setProperty('--text-secondary', '#6b7280');
    root.style.setProperty('--border-color', '#e1e4e8');
    root.style.setProperty('--error-color', '#d93025');
  }
  
  toggleDarkMode() {
    // This is handled by the event listener in initializeDarkModeSync
    // Just here for compatibility
  }
  
  async runDiagnostics() {
    const btn = document.getElementById('runDiagnosticsBtn');
    if (!btn) return;
    
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Running...';
    
    try {
      chrome.runtime.sendMessage({ action: 'runFullDiagnostics' }, (response) => {
        if (chrome.runtime.lastError) {
          this.showError('Extension communication error');
          btn.innerHTML = '<span class="btn-icon">🔍</span> Run Full Diagnostics';
          btn.disabled = false;
          return;
        }
        
        if (response && response.success) {
          this.showSuccess('Diagnostics completed!');
          setTimeout(() => location.reload(), 1500);
        } else {
          this.showError('Diagnostics failed');
        }
        
        btn.innerHTML = '<span class="btn-icon">🔍</span> Run Full Diagnostics';
        btn.disabled = false;
      });
    } catch (error) {
      console.error('Diagnostics error:', error);
      this.showError('Failed to run diagnostics');
      btn.innerHTML = '<span class="btn-icon">🔍</span> Run Full Diagnostics';
      btn.disabled = false;
    }
  }
  
  async runSpeedTest() {
    const btn = document.getElementById('speedTestBtn');
    if (!btn) return;
    
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Testing...';
    
    try {
      chrome.runtime.sendMessage({ action: 'runSpeedTest' }, (response) => {
        if (chrome.runtime.lastError) {
          this.showError('Extension communication error');
          btn.innerHTML = '<span class="btn-icon">⚡</span> Speed Test Only';
          btn.disabled = false;
          return;
        }
        
        if (response && response.success && response.speed) {
          this.showSuccess(`Speed: ${response.speed} Mbps`);
          setTimeout(() => location.reload(), 2000);
        } else {
          this.showError('Speed test failed');
        }
        
        btn.innerHTML = '<span class="btn-icon">⚡</span> Speed Test Only';
        btn.disabled = false;
      });
    } catch (error) {
      console.error('Speed test error:', error);
      this.showError('Failed to run speed test');
      btn.innerHTML = '<span class="btn-icon">⚡</span> Speed Test Only';
      btn.disabled = false;
    }
  }
  
  async clearHistory() {
    if (!confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      return;
    }
    
    const btn = document.getElementById('clearHistoryBtn');
    if (!btn) return;
    
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Clearing...';
    
    try {
      chrome.storage.local.remove(['dashboardData', 'providerHistory'], () => {
        if (chrome.runtime.lastError) {
          this.showError('Failed to clear history');
          btn.innerHTML = '<span class="btn-icon">🗑️</span> Clear History';
          btn.disabled = false;
          return;
        }
        
        this.showSuccess('History cleared!');
        btn.innerHTML = '<span class="btn-icon">🗑️</span> Clear History';
        btn.disabled = false;
        
        setTimeout(() => location.reload(), 1500);
      });
    } catch (error) {
      console.error('Clear history error:', error);
      this.showError('Failed to clear history');
      btn.innerHTML = '<span class="btn-icon">🗑️</span> Clear History';
      btn.disabled = false;
    }
  }
  
  handleChartAction(event) {
    const btn = event.currentTarget;
    const action = btn.dataset.action;
    const container = btn.closest('.chart-container');
    const chartType = container?.dataset.chart;
    
    if (action === 'refresh' && chartType) {
      if (this.chartManager.refreshChart(chartType)) {
        this.showSuccess('Chart refreshed!', 1000);
      }
    }
  }
  
  exportData() {
    const data = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: this.state.data,
      statistics: {
        avgLatency: this.state.getAverage('latency'),
        avgSpeed: this.state.getAverage('speed'),
        avgJitter: this.state.getAverage('jitter'),
        bestScore: this.state.getBestScore(),
        dataPoints: this.state.getDataPointCount()
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wifi-kickstart-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showSuccess('Data exported successfully!');
  }
  
  updateStatusCards() {
    // Update current values
    const latency = this.state.getLatestValue('latency');
    const speed = this.state.getLatestValue('speed');
    const jitter = this.state.getLatestValue('jitter');
    const score = this.state.getLatestValue('score');
    
    this.updateStatusCard('currentLatency', latency, 'ms', this.getLatencyStatus(latency));
    this.updateStatusCard('currentSpeed', speed, ' Mbps', this.getSpeedStatus(speed));
    this.updateStatusCard('currentJitter', jitter, 'ms', this.getJitterStatus(jitter));
    this.updateStatusCard('networkScore', score, '', this.getScoreStatus(score));
    
    // Update statistics
    this.updateStatistics();
  }
  
  updateStatusCard(elementId, value, suffix = '', status = null) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (value === null || value === undefined) {
      element.textContent = '--';
      element.closest('.status-card')?.removeAttribute('data-status');
    } else {
      element.textContent = value + suffix;
      if (status) {
        element.closest('.status-card')?.setAttribute('data-status', status);
      }
    }
  }
  
  updateStatistics() {
    // Average values
    const avgLatency = this.state.getAverage('latency');
    const avgSpeed = this.state.getAverage('speed');
    const bestScore = this.state.getBestScore();
    
    // Update statistics elements
    this.updateStatValue('avgLatency', avgLatency, ' ms');
    this.updateStatValue('avgSpeed', avgSpeed, ' Mbps');
    this.updateStatValue('bestScore', bestScore, '');
    
    // Update meta info
    const dataPoints = this.state.getDataPointCount();
    this.updateStatValue('dataPoints', dataPoints, '');
    
    // Update last updated time
    const lastUpdated = this.state.getLastUpdateTime();
    this.updateStatValue('lastUpdated', lastUpdated, '');
    
    // Calculate and update uptime
    this.updateUptime();
  }
  
  updateStatValue(elementId, value, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (value === null || value === undefined) {
      element.textContent = '--';
    } else {
      element.textContent = value + suffix;
    }
  }
  
  updateUptime() {
    const element = document.getElementById('uptime');
    if (!element) return;
    
    const startTime = sessionStorage.getItem('dashboardStartTime');
    if (!startTime) {
      sessionStorage.setItem('dashboardStartTime', Date.now());
      element.textContent = '0m';
      return;
    }
    
    const elapsed = Date.now() - parseInt(startTime);
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    
    if (hours > 0) {
      element.textContent = `${hours}h ${minutes}m`;
    } else {
      element.textContent = `${minutes}m`;
    }
  }
  
  getLatencyStatus(value) {
    if (!value) return null;
    if (value < 20) return 'good';
    if (value < 50) return 'warning';
    return 'error';
  }
  
  getSpeedStatus(value) {
    if (!value) return null;
    if (value > 50) return 'good';
    if (value > 10) return 'warning';
    return 'error';
  }
  
  getJitterStatus(value) {
    if (!value) return null;
    if (value < 5) return 'good';
    if (value < 15) return 'warning';
    return 'error';
  }
  
  getScoreStatus(value) {
    if (!value) return null;
    if (value >= 80) return 'good';
    if (value >= 50) return 'warning';
    return 'error';
  }
  
  showSuccess(message, duration = 2000) {
    this.showNotification(message, 'success', duration);
  }
  
  showError(message, duration = 3000) {
    this.showNotification(message, 'error', duration);
  }
  
  showNotification(message, type = 'info', duration = 2000) {
    // Clear any existing timeout
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    
    // Remove existing notification if any
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after duration
    this.notificationTimeout = setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }
}