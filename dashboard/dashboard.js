/**
 * Enhanced Dashboard Manager with Control Menu and Status Spinners
 * Integrates all new features into the main dashboard
 */

// Enhanced Dashboard Manager
class DashboardManager {
  constructor() {
    this.state = null;
    this.chartManager = null;
    this.networkManager = null;
    this.uiController = null;
    this.sortableManager = null;
    this.controlMenu = null;
    this.refreshInterval = null;
    this.uptimeInterval = null;
    this.modulesLoaded = false;
    this.modalChart = null;
    this.isFullscreen = false;
  }
  
  async loadModules() {
    // Load modules dynamically
    const modules = [
      'modules/DashboardState.js',
      'modules/ChartManager.js',
      'modules/NetworkInfoManager.js',
      'modules/UIController.js',
      'modules/SortableManager.js',
      'modules/DashboardControlMenu.js',
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
    this.sortableManager = new SortableManager(this.chartManager);
    this.controlMenu = new DashboardControlMenu(this.sortableManager, this.chartManager);
    
    // Make managers globally available
    window.chartManager = this.chartManager;
    window.sortableManager = this.sortableManager;
    window.controlMenu = this.controlMenu;
    window.uiController = this.uiController;
    
    // Initialize components
    this.chartManager.initializeCharts();
    await this.networkManager.loadNetworkInfo();
    await this.loadDashboardData();
    await this.loadProviderHistory();
    
    // Initialize sortable functionality
    this.sortableManager.initializeSortables();
    
    // Setup other features
    this.setupStorageListener();
    this.setupAutoRefresh();
    this.setupModalHandlers();
    this.setupFullscreenToggle();
    
    // Update UI
    this.uiController.updateStatusCards();
    
    // Add CSS for all features
    this.injectStyles();
    
    console.log('Dashboard initialized successfully');
  }
  
  setupFullscreenToggle() {
    // Create fullscreen toggle button
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.id = 'fullscreenToggle';
    fullscreenBtn.className = 'fullscreen-toggle';
    fullscreenBtn.innerHTML = '⛶';
    fullscreenBtn.title = 'Toggle Fullscreen';
    fullscreenBtn.setAttribute('aria-label', 'Toggle fullscreen mode');
    
    document.body.appendChild(fullscreenBtn);
    
    // Handle fullscreen toggle
    fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen();
    });
    
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      this.handleFullscreenChange();
    });
    
    // ESC key to exit fullscreen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isFullscreen) {
        this.exitFullscreen();
      }
    });
  }
  
  toggleFullscreen() {
    if (!this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }
  
  async enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error('Error entering fullscreen:', error);
      // Fallback to CSS fullscreen
      this.enterCSSFullscreen();
    }
  }
  
  async exitFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        this.exitCSSFullscreen();
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  }
  
  enterCSSFullscreen() {
    document.body.classList.add('css-fullscreen');
    this.isFullscreen = true;
    this.updateFullscreenButton();
  }
  
  exitCSSFullscreen() {
    document.body.classList.remove('css-fullscreen');
    this.isFullscreen = false;
    this.updateFullscreenButton();
  }
  
  handleFullscreenChange() {
    this.isFullscreen = !!document.fullscreenElement;
    this.updateFullscreenButton();
    
    // Resize charts after fullscreen change
    setTimeout(() => {
      if (this.chartManager) {
        this.chartManager.resizeAllCharts();
      }
    }, 100);
  }
  
  updateFullscreenButton() {
    const btn = document.getElementById('fullscreenToggle');
    if (btn) {
      btn.innerHTML = this.isFullscreen ? '⛶' : '⛶';
      btn.title = this.isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen';
      btn.classList.toggle('active', this.isFullscreen);
    }
  }
  
  showExtensionRequired() {
    const elements = ['currentLatency', 'currentSpeed', 'currentJitter', 'networkScore'];
    elements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = 'Extension Required';
    });
    
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
          
          const providerMap = new Map();
          result.providerHistory.forEach(entry => {
            if (entry.provider) {
              const count = providerMap.get(entry.provider) || 0;
              providerMap.set(entry.provider, count + 1);
            }
          });
          
          this.state.data.providerHistory = providerMap;
          
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
    this.refreshInterval = setInterval(() => {
      console.log('Auto-refreshing dashboard...');
      this.loadDashboardData();
      this.loadProviderHistory();
      this.networkManager.loadNetworkInfo();
      this.uiController.updateUptime();
    }, this.state.config.refreshInterval);
    
    this.uptimeInterval = setInterval(() => {
      this.uiController.updateUptime();
    }, 60000);
  }
  
  setupModalHandlers() {
    const modal = document.getElementById('chartModal');
    const modalClose = modal?.querySelector('.modal-close');
    
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        this.closeModal();
      });
    }
    
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }
    
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
    
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    
    let modalCanvas = document.getElementById('modalChart');
    if (!modalCanvas) {
      modalCanvas = document.createElement('canvas');
      modalCanvas.id = 'modalChart';
      modal.querySelector('.modal-content').appendChild(modalCanvas);
    }
    
    if (this.modalChart) {
      this.modalChart.destroy();
    }
    
    const config = {
      type: sourceChart.config.type,
      data: JSON.parse(JSON.stringify(sourceChart.config.data)),
      options: JSON.parse(JSON.stringify(sourceChart.config.options))
    };
    
    config.options.maintainAspectRatio = true;
    config.options.aspectRatio = 2;
    
    this.modalChart = new Chart(modalCanvas, config);
    
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
    
    if (this.modalChart) {
      this.modalChart.destroy();
      this.modalChart = null;
    }
  }
  
  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Enhanced Dashboard Styles with Menu and Spinners */
      
      /* Status Card Spinners */
      .status-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid var(--border-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 8px;
        vertical-align: middle;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
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
      
      .notification-success { background: var(--success-color); }
      .notification-error { background: var(--error-color); }
      .notification-info { background: var(--info-color); }
      
      .notification.fade-out { animation: slideUp 0.3s ease; }
      
      @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
      
      @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-20px); opacity: 0; }
      }
      
      /* Sortable Styles */
      .sortable-ghost {
        opacity: 0.5;
        background: var(--bg-tertiary) !important;
        border: 2px dashed var(--primary-color) !important;
        transform: rotate(2deg);
      }
      
      .sortable-chosen {
        background: var(--bg-tertiary) !important;
        box-shadow: 0 8px 32px rgba(0, 120, 212, 0.3) !important;
        transform: scale(1.02);
        z-index: 999;
      }
      
      .sortable-drag {
        opacity: 0.8;
        transform: rotate(-2deg) scale(1.05);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3) !important;
      }
      
      .chart-container {
        transition: all 0.3s ease;
        cursor: grab;
      }
      
      .chart-container:active {
        cursor: grabbing;
      }
      
      .dashboard-section {
        transition: all 0.3s ease;
        cursor: grab;
        position: relative;
      }
      
      .dashboard-section:active {
        cursor: grabbing;
      }
      
      .dashboard-section::before {
        content: '';
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        border: 2px solid transparent;
        border-radius: var(--radius-lg);
        transition: all 0.3s ease;
        pointer-events: none;
      }
      
      .dashboard-section:hover::before {
        border-color: var(--primary-color);
        opacity: 0.3;
      }
      
      /* Section drag handle */
      .section-drag-handle {
        position: absolute;
        top: 10px;
        left: 10px;
        width: 20px;
        height: 20px;
        background: var(--primary-color);
        border-radius: 4px;
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 10;
      }
      
      .section-drag-handle:active {
        cursor: grabbing;
      }
      
      .dashboard-section:hover .section-drag-handle {
        opacity: 1;
      }
      
      /* Chart drag handle */
      .chart-drag-handle {
        position: absolute;
        top: 8px;
        left: 8px;
        width: 16px;
        height: 16px;
        background: var(--secondary-color);
        border-radius: 3px;
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 10;
      }
      
      .chart-drag-handle:active {
        cursor: grabbing;
      }
      
      .chart-container:hover .chart-drag-handle {
        opacity: 1;
      }
      
      /* Fullscreen Toggle */
      .fullscreen-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--radius-full);
        cursor: pointer;
        font-size: 1.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--transition-base);
        z-index: 1000;
        box-shadow: 0 4px 20px rgba(0, 120, 212, 0.3);
      }
      
      .fullscreen-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(0, 120, 212, 0.4);
      }
      
      .fullscreen-toggle.active {
        background: var(--success-color);
      }
      
      /* CSS Fullscreen fallback */
      body.css-fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
        background: var(--bg-primary);
        overflow-y: auto;
      }
      
      body.css-fullscreen .toggle-dark {
        z-index: 10000;
      }
      
      body.css-fullscreen .fullscreen-toggle {
        z-index: 10000;
      }
      
      /* Fullscreen adjustments */
      :fullscreen {
        background: var(--bg-primary);
      }
      
      :fullscreen .dashboard-container {
        max-width: none;
        padding: var(--spacing-md);
      }
      
      :fullscreen .charts-grid {
        grid-template-columns: repeat(3, 1fr);
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
      
      /* Responsive adjustments for sortable */
      @media (max-width: 768px) {
        .section-drag-handle,
        .chart-drag-handle {
          opacity: 1;
        }
        
        .fullscreen-toggle {
          bottom: 10px;
          right: 10px;
          width: 40px;
          height: 40px;
          font-size: 1.2rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
    }
    
    if (this.modalChart) {
      this.modalChart.destroy();
    }
    
    if (this.state && this.state.charts) {
      Object.values(this.state.charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
    }
    
    if (this.sortableManager) {
      this.sortableManager.destroy();
    }
    
    if (this.controlMenu) {
      this.controlMenu.destroy();
    }
  }
}

// Initialize Dashboard on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.dashboard = new DashboardManager();
    await window.dashboard.initialize();
    
    window.addEventListener('beforeunload', () => {
      if (window.dashboard) {
        window.dashboard.destroy();
      }
    });
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
    document.getElementById('currentLatency').textContent = 'Load Error';
    document.getElementById('currentSpeed').textContent = 'Load Error';
    document.getElementById('currentJitter').textContent = 'Load Error';
    document.getElementById('networkScore').textContent = 'Load Error';
  }
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DashboardManager };
}