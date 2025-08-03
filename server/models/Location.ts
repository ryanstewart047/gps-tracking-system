import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
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
  address?: string;
  isOfflineData: boolean;
  syncedAt?: Date;
  createdAt: Date;
}

const LocationSchema = new Schema<ILocation>({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  altitude: {
    type: Number
  },
  accuracy: {
    type: Number,
    min: 0
  },
  speed: {
    type: Number,
    min: 0
  },
  heading: {
    type: Number,
    min: 0,
    max: 360
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
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
  address: {
    type: String
  },
  isOfflineData: {
    type: Boolean,
    default: false
  },
  syncedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
LocationSchema.index({ deviceId: 1, timestamp: -1 });
LocationSchema.index({ deviceId: 1, createdAt: -1 });
LocationSchema.index({ isOfflineData: 1, syncedAt: 1 });

// Index for geospatial queries (2dsphere for location-based searches)
LocationSchema.index({ 
  location: '2dsphere' 
});

// Virtual for GeoJSON format
LocationSchema.virtual('location').get(function() {
  return {
    type: 'Point',
    coordinates: [this.longitude, this.latitude]
  };
});

export const Location = mongoose.model<ILocation>('Location', LocationSchema);
