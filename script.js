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

    // --- CSV Parsing Utility ---
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].replace(/"/g, '').split(',');
        return lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/"/g, '')) || [];
            const obj = {};
            headers.forEach((h, i) => obj[h] = values[i]);
            return obj;
        }).filter(row => row.Player && row.POS && row.AVG);
    }

    // --- Load CSV and Initialize Draft ---
    let adpPlayers = [];
    let currentScoringType = 'ppr'; // default

    function getJsonFileForScoring(scoringType) {
        switch (scoringType) {
            case 'standard': return 'Standard ADP.json';
            case 'halfppr': return 'Half PPR.json';
            default: return 'csvjson.json'; // ppr and all others default to ppr
        }
    }

    function loadPlayerData(scoringType, callback) {
        const file = getJsonFileForScoring(scoringType);
        fetch(file)
            .then(res => {
                if (!res.ok) throw new Error('JSON file not found or not accessible.');
                return res.json();
            })
            .then(data => {
                adpPlayers = data.map(p => ({
                    name: p.Player,
                    pos: p.POS ? p.POS.replace(/\d+/, '') : '',
                    team: p.Team,
                    adp: parseFloat(p.AVG),
                    points: 0,
                    receptions: p.Receptions || 0, // add if available
                    passTds: p.PassTD || 0 // add if available
                }));
                if (typeof buildResultDraft !== 'undefined' && buildResultDraft) buildResultDraft.innerHTML = '';
                if (callback) callback();
            })
            .catch(err => {
                adpPlayers = [...players];
                if (typeof buildResultDraft !== 'undefined' && buildResultDraft) buildResultDraft.innerHTML = `<p style="color:orange;">Using built-in player data (JSON not loaded): ${err.message}</p>`;
                if (callback) callback();
            });
    }

    // --- Scoring adjustment for draft builds ---
    function adjustDraftPlayerPoints(player, scoringType) {
        let points = player.points || 0;
        if (scoringType === 'ppr') points += player.receptions || 0;
        else if (scoringType === 'halfppr') points += (player.receptions || 0) * 0.5;
        else if (scoringType === 'tep' && player.pos === 'TE') points *= 1.5;
        else if (scoringType === 'tefullppr' && player.pos === 'TE') points += (player.receptions || 0) * 2;
        else if (scoringType === '6ptpass' && player.pos === 'QB') points += (player.passTds || 0) * 2;
        return points;
    }

    // --- Generate Optimal Draft for User's Full Team ---
    function generateOptimalDraft(leagueSize, lineupConfig, benchSize, scoring, bonusTD, penaltyFumble, focus, userDraftPick) {
        if (!adpPlayers.length) {
            buildResultDraft.innerHTML = `<p>Loading player data...</p>`;
            return;
        }
        let availablePlayers = [...adpPlayers].map(p => {
            // Standard deviation is 25% of ADP, minimum 1
            const stddev = Math.max(1, p.adp * 0.25);
            return {
                ...p,
                randomizedADP: randomNormal(p.adp, stddev),
                adjustedPoints: adjustDraftPlayerPoints(p, scoring)
            };
        }).sort((a, b) => a.randomizedADP - b.randomizedADP);

        const totalRosterSize = lineupConfig.length + benchSize;
        const userTeam = [];
        let userPickIdx = userDraftPick - 1; // 0-based index

        // Simulate a full snake draft for all teams, but only keep your team's picks
        for (let round = 0; round < totalRosterSize; round++) {
            let pickNum = round * leagueSize + (round % 2 === 0 ? userPickIdx : leagueSize - userPickIdx - 1);
            let player = availablePlayers.shift();
            userTeam.push({
                player,
                round: round + 1,
                pick: (round % 2 === 0 ? userPickIdx + 1 : leagueSize - userPickIdx),
                overall: pickNum + 1
            });
            for (let i = 1; i < leagueSize; i++) {
                availablePlayers.shift();
            }
        }

        buildResultDraft.innerHTML = `
            <h3 class="text-xl font-bold">Your Drafted Team</h3>
            <ul class="list-disc pl-5">
                ${userTeam.map(entry =>
                    `<li>Round ${entry.round}, Pick ${entry.pick} (Overall ${entry.overall}): ${entry.player.name} (${entry.player.pos}) - ${entry.player.adjustedPoints?.toFixed(1) ?? ''} pts</li>`
                ).join('')}
            </ul>
        `;
        return userTeam;
    }

    // --- Generate Optimal Draft with Snake Draft Logic ---
    function generateOptimalDraftLegacy(leagueSize, lineupConfig, benchSize, scoring, bonusTD, penaltyFumble, focus, userDraftPick) {
        // Prepare player pool, sorted by ADP
        let availablePlayers = [...players].sort((a, b) => a.adp - b.adp);
        const totalRosterSize = lineupConfig.length + benchSize;
        const requirements = {};
        lineupConfig.forEach(req => {
            const [_, count, pos] = req.match(/(\d+)([A-Z]+)/) || [];
            if (count && pos) requirements[pos] = parseInt(count);
        });
        requirements['FLEX'] = requirements['FLEX'] || 0;
        const usedPositions = {};
        for (let pos in requirements) usedPositions[pos] = 0;

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

        // Snake draft simulation
        const draftPicks = [];
        let pickNum = 1;
        let round = 1;
        let totalPicks = totalRosterSize;
        let userPickIdx = userDraftPick - 1; // 0-based index

        for (let i = 0; i < totalPicks; i++) {
            round = Math.floor(i / leagueSize) + 1;
            let pickInRound = i % leagueSize;
            let isEvenRound = round % 2 === 0;
            let actualPick = isEvenRound ? leagueSize - pickInRound - 1 : pickInRound;
            let overallPick = (round - 1) * leagueSize + (actualPick + 1);

            // Only select for the user's team (userPickIdx)
            if (actualPick === userPickIdx) {
                // Filter candidates for lineup requirements
                let candidates = availablePlayers;
                if (focus !== 'balanced') {
                    candidates = candidates.sort((a, b) => (a.pos === focus ? -1 : b.pos === focus ? 1 : 0) || b.adjustedPoints - a.adjustedPoints);
                } else {
                    candidates = candidates.sort((a, b) => b.adjustedPoints - a.adjustedPoints);
                }

                let player = null;
                // Fill starting lineup first
                if (draftPicks.length < lineupConfig.length) {
                    for (let p of candidates) {
                        if (usedPositions[p.pos] < (requirements[p.pos] || 0)) {
                            player = p;
                            usedPositions[p.pos]++;
                            break;
                        } else if (usedPositions['FLEX'] < requirements['FLEX'] && ['RB', 'WR', 'TE'].includes(p.pos)) {
                            player = p;
                            usedPositions['FLEX']++;
                            break;
                        }
                    }
                    if (!player && candidates.length > 0) {
                        player = candidates[0];
                        if (['RB', 'WR', 'TE'].includes(player.pos)) usedPositions['FLEX']++;
                        else usedPositions[player.pos] = (usedPositions[player.pos] || 0) + 1;
                    }
                } else {
                    // Fill bench
                    if (candidates.length > 0) player = candidates[0];
                }
                if (player) {
                    draftPicks.push({
                        player,
                        round,
                        pick: actualPick + 1,
                        overall: overallPick
                    });
                    availablePlayers = availablePlayers.filter(p => p !== player);
                }
            } else {
                // Simulate other teams picking best available
                availablePlayers.shift();
            }
        }

        // Display result
        const totalPoints = draftPicks.reduce((sum, entry) => sum + entry.player.adjustedPoints, 0);
        buildResultDraft.innerHTML = `
            <h3 class="text-xl font-bold">Optimal Draft</h3>
            <p>Total Points: ${totalPoints.toFixed(1)}</p>
            <ul class="list-disc pl-5">
                ${draftPicks.map(entry =>
                    `<li>Round ${entry.round}, Pick ${entry.pick} (Overall ${entry.overall}): ${entry.player.name} (${entry.player.pos}) - ${entry.player.adjustedPoints.toFixed(1)} pts</li>`
                ).join('')}
            </ul>
        `;
        return draftPicks;
    }

    // --- Random Normal Distribution ---
    function randomNormal(mean, stddev) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return Math.max(1, mean + stddev * num); // ADP can't be less than 1
    }

    // --- Listen for scoring type changes and reload data ---
    if (scoringTypeSelect) {
        scoringTypeSelect.addEventListener('change', () => {
            currentScoringType = scoringTypeSelect.value;
            loadPlayerData(currentScoringType);
        });
    }

    // --- Event listeners ---
    if (generateDraftButton) generateDraftButton.addEventListener('click', () => {
        currentScoringType = scoringTypeSelect.value;
        loadPlayerData(currentScoringType, () => {
            const leagueSize = parseInt(leagueSizeSelect.value) || 12;
            const draftPick = clamp(parseInt(draftPickInput.value) || 1, 1, leagueSize);
            showProgress(progressBarDraft, progressDraft, () => {
                generateOptimalDraft(
                    leagueSize,
                    parseLineupConfig(startingLineupSelect.value),
                    parseInt(benchSizeSelect.value) || 7,
                    currentScoringType,
                    bonusTDCheckbox.checked,
                    penaltyFumbleCheckbox.checked,
                    positionFocusSelect.value,
                    draftPick
                );
            });
        });
    });
    if (saveDraftButton) saveDraftButton.addEventListener('click', () => {
        saveExport(buildResultDraft, 'savedDraft', 'my_fantasy_draft.txt', 'Draft saved!');
    });
    if (compareDraftButton) compareDraftButton.addEventListener('click', () => {
        const userDraft = buildResultDraft.innerHTML;
        const aiDraft = generateOptimalDraftLegacy(12, parseLineupConfig(startingLineupSelect.value), parseInt(benchSizeSelect.value), scoringTypeSelect.value, bonusTDCheckbox.checked, penaltyFumbleCheckbox.checked, positionFocusSelect.value, 1);
        // Compare logic here (simple example)
        let differences = '';
        aiDraft.forEach((entry, idx) => {
            if (entry.player.name !== userDraft[idx]?.player?.name) {
                differences += `<li>Round ${entry.round}: You - ${userDraft[idx]?.player?.name || 'N/A'}, AI - ${entry.player.name}</li>`;
            }
        });
        buildResultDraft.innerHTML += `
            <h3 class="text-xl font-bold mt-5">Draft Comparison</h3>
            <ul class="list-disc pl-5">
                ${differences || '<li>No differences found.</li>'}
            </ul>
        `;
    });

    // --- Weekly Lineup Generation (stub) ---
    if (generateLineupWeeklyButton) generateLineupWeeklyButton.addEventListener('click', () => {
        const roster = parseRoster(currentRosterInput.value);
        const lineupSize = parseInt(lineupSizeInput.value) || 0;
        const benchSize = parseInt(lineupBenchSizeSelect.value) || 0;
        const irSpots = parseInt(lineupIrSpotsSelect.value) || 0;
        const scoring = lineupScoringSelect.value;
        const bonusTD = lineupBonusTDCheckbox.checked;
        const penaltyFumble = lineupPenaltyFumbleCheckbox.checked;
        // Simple validation
        if (roster.length === 0) {
            alert('Current roster is empty!');
            return;
        }
        if (lineupSize + benchSize + irSpots !== roster.length) {
            alert('Lineup size, bench size, and IR spots must match the current roster size.');
            return;
        }
        // Weekly lineup logic (stub)
        const weeklyLineup = roster.slice(0, lineupSize).map((player, idx) => ({
            player,
            position: player.pos,
            order: idx + 1
        }));
        const bench = roster.slice(lineupSize, lineupSize + benchSize).map((player, idx) => ({
            player,
            position: player.pos,
            order: idx + 1 + lineupSize
        }));
        const ir = roster.slice(lineupSize + benchSize, lineupSize + benchSize + irSpots).map(player => ({
            player,
            position: player.pos
        }));
        // Display result
        lineupResult.innerHTML = `
            <h3 class="text-xl font-bold">Generated Weekly Lineup</h3>
            <h4 class="font-semibold">Starters (${lineupSize})</h4>
            <ul class="list-disc pl-5">
                ${weeklyLineup.map(entry =>
                    `<li>${entry.order}. ${entry.player.name} (${entry.player.pos})</li>`
                ).join('')}
            </ul>
            <h4 class="font-semibold">Bench (${benchSize})</h4>
            <ul class="list-disc pl-5">
                ${bench.map(entry =>
                    `<li>${entry.order}. ${entry.player.name} (${entry.player.pos})</li>`
                ).join('')}
            </ul>
            ${ir.length > 0 ? `<h4 class="font-semibold">IR (${irSpots})</h4>
            <ul class="list-disc pl-5">
                ${ir.map(entry =>
                    `<li>${entry.player.name} (${entry.player.pos})</li>`
                ).join('')}
            </ul>` : ''}
        `;
    });
    if (saveLineupWeeklyButton) saveLineupWeeklyButton.addEventListener('click', () => {
        saveExport(lineupResult, 'savedLineup', 'my_weekly_lineup.txt', 'Lineup saved!');
    });
    if (compareLineupsWeeklyButton) compareLineupsWeeklyButton.addEventListener('click', () => {
        // Compare logic for weekly lineups (stub)
        alert('Compare lineups feature is not yet implemented.');
    });
});
