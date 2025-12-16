
import { createIcons, icons } from 'lucide';
import { Sidebar } from './components/Sidebar';
import { ProjectSetup, setupListeners } from './components/ProjectSetup';
import { ConfigResult, configListeners } from './components/ConfigResult';
import { AssetGenerator, assetListeners } from './components/AssetGenerator';
import { ProjectStructure, structureListeners } from './components/ProjectStructure';
import { Monetization, monetizationListeners } from './components/Monetization';
import { InfoPages } from './components/InfoPages';
import { Profile, profileListeners } from './components/Profile';
import { Upgrade, upgradeListeners } from './components/Upgrade';
import { AdminPanel, adminListeners } from './components/AdminPanel';
import { ViewMode, ProjectConfig, FileEntry, AssetEntry, ProjectIssue, EditorIssue, UserProfile } from './types';
import { validateProject } from './services/validationService';
import { saveProject, loadProject, resetProject } from './services/storageService';
import { saveProjectToCloud, loadProjectFromCloud, subscribeToAuth } from './services/firebaseService';

// Add type for custom window function
declare global {
    interface Window {
        dismissSplash: () => void;
    }
}

// Global State
export const state = {
  currentMode: ViewMode.SETUP,
  isMenuOpen: false,
  editingPath: null as string | null, 
  editorContent: '',
  editorHighlightedContent: '', 
  editorIssues: [] as EditorIssue[],
  isSuggesting: false,
  editorSuggestion: null as { explanation: string; code: string } | null,
  
  // Auth State
  user: null as UserProfile | null,
  authInitialized: false,

  // Asset State
  activeAssetTab: 'icon' as 'icon' | 'splash',

  config: {
    name: 'My Cordova App',
    id: 'com.example.hello',
    version: '1.0.0',
    description: 'A hello world application',
    authorEmail: 'dev@example.com',
    authorName: 'Developer',
    authorWebsite: 'https://example.com',
    sourceType: 'url',
    sourceValue: '',
    platforms: ['android'],
    plugins: ['cordova-plugin-console'],
    pluginVariables: {},
    enableGit: false,
    adConfig: {
        enabled: false,
        androidAppId: '',
        iosAppId: '',
        bannerId: '',
        interstitialId: '',
        rewardedId: '',
        autoShowBanner: true,
        bannerPosition: 'bottom'
    },
    preferences: {
        orientation: 'default',
        fullscreen: false,
        backgroundColor: 'ffffff',
        disallowOverscroll: true,
        hideSplashScreenSpinner: false
    }
  } as ProjectConfig,
  files: [] as FileEntry[],
  assets: [] as AssetEntry[],
  issues: [] as ProjectIssue[] 
};

// --- TOAST NOTIFICATION SYSTEM ---
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    const colors = type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                 : type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400'
                 : 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info';

    el.className = `flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg transform transition-all duration-300 translate-y-10 opacity-0 ${colors}`;
    el.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5"></i>
        <span class="text-sm font-medium select-all">${message}</span>
    `;

    container.appendChild(el);
    createIcons({ icons });

    // Animate In
    requestAnimationFrame(() => {
        el.classList.remove('translate-y-10', 'opacity-0');
    });

    // Remove after 3s (Longer if it's an ID to allow copying)
    setTimeout(() => {
        el.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => el.remove(), 300);
    }, message.length > 20 ? 6000 : 3000);
};

// --- CORE LOGIC ---

const syncVirtualFiles = () => {
    const realFiles = state.files.filter(f => !f.isVirtual);
    let effectivePlugins = [...state.config.plugins];
    let admobPluginXml = "";
    let virtualAdmobJs: FileEntry | null = null;

    if (state.config.adConfig.enabled) {
        if (!effectivePlugins.includes('admob-plus-cordova')) {
            effectivePlugins.push('admob-plus-cordova');
        }
        
        // XML Injection
        admobPluginXml = `
    <plugin name="admob-plus-cordova" spec="latest">
        <variable name="APP_ID_ANDROID" value="${state.config.adConfig.androidAppId || 'ca-app-pub-xxx~xxx'}" />
        <variable name="APP_ID_IOS" value="${state.config.adConfig.iosAppId || 'ca-app-pub-xxx~xxx'}" />
    </plugin>`;

        // JS Logic Generation
        const adLogic = `/* Auto-Generated AdMob Logic */
document.addEventListener('deviceready', async () => {
    console.log('AdMob: Device ready, initializing...');
    
    if (typeof admob === 'undefined') {
        console.error('AdMob plugin not installed or failed to load.');
        return;
    }

    try {
        await admob.start();
        console.log('AdMob: Started');

        // Banner
        const bannerId = '${state.config.adConfig.bannerId}';
        const autoShowBanner = ${state.config.adConfig.autoShowBanner};
        
        if (bannerId && autoShowBanner) {
            const banner = new admob.BannerAd({
                adUnitId: bannerId,
                position: '${state.config.adConfig.bannerPosition}' // top or bottom
            });
            await banner.show();
            console.log('AdMob: Banner shown');
        }

        // Interstitial Preparation
        const interstitialId = '${state.config.adConfig.interstitialId}';
        if (interstitialId) {
            window.interstitialAd = new admob.InterstitialAd({
                adUnitId: interstitialId
            });
            await window.interstitialAd.load();
            console.log('AdMob: Interstitial loaded and ready (call window.interstitialAd.show())');
        }

        // Rewarded Preparation
        const rewardedId = '${state.config.adConfig.rewardedId}';
        if (rewardedId) {
            window.rewardedAd = new admob.RewardedAd({
                adUnitId: rewardedId
            });
            await window.rewardedAd.load();
            console.log('AdMob: Rewarded Ad loaded and ready');
        }

    } catch (e) {
        console.error('AdMob Error:', e);
    }
}, false);`;

        virtualAdmobJs = {
            name: 'admob.js',
            path: 'www/js/admob.js',
            size: adLogic.length,
            type: 'text/javascript',
            content: adLogic,
            isFolder: false,
            isVirtual: true
        };
    }

    const generatePluginXml = (p: string) => {
        if (p === 'admob-plus-cordova') return ''; // Handled separately
        const vars = state.config.pluginVariables?.[p];
        if (!vars || Object.keys(vars).length === 0) {
            return `<plugin name="${p}" />`;
        }
        const varTags = Object.entries(vars).map(([k, v]) => `<variable name="${k}" value="${v}" />`).join('\n        ');
        return `<plugin name="${p}">\n        ${varTags}\n    </plugin>`;
    };
    
    const virtualConfigXml = `<?xml version='1.0' encoding='utf-8'?>
<widget id="${state.config.id}" version="${state.config.version}" xmlns="http://www.w3.org/ns/widgets">
    <name>${state.config.name}</name>
    <description>${state.config.description}</description>
    <author email="${state.config.authorEmail}">${state.config.authorName}</author>
    <content src="index.html" />
    <access origin="*" />
    <preference name="Orientation" value="${state.config.preferences.orientation}" />
    <preference name="Fullscreen" value="${state.config.preferences.fullscreen}" />
    <preference name="BackgroundColor" value="0xff${state.config.preferences.backgroundColor}" />
    <preference name="DisallowOverscroll" value="${state.config.preferences.disallowOverscroll}" />
    ${state.config.preferences.hideSplashScreenSpinner ? '<preference name="ShowSplashScreenSpinner" value="false" />' : ''}
    ${state.config.platforms.map(p => `<platform name="${p}" />`).join('\n    ')}
    ${state.config.plugins.filter(p => p !== 'admob-plus-cordova').map(generatePluginXml).join('\n    ')}
    ${admobPluginXml}
</widget>`;

    const virtualPackageJson = JSON.stringify({
        name: state.config.id.toLowerCase().replace(/\./g, '-'),
        displayName: state.config.name,
        version: state.config.version,
        dependencies: {
            "cordova-android": "^10.0.0",
            ...effectivePlugins.reduce((acc, curr) => ({ ...acc, [curr]: "latest" }), {})
        },
        cordova: {
            plugins: {
                ...state.config.plugins.reduce((acc, curr) => {
                    if (curr === 'admob-plus-cordova') return acc;
                    acc[curr] = state.config.pluginVariables?.[curr] || {};
                    return acc;
                }, {} as any),
                ...(state.config.adConfig.enabled ? {
                    "admob-plus-cordova": {
                        "APP_ID_ANDROID": state.config.adConfig.androidAppId || "ca-app-pub-xxx~xxx",
                        "APP_ID_IOS": state.config.adConfig.iosAppId || "ca-app-pub-xxx~xxx"
                    }
                } : {})
            }
        }
    }, null, 2);

    const virtuals: FileEntry[] = [
        { name: 'config.xml', path: 'config.xml', size: virtualConfigXml.length, type: 'text/xml', content: virtualConfigXml, isFolder: false, isVirtual: true },
        { name: 'package.json', path: 'package.json', size: virtualPackageJson.length, type: 'application/json', content: virtualPackageJson, isFolder: false, isVirtual: true }
    ];

    if (virtualAdmobJs) {
        virtuals.push(virtualAdmobJs);
    }

    return [...realFiles, ...virtuals];
};

// State Management
export const updateState = (updates: Partial<typeof state>) => {
  Object.assign(state, updates);
  
  // Validation & Sync
  state.files = syncVirtualFiles();
  state.issues = validateProject(state.config, state.files, state.assets);
  
  // AUTO SAVE LOCAL
  saveProject(state.config, state.files);

  renderApp();
};

export const updateConfig = (updates: Partial<ProjectConfig>) => {
  state.config = { ...state.config, ...updates };
  updateState({});
};

// File Actions
export const fileActions = {
  addFile: (entry: FileEntry) => {
    let cleanPath = entry.path.startsWith('/') ? entry.path.substring(1) : entry.path;
    const exists = state.files.find(f => f.path === cleanPath && !f.isVirtual);
    if (!exists) {
      state.files = [...state.files, { ...entry, path: cleanPath }];
      updateState({});
    }
  },
  removeFile: (path: string) => {
    state.files = state.files.filter(f => f.path !== path && !f.path.startsWith(path + '/'));
    updateState({});
  },
  renameFile: (oldPath: string, newPath: string) => {
    state.files = state.files.map(f => {
      if (f.path === oldPath) {
        return { ...f, path: newPath, name: newPath.split('/').pop() || '' };
      }
      if (f.path.startsWith(oldPath + '/')) {
        const relative = f.path.substring(oldPath.length);
        const updated = newPath + relative;
        return { ...f, path: updated };
      }
      return f;
    });
    updateState({});
  },
  updateContent: (path: string, content: string) => {
     state.files = state.files.map(f => f.path === path ? { ...f, content, size: content.length } : f);
     updateState({});
  }
};

// INITIALIZATION
const init = () => {
    const { config, files } = loadProject();
    if (config) {
        state.config = config;
        // Migration: Ensure pluginVariables exists
        if (!state.config.pluginVariables) state.config.pluginVariables = {};
        // Migration: Git integration
        if (state.config.enableGit === undefined) state.config.enableGit = false;
        
        state.files = files;
        state.files = syncVirtualFiles(); 
        state.issues = validateProject(state.config, state.files, state.assets);
    }
    
    // Auth Listener
    subscribeToAuth((user) => {
        state.user = user;
        state.authInitialized = true;
        renderApp();
    });

    renderApp();
    
    // Dismiss Splash Screen
    if (window.dismissSplash) {
        window.dismissSplash();
    }
};

// Render Logic
const root = document.getElementById('root');

function renderApp() {
  if (!root) return;

  let mainContent = '';
  switch (state.currentMode) {
      case ViewMode.SETUP: mainContent = ProjectSetup(state.config); break;
      case ViewMode.ASSETS: mainContent = AssetGenerator(state.assets); break;
      case ViewMode.STRUCTURE: mainContent = ProjectStructure(); break;
      case ViewMode.MONETIZATION: mainContent = Monetization(state.config); break;
      case ViewMode.CONFIG: mainContent = ConfigResult(state.config); break;
      case ViewMode.ABOUT: case ViewMode.PRIVACY: case ViewMode.DISCLAIMER: mainContent = InfoPages(state.currentMode); break;
      
      // NEW ROUTES
      case ViewMode.PROFILE: mainContent = Profile(state.user); break;
      case ViewMode.UPGRADE: mainContent = state.user ? Upgrade(state.user) : Profile(null); break;
      case ViewMode.ADMIN_PANEL: mainContent = state.user ? AdminPanel(state.user) : Profile(null); break;

      default: mainContent = ProjectSetup(state.config);
  }

  const template = `
    <div class="h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1e] to-black text-slate-200 overflow-hidden selection:bg-cyan-500/30 relative">
      
      <!-- Backdrop -->
      <div id="menu-backdrop" class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${state.isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}"></div>

      <!-- Sidebar -->
      <div id="sidebar-container" class="fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${state.isMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl shadow-cyan-900/20">
         ${Sidebar(state.currentMode)}
      </div>
      
      <!-- Toast Container -->
      <div id="toast-container" class="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none"></div>

      <main class="h-full w-full relative z-10 flex flex-col">
        <div class="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        
        <!-- Toolbar -->
        <div class="absolute top-0 left-0 right-0 z-30 p-6 flex items-center justify-between pointer-events-none">
           <button id="menu-toggle" class="pointer-events-auto p-3 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl text-white hover:bg-cyan-500/10 hover:text-cyan-400 transition-all shadow-lg group">
              <i data-lucide="menu" class="w-6 h-6 transform group-hover:scale-110 transition-transform"></i>
              ${state.issues.filter(i => i.severity === 'error').length > 0 ? `<div class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>` : ''}
           </button>
           
           <div class="pointer-events-auto flex gap-4">
               ${state.issues.length > 0 ? `
                  <div class="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-mono text-red-400">
                     <i data-lucide="alert-circle" class="w-3 h-3"></i>
                     <span>${state.issues.length} Issues</span>
                  </div>
               ` : `
                  <div class="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs font-mono text-green-400">
                     <i data-lucide="check-circle-2" class="w-3 h-3"></i>
                     <span>System Healthy</span>
                  </div>
               `}
           </div>
        </div>

        <div class="h-full overflow-auto custom-scrollbar pt-24 px-6 md:px-12 pb-12 w-full mx-auto" id="main-view">
          ${mainContent}
        </div>
      </main>
    </div>
  `;

  const appShell = document.querySelector('.h-screen.bg-\\[radial-gradient');
  
  if (!appShell) {
      root.innerHTML = template;
      attachGlobalListeners();
  } else {
     const mainView = document.getElementById('main-view');
     if (mainView) mainView.innerHTML = mainContent;
     
     const sidebarContainer = document.getElementById('sidebar-container');
     if (sidebarContainer) {
         if (state.isMenuOpen) {
             sidebarContainer.classList.remove('-translate-x-full');
             sidebarContainer.classList.add('translate-x-0');
         } else {
             sidebarContainer.classList.remove('translate-x-0');
             sidebarContainer.classList.add('-translate-x-full');
         }
     }

     const backdrop = document.getElementById('menu-backdrop');
     if (backdrop) {
         if (state.isMenuOpen) {
             backdrop.classList.remove('opacity-0', 'pointer-events-none');
             backdrop.classList.add('opacity-100', 'pointer-events-auto');
         } else {
             backdrop.classList.remove('opacity-100', 'pointer-events-auto');
             backdrop.classList.add('opacity-0', 'pointer-events-none');
         }
     }
     
     if (sidebarContainer) sidebarContainer.innerHTML = Sidebar(state.currentMode);
  }
  
  createIcons({ icons });

  // RE-ATTACH LISTENERS
  if (state.currentMode === ViewMode.SETUP) setupListeners();
  else if (state.currentMode === ViewMode.ASSETS) assetListeners();
  else if (state.currentMode === ViewMode.MONETIZATION) monetizationListeners();
  else if (state.currentMode === ViewMode.CONFIG) configListeners();
  else if (state.currentMode === ViewMode.STRUCTURE) structureListeners();
  else if (state.currentMode === ViewMode.PROFILE) profileListeners();
  else if (state.currentMode === ViewMode.UPGRADE && state.user) upgradeListeners(state.user);
  else if (state.currentMode === ViewMode.ADMIN_PANEL && state.user) adminListeners();
  
  attachGlobalListeners();
}

function attachGlobalListeners() {
  document.querySelectorAll('[data-nav]').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode?.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', (e) => {
      const mode = (e.currentTarget as HTMLElement).getAttribute('data-nav') as ViewMode;
      updateState({ currentMode: mode, isMenuOpen: false });
    });
  });

  const toggleBtn = document.getElementById('menu-toggle');
  if (toggleBtn) toggleBtn.onclick = () => updateState({ isMenuOpen: !state.isMenuOpen });

  const closeBtn = document.getElementById('menu-close');
  if (closeBtn) closeBtn.onclick = () => updateState({ isMenuOpen: false });
  
  // RESET PROJECT LISTENER
  const resetBtn = document.getElementById('btn-reset-project');
  if (resetBtn) {
      resetBtn.onclick = () => {
          if(confirm("Are you sure? This will delete all saved configurations and files.")) {
              resetProject();
          }
      };
  }

  // FIREBASE CLOUD LISTENERS
  const saveCloudBtn = document.getElementById('btn-cloud-save');
  const loadCloudBtn = document.getElementById('btn-cloud-load');

  if (saveCloudBtn) {
      saveCloudBtn.onclick = async () => {
          if (!state.user) {
              showToast("Please login to use cloud features", "error");
              updateState({ currentMode: ViewMode.PROFILE });
              return;
          }
          const original = saveCloudBtn.innerHTML;
          saveCloudBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Saving...`;
          createIcons({ icons });
          try {
              const id = await saveProjectToCloud(state.config, state.files);
              showToast(`Project saved! ID: ${id}`, 'success');
              prompt("Save this Project ID to load later:", id);
          } catch (e) {
              showToast("Failed to save to cloud", 'error');
          } finally {
              saveCloudBtn.innerHTML = original;
              createIcons({ icons });
          }
      };
  }

  if (loadCloudBtn) {
      loadCloudBtn.onclick = async () => {
          const id = prompt("Enter Project ID:");
          if (id) {
              const original = loadCloudBtn.innerHTML;
              loadCloudBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Loading...`;
              createIcons({ icons });
              try {
                  const result = await loadProjectFromCloud(id);
                  if (result) {
                      state.config = result.config;
                      state.files = result.files;
                      updateState({}); // Sync and render
                      showToast("Project loaded from cloud", 'success');
                  } else {
                      showToast("Project ID not found", 'error');
                  }
              } catch (e) {
                  showToast("Failed to load project", 'error');
              } finally {
                  loadCloudBtn.innerHTML = original;
                  createIcons({ icons });
              }
          }
      };
  }

  const backdrop = document.getElementById('menu-backdrop');
  if (backdrop) backdrop.onclick = () => updateState({ isMenuOpen: false });
}

// Start
init();
