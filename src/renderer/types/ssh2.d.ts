declare module 'ssh2' {
  import { EventEmitter } from 'events';
  
  export class Client extends EventEmitter {
    connect(config: ConnectConfig): void;
    exec(command: string, callback: (err: Error | undefined, stream: ClientChannel) => void): void;
    sftp(callback: (err: Error | undefined, sftp: SFTPWrapper) => void): void;
    end(): void;
  }

  export interface ConnectConfig {
    host: string;
    port?: number;
    username: string;
    password?: string;
    privateKey?: string | Buffer;
    passphrase?: string;
    readyTimeout?: number;
    keepaliveInterval?: number;
    keepaliveCountMax?: number;
    hostVerifier?: (keyHash: string) => boolean;
    hostHash?: string;
    hostKeys?: string[];
    forceIPv4?: boolean;
    forceIPv6?: boolean;
  }

  export interface ConnectionConfig extends ConnectConfig {}

  export interface ClientChannel extends EventEmitter {
    stdin: NodeJS.WritableStream;
    stdout: NodeJS.ReadableStream;
    stderr: NodeJS.ReadableStream;
    exit: NodeJS.ReadableStream;
    close: NodeJS.ReadableStream;
    signal(signal: string): boolean;
    end(): void;
  }

  export interface SFTPWrapper extends EventEmitter {
    createReadStream(path: string, options?: any): NodeJS.ReadableStream;
    createWriteStream(path: string, options?: any): NodeJS.WritableStream;
    open(filename: string, flags: string, attrs: any, callback: (err: Error | undefined, handle: Buffer) => void): void;
    close(handle: Buffer, callback: (err: Error | undefined) => void): void;
    readdir(path: string, callback: (err: Error | undefined, list: ReadDirItem[]) => void): void;
    mkdir(path: string, attrs: any | null, callback: (err: Error | undefined) => void): void;
    rmdir(path: string, callback: (err: Error | undefined) => void): void;
    stat(path: string, callback: (err: Error | undefined, stats: Stats) => void): void;
    lstat(path: string, callback: (err: Error | undefined, stats: Stats) => void): void;
    unlink(path: string, callback: (err: Error | undefined) => void): void;
    rename(oldPath: string, newPath: string, callback: (err: Error | undefined) => void): void;
    readFile(path: string, options: any, callback: (err: Error | undefined, data: Buffer) => void): void;
    writeFile(path: string, data: string | Buffer, options: any, callback: (err: Error | undefined) => void): void;
    end(): void;
  }

  export interface ReadDirItem {
    filename: string;
    longname: string;
    attrs: Stats;
  }

  export interface Stats {
    mode: number;
    uid: number;
    gid: number;
    size: number;
    atime: number;
    mtime: number;
    isDirectory(): boolean;
    isFile(): boolean;
    isSymbolicLink(): boolean;
  }
} 