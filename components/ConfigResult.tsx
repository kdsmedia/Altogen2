
import { ProjectConfig, PermissionEntry } from '../types';
import { generateProjectConfig } from '../services/geminiService';
import { state, updateConfig, updateState } from '../index';
import JSZip from 'jszip';
import { createIcons, icons } from 'lucide';

let generatedXml = '';
let analysis = '';
let permissions: PermissionEntry[] = [];
let isLoading = true;
let errorMsg = '';
let newPluginInput = '';
let selectedCategory = 'All';
let pluginSearchTerm = '';

// Variables for Plugin Configuration Modal
let configuringPluginId: string | null = null;
let draftVars: { key: string; value: string }[] = [];

// Comprehensive Plugin Catalog
const PLUGIN_CATALOG = [
  // Essentials & Core
  { id: 'cordova-plugin-device', name: 'Device Info', desc: 'Get device model, UUID, version.', icon: 'smartphone', category: 'Core' },
  { id: 'cordova-plugin-network-information', name: 'Network Info', desc: 'Check connection type (WiFi/4G).', icon: 'wifi', category: 'Core' },
  { id: 'cordova-plugin-whitelist', name: 'Whitelist', desc: 'Network request security rules.', icon: 'shield', category: 'Core' },
  { id: 'cordova-plugin-splashscreen', name: 'Splash Screen', desc: 'Control the launch image.', icon: 'image', category: 'Core' },
  
  // UI & UX
  { id: 'cordova-plugin-statusbar', name: 'Status Bar', desc: 'Customize the status bar color.', icon: 'panel-top', category: 'UI' },
  { id: 'cordova-plugin-dialogs', name: 'Dialogs', desc: 'Native alerts, confirms, prompts.', icon: 'message-square', category: 'UI' },
  { id: 'cordova-plugin-inappbrowser', name: 'InAppBrowser', desc: 'Open web pages inside app.', icon: 'globe', category: 'UI' },
  { id: 'cordova-plugin-screen-orientation', name: 'Screen Rotate', desc: 'Lock/unlock screen orientation.', icon: 'rotate-cw', category: 'UI' },
  { id: 'cordova-plugin-ionic-keyboard', name: 'Keyboard', desc: 'Keyboard control/events.', icon: 'keyboard', category: 'UI' },
  { id: 'cordova-plugin-vibration', name: 'Vibration', desc: 'Haptic feedback.', icon: 'vibrate', category: 'UI' },

  // Hardware Sensors
  { id: 'cordova-plugin-camera', name: 'Camera', desc: 'Take photos and record video.', icon: 'camera', category: 'Hardware' },
  { id: 'cordova-plugin-geolocation', name: 'Geolocation', desc: 'Access GPS/Location data.', icon: 'map-pin', category: 'Hardware' },
  { id: 'cordova-plugin-battery-status', name: 'Battery', desc: 'Monitor battery level/status.', icon: 'battery', category: 'Hardware' },
  { id: 'cordova-plugin-device-motion', name: 'Device Motion', desc: 'Accelerometer sensor access.', icon: 'move', category: 'Hardware' },
  { id: 'cordova-plugin-device-orientation', name: 'Orientation', desc: 'Compass sensor access.', icon: 'compass', category: 'Hardware' },
  { id: 'cordova-plugin-flashlight', name: 'Flashlight', desc: 'Toggle device flashlight.', icon: 'zap', category: 'Hardware' },
  { id: 'phonegap-plugin-barcodescanner', name: 'Barcode Scanner', desc: 'Scan QR and barcodes.', icon: 'scan', category: 'Hardware' },

  // Data & Storage
  { id: 'cordova-plugin-file', name: 'File System', desc: 'Read/Write files on device.', icon: 'hard-drive', category: 'Data' },
  { id: 'cordova-plugin-file-transfer', name: 'File Transfer', desc: 'Upload/Download files.', icon: 'arrow-right-left', category: 'Data' },
  { id: 'cordova-sqlite-storage', name: 'SQLite Storage', desc: 'Native SQL database engine.', icon: 'database', category: 'Data' },

  // Social & Media
  { id: 'cordova-plugin-media', name: 'Media', desc: 'Play and record audio files.', icon: 'music', category: 'Media' },
  { id: 'cordova-plugin-media-capture', name: 'Media Capture', desc: 'Capture audio, image, video.', icon: 'mic', category: 'Media' },
  { id: 'cordova-plugin-x-socialsharing', name: 'Social Share', desc: 'Share text/images to other apps.', icon: 'share-2', category: 'Social' },
  { id: 'cordova-plugin-local-notification', name: 'Local Notif', desc: 'Schedule local notifications.', icon: 'bell', category: 'Social' },
];

const CATEGORIES = ['All', 'Core', 'UI', 'Hardware', 'Data', 'Media', 'Social'];

export const ConfigResult = (config: ProjectConfig) => {
    // Determine loading state logic
    if (!generatedXml && isLoading && !errorMsg) {
       generateProjectConfig(config, state.files.map(f => f.name), state.assets)
        .then(res => {
            generatedXml = res.configXml;
            analysis = res.analysis;
            permissions = res.permissions;
            isLoading = false;
            updateState({}); // force render
        })
        .catch(err => {
            errorMsg = err.message || "Failed to generate";
            isLoading = false;
            generatedXml = `<!-- Fallback due to error -->\n<widget id="${config.id}" version="${config.version}">\n  <name>${config.name}</name>\n</widget>`;
            updateState({});
        });
    }

    // Filter Logic
    const filteredPlugins = PLUGIN_CATALOG.filter(p => {
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesSearch = p.name.toLowerCase().includes(pluginSearchTerm.toLowerCase()) || 
                              p.desc.toLowerCase().includes(pluginSearchTerm.toLowerCase()) || 
                              p.id.toLowerCase().includes(pluginSearchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

  return `
    <div class="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 relative">
       
       <!-- Plugin Config Modal -->
       ${configuringPluginId ? `
            <div class="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm rounded-xl flex items-center justify-center animate-in fade-in duration-200 p-4">
                <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-full">
                    <div class="p-6 border-b border-white/5 flex items-center justify-between">
                         <div>
                            <h3 class="text-xl font-bold text-white">Configure Plugin</h3>
                            <p class="text-sm text-cyan-400 font-mono mt-1">${configuringPluginId}</p>
                         </div>
                         <button id="btn-close-modal" class="text-slate-500 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
                    </div>
                    <div class="p-6 overflow-y-auto custom-scrollbar">
                        <p class="text-sm text-slate-400 mb-4">Add installation variables (e.g. API Keys, Usage Descriptions).</p>
                        
                        <div class="space-y-3" id="var-list">
                            ${draftVars.length === 0 ? `<p class="text-xs text-slate-600 italic text-center py-4">No variables configured</p>` : ''}
                            ${draftVars.map((v, idx) => `
                                <div class="flex gap-2">
                                    <input type="text" data-var-key="${idx}" value="${v.key}" placeholder="VARIABLE_NAME" class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:border-cyan-500 outline-none" />
                                    <input type="text" data-var-val="${idx}" value="${v.value}" placeholder="Value" class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none" />
                                    <button data-var-del="${idx}" class="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                </div>
                            `).join('')}
                        </div>
                        
                        <button id="btn-add-var" class="mt-4 w-full py-2 border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                            <i data-lucide="plus" class="w-3 h-3"></i> Add Variable
                        </button>
                    </div>
                    <div class="p-6 border-t border-white/5 flex justify-end gap-3 bg-slate-950/30 rounded-b-2xl">
                        <button id="btn-cancel-modal" class="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                        <button id="btn-save-vars" class="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2">
                            <i data-lucide="save" class="w-4 h-4"></i> Save Configuration
                        </button>
                    </div>
                </div>
            </div>
       ` : ''}

       <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
               <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                   <i data-lucide="terminal" class="w-6 h-6 text-cyan-400"></i>
                   Configuration
               </h2>
               <p class="text-slate-400">Generated artifacts and settings</p>
           </div>
           
           <div class="flex flex-wrap gap-2">
               <button id="btn-download-xml" class="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700">
                   <i data-lucide="file-code" class="w-4 h-4"></i>
                   <span>Download XML</span>
               </button>
               <button id="btn-download-zip" class="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all shadow-lg shadow-cyan-500/20">
                   <i data-lucide="archive" class="w-4 h-4"></i>
                   <span id="zip-text">Download Project (.zip)</span>
               </button>
           </div>
       </div>

       ${isLoading ? `
           <div class="flex-1 flex flex-col items-center justify-center space-y-4 bg-slate-900/50 rounded-xl border border-slate-800">
               <i data-lucide="loader-2" class="w-10 h-10 text-cyan-500 animate-spin"></i>
               <p class="text-slate-400">Consulting Gemini for optimal configuration, assets & permissions...</p>
           </div>
       ` : `
           <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
               <!-- Main Code Area -->
               <div class="lg:col-span-2 flex flex-col min-h-0 gap-6 overflow-y-auto custom-scrollbar pr-2">
                    
                    <!-- VISUAL PREFERENCES EDITOR -->
                    <div class="bg-slate-900/50 rounded-xl border border-white/5 p-6 shadow-sm">
                        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                           <i data-lucide="sliders" class="w-5 h-5 text-yellow-400"></i>
                           App Preferences
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Orientation -->
                            <div>
                                <label class="text-xs text-slate-500 uppercase font-bold mb-2 block">Orientation</label>
                                <div class="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                                    ${['default', 'portrait', 'landscape'].map(opt => `
                                        <button data-pref-orientation="${opt}" class="flex-1 py-1.5 text-xs rounded-md transition-all capitalize ${config.preferences.orientation === opt ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                                            ${opt}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <!-- Background Color -->
                            <div>
                                <label class="text-xs text-slate-500 uppercase font-bold mb-2 block">Background Color (Hex)</label>
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 rounded border border-white/10" style="background-color: #${config.preferences.backgroundColor}"></div>
                                    <input type="text" id="pref-bg-color" value="${config.preferences.backgroundColor}" class="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white font-mono" maxlength="6" />
                                </div>
                            </div>

                            <!-- Toggles -->
                            <div class="md:col-span-2 flex flex-wrap gap-4">
                                <label class="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-colors">
                                    <input type="checkbox" id="pref-fullscreen" class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-600" ${config.preferences.fullscreen ? 'checked' : ''}>
                                    <div>
                                        <span class="text-sm text-slate-200 font-medium">Fullscreen Mode</span>
                                        <p class="text-[10px] text-slate-500">Hide system status bars</p>
                                    </div>
                                </label>
                                <label class="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-colors">
                                    <input type="checkbox" id="pref-overscroll" class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-600" ${config.preferences.disallowOverscroll ? 'checked' : ''}>
                                    <div>
                                        <span class="text-sm text-slate-200 font-medium">Disallow Overscroll</span>
                                        <p class="text-[10px] text-slate-500">Prevent rubber-banding effect</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Config XML Preview -->
                    <div class="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col shadow-inner min-h-[300px]">
                        <div class="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                            <span class="text-xs text-slate-400 font-mono">config.xml</span>
                            <div class="flex gap-2">
                                <button id="btn-copy" class="text-xs hover:text-white text-slate-400 flex items-center gap-1 transition-colors">
                                    <i data-lucide="copy" class="w-3 h-3"></i> Copy
                                </button>
                                <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-500">XML</span>
                            </div>
                        </div>
                        <div class="flex-1 overflow-auto p-4 custom-scrollbar">
                            <pre class="text-sm font-mono text-cyan-100 leading-relaxed whitespace-pre-wrap">${generatedXml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </div>
                    </div>
               </div>

               <!-- Side Panel -->
               <div class="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex flex-col h-full">
                   
                   <!-- PLUGIN MARKETPLACE -->
                   <div class="bg-slate-800/50 rounded-xl flex flex-col border border-slate-700 flex-1 min-h-0">
                       <div class="p-6 border-b border-white/5">
                           <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                               <i data-lucide="package" class="w-4 h-4 text-cyan-400"></i>
                               Plugin Marketplace
                           </h3>
                           
                           <!-- Search & Add Manual -->
                           <div class="space-y-3">
                               <div class="relative">
                                    <i data-lucide="search" class="absolute left-3 top-2.5 w-4 h-4 text-slate-500"></i>
                                    <input 
                                        type="text" 
                                        id="plugin-search"
                                        value="${pluginSearchTerm}"
                                        placeholder="Search catalog..."
                                        class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none placeholder-slate-600"
                                    />
                               </div>
                               
                               <div class="flex gap-2">
                                   <input 
                                      type="text" 
                                      id="plugin-input"
                                      value="${newPluginInput}"
                                      placeholder="Or add custom ID..."
                                      class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-cyan-500 outline-none placeholder-slate-600 font-mono"
                                   />
                                   <button 
                                      id="btn-add-plugin"
                                      class="bg-slate-700 hover:bg-slate-600 text-white px-3 rounded-lg transition-colors text-xs font-bold"
                                   >
                                      Add
                                   </button>
                               </div>
                           </div>
                           
                           <!-- Categories -->
                           <div class="flex gap-2 overflow-x-auto pb-1 mt-4 custom-scrollbar">
                               ${CATEGORIES.map(cat => `
                                   <button 
                                      data-category="${cat}"
                                      class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-600'}"
                                   >
                                      ${cat}
                                   </button>
                               `).join('')}
                           </div>
                       </div>

                       <!-- Plugin Grid -->
                       <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div class="grid grid-cols-1 gap-2">
                                ${filteredPlugins.length === 0 ? `
                                    <div class="text-center py-8 text-slate-500">
                                        <p class="text-sm">No plugins found.</p>
                                    </div>
                                ` : filteredPlugins.map(p => {
                                    const isActive = config.plugins.includes(p.id);
                                    return `
                                    <div 
                                        data-toggle-plugin="${p.id}"
                                        class="group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${isActive ? 'bg-cyan-900/10 border-cyan-500/50 shadow-cyan-900/20' : 'bg-slate-900/30 border-slate-700/50 hover:bg-slate-800 hover:border-slate-500'}"
                                    >
                                        <div class="p-2 rounded-lg bg-slate-800 ${isActive ? 'text-cyan-400 ring-1 ring-cyan-500/30' : 'text-slate-400 group-hover:text-slate-200'} transition-colors">
                                            <i data-lucide="${p.icon}" class="w-5 h-5"></i>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center justify-between mb-0.5">
                                                <h4 class="text-sm font-semibold ${isActive ? 'text-cyan-100' : 'text-slate-200 group-hover:text-white'}">${p.name}</h4>
                                                <div class="w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isActive ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600 group-hover:border-slate-400'}">
                                                    ${isActive ? '<i data-lucide="check" class="w-3 h-3 text-white"></i>' : ''}
                                                </div>
                                            </div>
                                            <p class="text-[11px] text-slate-500 truncate group-hover:text-slate-400">${p.desc}</p>
                                            <span class="text-[9px] text-slate-600 font-mono mt-1 block truncate opacity-0 group-hover:opacity-100 transition-opacity">${p.id}</span>
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                       </div>
                       
                       <!-- Active Chips Footer -->
                       <div class="p-4 bg-slate-900/50 border-t border-white/5">
                            <p class="text-[10px] text-slate-500 uppercase font-bold mb-2">Installed Plugins (${config.plugins.length})</p>
                            <div class="flex flex-wrap gap-2 max-h-20 overflow-y-auto custom-scrollbar">
                               ${config.plugins.length === 0 ? `
                                   <span class="text-xs text-slate-500 italic">No custom plugins added.</span>
                               ` : config.plugins.map(p => {
                                   const hasVars = config.pluginVariables?.[p] && Object.keys(config.pluginVariables[p]).length > 0;
                                   return `
                                   <div class="flex items-center gap-1 bg-slate-800 border border-slate-600 rounded px-1.5 py-1 text-[10px] text-slate-300">
                                       <span class="max-w-[120px] truncate" title="${p}">${p}</span>
                                       
                                       <button data-config-plugin="${p}" class="text-slate-500 hover:text-cyan-400 p-0.5 transition-colors ${hasVars ? 'text-cyan-500' : ''}" title="Configure Variables">
                                            <i data-lucide="settings-2" class="w-3 h-3"></i>
                                       </button>
                                       <div class="w-px h-3 bg-slate-600 mx-0.5"></div>
                                       <button data-remove-plugin="${p}" class="text-slate-500 hover:text-red-400 p-0.5 transition-colors">
                                           <i data-lucide="x" class="w-3 h-3"></i>
                                       </button>
                                   </div>
                               `}).join('')}
                           </div>
                       </div>
                   </div>

                   <!-- AI Analysis -->
                   <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                       <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                           <i data-lucide="sparkles" class="w-4 h-4 text-purple-400"></i>
                           AI Analysis
                       </h3>
                       ${errorMsg ? `<div class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mb-4">${errorMsg}</div>` : ''}
                       <p class="text-slate-300 text-sm leading-relaxed">
                           ${analysis || "No specific insights generated."}
                       </p>
                   </div>
                   
                   <!-- Detected Permissions -->
                   <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                       <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                           <i data-lucide="shield" class="w-4 h-4 text-green-400"></i>
                           Permissions
                       </h3>
                       <div class="space-y-3">
                           ${permissions.length === 0 ? `
                               <p class="text-xs text-slate-500 italic">No specific permissions detected yet.</p>
                           ` : permissions.map(perm => `
                               <div class="p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                                   <div class="flex items-center justify-between mb-1">
                                       <span class="text-xs font-mono text-cyan-300 font-semibold truncate max-w-[180px]" title="${perm.name}">${perm.name}</span>
                                       <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${perm.platform === 'ios' ? 'bg-slate-700 text-slate-300' : 'bg-green-900/30 text-green-400'}">${perm.platform}</span>
                                   </div>
                                   <p class="text-xs text-slate-400 leading-snug">"${perm.reason}"</p>
                               </div>
                           `).join('')}
                       </div>
                   </div>

               </div>
           </div>
       `}
    </div>
  `;
};

export const configListeners = () => {
    // PREFERENCES LOGIC
    // Orientation
    document.querySelectorAll('[data-pref-orientation]').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-pref-orientation') as any;
            const newPrefs = { ...state.config.preferences, orientation: val };
            // Trigger regen
            isLoading = true; generatedXml = '';
            updateConfig({ preferences: newPrefs });
        });
    });

    // Background Color
    const colorInput = document.getElementById('pref-bg-color') as HTMLInputElement;
    if (colorInput) {
        colorInput.addEventListener('change', (e) => {
             const val = (e.target as HTMLInputElement).value.replace(/[^0-9A-F]/ig, '');
             const newPrefs = { ...state.config.preferences, backgroundColor: val };
             isLoading = true; generatedXml = '';
             updateConfig({ preferences: newPrefs });
        });
    }

    // Toggles (Fullscreen, Overscroll)
    const togglePref = (id: string, key: keyof typeof state.config.preferences) => {
        const el = document.getElementById(id) as HTMLInputElement;
        if(el) {
            el.addEventListener('change', (e) => {
                 const newPrefs = { ...state.config.preferences, [key]: (e.target as HTMLInputElement).checked };
                 isLoading = true; generatedXml = '';
                 updateConfig({ preferences: newPrefs });
            });
        }
    };
    togglePref('pref-fullscreen', 'fullscreen');
    togglePref('pref-overscroll', 'disallowOverscroll');


    // PLUGINS LOGIC
    // 1. Toggle Cards
    document.querySelectorAll('[data-toggle-plugin]').forEach(card => {
        card.addEventListener('click', () => {
            const pluginId = card.getAttribute('data-toggle-plugin');
            if(pluginId) {
                let current = state.config.plugins;
                if(current.includes(pluginId)) {
                    current = current.filter(p => p !== pluginId);
                } else {
                    current = [...current, pluginId];
                }
                isLoading = true; generatedXml = '';
                updateConfig({ plugins: current });
            }
        });
    });

    // 2. Remove Tag (Bottom List)
    document.querySelectorAll('[data-remove-plugin]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const p = btn.getAttribute('data-remove-plugin');
            if(p) {
                updateConfig({ plugins: state.config.plugins.filter(x => x !== p) });
                isLoading = true; generatedXml = '';
            }
        });
    });
    
    // 3. Category Buttons
    document.querySelectorAll('[data-category]').forEach(btn => {
        btn.addEventListener('click', () => {
             const cat = btn.getAttribute('data-category');
             if(cat) {
                 selectedCategory = cat;
                 updateState({}); // force re-render
             }
        });
    });

    // 4. Search Filter
    const searchInput = document.getElementById('plugin-search') as HTMLInputElement;
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            pluginSearchTerm = (e.target as HTMLInputElement).value;
            updateState({}); // force re-render to filter list
        });
        searchInput.focus(); // keep focus logic simple
        // Fix focus loss on re-render by setting it back (basic approach)
        searchInput.selectionStart = searchInput.value.length;
    }

    // 5. Manual Add
    const pluginInput = document.getElementById('plugin-input') as HTMLInputElement;
    const addBtn = document.getElementById('btn-add-plugin');
    
    if(pluginInput) {
        pluginInput.addEventListener('input', (e) => {
            newPluginInput = (e.target as HTMLInputElement).value;
        });
        const add = () => {
            const val = pluginInput.value.trim();
            if(val && !state.config.plugins.includes(val)) {
                updateConfig({ plugins: [...state.config.plugins, val] });
                newPluginInput = ''; 
                isLoading = true; generatedXml = '';
            }
        };
        addBtn?.addEventListener('click', add);
        pluginInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') add(); });
    }
    
    // 6. Plugin Configuration Modal Open
    document.querySelectorAll('[data-config-plugin]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const p = btn.getAttribute('data-config-plugin');
            if(p) {
                configuringPluginId = p;
                const vars = state.config.pluginVariables?.[p] || {};
                draftVars = Object.entries(vars).map(([k,v]) => ({key: k, value: v}));
                if (draftVars.length === 0) draftVars = [{key: '', value: ''}]; // start with 1 empty row
                updateState({});
            }
        });
    });

    // MODAL LOGIC
    if (configuringPluginId) {
        const closeModal = () => {
            configuringPluginId = null;
            updateState({});
        };
        
        document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
        document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);

        document.getElementById('btn-add-var')?.addEventListener('click', () => {
            draftVars.push({ key: '', value: '' });
            updateState({});
        });

        // Delegate listeners for dynamic inputs inside modal
        const varList = document.getElementById('var-list');
        if (varList) {
             varList.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                const idx = parseInt(target.getAttribute('data-var-key') || target.getAttribute('data-var-val') || '-1');
                
                if (idx > -1) {
                    if (target.hasAttribute('data-var-key')) draftVars[idx].key = target.value;
                    if (target.hasAttribute('data-var-val')) draftVars[idx].value = target.value;
                }
             });

             varList.addEventListener('click', (e) => {
                 const btn = (e.target as HTMLElement).closest('[data-var-del]');
                 if (btn) {
                     const idx = parseInt(btn.getAttribute('data-var-del') || '-1');
                     if (idx > -1) {
                         draftVars.splice(idx, 1);
                         updateState({});
                     }
                 }
             });
        }

        document.getElementById('btn-save-vars')?.addEventListener('click', () => {
             const newVars: { [key: string]: string } = {};
             draftVars.forEach(v => {
                 if (v.key.trim()) newVars[v.key.trim()] = v.value;
             });

             const currentMap = state.config.pluginVariables || {};
             // Update logic
             const updatedMap = { ...currentMap, [configuringPluginId!]: newVars };
             
             // Reset vars logic for this plugin if empty to clean up
             if (Object.keys(newVars).length === 0) {
                 delete updatedMap[configuringPluginId!];
             }

             isLoading = true; generatedXml = '';
             updateConfig({ pluginVariables: updatedMap });
             configuringPluginId = null;
        });
    }

    // GENERAL ACTIONS
    // Copy
    document.getElementById('btn-copy')?.addEventListener('click', () => {
        navigator.clipboard.writeText(generatedXml);
        const btn = document.getElementById('btn-copy');
        if(btn) btn.innerHTML = `<i data-lucide="check" class="w-3 h-3"></i> Copied`;
        setTimeout(() => { if(btn) btn.innerHTML = `<i data-lucide="copy" class="w-3 h-3"></i> Copy`; }, 2000);
    });

    // Download XML Only
    document.getElementById('btn-download-xml')?.addEventListener('click', () => {
        const blob = new Blob([generatedXml], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config.xml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // Download ZIP (Project)
    document.getElementById('btn-download-zip')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-download-zip');
        const txt = document.getElementById('zip-text');
        if(btn && txt) {
            const original = txt.textContent;
            txt.textContent = 'Zipping...';
            btn.classList.add('opacity-75');
            
            try {
                const zip = new JSZip();
                
                // 1. Root Config
                zip.file("config.xml", generatedXml);
                
                // GIT INTEGRATION
                if (state.config.enableGit) {
                    const gitignore = `node_modules/
platforms/
plugins/
www/
!www/index.html
!www/css/
!www/js/
!www/img/
hooks/
.idea/
.vscode/
*.log
.DS_Store`;
                    
                    zip.file(".gitignore", gitignore);
                    
                    const initSh = `#!/bin/bash
git init
git add .
git commit -m "Initial generation by AltoGen Studio"
echo "Git repository initialized successfully."
`;
                    zip.file("init_git.sh", initSh);
                    
                    const initBat = `@echo off
git init
git add .
git commit -m "Initial generation by AltoGen Studio"
echo Git repository initialized successfully.
pause
`;
                    zip.file("init_git.bat", initBat);
                }

                // Construct dependencies object safely
                const dependenciesObj = state.config.plugins.reduce((acc, curr) => {
                    (acc as any)[curr] = "latest";
                    return acc;
                }, {});

                const cordovaPluginsObj = state.config.plugins.reduce((acc, curr) => {
                    if (curr === 'admob-plus-cordova') return acc;
                    acc[curr] = state.config.pluginVariables?.[curr] || {};
                    return acc;
                }, {} as any);
                
                // Add AdMob to package.json if enabled
                if (state.config.adConfig.enabled) {
                    (dependenciesObj as any)["admob-plus-cordova"] = "latest";
                    (cordovaPluginsObj as any)["admob-plus-cordova"] = {
                        "APP_ID_ANDROID": state.config.adConfig.androidAppId || "ca-app-pub-xxx~xxx",
                        "APP_ID_IOS": state.config.adConfig.iosAppId || "ca-app-pub-xxx~xxx"
                    };
                }

                // 2. Package.json
                const packageJson = {
                    name: state.config.id.toLowerCase().replace(/\./g, '-'),
                    displayName: state.config.name,
                    version: state.config.version,
                    description: state.config.description,
                    main: "index.js",
                    scripts: {
                        "test": "echo \"Error: no test specified\" && exit 1",
                        "build": "cordova build"
                    },
                    keywords: ["ecosystem:cordova"],
                    author: state.config.authorName,
                    license: "Apache-2.0",
                    dependencies: dependenciesObj,
                    cordova: {
                        plugins: cordovaPluginsObj,
                        platforms: state.config.platforms
                    }
                };

                zip.file("package.json", JSON.stringify(packageJson, null, 2));

                // 3. WWW Folder & Setup Scripts
                const www = zip.folder("www");
                const js = www?.folder("js");
                
                // GENERATE ADMOB LOGIC
                if (state.config.adConfig.enabled && js) {
                    const adLogic = `
/* Auto-Generated AdMob Logic */
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
}, false);
`;
                    js.file("admob.js", adLogic);
                }

                if (state.config.sourceType === 'github') {
                    // GitHub Mode: Add Clone Script & Instructions
                    const repoUrl = state.config.sourceValue;
                    
                    zip.file("README_FIRST.txt", `
CORDOVA PROJECT - GITHUB SOURCE
================================

This project is configured to use an external Git repository:
${repoUrl}

INSTRUCTIONS:
1. Unzip this folder.
2. Run the included setup script (scripts/clone_repo.sh) OR manually clone your repo into the 'www' folder.
   
   Command: git clone ${repoUrl} www

3. Run 'npm install' to install Cordova plugins (including AdMob).
4. Run 'cordova platform add android' (or ios).
5. Run 'cordova build'.
                    `);

                    const scripts = zip.folder("scripts");
                    if(scripts) {
                        scripts.file("clone_repo.sh", `#!/bin/bash
echo "Cloning repository into www..."
rm -rf ../www/*
git clone ${repoUrl} ../www
echo "Done. Assets ready."
`);
                    }
                    
                    if (www) {
                         www.file("index.html", `<!DOCTYPE html>
<html>
<body>
    <h1>Project Setup Required</h1>
    <p>Please run <code>scripts/clone_repo.sh</code> to pull your GitHub assets.</p>
</body>
</html>`);
                    }

                } else {
                    // URL or Folder Mode
                    if (www) {
                        // Default index.html
                        const indexContent = `<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval'; style-src 'self' 'unsafe-inline'; media-src *; img-src 'self' data: content:;">
        <meta name="format-detection" content="telephone=no">
        <meta name="msapplication-tap-highlight" content="no">
        <meta name="viewport" content="initial-scale=1, width=device-width, viewport-fit=cover">
        <title>${state.config.name}</title>
        <style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f0f9ff;color:#0f172a} h1{font-size:2rem}</style>
        ${state.config.sourceType === 'url' ? `<script>window.location.href = "${state.config.sourceValue}";</script>` : ''}
    </head>
    <body>
        <div style="text-align:center">
            <h1>${state.config.name}</h1>
            <p>${state.config.sourceType === 'url' ? 'Redirecting to application...' : 'Initializing...'}</p>
        </div>
        <script src="cordova.js"></script>
        ${state.config.adConfig.enabled ? '<script src="js/admob.js"></script>' : ''}
    </body>
</html>`;
                        
                        let hasIndexHtml = false;

                        if (state.config.sourceType === 'folder' && state.files.length > 0) {
                            state.files.forEach(f => {
                                if (f.nativeFile) {
                                    const parts = f.path.split('/');
                                    const relativePath = parts.slice(1).join('/');
                                    
                                    if (relativePath) {
                                        if(relativePath === 'index.html') hasIndexHtml = true;
                                        www.file(relativePath, f.nativeFile);
                                    }
                                }
                            });
                        }

                        if (!hasIndexHtml) {
                            www.file("index.html", indexContent);
                        }
                    }
                }

                // 4. Resources (Icons)
                if (state.assets.length > 0) {
                    const res = zip.folder("res");
                    if (res) {
                        const icon = res.folder("icon");
                        if (icon) {
                            const android = icon.folder("android");
                            const ios = icon.folder("ios");
                            
                            state.assets.forEach(asset => {
                                if (asset.platform === 'android' && android) {
                                    android.file(asset.name, asset.blob);
                                } else if (asset.platform === 'ios' && ios) {
                                    ios.file(asset.name, asset.blob);
                                }
                            });
                        }
                    }
                }

                // Generate and Download
                const content = await zip.generateAsync({type: "blob"});
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${state.config.name.replace(/\s+/g, '_')}_Cordova.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
            } catch (e) {
                console.error(e);
                alert("Failed to zip project.");
            } finally {
                txt.textContent = original;
                btn.classList.remove('opacity-75');
            }
        }
    });
};
