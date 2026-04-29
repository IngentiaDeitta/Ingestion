import os
import re

def update_sidebar():
    file_path = 'src/components/Sidebar.tsx'
    
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Current version has h-[56px]
    current_branding = """      {/* Logo Section */}
      <div className="h-24 flex items-center justify-center px-8 border-b border-black/[0.02]">
        <img 
          src="/Recursos/Logo Blanco_T.png" 
          alt="Ingentia Management" 
          className="h-[56px] w-auto object-contain"
        />
      </div>"""

    # New version: h-[58px] as requested
    new_branding = """      {/* Logo Section */}
      <div className="h-24 flex items-center justify-center px-8 border-b border-black/[0.02]">
        <img 
          src="/Recursos/Logo Blanco_T.png" 
          alt="Ingentia Management" 
          className="h-[58px] w-auto object-contain"
        />
      </div>"""
    
    if current_branding in content:
        new_content = content.replace(current_branding, new_branding)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully updated Sidebar.tsx logo size to 58px.")
    else:
        print("Could not find the current branding block to replace.")

if __name__ == "__main__":
    update_sidebar()
