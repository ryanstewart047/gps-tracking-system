import { Server, Socket } from 'socket.io';
import { ILocation } from '../models/Location';
import { IDevice } from '../models/Device';

export class WebSocketService {
  private io: Server;
  private connectedClients: Map<string, Socket> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Handle authentication
      socket.on('authenticate', (data: { userId: string, token: string }) => {
        // TODO: Implement JWT token verification
        this.connectedClients.set(data.userId, socket);
        socket.join(`user_${data.userId}`);
        console.log(`User ${data.userId} authenticated and joined room`);
      });

      // Handle device tracking subscription
      socket.on('subscribe_device', (deviceId: string) => {
        socket.join(`device_${deviceId}`);
        console.log(`Client subscribed to device: ${deviceId}`);
      });

      // Handle device tracking unsubscription
      socket.on('unsubscribe_device', (deviceId: string) => {
        socket.leave(`device_${deviceId}`);
        console.log(`Client unsubscribed from device: ${deviceId}`);
      });

      // Handle real-time location requests
      socket.on('request_current_location', (deviceId: string) => {
        // Emit request to specific device (if connected)
        this.io.to(`device_${deviceId}`).emit('location_request');
      });

      // Handle device configuration updates
      socket.on('update_device_config', (data: { deviceId: string, config: any }) => {
        this.io.to(`device_${data.deviceId}`).emit('config_update', data.config);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Remove from connected clients
        for (const [userId, clientSocket] of this.connectedClients.entries()) {
          if (clientSocket.id === socket.id) {
            this.connectedClients.delete(userId);
            break;
          }
        }
      });

      // Handle device heartbeat
      socket.on('device_heartbeat', (data: { deviceId: string, status: any }) => {
        this.broadcastDeviceStatus(data.deviceId, data.status);
      });

      // Handle geofence alerts
      socket.on('geofence_alert', (data: { deviceId: string, alert: any }) => {
        this.broadcastGeofenceAlert(data.deviceId, data.alert);
      });
    });
  }

  broadcastLocationUpdate(location: ILocation): void {
    // Broadcast to all clients subscribed to this device
    this.io.to(`device_${location.deviceId}`).emit('location_update', {
      deviceId: location.deviceId,
      latitude: location.latitude,
      longitude: location.longitude,
      altitude: location.altitude,
      speed: location.speed,
      heading: location.heading,
      timestamp: location.timestamp,
      batteryLevel: location.batteryLevel,
      signalStrength: location.signalStrength,
      accuracy: location.accuracy
    });

    console.log(`Broadcasted location update for device: ${location.deviceId}`);
  }

  broadcastDeviceStatus(deviceId: string, status: Partial<IDevice>): void {
    this.io.to(`device_${deviceId}`).emit('device_status', {
      deviceId,
      ...status,
      timestamp: new Date()
    });

    console.log(`Broadcasted device status for: ${deviceId}`);
  }

  broadcastGeofenceAlert(deviceId: string, alert: any): void {
    this.io.to(`device_${deviceId}`).emit('geofence_alert', {
      deviceId,
      alert,
      timestamp: new Date()
    });

    console.log(`Broadcasted geofence alert for device: ${deviceId}`);
  }

  broadcastBatteryAlert(deviceId: string, batteryLevel: number): void {
    if (batteryLevel <= 20) {
      this.io.to(`device_${deviceId}`).emit('battery_alert', {
        deviceId,
        batteryLevel,
        severity: batteryLevel <= 10 ? 'critical' : 'warning',
        timestamp: new Date()
      });

      console.log(`Broadcasted battery alert for device: ${deviceId} (${batteryLevel}%)`);
    }
  }

  broadcastOfflineAlert(deviceId: string): void {
    this.io.to(`device_${deviceId}`).emit('device_offline', {
      deviceId,
      timestamp: new Date()
    });

    console.log(`Broadcasted offline alert for device: ${deviceId}`);
  }

  sendNotificationToUser(userId: string, notification: any): void {
    const socket = this.connectedClients.get(userId);
    if (socket) {
      socket.emit('notification', notification);
      console.log(`Sent notification to user: ${userId}`);
    }
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getDeviceSubscribersCount(deviceId: string): number {
    const room = this.io.sockets.adapter.rooms.get(`device_${deviceId}`);
    return room ? room.size : 0;
  }

  // Emit system-wide announcements
  broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    this.io.emit('system_message', {
      message,
      type,
      timestamp: new Date()
    });

    console.log(`Broadcasted system message: ${message}`);
  }

  // Send command to specific device
  sendDeviceCommand(deviceId: string, command: string, params?: any): void {
    this.io.to(`device_${deviceId}`).emit('device_command', {
      command,
      params,
      timestamp: new Date()
    });

    console.log(`Sent command '${command}' to device: ${deviceId}`);
  }

  // Handle emergency situations
  broadcastEmergencyAlert(deviceId: string, location: { lat: number, lng: number }): void {
    this.io.emit('emergency_alert', {
      deviceId,
      location,
      timestamp: new Date()
    });

    console.log(`Broadcasted emergency alert for device: ${deviceId}`);
  }
}
