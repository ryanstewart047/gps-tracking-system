import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5001;

// Simple file-based storage for demo
const DATA_DIR = path.join(__dirname, '../data');
const DEVICES_FILE = path.join(DATA_DIR, 'devices.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize devices file with mock data
if (!fs.existsSync(DEVICES_FILE)) {
  const mockDevices = [
    {
      deviceId: 'gps_001',
      type: 'gps_tracker',
      name: 'Vehicle Tracker 1',
      status: {
        isOnline: true,
        lastSeen: new Date().toISOString(),
        batteryLevel: 85,
        signalStrength: 92
      },
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 3.2,
        lastUpdate: new Date().toISOString()
      },
      settings: {
        updateInterval: 30,
        alertsEnabled: true
      }
    },
    {
      deviceId: 'gps_002',
      type: 'gps_tracker', 
      name: 'Vehicle Tracker 2',
      status: {
        isOnline: false,
        lastSeen: new Date(Date.now() - 300000).toISOString(),
        batteryLevel: 23,
        signalStrength: 67
      },
      location: {
        latitude: 37.7849,
        longitude: -122.4094,
        accuracy: 8.5,
        lastUpdate: new Date(Date.now() - 300000).toISOString()
      },
      settings: {
        updateInterval: 30,
        alertsEnabled: true
      }
    }
  ];
  fs.writeFileSync(DEVICES_FILE, JSON.stringify(mockDevices, null, 2));
}

// Helper functions
const readDevices = () => {
  try {
    const data = fs.readFileSync(DEVICES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading devices file:', error);
    return [];
  }
};

const writeDevices = (devices: any[]) => {
  try {
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2));
  } catch (error) {
    console.error('Error writing devices file:', error);
  }
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000",
    process.env.MOBILE_URL || "http://localhost:19006"
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'File-based (Demo Mode)'
  });
});

// Device monitoring endpoints
app.get('/api/device-monitor/devices', (req, res) => {
  const devices = readDevices();
  res.json(devices);
});

app.post('/api/device-monitor/devices/:deviceId/register', (req, res) => {
  const { deviceId } = req.params;
  const { type, name, platform } = req.body;
  
  const devices = readDevices();
  const existingIndex = devices.findIndex((d: any) => d.deviceId === deviceId);
  
  const deviceData = {
    deviceId,
    type: type || 'desktop',
    name: name || `Device ${deviceId}`,
    platform,
    status: {
      isOnline: true,
      lastSeen: new Date().toISOString(),
      batteryLevel: 100,
      signalStrength: 80
    },
    location: {
      latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
      accuracy: Math.random() * 10 + 1,
      lastUpdate: new Date().toISOString()
    },
    settings: {
      updateInterval: 30,
      alertsEnabled: true
    },
    adminCommands: []
  };
  
  if (existingIndex >= 0) {
    devices[existingIndex] = { ...devices[existingIndex], ...deviceData };
  } else {
    devices.push(deviceData);
  }
  
  writeDevices(devices);
  
  // Emit to WebSocket clients
  io.emit('device-registered', deviceData);
  
  res.json({ success: true, device: deviceData });
});

app.post('/api/device-monitor/devices/:deviceId/location', (req, res) => {
  const { deviceId } = req.params;
  const { latitude, longitude, accuracy } = req.body;
  
  const devices = readDevices();
  const deviceIndex = devices.findIndex((d: any) => d.deviceId === deviceId);
  
  if (deviceIndex >= 0) {
    devices[deviceIndex].location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude), 
      accuracy: parseFloat(accuracy) || 5,
      lastUpdate: new Date().toISOString()
    };
    devices[deviceIndex].status.lastSeen = new Date().toISOString();
    devices[deviceIndex].status.isOnline = true;
    
    writeDevices(devices);
    
    // Emit to WebSocket clients
    io.emit('location-update', {
      deviceId,
      location: devices[deviceIndex].location
    });
    
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.post('/api/device-monitor/devices/:deviceId/admin-command', (req, res) => {
  const { deviceId } = req.params;
  const { type, payload } = req.body;
  
  const devices = readDevices();
  const deviceIndex = devices.findIndex((d: any) => d.deviceId === deviceId);
  
  if (deviceIndex >= 0) {
    const command = {
      id: Date.now().toString(),
      type,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    if (!devices[deviceIndex].adminCommands) {
      devices[deviceIndex].adminCommands = [];
    }
    devices[deviceIndex].adminCommands.push(command);
    
    writeDevices(devices);
    
    // Emit to device via WebSocket
    io.emit('admin-command', {
      deviceId,
      command
    });
    
    res.json({ success: true, commandId: command.id });
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('register-device', (data) => {
    const { deviceId, type, name } = data;
    console.log(`Device registered: ${deviceId} (${type})`);
    
    // Join device-specific room
    socket.join(`device-${deviceId}`);
  });
  
  socket.on('location-update', (data) => {
    const { deviceId, latitude, longitude, accuracy } = data;
    
    const devices = readDevices();
    const deviceIndex = devices.findIndex((d: any) => d.deviceId === deviceId);
    
    if (deviceIndex >= 0) {
      devices[deviceIndex].location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: parseFloat(accuracy) || 5,
        lastUpdate: new Date().toISOString()
      };
      devices[deviceIndex].status.lastSeen = new Date().toISOString();
      devices[deviceIndex].status.isOnline = true;
      
      writeDevices(devices);
      
      // Broadcast to all clients except sender
      socket.broadcast.emit('location-update', {
        deviceId,
        location: devices[deviceIndex].location
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Agent registration endpoint (used by Python desktop agent)
app.post('/api/devices/location', (req, res) => {
  const { deviceId, type, location, status, deviceInfo, timestamp } = req.body;
  
  console.log(`📱 Device location update from ${deviceId}:`, location);
  
  const devices = readDevices();
  const existingIndex = devices.findIndex((d: any) => d.deviceId === deviceId);
  
  const deviceData = {
    deviceId,
    type: type || 'desktop',
    name: deviceId,
    status: {
      isOnline: true,
      lastSeen: new Date().toISOString(),
      batteryLevel: status?.batteryLevel || 100,
      signalStrength: status?.signalStrength || 85,
      ...status
    },
    location: {
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      accuracy: location?.accuracy || 10,
      lastUpdate: new Date().toISOString(),
      ...location
    },
    settings: {
      updateInterval: 30,
      alertsEnabled: true
    },
    deviceInfo: deviceInfo || {},
    adminCommands: []
  };
  
  if (existingIndex >= 0) {
    devices[existingIndex] = { ...devices[existingIndex], ...deviceData };
  } else {
    devices.push(deviceData);
  }
  
  writeDevices(devices);
  
  // Emit to WebSocket clients
  io.emit('device-registered', deviceData);
  io.emit('location-update', {
    deviceId,
    location: deviceData.location
  });
  
  res.json({ success: true, device: deviceData });
});

// Device admin endpoints
app.post('/api/device-monitor/devices/:deviceId/message', (req, res) => {
  const { deviceId } = req.params;
  const { title, message, type } = req.body;
  
  console.log(`📨 Sending message to ${deviceId}: ${title}`);
  
  // In a real implementation, this would send the message to the device via WebSocket
  // For demo purposes, we'll just log it and return success
  
  // Emit to WebSocket clients (if device is connected)
  io.emit('admin-command', {
    deviceId,
    type: 'message',
    data: { title, message, type }
  });
  
  res.json({ success: true, message: 'Message sent to device' });
});

app.post('/api/device-monitor/devices/:deviceId/lock', (req, res) => {
  const { deviceId } = req.params;
  const { action, duration, message } = req.body;
  
  console.log(`🔒 Locking device ${deviceId} for ${duration} seconds`);
  
  // Emit to WebSocket clients (if device is connected)
  io.emit('admin-command', {
    deviceId,
    type: 'lock',
    data: { action, duration, message }
  });
  
  res.json({ success: true, message: `Device ${action} command sent` });
});

app.post('/api/device-monitor/devices/:deviceId/command', (req, res) => {
  const { deviceId } = req.params;
  const { command, requireConfirmation } = req.body;
  
  console.log(`⚡ Executing command on ${deviceId}: ${command}`);
  
  // Security check - only allow safe commands
  const allowedCommands = ['ls', 'dir', 'whoami', 'hostname', 'systeminfo', 'ps aux', 'netstat'];
  const isAllowed = allowedCommands.some(cmd => command.toLowerCase().startsWith(cmd));
  
  if (!isAllowed) {
    return res.status(403).json({ 
      success: false, 
      error: 'Command not allowed for security reasons' 
    });
  }
  
  // Emit to WebSocket clients (if device is connected)
  io.emit('admin-command', {
    deviceId,
    type: 'command',
    data: { command, requireConfirmation }
  });
  
  res.json({ 
    success: true, 
    message: 'Command sent to device',
    output: 'Command executed successfully (demo mode)' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log('🚀 GPS Tracking Server (Demo Mode) - Ready!');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/socket.io`);
  console.log(`📊 API endpoints: http://localhost:${PORT}/api/device-monitor`);
  console.log('💾 Using file-based storage (no MongoDB required)');
  console.log('');
  console.log('Ready to accept device connections! 🎉');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

export default app;
