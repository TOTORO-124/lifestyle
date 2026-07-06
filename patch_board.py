import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_bg = "bg-[#1A4D2E] text-white rounded-lg shadow-2xl relative overflow-hidden transition-all duration-300"
replacement_bg = "bg-[#1A4D2E] text-white rounded-lg shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-300"

content = content.replace(target_bg, replacement_bg)

# Add a felt texture overlay
target_style = "<style>{`"
replacement_style = """      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      <style>{`"""

content = content.replace(target_style, replacement_style)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
