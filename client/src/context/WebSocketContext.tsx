import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface LocationUpdate {
  deviceId: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  batteryLevel?: number;
  signalStrength?: number;
  accuracy?: number;
}

interface DeviceStatus {
  deviceId: string;
  isActive: boolean;
  lastSeen: string;
  batteryLevel?: number;
  signalStrength?: number;
  timestamp: string;
}

interface Alert {
  deviceId: string;
  alert: any;
  timestamp: string;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  locationUpdates: LocationUpdate[];
  deviceStatuses: DeviceStatus[];
  alerts: Alert[];
  subscribeToDevice: (deviceId: string) => void;
  unsubscribeFromDevice: (deviceId: string) => void;
  requestCurrentLocation: (deviceId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [locationUpdates, setLocationUpdates] = useState<LocationUpdate[]>([]);
  const [deviceStatuses, setDeviceStatuses] = useState<DeviceStatus[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Initialize socket connection
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Data event handlers
    newSocket.on('location_update', (update: LocationUpdate) => {
      console.log('Location update received:', update);
      setLocationUpdates(prev => [update, ...prev.slice(0, 99)]); // Keep last 100 updates
    });

    newSocket.on('device_status', (status: DeviceStatus) => {
      console.log('Device status received:', status);
      setDeviceStatuses(prev => {
        const filtered = prev.filter(s => s.deviceId !== status.deviceId);
        return [status, ...filtered];
      });
    });

    newSocket.on('battery_alert', (alert: Alert) => {
      console.log('Battery alert received:', alert);
      setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
    });

    newSocket.on('geofence_alert', (alert: Alert) => {
      console.log('Geofence alert received:', alert);
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
    });

    newSocket.on('device_offline', (alert: Alert) => {
      console.log('Device offline alert received:', alert);
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
    });

    newSocket.on('emergency_alert', (alert: Alert) => {
      console.log('Emergency alert received:', alert);
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
    });

    newSocket.on('system_message', (message: { message: string; type: string; timestamp: string }) => {
      console.log('System message received:', message);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  const subscribeToDevice = (deviceId: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe_device', deviceId);
      console.log(`Subscribed to device: ${deviceId}`);
    }
  };

  const unsubscribeFromDevice = (deviceId: string) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe_device', deviceId);
      console.log(`Unsubscribed from device: ${deviceId}`);
    }
  };

  const requestCurrentLocation = (deviceId: string) => {
    if (socket && isConnected) {
      socket.emit('request_current_location', deviceId);
      console.log(`Requested current location for device: ${deviceId}`);
    }
  };

  const contextValue: WebSocketContextType = {
    socket,
    isConnected,
    locationUpdates,
    deviceStatuses,
    alerts,
    subscribeToDevice,
    unsubscribeFromDevice,
    requestCurrentLocation,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
