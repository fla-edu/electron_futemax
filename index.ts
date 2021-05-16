import { app, BrowserWindow, session, screen } from 'electron';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';

import { ElectronBlocker, fullLists, Request } from '@cliqz/adblocker-electron';

function getUrlToLoad(): string {
  let url = 'https://futemax.gratis/';
  if (process.argv[process.argv.length - 1].endsWith('.js') === false) {
    url = process.argv[process.argv.length - 1];
  }

  return url;
}

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const frame_width =  640
  const frame_heigth = 360

  mainWindow = new BrowserWindow({
    width: frame_width,
    height: frame_heigth,
    frame: false,
    x: width - frame_width,
    y: height - frame_heigth,
    alwaysOnTop: true,
  });

  if (session.defaultSession === undefined) {
    throw new Error('defaultSession is undefined');
  }

  const blocker = await ElectronBlocker.fromLists(
    fetch,
    fullLists,
    {
      enableCompression: true,
    },
    {
      path: 'engine.bin',
      read: fs.readFile,
      write: fs.writeFile,
    },
  );

  blocker.enableBlockingInSession(session.defaultSession);

  blocker.on('request-blocked', (request: Request) => {
    console.log('blocked', request.tabId, request.url);
  });

  blocker.on('request-redirected', (request: Request) => {
    console.log('redirected', request.tabId, request.url);
  });

  blocker.on('request-whitelisted', (request: Request) => {
    console.log('whitelisted', request.tabId, request.url);
  });

  blocker.on('csp-injected', (request: Request) => {
    console.log('csp', request.url);
  });

  blocker.on('script-injected', (script: string, url: string) => {
    console.log('script', script.length, url);
  });

  blocker.on('style-injected', (style: string, url: string) => {
    console.log('style', style.length, url);
  });

  mainWindow.loadURL(getUrlToLoad());

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.allowRendererProcessReuse = false;

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});