
import { state, updateState } from '../index';
// Import ViewMode from types.ts since index.tsx does not export it
import { ViewMode } from '../types';
import { createIcons, icons } from 'lucide';
import { highlightCode, analyzeCode } from '../services/syntaxService';

interface SearchResult {
    id: string;
    label: string;
    sub: string;
    icon: string;
    type: 'file' | 'nav' | 'action';
    path?: string;
    mode?: ViewMode;
}

let query = '';
let selectedIndex = 0;

// Returns the HTML string for the search palette
export const SearchPalette = (): string => {
    // Collect possible search items
    const items: SearchResult[] = [
        // Navigation items
        { id: 'nav-setup', label: 'Project Setup', sub: 'Configure name, id, and source', icon: 'settings', type: 'nav', mode: ViewMode.SETUP },
        { id: 'nav-assets', label: 'Asset Generator', sub: 'Icons and splash screens', icon: 'image', type: 'nav', mode: ViewMode.ASSETS },
        { id: 'nav-structure', label: 'Project Structure', sub: 'Manage files and folders', icon: 'folder-tree', type: 'nav', mode: ViewMode.STRUCTURE },
        { id: 'nav-monetization', label: 'Monetization', icon: 'dollar-sign', sub: 'AdMob and ads', type: 'nav', mode: ViewMode.MONETIZATION },
        { id: 'nav-config', label: 'Configuration', icon: 'file-code', sub: 'View generated XML', type: 'nav', mode: ViewMode.CONFIG },
        { id: 'nav-profile', label: 'Profile', icon: 'user', sub: 'User account and plan', type: 'nav', mode: ViewMode.PROFILE },
    ];

    // Add files to search
    state.files.forEach(f => {
        items.push({
            id: `file-${f.path}`,
            label: f.name,
            sub: f.path,
            icon: f.isFolder ? 'folder' : 'file',
            type: 'file',
            path: f.path
        });
    });

    const filtered = query 
        ? items.filter(i => 
            i.label.toLowerCase().includes(query.toLowerCase()) || 
            i.sub.toLowerCase().includes(query.toLowerCase())
          )
        : items.slice(0, 8);

    if (selectedIndex >= filtered.length) selectedIndex = 0;

    return `
        <div id="search-palette-overlay" class="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div id="search-palette-container" class="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-200">
                <div class="flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-slate-800/50">
                    <i data-lucide="search" class="w-5 h-5 text-cyan-500"></i>
                    <input 
                        type="text" 
                        id="search-palette-input" 
                        value="${query}" 
                        placeholder="Search files, navigation, actions..." 
                        class="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder-slate-500"
                        autocomplete="off"
                    />
                    <div class="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-slate-500 font-mono">
                        <span class="text-slate-400">ESC</span> to close
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
                    ${filtered.length === 0 ? `
                        <div class="p-12 text-center">
                            <i data-lucide="frown" class="w-12 h-12 text-slate-700 mx-auto mb-4"></i>
                            <p class="text-slate-400">No results found for "${query}"</p>
                        </div>
                    ` : filtered.map((item, idx) => `
                        <div 
                            data-search-id="${item.id}"
                            data-search-idx="${idx}"
                            class="flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${idx === selectedIndex ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_20px_-5px_rgba(6,182,212,0.2)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}"
                        >
                            <div class="p-2 rounded-lg bg-slate-800 border border-white/5">
                                <i data-lucide="${item.icon}" class="w-4 h-4"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-sm truncate">${item.label}</span>
                                    <span class="text-[9px] uppercase tracking-widest text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">${item.type}</span>
                                </div>
                                <p class="text-[11px] text-slate-500 truncate mt-0.5">${item.sub}</p>
                            </div>
                            ${idx === selectedIndex ? '<i data-lucide="chevron-right" class="w-4 h-4 text-cyan-500"></i>' : ''}
                        </div>
                    `).join('')}
                </div>

                <div class="px-6 py-3 border-t border-white/5 bg-slate-950/50 flex items-center justify-between">
                    <div class="flex items-center gap-4 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                        <div class="flex items-center gap-1.5">
                            <span class="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-slate-400">↑↓</span> Navigate
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-slate-400">↵</span> Select
                        </div>
                    </div>
                    <div class="text-[10px] text-slate-600 font-mono">
                        ${filtered.length} results
                    </div>
                </div>
            </div>
        </div>
    `;
};

// Attaches event listeners for the search palette
export const searchListeners = () => {
    createIcons({ icons });

    const input = document.getElementById('search-palette-input') as HTMLInputElement;
    if (input) {
        input.focus();
        input.oninput = (e) => {
            query = (e.target as HTMLInputElement).value;
            selectedIndex = 0;
            const overlay = document.getElementById('search-palette-overlay');
            if (overlay) {
                const parent = overlay.parentElement;
                if (parent) {
                    overlay.remove();
                    const temp = document.createElement('div');
                    temp.innerHTML = SearchPalette();
                    parent.appendChild(temp.firstElementChild!);
                    searchListeners();
                }
            }
        };

        input.onkeydown = (e) => {
            const items = document.querySelectorAll('[data-search-id]');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % items.length;
                updatePaletteSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                updatePaletteSelection();
            } else if (e.key === 'Enter') {
                const selected = items[selectedIndex];
                if (selected) {
                    const id = selected.getAttribute('data-search-id');
                    handleSearchSelection(id);
                }
            } else if (e.key === 'Escape') {
                updateState({ isSearchOpen: false });
            }
        };
    }

    const updatePaletteSelection = () => {
        const overlay = document.getElementById('search-palette-overlay');
        if (overlay) {
            const parent = overlay.parentElement;
            if (parent) {
                overlay.remove();
                const temp = document.createElement('div');
                temp.innerHTML = SearchPalette();
                parent.appendChild(temp.firstElementChild!);
                searchListeners();
            }
        }
    };

    const handleSearchSelection = (id: string | null) => {
        if (!id) return;
        
        // Items collection logic duplicated from render to find selection data
        const navItems: SearchResult[] = [
            { id: 'nav-setup', label: 'Project Setup', sub: 'Configure name, id, and source', icon: 'settings', type: 'nav', mode: ViewMode.SETUP },
            { id: 'nav-assets', label: 'Asset Generator', sub: 'Icons and splash screens', icon: 'image', type: 'nav', mode: ViewMode.ASSETS },
            { id: 'nav-structure', label: 'Project Structure', sub: 'Manage files and folders', icon: 'folder-tree', type: 'nav', mode: ViewMode.STRUCTURE },
            { id: 'nav-monetization', label: 'Monetization', icon: 'dollar-sign', sub: 'AdMob and ads', type: 'nav', mode: ViewMode.MONETIZATION },
            { id: 'nav-config', label: 'Configuration', icon: 'file-code', sub: 'View generated XML', type: 'nav', mode: ViewMode.CONFIG },
            { id: 'nav-profile', label: 'Profile', icon: 'user', sub: 'User account and plan', type: 'nav', mode: ViewMode.PROFILE },
        ];
        
        const fileItems: SearchResult[] = state.files.map(f => ({
            id: `file-${f.path}`,
            label: f.name,
            sub: f.path,
            icon: f.isFolder ? 'folder' : 'file',
            type: 'file',
            path: f.path
        }));

        const combined = [...navItems, ...fileItems];
        const item = combined.find(i => i.id === id);
        
        if (item) {
            if (item.type === 'nav' && item.mode) {
                updateState({ currentMode: item.mode, isSearchOpen: false });
            } else if (item.type === 'file' && item.path) {
                const file = state.files.find(f => f.path === item.path);
                if (file && !file.isFolder) {
                    state.editingPath = item.path;
                    state.editorContent = file.content || '';
                    state.editorHighlightedContent = highlightCode(state.editorContent, item.path);
                    state.editorIssues = analyzeCode(state.editorContent, item.path);
                    updateState({ currentMode: ViewMode.STRUCTURE, isSearchOpen: false });
                } else {
                    updateState({ currentMode: ViewMode.STRUCTURE, isSearchOpen: false });
                }
            }
        }
    };

    document.querySelectorAll('[data-search-id]').forEach(el => {
        el.addEventListener('click', () => {
            handleSearchSelection(el.getAttribute('data-search-id'));
        });
    });

    const backdrop = document.getElementById('search-palette-overlay');
    if (backdrop) {
        backdrop.onclick = (e) => {
            if (e.target === backdrop) updateState({ isSearchOpen: false });
        };
    }
};
