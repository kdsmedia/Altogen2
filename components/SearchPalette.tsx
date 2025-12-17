
import { state, updateState } from '../index';
// Fix: Import ViewMode from types.ts since index.tsx does not export it
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

export const SearchPalette = () => {
    // Collect possible search items
    const items: SearchResult[] = [
        // Navigation items
        { id: 'nav-setup', label: 'Project Setup', sub: 'Configure name, id, and source', icon: 'settings', type: 'nav', mode: ViewMode.SETUP },
        { id: 'nav-assets', label: 'Asset Generator', sub: 'Icons and splash screens', icon: 'image', type: 'nav', mode: ViewMode.ASSETS },
        { id: 'nav-structure', label: 'Project Structure', sub: 'Manage files and folders', icon: 'folder-tree', type: 'nav', mode