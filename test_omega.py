import requests
import json

url = "http://127.0.0.1:8000/analyze"

payload = {
    "project_id": "test_omega_project",
    "project_name": "Weather App React",
    "github_url": "https://github.com/test-user/weather-app",
    "analysis_mode": "Deep Mode"
}

print("Initiating Omega Analysis Pipeline...")
response = requests.post(url, json=payload, timeout=60)

with open("omega_result.json", "w") as f:
    json.dump(response.json(), f, indent=2)

print(f"Status: {response.status_code}")
print("Result written to omega_result.json")
