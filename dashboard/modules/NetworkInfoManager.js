/**
 * Network Information Manager
 * Handles network info display and updates
 */

class NetworkInfoManager {
  constructor() {
    this.elements = {
      ipAddress: document.getElementById('ipAddress'),
      location: document.getElementById('location'),
      provider: document.getElementById('provider'),
      warpStatus: document.getElementById('warpStatus'),
      vpnStatus: document.getElementById('vpnStatus'),
      connectionType: document.getElementById('connectionType')
    };
  }
  
  async loadNetworkInfo() {
    if (!chrome.runtime) {
      this.showNotAvailable();
      return;
    }
    
    try {
      // Request network info from extension
      chrome.runtime.sendMessage({ action: 'getNetworkInfo' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Extension error:', chrome.runtime.lastError);
          this.showNotAvailable();
          return;
        }
        
        if (response && response.success) {
          this.updateNetworkInfo(response.data);
        } else {
          this.showNotAvailable();
        }
      });
    } catch (error) {
      console.error('Failed to load network info:', error);
      this.showNotAvailable();
    }
  }
  
  updateNetworkInfo(data) {
    if (!data) return;
    
    // Update IP Address
    if (this.elements.ipAddress) {
      this.elements.ipAddress.textContent = data.ip || 'Unknown';
      this.removeLoadingState(this.elements.ipAddress);
    }
    
    // Update Location
    if (this.elements.location) {
      this.elements.location.textContent = data.location || 'Unknown';
      this.removeLoadingState(this.elements.location);
    }
    
    // Update Provider
    if (this.elements.provider) {
      this.elements.provider.textContent = data.provider || 'Unknown';
      this.removeLoadingState(this.elements.provider);
    }
    
    // Update WARP Status
    if (this.elements.warpStatus) {
      const warpActive = data.warpActive || false;
      this.elements.warpStatus.innerHTML = warpActive 
        ? '<span style="color: var(--success-color)">✓ Active</span>'
        : '<span style="color: var(--text-secondary)">Inactive</span>';
      this.removeLoadingState(this.elements.warpStatus);
    }
    
    // Update VPN Status
    if (this.elements.vpnStatus) {
      const vpnActive = data.vpnActive || false;
      this.elements.vpnStatus.innerHTML = vpnActive
        ? '<span style="color: var(--warning-color)">⚠ Detected</span>'
        : '<span style="color: var(--success-color)">✓ None</span>';
      this.removeLoadingState(this.elements.vpnStatus);
    }
    
    // Update Connection Type
    if (this.elements.connectionType) {
      const type = this.detectConnectionType(data);
      this.elements.connectionType.textContent = type;
      this.removeLoadingState(this.elements.connectionType);
    }
  }
  
  detectConnectionType(data) {
    // Simple heuristic based on provider name
    const provider = (data.provider || '').toLowerCase();
    
    if (provider.includes('fiber') || provider.includes('fios')) {
      return 'Fiber';
    } else if (provider.includes('cable') || provider.includes('comcast') || provider.includes('spectrum')) {
      return 'Cable';
    } else if (provider.includes('dsl') || provider.includes('att')) {
      return 'DSL';
    } else if (provider.includes('mobile') || provider.includes('cellular') || provider.includes('lte')) {
      return 'Mobile/Cellular';
    } else if (provider.includes('satellite')) {
      return 'Satellite';
    }
    
    return 'Broadband';
  }
  
  removeLoadingState(element) {
    if (!element) return;
    
    // Remove loading spinner if present
    const spinner = element.querySelector('.loading-spinner');
    if (spinner) {
      spinner.remove();
    }
    
    // Remove loading class if present
    element.classList.remove('loading');
  }
  
  showNotAvailable() {
    Object.values(this.elements).forEach(el => {
      if (el) {
        el.textContent = 'N/A';
        this.removeLoadingState(el);
      }
    });
  }
  
  // Get current network info as object
  getCurrentInfo() {
    const info = {};
    Object.keys(this.elements).forEach(key => {
      const el = this.elements[key];
      if (el) {
        info[key] = el.textContent;
      }
    });
    return info;
  }
}