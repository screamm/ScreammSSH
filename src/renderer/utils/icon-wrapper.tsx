import React from 'react';
import * as FaIcons from 'react-icons/fa';

// Denna typ representerar alla ikoner som finns i FaIcons
type IconType = keyof typeof FaIcons;

// Denna hjälpfunktion konverterar en FaIcon till en React-komponent
export const Icon = (props: { 
  icon: IconType; 
  color?: string; 
  size?: string | number;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) => {
  const { icon, ...restProps } = props;
  
  if (!FaIcons[icon]) {
    console.error(`Ikonen ${icon} finns inte i react-icons/fa`);
    return null;
  }
  
  const IconComponent = FaIcons[icon];
  // Använd createElement för att skapa ikonen explicit som JSX element
  return React.createElement(IconComponent as React.ComponentType<any>, restProps);
};

// Hjälpfunktioner för alla ikoner vi använder
export const FolderIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaFolder" {...props} />;

export const FileIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaFile" {...props} />;

export const ArrowLeftIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaArrowLeft" {...props} />;

export const TrashIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaTrash" {...props} />;

export const PlusIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaPlus" {...props} />;

export const DownloadIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaDownload" {...props} />;

export const UploadIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaUpload" {...props} />;

export const EditIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaEdit" {...props} />;

export const TimesIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaTimes" {...props} />;

export const CheckIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaCheck" {...props} />;

export const KeyIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaKey" {...props} />;

export const SaveIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaSave" {...props} />;

export const ServerIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaServer" {...props} />;

export const AngleDownIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaAngleDown" {...props} />;

export const HistoryIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaHistory" {...props} />;

export const TerminalIcon = (props: Omit<React.ComponentProps<typeof Icon>, 'icon'>) => 
  <Icon icon="FaTerminal" {...props} />; 