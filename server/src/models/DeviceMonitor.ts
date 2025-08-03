import { Schema, model, Document } from 'mongoose';

export interface IDeviceMonitor extends Document {
  deviceId: string;
  type: 'desktop' | 'mobile' | 'gps_tracker';
  platform?: string;
  platformVersion?: string;
  deviceInfo: {
    hostname?: string;
    username?: string;
    deviceName?: string;
    brand?: string;
    model?: string;
    processor?: string;
    architecture?: string;
    appVersion?: string;
    buildNumber?: string;
    isEmulator?: boolean;
  };
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    method?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  status: {
    battery?: number;
    charging?: boolean;
    cpu?: number;
    memory?: number;
    disk?: number;
    networkConnections?: number;
    processes?: number;
    uptime?: number;
    online: boolean;
    lastSeen: Date;
  };
  adminCommands: [{
    command: string;
    payload: any;
    executedAt?: Date;
    response?: any;
    status: 'pending' | 'executed' | 'failed';
  }];
  alerts: [{
    type: 'location' | 'battery' | 'offline' | 'admin';
    message: string;
    severity: 'low' | 'medium' | 'high';
    createdAt: Date;
    acknowledged: boolean;
  }];
  settings: {
    locationUpdateInterval: number;
    allowRemoteCommands: boolean;
    allowScreenLock: boolean;
    allowMessages: boolean;
    geofenceEnabled: boolean;
    geofenceRadius: number;
    geofenceCenter: {
      latitude: number;
      longitude: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const deviceMonitorSchema = new Schema<IDeviceMonitor>({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['desktop', 'mobile', 'gps_tracker'],
    index: true
  },
  platform: String,
  platformVersion: String,
  deviceInfo: {
    hostname: String,
    username: String,
    deviceName: String,
    brand: String,
    model: String,
    processor: String,
    architecture: String,
    appVersion: String,
    buildNumber: String,
    isEmulator: Boolean
  },
  location: {
    latitude: { type: Number, required: true, index: '2dsphere' },
    longitude: { type: Number, required: true, index: '2dsphere' },
    accuracy: Number,
    altitude: Number,
    heading: Number,
    speed: Number,
    method: String,
    address: String,
    city: String,
    country: String
  },
  status: {
    battery: Number,
    charging: Boolean,
    cpu: Number,
    memory: Number,
    disk: Number,
    networkConnections: Number,
    processes: Number,
    uptime: Number,
    online: { type: Boolean, default: true, index: true },
    lastSeen: { type: Date, default: Date.now, index: true }
  },
  adminCommands: [{
    command: { type: String, required: true },
    payload: Schema.Types.Mixed,
    executedAt: Date,
    response: Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['pending', 'executed', 'failed'],
      default: 'pending'
    }
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['location', 'battery', 'offline', 'admin'],
      required: true
    },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    createdAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false }
  }],
  settings: {
    locationUpdateInterval: { type: Number, default: 30 },
    allowRemoteCommands: { type: Boolean, default: true },
    allowScreenLock: { type: Boolean, default: false },
    allowMessages: { type: Boolean, default: true },
    geofenceEnabled: { type: Boolean, default: false },
    geofenceRadius: { type: Number, default: 1000 },
    geofenceCenter: {
      latitude: Number,
      longitude: Number
    }
  }
}, {
  timestamps: true,
  collection: 'devicemonitors'
});

// Indexes for common queries
deviceMonitorSchema.index({ 'status.online': 1, 'status.lastSeen': -1 });
deviceMonitorSchema.index({ type: 1, 'status.online': 1 });
deviceMonitorSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// TTL index to automatically remove old offline devices (optional)
deviceMonitorSchema.index({ 'status.lastSeen': 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

export const DeviceMonitor = model<IDeviceMonitor>('DeviceMonitor', deviceMonitorSchema);
