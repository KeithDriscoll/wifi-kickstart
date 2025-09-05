// AI Explanation Engine - Smart interpretations and recommendations
// File: js/modules/ai/ExplanationEngine.js

export class ExplanationEngine {
  constructor() {
    this.userProfile = {
      typicalSpeeds: [],
      commonIssues: [],
      usagePatterns: {},
      preferences: {
        technicalLevel: 'simple' // simple, intermediate, technical
      }
    };
    this.contextualKnowledge = this.initializeKnowledge();
    this.loadUserProfile();
  }

  initializeKnowledge() {
    return {
      // ISP patterns and known issues
      ispProfiles: {
        'comcast': { uploadLimitation: true, peakHourSlowdown: true },
        'verizon': { fiberExcellent: true, dslLimited: true },
        'att': { variablePerformance: true },
        'charter': { uploadBottleneck: true },
        'cox': { datacapIssues: true }
      },

      // Connection type characteristics
      connectionTypes: {
        fiber: { symmetric: true, lowLatency: true, consistent: true },
        cable: { asymmetric: true, sharedBandwidth: true, variable: true },
        dsl: { distanceDependent: true, lowUpload: true, stable: true },
        satellite: { highLatency: true, weatherSensitive: true },
        cellular: { variable: true, locationDependent: true }
      },

      // Common issue patterns
      issuePatterns: {
        highLatencyLowSpeed: 'network_congestion',
        goodSpeedHighJitter: 'wifi_interference',
        lowUploadGoodDownload: 'isp_limitation',
        inconsistentSpeeds: 'shared_bandwidth',
        goodSpeedPoorGaming: 'bufferbloat'
      },

      // Usage scenario requirements
      usageRequirements: {
        streaming: {
          '720p': { download: 3, upload: 1, latency: 200 },
          '1080p': { download: 5, upload: 1, latency: 200 },
          '4K': { download: 25, upload: 1, latency: 200 }
        },
        gaming: {
          casual: { latency: 100, jitter: 50 },
          competitive: { latency: 50, jitter: 20 },
          professional: { latency: 20, jitter: 10 }
        },
        videoCall: {
          basic: { download: 1, upload: 1, latency: 150 },
          hd: { download: 3, upload: 3, latency: 100 },
          group: { download: 5, upload: 5, latency: 80 }
        },
        workFromHome: {
          basic: { download: 10, upload: 5, latency: 100 },
          advanced: { download: 50, upload: 20, latency: 50 }
        }
      }
    };
  }

  async generateExplanation(speedTestResults) {
    const explanation = {
      summary: '',
      insights: [],
      recommendations: [],
      technicalDetails: {},
      userContext: {},
      confidence: 0
    };

    try {
      // Analyze the results comprehensively
      const analysis = await this.analyzeResults(speedTestResults);
      
      // Generate user-appropriate explanation
      explanation.summary = this.generateSummary(analysis);
      explanation.insights = this.generateInsights(analysis);
      explanation.recommendations = this.generateRecommendations(analysis);
      explanation.technicalDetails = this.generateTechnicalDetails(analysis);
      explanation.userContext = this.generateUserContext(analysis);
      explanation.confidence = this.calculateConfidence(analysis);

      // Learn from this test for future explanations
      await this.updateUserProfile(speedTestResults, analysis);

      return explanation;

    } catch (error) {
      console.error('Failed to generate explanation:', error);
      return this.generateFallbackExplanation(speedTestResults);
    }
  }

  async analyzeResults(results) {
    const analysis = {
      performance: this.analyzePerformance(results),
      patterns: this.identifyPatterns(results),
      issues: this.identifyIssues(results),
      capabilities: this.assessCapabilities(results),
      historical: await this.compareWithHistory(results),
      contextual: this.getContextualFactors(results)
    };

    return analysis;
  }

  analyzePerformance(results) {
    const performance = {
      download: results.results.download?.speed || 0,
      upload: results.results.upload?.speed || 0,
      latency: results.results.latency?.average || 0,
      jitter: results.results.jitter?.average || 0,
      consistency: results.results.download?.consistency || 0,
      grade: results.grade || 'Unknown'
    };

    // Categorize each metric
    performance.downloadCategory = this.categorizeSpeed(performance.download, 'download');
    performance.uploadCategory = this.categorizeSpeed(performance.upload, 'upload');
    performance.latencyCategory = this.categorizeLatency(performance.latency);
    performance.jitterCategory = this.categorizeJitter(performance.jitter);

    return performance;
  }

  identifyPatterns(results) {
    const patterns = [];

    const download = results.results.download?.speed || 0;
    const upload = results.results.upload?.speed || 0;
    const latency = results.results.latency?.average || 0;
    const jitter = results.results.jitter?.average || 0;

    // Asymmetric connection pattern
    if (upload > 0 && download / upload > 10) {
      patterns.push({
        type: 'asymmetric_connection',
        confidence: 90,
        description: 'Typical cable internet with much faster download than upload'
      });
    }

    // Symmetric connection pattern
    if (upload > 0 && Math.abs(download - upload) / Math.max(download, upload) < 0.2) {
      patterns.push({
        type: 'symmetric_connection',
        confidence: 85,
        description: 'Fiber-like connection with similar upload and download speeds'
      });
    }

    // High latency pattern
    if (latency > 100 && download > 10) {
      patterns.push({
        type: 'satellite_or_distance',
        confidence: 70,
        description: 'Good speeds but high latency suggests satellite or distant server'
      });
    }

    // Gaming-optimized pattern
    if (latency < 30 && jitter < 10) {
      patterns.push({
        type: 'gaming_optimized',
        confidence: 80,
        description: 'Low latency and jitter ideal for gaming'
      });
    }

    // Congestion pattern
    if (results.results.download?.consistency < 70) {
      patterns.push({
        type: 'network_congestion',
        confidence: 60,
        description: 'Inconsistent speeds suggest network congestion or interference'
      });
    }

    return patterns;
  }

  identifyIssues(results) {
    const issues = [];

    const download = results.results.download?.speed || 0;
    const upload = results.results.upload?.speed || 0;
    const latency = results.results.latency?.average || 0;
    const jitter = results.results.jitter?.average || 0;
    const consistency = results.results.download?.consistency || 100;

    // Speed issues
    if (download < 1) {
      issues.push({
        type: 'very_slow_download',
        severity: 'high',
        impact: 'Most online activities will be difficult',
        solutions: ['Check for network outages', 'Restart modem/router', 'Contact ISP']
      });
    } else if (download < 5) {
      issues.push({
        type: 'slow_download',
        severity: 'medium',
        impact: 'Streaming and large downloads will be slow',
        solutions: ['Check for background downloads', 'Test at different times', 'Consider plan upgrade']
      });
    }

    if (upload > 0 && upload < 1) {
      issues.push({
        type: 'very_slow_upload',
        severity: 'medium',
        impact: 'Video calls and file uploads will struggle',
        solutions: ['Check upload usage', 'Test wired vs WiFi', 'Contact ISP about upload speeds']
      });
    }

    // Latency issues
    if (latency > 150) {
      issues.push({
        type: 'high_latency',
        severity: 'high',
        impact: 'Gaming and video calls will have delays',
        solutions: ['Check for VPN usage', 'Test different servers', 'Consider wired connection']
      });
    }

    // Consistency issues
    if (consistency < 60) {
      issues.push({
        type: 'inconsistent_speeds',
        severity: 'medium',
        impact: 'Streaming may buffer, downloads may stall',
        solutions: ['Check WiFi signal strength', 'Test during off-peak hours', 'Scan for interference']
      });
    }

    // Jitter issues
    if (jitter > 50) {
      issues.push({
        type: 'high_jitter',
        severity: 'medium',
        impact: 'Video calls may have audio/video sync issues',
        solutions: ['Check network stability', 'Test wired connection', 'Restart network equipment']
      });
    }

    return issues;
  }

  assessCapabilities(results) {
    const download = results.results.download?.speed || 0;
    const upload = results.results.upload?.speed || 0;
    const latency = results.results.latency?.average || 0;
    const jitter = results.results.jitter?.average || 0;

    const capabilities = {
      streaming: {},
      gaming: {},
      videoCall: {},
      workFromHome: {},
      fileTransfer: {}
    };

    // Streaming capabilities
    capabilities.streaming = {
      sd: download >= 1,
      hd: download >= 5,
      fourK: download >= 25,
      multipleDevices: download >= 50,
      quality: download >= 25 ? '4K' : download >= 5 ? 'HD' : download >= 1 ? 'SD' : 'Poor'
    };

    // Gaming capabilities
    capabilities.gaming = {
      possible: latency < 200,
      casual: latency < 100,
      competitive: latency < 50 && jitter < 20,
      professional: latency < 20 && jitter < 10,
      latencyGrade: latency < 20 ? 'Excellent' : latency < 50 ? 'Good' : latency < 100 ? 'Fair' : 'Poor'
    };

    // Video call capabilities
    capabilities.videoCall = {
      audio: download >= 0.1 && upload >= 0.1,
      basicVideo: download >= 1 && upload >= 1 && latency < 200,
      hdVideo: download >= 3 && upload >= 3 && latency < 150,
      groupCalls: download >= 5 && upload >= 5 && latency < 100,
      quality: this.determineVideoCallQuality(download, upload, latency)
    };

    // Work from home capabilities
    capabilities.workFromHome = {
      basicTasks: download >= 5 && upload >= 1,
      videoConferencing: download >= 10 && upload >= 5 && latency < 100,
      cloudWork: download >= 25 && upload >= 10,
      contentCreation: download >= 50 && upload >= 20,
      suitability: this.determineWorkSuitability(download, upload, latency)
    };

    // File transfer capabilities
    capabilities.fileTransfer = {
      smallFiles: download >= 1,
      mediumFiles: download >= 10,
      largeFiles: download >= 50,
      estimates: this.calculateTransferTimes(download)
    };

    return capabilities;
  }

  async compareWithHistory(results) {
    try {
      const history = await this.getSpeedTestHistory();
      if (history.length < 2) {
        return { hasHistory: false, message: 'Not enough historical data for comparison' };
      }

      const recent = history.slice(-5); // Last 5 tests
      const currentSpeed = results.results.download?.speed || 0;
      const currentLatency = results.results.latency?.average || 0;

      const avgSpeed = recent.reduce((sum, test) => 
        sum + (test.results.download?.speed || 0), 0) / recent.length;
      const avgLatency = recent.reduce((sum, test) => 
        sum + (test.results.latency?.average || 0), 0) / recent.length;

      const speedChange = ((currentSpeed - avgSpeed) / avgSpeed) * 100;
      const latencyChange = ((currentLatency - avgLatency) / avgLatency) * 100;

      return {
        hasHistory: true,
        speedChange: Math.round(speedChange),
        latencyChange: Math.round(latencyChange),
        trend: this.analyzeTrend(recent),
        comparison: this.generateComparison(speedChange, latencyChange)
      };

    } catch (error) {
      return { hasHistory: false, error: error.message };
    }
  }

  getContextualFactors(results) {
    const factors = {
      timeOfDay: this.getTimeContext(),
      deviceInfo: this.getDeviceContext(),
      networkInfo: this.getNetworkContext(results),
      locationHints: this.getLocationHints(results)
    };

    return factors;
  }

  generateSummary(analysis) {
    const perf = analysis.performance;
    const caps = analysis.capabilities;
    
    if (this.userProfile.preferences.technicalLevel === 'simple') {
      return this.generateSimpleSummary(perf, caps);
    } else if (this.userProfile.preferences.technicalLevel === 'technical') {
      return this.generateTechnicalSummary(perf, caps, analysis);
    } else {
      return this.generateIntermediateSummary(perf, caps, analysis);
    }
  }

  generateSimpleSummary(perf, caps) {
    const summaries = [];

    // Overall assessment
    if (perf.grade === 'A+' || perf.grade === 'A') {
      summaries.push("🚀 Your internet is blazing fast!");
    } else if (perf.grade === 'B+' || perf.grade === 'B') {
      summaries.push("✅ Your internet is working well!");
    } else if (perf.grade === 'C+' || perf.grade === 'C') {
      summaries.push("⚡ Your internet is okay for basic tasks.");
    } else {
      summaries.push("🐌 Your internet might be slower than expected.");
    }

    // Key capabilities
    if (caps.streaming.fourK) {
      summaries.push("Perfect for 4K streaming and multiple devices.");
    } else if (caps.streaming.hd) {
      summaries.push("Great for HD streaming and video calls.");
    } else if (caps.streaming.sd) {
      summaries.push("Suitable for basic streaming and web browsing.");
    }

    if (caps.gaming.competitive) {
      summaries.push("Excellent for online gaming with low lag.");
    } else if (caps.gaming.casual) {
      summaries.push("Good for casual online gaming.");
    }

    return summaries.join(' ');
  }

  generateTechnicalSummary(perf, caps, analysis) {
    const details = [];

    details.push(`Download: ${perf.download} Mbps (${perf.downloadCategory})`);
    if (perf.upload > 0) {
      details.push(`Upload: ${perf.upload} Mbps (${perf.uploadCategory})`);
    }
    details.push(`Latency: ${perf.latency}ms (${perf.latencyCategory})`);
    details.push(`Jitter: ${perf.jitter}ms (${perf.jitterCategory})`);
    details.push(`Consistency: ${perf.consistency}%`);

    // Add pattern analysis
    if (analysis.patterns.length > 0) {
      const primaryPattern = analysis.patterns[0];
      details.push(`Connection pattern: ${primaryPattern.description}`);
    }

    return details.join(' | ');
  }

  generateIntermediateSummary(perf, caps, analysis) {
    const summary = [];

    // Performance overview
    summary.push(`Your connection delivers ${perf.download} Mbps download`);
    if (perf.upload > 0) {
      summary.push(`and ${perf.upload} Mbps upload`);
    }
    summary.push(`with ${perf.latency}ms response time.`);

    // Key insight
    if (caps.streaming.fourK && caps.gaming.competitive) {
      summary.push("This is excellent for all online activities including 4K streaming and competitive gaming.");
    } else if (caps.streaming.hd && caps.videoCall.hdVideo) {
      summary.push("This handles HD streaming and video calls smoothly.");
    } else if (caps.streaming.sd) {
      summary.push("This covers basic internet needs like web browsing and standard video.");
    }

    return summary.join(' ');
  }

  generateInsights(analysis) {
    const insights = [];

    // Performance insights
    insights.push(...this.generatePerformanceInsights(analysis.performance));
    
    // Pattern insights
    insights.push(...this.generatePatternInsights(analysis.patterns));
    
    // Historical insights
    if (analysis.historical.hasHistory) {
      insights.push(...this.generateHistoricalInsights(analysis.historical));
    }
    
    // Contextual insights
    insights.push(...this.generateContextualInsights(analysis.contextual));

    return insights.slice(0, 5); // Limit to top 5 insights
  }

  generatePerformanceInsights(perf) {
    const insights = [];

    // Speed insights
    if (perf.download > 100) {
      insights.push({
        type: 'positive',
        title: 'Ultra-fast download speed',
        description: `Your ${perf.download} Mbps download speed is in the top 10% of connections.`,
        confidence: 95
      });
    }

    if (perf.upload > 0 && perf.download / perf.upload < 3) {
      insights.push({
        type: 'positive',
        title: 'Balanced upload/download',
        description: 'Your connection has good upload speeds, ideal for video calls and content creation.',
        confidence: 85
      });
    }

    // Latency insights
    if (perf.latency < 20) {
      insights.push({
        type: 'positive',
        title: 'Excellent responsiveness',
        description: `${perf.latency}ms latency is perfect for real-time gaming and video calls.`,
        confidence: 90
      });
    } else if (perf.latency > 150) {
      insights.push({
        type: 'concern',
        title: 'High response time',
        description: `${perf.latency}ms latency may cause delays in interactive applications.`,
        confidence: 80
      });
    }

    // Consistency insights
    if (perf.consistency < 60) {
      insights.push({
        type: 'concern',
        title: 'Inconsistent performance',
        description: 'Your connection speed varies significantly, which may cause buffering.',
        confidence: 75
      });
    }

    return insights;
  }

  generatePatternInsights(patterns) {
    return patterns.map(pattern => ({
      type: 'info',
      title: this.getPatternTitle(pattern.type),
      description: pattern.description,
      confidence: pattern.confidence
    }));
  }

  generateHistoricalInsights(historical) {
    const insights = [];

    if (Math.abs(historical.speedChange) > 20) {
      insights.push({
        type: historical.speedChange > 0 ? 'positive' : 'concern',
        title: `Speed ${historical.speedChange > 0 ? 'improved' : 'decreased'}`,
        description: `Your speed is ${Math.abs(historical.speedChange)}% ${historical.speedChange > 0 ? 'faster' : 'slower'} than usual.`,
        confidence: 80
      });
    }

    if (historical.trend) {
      insights.push({
        type: 'info',
        title: 'Performance trend',
        description: historical.trend,
        confidence: 70
      });
    }

    return insights;
  }

  generateContextualInsights(contextual) {
    const insights = [];

    if (contextual.timeOfDay.isPeakHours) {
      insights.push({
        type: 'info',
        title: 'Peak hours detected',
        description: 'Testing during peak hours (7-10 PM) may show slower speeds due to network congestion.',
        confidence: 70
      });
    }

    if (contextual.networkInfo.isWiFi) {
      insights.push({
        type: 'tip',
        title: 'WiFi connection detected',
        description: 'For maximum speed, try testing with a wired ethernet connection.',
        confidence: 65
      });
    }

    return insights;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Performance-based recommendations
    recommendations.push(...this.getPerformanceRecommendations(analysis.performance));
    
    // Issue-based recommendations
    recommendations.push(...this.getIssueRecommendations(analysis.issues));
    
    // Capability-based recommendations
    recommendations.push(...this.getCapabilityRecommendations(analysis.capabilities));

    return recommendations.slice(0, 3); // Limit to top 3 recommendations
  }

  getPerformanceRecommendations(perf) {
    const recommendations = [];

    if (perf.download < 25 && perf.downloadCategory !== 'excellent') {
      recommendations.push({
        type: 'upgrade',
        priority: 'medium',
        title: 'Consider a speed upgrade',
        description: 'For 4K streaming and heavy usage, consider upgrading to a faster plan.',
        actionable: true
      });
    }

    if (perf.upload > 0 && perf.upload < 5) {
      recommendations.push({
        type: 'upgrade',
        priority: 'low',
        title: 'Upload speed limitation',
        description: 'Low upload speeds may affect video calls and file sharing.',
        actionable: true
      });
    }

    if (perf.latency > 100) {
      recommendations.push({
        type: 'optimize',
        priority: 'high',
        title: 'Reduce network latency',
        description: 'High latency affects gaming and video calls. Try using a wired connection.',
        actionable: true
      });
    }

    return recommendations;
  }

  getIssueRecommendations(issues) {
    return issues.map(issue => ({
      type: 'fix',
      priority: issue.severity === 'high' ? 'high' : 'medium',
      title: `Fix ${issue.type.replace(/_/g, ' ')}`,
      description: issue.solutions[0], // Primary solution
      actionable: true,
      allSolutions: issue.solutions
    }));
  }

  getCapabilityRecommendations(capabilities) {
    const recommendations = [];

    if (!capabilities.videoCall.hdVideo) {
      recommendations.push({
        type: 'limitation',
        priority: 'medium',
        title: 'Video call quality may be limited',
        description: 'For better video calls, ensure no other devices are using bandwidth.',
        actionable: true
      });
    }

    if (!capabilities.streaming.fourK && capabilities.streaming.hd) {
      recommendations.push({
        type: 'info',
        priority: 'low',
        title: '4K streaming not supported',
        description: 'Your connection is great for HD but may struggle with 4K content.',
        actionable: false
      });
    }

    return recommendations;
  }

  // Helper methods

  categorizeSpeed(speed, type) {
    if (type === 'download') {
      if (speed >= 100) return 'excellent';
      if (speed >= 50) return 'very_good';
      if (speed >= 25) return 'good';
      if (speed >= 10) return 'fair';
      if (speed >= 5) return 'slow';
      return 'very_slow';
    } else { // upload
      if (speed >= 50) return 'excellent';
      if (speed >= 20) return 'very_good';
      if (speed >= 10) return 'good';
      if (speed >= 5) return 'fair';
      if (speed >= 1) return 'slow';
      return 'very_slow';
    }
  }

  categorizeLatency(latency) {
    if (latency < 20) return 'excellent';
    if (latency < 50) return 'good';
    if (latency < 100) return 'fair';
    if (latency < 200) return 'slow';
    return 'very_slow';
  }

  categorizeJitter(jitter) {
    if (jitter < 5) return 'excellent';
    if (jitter < 15) return 'good';
    if (jitter < 30) return 'fair';
    if (jitter < 50) return 'poor';
    return 'very_poor';
  }

  determineVideoCallQuality(download, upload, latency) {
    if (download >= 5 && upload >= 5 && latency < 100) return 'HD';
    if (download >= 3 && upload >= 3 && latency < 150) return 'Good';
    if (download >= 1 && upload >= 1 && latency < 200) return 'Basic';
    return 'Poor';
  }

  determineWorkSuitability(download, upload, latency) {
    if (download >= 50 && upload >= 20 && latency < 50) return 'Excellent for all work tasks';
    if (download >= 25 && upload >= 10 && latency < 100) return 'Great for cloud work';
    if (download >= 10 && upload >= 5 && latency < 150) return 'Good for basic work';
    return 'Limited for professional work';
  }

  calculateTransferTimes(speed) {
    const speedMBps = speed / 8; // Convert to MB/s
    return {
      '1GB': this.formatTransferTime(1000 / speedMBps),
      '10GB': this.formatTransferTime(10000 / speedMBps),
      '100GB': this.formatTransferTime(100000 / speedMBps)
    };
  }

  formatTransferTime(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  }

  getTimeContext() {
    const hour = new Date().getHours();
    return {
      hour,
      isPeakHours: hour >= 19 && hour <= 22, // 7-10 PM
      isBusinessHours: hour >= 9 && hour <= 17,
      timeCategory: this.getTimeCategory(hour)
    };
  }

  getTimeCategory(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  getDeviceContext() {
    const ua = navigator.userAgent;
    return {
      isMobile: /Mobile|Android|iPhone|iPad/.test(ua),
      browser: this.detectBrowser(ua),
      platform: this.detectPlatform(ua)
    };
  }

  getNetworkContext(results) {
    const conn = navigator.connection;
    return {
      type: conn?.effectiveType || 'unknown',
      isWiFi: this.isLikelyWiFi(results),
      estimatedType: this.estimateConnectionType(results)
    };
  }

  isLikelyWiFi(results) {
    // Heuristic: WiFi often has higher jitter than wired
    const jitter = results.results.jitter?.average || 0;
    return jitter > 10;
  }

  estimateConnectionType(results) {
    const download = results.results.download?.speed || 0;
    const upload = results.results.upload?.speed || 0;
    const latency = results.results.latency?.average || 0;

    if (upload > 0 && Math.abs(download - upload) / Math.max(download, upload) < 0.3) {
      return 'fiber';
    }
    if (download > 50 && upload < download / 3) {
      return 'cable';
    }
    if (latency > 500) {
      return 'satellite';
    }
    if (download < 25) {
      return 'dsl';
    }
    return 'unknown';
  }

  getLocationHints(results) {
    // Could integrate with IP geolocation for regional insights
    return {
      hasLocationData: false,
      region: 'unknown'
    };
  }

  analyzeTrend(recentTests) {
    if (recentTests.length < 3) return null;

    const speeds = recentTests.map(test => test.results.download?.speed || 0);
    const isImproving = speeds[speeds.length - 1] > speeds[0];
    const isStable = Math.max(...speeds) - Math.min(...speeds) < speeds[0] * 0.2;

    if (isStable) return 'Your connection has been consistent over time';
    if (isImproving) return 'Your connection speeds have been improving';
    return 'Your connection speeds have been variable';
  }

  generateComparison(speedChange, latencyChange) {
    if (Math.abs(speedChange) < 10 && Math.abs(latencyChange) < 10) {
      return 'Your connection is performing consistently with previous tests';
    }
    
    const changes = [];
    if (Math.abs(speedChange) > 10) {
      changes.push(`Speed ${speedChange > 0 ? 'improved' : 'decreased'} by ${Math.abs(speedChange)}%`);
    }
    if (Math.abs(latencyChange) > 10) {
      changes.push(`Latency ${latencyChange > 0 ? 'increased' : 'improved'} by ${Math.abs(latencyChange)}%`);
    }
    
    return changes.join(', ');
  }

  getPatternTitle(patternType) {
    const titles = {
      'asymmetric_connection': 'Asymmetric Connection',
      'symmetric_connection': 'Symmetric Connection',
      'satellite_or_distance': 'High Latency Connection',
      'gaming_optimized': 'Gaming-Optimized Connection',
      'network_congestion': 'Network Congestion Detected'
    };
    return titles[patternType] || 'Connection Pattern';
  }

  async getSpeedTestHistory() {
    try {
      const stored = await chrome.storage.local.get('speedTestHistory');
      return stored.speedTestHistory || [];
    } catch (error) {
      return [];
    }
  }

  async updateUserProfile(results, analysis) {
    // Learn from user's connection patterns
    this.userProfile.typicalSpeeds.push({
      download: results.results.download?.speed || 0,
      upload: results.results.upload?.speed || 0,
      timestamp: Date.now()
    });

    // Keep only recent data
    if (this.userProfile.typicalSpeeds.length > 20) {
      this.userProfile.typicalSpeeds = this.userProfile.typicalSpeeds.slice(-20);
    }

    // Store updated profile
    await chrome.storage.local.set({
      aiUserProfile: this.userProfile
    });
  }

  async loadUserProfile() {
    try {
      const stored = await chrome.storage.local.get('aiUserProfile');
      if (stored.aiUserProfile) {
        this.userProfile = { ...this.userProfile, ...stored.aiUserProfile };
      }
    } catch (error) {
      console.warn('Could not load user profile:', error);
    }
  }

  generateTechnicalDetails(analysis) {
    return {
      performanceMetrics: analysis.performance,
      identifiedPatterns: analysis.patterns,
      detectedIssues: analysis.issues,
      connectionEstimate: analysis.contextual.networkInfo.estimatedType,
      testReliability: this.assessTestReliability(analysis)
    };
  }

  generateUserContext(analysis) {
    return {
      bestUseCases: this.getBestUseCases(analysis.capabilities),
      limitations: this.getLimitations(analysis.capabilities),
      comparisonToTypical: this.getTypicalComparison(analysis.performance)
    };
  }

  getBestUseCases(capabilities) {
    const useCases = [];
    
    if (capabilities.streaming.fourK) useCases.push('4K streaming');
    if (capabilities.gaming.competitive) useCases.push('Competitive gaming');
    if (capabilities.videoCall.hdVideo) useCases.push('HD video calls');
    if (capabilities.workFromHome.cloudWork) useCases.push('Cloud-based work');
    
    return useCases;
  }

  getLimitations(capabilities) {
    const limitations = [];
    
    if (!capabilities.streaming.fourK) limitations.push('4K streaming may buffer');
    if (!capabilities.gaming.competitive) limitations.push('High-latency gaming');
    if (!capabilities.videoCall.hdVideo) limitations.push('HD video calls may struggle');
    
    return limitations;
  }

  getTypicalComparison(performance) {
    // Compare to general population statistics
    if (performance.download > 100) return 'Top 10% of connections';
    if (performance.download > 50) return 'Faster than average';
    if (performance.download > 25) return 'About average';
    return 'Below average speed';
  }

  assessTestReliability(analysis) {
    let reliability = 100;
    
    if (analysis.performance.consistency < 70) reliability -= 20;
    if (analysis.contextual.timeOfDay.isPeakHours) reliability -= 10;
    if (analysis.contextual.networkInfo.isWiFi) reliability -= 15;
    
    return Math.max(50, reliability);
  }

  calculateConfidence(analysis) {
    let confidence = 80; // Base confidence
    
    // Reduce confidence for edge cases
    if (analysis.issues.length > 2) confidence -= 15;
    if (analysis.performance.consistency < 60) confidence -= 10;
    if (!analysis.historical.hasHistory) confidence -= 5;
    
    return Math.max(50, Math.min(95, confidence));
  }

  generateFallbackExplanation(results) {
    const download = results.results.download?.speed || 0;
    
    return {
      summary: `Your connection provides ${download} Mbps download speed.`,
      insights: [{
        type: 'info',
        title: 'Basic speed test completed',
        description: 'Run more tests to get detailed insights and recommendations.',
        confidence: 60
      }],
      recommendations: [{
        type: 'info',
        priority: 'low',
        title: 'Get more insights',
        description: 'Enable comprehensive testing for detailed analysis.',
        actionable: true
      }],
      technicalDetails: {},
      userContext: {},
      confidence: 60
    };
  }

  // Utility methods
  detectBrowser(ua) {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  detectPlatform(ua) {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }
}