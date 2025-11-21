import requests
import sys

API_URL = "https://docmind0516-production.up.railway.app"
USER_ID = "user_35jBoKJruGS7H9k2fMGLY54Dwrp" # 使用你截图中的 ID

def test_chat():
    print(f"Testing Chat API at {API_URL}...")
    
    # 1. Test Root
    try:
        resp = requests.get(f"{API_URL}/")
        print(f"Root Check: {resp.status_code} - {resp.json()}")
    except Exception as e:
        print(f"Root Check Failed: {e}")
        return

    # 2. Test Settings (Should work if CORS is fine)
    try:
        resp = requests.get(f"{API_URL}/user/settings", headers={"user-id": USER_ID})
        print(f"Settings Check: {resp.status_code}")
    except Exception as e:
        print(f"Settings Check Failed: {e}")

    # 3. Test Chat (The failing part)
    print("\nSending Chat Request...")
    try:
        resp = requests.post(
            f"{API_URL}/chat",
            json={"question": "Hello"},
            headers={"user-id": USER_ID}
        )
        
        if resp.status_code == 200:
            print(f"✅ Chat Success: {resp.json()}")
        else:
            print(f"❌ Chat Failed: {resp.status_code}")
            print(f"Error Detail: {resp.text}")
            
    except Exception as e:
        print(f"Chat Request Error: {e}")

if __name__ == "__main__":
    test_chat()
