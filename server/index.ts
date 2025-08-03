import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import deviceRoutes from './routes/devices';
import locationRoutes from './routes/locations';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import { createDeviceMonitorRoutes } from './src/routes/deviceMonitor';

// Import middleware
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

// Import services
import { LocationService } from './services/LocationService';
import { WebSocketService as LegacyWebSocketService } from './services/WebSocketService';
import { WebSocketService } from './src/services/WebSocketService';
import { MQTTService } from './services/MQTTService';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gps-tracking';

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
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/devices', authenticateToken, deviceRoutes);
app.use('/api/locations', authenticateToken, locationRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// WebSocket endpoint for device data (no auth required for devices)
app.post('/api/device-data', async (req, res) => {
  try {
    const { deviceId, latitude, longitude, timestamp, batteryLevel, signal } = req.body;
    
    // Validate required fields
    if (!deviceId || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Process location data
    const locationService = new LocationService();
    const location = await locationService.saveLocation({
      deviceId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      batteryLevel: batteryLevel ? parseInt(batteryLevel) : undefined,
      signalStrength: signal ? parseInt(signal) : undefined
    });

    // Note: WebSocket broadcasting will be handled by the device monitoring system
    res.json({ success: true, locationId: location._id });
  } catch (error) {
    console.error('Device data processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Initialize WebSocket service for device monitoring
    const wsService = new WebSocketService(server);
    
    // Add device monitoring routes
    app.use('/api/device-monitor', createDeviceMonitorRoutes(wsService));
    
    // Initialize MQTT service if enabled
    if (process.env.MQTT_ENABLED === 'true') {
      const mqttService = new MQTTService();
      mqttService.connect().then(() => {
        console.log('✅ MQTT service connected');
      }).catch((error) => {
        console.error('❌ MQTT connection failed:', error);
      });
    }
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/socket.io`);
      console.log(`📱 Device monitoring: http://localhost:${PORT}/api/device-monitor`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

export default app;
