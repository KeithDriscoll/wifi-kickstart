// Theme and appearance management
export class ThemeManager {
  constructor() {
    this.themes = {
      default: { primary: "#0078d4", bg: "#f9f9f9", success: "#28a745", warning: "#f9a825" },
      ocean: { primary: "#0891b2", bg: "#f0f9ff", success: "#059669", warning: "#0891b2" },
      forest: { primary: "#16a34a", bg: "#f7fdf7", success: "#22c55e", warning: "#eab308" },
      sunset: { primary: "#ea580c", bg: "#fff7ed", success: "#f97316", warning: "#eab308" },
      purple: { primary: "#9333ea", bg: "#faf5ff", success: "#a855f7", warning: "#d946ef" }
    };
  }

  initializeThemeSystem() {
    this.initDarkModeToggle();
    this.initThemePanels();
    this.initPresetThemes();
    this.initCustomColors();
    this.loadSavedTheme();
    this.reapplyThemeState();
  }

  initDarkModeToggle() {
    const darkToggle = document.getElementById("toggleDarkMode");
    
    // Load saved theme
    chrome.storage.local.get("darkModeEnabled", (data) => {
      const enabled = data.darkModeEnabled ?? false;
      if (darkToggle) darkToggle.checked = enabled;
      this.applyTheme(enabled);
    });

    // Save on change
    if (darkToggle) {
      darkToggle.addEventListener("change", () => {
        const enabled = darkToggle.checked;
        chrome.storage.local.set({ darkModeEnabled: enabled });
        this.applyTheme(enabled);
        setTimeout(() => this.reapplyThemeState(), 100);
      });
    }
  }

  initThemePanels() {
    const themeBtn = document.getElementById("themeBtn");
    const themePanel = document.getElementById("themePanel");
    const closeThemePanel = document.getElementById("closeThemePanel");
    const customColorsBtn = document.getElementById("customColorsBtn");
    const customColorsPanel = document.getElementById("customColorsPanel");
    const closeCustomPanel = document.getElementById("closeCustomPanel");
    const sidePanel = document.getElementById("sidePanel");

    // Open theme panel
    if (themeBtn && themePanel) {
      themeBtn.addEventListener("click", () => {
        themePanel.classList.add("open");
        if (sidePanel) sidePanel.style.zIndex = "999";
        setTimeout(() => this.reapplyThemeState(), 50);
      });
    }

    // Close theme panel
    if (closeThemePanel && themePanel) {
      closeThemePanel.addEventListener("click", () => {
        themePanel.classList.remove("open");
        if (sidePanel) sidePanel.style.zIndex = "1000";
      });
    }

    // Open custom colors panel
    if (customColorsBtn && customColorsPanel) {
      customColorsBtn.addEventListener("click", () => {
        customColorsPanel.classList.add("open");
        if (themePanel) themePanel.style.zIndex = "1099";
        this.loadCurrentColors();
      });
    }

    // Close custom colors panel
    if (closeCustomPanel && customColorsPanel) {
      closeCustomPanel.addEventListener("click", () => {
        customColorsPanel.classList.remove("open");
        if (themePanel) themePanel.style.zIndex = "1100";
      });
    }
  }

  initPresetThemes() {
    document.querySelectorAll(".theme-option").forEach(option => {
      option.addEventListener("click", () => {
        const themeName = option.dataset.theme;
        if (this.themes[themeName]) {
          this.selectPresetTheme(themeName);
          this.updateThemeSelection(option);
        }
      });
    });
  }

  initCustomColors() {
    const applyBtn = document.getElementById("applyCustom");
    const resetBtn = document.getElementById("resetCustom");

    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        this.applyCustomColors();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetToDefault();
      });
    }
  }

  selectPresetTheme(themeName) {
    // Turn off dark mode when selecting a preset theme
    const darkToggle = document.getElementById("toggleDarkMode");
    if (darkToggle) {
      darkToggle.checked = false;
      chrome.storage.local.set({ darkModeEnabled: false });
    }
    
    // Remove dark mode classes
    document.body.classList.remove("dark");
    document.documentElement.classList.remove("dark");
    
    this.applyCustomTheme(this.themes[themeName]);
    chrome.storage.local.set({ 
      customTheme: this.themes[themeName],
      currentThemeName: themeName 
    });
    
    setTimeout(() => this.reapplyThemeState(), 100);
  }

  updateThemeSelection(selectedOption) {
    document.querySelectorAll(".theme-option").forEach(opt => 
      opt.classList.remove("selected"));
    selectedOption.classList.add("selected");
  }

  applyCustomColors() {
    const customTheme = {
      primary: document.getElementById("primaryColorPicker").value,
      bg: document.getElementById("bgColorPicker").value,
      success: document.getElementById("successColorPicker").value,
      warning: document.getElementById("warningColorPicker").value
    };
    
    // Turn off dark mode when applying custom colors
    const darkToggle = document.getElementById("toggleDarkMode");
    if (darkToggle) {
      darkToggle.checked = false;
      chrome.storage.local.set({ darkModeEnabled: false });
    }
    
    // Remove dark mode classes
    document.body.classList.remove("dark");
    document.documentElement.classList.remove("dark");
    
    this.applyCustomTheme(customTheme);
    chrome.storage.local.set({ 
      customTheme: customTheme,
      currentThemeName: "custom" 
    });
  }

  resetToDefault() {
    this.applyCustomTheme(this.themes.default);
    chrome.storage.local.set({ 
      customTheme: this.themes.default,
      currentThemeName: "default" 
    });
    this.loadCurrentColors();
  }

  applyTheme(isDarkMode) {
    if (isDarkMode) {
      document.body.classList.add("dark");
      document.documentElement.classList.add("dark");
      this.applyDarkModeTheme();
    } else {
      document.body.classList.remove("dark");
      document.documentElement.classList.remove("dark");
      // Check for saved custom theme or use default
      chrome.storage.local.get(["customTheme", "currentThemeName"], (data) => {
        if (data.customTheme && data.currentThemeName !== "dark") {
          this.applyCustomTheme(data.customTheme);
        } else {
          this.applyDefaultTheme();
        }
      });
    }
  }

  applyDarkModeTheme() {
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', '#1a0e2a');
    root.style.setProperty('--bg-secondary', '#2b1850');
    root.style.setProperty('--text-primary', '#e0d7f5');
    root.style.setProperty('--text-secondary', '#aaa');
    root.style.setProperty('--primary-color', '#b48cff');
    root.style.setProperty('--border-color', '#444');
    root.style.setProperty('--switch-bg', '#555');
    root.style.setProperty('--switch-active', '#6a3fc9');
    root.style.setProperty('--success-color', '#28a745');
    root.style.setProperty('--warning-color', '#f9a825');
    root.style.setProperty('--error-color', '#d93025');
  }

  applyDefaultTheme() {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', '#0078d4');
    root.style.setProperty('--bg-primary', '#f9f9f9');
    root.style.setProperty('--bg-secondary', '#ffffff');
    root.style.setProperty('--text-primary', '#333');
    root.style.setProperty('--text-secondary', '#666');
    root.style.setProperty('--border-color', '#ddd');
    root.style.setProperty('--switch-bg', '#ccc');
    root.style.setProperty('--switch-active', '#0078d4');
    root.style.setProperty('--success-color', '#28a745');
    root.style.setProperty('--warning-color', '#f9a825');
    root.style.setProperty('--error-color', '#d93025');
  }

  applyCustomTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--bg-primary', theme.bg);
    root.style.setProperty('--bg-secondary', theme.bgSecondary || '#ffffff');
    root.style.setProperty('--success-color', theme.success);
    root.style.setProperty('--warning-color', theme.warning);
    root.style.setProperty('--switch-active', theme.primary);
    root.style.setProperty('--text-primary', theme.textPrimary || '#333');
    root.style.setProperty('--text-secondary', theme.textSecondary || '#666');
    root.style.setProperty('--border-color', theme.borderColor || '#ddd');
    root.style.setProperty('--switch-bg', theme.switchBg || '#ccc');
  }

  reapplyThemeState() {
    chrome.storage.local.get(["darkModeEnabled", "customTheme", "currentThemeName"], (data) => {
      const isDarkMode = data.darkModeEnabled ?? false;
      
      if (isDarkMode) {
        document.body.classList.add("dark");
        document.documentElement.classList.add("dark");
        this.applyDarkModeTheme();
      } else if (data.customTheme) {
        document.body.classList.remove("dark");
        document.documentElement.classList.remove("dark");
        this.applyCustomTheme(data.customTheme);
      } else {
        document.body.classList.remove("dark");
        document.documentElement.classList.remove("dark");
        this.applyDefaultTheme();
      }
    });
  }

  loadSavedTheme() {
    chrome.storage.local.get(["customTheme", "currentThemeName"], (data) => {
      if (data.customTheme) {
        this.applyCustomTheme(data.customTheme);
        
        // Mark selected preset if applicable
        if (data.currentThemeName && data.currentThemeName !== "custom") {
          const selectedOption = document.querySelector(`[data-theme="${data.currentThemeName}"]`);
          if (selectedOption) selectedOption.classList.add("selected");
        }
      }
    });
  }

  loadCurrentColors() {
    const style = getComputedStyle(document.documentElement);
    const primaryPicker = document.getElementById("primaryColorPicker");
    const bgPicker = document.getElementById("bgColorPicker");
    const successPicker = document.getElementById("successColorPicker");
    const warningPicker = document.getElementById("warningColorPicker");

    if (primaryPicker) primaryPicker.value = this.rgbToHex(style.getPropertyValue('--primary-color').trim());
    if (bgPicker) bgPicker.value = this.rgbToHex(style.getPropertyValue('--bg-primary').trim());
    if (successPicker) successPicker.value = this.rgbToHex(style.getPropertyValue('--success-color').trim());
    if (warningPicker) warningPicker.value = this.rgbToHex(style.getPropertyValue('--warning-color').trim());
  }

  rgbToHex(color) {
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
}