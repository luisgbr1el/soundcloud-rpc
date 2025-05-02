import { BrowserView, BrowserWindow } from 'electron';
import type ElectronStore = require('electron-store');
import { TranslationService } from '../services/translationService';

export class SettingsManager {
    private view: BrowserView;
    private isVisible = false;
    private parentWindow: BrowserWindow;
    private store: ElectronStore;
    private translationService: TranslationService;

    constructor(parentWindow: BrowserWindow, store: ElectronStore, translationService: TranslationService) {
        this.parentWindow = parentWindow;
        this.store = store;
        this.view = new BrowserView({
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
        });
        this.translationService = translationService;

        // Add view immediately but keep it off-screen
        this.parentWindow.addBrowserView(this.view);
        this.view.setBounds({ x: 0, y: -10000, width: 0, height: 0 });

        // Add resize listener
        this.parentWindow.on('resize', () => {
            if (this.isVisible) {
                this.updateBounds();
            }
        });

        // Preload content
        this.view.webContents.loadURL(`data:text/html,${encodeURIComponent(this.getHtml())}`);

        // Listen for hide message from the panel
        this.view.webContents.on('console-message', (_, __, message) => {
            if (message === 'hidePanel') {
                this.isVisible = false;
                this.view.setBounds({ x: 0, y: -10000, width: 0, height: 0 });
            }
        });
    }

    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    private updateBounds(): void {
        const bounds = this.parentWindow.getBounds();
        const width = Math.min(500, Math.floor(bounds.width * 0.4)); // 40% of window width, max 500px
        const HEADER_HEIGHT = 32; // Height of the window controls

        this.view.setBounds({
            x: bounds.width - width,
            y: HEADER_HEIGHT,
            width,
            height: bounds.height - HEADER_HEIGHT,
        });
    }

    private getHtml(): string {
        const theme = this.store.get('theme', 'dark');
        return `
        <meta charset="UTF-8">
        <style>
            @font-face {
                font-family: 'SC-Font';
                src: url('https://assets.web.soundcloud.cloud/_next/static/media/a34f9d1faa5f3315-s.p.woff2') format('woff2');
                font-weight: bold;
                font-style: normal;
                font-display: swap;
            }
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'SC-Font', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                -webkit-font-smoothing: antialiased;
            }
            body {
                background-color: rgba(var(--bg-primary-rgb), 0.1);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                color: var(--text-primary);
                padding: 20px;
                padding-right: 28px;
                overflow-y: scroll !important;
                letter-spacing: 0.01em;
                position: relative;
                opacity: 0;
                transform: translateX(20px);
                transition: 
                    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                will-change: transform, opacity;
            }
            body.visible {
                opacity: 1;
                transform: translateX(0);
            }
            body.is-scrollable {
                padding-right: 20px; /* Reduce padding when scroll is visible */
            }
            ::-webkit-scrollbar {
                -webkit-appearance: none;
                width: 8px;
                height: 8px;
                background-color: var(--scrollbar-bg);
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            ::-webkit-scrollbar-track {
                background-color: transparent;
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            ::-webkit-scrollbar-thumb {
                background-color: var(--scrollbar-thumb);
                border-radius: 4px;
                transition: background-color 0.3s;
                min-height: 40px;
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            ::-webkit-scrollbar-thumb:hover {
                background-color: var(--scrollbar-thumb-hover);
            }
            
            ::-webkit-scrollbar-corner {
                background-color: transparent;
            }
            ::-webkit-scrollbar-button {
                display: none;
            }
            .close-btn {
                position: absolute;
                top: 5px;
                right: 28px; /* Default position when scroll is not visible */
                width: 32px;
                height: 32px;
                border-radius: 4px;
                border: none;
                background: transparent;
                color: var(--text-primary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }
            body.is-scrollable .close-btn {
                right: 20px; /* Adjust position when scroll is visible */
            }
            .close-btn:hover {
                background-color: var(--bg-hover);
            }
            .close-btn svg {
                width: 16px;
                height: 16px;
                fill: currentColor;
            }
            :root {
                --bg-primary: #303030;
                --bg-primary-rgb: 48, 48, 48;
                --bg-secondary: rgba(43, 43, 43, 0.7);
                --bg-hover: rgba(64, 64, 64, 0.8);
                --text-primary: #ffffff;
                --text-secondary: rgba(255, 255, 255, 0.7);
                --accent: rgba(255, 255, 255, 0.9);
                --accent-hover: #ffffff;
                --accent-muted: rgba(255, 255, 255, 0.6);
                --link-color: #5bb7ff;
                --link-hover: #7cc5ff;
                --border: rgba(255, 255, 255, 0.1);
                --scrollbar-bg: rgba(255, 255, 255, 0.05);
                --scrollbar-thumb: rgba(255, 255, 255, 0.2);
                --scrollbar-thumb-hover: rgba(255, 255, 255, 0.3);
            }
            html.theme-light {
                --bg-primary: #ffffff;
                --bg-primary-rgb: 255, 255, 255;
                --bg-secondary: rgba(245, 245, 245, 0.7);
                --bg-hover: rgba(234, 234, 234, 0.8);
                --text-primary: #333333;
                --text-secondary: rgba(0, 0, 0, 0.7);
                --accent: rgba(0, 0, 0, 0.9);
                --accent-hover: #000000;
                --accent-muted: rgba(0, 0, 0, 0.6);
                --link-color: #0088ff;
                --link-hover: #0066cc;
                --border: rgba(0, 0, 0, 0.1);
                --scrollbar-bg: rgba(0, 0, 0, 0.05);
                --scrollbar-thumb: rgba(0, 0, 0, 0.2);
                --scrollbar-thumb-hover: rgba(0, 0, 0, 0.3);
            }
            .settings-panel {
                padding-top: 32px;
                max-width: 100%;
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .setting-group {
                background: var(--bg-secondary);
                border-radius: 8px;
                padding: 15px;
                transition: background 0.2s;
            }
            .setting-group:hover {
                background: var(--bg-hover);
            }
            h2 {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            h2 svg {
                width: 18px;
                height: 18px;
                fill: var(--text-primary);
            }
            .setting-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 5px 0;
            }
            .setting-item span {
                color: var(--text-primary);
                font-size: 14px;
            }
            .description {
                font-size: 12px;
                color: var(--text-secondary);
                margin-top: 10px;
            }
            .input-group {
                display: flex;
                flex-direction: column;
                margin-top: 10px;
            }
            .input-group .textInput {
                margin-bottom: 10px;
            }
            .input-group .textInput:last-child {
                margin-bottom: 0;
            }
            .toggle {
                position: relative;
                width: 44px;
                height: 24px;
                flex-shrink: 0;
            }
            .toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .slider {
                position: absolute;
                cursor: pointer;
                inset: 0;
                background: var(--bg-primary);
                border: 1px solid var(--border);
                transition: .2s;
                border-radius: 24px;
            }
            .slider:before {
                content: "";
                position: absolute;
                height: 18px;
                width: 18px;
                left: 2px;
                bottom: 2px;
                background: var(--text-secondary);
                transition: .2s;
                border-radius: 50%;
            }
            input:checked + .slider {
                background: var(--accent);
                border-color: var(--accent);
            }
            input:checked + .slider:before {
                transform: translateX(20px);
                background: var(--bg-primary);
            }
            .textInput {
                width: 100%;
                padding: 10px 12px;
                background: var(--bg-primary);
                border: 1px solid var(--border);
                border-radius: 4px;
                color: var(--text-primary);
                font-size: 14px;
                transition: border-color 0.2s;
            }
            .textInput:focus {
                outline: none;
                border-color: var(--accent-muted);
            }
            .button {
                width: 100%;
                padding: 12px;
                background: var(--accent);
                color: var(--bg-primary);
                border: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
            }
            .button:hover {
                background: var(--accent-hover);
            }
            .link {
                color: var(--accent-muted);
                text-decoration: none;
                font-size: 12px;
            }
            .link:hover {
                color: var(--accent);
                text-decoration: none;
            }
            #createLastFmApiKey {
                color: var(--link-color);
            }
            #createLastFmApiKey:hover {
                color: var(--link-hover);
            }
            /* Hide scrollbar for Chrome, Safari and Opera */
            body::-webkit-scrollbar {
                width: 8px;
            }
            
            /* Enable overlay scrollbar */
            @media screen and (min-width: 0\0) {
                body {
                    overflow-y: auto;
                }
            }
        </style>
        <button class="close-btn" id="close-settings" title="Close settings">
            <svg viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
        <div class="settings-panel">
            <div class="setting-group">
                <h2 data-i18n-key="client">Client</h2>
                <div class="setting-item">
                    <span data-i18n-key="darkMode">Dark Mode</span>
                    <label class="toggle">
                        <input type="checkbox" id="darkMode" ${theme !== 'light' ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <span data-i18n-key="language">Language</span>
                    <label class="select">
                        <select id="languageSelect" class="textInput" style="outline: none;">
                            <option value="en" ${this.store.get('language') === 'en' ? 'selected' : ''}>English (US)</option>
                            <option value="es" ${this.store.get('language') === 'es' ? 'selected' : ''}>Español</option>
                            <option value="pt-BR" ${this.store.get('language') === 'pt-BR' ? 'selected' : ''}>Português</option>
                        </select>
                    </label>
                </div>
            </div>

            <div class="setting-group">
                <h2 data-i18n-key="adBlocker">AdBlocker</h2>
                <div class="setting-item">
                    <span data-i18n-key="enableAdBlocker">Enable AdBlocker</span>
                    <label class="toggle">
                        <input type="checkbox" id="adBlocker" ${this.store.get('adBlocker') ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="description" data-i18n-key="changesAppRestart">Changes require app restart</div>
            </div>

            <div class="setting-group">
                <h2 data-i18n-key="proxy">Proxy</h2>
                <div class="setting-item">
                    <span data-i18n-key="enableProxy">Enable Proxy</span>
                    <label class="toggle">
                        <input type="checkbox" id="proxyEnabled" ${this.store.get('proxyEnabled') ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="input-group" id="proxyFields" style="display: ${
                    this.store.get('proxyEnabled') ? 'block' : 'none'
                }">
                    <input type="text" class="textInput" id="proxyHost" data-i18n-key="proxyHost" data-i18n-placeholder="proxyHost" placeholder="Proxy Host" value="${
                        this.store.get('proxyHost') || ''
                    }">
                    <input type="text" class="textInput" id="proxyPort" data-i18n-key="proxyPort" data-i18n-placeholder="proxyPort" placeholder="Proxy Port" value="${
                        this.store.get('proxyPort') || ''
                    }">
                </div>
            </div>

            <div class="setting-group">
                <h2>
                    Last.fm
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M10.599 17.211l-.881-2.393s-1.433 1.596-3.579 1.596c-1.9 0-3.249-1.652-3.249-4.296 0-3.385 1.708-4.596 3.388-4.596 2.418 0 3.184 1.568 3.845 3.578l.871 2.751c.87 2.672 2.508 4.818 7.238 4.818 3.386 0 5.673-1.037 5.673-3.77 0-2.209-1.258-3.358-3.595-3.906l-1.738-.381c-1.193-.274-1.546-.763-1.546-1.59 0-.934.736-1.485 1.937-1.485 1.313 0 2.024.488 2.14 1.652l2.745-.33c-.225-2.511-1.937-3.541-4.745-3.541-2.479 0-4.897.934-4.897 3.947 0 1.877.902 3.063 3.172 3.608l1.871.439c1.402.332 1.866.916 1.866 1.713 0 1.021-.992 1.441-2.869 1.441-2.779 0-3.936-1.457-4.596-3.469l-.901-2.75c-1.156-3.574-3.004-4.896-6.669-4.896C2.147 5.297 0 7.802 0 12.244c0 4.325 2.208 6.638 6.169 6.638 3.193 0 4.43-1.671 4.43-1.671z"/>
                    </svg>
                </h2>
                <div class="setting-item">
                    <span data-i18n-key="enableLastFm">Enable scrobbling</span>
                    <label class="toggle">
                        <input type="checkbox" id="lastFmEnabled" ${this.store.get('lastFmEnabled') ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="input-group" id="lastFmFields" style="display: ${
                    this.store.get('lastFmEnabled') ? 'block' : 'none'
                }">
                    <input type="text" class="textInput" id="lastFmApiKey" data-i18n-key="lastFmApiKey" data-i18n-placeholder="lastFmApiKey" placeholder="Last.fm API Key" value="${
                        this.store.get('lastFmApiKey') || ''
                    }">
                    <input type="password" class="textInput" id="lastFmSecret" data-i18n-key="lastFmApiSecret" data-i18n-placeholder="lastFmApiSecret" placeholder="Last.fm API Secret" value="${
                        this.store.get('lastFmSecret') || ''
                    }">
                </div>
                <div class="description">
                    <a href="#" id="createLastFmApiKey" class="link" data-i18n-key="createApiKeyLastFm">Create API Key</a>
                    - <span data-i18n-key="noCallbackUrl">No callback URL needed</span>
                </div>
            </div>

            <div class="setting-group">
                <h2>
                    Discord
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                         <path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249a18.707 18.707 0 0 0-5.487 0 12.505 12.505 0 0 0-.617-1.249.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.369a.07.07 0 0 0-.032.027C.533 9.045-.32 13.579.099 18.057a.082.082 0 0 0 .031.056 19.911 19.911 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.464-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.105 13.184 13.184 0 0 1-1.872-.9.077.077 0 0 1-.008-.128c.126-.094.252-.192.373-.291a.075.075 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.122.099.247.197.374.291a.077.077 0 0 1-.006.128 12.509 12.509 0 0 1-1.873.899.076.076 0 0 0-.04.106c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.028 19.876 19.876 0 0 0 6.002-3.03.077.077 0 0 0 .031-.056c.5-5.177-.838-9.665-3.546-13.661a.067.067 0 0 0-.033-.027zM8.02 15.331c-1.182 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.213 0 2.187 1.096 2.156 2.419 0 1.333-.955 2.418-2.156 2.418zm7.974 0c-1.182 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.213 0 2.187 1.096 2.156 2.419 0 1.333-.943 2.418-2.156 2.418z"/>
                    </svg>
                </h2>
                <div class="setting-item">
                    <span data-i18n-key="enableRichPresence">Enable Rich Presence</span>
                    <label class="toggle">
                        <input type="checkbox" id="discordRichPresence" ${
                            this.store.get('discordRichPresence') ? 'checked' : ''
                        }>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <span data-i18n-key="displayWhenPaused">Display when paused</span>
                    <label class="toggle">
                        <input type="checkbox" id="displayWhenIdling" ${
                            this.store.get('displayWhenIdling') ? 'checked' : ''
                        }>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <span data-i18n-key="displaySmallIcon">Display small icon</span>
                    <label class="toggle">
                        <input type="checkbox" id="displaySCSmallIcon" ${
                            this.store.get('displaySCSmallIcon') ? 'checked' : ''
                        }>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <span data-i18n-key="displayButtons">Display buttons</span>
                    <label class="toggle">
                        <input type="checkbox" id="displayButtons" ${
                            this.store.get('displayButtons') ? 'checked' : ''
                        }>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>

            <div class="setting-group">
                <button class="button" id="applyChanges" data-i18n-key="applyChanges">Apply Changes</button>
            </div>
        </div>
        <script>
            ${this.getJavaScript()}
        </script>
        <script>
            // Animation handling
            document.addEventListener('DOMContentLoaded', () => {
                // Ensure initial state is set
                document.body.classList.remove('visible');
            });

            // Handle close button animation
            document.getElementById('close-settings').addEventListener('click', (e) => {
                e.preventDefault();
                document.body.classList.remove('visible');
                setTimeout(() => {
                    ipcRenderer.send('toggle-settings');
                }, 300);
            });

            // Listen for messages
            window.addEventListener('message', (event) => {
                if (event.data === 'hidePanel') {
                    console.log('hidePanel');
                }
            });

            // Listen for language changes
            document.getElementById('languageSelect').addEventListener('change', (e) => {
                let newLanguage = e.target.value;
                ipcRenderer.send('setting-changed', { key: 'language', value: newLanguage });
                
                setTimeout(() => {
                    ipcRenderer.send('language-changed', newLanguage);
                    
                    ipcRenderer.send('change-soundcloud-language', newLanguage.replace(/-/g, '_'));
                }, 100);
            });
        </script>`;
    }

    private getJavaScript(): string {
        return `
            const { ipcRenderer, shell } = require('electron');

            // Toggle visibility of Proxy fields
            document.getElementById('proxyEnabled').addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                document.getElementById('proxyFields').style.display = isEnabled ? 'block' : 'none';
                ipcRenderer.send('setting-changed', { key: 'proxyEnabled', value: isEnabled });
            });

            // Handle proxy host and port changes
            document.getElementById('proxyHost').addEventListener('change', (e) => {
                ipcRenderer.send('setting-changed', { key: 'proxyHost', value: e.target.value });
            });

            document.getElementById('proxyPort').addEventListener('change', (e) => {
                ipcRenderer.send('setting-changed', { key: 'proxyPort', value: e.target.value });
            });

            // Toggle visibility of Last.fm fields
            document.getElementById('lastFmEnabled').addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                document.getElementById('lastFmFields').style.display = isEnabled ? 'block' : 'none';
                ipcRenderer.send('setting-changed', { key: 'lastFmEnabled', value: isEnabled });
            });

            // Handle Last.fm API key and secret changes
            document.getElementById('lastFmApiKey').addEventListener('change', (e) => {
                ipcRenderer.send('setting-changed', { key: 'lastFmApiKey', value: e.target.value });
            });

            document.getElementById('lastFmSecret').addEventListener('change', (e) => {
                ipcRenderer.send('setting-changed', { key: 'lastFmSecret', value: e.target.value });
            });

            // Open Last.fm API key creation link in the user's default browser
            document.getElementById('createLastFmApiKey').addEventListener('click', (e) => {
                e.preventDefault();
                shell.openExternal('https://www.last.fm/api/account/create');
            });

            // Basic settings
            document.getElementById('darkMode').addEventListener('change', (e) => {
                const isDark = e.target.checked;
                ipcRenderer.send('setting-changed', { key: 'theme', value: isDark ? 'dark' : 'light' });
                document.documentElement.classList.toggle('theme-light', !isDark);
                document.documentElement.classList.toggle('theme-dark', isDark);
            });

            document.getElementById('displayWhenIdling').addEventListener('change', (e) => {
                ipcRenderer.send('setting-changed', { key: 'displayWhenIdling', value: e.target.checked });
            });

            document.getElementById('displaySCSmallIcon').addEventListener('change', (e) => {
                ipcRenderer.send('setting-changed', { key: 'displaySCSmallIcon', value: e.target.checked });
            });

            document.getElementById('adBlocker').addEventListener('change', (e) => {
                ipcRenderer.send('setting-changed', { key: 'adBlocker', value: e.target.checked });
            });

            // Discord settings
            document.getElementById('discordRichPresence').addEventListener('change', (e) => {
                ipcRenderer.send('setting-changed', { key: 'discordRichPresence', value: e.target.checked });
            });

            document.getElementById('displayButtons').addEventListener('change', (e) => {
                ipcRenderer.send('setting-changed', { key: 'displayButtons', value: e.target.checked });
            });

            // Apply all changes
            document.getElementById('applyChanges').addEventListener('click', () => {
                ipcRenderer.send('apply-changes');
            });

            // Listen for theme changes from main process
            ipcRenderer.on('theme-changed', (_, isDark) => {
                document.getElementById('darkMode').checked = isDark;
                document.documentElement.classList.toggle('theme-light', !isDark);
            });

            // Request translations from the main process
            ipcRenderer.on('update-translations', () => {
                ipcRenderer.invoke('get-translations').then((translations) => {
                    document.querySelectorAll('[data-i18n-key]').forEach(element => {
                        const key = element.getAttribute('data-i18n-key');
                        if (translations[key]) {
                            element.textContent = translations[key];
                        }
                    });
                    
                    document.querySelectorAll('input[placeholder]').forEach(input => {
                        const key = input.getAttribute('data-i18n-placeholder');
                        if (key && translations[key]) {
                            input.placeholder = translations[key];
                        }
                    });
                    
                    const lastFmDesc = document.querySelector('.setting-group:nth-child(4) .description');
                    if (lastFmDesc && translations.createApiKeyLastFm && translations.noCallbackUrl) {
                        lastFmDesc.innerHTML = '<a href="#" id="createLastFmApiKey" class="link">' + translations.createApiKeyLastFm + '</a> - <span>' + translations.noCallbackUrl + '</span>';
                        
                        document.getElementById('createLastFmApiKey').addEventListener('click', (e) => {
                            e.preventDefault();
                            shell.openExternal('https://www.last.fm/api/account/create');
                        });
                    }
                });
            });
        `;
    }

    private show(): void {
        this.isVisible = true;
        this.updateBounds();
        this.view.webContents.executeJavaScript(`
            // Force a reflow to ensure animation works
            document.body.style.opacity;
            document.body.classList.add('visible');
        `);
    }

    private hide(): void {
        this.view.webContents.executeJavaScript(`
            document.body.classList.remove('visible');
            setTimeout(() => {
                window.postMessage('hidePanel', '*');
            }, 300);
        `);
    }

    public getView(): BrowserView {
        if (!this.view) {
            throw new Error('Settings view is not initialized');
        }
        return this.view;
    }

    public updateTranslations(translationService: TranslationService): void {
        this.translationService = translationService;
        this.getView().webContents.send('update-translations');
    }
}
