import { Router, Request, Response } from 'express';

const router = Router();

// Mock data for development
const mockDevices = [
  {
    deviceId: 'GPS001',
    name: 'Vehicle A',
    isActive: true,
    lastSeen: new Date(),
    batteryLevel: 85,
    signalStrength: 90,
    userId: 'user1'
  },
  {
    deviceId: 'GPS002', 
    name: 'Vehicle B',
    isActive: false,
    lastSeen: new Date(Date.now() - 300000),
    batteryLevel: 45,
    signalStrength: 60,
    userId: 'user1'
  }
];

const mockLocations = [
  {
    deviceId: 'GPS001',
    latitude: 37.7749,
    longitude: -122.4194,
    timestamp: new Date(),
    batteryLevel: 85,
    signalStrength: 90
  },
  {
    deviceId: 'GPS002',
    latitude: 37.7849,
    longitude: -122.4094,
    timestamp: new Date(Date.now() - 300000),
    batteryLevel: 45,
    signalStrength: 60
  }
];

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview data
// @access  Private
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const devices = mockDevices;
    
    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => {
      if (!d.lastSeen) return false;
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      return d.lastSeen > twoMinutesAgo;
    }).length;

    const recentLocations = mockLocations.slice(0, 10);
    const lowBatteryDevices = devices.filter(d => d.batteryLevel <= 20);

    res.json({
      overview: {
        totalDevices,
        onlineDevices,
        offlineDevices: totalDevices - onlineDevices,
        lowBatteryDevices: lowBatteryDevices.length
      },
      recentActivity: recentLocations,
      alerts: {
        lowBattery: lowBatteryDevices.map(d => ({
          deviceId: d.deviceId,
          name: d.name,
          batteryLevel: d.batteryLevel
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// @route   GET /api/dashboard/devices/status
// @desc    Get devices with their current status
// @access  Private
router.get('/devices/status', async (req: Request, res: Response) => {
  try {
    const devicesWithStatus = mockDevices.map(device => {
      const currentLocation = mockLocations.find(loc => loc.deviceId === device.deviceId);
      
      return {
        deviceId: device.deviceId,
        name: device.name,
        isOnline: device.isActive && device.lastSeen && (new Date().getTime() - device.lastSeen.getTime()) < 300000,
        lastSeen: device.lastSeen,
        batteryLevel: device.batteryLevel,
        signalStrength: device.signalStrength,
        currentLocation: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timestamp: currentLocation.timestamp
        } : null
      };
    });

    res.json(devicesWithStatus);
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({ error: 'Failed to fetch device status' });
  }
});

// @route   GET /api/dashboard/analytics
// @desc    Get analytics data for dashboard  
// @access  Private
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;

    // Generate mock analytics data
    const dailyActivity = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailyActivity.push({
        _id: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 100) + 20
      });
    }

    const deviceActivity = mockDevices.map(device => ({
      deviceId: device.deviceId,
      name: device.name,
      totalLocations: Math.floor(Math.random() * 500) + 100,
      avgBattery: Math.floor(Math.random() * 40) + 60
    }));

    res.json({
      dailyActivity: dailyActivity.reverse(),
      deviceActivity,
      summary: {
        totalLocations: dailyActivity.reduce((sum, day) => sum + day.count, 0),
        averageBattery: Math.floor(Math.random() * 30) + 70,
        dataQuality: Math.floor(Math.random() * 20) + 80
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

export default router;
