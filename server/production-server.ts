import express from 'express';
import cors from 'cors';
import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Production CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    'https://localhost:3001'
  ],
  credentials: true
}));

app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// MongoDB connection
let db: Db;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gps-tracking';

async function connectToDatabase() {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');
    
    // Create indexes for better performance
    await db.collection('devices').createIndex({ deviceId: 1 }, { unique: true });
    await db.collection('commands').createIndex({ deviceId: 1, timestamp: -1 });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

// Get all devices
app.get('/api/device-monitor/devices', async (req, res) => {
  try {
    const devices = await db.collection('devices').find({}).toArray();
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Register a new device
app.post('/api/device-monitor/devices/register', async (req, res) => {
  try {
    const device = {
      ...req.body,
      status: {
        isOnline: false,
        lastSeen: new Date().toISOString(),
        batteryLevel: 100,
        signalStrength: 0
      },
      settings: {
        updateInterval: 30,
        alertsEnabled: true
      },
      adminCommands: [],
      createdAt: new Date().toISOString()
    };
    
    const result = await db.collection('devices').insertOne(device);
    console.log(`✅ Device registered: ${device.deviceId}`);
    res.json({ success: true, message: 'Device registered successfully', id: result.insertedId });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Device ID already exists' });
    } else {
      console.error('Error registering device:', error);
      res.status(500).json({ error: 'Failed to register device' });
    }
  }
});

// Update device location
app.post('/api/device-monitor/location', async (req, res) => {
  try {
    const { deviceId, latitude, longitude, accuracy, city, country, address } = req.body;
    
    const updateData = {
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy || 0,
        lastUpdate: new Date().toISOString(),
        ...(city && { city }),
        ...(country && { country }),
        ...(address && { address })
      },
      'status.lastSeen': new Date().toISOString(),
      'status.isOnline': true
    };
    
    const result = await db.collection('devices').updateOne(
      { deviceId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    console.log(`📍 Location updated for device: ${deviceId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Send message to device
app.post('/api/device-monitor/devices/:deviceId/message', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { title, message } = req.body;
    
    // Store command in database
    const command = {
      deviceId,
      type: 'message',
      payload: { title, message },
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    await db.collection('commands').insertOne(command);
    
    // Also add to device's adminCommands array for immediate retrieval
    await db.collection('devices').updateOne(
      { deviceId },
      { $push: { adminCommands: command } }
    );
    
    console.log(`💬 Message sent to device: ${deviceId}`);
    res.json({ success: true, message: 'Message sent to device' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Lock device screen
app.post('/api/device-monitor/devices/:deviceId/lock', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const command = {
      deviceId,
      type: 'lock_screen',
      payload: {},
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    await db.collection('commands').insertOne(command);
    await db.collection('devices').updateOne(
      { deviceId },
      { $push: { adminCommands: command } }
    );
    
    console.log(`🔒 Lock command sent to device: ${deviceId}`);
    res.json({ success: true, message: 'Lock command sent to device' });
  } catch (error) {
    console.error('Error sending lock command:', error);
    res.status(500).json({ error: 'Failed to send lock command' });
  }
});

// Execute command on device
app.post('/api/device-monitor/devices/:deviceId/command', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { command: commandText, payload } = req.body;
    
    const command = {
      deviceId,
      type: 'execute_command',
      payload: { command: commandText, ...payload },
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    await db.collection('commands').insertOne(command);
    await db.collection('devices').updateOne(
      { deviceId },
      { $push: { adminCommands: command } }
    );
    
    console.log(`⚡ Command sent to device: ${deviceId} - ${commandText}`);
    res.json({ success: true, message: 'Command sent to device' });
  } catch (error) {
    console.error('Error sending command:', error);
    res.status(500).json({ error: 'Failed to send command' });
  }
});

// Get pending commands for a device (used by device agents)
app.get('/api/device-monitor/devices/:deviceId/commands', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const commands = await db.collection('commands')
      .find({ deviceId, status: 'pending' })
      .sort({ timestamp: 1 })
      .toArray();
    
    res.json(commands);
  } catch (error) {
    console.error('Error fetching commands:', error);
    res.status(500).json({ error: 'Failed to fetch commands' });
  }
});

// Mark command as executed
app.post('/api/device-monitor/commands/:commandId/complete', async (req, res) => {
  try {
    const { commandId } = req.params;
    const { result, error } = req.body;
    
    await db.collection('commands').updateOne(
      { _id: commandId },
      { 
        $set: { 
          status: error ? 'failed' : 'completed',
          result,
          error,
          completedAt: new Date().toISOString()
        }
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error completing command:', error);
    res.status(500).json({ error: 'Failed to complete command' });
  }
});

// Catch-all handler for React routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Start server
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`🚀 GPS Tracking Server running on port ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 CORS Origins: ${process.env.CORS_ORIGIN || 'localhost'}`);
  });
});

export default app;
