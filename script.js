document.addEventListener('DOMContentLoaded', () => {
    // --- Element references ---
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

    // --- Player data fallback ---
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
                    receptions: p.Receptions || 0,
                    passTds: p.PassTD || 0
                }));
                if (buildResultDraft) buildResultDraft.innerHTML = '';
                if (callback) callback();
            })
            .catch(err => {
                adpPlayers = [...players];
                if (buildResultDraft) buildResultDraft.innerHTML = `<p style="color:orange;">Using built-in player data (JSON not loaded): ${err.message}</p>`;
                if (callback) callback();
            });
    }

    // --- Scoring adjustment for draft builds ---
    function adjustDraftPlayerPoints(player, scoringType) {
        let points = player.points || 0;

        // Standard scoring: 1 pt per 10 rush/rec yards, 6 per rush/rec TD, 1 per 25 pass yards, 4 per pass TD, -2 per INT, -2 per fumble lost
        // (Assume player.points already reflects this base)

        switch (scoringType) {
            case 'standard':
                // No PPR bonus
                break;
            case 'halfppr':
                // 0.5 points per reception
                points += (player.receptions || 0) * 0.5;
                break;
            case 'ppr':
                // 1 point per reception
                points += (player.receptions || 0) * 1;
                break;
            case 'tep':
                // 1 point per reception, TE gets 1.5x PPR
                if (player.pos === 'TE') {
                    points += (player.receptions || 0) * 1.5;
                } else {
                    points += (player.receptions || 0) * 1;
                }
                break;
            case 'tefullppr':
                // TE gets 2 points per reception, others get 1
                if (player.pos === 'TE') {
                    points += (player.receptions || 0) * 2;
                } else {
                    points += (player.receptions || 0) * 1;
                }
                break;
            case '6ptpass':
                // 1 point per reception, 6 points per pass TD (standard is 4)
                points += (player.receptions || 0) * 1;
                if (player.pos === 'QB') {
                    // If player.points already includes 4pt/passTD, add 2 more per passTD
                    points += (player.passTds || 0) * 2;
                }
                break;
            default:
                // Default to PPR
                points += (player.receptions || 0) * 1;
                break;
        }
        return points;
    }

    // --- Generate Optimal Draft for User's Full Team ---
    function generateOptimalDraft(leagueSize, lineupConfig, benchSize, scoring, bonusTD, penaltyFumble, focus, userDraftPick) {
        const requirements = {};
        lineupConfig.forEach(req => {
            const [_, count, pos] = req.match(/(\d+)([A-Z]+)/) || [];
            if (count && pos) requirements[pos] = parseInt(count);
        });
        requirements['FLEX'] = requirements['FLEX'] || 0;
        const benchPlan = { QB: 1, TE: 1, RB: 0, WR: 0 };
        let benchLeft = benchSize - 2;
        benchPlan.RB = Math.floor(benchLeft / 2);
        benchPlan.WR = benchLeft - benchPlan.RB;

        const drafted = { QB: 0, RB: 0, WR: 0, TE: 0, FLEX: 0, K: 0, DST: 0 };
        let availablePlayers = [...adpPlayers].map(p => {
            const stddev = getDraftStdDev(p.adp);
            return {
                ...p,
                randomizedADP: randomNormal(p.adp, stddev),
                adjustedPoints: adjustDraftPlayerPoints(p, scoring)
            };
        }).sort((a, b) => a.randomizedADP - b.randomizedADP);

        const totalRosterSize = lineupConfig.length + benchSize;
        const userTeam = [];
        let userPickIdx = userDraftPick - 1;

        for (let round = 0; round < totalRosterSize; round++) {
            let pickNum = round * leagueSize + (round % 2 === 0 ? userPickIdx : leagueSize - userPickIdx - 1);
            let player = null;
            if (userTeam.length < lineupConfig.length) {
                let neededPos = Object.keys(requirements).find(pos => drafted[pos] < (requirements[pos] || 0));
                if (neededPos === 'FLEX') {
                    let candidates = availablePlayers.filter(p => ['RB', 'WR', 'TE'].includes(p.pos));
                    if (focus !== 'balanced' && ['RB', 'WR', 'TE'].includes(focus)) {
                        candidates = candidates.sort((a, b) => {
                            if (a.pos === focus && b.pos !== focus) return -1;
                            if (b.pos === focus && a.pos !== focus) return 1;
                            return a.randomizedADP - b.randomizedADP;
                        });
                    }
                    player = candidates[0];
                    drafted.FLEX++;
                } else {
                    let candidates = availablePlayers.filter(p => p.pos === neededPos);
                    if (focus === neededPos) {
                        candidates = candidates.sort((a, b) => (a.randomizedADP - 10) - (b.randomizedADP - 10));
                    } else {
                        candidates = candidates.sort((a, b) => a.randomizedADP - b.randomizedADP);
                    }
                    player = candidates[0];
                    drafted[neededPos]++;
                }
                if (!player) player = availablePlayers[0];
            } else {
                let benchPos = Object.keys(benchPlan).find(pos => drafted[pos] - (requirements[pos] || 0) < benchPlan[pos]);
                if (benchPos) {
                    let candidates = availablePlayers.filter(p => p.pos === benchPos);
                    if (focus === benchPos) {
                        candidates = candidates.sort((a, b) => (a.randomizedADP - 10) - (b.randomizedADP - 10));
                    } else {
                        candidates = candidates.sort((a, b) => a.randomizedADP - b.randomizedADP);
                    }
                    player = candidates[0];
                    drafted[benchPos]++;
                }
                if (!player && focus !== 'balanced') {
                    let candidates = availablePlayers.filter(p => p.pos === focus);
                    if (candidates.length) {
                        candidates = candidates.sort((a, b) => (a.randomizedADP - 10) - (b.randomizedADP - 10));
                        player = candidates[0];
                        drafted[focus]++;
                    }
                }
                if (!player) {
                    let candidates = availablePlayers.filter(p => ['RB', 'WR'].includes(p.pos));
                    player = candidates[0];
                    if (player) drafted[player.pos]++;
                }
                if (!player) player = availablePlayers[0];
            }
            if (player) {
                userTeam.push({
                    player,
                    round: round + 1,
                    pick: (round % 2 === 0 ? userPickIdx + 1 : leagueSize - userPickIdx),
                    overall: pickNum + 1
                });
                availablePlayers = availablePlayers.filter(p => p.name !== player.name);
            }
            for (let i = 1; i < leagueSize; i++) {
                availablePlayers.shift();
            }
        }

        buildResultDraft.innerHTML = `
            <h3 class="text-xl font-bold">Your Drafted Team</h3>
            <ul class="list-disc pl-5">
                ${userTeam.map(entry => {
                    let color = entry.player.pos === 'RB' ? 'text-green-700'
                        : entry.player.pos === 'WR' ? 'text-blue-700'
                        : entry.player.pos === 'QB' ? 'text-orange-700'
                        : entry.player.pos === 'TE' ? 'text-purple-700'
                        : 'text-gray-800';
                    return `<li class="player-list-item ${color}" data-player="${encodeURIComponent(entry.player.name)}">
                        Round ${entry.round}, Pick ${entry.pick} (Overall ${entry.overall}): ${entry.player.name} (${entry.player.pos})
                    </li>`;
                }).join('')}
            </ul>
        `;
        document.querySelectorAll('.player-list-item').forEach(item => {
            item.addEventListener('click', e => {
                const playerName = decodeURIComponent(item.dataset.player);
                const details = playerDetailsMap[playerName];
                if (!details) {
                    alert('No details found for this player.');
                    return;
                }
                const popup = document.getElementById('player-popup');
                popup.innerHTML = `
                    <span class="close-btn" onclick="this.parentElement.classList.add('hidden')">&times;</span>
                    <h4 class="font-bold text-lg mb-1">${details.name} (${details.pos}, ${details.team})</h4>
                    <div class="text-xs text-gray-600 mb-2">Age: ${details.age || 'N/A'} | Bye: ${details.bye || 'N/A'}</div>
                    <div class="mb-2">College: ${details.college || 'N/A'}</div>
                    <div class="mb-2">Height/Weight: ${details.height || 'N/A'} / ${details.weight || 'N/A'}</div>
                    <div class="mb-2">Experience: ${details.years_exp || 'N/A'} years</div>
                    <div class="mb-2">Injury Status: ${details.injury_status || 'Healthy'}</div>
                `;
                popup.classList.remove('hidden');
                popup.style.top = (e.clientY + 10) + 'px';
                popup.style.left = (e.clientX + 10) + 'px';
            });
        });
        return userTeam;
    }

    // --- Random Normal Distribution ---
    function randomNormal(mean, stddev) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return Math.max(1, mean + stddev * num);
    }

    // --- Get Draft Standard Deviation ---
    function getDraftStdDev(adp) {
        if (adp <= 12) return 0.7;
        if (adp <= 24) return 1.5;
        if (adp <= 50) return adp * 0.10;
        if (adp <= 100) return adp * 0.20;
        return adp * 0.35;
    }

    // --- Listen for scoring type changes and reload data ---
    if (scoringTypeSelect) {
        scoringTypeSelect.addEventListener('change', () => {
            currentScoringType = scoringTypeSelect.value;
            loadPlayerData(currentScoringType);
        });
    }

    // --- Draft Button ---
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

    // --- Sleeper API Player Details ---
    let playerDetailsMap = {};
    function loadPlayerDetailsFromSleeper(callback) {
        showLoadingSpinner(true);
        fetch('https://api.sleeper.app/v1/players/nfl')
            .then(res => res.json())
            .then(data => {
                playerDetailsMap = {};
                Object.values(data).forEach(p => {
                    if (p.active && p.team && p.position && p.full_name) {
                        playerDetailsMap[p.full_name] = {
                            name: p.full_name,
                            team: p.team,
                            pos: p.position,
                            age: p.age,
                            bye: p.bye_week,
                            years_exp: p.years_exp,
                            college: p.college,
                            height: p.height,
                            weight: p.weight,
                            injury_status: p.injury_status,
                            search_rank: p.search_rank,
                            player_id: p.player_id
                        };
                    }
                });
                showLoadingSpinner(false);
                if (callback) callback();
            })
            .catch(() => {
                playerDetailsMap = {};
                showLoadingSpinner(false);
                alert('Could not load player data from Sleeper API. Some features may not work.');
                if (callback) callback();
            });
    }
    loadPlayerDetailsFromSleeper();

    // --- Popup close on outside click ---
    document.addEventListener('click', function(e) {
        const popup = document.getElementById('player-popup');
        if (popup && !popup.contains(e.target) && !e.target.classList.contains('player-list-item')) {
            popup.classList.add('hidden');
        }
    });

    // --- Trade Analyzer with Sleeper API ---

    // 1. Fetch live player data from Sleeper API
    let playersData = [];
    let team1 = [], team2 = [];

    async function fetchSleeperPlayers() {
        // Fetch all NFL players
        const res = await fetch('https://api.sleeper.app/v1/players/nfl');
        const data = await res.json();

        // Filter for active, fantasy-relevant players (QB, RB, WR, TE)
        playersData = Object.values(data)
            .filter(p =>
                p.active &&
                ['QB', 'RB', 'WR', 'TE'].includes(p.position) &&
                p.full_name &&
                p.team
            )
            .map(p => ({
                name: p.full_name,
                pos: p.position,
                team: p.team,
                pts: p.fantasy_points_2023 || 0, // Use last season's points if available
                value: calculateTradeValue(p),
                bye: p.bye_week || '',
                matchup: '', // You can enhance this with another API call if desired
                img: p.headshot_url || 'https://static.www.nfl.com/image/private/t_headshot_desktop/league/api/players/default.png'
            }))
            // Sort by value descending for better UX
            .sort((a, b) => b.value - a.value);

        // Initialize analyzer with new data
        autocomplete('player1-search', 'player1-autocomplete', team1, team2, 'team1-players');
        autocomplete('player2-search', 'player2-autocomplete', team2, team1, 'team2-players');
        renderTeam('team1-players', team1, 'team1');
        renderTeam('team2-players', team2, 'team2');
        renderRecentTrades();
    }

    // 2. Trade Value Calculation (improve this logic as you wish)
    function calculateTradeValue(player) {
        // If fantasy points available, use as base value
        let base = player.fantasy_points_2023 || 0;
        // Give positional bonuses (QBs and TEs are less valuable in 1QB leagues)
        if (player.position === 'RB') base *= 1.15;
        if (player.position === 'WR') base *= 1.10;
        if (player.position === 'TE') base *= 0.95;
        if (player.position === 'QB') base *= 0.85;
        // If no points, assign a low value
        if (!base) base = 10;
        return Math.round(base);
    }

    // 3. Autocomplete (unchanged, but now uses live data)
    function autocomplete(inputId, listId, teamArr, otherTeamArr, teamDivId) {
        const input = document.getElementById(inputId);
        const list = document.getElementById(listId);
        input.addEventListener('input', function() {
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
                li.textContent = `${player.name} (${player.team} ${player.pos})`;
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

    // 4. Render Team (unchanged)
    function renderTeam(divId, teamArr, teamKey) {
        const div = document.getElementById(divId);
        div.innerHTML = '';
        teamArr.forEach((player, idx) => {
            const card = document.createElement('div');
            card.className = `player-card player-pos-${player.pos}`;
            card.draggable = true;
            card.innerHTML = `
                <img src="${player.img}" alt="${player.name}" class="w-10 h-10 rounded-full border-2 border-yellow-400 object-cover" onerror="this.src='https://static.www.nfl.com/image/private/t_headshot_desktop/league/api/players/default.png'">
                <div>
                    <div class="font-bold">${player.name} <span class="text-teal">(${player.team} ${player.pos})</span></div>
                    <div class="text-yellow font-semibold">${player.pts} pts</div>
                    <div class="text-xs text-gray-400">Bye: ${player.bye}</div>
                </div>
                <button class="remove-btn" title="Remove Player">&times;</button>
            `;
            card.querySelector('.remove-btn').onclick = () => {
                teamArr.splice(idx, 1);
                renderTeam(divId, teamArr, teamKey);
            };
            // Drag & drop
            card.ondragstart = e => {
                e.dataTransfer.setData('playerIdx', idx);
                e.dataTransfer.setData('teamKey', teamKey);
            };
            div.appendChild(card);
        });
        // Allow drop from other team
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

    // 6. Analyze Trade (uses live trade values)
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

        // AI Advice (edit advice logic here)
        let advice = '';
        if (fairness < 10) advice = "This trade is as even as it gets. Both teams win!";
        else if (team1Value > team2Value) advice = `Team 1 is getting more value. Team 2, ask for a sweetener!`;
        else advice = `Team 2 is getting the edge. Team 1, try to negotiate for more!`;
        if (team1.some(p => p.bye && team2.some(tp => tp.bye === p.bye))) advice += " Watch out for bye week overlap!";
        document.getElementById('ai-advice').textContent = advice;

        // Save to recent trades
        const tradeSummary = `${team1.map(p=>p.name).join(', ') || 'None'} ⇄ ${team2.map(p=>p.name).join(', ') || 'None'} (${fairnessText})`;
        let trades = JSON.parse(localStorage.getItem('recentTrades') || '[]');
        trades.unshift(tradeSummary);
        trades = trades.slice(0, 5);
        localStorage.setItem('recentTrades', JSON.stringify(trades));
        renderRecentTrades();
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
