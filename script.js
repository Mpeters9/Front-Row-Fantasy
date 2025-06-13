document.addEventListener('DOMContentLoaded', () => {
    // Utilities
    const showLoader = (id) => document.getElementById(id)?.classList.remove('hidden');
    const hideLoader = (id) => document.getElementById(id)?.classList.add('hidden');

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    if (themeToggle && themeIcon) {
        const isDarkMode = localStorage.getItem('theme') === 'dark';
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
        }
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeIcon.innerHTML = isDark
                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />'
                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />';
        });
    }

    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            const isExpanded = mobileMenu.classList.toggle('hidden');
            mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
        });
    }

    // Mock Teams
    const mockTeams = [
        { name: 'Team Alpha', players: ['Josh Allen', 'Christian McCaffrey', 'Davante Adams', 'Travis Kelce'] },
        { name: 'Team Beta', players: ['Patrick Mahomes', 'Derrick Henry', 'Justin Jefferson', 'George Kittle'] },
        { name: 'Team Gamma', players: ['Lamar Jackson', 'Saquon Barkley', 'Tyreek Hill', 'Mark Andrews'] }
    ];

    // Fantasy Ticker
    let players2025 = [];
    const fantasyTicker = document.getElementById('fantasyTicker');
    async function loadFantasyTicker(fallback = false) {
        if (!fantasyTicker) return;
        showLoader('tickerLoader');
        try {
            if (!fallback && players2025.length === 0) {
                const response = await fetch('players_2025.json', { cache: 'no-store' });
                if (!response.ok) throw new Error('Failed to load players_2025.json');
                players2025 = await response.json();
            }
            const content = (fallback || players2025.length === 0)
                ? '<span class="inline-flex items-center px-2 py-1 bg-teal-700/60 text-white rounded-md shadow-md whitespace-nowrap min-w-[160px]">Patrick Mahomes (QB - KC) - 25.1 pts</span>'
                : players2025.concat(players2025).map(player => `
                    <span class="inline-flex items-center px-2 py-1 bg-teal-700/60 text-white rounded-md shadow-md whitespace-nowrap min-w-[160px] hover:bg-teal-600 transition">
                        ${player.name} (${player.position} - ${player.team}) - ${player.fantasy_points.toFixed(1)} pts
                    </span>
                `).join('');
            fantasyTicker.innerHTML = content;
        } catch (error) {
            console.error('Ticker error:', error);
            fantasyTicker.innerHTML = '<span class="inline-flex items-center px-2 py-1 bg-teal-700/60 text-white rounded-md shadow-md whitespace-nowrap min-w-[160px]">Patrick Mahomes (QB - KC) - 25.1 pts</span>';
        } finally {
            hideLoader('tickerLoader');
        }
    }

    // Top Players
    const topPlayersDiv = document.getElementById('topPlayers');
    async function loadTopPlayers() {
        if (!topPlayersDiv) return;
        showLoader('playersLoader');
        try {
            const response = await fetch('https://api.sleeper.app/v1/players/nfl', { cache: 'no-store' });
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            const players = Object.values(data)
                .filter(p => p.fantasy_positions && p.team)
                .sort((a, b) => ((b.stats?.pts_ppr || 0) + (b.stats?.rec || 0)) - ((a.stats?.pts_ppr || 0) + (a.stats?.rec || 0)))
                .slice(0, 5);
            topPlayersDiv.innerHTML = '';
            players.forEach(player => {
                const points = (player.stats?.pts_ppr || 0) + (player.stats?.rec || 0);
                const div = document.createElement('div');
                div.className = 'bg-teal-800/50 backdrop-blur-md p-2 rounded-lg shadow-md hover:shadow-lg transition-all';
                div.innerHTML = `
                    <div class="text-center">
                        <div class="text-sm font-medium text-white">${player.full_name}</div>
                        <div class="text-xs text-teal-200">${player.fantasy_positions[0]} - ${player.team}</div>
                        <div class="text-xs">${points.toFixed(2)} pts</div>
                    </div>
                `;
                topPlayersDiv.appendChild(div);
            });
        } catch (error) {
            console.error('Top players error:', error);
            topPlayersDiv.innerHTML = '<p class="text-red-400 text-center text-xs col-span-full">Failed to load top players.</p>';
        } finally {
            hideLoader('playersLoader');
        }
    }

    // Trade Analyzer and Matchup Predictor
    const teamSelect1 = document.getElementById('team1');
    const teamSelect2 = document.getElementById('team2');
    const matchupSelect1 = document.getElementById('matchupTeam1');
    const matchupSelect2 = document.getElementById('matchupTeam2');
    if (teamSelect1 && teamSelect2 && matchupSelect1 && matchupSelect2) {
        mockTeams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.name;
            option.textContent = team.name;
            [teamSelect1, teamSelect2, matchupSelect1, matchupSelect2].forEach(select => select.appendChild(option.cloneNode(true)));
        });

        document.getElementById('tradeAnalyzerBtn')?.addEventListener('click', () => {
            const teamName1 = teamSelect1.value;
            const teamName2 = teamSelect2.value;
            const teamPlayers1 = mockTeams.find(t => t.name === teamName1)?.players || [];
            const teamPlayers2 = mockTeams.find(t => t.name === teamName2)?.players || [];
            const teamPoints1 = teamPlayers1.reduce((sum, p) => {
                const player = players2025.find(pl => pl.name === p);
                return sum + (player?.fantasy_points || 0);
            }, 0);
            const teamPoints2 = teamPlayers2.reduce((sum, p) => {
                const player = players2025.find(pl => pl.name === p);
                return sum + (player?.fantasy_points || 0);
            }, 0);
            const tradeResultDiv = document.getElementById('tradeResult');
            if (teamPoints1 && teamPoints2) {
                const pointsDiff = Math.abs(teamPoints1 - teamPoints2);
                tradeResultDiv.innerHTML = pointsDiff < 15
                    ? `<p class="text-teal-200 text-xs">Fair trade: ${teamName1} (${teamPoints1.toFixed(2)} pts) vs ${teamName2} (${teamPoints2.toFixed(2)} pts)</p>`
                    : `<p class="text-red-400 text-xs">Unbalanced trade: ${teamName1} (${teamPoints1.toFixed(2)} pts) vs ${teamName2} (${teamPoints2.toFixed(2)} pts)</p>`;
            } else {
                tradeResultDiv.innerHTML = '<p class="text-red-400 text-xs">Please select both teams.</p>';
            }
        });

        document.getElementById('matchupBtn')?.addEventListener('click', () => {
            const teamName1 = matchupSelect1.value;
            const teamName2 = matchupSelect2.value;
            const teamPlayers1 = mockTeams.find(t => t.name === teamName1)?.players || [];
            const teamPlayers2 = mockTeams.find(t => t.name === teamName2)?.players || [];
            const teamPoints1 = teamPlayers1.reduce((sum, p) => {
                const player = players2025.find(pl => pl.name === p);
                return sum + (player?.fantasy_points || 0);
            }, 0);
            const teamPoints2 = teamPlayers2.reduce((sum, p) => {
                const player = players2025.find(pl => pl.name === p);
                return sum + (player?.fantasy_points || 0);
            }, 0);
            const matchupResultDiv = document.getElementById('matchupResult');
            const probability1 = teamPoints1 / (teamPoints1 + teamPoints2) * 100;
            const probability2 = teamPoints2 / (teamPoints1 + teamPoints2) * 100;
            matchupResultDiv.innerHTML = `
                <p class="text-teal-200 text-xs">${teamName1}: ${teamPoints1.toFixed(2)} pts (${probability1.toFixed(1)}% win probability)</p>
                <p class="text-teal-200 text-xs">${teamName2}: ${teamPoints2.toFixed(2)} pts (${probability2.toFixed(1)}% win probability)</p>
            `;
        });
    }

    // Waiver Wire
    const waiverList = document.getElementById('waiverList');
    async function loadWaiverPicks() {
        if (!waiverList) return;
        try {
            const response = await fetch('https://api.sleeper.app/v1/players/nfl', { cache: 'no-store' });
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            waiverList.innerHTML = '<h3 class="text-base font-bold text-teal-200 mb-1">Top Waiver Picks:</h3>';
            const players = Object.values(data)
                .filter(p => p.fantasy_positions && p.team)
                .sort((a, b) => ((b.stats?.pts_ppr || 0) + (b.stats?.rec || 0)) - ((a.stats?.pts_ppr || 0) + (a.stats?.rec || 0)))
                .slice(0, 5);
            players.forEach(player => {
                const points = (player.stats?.pts_ppr || 0) + (player.stats?.rec || 0);
                const div = document.createElement('div');
                div.className = 'bg-teal-800/50 backdrop-blur-md p-1.5 rounded-lg shadow-md';
                div.innerHTML = `
                    <span class="text-xs text-white">${player.full_name} (${player.fantasy_positions[0]})</span>
                    <span class="text-xs text-teal-200">${points.toFixed(2)} pts</span>
                `;
                waiverList.appendChild(div);
            });
        } catch (error) {
            console.error('Waiver picks error:', error);
            waiverList.innerHTML = '<p class="text-red-400 text-center text-xs">Error loading waiver picks.</p>';
        }
    }

    // News
    let allNews = JSON.parse(localStorage.getItem('cachedNews')) || [];
    let newsOffset = 0;
    const newsPerLoad = 6;
    const newsList = document.getElementById('newsList');
    const loadMoreNewsBtn = document.getElementById('loadMoreNews');

    function displayNews(articles, append = false) {
        if (!newsList) return;
        if (!append) newsList.innerHTML = '';
        if (articles.length === 0) {
            newsList.innerHTML = '<p class="text-teal-200 text-xs">No news available.</p>';
            loadMoreNewsBtn?.classList.add('hidden');
            return;
        }
        articles.forEach(article => {
            const div = document.createElement('div');
            div.className = 'bg-teal-800/50 backdrop-blur-md p-1.5 rounded-lg shadow-md';
            div.innerHTML = `
                <h4 class="text-sm font-medium mb-1"><a href="${article.link || '#'}" target="_blank" class="text-white hover:text-teal-100">${article.title}</a></h4>
                <p class="text-xs text-teal-200">${article.description || 'No summary available.'}</p>
            `;
            newsList.appendChild(div);
        });
        loadMoreNewsBtn?.classList.toggle('hidden', articles.length < newsPerLoad);
    }

    async function fetchNews() {
        if (!newsList) return;
        showLoader('newsLoader');
        try {
            if (allNews.length > newsOffset) {
                displayNews(allNews.slice(newsOffset, newsOffset + newsPerLoad));
                newsOffset += newsPerLoad;
            } else {
                const response = await fetch('https://api.sleeper.app/v1/players/nfl/trending/add?limit=10', { cache: 'no-store' });
                if (!response.ok) throw new Error('Failed to fetch news');
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
            console.error('News error:', error);
            newsList.innerHTML = '<p class="text-red-400 text-xs">Failed to load news.</p>';
            loadMoreNewsBtn?.classList.add('hidden');
        } finally {
            hideLoader('newsLoader');
        }
    }

    if (loadMoreNewsBtn) loadMoreNewsBtn.addEventListener('click', fetchNews);

    // Stats Page
    const yearSelect = document.getElementById('yearSelect');
    const positionSelect = document.getElementById('positionSelect');
    const playerSelect = document.getElementById('playerSelect');
    const advancedStatsCheckbox = document.getElementById('advancedStatsCheckbox');
    const statsTable = document.getElementById('statsTable');
    let currentYearData = [];
    let currentYear = '2025';

    async function loadYearData(year) {
        try {
            showLoader('statsLoader');
            const response = await fetch(`players_${year}.json`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`Failed to load players_${year}.json`);
            currentYearData = await response.json();
            currentYear = year;
            populatePlayerDropdown();
            updateTable();
        } catch (error) {
            console.error('Stats error:', error);
            if (statsTable) statsTable.querySelector('tbody').innerHTML = '<tr><td colspan="6" class="p-2 text-center text-red-400">Failed to load player data.</td></tr>';
        } finally {
            hideLoader('statsLoader');
        }
    }

    function populatePlayerDropdown() {
        if (!playerSelect) return;
        playerSelect.innerHTML = '<option value="all">All Players</option>';
        currentYearData.forEach(player => {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = player.name;
            playerSelect.appendChild(option);
        });
    }

    function updateTable() {
        if (!statsTable) return;
        const selectedPosition = positionSelect?.value || 'all';
        const selectedPlayer = playerSelect?.value || 'all';
        const showAdvanced = advancedStatsCheckbox?.checked && ['QB', 'RB', 'WR', 'TE'].includes(selectedPosition);

        let filteredPlayers = currentYearData;
        if (selectedPosition === 'Flex') {
            filteredPlayers = filteredPlayers.filter(p => ['RB', 'WR', 'TE'].includes(p.position));
        } else if (selectedPosition === 'SuperFlex') {
            filteredPlayers = filteredPlayers.filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.position));
        } else if (selectedPosition !== 'all') {
            filteredPlayers = filteredPlayers.filter(p => p.position === selectedPosition);
        }
        if (selectedPlayer !== 'all') {
            filteredPlayers = filteredPlayers.filter(p => p.name === selectedPlayer);
        }

        let header = `
            <tr class="bg-teal-700/60">
                <th class="p-2 text-white">Player</th>
                <th class="p-2 text-white">Team</th>
                <th class="p-2 text-white">Fantasy Points</th>
                <th class="p-2 text-white">FP/G</th>
                <th class="p-2 text-white">Total Yards</th>
                <th class="p-2 text-white">Total Touchdowns</th>
            </tr>
        `;

        const tableRows = filteredPlayers.map(player => {
            const fantasyPoints = player.fantasy_points || 0;
            const fpPerGame = fantasyPoints / 17;
            return `
                <tr>
                    <td class="p-2 text-white">${player.name}</td>
                    <td class="p-2 text-white">${player.team}</td>
                    <td class="p-2 text-white">${fantasyPoints.toFixed(1)}</td>
                    <td class="p-2 text-white">${fpPerGame.toFixed(1)}</td>
                    <td class="p-2 text-white">${player.stats?.total_yards || 'N/A'}</td>
                    <td class="p-2 text-white">${player.stats?.total_touchdowns || 'N/A'}</td>
                </tr>
            `;
        }).join('');

        statsTable.innerHTML = `<thead>${header}</thead><tbody>${tableRows || '<tr><td colspan="6" class="p-2 text-center text-red-400">No players found.</td></tr>'}</tbody>`;
    }

    if (positionSelect) positionSelect.addEventListener('change', updateTable);
    if (yearSelect) yearSelect.addEventListener('change', () => loadYearData(yearSelect.value));
    if (playerSelect) playerSelect.addEventListener('change', updateTable);
    if (advancedStatsCheckbox) advancedStatsCheckbox.addEventListener('change', updateTable);

    // Initialize
    loadFantasyTicker();
    loadTopPlayers();
    loadWaiverPicks();
    fetchNews();
    if (yearSelect) loadYearData('2025');
});
