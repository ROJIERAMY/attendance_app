const { app, BrowserWindow } = require('electron');
const path = require('path');

function resolveEntryFile() {
  const argFromCli = process.argv.find(arg => arg.startsWith('--entry='));
  if (argFromCli) {
    return argFromCli.split('=')[1];
  }

  if (process.env.ATTENDANCE_ENTRY) {
    return process.env.ATTENDANCE_ENTRY;
  }

  return 'attendance-offline.html';
}

function createWindow() {
  const entryFile = resolveEntryFile();

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'icon.ico'),
    title: 'نظام الحضور والغياب'
  });

  const resolvedPath = path.join(__dirname, entryFile);
  win.loadFile(resolvedPath);
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
