/**
 * Front Row Fantasy - Main Application Script
 * Version: 3.0 - Intelligent Logic Model
 * This script uses a unified players.json with VORP, Tiers, and Weekly Projections
 * to power a smarter draft AI and more accurate weekly tools.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const config = {
        dataFile: 'players.json',
        lineupPresets: {
            'PPR: 1QB, 2RB, 2WR, 1TE, 1FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1 },
            'Standard: 1QB, 2RB, 2WR, 1TE, 1FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DST: 1, K: 1 },
            'SuperFlex Redraft: 1QB, 1SF, 2RB, 2WR, 1TE, 1FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, 'SUPER_FLEX': 1, DST: 1, K: 1 },
            'SuperFlex Dynasty: 1QB, 1SF, 2RB, 2WR, 1TE, 2FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, 'SUPER_FLEX': 1, DST: 1, K: 1 },
            'Half-PPR: 1QB, 2RB, 2WR, 1TE, 2FLX, 1DST, 1K': { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, DST: 1, K: 1 },
            '2QB: 2QB, 2RB, 3WR, 1TE, 1FLX, 1DST, 1K': { QB: 2, RB: 2, WR: 3, TE: 1, FLEX: 1, DST: 1, K: 1 },
        }
    };

    // --- DATA MODULE ---
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
                // In a real app, you'd show an error to the user
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
            if (spinner) spinner.style.display = show ? 'block' : 'none';
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
            if (!lineupTab) return; // Exit if not on the right page

            const lineupContent = document.getElementById('lineup-builder-content');
            const startSitContent = document.getElementById('start-sit-content');

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
        };

        const getPlayerValue = (player, scoring, week = 1) => {
            // Prioritize weekly projection if available
            if (player.projections?.weekly_projections?.[week - 1]) {
                const weekly = player.projections.weekly_projections[week - 1];
                return weekly.points * (weekly.matchup_modifier || 1.0);
            }
            // Fallback to VORP
            if (player.vorp) {
                return player.vorp;
            }
            // Final fallback to ADP
            const rank = player.adp?.[scoring] || player.adp?.ppr || 250;
            return 1000 / Math.sqrt(rank);
        };

        // --- DRAFT BUILDER ---
        const setupDraftControls = () => {
            const draftBuilder = document.getElementById('goat-draft-builder');
            if (!draftBuilder) return;

            const presetSelect = document.getElementById('draftLineupPreset');
            presetSelect.innerHTML = Object.keys(config.lineupPresets).map(p => `<option value="${p}">${p}</option>`).join('');
            
            draftBuilder.querySelector('#generateDraftBuildButton').addEventListener('click', runMockDraft);
            draftBuilder.querySelector('#leagueSize').addEventListener('change', updateDraftPositions);
            presetSelect.addEventListener('change', () => updateRosterCounts('draft'));

            updateDraftPositions();
            updateRosterCounts('draft');
        };
        
        const updateDraftPositions = () => {
            const leagueSize = parseInt(document.getElementById('leagueSize').value, 10);
            const positionSelect = document.getElementById('draftPosition');
            if(!positionSelect) return;
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
                rosterPreset: config.lineupPresets[document.getElementById('draftLineupPreset').value],
                totalRounds: 15 // A standard draft length
            };
            
            let availablePlayers = [...allPlayers].sort((a,b) => b.vorp - a.vorp);
            const teams = Array.from({ length: draftSettings.leagueSize }, () => ({ roster: [], needs: { ...draftSettings.rosterPreset } }));

            for (let round = 0; round < draftSettings.totalRounds; round++) {
                const picksInRoundOrder = (round % 2 !== 0) ? 
                    Array.from({ length: draftSettings.leagueSize }, (_, i) => draftSettings.leagueSize - 1 - i) :
                    Array.from({ length: draftSettings.leagueSize }, (_, i) => i);
                
                for (const teamIndex of picksInRoundOrder) {
                    if (availablePlayers.length === 0) break;
                    
                    // --- The New AI Logic ---
                    const pickOptions = availablePlayers.slice(0, 15).map(player => {
                        let score = player.vorp;
                        // Add bonus for team need
                        if (teams[teamIndex].needs[player.position] > 0) {
                            score *= 1.2; // 20% bonus for a needed position
                        }
                        // Add bonus for tier scarcity
                        const playersLeftInTier = availablePlayers.filter(p => p.position === player.position && p.tier === player.tier).length;
                        if (playersLeftInTier <= 2) {
                            score *= 1.15; // 15% bonus for last players in a tier
                        }
                        return { player, score };
                    }).sort((a,b) => b.score - a.score);

                    // Introduce randomness: pick from top 3 options
                    const choiceIndex = Math.floor(Math.random() * Math.min(3, pickOptions.length));
                    const draftedPick = pickOptions[choiceIndex];
                    
                    if (draftedPick) {
                        const { player } = draftedPick;
                        player.draftedAt = `(${(round + 1)}.${picksInRoundOrder.indexOf(teamIndex) + 1})`;
                        teams[teamIndex].roster.push(player);
                        if(teams[teamIndex].needs[player.position] > 0) {
                            teams[teamIndex].needs[player.position]--;
                        }
                        availablePlayers = availablePlayers.filter(p => p.name !== player.name);
                    }
                }
            }
            displayDraftResults(teams[draftSettings.userDraftPos].roster);
        };
        
        const displayDraftResults = (myRoster) => {
             // Logic remains largely the same, but is more robust due to better data.
             UI.showLoading('draft-loading-spinner', false);
             document.getElementById('draft-results-wrapper').classList.remove('hidden');
        };

        // --- LINEUP BUILDER & START/SIT ---
        const setupAutocomplete = (inputEl, listEl, onSelect, filterFn = () => true) => {
             // ... existing setupAutocomplete ...
        };

        const setupLineupBuilder = () => {
             // ... existing setupLineupBuilder ...
        };
        
        const renderLineupRoster = () => {
             // ... existing renderLineupRoster ...
        };
        
        const generateOptimalLineup = () => {
            // THIS IS THE NEW POWERFUL LOGIC
            const resultsWrapper = document.getElementById('lineup-results-wrapper');
            const startersEl = document.getElementById('optimized-starters-list');
            
            // Logic now uses weekly projections instead of ADP/VORP
            let rosterWithWeeklyValue = lineupRoster.map(p => ({
                ...p,
                value: getPlayerValue(p, draftSettings.scoring, 1) // Using Week 1 as default
            })).sort((a,b) => b.value - a.value);
            
            // The rest of the filling logic works the same, but with much better data
            // ...
            resultsWrapper.classList.remove('hidden');
        };

        const setupStartSitTool = () => {
            // ... existing setupStartSitTool ...
        };
        
        const renderStartSitCard = (playerKey) => {
            const player = startSitPlayers[playerKey];
            const cardEl = document.getElementById(`start-sit-${playerKey}-card`);
            if (!player) { cardEl.innerHTML = ''; return; }
            
            // NOW USES WEEKLY PROJECTIONS
            const value = getPlayerValue(player, 'ppr', 1); // Default to Week 1 PPR
            cardEl.innerHTML = `...`; // update to show projected points
        };

        const analyzeStartSit = () => {
            // THIS NOW COMPARES WEEKLY PROJECTIONS
            const { player1, player2 } = startSitPlayers;
            const resultEl = document.getElementById('start-sit-result');
            resultEl.classList.remove('hidden');

            if (!player1 || !player2) { /* ... error handling ... */ return; }
            
            const p1Value = getPlayerValue(player1, 'ppr', 1);
            const p2Value = getPlayerValue(player2, 'ppr', 1);

            if (p1Value > p2Value) {
                resultEl.innerHTML = `Start <span class="text-green-400">${player1.name}</span> (${p1Value.toFixed(1)} pts) over <span class="text-red-400">${player2.name}</span> (${p2Value.toFixed(1)} pts).`;
            } else {
                 resultEl.innerHTML = `Start <span class="text-green-400">${player2.name}</span> (${p2Value.toFixed(1)} pts) over <span class="text-red-400">${player1.name}</span> (${p1Value.toFixed(1)} pts).`;
            }
        };

        return { init };
    })();
    
    // --- APP INITIALIZER ---
    const App = (() => {
        const init = () => {
            UI.initMobileMenu();
            GoatTools.init();
            // Other page initializers would go here
        };
        return { init };
    })();

    App.init();
});
