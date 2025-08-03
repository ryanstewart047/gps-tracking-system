import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  name: string;
  userId: string;
  isActive: boolean;
  lastSeen?: Date;
  batteryLevel?: number;
  signalStrength?: number;
  settings: {
    reportingInterval: number; // in seconds
    batteryThreshold: number;
    geofencing: boolean;
  };
  metadata: {
    model?: string;
    firmware?: string;
    imei?: string;
    phoneNumber?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  signalStrength: {
    type: Number,
    min: 0,
    max: 100
  },
  settings: {
    reportingInterval: {
      type: Number,
      default: 30, // 30 seconds
      min: 5,
      max: 3600
    },
    batteryThreshold: {
      type: Number,
      default: 20,
      min: 5,
      max: 50
    },
    geofencing: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    model: String,
    firmware: String,
    imei: String,
    phoneNumber: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for online status (device is online if last seen within 2 minutes)
DeviceSchema.virtual('isOnline').get(function() {
  if (!this.lastSeen) return false;
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  return this.lastSeen > twoMinutesAgo;
});

// Index for efficient queries
DeviceSchema.index({ userId: 1, isActive: 1 });
DeviceSchema.index({ lastSeen: 1 });

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
