import { ProjectConfig, FileEntry } from '../types';
import { updateState } from '../index';

let deviceType: 'phone' | 'tablet' = 'phone';
let orientation: 'portrait' | 'landscape' = 'portrait';
let iframeUrl = '';

export const DevicePreview = (config: ProjectConfig, files: FileEntry[]) => {
  // Logic to determine URL
  if (config.sourceType === 'url') {
      iframeUrl = config.sourceValue;
  } else {
      iframeUrl = '';
  }

  const isLandscape = orientation === 'landscape';
  
  const dim = deviceType === 'phone' 
    ? (isLandscape ? { w: '720px', h: '340px' } : { w: '340px', h: '720px' })
    : (isLandscape ? { w: '800px', h: '560px' } : { w: '560px', h: '800px' });

  return `
    <div class="flex flex-col h-full gap-6 animate-in zoom-in-95 duration-500">
      <!-- Control Bar -->
      <div class="flex flex-wrap items-center justify-between bg-slate-900/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-2xl relative z-20">
        <div class="flex items-center space-x-4">
            <div class="bg-slate-950/80 p-1 rounded-xl flex space-x-1 border border-white/5">
                <button id="btn-phone" class="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 ${deviceType === 'phone' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}">
                    <i data-lucide="smartphone" class="w-4 h-4"></i>
                    <span class="text-sm font-medium">Phone</span>
                </button>
                <button id="btn-tablet" class="px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 ${deviceType === 'tablet' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}">
                    <i data-lucide="tablet" class="w-4 h-4"></i>
                    <span class="text-sm font-medium">Tablet</span>
                </button>
            </div>

            <div class="h-8 w-px bg-white/10 mx-2 hidden sm:block"></div>

            <button id="btn-rotate" class="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all flex items-center gap-2 group">
                <i data-lucide="rotate-ccw" class="w-4 h-4 transition-transform duration-500 ${isLandscape ? '-rotate-90' : 'group-hover:rotate-180'}"></i>
                <span class="text-sm font-medium hidden sm:inline">${isLandscape ? 'Landscape' : 'Portrait'}</span>
            </button>
        </div>

        <div class="flex items-center gap-3">
             <div class="hidden md:flex items-center gap-2 text-xs text-slate-500 px-3 py-1.5 rounded-full bg-slate-950/50 border border-white/5">
                 <i data-lucide="mouse-pointer-2" class="w-3 h-3"></i>
                 <span>Move cursor to tilt</span>
             </div>
             <div class="flex items-center text-xs font-mono text-cyan-400 bg-cyan-950/30 px-3 py-1.5 rounded-lg border border-cyan-500/20 shadow-[0_0_10px_-3px_rgba(6,182,212,0.3)]">
                ${dim.w} × ${dim.h}
            </div>
        </div>
      </div>

      <div class="flex flex-col xl:flex-row h-full gap-8 min-h-0 relative z-10">
        <!-- Device Stage -->
        <div 
            id="device-stage"
            class="flex-1 flex justify-center items-center bg-gradient-to-br from-slate-900/50 to-slate-950/80 relative overflow-hidden rounded-[2rem] border border-white/5 shadow-inner group perspective-1000"
            style="perspective: 2000px"
        >
             <!-- 3D Grid Floor -->
             <div class="absolute inset-0 opacity-30 pointer-events-none" 
                  style="background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 40px 40px; transform: perspective(500px) rotateX(60deg) translateY(100px) scale(2)">
             </div>
             
             <!-- Dynamic Glow -->
             <div id="device-glow" class="absolute w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none transition-all duration-700 ease-out"
                  style="width: ${isLandscape ? '60%' : '80%'}; opacity: ${deviceType === 'tablet' ? '0.15' : '0.1'};"></div>

             <!-- The 3D Device Container -->
             <div 
                id="device-container"
                class="relative transform-gpu transition-all duration-700 cubic-bezier(0.23, 1, 0.32, 1)"
                style="width: ${dim.w}; height: ${dim.h}; max-height: 85%; max-width: 85%;"
             >
                <!-- Shadows & Chassis -->
                <div id="device-shadow" class="absolute top-20 left-10 right-10 bottom-[-50px] bg-black/60 blur-[40px] rounded-full transform scale-90 opacity-60 transition-transform duration-100"></div>
                <div class="absolute -inset-[14px] bg-[#0f0f0f] rounded-[3.6rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)]"></div>
                <div class="absolute -inset-[10px] bg-gradient-to-tr from-[#2a2a2a] via-[#4a4a4a] to-[#2a2a2a] rounded-[3.4rem]"></div>
                <div class="absolute -inset-[4px] bg-[#121212] rounded-[3rem] shadow-[inset_0_0_10px_rgba(0,0,0,1)] border border-white/5"></div>
                
                <!-- Buttons -->
                <div class="absolute bg-[#1a1a1a] rounded-l-md shadow-lg transition-all duration-500 ${isLandscape ? 'bottom-[-10px] left-24 h-1 w-12 border-b border-white/10' : 'top-24 -left-[12px] h-12 w-1 border-l border-white/10'}"></div>
                <div class="absolute bg-[#1a1a1a] rounded-l-md shadow-lg transition-all duration-500 ${isLandscape ? 'bottom-[-10px] left-40 h-1 w-8 border-b border-white/10' : 'top-40 -left-[12px] h-20 w-1 border-l border-white/10'}"></div>

                <!-- Screen -->
                <div class="absolute inset-0 bg-black rounded-[2.5rem] overflow-hidden z-20 shadow-[0_0_0_2px_#000]">
                    <!-- Notch/Dynamic Island -->
                    <div class="absolute z-50 bg-black transition-all duration-500 flex items-center justify-center pointer-events-none shadow-sm ${deviceType === 'tablet' ? 'hidden' : (isLandscape ? 'h-full w-[28px] left-0 top-1/2 -translate-y-1/2 rounded-r-2xl border-r border-y border-white/5' : 'w-[120px] h-[34px] top-3 left-1/2 -translate-x-1/2 rounded-full border-b border-x border-white/5')}">
                        ${deviceType === 'phone' ? '<div class="flex gap-3 opacity-20"><div class="w-2.5 h-2.5 rounded-full bg-[#1a237e]"></div><div class="w-1.5 h-1.5 rounded-full bg-[#333]"></div></div>' : ''}
                    </div>

                    <!-- Content -->
                    <div class="w-full h-full bg-white relative">
                         ${(config.sourceType === 'url' && iframeUrl) ? `
                            <iframe src="${iframeUrl}" class="w-full h-full border-none bg-white" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
                         ` : `
                            <div class="w-full h-full flex flex-col items-center justify-center text-slate-800 p-6 text-center space-y-6 bg-slate-50 relative overflow-hidden">
                                <div class="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
                                <div class="relative group/icon z-10">
                                    <div class="p-8 bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 relative transform group-hover/icon:scale-105 transition-transform duration-500">
                                        <i data-lucide="${config.sourceType === 'folder' ? 'folder-open' : 'alert-triangle'}" class="w-12 h-12 ${config.sourceType === 'folder' ? 'text-cyan-600' : 'text-orange-500'}"></i>
                                    </div>
                                </div>
                                <div class="max-w-[240px] relative z-10">
                                    <h3 class="font-bold text-xl mb-2 text-slate-900">${config.sourceType === 'folder' ? 'Local Assets' : (config.sourceType === 'github' ? 'GitHub Repo' : 'Preview Blocked')}</h3>
                                    <p class="text-sm text-slate-500 font-medium">
                                        ${config.sourceType === 'folder' ? `Previewing ${files.length} bundled files` : 'Static preview not available.'}
                                    </p>
                                </div>
                            </div>
                         `}
                         
                         <!-- Reflection -->
                         <div id="screen-reflection" class="absolute inset-0 pointer-events-none z-30 opacity-40 mix-blend-overlay transition-transform duration-100 ease-out" style="background: linear-gradient(115deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.1) 100%)"></div>
                    </div>
                </div>
             </div>
        </div>

        <!-- Sidebar Info -->
        <div class="w-full xl:w-80 space-y-4">
            <div class="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <i data-lucide="monitor" class="w-3.5 h-3.5 text-cyan-400"></i> Display Specs
                </h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center text-sm py-2 border-b border-white/5">
                        <span class="text-slate-400">Device Model</span>
                        <span class="text-white font-medium capitalize flex items-center gap-2">
                             <i data-lucide="${deviceType === 'phone' ? 'smartphone' : 'tablet'}" class="w-3.5 h-3.5"></i> ${deviceType}
                        </span>
                    </div>
                     <div class="flex justify-between items-center text-sm py-2 border-b border-white/5">
                        <span class="text-slate-400">Orientation</span>
                        <span class="text-white font-medium capitalize">${orientation}</span>
                    </div>
                     <div class="flex justify-between items-center text-sm py-2 border-b border-white/5">
                        <span class="text-slate-400">Resolution</span>
                        <span class="text-cyan-400 font-mono text-xs bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20">${dim.w.replace('px', '')} x ${dim.h.replace('px', '')}</span>
                    </div>
                </div>
                <button id="btn-refresh" class="mt-8 w-full group flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 hover:text-cyan-400 text-slate-300 py-3 rounded-xl transition-all border border-white/5 hover:border-cyan-500/30 shadow-lg">
                    <i data-lucide="refresh-cw" class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"></i>
                    <span class="text-sm font-semibold">Refresh Viewport</span>
                </button>
            </div>
            
             <div class="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl flex-1 min-h-0 flex flex-col">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Source Manifest</h3>
                <div class="text-xs text-cyan-300/80 mb-4 bg-cyan-950/20 p-3 rounded-lg border border-cyan-500/10 font-mono truncate flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                    ${config.sourceValue || 'No source mounted'}
                </div>
                 ${config.sourceType === 'folder' ? `
                     <div class="flex-1 overflow-hidden flex flex-col relative">
                        <div class="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-slate-900/60 to-transparent z-10"></div>
                        <div class="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar pt-2">
                            ${files.map((f, i) => `
                                <div class="text-xs text-slate-400 hover:text-white transition-colors cursor-default truncate flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5">
                                    <span class="text-slate-600 font-mono text-[10px]">${(i+1).toString().padStart(2, '0')}</span>
                                    ${f.path || f.name}
                                </div>
                            `).join('')}
                        </div>
                     </div>
                 ` : ''}
            </div>
        </div>
      </div>
    </div>
  `;
};

// Interactive Tilt Logic
export const previewListeners = () => {
    document.getElementById('btn-phone')?.addEventListener('click', () => {
        deviceType = 'phone';
        updateState({}); // Trigger re-render
    });
    document.getElementById('btn-tablet')?.addEventListener('click', () => {
        deviceType = 'tablet';
        updateState({});
    });
    document.getElementById('btn-rotate')?.addEventListener('click', () => {
        orientation = orientation === 'portrait' ? 'landscape' : 'portrait';
        updateState({});
    });
    document.getElementById('btn-refresh')?.addEventListener('click', () => {
        const iframe = document.querySelector('iframe');
        if(iframe) iframe.src = iframe.src;
    });

    // 3D Tilt
    const stage = document.getElementById('device-stage');
    const container = document.getElementById('device-container');
    const glow = document.getElementById('device-glow');
    const reflection = document.getElementById('screen-reflection');
    const shadow = document.getElementById('device-shadow');

    const handleMove = (e: MouseEvent) => {
        if(!stage || !container) return;
        const rect = stage.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const normX = (e.clientX - centerX) / (rect.width / 2);
        const normY = (e.clientY - centerY) / (rect.height / 2);
        
        const rotX = -normY * 8; // Max 8 degrees
        const rotY = normX * 8;

        container.style.transition = 'transform 0.1s ease-out';
        container.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

        if(glow) {
            glow.style.transform = `translate(${rotY * 5}px, ${rotX * 5}px)`;
        }
        if(reflection) {
            reflection.style.background = `linear-gradient(${115 + rotX * 2}deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.1) 100%)`;
            reflection.style.transform = `translate(${rotY}px, ${rotX}px)`;
        }
        if(shadow) {
            shadow.style.transform = `translate(${-rotY * 4}px, ${-rotX * 4}px) scale(0.9)`;
        }
    };

    const handleLeave = () => {
        if(!container) return;
        container.style.transition = 'transform 0.7s cubic-bezier(0.23, 1, 0.32, 1)';
        container.style.transform = `rotateX(0deg) rotateY(0deg)`;
        if(glow) glow.style.transform = 'translate(0,0)';
        if(shadow) shadow.style.transform = 'scale(0.9)';
    };

    if(stage) {
        stage.addEventListener('mousemove', handleMove);
        stage.addEventListener('mouseleave', handleLeave);
    }

    // Return cleanup function
    return () => {
        if(stage) {
            stage.removeEventListener('mousemove', handleMove);
            stage.removeEventListener('mouseleave', handleLeave);
        }
    };
};

export const cleanupPreview = () => {};