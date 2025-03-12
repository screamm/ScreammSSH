import { v4 as uuidv4 } from 'uuid';
import { sshService, SSHConnectionInfo } from './SSHService';

export interface ConnectionGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export class ConnectionManager {
  private connections: Map<string, SSHConnectionInfo> = new Map();
  private groups: Map<string, ConnectionGroup> = new Map();
  private recentConnections: string[] = [];
  private maxRecentConnections: number = 10;

  constructor() {
    console.log('ConnectionManager initialiserad');
    this.loadConnections();
    this.loadGroups();
  }

  private async loadConnections() {
    try {
      if (window.electronAPI && window.electronAPI.getSavedConnections) {
        const storedConnections = await window.electronAPI.getSavedConnections();
        if (Array.isArray(storedConnections)) {
          storedConnections.forEach(conn => {
            this.connections.set(conn.id, conn);
          });
          console.log(`Laddade ${storedConnections.length} sparade anslutningar`);
        }
      } else {
        console.warn('electronAPI.getSavedConnections är inte tillgänglig, kan inte ladda sparade anslutningar');
        // Ladda dummy-anslutningar för utvecklingsändamål
        this.loadDummyData();
      }
    } catch (error) {
      console.error('Fel vid laddning av sparade anslutningar:', error);
      // Fallback till dummydata om något går fel
      this.loadDummyData();
    }
  }

  private loadDummyData() {
    // Skapa några exempelanslutningar för utveckling
    const dummyConnections: SSHConnectionInfo[] = [
      {
        id: uuidv4(),
        name: 'Lokal utvecklingsserver',
        host: 'localhost',
        port: 22,
        username: 'utvecklare',
        password: 'password123',
        group: 'utveckling',
        color: '#50fa7b',
        notes: 'Lokal utvecklingsserver för testning'
      },
      {
        id: uuidv4(),
        name: 'Produktionsserver 1',
        host: 'prod1.exempel.se',
        port: 22,
        username: 'admin',
        password: 'securepassword',
        group: 'produktion',
        color: '#ff5555',
        notes: 'Huvudproduktionsserver'
      },
      {
        id: uuidv4(),
        name: 'Testserver',
        host: 'test.exempel.se',
        port: 22,
        username: 'testuser',
        password: 'testpass',
        group: 'test',
        color: '#f1fa8c',
        notes: 'Server för testning av nya funktioner'
      }
    ];

    dummyConnections.forEach(conn => {
      this.connections.set(conn.id, conn);
    });

    // Skapa några exempelgrupper
    const dummyGroups: ConnectionGroup[] = [
      {
        id: 'utveckling',
        name: 'Utveckling',
        description: 'Utvecklingsservrar',
        color: '#50fa7b'
      },
      {
        id: 'produktion',
        name: 'Produktion',
        description: 'Produktionsservrar',
        color: '#ff5555'
      },
      {
        id: 'test',
        name: 'Test',
        description: 'Testservrar',
        color: '#f1fa8c'
      }
    ];

    dummyGroups.forEach(group => {
      this.groups.set(group.id, group);
    });

    console.log('Laddade dummy-anslutningar och grupper för utveckling');
  }

  private async loadGroups() {
    try {
      // För tillfället använder vi dummy-grupper eftersom API inte finns ännu
      // Kommer att implementeras senare när backend-stöd finns
      console.log('Använder befintliga grupper från dummy-data');
    } catch (error) {
      console.error('Fel vid laddning av sparade anslutningsgrupper:', error);
    }
  }

  private async saveConnections() {
    try {
      if (window.electronAPI && window.electronAPI.saveConnection) {
        // Spara varje anslutning individuellt eftersom API:et för närvarande bara stödjer detta
        const connectionsArray = Array.from(this.connections.values());
        for (const connection of connectionsArray) {
          await window.electronAPI.saveConnection(connection);
        }
        console.log(`Sparade ${connectionsArray.length} anslutningar`);
      } else {
        console.warn('electronAPI.saveConnection är inte tillgänglig, kan inte spara anslutningar');
      }
    } catch (error) {
      console.error('Fel vid sparande av anslutningar:', error);
    }
  }

  private async saveGroups() {
    try {
      // För tillfället lagrar vi inte grupper via IPC eftersom API:et inte är implementerat
      console.log('Grupplagring kommer att implementeras senare');
    } catch (error) {
      console.error('Fel vid sparande av anslutningsgrupper:', error);
    }
  }

  public async createConnection(connectionInfo: Omit<SSHConnectionInfo, 'id'>): Promise<SSHConnectionInfo> {
    const id = uuidv4();
    const newConnection: SSHConnectionInfo = {
      ...connectionInfo,
      id,
      lastConnected: undefined
    };

    this.connections.set(id, newConnection);
    await this.saveConnections();
    console.log(`Skapade ny anslutning: ${newConnection.name}`);
    return newConnection;
  }

  public async updateConnection(connectionInfo: SSHConnectionInfo): Promise<boolean> {
    if (!this.connections.has(connectionInfo.id)) {
      console.error(`Försökte uppdatera en anslutning som inte finns: ${connectionInfo.id}`);
      return false;
    }

    this.connections.set(connectionInfo.id, connectionInfo);
    await this.saveConnections();
    console.log(`Uppdaterade anslutning: ${connectionInfo.name}`);
    return true;
  }

  public async deleteConnection(connectionId: string): Promise<boolean> {
    if (!this.connections.has(connectionId)) {
      console.error(`Försökte ta bort en anslutning som inte finns: ${connectionId}`);
      return false;
    }

    // Om anslutningen är aktiv, koppla från den först
    if (sshService.isConnected(connectionId)) {
      sshService.disconnect(connectionId);
    }

    // Ta bort från recent-listan om den finns där
    const recentIndex = this.recentConnections.indexOf(connectionId);
    if (recentIndex !== -1) {
      this.recentConnections.splice(recentIndex, 1);
    }

    this.connections.delete(connectionId);
    await this.saveConnections();
    console.log(`Tog bort anslutning: ${connectionId}`);
    return true;
  }

  public async createGroup(groupInfo: Omit<ConnectionGroup, 'id'>): Promise<ConnectionGroup> {
    const id = uuidv4();
    const newGroup: ConnectionGroup = {
      ...groupInfo,
      id
    };

    this.groups.set(id, newGroup);
    await this.saveGroups();
    console.log(`Skapade ny anslutningsgrupp: ${newGroup.name}`);
    return newGroup;
  }

  public async updateGroup(groupInfo: ConnectionGroup): Promise<boolean> {
    if (!this.groups.has(groupInfo.id)) {
      console.error(`Försökte uppdatera en anslutningsgrupp som inte finns: ${groupInfo.id}`);
      return false;
    }

    this.groups.set(groupInfo.id, groupInfo);
    await this.saveGroups();
    console.log(`Uppdaterade anslutningsgrupp: ${groupInfo.name}`);
    return true;
  }

  public async deleteGroup(groupId: string): Promise<boolean> {
    if (!this.groups.has(groupId)) {
      console.error(`Försökte ta bort en anslutningsgrupp som inte finns: ${groupId}`);
      return false;
    }

    // Uppdatera alla anslutningar som tillhör denna grupp
    const connectionsToUpdate: SSHConnectionInfo[] = [];
    this.connections.forEach(conn => {
      if (conn.group === groupId) {
        connectionsToUpdate.push({ ...conn, group: undefined });
      }
    });

    // Uppdatera anslutningarna
    for (const conn of connectionsToUpdate) {
      this.connections.set(conn.id, conn);
    }

    this.groups.delete(groupId);
    await this.saveGroups();
    
    // Spara ändringar i anslutningar
    if (connectionsToUpdate.length > 0) {
      await this.saveConnections();
    }
    
    console.log(`Tog bort anslutningsgrupp: ${groupId} och uppdaterade ${connectionsToUpdate.length} anslutningar`);
    return true;
  }

  public getConnection(connectionId: string): SSHConnectionInfo | undefined {
    return this.connections.get(connectionId);
  }

  public getAllConnections(): SSHConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  public getConnectionsByGroup(groupId?: string): SSHConnectionInfo[] {
    if (!groupId) {
      return this.getAllConnections().filter(conn => !conn.group);
    }
    
    return this.getAllConnections().filter(conn => conn.group === groupId);
  }

  public getGroup(groupId: string): ConnectionGroup | undefined {
    return this.groups.get(groupId);
  }

  public getAllGroups(): ConnectionGroup[] {
    return Array.from(this.groups.values());
  }

  public async connect(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      console.error(`Försökte ansluta till en anslutning som inte finns: ${connectionId}`);
      return false;
    }

    try {
      const connected = await sshService.connect(connection);
      
      if (connected) {
        // Uppdatera lastConnected och spara
        const updatedConnection = {
          ...connection,
          lastConnected: new Date()
        };
        this.connections.set(connectionId, updatedConnection);
        
        // Lägg till i recent connections
        this.addToRecentConnections(connectionId);
        
        await this.saveConnections();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Fel vid anslutning till ${connection.name}:`, error);
      return false;
    }
  }

  public disconnect(connectionId: string): boolean {
    return sshService.disconnect(connectionId);
  }

  public disconnectAll(): void {
    sshService.disconnectAll();
  }

  public isConnected(connectionId: string): boolean {
    return sshService.isConnected(connectionId);
  }

  public getActiveConnections(): string[] {
    return sshService.getActiveConnections();
  }

  public getRecentConnections(): SSHConnectionInfo[] {
    return this.recentConnections
      .map(id => this.connections.get(id))
      .filter((conn): conn is SSHConnectionInfo => !!conn);
  }

  private addToRecentConnections(connectionId: string): void {
    // Ta bort om den redan finns
    const index = this.recentConnections.indexOf(connectionId);
    if (index !== -1) {
      this.recentConnections.splice(index, 1);
    }
    
    // Lägg till i början
    this.recentConnections.unshift(connectionId);
    
    // Begränsa storleken
    if (this.recentConnections.length > this.maxRecentConnections) {
      this.recentConnections = this.recentConnections.slice(0, this.maxRecentConnections);
    }
  }

  public async executeCommand(connectionId: string, command: string): Promise<string> {
    return sshService.executeCommand(connectionId, command);
  }

  public async openShell(connectionId: string): Promise<boolean> {
    return sshService.openShell(connectionId);
  }

  public searchConnections(searchTerm: string): SSHConnectionInfo[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return this.getAllConnections();
    }
    
    const term = searchTerm.toLowerCase();
    return this.getAllConnections().filter(conn => 
      conn.name.toLowerCase().includes(term) || 
      conn.host.toLowerCase().includes(term) ||
      conn.username.toLowerCase().includes(term) ||
      (conn.notes && conn.notes.toLowerCase().includes(term))
    );
  }
}

// Exportera en singleton-instans
export const connectionManager = new ConnectionManager();
export default connectionManager; 