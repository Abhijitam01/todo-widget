"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
let mainWindow = null;
const createWindow = () => {
    // Get the primary display's work area
    const primaryDisplay = electron_1.screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    // Create the browser window with modern styling
    mainWindow = new electron_1.BrowserWindow({
        width: 380,
        height: 600,
        minWidth: 320,
        minHeight: 400,
        x: screenWidth - 400, // Position near right edge
        y: 100, // Some padding from top
        frame: false, // Remove default window frame
        transparent: true, // Enable transparency
        alwaysOnTop: false, // Allow other apps to cover it
        skipTaskbar: false, // Show in taskbar
        resizable: true,
        webPreferences: {
            nodeIntegration: false, // Security best practice
            contextIsolation: true, // Security best practice
            preload: path.join(__dirname, 'preload.js'),
            backgroundThrottling: false, // Keep animations smooth
        },
        show: false, // Don't show until ready-to-show
        titleBarStyle: 'hidden',
        vibrancy: 'under-window', // macOS vibrancy effect
        visualEffectState: 'active',
    });
    // Load the renderer HTML
    mainWindow.loadFile(path.join(__dirname, '../src/renderer/index.html'));
    // Gracefully show when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        if (mainWindow) {
            mainWindow.show();
            // Show as a normal window that can be covered by other apps
            mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        }
    });
    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Security: Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    // Handle window minimize
    mainWindow.on('minimize', () => {
        if (mainWindow) {
            mainWindow.setSkipTaskbar(true);
        }
    });
    mainWindow.on('restore', () => {
        if (mainWindow) {
            mainWindow.setSkipTaskbar(false);
        }
    });
};
// App event handlers
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    // On macOS, it's common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC handlers for window management
electron_1.ipcMain.handle('window-minimize', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});
electron_1.ipcMain.handle('window-close', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});
electron_1.ipcMain.handle('window-toggle-always-on-top', () => {
    if (mainWindow) {
        const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
        mainWindow.setAlwaysOnTop(!isAlwaysOnTop, 'floating');
        return !isAlwaysOnTop;
    }
    return false;
});
// Handle app updates and other lifecycle events
electron_1.app.setAppUserModelId('com.errika.modern-todo');
// Prevent multiple instances
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        // Someone tried to run a second instance, focus our window instead
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
    });
}
//# sourceMappingURL=main.js.map