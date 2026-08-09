import re
import os

filepath = r"c:\Ingestion\src\pages\Finance.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    # Global layout gap & padding
    ('className="flex-1 flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-12"', 
     'className="flex-1 flex flex-col gap-5 w-full max-w-[1400px] mx-auto pb-8"'),
    
    # Header title and subtitle
    ('h3 className="text-4xl md:text-[42px] font-normal tracking-tight text-[#1A1A1A]"', 
     'h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1A1A1A]"'),
    ('p className="text-[#666666] mt-1"', 
     'p className="text-xs text-[#666666] mt-0.5"'),
    ('px-6 py-3 rounded-full border border-black/10 text-sm font-medium hover:bg-black/5 transition-colors', 
     'px-4 py-2 rounded-xl border border-black/10 text-xs font-medium hover:bg-black/5 transition-colors'),
    ('<Download size={18} />', '<Download size={15} />'),
    ('px-8 py-3 rounded-full text-sm font-medium transition-colors shadow-lg', 
     'px-5 py-2 rounded-xl text-xs font-medium transition-colors shadow-md'),
    
    # KPIs Cards
    ('rounded-[32px] p-6 shadow-xl', 'rounded-2xl p-4 shadow-sm'),
    ('rounded-[32px] p-6 border border-white/40 shadow-sm', 'rounded-2xl p-4 border border-white/40 shadow-sm'),
    ('p-3 bg-white/10 rounded-2xl', 'p-2 bg-white/10 rounded-xl'),
    ('p-3 bg-black/5 rounded-2xl', 'p-2 bg-black/5 rounded-xl'),
    ('<DollarSign size={24} />', '<DollarSign size={18} />'),
    ('<DollarSign size={24} className="text-[#666]" />', '<DollarSign size={18} className="text-[#666]" />'),
    ('px-3 py-1 rounded-full text-xs font-bold', 'px-2.5 py-0.5 rounded-md text-[10px] font-bold'),
    ('text-white/70 text-sm font-medium mb-1', 'text-white/70 text-xs font-medium mb-1'),
    ('text-[#666] text-sm font-medium mb-1', 'text-[#666] text-xs font-medium mb-1'),
    ('h4 className="text-4xl font-light text-white"', 'h4 className="text-2xl font-medium text-white"'),
    ('h4 className="text-4xl font-light text-[#1A1A1A]"', 'h4 className="text-2xl font-medium text-[#1A1A1A]"'),
    
    # Balance row
    ('text-4xl font-light ${totalBalanceARS < 0 ? \'text-red-400\' : \'text-white\'}', 
     'text-2xl font-medium ${totalBalanceARS < 0 ? \'text-red-400\' : \'text-white\'}'),
    ('text-3xl font-light ${c.net >= 0 ? \'text-[#1A1A1A]\' : \'text-red-500\'}', 
     'text-xl font-medium ${c.net >= 0 ? \'text-[#1A1A1A]\' : \'text-red-500\'}'),
    
    # Analytics Row (Charts)
    ('grid grid-cols-1 lg:grid-cols-2 gap-6', 'grid grid-cols-1 lg:grid-cols-2 gap-4'),
    ('rounded-[32px] border border-white/40 shadow-sm p-8', 'rounded-2xl border border-white/40 shadow-sm p-5'),
    ('h4 className="text-xl font-medium text-[#1A1A1A]"', 'h4 className="text-sm font-semibold text-[#1A1A1A]"'),
    ('<TrendingUp size={20} className="text-[#666]" />', '<TrendingUp size={16} className="text-[#666]" />'),
    ('<Tag size={20} className="text-[#666]" />', '<Tag size={16} className="text-[#666]" />'),
    ('className="h-64"', 'className="h-48"'),
    ('className="h-64 flex flex-col items-center"', 'className="h-48 flex flex-col items-center"'),
    ('innerRadius={60}', 'innerRadius={42}'),
    ('outerRadius={80}', 'outerRadius={60}'),
    
    # Partner Balances (Socios)
    ('flex flex-col gap-6', 'flex flex-col gap-4'),
    ('h4 className="text-2xl font-medium text-[#1A1A1A]"', 'h4 className="text-base font-semibold text-[#1A1A1A]"'),
    ('p className="text-[#666666]">Saldos acumulados', 'p className="text-xs text-[#666666]">Saldos acumulados'),
    ('p-3 bg-white/50 rounded-2xl border border-black/5 shadow-sm', 'p-2 bg-white/50 rounded-xl border border-black/5 shadow-sm'),
    ('<Zap size={20} className="text-[#FFD166]" />', '<Zap size={16} className="text-[#FFD166]" />'),
    ('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'),
    ('p-8 flex flex-col gap-6 transition-transform hover:scale-[1.02]', 'p-5 flex flex-col gap-4 transition-transform hover:scale-[1.01]'),
    ('text-lg font-bold text-[#1A1A1A] uppercase tracking-tight', 'text-xs font-bold text-[#1A1A1A] uppercase tracking-tight'),
    ('px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest', 'px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider'),
    ('text-xl font-medium text-[#1A1A1A]', 'text-xs font-semibold text-[#1A1A1A]'),
    ('text-xl font-medium text-red-500', 'text-xs font-semibold text-red-500'),
    ('pt-6 border-t border-black/5 flex flex-col gap-2', 'pt-3 border-t border-black/5 flex flex-col gap-1.5'),
    ('text-4xl font-light ${pb.balance <= 0', 'text-xl font-medium ${pb.balance <= 0'),
    ('col-span-full py-12 text-center bg-black/[0.02] rounded-[32px]', 'col-span-full py-8 text-center bg-black/[0.02] rounded-2xl'),
    
    # Transactions Table
    ('rounded-[32px] border border-white/40 shadow-sm min-h-[500px]', 'rounded-2xl border border-white/40 shadow-sm min-h-[350px]'),
    ('p-8 border-b border-black/5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center', 
     'p-4 border-b border-black/5 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center'),
    ('px-6 py-2.5 rounded-full text-sm font-medium transition-all', 'px-4 py-1.5 rounded-xl text-xs font-medium transition-all'),
    ('px-8 py-6 border-b border-black/5 flex flex-wrap gap-6 bg-black/[0.02]', 'px-4 py-3 border-b border-black/5 flex flex-wrap gap-4 bg-black/[0.02]'),
    ('h-10 rounded-xl border border-black/10 bg-white px-3 text-sm', 'h-8 rounded-lg border border-black/10 bg-white px-2.5 text-xs'),
    ('h-10 px-6 rounded-xl text-sm', 'h-8 px-4 rounded-lg text-xs'),
    ('px-8 py-6 text-[11px] font-bold text-[#999] uppercase tracking-widest', 'px-4 py-3 text-[10px] font-bold text-[#999] uppercase tracking-widest'),
    ('px-8 py-5 whitespace-nowrap text-sm text-[#1A1A1A] font-medium', 'px-4 py-2.5 whitespace-nowrap text-xs text-[#1A1A1A] font-medium'),
    ('px-8 py-5', 'px-4 py-2.5'),
    ('text-sm text-[#1A1A1A] font-medium', 'text-xs text-[#1A1A1A] font-medium'),
    ('text-sm text-[#666]', 'text-xs text-[#666]'),
    ('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide', 'px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide'),
    ('p-2 rounded-full hover:bg-white', 'p-1.5 rounded-lg hover:bg-white'),
    
    # Motor de Comisiones
    ('rounded-[32px] border border-white/40 shadow-sm overflow-hidden mt-8', 'rounded-2xl border border-white/40 shadow-sm overflow-hidden mt-4'),
    ('p-6 md:p-8 border-b border-black/5 flex justify-between items-center bg-white/50', 'p-4 md:px-5 border-b border-black/5 flex justify-between items-center bg-white/50'),
    ('p-3 bg-[#FFD166]/20 rounded-2xl', 'p-2 bg-[#FFD166]/20 rounded-xl'),
    ('py-4 px-6 text-xs font-semibold text-[#666666] uppercase tracking-wider', 'py-2.5 px-4 text-[10px] font-semibold text-[#666666] uppercase tracking-wider'),
    ('py-4 px-6 text-sm font-medium', 'py-2.5 px-4 text-xs font-medium'),
    ('py-4 px-6 text-sm text-[#666]', 'py-2.5 px-4 text-xs text-[#666]'),
    ('py-4 px-6 text-sm text-right', 'py-2.5 px-4 text-xs text-right'),
    ('py-8 text-center text-[#666] italic', 'py-4 text-center text-[#666] text-xs italic'),
]

new_content = content
for old_str, new_str in replacements:
    if old_str in new_content:
        new_content = new_content.replace(old_str, new_str)
    else:
        print(f"WARN: Target string not found: {old_str[:40]}...")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Successfully updated Finance.tsx scale!")
