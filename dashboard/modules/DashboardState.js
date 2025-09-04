/**
 * Dashboard State Management
 * Handles all dashboard data and state
 */

class DashboardState {
  constructor() {
    this.data = {
      latencyHistory: [],
      speedHistory: [],
      jitterHistory: [],
      scoreHistory: [],
      timestamps: [],
      providerHistory: new Map(),
      vpnHistory: { active: 0, inactive: 0 }
    };
    
    this.charts = {};
    this.config = {
      maxDataPoints: 50,
      refreshInterval: 10000, // 10 seconds
      animationDuration: 250
    };
    
    this.isExtensionAvailable = typeof chrome !== 'undefined' && chrome.runtime;
  }
  
  updateData(newData) {
    if (!newData) return;
    
    this.data = { ...this.data, ...newData };
    this.trimDataPoints();
  }
  
  trimDataPoints() {
    const max = this.config.maxDataPoints;
    Object.keys(this.data).forEach(key => {
      if (Array.isArray(this.data[key]) && this.data[key].length > max) {
        this.data[key] = this.data[key].slice(-max);
      }
    });
  }
  
  getLatestValue(key) {
    const arr = this.data[`${key}History`];
    return arr && arr.length > 0 ? arr[arr.length - 1] : null;
  }
  
  getAverage(key) {
    const arr = this.data[`${key}History`];
    if (!arr || arr.length === 0) return null;
    
    const validValues = arr.filter(v => v !== null && !isNaN(v));
    if (validValues.length === 0) return null;
    
    const sum = validValues.reduce((a, b) => a + b, 0);
    return (sum / validValues.length).toFixed(2);
  }
  
  getBestScore() {
    const scores = this.data.scoreHistory.filter(v => v !== null);
    return scores.length > 0 ? Math.max(...scores) : null;
  }
  
  getDataPointCount() {
    return this.data.timestamps.length;
  }
  
  getLastUpdateTime() {
    const count = this.data.timestamps.length;
    return count > 0 ? this.data.timestamps[count - 1] : 'Never';
  }
  
  clearAllData() {
    this.data = {
      latencyHistory: [],
      speedHistory: [],
      jitterHistory: [],
      scoreHistory: [],
      timestamps: [],
      providerHistory: new Map(),
      vpnHistory: { active: 0, inactive: 0 }
    };
  }
}