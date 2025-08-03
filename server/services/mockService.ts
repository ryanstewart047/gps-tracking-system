// Mock data service for development without MongoDB
export class MockDeviceService {
  static mockDevices = [
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

  static mockLocations = [
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

  static async getDevices() {
    return this.mockDevices;
  }

  static async getCurrentLocation(deviceId: string) {
    return this.mockLocations.find(loc => loc.deviceId === deviceId);
  }
}

export class MockLocationService {
  async getCurrentLocation(deviceId: string) {
    return MockDeviceService.getCurrentLocation(deviceId);
  }

  async saveLocation(data: any) {
    return { ...data, _id: 'mock-id' };
  }
}
