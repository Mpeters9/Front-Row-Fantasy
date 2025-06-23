document.addEventListener('DOMContentLoaded', () => {
    // Element references
    const $ = id => document.getElementById(id);
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

    // Utility functions
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
            // If current value is out of range, clamp it
            draftPickInput.value = clamp(parseInt(draftPickInput.value) || 1, 1, parseInt(leagueSizeSelect.value));
            draftPickValue.textContent = draftPickInput.value;
        };
        leagueSizeSelect.addEventListener('change', clampDraftPick);
        draftPickInput.addEventListener('input', clampDraftPick);
        clampDraftPick(); // run once on load
    }

    // Sync bench size between sections
    if (benchSizeSelect && lineupBenchSizeSelect) {
        const syncBench = e => {
            benchSizeSelect.value = lineupBenchSizeSelect.value = e.target.value;
        };
        benchSizeSelect.addEventListener('change', syncBench);
        lineupBenchSizeSelect.addEventListener('change', syncBench);
    }

    // Player data (unchanged)
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

    // --- Generate Optimal Draft ---
    function generateOptimalDraft(leagueSize, lineupConfig, benchSize, scoring, bonusTD, penaltyFumble, focus, pick) {
        let availablePlayers = [...players].sort((a, b) => a.adp - b.adp);
        const totalRosterSize = lineupConfig.length + benchSize;
        const requirements = {};
        lineupConfig.forEach(req => {
            const [count, pos] = req.match(/(\d+)([A-Z]+)/);
            requirements[pos] = parseInt(count);
        });
        requirements['FLEX'] = requirements['FLEX'] || 0;
        const usedPositions = {};
        for (let pos in requirements) usedPositions[pos] = 0;
        const lineup = [];

        // Apply scoring adjustments
        availablePlayers = availablePlayers.map(p => {
            let points = p.points;
            if (scoring === 'ppr') points += p.receptions;
            else if (scoring === 'halfppr') points += p.receptions * 0.5;
            else if (scoring === 'tep' && p.pos === 'TE') points *= 1.5;
            else if (scoring === 'tefullppr' && p.pos === 'TE') points += p.receptions * 2;
            else if (scoring === '6ptpass') points += (p.passTds * 2);
            if (bonusTD && p.td > 0) points += 6;
            if (penaltyFumble && p.fumble > 0) points -= 2;
            return { ...p, adjustedPoints: points };
        });

        // Snake draft logic: one pick per round, alternating order, plausible by ADP
        for (let i = 0; i < totalRosterSize; i++) {
            const round = Math.floor(i / leagueSize) + 1;
            const pickInRound = (round % 2 === 1) ? pick : leagueSize - pick + 1;
            const overallPick = (round - 1) * leagueSize + pickInRound;

            // Plausibility: Simulate chance of being available based on ADP
            let candidates = availablePlayers.filter(p => {
                if (p.adp < overallPick - 1) return false; // Gone
                if (p.adp === overallPick - 1) return Math.random() < 0.10; // 10% chance
                if (p.adp === overallPick) return Math.random() < 0.30; // 30% chance
                return true; // ADP > overallPick, available
            });

            // If no plausible candidate, allow next best available (simulate draft chaos)
            if (candidates.length === 0) {
                candidates = availablePlayers.filter(p => !lineup.some(entry => entry.player === p));
            }

            if (focus !== 'balanced') {
                candidates = candidates.sort((a, b) => (a.pos === focus ? -1 : b.pos === focus ? 1 : 0) || b.adjustedPoints - a.adjustedPoints);
            } else {
                candidates = candidates.sort((a, b) => b.adjustedPoints - a.adjustedPoints);
            }

            let player = null;
            // Fill starting lineup first
            if (i < lineupConfig.length) {
                for (let p of candidates) {
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
                if (!player && candidates.length > 0) {
                    player = candidates[0];
                    if (['RB', 'WR', 'TE'].includes(player.pos)) usedPositions['FLEX']++;
                    else usedPositions[player.pos]++;
                }
            } else {
                // Fill bench
                if (candidates.length > 0) player = candidates[0];
            }
            if (player) {
                lineup.push({ player, round, pick: pickInRound });
                availablePlayers = availablePlayers.filter(p => p !== player);
            }
        }

        // Display result
        const totalPoints = lineup.reduce((sum, entry) => sum + entry.player.adjustedPoints, 0);
        buildResultDraft.innerHTML = `
            <h3 class="text-xl font-bold">Optimal Draft</h3>
            <p>Total Points: ${totalPoints.toFixed(1)}</p>
            <ul class="list-disc pl-5">
                ${lineup.map((entry, idx) => `<li>Round ${entry.round}, Pick ${entry.pick}: ${entry.player.name} (${entry.player.pos}) - ${entry.player.adjustedPoints.toFixed(1)} pts</li>`).join('')}
            </ul>
        `;
        return lineup;
    }

    // --- Event listeners ---
    if (generateDraftButton) generateDraftButton.addEventListener('click', () => {
        const leagueSize = parseInt(leagueSizeSelect.value) || 12;
        const draftPick = clamp(parseInt(draftPickInput.value) || 1, 1, leagueSize);
        if (draftPick > leagueSize) {
            alert(`Draft position cannot exceed league size (${leagueSize}).`);
            draftPickInput.value = leagueSize;
            draftPickValue.textContent = leagueSize;
            return;
        }
        showProgress(progressBarDraft, progressDraft, () => {
            generateOptimalDraft(
                leagueSize,
                parseLineupConfig(startingLineupSelect.value),
                parseInt(benchSizeSelect.value) || 7,
                scoringTypeSelect.value,
                bonusTDCheckbox.checked,
                penaltyFumbleCheckbox.checked,
                positionFocusSelect.value,
                draftPick
            );
        });
    });

    if (saveDraftButton) saveDraftButton.addEventListener('click', () =>
        saveExport(buildResultDraft, 'savedDraft', 'fantasy_draft.txt', 'Draft saved and exported!')
    );

    // Save/Export Weekly Lineup
    if (saveLineupWeeklyButton && lineupResult) {
        saveLineupWeeklyButton.addEventListener('click', () =>
            saveExport(lineupResult, 'savedLineup', 'fantasy_lineup.txt', 'Lineup saved and exported!')
        );
    }

    // Compare Draft Lineups
    if (compareDraftButton && leagueSizeSelect && startingLineupSelect && benchSizeSelect && scoringTypeSelect && bonusTDCheckbox && penaltyFumbleCheckbox && positionFocusSelect && draftPickInput && progressBarDraft && progressDraft && buildResultDraft) {
        compareDraftButton.addEventListener('click', () => {
            const leagueSize = parseInt(leagueSizeSelect.value) || 10;
            const draftPick = clamp(parseInt(draftPickInput.value), 1, leagueSize);
            showProgress(progressBarDraft, progressDraft, () => {
                const lineup1 = generateOptimalDraft(
                    leagueSize,
                    parseLineupConfig(startingLineupSelect.value),
                    parseInt(benchSizeSelect.value) || 7,
                    scoringTypeSelect.value,
                    bonusTDCheckbox.checked,
                    penaltyFumbleCheckbox.checked,
                    positionFocusSelect.value,
                    draftPick
                );
                const lineup2 = generateOptimalDraft(
                    leagueSize,
                    parseLineupConfig(startingLineupSelect.value),
                    parseInt(benchSizeSelect.value) || 7,
                    scoringTypeSelect.value,
                    bonusTDCheckbox.checked,
                    penaltyFumbleCheckbox.checked,
                    'balanced',
                    draftPick
                );
                compareLineups(lineup1, lineup2, 'draft');
            });
        });
    }

    // Compare Weekly Lineups
    if (compareLineupsWeeklyButton && lineupSizeInput && lineupStartingSelect && lineupBenchSizeSelect && lineupIrSpotsSelect && lineupScoringSelect && lineupBonusTDCheckbox && lineupPenaltyFumbleCheckbox && currentRosterInput && progressBarWeekly && progressWeekly && lineupResult) {
        compareLineupsWeeklyButton.addEventListener('click', () => {
            showProgress(progressBarWeekly, progressWeekly, () => {
                const lineup1 = generateOptimalLineupWeekly(
                    parseInt(lineupSizeInput.value) || 15,
                    parseLineupConfig(lineupStartingSelect.value),
                    parseInt(lineupBenchSizeSelect.value) || 7,
                    parseInt(lineupIrSpotsSelect.value) || 1,
                    lineupScoringSelect.value,
                    lineupBonusTDCheckbox.checked,
                    lineupPenaltyFumbleCheckbox.checked,
                    parseRoster(currentRosterInput.value)
                );
                const lineup2 = generateOptimalLineupWeekly(
                    parseInt(lineupSizeInput.value) || 15,
                    parseLineupConfig(lineupStartingSelect.value),
                    parseInt(lineupBenchSizeSelect.value) || 7,
                    parseInt(lineupIrSpotsSelect.value) || 1,
                    lineupScoringSelect.value,
                    lineupBonusTDCheckbox.checked,
                    lineupPenaltyFumbleCheckbox.checked,
                    parseRoster(currentRosterInput.value),
                    true
                );
                compareLineups(lineup1, lineup2, 'weekly');
            });
        });
    }

    function generateOptimalLineupWeekly(lineupSize, lineupConfig, benchSize, irSpots, scoring, bonusTD, penaltyFumble, currentRoster, alternate = false) {
        let availablePlayers = [...players];
        if (currentRoster.length) {
            const rosterPlayers = currentRoster.map(name => {
                const player = players.find(p => p.name === name.split(',')[0].trim());
                return player ? { ...player, adjustedPoints: player.points } : null;
            }).filter(p => p);
            availablePlayers = rosterPlayers.length ? rosterPlayers : availablePlayers;
        }
        availablePlayers.sort((a, b) => b.points - a.points); // Sort by base points initially

        // Apply scoring adjustments
        availablePlayers = availablePlayers.map(p => {
            let points = p.points;
            if (scoring === 'ppr') points += p.receptions;
            else if (scoring === 'halfppr') points += p.receptions * 0.5;
            else if (scoring === 'tep' && p.pos === 'TE') points *= 1.5;
            else if (scoring === 'tefullppr' && p.pos === 'TE') points += p.receptions * 2;
            else if (scoring === '6ptpass') points += (p.passTds * 2); // Add 2 points per passing TD
            if (bonusTD && p.td > 0) points += 6;
            if (penaltyFumble && p.fumble > 0) points -= 2;
            return { ...p, adjustedPoints: points };
        });

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
        let remainingIr = irSpots;

        // Select players
        availablePlayers = availablePlayers.filter(p => !lineup.some(entry => entry.player === p));
        for (let i = 0; i < lineupSize; i++) {
            let player = null;
            if (i < lineupConfig.length) {
                // Fill starting lineup
                for (let p of availablePlayers) {
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
                if (!player && availablePlayers.length > 0) {
                    player = availablePlayers[0]; // Fallback to best available
                    if (['RB', 'WR', 'TE'].includes(player.pos)) usedPositions['FLEX']++;
                    else usedPositions[player.pos]++;
                }
            } else if (remainingBench > 0 || remainingIr > 0) {
                // Fill bench or IR
                for (let p of availablePlayers) {
                    if (remainingBench > 0) {
                        player = p;
                        remainingBench--;
                        break;
                    } else if (remainingIr > 0 && alternate) { // Use IR for alternate lineup
                        player = p;
                        remainingIr--;
                        break;
                    }
                }
                if (!player && availablePlayers.length > 0) {
                    player = availablePlayers[0];
                    remainingBench--;
                }
            }
            if (player) {
                lineup.push({ player, round: 1, pick: i + 1 });
                availablePlayers = availablePlayers.filter(p => p !== player);
            }
        }

        // Display result
        const totalPoints = lineup.reduce((sum, entry) => sum + entry.player.adjustedPoints, 0);
        lineupResult.innerHTML = `
            <h3 class="text-xl font-bold">Optimal Weekly Lineup</h3>
            <p>Total Points: ${totalPoints.toFixed(1)}</p>
            <ul class="list-disc pl-5">
                ${lineup.map(entry => `<li>${entry.player.name} (${entry.player.pos}) - ${entry.player.adjustedPoints.toFixed(1)} pts</li>`).join('')}
            </ul>
        `;
        return lineup;
    }

    function compareLineups(lineup1, lineup2, type) {
        const totalPoints1 = lineup1.reduce((sum, entry) => sum + entry.player.adjustedPoints, 0);
        const totalPoints2 = lineup2.reduce((sum, entry) => sum + entry.player.adjustedPoints, 0);
        const resultElement = type === 'draft' ? buildResultDraft : lineupResult;
        resultElement.innerHTML = `
            <h3 class="text-xl font-bold">Comparison of ${type === 'draft' ? 'Drafts' : 'Weekly Lineups'}</h3>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4>Lineup 1</h4>
                    <ul class="list-disc pl-5">
                        ${lineup1.map(entry => `<li>${entry.player.name} (${entry.player.pos}) - ${entry.player.adjustedPoints.toFixed(1)} pts${type === 'draft' ? ` (Round ${entry.round}, Pick ${entry.pick})` : ''}</li>`).join('')}
                    </ul>
                    <p>Total: ${totalPoints1.toFixed(1)} pts</p>
                </div>
                <div>
                    <h4>Lineup 2</h4>
                    <ul class="list-disc pl-5">
                        ${lineup2.map(entry => `<li>${entry.player.name} (${entry.player.pos}) - ${entry.player.adjustedPoints.toFixed(1)} pts${type === 'draft' ? ` (Round ${entry.round}, Pick ${entry.pick})` : ''}</li>`).join('')}
                    </ul>
                    <p>Total: ${totalPoints2.toFixed(1)} pts</p>
                </div>
            </div>
            <p class="mt-2">${totalPoints1 > totalPoints2 ? 'Lineup 1 is better by ' + (totalPoints1 - totalPoints2).toFixed(1) + ' points!' : totalPoints2 > totalPoints1 ? 'Lineup 2 is better by ' + (totalPoints2 - totalPoints1).toFixed(1) + ' points!' : 'Both lineups are equal in points!'}</p>
        `;
    }
});
