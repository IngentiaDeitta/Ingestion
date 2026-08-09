import glob
import os
import re

pages_dir = r"c:\Ingestion\src\pages"
files = glob.glob(os.path.join(pages_dir, "*.tsx"))

HEADER_TITLE_REPLACEMENTS = [
    # Class replacements for Page Main Titles
    (r'text-4xl md:text-\[42px\] font-normal', 'text-2xl md:text-3xl font-semibold'),
    (r'text-3xl md:text-\[42px\] font-normal', 'text-2xl md:text-3xl font-semibold'),
    (r'text-\[42px\] font-normal', 'text-2xl md:text-3xl font-semibold'),
    (r'text-4xl font-semibold text-\[#1A1A1A\]', 'text-2xl md:text-3xl font-semibold text-[#1A1A1A]'),
    (r'text-4xl font-extrabold tracking-tighter', 'text-2xl md:text-3xl font-bold tracking-tight'),
    (r'text-2xl md:text-\[32px\] font-normal', 'text-2xl md:text-3xl font-semibold'),
    
    # Rounded corners and paddings scale harmonization
    (r'rounded-\[32px\]', 'rounded-2xl'),
    (r'rounded-\[24px\]', 'rounded-xl'),
]

modified_count = 0

for filepath in files:
    if filepath.endswith('.backup'):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, repl in HEADER_TITLE_REPLACEMENTS:
        new_content = re.sub(pattern, repl, new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        modified_count += 1
        print(f"Updated scale in: {os.path.basename(filepath)}")

print(f"Total files updated: {modified_count}")
