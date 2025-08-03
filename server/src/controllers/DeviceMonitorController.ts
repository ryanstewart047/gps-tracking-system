import { Request, Response } from 'express';
import { DeviceMonitor, IDeviceMonitor } from '../models/DeviceMonitor';
import { WebSocketService } from '../services/WebSocketService';

export class DeviceMonitorController {
  private wsService: WebSocketService;

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
  }

  // Get all monitored devices
  async getAllDevices(req: Request, res: Response) {
    try {
      const { type, online, page = 1, limit = 50 } = req.query;
      
      const query: any = {};
      if (type) query.type = type;
      if (online !== undefined) query['status.online'] = online === 'true';

      const skip = (Number(page) - 1) * Number(limit);

      const devices = await DeviceMonitor
        .find(query)
        .sort({ 'status.lastSeen': -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-adminCommands -alerts')
        .lean();

      const total = await DeviceMonitor.countDocuments(query);

      res.json({
        success: true,
        data: devices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get devices error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch devices'
      });
    }
  }

  // Get device by ID
  async getDevice(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      
      const device = await DeviceMonitor.findOne({ deviceId }).lean();
      
      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      res.json({
        success: true,
        data: device
      });
    } catch (error) {
      console.error('Get device error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch device'
      });
    }
  }

  // Update device location and status
  async updateDeviceLocation(req: Request, res: Response) {
    try {
      const { deviceId, type, location, status, deviceInfo } = req.body;

      if (!deviceId || !location) {
        return res.status(400).json({
          success: false,
          error: 'Device ID and location are required'
        });
      }

      // Check if device exists
      let device = await DeviceMonitor.findOne({ deviceId });

      const updateData: any = {
        location,
        status: {
          ...status,
          online: true,
          lastSeen: new Date()
        },
        updatedAt: new Date()
      };

      if (deviceInfo) {
        updateData.deviceInfo = deviceInfo;
        updateData.platform = deviceInfo.platform;
        updateData.platformVersion = deviceInfo.platformVersion;
      }

      if (device) {
        // Update existing device
        device = await DeviceMonitor.findOneAndUpdate(
          { deviceId },
          { $set: updateData },
          { new: true, upsert: false }
        );
      } else {
        // Create new device
        device = new DeviceMonitor({
          deviceId,
          type: type || 'desktop',
          ...updateData,
          settings: {
            locationUpdateInterval: 30,
            allowRemoteCommands: true,
            allowScreenLock: false,
            allowMessages: true,
            geofenceEnabled: false,
            geofenceRadius: 1000
          }
        });
        await device.save();
      }

      // Check for alerts
      await this.checkDeviceAlerts(device);

      // Broadcast update to connected clients
      this.wsService.broadcastToClients('device_update', {
        deviceId,
        location,
        status: updateData.status,
        type: device.type
      });

      res.json({
        success: true,
        data: {
          deviceId,
          message: 'Location updated successfully'
        }
      });
    } catch (error) {
      console.error('Update device location error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update device location'
      });
    }
  }

  // Send command to device
  async sendCommand(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const { command, payload } = req.body;

      const device = await DeviceMonitor.findOne({ deviceId });
      
      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      if (!device.status.online) {
        return res.status(400).json({
          success: false,
          error: 'Device is offline'
        });
      }

      // Add command to device's command queue
      const commandEntry = {
        command,
        payload,
        status: 'pending' as const
      };

      device.adminCommands.push(commandEntry);
      await device.save();

      // Get the command ID after saving
      const savedDevice = await DeviceMonitor.findOne({ deviceId });
      const savedCommand = savedDevice?.adminCommands[savedDevice.adminCommands.length - 1];

      // Send command via WebSocket
      const success = this.wsService.sendToDevice(deviceId, {
        command,
        payload,
        requestId: `cmd_${Date.now()}`
      });

      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to send command to device'
        });
      }

      res.json({
        success: true,
        data: {
          message: 'Command sent successfully'
        }
      });
    } catch (error) {
      console.error('Send command error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send command'
      });
    }
  }

  // Send message to device
  async sendMessage(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const { title, message } = req.body;

      const device = await DeviceMonitor.findOne({ deviceId });
      
      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      if (!device.settings.allowMessages) {
        return res.status(400).json({
          success: false,
          error: 'Device does not allow messages'
        });
      }

      // Send message via WebSocket
      const success = this.wsService.sendToDevice(deviceId, {
        command: 'show_message',
        payload: { title, message }
      });

      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to send message to device'
        });
      }

      // Log the message
      device.alerts.push({
        type: 'admin',
        message: `Message sent: ${title}`,
        severity: 'low',
        createdAt: new Date(),
        acknowledged: false
      });
      await device.save();

      res.json({
        success: true,
        data: {
          message: 'Message sent successfully'
        }
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }

  // Lock device screen
  async lockDevice(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;

      const device = await DeviceMonitor.findOne({ deviceId });
      
      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      if (!device.settings.allowScreenLock) {
        return res.status(400).json({
          success: false,
          error: 'Device does not allow screen lock'
        });
      }

      // Send lock command via WebSocket
      const success = this.wsService.sendToDevice(deviceId, {
        command: 'lock_screen',
        payload: {}
      });

      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to send lock command to device'
        });
      }

      // Log the action
      device.alerts.push({
        type: 'admin',
        message: 'Screen lock command sent',
        severity: 'medium',
        createdAt: new Date(),
        acknowledged: false
      });
      await device.save();

      res.json({
        success: true,
        data: {
          message: 'Lock command sent successfully'
        }
      });
    } catch (error) {
      console.error('Lock device error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to lock device'
      });
    }
  }

  // Get device alerts
  async getDeviceAlerts(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const { acknowledged } = req.query;

      const query: any = { deviceId };
      
      const device = await DeviceMonitor.findOne({ deviceId }).lean();
      
      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      let alerts = [...device.alerts];
      
      if (acknowledged !== undefined) {
        alerts = alerts.filter(alert => alert.acknowledged === (acknowledged === 'true'));
      }

      // Sort by creation date (newest first)
      alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Get device alerts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch device alerts'
      });
    }
  }

  // Update device settings
  async updateDeviceSettings(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const settings = req.body;

      const device = await DeviceMonitor.findOneAndUpdate(
        { deviceId },
        { $set: { settings } },
        { new: true }
      );

      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found'
        });
      }

      res.json({
        success: true,
        data: {
          settings: device.settings,
          message: 'Settings updated successfully'
        }
      });
    } catch (error) {
      console.error('Update device settings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update device settings'
      });
    }
  }

  // Get device statistics
  async getDeviceStats(req: Request, res: Response) {
    try {
      const stats = await DeviceMonitor.aggregate([
        {
          $group: {
            _id: null,
            totalDevices: { $sum: 1 },
            onlineDevices: {
              $sum: {
                $cond: ['$status.online', 1, 0]
              }
            },
            desktopDevices: {
              $sum: {
                $cond: [{ $eq: ['$type', 'desktop'] }, 1, 0]
              }
            },
            mobileDevices: {
              $sum: {
                $cond: [{ $eq: ['$type', 'mobile'] }, 1, 0]
              }
            },
            gpsTrackers: {
              $sum: {
                $cond: [{ $eq: ['$type', 'gps_tracker'] }, 1, 0]
              }
            },
            avgBattery: { $avg: '$status.battery' }
          }
        }
      ]);

      // Get recent alerts
      const recentAlerts = await DeviceMonitor.aggregate([
        { $unwind: '$alerts' },
        { $match: { 'alerts.acknowledged': false } },
        { $sort: { 'alerts.createdAt': -1 } },
        { $limit: 10 },
        {
          $project: {
            deviceId: 1,
            type: 1,
            alert: '$alerts'
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          stats: stats[0] || {
            totalDevices: 0,
            onlineDevices: 0,
            desktopDevices: 0,
            mobileDevices: 0,
            gpsTrackers: 0,
            avgBattery: 0
          },
          recentAlerts
        }
      });
    } catch (error) {
      console.error('Get device stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch device statistics'
      });
    }
  }

  // Private method to check for alerts
  private async checkDeviceAlerts(device: IDeviceMonitor) {
    const alerts = [];

    // Battery alert
    if (device.status.battery && device.status.battery < 20) {
      alerts.push({
        type: 'battery' as const,
        message: `Low battery: ${device.status.battery}%`,
        severity: device.status.battery < 10 ? 'high' as const : 'medium' as const,
        createdAt: new Date(),
        acknowledged: false
      });
    }

    // Geofence alert
    if (device.settings.geofenceEnabled && device.settings.geofenceCenter) {
      const distance = this.calculateDistance(
        device.location.latitude,
        device.location.longitude,
        device.settings.geofenceCenter.latitude,
        device.settings.geofenceCenter.longitude
      );

      if (distance > device.settings.geofenceRadius) {
        alerts.push({
          type: 'location' as const,
          message: `Device outside geofence (${Math.round(distance)}m away)`,
          severity: 'high' as const,
          createdAt: new Date(),
          acknowledged: false
        });
      }
    }

    // Add alerts to device
    if (alerts.length > 0) {
      device.alerts.push(...alerts);
      await device.save();

      // Broadcast alerts
      alerts.forEach(alert => {
        this.wsService.broadcastToClients('device_alert', {
          deviceId: device.deviceId,
          alert
        });
      });
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
