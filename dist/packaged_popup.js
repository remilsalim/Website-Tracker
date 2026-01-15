function formatTime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

async function load() {
    const container = document.getElementById('stats-container');
    const totalEl = document.getElementById('total-focus-time');
    const countEl = document.getElementById('active-domains');

    const day = new Date().toISOString().split('T')[0];
    const data = await chrome.storage.local.get([day]);
    const dayData = data[day] || {};

    const domains = Object.keys(dayData).sort((a, b) => {
        const tA = typeof dayData[a] === 'object' ? dayData[a].totalTime : dayData[a];
        const tB = typeof dayData[b] === 'object' ? dayData[b].totalTime : dayData[b];
        return tB - tA;
    });

    let total = 0;
    container.innerHTML = '';

    domains.forEach((dom, i) => {
        const entry = dayData[dom];
        const time = typeof entry === 'object' ? entry.totalTime : entry;
        total += time;
    });

    totalEl.textContent = formatTime(total);
    countEl.textContent = `${domains.length} sites`;

    domains.forEach((dom, i) => {
        const entry = dayData[dom];
        const time = typeof entry === 'object' ? entry.totalTime : entry;
        const perc = total > 0 ? ((time / total) * 100).toFixed(1) : 0;

        const card = document.createElement('div');
        card.className = 'site-card';
        card.innerHTML = `
            <div class="card-top">
                <div class="info">
                    <span class="site-name">${dom}</span>
                    <div class="prog-bg"><div class="prog-fill" style="width: 0%"></div></div>
                </div>
                <div class="time">${formatTime(time)}</div>
            </div>
            <div class="details">
                <span>Share: ${perc}%</span>
                <span>Active Since: ${entry.firstVisit ? new Date(entry.firstVisit).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}</span>
            </div>
        `;

        card.onclick = () => card.classList.toggle('expanded');
        container.appendChild(card);
        setTimeout(() => card.querySelector('.prog-fill').style.width = perc + '%', 100);
    });

    // --- Live Update Logic ---
    chrome.runtime.sendMessage({ cmd: 'GET_STATUS' }, (response) => {
        if (!response || !response.domain || !response.startTime) return;

        const currentDomain = response.domain;
        const currentSessionStart = response.startTime;

        // Find the card for the current domain
        let cards = Array.from(document.querySelectorAll('.site-card'));
        let activeCard = cards.find(c => c.querySelector('.site-name').textContent === currentDomain);

        // If active domain isn't in top list yet (new site), CREATE IT.
        let domainBaseTime = 0;

        if (dayData[currentDomain]) {
            domainBaseTime = dayData[currentDomain].totalTime || dayData[currentDomain];
            if (typeof domainBaseTime === 'object') domainBaseTime = domainBaseTime.totalTime;
        }

        if (!activeCard) {
            // Create a temporary card for this session
            activeCard = document.createElement('div');
            activeCard.className = 'site-card';
            // Add a visual indicator for "Active"
            activeCard.style.border = '1px solid var(--accent)';
            activeCard.innerHTML = `
                <div class="card-top">
                    <div class="info">
                        <span class="site-name">${currentDomain} <span style="color:var(--accent); font-size:0.7em;">(Active)</span></span>
                        <div class="prog-bg"><div class="prog-fill" style="width: 0%"></div></div>
                    </div>
                    <div class="time">${formatTime(domainBaseTime)}</div>
                </div>
                <div class="details">
                    <span>Share: <1%</span>
                    <span>Active Since: Now</span>
                </div>
            `;
            // Prepend to top
            container.insertBefore(activeCard, container.firstChild);
        }

        const timeEl = activeCard.querySelector('.time');
        const totalEl = document.getElementById('total-focus-time');
        let totalBaseTime = total;

        setInterval(() => {
            const now = Date.now();
            const additionalSeconds = Math.floor((now - currentSessionStart) / 1000); // Time spent in THIS session so far

            const liveDomainTime = domainBaseTime + additionalSeconds;
            const liveTotalTime = totalBaseTime + additionalSeconds;

            timeEl.textContent = formatTime(liveDomainTime);
            totalEl.textContent = formatTime(liveTotalTime);

            // Optional: Update progress bar
            const newPerc = liveTotalTime > 0 ? ((liveDomainTime / liveTotalTime) * 100).toFixed(1) : 0;
            activeCard.querySelector('.details span').textContent = `Share: ${newPerc}%`;
        }, 1000); // Update every second
    });
}
document.getElementById('reset-btn').onclick = async () => {
    // Removed confirm() as it causes popup focus/sizing glitches in some Chrome versions
    await chrome.storage.local.clear();
    load();
};
document.addEventListener('DOMContentLoaded', load);
document.getElementById('current-date').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
