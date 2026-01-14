let activeTabId = null;
let activeStartTime = null;
let activeUrl = null;

// Helper to extract domain from URL
function getDomain(url) {
  try {
    if (!url || url.startsWith('chrome://') || url.startsWith('about:')) return null;
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

// Logic to save spent time
async function saveTime() {
  if (!activeStartTime || !activeUrl) return;

  const domain = getDomain(activeUrl);
  if (!domain) return;

  const endTime = Date.now();
  const duration = Math.floor((endTime - activeStartTime) / 1000); // in seconds

  if (duration <= 0) return;

  const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const data = await chrome.storage.local.get([dateKey]);
  const dayData = data[dateKey] || {};

  if (!dayData[domain]) {
    dayData[domain] = {
      totalTime: 0,
      firstVisit: Date.now() - (duration * 1000) // Estimate first visit if new
    };
  }

  dayData[domain].totalTime += duration;

  await chrome.storage.local.set({ [dateKey]: dayData });

  // Update last active values
  activeStartTime = endTime;
}

// Handle tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await saveTime();

  const tab = await chrome.tabs.get(activeInfo.tabId);
  activeTabId = activeInfo.tabId;
  activeUrl = tab.url;
  activeStartTime = Date.now();
});

// Handle tab updates (URL changes)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    await saveTime();
    activeUrl = changeInfo.url;
    activeStartTime = Date.now();
  }
});

// Handle window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus
    await saveTime();
    activeStartTime = null;
  } else {
    // Browser gained focus (possibly on a different tab)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await saveTime();
      activeTabId = tab.id;
      activeUrl = tab.url;
      activeStartTime = Date.now();
    }
  }
});

// Initialize tracking when script loads or browser starts
async function initTracking() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    activeTabId = tab.id;
    activeUrl = tab.url;
    activeStartTime = Date.now();
  }
}

chrome.runtime.onStartup.addListener(initTracking);
chrome.runtime.onInstalled.addListener(initTracking);
initTracking(); // Run on script load (reloads/installs)
