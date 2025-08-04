import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Card,
  CardContent,
  IconButton,
  Badge,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  LocationOn,
  Notifications,
  Settings,
  Dashboard,
  DevicesOther,
  WifiOff
} from '@mui/icons-material';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import MapView from './components/MapView';
import DeviceList from './components/DeviceList';
import AlertsPanel from './components/AlertsPanel';
import SettingsDialog from './components/SettingsDialog';
import DeviceDetailDialog from './components/DeviceDetailDialog';
import DeviceMonitoringPanel from './components/DeviceMonitoringPanel';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

interface Device {
  id: string;
  name: string;
  isOnline: boolean;
  battery: number;
  signal: number;
  latitude: number;
  longitude: number;
  lastUpdate: string;
  speed?: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
}

interface Alert {
  id: number;
  type: 'battery' | 'info' | 'offline' | 'geofence' | 'emergency';
  deviceId: string;
  message: string;
  timestamp: string;
  severity: 'warning' | 'error' | 'info';
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceDetailOpen, setDeviceDetailOpen] = useState(false);
  
  const [devices, setDevices] = useState<Device[]>([
    {
      id: 'GPS_001',
      name: 'Vehicle Tracker 1',
      isOnline: true,
      battery: 85,
      signal: 92,
      latitude: 37.7749,
      longitude: -122.4194,
      lastUpdate: new Date().toISOString(),
      speed: 45.2,
      heading: 125,
      altitude: 15.5,
      accuracy: 3.2
    },
    {
      id: 'GPS_002', 
      name: 'Fleet Vehicle 2',
      isOnline: false,
      battery: 23,
      signal: 67,
      latitude: 37.7849,
      longitude: -122.4094,
      lastUpdate: new Date(Date.now() - 300000).toISOString(),
      speed: 0,
      heading: 0,
      altitude: 12.1,
      accuracy: 8.5
    }
  ]);
  
  const [alerts] = useState<Alert[]>([
    {
      id: 1,
      type: 'battery',
      deviceId: 'GPS_002',
      message: 'Low battery warning (23%)',
      timestamp: new Date().toISOString(),
      severity: 'warning'
    }
  ]);

  const currentTheme = isDarkMode ? darkTheme : theme;

  // Mock data updates with more realistic GPS movement
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prev => prev.map(device => {
        if (!device.isOnline) return device;
        
        // Simulate realistic GPS movement
        const speedVariation = (Math.random() - 0.5) * 10; // ±5 km/h
        const newSpeed = Math.max(0, (device.speed || 0) + speedVariation);
        
        // Calculate new position based on speed and heading
        const speedMs = newSpeed / 3.6; // Convert km/h to m/s
        const distanceM = speedMs * 5; // Distance in 5 seconds
        const earthRadius = 6371000; // Earth radius in meters
        
        const lat1 = device.latitude * Math.PI / 180;
        const lng1 = device.longitude * Math.PI / 180;
        const bearing = (device.heading || 0) * Math.PI / 180;
        
        const lat2 = Math.asin(
          Math.sin(lat1) * Math.cos(distanceM / earthRadius) +
          Math.cos(lat1) * Math.sin(distanceM / earthRadius) * Math.cos(bearing)
        );
        
        const lng2 = lng1 + Math.atan2(
          Math.sin(bearing) * Math.sin(distanceM / earthRadius) * Math.cos(lat1),
          Math.cos(distanceM / earthRadius) - Math.sin(lat1) * Math.sin(lat2)
        );

        return {
          ...device,
          latitude: lat2 * 180 / Math.PI,
          longitude: lng2 * 180 / Math.PI,
          battery: Math.max(0, device.battery - Math.random() * 0.1),
          signal: Math.min(100, Math.max(0, device.signal + (Math.random() - 0.5) * 5)),
          speed: newSpeed,
          heading: device.heading ? (device.heading + (Math.random() - 0.5) * 20) % 360 : Math.random() * 360,
          lastUpdate: new Date().toISOString()
        };
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
    setDeviceDetailOpen(true);
  };

  const handleCenterMap = (device: Device) => {
    // This would center the map on the device - implement in MapView
    console.log('Centering map on device:', device.id);
    setDeviceDetailOpen(false);
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <AuthProvider>
        <WebSocketProvider>
          <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" elevation={1}>
              <Toolbar>
                <LocationOn sx={{ mr: 2 }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  GPS Tracking System
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isDarkMode}
                        onChange={(e) => setIsDarkMode(e.target.checked)}
                        color="secondary"
                      />
                    }
                    label="Dark Mode"
                  />
                  
                  <IconButton color="inherit">
                    <Badge badgeContent={alerts.length} color="secondary">
                      <Notifications />
                    </Badge>
                  </IconButton>
                  
                  <IconButton color="inherit" onClick={() => setSettingsOpen(true)}>
                    <Settings />
                  </IconButton>
                </Box>
              </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
              {/* Main Dashboard */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* Stats Cards */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Card sx={{ minWidth: 200, flex: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Dashboard color="primary" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="h4" component="div">
                            {devices.length}
                          </Typography>
                          <Typography color="text.secondary">
                            Total Devices
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  
                  <Card sx={{ minWidth: 200, flex: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DevicesOther color="success" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="h4" component="div" color="success.main">
                            {devices.filter(d => d.isOnline).length}
                          </Typography>
                          <Typography color="text.secondary">
                            Online Devices
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  
                  <Card sx={{ minWidth: 200, flex: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WifiOff color="error" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="h4" component="div" color="error.main">
                            {devices.filter(d => !d.isOnline).length}
                          </Typography>
                          <Typography color="text.secondary">
                            Offline Devices
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  
                  <Card sx={{ minWidth: 200, flex: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Notifications color="warning" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="h4" component="div" color="warning.main">
                            {alerts.length}
                          </Typography>
                          <Typography color="text.secondary">
                            Active Alerts
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                {/* Map and Device List */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Card sx={{ flex: 2, minWidth: 400, height: 500 }}>
                    <CardContent sx={{ height: '100%', p: 0 }}>
                      <MapView devices={devices} />
                    </CardContent>
                  </Card>
                  
                  <Card sx={{ flex: 1, minWidth: 300, height: 500 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Device Status
                      </Typography>
                      <DeviceList devices={devices} onDeviceClick={handleDeviceClick} />
                    </CardContent>
                  </Card>
                </Box>

                {/* Device Monitoring Panel */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Device Management
                    </Typography>
                    <DeviceMonitoringPanel />
                  </CardContent>
                </Card>

                {/* Alerts Panel */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Alerts
                    </Typography>
                    <AlertsPanel alerts={alerts} />
                  </CardContent>
                </Card>
              </Box>
            </Container>
          </Box>

          {/* Settings Dialog */}
          <SettingsDialog 
            open={settingsOpen} 
            onClose={() => setSettingsOpen(false)} 
          />

          {/* Device Detail Dialog */}
          <DeviceDetailDialog
            device={selectedDevice}
            open={deviceDetailOpen}
            onClose={() => setDeviceDetailOpen(false)}
            onCenterMap={handleCenterMap}
          />
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
