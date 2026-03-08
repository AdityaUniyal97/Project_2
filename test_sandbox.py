"""Full sandbox integration test - writes results to JSON file"""
import requests
import json

url = "http://127.0.0.1:8000/execute-challenge"
all_results = []

# Test 1: Correct Python function - should PASS
r = requests.post(url, json={
    "student_code": "def add(a, b):\n    return a + b",
    "language": "python",
    "test_cases": [
        {"input": {"a": 2, "b": 3}, "expected_output": 5},
        {"input": {"a": -1, "b": 1}, "expected_output": 0},
        {"input": {"a": 0, "b": 0}, "expected_output": 0}
    ]
})
all_results.append({"test": "correct_add_PASS", "result": r.json()})

# Test 2: Wrong implementation - should FAIL
r = requests.post(url, json={
    "student_code": "def add(a, b):\n    return a * b",
    "language": "python",
    "test_cases": [
        {"input": {"a": 2, "b": 3}, "expected_output": 5},
        {"input": {"a": 0, "b": 0}, "expected_output": 0}
    ]
})
all_results.append({"test": "wrong_impl_FAIL", "result": r.json()})

# Test 3: Security violation - should ERROR
r = requests.post(url, json={
    "student_code": "import os\nos.system('dir')\ndef add(a, b):\n    return a + b",
    "language": "python",
    "test_cases": [{"input": {"a": 1, "b": 1}, "expected_output": 2}]
})
all_results.append({"test": "security_ERROR", "result": r.json()})

with open("sb_full_results.json", "w") as f:
    json.dump(all_results, f, indent=2)

# Summary
for t in all_results:
    r = t["result"]
    print(f"{t['test']}: verdict={r.get('verdict')} passed={r.get('passed_tests')}/{r.get('total_tests')} time={r.get('execution_time_ms')}ms")
