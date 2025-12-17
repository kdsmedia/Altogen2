import { ProjectConfig, FileEntry, AssetEntry, ProjectIssue } from '../types';

export const validateProject = (
  config: ProjectConfig, 
  files: FileEntry[], 
  assets: AssetEntry[]
): ProjectIssue[] => {
  const issues: ProjectIssue[] = [];

  // 1. Validate Package ID (Reverse Domain)
  const idRegex = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i;
  if (!config.id) {
    issues.push({
      id: 'missing-id',
      severity: 'error',
      message: 'Package ID is missing.',
      autoFixAvailable: true,
      field: 'id'
    });
  } else if (!idRegex.test(config.id)) {
    issues.push({
      id: 'invalid-id',
      severity: 'error',
      message: 'Package ID must be in reverse-domain format (e.g. com.myapp.pro).',
      autoFixAvailable: true,
      field: 'id'
    });
  }

  // 2. Validate App Name
  if (!config.name || config.name.length < 2) {
    issues.push({
      id: 'invalid-name',
      severity: 'warning',
      message: 'App Name is too short or missing.',
      autoFixAvailable: true,
      field: 'name'
    });
  }

  // 3. Validate Entry Point (index.html)
  if (config.sourceType === 'folder') {
      const hasIndex = files.some(f => f.path === 'www/index.html' || f.path === 'index.html');
      if (!hasIndex) {
          issues.push({
              id: 'missing-index',
              severity: 'error',
              message: 'Missing "index.html" in uploaded assets. App will not launch.',
              autoFixAvailable: true
          });
      }
  }

  // 4. Validate Directory Prefix
  const unPrefixedFiles = files.filter(f => !f.isVirtual && !f.path.startsWith('www/'));
  if (unPrefixedFiles.length > 0) {
      issues.push({
          id: 'missing-www-prefix',
          severity: 'warning',
          message: `${unPrefixedFiles.length} file(s) are missing the "www/" prefix required for assets.`,
          autoFixAvailable: true
      });
  }

  // 5. Validate Assets
  const hasAndroidIcon = assets.some(a => a.platform === 'android');
  const hasIosIcon = assets.some(a => a.platform === 'ios');

  if (config.platforms.includes('android') && !hasAndroidIcon) {
      issues.push({
          id: 'missing-android-icon',
          severity: 'warning',
          message: 'No Android icons generated. Default Cordova ghost icon will be used.',
          autoFixAvailable: false
      });
  }
  if (config.platforms.includes('ios') && !hasIosIcon) {
      issues.push({
          id: 'missing-ios-icon',
          severity: 'warning',
          message: 'No iOS icons generated. App Store may reject submission.',
          autoFixAvailable: false
      });
  }

  // 6. Source Value Check
  if (!config.sourceValue && config.sourceType !== 'folder') {
       issues.push({
          id: 'missing-source',
          severity: 'error',
          message: `Missing ${config.sourceType === 'url' ? 'Target URL' : 'Repository URL'}.`,
          autoFixAvailable: false
       });
  }

  return issues;
};

// Helper to auto-fix issues
export const applyAutoFix = (issueId: string, currentConfig: ProjectConfig, currentFiles: FileEntry[]): { config?: Partial<ProjectConfig>, newFiles?: FileEntry[] } => {
    switch(issueId) {
        case 'invalid-id': {
            const cleanName = currentConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            return { config: { id: `com.altogen.${cleanName || 'app'}` } };
        }
        
        case 'missing-id':
             return { config: { id: 'com.altogen.studio.app' } };

        case 'invalid-name':
             return { config: { name: 'AltoGen_App' } };

        case 'missing-index': {
            const file: FileEntry = {
                name: 'index.html',
                path: 'www/index.html',
                size: 320,
                type: 'text/html',
                content: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My App</title>\n</head>\n<body>\n    <h1>Hello Cordova!</h1>\n    <script src="cordova.js"></script>\n</body>\n</html>',
                isFolder: false
            };
            return { newFiles: [...currentFiles, file] };
        }

        case 'missing-www-prefix': {
            const updatedFiles = currentFiles.map(f => {
                if (!f.isVirtual && !f.path.startsWith('www/')) {
                    return { ...f, path: 'www/' + f.path };
                }
                return f;
            });
            return { newFiles: updatedFiles };
        }

        default:
            return {};
    }
};
