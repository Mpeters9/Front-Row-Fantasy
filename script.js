document.addEventListener('DOMContentLoaded', () => {
    // Fantasy Points Ticker
    const tickerContent = document.getElementById('tickerContent');
    const pauseButton = document.getElementById('pauseButton');

    function populateTicker() {
        const mockData = loadFileData("FantasyPros_2025_Overall_ADP_Rankings.csv").split('\n').slice(1).map(line => {
            const [rank, name, team, bye, pos, avg] = line.split(',').map(s => s.trim());
            return { position: pos.replace(/\d+/g, ''), name, team, points: (401 - parseFloat(avg)) / 10 }; // Inverse ADP to simulate points
        }).sort((a, b) => {
            const positionOrder = { "Quarterback": 1, "Running Back": 2, "Wide Receiver": 3, "Tight End": 4, "Kicker": 5 };
            if (positionOrder[a.position] !== positionOrder[b.position]) {
                return positionOrder[a.position] - positionOrder[b.position];
            }
            return b.points - a.points;
        }).slice(0, 23); // Limit to top 23 for ticker

        let content = '';
        let currentPosition = null;
        mockData.forEach((player, index) => {
            if (player.position !== currentPosition) {
                if (currentPosition !== null) content += ' | ';
                content += `<b>${player.position}:</b> `;
                currentPosition = player.position;
            } else {
                content += ' | ';
            }
            content += `${player.name} (${player.team}) - ${player.points.toFixed(1)} pts`;
        });

        tickerContent.innerHTML = content + ' | ' + content; // Duplicate for seamless loop
        tickerContent.classList.remove('loading');
    }

    pauseButton.addEventListener('click', () => {
        const isPaused = tickerContent.classList.toggle('paused');
        pauseButton.textContent = isPaused ? 'Play' : 'Pause';
    });

    setInterval(populateTicker, 30000);
    populateTicker();

    // Trade Analyzer (only on tools.html)
    if (document.getElementById('trade-analyzer')) {
        const team1Selects = ['team1-1', 'team1-2', 'team1-3', 'team1-4'].map(id => document.getElementById(id));
        const team2Selects = ['team2-1', 'team2-2', 'team2-3', 'team2-4'].map(id => document.getElementById(id));
        const analyzeTradeBtn = document.getElementById('analyzeTradeBtn');
        const tradeResult = document.getElementById('tradeResult');
        const recentTrades = document.getElementById('recentTrades');
        const leagueTypeSelect = document.getElementById('leagueType');
        const rosterTypeSelect = document.getElementById('rosterType');
        const platformSelect = document.getElementById('platform');
        const leagueIdInput = document.getElementById('leagueId');
        const syncLeagueBtn = document.getElementById('syncLeague');
        const player1Input = document.getElementById('player1');
        const player2Input = document.getElementById('player2');
        const addPlayer1Btn = document.getElementById('add-player1');
        const addPlayer2Btn = document.getElementById('add-player2');
        const player1Selections = document.getElementById('player1-selections');
        const player2Selections = document.getElementById('player2-selections');
        const tradeTableBody = document.getElementById('trade-table-body');
        const tradeFairness = document.getElementById('trade-fairness');
        const clearAllBtn = document.getElementById('clearAllBtn');

        let allPlayers = loadFileData("FantasyPros_2025_Overall_ADP_Rankings.csv").split('\n').slice(1).map(line => {
            const [rank, name, team, bye, pos, avg] = line.split(',').map(s => s.trim());
            return { id: rank, name, position: pos.replace(/\d+/g, ''), team, adp: parseFloat(avg), projectedPoints: (401 - parseFloat(avg)) * 0.75, recentPoints: (401 - parseFloat(avg)) / 10, confidence: 70 + (30 * (1 - parseFloat(avg) / 400)), injuryImpact: 1.0 };
        });

        let team1Players = [];
        let team2Players = [];

        function setupAutocomplete(input, selectionsDiv, teamPlayers, maxPlayers = 4) {
            const debouncedFilter = debounce((value, dropdownId) => filterPlayers(value, dropdownId, input, selectionsDiv, teamPlayers, maxPlayers), 300);
            const dropdownId = `dropdown-${input.id}`;
            let dropdownList = document.getElementById(dropdownId);
            if (!dropdownList) {
                dropdownList = document.createElement('ul');
                dropdownList.id = dropdownId;
                dropdownList.className = 'autocomplete-dropdown';
                input.parentNode.appendChild(dropdownList);
            }

            input.addEventListener('input', () => {
                if (teamPlayers.length < maxPlayers && input.value) {
                    dropdownList.classList.add('loading');
                    filterPlayers(input.value, dropdownId, input, selectionsDiv, teamPlayers, maxPlayers);
                    debouncedFilter(input.value, dropdownId);
                } else if (!input.value) {
                    dropdownList.style.display = 'none';
                }
            });
            input.addEventListener('focus', () => {
                if (input.value && teamPlayers.length < maxPlayers) {
                    dropdownList.classList.add('loading');
                    filterPlayers(input.value, dropdownId, input, selectionsDiv, teamPlayers, maxPlayers);
                }
            });
            input.addEventListener('blur', () => {
                setTimeout(() => {
                    dropdownList.style.display = 'none';
                }, 200);
            });
            input.addEventListener('click', () => {
                if (input.value && teamPlayers.length < maxPlayers) {
                    dropdownList.classList.add('loading');
                    filterPlayers(input.value, dropdownId, input, selectionsDiv, teamPlayers, maxPlayers);
                }
            });
            dropdownList.addEventListener('click', (e) => {
                const li = e.target.closest('li');
                if (li && teamPlayers.length < maxPlayers) {
                    const playerId = li.dataset.id;
                    const player = allPlayers.find(p => p.id === playerId);
                    if (player) {
                        teamPlayers.push(player);
                        updateSelections(selectionsDiv, teamPlayers);
                        input.value = '';
                        dropdownList.style.display = 'none';
                        updateTradeComparison();
                        analyzeTrade(analyzeTradeBtn);
                    }
                }
            });
        }

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        function filterPlayers(searchTerm, dropdownId, input, selectionsDiv, teamPlayers, maxPlayers) {
            const dropdownList = document.getElementById(dropdownId);
            if (!searchTerm || teamPlayers.length >= maxPlayers) {
                dropdownList.style.display = 'none';
                dropdownList.classList.remove('loading');
                return;
            }

            const allSelectedPlayers = [...team1Players, ...team2Players];
            const filteredPlayers = allPlayers.filter(player =>
                !allSelectedPlayers.some(p => p.id === player.id) && player.name.toLowerCase().includes(searchTerm.toLowerCase())
            ).sort((a, b) => {
                const aRelevance = a.name.toLowerCase().indexOf(searchTerm.toLowerCase());
                const bRelevance = b.name.toLowerCase().indexOf(searchTerm.toLowerCase());
                return aRelevance - bRelevance || a.confidence - b.confidence;
            });

            let options = '';
            filteredPlayers.forEach(player => {
                options += `<li class="p-2 flex items-center hover:bg-teal-600 cursor-pointer transition-all duration-200" data-id="${player.id}">
                    <span class="w-8 h-8 bg-gray-500 rounded-full mr-2"></span>
                    <div>
                        <div class="font-bold">${player.name} (${player.position})</div>
                        <div class="text-sm text-gray-300">Proj: ${player.projectedPoints.toFixed(1)}, ADP: ${player.adp.toFixed(1)}, Recent: ${player.recentPoints.toFixed(1)}, Fit: ${player.confidence.toFixed(1)}%</div>
                    </div>
                </li>`;
            });

            dropdownList.innerHTML = options || '<li class="p-2 text-gray-400">No players available</li>';
            dropdownList.style.display = 'block';
            dropdownList.classList.remove('loading');
            const wrapperRect = input.closest('.input-wrapper').getBoundingClientRect();
            const tradeAnalyzerRect = document.getElementById('trade-analyzer').getBoundingClientRect();
            dropdownList.style.top = `${wrapperRect.bottom - tradeAnalyzerRect.top + 5}px`;
            dropdownList.style.left = `${wrapperRect.left - tradeAnalyzerRect.left}px`;
            dropdownList.style.width = `${wrapperRect.width}px`;
        }

        function updateSelections(selectionsDiv, teamPlayers) {
            selectionsDiv.innerHTML = teamPlayers.map(player => `
                <div class="flex items-center justify-between bg-teal-700 p-2 rounded mt-2">
                    <span>${player.name} (${player.position})</span>
                    <button class="remove-player text-red-300 hover:text-red-100" data-id="${player.id}">×</button>
                </div>
            `).join('');
            document.querySelectorAll('.remove-player').forEach(btn => {
                btn.addEventListener('click', () => {
                    const playerId = btn.dataset.id;
                    if (selectionsDiv === player1Selections) {
                        team1Players = team1Players.filter(p => p.id !== playerId);
                    } else if (selectionsDiv === player2Selections) {
                        team2Players = team2Players.filter(p => p.id !== playerId);
                    }
                    updateSelections(selectionsDiv, selectionsDiv === player1Selections ? team1Players : team2Players);
                    updateTradeComparison();
                    analyzeTrade(analyzeTradeBtn);
                    if (selectionsDiv === player1Selections) {
                        filterPlayers(player1Input.value, `dropdown-${player1Input.id}`, player1Input, player1Selections, team1Players);
                    } else {
                        filterPlayers(player2Input.value, `dropdown-${player2Input.id}`, player2Input, player2Selections, team2Players);
                    }
                });
            });
        }

        function updateTradeComparison() {
            const allPlayersInTrade = [...team1Players, ...team2Players];
            tradeTableBody.innerHTML = '';
            if (allPlayersInTrade.length === 0) {
                tradeTableBody.innerHTML = '<tr><td colspan="4" class="p-2 text-center">No players in trade</td></tr>';
            } else {
                allPlayersInTrade.forEach(player => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="p-2">${player.name}</td>
                        <td class="p-2">${player.position}</td>
                        <td class="p-2">${player.projectedPoints.toFixed(1)}</td>
                        <td class="p-2">${(100 / player.adp).toFixed(1)}</td>
                    `;
                    tradeTableBody.appendChild(row);
                });
            }
        }

        function getTradeFairness() {
            const team1Value = team1Players.reduce((sum, player) => sum + (100 / player.adp), 0);
            const team2Value = team2Players.reduce((sum, player) => sum + (100 / player.adp), 0);
            const diff = Math.abs(team1Value - team2Value);
            const totalValue = team1Value + team2Value;

            if (totalValue === 0) return { color: 'gray', text: 'N/A' };
            const fairness = diff / totalValue * 100;
            if (fairness < 10) return { color: 'green', text: 'Fair' };
            if (fairness < 20) return { color: 'yellow', text: 'Slight Imbalance' };
            return { color: 'red', text: 'Unfair' };
        }

        function analyzeTrade(button) {
            updateTradeComparison();
            const fairness = getTradeFairness();
            tradeFairness.innerHTML = `<span class="trade-fairness-${fairness.color}">${fairness.text}</span>`;

            if (team1Players.length > 0 && team2Players.length > 0) {
                const team1Names = team1Players.map(p => p.name).join(', ');
                const team2Names = team2Players.map(p => p.name).join(', ');
                const value1 = team1Players.reduce((sum, p) => sum + (100 / p.adp), 0);
                const value2 = team2Players.reduce((sum, p) => sum + (100 / p.adp), 0);
                if (value1 > value2) {
                    tradeResult.textContent = `${team1Names} is valued higher (${value1.toFixed(1)} vs ${value2.toFixed(1)}). Consider if you need ${team2Names}'s positions or potential.`;
                } else if (value2 > value1) {
                    tradeResult.textContent = `${team2Names} is valued higher (${value2.toFixed(1)} vs ${value1.toFixed(1)}). Consider if you need ${team1Names}'s positions or potential.`;
                } else {
                    tradeResult.textContent = 'The trade is balanced in value. Evaluate based on team needs.';
                }
            } else {
                tradeResult.textContent = 'Please select at least one player for each team.';
            }
        }

        function getPlayerValue(playerId, leagueType, rosterType) {
            const player = allPlayers.find(p => p.id === playerId);
            if (!player) return 0;
            let baseValue = player.adp ? 100 / player.adp : 10;
            let positionModifier = 1;
            if (rosterType === 'superflex' && player.position === 'Quarterback') positionModifier = 1.3;
            return Math.round(baseValue * positionModifier);
        }

        syncLeagueBtn.addEventListener('click', async () => {
            const leagueId = leagueIdInput.value;
            const platform = platformSelect.value;
            if (platform === 'sleeper' && leagueId) {
                tradeResult.textContent = 'Syncing league...';
                setupAutocomplete(player1Input, player1Selections, team1Players);
                setupAutocomplete(player2Input, player2Selections, team2Players);
                tradeResult.textContent = 'League synced successfully.';
            } else if (platform !== 'sleeper') {
                tradeResult.textContent = 'Only Sleeper platform is supported at this time.';
            } else {
                tradeResult.textContent = 'Please enter a valid League ID.';
            }
        });

        addPlayer1Btn.addEventListener('click', () => {
            if (team1Players.length < 4) {
                player1Input.value = '';
                setupAutocomplete(player1Input, player1Selections, team1Players);
            }
        });

        addPlayer2Btn.addEventListener('click', () => {
            if (team2Players.length < 4) {
                player2Input.value = '';
                setupAutocomplete(player2Input, player2Selections, team2Players);
            }
        });

        analyzeTradeBtn.addEventListener('click', () => analyzeTrade(analyzeTradeBtn));
        leagueTypeSelect.addEventListener('change', () => analyzeTrade(analyzeTradeBtn));
        rosterTypeSelect.addEventListener('change', () => analyzeTrade(analyzeTradeBtn));

        clearAllBtn.addEventListener('click', () => {
            team1Players = [];
            team2Players = [];
            updateSelections(player1Selections, team1Players);
            updateSelections(player2Selections, team2Players);
            updateTradeComparison();
            tradeFairness.innerHTML = '';
            tradeResult.textContent = 'Trade cleared. Add new players to analyze.';
            filterPlayers(player1Input.value, `dropdown-${player1Input.id}`, player1Input, player1Selections, team1Players);
            filterPlayers(player2Input.value, `dropdown-${player2Input.id}`, player2Input, player2Selections, team2Players);
        });

        setupAutocomplete(player1Input, player1Selections, team1Players);
        setupAutocomplete(player2Input, player2Selections, team2Players);
    }

    // Matchup Predictor (only on tools.html)
    if (document.getElementById('matchup-predictor')) {
        const matchupTeam1Select = document.getElementById('matchupTeam1Select');
        const matchupTeam2Select = document.getElementById('matchupTeam2Select');
        const predictMatchupBtn = document.getElementById('predictMatchupBtn');
        const predictionResult = document.getElementById('predictionResult');

        // Mock roster data for fantasy teams (to be replaced with actual API data)
        let rosters = {
            '1': ['1', '4', '7', '18', '25'], // Fantasy Team 1
            '2': ['2', '5', '8', '19', '26'], // Fantasy Team 2
            '3': ['3', '6', '9', '20', '27']  // Fantasy Team 3
        };

        let allPlayers = loadFileData("FantasyPros_2025_Overall_ADP_Rankings.csv").split('\n').slice(1).map(line => {
            const [rank, name, team, bye, pos, avg] = line.split(',').map(s => s.trim());
            return { id: rank, name, position: pos.replace(/\d+/g, ''), team, adp: parseFloat(avg), projectedPoints: (401 - parseFloat(avg)) * 0.75, recentPoints: (401 - parseFloat(avg)) / 10, confidence: 70 + (30 * (1 - parseFloat(avg) / 400)), injuryImpact: 1.0 };
        });

        function getTeamAdjustedPoints(teamIds) {
            return teamIds.reduce((sum, playerId) => {
                const player = allPlayers.find(p => p.id === playerId);
                if (player) {
                    const matchupDifficulty = 0.9 + Math.random() * 0.2; // Simulated difficulty for fantasy matchup
                    const recentWeight = player.recentPoints * 0.2;
                    const adjustedPoints = (player.projectedPoints * 0.8 + recentWeight) * player.injuryImpact * matchupDifficulty;
                    return sum + adjustedPoints;
                }
                return sum;
            }, 0);
        }

        async function fetchMatchupTeams() {
            try {
                const response = await fetch('https://api.sleeper.app/v1/league/1180205990138392576/rosters');
                if (!response.ok) throw new Error('Matchup teams API request failed');
                const data = await response.json();
                if (data && data.length) {
                    rosters = {};
                    data.forEach(team => {
                        rosters[team.roster_id] = team.players || []; // Map player IDs from API for fantasy teams
                    });
                    matchupTeam1Select.innerHTML = '<option value="">Select Fantasy Team 1</option>' + data.map(team => `<option value="${team.roster_id}">${team.owner_id}</option>`).join('');
                    matchupTeam2Select.innerHTML = '<option value="">Select Fantasy Team 2</option>' + data.map(team => `<option value="${team.roster_id}">${team.owner_id}</option>`).join('');
                } else {
                    matchupTeam1Select.innerHTML = '<option value="">Select Fantasy Team 1</option><option value="1">Team 1</option><option value="2">Team 2</option><option value="3">Team 3</option>';
                    matchupTeam2Select.innerHTML = '<option value="">Select Fantasy Team 2</option><option value="1">Team 1</option><option value="2">Team 2</option><option value="3">Team 3</option>';
                }
            } catch (error) {
                console.error('Error fetching matchup teams:', error);
                matchupTeam1Select.innerHTML = '<option value="">Select Fantasy Team 1</option><option value="1">Team 1</option><option value="2">Team 2</option><option value="3">Team 3</option>';
                matchupTeam2Select.innerHTML = '<option value="">Select Fantasy Team 2</option><option value="1">Team 1</option><option value="2">Team 2</option><option value="3">Team 3</option>';
            }
        }

        function predictMatchup(team1Id, team2Id) {
            const team1Points = getTeamAdjustedPoints(rosters[team1Id] || []);
            const team2Points = getTeamAdjustedPoints(rosters[team2Id] || []);
            const totalPoints = team1Points + team2Points;
            let confidence;

            if (totalPoints === 0) {
                return { winner: 'N/A', confidence: 0 };
            } else if (team1Points > team2Points) {
                confidence = Math.min(95, 50 + ((team1Points - team2Points) / totalPoints) * 50);
                return { winner: 'Fantasy Team 1', confidence };
            } else if (team2Points > team1Points) {
                confidence = Math.min(95, 50 + ((team2Points - team1Points) / totalPoints) * 50);
                return { winner: 'Fantasy Team 2', confidence };
            } else {
                return { winner: 'Tie', confidence: 50 };
            }
        }

        predictMatchupBtn.addEventListener('click', async () => {
            const team1 = matchupTeam1Select.value;
            const team2 = matchupTeam2Select.value;
            if (team1 && team2 && team1 !== team2) {
                const prediction = predictMatchup(team1, team2);
                predictionResult.textContent = `${prediction.winner} is predicted to win with a ${prediction.confidence.toFixed(1)}% confidence based on projected points, recent performance, and injury impact for fantasy team matchups.`;
            } else {
                predictionResult.textContent = 'Please select two different fantasy teams.';
            }
        });

        fetchMatchupTeams();
    }

    // Navigation Highlighting
    function setActiveNav() {
        const currentHash = window.location.hash || (window.location.pathname.includes('tools') ? '#tools' : '#home');
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentHash || (currentHash === '#tools' && link.getAttribute('href') === 'tools.html')) {
                link.classList.add('active');
            }
        });
    }

    setActiveNav();
    window.addEventListener('hashchange', setActiveNav);
});
