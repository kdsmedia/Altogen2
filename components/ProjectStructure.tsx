import { state, fileActions, updateState, updateConfig, showToast } from '../index';
import { applyAutoFix } from '../services/validationService';
import { generateCodeSuggestion } from '../services/geminiService';
import { highlightCode, analyzeCode, applyLintFix } from '../services/syntaxService';
import { createIcons, icons } from 'lucide';
import { ViewMode, FileEntry } from '../types';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: { [key: string]: TreeNode };
  meta?: string;
  isVirtual?: boolean; 
  isEditable?: boolean; 
  hasError?: boolean;
}

export const ProjectStructure = () => {
  // 1. Build the Tree
  const root: TreeNode = {
    name: 'root',
    path: '',
    type: 'folder',
    children: {}
  };

  const addToTree = (pathParts: string[], node: TreeNode, meta?: string, isVirtual: boolean = false, isEditable: boolean = false) => {
    if (pathParts.length === 0) return;
    const current = pathParts[0];
    
    if (!node.children) node.children = {};
    const currentPath = node.path ? `${node.path}/${current}` : current;

    if (pathParts.length === 1) {
      node.children[current] = { name: current, path: currentPath, type: 'file', meta, isVirtual, isEditable };
    } else {
      if (!node.children[current]) {
        node.children[current] = { name: current, path: currentPath, type: 'folder', children: {}, isVirtual, isEditable };
      }
      addToTree(pathParts.slice(1), node.children[current]!, meta, isVirtual, isEditable);
    }
  };

  addToTree(['hooks', 'README.md'], root, 'System', true, false);
  addToTree(['platforms', '.gitkeep'], root, 'System', true, false);
  
  if (state.assets.length > 0) {
      state.assets.forEach(asset => {
          const typeFolder = asset.assetType === 'splash' ? 'screen' : 'icon';
          addToTree(['res', typeFolder, asset.platform, asset.name], root, 'Auto-Gen', true, false);
      });
  } else {
       addToTree(['res', 'icon', 'android', 'default.png'], root, 'Default', true, false);
  }

  if (!root.children!['www']) {
      root.children!['www'] = { name: 'www', path: 'www', type: 'folder', children: {}, isVirtual: false, isEditable: true };
  }

  state.files.forEach(f => {
      let displayPath = f.path;
      if (!f.isVirtual && !displayPath.startsWith('www/')) {
          displayPath = 'www/' + displayPath;
      }
      
      const parts = displayPath.split('/');
      addToTree(parts, root, f.isFolder ? 'Folder' : `${(f.size / 1024).toFixed(1)} KB`, f.isVirtual, !f.isVirtual);
  });
  
  if (state.files.length === 0 && state.config.sourceType === 'url') {
      addToTree(['www', 'index.html'], root, 'Wrapper', true, false);
  }

  const renderNode = (node: TreeNode, depth: number = 0): string => {
     if (node.name === 'root') {
         return Object.keys(node.children || {}).sort().map(k => renderNode(node.children![k]!, depth)).join('');
     }

     const isSystem = node.isVirtual;
     const isEditable = node.isEditable || (!isSystem && node.path.startsWith('www/'));
     const isWWWRoot = node.path === 'www';

     const actions = isEditable ? `
        <div class="flex items-center gap-1 ml-2">
            ${node.type === 'file' && /\.(html|css|js|json|xml|txt|md|svg)$/i.test(node.name) ? `
                <button data-action="edit-content" data-path="${node.path}" class="p-1.5 hover:bg-slate-700 bg-slate-800/50 rounded text-cyan-400 border border-white/5" title="Edit Content">
                    <i data-lucide="file-edit" class="w-3 h-3"></i>
                </button>
            ` : ''}
            ${!isWWWRoot ? `
                <button data-action="rename" data-path="${node.path}" data-type="${node.type}" class="p-1.5 hover:bg-slate-700 bg-slate-800/50 rounded text-blue-400 border border-white/5" title="Rename">
                    <i data-lucide="pencil" class="w-3 h-3"></i>
                </button>
                <button data-action="delete" data-path="${node.path}" class="p-1.5 hover:bg-red-900/50 bg-slate-800/50 rounded text-red-400 border border-white/5" title="Delete">
                    <i data-lucide="trash" class="w-3 h-3"></i>
                </button>
            ` : ''}
        </div>
     ` : `<span class="text-[10px] text-slate-600 px-2 select-none">${isSystem ? 'System' : 'Locked'}</span>`;

     if (node.type === 'file') {
        let icon = 'file';
        let color = 'text-slate-500';
        if (node.name.endsWith('.html')) { icon = 'file-code'; color = 'text-orange-400'; }
        else if (node.name.endsWith('.js')) { icon = 'file-terminal'; color = 'text-yellow-300'; }
        else if (node.name.endsWith('.css')) { icon = 'file-type'; color = 'text-blue-300'; }
        else if (node.name.endsWith('.xml') || node.name.endsWith('.json')) { icon = 'settings-2'; color = 'text-slate-300'; }
        else if (node.name.endsWith('.png') || node.name.endsWith('.jpg')) { icon = 'image'; color = 'text-purple-400'; }

        return `
            <div 
                data-row-file="${node.path}"
                data-editable="${isEditable && node.type === 'file' && /\.(html|css|js|json|xml|txt|md|svg)$/i.test(node.name)}"
                class="flex items-center justify-between group py-2 hover:bg-white/5 rounded px-2 transition-colors border-l-2 border-transparent ${isEditable ? 'hover:border-cyan-500 cursor-pointer' : 'cursor-default'}"
            >
                <div class="flex items-center gap-2 overflow-hidden flex-1">
                    <i data-lucide="${icon}" class="w-4 h-4 ${color} shrink-0"></i>
                    <span class="text-sm ${isSystem ? 'text-slate-500' : 'text-slate-200'} font-mono truncate">${node.name}</span>
                </div>
                <div class="flex items-center gap-3">
                    ${node.meta ? `<span class="text-[10px] text-slate-600 font-mono shrink-0 hidden sm:block">${node.meta}</span>` : ''}
                    ${actions}
                </div>
            </div>
        `;
     } else {
         const childrenKeys = Object.keys(node.children || {}).sort();
         const childrenHtml = childrenKeys.map(key => renderNode(node.children![key]!, depth + 1)).join('');

         return `
            <details class="group/folder" open>
                <summary class="flex items-center justify-between py-2 hover:bg-white/5 rounded px-2 cursor-pointer select-none transition-colors group">
                     <div class="flex items-center gap-2">
                        <i data-lucide="folder" class="w-4 h-4 text-cyan-700 group-open/folder:hidden"></i>
                        <i data-lucide="folder-open" class="w-4 h-4 text-cyan-500 hidden group-open/folder:block"></i>
                        <span class="text-sm text-slate-200 font-medium">${node.name}</span>
                     </div>
                     ${actions}
                </summary>
                <div class="pl-4 border-l border-white/5 ml-2">
                    ${childrenHtml}
                </div>
            </details>
         `;
     }
  };

  const renderIssues = () => {
      if (state.issues.length === 0) return '';
      
      const errorCount = state.issues.filter(i => i.severity === 'error').length;
      const warningCount = state.issues.filter(i => i.severity === 'warning').length;

      return `
        <div class="mb-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border ${errorCount > 0 ? 'border-red-500/30' : 'border-yellow-500/30'} overflow-hidden shadow-2xl">
            <div class="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg ${errorCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}">
                        <i data-lucide="${errorCount > 0 ? 'alert-triangle' : 'alert-circle'}" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h3 class="text-white font-bold text-sm">Project Health Check</h3>
                        <p class="text-xs text-slate-400">${errorCount} Errors, ${warningCount} Warnings found</p>
                    </div>
                </div>
                ${errorCount > 0 || warningCount > 0 ? `
                    <button id="btn-fix-all" class="px-4 py-2 bg-white text-slate-900 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-white/10 group">
                        <i data-lucide="sparkles" class="w-4 h-4 text-purple-600 group-hover:rotate-12 transition-transform"></i>
                        Auto-Fix All
                    </button>
                ` : ''}
            </div>
            <div class="p-2 space-y-1">
                ${state.issues.map(issue => `
                    <div class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 group transition-colors">
                        <div class="flex items-center gap-3">
                            <i data-lucide="${issue.severity === 'error' ? 'x-circle' : 'info'}" class="w-4 h-4 ${issue.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}"></i>
                            <div class="flex flex-col">
                                <span class="text-sm text-slate-300 font-medium">${issue.message}</span>
                                <span class="text-[10px] text-slate-500 uppercase tracking-tighter">${issue.severity} type</span>
                            </div>
                        </div>
                        ${issue.autoFixAvailable ? `
                           <button data-fix-id="${issue.id}" class="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs rounded-lg border border-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 font-bold">
                               <i data-lucide="wrench" class="w-3 h-3"></i> Fix
                           </button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
      `;
  };
  
  const renderEditorIssues = () => {
      if (state.editorIssues.length === 0) return '';
      
      return `
        <div class="border-t border-white/10 bg-[#0d1117]">
             <div class="px-4 py-2 bg-slate-900/50 flex items-center gap-2 border-b border-white/5">
                  <i data-lucide="alert-octagon" class="w-3 h-3 text-slate-400"></i>
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wide">Problems (${state.editorIssues.length})</span>
             </div>
             <div class="max-h-[150px] overflow-y-auto custom-scrollbar">
                 ${state.editorIssues.map(issue => {
                     let color = 'text-slate-400';
                     let icon = 'info';
                     if(issue.severity === 'error') { color = 'text-red-400'; icon = 'x-circle'; }
                     else if(issue.severity === 'warning') { color = 'text-yellow-400'; icon = 'alert-triangle'; }
                     else if(issue.severity === 'info') { color = 'text-blue-400'; icon = 'info'; }
                     
                     return `
                        <div class="flex items-center justify-between px-4 py-2 hover:bg-white/5 group border-b border-white/5 last:border-0 transition-colors">
                            <div class="flex items-center gap-3 min-w-0">
                                <i data-lucide="${icon}" class="w-3.5 h-3.5 ${color} shrink-0"></i>
                                <span class="text-xs text-slate-500 font-mono shrink-0">Ln ${issue.line}</span>
                                <span class="text-xs text-slate-300 truncate" title="${issue.message}">${issue.message}</span>
                            </div>
                            <div class="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <button data-auto-fix="${issue.id}" class="px-2 py-1 rounded bg-${issue.severity === 'error' ? 'red' : 'blue'}-900/30 hover:bg-${issue.severity === 'error' ? 'red' : 'blue'}-900/50 text-[10px] ${color} border border-${issue.severity === 'error' ? 'red' : 'blue'}-500/20 flex items-center gap-1">
                                    <i data-lucide="sparkles" class="w-3 h-3"></i> Auto Fix
                                </button>
                            </div>
                        </div>
                     `;
                 }).join('')}
             </div>
        </div>
      `;
  };

  return `
    <div class="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full relative">
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-3xl font-bold text-white mb-1 tracking-tight">Project Structure</h2>
            <p class="text-slate-400 text-sm">Review your assets and manage the <span class="font-mono text-cyan-400">www/</span> shell.</p>
          </div>
          
          <div class="flex flex-wrap items-center gap-2">
              <input type="file" id="toolbar-file-upload" class="hidden" multiple />
              <input type="file" id="toolbar-folder-upload" class="hidden" webkitdirectory directory multiple />
              
              <button id="btn-new-file" class="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-white transition-colors">
                  <i data-lucide="file-plus" class="w-4 h-4 text-cyan-400"></i> File
              </button>
              <button id="btn-new-folder" class="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-white transition-colors">
                  <i data-lucide="folder-plus" class="w-4 h-4 text-yellow-400"></i> Folder
              </button>
              <div class="w-px h-6 bg-slate-700 mx-1"></div>
              <button id="btn-upload-file" class="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-white transition-colors">
                  <i data-lucide="upload" class="w-4 h-4 text-purple-400"></i> Upload
              </button>
              <button id="btn-upload-folder" class="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-white transition-colors">
                  <i data-lucide="folder-up" class="w-4 h-4 text-blue-400"></i> Dir
              </button>
          </div>
      </div>

      ${renderIssues()}

      <div class="flex-1 bg-slate-950/50 backdrop-blur-sm rounded-2xl border border-white/5 shadow-inner overflow-hidden flex flex-col relative min-h-[400px]">
          <div class="bg-slate-900 px-4 py-3 border-b border-white/5 flex items-center gap-2 sticky top-0 z-10">
             <div class="flex gap-1.5">
                 <div class="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                 <div class="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                 <div class="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
             </div>
             <span class="ml-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">${state.config.id || 'not configured'}</span>
             
             <div class="ml-auto flex items-center gap-2 text-xs font-mono">
                <span class="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
                    <i data-lucide="refresh-cw" class="w-3 h-3 animate-[spin_3s_linear_infinite]"></i>
                    Live FS
                </span>
             </div>
          </div>

          <div class="flex-1 p-6 overflow-auto custom-scrollbar select-none">
               ${renderNode(root)}
          </div>
      </div>
      
      <div class="flex justify-end gap-3 pb-8">
         <button data-nav="${ViewMode.SETUP}" class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2">
             <i data-lucide="chevron-left" class="w-4 h-4"></i>
             <span>Back to Setup</span>
         </button>
         <button data-nav="${ViewMode.CONFIG}" class="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all">
             <span>Finalize Project</span>
             <i data-lucide="chevron-right" class="w-4 h-4"></i>
         </button>
      </div>

      ${state.editingPath ? `
        <div class="absolute inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in zoom-in-95 duration-200 shadow-2xl rounded-2xl overflow-hidden">
            <div class="bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between z-20">
                <div class="flex items-center gap-2">
                    <i data-lucide="edit-3" class="w-4 h-4 text-cyan-400"></i>
                    <span class="font-mono text-sm text-slate-200">${state.editingPath}</span>
                </div>
                <div class="flex items-center gap-2">
                    <button id="editor-ai" class="p-1.5 text-purple-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-colors border border-purple-500/30" title="Suggest Code (AI)">
                        <i data-lucide="wand-2" class="w-4 h-4"></i>
                    </button>
                    <button id="editor-save" class="flex items-center gap-2 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-all">
                        <i data-lucide="save" class="w-3.5 h-3.5"></i> Save
                    </button>
                    <button id="editor-close" class="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>

            <div class="flex-1 flex flex-col md:flex-row min-h-0">
                <div class="flex-1 flex flex-col min-h-0 bg-[#0d1117] relative">
                    <div class="flex-1 relative overflow-hidden">
                        <div class="absolute left-0 top-0 bottom-0 w-12 bg-slate-900/50 border-r border-white/5 flex flex-col items-center pt-4 text-[10px] font-mono text-slate-600 select-none z-10">
                            ${state.editorContent.split('\n').map((_, i) => `<div class="h-[21px] flex items-center">${i + 1}</div>`).join('')}
                        </div>
                        <div class="absolute inset-0 left-12 overflow-auto custom-scrollbar p-0">
                             <pre id="editor-highlight" class="absolute inset-0 p-4 m-0 pointer-events-none font-mono text-sm leading-[21px] whitespace-pre-wrap break-all z-0">${state.editorHighlightedContent}</pre>
                             <textarea id="editor-textarea" class="absolute inset-0 w-full h-full p-4 m-0 bg-transparent text-transparent caret-white font-mono text-sm leading-[21px] whitespace-pre-wrap break-all resize-none outline-none z-10" spellcheck="false">${state.editorContent}</textarea>
                        </div>
                    </div>
                    ${renderEditorIssues()}
                </div>

                ${state.isSuggesting || state.editorSuggestion ? `
                    <div class="w-full md:w-80 bg-slate-900 border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300">
                        <div class="p-4 border-b border-white/5 flex items-center justify-between bg-purple-900/10">
                            <span class="text-xs font-bold text-white uppercase tracking-wider">AI Insight</span>
                            <button id="close-suggestion" class="text-slate-500 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>
                        </div>
                        <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            ${state.isSuggesting ? `<div class="p-8 text-center text-slate-500 animate-pulse">Analyzing...</div>` : `
                                <div class="bg-purple-950/20 border border-purple-500/20 rounded-xl p-4 space-y-3">
                                    <p class="text-xs text-purple-200 font-medium">${state.editorSuggestion?.explanation}</p>
                                    <button id="apply-suggestion" class="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold">Apply</button>
                                </div>
                            `}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
      ` : ''}
    </div>
  `;
};

export const structureListeners = () => {
    createIcons({ icons });

    document.getElementById('btn-new-file')?.addEventListener('click', () => {
        const name = prompt("Enter file name (e.g. style.css):");
        if (name) {
            fileActions.addFile({ name, path: 'www/' + name, size: 0, type: 'text/plain', content: '', isFolder: false });
        }
    });

    document.getElementById('btn-new-folder')?.addEventListener('click', () => {
        const name = prompt("Enter folder name:");
        if (name) {
            fileActions.addFile({ name, path: 'www/' + name, size: 0, type: 'folder', isFolder: true });
        }
    });

    document.getElementById('btn-fix-all')?.addEventListener('click', () => {
        let currentConfig = { ...state.config };
        let currentFiles = [...state.files];
        let changed = false;

        state.issues.forEach(issue => {
            if (issue.autoFixAvailable) {
                const { config, newFiles } = applyAutoFix(issue.id, currentConfig, currentFiles);
                if (config) {
                    currentConfig = { ...currentConfig, ...config };
                    changed = true;
                }
                if (newFiles) {
                    currentFiles = newFiles;
                    changed = true;
                }
            }
        });

        if (changed) {
            state.config = currentConfig;
            state.files = currentFiles;
            updateState({});
            showToast("Project issues fixed", "success");
        }
    });

    document.querySelectorAll('[data-fix-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-fix-id')!;
            const { config, newFiles } = applyAutoFix(id, state.config, state.files);
            if (config) updateConfig(config);
            if (newFiles) updateState({ files: newFiles });
            showToast("Fixed " + id, "success");
        });
    });

    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = btn.getAttribute('data-path')!;
            if (confirm(`Delete ${path}?`)) { fileActions.removeFile(path); }
        });
    });

    document.querySelectorAll('[data-action="rename"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = btn.getAttribute('data-path')!;
            const newName = prompt("Rename to:", path);
            if (newName && newName !== path) { fileActions.renameFile(path, newName); }
        });
    });

    document.querySelectorAll('[data-action="edit-content"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = btn.getAttribute('data-path')!;
            const file = state.files.find(f => f.path === path || 'www/'+f.path === path);
            if (file) {
                state.editingPath = path;
                state.editorContent = file.content || '';
                state.editorHighlightedContent = highlightCode(state.editorContent, path);
                state.editorIssues = analyzeCode(state.editorContent, path);
                updateState({});
            }
        });
    });

    if (state.editingPath) {
        const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
        const highlightLayer = document.getElementById('editor-highlight');

        textarea?.addEventListener('input', (e) => {
            const val = (e.target as HTMLTextAreaElement).value;
            state.editorContent = val;
            state.editorHighlightedContent = highlightCode(val, state.editingPath!);
            state.editorIssues = analyzeCode(val, state.editingPath!);
            if (highlightLayer) highlightLayer.innerHTML = state.editorHighlightedContent;
        });

        document.getElementById('editor-save')?.addEventListener('click', () => {
            fileActions.updateContent(state.editingPath!, state.editorContent);
            showToast("Saved", "success");
            state.editingPath = null;
            updateState({});
        });

        document.getElementById('editor-close')?.addEventListener('click', () => {
            state.editingPath = null;
            updateState({});
        });
    }
};