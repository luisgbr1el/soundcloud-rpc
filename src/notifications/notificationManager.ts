import { BrowserView, BrowserWindow, ipcMain } from 'electron';

export class NotificationManager {
    private view: BrowserView;
    private queue: string[] = [];
    private isDisplaying = false;
    private parentWindow: BrowserWindow;

    constructor(parentWindow: BrowserWindow) {
        this.parentWindow = parentWindow;
        this.view = new BrowserView({
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                transparent: true,
            },
        });
    }

    public show(message: string): void {
        this.queue.push(message);
        if (!this.isDisplaying) {
            this.displayNext();
        }
    }

    private displayNext(): void {
        if (this.queue.length === 0) {
            this.isDisplaying = false;
            this.parentWindow.removeBrowserView(this.view);
            return;
        }

        this.isDisplaying = true;
        const message = this.queue.shift();
        const bounds = this.parentWindow.getBounds();
        const width = 400; // increased from 300
        const height = 70; // increased from 50

        this.parentWindow.addBrowserView(this.view);
        this.view.setBounds({
            x: Math.floor((bounds.width - width) / 2),
            y: bounds.height - height - 100, // increased from 20 to move it up
            width,
            height
        });

        const html = `
        <meta charset="UTF-8">
        <style>
            body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: transparent;
                color: white;
                height: 100vh;
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
                overflow: hidden;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            .notification {
                padding: 15px 25px;
                border-radius: 12px;
                font-size: 18px;
                font-weight: 600;
                text-align: center;
                transform: translateY(0);
                transition: transform 0.3s ease-in-out;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 90%;
                user-select: none;
                -webkit-user-select: none;
                background: #303030;
                backdrop-filter: blur(5px);
            }
            body.fade-out .notification {
                transform: translateY(10px);
            }
        </style>
        <body>
            <div class="notification">${message}</div>
            <script>
                setTimeout(() => document.body.style.opacity = '1', 100);
                setTimeout(() => {
                    document.body.classList.add('fade-out');
                    document.body.style.opacity = '0';
                    setTimeout(() => {
                        const { ipcRenderer } = require('electron');
                        ipcRenderer.send('notification-done');
                    }, 300);
                }, 4500);
            </script>
        </body>`;

        // Set up one-time IPC listener for this notification
        ipcMain.once('notification-done', () => {
            setTimeout(() => this.displayNext(), 100);
        });

        this.view.webContents.loadURL(`data:text/html,${encodeURIComponent(html)}`);
    }
}
