document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    if (!themeToggle || !themeIcon) return;
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

    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            const isExpanded = mobileMenu.classList.toggle('hidden');
            mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
        });
    }

    // Mock Teams for Trade Analyzer and Matchup
    const mockTeams = [
        { name: 'Team Alpha', players: ['Josh Allen', 'Christian McCaffrey', 'Davante Adams', 'Travis Kelce'] },
        { name: 'Team Beta', players: ['Patrick Mahomes', 'Derrick Henry', 'Justin Jefferson', 'George Kittle'] },
        { name: 'Team Gamma', players: ['Lamar Jackson', 'Saquon Barkley', 'Tyreek Hill', 'Mark Andrews'] }
    ];

    // Utility to show/hide loader
    const showLoader = (id) => document.getElementById(id)?.classList?.remove('hidden');
    const hideLoader = (id) => document.getElementById(id)?.classList?.add('hidden');

    // Fantasy Points Ticker
    const fantasyTicker = document.getElementById('fantasyTicker');
    if (fantasyTicker) {
        showLoader('tickerLoader');
        const fetchWithTimeout = (url, timeout = 10000) => Promise.race([
            fetch(url),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
        ]);
        fetchWithTimeout('players_2025.json')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                const topPlayers = data.sort((a, b) => (parseFloat(b.fantasy_points || 0) - parseFloat(a.fantasy_points || 0))).slice(0, 10);
                const tickerContent = topPlayers.concat(topPlayers).map(player => `
                    <span class="inline-flex items-center px-4 py-2 bg-teal-600/80 text-white rounded-lg shadow-md whitespace-nowrap min-w-[220px] mx-2">
                        <img src="${player.image || 'https://via.placeholder.com/40'}" alt="${player.name}" class="w-10 h-10 rounded-full mr-2" loading="lazy" onerror="this.src='https://via.placeholder.com/40';">
                        ${player.name} (${player.position} - ${player.team || 'N/A'}) - ${parseFloat(player.fantasy_points || 0).toFixed(1)} pts
                    </span>
                `).join('');
                fantasyTicker.innerHTML = tickerContent;
                fantasyTicker.style.animation = `marquee ${topPlayers.length * 4}s linear infinite`;
                hideLoader('tickerLoader');
            })
            .catch(error => {
                console.error('Error loading fantasy ticker:', error);
                fantasyTicker.innerHTML = '<p class="text-red-400 text-center">Failed to load fantasy ticker.</p>';
                hideLoader('tickerLoader');
            });
    }

    // Top Players
    const topPlayersDiv = document.getElementById('topPlayers');
    if (topPlayersDiv) {
        showLoader('playersLoader');
        const fetchWithTimeout = (url, timeout = 10000) => Promise.race([
            fetch(url),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
        ]);
        fetchWithTimeout('players_2025.json')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                data.sort((a, b) => parseFloat(b.fantasy_points || 0) - parseFloat(a.fantasy_points || 0)).slice(0, 5).forEach(player => {
                    const imageSrc = player.image || 'https://via.placeholder.com/80?text=Player';
                    const div = document.createElement('div');
                    div.className = 'bg-teal-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2';
                    div.innerHTML = `
                        <img src="${imageSrc}" alt="${player.name}" class="h-24 w-24 rounded-full mx-auto mb-4 object-cover border-2 border-teal-500">
                        <div class="text-xl font-semibold text-teal-100">${player.name}</div>
                        <div class="text-teal-300 text-sm">${player.position} - ${player.team || 'N/A'}</div>
                        <div class="text-teal-200">${parseFloat(player.fantasy_points || 0).toFixed(2)} pts</div>
                    `;
                    topPlayersDiv.appendChild(div);
                });
                hideLoader('playersLoader');
            })
            .catch(error => {
                console.error('Error loading top players:', error);
                topPlayersDiv.innerHTML = '<p class="text-red-400 text-center col-span-full">Failed to load top players.</p>';
                hideLoader('playersLoader');
            });
    }

    // Trade Analyzer, Waiver Wire, and Matchup Predictor
    try {
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

            fetch('players_2025.json')
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not OK');
                    return response.json();
                })
                .then(data => {
                    const waiverList = document.getElementById('waiverList');
                    if (waiverList) {
                        waiverList.innerHTML = '<h3 class="text-2xl font-bold text-teal-100 mb-4">Top Waiver Picks:</h3>';
                        data.sort((a, b) => parseFloat(b.fantasy_points || 0) - parseFloat(a.fantasy_points || 0)).slice(0, 5).forEach(player => {
                            const playerDiv = document.createElement('div');
                            playerDiv.className = 'bg-teal-800/60 backdrop-blur-md p-4 rounded-xl shadow-md';
                            playerDiv.innerHTML = `
                                <span class="text-teal-100">${player.name} (${player.position})</span>
                                <span class="text-teal-300">${parseFloat(player.fantasy_points || 0).toFixed(2)} pts</span>
                            `;
                            waiverList.appendChild(playerDiv);
                        });
                    }
                })
                .catch(error => {
                    console.error('Error loading waiver wire picks:', error);
                    if (document.getElementById('waiverList')) {
                        document.getElementById('waiverList').innerHTML = '<p class="text-red-400 text-center">Error loading waiver wire picks.</p>';
                    }
                });

            document.getElementById('tradeAnalyzerBtn')?.addEventListener('click', async () => {
                try {
                    const teamName1 = teamSelect1.value;
                    const teamName2 = teamSelect2.value;
                    const tradeData = await fetch('players_2025.json').then(res => res.json());
                    const teamPlayers1 = mockTeams.find(t => t.name === teamName1)?.players || [];
                    const teamPlayers2 = mockTeams.find(t => t.name === teamName2)?.players || [];
                    const teamStats1 = teamPlayers1.map(p => tradeData.find(pl => pl.name === p)).filter(p => p);
                    const teamStats2 = teamPlayers2.map(p => tradeData.find(pl => pl.name === p)).filter(p => p);
                    const teamPoints1 = teamStats1.reduce((sum, p) => sum + (parseFloat(p.fantasy_points || 0)), 0);
                    const teamPoints2 = teamStats2.reduce((sum, p) => sum + (parseFloat(p.fantasy_points || 0)), 0);
                    const tradeResultDiv = document.getElementById('tradeResult');
                    if (teamPoints1 && teamPoints2) {
                        const pointsDiff = Math.abs(teamPoints1 - teamPoints2);
                        tradeResultDiv.innerHTML = pointsDiff < 15 ? `
                            <p class="text-green-400">Fair trade: ${teamName1} (${teamPoints1.toFixed(2)} pts) vs ${teamName2} (${teamPoints2.toFixed(2)} pts)</p>
                        ` : `
                            <p class="text-red-400">Unbalanced trade: ${teamName1} (${teamPoints1.toFixed(2)} pts) vs ${teamName2} (${teamPoints2.toFixed(2)} pts)</p>
                        `;
                    } else {
                        tradeResultDiv.innerHTML = '<p class="text-red-400">Please select both teams for trade analysis.</p>';
                    }
                } catch (error) {
                    console.error('Error analyzing trade:', error);
                    document.getElementById('tradeResult').innerHTML = '<p class="text-red-400">Error analyzing trade data.</p>';
                }
            });

            document.getElementById('matchupBtn')?.addEventListener('click', async () => {
                try {
                    const teamName1 = matchupSelect1.value;
                    const teamName2 = matchupSelect2.value;
                    const matchupData = await fetch('players_2025.json').then(res => res.json());
                    const teamPlayers1 = mockTeams.find(t => t.name === teamName1)?.players || [];
                    const teamPlayers2 = mockTeams.find(t => t.name === teamName2)?.players || [];
                    const teamStats1 = teamPlayers1.map(p => matchupData.find(pl => pl.name === p)).filter(p => p);
                    const teamStats2 = teamPlayers2.map(p => matchupData.find(pl => pl.name === p)).filter(p => p);
                    const teamPoints1 = teamStats1.reduce((sum, p) => sum + (parseFloat(p.fantasy_points || 0)), 0);
                    const teamPoints2 = teamStats2.reduce((sum, p) => sum + (parseFloat(p.fantasy_points || 0)), 0);
                    const matchupResultDiv = document.getElementById('matchupResult');
                    const probability1 = teamPoints1 / (teamPoints1 + teamPoints2) * 100;
                    const probability2 = teamPoints2 / (teamPoints1 + teamPoints2) * 100;
                    matchupResultDiv.innerHTML = `
                        <p class="text-teal-100">${teamName1}: ${teamPoints1.toFixed(2)} pts (${probability1.toFixed(1)}% win probability)</p>
                        <p class="text-teal-100">${teamName2}: ${teamPoints2.toFixed(2)} pts (${probability2.toFixed(1)}% win probability)</p>
                    `;
                } catch (error) {
                    console.error('Error predicting matchup:', error);
                    document.getElementById('matchupResult').innerHTML = '<p class="text-red-400">Error predicting matchup outcome.</p>';
                }
            });
        }

        // News Integration with Caching
        const newsList = document.getElementById('newsList');
        const loadMoreNewsBtn = document.getElementById('loadMoreNews');
        let newsOffset = 0;
        const newsPerLoad = 6;
        let allNews = JSON.parse(localStorage.getItem('cachedNews')) || [];

        function displayNews(articles, append = false) {
            if (!append) newsList.innerHTML = '';
            if (articles.length === 0) {
                newsList.innerHTML = '<p class="text-teal-300">No news available.</p>';
                loadMoreNewsBtn.classList.add('hidden');
                return;
            }
            articles.forEach(article => {
                const div = document.createElement('div');
                div.className = 'bg-teal-800/60 backdrop-blur-md p-4 rounded-xl shadow-md';
                div.innerHTML = `
                    <h4 class="text-xl font-semibold mb-2"><a href="${article.link}" target="_blank" class="text-teal-200 hover:text-white">${article.title}</a></h4>
                    <p class="text-teal-300 text-sm">${article.description || 'No summary available.'}</p>
                `;
                newsList.appendChild(div);
            });
            loadMoreNewsBtn.classList.toggle('hidden', articles.length < newsPerLoad);
        }

        async function fetchNews() {
            try {
                if (allNews.length > newsOffset) {
                    displayNews(allNews.slice(newsOffset, newsOffset + newsPerLoad));
                    newsOffset += newsPerLoad;
                    return;
                }
                const corsProxy = 'https://api.allorigins.win/raw?url=';
                const espnUrl = corsProxy + encodeURIComponent('https://www.espn.com/espn/rss/nfl/news');
                const sleeperUrl = 'https://api.sleeper.app/v1/players/nfl/trending/add?limit=10';

                const [espnResponse, sleeperResponse] = await Promise.all([
                    fetch(espnUrl).then(res => res.text()),
                    fetch(sleeperUrl).then(res => res.json())
                ]);

                const parser = new DOMParser();
                const xml = parser.parseFromString(espnResponse, 'text/xml');
                const espnArticles = Array.from(xml.querySelectorAll('item')).slice(0, 10).map(item => ({
                    title: item.querySelector('title').textContent,
                    link: item.querySelector('link').textContent,
                    description: item.querySelector('description')?.textContent || ''
                }));

                const sleeperNews = sleeperResponse.map(player => ({
                    title: `${player.first_name} ${player.last_name} Trending Up`,
                    link: `https://sleeper.app/players/nfl/${player.player_id}`,
                    description: `Added by ${player.add_count || 0} managers in the last 24 hours.`
                }));

                allNews = [...espnArticles, ...sleeperNews];
                localStorage.setItem('cachedNews', JSON.stringify(allNews));
                displayNews(allNews.slice(newsOffset, newsOffset + newsPerLoad));
                newsOffset += newsPerLoad;
            } catch (error) {
                console.error('Error fetching news:', error);
                newsList.innerHTML = '<p class="text-red-400 text-center">Failed to load news.</p>';
            }
        }

        if (newsList && loadMoreNewsBtn) {
            fetchNews();
            loadMoreNewsBtn.addEventListener('click', () => {
                if (allNews.length > newsOffset) {
                    displayNews(allNews.slice(newsOffset, newsOffset + newsPerLoad), true);
                    newsOffset += newsPerLoad;
                } else {
                    fetchNews();
                }
            });
        }
    } catch (err) {
        console.error('Global error:', err);
    }
});
