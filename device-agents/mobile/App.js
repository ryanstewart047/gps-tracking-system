import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  AppState,
  PermissionsAndroid,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import DeviceInfo from 'react-native-device-info';
import PushNotification from 'react-native-push-notification';
import BackgroundJob from 'react-native-background-job';

class DeviceMonitorService {
  constructor() {
    this.serverUrl = 'http://localhost:3000';
    this.deviceId = '';
    this.authToken = '';
    this.ws = null;
    this.locationWatchId = null;
    this.isRunning = false;
    
    this.setupNotifications();
  }
  
  async initialize() {
    // Get device ID
    this.deviceId = await DeviceInfo.getUniqueId();
    
    // Load configuration
    const config = await AsyncStorage.getItem('device_config');
    if (config) {
      const parsedConfig = JSON.parse(config);
      this.serverUrl = parsedConfig.serverUrl || this.serverUrl;
      this.authToken = parsedConfig.authToken || 'demo-token';
    }
    
    // Request permissions
    await this.requestPermissions();
    
    console.log('Device Monitor initialized:', this.deviceId);
  }
  
  async requestPermissions() {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        PermissionsAndroid.PERMISSIONS.WAKE_LOCK,
      ];
      
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      Object.keys(granted).forEach(permission => {
        if (granted[permission] !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn(`Permission ${permission} not granted`);
        }
      });
    }
  }
  
  setupNotifications() {
    PushNotification.configure({
      onNotification: function(notification) {
        console.log('Notification received:', notification);
        
        if (notification.userInteraction) {
          // User tapped notification
          this.handleNotificationTap(notification);
        }
      }.bind(this),
      
      onRegistrationError: function(err) {
        console.error('Notification registration error:', err);
      },
      
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });
    
    // Create notification channel for Android
    PushNotification.createChannel({
      channelId: 'device-monitor',
      channelName: 'Device Monitor',
      channelDescription: 'Device monitoring and admin messages',
      soundName: 'default',
      importance: 4,
      vibrate: true,
    });
  }
  
  async getDeviceInfo() {
    return {
      deviceId: this.deviceId,
      type: 'mobile',
      platform: Platform.OS,
      platformVersion: Platform.Version,
      appVersion: DeviceInfo.getVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      deviceName: await DeviceInfo.getDeviceName(),
      brand: DeviceInfo.getBrand(),
      model: DeviceInfo.getModel(),
      systemName: DeviceInfo.getSystemName(),
      systemVersion: DeviceInfo.getSystemVersion(),
      batteryLevel: await DeviceInfo.getBatteryLevel(),
      isEmulator: await DeviceInfo.isEmulator(),
      hasNotch: DeviceInfo.hasNotch(),
      startTime: new Date().toISOString(),
    };
  }
  
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude, accuracy, altitude, heading, speed} = position.coords;
          resolve({
            latitude,
            longitude,
            accuracy,
            altitude,
            heading,
            speed,
            timestamp: position.timestamp,
            method: 'gps',
          });
        },
        error => {
          console.error('Location error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }
  
  async sendLocationUpdate() {
    try {
      const location = await this.getCurrentLocation();
      const deviceInfo = await this.getDeviceInfo();
      const batteryLevel = await DeviceInfo.getBatteryLevel();
      
      const data = {
        deviceId: this.deviceId,
        type: 'mobile',
        location,
        status: {
          battery: Math.round(batteryLevel * 100),
          charging: await DeviceInfo.isBatteryCharging(),
          timestamp: new Date().toISOString(),
        },
        deviceInfo,
        timestamp: new Date().toISOString(),
      };
      
      // Send to server
      const response = await fetch(`${this.serverUrl}/api/devices/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        console.log('Location update sent successfully');
        return true;
      } else {
        console.error('Failed to send location update:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Location update error:', error);
      return false;
    }
  }
  
  connectWebSocket() {
    try {
      const wsUrl = this.serverUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      this.ws = new WebSocket(`${wsUrl}/ws/device/${this.deviceId}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        
        // Send device registration
        this.ws.send(JSON.stringify({
          type: 'device_registration',
          deviceId: this.deviceId,
          deviceInfo: this.getDeviceInfo(),
          authToken: this.authToken,
        }));
      };
      
      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(JSON.parse(event.data));
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket closed');
        if (this.isRunning) {
          // Reconnect after 10 seconds
          setTimeout(() => this.connectWebSocket(), 10000);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }
  
  handleWebSocketMessage(data) {
    const {command, payload} = data;
    
    console.log('Received command:', command);
    
    switch (command) {
      case 'show_message':
        this.showMessage(payload.title, payload.message);
        break;
        
      case 'send_notification':
        this.sendNotification(payload.title, payload.message);
        break;
        
      case 'get_status':
        this.sendStatusResponse(data.requestId);
        break;
        
      case 'lock_screen':
        this.lockScreen();
        break;
        
      case 'ping':
        this.sendPong(data.requestId);
        break;
        
      default:
        console.log('Unknown command:', command);
    }
  }
  
  showMessage(title, message) {
    Alert.alert(
      title || 'Admin Message',
      message || 'No message content',
      [
        {
          text: 'OK',
          onPress: () => {
            this.sendConfirmation('message_shown', {title});
          },
        },
      ]
    );
  }
  
  sendNotification(title, message) {
    PushNotification.localNotification({
      channelId: 'device-monitor',
      title: title || 'Device Monitor',
      message: message || 'New admin message',
      playSound: true,
      soundName: 'default',
    });
    
    this.sendConfirmation('notification_sent', {title});
  }
  
  lockScreen() {
    // On mobile, we can't directly lock the screen for security reasons
    // Instead, we'll show a fullscreen overlay or minimize the app
    
    if (Platform.OS === 'android') {
      // Minimize app (similar to pressing home button)
      DeviceEventEmitter.emit('lockScreen');
    }
    
    this.sendConfirmation('screen_lock_requested', {
      success: true,
      note: 'Mobile devices cannot be remotely locked for security reasons',
    });
  }
  
  async sendStatusResponse(requestId) {
    const deviceInfo = await this.getDeviceInfo();
    const location = await this.getCurrentLocation().catch(() => null);
    
    const response = {
      type: 'status_response',
      requestId,
      deviceId: this.deviceId,
      status: {
        battery: Math.round((await DeviceInfo.getBatteryLevel()) * 100),
        charging: await DeviceInfo.isBatteryCharging(),
        timestamp: new Date().toISOString(),
      },
      location,
      deviceInfo,
    };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(response));
    }
  }
  
  sendPong(requestId) {
    const response = {
      type: 'pong',
      requestId,
      deviceId: this.deviceId,
      timestamp: new Date().toISOString(),
    };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(response));
    }
  }
  
  sendConfirmation(action, data) {
    const message = {
      type: 'confirmation',
      deviceId: this.deviceId,
      action,
      data,
      timestamp: new Date().toISOString(),
    };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  startLocationTracking() {
    // Watch position changes
    this.locationWatchId = Geolocation.watchPosition(
      position => {
        console.log('Location updated:', position.coords);
        // Location updates are handled by the periodic update function
      },
      error => {
        console.error('Location watch error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update when moved 10 meters
        interval: 30000, // Check every 30 seconds
      }
    );
  }
  
  stopLocationTracking() {
    if (this.locationWatchId) {
      Geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
  }
  
  setupBackgroundTask() {
    BackgroundJob.register({
      jobKey: 'deviceMonitor',
      period: 30000, // Run every 30 seconds
    });
    
    BackgroundJob.on('deviceMonitor', async () => {
      if (this.isRunning) {
        await this.sendLocationUpdate();
        
        // Send heartbeat
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'heartbeat',
            deviceId: this.deviceId,
            timestamp: new Date().toISOString(),
          }));
        }
      }
    });
  }
  
  async start() {
    console.log('Starting device monitor service');
    
    await this.initialize();
    
    this.isRunning = true;
    
    // Connect WebSocket
    this.connectWebSocket();
    
    // Start location tracking
    this.startLocationTracking();
    
    // Setup background tasks
    this.setupBackgroundTask();
    
    // Send initial location update
    await this.sendLocationUpdate();
    
    console.log('Device monitor service started');
  }
  
  stop() {
    console.log('Stopping device monitor service');
    
    this.isRunning = false;
    
    // Stop location tracking
    this.stopLocationTracking();
    
    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // Stop background job
    BackgroundJob.unregister({jobKey: 'deviceMonitor'});
    
    console.log('Device monitor service stopped');
  }
}

// Main App Component
const App = () => {
  const [service] = useState(() => new DeviceMonitorService());
  const [isConnected, setIsConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  
  useEffect(() => {
    const initializeService = async () => {
      try {
        await service.start();
        setIsConnected(true);
        
        const info = await service.getDeviceInfo();
        setDeviceInfo(info);
      } catch (error) {
        console.error('Failed to start service:', error);
        Alert.alert('Error', 'Failed to start device monitoring service');
      }
    };
    
    initializeService();
    
    // Handle app state changes
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App became active');
      } else if (nextAppState === 'background') {
        console.log('App went to background');
      }
    };
    
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      service.stop();
      appStateSubscription?.remove();
    };
  }, [service]);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GPS Device Monitor</Text>
        <View style={[styles.statusIndicator, {backgroundColor: isConnected ? '#4CAF50' : '#F44336'}]} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Device Status</Text>
        
        {deviceInfo && (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>Device ID: {deviceInfo.deviceId.substring(0, 8)}...</Text>
            <Text style={styles.infoText}>Platform: {deviceInfo.platform} {deviceInfo.platformVersion}</Text>
            <Text style={styles.infoText}>Device: {deviceInfo.deviceName}</Text>
            <Text style={styles.infoText}>Battery: {Math.round(deviceInfo.batteryLevel * 100)}%</Text>
          </View>
        )}
        
        <Text style={styles.sectionTitle}>Service Status</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>Connection: {isConnected ? 'Connected' : 'Disconnected'}</Text>
          <Text style={styles.infoText}>Location Tracking: Active</Text>
          <Text style={styles.infoText}>Background Updates: Enabled</Text>
        </View>
        
        <Text style={styles.description}>
          This app runs in the background to provide real-time location tracking and remote administration capabilities.
          {'\n\n'}
          Your device will appear on the admin dashboard and can receive messages and commands from authorized administrators.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
    color: '#333',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#777',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default App;
