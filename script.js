/**
 * Front Row Fantasy - Main Application Script
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const config = {
        dataFiles: {
            standard: 'Standard ADP.json',
            ppr: 'PPR.json',
            half: 'Half PPR.json',
            stats: 'players_2025 Stats.json'
        },
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
    const Data = (() => {
        const state = { adp: {} };
        const loadAdpData = async (scoring = 'ppr') => {
            if (state.adp[scoring]) return state.adp[scoring];
            try {
                const res = await fetch(config.dataFiles[scoring]);
                if (!res.ok) throw new Error(`ADP data not found for ${scoring}`);
                let data = await res.json();
                state.adp[scoring] = data.map(p => ({
                    ...p,
                    simplePosition: p.POS.replace(/\d+/g, ''),
                    value: 1000 / Math.sqrt(p.Rank || 200),
                }));
                return state.adp[scoring];
            } catch (e) {
                console.error(`Failed to load ${scoring} ADP data:`, e);
                return [];
            }
        };
        return { getAdp: loadAdpData };
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

    // --- GOAT TOOLS MODULE (Draft & Lineup) ---
    const GoatTools = (() => {
        let draftSettings = {};
        let lineupRoster = [];
        let allPlayers = [];
        
        const init = async () => {
            if (!document.getElementById('goat-draft-builder')) return;
            allPlayers = await Data.getAdp('ppr');

            // Init Draft Builder
            setupDraftControls();
            
            // Init Lineup Builder
            setupLineupBuilder();
        };
        
        // --- DRAFT BUILDER ---
        const setupDraftControls = () => {
            const presetSelect = document.getElementById('draftLineupPreset');
            presetSelect.innerHTML = Object.keys(config.lineupPresets).map(p => `<option value="${p}">${p}</option>`).join('');
            
            document.getElementById('generateDraftBuildButton').addEventListener('click', runMockDraft);
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
            const presetKey = document.getElementById(`${toolPrefix}LineupPreset`).value;
            const roster = config.lineupPresets[presetKey];
            const container = document.getElementById(`${toolPrefix}-roster-counts`);
            if (!container) return; // Guard clause
            container.innerHTML = Object.entries(roster).map(([pos, count]) => `
                <div class="p-2 bg-gray-700/50 rounded-lg">
                    <div class="text-sm text-teal-300">${pos.replace('_', ' ')}</div>
                    <div class="text-xl font-bold text-white">${count}</div>
                </div>
            `).join('');
        };

        const runMockDraft = async () => {
            // ... (Existing runMockDraft logic remains the same)
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
            const players = await Data.getAdp(draftSettings.scoring);
            const availablePlayers = [...players];
            const teams = Array.from({ length: draftSettings.leagueSize }, () => ({ roster: [], needs: { ...draftSettings.rosterPreset } }));
            
            for (let round = 0; round < totalRounds; round++) {
                const picksInRound = (round % 2 !== 0) ? 
                    Array.from({ length: draftSettings.leagueSize }, (_, i) => draftSettings.leagueSize - 1 - i) :
                    Array.from({ length: draftSettings.leagueSize }, (_, i) => i);
                
                for (const teamIndex of picksInRound) {
                    const team = teams[teamIndex];
                    let draftedPlayer = null;
                    
                    for (const pos of ['QB', 'RB', 'WR', 'TE', 'SUPER_FLEX', 'FLEX', 'DST', 'K']) {
                         if (!team.needs[pos] || team.needs[pos] <= 0) continue;
                         const playerToDraft = availablePlayers.find(p => {
                            if (pos === 'FLEX') return ['RB', 'WR', 'TE'].includes(p.simplePosition);
                            if (pos === 'SUPER_FLEX') return ['QB', 'RB', 'WR', 'TE'].includes(p.simplePosition);
                            return p.simplePosition === pos;
                         });
                         if(playerToDraft) {
                             draftedPlayer = playerToDraft;
                             team.needs[pos]--;
                             break;
                         }
                    }

                    if (!draftedPlayer) draftedPlayer = availablePlayers[0];
                    
                    team.roster.push(draftedPlayer);
                    const indexToRemove = availablePlayers.findIndex(p => p.Player === draftedPlayer.Player);
                    if(indexToRemove > -1) availablePlayers.splice(indexToRemove, 1);
                }
            }
            displayDraftResults(teams[draftSettings.userDraftPos].roster);
        };
        
        const displayDraftResults = (myRoster) => {
             // ... (Existing displayDraftResults logic remains the same)
            const startersEl = document.getElementById('starters-list');
            const benchEl = document.getElementById('bench-list');
            startersEl.innerHTML = '';
            benchEl.innerHTML = '';
            const rosterNeeds = { ...draftSettings.rosterPreset };
            const starters = {};
            Object.keys(rosterNeeds).forEach(p => starters[p] = []);
            
            myRoster.sort((a, b) => b.value - a.value);
            const filledPlayers = new Set();
            
            for (const pos in rosterNeeds) {
                 for (const player of myRoster) {
                    if (filledPlayers.has(player.Player) || starters[pos].length >= rosterNeeds[pos]) continue;
                    const isFlex = ['RB', 'WR', 'TE'].includes(player.simplePosition);
                    const isSuperFlex = ['QB', 'RB', 'WR', 'TE'].includes(player.simplePosition);

                    if ((pos === 'FLEX' && isFlex) || (pos === 'SUPER_FLEX' && isSuperFlex) || (player.simplePosition === pos)) {
                         starters[pos].push(player);
                         filledPlayers.add(player.Player);
                    }
                 }
            }
            
            Object.entries(starters).forEach(([pos, players]) => {
                players.forEach(p => startersEl.innerHTML += `<div class="player-card player-pos-${p.simplePosition.toLowerCase()}"><strong>${pos.replace('_', ' ')}:</strong> ${p.Player} (${p.Team})</div>`);
            });
            myRoster.forEach(p => {
                if (!filledPlayers.has(p.Player)) benchEl.innerHTML += `<div class="player-card player-pos-${p.simplePosition.toLowerCase()}">${p.Player} (${p.Team})</div>`;
            });

            UI.showLoading('draft-loading-spinner', false);
            document.getElementById('draft-results-wrapper').classList.remove('hidden');
        };

        // --- LINEUP BUILDER ---
        const setupLineupBuilder = () => {
            if (!document.getElementById('lineup-builder')) return;
            const searchInput = document.getElementById('lineup-player-search');
            const autocompleteEl = document.getElementById('lineup-player-autocomplete');
            const presetSelect = document.getElementById('lineupPreset');
            
            presetSelect.innerHTML = Object.keys(config.lineupPresets).map(p => `<option value="${p}">${p}</option>`).join('');

            searchInput.addEventListener('input', () => {
                const query = searchInput.value.toLowerCase();
                if (query.length < 2) {
                    autocompleteEl.classList.add('hidden');
                    return;
                }
                const filtered = allPlayers.filter(p => p.Player.toLowerCase().includes(query)).slice(0, 5);
                autocompleteEl.innerHTML = filtered.map(p => `<li data-player='${JSON.stringify(p)}'>${p.Player} (${p.Team} - ${p.POS})</li>`).join('');
                autocompleteEl.classList.remove('hidden');
            });
            
            autocompleteEl.addEventListener('click', (e) => {
                if(e.target.tagName === 'LI'){
                    const playerData = JSON.parse(e.target.dataset.player);
                    if(!lineupRoster.find(p => p.Player === playerData.Player)){
                        lineupRoster.push(playerData);
                        renderLineupRoster();
                    }
                    searchInput.value = '';
                    autocompleteEl.classList.add('hidden');
                }
            });
            
            document.getElementById('lineup-roster').addEventListener('click', (e) => {
                if(e.target.classList.contains('remove-btn')){
                    const playerName = e.target.dataset.player;
                    lineupRoster = lineupRoster.filter(p => p.Player !== playerName);
                    renderLineupRoster();
                }
            });

            document.getElementById('generateLineupButton').addEventListener('click', generateOptimalLineup);
        };
        
        const renderLineupRoster = () => {
            const rosterEl = document.getElementById('lineup-roster');
            if(lineupRoster.length === 0){
                 rosterEl.innerHTML = `<span class="text-gray-500 italic">Your added players will appear here...</span>`;
                 return;
            }
            rosterEl.innerHTML = lineupRoster.map(p => `
                <div class="trade-player items-center">
                    <span>${p.Player} (${p.POS})</span>
                    <button class="remove-btn" data-player="${p.Player}">×</button>
                </div>
            `).join('');
        };
        
        const generateOptimalLineup = () => {
             const presetKey = document.getElementById('lineupPreset').value;
             const rosterNeeds = { ...config.lineupPresets[presetKey] };
             const resultsWrapper = document.getElementById('lineup-results-wrapper');
             const startersEl = document.getElementById('optimized-starters-list');
             
             if(lineupRoster.length === 0) {
                 startersEl.innerHTML = `<p class="text-red-400 text-center">Please add players to your roster first.</p>`;
                 resultsWrapper.classList.remove('hidden');
                 return;
             }
             
             let availableForLineup = [...lineupRoster].sort((a,b) => b.value - a.value);
             const starters = {};
             Object.keys(rosterNeeds).forEach(p => starters[p] = []);
             const filledPlayers = new Set();
             
             for(const pos in rosterNeeds){
                 for(const player of availableForLineup){
                    if (filledPlayers.has(player.Player) || starters[pos].length >= rosterNeeds[pos]) continue;
                     
                    const isFlex = ['RB', 'WR', 'TE'].includes(player.simplePosition);
                    const isSuperFlex = ['QB', 'RB', 'WR', 'TE'].includes(player.simplePosition);
                     
                    if ((pos === 'FLEX' && isFlex) || (pos === 'SUPER_FLEX' && isSuperFlex) || (player.simplePosition === pos)) {
                         starters[pos].push(player);
                         filledPlayers.add(player.Player);
                    }
                 }
             }
             
             startersEl.innerHTML = '';
             Object.entries(starters).forEach(([pos, players]) => {
                 players.forEach(p => {
                      startersEl.innerHTML += `<div class="player-card player-pos-${p.simplePosition.toLowerCase()}"><strong>${pos.replace('_', ' ')}:</strong> ${p.Player} (${p.Team}) - Val: ${p.value.toFixed(1)}</div>`;
                 });
             });
             
             resultsWrapper.classList.remove('hidden');
        };

        return { init };
    })();

    // --- EXPERT TOOLS MODULE (Trade Analyzer) ---
    const ExpertTools = (() => {
        let tradeTeam1 = [], tradeTeam2 = [], allPlayers = [];

        const init = async () => {
            if (!document.getElementById('trade-analyzer')) return;
            allPlayers = await Data.getAdp('ppr');
            setupTradeAnalyzer();
        };

        const setupTradeAnalyzer = () => {
            const setupSide = (inputId, listId, team) => {
                const input = document.getElementById(inputId), list = document.getElementById(listId);
                input.addEventListener('input', () => {
                    const q = input.value.toLowerCase();
                    if (q.length < 2) { list.classList.add('hidden'); return; }
                    list.innerHTML = allPlayers.filter(p => p.Player.toLowerCase().includes(q)).slice(0,5).map(p => `<li data-player='${JSON.stringify(p)}'>${p.Player}</li>`).join('');
                    list.classList.remove('hidden');
                });
                list.addEventListener('click', e => {
                    if (e.target.tagName !== 'LI') return;
                    team.push(JSON.parse(e.target.dataset.player));
                    input.value = ''; list.classList.add('hidden');
                    renderTrade();
                });
            };
            const renderTrade = () => {
                document.getElementById('team1-players').innerHTML = tradeTeam1.map((p,i) => `<div class="trade-player" data-idx="${i}" data-team="1">${p.Player}<button class="remove-btn" data-player="${p.Player}">×</button></div>`).join('');
                document.getElementById('team2-players').innerHTML = tradeTeam2.map((p,i) => `<div class="trade-player" data-idx="${i}" data-team="2">${p.Player}<button class="remove-btn" data-player="${p.Player}">×</button></div>`).join('');
            };
            document.getElementById('trade-analyzer').addEventListener('click', e => {
                if (!e.target.classList.contains('remove-btn')) return;
                const playerName = e.target.dataset.player;
                tradeTeam1 = tradeTeam1.filter(p => p.Player !== playerName);
                tradeTeam2 = tradeTeam2.filter(p => p.Player !== playerName);
                renderTrade();
            });
            document.getElementById('analyzeTradeBtn').addEventListener('click', () => {
                const v1 = tradeTeam1.reduce((s,p)=>s+p.value,0), v2 = tradeTeam2.reduce((s,p)=>s+p.value,0);
                const verdict = document.getElementById('trade-verdict');
                const diff = Math.abs(v1-v2);
                const totalValue = v1 + v2;
                document.getElementById('trade-results').classList.remove('hidden');
                
                if(diff / totalValue < 0.1) verdict.textContent = 'This trade is fair.'; // Fair if within 10%
                else verdict.textContent = v1 > v2 ? 'The side receiving your assets wins.' : 'The side receiving their assets wins.';
            });
            setupSide('player1-search', 'player1-autocomplete', tradeTeam1);
            setupSide('player2-search', 'player2-autocomplete', tradeTeam2);
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
