
import { ProjectConfig } from '../types';
import { updateConfig, state } from '../index';

export const Monetization = (config: ProjectConfig) => {
  return `
    <div class="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div class="space-y-2 mb-8">
        <h2 class="text-3xl font-bold text-white flex items-center gap-3">
            <i data-lucide="dollar-sign" class="w-8 h-8 text-yellow-400"></i>
            Monetization
        </h2>
        <p class="text-slate-400 text-lg">Configure AdMob ads for your application.</p>
      </div>

      <div class="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-white/5 shadow-inner">
           <div class="flex items-center justify-between mb-6">
               <h3 class="text-lg font-semibold text-slate-200 flex items-center gap-2">
                   <span class="w-1.5 h-6 rounded-full bg-yellow-500"></span>
                   AdMob Configuration
               </h3>
               <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-500 uppercase font-bold">Enable Ads</span>
                    <button id="toggle-ads" class="w-12 h-6 rounded-full transition-colors relative ${config.adConfig.enabled ? 'bg-cyan-600' : 'bg-slate-700'}">
                        <div class="absolute top-1 bottom-1 bg-white rounded-full w-4 transition-all ${config.adConfig.enabled ? 'left-7' : 'left-1'}"></div>
                    </button>
               </div>
           </div>

           <div id="ads-container" class="space-y-6 transition-all duration-300 ${config.adConfig.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}">
               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div class="space-y-4">
                       <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wide border-b border-white/5 pb-2">App Configuration</h4>
                       <div>
                            <label class="text-xs text-slate-500 mb-1 block">Android App ID</label>
                            <input type="text" id="ad-android-app-id" value="${config.adConfig.androidAppId}" placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx" class="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none transition-colors" />
                       </div>
                       <div>
                            <label class="text-xs text-slate-500 mb-1 block">iOS App ID</label>
                            <input type="text" id="ad-ios-app-id" value="${config.adConfig.iosAppId}" placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx" class="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none transition-colors" />
                       </div>
                       <div class="flex items-center gap-2 pt-2">
                            <input type="checkbox" id="ad-auto-banner" ${config.adConfig.autoShowBanner ? 'checked' : ''} class="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-600 focus:ring-0" />
                            <label for="ad-auto-banner" class="text-sm text-slate-300">Auto-show Banner on App Start</label>
                       </div>
                   </div>
                   
                   <div class="space-y-4">
                       <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wide border-b border-white/5 pb-2">Ad Units</h4>
                       <div>
                            <label class="text-xs text-slate-500 mb-1 block">Banner ID</label>
                            <input type="text" id="ad-banner-id" value="${config.adConfig.bannerId}" placeholder="ca-app-pub-xxx/xxx" class="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none transition-colors" />
                       </div>
                       
                       <!-- Banner Position -->
                       <div>
                            <label class="text-xs text-slate-500 mb-1 block">Banner Position</label>
                            <div class="flex bg-slate-950 rounded-lg p-1 border border-slate-700/50">
                                <button id="pos-top" class="flex-1 py-1.5 text-xs rounded-md transition-all font-medium ${config.adConfig.bannerPosition === 'top' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}">Top</button>
                                <button id="pos-bottom" class="flex-1 py-1.5 text-xs rounded-md transition-all font-medium ${config.adConfig.bannerPosition === 'bottom' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}">Bottom</button>
                            </div>
                       </div>

                       <div>
                            <label class="text-xs text-slate-500 mb-1 block">Interstitial ID</label>
                            <input type="text" id="ad-interstitial-id" value="${config.adConfig.interstitialId}" placeholder="ca-app-pub-xxx/xxx" class="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none transition-colors" />
                       </div>
                       <div>
                            <label class="text-xs text-slate-500 mb-1 block">Rewarded ID</label>
                            <input type="text" id="ad-rewarded-id" value="${config.adConfig.rewardedId}" placeholder="ca-app-pub-xxx/xxx" class="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none transition-colors" />
                       </div>
                   </div>
               </div>
               
               <div class="pt-4 border-t border-white/5 flex items-center justify-between">
                    <p class="text-[10px] text-slate-500 italic max-w-md">
                        * Plugin <code>admob-plus-cordova</code> will be auto-installed. Ad placement logic will be generated in <code>www/js/admob.js</code>.
                    </p>
                    <button id="btn-save-ads" class="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95">
                        <i data-lucide="save" class="w-4 h-4"></i>
                        <span>SIMPAN</span>
                    </button>
               </div>
           </div>
      </div>
    </div>
  `;
};

export const monetizationListeners = () => {
    // Ads Toggle & Checkbox
    document.getElementById('toggle-ads')?.addEventListener('click', () => {
        const enabled = !state.config.adConfig.enabled;
        state.config.adConfig.enabled = enabled;
        updateConfig({ adConfig: state.config.adConfig });
    });
    
    document.getElementById('ad-auto-banner')?.addEventListener('change', (e) => {
        state.config.adConfig.autoShowBanner = (e.target as HTMLInputElement).checked;
    });

    // Position Toggles
    const updatePos = (pos: 'top' | 'bottom') => {
        state.config.adConfig.bannerPosition = pos;
        updateConfig({ adConfig: state.config.adConfig }); // Trigger re-render to update classes
    };
    document.getElementById('pos-top')?.addEventListener('click', () => updatePos('top'));
    document.getElementById('pos-bottom')?.addEventListener('click', () => updatePos('bottom'));

    // Inputs - Update local state object immediately
    const bindInput = (id: string, key: keyof typeof state.config.adConfig) => {
        const el = document.getElementById(id) as HTMLInputElement;
        if (el) {
            el.addEventListener('input', (e) => {
                (state.config.adConfig as any)[key] = (e.target as HTMLInputElement).value;
            });
        }
    };

    bindInput('ad-android-app-id', 'androidAppId');
    bindInput('ad-ios-app-id', 'iosAppId');
    bindInput('ad-banner-id', 'bannerId');
    bindInput('ad-interstitial-id', 'interstitialId');
    bindInput('ad-rewarded-id', 'rewardedId');

    // SAVE BUTTON LOGIC
    document.getElementById('btn-save-ads')?.addEventListener('click', () => {
        // Force a full update configuration to sync virtual files and plugins
        const btn = document.getElementById('btn-save-ads');
        if (btn) {
            const originalContent = btn.innerHTML;
            btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Menyimpan...</span>`;
            
            // Collect latest DOM values to be absolutely sure
            const getVal = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';
            const getCheck = (id: string) => (document.getElementById(id) as HTMLInputElement)?.checked || false;

            const newAdConfig = {
                ...state.config.adConfig,
                androidAppId: getVal('ad-android-app-id'),
                iosAppId: getVal('ad-ios-app-id'),
                bannerId: getVal('ad-banner-id'),
                interstitialId: getVal('ad-interstitial-id'),
                rewardedId: getVal('ad-rewarded-id'),
                autoShowBanner: getCheck('ad-auto-banner'),
                // bannerPosition is handled by state directly via buttons
            };

            // Small timeout to show the "Saving" state before the app re-renders
            setTimeout(() => {
                updateConfig({ adConfig: newAdConfig });
            }, 300);
        }
    });
};
