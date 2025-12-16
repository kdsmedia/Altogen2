
import { UpgradeRequest, UserProfile } from '../types';
import { getUpgradeRequests, processUpgradeRequest, getTotalUsersCount } from '../services/firebaseService';
import { updateState, showToast } from '../index';
import { createIcons, icons } from 'lucide';

let requests: UpgradeRequest[] = [];
let totalUsers = 0;
let loading = true;

const loadData = async () => {
    try {
        const [reqs, count] = await Promise.all([
            getUpgradeRequests(),
            getTotalUsersCount()
        ]);
        requests = reqs;
        totalUsers = count;
    } catch (e) {
        console.error(e);
        showToast("Error loading admin data", "error");
    } finally {
        loading = false;
        renderContent();
    }
};

const renderContent = () => {
    const container = document.getElementById('admin-content');
    if (!container) return;

    if (loading) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-slate-500">
                <i data-lucide="loader-2" class="w-8 h-8 animate-spin mb-2"></i>
                <p>Loading Admin Data...</p>
            </div>
        `;
        createIcons({ icons });
        return;
    }

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const historyRequests = requests.filter(r => r.status !== 'pending');

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-slate-800 p-6 rounded-xl border border-white/5">
                <p class="text-slate-400 text-xs uppercase font-bold">Total Users</p>
                <p class="text-3xl font-bold text-white mt-2">${totalUsers}</p>
            </div>
            <div class="bg-slate-800 p-6 rounded-xl border border-white/5">
                <p class="text-slate-400 text-xs uppercase font-bold">Pending Requests</p>
                <p class="text-3xl font-bold text-yellow-400 mt-2">${pendingRequests.length}</p>
            </div>
             <div class="bg-slate-800 p-6 rounded-xl border border-white/5">
                <p class="text-slate-400 text-xs uppercase font-bold">Total Revenue (Est)</p>
                <p class="text-3xl font-bold text-green-400 mt-2">IDR ${(requests.filter(r => r.status === 'approved').length * 50000).toLocaleString('id-ID')}</p>
            </div>
        </div>

        <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <i data-lucide="inbox" class="w-5 h-5 text-yellow-400"></i> Pending Requests
        </h3>
        
        <div class="bg-slate-900 border border-white/5 rounded-xl overflow-hidden mb-8">
            ${pendingRequests.length === 0 ? `
                <div class="p-8 text-center text-slate-500">No pending requests</div>
            ` : `
                <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-800 text-xs uppercase text-slate-400 border-b border-white/5">
                            <th class="p-4">User</th>
                            <th class="p-4">Bank Details</th>
                            <th class="p-4">Proof</th>
                            <th class="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
                        ${pendingRequests.map(req => `
                            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td class="p-4">
                                    <div class="font-bold text-white">${req.userName}</div>
                                    <div class="text-slate-500 text-xs">${req.userEmail}</div>
                                </td>
                                <td class="p-4">
                                    <div class="text-cyan-300 font-mono">${req.bankName}</div>
                                    <div class="text-white">${req.accountNumber}</div>
                                    <div class="text-slate-400 text-xs">A.N ${req.accountHolder}</div>
                                </td>
                                <td class="p-4">
                                   <span class="text-xs text-slate-500 italic">Check bank mutation</span>
                                </td>
                                <td class="p-4 text-right">
                                    <div class="flex justify-end gap-2">
                                        <button data-reject="${req.id}" data-uid="${req.userId}" class="p-2 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors" title="Reject">
                                            <i data-lucide="x" class="w-4 h-4"></i>
                                        </button>
                                        <button data-approve="${req.id}" data-uid="${req.userId}" class="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg shadow-green-500/20 transition-colors flex items-center gap-1">
                                            <i data-lucide="check" class="w-4 h-4"></i> Accept
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                </div>
            `}
        </div>

        <h3 class="text-xl font-bold text-slate-400 mb-4 opacity-70">History</h3>
        <div class="bg-slate-900 border border-white/5 rounded-xl overflow-hidden opacity-70">
             <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-800 text-xs uppercase text-slate-400 border-b border-white/5">
                             <th class="p-3">User</th>
                             <th class="p-3">Status</th>
                             <th class="p-3">Details</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
                        ${historyRequests.map(req => `
                             <tr class="border-b border-white/5">
                                <td class="p-3 text-slate-300">${req.userEmail}</td>
                                <td class="p-3">
                                    <span class="px-2 py-0.5 rounded text-xs uppercase font-bold ${req.status === 'approved' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}">
                                        ${req.status}
                                    </span>
                                </td>
                                <td class="p-3 text-slate-500 text-xs font-mono">${req.bankName} - ${req.accountNumber}</td>
                             </tr>
                        `).join('')}
                    </tbody>
                </table>
             </div>
        </div>
    `;
    createIcons({ icons });
    attachListeners();
};

const attachListeners = () => {
    document.querySelectorAll('[data-approve]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const el = e.currentTarget as HTMLElement;
            const reqId = el.getAttribute('data-approve')!;
            const userId = el.getAttribute('data-uid')!;
            
            if(confirm("Accept payment and upgrade user to PREMIUM?")) {
                el.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>`;
                try {
                    await processUpgradeRequest(reqId, userId, 'approved');
                    showToast("User upgraded successfully", "success");
                    loadData(); // Refresh
                } catch(err) {
                    showToast("Failed to process", "error");
                    loadData();
                }
            }
        });
    });

    document.querySelectorAll('[data-reject]').forEach(btn => {
         btn.addEventListener('click', async (e) => {
            const el = e.currentTarget as HTMLElement;
            const reqId = el.getAttribute('data-reject')!;
            const userId = el.getAttribute('data-uid')!;
            
            if(confirm("Reject this request?")) {
                 try {
                    await processUpgradeRequest(reqId, userId, 'rejected');
                    showToast("Request rejected", "info");
                    loadData(); // Refresh
                } catch(err) {
                    showToast("Failed to process", "error");
                }
            }
        });
    });
};

export const AdminPanel = (user: UserProfile) => {
    if (user.role !== 'admin') {
        return `<div class="p-8 text-center text-red-500 font-bold">ACCESS DENIED. ADMIN ONLY.</div>`;
    }

    // Trigger load data immediately
    setTimeout(loadData, 0);

    return `
        <div class="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4">
             <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-bold text-white">Admin Dashboard</h2>
                    <p class="text-purple-300">Manage AltoGen Studio Users</p>
                </div>
                <button onclick="updateState({currentMode:'PROFILE'})" class="px-4 py-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                    Back to Profile
                </button>
            </div>
            
            <div id="admin-content">
                <!-- Content injected via JS -->
            </div>
        </div>
    `;
};

export const adminListeners = () => {
    // Listeners are attached inside renderContent to handle dynamic elements
};
