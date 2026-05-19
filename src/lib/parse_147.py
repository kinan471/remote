import json

with open(r"C:\Users\MKH\.gemini\antigravity\brain\fcecef65-415d-4fb3-af40-95df5dd685ad\.system_generated\steps\147\output.txt", "r", encoding="utf-8") as f:
    content = f.read()

# The file format is a JSON with a "result" key: {"result":"Below is the result of the SQL query...\n\n[{\"id\":..."}
# Let's load the main JSON first!
try:
    outer_json = json.loads(content)
    result_text = outer_json["result"]
    
    # Extract the nested JSON array
    start_idx = result_text.find("[{")
    end_idx = result_text.rfind("}]") + 2
    inner_json_str = result_text[start_idx:end_idx]
    
    products = json.loads(inner_json_str)
    print(f"Total products: {len(products)}")
    for i, p in enumerate(products):
        print(f"\nProduct {i+1}:")
        for k, v in p.items():
            val_str = str(v)
            if len(val_str) > 100:
                val_str = val_str[:100] + "..."
            print(f"  {k}: {val_str}")
except Exception as e:
    print("Error parsing JSON:", e)
