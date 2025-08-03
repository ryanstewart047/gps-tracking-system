import * as mqtt from 'mqtt';

export class MQTTService {
  private client: mqtt.MqttClient | null = null;
  private brokerUrl: string;
  private options: mqtt.IClientOptions;

  constructor() {
    this.brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    this.options = {
      clientId: `gps_server_${Math.random().toString(16).substr(2, 8)}`,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      keepalive: 60,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
        topic: 'gps/server/status',
        payload: 'offline',
        qos: 1,
        retain: true
      }
    };
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.client = mqtt.connect(this.brokerUrl, this.options);

        this.client.on('connect', () => {
          console.log('✅ MQTT connected to broker');
          this.setupSubscriptions();
          this.publishServerStatus('online');
          resolve();
        });

        this.client.on('error', (error) => {
          console.error('❌ MQTT connection error:', error);
          reject(error);
        });

        this.client.on('close', () => {
          console.log('🔌 MQTT connection closed');
        });

        this.client.on('reconnect', () => {
          console.log('🔄 MQTT reconnecting...');
        });

        this.client.on('message', this.handleMessage.bind(this));

      } catch (error) {
        reject(error);
      }
    });
  }

  private setupSubscriptions(): void {
    if (!this.client) return;

    const topics = [
      'gps/+/location',      // Device location updates
      'gps/+/status',        // Device status updates
      'gps/+/heartbeat',     // Device heartbeat
      'gps/+/emergency',     // Emergency alerts
      'gps/+/offline_data',  // Offline data sync
    ];

    topics.forEach(topic => {
      this.client!.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          console.error(`Failed to subscribe to ${topic}:`, error);
        } else {
          console.log(`📡 Subscribed to MQTT topic: ${topic}`);
        }
      });
    });
  }

  private handleMessage(topic: string, message: Buffer): void {
    try {
      const data = JSON.parse(message.toString());
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];
      const messageType = topicParts[2];

      console.log(`📨 MQTT message received - Topic: ${topic}, Device: ${deviceId}`);

      switch (messageType) {
        case 'location':
          this.handleLocationUpdate(deviceId, data);
          break;
        case 'status':
          this.handleStatusUpdate(deviceId, data);
          break;
        case 'heartbeat':
          this.handleHeartbeat(deviceId, data);
          break;
        case 'emergency':
          this.handleEmergency(deviceId, data);
          break;
        case 'offline_data':
          this.handleOfflineData(deviceId, data);
          break;
        default:
          console.log(`Unknown message type: ${messageType}`);
      }
    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  }

  private handleLocationUpdate(deviceId: string, data: any): void {
    // This would integrate with your LocationService
    console.log(`Location update for ${deviceId}:`, data);
    
    // Example: Forward to WebSocket clients
    // this.webSocketService.broadcastLocationUpdate(data);
  }

  private handleStatusUpdate(deviceId: string, data: any): void {
    console.log(`Status update for ${deviceId}:`, data);
    
    // Update device status in database
    // this.deviceService.updateStatus(deviceId, data);
  }

  private handleHeartbeat(deviceId: string, data: any): void {
    console.log(`Heartbeat from ${deviceId}:`, data);
    
    // Update last seen timestamp
    // this.deviceService.updateLastSeen(deviceId);
  }

  private handleEmergency(deviceId: string, data: any): void {
    console.log(`🚨 EMERGENCY ALERT from ${deviceId}:`, data);
    
    // Handle emergency situation
    // this.emergencyService.handleAlert(deviceId, data);
    // this.webSocketService.broadcastEmergencyAlert(deviceId, data);
  }

  private handleOfflineData(deviceId: string, data: any): void {
    console.log(`Offline data sync from ${deviceId}:`, data);
    
    // Process offline data batch
    // this.locationService.processBatchData(deviceId, data);
  }

  // Publish methods for server-to-device communication

  publishDeviceCommand(deviceId: string, command: string, params?: any): void {
    if (!this.client) return;

    const topic = `gps/${deviceId}/command`;
    const payload = JSON.stringify({
      command,
      params,
      timestamp: new Date().toISOString()
    });

    this.client.publish(topic, payload, { qos: 1 }, (error) => {
      if (error) {
        console.error(`Failed to publish command to ${deviceId}:`, error);
      } else {
        console.log(`📤 Published command '${command}' to ${deviceId}`);
      }
    });
  }

  publishConfigUpdate(deviceId: string, config: any): void {
    if (!this.client) return;

    const topic = `gps/${deviceId}/config`;
    const payload = JSON.stringify({
      config,
      timestamp: new Date().toISOString()
    });

    this.client.publish(topic, payload, { qos: 1 }, (error) => {
      if (error) {
        console.error(`Failed to publish config to ${deviceId}:`, error);
      } else {
        console.log(`📤 Published config update to ${deviceId}`);
      }
    });
  }

  publishFirmwareUpdate(deviceId: string, updateInfo: any): void {
    if (!this.client) return;

    const topic = `gps/${deviceId}/firmware_update`;
    const payload = JSON.stringify(updateInfo);

    this.client.publish(topic, payload, { qos: 1 }, (error) => {
      if (error) {
        console.error(`Failed to publish firmware update to ${deviceId}:`, error);
      } else {
        console.log(`📤 Published firmware update to ${deviceId}`);
      }
    });
  }

  publishServerStatus(status: 'online' | 'offline'): void {
    if (!this.client) return;

    const topic = 'gps/server/status';
    const payload = JSON.stringify({
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });

    this.client.publish(topic, payload, { qos: 1, retain: true }, (error) => {
      if (error) {
        console.error('Failed to publish server status:', error);
      } else {
        console.log(`📤 Published server status: ${status}`);
      }
    });
  }

  requestLocationUpdate(deviceId: string): void {
    this.publishDeviceCommand(deviceId, 'request_location');
  }

  requestDeviceRestart(deviceId: string): void {
    this.publishDeviceCommand(deviceId, 'restart');
  }

  updateReportingInterval(deviceId: string, intervalSeconds: number): void {
    this.publishConfigUpdate(deviceId, {
      reportingInterval: intervalSeconds
    });
  }

  disconnect(): void {
    if (this.client) {
      this.publishServerStatus('offline');
      this.client.end(false, {}, () => {
        console.log('🔌 MQTT client disconnected');
      });
    }
  }
}
