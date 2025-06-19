"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    windowMinimize: () => electron_1.ipcRenderer.invoke('window-minimize'),
    windowClose: () => electron_1.ipcRenderer.invoke('window-close'),
    windowToggleAlwaysOnTop: () => electron_1.ipcRenderer.invoke('window-toggle-always-on-top'),
    // Platform detection
    platform: process.platform,
});
//# sourceMappingURL=preload.js.map