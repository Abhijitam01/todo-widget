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
export {};
//# sourceMappingURL=preload.d.ts.map