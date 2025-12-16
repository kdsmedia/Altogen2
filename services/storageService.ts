import { ProjectConfig, FileEntry } from '../types';

const STORAGE_KEY_CONFIG = 'altogen_config_v1';
const STORAGE_KEY_FILES = 'altogen_files_v1';

export const saveProject = (config: ProjectConfig, files: FileEntry[]) => {
    try {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
        
        // Only save text-based files created by user to avoid QuotaExceededError with large binaries
        // We do NOT save generated assets or uploaded binary files in LocalStorage (too big)
        const textFiles = files.filter(f => !f.nativeFile && !f.isVirtual && f.type.startsWith('text/'));
        localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(textFiles));
        
        return true;
    } catch (e) {
        console.warn("Auto-save failed (Storage Full?)", e);
        return false;
    }
};

export const loadProject = (): { config: ProjectConfig | null, files: FileEntry[] } => {
    try {
        const configStr = localStorage.getItem(STORAGE_KEY_CONFIG);
        const filesStr = localStorage.getItem(STORAGE_KEY_FILES);
        
        const config = configStr ? JSON.parse(configStr) : null;
        const files = filesStr ? JSON.parse(filesStr) : [];
        
        return { config, files };
    } catch (e) {
        console.error("Failed to load project", e);
        return { config: null, files: [] };
    }
};

export const resetProject = () => {
    localStorage.removeItem(STORAGE_KEY_CONFIG);
    localStorage.removeItem(STORAGE_KEY_FILES);
    window.location.reload();
};