function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(' ');
}

async function loadStats() {
  try {
    const statsContainer = document.getElementById('stats-container');
    const dateElement = document.getElementById('current-date');

    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    dateElement.textContent = now.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.error('Chrome Storage API not found. If you are testing locally, make sure mock-storage.js is loaded.');
      return;
    }

    const data = await chrome.storage.local.get([dateKey]);
    const dayData = data[dateKey] || {};

    statsContainer.innerHTML = '';

    const domains = Object.keys(dayData).sort((a, b) => {
      const entryA = dayData[a];
      const entryB = dayData[b];
      const timeA = typeof entryA === 'object' ? entryA.totalTime : entryA;
      const timeB = typeof entryB === 'object' ? entryB.totalTime : entryB;
      return timeB - timeA;
    });

    if (domains.length === 0) {
      statsContainer.innerHTML = '<div class="no-data">No activity tracked for today yet.</div>';
      return;
    }

    const totalTime = domains.reduce((sum, dom) => {
      const entry = dayData[dom];
      return sum + (typeof entry === 'object' ? entry.totalTime : entry);
    }, 0);

    domains.forEach((domain, index) => {
      const entry = dayData[domain];
      const duration = typeof entry === 'object' ? entry.totalTime : entry;
      const firstVisit = typeof entry === 'object' ? entry.firstVisit : null;
      const percentage = ((duration / totalTime) * 100).toFixed(1);

      const card = document.createElement('div');
      card.className = 'stat-card';
      card.style.animationDelay = `${index * 0.1}s`;

      let detailsHtml = `
          <div class="detail-row">
            <span>Percentage of Total</span>
            <span class="detail-value">${percentage}%</span>
          </div>
        `;

      if (firstVisit) {
        const timeStr = new Date(firstVisit).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        detailsHtml += `
            <div class="detail-row">
              <span>First Visited At</span>
              <span class="detail-value">${timeStr}</span>
            </div>
          `;
      }

      card.innerHTML = `
          <div class="stat-card-main">
            <div class="domain-info">
              <span class="domain-name">${domain}</span>
              <div class="domain-percentage">
                <div class="percentage-fill" style="width: 0%"></div>
              </div>
            </div>
            <div class="duration">${formatTime(duration)}</div>
          </div>
          <div class="stat-details">
            ${detailsHtml}
          </div>
        `;

      card.addEventListener('click', () => {
        card.classList.toggle('expanded');
      });

      statsContainer.appendChild(card);

      // Animate percentage bar
      setTimeout(() => {
        const bar = card.querySelector('.percentage-fill');
        if (bar) bar.style.width = `${percentage}%`;
      }, 100);
    });
  } catch (error) {
    console.error('Error loading stats:', error);
    document.getElementById('stats-container').innerHTML = `<div class="no-data" style="color: #ef4444;">Error: ${error.message}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadStats);
