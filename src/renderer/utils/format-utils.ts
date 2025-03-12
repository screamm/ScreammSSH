/**
 * Formaterar en filstorlek från bytes till läsbart format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

/**
 * Formaterar ett datum till läsbart format
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleString();
};

/**
 * Formaterar ett filnamn för att ta bort sökvägar och bara visa själva filnamnet
 */
export const formatFileName = (path: string): string => {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1];
};

/**
 * Hämtar filändelsen från ett filnamn
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Kontrollerar om en fil är av en viss typ baserat på filändelsen
 */
export const isFileType = (filename: string, extensions: string[]): boolean => {
  const ext = getFileExtension(filename);
  return extensions.includes(ext);
};

/**
 * Kontrollerar om en fil är en bild
 */
export const isImageFile = (filename: string): boolean => {
  return isFileType(filename, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']);
};

/**
 * Kontrollerar om en fil är ett textdokument
 */
export const isTextFile = (filename: string): boolean => {
  return isFileType(filename, ['txt', 'md', 'log', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'yaml', 'yml', 'conf', 'cfg', 'ini']);
}; 