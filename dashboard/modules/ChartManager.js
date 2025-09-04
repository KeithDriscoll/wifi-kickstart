/**
 * Chart Manager
 * Handles all chart creation and updates
 */

class ChartManager {
  constructor(state) {
    this.state = state;
    this.chartConfig = this.getChartConfig();
  }
  
  getChartConfig() {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      textColor: isDark ? '#e0d7f5' : '#2c3e50',
      gridColor: isDark ? '#3a2e50' : '#e1e4e8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };
  }
  
  createBaseOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: this.chartConfig.textColor,
            font: {
              family: this.chartConfig.fontFamily,
              size: 12
            },
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: {
            size: 13,
            weight: 600
          },
          bodyFont: {
            size: 12
          },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          ticks: {
            color: this.chartConfig.textColor,
            font: {
              size: 11
            }
          },
          grid: {
            color: this.chartConfig.gridColor,
            drawBorder: false
          }
        },
        y: {
          ticks: {
            color: this.chartConfig.textColor,
            font: {
              size: 11
            }
          },
          grid: {
            color: this.chartConfig.gridColor,
            drawBorder: false
          }
        }
      }
    };
  }
  
  initializeCharts() {
    // Performance Chart (Line)
    this.state.charts.performance = new Chart(
      document.getElementById('performanceChart'),
      {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Latency (ms)',
              data: [],
              borderColor: '#0078d4',
              backgroundColor: 'rgba(0, 120, 212, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 3,
              pointHoverRadius: 5
            },
            {
              label: 'Jitter (ms)',
              data: [],
              borderColor: '#f9a825',
              backgroundColor: 'rgba(249, 168, 37, 0.1)',
              tension: 0.4,
              fill: true,
              pointRadius: 3,
              pointHoverRadius: 5
            }
          ]
        },
        options: this.createBaseOptions()
      }
    );
    
    // Speed Chart (Bar)
    this.state.charts.speed = new Chart(
      document.getElementById('speedChart'),
      {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Download Speed (Mbps)',
            data: [],
            backgroundColor: 'rgba(40, 167, 69, 0.8)',
            borderColor: '#28a745',
            borderWidth: 2,
            borderRadius: 6,
            barPercentage: 0.8
          }]
        },
        options: {
          ...this.createBaseOptions(),
          plugins: {
            ...this.createBaseOptions().plugins,
            legend: {
              display: false
            }
          }
        }
      }
    );
    
    // Provider Chart (Doughnut) - Fixed to handle empty data
    this.state.charts.provider = new Chart(
      document.getElementById('providerChart'),
      {
        type: 'doughnut',
        data: {
          labels: ['No data yet'],
          datasets: [{
            data: [1],
            backgroundColor: ['#cccccc'],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: this.chartConfig.textColor,
                padding: 10,
                font: {
                  size: 11
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  if (context.label === 'No data yet') {
                    return 'Run diagnostics to collect provider data';
                  }
                  return context.label + ': ' + context.parsed + ' connections';
                }
              }
            }
          }
        }
      }
    );
    
    // Network Score Trend
    this.state.charts.score = new Chart(
      document.getElementById('scoreChart'),
      {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Network Score',
            data: [],
            borderColor: '#9333ea',
            backgroundColor: 'rgba(147, 51, 234, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#9333ea',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }]
        },
        options: {
          ...this.createBaseOptions(),
          scales: {
            ...this.createBaseOptions().scales,
            y: {
              ...this.createBaseOptions().scales.y,
              min: 0,
              max: 100
            }
          }
        }
      }
    );
    
    // Performance Distribution (Radar)
    this.state.charts.distribution = new Chart(
      document.getElementById('performanceDistChart'),
      {
        type: 'radar',
        data: {
          labels: ['Speed', 'Latency', 'Stability', 'Reliability', 'Consistency'],
          datasets: [{
            label: 'Current Performance',
            data: [0, 0, 0, 0, 0],
            borderColor: '#0078d4',
            backgroundColor: 'rgba(0, 120, 212, 0.2)',
            pointBackgroundColor: '#0078d4',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#0078d4',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: {
                color: this.chartConfig.textColor,
                backdropColor: 'transparent',
                stepSize: 20
              },
              grid: {
                color: this.chartConfig.gridColor
              },
              pointLabels: {
                color: this.chartConfig.textColor,
                font: {
                  size: 11,
                  weight: 600
                }
              }
            }
          }
        }
      }
    );
    
    // Quality Distribution (Pie)
    this.state.charts.quality = new Chart(
      document.getElementById('qualityChart'),
      {
        type: 'pie',
        data: {
          labels: ['Excellent', 'Good', 'Fair', 'Poor'],
          datasets: [{
            data: [0, 0, 0, 1],
            backgroundColor: [
              '#28a745',
              '#17a2b8',
              '#f9a825',
              '#cccccc'
            ],
            borderWidth: 2,
            borderColor: '#fff',
            hoverOffset: 15
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: this.chartConfig.textColor,
                padding: 15,
                font: {
                  size: 11
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  if (value === 0) {
                    return label + ': No data';
                  }
                  return label + ': ' + value + ' measurements';
                }
              }
            }
          }
        }
      }
    );
  }
  
  updateAllCharts() {
    const { data, charts } = this.state;
    
    if (!data.timestamps || data.timestamps.length === 0) {
      console.log('No data to display');
      return;
    }
    
    // Update Performance Chart
    if (charts.performance) {
      charts.performance.data.labels = data.timestamps;
      charts.performance.data.datasets[0].data = data.latencyHistory;
      charts.performance.data.datasets[1].data = data.jitterHistory;
      charts.performance.update('none');
    }
    
    // Update Speed Chart
    if (charts.speed) {
      charts.speed.data.labels = data.timestamps;
      charts.speed.data.datasets[0].data = data.speedHistory;
      charts.speed.update('none');
    }
    
    // Update Provider Chart - Fixed to handle Map properly
    if (charts.provider && data.providerHistory) {
      let providers = [];
      
      // Handle both Map and array formats
      if (data.providerHistory instanceof Map) {
        providers = Array.from(data.providerHistory.entries());
      } else if (Array.isArray(data.providerHistory)) {
        providers = data.providerHistory;
      }
      
      if (providers.length > 0) {
        // Sort providers by count (descending) and take top 6
        providers.sort((a, b) => b[1] - a[1]);
        const topProviders = providers.slice(0, 6);
        
        charts.provider.data.labels = topProviders.map(p => {
          // Shorten long provider names
          const name = p[0];
          return name.length > 20 ? name.substring(0, 20) + '...' : name;
        });
        charts.provider.data.datasets[0].data = topProviders.map(p => p[1]);
        
        // Update colors
        const colors = [
          '#0078d4',
          '#28a745',
          '#f9a825',
          '#d93025',
          '#9333ea',
          '#17a2b8'
        ];
        charts.provider.data.datasets[0].backgroundColor = colors.slice(0, topProviders.length);
      } else {
        // No provider data yet
        charts.provider.data.labels = ['No data yet'];
        charts.provider.data.datasets[0].data = [1];
        charts.provider.data.datasets[0].backgroundColor = ['#cccccc'];
      }
      
      charts.provider.update('none');
    }
    
    // Update Score Chart
    if (charts.score) {
      charts.score.data.labels = data.timestamps;
      charts.score.data.datasets[0].data = data.scoreHistory;
      charts.score.update('none');
    }
    
    // Update Performance Distribution
    if (charts.distribution) {
      const scores = this.calculatePerformanceScores();
      charts.distribution.data.datasets[0].data = scores;
      charts.distribution.update('none');
    }
    
    // Update Quality Distribution
    if (charts.quality) {
      const distribution = this.calculateQualityDistribution();
      const hasData = distribution.some(v => v > 0);
      
      if (hasData) {
        charts.quality.data.datasets[0].data = distribution;
        charts.quality.data.datasets[0].backgroundColor = [
          '#28a745',
          '#17a2b8',
          '#f9a825',
          '#d93025'
        ];
      } else {
        // Show placeholder when no data
        charts.quality.data.datasets[0].data = [0, 0, 0, 1];
        charts.quality.data.datasets[0].backgroundColor = [
          '#28a745',
          '#17a2b8',
          '#f9a825',
          '#cccccc'
        ];
      }
      charts.quality.update('none');
    }
  }
  
  calculatePerformanceScores() {
    return [
      this.calculateSpeedScore(),
      this.calculateLatencyScore(),
      this.calculateStabilityScore(),
      this.calculateReliabilityScore(),
      this.calculateConsistencyScore()
    ];
  }
  
  calculateSpeedScore() {
    const avg = this.state.getAverage('speed');
    if (!avg) return 0;
    // Scale: 0-10 Mbps = 0-50, 10-100 Mbps = 50-100
    return Math.min(100, avg < 10 ? (avg * 5) : (50 + (avg - 10) * 0.55));
  }
  
  calculateLatencyScore() {
    const avg = this.state.getAverage('latency');
    if (!avg) return 0;
    // Lower is better: <20ms = 100, >200ms = 0
    return Math.max(0, Math.min(100, 100 - ((avg - 20) / 1.8)));
  }
  
  calculateStabilityScore() {
    const jitter = this.state.getAverage('jitter');
    if (!jitter) return 0;
    // Lower is better: <5ms = 100, >50ms = 0
    return Math.max(0, Math.min(100, 100 - (jitter * 2)));
  }
  
  calculateReliabilityScore() {
    // Based on successful measurements vs total
    const total = this.state.data.timestamps.length;
    const successful = this.state.data.latencyHistory.filter(v => v !== null).length;
    return total > 0 ? (successful / total) * 100 : 0;
  }
  
  calculateConsistencyScore() {
    // Based on standard deviation of scores
    const scores = this.state.data.scoreHistory.filter(v => v !== null);
    if (scores.length < 2) return 0;
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower std dev is better: 0-5 = 100, >25 = 0
    return Math.max(0, Math.min(100, 100 - (stdDev * 4)));
  }
  
  calculateQualityDistribution() {
    const scores = this.state.data.scoreHistory.filter(v => v !== null);
    const distribution = [0, 0, 0, 0]; // Excellent, Good, Fair, Poor
    
    scores.forEach(score => {
      if (score >= 80) distribution[0]++;
      else if (score >= 60) distribution[1]++;
      else if (score >= 40) distribution[2]++;
      else distribution[3]++;
    });
    
    return distribution;
  }
  
  refreshChart(chartType) {
    const chart = this.state.charts[chartType];
    if (chart) {
      chart.update();
      return true;
    }
    return false;
  }
  resizeChart(chartType) {
  const chart = this.state.charts[chartType];
  if (chart && typeof chart.resize === 'function') {
    chart.resize();
    return true;
  }
  return false;
}

  resizeAllCharts() {
    Object.values(this.state.charts).forEach(chart => {
      if (chart && typeof chart.resize === 'function') {
        chart.resize();
      }
    });
  }
}