/**
 * Sortable Manager
 * Handles drag-and-drop functionality for charts and sections
 */

class SortableManager {
  constructor(chartManager) {
    this.chartManager = chartManager;
    this.sortableInstances = [];
    this.sectionOrder = [];
    this.chartOrder = {};
  }
  
  initializeSortables() {
    // Initialize section sorting
    this.initializeSectionSorting();
    
    // Initialize chart sorting
    this.initializeChartSorting();
    
    // Add drag handles
    this.addDragHandles();
    
    // Load saved orders
    this.loadSavedOrders();
  }
  
  initializeSectionSorting() {
    const container = document.querySelector('.dashboard-container');
    if (!container) return;
    
    // Make sections sortable
    const sectionSortable = Sortable.create(container, {
      group: 'sections',
      animation: 300,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      handle: '.section-drag-handle',
      filter: '.header', // Don't allow header to be moved
      preventOnFilter: false,
      onStart: (evt) => {
        document.body.classList.add('sorting-active');
        evt.item.classList.add('being-dragged');
      },
      onEnd: (evt) => {
        document.body.classList.remove('sorting-active');
        evt.item.classList.remove('being-dragged');
        this.onSectionReorder(evt);
      },
      onMove: (evt) => {
        // Don't allow moving header
        return evt.related.classList.contains('header') ? false : true;
      }
    });
    
    this.sortableInstances.push(sectionSortable);
  }
  
  initializeChartSorting() {
    const chartsGrid = document.querySelector('.charts-grid');
    if (!chartsGrid) return;
    
    // Make charts sortable within the grid
    const chartSortable = Sortable.create(chartsGrid, {
      group: 'charts',
      animation: 300,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      handle: '.chart-drag-handle',
      onStart: (evt) => {
        document.body.classList.add('sorting-active');
        evt.item.classList.add('being-dragged');
      },
      onEnd: (evt) => {
        document.body.classList.remove('sorting-active');
        evt.item.classList.remove('being-dragged');
        this.onChartReorder(evt);
        
        // Resize charts after reordering
        setTimeout(() => {
          if (this.chartManager) {
            this.chartManager.resizeAllCharts();
          }
        }, 350);
      }
    });
    
    this.sortableInstances.push(chartSortable);
  }
  
  addDragHandles() {
    // Add section drag handles
    this.addSectionDragHandles();
    
    // Add chart drag handles
    this.addChartDragHandles();
  }
  
  addSectionDragHandles() {
    const sections = document.querySelectorAll('.status-bar, .controls, .network-info, .charts-section, .stats-summary');
    
    sections.forEach(section => {
      if (!section.classList.contains('dashboard-section')) {
        section.classList.add('dashboard-section');
      }
      
      // Don't add handle if it already exists
      if (section.querySelector('.section-drag-handle')) return;
      
      const handle = document.createElement('div');
      handle.className = 'section-drag-handle';
      handle.innerHTML = '⋮⋮';
      handle.title = 'Drag to reorder section';
      handle.setAttribute('aria-label', 'Drag to reorder section');
      
      section.style.position = 'relative';
      section.appendChild(handle);
    });
  }
  
  addChartDragHandles() {
    const chartContainers = document.querySelectorAll('.chart-container');
    
    chartContainers.forEach(container => {
      // Don't add handle if it already exists
      if (container.querySelector('.chart-drag-handle')) return;
      
      const handle = document.createElement('div');
      handle.className = 'chart-drag-handle';
      handle.innerHTML = '⋮';
      handle.title = 'Drag to reorder chart';
      handle.setAttribute('aria-label', 'Drag to reorder chart');
      
      container.appendChild(handle);
    });
  }
  
  onSectionReorder(evt) {
    console.log('Section reordered:', {
      from: evt.oldIndex,
      to: evt.newIndex,
      item: evt.item.className
    });
    
    // Save new section order
    this.saveSectionOrder();
    
    // Show success notification
    this.showNotification('Section order saved!', 'success', 1500);
  }
  
  onChartReorder(evt) {
    console.log('Chart reordered:', {
      from: evt.oldIndex,
      to: evt.newIndex,
      chartType: evt.item.dataset.chart
    });
    
    // Save new chart order
    this.saveChartOrder();
    
    // Show success notification
    this.showNotification('Chart order saved!', 'success', 1500);
  }
  
  saveSectionOrder() {
    const sections = document.querySelectorAll('.dashboard-section');
    const order = Array.from(sections).map((section, index) => {
      return {
        className: section.className,
        index: index,
        id: section.id || `section-${index}`
      };
    });
    
    chrome.storage.local.set({ sectionOrder: order }, () => {
      console.log('Section order saved:', order);
    });
  }
  
  saveChartOrder() {
    const charts = document.querySelectorAll('.chart-container');
    const order = Array.from(charts).map((chart, index) => {
      return {
        chartType: chart.dataset.chart,
        index: index,
        id: chart.id || `chart-${index}`
      };
    });
    
    chrome.storage.local.set({ chartOrder: order }, () => {
      console.log('Chart order saved:', order);
    });
  }
  
  loadSavedOrders() {
    // Load section order
    chrome.storage.local.get('sectionOrder', (data) => {
      if (data.sectionOrder) {
        this.applySectionOrder(data.sectionOrder);
      }
    });
    
    // Load chart order
    chrome.storage.local.get('chartOrder', (data) => {
      if (data.chartOrder) {
        this.applyChartOrder(data.chartOrder);
      }
    });
  }
  
  applySectionOrder(order) {
    const container = document.querySelector('.dashboard-container');
    if (!container || !order.length) return;
    
    console.log('Applying section order:', order);
    
    // Get all sections
    const sections = Array.from(container.querySelectorAll('.dashboard-section'));
    const header = container.querySelector('.header');
    const footer = container.querySelector('.footer'); // ← ADD THIS LINE
    
    // Sort sections based on saved order
    const sortedSections = [];
    
    order.forEach(orderItem => {
      const section = sections.find(s => 
        s.className.includes(orderItem.className.split(' ')[0]) ||
        s.id === orderItem.id
      );
      if (section) {
        sortedSections.push(section);
      }
    });
    
    // Add any sections not in the saved order
    sections.forEach(section => {
      if (!sortedSections.includes(section)) {
        sortedSections.push(section);
      }
    });
    
    // Reorder sections in the DOM
    container.innerHTML = '';
    if (header) container.appendChild(header);
    sortedSections.forEach(section => container.appendChild(section));
    if (footer) container.appendChild(footer); // ← ADD THIS LINE
  }
  
  applyChartOrder(order) {
    const chartsGrid = document.querySelector('.charts-grid');
    if (!chartsGrid || !order.length) return;
    
    console.log('Applying chart order:', order);
    
    // Get all charts
    const charts = Array.from(chartsGrid.querySelectorAll('.chart-container'));
    
    // Sort charts based on saved order
    const sortedCharts = [];
    
    order.forEach(orderItem => {
      const chart = charts.find(c => c.dataset.chart === orderItem.chartType);
      if (chart) {
        sortedCharts.push(chart);
      }
    });
    
    // Add any charts not in the saved order
    charts.forEach(chart => {
      if (!sortedCharts.includes(chart)) {
        sortedCharts.push(chart);
      }
    });
    
    // Reorder charts in the DOM
    chartsGrid.innerHTML = '';
    sortedCharts.forEach(chart => chartsGrid.appendChild(chart));
    
    // Resize charts after reordering
    setTimeout(() => {
      if (this.chartManager) {
        this.chartManager.resizeAllCharts();
      }
    }, 100);
  }
  
  hideChart(chartType) {
    const chartContainer = document.querySelector(`[data-chart="${chartType}"]`);
    if (chartContainer) {
      chartContainer.style.display = 'none';
      this.saveChartVisibility(chartType, false);
      this.rebalanceChartsGrid();
    }
  }
  
  showChart(chartType) {
    const chartContainer = document.querySelector(`[data-chart="${chartType}"]`);
    if (chartContainer) {
      chartContainer.style.display = 'block';
      this.saveChartVisibility(chartType, true);
      this.rebalanceChartsGrid();
      
      // Resize chart after showing
      setTimeout(() => {
        if (this.chartManager) {
          this.chartManager.resizeChart(chartType);
        }
      }, 100);
    }
  }
  
  saveChartVisibility(chartType, visible) {
    chrome.storage.local.get('chartVisibility', (data) => {
      const visibility = data.chartVisibility || {};
      visibility[chartType] = visible;
      chrome.storage.local.set({ chartVisibility: visibility });
    });
  }
  
  loadChartVisibility() {
    chrome.storage.local.get('chartVisibility', (data) => {
      if (data.chartVisibility) {
        Object.entries(data.chartVisibility).forEach(([chartType, visible]) => {
          const chartContainer = document.querySelector(`[data-chart="${chartType}"]`);
          if (chartContainer) {
            chartContainer.style.display = visible ? 'block' : 'none';
          }
        });
        this.rebalanceChartsGrid();
      }
    });
  }
  
  rebalanceChartsGrid() {
    const chartsGrid = document.querySelector('.charts-grid');
    if (!chartsGrid) return;
    
    // Remove any gaps by ensuring proper grid flow
    const visibleCharts = chartsGrid.querySelectorAll('.chart-container:not([style*="display: none"])');
    
    // Reset grid and let CSS handle the layout
    chartsGrid.style.display = 'grid';
    
    console.log(`Rebalanced grid with ${visibleCharts.length} visible charts`);
  }
  
  resetToDefault() {
    // Clear saved orders
    chrome.storage.local.remove(['sectionOrder', 'chartOrder', 'chartVisibility'], () => {
      console.log('Layout reset to default');
      
      // Reload the page to restore default order
      window.location.reload();
    });
  }
  
  showNotification(message, type = 'info', duration = 2000) {
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
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }
  
  // Get current layout state for debugging
  getCurrentLayout() {
    const sections = Array.from(document.querySelectorAll('.dashboard-section'));
    const charts = Array.from(document.querySelectorAll('.chart-container'));
    
    return {
      sections: sections.map((section, index) => ({
        index,
        className: section.className,
        id: section.id
      })),
      charts: charts.map((chart, index) => ({
        index,
        chartType: chart.dataset.chart,
        visible: chart.style.display !== 'none'
      }))
    };
  }
  
  // Enable/disable sorting
  enableSorting() {
    this.sortableInstances.forEach(instance => {
      instance.option('disabled', false);
    });
    
    // Show drag handles
    document.querySelectorAll('.section-drag-handle, .chart-drag-handle').forEach(handle => {
      handle.style.display = 'flex';
    });
  }
  
  disableSorting() {
    this.sortableInstances.forEach(instance => {
      instance.option('disabled', true);
    });
    
    // Hide drag handles
    document.querySelectorAll('.section-drag-handle, .chart-drag-handle').forEach(handle => {
      handle.style.display = 'none';
    });
  }
  
  destroy() {
    // Destroy all sortable instances
    this.sortableInstances.forEach(instance => {
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
    });
    
    this.sortableInstances = [];
    
    // Remove drag handles
    document.querySelectorAll('.section-drag-handle, .chart-drag-handle').forEach(handle => {
      handle.remove();
    });
    
    console.log('SortableManager destroyed');
  }
}