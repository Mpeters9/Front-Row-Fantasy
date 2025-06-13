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

    // Load players_2025.json once for reuse
    let players2025 = [];
    fetch('players_2025.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load players_2025.json');
            return response.json();
        })
        .then(data => {
            players2025 = data;
            loadFantasyTicker();
            // Other features can use players2025 after this point
        })
        .catch(error => {
            console.error('Error loading players_2025.json:', error);
            loadFantasyTicker(true); // Load with fallback
        });

    // Fantasy Points Ticker with players_2025.json
    const fantasyTicker = document.getElementById('fantasyTicker');
    function loadFantasyTicker(fallback = false) {
        if (!fantasyTicker) return;
        showLoader('tickerLoader');
        if (fallback || players2025.length === 0) {
            fantasyTicker.innerHTML = '<p class="text-red-400 text-center text-xs">Failed to load fantasy ticker. Using fallback.</p>';
            fantasyTicker.innerHTML += '<span class="inline-flex items-center px-2 py-1 bg-purple-700/60 text-cyan-200 rounded-md shadow-md whitespace-nowrap min-w-[160px]">Patrick Mahomes (QB - KC) - 25.1 pts</span>';
            hideLoader('tickerLoader');
            return;
        }
        const tickerContent = players2025.concat(players2025).map(player => {
            return `
                <span class="inline-flex items-center px-2 py-1 bg-purple-700/60 text-cyan-200 rounded-md shadow-md whitespace-nowrap min-w-[160px]">
                    ${player.name} (${player.position} - ${player.team}) - ${player.fantasy_points.toFixed(1)} pts
                </span>
            `;
        }).join('');
        fantasyTicker.innerHTML = tickerContent;
        fantasyTicker.style.animation = 'marquee 15s linear infinite';
        hideLoader('tickerLoader');
    }

    // Top Players with Sleeper API (unchanged)
    const topPlayersDiv = document.getElementById('topPlayers');
    if (topPlayersDiv) {
        showLoader('playersLoader');
        fetch('https://api.sleeper.app/v1/players/nfl')
            .then(response => response.ok ? response.json() : Promise.reject('Network error'))
            .then(data => {
                const players = Object.values(data).filter(p => p.fantasy_positions && p.team).sort((a, b) => {
                    const pointsA = (a.stats?.2025?.pts_ppr || 0) + (a.stats?.2025?.rec || 0) * 1;
                    const pointsB = (b.stats?.2025?.pts_ppr || 0) + (b.stats?.2025?.rec || 0) * 1;
                    return pointsB - pointsA;
                }).slice(0, 5);
                players.forEach(player => {
                    const points = (player.stats?.2025?.pts_ppr || 0) + (player.stats?.2025?.rec || 0) * 1;
                    const div = document.createElement('div');
                    div.className = 'bg-purple-800/50 backdrop-blur-md p-2 rounded-lg shadow-md hover:shadow-lg transition-all';
                    div.innerHTML = `
                        <div class="text-center">
                            <div class="text-sm font-medium">${player.full_name}</div>
                            <div class="text-xs text-cyan-400">${player.fantasy_positions[0]} - ${player.team}</div>
                            <div class="text-xs">${points.toFixed(2)} pts</div>
                        </div>
                    `;
                    topPlayersDiv.appendChild(div);
                });
                hideLoader('playersLoader');
            })
            .catch(error => {
                console.error('Error loading top players:', error);
                topPlayersDiv.innerHTML = '<p class="text-red-400 text-center text-xs col-span-full">Failed to load top players.</p>';
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

            // Waiver Wire with Sleeper API (unchanged)
            fetch('https://api.sleeper.app/v1/players/nfl')
                .then(response => response.ok ? response.json() : Promise.reject('Network error'))
                .then(data => {
                    const waiverList = document.getElementById('waiverList');
                    if (waiverList) {
                        waiverList.innerHTML = '<h3 class="text-base font-bold text-cyan-300 mb-1">Top Waiver Picks:</h3>';
                        const players = Object.values(data).filter(p => p.fantasy_positions && p.team).sort((a, b) => {
                            const pointsA = (a.stats?.2025?.pts_ppr || 0) + (a.stats?.2025?.rec || 0) * 1;
                            const pointsB = (b.stats?.2025?.pts_ppr || 0) + (b.stats?.2025?.rec || 0) * 1;
                            return pointsB - pointsA;
                        }).slice(0, 5);
                        players.forEach(player => {
                            const points = (player.stats?.2025?.pts_ppr || 0) + (player.stats?.2025?.rec || 0) * 1;
                            const playerDiv = document.createElement('div');
                            playerDiv.className = 'bg-purple-800/50 backdrop-blur-md p-1.5 rounded-lg shadow-md';
                            playerDiv.innerHTML = `
                                <span class="text-xs text-cyan-200">${player.full_name} (${player.fantasy_positions[0]})</span>
                                <span class="text-xs text-cyan-400">${points.toFixed(2)} pts</span>
                            `;
                            waiverList.appendChild(playerDiv);
                        });
                    }
                })
                .catch(error => {
                    console.error('Error loading waiver wire picks:', error);
                    document.getElementById('waiverList').innerHTML = '<p class="text-red-400 text-center text-xs">Error loading waiver wire picks.</p>';
                });

            // Trade Analyzer with players_2025.json
            document.getElementById('tradeAnalyzerBtn')?.addEventListener('click', () => {
                const teamName1 = teamSelect1.value;
                const teamName2 = teamSelect2.value;
                const teamPlayers1 = mockTeams.find(t => t.name === teamName1)?.players || [];
                const teamPlayers2 = mockTeams.find(t => t.name === teamName2)?.players || [];
                const teamPoints1 = teamPlayers1.reduce((sum, p) => {
                    const player = players2025.find(pl => pl.name === p);
                    return sum + (player ? player.fantasy_points : 0);
                }, 0);
                const teamPoints2 = teamPlayers2.reduce((sum, p) => {
                    const player = players2025.find(pl => pl.name === p);
                    return sum + (player ? player.fantasy_points : 0);
                }, 0);
                const tradeResultDiv = document.getElementById('tradeResult');
                if (teamPoints1 && teamPoints2) {
                    const pointsDiff = Math.abs(teamPoints1 - teamPoints2);
                    tradeResultDiv.innerHTML = pointsDiff < 15 ? `
                        <p class="text-cyan-300 text-xs">Fair trade: ${teamName1} (${teamPoints1.toFixed(2)} pts) vs ${teamName2} (${teamPoints2.toFixed(2)} pts)</p>
                    ` : `
                        <p class="text-red-400 text-xs">Unbalanced trade: ${teamName1} (${teamPoints1.toFixed(2)} pts) vs ${teamName2} (${teamPoints2.toFixed(2)} pts)</p>
                    `;
                } else {
                    tradeResultDiv.innerHTML = '<p class="text-red-400 text-xs">Please select both teams for trade analysis.</p>';
                }
            });

            // Matchup Predictor with players_2025.json
            document.getElementById('matchupBtn')?.addEventListener('click', () => {
                const teamName1 = matchupSelect1.value;
                const teamName2 = matchupSelect2.value;
                const teamPlayers1 = mockTeams.find(t => t.name === teamName1)?.players || [];
                const teamPlayers2 = mockTeams.find(t => t.name === teamName2)?.players || [];
                const teamPoints1 = teamPlayers1.reduce((sum, p) => {
                    const player = players2025.find(pl => pl.name === p);
                    return sum + (player ? player.fantasy_points : 0);
                }, 0);
                const teamPoints2 = teamPlayers2.reduce((sum, p) => {
                    const player = players2025.find(pl => pl.name === p);
                    return sum + (player ? player.fantasy_points : 0);
                }, 0);
                const matchupResultDiv = document.getElementById('matchupResult');
                const probability1 = teamPoints1 / (teamPoints1 + teamPoints2) * 100;
                const probability2 = teamPoints2 / (teamPoints1 + teamPoints2) * 100;
                matchupResultDiv.innerHTML = `
                    <p class="text-cyan-300 text-xs">${teamName1}: ${teamPoints1.toFixed(2)} pts (${probability1.toFixed(1)}% win probability)</p>
                    <p class="text-cyan-300 text-xs">${teamName2}: ${teamPoints2.toFixed(2)} pts (${probability2.toFixed(1)}% win probability)</p>
                `;
            });
        }

        // News Integration with Sleeper API Trending (unchanged)
        const newsList = document.getElementById('newsList');
        const loadMoreNewsBtn = document.getElementById('loadMoreNews');
        let newsOffset = 0;
        const newsPerLoad = 6;
        let allNews = JSON.parse(localStorage.getItem('cachedNews')) || [];

        function displayNews(articles, append = false) {
            if (!append) newsList.innerHTML = '';
            if (articles.length === 0) {
                newsList.innerHTML = '<p class="text-cyan-400 text-xs">No news available.</p>';
                loadMoreNewsBtn.classList.add('hidden');
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
            loadMoreNewsBtn.classList.toggle('hidden', articles.length < newsPerLoad);
        }

        async function fetchNews() {
            try {
                if (allNews.length > newsOffset) {
                    displayNews(allNews.slice(newsOffset, newsOffset + newsPerLoad));
                    newsOffset += newsPerLoad;
                    return;
                }
                const sleeperResponse = await fetch('https://api.sleeper.app/v1/players/nfl/trending/add?limit=10').then(res => res.json());
                allNews = sleeperResponse.map(player => ({
                    title: `${player.first_name} ${player.last_name} Trending Up`,
                    link: `https://sleeper.app/players/nfl/${player.player_id}`,
                    description: `Added by ${player.add_count || 0} managers in the last 24 hours.`
                }));
                localStorage.setItem('cachedNews', JSON.stringify(allNews));
                displayNews(allNews.slice(newsOffset, newsOffset + newsPerLoad));
                newsOffset += newsPerLoad;
            } catch (error) {
                console.error('Error fetching news:', error);
                newsList.innerHTML = '<p class="text-red-400 text-center text-xs">Failed to load news.</p>';
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
