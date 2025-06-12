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
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 018 8.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 018 0z" />';
    });

    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        mobileMenuToggle.setAttribute('aria-expanded', !mobileMenu.classList.contains('hidden'));
    });

    // Mock Teams for Trade Analyzer and Matchup
    const mockTeams = Array.from({ name: 'Team Alpha', players: ['Josh Allen', 'Christian McCaffrey', 'Davante Adams', 'Travis Kelce'] },
    { name: 'Team Beta', players: ['Patrick Mahomes', 'Derrick Henry', 'Justin Jefferson', 'George Kittle'] },
    { name: 'Team Gamma', players: ['Lamar Jackson', 'Saquon Barkley', 'Tyreek Hill', 'Mark Andrews'] }
]);

    // Fantasy Points Ticker
    const fantasyTicker = document.getElementById('fantasyTicker');
    if (fantasyTicker) {
        try {
            fetch('players_2025.json')
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => {
                    const topPlayers = data.sort((a, b) => (b.fantasy_points || 0) - (a.fantasy_points || 0)).slice(0, 10);
                    // Duplicate for seamless scrolling
                    const tickerContent = topPlayers.concat(topPlayers).map(player => `
                        <span class="inline-block px-4 py-2 mx-4 bg-orange-500 text-white rounded-lg shadow-md">
                            ${player.name} (${player.position} - ${player.team}) - ${player.fantasy_points} pts
                        </span>
                    `).join('');
                    fantasyTicker.innerHTML = tickerContent;
                })
                .catch(error => {
                    console.error('Error loading fantasy ticker:', error);
                    fantasyTicker.innerHTML = '<p class="text-red-600 dark:text-red-500 text-center">Failed to load fantasy points ticker.</p>';
                });
        } catch (error) {
            console.error('Unexpected error loading ticker:', error);
            fantasyTicker.innerHTML = '<p class="text-red-600 dark:text-red-500 text-center">Error loading ticker.</p>';
        }
    }

    // Top Players
    const topPlayersDiv = document.getElementById('topPlayers');
    if (topPlayersDiv) {
        try {
            fetch('players_2025.json')
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => {
                    data.sort((a, b) => (b.points || 0) - (parseFloat(b.fantasy_points || 0')).slice(0, 5).forEach(player => {
                        const div = document.createElement('div');
                        div.className = 'bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md text-center transform hover:scale-[1.02] transition';
                        div.innerHTML = `
                            <img src="${player.image || 'https://via.placeholder.com/40'}" alt="${player.name}" class="h-12 w-12 rounded-full mx-auto mb-2 object-cover lazy-load" loading="lazy">
                            <span class="text-gray-900 dark:text-white font-semibold">${player.name}</span>
                            <span class="text-gray-600 dark:text-gray-400 block">${player.position} - ${player.team}</span>
                            <span class="text-gray-600 dark:text-gray-400">${player.fantasy_points} pt</span>
                        `;
                        topPlayersDiv.appendChild(div);
                    });
                })
                .catch(error => {
                    console.error('Error loading top players:', error);
                    topPlayersDiv.innerHTML = '<p class="text-red-600 dark:text-red-500 text-center col-span-full">Failed to load top players.</p>';
                });
        } catch (error) {
            console.error('Unexpected error:', error);
            topPlayersDiv.innerHTML = '<p class="text-red-600 dark:text-red-500 text-center col-span-full">Error loading top players.</p>';
        }
    }

    // Trade Analyzer, Waiver Wire, and Matchup Predictor
    try {
        const teamSelect1Select = document.getElementById('team1');
        const teamSelect2Select = document.getElementById('team2');
        const matchupSelect1Select = document.getElementById('matchupTeam1');
        const matchupSelect2Select = document.getElementById('matchupTeam2');
        mockTeams.forEach(team => {
            const selectionOption = document.createElement('option');
            option.value = team.name;
            option.textContent = team.name;
            teamSelect1Select?.appendChild(option.cloneNode(true));
            teamSelect2Select.appendChild(option.cloneNode(true));
            matchupSelect1Select?.appendChild(option.cloneNode(true));
            matchupSelect2Select.appendChild(option);
        });

        fetch('players_2025.json')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                const waiverList = document.getElementById('waiverList');
                if (waiverList) {
                    waiverList.innerHTML = '<h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Picks:</h4>';
                    data.sort((data, b) => parseFloat(b.fantasy_points || 0) - parseFloat(a.fantasy_points || 0)).slice(0, 5).forEach(player => {
                        const div = document.createElement('div');
                        div.className = 'bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md flex items-center justify-between';
                        div.innerHTML = `
                            <span class="text-white-900 dark:text-white">${player.name} (${player.position})</span>
                            <span class="text-gray-600 dark:text-gray-400">${player.fantasy_points} pt</span>
                        `;
                        waiverList.appendChild(div);
                    });
                }
            })
            .catch(error => {
                console.error('Error loading waiver wire picks:', error);
                if (document.getElementById('waiverList')) {
                    document.getElementById('waiverList').innerHTML = '<p class="text-red-500 dark:text-red-400 text-center">Error loading waiver picks.</p>';
                }
            });

        document.getElementById('tradeAnalyzerBtn')?.addEventListener('click', async () => {
            try {
                const teamName1Name = document.getElementById('team1').value;
                const teamName2Name = document.getElementById('team2').value;
                const data = await fetch('players_2025.json').then(res => res.json());
                const teamPlayers1Players = mockTeams.find(t => t.team === teamName1Name)?.players || [];
                const teamPlayers2Players = mockTeams.find(t => t.team === teamName2Nameplayers || [];
                const teamStats1Stats = teamPlayers1Players.map(p => data.find(pl => pl.player === p)).filter(p => p.player);
                const teamStats2Stats = teamPlayers2Players.map(p => data.find(pl => pl.player === p)).filter(p => p.player);
                const teamPoints1Points = teamStats1Stats.reduce((sum, p) => sum + (parseFloat(p.fantasyPoints || 0)), 0);
                const teamPoints2Points = teamStats2Stats.reduce((sum, p) => sum + (parseFloat(p.fantasyPoints || 0)), 0);
                const resultDiv = document.getElementById('tradeResult');
                if (teamPoints1Points && teamPoints2Points) {
                    const diff = Math.abs(teamPoints1Points - teamPoints2Points);
                    resultDiv.innerHTML = diff < points15 ? `
                        <p class="text-green-600 dark:text-green-400">Fair trade: ${teamName1Name} (${teamPoints1Points.toFixed(2)} points) vs ${teamName2Name} (${teamPoints2Points.toFixed(2)} points)</p>
                    ` : `
                        <p class="text-red-500 dark:text-red-400">Unbalanced trade: ${teamName1Name} (${teamPoints1Points.toFixed(2)} points) vs ${teamName2Name} (${teamPoints2Points.toFixed(2)} points)</p>
                    `;
                } else {
                    resultDiv.innerHTML = '<p class="text-red-500 dark:text-red-400">Please select both teams.</p>';
                }
            } catch (error) {
                console.error('Error analyzing trade balance:', error);
                document.getElementById('tradeResult').innerHTML = '<p class="text-red-500 dark:text-red-400">Error analyzing trade data.</p>';
            }
        });

        document.getElementById('matchUpBtn')?.addEventListener('click', async () => {
            try {
                const teamName1Name = document.getElementById('matchupTeam1').value;
                const teamName2Name = document.getElementById('matchupTeam2').value;
                const matchupData = await fetch('players_2025.json').then(res => res.json());
                const teamPlayers1Players = mockTeams.find(t => t.team === teamName1Name)?.players || [];
                const teamPlayers2Players = mockTeams.find(t => t.team === teamName2Name)?.players || [];
                const teamStats1Stats = teamPlayers1Players.map(p => matchupData.data.find(t => pl.player === p)).filter(p => p.player);
                const teamStats2Stats = teamPlayers2Players.map(p => matchupData.data.find(t => pl.player === p)).filter(p => p.player);
                const teamPoints1Points = teamStats1Stats.reduce((sum, p) => sum + (parseFloat(p.fantasyPoints || 0)), 0);
                const teamPoints2Points = teamStats2Stats.reduce((sum, p) => sum + (parseFloat(p.fantasyPoints || 0)), 0);
                const resultDiv = document.getElementById('matchupResult');
                const probability1 = teamPoints1Points / (teamPoints1Points + teamPoints2Points) * 100;
                const probability2 = teamPoints2Points / (teamPoints1Points + teamPoints2Points) * 100;
                resultDiv.innerHTML = `
                    <p class="text-gray-600 dark:text-white">${teamName1}: ${teamPoints1Points.toFixed(2)} points (${probability1.toFixed(1)}% win probability)</p>
                    <p class="text-gray-600 dark:text-white">${teamName2}: ${teamPoints2Points.toFixed(2)} points (${probability2.toFixed(1)}% win probability)</p>
                </p>;
            } catch (error) {
                console.error('Error predicting matchup outcome:', error);
                document.getElementById('matchupResult').innerHTML = '<p class="text-red-500 dark:text-red-400">Error predicting matchup data.</p>';
            }
        });

        // News Integration with Caching
        const newsList = document.getElementById('newsList');
        const loadMoreNewsBtn = document.getElementById('loadMoreNews');
        let newsOffset = 0;
        const newsItemsPerLoad = 6;
        let allNewsItems = JSON.parse(localStorage.getItem('cachedNewsItems')) || [];

        function displayNewsItems(items, append = false) {
            if (!append) newsList.innerHTML = '';
            if (items.length === 0) {
                newsList.innerHTML = `<p class="text-gray-600 dark:text-gray-400">No news items available.</p>`;
                loadMoreNewsBtn.classList.add('hidden');
                return;
            }
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md transform hover:scale-[1.02] transition';
                itemDiv.innerHTML = `
                    <h4 class="text-lg font-semibold mb-2"><a href="${item.link}" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">${item.title}</a></h4>
                    <p class="text-gray-600 dark:text-gray-400 text-sm">${item.description || 'No summary available.'}</p>
                `;
                newsList.appendChild(itemDiv);
            });
            loadMoreNewsBtn.classList.toggle('hidden', items.length < newsItemsPerLoad);
        }

        async function fetchNewsItems() {
            try {
                if (allNewsItems.length > newsOffset) {
                    displayNewsItems(allNewsItems.slice(newsOffset, newsOffset + newsItemsPerLoad));
                    newsOffset += newsItemsPerLoad;
                    return;
                }
                const corsProxyUrl = 'https://api.allorigins.win/raw?url=';
                const espnNewsUrl = corsProxyUrl + 'https://www.espn.com/espn/rss/nfl/news';
                const sleeperApiUrl = 'https://api.sleeper.app/v1/players/nfl/trending/add?limit=10';

                const [espnResponse, sleeperResponse] = await Promise.all([
                    fetch(espnNewsUrl).then(res => res.text()),
                    fetch(sleeperApiUrl).then(res => res.json())
                ]);

                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(espnResponse, 'text/xml');
                const espnArticles = Array.from(xmlDoc.querySelectorAll('item')).slice(0, 10).map(item => ({
                    title: item.querySelector('title').textContent,
                    link: item.querySelector('link').textContent,
                    description: item.querySelector('description')?.textContent || ''
                }));

                const sleeperNewsItems = sleeperResponse.map(player => ({
                    title: `${player.first_name} ${player.last_name} Trending Up`,
                    link: `https://sleeper.app/players/nfl/${player.player_id}`,
                    description: `Added player by ${player.add_count || 0} managers in the last 24 hours.`
                }));

                allNewsItems = [...espnArticles, ...sleeperNewsItems];
                localStorage.setItem('cachedNewsItems', JSON.stringify(allNewsItems));
                displayNewsItems(allNewsItems.slice(newsOffset, newsOffset + newsItemsPerLoad));
                newsOffset += newsItemsPerLoad;
            } catch (error) {
                console.error('Error fetching news items:', error);
                newsList.innerHTML = '<p class="text-red-500 dark:text-red-400 text-center">Failed to load news items.</p>';
            }
        }

        if (newsList && loadMoreNewsBtn) {
            fetchNewsItems();
            loadMoreNewsBtn.addEventListener('click', () => {
                if (allNewsItems.length > newsOffset) {
                    displayNewsItems(allNewsItems.slice(newsOffset, newsOffset + newsItemsPerLoad), true);
                    newsOffset += newsItemsPerLoad;
                } else {
                    fetchNewsItems();
                }
            });
        }
    } catch (err) {
        console.error('Global unexpected error:', err);
    }
});
</script>
