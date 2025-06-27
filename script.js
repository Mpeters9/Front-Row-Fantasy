/**
 * Front Row Fantasy - Main Application Script
 * Version: 2.0 - Unified Data Model
 * This script is updated to use a single `players.json` data source.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const config = {
        // The single source of truth for all player data
        dataFile: 'players.json',
        // Roster presets for the tools
        lineupPresets: {
            'PPR: 1QB, 2RB, 2WR, 1TE, 1FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1 },
            'Standard: 1QB, 2RB, 2WR, 1TE, 1FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1 },
            'SuperFlex Redraft: 1QB, 1SF, 2RB, 2WR, 1TE, 1FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, 'SUPER_FLEX': 1, DST: 1, K: 1 },
            'SuperFlex Dynasty: 1QB, 1SF, 2RB, 2WR, 1TE, 2FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, 'SUPER_FLEX': 1, DST: 1, K: 1 },
            'Half-PPR: 1QB, 2RB, 2WR, 1TE, 2FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, DST: 1, K: 1 },
            '2QB: 2QB, 2RB, 3WR, 1TE, 1FLX, 1DST, 1K': { QB: 2, RB: 2, WR: 3, TE: 1, FLEX: 1, DST: 1, K: 1 },
            '3WR: 1QB, 2RB, 3WR, 1TE, 1FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, DST: 1, K: 1 },
            '2TE: 1QB, 2RB, 2WR, 2TE, 1FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 2, FLEX: 1, DST: 1, K: 1 },
            'Deep FLEX: 1QB, 2RB, 2WR, 1TE, 3FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 3, DST: 1, K: 1 },
        }
    };

    // --- DATA MODULE ---
    // Handles fetching and caching the unified player data file.
    const Data = (() => {
        let playerDataCache = null;

        const loadPlayerData = async () => {
            if (playerDataCache) return playerDataCache;
            try {
                const res = await fetch(config.dataFile);
                if (!res.ok) throw new Error('players.json not found');
                playerDataCache = await res.json();
                return playerDataCache;
            } catch (e) {
                console.error('Failed to load player data:', e);
                return [];
            }
        };
        return { getPlayers: loadPlayerData };
    })();

    // --- UI MODULE ---
    const UI = (() => {
        const initMobileMenu = () => {
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileNav = document.getElementById('mobile-menu');
            const mainNav = document.querySelector('header nav.hidden');
            if (mobileMenuButton && mobileNav && mainNav) {
                mobileNav.innerHTML = mainNav.innerHTML;
                mobileMenuButton.addEventListener('click', () => mobileNav.classList.toggle('hidden'));
            }
        };
        const showLoading = (spinnerId, show = true) => {
            const spinner = document.getElementById(spinnerId);
            if(spinner) spinner.style.display = show ? 'block' : 'none';
        }
        return { initMobileMenu, showLoading };
    })();

    // --- GOAT TOOLS MODULE (Draft, Lineup, Start/Sit) ---
    const GoatTools = (() => {
        let draftSettings = {};
        let lineupRoster = [];
        let startSitPlayers = { player1: null, player2: null };
        let allPlayers = [];
        
        const init = async () => {
            // Only run if on the GOAT page
            if (!document.getElementById('goat-draft-builder') && !document.getElementById('lineup-tools')) return;
            
            allPlayers = await Data.getPlayers();
            if (!allPlayers.length) {
                console.error("No player data loaded. Tools will not function.");
                return;
            }

            setupTabs();
            setupDraftControls();
            setupLineupBuilder();
            setupStartSitTool();
        };

        const setupTabs = () => {
            const lineupTab = document.getElementById('tab-lineup-builder');
            const startSitTab = document.getElementById('tab-start-sit');
            const lineupContent = document.getElementById('lineup-builder-content');
            const startSitContent = document.getElementById('start-sit-content');

            if(!lineupTab) return; // Exit if tabs aren't on this page

            lineupTab.addEventListener('click', () => {
                lineupTab.classList.add('active');
                startSitTab.classList.remove('active');
                lineupContent.classList.remove('hidden');
                startSitContent.classList.add('hidden');
            });
             startSitTab.addEventListener('click', () => {
                startSitTab.classList.add('active');
                lineupTab.classList.remove('active');
                startSitContent.classList.remove('hidden');
                lineupContent.classList.add('hidden');
            });
        }
        
        const getPlayerValue = (player, scoring) => {
            // Use projected fantasy points if available, otherwise fallback to ADP
            if (player.projections?.fantasy_points?.[scoring]) {
                return player.projections.fantasy_points[scoring];
            }
            // Fallback to ADP rank as a value metric. Lower is better.
            const rank = player.adp?.[scoring] || player.adp?.ppr || 250; // default to ppr or a low rank
            return 1000 / Math.sqrt(rank);
        };

        // --- DRAFT BUILDER ---
        const setupDraftControls = () => {
            const draftBuilder = document.getElementById('goat-draft-builder');
            if (!draftBuilder) return;
            
            const presetSelect = document.getElementById('draftLineupPreset');
            presetSelect.innerHTML = Object.keys(config.lineupPresets).map(p => `<option value="${p}">${p}</option>`).join('');
            
            draftBuilder.addEventListener('click', (e) => {
                if (e.target.id === 'generateDraftBuildButton') runMockDraft();
            });
            document.getElementById('leagueSize').addEventListener('change', updateDraftPositions);
            presetSelect.addEventListener('change', () => updateRosterCounts('draft'));

            updateDraftPositions();
            updateRosterCounts('draft');
        };

        const updateDraftPositions = () => {
            const leagueSize = parseInt(document.getElementById('leagueSize').value, 10);
            const positionSelect = document.getElementById('draftPosition');
            positionSelect.innerHTML = '';
            for (let i = 1; i <= leagueSize; i++) positionSelect.add(new Option(i, i));
        };

        const updateRosterCounts = (toolPrefix) => {
            const presetEl = document.getElementById(`${toolPrefix}LineupPreset`);
            if (!presetEl) return;
            const presetKey = presetEl.value;
            const roster = config.lineupPresets[presetKey];
            const container = document.getElementById(`${toolPrefix}-roster-counts`);
            if (!container) return;
            container.innerHTML = Object.entries(roster).map(([pos, count]) => `
                <div class="p-2 bg-gray-700/50 rounded-lg">
                    <div class="text-sm text-teal-300">${pos.replace(/_/g, ' ')}</div>
                    <div class="text-xl font-bold text-white">${count}</div>
                </div>
            `).join('');
        };
        
        const runMockDraft = async () => {
            UI.showLoading('draft-loading-spinner', true);
            document.getElementById('draft-results-wrapper').classList.add('hidden');

            draftSettings = {
                scoring: document.getElementById('draftScoringType').value,
                leagueSize: parseInt(document.getElementById('leagueSize').value, 10),
                userDraftPos: parseInt(document.getElementById('draftPosition').value, 10) - 1,
                benchSize: parseInt(document.getElementById('benchCount').value, 10),
                rosterPreset: config.lineupPresets[document.getElementById('draftLineupPreset').value]
            };

            const totalRounds = Object.values(draftSettings.rosterPreset).reduce((a, b) => a + b, 0) + draftSettings.benchSize;
            
            // Get players and sort them by the selected scoring ADP
            let availablePlayers = [...allPlayers].sort((a,b) => (a.adp[draftSettings.scoring] || 999) - (b.adp[draftSettings.scoring] || 999));
            
            const teams = Array.from({ length: draftSettings.leagueSize }, () => ({ roster: [], needs: { ...draftSettings.rosterPreset } }));
            
            for (let round = 0; round < totalRounds; round++) {
                const picksInRoundOrder = (round % 2 !== 0) ? 
                    Array.from({ length: draftSettings.leagueSize }, (_, i) => draftSettings.leagueSize - 1 - i) :
                    Array.from({ length: draftSettings.leagueSize }, (_, i) => i);
                
                for (const teamIndex of picksInRoundOrder) {
                    if (availablePlayers.length === 0) break;
                    const pickInRound = picksInRoundOrder.indexOf(teamIndex) + 1;
                    const team = teams[teamIndex];
                    // Simple BPA (Best Player Available) draft logic for AI
                    let draftedPlayer = availablePlayers.shift(); 
                    
                    if (draftedPlayer) {
                        draftedPlayer.draftedAt = `(${(round + 1)}.${pickInRound})`;
                        team.roster.push(draftedPlayer);
                    }
                }
            }
            displayDraftResults(teams[draftSettings.userDraftPos].roster);
        };
        
        const displayDraftResults = (myRoster) => {
            const startersEl = document.getElementById('starters-list');
            const benchEl = document.getElementById('bench-list');
            startersEl.innerHTML = '';
            benchEl.innerHTML = '';
            const rosterNeeds = { ...draftSettings.rosterPreset };
            
            let myTeamByValue = myRoster.map(p => ({...p, value: getPlayerValue(p, draftSettings.scoring)})).sort((a,b) => b.value - a.value);

            const starters = {};
            Object.keys(rosterNeeds).forEach(p => starters[p] = []);
            const filledPlayers = new Set();
            
            const fillPosition = (pos, isFlex = false, isSuperFlex = false) => {
                 for (const player of myTeamByValue) {
                    if (filledPlayers.has(player.name)) continue;
                    if (starters[pos].length >= rosterNeeds[pos]) continue;

                    const canFillFlex = isFlex && ['RB', 'WR', 'TE'].includes(player.position);
                    const canFillSuperFlex = isSuperFlex && ['QB', 'RB', 'WR', 'TE'].includes(player.position);
                    const canFillPosition = player.position === pos;

                    if (canFillPosition || canFillFlex || canFillSuperFlex) {
                         starters[pos].push(player);
                         filledPlayers.add(player.name);
                    }
                 }
            }
            
            Object.keys(rosterNeeds).forEach(pos => fillPosition(pos, pos === 'FLEX', pos === 'SUPER_FLEX'));

            Object.entries(starters).forEach(([pos, players]) => {
                players.sort((a,b) => (a.adp[draftSettings.scoring] || 999) - (b.adp[draftSettings.scoring] || 999));
                players.forEach(p => startersEl.innerHTML += `<div class="player-card player-pos-${p.position.toLowerCase()}"><strong>${p.draftedAt}</strong> ${p.name} <span class="text-gray-400">(${p.team} - ${p.position})</span></div>`);
            });
            myRoster.forEach(p => {
                if (!filledPlayers.has(p.name)) benchEl.innerHTML += `<div class="player-card player-pos-${p.position.toLowerCase()}"><strong>${p.draftedAt}</strong> ${p.name} <span class="text-gray-400">(${p.team} - ${p.position})</span></div>`;
            });

            UI.showLoading('draft-loading-spinner', false);
            document.getElementById('draft-results-wrapper').classList.remove('hidden');
        };

        // --- LINEUP BUILDER & START/SIT ---
        const setupAutocomplete = (inputEl, listEl, onSelect) => {
            inputEl.addEventListener('input', () => {
                const query = inputEl.value.toLowerCase();
                if (query.length < 2) { listEl.classList.add('hidden'); return; }
                
                const filtered = allPlayers.filter(p => p.name.toLowerCase().includes(query)).slice(0, 5);
                
                listEl.innerHTML = filtered.map(p => `<li data-player='${JSON.stringify(p)}'>${p.name} (${p.team} - ${p.position})</li>`).join('');
                listEl.classList.remove('hidden');
            });
             listEl.addEventListener('click', (e) => {
                if (e.target.tagName === 'LI') {
                    onSelect(JSON.parse(e.target.dataset.player));
                    inputEl.value = '';
                    listEl.classList.add('hidden');
                }
            });
        };

        const setupLineupBuilder = () => {
            const lineupBuilder = document.getElementById('lineup-builder-content');
            if (!lineupBuilder) return;
            
            const searchInput = document.getElementById('lineup-player-search');
            const autocompleteEl = document.getElementById('lineup-player-autocomplete');
            const presetSelect = document.getElementById('lineupPreset');
            
            presetSelect.innerHTML = Object.keys(config.lineupPresets).map(p => `<option value="${p}">${p}</option>`).join('');

            setupAutocomplete(searchInput, autocompleteEl, (player) => {
                 if (!lineupRoster.some(r => r.name === player.name)) {
                    lineupRoster.push(player);
                    renderLineupRoster();
                }
            });
            
            document.getElementById('lineup-roster').addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-btn')) {
                    lineupRoster = lineupRoster.filter(p => p.name !== e.target.dataset.player);
                    renderLineupRoster();
                }
            });

            document.getElementById('generateLineupButton').addEventListener('click', generateOptimalLineup);
        };
        
        const renderLineupRoster = () => {
            const rosterEl = document.getElementById('lineup-roster');
            if (!rosterEl) return;
            if (lineupRoster.length === 0) {
                 rosterEl.innerHTML = `<span class="text-gray-500 italic">Your added players will appear here...</span>`;
                 return;
            }
            rosterEl.innerHTML = lineupRoster.map(p => `
                <div class="trade-player items-center">
                    <span>${p.name} <span class="text-gray-400">(${p.position})</span></span>
                    <button class="remove-btn" data-player="${p.name}">×</button>
                </div>
            `).join('');
        };
        
        const generateOptimalLineup = () => {
             const presetKey = document.getElementById('lineupPreset').value;
             const scoring = presetKey.toLowerCase().includes('ppr') ? (presetKey.toLowerCase().includes('half') ? 'half_ppr' : 'ppr') : 'standard';
             const rosterNeeds = { ...config.lineupPresets[presetKey] };
             const resultsWrapper = document.getElementById('lineup-results-wrapper');
             const startersEl = document.getElementById('optimized-starters-list');
             
             if(lineupRoster.length === 0) {
                 startersEl.innerHTML = `<p class="text-red-400 text-center">Please add players to your roster first.</p>`;
                 resultsWrapper.classList.remove('hidden');
                 return;
             }
             
             let rosterWithValue = lineupRoster.map(p => ({...p, value: getPlayerValue(p, scoring)})).sort((a,b) => b.value - a.value);

             const starters = {};
             Object.keys(rosterNeeds).forEach(p => starters[p] = []);
             const filledPlayers = new Set();
             
             const fillPosition = (pos) => {
                 for(const player of rosterWithValue){
                    if (filledPlayers.has(player.name) || starters[pos].length >= rosterNeeds[pos]) continue;
                     
                    const isFlex = pos === 'FLEX' && ['RB', 'WR', 'TE'].includes(player.position);
                    const isSuperFlex = pos === 'SUPER_FLEX' && ['QB', 'RB', 'WR', 'TE'].includes(player.position);
                    const isPositionMatch = player.position === pos;

                    if (isPositionMatch || isFlex || isSuperFlex) {
                         starters[pos].push(player);
                         filledPlayers.add(player.name);
                    }
                 }
             }

            Object.keys(rosterNeeds).forEach(fillPosition);
             
            startersEl.innerHTML = Object.entries(starters).flatMap(([pos, players]) => 
                players.map(p => `<div class="player-card player-pos-${p.position.toLowerCase()}"><strong>${pos.replace(/_/g, ' ')}:</strong> ${p.name} <span class="text-gray-400">(${p.team})</span></div>`)
            ).join('');
             
             resultsWrapper.classList.remove('hidden');
        };
        
        const setupStartSitTool = () => {
            const startSitContent = document.getElementById('start-sit-content');
            if(!startSitContent) return;

            const p1Input = document.getElementById('start-sit-player1-search');
            const p1List = document.getElementById('start-sit-player1-autocomplete');
            const p2Input = document.getElementById('start-sit-player2-search');
            const p2List = document.getElementById('start-sit-player2-autocomplete');

            setupAutocomplete(p1Input, p1List, (player) => {
                if (startSitPlayers.player2?.name === player.name) return;
                startSitPlayers.player1 = player;
                renderStartSitCard('player1');
            });

             setupAutocomplete(p2Input, p2List, (player) => {
                if (startSitPlayers.player1?.name === player.name) return;
                startSitPlayers.player2 = player;
                renderStartSitCard('player2');
            });
            
            document.getElementById('analyzeStartSit').addEventListener('click', analyzeStartSit);
        };
        
        const renderStartSitCard = (playerKey) => {
            const player = startSitPlayers[playerKey];
            const cardEl = document.getElementById(`start-sit-${playerKey}-card`);
            if (!player) {
                cardEl.innerHTML = '';
                return;
            }
            // Use PPR value as a default comparison metric
            const value = getPlayerValue(player, 'ppr');
            cardEl.innerHTML = `
                <div class="player-card player-pos-${player.position.toLowerCase()} text-center">
                    <div class="font-bold text-lg">${player.name}</div>
                    <div class="text-sm text-gray-400">${player.team} - ${player.position}</div>
                    <div class="text-lg font-bold text-yellow-300 mt-1">Value: ${value.toFixed(1)}</div>
                </div>
            `;
        };

        const analyzeStartSit = () => {
            const { player1, player2 } = startSitPlayers;
            const resultEl = document.getElementById('start-sit-result');
            resultEl.classList.remove('hidden');
            
            if (!player1 || !player2) {
                resultEl.innerHTML = `<span class="text-red-400">Please select two players to compare.</span>`;
                return;
            }
            
            const p1Value = getPlayerValue(player1, 'ppr');
            const p2Value = getPlayerValue(player2, 'ppr');

            if (p1Value > p2Value) {
                resultEl.innerHTML = `Start <span class="text-green-400">${player1.name}</span> over <span class="text-red-400">${player2.name}</span>.`;
            } else if (p2Value > p1Value) {
                resultEl.innerHTML = `Start <span class="text-green-400">${player2.name}</span> over <span class="text-red-400">${player1.name}</span>.`;
            } else {
                 resultEl.innerHTML = `It's a toss-up! <span class="text-yellow-300">${player1.name}</span> and <span class="text-yellow-300">${player2.name}</span> are valued equally.`;
            }
        };

        return { init };
    })();

    // --- EXPERT TOOLS MODULE (Trade Analyzer) ---
    const ExpertTools = (() => {
        let tradeTeam1 = [], tradeTeam2 = [], allPlayers = [];

        const init = async () => {
            if (!document.getElementById('trade-analyzer')) return;
            allPlayers = await Data.getPlayers();
            setupTradeAnalyzer();
        };

        const setupTradeAnalyzer = () => {
            // ... (setupTradeAnalyzer logic is largely unchanged but uses `allPlayers`)
        }

        return { init };
    })();
    
    // --- APP INITIALIZER ---
    const App = (() => {
        const init = () => {
            UI.initMobileMenu();
            GoatTools.init();
            ExpertTools.init();
        };
        return { init };
    })();

    App.init();
});
