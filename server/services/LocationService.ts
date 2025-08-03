import { ILocation, Location } from '../models/Location';
import { IDevice, Device } from '../models/Device';

export interface LocationData {
  deviceId: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
  batteryLevel?: number;
  signalStrength?: number;
  isOfflineData?: boolean;
}

export class LocationService {
  async saveLocation(data: LocationData): Promise<ILocation> {
    try {
      // Create location record
      const location = new Location({
        deviceId: data.deviceId,
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading,
        timestamp: data.timestamp,
        batteryLevel: data.batteryLevel,
        signalStrength: data.signalStrength,
        isOfflineData: data.isOfflineData || false,
        syncedAt: data.isOfflineData ? new Date() : undefined
      });

      const savedLocation = await location.save();

      // Update device last seen and status
      await this.updateDeviceStatus(data.deviceId, {
        lastSeen: data.timestamp,
        batteryLevel: data.batteryLevel,
        signalStrength: data.signalStrength
      });

      return savedLocation;
    } catch (error) {
      console.error('Error saving location:', error);
      throw new Error('Failed to save location data');
    }
  }

  async getLocationHistory(deviceId: string, limit = 100, offset = 0): Promise<ILocation[]> {
    try {
      return await Location.find({ deviceId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .exec();
    } catch (error) {
      console.error('Error getting location history:', error);
      throw new Error('Failed to retrieve location history');
    }
  }

  async getLocationsByTimeRange(
    deviceId: string, 
    startTime: Date, 
    endTime: Date
  ): Promise<ILocation[]> {
    try {
      return await Location.find({
        deviceId,
        timestamp: { $gte: startTime, $lte: endTime }
      })
        .sort({ timestamp: 1 })
        .exec();
    } catch (error) {
      console.error('Error getting locations by time range:', error);
      throw new Error('Failed to retrieve locations for time range');
    }
  }

  async getCurrentLocation(deviceId: string): Promise<ILocation | null> {
    try {
      return await Location.findOne({ deviceId })
        .sort({ timestamp: -1 })
        .exec();
    } catch (error) {
      console.error('Error getting current location:', error);
      throw new Error('Failed to retrieve current location');
    }
  }

  async getOfflineData(deviceId: string): Promise<ILocation[]> {
    try {
      return await Location.find({ 
        deviceId, 
        isOfflineData: true 
      })
        .sort({ timestamp: -1 })
        .exec();
    } catch (error) {
      console.error('Error getting offline data:', error);
      throw new Error('Failed to retrieve offline data');
    }
  }

  async deleteOldLocations(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await Location.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error deleting old locations:', error);
      throw new Error('Failed to delete old locations');
    }
  }

  async getLocationStats(deviceId: string, days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await Location.aggregate([
        {
          $match: {
            deviceId,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalPoints: { $sum: 1 },
            averageSpeed: { $avg: '$speed' },
            maxSpeed: { $max: '$speed' },
            averageBattery: { $avg: '$batteryLevel' },
            minBattery: { $min: '$batteryLevel' },
            averageSignal: { $avg: '$signalStrength' },
            minSignal: { $min: '$signalStrength' },
            firstLocation: { $first: '$$ROOT' },
            lastLocation: { $last: '$$ROOT' }
          }
        }
      ]);

      return stats[0] || null;
    } catch (error) {
      console.error('Error getting location stats:', error);
      throw new Error('Failed to calculate location statistics');
    }
  }

  private async updateDeviceStatus(
    deviceId: string, 
    updates: Partial<IDevice>
  ): Promise<void> {
    try {
      await Device.findOneAndUpdate(
        { deviceId },
        { $set: updates },
        { upsert: false }
      );
    } catch (error) {
      console.error('Error updating device status:', error);
      // Don't throw error here as location saving is more important
    }
  }

  async calculateDistance(locations: ILocation[]): Promise<number> {
    if (locations.length < 2) return 0;

    let totalDistance = 0;
    
    for (let i = 1; i < locations.length; i++) {
      const distance = this.haversineDistance(
        locations[i - 1].latitude,
        locations[i - 1].longitude,
        locations[i].latitude,
        locations[i].longitude
      );
      totalDistance += distance;
    }

    return totalDistance;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
