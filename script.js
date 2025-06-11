document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
    }
    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        themeIcon.innerHTML = document.documentElement.classList.contains('dark')
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />';
    });

    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        mobileMenuToggle.setAttribute('aria-expanded', !mobileMenu.classList.contains('hidden'));
    });

    // Mock Teams for Trade Analyzer and Matchup
    const mockTeams = [
        { name: 'Team Alpha', players: ['Josh Allen', 'Christian McCaffrey', 'Davante Adams', 'Travis Kelce'] },
        { name: 'Team Beta', players: ['Patrick Mahomes', 'Derrick Henry', 'Justin Jefferson', 'George Kittle'] },
        { name: 'Team Gamma', players: ['Lamar Jackson', 'Saquon Barkley', 'Tyreek Hill', 'Mark Andrews'] },
    ];

    // Top Players Banner
    const topPlayersDiv = document.getElementById('topPlayers');
    if (topPlayersDiv) {
        fetch('players_2025.json')
            .then(response => response.json())
            .then(data => {
                data.sort((a, b) => (b.fantasy_points || 0) - (a.fantasy_points || 0)).slice(0, 5).forEach(player => {
                    const div = document.createElement('div');
                    div.className = 'bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md text-center transform hover:scale-[1.02] transition';
                    div.innerHTML = `
                        <img src="${player.image || 'https://via.placeholder.com/40'}" alt="${player.name}" class="h-12 w-12 rounded-full mx-auto mb-2 object-cover lazy-load" loading="lazy">
                        <span class="text-gray-900 dark:text-white font-semibold">${player.name}</span>
                        <span class="text-gray-600 dark:text-gray-300 block">${player.position} - ${player.team}</span>
                        <span class="text-gray-600 dark:text-gray-300">${player.fantasy_points} pts</span>
                    `;
                    topPlayersDiv.appendChild(div);
                });
            })
            .catch(error => {
                console.error('Error loading top players:', error);
                topPlayersDiv.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center col-span-full">Failed to load top players.</p>';
            });
    }

    // Trade Analyzer, Waiver Wire, and Matchup Predictor
    try {
        const team1Select = document.getElementById('team1');
        const team2Select = document.getElementById('team2');
        const matchup1Select = document.getElementById('matchupTeam1');
        const matchup2Select = document.getElementById('matchupTeam2');
        mockTeams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.name;
            option.textContent = team.name;
            team1Select?.appendChild(option.cloneNode(true));
            team2Select?.appendChild(option.cloneNode(true));
            matchup1Select?.appendChild(option.cloneNode(true));
            matchup2Select?.appendChild(option);
        });

        fetch('players_2025.json')
            .then(response => response.json())
            .then(data => {
                const waiverList = document.getElementById('waiverList');
                if (waiverList) {
                    waiverList.innerHTML = '<h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Picks:</h4>';
                    data.sort((a, b) => (b.fantasy_points || 0) - (a.fantasy_points || 0)).slice(0, 5).forEach(player => {
                        const div = document.createElement('div');
                        div.className = 'bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg transform hover:scale-[1.02] transition';
                        div.innerHTML = `
                            <span class="text-gray-900 dark:text-white">${player.name} - ${player.position}</span>
                            <span class="text-gray-600 dark:text-gray-300">${player.fantasy_points} pts</span>
                        `;
                        waiverList.appendChild(div);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching waiver picks:', error);
                if (document.getElementById('waiverList')) {
                    document.getElementById('waiverList').innerHTML = '<p class="text-red-600 dark:text-red-400">Error loading waiver picks.</p>';
                }
            });

        document.getElementById('tradeAnalyzerBtn')?.addEventListener('click', async () => {
            try {
                const team1Name = document.getElementById('team1').value;
                const team2Name = document.getElementById('team2').value;
                const data = await fetch('players_2025.json').then(res => res.json());
                const team1Players = mockTeams.find(t => t.name === team1Name)?.players || [];
                const team2Players = mockTeams.find(t => t.name === team2Name)?.players || [];
                const team1Stats = team1Players.map(p => data.find(pl => pl.name === p)).filter(p => p);
                const team2Stats = team2Players.map(p => data.find(pl => pl.name === p)).filter(p => p);
                const team1Points = team1Stats.reduce((sum, p) => sum + (parseFloat(p.fantasy_points || 0)), 0);
                const team2Points = team2Stats.reduce((sum, p) => sum + (parseFloat(p.fantasy_points || 0)), 0);
                const resultDiv = document.getElementById('tradeResult');
                if (team1Points && team2Points) {
                    const diff = Math.abs(team1Points - team2Points);
                    resultDiv.innerHTML = diff < 15 ? `
                        <p class="text-green-600 dark:text-green-400">Fair trade: ${team1Name} (${team1Points.toFixed(2)} pts) vs ${team2Name} (${team2Points.toFixed(2)} pts)</p>
                    ` : `
                        <p class="text-red-600 dark:text-red-400">Unbalanced trade: ${team1Name} (${team1Points.toFixed(2)} pts) vs ${team2Name} (${team2Points.toFixed(2)} pts)</p>
                    `;
                } else {
                    resultDiv.innerHTML = '<p class="text-red-600 dark:text-red-400">Please select both teams.</p>';
                }
            } catch (error) {
                console.error('Error analyzing trade:', error);
                document.getElementById('tradeResult').innerHTML = '<p class="text-red-600 dark:text-red-400">Error analyzing trade.</p>';
            }
        });

        document.getElementById('matchupBtn')?.addEventListener('click', async () => {
            try {
                const team1Name = document.getElementById('matchupTeam1').value;
                const team2Name = document.getElementById('matchupTeam2').value;
                const data = await fetch('players_2025.json').then(res => res.json());
                const team1Players = mockTeams.find(t => t.name === team1Name)?.players || [];
                const team2Players = mockTeams.find(t => t.name === team2Name)?.players || [];
                const team1Stats = team1Players.map(p => data.find(pl => pl.name === p)).filter(p => p);
                const team2Stats = team2Players.map(p => data.find(pl => pl.name === p)).filter(p => p);
                const team1Points = team1Stats.reduce((sum, p) => sum + (parseFloat(p.fantasy_points || 0)), 0);
                const team2Points = team2Stats.reduce((sum, p) => sum + (parseFloat(p.fantasy_points || 0)), 0);
                const resultDiv = document.getElementById('matchupResult');
                const prob1 = team1Points / (team1Points + team2Points) * 100;
                const prob2 = team2Points / (team1Points + team2Points) * 100;
                resultDiv.innerHTML = `
                    <p class="text-gray-900 dark:text-white">${team1Name}: ${team1Points.toFixed(2)} pts (${prob1.toFixed(1)}% win probability)</p>
                    <p class="text-gray-900 dark:text-white">${team2Name}: ${team2Points.toFixed(2)} pts (${prob2.toFixed(1)}% win probability)</p>
                `;
            } catch (error) {
                console.error('Error predicting matchup:', error);
                document.getElementById('matchupResult').innerHTML = '<p class="text-red-600 dark:text-red-400">Error predicting matchup.</p>';
            }
        });

        // News Integration with Caching
        const newsList = document.getElementById('newsList');
        const loadMoreNewsBtn = document.getElementById('loadMoreNews');
        let newsOffset = 0;
        const newsPerLoad = 6;
        let allNews = JSON.parse(localStorage.getItem('cachedNews')) || [];

        function displayNews(articles, append = false) {
            if (!append) newsList.innerHTML = '';
            if (articles.length === 0) {
                newsList.innerHTML = `<p class="text-gray-600 dark:text-gray-300">No news available.</p>`;
                loadMoreNewsBtn.classList.add('hidden');
                return;
            }
            articles.forEach(article => {
                const div = document.createElement('div');
                div.className = 'bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg transform hover:shadow-xl transition';
                div.innerHTML = `
                    <h4 class="text-lg font-semibold mb-2"><a href="${article.link}" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">${article.title}</a></h4>
                    <p class="text-gray-500 dark:text-gray-400 text-sm">${article.description || 'No summary available.'}</p>
                `;
                newsList.appendChild(div);
            });
            loadMoreNewsBtn.classList.toggle('hidden', articles.length < newsPerLoad);
        }

        async function fetchNews() {
            try {
                if (allNews.length > 0) {
                    displayNews(allNews.slice(newsOffset, newsOffset + newsPerLoad));
                    newsOffset += newsPerLoad;
                    return;
                }
                const corsProxy = 'https://api.allorigins.win/raw?url=';
                const espnUrl = corsProxy + 'https://www.espn.com/espn/rss/nfl/news';
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
                newsList.innerHTML = '<p class="text-red-600 dark:text-red-400">Failed to load news.</p>';
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
</script>
