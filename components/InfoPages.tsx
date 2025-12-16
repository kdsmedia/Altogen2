import { ViewMode } from '../types';

export const InfoPages = (mode: ViewMode) => {
    let title = '';
    let icon = '';
    let color = '';
    let content = '';

    switch (mode) {
        case ViewMode.ABOUT:
            title = 'About AltoGen Studio';
            icon = 'info';
            color = 'text-cyan-400';
            content = `
                <div class="space-y-6 text-slate-300 leading-relaxed">
                    <p>
                        <strong>AltoGen Studio</strong> is a sophisticated Integrated Development Environment (IDE) designed specifically to streamline the creation, configuration, and management of Apache Cordova and Capacitor projects.
                    </p>
                    <p>
                        Our mission is to bridge the gap between web development and native mobile deployment. Whether you are wrapping an existing responsive website, bundling local assets, or cloning from a repository, AltoGen provides the tools to generate production-ready configurations instantly.
                    </p>
                    <h3 class="text-white font-bold text-lg mt-6 mb-2">Key Features</h3>
                    <ul class="list-disc pl-5 space-y-2 text-slate-400">
                        <li>Real-time Config.xml generation with AI assistance.</li>
                        <li>Automated asset resizing for Android & iOS icons.</li>
                        <li>Built-in Monaco-like file editor for www assets.</li>
                        <li>Integrated AdMob monetization configuration.</li>
                        <li>3D Device Preview for responsive testing.</li>
                    </ul>
                    <div class="mt-8 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                        <p class="text-xs text-slate-500 font-mono">Version: 2.5.0 Beta<br>Build: 2024.05.20</p>
                    </div>
                </div>
            `;
            break;
        case ViewMode.PRIVACY:
            title = 'Privacy Policy';
            icon = 'lock';
            color = 'text-green-400';
            content = `
                <div class="space-y-6 text-slate-300 leading-relaxed">
                    <p>
                        At AltoGen Studio, we take your privacy seriously. This application is designed as a client-side tool, meaning the majority of data processing happens directly within your browser.
                    </p>
                    <h3 class="text-white font-bold text-lg mt-6 mb-2">Data Handling</h3>
                    <ul class="list-disc pl-5 space-y-2 text-slate-400">
                        <li><strong>Local Processing:</strong> Your project files, assets, and source codes are processed in your browser's memory and are not uploaded to our servers unless explicitly stated for specific cloud services.</li>
                        <li><strong>AI Features:</strong> When using AI features (Gemini), only the specific prompts and context required for generation are transmitted via the API.</li>
                        <li><strong>Cookies & Storage:</strong> We use local storage to persist your session preferences. No tracking cookies are used for advertising purposes.</li>
                    </ul>
                    <h3 class="text-white font-bold text-lg mt-6 mb-2">Third Party Services</h3>
                    <p>
                        This tool may integrate with third-party services like Google Gemini for AI generation. Please refer to Google's privacy policy regarding data handling for their APIs.
                    </p>
                </div>
            `;
            break;
        case ViewMode.DISCLAIMER:
            title = 'Disclaimer';
            icon = 'shield-alert';
            color = 'text-yellow-400';
            content = `
                <div class="space-y-6 text-slate-300 leading-relaxed">
                    <div class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200">
                        <strong>Important:</strong> AltoGen Studio is an independent tool and is not affiliated with, endorsed by, or connected to Apache Cordova, Adobe PhoneGap, or Google in any official capacity.
                    </div>
                    <h3 class="text-white font-bold text-lg mt-6 mb-2">Usage Liability</h3>
                    <p>
                        The software is provided "as is", without warranty of any kind, express or implied. The developers of AltoGen Studio shall not be liable for any claim, damages, or other liability arising from the use of the software.
                    </p>
                    <p>
                        Users are responsible for ensuring their applications comply with the Apple App Store, Google Play Store, and other platform guidelines. Automated configurations should always be reviewed by a developer before production release.
                    </p>
                    <h3 class="text-white font-bold text-lg mt-6 mb-2">Trademarks</h3>
                    <p>
                        Apache Cordova, Cordova, and the Cordova logo are trademarks of the Apache Software Foundation. Android is a trademark of Google LLC. iOS is a trademark of Apple Inc.
                    </p>
                </div>
            `;
            break;
    }

    return `
        <div class="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="mb-8 border-b border-white/10 pb-6">
                <div class="flex items-center gap-3 mb-2">
                    <i data-lucide="${icon}" class="w-8 h-8 ${color}"></i>
                    <h2 class="text-3xl font-bold text-white">${title}</h2>
                </div>
            </div>
            <div class="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-white/5 shadow-inner">
                ${content}
            </div>
        </div>
    `;
};