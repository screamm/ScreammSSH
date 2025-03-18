interface ElectronAPI {
  // Grundläggande IPC-kommunikation
  invoke: (channel: string, data?: any) => Promise<any>;
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
  
  // Bekväma hjälpmetoder
  ping: () => Promise<string>;
  test: () => Promise<any>;
  
  // API-version
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

interface Window {
  electronAPI: ElectronAPI;
} 