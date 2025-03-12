import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SFTPService } from '../services/sftp-service';
import { SFTPFile } from '../electron';
import { Theme } from './ThemeSelector';
import { 
  FolderIcon, 
  FileIcon, 
  ArrowLeftIcon, 
  TrashIcon, 
  PlusIcon, 
  DownloadIcon, 
  UploadIcon, 
  EditIcon, 
  TimesIcon, 
  CheckIcon 
} from '../utils/icon-wrapper';
import { formatFileSize, formatDate } from '../utils/format-utils';
import '../styles/FileExplorer.css';

interface FileExplorerProps {
  connectionId: string;
  theme?: Theme;
  onSelectFile?: (file: SFTPFile) => void;
  onError?: (error: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ connectionId, theme = 'default', onSelectFile, onError }) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<SFTPFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SFTPFile | null>(null);
  const [sftpService, setSftpService] = useState<SFTPService | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (!connectionId) return;
    
    const initSftp = async () => {
      try {
        const service = new SFTPService(connectionId);
        await service.connect();
        setSftpService(service);
        
        // Ladda rot-katalogen
        loadDirectory('/');
      } catch (err: any) {
        console.error('SFTP-initieringsfel:', err);
        const errorMessage = `Kunde inte ansluta till SFTP: ${err.message}`;
        setError(errorMessage);
        if (onError) onError(errorMessage);
      }
    };
    
    initSftp();
    
    return () => {
      // Koppla från SFTP vid cleanup
      if (sftpService) {
        sftpService.disconnect();
      }
    };
  }, [connectionId]);
  
  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [isEditing]);
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'default' ? '' : theme);
  }, [theme]);
  
  const loadDirectory = useCallback(async (path: string) => {
    if (!sftpService) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const directoryContents = await sftpService.listDirectory(path);
      
      // Mappa om filerna till att inkludera isDirectory, isFile, isSymbolicLink direkt i objektet
      setFiles(directoryContents);
      setCurrentPath(path);
    } catch (err: any) {
      console.error('SFTP-listningsfel:', err);
      setError(`Kunde inte läsa katalogen: ${err.message}`);
      if (onError) onError(`Kunde inte läsa katalogen: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [sftpService, onError]);
  
  const refreshCurrentDirectory = () => {
    loadDirectory(currentPath);
  };
  
  const handleFileClick = (file: SFTPFile) => {
    if (file.isDirectory) {
      // Om det är en katalog, navigera in i den
      const newPath = currentPath === '/' 
        ? `/${file.filename}` 
        : `${currentPath}/${file.filename}`;
      loadDirectory(newPath);
    } else {
      // Om det är en fil, anropa callback om den finns
      if (onSelectFile) {
        onSelectFile(file);
      }
    }
  };
  
  const handleNavigateUp = () => {
    if (currentPath === '/') return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const parentPath = pathParts.length === 0 ? '/' : `/${pathParts.join('/')}`;
    loadDirectory(parentPath);
  };
  
  const downloadFile = async (file: SFTPFile) => {
    // För teknisk demonstration, vi visar bara innehållet i webbläsaren
    // I en verklig app skulle vi använda Electron-API:et för att välja var filen ska sparas
    
    setActionInProgress('download');
    try {
      const filePath = currentPath === '/' 
        ? `/${file.filename}`
        : `${currentPath}/${file.filename}`;
        
      const content = await sftpService?.getFileContent(filePath);
      
      // Skapa en blob och en temporär länk för att ladda ner filen
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Skapa en temporär <a>-tagg och klicka på den för att starta nedladdningen
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      a.click();
      
      // Rensa upp URL-objektet
      URL.revokeObjectURL(url);
      
      alert(`Fil nedladdad: ${file.filename}`);
    } catch (err: any) {
      setError(`Kunde inte ladda ner filen: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };
  
  const uploadFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setActionInProgress('upload');
    try {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const uploadPath = currentPath === '/' 
            ? `/${file.name}`
            : `${currentPath}/${file.name}`;
          
          await sftpService?.writeFile(uploadPath, content);
          refreshCurrentDirectory();
          alert(`Fil uppladdad: ${file.name}`);
        } catch (err: any) {
          setError(`Uppladdningsfel: ${err.message}`);
        } finally {
          setActionInProgress(null);
        }
      };
      
      reader.onerror = () => {
        setError('Kunde inte läsa den valda filen.');
        setActionInProgress(null);
      };
      
      reader.readAsText(file);
    } catch (err: any) {
      setError(`Uppladdningsfel: ${err.message}`);
      setActionInProgress(null);
    }
  };
  
  const saveFileChanges = async () => {
    if (!selectedFile || !editingContent) return;
    
    setActionInProgress('save');
    try {
      const filePath = currentPath === '/' 
        ? `/${selectedFile}`
        : `${currentPath}/${selectedFile}`;
      
      await sftpService?.writeFile(filePath, editingContent);
      setFileContent(editingContent);
      setIsEditing(false);
      alert(`Filen har sparats: ${selectedFile}`);
    } catch (err: any) {
      setError(`Kunde inte spara filen: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };
  
  const cancelEditing = () => {
    setIsEditing(false);
    setEditingContent(fileContent);
  };
  
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Vänligen ange ett giltigt mappnamn.');
      return;
    }
    
    setActionInProgress('createFolder');
    try {
      const folderPath = currentPath === '/' 
        ? `/${newFolderName}`
        : `${currentPath}/${newFolderName}`;
      
      await sftpService?.createDirectory(folderPath);
      setShowCreateFolder(false);
      setNewFolderName('');
      refreshCurrentDirectory();
      alert(`Mapp skapad: ${newFolderName}`);
    } catch (err: any) {
      setError(`Kunde inte skapa mappen: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };
  
  const confirmDelete = (file: SFTPFile) => {
    setItemToDelete(file);
    setShowConfirmDelete(true);
  };
  
  const cancelDelete = () => {
    setItemToDelete(null);
    setShowConfirmDelete(false);
  };
  
  const deleteItem = async () => {
    if (!itemToDelete) return;
    
    setActionInProgress('delete');
    try {
      const itemPath = currentPath === '/' 
        ? `/${itemToDelete.filename}`
        : `${currentPath}/${itemToDelete.filename}`;
      
      if (itemToDelete.isDirectory) {
        await sftpService?.deleteDirectory(itemPath);
      } else {
        await sftpService?.deleteFile(itemPath);
      }
      
      setShowConfirmDelete(false);
      setItemToDelete(null);
      refreshCurrentDirectory();
      
      // Om vi tar bort den fil som är öppen, rensa visningen
      if (selectedFile === itemToDelete.filename) {
        setSelectedFile(null);
        setFileContent(null);
        setEditingContent(null);
        setIsEditing(false);
      }
      
      alert(`${itemToDelete.isDirectory ? 'Mapp' : 'Fil'} borttagen: ${itemToDelete.filename}`);
    } catch (err: any) {
      setError(`Kunde inte ta bort ${itemToDelete.isDirectory ? 'mappen' : 'filen'}: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };
  
  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <button 
          onClick={handleNavigateUp} 
          disabled={currentPath === '/' || loading}
          className="navigator-button"
          title="Navigera upp"
        >
          <ArrowLeftIcon /> Upp
        </button>
        <div className="current-path" title={currentPath}>{currentPath}</div>
        
        <div className="file-actions">
          <button 
            onClick={() => setShowCreateFolder(true)}
            disabled={!!actionInProgress}
            className="action-button"
            title="Skapa ny mapp"
          >
            <PlusIcon /> Ny mapp
          </button>
          
          <button 
            onClick={uploadFile}
            disabled={!!actionInProgress}
            className="action-button"
            title="Ladda upp fil"
          >
            <UploadIcon /> Ladda upp
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }}
          />
        </div>
      </div>
      
      {loading && <div className="loading">Laddar...</div>}
      
      {error && <div className="error">{error}</div>}
      
      <div className="file-explorer-content">
        <div className="files-list">
          {files.length === 0 && !loading && !error ? (
            <div className="empty-directory">Katalogen är tom</div>
          ) : (
            files
              .sort((a, b) => {
                // Sortera kataloger först, sedan filer
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                // Sortera alfabetiskt
                return a.filename.localeCompare(b.filename);
              })
              .map((file) => (
                <div 
                  key={file.filename}
                  className={`file-item ${selectedFile === file.filename ? 'selected' : ''}`}
                >
                  <div className="file-item-content" onClick={() => handleFileClick(file)}>
                    <div className="file-icon">
                      {file.isDirectory ? <FolderIcon /> : <FileIcon />}
                    </div>
                    <div className="file-name">{file.filename}</div>
                    <div className="file-details">
                      <span className="file-size">
                        {file.isDirectory ? '--' : formatFileSize(file.attrs.size)}
                      </span>
                      <span className="file-date">
                        {formatDate(new Date(file.attrs.mtime * 1000))}
                      </span>
                    </div>
                  </div>
                  
                  <div className="file-actions">
                    {file.isDirectory && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleFileClick(file); }} 
                        className="file-action-button"
                        disabled={!!actionInProgress}
                        title="Navigera in"
                      >
                        <FolderIcon />
                      </button>
                    )}
                    {file.isDirectory && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); confirmDelete(file); }} 
                        className="file-action-button delete"
                        disabled={!!actionInProgress}
                        title="Ta bort"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
        
        {selectedFile && fileContent !== null && (
          <div className="file-content">
            <div className="file-content-header">
              <h3>{selectedFile}</h3>
              <div className="file-content-actions">
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="file-action-button"
                    disabled={!!actionInProgress}
                    title="Redigera"
                  >
                    <EditIcon /> Redigera
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={saveFileChanges} 
                      className="file-action-button save"
                      disabled={!!actionInProgress}
                      title="Spara"
                    >
                      <CheckIcon /> Spara
                    </button>
                    <button 
                      onClick={cancelEditing} 
                      className="file-action-button cancel"
                      disabled={!!actionInProgress}
                      title="Avbryt"
                    >
                      <TimesIcon /> Avbryt
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {!isEditing ? (
              <pre className="file-content-preview">{fileContent}</pre>
            ) : (
              <textarea 
                ref={textAreaRef}
                className="file-content-editor"
                value={editingContent || ''}
                onChange={(e) => setEditingContent(e.target.value)}
                disabled={!!actionInProgress}
              />
            )}
          </div>
        )}
      </div>
      
      {showCreateFolder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Skapa ny mapp</h3>
            <div className="modal-form">
              <input 
                type="text" 
                value={newFolderName} 
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Mappnamn"
                disabled={!!actionInProgress}
              />
              <div className="modal-buttons">
                <button 
                  onClick={createFolder} 
                  disabled={!newFolderName.trim() || !!actionInProgress}
                >
                  {actionInProgress === 'createFolder' ? 'Skapar...' : 'Skapa'}
                </button>
                <button 
                  onClick={() => setShowCreateFolder(false)} 
                  disabled={!!actionInProgress}
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showConfirmDelete && itemToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Bekräfta borttagning</h3>
            <p>
              Är du säker på att du vill ta bort {itemToDelete.isDirectory ? 'mappen' : 'filen'} 
              <strong> {itemToDelete.filename}</strong>?
              {itemToDelete.isDirectory && ' Alla filer i mappen kommer också att tas bort.'}
            </p>
            <div className="modal-buttons">
              <button 
                onClick={deleteItem} 
                className="delete-button" 
                disabled={!!actionInProgress}
              >
                {actionInProgress === 'delete' ? 'Tar bort...' : 'Ta bort'}
              </button>
              <button 
                onClick={cancelDelete} 
                disabled={!!actionInProgress}
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
      
      {actionInProgress && actionInProgress !== 'createFolder' && actionInProgress !== 'delete' && (
        <div className="action-overlay">
          <div className="action-spinner"></div>
          <div className="action-text">
            {actionInProgress === 'upload' && 'Laddar upp...'}
            {actionInProgress === 'download' && 'Laddar ner...'}
            {actionInProgress === 'save' && 'Sparar...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer; 