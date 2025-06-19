import { app, BrowserWindow, shell, ipcMain, screen } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  // Get the primary display's work area
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Create the browser window with modern styling
  mainWindow = new BrowserWindow({
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
    shell.openExternal(url);
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
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, it's common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for window management
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('window-toggle-always-on-top', () => {
  if (mainWindow) {
    const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(!isAlwaysOnTop, 'floating');
    return !isAlwaysOnTop;
  }
  return false;
});

// Handle app updates and other lifecycle events
app.setAppUserModelId('com.errika.modern-todo');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
} 