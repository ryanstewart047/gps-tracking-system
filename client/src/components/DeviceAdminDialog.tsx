import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  Send,
  Lock,
  Refresh,
  Computer,
  PhoneAndroid,
  GpsFixed,
  Circle
} from '@mui/icons-material';

interface Device {
  deviceId: string;
  type: string;
  name: string;
  status: {
    isOnline: boolean;
    batteryLevel?: number;
    signalStrength?: number;
    lastSeen: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    lastUpdate: string;
    city?: string;
    address?: string;
    method?: string;
    country?: string;
  };
  settings: {
    updateInterval: number;
    alertsEnabled: boolean;
  };
  deviceInfo?: {
    hostname?: string;
    deviceName?: string;
    username?: string;
    platform?: string;
    platformVersion?: string;
    processor?: string;
    architecture?: string;
    pythonVersion?: string;
    startTime?: string;
  };
}

interface DeviceAdminDialogProps {
  open: boolean;
  onClose: () => void;
  device: Device | null;
}

const DeviceAdminDialog: React.FC<DeviceAdminDialogProps> = ({
  open,
  onClose,
  device
}) => {
  const [activeTab, setActiveTab] = useState<'message' | 'control' | 'info'>('message');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!open) {
      // Clear form when dialog closes
      setMessageTitle('');
      setMessageContent('');
      setCommand('');
      setResult(null);
      setActiveTab('message');
    }
  }, [open]);

  const getDeviceIcon = () => {
    switch (device?.type) {
      case 'desktop': return <Computer />;
      case 'mobile': return <PhoneAndroid />;
      case 'gps_tracker': return <GpsFixed />;
      default: return <Computer />;
    }
  };

  const handleSendMessage = async () => {
    if (!device || !messageTitle.trim() || !messageContent.trim()) {
      setResult({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/device-monitor/devices/${device.deviceId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          title: messageTitle,
          message: messageContent
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ type: 'success', message: 'Message sent successfully!' });
        setMessageTitle('');
        setMessageContent('');
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to send message' });
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLockDevice = async () => {
    if (!device) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/device-monitor/devices/${device.deviceId}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ type: 'success', message: 'Lock command sent successfully!' });
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to lock device' });
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendCommand = async () => {
    if (!device || !command.trim()) {
      setResult({ type: 'error', message: 'Please enter a command' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/device-monitor/devices/${device.deviceId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          command: 'execute_command',
          payload: { command, authorized: true }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ type: 'success', message: 'Command sent successfully!' });
        setCommand('');
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to send command' });
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!device) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          {getDeviceIcon()}
          <Box flex={1}>
            <Typography variant="h6">
              Device Administration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {device.deviceInfo?.deviceName || device.deviceInfo?.hostname || device.name || device.deviceId}
            </Typography>
          </Box>
          <Chip
            icon={<Circle />}
            label={device.status.isOnline ? 'Online' : 'Offline'}
            color={device.status.isOnline ? 'success' : 'error'}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {result && (
          <Alert 
            severity={result.type} 
            sx={{ mb: 2 }} 
            onClose={() => setResult(null)}
          >
            {result.message}
          </Alert>
        )}

        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Box display="flex" gap={1}>
            {['message', 'control', 'info'].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'contained' : 'text'}
                size="small"
                onClick={() => setActiveTab(tab as any)}
                sx={{ textTransform: 'capitalize' }}
              >
                {tab}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Message Tab */}
        {activeTab === 'message' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Send Message to Device
            </Typography>
            <TextField
              fullWidth
              label="Message Title"
              value={messageTitle}
              onChange={(e) => setMessageTitle(e.target.value)}
              margin="normal"
              placeholder="Enter message title..."
            />
            <TextField
              fullWidth
              label="Message Content"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              margin="normal"
              multiline
              rows={4}
              placeholder="Enter your message..."
            />
          </Box>
        )}

        {/* Control Tab */}
        {activeTab === 'control' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Device Controls
            </Typography>
            
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<Lock />}
                  onClick={handleLockDevice}
                  disabled={loading || !device.status.isOnline}
                  color="warning"
                >
                  Lock Screen
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  disabled={loading || !device.status.isOnline}
                >
                  Request Status
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Custom Command
              </Typography>
              <TextField
                fullWidth
                label="Command"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter system command..."
                helperText="⚠️ Use with caution. Only authorized commands will be executed."
              />
            </Box>
          </Box>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Device Information
            </Typography>
            
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Device ID
                </Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {device.deviceId}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {device.type}
                </Typography>
              </Box>
              
              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Platform
                </Typography>
                <Typography variant="body1">
                  {device.deviceInfo?.platform || 'Unknown'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Battery Level
                </Typography>
                <Typography variant="body1">
                  {device.status.batteryLevel ? `${device.status.batteryLevel}%` : 'N/A'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1">
                  {device.location?.city ? 
                    `${device.location.city}, ${device.location.country || 'Unknown'}` : 
                    device.location ? 
                      `${device.location.latitude.toFixed(4)}, ${device.location.longitude.toFixed(4)}` :
                      'Unknown location'
                  }
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Seen
                </Typography>
                <Typography variant="body1">
                  {new Date(device.status.lastSeen).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        {activeTab === 'message' && (
          <Button
            onClick={handleSendMessage}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <Send />}
            disabled={loading || !device.status.isOnline || !messageTitle.trim() || !messageContent.trim()}
          >
            Send Message
          </Button>
        )}
        {activeTab === 'control' && command.trim() && (
          <Button
            onClick={handleSendCommand}
            variant="contained"
            disabled={loading || !device.status.isOnline}
            color="warning"
          >
            Execute Command
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DeviceAdminDialog;
