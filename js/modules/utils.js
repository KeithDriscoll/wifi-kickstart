// Utility functions used across the application
export class Utils {
  static getTimestamp() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  static getFullTimestamp() {
    return new Date().toLocaleString();
  }

  static rgbToHex(color) {
    // Handle hex colors that are already in correct format
    if (color.startsWith('#')) return color;
    
    // Handle rgb colors
    const rgb = color.match(/\d+/g);
    if (rgb) {
      return '#' + rgb.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for named colors or other formats
    return '#0078d4';
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static isValidURL(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
}