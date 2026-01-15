/**
 * Website Time Tracker - Mock Storage v2
 */
(function () {
    const isExtension = !!(window.chrome && chrome.runtime && chrome.runtime.id);

    if (!isExtension) {
        console.log('%c[Website Tracker] UI Preview Mode Active', 'background: #0ea5e9; color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold;');

        // Generate Mock Data for Today
        const today = new Date().toISOString().split('T')[0];
        const baseTime = Date.now();

        const mockData = {
            [today]: {
                'google.com': { totalTime: 5420, firstVisit: baseTime - 36000000 },
                'youtube.com': { totalTime: 2100, firstVisit: baseTime - 25000000 },
                'github.com': { totalTime: 1850, firstVisit: baseTime - 15000000 },
                'chatgpt.com': { totalTime: 1200, firstVisit: baseTime - 8000000 },
                'twitter.com': { totalTime: 900, firstVisit: baseTime - 4000000 },
                'stackoverflow.com': { totalTime: 450, firstVisit: baseTime - 1000000 }
            }
        };

        window.chrome = window.chrome || {};

        chrome.storage = chrome.storage || {
            local: {
                get: async (keys) => {
                    if (typeof keys === 'string') return { [keys]: mockData[keys] };
                    return mockData;
                },
                set: async (data) => console.log('[Mock Storage] Set:', data),
                remove: async (keys) => console.log('[Mock Storage] Removed:', keys)
            }
        };

        chrome.runtime = chrome.runtime || {
            id: 'mock-extension-id',
            getURL: (p) => p
        };

        // Stub other extension APIs
        chrome.tabs = chrome.tabs || { onActivated: { addListener: () => { } }, onUpdated: { addListener: () => { } }, query: async () => [] };
        chrome.windows = chrome.windows || { onFocusChanged: { addListener: () => { } } };

    }
})();
