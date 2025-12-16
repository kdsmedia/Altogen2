
import { ViewMode } from '../types';
import { state } from '../index'; // Access global state to check user

export const Sidebar = (currentMode: ViewMode) => {
  const mainNavItems = [
    { id: ViewMode.SETUP, label: 'Project Setup', icon: 'settings' },
    { id: ViewMode.ASSETS, label: 'Asset Generator', icon: 'image' },
    { id: ViewMode.STRUCTURE, label: 'Structure', icon: 'folder-tree' },
    { id: ViewMode.MONETIZATION, label: 'Monetization', icon: 'dollar-sign' },
    { id: ViewMode.CONFIG, label: 'Configuration', icon: 'file-code' },
  ];

  const infoNavItems = [
      { id: ViewMode.ABOUT, label: 'About App', icon: 'info' },
      { id: ViewMode.PRIVACY, label: 'Privacy Policy', icon: 'lock' },
      { id: ViewMode.DISCLAIMER, label: 'Disclaimer', icon: 'shield-alert' },
  ];

  const renderItem = (item: any) => {
    const isActive = currentMode === item.id;
    return `
      <button
        data-nav="${item.id}"
        class="group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
          isActive 
            ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] border border-cyan-500/20' 
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
        }"
      >
        <i data-lucide="${item.icon}" class="w-4.5 h-4.5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}"></i>
        <span class="font-medium tracking-wide text-sm">${item.label}</span>
        
        ${isActive ? '<div class="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-l-full shadow-[0_0_10px_2px_rgba(34,211,238,0.5)]"></div>' : ''}
      </button>
    `;
  };

  // User Profile Mini-Section
  const user = state.user;
  const userSection = user ? `
      <div class="mt-auto pt-4 px-2 pb-2">
         <button data-nav="${ViewMode.PROFILE}" class="w-full flex items-center gap-3 p-2 rounded-xl bg-slate-900/50 hover:bg-slate-800 border border-white/5 transition-colors group">
            <img src="${user.photoURL}" class="w-8 h-8 rounded-full border border-slate-600" />
            <div class="flex-1 text-left min-w-0">
                <p class="text-xs font-bold text-white truncate">${user.displayName}</p>
                <p class="text-[10px] text-slate-500 truncate">${user.plan === 'premium' ? 'Premium Plan' : 'Free Plan'}</p>
            </div>
            ${user.role === 'admin' ? '<i data-lucide="shield" class="w-3 h-3 text-purple-400"></i>' : ''}
         </button>
      </div>
  ` : `
      <div class="mt-auto pt-4 px-2 pb-2">
         <button data-nav="${ViewMode.PROFILE}" class="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all">
            <i data-lucide="log-in" class="w-4 h-4"></i> Login / Sign Up
         </button>
      </div>
  `;

  return `
    <aside class="w-full h-full flex flex-col border-r border-white/5 bg-[#0b1121] shadow-[5px_0_30px_-5px_rgba(0,0,0,0.3)] relative overflow-hidden">
      <!-- Background Effects -->
      <div class="absolute inset-0 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none"></div>
      
      <div class="p-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div class="flex items-center space-x-3">
            <div class="relative">
              <div class="absolute inset-0 bg-cyan-500/50 blur-lg rounded-full"></div>
              <i data-lucide="box" class="w-8 h-8 text-cyan-400 relative z-10"></i>
            </div>
            <div>
              <h1 class="text-xl font-bold text-white tracking-tight leading-none">AltoGen</h1>
              <span class="text-[10px] text-cyan-400 font-mono tracking-widest uppercase opacity-80">Studio</span>
            </div>
        </div>
        
        <!-- Close Button -->
        <button id="menu-close" class="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto relative z-10 custom-scrollbar flex flex-col">
        ${mainNavItems.map(renderItem).join('')}
        
        <!-- Cloud Buttons -->
        <div class="grid grid-cols-2 gap-2 mt-2 mb-2">
            <button id="btn-cloud-save" class="flex items-center justify-center space-x-2 px-3 py-3 rounded-xl border border-dashed border-indigo-700 text-indigo-400 hover:text-white hover:bg-indigo-900/20 hover:border-indigo-500 transition-all">
                 <i data-lucide="cloud-upload" class="w-4 h-4"></i>
                 <span class="font-medium text-xs">Save Cloud</span>
            </button>
            <button id="btn-cloud-load" class="flex items-center justify-center space-x-2 px-3 py-3 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-500 transition-all">
                 <i data-lucide="cloud-download" class="w-4 h-4"></i>
                 <span class="font-medium text-xs">Load ID</span>
            </button>
        </div>

        <!-- New Project Button -->
        <button id="btn-reset-project" class="w-full mt-2 mb-2 flex items-center space-x-3 px-4 py-3 rounded-xl border border-dashed border-red-900/50 text-slate-500 hover:text-red-400 hover:border-red-500/50 hover:bg-red-950/20 transition-all">
             <i data-lucide="trash-2" class="w-4.5 h-4.5"></i>
             <span class="font-medium tracking-wide text-sm">Reset Project</span>
        </button>

        <div class="my-4 h-px bg-white/5 mx-2"></div>
        <p class="px-4 text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Information</p>
        
        ${infoNavItems.map(renderItem).join('')}

        <!-- Telegram Button -->
        <a href="https://t.me/altogen_studio" target="_blank" class="mt-2 mx-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] hover:text-white rounded-xl transition-all group shadow-lg hover:shadow-[#0088cc]/20">
             <i data-lucide="send" class="w-4 h-4 transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"></i>
             <span class="font-bold text-sm">Join Telegram</span>
        </a>

        <!-- AUTH SECTION -->
        ${userSection}
      </nav>
      
      <div class="p-4 border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent relative z-10 text-center">
            <div class="text-[10px] text-slate-600 font-mono">
             Powered by Altomedia
            </div>
      </div>
    </aside>
  `;
};
