import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Typography,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  LocationOn,
  WifiOff,
  Battery3Bar,
  SignalCellular4Bar,
  Schedule
} from '@mui/icons-material';

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

interface DeviceListProps {
  devices: Device[];
  onDeviceClick?: (device: Device) => void;
}

const DeviceList: React.FC<DeviceListProps> = ({ devices, onDeviceClick }) => {
  const formatLastUpdate = (timestamp: string) => {
    const now = new Date();
    const update = new Date(timestamp);
    const diffMs = now.getTime() - update.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'success';
    if (level > 20) return 'warning';
    return 'error';
  };

  const getSignalColor = (level: number) => {
    if (level > 70) return 'success';
    if (level > 30) return 'warning';
    return 'error';
  };

  if (devices.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
        <LocationOn sx={{ fontSize: 48, opacity: 0.5 }} />
        <Typography variant="body2">
          No devices available
        </Typography>
        <Typography variant="caption">
          Add GPS tracking devices to monitor
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <List disablePadding>
        {devices.map((device, index) => (
          <React.Fragment key={device.id}>
            <ListItem
              onClick={() => onDeviceClick?.(device)}
              sx={{
                flexDirection: 'column',
                alignItems: 'stretch',
                py: 2,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                cursor: 'pointer'
              }}
            >
              {/* Device Name and Status */}
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {device.isOnline ? (
                    <LocationOn color="success" />
                  ) : (
                    <WifiOff color="error" />
                  )}
                </ListItemIcon>
                
                <ListItemText
                  primary={device.name}
                  secondary={device.id}
                  primaryTypographyProps={{ fontWeight: 'medium', fontSize: '0.9rem' }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  sx={{ flex: 1 }}
                />
                
                <Chip
                  size="small"
                  label={device.isOnline ? 'Online' : 'Offline'}
                  color={device.isOnline ? 'success' : 'error'}
                  sx={{ fontSize: '0.7rem' }}
                />
              </Box>

              {/* Battery Level */}
              <Box sx={{ width: '100%', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Battery3Bar 
                    sx={{ fontSize: 16, mr: 1, color: `${getBatteryColor(device.battery)}.main` }} 
                  />
                  <Typography variant="caption" sx={{ flex: 1 }}>
                    Battery: {Math.round(device.battery)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {device.battery > 20 ? 'Good' : 'Low'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={device.battery}
                  color={getBatteryColor(device.battery) as any}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>

              {/* Signal Strength */}
              <Box sx={{ width: '100%', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <SignalCellular4Bar 
                    sx={{ fontSize: 16, mr: 1, color: `${getSignalColor(device.signal)}.main` }} 
                  />
                  <Typography variant="caption" sx={{ flex: 1 }}>
                    Signal: {Math.round(device.signal)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {device.signal > 70 ? 'Strong' : device.signal > 30 ? 'Weak' : 'Poor'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={device.signal}
                  color={getSignalColor(device.signal) as any}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>

              {/* Location */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                  📍 {device.latitude.toFixed(4)}, {device.longitude.toFixed(4)}
                </Typography>
              </Box>

              {/* Last Update */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule sx={{ fontSize: 14, mr: 1, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Last update: {formatLastUpdate(device.lastUpdate)}
                </Typography>
              </Box>
            </ListItem>
            
            {index < devices.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default DeviceList;
