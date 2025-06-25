document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);

    // --- Trade Analyzer Logic ---
    if ($('analyzeTradeBtn')) {
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
        const analyzeTradeBtn = $('analyzeTradeBtn');
        if (analyzeTradeBtn) analyzeTradeBtn.disabled = true;
        const clearAllBtn = $('clearAllBtn');
        if (clearAllBtn) clearAllBtn.disabled = true;
        const exportTradeBtn = $('exportTradeBtn');
        if (exportTradeBtn) exportTradeBtn.disabled = true;
        const swapTeamsBtn = $('swapTeamsBtn');
        if (swapTeamsBtn) swapTeamsBtn.disabled = true;

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

        // --- Fetch Sleeper Players ---
        async function fetchSleeperPlayers() {
            playersData = playersData.map(p => ({
                ...p,
                injury_status: "Healthy",
                bye: 7,
                age: 25,
                fantasy_points_2023: p.points,
                img: `https://static.www.nfl.com/image/private/t_headshot_desktop/league/api/players/${encodeURIComponent(p.name.replace(/\s/g, '_').toLowerCase())}.png`,
                pts: p.points,
                value: p.points
            }));
            playersData.sort((a, b) => b.value - a.value);

            const player1Search = document.getElementById('player1-search');
            const player1Autocomplete = document.getElementById('player1-autocomplete');
            const player2Search = document.getElementById('player2-search');
            const player2Autocomplete = document.getElementById('player2-autocomplete');
            if (player1Search && player1Autocomplete && player2Search && player2Autocomplete) {
                autocomplete('player1-search', 'player1-autocomplete', team1, team2, 'team1-players');
                autocomplete('player2-search', 'player2-autocomplete', team2, team1, 'team2-players');
            }
            renderTeam('team1-players', team1, 'team1');
            renderTeam('team2-players', team2, 'team2');
            renderRecentTrades();
        }

        // --- Trade Value Calculation ---
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

        // --- Autocomplete ---
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

        // --- Render Team ---
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
                    <button class="remove-btn" title="Remove Player">×</button>
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

        // --- Swap Teams ---
        function swapTeams() {
            [team1, team2] = [team2, team1];
            renderTeam('team1-players', team1, 'team1');
            renderTeam('team2-players', team2, 'team2');
        }

        // --- Analyze Trade ---
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

            if (t1Byes.some(bye => t2Byes.includes(bye))) advice += " ⚠️ Watch out for bye week overlap!";
            if (t1Injured.length || t2Injured.length) advice += ` ⚠️ Injured player(s) in trade: ${[...t1Injured, ...t2Injured].map(p => p.name).join(', ')}`;
            if (team1.length > 0 && t1RBs.length === 0 && t1WRs.length === 0) advice += " ⚠️ Team 1 is trading away all RBs/WRs!";
            if (team2.length > 0 && t2RBs.length === 0 && t2WRs.length === 0) advice += " ⚠️ Team 2 is trading away all RBs/WRs!";

            document.getElementById('ai-advice').textContent = advice;

            const tradeSummary = `${team1.map(p=>p.name).join(', ') || 'None'} ⇄ ${team2.map(p=>p.name).join(', ') || 'None'} (${fairnessText})`;
            let trades = JSON.parse(localStorage.getItem('recentTrades') || '[]');
            trades.unshift(tradeSummary);
            trades = trades.slice(0, 5);
            localStorage.setItem('recentTrades', JSON.stringify(trades));
            renderRecentTrades();

            if (analyzeTradeBtn) analyzeTradeBtn.disabled = false;
            if (clearAllBtn) clearAllBtn.disabled = false;
            if (exportTradeBtn) exportTradeBtn.disabled = false;
            if (swapTeamsBtn) swapTeamsBtn.disabled = false;
        }

        // --- Recent Trades ---
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

        // --- Clear All ---
        function clearAll() {
            team1 = [];
            team2 = [];
            renderTeam('team1-players', team1, 'team1');
            renderTeam('team2-players', team2, 'team2');
            document.getElementById('trade-fairness').innerHTML = '';
            document.getElementById('ai-advice').textContent = '';
            if (window.tradeChart) window.tradeChart.destroy();
        }

        // --- Export/Share ---
        function exportTrade() {
            const summary = `${team1.map(p=>p.name).join(', ') || 'None'} ⇄ ${team2.map(p=>p.name).join(', ') || 'None'}`;
            navigator.clipboard.writeText(`Check out this trade on Front Row Fantasy: ${summary}`).then(() => {
                alert('Trade copied to clipboard! Share it anywhere.');
            });
        }

        // --- Initialize Trade Analyzer ---
        fetchSleeperPlayers().then(() => {
            $('analyzeTradeBtn').onclick = analyzeTrade;
            $('clearAllBtn').onclick = clearAll;
            $('exportTradeBtn').onclick = exportTrade;
            $('swapTeamsBtn').onclick = swapTeams;
        });
    }

    // --- Universal Fantasy Ticker ---
    const tickerContent = document.getElementById('tickerContent');
    const pauseButton = document.getElementById('pauseButton');
    if (tickerContent && pauseButton) {
        let paused = false, animationFrame, pos = 0;

        async function buildTicker() {
            try {
                const res = await fetch('https://api.sleeper.app/v1/players/nfl');
                const data = await res.json();
                const players = Object.values(data)
                    .filter(p => p.active && p.team && ['QB','RB','WR','TE'].includes(p.position))
                    .slice(0, 8)
                    .map(p => ({
                        player: p.full_name,
                        team: p.team,
                        pos: p.position,
                        pts: (Math.random() * 10 + 15).toFixed(1)
                    }));
                tickerContent.innerHTML = '';
                for (let loop = 0; loop < 2; loop++) {
                    players.forEach(item => {
                        const span = document.createElement('span');
                        span.className = `ticker-player player-pos-${item.pos}`;
                        span.innerHTML = `
                            <span class="player-name">${item.player}</span>
                            <span class="player-team">(${item.team} ${item.pos})</span>
                            <span class="player-pts">${item.pts} pts</span>
                        `;
                        tickerContent.appendChild(span);
                    });
                }
            } catch {
                const tickerData = [
                    { player: "Josh Allen", team: "BUF", pos: "QB", pts: 25.4 },
                    { player: "Patrick Mahomes", team: "KC", pos: "QB", pts: 24.8 },
                    { player: "Christian McCaffrey", team: "SF", pos: "RB", pts: 20.5 },
                    { player: "Tyreek Hill", team: "MIA", pos: "WR", pts: 19.8 },
                    { player: "Justin Jefferson", team: "MIN", pos: "WR", pts: 19.2 },
                    { player: "Travis Kelce", team: "KC", pos: "TE", pts: 18.9 }
                ];
                tickerContent.innerHTML = '';
                for (let loop = 0; loop < 2; loop++) {
                    tickerData.forEach(item => {
                        const span = document.createElement('span');
                        span.className = `ticker-player player-pos-${item.pos}`;
                        span.innerHTML = `
                            <span class="player-name">${item.player}</span>
                            <span class="player-team">(${item.team} ${item.pos})</span>
                            <span class="player-pts">${item.pts} pts</span>
                        `;
                        tickerContent.appendChild(span);
                    });
                }
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
        buildTicker();
        animateTicker();
    }

    // --- GOAT Draft Tool Logic ---
    if (!document.getElementById('generateLineup')) return;

    let allPlayers = [];
    let currentScoring = 'ppr';

    const scoringFiles = {
        'ppr': 'PPR.json',
        'half': 'Half PPR.json',
        'standard': 'Standard ADP.json'
    };

    function getScoringType() {
        return document.getElementById('scoring-type')?.value || 'ppr';
    }

    function posColor(pos) {
        if (!pos) return "";
        if (pos.startsWith('QB')) return "player-pos-QB";
        if (pos.startsWith('RB')) return "player-pos-RB";
        if (pos.startsWith('WR')) return "player-pos-WR";
        if (pos.startsWith('TE')) return "player-pos-TE";
        return "";
    }

    function loadPlayersAndInitTools(scoringType, year = '2025') {
        const jsonFile = year === '2023' ? 'players_2023.json' :
                         year === '2024' ? 'players_2024.json' : 'players_2025.json';
        fetch(jsonFile)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load player data for ${year}`);
                return res.json();
            })
            .then(data => {
                allPlayers = data.map(player => ({
                    Player: player.name || player.Player,
                    POS: player.position || player.POS,
                    Team: player.team || player.Team,
                    Bye: player.bye || 7,
                    AVG: scoringType === 'ppr' ? (player.ppr_rank || player.AVG || 0) :
                         scoringType === 'half' ? (player.half_ppr_rank || player.AVG || 0) :
                         (player.standard_rank || player.AVG || 0),
                    Points: player.points || 0
                }));
                buildPlayerTable();
                populatePlayerList();
            })
            .catch(error => {
                console.error('Error loading players:', error);
                alert('Failed to load player data. Please try again.');
            });
    }

    function buildPlayerTable() {
        const tableBody = document.getElementById('player-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = allPlayers.slice(0, 20).map(p => `
            <tr class="player-row" data-player="${p.Player}">
                <td class="player-name ${posColor(p.POS)}">${p.Player}</td>
                <td>${p.POS}</td>
                <td>${p.AVG}</td>
            </tr>
        `).join('');
        document.querySelectorAll('.player-row').forEach(row => {
            row.addEventListener('click', function (e) {
                const player = row.dataset.player;
                const p = allPlayers.find(x => x.Player === player);
                const popup = document.getElementById('player-popup');
                popup.innerHTML = `
                    <span class="close-btn" onclick="document.getElementById('player-popup').classList.add('hidden')">×</span>
                    <h4 class="font-bold text-lg mb-1">${p.Player}</h4>
                    <div class="mb-2">Position: <span class="${posColor(p.POS)}">${p.POS}</span></div>
                    <div class="mb-2">Team: <span class="text-teal">${p.Team}</span></div>
                    <div class="mb-2">Bye: <span class="text-yellow">${p.Bye}</span></div>
                    <div class="mb-2">ADP: <span class="text-yellow">${p.AVG}</span></div>
                    <div class="mb-2">Bio: <span class="text-gray-700">Elite fantasy performer. Click for more stats soon!</span></div>
                `;
                popup.classList.remove('hidden');
                popup.style.top = (e.clientY + 10) + 'px';
                popup.style.left = (e.clientX + 10) + 'px';
            });
        });
    }

    function populatePlayerList() {
        const playerList = document.getElementById('player-list');
        if (playerList) {
            playerList.innerHTML = allPlayers
                .map(player => `<li class="${posColor(player.POS)}">${player.Player}</li>`)
                .join('');
        }
    }

    // --- Draft Lineup Preset Logic ---
    const draftLineupPreset = document.getElementById('draftLineupPreset');
    if (draftLineupPreset) {
        draftLineupPreset.value = 'ppr';
        draftLineupPreset.dispatchEvent(new Event('change'));
        draftLineupPreset.addEventListener('change', function () {
            const draftQbCount = document.getElementById('draftQbCount');
            const draftSfCount = document.getElementById('draftSfCount');
            const draftRbCount = document.getElementById('draftRbCount');
            const draftWrCount = document.getElementById('draftWrCount');
            const draftTeCount = document.getElementById('draftTeCount');
            const draftFlexCount = document.getElementById('draftFlexCount');
            const draftDstCount = document.getElementById('draftDstCount');
            const draftKCount = document.getElementById('draftKCount');
            const preset = this.value;
            if (preset === 'std' || preset === 'ppr') {
                draftQbCount.value = 1; draftSfCount && (draftSfCount.value = 0); draftRbCount.value = 2; draftWrCount.value = 2; draftTeCount.value = 1; draftFlexCount.value = 1; draftDstCount.value = 1; draftKCount.value = 1;
            } else if (preset === 'superflex_redraft') {
                draftQbCount.value = 1; draftSfCount && (draftSfCount.value = 1); draftRbCount.value = 2; draftWrCount.value = 2; draftTeCount.value = 1; draftFlexCount.value = 1; draftDstCount.value = 1; draftKCount.value = 1;
            } else if (preset === 'superflex_dynasty') {
                draftQbCount.value = 1; draftSfCount && (draftSfCount.value = 1); draftRbCount.value = 2; draftWrCount.value = 2; draftTeCount.value = 1; draftFlexCount.value = 2; draftDstCount.value = 1; draftKCount.value = 1;
            } else if (preset === 'half') {
                draftQbCount.value = 1; draftSfCount && (draftSfCount.value = 0); draftRbCount.value = 2; draftWrCount.value = 2; draftTeCount.value = 1; draftFlexCount.value = 2; draftDstCount.value = 1; draftKCount.value = 1;
            } else if (preset === '2qb') {
                draftQbCount.value = 2; draftSfCount && (draftSfCount.value = 0); draftRbCount.value = 2; draftWrCount.value = 3; draftTeCount.value = 1; draftFlexCount.value = 1; draftDstCount.value = 1; draftKCount.value = 1;
            } else if (preset === '3wr') {
                draftQbCount.value = 1; draftSfCount && (draftSfCount.value = 0); draftRbCount.value = 2; draftWrCount.value = 3; draftTeCount.value = 1; draftFlexCount.value = 1; draftDstCount.value = 1; draftKCount.value = 1;
            } else if (preset === '2te') {
                draftQbCount.value = 1; draftSfCount && (draftSfCount.value = 0); draftRbCount.value = 2; draftWrCount.value = 2; draftTeCount.value = 2; draftFlexCount.value = 1; draftDstCount.value = 1; draftKCount.value = 1;
            } else if (preset === 'deepflex') {
                draftQbCount.value = 1; draftSfCount && (draftSfCount.value = 0); draftRbCount.value = 2; draftWrCount.value = 2; draftTeCount.value = 1; draftFlexCount.value = 3; draftDstCount.value = 1; draftKCount.value = 1;
            }
        });
    }

    // --- Simulate Draft ---
    function simulateDraft({ allPlayers, leagueSize, draftPick, draftNeedsByTeam, benchSize, strategy = null, resultElem = null, scoringType = 'ppr' }) {
        const draftBoard = [...allPlayers].filter(p => p.AVG !== undefined).sort((a, b) => a.AVG - b.AVG);
        let taken = new Set();
        let picks = [];
        let teamRosters = Array.from({ length: leagueSize }, () => []);
        let totalRounds = draftNeedsByTeam[0].length;

        for (let round = 1; round <= totalRounds; round++) {
            let order = round % 2 === 1 ? [...Array(leagueSize).keys()] : [...Array(leagueSize).keys()].reverse();
            for (let i = 0; i < leagueSize; i++) {
                let teamIdx = order[i];
                let need = draftNeedsByTeam[teamIdx].shift();
                let candidates = draftBoard.filter(p => !taken.has(p.Player));
                candidates = filterKickerDST(candidates, need, round, totalRounds);
                candidates = applyDraftStrategy(strategy, candidates, round);
                if (need === 'BENCH') {
                    candidates = getBenchBias(teamRosters[teamIdx], candidates);
                }
                candidates = sortCandidatesADPValue(candidates, round);
                candidates = candidates
                    .map(p => ({
                        ...p,
                        _score: scoreCandidate(p, teamRosters[teamIdx], need, round)
                    }))
                    .sort((a, b) => b._score - a._score);
                let player = safeGetPlayer(candidates, 0);
                if (!player) continue;
                taken.add(player.Player);
                teamRosters[teamIdx].push(player);
                if (teamIdx + 1 === draftPick) {
                    picks.push({
                        ...player,
                        slot: need,
                        round,
                        pickNum: i + 1,
                        overallPick: (round - 1) * leagueSize + (i + 1)
                    });
                }
            }
        }
        if (resultElem) renderDraftResults(picks, leagueSize, draftPick, scoringType, benchSize, resultElem);
        return picks;
    }

    // --- Draft Simulation Helpers ---
    function scoreCandidate(player, teamRoster, need, round) {
        let score = 0;
        if (player.Bye && !['DST', 'K'].includes(player.POS)) {
            const sameBye = teamRoster.filter(p => p.Bye === player.Bye && !['DST', 'K'].includes(p.POS)).length;
            if (sameBye >= 2) score -= 5;
            else if (sameBye === 1) score -= 2;
        }
        if (['QB', 'WR', 'TE'].includes(player.POS)) {
            const stack = teamRoster.some(p => p.Team === player.Team && ['QB', 'WR', 'TE'].includes(p.POS));
            if (stack) score += 2;
        }
        if ((need === 'FLEX' || need === 'BENCH') && ['RB', 'WR', 'TE'].includes(player.POS)) {
            score += 1;
        }
        if (round > 10 && player.Rookie) score += 2;
        return score;
    }

    function sortCandidatesADPValue(candidates, round) {
        return candidates.sort((a, b) => {
            let aScore = (a.AVG || 999) - (a.Points || 0) * 0.5;
            let bScore = (b.AVG || 999) - (b.Points || 0) * 0.5;
            if (round > 10) {
                aScore -= (a.Points || 0) * 0.2;
                bScore -= (b.Points || 0) * 0.2;
            }
            return aScore - bScore;
        });
    }

    function renderDraftResults(picks, leagueSize, draftPick, scoringType, benchSize, result) {
        const posCounts = picks.reduce((acc, p) => { acc[p.POS] = (acc[p.POS] || 0) + 1; return acc; }, {});
        const byeSummary = Object.entries(
            picks.reduce((acc, p) => {
                if (!p.Bye) return acc;
                acc[p.Bye] = (acc[p.Bye] || 0) + 1;
                return acc;
            }, {})
        ).map(([bye, count]) => `Week ${bye}: ${count}`).join(', ');

        result.innerHTML = `
            <div class="bg-glass rounded-xl p-4 mt-2">
                <h3 class="font-bold text-lg mb-2 text-yellow">Recommended Draft Build (${scoringType.toUpperCase()})</h3>
                <ul class="list-disc ml-6 text-left">
                    <li>League Size: <span class="text-teal">${leagueSize}</span></li>
                    <li>Draft Pick: <span class="text-teal">${draftPick}</span></li>
                    <li>Scoring: <span class="text-teal">${scoringType.toUpperCase()}</span></li>
                    <li>Bench Size: <span class="text-teal">${benchSize}</span></li>
                </ul>
                <h4 class="font-semibold mt-4 mb-2 text-orange">Your Draft Picks</h4>
                <table class="w-full text-sm mb-4">
                    <thead>
                        <tr>
                            <th>Round</th>
                            <th>Pick</th>
                            <th>Player</th>
                            <th>Team</th>
                            <th>Pos</th>
                            <th>Slot</th>
                            <th>ADP</th>
                            <th>Bye</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${picks.map(p => `
                            <tr>
                                <td>${p.round}</td>
                                <td>${p.pickNum}</td>
                                <td><span class="font-bold ${posColor(p.POS)}">${p.Player}</span></td>
                                <td>${p.Team || ''}</td>
                                <td>${p.POS}</td>
                                <td>${p.slot}</td>
                                <td>${p.AVG}</td>
                                <td>${p.Bye || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="mt-2 text-sm text-gray-500">
                    <b>Positional Breakdown:</b> ${Object.entries(posCounts).map(([pos, count]) => `${pos}: ${count}`).join(', ')}<br>
                    <b>Bye Weeks:</b> ${byeSummary}
                </div>
                <div class="mt-4 text-green font-semibold">Strategy: Draft sim uses ADP and projections, with randomness and roster intelligence. Early rounds are chalk, late rounds are wild.</div>
            </div>
        `;
    }

    const RANDOMNESS_EARLY = 0;
    const RANDOMNESS_MID = 2;
    const RANDOMNESS_LATE = 5;
    const RANDOMNESS_END = 10;
    const RUN_BONUS = 3;
    const SCARCITY_THRESHOLD = 2;

    function safeGetPlayer(candidates, idx) {
        if (!candidates || candidates.length === 0) return null;
        return candidates[Math.max(0, Math.min(idx, candidates.length - 1))];
    }

    function applyDraftStrategy(strategy, candidates, round) {
        if (!strategy) return candidates;
        if (strategy === 'zero_rb' && round <= 5) {
            return candidates.filter(p => p.POS !== 'RB');
        }
        if (strategy === 'late_qb' && round < 8) {
            return candidates.filter(p => p.POS !== 'QB');
        }
        return candidates;
    }

    function filterKickerDST(candidates, need, round, totalRounds) {
        if ((need === 'K' || need === 'DST') && round < totalRounds - 2) {
            return [];
        }
        return candidates;
    }

    function getBenchBias(teamRoster, candidates) {
        const counts = { QB: 0, RB: 0, WR: 0, TE: 0, DST: 0, K: 0 };
        teamRoster.forEach(p => { if (counts[p.POS] !== undefined) counts[p.POS]++; });
        let minPos = 'RB', minCount = counts.RB;
        ['RB', 'WR', 'TE', 'QB'].forEach(pos => {
            if (counts[pos] < minCount) { minPos = pos; minCount = counts[pos]; }
        });
        const filtered = candidates.filter(p => p.POS === minPos);
        return filtered.length ? filtered : candidates;
    }

    function getBestAvailableSmart(pos, taken, round, totalRounds, teamIdx, teamNeeds, draftBoard, leagueSize) {
        let randomness = 0;
        if (round <= 2) randomness = RANDOMNESS_EARLY;
        else if (round <= 5) randomness = RANDOMNESS_MID;
        else if (round <= 10) randomness = RANDOMNESS_LATE;
        else randomness = RANDOMNESS_END;

        let lastPicks = [];
        if (round > 1) {
            for (let i = 0; i < Math.min(leagueSize, 4); i++) {
                let prevTeam = (teamIdx - i + leagueSize) % leagueSize;
                let prevNeed = teamNeeds[prevTeam][0];
                lastPicks.push(prevNeed);
            }
        }
        let runBonus = 0;
        if (lastPicks.filter(x => x === pos).length >= 3) runBonus = RUN_BONUS;

        let candidates = draftBoard.filter(p => !taken.has(p.Player));
        let scarce = false;
        if (['QB', 'RB', 'WR', 'TE'].includes(pos)) {
            let count = candidates.filter(p => p.POS.startsWith(pos)).length;
            if (count <= SCARCITY_THRESHOLD) scarce = true;
        }

        candidates = candidates.filter(p => {
            if (pos === 'FLEX') {
                return !taken.has(p.Player) && ['RB', 'WR', 'TE'].includes(p.POS);
            }
            if (pos === 'SF') {
                return !taken.has(p.Player) && ['QB', 'RB', 'WR', 'TE'].includes(p.POS);
            }
            if (pos === 'BENCH') {
                candidates = getBenchBias(picks.filter(p => p.teamIdx === teamIdx), candidates);
            }
            if (pos === 'BENCH') {
                return !taken.has(p.Player);
            }
            if (scarce && !taken.has(p.Player)) return true;
            if (p.POS === pos && !taken.has(p.Player)) return true;
            return false;
        });

        if (candidates.length === 0) return null;
        let pickIdx = Math.floor(Math.random() * Math.min(randomness + 1 + runBonus, candidates.length));
        return candidates[pickIdx] || candidates[0];
    }

    // --- Generate Draft Button Logic ---
    const generateLineupBtn = document.getElementById('generateLineup');
    if (generateLineupBtn) {
        generateLineupBtn.addEventListener('click', function () {
            const leagueSize = parseInt(document.getElementById('league-size').value, 10);
            const draftPick = parseInt(document.getElementById('draft-pick').value, 10);
            const scoringType = getScoringType();
            const year = document.getElementById('year').value;
            const benchSize = parseInt(document.getElementById('bench-size').value, 10) || 6;

            const draftQbCount = document.getElementById('draftQbCount');
            const draftSfCount = document.getElementById('draftSfCount');
            const draftRbCount = document.getElementById('draftRbCount');
            const draftWrCount = document.getElementById('draftWrCount');
            const draftTeCount = document.getElementById('draftTeCount');
            const draftFlexCount = document.getElementById('draftFlexCount');
            const draftDstCount = document.getElementById('draftDstCount');
            const draftKCount = document.getElementById('draftKCount');
            const qb = parseInt(draftQbCount?.value || 1, 10);
            const sf = draftSfCount ? parseInt(draftSfCount.value, 10) : 0;
            const rb = parseInt(draftRbCount?.value || 2, 10);
            const wr = parseInt(draftWrCount?.value || 2, 10);
            const te = parseInt(draftTeCount?.value || 1, 10);
            const flex = parseInt(draftFlexCount?.value || 1, 10);
            const dst = parseInt(draftDstCount?.value || 1, 10);
            const k = parseInt(draftKCount?.value || 1, 10);

            if (!leagueSize || leagueSize < 4 || leagueSize > 16) {
                alert('Please enter a valid league size (4-16).');
                return;
            }
            if (!draftPick || draftPick < 1 || draftPick > leagueSize) {
                alert(`Please enter a valid draft pick (1-${leagueSize}).`);
                return;
            }

            const result = document.getElementById('build-result');

            function buildTeamNeeds() {
                let needs = [];
                for (let i = 0; i < leagueSize; i++) {
                    needs.push([
                        ...Array(qb).fill('QB'),
                        ...Array(sf).fill('SF'),
                        ...Array(rb).fill('RB'),
                        ...Array(wr).fill('WR'),
                        ...Array(te).fill('TE'),
                        ...Array(flex).fill('FLEX'),
                        ...Array(dst).fill('DST'),
                        ...Array(k).fill('K'),
                        ...Array(benchSize).fill('BENCH')
                    ]);
                }
                return needs;
            }

            loadPlayersAndInitTools(scoringType, year);
            simulateDraft({
                allPlayers,
                leagueSize,
                draftPick,
                draftNeedsByTeam: buildTeamNeeds(),
                benchSize,
                strategy: null,
                resultElem: result,
                scoringType
            });
        });
    }

    // --- Scoring Type Change ---
    const scoringTypeSelect = document.getElementById('scoring-type');
    if (scoringTypeSelect) {
        scoringTypeSelect.addEventListener('change', function () {
            currentScoring = this.value;
            loadPlayersAndInitTools(currentScoring);
        });
    }

    // --- Initial Load ---
    if (scoringTypeSelect) scoringTypeSelect.value = currentScoring;
    loadPlayersAndInitTools(currentScoring);
});
