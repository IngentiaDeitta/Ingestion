import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def check_type_constraint():
    try:
        # Try to insert a dummy withdrawal transaction
        res = supabase.table("finances").insert({
            "description": "Test Withdrawal",
            "amount": 0,
            "type": "withdrawal",
            "date": "2024-05-06"
        }).execute()
        print("Insert successful, 'withdrawal' type is allowed.")
        # Delete the test record
        if res.data:
            supabase.table("finances").delete().eq("id", res.data[0]["id"]).execute()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_type_constraint()
