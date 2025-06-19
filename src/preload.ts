import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowToggleAlwaysOnTop: () => ipcRenderer.invoke('window-toggle-always-on-top'),

  // Platform detection
  platform: process.platform,
});

// Define the interface for TypeScript
declare global {
  interface Window {
    electronAPI: {
      windowMinimize: () => Promise<void>;
      windowClose: () => Promise<void>;
      windowToggleAlwaysOnTop: () => Promise<boolean>;
      platform: string;
    };
  }
} 