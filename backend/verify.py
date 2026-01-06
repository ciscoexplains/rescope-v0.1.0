import requests
import json
import sys

API_URL = "http://127.0.0.1:8090"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASS = "1234567890"

def get_token():
    try:
        resp = requests.post(f"{API_URL}/api/collections/_superusers/auth-with-password", json={
            "identity": ADMIN_EMAIL,
            "password": ADMIN_PASS
        })
        resp.raise_for_status()
        return resp.json()["token"]
    except Exception as e:
        print(f"Auth failed: {e}")
        sys.exit(1)

def check_data():
    token = get_token()
    headers = {"Authorization": token}
    
    print("--- Collection Schema ---")
    try:
        r = requests.get(f"{API_URL}/api/collections/search_trends", headers=headers)
        r.raise_for_status()
        print(json.dumps(r.json(), indent=2))
    except Exception as e:
        print(f"Failed to get collection: {e}")

    print("\n--- First Record ---")
    try:
        r = requests.get(f"{API_URL}/api/collections/search_trends/records?perPage=1", headers=headers)
        r.raise_for_status()
        print(json.dumps(r.json(), indent=2))
    except Exception as e:
        print(f"Failed to get records: {e}")

if __name__ == "__main__":
    check_data()
