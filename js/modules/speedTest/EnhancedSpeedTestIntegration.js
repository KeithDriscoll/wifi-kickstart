// Integration Example - How to integrate the enhanced speed test system
// File: js/modules/speedTest/integration-example.js

export class EnhancedSpeedTestIntegration {
  constructor() {
    this.speedTestEngine = null;
    this.aiEngine = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize the enhanced speed test engine
      const { SpeedTestEngine } = await import('./SpeedTestEngine.js');
      this.speedTestEngine = new SpeedTestEngine();
      await this.speedTestEngine.initializeModules();

      // Initialize the AI explanation engine
      const { ExplanationEngine } = await import('../ai/ExplanationEngine.js');
      this.aiEngine = new ExplanationEngine();

      // Set up callbacks
      this.speedTestEngine.setCallbacks({
        onProgress: this.handleProgress.bind(this),
        onComplete: this.handleComplete.bind(this),
        onError: this.handleError.bind(this)
      });

      this.isInitialized = true;
      console.log('Enhanced speed test system initialized');
    } catch (error) {
      console.error('Failed to initialize enhanced speed test:', error);
      throw error;
    }
  }

  // Integration with existing popup speed test button
  async runEnhancedSpeedTest(isSimpleMode = false) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Show loading UI
      this.updateSpeedTestUI('loading', 'Starting enhanced speed test...');

      // Determine test type based on user preference
      const testType = isSimpleMode ? 'quick' : 'comprehensive';
      
      // Run the enhanced speed test
      const results = await this.speedTestEngine.runTest(testType);

      // Generate AI explanation
      const explanation = await this.aiEngine.generateExplanation(results);

      // Update UI with results and explanation
      this.displayEnhancedResults(results, explanation);

      return { results, explanation };

    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  handleProgress({ percentage, message }) {
    console.log(`Progress: ${percentage}% - ${message}`);
    
    // Update existing UI elements
    const speedElement = document.getElementById('speedSimple') || document.getElementById('speed');
    if (speedElement) {
      speedElement.textContent = `${Math.round(percentage)}% - ${message}`;
      speedElement.style.color = '#666';
    }

    // Update dashboard if open
    this.notifyDashboard('progress', { percentage, message });
  }

  async handleComplete(results) {
    console.log('Enhanced speed test completed:', results);

    try {
      // Generate AI explanation
      const explanation = await this.aiEngine.generateExplanation(results);

      // Display results in popup
      this.displayEnhancedResults(results, explanation);

      // Store results for dashboard
      await this.storeEnhancedResults(results, explanation);

      // Notify dashboard
      this.notifyDashboard('complete', { results, explanation });

    } catch (error) {
      console.error('Failed to process results:', error);
      this.displayBasicResults(results);
    }
  }

  handleError(error) {
    console.error('Speed test error:', error);
    
    const speedElement = document.getElementById('speedSimple') || document.getElementById('speed');
    if (speedElement) {
      speedElement.textContent = 'Test failed';
      speedElement.style.color = '#d93025';
    }

    // Show error notification
    this.showNotification('Speed test failed. Please try again.', 'error');
  }

  displayEnhancedResults(results, explanation) {
    // Update basic speed display (existing functionality)
    this.updateBasicSpeedDisplay(results);

    // Add enhanced information
    this.addEnhancedInfoToUI(results, explanation);

    // Update advanced mode elements if available
    this.updateAdvancedElements(results);
  }

  updateBasicSpeedDisplay(results) {
    const download = results.results.download?.speed || 0;
    const { emoji, color } = this.getSpeedMetrics(download);

    // Update simple mode speed display
    const speedSimple = document.getElementById('speedSimple');
    if (speedSimple) {
      speedSimple.textContent = `${download} Mbps ${emoji}`;
      speedSimple.style.color = color;
      speedSimple.title = `Grade: ${results.grade} | Score: ${results.networkScore}`;
    }

    // Update advanced mode speed display
    const speed = document.getElementById('speed');
    if (speed) {
      speed.textContent = `Speed: ${download} Mbps ${emoji}`;
      speed.style.color = color;
      speed.title = `Network Score: ${results.networkScore}/100`;
    }

    // Update timestamp
    const lastSpeed = document.getElementById('lastSpeed');
    if (lastSpeed) {
      lastSpeed.textContent = `Last Speed Test: ${new Date().toLocaleString()}`;
    }
  }

  addEnhancedInfoToUI(results, explanation) {
    // Add AI explanation as a tooltip or expandable section
    this.addAIInsights(explanation);

    // Add quick capability indicators
    this.addCapabilityIndicators(results);

    // Add grade/score display
    this.addGradeDisplay(results);
  }

  addAIInsights(explanation) {
    // Create or update AI insights container
    let insightsContainer = document.getElementById('aiInsights');
    if (!insightsContainer) {
      insightsContainer = document.createElement('div');
      insightsContainer.id = 'aiInsights';
      insightsContainer.className = 'ai-insights-container';
      
      // Insert after speed test section
      const speedSection = document.getElementById('speedTest');
      if (speedSection && speedSection.parentNode) {
        speedSection.parentNode.insertBefore(insightsContainer, speedSection.nextSibling);
      }
    }

    // Create insights UI
    insightsContainer.innerHTML = `
      <div class="ai-insights">
        <div class="ai-summary">
          <div class="ai-icon">🤖</div>
          <div class="ai-text">${explanation.summary}</div>
        </div>
        ${this.createInsightsList(explanation.insights)}
        ${this.createRecommendationsList(explanation.recommendations)}
      </div>
    `;

    // Add click handler to show/hide details
    this.addInsightsInteractivity(insightsContainer);
  }

  createInsightsList(insights) {
    if (!insights || insights.length === 0) return '';

    const insightItems = insights.slice(0, 3).map(insight => `
      <div class="insight-item insight-${insight.type}">
        <span class="insight-icon">${this.getInsightIcon(insight.type)}</span>
        <span class="insight-text">${insight.description}</span>
      </div>
    `).join('');

    return `
      <div class="insights-section">
        <div class="insights-header">Key Insights</div>
        <div class="insights-list">${insightItems}</div>
      </div>
    `;
  }

  createRecommendationsList(recommendations) {
    if (!recommendations || recommendations.length === 0) return '';

    const recommendationItems = recommendations.slice(0, 2).map(rec => `
      <div class="recommendation-item">
        <span class="rec-icon">${this.getRecommendationIcon(rec.type)}</span>
        <span class="rec-text">${rec.description}</span>
      </div>
    `).join('');

    return `
      <div class="recommendations-section">
        <div class="recommendations-header">Recommendations</div>
        <div class="recommendations-list">${recommendationItems}</div>
      </div>
    `;
  }

  addCapabilityIndicators(results) {
    // Add quick capability icons to the UI
    let capabilityContainer = document.getElementById('capabilityIndicators');
    if (!capabilityContainer) {
      capabilityContainer = document.createElement('div');
      capabilityContainer.id = 'capabilityIndicators';
      capabilityContainer.className = 'capability-indicators';
      
      const ipSection = document.getElementById('ipAddress');
      if (ipSection && ipSection.parentNode) {
        ipSection.parentNode.insertBefore(capabilityContainer, ipSection.nextSibling);
      }
    }

    const capabilities = this.extractCapabilities(results);
    capabilityContainer.innerHTML = `
      <div class="capability-row">
        ${capabilities.map(cap => `
          <div class="capability-item ${cap.supported ? 'supported' : 'limited'}" 
               title="${cap.description}">
            <span class="cap-icon">${cap.icon}</span>
            <span class="cap-label">${cap.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  addGradeDisplay(results) {
    // Add grade badge to the status area
    const statusElement = document.getElementById('status');
    if (statusElement && results.grade) {
      const gradeBadge = document.createElement('span');
      gradeBadge.className = 'grade-badge';
      gradeBadge.textContent = results.grade;
      gradeBadge.title = `Network Score: ${results.networkScore}/100`;
      gradeBadge.style.cssText = `
        margin-left: 8px;
        background: ${this.getGradeColor(results.grade)};
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.8em;
        font-weight: bold;
      `;
      
      // Remove existing grade badge if present
      const existingBadge = statusElement.querySelector('.grade-badge');
      if (existingBadge) {
        existingBadge.remove();
      }
      
      statusElement.appendChild(gradeBadge);
    }
  }

  updateAdvancedElements(results) {
    // Update network score if element exists
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      const score = results.networkScore || 0;
      const { emoji, color, label } = this.getScoreMetrics(score);
      scoreElement.textContent = `Network Score: ${score} ${emoji} (${label})`;
      scoreElement.style.color = color;
    }

    // Update latency with enhanced info
    const latencyElement = document.getElementById('latency');
    if (latencyElement && results.results.latency) {
      const latency = results.results.latency.average;
      const category = this.categorizeLatency(latency);
      latencyElement.textContent = `Latency: ${latency}ms (${category})`;
      latencyElement.style.color = this.getLatencyColor(latency);
    }

    // Update jitter with enhanced info
    const jitterElement = document.getElementById('jitter');
    if (jitterElement && results.results.jitter) {
      const jitter = results.results.jitter.average;
      const category = this.categorizeJitter(jitter);
      jitterElement.textContent = `Jitter: ${jitter}ms (${category})`;
      jitterElement.style.color = this.getJitterColor(jitter);
    }
  }

  async storeEnhancedResults(results, explanation) {
    try {
      // Store in the enhanced format for dashboard
      const enhancedData = {
        ...results,
        aiExplanation: explanation,
        enhancedTest: true,
        version: '2.0'
      };

      // Store in both old and new format for compatibility
      await chrome.storage.local.set({
        lastSpeedTest: results, // Old format
        lastEnhancedSpeedTest: enhancedData, // New format
      });

      // Update dashboard data
      const stored = await chrome.storage.local.get('dashboardData');
      const dashboardData = stored.dashboardData || {
        latencyHistory: [],
        speedHistory: [],
        jitterHistory: [],
        scoreHistory: [],
        timestamps: []
      };

      // Add enhanced data point
      const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      dashboardData.timestamps.push(timestamp);
      dashboardData.latencyHistory.push(results.results.latency?.average || null);
      dashboardData.speedHistory.push(results.results.download?.speed || null);
      dashboardData.jitterHistory.push(results.results.jitter?.average || null);
      dashboardData.scoreHistory.push(results.networkScore || null);

      // Keep only recent entries
      const maxEntries = 50;
      Object.keys(dashboardData).forEach(key => {
        if (dashboardData[key].length > maxEntries) {
          dashboardData[key] = dashboardData[key].slice(-maxEntries);
        }
      });

      await chrome.storage.local.set({ dashboardData });

    } catch (error) {
      console.error('Failed to store enhanced results:', error);
    }
  }

  notifyDashboard(event, data) {
    // Send message to dashboard if it's open
    try {
      chrome.runtime.sendMessage({
        action: 'enhancedSpeedTestUpdate',
        event,
        data
      });
    } catch (error) {
      // Dashboard not open, ignore
    }
  }

  // Utility methods

  extractCapabilities(results) {
    const download = results.results.download?.speed || 0;
    const upload = results.results.upload?.speed || 0;
    const latency = results.results.latency?.average || 0;

    return [
      {
        icon: '📺',
        label: '4K',
        supported: download >= 25,
        description: download >= 25 ? '4K streaming supported' : 'Limited to HD streaming'
      },
      {
        icon: '🎮',
        label: 'Gaming',
        supported: latency < 50,
        description: latency < 50 ? 'Great for gaming' : 'High latency may affect gaming'
      },
      {
        icon: '📹',
        label: 'Video Call',
        supported: download >= 3 && upload >= 3 && latency < 150,
        description: (download >= 3 && upload >= 3 && latency < 150) ? 'HD video calls supported' : 'Video calls may be limited'
      },
      {
        icon: '💼',
        label: 'Work',
        supported: download >= 10 && upload >= 5,
        description: (download >= 10 && upload >= 5) ? 'Great for work from home' : 'Basic work tasks only'
      }
    ];
  }

  getSpeedMetrics(speed) {
    if (speed < 2) return { emoji: "🐌", color: "#d93025" };
    if (speed < 5) return { emoji: "⚡", color: "#f57c00" };
    if (speed < 15) return { emoji: "✅", color: "#f9a825" };
    if (speed < 30) return { emoji: "📶", color: "#34a853" };
    return { emoji: "🚀", color: "#1e88e5" };
  }

  getScoreMetrics(score) {
    if (score >= 90) return { color: "#28a745", emoji: "🏆", label: "Excellent" };
    if (score >= 70) return { color: "#17a2b8", emoji: "✅", label: "Good" };
    if (score >= 50) return { color: "#ffc107", emoji: "⚡", label: "Fair" };
    if (score >= 30) return { color: "#ff9800", emoji: "⚠️", label: "Poor" };
    return { color: "#f44336", emoji: "❌", label: "Very Poor" };
  }

  getGradeColor(grade) {
    const colors = {
      'A+': '#28a745', 'A': '#28a745', 'A-': '#34a853',
      'B+': '#17a2b8', 'B': '#17a2b8', 'B-': '#20a2aa',
      'C+': '#ffc107', 'C': '#ffc107', 'C-': '#ff9800',
      'D': '#ff5722', 'F': '#f44336'
    };
    return colors[grade] || '#6c757d';
  }

  getInsightIcon(type) {
    const icons = {
      positive: '✅',
      concern: '⚠️',
      info: 'ℹ️',
      tip: '💡'
    };
    return icons[type] || 'ℹ️';
  }

  getRecommendationIcon(type) {
    const icons = {
      upgrade: '⬆️',
      optimize: '⚙️',
      fix: '🔧',
      limitation: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || '💡';
  }

  categorizeLatency(latency) {
    if (latency < 20) return 'Excellent';
    if (latency < 50) return 'Good';
    if (latency < 100) return 'Fair';
    return 'Poor';
  }

  categorizeJitter(jitter) {
    if (jitter < 5) return 'Excellent';
    if (jitter < 15) return 'Good';
    if (jitter < 30) return 'Fair';
    return 'Poor';
  }

  getLatencyColor(latency) {
    if (latency < 20) return '#28a745';
    if (latency < 50) return '#17a2b8';
    if (latency < 100) return '#ffc107';
    return '#f44336';
  }

  getJitterColor(jitter) {
    if (jitter < 5) return '#28a745';
    if (jitter < 15) return '#17a2b8';
    if (jitter < 30) return '#ffc107';
    return '#f44336';
  }

  addInsightsInteractivity(container) {
    // Add expand/collapse functionality
    const summary = container.querySelector('.ai-summary');
    if (summary) {
      summary.style.cursor = 'pointer';
      summary.addEventListener('click', () => {
        const details = container.querySelectorAll('.insights-section, .recommendations-section');
        details.forEach(detail => {
          detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
        });
      });
    }
  }

  showNotification(message, type = 'info') {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      z-index: 10000;
      font-size: 14px;
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  updateSpeedTestUI(state, message) {
    const speedElement = document.getElementById('speedSimple') || document.getElementById('speed');
    if (!speedElement) return;

    switch (state) {
      case 'loading':
        speedElement.textContent = message;
        speedElement.style.color = '#666';
        break;
      case 'error':
        speedElement.textContent = 'Test failed';
        speedElement.style.color = '#f44336';
        break;
    }
  }

  // Public API for existing code integration
  async runQuickTest() {
    return this.runEnhancedSpeedTest(true);
  }

  async runComprehensiveTest() {
    return this.runEnhancedSpeedTest(false);
  }

  isAvailable() {
    return this.isInitialized;
  }

  async getLastResults() {
    try {
      const stored = await chrome.storage.local.get('lastEnhancedSpeedTest');
      return stored.lastEnhancedSpeedTest || null;
    } catch (error) {
      return null;
    }
  }

  // Backward compatibility with existing speed test
  async runLegacySpeedTest() {
    // Fallback to original speed test if enhanced version fails
    try {
      const testUrl = "https://download.thinkbroadband.com/1MB.zip";
      const start = performance.now();
      
      const response = await fetch(testUrl);
      const blob = await response.blob();
      const end = performance.now();
      
      const duration = (end - start) / 1000;
      const bits = blob.size * 8;
      const mbps = (bits / duration) / 1_000_000;
      const speed = Math.round(mbps * 10) / 10;
      
      return {
        results: {
          download: { speed, success: true }
        },
        networkScore: this.calculateBasicScore(speed),
        grade: this.calculateBasicGrade(speed),
        testType: 'legacy'
      };
      
    } catch (error) {
      throw new Error('Legacy speed test failed');
    }
  }

  calculateBasicScore(speed) {
    if (speed > 50) return 90;
    if (speed > 25) return 75;
    if (speed > 10) return 60;
    if (speed > 5) return 45;
    return 30;
  }

  calculateBasicGrade(speed) {
    if (speed > 50) return 'A';
    if (speed > 25) return 'B';
    if (speed > 10) return 'C';
    return 'D';
  }
}

// CSS for enhanced UI elements
const enhancedSpeedTestCSS = `
  .ai-insights-container {
    margin-top: 12px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .ai-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    line-height: 1.4;
  }

  .ai-icon {
    font-size: 16px;
  }

  .insights-section, .recommendations-section {
    margin-top: 8px;
    display: none;
  }

  .insights-header, .recommendations-header {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 4px;
    text-transform: uppercase;
  }

  .insight-item, .recommendation-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    margin-bottom: 3px;
  }

  .capability-indicators {
    margin-top: 8px;
  }

  .capability-row {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .capability-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px;
    border-radius: 6px;
    font-size: 10px;
    min-width: 40px;
  }

  .capability-item.supported {
    background: rgba(40, 167, 69, 0.1);
    color: var(--success-color);
  }

  .capability-item.limited {
    background: rgba(108, 117, 125, 0.1);
    color: var(--text-secondary);
  }

  .cap-icon {
    font-size: 14px;
    margin-bottom: 2px;
  }

  .grade-badge {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
`;

// Inject CSS when module loads
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = enhancedSpeedTestCSS;
  document.head.appendChild(style);
}