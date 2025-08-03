import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

interface ConnectedDevice {
  deviceId: string;
  socket: any;
  type: 'desktop' | 'mobile' | 'gps_tracker';
  connectedAt: Date;
}

interface ConnectedClient {
  userId?: string;
  socket: any;
  connectedAt: Date;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedDevices: Map<string, ConnectedDevice> = new Map();
  private connectedClients: Set<ConnectedClient> = new Set();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3001",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io'
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('New socket connection:', socket.id);

      // Handle device connections
      socket.on('device_register', (data) => {
        this.handleDeviceRegistration(socket, data);
      });

      // Handle client (dashboard) connections
      socket.on('client_register', (data) => {
        this.handleClientRegistration(socket, data);
      });

      // Handle device responses
      socket.on('device_response', (data) => {
        this.handleDeviceResponse(data);
      });

      // Handle heartbeat
      socket.on('heartbeat', (data) => {
        this.handleHeartbeat(socket, data);
      });

      // Handle device confirmation
      socket.on('confirmation', (data) => {
        this.handleDeviceConfirmation(data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });
    });

    // Device-specific namespace for direct WebSocket connections
    const deviceNamespace = this.io.of('/ws/device');
    deviceNamespace.use(this.authenticateDevice.bind(this));
    
    deviceNamespace.on('connection', (socket) => {
      console.log('Device WebSocket connected:', socket.id);
      
      socket.on('device_registration', (data) => {
        this.handleDeviceRegistration(socket, data);
      });

      socket.on('heartbeat', (data) => {
        this.handleHeartbeat(socket, data);
      });

      socket.on('confirmation', (data) => {
        this.handleDeviceConfirmation(data);
      });

      socket.on('status_response', (data) => {
        this.broadcastToClients('device_status_response', data);
      });

      socket.on('pong', (data) => {
        console.log('Received pong from device:', data.deviceId);
      });

      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });
    });
  }

  private async authenticateDevice(socket: any, next: any) {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // In production, verify JWT token
      // For now, accept demo token
      if (token === 'demo-token-replace-in-production' || token.startsWith('Bearer ')) {
        return next();
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  }

  private handleDeviceRegistration(socket: any, data: any) {
    const { deviceId, deviceInfo, type } = data;
    
    if (!deviceId) {
      console.error('Device registration failed: No device ID');
      return;
    }

    // Remove existing connection for this device
    if (this.connectedDevices.has(deviceId)) {
      const existingDevice = this.connectedDevices.get(deviceId);
      existingDevice?.socket.disconnect();
    }

    // Register new device
    const deviceConnection: ConnectedDevice = {
      deviceId,
      socket,
      type: type || 'desktop',
      connectedAt: new Date()
    };

    this.connectedDevices.set(deviceId, deviceConnection);
    
    console.log(`Device registered: ${deviceId} (${type})`);

    // Notify clients about new device
    this.broadcastToClients('device_connected', {
      deviceId,
      type,
      connectedAt: deviceConnection.connectedAt
    });

    // Send registration confirmation
    socket.emit('registration_confirmed', {
      deviceId,
      serverTime: new Date().toISOString()
    });
  }

  private handleClientRegistration(socket: any, data: any) {
    const { userId } = data;
    
    const clientConnection: ConnectedClient = {
      userId,
      socket,
      connectedAt: new Date()
    };

    this.connectedClients.add(clientConnection);
    
    console.log(`Client registered: ${userId || 'anonymous'}`);

    // Send current device list
    const deviceList = Array.from(this.connectedDevices.values()).map(device => ({
      deviceId: device.deviceId,
      type: device.type,
      connectedAt: device.connectedAt
    }));

    socket.emit('device_list', deviceList);
  }

  private handleDeviceResponse(data: any) {
    // Forward device responses to clients
    this.broadcastToClients('device_response', data);
  }

  private handleHeartbeat(socket: any, data: any) {
    const { deviceId } = data;
    
    if (deviceId && this.connectedDevices.has(deviceId)) {
      const device = this.connectedDevices.get(deviceId);
      if (device) {
        device.connectedAt = new Date(); // Update last seen
      }
    }

    // Send heartbeat response
    socket.emit('heartbeat_ack', {
      serverTime: new Date().toISOString()
    });
  }

  private handleDeviceConfirmation(data: any) {
    console.log('Device confirmation:', data);
    
    // Broadcast confirmation to clients
    this.broadcastToClients('device_confirmation', data);
  }

  private handleDisconnection(socket: any) {
    console.log('Socket disconnected:', socket.id);

    // Remove from devices
    for (const [deviceId, device] of this.connectedDevices.entries()) {
      if (device.socket.id === socket.id) {
        this.connectedDevices.delete(deviceId);
        console.log(`Device disconnected: ${deviceId}`);
        
        // Notify clients
        this.broadcastToClients('device_disconnected', { deviceId });
        break;
      }
    }

    // Remove from clients
    for (const client of this.connectedClients) {
      if (client.socket.id === socket.id) {
        this.connectedClients.delete(client);
        console.log('Client disconnected');
        break;
      }
    }
  }

  // Public methods for controllers to use

  public sendToDevice(deviceId: string, data: any): boolean {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) {
      console.warn(`Device not connected: ${deviceId}`);
      return false;
    }

    try {
      device.socket.emit('admin_command', data);
      console.log(`Command sent to device ${deviceId}:`, data.command);
      return true;
    } catch (error) {
      console.error(`Failed to send command to device ${deviceId}:`, error);
      return false;
    }
  }

  public broadcastToClients(event: string, data: any) {
    const message = {
      event,
      data,
      timestamp: new Date().toISOString()
    };

    for (const client of this.connectedClients) {
      try {
        client.socket.emit(event, message);
      } catch (error) {
        console.error('Failed to broadcast to client:', error);
      }
    }

    console.log(`Broadcasted ${event} to ${this.connectedClients.size} clients`);
  }

  public getConnectedDevices(): string[] {
    return Array.from(this.connectedDevices.keys());
  }

  public getConnectedDeviceCount(): number {
    return this.connectedDevices.size;
  }

  public getConnectedClientCount(): number {
    return this.connectedClients.size;
  }

  public isDeviceConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }

  // Send ping to device to test connection
  public pingDevice(deviceId: string): boolean {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) {
      return false;
    }

    try {
      device.socket.emit('admin_command', {
        command: 'ping',
        requestId: `ping_${Date.now()}`
      });
      return true;
    } catch (error) {
      console.error(`Failed to ping device ${deviceId}:`, error);
      return false;
    }
  }

  // Broadcast message to all devices of a specific type
  public broadcastToDeviceType(type: 'desktop' | 'mobile' | 'gps_tracker', data: any) {
    let count = 0;
    
    for (const device of this.connectedDevices.values()) {
      if (device.type === type) {
        try {
          device.socket.emit('admin_command', data);
          count++;
        } catch (error) {
          console.error(`Failed to broadcast to device ${device.deviceId}:`, error);
        }
      }
    }

    console.log(`Broadcasted to ${count} ${type} devices`);
    return count;
  }

  // Get connection statistics
  public getConnectionStats() {
    const devicesByType = {
      desktop: 0,
      mobile: 0,
      gps_tracker: 0
    };

    for (const device of this.connectedDevices.values()) {
      devicesByType[device.type]++;
    }

    return {
      totalDevices: this.connectedDevices.size,
      totalClients: this.connectedClients.size,
      devicesByType,
      uptime: process.uptime()
    };
  }
}
