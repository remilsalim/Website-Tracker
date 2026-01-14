// Comprehensive Mocking for Local Development
(function () {
    // In a real extension, chrome.storage is defined. In a normal tab, it is not.
    const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

    if (!isExtension) {
        console.log('%c[Website Tracker] Running in Mock Mode', 'background: #0f172a; color: #38bdf8; padding: 4px; border-radius: 4px;');

        const mockData = {
            [new Date().toISOString().split('T')[0]]: {
                'google.com': { totalTime: 5420, firstVisit: Date.now() - 36000000 },
                'youtube.com': { totalTime: 2100, firstVisit: Date.now() - 25000000 },
                'github.com': { totalTime: 1850, firstVisit: Date.now() - 15000000 },
                'chatgpt.com': { totalTime: 900, firstVisit: Date.now() - 5000000 },
                'stackoverflow.com': { totalTime: 450, firstVisit: Date.now() - 1000000 }
            }
        };

        window.chrome = window.chrome || {};

        chrome.storage = chrome.storage || {
            local: {
                get: async (keys) => {
                    const dateKey = new Date().toISOString().split('T')[0];
                    if (typeof keys === 'string') return { [keys]: mockData[keys] };
                    if (Array.isArray(keys)) {
                        const result = {};
                        keys.forEach(k => result[k] = mockData[k]);
                        return result;
                    }
                    return mockData;
                },
                set: async (data) => console.log('[Mock Storage] Set:', data)
            }
        };

        chrome.runtime = chrome.runtime || {
            id: 'mock-id',
            getURL: (path) => path
        };

        // Silence other APIs
        chrome.tabs = chrome.tabs || { onActivated: { addListener: () => { } }, onUpdated: { addListener: () => { } } };
    } else {
        console.log('[Website Tracker] Running in Extension Mode');
    }
})();
