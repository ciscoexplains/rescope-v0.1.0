import csv
import json
import urllib.request
import urllib.error
import sys
import time

API_URL = "http://127.0.0.1:8090"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASS = "1234567890"

def request(method, path, data=None, token=None):
    url = f"{API_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = token
    
    body = None
    if data:
        body = json.dumps(data).encode("utf-8")
    
    try:
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        with urllib.request.urlopen(req) as resp:
            if resp.getcode() >= 200 and resp.getcode() < 300:
                content = resp.read()
                if content:
                    return json.loads(content)
                return {}
            return None
    except urllib.error.HTTPError as e:
        if e.code == 404 and method == "GET": # Allow 404 for existing check
            raise e 
        print(f"HTTP Error {e.code} for {path}: {e.read().decode()}")
        raise
    except Exception as e:
        print(f"Request Error: {e}")
        raise

def get_token():
    print("Authenticating...")
    data = {
        "identity": ADMIN_EMAIL,
        "password": ADMIN_PASS
    }
    # Retry a few times in case server is just starting
    for i in range(5):
        try:
            resp = request("POST", "/api/collections/_superusers/auth-with-password", data)
            return resp["token"]
        except Exception:
            time.sleep(1)
    raise Exception("Could not authenticate")

def ensure_collection(token):
    print("Checking collection...")
    try:
        request("GET", "/api/collections/search_trends", token=token)
        print("Collection 'search_trends' already exists. Deleting to recreate...")
        request("DELETE", "/api/collections/search_trends", token=token)
    except urllib.error.HTTPError as e:
        if e.code != 404:
            raise

    print("Creating collection...")
    data = {
        "name": "search_trends",
        "type": "base",
        "fields": [
            {
                "name": "main_category",
                "type": "text",
                "required": True
            },
            {
                "name": "sub_category",
                "type": "text",
                "required": True
            },
            {
                "name": "queries",
                "type": "json",
                "required": False
            }
        ]
    }
    request("POST", "/api/collections", data, token)
    print("Collection created.")

def import_data(token):
    print("Importing data...")
    count = 0
    with open("trends.csv", "r") as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if not row: continue
            main_cat = row[0]
            sub_cat = row[1]
            queries = [q for q in row[2:] if q.strip()]
            
            payload = {
                "main_category": main_cat,
                "sub_category": sub_cat,
                "queries": queries
            }
            
            try:
                request("POST", "/api/collections/search_trends/records", payload, token)
                count += 1
            except Exception as e:
                print(f"Failed to import {sub_cat}: {e}")
    print(f"Successfully imported {count} records.")

if __name__ == "__main__":
    try:
        token = get_token()
        ensure_collection(token)
        import_data(token)
    except Exception as e:
        print(f"Script failed: {e}")
        sys.exit(1)
