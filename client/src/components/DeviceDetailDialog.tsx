import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Tooltip
} from '@mui/material';
import {
  LocationOn,
  Battery1Bar,
  Battery2Bar,
  Battery3Bar,
  BatteryFull,
  SignalCellular4Bar,
  SignalCellular3Bar,
  SignalCellular2Bar,
  SignalCellular1Bar,
  SignalCellularOff,
  AccessTime,
  Speed,
  Navigation,
  Close,
  Refresh,
  CenterFocusStrong
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

interface DeviceDetailDialogProps {
  device: Device | null;
  open: boolean;
  onClose: () => void;
  onCenterMap?: (device: Device) => void;
}

const DeviceDetailDialog: React.FC<DeviceDetailDialogProps> = ({ 
  device, 
  open, 
  onClose,
  onCenterMap 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!device) return null;

  const getBatteryIcon = (level: number) => {
    if (level > 75) return <BatteryFull color="success" />;
    if (level > 50) return <Battery3Bar color="warning" />;
    if (level > 25) return <Battery2Bar color="warning" />;
    return <Battery1Bar color="error" />;
  };

  const getSignalIcon = (strength: number) => {
    if (strength > 75) return <SignalCellular4Bar color="success" />;
    if (strength > 50) return <SignalCellular3Bar color="warning" />;
    if (strength > 25) return <SignalCellular2Bar color="warning" />;
    if (strength > 0) return <SignalCellular1Bar color="error" />;
    return <SignalCellularOff color="error" />;
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'success';
    if (level > 25) return 'warning';
    return 'error';
  };

  const getSignalColor = (strength: number) => {
    if (strength > 50) return 'success';
    if (strength > 25) return 'warning';
    return 'error';
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleCenterMap = () => {
    if (onCenterMap) {
      onCenterMap(device);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationOn color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">{device.name}</Typography>
            <Chip 
              label={device.isOnline ? 'Online' : 'Offline'} 
              color={device.isOnline ? 'success' : 'error'}
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>
          <Box>
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} disabled={isRefreshing}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Center on Map">
              <IconButton onClick={handleCenterMap}>
                <CenterFocusStrong />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Device Status */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Device Status</Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getBatteryIcon(device.battery)}
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    Battery: {device.battery.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={device.battery}
                  color={getBatteryColor(device.battery) as any}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getSignalIcon(device.signal)}
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    Signal: {device.signal.toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={device.signal}
                  color={getSignalColor(device.signal) as any}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            </Box>
          </Paper>

          {/* Location Information */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Location Information</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="body2" color="text.secondary">Latitude</Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {device.latitude.toFixed(6)}°
                </Typography>
              </Box>
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="body2" color="text.secondary">Longitude</Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {device.longitude.toFixed(6)}°
                </Typography>
              </Box>
              
              {device.altitude && (
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="body2" color="text.secondary">Altitude</Typography>
                  <Typography variant="body1">
                    {device.altitude.toFixed(1)} m
                  </Typography>
                </Box>
              )}
              
              {device.accuracy && (
                <Box sx={{ minWidth: 150 }}>
                  <Typography variant="body2" color="text.secondary">Accuracy</Typography>
                  <Typography variant="body1">
                    ±{device.accuracy.toFixed(1)} m
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Movement Information */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Movement Information</Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Speed sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Speed</Typography>
                  <Typography variant="body1">
                    {device.speed ? `${device.speed.toFixed(1)} km/h` : 'Stationary'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Navigation sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Heading</Typography>
                  <Typography variant="body1">
                    {device.heading ? `${device.heading.toFixed(0)}°` : 'Unknown'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Last Update */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">Last Update</Typography>
                <Typography variant="body1">
                  {formatLastUpdate(device.lastUpdate)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(device.lastUpdate).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Device Information */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Device Information</Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="body2" color="text.secondary">Device ID</Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {device.id}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip 
                  label={device.isOnline ? 'Connected' : 'Disconnected'} 
                  color={device.isOnline ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Box>
          </Paper>

          {isRefreshing && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
              <LinearProgress sx={{ width: '100%' }} />
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleCenterMap} variant="contained" startIcon={<CenterFocusStrong />}>
          Show on Map
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceDetailDialog;
