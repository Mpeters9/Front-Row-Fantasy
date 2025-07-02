import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
import requests
from dotenv import load_dotenv

# This line loads the variables from your .env file
load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')

def get_db_connection():
    conn = sqlite3.connect('players.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/players', methods=['GET'])
def get_all_players():
    conn = get_db_connection()
    players = conn.execute('SELECT * FROM players').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in players])

@app.route('/api/generate', methods=['POST'])
def generate_content():
    # Securely load the API key from environment variables
    API_KEY = os.getenv("API_KEY")
    
    if not API_KEY:
        # This error will show if the .env file is missing or the key is not set
        return jsonify({"error": "API key not found. Make sure it is set in the .env file."}), 500
    
    data = request.get_json()
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({"error": "No prompt provided."}), 400

    api_url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={API_KEY}'
    
    try:
        response = requests.post(
            api_url,
            headers={'Content-Type': 'application/json'},
            json={"contents": [{"parts": [{"text": prompt}]}]}
        )
        response.raise_for_status()
        
        api_response = response.json()
        
        if 'candidates' in api_response and api_response['candidates'][0].get('content', {}).get('parts', [{}])[0].get('text'):
             return jsonify(api_response)
        else:
             return jsonify({"error": "Unexpected response structure from AI.", "details": api_response}), 500
    
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err.response.text}")
        return jsonify({"error": "Failed to fetch from Google AI API.", "details": http_err.response.text}), http_err.response.status_code
    except requests.exceptions.RequestException as req_err:
        print(f"Request error occurred: {req_err}")
        return jsonify({"error": "Failed to fetch from Google AI API."}), 500

if __name__ == '__main__':
    app.run(port=3000, debug=True)