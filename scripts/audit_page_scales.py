import os
import glob
import re

pages = glob.glob(r"c:\Ingestion\src\pages\*.tsx")

print("=== PAGE AUDIT ===")
for p in pages:
    if p.endswith('.backup'): continue
    filename = os.path.basename(p)
    with open(p, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Find h1, h2, h3, h4 or headers
    headings = re.findall(r'<(h[1-6])[^>]*>(.*?)</\1>', content, re.DOTALL)
    heading_classes = re.findall(r'<(h[1-6])[^>]*className=["\']([^"\']+)["\'][^>]*>(.*?)</\1>', content, re.DOTALL)
    
    print(f"\n--- {filename} ---")
    for tag, cls, text in heading_classes[:10]:
        clean_text = re.sub(r'<[^>]+>', '', text).strip().replace('\n', ' ')
        print(f"  <{tag} class='{cls}'>: {clean_text[:40]}")

