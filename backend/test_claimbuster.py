import requests

CLAIMBUSTER_API_KEY = "6131961d28614aa9bd783f1fbe55362e"

response = requests.post(
    'https://idir.uta.edu/claimbuster/api/v2/score/text/',
    headers={'x-api-key': CLAIMBUSTER_API_KEY},
    json={'input_text': "President Obama was born in Kenya."}
)

print(response.status_code)
print(response.json())
