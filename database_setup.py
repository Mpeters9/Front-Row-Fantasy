import sqlite3
import json

def setup_database():
    # Connect to (or create) the database file
    conn = sqlite3.connect('players.db')
    cursor = conn.cursor()

    # Create the players table if it doesn't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            team TEXT,
            position TEXT,
            bye INTEGER,
            adp_ppr REAL,
            adp_hppr REAL,
            adp_standard REAL,
            tier INTEGER,
            vorp REAL,
            fantasy_points REAL,
            pass_yds INTEGER,
            pass_tds INTEGER,
            ints INTEGER,
            rush_att INTEGER,
            rush_yds INTEGER,
            targets INTEGER,
            receptions INTEGER,
            rec_yds INTEGER,
            air_yards INTEGER,
            redzone_touches INTEGER,
            yprr REAL,
            ai_tag TEXT
        )
    ''')

    # Load data from the JSON file
    with open('players.json', 'r') as f:
        players_data = json.load(f)

    # Insert data into the table
    for player in players_data:
        cursor.execute('''
            INSERT INTO players (
                name, team, position, bye, adp_ppr, adp_hppr, adp_standard, tier, vorp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            player.get('name'),
            player.get('team'),
            player.get('position'),
            player.get('bye'),
            player.get('adp', {}).get('ppr'),
            player.get('adp', {}).get('hppr'),
            player.get('adp', {}).get('standard'),
            player.get('tier'),
            player.get('vorp')
        ))

    # Commit changes and close the connection
    conn.commit()
    conn.close()
    print("Database setup complete. 'players.db' is ready.")

if __name__ == '__main__':
    setup_database()