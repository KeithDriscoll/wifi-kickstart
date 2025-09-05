/**
 * Dashboard Control Menu Manager - FIXED EVENT LISTENERS
 * Handles left slide-out menu with section and chart visibility toggles
 */

class DashboardControlMenu {
  constructor(sortableManager, chartManager) {
    this.sortableManager = sortableManager;
    this.chartManager = chartManager;
    this.isMenuOpen = false;
    this.menuElement = null;
    this.overlayElement = null;
    
    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeMenu();
      });
    } else {
      this.initializeMenu();
    }
  }
  
  initializeMenu() {
    console.log('Initializing Dashboard Control Menu...');
    this.createMenuStructure();
    this.createMenuToggle();
    this.setupEventListeners();
    this.loadSavedVisibility();
    console.log('Dashboard Control Menu initialized');
  }
  
  createMenuStructure() {
    // Create overlay
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'dashboard-menu-overlay';
    this.overlayElement.style.display = 'none';
    document.body.appendChild(this.overlayElement);
    
    // Create menu
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'dashboard-control-menu';
    this.menuElement.innerHTML = `
      <div class="menu-header">
        <h3>Dashboard Controls</h3>
        <button class="menu-close" id="closeDashboardMenu">✕</button>
      </div>
      
      <div class="menu-content">
        <!-- Section Visibility Controls -->
        <div class="menu-section">
          <h4>Sections</h4>
          <div class="menu-controls">
            <div class="menu-toggle">
              <label class="toggle-label">Status Cards</label>
              <div class="pill-switch">
                <input type="checkbox" id="toggle-status-bar" checked>
                <span class="pill-slider"></span>
              </div>
            </div>
            
            <div class="menu-toggle">
              <label class="toggle-label">Control Buttons</label>
              <div class="pill-switch">
                <input type="checkbox" id="toggle-controls" checked>
                <span class="pill-slider"></span>
              </div>
            </div>
            
            <div class="menu-toggle">
              <label class="toggle-label">Network Info</label>
              <div class="pill-switch">
                <input type="checkbox" id="toggle-network-info" checked>
                <span class="pill-slider"></span>
              </div>
            </div>
            
            <div class="menu-toggle">
              <label class="toggle-label">Charts Section</label>
              <div class="pill-switch">
                <input type="checkbox" id="toggle-charts-section" checked>
                <span class="pill-slider"></span>
              </div>
            </div>
            
            <div class="menu-toggle">
              <label class="toggle-label">Statistics</label>
              <div class="pill-switch">
                <input type="checkbox" id="toggle-stats-summary" checked>
                <span class="pill-slider"></span>
              </div>
            </div>
          </div>
        </div>
        
        <hr class="menu-divider">
        
        <!-- Chart Visibility Controls -->
        <div class="menu-section">
          <h4>Charts</h4>
          <div class="menu-controls">
            <div class="menu-toggle">
              <label class="toggle-label">Performance Over Time</label>
              <div class="pill-switch">
                <input type="checkbox" id="toggle-chart-performance" checked>
                <span class="pill-slider"></span>
              </div>
            </div>
            
            <div class="menu-toggle">
              <label class="toggle-label">Speed Test History</label>
              <div class="pill-switch">
                <input type="checkbox" id="toggle-chart-speed" checked>
                <span class="pill-slider"></span>
              </div>
            </div>
            
            <div class="menu-toggle">
              <label class="toggle-label">Network Providers</label>
              <div class="pill-switch">
                <input type="checkbox" id="toggle-chart-provider" checked>
                <span class="pill-slider"></span>
              </div>
            </div>
            
            <div class="menu-toggle">
              <label class="toggle-label">Network Score Trend</label>
              <div class="pill-switch">
                <input type="checkbox" id="toggle-chart-score" checked>
                <span class="pill-slider"></span>
              </div>
            </div>
            
            <div class="menu-toggle">
              <label class="toggle-label">Performance Distribution</label>
              <div class="pill-switch">
                <input type="checkbox" id="toggle-chart-distribution" checked>
                <span class="pill-slider"></span>
              </div>
            </div>
            
            <div class="menu-toggle">
              <label class="toggle-label">Connection Quality</label>
              <div class="pill-switch">
                <input type="checkbox" id="toggle-chart-quality" checked>
                <span class="pill-slider"></span>
              </div>
            </div>
          </div>
        </div>
        
        <hr class="menu-divider">
        
        <!-- Menu Actions -->
        <div class="menu-section">
          <h4>Actions</h4>
          <div class="menu-actions">
            <button class="menu-action-btn" id="resetLayoutBtn">
              🔄 Reset Layout
            </button>
            <button class="menu-action-btn" id="showAllBtn">
              👁️ Show All
            </button>
            <button class="menu-action-btn" id="hideAllChartsBtn">
              🙈 Hide All Charts
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.menuElement);
    console.log('Menu structure created');
  }
  
  createMenuToggle() {
    // Create menu toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'dashboard-menu-toggle';
    toggleButton.id = 'dashboardMenuToggle';
    toggleButton.innerHTML = '☰';
    toggleButton.title = 'Dashboard Controls';
    toggleButton.setAttribute('aria-label', 'Open dashboard controls menu');
    
    document.body.appendChild(toggleButton);
    console.log('Menu toggle button created');
  }
  
  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Use setTimeout to ensure DOM elements are fully rendered
    setTimeout(() => {
      // Menu toggle button
      const toggleButton = document.getElementById('dashboardMenuToggle');
      if (toggleButton) {
        toggleButton.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('Menu toggle clicked');
          this.toggleMenu();
        });
        console.log('Menu toggle listener attached');
      } else {
        console.error('Menu toggle button not found');
      }
      
      // Menu close button
      const closeButton = document.getElementById('closeDashboardMenu');
      if (closeButton) {
        closeButton.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('Menu close clicked');
          this.closeMenu();
        });
        console.log('Menu close listener attached');
      } else {
        console.error('Menu close button not found');
      }
      
      // Overlay click to close
      if (this.overlayElement) {
        this.overlayElement.addEventListener('click', () => {
          console.log('Overlay clicked');
          this.closeMenu();
        });
        console.log('Overlay listener attached');
      }
      
      // Setup toggles
      this.setupSectionToggles();
      this.setupChartToggles();
      this.setupActionButtons();
      
    }, 100);
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMenu();
      }
    });
  }
  
  setupSectionToggles() {
    console.log('Setting up section toggles...');
    
    const sectionToggles = [
      { id: 'toggle-status-bar', selector: '.status-bar', name: 'Status Cards' },
      { id: 'toggle-controls', selector: '.controls', name: 'Control Buttons' },
      { id: 'toggle-network-info', selector: '.network-info', name: 'Network Info' },
      { id: 'toggle-charts-section', selector: '.charts-section', name: 'Charts Section' },
      { id: 'toggle-stats-summary', selector: '.stats-summary', name: 'Statistics' }
    ];
    
    sectionToggles.forEach(({ id, selector, name }) => {
      const toggle = document.getElementById(id);
      if (toggle) {
        console.log(`Setting up listener for ${id}`);
        
        // Remove any existing listeners
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        // Add new listener
        newToggle.addEventListener('change', (e) => {
          console.log(`Section toggle changed: ${id}, checked: ${e.target.checked}`);
          
          const section = document.querySelector(selector);
          if (section) {
            const isVisible = e.target.checked;
            if (isVisible) {
              section.style.display = ''; // Remove inline style, let CSS take over
            } else {
              section.style.display = 'none'; // Only set none when hiding
            }
            this.saveSectionVisibility(id, isVisible);
            this.showNotification(`${name} ${isVisible ? 'shown' : 'hidden'}`, 'info', 1000);
            console.log(`${name} ${isVisible ? 'shown' : 'hidden'}`);
          } else {
            console.error(`Section not found: ${selector}`);
          }
        });
        
        // Also handle clicks on the slider itself
        const slider = newToggle.parentNode.querySelector('.pill-slider');
        if (slider) {
          slider.addEventListener('click', (e) => {
            e.preventDefault();
            newToggle.checked = !newToggle.checked;
            newToggle.dispatchEvent(new Event('change'));
          });
        }
        
      } else {
        console.error(`Toggle not found: ${id}`);
      }
    });
  }
  
  setupChartToggles() {
    console.log('Setting up chart toggles...');
    
    const chartToggles = [
      { id: 'toggle-chart-performance', chartType: 'performance', name: 'Performance Over Time' },
      { id: 'toggle-chart-speed', chartType: 'speed', name: 'Speed Test History' },
      { id: 'toggle-chart-provider', chartType: 'provider', name: 'Network Providers' },
      { id: 'toggle-chart-score', chartType: 'score', name: 'Network Score Trend' },
      { id: 'toggle-chart-distribution', chartType: 'distribution', name: 'Performance Distribution' },
      { id: 'toggle-chart-quality', chartType: 'quality', name: 'Connection Quality' }
    ];
    
    chartToggles.forEach(({ id, chartType, name }) => {
      const toggle = document.getElementById(id);
      if (toggle) {
        console.log(`Setting up listener for ${id}`);
        
        // Remove any existing listeners
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        // Add new listener
        newToggle.addEventListener('change', (e) => {
          console.log(`Chart toggle changed: ${id}, checked: ${e.target.checked}`);
          
          const isVisible = e.target.checked;
          
          if (isVisible) {
            this.sortableManager.showChart(chartType);
          } else {
            this.sortableManager.hideChart(chartType);
          }
          
          this.showNotification(`${name} ${isVisible ? 'shown' : 'hidden'}`, 'info', 1000);
          console.log(`${name} ${isVisible ? 'shown' : 'hidden'}`);
        });
        
        // Also handle clicks on the slider itself
        const slider = newToggle.parentNode.querySelector('.pill-slider');
        if (slider) {
          slider.addEventListener('click', (e) => {
            e.preventDefault();
            newToggle.checked = !newToggle.checked;
            newToggle.dispatchEvent(new Event('change'));
          });
        }
        
      } else {
        console.error(`Chart toggle not found: ${id}`);
      }
    });
  }
  
  setupActionButtons() {
    console.log('Setting up action buttons...');
    
    // Reset Layout button
    const resetBtn = document.getElementById('resetLayoutBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Reset layout clicked');
        if (confirm('Reset dashboard layout to default? This will restore all sections and charts.')) {
          this.resetLayout();
        }
      });
      console.log('Reset button listener attached');
    }
    
    // Show All button
    const showAllBtn = document.getElementById('showAllBtn');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Show all clicked');
        this.showAll();
      });
      console.log('Show all button listener attached');
    }
    
    // Hide All Charts button
    const hideAllChartsBtn = document.getElementById('hideAllChartsBtn');
    if (hideAllChartsBtn) {
      hideAllChartsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Hide all charts clicked');
        this.hideAllCharts();
      });
      console.log('Hide all charts button listener attached');
    }
  }
  
  toggleMenu() {
    console.log('Toggle menu called, current state:', this.isMenuOpen);
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }
  
  openMenu() {
    console.log('Opening menu...');
    this.isMenuOpen = true;
    this.menuElement.classList.add('open');
    this.overlayElement.style.display = 'block';
    
    // Update toggle button
    const toggleButton = document.getElementById('dashboardMenuToggle');
    if (toggleButton) {
      toggleButton.classList.add('active');
      toggleButton.innerHTML = '✕';
    }
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    console.log('Menu opened');
  }
  
  closeMenu() {
    console.log('Closing menu...');
    this.isMenuOpen = false;
    this.menuElement.classList.remove('open');
    this.overlayElement.style.display = 'none';
    
    // Update toggle button
    const toggleButton = document.getElementById('dashboardMenuToggle');
    if (toggleButton) {
      toggleButton.classList.remove('active');
      toggleButton.innerHTML = '☰';
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    console.log('Menu closed');
  }
  
  saveSectionVisibility(toggleId, isVisible) {
    chrome.storage.local.get('sectionVisibility', (data) => {
      const visibility = data.sectionVisibility || {};
      visibility[toggleId] = isVisible;
      chrome.storage.local.set({ sectionVisibility: visibility });
      console.log('Section visibility saved:', toggleId, isVisible);
    });
  }
  
  loadSavedVisibility() {
    console.log('Loading saved visibility...');
    
    // Load section visibility
    chrome.storage.local.get('sectionVisibility', (data) => {
      if (data.sectionVisibility) {
        console.log('Found saved section visibility:', data.sectionVisibility);
        Object.entries(data.sectionVisibility).forEach(([toggleId, isVisible]) => {
          const toggle = document.getElementById(toggleId);
          if (toggle) {
            toggle.checked = isVisible;
            
            // Apply visibility
            const sectionMap = {
              'toggle-status-bar': '.status-bar',
              'toggle-controls': '.controls',
              'toggle-network-info': '.network-info',
              'toggle-charts-section': '.charts-section',
              'toggle-stats-summary': '.stats-summary'
            };
            
            const selector = sectionMap[toggleId];
            if (selector) {
              const section = document.querySelector(selector);
              if (section) {
                // FIXED CODE:
if (isVisible) {
  section.style.display = ''; // Let CSS handle the display
} else {
  section.style.display = 'none'; // Only force none when hidden
}
                console.log(`Applied visibility for ${selector}: ${isVisible}`);
              }
            }
          }
        });
      }
    });
    
    // Load chart visibility from SortableManager
    chrome.storage.local.get('chartVisibility', (data) => {
      if (data.chartVisibility) {
        console.log('Found saved chart visibility:', data.chartVisibility);
        Object.entries(data.chartVisibility).forEach(([chartType, isVisible]) => {
          const toggleId = `toggle-chart-${chartType}`;
          const toggle = document.getElementById(toggleId);
          if (toggle) {
            toggle.checked = isVisible;
            console.log(`Applied chart visibility for ${chartType}: ${isVisible}`);
          }
        });
      }
    });
  }
  
  resetLayout() {
    console.log('Resetting layout...');
    
    // Reset sections
    const sectionToggles = document.querySelectorAll('[id^="toggle-"]:not([id*="chart"])');
    sectionToggles.forEach(toggle => {
      toggle.checked = true;
      const event = new Event('change');
      toggle.dispatchEvent(event);
    });
    
    // Reset charts
    const chartToggles = document.querySelectorAll('[id*="toggle-chart"]');
    chartToggles.forEach(toggle => {
      toggle.checked = true;
      const event = new Event('change');
      toggle.dispatchEvent(event);
    });
    
    // Clear storage
    chrome.storage.local.remove(['sectionVisibility', 'chartVisibility', 'sectionOrder', 'chartOrder']);
    
    this.showNotification('Layout reset to default!', 'success', 2000);
    
    // Reload after a delay to restore default order
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
  
  showAll() {
    console.log('Showing all...');
    
    // Show all sections
    const allToggles = document.querySelectorAll('[id^="toggle-"]');
    allToggles.forEach(toggle => {
      if (!toggle.checked) {
        toggle.checked = true;
        const event = new Event('change');
        toggle.dispatchEvent(event);
      }
    });
    
    this.showNotification('All sections and charts shown!', 'success', 1500);
  }
  
  hideAllCharts() {
    console.log('Hiding all charts...');
    
    // Hide all charts only
    const chartToggles = document.querySelectorAll('[id*="toggle-chart"]');
    chartToggles.forEach(toggle => {
      if (toggle.checked) {
        toggle.checked = false;
        const event = new Event('change');
        toggle.dispatchEvent(event);
      }
    });
    
    this.showNotification('All charts hidden!', 'info', 1500);
  }
  
  showNotification(message, type = 'info', duration = 2000) {
    console.log('Showing notification:', message, type);
    
    // Remove existing notification if any
    const existing = document.querySelector('.dashboard-notification');
    if (existing) {
      existing.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `dashboard-notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }
  
  destroy() {
    // Clean up event listeners and DOM elements
    if (this.menuElement) {
      this.menuElement.remove();
    }
    if (this.overlayElement) {
      this.overlayElement.remove();
    }
    
    const toggleButton = document.getElementById('dashboardMenuToggle');
    if (toggleButton) {
      toggleButton.remove();
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    console.log('DashboardControlMenu destroyed');
  }
}