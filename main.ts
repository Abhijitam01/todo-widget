import { app , shell , ipcMain , screen, BrowserWindow } from 'electron' ;
import * as path from 'path' ;

let mainWindow: BrowserWindow | null = null ;

const createWindow = () : void => {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width : screenWidth , height : screenHeight} = primaryDisplay.workAreaSize ;

    mainWindow = new BrowserWindow ({
        width :380 ,
        height : 600 ,
        minWidth:320,
        minHeight : 400 ,
        x : screenWidth - 400 ,
        y:100 ,
        frame : false,
        transparent : true ,
        alwaysOnTop : false ,
        skipTaskbar : false ,
        resizable : true ,
        webPreferences : {
            nodeIntegration : false ,
            contextIsolation : true ,
            preload : path.join(__dirname , 'preload.js'),
            backgroundThrottling : false 
        },
        show : false ,
        titleBarStyle : 'hidden',
        vibrancy : 'under-window',
        visualEffectState : 'active'
    })

    //renderer html
    mainWindow.loadFile(path.join(__dirname , '../src/renderer/index.html'));

    mainWindow.once('ready-to-show' , () => {
        if(mainWindow) {
            mainWindow.show();
            mainWindow.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen : true});
        }
    })
    // window close
    mainWindow.on('closed' , () => {
        mainWindow : null ;
    })

    mainWindow.webContents.setWindowOpenHandler(({url}) => {
        shell.openExternal(url);
        return { action : 'deny'}
    })
    
    app.whenReady().then(createWindow);

    app.on('window-all-closed' , () => {
        if( process.platform !== 'darwin'){
            app.quit();
        }
    })

    app.on('activate' , ()=> {
        if (BrowserWindow.getAllWindows().length == 0){
            createWindow();
        }
    })

    ipcMain.handle('window-minimize' , () => {
        if(mainWindow) mainWindow.minimize();
    });

    ipcMain.handle('window-close', () => {
        if ( mainWindow) mainWindow.close();
    })

    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock){
        app.quit();
    } else {
        app.on('second-instance' , () => {
            if(mainWindow){
                if(mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
            }
        })
    }
}
