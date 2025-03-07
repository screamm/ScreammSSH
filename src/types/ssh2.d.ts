declare module 'ssh2' {
  class Client extends NodeJS.EventEmitter {
    constructor();
    connect(config: ConnectConfig): void;
    end(): void;
    exec(command: string, callback: (err: Error, channel: Channel) => void): void;
    sftp(callback: (err: Error, sftp: SFTPWrapper) => void): void;
  }

  interface ConnectConfig {
    host: string;
    port?: number;
    username: string;
    password?: string;
    privateKey?: Buffer | string;
    readyTimeout?: number;
    hostHash?: string;
    hostVerifier?: (keyHash: string) => boolean;
    debug?: (message: string) => void;
  }

  interface Channel extends NodeJS.EventEmitter {
    on(event: 'data', listener: (data: Buffer) => void): this;
    on(event: 'close', listener: (code: number) => void): this;
    stderr: {
      on(event: 'data', listener: (data: Buffer) => void): this;
    }
  }

  interface SFTPWrapper extends NodeJS.EventEmitter {
    readdir(path: string, callback: (err: Error, list: ReadDirItem[]) => void): void;
    readFile(path: string, options: string | { encoding: string }, callback: (err: Error, data: Buffer | string) => void): void;
    writeFile(path: string, data: Buffer | string, callback: (err: Error) => void): void;
    unlink(path: string, callback: (err: Error) => void): void;
    mkdir(path: string, callback: (err: Error) => void): void;
    rmdir(path: string, callback: (err: Error) => void): void;
    rename(oldPath: string, newPath: string, callback: (err: Error) => void): void;
    stat(path: string, callback: (err: Error, stats: Stats) => void): void;
    fastGet(remotePath: string, localPath: string, callback: (err: Error) => void): void;
    fastPut(localPath: string, remotePath: string, callback: (err: Error) => void): void;
  }

  interface ReadDirItem {
    filename: string;
    longname: string;
    attrs: Stats;
  }

  interface Stats {
    mode: number;
    uid: number;
    gid: number;
    size: number;
    atime: number;
    mtime: number;
  }

  interface SFTPError extends Error {
    code: string;
    message: string;
    language?: string;
  }

  // Utöka Error med SFTP-relaterade felegenskaper
  interface Error {
    code?: string;
    language?: string;
  }

  export { Client, ConnectConfig, Channel, SFTPWrapper, ReadDirItem, Stats, SFTPError };
}

// Utöka global Error-typen
interface Error {
  code?: string;
  language?: string;
} 