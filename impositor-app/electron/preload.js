/**
 * Preload de Electron.
 * Expone una API segura al proceso renderer mediante contextBridge.
 */
import { contextBridge, ipcRenderer, shell } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url) => shell.openExternal(url),
  requestOpenExternal: (url) => ipcRenderer.send('open-external', url),
  isElectron: true,
})
