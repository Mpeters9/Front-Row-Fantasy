document.addEventListener('DOMContentLoaded', () => {
    // --- Element references ---
    const $ = id => document.getElementById(id);

    // --- Player data fallback ---
    let playersData = [
        { name: 'Christian McCaffrey', pos: 'RB', team: 'SF', adp: 1, points: 22.5, td: 1, fumble: 0, passTds: 0, receptions: 80 },
        { name: 'CeeDee Lamb', pos: 'WR', team: 'DAL', adp: 6, points: 20.1, td: 1, fumble: 0, passTds: 0, receptions: 100 },
        { name: 'Breece Hall', pos: 'RB', team: 'NYJ', adp: 3, points: 19.8, td: 1, fumble: 0, passTds: 0, receptions: 60 },
        { name: 'Justin Jefferson', pos: 'WR', team: 'MIN', adp: 4, points: 20.3, td: 1, fumble: 0, passTds: 0, receptions: 90 },
        { name: 'Ja\'Marr Chase', pos: 'WR', team: 'CIN', adp: 5, points: 20.0, td: 1, fumble: 0, passTds: 0, receptions: 85 },
        { name: 'Amon-Ra St. Brown', pos: 'WR', team: 'DET', adp: 7, points: 19.7, td: 1, fumble: 0, passTds: 0, receptions: 95 },
        { name: 'A.J. Brown', pos: 'WR', team: 'PHI', adp: 8, points: 19.5, td: 1, fumble: 0, passTds: 0, receptions: 80 },
        { name: 'Garrett Wilson', pos: 'WR', team: 'NYJ', adp: 9, points: 19.2, td: 1, fumble: 0, passTds: 0, receptions: 75 },
        { name: 'Patrick Mahomes', pos: 'QB', team: 'KC', adp: 10, points: 23.1, td: 1, fumble: 0, passTds: 35, receptions: 0 },
        { name: 'Travis Etienne Jr.', pos: 'RB', team: 'JAX', adp: 11, points: 18.9, td: 1, fumble: 0, passTds: 0, receptions: 50 },
        { name: 'Drake London', pos: 'WR', team: 'ATL', adp: 12, points: 18.7, td: 1, fumble: 0, passTds: 0, receptions: 70 },
        { name: 'Travis Kelce', pos: 'TE', team: 'KC', adp: 13, points: 18.4, td: 1, fumble: 0, passTds: 0, receptions: 70 },
        { name: 'Kyren Williams', pos: 'RB', team: 'LAR', adp: 15, points: 18.2, td: 1, fumble: 0, passTds: 0, receptions: 40 },
        { name: 'Puka Nacua', pos: 'WR', team: 'LAR', adp: 16, points: 18.0, td: 1, fumble: 0, passTds: 0, receptions: 65 },
        { name: 'Josh Allen', pos: 'QB', team: 'BUF', adp: 18, points: 22.8, td: 1, fumble: 0, passTds: 30, receptions: 0 },
        { name: 'Sam LaPorta', pos: 'TE', team: 'DET', adp: 20, points: 17.5, td: 1, fumble: 0, passTds: 0, receptions: 60 },
        { name: 'James Cook', pos: 'RB', team: 'BUF', adp: 25, points: 17.0, td: 1, fumble: 0, passTds: 0, receptions: 45 },
        { name: 'Deebo Samuel', pos: 'WR', team: 'SF', adp: 30, points: 16.5, td: 1, fumble: 0, passTds: 0, receptions: 55 },
        { name: 'Alvin Kamara', pos: 'RB', team: 'NO', adp: 35, points: 16.0, td: 1, fumble: 0, passTds: 0, receptions: 65 },
        { name: 'Mike Evans', pos: 'WR', team: 'TB', adp: 40, points: 15.8, td: 1, fumble: 0, passTds: 0, receptions: 50 },
        { name: 'David Montgomery', pos: 'RB', team: 'DET', adp: 50, points: 15.2, td: 1, fumble: 0, passTds: 0, receptions: 30 },
        { name: 'George Kittle', pos: 'TE', team: 'SF', adp: 60, points: 14.5, td: 1, fumble: 0, passTds: 0, receptions: 55 },
        { name: 'Tyreek Hill', pos: 'WR', team: 'MIA', adp: 2, points: 20.5, td: 1, fumble: 0, passTds: 0, receptions: 90 },
        { name: 'Rachaad White', pos: 'RB', team: 'TB', adp: 70, points: 14.0, td: 1, fumble: 0, passTds: 0, receptions: 40 },
        { name: 'Jaylen Warren', pos: 'RB', team: 'PIT', adp: 80, points: 13.5, td: 0, fumble: 0, passTds: 0, receptions: 35 },
        { name: 'Gabe Davis', pos: 'WR', team: 'JAX', adp: 90, points: 13.0, td: 0, fumble: 0, passTds: 0, receptions: 40 },
        { name: 'Seattle Seahawks', pos: 'DST', team: 'SEA', adp: 150, points: 8.0, td: 0, fumble: 0, passTds: 0, receptions: 0 },
        { name: 'Harrison Butker', pos: 'K', team: 'KC', adp: 160, points: 7.5, td: 0, fumble: 0, passTds: 0, receptions: 0 },
    ];

    let team1 = [];
    let team2 = [];
    $('analyzeTradeBtn').disabled = true;
    $('clearAllBtn').disabled = true;
    $('exportTradeBtn').disabled = true;
    $('swapTeamsBtn').disabled = true;

    const leagueSizeSelect = $('leagueSize'), startingLineupSelect = $('startingLineup'), benchSizeSelect = $('benchSize'),
        scoringTypeSelect = $('scoringType'), bonusTDCheckbox = $('bonusTD'), penaltyFumbleCheckbox = $('penaltyFumble'),
        positionFocusSelect = $('positionFocus'), draftPickInput = $('draftPick'), draftPickValue = $('draftPickValue'),
        generateDraftButton = $('generateLineup'), saveDraftButton = $('saveLineup'), compareDraftButton = $('compareLineups'),
        progressBarDraft = $('progressBar'), progressDraft = $('progress'), buildResultDraft = $('build-result'),
        lineupSizeInput = $('lineupSize'), lineupStartingSelect = $('lineupStarting'), lineupBenchSizeSelect = $('lineupBenchSize'),
        lineupIrSpotsSelect = $('lineupIrSpots'), lineupScoringSelect = $('lineupScoring'), lineupBonusTDCheckbox = $('lineupBonusTD'),
        lineupPenaltyFumbleCheckbox = $('lineupPenaltyFumble'), currentRosterInput = $('currentRoster'), swapPlayersButton = $('swapPlayers'),
        generateLineupWeeklyButton = $('generateLineupWeekly'), saveLineupWeeklyButton = $('saveLineupWeekly'),
        compareLineupsWeeklyButton = $('compareLineupsWeekly'), progressBarWeekly = $('progressBarWeekly'),
        progressWeekly = $('progressWeekly'), lineupResult = $('lineup-result');

    // --- Utility functions ---
    const clamp = (val, min, max) => Math.max(min, Math.min(val, max));
    const parseLineupConfig = str => str.split(',').map(s => s.trim().toUpperCase());
    const parseRoster = str => str.split(';').map(p => p.trim()).filter(Boolean);
    const showProgress = (bar, prog, cb) => {
        bar.classList.remove('hidden');
        let width = 0, interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                cb();
                bar.classList.add('hidden');
            } else {
                width += 10;
                prog.style.width = `${width}%`;
            }
        }, 200);
    };
    const saveExport = (el, key, filename, alertMsg) => {
        const result = el.innerHTML;
        if (result) {
            const text = el.textContent;
            localStorage.setItem(key, text);
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename; a.click();
            URL.revokeObjectURL(url);
            alert(alertMsg);
        } else {
            alert('Generate a result first!');
        }
    };
    function showLoadingSpinner(show) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.classList.toggle('hidden', !show);
    }

    // --- Set defaults ---
    if (leagueSizeSelect) leagueSizeSelect.value = 12;
    if (draftPickInput) draftPickInput.value = 1;
    if (draftPickValue) draftPickValue.textContent = 1;
    if (scoringTypeSelect) scoringTypeSelect.value = 'standard';

    // --- Clamp draft pick input on league size change/input ---
    if (leagueSizeSelect && draftPickInput && draftPickValue) {
        const clampDraftPick = () => {
            draftPickInput.max = leagueSizeSelect.value;
            draftPickInput.min = 1;
            draftPickInput.value = clamp(parseInt(draftPickInput.value) || 1, 1, parseInt(leagueSizeSelect.value));
            draftPickValue.textContent = draftPickInput.value;
        };
        leagueSizeSelect.addEventListener('change', clampDraftPick);
        draftPickInput.addEventListener('input', clampDraftPick);
        clampDraftPick();
    }

    // --- Sync bench size between sections ---
    if (benchSizeSelect && lineupBenchSizeSelect) {
        const syncBench = e => {
            benchSizeSelect.value = lineupBenchSizeSelect.value = e.target.value;
        };
        benchSizeSelect.addEventListener('change', syncBench);
        lineupBenchSizeSelect.addEventListener('change', syncBench);
    }

    // --- Fetch Sleeper Players (stub, replace with real fetch if needed) ---
    async function fetchSleeperPlayers() {
        // You can replace this with a real fetch if you want live data
        // For now, just use the fallback data
        playersData = playersData.map(p => ({
            ...p,
            injury_status: "Healthy",
            bye: 7,
            age: 25,
            fantasy_points_2023: p.points,
            img: `https://static.www.nfl.com/image/private/t_headshot_desktop/league/api/players/${encodeURIComponent(p.name.replace(/\s/g, '_').toLowerCase())}.png`,
            pts: p.points,
            value: p.points // Used for trade value
        }));
        playersData.sort((a, b) => b.value - a.value);
        autocomplete('player1-search', 'player1-autocomplete', team1, team2, 'team1-players');
        autocomplete('player2-search', 'player2-autocomplete', team2, team1, 'team2-players');
        renderTeam('team1-players', team1, 'team1');
        renderTeam('team2-players', team2, 'team2');
        renderRecentTrades();
    }

    // 2. Trade Value Calculation (advanced)
    function calculateTradeValue(player, currentWeek = 1) {
        let base = player.fantasy_points_2023 || 0;
        if (player.position === 'RB') base *= 1.18;
        if (player.position === 'WR') base *= 1.12;
        if (player.position === 'TE') base *= 1.01;
        if (player.position === 'QB') base *= 0.92;
        if (player.age) {
            if (player.position === 'RB' && player.age <= 25) base *= 1.07;
            if (player.position === 'WR' && player.age <= 25) base *= 1.04;
            if (player.position === 'TE' && player.age >= 30) base *= 0.93;
            if (player.position === 'QB' && player.age >= 33) base *= 0.95;
        }
        if (player.injury_status && player.injury_status !== "Healthy") base *= 0.7;
        if (player.bye && Math.abs(player.bye - currentWeek) <= 2) base *= 0.93;
        if (!base) base = 10;
        return Math.round(base);
    }

    // 3. Autocomplete (shows injury/team)
    function autocomplete(inputId, listId, teamArr, otherTeamArr, teamDivId) {
        const input = document.getElementById(inputId);
        const list = document.getElementById(listId);
        input.addEventListener('input', function () {
            const val = input.value.toLowerCase();
            list.innerHTML = '';
            if (!val) return;
            const matches = playersData.filter(p =>
                p.name.toLowerCase().includes(val) &&
                !teamArr.some(tp => tp.name === p.name) &&
                !otherTeamArr.some(tp => tp.name === p.name)
            );
            matches.slice(0, 8).forEach(player => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${player.name} (${player.team} ${player.pos})</span>
                    <span class="text-xs ml-2 ${player.injury_status !== "Healthy" ? "text-red-600" : "text-green-600"}">${player.injury_status}</span>`;
                li.onclick = () => {
                    teamArr.push(player);
                    renderTeam(teamDivId, teamArr, teamArr === team1 ? 'team1' : 'team2');
                    input.value = '';
                    list.innerHTML = '';
                };
                list.appendChild(li);
            });
        });
        input.addEventListener('blur', () => setTimeout(() => list.innerHTML = '', 150));
    }

    // 4. Render Team (shows tooltip with age/injury)
    function renderTeam(divId, teamArr, teamKey) {
        const div = document.getElementById(divId);
        div.innerHTML = '';
        teamArr.forEach((player, idx) => {
            const card = document.createElement('div');
            card.className = `player-card player-pos-${player.pos}`;
            card.draggable = true;
            card.title = `${player.name} (${player.team} ${player.pos})
Age: ${player.age || "?"} | Injury: ${player.injury_status || "Healthy"} | Bye: ${player.bye}`;
            card.innerHTML = `
                <img src="${player.img}" alt="${player.name}" class="w-10 h-10 rounded-full border-2 border-yellow-400 object-cover" onerror="this.src='https://static.www.nfl.com/image/private/t_headshot_desktop/league/api/players/default.png'">
                <div>
                    <div class="font-bold">${player.name} <span class="text-teal">(${player.team} ${player.pos})</span></div>
                    <div class="text-yellow font-semibold">${player.pts} pts</div>
                    <div class="text-xs text-gray-400">Bye: ${player.bye} | <span class="${player.injury_status !== "Healthy" ? "text-red-600" : "text-green-600"}">${player.injury_status}</span></div>
                </div>
                <button class="remove-btn" title="Remove Player">&times;</button>
            `;
            card.querySelector('.remove-btn').onclick = () => {
                teamArr.splice(idx, 1);
                renderTeam(divId, teamArr, teamKey);
            };
            card.ondragstart = e => {
                e.dataTransfer.setData('playerIdx', idx);
                e.dataTransfer.setData('teamKey', teamKey);
            };
            div.appendChild(card);
        });
        div.ondragover = e => e.preventDefault();
        div.ondrop = e => {
            const fromIdx = +e.dataTransfer.getData('playerIdx');
            const fromTeam = e.dataTransfer.getData('teamKey');
            if (fromTeam !== teamKey) {
                const player = (fromTeam === 'team1' ? team1 : team2).splice(fromIdx, 1)[0];
                teamArr.push(player);
                renderTeam('team1-players', team1, 'team1');
                renderTeam('team2-players', team2, 'team2');
            }
        };
    }

    // 5. Swap Teams
    function swapTeams() {
        [team1, team2] = [team2, team1];
        renderTeam('team1-players', team1, 'team1');
        renderTeam('team2-players', team2, 'team2');
    }

    // 6. Analyze Trade (contextual advice and warnings)
    function analyzeTrade() {
        if (!team1.length && !team2.length) return;
        const team1Value = team1.reduce((a, p) => a + p.value, 0);
        const team2Value = team2.reduce((a, p) => a + p.value, 0);
        const fairness = Math.abs(team1Value - team2Value);
        let fairnessText = '';
        let color = '';
        let emoji = '';
        if (fairness < 10) { fairnessText = "Perfectly Balanced"; color = "bg-green-600"; emoji = "🟢"; }
        else if (fairness < 30) { fairnessText = "Fair Trade"; color = "bg-yellow-500"; emoji = "🟡"; }
        else { fairnessText = "Lopsided!"; color = "bg-red-600"; emoji = "🔴"; }
        document.getElementById('trade-fairness').innerHTML = `<span class="px-3 py-1 rounded ${color} text-white">${emoji} ${fairnessText}</span>`;

        // Chart
        const ctx = document.getElementById('tradeValueChart').getContext('2d');
        if (window.tradeChart) window.tradeChart.destroy();
        window.tradeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Team 1', 'Team 2'],
                datasets: [{
                    label: 'Trade Value',
                    data: [team1Value, team2Value],
                    backgroundColor: ['#facc15', '#14b8a6']
                }]
            },
            options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });

        // Contextual AI Advice
        let advice = '';
        const t1Injured = team1.filter(p => p.injury_status && p.injury_status !== "Healthy");
        const t2Injured = team2.filter(p => p.injury_status && p.injury_status !== "Healthy");
        const t1Byes = team1.map(p => p.bye).filter(Boolean);
        const t2Byes = team2.map(p => p.bye).filter(Boolean);
        const t1RBs = team1.filter(p => p.pos === 'RB');
        const t2RBs = team2.filter(p => p.pos === 'RB');
        const t1WRs = team1.filter(p => p.pos === 'WR');
        const t2WRs = team2.filter(p => p.pos === 'WR');

        if (fairness < 10) advice = "This trade is as even as it gets. Both teams win!";
        else if (team1Value > team2Value) advice = `Team 1 is getting more value. Team 2, ask for a sweetener!`;
        else advice = `Team 2 is getting the edge. Team 1, try to negotiate for more!`;

        // Bye week overlap warning
        if (t1Byes.some(bye => t2Byes.includes(bye))) advice += " ⚠️ Watch out for bye week overlap!";
        // Injured player warning
        if (t1Injured.length || t2Injured.length) advice += ` ⚠️ Injured player(s) in trade: ${[...t1Injured, ...t2Injured].map(p => p.name).join(', ')}`;
        // Roster depth warning
        if (team1.length > 0 && t1RBs.length === 0 && t1WRs.length === 0) advice += " ⚠️ Team 1 is trading away all RBs/WRs!";
        if (team2.length > 0 && t2RBs.length === 0 && t2WRs.length === 0) advice += " ⚠️ Team 2 is trading away all RBs/WRs!";

        document.getElementById('ai-advice').textContent = advice;

        // Save to recent trades
        const tradeSummary = `${team1.map(p=>p.name).join(', ') || 'None'} ⇄ ${team2.map(p=>p.name).join(', ') || 'None'} (${fairnessText})`;
        let trades = JSON.parse(localStorage.getItem('recentTrades') || '[]');
        trades.unshift(tradeSummary);
        trades = trades.slice(0, 5);
        localStorage.setItem('recentTrades', JSON.stringify(trades));
        renderRecentTrades();

        $('analyzeTradeBtn').disabled = false;
        $('clearAllBtn').disabled = false;
        $('exportTradeBtn').disabled = false;
        $('swapTeamsBtn').disabled = false;
    }

    // 7. Recent Trades
    function renderRecentTrades() {
        const trades = JSON.parse(localStorage.getItem('recentTrades') || '[]');
        const ul = document.getElementById('recentTrades');
        ul.innerHTML = '';
        trades.forEach(trade => {
            const li = document.createElement('li');
            li.textContent = trade;
            ul.appendChild(li);
        });
    }

    // 8. Clear All
    function clearAll() {
        team1 = [];
        team2 = [];
        renderTeam('team1-players', team1, 'team1');
        renderTeam('team2-players', team2, 'team2');
        document.getElementById('trade-fairness').innerHTML = '';
        document.getElementById('ai-advice').textContent = '';
        if (window.tradeChart) window.tradeChart.destroy();
    }

    // 9. Export/Share
    function exportTrade() {
        const summary = `${team1.map(p=>p.name).join(', ') || 'None'} ⇄ ${team2.map(p=>p.name).join(', ') || 'None'}`;
        navigator.clipboard.writeText(`Check out this trade on Front Row Fantasy: ${summary}`).then(() => {
            alert('Trade copied to clipboard! Share it anywhere.');
        });
    }

    // 10. Initialize everything after fetching players
    fetchSleeperPlayers().then(() => {
        document.getElementById('analyzeTradeBtn').onclick = analyzeTrade;
        document.getElementById('clearAllBtn').onclick = clearAll;
        document.getElementById('exportTradeBtn').onclick = exportTrade;
        document.getElementById('swapTeamsBtn').onclick = swapTeams;
    });
});

// Fantasy Ticker - API player names, dummy points
document.addEventListener('DOMContentLoaded', function () {
    const tickerContent = document.getElementById('tickerContent');
    const pauseButton = document.getElementById('pauseButton');
    if (!tickerContent || !pauseButton) return;
    let paused = false, animationFrame, pos = 0;

    function posColor(pos) {
        switch (pos) {
            case "QB": return "player-pos-QB";
            case "RB": return "player-pos-RB";
            case "WR": return "player-pos-WR";
            case "TE": return "player-pos-TE";
            default: return "";
        }
    }

    async function buildTickerFromAPI() {
        tickerContent.innerHTML = '<span class="loading text-white">Loading fantasy points...</span>';
        try {
            const res = await fetch('https://api.sleeper.app/v1/players/nfl');
            const data = await res.json();
            // Get top 6 active players with a team and position
            const players = Object.values(data)
                .filter(p => p.active && p.team && ['QB','RB','WR','TE'].includes(p.position))
                .slice(0, 6)
                .map(p => ({
                    player: p.full_name,
                    team: p.team,
                    pos: p.position,
                    pts: (Math.random() * 10 + 15).toFixed(1) // Dummy points 15-25
                }));
            tickerContent.innerHTML = '';
            for (let loop = 0; loop < 2; loop++) {
                players.forEach(item => {
                    const span = document.createElement('span');
                    span.className = `ticker-player ${posColor(item.pos)}`;
                    span.innerHTML = `
                        <span class="player-name">${item.player}</span>
                        <span class="player-team">(${item.team} ${item.pos})</span>
                        <span class="player-pts">${item.pts} pts</span>
                    `;
                    tickerContent.appendChild(span);
                });
            }
        } catch (e) {
            tickerContent.innerHTML = '<span class="text-red-400">Failed to load ticker data.</span>';
        }
    }

    function animateTicker() {
        if (!paused) {
            pos -= 1.1;
            if (Math.abs(pos) >= tickerContent.scrollWidth / 2) pos = 0;
            tickerContent.style.transform = `translateX(${pos}px)`;
        }
        animationFrame = requestAnimationFrame(animateTicker);
    }

    pauseButton.addEventListener('click', function () {
        paused = !paused;
        pauseButton.setAttribute('aria-pressed', paused ? 'true' : 'false');
        pauseButton.textContent = paused ? 'Resume' : 'Pause';
    });

    buildTickerFromAPI();
    animateTicker();
});
