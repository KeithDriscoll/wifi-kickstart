// Settings and feature toggles management
export class SettingsManager {
  constructor() {
    this.defaultSettings = {
      advancedModeEnabled: true,
      enableSpeedTest: true,
      showWarpStatus: true,
      showNetworkScore: true,
      darkModeEnabled: false
    };
  }

  initializeSettings() {
    this.initSidePanel();
    this.initModeToggle();
    this.initFeatureToggles();
  }

  initSidePanel() {
    const menuToggle = document.getElementById("menuToggle");
    const sidePanel = document.getElementById("sidePanel");
    const closePanel = document.getElementById("closePanel");

    if (menuToggle && sidePanel && closePanel) {
      menuToggle.addEventListener("click", () => {
        sidePanel.classList.add("open");
        menuToggle.classList.add("hidden");
        // Trigger theme reapplication after panel opens
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('themeReapply'));
        }, 50);
      });

      closePanel.addEventListener("click", () => {
        sidePanel.classList.remove("open");
        menuToggle.classList.remove("hidden");
        // Trigger theme reapplication after panel closes
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('themeReapply'));
        }, 50);
      });
    }
  }

  initModeToggle() {
    const advancedToggle = document.getElementById("toggleAdvancedMode");
    
    // Load saved mode preference
    chrome.storage.local.get("advancedModeEnabled", (data) => {
      const isAdvancedMode = data.advancedModeEnabled ?? true;
      if (advancedToggle) advancedToggle.checked = isAdvancedMode;
      this.applyMode(isAdvancedMode);
    });

    // Save on change
    if (advancedToggle) {
      advancedToggle.addEventListener("change", () => {
        const isAdvancedMode = advancedToggle.checked;
        chrome.storage.local.set({ advancedModeEnabled: isAdvancedMode });
        this.applyMode(isAdvancedMode);
        // Notify main app of mode change
        window.dispatchEvent(new CustomEvent('modeChanged', { 
          detail: { isAdvancedMode } 
        }));
      });
    }
  }

  initFeatureToggles() {
    const toggles = [
      { id: "toggleSpeedTest", key: "enableSpeedTest", elementId: "speedTest" },
      { id: "toggleWarpCheck", key: "showWarpStatus", elementId: "warpStatus" },
      { id: "toggleNetworkScore", key: "showNetworkScore", elementId: "networkScore" }
    ];

    // Load saved states
    chrome.storage.local.get(toggles.map(t => t.key), (data) => {
      toggles.forEach(({ id, key, elementId }) => {
        const toggleEl = document.getElementById(id);
        const targetEl = document.getElementById(elementId);
        if (toggleEl && targetEl) {
          const enabled = data[key] ?? true;
          toggleEl.checked = enabled;
          targetEl.style.display = enabled ? "block" : "none";
        }
      });
    });

    // Save on change
    toggles.forEach(({ id, key, elementId }) => {
      const toggleEl = document.getElementById(id);
      const targetEl = document.getElementById(elementId);
      if (toggleEl && targetEl) {
        toggleEl.addEventListener("change", () => {
          const enabled = toggleEl.checked;
          chrome.storage.local.set({ [key]: enabled });
          targetEl.style.display = enabled ? "block" : "none";
        });
      }
    });
  }

  applyMode(advanced) {
    document.body.classList.remove("advanced-mode", "simple-mode");
    document.body.classList.add(advanced ? "advanced-mode" : "simple-mode");
  }

  getSetting(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (data) => {
        resolve(data[key] ?? this.defaultSettings[key]);
      });
    });
  }

  setSetting(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  }
}