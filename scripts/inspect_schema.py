import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def get_schema():
    # Since we can't easily query information_schema via RPC without extra setup,
    # we'll try to fetch one row from known tables to see the structure.
    tables = ["finances", "clients", "projects", "tasks", "partners"]
    for table in tables:
        try:
            res = supabase.table(table).select("*").limit(1).execute()
            print(f"\nTable: {table}")
            if res.data:
                print(f"Columns: {list(res.data[0].keys())}")
            else:
                print("Table exists but is empty or doesn't exist.")
        except Exception as e:
            print(f"Error querying table {table}: {e}")

if __name__ == "__main__":
    get_schema()
