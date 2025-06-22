document.addEventListener('DOMContentLoaded', () => {
    // Best Draft Builds and Best Lineup Builds Functionality
    const leagueSizeSelect = document.getElementById('leagueSize');
    const startingLineupSelect = document.getElementById('startingLineup');
    const benchSizeSelect = document.getElementById('benchSize');
    const scoringTypeSelect = document.getElementById('scoringType');
    const bonusTDCheckbox = document.getElementById('bonusTD');
    const penaltyFumbleCheckbox = document.getElementById('penaltyFumble');
    const positionFocusSelect = document.getElementById('positionFocus');
    const draftPickInput = document.getElementById('draftPick');
    const draftPickValue = document.getElementById('draftPickValue');
    const generateDraftButton = document.getElementById('generateLineup');
    const saveDraftButton = document.getElementById('saveLineup');
    const compareDraftButton = document.getElementById('compareLineups');
    const progressBarDraft = document.getElementById('progressBar');
    const progressDraft = document.getElementById('progress');
    const buildResultDraft = document.getElementById('build-result');

    // Lineup Builds Elements
    const lineupSizeInput = document.getElementById('lineupSize');
    const lineupStartingSelect = document.getElementById('lineupStarting');
    const lineupBenchSizeSelect = document.getElementById('lineupBenchSize');
    const lineupIrSpotsSelect = document.getElementById('lineupIrSpots');
    const lineupScoringSelect = document.getElementById('lineupScoring');
    const lineupBonusTDCheckbox = document.getElementById('lineupBonusTD');
    const lineupPenaltyFumbleCheckbox = document.getElementById('lineupPenaltyFumble');
    const currentRosterInput = document.getElementById('currentRoster');
    const swapPlayersButton = document.getElementById('swapPlayers');
    const generateLineupWeeklyButton = document.getElementById('generateLineupWeekly');
    const saveLineupWeeklyButton = document.getElementById('saveLineupWeekly');
    const compareLineupsWeeklyButton = document.getElementById('compareLineupsWeekly');
    const progressBarWeekly = document.getElementById('progressBarWeekly');
    const progressWeekly = document.getElementById('progressWeekly');
    const lineupResult = document.getElementById('lineup-result');

    // Update draft pick slider max based on league size
    if (leagueSizeSelect) {
        leagueSizeSelect.addEventListener('change', () => {
            if (draftPickInput && draftPickValue) {
                draftPickInput.max = leagueSizeSelect.value;
                if (parseInt(draftPickInput.value) > parseInt(leagueSizeSelect.value)) {
                    draftPickInput.value = leagueSizeSelect.value;
                    draftPickValue.textContent = draftPickInput.value;
                }
            }
        });
    }

    // Sync bench size between sections
    if (benchSizeSelect && lineupBenchSizeSelect) {
        benchSizeSelect.addEventListener('change', () => {
            lineupBenchSizeSelect.value = benchSizeSelect.value;
        });
        lineupBenchSizeSelect.addEventListener('change', () => {
            benchSizeSelect.value = lineupBenchSizeSelect.value;
        });
    }

    // Updated player data with ADP from FantasyPros PPR (June 20, 2025)
    const players = [
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

    // Update draft pick value display
    if (draftPickInput && draftPickValue) {
        draftPickInput.addEventListener('input', () => {
            draftPickValue.textContent = draftPickInput.value;
        });
    }

    // Generate Optimal Draft
    if (generateDraftButton && leagueSizeSelect && startingLineupSelect && benchSizeSelect && scoringTypeSelect && bonusTDCheckbox && penaltyFumbleCheckbox && positionFocusSelect && draftPickInput && progressBarDraft && progressDraft && buildResultDraft) {
        generateDraftButton.addEventListener('click', () => {
            const leagueSize = parseInt(leagueSizeSelect.value) || 10;
            const startingLineup = startingLineupSelect.value.split(',').map(s => s.trim().toUpperCase());
            const benchSize = parseInt(benchSizeSelect.value) || 7;
            const scoringType = scoringTypeSelect.value;
            const bonusTD = bonusTDCheckbox.checked;
            const penaltyFumble = penaltyFumbleCheckbox.checked;
            const positionFocus = positionFocusSelect.value;
            const draftPick = parseInt(draftPickInput.value) || 5;

            if (leagueSize < 8 || leagueSize > 14) {
                alert('League size must be between 8 and 14.');
                return;
            }

            progressBarDraft.classList.remove('hidden');
            let width = 0;
            const interval = setInterval(() => {
                if (width >= 100) {
                    clearInterval(interval);
                    generateOptimalDraft(leagueSize, startingLineup, benchSize, scoringType, bonusTD, penaltyFumble, positionFocus, draftPick);
                    progressBarDraft.classList.add('hidden');
                } else {
                    width += 10;
                    progressDraft.style.width = `${width}%`;
                }
            }, 200);
        });
    }

    // Generate Optimal Weekly Lineup
    if (generateLineupWeeklyButton && lineupSizeInput && lineupStartingSelect && lineupBenchSizeSelect && lineupIrSpotsSelect && lineupScoringSelect && lineupBonusTDCheckbox && lineupPenaltyFumbleCheckbox && currentRosterInput && progressBarWeekly && progressWeekly && lineupResult) {
        generateLineupWeeklyButton.addEventListener('click', () => {
            const lineupSize = parseInt(lineupSizeInput.value) || 15;
            const startingLineup = lineupStartingSelect.value.split(',').map(s => s.trim().toUpperCase());
            const benchSize = parseInt(lineupBenchSizeSelect.value) || 7;
            const irSpots = parseInt(lineupIrSpotsSelect.value) || 1;
            const scoringType = lineupScoringSelect.value;
            const bonusTD = lineupBonusTDCheckbox.checked;
            const penaltyFumble = lineupPenaltyFumbleCheckbox.checked;
            const currentRoster = currentRosterInput.value.split(';').map(p => p.trim()).filter(p => p);

            progressBarWeekly.classList.remove('hidden');
            let width = 0;
            const interval = setInterval(() => {
                if (width >= 100) {
                    clearInterval(interval);
                    generateOptimalLineupWeekly(lineupSize, startingLineup, benchSize, irSpots, scoringType, bonusTD, penaltyFumble, currentRoster);
                    progressBarWeekly.classList.add('hidden');
                } else {
                    width += 10;
                    progressWeekly.style.width = `${width}%`;
                }
            }, 200);
        });
    }

    // Swap Players
    if (swapPlayersButton && currentRosterInput) {
        swapPlayersButton.addEventListener('click', () => {
            const currentRoster = currentRosterInput.value.split(';').map(p => p.trim()).filter(p => p);
            if (currentRoster.length) {
                alert('Players swapped! Review and generate lineup.');
            } else {
                alert('Enter players in the roster field first!');
            }
        });
    }

    // Save/Export Draft
    if (saveDraftButton && buildResultDraft) {
        saveDraftButton.addEventListener('click', () => {
            const result = buildResultDraft.innerHTML;
            if (result) {
                const lineupText = buildResultDraft.textContent;
                localStorage.setItem('savedDraft', lineupText);
                const blob = new Blob([lineupText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'fantasy_draft.txt';
                a.click();
                URL.revokeObjectURL(url);
                alert('Draft saved and exported!');
            } else {
                alert('Generate a draft first!');
            }
        });
    }

    // Save/Export Weekly Lineup
    if (saveLineupWeeklyButton && lineupResult) {
        saveLineupWeeklyButton.addEventListener('click', () => {
            const result = lineupResult.innerHTML;
            if (result) {
                const lineupText = lineupResult.textContent;
                localStorage.setItem('savedLineup', lineupText);
                const blob = new Blob([lineupText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'fantasy_lineup.txt';
                a.click();
                URL.revokeObjectURL(url);
                alert('Lineup saved and exported!');
            } else {
                alert('Generate a lineup first!');
            }
        });
    }

    // Compare Draft Lineups
    if (compareDraftButton && leagueSizeSelect && startingLineupSelect && benchSizeSelect && scoringTypeSelect && bonusTDCheckbox && penaltyFumbleCheckbox && positionFocusSelect && draftPickInput && progressBarDraft && progressDraft && buildResultDraft) {
        compareDraftButton.addEventListener('click', () => {
            const leagueSize = parseInt(leagueSizeSelect.value) || 10;
            const startingLineup = startingLineupSelect.value.split(',').map(s => s.trim().toUpperCase());
            const benchSize = parseInt(benchSizeSelect.value) || 7;
            const scoringType = scoringTypeSelect.value;
            const bonusTD = bonusTDCheckbox.checked;
            const penaltyFumble = penaltyFumbleCheckbox.checked;
            const positionFocus = positionFocusSelect.value;
            const draftPick = parseInt(draftPickInput.value) || 5;

            progressBarDraft.classList.remove('hidden');
            let width = 0;
            const interval = setInterval(() => {
                if (width >= 100) {
                    clearInterval(interval);
                    const lineup1 = generateOptimalDraft(leagueSize, startingLineup, benchSize, scoringType, bonusTD, penaltyFumble, positionFocus, draftPick);
                    const lineup2 = generateOptimalDraft(leagueSize, startingLineup, benchSize, scoringType, bonusTD, penaltyFumble, 'balanced', draftPick);
                    compareLineups(lineup1, lineup2, 'draft');
                    progressBarDraft.classList.add('hidden');
                } else {
                    width += 10;
                    progressDraft.style.width = `${width}%`;
                }
            }, 200);
        });
    }

    // Compare Weekly Lineups
    if (compareLineupsWeeklyButton && lineupSizeInput && lineupStartingSelect && lineupBenchSizeSelect && lineupIrSpotsSelect && lineupScoringSelect && lineupBonusTDCheckbox && lineupPenaltyFumbleCheckbox && currentRosterInput && progressBarWeekly && progressWeekly && lineupResult) {
        compareLineupsWeeklyButton.addEventListener('click', () => {
            const lineupSize = parseInt(lineupSizeInput.value) || 15;
            const startingLineup = lineupStartingSelect.value.split(',').map(s => s.trim().toUpperCase());
            const benchSize = parseInt(lineupBenchSizeSelect.value) || 7;
            const irSpots = parseInt(lineupIrSpotsSelect.value) || 1;
            const scoringType = lineupScoringSelect.value;
            const bonusTD = lineupBonusTDCheckbox.checked;
            const penaltyFumble = lineupPenaltyFumbleCheckbox.checked;
            const currentRoster = currentRosterInput.value.split(';').map(p => p.trim()).filter(p => p);

            progressBarWeekly.classList.remove('hidden');
            let width = 0;
            const interval = setInterval(() => {
                if (width >= 100) {
                    clearInterval(interval);
                    const lineup1 = generateOptimalLineupWeekly(lineupSize, startingLineup, benchSize, irSpots, scoringType, bonusTD, penaltyFumble, currentRoster);
                    const lineup2 = generateOptimalLineupWeekly(lineupSize, startingLineup, benchSize, irSpots, scoringType, bonusTD, penaltyFumble, currentRoster, true);
                    compareLineups(lineup1, lineup2, 'weekly');
                    progressBarWeekly.classList.add('hidden');
                } else {
                    width += 10;
                    progressWeekly.style.width = `${width}%`;
                }
            }, 200);
        });
    }

    function generateOptimalDraft(leagueSize, lineupConfig, benchSize, scoring, bonusTD, penaltyFumble, focus, pick) {
        let availablePlayers = [...players];
        availablePlayers.sort((a, b) => a.adp - b.adp); // Sort by ADP

        // Calculate total roster size dynamically (excluding IR spots for draft)
        const totalRosterSize = lineupConfig.length + benchSize; // Starting lineup + bench

        // Generate draft picks for the user's position using snake draft pattern
        const draftPicks = [];
        let currentPick = pick;
        for (let i = 0; i < totalRosterSize; i++) {
            const round = Math.floor(i / leagueSize) + 1;
            draftPicks.push(currentPick);
            if (i < totalRosterSize - 1) {
                currentPick = (round % 2 === 0) ? (leagueSize * 2 + 1 - currentPick) : (leagueSize * round + pick);
            }
        }

        // Adjust ADP threshold dynamically based on round
        const pickThresholds = draftPicks.map((pick, i) => pick + (leagueSize * (Math.floor(i / leagueSize) + 1)));

        // Apply scoring adjustments
        availablePlayers = availablePlayers.map(p => {
            let points = p.points;
            if (scoring === 'ppr') points += p.receptions;
            else if (scoring === 'halfppr') points += p.receptions * 0.5;
            else if (scoring === 'tep' && p.pos === 'TE') points *= 1.5;
            else if (scoring === 'tefullppr' && p.pos === 'TE') points += p.receptions * 2;
            else if (scoring === '6ptpass') points += (p.passTds * 2); // Add 2 points per passing TD (from 4 to 6)
            if (bonusTD && p.td > 0) points += 6;
            if (penaltyFumble && p.fumble > 0) points -= 2;
            return { ...p, adjustedPoints: points };
        });

        // Sort by adjusted points with focus priority
        if (focus !== 'balanced') {
            availablePlayers.sort((a, b) => (a.pos === focus ? -1 : b.pos === focus ? 1 : 0) || b.adjustedPoints - a.adjustedPoints);
        } else {
            availablePlayers.sort((a, b) => b.adjustedPoints - a.adjustedPoints);
        }

        // Parse lineup requirements
        const requirements = {};
        lineupConfig.forEach(req => {
            const [count, pos] = req.match(/(\d+)([A-Z]+)/);
            requirements[pos] = parseInt(count);
        });
        requirements['FLEX'] = requirements['FLEX'] || 0;

        // Track roster composition
        const usedPositions = {};
        for (let pos in requirements) usedPositions[pos] = 0;
        const lineup = [];
        let remainingBench = benchSize;

        // Simulate draft pick by pick
        for (let i = 0; i < totalRosterSize; i++) {
            const round = Math.floor(i / leagueSize) + 1;
            const pickNumber = draftPicks[i];
            const pickThreshold = pickThresholds[i];
            let roundPlayers = availablePlayers.filter(p => p.adp >= pickNumber && p.adp <= pickThreshold && !lineup.some(entry => entry.player === p));

            // Prioritize DST and K in the last two rounds if they are in the lineup
            if (lineupConfig.includes('1DST') && lineupConfig.includes('1K')) {
                if (round === Math.ceil(totalRosterSize / leagueSize) - 1 && usedPositions['DST'] === 0) {
                    roundPlayers = roundPlayers.filter(p => p.pos === 'DST');
                } else if (round === Math.ceil(totalRosterSize / leagueSize) && usedPositions['K'] === 0) {
                    roundPlayers = roundPlayers.filter(p => p.pos === 'K');
                } else {
                    roundPlayers = roundPlayers.filter(p => p.pos !== 'DST' && p.pos !== 'K');
                }
            } else if (lineupConfig.includes('1DST') && usedPositions['DST'] === 0 && round >= Math.ceil(totalRosterSize / leagueSize) - 1) {
                roundPlayers = roundPlayers.filter(p => p.pos === 'DST');
            } else if (lineupConfig.includes('1K') && usedPositions['K'] === 0 && round === Math.ceil(totalRosterSize / leagueSize)) {
                roundPlayers = roundPlayers.filter(p => p.pos === 'K');
            }

            let player = null;
            if (i < lineupConfig.length) {
                // Fill starting lineup
                for (let p of roundPlayers) {
                    if (usedPositions[p.pos] < requirements[p.pos] || (p.pos !== 'FLEX' && usedPositions['FLEX'] < requirements['FLEX'])) {
                        if (usedPositions[p.pos] < requirements[p.pos]) {
                            player = p;
                            usedPositions[p.pos]++;
                        } else if (usedPositions['FLEX'] < requirements['FLEX'] && ['RB', 'WR', 'TE'].includes(p.pos)) {
                            player = p;
                            usedPositions['FLEX']++;
                        }
                        break;
                    }
                }
                if (!player && roundPlayers.length > 0) {
                    player = roundPlayers[0]; // Fallback to best available
                    if (['RB', 'WR', 'TE'].includes(player.pos)) usedPositions['FLEX']++;
                    else usedPositions[player.pos]++;
                }
            } else if (remainingBench > 0 || (lineupConfig.includes('1DST') && usedPositions['DST'] === 0) || (lineupConfig.includes('1K') && usedPositions['K'] === 0)) {
                // Fill bench or remaining special positions
                for (let p of roundPlayers) {
                    if (remainingBench > 0) {
                        player = p;
                        remainingBench--;
                        break;
                    } else if (p.pos === 'DST' && usedPositions['DST'] === 0 && lineupConfig.includes('1DST')) {
                        player = p;
                        usedPositions['DST']++;
                    } else if (p.pos === 'K' && usedPositions['K'] === 0 && lineupConfig.includes('1K')) {
                        player = p;
                        usedPositions['K']++;
                    }
                }
                if (!player && roundPlayers.length > 0) {
                    player = roundPlayers[0]; // Fallback to best available for bench
                    remainingBench--;
                }
            }

            if (player) {
                lineup.push({ round, pick: pickNumber, player });
                availablePlayers = availablePlayers.filter(p => p !== player);
            } else if (availablePlayers.length > 0) {
                player = availablePlayers[0];
                lineup.push({ round, pick: pickNumber, player });
                availablePlayers = availablePlayers.filter(p => p !== player);
            }
        }

        buildResultDraft.innerHTML = `
            <h3 class="text-xl font-semibold mb-4 text-teal-700">Optimal Draft Build</h3>
            <ul class="list-disc pl-5 space-y-2">
                ${lineup.map(entry => `<li>Round ${entry.round} (Pick ${entry.pick}): ${entry.player.name} (${entry.player.pos}) - ${entry.player.adjustedPoints.toFixed(1)} pts (ADP: ${entry.player.adp})</li>`).join('')}
            </ul>
            <p class="mt-2 text-gray-600">Total Projected Points: ${lineup.reduce((sum, entry) => sum + entry.player.adjustedPoints, 0).toFixed(1)}</p>
        `;
        return lineup;
    }

    function generateOptimalLineupWeekly(size, lineupConfig, benchSize, irSpots, scoring, bonusTD, penaltyFumble, currentRoster = []) {
        let availablePlayers = [...players];
        if (currentRoster.length) {
            availablePlayers = currentRoster.map(p => {
                const [name, pos] = p.split(',');
                const player = players.find(pl => pl.name === name && pl.pos === pos);
                return player ? { ...player, adjustedPoints: player.points } : null;
            }).filter(p => p);
        } else {
            availablePlayers.sort((a, b) => b.points - a.points);
        }

        // Apply scoring adjustments
        availablePlayers = availablePlayers.map(p => {
            let points = p.points;
            if (scoring === 'ppr') points += p.receptions;
            else if (scoring === 'halfppr') points += p.receptions * 0.5;
            else if (scoring === 'tep' && p.pos === 'TE') points *= 1.5;
            else if (scoring === 'tefullppr' && p.pos === 'TE') points += p.receptions * 2;
            else if (scoring === '6ptpass') points += (p.passTds * 2); // Add 2 points per passing TD (from 4 to 6)
            if (bonusTD && p.td > 0) points += 6;
            if (penaltyFumble && p.fumble > 0) points -= 2;
            return { ...p, adjustedPoints: points };
        });

        // Calculate total roster size including IR spots
        const totalRosterSize = lineupConfig.length + benchSize + irSpots;

        // Use the provided lineup size or the calculated total roster size
        const effectiveSize = Math.min(size, totalRosterSize);

        // Parse lineup requirements
        const requirements = {};
        lineupConfig.forEach(req => {
            const [count, pos] = req.match(/(\d+)([A-Z]+)/);
            requirements[pos] = parseInt(count);
        });
        requirements['FLEX'] = requirements['FLEX'] || 0;

        // Greedy selection
        const lineup = [];
        const usedPositions = {};
        for (let pos in requirements) usedPositions[pos] = 0;

        for (let player of availablePlayers) {
            if (lineup.length >= effectiveSize) break;
            let posToFill = player.pos;
            if (usedPositions[player.pos] < requirements[player.pos] || (player.pos !== 'FLEX' && usedPositions['FLEX'] < requirements['FLEX'])) {
                if (usedPositions[player.pos] < requirements[player.pos]) {
                    lineup.push(player);
                    usedPositions[player.pos]++;
                } else if (usedPositions['FLEX'] < requirements['FLEX'] && ['RB', 'WR', 'TE'].includes(player.pos)) {
                    lineup.push(player);
                    usedPositions['FLEX']++;
                }
            }
        }

        lineupResult.innerHTML = `
            <h3 class="text-xl font-semibold mb-4 text-teal-700">Optimal Weekly Lineup</h3>
            <ul class="list-disc pl-5 space-y-2">
                ${lineup.map(player => `<li>${player.name} (${player.pos}) - ${player.adjustedPoints.toFixed(1)} pts</li>`).join('')}
            </ul>
            <p class="mt-2 text-gray-600">Total Projected Points: ${lineup.reduce((sum, p) => sum + p.adjustedPoints, 0).toFixed(1)}</p>
        `;
        return lineup;
    }

    function compareLineups(lineup1, lineup2, type) {
        const resultDiv = type === 'draft' ? buildResultDraft : lineupResult;
        const total1 = lineup1.reduce((sum, entry) => sum + (entry.player ? entry.player.adjustedPoints : entry.adjustedPoints), 0).toFixed(1);
        const total2 = lineup2.reduce((sum, entry) => sum + (entry.player ? entry.player.adjustedPoints : entry.adjustedPoints), 0).toFixed(1);
        resultDiv.innerHTML = `
            <h3 class="text-xl font-semibold mb-4 text-teal-700">Lineup Comparison</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-teal-50 rounded-lg shadow">
                    <h4 class="font-semibold">Optimal ${type === 'draft' ? 'Draft' : 'Weekly'}</h4>
                    <ul class="list-disc pl-5 space-y-2 mt-2">
                        ${lineup1.map(entry => `<li>${type === 'draft' ? `Round ${entry.round} (Pick ${entry.pick}): ` : ''}${entry.player ? entry.player.name : entry.name} (${entry.player ? entry.player.pos : entry.pos}) - ${(entry.player ? entry.player.adjustedPoints : entry.adjustedPoints).toFixed(1)} pts</li>`).join('')}
                    </ul>
                    <p class="mt-2 text-gray-600">Total: ${total1} pts</p>
                </div>
                <div class="p-4 bg-teal-50 rounded-lg shadow">
                    <h4 class="font-semibold">Balanced ${type === 'draft' ? 'Draft' : 'Weekly'}</h4>
                    <ul class="list-disc pl-5 space-y-2 mt-2">
                        ${lineup2.map(entry => `<li>${type === 'draft' ? `Round ${entry.round} (Pick ${entry.pick}): ` : ''}${entry.player ? entry.player.name : entry.name} (${entry.player ? entry.player.pos : entry.pos}) - ${(entry.player ? entry.player.adjustedPoints : entry.adjustedPoints).toFixed(1)} pts</li>`).join('')}
                    </ul>
                    <p class="mt-2 text-gray-600">Total: ${total2} pts</p>
                </div>
            </div>
        `;
    }

    // Best Draft Strategies Functionality
    const strategies = {
        redraft: [
            { title: 'Zero-RB', content: 'Zero-RB Guide: Focus on WRs early (rounds 1-3), then target RBs in mid-to-late rounds (6-10). Ideal for PPR/Half PPR leagues. Target high-upside RBs like Jaylen Warren or Rachaad White. Risk: Depth at RB if injuries occur. Best for leagues with deep WR talent pools.' },
            { title: 'Late-Round QB', content: 'Late-Round QB: Target QBs in rounds 8+ (e.g., Josh Allen, Patrick Mahomes). Prioritize elite WRs/RBs early. Risk: QB production may lag if top options are taken. Works well in 6pt Passing TD formats to maximize value.' },
            { title: 'Hero-RB', content: 'Hero-RB: Draft a top RB early (rounds 1-2, e.g., Christian McCaffrey), then load up on WRs and a mid-tier QB. Ideal for standard leagues. Risk: Weakness at other positions if RB underperforms. Pair with TEP or TE Full PPR if TE depth is strong.' },
            { title: 'Balanced Approach', content: 'Balanced Approach: Draft a mix of positions early (e.g., RB, WR, QB by round 5), avoiding over-focusing on one. Aim for consistency with players like Justin Jefferson or Breece Hall. Risk: May miss elite upside. Suits all scoring types.' },
            { title: 'WR-Heavy', content: 'WR-Heavy: Load up on WRs in rounds 1-4 (e.g., Ja\'Marr Chase, Amon-Ra St. Brown), then fill RB and QB later. Great for PPR/Half PPR. Risk: RB scarcity in later rounds. Target high-reception WRs like Tyreek Hill.' }
        ],
        dynasty: [
            { title: 'Zero-RB', content: 'Zero-RB Guide: Prioritize young WRs (e.g., Garrett Wilson, Drake London) in early rounds, then acquire rookie RBs (e.g., Jaylen Warren) via trades or late picks. Ideal for long-term PPR value. Risk: Early RB injuries hurt depth.' },
            { title: 'Late-Round QB', content: 'Late-Round QB: Delay QB picks (e.g., Josh Allen in later rounds), focusing on young skill players. Trade up for elite QBs later. Risk: QB depth may thin out. Best with 6pt Passing TDs to boost late-round value.' },
            { title: 'Hero-RB', content: 'Hero-RB: Secure a young RB star (e.g., Breece Hall) early, then build around with WRs and a mid-tier QB. Ideal for dynasty stability. Risk: Over-reliance on one player. Pair with TEP or TE Full PPR for TE support.' },
            { title: 'Rookie Focus', content: 'Rookie Focus: Target rookie WRs/RBs (e.g., Puka Nacua) in early rounds, leveraging their long-term potential. Trade veterans for picks. Risk: Inconsistent early production. Works with any scoring type.' },
            { title: 'Balanced Approach', content: 'Balanced Approach: Draft a mix of young stars (e.g., Justin Jefferson) and veterans (e.g., Travis Kelce) across positions. Maintain trade flexibility. Risk: May miss breakout rookies. Suits all scoring formats.' }
        ],
        superflex: [
            { title: 'Early QB', content: 'Early QB: Draft two QBs early (e.g., Patrick Mahomes, Josh Allen) in rounds 1-4 to exploit Superflex value. Fill WR/RB later. Risk: Weak skill positions. Optimized for 6pt Passing TDs.' },
            { title: 'Zero-RB', content: 'Zero-RB Guide: Focus on QBs and WRs early (e.g., Ja\'Marr Chase), then target RBs late (e.g., Rachaad White). Leverage QB depth. Risk: RB injuries. Best for PPR/Half PPR.' },
            { title: 'Hero-RB', content: 'Hero-RB: Grab a top RB (e.g., Christian McCaffrey) early, then secure two QBs (e.g., Josh Allen) for Superflex. Risk: QB scarcity later. Pair with TEP or TE Full PPR for TE support.' },
            { title: 'QB-WR Stack', content: 'QB-WR Stack: Draft a QB (e.g., Patrick Mahomes) and his top WR (e.g., Travis Kelce) early, then add a second QB. Boosts consistency. Risk: RB depth issues. Works with 6pt Passing TDs.' },
            { title: 'Balanced Superflex', content: 'Balanced Superflex: Take one QB early (e.g., Josh Allen), then mix WRs (e.g., Justin Jefferson) and RBs (e.g., Breece Hall). Add a second QB later. Risk: Elite QB miss. Suits all scoring types.' }
        ]
    };

    // Populate strategy cards based on league type
    const leagueTypeSelect = document.getElementById('leagueType');
    const strategyCardsDiv = document.getElementById('strategyCards');
    if (leagueTypeSelect && strategyCardsDiv) {
        function updateStrategies() {
            const leagueType = leagueTypeSelect.value;
            strategyCardsDiv.innerHTML = '';
            strategies[leagueType].forEach((strategy, index) => {
                const card = document.createElement('div');
                card.className = 'strategy-card p-4 bg-teal-100 rounded-lg';
                card.innerHTML = `
                    <h4 class="font-semibold">${strategy.title}</h4>
                    <p class="strategy-preview text-sm">${strategy.content.substring(0, 100)}...</p>
                    <p class="full-content text-sm mt-2">${strategy.content}</p>
                    <span class="expand-toggle" onclick="this.parentElement.classList.toggle('expanded');">Show more</span>
                `;
                strategyCardsDiv.appendChild(card);
            });
        }
        leagueTypeSelect.addEventListener('change', updateStrategies);
        updateStrategies(); // Ensure initial load
    }

    // Reset Strategies
    const resetStrategiesButton = document.getElementById('resetStrategies');
    if (resetStrategiesButton) {
        resetStrategiesButton.addEventListener('click', () => {
            document.querySelectorAll('.strategy-card').forEach(card => {
                card.classList.remove('expanded');
            });
        });
    }
});
