
export type SourceType = 'url' | 'folder' | 'github';

export interface AdConfig {
  enabled: boolean;
  androidAppId: string;
  iosAppId: string;
  bannerId: string;
  interstitialId: string;
  rewardedId: string;
  autoShowBanner: boolean;
  bannerPosition: 'top' | 'bottom';
}

export interface PreferenceConfig {
  orientation: 'default' | 'portrait' | 'landscape';
  fullscreen: boolean;
  backgroundColor: string;
  disallowOverscroll: boolean;
  hideSplashScreenSpinner: boolean;
}

export interface ProjectConfig {
  name: string;
  id: string;
  version: string;
  description: string;
  authorEmail: string;
  authorName: string;
  authorWebsite: string;
  sourceType: SourceType;
  sourceValue: string;
  platforms: string[];
  plugins: string[];
  pluginVariables?: { [pluginId: string]: { [variableName: string]: string } };
  adConfig: AdConfig;
  preferences: PreferenceConfig;
  enableGit: boolean;
}

export interface FileEntry {
  name: string;
  path: string;
  size: number;
  type: string;
  nativeFile?: File;
  content?: string;
  isFolder?: boolean;
  isVirtual?: boolean;
}

export interface AssetEntry {
  platform: 'android' | 'ios';
  assetType?: 'icon' | 'splash';
  name: string;
  blob: Blob;
  size: number;
  height?: number;
}

export interface PermissionEntry {
  platform: 'ios' | 'android' | 'both';
  name: string;
  reason: string;
}

export interface GeneratedResult {
  configXml: string;
  readme: string;
  analysis: string;
  permissions: PermissionEntry[];
}

export interface ProjectIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  autoFixAvailable: boolean;
  field?: keyof ProjectConfig;
}

export interface EditorIssue {
    id: string;
    line: number;
    severity: 'error' | 'warning' | 'info' | 'success'; 
    message: string;
    snippet: string; 
    fixSuggestion?: string; 
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    role: 'admin' | 'user';
    plan: 'free' | 'premium';
}

export interface UpgradeRequest {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: any;
}

export enum ViewMode {
  SETUP = 'SETUP',
  ASSETS = 'ASSETS',
  STRUCTURE = 'STRUCTURE',
  MONETIZATION = 'MONETIZATION',
  CONFIG = 'CONFIG',
  ABOUT = 'ABOUT',
  PRIVACY = 'PRIVACY',
  DISCLAIMER = 'DISCLAIMER',
  PROFILE = 'PROFILE',
  UPGRADE = 'UPGRADE',
  ADMIN_PANEL = 'ADMIN_PANEL'
}
