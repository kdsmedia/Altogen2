
import { ProjectConfig, FileEntry } from '../types';
import { updateConfig, updateState, state, showToast } from '../index';
import { analyzeUrlRequirements } from '../services/geminiService';
import { createIcons, icons } from 'lucide';
import { ViewMode } from '../types';

export const ProjectSetup = (config: ProjectConfig) => {
  // Enhanced Source Card
  const renderSourceCard = (id: string, label: string, icon: string, color: string, description: string) => {
    const isSelected = config.sourceType === id;
    
    const activeStyles = {
        cyan: 'border-cyan-500 bg-cyan-500/10 text-cyan-400 ring-2 ring-cyan-500/20',
        indigo: 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-2 ring-cyan-500/20',
        violet: 'border-violet-500 bg-violet-500/10 text-violet-400 ring-2 ring-violet-500/20'
    }[color] || '';

    const defaultStyles = 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50 hover:text-slate-200';

    return `
      <button
        data-source-type="${id}"
        class="flex flex-col items-start p-6 rounded-2xl border transition-all duration-500 group relative overflow-hidden text-left ${isSelected ? activeStyles : defaultStyles}"
      >
        <div class="mb-4 p-3 rounded-xl bg-slate-950/50 border border-white/5 group-hover:scale-110 transition-transform duration-500">
            <i data-lucide="${icon}" class="w-6 h-6"></i>
        </div>
        <h4 class="font-bold text-lg mb-1">${label}</h4>
        <p class="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">${description}</p>
        
        ${isSelected ? `
            <div class="absolute top-3 right-3">
                <div class="w-2 h-2 rounded-full bg-${color}-500 animate-pulse"></div>
            </div>
        ` : ''}
      </button>
    `;
  };

  const renderPlatformBtn = (platform: string) => {
      const isActive = (config.platforms || []).includes(platform);
      return `
        <button
          data-platform="${platform}"
          class="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border transition-all duration-300 ${
            isActive
              ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 border-cyan-500 text-white shadow-lg shadow-cyan-900/50'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900'
          }"
        >
           <i data-lucide="${platform === 'android' ? 'smartphone' : 'tablet'}" class="w-4 h-4"></i>
           <span class="capitalize font-bold text-sm">${platform}</span>
           ${isActive ? '<i data-lucide="check" class="w-3 h-3 ml-1"></i>' : ''}
        </button>
      `;
  };

  const getInputPlaceholder = () => {
    switch(config.sourceType) {
      case 'url': return 'https://your-website.com';
      case 'github': return 'https://github.com/user/repo';
      default: return 'Select a local project directory...';
    }
  };

  return `
    <div class="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      <!-- Hero Header -->
      <div class="text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            <i data-lucide="zap" class="w-3 h-3"></i> Cordova Project Architect
        </div>
        <h2 class="text-5xl font-black text-white tracking-tight">
            Build Your Mobile App
        </h2>
        <p class="text-slate-400 text-lg max-w-2xl mx-auto">
            Transform any web content into a high-performance native application in seconds.
        </p>
      </div>

      <!-- Source Selection Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${renderSourceCard('url', 'Website URL', 'globe', 'cyan', 'Wrap an existing live website into a mobile app shell.')}
        ${renderSourceCard('folder', 'Local Files', 'folder-open', 'indigo', 'Upload HTML/JS assets from your computer to bundle.')}
        ${renderSourceCard('github', 'GitHub Repo', 'github', 'violet', 'Clone a source code repository and build from scratch.')}
      </div>

      <!-- Configuration Section -->
      <div class="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-1 border border-white/5 shadow-2xl">
          <div class="p-8 space-y-8">
              
              <!-- Dynamic Source Input -->
              <div class="space-y-4">
                  <div class="flex items-center justify-between">
                      <label class="text-xs uppercase tracking-widest text-slate-500 font-bold ml-1">
                          ${config.sourceType === 'folder' ? 'Upload Assets' : 'Resource Endpoint'}
                      </label>
                      <span class="text-[10px] font-mono text-cyan-500/60 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">Required</span>
                  </div>
                  
                  <div class="flex gap-4">
                    ${config.sourceType === 'folder' ? `
                      <div class="relative flex-1 group">
                        <div class="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-300 blur"></div>
                        <label for="folder-input" class="relative flex items-center w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 cursor-pointer hover:bg-slate-900 transition-all">
                            <i data-lucide="cloud-upload" class="w-6 h-6 text-indigo-400 mr-4"></i>
                            <div class="flex-1">
                                <span class="text-sm font-bold text-white block">Click to select folder</span>
                                <span class="text-xs text-slate-500">${state.files.length > 0 ? `${state.files.length} files detected` : 'Supports index.html, JS, CSS...'}</span>
                            </div>
                            <input type="file" id="folder-input" webkitdirectory directory multiple class="hidden" />
                        </label>
                      </div>
                    ` : `
                      <div class="relative flex-1 group">
                          <div class="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-0 group-focus-within:opacity-40 transition duration-500 blur"></div>
                          <input
                            type="text"
                            id="source-value-input"
                            value="${config.sourceValue}"
                            placeholder="${getInputPlaceholder()}"
                            class="relative w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-sm"
                          />
                      </div>
                    `}
                    
                    ${config.sourceType !== 'folder' ? `
                       <button
                       id="auto-fill-btn"
                       ${!config.sourceValue ? 'disabled' : ''}
                       class="px-8 bg-slate-800 hover:bg-slate-700 border border-white/5 text-white rounded-2xl flex items-center space-x-3 transition-all disabled:opacity-30 disabled:grayscale shadow-lg group"
                     >
                       <i data-lucide="wand-2" class="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform"></i>
                       <span class="font-bold text-sm tracking-wide">Auto-Detect</span>
                     </button>
                    ` : ''}
                  </div>
              </div>

              <!-- Secondary Details -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  <!-- App Core Identity -->
                  <div class="space-y-6">
                      <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col-span-2">
                                <label class="text-[10px] uppercase tracking-widest text-slate-600 font-bold ml-1 mb-2 block">Application Name</label>
                                <input type="text" id="name-input" value="${config.name}" placeholder="My Super App" class="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
                            </div>
                            <div>
                                 <label class="text-[10px] uppercase tracking-widest text-slate-600 font-bold ml-1 mb-2 block">Package Identifier</label>
                                <input type="text" id="id-input" value="${config.id}" placeholder="com.company.app" class="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none font-mono text-xs tracking-tight transition-all" />
                            </div>
                             <div>
                                 <label class="text-[10px] uppercase tracking-widest text-slate-600 font-bold ml-1 mb-2 block">Version</label>
                                <input type="text" id="version-input" value="${config.version}" class="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none font-mono text-xs transition-all" />
                            </div>
                        </div>
                      </div>

                      <!-- Git Toggle Card -->
                      <label class="flex items-center gap-4 cursor-pointer p-5 rounded-2xl border border-slate-800 bg-slate-950/30 hover:border-orange-500/30 transition-all group">
                        <div class="relative">
                            <input type="checkbox" id="git-toggle" class="sr-only peer" ${config.enableGit ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-white"></div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                <i data-lucide="git-branch" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <span class="text-sm font-bold text-white block">Git Integration</span>
                                <span class="text-[10px] text-slate-500 uppercase tracking-tighter">Initialize .gitignore & Readme</span>
                            </div>
                        </div>
                      </label>
                  </div>

                  <!-- Platforms & Context -->
                  <div class="space-y-6">
                      <div class="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                        <label class="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-4 block">Target Platforms</label>
                        <div class="flex gap-4">
                            ${renderPlatformBtn('android')}
                            ${renderPlatformBtn('ios')}
                        </div>
                      </div>

                      <div class="space-y-2">
                           <label class="text-[10px] uppercase tracking-widest text-slate-600 font-bold ml-1 mb-1 block">Project Description</label>
                          <textarea id="desc-input" rows="4" placeholder="Briefly describe your app..." class="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-cyan-500 outline-none resize-none transition-all">${config.description}</textarea>
                      </div>
                  </div>
              </div>

              <!-- Main Execution Button -->
              <div class="pt-4">
                    <button
                      id="generate-btn"
                      ${(!config.name || !config.sourceValue) ? 'disabled' : ''}
                      class="w-full relative group py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-[0_20px_50px_-10px_rgba(255,255,255,0.2)] hover:shadow-[0_25px_60px_-10px_rgba(255,255,255,0.3)] transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none overflow-hidden"
                    >
                      <span class="relative z-10 flex items-center justify-center gap-3 uppercase tracking-widest">
                          Initialize Project
                          <i data-lucide="arrow-right-circle" class="w-6 h-6 group-hover:translate-x-1.5 transition-transform duration-300"></i>
                      </span>
                      <div class="absolute inset-0 bg-gradient-to-r from-cyan-400 via-transparent to-cyan-400 opacity-0 group-hover:opacity-10 transition-opacity duration-700"></div>
                    </button>
                    <p class="text-center text-[10px] text-slate-600 mt-4 uppercase tracking-[0.2em]">Ready for Production Deployment</p>
              </div>
          </div>
      </div>
    </div>
  `;
};

export const setupListeners = () => {
    createIcons({ icons });

    // Inputs
    document.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', (e) => {
             const input = e.target as HTMLInputElement;
             if(input.id === 'source-value-input') state.config.sourceValue = input.value;
             if(input.id === 'name-input') state.config.name = input.value;
             if(input.id === 'id-input') state.config.id = input.value;
             if(input.id === 'version-input') state.config.version = input.value;
             if(input.id === 'desc-input') state.config.description = input.value;
             
             // Update button state manually to avoid re-render flicker
             const btn = document.getElementById('generate-btn');
             const autoBtn = document.getElementById('auto-fill-btn');

             if(btn) {
                 const isReady = (state.config.name && state.config.sourceValue) || (state.config.sourceType === 'folder' && state.files.length > 0);
                 if(isReady) {
                     btn.removeAttribute('disabled');
                     btn.classList.remove('opacity-20', 'cursor-not-allowed', 'shadow-none');
                 } else {
                     btn.setAttribute('disabled', 'true');
                     btn.classList.add('opacity-20', 'cursor-not-allowed', 'shadow-none');
                 }
             }

             if(autoBtn && input.id === 'source-value-input') {
                 if(state.config.sourceValue) {
                    autoBtn.removeAttribute('disabled');
                    autoBtn.classList.remove('opacity-30', 'grayscale');
                 } else {
                    autoBtn.setAttribute('disabled', 'true');
                    autoBtn.classList.add('opacity-30', 'grayscale');
                 }
             }
        });
    });

    // Source Types
    document.querySelectorAll('[data-source-type]').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-source-type');
            updateConfig({ sourceType: type as any, sourceValue: '' });
        });
    });

    // Platforms
    document.querySelectorAll('[data-platform]').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = btn.getAttribute('data-platform') as string;
            const current = state.config.platforms || [];
            const updated = current.includes(p) ? current.filter(x => x !== p) : [...current, p];
            updateConfig({ platforms: updated });
        });
    });

    // Git Toggle
    const gitToggle = document.getElementById('git-toggle');
    if (gitToggle) {
        gitToggle.addEventListener('change', (e) => {
            updateConfig({ enableGit: (e.target as HTMLInputElement).checked });
        });
    }

    // File Input
    const folderInput = document.getElementById('folder-input');
    if(folderInput) {
        folderInput.addEventListener('change', (e) => {
            const files = (e.target as HTMLInputElement).files;
            if(files && files.length > 0) {
                 const fileList: FileEntry[] = Array.from(files).map((f: any) => ({
                    name: f.name,
                    path: f.webkitRelativePath,
                    size: f.size,
                    type: f.type,
                    nativeFile: f
                }));
                state.files = fileList;
                const rootFolder = fileList[0].path.split('/')[0];
                updateConfig({ sourceValue: rootFolder });
            }
        });
    }

    // Auto Fill
    const autoBtn = document.getElementById('auto-fill-btn');
    if(autoBtn) {
        autoBtn.addEventListener('click', async () => {
            const originalText = autoBtn.innerHTML;
            autoBtn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 text-cyan-400 animate-spin"></i>`;
            createIcons({ icons });
            try {
                const suggestions = await analyzeUrlRequirements(state.config.sourceValue, state.config.sourceType);
                updateConfig(suggestions);
                showToast("Identity synchronized via AI", "success");
            } catch(e) { 
                showToast("Analysis failed", "error");
                autoBtn.innerHTML = originalText;
                createIcons({ icons });
            }
        });
    }

    // Generate Button Listener
    const generateBtn = document.getElementById('generate-btn');
    if(generateBtn) {
        generateBtn.addEventListener('click', () => {
            updateState({ currentMode: ViewMode.STRUCTURE });
        });
    }
};
