/**
 * Wi-Fi Kickstart Dashboard - Main Entry Point
 * Coordinates all dashboard modules
 */

// Dashboard Manager (Main Controller)
class DashboardManager {
  constructor() {
    this.state = null;
    this.chartManager = null;
    this.networkManager = null;
    this.uiController = null;
    this.refreshInterval = null;
    this.uptimeInterval = null;
    this.modulesLoaded = false;
    this.modalChart = null;
  }
  
  async loadModules() {
    // Load modules dynamically
    const modules = [
      'modules/DashboardState.js',
      'modules/ChartManager.js',
      'modules/NetworkInfoManager.js',
      'modules/UIController.js',
      'modules/utils.js'
    ];
    
    try {
      for (const module of modules) {
        await this.loadScript(module);
      }
      this.modulesLoaded = true;
      console.log('All modules loaded successfully');
    } catch (error) {
      console.error('Failed to load modules:', error);
      throw error;
    }
  }
  
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }
  
  async initialize() {
    console.log('Dashboard initializing...');
    
    // Load modules first
    if (!this.modulesLoaded) {
      await this.loadModules();
    }
    
    // Initialize state
    this.state = new DashboardState();
    
    // Check extension availability
    if (!this.state.isExtensionAvailable) {
      this.showExtensionRequired();
      return;
    }
    
    // Initialize managers
    this.chartManager = new ChartManager(this.state);
    this.networkManager = new NetworkInfoManager();
    this.uiController = new UIController(this.state, this.chartManager);
    
    // Make chart manager globally available for theme updates
    window.chartManager = this.chartManager;
    
    // Initialize components
    this.chartManager.initializeCharts();
    await this.networkManager.loadNetworkInfo();
    await this.loadDashboardData();
    await this.loadProviderHistory();
    
    // Setup real-time updates
    this.setupStorageListener();
    this.setupAutoRefresh();
    this.setupModalHandlers();
    
    // Update UI
    this.uiController.updateStatusCards();
    
    // Add CSS for notifications
    this.injectStyles();
    
    console.log('Dashboard initialized successfully');
  }
  
  showExtensionRequired() {
    const elements = ['currentLatency', 'currentSpeed', 'currentJitter', 'networkScore'];
    elements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = 'Extension Required';
    });
    
    // Show alert
    setTimeout(() => {
      if (this.uiController) {
        this.uiController.showError(
          'Wi-Fi Kickstart extension is required for this dashboard to function',
          5000
        );
      } else {
        alert('Wi-Fi Kickstart extension is required for this dashboard to function');
      }
    }, 500);
  }
  
  async loadDashboardData() {
    return new Promise((resolve) => {
      chrome.storage.local.get('dashboardData', (result) => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError);
          resolve();
          return;
        }
        
        if (result.dashboardData) {
          console.log('Loaded dashboard data:', result.dashboardData);
          
          // Process provider history if it exists
          if (result.dashboardData.providerHistory) {
            const providerMap = new Map(result.dashboardData.providerHistory);
            result.dashboardData.providerHistory = providerMap;
          }
          
          this.state.updateData(result.dashboardData);
          this.chartManager.updateAllCharts();
          this.uiController.updateStatusCards();
        } else {
          console.log('No dashboard data found');
        }
        
        resolve();
      });
    });
  }
  
  async loadProviderHistory() {
    return new Promise((resolve) => {
      chrome.storage.local.get('providerHistory', (result) => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError);
          resolve();
          return;
        }
        
        if (result.providerHistory && result.providerHistory.length > 0) {
          console.log('Loaded provider history:', result.providerHistory);
          
          // Process provider history into a map for the chart
          const providerMap = new Map();
          result.providerHistory.forEach(entry => {
            if (entry.provider) {
              const count = providerMap.get(entry.provider) || 0;
              providerMap.set(entry.provider, count + 1);
            }
          });
          
          // Update state with provider history
          this.state.data.providerHistory = providerMap;
          
          // Update provider chart
          if (this.chartManager && this.state.charts.provider) {
            const providers = Array.from(providerMap.entries());
            this.state.charts.provider.data.labels = providers.map(p => p[0]);
            this.state.charts.provider.data.datasets[0].data = providers.map(p => p[1]);
            this.state.charts.provider.update('none');
          }
        }
        
        resolve();
      });
    });
  }
  
  setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        if (changes.dashboardData) {
          console.log('Dashboard data updated via storage listener');
          const newData = changes.dashboardData.newValue;
          if (newData) {
            // Process provider history if it exists
            if (newData.providerHistory) {
              const providerMap = new Map(newData.providerHistory);
              newData.providerHistory = providerMap;
            }
            
            this.state.updateData(newData);
            this.chartManager.updateAllCharts();
            this.uiController.updateStatusCards();
          }
        }
        
        if (changes.providerHistory) {
          console.log('Provider history updated via storage listener');
          this.loadProviderHistory();
        }
      }
    });
  }
  
  setupAutoRefresh() {
    // Auto-refresh data
    this.refreshInterval = setInterval(() => {
      console.log('Auto-refreshing dashboard...');
      this.loadDashboardData();
      this.loadProviderHistory();
      this.networkManager.loadNetworkInfo();
      this.uiController.updateUptime();
    }, this.state.config.refreshInterval);
    
    // Update uptime every minute
    this.uptimeInterval = setInterval(() => {
      this.uiController.updateUptime();
    }, 60000);
  }
  
  setupModalHandlers() {
    // Modal setup for expanded charts
    const modal = document.getElementById('chartModal');
    const modalClose = modal?.querySelector('.modal-close');
    
    // Close modal handler
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        this.closeModal();
      });
    }
    
    // Close modal on outside click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }
    
    // Handle expand buttons
    document.querySelectorAll('.chart-btn[data-action="expand"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const container = btn.closest('.chart-container');
        const chartType = container?.dataset.chart;
        if (chartType) {
          this.expandChart(chartType);
        }
      });
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('active')) {
        this.closeModal();
      }
    });
  }
  
  expandChart(chartType) {
    const modal = document.getElementById('chartModal');
    if (!modal) return;
    
    const sourceChart = this.state.charts[chartType];
    if (!sourceChart) return;
    
    // Show modal
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    
    // Get or create modal canvas
    let modalCanvas = document.getElementById('modalChart');
    if (!modalCanvas) {
      modalCanvas = document.createElement('canvas');
      modalCanvas.id = 'modalChart';
      modal.querySelector('.modal-content').appendChild(modalCanvas);
    }
    
    // Destroy existing modal chart if any
    if (this.modalChart) {
      this.modalChart.destroy();
    }
    
    // Clone chart configuration
    const config = {
      type: sourceChart.config.type,
      data: JSON.parse(JSON.stringify(sourceChart.config.data)),
      options: JSON.parse(JSON.stringify(sourceChart.config.options))
    };
    
    // Adjust options for modal display
    config.options.maintainAspectRatio = true;
    config.options.aspectRatio = 2;
    
    // Create new chart in modal
    this.modalChart = new Chart(modalCanvas, config);
    
    // Add title to modal
    const modalContent = modal.querySelector('.modal-content');
    const existingTitle = modalContent.querySelector('.modal-title');
    if (existingTitle) {
      existingTitle.remove();
    }
    
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.style.cssText = 'margin-bottom: 20px; color: var(--text-primary); text-align: center;';
    
    const titles = {
      performance: 'Network Performance Over Time',
      speed: 'Speed Test History',
      provider: 'Network Providers',
      score: 'Network Score Trend',
      distribution: 'Performance Distribution',
      quality: 'Connection Quality Distribution'
    };
    
    title.textContent = titles[chartType] || 'Chart View';
    modalContent.insertBefore(title, modalCanvas);
  }
  
  closeModal() {
    const modal = document.getElementById('chartModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    
    // Destroy modal chart
    if (this.modalChart) {
      this.modalChart.destroy();
      this.modalChart = null;
    }
  }
  
  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Notification Styles */
      .notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        font-weight: 600;
        color: white;
        animation: slideDown 0.3s ease;
      }
      
      .notification-success {
        background: var(--success-color);
      }
      
      .notification-error {
        background: var(--error-color);
      }
      
      .notification-info {
        background: var(--info-color);
      }
      
      .notification.fade-out {
        animation: slideUp 0.3s ease;
      }
      
      @keyframes slideDown {
        from {
          transform: translateX(-50%) translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes slideUp {
        from {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
        to {
          transform: translateX(-50%) translateY(-20px);
          opacity: 0;
        }
      }
      
      /* Loading state animation */
      .loading::after {
        content: '';
        display: inline-block;
        width: 12px;
        height: 12px;
        margin-left: 8px;
        border: 2px solid var(--border-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Modal improvements */
      .modal.active {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .modal-content {
        width: 90%;
        max-width: 1200px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
      }
      
      #modalChart {
        max-width: 100%;
        height: auto !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Cleanup method
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
    }
    
    // Destroy modal chart
    if (this.modalChart) {
      this.modalChart.destroy();
    }
    
    // Destroy charts
    if (this.state && this.state.charts) {
      Object.values(this.state.charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
    }
  }
}

// Initialize Dashboard on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Create and initialize dashboard
    window.dashboard = new DashboardManager();
    await window.dashboard.initialize();
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      if (window.dashboard) {
        window.dashboard.destroy();
      }
    });
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
    // Show error to user
    document.getElementById('currentLatency').textContent = 'Load Error';
    document.getElementById('currentSpeed').textContent = 'Load Error';
    document.getElementById('currentJitter').textContent = 'Load Error';
    document.getElementById('networkScore').textContent = 'Load Error';
  }
});

// Export for testing/debugging (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DashboardManager };
}