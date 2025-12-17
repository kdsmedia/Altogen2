
import { UserProfile } from '../types';
import { updateState, showToast } from '../index';
import { submitUpgradeRequest } from '../services/firebaseService';

export const Upgrade = (user: UserProfile) => {
    return `
        <div class="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-12">
            <div class="text-center space-y-2">
                <h2 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Upgrade to Premium</h2>
                <p class="text-slate-400">Unlock unlimited AI generation, cloud storage, and priority support.</p>
            </div>

            <div class="bg-slate-900/60 backdrop-blur-xl border border-yellow-500/20 rounded-2xl overflow-hidden shadow-2xl">
                <div class="p-6 bg-gradient-to-r from-yellow-500/10 to-transparent border-b border-white/5 flex items-center gap-4">
                    <div class="p-3 bg-yellow-500/20 rounded-xl text-yellow-400">
                        <i data-lucide="crown" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-white">Lifetime Premium Access</h3>
                        <p class="text-sm text-yellow-200/70">One-time payment of IDR 50.000</p>
                    </div>
                </div>

                <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- QRIS Section -->
                    <div class="flex flex-col items-center space-y-4">
                        <div class="bg-white p-4 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
                            <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHwO_-Mp4mmE5tIQgvrs8ZzsUiKwMWROUa8XAMFdKpYGzqxAXR9ciCYRZ9LBt-i1ukxzhTVQw_mcKbCm5jzFe6vySjmowjplpTMJBwV5HVfETSH6WwqlWHY2BEn_rMJn4jXXRX5ylMRwDGPssCFolj5akwy1Ny-Y3_JHFQZK3Jdf4HzaFwuBRXqwcDVhI/s407/qris.jpg" alt="Scan QRIS" class="w-48 h-48 object-contain" onerror="this.src='https://placehold.co/200x200/white/black?text=QRIS+IMAGE+MISSING'"/>
                        </div>
                        <p class="text-xs text-slate-500 text-center">Scan QRIS via GoPay, OVO, Dana, BCA, etc.</p>
                    </div>

                    <!-- Form Section -->
                    <div class="space-y-4">
                        <h4 class="text-sm font-bold text-slate-300 uppercase tracking-wide mb-2">Confirm Payment</h4>
                        
                        <div>
                            <label class="text-xs text-slate-500 block mb-1">Bank Name / E-Wallet</label>
                            <input type="text" id="upg-bank-name" placeholder="e.g. BCA or Dana" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none transition-colors" />
                        </div>
                        
                        <div>
                            <label class="text-xs text-slate-500 block mb-1">Account Number</label>
                            <input type="text" id="upg-acc-number" placeholder="e.g. 08123..." class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none transition-colors" />
                        </div>

                        <div>
                            <label class="text-xs text-slate-500 block mb-1">Account Holder Name</label>
                            <input type="text" id="upg-acc-holder" placeholder="e.g. John Doe" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none transition-colors" />
                        </div>

                        <button id="btn-submit-upgrade" class="w-full py-3 mt-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2">
                            <span>Submit Request</span>
                            <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

export const upgradeListeners = (user: UserProfile) => {
    const btnSubmit = document.getElementById('btn-submit-upgrade');
    if (btnSubmit) {
        btnSubmit.onclick = async () => {
            const bankName = (document.getElementById('upg-bank-name') as HTMLInputElement).value;
            const accNumber = (document.getElementById('upg-acc-number') as HTMLInputElement).value;
            const accHolder = (document.getElementById('upg-acc-holder') as HTMLInputElement).value;

            if (!bankName || !accNumber || !accHolder) {
                showToast("Please fill all payment details", "error");
                return;
            }

            const original = btnSubmit.innerHTML;
            btnSubmit.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Sending...`;
            
            try {
                await submitUpgradeRequest({
                    userId: user.uid,
                    userEmail: user.email,
                    userName: user.displayName,
                    bankName,
                    accountNumber: accNumber,
                    accountHolder: accHolder
                });
                showToast("Request sent! Waiting for admin approval.", "success");
                // Navigate back to profile
                // setTimeout(() => updateState({ currentMode: 'PROFILE' }), 2000);
            } catch (e) {
                showToast("Failed to submit request", "error");
            } finally {
                btnSubmit.innerHTML = original;
            }
        };
    }
};
