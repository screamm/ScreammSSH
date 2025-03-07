import { TranslationObject } from "./index";

const en: TranslationObject = {
  common: {
    welcome: "Welcome to ScreammSSH",
    connect: "Connect",
    disconnect: "Disconnect",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    settings: "Settings",
    close: "Close",
    search: "Search",
    loading: "Loading...",
    error: "An error occurred",
    success: "Action successful",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
  },
  connection: {
    newConnection: "New Connection",
    savedConnections: "Saved Connections",
    noConnections: "No saved connections",
    connectionName: "Connection Name",
    host: "Host",
    port: "Port",
    username: "Username",
    password: "Password",
    privateKey: "Private Key",
    usePrivateKey: "Use Private Key",
    saveConnection: "Save Connection",
    connecting: "Connecting...",
    connected: "Connected",
    disconnected: "Disconnected",
    connectionFailed: "Connection failed",
    connectionSuccess: "Connection successful",
    confirmDisconnect: "Are you sure you want to disconnect?",
    confirmDelete: "Are you sure you want to delete this connection?",
  },
  terminal: {
    newTab: "New Tab",
    terminal: "Terminal",
    files: "Files",
    clearTerminal: "Clear Terminal",
    commandHistory: "Command History",
    noHistory: "No command history",
    enterCommand: "Enter command...",
    executingCommand: "Executing command...",
    commandNotFound: "Command not found",
    permissionDenied: "Permission denied",
  },
  fileExplorer: {
    currentPath: "Current Path",
    parentDirectory: "Parent Directory",
    name: "Name",
    size: "Size",
    type: "Type",
    lastModified: "Last Modified",
    permissions: "Permissions",
    directory: "Directory",
    file: "File",
    symlink: "Symbolic Link",
    download: "Download",
    upload: "Upload",
    newFolder: "New Folder",
    delete: "Delete",
    rename: "Rename",
    edit: "Edit",
    refresh: "Refresh",
    noFiles: "No files",
    loadingFiles: "Loading files...",
    uploadingFile: "Uploading file...",
    downloadingFile: "Downloading file...",
    confirmDelete: "Are you sure you want to delete this?",
    createFolder: "Create Folder",
    folderName: "Folder Name",
    enterFolderName: "Enter folder name",
  },
  settings: {
    appearance: "Appearance",
    theme: "Theme",
    language: "Language",
    terminalSettings: "Terminal Settings",
    fontFamily: "Font Family",
    fontSize: "Font Size",
    defaultTheme: "Default",
    nostromoTheme: "Nostromo (Red)",
    classicGreenTheme: "Classic Terminal (Green)",
    htopTheme: "Htop (Purple)",
    cyanSshTheme: "Cyan SSH",
    retroEffect: "Retro terminal effect",
    cursorBlink: "Show cursor blinking",
    swedish: "Svenska",
    english: "English",
    finnish: "Suomi",
    norwegian: "Norsk",
    danish: "Dansk",
  },
  errors: {
    connectionFailed: "Could not connect to the server",
    authFailed: "Authentication failed",
    networkError: "Network error",
    commandFailed: "Command failed",
    fileNotFound: "File not found",
    permissionDenied: "Permission denied",
    unknownError: "An unknown error occurred",
  }
};

export default en; 