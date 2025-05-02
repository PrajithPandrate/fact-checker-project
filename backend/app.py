import os
from flask import Flask, request, jsonify
import vertexai
from vertexai.generative_models import GenerativeModel

# Set credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "service_account.json"

# Initialize Vertex AI with your project
vertexai.init(project="gemini-enabled-factchecker", location="us-central1")

# Use the auto-updating alias for Gemini 2.0 Flash
model = model = GenerativeModel("gemini-2.0-flash")


app = Flask(__name__)

@app.route('/factcheck', methods=['POST'])
def fact_check():
    try:
        text = request.get_json().get('text', '').strip()
        print(f"[GEMINI FACT CHECK] Input: {text}")

        prompt = f"""
You are a trusted fact-checking AI. Analyze the following statement:
Verdict: TRUE, FALSE, MISLEADING, or UNVERIFIABLE
Summary with sources if applicable.

Statement: "{text}"
"""

        response = model.generate_content(prompt)
        summary = response.text.strip()

        return jsonify({
            'verdict': 'Gemini Evaluation',
            'summary': summary,
            'source': 'Gemini 1.5 Pro',
            'url': '',
            'claim': text
        })

    except Exception as e:
        print("[GEMINI ERROR]", e)
        return jsonify({'error': 'Gemini failed: ' + str(e)}), 500
