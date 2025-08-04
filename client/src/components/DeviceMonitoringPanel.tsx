import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  IconButton,
  Chip,
  Avatar
} from '@mui/material';
import {
  Computer,
  PhoneAndroid,
  GpsFixed,
  Circle,
  LocationOn,
  Message,
  Lock,
  BatteryFull,
  Battery50,
  Battery20,
  BatteryAlert
} from '@mui/icons-material';
import DeviceAdminDialog from './DeviceAdminDialog';

// Updated interfaces to match backend data
interface DeviceStatus {
  isOnline: boolean;
  batteryLevel?: number;
  signalStrength?: number;
  lastSeen: string;
}

interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  lastUpdate: string;
  city?: string;
  address?: string;
  method?: string;
}

interface Device {
  deviceId: string;
  type: string;
  name: string;
  status: DeviceStatus;
  location?: DeviceLocation;
  settings: {
    updateInterval: number;
    alertsEnabled: boolean;
  };
  deviceInfo?: any;
}

interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  lowBattery: number;
  avgBattery: number;
  totalDevices: number;
  onlineDevices: number;
  desktopDevices: number;
  mobileDevices: number;
  gpsTrackers: number;
}

const DeviceMonitoringPanel: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      // Demo mode for GitHub Pages
      if (process.env.REACT_APP_DEMO_MODE === 'true' || process.env.REACT_APP_API_URL === 'demo') {
        const demoDevices = [
          {
            deviceId: 'demo_desktop_001',
            name: 'Demo MacBook Pro',
            type: 'desktop',
            status: {
              isOnline: true,
              lastSeen: new Date().toISOString(),
              batteryLevel: 87,
              signalStrength: 95
            },
            location: {
              latitude: 37.7749,
              longitude: -122.4194,
              accuracy: 10,
              address: 'San Francisco, CA, USA',
              city: 'San Francisco',
              country: 'USA',
              lastUpdate: new Date().toISOString()
            },
            deviceInfo: {
              platform: 'macOS',
              hostname: 'Demo-MacBook-Pro',
              ipAddress: '192.168.1.100'
            },
            settings: {
              trackingEnabled: true,
              notificationsEnabled: true
            }
          },
          {
            deviceId: 'demo_mobile_001',
            name: 'Demo iPhone',
            type: 'mobile',
            status: {
              isOnline: true,
              lastSeen: new Date(Date.now() - 5000).toISOString(),
              batteryLevel: 72,
              signalStrength: 88
            },
            location: {
              latitude: 40.7128,
              longitude: -74.0060,
              accuracy: 5,
              address: 'New York, NY, USA',
              city: 'New York',
              country: 'USA'
            },
            deviceInfo: {
              platform: 'iOS',
              model: 'iPhone 14 Pro',
              carrier: 'Verizon'
            },
            settings: {
              trackingEnabled: true,
              notificationsEnabled: true
            }
          },
          {
            deviceId: 'demo_gps_001',
            name: 'Demo Vehicle Tracker',
            type: 'gps_tracker',
            status: {
              isOnline: false,
              lastSeen: new Date(Date.now() - 300000).toISOString(),
              batteryLevel: 45,
              signalStrength: 76
            },
            location: {
              latitude: 34.0522,
              longitude: -118.2437,
              accuracy: 15,
              address: 'Los Angeles, CA, USA',
              city: 'Los Angeles',
              country: 'USA'
            },
            vehicleInfo: {
              make: 'Tesla',
              model: 'Model 3',
              plate: 'DEMO123'
            },
            settings: {
              trackingEnabled: true,
              notificationsEnabled: false
            }
          }
        ];
        // @ts-ignore - Demo data for GitHub Pages
        setDevices(demoDevices);
        // @ts-ignore - Demo data for GitHub Pages
        calculateStats(demoDevices);
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/device-monitor/devices`);
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      // Fallback to demo data if API fails
      const demoDevices = [
        {
          deviceId: 'offline_demo',
          name: 'Demo System (Offline)',
          type: 'desktop',
          status: {
            isOnline: false,
            lastSeen: new Date().toISOString(),
            batteryLevel: 0,
            signalStrength: 0
          },
          location: null,
          deviceInfo: {
            platform: 'Demo Mode',
            note: 'Connect to backend for live data'
          },
          settings: {
            updateInterval: 30,
            alertsEnabled: false
          }
        }
      ];
      // @ts-ignore - Demo fallback data
      setDevices(demoDevices);
      // @ts-ignore - Demo fallback data  
      calculateStats(demoDevices);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (deviceList: Device[]) => {
    const stats: DeviceStats = {
      total: deviceList.length,
      online: deviceList.filter(d => d.status.isOnline).length,
      offline: deviceList.filter(d => !d.status.isOnline).length,
      lowBattery: deviceList.filter(d => (d.status.batteryLevel || 100) < 20).length,
      avgBattery: deviceList.reduce((sum, d) => sum + (d.status.batteryLevel || 100), 0) / (deviceList.length || 1),
      totalDevices: deviceList.length,
      onlineDevices: deviceList.filter(d => d.status.isOnline).length,
      desktopDevices: deviceList.filter(d => d.type === 'desktop').length,
      mobileDevices: deviceList.filter(d => d.type === 'mobile').length,
      gpsTrackers: deviceList.filter(d => d.type === 'gps_tracker').length
    };
    setStats(stats);
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getDeviceIcon = (device: Device) => {
    const iconProps = { 
      sx: { 
        color: device.status.isOnline ? 'success.main' : 'error.main',
        fontSize: 40 
      } 
    };
    
    switch (device.type) {
      case 'desktop':
        return <Computer {...iconProps} />;
      case 'mobile':
        return <PhoneAndroid {...iconProps} />;
      case 'gps_tracker':
        return <GpsFixed {...iconProps} />;
      default:
        return <Computer {...iconProps} />;
    }
  };

  const getBatteryIcon = (batteryLevel: number) => {
    if (batteryLevel > 75) return <BatteryFull color="success" />;
    if (batteryLevel > 50) return <Battery50 color="warning" />;
    if (batteryLevel > 20) return <Battery20 color="warning" />;
    return <BatteryAlert color="error" />;
  };

  const getDeviceDisplayName = (device: Device) => {
    return device.deviceInfo?.hostname || 
           device.deviceInfo?.deviceName || 
           device.name ||
           device.deviceId;
  };

  const getTimeSinceLastSeen = (lastSeenStr: string) => {
    const lastSeen = new Date(lastSeenStr);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleDeviceClick = (device: Device) => {
    // Device detail functionality
    console.log('Device clicked:', device.deviceId);
    setSelectedDevice(device);
  };

  const handleSendQuickMessage = async (device: Device, title: string, message: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/device-monitor/devices/${device.deviceId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message })
      });
      
      if (response.ok) {
        console.log('Message sent successfully');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading devices...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Device Monitoring Dashboard
      </Typography>

      {/* Stats Cards */}
      {stats && (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {stats.totalDevices}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Devices
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {stats.onlineDevices}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Online
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">
              {stats.desktopDevices}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Desktops
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">
              {stats.mobileDevices}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mobile
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">
              {stats.gpsTrackers}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              GPS Trackers
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">
              {Math.round(stats.avgBattery || 0)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Battery
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Device List */}
      <Typography variant="h5" gutterBottom>
        Active Devices ({devices.length})
      </Typography>

      {devices.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No devices found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Install the device agent on computers and mobile devices to start monitoring.
          </Typography>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {devices.map((device) => (
            <Card key={device.deviceId} sx={{ cursor: 'pointer' }} onClick={() => handleDeviceClick(device)}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'background.paper' }}>
                      {getDeviceIcon(device)}
                    </Avatar>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6">
                          {getDeviceDisplayName(device)}
                        </Typography>
                        <Chip
                          icon={<Circle />}
                          label={device.status.isOnline ? 'Online' : 'Offline'}
                          color={device.status.isOnline ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {device.type} • ID: {device.deviceId}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                        {device.status.batteryLevel && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {getBatteryIcon(device.status.batteryLevel)}
                            <Typography variant="caption">
                              {device.status.batteryLevel}%
                            </Typography>
                          </Box>
                        )}
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="caption">
                            {device.location?.city || device.location?.address || 'Unknown location'}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {getTimeSinceLastSeen(device.status.lastSeen)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendQuickMessage(device, 'Admin Message', 'Hello from admin dashboard!');
                      }}
                      disabled={!device.status.isOnline}
                    >
                      <Message />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle lock device
                      }}
                      disabled={!device.status.isOnline}
                    >
                      <Lock />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Device Admin Dialog */}
      <DeviceAdminDialog
        open={selectedDevice !== null}
        onClose={() => {
          setSelectedDevice(null);
        }}
        device={selectedDevice}
      />
    </Box>
  );
};

export default DeviceMonitoringPanel;
