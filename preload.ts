import { contextBridge , ipcRenderer } from "electron";

contextBridge.exposeInMainWorld('electronAPI' , {
    windowMinimize : () => ipcRenderer.invoke('window-minimize'),
    windowClose : () => ipcRenderer.invoke('window-close'),
    windowToggleAlwaysOnTop : () => ipcRenderer.invoke('window-toggle-always-on-top'),
    platform : process.platform ,
})

declare global {
    interface Window {
        electronAPI : {
            windowMinimize : () => Promise<void>;
            windowClose : () => Promise<void>;
            windowtoggleAlwaysOnTop : () => Promise<boolean>;
            platform : string ;
        }
    }
}