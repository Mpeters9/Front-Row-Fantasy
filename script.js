document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
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

    // Trade Analyzer and Waiver Wire
    fetch('players.json')
        .then(response => response.json())
        .then(data => {
            const player1Select = document.getElementById('player1');
            const player2Select = document.getElementById('player2');
            data.forEach(player => {
                const option1 = document.createElement('option');
                option1.value = player.name;
                option1.textContent = `${player.name} (${player.position})`;
                player1Select.appendChild(option1);
                const option2 = option1.cloneNode(true);
                player2Select.appendChild(option2);
            });
            const waiverList = document.getElementById('waiverList');
            waiverList.innerHTML = '<h4 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Picks:</h4>';
            data.sort((a, b) => b.fantasyPoints - a.fantasyPoints).slice(0, 3).forEach(player => {
                const div = document.createElement('div');
                div.className = 'bg-gray-100 dark:bg-gray-700 p-4 rounded-lg transform hover:scale-105 transition duration-300';
                div.textContent = `${player.name} - ${player.position} (${player.fantasyPoints} pts)`;
                waiverList.appendChild(div);
            });
        })
        .catch(error => {
            console.error('Error fetching players:', error);
            document.getElementById('waiverList').innerHTML = '<p class="text-red-600 dark:text-red-400">Error loading waiver picks.</p>';
        });

    document.getElementById('tradeAnalyzerBtn').addEventListener('click', () => {
        const player1 = document.getElementById('player1').value;
        const player2 = document.getElementById('player2').value;
        fetch('players.json')
            .then(response => response.json())
            .then(data => {
                const p1 = data.find(p => p.name.toLowerCase() === player1.toLowerCase());
                const p2 = data.find(p => p.name.toLowerCase() === player2.toLowerCase());
                const resultDiv = document.getElementById('tradeResult');
                if (p1 && p2) {
                    const diff = Math.abs(p1.fantasyPoints - p2.fantasyPoints);
                    resultDiv.textContent = diff < 5 ? `Fair trade: ${p1.name} (${p1.fantasyPoints} pts) for ${p2.name} (${p2.fantasyPoints} pts)` : `Unbalanced trade: ${p1.name} (${p1.fantasyPoints} pts) vs ${p2.name} (${p2.fantasyPoints} pts)`;
                } else {
                    resultDiv.textContent = 'Please select both players.';
                }
            })
            .catch(error => {
                console.error('Error fetching players:', error);
                document.getElementById('tradeResult').textContent = 'Error loading player data.';
            });
    });

    // News Integration
    const newsList = document.getElementById('newsList');
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    const espnRssUrl = corsProxy + 'http://espn.go.com/espn/rss/nfl/news';
    const sleeperNewsUrl = 'https://api.sleeper.app/v1/players/nfl/trending/add?limit=5';

    function displayNews(articles) {
        newsList.innerHTML = '';
        articles.forEach(article => {
            const div = document.createElement('div');
            div.className = 'bg-gray-100 dark:bg-gray-700 p-4 rounded-lg';
            div.innerHTML = `
                <h4 class="font-semibold text-gray-900 dark:text-white"><a href="${article.link}" target="_blank" class="hover:underline">${article.title}</a></h4>
                <p class="text-gray-600 dark:text-gray-300">${article.description || 'No summary available.'}</p>
            `;
            newsList.appendChild(div);
        });
    }

    // Fetch ESPN RSS
    fetch(espnRssUrl)
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(data, 'text/xml');
            const items = xml.querySelectorAll('item');
            const articles = Array.from(items).slice(0, 3).map(item => ({
                title: item.querySelector('title').textContent,
                link: item.querySelector('link').textContent,
                description: item.querySelector('description')?.textContent || ''
            }));
            displayNews(articles);
        })
        .catch(error => {
            console.error('Error fetching ESPN news:', error);
            newsList.innerHTML = `
                <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-900 dark:text-white">News Unavailable</h4>
                    <p class="text-gray-600 dark:text-gray-300">Unable to load news. Please try again later.</p>
                </div>
            `;
        });

    // Fetch Sleeper Trending Players (optional)
    fetch(sleeperNewsUrl)
        .then(response => response.json())
        .then(data => {
            const sleeperNews = data.map(player => ({
                title: `${player.name} Trending Up`,
                link: `https://sleeper.app/players/nfl/${player.player_id}`,
                description: `Added by ${player.add_count} managers in the last 24 hours.`
            }));
            displayNews([...document.querySelectorAll('#newsList > div').map(div => ({
                title: div.querySelector('h4 a').textContent,
                link: div.querySelector('h4 a').href,
                description: div.querySelector('p').textContent
            })), ...sleeperNews.slice(0, 2)]);
        })
        .catch(error => console.error('Error fetching Sleeper news:', error));
});
