import os
from flask import Flask, request, jsonify, send_from_directory
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, static_folder='.', static_url_path='')

# Route to serve your HTML files
@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory('.', path)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# Route to handle the AI API requests
@app.route('/api/generate', methods=['POST'])
def generate_content():
    API_KEY = os.getenv("API_KEY")
    if not API_KEY:
        return jsonify({"error": "API key not configured on the server."}), 500

    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({"error": "No prompt provided."}), 400

    try:
        response = requests.post(
            f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}',
            headers={'Content-Type': 'application/json'},
            json={"contents": [{"parts": [{"text": prompt}]}]}
        )
        response.raise_for_status()  # This will raise an exception for bad status codes
        return jsonify(response.json())

    except requests.exceptions.RequestException as e:
        print(f"Server Error: {e}")
        return jsonify({"error": "Failed to fetch from Google AI API."}), 500

if __name__ == '__main__':
    app.run(port=3000, debug=True)