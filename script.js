let players2025 = [];
let allNews = JSON.parse(localStorage.getItem('cachedNews')) || [];
let newsOffset = 0;
const newsPerLoad = 6;

const fantasyTicker = document.getElementById('fantasyTicker');
const newsList = document.getElementById('newsList');
const loadMoreNewsBtn = document.getElementById('loadMoreNews');

// Utility functions for loaders
function showLoader(loaderId) {
    const loader = document.getElementById(loaderId);
    if (loader) loader.classList.remove('hidden');
}
function hideLoader(loaderId) {
    const loader = document.getElementById(loaderId);
    if (loader) loader.classList.add('hidden');
}

// Load Fantasy Ticker
async function loadFantasyTicker(fallback = false) {
    if (!fantasyTicker) return;
    showLoader('tickerLoader');
    try {
        if (players2025.length === 0 && !fallback) {
            const response = await fetch('players_2025.json');
            if (!response.ok) throw new Error('Failed to load players_2025.json');
            players2025 = await response.json();
        }
        const tickerContent = (fallback || players2025.length === 0)
            ? '<p class="text-red-400 text-center text-xs">Failed to load ticker. Using fallback.</p><span class="inline-flex items-center px-2 py-1 bg-purple-700/60 text-cyan-200 rounded-md shadow-md whitespace-nowrap min-w-[160px]">Patrick Mahomes (QB - KC) - 25.1 pts</span>'
            : players2025.concat(players2025).map(player => {
                return `<span class="inline-flex items-center px-2 py-1 bg-purple-700/60 text-cyan-200 rounded-md shadow-md whitespace-nowrap min-w-[160px]">${player.name} (${player.position} - ${player.team}) - ${player.fantasy_points.toFixed(1)} pts</span>`;
            }).join('');
        fantasyTicker.innerHTML = tickerContent;
    } catch (error) {
        console.error('Error loading ticker:', error);
        fantasyTicker.innerHTML = '<p class="text-red-400 text-center text-xs">Failed to load ticker. Using fallback.</p><span class="inline-flex items-center px-2 py-1 bg-purple-700/60 text-cyan-200 rounded-md shadow-md whitespace-nowrap min-w-[160px]">Patrick Mahomes (QB - KC) - 25.1 pts</span>';
    } finally {
        hideLoader('tickerLoader');
    }
}

// Display News
function displayNews(articles, append = false) {
    if (!newsList) return;
    if (!append) newsList.innerHTML = '';
    if (articles.length === 0) {
        newsList.innerHTML = '<p class="text-cyan-400 text-xs">No news available.</p>';
        loadMoreNewsBtn?.classList.add('hidden');
        return;
    }
    articles.forEach(article => {
        const div = document.createElement('div');
        div.className = 'bg-purple-800/50 backdrop-blur-md p-1.5 rounded-lg shadow-md';
        div.innerHTML = `
            <h4 class="text-sm font-medium mb-1"><a href="${article.link || '#'}" target="_blank" class="text-cyan-200 hover:text-white">${article.title}</a></h4>
            <p class="text-xs text-cyan-400">${article.description || 'No summary available.'}</p>
        `;
        newsList.appendChild(div);
    });
    loadMoreNewsBtn?.classList.toggle('hidden', articles.length < newsPerLoad);
}

// Fetch News from Sleeper API
async function fetchNews() {
    if (!newsList) return;
    showLoader('newsLoader');
    try {
        if (allNews.length > newsOffset) {
            displayNews(allNews.slice(newsOffset, newsOffset + newsPerLoad));
            newsOffset += newsPerLoad;
        } else {
            const response = await fetch('https://api.sleeper.app/v1/players/nfl/trending/add?limit=10');
            if (!response.ok) throw new Error('Failed to fetch news from Sleeper API');
            const data = await response.json();
            allNews = data.map(player => ({
                title: `${player.first_name} ${player.last_name} Trending Up`,
                link: `https://sleeper.app/players/nfl/${player.player_id}`,
                description: `Added by ${player.add_count || 0} managers in the last 24 hours.`
            }));
            localStorage.setItem('cachedNews', JSON.stringify(allNews));
            displayNews(allNews.slice(newsOffset, newsOffset + newsPerLoad));
            newsOffset += newsPerLoad;
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        newsList.innerHTML = '<p class="text-red-400 text-center text-xs">Failed to load news. Please try again later.</p>';
        loadMoreNewsBtn?.classList.add('hidden');
    } finally {
        hideLoader('newsLoader');
    }
}

// Initialize
loadFantasyTicker();
fetchNews();
if (loadMoreNewsBtn) {
    loadMoreNewsBtn.addEventListener('click', () => {
        if (allNews.length > newsOffset) {
            displayNews(allNews.slice(newsOffset, newsOffset + newsPerLoad), true);
            newsOffset += newsPerLoad;
        } else {
            fetchNews();
        }
    });
}
