
import { AssetEntry } from '../types';
import { updateState, state } from '../index';
import { createIcons, icons } from 'lucide';

// Cordova Icon Standards
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

// Cordova Splash Screen Standards
const splashSizes = {
    android: [
        { name: 'screen-ldpi-portrait.png', w: 200, h: 320 },
        { name: 'screen-mdpi-portrait.png', w: 320, h: 480 },
        { name: 'screen-hdpi-portrait.png', w: 480, h: 800 },
        { name: 'screen-xhdpi-portrait.png', w: 720, h: 1280 },
        { name: 'screen-xxhdpi-portrait.png', w: 960, h: 1600 },
        { name: 'screen-xxxhdpi-portrait.png', w: 1280, h: 1920 },
        { name: 'screen-ldpi-landscape.png', w: 320, h: 200 },
        { name: 'screen-mdpi-landscape.png', w: 480, h: 320 },
        { name: 'screen-hdpi-landscape.png', w: 800, h: 480 },
        { name: 'screen-xhdpi-landscape.png', w: 1280, h: 720 },
        { name: 'screen-xxhdpi-landscape.png', w: 1600, h: 960 },
        { name: 'screen-xxxhdpi-landscape.png', w: 1920, h: 1280 },
    ],
    ios: [
        { name: 'Default@2x~universal~anyany.png', w: 2732, h: 2732 },
        // Common legacy sizes
        { name: 'Default-568h@2x~iphone.png', w: 640, h: 1136 },
        { name: 'Default-667h.png', w: 750, h: 1334 },
        { name: 'Default-736h.png', w: 1242, h: 2208 },
        { name: 'Default-Portrait@2x~ipad.png', w: 1536, h: 2048 },
        { name: 'Default-Landscape@2x~ipad.png', w: 2048, h: 1536 },
    ]
};

let previewUrl = '';
let processing = false;

export const AssetGenerator = (assets: AssetEntry[]) => {
  const isSplash = state.activeAssetTab === 'splash';
  const filteredAssets = assets.filter(a => isSplash ? a.assetType === 'splash' : (a.assetType === 'icon' || !a.assetType));

  return `
    <div class="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-bold text-white mb-2">Asset Generator</h2>
            <p class="text-slate-400">Generate icons and splash screens automatically.</p>
          </div>
          ${filteredAssets.length > 0 && !processing ? `
              <div class="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center gap-2">
                 <i data-lucide="check-circle" class="w-5 h-5"></i>
                 <span>${filteredAssets.length} assets ready</span>
              </div>
          ` : ''}
      </div>

      <!-- Tabs -->
      <div class="flex space-x-1 bg-slate-900/50 p-1 rounded-xl border border-white/5 w-fit">
          <button id="tab-icon" class="px-6 py-2 rounded-lg text-sm font-medium transition-all ${!isSplash ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">
              App Icons
          </button>
          <button id="tab-splash" class="px-6 py-2 rounded-lg text-sm font-medium transition-all ${isSplash ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">
              Splash Screens
          </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Upload & Canvas Section -->
        <div class="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-white/5 shadow-inner flex flex-col items-center justify-center space-y-6">
            ${previewUrl ? `
                <div class="relative group">
                    <img src="${previewUrl}" class="w-48 h-48 rounded-2xl shadow-2xl object-cover border border-white/10 ${processing ? 'opacity-50 grayscale' : ''}" />
                    <button id="btn-clear-assets" class="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors" ${processing ? 'disabled style="display:none"' : ''}>
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            ` : `
                <div class="w-48 h-48 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-800/20 group-hover:bg-slate-800/40 transition-colors">
                    <i data-lucide="${isSplash ? 'image' : 'image-plus'}" class="w-10 h-10 mb-3 opacity-50"></i>
                    <span class="text-sm">Upload ${isSplash ? 'Master Splash' : '1024x1024 Icon'}</span>
                </div>
            `}

            <div class="w-full relative group">
                 <input type="file" id="asset-upload" accept="image/png, image/jpeg" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" ${processing ? 'disabled' : ''} />
                 <button class="w-full py-3 bg-cyan-600 text-white rounded-xl font-medium shadow-lg shadow-cyan-500/20 group-hover:bg-cyan-500 transition-colors flex items-center justify-center gap-2 ${processing ? 'opacity-75 cursor-wait' : ''}">
                    ${processing 
                        ? `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing...` 
                        : (previewUrl ? 'Change Master Image' : 'Select Master Image')
                    }
                 </button>
            </div>
            <p class="text-xs text-slate-500 text-center max-w-xs">
                ${isSplash ? 'Recommended: 2732x2732 PNG. Will be center-cropped to fit all screens.' : 'Recommended: 1024x1024 PNG without transparency for iOS compliance.'}
            </p>
        </div>

        <!-- Generated List -->
        <div class="lg:col-span-2 bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-white/5 shadow-inner flex flex-col relative min-h-[400px]">
            <h3 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <i data-lucide="layers" class="w-5 h-5 text-purple-400"></i>
                Generated Output (${isSplash ? 'Splash' : 'Icon'})
            </h3>
            
            ${processing ? `
                <div class="absolute inset-0 top-16 z-10 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-b-2xl animate-in fade-in duration-300">
                    <div class="bg-slate-900 p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center">
                        <i data-lucide="loader-2" class="w-10 h-10 text-cyan-500 animate-spin mb-3"></i>
                        <p class="text-slate-200 font-medium">Processing Assets...</p>
                        <p class="text-xs text-slate-500 mt-1">Generating various sizes...</p>
                    </div>
                </div>
            ` : ''}

            ${filteredAssets.length === 0 ? `
                <div class="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3 min-h-[300px]">
                    <i data-lucide="box-select" class="w-12 h-12 opacity-20"></i>
                    <p>No ${isSplash ? 'splash screens' : 'icons'} generated yet.</p>
                </div>
            ` : `
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar max-h-[500px] ${processing ? 'opacity-20 pointer-events-none' : ''}">
                    ${filteredAssets.map(a => `
                        <div class="bg-slate-950 p-3 rounded-xl border border-white/5 flex flex-col items-center space-y-2 relative group">
                            <div class="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center relative">
                                <img src="${URL.createObjectURL(a.blob)}" class="w-full h-full object-contain" />
                            </div>
                            <div class="text-center w-full">
                                <p class="text-xs font-mono text-cyan-300 truncate w-full" title="${a.name}">${a.name}</p>
                                <p class="text-[10px] text-slate-500">${a.size}x${a.height || a.size} px</p>
                            </div>
                            <div class="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded ${a.platform === 'android' ? 'bg-green-900/20 text-green-400' : 'bg-slate-700 text-white'}">
                                ${a.platform}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
      </div>
    </div>
  `;
};

// Logic for Image Processing
export const assetListeners = () => {
    // Tabs
    const tabIcon = document.getElementById('tab-icon');
    const tabSplash = document.getElementById('tab-splash');

    if (tabIcon) tabIcon.onclick = () => {
        updateState({ activeAssetTab: 'icon' });
        previewUrl = ''; // Reset preview on tab switch
    };
    if (tabSplash) tabSplash.onclick = () => {
        updateState({ activeAssetTab: 'splash' });
        previewUrl = '';
    };

    const input = document.getElementById('asset-upload') as HTMLInputElement;
    const clearBtn = document.getElementById('btn-clear-assets');

    if (clearBtn) {
        clearBtn.onclick = () => {
            previewUrl = '';
            // Remove assets of current type only
            const isSplash = state.activeAssetTab === 'splash';
            const keptAssets = state.assets.filter(a => isSplash ? (a.assetType !== 'splash') : (a.assetType === 'splash'));
            updateState({ assets: keptAssets });
        };
    }

    if (input) {
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            // Start Loading State
            processing = true;
            const url = URL.createObjectURL(file);
            previewUrl = url;
            updateState({}); // Trigger re-render to show loading UI

            // Artificial delay to allow UI to paint
            await new Promise(r => requestAnimationFrame(r));

            const img = new Image();
            
            img.onload = async () => {
                const generatedAssets: AssetEntry[] = [];
                const isSplash = state.activeAssetTab === 'splash';

                // Helper to resize (Icon - Square)
                const resizeIcon = async (w: number, name: string, platform: 'android' | 'ios') => {
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = w;
                    const ctx = canvas.getContext('2d');
                    if(ctx) {
                        ctx.drawImage(img, 0, 0, w, w);
                        return new Promise<void>((resolve) => {
                            canvas.toBlob((blob) => {
                                if(blob) {
                                    generatedAssets.push({
                                        name: name,
                                        blob: blob,
                                        size: w,
                                        height: w,
                                        platform,
                                        assetType: 'icon'
                                    });
                                }
                                resolve();
                            }, 'image/png');
                        });
                    }
                };

                // Helper to resize (Splash - Cover Crop)
                const resizeSplash = async (w: number, h: number, name: string, platform: 'android' | 'ios') => {
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if(ctx) {
                        // Calculate Cover Crop
                        const ratio = w / h;
                        const imgRatio = img.width / img.height;
                        let sWidth, sHeight, sx, sy;

                        if (imgRatio > ratio) {
                            // Image is wider than target. Crop width.
                            sHeight = img.height;
                            sWidth = img.height * ratio;
                            sy = 0;
                            sx = (img.width - sWidth) / 2;
                        } else {
                            // Image is taller than target. Crop height.
                            sWidth = img.width;
                            sHeight = img.width / ratio;
                            sx = 0;
                            sy = (img.height - sHeight) / 2;
                        }
                        
                        // Clear canvas first
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, w, h);

                        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, w, h);
                        
                        return new Promise<void>((resolve) => {
                            canvas.toBlob((blob) => {
                                if(blob) {
                                    generatedAssets.push({
                                        name: name,
                                        blob: blob,
                                        size: w,
                                        height: h,
                                        platform,
                                        assetType: 'splash'
                                    });
                                }
                                resolve();
                            }, 'image/png');
                        });
                    }
                };

                if (!isSplash) {
                    // Process Android Icons
                    for (const s of iconSizes.android) {
                        await resizeIcon(s.size, s.name, 'android');
                    }
                    // Process iOS Icons
                    for (const s of iconSizes.ios) {
                        await resizeIcon(s.size, s.name, 'ios');
                    }
                } else {
                    // Process Android Splash
                    for (const s of splashSizes.android) {
                        await resizeSplash(s.w, s.h, s.name, 'android');
                    }
                    // Process iOS Splash
                    for (const s of splashSizes.ios) {
                        await resizeSplash(s.w, s.h, s.name, 'ios');
                    }
                }

                // Finish
                processing = false;
                // Merge with existing assets of OTHER type
                const keptAssets = state.assets.filter(a => isSplash ? (a.assetType !== 'splash') : (a.assetType === 'splash'));
                updateState({ assets: [...keptAssets, ...generatedAssets] });
            };

            img.src = url;
        };
    }
};
