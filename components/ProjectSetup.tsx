
import { ProjectConfig, FileEntry } from '../types';
import { updateConfig, updateState, state } from '../index';
import { analyzeUrlRequirements } from '../services/geminiService';
import { createIcons, icons } from 'lucide';
import { ViewMode } from '../types';

export const ProjectSetup = (config: ProjectConfig) => {
  // Compact Source Button
  const renderSourceBtn = (id: string, label: string, icon: string, color: string) => {
    const isSelected = config.sourceType === id;
    
    // Color mapping
    const theme = color === 'cyan' 
        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' 
        : color === 'indigo' 
            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
            : 'border-violet-500 bg-violet-500/10 text-violet-400';

    const defaultTheme = 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200';

    return `
      <button
        data-source-type="${id}"
        class="flex items-center justify-center gap-3 px-4 py-4 rounded-xl border transition-all duration-300 group relative overflow-hidden ${isSelected ? theme : defaultTheme}"
      >
        <i data-lucide="${icon}" class="w-5 h-5"></i>
        <span class="font-bold text-sm tracking-wide">${label}</span>
        ${isSelected ? `<div class="absolute inset-0 bg-${color}-500/5 pointer-events-none"></div>` : ''}
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
           ${isActive ? '<i data-lucide="check" class="w-4 h-4 text-white"></i>' : ''}
           <span class="capitalize font-bold text-sm">${platform}</span>
        </button>
      `;
  };

  const getInputPlaceholder = () => {
    switch(config.sourceType) {
      case 'url': return 'https://example.com';
      case 'github': return 'https://github.com/username/repository';
      default: return '';
    }
  };

  const getAnalyzeBtnText = () => {
    return config.sourceType === 'github' ? 'Analyze Repo' : 'Auto-Detect';
  };

  const getSourceDescription = () => {
      switch(config.sourceType) {
          case 'url': return 'Wrap an existing responsive website into a native app container.';
          case 'folder': return 'Bundle local HTML/CSS/JS files directly into the application.';
          case 'github': return 'Clone and build from a remote Git repository.';
      }
  };

  return `
    <div class="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="space-y-2 text-center mb-8">
        <h2 class="text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-slate-400">
            Create New Project
        </h2>
        <p class="text-slate-400 text-lg max-w-2xl mx-auto">Define the source architecture and metadata for your hybrid application.</p>
      </div>

      <!-- Compact Source Selection -->
      <div class="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-inner">
          <label class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4 block">Source Origin</label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${renderSourceBtn('url', 'Web URL', 'globe', 'cyan')}
            ${renderSourceBtn('folder', 'Local Assets', 'folder-open', 'indigo')}
            ${renderSourceBtn('github', 'GitHub Repo', 'github', 'violet')}
          </div>
          <p class="mt-4 text-xs text-slate-500 italic text-center border-t border-white/5 pt-3">
            ${getSourceDescription()}
          </p>
      </div>

      <div class="space-y-6">
          <div class="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-white/5 shadow-inner">
            <h3 class="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
                <span class="w-1.5 h-6 rounded-full bg-cyan-500"></span>
                Source Configuration
            </h3>
            
            <div class="flex gap-4">
              ${config.sourceType === 'folder' ? `
                <div class="relative flex-1 group">
                  <div class="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-300 blur"></div>
                  <input
                    type="file"
                    id="folder-input"
                    webkitdirectory
                    directory
                    multiple
                    class="relative block w-full text-sm text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-bold file:uppercase file:tracking-wide file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer bg-slate-950 rounded-lg border border-slate-700/50 focus:outline-none focus:border-cyan-500 h-14"
                  />
                </div>
              ` : `
                <div class="relative flex-1 group">
                    <div class="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl opacity-0 group-focus-within:opacity-50 transition duration-500 blur"></div>
                    <input
                      type="text"
                      id="source-value-input"
                      value="${config.sourceValue}"
                      placeholder="${getInputPlaceholder()}"
                      class="relative w-full bg-slate-950 border border-slate-700/50 rounded-xl px-6 py-4 text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner"
                    />
                </div>
              `}
              
              ${config.sourceType !== 'folder' ? `
                 <button
                 id="auto-fill-btn"
                 ${!config.sourceValue ? 'disabled' : ''}
                 class="px-6 py-2 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-white/10 text-white rounded-xl flex items-center space-x-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
               >
                 <i data-lucide="${config.sourceType === 'github' ? 'git-branch' : 'wand-2'}" class="w-5 h-5 text-purple-400"></i>
                 <span class="hidden sm:inline font-medium">${getAnalyzeBtnText()}</span>
               </button>
              ` : ''}
            </div>
          </div>

          <!-- Main Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
             
             <!-- App Identity -->
             <div class="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-white/5 shadow-inner flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-slate-200 mb-2 flex items-center gap-2">
                        <span class="w-1.5 h-6 rounded-full bg-indigo-500"></span>
                        App Identity
                    </h3>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="text-xs uppercase tracking-wider text-slate-500 font-semibold ml-1 mb-1 block">App Name</label>
                            <input type="text" id="name-input" value="${config.name}" class="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none transition-all focus:bg-slate-900" />
                        </div>
                        <div>
                             <label class="text-xs uppercase tracking-wider text-slate-500 font-semibold ml-1 mb-1 block">Package ID</label>
                            <input type="text" id="id-input" value="${config.id}" class="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none font-mono text-sm tracking-tight transition-all focus:bg-slate-900" />
                        </div>
                         <div>
                             <label class="text-xs uppercase tracking-wider text-slate-500 font-semibold ml-1 mb-1 block">Version</label>
                            <input type="text" id="version-input" value="${config.version}" class="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none font-mono text-sm transition-all focus:bg-slate-900" />
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 pt-6 border-t border-white/5">
                    <label class="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-slate-700/50 bg-slate-950/50 hover:border-orange-500/50 transition-all w-full group">
                        <div class="relative">
                            <input type="checkbox" id="git-toggle" class="sr-only peer" ${config.enableGit ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </div>
                        <div class="flex items-center gap-2">
                            <i data-lucide="git-branch" class="w-5 h-5 text-slate-400 group-hover:text-orange-400 transition-colors"></i>
                            <div>
                                <span class="text-sm font-bold text-white block">Git Integration</span>
                                <span class="text-xs text-slate-500">Include .gitignore and init scripts</span>
                            </div>
                        </div>
                    </label>
                </div>
             </div>

             <div class="space-y-6">
                 <!-- Platforms -->
                 <div class="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-white/5 shadow-inner">
                    <h3 class="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <span class="w-1.5 h-6 rounded-full bg-teal-500"></span>
                        Platforms
                    </h3>
                    <div class="flex gap-4">
                        ${renderPlatformBtn('android')}
                        ${renderPlatformBtn('ios')}
                    </div>
                 </div>

                 <!-- Description -->
                 <div class="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-white/5 shadow-inner">
                      <div>
                           <label class="text-xs uppercase tracking-wider text-slate-500 font-semibold ml-1 mb-2 block">Description</label>
                          <textarea id="desc-input" rows="3" class="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none resize-none transition-all focus:bg-slate-900">${config.description}</textarea>
                      </div>
                 </div>
             </div>
          </div>

          <!-- Action Bar -->
          <div class="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-inner">
                <button
                  id="generate-btn"
                  ${(!config.name || !config.sourceValue) ? 'disabled' : ''}
                  class="w-full group relative px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none overflow-hidden"
                >
                  <span class="relative z-10 flex items-center justify-center gap-2">
                      Generate Configuration
                      <i data-lucide="arrow-right" class="w-5 h-5 group-hover:translate-x-1 transition-transform"></i>
                  </span>
                  <div class="absolute inset-0 bg-gradient-to-r from-cyan-400 via-white to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                </button>
          </div>
      </div>
    </div>
  `;
};

export const setupListeners = () => {
    // Inputs
    const inputs = ['name', 'id', 'version', 'description', 'source-value'];
    inputs.forEach(id => {
        const el = document.getElementById(id.replace('source-value', 'sourceValue') + '-input'); // mismatch fix
        const el2 = document.getElementById(id + '-input');
        const target = el || el2;
        if(target) {
            target.addEventListener('input', (e) => {
                const field = id === 'source-value' ? 'sourceValue' : (id === 'desc' ? 'description' : id);
                updateConfig({ [field]: (e.target as HTMLInputElement).value });
            });
            target.addEventListener('focus', () => { /* pause render? */ });
            target.addEventListener('blur', (e) => {
                 const field = id === 'source-value' ? 'sourceValue' : (id === 'desc' ? 'description' : id);
                 updateConfig({ [field]: (e.target as HTMLInputElement).value });
            });
        }
    });

    // Special handling for live updating state without render to prevent focus loss
    document.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', (e) => {
             const input = e.target as HTMLInputElement;
             if(input.id === 'source-value-input') state.config.sourceValue = input.value;
             if(input.id === 'name-input') state.config.name = input.value;
             if(input.id === 'id-input') state.config.id = input.value;
             if(input.id === 'version-input') state.config.version = input.value;
             if(input.id === 'desc-input') state.config.description = input.value;
             
             // Update button state manually
             const btn = document.getElementById('generate-btn');
             const autoBtn = document.getElementById('auto-fill-btn');

             if(btn) {
                 if(state.config.name && state.config.sourceValue) {
                     btn.removeAttribute('disabled');
                     btn.classList.remove('opacity-50', 'cursor-not-allowed', 'shadow-none');
                 } else {
                     btn.setAttribute('disabled', 'true');
                     btn.classList.add('opacity-50', 'cursor-not-allowed', 'shadow-none');
                 }
             }

             if(autoBtn && input.id === 'source-value-input') {
                 if(state.config.sourceValue) {
                    autoBtn.removeAttribute('disabled');
                    autoBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                 } else {
                    autoBtn.setAttribute('disabled', 'true');
                    autoBtn.classList.add('opacity-50', 'cursor-not-allowed');
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
    const fileInput = document.getElementById('folder-input');
    if(fileInput) {
        fileInput.addEventListener('change', (e) => {
            const files = (e.target as HTMLInputElement).files;
            if(files && files.length > 0) {
                 const fileList: FileEntry[] = Array.from(files).map((f: any) => ({
                    name: f.name,
                    path: f.webkitRelativePath,
                    size: f.size,
                    type: f.type,
                    nativeFile: f // Store the native file object
                }));
                // Update files in global state
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
            autoBtn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 text-purple-400 animate-spin"></i> Analyzing...`;
            createIcons({ icons });
            try {
                const suggestions = await analyzeUrlRequirements(state.config.sourceValue, state.config.sourceType);
                updateConfig(suggestions);
            } catch(e) { 
                console.error(e);
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
