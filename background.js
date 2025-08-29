const TEST_URL = "https://www.google.com/generate_204";
const FALLBACK_URL = "http://neverssl.com";
let captiveTabId = null;
let failureCount = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkConnection") {
    checkConnection(true, (result) => {
      sendResponse(result);
    });
    return true; // keep the message channel open for async response
  }
});

function findExistingFallbackTab(callback) {
  chrome.tabs.query({}, (tabs) => {
    const match = tabs.find(tab => tab.url && tab.url.includes("neverssl.com"));
    callback(match);
  });
}

function openOrRefreshFallbackTab() {
  findExistingFallbackTab((existingTab) => {
    if (existingTab) {
      captiveTabId = existingTab.id;
      chrome.tabs.update(captiveTabId, { url: existingTab.url, active: true });
    } else {
      chrome.tabs.create({ url: FALLBACK_URL }, (tab) => {
        captiveTabId = tab.id;
      });
    }
  });
}

function logFailure() {
  const timestamp = new Date().toISOString();
  chrome.storage.local.get({ failures: [] }, (data) => {
    const failures = Array.isArray(data.failures) ? data.failures : [];
    const updated = [...failures, timestamp];
    chrome.storage.local.set({ failures: updated });
  });
}

function handleOnlineState() {
  chrome.action.setIcon({ path: "icons/icon16.png" });
  chrome.action.setTitle({ title: "Online ✅" });
  chrome.action.setBadgeText({ text: "✓" });
  chrome.action.setBadgeBackgroundColor({ color: "#28a745" });
  captiveTabId = null;
  failureCount = 0;
  chrome.storage.local.set({ fallbackTabOpened: false });
}

function handleOfflineState() {
  chrome.action.setIcon({ path: "icons/icon48.png" });
  chrome.action.setTitle({ title: "Offline ❌" });
  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#d93025" });
  logFailure();
  failureCount++;

  chrome.storage.local.get({ fallbackTabOpened: false }, (data) => {
    if (!data.fallbackTabOpened) {
      findExistingFallbackTab((existingTab) => {
        if (!existingTab) {
          openOrRefreshFallbackTab();
        } else {
          captiveTabId = existingTab.id;
          chrome.tabs.update(captiveTabId, { url: existingTab.url, active: true });
        }
        chrome.storage.local.set({ fallbackTabOpened: true });
      });
    }
  });
}

function checkConnection(triggeredByClick = false, callback = null) {
  fetch(TEST_URL, { method: "GET", mode: "no-cors" })
    .then(() => {
      handleOnlineState();
      if (callback) callback({ status: "online" });
    })
    .catch(() => {
      handleOfflineState();
      if (callback) callback({ status: "offline" });
    });
}

// Toolbar icon click will trigger immediate check
chrome.action.onClicked.addListener(() => {
  checkConnection(true);
});

// Auto-check connection every 10 seconds
setInterval(() => checkConnection(false), 10000);