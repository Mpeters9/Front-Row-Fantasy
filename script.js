document.addEventListener('DOMContentLoaded', () => {
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

    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        mobileMenuToggle.setAttribute('aria-expanded', !mobileMenu.classList.contains('hidden'));
    });

    const mockTeams = [
        { name: 'Team Alpha', players: ['Josh Allen', 'Christian McCaffrey', 'Davante Adams', 'Travis Kelce'] },
        { name: 'Team Beta', players: ['Patrick Mahomes', 'Derrick Henry', 'Justin Jefferson', 'George Kittle'] },
        { name: 'Team Gamma', players: ['Lamar Jackson', 'Saquon Barkley', 'Tyreek Hill', 'Mark Andrews'] }
    ];

    const showLoader = (id) => document.getElementById(id)?.classList?.remove('hidden');
    const hideLoader = (id) => document.getElementById(id)?.classList?.add('hidden');

    const fantasyTicker = document.getElementById('fantasyTicker');
    const tickerLoader = document.getElementById('tickerLoader');
    const tickerToggle = document.getElementById('tickerToggle');
    if (fantasyTicker && tickerLoader && tickerToggle) {
        showLoader('tickerLoader');
        const fetchWithTimeout = (url, timeout = 10000) => Promise.race([
            fetch(url),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
        ]);
        fetchWithTimeout('https://api.sleeper.app/v1/players/nfl')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                const players = Object.values(data).filter(player => player.fantasy_positions && player.team).slice(0, 10);
                const tickerContent = players.concat(players).map(player => {
                    const points = (player.stats?.2025?.pts_ppr || 0) + (player.stats?.2025?.rec || 0) * 1;
                    return `<span class="inline-flex items-center px-2 py-1 bg-teal-600 text-white rounded shadow whitespace-nowrap">${player.full_name} (${player.fantasy_positions[0]} - ${player.team}) - ${points.toFixed(1)} pts</span>`;
                }).join('');
                fantasyTicker.innerHTML = tickerContent;
                hideLoader('tickerLoader');
            })
            .catch(error => {
                console.error('Error loading fantasy ticker:', error);
                fantasyTicker.innerHTML = '<span class="inline-flex items-center px-2 py-1 bg-teal-600 text-white rounded shadow whitespace-nowrap">Patrick Mahomes (QB - KC) - 25.5 pts</span><span class="inline-flex items-center px-2 py-1 bg-teal-600 text-white rounded shadow whitespace-nowrap">Christian McCaffrey (RB - SF) - 18.2 pts</span>';
                hideLoader('tickerLoader');
            });
        tickerToggle.addEventListener('click', () => {
            fantasyTicker.classList.toggle('paused');
            tickerToggle.textContent = fantasyTicker.classList.contains('paused') ? 'Play' : 'Pause';
        });
    }

    const liveScoreboard = document.getElementById('liveScoreboard');
    if (liveScoreboard) {
        const fetchWithTimeout = (url, timeout = 10000) => Promise.race([
            fetch(url),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
        ]);
        fetchWithTimeout('https://api.sleeper.app/v1/players/nfl/trending/add?limit=3')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                liveScoreboard.innerHTML = data.map(player => `
                    <div class="bg-white dark:bg-gray-800 p-2 rounded shadow">
                        <p class="text-sm font-semibold">${player.first_name} ${player.last_name}</p>
                        <p class="text-xs text-gray-600 dark:text-gray-400">${player.add_count} adds</p>
                    </div>
                `).join('');
            })
            .catch(error => {
                console.error('Error loading live scoreboard:', error);
                liveScoreboard.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Failed to load scoreboard.</p>';
            });
    }

    const topPlayersDiv = document.getElementById('topPlayers');
    if (topPlayersDiv) {
        showLoader('playersLoader');
        const fetchWithTimeout = (url, timeout = 10000) => Promise.race([
            fetch(url),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
        ]);
        fetchWithTimeout('https://api.sleeper.app/v1/players/nfl')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                const players = Object.values(data).filter(player => player.fantasy_positions && player.team).sort((a, b) => {
                    const pointsA = (a.stats?.2025?.pts_ppr || 0) + (a.stats?.2025?.rec || 0) * 1;
                    const pointsB = (b.stats?.2025?.pts_ppr || 0) + (b.stats?.2025?.rec || 0) * 1;
                    return pointsB - pointsA;
                }).slice(0, 5);
                players.forEach(player => {
                    const points = (player.stats?.2025?.pts_ppr || 0) + (player.stats?.2025?.rec || 0) * 1;
                    const div = document.createElement('div');
                    div.className = 'bg-white dark:bg-gray-800 p-2 rounded shadow hover:shadow-lg transition';
                    div.innerHTML = `
                        <div class="text-gray-900 dark:text-white font-semibold text-center">${player.full_name}</div>
                        <div class="text-gray-600 dark:text-gray-400 text-center text-sm">${player.fantasy_positions[0]} - ${player.team}</div>
                        <div class="text-gray-600 dark:text-gray-400 text-center">${points.toFixed(2)} pts</div>
                    `;
                    topPlayersDiv.appendChild(div);
                });
                hideLoader('playersLoader');
            })
            .catch(error => {
                console.error('Error loading top players:', error);
                topPlayersDiv.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center col-span-full">Failed to load top players.</p>';
                hideLoader('playersLoader');
            });
    }

    try {
        const teamSelect1 = document.getElementById('team1');
        const teamSelect2 = document.getElementById('team2');
        const matchupSelect1 = document.getElementById('matchupTeam1');
        const matchupSelect2 = document.getElementById('matchupTeam2');
        mockTeams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.name;
            option.textContent = team.name;
            teamSelect1?.appendChild(option.cloneNode(true));
            teamSelect2?.appendChild(option.cloneNode(true));
            matchupSelect1?.appendChild(option.cloneNode(true));
            matchupSelect2?.appendChild(option);
        });

        fetch('https://api.sleeper.app/v1/players/nfl')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not OK');
                return response.json();
            })
            .then(data => {
                const waiverList = document.getElementById('waiverList');
                if (waiverList) {
                    waiverList.innerHTML = '<h3 class="text-md font-semibold mb-1 text-gray-900 dark:text-white">Top Waiver Picks:</h3>';
                    const players = Object.values(data).filter(player => player.fantasy_positions && player.team).sort((a, b) => {
                        const pointsA = (a.stats?.2025?.pts_ppr || 0) + (a.stats?.2025?.rec || 0) * 1;
                        const pointsB = (b.stats?.2025?.pts_ppr || 0) + (b.stats?.2025?.rec || 0) * 1;
                        return pointsB - pointsA;
                    }).slice(0, 5);
                    players.forEach(player => {
                        const points = (player.stats?.2025?.pts_ppr || 0) + (player.stats?.2025?.rec || 0) * 1;
                        const playerDiv = document.createElement('div');
                        playerDiv.className = 'bg-white dark:bg-gray-800 p-2 rounded shadow';
                        playerDiv.innerHTML = `
                            <span class="text-gray-800 dark:text-white">${player.full_name} (${player.fantasy_positions[0]})</span>
                            <span class="text-gray-600 dark:text-gray-400">${points.toFixed(2)} pts</span>
                        `;
                        waiverList.appendChild(playerDiv);
                    });
                }
            })
            .catch(error => {
                console.error('Error loading waiver wire picks:', error);
                if (document.getElementById('waiverList')) {
                    document.getElementById('waiverList').innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Error loading waiver wire picks.</p>';
                }
            });

        document.getElementById('tradeAnalyzerBtn')?.addEventListener('click', async () => {
            try {
                const teamName1 = document.getElementById('team1').value;
                const teamName2 = document.getElementById('team2').value;
                const tradeData = await fetch('https://api.sleeper.app/v1/players/nfl').then(res => res.json());
                const teamPlayers1 = mockTeams.find(t => t.name === teamName1)?.players || [];
                const teamPlayers2 = mockTeams.find(t => t.name === teamName2)?.players || [];
                const teamStats1 = teamPlayers1.map(p => Object.values(tradeData).find(pl => pl.full_name === p)).filter(p => p);
                const teamStats2 = teamPlayers2.map(p => Object.values(tradeData).find(pl => pl.full_name === p)).filter(p => p);
                const teamPoints1 = teamStats1.reduce((sum, p) => sum + ((p.stats?.2025?.pts_ppr || 0) + (p.stats?.2025?.rec || 0) * 1), 0);
                const teamPoints2 = teamStats2.reduce((sum, p) => sum + ((p.stats?.2025?.pts_ppr || 0) + (p.stats?.2025?.rec || 0) * 1), 0);
                const tradeResultDiv = document.getElementById('tradeResult');
                const tradeChart = document.getElementById('tradeChart').getContext('2d');
                if (teamPoints1 && teamPoints2) {
                    const pointsDiff = Math.abs(teamPoints1 - teamPoints2);
                    tradeResultDiv.innerHTML = pointsDiff < 15 ? `
                        <p class="text-green-600 dark:text-green-400">Fair trade: ${teamName1} (${teamPoints1.toFixed(2)} pts) vs ${teamName2} (${teamPoints2.toFixed(2)} pts)</p>
                    ` : `
                        <p class="text-red-600 dark:text-red-400">Unbalanced trade: ${teamName1} (${teamPoints1.toFixed(2)} pts) vs ${teamName2} (${teamPoints2.toFixed(2)} pts)</p>
                    `;
                    new Chart(tradeChart, {
                        type: 'bar',
                        data: {
                            labels: [teamName1, teamName2],
                            datasets: [{
                                label: 'Fantasy Points',
                                data: [teamPoints1, teamPoints2],
                                backgroundColor: ['#26A69A', '#B0BEC5'],
                                borderColor: ['#26A69A', '#B0BEC5'],
                                borderWidth: 1
                            }]
                        },
                        options: { responsive: true, scales: { y: { beginAtZero: true } } }
                    });
                    document.getElementById('tradeChart').classList.remove('hidden');
                } else {
                    tradeResultDiv.innerHTML = '<p class="text-red-600 dark:text-red-400">Please select both teams for trade analysis.</p>';
                    document.getElementById('tradeChart').classList.add('hidden');
                }
            } catch (error) {
                console.error('Error analyzing trade:', error);
                document.getElementById('tradeResult').innerHTML = '<p class="text-red-600 dark:text-red-400">Error analyzing trade data.</p>';
                document.getElementById('tradeChart').classList.add('hidden');
            }
        });

        document.getElementById('matchupBtn')?.addEventListener('click', async () => {
            try {
                const teamName1 = document.getElementById('matchupTeam1').value;
                const teamName2 = document.getElementById('matchupTeam2').value;
                const matchupData = await fetch('https://api.sleeper.app/v1/players/nfl').then(res => res.json());
                const teamPlayers1 = mockTeams.find(t => t.name === teamName1)?.players || [];
                const teamPlayers2 = mockTeams.find(t => t.name === teamName2)?.players || [];
                const teamStats1 = teamPlayers1.map(p => Object.values(matchupData).find(pl => pl.full_name === p)).filter(p => p);
                const teamStats2 = teamPlayers2.map(p => Object.values(matchupData).find(pl => pl.full_name === p)).filter(p => p);
                const teamPoints1 = teamStats1.reduce((sum, p) => sum + ((p.stats?.2025?.pts_ppr || 0) + (p.stats?.2025?.rec || 0) * 1), 0);
                const teamPoints2 = teamStats2.reduce((sum, p) => sum + ((p.stats?.2025?.pts_ppr || 0) + (p.stats?.2025?.rec || 0) * 1), 0);
                const matchupResultDiv = document.getElementById('matchupResult');
                const pointDiff = Math.abs(teamPoints1 - teamPoints2);
                const probability1 = teamPoints1 / (teamPoints1 + teamPoints2) * 100;
                const probability2 = teamPoints2 / (teamPoints1 + teamPoints2) * 100;
                const confidence = pointDiff > 10 ? 'Low' : 'High';
                matchupResultDiv.innerHTML = `
                    <p class="text-gray-900 dark:text-white">${teamName1}: ${teamPoints1.toFixed(2)} pts (${probability1.toFixed(1)}% win probability)</p>
                    <p class="text-gray-900 dark:text-white">${teamName2}: ${teamPoints2.toFixed(2)} pts (${probability2.toFixed(1)}% win probability)</p>
                    <p class="text-gray-600 dark:text-gray-400 text-sm">Confidence: ${confidence}</p>
                `;
            } catch (error) {
                console.error('Error predicting matchup:', error);
                document.getElementById('matchupResult').innerHTML = '<p class="text-red-600 dark:text-red-400">Error predicting matchup outcome.</p>';
            }
        });

        const newsList = document.getElementById('newsList');
        const loadMoreNewsBtn = document.getElementById('loadMoreNews');
        let newsOffset = 0;
        const newsPerLoad = 6;
        let allNews = JSON.parse(localStorage.getItem('cachedNews')) || [];

        function displayNews(articles, append = false) {
            if (!append) newsList.innerHTML = '';
            if (articles.length === 0) {
                newsList.innerHTML = '<p class="text-gray-600 dark:text-gray-400">No news available.</p>';
                loadMoreNewsBtn.classList.add('hidden');
                return;
            }
            articles.forEach(article => {
                const div = document.createElement('div');
                div.className = 'bg-white dark:bg-gray-800 p-2 rounded shadow';
                div.innerHTML = `
                    <h4 class="text-sm font-semibold mb-1"><a href="${article.link}" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">${article.title}</a></h4>
                    <p class="text-gray-600 dark:text-gray-400 text-xs">${article.description || 'No summary available.'}</p>
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
                newsList.innerHTML = '<p class="text-red-600 dark:text-red-400 text-center">Failed to load news.</p>';
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
