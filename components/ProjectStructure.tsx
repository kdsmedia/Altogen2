
import { state, fileActions, updateState, updateConfig, showToast } from '../index';
import { applyAutoFix } from '../services/validationService';
import { generateCodeSuggestion } from '../services/geminiService';
import { highlightCode, analyzeCode, applyLintFix } from '../services/syntaxService';
import { createIcons, icons } from 'lucide';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: { [key: string]: TreeNode };
  meta?: string;
  isVirtual?: boolean; // System files
  isEditable?: boolean; // User files
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
      // It's a file
      node.children[current] = { name: current, path: currentPath, type: 'file', meta, isVirtual, isEditable };
    } else {
      // It's a folder
      if (!node.children[current]) {
        node.children[current] = { name: current, path: currentPath, type: 'folder', children: {}, isVirtual, isEditable };
      }
      addToTree(pathParts.slice(1), node.children[current]!, meta, isVirtual, isEditable);
    }
  };

  // --- SYSTEM FILES (Virtual - Sync from State) ---
  addToTree(['hooks', 'README.md'], root, 'System', true, false);
  addToTree(['platforms', '.gitkeep'], root, 'System', true, false);
  
  // --- ASSETS (Virtual) ---
  if (state.assets.length > 0) {
      state.assets.forEach(asset => {
          const typeFolder = asset.assetType === 'splash' ? 'screen' : 'icon';
          addToTree(['res', typeFolder, asset.platform, asset.name], root, 'Auto-Gen', true, false);
      });
  } else {
       addToTree(['res', 'icon', 'android', 'default.png'], root, 'Default', true, false);
  }

  // --- USER FILES (Editable WWW & Virtual System Files) ---
  // Ensure www exists in tree
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
  
  // Handle Empty State
  if (state.files.length === 0 && state.config.sourceType === 'url') {
      addToTree(['www', 'index.html'], root, 'Wrapper', true, false);
  }

  // 2. Recursive Render
  const renderNode = (node: TreeNode, depth: number = 0): string => {
     if (node.name === 'root') {
         return Object.keys(node.children || {}).sort().map(k => renderNode(node.children![k]!, depth)).join('');
     }

     const isSystem = node.isVirtual;
     const isEditable = node.isEditable || (!isSystem && node.path.startsWith('www/'));
     const isTextFile = node.type === 'file' && /\.(html|css|js|json|xml|txt|md|svg)$/i.test(node.name);

     // Buttons are always visible (removed opacity-0) for better usability
     const actions = isEditable ? `
        <div class="flex items-center gap-1 ml-2">
            ${isTextFile ? `
                <button data-action="edit-content" data-path="${node.path}" class="p-1.5 hover:bg-slate-700 bg-slate-800/50 rounded text-cyan-400 border border-white/5" title="Edit Content">
                    <i data-lucide="file-edit" class="w-3 h-3"></i>
                </button>
            ` : ''}
            <button data-action="rename" data-path="${node.path}" data-type="${node.type}" class="p-1.5 hover:bg-slate-700 bg-slate-800/50 rounded text-blue-400 border border-white/5" title="Rename">
                <i data-lucide="pencil" class="w-3 h-3"></i>
            </button>
            <button data-action="delete" data-path="${node.path}" class="p-1.5 hover:bg-red-900/50 bg-slate-800/50 rounded text-red-400 border border-white/5" title="Delete">
                <i data-lucide="trash" class="w-3 h-3"></i>
            </button>
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

        // Added data-row-file and cursor-pointer for click-to-edit
        return `
            <div 
                data-row-file="${node.path}"
                data-editable="${isEditable && isTextFile}"
                class="flex items-center justify-between group py-2 hover:bg-white/5 rounded px-2 transition-colors border-l-2 border-transparent ${isEditable && isTextFile ? 'hover:border-cyan-500 cursor-pointer' : 'cursor-default'}"
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
         // Folder
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

  // Render Issues Panel
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
                    <button id="btn-fix-all" class="px-4 py-2 bg-white text-slate-900 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-white/10">
                        <i data-lucide="sparkles" class="w-4 h-4 text-purple-600"></i>
                        Auto-Fix Issues
                    </button>
                ` : ''}
            </div>
            <div class="p-2">
                ${state.issues.map(issue => `
                    <div class="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 group transition-colors">
                        <div class="flex items-center gap-3">
                            <i data-lucide="${issue.severity === 'error' ? 'x-circle' : 'info'}" class="w-4 h-4 ${issue.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}"></i>
                            <span class="text-sm text-slate-300">${issue.message}</span>
                        </div>
                        ${issue.autoFixAvailable ? `
                           <button data-fix-id="${issue.id}" class="text-xs text-cyan-400 hover:text-cyan-300 underline opacity-0 group-hover:opacity-100 transition-opacity">
                               Fix this
                           </button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
      `;
  };
  
  // Render Editor Linting Panel
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
                                <button data-manual-fix="${issue.line}" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-white/10">
                                    Manual
                                </button>
                                ${issue.fixSuggestion ? `
                                    <button data-auto-fix="${issue.id}" class="px-2 py-1 rounded bg-${issue.severity === 'error' ? 'red' : 'blue'}-900/30 hover:bg-${issue.severity === 'error' ? 'red' : 'blue'}-900/50 text-[10px] ${color} border border-${issue.severity === 'error' ? 'red' : 'blue'}-500/20 flex items-center gap-1">
                                        <i data-lucide="sparkles" class="w-3 h-3"></i> Auto Fix
                                    </button>
                                ` : ''}
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
      
      <!-- TITLE & TOOLBAR -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-3xl font-bold text-white mb-1">Project Structure</h2>
            <p class="text-slate-400 text-sm">Manage files in <span class="font-mono text-cyan-400">www/</span> directory.</p>
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

      <!-- HEALTH MONITOR -->
      ${renderIssues()}

      <!-- FILE TREE -->
      <div class="flex-1 bg-slate-950/50 backdrop-blur-sm rounded-2xl border border-white/5 shadow-inner overflow-hidden flex flex-col relative min-h-[400px]">
          <div class="bg-slate-900 px-4 py-3 border-b border-white/5 flex items-center gap-2 sticky top-0 z-10">
             <div class="flex gap-1.5">
                 <div class="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                 <div class="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                 <div class="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
             </div>
             <span class="ml-4 text-xs font-mono text-slate-500">${state.config.id}</span>
             
             <!-- Auto Sync Indicator -->
             <div class="ml-auto flex items-center gap-2 text-xs font-mono">
                <span class="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
                    <i data-lucide="refresh-cw" class="w-3 h-3 animate-[spin_3s_linear_infinite]"></i>
                    Auto-Sync Active
                </span>
             </div>
          </div>

          <div class="flex-1 p-6 overflow-auto custom-scrollbar select-none">
               ${renderNode(root)}
          </div>
      </div>
      
      <div class="flex justify-end">
         <button data-nav="CONFIG" class="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all">
             <span>Finalize Configuration</span>
             <i data-lucide="arrow-right" class="w-4 h-4"></i>
         </button>
      </div>

      <!-- EDITOR MODAL -->
      ${state.editingPath ? `
        <div class="absolute inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in zoom-in-95 duration-200 shadow-2xl rounded-2xl overflow-hidden">
            <div class="bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between z-20">
                <div class="flex items-center gap-2">
                    <i data-lucide="edit-3" class="w-4 h-4 text-cyan-400"></i>
                    <span class="font-mono text-sm text-slate-200">${state.editingPath}</span>
                    <span class="text-xs text-slate-500 ml-2">(${state.editorContent.length} chars)</span>
                    ${state.editorIssues.length > 0 ? `
                        <div class="flex items-center gap-1 ml-2 px-2 py-0.5 bg-red-900/30 rounded border border-red-500/20">
                            <i data-lucide="alert-circle" class="w-3 h-3 text-red-400"></i>
                            <span class="text-xs text-red-400 font-bold">${state.editorIssues.length}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="flex items-center gap-2">
                     <div class="flex items-center gap-1 mr-3 border-r border-white/10 pr-3">
                        <button id="editor-ai" class="p-1.5 text-purple-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-colors border border-purple-500/30 shadow-[0_0_10px_-3px_rgba(168,85,247,0.4)]" title="Auto-Suggest Feature (AI)">
                            <i data-lucide="wand-2" class="w-4 h-4"></i>
                        </button>
                        <button id="editor-copy" class="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors" title="Copy All">
                            <i data-lucide="copy" class="w-4 h-4"></i>
                        </button>
                        <button id="editor-paste" class="p-1.5 text-slate-400 hover:text-green-400 hover:bg-white/5 rounded-lg transition-colors" title="Paste at Cursor">
                            <i data-lucide="clipboard-paste" class="w-4 h-4"></i>
                        </button>
                    </div>

                    <button id="editor-cancel" class="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                    <button id="editor-save" class="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg shadow-cyan-500/20 flex items-center gap-1">
                        <i data-lucide="save" class="w-3 h-3"></i> Save Changes
                    </button>
                </div>
            </div>
            
            <div class="flex-1 relative flex flex-col min-h-0 bg-[#0d1117]">
                <!-- SYNTAX HIGHLIGHTING LAYER -->
                <div class="absolute inset-0 p-4 font-mono text-sm overflow-hidden pointer-events-none z-0">
                     <pre id="editor-highlight-layer" class="m-0 p-0 whitespace-pre-wrap break-all" style="font-family: 'Fira Code', monospace; line-height: 1.5; color: transparent;">${state.editorHighlightedContent}</pre>
                </div>

                <!-- INPUT LAYER -->
                <textarea id="file-editor-area" class="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white font-mono text-sm p-4 resize-none outline-none leading-relaxed z-10 whitespace-pre-wrap break-all" spellcheck="false" style="line-height: 1.5; font-family: 'Fira Code', monospace;">${state.editorContent}</textarea>
                
                <!-- AI Suggestion Panel -->
                ${state.isSuggesting ? `
                    <div class="absolute bottom-0 inset-x-0 bg-slate-900/90 backdrop-blur-md p-4 border-t border-purple-500/30 flex items-center justify-center gap-3 animate-in slide-in-from-bottom-2 z-30">
                         <i data-lucide="loader-2" class="w-5 h-5 text-purple-400 animate-spin"></i>
                         <span class="text-sm text-slate-300">Consulting AI for improvements...</span>
                    </div>
                ` : ''}

                ${state.editorSuggestion ? `
                    <div class="absolute bottom-0 inset-x-0 bg-slate-900 border-t-2 border-purple-500 shadow-[0_-10px_40px_-10px_rgba(168,85,247,0.2)] flex flex-col animate-in slide-in-from-bottom-full duration-300 max-h-[50%] z-30">
                         <div class="flex items-center justify-between px-4 py-2 bg-purple-900/20 border-b border-purple-500/20">
                             <div class="flex items-center gap-2">
                                <i data-lucide="sparkles" class="w-4 h-4 text-purple-400"></i>
                                <span class="text-sm font-bold text-purple-200">AI Suggestion</span>
                             </div>
                             <button id="btn-discard-ai" class="text-xs text-slate-400 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>
                         </div>
                         <div class="p-4 overflow-y-auto flex-1 custom-scrollbar">
                             <p class="text-sm text-slate-300 mb-3">${state.editorSuggestion.explanation}</p>
                             <div class="relative group">
                                <pre class="text-xs font-mono bg-black/50 p-3 rounded-lg text-green-300 border border-white/10 overflow-x-auto">${state.editorSuggestion.code}</pre>
                                <button id="btn-copy-suggestion" class="absolute top-2 right-2 p-1.5 bg-white/10 rounded hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i data-lucide="copy" class="w-3 h-3"></i>
                                </button>
                             </div>
                         </div>
                         <div class="p-3 bg-slate-950/50 flex justify-end gap-2 border-t border-white/5">
                            <button id="btn-discard-ai-bottom" class="px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5 rounded-lg">Discard</button>
                            <button id="btn-apply-ai" class="px-4 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-lg shadow-purple-500/20 font-bold flex items-center gap-1">
                                <i data-lucide="check" class="w-3 h-3"></i> Apply Code
                            </button>
                         </div>
                    </div>
                ` : ''}
            </div>

            <!-- LINTING PANEL -->
            ${renderEditorIssues()}
        </div>
      ` : ''}
    </div>
  `;
};

export const structureListeners = () => {
    // Toolbar & Uploads
    const fileInput = document.getElementById('toolbar-file-upload') as HTMLInputElement;
    const folderInput = document.getElementById('toolbar-folder-upload') as HTMLInputElement;

    document.getElementById('btn-new-file')?.addEventListener('click', () => {
        const name = prompt("Enter file name (e.g. index.html or js/app.js):");
        if (name) {
            const path = name.startsWith('www/') ? name : `www/${name}`;
            fileActions.addFile({ name: path.split('/').pop()!, path, size: 0, type: 'text/plain', content: '' });
            showToast('File created', 'success');
        }
    });

    document.getElementById('btn-new-folder')?.addEventListener('click', () => {
        const name = prompt("Enter folder name (e.g. css):");
        if (name) {
            const path = name.startsWith('www/') ? name : `www/${name}`;
            fileActions.addFile({ name: path.split('/').pop()!, path, size: 0, type: 'folder', isFolder: true });
             showToast('Folder created', 'success');
        }
    });

    document.getElementById('btn-upload-file')?.addEventListener('click', () => fileInput?.click());
    document.getElementById('btn-upload-folder')?.addEventListener('click', () => folderInput?.click());

    const handleUpload = (e: Event) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files) return;
        let count = 0;
        Array.from(files).forEach(f => {
            let relativePath = f.webkitRelativePath || f.name;
            if (f.webkitRelativePath) {
                 const parts = f.webkitRelativePath.split('/');
                 if (parts.length > 1) relativePath = parts.slice(1).join('/'); 
            }
            if (relativePath) {
                fileActions.addFile({ 
                    name: f.name, 
                    path: `www/${relativePath}`, 
                    size: f.size, 
                    type: f.type, 
                    nativeFile: f 
                });
                count++;
            }
        });
        showToast(`${count} files uploaded`, 'success');
        if(fileInput) fileInput.value = '';
        if(folderInput) folderInput.value = '';
    };

    fileInput?.addEventListener('change', handleUpload);
    folderInput?.addEventListener('change', handleUpload);

    // Row Actions - Open Editor on Click
    document.querySelectorAll('[data-row-file]').forEach(row => {
        row.addEventListener('click', async (e) => {
            // Check if it's editable text file
            const path = row.getAttribute('data-row-file');
            const isEditable = row.getAttribute('data-editable') === 'true';

            if (path && isEditable) {
                const file = state.files.find(f => f.path === path);
                if (file) {
                    let content = file.content || '';
                    if (!content && file.nativeFile) {
                        try { content = await file.nativeFile.text(); } 
                        catch(e) { showToast("Error reading file", 'error'); return; }
                    }
                    // Initial highlight & analyze
                    const highlighted = highlightCode(content, path);
                    const issues = analyzeCode(content, path);
                    updateState({ editingPath: path, editorContent: content, editorHighlightedContent: highlighted, editorIssues: issues, editorSuggestion: null, isSuggesting: false });
                }
            }
        });
    });

    // Button Actions
    document.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Stop row click event
            const action = btn.getAttribute('data-action');
            const path = btn.getAttribute('data-path') || '';

            if (action === 'delete') {
                if (confirm(`Delete ${path}?`)) {
                    fileActions.removeFile(path);
                    showToast('Deleted ' + path, 'info');
                }
            } else if (action === 'rename') {
                const currentName = path.split('/').pop();
                const newName = prompt("Rename to:", currentName);
                if (newName && newName !== currentName) {
                    const parts = path.split('/');
                    parts.pop();
                    const newPath = parts.length > 0 ? `${parts.join('/')}/${newName}` : newName;
                    fileActions.renameFile(path, newPath);
                    showToast('Renamed successfully', 'success');
                }
            } else if (action === 'edit-content') {
                const file = state.files.find(f => f.path === path);
                if (file) {
                    let content = file.content || '';
                    if (!content && file.nativeFile) {
                        try { content = await file.nativeFile.text(); } 
                        catch(e) { showToast("Error reading file", 'error'); return; }
                    }
                     // Initial highlight & analyze
                    const highlighted = highlightCode(content, path);
                    const issues = analyzeCode(content, path);
                    updateState({ editingPath: path, editorContent: content, editorHighlightedContent: highlighted, editorIssues: issues, editorSuggestion: null, isSuggesting: false });
                } else {
                    showToast("This file cannot be edited", 'error');
                }
            }
        });
    });

    // Auto Fix Listeners
    const fixAllBtn = document.getElementById('btn-fix-all');
    if (fixAllBtn) {
        fixAllBtn.addEventListener('click', () => {
            // Apply all fixes
            let updates: any = {};
            let fileUpdates: any[] = [];
            
            state.issues.filter(i => i.autoFixAvailable).forEach(issue => {
                const result = applyAutoFix(issue.id, state.config, state.files);
                if (result.config) updates = { ...updates, ...result.config };
                if (result.newFiles) fileUpdates = [...fileUpdates, ...result.newFiles];
            });

            if (fileUpdates.length > 0) {
                fileUpdates.forEach(f => fileActions.addFile(f));
            }
            if (Object.keys(updates).length > 0) {
                updateConfig(updates);
            }
            showToast('Auto-fix applied', 'success');
        });
    }
    
    // Individual Fix Project Issues
    document.querySelectorAll('[data-fix-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-fix-id');
            if (id) {
                 const result = applyAutoFix(id, state.config, state.files);
                 if (result.config) updateConfig(result.config);
                 if (result.newFiles) result.newFiles.forEach(f => fileActions.addFile(f));
                 showToast('Issue fixed', 'success');
            }
        });
    });

    // Editor Logic (Save, Cancel, Copy, Paste)
    const editorSave = document.getElementById('editor-save');
    const editorCancel = document.getElementById('editor-cancel');
    const editorArea = document.getElementById('file-editor-area') as HTMLTextAreaElement;
    const highlightLayer = document.getElementById('editor-highlight-layer');
    const editorCopy = document.getElementById('editor-copy');
    const editorPaste = document.getElementById('editor-paste');
    const editorAI = document.getElementById('editor-ai');

    // SYNC SCROLL & INPUT FOR HIGHLIGHTING
    if (editorArea && highlightLayer && state.editingPath) {
        const syncScroll = () => {
            if (highlightLayer.parentElement) {
                highlightLayer.parentElement.scrollTop = editorArea.scrollTop;
                highlightLayer.parentElement.scrollLeft = editorArea.scrollLeft;
            }
        };

        const handleInput = () => {
             const val = editorArea.value;
             // Update highlight layer
             if (state.editingPath) {
                 const highlighted = highlightCode(val, state.editingPath);
                 highlightLayer.innerHTML = highlighted;
                 
                 // Update Issues (Debounce ideally, but kept simple here)
                 const issues = analyzeCode(val, state.editingPath);
                 // We don't want to re-render entire app on every keystroke if issues didn't change
                 // But for simplicity in this architecture, we update state.
                 // Ideally this would be optimized.
                 if(JSON.stringify(issues) !== JSON.stringify(state.editorIssues)) {
                      updateState({ 
                          editorIssues: issues, 
                          editorContent: val,
                          editorHighlightedContent: highlighted 
                      });
                 } else {
                     // Just update content without re-render to keep cursor focus
                     state.editorContent = val;
                 }
             }
        };

        editorArea.addEventListener('scroll', syncScroll);
        editorArea.addEventListener('input', handleInput);
    }

    // EDITOR LINTING ACTIONS
    // 1. Manual Fix (Scroll to line)
    document.querySelectorAll('[data-manual-fix]').forEach(btn => {
        btn.addEventListener('click', () => {
            const line = parseInt(btn.getAttribute('data-manual-fix') || '1');
            const lineHeight = 21; // Approx 1.5 * 14px
            const scrollPos = (line - 1) * lineHeight;
            if(editorArea) {
                editorArea.scrollTop = scrollPos;
                editorArea.focus();
                // Select the line (rough logic)
                const lines = editorArea.value.split('\n');
                let startPos = 0;
                for(let i=0; i<line-1; i++) startPos += lines[i].length + 1;
                editorArea.setSelectionRange(startPos, startPos + lines[line-1].length);
            }
        });
    });

    // 2. Auto Fix (Apply Snippet)
    document.querySelectorAll('[data-auto-fix]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-auto-fix');
            const issue = state.editorIssues.find(i => i.id === id);
            if(issue && editorArea && state.editingPath) {
                const newContent = applyLintFix(editorArea.value, issue);
                editorArea.value = newContent;
                
                // Trigger Input Event to update state/highlights
                const event = new Event('input', { bubbles: true });
                editorArea.dispatchEvent(event);
                showToast('Fix applied', 'success');
            }
        });
    });


    if (editorSave && state.editingPath) {
        editorSave.onclick = () => {
             const newContent = editorArea.value;
             if (state.editingPath) {
                 fileActions.updateContent(state.editingPath, newContent);
             }
             updateState({ editingPath: null, editorContent: '', editorHighlightedContent: '', editorIssues: [], editorSuggestion: null, isSuggesting: false });
             showToast('File saved successfully', 'success');
        };
    }
    
    // AI Assistant Logic
    if (editorAI && state.editingPath && !state.isSuggesting) {
        editorAI.onclick = async () => {
             updateState({ isSuggesting: true, editorSuggestion: null });
             try {
                 const currentContent = editorArea.value;
                 const result = await generateCodeSuggestion(state.editingPath!, currentContent);
                 updateState({ isSuggesting: false, editorSuggestion: result });
             } catch (e) {
                 showToast("AI Suggestion failed. Check API Key.", 'error');
                 updateState({ isSuggesting: false });
             }
        };
    }

    // AI Panel Actions
    const btnDiscardAI = document.getElementById('btn-discard-ai');
    const btnDiscardAIBottom = document.getElementById('btn-discard-ai-bottom');
    const btnApplyAI = document.getElementById('btn-apply-ai');
    const btnCopySuggestion = document.getElementById('btn-copy-suggestion');

    if (btnDiscardAI) btnDiscardAI.onclick = () => updateState({ editorSuggestion: null });
    if (btnDiscardAIBottom) btnDiscardAIBottom.onclick = () => updateState({ editorSuggestion: null });
    
    if (btnApplyAI && editorArea && state.editorSuggestion) {
        btnApplyAI.onclick = () => {
             const newCode = state.editorSuggestion!.code;
             const start = editorArea.selectionStart;
             const value = editorArea.value;
             
             // Simple append if cursor is at end, or insert at cursor
             if (start === value.length) {
                 editorArea.value = value + '\n' + newCode;
             } else {
                 editorArea.value = value.substring(0, start) + newCode + value.substring(editorArea.selectionEnd);
             }
             
             // Update logic (trigger input event to re-highlight)
             const event = new Event('input', { bubbles: true });
             editorArea.dispatchEvent(event);
             
             updateState({ editorContent: editorArea.value, editorSuggestion: null });
        };
    }
    
    if (btnCopySuggestion && state.editorSuggestion) {
        btnCopySuggestion.onclick = () => {
            navigator.clipboard.writeText(state.editorSuggestion!.code);
            btnCopySuggestion.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-green-400"></i>`;
            createIcons({ icons });
            setTimeout(() => {
                btnCopySuggestion.innerHTML = `<i data-lucide="copy" class="w-3 h-3"></i>`;
                createIcons({ icons });
            }, 1500);
        };
    }

    if (editorCopy && editorArea) {
        editorCopy.onclick = () => {
            navigator.clipboard.writeText(editorArea.value).then(() => {
                // Visual feedback: Change icon momentarily
                const originalHtml = editorCopy.innerHTML;
                editorCopy.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-green-400"></i>`;
                createIcons({ icons });
                setTimeout(() => {
                    editorCopy.innerHTML = `<i data-lucide="copy" class="w-4 h-4"></i>`;
                    createIcons({ icons });
                }, 1500);
            });
        };
    }

    if (editorPaste && editorArea) {
        editorPaste.onclick = async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    const start = editorArea.selectionStart;
                    const end = editorArea.selectionEnd;
                    const value = editorArea.value;
                    // Insert text at cursor position
                    editorArea.value = value.substring(0, start) + text + value.substring(end);
                    // Move cursor to end of pasted text
                    editorArea.selectionStart = editorArea.selectionEnd = start + text.length;
                    
                    // Trigger update
                    const event = new Event('input', { bubbles: true });
                    editorArea.dispatchEvent(event);

                    editorArea.focus();
                }
            } catch (err) {
                showToast("Clipboard permission denied", 'error');
            }
        };
    }

    if (editorCancel) editorCancel.onclick = () => updateState({ editingPath: null, editorContent: '', editorHighlightedContent: '', editorIssues: [], editorSuggestion: null, isSuggesting: false });
    if (editorArea) {
        editorArea.focus();
        // Trigger initial scroll sync
        if (highlightLayer && highlightLayer.parentElement) {
             highlightLayer.parentElement.scrollTop = editorArea.scrollTop;
        }
    }
};
