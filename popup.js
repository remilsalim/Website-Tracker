/**
 * Website Time Tracker - Popup Logic v2
 * Refined for better block packaging and interactive detail view
 */

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getFaviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

async function loadStats() {
  try {
    const statsContainer = document.getElementById('stats-container');
    const dateElement = document.getElementById('current-date');
    const totalTimeElement = document.getElementById('total-focus-time');
    const domainCountElement = document.getElementById('active-domains');

    if (!statsContainer || !totalTimeElement) return;

    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];

    dateElement.textContent = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.error('[Website Tracker] Chrome Storage API not found.');
      return;
    }

    const data = await chrome.storage.local.get([dateKey]);
    const dayData = data[dateKey] || {};

    const domains = Object.keys(dayData).sort((a, b) => {
      const valA = typeof dayData[a] === 'object' ? dayData[a].totalTime : dayData[a];
      const valB = typeof dayData[b] === 'object' ? dayData[b].totalTime : dayData[b];
      return valB - valA;
    });

    if (domains.length === 0) {
      statsContainer.innerHTML = '<div class="loader" style="padding: 20px; opacity: 0.6;">No activity tracked today.</div>';
      totalTimeElement.textContent = '0h 0m';
      domainCountElement.textContent = '0 sites';
      return;
    }

    const totalTime = domains.reduce((sum, dom) => {
      const val = typeof dayData[dom] === 'object' ? dayData[dom].totalTime : dayData[dom];
      return sum + val;
    }, 0);

    totalTimeElement.textContent = formatTime(totalTime);
    domainCountElement.textContent = `${domains.length} site${domains.length > 1 ? 's' : ''}`;

    statsContainer.innerHTML = ''; // Clear loader

    domains.forEach((domain, index) => {
      const entry = dayData[domain];
      const duration = typeof entry === 'object' ? entry.totalTime : entry;
      const firstVisit = typeof entry === 'object' ? entry.firstVisit : null;
      const percentage = ((duration / totalTime) * 100).toFixed(1);

      const card = document.createElement('div');
      card.className = 'stat-card';
      card.style.animationDelay = `${index * 0.08}s`;

      const firstVisitStr = firstVisit ? new Date(firstVisit).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Started Today';

      card.innerHTML = `
                <div class="stat-card-main">
                    <div class="favicon-box">
                        <img src="${getFaviconUrl(domain)}" alt="" onerror="this.src='icons/icon16.png'">
                    </div>
                    <div class="domain-col">
                        <span class="name">${domain}</span>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="duration-box">${formatTime(duration)}</div>
                </div>
                <div class="stat-details">
                    <div class="detail-row">
                        <div class="detail-box">
                            <span class="tag">Daily Share</span>
                            <span class="val">${percentage}%</span>
                        </div>
                        <div class="detail-box text-right">
                            <span class="tag">First Visit</span>
                            <span class="val">${firstVisitStr}</span>
                        </div>
                    </div>
                </div>
            `;

      card.addEventListener('click', (e) => {
        const wasExpanded = card.classList.contains('expanded');
        // Close others for cleaner look
        document.querySelectorAll('.stat-card.expanded').forEach(c => {
          if (c !== card) c.classList.remove('expanded');
        });
        card.classList.toggle('expanded');
      });

      statsContainer.appendChild(card);

      // Animate after paint
      requestAnimationFrame(() => {
        setTimeout(() => {
          const fill = card.querySelector('.progress-fill');
          if (fill) fill.style.width = `${percentage}%`;
        }, 100);
      });
    });
  } catch (err) {
    console.error('[Website Tracker] Render Error:', err);
  }
}

// Global Reset
const resetBtn = document.getElementById('reset-btn');
if (resetBtn) {
  resetBtn.addEventListener('click', async () => {
    if (confirm("Reset all statistics for today?")) {
      const dateKey = new Date().toISOString().split('T')[0];
      await chrome.storage.local.remove([dateKey]);
      window.location.reload();
    }
  });
}

document.addEventListener('DOMContentLoaded', loadStats);
