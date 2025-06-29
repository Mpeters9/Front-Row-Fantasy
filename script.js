document.addEventListener('DOMContentLoaded', () => {

    const config = {
        dataFiles: ['players.json'],
        rosterSettings: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1, BENCH: 7 }, // ESPN Default
        positions: ["QB", "RB", "WR", "TE", "DST", "K"],
        flexPositions: ["RB", "WR", "TE"],
        superflexPositions: ["QB", "RB", "WR", "TE"],
        draftPickValues: { // Base VORP-equivalent values for dynasty picks
            "2025": { "1": 70, "2": 35, "3": 18 },
            "2026": { "1": 55, "2": 28, "3": 12 }
        }
    };

    const App = {
        playerData: [],
        hasDataLoaded: false,
        draftState: {}, 
        tradeState: { team1: {players: [], picks: []}, team2: {players: [], picks: []} },
        statsChart: null,
        selectedPlayersForChart: [],
        popupHideTimeout: null,

        async init() {
            this.initMobileMenu();
            this.createPlayerPopup();
            this.initPlaceholderTicker(); 
            await this.loadAllPlayerData();
            this.initLiveTicker(); 
            this.initializePageFeatures();
        },

        initializePageFeatures() {
            if (document.getElementById('daily-briefing-section')) this.generateDailyBriefing();
            if (document.getElementById('top-players-section')) this.initTopPlayers();
            if (document.getElementById('goat-draft-builder')) this.setupGoatDraftControls();
            if (document.getElementById('start-sit-tool')) this.initStartSitTool();
            if (document.getElementById('mock-draft-simulator')) this.initMockDraftSimulator();
            if (document.getElementById('stats-page')) this.initStatsPage();
            if (document.getElementById('players-page')) this.initPlayersPage();
            if (document.getElementById('trade-analyzer')) this.initTradeAnalyzer();
            if (document.getElementById('articles-page')) this.initArticlesPage(); 
            if (document.getElementById('article-content')) this.loadArticleContent();
        },
        
        initMobileMenu() {
            const btn = document.getElementById('mobile-menu-button');
            const menu = document.getElementById('mobile-menu');
            if(btn && menu) btn.addEventListener('click', () => menu.classList.toggle('hidden'));
        },
        initPlaceholderTicker() {
            const container = document.getElementById('tickerContent');
            if (container) container.innerHTML = `<span class="text-gray-400 px-4">Loading player points...</span>`;
        },
        initLiveTicker() {
            const container = document.getElementById('tickerContent');
            if (!container || !this.playerData.length) return;
            const topPlayers = [...this.playerData.filter(p=>p.simplePosition==='QB'), ...this.playerData.filter(p=>p.simplePosition==='RB'), ...this.playerData.filter(p=>p.simplePosition==='WR')].slice(0,15).sort((a,b)=>b.fantasyPoints-a.fantasyPoints);
            const content = topPlayers.map(p => `<span class="flex items-center mx-4"><span class="font-semibold text-white">${p.name} (${p.simplePosition})</span><span class="ml-2 font-bold text-yellow-400">${p.fantasyPoints.toFixed(1)} pts</span></span>`).join('<span class="text-teal-500 font-bold px-2">|</span>');
            container.style.transition = 'opacity 0.5s';
            container.style.opacity = 0;
            setTimeout(() => { container.innerHTML = content.repeat(3); container.style.opacity = 1; }, 300);
        },
        async loadAllPlayerData() {
            if (this.hasDataLoaded) return;
            try {
                this.hasDataLoaded = true;
                const response = await fetch(config.dataFiles[0]);
                if (!response.ok) throw new Error(`Failed to load ${config.dataFiles[0]}`);
                let data = await response.json();
                this.playerData = data.map(p => {
                    const fantasyPoints = this.generateFantasyPoints(p);
                    return {
                        ...p,
                        simplePosition: (p.position||'N/A').replace(/\d+$/,'').trim().toUpperCase(),
                        fantasyPoints: fantasyPoints,
                        ...this.generateAdvancedStats(p, fantasyPoints)
                    }
                }).sort((a,b)=>b.fantasyPoints-a.fantasyPoints);
            } catch (error) { console.error("Error loading player data:", error); this.displayDataError(); }
        },
        displayDataError() {
            const msg = `<p class="text-center text-red-400 py-8">Could not load player data. Please try again later.</p>`;
            document.querySelectorAll('#stats-table-body, #player-list-container, #player-table-body').forEach(el => { if(el) el.innerHTML = msg; });
        },
        generateFantasyPoints(player) {
            const pos = (player.position||'').replace(/\d+$/, '').trim().toUpperCase();
            const tier = player.tier || 10;
            let base, range;
            if (pos === 'DST' || pos === 'K') { base = 5; range = 8; }
            else if (tier <= 2) { base = (pos === 'QB') ? 22 : 18; range = 15; } 
            else if (tier <= 5) { base = (pos === 'QB') ? 17 : 12; range = 12; } 
            else if (tier <= 8) { base = (pos === 'QB') ? 12 : 7; range = 10; } 
            else { base = 2; range = 8; }
            return Math.max(0, base + (Math.random() * range)); 
        },
        generateAdvancedStats(player, fantasyPoints) {
            const pos = (player.position||'').replace(/\d+$/, '').trim().toUpperCase();
            const base = fantasyPoints;
            let stats = { passYds: 0, passTDs: 0, INTs: 0, rushAtt: 0, rushYds: 0, targets: 0, receptions: 0, recYds: 0, airYards: 0, redzoneTouches: 0, yprr: 0 };
            
            if (pos === 'QB') {
                stats.passYds = base * 180 + (Math.random() * 500 - 250);
                stats.passTDs = base * 1.2 + (Math.random() * 5 - 2.5);
                stats.INTs = Math.max(0, 15 - base * 0.5 + (Math.random() * 4 - 2));
            } else if (pos === 'RB') {
                stats.rushAtt = base * 10 + (Math.random() * 40 - 20);
                stats.rushYds = stats.rushAtt * (4 + (Math.random() - 0.5));
                stats.targets = base * 2 + (Math.random() * 20 - 10);
                stats.receptions = stats.targets * 0.8;
                stats.recYds = stats.receptions * 8;
                stats.redzoneTouches = base * 1.5 + (Math.random() * 10 - 5);
            } else if (pos === 'WR' || pos === 'TE') {
                stats.targets = base * 5 + (Math.random() * 30 - 15);
                stats.receptions = stats.targets * (0.65 + (Math.random() * 0.1));
                stats.recYds = stats.receptions * (12 + (Math.random() * 4 - 2));
                stats.airYards = stats.recYds * 1.5 + (Math.random() * 200 - 100);
                stats.redzoneTouches = base * 0.8 + (Math.random() * 5 - 2.5);
                stats.yprr = 2.5 - (player.tier * 0.15) + (Math.random() * 0.5 - 0.25);
            }

            for (const key in stats) {
                if(key !== 'yprr') {
                    stats[key] = Math.round(Math.max(0, stats[key]));
                }
            }
            stats.yprr = Math.max(0.5, stats.yprr).toFixed(2);
            return stats;
        },
        initTopPlayers() {
            const container = document.getElementById('player-showcase-container');
            if (!container || !this.playerData.length) return;
            const topPlayersByPos = {"Top Quarterbacks": this.playerData.filter(p => p.simplePosition === 'QB').slice(0, 4), "Top Running Backs": this.playerData.filter(p => p.simplePosition === 'RB').slice(0, 4), "Top Wide Receivers": this.playerData.filter(p => p.simplePosition === 'WR').slice(0, 4), "Top Tight Ends": this.playerData.filter(p => p.simplePosition === 'TE').slice(0, 4)};
            container.innerHTML = Object.entries(topPlayersByPos).map(([title, players]) => `<div class="player-showcase-card"><h3 class="text-2xl font-semibold mb-4 text-yellow-400">${title}</h3><ol class="list-none p-0 space-y-3">${players.map((p, index) => `<li class="flex items-center py-2 border-b border-gray-700/50 last:border-b-0"><span class="text-2xl font-bold text-teal-400/60 w-8">${index + 1}</span><div class="flex-grow"><span class="player-name-link font-semibold text-lg text-slate-100" data-player-name="${p.name}">${p.name}</span><span class="text-sm text-gray-400 block">${p.team}</span></div><span class="font-bold text-xl text-yellow-400">${p.fantasyPoints.toFixed(2)}</span></li>`).join('')}</ol></div>`).join('');
            this.addPlayerPopupListeners();
        },
        initStatsPage() {
            const controls = { position: document.getElementById('stats-position-filter'), sortBy: document.getElementById('stats-sort-by'), search: document.getElementById('stats-player-search'), tableBody: document.getElementById('stats-table-body'), tableHead: document.getElementById('stats-table-head') };
            if (!controls.tableBody) return;
        
            if(this.selectedPlayersForChart.length === 0) {
                this.selectedPlayersForChart = this.playerData.filter(p => ['WR', 'RB'].includes(p.simplePosition)).slice(0, 4);
            }
        
            const render = () => {
                let filteredPlayers = [...this.playerData];
                const pos = controls.position.value;

                if (pos === 'FLEX') {
                    filteredPlayers = filteredPlayers.filter(p => config.flexPositions.includes(p.simplePosition));
                } else if (pos !== 'ALL') {
                    filteredPlayers = filteredPlayers.filter(p => p.simplePosition === pos);
                }
                
                const searchTerm = controls.search.value.toLowerCase();
                if (searchTerm) {
                    filteredPlayers = filteredPlayers.filter(p => p.name.toLowerCase().includes(searchTerm));
                }

                const sortKey = controls.sortBy.value;
                filteredPlayers.sort((a, b) => {
                    if (sortKey === 'name') return a.name.localeCompare(b.name);
                    return (parseFloat(b[sortKey]) || 0) - (parseFloat(a[sortKey]) || 0);
                });
                
                this.updateStatsTable(pos, filteredPlayers);
            };
        
            if(!this.statsChart) {
                this.initializeStatsChart();
            }
            [controls.position, controls.sortBy, controls.search].forEach(el => el.addEventListener('input', render));
            render();
        },

        updateStatsTable(position, players) {
            const tableHead = document.getElementById('stats-table-head');
            const tableBody = document.getElementById('stats-table-body');
            
            let headers, columns;
        
            const baseHeaders = ['Player', 'Pos', 'Team', 'FPTS'];
            const baseColumns = ['name', 'simplePosition', 'team', 'fantasyPoints'];

            switch(position) {
                case 'QB':
                    headers = [...baseHeaders, 'Pass Yds', 'Pass TDs', 'INTs'];
                    columns = [...baseColumns, 'passYds', 'passTDs', 'INTs'];
                    break;
                case 'RB':
                    headers = [...baseHeaders, 'Rush Att', 'Rush Yds', 'RZ Touches'];
                    columns = [...baseColumns, 'rushAtt', 'rushYds', 'redzoneTouches'];
                    break;
                case 'WR':
                case 'TE':
                    headers = [...baseHeaders, 'Tgts', 'Rec', 'Rec Yds', 'YPRR'];
                    columns = [...baseColumns, 'targets', 'receptions', 'recYds', 'yprr'];
                    break;
                default: // ALL or FLEX
                    headers = [...baseHeaders, 'Rush Yds', 'Rec Yds', 'RZ Touches'];
                    columns = [...baseColumns, 'rushYds', 'recYds', 'redzoneTouches'];
                    break;
            }
        
            tableHead.innerHTML = `<tr>${headers.map(h => `<th class="p-4 text-center">${h}</th>`).join('')}</tr>`;
            
            tableBody.innerHTML = players.map(player => {
                const isSelected = this.selectedPlayersForChart.some(p => p.name === player.name);
                const rowHtml = columns.map(col => {
                    let val = player[col];
                    if (col === 'name') return `<td class="p-4 font-semibold"><span class="player-name-link" data-player-name="${player.name}">${val}</span></td>`;
                    if (typeof val === 'number' && col !== 'fantasyPoints' && col !== 'yprr') val = Math.round(val);
                    if (col === 'fantasyPoints') val = val.toFixed(1);
                    return `<td class="p-4 text-center font-mono">${val || '0'}</td>`;
                }).join('');
                return `<tr class="cursor-pointer hover:bg-gray-800/50 ${isSelected ? 'bg-teal-500/10' : ''}" data-player-name="${player.name}">${rowHtml}</tr>`;
            }).join('');
        
            this.addPlayerSelectionListeners();
            this.updateStatsChart(position);
        },

        addPlayerSelectionListeners() {
            document.querySelectorAll('#stats-table-body tr').forEach(row => {
                row.addEventListener('click', (e) => {
                    if(e.target.classList.contains('player-name-link')) return; 
                    
                    const playerName = row.dataset.playerName;
                    const player = this.playerData.find(p => p.name === playerName);
                    if(!player) return;

                    const selectedIndex = this.selectedPlayersForChart.findIndex(p => p.name === playerName);
        
                    if (selectedIndex > -1) {
                        this.selectedPlayersForChart.splice(selectedIndex, 1);
                    } else {
                        if (this.selectedPlayersForChart.length >= 5) {
                            this.selectedPlayersForChart.shift();
                        }
                        this.selectedPlayersForChart.push(player);
                    }
                    this.initStatsPage();
                });
            });
            this.addPlayerPopupListeners();
        },
        
        initializeStatsChart() {
            const ctx = document.getElementById('stats-chart').getContext('2d');
            this.statsChart = new Chart(ctx, {
                type: 'bar',
                data: { labels: [], datasets: [] },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#e2e8f0' } }, title: { display: true, text: 'Player Stat Comparison', color: '#facc15', font: { size: 18 } } },
                    scales: { x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.1)' } }, y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.1)' } } }
                }
            });
        },
        
        updateStatsChart(position) {
            if (!this.statsChart) return;
            const labels = this.selectedPlayersForChart.map(p => p.name);
            let datasets;
            
            const colors = ['rgba(250, 204, 21, 0.7)', 'rgba(20, 184, 166, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(139, 92, 246, 0.7)'];

            switch(position) {
                case 'QB':
                    datasets = [ { label: 'Pass Yds', data: this.selectedPlayersForChart.map(p => p.passYds), backgroundColor: colors[0] }, { label: 'Pass TDs', data: this.selectedPlayersForChart.map(p => p.passTDs), backgroundColor: colors[1] } ];
                    break;
                case 'RB':
                    datasets = [ { label: 'Rush Yds', data: this.selectedPlayersForChart.map(p => p.rushYds), backgroundColor: colors[0] }, { label: 'RZ Touches', data: this.selectedPlayersForChart.map(p => p.redzoneTouches), backgroundColor: colors[1] } ];
                    break;
                case 'WR': case 'TE':
                    datasets = [ { label: 'Rec Yds', data: this.selectedPlayersForChart.map(p => p.recYds), backgroundColor: colors[0] }, { label: 'Targets', data: this.selectedPlayersForChart.map(p => p.targets), backgroundColor: colors[2] }, { label: 'YPRR', data: this.selectedPlayersForChart.map(p => p.yprr), backgroundColor: colors[3] } ];
                    break;
                default:
                     datasets = [ { label: 'Fantasy Points', data: this.selectedPlayersForChart.map(p => p.fantasyPoints), backgroundColor: colors[0] }, { label: 'RZ Touches', data: this.selectedPlayersForChart.map(p => p.redzoneTouches), backgroundColor: colors[1] } ];
                    break;
            }

            this.statsChart.data.labels = labels;
            this.statsChart.data.datasets = datasets;
            this.statsChart.update();
        },
        
        initPlayersPage() {
            const controls = { searchInput: document.getElementById('player-search-input'), positionFilter: document.getElementById('position-filter'), tierFilter: document.getElementById('tier-filter'), teamFilter: document.getElementById('team-filter'), tableBody: document.getElementById('player-table-body'), sortHeaders: document.querySelectorAll('.sortable-header') };
            if (!controls.tableBody) return;
            let currentSort = { key: 'adp_ppr', order: 'asc' };
            this.populateFilterOptions(controls);
            const renderTable = () => {
                let filteredPlayers = [...this.playerData];
                const pos = controls.positionFilter.value;
                if (pos !== 'ALL') { if (pos === 'FLEX') { filteredPlayers = filteredPlayers.filter(p => config.flexPositions.includes(p.simplePosition)); } else { filteredPlayers = filteredPlayers.filter(p => p.simplePosition === pos); } }
                const tier = controls.tierFilter.value; if (tier !== 'ALL') { filteredPlayers = filteredPlayers.filter(p => p.tier == tier); }
                const team = controls.teamFilter.value; if (team !== 'ALL') { filteredPlayers = filteredPlayers.filter(p => p.team === team); }
                const searchTerm = controls.searchInput.value.toLowerCase(); if (searchTerm) { filteredPlayers = filteredPlayers.filter(p => p.name.toLowerCase().includes(searchTerm)); }
                filteredPlayers.sort((a, b) => {
                    let valA = (currentSort.key === 'adp_ppr') ? (a.adp.ppr || 999) : (a[currentSort.key] || 0);
                    let valB = (currentSort.key === 'adp_ppr') ? (b.adp.ppr || 999) : (b[currentSort.key] || 0);
                    if (typeof valA === 'string') return currentSort.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                    return currentSort.order === 'asc' ? valA - valB : valB - valA;
                });
                controls.tableBody.innerHTML = filteredPlayers.map(p => this.createPlayerTableRow(p)).join('');
                if (filteredPlayers.length === 0) { controls.tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-400 py-8">No players match the current filters.</td></tr>`; }
                this.addPlayerPopupListeners();
            };
            controls.sortHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    const sortKey = header.dataset.sort;
                    if (currentSort.key === sortKey) { currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc'; } else { currentSort.key = sortKey; currentSort.order = 'asc'; }
                    controls.sortHeaders.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
                    header.classList.add(`sorted-${currentSort.order}`);
                    renderTable();
                });
            });
            [controls.searchInput, controls.positionFilter, controls.tierFilter, controls.teamFilter].forEach(el => el.addEventListener('input', renderTable));
            renderTable();
        },
        populateFilterOptions(controls) {
            const tiers = [...new Set(this.playerData.map(p => p.tier).filter(t => t))].sort((a, b) => a - b);
            const teams = [...new Set(this.playerData.map(p => p.team).filter(t => t))].sort();
            tiers.forEach(tier => controls.tierFilter.add(new Option(`Tier ${tier}`, tier)));
            teams.forEach(team => controls.teamFilter.add(new Option(team, team)));
        },
        createPlayerTableRow(player) {
            const tierColorClasses = { 1: 'bg-yellow-500/20 text-yellow-300', 2: 'bg-blue-500/20 text-blue-300', 3: 'bg-green-500/20 text-green-300', 4: 'bg-indigo-500/20 text-indigo-300', 5: 'bg-purple-500/20 text-purple-300', default: 'bg-gray-500/20 text-gray-300' };
            const tierClass = tierColorClasses[player.tier] || tierColorClasses.default;
            return `<tr class="hover:bg-gray-800/50"><td class="p-4 font-semibold"><span class="player-name-link" data-player-name="${player.name}">${player.name}</span></td><td class="p-4 text-center font-bold text-sm">${player.simplePosition}</td><td class="p-4 text-center text-gray-400">${player.team || 'N/A'}</td><td class="p-4 text-center"><span class="tier-badge ${tierClass}">Tier ${player.tier || 'N/A'}</span></td><td class="p-4 text-center font-mono">${player.adp.ppr || '--'}</td><td class="p-4 text-center font-mono">${(player.vorp || 0).toFixed(2)}</td></tr>`;
        },
        
        // --- TRADE ANALYZER ---
        initTradeAnalyzer() {
            const controls = {
                searchInput1: document.getElementById('trade-search-1'), autocomplete1: document.getElementById('trade-autocomplete-1'), teamContainer1: document.getElementById('trade-team-1'),
                searchInput2: document.getElementById('trade-search-2'), autocomplete2: document.getElementById('trade-autocomplete-2'), teamContainer2: document.getElementById('trade-team-2'),
                addPickBtn1: document.getElementById('add-pick-btn-1'), addPickBtn2: document.getElementById('add-pick-btn-2'),
                pickYear1: document.getElementById('trade-pick-year-1'), pickRound1: document.getElementById('trade-pick-round-1'), pickNumber1: document.getElementById('trade-pick-number-1'),
                pickYear2: document.getElementById('trade-pick-year-2'), pickRound2: document.getElementById('trade-pick-round-2'), pickNumber2: document.getElementById('trade-pick-number-2'),
                analyzeBtn: document.getElementById('analyze-trade-btn'), resultsContainer: document.getElementById('trade-results'),
            };
            if (!controls.analyzeBtn) return;
            
            controls.searchInput1.addEventListener('input', () => this.showTradeAutocomplete(controls.searchInput1, controls.autocomplete1, 1));
            controls.searchInput2.addEventListener('input', () => this.showTradeAutocomplete(controls.searchInput2, controls.autocomplete2, 2));
            controls.addPickBtn1.addEventListener('click', () => this.addPickToTrade(controls.pickYear1.value, controls.pickRound1.value, controls.pickNumber1.value, 1));
            controls.addPickBtn2.addEventListener('click', () => this.addPickToTrade(controls.pickYear2.value, controls.pickRound2.value, controls.pickNumber2.value, 2));
            controls.analyzeBtn.addEventListener('click', () => this.analyzeTrade());
        },

        showTradeAutocomplete(input, listEl, teamNum) {
            const searchTerm = input.value.toLowerCase();
            listEl.innerHTML = ''; if (searchTerm.length < 2) return;
            const filtered = this.playerData.filter(p => p.name.toLowerCase().includes(searchTerm)).slice(0, 5);
            filtered.forEach(player => {
                const item = document.createElement('li');
                item.textContent = `${player.name} (${player.team} - ${player.simplePosition})`;
                item.addEventListener('click', () => { this.addPlayerToTrade(player, teamNum); input.value = ''; listEl.innerHTML = ''; });
                listEl.appendChild(item);
            });
        },
        
        addPlayerToTrade(player, teamNum) {
            if (teamNum === 1) this.tradeState.team1.players.push(player);
            else this.tradeState.team2.players.push(player);
            this.renderTradeUI();
        },
        
        getPickValue(year, round, pickNumber) {
            const baseValue = config.draftPickValues[year]?.[round] || 0;
            if (!baseValue) return 0;
            const depreciation = (pickNumber - 1) * (baseValue / 20); 
            return Math.max(5, baseValue - depreciation); 
        },

        addPickToTrade(year, round, pickNumberStr, teamNum) {
            const pickNumber = parseInt(pickNumberStr);
            if (!pickNumber || pickNumber < 1) {
                alert("Please enter a valid pick number.");
                return;
            }

            const pick = {
                id: `pick-${year}-${round}-${pickNumber}-${Date.now()}`,
                year: year,
                round: round,
                pick: pickNumber,
                name: `${year} Pick ${round}.${String(pickNumber).padStart(2, '0')}`,
                value: this.getPickValue(year, round, pickNumber)
            };
            if (teamNum === 1) this.tradeState.team1.picks.push(pick);
            else this.tradeState.team2.picks.push(pick);
            this.renderTradeUI();
        },
        
        removeAssetFromTrade(assetId, assetType, teamNum) {
            const team = (teamNum === 1) ? this.tradeState.team1 : this.tradeState.team2;
            if (assetType === 'player') {
                team.players = team.players.filter(p => p.name !== assetId);
            } else if (assetType === 'pick') {
                team.picks = team.picks.filter(p => p.id !== assetId);
            }
            this.renderTradeUI();
        },

        renderTradeUI() {
            const container1 = document.getElementById('trade-team-1');
            const container2 = document.getElementById('trade-team-2');

            const team1Assets = [...this.tradeState.team1.players.map(p => this.createTradeAssetPill(p, 1, 'player')), ...this.tradeState.team1.picks.map(p => this.createTradeAssetPill(p, 1, 'pick'))].join('');
            const team2Assets = [...this.tradeState.team2.players.map(p => this.createTradeAssetPill(p, 2, 'player')), ...this.tradeState.team2.picks.map(p => this.createTradeAssetPill(p, 2, 'pick'))].join('');

            container1.innerHTML = team1Assets || `<p class="text-gray-500 text-center p-4">Add players or picks to this side.</p>`;
            container2.innerHTML = team2Assets || `<p class="text-gray-500 text-center p-4">Add players or picks to this side.</p>`;
            
            document.querySelectorAll('.trade-remove-btn').forEach(btn => {
                btn.onclick = () => this.removeAssetFromTrade(btn.dataset.assetId, btn.dataset.assetType, parseInt(btn.dataset.teamNum));
            });
            this.addPlayerPopupListeners();
        },
        
        createTradeAssetPill(asset, teamNum, type) {
            const isPlayer = type === 'player';
            const assetId = isPlayer ? asset.name : asset.id;
            const displayName = isPlayer ? `<span class="player-name-link" data-player-name="${asset.name}">${asset.name}</span>` : `<span>${asset.name}</span>`;
            const displayInfo = isPlayer ? asset.simplePosition : `Value: ${asset.value.toFixed(1)}`;
            const pillClass = isPlayer ? `player-pos-${asset.simplePosition.toLowerCase()}` : 'player-pos-pick';

            return `
                <div class="trade-player-pill ${pillClass}">
                    ${displayName}
                    <span class="text-gray-400 ml-auto">${displayInfo}</span>
                    <button class="trade-remove-btn" data-asset-id="${assetId}" data-asset-type="${type}" data-team-num="${teamNum}">×</button>
                </div>
            `;
        },

        analyzeTrade() {
            const resultsContainer = document.getElementById('trade-results');
            resultsContainer.classList.remove('hidden');

            const team1Value = this.tradeState.team1.players.reduce((sum, p) => sum + (p.vorp || 0), 0) + this.tradeState.team1.picks.reduce((sum, p) => sum + p.value, 0);
            const team2Value = this.tradeState.team2.players.reduce((sum, p) => sum + (p.vorp || 0), 0) + this.tradeState.team2.picks.reduce((sum, p) => sum + p.value, 0);
            
            const totalAssets = this.tradeState.team1.players.length + this.tradeState.team1.picks.length + this.tradeState.team2.players.length + this.tradeState.team2.picks.length;

            let verdict;
            const diff = Math.abs(team1Value - team2Value);
            const avgVal = (team1Value + team2Value) / 2 || 1;

            if (totalAssets === 0) {
                verdict = `<h3 class="text-2xl font-bold text-red-400">Please add players or picks to analyze.</h3>`;
            } else if (diff / avgVal < 0.1) {
                verdict = `<h3 class="text-2xl font-bold text-yellow-300">This is a very balanced trade.</h3><p class="text-gray-300 mt-1">It's a fair swap that comes down to which assets you believe in more.</p>`;
            } else if (team1Value > team2Value) {
                verdict = `<h3 class="text-2xl font-bold text-red-400">You might be giving up too much value.</h3><p class="text-gray-300 mt-1">The other team seems to be getting the better end of this deal.</p>`;
            } else {
                verdict = `<h3 class="text-2xl font-bold text-green-400">This looks like a smash accept for you!</h3><p class="text-gray-300 mt-1">The assets you're getting back are a significant upgrade.</p>`;
            }

            resultsContainer.innerHTML = ` <div class="text-center">${verdict}</div> <div id="ai-trade-analysis-container" class="popup-footer mt-4"><button id="get-ai-trade-btn" class="ai-analysis-btn">Get AI Opinion</button><div id="ai-trade-loader" class="loader-small hidden"></div><p id="ai-trade-text" class="text-sm text-gray-300 mt-2 text-left"></p></div> `;
            if(totalAssets > 0) {
                document.getElementById('get-ai-trade-btn').addEventListener('click', () => this.getAITradeAnalysis());
            } else {
                document.getElementById('ai-trade-analysis-container').classList.add('hidden');
            }
        },
        
        async getAITradeAnalysis() {
            const container = document.getElementById('ai-trade-analysis-container'); const button = container.querySelector('#get-ai-trade-btn'); const loader = container.querySelector('#ai-trade-loader'); const textEl = container.querySelector('#ai-trade-text');
            button.classList.add('hidden'); loader.classList.remove('hidden');
            
            const team1Players = this.tradeState.team1.players.map(p => p.name).join(', ') || "no players";
            const team1Picks = this.tradeState.team1.picks.map(p => p.name).join(', ') || "no picks";
            const team2Players = this.tradeState.team2.players.map(p => p.name).join(', ') || "no players";
            const team2Picks = this.tradeState.team2.picks.map(p => p.name).join(', ') || "no picks";
            
            const prompt = `Act as a fantasy football expert. Analyze this dynasty trade: A manager sends ${team1Players} and ${team1Picks}. They receive ${team2Players} and ${team2Picks}. Provide a brief, strategic analysis of the trade, considering player value, age, draft pick value, and potential upside or risk. Keep it under 75 words.`;
            
            try { let chatHistory = [{ role: "user", parts: [{ text: prompt }] }]; const payload = { contents: chatHistory }; const apiKey = ""; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`; const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const result = await response.json(); if (result.candidates && result.candidates.length > 0) { textEl.textContent = result.candidates[0].content.parts[0].text; } else { throw new Error('No content returned from AI.'); } } catch (error) { console.error("Gemini API error:", error); textEl.textContent = "Could not retrieve AI analysis at this time."; } finally { loader.classList.add('hidden'); }
        },

        // --- GOAT DRAFT BUILDER ---
        setupGoatDraftControls() {
            const controls = {
                leagueType: document.getElementById('goat-league-type'), leagueSize: document.getElementById('goat-league-size'), draftPosition: document.getElementById('goat-draft-position'),
                generateButton: document.getElementById('generateDraftBuildButton'), scoringType: document.getElementById('goat-draft-scoring'), rosterContainer: document.getElementById('roster-settings-container')
            };

            if (!controls.generateButton) return;
            
            const rosterConfigs = {
                QB: { "min": 1, "max": 2, "default": config.rosterSettings.QB },
                RB: { "min": 1, "max": 3, "default": config.rosterSettings.RB },
                WR: { "min": 1, "max": 4, "default": config.rosterSettings.WR },
                TE: { "min": 0, "max": 2, "default": config.rosterSettings.TE },
                FLEX: { "min": 0, "max": 2, "default": config.rosterSettings.FLEX },
                K: { "min": 0, "max": 1, "default": config.rosterSettings.K },
                DST: { "min": 0, "max": 1, "default": config.rosterSettings.DST },
                BENCH: { "min": 4, "max": 8, "default": config.rosterSettings.BENCH }
            };

            controls.rosterContainer.innerHTML = Object.entries(rosterConfigs).map(([pos, config]) => {
                return `
                    <div class="roster-stepper" id="roster-${pos.toLowerCase()}">
                        <label class="roster-stepper-label">${pos}</label>
                        <div class="roster-stepper-controls">
                            <button type="button" class="roster-stepper-btn" data-action="decrement">-</button>
                            <span class="roster-stepper-value">${config.default}</span>
                            <button type="button" class="roster-stepper-btn" data-action="increment">+</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            Object.entries(rosterConfigs).forEach(([pos, config]) => {
                const stepperEl = document.getElementById(`roster-${pos.toLowerCase()}`);
                const valueEl = stepperEl.querySelector('.roster-stepper-value');
                stepperEl.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    let currentValue = parseInt(valueEl.textContent);
                    if (action === 'increment' && currentValue < config.max) {
                        currentValue++;
                    } else if (action === 'decrement' && currentValue > config.min) {
                        currentValue--;
                    }
                    valueEl.textContent = currentValue;
                });
            });


            const updateDraftPositions = () => {
                const size = parseInt(controls.leagueSize.value);
                controls.draftPosition.innerHTML = '';
                for (let i = 1; i <= size; i++) {
                    controls.draftPosition.add(new Option(`Pick ${i}`, i));
                }
            };
            
            updateDraftPositions(); // *** THIS IS THE FIX ***

            controls.leagueSize.addEventListener('change', updateDraftPositions);
            
            controls.generateButton.addEventListener('click', () => {
                const newRosterSettings = {};
                Object.keys(rosterConfigs).forEach(pos => {
                    const stepperEl = document.getElementById(`roster-${pos.toLowerCase()}`);
                    if(stepperEl) {
                        const valueEl = stepperEl.querySelector('.roster-stepper-value');
                        newRosterSettings[pos.toUpperCase()] = parseInt(valueEl.textContent);
                    }
                });
                config.rosterSettings = { ...newRosterSettings };
                
                this.runGoatMockDraft(controls);
            });
            
        },

        calculateDraftScore(player, round, scoring) {
            let score = 0;
            const adp = player.adp[scoring] || 999;
            
            if (round < 7) { 
                const adpScore = (1 / adp) * 1000;
                const vorpScore = (player.vorp || 0) * 1.5;
                score = (adpScore * 0.8) + (vorpScore * 0.2); 
            } else {
                score = (player.vorp || 0);
            }

            score *= (1 + (Math.random() - 0.5) * 0.4); 
            
            return score;
        },


        async runGoatMockDraft(controls) {
            const loader = document.getElementById('draft-loading-spinner'); const resultsWrapper = document.getElementById('draft-results-wrapper');
            const button = controls.generateButton;

            if (!loader || !resultsWrapper) return;
            loader.classList.remove('hidden');
            resultsWrapper.classList.add('hidden');
            button.disabled = true;

            await new Promise(resolve => setTimeout(resolve, 100));

            const leagueType = controls.leagueType.value; const scoring = controls.scoringType.value.toLowerCase(); const leagueSize = parseInt(controls.leagueSize.value); const userDraftPos = parseInt(controls.draftPosition.value) - 1;
            if (!this.hasDataLoaded) await this.loadAllPlayerData();

            let availablePlayers = JSON.parse(JSON.stringify(this.playerData)).filter(p => p.adp && typeof p.adp[scoring] === 'number');
            const teams = Array.from({ length: leagueSize }, () => ({ roster: [], needs: { ...config.rosterSettings } }));

            if (leagueType !== 'redraft') {
                // Keeper logic here...
            }
            
            const totalRounds = Object.values(config.rosterSettings).reduce((sum, val) => sum + val, 0);

            for (let round = 1; round <= totalRounds; round++) {
                const picksInRoundOrder = (round % 2 !== 0) ? Array.from({ length: leagueSize }, (_, i) => i) : Array.from({ length: leagueSize }, (_, i) => leagueSize - 1 - i);
                for (const teamIndex of picksInRoundOrder) {
                    if (teams[teamIndex].roster.length >= totalRounds || availablePlayers.length === 0) continue;
                    
                    let draftedPlayer;
                    const team = teams[teamIndex];

                    const needsDST = team.needs.DST > 0 && !team.roster.some(p => p.simplePosition === 'DST');
                    const needsK = team.needs.K > 0 && !team.roster.some(p => p.simplePosition === 'K');
                    
                    if(round >= totalRounds - 1 && needsDST && availablePlayers.some(p => p.simplePosition === 'DST')) {
                        draftedPlayer = availablePlayers.find(p => p.simplePosition === 'DST');
                    } else if (round >= totalRounds && needsK && availablePlayers.some(p => p.simplePosition === 'K')) {
                        draftedPlayer = availablePlayers.find(p => p.simplePosition === 'K');
                    } else {
                        availablePlayers.forEach(p => {
                            p.draftScore = this.calculateDraftScore(p, round, scoring);
                        });
                        
                        const qbsOnRoster = team.roster.filter(p => p.simplePosition === 'QB').length;
                        if(qbsOnRoster >= 1 && !config.rosterSettings.SUPER_FLEX) {
                            availablePlayers.forEach(p => { if(p.simplePosition === 'QB') p.draftScore *= 0.1; });
                        }
                        if(qbsOnRoster >= 2) {
                            availablePlayers.forEach(p => { if(p.simplePosition === 'QB') p.draftScore = 0; });
                        }
                        if(round < totalRounds - 2) {
                            availablePlayers.forEach(p => { if(p.simplePosition === 'K' || p.simplePosition === 'DST') p.draftScore = 0; });
                        }

                        availablePlayers.sort((a, b) => b.draftScore - a.draftScore);
                        
                        const bucketSize = (round < 3) ? 3 : 5;
                        const draftBucket = availablePlayers.slice(0, bucketSize);
                        draftedPlayer = draftBucket[Math.floor(Math.random() * draftBucket.length)];
                    }


                    const draftedPlayerIndex = availablePlayers.findIndex(p => p.name === draftedPlayer.name);
                    if(draftedPlayerIndex !== -1) {
                        availablePlayers.splice(draftedPlayerIndex, 1);
                    }


                    if (draftedPlayer) {
                        draftedPlayer.draftedAt = `(${round}.${picksInRoundOrder.indexOf(teamIndex) + 1})`;
                        team.roster.push(draftedPlayer);
                        
                        const needs = team.needs;
                        const pos = draftedPlayer.simplePosition.toUpperCase();
                        if (needs[pos] > 0) needs[pos]--;
                        else if (config.flexPositions.includes(pos) && needs['FLEX'] > 0) needs['FLEX']--;
                        else if (needs.BENCH > 0) needs.BENCH--;
                    }
                }
            }
            this.displayGoatDraftResults(teams[userDraftPos].roster);
            loader.classList.add('hidden');
            resultsWrapper.classList.remove('hidden');
            button.textContent = "Regenerate Build";
            button.disabled = false;
        },
        
        displayGoatDraftResults(roster) {
            const startersEl = document.getElementById('starters-list'); const benchEl = document.getElementById('bench-list');
            startersEl.innerHTML = ''; benchEl.innerHTML = '';
            const starters = []; const bench = []; 
            const rosterSlots = { ...config.rosterSettings };

            roster.forEach(player => {
                const pos = player.simplePosition.toUpperCase();
                if (player.draftedAt === "(Keeper)") {
                     player.displayPos = pos; starters.push(player); if(rosterSlots[pos]) rosterSlots[pos]--;
                }
                else if (rosterSlots[pos] > 0) { player.displayPos = pos; starters.push(player); rosterSlots[pos]--; }
                else if (config.flexPositions.includes(pos) && rosterSlots['FLEX'] > 0) { player.displayPos = 'FLEX'; starters.push(player); rosterSlots['FLEX']--; }
                else { bench.push(player); }
            });

            const positionOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST'];
            starters.sort((a, b) => positionOrder.indexOf(a.displayPos) - positionOrder.indexOf(b.displayPos));
            
            startersEl.innerHTML = starters.map(p => this.createPlayerCardHTML(p)).join('');
            benchEl.innerHTML = bench.map(p => this.createPlayerCardHTML(p, true)).join('');
            this.addPlayerPopupListeners();
        },
        createPlayerCardHTML(player, isBench = false) {
            const pos = isBench ? 'BEN' : player.displayPos;
            const draftInfo = player.draftedAt === "(Keeper)" ? `<span class="text-xs text-yellow-400 ml-auto font-bold">${player.draftedAt}</span>` : `<span class="text-xs text-gray-400 ml-auto">${player.draftedAt || ''}</span>`;
            return `<div class="player-card player-pos-${player.simplePosition.toLowerCase()}"><strong class="font-bold w-12">${pos}:</strong><span class="player-name-link" data-player-name="${player.name}">${player.name} (${player.team})</span>${draftInfo}</div>`;
        },
        initStartSitTool() {
            const tool = { player1Input: document.getElementById('start-sit-player1'), player2Input: document.getElementById('start-sit-player2'), analyzeBtn: document.getElementById('start-sit-analyze'), resultsContainer: document.getElementById('start-sit-results') };
            if(!tool.analyzeBtn) return;
            [tool.player1Input, tool.player2Input].forEach(input => { input.addEventListener('input', e => this.showAutocomplete(e.target)); });
            tool.analyzeBtn.addEventListener('click', () => { const player1 = this.playerData.find(p => p.name === tool.player1Input.value); const player2 = this.playerData.find(p => p.name === tool.player2Input.value); this.analyzeStartSit(player1, player2); });
        },
        analyzeStartSit(p1, p2) {
            const resultsContainer = document.getElementById('start-sit-results');
            if (!p1 || !p2) { resultsContainer.innerHTML = `<p class="text-red-400">Please select two valid players.</p>`; resultsContainer.classList.remove('hidden'); return; }
            const score1 = (p1.vorp * 2) + ((10 - p1.tier) * 5) + p1.fantasyPoints; const score2 = (p2.vorp * 2) + ((10 - p2.tier) * 5) + p2.fantasyPoints;
            const winner = score1 > score2 ? p1 : p2; const loser = score1 > score2 ? p2 : p1;
            const advice = this.generateStartSitAdvice(winner, loser);
            resultsContainer.innerHTML = ` <h3 class="text-2xl font-bold text-yellow-300 mb-4">The Verdict</h3> <div class="verdict-card start"><p class="decision-text">START</p><p class="player-name">${winner.name}</p><p class="player-details">${winner.simplePosition} | ${winner.team}</p></div> <div class="verdict-card sit"><p class="decision-text">SIT</p><p class="player-name">${loser.name}</p><p class="player-details">${loser.simplePosition} | ${loser.team}</p></div> <div class="analysis-section"><h4 class="font-semibold text-teal-300">Analysis</h4><p class="text-gray-300">${advice}</p></div> `;
            resultsContainer.classList.remove('hidden');
        },
        generateStartSitAdvice(winner, loser) {
            const reasons = [`has a significantly higher Value Over Replacement Player (VORP), indicating greater potential impact.`,`is in a higher tier, suggesting more reliable week-to-week production.`,`has a better recent performance trend, making them the safer bet this week.`,`simply projects for more points based on our latest data models.`,`has a more favorable matchup, increasing their scoring ceiling.`];
            const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
            return `While both are viable options, **${winner.name}** gets the edge. Our model indicates that ${winner.name} ${randomReason} Consider starting ${loser.name} only in deeper leagues or as a bye-week replacement.`;
        },
        initMockDraftSimulator() {
             const controls = { startBtn: document.getElementById('start-draft-button'), scoringSelect: document.getElementById('draftScoringType'), sizeSelect: document.getElementById('leagueSize'), pickSelect: document.getElementById('userPick'), settingsContainer: document.getElementById('draft-settings-container'), draftingContainer: document.getElementById('interactive-draft-container'), completeContainer: document.getElementById('draft-complete-container'), restartBtn: document.getElementById('restart-draft-button'), };
            if (!controls.startBtn) return;
            const updateUserPickOptions = () => { const size = parseInt(controls.sizeSelect.value); controls.pickSelect.innerHTML = ''; for (let i = 1; i <= size; i++) { controls.pickSelect.add(new Option(`Pick ${i}`, i)); } };
            controls.sizeSelect.addEventListener('change', updateUserPickOptions);
            controls.startBtn.addEventListener('click', () => this.startInteractiveDraft(controls));
            controls.restartBtn.addEventListener('click', () => this.resetDraftUI(controls));
            updateUserPickOptions();
        },
        startInteractiveDraft(controls) {
            controls.settingsContainer.classList.add('hidden'); controls.draftingContainer.classList.remove('hidden'); controls.completeContainer.classList.add('hidden');
            const leagueSize = parseInt(controls.sizeSelect.value); const userPickNum = parseInt(controls.pickSelect.value); const scoring = controls.scoringSelect.value.toLowerCase(); const totalRounds = 15;
            this.draftState = { controls, leagueSize, userPickNum, scoring, totalRounds, currentRound: 1, currentPickInRound: 1, teams: Array.from({ length: leagueSize }, (v, i) => ({ teamNumber: i + 1, roster: [] })), availablePlayers: [...this.playerData].filter(p => p.adp && typeof p.adp[scoring] === 'number').sort((a, b) => a.adp[scoring] - b.adp[scoring]), draftPicks: [], isUserTurn: false, };
            this.updateDraftBoard(); this.updateMyTeam(); this.runDraftTurn();
        },
        runDraftTurn() {
            if (this.draftState.currentRound > this.draftState.totalRounds) { this.endInteractiveDraft(); return; }
            const { currentRound, leagueSize } = this.draftState; const isSnake = currentRound % 2 === 0; const pickInRound = this.draftState.currentPickInRound; const teamIndex = isSnake ? leagueSize - 1 - (pickInRound - 1) : pickInRound - 1;
            const isUserTurn = (teamIndex + 1) === this.draftState.userPickNum; this.draftState.isUserTurn = isUserTurn;
            this.updateDraftStatus();
            if (isUserTurn) { this.updateBestAvailable(true); } 
            else { this.updateBestAvailable(false); setTimeout(() => { this.makeAiPick(teamIndex); this.runDraftTurn(); }, 500); }
        },
        makeAiPick(teamIndex) {
            const { availablePlayers } = this.draftState; const topAvailable = availablePlayers.slice(0, 15);
            topAvailable.forEach(p => { let score = p.vorp || 0; score *= (1 + (Math.random() - 0.5) * 0.4); p.draftScore = score; });
            topAvailable.sort((a, b) => b.draftScore - a.draftScore);
            const draftedPlayer = topAvailable[0]; this.makePick(draftedPlayer, teamIndex);
        },
        makeUserPick(playerName) { const player = this.draftState.availablePlayers.find(p => p.name === playerName); const teamIndex = this.draftState.userPickNum - 1; if (player) { this.makePick(player, teamIndex); this.runDraftTurn(); } },
        makePick(player, teamIndex) {
            this.draftState.availablePlayers = this.draftState.availablePlayers.filter(p => p.name !== player.name);
            this.draftState.teams[teamIndex].roster.push(player);
            this.draftState.draftPicks.push({ round: this.draftState.currentRound, pick: this.draftState.currentPickInRound, player: player, teamNumber: teamIndex + 1, });
            this.updateDraftBoard(); if ((teamIndex + 1) === this.draftState.userPickNum) { this.updateMyTeam(); }
            this.draftState.currentPickInRound++;
            if (this.draftState.currentPickInRound > this.draftState.leagueSize) { this.draftState.currentPickInRound = 1; this.draftState.currentRound++; }
        },
        updateDraftStatus() {
            const { currentRound, currentPickInRound, leagueSize, totalRounds, isUserTurn } = this.draftState;
            const overallPick = (currentRound - 1) * leagueSize + currentPickInRound; const statusCard = document.getElementById('draft-status-card');
            statusCard.classList.toggle('on-the-clock', isUserTurn);
            let statusHTML = `<p class="text-gray-400 font-semibold">Round ${currentRound}/${totalRounds} | Pick ${overallPick}</p>`;
            if(isUserTurn) { statusHTML += `<p class="text-2xl font-bold text-yellow-300 text-glow-gold animate-pulse">YOU ARE ON THE CLOCK</p>`; } 
            else { const isSnake = currentRound % 2 === 0; const teamNumber = isSnake ? leagueSize - currentPickInRound + 1 : currentPickInRound; statusHTML += `<p class="text-xl font-semibold text-white">Team ${teamNumber} is picking...</p>`; }
            statusCard.innerHTML = statusHTML;
        },
        updateBestAvailable(isUserTurn) {
            const listEl = document.getElementById('best-available-list'); listEl.innerHTML = '';
            const topPlayers = this.draftState.availablePlayers.slice(0, 30);
            topPlayers.forEach(player => { const playerEl = document.createElement('div'); playerEl.className = 'best-available-player'; playerEl.innerHTML = `<span class="font-bold text-sm text-center w-12 player-pos-${player.simplePosition.toLowerCase()}">${player.simplePosition}</span><div class="flex-grow"><p class="player-name-link font-semibold text-white" data-player-name="${player.name}">${player.name}</p><p class="text-xs text-gray-400">${player.team} | Bye: ${player.bye || 'N/A'}</p></div>${isUserTurn ? `<button class="draft-button" data-player-name="${player.name}">Draft</button>` : `<span class="text-sm font-mono text-gray-500">${(player.adp.ppr || 999).toFixed(1)}</span>`}`; listEl.appendChild(playerEl); });
            if(isUserTurn) { document.querySelectorAll('.draft-button').forEach(btn => { btn.onclick = (e) => this.makeUserPick(e.target.dataset.playerName); }); }
            this.addPlayerPopupListeners();
        },
        updateMyTeam() {
            const listEl = document.getElementById('my-team-list'); listEl.innerHTML = '';
            const myTeam = this.draftState.teams[this.draftState.userPickNum - 1];
            myTeam.roster.forEach(player => { listEl.innerHTML += ` <div class="my-team-player player-pos-${player.simplePosition.toLowerCase()}"><strong class="w-10">${player.simplePosition}</strong><span class="player-name-link" data-player-name="${player.name}">${player.name}</span></div> `; });
            this.addPlayerPopupListeners();
        },
        updateDraftBoard() {
            const gridEl = document.getElementById('draft-board-grid'); const { leagueSize, draftPicks, userPickNum, totalRounds } = this.draftState; gridEl.innerHTML = '';
            let headerHtml = '<div class="draft-board-header">'; for (let i = 1; i <= leagueSize; i++) { headerHtml += `<div class="draft-board-team-header ${userPickNum === i ? 'user-team-header' : ''}">Team ${i}</div>`; } headerHtml += '</div>'; gridEl.innerHTML += headerHtml;
            const bodyEl = document.createElement('div'); bodyEl.className = 'draft-board-body'; bodyEl.style.gridTemplateColumns = `repeat(${leagueSize}, minmax(0, 1fr))`;
            for (let i = 0; i < totalRounds * leagueSize; i++) {
                const pick = draftPicks[i];
                const pickEl = document.createElement('div');
                if(pick) { pickEl.className = `draft-pick pick-pos-${pick.player.simplePosition.toLowerCase()} ${pick.teamNumber === userPickNum ? 'user-pick' : ''}`; pickEl.innerHTML = `<span class="pick-number">${pick.round}.${pick.pick}</span><p class="player-name-link pick-player-name" data-player-name="${pick.player.name}">${pick.player.name}</p><p class="pick-player-info">${pick.player.team} - ${pick.player.simplePosition}</p>`; }
                else { pickEl.className = `draft-pick empty`; }
                bodyEl.appendChild(pickEl);
            }
            gridEl.appendChild(bodyEl); this.addPlayerPopupListeners();
        },
        endInteractiveDraft() {
            this.draftState.controls.draftingContainer.classList.add('hidden'); this.draftState.controls.completeContainer.classList.remove('hidden');
            const rosterEl = document.getElementById('final-roster-display'); rosterEl.innerHTML = '';
            const myRoster = this.draftState.teams[this.draftState.userPickNum - 1].roster;
            const starters = []; const bench = []; const rosterSlots = { ...config.rosterSettings };
            myRoster.forEach(player => { const pos = player.simplePosition; if (rosterSlots[pos] > 0) { starters.push(player); rosterSlots[pos]--; } else if (config.flexPositions.includes(pos) && rosterSlots['FLEX'] > 0) { player.displayPos = 'FLEX'; starters.push(player); rosterSlots['FLEX']--; } else { bench.push(player); } });
            rosterEl.innerHTML = ` <div><h4 class="text-xl font-semibold text-teal-300 mb-2 border-b border-gray-700 pb-1">Starters</h4><div class="space-y-2">${starters.map(p => this.createPlayerCardHTML(p)).join('')}</div></div> <div><h4 class="text-xl font-semibold text-teal-300 mb-2 border-b border-gray-700 pb-1">Bench</h4><div class="space-y-2">${bench.map(p => this.createPlayerCardHTML(p, true)).join('')}</div></div> `;
            this.addPlayerPopupListeners();
        },
        resetDraftUI(controls) {
            controls.settingsContainer.classList.remove('hidden'); controls.draftingContainer.classList.add('hidden'); controls.completeContainer.classList.add('hidden');
            this.draftState = {};
        },
        getOrdinal(n) {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
        },
        createPlayerPopup() { /* ... */ },
        addPlayerPopupListeners() { /* ... */ },
        updateAndShowPopup(player, event) { /* ... */ },
        async getAiPlayerAnalysis(playerName) { /* ... */ },
        async generateDailyBriefing() { /* ... */ },
        initArticlesPage() { /* ... */ }, 
        loadArticleContent() { /* ... */ }
    };

    App.init();
});
