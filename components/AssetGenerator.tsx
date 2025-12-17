
import { AssetEntry } from '../types';
import { updateState, state, showToast } from '../index';
import { generateAppIcon } from '../services/geminiService';
import { createIcons, icons } from 'lucide';

const iconSizes = {
  android: [
    { name: 'mipmap-ldpi.png', size: 36 },
    { name: 'mipmap-mdpi.png', size: 48 },
    { name: 'mipmap-hdpi.png', size: 72 },
    { name: 'mipmap-xhdpi.png', size: 96 },
    { name: 'mipmap-xxhdpi.png', size: 144 },
    { name: 'mipmap-xxxhdpi.png', size: 192 },
  ],
  ios: [
    { name: 'icon-20.png', size: 20 },
    { name: 'icon-20@2x.png', size: 40 },
    { name: 'icon-20@3x.png', size: 60 },
    { name: 'icon-29.png', size: 29 },
    { name: 'icon-29@2x.png', size: 58 },
    { name: 'icon-29@3x.png', size: 87 },
    { name: 'icon-40.png', size: 40 },
    { name: 'icon-40@2x.png', size: 80 },
    { name: 'icon-40@3x.png', size: 120 },
    { name: 'icon-60@2x.png', size: 120 },
    { name: 'icon-60@3x.png', size: 180 },
    { name: 'icon-76.png', size: 76 },
    { name: 'icon-76@2x.png', size: 152 },
    { name: 'icon-83.5@2x.png', size: 167 },
    { name: 'icon-1024.png', size: 1024 },
  ]
};

const splashSizes = {
    android: [
        { name: 'screen-ldpi-portrait.png', w: 200, h: 320 },
        { name: 'screen-mdpi-portrait.png', w: 320, h: 480 },
        { name: 'screen-hdpi-portrait.png', w: 480, h: 800 },
        { name: 'screen-xhdpi-portrait.png', w: 720, h: 1280 },
        { name: 'screen-xxhdpi-portrait.png', w: 960, h: 1600 },
        { name: 'screen-xxxhdpi-portrait.png', w: 1280, h: 1920 },
    ],
    ios: [
        { name: 'Default@2x~universal~anyany.png', w: 2732, h: 2732 },
    ]
};

let previewUrl = '';
let processing = false;
let aiGenerating = false;
let aiPrompt = '';

export const AssetGenerator = (assets: AssetEntry[]) => {
  const isSplash = state.activeAssetTab === 'splash';
  const filteredAssets = assets.filter(a => isSplash ? a.assetType === 'splash' : (a.assetType === 'icon' || !a.assetType));

  return `
    <div class="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-bold text-white mb-2">Asset Generator</h2>
            <p class="text-slate-400">Manage icons and splash screens.</p>
          </div>
      </div>

      <div class="flex space-x-1 bg-slate-900/50 p-1 rounded-xl border border-white/5 w-fit">
          <button id="tab-icon" class="px-6 py-2 rounded-lg text-sm font-medium transition-all ${!isSplash ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">
              App Icons
          </button>
          <button id="tab-splash" class="px-6 py-2 rounded-lg text-sm font-medium transition-all ${isSplash ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">
              Splash Screens
          </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-white/5 shadow-inner flex flex-col items-center justify-center space-y-6">
            
            ${!isSplash ? `
                <div class="w-full space-y-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <h4 class="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                        <i data-lucide="sparkles" class="w-3 h-3"></i> AI Icon Studio
                    </h4>
                    <textarea 
                        id="ai-icon-prompt" 
                        placeholder="Deskripsikan icon yang diinginkan (contoh: minimalist robot icon with cyan glowing eyes)" 
                        class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-600 resize-none h-20 outline-none focus:border-purple-500 transition-colors"
                    >${aiPrompt}</textarea>
                    <button id="btn-generate-ai-icon" class="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2" ${aiGenerating ? 'disabled' : ''}>
                        ${aiGenerating ? '<i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i> Generating...' : '<i data-lucide="zap" class="w-3 h-3"></i> Generate with AI'}
                    </button>
                </div>
                <div class="w-full h-px bg-white/5"></div>
            ` : ''}

            <div class="relative group">
                ${previewUrl ? `
                    <img src="${previewUrl}" class="w-48 h-48 rounded-2xl shadow-2xl object-cover border border-white/10" />
                    <button id="btn-clear-assets" class="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                ` : `
                    <div class="w-48 h-48 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-800/20">
                        <i data-lucide="image-plus" class="w-10 h-10 mb-3 opacity-50"></i>
                        <span class="text-xs">Upload Master</span>
                    </div>
                `}
            </div>

            <div class="w-full relative group">
                 <input type="file" id="asset-upload" accept="image/png, image/jpeg" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" ${processing ? 'disabled' : ''} />
                 <button class="w-full py-3 bg-slate-800 text-white rounded-xl font-medium border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="upload" class="w-4 h-4"></i> Upload Manual
                 </button>
            </div>
        </div>

        <div class="lg:col-span-2 bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-white/5 shadow-inner flex flex-col relative min-h-[400px]">
            <h3 class="text-lg font-semibold text-white mb-6">Generated Output</h3>
            
            ${processing || aiGenerating ? `
                <div class="absolute inset-0 z-10 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                    <i data-lucide="loader-2" class="w-10 h-10 text-cyan-500 animate-spin mb-3"></i>
                    <p class="text-slate-200 font-medium">Processing Assets...</p>
                </div>
            ` : ''}

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
                ${filteredAssets.map(a => `
                    <div class="bg-slate-950 p-3 rounded-xl border border-white/5 flex flex-col items-center space-y-2">
                        <img src="${URL.createObjectURL(a.blob)}" class="w-12 h-12 object-contain" />
                        <p class="text-[10px] font-mono text-cyan-300 truncate w-full text-center">${a.name}</p>
                        <span class="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded ${a.platform === 'android' ? 'bg-green-900/20 text-green-400' : 'bg-slate-700 text-white'}">${a.platform}</span>
                    </div>
                `).join('')}
            </div>
        </div>
      </div>
    </div>
  `;
};

export const assetListeners = () => {
    createIcons({ icons });

    document.getElementById('tab-icon')?.addEventListener('click', () => updateState({ activeAssetTab: 'icon' }));
    document.getElementById('tab-splash')?.addEventListener('click', () => updateState({ activeAssetTab: 'splash' }));

    const promptEl = document.getElementById('ai-icon-prompt') as HTMLTextAreaElement;
    if (promptEl) {
        promptEl.oninput = (e) => { aiPrompt = (e.target as HTMLTextAreaElement).value; };
    }

    document.getElementById('btn-generate-ai-icon')?.addEventListener('click', async () => {
        if (!aiPrompt) return showToast("Harap isi deskripsi icon!", "error");
        
        aiGenerating = true;
        updateState({});

        try {
            const dataUrl = await generateAppIcon(aiPrompt);
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            
            // Trigger processing with this blob
            await processMasterBlob(blob);
            showToast("AI Icon generated!", "success");
        } catch (e) {
            showToast("AI Generation failed", "error");
        } finally {
            aiGenerating = false;
            updateState({});
        }
    });

    document.getElementById('asset-upload')?.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) await processMasterBlob(file);
    });

    document.getElementById('btn-clear-assets')?.addEventListener('click', () => {
        previewUrl = '';
        const isSplash = state.activeAssetTab === 'splash';
        updateState({ assets: state.assets.filter(a => isSplash ? a.assetType !== 'splash' : a.assetType === 'splash') });
    });
};

const processMasterBlob = async (blob: Blob) => {
    processing = true;
    previewUrl = URL.createObjectURL(blob);
    updateState({});

    const img = new Image();
    img.src = previewUrl;
    await new Promise(r => img.onload = r);

    const generatedAssets: AssetEntry[] = [];
    const isSplash = state.activeAssetTab === 'splash';

    const resize = async (w: number, h: number, name: string, platform: 'android' | 'ios', type: 'icon' | 'splash') => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if(ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            return new Promise<void>(resolve => {
                canvas.toBlob(b => {
                    if(b) generatedAssets.push({ name, blob: b, size: w, height: h, platform, assetType: type });
                    resolve();
                }, 'image/png');
            });
        }
    };

    if (!isSplash) {
        for (const s of iconSizes.android) await resize(s.size, s.size, s.name, 'android', 'icon');
        for (const s of iconSizes.ios) await resize(s.size, s.size, s.name, 'ios', 'icon');
    } else {
        for (const s of splashSizes.android) await resize(s.w, s.h, s.name, 'android', 'splash');
        for (const s of splashSizes.ios) await resize(s.w, s.h, s.name, 'ios', 'splash');
    }

    processing = false;
    const keptAssets = state.assets.filter(a => isSplash ? (a.assetType !== 'splash') : (a.assetType === 'icon' || !a.assetType));
    updateState({ assets: [...keptAssets, ...generatedAssets] });
};
