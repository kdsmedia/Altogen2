
import { UserProfile, ViewMode } from '../types';
import { loginWithGoogle, logout } from '../services/firebaseService';
import { updateState, showToast } from '../index';

export const Profile = (user: UserProfile | null) => {
    
    // If not logged in
    if (!user) {
        return `
            <div class="flex items-center justify-center min-h-[500px] animate-in fade-in slide-in-from-bottom-4">
                <div class="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                    <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i data-lucide="user" class="w-8 h-8 text-slate-400"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">Access Your Profile</h2>
                    <p class="text-slate-400 mb-8">Login to manage your subscription, save projects to your account, and access premium features.</p>
                    
                    <button id="btn-login-google" class="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 py-3 rounded-xl font-bold transition-all transform hover:scale-[1.02]">
                        <img src="https://www.google.com/favicon.ico" class="w-5 h-5" />
                        <span>Sign in with Google</span>
                    </button>
                </div>
            </div>
        `;
    }

    // If logged in
    const isPremium = user.plan === 'premium';
    const isAdmin = user.role === 'admin';

    return `
        <div class="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <!-- Profile Header -->
            <div class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 border border-white/5 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                
                <div class="relative">
                    <img src="${user.photoURL}" class="w-24 h-24 rounded-full border-4 border-slate-700 shadow-xl" alt="${user.displayName}" />
                    <div class="absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-slate-800 flex items-center justify-center ${isPremium ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-slate-500'}">
                        <i data-lucide="${isPremium ? 'star' : 'user'}" class="w-3 h-3 text-white"></i>
                    </div>
                </div>
                
                <div class="flex-1 text-center md:text-left z-10">
                    <h2 class="text-3xl font-bold text-white mb-1">${user.displayName}</h2>
                    <p class="text-slate-400 font-mono text-sm mb-4">${user.email}</p>
                    <div class="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${isPremium ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-slate-700 border-slate-600 text-slate-300'}">
                            ${user.plan} Plan
                        </span>
                        ${isAdmin ? `<span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-purple-500/20 border-purple-500/50 text-purple-400">Admin</span>` : ''}
                    </div>
                </div>

                <div class="flex flex-col gap-3 z-10 w-full md:w-auto">
                    ${!isPremium ? `
                        <button id="btn-go-upgrade" class="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2">
                            <i data-lucide="zap" class="w-4 h-4"></i> Upgrade Premium
                        </button>
                    ` : ''}
                    <button id="btn-logout" class="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2">
                        <i data-lucide="log-out" class="w-4 h-4"></i> Logout
                    </button>
                </div>
            </div>

            <!-- Dashboard/Stats (Placeholder) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                    <h3 class="text-lg font-semibold text-white mb-4">Project Stats</h3>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-slate-400">Total Projects Saved</span>
                            <span class="text-white font-mono">0</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-slate-400">Member Since</span>
                            <span class="text-white font-mono">Today</span>
                        </div>
                    </div>
                </div>

                ${isAdmin ? `
                <div class="bg-purple-900/20 rounded-xl p-6 border border-purple-500/20">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-purple-200">Admin Controls</h3>
                        <i data-lucide="shield" class="w-5 h-5 text-purple-400"></i>
                    </div>
                    <p class="text-sm text-purple-300/70 mb-6">Manage users and approve upgrade requests.</p>
                    <button id="btn-go-admin" class="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-lg shadow-purple-500/20 transition-all">
                        Open Admin Panel
                    </button>
                </div>
                ` : ''}
            </div>
        </div>
    `;
};

export const profileListeners = () => {
    const btnLogin = document.getElementById('btn-login-google');
    if (btnLogin) {
        btnLogin.onclick = async () => {
            const original = btnLogin.innerHTML;
            try {
                btnLogin.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Connecting...`;
                await loginWithGoogle();
                showToast("Welcome back!", "success");
            } catch (e) {
                showToast("Login failed", "error");
                btnLogin.innerHTML = original;
            }
        };
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.onclick = async () => {
            await logout();
            showToast("Logged out successfully", "info");
        };
    }

    const btnGoUpgrade = document.getElementById('btn-go-upgrade');
    if (btnGoUpgrade) {
        btnGoUpgrade.onclick = () => updateState({ currentMode: ViewMode.UPGRADE });
    }

    const btnGoAdmin = document.getElementById('btn-go-admin');
    if (btnGoAdmin) {
        btnGoAdmin.onclick = () => updateState({ currentMode: ViewMode.ADMIN_PANEL });
    }
};
