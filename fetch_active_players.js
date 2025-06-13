const fs = require('fs');

async function fetchActivePlayers() {
    try {
        const response = await fetch('https://api.sleeper.app/v1/players/nfl', { timeout: 10000 });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        const activePlayers = Object.values(data).filter(player => 
            player.active && 
            ['QB', 'RB', 'WR', 'TE'].includes(player.position)
        );

        const playerList = activePlayers.map(player => ({
            name: player.full_name,
            position: player.position,
            team: player.team || 'FA',
            player_id: player.player_id
        }));

        fs.writeFileSync('active_players.json', JSON.stringify(playerList, null, 2));
        console.log('Active players saved to active_players.json');
    } catch (error) {
        console.error('Error fetching active players:', error.message);
        if (error.code === 'EAI_AGAIN') {
            console.log('Network issue detected. Using fallback local data or retrying...');
        }
    }
}

fetchActivePlayers();